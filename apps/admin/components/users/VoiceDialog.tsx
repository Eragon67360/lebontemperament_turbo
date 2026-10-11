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
import { Checkbox } from "@/components/ui/checkbox";
import type { User } from "@/types/user";
import { memberName, memberVoices } from "@/utils/members/list";
import { voiceChoices } from "@/utils/members/voice";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface VoiceDialogProps {
  /** The account whose voices change; the dialog is open while it is set. */
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (user: User, voices: string[]) => Promise<void> | void;
  isSaving?: boolean;
}

const sameVoices = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((voice) => b.includes(voice));

/**
 * « Voix de Lucie BERNARD »: one box per voice (a member may tick several, or
 * none), then « Enregistrer la voix ». Says that the member list may replace
 * the choice at the next synchronisation.
 */
export function VoiceDialog({
  user,
  onOpenChange,
  onConfirm,
  isSaving = false,
}: VoiceDialogProps) {
  // The choice belongs to the account it was made for: opening the dialog
  // for someone else starts again from their current voices.
  const [choice, setChoice] = useState<{ id: string; voices: string[] } | null>(
    null,
  );
  const current = user ? memberVoices(user) : [];
  const voices = choice && choice.id === user?.id ? choice.voices : current;
  const options = voiceChoices(current);

  const toggle = (voice: string, checked: boolean) => {
    if (!user) return;
    setChoice({
      id: user.id,
      voices: checked
        ? options.filter((o) => o === voice || voices.includes(o))
        : voices.filter((v) => v !== voice),
    });
  };

  return (
    <AlertDialog open={!!user} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Voix de {user ? memberName(user) : ""}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Cochez une ou plusieurs voix, ou aucune. Si la liste des membres
            indique autre chose, la prochaine synchronisation proposera sa
            valeur ; une case vide dans la liste n’efface jamais la voix.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Voix</legend>
          {options.map((option) => (
            <label
              key={option}
              className="border-border has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-soft flex min-h-11 cursor-pointer items-center gap-3 rounded-md border p-3"
            >
              <Checkbox
                checked={voices.includes(option)}
                onCheckedChange={(checked) => toggle(option, checked === true)}
                disabled={isSaving}
              />
              <span className="text-[15px] leading-6 font-medium">
                {option}
              </span>
            </label>
          ))}
        </fieldset>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              if (user) void onConfirm(user, voices);
            }}
            disabled={isSaving || !user || sameVoices(voices, current)}
            aria-busy={isSaving || undefined}
          >
            {isSaving && <Loader2 className="animate-spin" aria-hidden />}
            {isSaving ? "Enregistrement…" : "Enregistrer la voix"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
