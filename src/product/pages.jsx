import { financialValues } from "../../shared/financials.js";
import React, { useState } from "react";
import { featureAvailable, dashboardValues } from "../../shared/features.js";
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
export function Dashboard({
  session,
  onNew,
  onOpen,
  onBookings,
  availableFeatures,
  servicesBookings = session.bookings,
}) {
  const b = session.bookings.filter((b) => b.status !== "cancelled");
  const values = dashboardValues(session);
  const canBook = featureAvailable(availableFeatures, "booking");
  const canManage = featureAvailable(availableFeatures, "bookings");
  return (
    <>
      <Card className="welcome" data-dashboard="welcome">
        <span className="eyebrow">YOUR DNATA WORKSPACE</span>
        <h1>Welcome back, Sarah.</h1>
        <p>
          {b.length
            ? `${b.length} saved booking${b.length === 1 ? "" : "s"}. Everything is ready for your travellers.`
            : "Everything is ready for your next guest. Create your first booking to get started."}
        </p>
      </Card>
      {session.draft && (
        <Card title="Your saved booking draft" data-dashboard="draft">
          <p className="muted">
            {route(session.draft)} · {session.draft.adults} adults · Pick up
            where you left off.
          </p>
          <Button secondary disabled={!canBook} onClick={onNew}>
            Resume saved booking
          </Button>
        </Card>
      )}
      <div className="metrics" data-dashboard="metrics">
        <Metric label="Active bookings" value={values.bookings} />
        <Metric label="Corporate savings" value={money(values.savings)} />
        <Metric label="Available credit" value={money(values.credit)} />
      </div>
      <div className="columns">
        <div data-dashboard="services">
          <div className="heading compact">
            <h2>Active services</h2>
            <Button secondary disabled={!canManage} onClick={onBookings}>
              View all bookings →
            </Button>
          </div>
          {servicesBookings.filter((b) => b.status !== "cancelled").length ? (
            <BookingRows
              bookings={servicesBookings
                .filter((b) => b.status !== "cancelled")
                .slice(-2)}
              onOpen={canManage ? onOpen : undefined}
            />
          ) : (
            <Empty
              title="No active bookings yet"
              onCreate={canBook ? onNew : undefined}
            >
              Your confirmed bookings and services will appear here.
            </Empty>
          )}
        </div>
        <Card title="Notifications" data-dashboard="notifications">
          {session.bookings.length ? (
            [...session.bookings]
              .reverse()
              .slice(0, 4)
              .map((item) => (
                <div className="notification" key={item.id}>
                  <b>
                    Booking{" "}
                    {item.status === "cancelled"
                      ? "cancelled"
                      : item.version > 1
                        ? "updated"
                        : "confirmed"}
                  </b>
                  <p>
                    {route(item)} · {money(item.total)}{" "}
                    {item.status === "cancelled"
                      ? "returned to"
                      : "current charge against"}{" "}
                    corporate credit.
                  </p>
                  <small>
                    {new Date(
                      item.history?.at(-1)?.at || item.created,
                    ).toLocaleString()}
                  </small>
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
export function Financials({
  session,
  axisFault = false,
  onOpen,
  availableFeatures,
}) {
  const v = financialValues(session),
    canManage = featureAvailable(availableFeatures, "bookings") && !!onOpen;
  const max = Math.max(100000, ...v.values),
    points = v.values
      .map(
        (value, i) =>
          `${40 + (i * 560) / Math.max(1, v.values.length - 1)},${220 - (value / max) * 180}`,
      )
      .join(" ");
  return (
    <>
      <div className="heading" data-financial="heading">
        <div>
          <h1>Financials & Insights</h1>
          <p>Corporate credit and the activity behind every balance.</p>
        </div>
        <span className="badge">AED · Current session</span>
      </div>
      <Card title="Corporate credit facility" data-financial="credit">
        <p className="muted">
          Global Travel Partners · Illustrative PoC facility
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
          Starts at AED 100,000 with zero opening usage. Bookings consume
          credit; confirmed reductions and cancellations return it.
        </p>
      </Card>
      <div className="metrics" data-financial="metrics">
        <Metric
          label="Active booking value · before discount"
          value={money(v.gross)}
        />
        <Metric label="Savings on active bookings" value={money(v.savings)} />
        <Metric label="Active bookings" value={v.active} />
      </div>
      <div className="columns">
        <Card title="Booking Value Trend" data-financial="trend">
          <p className="fine">
            Cumulative net credit used · each point is a saved transaction, not
            a calendar interval.
          </p>
          <svg
            className="chart"
            viewBox="0 0 640 260"
            role="img"
            aria-label={`Cumulative net credit used ${money(v.net)}`}
          >
            <line x1="40" x2="600" y1="220" y2="220" />
            <text data-financial-axis x="40" y="245">
              Start · {axisFault ? "USD" : "AED"} 0
            </text>
            <text data-financial-axis x="600" y="30" textAnchor="end">
              {axisFault ? money(max).replace("AED", "USD") : money(max)}
            </text>
            <polyline
              points={v.values.length === 1 ? "40,220 600,220" : points}
            />
          </svg>
          {!v.events.length ? (
            <p>No booking activity yet. Ready for the first booking.</p>
          ) : (
            <p>
              {v.events.length} saved transactions · net credit used{" "}
              {money(v.net)}
            </p>
          )}
        </Card>
        <Card title="Most booked services" data-financial="insights">
          <p className="fine">
            Selections across active bookings, not traveller counts. Cancelled
            bookings are excluded.
          </p>
          {v.popular.length ? (
            v.popular.map((s) => (
              <div className="notification" key={s.label}>
                <b>{s.label}</b>
                <p>
                  {s.count} service selection{s.count === 1 ? "" : "s"}
                </p>
              </div>
            ))
          ) : (
            <p>
              {v.events.length
                ? "No active service selections. Previous transactions remain in the history below."
                : "Service insights will appear after the first booking."}
            </p>
          )}
        </Card>
      </div>
      <Card title="Transaction history" data-financial="history">
        <div className="metrics">
          <Metric label="Credit charged" value={money(v.charges)} />
          <Metric label="Credit returned" value={money(v.returns)} />
          <Metric label="Net credit used" value={money(v.net)} />
        </div>
        {v.events.length ? (
          <div className="financial-transactions">
            {[...v.events].reverse().map((e, i) => (
              <div
                className="line"
                data-transaction
                key={`${e.bookingId}-${e.index}`}
              >
                <span>
                  <b>{e.reference}</b> · {e.kind}
                  <br />
                  <small>{new Date(e.at).toLocaleString()}</small>
                </span>
                <b>
                  {e.delta < 0
                    ? "Returned "
                    : e.delta === 0
                      ? "No charge change "
                      : "Charged "}
                  {money(Math.abs(e.delta))}
                </b>
                <Button
                  secondary
                  disabled={!canManage}
                  onClick={() =>
                    onOpen(session.bookings.find((b) => b.id === e.bookingId))
                  }
                >
                  View booking
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p>No transactions yet. No sample charges have been added.</p>
        )}
      </Card>
    </>
  );
}
