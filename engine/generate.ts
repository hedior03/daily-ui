import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { parse, stringify } from "yaml";

const PROJECT_ROOT = process.cwd();
const TEMPLATES_DIR = join(PROJECT_ROOT, "templates");
const TENANTS_DIR = join(PROJECT_ROOT, "tenants");
const GENERATED_DIR = join(PROJECT_ROOT, "generated");
const SYSTEM_PROMPT_PATH = join(PROJECT_ROOT, "engine/prompts/system.md");

const today = new Date();
const dateStr = today.toISOString().split("T")[0];
const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

console.log(`=== Daily UI Generator ===`);
console.log(`Date: ${dateStr} (${dayOfWeek})\n`);

async function generate() {
  if (!existsSync(TEMPLATES_DIR)) {
    mkdirSync(TEMPLATES_DIR, { recursive: true });
    console.log(`+ Created ${TEMPLATES_DIR}`);
  }

  const systemPrompt = readFileSync(SYSTEM_PROMPT_PATH, "utf-8");
  
  // 1. Scan 'templates/' for available categories
  const categoryFiles = readdirSync(TEMPLATES_DIR).filter(f => f.endsWith(".md"));
  const categories = categoryFiles.map(f => basename(f, ".md"));

  if (categories.length === 0) {
    console.warn("No categories found in templates/");
    // In migration phase, we might still have old structure. 
    // But the user asked to support the NEW structure.
  }

  let generatedCount = 0;
  let skippedCount = 0;

  // 2. For each category
  for (const category of categories) {
    const templateContent = readFileSync(join(TEMPLATES_DIR, `${category}.md`), "utf-8");
    
    // Scan tenants/*/[category].md
    const tenantIds = readdirSync(TENANTS_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const tenantId of tenantIds) {
      const catFilePath = join(TENANTS_DIR, tenantId, `${category}.md`);
      if (!existsSync(catFilePath)) continue;

      // 3. Check global 'active: true' in 'tenants/[tenantId]/PERSONA.md'
      const personaPath = join(TENANTS_DIR, tenantId, "PERSONA.md");
      if (!existsSync(personaPath)) {
        console.log(`- Skipping ${tenantId}/${category}: PERSONA.md missing`);
        skippedCount++;
        continue;
      }

      const personaContent = readFileSync(personaPath, "utf-8");
      const personaParts = personaContent.split("---");
      if (personaParts.length < 3) {
        console.log(`- Skipping ${tenantId}/${category}: Invalid PERSONA.md format`);
        skippedCount++;
        continue;
      }
      
      const personaFM = parse(personaParts[1]);
      const personaBody = personaParts.slice(2).join("---").trim();

      if (personaFM.active !== true) {
        console.log(`- Skipping ${tenantId}/${category}: tenant inactive in PERSONA.md`);
        skippedCount++;
        continue;
      }

      const catSpecificContent = readFileSync(catFilePath, "utf-8");

      console.log(`+ Generating ${category} for ${tenantId}...`);

      // 4. Assemble prompts using 'templates/[category].md' + 'PERSONA.md' + '[category].md'
      const userPrompt = `
# Category Template (${category})
${templateContent}

# Global Persona (${tenantId})
${personaBody}

# Category Specific Info
${catSpecificContent}

# Task
Today is ${today.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
Generate today's ${category} MDX spec for ${tenantId}.
Include all required frontmatter and imports.
Fill in tenant="${tenantId}", date="${dateStr}", category="${category}".
`;

      const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

      try {
        // Use Bun.spawn to call claude CLI with tools disabled for speed and focus.
        // We override the system prompt to ensure it doesn't try to use tools or be a helpful assistant.
        const proc = Bun.spawn([
          "claude", 
          "-p", fullPrompt, 
          "--tools", "", 
          "--system-prompt", "You are a one-shot MDX generator. Output ONLY the MDX content. No conversation, no tools, no markdown code fences around the entire output. Start immediately with '---'."
        ], {
          stdout: "pipe",
          stderr: "pipe",
        });


        const output = await new Response(proc.stdout).text();
        const error = await new Response(proc.stderr).text();

        if (proc.exitCode !== 0 && proc.exitCode !== null) {
          console.error(`  Error generating ${tenantId}: ${error}`);
          continue;
        }

        if (!output.includes("---") || !output.includes("import ")) {
          console.error(`  Error: Invalid MDX output for ${tenantId}. Output preview: ${output.slice(0, 100)}`);
          continue;
        }

        // 5. Output generated MDX to 'generated/[tenantId]/[category]/[date].mdx' 
        // with 'tenant: [tenantId]' in frontmatter.
        let finalOutput = output.trim();
        
        // Find the FIRST occurrence of '---'
        const firstDash = finalOutput.indexOf("---");
        if (firstDash !== -1) {
          finalOutput = finalOutput.slice(firstDash);
        }

        // Strip trailing markdown code fence if present
        if (finalOutput.endsWith("```")) {
          finalOutput = finalOutput.replace(/\n```$/m, "").trim();
        }

        const outputParts = finalOutput.split("---");
        
        // outputParts[0] should now be empty (since we sliced from the first ---)
        // outputParts[1] is the frontmatter
        // outputParts[2...] is the body
        if (outputParts.length >= 3) {
          const fmPart = outputParts[1];
          const fm = parse(fmPart) || {};
          fm.tenant = tenantId;
          fm.category = category;
          fm.date = dateStr;
          
          const body = outputParts.slice(2).join("---").trim();
          finalOutput = `---
${stringify(fm).trim()}
---

${body}`;
        }

        const outputDir = join(GENERATED_DIR, tenantId, category);
        mkdirSync(outputDir, { recursive: true });
        
        const outputPath = join(outputDir, `${dateStr}.mdx`);
        writeFileSync(outputPath, finalOutput);
        
        console.log(`  Saved to ${outputPath}`);
        generatedCount++;

      } catch (err) {
        console.error(`  Failed to run claude for ${tenantId}:`, err);
      }
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Generated: ${generatedCount} | Skipped: ${skippedCount}`);
}

generate().catch(console.error);
