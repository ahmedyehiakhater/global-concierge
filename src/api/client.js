// Reusable boundary for the product and future scene controller. Money is integer fils.
let expectedSession,
  requestEpoch = 0;
async function request(path, body, key) {
  const epoch = ++requestEpoch;
  const response = await fetch(`/api/${path}`, {
    credentials: "same-origin",
    ...(body === undefined
      ? {}
      : {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-GC-Demo": "1",
            ...(expectedSession ? { "X-GC-Session": expectedSession } : {}),
            ...(key ? { "Idempotency-Key": key } : {}),
          },
          body: JSON.stringify(body),
        }),
  });
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error(
      "The session service is unavailable. Start the backend and try again.",
    );
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || "Unable to save.");
    error.status = response.status;
    throw error;
  }
  if (result.id && epoch === requestEpoch) expectedSession = result.id;
  return result;
}
export const sessionApi = {
  load: () => request("session"),
  quoteAmend: (body) => request("bookings/quote",body),
  amend: (body,key) => request("bookings/amend",body,key),
  cancelBooking: (body,key) => request("bookings/cancel",body,key),
  saveDraft: (draft) => request("session/draft", draft),
  completeFeature: (feature) => request("session/features", { feature }),
  saveRehearsalDraft: (draft) => request("session/rehearsal-draft", draft),
  bookRehearsal: (booking, key) => request("bookings/rehearsal", booking, key),
  book: (booking, key) => request("bookings", booking, key),
  reset: (key) => request("session/reset", {}, key),
};
