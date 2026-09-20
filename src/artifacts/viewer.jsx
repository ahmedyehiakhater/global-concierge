import React, {
  useState,
  useRef,
  useEffect,
  useSyncExternalStore,
} from "react";
import { createRoot } from "react-dom/client";
import { OWNERS, forOwner } from "./catalog.js";
import "./viewer.css";
export function createArtifactViewer({
  onOpen = () => {},
  onClose = () => {},
  onReset,
  production,
} = {}) {
  const dialog = document.createElement("dialog");
  dialog.className = "artifact-dialog";
  dialog.setAttribute("aria-label", "Agent artefacts");
  document.body.append(dialog);
  const root = createRoot(dialog);
  let returnFocus;
  const close = () => dialog.close();
  dialog.addEventListener("close", () => {
    onClose();
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  return {
    open(owner, id) {
      if (!OWNERS.some((o) => o.id === owner))
        throw new Error("Unknown artefact owner");
      returnFocus = document.activeElement;
      root.render(
        <Viewer
          key={`${owner}:${id || ""}`}
          owner={owner}
          production={production}
          initialId={id}
          onClose={close}
          onReset={
            onReset
              ? () => {
                  close();
                  onReset();
                }
              : undefined
          }
        />,
      );
      if (!dialog.open) dialog.showModal();
      onOpen();
    },
    close,
    dispose() {
      if (dialog.open) dialog.close();
      root.unmount();
      dialog.remove();
    },
  };
}
const noSubscribe = () => () => {};
const zeroSnapshot = () => 0;
function Viewer({ owner, initialId, onClose, onReset, production }) {
  useSyncExternalStore(
    production?.subscribe || noSubscribe,
    production?.getSnapshot || zeroSnapshot,
  );
  const person = OWNERS.find((o) => o.id === owner),
    docs = production ? production.forOwner(owner) : forOwner(owner),
    [selected, setSelected] = useState(initialId || docs.at(-1)?.id);
  const doc = docs.find((a) => a.id === selected) || docs[0];
  return (
    <div className="artifact-layout">
      <header>
        <div>
          <span className="artifact-eyebrow">
            {person.name} · {person.role}
          </span>
          <h1>Work & artefacts</h1>
        </div>
        <div>
          {onReset && (
            <button className="artifact-reset" onClick={onReset}>
              Reset scene
            </button>
          )}
          <button
            className="artifact-close"
            onClick={onClose}
            aria-label="Close artefacts"
            autoFocus
          >
            ×
          </button>
        </div>
      </header>
      <div className="artifact-body">
        <nav aria-label="Documents">
          <p>GLOBAL CONCIERGE · PRODUCT & FEATURES</p>
          {docs.map((a) => (
            <button
              key={a.id}
              aria-current={a.id === doc?.id ? "page" : undefined}
              onClick={() => setSelected(a.id)}
            >
              {a.kind}
              <small>{a.title}</small>
            </button>
          ))}
          <p className="artifact-note">
            {production
              ? "Documents appear as this team produces them. Status and observed evidence belong to this run."
              : "Authored product and feature documents. Drafts are not proof of release or test execution."}
          </p>
        </nav>
        <article>
          {doc ? (
            <>
              <div className="artifact-meta">
                <span>{doc.status}</span>
                <span>Version {doc.version}</span>
              </div>
              <small>{doc.feature}</small>
              <h2>{doc.title}</h2>
              {doc.previews && (
                <div className="design-previews">
                  {doc.previews.map((p) => (
                    <section key={p.view}>
                      <h3>{p.label}</h3>
                      <DesignThumbnail preview={p} />
                      <a
                        href={`/design-preview.html?view=${p.view}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open full-size design ↗
                      </a>
                    </section>
                  ))}
                </div>
              )}
              {doc.sections.map((s) => (
                <section key={s.title}>
                  <h3>{s.title}</h3>
                  {s.body && <p>{s.body}</p>}
                  {s.items && (
                    <ul>
                      {s.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
              {doc.history && (
                <section>
                  <h3>Production history</h3>
                  <ul>
                    {doc.history.map((h, i) => (
                      <li key={i}>
                        {new Date(h.at).toLocaleTimeString()} · {h.status}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {doc.tests && (
                <div className="test-cases">
                  {doc.tests.map((t) => (
                    <section key={t.id}>
                      <div className="artifact-meta">
                        <b>{t.id}</b>
                        <span>{t.result || "Not run"}</span>
                      </div>
                      <h3>{t.steps}</h3>
                      {t.detail && <p>{t.detail}</p>}
                      {t.observedAt && (
                        <small>
                          Observed {new Date(t.observedAt).toLocaleTimeString()}
                        </small>
                      )}
                      <p>
                        <strong>Expected: </strong>
                        {t.expected}
                      </p>
                    </section>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p>No artefacts published yet.</p>
          )}
        </article>
      </div>
    </div>
  );
}

function DesignThumbnail({ preview }) {
  const ref = useRef(null);
  useEffect(() => {
    const box = ref.current,
      frame = box.querySelector("iframe");
    const size = () => {
      const ratio = box.clientWidth / 1200;
      frame.style.transform = `scale(${ratio})`;
      box.style.height = `${800 * ratio}px`;
    };
    const observer = new ResizeObserver(size);
    observer.observe(box);
    size();
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="design-thumb">
      <iframe
        title={`${preview.label} design thumbnail`}
        src={`/design-preview.html?view=${preview.view}`}
        tabIndex={-1}
      />
    </div>
  );
}
