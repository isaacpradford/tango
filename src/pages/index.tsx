import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { NewPostForm } from "~/components/NewPostForm";
import { InfinitePostList } from "~/components/InfinitePostList";

import { api } from "~/utils/api";

export default function Home() {
  // const hello = api.post.hello.useQuery({ text: "from tRPC" });

  return (
    <>
    <header className="sticky top-0 z-10 border-b bg-white pt-2">
      <h1 className="mb-2 px-4 text-lg font-bold">Home</h1>
    </header>
    <NewPostForm />
    <RecentPosts />
    </>
  );
}

function RecentPosts() {
  const posts = api.post.infiniteFeed.useInfiniteQuery(
    {}, 
    // Updates next cursor
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );

  return( 
      <InfinitePostList 
        posts = {posts.data?.pages.flatMap((page) => page.posts)}
        isError = { posts.isError }
        isLoading = {posts.isLoading }
        hasMore = {posts.hasNextPage }
        fetchNewPosts = {posts.fetchNextPage }  
        />
    );
}
