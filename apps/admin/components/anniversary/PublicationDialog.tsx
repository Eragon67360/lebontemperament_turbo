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
import { Callout } from "@/components/ui/callout";
import { Checkbox } from "@/components/ui/checkbox";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export const PUBLIC_PAGE = "lebontemperament.com/40-ans";

interface PublicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `publish` makes the page visible; `hide` takes it down. */
  action: "publish" | "hide";
  onConfirm: () => void;
  isPending?: boolean;
  /** Sections not ready, named in a warning before publishing. */
  notReady?: string[];
}

/**
 * The deliberate publication step: the dialog states the effect on the
 * public site, and its confirm stays disabled until « J'ai vérifié le
 * contenu » is ticked. Replaces the one-click switch.
 */
export function PublicationDialog({
  open,
  onOpenChange,
  action,
  onConfirm,
  isPending = false,
  notReady = [],
}: PublicationDialogProps) {
  const [checked, setChecked] = useState(false);
  // Each opening asks for the tick again.
  useResetOnChange([open], () => setChecked(false));

  const publishing = action === "publish";
  const checkboxId = `publication-${action}-check`;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {publishing
              ? "Publier la page des 40 ans ?"
              : "Masquer la page des 40 ans ?"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-detail text-muted-foreground space-y-2">
              {publishing ? (
                <>
                  <p>
                    La page {PUBLIC_PAGE} devient visible par tous les
                    visiteurs, tout de suite.
                  </p>
                  <p>
                    Le lien « 40 ans » apparaît dans le menu du site, la section
                    anniversaire sur la page d&apos;accueil et le bouton
                    flottant sur toutes les pages.
                  </p>
                  <p>Vous pourrez la masquer de nouveau à tout moment.</p>
                </>
              ) : (
                <>
                  <p>
                    La page {PUBLIC_PAGE} renvoie une erreur 404 aux visiteurs,
                    tout de suite.
                  </p>
                  <p>
                    Le lien du menu, la section de la page d&apos;accueil et le
                    bouton flottant disparaissent. Les contenus restent ici,
                    rien n&apos;est effacé.
                  </p>
                  <p>
                    Connecté à l&apos;administration, vous pourrez toujours la
                    prévisualiser.
                  </p>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {publishing && notReady.length > 0 && (
          <Callout
            tone="warning"
            title={
              notReady.length === 1
                ? "1 section n'est pas prête"
                : `${notReady.length} sections ne sont pas prêtes`
            }
          >
            <p>
              {notReady.join(", ")} : la page se publie quand même, avec ces
              sections vides ou incomplètes.
            </p>
          </Callout>
        )}

        <label
          htmlFor={checkboxId}
          className="border-border bg-card flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3.5 py-2.5"
        >
          <Checkbox
            id={checkboxId}
            checked={checked}
            onCheckedChange={(value) => setChecked(value === true)}
            disabled={isPending}
          />
          <span className="text-[15px] leading-5 font-medium">
            {publishing
              ? "J'ai vérifié le contenu"
              : "J'ai compris que la page ne sera plus accessible"}
          </span>
        </label>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            variant={publishing ? "default" : "destructive"}
            disabled={!checked || isPending}
            aria-busy={isPending || undefined}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isPending && <Loader2 className="animate-spin" aria-hidden />}
            {publishing ? "Publier la page" : "Masquer la page"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
