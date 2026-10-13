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
 * The members area's header, on every /membres page (« Les Pupitres »): logo,
 * the six sections as pills in a grey capsule, the account menu. Below
 * 1024 px the sections move into a « Menu » pill that opens the same links
 * with a line of explanation each.
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
    <header className="bg-members-page w-full">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-x-3 gap-y-3 px-3.5 py-3.5 md:px-6 md:py-5 lg:gap-x-5">
        <NextLink
          href="/membres"
          aria-label="Le Bon Tempérament, espace membres, accueil"
          className="text-foreground flex min-w-0 items-center gap-3 no-underline"
        >
          <span className="border-members-line flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-white">
            <Image
              src="/img/bt_logo.webp"
              alt=""
              width={40}
              height={40}
              priority
              className="h-9 w-9 object-contain"
            />
          </span>
          <span className="flex min-w-0 flex-col leading-tight lg:max-xl:hidden">
            <span className="font-members-display hidden text-xl font-semibold sm:block">
              Le Bon Tempérament
            </span>
            <span className="text-members-muted truncate text-base font-medium max-[479px]:hidden sm:font-normal">
              Espace membres
            </span>
          </span>
        </NextLink>

        <nav
          aria-label="Espace membres"
          className="bg-members-band mx-auto hidden flex-wrap justify-center gap-1 rounded-full p-1.5 lg:flex"
        >
          {MEMBERS_NAV_LINKS.map((link) => {
            const active = isActiveLink(pathname, link.href);
            return (
              <NextLink
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-[17px] font-medium no-underline transition-colors ${
                  active
                    ? "bg-members-ink text-members-ink-foreground"
                    : "text-foreground hover:bg-members-card"
                }`}
              >
                {link.label}
              </NextLink>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3 lg:ml-0">
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={isOpen}
            aria-controls="members-menu"
            onClick={() => setIsOpen((open) => !open)}
            className="bg-members-band text-foreground hover:bg-members-line flex min-h-12 items-center gap-2 rounded-full px-4 text-lg font-medium lg:hidden"
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
            <ul className="bg-members-band flex flex-col gap-1 rounded-[28px] p-2">
              {MEMBERS_NAV_LINKS.map((link) => {
                const active = isActiveLink(pathname, link.href);
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <NextLink
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setIsOpen(false)}
                      className={`flex min-h-16 items-center gap-3.5 rounded-[22px] px-3 py-2.5 no-underline ${
                        active
                          ? "bg-members-ink text-members-ink-foreground"
                          : "hover:bg-members-card"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                          active
                            ? "bg-members-ink-foreground text-members-ink"
                            : "bg-members-card text-foreground"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="text-lg font-semibold">
                          {link.label}
                        </span>
                        <span
                          className={`text-base leading-snug ${active ? "opacity-85" : "text-members-muted"}`}
                        >
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
