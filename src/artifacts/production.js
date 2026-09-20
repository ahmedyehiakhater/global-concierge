import { ARTIFACTS } from "./catalog.js";
// Publications belong to a scene run; drafts remain separate from executed evidence.
export class ArtifactProduction {
  constructor() {
    this.docs = new Map();
    this.listeners = new Set();
    this.storage = null;
    this.key = null;
    this.revision = 0;
  }
  getSnapshot = () => this.revision;
  subscribe = (listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  notify() {
    this.revision++;
    if (this.storage && this.key)
      this.storage.setItem(this.key, JSON.stringify([...this.docs]));
    for (const f of this.listeners) f();
  }
  begin(sessionId, storage) {
    this.archive();
    this.storage = storage;
    this.key = `gc-artifacts:${sessionId}`;
    this.docs.clear();
    this.notify();
  }
  forOwner = (owner) =>
    [...this.docs.values()].filter((d) => d.owner === owner);
  publish(id, status = "Draft produced") {
    const template = ARTIFACTS.find((d) => d.id === id);
    if (!template) throw Error(`Unknown document ${id}`);
    if (!this.docs.has(id)) {
      const doc = structuredClone(template);
      doc.status = status;
      doc.publishedAt = new Date().toISOString();
      doc.history = [{ status, at: doc.publishedAt }];
      this.docs.set(id, doc);
    } else this.status(id, status);
    this.notify();
  }
  status(id, status) {
    const doc = this.docs.get(id);
    if (!doc) return;
    doc.status = status;
    doc.history.push({ status, at: new Date().toISOString() });
    this.notify();
  }
  evidence(id, caseId, passed, detail) {
    const doc = this.docs.get(id),
      test = doc?.tests?.find((t) => t.id === caseId);
    if (!test) throw Error(`Unknown case ${caseId}`);
    test.history ||= [];
    test.history.push({
      result: passed ? "Passed" : "Failed",
      detail,
      at: new Date().toISOString(),
    });
    test.result = passed ? "Passed" : "Failed";
    test.observedAt = new Date().toISOString();
    test.detail = detail;
    this.notify();
  }
  append(id, title, body) {
    const doc = this.docs.get(id);
    if (!doc) return;
    doc.sections = [
      ...doc.sections.filter((s) => s.title !== title),
      { title, body },
    ];
    this.notify();
  }
  archive() {
    if (this.storage && this.key && this.docs.size)
      this.storage.setItem(
        `${this.key}:archive:${Date.now()}`,
        JSON.stringify([...this.docs]),
      );
  }
  clear() {
    this.archive();
    this.docs.clear();
    this.notify();
  }
}
