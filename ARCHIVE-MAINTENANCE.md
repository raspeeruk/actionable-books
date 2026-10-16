# Writing and maintaining the archive

Write new reviews in the CMS's Original review Markdown field. It supplies the published body. The old Big Idea, Insight and Conclusion migration fields are hidden archive data and cannot override it. Give the book author and the review contributor their own correct fields.

The source lives in cms/. Shared layouts live in theme/. Build with npm run build; publish dist/, which is generated and ignored by Git. public/ is an old retained snapshot. Do not edit or deploy that snapshot. admin/ is retained separately for the existing authenticated CMS.

Run npm test before a release. The original 1,148 review bodies have immutable baseline hashes to catch accidental reassociation or replacement. Additions must not remove that baseline. An intentional rewrite of an existing archived review needs a named revision, explanation and verified review date; update its provenance evidence through a reviewed repository change rather than disguising a changed body as the preserved original. New human writing should not be attributed to an old contributor without their authorship.

cms/_data/archive-repairs.json records exact profile aliases, source-backed coauthor facts, factual correction notes and selective content-change dates. cms/_data/archive-media.json records verified local illustrations or explicit unavailable status. Keep book identity and source evidence when changing either. cms/_data/journeys.json contains later selection notes, separate from the original contributor reviews.

Netlify Git previews and the production Git build run tests before building. The separate GitHub verification workflow does not deploy. The old daily publisher was disabled for inactivity; do not reactivate its old schedule. Use the established main Git release path and verify its exact commit and dist output. /_data/release.json exposes build identity only.

Search Console submission follows live verification. Never substitute Google's job/video Indexing API for eligible book-summary indexing. Newsletter delivery/settings, affiliate account ownership, human quotation review and the paused ad-network choice remain distinct from source/build verification.

Andrew confirmed on 16 October 2026 that MailerLite is paused for cost reasons. Keep public signup disabled and /subscribe/ as a noindex pause notice. The historical newsletter partial and subscriber account are retained. Do not restore a loader, upgrade the plan, change the sender, migrate the audience or send a campaign unless newsletter work is explicitly reopened. This is not a technical-release blocker.
