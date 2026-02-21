import type { APIRoute } from "astro";
import * as fs from "node:fs";
import * as path from "node:path";

export const prerender = true;

export async function getStaticPaths() {
  const generatedDir = path.resolve("generated");

  if (!fs.existsSync(generatedDir)) {
    return [];
  }

  const paths: Array<{
    params: { category: string; tenant: string };
  }> = [];

  const categories = fs.readdirSync(generatedDir, { withFileTypes: true });

  for (const categoryEntry of categories) {
    if (!categoryEntry.isDirectory() || categoryEntry.name.startsWith(".")) {
      continue;
    }

    const categoryPath = path.join(generatedDir, categoryEntry.name);
    const tenants = fs.readdirSync(categoryPath, { withFileTypes: true });

    for (const tenantEntry of tenants) {
      if (!tenantEntry.isDirectory() || tenantEntry.name.startsWith(".")) {
        continue;
      }

      paths.push({
        params: {
          category: categoryEntry.name,
          tenant: tenantEntry.name,
        },
      });
    }
  }

  return paths;
}

export const GET: APIRoute = ({ params }) => {
  const { category, tenant } = params;

  const tenantDir = path.resolve(`generated/${category}/${tenant}`);

  if (!fs.existsSync(tenantDir)) {
    return new Response(JSON.stringify({ error: "Tenant not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const files = fs.readdirSync(tenantDir, { withFileTypes: true });
  const specs = files
    .filter((f) => f.isFile() && f.name.endsWith(".json"))
    .map((f) => f.name.replace(/\.json$/, ""))
    .sort()
    .reverse();

  return new Response(
    JSON.stringify({
      category,
      tenant,
      specs,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};
