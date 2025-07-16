"use client";
import { NavbarContent, NavbarItem } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const SubLinks = () => {
  const pathname = usePathname();
  const [activeHash, setActiveHash] = useState("");

  // Function to check if the link is active based on both route and hash
  const isActive = (route: string, hash: string | undefined) => {
    return pathname === route && activeHash === hash;
  };

  useEffect(() => {
    // Function to update the active hash
    const handleHashChange = () => {
      setActiveHash(window.location.hash);
    };

    // Update the hash on mount and add hashchange event listener
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <NavbarContent
      justify="center"
      className="hidden items-center gap-8 text-[16px] tracking-[2.4px] uppercase select-none lg:flex"
    >
      <NavbarItem>
        <Link
          href={"/membres/calendrier"}
          className={`px-2 py-1 transition-all duration-300 ${isActive("/membres/calendrier", "") ? "border-primary/65 border-y-2" : "hover:border-primary/65 border-y-2 border-transparent"}`}
        >
          Calendrier
        </Link>
      </NavbarItem>
      <NavbarItem>
        <Link
          href={"/membres/travail"}
          className={`px-2 py-1 transition-all duration-300 ${isActive("/membres/travail", "") ? "border-primary/65 border-y-2" : "hover:border-primary/65 border-y-2 border-transparent"}`}
        >
          Travail
        </Link>
      </NavbarItem>
      <NavbarItem>
        <Link
          href={"/membres/membres"}
          className={`px-2 py-1 transition-all duration-300 ${isActive("/membres/membres", "") ? "border-primary/65 border-y-2" : "hover:border-primary/65 border-y-2 border-transparent"}`}
        >
          Membres
        </Link>
      </NavbarItem>
      <NavbarItem>
        <Link
          href={"/membres/administration#archives"}
          className={`px-2 py-1 transition-all duration-300 ${isActive("/membres/administration", "#archives") ? "border-primary/65 border-y-2" : "hover:border-primary/65 border-y-2 border-transparent"}`}
        >
          Archives
        </Link>
      </NavbarItem>
      <NavbarItem>
        <Link
          href={"/membres/administration#reglement"}
          className={`px-2 py-1 transition-all duration-300 ${isActive("/membres/administration", "#reglement") ? "border-primary/65 border-y-2" : "hover:border-primary/65 border-y-2 border-transparent"}`}
        >
          Règlement
        </Link>
      </NavbarItem>
      <NavbarItem>
        <Link
          href={"/membres/administration#logiciels"}
          className={`px-2 py-1 transition-all duration-300 ${isActive("/membres/administration", "#logiciels") ? "border-primary/65 border-y-2" : "hover:border-primary/65 border-y-2 border-transparent"}`}
        >
          Logiciels
        </Link>
      </NavbarItem>
    </NavbarContent>
  );
};

export default SubLinks;
