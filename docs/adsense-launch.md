# Advertising launch prerequisites

The 24 November 2026 readiness changes remove GTM/GA/Meta from page templates, defer external forms until opened, withhold unsupported nutrition/certification/health content, and improve directory context. AdSense integration is intentionally deferred at the owner's request. No publisher ID, ads.txt entry or certified CMP configuration has been invented.

Before advertising is enabled:

1. Obtain the real AdSense publisher ID and publish the exact ads.txt record provided by that account. Check its public response and account status.
2. Configure the account's Google-certified European regulations message or another certified TCF CMP. Verify regional behaviour, accept/reject/withdrawal and actual network requests. Opening a contact form is not advertising consent.
3. Configure ad exclusions in AdSense for `/search/`, `/contact/`, `/advertise/`, `/newsletter/`, `/submit-a-review/`, error screens and empty/unfinished pages. The HTML `data-ad-eligible` marker documents intent; it does not configure Auto ads. Noindex is also not an advertising exclusion.
4. Update the privacy policy's current advertising status before ad scripts begin loading. Re-review the copy with Humanizer.
5. Verify Google crawler access through Cloudflare, mobile placement, accidental-click risks and ad density. Do not mark approval complete until the account actually confirms it.

## Restoring withheld claims

Owner correction, 27 November 2026: restore existing drink calories, Nutri-Grade, Healthier Choice badges and Healthier Choice Type. The 24 November blanket suppression was not the owner's intent. The mapper now preserves these recorded fields and menu/detail pages display them, with missing values marked "Not listed" and serving/customisation context. This restores existing information without recalculating or claiming fresh verification of the values. Airtable records are unchanged.

Unsourced brand histories, outlet halal claims, health/nutrition FAQs and nutrition sentences embedded in free-text drink descriptions remain withheld. Any new or revised nutrition claims should record an attributable source, serving applicability and actual check date. Do not use the build/deploy date as the date a fact was verified. Statistical calculations or research must follow the project's academic-research-suite workflow.

Review rights to each reused photo and mark before reuse. The site now supplies a corrections/copyright contact, but a contact notice does not establish a licence. No new claims of image licensing were made.

## Verification

Run `npm test`, `npm run build:verify` and `node scripts/internal-link-audit.mjs --fail-on-error`. Inspect built HTML and browser requests for trackers, unrequested form loads, health claims, malformed links and utility-page indexing. Verify retired shop URLs return 410 in production after deployment. Retired health FAQ paths are listed in src/lib/retiredPages.js; remove a path from that list only after evidence review. public/_routes.json limits the edge handler to those retired URLs. Check actual production HTML; a commit or successful build is not proof of publication.
