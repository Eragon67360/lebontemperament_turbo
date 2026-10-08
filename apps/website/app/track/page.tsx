"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { TrackPageLoadingFallback } from "./shared";
import { TrackByTokenContent } from "./TrackByToken";

/**
 * Page wrapper component that provides a Suspense boundary.
 */
export default function TrackByTokenPage() {
  return (
    <Suspense fallback={<TrackPageLoadingFallback />}>
      <TrackByToken />
    </Suspense>
  );
}

/** Reads the token from the URL; a new token starts a fresh tracking view. */
function TrackByToken() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  return <TrackByTokenContent key={token ?? ""} token={token} />;
}
