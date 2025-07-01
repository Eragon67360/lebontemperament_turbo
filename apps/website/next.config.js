/** @type {import('next').NextConfig} */

const nextConfig = {
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
      // eslint-disable-next-line no-undef
      new URL(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/**`
      ),
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
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
    removeConsole: process.env.NODE_ENV === "production",
  },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
};

export default nextConfig;
