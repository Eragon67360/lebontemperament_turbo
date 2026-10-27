"use client";

import RouteNames from "@/utils/routes";
import { useEffect } from "react";

/**
 * The last-resort boundary: it replaces the root layout when the layout
 * itself (or `error.tsx`) throws, so it renders its own document without
 * globals.css, Inter, the providers or next-themes. Hence the one place in
 * `app/` with literal colours: they are the B tokens of globals.css, light
 * and dark through the device's colour scheme (the account menu's choice
 * cannot be read here). The frame is `AuthLayout`'s: brand, one card, the
 * way home. No metadata export is possible in a client boundary.
 *
 * Colours sit on the page's own wrapper (`.ge`), not on <html> or <body>:
 * when the boundary renders in the browser after a crash, the document's
 * original stylesheet is still loaded and its (light) body colours would win.
 */
const css = `
:root{--bg:#f4f6f6;--card:#ffffff;--fg:#16201f;--muted:#5d6b6a;--line:#dfe5e5;--line-strong:#c2cccc;--solid:#156c71;--solid-hover:#105155;--teal-text:#156c71}
@media (prefers-color-scheme:dark){:root{--bg:#0f1516;--card:#171f20;--fg:#e9eeee;--muted:#a3b2b1;--line:#293535;--line-strong:#3b4949;--teal-text:#3fb8bf}}
*{box-sizing:border-box}
html{background:var(--bg)}
body{margin:0}
.ge{min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:40px 16px;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,-apple-system,sans-serif;line-height:1.5}
main{width:100%;max-width:432px;display:flex;flex-direction:column;gap:24px}
.brand{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center}
.mark{display:flex;width:36px;height:36px;align-items:center;justify-content:center;border-radius:10px;background:var(--solid);color:#ffffff}
.name{margin:0;font-size:20px;line-height:28px;font-weight:600}
.sub{margin:0;font-size:14px;line-height:20px;color:var(--muted)}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:24px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
@media (min-width:640px){.card{padding:32px}}
h1{margin:0;font-size:20px;line-height:28px;font-weight:600}
.card p{margin:4px 0 24px;font-size:14px;line-height:20px;color:var(--muted)}
button{display:inline-flex;width:100%;height:44px;align-items:center;justify-content:center;border:0;border-radius:10px;background:var(--solid);color:#ffffff;font:inherit;font-size:15px;line-height:20px;font-weight:500;cursor:pointer}
button:hover{background:var(--solid-hover)}
.home{display:inline-flex;min-height:44px;align-items:center;justify-content:center;padding:0 8px;border-radius:6px;color:var(--teal-text);font-size:14px;text-decoration:none;text-underline-offset:4px}
.home:hover{text-decoration:underline}
.foot{margin:0;text-align:center}
:focus-visible{outline:2px solid var(--solid);outline-offset:2px}
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
        <title>Un problème est survenu | BT Admin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <div className="ge">
          <main>
            <div className="brand">
              <span className="mark" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  focusable="false"
                >
                  <path d="M9 3v7a3 3 0 0 0 6 0V3" />
                  <path d="M12 13v8" />
                </svg>
              </span>
              <div>
                <p className="name">Le Bon Tempérament</p>
                <p className="sub">Administration</p>
              </div>
            </div>
            <section
              role="alert"
              aria-labelledby="error-title"
              className="card"
            >
              <h1 id="error-title">Un problème est survenu</h1>
              <p>
                L’administration n’a pas pu s’afficher. Réessayez dans un
                instant ; si cela continue, signalez-le à un administrateur.
              </p>
              <button type="button" onClick={retry}>
                Réessayer
              </button>
            </section>
            <p className="foot">
              <a className="home" href={RouteNames.DASHBOARD.ROOT}>
                Retour à l’accueil
              </a>
            </p>
          </main>
        </div>
      </body>
    </html>
  );
}
