# 🧋 Bubble Tea SG — Singapore Bubble Tea Directory

A production-ready, editorial-style static directory website for bubble tea shops across Singapore. Built with **Astro**, **Tailwind CSS v4**, **Airtable** as the CMS, **Pagefind** for full-text search, and deployed on **Cloudflare Pages**.

---

## ✨ Features

- **Editorial design** — premium, curated feel inspired by discovery guides
- **15+ shops**, **10 brands**, **13 Singapore towns** out of the box (mock data)
- **Filter & search** — by town, brand, drink type, MRT, price range, halal-friendly
- **Full-text search** via Pagefind (indexes all pages at build time)
- **SEO-ready** — meta tags, Open Graph, JSON-LD structured data on every page
- **Responsive** — mobile-first, polished on all screen sizes
- **Airtable CMS** — manage content from Airtable; rebuild to publish changes
- **Mock-data fallback** — works fully offline / without Airtable configured

---

## 🗂 Project Structure

```
bbtsg/
├── public/                   # Static assets (favicon, robots.txt, manifest)
├── src/
│   ├── components/
│   │   ├── Layout.astro      # Root HTML shell
│   │   ├── Header.astro      # Navigation (responsive)
│   │   ├── Footer.astro
│   │   ├── SEOHead.astro     # Meta / OG / JSON-LD
│   │   ├── SearchBox.astro   # Reusable search form
│   │   ├── FilterBar.astro   # Sidebar filter panel
│   │   ├── ListingCard.astro # Outlet card
│   │   ├── BrandCard.astro   # Brand card
│   │   ├── TownCard.astro    # Town card
│   │   └── CategoryCard.astro
│   ├── lib/
│   │   ├── types.ts          # TypeScript types
│   │   ├── airtable.ts       # Airtable fetch helpers (build-time only)
│   │   └── mockData.ts       # Sample data (fallback / local dev)
│   ├── pages/
│   │   ├── index.astro           # Homepage
│   │   ├── directory.astro       # Filterable shop listing
│   │   ├── search.astro          # Pagefind search UI
│   │   ├── 404.astro
│   │   ├── bubble-tea-shops/[slug].astro    # Individual shop page
│   │   ├── brands/[slug].astro   # Brand page (all outlets)
│   │   ├── towns/[slug].astro    # Town page
│   │   ├── malls/[slug].astro    # Mall page
│   │   ├── drinks/[slug].astro
│   │   └── stations/[slug].astro
│   └── styles/
│       └── global.css        # Tailwind v4 + design tokens
├── .env.example
├── astro.config.mjs
├── tailwind.config.mjs       # (tokens live inside global.css for Tailwind v4)
├── tsconfig.json
└── package.json
```

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Copy env file (Airtable optional — mock data is used when vars are absent)
cp .env.example .env

# 3. Start the dev server
npm run dev
# → http://localhost:4321
```

The site works immediately with mock data. No Airtable account needed for local development.

---

## 🌿 Environment Variables

| Variable         | Required | Description |
|-----------------|----------|-------------|
| `AIRTABLE_API_KEY` | For live data | Personal Access Token from airtable.com/create/tokens |
| `AIRTABLE_BASE_ID` | For live data | Found in your Airtable base URL |
| `USE_MOCK_DATA`    | No       | Set to `true` to force mock data even if Airtable vars exist |
| `SITE_URL`         | No       | Public site URL (default: https://bubbleteasg.com) |

---

## 🗄 Airtable Setup

### 1. Create a new Airtable Base

Create a base called **Bubble Tea SG** with three tables:

#### Table: `Brands`
| Field | Type |
|-------|------|
| Brand Name | Single line text |
| Slug | Single line text |
| Logo | Attachment |
| Description | Long text |
| Website URL | URL |
| Instagram URL | URL |
| Featured | Checkbox |
| Published | Checkbox |

#### Table: `Outlets`
| Field | Type |
|-------|------|
| Outlet Name | Single line text |
| Slug | Single line text |
| Brand | Link to `Brands` |
| Town | Single line text |
| Mall / Location | Single line text |
| Address | Single line text |
| Nearest MRT | Single line text |
| Opening Hours | Single line text |
| Phone | Phone number |
| Google Maps URL | URL |
| Delivery Links | Long text (JSON) |
| Popular Drinks | Long text (comma-separated) |
| Drink Categories | Link to `Drink Categories` |
| Price Range | Single select: `$` / `$$` / `$$$` |
| Halal-Friendly | Checkbox |
| Seating Available | Checkbox |
| Image | Attachment |
| Gallery Images | Attachment |
| Featured | Checkbox |
| Published | Checkbox |

#### Table: `Drink Categories`
| Field | Type |
|-------|------|
| Category Name | Single line text |
| Slug | Single line text |
| Description | Long text |
| Image | Attachment |
| Published | Checkbox |

### 2. Slugs

Every record needs a **Slug** field — a URL-safe lowercase identifier:
- `Tiger Sugar` → `tiger-sugar`
- `Jurong East` → `jurong-east`

### 3. Delivery Links format

The `Delivery Links` field expects JSON:
```json
[
  { "platform": "GrabFood", "url": "https://grab.com/..." },
  { "platform": "foodpanda", "url": "https://www.foodpanda.sg/..." }
]
```

### 4. Get your credentials

- **API Key**: [airtable.com/create/tokens](https://airtable.com/create/tokens) — create a Personal Access Token with scopes `data.records:read` and `schema.bases:read`
- **Base ID**: Open your base in Airtable → the URL contains `app...` — that's your Base ID

---

## ☁️ Cloudflare Pages Deployment

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "feat: initial bubble tea directory"
git remote add origin https://github.com/YOUR_USERNAME/bbtsg.git
git push -u origin main
```

### Step 2 — Connect to Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Select your GitHub repository
4. Configure the build:

| Setting | Value |
|---------|-------|
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Node.js version** | `18` (or `20`) |

### Step 3 — Set Environment Variables

In Cloudflare Pages → your project → **Settings** → **Environment variables**:

```
AIRTABLE_API_KEY  = patXXXXXX...
AIRTABLE_BASE_ID  = appXXXXXX...
```

Add these to both **Production** and **Preview** environments.

> ⚠️ These are **build-time** variables (used during `astro build`). They are never shipped to the browser.

### Step 4 — Deploy

Click **Save and Deploy**. Cloudflare will build and publish your site. Subsequent pushes to `main` trigger automatic redeployments.

---

## 🔄 Triggering a Rebuild from Airtable

Since the site is static (built at deploy time), you need to rebuild whenever Airtable content changes.

### Option A — Cloudflare Deploy Hook (recommended)

1. In Cloudflare Pages → **Settings** → **Builds & deployments** → **Deploy hooks**
2. Click **Add deploy hook** → name it `Airtable Webhook` → copy the URL
3. In Airtable, create an **Automation**:
   - Trigger: **When a record is updated** (or created/deleted) in any table
   - Action: **Send a webhook** → POST to your Cloudflare deploy hook URL
4. Now every Airtable save triggers a rebuild (~1 min)

### Option B — Manual rebuild

In Cloudflare Pages → **Deployments** → **Retry deployment** on latest.

### Option C — GitHub Action (scheduled)

```yaml
# .github/workflows/daily-rebuild.yml
name: Daily rebuild
on:
  schedule:
    - cron: '0 2 * * *'   # 02:00 UTC daily (10:00 SGT)
  workflow_dispatch:

jobs:
  rebuild:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cloudflare deploy hook
        run: curl -X POST "${{ secrets.CF_DEPLOY_HOOK_URL }}"
```

Add `CF_DEPLOY_HOOK_URL` as a GitHub Actions secret.

---

## 🔍 Search (Pagefind)

Pagefind runs after `astro build` as part of `npm run build`:

```
astro build  →  pagefind --site dist --output-path dist/pagefind
```

This generates `/dist/pagefind/` — a static search index served alongside your site.

Pages are indexed via the `data-pagefind-body` attribute on key sections. The search UI at `/search` loads Pagefind JS/CSS from `/pagefind/`.

> **Note:** The search page shows a "no results" state in `npm run dev` because Pagefind only works on built output. Run `npm run build && npm run preview` to test search locally.

---

## 🛠 Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at http://localhost:4321 |
| `npm run build` | Build + run Pagefind indexing → `dist/` |
| `npm run build:astro` | Astro build only (no Pagefind) |
| `npm run preview` | Preview production build locally |

---

## 📝 Adding Content

### Add a new shop (mock data)

Edit `src/lib/mockData.ts` → add to the `OUTLETS` array following the existing pattern.

### Add a new brand (mock data)

Edit `src/lib/mockData.ts` → add to the `BRANDS` array.

### Add a new town

Edit `src/lib/mockData.ts` → add to the `TOWNS` array. Town pages are generated automatically.

### Switch to Airtable

1. Set `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` in `.env`
2. Make sure `USE_MOCK_DATA` is not set to `true`
3. Run `npm run dev` — data will be fetched from Airtable at build time

---

## 🎨 Customisation

### Change the site name / URL

1. Update `site` in `astro.config.mjs`
2. Update `siteUrl` in `src/components/SEOHead.astro`
3. Update canonical URLs in each page's frontmatter
4. Update `robots.txt`

### Change colours / fonts

All design tokens live in `src/styles/global.css` under `@theme { ... }`. No separate Tailwind config file needed (Tailwind v4 reads from CSS).

### Add more towns or MRT stations

Edit the `TOWNS` and `MRT_STATIONS` arrays in `src/lib/mockData.ts`.

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Astro](https://astro.build) v6 |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 |
| CMS | [Airtable](https://airtable.com) (build-time REST API) |
| Search | [Pagefind](https://pagefind.app) (static full-text) |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com) |
| Fonts | Google Fonts (Playfair Display + Inter) |

---

## 🇸🇬 Built for Singapore

This directory covers Singapore's towns and neighbourhoods including Orchard, Bugis, Chinatown, Tampines, Woodlands, Jurong East, Bedok, Punggol, Ang Mo Kio, Bishan, Clementi, Serangoon, and Toa Payoh.

---

*Built with ☕ and 🧋 — for bubble tea lovers across the island.*
