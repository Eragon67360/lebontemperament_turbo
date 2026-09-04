"use client";

import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { AnimatePresence, motion, Variants } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  IoCalendarClear,
  IoCalendarOutline,
  IoClose,
  IoCloudDownloadOutline,
  IoDocumentTextOutline,
  IoLogoWhatsapp,
  IoMusicalNotesOutline,
  IoPeopleOutline,
  IoTicketOutline,
} from "react-icons/io5";

// --- SUB-COMPONENT: The Floating Beta Invite ---
const BetaInviteToast = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed right-4 bottom-4 z-50 w-[calc(100%-2rem)] max-w-sm md:right-6"
      >
        <div className="bg-background/80 border-primary/20 relative overflow-hidden rounded-2xl border p-4 shadow-xl backdrop-blur-md">
          {/* Close Button */}
          <button
            onClick={() => setIsVisible(false)}
            className="text-foreground/40 hover:text-foreground absolute top-3 right-3 transition-colors"
            aria-label="Fermer"
          >
            <IoClose size={18} />
          </button>

          <div className="flex items-start gap-4">
            {/* Icon Box */}
            <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl">
              📱
            </div>

            {/* Text Content */}
            <div className="flex flex-col gap-1 pr-4">
              <h4 className="text-foreground text-sm font-semibold">
                Le futur est mobile
              </h4>
              <p className="text-foreground/60 text-xs leading-relaxed">
                Envie de tester notre nouvelle app Android en avant-première ?
              </p>

              <Link
                href={`https://wa.me/33647849308?text=${encodeURIComponent(
                  "Salut Thomas ! Je suis chaud pour tester l'app mobile 🧪",
                )}`}
                target="_blank"
                className="mt-2 flex w-fit items-center gap-2 text-xs font-medium text-green-600 transition-colors hover:text-green-700 hover:underline"
              >
                <IoLogoWhatsapp />
                Rejoindre la beta
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// --- MAIN COMPONENT ---
export const MembresLandingPage = () => {
  type GridItem = {
    title: string;
    description: string;
    href: string;
    target?: "_blank" | "_self";
    icon: React.ElementType;
  };

  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };
    getUser();
  }, [supabase]);

  const getFirstName = (fullName: string) => {
    if (!fullName) return "";
    const matches = fullName.match(/^([\p{L}]+(?:-[\p{L}]+)*)/u);
    if (matches) return matches[0];
    const parts = fullName.split(/(?=[A-Z]{2,})/);
    return parts[0]?.trim();
  };

  const displayName =
    user?.user_metadata.display_name || user?.user_metadata.name;
  const firstName = getFirstName(displayName);

  const gridItems: GridItem[] = useMemo(
    () => [
      {
        title: "Partitions",
        description: "Accéder aux partitions et documents",
        href: "/membres/travail",
        target: "_self" as const,
        icon: IoMusicalNotesOutline,
      },
      {
        title: "Calendrier",
        description: "Prochaines répétitions et agenda",
        href: "/membres/calendrier",
        target: "_self" as const,
        icon: IoCalendarOutline,
      },
      {
        title: "Concerts",
        description: "Les dates de concerts à venir",
        href: "/membres/concerts#concerts",
        target: "_self" as const,
        icon: IoTicketOutline,
      },
      {
        title: "Événements",
        description: "Répétitions, ventes et autres",
        href: "/membres/concerts#evenements",
        target: "_self" as const,
        icon: IoCalendarClear,
      },
      {
        title: "Membres",
        description: "L'annuaire du Bon Tempérament",
        href: "/membres/membres",
        target: "_self" as const,
        icon: IoPeopleOutline,
      },
      {
        title: "Administration",
        description: "Archives, règlement, gazettes",
        href: "/membres/administration",
        target: "_self" as const,
        icon: IoDocumentTextOutline,
      },
      {
        title: "Accès Drive",
        description: "Accès direct au Google Drive",
        href: "https://drive.google.com/drive/folders/1oQGEse5USfg9KhM7dZv7_w6olmk_slaU",
        target: "_blank" as const,
        icon: IoCloudDownloadOutline,
      },
    ],
    [],
  );

  // FIX: Explicitly type these as Variants to solve the TS error
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring", // TypeScript now knows this is a valid literal
        stiffness: 260,
        damping: 20,
      },
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-start overflow-x-hidden p-4 pt-8 pb-44 md:justify-center md:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center">
        {/* Header Section */}
        <div className="mb-8 flex w-full flex-col items-center text-center md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="from-primary bg-linear-to-r via-purple-500 to-pink-500 bg-clip-text text-3xl font-extrabold wrap-break-word text-transparent md:text-5xl lg:text-6xl"
          >
            Bienvenue, {firstName}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-foreground/60 mt-3 max-w-lg text-sm leading-relaxed font-medium md:text-base"
          >
            L&apos;espace membre du <b>Bon Tempérament</b>.<br />
            Retrouve tes outils de choriste en un clic.
          </motion.p>
        </div>

        {/* The Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {gridItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                href={item.href}
                key={item.href}
                target={item.target}
                rel={
                  item.target === "_blank" ? "noopener noreferrer" : undefined
                }
                className="h-full"
              >
                <motion.div
                  variants={itemVariants}
                  whileHover="hover"
                  whileTap={{ scale: 0.98 }}
                  className="group bg-default-50/50 hover:bg-default-100 border-primary/5 hover:border-primary/20 relative flex h-full flex-col gap-3 rounded-xl border p-4 backdrop-blur-sm transition-colors"
                >
                  {/* Hover Glow Effect */}
                  <div className="bg-primary/20 absolute -top-4 -right-4 h-20 w-20 rounded-full opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-40" />

                  <div className="flex items-start justify-between">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-col gap-1">
                    <h3 className="text-foreground text-base font-bold">
                      {item.title}
                    </h3>
                    <p className="text-foreground/50 text-xs leading-snug md:text-sm">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>
      </div>

      {/* The redesigned, less prominent beta invite */}
      <BetaInviteToast />
    </div>
  );
};
