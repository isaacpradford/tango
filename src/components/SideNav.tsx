import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { IconHoverEffect } from "./IconHoverEffect";
import { VscAccount, VscHome, VscMail, VscSearch, VscSignIn, VscSignOut } from "react-icons/vsc";

export function SideNav() {
    const session = useSession();
    const user = session.data?.user;
    return ( 
    <nav className="sticky top-0 px-2 py-4 sm:"> 
        <ul className="flex flex-col items-start gap-2 whitespace-nowrap">
            <li >
                <Link href='/'>
                    <IconHoverEffect>
                        <span className="flex items-center gap-4"><VscHome className="h-8 w-8"/>
                            <span className="hidden text-lg md:inline">Home</span>
                        </span>
                    </IconHoverEffect>
                </Link>
            </li>
            { user != null && (
                <li>
                    <Link href={`/profile/${user.id}`}>
                        <IconHoverEffect>
                            <span className="flex items-center gap-4"><VscAccount className="h-8 w-8"/>
                                <span className="hidden text-lg md:inline">Profile</span>
                            </span>
                        </IconHoverEffect>
                    </Link>
                </li>
            )}

            { user != null && (
                <li>
                    <Link href={`/messages/`}>
                        <IconHoverEffect>
                            <span className="flex items-center gap-4"><VscMail className="h-8 w-8"/>
                                <span className="hidden text-lg md:inline">Messages</span>
                            </span>
                        </IconHoverEffect>
                    </Link>
                </li>
            )}

            { user != null && (
                <li>
                    <Link href={`/search/`}>
                        <IconHoverEffect>
                            <span className="flex items-center gap-4"><VscSearch className="h-8 w-8"/>
                                <span className="hidden text-lg md:inline">Search</span>
                            </span>
                        </IconHoverEffect>
                    </Link>
                </li>
            )}

            {user == null ? (
                <li>
                    <button onClick={() => {void signIn()}}>
                        <IconHoverEffect>
                            <span className="flex items-center gap-4"><VscSignIn className="h-8 w-8"/>
                                <span className="hidden text-lg md:inline fill-green-700">Log In</span>
                            </span>
                        </IconHoverEffect>
                    </button>
                </li>
            ) : (               
                <li>
                    <button onClick={() => void signOut()}>
                    <IconHoverEffect>
                            <span className="flex items-center gap-4"><VscSignOut className="h-8 w-8"/>
                                <span className="hidden text-lg md:inline fill-red-700">Log Out</span>
                            </span>
                        </IconHoverEffect>
                    </button>
                </li>
            )}
        </ul>
    </nav>

    )
}