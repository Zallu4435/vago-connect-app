import React from "react";
import FullPageError from "@/components/common/FullPageError";

export default function NotFoundPage() {
  return (
    <FullPageError
      title="Page Not Found"
      message="The page you are looking for doesn't exist or has been moved."
      actionHref="/"
      actionLabel="Back to Home"
    />
  );
}
