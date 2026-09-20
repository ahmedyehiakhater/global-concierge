import { sessionApi } from "./api/client.js";
const $ = (id) => document.getElementById(id),
  money = (value) =>
    new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
    }).format(value / 100);
let state = null,
  busy = false;
const pending = new Map();
function render(data) {
  state = data;
  $("session").textContent =
    `Session ${data.id} · started ${new Date(data.created).toLocaleString()}`;
  for (const field of ["limit", "used", "available"])
    $(field).textContent = money(data.credit[field]);
  $("features").textContent = data.features.length
    ? data.features.join(" · ")
    : "Nothing built yet.";
  const rows = data.bookings.map((b) => {
    const row = document.createElement("p");
    row.className = "booking";
    row.textContent = `${b.mode === "single" ? "DXB → CAI" : "DXB → CAI → LHR"} · ${b.adults} adults · Subtotal ${money(b.subtotal)} − corporate discount ${money(b.discount)} = ${money(b.total)} charged to credit`;
    return row;
  });
  $("bookings").replaceChildren(...rows);
  if (!rows.length)
    $("bookings").textContent = "No bookings in this session yet.";
}
async function run(action, message) {
  if (busy) return;
  busy = true;
  document.querySelectorAll("button").forEach((b) => (b.disabled = true));
  $("status").className = "";
  $("status").textContent = "Saving…";
  try {
    render(await action());
    $("status").textContent = message;
  } catch (e) {
    $("status").textContent = e.message;
    $("status").className = "error";
  } finally {
    busy = false;
    document
      .querySelectorAll("button")
      .forEach((b) => (b.disabled = !state && b.id !== "reload"));
  }
}
// Keep the same key while an operation is uncertain; a successful operation clears it.
async function once(kind, fn) {
  const key = pending.get(kind) || crypto.randomUUID();
  pending.set(kind, key);
  const result = await fn(key);
  pending.delete(kind);
  return result;
}
$("reload").onclick = () =>
  run(() => sessionApi.load(), "Saved session loaded.");
$("complete").onclick = () =>
  run(
    () => sessionApi.completeFeature($("feature").value),
    "Feature progress saved.",
  );
$("book").onclick = () => {
  const mode = $("journey").value;
  run(
    () =>
      once("book:" + mode, (key) =>
        sessionApi.book(
          {
            mode,
            adults: 2,
            services:
              mode === "single"
                ? ["dxb_departure", "cai_arrival"]
                : [
                    "dxb_departure",
                    "cai_arrival",
                    "cai_departure",
                    "lhr_arrival",
                  ],
          },
          key,
        ),
      ),
    "Booking saved. Corporate credit updated.",
  );
};
$("reset").onclick = () =>
  run(async () => {
    const result = await once("reset", (key) => sessionApi.reset(key));
    pending.clear();
    return result;
  }, "Previous session archived. Ready for the next visitor.");
run(
  () => sessionApi.load(),
  "Session ready. Refreshing the page will keep your saved progress.",
);
