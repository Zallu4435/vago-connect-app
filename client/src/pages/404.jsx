import React from "react";
import FullPageError from "@/components/common/FullPageError"; // This component needs to be themed

export default function NotFoundPage() {
  return (
    <FullPageError
      title="404" // Themed title
      message="The page you are looking for does not exist." // Themed message
      actionHref="/"
      actionLabel="Return to the chat" // Themed action label
    // You might add an optional 'icon' prop to FullPageError if it supports it
    // icon={GiCrystalBall} // Example: Pass a mystical icon
    />
  );
}