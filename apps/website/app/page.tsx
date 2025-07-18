"use client";

import CDPochettePhotos from "@/components/CDPochettePhotos";
import CloudinaryImage from "@/components/CloudinaryImage";
import ConcertPhotos from "@/components/ConcertPhotos";
import ContactForm from "@/components/ContactForm";
import ProjectViewer from "@/components/ProjectViewer";
import RouteNames from "@/utils/routes";
import { RoundedSize } from "@/utils/types";
import { Button, Link } from "@heroui/react";
import { IoIosArrowRoundForward } from "react-icons/io";

// export const metadata: Metadata = {
//   title: 'Accueil | Le Bon Tempérament',
//   description: 'Bienvenue sur le site de l\'association Le Bon Tempérament.',
//   openGraph: {
//     type: 'website',
//     locale: 'fr_FR',
//     url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
//     siteName: 'Le Bon Tempérament',
//     images: [
//       {
//         url: 'https://res.cloudinary.com/dlt2j3dld/image/upload/v1716454520/Site/og/home-og.png',
//         width: 800,
//         height: 600,
//         alt: 'Le Bon Tempérament',
//       },
//     ],
//   },
//   alternates: {
//     canonical: '/',
//   },
// };

const Home = () => {
  return (
    <>
      <div className="flex w-full flex-col items-center">
        {/* Hero Section */}
        <section
          className="flex justify-center bg-white"
          aria-labelledby="hero-title"
        >
          <div className="flex w-full max-w-[1600px] justify-between gap-32 px-4 py-16">
            <div className="hidden lg:col-span-5 lg:mt-0 lg:flex">
              <CloudinaryImage
                src={"Site/logo"}
                alt="Logo Le Bon Tempérament - Ensemble vocal et instrumental"
                className="scale-75"
                width={600}
                height={574}
                rounded={RoundedSize.NONE}
                priority={true}
              />
            </div>
            <div className="mr-auto w-full place-self-center px-8 md:px-16 lg:col-span-7 lg:px-32">
              <h1
                id="hero-title"
                className="mb-2 max-w-2xl text-xl leading-none font-extrabold tracking-tight md:text-2xl lg:text-3xl"
              >
                Bienvenue sur le site du <br />{" "}
                <span className="text-primary">Bon Tempérament</span>
              </h1>
              <p className="mb-8 max-w-2xl text-base font-light text-gray-500 md:text-lg lg:text-xl">
                Un ensemble vocal et instrumental
              </p>

              <div className="flex flex-col gap-4 md:flex-row">
                <Button
                  as={Link}
                  href={RouteNames.CONCERTS.ROOT}
                  size="lg"
                  radius="sm"
                  color="primary"
                  aria-label="Voir nos concerts"
                  className=""
                >
                  Nos concerts
                  <IoIosArrowRoundForward
                    className="-mr-1 ml-2 h-3 w-3 lg:h-5 lg:w-5"
                    aria-hidden="true"
                  />
                </Button>
                <Button
                  as={Link}
                  href="#contact"
                  size="lg"
                  radius="sm"
                  variant="bordered"
                  aria-label="Aller à la section Contact"
                  className=""
                >
                  Nous contacter
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section
          className="flex w-full justify-center bg-[#f2f2f2] py-16"
          aria-labelledby="projects-title"
        >
          <div className="w-full max-w-[1440px] px-8 lg:px-24">
            <h2
              id="projects-title"
              className="text-primary/50 text-title mb-14 leading-none font-light"
            >
              Nos derniers projets
            </h2>
            <ProjectViewer />
          </div>
        </section>

        {/* Main Content Container */}
        <div className="mx-0 flex w-full max-w-[1440px] flex-col">
          {/* About Section */}
          <section
            className="mt-16 flex w-full flex-col bg-[#F2F2F2] lg:flex-row"
            aria-labelledby="about-title"
          >
            <div className="relative flex w-full gap-8 py-8 pr-8 pl-8 lg:w-3/5 lg:pl-[100px]">
              <div className="flex w-1/2 flex-col gap-8">
                <CloudinaryImage
                  src={"Site/home/home2"}
                  alt="Performance de l'ensemble Le Bon Tempérament"
                  width={500}
                  height={270}
                  rounded={RoundedSize.NONE}
                />
                <CloudinaryImage
                  src={"Site/home/home1"}
                  alt="Membres de l'ensemble en concert"
                  width={500}
                  height={270}
                  rounded={RoundedSize.NONE}
                />
              </div>
              <div className="w-1/2 pt-8">
                <CloudinaryImage
                  src={"Site/home/home3"}
                  alt="Répétition de l'ensemble vocal et instrumental"
                  width={500}
                  height={270}
                  rounded={RoundedSize.NONE}
                />
              </div>
            </div>
            <div className="flex w-full flex-col items-start justify-between py-8 pr-8 pl-8 lg:w-2/5 lg:pr-16 lg:pl-0">
              <div className="flex flex-col gap-[20px]">
                <h2
                  id="about-title"
                  className="text-primary/50 text-title leading-none font-[300]"
                  style={{ fontWeight: 300 }}
                >
                  Nous découvrir
                </h2>
                <p className="text-xs leading-[25px] font-light md:text-sm lg:text-base">
                  L&apos;association Le Bon Tempérament est un ensemble vocal et
                  instrumental dirigé par Simone Duclos depuis sa création en
                  1987 qui vise à partager la passion pour la musique de ses
                  membres avec le plus grand nombre.
                </p>
              </div>
              <Link
                href={"/decouvrir"}
                aria-label="Aller à la page Nous Découvrir pour en apprendre plus sur l'association"
                className="mt-8 flex items-center justify-start space-x-[18px] bg-white px-[20px] py-[18px] text-[#333] transition-all hover:bg-[#333] hover:text-[#F2F2F2] lg:mt-0"
              >
                <span className="text-[12px] tracking-[2.4px] uppercase">
                  En apprendre plus
                </span>
                <IoIosArrowRoundForward
                  className="scale-110"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </section>

          {/* Concerts Section */}
          <section
            className="mt-16 w-full bg-white px-8 py-16 lg:px-24"
            aria-labelledby="concerts-title"
          >
            <h2
              id="concerts-title"
              className="text-primary/50 text-title leading-none font-light"
            >
              Nos concerts
            </h2>
            <div className="mt-14">
              <ConcertPhotos />

              <div className="mt-[30px] flex justify-end">
                <Link
                  href={"/concerts"}
                  aria-label="Voir tous nos concerts"
                  className="flex items-center justify-end space-x-[18px] border border-[#333] bg-[#333] px-[20px] py-[18px] text-white transition-all hover:bg-white hover:text-[#333]"
                >
                  <span className="text-xs tracking-[2.4px] uppercase">
                    Voir tous les concerts
                  </span>
                  <IoIosArrowRoundForward
                    className="scale-110"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </section>

          {/* CDs Section */}
          <section
            className="w-full bg-[#f8f8f8] px-8 py-16 lg:px-24"
            aria-labelledby="cds-title"
          >
            <h2
              id="cds-title"
              className="text-primary/50 text-title leading-none font-light"
            >
              Nos CDs
            </h2>
            <div className="mt-14">
              <CDPochettePhotos />

              <div className="mt-[30px] flex justify-end">
                <Link
                  href={"/concerts/autres"}
                  aria-label="Voir nos CDs actuellement en vente"
                  className="flex items-center justify-end space-x-[18px] border border-[#333] bg-[#333] px-[20px] py-[18px] text-white transition-all hover:bg-white hover:text-[#333]"
                >
                  <span className="text-xs tracking-[2.4px] uppercase">
                    Acheter nos CDs
                  </span>
                  <IoIosArrowRoundForward
                    className="scale-110"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <ContactForm />
        </div>
      </div>
    </>
  );
};

export default Home;
