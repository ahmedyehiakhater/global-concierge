// Select dialogue from this run's released features AND persisted business data.
// Building a feature is not proof that a booking exists.
export function dashboardNarrative(session, built = []) {
  const count = session.bookings.length;
  const bookingBuilt = built.includes("booking");
  const populated = count > 0;
  const mode = populated
    ? "saved-bookings"
    : bookingBuilt
      ? "booking-ready"
      : "dashboard-first";
  return {
    mode,
    populated,
    context: `Scene branch: ${mode}. New Booking ${bookingBuilt ? "released" : "not released"} in this run. ${count} saved booking(s). Dashboard reads the existing ledger; no booking or credit mutation is part of this release.`,
    opening: populated
      ? "We’ve already saved bookings. Let’s bring them, their updates and our remaining credit into one dashboard."
      : bookingBuilt
        ? "Booking is ready. Now let’s build a dashboard that will show each reservation when it’s confirmed."
        : "One place for travel agents and travel desks to see bookings, updates and credit.",
    brief: populated
      ? "Use the bookings we already saved. Show their services, confirmations and actual remaining credit."
      : "What’s booked, what’s changed, and how much credit is available.",
    design: populated
      ? "I’ll design around our saved bookings. Priya will also test an empty-state preview without changing them."
      : bookingBuilt
        ? "No confirmed bookings yet. Make the empty state useful, with a path into our working booking flow."
        : "And a first visit should feel intentional—even before there are bookings.",
    qaIntro: populated
      ? "Our bookings are safe. Switching just this panel to an empty-state test preview."
      : null,
    finding: populated
      ? "The empty-state preview has no explanation."
      : "There’s nothing here.",
    defence: populated
      ? "That’s the test preview. Our bookings are still saved."
      : "There are no bookings.",
    challenge: populated
      ? "Correct. But a real empty account would see a blank panel. Give it a helpful message."
      : "Then tell the user that.",
    product: populated
      ? "Support both states. Then bring our saved bookings back."
      : "No bookings should feel ready—not broken.",
    restored: populated
      ? "Preview passed. Our saved bookings are back, and credit is unchanged."
      : "Now I know what happens next.",
    approval: populated
      ? "Our booking activity and remaining credit, together in one place."
      : "A clear starting point for every journey.",
    handback: populated
      ? "Your dashboard now shows the bookings we already made. Explore it, then click me to build the next feature."
      : bookingBuilt
        ? "Your dashboard is ready. Create a booking in the flow we built and its activity will appear here."
        : "Your dashboard is ready. Explore it, then click me to build the next feature.",
  };
}
