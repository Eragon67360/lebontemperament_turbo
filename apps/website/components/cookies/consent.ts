"use client";

import type { CookieConsentConfig } from "vanilla-cookieconsent";
import getConfig from "./CookieConsentConfig";

/**
 * The consent library (vanilla-cookieconsent: script and stylesheet) is
 * fetched after the first paint, when the browser is idle, instead of being
 * part of every page's initial JavaScript. Everything else goes through this
 * module, so nothing imports the library statically: before it has run, the
 * reads below answer "no consent", exactly what the library itself answers
 * before `run()`; the `cc:onConsent` and `cc:onChange` events it fires on
 * `window` then bring the listeners up to date.
 */
type CookieConsentApi = typeof import("vanilla-cookieconsent");

let api: CookieConsentApi | null = null;
let started: Promise<CookieConsentApi> | null = null;

/** Loads the library and shows the banner (or reads the stored choice). */
export function startCookieConsent(
  config: CookieConsentConfig,
): Promise<CookieConsentApi> {
  if (!started) {
    started = import("./cookieConsentLibrary").then(async (mod) => {
      // Published before `run()`: the events fire from inside it, and a
      // listener reading the state at that moment must see the library.
      api = mod.default;
      await mod.default.run(config);
      return mod.default;
    });
  }
  return started;
}

/** Whether the visitor accepted a category; false until the library has run. */
export function acceptedCategory(category: string): boolean {
  try {
    return api?.acceptedCategory(category) ?? false;
  } catch {
    return false;
  }
}

/** Whether a valid consent choice is known; false until the library has run. */
export function validConsent(): boolean {
  try {
    return api?.validConsent() ?? false;
  } catch {
    return false;
  }
}

/**
 * Opens the preferences dialog. A click that comes before the idle-time start
 * (first seconds of a visit, slow devices) starts the library itself.
 */
export async function showPreferences(): Promise<void> {
  (await startCookieConsent(getConfig())).showPreferences();
}
