"use client";

import { PageShell } from "@/components/layouts/PageShell";
import { DonationsDialog } from "@/components/site-settings/DonationsDialog";
import { HistoryDialog } from "@/components/site-settings/HistoryDialog";
import { SettingCard } from "@/components/site-settings/SettingCard";
import { SettingDialog } from "@/components/site-settings/SettingDialog";
import { Callout } from "@/components/ui/callout";
import { DataState, LoadingRegion } from "@/components/ui/data-state";
import { Skeleton } from "@/components/ui/skeleton";
import { NotInstalledError } from "@/hooks/useDocuments";
import { useSaveSiteSetting, useSiteSettings } from "@/hooks/useSiteSettings";
import {
  type DonationsForm,
  donationsForm,
  TEXT_SETTING_KEYS,
  type TextSettingKey,
  type TextValues,
  textValues,
} from "@/utils/siteSettings/form";
import {
  SITE_SETTING_KEYS,
  type SiteSettingKey,
  type SiteSettings,
} from "@repo/domain/utils/siteSettings";
import { useRef, useState } from "react";
import { toast } from "sonner";

const PAGE_TITLE = "Réglages du site";
const PAGE_DESCRIPTION =
  "Les coordonnées, les réseaux sociaux, les dons, les informations pour rejoindre et les mentions légales du site. Chaque modification s'affiche sur le site dans les minutes qui suivent.";

/** What the open dialog started from; kept as it was when it opened. */
type Editing =
  | { key: TextSettingKey; initial: TextValues }
  | { key: "donations"; initial: DonationsForm };

function SettingsSkeleton() {
  return (
    <LoadingRegion label="Chargement des réglages…">
      <div className="grid gap-4">
        {SITE_SETTING_KEYS.map((key) => (
          <Skeleton key={key} className="h-52 w-full rounded-lg" />
        ))}
      </div>
    </LoadingRegion>
  );
}

export default function SiteSettingsPage() {
  const { data, isLoading, isError, error, refetch } = useSiteSettings();
  const save = useSaveSiteSetting();

  const [editing, setEditing] = useState<Editing | null>(null);
  // The history keeps its setting while it closes, so it fades out whole.
  const [history, setHistory] = useState<{
    key: SiteSettingKey;
    open: boolean;
  }>({ key: "contact", open: false });

  // A dialog opened from a button gives the keyboard back to it when it
  // closes (the dialogs have no trigger of their own to return to).
  const opener = useRef<HTMLElement | null>(null);
  const giveFocusBack = () => {
    const element = opener.current;
    opener.current = null;
    if (element) window.setTimeout(() => element.focus(), 0);
  };
  const closeEditor = () => {
    setEditing(null);
    giveFocusBack();
  };

  const openEditor = (key: SiteSettingKey, button: HTMLElement) => {
    if (!data) return;
    opener.current = button;
    setEditing(
      key === "donations"
        ? { key, initial: donationsForm(data.settings.donations) }
        : { key, initial: textValues(key, data.settings[key]) },
    );
  };

  const saveSetting = async (
    key: SiteSettingKey,
    value: SiteSettings[SiteSettingKey],
    done: string,
  ) => {
    await save.mutateAsync({ key, value });
    toast.success(done);
  };

  if (error instanceof NotInstalledError) {
    return (
      <PageShell
        className="py-4 sm:py-6"
        title={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
      >
        <Callout tone="warning" title="Pas encore installé">
          Cette page attend une mise à jour de la base de données. En attendant,
          le site affiche ses réglages habituels.
        </Callout>
      </PageShell>
    );
  }

  const textInitial = (key: TextSettingKey): TextValues | null =>
    editing && editing.key !== "donations" && editing.key === key
      ? editing.initial
      : null;

  return (
    <PageShell
      className="py-4 sm:py-6"
      title={PAGE_TITLE}
      description={PAGE_DESCRIPTION}
    >
      <DataState
        isLoading={isLoading}
        isError={isError && !data}
        isEmpty={false}
        onRetry={() => refetch()}
        errorDescription="Les réglages du site n'ont pas pu être chargés."
        skeleton={<SettingsSkeleton />}
      >
        {data && (
          <>
            <ul className="grid gap-4">
              {SITE_SETTING_KEYS.map((key) => (
                <li key={key}>
                  <SettingCard
                    settingKey={key}
                    value={data.settings[key]}
                    saved={data.saved[key]}
                    invalid={data.invalid.includes(key)}
                    editable={data.editable[key]}
                    onEdit={(button) => openEditor(key, button)}
                    onHistory={(button) => {
                      opener.current = button;
                      setHistory({ key, open: true });
                    }}
                  />
                </li>
              ))}
            </ul>

            {TEXT_SETTING_KEYS.map((key) => (
              <SettingDialog
                key={key}
                settingKey={key}
                initial={textInitial(key)}
                isPending={save.isPending}
                onSubmit={(value) =>
                  saveSetting(key, value, "Réglage enregistré")
                }
                onClose={closeEditor}
              />
            ))}
            <DonationsDialog
              initial={editing?.key === "donations" ? editing.initial : null}
              isPending={save.isPending}
              onSubmit={(value) =>
                saveSetting("donations", value, "Réglage enregistré")
              }
              onClose={closeEditor}
            />

            <HistoryDialog
              settingKey={history.key}
              open={history.open}
              onOpenChange={(open) => {
                setHistory((h) => ({ ...h, open }));
                if (!open) giveFocusBack();
              }}
              current={data.settings[history.key]}
              hasSaved={Boolean(data.saved[history.key])}
              editable={data.editable[history.key]}
              onRestore={(value) =>
                saveSetting(history.key, value, "Version restaurée")
              }
            />
          </>
        )}
      </DataState>
    </PageShell>
  );
}
