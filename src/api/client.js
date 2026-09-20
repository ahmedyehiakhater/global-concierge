// Reusable boundary for the product and future scene controller. Money is integer fils.
let expectedSession;
async function request(path, body, key) {
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
  if (result.id) expectedSession = result.id;
  return result;
}
export const sessionApi = {
  load: () => request("session"),
  saveDraft: (draft) => request("session/draft", draft),
  completeFeature: (feature) => request("session/features", { feature }),
  book: (booking, key) => request("bookings", booking, key),
  reset: (key) => request("session/reset", {}, key),
};
