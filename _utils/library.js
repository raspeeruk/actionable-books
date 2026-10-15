// Read-only catalog of the existing archive. Source paths, not titles or row
// positions, are the stable identity of a review and its relationships.
const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');

const DOMAIN = 'https://actionablebooks.com';
const ROOT = path.resolve(__dirname, '..');
const md = new MarkdownIt({ html: true, linkify: false });
const FAMILIES = ['summaries', 'authors', 'team', 'blog', 'lists', 'guides', 'summary-categories', 'blog-category', 'pages'];
const TOOLTIP_BLOCKS = new Set([
  'The Big Idea: The biggest takeaway from the book',
  'An actionable way to implement the Big Idea into your life'
]);

function normaliseInput(input) {
  return String(input || '').replaceAll('\\', '/').replace(/^\.\//, '').replace(/\.(html|json)$/, '.md');
}

function cleanBody(body) {
  // Only remove exact standalone remnants of the old WordPress interface.
  // Preserve the original review wording, quotations and paragraph order.
  return String(body || '').split(/\n\s*\n/).filter(block => !TOOLTIP_BLOCKS.has(block.trim())).join('\n\n').trim();
}

function plainText(markdown) {
  return md.render(String(markdown || ''))
    .replace(/<[^>]*>/g, ' ')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}

function excerpt(body, max = 180) {
  const paragraphs = cleanBody(body).split(/\n\s*\n/);
  const first = paragraphs.find(p => !/^\s*(?:>|#|!\[|\[?https?:\/\/|<)/.test(p) && !/^[-=]+\s*$/.test(p) && !/^Podcast:\s*Play in new window\s*\|\s*Download/i.test(plainText(p)) && plainText(p).length > 35);
  const text = plainText(first || body);
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(' ', max - 1);
  return text.slice(0, cut > max / 2 ? cut : max - 1).trim() + '…';
}

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function jsonLd(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
}

function slug(text) {
  return plainText(text).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function renderBody(body, { summary = false, resolveLink = null, resolveMedia = null, suppressMediaUrls = [], bookSlug = '' } = {}) {
  const text = cleanBody(body).split(/\n\s*\n/).filter(block => !suppressMediaUrls.some(url => block.includes(url) && /^(?:Podcast:|\[?https?:\/\/)/.test(block.trim()))).join('\n\n');
  const tokens = md.parse(text, {});
  for (const token of tokens) {
    const children = token.children || [];
    const links = [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.type === 'link_open') {
        const original = child.attrGet('href');
        const image = children[i + 1]?.type === 'image' && children[i + 2]?.type === 'link_close' ? children[i + 1] : null;
        const linkedMedia = image && resolveMedia ? resolveMedia(image.attrGet('src'), image.content) : null;
        const resolved = linkedMedia?.src || (resolveLink ? resolveLink(original) : original);
        links.push(resolved === null);
        if (resolved === null) {
          child.tag = 'span'; child.attrs = [['class', 'archived-link'], ['data-original-url', original]];
        } else {
          child.attrSet('href', resolved);
          try {
            const url = new URL(resolved);
            if (/(^|\.)amazon\.(com|co\.uk|ca|com\.au)$/.test(url.hostname)) {
              child.attrSet('rel', 'sponsored noopener'); child.attrSet('data-affiliate', 'amazon'); child.attrSet('data-book', bookSlug);
            }
          } catch (_) { /* Relative archive links are first party. */ }
        }
      } else if (child.type === 'link_close' && links.pop()) {
        child.tag = 'span';
        const note = new child.constructor('html_inline', '', 0);
        note.content = ' <small class="archive-link-note">(archived link unavailable)</small>';
        children.splice(++i, 0, note);
      } else if (child.type === 'image' && resolveMedia) {
        const original = child.attrGet('src');
        const media = resolveMedia(original, child.content);
        if (!media) {
          child.type = 'html_inline';
          child.content = `<span class="missing-illustration" data-original-url="${escapeHtml(original)}">Original illustration unavailable${child.content ? ': ' + escapeHtml(child.content) : ''}.</span>`;
        } else {
          child.attrSet('src', media.src); child.attrSet('loading', 'lazy'); child.attrSet('decoding', 'async');
          child.content = child.content || media.alt;
          if (media.width && media.height) { child.attrSet('width', media.width); child.attrSet('height', media.height); }
        }
      }
    }
  }
  const headings = [];
  const ids = new Map();
  let section = false;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type !== 'heading_open') continue;
    const inline = tokens[i + 1];
    const close = tokens[i + 2];
    const text = inline?.content || '';
    // Old exports put section labels at h3 and their subtitles at h2.
    // Correct the semantics in rendered HTML without editing the writing.
    const isSection = /^(?:the big idea|insight\s*#?\s*\d+|conclusion)$/i.test(text.trim());
    if (summary && isSection) {
      token.tag = close.tag = 'h2';
      section = true;
    } else if (summary && token.tag === 'h2' && section) {
      token.tag = close.tag = 'h3';
    } else if (token.tag === 'h1') {
      token.tag = close.tag = 'h2';
    }
    const base = slug(text) || 'section';
    const count = (ids.get(base) || 0) + 1;
    ids.set(base, count);
    const id = count > 1 ? `${base}-${count}` : base;
    token.attrSet('id', id);
    if (token.tag === 'h2') headings.push({ id, title: plainText(text) });
  }
  return { html: md.renderer.render(tokens, md.options, {}), headings };
}

function routeFor(family, fileSlug, data) {
  if (family === 'pages') return fileSlug === 'index' ? '/' : `/${fileSlug}/`;
  if (typeof data.permalink === 'string' && data.permalink.startsWith('/') && !data.permalink.includes('{{')) {
    return data.permalink.replace(/index\.html$/, '').replace(/\.html$/, '/');
  }
  return `/${family}/${fileSlug}/`;
}

function validDate(value) {
  if (!value || Number.isNaN(new Date(value).valueOf())) return null;
  return new Date(value).toISOString();
}

function createLibrary(root = ROOT) {
  const records = [];
  const editorialPath = path.join(root, 'cms', '_data', 'editorial.json');
  const editorial = fs.existsSync(editorialPath) ? JSON.parse(fs.readFileSync(editorialPath, 'utf8')) : {};
  const dataFile = name => {
    const file = path.join(root, 'cms', '_data', name + '.json');
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  };
  const repairs = dataFile('archive-repairs');
  const mediaMap = dataFile('archive-media');
  const journeys = dataFile('journeys');
  for (const family of FAMILIES) {
    const directory = path.join(root, 'cms', family);
    if (!fs.existsSync(directory)) continue;
    for (const filename of fs.readdirSync(directory).filter(f => f.endsWith('.md')).sort()) {
      const input = `cms/${family}/${filename}`;
      const source = matter.read(path.join(root, input));
      const data = source.data;
      const body = cleanBody(source.content);
      const url = routeFor(family, filename.slice(0, -3), data);
      let image = data.f_image?.url;
      if (image?.startsWith('/') && !fs.existsSync(path.join(root, 'theme', image))) {
        try { const decoded = decodeURIComponent(image); if (fs.existsSync(path.join(root, 'theme', decoded))) image = decoded; } catch (_) { /* Invalid historical escapes use the missing-cover fallback. */ }
      }
      const localImage = image?.startsWith('/') && fs.existsSync(path.join(root, 'theme', image));
      const imageUrl = localImage ? image.split('/').map(encodeURIComponent).join('/') : null;
      records.push({ input, family, slug: data.slug || filename.slice(0, -3), title: String(data.title || ''),
        url, absoluteUrl: DOMAIN + url, data, body, html: '', headings: [],
        excerpt: excerpt(body), image: imageUrl,
        imageAlt: data.f_image?.alt || data.title || '',
        // The 2024 migration timestamp is not an original publication date.
        published: family === 'blog' ? validDate(data['f_date-published']) : null,
        modified: validDate(data['reviewed-on']) || validDate(repairs.contentModified?.[url]),
        noindex: Boolean(data.seo?.noindex) || Boolean(repairs.aliases?.[url]) || (family === 'blog' && !body) || (family === 'lists' && editorial.lists?.[filename.slice(0, -3)]?.noindex === true && !journeys[url]) || (family === 'pages' && ['search', 'subscribe', 'abc'].includes(filename.slice(0, -3))),
        aliasOf: repairs.aliases?.[url] || null, journey: journeys[url] || null,
        correction: repairs.reviewNotes?.[url] || null,
        bookAuthorNames: repairs.bookAuthors?.[url] || null,
        summaries: [], articles: [], related: [] });
    }
  }
  const byInput = Object.fromEntries(records.map(r => [r.input, r]));
  const byUrl = Object.fromEntries(records.map(r => [r.url, r]));
  const resolve = ref => {
    const record = byInput[normaliseInput(ref)];
    return record?.aliasOf ? byUrl[record.aliasOf] : record || null;
  };
  const legacy = new Map(records.map(r => [r.url.toLowerCase(), r.url]));
  for (const [from, to] of Object.entries(repairs.links || {})) legacy.set(from.toLowerCase(), to);
  for (const [from, to] of Object.entries(repairs.aliases || {})) legacy.set(from.toLowerCase(), to);
  for (const record of records) {
    try {
      const old = new URL(record.data['f_original-url']);
      if (['actionablebooks.com', 'www.actionablebooks.com'].includes(old.hostname)) {
        legacy.set(old.pathname.toLowerCase(), record.url);
        legacy.set(old.pathname.replace(/^\/en-ca\//, '/').toLowerCase(), record.url);
      }
    } catch (_) { /* Original URLs are optional archival evidence. */ }
  }
  for (const record of records) {
    const resolveLink = href => {
      if (/^mailto:https?:\/\//i.test(href)) href = href.slice(7);
      if (!href || href.startsWith('#') || /^(?:mailto:|tel:)/i.test(href)) return href;
      try {
        const repaired = href.replace(/^\.\.\/(summaries|authors|team|blog)\//i, '/$1/').replace(/^(?=(?:www\.|actionable\.co\/|meetme\.so\/|itunes\.apple\.com\/))/i, 'https://');
        const url = new URL(repaired, record.absoluteUrl);
        if (!['actionablebooks.com', 'www.actionablebooks.com'].includes(url.hostname)) return repaired;
        let target = url.pathname.replace(/^\/en-ca\//i, '/').replace(/^\/articles\//i, '/summaries/').replace(/^\/summaries\/summaries\//i, '/summaries/');
        if (/^\/search-results\//.test(target)) {
          const malformed = target.match(/^\/search-results\/%3[fF](.*)$/);
          const params = malformed ? new URLSearchParams(decodeURIComponent(malformed[1])) : url.searchParams;
          return '/search/' + (params.get('search') ? '?query=' + encodeURIComponent(params.get('search')) : '');
        }
        if (target.startsWith('/writers/')) target = target.replace('/writers/', '/team/');
        if (target === '/search-results/') return '/search/' + (url.searchParams.get('search') ? '?query=' + encodeURIComponent(url.searchParams.get('search')) : '');
        if (!path.extname(target) && !target.endsWith('/')) target += '/';
        const retained = legacy.get(target.toLowerCase()) || legacy.get(url.pathname.toLowerCase()) || (byUrl['/blog' + target] ? '/blog' + target : null);
        return retained ? (repairs.aliases?.[retained] || retained) + url.search + url.hash : null;
      } catch (_) { return href; }
    };
    const resolveMedia = (src, alt) => {
      const media = mediaMap[src];
      if (media) return media.unavailable ? null : media;
      // Only media verified in the archive manifest is embedded. No broken or
      // external tracking pixels are revived by historical Markdown.
      return null;
    };
    const rendered = renderBody(record.body, { summary: record.family === 'summaries', resolveLink, resolveMedia, bookSlug: record.slug,
      suppressMediaUrls: record.slug === 'the-8-pillars-of-motivation' ? ['https://d3mkywnuoki91n.cloudfront.net/actionablebooks-com-wp-content/uploads/2013/02/ActionableBooks-Audio-20000-Days.mp3'] : [] });
    record.html = rendered.html;
    record.headings = rendered.headings;
    record.guideResources = (repairs.guideResources?.[record.url] || []).map(url => byUrl[url]).filter(Boolean);
  }
  for (const record of records) {
    if (record.family === 'summaries') {
      record.author = resolve(record.data.f_author);
      record.authorName = record.bookAuthorNames ? new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(record.bookAuthorNames) : record.data['f_author-plain-text'] || record.author?.title || '';
      record.contributor = resolve(record.data['f_team-2']);
      record.attributionNote = record.data['f_attribution-note'] || null;
      record.limitedArchive = Boolean(record.data['f_archive-limited']);
      record.topic = resolve(record.data['f_category-3']);
      if (record.author) record.author.summaries.push(record);
      if (record.contributor) record.contributor.summaries.push(record);
      if (record.topic) record.topic.summaries.push(record);
      const candidate = record.data['f_amazon-url'];
      try {
        const target = new URL(candidate);
        if (target.protocol === 'https:' && /(^|\.)amazon\.(com|co\.uk|ca|com\.au)$/.test(target.hostname)) record.purchaseUrl = target.href;
      } catch (_) { /* No invented purchase link for an absent/invalid value. */ }
    }
    if (record.family === 'blog') {
      record.contributor = resolve(record.data.f_team);
      record.topic = resolve(record.data['f_category-3']);
      if (record.contributor) record.contributor.articles.push(record);
      if (record.topic) record.topic.articles.push(record);
    }
  }
  const alphabetical = (a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }) || a.url.localeCompare(b.url);
  for (const record of records) {
    record.summaries.sort(alphabetical);
    record.articles.sort((a, b) => String(b.published).localeCompare(String(a.published)) || alphabetical(a, b));
    if (record.family === 'summaries') record.related = (record.topic?.summaries || []).filter(r => r !== record).slice(0, 4);
    record.description = record.family === 'summaries'
      ? `${record.title}${record.authorName ? ` by ${record.authorName}` : ''}${record.contributor && !record.attributionNote ? `, reviewed by ${record.contributor.title}` : ''}: ${record.excerpt || 'Read this archived book summary and its practical insights.'}`
      : record.data.description || record.data['f_meta-description'] || record.excerpt;
    if (record.family === 'authors') record.description = `${record.title}: explore ${record.summaries.length} book ${record.summaries.length === 1 ? 'summary' : 'summaries'} and original reader perspectives in the Actionable Books archive.`;
    if (record.family === 'team') record.description = `${record.title}: read ${record.summaries.length} original book ${record.summaries.length === 1 ? 'review' : 'reviews'} and ${record.articles.length} archive ${record.articles.length === 1 ? 'article' : 'articles'} by this Actionable Books contributor.`;
    if (record.family === 'blog' && record.description) record.description = `${record.title}: ${record.description}`;
    if (record.data.seo?.description) record.description = record.data.seo.description;
    if (!record.description) {
      if (record.family === 'authors') record.description = `Explore ${record.summaries.length} book summaries by ${record.title}, with practical insights from named Actionable Books contributors.`;
      else if (record.family === 'team') record.description = `Read ${record.title}'s contributions to Actionable Books, including ${record.summaries.length} book summaries and ${record.articles.length} articles.`;
      else if (record.family === 'summary-categories') record.description = `Browse ${record.summaries.length} ${record.title.toLowerCase()} book summaries and find ideas to put into practice.`;
      else if (record.family === 'blog-category') record.description = `Explore the ${record.title.toLowerCase()} archive from Actionable Books.`;
      else record.description = `Explore ${record.title} at Actionable Books: free book summaries, reader insights and practical ideas.`;
    }
  }
  const groups = Object.fromEntries(FAMILIES.map(f => [f, records.filter(r => r.family === f).sort(alphabetical)]));
  const duplicateTitles = new Map();
  for (const record of groups.summaries) {
    const key = record.title.toLowerCase();
    duplicateTitles.set(key, (duplicateTitles.get(key) || 0) + 1);
  }
  for (const record of records) {
    record.metaTitle = record.family === 'summaries'
      ? `${record.title}${record.authorName ? ` by ${record.authorName}` : ''} | ${duplicateTitles.get(record.title.toLowerCase()) > 1 && record.contributor ? `${record.contributor.title}'s summary | ` : ''}Actionable Books`
      : `${record.title}${record.family === 'authors' ? ': Books and summaries' : record.family === 'team' ? ': Contributor' : ''} | Actionable Books`;
    if (record.family === 'summary-categories') record.metaTitle = `${record.title} book summaries | Actionable Books`;
    if (record.family === 'blog-category') record.metaTitle = `${record.title} articles | Actionable Books`;
    if (record.data.seo?.title) record.metaTitle = record.data.seo.title;
  }
  const blogTitles = new Map();
  for (const r of groups.blog) blogTitles.set(r.title, (blogTitles.get(r.title) || 0) + 1);
  for (const r of groups.blog) {
    if (blogTitles.get(r.title) > 1 && r.published) r.metaTitle = `${r.title} (${new Date(r.published).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}) | Actionable Books`;
    if (!r.body) r.description = `Historical archive record for ${r.title}${r.published ? ', dated ' + r.published.slice(0, 10) : ''}. The article text is not available in the preserved archive.`;
  }
  const utility = {
    '/': ['Free book summaries and practical insights | Actionable Books', `Explore ${groups.summaries.length.toLocaleString('en')} free book summaries, with original contributor perspectives, big ideas and practical insights from the Actionable Books archive.`],
    '/about/': ['About Actionable Books', 'Learn about the original Actionable Books archive, its contributors and how to use the summaries. Operated by Actionable.co Canada Inc.'],
    '/contact/': ['Contact Actionable Books', 'Contact Actionable about Actionable Books, archive corrections, contributor attribution and privacy questions.'],
    '/privacy-policy/': ['Privacy at Actionable Books', 'Understand optional analytics, newsletter services, affiliate links and privacy choices at Actionable Books.'],
    '/topics/': ['Book summaries by topic | Actionable Books', 'Explore leadership, communication, self-management and other topics in the original Actionable Books summary archive.']
  };
  for (const [url, [title, description]] of Object.entries(utility)) {
    if (byUrl[url]) { byUrl[url].metaTitle = title; byUrl[url].description = description; }
  }
  return { records, byInput, byUrl, groups, resolve, domain: DOMAIN, repairs };
}

function schemaFor(record) {
  const publisher = { '@id': DOMAIN + '/#organization' };
  const organization = { '@type': 'Organization', '@id': publisher['@id'], name: 'Actionable Books', url: DOMAIN + '/', logo: DOMAIN + '/assets/images/actionable-books-logo-rgb.svg', parentOrganization: { '@type': 'Organization', '@id': 'https://actionable.co/#organization', name: 'Actionable.co Canada Inc.', url: 'https://actionable.co/' } };
  const graph = [organization, { '@type': 'WebSite', '@id': DOMAIN + '/#website', name: 'Actionable Books', url: DOMAIN + '/', publisher }, { '@type': 'WebPage', '@id': record.absoluteUrl + '#page', url: record.absoluteUrl, name: record.metaTitle, description: record.description, isPartOf: { '@id': DOMAIN + '/#website' } }];
  if (record.family === 'summaries') {
    const book = { '@type': 'Book', '@id': record.absoluteUrl + '#book', name: record.title };
    if (record.bookAuthorNames) book.author = record.bookAuthorNames.map(name => ({ '@type': 'Person', name }));
    else if (record.authorName) book.author = { '@type': 'Person', name: record.authorName, ...(record.author ? { '@id': record.author.absoluteUrl + '#person', url: record.author.absoluteUrl } : {}) };
    if (record.image) book.image = DOMAIN + record.image;
    const article = { '@type': 'Article', headline: record.title + ': Book summary', description: record.description, mainEntityOfPage: record.absoluteUrl, about: { '@id': book['@id'] }, publisher };
    if (record.contributor && !record.attributionNote) article.author = { '@type': record.contributor.title === 'Actionable Team' ? 'Organization' : 'Person', '@id': record.contributor.absoluteUrl + '#person', name: record.contributor.title, url: record.contributor.absoluteUrl };
    if (record.modified) article.dateModified = record.modified;
    graph.push(book, article);
  } else if (['authors', 'team'].includes(record.family)) {
    graph.push({ '@type': record.title === 'Actionable Team' ? 'Organization' : 'Person', '@id': record.absoluteUrl + '#person', name: record.title, url: record.absoluteUrl });
  } else if (record.family === 'blog') {
    const article = { '@type': 'BlogPosting', headline: record.title, description: record.description, mainEntityOfPage: record.absoluteUrl, publisher };
    if (record.published) article.datePublished = record.published;
    if (record.modified) article.dateModified = record.modified;
    if (record.contributor) article.author = { '@type': record.contributor.title === 'Actionable Team' ? 'Organization' : 'Person', '@id': record.contributor.absoluteUrl + '#person', name: record.contributor.title, url: record.contributor.absoluteUrl };
    graph.push(article);
  }
  const parents = { summaries: ['Book summaries', '/summaries/'], authors: ['Book authors', '/authors/'], team: ['Contributors', '/team/'], blog: ['Articles', '/blog/'], lists: ['Reading lists', '/lists/'], guides: ['Reading guides', '/guides/'] };
  if (parents[record.family]) {
    const [name, url] = parents[record.family];
    graph.push({ '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: DOMAIN + '/' },
      { '@type': 'ListItem', position: 2, name, item: DOMAIN + url },
      { '@type': 'ListItem', position: 3, name: record.title, item: record.absoluteUrl }
    ] });
  } else if (record.url !== '/') {
    graph.push({ '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: DOMAIN + '/' },
      { '@type': 'ListItem', position: 2, name: record.title, item: record.absoluteUrl }
    ] });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

module.exports = { DOMAIN, FAMILIES, normaliseInput, cleanBody, plainText, excerpt, escapeHtml, jsonLd, renderBody, routeFor, createLibrary, schemaFor };
