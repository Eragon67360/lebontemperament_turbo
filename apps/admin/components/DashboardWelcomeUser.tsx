"use client";

import { PageHeader } from "@/components/layouts/PageHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { motion } from "motion/react";

/** « Bonjour, prénom » and what the home shows, as the page's header. */
export function DashboardWelcomeHeader() {
  const { data: user } = useCurrentUser();

  const displayName =
    user?.user_metadata.display_name || user?.user_metadata.name;

  return (
    <PageHeader
      className="shrink-0 pt-4 sm:pt-6"
      title={
        <>
          Bonjour,{" "}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-primary-text"
          >
            {displayName}
          </motion.span>
        </>
      }
      intro="Voici ce qu’il se passe sur votre espace d’administration."
    />
  );
}
