import React from "react";
import { Card, Button } from "./ui.jsx";
import { money, route } from "../../shared/product.js";
export function BookingConfirmation({ booking, onNew, onDashboard, onBookings }) {
  if (!booking) return null;
  return (
    <Card className="empty confirmation" data-booking="confirmation">
      <span className="empty-symbol">✓</span>
      <span className="badge">Saved to your demo session</span>
      <h1>Booking confirmed</h1>
      <h2>GC-{booking.id.slice(0, 8).toUpperCase()}</h2>
      <p>
        {route(booking)} ·{" "}
        {booking.travellers
          ?.map((t) => `${t.firstName} ${t.lastName}`)
          .join(", ")}
      </p>
      <p>
        <b>{money(booking.total)}</b> deducted from corporate credit.
      </p>
      <p className="fine">No real airport reservation was made.</p>
      <div className="pager">
        <Button onClick={onNew}>New booking</Button>
        {onBookings && <Button secondary onClick={onBookings}>View booking</Button>}
        {onDashboard && (
          <Button secondary onClick={onDashboard}>
            Back to Dashboard
          </Button>
        )}
      </div>
    </Card>
  );
}
