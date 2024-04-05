import type { ReactNode } from "react";


type IconHoverEffectProps = {
    children: ReactNode
    red?: boolean
    repost?: boolean
}

export function IconHoverEffect({ children, red = false, repost = false }:IconHoverEffectProps) {
    const colorClasses = red 
    ? "rounded-full outline-red-400 hover:bg-red-200 group-hover-bg-red-200 group-focus:bg-red-200 focus-visible:bg-red-200 p-3" 
    : "outline-gray-400 hover:bg-gray-200 group-hover-bg-gray-200 group-focus:bg-gray-200 focus-visible:bg-gray-200 p-3";

    const repostClasses = repost
    ? "rounded-full outline-green-400 hover:bg-green-200 group-hover-bg-green-200 group-focus:bg-green-200 focus-visible:bg-green-200 p-3" 
    : "";

    return (
        <div className={`p-2 transition-colors duration-200 ${colorClasses} ${repostClasses}`}>
            {children}
        </div>
    )
}