// What the bug-report conversation routes may write (CODE-004). The message
// routes used to spread the request body into `.insert()` and `.update()`,
// so the sender, the receiver, the report or the read flag could be set from
// the body. Each schema lists what the dialogs send
// (components/BugReportDetailsDialog.tsx, components/MessagesDialog.tsx):
// `{ bug_report_id, message }` to write, `{ bug_report_id }` to mark a
// conversation as read. The sender, the receiver and the read flag are the
// route's to set. Unknown keys are refused with their names (parsePatchBody).
import { z } from "zod";
import { id, idBody, requiredText } from "../apiFields";

/** POST /api/bug-messages: a message in a report's conversation. */
export const bugMessageCreateSchema = z
  .object({ bug_report_id: id, message: requiredText })
  .strict();

/** PATCH /api/bug-messages: the sender rewords a message (no screen yet). */
export const bugMessagePatchSchema = z
  .object({ id, message: requiredText })
  .strict();

/** DELETE /api/bug-messages: `{ id }`. */
export const bugMessageDeleteSchema = idBody;

/** POST /api/bug-messages/mark-read: the conversation the admin opened. */
export const markReadSchema = z.object({ bug_report_id: id }).strict();
