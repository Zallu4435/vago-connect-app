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
    // Centralized error hook (extend to Sentry/LogRocket later)
    // eslint-disable-next-line no-console
    console.error("App crashed:", error, errorInfo);
  };

  const [authChecked, setAuthChecked] = useState(false);
  useTokenRefresh();

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      try {
        await refreshAccessToken();
        // eslint-disable-next-line no-console
        console.log("Auth restored from refresh token");
      } catch (err) {
        // eslint-disable-next-line no-console
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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-conversation-panel-background text-white">
        <div className="mb-4 text-3xl">Whatsapp</div>
        <LoadingSpinner />
        <div className="mt-2 text-secondary">Loading...</div>
      </div>
    );
  }
  return (
    <ErrorBoundary onError={handleError}>
      <QueryClientProvider client={queryClient}>
        <Head>
          <title>Whatsapp</title>
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
              background: "#1f2c33",
              color: "#fff",
            },
          }}
        />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
