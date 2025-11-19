import React from "react";
import FullPageError from "@/components/common/FullPageError"; // This component needs to be themed

export default function NotFoundPage() {
  return (
    <FullPageError
      title="Lost in the Ethereal Mist" // Themed title
      message="The ancient path you sought has vanished, or perhaps it was never meant to be trod. This realm remains uncharted." // Themed message
      actionHref="/"
      actionLabel="Return to the Sacred Sanctuary" // Themed action label
      // You might add an optional 'icon' prop to FullPageError if it supports it
      // icon={GiCrystalBall} // Example: Pass a mystical icon
    />
  );
}