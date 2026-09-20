import airportList from "./data/airports.json" with { type: "json" };
export const AIRPORT_LIST = airportList;
export const AIRPORTS = Object.fromEntries(airportList.map((a) => [a.code, a]));
export const CREDIT_LIMIT = 10000000;
export const DISCOUNT_PERCENT = 10;
export const SERVICES = {
  dxb_departure: {
    airport: "DXB",
    direction: "departure",
    name: "Meet & greet",
    description:
      "Check-in assistance and an escort through departure formalities.",
    category: "Airport assistance",
    price: 18000,
  },
  cai_arrival: {
    airport: "CAI",
    direction: "arrival",
    name: "Arrival assistance",
    description: "A welcome on arrival and an escort through the terminal.",
    category: "Airport assistance",
    price: 14000,
  },
  cai_departure: {
    airport: "CAI",
    direction: "departure",
    name: "Meet & greet",
    description: "Departure assistance from the meeting point to your gate.",
    category: "Airport assistance",
    price: 11000,
  },
  lhr_arrival: {
    airport: "LHR",
    direction: "arrival",
    name: "Arrival assistance",
    description: "Meet on arrival and assistance to onward transport.",
    category: "Airport assistance",
    price: 9000,
  },
};

Object.assign(SERVICES, {
  meet_departure: {
    direction: "departure",
    name: "Meet & greet",
    description: "Check-in assistance and a guided departure.",
    category: "Airport assistance",
    price: 18000,
  },
  meet_arrival: {
    direction: "arrival",
    name: "Meet & greet",
    description: "A welcome on arrival and assistance through the terminal.",
    category: "Airport assistance",
    price: 14000,
  },
  lounge: {
    direction: "departure",
    name: "Lounge access",
    description: "Relax before departure with refreshments and seating.",
    category: "Lounge & VIP",
    price: 22000,
  },
  vip: {
    directions: ["departure", "arrival"],
    name: "VIP assistance",
    description: "Dedicated personal assistance through airport formalities.",
    category: "Lounge & VIP",
    price: 65000,
  },
  chauffeur: {
    directions: ["departure", "arrival"],
    name: "Chauffeur transfer",
    description: "One airport transfer. Up to four travellers per vehicle.",
    category: "Transfers & baggage",
    price: 28000,
    unit: "vehicle",
  },
  porter: {
    directions: ["departure", "arrival"],
    name: "Porter / baggage assistance",
    description: "Assistance with up to two bags per traveller.",
    category: "Transfers & baggage",
    price: 8000,
  },
  home_checkin: {
    airport: "DXB",
    direction: "departure",
    name: "Home / hotel check-in",
    description:
      "Dubai departure only. Remote check-in and baggage collection for your party.",
    category: "Transfers & baggage",
    price: 35000,
    unit: "booking",
  },
});

export const serviceId = (key) =>
  typeof key === "string" ? key.split(":").at(-1) : "";
export const serviceInfo = (key) => SERVICES[serviceId(key)];
export const selectionKey = (leg, id, direction = SERVICES[id]?.direction) =>
  `${leg.id}:${direction}:${id}`;
export const servicesFor = (leg, direction) =>
  Object.entries(SERVICES).filter(
    ([id, s]) =>
      (s.direction === direction || s.directions?.includes(direction)) &&
      (!s.airport ||
        s.airport === (direction === "departure" ? leg.from : leg.to)) &&
      !(
        id.startsWith("meet_") &&
        Object.values(SERVICES).some(
          (x) =>
            x.airport === (direction === "departure" ? leg.from : leg.to) &&
            x.direction === direction &&
            x.name
              .toLowerCase()
              .includes(direction === "arrival" ? "arrival" : "meet"),
        )
      ),
  );
export const quantity = (key, adults) =>
  serviceInfo(key)?.unit === "vehicle"
    ? Math.ceil(adults / 4)
    : serviceInfo(key)?.unit === "booking"
      ? 1
      : adults;
export const unitLabel = (key) =>
  serviceInfo(key)?.unit === "vehicle"
    ? "per vehicle · 4 travellers"
    : serviceInfo(key)?.unit === "booking"
      ? "per booking"
      : "per adult";
export const lineTotal = (key, adults) =>
  (serviceInfo(key)?.price || 0) * quantity(key, adults);
export const selectionContext = (key, legs = []) => {
  const s = serviceInfo(key);
  const parts = key.split(":");
  const leg = legs.find((l) => l.id === parts[0]);
  const direction = parts.length === 3 ? parts[1] : s?.direction;
  return {
    direction,
    airport: leg ? leg[direction === "departure" ? "from" : "to"] : s?.airport,
    legIndex: legs.indexOf(leg),
  };
};
export const quote = (selections, adults) => {
  const subtotal = selections.reduce(
    (sum, key) => sum + lineTotal(key, adults),
    0,
  );
  const discount = Math.round((subtotal * DISCOUNT_PERCENT) / 100);
  return { subtotal, discount, total: subtotal - discount };
};
export const money = (value) =>
  new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" }).format(
    value / 100,
  );
export function route(value) {
  if (typeof value === "string")
    return value === "multi" ? "DXB → CAI → LHR" : "DXB → CAI";
  const legs = value?.legs || [];
  if (!legs.length) return route(value?.mode || "single");
  return legs
    .map(
      (l, i) =>
        (i && legs[i - 1].to === l.from ? "" : `${l.from || "…"} → `) +
        (l.to || "…"),
    )
    .join(" → ");
}
export const blankLeg = (from = "") => ({
  id: crypto.randomUUID(),
  from,
  to: "",
  date: "",
  flight: "",
});
export function newDraft() {
  return {
    schemaVersion: 2,
    mode: "single",
    adults: 1,
    services: [],
    travellers: [{ firstName: "", lastName: "" }],
    email: "",
    phone: "",
    legs: [blankLeg()],
    step: 0,
  };
}
export function sampleDraft(count = 1, adults = 2) {
  const codes = ["DXB", "CAI", "LHR"];
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 14);
  const legs = Array.from({ length: count }, (_, i) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + i * 3);
    return {
      id: crypto.randomUUID(),
      from: codes[i % 3],
      to: codes[(i + 1) % 3],
      date: date.toISOString().slice(0, 10),
      flight: ["EK 927", "MS 777", "EK 004"][i % 3],
    };
  });
  return {
    schemaVersion: 2,
    mode: count > 1 ? "multi" : "single",
    adults,
    services: legs.flatMap((l) =>
      ["departure", "arrival"].flatMap((dir) =>
        servicesFor(l, dir)
          .filter(([id]) =>
            [
              "dxb_departure",
              "cai_arrival",
              "cai_departure",
              "lhr_arrival",
              "meet_departure",
              "meet_arrival",
            ].includes(id),
          )
          .map(([id]) => selectionKey(l, id, dir)),
      ),
    ),
    travellers: Array.from({ length: adults }, (_, i) => ({
      firstName: ["James", "Amelia", "Alex", "Taylor"][i % 4],
      lastName: "Sterling",
    })),
    email: "james.sterling@example.com",
    phone: "+971 50 000 0000",
    legs,
    step: 0,
  };
}
export function normalizeDraft(p) {
  if (!p) return newDraft();
  if (p.schemaVersion === 2) return p;
  const legs = (p.legs || [])
    .slice(0, p.mode === "multi" ? undefined : 1)
    .map((l, i) => ({ ...l, id: l.id || `legacy-leg-${i + 1}` }));
  const services = (p.services || []).flatMap((id) => {
    const s = serviceInfo(id);
    const leg = legs.find(
      (l) => s && l[s.direction === "departure" ? "from" : "to"] === s.airport,
    );
    return leg ? [selectionKey(leg, serviceId(id))] : [];
  });
  return { ...p, schemaVersion: 2, legs, services };
}
export function validSelections(p) {
  return (p.services || []).filter((key) =>
    p.legs.some((l) =>
      ["departure", "arrival"].some((dir) =>
        servicesFor(l, dir).some(
          ([id]) =>
            key === selectionKey(l, id, dir) ||
            (key === `${l.id}:${id}` && SERVICES[id].direction === dir),
        ),
      ),
    ),
  );
}
const bounded = (v, max) => typeof v === "string" && v.length <= max;
export function validateShape(p) {
  if (
    !p ||
    typeof p !== "object" ||
    !["single", "multi"].includes(p.mode) ||
    !Number.isInteger(p.adults) ||
    p.adults < 1 ||
    p.adults > 20
  )
    return "Choose 1–20 adults and a journey type.";
  if (
    !Array.isArray(p.legs) ||
    !p.legs.length ||
    (p.mode === "single" && p.legs.length !== 1) ||
    (p.mode === "multi" && p.legs.length < 2) ||
    p.legs.some(
      (l) =>
        !l ||
        !bounded(l.id, 80) ||
        !/^[a-zA-Z0-9-]+$/.test(l.id) ||
        !bounded(l.from, 3) ||
        !bounded(l.to, 3) ||
        !bounded(l.date, 10) ||
        !bounded(l.flight, 20),
    ) ||
    new Set(p.legs.map((l) => l.id)).size !== p.legs.length
  )
    return "Supply valid, distinct flights.";
  if (
    !Array.isArray(p.services) ||
    p.services.some((key) => !bounded(key, 130)) ||
    new Set(p.services).size !== p.services.length ||
    validSelections(p).length !== p.services.length
  )
    return "A selected service does not belong to its flight or airport.";
  if (
    !Array.isArray(p.travellers) ||
    p.travellers.length !== p.adults ||
    p.travellers.some(
      (t) => !t || !bounded(t.firstName, 60) || !bounded(t.lastName, 60),
    )
  )
    return "Enter a first and last name for each traveller.";
  if (!bounded(p.email, 120) || !bounded(p.phone, 40))
    return "Enter valid contact details.";
  return null;
}
export const validDate = (date) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  Number.isFinite(Date.parse(date)) &&
  new Date(date).toISOString().slice(0, 10) === date;
export function journeyError(p) {
  for (const [i, l] of p.legs.entries()) {
    if (!AIRPORTS[l.from] || !AIRPORTS[l.to])
      return `Choose a departure and arrival airport for flight ${i + 1}.`;
    if (l.from === l.to)
      return `Departure and arrival must differ on flight ${i + 1}.`;
    if (!validDate(l.date))
      return `Enter a valid flight date for flight ${i + 1}.`;
    if (!/^[A-Za-z0-9]{2,3}\s?\d{1,4}[A-Za-z]?$/.test(l.flight.trim()))
      return `Enter a valid flight number for flight ${i + 1}, such as EK 927.`;
    if (i && l.date < p.legs[i - 1].date)
      return `Flight ${i + 1} cannot depart before the previous flight.`;
  }
  return null;
}
export function travellerError(p) {
  if (
    p.travellers.some(
      (t) =>
        !t.firstName.trim() ||
        !t.lastName.trim() ||
        /[<>\d]/.test(t.firstName + t.lastName),
    )
  )
    return "Enter a first and last name for every traveller (letters, spaces or name punctuation).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim()))
    return "Enter a valid contact email, such as name@example.com.";
  if (
    !/^\+?[\d ()-]{7,25}$/.test(p.phone.trim()) ||
    p.phone.replace(/\D/g, "").length < 7
  )
    return "Enter a valid phone number including country code.";
  return null;
}
export function stepError(p, step = p.step) {
  const shape = validateShape(p);
  if (shape) return shape;
  const journey = journeyError(p);
  if (journey) return journey;
  if (step >= 1) {
    const people = travellerError(p);
    if (people) return people;
  }
  if (step >= 2 && !p.services.length)
    return "Select at least one airport service to continue.";
  return null;
}
export function validateDetails(p, complete = true) {
  const shape = validateShape(p);
  return shape || (complete ? stepError(p, 4) : null);
}
export function cleanDetails(p) {
  return {
    schemaVersion: 2,
    travellers: p.travellers.map((t) => ({
      firstName: t.firstName.trim(),
      lastName: t.lastName.trim(),
    })),
    email: p.email.trim(),
    phone: p.phone.trim(),
    legs: p.legs.map((l) => ({
      id: l.id,
      from: l.from,
      to: l.to,
      date: l.date,
      flight: l.flight.trim().toUpperCase(),
    })),
  };
}

// Keep the persisted journey type derived from its flights, preserving stable service IDs.
export function withFlights(draft, flights) {
  if (!Array.isArray(flights) || !flights.length)
    throw new Error("A journey needs at least one flight.");
  const next = {
    ...draft,
    legs: flights,
    mode: flights.length > 1 ? "multi" : "single",
  };
  return { ...next, services: validSelections(next) };
}
