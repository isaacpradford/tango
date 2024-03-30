import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { api } from '~/utils/api';
import updateTextAreaSize from './UpdateTextAreaSize';
import { useSession } from 'next-auth/react';
import { ProfileImage } from './ProfileImage';
import { Button } from './Button';

type BiographyProps = {
    currentBiography?: string | null;
    userId?: string;
}

const BiographyEditor = ({ currentBiography, userId } : BiographyProps) => {
    // This makes the HTML text area automatically resize for new lines (pressing enter)
    const [inputValue, setInputValue] = useState(currentBiography || '');
    const textAreaRef = useRef<HTMLTextAreaElement>();

    const inputRef = useCallback((textArea: HTMLTextAreaElement) => {
        updateTextAreaSize(textArea);
        textAreaRef.current = textArea;
    }, [])

    useLayoutEffect(() => {
        updateTextAreaSize(textAreaRef.current);
    }, [inputValue]);

    const session = useSession()

    if (session.status !== "authenticated") return;

    const addBio = api.profile.addBiography.useMutation();
    const handleSaveBiography = async (event: React.FormEvent<HTMLFormElement>) => {
        addBio.mutate({ biography: inputValue });
        
    }

    if (session.data.user.id !== userId) {
        return null;
    }

    return (
        <form onSubmit={handleSaveBiography} className="">
            <div className="flex gap-4 min-w-fit px-4 py-2 ">
                <textarea
                    style={{ height: 0 }}
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full overflow-hidden block p-2.5 focus:outline-none text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring focus:ring-blue-500 focus:border-blue-500"
                >
                </textarea>
            </div>

            <Button small className="self-end ml-2 text-white hover:text-white focus:outline-none text-xs" type="submit">Save Bio</Button>
        </form>
    );
}

export default BiographyEditor;