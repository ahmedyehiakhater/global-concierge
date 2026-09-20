import { Management } from "../product/Management.jsx";
import { quote } from "../../shared/product.js";
import { amendment } from "../../shared/management.js";
import React from "react";
import { createRoot } from "react-dom/client";
import { Login, Dashboard, Financials } from "../product/pages.jsx";
import { BookingWizard } from "../product/BookingWizard.jsx";
import { BookingConfirmation } from "../product/BookingConfirmation.jsx";
import { sampleDraft } from "../../shared/product.js";
import { Shell, Card } from "../product/ui.jsx";
import "../product/product.css";
const view = new URLSearchParams(location.search).get("view");
const financial = view?.startsWith("financials-");
const dashboard = view?.startsWith("dashboard");
const manage = view?.startsWith("manage-");
const booking = view?.startsWith("booking-");
const draft = sampleDraft(1, 2);
draft.step = Math.max(
  0,
  ["journey", "travellers", "services", "review", "credit"].indexOf(
    view?.slice(8),
  ),
);
const populated =
  view === "dashboard-populated" || view === "financials-populated";
const example = {
  id: "qa-preview",
  created: "2026-09-20T08:00:00Z",
  adults: 2,
  legs: [{ from: "DXB", to: "CAI", date: "2026-11-12", flight: "EK 927" }],
  travellers: [
    { firstName: "James", lastName: "Sterling" },
    { firstName: "Amelia", lastName: "Sterling" },
  ],
  services: ["preview:departure:dxb_departure", "preview:arrival:cai_arrival"],
  subtotal: 64000,
  total: 57600,
  discount: 6400,
};
const session = {
  bookings: populated ? [example] : [],
  draft: null,
  discountPercent: 10,
  credit: {
    limit: 10000000,
    used: populated ? 57600 : 0,
    available: populated ? 9942400 : 10000000,
  },
};
const managed = {
  ...draft,
  ...quote(draft.services, draft.adults),
  id: "qa-preview",
  version: 1,
  status: "confirmed",
  created: new Date().toISOString(),
  history: [],
};
const manageView = view?.slice(7) || "list";
const manageState = {
  view: manageView,
  selected: managed,
  draft: managed,
  quote: amendment(managed, managed, session.credit.available),
  busy: false,
};
const previewController = new Proxy(
  { preview: managed },
  { get: (target, key) => (key in target ? target[key] : () => {}) },
);
createRoot(document.querySelector("#root")).render(
  view === "shell" || dashboard || booking || manage || financial ? (
    <div className="shell-design">
      <Shell
        page={
          financial
            ? "financials"
            : manage
              ? "bookings"
              : booking
                ? "booking"
                : dashboard
                  ? "dashboard"
                  : "empty"
        }
        availableFeatures={
          financial
            ? ["financials"]
            : manage
              ? ["bookings"]
              : booking
                ? ["booking"]
                : dashboard
                  ? ["dashboard"]
                  : []
        }
        busy={!dashboard}
        onNavigate={() => {}}
        onNew={() => {}}
        onReset={() => {}}
      >
        {financial ? (
          <Financials session={session} availableFeatures={["financials"]} />
        ) : manage ? (
          <Management
            controller={previewController}
            state={manageState}
            session={session}
            canBook={false}
            preview
          />
        ) : booking ? (
          <>
            <p className="badge">
              Illustrative design preview · no booking is submitted
            </p>
            {view === "booking-confirmation" ? (
              <BookingConfirmation
                booking={{ ...example, id: "qa-preview" }}
                onNew={() => {}}
              />
            ) : (
              <BookingWizard
                draft={draft}
                session={session}
                busy={false}
                onChange={() => {}}
                onSave={() => {}}
                onConfirm={() => {}}
              />
            )}
          </>
        ) : dashboard ? (
          <>
            {populated && (
              <p className="badge">
                Illustrative QA design preview · not saved visitor data
              </p>
            )}
            <Dashboard session={session} availableFeatures={["dashboard"]} />
          </>
        ) : (
          <Card className="empty">
            <h1>Nothing here yet</h1>
            <p>Your workspace is ready. Choose a feature to build.</p>
          </Card>
        )}
      </Shell>
    </div>
  ) : (
    <Login busy onEnter={() => {}} />
  ),
);
const style = document.createElement("style");
style.textContent = ".shell-design .sidebar-bottom{display:none}";
document.head.append(style);
