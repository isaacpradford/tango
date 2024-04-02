import Link from "next/link"
import { ProfileImage } from "./ProfileImage"

import { User } from "./Types"


function UserCard({ id, name, image, biography } : User ) {


    return (
        <div>
            <li className="flex border-b " >
            <Link className="m-5" href={`/profile/${id}`}>
                <ProfileImage className="h-20 w-20" src={image}/>
            </Link>
            
            <div className="flex flex-grow flex-col">
                <div className="flex gap-1 mt-3 ml-5">
                    <h1 className="font-bold pt-1">Display Name</h1> 
                    <p className="pt-1">/</p>
                    <Link href={`/profile/${id}`} className="text-gray-500 hover:underline focus-visible:underline outline-none pt-1">{name}</Link>
                </div>

                {(biography !== "null") && (
                    <p className="mt-0.5 ml-5 max-h-40 whitespace-pre-wrap overflow-hidden">
                        {biography}
                    </p>
                )}
            </div>
        </li>

    </div>
    )
}

export default UserCard;