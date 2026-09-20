import { validateDetails, cleanDetails, quote } from "./product.js";
export const isActive = (b) => b.status !== "cancelled";
export const reference = (b) => `GC-${b.id.slice(0, 8).toUpperCase()}`;
export function amendment(booking, draft, available) {
  if (!isActive(booking)) throw Error("Cancelled bookings cannot be modified.");
  const error = validateDetails(draft, true);
  if (error) throw Error(error);
  if (
    draft.adults !== booking.adults ||
    draft.legs.length !== booking.legs?.length ||
    draft.legs.some((l, i) =>
      ["id", "from", "to"].some((k) => l[k] !== booking.legs[i][k]),
    )
  )
    throw Error(
      "Keep the travelling party size and route unchanged. Create a new booking for a different itinerary.",
    );
  const payload = {
    mode: draft.mode,
    adults: draft.adults,
    services: [...draft.services].sort(),
    ...cleanDetails(draft),
  };
  const prices = quote(payload.services, payload.adults);
  const difference = prices.total - booking.total;
  return {
    payload,
    ...prices,
    previousTotal: booking.total,
    difference,
    availableAfter: available - difference,
    affordable: difference <= available,
  };
}
