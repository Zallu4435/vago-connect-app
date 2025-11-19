import "@/styles/globals.css";
import Head from "next/head";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "@/components/common/ErrorBoundary";

export default function App({ Component, pageProps }) {
  const handleError = (error, errorInfo) => {
    // Centralized error hook (extend to Sentry/LogRocket later)
    // eslint-disable-next-line no-console
    console.error("App crashed:", error, errorInfo);
  };
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
