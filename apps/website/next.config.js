/** @type {import('next').NextConfig} */

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  async redirects() {
    return [
      {
        source: "/nos-concerts",
        destination: "/concerts",
        permanent: true,
      },
      {
        source: "/copie-de-contact",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/copie-de-nous-decouvrir",
        destination: "/decouvrir",
        permanent: true,
      },
      {
        source: "/copie-de-espace-membres",
        destination: "/membres",
        permanent: true,
      },
      {
        source: "/travail",
        destination: "/membres/travail",
        permanent: true,
      },
      {
        source: "/calendrier",
        destination: "/membres/calendrier",
        permanent: true,
      },
      {
        source: "/liste-des-membres",
        destination: "/membres/membres",
        permanent: true,
      },
      {
        source: "/administration",
        destination: "/membres/administration",
        permanent: true,
      },
      {
        source: "/videos",
        destination: "/galerie#videos",
        permanent: true,
      },
      {
        source: "/questions-pratiques",
        destination: "/decouvrir",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      new URL("https://res.cloudinary.com/dlt2j3dld/image/**"),
      new URL(
        // eslint-disable-next-line no-undef
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/**`,
      ),
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
    qualities: [25, 50, 75, 90, 100],
  },
  async headers() {
    // Get admin URL from environment or default to localhost:3002
    const adminUrl =
      // eslint-disable-next-line no-undef
      process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002";
    const adminOrigin = new URL(adminUrl).origin;

    // Build frame-ancestors directive
    const frameAncestors = [
      "'self'",
      adminOrigin,
      "http://localhost:3002",
      "https://localhost:3002",
      "http://127.0.0.1:3002",
      "https://127.0.0.1:3002",
    ]
      .filter((origin, index, self) => self.indexOf(origin) === index) // Remove duplicates
      .join(" ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${frameAncestors};`,
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
      {
        source: "/:path*.(js|css|png|jpg|jpeg|gif|ico|svg|webp|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["@heroui/react", "react-icons"],
  },
  compiler: {
    // eslint-disable-next-line no-undef
    removeConsole: process.env.NODE_ENV === "production",
  },
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
