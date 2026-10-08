// Static renders of the pages outside the shell (sign-in, not found, error):
// direction B only, the names the e2e suite and password managers rely on.
import LoginPage from "@/app/auth/login/page";
import ErrorPage from "@/app/error/page";
import NotFound from "@/app/not-found";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

const login = renderToStaticMarkup(
  <SearchParamsContext.Provider value={new URLSearchParams()}>
    <LoginPage />
  </SearchParamsContext.Provider>,
);

// The brand is the page's one h1, with its accent; the card is « Connexion ».
assert.equal((login.match(/<h1/g) ?? []).length, 1);
assert.match(login, /<h1[^>]*>Le Bon Tempérament<\/h1>/);
assert.match(login, /<h2[^>]*>Connexion<\/h2>/);
assert.doesNotMatch(login, /Temperament/, "the name keeps its accent");

// Fields keep the ids, names and autocomplete the e2e suite and password
// managers use; each has its label.
assert.match(login, /<label[^>]*for="email"[^>]*>Adresse e-mail<\/label>/);
assert.match(login, /<label[^>]*for="password"[^>]*>Mot de passe<\/label>/);
const inputTag = (id: string) =>
  login.match(new RegExp(`<input[^>]*id="${id}"[^>]*/>`))?.[0] ?? "";
for (const [id, type, autocomplete] of [
  ["email", "email", "email"],
  ["password", "password", "current-password"],
]) {
  const tag = inputTag(id!);
  assert.match(tag, new RegExp(`name="${id}"`));
  assert.match(tag, new RegExp(`type="${type}"`));
  assert.match(tag, new RegExp(`autocomplete="${autocomplete}"`, "i"));
  assert.match(tag, /required=""/);
}
assert.match(
  login,
  /href="\/auth\/reset-password"[^>]*>Mot de passe oublié \?</,
);

// One filled teal button, « Se connecter », and the way to the public site.
assert.equal((login.match(/bg-primary-strong(?=[\s"])/g) ?? []).length, 2); // the mark + the button
assert.match(login, /<button[^>]*type="submit"[^>]*>Se connecter<\/button>/);
assert.match(
  login,
  /href="https:\/\/www\.lebontemperament\.com"[^>]*>Aller sur le site lebontemperament\.com</,
);

// No gradient, blur, glow or marketing tagline any more.
for (const html of [login, renderToStaticMarkup(<NotFound />)]) {
  assert.doesNotMatch(
    html,
    /gradient|blur|animate-ping|Sécurisé|Moderne|Intuitif/,
  );
  assert.doesNotMatch(html, /bg-white|text-gray-|#[0-9a-f]{6}/i, "tokens only");
}

// Not found and error: their own h1, one primary back to the home.
for (const [html, title] of [
  [renderToStaticMarkup(<NotFound />), "Cette page n’existe pas"],
  [renderToStaticMarkup(<ErrorPage />), "Un problème est survenu"],
] as const) {
  assert.match(html, new RegExp(`<h1[^>]*>${title}</h1>`));
  assert.equal((html.match(/<h1/g) ?? []).length, 1);
  assert.match(html, /<p class="text-section[^"]*">Le Bon Tempérament<\/p>/);
  assert.match(html, /href="\/dashboard"[^>]*>Retour à l’accueil</);
}

console.log("auth pages: ok");
