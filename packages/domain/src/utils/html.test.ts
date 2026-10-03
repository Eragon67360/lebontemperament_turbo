import assert from "node:assert/strict";
import { escapeHtml, escapeHtmlWithBreaks } from "./html";

assert.equal(escapeHtml("Bonjour"), "Bonjour");
assert.equal(escapeHtml("Tempérament & Co"), "Tempérament &amp; Co");
assert.equal(
  escapeHtml('<a href="https://example.com">lien</a>'),
  "&lt;a href=&quot;https://example.com&quot;&gt;lien&lt;/a&gt;",
);
assert.equal(escapeHtml("l'équipe"), "l&#39;équipe");
assert.equal(
  escapeHtml("<script>alert(1)</script>"),
  "&lt;script&gt;alert(1)&lt;/script&gt;",
);
// Already-escaped text is escaped again rather than trusted.
assert.equal(escapeHtml("&lt;b&gt;"), "&amp;lt;b&amp;gt;");
assert.equal(escapeHtml(null), "");
assert.equal(escapeHtml(undefined), "");
assert.equal(escapeHtml(2026), "2026");

assert.equal(escapeHtmlWithBreaks("ligne 1\nligne 2"), "ligne 1<br>ligne 2");
assert.equal(escapeHtmlWithBreaks("a\r\nb"), "a<br>b");
assert.equal(escapeHtmlWithBreaks("<i>\n</i>"), "&lt;i&gt;<br>&lt;/i&gt;");

console.log("escapeHtml: all assertions passed");
