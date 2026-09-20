import React, { useState } from "react";
import {
  Card,
  Metric,
  Empty,
  BookingRows,
  Button,
  Field,
  logo,
} from "./ui.jsx";
import {
  money,
  route,
  serviceInfo,
  selectionContext,
} from "../../shared/product.js";
export function Login({ onEnter, busy }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length > 0;
  return (
    <div className="login">
      <section className="login-story">
        <img src={logo} alt="dnata" />
        <span className="eyebrow">AGENT PORTAL</span>
        <h1>
          A smoother journey.
          <br />
          At every airport.
        </h1>
        <p>
          Bring your travellers, airport services and bookings together in one
          workspace.
        </p>
        <div className="route-art">
          DXB <span>→</span> CAI <span>→</span> LHR
        </div>
        <p>
          One flight or a journey with several stops.
          <br />
          Every traveller, one clear itinerary.
          <br />
          Corporate credit, built in.
        </p>
        <small>Global Concierge · Fursa Tek</small>
      </section>
      <form
        className="login-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onEnter();
        }}
      >
        <span className="badge">Welcome back</span>
        <h2>Sign in to your workspace</h2>
        <p className="muted">Global Travel Partners · Sarah Jenkins</p>
        <Button
          type="button"
          secondary
          onClick={() => {
            setEmail("sarah.jenkins@example.com");
            setPassword("demonstration");
          }}
        >
          Use sample data
        </Button>
        <Field
          label="Work email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          type="password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="fine">
          Demo access only. Enter any demo password; it is never stored or
          authenticated.
        </p>
        <Button type="submit" disabled={busy || !valid}>
          Enter demo workspace
        </Button>
        <p className="fine">
          Use sample traveller details when exploring the demo.
        </p>
      </form>
    </div>
  );
}
export function Dashboard({ session, onNew, onOpen, onBookings }) {
  const b = session.bookings;
  return (
    <>
      <Card className="welcome">
        <span className="eyebrow">YOUR DNATA WORKSPACE</span>
        <h1>Welcome back, Sarah.</h1>
        <p>
          {b.length
            ? `${b.length} saved booking${b.length === 1 ? "" : "s"}. Everything is ready for your travellers.`
            : "Everything is ready for your next guest. Create your first booking to get started."}
        </p>
      </Card>
      {session.draft && (
        <Card title="Your saved booking draft">
          <p className="muted">
            {route(session.draft)} · {session.draft.adults} adults · Pick up
            where you left off.
          </p>
          <Button secondary onClick={onNew}>
            Resume saved booking
          </Button>
        </Card>
      )}
      <div className="metrics">
        <Metric label="Active bookings" value={b.length} />
        <Metric
          label="Corporate savings"
          value={money(b.reduce((s, b) => s + b.discount, 0))}
        />
        <Metric
          label="Available credit"
          value={money(session.credit.available)}
        />
      </div>
      <div className="columns">
        <div>
          <div className="heading compact">
            <h2>Active services</h2>
            <Button secondary onClick={onBookings}>
              View all bookings →
            </Button>
          </div>
          {b.length ? (
            <BookingRows bookings={b.slice(-2)} onOpen={onOpen} />
          ) : (
            <Empty title="No active bookings yet" onCreate={onNew}>
              Your confirmed bookings and services will appear here.
            </Empty>
          )}
        </div>
        <Card title="Notifications">
          {b.length ? (
            [...b]
              .reverse()
              .slice(0, 4)
              .map((item) => (
                <div className="notification" key={item.id}>
                  <b>Booking confirmed</b>
                  <p>
                    {route(item)} · {money(item.total)} deducted from corporate
                    credit.
                  </p>
                  <small>{new Date(item.created).toLocaleString()}</small>
                </div>
              ))
          ) : (
            <p className="muted">
              You’re all caught up. Booking confirmations will appear here.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
export function Bookings({ session, onNew, onOpen, initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const filtered = session.bookings.filter((b) =>
    `${b.id} ${route(b)} ${(b.travellers || []).map((t) => t.firstName + " " + t.lastName).join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="heading">
        <div>
          <h1>All Bookings</h1>
          <p>Manage your travellers and airport service reservations.</p>
        </div>
        <Button onClick={onNew}>＋ New Booking</Button>
      </div>
      <Card>
        <label className="field">
          <span>Search by traveller, route or reference</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bookings…"
          />
        </label>
        <p className="fine">
          {filtered.length} booking{filtered.length === 1 ? "" : "s"} found
        </p>
      </Card>
      {filtered.length ? (
        <BookingRows bookings={filtered} onOpen={onOpen} />
      ) : (
        <Empty
          title={query ? "No matching bookings" : "Your bookings start here"}
          onCreate={query ? undefined : onNew}
        >
          {query
            ? "Try another traveller name or reference."
            : "Create your first booking to organise airport services in one place."}
        </Empty>
      )}
    </>
  );
}
export function Financials({ session }) {
  const b = session.bookings;
  const gross = b.reduce((s, b) => s + b.subtotal, 0),
    savings = b.reduce((s, b) => s + b.discount, 0);
  const values = [
    0,
    ...b.map((_, i) => b.slice(0, i + 1).reduce((s, b) => s + b.total, 0)),
  ];
  const max = Math.max(100000, ...values);
  const points = values
    .map(
      (v, i) =>
        `${40 + (i * 560) / Math.max(1, values.length - 1)},${220 - (v / max) * 180}`,
    )
    .join(" ");
  const counts = new Map();
  for (const booking of b)
    for (const key of booking.services) {
      const service = serviceInfo(key),
        context = selectionContext(key, booking.legs);
      const label = [context.airport, context.direction, service?.name]
        .filter(Boolean)
        .join(" · ");
      counts.set(label, (counts.get(label) || 0) + 1);
    }
  const popular = [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
  return (
    <>
      <div className="heading">
        <div>
          <h1>Financials & Insights</h1>
          <p>Corporate credit position and this visitor’s booking activity.</p>
        </div>
        <span className="badge">AED · Current session</span>
      </div>
      <Card title="Corporate credit facility">
        <p className="muted">
          Global Travel Partners · Active · illustrative terms
        </p>
        <div className="metrics">
          <Metric label="Credit limit" value={money(session.credit.limit)} />
          <Metric label="Credit used" value={money(session.credit.used)} />
          <Metric
            label="Available credit"
            value={money(session.credit.available)}
          />
        </div>
        <p className="fine">
          Every session starts with AED 100,000 and zero usage. Confirmed
          bookings have deducted {money(gross - savings)}. Corporate discount:{" "}
          {session.discountPercent}%.
        </p>
      </Card>
      <div className="metrics">
        <Metric label="Gross booking value" value={money(gross)} />
        <Metric label="Corporate discount savings" value={money(savings)} />
        <Metric label="Total bookings" value={b.length} />
      </div>
      <div className="columns">
        <Card title="Booking Value Trend">
          <p className="fine">
            Cumulative net credit deductions · this visitor
          </p>
          <svg
            className="chart"
            viewBox="0 0 640 260"
            role="img"
            aria-label={`Cumulative net booking value ${money(gross - savings)}`}
          >
            <line x1="40" x2="600" y1="220" y2="220" />
            <text x="40" y="245">
              Start · AED 0
            </text>
            <text x="600" y="30" textAnchor="end">
              {money(gross - savings)}
            </text>
            <polyline
              points={values.length === 1 ? "40,220 600,220" : points}
            />
          </svg>
          {!b.length && <p className="muted">No booking activity yet.</p>}
        </Card>
        <Card title="Most booked services">
          {popular.length ? (
            popular.map((s, i) => (
              <div className="notification" key={i}>
                <b>{s.label}</b>
                <p>
                  {s.count} service selection{s.count === 1 ? "" : "s"}
                </p>
              </div>
            ))
          ) : (
            <p className="muted">
              Your most popular services will appear after the first booking.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
