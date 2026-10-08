"use client";

import { LinkButton } from "@/components/LinkButton";
import { AlertCircle, Clock, SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { IoHome } from "react-icons/io5";

export type CodeStatus = "not_found" | "rate_limited" | "error";

const CONTENT: Record<
  CodeStatus,
  { icon: ReactNode; title: string; body: string }
> = {
  not_found: {
    icon: <SearchX className="h-7 w-7" aria-hidden />,
    title: "Ce code ne correspond à aucune livraison en cours",
    body: "Les codes cessent de fonctionner une fois la tournée terminée. Vérifiez le code reçu par SMS : il s’écrit sans tenir compte des majuscules ni du tiret.",
  },
  rate_limited: {
    icon: <Clock className="h-7 w-7" aria-hidden />,
    title: "Trop d’essais : réessayez dans une heure.",
    body: "Pour protéger les livraisons, nous limitons le nombre de codes essayés depuis un même appareil.",
  },
  error: {
    icon: <AlertCircle className="h-7 w-7" aria-hidden />,
    title: "Une erreur est survenue",
    body: "Nous n’avons pas pu vérifier votre code. Réessayez dans un instant en rechargeant la page.",
  },
};

/**
 * What `/l/<code>` shows when the code opens nothing (#593): a short, calm
 * message and the way back to the site, in the site's look rather than the
 * tracking view's, since there is no delivery to show.
 */
export function CodeStatusPage({ status }: { status: CodeStatus }) {
  const { icon, title, body } = CONTENT[status];
  return (
    <section
      aria-labelledby="code-status-title"
      className="flex min-h-dvh w-full items-center justify-center bg-gray-50 p-4 dark:bg-gray-950"
    >
      <div className="bg-background w-full max-w-md rounded-2xl p-6 text-center shadow-xl sm:p-8">
        <div className="bg-primary-50 dark:bg-primary-900/60 text-primary mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full">
          {icon}
        </div>
        <h1
          id="code-status-title"
          className="text-foreground text-xl font-bold sm:text-2xl"
        >
          {title}
        </h1>
        <p className="text-muted mt-3">{body}</p>
        <div className="mt-6 flex justify-center">
          <LinkButton href="/" variant="primary" size="lg">
            <IoHome className="shrink-0" aria-hidden />
            Retour à l’accueil
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
