import InfiniteScroll from "react-infinite-scroll-component"
import { ProfileImage } from "./ProfileImage";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { VscHeart, VscHeartFilled } from "react-icons/vsc"
import { HiArrowsRightLeft } from "react-icons/hi2";
import { HiTrash } from "react-icons/hi2";
import { IconHoverEffect } from "./IconHoverEffect";
import { api } from "~/utils/api";
import { Post } from "./Types";
import { Button } from "./Button";


function PostCard({id, user, content, createdAt, likeCount, likedByMe, repostedByMe, repostCount} : Post) {
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

    const toggleRepost = api.post.toggleRepost.useMutation({
      onSuccess: ({ addedRepost }) => {
        const updateData: Parameters<
          typeof trpcUtils.post.infiniteFeed.setInfiniteData
        >[1] = (oldData) => {
        if (oldData == null) return; 

        const countModifier = addedRepost ? 1 : -1;

        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            return {
              ...page,
              posts: page.posts.map((post) => {

                  if (post.id === id) {

                    return {
                      ...post,
                      repostCount: post.repostCount + countModifier,
                      repostedByMe: addedRepost,
                    };
                  }
                  return post;
                })
              }
            })
          }
        }

        trpcUtils.post.infiniteFeed.setInfiniteData({}, updateData);
        trpcUtils.post.infiniteFeed.setInfiniteData({ onlyFollowing: true }, updateData);
        trpcUtils.post.profileFeed.setInfiniteData({ userId: user.id }, updateData);
      }
    })

    const toggleDelete = api.post.deletePost.useMutation();


    function HandleToggleLike() {
        toggleLike.mutate({ id });
    }

    function HandleToggleRepost() {
        toggleRepost.mutate({ id });
    }

    function HandleToggleDelete() {
      toggleDelete.mutate({ id });
    }

    return (
        <li className="flex gap-4 border-b max-w-full ">
            <Link className="pt-2 pl-2" href={`/profile/${user.id}`}>
                <ProfileImage src={user.image}/>
            </Link>
            <div className="flex flex-grow flex-col overflow-auto lg:text-base sm:text-sm">
                <div className="flex gap-1">
                    <h1 className="font-bold pt-1">{user.displayName}</h1> 
                    <p className="pt-1">/</p>
                    <Link href={`/profile/${user.id}`} className="text-gray-500 hover:underline focus-visible:underline outline-none pt-1">{user.name}</Link>
                    <span className="text-gray-500 pt-1">-</span>
                    <span className="text-gray-500 pt-1 pr-10">{dateTimeFormatter.format(createdAt)}</span>

                    <div className="flex ml-auto mr-2">
                      <button onClick={HandleToggleDelete} className="">
                        <HiTrash className="h-5 w-5" />
                      </button>
                    </div>
                </div>

                <p className="whitespace-pre-wrap break-words sm:max-w-2xl ">{content}</p>
                <span className="flex max-w-40 min-w-40 max-h-20 bg-gray-100 mb-2 mt-8 border rounded-xl ">
                  <FavoriteButton onclick={HandleToggleLike} isLoading={toggleLike.isLoading} likedByMe={likedByMe} likeCount={likeCount}/>
                  <RepostButton onclick={HandleToggleRepost} isLoading={toggleRepost.isLoading} repostedByMe={repostedByMe} repostCount={repostCount} />

                </span>

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
            className={`group mt-3 flex items-center gap-1 ml-3 mb-3 self-start transition-colors duration-100 ${
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

type RepostButtonProps = {
  onclick: () => void;
  isLoading: boolean;
  repostedByMe: boolean;
  repostCount: number;
}

function RepostButton({ isLoading, onclick, repostedByMe, repostCount} : RepostButtonProps) {
  const session = useSession();

  if (session.status !== "authenticated") {
    return (
        <div className="group mt-3 ml-4 flex items-center gap-1 self-start transition-colors duration-100 text-gray-100">
            <HiArrowsRightLeft />
            <span>{repostCount}</span>
        </div>
    )
  }

  return (
    <button disabled={isLoading}
            onClick={onclick}
            className={`group mt-3 ml-4 flex items-center gap-1 self-start transition-colors duration-0 ${
              repostedByMe 
              ? "text-green-500"
              : "text-gray-500 hover:text-green-500 focus-visible:text-green-500"} `}>
              <IconHoverEffect repost>
                <HiArrowsRightLeft />
              </IconHoverEffect>
              <span className="text-gray-500">{repostCount}</span>
    </button>
  )
}

export default PostCard;