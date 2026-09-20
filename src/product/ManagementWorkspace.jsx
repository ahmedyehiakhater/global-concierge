import React, { useEffect, useMemo, useState } from "react";
import { Management } from "./Management.jsx";
import { ManagementController } from "./managementController.js";
import { sessionApi } from "../api/client.js";
export function ManagementWorkspace({
  session,
  onSession,
  onNew,
  initialBooking,
  initialQuery = "",
}) {
  const [state, setState] = useState(null);
  const c = useMemo(
    () => new ManagementController(sessionApi, sessionStorage, setState),
    [],
  );
  c.onSession = onSession;
  useEffect(() => {
    c.begin(session);
    if (initialBooking && !c.pending) c.open(initialBooking);
    return () => c.cancel();
  }, [session.id, initialBooking?.id]);
  return state ? (
    <Management
      controller={c}
      state={state}
      session={session}
      initialQuery={initialQuery}
      canBook
      onNew={onNew}
    />
  ) : null;
}
