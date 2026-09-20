# Global Concierge — booth script

The choreography for the agent build demo. Companion to `CLAUDE.md`, which holds the
product context; this file holds what happens on screen, second by second.

Draft 2 — agreed review revisions, 20 September 2026. Timings are intentions, not measurements — they will move once beats are on
screen. This revision updates the script only; additions described below are implementation requirements, not claims that the app already supports them. Where older context files disagree, the latest user decisions recorded here take precedence.

---

## How to read a beat

| t | Who | Does | Says | On screen |
|---|---|---|---|---|

- **t** — seconds from the start of that scene.
- **Does** — maps to the bot module API: `walkTo`, `turnTo`, `pickUp`, `place`,
  `play('build' | 'type' | 'inspect' | 'present' | 'beckon' | 'sweep' | 'celebrate' | 'react')`.
  Face and screen state in brackets: `[focused]`, `[progress 40]`, `[cross]`.
- **Says** — a speech bubble. Keep every line under about eight words; the bubble is
  250px wide and a visitor reads it in passing. Never more than two bubbles at once.
- **On screen** — what the React app does, and which effect fires.

---

## The cast

Roles are from `CLAUDE.md`. The voices below are this script's addition.

### Nour — Product (mustard, tablet, bouncy)

Warm, certain, and the only one who talks to the visitor. She defends scope against
Sami and sets the acceptance bar. She carries the brief.

Voice: "Let's give Sarah her morning view." · "Five steps." · "That's the one."

### Ellie — Design (teal, stylus, floaty)

Quiet, exact, faintly merciless. She never raises her voice and never lets anything
through. She owns the design board and keeps comparing the built UI to it.

Voice: "Eight pixels low." · "Closer." · "That's not the blue."

### Omar — Engineering (charcoal, wrench, heavy)

Proud, defensive, fast. He takes shortcuts under Sami's deadline and is genuinely
offended when they're found. He recovers fast and fixes properly.

Voice: "It's nearly done." · "It's empty because it's empty." · "Fine."

### Priya — QA (white, magnifier, quick twitchy)

Deadpan. Enjoys this. Stops dead when she finds something, then waits. Her timing is
the comedy: fast, fast, fast, stop.

Voice: "Found one." · "A user sees a hole." · "I'll wait."

### Sami — Delivery (navy, clipboard, brisk)

The delivery manager. He follows the others around asking for estimates and counting
down. **His chest screen carries a progress bar that runs as the deadline for the whole
feature** — it fills from 0 at the brief to 100 at ship. When it gets past 80 he starts
appearing behind people.

Voice: "Estimate?" · "You said twenty last time." · "Ninety seconds." · "Ship it."

### Running gags

1. **The estimate.** Sami asks, Omar gives a number, Sami remembers the last one. Pays
   off in the Financials scene when Omar gets it right and Sami doesn't believe him.
2. **Sami's deadline bar.** Always visible, always filling. In Financials it hits 100
   at the exact moment the last tick lands.
3. **Priya's count.** "Found one." → "Found two." → in Financials, "Nothing new." Nobody
   believes her.
4. **Scope.** Nour adds one more thing; Sami says no; Nour wins, at a cost.
5. **Priya celebrates half a beat late**, every time.

---

## Props: the baton

The brief, the design and the build are physical objects that get handed along. This is
what makes the lifecycle visible rather than stated.

| Prop | Looks like | Carried by | Becomes |
|---|---|---|---|
| **PRD** | A PDF page thumbnail with a readable title — "Dashboard — PRD" | Nour → Ellie | Ellie reads it, then drops it at the board |
| **Design board** | The actual reference design thumbnail for that feature, propped on an easel mark beside the work area | Ellie → stays on stage | Omar builds from it; Ellie compares against it; it leaves during reset |
| **Component blocks** | Small crates tinted to the carrying agent's colour | Omar, Sami | Snap into the real React component on landing |
| **Confirmation slip** | A thumbnail bearing the saved booking’s actual reference | Sami | Carried between features during retrofits |

**The design board is the key mechanic.** It stays on screen for the whole feature, so
when Ellie walks back to it and then to the built UI, the visitor understands the
comparison without a word.

---

## Stage rules

- **Work in horizontal bands.** The camera looks down at about 22°, so walking up and
  down the screen covers roughly a third of the pixels that walking sideways does. Long
  vertical walks are dead time.
- **The yard is stage-left**, off the app area: blocks and props wait there.
- **The board easel is stage-right** of the work area, at content height.
- **Each mounted component has a floor anchor** directly below its DOM rect. Agents
  approach that anchor for building and inspection. Button presses use the separate jump targets below.
- **Nobody crosses in front of a component while it mounts.** The mount is the payoff.

---

## The lifecycle, and what varies

Every scenario follows the same lifecycle spine, with Find/Fix omitted on a clean run:

**Brief → Design → Build → Inspect → Find → Fix → Approve & ship**

The visitor-facing phase strip reads **Requirements → Design → Build → Test → Review → Deliver**.
It highlights actual progress: a failure in Test returns to Build, then Test, before Review.
The clean Gate skips Find/Fix. Completed checks stay visible on the design board.
Every feature opens with 2–3 acceptance criteria and closes with all five bots reviewing
those same criteria. Nour checks scope, Ellie design, Omar implementation, Priya tests,
and Sami delivery. Ticks are earned after successful checks, never just because time elapsed.

| Feature | Acceptance criteria shown on the brief and board |
|---|---|
| Gate | Demo access works; one consistent shell; only built features are available |
| Dashboard | Empty and populated states are clear; saved bookings appear; credit matches the ledger |
| New Booking | Required inputs validate; services and discount calculate; confirmation saves exactly once |
| Bookings & Manage | Saved bookings are discoverable; changes show a price difference before approval; cancellation asks first and credits once |
| Financials | AED labels throughout; zero usage before bookings; bookings, changes and cancellations reconcile |

The wording above is the proposed first version for joint refinement with the user;
the phase strip and explicit acceptance checks are agreed requirements.

What varies is **who finds the problem**, which keeps four builds from feeling like one
build repeated:

| Feature | Who finds it | What was missed | Register |
|---|---|---|---|
| Gate | Nobody | — | Clean run, establishes the baseline |
| 1 · Dashboard | **Priya** (QA) | No empty state — the panel is just blank | Full comic beat, Omar angry |
| 2 · New Booking | **Nour** (Product) | The credit total never calculates | Acceptance gap, Omar defensive |
| 3 · Bookings | **Priya** (QA) | Cancel deletes with no confirmation | Alarm — a test presentation hides the booking; saved data survives |
| 4 · Financials | **Ellie** (Design) | Chart axis in the wrong currency | Fast, quiet, last-minute |

Ellie also lands a small design correction **during** the build in features 1 and 3, so
she's active while Omar works rather than only at the end.

---

## Scene 0 — Gate: login and shell (~30s)

Not selectable. Runs once, full ceremony. Establishes the five characters, the baton,
the deadline bar and Priya's standard — she finds nothing here, so that her first find
in feature one means something.

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 0.0 | Nour | `walkTo` centre, `turnTo` front, `play('beckon')` [talking] | "Welcome to dnata Global Concierge." | Empty brand field |
| 2.0 | Nour | holds [happy] | "We'll build the agent workspace. Now." | — |
| 3.5 | Sami | `walkTo` beside Nour [focused, progress 0] | "Estimate?" | Deadline bar appears on his chest |
| 4.5 | Omar | `play('react')` [neutral] | "Twenty seconds." | — |
| 5.5 | Sami | [neutral] | "Noted." | Bar starts filling |
| 6.0 | Nour | `pickUp` PRD at yard, `walkTo` Ellie, `place` | "The brief." | PDF thumbnail visible in her hands |
| 9.0 | Ellie | `pickUp` PRD, `play('inspect')` [focused, loading] | — | — |
| 11.0 | Ellie | `walkTo` easel, `place` board | "Sign in, then the shell." | **Login design board** appears on easel |
| 13.5 | Omar | `walkTo` board, `play('inspect')` 0.8s [focused, progress 10] | — | — |
| 15.0 | Omar | `walkTo` login anchor, `play('build')` ×2 [progress 55] | — | **Login card mounts**, fields stamp in · dust + ring per strike |
| 19.0 | Priya | install `Use sample data`; `jumpPress(Use sample data)`; `jumpPress(Enter demo workspace)` [loading → tick] | "A repeatable test." | Editable demo credentials fill; login succeeds; success pulse. Allow extra time for both hops. |
| 20.5 | Omar | `walkTo` top band, `play('build')` ×3 [progress 85] | — | **Top bar assembles** per strike: wordmark, search, New Booking, bell, avatar |
| 24.0 | Omar | `walkTo` left rail, `play('build')` [progress 100, tick] | "Done." | **Sidebar rail rises** |
| 25.5 | Sami | `place` block on rail [tick] | — | **Disabled Dashboard stub** |
| 26.5 | Sami | `place` block centre | "Ready for review." | **"Nothing here yet"** |
| 27.5 | All five | review brief checks; Ellie compares board → shell [happy] | "Checks passed." (Priya) | Role approvals tick; Sami marks Deliver only after all pass |
| 28.5 | Nour | `walkTo` front, `turnTo` camera [happy] | "Your workspace is ready. What first?" | **Feature menu mounts** |

---

## Scene 1 — Dashboard (~56s)

Priya's bug beat. The one the visitor is most likely to see, so it carries the comedy.

**Brief**

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 0.0 | — | — | — | Chosen card flies to Nour's tablet; menu clears |
| 0.8 | Nour | `play('present')` [happy] | "Dashboard. Sarah's morning view." | — |
| 2.5 | Sami | `walkTo` Nour [focused, progress 0] | "Estimate?" | Deadline bar resets |
| 3.5 | Omar | `play('react')` | "Thirty seconds." | — |
| 4.5 | Sami | [neutral] | "Last time: {lastEstimate}." | Use the actual previous estimate; if none, "Noted." |
| 5.5 | Omar | [angry 0.4s → focused] | — | Brief red flash on his screen |
| 6.5 | Nour | `pickUp` PRD, `walkTo` Ellie, `place` | "Three regions." | PDF thumbnail: "Dashboard — PRD" |

**Design**

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 9.0 | Ellie | `pickUp`, `play('inspect')` [loading] | — | — |
| 11.0 | Ellie | `walkTo` easel, `place` board | — | **Dashboard design board** on easel |
| 12.5 | Ellie | `play('present')` [focused] | "Header, tracking, notifications." | **Three dashed placeholder frames** fade in |
| 15.0 | Sami | [neutral] | "Two of them?" | — |
| 15.8 | Nour | [talking] | "Three." | — |
| 16.5 | Sami | `play('react')` | — | Bar jumps forward |

**Build**

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 17.5 | Omar | `walkTo` board, `play('inspect')` [progress 0] | — | — |
| 19.0 | Omar | `walkTo` header anchor, `play('build')` [progress 35] | — | **Welcome header mounts** · dust + ring |
| 22.5 | Omar | `walkTo` tracking anchor, `play('build')` [progress 70] | — | **Tracking frame + three stat tiles mount. Body left blank.** |
| 26.0 | Omar | `walkTo` notifications anchor, `play('build')` ×2 [progress 100] | — | **Notifications panel mounts** |
| 28.5 | Ellie | `walkTo` board, `play('inspect')`, `walkTo` header, `play('inspect')` [alarmed] | "Eight pixels low." | Measurement line flashes on the header |
| 31.0 | Omar | [angry 0.5s] → `play('react')` → `play('build')` ×1 | "Fine." | **Header snaps into alignment** |
| 33.0 | Ellie | [happy] | "Closer." | — |

**Inspect and find**

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 34.0 | Priya | `walkTo` header, `play('inspect')` [tick] | — | Tick, fast |
| 35.5 | Priya | `walkTo` notifications, `play('inspect')` [tick] | — | Tick, fast |
| 37.0 | Priya | `walkTo` tracking, `play('inspect')` [loading] → stops dead [cross] | — | **Error flash over the blank panel** |
| 39.0 | Priya | `turnTo` Omar, `play('present')` [cross held] | "There's nothing here." | — |
| 40.5 | Omar | `walkTo` Priya [angry] | "It's empty because it's empty." | Red screen |
| 42.0 | Priya | [neutral, deadpan] | "A user sees a hole." | — |
| 43.0 | Sami | `walkTo` behind Omar [focused, progress 85] | "Ninety seconds." | — |

**Fix**

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 44.0 | Omar | `walkTo` tracking, `play('build')` [angry → focused → progress 100] | — | **"No active bookings yet" empty state mounts** with settle |
| 46.5 | Priya | `play('inspect')` [tick] | "Found {issueCount}. Fixed." | Success pulse |

**Approve and ship**

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 48.0 | Sami | `pickUp` nav block, `walkTo` sidebar, `place` [tick] | — | **Dashboard entry snaps into sidebar**, stub goes live |
| 50.0 | All five | `walkTo` front of dashboard, `turnTo` it, `play('inspect')` | — | Component highlights briefly |
| 51.5 | Ellie | [happy] | "Matches the design." | Board glows once |
| 52.5 | Nour | [happy] | "That's the morning view." | — |
| 53.5 | Sami | [tick] | "Shipped." | — |
| 54.0 | All five | `play('celebrate')` — **Priya half a beat late** | — | Confetti |

Then: any pair retrofits, then the hand-back.

---

## Scene 2 — New Booking (~74s)

The longest scene, because the wizard gets built **and then driven**. Nour finds the
problem here — product acceptance, not QA — and the bug is arithmetic, which sets up the
credit story that the Financials retrofit pays off.

**Brief and design**

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 0.8 | Nour | `play('present')` [happy] | "New Booking. Five steps." | Card to tablet |
| 2.0 | Sami | `walkTo` [alarmed] | "Five?" | — |
| 2.8 | Nour | [talking] | "Five." | — |
| 3.5 | Sami | [neutral] | "Four." | — |
| 4.2 | Nour | `play('present')` [happy] | "Five." | — |
| 5.0 | Sami | `play('react')` [progress 0] | "Five." | Bar starts, faster than usual |
| 6.0 | Nour | `pickUp` PRD, `place` at Ellie | — | "New Booking — PRD" |
| 8.5 | Ellie | `pickUp`, `play('inspect')`, `walkTo` easel, `place` | — | **Journey design board** |
| 11.0 | Ellie | `play('present')` | "Step rail. Summary rail." | **Two dashed frames**: wizard body, right-hand summary |

**Build — the shortcut**

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 13.0 | Omar | `play('inspect')` board, `walkTo` wizard anchor | — | — |
| 14.5 | Omar | `play('build')` ×2 [progress 45] | — | **Wizard frame + step rail mount**: Journey, Travellers, Services, Review, Credit facility |
| 19.0 | Ellie | `play('inspect')` [alarmed] | "The steps don't tick." | Step rail highlights |
| 20.5 | Omar | `play('build')` ×1 [focused] | — | **Completed steps now show check marks** |
| 22.0 | Omar | `walkTo` summary anchor, `play('build')` [progress 100, tick] | "Done." | **Summary rail mounts — total reads "—"** |

**Drive the booking**

Priya introduces **Use sample data** as a QA testability improvement: "First, make it testable."
She visibly installs the button, then jumps on it to populate the current form. The fields
remain editable and the button remains part of the shipped UI. In the Gate she introduces
it on login; here she extends it to each form step. It fills fields only: it never submits,
confirms, charges credit or overwrites a saved booking. Sami keeps the delivery pressure up.
Use `jumpPress(target)` for every scripted button, navigation item, checkbox and service
selection below. This is new choreography notation, not an existing API. Filling text may
still use `play('type')`; the action that advances a step always lands on its control.

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 24.0 | Priya | `jumpPress(New Booking)` to open the test wizard; install sample-data button; `jumpPress(Use sample data)` | "First, make it testable." | **Journey fills**: DXB → CAI, 12 Nov 2026, EK 927; 2 adults. Button compresses on landing. |
| 27.5 | Priya | `jumpPress(Continue to travellers)`; `jumpPress(Use sample data)` | "Repeatable tests." | **Travellers fill**: James Sterling, Amelia Sterling; editable fictional contact details |
| 30.5 | Priya | `jumpPress(Continue to services)`; hop on service and airport controls | — | **Services selected**: DXB Meet & Greet AED 360; CAI arrival assistance AED 280 |

**Find — Nour catches it**

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 33.5 | Nour | `walkTo` summary rail, `play('inspect')` [thinking → alarmed] | "Two services selected." | Summary rail highlights |
| 35.5 | Nour | `turnTo` Omar [talking] | "The total still says nothing." | **"—" pulses red** |
| 37.0 | Omar | `walkTo` [focused, defensive not angry] | "It's a layout." | — |
| 38.5 | Nour | [talking] | "It's a calculator." | — |
| 40.0 | Priya | `play('react')` [tick] from a distance | "Logged it." | Session issue count increases once for this distinct finding |
| 41.0 | Sami | [progress 80] | "Sixty seconds." | — |

**Fix**

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 42.0 | Omar | `walkTo` summary, `play('build')` [progress 100] | — | **Numbers roll up like an odometer**: subtotal AED 640, discount −AED 64, **charge AED 576**, "After this booking: AED 99,424" in a fresh session; otherwise the live available balance less AED 576 |
| 45.5 | Priya | `play('inspect')` [tick] | — | Success pulse |

**Finish the run**

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 47.0 | Priya | `jumpPress(Continue to review)` | — | **Review step** opens |
| 49.5 | Priya | `jumpPress(Continue to credit facility)` | — | **Credit facility step**: limit 100,000 · used 0 · available 100,000 → after 99,424 in a fresh session; otherwise use live balances |
| 52.5 | Sami | `jumpPress(credit acknowledgement)`; `jumpPress(Confirm booking)` [focused] | "Confirming." | Acknowledgement ticks, then exactly one booking request; wait for success |
| 54.5 | — | — | — | **Confirmation mounts only after save succeeds: {booking.reference}** · success pulse; failure shows retry, not celebration |
| 56.0 | Nour | `play('celebrate')` [happy] | "That's a booking." | — |

**Approve and ship**

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 58.0 | Sami | `pickUp` nav block, `place` on sidebar [tick] | — | **New Booking entry** joins sidebar |
| 60.0 | All five | huddle, `play('inspect')` | — | Wizard highlights |
| 61.5 | Ellie | [happy] | "Matches." | — |
| 62.5 | Sami | [tick] | "Shipped." | — |
| 63.5 | All five | `play('celebrate')` | — | Confetti |

---

## Scene 3 — Bookings & Manage (~62s)

The highest-stakes-looking bug beat: Priya makes a booking disappear from a **test
presentation**, while the saved record remains intact. Everyone alarms at once. If no
booking exists, she creates a labelled, temporary QA fixture inside the test presentation;
it never enters the ledger or replaces the real empty list.

**Brief and design** — compressed; the team is quicker now.

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 0.8 | Nour | `play('present')` [happy] | "Now they can manage them." | Card to tablet |
| 2.0 | Sami | [progress 0] | "Estimate?" | — |
| 2.8 | Omar | `play('react')` | "Twenty." | — |
| 3.6 | Sami | [neutral] | "Thirty." | — |
| 5.0 | Nour → Ellie | PRD hand-off | — | "Bookings — PRD" |
| 7.0 | Ellie | `walkTo` easel, `place` board, `play('present')` | "List, details, modify, cancel." | **Bookings design board**; four dashed frames |

**Build**

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 10.0 | Omar | `play('build')` ×2 [progress 40] | — | **All Bookings list + cards mount** |
| 15.0 | Omar | `play('build')` [progress 70] | — | **Booking details panel mounts** |
| 18.5 | Ellie | `play('inspect')` [alarmed] | "Confirmed and cancelled look identical." | Two badges highlight |
| 20.0 | Omar | `play('build')` [focused] | — | **Badge colours separate** |
| 22.0 | Omar | `play('build')` [progress 100, tick] | "Modify and cancel. Done." | **Modify / Cancel buttons attach to cards** |

**Find — the destructive one**

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 24.0 | Priya | `walkTo` list, `play('inspect')` [tick] | — | Fast tick |
| 25.5 | Priya | `jumpPress(Modify)`; inspect price-difference preview; `jumpPress(Back)` [tick] | — | Fast tick |
| 27.0 | Priya | `jumpPress(Cancel)` [loading] | — | — |
| 28.5 | — | — | — | **The selected test card vanishes instantly from the presentation. Error flash. No delete/cancel API call.** |
| 29.5 | Priya | stops dead [alarmed] | — | — |
| 30.0 | Nour | `play('react')` [alarmed] | "That booking just disappeared." | — |
| 30.5 | Omar | [alarmed] | — | — |
| 31.0 | Sami | [alarmed, progress 90] | — | Bar lurches |
| 32.5 | Priya | [neutral, deadpan] | "No confirmation. It just goes." | — |
| 34.0 | Priya | [cross] | "Found {issueCount}." | — |
| 35.0 | Omar | [angry] | "{issueCount}?" | Echo the live count |
| 35.8 | Priya | [tick] | "I'll wait." | — |

**Fix**

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 37.0 | Omar | `walkTo` list, `play('build')` [focused] | — | **The hidden card is revealed**; no backend restoration is needed |
| 39.5 | Omar | `play('build')` ×2 [progress 100] | — | **Cancel confirmation + credit-return summary mount** |
| 43.0 | Priya | `jumpPress(Cancel)` [loading] | — | **Dialog appears with credit to return. Priya hops on Keep booking; the record survives.** |
| 45.0 | Priya | `play('present')` [tick] | "Better." | Success pulse |
| 46.0 | Omar | [happy] | — | — |

**Approve and ship**

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 47.5 | Sami | `place` nav block [tick] | — | **Bookings entry** joins sidebar |
| 49.5 | All five | huddle, `play('inspect')` | — | — |
| 51.0 | Nour | [happy] | "Nothing gets lost now." | — |
| 52.0 | Sami | [tick] | "Shipped." | — |
| 53.0 | All five | `play('celebrate')` | — | Confetti |

Run any newly eligible connections once, using the rules below. The QA fixture is removed before delivery; if no saved bookings exist, ship the intentional empty list.

---

## Scene 4 — Financials (~44s)

Shortest and fastest — the team at full tempo. No QA beat: Ellie catches the last thing,
and Priya's "nothing" is the payoff to her running count.

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 0.8 | Nour | `play('present')` [happy] | "Now, where the money lives." | Card to tablet |
| 2.0 | Sami | [progress 0] | "Estimate?" | — |
| 2.8 | Omar | `play('react')` [neutral] | "Eighteen seconds." | — |
| 3.6 | Sami | [alarmed] | "Eighteen?" | — |
| 4.4 | Omar | [happy] | "Eighteen." | — |
| 5.5 | Nour → Ellie | PRD hand-off | — | "Financials — PRD" |
| 7.5 | Ellie | `place` board | — | **Financials design board** |
| 9.0 | Ellie | `play('present')` — wide floaty arc with the stylus | — | **Chart axes draw; the curve follows saved transaction data (flat at zero without bookings)** |
| 13.0 | Omar | `play('build')` ×2 [progress 60] | — | **Credit facility card mounts**: limit 100,000 · live used and available credit (0 / 100,000 if no bookings) |
| 17.5 | Omar | `play('build')` [progress 100, tick] | — | **KPI tiles + most-booked products mount** |
| 20.0 | Ellie | `play('inspect')` board → chart [alarmed] | "That axis is dollars." | Axis labels highlight |
| 22.0 | Omar | `play('build')` ×1 [focused] | "…Fine." | **Axis relabels to AED** |
| 24.0 | Priya | three fast `play('inspect')` [tick, tick, tick] | — | Three ticks |
| 27.0 | Priya | `turnTo` Omar [neutral] | "Nothing new." | — |
| 28.0 | Omar | [alarmed] | "Nothing new?" | — |
| 28.8 | Priya | [tick] | "Nothing new." | Success pulse |
| 30.0 | Sami | `place` nav block [progress 100 → tick] | — | **Financials entry** joins sidebar; **deadline bar completes exactly here** |
| 32.0 | All five | huddle | — | — |
| 33.5 | Nour | `turnTo` front [happy] | "The numbers match." (or "That's the platform" if all features are built) | Whole shell highlights once |
| 35.0 | Sami | [tick] | "Shipped." | — |
| 36.0 | All five | `play('celebrate')` — **Priya still half a beat late** | — | Full confetti |

---

## Pair retrofits

Feature-pair introductions fire once when both features are built, in either order.
Each is roughly 10s; run sequentially after ship and before hand-back. Do not silently
drop connections to meet a time cap. Related data connections may share one presentation.
Ordinary data updates happen immediately through shared product state; choreography
highlights those updates and never delays or duplicates them. A connection with no data
ships its proper empty state, then uses a short payoff when a real transaction occurs.

The move is always the same: **walk back to the finished thing, highlight it, change it
in front of the visitor.** That's the "we never miss" story.

### Dashboard ↔ New Booking

The slip and confirmation notification require an actual saved booking. If none exists,
skip those prop beats, show the empty-state connection, and wait for a later save.

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 0.0 | Sami | `pickUp` confirmation slip at the wizard | "This belongs upstairs." | {booking.reference} thumbnail in hand |
| 3.0 | Sami | `walkTo` dashboard anchor, `place` | — | **Dashboard reveals the actual saved booking**; no fixture is inserted if none exists |
| 6.0 | — | — | — | **"Booking confirmed — {booking.reference}" notification slides in** |
| 7.5 | Priya | `play('inspect')` [tick] | — | Success pulse |
| 8.5 | Nour | [happy] | "It found its way home." | — |

### Dashboard ↔ Bookings

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 0.0 | Omar | `walkTo` "View all →" anchor | — | Link highlights, inert grey |
| 2.5 | Omar | `play('build')` ×1 | — | **Grey → live brand colour**, sparks |
| 4.5 | Priya | `play('inspect')` [loading] | — | **Priya hops on View all, then Dashboard: the real navigation runs on each landing** |
| 7.0 | Priya | [tick] | "Wired." | — |

### New Booking ↔ Bookings

If no saved booking exists, ship the empty list and skip the card/record-specific beats.
When a booking later saves, highlight it once using the actual record.

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 0.0 | Sami | `pickUp` booking card block | — | — |
| 3.0 | Sami | `walkTo` list, `place` | — | **The saved booking appears once** with settle, using its actual reference; no new booking is created |
| 5.5 | Omar | `play('build')` ×2 along the row | — | **Modify / Cancel attach to the other cards** |
| 8.5 | Nour | [happy] | "Every booking, one place." | — |

### New Booking ↔ Financials — the credit story

This connection does **not** depend on building the Bookings list. If Financials comes
first, ship a flat chart, zero usage and AED 100,000 available. When a booking later
saves, highlight its actual deduction. If bookings already exist when Financials is
built, reveal their actual totals from its first mount; do not pretend the balance is zero.

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 0.0 | Ellie | `walkTo` chart, `play('present')` | — | Chart highlights the actual saved transaction history; remains flat if empty |
| 3.5 | Omar | `walkTo` credit card, `play('build')` | — | Highlight actual credit movement. First AED 576 booking: used 0 → 576; available 100,000 → 99,424. A replay highlights current figures without changing the ledger. |
| 7.0 | Nour | `turnTo` front [happy] | "That booking updated our credit." | Saved reference and figures pulse together; without bookings: "Ready for the first booking." |
| 9.0 | Priya | `play('inspect')` [tick] | "Reconciled." | Values agree with the backend |

### Bookings & Manage ↔ Financials — changes and credit returns

On a **real confirmed** amendment or cancellation, refresh credit, Dashboard, booking
status and Financials from the same server response. Briefly highlight the difference:
Nour: "The credit changed with it." No fake refund, double-credit or deleted history.
If either screen is not built, its next mount uses current data. The staged disappearance
and QA fixtures above never trigger this connection because they never change the ledger.

---

## Hand-back and attention idle

After the last beat of a feature, the menu does **not** return.

| t | Who | Does | Says |
|---|---|---|---|
| 0.0 | Nour | `walkTo` front centre, `turnTo` camera [happy] | — |
| 1.5 | Others | drift to idle marks [neutral] | — |
| 3.0 | Nour | `play('beckon')` loop + pulse ring every 6s | "Pick the next one." |

Idle business while waiting, on a loop, staggered so they don't sync:

- **Omar** leans on the wrench, screen dark.
- **Priya** scans empty air, finds nothing, [neutral].
- **Sami** taps the clipboard, glances at Omar.
- **Ellie** floats a slow arc around the board.

**Clicking Nour re-opens the menu.** Every ~12s while idle, one throwaway exchange fires
(Sami: "Estimate?" Omar: shrug `play('react')`) so the stage is never dead.

---

## Manual reset — the all-team closing scene (~8–10s)

**Manual only. No inactivity timer, automatic reset or automatic restart.** A persistent
Reset control sits outside the application being built, above scene overlays. It is
available during the Gate, any build, jump, dialogue, form, save, review, celebration or
idle. Clicking it starts the closing scene immediately, without a confirmation dialog.
This replaces the current product demo’s confirmation/busy restriction when implemented
in the booth experience. Repeated clicks during cleanup join the same reset rather than
starting competing scenes or archiving twice.

The closing scene works from whatever is actually on screen. Freeze the current layout,
including partial builds and dialogs, into removable presentation pieces. All five bots
participate; when very little exists they divide the remaining marks, props and dust.
Nobody waits for the interrupted scene to finish, and no absent component is fabricated.

| t | Who | Does | Says | On screen |
|---|---|---|---|---|
| 0.0 | Nour | short attention hop; gestures across stage | "Team. Clear the workspace." | Old choreography and bubbles stop; Reset becomes Resetting; existing UI becomes the cleanup stage |
| 0.5 | All | safely land or secure carried props; fan out from current positions | — | Pending impacts/clicks from the interrupted scene are cancelled |
| 1.0 | Sami | `play('sweep')` across the content band | "Wrapping up." | Content sections peel into coloured blocks along his sweep; restrained dust trail |
| 1.5 | Omar | dismantles content frames, carries blocks toward the yard | — | Forms and panels collapse into pieces in time with his strikes |
| 2.0 | Ellie | lifts design board; wipes remaining outlines and decorations | — | Easel, alignment guides and design frames erase along her motion |
| 2.5 | Nour | gathers feature cards and sidebar entries into the brief | — | Menu cards and navigation tiles fold away; lifecycle strip rolls into the brief |
| 3.5 | Priya | scans, then sweeps away orphan badges, dialogs and test fixtures | "Found the last bit." | Last visible fragments vanish with small puffs |
| 5.5 | All | coordinated final sweep toward the yard | — | Remaining application shell and header erase; persistent Reset/status remain available outside the erased app |
| 7.0 | Priya | inspects cleared stage [tick] | "Nothing left." | Empty stage; small closing pulse |
| 8.0 | All | settle into attract marks, Priya half a beat late | — | Return to the invitation only after session archival succeeds; otherwise show the recovery state below |

Reset is both choreography and a data operation. Invalidate the old scene run token and
abort its actions, timers, bubble queues and pending UI presses immediately. A jump
interrupted before landing must never activate its target later. Detach or re-home props
without dropping them through the floor; reset expressions, effects and pose blending.
Late promises cannot remount components or affect the next visitor.

Preserve the old visitor’s saved records and capture their latest editable draft as an
archive snapshot. One idempotent backend reset serializes against in-flight writes: a
booking committed first belongs to the archived visitor; a write arriving after archival
is rejected, never redirected into the new session. Do not silently discard an uncertain
save result. The new visitor starts with no bookings and AED 100,000 available.

Cleanup animation starts immediately while archival runs. Gate the fresh invitation on
both completion and confirmed archival. If archival fails, keep the cleared stage with
"Couldn't finish reset. Retry." and a persistent retry control; retain the old session
and draft snapshot for recovery. Do not invite a new visitor into an unconfirmed reset.

---

## Attract loop

No visitor: the five idle on their marks. Every 12s one short exchange, cycling so a
passer-by never sees the same one twice in a row:

1. Sami: "Estimate?" → Omar: `play('react')`, says nothing.
2. Priya inspects Omar. [tick] Omar: [angry].
3. Ellie floats past the empty easel [thinking].
4. Nour `play('beckon')` toward the camera: "Choose a feature. Watch us build it."

Clicking Nour or the visible Start invitation starts the Gate. Reset never starts the Gate. Attract animation can loop indefinitely; inactivity never clears the workspace.

---

## Product and choreography additions to implement

This revision changes **SCRIPT.md only**. These additions are authorised direction for
subsequent implementation; they are not yet delivered by this document edit.

1. **Scene controller and feature reveal.** Keep bots reusable. Put DOM anchors, stage
   layout, phase state, scene tokens, feature visibility and dialogue variants in the app
   layer. Await action completion and backend outcomes; timestamps are pacing targets,
   not timers that blindly fire. Sequential hops and reading time may extend the drafts.
2. **Jump-to-press interaction.** Add a reusable jump motion and app-side target resolver
   as defined below. Existing walking, action, expression and speech APIs remain reusable.
3. **Props and chest display.** Add real brief/design-board artwork, safe baton handoffs,
   colour-coded component blocks, and an independently animated progress display on
   Sami’s currently static chest panel. It represents theatrical delivery pressure, not
   measured backend work or a promise to finish at a particular wall-clock time.
4. **Manage booking designs and behaviour.** Extend the existing branded product with
   a Modify form, change review (old/new total, extra credit required or returned), and
   cancellation dialog (reference, service summary, credit return, Keep booking/Confirm).
   Validate and reprice on the server; reject unaffordable increases without partial
   changes. Cancellation marks a record cancelled, retains its history and returns the
   current net charge exactly once. Use illustrative full credit return in this PoC,
   clearly labelled; it is not a real supplier cancellation policy. Prevent repeated
   refunds and stale concurrent edits. Update all screens from one authoritative result.
5. **Sample data as a QA contribution.** Introduce the existing helper visibly via Priya,
   then leave it available and editable in shipped login, journey, traveller and service
   forms. On a Modify form it affects a draft only, never the saved booking until approved.
6. **Shared data and safe visual bugs.** The backend remains correct throughout the show.
   Presentation flags hide totals/cards or mislabel an axis only in a clearly staged
   test state. They cannot change prices, currency, stored records or credit. Temporary
   QA fixtures carry a "QA test" badge and never appear in financial metrics.
7. **Manual closing scene.** Implement interruptible all-team cleanup, prop recovery,
   atomic archival with draft capture, repeat-click protection and failed-reset recovery.
8. **Acceptance board and lifecycle strip.** Use the checks above as the first working
   wording. All five contribute to final review, and Deliver follows successful checks.

### Jump-to-press: a consistent visual language

`jumpPress(target)` means **approach → crouch → jump arc → land on the control →
control compresses → activate once → rebound/settle clear of the control**. This is new
script notation requiring implementation, not a claim that the current API supports it.
A subtle 100–160ms compression (about 0.96 scale), soft ring and bot squash make the impact
read as a press. Keep text legible; avoid dust over the control label.

- Apply to scripted New Booking, Use sample data, Continue/Proceed, Back, airport tabs,
  service choices, navigation links, Modify, Cancel and confirmation controls. Text entry
  remains typing. For any other scripted UI activation, use the same landing convention.
- Resolve the real visible control’s current DOM bounds into a projected landing target;
  keep the bot’s feet aligned with it. Scroll into view first and recalculate after layout
  changes. Use temporary UI-level staging for high controls; do not fake a floor-level
  stomp far below the button. Bot rendering must not intercept normal pointer events.
- The visual hit and the normal application handler occur on the **same landing cue**,
  exactly once. Do not dispatch a click and separately invoke the handler. Respect
  disabled controls, validation and confirmation requirements. A blocked target gets an
  inspection/error reaction, not forced navigation.
- During a choreographed test, the scene owns its target controls to prevent a visitor
  racing the bot. Reset remains available. Once handed back, visitor clicks/keyboard
  activation remain immediate and accessible, with the same small button feedback; they
  do not wait for a bot to walk across the screen.
- A jump can be cancelled safely at any point. Before-impact cancellation prevents the
  action; after-impact cancellation never replays it. If activation navigates away or
  removes the target, finish the landing using captured coordinates without holding
  onto a stale element. A missing target pauses/reports the scene rather than clicking
  something else. Reduced-motion mode uses a short grounded press/pulse instead.

## Order-independent scene rules

Scene numbers are identifiers, **not an enforced visitor order**. Track built features,
completed connection introductions, the last actual estimate, and unique test findings.
Include Ellie’s and Nour’s findings in the issue count; record each finding once. Priya
says the current count, never a fixed one/two/three. Financials’ "Nothing new" means no
additional QA finding, not that the session had no earlier issues.

| Scene | No saved bookings | Saved bookings already exist |
|---|---|---|
| Dashboard | Stage the missing empty state, then reveal the corrected empty design | Briefly use a labelled empty-state QA preview for the gag; restore actual bookings and metrics before approval |
| New Booking | Save the canonical two-adult example once; use fresh-session arithmetic | Run a separate booking draft; show current credit and actual resulting balance; do not replace earlier records |
| Bookings & Manage | Show the real empty list; Priya adds a labelled local QA fixture to test Modify/Cancel, then removes it before ship | Use a test presentation of an actual booking for the disappearance; keep the real record and ledger unchanged |
| Financials | Flat zero trend, zero usage, full facility; "Ready for our first booking" | Reveal actual history and current credit; no sample opening usage or invented curve |

"Last one" / "That's the platform" are allowed only when all four features are built.
Use "Here's the next piece" or feature-specific dialogue otherwise. If Financials is
first, its estimate exchange is self-contained; later scenes never invent prior estimates.
After all features, Nour says "Explore what we built. Reset when ready" rather than
inviting another unbuilt feature. Reopening the menu shows completed states; it does not
rerun a saving scene or create duplicate bookings.

## Canonical demo data and shell

- Booking reference: the actual saved record's display reference, written in this script
  as `{booking.reference}`. Preview fixtures say "QA test", never masquerade as saved IDs.
- DXB → CAI, 12 Nov 2026, EK 927; James Sterling and Amelia Sterling, two adults.
  The current product does not capture flight times; do not invent a time display.
- DXB Meet & Greet: AED 180/adult × 2 = AED 360. CAI arrival assistance: AED 140/adult × 2
  = AED 280. Subtotal AED 640, 10% corporate discount AED 64, net charge AED 576.
- Starting facility AED 100,000, **zero opening usage**. First confirmation leaves
  AED 99,424; amendments, cancellations and later bookings use actual backend balances.
- Five wizard steps: Journey, Travellers, Services, Review, Credit facility. Confirmation
  is the outcome, not a sixth form step. Start with one flight; **Add another flight**
  automatically extends the journey. No Single/Multi selector; visible wording is flight.
- The scripted walkthrough uses one flight; multi-flight entry remains available in the
  delivered product. Do not add another scene for it unless agreed later.
- Sidebar reveals only built features. Gate leaves a disabled Dashboard stub; later it
  shows Dashboard, New Booking, Bookings and Financials as their features ship. Header
  New Booking stays disabled for visitors until its feature is built; QA receives access
  to the staged test control during that feature’s testing beat. Static design boards must match
  the current product layout/branding and the above data, not outdated reference exports.
- Existing sample-data helpers, SVG icons, airport directory, credit logic and product
  state boundary are reused. Do not regress them to match older storyboards.

## Pacing and remaining creative choices

Keep the full ceremony and current scene estimates for the first staging pass. The old
estimates total 4m26s before connections, roughly five minutes with the original four
connection beats, plus visitor decisions and cleanup. New hops, QA setup and management
checks add time; measure them on screen before revising duration labels. No ninety-second
promise and no assumption that the user agreed to shorten the Gate or cut scenes.

The acceptance criteria above are a proposed starting point for refining together.
Test the jump height, button compression, stage spacing and group cleanup on the actual
booth display before locking their timings. Timing changes must preserve readable
bubbles, a visible design handoff and the final five-role review.

## Inspecting agent artefacts

Clicking a bot opens that agent’s work in a readable document viewer; provide an equivalent
keyboard-accessible role control. Product owns briefs, Design owns screens and decisions,
Engineering owns implementation notes, QA owns test cases/evidence, and Delivery owns
scope, timeline and budget. Enlarge documents rather than expecting visitors to read props.
Pause the running scene while the visitor reads; resume it on close without losing its
place. Manual Reset remains available inside the reader and starts cleanup immediately.

The `/artifacts.html` preparation workspace now demonstrates this viewer with opening
milestone drafts. During the eventual scenario, only published work should appear as
produced: each creation beat publishes a version and its prop carries the same artefact ID.
QA cases remain Not run until real execution evidence exists. Budget and timeline estimates
must be labelled, and the demo booking credit facility is never the delivery budget.

### Opening staging revision — 20 September

The opening product is now full-width and responsive, with only the bottom team/lifecycle
strip reserved for the show. The login and workspace assemble as individual regions:
Omar walks to each region, strikes to reveal it, and Priya visits that region before
work advances. QA installs and presses the sample-data helper, then tests real login.
The design board previews the actual shared components and stays above the canvas,
with an enlargement control and the existing readable artefact drawer.

Nour, Ellie and Sami support the current work from different positions. The team faces
the work and gathers into a front-facing lineup for delivery only. Build and Test
alternate on the bottom role strip; joint review highlights every role. This more
explicit assembly takes longer than the original single-reveal opening.


### Continuous construction and module reviews

Supersedes the field-by-field opening reviews above. Omar builds continuously with
repeated strikes and a progressive sharpening/wipe reveal. Only complete modules
(login, header, sidebar, empty workspace) enter review. Design and QA review in parallel
with subsequent construction; no approval gate between workspace modules. The real
login test is the navigation dependency. Simultaneous jobs appear in the bottom strip.

Brief and design access live in the reserved bottom production dock, not floating over
the work. Nour hands the brief directly to Ellie's raised hand, with a visible shared
grip and no floor pickup/placement. Bots use separated marks and avoid crossing through
one another. Manual reset still interrupts every active job and clears the stage.

### Compact production stage and visitor trial

The lifecycle is a small shadowed floating dock, not a full-width footer. Brief/design
previews live on the right, behind the bot and dialogue layers. The developer's work
outline follows the target element's live rectangle without a header offset. Walks
are direct, with limited spacing corrections rather than strict traffic queues.

Each role now publishes product-specific documents incrementally: the master Global
Concierge brief and product foundations, then the login/workspace PRD, design,
implementation record, QA evidence and release report. Status follows actual scene
milestones. QA runtime results require observed checks; manual cases remain Not run.

Sami’s countdown is a milestone-adjusted estimate, never a scheduling gate.
Work completion immediately sets it to zero and starts delivery; there is no
wait to consume unused countdown time. Document reading and saving pause it.
An expired estimate shows “Finishing release…” until the work actually completes.
After shipping, restore the completed login with a blank form so the attendee can try
it. Nour remains the feature-menu entry point; remove the duplicate completion panel.

### Dashboard implementation revision — approved sequence

Scene 1 follows the completed opening and is selected through Nour. Preserve the shell,
visitor data, master product brief and all opening artefacts. Build four complete groups:
Welcome (including a saved-draft card if present), Overview metrics, Active services,
Notifications. One continuous construction sequence per group; no field-by-field reviews.
Design and QA review independently while Engineering moves to the next group.

Nour: “One place for travel agents and travel desks to see bookings, updates and credit.”
Sami: “What are we shipping?” Nour: “The Global Concierge dashboard.”
Omar: “Four panels. I’m on it.”

Nour hands the Dashboard PRD to Ellie. Ellie explains the intentional first-visit state,
publishes the actual Dashboard design, then hands the design to Omar. The reference stays
on the right below bot/dialogue layers. Sami restarts an estimated countdown; no deadline
wait is allowed. The two findings are welcome alignment (Design) and missing empty state
(QA). They are corrected after Notifications completes. Findings and retests are retained
in the feature documents. Saved bookings use a labelled QA-only empty-state preview and
are restored before approval; bookings, draft and credit must remain unchanged.

Sami connects the Dashboard stub, Priya jumps on it and exercises the real navigation.
Booking/search/management actions remain gated until their own scenes ship. The team
checks design, live data, feature availability and preservation before saving completion.
Release returns to the interactive Dashboard immediately, counter zero, then celebration.
Nour invites exploration without reopening the menu. Choosing an already-built Dashboard
only opens it; the scene does not rerun. Reset interrupts all workers and performs the
existing all-team cleanup. The other three feature scenes remain future work.

### New Booking implementation revision

Scene 2 builds complete groups: heading/step rail, Journey, persistent summary, Travellers,
Services planner, Review, Credit facility and the saved Confirmation. The sample-data
helpers are introduced by Priya per form step. She selects two adults, exercises missing
flight number and malformed email states, then hops on departure/arrival and actual
service checkboxes. Sample dates remain in the future rather than using a fixed date.

Design logs and fixes missing completed-step ticks. Product logs the empty-looking
commercial totals; Engineering restores the real calculated subtotal, discount and credit
charge without changing pricing logic. The backend alone commits the final amount.
Sami acknowledges credit and confirms exactly once. Retry uses the same request identity.
An existing attendee draft is preserved in its own slot while the scene uses a rehearsal
slot. Reset during saving archives any already-committed transaction with the old session
and prevents stale callbacks from restoring the stage.

If Dashboard exists, the bots navigate there and highlight its actual saved reference,
updated savings and live credit. This connection never submits another booking. Artefacts
are appended to the session's existing work. The countdown restarts, remains informational,
and is never awaited. After approval the visitor receives a fresh editable Journey form.
New Booking remains reachable from the header, released sidebar entry and Dashboard;
management/financial scenes are still separate releases.


### Dashboard dialogue branches — build order and saved data

This overrides the unconditional “There are no bookings” comic beat above.
The scene reads the released features for this run and the current backend snapshot.
A feature flag alone must never imply that a confirmed booking exists.

| Context | Requirements and design | QA finding and resolution | Handback |
|---|---|---|---|
| Dashboard first, no saved bookings | Introduce a workspace ready for future activity | Original missing-empty-state exchange; repair the message | Invite the visitor to choose the next feature |
| Booking released, no saved bookings | Acknowledge the working booking flow, with no confirmed reservations yet | Empty-state check; creation/resume controls remain enabled | Invite the visitor to make a booking using the existing flow |
| Saved bookings exist | Explicitly reference existing bookings, services and actual remaining credit | Show real records first. Priya announces an empty-state QA preview; Omar says the records are still saved. Repair the preview, then restore actual records and verify credit is unchanged | State that Dashboard now displays the bookings already made |

All five feature artefacts record the selected branch and starting booking count.
The temporary QA preview never changes the ledger. Reviews and continuous construction
keep their existing concurrency; this is one scenario with contextual dialogue, not
separate copies of the movement sequence.

### Bookings & Manage — implemented scene and transaction contract

The normal New Booking release saves a real booking; management acknowledges it.
With no usable saved record, Priya introduces a labelled, temporary QA example.
The script never amends/cancels a visitor record: its preview tests propose an added
service, discard it, stage a card disappearing, restore it, inspect cancellation and
choose Keep booking. The before/after business snapshot must match exactly.

Build complete containers in sequence: list/search/filters; detail and history;
management actions; status comparison and repair; full modification form; price review;
restored details; cancellation decision; real-list handback and eligible navigation.
Ellie reviews finished details while Omar builds actions. Dialogue, handoffs, continuous
strikes, reset cancellation, live artefact publication and immediate timer completion
use the shared scene system.

The released product supports real, server-priced amendments and cancellations.
Route/flight count/traveller count remain fixed; date/number, names/contact and eligible
services can change. Show the difference before approval. Preserve immutable original
creation requests plus versioned current state/history. Atomic request receipts prevent
repeat charges/returns; stale edits and archived-session writes are rejected. Full
cancellation credit is an illustrative PoC policy. The cancelled record stays visible.

Dashboard active counts/savings exclude cancelled bookings. The management feature
connects View all and detail entry points only after it is built. Normal booth use
retains the booking created by the previous scene for Financials and later exploration.

### Financials & Insights — implemented scene

Use the saved transaction history and current credit snapshot. Branch dialogue into
empty facility, existing charges, or activity including returns. Zero current usage
with past events is not an empty account. No sample charges, reset of usage or real
transaction is introduced by this read-only scene.

Nour briefs Ellie; the actual design is handed to Omar. Complete build groups are:
credit overview/metrics, trend, active-service insights, and transaction history.
Priya reviews finished credit independently while construction continues. Ellie catches
USD chart labels (display-only); Omar repairs both to AED. Priya reconciles event count,
charges minus returns, chart endpoint, active-service counts and preserved business
state. “Nothing new” means no new QA finding after the design fix, not no activity.

Sami connects Financials navigation, and Priya hops on it and on a real transaction's
booking link if Management is built. All five feature artefacts retain actual evidence.
The counter finishes with work, then celebration and a usable Financials handback.
If all other features are built, Nour acknowledges the platform; otherwise invite the
next feature. Existing manual reset and reader pause continue to apply.

When Booking is built after Financials, revisit credit/history after the actual save
and verify its charge. Confirmed management changes refresh the shared snapshot,
show the actual difference and offer the completed Financials view. No QA preview or
cancelled edit triggers a fabricated ledger movement.


## Final booth polish — manual demolition reset
Reset cancels the active scene, dialogue and delivery timer immediately. All five bots take nearby throwing positions, hold cartoon bombs, wind up, and release them toward visible application sections. Curved flights cause dust, impact rings and page fragments. Temporary fragments are inert and disposed. Other bots leave; a fresh archived-session reset returns to Nour’s welcome. No inactivity reset. Repeated reset clicks do not repeat the archive operation; failed archive requests retain their idempotency key for retry. Feature choices are enabled only for unbuilt features; completed features read Shipped. The subtle ARRIVE banner uses a vector recreation of the supplied photograph, not an official brand asset.
