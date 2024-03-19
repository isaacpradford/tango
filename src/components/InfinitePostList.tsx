import InfiniteScroll from "react-infinite-scroll-component"
import { ProfileImage } from "./ProfileImage";
import Link from "next/link";
import { useSession } from "next-auth/react";

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
    hasMore: boolean;
    fetchNewPosts: () => Promise<unknown>;
    posts?: post[];
}

export function InfinitePostList({ posts, isError, isLoading, fetchNewPosts, hasMore }: InfinitePostListProps ) {
    if (isLoading) return <h1>Loading - </h1>
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

    return (
        <li className="flex gap-4 border-b px-4 py-4">
            <Link href={`/profile/${user.id}`}>
                <ProfileImage src={user.image}/>
            </Link>
            <div className="flex flex-grow flex-col">
                <div className="flex gap-1">
                    <Link href={`/profile/${user.id}`} className="font-bold hover:underline focus-visible:underline outline-none">{user.name}</Link>
                    <span className="text-gray-500">-</span>
                    <span className="text-gray-500">{dateTimeFormatter.format(createdAt)}</span>
                </div>

                <p className="whitespace-pre-wrap">{content}</p>
            </div>
        </li>
    )
}

function FavoriteButton() {
    const session = useSession();

    if (session.status !== "authenticated") {
        return (
            <div className="mb-1 mt-1 flex items-center gap-3 self-start text-gray-500">
                <FavoriteIcon />
            </div>
        )
    }
}