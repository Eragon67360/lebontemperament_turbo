# Link-preview card assets

Read from disk by `lib/og/cards.tsx` when a card is drawn.

- `band.png`: the top of `public/img/hero.webp` (notes band and teal rule), 1200 × 142.
- `logo.png`: `public/logo.png` on a transparent ground.
- `picto.png`: `public/img/picto.svg` (the « LE BT » mark) at 112 px; Satori can't read that Illustrator SVG.
- `roboto-latin-*-normal.woff`: Roboto 400, 500 and 700, Latin subset, from `@fontsource/roboto` 5.1.0 (Apache License 2.0). Satori reads WOFF, not WOFF2.
