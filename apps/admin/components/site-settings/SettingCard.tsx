import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import type { SavedSetting } from "@/hooks/useSiteSettings";
import { WEBSITE_URL } from "@/lib/website";
import {
  lockedReason,
  ORIGINAL_VALUES_LABEL,
  provenanceLabel,
  SETTING_INFO,
  type SettingFact,
  settingFacts,
} from "@/utils/siteSettings/form";
import type {
  SiteSettingKey,
  SiteSettings,
} from "@repo/domain/utils/siteSettings";
import { ExternalLink, History, Info, Pencil, PencilLine } from "lucide-react";

function Fact({ fact }: { fact: SettingFact }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-x-4">
      <dt className="text-note text-muted-foreground">{fact.label}</dt>
      <dd className="text-detail min-w-0">
        {fact.items ? (
          <ul className="grid gap-1">
            {fact.items.map((item, index) => (
              <li key={index} className="line-clamp-1 break-words">
                {item}
              </li>
            ))}
          </ul>
        ) : fact.href ? (
          <a
            href={fact.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-text line-clamp-2 break-all underline-offset-4 hover:underline"
          >
            {fact.text}
            <span className="sr-only"> (nouvel onglet)</span>
          </a>
        ) : (
          <p className="line-clamp-2 break-words">{fact.text}</p>
        )}
      </dd>
    </div>
  );
}

/**
 * One setting of « Réglages du site »: what the site shows today as a short
 * read-only list, where the values come from, and the three things to do
 * about them. Editing happens in the dialogs the page opens.
 */
export function SettingCard({
  settingKey,
  value,
  saved,
  invalid,
  editable,
  onEdit,
  onHistory,
}: {
  settingKey: SiteSettingKey;
  value: SiteSettings[SiteSettingKey];
  /** When and by whom it was last saved; absent while the site shows the original values. */
  saved?: SavedSetting;
  /** Saved, but the value no longer passes today's rules. */
  invalid: boolean;
  editable: boolean;
  /** Gets the button, so the page can give it the focus back when the dialog closes. */
  onEdit: (opener: HTMLElement) => void;
  onHistory: (opener: HTMLElement) => void;
}) {
  const info = SETTING_INFO[settingKey];
  const facts = settingFacts(settingKey, value);
  const provenance = provenanceLabel(saved, invalid);
  const reasonId = `setting-${settingKey}-locked`;
  const ProvenanceIcon =
    provenance === ORIGINAL_VALUES_LABEL ? Info : PencilLine;

  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="space-y-1">
        <h2 className="text-[17px] leading-6 font-semibold">{info.title}</h2>
        <p className="text-note text-muted-foreground">{info.help}</p>
      </div>

      {invalid && (
        <Callout
          tone="warning"
          title="La valeur enregistrée n'est plus valide : le site affiche les valeurs d'origine."
        />
      )}

      {facts.length > 0 ? (
        <dl className="grid gap-3">
          {facts.map((fact) => (
            <Fact key={fact.label} fact={fact} />
          ))}
        </dl>
      ) : (
        <p className="text-detail text-muted-foreground">
          Aucun lien n&apos;est affiché sur le site.
        </p>
      )}

      <p className="text-note text-muted-foreground flex items-center gap-1.5">
        <ProvenanceIcon className="size-3.5 shrink-0" aria-hidden />
        <span>{provenance}</span>
      </p>

      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={(event) => onEdit(event.currentTarget)}
          disabled={!editable}
          aria-describedby={editable ? undefined : reasonId}
          className="mr-1"
        >
          <Pencil aria-hidden />
          Modifier
          <span className="sr-only"> « {info.title} »</span>
        </Button>
        {!editable && (
          <p
            id={reasonId}
            className="text-note text-muted-foreground mr-2 max-w-prose"
          >
            {lockedReason(settingKey)}
          </p>
        )}
        <Button variant="ghost" size="sm" asChild>
          <a
            href={`${WEBSITE_URL}${info.sitePage}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Voir sur le site
            <span className="sr-only"> « {info.title} » (nouvel onglet)</span>
            <ExternalLink aria-hidden />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(event) => onHistory(event.currentTarget)}
        >
          <History aria-hidden />
          Historique
          <span className="sr-only"> « {info.title} »</span>
        </Button>
      </div>
    </Card>
  );
}
