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
      <div className="flex flex-col items-center w-full">
        <section className="bg-white dark:bg-neutral-800  flex justify-center">
          <div className="flex justify-between max-w-[1600px] px-4 py-16 w-full gap-32">
            <div className="hidden lg:mt-0 lg:col-span-5 lg:flex">
              <CloudinaryImage
                src={"Site/logo"}
                alt="Logo"
                className="scale-75"
                width={600}
                height={574}
                rounded={RoundedSize.NONE}
              />
            </div>
            <div className="w-full mr-auto place-self-center lg:col-span-7 px-8 md:px-16 lg:px-32">
              <h1 className="max-w-2xl mb-2 text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight leading-none">
                Bienvenue sur le site du <br />{" "}
                <span className="text-primary">Bon Tempérament</span>
              </h1>
              <p className="max-w-2xl text-base md:text-lg lg:text-xl font-light text-gray-500 mb-8">
                Un ensemble vocal et instrumental
              </p>

              <div className="flex flex-col md:flex-row gap-4">
                <Button
                  as={Link}
                  href={RouteNames.CONCERTS.ROOT}
                  size="lg"
                  radius="sm"
                  color="primary"
                  aria-label={"Voir nos concerts"}
                  className=""
                >
                  Nos concerts
                  <IoIosArrowRoundForward className="w-3 h-3 lg:w-5 lg:h-5 ml-2 -mr-1" />
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
        <div className="w-full bg-[#f2f2f2] flex justify-center">
          <div className="max-w-[1440px] w-full">
            <ProjectViewer />
          </div>
        </div>

        <div className="flex flex-col mx-0 max-w-[1440px] py-16 w-full pb-24">
          <div className="mt-[120px] w-full bg-[#F2F2F2] flex flex-col lg:flex-row">
            <div className="w-full lg:w-3/5 flex relative py-8 pl-8 lg:pl-[100px] pr-8 gap-8">
              <div className="flex flex-col gap-8 w-1/2">
                <CloudinaryImage
                  src={"Site/home/home2"}
                  alt="Image accueil 1"
                  width={500}
                  height={270}
                  rounded={RoundedSize.NONE}
                />
                <CloudinaryImage
                  src={"Site/home/home1"}
                  alt="Image accueil 2"
                  width={500}
                  height={270}
                  rounded={RoundedSize.NONE}
                />
              </div>
              <div className="pt-8 w-1/2">
                <CloudinaryImage
                  src={"Site/home/home3"}
                  alt="Image accueil 3"
                  width={500}
                  height={270}
                  rounded={RoundedSize.NONE}
                />
              </div>
            </div>
            <div className="w-full lg:w-2/5 flex flex-col py-8 justify-between items-start pl-8 lg:pl-0 pr-8 lg:pr-16">
              <div className="flex flex-col gap-[20px]">
                <h2
                  className="text-primary/50 font-[300] text-title leading-none"
                  style={{ fontWeight: 300 }}
                >
                  Nous découvrir
                </h2>
                <p className="text-xs md:text-sm lg:text-base leading-[25px] font-light">
                  L&apos;association Le Bon Tempérament est un ensemble vocal et
                  instrumental dirigé par Simone Duclos depuis sa création en
                  1987 qui vise à partager la passion pour la musique de ses
                  membres avec le plus grand nombre.
                </p>
              </div>
              <Link
                href={"/decouvrir"}
                aria-label="Aller à la page Nous Découvrir"
                className="justify-start px-[20px] py-[18px] mt-8 lg:mt-0 bg-white text-[#333]  hover:bg-[#333] hover:text-[#F2F2F2] transition-all flex items-center space-x-[18px]"
              >
                <span className="uppercase text-[12px] tracking-[2.4px]">
                  En apprendre plus
                </span>
                <IoIosArrowRoundForward className=" scale-110" />
              </Link>
            </div>
          </div>

          <div className="mt-[120px] px-8 lg:px-24">
            <h2 className="text-primary/50 font-light text-title leading-none">
              Nos concerts
            </h2>
            <div className="mt-14">
              <ConcertPhotos />

              <div className="flex justify-end mt-[30px]">
                <Link
                  href={"/concerts"}
                  aria-label="Voir nos concerts"
                  className="justify-end px-[20px] py-[18px] bg-[#333] text-white border-[#333] border  hover:bg-white hover:text-[#333] transition-all flex items-center space-x-[18px]"
                >
                  <span className="uppercase text-xs tracking-[2.4px]">
                    Voir tous les concerts
                  </span>
                  <IoIosArrowRoundForward className=" scale-110" />
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-[120px] px-8 lg:px-24">
            <h2 className="text-primary/50 font-light text-title leading-none">
              Nos CDs
            </h2>
            <div className="mt-14">
              <CDPochettePhotos />

              <div className="flex justify-end mt-[30px]">
                <Link
                  href={"/concerts/autres"}
                  aria-label="Voir nos cds actuellement en vente"
                  className="justify-end px-[20px] py-[18px] bg-[#333] text-white border-[#333] border  hover:bg-white hover:text-[#333] transition-all flex items-center space-x-[18px]"
                >
                  <span className="uppercase text-xs tracking-[2.4px]">
                    Acheter nos CDs
                  </span>
                  <IoIosArrowRoundForward className=" scale-110" />
                </Link>
              </div>
            </div>
          </div>
          <ContactForm />
        </div>
      </div>
    </>
  );
};

export default Home;
