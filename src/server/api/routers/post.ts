import next from "next";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";


export const postRouter = createTRPCRouter({
  // This is using a unique type of pagination using cursors. It is filtering by when the object is created and the userID,
  // so that it can handle when two posts created at the exact same millisecond, which could cause problems
  infiniteFeed: publicProcedure.input(
      z.object({ 
        limit: z.number().optional(), 
        cursor: z.object({ id: z.string(), createdAt: z.date() }).optional(),
      })
    ).query( async ({ input: { limit = 10, cursor }, ctx }) => {
      // A cursor is a unique identifier telling where the findMany wants to start at
      // By doing + 1, it will take the last post ID and give you the last 11 most recent tweets
      // It will return ten the tweets, and then look at the 11th one's createdAt_Id, 
      // and every time you requery the data, query from there next

      const currentUserId = ctx.session?.user.id;

      const data = await ctx.db.post.findMany({
        take: limit + 1,
        cursor: cursor ? { createdAt_id: cursor } : undefined,
        orderBy: [{ createdAt: "desc"}, { id: "desc" }],

        //
        select: {
          id: true,
          content: true,
          createdAt: true,
          _count: {select: {likes: true }},
          likes: currentUserId == null ? false : { where: { userId: currentUserId }},
          user: {
            select: {name: true, id: true, image: true }
          },
        },
      });

      let nextCursor: typeof cursor | undefined;

      if (data.length > limit)  {
        const nextItem = data.pop();

        if (nextItem != null) {
          nextCursor = { id: nextItem.id, createdAt: nextItem.createdAt }
        }
      }

      return { posts: data.map(post => {
        return {
          id: post.id,
          content: post.content,
          createdAt: post.createdAt,
          likeCount: post._count.likes,
          user: post.user,
          
          // Check if post has already been liked by current user so they can't like it twice
          likedByMe: post.likes?.length > 0,
        }
      }), nextCursor };
    }),
  
  create: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({input: { content }, ctx }) => {
      console.log(content);
      const post = await ctx.db.post.create({
        data: { content, userId: ctx.session.user.id },
      });

      return post;
    }),

  toggleLike: protectedProcedure.input( z.object({ id: z.string()})).mutation(async ({ input: {id}, ctx}) => {
    const data = { postId: id, userId: ctx.session.user.id };

    const existingLike = await ctx.db.like.findUnique({
      where: { userId_postId: data }
    })

    if (existingLike == null) {
      await ctx.db.like.create({ data })
      return { addedLike: true } 
    } else {
      await ctx.db.like.delete({where: { userId_postId: data }})
      return { addedLike: false}
    }
  })
});
