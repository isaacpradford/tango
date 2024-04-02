import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "~/utils/api";
import { SearchBar } from "~/components/SearchBar";
import { useState } from "react";

import { useSession } from "next-auth/react";
import UserCard from "~/components/UserCard";
import { InfinitePostList } from "~/components/InfinitePostList";

// Import types
import { Post, User } from "~/components/Types";
import PostCard from "~/components/PostCard";

const tabs = ["Users", "Posts"] as const;

const SearchPage = () => {
  const [selectedTab, setSelectedTab] = useState<(typeof tabs)[number]>("Users");
  const session = useSession();
  
  const search = useSearchParams();
  const searchQuery = search ? search.get('q') : null;
  const encodedQuery = encodeURI(searchQuery || "");

  // Conditionally switch based on if the user has selected post or data
  const { data: searchData } = selectedTab === "Users"
    ? api.search.searchUsers.useQuery({ query: encodedQuery })
    : api.search.searchPosts.useQuery({ query: encodedQuery });

    console.log(searchData);

  return (
    <div>
        <div className="mx-auto">
            <SearchBar />
        </div>

        {session.status === "authenticated" && (
            <div className="flex">
                {tabs.map(tab => (
                <button 
                    key={tab} 
                    className={`border-b flex-grow p-2 bg-zinc-100 hover:bg-gray-200 focus-visible:bg-gray-200 
                    ${tab === selectedTab 
                    ? "border-b-4 border-orange-2 font-bold" 
                    : ""}`} 
                    onClick={() => {setSelectedTab(tab)}}
                >
                    {tab}
                </button>
                ))}
            </div>
        )}

        <h1 className="text-center p-5 border-b font-bold">Search Results</h1>
            <ul>
                {selectedTab === "Users" && searchData && searchData.length >= 1 ? (
                    searchData.map((user: User) => (
                    <div key={user.id}>
                        <UserCard id={user.id} name={user.name} image={user.image} biography={user.biography} />
                    </div>
                    ))
                ) : selectedTab === "Posts" && searchData && searchData.length >= 1 ? (
                    <div>
                        {searchData.map((post: any) => (
                            <div key={post.id}>
                                <PostCard
                                    id={ post.id }
                                    user={ post.user } 
                                    content={ post.content }
                                    createdAt={ new Date(post.createdAt) }
                                    likeCount={ post._count.likes } 
                                    likedByMe={ post.likedByMe }
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="mt-5 ml-5">No {selectedTab.toLowerCase()} found.</p>
                )}
            </ul>
    </div>
  );
};


export default SearchPage;