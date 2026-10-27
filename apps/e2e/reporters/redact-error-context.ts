// apps/e2e/reporters/redact-error-context.ts
//
// CI only (see playwright.config.ts), listed before "blob". When a test
// fails, Playwright writes error-context.md beside its results: the error
// messages, the test's source and, when a locator assertion matched no
// element, an accessibility snapshot of the whole page. The
// PLAYWRIGHT_NO_COPY_PROMPT variable set by e2e-daily.yml drops only the
// snapshot taken when the test ends, not that one.
//
// Here each error-context.md is rewritten with the test's title, location
// and error messages only: the text the "github" reporter already prints in
// the check annotations. The uploaded reports keep what failed, never what a
// page showed. The blob reporter reads the file when the run ends, after
// this rewrite.
import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import { writeFileSync } from "node:fs";
import { relative } from "node:path";
import { stripVTControlCharacters } from "node:util";

/** The error-context.md kept in CI: no page content, only what failed. */
export function redactedErrorContext(
  test: TestCase,
  result: TestResult,
): string {
  const { file, line, column } = test.location;
  const lines = [
    "# Test info",
    "",
    `- Name: ${test.titlePath().filter(Boolean).join(" >> ")}`,
    `- Location: ${relative(process.cwd(), file)}:${line}:${column}`,
    "",
    "# Error details",
  ];
  for (const error of result.errors) {
    const text = error.message ?? error.value;
    if (text) lines.push("", "```", stripVTControlCharacters(text), "```");
  }
  lines.push("", "Page snapshots are not kept in CI.", "");
  return lines.join("\n");
}

export default class RedactErrorContext implements Reporter {
  onTestEnd(test: TestCase, result: TestResult): void {
    for (const attachment of result.attachments) {
      if (attachment.name !== "error-context") continue;
      const text = redactedErrorContext(test, result);
      if (attachment.path) writeFileSync(attachment.path, text, "utf8");
      if (attachment.body) attachment.body = Buffer.from(text, "utf8");
    }
  }

  printsToStdio(): boolean {
    return false;
  }
}
