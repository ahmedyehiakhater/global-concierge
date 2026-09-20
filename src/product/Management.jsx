import React, { useState, useEffect } from "react";
import { Card, Button, Field, BookingRows, BookingDetail } from "./ui.jsx";
import {
  money,
  route,
  servicesFor,
  selectionKey,
  stepError,
  serviceInfo,
  selectionContext,
  lineTotal,
} from "../../shared/product.js";
import { reference, isActive } from "../../shared/management.js";
export function Management({
  controller: c,
  state: s,
  session,
  canBook,
  onNew,
  preview = false,
  unsafeCancel = false,
  statusFault = false,
  statusComparison = false,
  initialQuery = "",
  onFinancials,
  creditNotice,
}) {
  if (preview && c.session?.credit) session = c.session;
  const [query, setQuery] = useState(initialQuery),
    [filter, setFilter] = useState("all");
  useEffect(() => setQuery(initialQuery), [initialQuery]);
  const invoke = (fn) => {
    const result = fn();
    result?.catch?.(() => {});
  };
  const b = s.selected,
    d = s.draft;
  const records = c.preview ? [c.preview] : session.bookings;
  const filtered = records.filter(
    (b) =>
      (filter === "all" ||
        (filter === "confirmed" ? isActive(b) : !isActive(b))) &&
      `${reference(b)} ${route(b)} ${b.travellers?.map((t) => `${t.firstName} ${t.lastName}`).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const locked = s.busy || s.pending;
  return (
    <div className={"management " + (statusFault ? "status-fault" : "")}>
      {preview && (
        <p className="notice" role="note">
          QA preview · changes here never affect saved bookings or credit
        </p>
      )}
      {creditNotice && (
        <p className="notice" role="status">
          {creditNotice}
        </p>
      )}
      {s.error && (
        <div role="alert" className="booking-error">
          {s.error}
          {s.pending ? (
            <Button
              secondary
              onClick={() => invoke(() => c.retry())}
              disabled={s.busy}
            >
              Retry safely
            </Button>
          ) : (
            <Button
              secondary
              onClick={() =>
                invoke(() =>
                  c.preview ? c.begin(session, c.preview) : c.reload(),
                )
              }
            >
              Reload booking
            </Button>
          )}
        </div>
      )}
      {statusComparison && (
        <Card data-manage="comparison">
          <p>Design comparison · not saved booking statuses</p>
          <span className="badge confirmed">Confirmed</span>{" "}
          <span className="badge cancelled">Cancelled</span>
        </Card>
      )}
      {s.busy && <p role="status">Checking and saving…</p>}
      {s.view === "list" ? (
        <>
          <div data-manage="list">
            <div className="heading">
              <div>
                <h1>All Bookings</h1>
                <p>Find reservations and manage changes with confidence.</p>
              </div>
              <Button disabled={!canBook || locked} onClick={onNew}>
                New Booking
              </Button>
            </div>
            <Card>
              <div className="form-grid">
                <Field
                  label="Search by traveller, route or reference"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <label className="field">
                  <span>Status</span>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All bookings</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
              </div>
              <p>{filtered.length} bookings found</p>
            </Card>
            {filtered.length ? (
              <BookingRows bookings={filtered} onOpen={(b) => c.open(b)} />
            ) : (
              <Card className="empty">
                <h2>
                  {query || filter !== "all"
                    ? "No matching bookings"
                    : "Your bookings start here"}
                </h2>
                <p>
                  {canBook
                    ? "Create a booking and manage it here."
                    : "Choose New Booking with Nour to build booking creation."}
                </p>
              </Card>
            )}
          </div>
        </>
      ) : b ? (
        <>
          {s.view === "detail" && (
            <>
              <div data-manage="details">
                {s.hidden ? (
                  <Card className="empty">
                    <h2>Preview booking disappeared</h2>
                    <p>QA demonstration only. No saved data was changed.</p>
                  </Card>
                ) : (
                  <BookingDetail booking={b} onBack={() => c.list()} />
                )}
              </div>
              <div data-manage="actions">
                <Card>
                  <div className="pager">
                    <Button
                      disabled={
                        locked || !isActive(b) || s.hidden || !b.legs?.length
                      }
                      onClick={() => c.edit()}
                    >
                      Modify booking
                    </Button>
                    <Button
                      secondary
                      disabled={locked || !isActive(b) || s.hidden}
                      onClick={() => c.showCancel(unsafeCancel)}
                    >
                      Cancel booking
                    </Button>
                  </div>
                  {!isActive(b) && (
                    <p>
                      This booking is cancelled. Its history is retained; no
                      additional credit can be returned.
                    </p>
                  )}
                </Card>
              </div>
              {onFinancials && (
                <Button secondary disabled={locked} onClick={onFinancials}>
                  View Financials
                </Button>
              )}
              <div data-manage="history">
                <Card title="Booking history">
                  {(b.history || []).map((h, i) => (
                    <p key={i}>
                      <b>{h.kind}</b> · {new Date(h.at).toLocaleString()} ·{" "}
                      {h.delta < 0 ? "Credit returned" : "Credit charged"}{" "}
                      {money(Math.abs(h.delta))}
                    </p>
                  ))}
                </Card>
              </div>
            </>
          )}
          {s.view === "edit" && (
            <div data-manage="edit">
              <div className="heading">
                <div>
                  <h1>Modify booking</h1>
                  <p>
                    {reference(b)} · Changes remain a draft until confirmed.
                  </p>
                </div>
                <Button secondary disabled={locked} onClick={() => c.back()}>
                  Discard changes
                </Button>
              </div>
              <Card>
                <p>
                  Route and traveller count remain fixed for this PoC. Edit
                  flight dates/numbers, names, contact details and services.
                </p>
                <Button
                  secondary
                  disabled={locked}
                  onClick={() =>
                    c.change({
                      ...d,
                      email: "james.sterling@example.com",
                      phone: "+971 50 000 0000",
                    })
                  }
                >
                  Use sample contact data
                </Button>
                {d.legs.map((l, i) => (
                  <div className="form-grid" key={l.id}>
                    <Field
                      label={`Flight ${i + 1} date · ${l.from} → ${l.to}`}
                      type="date"
                      required
                      value={l.date}
                      onChange={(e) =>
                        c.change({
                          ...d,
                          legs: d.legs.map((x, j) =>
                            i === j ? { ...x, date: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <Field
                      label={`Flight ${i + 1} number`}
                      required
                      value={l.flight}
                      onChange={(e) =>
                        c.change({
                          ...d,
                          legs: d.legs.map((x, j) =>
                            i === j ? { ...x, flight: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
                {d.travellers.map((t, i) => (
                  <div className="form-grid" key={i}>
                    {["firstName", "lastName"].map((k) => (
                      <Field
                        key={k}
                        label={`${k === "firstName" ? "First" : "Last"} name · traveller ${i + 1}`}
                        required
                        value={t[k]}
                        onChange={(e) =>
                          c.change({
                            ...d,
                            travellers: d.travellers.map((x, j) =>
                              i === j ? { ...x, [k]: e.target.value } : x,
                            ),
                          })
                        }
                      />
                    ))}
                  </div>
                ))}
                <div className="form-grid">
                  <Field
                    label="Contact email"
                    type="email"
                    required
                    value={d.email}
                    onChange={(e) => c.change({ ...d, email: e.target.value })}
                  />
                  <Field
                    label="Phone"
                    required
                    value={d.phone}
                    onChange={(e) => c.change({ ...d, phone: e.target.value })}
                  />
                </div>
              </Card>
              <Card title="Airport services">
                {d.legs.map((l) => (
                  <section key={l.id}>
                    <h3>
                      {l.from} → {l.to}
                    </h3>
                    {["departure", "arrival"].map((dir) => (
                      <div key={dir}>
                        <h4>{dir === "departure" ? "Departure" : "Arrival"}</h4>
                        {servicesFor(l, dir).map(([id, service]) => {
                          const key = selectionKey(l, id, dir);
                          return (
                            <label className="manage-service" key={key}>
                              <input
                                type="checkbox"
                                data-manage-service={id}
                                checked={d.services.includes(key)}
                                onChange={(e) =>
                                  c.change({
                                    ...d,
                                    services: e.target.checked
                                      ? [...d.services, key]
                                      : d.services.filter((x) => x !== key),
                                  })
                                }
                              />
                              {service.name} · {money(lineTotal(key, d.adults))}{" "}
                              for this party
                            </label>
                          );
                        })}
                      </div>
                    ))}
                  </section>
                ))}
              </Card>
              {stepError(d, 4) && <p role="status">{stepError(d, 4)}</p>}
              <Button
                disabled={locked || !!stepError(d, 4)}
                onClick={() => invoke(() => c.review())}
              >
                Review changes
              </Button>
            </div>
          )}
          {s.view === "review" && s.quote && (
            <div data-manage="review">
              <Card title="Review changes">
                <p>
                  {reference(b)} · {route(d)}
                </p>
                <p>
                  Compare your requested changes before approving the credit
                  adjustment.
                </p>
                {d.legs.map((l, i) => (
                  <p key={l.id}>
                    <b>Flight {i + 1}:</b> {b.legs[i].date} / {b.legs[i].flight}{" "}
                    → {l.date} / {l.flight}
                  </p>
                ))}
                {d.travellers.map((t, i) => (
                  <p key={i}>
                    {b.travellers[i].firstName} {b.travellers[i].lastName} →{" "}
                    {t.firstName} {t.lastName}
                  </p>
                ))}
                <p>
                  {b.email} → {d.email}
                </p>
                <p>
                  {b.phone} → {d.phone}
                </p>
                <p>
                  {b.services.length} services → {d.services.length} services
                </p>
                {[...new Set([...b.services, ...d.services])].map((key) => {
                  const before = b.services.includes(key),
                    after = d.services.includes(key);
                  const context = selectionContext(key, d.legs);
                  return (
                    <p key={key}>
                      <b>
                        {before && after ? "Kept" : after ? "Added" : "Removed"}
                      </b>{" "}
                      · Flight {context.legIndex + 1} · {context.airport}{" "}
                      {context.direction} · {serviceInfo(key)?.name} ·{" "}
                      {money(lineTotal(key, d.adults))}
                    </p>
                  );
                })}
                {[
                  ["Original charge", s.quote.previousTotal],
                  ["Revised charge", s.quote.total],
                  [
                    s.quote.difference >= 0
                      ? "Additional credit required"
                      : "Credit returned",
                    Math.abs(s.quote.difference),
                  ],
                  ["Available after change", s.quote.availableAfter],
                ].map(([label, v]) => (
                  <div className="line" key={label}>
                    <span>{label}</span>
                    <b>{money(v)}</b>
                  </div>
                ))}
                {!s.quote.affordable && (
                  <p role="alert">
                    Insufficient credit. Remove services or discard this change.
                  </p>
                )}
                <div className="pager">
                  <Button secondary disabled={locked} onClick={() => c.edit()}>
                    Back to edit
                  </Button>
                  <Button secondary disabled={locked} onClick={() => c.back()}>
                    Discard changes
                  </Button>
                  <Button
                    disabled={locked || !s.quote.affordable || preview}
                    onClick={() => invoke(() => c.confirm("amend"))}
                  >
                    Confirm changes
                  </Button>
                </div>
              </Card>
            </div>
          )}
          {s.view === "cancel" && (
            <div data-manage="cancel">
              <Card>
                <section
                  role="dialog"
                  aria-modal="false"
                  aria-labelledby="cancel-title"
                >
                  <h1 id="cancel-title">Cancel this booking?</h1>
                  <h2>{reference(b)}</h2>
                  <p>
                    {route(b)} · {b.adults} travellers · {b.services.length}{" "}
                    services
                  </p>
                  <p>
                    Full credit return is an illustrative PoC policy, not a
                    supplier cancellation policy.
                  </p>
                  <div className="line">
                    <span>Credit to return</span>
                    <strong>{money(b.total)}</strong>
                  </div>
                  <div className="line">
                    <span>Available afterwards</span>
                    <b>{money(session.credit.available + b.total)}</b>
                  </div>
                  <p>
                    The record and its history will remain visible as Cancelled.
                  </p>
                  <div className="pager">
                    <Button
                      secondary
                      disabled={locked}
                      onClick={() => c.back()}
                    >
                      Keep booking
                    </Button>
                    <Button
                      disabled={locked || preview}
                      onClick={() => invoke(() => c.confirm("cancel"))}
                    >
                      Confirm cancellation
                    </Button>
                  </div>
                </section>
              </Card>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
