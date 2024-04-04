import React, { useState, useRef, useEffect } from "react";
import { api } from "~/utils/api";
import { Button } from "./Button";
import { useSession } from "next-auth/react";


type DisplayNameProps = {
    currentName?: string | null;
    userId?: string;
}

const UpdateDisplayName = ({ currentName, userId }: DisplayNameProps ) => {
    const [inputValue, setInputValue] = useState(currentName || "");
    const inputRef = useRef<HTMLInputElement>(null);

    const session = useSession();

    if (session.status !== "authenticated") return;

    useEffect(() => {
        // Focus on the input element when the component mounts
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const addDisplayName = api.profile.updateDisplayName.useMutation();
    const handleSaveDisplayName = async (event: React.FormEvent<HTMLFormElement>) => {
        addDisplayName.mutate({ displayName: inputValue });
    }

    return (
        <form onSubmit={handleSaveDisplayName} className="flex">
            <div className="flex ml-1 mb-1">
                <input
                    ref={inputRef}
                    style={{ height: 0 }}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full overflow-hidden block p-2.5 focus:outline-none text-sm text-gray-900 bg-gray-50 rounded-lg focus:ring focus:ring-orange-2 focus:border-orange-2"
                >
                </input>
            </div>

            <Button small className="self-end ml-2 mr-2 text-white hover:text-white focus:outline-none text-xs" type="submit">Save Name</Button>
        </form>
    );
}

export default UpdateDisplayName;