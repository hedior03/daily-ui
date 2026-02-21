# API Documentation

All endpoints are static JSON files generated at build time from the `generated/` directory.

## Endpoints

### Global Manifest
**GET** `/api/manifest.json`

Lists all tenants across all categories.

**Response:**
```json
{
  "tenants": [
    {
      "category": "gym",
      "tenant": "john",
      "name": "John",
      "active": true,
      "schedule": {
        "monday": true,
        "tuesday": false,
        ...
      },
      "hasSpec": true
    }
  ],
  "categories": ["gym", "nutrition"]
}
```

**Use case:** Dashboard to list all available tenants

---

### Category Manifest
**GET** `/api/{category}/manifest.json`

Lists all tenants within a specific category.

**Example:** `/api/gym/manifest.json`

**Response:**
```json
{
  "category": "gym",
  "tenants": [
    {
      "tenant": "john",
      "name": "John",
      "active": true,
      "schedule": { ... },
      "hasSpec": true
    },
    {
      "tenant": "maria",
      "name": "Maria",
      "active": true,
      "schedule": { ... },
      "hasSpec": true
    }
  ]
}
```

**Use case:** Category page listing all tenants in that category

---

### Tenant Spec
**GET** `/api/{category}/{tenant}/latest.json`

The json-render spec for a specific tenant.

**Example:** `/api/gym/john/latest.json`

**Response:**
```json
{
  "root": "main-stack",
  "elements": {
    "main-stack": {
      "type": "Stack",
      "props": { "gap": "lg" },
      "children": ["header-card", "workout-card"]
    },
    ...
  },
  "state": {
    "/completed/warmup": false,
    ...
  }
}
```

**Use case:** Render the actual UI for a tenant

---

## Data Flow

```
tenants/gym/john.md (config)
       +
generated/gym/john/latest.json (spec, source of truth)
       ↓
   (build time)
       ↓
   ┌────┴────┐
   │         │
   ↓         ↓
/api/...   /gym/john/ (HTML page)
(static    (spec inlined in JS)
 JSON)
```

## How it scales

When you add a new tenant:

1. **Generator creates:** `generated/nutrition/alice/latest.json`
2. **Next build automatically creates:**
   - `/api/nutrition/alice/latest.json` (individual spec)
   - Updates `/api/nutrition/manifest.json` (category list)
   - Updates `/api/manifest.json` (global list)
   - Creates `/nutrition/alice/` (HTML page)

**No code changes needed** - `getStaticPaths()` scans the filesystem at build time.

## Fetching Examples

### Client-side JavaScript

```javascript
// Get all tenants
const manifest = await fetch('/daily-ui/api/manifest.json').then(r => r.json());

// Get gym category tenants
const gymTenants = await fetch('/daily-ui/api/gym/manifest.json').then(r => r.json());

// Get John's workout spec
const spec = await fetch('/daily-ui/api/gym/john/latest.json').then(r => r.json());
```

### External Tools

```bash
# curl
curl https://hedior.github.io/daily-ui/api/manifest.json

# jq
curl https://hedior.github.io/daily-ui/api/gym/john/latest.json | jq '.state'
```

## Performance

All files are:
- ✅ Generated once at build time
- ✅ Served as static files (no server processing)
- ✅ Cacheable by CDN/browser
- ✅ Small file sizes (~8KB per spec)
