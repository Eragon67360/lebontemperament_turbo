// components/MembersFooter.tsx
"use client";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import NextLink from "next/link";
import { useMemo } from "react";
import { ThemeSwitcher } from "./ThemeSwitcher";

export const MembersFooter = () => {
  const { contact } = useSiteSettings();
  const year = useMemo(() => new Date().getFullYear(), []);
  const linkClass =
    "text-primary-text inline-flex min-h-12 items-center font-medium underline underline-offset-2 hover:no-underline";

  return (
    <footer className="border-members-line bg-members-card text-muted w-full border-t text-base">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-4 md:px-6">
        <span>©&nbsp;{year}&nbsp;Le Bon Tempérament</span>
        <span>
          Une question ?{" "}
          <a href={`mailto:${contact.email}`} className={linkClass}>
            {contact.email}
          </a>
        </span>
        <div className="flex flex-wrap items-center gap-x-6">
          <NextLink href="/" className={linkClass}>
            Retour au site public
          </NextLink>
          <div className="flex items-center gap-1">
            <span aria-hidden="true">Thème</span>
            <ThemeSwitcher large />
          </div>
        </div>
      </div>
    </footer>
  );
};
