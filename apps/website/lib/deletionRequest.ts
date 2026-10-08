/**
 * « Demander la suppression de mon compte » (#354). The request is an e-mail
 * to the association's mailbox (the one the privacy policy names), with a
 * copy of the acknowledgement to the member: nothing is deleted
 * automatically. A superadmin deletes the account from the admin (« Membres »
 * › the member › « Supprimer définitivement… ») within the month the policy
 * promises, after checking with the member if needed.
 */
import { escapeHtml, escapeHtmlWithBreaks } from "@repo/domain/utils/html";

/** Longest note a member can add to their request. */
export const DELETION_NOTE_MAX_LENGTH = 2000;

export type DeletionRequester = {
  id: string;
  email: string;
  name: string | null;
};

export type DeletionEmail = { subject: string; html: string };

const PARIS_DATE = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

/**
 * The member's optional note, trimmed: null when empty, or `false` when it is
 * not text or too long (the route answers 400).
 */
export function parseDeletionNote(value: unknown): string | null | false {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return false;
  const note = value.trim();
  if (note.length > DELETION_NOTE_MAX_LENGTH) return false;
  return note || null;
}

/**
 * The two e-mails of a request. `testSite` marks a request made on the
 * staging site or a preview (they share the production mailbox), so nobody
 * deletes a real account for it.
 */
export function deletionRequestEmails(
  requester: DeletionRequester,
  note: string | null,
  now: Date,
  testSite: boolean,
): { toAssociation: DeletionEmail; toMember: DeletionEmail } {
  const who = requester.name?.trim() || requester.email;
  const when = PARIS_DATE.format(now);
  const test = testSite ? "[TEST, site de préproduction] " : "";

  const toAssociation: DeletionEmail = {
    subject: `${test}Demande de suppression de compte : ${who}`,
    html: `
      <p>${escapeHtml(who)} demande la suppression de son compte de l’espace membres et de l’application.</p>
      <ul>
        <li>Nom : ${escapeHtml(requester.name ?? "(non renseigné)")}</li>
        <li>E-mail du compte : ${escapeHtml(requester.email)}</li>
        <li>Identifiant du compte : ${escapeHtml(requester.id)}</li>
        <li>Demande envoyée le ${escapeHtml(when)}, depuis la session connectée du membre</li>
      </ul>
      ${note ? `<p>Message du membre :</p><blockquote>${escapeHtmlWithBreaks(note)}</blockquote>` : ""}
      <p>À faire dans le mois (RGPD, article 17) : un superadmin supprime le compte dans l’administration (Membres › la fiche du membre › « Supprimer définitivement… »), puis répond au membre. Pensez aussi à le retirer du fichier des adhérents si son adhésion est terminée. Répondre à cet e-mail écrit directement au membre.</p>
    `,
  };

  const toMember: DeletionEmail = {
    subject: `${test}Votre demande de suppression de compte est bien arrivée`,
    html: `
      <p>Bonjour ${escapeHtml(requester.name?.trim() || "")},</p>
      <p>Nous avons bien reçu votre demande de suppression de votre compte de l’espace membres et de l’application du Bon Tempérament, envoyée le ${escapeHtml(when)}.</p>
      <p>Nous la traitons dans un délai d’un mois et vous écrivons quand c’est fait. Si vous changez d’avis d’ici là, répondez simplement à cet e-mail.</p>
      <p>Chaleureusement et musicalement,</p>
      <p>L’équipe du <strong>Bon Tempérament</strong></p>
    `,
  };

  return { toAssociation, toMember };
}
