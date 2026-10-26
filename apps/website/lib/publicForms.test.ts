// Run with: npx tsx lib/publicForms.test.ts
//
// The public forms that send e-mail (audit SEC-010): past the per-IP or the
// per-recipient limit they answer 429 and store and send nothing; when the
// limit can't be checked, they still work. The real routes run against the
// fakes of testing/routeFakes.ts: no e-mail, no database. Fake values only.
import assert from "node:assert/strict";
import {
  afterTasks,
  inserted,
  limiter,
  NextRequest,
  resetFakes,
  runAfterTasks,
  sentMail,
} from "./testing/routeFakes";

process.env.ADMIN_EMAIL = "admin@example.org";
delete process.env.GOOGLE_APPS_SCRIPT_URL;

const contact = await import("../app/api/contact/route");
const subscribe = await import("../app/api/subscribe/route");
const memory = await import("../app/api/anniversary/submit-memory/route");
const { RATE_LIMITED_MESSAGE } = await import("./formRateLimit");

const warnings: string[] = [];
console.warn = (...args: unknown[]) => {
  warnings.push(args.map(String).join(" "));
};

function post(path: string, body: Record<string, unknown>, ip = "203.0.113.7") {
  return new NextRequest(`https://www.example.com${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": ip },
    body: JSON.stringify(body),
  });
}

const FAILING = ["missing-function", "unreachable", "no-key"] as const;

// ------------------------------------------------------------- /api/contact
const contactBody = (email: string) => ({
  firstName: "Zoé",
  lastName: "TESTNOM",
  email,
  subject: "Sujet-unique",
  message: "Message-unique <b>gras</b>",
  fillTimeMs: 12000,
});
const sendContact = (email: string, ip?: string) =>
  contact.POST(post("/api/contact", contactBody(email), ip));

async function contactTests() {
  // Allowed: the association's e-mail and the visitor's confirmation.
  resetFakes();
  const ok = await sendContact("visiteur@example.com");
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), {
    success: true,
    message: "Votre demande de contact a bien été envoyée",
  });
  assert.deepEqual(
    sentMail.map((m) => m.to),
    ["contact@example.org", "visiteur@example.com"],
  );

  // 5 per IP: the 6th from the same address is refused and sends nothing.
  resetFakes();
  for (let i = 1; i <= 5; i += 1) {
    assert.equal((await sendContact(`visiteur${i}@example.com`)).status, 200);
  }
  const limited = await sendContact("visiteur6@example.com");
  assert.equal(limited.status, 429);
  assert.deepEqual(await limited.json(), {
    success: false,
    message: RATE_LIMITED_MESSAGE,
  });
  assert.equal(sentMail.length, 10);
  assert.ok(sentMail.every((m) => m.to !== "visiteur6@example.com"));
  // Another visitor isn't affected.
  assert.equal(
    (await sendContact("visiteur6@example.com", "198.51.100.9")).status,
    200,
  );

  // 3 per recipient, from any IP and however the address is written.
  resetFakes();
  const addresses = [
    "cible@example.com",
    "Cible+1@example.com",
    "CIBLE+2@Example.com",
    "cible+3@example.com",
  ];
  const statuses = [];
  for (const [i, address] of addresses.entries()) {
    statuses.push((await sendContact(address, `198.51.100.${i + 1}`)).status);
  }
  assert.deepEqual(statuses, [200, 200, 200, 429]);
  assert.equal(sentMail.length, 6);
  assert.ok(sentMail.every((m) => m.to !== "cible+3@example.com"));

  // The limit can't be checked: the message still goes, with a warning.
  for (const mode of FAILING) {
    resetFakes();
    limiter.mode = mode;
    warnings.length = 0;
    assert.equal((await sendContact("visiteur@example.com")).status, 200, mode);
    assert.equal(sentMail.length, 2, mode);
    assert.ok(
      warnings.some((w) => w.includes("[rate-limit] contact")),
      mode,
    );
  }

  // Honeypot and invalid requests: nothing counted, nothing sent.
  resetFakes();
  await contact.POST(
    post("/api/contact", {
      ...contactBody("visiteur@example.com"),
      website: "x",
    }),
  );
  assert.equal((await sendContact("not-an-address")).status, 400);
  assert.equal(limiter.calls.length, 0);
  assert.equal(sentMail.length, 0);
}

// ----------------------------------------------------------- /api/subscribe
const sendSubscribe = (email: string, ip?: string) =>
  subscribe.POST(post("/api/subscribe", { email }, ip));

async function subscribeTests() {
  // Allowed: the e-mails go after the answer.
  resetFakes();
  const ok = await sendSubscribe("lecteur@example.com");
  assert.equal(ok.status, 200);
  assert.equal(afterTasks.length, 1);
  await runAfterTasks();
  assert.deepEqual(
    sentMail.map((m) => m.to),
    ["admin@example.org", "lecteur@example.com"],
  );

  // 5 per IP: the 6th is refused and queues nothing.
  resetFakes();
  for (let i = 1; i <= 5; i += 1) {
    assert.equal((await sendSubscribe(`lecteur${i}@example.com`)).status, 200);
  }
  const limited = await sendSubscribe("lecteur6@example.com");
  assert.equal(limited.status, 429);
  assert.deepEqual(await limited.json(), { error: RATE_LIMITED_MESSAGE });
  assert.equal(afterTasks.length, 5);
  await runAfterTasks();
  assert.equal(sentMail.length, 10);
  assert.ok(sentMail.every((m) => m.to !== "lecteur6@example.com"));

  // 3 per recipient.
  resetFakes();
  const statuses = [];
  for (let i = 1; i <= 4; i += 1) {
    statuses.push(
      (await sendSubscribe("lecteur@example.com", `198.51.100.${i}`)).status,
    );
  }
  assert.deepEqual(statuses, [200, 200, 200, 429]);
  assert.equal(afterTasks.length, 3);

  // The limit can't be checked: the sign-up still goes.
  for (const mode of FAILING) {
    resetFakes();
    limiter.mode = mode;
    assert.equal(
      (await sendSubscribe("lecteur@example.com")).status,
      200,
      mode,
    );
    assert.equal(afterTasks.length, 1, mode);
  }
}

// ----------------------------------------------- /api/anniversary/submit-memory
const memoryBody = (email: string) => ({
  name: "Zoé TESTNOM",
  email,
  message: "Souvenir-unique <i>italique</i>",
  year: "1987",
  fillTimeMs: 12000,
});
const sendMemory = (email: string, ip?: string) =>
  memory.POST(post("/api/anniversary/submit-memory", memoryBody(email), ip));

async function memoryTests() {
  // Allowed: stored, the visitor's confirmation and the admin's notice.
  resetFakes();
  const ok = await sendMemory("ancien@example.com");
  assert.equal(ok.status, 200);
  const answer = await ok.json();
  assert.equal(answer.success, true);
  assert.equal(typeof answer.id, "string");
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0]?.table, "anniversary_memories");
  assert.deepEqual(
    sentMail.map((m) => m.to),
    ["ancien@example.com", "admin@example.org"],
  );

  // 5 per IP: the 6th is refused, nothing stored or sent.
  resetFakes();
  for (let i = 1; i <= 5; i += 1) {
    assert.equal((await sendMemory(`ancien${i}@example.com`)).status, 200);
  }
  const limited = await sendMemory("ancien6@example.com");
  assert.equal(limited.status, 429);
  assert.deepEqual(await limited.json(), { error: RATE_LIMITED_MESSAGE });
  assert.equal(inserted.length, 5);
  assert.equal(sentMail.length, 10);
  assert.ok(sentMail.every((m) => m.to !== "ancien6@example.com"));

  // 3 per recipient.
  resetFakes();
  const statuses = [];
  for (let i = 1; i <= 4; i += 1) {
    statuses.push(
      (await sendMemory("ancien@example.com", `198.51.100.${i}`)).status,
    );
  }
  assert.deepEqual(statuses, [200, 200, 200, 429]);
  assert.equal(inserted.length, 3);
  assert.equal(sentMail.length, 6);

  // The limit can't be checked: the memory is still saved and acknowledged.
  for (const mode of FAILING) {
    resetFakes();
    limiter.mode = mode;
    assert.equal((await sendMemory("ancien@example.com")).status, 200, mode);
    assert.equal(inserted.length, 1, mode);
    assert.equal(sentMail.length, 2, mode);
  }
}

await contactTests();
await subscribeTests();
await memoryTests();
console.log("publicForms: ok");
