// What the « Membres » account routes accept (CODE-004). Each schema lists
// what the screens send: « Ajouter un membre »
// (app/dashboard/admin/users/page.tsx), « Changer le rôle » and « Changer
// l'e-mail » (components/users/useMemberDialogs.tsx). Unknown keys are refused
// with their names (parsePatchBody). Who may do what stays with
// utils/access.ts (decideUserCreation, decideRoleChange, decideEmailChange).
import { z } from "zod";
import { USER_ROLES } from "../access";
import { id } from "../apiFields";

const role = z.enum(USER_ROLES);

/** POST /api/users: the account « Ajouter un membre » creates. */
export const userCreateSchema = z
  .object({
    email: z.email(),
    password: z.string().min(1),
    role,
    display_name: z.string().optional(),
  })
  .strict();

/** PATCH /api/users: a member's new role. */
export const userRolePatchSchema = z.object({ userId: id, role }).strict();

/**
 * PATCH /api/users/email: the new address itself is checked afterwards by
 * `checkNewEmail` (utils/users/emailChange.ts), with its own messages.
 */
export const userEmailPatchSchema = z
  .object({ userId: id, email: z.string() })
  .strict();
