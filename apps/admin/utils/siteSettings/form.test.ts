import {
  DEFAULT_SITE_SETTINGS,
  DONATION_TIERS_MAX,
  parseSiteSetting,
  SITE_SETTING_KEYS,
  type SiteSettings,
} from "@repo/domain/utils/siteSettings";
import assert from "node:assert/strict";
import {
  addTier,
  amountLabel,
  canAddTier,
  canRemoveTier,
  checkDonationsForm,
  checkTextForm,
  dateTimeFr,
  differencesLabel,
  donationsErrorKey,
  donationsErrorLabel,
  donationsForm,
  donationsInput,
  isSameDonationsForm,
  isSameTextValues,
  lockedReason,
  longDateFr,
  moveTier,
  provenanceLabel,
  removeTier,
  revisionHeading,
  SETTING_INFO,
  settingDifferences,
  settingFacts,
  settingFields,
  settingSummary,
  shorten,
  TEXT_SETTING_KEYS,
  textErrorKey,
  textInput,
  textValues,
  tierErrorKey,
  tierName,
} from "./form";

const NBSP = "\u00a0";
const defaults = DEFAULT_SITE_SETTINGS;

// --- Every setting has a card, in the page's order ---------------------------
assert.deepEqual(
  SITE_SETTING_KEYS.map((key) => SETTING_INFO[key].title),
  ["Coordonnées", "Réseaux sociaux", "Dons", "Rejoindre", "Mentions légales"],
);
assert.deepEqual(TEXT_SETTING_KEYS, [
  "contact",
  "social_links",
  "joining",
  "legal_notice",
]);
for (const key of SITE_SETTING_KEYS) {
  const info = SETTING_INFO[key];
  assert.ok(info.help.length > 0 && info.sitePage.startsWith("/"), key);
  // Plain French for admins: never a column name or an enum value.
  assert.doesNotMatch(
    `${info.title} ${info.help} ${info.dialogTitle}`,
    /social_links|legal_notice|helloassoUrl/,
  );
}

// --- Why a setting is locked ---------------------------------------------------
assert.equal(
  lockedReason("contact"),
  "Réservé aux superadmins : cette adresse reçoit les messages du formulaire de contact.",
);
assert.equal(lockedReason("donations"), "Réservé aux superadmins.");

// --- Text forms: the site's current values come back unchanged ------------------
for (const key of TEXT_SETTING_KEYS) {
  const values = textValues(key, defaults[key]);
  const check = checkTextForm(key, values);
  assert.ok(check.ok, `${key}: the original values are valid`);
  assert.deepEqual(check.value, defaults[key], `${key}: round trip`);
  // One input per field, named as the rules name it.
  assert.deepEqual(
    Object.keys(values).sort(),
    settingFields(key)
      .map((field) => field.key)
      .sort(),
    `${key}: one value per field`,
  );
  assert.ok(isSameTextValues(values, { ...values }));
}

// --- Contact: every faulty field at once, in plain French --------------------------
{
  const values = textValues("contact", defaults.contact);
  const check = checkTextForm("contact", {
    ...values,
    email: "pas une adresse",
    postalCode: "",
    city: "   ",
  });
  assert.ok(!check.ok);
  assert.deepEqual(Object.keys(check.errors), ["email", "postalCode", "city"]);
  assert.equal(check.errors.email, "L'adresse e-mail n'est pas valide.");
  // A blank required input only says it is to fill in.
  assert.equal(check.errors.postalCode, "À remplir.");
  assert.equal(check.errors.city, "À remplir.");
  assert.equal(check.general, null);

  const trimmed = checkTextForm("contact", {
    ...values,
    email: "  contact@example.org ",
    city: " Saverne ",
  });
  assert.ok(trimmed.ok);
  assert.deepEqual(trimmed.value, {
    ...defaults.contact,
    email: "contact@example.org",
    city: "Saverne",
  });
}

// --- Social links: the filled networks, in the site's order -------------------------
{
  const empty = textValues("social_links", { links: [] });
  assert.deepEqual(Object.keys(empty), [
    "links.facebook",
    "links.instagram",
    "links.youtube",
    "links.tiktok",
  ]);
  assert.ok(Object.values(empty).every((url) => url === ""));

  const some = checkTextForm("social_links", {
    ...empty,
    "links.tiktok": "https://www.tiktok.com/@choeur",
    "links.instagram": "  https://www.instagram.com/choeur/ ",
  });
  assert.ok(some.ok);
  assert.deepEqual(some.value, {
    links: [
      { network: "instagram", url: "https://www.instagram.com/choeur/" },
      { network: "tiktok", url: "https://www.tiktok.com/@choeur" },
    ],
  });

  // An empty form is allowed: no network is shown.
  const none = checkTextForm("social_links", empty);
  assert.ok(none.ok);
  assert.deepEqual(none.value, { links: [] });
  assert.deepEqual(
    textInput("social_links", { ...empty, "links.facebook": "   " }),
    { links: [] },
  );

  // A link to another site is refused on its own input, others still checked.
  const wrong = checkTextForm("social_links", {
    ...empty,
    "links.facebook": "https://example.org/x",
    "links.youtube": "http://www.youtube.com/@x",
  });
  assert.ok(!wrong.ok);
  assert.deepEqual(Object.keys(wrong.errors), [
    "links.facebook",
    "links.youtube",
  ]);
  assert.match(
    wrong.errors["links.facebook"] ?? "",
    /^Le lien Facebook doit commencer par https:\/\/www\.facebook\.com\//,
  );
}

// --- Joining: eight facts, each its own textarea ---------------------------------------
{
  const values = textValues("joining", defaults.joining);
  assert.deepEqual(
    settingFields("joining").map((field) => field.label),
    [
      "Présentation",
      "Lieux",
      "Horaires",
      "Âges",
      "Audition",
      "Lecture de la musique",
      "Cotisation",
      "Inscription",
    ],
  );
  const check = checkTextForm("joining", {
    ...values,
    when: "",
    fee: "x".repeat(1501),
  });
  assert.ok(!check.ok);
  assert.deepEqual(Object.keys(check.errors), ["when", "fee"]);
  assert.equal(check.errors.when, "À remplir.");
  assert.equal(check.errors.fee, "La cotisation : 1500 caractères au plus.");
}

// --- Legal notice: the register is optional --------------------------------------------
{
  const values = textValues("legal_notice", defaults.legal_notice);
  assert.equal(values.registry, "");
  const blank = checkTextForm("legal_notice", { ...values, registry: "  " });
  assert.ok(blank.ok);
  assert.equal((blank.value as SiteSettings["legal_notice"]).registry, null);
  const filled = checkTextForm("legal_notice", {
    ...values,
    registry: " Registre des associations de Saverne, volume 12 ",
  });
  assert.ok(filled.ok);
  assert.equal(
    (filled.value as SiteSettings["legal_notice"]).registry,
    "Registre des associations de Saverne, volume 12",
  );
  assert.deepEqual(
    textValues("legal_notice", {
      ...defaults.legal_notice,
      registry: "RNA W673000000",
    }).registry,
    "RNA W673000000",
  );

  const bad = checkTextForm("legal_notice", {
    ...values,
    publisherPhone: "appelez-moi",
    siret: "123",
  });
  assert.ok(!bad.ok);
  assert.deepEqual(Object.keys(bad.errors), ["publisherPhone", "siret"]);
  assert.equal(bad.errors.siret, "Le SIRET a 14 chiffres.");
}

// --- A refusal from the server lands on the right input ----------------------------------
{
  const values = textValues("contact", defaults.contact);
  assert.equal(textErrorKey(values, "postalCode"), "postalCode");
  assert.equal(textErrorKey(values, "inconnu"), null);
}

// --- Donations: the form, its rows and the amount selected on opening -------------------------
{
  const form = donationsForm(defaults.donations);
  assert.equal(form.tiers.length, 7);
  assert.deepEqual(
    form.tiers.map((tier) => tier.amount),
    ["5", "10", "15", "20", "30", "200", "2000"],
  );
  assert.equal(
    form.tiers.find((tier) => tier.key === form.defaultKey)?.amount,
    "20",
  );
  assert.equal(new Set(form.tiers.map((tier) => tier.key)).size, 7);

  const check = checkDonationsForm(form);
  assert.ok(check.ok);
  assert.deepEqual(check.value, defaults.donations);
  assert.deepEqual(donationsInput(form), {
    helloassoUrl: defaults.donations.helloassoUrl,
    tiers: defaults.donations.tiers,
    defaultAmount: 20,
  });
  assert.ok(isSameDonationsForm(form, donationsForm(defaults.donations)));

  // Adding: a blank row at the end, nothing past the maximum.
  const added = addTier(form);
  assert.equal(added.tiers.length, 8);
  assert.deepEqual(added.tiers[7], {
    key: "tier-8",
    amount: "",
    emoji: "",
    description: "",
  });
  assert.ok(!isSameDonationsForm(form, added));
  let full = form;
  while (canAddTier(full)) full = addTier(full);
  assert.equal(full.tiers.length, DONATION_TIERS_MAX);
  assert.equal(addTier(full), full);
  assert.equal(
    new Set(full.tiers.map((tier) => tier.key)).size,
    full.tiers.length,
  );

  // Moving: neighbours swap, the edges stay put.
  const movedUp = moveTier(form, "tier-3", "up");
  assert.deepEqual(
    movedUp.tiers.slice(0, 3).map((tier) => tier.amount),
    ["5", "15", "10"],
  );
  assert.equal(movedUp.defaultKey, form.defaultKey);
  const movedDown = moveTier(form, "tier-1", "down");
  assert.deepEqual(
    movedDown.tiers.slice(0, 2).map((tier) => tier.amount),
    ["10", "5"],
  );
  assert.equal(moveTier(form, "tier-1", "up"), form);
  assert.equal(moveTier(form, "tier-7", "down"), form);
  assert.equal(moveTier(form, "nope", "down"), form);

  // Removing: the selected amount hands over to the first one left.
  const withoutOther = removeTier(form, "tier-2");
  assert.equal(withoutOther.tiers.length, 6);
  assert.equal(withoutOther.defaultKey, form.defaultKey);
  const withoutSelected = removeTier(form, form.defaultKey);
  assert.equal(withoutSelected.tiers.length, 6);
  assert.equal(withoutSelected.defaultKey, "tier-1");
  assert.ok(checkDonationsForm(withoutSelected).ok);
  // Adding after a removal never reuses a key still in the form.
  const again = addTier(removeTier(form, "tier-2"));
  assert.equal(new Set(again.tiers.map((tier) => tier.key)).size, 7);
  // The last amount stays.
  let one = form;
  while (canRemoveTier(one)) one = removeTier(one, one.tiers[0]?.key ?? "");
  assert.equal(one.tiers.length, 1);
  assert.equal(one.defaultKey, one.tiers[0]?.key);
  assert.equal(removeTier(one, one.defaultKey), one);

  // Names used by the radios and the buttons.
  assert.equal(tierName(form.tiers[6]!, 6), `2${NBSP}000${NBSP}€`);
  assert.equal(tierName(added.tiers[7]!, 7), "Montant 8");
  assert.equal(tierName({ ...form.tiers[0]!, amount: "1,5" }, 0), "Montant 1");
}

// --- Donations: every faulty input at once, on the right row ---------------------------------------
{
  const form = donationsForm(defaults.donations);
  const faulty = {
    ...form,
    helloassoUrl: "https://example.org/don",
    tiers: form.tiers.map((tier, index) => {
      if (index === 1) return { ...tier, amount: "5" }; // same as the first row
      if (index === 2) return { ...tier, amount: "" };
      if (index === 4) return { ...tier, emoji: "" };
      if (index === 5) return { ...tier, description: "x".repeat(301) };
      return tier;
    }),
  };
  const check = checkDonationsForm(faulty);
  assert.ok(!check.ok);
  assert.deepEqual(Object.keys(check.errors), [
    "helloassoUrl",
    tierErrorKey("tier-2", "amount"),
    tierErrorKey("tier-3", "amount"),
    tierErrorKey("tier-5", "emoji"),
    tierErrorKey("tier-6", "description"),
  ]);
  assert.equal(
    check.errors.helloassoUrl,
    "Le lien HelloAsso doit commencer par https://www.helloasso.com/",
  );
  assert.equal(
    check.errors[tierErrorKey("tier-2", "amount")],
    "Le montant 5 € est en double.",
  );
  assert.match(
    check.errors[tierErrorKey("tier-3", "amount")] ?? "",
    /nombre entier d'euros/,
  );
  assert.equal(
    donationsErrorLabel(faulty, tierErrorKey("tier-3", "amount")),
    "Montant 3",
  );
  assert.equal(
    donationsErrorLabel(faulty, tierErrorKey("tier-5", "emoji")),
    "Emoji du montant 5",
  );
  assert.equal(
    donationsErrorLabel(faulty, tierErrorKey("tier-6", "description")),
    "Description du montant 6",
  );
  assert.equal(donationsErrorLabel(faulty, "helloassoUrl"), "Lien HelloAsso");

  // A decimal or a negative amount is not a whole number of euros.
  for (const amount of ["12.5", "-3", "0", "abc"]) {
    const bad = checkDonationsForm({
      ...form,
      tiers: form.tiers.map((tier, index) =>
        index === 0 ? { ...tier, amount } : tier,
      ),
    });
    assert.ok(!bad.ok, amount);
    assert.deepEqual(Object.keys(bad.errors), [
      tierErrorKey("tier-1", "amount"),
    ]);
  }

  // Changing the selected amount's number keeps it selected.
  const renumbered = {
    ...form,
    tiers: form.tiers.map((tier) =>
      tier.key === form.defaultKey ? { ...tier, amount: "25" } : tier,
    ),
  };
  const ok = checkDonationsForm(renumbered);
  assert.ok(ok.ok);
  assert.equal(ok.value.defaultAmount, 25);

  // Where a refusal from the server lands.
  assert.equal(donationsErrorKey(form, "helloassoUrl"), "helloassoUrl");
  assert.equal(donationsErrorKey(form, "defaultAmount"), "defaultAmount");
  assert.equal(donationsErrorKey(form, "tiers"), "tiers");
  assert.equal(
    donationsErrorKey(form, "tiers.2.description"),
    tierErrorKey("tier-3", "description"),
  );
  assert.equal(
    donationsErrorKey(form, "tiers.0"),
    tierErrorKey("tier-1", "amount"),
  );
  assert.equal(donationsErrorKey(form, "tiers.99.amount"), null);
  assert.equal(donationsErrorKey(form, "autre"), null);
  // After moving a row, the server's index still finds the row at that place.
  assert.equal(
    donationsErrorKey(moveTier(form, "tier-3", "up"), "tiers.1.amount"),
    tierErrorKey("tier-3", "amount"),
  );

  // The same rules as the server: whatever passes here passes there.
  const sent = checkDonationsForm(form);
  assert.ok(sent.ok && parseSiteSetting("donations", sent.value).ok);
}

// --- Provenance --------------------------------------------------------------------------------------
assert.equal(provenanceLabel(undefined, false), "Valeurs d'origine du site");
assert.equal(
  provenanceLabel(
    { updatedAt: "2026-10-12T10:30:00Z", updatedBy: "Marie Martin" },
    false,
  ),
  "Modifié le 12 octobre 2026 par Marie Martin",
);
assert.equal(
  provenanceLabel(
    { updatedAt: "2026-10-12T10:30:00Z", updatedBy: null },
    false,
  ),
  "Modifié le 12 octobre 2026",
);
// Saved, but no longer valid: the site shows the original values.
assert.equal(
  provenanceLabel(
    { updatedAt: "2026-10-12T10:30:00Z", updatedBy: "Marie Martin" },
    true,
  ),
  "Valeurs d'origine du site",
);
assert.equal(
  provenanceLabel({ updatedAt: "pas une date", updatedBy: "Léa" }, false),
  "Modifié par Léa",
);

// --- Dates, amounts, sentences ----------------------------------------------------------------------------
// Paris time, whatever the machine's: 23:30 UTC on 11 October is already the 12th.
assert.equal(longDateFr("2026-10-11T23:30:00Z"), "12 octobre 2026");
assert.equal(longDateFr("2026-01-05T09:00:00Z"), "5 janvier 2026");
assert.equal(longDateFr("n'importe quoi"), "");
assert.equal(dateTimeFr("2026-10-12T12:30:00Z"), "12 octobre 2026 à 14 h 30");
assert.equal(dateTimeFr("2026-10-12T07:05:00Z"), "12 octobre 2026 à 9 h 05");
assert.equal(dateTimeFr("2026-10-12T12:00:00Z"), "12 octobre 2026 à 14 h");
assert.equal(dateTimeFr("?"), "");
assert.equal(amountLabel(5), `5${NBSP}€`);
assert.equal(amountLabel(2000), `2${NBSP}000${NBSP}€`);
assert.equal(amountLabel(100000), `100${NBSP}000${NBSP}€`);
assert.equal(shorten("  un   texte\ncourt ", 40), "un texte court");
assert.equal(shorten("abcdefghij", 6), "abcde…");

// --- What a card shows -----------------------------------------------------------------------------------------
{
  const contact = settingFacts("contact", defaults.contact);
  assert.deepEqual(
    contact.map((fact) => fact.label),
    ["Adresse e-mail", "Adresse"],
  );
  assert.equal(contact[1]?.text, "3 Rue Clemenceau, 67700 Saverne");

  const social = settingFacts("social_links", defaults.social_links);
  assert.deepEqual(
    social.map((fact) => fact.label),
    ["Facebook", "Instagram", "YouTube", "TikTok"],
  );
  assert.equal(social[1]?.href, "https://www.instagram.com/lebontemperament_/");
  assert.deepEqual(settingFacts("social_links", { links: [] }), []);

  const donations = settingFacts("donations", defaults.donations);
  assert.equal(donations[0]?.href, defaults.donations.helloassoUrl);
  assert.equal(donations[1]?.items?.length, 7);
  assert.ok(donations[1]?.items?.[0]?.startsWith(`5${NBSP}€ 🥤 Achat de`));
  assert.equal(donations[2]?.text, `20${NBSP}€`);

  assert.equal(settingFacts("joining", defaults.joining).length, 8);
  const legal = settingFacts("legal_notice", defaults.legal_notice);
  assert.equal(legal[3]?.text, "Non renseigné");
  assert.equal(
    settingFacts("legal_notice", {
      ...defaults.legal_notice,
      registry: "RNA W1",
    })[3]?.text,
    "RNA W1",
  );
}

// --- The history list ------------------------------------------------------------------------------------------------
{
  assert.equal(
    settingSummary("contact", defaults.contact),
    "lebontemperament@gmail.com · 3 Rue Clemenceau, 67700 Saverne",
  );
  assert.equal(
    settingSummary("social_links", defaults.social_links),
    "Facebook, Instagram, YouTube, TikTok",
  );
  assert.equal(
    settingSummary("social_links", { links: [] }),
    "Aucun réseau affiché",
  );
  assert.equal(
    settingSummary("donations", defaults.donations),
    `7 montants, de 5${NBSP}€ à 2${NBSP}000${NBSP}€ · 20${NBSP}€ sélectionné à l'ouverture`,
  );
  assert.equal(
    settingSummary("donations", {
      ...defaults.donations,
      tiers: [defaults.donations.tiers[3]!],
    }),
    `1 montant, 20${NBSP}€ · 20${NBSP}€ sélectionné à l'ouverture`,
  );
  assert.match(
    settingSummary("joining", defaults.joining),
    /^Présentation : Le Bon Tempérament est un ensemble vocal .{1,60}…$/,
  );
  assert.equal(
    settingSummary("legal_notice", defaults.legal_notice),
    "Sophie Bellard · +33 6 89 68 74 82 · SIRET 499 664 654 00013",
  );

  // What differs from today's version, by the dialog's own names.
  assert.deepEqual(
    settingDifferences("contact", defaults.contact, defaults.contact),
    [],
  );
  assert.deepEqual(
    settingDifferences(
      "contact",
      { ...defaults.contact, city: "Strasbourg", email: "a@b.fr" },
      defaults.contact,
    ),
    ["Adresse e-mail", "Ville"],
  );
  assert.deepEqual(
    settingDifferences(
      "joining",
      { ...defaults.joining, when: "Le lundi.", fee: "Gratuit." },
      defaults.joining,
    ),
    ["Horaires", "Cotisation"],
  );
  assert.deepEqual(
    settingDifferences(
      "social_links",
      { links: defaults.social_links.links.slice(0, 2) },
      defaults.social_links,
    ),
    ["YouTube", "TikTok"],
  );
  assert.deepEqual(
    settingDifferences(
      "legal_notice",
      { ...defaults.legal_notice, registry: "RNA W1" },
      defaults.legal_notice,
    ),
    ["Registre des associations"],
  );
  assert.deepEqual(
    settingDifferences(
      "donations",
      {
        ...defaults.donations,
        helloassoUrl: "https://www.helloasso.com/autre",
        tiers: defaults.donations.tiers.slice(0, 5),
        defaultAmount: 10,
      },
      defaults.donations,
    ),
    ["Lien HelloAsso", "Montants", "Montant sélectionné à l'ouverture"],
  );
  assert.equal(differencesLabel([]), "Identique à la version actuelle");
  assert.equal(
    differencesLabel(["Horaires", "Cotisation"]),
    "Diffère de la version actuelle : Horaires, Cotisation",
  );

  assert.equal(
    revisionHeading("2026-10-12T12:30:00Z", "Marie Martin"),
    "Version remplacée le 12 octobre 2026 à 14 h 30 par Marie Martin",
  );
  assert.equal(
    revisionHeading("2026-10-12T12:30:00Z", null),
    "Version remplacée le 12 octobre 2026 à 14 h 30",
  );
  assert.equal(revisionHeading("?", "Léa"), "Ancienne version");
}

console.log("siteSettings/form: all assertions passed");
