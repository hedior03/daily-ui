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
    params: { category: string; tenant: string; file: string };
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

      const tenantPath = path.join(categoryPath, tenantEntry.name);
      const files = fs.readdirSync(tenantPath, { withFileTypes: true });

      for (const file of files) {
        if (!file.isFile() || !file.name.endsWith(".json")) {
          continue;
        }

        const fileName = file.name.replace(/\.json$/, "");

        paths.push({
          params: {
            category: categoryEntry.name,
            tenant: tenantEntry.name,
            file: fileName,
          },
        });
      }
    }
  }

  return paths;
}

export const GET: APIRoute = ({ params }) => {
  const { category, tenant, file } = params;

  const specPath = path.resolve(
    `generated/${category}/${tenant}/${file}.json`,
  );

  if (!fs.existsSync(specPath)) {
    return new Response(JSON.stringify({ error: "Spec not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const spec = fs.readFileSync(specPath, "utf-8");

  return new Response(spec, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
