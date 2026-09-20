import React, { useState, useRef, useEffect } from "react";
import { Button, Card, Field } from "./ui.jsx";
import { AirportPicker } from "./AirportPicker.jsx";
import {
  AIRPORTS,
  withFlights,
  quantity,
  money,
  route,
  quote,
  stepError,
  blankLeg,
  sampleDraft,
  validSelections,
  servicesFor,
  selectionKey,
  serviceInfo,
  selectionContext,
  lineTotal,
  unitLabel,
} from "../../shared/product.js";
const labels = [
  "Journey",
  "Travellers",
  "Services",
  "Review",
  "Credit facility",
];
export function BookingWizard({
  draft: d,
  onChange,
  onSave,
  onConfirm,
  session,
  busy,
  sampleData,
  showCompleted = true,
}) {
  const [consent, setConsent] = useState(false),
    [legIndex, setLegIndex] = useState(0),
    [phase, setPhase] = useState("departure"),
    [category, setCategory] = useState("All");
  const q = quote(d.services, d.adults),
    error = stepError(d),
    leg = d.legs[Math.min(legIndex, d.legs.length - 1)];
  const servicePanel = useRef(null);
  useEffect(() => {
    if (d.step === 2)
      servicePanel.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }, [phase, leg.id]);
  const patch = (v) => {
    setConsent(false);
    const next = v.legs ? withFlights({ ...d, ...v }, v.legs) : { ...d, ...v };
    next.services = validSelections(next);
    onChange(next);
  };
  const fill = () => {
    const sample = sampleData || sampleDraft(d.legs.length, d.adults);
    if (d.step === 0) patch({ legs: sample.legs, services: [] });
    else if (d.step === 1)
      patch({
        travellers: sample.travellers,
        email: sample.email,
        phone: sample.phone,
      });
    else if (d.step === 2)
      patch({
        services: d.legs.flatMap((l) =>
          ["departure", "arrival"].flatMap((dir) =>
            servicesFor(l, dir)
              .filter(
                ([id]) =>
                  id.includes("meet") ||
                  id.includes("_departure") ||
                  id.includes("_arrival"),
              )
              .map(([id]) => selectionKey(l, id, dir)),
          ),
        ),
      });
  };
  const changeLeg = (i, v) =>
    patch({ legs: d.legs.map((l, j) => (i === j ? { ...l, ...v } : l)) });
  const airportName = (code) => `${AIRPORTS[code]?.city || code} (${code})`;
  const currentIndex = Math.min(legIndex, d.legs.length - 1);
  const countAt = (flight, dir) =>
    d.services.filter((key) => {
      const c = selectionContext(key, d.legs);
      return c.legIndex === d.legs.indexOf(flight) && c.direction === dir;
    }).length;
  const selected = d.services.length ? (
    d.legs.map((flight, i) => {
      const keys = d.services.filter(
        (key) => selectionContext(key, d.legs).legIndex === i,
      );
      if (!keys.length) return null;
      return (
        <section className="summary-flight" key={flight.id}>
          <h3>
            Flight {i + 1} · {flight.from} → {flight.to}
          </h3>
          {["departure", "arrival"].map((dir) => {
            const items = keys.filter(
              (key) => selectionContext(key, d.legs).direction === dir,
            );
            if (!items.length) return null;
            return (
              <div key={dir}>
                <h4>
                  {dir === "departure" ? "Departure" : "Arrival"} ·{" "}
                  {airportName(dir === "departure" ? flight.from : flight.to)}
                </h4>
                {items.map((key) => (
                  <div className="line" key={key}>
                    <span>
                      {serviceInfo(key).name}
                      <small>
                        {quantity(key, d.adults)} ×{" "}
                        {money(serviceInfo(key).price)} · {unitLabel(key)}
                      </small>
                    </span>
                    <b>{money(lineTotal(key, d.adults))}</b>
                  </div>
                ))}
              </div>
            );
          })}
        </section>
      );
    })
  ) : (
    <p className="muted">No services selected.</p>
  );
  return (
    <>
      <div className="heading" data-booking="heading">
        <div>
          <h1>New booking</h1>
          <p>Plan airport services at every stop.</p>
        </div>
        <span className="badge">
          {session.discountPercent}% corporate discount
        </span>
      </div>
      <nav className="steps" data-booking="steps" aria-label="Booking steps">
        {labels.map((name, i) => (
          <button
            type="button"
            key={name}
            disabled={busy || i > d.step}
            onClick={() => onSave({ ...d, step: i })}
            aria-current={i === d.step ? "step" : undefined}
          >
            <span>{showCompleted && i < d.step ? "✓" : i + 1}</span>
            {name}
          </button>
        ))}
      </nav>
      <div className="columns wizard">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!error) onSave({ ...d, step: Math.min(4, d.step + 1) });
          }}
        >
          <fieldset disabled={busy}>
            {d.step < 3 && (
              <div
                className="sample-toolbar"
                data-booking="sample"
                key={`sample-${d.step}`}
              >
                <span>
                  Enter your details or try sample data. <b>* Required</b>
                </span>
                <Button type="button" secondary onClick={fill}>
                  Use sample data
                </Button>
              </div>
            )}
            <div className="wizard-step-body" data-booking="body" key={`body-${d.step}`}>
              {d.step === 0 && (
                <>
                  {d.legs.map((l, i) => (
                    <Card
                      title={`Flight ${i + 1} · ${l.from || "Departure"} → ${l.to || "Arrival"}`}
                      key={l.id}
                    >
                      <div className="field-grid">
                        <AirportPicker
                          label={`Departure airport · flight ${i + 1}`}
                          value={l.from}
                          onChange={(from) => changeLeg(i, { from })}
                        />
                        <AirportPicker
                          label={`Arrival airport · flight ${i + 1}`}
                          value={l.to}
                          onChange={(to) => changeLeg(i, { to })}
                        />
                        <Field
                          label={`Flight date · flight ${i + 1}`}
                          type="date"
                          required
                          min={i ? d.legs[i - 1].date : undefined}
                          value={l.date}
                          onChange={(e) =>
                            changeLeg(i, { date: e.target.value })
                          }
                        />
                        <Field
                          label={`Flight number · flight ${i + 1}`}
                          required
                          maxLength={20}
                          placeholder="EK 927"
                          value={l.flight}
                          onChange={(e) =>
                            changeLeg(i, { flight: e.target.value })
                          }
                        />
                      </div>
                      {d.legs.length > 1 && (
                        <Button
                          type="button"
                          secondary
                          onClick={() =>
                            patch({ legs: d.legs.filter((x) => x.id !== l.id) })
                          }
                        >
                          Remove flight {i + 1}
                        </Button>
                      )}
                    </Card>
                  ))}
                  <div className="add-flight-action">
                    <Button
                      type="button"
                      onClick={() =>
                        patch({ legs: [...d.legs, blankLeg(d.legs.at(-1).to)] })
                      }
                    >
                      <span className="add-flight-plus" aria-hidden="true">
                        +
                      </span>
                      Add another flight
                    </Button>
                  </div>
                  <Card title="Who is travelling?">
                    <label className="field">
                      <span>
                        Adults · age 12+ <em>*</em>
                      </span>
                      <select
                        value={d.adults}
                        onChange={(e) => {
                          const adults = Number(e.target.value);
                          patch({
                            adults,
                            travellers: Array.from(
                              { length: adults },
                              (_, i) =>
                                d.travellers[i] || {
                                  firstName: "",
                                  lastName: "",
                                },
                            ),
                          });
                        }}
                      >
                        {Array.from({ length: 20 }, (_, i) => (
                          <option key={i} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="fine">
                      The same travellers take every flight. This demo supports
                      adults only. Search over 3,200 airports by city, country
                      or airport code.
                    </p>
                  </Card>
                </>
              )}
              {d.step === 1 && (
                <>
                  {d.travellers.map((t, i) => (
                    <Card
                      key={i}
                      title={`Traveller ${i + 1}${i === 0 ? " · Lead traveller" : ""}`}
                    >
                      <div className="field-grid">
                        {["firstName", "lastName"].map((key) => (
                          <Field
                            key={key}
                            label={`${key === "firstName" ? "First" : "Last"} name · traveller ${i + 1}`}
                            required
                            maxLength={60}
                            value={t[key]}
                            onChange={(e) =>
                              patch({
                                travellers: d.travellers.map((x, j) =>
                                  i === j ? { ...x, [key]: e.target.value } : x,
                                ),
                              })
                            }
                          />
                        ))}
                      </div>
                    </Card>
                  ))}
                  <Card title="Contact details">
                    <div className="field-grid">
                      <Field
                        label="Lead traveller email"
                        required
                        type="email"
                        value={d.email}
                        maxLength={120}
                        onChange={(e) => patch({ email: e.target.value })}
                      />
                      <Field
                        label="Phone · with country code"
                        required
                        type="tel"
                        value={d.phone}
                        maxLength={40}
                        onChange={(e) => patch({ phone: e.target.value })}
                      />
                    </div>
                  </Card>
                </>
              )}
              {d.step === 2 && (
                <>
                  <p className="note">
                    Illustrative PoC services and prices. Airport selection does
                    not confirm supplier coverage; no real services are
                    reserved.
                  </p>
                  <div className="itinerary-tabs">
                    {d.legs.map((l, i) => (
                      <button
                        type="button"
                        key={l.id}
                        aria-pressed={leg.id === l.id}
                        onClick={() => {
                          setLegIndex(i);
                          setPhase("departure");
                          setCategory("All");
                        }}
                      >
                        Flight {i + 1} · {l.from} → {l.to}
                        <small>
                          {
                            d.services.filter((k) => k.startsWith(l.id + ":"))
                              .length
                          }{" "}
                          selected
                        </small>
                      </button>
                    ))}
                  </div>
                  <div ref={servicePanel} className="service-panel">
                    <Card
                      title={`Services for flight ${currentIndex + 1} · ${leg.flight}`}
                    >
                      <div className="phase-tabs">
                        {["departure", "arrival"].map((dir) => (
                          <button
                            type="button"
                            key={dir}
                            data-direction={dir}
                            aria-pressed={phase === dir}
                            onClick={() => {
                              setPhase(dir);
                              setCategory("All");
                            }}
                          >
                            <span>
                              {dir === "departure"
                                ? "Before departure"
                                : "After arrival"}
                            </span>
                            <strong>
                              {airportName(
                                dir === "departure" ? leg.from : leg.to,
                              )}
                            </strong>
                            <small>{countAt(leg, dir)} selected</small>
                          </button>
                        ))}
                      </div>
                      <div className="category-tabs">
                        {[
                          "All",
                          ...new Set(
                            servicesFor(leg, phase).map(([, s]) => s.category),
                          ),
                        ].map((c) => (
                          <button
                            type="button"
                            key={c}
                            aria-pressed={category === c}
                            onClick={() => setCategory(c)}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                      {servicesFor(leg, phase)
                        .filter(
                          ([, s]) =>
                            category === "All" || s.category === category,
                        )
                        .map(([id, s]) => {
                          const key = selectionKey(leg, id, phase);
                          return (
                            <label
                              className={
                                "service service-compact " +
                                (d.services.includes(key) ? "selected" : "")
                              }
                              key={key}
                            >
                              <input
                                data-service={id}
                                type="checkbox"
                                checked={d.services.includes(key)}
                                onChange={(e) =>
                                  patch({
                                    services: e.target.checked
                                      ? [...d.services, key]
                                      : d.services.filter((k) => k !== key),
                                  })
                                }
                              />
                              <span>
                                <strong>{s.name}</strong>
                                <p>{s.description}</p>
                              </span>
                              <span className="service-price">
                                <b>{money(lineTotal(key, d.adults))}</b>
                                <small>
                                  {quantity(key, d.adults) > 1
                                    ? `${money(s.price)} `
                                    : ""}
                                  {unitLabel(key)}
                                </small>
                                <small>
                                  {quantity(key, d.adults)}{" "}
                                  {s.unit === "vehicle"
                                    ? quantity(key, d.adults) === 1
                                      ? "vehicle"
                                      : "vehicles"
                                    : s.unit === "booking"
                                      ? "booking"
                                      : d.adults === 1
                                        ? "adult"
                                        : "adults"}{" "}
                                  ·{" "}
                                  {d.services.includes(key)
                                    ? "Added"
                                    : "Not added"}
                                </small>
                              </span>
                            </label>
                          );
                        })}
                      <div className="airport-next">
                        <p className="fine">
                          Choose only the services you need. You can leave an
                          airport without services.
                        </p>
                        {phase === "departure" ? (
                          <Button
                            type="button"
                            secondary
                            onClick={() => {
                              setPhase("arrival");
                              setCategory("All");
                            }}
                          >
                            Next: arrival in {AIRPORTS[leg.to]?.city || leg.to}{" "}
                            →
                          </Button>
                        ) : currentIndex < d.legs.length - 1 ? (
                          <Button
                            type="button"
                            secondary
                            onClick={() => {
                              setLegIndex(currentIndex + 1);
                              setPhase("departure");
                              setCategory("All");
                            }}
                          >
                            Next: flight {currentIndex + 2} →
                          </Button>
                        ) : (
                          <span className="badge">
                            Last airport · Review your selections below
                          </span>
                        )}
                      </div>
                    </Card>
                  </div>
                </>
              )}
              {d.step === 3 && (
                <>
                  <Card title="Journey & travellers">
                    <h3>{route(d)}</h3>
                    {d.legs.map((l, i) => (
                      <p key={l.id}>
                        Flight {i + 1} · {l.from} → {l.to} · {l.date} ·{" "}
                        {l.flight}
                      </p>
                    ))}
                    <hr />
                    {d.travellers.map((t, i) => (
                      <p key={i}>
                        {t.firstName} {t.lastName}
                      </p>
                    ))}
                    <p>
                      {d.email} · {d.phone}
                    </p>
                  </Card>
                  <Card title="Your selected services">{selected}</Card>
                  <p className="note">
                    Flight tickets are not included. Prices and availability are
                    illustrative. Confirming saves a demo booking, not an
                    airport reservation.
                  </p>
                </>
              )}
              {d.step === 4 && (
                <>
                  <Card title="Corporate credit facility">
                    <h3>Global Travel Partners</h3>
                    {[
                      ["Credit limit", session.credit.limit],
                      ["Credit used", session.credit.used],
                      ["Available before booking", session.credit.available],
                      ["Deduction for this booking", q.total],
                      [
                        "Available after booking",
                        session.credit.available - q.total,
                      ],
                    ].map(([label, value]) => (
                      <div className="line" key={label}>
                        <span>{label}</span>
                        <b>{money(value)}</b>
                      </div>
                    ))}
                  </Card>
                  <Card title="Confirm against your credit facility">
                    <p>
                      The discounted amount is deducted from this session’s
                      credit facility.
                    </p>
                    <label className="consent">
                      <input
                        type="checkbox"
                        data-booking-consent
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                      />
                      I approve the demo credit deduction of {money(q.total)}.
                    </label>
                    {q.total > session.credit.available && (
                      <p className="error">
                        Insufficient available credit. Reduce services or
                        traveller count.
                      </p>
                    )}
                    <Button
                      type="button"
                      disabled={
                        !consent ||
                        busy ||
                        !!error ||
                        q.total > session.credit.available
                      }
                      data-booking-confirm
                      onClick={onConfirm}
                    >
                      Confirm booking · {money(q.total)}
                    </Button>
                  </Card>
                </>
              )}
              {error && (
                <p className="validation-hint" role="status">
                  {error}
                </p>
              )}
              <div className="pager">
                <Button
                  type="button"
                  secondary
                  disabled={busy || d.step === 0}
                  onClick={() => onSave({ ...d, step: d.step - 1 })}
                >
                  Back
                </Button>
                <Button type="button" secondary onClick={() => onSave(d)}>
                  Save draft
                </Button>
                {d.step < 4 && (
                  <Button
                    data-booking-next
                    type="submit"
                    disabled={busy || !!error}
                  >
                    Continue to {labels[d.step + 1].toLowerCase()}
                  </Button>
                )}
              </div>
            </div>
          </fieldset>
        </form>
        <aside className="summary" data-booking="summary">
          <Card title="Booking summary">
            <span className="badge">
              {d.legs.length} flight{d.legs.length === 1 ? "" : "s"} ·{" "}
              {d.adults} adult{d.adults === 1 ? "" : "s"}
            </span>
            <h2>{route(d)}</h2>
            <div className="summary-services">{selected}</div>
            <hr />
            {[
              ["Service subtotal", q.subtotal],
              [
                "Corporate discount · " + session.discountPercent + "%",
                -q.discount,
              ],
              ["Charge to credit", q.total],
            ].map(([label, value]) => (
              <div className="line summary-money" key={label}>
                <span>{label}</span>
                <b>{money(value)}</b>
              </div>
            ))}
            <p className="fine">
              Illustrative prices including sample taxes and fees.
            </p>
            <hr />
            <p>
              Available: <b>{money(session.credit.available)}</b>
            </p>
            <p className="fine">
              After booking: {money(session.credit.available - q.total)}
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
