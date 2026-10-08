"use client";

import { m, useInView, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

import CloudinaryImage from "@/components/CloudinaryImage";
import { LinkButton } from "@/components/LinkButton";
import ProjectViewer from "@/components/ProjectViewer";
import { useClientValue } from "@/hooks/useClientValue";
import { useAdminStatus, useAnniversaryFeature } from "@/hooks/useFeatureFlag";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { ConcertProject } from "@/types/projects";
import RouteNames from "@/utils/routes";
import { RoundedSize } from "@/utils/types";
import { Button } from "@heroui/react";
import {
  assemblyShortDateLabel,
  isAssemblyUpcoming,
} from "@repo/domain/utils/generalAssemblies";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { IoIosArrowRoundForward, IoIosInformationCircle } from "react-icons/io";

// Below-the-fold islands, fetched when their section comes near the viewport
// (photo albums, the reCAPTCHA contact form) or when first opened (modal):
// none of them is needed to paint the hero.
const ConcertPhotos = dynamic(() => import("@/components/ConcertPhotos"));
const CDPochettePhotos = dynamic(() => import("@/components/CDPochettePhotos"));
const ContactForm = dynamic(() => import("@/components/ContactForm"));
const CalendarInfoModal = dynamic(
  () => import("@/components/home/CalendarInfoModal"),
);

// Mount a lazy section this far before it scrolls into view.
const NEAR_VIEW_MARGIN = "0px 0px 1000px 0px";

// Temporary CTAs, decided in the browser only: the server HTML never shows
// them, so server and client render identically (as the old mount effects did).
const CALENDAR_CTA_DEADLINE = new Date("2026-01-15").getTime();
const isBeforeCalendarDeadline = () => Date.now() < CALENDAR_CTA_DEADLINE;

type HomeContentProps = {
  /** Latest concert stories, loaded by the page on the server. */
  stories?: ConcertProject[];
  /** Start of the newest published general assembly (admin), if any. */
  assemblyHeldAt?: string | null;
};

const HomeContent = ({ stories, assemblyHeldAt }: HomeContentProps) => {
  const { isEnabled: isAnniversaryEnabled } = useAnniversaryFeature();
  const { isAdmin } = useAdminStatus();
  // Must render identically on server and client: measure in the effect below.
  const [maxScrollPx, setMaxScrollPx] = useState<number>(600);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);

  // Calendar button before January 15, 2026; AG button until the AG's day.
  const showCalendarButton = useClientValue(isBeforeCalendarDeadline, false);
  const showAGButton = useClientValue(
    () => (assemblyHeldAt ? isAssemblyUpcoming(assemblyHeldAt) : false),
    false,
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

  // Lazy islands mount ahead of their reveal animation.
  const concertsNear = useInView(concertsRef, {
    once: true,
    margin: NEAR_VIEW_MARGIN,
  });
  const cdsNear = useInView(cdsRef, { once: true, margin: NEAR_VIEW_MARGIN });
  const contactNear = useInView(contactRef, {
    once: true,
    margin: NEAR_VIEW_MARGIN,
  });
  // The modal's code is only fetched once the information button is pressed.
  const [calendarModalLoaded, setCalendarModalLoaded] = useState(false);
  const openInfoModal = () => {
    setCalendarModalLoaded(true);
    setIsInfoModalOpen(true);
  };

  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const onResize = () => setMaxScrollPx(Math.max(window.innerHeight, 200));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const { scrollY } = useScroll();
  const animatedScale = useTransform(scrollY, [0, maxScrollPx], [1, 0.82]);
  const animatedOpacity = useTransform(scrollY, [0, maxScrollPx], [1, 0]);
  const scale = prefersReducedMotion ? 1 : animatedScale;
  const opacity = prefersReducedMotion ? 1 : animatedOpacity;

  return (
    <>
      <div className="relative flex min-h-screen w-full flex-col items-center overflow-x-hidden">
        {/* Hero Section */}
        <m.section
          className="fixed top-0 left-0 z-0 flex h-full w-full justify-center"
          aria-labelledby="hero-title"
          style={{ opacity }}
        >
          {/* Former CSS background (bg-cover bg-center bg-fixed on a fixed,
              viewport-sized section): the same framing as object-cover, now
              resized and converted by the image optimizer and preloaded. */}
          <Image
            src="/img/entre_terre_et_ciel.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={75}
            className="object-cover object-center"
            aria-hidden
          />
          <div
            aria-hidden
            className="absolute inset-0 z-10 h-full bg-black/90"
          />
          <m.div
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
            <div className="mx-auto flex w-full flex-col items-center justify-center px-2 md:w-2/3 md:px-8 lg:col-span-7 lg:px-16">
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
                <LinkButton
                  size="lg"
                  aria-label="Voir nos concerts"
                  variant="primary"
                  href={RouteNames.CONCERTS.ROOT}
                >
                  Nos concerts
                  <IoIosArrowRoundForward
                    className="-mr-1 ml-2 h-3 w-3 lg:h-5 lg:w-5"
                    aria-hidden="true"
                  />
                </LinkButton>
                <LinkButton
                  size="lg"
                  variant="secondary"
                  aria-label="Aller à la section Contact"
                  href="#contact"
                >
                  Nous contacter
                </LinkButton>
              </div>

              {/* Calendar CTA - Temporary until January 15, 2026 */}
              {showCalendarButton && (
                <m.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  className="mt-6 flex w-fit items-center gap-2"
                >
                  <LinkButton
                    size="lg"
                    variant="outline"
                    className="border-white/50 text-white hover:bg-white/10"
                    aria-label="Découvrir le calendrier musical 2025"
                    href="https://view.genially.com/6915ed221c1347062848697b/presentation-calendrier-musical-2025-cadence"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    🎄 Calendrier musical 2025
                    <IoIosArrowRoundForward
                      className="-mr-1 ml-2 h-3 w-3 lg:h-5 lg:w-5"
                      aria-hidden="true"
                    />
                  </LinkButton>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                    aria-label="En savoir plus sur le calendrier musical"
                    onPress={openInfoModal}
                  >
                    <IoIosInformationCircle className="h-5 w-5 lg:h-6 lg:w-6" />
                  </Button>
                </m.div>
              )}

              {/* General assembly CTA, until the day of the AG */}
              {showAGButton && assemblyHeldAt && (
                <m.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  className="mt-6 flex w-fit"
                >
                  <LinkButton
                    size="lg"
                    variant="outline"
                    className="border-white/50 text-white hover:bg-white/10"
                    aria-label="Informations sur l'Assemblée Générale"
                    href={RouteNames.AG}
                  >
                    Assemblée Générale –{" "}
                    {assemblyShortDateLabel(assemblyHeldAt)}
                    <IoIosArrowRoundForward
                      className="-mr-1 ml-2 h-3 w-3 lg:h-5 lg:w-5"
                      aria-hidden="true"
                    />
                  </LinkButton>
                </m.div>
              )}

              {/* Anniversary CTA */}
              {(isAnniversaryEnabled || isAdmin) && (
                <m.div
                  initial={{
                    opacity: 0,
                    scale: prefersReducedMotion ? 1 : 0.9,
                  }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                  className="!md:max-w-md mt-8 flex w-fit overflow-hidden px-4"
                >
                  <LinkButton
                    size="lg"
                    className="hover:shadow-primary/50 from-primary-600 via-primary to-primary-400 dark:from-primary-700 dark:via-primary-600 dark:to-primary-500 flex w-fit max-w-fit rounded-full bg-linear-to-r px-2 py-3 text-xs font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 sm:px-4 sm:text-sm md:w-fit md:max-w-fit md:text-base lg:px-6"
                    aria-label="Célébrer 40 ans du Bon Tempérament"
                    href="/40-ans"
                  >
                    <span className="hidden text-sm sm:text-base md:block md:text-xl">
                      🎉
                    </span>
                    <span className="ml-1 text-center wrap-break-word sm:ml-2">
                      Célébrons les 40 ans du Bon Tempérament !
                    </span>
                    <span className="ml-1 hidden text-sm sm:ml-2 sm:text-base md:block md:text-xl">
                      🎉
                    </span>
                  </LinkButton>
                </m.div>
              )}
            </div>
          </m.div>

          {/* Pulsing Arrow */}
          <button
            type="button"
            className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 transform cursor-pointer"
            onClick={() => {
              window.scrollBy({
                top: window.innerHeight,
                behavior: prefersReducedMotion ? "auto" : "smooth",
              });
            }}
            aria-label="Défiler vers le contenu"
          >
            <m.div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg"
              animate={prefersReducedMotion ? { y: 0 } : { y: [0, 10, 0] }}
              transition={{
                duration: 1.5,
                repeat: prefersReducedMotion ? 0 : Infinity,
                ease: "easeInOut",
              }}
            >
              <svg
                className="h-6 w-6 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </m.div>
          </button>
        </m.section>

        {/* Concert Stories Section */}
        <m.section
          ref={projectsRef}
          className="bg-surface-secondary relative z-10 mt-[100dvh] flex w-full justify-center py-16"
          aria-labelledby="concert-stories-title"
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
          <div className="w-full max-w-360 px-8 lg:px-24">
            <m.h2
              id="concert-stories-title"
              className="text-primary-400 dark:text-primary text-title mb-14 leading-none font-light"
              initial={{ opacity: 0, x: -30 }}
              animate={
                projectsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }
              }
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Histoires de concerts
            </m.h2>
            <p className="text-muted -mt-8 mb-8 max-w-2xl">
              Retrouvez les programmes, les images et les coulisses des concerts
              qui ont marqué notre ensemble.
            </p>
            <m.div
              initial={{ opacity: 0, y: 30 }}
              animate={
                projectsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
              }
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <ProjectViewer initialStories={stories} />
            </m.div>
            <m.div
              className="mt-4 flex justify-center"
              initial={{ opacity: 0 }}
              animate={projectsInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <LinkButton
                aria-label="Lire toutes nos histoires de concerts"
                className="mx-auto"
                variant="primary"
                href="/concerts#histoires"
              >
                Toutes les histoires <IoIosArrowRoundForward />
              </LinkButton>
            </m.div>
          </div>
        </m.section>

        {/* Main Content Container */}
        <div className="bg-background z-10 mx-0 flex w-full flex-col">
          {/* About Section */}
          <m.section
            ref={aboutRef}
            className="mx-auto mt-16 flex w-full max-w-360 flex-col lg:flex-row"
            aria-labelledby="about-title"
            initial={{ opacity: 0 }}
            animate={aboutInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="relative flex w-full max-w-360 gap-8 py-8 pr-8 pl-8 lg:w-3/5 lg:pl-25">
              <div className="flex w-1/2 flex-col gap-8">
                <m.div
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
                </m.div>
                <m.div
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
                </m.div>
              </div>
              <m.div
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
              </m.div>
            </div>
            <m.div
              className="flex w-full flex-col items-start justify-between py-8 pr-8 pl-8 lg:w-2/5 lg:pr-16 lg:pl-0"
              initial={{ opacity: 0, x: 50 }}
              animate={
                aboutInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }
              }
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="flex flex-col gap-5">
                <h2
                  id="about-title"
                  className="text-primary-400 dark:text-primary text-title leading-none font-light"
                  style={{ fontWeight: 300 }}
                >
                  Nous découvrir
                </h2>
                <div className="text-foreground space-y-4 text-xs leading-6.25 font-light md:text-sm lg:text-base">
                  <p>
                    L&apos;association Le Bon Tempérament est un ensemble vocal
                    et instrumental renommé dirigé par Simone Duclos depuis sa
                    création en 1987. Basé à Saverne, en Alsace, notre ensemble
                    se distingue par le mélange des générations, la diversité
                    des parcours des chanteurs et des instrumentistes, et
                    l&apos;esprit de convivialité qui l&apos;anime.
                  </p>
                  <p>
                    Nous visons à partager la passion pour la musique classique,
                    l&apos;opéra baroque, et les œuvres chorales avec le plus
                    grand nombre. Notre répertoire varié couvre une large
                    période musicale de la Renaissance à nos jours, incluant des
                    œuvres de musique classique sacrée et profane, ainsi que des
                    pièces populaires et folkloriques.
                  </p>
                  <p>
                    L&apos;association accorde une place toute particulière aux
                    familles. Les enfants y découvrent la musique à travers le
                    chant, la pratique instrumentale et l&apos;interprétation de
                    spectacles musicaux. Depuis 2023, nous nous sommes enrichis
                    d&apos;un orchestre symphonique dirigé par Charlotte
                    Lienhard, qui se produit seul ou avec la chorale lors des
                    différents{" "}
                    <Link
                      href="/concerts"
                      className="text-primary-text font-medium hover:underline"
                    >
                      concerts
                    </Link>{" "}
                    de l&apos;année.
                  </p>
                </div>
              </div>
              <LinkButton
                variant="outline"
                aria-label="Aller à la page Nous Découvrir pour en apprendre plus sur l'association"
                className="mt-8 lg:mt-0"
                href={"/decouvrir"}
              >
                <span className="text-xs tracking-[2.4px] uppercase">
                  En apprendre plus
                </span>
                <IoIosArrowRoundForward
                  className="scale-110"
                  aria-hidden="true"
                />
              </LinkButton>
            </m.div>
          </m.section>

          {/* Notre Histoire Section */}
          <m.section
            className="bg-surface-secondary mx-auto mt-16 w-full max-w-360 px-8 py-16 lg:px-24"
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
            <m.h2
              id="history-title"
              className="text-primary-400 dark:text-primary text-title mb-8 leading-none font-light"
              initial={{ opacity: 0, x: -30 }}
              animate={
                aboutInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }
              }
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Notre histoire
            </m.h2>
            <m.div
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
                de France, où se peaufine le programme de l&apos;année et où se
                tissent les liens si particuliers entre les membres. Ces moments
                de partage et de convivialité renforcent notre cohésion et notre
                passion commune pour la musique. Découvrez nos{" "}
                <Link
                  href="/concerts"
                  className="text-primary-text font-medium hover:underline"
                >
                  concerts et événements
                </Link>{" "}
                pour voir le résultat de ces répétitions.
              </p>
              <p>
                En 2023, une nouvelle page s&apos;est ouverte avec la création
                de notre orchestre symphonique sous la direction de Charlotte
                Lienhard. Cette évolution nous permet d&apos;enrichir notre
                répertoire et d&apos;offrir des performances encore plus
                variées, alliant la puissance vocale de nos chœurs à la richesse
                instrumentale de notre orchestre.
              </p>
            </m.div>
          </m.section>

          {/* Rejoignez-nous Section */}
          <m.section
            className="bg-background mx-auto mt-16 w-full max-w-360 px-8 py-16 lg:px-24"
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
            <m.div
              className="flex flex-col gap-8 lg:flex-row lg:items-center"
              initial={{ opacity: 0 }}
              animate={aboutInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="flex-1">
                <h2
                  id="join-title"
                  className="text-primary-400 dark:text-primary text-title mb-6 leading-none font-light"
                >
                  Rejoignez-nous
                </h2>
                <div className="text-foreground space-y-4 text-sm leading-relaxed font-light md:text-base">
                  <p>
                    Le Bon Tempérament accueille des choristes amateurs, des
                    chanteurs solistes professionnels et des instrumentistes de
                    tous horizons. Que vous soyez débutant ou expérimenté,
                    passionné de musique classique ou d&apos;opéra baroque, vous
                    trouverez votre place dans notre ensemble.
                  </p>
                  <p>
                    Nous avons différents chœurs adaptés à tous les niveaux : un
                    chœur d&apos;adultes, un chœur de jeunes, et un chœur des
                    tout-jeunes. L&apos;important est la motivation et
                    l&apos;envie de partager la passion pour la musique dans un
                    esprit convivial et familial.
                  </p>
                  <p className="font-medium">
                    Répétitions : Un dimanche par mois, avec des répétitions de
                    pupitres tous les 15 jours. Tournée estivale de dix jours
                    chaque été.
                  </p>
                </div>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <LinkButton
                    size="lg"
                    aria-label="Découvrir comment rejoindre l'ensemble"
                    variant="primary"
                    href={"/rejoindre"}
                  >
                    Rejoindre l&apos;ensemble
                    <IoIosArrowRoundForward className="scale-110" />
                  </LinkButton>
                  <LinkButton
                    variant="outline"
                    size="lg"
                    aria-label="Consulter les questions fréquentes"
                    href={"/faq"}
                  >
                    Questions fréquentes
                    <IoIosArrowRoundForward className="scale-110" />
                  </LinkButton>
                </div>
              </div>
              <div className="flex flex-1 justify-center lg:justify-end">
                <m.div
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
                    alt="Structure du chœur Le Bon Tempérament - Chœurs adultes, jeunes et enfants"
                    width={500}
                    height={400}
                    rounded={RoundedSize.MD}
                  />
                </m.div>
              </div>
            </m.div>
          </m.section>

          {/* Concerts Section */}
          <m.section
            ref={concertsRef}
            className="bg-background mx-auto mt-16 w-full max-w-360 px-8 py-16 lg:px-24"
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
            <m.h2
              id="concerts-title"
              className="text-primary-400 dark:text-primary text-title leading-none font-light"
              initial={{ opacity: 0, x: -30 }}
              animate={
                concertsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }
              }
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Nos concerts
            </m.h2>
            <m.div
              className="mt-14"
              initial={{ opacity: 0, y: 30 }}
              animate={
                concertsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
              }
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {concertsNear && <ConcertPhotos />}

              <div className="mt-7.5 flex justify-end">
                <LinkButton
                  variant="outline"
                  aria-label="Voir tous nos concerts"
                  href={"/concerts"}
                >
                  <span className="text-xs tracking-[2.4px] uppercase">
                    Voir tous les concerts
                  </span>
                  <IoIosArrowRoundForward
                    className="scale-110"
                    aria-hidden="true"
                  />
                </LinkButton>
              </div>
            </m.div>
          </m.section>

          {/* CDs Section */}
          <m.section
            ref={cdsRef}
            className="bg-surface-secondary mx-auto w-full max-w-360 px-8 py-16 lg:px-24"
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
            <m.h2
              id="cds-title"
              className="text-primary-400 dark:text-primary text-title leading-none font-light"
              initial={{ opacity: 0, x: -30 }}
              animate={
                cdsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }
              }
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Nos CDs
            </m.h2>
            <m.div
              className="mt-14"
              initial={{ opacity: 0, y: 30 }}
              animate={cdsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {cdsNear && <CDPochettePhotos />}

              <div className="mt-7.5 flex justify-end">
                <LinkButton
                  variant="outline"
                  aria-label="Voir nos CDs actuellement en vente"
                  href={"/concerts/autres"}
                >
                  <span className="text-xs tracking-[2.4px] uppercase">
                    Acheter nos CDs
                  </span>
                  <IoIosArrowRoundForward
                    className="scale-110"
                    aria-hidden="true"
                  />
                </LinkButton>
              </div>
            </m.div>
          </m.section>

          {/* Contact Section */}
          <m.div
            ref={contactRef}
            // The wrapper answers the hero's "#contact" link until the form
            // (which carries the id) has mounted; the placeholder keeps the
            // page about as tall as the form so the footer does not jump.
            id={contactNear ? undefined : "contact"}
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
            {contactNear ? (
              <ContactForm />
            ) : (
              <div
                aria-hidden
                className="mx-auto min-h-[48rem] w-full max-w-[1440px] px-8 py-16 lg:px-24"
              />
            )}
          </m.div>
        </div>
      </div>

      {/* Calendar Info Modal */}
      {calendarModalLoaded && (
        <CalendarInfoModal
          isOpen={isInfoModalOpen}
          onOpenChange={setIsInfoModalOpen}
        />
      )}
    </>
  );
};

export default HomeContent;
