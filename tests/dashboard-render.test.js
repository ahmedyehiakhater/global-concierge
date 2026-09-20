import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("actual Dashboard renders live populated data and gates its actions without changing standalone behaviour", async () => {
  const vite = await createServer({
    configFile: false,
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "silent",
  });
  try {
    const { Dashboard } = await vite.ssrLoadModule("/src/product/pages.jsx");
    const { Shell } = await vite.ssrLoadModule("/src/product/ui.jsx");
    const session = {
      bookings: [
        {
          id: "test-one",
          created: "2026-09-20T00:00:00Z",
          adults: 2,
          services: [],
          legs: [{ from: "DXB", to: "CAI", date: "2026-11-12" }],
          discount: 6400,
          total: 57600,
        },
      ],
      draft: null,
      credit: { available: 9942400 },
    };
    const before = JSON.stringify(session);
    const props = {
      session,
      onNew: () => {},
      onOpen: () => {},
      onBookings: () => {},
    };
    const html = renderToStaticMarkup(
      React.createElement(Dashboard, {
        ...props,
        availableFeatures: ["dashboard"],
      }),
    );
    assert.match(html, /AED\s99,424\.00/);
    assert.match(html, /AED\s64\.00/);
    assert.match(html, /DXB/);
    assert.match(html, /Booking confirmed/);
    assert.match(html, /disabled=""[^>]*>View all bookings/);
    assert.match(html, /disabled=""[^>]*>View booking/);
    const preview = renderToStaticMarkup(
      React.createElement(Dashboard, {
        ...props,
        availableFeatures: ["dashboard"],
        servicesBookings: [],
      }),
    );
    assert.match(preview, /No active bookings yet/);
    assert.match(preview, /AED\s99,424\.00/);
    assert.equal(JSON.stringify(session), before);
    const standalone = renderToStaticMarkup(
      React.createElement(Dashboard, props),
    );
    assert.doesNotMatch(standalone, /disabled=""/);
    const shell = renderToStaticMarkup(
      React.createElement(Shell, {
        page: "dashboard",
        availableFeatures: ["dashboard"],
        onNavigate: () => {},
        onNew: () => {},
        onReset: () => {},
      }),
    );
    assert.match(shell, /disabled=""[^>]*>Search/);
    assert.doesNotMatch(shell, />Financials</);
    assert.match(shell, /aria-current="page"/);
  } finally {
    await vite.close();
  }
});
