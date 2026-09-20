# Global Concierge — agent build demo

Context file for Codex. Read this first.

---

## What this is

A booth experience for **Fursa Tek**, an aviation technology event. I'm a Technical
Product Manager at **dnata International**. We're exhibiting our **Global Concierge**
POC — the B2B agent portal for Marhaba concierge services.

A standard "prompt in, feature out" AI demo won't stand out; everyone has those tools
now. Instead: a browser experience where the Global Concierge app **assembles itself on
screen** while five personified robot agents — product, design, engineering, QA,
delivery — visibly do the work of building it.

The visitor chooses what gets built. The agents build it in front of them.

---

## The experience

### Interaction model

- Visitor is shown a menu of features as on-screen cards and picks one.
- The agents build that feature. The real UI component mounts on cue.
- On completion the menu does **not** reappear. The Product agent (Nour) goes into an
  attention-seeking idle — waving, pulse ring, a prompt after ~3s. The visitor clicks
  her to re-open the menu.
- **Reset button**: all five agents throw cartoon bombs; the visible app fragments and clears.
  Returns to Nour’s welcome. Cancels in-progress work; no duplicate reset requests.
- **Reset is manual only**: never reset for inactivity.

This is **not** a passive video loop. Earlier drafts said "unattended and looping" —
that is wrong and superseded.

### No runtime LLM calls

The whole thing is deterministic. Nothing is generated live. It must never stall or
fail in front of a visitor. The UI components are **real, pre-built React components**
— we are not animating fake screenshots — but the choreography is scripted.

### Sequence

**Gate (not selectable, runs first, ~25s, full ceremony):** Agent Login & Shell.
Ends with an empty shell — sidebar holds a disabled Dashboard stub, content area reads
"Nothing here yet."

**Then selectable in any order:**

1. **Dashboard** — welcome header, Active Services Tracking list, Notifications panel
2. **New Booking** — booking wizard through to confirmation (ref MB-2024-8892,
   EK 001, Elite Meet & Greet, AED 669.38)
3. **Bookings & Manage** — bookings list, booking details, modify and cancel flows
4. **Financials & Insights** — credit usage, Booking Value Trend chart, most-booked
   products

Four selectable keeps the menu readable and keeps the pair count manageable.

### Single shell, always

Slim top bar (logo, search, New Booking, notifications, avatar) + left sidebar.
The sidebar **starts nearly empty and gains an entry per feature built** — it is the
visible progress indicator. By the end it's full, which reads as "we built a platform,"
not "we built five pages."

The reference designs in `/references/designs` are inconsistent (some have top nav +
sidebar, some sidebar only, branding varies between "MARHABA" and "Marhaba B2B").
**Normalise to one shell.** They are concepts, not specs — use them for layout and
content, ignore their colour entirely.

### Interconnection — do not write per-order scripts

This is the "build and never miss" story: agents go back and modify earlier work so it
fits with the new feature. Implemented as two mechanisms:

**Hooks** — what a feature adds to the shell on landing (sidebar entry, header button,
route registration). Identical shape for every feature. One reusable choreography,
written once.

**Pairs** — a retrofit that fires when the **second** member of a pair lands, in either
order. Only these four are authored:

| Pair | What visibly changes |
|---|---|
| Dashboard ↔ New Booking | Active Services Tracking goes from empty state to showing the EK 001 booking; "Booking Confirmed" notification slides in |
| Dashboard ↔ Bookings | "View all →" goes from inert grey to live red, visibly wired by an agent |
| New Booking ↔ Bookings | The wizard-created booking appears as a card in All Bookings; Modify/Cancel buttons attach to existing cards |
| Bookings ↔ Financials | Booking Value Trend animates from flat to the upward curve; sidebar credit usage fills to $12,450 / $50,000 |

On a pair retrofit the agents walk back to the already-built component, it highlights,
and it visibly changes.

Everything else rides the generic hook pass. Four authored sequences, not twenty-four.

### Empty states are load-bearing

Every feature ships with a deliberate-looking empty state ("No active bookings yet") so
a later retrofit has something to visibly replace. The contrast is the payoff.

### Critical detail

The agents must visibly **cause** each element to appear. An agent carries a block
across, drops it, the component snaps in with a settle animation. If elements just fade
in while agents mill about nearby, the illusion breaks and it looks cheap.

### Stretch goal — only if everything above is complete

**Supplier Portal** as a fifth card. View flips to a second shell, a supplier adds
"Buggy Service — AED 120," camera flips back, and that service appears in the agent's
booking wizard. Cross-portal causality. Do not start this until the rest is done.

---

## The agents

Five cartoon robots. Chunky toy-like proportions — head roughly a third of total
height. Large rounded head with a flat dark screen as a face, rounded torso, short arms
with mitten hands, short legs with rounded feet. Matte surfaces, no gloss. All wear an
**open-fronted hi-vis lime safety vest with two grey reflective stripes** (ground-crew
association, fits dnata; also ties the five together visually).

| Name | Role | Silhouette | Colour | Permanent tool | Movement personality |
|---|---|---|---|---|---|
| Nour | Product | Tall rounded chassis, dome head, short antenna with ball | Mustard yellow | Tablet | Bouncy, arrives slightly ahead of herself |
| Ellie | Design | Smallest and roundest, hood-shaped head | Soft teal | Stylus | Floaty, moves in arcs, never snaps |
| Omar | Engineering | Broadest and heaviest, boxy square shoulders, flat-topped rectangular head | Charcoal grey | Wrench/hammer | Heavy and deliberate, slow to start, hard to stop |
| Priya | QA | Slim and upright, narrow chassis, tall head with wide screen, ring lenses both sides | White | Magnifying glass | Quick twitchy bursts, stops dead |
| Sami | Delivery | Compact and squat, wide stable chassis, wide short head, chest panel | Navy | Clipboard | Brisk, efficient, constant tempo |

Names were chosen for a diverse team (Arab, British, Indian) without making a statement
of it. All bots are **left-right symmetrical** so they mirror cleanly in code.

**Nour is the interaction point.** She needs the strongest, friendliest "come talk to
me" idle — she's what the visitor clicks to re-open the feature menu.

**Priya is the comic relief.** The QA bug-discovery beat is the funniest moment in the
demo and deserves its own choreography.

**All five throw cartoon bombs** on manual reset; a playful demolition clears the app.

### Screen expressions

Each bot's head screen is a **canvas texture drawn in code** — no art dependency.
Expressions: neutral, thinking, talking, happy, focused, alarmed, error, success. Plus
status graphics: progress bar, spinner, red cross, green tick. Blinking at randomised
intervals.

The screen can show things a face can't, and that's the point — a progress bar while
Omar builds, a red cross when Priya finds a bug, a tick on deploy. That vocabulary is
more expressive for a software-delivery story than eyebrows.

Expressions are settable **independently of actions** — a bot can walk while thinking.

---

## Architecture

Two layers, built in two sessions, deliberately decoupled.

### Bot module (built separately, in GPT — do not rebuild)

Vite + Three.js. Robots built as 3D models constructed in code from primitives. No
external model files, no sprite sheets.

One **parametric builder** takes a config object (proportions, colours, head shape,
accessories, easing constants) and returns a rigged bot. Five config presets, not five
bespoke models.

Rig: root, torso, head, two arms with shoulder and elbow pivots, two legs with hip and
knee pivots. Rigid parts, no deforming skeleton. Vest attaches to torso. Carried object
attaches to a hand.

Camera: fixed orthographic, slightly elevated, shallow downward angle.

**Action vocabulary:** `idle`, `walkTo(x,z)`, `turnTo(direction)`, `pickUp(object)`,
`carry`, `place(x,y,z)`, `build`, `type`, `inspect`, `present`, `beckon`, `sweep`,
`celebrate`, `react`. All report completion so they can be chained, run in parallel
across bots, and cancelled mid-flight.

**Effects layer:** dust puff, sparks, impact ring, dust trail, confetti burst, error
flash, success pulse. Triggerable at any world position, not just on a bot.

**Motion quality requirements:** idle breathing, anticipation before moving, overshoot
and settle on stopping, head lagging slightly behind the body, squash on impact. Bots
walk — legs alternate, body bobs — they don't glide.

**The bot module knows nothing about this demo.** Generic interface only:
`walkTo(x, z)`, `play('build')` — never `walkToEngineeringDesk()` or
`buildLoginScreen()`. All demo-specific choreography lives in the app layer.

See the module's own README for its interface.

### App layer (this session)

The Global Concierge React app, the feature menu, the choreography that drives the
bots, the hooks and pairs system, the reset. Imports the bot module and calls into it.

---

## What was tried and rejected

Don't rediscover these.

- **Human characters** (AI-generated 3D-style people with expression sheets). Abandoned
  for bots: bots are more thematically apt for "agents", expressions become code
  instead of art, and rigid geometry rigs far more cleanly than clothed anatomy.
- **AI-generated sprite sheets.** Failed repeatedly across four attempts with GPT and
  Gemini. Image models hold a character well across *poses* but cannot construct a
  structured *cycle* — frames came back near-identical, then lurching, with drifting
  scale and ground line. This is a fundamental limitation, not a prompting problem.
- **Blender headless via `bpy`.** Segfaults on import in GPT's sandbox. Not viable
  without a local Blender install and script debugging, which is its own weekend.
- **Higgsfield.** Video generation platform. Built for cinematic character consistency
  across shots, not pixel-level frame geometry. Wrong tool.
- **Bought sprite packs** (itch.io, OpenGameArt, GameDev Market). Viable, but means
  abandoning the approved bot designs and the dnata tie-in.
- **Hovering bots instead of walking.** Rejected — walking was a requirement.

Conclusion that led here: a fixed 3D character moved in code beats generating new
drawings of a character. Three.js removes the art dependency entirely.

---

## Branding

**The demo is dnata-branded, not Marhaba-branded.** The reference designs use Marhaba
branding — that is wrong and was my manager's placeholder.

**dnata brand values are not yet confirmed.** I need to pull the exact hex values,
typeface and wordmark SVG from internal brand guidelines. Until then:

**Build against CSS custom properties, not literals** — `--brand-primary`,
`--brand-accent`, `--surface`, `--surface-raised`, `--text-primary`. Use placeholders
for now. When the real palette lands it should be a five-line change. Do not hardcode
colours into components.

Open question: whether this is branded **dnata** or **dnata International** specifically
— Global Concierge sits under the latter.

The bots' lime vests are independent of brand palette and stay as they are.

---

## Assets

`/references/bot-lineup.png` — the five bots, front view, symmetrical, lime vests.
**Master design reference.**

`/references/priya-turnaround.png` — five-view turnaround (front, 45°, side, 135°,
back). Canonical for proportions and camera angle.

`/references/designs/` — Google Stitch concepts of the Global Concierge B2B portal:
dashboard, booking confirmation, booking details, financials, all bookings, modify
booking, cancel booking. **Layout and content reference only — ignore their branding
and their inconsistent shell.**

---

## Working notes

- Scope discipline matters more than features here. The failure mode I'm most worried
  about is a half-finished visual that looks worse than a plain demo.
- Judge motion quality by: does a bot have weight when it stops, and does a placement
  feel caused rather than coincidental.
- Take screenshots of the running page and review your own output — visual iteration is
  the whole game.
- There is also a **supplier portal** in the wider product (suppliers add services,
  travel agents book them). Out of scope except as the stretch goal above.
