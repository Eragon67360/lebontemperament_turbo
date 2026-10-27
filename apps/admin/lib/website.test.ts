import assert from "node:assert/strict";

// WEBSITE_URL is read when the module loads, so the environment is set first
// and the module imported inside main().
process.env.NEXT_PUBLIC_WEBSITE_URL = "https://dev.example.com/";

async function main() {
  const {
    PRODUCTION_WEBSITE_URL,
    WEBSITE_URL,
    configuredWebsiteUrl,
    websiteHost,
    websiteUrl,
  } = await import("./website");

  // --- Unset: the public site, never "undefined/…" ---
  delete process.env.NEXT_PUBLIC_WEBSITE_URL;
  assert.equal(websiteUrl("/concerts"), `${PRODUCTION_WEBSITE_URL}/concerts`);
  assert.equal(websiteUrl(), PRODUCTION_WEBSITE_URL);
  assert.equal(configuredWebsiteUrl(), undefined);
  process.env.NEXT_PUBLIC_WEBSITE_URL = "https://dev.example.com/";

  // --- Blank values count as unset ---
  for (const value of ["", "   ", "/"]) {
    assert.equal(
      websiteUrl("/concerts", value),
      `${PRODUCTION_WEBSITE_URL}/concerts`,
      `fallback for ${JSON.stringify(value)}`,
    );
    assert.equal(configuredWebsiteUrl(value), undefined);
  }

  // --- A trailing slash or surrounding whitespace never doubles a slash ---
  assert.equal(
    websiteUrl("/40-ans", "https://www.example.com/"),
    "https://www.example.com/40-ans",
  );
  assert.equal(
    websiteUrl("/40-ans", " https://www.example.com// "),
    "https://www.example.com/40-ans",
  );
  assert.equal(
    configuredWebsiteUrl("https://www.example.com/"),
    "https://www.example.com",
  );

  // --- Preview, production and local values pass through unchanged ---
  assert.equal(
    websiteUrl("/concerts/noel", "https://dev.lebontemperament.com"),
    "https://dev.lebontemperament.com/concerts/noel",
  );
  assert.equal(
    websiteUrl("/concerts/noel", "https://www.lebontemperament.com"),
    "https://www.lebontemperament.com/concerts/noel",
  );
  assert.equal(
    websiteUrl("/json/projects.json", "http://localhost:3000"),
    "http://localhost:3000/json/projects.json",
  );

  // --- Path forms: none, empty, with or without the leading slash ---
  assert.equal(
    websiteUrl(undefined, "https://www.example.com"),
    "https://www.example.com",
  );
  assert.equal(
    websiteUrl("", "https://www.example.com"),
    "https://www.example.com",
  );
  assert.equal(
    websiteUrl("concerts", "https://www.example.com"),
    "https://www.example.com/concerts",
  );

  // --- The module-level origin follows the environment at load time ---
  assert.equal(WEBSITE_URL, "https://dev.example.com");
  assert.equal(websiteUrl(), "https://dev.example.com");

  // --- Host for link text ---
  assert.equal(
    websiteHost("https://www.lebontemperament.com"),
    "lebontemperament.com",
  );
  assert.equal(
    websiteHost("https://dev.lebontemperament.com"),
    "dev.lebontemperament.com",
  );
  assert.equal(websiteHost("http://localhost:3000"), "localhost:3000");
  assert.equal(websiteHost("not a url"), "not a url");
  assert.equal(websiteHost(), "dev.example.com");

  console.log("lib/website.test.ts: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
