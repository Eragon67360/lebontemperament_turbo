"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { User } from "@/types/user";
import {
  firstNameOf,
  memberName,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type Role,
} from "@/utils/members/list";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface RoleDialogProps {
  /** The account whose role changes; the dialog is open while it is set. */
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (user: User, role: Role) => Promise<void> | void;
  /** Only a superadmin may grant or remove the superadmin role (the API checks it too). */
  actorIsSuperAdmin: boolean;
  isSaving?: boolean;
}

/**
 * « Changer le rôle de Lucie BERNARD »: one choice per role with what it
 * allows, then « Enregistrer le rôle ». Replaces the one-click role select
 * the old cards had on every member.
 */
export function RoleDialog({
  user,
  onOpenChange,
  onConfirm,
  actorIsSuperAdmin,
  isSaving = false,
}: RoleDialogProps) {
  // The choice belongs to the account it was made for: opening the dialog
  // for someone else starts again from their current role.
  const [choice, setChoice] = useState<{ id: string; role: Role } | null>(null);
  const role: Role =
    choice && choice.id === user?.id ? choice.role : (user?.role ?? "user");
  const setRole = (next: Role) =>
    user && setChoice({ id: user.id, role: next });

  const roles: Role[] =
    actorIsSuperAdmin || user?.role === "superadmin"
      ? ["user", "admin", "superadmin"]
      : ["user", "admin"];
  const name = user ? memberName(user) : "";

  return (
    <AlertDialog open={!!user} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Changer le rôle de {name}</AlertDialogTitle>
          <AlertDialogDescription>
            {user && (
              <>
                {firstNameOf(user)} est actuellement{" "}
                <strong className="text-foreground font-medium">
                  {ROLE_LABELS[user.role]}
                </strong>
                . Le changement s’applique à sa prochaine page.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Nouveau rôle</legend>
          {roles.map((option) => (
            <label
              key={option}
              className="border-border has-[:checked]:border-primary has-[:checked]:bg-primary-soft flex min-h-11 cursor-pointer items-start gap-3 rounded-md border p-3"
            >
              <input
                type="radio"
                name="role"
                value={option}
                checked={role === option}
                onChange={() => setRole(option)}
                disabled={
                  isSaving || (option === "superadmin" && !actorIsSuperAdmin)
                }
                className="accent-primary mt-1 size-4 shrink-0"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px] leading-6 font-medium">
                  {ROLE_LABELS[option]}
                </span>
                <span className="text-detail text-muted-foreground">
                  {ROLE_DESCRIPTIONS[option]}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              if (user) void onConfirm(user, role);
            }}
            disabled={isSaving || !user || role === user.role}
            aria-busy={isSaving || undefined}
          >
            {isSaving && <Loader2 className="animate-spin" aria-hidden />}
            {isSaving ? "Enregistrement…" : "Enregistrer le rôle"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
