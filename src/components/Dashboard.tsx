import { useState, useEffect } from "react";

interface TenantEntry {
  category: string;
  tenant: string;
  name: string;
  active: boolean;
  schedule: Record<string, boolean>;
  hasSpec: boolean;
}

interface ManifestResponse {
  tenants: TenantEntry[];
  categories: string[];
}

const BASE = import.meta.env.BASE_URL;

export default function Dashboard() {
  const [manifest, setManifest] = useState<ManifestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE}/api/manifest.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`);
        return res.json();
      })
      .then(setManifest)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-8 text-center">
        <p className="text-red-400">Failed to load dashboard: {error}</p>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  const activeTenants = manifest.tenants.filter((t) => t.active);

  if (activeTenants.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          No active tenants found. Add tenant configs to{" "}
          <code>tenants/</code> and run the generator.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {activeTenants.map((tenant) => (
        <a
          key={`${tenant.category}/${tenant.tenant}`}
          href={`${BASE}/${tenant.category}/${tenant.tenant}/`}
          className={`group rounded-lg border border-border bg-card p-6 transition-colors hover:border-ring ${
            !tenant.hasSpec ? "opacity-60" : ""
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold group-hover:text-primary">
                {tenant.name}
              </h2>
              <p className="mt-1 text-sm capitalize text-muted-foreground">
                {tenant.category}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                tenant.hasSpec
                  ? "bg-green-500/10 text-green-400"
                  : "bg-yellow-500/10 text-yellow-400"
              }`}
            >
              {tenant.hasSpec ? "Ready" : "Pending"}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-1">
            {Object.entries(tenant.schedule).map(([day, active]) => (
              <span
                key={day}
                className={`rounded px-1.5 py-0.5 text-xs ${
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground/40"
                }`}
              >
                {day.slice(0, 3)}
              </span>
            ))}
          </div>
        </a>
      ))}
    </div>
  );
}
