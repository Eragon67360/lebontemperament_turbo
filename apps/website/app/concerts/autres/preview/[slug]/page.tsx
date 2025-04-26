"use client";

import CloudinaryImage from "@/components/CloudinaryImage";
import cds from "@/public/json/cds.json";
import { RoundedSize } from "@/utils/types";
import { Avatar } from "@heroui/react";
import Link from "next/link";
import { useParams } from "next/navigation";

// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// interface Track {
//     title: string;
//     duration: string;
//     sampleUrl: string;
// }

// interface CD {
//     id: string;
//     title: string;
//     description: string;
//     image: string;
//     price: number;
//     currency: string;
//     releaseDate: string;
//     label: string;
//     genres: string[];
//     tracks: Track[];
//     artists: string[];
//     reviews: string[];
// }

export default function Preview() {
  const { slug } = useParams();
  const cd = cds.find((c) => `${c.slug}` === slug);

  if (!cd) {
    return (
      <>
        <div className="flex flex-col justify-center items-center">
          <h2 className="font-bold text-xl">
            {" "}
            Les données de ce CD n&apos;ont pas pu être trouvées, nous en sommes
            désolés
          </h2>
          <Link href={"/concerts/autres"} className="bg-primary text-white">
            Voir tous les CDs
          </Link>
        </div>
      </>
    );
  }
  return (
    <div className="container mx-auto pt-8 my-8 space-y-8 h-full">
      <h1 className="text-xl md:text-3xl lg:text-5xl font-bold mb-4 mx-auto text-center">
        {cd.title} | Le Bon Tempérament
      </h1>

      <div className="flex flex-col lg:flex-row gap-8 h-full">
        <CloudinaryImage
          src={cd.image}
          alt={cd.title}
          className="h-[300px] md:h-[400px] lg:h-[600px] object-cover mb-4 mx-auto border border-black"
          width={1000}
          height={400}
          rounded={RoundedSize.NONE}
        />

        <div className="flex flex-col gap-4 justify-between h-full lg:h-[600px] w-full px-8 lg:px-0">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-8 justify-between items-center w-full">
              <div className="flex gap-4 w-full">
                <Avatar size="lg" src="/img/picto.svg" />
                <div className="flex-col">
                  <h2 className="font-bold">Le Bon Tempérament</h2>
                  <h3>France</h3>
                </div>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{cd.description}</p>
            <p className="text-lg font-bold mb-4">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: cd.currency,
              }).format(cd.price / 100)}
            </p>

            <p className="mb-4">
              <strong>Date de sortie:</strong> {cd.releaseDate}
            </p>
          </div>

          <div className="flex flex-col">
            <h2 className="text-2xl font-semibold mb-4">Extraits</h2>
            <ul className="mb-4">
              {cd.tracks.length !== 0 ? (
                <>
                  {cd.tracks.map((track, index) => (
                    <li key={index} className="mb-2">
                      <strong>{track.title}</strong> - {track.duration}
                      <audio controls className="w-full mt-2">
                        <source src={track.sampleUrl} type="audio/mpeg" />
                        Votre navigateur ne supporte pas l&apos;élément audio.
                      </audio>
                    </li>
                  ))}
                </>
              ) : (
                <i>Pas d&apos;extraits disponibles pour le moment</i>
              )}
            </ul>
          </div>
          <Link
            href={cd.payment}
            className="w-full h-12 flex items-center justify-between font-bold text-white bg-primary rounded hover:bg-primary/80 uppercase transition-all duration-200 hover:shadow-md"
          >
            <p className="w-full text-center">Acheter ce CD</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
