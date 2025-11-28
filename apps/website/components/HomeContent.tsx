"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

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
    typeof window !== "undefined" ? Math.max(window.innerHeight, 200) : 600,
  );

  // Refs for each section
  const projectsRef = useRef(null);
  const aboutRef = useRef(null);
  const concertsRef = useRef(null);
  const cdsRef = useRef(null);
  const contactRef = useRef(null);

  // In view detection for each section
  const projectsInView = useInView(projectsRef, { once: true, amount: 0.3 });
  const aboutInView = useInView(aboutRef, { once: true, amount: 0.3 });
  const concertsInView = useInView(concertsRef, { once: true, amount: 0.3 });
  const cdsInView = useInView(cdsRef, { once: true, amount: 0.3 });
  const contactInView = useInView(contactRef, { once: true, amount: 0.3 });

  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setMaxScrollPx(Math.max(window.innerHeight, 200));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const { scrollY } = useScroll();
  const scale = prefersReducedMotion
    ? 1
    : useTransform(scrollY, [0, maxScrollPx], [1, 0.82]);
  const opacity = prefersReducedMotion
    ? 1
    : useTransform(scrollY, [0, maxScrollPx], [1, 0]);

  return (
    <>
      <div className="relative flex min-h-screen w-full flex-col items-center overflow-x-hidden">
        {/* Hero Section */}
        <motion.section
          className="fixed top-0 left-0 z-0 flex h-full w-full justify-center bg-[url('/img/entre_terre_et_ciel.jpg')] bg-cover bg-fixed bg-center"
          aria-labelledby="hero-title"
          style={{ opacity }}
        >
          <div
            aria-hidden
            className="absolute inset-0 z-10 h-full bg-black/90"
          />
          <motion.div
            className="relative z-20 flex w-full justify-between gap-32 px-4 py-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5 }}
            style={{
              scale,
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

          {/* Pulsing Arrow */}
          <div
            className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 transform cursor-pointer"
            onClick={() => {
              window.scrollBy({
                top: window.innerHeight,
                behavior: "smooth",
              });
            }}
            aria-label="Scroll down"
          >
            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg"
              animate={{ y: [0, 10, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <svg
                className="h-6 w-6 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </motion.div>
          </div>
        </motion.section>

        {/* Projects Section */}
        <motion.section
          ref={projectsRef}
          className="bg-default-50 relative z-10 mt-[100dvh] flex w-full justify-center py-16"
          aria-labelledby="projects-title"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 50 }}
          animate={
            projectsInView
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: prefersReducedMotion ? 0 : 50 }
          }
          transition={{
            duration: prefersReducedMotion ? 0.1 : 0.8,
            ease: "easeOut",
          }}
        >
          <div className="w-full max-w-[1440px] px-8 lg:px-24">
            <motion.h2
              id="projects-title"
              className="text-primary/50 dark:text-primary text-title mb-14 leading-none font-light"
              initial={{ opacity: 0, x: -30 }}
              animate={
                projectsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }
              }
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Nos derniers projets
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={
                projectsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
              }
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <ProjectViewer />
            </motion.div>
            <motion.div
              className="mt-4 flex justify-center"
              initial={{ opacity: 0 }}
              animate={projectsInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
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
            </motion.div>
          </div>
        </motion.section>

        {/* Main Content Container */}
        <div className="bg-background z-10 mx-0 flex w-full flex-col">
          {/* About Section */}
          <motion.section
            ref={aboutRef}
            className="mx-auto mt-16 flex w-full max-w-[1440px] flex-col lg:flex-row"
            aria-labelledby="about-title"
            initial={{ opacity: 0 }}
            animate={aboutInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="relative flex w-full max-w-[1440px] gap-8 py-8 pr-8 pl-8 lg:w-3/5 lg:pl-[100px]">
              <div className="flex w-1/2 flex-col gap-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={
                    aboutInView
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.9 }
                  }
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <CloudinaryImage
                    src={"Site/home/home2"}
                    alt="Performance de l'ensemble Le Bon Tempérament"
                    width={500}
                    height={270}
                    rounded={RoundedSize.NONE}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={
                    aboutInView
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.9 }
                  }
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <CloudinaryImage
                    src={"Site/home/home1"}
                    alt="Membres de l'ensemble en concert"
                    width={500}
                    height={270}
                    rounded={RoundedSize.NONE}
                  />
                </motion.div>
              </div>
              <motion.div
                className="w-1/2 pt-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={
                  aboutInView
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.9 }
                }
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <CloudinaryImage
                  src={"Site/home/home3"}
                  alt="Répétition de l'ensemble vocal et instrumental"
                  width={500}
                  height={270}
                  rounded={RoundedSize.NONE}
                />
              </motion.div>
            </div>
            <motion.div
              className="flex w-full flex-col items-start justify-between py-8 pr-8 pl-8 lg:w-2/5 lg:pr-16 lg:pl-0"
              initial={{ opacity: 0, x: 50 }}
              animate={
                aboutInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }
              }
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="flex flex-col gap-[20px]">
                <h2
                  id="about-title"
                  className="text-primary/50 dark:text-primary text-title leading-none font-[300]"
                  style={{ fontWeight: 300 }}
                >
                  Nous découvrir
                </h2>
                <div className="text-foreground space-y-4 text-xs leading-[25px] font-light md:text-sm lg:text-base">
                  <p>
                    L'association Le Bon Tempérament est un ensemble vocal et
                    instrumental renommé dirigé par Simone Duclos depuis sa
                    création en 1987. Basé à Saverne, en Alsace, notre ensemble
                    se distingue par le mélange des générations, la diversité
                    des parcours des chanteurs et des instrumentistes, et
                    l'esprit de convivialité qui l'anime.
                  </p>
                  <p>
                    Nous visons à partager la passion pour la musique classique,
                    l'opéra baroque, et les œuvres chorales avec le plus grand
                    nombre. Notre répertoire varié couvre une large période
                    musicale de la Renaissance à nos jours, incluant des œuvres
                    de musique classique sacrée et profane, ainsi que des pièces
                    populaires et folkloriques.
                  </p>
                  <p>
                    L'association accorde une place toute particulière aux
                    familles. Les enfants y découvrent la musique à travers le
                    chant, la pratique instrumentale et l'interprétation de
                    spectacles musicaux. Depuis 2023, nous nous sommes enrichis
                    d'un orchestre symphonique dirigé par Charlotte Lienhard,
                    qui se produit seul ou avec la chorale lors des différents
                    concerts de l'année.
                  </p>
                </div>
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
            </motion.div>
          </motion.section>

          {/* Notre Histoire Section */}
          <motion.section
            className="bg-default-50 mx-auto mt-16 w-full max-w-[1440px] px-8 py-16 lg:px-24"
            aria-labelledby="history-title"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 50 }}
            animate={
              aboutInView
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: prefersReducedMotion ? 0 : 50 }
            }
            transition={{
              duration: prefersReducedMotion ? 0.1 : 0.8,
              ease: "easeOut",
              delay: 0.2,
            }}
          >
            <motion.h2
              id="history-title"
              className="text-primary/50 dark:text-primary text-title mb-8 leading-none font-light"
              initial={{ opacity: 0, x: -30 }}
              animate={
                aboutInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }
              }
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Notre histoire
            </motion.h2>
            <motion.div
              className="text-foreground space-y-4 text-sm leading-relaxed font-light md:text-base lg:text-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={
                aboutInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
              }
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <p>
                Fondé en 1987 par Simone Duclos, Le Bon Tempérament a évolué au
                fil des décennies pour devenir un ensemble reconnu dans la
                région alsacienne et au-delà. Notre histoire est marquée par
                plusieurs moments clés qui ont façonné notre identité musicale
                et notre esprit communautaire.
              </p>
              <p>
                Chaque été, nous organisons des séjours dans différentes régions
                de France, où se peaufine le programme de l'année et où se
                tissent les liens si particuliers entre les membres. Ces moments
                de partage et de convivialité renforcent notre cohésion et notre
                passion commune pour la musique.
              </p>
              <p>
                En 2023, une nouvelle page s'est ouverte avec la création de
                notre orchestre symphonique sous la direction de Charlotte
                Lienhard. Cette évolution nous permet d'enrichir notre
                répertoire et d'offrir des performances encore plus variées,
                alliant la puissance vocale de nos chœurs à la richesse
                instrumentale de notre orchestre.
              </p>
            </motion.div>
          </motion.section>

          {/* Rejoignez-nous Section */}
          <motion.section
            className="bg-background mx-auto mt-16 w-full max-w-[1440px] px-8 py-16 lg:px-24"
            aria-labelledby="join-title"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 50 }}
            animate={
              aboutInView
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: prefersReducedMotion ? 0 : 50 }
            }
            transition={{
              duration: prefersReducedMotion ? 0.1 : 0.8,
              ease: "easeOut",
              delay: 0.4,
            }}
          >
            <motion.div
              className="flex flex-col gap-8 lg:flex-row lg:items-center"
              initial={{ opacity: 0 }}
              animate={aboutInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="flex-1">
                <h2
                  id="join-title"
                  className="text-primary/50 dark:text-primary text-title mb-6 leading-none font-light"
                >
                  Rejoignez-nous
                </h2>
                <div className="text-foreground space-y-4 text-sm leading-relaxed font-light md:text-base">
                  <p>
                    Le Bon Tempérament accueille des choristes amateurs, des
                    chanteurs solistes professionnels et des instrumentistes de
                    tous horizons. Que vous soyez débutant ou expérimenté,
                    passionné de musique classique ou d'opéra baroque, vous
                    trouverez votre place dans notre ensemble.
                  </p>
                  <p>
                    Nous avons différents chœurs adaptés à tous les niveaux : un
                    chœur d'adultes, un chœur de jeunes, et un chœur des
                    tout-jeunes. L'important est la motivation et l'envie de
                    partager la passion pour la musique dans un esprit convivial
                    et familial.
                  </p>
                  <p className="font-medium">
                    Répétitions : Un dimanche par mois, avec des répétitions de
                    pupitres tous les 15 jours. Tournée estivale de dix jours
                    chaque été.
                  </p>
                </div>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Button
                    as={Link}
                    href={"/contact"}
                    color="primary"
                    radius="sm"
                    size="lg"
                    aria-label="Nous contacter pour rejoindre l'ensemble"
                  >
                    Nous contacter
                    <IoIosArrowRoundForward className="scale-110" />
                  </Button>
                  <Button
                    as={Link}
                    href={"/faq"}
                    variant="bordered"
                    radius="sm"
                    size="lg"
                    aria-label="Consulter les questions fréquentes"
                  >
                    Questions fréquentes
                    <IoIosArrowRoundForward className="scale-110" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-1 justify-center lg:justify-end">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={
                    aboutInView
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.9 }
                  }
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <CloudinaryImage
                    src={"Site/découvrir/choeurs/choeur"}
                    alt="Structure du chœur Le Bon Tempérament"
                    width={500}
                    height={400}
                    rounded={RoundedSize.MD}
                  />
                </motion.div>
              </div>
            </motion.div>
          </motion.section>

          {/* Concerts Section */}
          <motion.section
            ref={concertsRef}
            className="bg-background mx-auto mt-16 w-full max-w-[1440px] px-8 py-16 lg:px-24"
            aria-labelledby="concerts-title"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 50 }}
            animate={
              concertsInView
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: prefersReducedMotion ? 0 : 50 }
            }
            transition={{
              duration: prefersReducedMotion ? 0.1 : 0.8,
              ease: "easeOut",
            }}
          >
            <motion.h2
              id="concerts-title"
              className="text-primary/50 dark:text-primary text-title leading-none font-light"
              initial={{ opacity: 0, x: -30 }}
              animate={
                concertsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }
              }
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Nos concerts
            </motion.h2>
            <motion.div
              className="mt-14"
              initial={{ opacity: 0, y: 30 }}
              animate={
                concertsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
              }
              transition={{ duration: 0.6, delay: 0.4 }}
            >
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
            </motion.div>
          </motion.section>

          {/* CDs Section */}
          <motion.section
            ref={cdsRef}
            className="bg-default-50 mx-auto w-full max-w-[1440px] px-8 py-16 lg:px-24"
            aria-labelledby="cds-title"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 50 }}
            animate={
              cdsInView
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: prefersReducedMotion ? 0 : 50 }
            }
            transition={{
              duration: prefersReducedMotion ? 0.1 : 0.8,
              ease: "easeOut",
            }}
          >
            <motion.h2
              id="cds-title"
              className="text-primary/50 dark:text-primary text-title leading-none font-light"
              initial={{ opacity: 0, x: -30 }}
              animate={
                cdsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }
              }
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Nos CDs
            </motion.h2>
            <motion.div
              className="mt-14"
              initial={{ opacity: 0, y: 30 }}
              animate={cdsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
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
            </motion.div>
          </motion.section>

          {/* Contact Section */}
          <motion.div
            ref={contactRef}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 50 }}
            animate={
              contactInView
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: prefersReducedMotion ? 0 : 50 }
            }
            transition={{
              duration: prefersReducedMotion ? 0.1 : 0.8,
              ease: "easeOut",
            }}
          >
            <ContactForm />
          </motion.div>

          <Footer />
        </div>
      </div>
    </>
  );
};

export default HomeContent;
