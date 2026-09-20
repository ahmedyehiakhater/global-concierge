import React, { useState, useId } from "react";
import { AIRPORT_LIST, AIRPORTS } from "../../shared/product.js";
export function AirportPicker({ label, value, onChange }) {
  const [search, setSearch] = useState(null),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(0);
  const id = useId();
  const airport = AIRPORTS[value];
  const text =
    search ??
    (airport ? `${value} · ${airport.city} · ${airport.country}` : "");
  const terms = (search || "").toLowerCase().split(/\s+/).filter(Boolean);
  const matches = AIRPORT_LIST.filter((a) =>
    terms.every((t) =>
      `${a.code} ${a.name} ${a.city} ${a.country}`.toLowerCase().includes(t),
    ),
  )
    .sort(
      (a, b) =>
        Number(b.code === search?.toUpperCase()) -
        Number(a.code === search?.toUpperCase()),
    )
    .slice(0, 30);
  const choose = (a) => {
    onChange(a.code);
    setSearch(null);
    setOpen(false);
    setActive(0);
  };
  return (
    <div
      className="airport-picker"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setOpen(false);
          setSearch(null);
        }
      }}
    >
      <label className="field" htmlFor={id}>
        <span>
          {label} <em>*</em>
        </span>
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={
            open && matches[active] ? `${id}-${active}` : undefined
          }
          required
          value={text}
          placeholder="Search airport, city, country or IATA"
          onFocus={() => {
            setOpen(true);
            setSearch("");
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            onChange("");
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setActive((x) =>
                Math.max(
                  0,
                  Math.min(
                    matches.length - 1,
                    x + (e.key === "ArrowDown" ? 1 : -1),
                  ),
                ),
              );
            }
            if (e.key === "Enter" && open) {
              e.preventDefault();
              if (matches[active]) choose(matches[active]);
            }
          }}
        />
      </label>
      {open && (
        <div className="airport-results" role="listbox" id={`${id}-list`}>
          {matches.map((a, i) => (
            <button
              type="button"
              role="option"
              aria-selected={i === active}
              id={`${id}-${i}`}
              key={a.code}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(a)}
            >
              <b>
                {a.code} · {a.city || a.name}
              </b>
              <small>
                {a.name} · {a.country}
              </small>
            </button>
          ))}
          {!matches.length && (
            <p>No matching airports. Try a city or country.</p>
          )}
          <small className="fine">
            Showing up to 30 matches. Refine your search.
          </small>
        </div>
      )}
    </div>
  );
}
