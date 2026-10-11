"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/types/user";
import {
  deletionBlocker,
  memberName,
  roleChangeBlocker,
  type Role,
} from "@/utils/members/list";
import RouteNames from "@/utils/routes";
import {
  Image as ImageIcon,
  Mic,
  MoreHorizontal,
  Pencil,
  Shield,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";

interface MemberActionsMenuProps {
  user: User;
  actor: { id: string | null | undefined; role: Role | null | undefined };
  onRole: (user: User) => void;
  onRename: (user: User) => void;
  onVoice: (user: User) => void;
  onPhoto: (user: User) => void;
  onDelete: (user: User) => void;
}

// Radix closes the menu before the dialog opens; opening on the next tick
// keeps focus and pointer events right (same as the shell's account menu).
const later = (run: () => void) => () => setTimeout(run, 0);

/**
 * The row's « ⋯ »: the member page, then the changes that open a dialog.
 * Only what this admin may do is listed; permanent deletion comes last, in
 * danger text, for superadmins only.
 */
export function MemberActionsMenu({
  user,
  actor,
  onRole,
  onRename,
  onVoice,
  onPhoto,
  onDelete,
}: MemberActionsMenuProps) {
  const name = memberName(user);
  const canChangeRole = !roleChangeBlocker(actor, user);
  const canDelete = !deletionBlocker(actor, user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground data-[state=open]:bg-primary-soft data-[state=open]:text-primary-text"
          aria-label={`Plus d’actions pour ${name}`}
        >
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        collisionPadding={16}
        className="min-w-56"
      >
        <DropdownMenuItem asChild>
          <Link href={RouteNames.DASHBOARD.ADMIN.USER(user.id)}>
            <UserRound aria-hidden />
            Voir la fiche
          </Link>
        </DropdownMenuItem>
        {canChangeRole && (
          <DropdownMenuItem onSelect={later(() => onRole(user))}>
            <Shield aria-hidden />
            Changer le rôle…
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={later(() => onRename(user))}>
          <Pencil aria-hidden />
          Modifier le nom affiché…
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={later(() => onVoice(user))}>
          <Mic aria-hidden />
          Modifier la voix…
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={later(() => onPhoto(user))}>
          <ImageIcon aria-hidden />
          Photo de profil…
        </DropdownMenuItem>
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={later(() => onDelete(user))}
              aria-label={`Supprimer définitivement le compte de ${name}`}
            >
              <Trash2 aria-hidden />
              Supprimer définitivement…
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
