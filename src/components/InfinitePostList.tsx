import InfiniteScroll from "react-infinite-scroll-component"
import { ProfileImage } from "./ProfileImage";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { VscHeart, VscHeartFilled } from "react-icons/vsc"
import { IconHoverEffect } from "./IconHoverEffect";
import { api } from "~/utils/api";

import PostCard from "./PostCard";
import { Post } from "./Types";

// Import necessary types
import { InfinitePostListProps } from "./Types";
  

export function InfinitePostList({ posts, isError, isLoading, fetchNewPosts, hasMore = false }: InfinitePostListProps ) {
    if (isLoading) return <h1 className="text-center mt-28">- Loading - </h1>
    if (isError) return <h1>Error...</h1>

    if (posts == null || posts.length === 0) {
        return (
            <h2 className="my-4 text-center text-2xl text-gray-500">No posts available</h2>
        );
    }

    return (
        <ul>
            <InfiniteScroll
                dataLength={posts.length}
                next={fetchNewPosts}
                hasMore={hasMore}
                loader="loading...">
                    {posts.map((post) => {
                        return <PostCard key={post.id} {...post} />;
                    })}

            </InfiniteScroll>
        </ul>
    )
}
