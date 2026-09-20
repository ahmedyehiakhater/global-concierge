// Omitted availability means the standalone product; a supplied list means staged release.
export function featureAvailable(features, feature) {
  return features == null || features.includes(feature);
}
export function routeFeature(page) {
  return { detail: "bookings", confirmation: "booking" }[page] || page;
}
export function dashboardValues(session) {
  return {
    bookings: session.bookings.filter((b) => b.status !== "cancelled").length,
    savings: session.bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + b.discount, 0),
    credit: session.credit.available,
  };
}
