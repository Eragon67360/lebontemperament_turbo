// Static renders of the Messages dialog's pieces (no DOM, no queries): a
// conversation in the list and a message bubble.
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConversationRow, MessageBubble } from "./ConversationRow";

const noop = () => {};

const report = {
  id: "b1",
  title: "Le planning ne s'affiche pas",
  status: "resolved" as const,
  created_at: "2026-10-01T09:00:00Z",
  last_message: {
    id: "m1",
    created_at: "2026-10-02T09:00:00Z",
    message: "C'est corrigé, merci !",
    sender_id: "u2",
  },
  message_count: 3,
  unread_count: 2,
};

// --- A selected conversation: status word, last message, counts ---
{
  const html = renderToStaticMarkup(
    createElement(ConversationRow, { report, selected: true, onSelect: noop }),
  );
  assert.match(html, /Le planning ne s&#x27;affiche pas/);
  assert.match(html, /Résolu/);
  assert.match(html, /C&#x27;est corrigé, merci !/);
  assert.match(html, /3 messages/);
  assert.match(html, />2<span class="sr-only"> non lus<\/span>/);
  assert.match(html, /aria-current="true"/);
  assert.match(html, /bg-primary-soft/);
}

// --- No message yet, nothing unread, not selected ---
{
  const html = renderToStaticMarkup(
    createElement(ConversationRow, {
      report: {
        ...report,
        last_message: null,
        message_count: 0,
        unread_count: 0,
        status: "pending",
      },
      selected: false,
      onSelect: noop,
    }),
  );
  assert.match(html, /Aucun message/);
  assert.match(html, /En attente/);
  assert.doesNotMatch(html, /aria-current/);
  assert.doesNotMatch(html, /non lu/);
}

// --- Bubbles: mine in teal without my name, theirs with the sender ---
{
  const message = {
    message: "Bonjour",
    created_at: "2026-10-02T09:00:00Z",
    sender: { display_name: "Équipe technique", email: "tech@example.org" },
  };
  const mine = renderToStaticMarkup(
    createElement(MessageBubble, { message, isMine: true }),
  );
  assert.match(mine, /bg-primary-strong/);
  assert.doesNotMatch(mine, /Équipe technique/);
  const theirs = renderToStaticMarkup(
    createElement(MessageBubble, { message, isMine: false }),
  );
  assert.match(theirs, /Équipe technique/);
  assert.match(theirs, /bg-card/);
}

console.log("components/bug-reports/conversation: ok");
