// Static render of a date field's month (no DOM): every day and both month
// arrows are 40 px buttons (44 px under a coarse pointer) at full opacity;
// the day's state sits on the button the person presses, not on the grid
// cell react-day-picker 10 gives the modifiers to; the names are French.
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Calendar } from "./calendar";

const html = renderToStaticMarkup(
  createElement(Calendar, {
    mode: "single",
    defaultMonth: new Date(2026, 9),
    selected: new Date(2026, 9, 14),
    today: new Date(2026, 9, 27),
    disabled: { before: new Date(2026, 9, 5) },
  }),
);

const cells = html.match(/<td [^>]*role="gridcell"[^>]*>.*?<\/td>/g) ?? [];
const buttonOf = (cell: string) => {
  const match = cell.match(/<button ([^>]*)>([^<]*)<\/button>/);
  assert.ok(match, `no button in ${cell.slice(0, 120)}`);
  return { attrs: match[1] ?? "", text: match[2] ?? "" };
};
const classesOf = (attrs: string) =>
  (attrs.match(/class="([^"]*)"/)?.[1] ?? "").split(" ");

// --- October 2026, Monday first: 5 weeks, one button per cell ---
assert.equal(cells.length, 35);

// --- Every day is a 40 px target (44 px on touch), never faded ---
for (const cell of cells) {
  const classes = classesOf(buttonOf(cell).attrs);
  assert.ok(classes.includes("size-10"), cell.slice(0, 160));
  assert.ok(classes.includes("pointer-coarse:size-11"), cell.slice(0, 160));
}
assert.doesNotMatch(html, /opacity-(30|50)/);
assert.doesNotMatch(html, /class="[^"]*\bspace-y-(?=[" ])/);

// --- The month arrows: 40 px ghost buttons (44 px on touch), French names ---
const arrows =
  html.match(/<button [^>]*aria-label="Mois (précédent|suivant)"[^>]*>/g) ?? [];
assert.equal(arrows.length, 2);
for (const arrow of arrows) {
  assert.match(arrow, /size-10/);
  assert.match(arrow, /pointer-coarse:size-11/);
  assert.doesNotMatch(arrow, /opacity-50|border-input/);
}

// --- The chosen day: the cell is selected for assistive tech, the button
// carries the filled teal ---
const selected = cells.find((cell) => /aria-selected="true"/.test(cell)) ?? "";
assert.ok(selected);
const chosen = buttonOf(selected);
assert.equal(chosen.text, "14");
assert.ok(classesOf(chosen.attrs).includes("bg-primary-strong"));
assert.match(
  chosen.attrs,
  /aria-label="mercredi 14 octobre 2026, sélectionné"/,
);
const chosenCell = selected.replace(/<button.*<\/button>/, "");
assert.doesNotMatch(chosenCell, /bg-primary-strong/);

// --- Today: soft teal, named ---
const today = cells.find((cell) => /data-today="true"/.test(cell)) ?? "";
assert.ok(today);
const todayButton = buttonOf(today);
assert.equal(todayButton.text, "27");
assert.ok(classesOf(todayButton.attrs).includes("bg-primary-soft"));
assert.match(
  todayButton.attrs,
  /aria-label="Aujourd’hui, mardi 27 octobre 2026"/,
);

// --- A day of the month around: readable grey, still a button to press ---
const outside = cells.filter((cell) => /data-outside="true"/.test(cell));
assert.equal(outside.length, 4); // 28, 29, 30 septembre et 1er novembre
const november = buttonOf(outside[3] ?? "");
assert.equal(november.text, "1");
assert.ok(classesOf(november.attrs).includes("text-muted-foreground"));
assert.doesNotMatch(november.attrs, /\sdisabled=""/);

// --- A day that cannot be picked is a disabled button, nothing more ---
const disabled = cells.filter((cell) => /data-disabled="true"/.test(cell));
assert.equal(disabled.length, 7); // du 28 septembre au 4 octobre
const fourth = buttonOf(disabled[6] ?? "");
assert.equal(fourth.text, "4");
assert.match(fourth.attrs, /\sdisabled=""/);
assert.ok(!classesOf(fourth.attrs).includes("text-muted-foreground"));

// --- French by default: the month and the weekdays ---
assert.match(html, /octobre 2026/);
assert.match(html, /<th [^>]*aria-label="lundi"/);

console.log("components/ui/calendar: ok");
