"use client";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export const MembresLandingPage = () => {
  type GridItem = {
    title: string;
    description: string;
    href: string;
    target?: "_blank" | "_self";
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

    const matches = fullName.match(/^([A-Za-z]+(?:-[A-Za-z]+)*)/);

    if (matches) {
      return matches[0];
    }

    const parts = fullName.split(/(?=[A-Z]{2,})/);
    return parts[0]?.trim();
  };

  const displayName =
    user?.user_metadata.display_name || user?.user_metadata.name;
  const firstName = getFirstName(displayName);

  const gridItems: GridItem[] = [
    {
      title: "Répétitions",
      description:
        "Voir les prochaines répétitions ainsi que le calendrier complet",
      href: "/membres/repetitions",
      target: "_self",
    },
    {
      title: "Travail",
      description:
        "Accéder aux partitions et autres éléments utiles pour travailler",
      href: "/membres/travail",
      target: "_self",
    },
    {
      title: "Concerts et évènements",
      description: "Consulter les prochains concerts et évènements à venir",
      href: "/membres/concerts",
      target: "_self",
    },
    {
      title: "Accès direct au Drive",
      description: "Ouvrir le Google Drive du Bon Tempérament",
      href: "https://drive.google.com/drive/folders/1oQGEse5USfg9KhM7dZv7_w6olmk_slaU",
      target: "_blank",
    },
  ];

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
  };

  return (
    <div className="w-full flex flex-col justify-center items-center contain relative">
      <Image
        src={"/img/violin.webp"}
        alt="violin"
        width={300}
        height={200}
        className="w-xl md:w-4xl lg:w-7xl aspect-square opacity-5 mask-cover bg-cover"
        style={{
          height: "auto",
          maskImage:
            "radial-gradient(circle at center, black 50%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 50%, transparent 100%)",
        }}
        sizes="(max-width: 400px) 300px, (max-width: 1200px) 400px, 500px"
      />
      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-full flex flex-col items-center max-w-7xl">
        {" "}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-2xl md:text-3xl lg:text-5xl xl:text-7xl transition-[font-size] duration-400 text-center hyphens-auto font-extrabold bg-gradient-to-r from-primary via-white/50 to-purple-500 inline-block text-transparent bg-clip-text"
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
          className="text-base hyphens-auto text-white/50 mt-4 max-w-xl text-center"
        >
          Ici, tu peux retrouver tout ce qui est relatif à la vie du{" "}
          <b>Bon Tempérament</b>.<br /> Tu trouveras ci-dessous les liens les
          plus utiles...
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="mx-auto mt-16 w-full"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full max-w-3xl mx-auto">
            {gridItems.map((item, index) => (
              <Link href={item.href} key={index} target={item.target}>
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="active"
                  className="group relative overflow-hidden rounded-xl h-full"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                  <div className="relative z-10 p-6 bg-background/5 backdrop-blur-md group-hover:bg-background/10 transition-all h-full">
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.3 + 0.2 * index,
                      }}
                      className="font-bold text-primary"
                    >
                      {item.title}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.4 + 0.2 * index,
                      }}
                      className="text-background/50 text-sm"
                    >
                      {item.description}
                    </motion.p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
