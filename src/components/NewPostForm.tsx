import { useSession } from "next-auth/react";
import { Button } from "./Button";
import { ProfileImage } from "./ProfileImage";
import { FormEvent, useCallback, useLayoutEffect, useRef, useState } from "react";
import { api } from "~/utils/api";

function updateTextAreaSize(textArea?: HTMLTextAreaElement) {
    if (textArea == null) {
        return;
    } else {
        textArea.style.height = "0",
        textArea.style.height = `${textArea.scrollHeight}px`
    }
}

function Form() {
    const [inputValue, setInputValue] = useState("")
    const textAreaRef = useRef<HTMLTextAreaElement>();
    const inputRef = useCallback((textArea : HTMLTextAreaElement) => {
        updateTextAreaSize(textArea);
        textAreaRef.current = textArea;
    }, []);

    const session = useSession()

    useLayoutEffect(() => {
        updateTextAreaSize(textAreaRef.current);
    }, [inputValue]);

    const createPost = api.post.create.useMutation({ onSuccess: newPost => {
        setInputValue("");
    }})

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        createPost.mutate({ content: inputValue});
    }


    if (session.status !== "authenticated") return;

    return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-b px-4 py-2">
        <div className="flex gap-4">
            <ProfileImage src={session.data.user.image} />
            <textarea style={{ height: 0 }}
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="flex-grow resize-none overflow-hidden p-4 text-lg outline-none" placeholder="What's up?"/>
        </div>
        <Button className="self-end">Submit</Button>
    </form>)
}

export function NewPostForm()  {
    const session = useSession()
    if (session.status !== "authenticated") return null;

    return <Form />;
}