// Hover-video engine: every frame is a pure function of time `t` (seconds).
// A composition defines window.DURATION and window.renderAt(t), and awaits window.ready.
(() => {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = {
    linear: (x) => x,
    inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    out: (x) => 1 - Math.pow(1 - x, 3),
    in: (x) => x * x * x,
    outBack: (x) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2),
  };

  /** Progress 0..1 of `t` through [a, b], eased. */
  const seg = (t, a, b, e = ease.inOut) => e(clamp((t - a) / (b - a)));
  /** Interpolate from `from` to `to` while `t` crosses [a, b]. */
  const tw = (t, a, b, from, to, e = ease.inOut) => from + (to - from) * seg(t, a, b, e);
  /** Piecewise keyframes: [[t, value], ...] with eased segments. */
  const keys = (t, frames, e = ease.inOut) => {
    if (t <= frames[0][0]) return frames[0][1];
    for (let i = 1; i < frames.length; i++) {
      if (t <= frames[i][0]) return tw(t, frames[i - 1][0], frames[i][0], frames[i - 1][1], frames[i][1], e);
    }
    return frames[frames.length - 1][1];
  };
  /** Characters of `text` typed since `start` at `cps` characters per second. */
  const typed = (text, t, start, cps = 12) => text.slice(0, Math.max(0, Math.floor((t - start) * cps)));

  /** Scripted cursor: path [[t, x, y], ...] and click times. */
  function cursor(el, path, clicks = []) {
    const ring = document.createElement("div");
    ring.className = "hv-click";
    el.parentElement.appendChild(ring);
    return (t) => {
      const x = keys(t, path.map(([tt, px]) => [tt, px]));
      const y = keys(t, path.map(([tt, , py]) => [tt, py]));
      const visible = t >= path[0][0] - 0.25 && t <= path[path.length - 1][0] + 0.25;
      const pressed = clicks.some((c) => t >= c && t < c + 0.12);
      el.style.transform = `translate(${x}px, ${y}px) scale(${pressed ? 0.85 : 1})`;
      el.style.opacity = visible ? 1 : 0;
      const click = clicks.find((c) => t >= c && t < c + 0.5);
      if (click !== undefined) {
        const k = (t - click) / 0.5;
        ring.style.transform = `translate(${x - 22}px, ${y - 22}px) scale(${0.4 + k})`;
        ring.style.opacity = 1 - k;
      } else ring.style.opacity = 0;
    };
  }

  async function ready() {
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => (img.complete ? img.decode().catch(() => {}) : img.decode())));
  }

  window.HV = { clamp, ease, seg, tw, keys, typed, cursor };
  window.ready = new Promise((resolve) => window.addEventListener("load", () => ready().then(resolve)));
})();
