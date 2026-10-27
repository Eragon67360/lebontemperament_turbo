// Run with: npx tsx lib/formRateLimit.test.ts
//
// Rate limits of the public forms (audit SEC-010): the IP address and the
// recipient are counted apart, as SHA-256 hashes only; a refused count
// limits the submission; a count that fails never blocks it. The calls must
// match the migration's rate_limit_allow(). Fake addresses only.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { limiter, resetFakes } from "./testing/routeFakes";

const {
  clientIp,
  hashKey,
  ipKey,
  isFormRateLimited,
  PER_IP,
  PER_RECIPIENT,
  recipientKey,
} = await import("./formRateLimit");

const warnings: string[] = [];
console.warn = (...args: unknown[]) => {
  warnings.push(args.map(String).join(" "));
};

// SHA-256, 64 lowercase hex characters.
assert.equal(
  hashKey("abc"),
  "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
);
assert.match(hashKey("visiteur@example.com"), /^[0-9a-f]{64}$/);

// The visitor's IP: Vercel's x-real-ip, else the first x-forwarded-for entry.
const headers = (init: Record<string, string>) => new Headers(init);
assert.equal(
  clientIp(
    headers({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1" }),
  ),
  "203.0.113.7",
);
assert.equal(
  clientIp(headers({ "x-forwarded-for": " 198.51.100.1 , 10.0.0.1" })),
  "198.51.100.1",
);
assert.equal(
  clientIp(headers({ "x-real-ip": " ", "x-forwarded-for": "198.51.100.1" })),
  "198.51.100.1",
);
assert.equal(clientIp(headers({})), null);

// IPv4 as is, IPv4-mapped IPv6 as IPv4, IPv6 by its /64 network.
assert.equal(ipKey("203.0.113.7"), "203.0.113.7");
assert.equal(ipKey("::ffff:203.0.113.7"), "203.0.113.7");
assert.equal(ipKey("::FFFF:cb00:7107"), "203.0.113.7");
assert.equal(
  ipKey("2001:db8:85a3:8d3:1319:8a2e:370:7348"),
  "2001:db8:85a3:8d3::/64",
);
assert.equal(ipKey(" 2001:DB8:85A3:08D3::1 "), "2001:db8:85a3:8d3::/64");
assert.equal(ipKey("2001:db8::1"), "2001:db8:0:0::/64");
assert.equal(ipKey("2001:db8:1:2::"), "2001:db8:1:2::/64");
assert.equal(ipKey("fe80::1%eth0"), "fe80:0:0:0::/64");
assert.equal(
  ipKey("2001:db8:1:2:ffff::1"),
  ipKey("2001:db8:1:2:aaaa:bbbb:cccc:dddd"),
);
assert.notEqual(ipKey("2001:db8:1:2::1"), ipKey("2001:db8:1:3::1"));
assert.equal(ipKey("unknown"), "unknown");

// One mailbox, however the address is written.
assert.equal(recipientKey("  Visiteur@Example.COM "), "visiteur@example.com");
assert.equal(
  recipientKey("visiteur+lettre@example.com"),
  "visiteur@example.com",
);
assert.equal(recipientKey("pre.nom@example.com"), "pre.nom@example.com");
assert.equal(recipientKey("Pre.Nom+promo@gmail.com"), "prenom@gmail.com");
assert.equal(recipientKey("pre.nom@googlemail.com"), "prenom@gmail.com");
assert.equal(recipientKey("+tag@example.com"), "+tag@example.com");

// The limits as documented, within what rate_limit_allow() accepts.
assert.deepEqual(PER_IP, { max: 5, windowSeconds: 600 });
assert.deepEqual(PER_RECIPIENT, { max: 3, windowSeconds: 3600 });

type Call = {
  scope: string;
  keyHash: string;
  max: number;
  windowSeconds: number;
};
function counter(answers: (boolean | Error)[]) {
  const calls: Call[] = [];
  const count = async (
    scope: string,
    keyHash: string,
    limit: { max: number; windowSeconds: number },
  ) => {
    calls.push({ scope, keyHash, ...limit });
    const answer = answers.shift() ?? true;
    if (answer instanceof Error) throw answer;
    return answer;
  };
  return { calls, count };
}
const visitor = headers({ "x-real-ip": "203.0.113.7" });

async function main() {
  // Allowed: counted once per IP and once per recipient, as hashes.
  {
    const { calls, count } = counter([true, true]);
    assert.equal(
      await isFormRateLimited(
        "contact",
        visitor,
        "Visiteur@Example.com",
        count,
      ),
      false,
    );
    assert.deepEqual(calls, [
      {
        scope: "contact:ip",
        keyHash: hashKey("203.0.113.7"),
        max: 5,
        windowSeconds: 600,
      },
      {
        scope: "contact:email",
        keyHash: hashKey("visiteur@example.com"),
        max: 3,
        windowSeconds: 3600,
      },
    ]);
    const sent = JSON.stringify(calls).toLowerCase();
    assert.ok(!sent.includes("203.0.113.7") && !sent.includes("visiteur@"));
  }

  // The IP refused: limited, and the recipient isn't counted.
  {
    const { calls, count } = counter([false]);
    assert.equal(
      await isFormRateLimited(
        "subscribe",
        visitor,
        "visiteur@example.com",
        count,
      ),
      true,
    );
    assert.deepEqual(
      calls.map((c) => c.scope),
      ["subscribe:ip"],
    );
  }

  // The recipient refused: limited.
  {
    const { calls, count } = counter([true, false]);
    assert.equal(
      await isFormRateLimited("memory", visitor, "visiteur@example.com", count),
      true,
    );
    assert.deepEqual(
      calls.map((c) => c.scope),
      ["memory:ip", "memory:email"],
    );
  }

  // The count fails: allowed at once, with a warning.
  {
    warnings.length = 0;
    const { calls, count } = counter([new Error("PGRST202 missing")]);
    assert.equal(
      await isFormRateLimited(
        "contact",
        visitor,
        "visiteur@example.com",
        count,
      ),
      false,
    );
    assert.equal(calls.length, 1);
    assert.ok(warnings.some((w) => w.includes("limits not checked")));
  }

  // No client IP (local development): only the recipient is counted.
  {
    warnings.length = 0;
    const { calls, count } = counter([false]);
    assert.equal(
      await isFormRateLimited(
        "contact",
        headers({}),
        "visiteur@example.com",
        count,
      ),
      true,
    );
    assert.deepEqual(
      calls.map((c) => c.scope),
      ["contact:email"],
    );
    assert.ok(warnings.some((w) => w.includes("no client IP")));
  }

  // By default, through rate_limit_allow() with the service-role client.
  {
    resetFakes();
    assert.equal(
      await isFormRateLimited("contact", visitor, "visiteur@example.com"),
      false,
    );
    assert.deepEqual(limiter.calls, [
      {
        fn: "rate_limit_allow",
        args: {
          p_scope: "contact:ip",
          p_key_hash: hashKey("203.0.113.7"),
          p_max: 5,
          p_window_seconds: 600,
        },
      },
      {
        fn: "rate_limit_allow",
        args: {
          p_scope: "contact:email",
          p_key_hash: hashKey("visiteur@example.com"),
          p_max: 3,
          p_window_seconds: 3600,
        },
      },
    ]);

    // The database says no: limited.
    for (let n = 0; n < 2; n += 1) {
      await isFormRateLimited("contact", visitor, "visiteur@example.com");
    }
    assert.equal(
      await isFormRateLimited("contact", visitor, "visiteur@example.com"),
      true,
    );

    // The database can't answer: allowed.
    for (const mode of ["missing-function", "unreachable", "no-key"] as const) {
      resetFakes();
      limiter.mode = mode;
      assert.equal(
        await isFormRateLimited("contact", visitor, "visiteur@example.com"),
        false,
        mode,
      );
    }
  }

  // The call matches the migration: function name, argument names and types,
  // service_role's EXECUTE, and the scopes and limits it accepts.
  {
    const folder = new URL("../../../supabase/migrations/", import.meta.url);
    const file = readdirSync(folder).find((name) =>
      name.endsWith("_form_rate_limits.sql"),
    );
    assert.ok(file, "the rate-limit migration is missing");
    const sql = readFileSync(new URL(file, folder), "utf8");
    assert.match(
      sql,
      /create or replace function public\.rate_limit_allow\(\s*p_scope text,\s*p_key_hash text,\s*p_max integer,\s*p_window_seconds integer\s*\)\s*returns boolean/,
    );
    assert.match(
      sql,
      /grant execute on function public\.rate_limit_allow\(text, text, integer, integer\) to service_role;/,
    );
    const scopeRule = /p_scope !~ '([^']+)'/.exec(sql)?.[1];
    assert.ok(scopeRule);
    for (const form of ["contact", "subscribe", "memory"]) {
      assert.match(`${form}:ip`, new RegExp(scopeRule));
      assert.match(`${form}:email`, new RegExp(scopeRule));
    }
    for (const limit of [PER_IP, PER_RECIPIENT]) {
      assert.ok(limit.max >= 1 && limit.windowSeconds <= 86400);
    }
  }

  console.log("formRateLimit: ok");
}

await main();
