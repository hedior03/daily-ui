import type { APIRoute } from "astro";
import * as fs from "node:fs";
import * as path from "node:path";

export const prerender = true;

interface TenantManifestEntry {
  tenant: string;
  name: string;
  active: boolean;
  schedule: Record<string, boolean>;
  hasSpec: boolean;
}

export async function getStaticPaths() {
  const tenantsDir = path.resolve("tenants");

  if (!fs.existsSync(tenantsDir)) {
    return [];
  }

  const paths: Array<{ params: { category: string } }> = [];
  const categoryEntries = fs.readdirSync(tenantsDir, { withFileTypes: true });

  for (const categoryEntry of categoryEntries) {
    if (!categoryEntry.isDirectory() || categoryEntry.name.startsWith(".")) {
      continue;
    }

    paths.push({
      params: { category: categoryEntry.name },
    });
  }

  return paths;
}

export const GET: APIRoute = ({ params }) => {
  const { category } = params;
  const tenantsDir = path.resolve("tenants");
  const generatedDir = path.resolve("generated");
  const categoryPath = path.join(tenantsDir, category ?? "");
  const manifest: TenantManifestEntry[] = [];

  if (!fs.existsSync(categoryPath)) {
    return new Response(
      JSON.stringify({ error: "Category not found", tenants: [] }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const files = fs.readdirSync(categoryPath, { withFileTypes: true });

  for (const file of files) {
    if (
      !file.isFile() ||
      !file.name.endsWith(".md") ||
      file.name.startsWith("_")
    ) {
      continue;
    }

    const tenantPath = path.join(categoryPath, file.name);
    const content = fs.readFileSync(tenantPath, "utf-8");

    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) continue;

    const frontmatter = frontmatterMatch[1];

    // Parse active
    const activeMatch = frontmatter.match(/^active:\s*(true|false)$/m);
    const active = activeMatch ? activeMatch[1] === "true" : false;

    // Parse name
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
    const tenantName = file.name.replace(/\.md$/, "");
    const displayName = nameMatch ? nameMatch[1].trim() : tenantName;

    // Parse schedule
    const schedule: Record<string, boolean> = {};
    const scheduleMatch = frontmatter.match(
      /schedule:\s*\n((?:\s+\w+:\s*(?:true|false)\n?)+)/
    );
    if (scheduleMatch) {
      const scheduleLines = scheduleMatch[1].trim().split("\n");
      for (const line of scheduleLines) {
        const dayMatch = line.trim().match(/^(\w+):\s*(true|false)$/);
        if (dayMatch) {
          schedule[dayMatch[1]] = dayMatch[2] === "true";
        }
      }
    }

    // Check if spec exists
    const specPath = path.join(generatedDir, category ?? "", tenantName, "latest.json");
    const hasSpec = fs.existsSync(specPath);

    manifest.push({
      tenant: tenantName,
      name: displayName,
      active,
      schedule,
      hasSpec,
    });
  }

  return new Response(
    JSON.stringify({
      category,
      tenants: manifest,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
