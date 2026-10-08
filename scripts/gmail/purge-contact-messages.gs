/**
 * Moves to the bin the contact messages older than the privacy policy allows
 * (« 3 ans au plus après le dernier échange », #355).
 *
 * The website's contact form and the app's contact screen don't store
 * messages: they send them by e-mail to the association's Gmail
 * (lebontemperament@gmail.com), with an acknowledgement to the sender. So the
 * purge lives in that mailbox, as a Google Apps Script with a daily trigger.
 *
 * Setup, signed in to the association's Google account:
 *   1. https://script.google.com > New project, paste this file, save.
 *   2. Run `purgeContactMessages` once: accept the Gmail permission. With
 *      DRY_RUN = true it only logs what it would move (View > Logs).
 *   3. Set DRY_RUN = false, save, and run `installDailyTrigger` once.
 *
 * A thread goes to the bin when its last message is more than 3 years old,
 * so a conversation that went on keeps its whole history until 3 years after
 * the last reply. Gmail empties the bin after 30 days.
 */
const DRY_RUN = true;
const RETENTION_YEARS = 3;

// Subjects written by apps/website/app/api/contact/route.ts and
// apps/website/app/api/contact/mobile/route.ts (and their replies, « Re: … »).
const SUBJECT_PREFIXES = [
  "Nouvelle demande de contact de ",
  "[App] ",
  "Votre demande de contact est bien arrivée",
  "Votre demande de contact a bien été envoyée",
];
const SEARCH =
  'in:anywhere -in:trash older_than:' + RETENTION_YEARS + 'y (' +
  'subject:"Nouvelle demande de contact de" OR subject:"App" OR ' +
  'subject:"Votre demande de contact")';

function isContactThread(thread) {
  const subject = thread.getFirstMessageSubject().replace(/^(re|tr|fwd?)\s*:\s*/i, "");
  return SUBJECT_PREFIXES.some(function (prefix) {
    return subject.indexOf(prefix) === 0;
  });
}

function purgeContactMessages() {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - RETENTION_YEARS);
  let moved = 0;
  for (let start = 0; ; start += 100) {
    const threads = GmailApp.search(SEARCH, start, 100);
    if (threads.length === 0) break;
    const expired = threads.filter(function (thread) {
      return isContactThread(thread) && thread.getLastMessageDate() < cutoff;
    });
    expired.forEach(function (thread) {
      Logger.log((DRY_RUN ? "Would move: " : "Moved: ") +
        thread.getLastMessageDate().toISOString().slice(0, 10) + " " +
        thread.getFirstMessageSubject());
    });
    if (!DRY_RUN && expired.length > 0) {
      GmailApp.moveThreadsToTrash(expired);
      // The search no longer returns the moved threads: stay on this page.
      start -= expired.length;
    }
    moved += expired.length;
  }
  Logger.log((DRY_RUN ? "Dry run, would move " : "Moved ") + moved + " thread(s).");
}

function installDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "purgeContactMessages") {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger("purgeContactMessages").timeBased().everyDays(1).atHour(4).create();
}
