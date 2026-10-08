// The « Annonce » dialog's form: what it opens with and what it sends.
import type {
  AnnouncementInput,
  SiteAnnouncement,
} from "@/hooks/useAnnouncements";
import {
  ANNOUNCEMENT_BODY_MAX,
  ANNOUNCEMENT_LINK_LABEL_MAX,
  ANNOUNCEMENT_LINK_PATTERN,
  ANNOUNCEMENT_TITLE_MAX,
  type AnnouncementPlacement,
} from "@repo/domain/utils/announcements";

export const PLACEMENT_LABELS: Record<AnnouncementPlacement, string> = {
  home: "Accueil : bouton sous le titre",
  donation_popover: "Carte de la campagne de dons (cœur du menu)",
};

export type AnnouncementForm = {
  placement: AnnouncementPlacement;
  title: string;
  body: string;
  linkLabel: string;
  linkUrl: string;
  /** YYYY-MM-DD or "" (no limit). */
  startsOn: string;
  endsOn: string;
  published: boolean;
};

export type AnnouncementFormField = keyof AnnouncementForm;

export function formFromAnnouncement(
  announcement?: SiteAnnouncement | null,
  placement: AnnouncementPlacement = "home",
): AnnouncementForm {
  return {
    placement: announcement?.placement ?? placement,
    title: announcement?.title ?? "",
    body: announcement?.body ?? "",
    linkLabel: announcement?.link_label ?? "",
    linkUrl: announcement?.link_url ?? "",
    startsOn: announcement?.starts_on ?? "",
    endsOn: announcement?.ends_on ?? "",
    published: announcement ? announcement.status === "published" : false,
  };
}

export function isSameAnnouncementForm(
  a: AnnouncementForm,
  b: AnnouncementForm,
): boolean {
  return (Object.keys(a) as AnnouncementFormField[]).every(
    (k) => a[k] === b[k],
  );
}

export type AnnouncementFormCheck =
  | { ok: true; value: AnnouncementInput }
  | { ok: false; errors: Partial<Record<AnnouncementFormField, string>> };

const orNull = (text: string) => (text.trim() ? text.trim() : null);

/** Checks the form like the API does and builds the request body. */
export function announcementInputFromForm(
  form: AnnouncementForm,
): AnnouncementFormCheck {
  const errors: Partial<Record<AnnouncementFormField, string>> = {};
  const title = form.title.trim();
  const linkUrl = form.linkUrl.trim();
  if (!title) errors.title = "Donnez un titre à l'annonce.";
  else if (title.length > ANNOUNCEMENT_TITLE_MAX)
    errors.title = `${ANNOUNCEMENT_TITLE_MAX} caractères au plus.`;
  if (form.body.trim().length > ANNOUNCEMENT_BODY_MAX)
    errors.body = `${ANNOUNCEMENT_BODY_MAX} caractères au plus.`;
  if (form.linkLabel.trim().length > ANNOUNCEMENT_LINK_LABEL_MAX)
    errors.linkLabel = `${ANNOUNCEMENT_LINK_LABEL_MAX} caractères au plus.`;
  if (!linkUrl) errors.linkUrl = "Indiquez où mène l'annonce.";
  else if (!ANNOUNCEMENT_LINK_PATTERN.test(linkUrl))
    errors.linkUrl =
      "Une page du site (/don) ou une adresse commençant par https://.";
  if (form.startsOn && form.endsOn && form.startsOn > form.endsOn)
    errors.endsOn = "La fin vient après le début.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      placement: form.placement,
      title,
      body: orNull(form.body),
      link_label: orNull(form.linkLabel),
      link_url: linkUrl,
      starts_on: form.startsOn || null,
      ends_on: form.endsOn || null,
      status: form.published ? "published" : "draft",
    },
  };
}
