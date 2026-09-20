import test from "node:test";
import assert from "node:assert/strict";
import { BotDialogue, createBot, BOT_PRESETS } from "../src/bots/index.js";
const choices = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];
test("choice returns its ID once and stale buttons cannot resolve a new question", async () => {
  const d = new BotDialogue();
  const first = d.ask("Ready?", choices);
  const revision = d.current.id;
  assert.equal(d.choose("unknown"), false);
  assert.equal(d.choose("yes"), true);
  assert.equal(await first, "yes");
  const second = d.ask("Again?", choices);
  assert.equal(d.choose("yes", revision), false);
  d.choose("no");
  assert.equal(await second, "no");
});
test("replacement, dismissal, timeout, abort and disposal settle pending questions", async () => {
  const d = new BotDialogue();
  let p = d.ask("One", choices);
  d.say("Replacement");
  assert.equal(await p, null);
  p = d.ask("Two", choices);
  d.dismiss();
  assert.equal(await p, null);
  p = d.ask("Three", choices, { duration: 0.1 });
  d.update(0.2);
  assert.equal(await p, null);
  const controller = new AbortController();
  p = d.ask("Four", choices, { signal: controller.signal });
  controller.abort();
  assert.equal(await p, null);
  p = d.ask("Five", choices, { signal: controller.signal });
  assert.equal(await p, null);
  p = d.ask("Six", choices);
  d.dispose();
  assert.equal(await p, null);
});
test("speech duration is optional, plain text is preserved, and invalid input keeps current dialogue", () => {
  const d = new BotDialogue();
  d.say("<img src=x onerror=alert(1)>");
  d.update(100);
  assert.ok(d.current.text.startsWith("<img"));
  const current = d.current;
  assert.throws(() =>
    d.ask("Q", [
      { id: "x", label: "A" },
      { id: "x", label: "B" },
    ]),
  );
  assert.equal(d.current, current);
  assert.throws(() => d.say(" "));
  assert.throws(() => d.say("X", { duration: -1 }));
  d.say("Timed", { duration: 1 });
  d.update(0.5);
  assert.ok(d.current);
  d.update(0.5);
  assert.equal(d.current, null);
});
test("bots can move and ask independently; multiple bots resolve independently", async () => {
  const a = createBot(BOT_PRESETS.priya, { screen: false }),
    b = createBot(BOT_PRESETS.nour, { screen: false });
  const answer = a.ask("A?", choices),
    other = b.ask("B?", choices);
  const motion = a.walkTo(1, 0);
  for (let i = 0; i < 300; i++) a.update(1 / 60);
  assert.equal((await motion).status, "completed");
  assert.ok(a.dialogue.current);
  assert.ok(b.dialogue.current);
  a.dialogue.choose("yes");
  assert.equal(await answer, "yes");
  b.dispose();
  assert.equal(await other, null);
  a.dispose();
  assert.throws(() => a.say("Disposed"));
});
test("speech subscriptions receive replacement and clear events and unsubscribe cleanly", () => {
  const d = new BotDialogue(),
    seen = [];
  const off = d.subscribe((state) => seen.push(state?.text ?? null));
  d.say("A");
  d.say("B");
  off();
  d.dismiss();
  assert.deepEqual(seen, [null, "A", null, "B"]);
});

test("shipped choices cannot be selected and keep available choices usable", async () => {
  const d = new BotDialogue();
  const answer = d.ask("Build?", [
    { id: "old", label: "Shipped", disabled: true },
    { id: "new", label: "Build" },
  ]);
  assert.equal(d.choose("old"), false);
  assert.equal(d.current.choices[0].disabled, true);
  assert.equal(d.choose("new"), true);
  assert.equal(await answer, "new");
});
