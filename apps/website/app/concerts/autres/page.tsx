import CDsViewer from "@/components/cds/CDsViewer";
import { JsonLd } from "@/components/JsonLd";
import cds from "@/public/json/cds.json";
import { breadcrumbJsonLd } from "@/utils/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CDs | Le Bon Tempérament",
  description:
    "Découvrez nos CDs de musique classique et baroque. Enregistrements de qualité de l'ensemble Le Bon Tempérament, incluant 'Roi Arthur' et 'Camino Latino'. Achetez en ligne nos productions musicales.",
  keywords:
    "CDs musique classique, Le Bon Tempérament, Roi Arthur, Camino Latino, musique baroque, enregistrements classiques, achats musique en ligne",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/concerts/autres`,
    siteName: "Le Bon Tempérament",
    title: "CDs - Le Bon Tempérament",
    description:
      "Découvrez nos CDs de musique classique et baroque. Enregistrements de qualité de l'ensemble Le Bon Tempérament.",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/cds-og.png",
        width: 1200,
        height: 630,
        alt: "CDs Le Bon Tempérament - Musique classique et baroque",
      },
    ],
  },
  alternates: {
    canonical: "/concerts/autres",
  },
};

// Generate structured data for products (CDs)
function generateStructuredData() {
  const productsSchema = cds.map((cd) => ({
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    name: cd.title,
    description: cd.description,
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/concerts/autres`,
    image: `https://res.cloudinary.com/dlt2j3dld/image/upload/v1/${cd.image}`,
    byArtist: {
      "@type": "MusicGroup",
      name: "Le Bon Tempérament",
      description: "Ensemble vocal et instrumental",
    },
    recordLabel: {
      "@type": "Organization",
      name: cd.label,
    },
    datePublished: cd.releaseDate,
    offers: {
      "@type": "Offer",
      price: cd.price / 100, // Convert from cents to euros
      priceCurrency: cd.currency,
      availability: "https://schema.org/InStock",
      url: cd.payment,
    },
    numTracks: cd.tracks.length,
    track: cd.tracks.map((track, index) => ({
      "@type": "MusicRecording",
      name: track.title,
      duration: track.duration,
      position: index + 1,
    })),
  }));

  return productsSchema;
}

const page = () => {
  const structuredData = generateStructuredData();

  return (
    <>
      {structuredData.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Concerts", path: "/concerts" },
          { name: "CDs", path: "/concerts/autres" },
        ])}
      />
      <div className="container mx-auto flex w-full flex-col pb-8">
        <div className="py-16">
          <div>
            <h1 className="text-title text-primary/50 dark:text-primary leading-none font-light">
              Concerts
            </h1>
            <h2 className="text-title leading-none font-bold text-[#333]">
              CDs
            </h2>
            <hr className="mt-8" />
          </div>
        </div>

        <CDsViewer />
      </div>
    </>
  );
};

export default page;
