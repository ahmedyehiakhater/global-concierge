import { serviceInfo, selectionContext } from "./product.js";
export function financialValues(session) {
  const active = session.bookings.filter((b) => b.status !== "cancelled");
  const events = session.bookings
    .flatMap((b) =>
      (b.history || [{ kind: "confirmed", at: b.created, delta: b.total }]).map(
        (h, i) => ({
          kind: h.kind,
          at: h.at,
          delta: h.delta,
          bookingId: b.id,
          reference: `GC-${b.id.slice(0, 8).toUpperCase()}`,
          index: i,
        }),
      ),
    )
    .sort(
      (a, b) =>
        a.at.localeCompare(b.at) ||
        a.bookingId.localeCompare(b.bookingId) ||
        a.index - b.index,
    );
  const values = [0];
  for (const e of events) values.push(values.at(-1) + e.delta);
  const counts = new Map();
  for (const b of active)
    for (const key of b.services) {
      const context = selectionContext(key, b.legs),
        label = [context.airport, context.direction, serviceInfo(key)?.name]
          .filter(Boolean)
          .join(" · ");
      counts.set(label, (counts.get(label) || 0) + 1);
    }
  return {
    active: active.length,
    gross: active.reduce((n, b) => n + b.subtotal, 0),
    savings: active.reduce((n, b) => n + b.discount, 0),
    events,
    values,
    net: values.at(-1),
    charges: events.reduce((n, e) => n + Math.max(0, e.delta), 0),
    returns: events.reduce((n, e) => n + Math.max(0, -e.delta), 0),
    popular: [...counts]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    reconciled:
      values.at(-1) === session.credit.used &&
      session.credit.limit - session.credit.used === session.credit.available,
  };
}
export function financialNarrative(session, built = []) {
  const v = financialValues(session);
  const mode = !v.events.length
    ? "empty"
    : v.returns
      ? "credit-returns"
      : "booked";
  return {
    mode,
    opening:
      mode === "empty"
        ? "Let’s make the credit position clear, ready for our first booking."
        : mode === "credit-returns"
          ? "Our booking activity includes credit returns. Let’s show the complete money trail."
          : "We’ve saved bookings. Now let’s show where the credit went.",
    inspection:
      mode === "empty"
        ? "Zero usage, full facility, and a flat chart. Nothing invented."
        : mode === "credit-returns"
          ? "Charges and returns both appear. The final balance matches the facility."
          : "The saved charges match the balance and the chart.",
    handback: built.includes("booking")
      ? "Your financials are ready. New bookings and confirmed changes will update these figures."
      : "Your financials are ready. Build New Booking when you want to see the first charge appear.",
  };
}
