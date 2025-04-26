/** @type {import('next').NextConfig} */

const nextConfig = {
  async redirects() {
    return [
      {
        source: '/nos-concerts',
        destination: '/concerts',
        permanent: true,
      },
      {
        source: '/copie-de-contact',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/copie-de-nous-decouvrir',
        destination: '/decouvrir',
        permanent: true,
      },
      {
        source: '/copie-de-espace-membres',
        destination: '/membres',
        permanent: true,
      },
      {
        source: '/travail',
        destination: '/membres/travail',
        permanent: true,
      },
      {
        source: '/calendrier',
        destination: '/membres/calendrier',
        permanent: true,
      },
      {
        source: '/liste-des-membres',
        destination: '/membres/membres',
        permanent: true,
      },
      {
        source: '/administration',
        destination: '/membres/administration',
        permanent: true,
      },
      {
        source: '/videos',
        destination: '/galerie#videos',
        permanent: true,
      },
      {
        source: '/questions-pratiques',
        destination: '/decouvrir',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      new URL('https://res.cloudinary.com/dlt2j3dld/image/**'),
      // eslint-disable-next-line no-undef
      new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/**`),
    ],
  }
};

export default nextConfig;
