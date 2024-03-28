import type { GetStaticPaths, GetStaticPropsContext, InferGetStaticPropsType, NextPage } from "next"
import Head from "next/head";
import { ssgHelper } from "~/server/api/ssgHelper";
import { api } from "~/utils/api";
import ErrorPage from "next/error";
import Link from "next/link";
import { IconHoverEffect } from "~/components/IconHoverEffect";
import { VscArrowLeft } from "react-icons/vsc";
import { ProfileImage } from "~/components/ProfileImage";
import { InfinitePostList } from "~/components/InfinitePostList";
import { useSession } from "next-auth/react";
import { Button } from "~/components/Button";


const ProfilePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = 
({
    id
}) => 
{
    // Get all the data of the profile
    const { data: profile }= api.profile.getById.useQuery({ id })

    // Get users posts, set up infinite feed
    const posts = api.post.profileFeed.useInfiniteQuery({ userId: id }, {getNextPageParam: (lastPage) => lastPage.nextCursor})
    
    // Toggle follow
    const trpcUtils = api.useUtils();
    const toggleFollow = api.profile.toggleFollow.useMutation({ 
        onSuccess: ({ addedFollow }) => {
            trpcUtils.profile.getById.setData({ id }, (oldData) => {
                if (oldData == null) return;

                const countModifier = addedFollow ? 1 : -1;
                return { 
                    ...oldData,
                    isFollowing: addedFollow,
                    followersCount: oldData.followersCount + countModifier,
                }
            })
        }, 
    });

    // If the page doesn't exist, return an error
    if (profile == null) return <ErrorPage statusCode={404} />

    return (
        <>
            <Head>
                <title>{`Raft - ${profile.name}`}</title>
            </Head>
            <header className="sticky top-0 z-10 flex items-center border-b bg-white px-4 py-2">
                <Link href=".." className="mr-2">
                    <IconHoverEffect>
                        <VscArrowLeft className="h-6 w-6" />
                    </IconHoverEffect>
                </Link>
                <ProfileImage src={profile.image} className="flex-shrink-0" />
                <div className="ml-2 flex-grow">
                    <h1 className="text-lg font-bold">{profile.name}</h1>
                    <div className="text-gray-500">
                        {profile.postsCount}{" "}{ getPlural(profile.postsCount, "Post", "Posts")}{" - "}

                        {profile.followersCount}{" "}{ getPlural(profile.postsCount, "Follower", "Followers")}{" /    "}

                        {profile.followsCount}{" "} Following
                    </div>

                </div> 
                <FollowButton 
                    isFollowing={profile.isFollowing} 
                    userId={id} 
                    onClick={() => toggleFollow.mutate({ userId: id })} 
                />
            </header>

            <main>
            <InfinitePostList 
                posts = {posts.data?.pages.flatMap((page) => page.posts)}
                isError = { posts.isError }
                isLoading = {posts.isLoading }
                hasMore = {posts.hasNextPage }
                fetchNewPosts = {posts.fetchNextPage }  
                />
            </main>
        </>
    )
}

function FollowButton({ userId, isFollowing, onClick} : {userId: string, isFollowing: boolean; onClick: () => void}) 
{
    const session = useSession();

    if (session.status !== "authenticated" || session.data.user.id === userId) {
        return null;
    }

    return (
        <Button onClick={onClick} small gray={isFollowing}>
           {isFollowing ? "Unfollow" : "Follow"}
        </Button>
    )
}

export const getStaticPaths: GetStaticPaths = () => {
    return {
        paths: [],
        fallback: "blocking",
    }
}

export async function getStaticProps(context: GetStaticPropsContext<{ id: string }>) {
    const id = context.params?.id;

    if (id == null) {
        return {
            redirect: {
                destination: "/"
            }
        }
    }

    const ssg = ssgHelper()
    await ssg.profile.getById.prefetch({ id })

    return {
        props: {
            id, 
            trpcState: ssg.dehydrate(),
        }
    }
}

// Get the singular or plural version of a word for post/posts
const pluralRules = new Intl.PluralRules()
function getPlural(number: number, singular: string, plural: string) {
    return pluralRules.select(number) === "one" ? singular : plural
}

export default ProfilePage;