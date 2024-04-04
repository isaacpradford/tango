import { useRouter } from "next/navigation";
import { useState } from "react"
import { VscSearch } from "react-icons/vsc"


export function SearchBar() {
    return (
        <div className="sticky top-0 px-1.5 py-1.5">
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
        <form className="p-5 lg:flex bg-zinc-100 min-w-96" onSubmit={onSearch}>
            <div >
                <button className="hover:scale-105 hover:transition-all ">
                    <VscSearch className="h-7 w-7 mr-5 mt-2"/>
                </button>
            </div>

            <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)} 
                className="rounded bg-zinc-200 w-full px-5 sm:px-6 sm:py-3 text-zinc-800 focus:outline-none focus:ring focus:ring-orange-2 focus:bg-white focus:border-orange-2" 
                placeholder="Looking for something?" ></input>
        </form>
    )
}