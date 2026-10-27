"use client";

import { useEffect } from "react";

/**
 * The last-resort boundary: it replaces the root layout when the layout
 * itself (or `error.tsx`) throws, so it renders its own document without the
 * site's stylesheet, fonts, providers or theme switch. Hence the inline
 * styles: the values are the site's own tokens (globals.css), light and dark
 * through the device's colour scheme since next-themes is not mounted here.
 * No metadata export is possible in a client boundary: the <title> is inline.
 *
 * Colours sit on the page's own wrapper (`.ge`), not on <html> or <body>:
 * when the boundary renders in the browser after a crash, the document's
 * original stylesheet is still loaded and its body colours would win.
 */
const css = `
:root{--bg:#ffffff;--fg:#11181c;--muted:#52525b;--card:#ffffff;--line:#e4e4e7;--solid:#156c71;--solid-hover:#105155;--link:#156c71}
@media (prefers-color-scheme:dark){:root{--bg:#0d1616;--fg:#ecedee;--muted:#b8c5c6;--card:#1a2c2c;--line:#2b4040;--link:#26a5ad}}
*{box-sizing:border-box}
html{background:var(--bg)}
body{margin:0}
.ge{min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px 16px;background:var(--bg);color:var(--fg);font-family:Roboto,system-ui,-apple-system,sans-serif;line-height:1.5}
main{width:100%;max-width:448px;text-align:center}
.brand{margin:0 0 20px;font-size:14px;font-weight:500;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:32px 24px;box-shadow:0 4px 12px rgba(0,0,0,.06)}
h1{margin:0 0 12px;font-size:28px;line-height:1.2;font-weight:700}
.card p{margin:0 0 28px;font-size:17px;color:var(--muted)}
.actions{display:flex;flex-direction:column;gap:12px}
@media (min-width:640px){.actions{flex-direction:row;justify-content:center}}
button,.home{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 24px;border-radius:12px;font:inherit;font-size:16px;font-weight:500;cursor:pointer}
button{border:0;background:var(--solid);color:#ffffff}
button:hover{background:var(--solid-hover)}
.home{color:var(--link);text-decoration:underline;text-underline-offset:4px}
.home:hover{text-decoration:none}
:focus-visible{outline:2px solid var(--link);outline-offset:2px}
`;

export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <head>
        <title>Une erreur est survenue | Le Bon Tempérament</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <div className="ge">
          <main>
            <p className="brand">Le Bon Tempérament</p>
            <section
              role="alert"
              aria-labelledby="error-title"
              className="card"
            >
              <h1 id="error-title">Une erreur est survenue</h1>
              <p>
                Le site n’a pas pu s’afficher. Réessayez dans un instant, ou
                revenez à l’accueil.
              </p>
              <div className="actions">
                <button type="button" onClick={retry}>
                  Réessayer
                </button>
                {/* A plain anchor on purpose: after the root layout failed, a
                    full document load is the dependable way home (fresh build,
                    fresh chunks); « Réessayer » is the in-app recovery. */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a className="home" href="/">
                  Retour à l’accueil
                </a>
              </div>
            </section>
          </main>
        </div>
      </body>
    </html>
  );
}
