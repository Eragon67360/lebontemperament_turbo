"use client";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Link,
} from "@heroui/react";
import React, { useEffect, useState } from "react";
import { ThemeSwitcher } from "./ThemeSwitcher";

export const MembersFooter = () => {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  return (
    <div className="border-t border-foreground/20 mx-16 max-w-[96%] w-full px-8 py-4 items-center flex justify-between gap-2 text-sm">
      <div>©&nbsp;{year}&nbsp;Le Bon Tempérament</div>
      <Dropdown className=" capitalize ">
        <DropdownTrigger className="block lg:hidden">Liens</DropdownTrigger>
        <DropdownMenu aria-label="liens de la partie membres">
          <DropdownItem key="accueil">
            <Link
              href={"/"}
              className="text-foreground/50 hover:text-primary/80 transition"
            >
              SITE PUBLIC
            </Link>
          </DropdownItem>
          <DropdownItem key="travail">
            <Link
              href={"/membres/travail"}
              className="text-foreground/50 hover:text-primary/80 transition"
            >
              travail
            </Link>
          </DropdownItem>
          <DropdownItem key="concerts">
            <Link
              href={"/membres/concerts"}
              className="text-foreground/50 hover:text-primary/80 transition"
            >
              concerts & évènements
            </Link>
          </DropdownItem>
          <DropdownItem key="calendrier">
            <Link
              href={"/membres/calendrier"}
              className="text-foreground/50 hover:text-primary/80 transition"
            >
              répétitions (calendrier)
            </Link>
          </DropdownItem>
          <DropdownItem key="membres">
            <Link
              href={"/membres/membres"}
              className="text-foreground/50 hover:text-primary/80 transition"
            >
              membres
            </Link>
          </DropdownItem>
          <DropdownItem key="autres">
            <Link
              href={"/membres/administration"}
              className="text-foreground/50 hover:text-primary/80 transition"
            >
              autres
            </Link>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <div className="hidden lg:flex flex-col md:flex-row gap-1 lg:gap-4 uppercase mt-2 text-foreground/50 ">
        <Link
          href={"/"}
          className="text-foreground/50 hover:text-primary/80 transition"
        >
          SITE PUBLIC
        </Link>
        <Link
          href={"/membres/travail"}
          className="text-foreground/50 hover:text-primary/80 transition"
        >
          travail
        </Link>
        <Link
          href={"/membres/concerts"}
          className="text-foreground/50 hover:text-primary/80 transition"
        >
          concerts & évènements
        </Link>
        <Link
          href={"/membres/calendrier"}
          className="text-foreground/50 hover:text-primary/80 transition"
        >
          répétitions (calendrier)
        </Link>
        <Link
          href={"/membres/membres"}
          className="text-foreground/50 hover:text-primary/80 transition"
        >
          membres
        </Link>
        <Link
          href={"/membres/administration"}
          className="text-foreground/50 hover:text-primary/80 transition"
        >
          autres
        </Link>
      </div>

      <ThemeSwitcher />
    </div>
  );
};
