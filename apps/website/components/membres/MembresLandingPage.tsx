"use client";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  IoCalendarOutline,
  IoCloudDownloadOutline,
  IoDocumentTextOutline,
  IoMusicalNotesOutline,
  IoPeopleOutline,
  IoTicketOutline,
} from "react-icons/io5";

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

    if (matches) {
      return matches[0];
    }

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
        description: "Accéder aux partitions et autres documents de travail",
        href: "/membres/travail",
        target: "_self" as const,
        icon: IoMusicalNotesOutline,
      },
      {
        title: "Calendrier",
        description:
          "Consulter les prochaines répétitions et le calendrier complet",
        href: "/membres/calendrier",
        target: "_self" as const,
        icon: IoCalendarOutline,
      },
      {
        title: "Concerts",
        description: "Voir les prochains concerts et évènements à venir",
        href: "/membres/concerts",
        target: "_self" as const,
        icon: IoTicketOutline,
      },
      {
        title: "Membres",
        description: "Consulter la liste des membres du Bon Tempérament",
        href: "/membres/membres",
        target: "_self" as const,
        icon: IoPeopleOutline,
      },
      {
        title: "Administration",
        description: "Archives, règlement intérieur, gazettes et logiciels",
        href: "/membres/administration",
        target: "_self" as const,
        icon: IoDocumentTextOutline,
      },
      {
        title: "Accès direct au Drive",
        description: "Ouvrir le Google Drive du Bon Tempérament",
        href: "https://drive.google.com/drive/folders/1oQGEse5USfg9KhM7dZv7_w6olmk_slaU",
        target: "_blank" as const,
        icon: IoCloudDownloadOutline,
      },
    ],
    [],
  );

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.3 },
    },
    active: {
      scale: 1.0,
    },
  } as const;

  return (
    <div className="relative container mx-auto flex w-full flex-col items-center py-8 md:py-12 lg:py-16">
      <div className="flex w-full flex-col items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="from-primary via-foreground/50 inline-block bg-gradient-to-r to-purple-500 bg-clip-text text-center text-2xl font-extrabold hyphens-auto text-transparent transition-[font-size] duration-400 md:text-3xl lg:text-5xl xl:text-7xl"
        >
          Bienvenue, <br />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
          >
            {firstName}
          </motion.span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-foreground/50 mt-4 max-w-xl text-center text-sm hyphens-auto md:text-base"
        >
          Ici, tu peux retrouver tout ce qui est relatif à la vie du{" "}
          <b>Bon Tempérament</b>.<br /> Tu trouveras ci-dessous les liens les
          plus utiles...
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="container mx-auto mt-6 w-full md:mt-10 lg:mt-16"
        >
          <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
            {gridItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  href={item.href}
                  key={item.href}
                  target={item.target}
                  rel={
                    item.target === "_blank" ? "noopener noreferrer" : undefined
                  }
                  aria-label={item.description}
                >
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    whileTap="active"
                    className="group relative h-full overflow-hidden rounded-xl"
                  >
                    <div className="from-primary/20 absolute inset-0 z-0 bg-gradient-to-r to-purple-500/90 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"></div>
                    <div className="bg-default-100/80 group-hover:bg-default-200/80 relative z-10 flex h-full flex-col gap-2 px-4 py-4 backdrop-blur-sm transition-all md:px-5 md:py-6">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.2 + 0.1 * index,
                        }}
                        className="bg-primary/10 text-primary w-fit rounded-lg p-2 transition-transform group-hover:scale-110"
                      >
                        <Icon className="h-6 w-6" />
                      </motion.div>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.3 + 0.1 * index,
                        }}
                        className="text-primary text-sm font-bold md:text-base"
                      >
                        {item.title}
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.4 + 0.1 * index,
                        }}
                        className="text-foreground/50 text-xs md:text-sm"
                      >
                        {item.description}
                      </motion.p>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
