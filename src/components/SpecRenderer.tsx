import { useState, useEffect, useCallback } from "react";
import { Renderer, StateProvider, ActionProvider } from "@json-render/react";
import { registry } from "../lib/registry";

interface Spec {
  root: string;
  elements: Record<string, unknown>;
  state?: Record<string, unknown>;
}

interface SpecRendererProps {
  spec: Spec;
  storageKey: string;
}

function loadState(key: string, fallback: Record<string, unknown>) {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(`daily-ui:${key}`);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore corrupt storage
  }
  return fallback;
}

function saveState(key: string, state: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`daily-ui:${key}`, JSON.stringify(state));
  } catch {
    // Ignore storage full
  }
}

export default function SpecRenderer({ spec, storageKey }: SpecRendererProps) {
  const [initialState, setInitialState] = useState<Record<string, unknown>>(
    () => loadState(storageKey, spec.state ?? {})
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hydrate from localStorage on client
    setInitialState(loadState(storageKey, spec.state ?? {}));
    setReady(true);
  }, [storageKey, spec.state]);

  const handleStateChange = useCallback(
    (state: Record<string, unknown>) => {
      saveState(storageKey, state);
    },
    [storageKey]
  );

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <StateProvider initialState={initialState} onStateChange={handleStateChange}>
      <ActionProvider handlers={{}}>
        <Renderer spec={spec} registry={registry} />
      </ActionProvider>
    </StateProvider>
  );
}
