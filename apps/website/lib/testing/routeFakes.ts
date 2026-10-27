/**
 * Test doubles for the API route tests (run with tsx). Importing this module
 * makes every later import of the mailer, the Supabase clients, the site
 * settings, `server-only` and `next/server` load this module instead, so the
 * real route files run with no e-mail, no database and no request scope
 * (`after` only queues its task). Import it first, then load the routes with
 * `await import(…)`. Never imported by the app. Fake values only.
 */
import { registerHooks } from "node:module";

export { NextRequest, NextResponse } from "next/server.js";

const REPLACED = new Set([
  "server-only",
  "next/server",
  "@/lib/mail",
  "@/lib/siteSettings",
  "@/utils/supabase/admin",
  "@/utils/supabase/server",
]);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (REPLACED.has(specifier)) {
      return { url: import.meta.url, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

// @/lib/mail
export type SentMail = {
  from?: string;
  to?: string;
  subject?: string;
  html?: string;
};
export const sentMail: SentMail[] = [];
export function createMailer() {
  return {
    from: "site@example.org",
    transporter: {
      sendMail: async (mail: SentMail) => {
        sentMail.push(mail);
        return { messageId: `<${sentMail.length}@example.org>` };
      },
    },
  };
}

// @/lib/siteSettings
export async function getContactEmail() {
  return "contact@example.org";
}

// next/server's after(): queued here, run by runAfterTasks().
export const afterTasks: (() => unknown)[] = [];
export function after(task: (() => unknown) | Promise<unknown>) {
  afterTasks.push(typeof task === "function" ? task : () => task);
}
export async function runAfterTasks() {
  for (const task of afterTasks.splice(0)) await task();
}

// @/utils/supabase/admin: rate_limit_allow() as the migration defines it,
// without the clock (a test takes seconds, the windows are minutes), or a
// database that can't answer.
type RpcAnswer = {
  data: unknown;
  error: { code: string; message: string } | null;
};
export const limiter = {
  mode: "count" as "count" | "missing-function" | "unreachable" | "no-key",
  calls: [] as { fn: string; args: Record<string, unknown> }[],
  counted: new Map<string, number>(),
};
export function createAdminClient() {
  if (limiter.mode === "no-key") throw new Error("supabaseKey is required.");
  return {
    rpc(fn: string, args: Record<string, unknown>) {
      limiter.calls.push({ fn, args });
      const answer = Promise.resolve().then((): RpcAnswer => {
        if (limiter.mode === "unreachable") throw new TypeError("fetch failed");
        if (limiter.mode === "missing-function" || fn !== "rate_limit_allow") {
          return {
            data: null,
            error: { code: "PGRST202", message: "Could not find the function" },
          };
        }
        const key = `${args.p_scope}|${args.p_key_hash}`;
        const seen = limiter.counted.get(key) ?? 0;
        if (seen >= Number(args.p_max)) return { data: false, error: null };
        limiter.counted.set(key, seen + 1);
        return { data: true, error: null };
      });
      return { abortSignal: () => answer };
    },
  };
}

// @/utils/supabase/server: inserts are recorded. Works for
// `.insert(row).select("id").single()` and for a plain `await .insert(row)`.
export const inserted: { table: string; row: Record<string, unknown> }[] = [];
export async function createClient() {
  return {
    from(table: string) {
      return {
        insert(row: Record<string, unknown>) {
          inserted.push({ table, row });
          const done = Promise.resolve({ data: null, error: null });
          const id = row.id ?? "00000000-0000-4000-8000-000000000001";
          return {
            then: done.then.bind(done),
            select: () => ({
              single: async () => ({ data: { id }, error: null }),
            }),
          };
        },
      };
    },
  };
}

export function resetFakes() {
  sentMail.length = 0;
  afterTasks.length = 0;
  inserted.length = 0;
  limiter.mode = "count";
  limiter.calls.length = 0;
  limiter.counted.clear();
}
