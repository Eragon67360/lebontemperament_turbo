import { Link, NavbarMenu, NavbarMenuItem } from "@heroui/react";

const SubMenuLinks = () => {
  return (
    <NavbarMenu>
      <NavbarMenuItem>
        <Link href={"/membres"} className="w-full" color="foreground">
          Accueil membres
        </Link>
      </NavbarMenuItem>
      <NavbarMenuItem>
        <Link
          href={"/membres/calendrier"}
          className="w-full"
          color="foreground"
        >
          Calendrier
        </Link>
      </NavbarMenuItem>
      <NavbarMenuItem>
        <Link href={"/membres/travail"} className="w-full" color="foreground">
          Travail
        </Link>
      </NavbarMenuItem>
      <NavbarMenuItem>
        <Link href={"/membres/membres"} className="w-full" color="foreground">
          Membres
        </Link>
      </NavbarMenuItem>
      <NavbarMenuItem>
        <Link
          href={"/membres/administration#archives"}
          className="w-full"
          color="foreground"
        >
          Archives
        </Link>
      </NavbarMenuItem>
      <NavbarMenuItem>
        <Link
          href={"/membres/administration#reglement"}
          className="w-full"
          color="foreground"
        >
          Règlement
        </Link>
      </NavbarMenuItem>
      <NavbarMenuItem>
        <Link
          href={"/membres/administration#logiciels"}
          className="w-full"
          color="foreground"
        >
          Logiciels
        </Link>
      </NavbarMenuItem>
    </NavbarMenu>
  );
};

export default SubMenuLinks;
