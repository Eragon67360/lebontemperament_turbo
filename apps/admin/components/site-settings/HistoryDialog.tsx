"use client";

import { refusalMessage } from "@/components/site-settings/feedback";
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
import { Button } from "@/components/ui/button";
import {
  DataState,
  EmptyState,
  ListSkeleton,
} from "@/components/ui/data-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSiteSettingRevisions } from "@/hooks/useSiteSettings";
import {
  differencesLabel,
  lockedReason,
  ORIGINAL_VALUES_LABEL,
  revisionHeading,
  SETTING_INFO,
  settingDifferences,
  settingSummary,
} from "@/utils/siteSettings/form";
import {
  DEFAULT_SITE_SETTINGS,
  type SiteSettingKey,
  type SiteSettings,
} from "@repo/domain/utils/siteSettings";
import { History, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Version = {
  id: string;
  heading: string;
  summary: string;
  changes: string;
  value: SiteSettings[SiteSettingKey];
};

/**
 * « Historique » of one setting: the versions that were replaced (newest
 * first), each with when and by whom it was replaced, a line about what it
 * said and how it differs from today's. « Restaurer cette version » asks
 * first, then saves it like any other change. When the setting was saved at
 * least once, the site's original values close the list.
 */
export function HistoryDialog({
  settingKey,
  open,
  onOpenChange,
  current,
  hasSaved,
  editable,
  onRestore,
}: {
  settingKey: SiteSettingKey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the site shows now. */
  current: SiteSettings[SiteSettingKey];
  /** Saved at least once, so the original values are something to go back to. */
  hasSaved: boolean;
  editable: boolean;
  onRestore: (value: SiteSettings[SiteSettingKey]) => Promise<void>;
}) {
  const info = SETTING_INFO[settingKey];
  const { data, isLoading, isError, refetch } = useSiteSettingRevisions(
    settingKey,
    open,
  );
  const [target, setTarget] = useState<Version | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const describe = (
    id: string,
    heading: string,
    value: SiteSettings[SiteSettingKey],
  ): Version => ({
    id,
    heading,
    value,
    summary: settingSummary(settingKey, value),
    changes: differencesLabel(settingDifferences(settingKey, value, current)),
  });
  const versions: Version[] = [
    ...(data ?? []).map((revision) =>
      describe(
        String(revision.id),
        revisionHeading(revision.changedAt, revision.changedBy),
        revision.value,
      ),
    ),
    ...(hasSaved
      ? [
          describe(
            "original",
            ORIGINAL_VALUES_LABEL,
            DEFAULT_SITE_SETTINGS[settingKey],
          ),
        ]
      : []),
  ];

  const ask = (version: Version) => {
    setTarget(version);
    setConfirmOpen(true);
  };

  const confirm = async () => {
    if (!target) return;
    setRestoring(true);
    try {
      await onRestore(target.value);
      setConfirmOpen(false);
      onOpenChange(false);
    } catch (error) {
      toast.error("La version n'a pas pu être restaurée", {
        description: refusalMessage(error),
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Historique : {info.title}</DialogTitle>
            <DialogDescription>
              Les versions remplacées, de la plus récente à la plus ancienne.
              Restaurer une version la remet sur le site ; la version actuelle
              reste dans l&apos;historique.
            </DialogDescription>
          </DialogHeader>
          {!editable && (
            <p className="text-note text-muted-foreground">
              {lockedReason(settingKey)}
            </p>
          )}
          <DataState
            isLoading={isLoading}
            isError={isError}
            isEmpty={versions.length === 0}
            onRetry={() => refetch()}
            errorDescription="L'historique n'a pas pu être chargé."
            skeleton={
              <ListSkeleton rows={3} label="Chargement de l'historique…" />
            }
            empty={
              <EmptyState
                icon={History}
                title="Pas encore de version précédente"
                description="Les versions remplacées apparaîtront ici dès la première modification."
                className="py-8"
              />
            }
          >
            <ol className="grid gap-3">
              {versions.map((version) => (
                <li
                  key={version.id}
                  className="border-border grid gap-3 rounded-md border p-4"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-[15px] leading-6 font-medium">
                      {version.heading}
                    </p>
                    <p className="text-detail break-words">{version.summary}</p>
                    <p className="text-note text-muted-foreground">
                      {version.changes}
                    </p>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => ask(version)}
                      disabled={!editable || restoring}
                    >
                      Restaurer cette version
                      <span className="sr-only"> ({version.heading})</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          </DataState>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(next) => !restoring && setConfirmOpen(next)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurer cette version ?</AlertDialogTitle>
            <AlertDialogDescription>
              {target?.heading}. Sur le site, {info.what} reviendront à cette
              version dans les minutes qui suivent. Les valeurs actuelles seront
              remplacées, mais elles restent dans l&apos;historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirm();
              }}
              disabled={restoring}
              aria-busy={restoring || undefined}
            >
              {restoring && <Loader2 className="animate-spin" aria-hidden />}
              {restoring ? "Restauration…" : "Restaurer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
