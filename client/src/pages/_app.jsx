import "@/styles/globals.css";
import "@/styles/message-bubbles.css";
import Head from "next/head";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import React, { useEffect, useState } from "react";
import { refreshAccessToken } from "@/lib/refreshToken";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";
import LoadingSpinner from "@/components/common/LoadingSpinner"; // Assuming this is theme-neutral or will be updated
import { GiCrystalBall } from "react-icons/gi"; // Mystical icon
import { FaScroll } from "react-icons/fa"; // Reliable scroll icon

export default function App({ Component, pageProps }) {
  const handleError = (error, errorInfo) => {
    console.error("The Ethereal Plane experienced a disturbance:", error, errorInfo); // Themed error message
  };

  const [authChecked, setAuthChecked] = useState(false);
  useTokenRefresh();

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      try {
        await refreshAccessToken();
        console.log("Ancient wards refreshed, connection re-established."); // Themed log
      } catch (err) {
        console.log("No valid arcane signature found, user must re-attune."); // Themed log
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
    // Themed Loading Screen
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-ancient-bg-dark text-ancient-text-light animate-fade-in">
        <div className="relative mb-6">
          <GiCrystalBall className="text-9xl text-ancient-icon-glow drop-shadow-lg animate-pulse-light-slow" />
          <FaScroll className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl text-ancient-text-light animate-spin-slow" />
        </div>
        <div className="mb-4 text-4xl font-bold font-serif drop-shadow-lg text-center tracking-wide">
          Ethereal Whispers
        </div>
        <LoadingSpinner /> {/* Use your existing spinner, assuming it's okay */}
        <div className="mt-4 text-ancient-text-muted text-lg italic animate-fade-in delay-700">
          Awakening the ancient network...
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary onError={handleError}>
      <QueryClientProvider client={queryClient}>
        <Head>
          <title>Ethereal Whispers</title> {/* Themed Title */}
          <link rel="shortcut icon" href="/favicon_mystical.png" /> {/* Themed Favicon */}
        </Head>
        <Component {...pageProps} />
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 3000,
            style: {
              background: "#292b30", // ancient-bg-medium
              color: "#e0e0e0", // ancient-text-light
              border: "1px solid #4b4f57", // ancient-border-stone
              boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
              fontSize: "1rem", // Slightly larger
            },
            success: {
              iconTheme: {
                primary: "#4ade80", // ancient-icon-glow
                secondary: "#292b30", // ancient-bg-medium
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444", // Tailwind red-500
                secondary: "#292b30", // ancient-bg-medium
              },
            },
            // Add other toast types if needed
          }}
        />
        {process.env.NEXT_PUBLIC_ENABLE_RQ_DEVTOOLS === "true" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}