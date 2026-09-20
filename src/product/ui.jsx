import React from "react";
import logo from "../../references/designs/shared/dnata-logo.svg";
import {
  money,
  route,
  serviceInfo,
  selectionContext,
  quantity,
  unitLabel,
} from "../../shared/product.js";
import {
  LayoutDashboard,
  Store,
  CalendarDays,
  Wallet,
  Users,
  ChartColumn,
  Building2,
  Wrench,
  Search,
  Bell,
  Settings,
  Plus,
} from "lucide-react";
export { logo };
export function Button({ children, secondary = false, ...props }) {
  return (
    <button className={"button" + (secondary ? " secondary" : "")} {...props}>
      {children}
    </button>
  );
}
export function Card({ title, children, className = "" }) {
  return (
    <section className={"card " + className}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
export function Field({ label, ...props }) {
  return (
    <label className="field">
      <span>
        {label}
        {props.required && <em> *</em>}
      </span>
      <input {...props} />
    </label>
  );
}
export function Metric({ label, value, caption }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {caption && <small>{caption}</small>}
    </div>
  );
}
export function Empty({ title, children, onCreate }) {
  return (
    <Card className="empty">
      <span className="empty-symbol" aria-hidden="true">
        ＋
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {onCreate && <Button onClick={onCreate}>Create a booking</Button>}
    </Card>
  );
}
export function Shell({ page, onNavigate, onNew, onReset, busy, children }) {
  const [search, setSearch] = React.useState("");
  const nav = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["marketplace", "Marketplace", Store],
    ["bookings", "Bookings", CalendarDays],
    ["financials", "Financials", Wallet],
    ["clients", "Clients", Users],
    ["reports", "Reports", ChartColumn],
    ["corporate", "Corporate Accounts", Building2],
    ["tools", "Agent Tools", Wrench],
  ];
  return (
    <>
      <header className="topbar">
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("dashboard");
          }}
        >
          <img src={logo} alt="dnata" />
        </a>
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            onNavigate("bookings", search);
          }}
        >
          <Search size={20} aria-hidden="true" />
          <input
            aria-label="Search bookings"
            placeholder="Search bookings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={busy}
          />
          <button className="search-submit" disabled={busy} type="submit">
            Search
          </button>
        </form>
        <div className="header-actions">
          <Button onClick={onNew} disabled={busy}>
            <Plus size={18} aria-hidden="true" /> New Booking
          </Button>
          <button
            className="icon"
            title="Notifications are shown on Dashboard"
            onClick={() => onNavigate("dashboard")}
            aria-label="Notifications"
          >
            <Bell size={20} aria-hidden="true" />
          </button>
          <button
            className="icon"
            disabled
            aria-label="Settings"
            title="Settings are not part of this demo"
          >
            <Settings size={20} aria-hidden="true" />
          </button>
          <button
            className="avatar"
            title="Demo account: Sarah Jenkins"
            onClick={() => onNavigate("dashboard")}
          >
            SJ
          </button>
        </div>
      </header>
      <aside className="sidebar">
        <div className="workspace">
          <span className="eyebrow">AGENT PORTAL</span>
          <b>Global Travel Partners</b>
          <small>Premium Concierge</small>
        </div>
        <nav aria-label="Primary navigation">
          {nav.map(([key, label, Icon]) => (
            <button
              key={key}
              disabled={
                busy || !["dashboard", "bookings", "financials"].includes(key)
              }
              aria-current={
                page === key ||
                (key === "bookings" &&
                  ["booking", "detail", "confirmation"].includes(page))
                  ? "page"
                  : undefined
              }
              onClick={() => onNavigate(key)}
            >
              <Icon size={21} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="badge">Fursa Tek · Local demo</span>
          <Button secondary disabled={busy} onClick={onReset}>
            Reset for next visitor
          </Button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </>
  );
}
export function BookingRows({ bookings, onOpen }) {
  return (
    <div className="booking-grid">
      {[...bookings].reverse().map((b) => (
        <Card key={b.id}>
          <div className="split">
            <small className="muted">GC-{b.id.slice(0, 8).toUpperCase()}</small>
            <span className="badge">Confirmed · demo</span>
          </div>
          <h3>{route(b)}</h3>
          <b>
            {b.travellers
              ?.map((t) => t.firstName + " " + t.lastName)
              .join(", ") || `${b.adults} adults`}
          </b>
          <p className="muted">
            {b.legs?.[0]?.date || new Date(b.created).toLocaleDateString()} ·{" "}
            {b.adults} adults · {b.services.length} airport services
          </p>
          <div className="split">
            <strong>{money(b.total)}</strong>
            <Button secondary onClick={() => onOpen(b)}>
              View booking
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
export function BookingDetail({ booking: b, onBack }) {
  if (!b)
    return (
      <Empty title="Booking not found">
        Choose a saved booking from the list.
      </Empty>
    );
  return (
    <>
      <div className="heading">
        <div>
          <span className="eyebrow">GC-{b.id.slice(0, 8).toUpperCase()}</span>
          <h1>Booking details</h1>
          <p>
            {route(b)} · <span className="badge">Confirmed · demo</span>
          </p>
        </div>
        <Button secondary onClick={onBack}>
          Back to bookings
        </Button>
      </div>
      <div className="columns">
        <div>
          <Card title="Journey">
            {(b.legs || []).map((l, i) => (
              <p key={i}>
                <b>
                  Flight {i + 1} · {l.from} → {l.to}
                </b>
                <br />
                {l.date} · {l.flight}
              </p>
            ))}
          </Card>
          <Card title="Travellers">
            {(b.travellers || []).map((t, i) => (
              <p key={i}>
                {t.firstName} {t.lastName}
                {i === 0 ? " · Lead traveller" : ""}
              </p>
            ))}
            <p className="muted">
              {b.email} · {b.phone}
            </p>
          </Card>
          <Card title="Airport services">
            {b.services.map((id) => (
              <p key={id}>
                <b>
                  {b.legs?.length
                    ? `Flight ${selectionContext(id, b.legs).legIndex + 1} · `
                    : ""}
                  {selectionContext(id, b.legs).airport} ·{" "}
                  {selectionContext(id, b.legs).direction}
                </b>
                <br />
                {serviceInfo(id)?.name || "Airport service"} ·{" "}
                {quantity(id, b.adults)} × {unitLabel(id)}
              </p>
            ))}
          </Card>
        </div>
        <Card title="Corporate credit charge">
          <div className="line">
            <span>Subtotal</span>
            <b>{money(b.subtotal)}</b>
          </div>
          <div className="line">
            <span>Corporate discount</span>
            <b>− {money(b.discount)}</b>
          </div>
          <div className="line total">
            <span>Credit deducted</span>
            <strong>{money(b.total)}</strong>
          </div>
          <p className="muted">
            Saved on {new Date(b.created).toLocaleString()}. No real airport
            reservation has been made.
          </p>
        </Card>
      </div>
    </>
  );
}
