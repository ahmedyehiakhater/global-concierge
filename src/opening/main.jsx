import { demolish } from "./demolition.js";
import { runFinancials } from "./financials.js";
import { Management } from "../product/Management.jsx";
import { ManagementController } from "../product/managementController.js";
import { runManagement } from "./management.js";
import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  LOGIN_PIECES,
  SHELL_PIECES,
  SAMPLE_PIECE,
  pieceElements,
  regionRect,
} from "./pieces.js";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import {
  createBot,
  BOT_PRESETS,
  SpeechBubbles,
  BotEffects,
} from "../bots/index.js";
import { createArtifactViewer } from "../artifacts/viewer.jsx";
import { createArtifactProp } from "../artifacts/props.js";
import { OWNERS } from "../artifacts/catalog.js";
import { Login, Dashboard, Financials } from "../product/pages.jsx";
import { Shell, Card, logo } from "../product/ui.jsx";
import { sessionApi } from "../api/client.js";
import { ArtifactProduction } from "../artifacts/production.js";
import { DeliveryTimer } from "./delivery.js";
import { ReviewQueue } from "./staging.js";
import { BriefHandoff } from "./handoff.js";
import { SceneClock } from "./clock.js";
import { runDashboard } from "./dashboard.js";
import { runBooking } from "./booking.js";
import { BookingFlow } from "./bookingFlow.js";
import { BookingWizard } from "../product/BookingWizard.jsx";
import { BookingConfirmation } from "../product/BookingConfirmation.jsx";
import "../product/product.css";
import "./style.css";
const host = document.querySelector("#opening-stage"),
  ui = createRoot(document.querySelector("#opening-ui"));
let state = {
    financialNav: false,
    financialComplete: false,
    axisFault: false,
    financialChange: "",
    manageQuery: "",
    manageNav: false,
    manageComplete: false,
    manage: null,
    managePreview: false,
    unsafeCancel: false,
    statusFault: false,
    statusComparison: false,
    bookingNav: false,
    bookingDraft: null,
    bookingBusy: false,
    bookingError: "",
    bookingDetail: null,
    bookingStage: false,
    bookingComplete: false,
    missingTotals: false,
    missingTicks: false,
    bookingView: "journey",
    feature: "gate",
    built: [],
    page: "empty",
    dashboard: false,
    dashboardNav: false,
    dashboardComplete: false,
    missingEmpty: false,
    qaPreview: false,
    previewFinished: false,
    alignmentIssue: false,
    timer: false,
    work: null,
    jobs: {},
    phase: "",
    login: false,
    shell: false,
    header: false,
    rail: false,
    board: false,
    brief: false,
    sample: false,
    entered: false,
    ready: false,
    resetting: false,
    empty: false,
    error: "",
    checks: 0,
    chosen: "",
    cleared: [],
  },
  paused = false,
  disposed = false,
  controller = new AbortController(),
  session,
  resetKey = null,
  resetPromise = null;
const scene = new THREE.Scene(),
  camera = new THREE.OrthographicCamera(-8, 8, 5, -5, 0.1, 200),
  clock = new SceneClock();
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
host.append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0xaebbb9, 2.8));
const light = new THREE.DirectionalLight(0xfff4df, 3);
light.position.set(-4, 8, 5);
scene.add(light);
const effects = new BotEffects(scene),
  bots = Object.fromEntries(
    OWNERS.map((o) => {
      const b = createBot(BOT_PRESETS[o.id], { effects });
      b.root.visible = false;
      scene.add(b.root);
      return [o.id, b];
    }),
  );
const bubbles = new SpeechBubbles({ container: host, camera });
Object.values(bots).forEach((b) => bubbles.track(b));
const production = new ArtifactProduction(),
  delivery = new DeliveryTimer(100);
let workTarget = null;
const bookingFlow = new BookingFlow(
  sessionApi,
  sessionStorage,
  (values, nextSession) => {
    if (nextSession) session = nextSession;
    patch(values);
  },
);
const management = new ManagementController(
  sessionApi,
  sessionStorage,
  (values) => patch({ manage: values }),
);
management.onSession = (value) => {
  const difference = value.credit.available - session.credit.available;
  session = value;
  patch({
    financialChange: difference
      ? `${difference > 0 ? "Credit returned" : "Additional credit charged"}: AED ${(Math.abs(difference) / 100).toFixed(2)}. Financials now reflects this change.`
      : "",
  });
  if (difference && state.financialNav && !sceneRunning)
    bots.nour.say(
      "The credit changed with it. You can review the movement in Financials.",
    );
};
function openManagement(booking, query = "") {
  if (!state.manageNav && !state.built.includes("bookings")) return;
  management.begin(session);
  if (booking && !management.pending) management.open(booking);
  patch({
    page: "bookings",
    shell: true,
    login: false,
    entered: true,
    manageQuery: query,
  });
  document.querySelector(".build-area")?.scrollTo({ top: 0 });
}
let bookingTask = Promise.resolve(),
  retryBooking = null;
function queueBooking(fn) {
  retryBooking = fn;
  bookingTask = fn();
  bookingTask.catch(() => {});
}
async function awaitBooking(signal) {
  for (;;) {
    assertLive(signal);
    const task = bookingTask;
    try {
      await task;
      assertLive(signal);
      return;
    } catch (e) {
      if (e.name === "AbortError") throw e;
      delivery.hold = true;
      try {
        while (bookingTask === task) {
          await clock.wait(0.1, signal);
        }
      } finally {
        delivery.hold = false;
      }
    }
  }
}
function startBooking(fresh = true) {
  if (!state.bookingNav && !state.built.includes("booking")) return;
  if (!sceneRunning) bookingFlow.begin(session, false, fresh);
  patch({ page: "booking", login: false, shell: true, entered: true });
  document.querySelector(".build-area")?.scrollTo({ top: 0 });
}
function navigate(page, query = "") {
  if (page === "booking") return startBooking();
  if (page === "bookings") return openManagement(null, query);
  if (!(
    (page === "dashboard" && state.dashboardNav) ||
    (page === "financials" && state.financialNav)
  ))
    return;
  const go = () => {
    patch({ page });
    document.querySelector(".build-area")?.scrollTo({ top: 0 });
  };
  if (!sceneRunning && state.page === "booking" && state.bookingDraft) {
    queueBooking(() => bookingFlow.save(state.bookingDraft).then(go));
  } else go();
}
const viewer = createArtifactViewer({
  production,
  onOpen: () => {
    paused = true;
  },
  onClose: () => {
    paused = false;
  },
  onReset: () => resetScene(),
});
const offsets = new Map();
let brief = createArtifactProp("gate-nour");
brief.visible = false;
scene.add(brief);
const handoff = new BriefHandoff(bots, brief);
const progressMaterial = new THREE.MeshBasicMaterial({ color: 0x78be21 });
const progress = new THREE.Mesh(
  new THREE.PlaneGeometry(0.19, 0.045),
  progressMaterial,
);
const torso = bots.sami.config.torso;
progress.position.set(0, torso.height * 0.58, torso.depth / 2 + 0.043);
bots.sami.rig.torso.add(progress);
function patch(v) {
  state = { ...state, ...v };
  render();
}
function UI() {
  return (
    <>
      <img className="opening-logo" src={logo} alt="dnata" />
      <div className="opening-controls">
        <button disabled={state.resetting} onClick={() => resetScene()}>
          {state.resetting
            ? "Clearing…"
            : state.error
              ? "Retry reset"
              : "Reset scene"}
        </button>
      </div>
      {state.error && (
        <div className="opening-error" role="alert">
          {state.error}
          <button onClick={() => resetScene()}>Retry reset</button>
        </div>
      )}
      {state.brief && !state.cleared.includes("brief") && (
        <button
          className="brief-peek document-dock"
          onClick={() => viewer.open("nour", `${state.feature}-nour`)}
        >
          <span className="document-icon">PRD</span>
          <span>
            <small>NOUR · PRODUCT BRIEF</small>
            <b>
              {state.feature === "financials"
                ? "Financials & Insights"
                : state.feature === "bookings"
                  ? "Bookings & Manage"
                  : state.feature === "dashboard"
                    ? "Dashboard"
                    : state.feature === "booking"
                      ? "New Booking"
                      : "Login & workspace"}
            </b>
            <span>Read the brief ↗</span>
          </span>
        </button>
      )}
      {state.board && !state.cleared.includes("board") && (
        <DesignBoard
          dock={
            state.work && state.work.x + state.work.w < innerWidth / 2
              ? "right"
              : "left"
          }
          view={
            state.feature === "financials"
              ? session.bookings.length
                ? "financials-populated"
                : "financials-empty"
              : state.feature === "bookings"
                ? `manage-${state.manage?.view || "list"}`
                : state.feature === "booking"
                  ? `booking-${state.bookingView}`
                  : state.feature === "dashboard"
                    ? "dashboard"
                    : state.entered
                      ? "shell"
                      : "login"
          }
          onOpen={() => viewer.open("ellie", `${state.feature}-ellie`)}
        />
      )}
      <div
        className={
          "build-area " +
          (state.ready ? "live " : "") +
          (state.resetting ? "cleaning" : "")
        }
      >
        {state.login &&
          !state.entered &&
          !state.cleared.includes("content") && (
            <div
              className={
                "opening-login " +
                (state.ready || state.feature !== "gate" ? "trial " : "") +
                (!state.sample ? "without-sample" : "")
              }
            >
              <Login
                busy={false}
                onEnter={() =>
                  patch({
                    entered: true,
                    login: false,
                    ...(state.ready ? { shell: true } : {}),
                  })
                }
              />
            </div>
          )}
        {state.shell && (
          <div
            className={
              "opening-shell " +
              (state.ready || state.feature !== "gate" ? "trial " : "") +
              (!state.header || state.cleared.includes("header")
                ? "no-header"
                : "") +
              " " +
              (!state.rail || state.cleared.includes("rail") ? "no-rail" : "")
            }
          >
            <Shell
              page={state.page}
              availableFeatures={[
                ...state.built,
                ...(state.dashboardNav ? ["dashboard"] : []),
                ...(state.bookingNav ? ["booking"] : []),
                ...(state.manageNav ? ["bookings"] : []),
                ...(state.financialNav ? ["financials"] : []),
              ]}
              busy={state.feature === "gate" && !state.ready}
              onNavigate={navigate}
              onNew={() => startBooking()}
              onReset={() => resetScene()}
            >
              {!state.cleared.includes("content") &&
              state.page === "financials" ? (
                <div
                  className={
                    "financial-stage " +
                    (state.financialComplete ? "complete" : "staged")
                  }
                >
                  <Financials
                    session={session}
                    axisFault={state.axisFault}
                    onOpen={openManagement}
                    availableFeatures={state.built}
                  />
                </div>
              ) : !state.cleared.includes("content") &&
                state.page === "bookings" &&
                state.manage ? (
                <div
                  className={
                    "manage-stage " + (state.manageComplete ? "" : "staged")
                  }
                  key={state.manage.view}
                >
                  <Management
                    controller={management}
                    state={state.manage}
                    session={session}
                    canBook={state.built.includes("booking")}
                    onNew={() => startBooking()}
                    preview={state.managePreview}
                    unsafeCancel={state.unsafeCancel}
                    statusFault={state.statusFault}
                    initialQuery={state.manageQuery || ""}
                    onFinancials={
                      state.financialNav
                        ? () => navigate("financials")
                        : undefined
                    }
                    creditNotice={
                      state.financialNav ? state.financialChange : ""
                    }
                    statusComparison={state.statusComparison}
                  />
                </div>
              ) : !state.cleared.includes("content") &&
                state.page === "booking" &&
                state.bookingDraft ? (
                <div
                  className={
                    "booking-stage " +
                    (state.bookingStage && !state.bookingComplete
                      ? "staged "
                      : "") +
                    (state.missingTotals ? "hide-totals" : "")
                  }
                >
                  {state.bookingError && (
                    <div className="booking-error" role="alert">
                      {state.bookingError}
                      <button
                        disabled={state.bookingBusy}
                        onClick={() => queueBooking(retryBooking)}
                      >
                        Retry save safely
                      </button>
                    </div>
                  )}
                  <BookingWizard
                    draft={state.bookingDraft}
                    session={session}
                    busy={state.bookingBusy}
                    sampleData={
                      sceneRunning && state.feature === "booking"
                        ? bookingFlow.seed
                        : undefined
                    }
                    showCompleted={!state.missingTicks}
                    onChange={(draft) => bookingFlow.change(draft)}
                    onSave={(draft) =>
                      queueBooking(() => bookingFlow.save(draft))
                    }
                    onConfirm={() => queueBooking(() => bookingFlow.confirm())}
                  />
                </div>
              ) : !state.cleared.includes("content") &&
                state.page === "confirmation" ? (
                <div
                  className={
                    "booking-confirmation " +
                    (state.bookingComplete ? "" : "staged")
                  }
                >
                  <BookingConfirmation
                    booking={state.bookingDetail}
                    onNew={() => startBooking()}
                    onBookings={
                      state.manageNav
                        ? () => openManagement(state.bookingDetail)
                        : undefined
                    }
                    onDashboard={
                      state.dashboardNav
                        ? () => navigate("dashboard")
                        : undefined
                    }
                  />
                </div>
              ) : !state.cleared.includes("content") && state.dashboard ? (
                <div
                  className={
                    "dashboard-stage " +
                    (state.dashboardComplete ? "complete " : "") +
                    (state.missingEmpty ? "missing-empty " : "") +
                    (state.qaPreview ? "qa-preview " : "") +
                    (state.alignmentIssue ? "alignment-issue " : "")
                  }
                >
                  <Dashboard
                    session={session}
                    availableFeatures={[
                      ...state.built,
                      ...(state.manageNav ? ["bookings"] : []),
                      ...(state.financialNav ? ["financials"] : []),
                    ]}
                    onNew={() => startBooking(false)}
                    onOpen={openManagement}
                    onBookings={() => openManagement()}
                    servicesBookings={
                      state.previewFinished ? session.bookings : []
                    }
                  />
                </div>
              ) : (
                !state.cleared.includes("content") && (
                  <Card className="empty">
                    <h1>Nothing here yet</h1>
                    <p>Your workspace is ready. Choose a feature to build.</p>
                    {state.ready && (
                      <button
                        className="button secondary"
                        onClick={() =>
                          patch({ login: true, shell: false, entered: false })
                        }
                      >
                        Back to sign-in
                      </button>
                    )}
                  </Card>
                )
              )}
            </Shell>
          </div>
        )}
      </div>
      {state.phase === "Review" && (
        <div className="review-checks" role="status">
          {(state.feature !== "gate"
            ? ["Design approved", "Checks passed", "Product accepted"]
            : ["Demo access works", "Consistent shell", "Built features only"]
          ).map((c, i) => (
            <span key={c}>
              {state.checks > i ? "✓" : "○"} {c}
            </span>
          ))}
        </div>
      )}
      {state.timer &&
        !state.resetting &&
        createPortal(
          <div
            id="delivery-timer"
            className="delivery-timer"
            aria-label="Sami release countdown"
          >
            <small>SAMI · DELIVERY</small>
            <b>Preparing release…</b>
          </div>,
          host,
        )}
      {state.work && (
        <div
          className="work-outline"
          style={{
            left: state.work.x,
            top: state.work.y,
            width: state.work.w,
            height: state.work.h,
          }}
        >
          <span>{state.work.label}</span>
        </div>
      )}
      {state.ready && (
        <button
          className="feature-keyboard"
          onClick={() => featureMenu(controller.signal)}
        >
          Choose next feature with Nour
        </button>
      )}
      <nav
        className="opening-team"
        aria-label="Development lifecycle and team artefacts"
      >
        {state.phase === "Review" && (
          <span className="team-review">Joint review · all five roles</span>
        )}
        {OWNERS.filter((o) => bots[o.id].root.visible).map((o) => (
          <button
            key={o.id}
            aria-current={
              state.jobs[o.id] ||
              state.phase === "Review" ||
              {
                nour: "Requirements",
                ellie: "Design",
                omar: "Build",
                priya: "Test",
                sami: "Deliver",
              }[o.id] === state.phase
                ? "step"
                : undefined
            }
            onClick={() => viewer.open(o.id)}
          >
            <span>
              {
                {
                  nour: "Requirements",
                  ellie: "Design",
                  omar: "Build",
                  priya: "Test",
                  sami: "Deliver",
                }[o.id]
              }
            </span>
            <b>{o.name}</b>
            <small>{o.role}</small>
            <em>{state.jobs[o.id] || ""}</em>
          </button>
        ))}
      </nav>
      {state.empty && !state.error && (
        <button className="opening-start" onClick={() => start()}>
          Build with the team →
        </button>
      )}
    </>
  );
}
function DesignBoard({ view, onOpen }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current,
      frame = el.querySelector("iframe");
    const resize = () => {
      frame.style.width = `${innerWidth}px`;
      frame.style.height = `${innerHeight - footerHeight()}px`;
      const ratio = el.clientWidth / innerWidth;
      frame.style.transform = `scale(${ratio})`;
      el.style.height = `${(innerHeight - footerHeight()) * ratio}px`;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    return () => ro.disconnect();
  }, []);
  return createPortal(
    <button
      className="opening-board document-dock"
      onClick={onOpen}
      aria-label="Open Ellie's design and decisions"
    >
      <span className="board-preview" ref={ref}>
        <iframe
          title="Actual design reference"
          src={`/design-preview.html?view=${view}`}
          tabIndex={-1}
        />
      </span>
      <span>
        <small>ELLIE · DESIGN</small>
        <b>
          {view === "login"
            ? "Sign-in"
            : view === "dashboard"
              ? "Dashboard"
              : view.startsWith("financials-")
                ? "Financials & Insights"
                : view.startsWith("manage-")
                  ? "Bookings & Manage"
                  : view.startsWith("booking-")
                    ? "New Booking · " + view.slice(8)
                    : "Workspace"}
        </b>
        <span>View design ↗</span>
      </span>
    </button>,
    document.body,
  );
}
function render() {
  ui.render(<UI />);
}
function resize() {
  const w = innerWidth,
    h = innerHeight,
    ppu = Math.min(43, h / 16),
    halfH = h / ppu / 2;
  Object.assign(camera, {
    left: -w / ppu / 2,
    right: w / ppu / 2,
    top: halfH,
    bottom: -halfH,
  });
  const y = (h * 0.32) / ppu / Math.cos(0.38);
  camera.position.set(0, y + Math.sin(0.38) * 30, Math.cos(0.38) * 30);
  camera.lookAt(0, y, 0);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener("resize", resize);
resize();
function screenPoint(x, y) {
  camera.updateMatrixWorld();
  const ray = new THREE.Raycaster();
  ray.setFromCamera(
    new THREE.Vector2((x / innerWidth) * 2 - 1, 1 - (y / innerHeight) * 2),
    camera,
  );
  return ray.ray.intersectPlane(
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    new THREE.Vector3(),
  );
}
function footerHeight() {
  return 86;
}
function mark(index) {
  return screenPoint(
    innerWidth * (0.14 + index * 0.18),
    innerHeight - footerHeight() - 28,
  );
}
function projected(p) {
  const q = p.clone().project(camera);
  return { x: ((q.x + 1) * innerWidth) / 2, y: ((1 - q.y) * innerHeight) / 2 };
}
const reservations = new Map(),
  travel = new Map();
function job(id, label) {
  patch({ jobs: { ...state.jobs, [id]: label } });
}
function stageBounds() {
  return {
    left: 52,
    right: innerWidth - 52,
    top: 125,
    bottom: innerHeight - footerHeight() - 18,
  };
}

function assertLive(signal) {
  if (signal.aborted) throw new DOMException("Interrupted", "AbortError");
}
async function act(id, name, signal, options = {}) {
  assertLive(signal);
  await bots[id].play(name, { loop: false, ...options, signal });
  assertLive(signal);
}
async function walk(id, p, signal, facing = null) {
  assertLive(signal);
  const b = bots[id],
    bounds = stageBounds();
  let end = projected(p),
    start = projected(b.root.position);
  const leaving = end.x < 0 || end.x > innerWidth;
  const occupied = OWNERS.filter((o) => o.id !== id && bots[o.id].root.visible)
    .map((o) => reservations.get(o.id) || projected(bots[o.id].root.position))
    .filter((q) => q.x > 0 && q.x < innerWidth);
  if (!leaving) {
    end.x = THREE.MathUtils.clamp(end.x, bounds.left, bounds.right);
    end.y = THREE.MathUtils.clamp(end.y, bounds.top, bounds.bottom);
    // One small adjustment at the destination, not an obstacle course around the cast.
    const free = (q) =>
      occupied.every(
        (o) => Math.abs(q.x - o.x) > 55 || Math.abs(q.y - o.y) > 78,
      );
    if (!free(end)) {
      for (const dx of [64, -64, 96, -96]) {
        const q = {
          x: THREE.MathUtils.clamp(end.x + dx, bounds.left, bounds.right),
          y: end.y,
        };
        if (free(q)) {
          end = q;
          break;
        }
      }
    }
  }
  reservations.set(id, end);
  try {
    const points = [],
      dx = end.x - start.x,
      dy = end.y - start.y,
      len = dx * dx + dy * dy;
    const blocker = occupied.find((o) => {
      const t = ((o.x - start.x) * dx + (o.y - start.y) * dy) / (len || 1);
      return (
        t > 0.2 &&
        t < 0.8 &&
        Math.hypot(start.x + t * dx - o.x, start.y + t * dy - o.y) < 30
      );
    });
    if (blocker) {
      const q = {
        x: THREE.MathUtils.clamp(
          blocker.x - (dy / Math.sqrt(len)) * 48,
          bounds.left,
          bounds.right,
        ),
        y: THREE.MathUtils.clamp(
          blocker.y + (dx / Math.sqrt(len)) * 48,
          bounds.top,
          bounds.bottom,
        ),
      };
      points.push(q);
    }
    points.push(end);
    for (const point of points) {
      const dest = screenPoint(point.x, point.y),
        dist = b.root.position.distanceTo(dest);
      const moving = b.walkTo(dest.x, dest.z, {
        speed: Math.max(3.8, dist / 0.65),
        signal,
      });
      for (const step of [b.motion.step, ...b.motion.queue].filter(Boolean)) {
        if (step.kind === "anticipate") step.duration = 0.13;
        if (step.kind === "settle") step.duration = 0.16;
        if (step.kind === "turn") step.duration = 0.16;
      }
      await moving;
      assertLive(signal);
    }
    await b.turnTo(
      facing === null
        ? 0
        : Math.atan2(
            facing.x - b.root.position.x,
            facing.z - b.root.position.z,
          ),
      { signal, duration: 0.16 },
    );
    assertLive(signal);
  } finally {
    if (reservations.get(id) === end) reservations.delete(id);
  }
}
let speechTail = Promise.resolve();
function say(id, text, signal, seconds = 1.8) {
  const task = speechTail.then(() => deliverSpeech(id, text, signal, seconds));
  speechTail = task.catch(() => {});
  return task;
}
async function deliverSpeech(id, text, signal, seconds) {
  assertLive(signal);
  Object.values(bots).forEach((b) => b.dismissSpeech());
  bots[id].setExpression("talking");
  bots[id].say(text);
  await clock.wait(seconds, signal);
  bots[id].dismissSpeech();
  bots[id].setExpression(state.ready ? "happy" : "focused");
}
async function enter(id, index, signal) {
  const dest = id !== "nour" || state.phase ? workMark(id) : mark(index),
    b = bots[id];
  b.root.visible = true;
  b.motion.reset(
    screenPoint(index < 2 ? -150 : innerWidth + 150, innerHeight * 0.82),
  );
  render();
  await walk(id, dest, signal);
}
async function jumpPress(id, element, signal) {
  assertLive(signal);
  if (!element || element.disabled)
    throw new Error("The next control is not ready. Please reset and retry.");
  element.scrollIntoView({ block: "nearest" });
  const r = element.getBoundingClientRect(),
    to = screenPoint(r.left + r.width / 2, r.top + r.height / 2),
    b = bots[id];
  await walk(id, new THREE.Vector3(to.x - 1, to.y, to.z + 0.5), signal);
  const from = b.root.position.clone();
  b.cancel();
  await clock.tween(
    0.75,
    (u) => {
      const t = u * u * (3 - 2 * u);
      b.root.position.x = THREE.MathUtils.lerp(from.x, to.x, t);
      b.root.position.z = THREE.MathUtils.lerp(from.z, to.z, t);
      offsets.set(id, Math.sin(Math.PI * u) * 1.7);
    },
    signal,
  );
  offsets.delete(id);
  assertLive(signal);
  if (!element.isConnected || element.disabled)
    throw new Error("The control moved out of the scene. Please reset.");
  element.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(.95)" },
      { transform: "scale(1)" },
    ],
    { duration: 200 },
  );
  element.click();
  effects.emit("ring", b.root.position);
  await clock.wait(0.25, signal);
  await walk(
    id,
    screenPoint(
      Math.min(innerWidth - 45, r.right + 65),
      Math.min(innerHeight - 120, r.bottom + 95),
    ),
    signal,
    to,
  );
}
let selectingFeature = false,
  sceneRunning = false;
async function typeBookingField(label, value, signal) {
  const field = [...document.querySelectorAll(".booking-stage .field")].find(
    (el) => el.textContent.includes(label),
  );
  const input = field?.querySelector("input,select");
  if (!input) throw Error(`Missing field: ${label}`);
  field.dataset.qaField = "active";
  field.scrollIntoView({ block: "center", behavior: "instant" });
  try {
    await inspectModule("priya", '[data-qa-field="active"]', label, signal);
    input.focus({ preventScroll: true });
    const select = input.tagName === "SELECT";
    const setter = Object.getOwnPropertyDescriptor(
      select ? HTMLSelectElement.prototype : HTMLInputElement.prototype,
      "value",
    ).set;
    const write = (text) => {
      assertLive(signal);
      setter.call(input, text);
      input.dispatchEvent(
        new Event(select ? "change" : "input", { bubbles: true }),
      );
    };
    // Drive the real React field incrementally, leaving the result on screen.
    const typing = act("priya", "type", signal, {
      duration: Math.max(0.6, (input.value.length + value.length) * 0.07),
    });
    if (select) write(value);
    else {
      for (let text = input.value; text.length;) {
        text = text.slice(0, -1);
        write(text);
        await clock.wait(0.045, signal);
      }
      for (let i = 1; i <= value.length; i++) {
        write(value.slice(0, i));
        await clock.wait(0.075, signal);
      }
    }
    await typing;
    field.dataset.qaResult = input.validity.valid
      ? "Priya: corrected value entered"
      : input.validity.valueMissing
        ? "Priya: required value missing — Continue is disabled"
        : "Priya: invalid email — Continue is disabled";
    await clock.wait(input.validity.valid ? 1.3 : 3, signal);
  } finally {
    delete field.dataset.qaField;
    delete field.dataset.qaResult;
    input.blur();
  }
}
async function featureMenu(signal) {
  if (!state.ready || state.resetting || selectingFeature || sceneRunning)
    return;
  selectingFeature = true;
  try {
    const answer = await bots.nour.ask(
      ["dashboard", "booking", "bookings", "financials"].every((id) =>
        state.built.includes(id),
      )
        ? "Everything is shipped—explore the application or reset for another build."
        : "What should we build next?",
      [
        {
          id: "dashboard",
          disabled: state.built.includes("dashboard"),
          label: state.built.includes("dashboard")
            ? "✓ Dashboard · Shipped"
            : "Build Dashboard",
        },
        {
          id: "booking",
          disabled: state.built.includes("booking"),
          label: state.built.includes("booking")
            ? "✓ New Booking · Shipped"
            : "Build New Booking",
        },
        {
          id: "bookings",
          disabled: state.built.includes("bookings"),
          label: state.built.includes("bookings")
            ? "✓ Bookings & Manage · Shipped"
            : "Build Bookings & Manage",
        },
        {
          id: "financials",
          disabled: state.built.includes("financials"),
          label: state.built.includes("financials")
            ? "✓ Financials & Insights · Shipped"
            : "Build Financials & Insights",
        },
      ],
      { signal, focus: true },
    );
    if (!answer || signal.aborted) return;
    if (!["dashboard", "booking", "bookings", "financials"].includes(answer)) {
      bots.nour.say(
        "That scene is coming next. Choose Dashboard or New Booking for now.",
      );
      return;
    }
    if (state.built.includes(answer)) {
      if (answer === "financials") {
        navigate("financials");
        bots.nour.say(
          "Your current credit and transaction history are ready to explore.",
        );
        return;
      }
      if (answer === "bookings") {
        openManagement();
        bots.nour.say("Your bookings workspace is ready.");
        return;
      }
      if (answer === "booking") {
        startBooking();
        bots.nour.say("Your booking form is ready. Plan another journey.");
        return;
      }
      patch({ login: false, entered: true, shell: true, page: "dashboard" });
      bots.nour.say("Already built. Your dashboard is ready to explore.");
      return;
    }
    if (state.page === "booking" && !bookingFlow.rehearsal)
      await bookingFlow.save(state.bookingDraft);
    sceneRunning = true;
    await (
      answer === "financials"
        ? runFinancials
        : answer === "bookings"
          ? runManagement
          : answer === "booking"
            ? runBooking
            : runDashboard
    )(
      {
        patch,
        say,
        act,
        walk,
        clock,
        production,
        delivery,
        bots,
        buildPiece,
        inspectModule,
        passBrief,
        disperse,
        jumpPress,
        assertLive,
        mark,
        owners: OWNERS,
        job,
        quietConversation,
        setBrief,
        clearBrief: () => handoff.clear(scene),
        management,
        navigate,
        openManagement,
        beginBooking: () => bookingFlow.begin(session, true),
        getBooking: () => bookingFlow,
        awaitBooking,
        prepareFreshBooking: () => bookingFlow.begin(session, false, true),
        typeField: typeBookingField,
        startBooking,
        setConfirmationProp: (booking) =>
          setBrief(
            "booking-sami",
            `GC-${booking.id.slice(0, 8).toUpperCase()}`,
          ),
        getState: () => state,
        getSession: () => session,
        loadSession: async (signal) => {
          const value = await sessionApi.load();
          assertLive(signal);
          session = value;
          return value;
        },
        completeFeature: async (feature, signal) => {
          const value = await sessionApi.completeFeature(feature);
          assertLive(signal);
          session = value;
          return value;
        },
      },
      signal,
    );
  } catch (e) {
    if (e.name !== "AbortError") {
      delivery.hold = true;
      patch({ error: e.message });
    }
  } finally {
    selectingFeature = false;
    sceneRunning = false;
  }
}
function setBrief(id, title) {
  handoff.clear(scene);
  brief.removeFromParent();
  brief.userData.dispose();
  brief = createArtifactProp(id, title);
  brief.visible = false;
  scene.add(brief);
  handoff.prop = brief;
}
let attention = null;
function workPoint(x, y) {
  const b = stageBounds();
  return screenPoint(
    THREE.MathUtils.clamp(x, b.left, b.right),
    THREE.MathUtils.clamp(y, b.top, b.bottom),
  );
}
function workMark(id) {
  const positions = {
    nour: [0.12, 0.48],
    ellie: [0.28, 0.72],
    omar: [0.6, 0.65],
    priya: [0.82, 0.72],
    sami: [0.45, 0.82],
  };
  const [x, y] = positions[id];
  return workPoint(innerWidth * x, (innerHeight - footerHeight()) * y);
}
async function disperse(signal) {
  const target = screenPoint(innerWidth * 0.62, innerHeight * 0.45);
  await Promise.all(
    OWNERS.map((o) => walk(o.id, workMark(o.id), signal, target)),
  );
}
function highlight(r, label) {
  patch({
    work: {
      x: r.left - 3,
      y: r.top - 3,
      w: r.width + 6,
      h: r.height + 6,
      label,
    },
  });
}
async function buildPieces(selector, pieces, signal) {
  for (const piece of pieces) await buildPiece(selector, piece, signal);
}
async function buildPiece(
  selector,
  piece,
  signal,
  index = 0,
  builder = "omar",
) {
  assertLive(signal);
  const root = document.querySelector(selector),
    elements = pieceElements(root, piece);
  if (!elements.length) return;
  let r = regionRect(root, piece);
  const maxY = stageBounds().bottom;
  if (r.bottom > maxY || r.top < 40) {
    elements[0].scrollIntoView({ block: "center", behavior: "instant" });
    await clock.wait(0.06, signal);
    r = regionRect(root, piece);
  }
  const impact = screenPoint(
    Math.min(innerWidth - 52, r.right - 12),
    Math.min(maxY - 8, r.bottom - 6),
  );
  attention = impact;
  workTarget =
    (piece.primary && root.querySelector(piece.primary)) || elements[0];
  highlight(r, `Building · ${piece.label}`);
  job(builder, `Building ${piece.label.toLowerCase()}`);
  patch({
    phase:
      builder === "priya" ? "Test" : builder === "sami" ? "Deliver" : "Build",
  });
  bots[builder].setExpression("focused");
  await walk(builder, workPoint(r.right + 20, r.bottom + 6), signal, impact);
  // Three complete hammer swings drive one clock-owned reveal. Pausing freezes both.
  bots[builder].play("build", {
    loop: true,
    duration: 0.82,
    target: impact,
    signal,
  });
  const building = bots[builder].active;
  const seconds = 2.46 / bots[builder].config.personality.tempo;
  try {
    if (piece.id === "brand") patch({ header: true });
    if (piece.id === "workspace") patch({ rail: true });
    await clock.tween(
      seconds,
      (u) => {
        const reveal = Math.max(0, (u - 0.12) / 0.88);
        for (const el of elements) {
          el.dataset.assembled = "true";
          el.style.opacity = String(0.12 + 0.88 * reveal);
          el.style.filter = `blur(${(1 - reveal) * 5}px)`;
          el.style.clipPath = `inset(0 ${(1 - reveal) * 100}% 0 0)`;
          el.style.translate = `0 ${(1 - reveal) * 5}px`;
        }
      },
      signal,
    );
  } finally {
    if (bots[builder].active === building) bots[builder].cancel();
    if (!signal.aborted)
      for (const el of elements) {
        el.style.removeProperty("opacity");
        el.style.removeProperty("filter");
        el.style.removeProperty("clip-path");
        el.style.removeProperty("translate");
      }
  }
  assertLive(signal);
  bots[builder].setExpression("happy");
  job(builder, "");
  workTarget = null;
  patch({ work: null });
}
async function inspectModule(id, selector, label, signal) {
  assertLive(signal);
  const el = document.querySelector(selector);
  if (!el || !el.getBoundingClientRect().height) return;
  job(id, `Reviewing ${label}`);
  bots[id].setExpression("thinking");
  const r = (
    el.matches(".sidebar") ? el.querySelector("nav") : el
  ).getBoundingClientRect();
  const target = screenPoint(
    r.left + r.width / 2,
    Math.min(stageBounds().bottom, r.top + r.height / 2),
  );
  await walk(
    id,
    workPoint(
      r.left + (id === "ellie" ? r.width * 0.25 : r.width * 0.65),
      Math.min(stageBounds().bottom, r.bottom + 70),
    ),
    signal,
    target,
  );
  await act(id, "inspect", signal, { target, duration: 1.1 });
  assertLive(signal);
  if (
    [...el.querySelectorAll("[data-assembled]")].some(
      (n) => getComputedStyle(n).visibility === "hidden",
    )
  )
    throw Error(`${label} is not visible for review`);
  bots[id].setExpression("happy");
  bots[id].setStatus("tick");
  await clock.wait(0.35, signal);
  bots[id].setStatus(null);
  job(id, "");
}
async function passBrief(signal, from = "nour", to = "ellie") {
  const center = screenPoint(
    innerWidth * 0.45,
    (innerHeight - footerHeight()) * 0.68,
  );
  const n = bots[from],
    e = bots[to];
  handoff.attach(from, "right");
  await Promise.all([
    walk(from, center.clone().add(new THREE.Vector3(-1, 0, 0)), signal),
    walk(to, center.clone().add(new THREE.Vector3(1, 0, 0)), signal),
  ]);
  // Traffic may choose nearby clear marks; use actual positions for the shared grip.
  const grip = n.root.position.clone().lerp(e.root.position, 0.5);
  grip.y = 0.94;
  grip.z += 0.45;
  const fromN = handoff.carryPoint(from, "right"),
    fromE = e.rig.arms.left.hand.getWorldPosition(new THREE.Vector3());
  await clock.tween(
    0.75,
    (u) => {
      const t = u * u * (3 - 2 * u);
      handoff.reach.set(from, {
        side: "right",
        target: fromN.clone().lerp(grip, t),
      });
      handoff.reach.set(to, {
        side: "left",
        target: fromE.clone().lerp(grip, t),
      });
    },
    signal,
  );
  await clock.wait(0.25, signal);
  assertLive(signal);
  handoff.attach(to, "left");
  const toE = handoff.carryPoint(to, "left");
  await clock.tween(
    0.65,
    (u) => {
      handoff.reach.set(to, {
        side: "left",
        target: grip.clone().lerp(toE, u),
      });
      handoff.reach.set(from, {
        side: "right",
        target: grip.clone().lerp(fromN, u),
      });
    },
    signal,
  );
  handoff.reach.clear();
}
function recordCheck(id, passed, detail) {
  production.evidence("gate-priya", id, passed, detail);
  if (!passed) throw Error(`Acceptance check failed: ${id}`);
}
async function checkLoginValidation(signal) {
  const button = document.querySelector(".opening-login button[type=submit]");
  recordCheck(
    "LOGIN-01",
    button.disabled,
    "Blank form keeps submission disabled.",
  );
  const [email, password] = document.querySelectorAll(".opening-login input");
  const set = (el, value) => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  set(email, "invalid-email");
  set(password, "demo-only");
  await clock.wait(0.08, signal);
  recordCheck(
    "LOGIN-02",
    email.validity.typeMismatch && button.disabled,
    "Malformed email is invalid and submission remains disabled.",
  );
  set(email, "");
  set(password, "");
  await clock.wait(0.05, signal);
}
async function quietConversation(signal) {
  const n = bots.nour,
    s = bots.sami;
  const p = projected(n.root.position);
  await walk("sami", workPoint(p.x + 110, p.y), signal, n.root.position);
  await n.turnTo(
    Math.atan2(
      s.root.position.x - n.root.position.x,
      s.root.position.z - n.root.position.z,
    ),
    { signal, duration: 0.2 },
  );
  for (const [a, b] of [
    ["talking", "thinking"],
    ["thinking", "talking"],
    ["happy", "happy"],
  ]) {
    assertLive(signal);
    n.setExpression(a);
    s.setExpression(b);
    await act("sami", "react", signal, { duration: 0.6 });
    await clock.wait(0.5, signal);
  }
}
async function sequence(signal) {
  delivery.start(100);
  patch({ timer: true });
  production.publish("gate-nour", "Requirements drafted");
  production.publish("master-sami", "Delivery direction established");
  production.publish("gate-sami", "Release in progress");
  production.append(
    "gate-sami",
    "Current release plan",
    `Initial estimate: ${delivery.planned} seconds of active scene time, updated at completed milestones. The countdown never delays delivery. Reading artefacts pauses the release clock. No project expenditure is implied by this staged timeline.`,
  );
  await say("nour", "Team, we have a brief.", signal);
  await Promise.all(
    OWNERS.slice(1).map(async (o, i) => {
      await clock.wait(i * 0.25, signal);
      await enter(o.id, i + 1, signal);
    }),
  );
  patch({ phase: "Requirements", brief: true });
  await say("sami", "Estimate?", signal);
  await say("omar", "One piece at a time.", signal, 1.3);
  await say("sami", "Noted.", signal, 1.2);
  await passBrief(signal);
  production.status("gate-nour", "Requirements approved");
  production.publish("master-ellie", "Design principles established");
  production.publish("gate-ellie", "Design prepared");
  delivery.estimateRemaining(65);
  patch({ phase: "Design", board: true, brief: false });
  await say("ellie", "Sign in. Then the workspace.", signal);
  await act("ellie", "inspect", signal, { duration: 1 });
  handoff.clear(scene);
  await disperse(signal);
  production.status("gate-ellie", "Design handed to engineering");
  production.publish("master-omar", "Technical approach established");
  production.publish("gate-omar", "Implementation in progress");
  patch({ phase: "Build", login: true });
  await clock.wait(0.1, signal);
  await buildPieces(".opening-login", LOGIN_PIECES, signal);
  delivery.estimateRemaining(47);
  production.publish("master-priya", "Quality strategy established");
  production.publish("gate-priya", "Testing in progress");
  await checkLoginValidation(signal);
  const loginDesign = inspectModule(
    "ellie",
    ".opening-login",
    "login",
    signal,
  ).then(
    () => null,
    (e) => e,
  );
  // Login must be exercised before navigating away. Engineering prepares the next station meanwhile.
  const prepare = walk("omar", workPoint(innerWidth * 0.12, 160), signal).then(
    () => null,
    (e) => e,
  );
  await say("priya", "The whole login is ready. Let’s test it.", signal, 1.5);
  await buildPiece(".opening-login", SAMPLE_PIECE, signal, 0, "priya");
  patch({ phase: "Test", sample: true });
  job("priya", "Testing login");
  await jumpPress(
    "priya",
    document.querySelector(".opening-login button[type=button]"),
    signal,
  );
  recordCheck(
    "LOGIN-03",
    [...document.querySelectorAll(".opening-login input")].every(
      (el) => el.value && !el.disabled && !el.readOnly,
    ) && !document.querySelector(".opening-login button[type=submit]").disabled,
    "Sample inputs are populated, editable and submission is enabled.",
  );
  await say("priya", "Fields filled. Still editable.", signal, 1.2);
  const designError = await loginDesign;
  if (designError) throw designError;
  await jumpPress(
    "priya",
    document.querySelector(".opening-login button[type=submit]"),
    signal,
  );
  if (!state.entered)
    throw Error("Demo login did not complete. Reset to retry.");
  recordCheck(
    "LOGIN-04",
    state.entered,
    "The real submit handler entered the workspace.",
  );
  job("priya", "");
  const prepareError = await prepare;
  if (prepareError) throw prepareError;
  delivery.estimateRemaining(30);
  patch({ phase: "Build", shell: true, work: null });
  await clock.wait(0.1, signal);
  const design = new ReviewQueue(),
    qa = new ReviewQueue();
  const modules = [
    {
      label: "header",
      selector: ".opening-shell .topbar",
      pieces: SHELL_PIECES.slice(0, 3),
    },
    {
      label: "sidebar",
      selector: ".opening-shell .sidebar",
      pieces: SHELL_PIECES.slice(3, 5),
    },
    {
      label: "workspace",
      selector: ".opening-shell .main",
      pieces: SHELL_PIECES.slice(5),
    },
  ];
  const conversation = quietConversation(signal).then(
    () => null,
    (e) => e,
  );
  for (const module of modules) {
    await buildPieces(".opening-shell", module.pieces, signal);
    design.add(() =>
      inspectModule("ellie", module.selector, module.label, signal),
    );
    qa.add(() => inspectModule("priya", module.selector, module.label, signal));
  }
  job("omar", "Build complete");
  patch({ header: true, rail: true, work: null });
  await Promise.all([design.drain(), qa.drain()]);
  const conversationError = await conversation;
  if (conversationError) throw conversationError;
  production.status("gate-ellie", "Design reviewed");
  production.status("gate-omar", "Implemented · awaiting release");
  job("omar", "");
  await say("omar", "All modules built. Reviews complete.", signal, 1.3);
  delivery.estimateRemaining(9);
  patch({ phase: "Review" });
  await Promise.all(
    OWNERS.map((o) => act(o.id, "inspect", signal, { target: attention })),
  );
  if (!state.entered) throw new Error("Login acceptance check failed.");
  patch({ checks: 1 });
  await say("priya", "Demo access works.", signal, 1.3);
  if (
    !document.querySelector(".opening-shell .topbar") ||
    !state.header ||
    !state.rail
  )
    throw new Error("Workspace acceptance check failed.");
  patch({ checks: 2 });
  await say("ellie", "Matches the design.", signal, 1.3);
  if (!document.querySelector(".opening-shell .sidebar nav button")?.disabled)
    throw new Error("Feature visibility check failed.");
  recordCheck(
    "SHELL-01",
    !!document.querySelector(".opening-shell .sidebar nav button")?.disabled,
    "Completed header and disabled Dashboard navigation observed.",
  );
  patch({ checks: 3 });
  await say("nour", "Only built features. Good.", signal, 1.3);
  delivery.hold = true;
  try {
    session = await sessionApi.completeFeature("workspace");
  } finally {
    delivery.hold = false;
  }
  assertLive(signal);
  delivery.estimateRemaining(2);
  await Promise.all(OWNERS.map((o, i) => walk(o.id, mark(i), signal)));
  patch({ phase: "Deliver" });
  assertLive(signal);
  delivery.finish();
  production.status("gate-nour", "Accepted · released");
  production.status("gate-ellie", "Approved · released");
  production.status("gate-omar", "Implemented · released");
  production.status("gate-sami", "Shipped");
  production.append(
    "gate-sami",
    "This release run",
    `Initial estimate: ${delivery.planned} seconds of active scene time. Completed in ${delivery.elapsed.toFixed(1)} seconds; reading and service-save pauses are excluded. Shipped immediately on completion of the real work, with no countdown wait. Scope: login and initial workspace. Project budget remains unapproved.`,
  );
  patch({
    ready: true,
    built: ["workspace"],
    dashboard: false,
    dashboardComplete: false,
    dashboardNav: false,
    previewFinished: false,
    financialNav: false,
    financialComplete: false,
    axisFault: false,
    financialChange: "",
    manageQuery: "",
    manageNav: false,
    manageComplete: false,
    manage: null,
    managePreview: false,
    unsafeCancel: false,
    statusFault: false,
    statusComparison: false,
    bookingNav: false,
    bookingComplete: false,
    board: false,
    login: true,
    shell: false,
    entered: false,
    sample: true,
  });
  await clock.wait(0.1, signal);
  recordCheck(
    "TRIAL-01",
    [...document.querySelectorAll(".opening-login input")].every(
      (el) => !el.value,
    ) &&
      !!document.querySelector(".opening-login button[type=submit]")?.disabled,
    "The completed sign-in screen is available with fresh, editable inputs.",
  );
  production.status(
    "gate-priya",
    "Scene checks passed · manual accessibility case pending",
  );
  await say("sami", "Shipped. Your turn.", signal, 1);
  await Promise.all(
    OWNERS.map((o) => act(o.id, "celebrate", signal, { duration: 1.1 })),
  );
  bots.nour.say(
    "Your sign-in is ready. Try it yourself, then click me when you want to build the next feature.",
  );
}
function interrupt() {
  controller.abort();
  controller = new AbortController();
  Object.values(bots).forEach((b) => {
    b.dismissSpeech();
    b.setStatus(null);
    b.cancel();
    b.root.position.y = 0;
    if (b.held) {
      scene.attach(b.held.object);
      b.held = null;
      b.motion.held = null;
    }
  });
  attention = null;
  delivery.reset();
  bookingFlow.cancel();
  management.cancel();
  workTarget = null;
  handoff.clear(scene);
  travel.clear();
  reservations.clear();
  offsets.clear();
  brief.visible = false;
  return controller.signal;
}
async function start(reuseNour = false) {
  const signal = interrupt();
  setBrief("gate-nour");
  patch({
    financialNav: false,
    financialComplete: false,
    axisFault: false,
    financialChange: "",
    manageQuery: "",
    manageNav: false,
    manageComplete: false,
    manage: null,
    managePreview: false,
    unsafeCancel: false,
    statusFault: false,
    statusComparison: false,
    bookingNav: false,
    bookingDraft: null,
    bookingBusy: false,
    bookingError: "",
    bookingDetail: null,
    bookingStage: false,
    bookingComplete: false,
    missingTotals: false,
    missingTicks: false,
    bookingView: "journey",
    feature: "gate",
    built: [],
    page: "empty",
    dashboard: false,
    dashboardNav: false,
    dashboardComplete: false,
    missingEmpty: false,
    qaPreview: false,
    previewFinished: false,
    alignmentIssue: false,
    timer: false,
    phase: "",
    login: false,
    shell: false,
    header: false,
    rail: false,
    board: false,
    brief: false,
    sample: false,
    entered: false,
    ready: false,
    resetting: false,
    empty: false,
    error: "",
    checks: 0,
    chosen: "",
    work: null,
    jobs: {},
    cleared: [],
  });
  Object.entries(bots).forEach(
    ([id, b]) => (b.root.visible = reuseNour && id === "nour"),
  );
  try {
    session = await sessionApi.load();
    assertLive(signal);
    production.begin(session.id, sessionStorage);
    production.publish("master-nour", "Product direction established");
    if (reuseNour) {
      await bots.nour.turnTo(0, { duration: 0.3, signal });
    } else await enter("nour", 2, signal);
    await act("nour", "beckon", signal);
    let answer = await bots.nour.ask(
      session.features.length || session.bookings.length
        ? "Start a new build of Global Concierge? The previous session will be archived."
        : "Help us build Global Concierge?",
      [
        {
          id: "start",
          label:
            session.features.length || session.bookings.length
              ? "Start a new build"
              : "Let’s build it",
        },
        { id: "about", label: "What are we building?" },
      ],
      { signal, focus: true },
    );
    if (answer === "about") {
      await say(
        "nour",
        "We’re building the Global Concierge B2B portal.",
        signal,
        2.6,
      );
      answer = await bots.nour.ask(
        "For travel agents, travel desks and travel partners—bringing dnata’s airport services together for a seamless airport experience.",
        [{ id: "start", label: "Let’s build it" }],
        { signal, focus: true },
      );
    }
    if (answer === "start") {
      // A new ceremony is a new build, never a silent restore of completed features.
      // Archive only after the visitor explicitly chooses to start it.
      if (session.features.length || session.bookings.length) {
        session = await sessionApi.reset(crypto.randomUUID());
        assertLive(signal);
        production.begin(session.id, sessionStorage);
        production.publish("master-nour", "Product direction established");
      }
      await walk("nour", mark(0), signal);
      await sequence(signal);
    }
  } catch (e) {
    if (e.name !== "AbortError") patch({ error: e.message });
  }
}
async function resetScene() {
  if (resetPromise) return resetPromise;
  viewer.close();
  paused = false;
  const signal = interrupt();
  patch({
    resetting: true,
    ready: false,
    error: "",
    work: null,
    jobs: {},
    timer: false,
    board: false,
    brief: false,
  });
  resetKey ||=
    sessionStorage.getItem("gc-opening-reset") || crypto.randomUUID();
  sessionStorage.setItem("gc-opening-reset", resetKey);
  const archive = sessionApi.reset(resetKey).then(
    (s) => ({ session: s }),
    (e) => ({ error: e }),
  );
  resetPromise = (async () => {
    try {
      await demolish({
        bots,
        scene,
        effects,
        clock,
        screenPoint,
        signal,
        owners: OWNERS,
      });
      patch({
        login: false,
        shell: false,
        board: false,
        brief: false,
        phase: "",
        timer: false,
      });
      const result = await archive;
      if (result.error) throw result.error;
      session = result.session;
      sessionStorage.removeItem("gc-opening-reset");
      resetKey = null;
      production.clear();
      patch({ empty: true, resetting: false, cleared: [], timer: false });
      queueMicrotask(() => start(true));
    } catch (e) {
      patch({ error: `Couldn't finish reset. ${e.message}`, resetting: false });
    } finally {
      resetPromise = null;
    }
  })();
  return resetPromise;
}
const ray = new THREE.Raycaster();
function clickBot(event) {
  if (
    event.target.closest("button,a,dialog,input,.document-dock") ||
    state.resetting
  )
    return;
  ray.setFromCamera(
    new THREE.Vector2(
      (event.clientX / innerWidth) * 2 - 1,
      1 - (event.clientY / innerHeight) * 2,
    ),
    camera,
  );
  const hits = OWNERS.filter((o) => bots[o.id].root.visible)
    .map((o) => ({ o, hit: ray.intersectObject(bots[o.id].root, true)[0] }))
    .filter((x) => x.hit)
    .sort((a, b) => a.hit.distance - b.hit.distance);
  if (hits[0]) {
    if (hits[0].o.id === "nour" && state.ready && !sceneRunning)
      featureMenu(controller.signal);
    else viewer.open(hits[0].o.id);
  }
}
window.addEventListener("click", clickBot);
let last = performance.now(),
  raf;
function frame(now) {
  if (disposed) return;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!paused) {
    Object.entries(bots).forEach(([id, b]) => {
      b.update(dt);
      if (attention && !state.ready && !state.resetting) {
        const yaw = Math.atan2(
          attention.x - b.root.position.x,
          attention.z - b.root.position.z,
        );
        const relative = Math.atan2(
          Math.sin(yaw - b.root.rotation.y),
          Math.cos(yaw - b.root.rotation.y),
        );
        b.rig.head.rotation.y +=
          THREE.MathUtils.clamp(relative, -0.45, 0.45) * 0.6;
      }
    });
    delivery.tick(dt);
    clock.tick(dt);
    for (const [id, y] of offsets) bots[id].root.position.y = y;
    handoff.update();
    effects.update(dt);
  }
  progress.scale.x = Math.max(
    0.02,
    [
      "",
      "Requirements",
      "Design",
      "Build",
      "Test",
      "Review",
      "Deliver",
    ].indexOf(state.phase) / 6,
  );
  const timer = document.querySelector("#delivery-timer");
  if (timer) {
    const p = projected(
      bots.sami.root.position.clone().add(new THREE.Vector3(0, 2.5, 0)),
    );
    timer.style.left = `${THREE.MathUtils.clamp(p.x, 90, innerWidth - 90)}px`;
    timer.style.top = `${Math.max(30, p.y)}px`;
    timer.style.visibility = bots.sami.root.visible ? "visible" : "hidden";
    timer.querySelector("b").textContent = delivery.label;
  }
  const outline = document.querySelector(".work-outline");
  if (outline && workTarget?.isConnected) {
    const r = workTarget.getBoundingClientRect();
    Object.assign(outline.style, {
      left: `${r.left - 3}px`,
      top: `${r.top - 3}px`,
      width: `${r.width + 6}px`,
      height: `${r.height + 6}px`,
    });
    outline.classList.toggle("label-below", r.top < 30);
  }
  bubbles.update();
  renderer.render(scene, camera);
  raf = requestAnimationFrame(frame);
}
raf = requestAnimationFrame(frame);
render();
start();
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    disposed = true;
    controller.abort();
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("click", clickBot);
    viewer.dispose();
    bubbles.dispose();
    effects.dispose();
    brief.userData.dispose();
    progress.geometry.dispose();
    progressMaterial.dispose();
    Object.values(bots).forEach((b) => b.dispose());
    renderer.dispose();
    host.replaceChildren();
    ui.unmount();
  });
