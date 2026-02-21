#!/usr/bin/env bash
set -euo pipefail

# Daily UI Generator
# Reads tenant configs, checks schedules, and generates json-render specs via Claude CLI.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TENANTS_DIR="$PROJECT_ROOT/tenants"
GENERATED_DIR="$PROJECT_ROOT/generated"
SYSTEM_PROMPT="$SCRIPT_DIR/prompts/system.md"

TODAY=$(date +%Y-%m-%d)
DAY_OF_WEEK=$(date +%A | tr '[:upper:]' '[:lower:]')

echo "=== Daily UI Generator ==="
echo "Date: $TODAY ($DAY_OF_WEEK)"
echo ""

# Check prerequisites
if ! command -v claude &>/dev/null; then
  echo "Error: 'claude' CLI not found. Install via: bun add -g @anthropic-ai/claude-code"
  exit 1
fi

if [[ ! -f "$SYSTEM_PROMPT" ]]; then
  echo "Error: System prompt not found at $SYSTEM_PROMPT"
  exit 1
fi

if [[ ! -d "$TENANTS_DIR" ]]; then
  echo "Error: Tenants directory not found at $TENANTS_DIR"
  exit 1
fi

# Read system prompt
SYSTEM_PROMPT_CONTENT=$(cat "$SYSTEM_PROMPT")

generated_count=0
skipped_count=0

# Iterate categories (subdirectories of tenants/)
for category_dir in "$TENANTS_DIR"/*/; do
  [[ ! -d "$category_dir" ]] && continue
  category=$(basename "$category_dir")

  # Read category template if it exists
  template_file="$category_dir/_template.md"
  if [[ -f "$template_file" ]]; then
    # Strip YAML frontmatter for the template content
    template_content=$(awk '/^---$/{if(++c==2) next; if(c==1) next} c>=2' "$template_file")
  else
    template_content=""
    echo "Warning: No _template.md found for category '$category'"
  fi

  # Iterate tenant files (skip _template.md)
  for tenant_file in "$category_dir"/*.md; do
    [[ ! -f "$tenant_file" ]] && continue
    [[ "$(basename "$tenant_file")" == "_template.md" ]] && continue

    tenant=$(basename "$tenant_file" .md)
    echo "--- Processing: $category/$tenant ---"

    # Parse YAML frontmatter
    frontmatter=$(awk '/^---$/{if(++c==2) exit} c==1' "$tenant_file")

    # Check if active
    active=$(echo "$frontmatter" | grep -E "^active:" | awk '{print $2}' | tr -d '[:space:]')
    if [[ "$active" != "true" ]]; then
      echo "  Skipped: inactive"
      skipped_count=$((skipped_count + 1))
      continue
    fi

    # Check schedule for today
    scheduled=$(echo "$frontmatter" | grep -E "^\s*${DAY_OF_WEEK}:" | awk '{print $2}' | tr -d '[:space:]')
    if [[ "$scheduled" != "true" ]]; then
      echo "  Skipped: not scheduled for $DAY_OF_WEEK"
      skipped_count=$((skipped_count + 1))
      continue
    fi

    # Get tenant persona (everything after frontmatter)
    persona_content=$(awk '/^---$/{if(++c==2) { found=1; next }} found' "$tenant_file")

    # Get tenant name
    tenant_name=$(echo "$frontmatter" | grep -E "^name:" | sed 's/^name:\s*//')

    # Build the user prompt
    user_prompt="# Category: ${category}

${template_content}

# Tenant: ${tenant_name}

${persona_content}

# Task

Generate today's ${category} UI spec for ${tenant_name}.
Today is ${DAY_OF_WEEK}, ${TODAY}.
Output ONLY the JSON spec object — no markdown, no explanation."

    # Prepare output directory
    output_dir="$GENERATED_DIR/$category/$tenant"
    mkdir -p "$output_dir"

    output_file="$output_dir/$TODAY.json"

    echo "  Generating spec..."

    # Call Claude CLI
    if claude -p "${SYSTEM_PROMPT_CONTENT}

---

${user_prompt}" --output-format json > "$output_file" 2>/dev/null; then
      # Validate JSON
      if python3 -c "import json; json.load(open('$output_file'))" 2>/dev/null || \
         node -e "JSON.parse(require('fs').readFileSync('$output_file', 'utf8'))" 2>/dev/null; then
        # Copy to latest.json
        cp "$output_file" "$output_dir/latest.json"
        echo "  Saved: $output_file"
        echo "  Updated: $output_dir/latest.json"
        generated_count=$((generated_count + 1))
      else
        echo "  Error: Invalid JSON output, removing file"
        rm -f "$output_file"
      fi
    else
      echo "  Error: Claude CLI failed"
      rm -f "$output_file"
    fi
  done
done

echo ""
echo "=== Done ==="
echo "Generated: $generated_count | Skipped: $skipped_count"
