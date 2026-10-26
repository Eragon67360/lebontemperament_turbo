"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useMyProfile } from "@/hooks/useMyProfile";
import { membersFontClasses } from "@/lib/membres/font";
import { getFirstName, getInitials } from "@/lib/membres/names";
import RouteNames from "@/utils/routes";
import { loadBrowserClient } from "@/utils/supabase/lazy";
import { Dropdown, Label, toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  IoBagHandleOutline,
  IoChevronDownOutline,
  IoGlobeOutline,
  IoLogOutOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { voiceFill } from "./tones";

const itemClass = "min-h-12 gap-3 px-3 text-lg";

/**
 * The account button of the members header: initials on the member's voice
 * colour, first name, and a small menu (my account, my orders, back to the
 * public site, sign out).
 */
export function MembersAccountMenu() {
  const { setUser } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // The name on the member's profile, not the account's metadata.
  const me = useMyProfile();
  const fullName: string = me.status === "ready" ? (me.displayName ?? "") : "";
  const firstName = getFirstName(fullName);
  const avatarColor = voiceFill(me.status === "ready" ? me.voice : null);

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
    else if (key === "commandes") router.push(RouteNames.MEMBRES.COMMANDES);
    else if (key === "site") router.push(RouteNames.ROOT);
    else if (key === "deconnexion") signOut();
  };

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={firstName ? `Mon compte, ${firstName}` : "Mon compte"}
        className="bg-members-band text-foreground hover:bg-members-line flex min-h-12 items-center gap-2.5 rounded-full p-1 text-lg font-medium sm:pr-4"
      >
        <span
          aria-hidden="true"
          className={`font-members-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-semibold ${avatarColor}`}
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
        className={`${membersFontClasses} members-scope min-w-64 rounded-[24px]`}
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
            id="commandes"
            textValue="Mes commandes"
            className={itemClass}
          >
            <IoBagHandleOutline aria-hidden="true" className="h-5 w-5" />
            <Label className="text-lg">Mes commandes</Label>
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
