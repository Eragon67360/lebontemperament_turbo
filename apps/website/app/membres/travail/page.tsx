import React from "react"
import FileExplorer from "@/components/travail/FileExplorer"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Travail",
  description: "Accédez à l'espace Membres du Bon Tempérament, accédez à de multiples ressources comme des partitions, des gazettes, etc... ",
  keywords: 'Espace membres, gazette, travail, règlement, drive',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/membres/travail`,
    siteName: 'Le Bon Tempérament',
    images: [
        {
            url: 'https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/default-og.png',
            width: 800,
            height: 600,
            alt: 'Le Bon Tempérament',
        },
    ],
}
};

const Travail = () => {
  return (
    <>
      <div className="min-h-screen w-screen bg-[url('/img/background_travail.webp')] bg-cover bg-opacity-60 flex flex-col items-center gap-8 py-12">
        <h1 className="text-title text-[#333] font-bold leading-none select-none">Au travail !!</h1>
        <FileExplorer />
      </div>
    </>
  )
}

export default Travail