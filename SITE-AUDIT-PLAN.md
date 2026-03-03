# Actionable Books: Full Site Audit, SEO Fix & Revenue Growth Plan

## Context

actionablebooks.com is a business book summary site (1,148 summaries, 549 blog posts, 876 authors) rebuilt from WordPress → Webflow → Eleventy 2.0.1 on Netlify. The migration left gaps: 225+ summaries with missing content, no structured data, no redirects from old WordPress URLs, and ~350KB of Webflow CSS/JS bloat. The original Airtable data is available at `Original Files/` to restore missing content.

**Primary goal:** Maximize affiliate revenue (Amazon Associates + AdSense) while growing organic traffic through new high-converting content pages and technical SEO fixes.

**Content approach:** AI-generated (Claude Sonnet) new content, clearly labeled as AI-written vs human-written.

**Affiliate setup:** Owner is changing affiliate tag (will provide new one). GeniusLink has been discontinued — we'll build a lightweight geo-redirect replacement.

---

## Phase 1: Critical Fixes (Sprint 1)

Quick wins that have immediate SEO impact, zero risk.

### 1.1 Fix site domain config
- **File:** `cms/_data/settings/site.json`
- Set `"domain": "https://www.actionablebooks.com"` (currently empty — breaks sitemap URLs, OG images, canonical tags)

### 1.2 Fix robots.txt
- **File:** `cms/pages/robots.njk`
- Add `Sitemap: https://www.actionablebooks.com/sitemap.xml`

### 1.3 Fix CMS branch reference
- **File:** `admin/config.yml`
- Change `branch: master` → `branch: main` (repo is on `main`)

### 1.4 Add 301 redirects from old WordPress URLs
- **File:** `netlify.toml`
- Add wildcard redirects for the `/en-ca/` prefix pattern:
  ```
  /en-ca/summaries/* → /summaries/:splat (301)
  /en-ca/authors/* → /authors/:splat (301)
  /en-ca/blog/* → /blog/:splat (301)
  /en-ca/* → /:splat (301)
  ```
- Cross-reference `Original URL` and `New URL` columns in `Original Files/Summaries-Grid view (24).csv` to catch any slug changes
- Also add redirects for dead sections: `/news/*` → `/blog/` and `/wp-admin/*` → `/`

### 1.5 Re-enable HTML minification
- **File:** `_utils/transforms/index.js`
- Uncomment the minification block, add try/catch guard for graceful fallback
- Est. 15-25% reduction in HTML file sizes across 2,500+ pages

### 1.6 Remove empty News section
- Delete `theme/[news].html` and `cms/news/` directory
- Add `/news/*` redirect to `/blog/`

### 1.7 Replace GeniusLink with lightweight geo-redirect script
- GeniusLink has been discontinued — remove the `geniuslinkcdn.com` script from all 32+ templates
- Write `theme/assets/js/amazon-geo.js` (~2KB) that:
  - Detects visitor's locale via `navigator.language` / `Intl.DateTimeFormat().resolvedOptions().timeZone`
  - Maps to correct Amazon domain (US→amazon.com, UK→amazon.co.uk, CA→amazon.ca, DE→amazon.de, etc.)
  - Rewrites all `amazon.com` hrefs on the page to the correct regional domain, preserving the ASIN and affiliate tag
  - Runs on DOMContentLoaded, similar to GeniusLink's pattern
- No third-party dependency, no cost, you own the code

### 1.8 Update affiliate tag across all content
- When owner provides new affiliate tag, run bulk find-and-replace:
  - Replace `tag=gooseducmedi-20` with new tag across all 1,145+ summary markdown files
  - Update any hardcoded references in templates
  - Verify with spot-check of 10 pages

---

## Phase 2: Restore Missing Content from Airtable (Sprint 2)

### 2.1 Build Airtable import script
- **Source data:** `Original Files/Summaries-Grid view (24).csv` (369K+ rows, 36 columns)
- **Key field mappings:**
  | CSV Column | Frontmatter Field |
  |---|---|
  | `The Big Ideas` | `f_big-idea` |
  | `Insight 1` | `f_insight-1` |
  | `Insight 2` | `f_insight-2` |
  | `Conclusion` | `f_conclusion` |
  | `Quote` | `f_quote-2` |
  | `Quote Reference` | `f_quote-reference` |
  | `Amazon_Referral_LInk` | `f_amazon-url` |
- **Match on:** `Unique Number` → `f_unique-number` (most reliable), fallback to `Slug`
- Create script at `_utils/scripts/import-airtable.js` using `gray-matter` + `csv-parse`
- Fill only empty/missing fields — never overwrite existing content

### 2.2 Run content audit before/after
- Build audit script to count summaries with empty `f_conclusion`, `f_big-idea`, `f_quote-2`
- Run before import (baseline) and after (verify)
- Target: 225 missing conclusions and 34 missing big ideas restored

### 2.3 Batch fix image alt tags
- All 1,149 summaries have `alt: null` in `f_image`
- Automated fix: set `alt` to `"[Book Title] book cover"` for summaries, `"[Author Name]"` for authors
- Fix template references in `[summaries].html`, `[authors].html`, `[blog].html` that use global image alt IDs instead of per-item alt values

---

## Phase 3: Structured Data & On-Page SEO (Sprint 3)

### 3.1 Add JSON-LD to summary pages
- **File:** `theme/[summaries].html`
- Add `Review` + `Book` schema (title, author, publisher, image, review body from big idea)
- This is the single highest-impact SEO change — enables rich snippets for 1,148 pages

### 3.2 Add JSON-LD to author pages
- **File:** `theme/[authors].html`
- Add `Person` schema (name, image, sameAs for Twitter/website)

### 3.3 Add JSON-LD to homepage
- **File:** `theme/index.html`
- Add `Organization` schema + `WebSite` schema with SearchAction (enables sitelinks searchbox)

### 3.4 Add breadcrumb navigation + BreadcrumbList schema
- Create breadcrumb partial at `theme/partials/_breadcrumbs.liquid`
- Add to all detail templates: `[summaries].html`, `[authors].html`, `[blog].html`, `[team].html`
- Pattern: Home > Summaries > [Book Title] (with JSON-LD BreadcrumbList)

### 3.5 Optimize title tags
- Summary pages: change `{{ title }} | Actionable Books` → `{{ title }} by {{ f_author-plain-text }} - Summary | Actionable Books`
- Targets "[book] summary" search queries directly

### 3.6 Fix lazy loading on above-the-fold images
- Remove `loading="lazy"` from logo images in navbar
- Change book cover image in `[summaries].html` to `loading="eager"` (it's above the fold)
- Add `fetchpriority="high"` to LCP images

### 3.7 Add preconnect hints
- Add `<link rel="preconnect">` for googletagmanager, mailerlite assets
- Add `<link rel="dns-prefetch">` for AdSense, BunnyCDN

### 3.8 Only load reCAPTCHA on form pages
- Currently loads on ALL pages — move to only `contact.html` and `subscribe.html`

---

## Phase 4: Replace Webflow CSS/JS (Sprint 4)

### 4.1 CSS audit
- Create `_utils/scripts/audit-css.js` to identify used vs. unused CSS classes across all rendered pages
- Expected: large portion of 144KB `actionable-books.webflow.css` is unused

### 4.2 PurgeCSS integration
- Add PurgeCSS as build step to strip unused rules
- Expected reduction: 144KB → ~30-40KB

### 4.3 Replace webflow.js (200KB) + jQuery (90KB) with vanilla JS (~3KB)
- Write `theme/assets/js/site.js` covering only what's needed:
  - Mobile hamburger menu toggle (`.w-nav-button` / `.w-nav-menu`)
  - Dropdown menu open/close (`.w-dropdown` / `.w-dropdown-list`)
- GeniusLink already removed (Phase 1.7) — jQuery no longer needed
- **Total JS savings: ~287KB**

### 4.4 Consolidate CSS files
- Keep `normalize.css` (8KB)
- Merge purged Webflow CSS into single `styles.css`
- Add CSS minification build step

---

## Phase 5: New Revenue-Driving Content (Sprint 5-6)

### 5.1 Create "Curated Lists" collection (books AND products)
- New folder: `cms/lists/`
- New collection in `admin/config.yml` with fields:
  - `title`, `slug`, `list_type` (best-of-year | best-for-role | books-like | themed | gear | tools)
  - `list_category` (books | productivity-gear | office-setup | software | gifts)
  - `target_keyword`, `meta_description`
  - `f_books` (references to summary markdown files — for book lists)
  - `f_products` (for non-book items — title, description, amazon_url, image, price_range)
  - `f_intro`, `f_conclusion`, `f_content_type` (human | ai)
- New template: `theme/[lists].html` — numbered cards with image, title, blurb, "Buy on Amazon" CTA
  - For book items: also shows "Read Summary" link
  - For product items: shows price range and key specs
- New index page: `theme/lists.html`

### 5.2 Create first 10 list pages (Tier 1 — highest revenue potential)
1. Best Leadership Books 2026
2. Best Self-Help Books 2026
3. Best Business Books 2026
4. Best Books for New Managers
5. Best Communication Books
6. Books Like Start With Why
7. Best Books for Entrepreneurs
8. Best Productivity Books
9. Best Emotional Intelligence Books
10. Books Like Good to Great

### 5.3 Create next 10 list pages (Tier 2 — books)
11. Best Innovation Books
12. Best Books for CEOs
13. Best Team Building Books
14. Books Like Thinking, Fast and Slow
15. Best Negotiation Books
16. Best Company Culture Books
17. Best Books for First-Time Leaders
18. Best Decision Making Books
19. Best Business Books for Women
20. Books Like Drive by Daniel Pink

### 5.4 Create high-ticket product lists (Tier 3 — gear/tools)
These target your same audience but with much higher commission per sale:
- Books: 4.5% on ~$20 = $0.90 per sale
- Gear: 3% on ~$300 = $9 per sale (10x more per click)

**Priority product list pages:**
21. Best Standing Desks for Home Offices (desks: $300-800)
22. Best Noise-Cancelling Headphones for Deep Work (headphones: $150-400)
23. Best Monitors for Working From Home (monitors: $300-600)
24. The Entrepreneur's Home Office Setup Guide (mega-list: desk + chair + monitor + accessories)
25. Best Productivity Journals and Planners (journals: $15-40 — volume play)
26. Best Audiobook Services for Business Readers (Audible affiliate + comparisons)
27. Best Gifts for Business Book Lovers (seasonal: books + gear + subscriptions)
28. Best Whiteboards and Planning Tools for Teams (boards: $50-300)
29. Best Webcams and Mics for Remote Leaders (tech: $80-300)
30. Best E-Readers for Business Readers (Kindle: $100-350)

**Why this works:** Your audience reads business books because they want to level up professionally. They're the same people buying standing desks, noise-cancelling headphones, and productivity tools. The brand alignment is natural.

### 5.5 AI content labeling
- Add `f_content_type` field (human | ai) to `blog` and `lists` collections
- Render transparent disclosure on AI content: "This content was created with AI assistance (Claude by Anthropic) and reviewed by our editorial team."
- Placement: top of list pages, bottom of blog posts

---

## Phase 6: Enhanced Monetization on Existing Pages (Sprint 7)

### 6.1 Improve summary page CTAs
- **File:** `theme/[summaries].html`
- Add inline "Get this book on Amazon" CTA after the h1 title (above the fold)
- Add mid-content text CTA between Insight 1 and Insight 2: "Enjoying this summary? Get the full book on Amazon"
- Swap CTA button prominence: make "Buy The Book" the primary (filled) button, "Read More Summaries" secondary (outline) — currently reversed
- Add AdSense in-article unit between insights

### 6.2 Add "Related Books" section to summaries
- Show 4-6 books from same `f_category-3` at bottom of each summary
- Each card: cover image, title (linked to summary), author, "Buy on Amazon" link
- This adds 4-6 extra affiliate click opportunities per page

### 6.3 Add "Featured In" section to summaries
- When a book appears in a list page, show "Featured in: Best Leadership Books 2026" link
- Improves internal linking and drives traffic to high-converting list pages

### 6.4 Consider Bookshop.org as secondary affiliate
- 10% commission vs Amazon's 4.5% for physical books
- Add as small secondary link below Amazon CTA on 50 most popular summaries
- 90-day test, track via UTM parameters, roll out if ROI positive

---

## Phase 7: Internal Linking Architecture (Sprint 8)

### 7.1 Hub-and-spoke model
```
Homepage
├── /summaries/ (hub) → /summaries/[book]/ (spokes)
├── /lists/ (new hub) → /lists/[list-page]/ (spokes)
├── /summary-categories/[cat]/ (mini hubs)
└── /blog/ (hub) → /blog/[post]/ (spokes)
```

### 7.2 Linking rules
- Every summary → links to 1-2 relevant list pages ("Featured In")
- Every list page → links to each book's summary page + 3-4 related lists
- Every category page → links to the "Best [Category] Books" list page at top
- Blog posts → contextual links to relevant summaries and list pages
- Author pages → link to all summaries + any list pages featuring their books

---

## Phase 8: LLM Search Readiness (Sprint 9)

AI search (ChatGPT, Perplexity, Google AI Overviews, Gemini) is increasingly how people discover content. Your 1,148 structured summaries are *perfectly* suited for AI citation — but we need to make the content more extractable.

### 8.1 Add `llms.txt` file
- Create `cms/pages/llms-txt.njk` → generates `/llms.txt`
- This emerging standard tells AI crawlers what your site is, what it offers, and how to cite it
- Content: site description, content types, citation format, key pages
- Also create `/llms-full.txt` with a machine-readable index of all summaries (title, author, URL, category)

### 8.2 Add FAQ schema to summary pages
- **File:** `theme/[summaries].html`
- Add FAQPage JSON-LD with 3 auto-generated questions per book:
  - "What is [Book Title] about?" → answer from `f_big-idea`
  - "What are the key takeaways from [Book Title]?" → answer from `f_insight-1` + `f_insight-2`
  - "Who should read [Book Title]?" → generated from category + content
- FAQ schema gets cited heavily by AI search and appears as rich snippets in Google

### 8.3 Add "Key Takeaways" block at top of summaries
- Structured `<ul>` list with 3-5 bullet points (extracted from big idea + insights)
- Placed immediately after h1, before the full summary
- LLMs strongly prefer pulling from concise, structured lists near the top of a page
- Also improves human UX — readers get the gist in 10 seconds

### 8.4 Ensure AI crawler access
- Current `robots.txt` allows all bots — good, keep it
- Do NOT add blocks for GPTBot, ClaudeBot, PerplexityBot, etc.
- These crawlers drive traffic back to your site via citations with links

### 8.5 Structured data for AI extraction
- The JSON-LD Book + Review schema (Phase 3) already helps LLMs understand content type
- The BreadcrumbList schema helps LLMs understand site hierarchy
- The FAQ schema (8.2) provides direct Q&A pairs that LLMs prefer to cite

### 8.6 Content format optimization for AI citation
- Ensure every summary has a clear first paragraph that answers "What is this book about?"
- Use `<h2>` and `<h3>` headings consistently (Big Idea, Insight 1, Insight 2, Conclusion)
- Include the book title and author name in the first sentence of every summary
- List pages should use numbered lists with clear "why" reasoning for each pick

---

## Phase 9: Content Calendar & Email Strategy (Ongoing)

### 8.1 Weekly publishing schedule
| Week | Content Type | Source |
|---|---|---|
| Week 1 | "Best [Topic] Books" list page | AI-drafted, human-reviewed |
| Week 2 | "Books Like [Title]" comparison page | AI-drafted, human-reviewed |
| Week 3 | Blog post (how-to-apply or interview) | Mix of AI and human |
| Week 4 | "Best Books for [Role]" page | AI-drafted, human-reviewed |

### 8.2 Seasonal content calendar
| Month | Opportunity |
|---|---|
| January | "Best Books to Start 2027 Right", "Goal-Setting Books" |
| May | "Best Books for New Graduates" |
| June | "Summer Reading List for Business Leaders" |
| November | "Best Business Books Gift Guide 2026" (HIGHEST revenue potential — publish by Nov 1) |
| December | "Best Business Books of 2026: Year in Review" |

### 8.3 Email marketing (MailerLite)
- **Weekly "Book of the Week"** email: hook from `f_quote-2`, truncated big idea, "Get This Book on Amazon" CTA + "Read Full Summary" link
- **5-email welcome sequence:** top summaries → reading style quiz → personalized recommendation → application blog posts → curated 10-book list (heavy affiliate content)
- **Monthly "Best Of" email:** feature newest list page, driving traffic to highest-converting pages
- **Segmentation:** by interest category (Leadership, Self-Management, Communication, etc.)

---

## Verification Plan

### After each phase, verify:
1. `npm run build` completes without errors
2. Spot-check 5-10 pages across types (summary, blog, author, list) for correct rendering
3. Validate JSON-LD with Google's Rich Results Test (https://search.google.com/test/rich-results)
4. Check 301 redirects work: `curl -I https://www.actionablebooks.com/en-ca/summaries/start-with-why/`
5. Run Lighthouse audit for Core Web Vitals scores (target: 90+ performance)
6. Submit updated sitemap to Google Search Console
7. Monitor Google Search Console for crawl errors, structured data issues
8. Track affiliate click-through rates via Amazon Associates dashboard by page type
9. Test `llms.txt` is accessible at `https://www.actionablebooks.com/llms.txt`
10. Search for your site in ChatGPT/Perplexity to verify AI citation after changes propagate

### Key files to modify:
- `cms/_data/settings/site.json` — domain config
- `cms/pages/robots.njk` — sitemap reference
- `admin/config.yml` — branch fix, new lists collection
- `netlify.toml` — 301 redirects
- `_utils/transforms/index.js` — re-enable minification
- `theme/[summaries].html` — JSON-LD, breadcrumbs, CTAs, related books, alt tags, lazy loading
- `theme/[authors].html` — JSON-LD, breadcrumbs, alt tags
- `theme/[blog].html` — JSON-LD, breadcrumbs
- `theme/index.html` — Organization + WebSite JSON-LD
- `theme/assets/css/actionable-books.webflow.css` — PurgeCSS
- `theme/assets/js/webflow.js` — replace with lightweight `site.js`
- New: `cms/lists/`, `theme/[lists].html`, `theme/lists.html`
- New: `theme/assets/js/amazon-geo.js` — GeniusLink replacement
- New: `cms/pages/llms-txt.njk` — LLM search readiness
- New: `_utils/scripts/import-airtable.js`, `_utils/scripts/audit-css.js`
