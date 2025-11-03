"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";

import CDPochettePhotos from "@/components/CDPochettePhotos";
import CloudinaryImage from "@/components/CloudinaryImage";
import ConcertPhotos from "@/components/ConcertPhotos";
import ContactForm from "@/components/ContactForm";
import ProjectViewer from "@/components/ProjectViewer";
import RouteNames from "@/utils/routes";
import { RoundedSize } from "@/utils/types";
import { Button, Link } from "@heroui/react";
import { IoIosArrowRoundForward } from "react-icons/io";
import Footer from "./Footer";

const HomeContent = () => {
  const [maxScrollPx, setMaxScrollPx] = useState<number>(() =>
    typeof window !== "undefined"
      ? Math.max(window.innerHeight * 0.6, 200)
      : 600,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () =>
      setMaxScrollPx(Math.max(window.innerHeight * 0.6, 200));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const { scrollY } = useScroll();
  const prefersReduced = useReducedMotion();
  const scale = prefersReduced
    ? 1
    : useTransform(scrollY, [0, maxScrollPx], [1, 0.82]);
  const opacity = prefersReduced
    ? 1
    : useTransform(scrollY, [0, maxScrollPx], [1, 0.2]);

  return (
    <>
      <div className="relative flex w-full flex-col items-center">
        {/* Hero Section */}
        <section
          className="fixed top-0 left-0 z-0 flex h-screen w-full justify-center bg-[url('/img/entre_terre_et_ciel.jpg')] bg-cover bg-fixed bg-center"
          aria-labelledby="hero-title"
        >
          <div aria-hidden className="absolute inset-0 z-10 bg-black/90" />
          <motion.div
            className="relative z-20 flex w-full justify-between gap-32 px-4 py-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5 }}
            style={{
              scale,
              opacity,
              transformOrigin: "center",
              willChange: "transform, opacity",
            }}
          >
            <div className="mx-auto flex w-full flex-col items-center justify-center px-8 md:w-2/3 md:px-16 lg:col-span-7 lg:px-8">
              <h1
                id="hero-title"
                className="mb-2 text-center leading-none font-extrabold tracking-tight text-white"
              >
                <span className="text-base font-light md:text-lg lg:text-xl">
                  Bienvenue sur le site du <br />{" "}
                </span>
                <span className="text-primary text-4xl md:text-5xl lg:text-8xl">
                  Bon Tempérament
                </span>
              </h1>
              <p className="mb-8 max-w-2xl text-sm font-light text-white/75 md:text-lg lg:text-xl">
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
                  variant="solid"
                  aria-label="Aller à la section Contact"
                >
                  Nous contacter
                </Button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Projects Section */}
        <section
          className="relative z-10 mt-[100dvh] flex w-full justify-center bg-[#f2f2f2] py-16"
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
            <div className="mt-4 flex justify-center">
              <Button
                as={Link}
                href="/concerts#projects-section"
                color="primary"
                radius="sm"
                aria-label="Voir tous nos projets"
                className="mx-auto"
              >
                Voir tous nos projets <IoIosArrowRoundForward />
              </Button>
            </div>
          </div>
        </section>

        {/* Main Content Container */}
        <div className="z-10 mx-0 flex w-full flex-col bg-white">
          {/* About Section */}
          <section
            className="mx-auto mt-16 flex w-full max-w-[1440px] flex-col lg:flex-row"
            aria-labelledby="about-title"
          >
            <div className="relative flex w-full max-w-[1440px] gap-8 py-8 pr-8 pl-8 lg:w-3/5 lg:pl-[100px]">
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
              <Button
                as={Link}
                href={"/decouvrir"}
                variant="bordered"
                radius="sm"
                aria-label="Aller à la page Nous Découvrir pour en apprendre plus sur l'association"
                className="mt-8 lg:mt-0"
              >
                <span className="text-xs tracking-[2.4px] uppercase">
                  En apprendre plus
                </span>
                <IoIosArrowRoundForward
                  className="scale-110"
                  aria-hidden="true"
                />
              </Button>
            </div>
          </section>

          {/* Concerts Section */}
          <section
            className="mx-auto mt-16 w-full max-w-[1440px] bg-white px-8 py-16 lg:px-24"
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
                <Button
                  as={Link}
                  href={"/concerts"}
                  variant="bordered"
                  radius="sm"
                  aria-label="Voir tous nos concerts"
                >
                  <span className="text-xs tracking-[2.4px] uppercase">
                    Voir tous les concerts
                  </span>
                  <IoIosArrowRoundForward
                    className="scale-110"
                    aria-hidden="true"
                  />
                </Button>
              </div>
            </div>
          </section>

          {/* CDs Section */}
          <section
            className="mx-auto w-full max-w-[1440px] bg-[#f8f8f8] px-8 py-16 lg:px-24"
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
                <Button
                  as={Link}
                  href={"/concerts/autres"}
                  variant="bordered"
                  radius="sm"
                  aria-label="Voir nos CDs actuellement en vente"
                >
                  <span className="text-xs tracking-[2.4px] uppercase">
                    Acheter nos CDs
                  </span>
                  <IoIosArrowRoundForward
                    className="scale-110"
                    aria-hidden="true"
                  />
                </Button>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <ContactForm />
          <Footer />
        </div>
      </div>
    </>
  );
};

export default HomeContent;
