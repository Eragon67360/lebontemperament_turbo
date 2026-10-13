// components/MembersNavigation.tsx
"use client";
import { MembersAccountMenu } from "@/components/membres/MembersAccountMenu";
import { isActiveLink, MEMBERS_NAV_LINKS } from "@/components/membres/navLinks";
import Image from "next/image";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IoCloseOutline, IoMenuOutline } from "react-icons/io5";

/**
 * The members area's header, on every /membres page: logo, six sections,
 * account menu. Below 1024 px the sections move into a « Menu » button that
 * opens the same links with a line of explanation each.
 */
export const MembersNavigation = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Escape closes the menu and gives focus back to its button.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <header className="border-members-line bg-members-card w-full border-b">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:px-6 lg:gap-x-6">
        <NextLink
          href="/membres"
          aria-label="Le Bon Tempérament, espace membres, accueil"
          className="text-foreground flex min-w-0 items-center gap-3 no-underline"
        >
          <Image
            src="/img/bt_logo.webp"
            alt=""
            width={48}
            height={48}
            priority
            className="h-11 w-11 shrink-0 rounded-lg object-contain sm:h-12 sm:w-12 dark:bg-white dark:p-0.5"
          />
          <span className="flex min-w-0 flex-col leading-tight lg:max-xl:hidden">
            <span className="hidden text-lg font-semibold sm:block">
              Le Bon Tempérament
            </span>
            <span className="text-muted truncate text-base font-medium max-[479px]:hidden sm:font-normal">
              Espace membres
            </span>
          </span>
        </NextLink>

        <nav
          aria-label="Espace membres"
          className="hidden flex-1 flex-wrap justify-center gap-1 lg:flex"
        >
          {MEMBERS_NAV_LINKS.map((link) => {
            const active = isActiveLink(pathname, link.href);
            return (
              <NextLink
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-12 items-center rounded-[10px] px-3.5 text-[17px] font-medium no-underline transition-colors ${
                  active
                    ? "bg-primary/10 text-primary-text shadow-[inset_0_-3px_0_0_var(--primary)]"
                    : "text-foreground hover:bg-primary/10 hover:text-primary-text"
                }`}
              >
                {link.label}
              </NextLink>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={isOpen}
            aria-controls="members-menu"
            onClick={() => setIsOpen((open) => !open)}
            className="border-members-line-strong bg-members-card text-foreground hover:bg-primary/10 flex min-h-12 items-center gap-2 rounded-xl border px-3.5 text-lg font-medium lg:hidden"
          >
            {isOpen ? (
              <IoCloseOutline aria-hidden="true" className="h-6 w-6" />
            ) : (
              <IoMenuOutline aria-hidden="true" className="h-6 w-6" />
            )}
            Menu
          </button>
          <MembersAccountMenu />
        </div>

        {isOpen && (
          <nav
            id="members-menu"
            aria-label="Menu de l’espace membres"
            className="basis-full lg:hidden"
          >
            <ul className="border-members-line divide-members-line divide-y overflow-hidden rounded-2xl border">
              {MEMBERS_NAV_LINKS.map((link) => {
                const active = isActiveLink(pathname, link.href);
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <NextLink
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setIsOpen(false)}
                      className={`flex min-h-16 items-center gap-3.5 px-4 py-2.5 no-underline ${
                        active
                          ? "bg-primary/10 shadow-[inset_4px_0_0_0_var(--primary)]"
                          : "hover:bg-primary/5"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="bg-primary/10 text-primary-text flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span
                          className={`text-lg font-semibold ${active ? "text-primary-text" : "text-foreground"}`}
                        >
                          {link.label}
                        </span>
                        <span className="text-muted text-base leading-snug">
                          {link.description}
                        </span>
                      </span>
                    </NextLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};
