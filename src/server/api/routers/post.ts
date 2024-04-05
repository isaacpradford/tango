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
  .input(z.object({ content: z.string(), tags: z.array(z.string()).optional() }))
  .mutation(async ({ input: { content, tags }, ctx }) => {
      const post = await ctx.db.post.create({
          data: {
              content,
              userId: ctx.session.user.id,
          },
      });

      // Associate tags with the post
      if (tags && tags.length > 0) {
          // Map to store tag ids
          const tagIds: string[] = [];

          // Find or create the tags and associate them with the post
          for (const tagName of tags) {
              // Try to find the tag
              let tag = await ctx.db.tag.findUnique({
                  where: { name: tagName },
              });

              // If the tag doesn't exist, create it
              if (!tag) {
                  tag = await ctx.db.tag.create({
                      data: {
                          name: tagName,
                      },
                  });
              }

              // Store the tag id
              tagIds.push(tag.id);
          }

          // Associate tags with the post
          await ctx.db.post.update({
              where: { id: post.id },
              data: {
                  tags: {
                      connect: tagIds.map((id) => ({ id })),
                  },
              },
          });
      }

      // Whenever a user makes a post, revalidate their page
      void ctx.revalidateSSG?.(`/profiles/${ctx.session.user.id}`);

      return post;
  }),

  deletePost: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: {id}, ctx }) => {
      await ctx.db.post.delete({ where: {id} })
      return { success: true };
    }),

  // Toggle a like procedure
  toggleLike: protectedProcedure
    .input( z.object({ id: z.string()}))
    .mutation(async ({ input: {id}, ctx}) => {
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
  }),

  // Toggle repost procedure
  toggleRepost: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id }, ctx}) => {
      const data = { postId: id, userId: ctx.session.user.id };
      
      // Check if user already reposted current post
      const existingRepost = await ctx.db.repost.findUnique({
        where: {userId_postId: data }
      })
      
      const originalPost = await ctx.db.post.findUnique({
        where: { id },
        include: { user: true }
      })

      if (existingRepost == null && originalPost) {
        // Modify the content to include the information about the original post user
        const repostedContent = `Reposted from ${originalPost.user.name}:\n \n${originalPost.content}`;

        // Create the reposted post
        const repostedPost = await ctx.db.post.create({
            data: {
                content: repostedContent,
                userId: ctx.session.user.id,
                // Optionally, copy any other fields you want from the original post
            }
        });

        // Create a repost record
        await ctx.db.repost.create({ data: { ...data, createdAt: new Date() } });
        return { addedRepost: true, repostedPost };
    } else {
        // Delete the existing repost if it already exists
        await ctx.db.repost.delete({ where: { userId_postId: data } });
        return { addedRepost: false }
    }
  }),
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
          _count: {select: {likes: true, reposts: true }},
          likes: currentUserId == null ? false : { where: { userId: currentUserId }},
          reposts: {
            select: {
              id: true,
              user: {
                select: { name: true, displayName: true }
              }
            }
          },
          user: {
            select: {name: true, id: true, displayName: true, image: true }
          },
          tags: true,
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
          repostCount: post._count.reposts,
          user: post.user,
          tags: post.tags,
          
          // Check if post has already been liked by current user so they can't like it twice
          likedByMe: post.likes?.length > 0,
          repostedByMe: post.reposts?.length > 0,
        }
      }), nextCursor };
  }