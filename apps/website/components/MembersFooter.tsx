// components/MembersFooter.tsx
"use client";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const MembersFooter = () => {
  const pathname = usePathname();
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const NavLink = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <NextLink
      href={href}
      className={`m-o block p-2 transition ${
        pathname === href
          ? "text-primary"
          : "text-foreground/50 hover:text-primary/80"
      }`}
    >
      {children}
    </NextLink>
  );

  const links = [
    { href: "/", label: "SITE PUBLIC" },
    { href: "/membres/travail", label: "travail" },
    { href: "/membres/concerts", label: "concerts & évènements" },
    { href: "/membres/calendrier", label: "répétitions (calendrier)" },
    { href: "/membres/membres", label: "membres" },
    { href: "/membres/administration", label: "autres" },
  ];

  return (
    <div className="border-divider mx-4 flex w-full max-w-[96%] items-center justify-between gap-2 border-t px-8 py-4 text-sm md:mx-8 lg:mx-16">
      <div>©&nbsp;{year}&nbsp;Le Bon Tempérament</div>

      <Dropdown className="capitalize">
        <DropdownTrigger className="block lg:hidden">Liens</DropdownTrigger>
        <DropdownMenu aria-label="liens de la partie membres">
          {links.map((link) => (
            <DropdownItem key={link.href} className="p-0">
              <NavLink href={link.href}>{link.label}</NavLink>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>

      <div className="mt-2 hidden flex-col gap-1 uppercase md:flex-row lg:flex lg:gap-4">
        {links.map((link) => (
          <NavLink key={link.href} href={link.href}>
            {link.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
};
