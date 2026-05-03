/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly AIRTABLE_API_KEY: string;
  readonly AIRTABLE_BASE_ID: string;
  readonly SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
