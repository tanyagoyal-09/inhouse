import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { BackButton } from "../components/ui/BackButton";
import { LoadingState } from "../components/ui/States";
import { Alert } from "../components/ui/Alert";
import { useFinishTo, useGoBack } from "../navigation/NavigationTracker";
import { PatentDetails } from "../pages/PatentDetails";
import { PatentWizard } from "../pages/PatentWizard";
import api from "../services/api";
import type { Patent } from "../types";

/* ------------------------------------------------------------------
   /patents/:patentId   – details
   Works from a link (instant, using the patent passed in router state)
   AND from a refresh / bookmark / pasted URL (loads it by id).
------------------------------------------------------------------ */

type LoadState = "loading" | "ready" | "unavailable";

function DetailsLoader({ patentId }: { patentId: string }) {
  const location = useLocation();
  const goBack = useGoBack("/patents");

  const statePatent = (location.state as { patent?: Patent } | null)?.patent;
  const initial = statePatent && statePatent._id === patentId ? statePatent : null;

  const [patent, setPatent] = useState<Patent | null>(initial);
  const [state, setState] = useState<LoadState>(initial ? "ready" : "loading");

  useEffect(() => {
    if (initial) return; // PatentDetails refreshes the full record itself
    let mounted = true;

    api
      .get(`/patents/${patentId}`)
      .then((response) => {
        if (!mounted) return;
        if (response.data?.patent) {
          setPatent(response.data.patent);
          setState("ready");
        } else {
          setState("unavailable");
        }
      })
      .catch(() => mounted && setState("unavailable"));

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patentId]);

  if (state === "loading") return <LoadingState label="Loading patent…" />;

  if (state === "unavailable" || !patent) {
    return (
      <div className="mx-auto max-w-xl space-y-5 py-10">
        <Alert tone="error">
          This patent could not be found, or you do not have access to it.
        </Alert>
        <div className="flex gap-3">
          <Link to="/patents" className="btn-primary">
            Go to My Patents
          </Link>
          <BackButton fallback="/patents" />
        </div>
      </div>
    );
  }

  return <PatentDetails patent={patent} onBack={goBack} />;
}

export function PatentDetailsRoute() {
  const { patentId = "" } = useParams();
  // key → a different :patentId remounts with clean state
  return <DetailsLoader key={patentId} patentId={patentId} />;
}

/* ------------------------------------------------------------------
   /patents/new  and  /patents/:patentId/edit  – the drafting wizard
------------------------------------------------------------------ */

export function PatentNewRoute() {
  const goBack = useGoBack("/patents");
  const finish = useFinishTo("/patents");
  return <PatentWizard key="new" onBack={goBack} onSaved={finish} />;
}

export function PatentEditRoute() {
  const { patentId = "" } = useParams();
  const goBack = useGoBack(`/patents/${patentId}`);
  const finish = useFinishTo("/patents");
  return <PatentWizard key={patentId} patentId={patentId} onBack={goBack} onSaved={finish} />;
}
