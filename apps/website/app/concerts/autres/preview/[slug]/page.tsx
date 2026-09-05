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
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold">
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
    <div className="container mx-auto my-8 h-full space-y-8 pt-8">
      <h1 className="mx-auto mb-4 text-center text-xl font-bold md:text-3xl lg:text-5xl">
        {cd.title} | Le Bon Tempérament
      </h1>

      <div className="flex h-full flex-col gap-8 lg:flex-row">
        <CloudinaryImage
          src={cd.image}
          alt={cd.title}
          className="mx-auto mb-4 h-[300px] border border-black object-cover md:h-[400px] lg:h-[600px]"
          width={1000}
          height={400}
          rounded={RoundedSize.NONE}
        />

        <div className="flex h-full w-full flex-col justify-between gap-4 px-8 lg:h-[600px] lg:px-0">
          <div className="flex flex-col gap-4">
            <div className="flex w-full flex-col items-center justify-between gap-8 lg:flex-row">
              <div className="flex w-full gap-4">
                <Avatar className="size-12">
                  <Avatar.Image src="/img/picto.svg" alt="Le Bon Tempérament" />
                  <Avatar.Fallback>BT</Avatar.Fallback>
                </Avatar>
                <div className="flex-col">
                  <h2 className="font-bold">Le Bon Tempérament</h2>
                  <h3>France</h3>
                </div>
              </div>
            </div>
            <p className="mb-4 text-gray-600">{cd.description}</p>
            <p className="mb-4 text-lg font-bold">
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
            <h2 className="mb-4 text-2xl font-semibold">Extraits</h2>
            <ul className="mb-4">
              {cd.tracks.length !== 0 ? (
                <>
                  {cd.tracks.map((track, index) => (
                    <li key={index} className="mb-2">
                      <strong>{track.title}</strong> - {track.duration}
                      <audio controls className="mt-2 w-full">
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
            className="bg-primary hover:bg-primary/80 flex h-12 w-full items-center justify-between rounded font-bold text-white uppercase transition-all duration-200 hover:shadow-md"
          >
            <p className="w-full text-center">Acheter ce CD</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
