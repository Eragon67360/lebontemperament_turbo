"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

/** Loaded by ConditionalVercelAnalytics once the "analytics" category is accepted. */
const VercelAnalytics = () => (
  <>
    <Analytics />
    <SpeedInsights />
  </>
);

export default VercelAnalytics;
