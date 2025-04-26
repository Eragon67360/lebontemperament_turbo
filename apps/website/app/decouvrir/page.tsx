import React from "react";
import type { Metadata } from "next";
import MemberCard from "@/components/MemberCard";
import CloudinaryImage from "@/components/CloudinaryImage";
import { RoundedSize } from "@/utils/types";
import { keyword } from "../layout";

export const metadata: Metadata = {
  title: "Nous découvrir",
  description:
    'Plongez dans l"univers de Le Bon Tempérament, une association de musique française dédiée à la diffusion de la musique et à la création de moments inoubliables. Découvrez notre mission, nos valeurs, et notre passion pour la musique.',
  keywords: `${keyword.join(", ")}`,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/decouvrir`,
    siteName: "Le Bon Tempérament",
    images: [
      {
        url: "https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/decouvrir-og.png",
        width: 800,
        height: 600,
        alt: "Le Bon Tempérament",
      },
    ],
  },
  alternates: {
    canonical: "/decouvrir",
  },
};

const Decouvrir = () => {
  return (
    <div className="mx-0 md:mx-4 lg:mx-8 px-0 max-w-[1440px] w-full flex flex-col mb-8">
      <div className="py-4 md:py-8 lg:py-16 px-8">
        <h1 className="text-title text-primary/50 font-light leading-none">
          Nous
        </h1>
        <h2 className="text-title text-[#333] font-bold leading-none">
          Découvrir
        </h2>
        <hr className="mt-2 md:mt-4 lg:mt-8" />
      </div>

      <div className="flex flex-col gap-16 text-justify">
        <div className="flex flex-col lg:flex-row gap-8 w-full bg-[#f2f2f2] p-8">
          <div className="flex flex-col w-full lg:w-3/5">
            <h2 className="text-[#BDBDBD] font-light text-title leading-none">
              Notre histoire
            </h2>
            <p className="mt-8 text-small lg:text-medium">
              L&apos;association <i>Le Bon Tempérament</i> est un ensemble vocal
              et instrumental dirigé par Simone Duclos depuis sa création en
              1987. Le Bon Tempérament se distingue par le mélange des
              générations, la diversité des parcours des chanteurs et des
              instrumentistes et l&apos;esprit de convivialité qui l&apos;anime.
              L&apos;association accorde une place toute particulière aux
              familles, les enfants y découvrent la musique à travers le chant,
              la pratique instrumentale et l&apos;interprétation de spectacles
              musicaux.
            </p>
          </div>
          <div className="w-full lg:w-2/5 flex">
            <CloudinaryImage
              src={"Site/découvrir/histoire"}
              alt="Photo BT complet"
              rounded={RoundedSize.SM}
              width={600}
              height={500}
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 w-full p-8">
          <div className="flex flex-col lg:flex-row w-full lg:w-3/5 gap-4 items-center">
            <div className="flex flex-col w-full gap-4 justify-start">
              <CloudinaryImage
                src={"Site/découvrir/choeurs/adultes"}
                alt="Image choeur adultes"
                width={600}
                height={500}
                rounded={RoundedSize.LG}
              />
              <CloudinaryImage
                src={"Site/découvrir/choeurs/jeunes"}
                alt="Image choeur jeunes"
                width={600}
                height={500}
                rounded={RoundedSize.LG}
              />
            </div>
            <div className="flex flex-col w-full gap-4 justify-start mt-0 lg:mt-24">
              <CloudinaryImage
                src={"Site/découvrir/choeurs/plusplus"}
                alt="Image choeur + +"
                width={600}
                height={500}
                rounded={RoundedSize.LG}
              />
              <CloudinaryImage
                src={"Site/découvrir/choeurs/paul"}
                alt="Image Paul"
                width={600}
                height={500}
                rounded={RoundedSize.LG}
              />
            </div>
          </div>
          <p className="flex items-center mt-0 text-small lg:text-medium w-full lg:w-2/5">
            C&apos;est notamment au cours des séjours organisés chaque été dans
            une autre région de France que se peaufine le programme de
            l&apos;année et que se tissent les liens si particuliers entre les
            membres du BT. Depuis 2023, l&apos;association s&apos;est enrichie
            d&apos;un orchestre symphonique dirigé par Charlotte Lienhard, qui
            se produit seul ou avec la chorale lors des différents concerts de
            l&apos;année.
            <br />
            Le Bon Tempérament se distingue également par la diversité musicale
            de son répertoire, interprétant des œuvres variées allant de la
            musique classique sacrée et profane à des pièces populaires et
            folkloriques, couvrant une large période musicale de la Renaissance
            à nos jours. Il offre un programme varié et renouvelé chaque année.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 w-full bg-[#f2f2f2] p-8">
          <div className="w-full lg:w-2/5 flex">
            <CloudinaryImage
              src={"Site/découvrir/choeurs/choeur"}
              alt="Image structure du choeur"
              width={533}
              height={300}
              rounded={RoundedSize.SM}
            />
          </div>
          <div className="flex flex-col w-full lg:w-3/5">
            <h2 className="text-[#BDBDBD] font-light text-title leading-none">
              Structure
            </h2>
            <p className="mt-8 text-small lg:text-medium">
              Le Bon Tempérament réunit des choristes amateurs, des chanteurs
              solistes professionnels et des instrumentistes de tous horizons.
              Les différentes générations évoluent dans un chœur d&apos;adultes,
              un chœur de jeunes et un chœur des tout-jeunes qui chantent a
              capella, ou accompagnés au piano par Paul Lienhard ou par un petit
              groupe d&apos;instrumentistes.{" "}
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 w-full p-8">
          <h2 className="text-[#BDBDBD] font-light text-title leading-none w-full lg:w-2/5">
            La direction
          </h2>
          <div className="flex flex-col lg:flex-row w-full lg:w-3/5 gap-4">
            <MemberCard
              role={"Cheffe principale"}
              name={"Simone Duclos"}
              src={"Site/découvrir/membres/simone"}
              quote={
                <i>
                  Je vous rappelle que le point d&apos;orgue est au bout du
                  doigt du chef
                </i>
              }
            />
            <MemberCard
              role={"Cheffe choeur enfants"}
              name={"Camille Gerlier-Lienhard"}
              src={"Site/découvrir/membres/camille"}
              quote={""}
            />
            <MemberCard
              role={"Cheffe choeur jeunes"}
              name={"Chloé Rozaire"}
              src={"Site/découvrir/membres/chloe"}
              quote={""}
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 w-full bg-[#f2f2f2] p-8">
          <div className="w-full lg:w-2/5 flex">
            <CloudinaryImage
              src={"Site/découvrir/orchestre/orchestre_4"}
              alt="Image orchestre"
              width={533}
              height={300}
              rounded={RoundedSize.SM}
            />
          </div>
          <div className="flex flex-col w-full lg:w-3/5">
            <h2 className="text-[#BDBDBD] font-light text-title leading-none">
              Notre orchestre
            </h2>
            <p className="mt-8 text-small lg:text-medium">
              L&apos;orchestre du Bon Tempérament est dirigé par{" "}
              <strong>Charlotte Lienhard</strong> (<i>voir photo ci-dessous</i>
              ). Cet ensemble a été créé en 2023 et regroupe des instrumentistes
              de tous horizons. Il a pour vocation d&apos;accompagner la chorale
              et d&apos;enrichir le répertoire joué par le Bon Tempérament.
              Durant l&apos;année, il se produit seul autour de programmes
              musicaux variés.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 w-full p-8">
          <div className="flex flex-col lg:flex-row w-full lg:w-3/5 gap-4 order-2 lg:order-1 items-center">
            <div className="flex flex-col w-full gap-4 justify-start">
              <CloudinaryImage
                src={"Site/découvrir/orchestre/orchestre_3"}
                alt="Image orchestre 1"
                width={400}
                height={400}
                rounded={RoundedSize.LG}
              />
              <CloudinaryImage
                src={"Site/découvrir/orchestre/orchestre"}
                alt="Image orchestre 2"
                width={400}
                height={400}
                rounded={RoundedSize.LG}
              />
            </div>
            <div className="flex flex-col w-full gap-4 justify-start mt-0 lg:mt-24">
              <CloudinaryImage
                src={"Site/découvrir/orchestre/orchestre_2"}
                alt="Image orchestre 3"
                width={400}
                height={400}
                rounded={RoundedSize.LG}
              />
              <CloudinaryImage
                src={"Site/découvrir/orchestre/orchestre_1"}
                alt="Image orchestre 4"
                width={400}
                height={400}
                rounded={RoundedSize.LG}
              />
            </div>
          </div>
          <div className="w-full lg:w-2/5 flex order-1 lg:order-2">
            <MemberCard
              role={"Cheffe d'orchestre"}
              name={"Charlotte Lienhard"}
              src={"Site/découvrir/membres/charlotte"}
              quote={""}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Decouvrir;
