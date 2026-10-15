# Actionable Books measurement

The useful actions are finding an original review, following a related archive entry, visiting a retailer and visiting Actionable. A click is not a purchase, accepted referral or revenue.

| Event | Trigger | Bounded properties |
| --- | --- | --- |
| page_view | A page opens after analytics is allowed | origin + path, title, referrer origin + path |
| summary_select | A summary card is clicked | content_path, content_family, page_location |
| archive_select | Another archive card is clicked | content_path, content_family, page_location |
| affiliate_click | A disclosed retailer link is clicked | merchant, book_slug, page_location |
| actionable_visit | An actionable.co link is clicked | destination_path, page_location |

Google Analytics G-1JN72T7V0Y remains unloaded before a decision and after rejection. The first layer gives equal access to reject and allow. Cookie settings remain in the footer. Withdrawal disables collection, removes applicable Analytics cookies and reloads the page. Regranting is supported.

Do not collect form text, email addresses, search phrases or arbitrary query strings. The existing GA4 stream's automatic search, form, outbound, file, video, scroll and page-change collection has been disabled and read back through its Admin API. Explicit page views and archive actions provide the intended smaller event set. Google Signals and advertising personalization are disabled in page configuration.

Only the three reviewed external-placement combinations are eligible for explicit campaign fields. Allowed source is linkedin or medium, medium is referral, campaign is external-search-pilot, and content is one of the exact p01-coaching-conversation, p02-purpose-decision or p03-autonomy-experiment identifiers with its matched source. Other URL campaign text is omitted. Actual campaign receipt must be verified before using a draft externally.

The established MailerLite form remains separate from Analytics. Its account 689644 and form 131015488096437258 are preserved; destination-group and double-opt-in confirmation still need that account's operator because available API access returns404. No email, subscription or CAPTCHA has been submitted for testing. Do not report successful delivery from client-side validation alone.

No display-ad network is activated. A future network requires the user's choice, verified eligibility and its actual consent requirements. This implementation is not proof that a future advertising CMP has been approved.
