# Actionable Books measurement

The useful actions are finding an original review, following a related archive entry, visiting a retailer and visiting Actionable. A click is not a purchase, accepted referral or revenue.

| Event | Trigger | Bounded properties |
| --- | --- | --- |
| page_view | A page opens after analytics is allowed | origin + path, title, referrer origin + path |
| summary_select | A summary card or search-result title is clicked | content_path, content_family, page_location |
| archive_select | Another archive card is clicked | content_path, content_family, page_location |
| affiliate_click | A disclosed retailer link is clicked | merchant, book_slug, page_location |
| actionable_visit | An actionable.co link is clicked | destination_path, page_location |

Google Analytics G-1JN72T7V0Y remains unloaded before a decision and after rejection. The first layer gives equal access to reject and allow. Cookie settings remain in the footer. Withdrawal disables collection, removes applicable Analytics cookies and reloads the page. Regranting is supported.

Do not collect form text, email addresses, search phrases or arbitrary query strings. The existing GA4 stream's automatic search, form, outbound, file, video, scroll and page-change collection has been disabled and read back through its Admin API. Explicit page views and archive actions provide the intended smaller event set. Google Signals and advertising personalization are disabled in page configuration.

Only the three reviewed external-placement combinations are eligible for explicit campaign fields. Allowed source is linkedin or medium, medium is referral, campaign is external-search-pilot, and content is one of the exact p01-coaching-conversation, p02-purpose-decision or p03-autonomy-experiment identifiers with its matched source. Other URL campaign text is omitted. Actual campaign receipt must be verified before using a draft externally.

Consented same-window selections wait for the tag's event callback, with an independent 500ms navigation fallback if the tag is blocked or unavailable. Modified clicks, downloads and new tabs retain browser behavior. Rejected analytics does not intercept navigation. Callback processing is not proof of an accepted sale, lead or subscription.

Andrew confirmed on 16 October that MailerLite is deliberately paused because of sending costs. The public signup prompt and loader are removed; /subscribe/ remains a noindex utility with an honest pause notice and links to the reviews, topics and contact page. No subscription form, MailerLite or reCAPTCHA loads. The existing account, audience, original form partial and double opt-in settings are retained. There is no pending upgrade or sender-change decision for this technical release. Resume newsletter work only when Andrew reopens it; do not migrate or send to the audience as part of SEO maintenance.

Andrew selected AdSense on 21 October. The existing publisher is declared through ads.txt and an ownership meta tag, which do not load advertising scripts. Site approval and advertising consent must be verified before serving; the current Analytics-only banner is not a certified advertising CMP. No ad impressions or paid revenue are inferred from an Auto ads toggle or review submission.
