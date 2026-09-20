import React, { useEffect, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { createProductController } from "./controller.js";
import { Login, Dashboard, Bookings, Financials } from "./pages.jsx";
import { Shell, Card, Button, BookingDetail } from "./ui.jsx";
import { BookingWizard } from "./BookingWizard.jsx";
import "./product.css";
export const product = createProductController();
function App() {
  const s = useSyncExternalStore(product.subscribe, product.getSnapshot);
  const [resetOpen, setResetOpen] = useState(false);
  useEffect(() => {
    product.load();
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [s.page, s.draft.step, s.signedIn]);
  const reset = async () => {
    await product.reset();
    setResetOpen(false);
  };
  if (!s.session)
    return (
      <main className="startup">
        <h1>Global Concierge</h1>
        <p role="status">{s.error || "Opening your saved workspace…"}</p>
        {s.error && <Button onClick={() => product.load()}>Try again</Button>}
      </main>
    );
  const status = (
    <div
      className={"status " + (s.error ? "error" : "")}
      role={s.error ? "alert" : "status"}
    >
      {s.busy ? "Saving…" : s.error || s.notice}
    </div>
  );
  if (!s.signedIn)
    return (
      <>
        {status}
        <Login onEnter={product.enter} busy={s.busy} />
      </>
    );
  return (
    <>
      <Shell
        page={s.page}
        onNavigate={product.navigate}
        onNew={product.startBooking}
        onReset={() => setResetOpen(true)}
        busy={s.busy}
      >
        {status}
        {s.page === "dashboard" && (
          <Dashboard
            session={s.session}
            onNew={product.startBooking}
            onOpen={product.openBooking}
            onBookings={() => product.navigate("bookings")}
          />
        )}
        {s.page === "bookings" && (
          <Bookings
            key={s.search || "all"}
            initialQuery={s.search || ""}
            session={s.session}
            onNew={product.startBooking}
            onOpen={product.openBooking}
          />
        )}
        {s.page === "financials" && <Financials session={s.session} />}
        {s.page === "booking" && (
          <BookingWizard
            key={s.session.id}
            draft={s.draft}
            session={s.session}
            onChange={product.changeDraft}
            onSave={product.saveDraft}
            onConfirm={product.confirm}
            busy={s.busy}
          />
        )}
        {s.page === "detail" && (
          <BookingDetail
            booking={s.detail}
            onBack={() => product.navigate("bookings")}
          />
        )}
        {s.page === "confirmation" && (
          <>
            <Card className="empty confirmation">
              <span className="empty-symbol">✓</span>
              <span className="badge">Saved to your demo session</span>
              <h1>Booking confirmed</h1>
              <p>
                Your booking is saved and the discounted amount has been
                deducted from corporate credit.
              </p>
              <p className="fine">No real airport reservation was made.</p>
              <Button onClick={() => product.navigate("bookings")}>
                View all bookings
              </Button>
            </Card>
            <BookingDetail
              booking={s.detail}
              onBack={() => product.navigate("bookings")}
            />
          </>
        )}
      </Shell>
      {resetOpen && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            className="card modal"
          >
            <h2 id="reset-title">Ready for the next visitor?</h2>
            <p>
              This visitor’s bookings and saved draft will be archived. The next
              visitor starts with a clean workspace and the initial demo credit
              balance.
            </p>
            <div className="pager">
              <Button
                secondary
                disabled={s.busy}
                onClick={() => setResetOpen(false)}
              >
                Keep this session
              </Button>
              <Button disabled={s.busy} onClick={reset}>
                Archive & start fresh
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
