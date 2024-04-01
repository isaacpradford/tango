import InfiniteScroll from "react-infinite-scroll-component"
import { ProfileImage } from "./ProfileImage";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { VscHeart, VscHeartFilled } from "react-icons/vsc"
import { IconHoverEffect } from "./IconHoverEffect";
import { api } from "~/utils/api";

type post = {
    id: string;
    content: string;
    createdAt: Date;
    likeCount: number;
    likedByMe: boolean;
    user: { id: string; image: string | null; name: string | null };
}

type InfinitePostListProps = {
    isLoading: boolean;
    isError: boolean;
    hasMore: boolean | undefined;
    fetchNewPosts: () => Promise<unknown>;
    posts?: post[];
}

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

function PostCard({id, user, content, createdAt, likeCount, likedByMe} : post) {
    const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
        dateStyle:"short"
    })

    const trpcUtils = api.useUtils();
    const toggleLike = api.post.toggleLike.useMutation({
      onSuccess: ({ addedLike }) => {
        const updateData: Parameters<
          typeof trpcUtils.post.infiniteFeed.setInfiniteData
        >[1] = (oldData) => {
          if (oldData == null) return;
  
          const countModifier = addedLike ? 1 : -1;
  
          return {
            ...oldData,
            pages: oldData.pages.map((page) => {
              return {
                ...page,
                posts: page.posts.map((post) => {
                  if (post.id === id) {
                    return {
                      ...post,
                      likeCount: post.likeCount + countModifier,
                      likedByMe: addedLike,
                    };
                  }
  
                  return post;
                }),
              };
            }),
          };
        };
  
        trpcUtils.post.infiniteFeed.setInfiniteData({}, updateData);
        trpcUtils.post.infiniteFeed.setInfiniteData({ onlyFollowing: true }, updateData);
        
        trpcUtils.post.profileFeed.setInfiniteData({ userId: user.id }, updateData);
      },
    });
  
    function HandleToggleLike() {
      toggleLike.mutate({ id });
    }


    return (
        <li className="flex gap-4 border-b">
            <Link className="pt-2 pl-2" href={`/profile/${user.id}`}>
                <ProfileImage src={user.image}/>
            </Link>
            <div className="flex flex-grow flex-col">
                <div className="flex gap-1">
                    <h1 className="font-bold pt-1">Display Name</h1> 
                    <p className="pt-1">/</p>
                    <Link href={`/profile/${user.id}`} className="text-gray-500 hover:underline focus-visible:underline outline-none pt-1">{user.name}</Link>
                    <span className="text-gray-500 pt-1">-</span>
                    <span className="text-gray-500 pt-1">{dateTimeFormatter.format(createdAt)}</span>
                </div>

                <p className="whitespace-pre-wrap">{content}</p>
                <FavoriteButton onclick={HandleToggleLike} isLoading={toggleLike.isLoading} likedByMe={likedByMe} likeCount={likeCount}/>
            </div>
        </li>
    )
}

type FavoriteButtonProps = {
    onclick: () => void;
    isLoading: boolean;
    likedByMe: boolean;
    likeCount: number;
}

function FavoriteButton({ isLoading, onclick, likedByMe, likeCount }: FavoriteButtonProps) {
    const session = useSession();
    const FavoriteIcon = likedByMe ? VscHeartFilled : VscHeart;

    if (session.status !== "authenticated") {
        return (
            <div className="mb-1 mt-1 flex items-center gap-3 self-start text-gray-500">
                <FavoriteIcon />
                <span>{likeCount}</span>
            </div>
        )
    }
    return (
        <button disabled={isLoading}
                onClick={onclick}
            className={`group flex items-center gap-1 self-start transition-colors duration-100 -ml-2 ${
            likedByMe 
            ? "text-red-500"
            : "text-red-500 hover:text-red-500 focus-visible:text-red-500"} `}>
                <IconHoverEffect red>
                    <FavoriteIcon className={`transition-colors duration-200 ${
                        likedByMe
                        ? "fill-red-500"
                        : "fill-gray-500 group-hover:fill-red-500 group-focus-visible:fill-red-500" 
                    }`} />
                </IconHoverEffect>

            <span className="text-gray-500">{likeCount}</span>
        </button>
    )
}