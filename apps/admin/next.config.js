/** @type {import('next').NextConfig} */

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The monorepo root: Turbopack resolves from it and a standalone build traces
// the files it needs from it.
const monorepoRoot = path.join(__dirname, "..", "..");

const nextConfig = {
  // A self-hosted build (the Dockerfile sets BUILD_STANDALONE=1, see
  // DEPLOYMENT.md) writes a standalone server: .next/standalone holds
  // server.js and only the node_modules it needs. Vercel builds leave it unset.
  // eslint-disable-next-line no-undef
  ...(process.env.BUILD_STANDALONE === "1" && {
    output: "standalone",
    outputFileTracingRoot: monorepoRoot,
  }),
  turbopack: {
    root: monorepoRoot,
  },
  transpilePackages: ["@repo/domain"],
  images: {
    // Only the hosts the admin's images come from: Supabase Storage of the
    // production and staging projects, the custom domain that older
    // production rows still point at, and Cloudinary.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fsklunxplbbtzgurwqmc.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "cevuqyhwtzjujxsocxkb.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "api.lebontemperament.com",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Same security headers as the website (apps/website/next.config.js). The
  // admin is never framed by another site, so frame-ancestors is 'self' only.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self';",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },
  poweredByHeader: false,
};

export default nextConfig;
