import { useSession } from "next-auth/react";
import { Button } from "./Button";
import { ProfileImage } from "./ProfileImage";
import { FormEvent, useCallback, useLayoutEffect, useRef, useState } from "react";
import { api } from "~/utils/api";
import updateTextAreaSize from "./UpdateTextAreaSize";

function Form() {
    const [inputValue, setInputValue] = useState("")
    const textAreaRef = useRef<HTMLTextAreaElement>();
    const inputRef = useCallback((textArea : HTMLTextAreaElement) => {
        updateTextAreaSize(textArea);
        textAreaRef.current = textArea;
    }, []);

    // Set up tags
    const [tagInputValue, setTagInputValue] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    const session = useSession()

    useLayoutEffect(() => {
        updateTextAreaSize(textAreaRef.current);
    }, [inputValue]);

    const trpcUtils = api.useUtils();
    if (session.status !== "authenticated") return;

    const createPost = api.post.create.useMutation({ 
        onSuccess: newPost => {
            setInputValue("");

            trpcUtils.post.infiniteFeed.setInfiniteData({}, (oldData) => {
                if (oldData == null || oldData.pages[0] == null) return;

                const newCachePost = {
                    ...newPost,
                    likeCount: 0,
                    repostCount: 0,
                    likedByMe: false,
                    repostedByMe: false,
                    user: {
                        id: session.data.user.id,
                        name: session.data.user.name ?? null,
                        displayName: (session.data.user as { displayName?: string | null }).displayName ?? null,
                        image: session.data.user.image ?? null,
                    },
                    tags: tags.map(tag => ({ id: tag, name: tag })),
                };

                return {
                    ...oldData,
                    pages: [
                        {
                            ...oldData.pages[0],
                            posts: [newCachePost, ...oldData.pages[0].posts],
                        },
                        ...oldData.pages.slice(1)
                    ]
                }
            } )
    }})

    function handleAddTag() {
        if (tagInputValue.trim() !== "") {
            setTags(prevTags => [...prevTags, tagInputValue.trim()]);
            setTagInputValue("");
        }
        console.log(tags);
    }

    function handleRemoveTag(tagToRemove: string) {
        setTags(prevTags => prevTags.filter(tag => tag !== tagToRemove));
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        createPost.mutate({ content: inputValue, tags });
        setTags([]);
    }


    if (session.status !== "authenticated") return;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-b px-2 py-2 bg-gray-100">
            <div className="flex gap-4">
                <ProfileImage src={session.data.user.image} />
                <textarea style={{ height: 0 }}
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="flex-grow resize-none overflow-hidden px-2 py-2 text-lg outline-none  bg-gray-100" placeholder="What's up?"/>
            </div>

            <div className="self-end">
                <input type="text"
                        value={tagInputValue}
                        onChange={(e) => setTagInputValue(e.target.value)}
                        className="outline-none border border-gray-300 rounded-lg p-1 pl-2 mr-1"
                        placeholder="Add tags"
                    />
                <Button type="button" className="mr-1" small onClick={handleAddTag}>+</Button>
                <Button className="self-center">Post it </Button>
            </div>

            <div className="">
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <button key={tag} type="button" className="border text-gray-600 border-gray-300 py-1 px-3 rounded-lg" onClick={() => handleRemoveTag(tag)}>
                                {tag}
                            </button>
                        ))}
                    </div>

                </div>

        </form>
    )
}

export function NewPostForm()  {
    const session = useSession()
    if (session.status !== "authenticated") return null;

    return <Form />;
}