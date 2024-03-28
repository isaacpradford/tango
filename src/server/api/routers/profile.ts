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


export const profileRouter = createTRPCRouter({

  // Get info of a specific profile
  getById: publicProcedure.input(z.object({ id: z.string()}))
    .query(async ({ 
      input: { id }, ctx }) => {
        const currentUserId = ctx.session?.user.id;

        const profile = await ctx.db.user.findUnique({ 
              where: { id }, 
              select: 
              { name: true, 
                image: true, 
                _count: { select: { followers: true, follows: true, posts: true, }},
                followers: 
                  currentUserId == null 
                  ? undefined 
                  : { where: {id: currentUserId } }
              }})

        if (profile == null) return;

        return {
            name: profile.name,
            image: profile.image,
            followersCount: profile._count.followers,
            followsCount: profile._count.follows,
            postsCount: profile._count.posts,
            isFollowing: profile.followers.length > 0,
        };
    }),

  // Toggle a follow on a profile
  toggleFollow: protectedProcedure
    .input(z.object({ userId: z.string()}))
    .mutation(async ({ input: { userId }, ctx }) => {
      const currentUserId = ctx.session.user.id;

      // Get if user is already following
      const existingFollow = await ctx.db.user.findFirst({
        where: { id: userId, followers: { some: {id: currentUserId } } },
      })

      // If you are not following the user, add a follow, else unfollow user
      let addedFollow;
      if (existingFollow == null) {
        await ctx.db.user.update({
          where: { id: userId },
          data: { followers: { connect: { id: currentUserId } } }
        });
        addedFollow = true;
      } else {
        await ctx.db.user.update({
          where: { id: userId },
          data: { followers: { disconnect: { id: currentUserId } } }
        });
        addedFollow = false;
      }

      // Revalidate page of person being followed and the person following
      void ctx.revalidateSSG?.(`/profiles/${userId}`);
      void ctx.revalidateSSG?.(`/profiles/${currentUserId}`);


      return { addedFollow }
    })
});
