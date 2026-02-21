import { useState, useEffect, useCallback, useRef } from "react";
import { Renderer, JSONUIProvider } from "@json-render/react";
import type { Spec } from "@json-render/core";
import { registry } from "../lib/registry";

interface SpecRendererProps {
  category: string;
  tenant: string;
  storageKey: string;
  file?: string;
  showDate?: boolean;
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
  file = "latest",
  showDate = false,
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
          `${baseUrl}/api/${category}/${tenant}/${file}.json`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch spec: ${response.statusText}`);
        }

        const data: Spec = await response.json();
        setSpec(data);

        // State isolation: use date as part of the key
        const fullStorageKey = `${storageKey}:${file}`;
        const loaded = loadState(fullStorageKey, data.state ?? {});
        setInitialState(loaded);
        stateRef.current = { ...loaded };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    fetchSpec();
  }, [category, tenant, storageKey, file]);

  const handleStateChange = useCallback(
    (path: string, value: unknown) => {
      const fullStorageKey = `${storageKey}:${file}`;
      stateRef.current[path] = value;
      saveState(fullStorageKey, stateRef.current);
    },
    [storageKey, file]
  );

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-destructive">
        Error loading {file}: {error}
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading {file}...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showDate && file !== "latest" && (
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border"></div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {new Date(file).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <div className="h-px flex-1 bg-border"></div>
        </div>
      )}
      <JSONUIProvider
        registry={registry}
        initialState={initialState}
        handlers={{}}
        onStateChange={handleStateChange}
      >
        <Renderer spec={spec} registry={registry} />
      </JSONUIProvider>
    </div>
  );
}
