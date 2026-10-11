"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { membersFont } from "@/lib/membres/font";
import { getFirstName, getInitials } from "@/lib/membres/names";
import RouteNames from "@/utils/routes";
import { loadBrowserClient } from "@/utils/supabase/lazy";
import { Dropdown, Label, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  IoChevronDownOutline,
  IoGlobeOutline,
  IoLogOutOutline,
  IoPersonOutline,
} from "react-icons/io5";

const itemClass = "min-h-12 gap-3 px-3 text-lg";

/**
 * The account button of the members header: initials, first name, and a
 * small menu (my account, back to the public site, sign out).
 */
export function MembersAccountMenu() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const fullName: string =
    user?.user_metadata?.display_name || user?.user_metadata?.name || "";
  const firstName = getFirstName(fullName);

  // Same sign-out as the public site's user menu.
  const signOut = () => {
    startTransition(async () => {
      try {
        const supabase = await loadBrowserClient();
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUser(null);
        toast.success("Déconnexion réussie");
        router.push(RouteNames.ROOT);
        router.refresh();
      } catch (error) {
        console.error("Error signing out:", error);
        toast.danger("Erreur lors de la déconnexion");
      }
    });
  };

  const onAction = (key: React.Key) => {
    if (key === "compte") router.push(RouteNames.MEMBRES.MES_DONNEES);
    else if (key === "site") router.push(RouteNames.ROOT);
    else if (key === "deconnexion") signOut();
  };

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={firstName ? `Mon compte, ${firstName}` : "Mon compte"}
        className="border-members-line bg-members-card text-foreground hover:bg-primary/10 flex min-h-12 items-center gap-2.5 rounded-full border p-1 text-lg font-bold sm:pr-3.5"
      >
        <span
          aria-hidden="true"
          className="bg-primary/15 text-primary-text flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-extrabold"
        >
          {fullName ? getInitials(fullName) : <IoPersonOutline />}
        </span>
        <span className="hidden sm:inline">{firstName || "Mon compte"}</span>
        <IoChevronDownOutline
          aria-hidden="true"
          className="hidden h-4.5 w-4.5 sm:block"
        />
      </Dropdown.Trigger>
      <Dropdown.Popover
        placement="bottom end"
        className={`${membersFont.className} min-w-64`}
      >
        <Dropdown.Menu aria-label="Mon compte" onAction={onAction}>
          <Dropdown.Item
            id="compte"
            textValue="Mon compte"
            className={itemClass}
          >
            <IoPersonOutline aria-hidden="true" className="h-5 w-5" />
            <Label className="text-lg">Mon compte</Label>
          </Dropdown.Item>
          <Dropdown.Item
            id="site"
            textValue="Retour au site public"
            className={itemClass}
          >
            <IoGlobeOutline aria-hidden="true" className="h-5 w-5" />
            <Label className="text-lg">Retour au site public</Label>
          </Dropdown.Item>
          <Dropdown.Item
            id="deconnexion"
            textValue="Se déconnecter"
            isDisabled={isPending}
            className={itemClass}
          >
            <IoLogOutOutline aria-hidden="true" className="h-5 w-5" />
            <Label className="text-lg">
              {isPending ? "Déconnexion…" : "Se déconnecter"}
            </Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
