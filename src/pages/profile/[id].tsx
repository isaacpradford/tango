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
import BiographyEditor from "~/components/BiographyEditor";
import { useState } from "react";
import { NewPostForm } from "~/components/NewPostForm";
import UpdateDisplayName from "~/components/DisplayName";
import UpdateProfilePic from "~/components/UpdateProfilePic";


const ProfilePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = 
({
    id
}) => 
{
    // Set the states to be updatable with a button
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [IsEditingName, setIsEditingName] = useState(false);
    const [isUpdatingProfilePic, setIsUpdatingProfilePic] = useState(false);

    const [isButtonsVisible, setIsButtonsVisible] = useState(true);
    const handleEditBio = () => {
        setIsEditingBio(true);
        setIsButtonsVisible(false);
    };

    const handleEditDisplayName = () => {
        setIsEditingName(true)
        setIsButtonsVisible(false);
    }

    const handleUpdateProfilePic = () => {
        setIsUpdatingProfilePic(true);
        setIsButtonsVisible(false);
    }

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

    const session = useSession();

    // If the page doesn't exist, return an error
    if (profile == null) return <ErrorPage statusCode={404} />

    return (
        <>
            <Head>
                <title>{`Raft - ${profile.name}`}</title>
            </Head>

            <header>
                <div className="flex justify-between">
                    <div>
                        <Link href=".." className="max-h-6 max-w-6 ">
                            <IconHoverEffect>
                                <VscArrowLeft className="h-6 w-6" />
                            </IconHoverEffect>
                        </Link>
                    </div>

                    <div className="mt-5 mr-5">
                        <FollowButton
                            isFollowing={profile.isFollowing} 
                            userId={id} 
                            onClick={() => toggleFollow.mutate({ userId: id })} 
                        />
                    </div>
                </div>

                <div className="profile sticky top-0 z-10 flex items-center border-b bg-white px-4 py-2 ">
                <ProfileImage src={profile.image} className="min-w-20 min-h-20 w-20 h-20 ml-5"/>
                {isUpdatingProfilePic && session.data?.user.id === id && (
                    <UpdateProfilePic />
                )}

                    <div className="ml-20 flex-grow">
                        <span className="flex text-lg border-b">   
                        {IsEditingName && session.data?.user.id === id ? (
                            <UpdateDisplayName currentName={profile.displayName} userId={id}/>
                        ) : (
                            <h1 className="font-bold mr-2">{profile.displayName} / </h1>
                        )}
                            <h1 className="text-gray-500">{profile.name}</h1>
                        </span>
                     
                        <div className="text-gray-500">
                            {profile.postsCount}{" "}{ getPlural(profile.postsCount, "Post", "Posts")}{" - "}

                            {profile.followersCount}{" "}{ getPlural(profile.postsCount, "Follower", "Followers")}{" /    "}

                            {profile.followsCount}{" "}Following
                        </div>

                        <div className="mt-10">
                            {isEditingBio ? (
                                <BiographyEditor currentBiography={profile.biography} userId={id} />
                                    ) : (
                                        <>
                                            {profile.biography ? (
                                                <p className="whitespace-pre-wrap ">{profile.biography}</p>
                                            ) : (
                                                <></>
                                            )}
                                        </>
                                )}
                        </div>
                
                        {isButtonsVisible && session.data?.user.id === id && (
                            <>
                                <Button small onClick={handleEditBio} className="mt-5 text-white hover:text-white focus:outline-none text-xs">
                                    Update Bio
                                </Button>
                                
                                <Button small onClick={handleEditDisplayName} className="ml-2 mt-5 text-white hover:text-white focus:outline-none text-xs">
                                    Update Display Name
                                </Button>
    
                                <Button small onClick={handleUpdateProfilePic} className="ml-2 mt-5 text-white hover:text-white focus:outline-none text-xs">
                                    Update Profile Pic
                                </Button>
                            </>
                        )}
                    </div>  
                </div>
            </header>

            <main>
            <NewPostForm />
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