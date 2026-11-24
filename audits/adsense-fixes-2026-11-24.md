# AdSense readiness fixes — 24 November 2026

Implemented from the updated audit. AdSense publisher ID, ads.txt and certified consent activation are deferred by the owner (“skip this for now”). The work does not claim Google approval.

- Removed the GTM loader and its noscript iframe, which had loaded Google Analytics and Meta. Removed Beehiiv's separate attribution loader.
- Forms now load only after the visitor opens them; form answer inheritance from URL parameters was removed. The privacy policy notes that providers may still receive the parent page URL. Review submission keeps normal site navigation, disclosure and publication guidance.
- Rewrote Privacy to match browsing, hosting, optional form and newsletter flows; added provider links, rights and honest advertising status. Added editorial/correction/copyright information to About.
- Withheld nutrition fields, certification badges, unsourced brand histories and health FAQs while preserving the Airtable records. Removed nutrition sentences from drink descriptions before they reach cards or metadata.
- Replaced generic town content, unsourced context and internal wording with a practical directory, accessible counts table and location navigation. Drink pages now offer accessible prices, brand links and outlet discovery. Outlet pages have contextual visit/correction information.
- Replaced unsupported recipe health, market and cost claims with a practical preparation guide. Updated its metadata and blog-card description.
- Removed shop-to-homepage redirects; retired shop pages use explicit 410 responses at the edge. Utility pages are noindex and excluded from the sitemap, with intent markers for future ad exclusion. No ad integration is enabled.
- Fixed malformed location links for outlets with no town record. Removed unavailable Halal filters, including stale query handling, so withheld evidence is not misrepresented as zero matching outlets.

Humanizer final review: removed generic locality claims, inflated recipe promises, invented verification dates, unsupported health/cost assertions and internal database language. Final copy uses direct instructions and clearly distinguishes recorded directory information from current availability or first-hand visits. Source records were not edited.

Remaining launch work is documented in `docs/adsense-launch.md`. Account setup, image permissions and actual AdSense approval cannot be established by template changes.

Verification before publishing: 66 tests passed; production build completed; strict link audit scanned 4,183 pages with zero broken or non-canonical internal links. Built HTML passed the tracker/internal-wording scan and retired/utility sitemap checks. Mobile menu, town and directory pages had no horizontal overflow. Fillout and Beehiiv were not requested before opening, and loaded after the visitor chose to open them. Independent review identified the unavailable Halal filter issue; it was corrected and covered by a regression test.

Production follow-up, 25 November: deleted pages were still served from an old asset cache. The existing CLI account lacked cache-purge permission. Added a narrowly scoped Pages handler and routing manifest for the retired shop and 25 withheld health FAQ URLs; it returns 410 with no-store/noindex and passes other paths through. The handler compiled with Wrangler, passed direct response tests and was verified in a local Cloudflare preview alongside working static menu/directory/FAQ pages. A second independent review found no concrete issues. The simple retired-page copy also passed the final Humanizer review.
