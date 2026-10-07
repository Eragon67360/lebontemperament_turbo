// Who receives which push for a signalement, and what it says. Pure, so
// plan_test.ts covers every case without the database or FCM.
import type { TokenMessage } from "../_shared/fcm.ts";

/** Android channel the app creates for signalements (« Signalements »). */
export const CHANNEL_ID = "bug_reports";

const TITLE_MAX = 80;

export interface Person {
  id: string;
  display_name: string | null;
  email: string | null;
}

export interface Report {
  id: string;
  title: string;
  reported_by: string;
}

export interface Message {
  id: string;
  bug_report_id: string;
  sender_id: string;
}

/** Superadmins (all of them, except `except`), or one member. */
export type Audience =
  { kind: "superadmins"; except: string } | { kind: "member"; userId: string };

export interface Plan {
  audience: Audience;
  message: TokenMessage;
}

/** « Prénom Nom », else the part of the e-mail before @, else « Un membre ». */
export function personName(p: Person | null): string {
  const name = p?.display_name?.trim();
  if (name) return name;
  const local = p?.email?.split("@")[0]?.trim();
  return local || "Un membre";
}

export function shortTitle(title: string): string {
  const t = title.replace(/\s+/g, " ").trim();
  return t.length > TITLE_MAX ? `${t.slice(0, TITLE_MAX - 1)}…` : t;
}

function push(
  reportId: string,
  title: string,
  body: string,
  tag: string,
): TokenMessage {
  return {
    title,
    body,
    tag,
    channelId: CHANNEL_ID,
    // The app opens the conversation from these (« report_<id> »).
    data: { type: "report", id: reportId },
  };
}

/** A new report: every superadmin but its author hears of it. */
export function planNewReport(report: Report, author: Person | null): Plan {
  return {
    audience: { kind: "superadmins", except: report.reported_by },
    message: push(
      report.id,
      "Nouveau signalement",
      `${personName(author)} : ${shortTitle(report.title)}`,
      `report-${report.id}`,
    ),
  };
}

/**
 * A new message. From the author: the superadmins hear of it. From anyone
 * else (a superadmin answering): the author gets the dedicated « Réponse à
 * votre signalement ». The text of the message is never in the push: it can
 * be personal, and lock screens are seen by others.
 */
export function planNewMessage(
  report: Report,
  message: Message,
  sender: Person | null,
): Plan {
  const title = shortTitle(report.title);
  if (message.sender_id === report.reported_by) {
    return {
      audience: { kind: "superadmins", except: message.sender_id },
      message: push(
        report.id,
        "Nouveau message sur un signalement",
        `${personName(sender)} a répondu sur « ${title} »`,
        `report-${report.id}`,
      ),
    };
  }
  return {
    audience: { kind: "member", userId: report.reported_by },
    message: push(
      report.id,
      "Réponse à votre signalement",
      `${personName(sender)} vous a répondu sur « ${title} »`,
      `report-reply-${report.id}`,
    ),
  };
}
