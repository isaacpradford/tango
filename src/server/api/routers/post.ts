import next from "next";
import { z } from "zod";

import { Prisma } from "@prisma/client";

import {
  createTRPCContext,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { inferAsyncReturnType } from "@trpc/server";


export const postRouter = createTRPCRouter({
  // This is using a unique type of pagination using cursors. It is filtering by when the object is created and the userID,
  // so that it can handle when two posts created at the exact same millisecond, which could cause problems
  
  // Home page infinite feed
  infiniteFeed: publicProcedure
    .input(
      z.object({
        onlyFollowing: z.boolean().optional(),
        limit: z.number().optional(), 
        cursor: z.object({ id: z.string(), createdAt: z.date() }).optional(),
      })
    ).query( async ({ input: { limit = 10, onlyFollowing = false, cursor }, ctx }) => {
      const currentUserId = ctx.session?.user.id;

      // Return posts of people you are following
      return await getInfinitePosts({ 
        limit, 
        ctx, 
        cursor, 
        whereClause: 
          currentUserId == null || !onlyFollowing ? undefined : {
            user: {
              followers: { some: {id: currentUserId } },
            }
          }})
    }),

  // Profile page infinite feed to get users posts
  profileFeed: publicProcedure
  .input(
    z.object({ 
      userId: z.string(),
      limit: z.number().optional(), 
      cursor: z.object({ id: z.string(), createdAt: z.date() }).optional(),
    })
  )
  .query(async ({ input: { limit = 10, userId, cursor }, ctx }) => {

    // Return posts of the person who's profile you are at
    return await getInfinitePosts({ 
      limit, 
      ctx, 
      cursor, 
      whereClause: { userId }
    })
  }),


  // Procedure to create a post
  create: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({input: { content }, ctx }) => {
      const post = await ctx.db.post.create({
        data: { content, userId: ctx.session.user.id },
      });

      // Whenever a user makes a post, revalidate their page 
      void ctx.revalidateSSG?.(`/profiles/${ctx.session.user.id}`)

      return post;
    }),

  // Toggle a like procedure
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

async function getInfinitePosts({
  whereClause, 
  ctx, 
  limit, 
  cursor
} : {
  whereClause?: Prisma.PostWhereInput;
  limit: number;
  cursor: { id: string; createdAt: Date; } | undefined;
  ctx: inferAsyncReturnType<typeof createTRPCContext>;
}) {

  // A cursor is a unique identifier telling where the findMany wants to start at
      // By doing + 1, it will take the last post ID and give you the last 11 most recent posts
      // It will return ten of the posts, and then look at the 11th one's createdAt_Id, 
      // and every time you requery the data, query from there next

      const currentUserId = ctx.session?.user.id;

      const data = await ctx.db.post.findMany({
        take: limit + 1,
        cursor: cursor ? { createdAt_id: cursor } : undefined,
        orderBy: [{ createdAt: "desc"}, { id: "desc" }],
        where: whereClause,

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
  }