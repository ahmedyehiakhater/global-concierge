# Opening scene

Open `/opening.html`. This is the Gate only: Nour invites the visitor; the team enters;
a physical document passes to Ellie; her actual design reference appears; Omar reveals
the real Login component; Priya reveals the sample-data control and jumps onto it and
Submit; the shell assembles; the team reviews and offers feature choices.

Feature choices are acknowledged, not built yet. The product and bot studio remain
separate routes. The preview shell exposes only a disabled Dashboard stub.

SceneClock drives waits and jump curves from rendered time. Artefact viewing pauses
that clock and bot updates, preserving pending dialogue. Abort signals cancel timed
work and run guards stop old continuations. Landing invokes the real DOM control once,
with its normal validation. Jump trajectories are an app-level overlay on the rigid rig;
no product-specific logic enters the shared bot module.

Manual reset aborts the run, clears dialogue, safely detaches the brief and brings all
five agents into cleanup. It archives the current shared local visitor session through
the existing idempotent API, retaining its saved bookings/draft, and waits for successful
archival before enabling a fresh invitation. No inactivity reset. A failed archive
keeps the reset key for retry. This route shares the local visitor cookie with product.html.

Artefacts currently open the authored drafts from the shared viewer; stage participation
and tick animations do not convert those QA plans into executed evidence. Backend
workspace completion is stored after the Gate's checks. Scene position itself is not
persisted across reload. Reload rehearses the Gate; it does not create bookings.

## Continuous assembly and concurrent reviews

The product fills the responsive viewport above the reserved bottom production dock.
`pieces.js` defines the component reveal order. Omar repeats three hammer swings per
piece while a clock-driven wipe sharpens it from a faint construction outline into
finished UI. Pausing an artefact reader freezes both motion and reveal progress.

Review boundaries are whole modules: login, header, sidebar and empty workspace.
Independent `ReviewQueue` instances serialize each reviewer's own jobs, while Omar
continues building the next module. The bottom role strip displays simultaneous jobs.
Login is the deliberate dependency: its real sample-data and submit actions must pass
before navigating to the workspace; engineering prepares its next position meanwhile.
Visual inspections are scripted theatre, not automated business-test evidence.

The brief/design thumbnail is docked below the work area, alongside the lifecycle
controls; opening it uses the readable artefact viewer. It never floats over a bot.
`staging.js` plans routes around occupied silhouettes and reserves crossing paths so
robots yield where needed. New standing positions leave space between characters.

`BriefHandoff` attaches the brief to real grip sockets and uses the existing rigid-arm
IK to hold its lower edge clear of the torso. Nour offers it at hand height, Ellie
reaches for it, and ownership changes at the shared grip without a ground placement.
The overlay is scene-specific; the shared bot module remains independent. Reset
cancels reveal/review work, releases traffic reservations and detaches the brief.

## Current staging refinements

Movement now uses direct, short walks with one small sidestep for a close obstruction.
It no longer serializes the cast through conservative traffic corridors. The lifecycle
is a compact floating dock. The right-side document preview is below the bot/speech
canvas so characters and dialogue remain visible over it. Work outlines track the
actual element rectangle, including header elements and scroll changes.

Sami’s countdown is a milestone-adjusted estimate, never a scheduling gate.
Work completion immediately sets it to zero and starts delivery; there is no
wait to consume unused countdown time. Document reading and saving pause it.
An expired estimate shows “Finishing release…” until the work actually completes.
At delivery, the login is
remounted with blank inputs and normal user interaction enabled. Nour prompts the
visitor; there is no duplicate Choose a feature panel under the cast.

## Dashboard scenario

After the opening, click Nour (or keyboard-focus “Choose next feature with Nour”) and
choose Build Dashboard. The scene lives in `dashboard.js` and consumes the shared
motion/reveal/handoff helpers. It reuses the actual Dashboard product component and
builds four groups: welcome (and any saved draft), metrics, services, notifications.
Design and QA review complete groups independently. Dialogue is queued so concurrent
reviews do not cut off one another. The welcome alignment and missing-empty-state
findings are presentation-only; existing session data is never replaced by test data.

The feature publishes five Dashboard documents into the current artefact run, retaining
the master and opening documents. The countdown restarts and remains informational.
Completion is saved through the feature API, the real Dashboard becomes interactive,
and the team celebrates. The Dashboard option then reads “built” and opens the page
without replaying the scene or saving anything again. The other feature scenes remain
clearly labelled as future work; their product actions stay gated.

The standalone `product.html` keeps its existing full-product availability. Passing an
`availableFeatures` list to Shell/Dashboard enables staged availability. A supplied empty
list therefore has different semantics from an omitted list. Feature scenes must supply
real handlers for each future destination before including it in that list.

## New Booking scenario

`booking.js` stages the real five-step BookingWizard, QA sample helpers, visual findings,
credit confirmation and the Dashboard connection. `bookingFlow.js` owns cancellable
save/confirmation operations for the stage and the delivered visitor form. The rehearsal
uses its own backend draft namespace and a session-specific idempotency key. The normal
visitor form uses distinct pending request keys. A failed response exposes Retry save
safely and pauses the scene until the same operation succeeds; manual Reset still works.

Draft preservation and reset safety are tested against the real SQLite store. A late save
response cannot restore the interrupted UI. A booking that committed before reset stays
in the archived visitor session, while a late write to an archived session is rejected.
New Booking construction leaves the calculator authoritative: missing totals and step
markers are presentation-only defects. Design previews use the actual wizard at every
step. The final hand-back is a new Journey form with no selected services; the example
booking remains saved. Reopening a built feature never replays its transaction.

A new opening ceremony never restores completed feature flags. If the loaded session
contains prior releases/bookings, Nour explicitly offers **Start a new build** and
archives that session only on that click. Reload alone does not reset it. The gate
releases only the workspace; Dashboard and Booking remain independently selectable.
Booking-first retains the saved transaction; a later Dashboard scene starts on an
empty stage and builds its panels using that transaction without another deduction.
QA focuses and highlights the specific field under test, deletes/types characters
visibly, and holds invalid input with an inline explanation before correcting it.

Bookings & Manage uses the shared Management component and ManagementController.
Scripted tests run on a labelled read-only presentation copy (or a temporary example
when empty). All ten runtime checks are recorded in Priya's feature artefact. The live
list is restored before release. Visitor actions use versioned backend quotes, amendments
and cancellation with persistent retry keys. Reset cancels controller epochs. Dashboard
links and creation-confirmation links respect the management feature gate.

Financials is a read-only scene backed by shared/financials.js. It publishes five
feature artefacts and records FIN-01 through FIN-09 from actual UI and snapshot checks.
Its only staged defect is chart currency text; values remain AED. Empty, populated and
credit-return contexts select truthful dialogue. Financials can ship first, later
creation revisits its actual deduction, and management's confirmed changes update the
same session with a delta notice. The final page remains available for exploration.

Manual reset uses demolition.js: the reusable throw action releases each hand-mounted
prop once, then scene-clock arcs trigger inert viewport fragments and capped particles.
Interrupting cancels old actions before the idempotent archive request starts. Props,
materials, fragments and animations are disposed; Nour remains for the fresh welcome.
Reset is disabled while already running. No inactivity timer is used.
Completed feature choices are disabled with a Shipped label, including keyboard and
programmatic selection. The first available choice receives focus.
