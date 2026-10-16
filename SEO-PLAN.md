# Actionable Books SEO implementation

## Priorities and evidence

Repair existing demand before adding pages. The original 28-day Search Console snapshot reports 520 clicks and 59,973 impressions. It is a baseline, not evidence of uplift. Priority existing summaries include Outwitting the Devil, How Successful People Think and Change Your Questions, Change Your Life. Preserve the productivity and science guide URLs, which have measured clicks.

The restored archive has 1,148 review records. Original source identity is matched using file path, original URL and export slug, never title or row position alone. Separate reviews of one book remain separate when their writers and texts differ. Two limited introductions are labelled and excluded from indexing rather than completed with generated prose.

## Intent and architecture

| Reader need | Existing destination | Role |
| --- | --- | --- |
| A particular book or author | /summaries/, /authors/, /search/ | Find the correct review and distinguish same-title books |
| A subject | /topics/ and /summary-categories/ | Crawlable topic and review relationships |
| A new management role | /lists/best-books-for-new-managers/ | Short reading sequence with source excerpts and limitations |
| A difficult conversation | /lists/best-communication-books/ | Compare relevant original reviews |
| Priorities and concentration | /guides/best-productivity-books/ | Preserve existing search value and add an applied reading path |
| The writer's perspective | /team/ | Original contributor credits and their actual work |
| Original articles and interviews | /blog/ and /blog-category/ | Dated historical archive |
| Brand and editorial provenance | /about/, /contact/, /privacy-policy/ | Current operator, archive history, corrections and privacy choices |

These are intent clusters, not invented search-volume or ranking forecasts. Static archive pagination and ordinary HTML anchors expose the complete catalogue without requiring client-side search.

## Content treatment

All original review bodies have recorded provenance. Wrong-book associations and empty destinations are recovered from exact original sources. Four previously provisional bylines now have independently retained original-page evidence; Chip Conley's Peak remains qualified.

All 25 later list records have individual dispositions. Unsubstantiated repeated selections are held from indexing during editorial review. Existing clicked alternatives lists remain available and indexable. Three paths use actual original excerpts, named contributors and explicit later selection notes. They do not claim human editorial approval.

All 13 guides retain their URLs. Incorrect claims, invented book information, wrong counts and unsupported universal results have been removed or qualified. Related original-review shelves identify the actual book and author. The archive does not claim to summarise every guide selection. Human quotation checking against the editions remains tracked separately.

## Technical rules

- Preferred host: https://actionablebooks.com, with permanent www redirects.
- Retain valuable paths. Explicit duplicate-profile aliases use forced 301 redirects; unrelated absent historical destinations remain absent.
- Old internal links are mapped only when the surviving source proves the destination. Lost historical links retain their words and original URL as non-clickable archive notes.
- Recovered media is served locally. Unretrievable illustrations use a labelled fallback rather than broken images or fabricated replacements.
- Fresh output is dist/. public/ is a retained historical snapshot and is not the publish directory.
- Every indexable route belongs in sitemap.xml. Selective lastmod values represent substantive source restoration or editorial change, never the current build time.
- Search, subscription utility, limited originals, empty historical stubs, held lists and redirect-source aliases are excluded from indexing. Do not robots-block a page whose noindex needs to be read.
- HTML attributes and JSON-LD have separate encoders. Metadata describes actual books and credits. Duplicate recurring articles use their historical dates to distinguish them.
- Book, Article, BlogPosting, Person, Organization, WebSite, WebPage and BreadcrumbList describe visible facts. Coauthors are separate people; a team credit is an organization. Do not invent ratings, credentials or FAQ rich-result eligibility.
- llms.txt and the linked text index are optional reader/crawler aids. They do not guarantee AI visibility or replace normal HTML discovery.

## Performance and reading

Use the existing red identity, local fonts, a readable prose measure, semantic headings, stable contents anchors, visible focus and accessible navigation. Public reading pages do not load the old Webflow, jQuery, Identity, repeated signup widgets or an inactive advertising script. New newsletter subscriptions are deliberately paused; the public site has no signup prompt or newsletter-service loader. Validate mobile and desktop loading on the hosted build; lab results do not replace field Core Web Vitals.

## Measurement and external placement

CONVERSION-PLAN.md defines the bounded, consented events. Keep the raw unsegmented traffic baseline separate from segmented reports. Low engagement in Direct traffic is a reason to investigate, not proof of bots. No ad-revenue forecast uses unvalidated sessions.

A fixed 15-question consumer baseline is retained across Google, ChatGPT and Claude, with additional Perplexity observations. Search/recall, location, login state and incomplete citations remain explicit. It is a diagnostic UK baseline, not a controlled US visibility index or a post-release uplift claim.

Three complete external drafts for LinkedIn and Medium are retained in RogerSon, with current platform rules, comparables, affiliation disclosures and exact destination links. No publication, new account, message or commercial agreement is authorized by this file. Human editorial completion and platform-account control must be verified before publication.

## Release and indexing

Run npm test and npm run build, then inspect the complete output and representative native interactions. The active Netlify Git build must also run tests before building. Verify the exact source commit through the hosted deployment and /_data/release.json; that JSON records build identity, not publication dates.

After release, verify redirects, 404 status, canonical host, sitemap, headers and the live URL corpus. Submit the corrected sitemap through Search Console and use supported URL inspection/request-indexing for a small set of eligible priority pages. Book summaries do not qualify for Google's restricted Indexing API. Submission is not a promise of indexing or ranking.

At days 7, 14, 28, 60 and 90 after the actual release, compare indexing, pages receiving impressions, clicks, query mix, country/device CTR, field performance and useful consented actions. Use the recorded revised cohort and an unchanged comparison group. Low counts and concurrent changes limit causal conclusions. Future observations remain pending until collected.
