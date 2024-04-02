import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";

import { api } from "~/utils/api";

import Head from "next/head";
import { SideNav } from "~/components/SideNav";
import { SearchBar } from "~/components/SearchBar"
import "~/styles/globals.css";
import { useRouter } from "next/router";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const router = useRouter();
  const isSearchPage = router.pathname === "/search";

  return (
    <SessionProvider session={session}>
      <Head>
        <title>Raft</title>
        <meta name="description" content="This is Raft, a text-based social media application. Welcome!"/>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container mx-auto flex items-start">
        <SideNav />
        <div className="min-h-screen min-w-screen flex-grow border-x lg:max-w-screen-xl">
          <Component {...pageProps} />
        </div>

        {!isSearchPage && (
          <div className="lg:flex bg-zinc-100 hidden">
            <SearchBar />
          </div>
        )}
      </div>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
