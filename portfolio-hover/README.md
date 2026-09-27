# portfolio-hover

Source of the hover preview shown on thomasmoserdev.com/projects for this project.

- `capture.mjs`: captures the real site (www.lebontemperament.com) and interaction states into `captures/`.
  Scrolls are captured one screenshot per video frame, so the sticky navigation stays as the site renders it.
- `comp.html`: the 8s, 1280x800 loop, drawn from the captures (every frame is a function of time).
- `out/`: rendered `lebontemperament.mp4` (silent H.264) and its first frame.

`engine.js`, `base.css` and `render.mjs` are copied from the portfolio's `resources/hover-videos/kit`,
which documents how to capture and render.
