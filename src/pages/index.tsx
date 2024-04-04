import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { NewPostForm } from "~/components/NewPostForm";
import { InfinitePostList } from "~/components/InfinitePostList";


import { api } from "~/utils/api";

const tabs = ["Recent", "Following"] as const;

export default function Home() {
  // const hello = api.post.hello.useQuery({ text: "from tRPC" });

  // Get each tab based on the index of the tabs array
  const [selectedTab, setSelectedTab] = useState<(typeof tabs)[number]>("Recent");
  const session = useSession();

  return (
    <>
    <header className="sticky top-0 z-10 border-b bg-white pt-2">
      <h1 className="mb-2 px-4 text-lg font-bold text-center">Home</h1>
      {session.status === "authenticated" && (
        <div className="flex">
          {tabs.map(tab => {
            return <button 
              key={tab} 
              className={`flex-grow w-lg p-2 hover:bg-gray-200 focus-visible:bg-gray-200 
              ${tab === selectedTab 
              ? "border-b-4 border-orange-2 font-bold" 
              : ""}`} 
              onClick={() => {setSelectedTab(tab)}}>
                {tab}
              </button>
          })}
        </div>
      )}
    </header>
    <NewPostForm />
    {selectedTab === "Recent" ? <RecentPosts /> : <FollowingPosts />}
    </>
  );
}

function RecentPosts() {
  // Set to all recent posts
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


function FollowingPosts() {
  // Set to all recent posts of only the people you are following!
  const posts = api.post.infiniteFeed.useInfiniteQuery(
    { onlyFollowing: true }, 
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