import { useState, useEffect } from "react";
import SpecRenderer from "./SpecRenderer";

interface SpecTimelineProps {
  category: string;
  tenant: string;
  storageKey: string;
}

interface SpecIndex {
  category: string;
  tenant: string;
  specs: string[];
}

export default function SpecTimeline({
  category,
  tenant,
  storageKey,
}: SpecTimelineProps) {
  const [index, setIndex] = useState<SpecIndex | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIndex = async () => {
      try {
        const baseUrl = import.meta.env.BASE_URL || "/";
        const response = await fetch(
          `${baseUrl}/api/${category}/${tenant}/index.json`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch index: ${response.statusText}`);
        }

        const data: SpecIndex = await response.json();
        // Index returns all json filenames, including 'latest' and date-stamped ones
        // We only want the unique dates
        const dateSpecs = data.specs.filter((s) => s !== "latest");
        setIndex({ ...data, specs: dateSpecs });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    fetchIndex();
  }, [category, tenant]);

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-destructive">
        Error loading history: {error}
      </div>
    );
  }

  if (!index) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading history...
      </div>
    );
  }

  if (index.specs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No history available yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      {index.specs.map((file) => (
        <SpecRenderer
          key={file}
          category={category}
          tenant={tenant}
          storageKey={storageKey}
          file={file}
          showDate={true}
        />
      ))}
    </div>
  );
}
