export type Post = {
    id: string;
    content: string;
    createdAt: Date;
    likeCount: number;
    likedByMe: boolean;
    repostCount: number;
    repostedByMe: boolean;
    user: { id: string; image: string | null; displayName: string | null; name: string | null };
}

export type InfinitePostListProps = {
    isLoading: boolean;
    isError: boolean;
    hasMore: boolean | undefined;
    fetchNewPosts: () => Promise<unknown>;
    posts?: Post[];
    reposts?: Repost[];
}

export type User = {
    id?: string;
    name?: string | null;
    image?: string | null;
    biography?: string | null;
    displayName?: string | null;
}

export type Repost = {
    id: string;
    userId: string;
    postId: string; 
    createdAt: Date;
}