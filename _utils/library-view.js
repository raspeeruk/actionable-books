const { DOMAIN, normaliseInput, schemaFor, excerpt } = require('./library');

const card = r => ({ input: r.input, title: r.title, url: r.url, image: r.image, excerpt: r.excerpt, authorName: r.authorName || '', published: r.published, family: r.family });

function createView(catalog) {
  const directories = [];
  function directory(base, title, description, records) {
    const size = 24;
    const pages = Math.max(1, Math.ceil(records.length / size));
    for (let index = 0; index < pages; index++) {
      const url = index === 0 ? base : `${base}page/${index + 1}/`;
      const pageDescription = index ? `${description} Page ${index + 1} of ${pages}. Includes ${records.slice(index * size, index * size + 3).map(r => r.title).join(', ')}.` : description;
      directories.push({ url, base, title: title + (index ? `: Page ${index + 1}` : ''), description: pageDescription, page: index + 1, total: records.length, noindex: Boolean(catalog.byUrl[base]?.noindex),
        items: records.slice(index * size, (index + 1) * size).map(card),
        previous: index ? (index === 1 ? base : `${base}page/${index}/`) : null,
        next: index + 1 < pages ? `${base}page/${index + 2}/` : null });
    }
  }
  directory('/summaries/', 'Book summaries', 'Find a book, read a contributor’s perspective and choose an idea to put into practice.', catalog.groups.summaries);
  directory('/authors/', 'Book authors', 'Explore the authors whose books appear in the Actionable Books archive.', catalog.groups.authors);
  directory('/team/', 'Summary contributors', 'Meet the readers who contributed summaries and articles to Actionable Books.', catalog.groups.team);
  directory('/blog/', 'Articles and interviews', 'Explore the original Actionable Books articles and author interviews. Dates and biographies describe the historical archive.', [...catalog.groups.blog].sort((a, b) => String(b.published).localeCompare(String(a.published))));
  directory('/lists/', 'Reading lists', 'Explore existing reading lists and follow their links to the original book summaries.', catalog.groups.lists);
  for (const r of catalog.records) {
    if (['authors', 'team', 'summary-categories', 'blog-category'].includes(r.family)) {
      directory(r.url, r.family === 'team' ? `Writing by ${r.title}` : r.family === 'authors' ? `Books by ${r.title}` : r.family === 'summary-categories' ? `${r.title} book summaries` : r.family === 'blog-category' ? `${r.title} articles` : r.title,
        r.description, [...r.summaries, ...r.articles]);
    }
  }
  const directoryByUrl = Object.fromEntries(directories.map(d => [d.url, d]));
  const groups = Object.fromEntries(Object.entries(catalog.groups).map(([key, records]) => [key, records.map(card)]));
  const featured = ['outwitting-the-devil', 'how-successful-people-think', 'change-your-questions-change-your-life', 'the-coaching-habit', 'start-with-why', 'drive', 'thinking-fast-and-slow', 'the-4-hour-workweek'].map(s => catalog.byUrl[`/summaries/${s}/`]).filter(Boolean).map(card);
  const indexableUrls = [...new Set(['/site-map/', ...catalog.records.filter(r => !r.noindex).map(r => r.url), ...directories.filter(d => d.page > 1 && !d.noindex).map(d => d.url)])].sort();
  const redirectMap = new Map();
  for (const record of catalog.records) {
    try {
      const old = new URL(record.data['f_original-url']).pathname;
      const withoutLocale = old.replace(/^\/en-ca\//, '/');
      if (withoutLocale.toLowerCase() !== record.url.toLowerCase()) {
        redirectMap.set(old, record.url);
        if (!catalog.byUrl[withoutLocale]) redirectMap.set(withoutLocale, record.url);
      }
    } catch (_) { /* A missing historical URL is not an invented redirect. */ }
  }
  for (const topic of catalog.groups['blog-category']) redirectMap.set('/blog/categories/' + topic.slug + '/', topic.url);
  const redirects = [...redirectMap].sort(([a], [b]) => a.localeCompare(b)).map(([from, to]) => `${from} ${to} 301`);
  return { domain: DOMAIN, groups, featured, directories, directoryByUrl, extraDirectories: directories.filter(d => d.page > 1), indexableUrls, redirects,
    summaryCount: catalog.groups.summaries.length, contributorCount: catalog.groups.team.length };
}

function entryFor(catalog, input, url, title, description) {
  const existing = catalog.byInput[normaliseInput(input)];
  if (existing) return existing;
  return { url: url || '/', absoluteUrl: DOMAIN + (url || '/'), title: title || 'Actionable Books', metaTitle: `${title || 'Actionable Books'} | Actionable Books`,
    description: description || 'Free book summaries and practical insights from Actionable Books.', family: 'page', noindex: url === '/404.html' };
}

function entrySchema(entry) {
  return schemaFor(entry);
}

module.exports = { card, createView, entryFor, entrySchema };
