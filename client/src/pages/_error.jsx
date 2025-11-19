import React from "react";
import FullPageError from "@/components/common/FullPageError";

function ErrorPage({ statusCode }) {
  const title = statusCode === 404 ? "Page Not Found" : "Something went wrong";
  const message =
    statusCode && statusCode !== 404
      ? `An unexpected error occurred (code ${statusCode}).`
      : "The page you are looking for doesn't exist or has been moved.";

  return (
    <FullPageError
      title={title}
      message={message}
      actionHref="/"
      actionLabel="Back to Home"
    />
  );
}

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res?.statusCode || err?.statusCode || 500;
  return { statusCode };
};

export default ErrorPage;
