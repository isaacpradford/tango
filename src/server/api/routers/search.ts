import next from "next";
import { z } from "zod";

import { Prisma } from "@prisma/client";

import {
    createTRPCContext,
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
  } from "~/server/api/trpc";


  export const searchRouter = createTRPCRouter({ 
    // Search for profile 
    searchUsers: publicProcedure
        .input(z.object({ query: z.string() }))
        .query(async ({ input: { query }, ctx }) => {

            const users = await ctx.db.user.findMany({
                where: {
                    OR: [
                        {name: { contains: query } },
                    ]
                }
            })

            return users;
        }),


        searchPosts: publicProcedure
            .input(z.object({ query: z.string() }))
            .query(async ({ input: { query }, ctx}) => {
                const currentUserId = ctx.session?.user.id;
                
                const data = await ctx.db.post.findMany({
                    where: {
                        OR: [
                            { content: { contains: query }},
                        ]
                    },
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        _count: { select: { likes: true }},
                        likes: currentUserId == null ? false : { where: { userId: currentUserId }},
                        user: {
                            select: { name: true, id: true, image: true }
                        },
                    }
                });

                const postsWithLikedByMe = data.map(post => ({
                    ...post,
                    likedByMe: post.likes?.length > 0
                  }));
              
                return postsWithLikedByMe;
        }),
  });