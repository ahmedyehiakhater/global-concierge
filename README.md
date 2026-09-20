# Global Concierge — reusable bot system

This project lives at **`~/Desktop/Global Concierge`**. It contains a reusable Three.js robot library and an independent Vite test page. There is no office, application logic, external model, or generated sprite. The shared rigid rig and distance-driven gait remain intact. Cartoon proportions, properly rounded inset screens, stronger actions and faster personality presets are configured on top of them.

## Run locally

Use Node **22.12+** (or 20.19+):

```sh
cd "$HOME/Desktop/Global Concierge"
npm install
npm run dev
```

Open the address printed by Vite, normally **http://127.0.0.1:5173/**. Changes reload automatically. Stop with Control-C.

On this Mac, double-click **`start-dev.command`** in Finder to start the server using the available Codex Node runtime. Dependencies are already installed. The launcher falls back to your normal Node installation on other machines.

```sh
npm test           # rig, gait, action lifecycle, props, screens and effects
npm run build     # production bundle in dist/
npm run preview   # preview production build
```

The test page lets you select all five bots, trigger every action, adjust walking speed, change screen graphics independently, fire effects, and run a two-bot sequence. “Pick → carry → place” performs approach and transport. “Pick up” alone requires a nearby parcel; it reports an explanation if the bot is out of reach. “Reset all” restores the demo. ↻ denotes a loop; use Finish loop or Cancel action.

## Module boundary

Copy **`src/bots/`** into your application and install `three`, or import its entry point directly. It knows nothing about the demo, destinations, roles, or application choreography. `src/main.js`, `index.html`, and `src/style.css` are solely the sandbox.

| File                | Responsibility                                                                   |
| ------------------- | -------------------------------------------------------------------------------- |
| `src/bots/index.js` | Public exports                                                                   |
| `buildBot.js`       | One parametric builder and rigid pivot hierarchy                                 |
| `presets.js`        | Five designs and numeric motion personalities                                    |
| `Bot.js`            | Public action API, cancellation, props and action poses                          |
| `BotMotion.js`      | Original distance-driven walk, anticipation, overshoot, head lag and leg solving |
| `Screen.js`         | Canvas expression/status textures and blinking                                   |
| `tools.js`          | Permanent primitive-based hand accessories                                       |
| `Effects.js`        | Independent bounded particles, trails and pulses                                 |

No model files, textures, fonts, network calls, DOM selectors or demo references are required by the module. Screens create an offscreen canvas; the renderer and page belong to your application. Headless tests can use `screen:false` or inject a `canvasFactory`.

## Create, place and update a bot

```js
import * as THREE from "three";
import { createBot, BOT_PRESETS, BotEffects } from "./bots/index.js";

const scene = new THREE.Scene();
const effects = new BotEffects(scene);
const priya = createBot(BOT_PRESETS.priya, { effects });
scene.add(priya.root);
priya.root.position.set(0, 0, 0);
priya.root.rotation.y = 0;

// In your existing renderer's animation loop (seconds):
function update(dt) {
  priya.update(dt);
  effects.update(dt); // once per shared effects system, not once per bot
}
```

Units are metres approximately. **+Y is up, +Z is forward, floor Y=0**. Use an unscaled, unrotated scene parent for bots, props and effects. Bot root scale stays 1; change proportions through config. The action controller owns root height, torso pose and joint transforms while updating. The fixed orthographic camera in the sandbox is not part of the module.

`bot.root` is a Three.js Group. `bot.rig` exposes `torso`, `neck`, `head`, `vest`, `screenMesh`, `tool`, `arms.left/right` (`shoulder`, `elbow`, `hand`, `socket`) and `legs.left/right` (`hip`, `knee`, `ankle`). The vest is a child of the torso. The permanent tool belongs to the **right hand**; carried objects use the **left hand**. Tools stay attached through all actions.

`createBot(config, { effects, screen:true, canvasFactory, random })` returns a Bot. `effects` is optional. `random` controls blink timing and can be seeded for deterministic playback. `buildBot(config)` remains available when only geometry and pivots are needed, without action or screen controllers.

## Presets and customization

| Key     | Design                                               | Tool             | Motion personality   |
| ------- | ---------------------------------------------------- | ---------------- | -------------------- |
| `nour`  | Mustard, tall rounded chassis, dome, centred antenna | Tablet           | Bouncy               |
| `ellie` | Teal, smallest, rounded hood head                    | Stylus           | Floaty               |
| `omar`  | Charcoal, broad box-shaped head and shoulders        | Wrench           | Heavy and deliberate |
| `priya` | White, slim, paired ring lenses                      | Magnifying glass | Quick and precise    |
| `sami`  | Navy, squat, wide short head, chest panel            | Clipboard        | Brisk and steady     |

All are created by the same builder. A sixth bot is a data entry:

```js
const newConfig = {
  ...BOT_PRESETS.nour,
  name: "New agent",
  colors: { ...BOT_PRESETS.nour.colors, body: "#b080d0" },
  torso: { width: 0.8, height: 0.72, depth: 0.52, roundness: 0.18 },
  head: { width: 1.05, height: 0.85, depth: 0.76, shape: "dome" },
  accessories: { antenna: true },
  tool: "tablet",
  personality: {
    tempo: 1.1,
    walkSpeed: 1.0,
    turnTime: 0.4,
    bob: 1.2,
    energy: 1.1,
  },
};
const another = createBot(newConfig, { effects });
```

Config fields: `torso.width/height/depth/roundness`, `head.width/height/depth/shape/radius`, `hipHeight`, `limbs.upperArm/forearm/thigh/shin/armRadius/legRadius`, `colors.body/vest/stripe/screen/joint`, `accessories.rings/antenna/chestPanel`, `tool`, `personality`. Head shapes: `rounded`, `dome`, `hood`, `teardrop`, `box`, `wide`. Tools: `tablet`, `stylus`, `wrench`, `magnifier`, `clipboard`. Tool omission produces no tool.

`tempo` changes action timing, `walkSpeed` the default travel speed, `turnTime` on-the-spot turn duration, `bob` gait bounce, and `energy` action emphasis. Defaults use compact cartoon proportions and faster travel (1.25–1.9 units/second across the five personalities). Keep leg length and hip height physically compatible; extreme proportions can put foot targets outside the leg's reach. New primitive/accessory _types_ would require extending the generic builder; new characters using existing types only need config.

## Actions

Every action returns a Promise resolving to **`{action, status}`**, where status is `completed` or `cancelled`. Starting any action cancels the previous one. There is no implicit queue; sequence with `await`. Update the bot continuously for actions to progress. Invalid arguments throw synchronously.

| Call                             | Behaviour and parameters                                                                                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bot.play('idle')`               | Breathing and slow weight shifts; loop until stopped. No active action also idles.                                                                                                           |
| `bot.walkTo(x, z, options)`      | Face world destination with a visible turn, anticipate, walk, overshoot and settle. `speed` is units/second; must be positive.                                                               |
| `bot.turnTo(direction, options)` | World yaw in radians, or `{x,z}` direction vector. Yaw 0 faces +Z; π/2 faces +X. `duration` sets seconds.                                                                                    |
| `bot.pickUp(object, options)`    | Crouch, grasp, attach to free hand and lift. Pass a Three.js Object3D already in the scene. Approach within 1.05 horizontal units first and face it.                                         |
| `bot.walkTo(x,z,{carry:true})`   | Slower carry-style travel. With an attached object, carry mode is automatic and the free hand stays at chest height. Default speed is 70% of normal. Explicit `speed` overrides the default. |
| `bot.place(x,y,z,options)`       | Lower held object, release at the world-space **object origin** and settle with impact squash, dust and a ring. Walk within 1.05 horizontal units first.                                     |
| `bot.play('build', options)`     | Repeating raise-and-strike tool action; automatic dust and sparks on each strike.                                                                                                            |
| `bot.play('type', options)`      | Repeating alternating hand motion at a work-surface height.                                                                                                                                  |
| `bot.play('inspect', options)`   | Lean forward, raise tool, hold the examination pose, straighten.                                                                                                                             |
| `bot.play('present', options)`   | Raise free arm and gesture.                                                                                                                                                                  |
| `bot.play('beckon', options)`    | Raise free arm and wave toward the bot's facing direction. To address a camera, turn toward it first.                                                                                        |
| `bot.play('sweep', options)`     | Repeating low side-to-side clearing motion, with dust trail. Does not delete/move application objects.                                                                                       |
| `bot.play('celebrate', options)` | Arms up, small jump, landing bounce; confetti, landing dust and ring.                                                                                                                        |
| `bot.play('react', options)`     | Two clear head nods with a smaller second acknowledgement; arms remain relaxed.                                                                                                              |

Common options: `signal` (AbortSignal), and for `play`, `duration` (positive cycle duration before personality timing), `loop` (override whether it repeats), `target` (`THREE.Vector3` or `{x,y,z}`, turns toward the target; build effects use this position). Finite default durations: inspect 2.3s, present 1.8s, beckon 2s, celebrate 1.7s, react 1.1s. Loop periods: build 1.1s, type 1.3s, sweep 1.4s. Pick/place last 1.65s. Personality `tempo` scales these durations. Do not set `loop:true` on pickup/place; they are single object transitions.

While carrying, free-hand attachment takes priority over free-hand gestures so the prop remains stable. The permanent tool always moves with the other hand. For a full two-hand gesture, place the object first. These are stylised kinematic actions, with no physics/collision simulation. Small props near the demonstrated 0.3-unit size work best. Use a centred wrapper Group for props with an unusual pivot; the bot grips that origin. Very large objects and distant/high targets require application-specific reach planning. Flat-floor movement has no obstacle avoidance.

## Sequence, stop and cancel

```js
const result = await priya.walkTo(2, 1, { speed: 1.2 });
if (result.status === "completed") await priya.play("inspect");

const loop = priya.play("build");
// Later:
priya.stop(); // ends the current action as completed
await loop; // resolves {action:'build', status:'completed'}

const work = priya.play("sweep");
priya.cancel(); // resolves work as cancelled; stops trail
await work;

const controller = new AbortController();
const trip = priya.walkTo(4, 2, { signal: controller.signal });
controller.abort(); // same cancellation semantics
await trip;

const unsubscribe = priya.onComplete(({ action, status }) => {
  console.log(priya.config.name, action, status);
});
unsubscribe();
```

`stop()` completes the current action at its current position; it does not teleport to its destination. `cancel()` cancels at the current position. Both blend the pose back toward idle over a short settling interval. A held object stays attached on cancellation, including cancellation after the grasp part of a pickup. On place cancellation, attachment depends on whether release has already happened. Check `bot.held` before the next object action. A cancelled sequence must check the result before starting its next action, or use one AbortSignal for the whole sequence.

## Expressions and status graphics

Independent of motion, with immediate swaps:

```js
priya.setExpression("thinking");
const walking = priya.walkTo(1, -2);
priya.setStatus("progress", 42); // percentage 0–100, clamped
priya.setStatus("loading");
priya.setStatus(null); // restore last expression
priya.setExpression("happy"); // clears status graphic
await walking;
```

Expressions: **neutral, thinking, talking, happy, focused, alarmed, angry, error, success**. Talking animates the mouth. Neutral and other face expressions blink at randomized 2–6 second intervals. Status graphics: **progress, loading, cross, tick**. Loading animates a spinner; cross/tick are red/green. Error/success expressions also emit an optional matching pulse when an effects system is attached. Status-only screens don't blink. `EXPRESSIONS` and `STATUS_GRAPHICS` are exported lists.

The head's existing screen mesh receives a procedurally drawn CanvasTexture; no external images. `screen:false` keeps the original blank material for server-side geometry use.

## Independent effects

```js
const fx = new BotEffects(scene, { maxParticles: 500 });
fx.emit("dust", new THREE.Vector3(1, 0.05, 2));
fx.emit("sparks", position, { count: 16, scale: 0.8 });
fx.emit("ring", floorPosition);
fx.emit("confetti", aboveBotPosition);
fx.emit("error", targetPosition);
fx.emit("success", targetPosition);

const trail = fx.startTrail(() =>
  movingObject.getWorldPosition(new THREE.Vector3()),
);
// Or fixed-position continuous dust:
const stationary = fx.emit("dustTrail", position);
trail.stop();
stationary.stop();

// Once per animation frame:
fx.update(dt);
```

Effects: **dust** (expanding soft translucent grey-white billboards), **sparks** (short bright ballistic particles), **ring** (expanding horizontal impact ring), **dustTrail** (continuous dust emitter), **confetti** (coloured burst), **error/success** (red/green expanding pulses). Supply any world position; effects do not require a bot. Rings/pulses are horizontal, so use the target's floor/base height. Options are `count` and `scale` for bursts; trails accept `scale`. All particles expire; a particle cap bounds memory. Trails require explicit `stop()` when started independently. Action-owned trails stop automatically on action completion/cancellation.

Automatic triggers: build strikes → construction cloud/dust/sparks/ring; place release → dust/ring; celebrate takeoff → confetti; celebrate landing → dust/ring; sweep → trail. Shared effects update independently from bots.

## Worked example: two bots, one sequence

Keep this orchestration in your application:

```js
const nour = createBot(BOT_PRESETS.nour, { effects });
const priya = createBot(BOT_PRESETS.priya, { effects });
scene.add(nour.root, priya.root);
nour.root.position.set(-2, 0, 0);
priya.root.position.set(0, 0, 0);

const parcel = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.3, 0.3),
  new THREE.MeshStandardMaterial({ color: "#8dac64" }),
);
parcel.position.set(0, 0.15, 0.62);
scene.add(parcel);

// Both bots must be updated every frame, alongside effects.update(dt).
const sequence = new AbortController();
const options = { signal: sequence.signal };
const completed = (r) => r.status === "completed";

async function run() {
  priya.setExpression("focused");
  const initial = await Promise.all([
    nour.play("present", { ...options, target: { x: 0, y: 1, z: 0.62 } }),
    priya.pickUp(parcel, options),
  ]);
  if (!initial.every(completed)) return;

  const moved = await Promise.all([
    nour.walkTo(-2, -1, options),
    priya.walkTo(2, 0, options), // automatically slower with parcel
  ]);
  if (!moved.every(completed)) return;
  if (!completed(await priya.turnTo(0, options))) return;
  if (!completed(await priya.place(2, 0.15, 0.62, options))) return;

  nour.setExpression("happy");
  priya.setExpression("success");
  await Promise.all([
    nour.play("celebrate", options),
    priya.play("celebrate", options),
  ]);
}
run();
// Cancel both bots and prevent later steps:
// sequence.abort();
```

## Cleanup and current boundaries

Call `bot.dispose()` for each bot and `effects.dispose()` for the shared effects system when removing the scene. Disposal cancels pending actions, releases robot geometry/materials/textures and stops effects. An externally owned carried prop is detached back to its original parent; dispose that prop yourself. Stop your renderer's frame loop separately.

The library is a kinematic, flat-floor character system, not a navigation or physics engine. Collision avoidance, scene-object interaction policies, application choreography, object destruction, and actual work outcomes belong in your application. The root parent should remain untransformed. The five-preset test page is a development harness, not the final application.

## Cartoon and motion refinement

Heads are larger relative to compact bodies, limbs are shorter and chunkier, and face panels are genuinely rounded with a visible body-colour border. Configure `screen.width` and `screen.height` as fractions of head dimensions, `screen.radius` in world units, and `screen.offsetY`. `strideScale` adjusts stride length and gait phase together to preserve planted-foot travel with shorter legs. Defaults are about 55–70% faster than the initial studio; per-call `speed` still overrides them.

`setExpression('angry')` instantly changes the face to red, with slanted eyebrows, narrowed eyes and a frown. It remains independent of actions. `react` now nods. `build` winds the tool above the head, snaps down with body weight, then recovers. Every permanent tool remains attached; the axe-like action does not swap tools.

`effects.emit('construction', worldPosition, {scale:1.4})` creates a larger, denser cloud with sparks and a ring, independently of any bot. Existing `dust` is also larger and more visible. The demo's **Place a construction cloud** button lets you click in the 3D viewport to trigger it anywhere on the floor.

For your own UI, use `effects.emitAtScreen('construction', {x,y}, camera, {planeY:0, scale:1.4})`. Coordinates are normalized to the renderer viewport: x from -1 (left) to +1 (right), y from +1 (top) to -1 (bottom). The method projects onto the specified horizontal plane and returns the world position, or null when the ray doesn't intersect it. This gives screen-positioned effects that remain in the 3D scene; it is not a DOM overlay. Ordinary `emit` also accepts any world height, such as the top of a structure.

## Soft-shell redesign

The five regular head silhouettes remain. Limbs now use rigid, overlapping sleeve shells with hidden pivot seams, rounded mittens and oval feet. The head overlaps the torso to enclose the neck pivot. Matte diffuse shading gives a simple graphic finish without a pixel filter. Shoulder/elbow and hip/knee pivots still exist internally, so the public action API and permanent hand tools are unchanged.

Vests are thin curved surfaces fitted to the actual rounded torso, with a front opening and two continuous reflective bands. They are torso children and do not bridge into moving arms.

Leg lengths, hip height and stride length were adjusted together. `config.reach` exposes `approach`, `carryForward`, `carryHeight`, and `strikeForward`. Use `bot.config.reach.approach` when planning an approach to a floor object (instead of assuming the original 0.62-unit spacing). Pickup/place include a forward and sideways weight shift and a deeper bend; the leg solver keeps feet planted while the free hand reaches the prop. The test suite checks pre-grasp hand contact and grounded ankles across all five presets, not merely attachment at the end of an animation.

## Speech bubbles and clickable replies

Dialogue state is part of the bot; HTML display is an **optional separate adapter**. Bot motion and expressions remain independent. Mount one layer in the same element that contains your renderer's canvas:

```js
import { SpeechBubbles } from "./bots/index.js";
const bubbles = new SpeechBubbles({ container: rendererContainer, camera });
const untrack = bubbles.track(priya);
bubbles.track(nour);

// After updating the bots and camera each frame:
bubbles.update();

priya.say("I am checking your work.", { duration: 5 });
const choice = await priya.ask("What next?", [
  { id: "results", label: "View results" },
  { id: "retry", label: "Run again" },
  { id: "later", label: "Not now" },
]);
if (choice === "retry") {
  // Your application owns the meaning of this choice.
  priya.say("Checking again…", { duration: 4 });
  await priya.play("inspect");
}
```

`bot.say(text, options)` returns the bot. `bot.ask(text, choices, options)` returns a Promise of the **choice ID string**, or **null** if dismissed, replaced, aborted, timed out, or disposed. Choice IDs must be unique non-empty strings; labels and messages are non-empty plain text. Markup is not interpreted. One active bubble per bot; different bots can speak simultaneously. Calling `say` or `ask` replaces that bot's previous message/question. Duplicate or stale clicks cannot answer a newer question.

Options: `duration` in seconds (default 0: stays until dismissed), `signal` (AbortSignal), and `focus:true` to focus the first choice when shown. Focus is opt-in so unsolicited dialogue does not interrupt typing elsewhere. Bubbles have real keyboard-accessible buttons; Escape while focused inside a bubble dismisses it. The close button also dismisses it. `bot.dismissSpeech()` closes a message without interrupting movement. `bot.cancel()` cancels motion without dismissing speech. `bot.update(dt)` advances dialogue timeouts.

The adapter anchors bubbles above each head, follows movement/turns, clamps cards within the renderer viewport, and hides offscreen cards. It owns its scoped styles. Long content scrolls within the card. Use a container matching the canvas bounds and one adapter per viewport. Multiple bubbles may overlap if bots crowd together; your application can decide which characters should speak at once. World-object occlusion is not simulated; this is an HTML overlay.

`untrack()` removes a bot's card and dismisses pending dialogue. `bubbles.dispose()` removes the layer, unsubscribes and dismisses tracked questions. `bot.dispose()` also resolves any pending question with null. The renderer-free `BotDialogue` class is exported separately for alternate UI adapters.

In the studio, select a bot, enter a message under **Talk to the user**, then choose **Say message** or **Ask with choices**. The selected choice ID appears in the event log and status text; Build/Inspect choices trigger those actions in the demo application layer. No conversation-specific decisions live in the bot module.

## Visitor-session backend (Fursa Tek)

A local SQLite API now saves visitor sessions, completed features and sample bookings. Reset archives the outgoing session instead of deleting it. Start the backend and Vite together with `npm run dev -- --port 5173 --strictPort` (Node 24 recommended), then open **http://127.0.0.1:5173/session.html** to verify persistence and reset. The bot studio remains at `/`.

The full product and scripted scenes have not yet been connected. See [server/README.md](server/README.md) for API contracts, data location, backup, sample credit calculations and integration boundaries.

## Working product (20 September)

Open **http://127.0.0.1:5173/product.html** for the connected React product. It includes demo login, Dashboard, single/multi-leg booking, saved traveller drafts, service selection, corporate discount/credit confirmation, searchable bookings, details and live session Financials. Reset archives the visitor before returning to login. See [src/product/README.md](src/product/README.md) for supported flows and the controller interface for future bot scenes.


## Windows offline booth package

Download `releases/Global-Concierge-Windows-x64.zip`, extract the entire folder,
and run **Start Global Concierge.cmd**. Use **Stop Global Concierge.cmd** when
finished. The included README covers the laptop rehearsal and troubleshooting.
The package includes Node 22.23.2 for Windows x64, the compiled application and
the local SQLite backend. No visitor database is committed or included in the ZIP.
Company device restrictions still require testing on the target Windows laptop.

Packaging source and rebuild instructions are in `packaging/README.md`.
