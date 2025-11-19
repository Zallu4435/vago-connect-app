import "@/styles/globals.css";
import Head from "next/head";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import React, { useEffect, useState } from "react";
import { refreshAccessToken } from "@/lib/refreshToken";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function App({ Component, pageProps }) {
  const handleError = (error, errorInfo) => {
    console.error("App crashed:", error, errorInfo);
  };

  const [authChecked, setAuthChecked] = useState(false);
  useTokenRefresh();

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      try {
        await refreshAccessToken();
        console.log("Auth restored from refresh token");
      } catch (err) {
        console.log("No valid session, user needs to login");
      } finally {
        if (mounted) setAuthChecked(true);
      }
    };
    initAuth();
    return () => {
      mounted = false;
    };
  }, []);

  if (!authChecked) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#DDE4E9] text-[#4C5F6C]">
        <div className="mb-4 text-3xl font-semibold">GhostChat</div>
        <LoadingSpinner />
        <div className="mt-2 text-[#859BA8]">Loading...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary onError={handleError}>
      <QueryClientProvider client={queryClient}>
        <Head>
          <title>GhostChat</title>
          <link rel="shortcut icon" href="/favicon.png" />
        </Head>
        <Component {...pageProps} />
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 3000,
            style: {
              background: "#DDE4E9",
              color: "#4C5F6C",
            },
          }}
        />
        {process.env.NEXT_PUBLIC_ENABLE_RQ_DEVTOOLS === "true" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
