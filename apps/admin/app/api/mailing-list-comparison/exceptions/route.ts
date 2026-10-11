// app/api/mailing-list-comparison/exceptions/route.ts
//
// Addresses kept on purpose out of a list's comparison with the roster: on
// the list without being in the roster (the conductor, a partner), or in the
// roster without being on the list. POST keeps one, DELETE stops keeping it.
import { checkAuthorization } from "@/utils/auth";
import {
  addExceptionSchema,
  isMissingTable,
  NOT_INSTALLED_MESSAGE,
  removeExceptionSchema,
} from "@/utils/mailing-list/schemas";
import { createAdminClient } from "@/utils/supabase/admin";
import { mailingListKey } from "@repo/domain/roster/mailingList";
import { NextResponse } from "next/server";

function failure(error: { code?: string; message: string }, method: string) {
  if (isMissingTable(error)) {
    return NextResponse.json(
      { error: NOT_INSTALLED_MESSAGE, notInstalled: true },
      { status: 503 },
    );
  }
  // 23503: the group's comparison isn't enabled.
  if (error.code === "23503") {
    return NextResponse.json(
      { error: "La comparaison n'est pas activée pour ce groupe." },
      { status: 404 },
    );
  }
  console.error(
    `${method} /api/mailing-list-comparison/exceptions:`,
    error.message,
  );
  return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
}

export async function POST(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = addExceptionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { groupEmail, email, note } = parsed.data;

  const { error } = await createAdminClient()
    .from("mailing_list_exceptions")
    .upsert(
      {
        group_email: groupEmail,
        email: mailingListKey(email),
        note,
        created_by: auth.user.id,
      },
      { onConflict: "group_email,email" },
    );
  if (error) return failure(error, "POST");
  return NextResponse.json({ kept: true });
}

export async function DELETE(request: Request) {
  const auth = await checkAuthorization();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = removeExceptionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { groupEmail, email } = parsed.data;

  const { error } = await createAdminClient()
    .from("mailing_list_exceptions")
    .delete()
    .eq("group_email", groupEmail)
    .eq("email", mailingListKey(email));
  if (error) return failure(error, "DELETE");
  return NextResponse.json({ kept: false });
}
