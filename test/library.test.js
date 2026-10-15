const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const matter = require('gray-matter');
const provenance = require('./fixtures/content-provenance.json');
const { createLibrary, cleanBody, escapeHtml, jsonLd, renderBody, schemaFor, excerpt } = require('../_utils/library');
const library = createLibrary();

test('all 1,148 original review bodies retain their documented full-source hashes', () => {
  assert.equal(provenance.records.length, 1148);
  for (const record of provenance.records) {
    const original = matter.read(path.join(__dirname, '..', record.input)).content;
    assert.equal(crypto.createHash('sha256').update(original).digest('hex'), record.bodySha256, record.input);
  }
});

test('every summary keeps its source identity and resolves its actual reverse relationships', () => {
  assert.ok(library.groups.summaries.length >= provenance.records.length);
  assert.equal(new Set(library.records.map(r => r.url)).size, library.records.length);
  for (const review of library.groups.summaries) {
    assert.ok(review.url.endsWith('/'));
    if (review.author) assert.ok(review.author.summaries.includes(review));
    if (review.contributor) assert.ok(review.contributor.summaries.includes(review));
    if (review.topic) assert.ok(review.topic.summaries.includes(review));
    assert.ok(!review.related.includes(review));
  }
});

test('the wrong-book frontmatter cannot replace the preserved original review', () => {
  const ferriss = library.byUrl['/summaries/the-4-hour-workweek/'];
  assert.match(ferriss.html, /Timothy Ferriss/);
  assert.doesNotMatch(ferriss.html, /The 10X Rule/);
  assert.doesNotMatch(ferriss.description, /The 10X Rule/);
  const schema = schemaFor(ferriss);
  assert.equal(schema['@graph'].find(x => x['@type'] === 'Book').author.name, 'Timothy Ferriss');
  assert.ok(!JSON.stringify(schema).includes('2024-02-27'));
});

test('HTML attributes and JSON-LD use separate encoders for quotes and closing script text', () => {
  const value = 'O\'Brien & "Partners" </script><script>alert(1)</script>';
  assert.equal(escapeHtml(null), '');
  assert.ok(escapeHtml(value).includes('&quot;Partners&quot;'));
  const encoded = jsonLd({ value });
  assert.ok(!encoded.includes('</script>'));
  assert.deepEqual(JSON.parse(encoded), { value });
  for (const record of library.records) assert.doesNotThrow(() => JSON.parse(jsonLd(schemaFor(record))));
});

test('only exact standalone WordPress helper paragraphs are removed', () => {
  const actual = 'An actionable way to implement the Big Idea into your life';
  assert.equal(cleanBody(`Before\n\n${actual}\n\nAfter`), 'Before\n\nAfter');
  assert.equal(cleanBody(`The author wrote: ${actual}.`), `The author wrote: ${actual}.`);
});

test('legacy podcast controls cannot become the review description', () => {
  assert.equal(excerpt('Podcast: [Play in new window](https://example.org/audio.mp3) | [Download](https://example.org/audio.mp3)\n\nThis is the original contributor’s useful introductory paragraph.'), 'This is the original contributor’s useful introductory paragraph.');
});

test('original section labels get semantic headings and unique anchors without changing words', () => {
  const rendered = renderBody('### The Big Idea\n\nA useful subtitle\n---\n\nOriginal words.\n\n### Insight #1\n\nMore words.\n\n### Insight #1', { summary: true });
  assert.match(rendered.html, /<h2 id="the-big-idea">The Big Idea<\/h2>/);
  assert.match(rendered.html, /<h3 id="a-useful-subtitle">A useful subtitle<\/h3>/);
  assert.match(rendered.html, /id="insight-1-2"/);
  assert.match(rendered.html, /Original words\./);
});

test('restored original bylines are unqualified, while the unresolved Peak credit stays qualified', () => {
  for (const slug of ['focus-2', 'freakonomics', 'playing-big', 'the-power-of-habit']) {
    const review = library.byUrl[`/summaries/${slug}/`];
    assert.equal(review.attributionNote, null);
    assert.ok(schemaFor(review)['@graph'].find(x => x['@type'] === 'Article').author);
  }
  const peak = library.byUrl['/summaries/peak/'];
  assert.ok(peak.attributionNote);
  assert.equal(schemaFor(peak)['@graph'].find(x => x['@type'] === 'Article').author, undefined);
});

test('coauthors are separate people, and reading-path quotes resolve to their real original review', () => {
  const boss = library.byUrl['/summaries/being-the-boss/'];
  assert.deepEqual(schemaFor(boss)['@graph'].find(x => x['@type'] === 'Book').author.map(p => p.name), ['Linda A. Hill', 'Kent Lineback']);
  const journeys = require('../cms/_data/journeys.json');
  for (const [url, journey] of Object.entries(journeys)) {
    assert.equal(library.byUrl[url].noindex, false);
    for (const choice of journey.choices) {
      const review = library.byUrl[choice.url];
      assert.equal(review.family, 'summaries');
      assert.ok(require('../_utils/library').plainText(review.body).includes(choice.exactOriginalExcerpt), choice.url);
      assert.equal(review.contributor.title, choice.originalReviewContributor);
    }
  }
});

test('an individual author profile retains its own identity when a book has coauthors', () => {
  for (const profile of library.groups.authors) {
    const person = schemaFor(profile)['@graph'].find(x => x['@type'] === 'Person');
    assert.equal(person.name, profile.title);
    assert.equal(person['@id'], profile.absoluteUrl + '#person');
  }
});

test('lost archive links keep their words and source URL without creating a dead clickable destination', () => {
  const html = renderBody('[Original words](https://example.org/lost)', { resolveLink: () => null }).html;
  assert.match(html, /Original words/);
  assert.match(html, /data-original-url="https:\/\/example.org\/lost"/);
  assert.doesNotMatch(html, /href=/);
  assert.match(html, /archived link unavailable/);
});

test('original body images are local, correctly escaped, dimensioned and real files', () => {
  for (const record of library.records) {
    for (const match of record.html.matchAll(/<img\b([^>]+)>/g)) {
      const attrs = match[1];
      const src = /src="([^"]+)"/.exec(attrs)?.[1];
      assert.ok(src?.startsWith('/assets/'), record.url + ' ' + src);
      assert.ok(fs.existsSync(path.join(__dirname, '..', 'theme', decodeURIComponent(src))), record.url + ' ' + src);
      assert.match(attrs, /width="\d+"/);
      assert.match(attrs, /height="\d+"/);
      assert.match(attrs, /loading="lazy"/);
    }
  }
});
