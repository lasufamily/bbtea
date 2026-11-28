# Menu brand logos

Menu cards and individual menu headers use the WebP logos listed in `src/data/menu-brand-logos.json`. These overrides apply only to menu pages; Airtable records and other image fields are unchanged.

- R2 bucket: `bbtea-media-production`
- Public domain: `https://images.bbtea.sg`
- Object keys: `brands/<brand-slug>-logo.webp`
- Recovery copies: `assets/menu-brand-logos/`
- Encoding: lossless WebP, 640 × 640 pixels, with the full logo contained within a square canvas.
- Source pages, source image URLs, descriptive alt text and file checksums are recorded in the manifest.

The Luckin Coffee source is a white logo, presented on a blue background for visibility. CHAGEE's source is the inline SVG in its official Singapore website header. LiHO TEA's source is its CapitaLand tenant listing; all other sources are official brand websites.

To replace a logo, prepare and inspect the WebP file, upload it to R2 with `Content-Type: image/webp`, and update the manifest and recovery copy together. Use a new filename when the design changes to avoid stale browser caches. Check the public URL before publishing. New menu brands need a manifest entry to use R2; otherwise they retain the existing Airtable logo or initial fallback.

Original logos and trademarks belong to their respective owners.
