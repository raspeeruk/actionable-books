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
  assert.equal(library.groups.summaries.length, 1148);
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
