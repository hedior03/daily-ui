import { useState, useEffect, useCallback, useRef } from "react";
import { Renderer, JSONUIProvider } from "@json-render/react";
import type { Spec } from "@json-render/core";
import { registry } from "../lib/registry";

interface SpecRendererProps {
  category: string;
  tenant: string;
  storageKey: string;
}

const STORAGE_PREFIX = "daily-ui:";

function loadState(
  key: string,
  fallback: Record<string, unknown>
): Record<string, unknown> {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore corrupt storage
  }
  return fallback;
}

function saveState(key: string, state: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(state));
  } catch {
    // Ignore storage full
  }
}

export default function SpecRenderer({
  category,
  tenant,
  storageKey,
}: SpecRendererProps) {
  const [spec, setSpec] = useState<Spec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialState, setInitialState] = useState<Record<string, unknown>>({});

  // Accumulate state changes — onStateChange fires per-field with (path, value)
  const stateRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        const baseUrl = import.meta.env.BASE_URL || "/";
        const response = await fetch(
          `${baseUrl}/api/${category}/${tenant}/latest.json`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch spec: ${response.statusText}`);
        }

        const data: Spec = await response.json();
        setSpec(data);
        const loaded = loadState(storageKey, data.state ?? {});
        setInitialState(loaded);
        stateRef.current = { ...loaded };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    fetchSpec();
  }, [category, tenant, storageKey]);

  const handleStateChange = useCallback(
    (path: string, value: unknown) => {
      stateRef.current[path] = value;
      saveState(storageKey, stateRef.current);
    },
    [storageKey]
  );

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-destructive">
        Error: {error}
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <JSONUIProvider
      registry={registry}
      initialState={initialState}
      handlers={{}}
      onStateChange={handleStateChange}
    >
      <Renderer spec={spec} registry={registry} />
    </JSONUIProvider>
  );
}
