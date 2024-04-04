import React, { useState, useRef, useEffect } from "react";
import { api } from "~/utils/api";
import { Button } from "./Button";
import { useSession } from "next-auth/react";


const UpdateProfilePic = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const session = useSession();
    const [newImage, setNewImage] = useState("");

    if (session.status !== "authenticated") return;

    // Function to handle file change
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const fileType = file.type; // Get the MIME type of the file
            if (fileType.startsWith("image/")) {
                setNewImage(await convertImageToBase64(file));
            } else {
                console.error("Please select an image file");
            }
        }
    };

    // Function to convert image file to base64 string
    const convertImageToBase64 = (imageFile: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === "string") {
                    resolve(reader.result);
                } else {
                    reject(new Error("Failed to convert image to base64"));
                }
            };
            reader.onerror = () => {
                reject(new Error("Failed to read image file"));
            };
            reader.readAsDataURL(imageFile);
        });
    };

    const updatePic = api.profile.updateProfilePic.useMutation();
    const handleSubmitPicture = async (event: React.FormEvent<HTMLFormElement>) => {
        updatePic.mutate({ image: newImage });
    }

    return (
        <form onSubmit={handleSubmitPicture}>
            <input 
                className="flex  px-3 py-1 text-sm shadow-sm ml-5 mt-2 h-9 w-full rounded-md border transition-colors border-input hover:border-orange-2 focus-visible:border-main-orange focus:outline-none focus:ring focus:ring-orange-2 file:border-0 file:bg-transparent file:text-foreground file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                type="file"
                accept="image/png, image/jpeg" 
                onChange={handleFileChange}
                ref={inputRef}
            />
            <Button type="submit" className="ml-5 mt-3 text-white hover:text-white focus:outline-none text-xs">
                    Upload Profile Pic
            </Button>
        </form>
    )
}

export default UpdateProfilePic;