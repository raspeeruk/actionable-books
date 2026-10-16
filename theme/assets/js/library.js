(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-navigation');
  const closeMenu = () => { menu?.setAttribute('aria-expanded', 'false'); nav?.classList.remove('is-open'); };
  menu?.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
  nav?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });

  const consentKey = 'actionablebooks-privacy-v1';
  const measurementId = 'G-1JN72T7V0Y';
  const panel = document.getElementById('cookie-panel');
  let choice = null;
  let analyticsLoaded = false;
  try { choice = localStorage.getItem(consentKey); } catch (_) { /* Session choice still works if storage is unavailable. */ }
  const pageUrl = location.origin + location.pathname;
  // Accept only the three reviewed placement identifiers. Arbitrary URL text,
  // including search terms, never becomes an Analytics campaign field.
  function campaignFields() {
    const p = new URLSearchParams(location.search);
    const placements = { 'p01-coaching-conversation': 'linkedin', 'p02-purpose-decision': 'linkedin', 'p03-autonomy-experiment': 'medium' };
    const content = p.get('utm_content');
    if (p.get('utm_medium') !== 'referral' || p.get('utm_campaign') !== 'external-search-pilot' || placements[content] !== p.get('utm_source')) return {};
    return { campaign_source: placements[content], campaign_medium: 'referral', campaign_name: 'external-search-pilot', campaign_content: content };
  }
  const cleanReferrer = () => { try { const url = new URL(document.referrer); return url.origin + url.pathname; } catch (_) { return ''; } };
  function loadAnalytics() {
    if (analyticsLoaded || choice !== 'granted') return;
    window['ga-disable-' + measurementId] = false;
    analyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: false, page_location: pageUrl, page_referrer: cleanReferrer(), allow_google_signals: false, allow_ad_personalization_signals: false, ...campaignFields() });
    window.gtag('event', 'page_view', { page_location: pageUrl, page_referrer: cleanReferrer(), page_title: document.title });
    const script = document.createElement('script'); script.async = true; script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId; document.head.append(script);
  }
  function clearAnalyticsCookies() {
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.trim().split('=')[0];
      if (!/^_ga(?:_|$)|^_gid$|^_gat/.test(name)) continue;
      for (const domain of ['', location.hostname, '.' + location.hostname, '.actionablebooks.com']) document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax' + (domain ? '; domain=' + domain : '');
    }
  }
  if (choice === 'granted') loadAnalytics();
  if (panel && !['granted', 'denied'].includes(choice)) panel.hidden = false;
  document.querySelectorAll('[data-cookie-settings]').forEach(button => button.addEventListener('click', () => { panel.hidden = false; panel.querySelector('button')?.focus(); }));
  document.querySelectorAll('[data-consent]').forEach(button => button.addEventListener('click', () => {
    const previouslyLoaded = analyticsLoaded;
    choice = button.dataset.consent;
    try { localStorage.setItem(consentKey, choice); } catch (_) { /* The decision applies to this page. */ }
    panel.hidden = true;
    if (choice === 'granted') loadAnalytics();
    else { window['ga-disable-' + measurementId] = true; clearAnalyticsCookies(); if (previouslyLoaded) location.reload(); }
  }));
  document.addEventListener('click', event => {
    if (!analyticsLoaded || choice !== 'granted') return;
    const link = event.target.closest('a');
    if (!link) return;
    let name, fields;
    if (link.dataset.affiliate) { name = 'affiliate_click'; fields = { merchant: link.dataset.affiliate, book_slug: link.dataset.book }; }
    else if (link.dataset.contentFamily) { name = link.dataset.contentFamily === 'summaries' ? 'summary_select' : 'archive_select'; fields = { content_path: new URL(link.href).pathname, content_family: link.dataset.contentFamily }; }
    else if (link.hostname === 'actionable.co') { name = 'actionable_visit'; fields = { destination_path: link.pathname }; }
    if (!name) return;
    fields.page_location = pageUrl;
    // Give the tag a bounded opportunity to send before this document unloads.
    // New tabs, modified clicks and already handled actions keep native behavior.
    const sameWindow = (!link.target || link.target === '_self') && !link.hasAttribute('download');
    if (sameWindow && event.button === 0 && !event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      let navigated = false;
      const follow = () => { if (!navigated) { navigated = true; location.assign(link.href); } };
      setTimeout(follow, 500);
      try { window.gtag('event', name, { ...fields, event_callback: follow, event_timeout: 500 }); }
      catch (_) { follow(); }
    } else window.gtag('event', name, fields);
  });

  const searchInput = document.getElementById('search-query');
  if (searchInput) {
    const query = (new URLSearchParams(location.search).get('query') || '').trim().slice(0, 200);
    searchInput.value = query;
    if (query) {
      const status = document.getElementById('search-status');
      status.textContent = 'Searching the summary library…';
      fetch('/_data/search-index.json').then(response => { if (!response.ok) throw new Error('Search unavailable'); return response.json(); }).then(books => {
        const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
        const matches = books.filter(book => terms.every(term => (book.title + ' ' + book.authorName).toLocaleLowerCase().includes(term)));
        status.textContent = matches.length ? `${matches.length} matching ${matches.length === 1 ? 'summary' : 'summaries'}${matches.length > 60 ? '. Showing the first 60' : ''}.` : 'No matching summaries. Try a shorter title or an author’s name.';
        const list = document.createElement('ul'); list.className = 'search-results-list';
        for (const book of matches.slice(0, 60)) {
          const item = document.createElement('li'), heading = document.createElement('h2'), link = document.createElement('a'), author = document.createElement('p'), text = document.createElement('p');
          link.href = book.url; link.dataset.contentFamily = 'summaries'; link.textContent = book.title; heading.append(link); author.textContent = book.authorName; author.className = 'small'; text.textContent = book.excerpt; item.append(heading, author, text); list.append(item);
        }
        document.getElementById('search-results').replaceChildren(list);
      }).catch(() => { status.textContent = 'Search is temporarily unavailable. Use All summaries or Topics to browse the complete library.'; });
    }
  }
  document.getElementById('load-newsletter')?.addEventListener('click', event => {
    event.currentTarget.hidden = true;
    document.getElementById('newsletter-form').hidden = false;
    window.ml_webform_success_17590592 = () => { document.querySelector('#newsletter-form .row-form').style.display = 'none'; document.querySelector('#newsletter-form .row-success').style.display = 'block'; };
    for (const url of ['https://www.google.com/recaptcha/api.js', 'https://groot.mailerlite.com/js/w/webforms.min.js?v2d8fb22bb5b3677f161552cd9e774127']) { const script = document.createElement('script'); script.src = url; script.async = true; document.body.append(script); }
    document.getElementById('newsletter-email').focus();
  }, { once: true });
})();
