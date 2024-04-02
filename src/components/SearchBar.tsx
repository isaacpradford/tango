import { useRouter } from "next/navigation";
import { useState } from "react"
import { VscSearch } from "react-icons/vsc"


export function SearchBar() {
    return (
        <div className="bg-zinc-100">
            <SearchInput />
        </div>
    ) 
    
}

function SearchInput() {
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    const onSearch = (event: React.FormEvent) => {
        event.preventDefault();

        const encodedQuery = encodeURI(searchQuery);
        router.push(`/search?q=${encodedQuery}`);
    }

    return (
        <form className="flex items-center p-5" onSubmit={onSearch}>
            <div >
                <button className="hover:scale-105 hover:transition-all">
                    <VscSearch className="h-5 w-5 mr-5"/>
                </button>
            </div>

            <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)} 
                className="rounded bg-zinc-200 w-full px-5 py-1 sm:px-6 sm:py-3 text-zinc-800 focus:outline-none focus:ring focus:ring-orange-2 focus:bg-white focus:border-orange-2" 
                placeholder="Looking for something?" ></input>
        </form>
    )
}