/**
 * Airtable → Eleventy Content Importer
 * Fetches summaries from Airtable API and fills empty fields in markdown files.
 * Only fills missing/empty fields — never overwrites existing content.
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const TurndownService = require('turndown');

// Config — read from .env file
const envPath = path.join(__dirname, '../../.env');
const envLines = fs.readFileSync(envPath, 'utf8').trim().split('\n');
const AIRTABLE_PAT = envLines[0].trim();
const AIRTABLE_BASE_ID = envLines[1].trim();
const TABLE_NAME = 'Summaries';

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
});

// Field mapping: Airtable field name → frontmatter key
const FIELD_MAP = {
  'Conclusion': 'f_conclusion',
  'The Big Ideas': 'f_big-idea',
  'Insight 1': 'f_insight-1',
  'Insight 2': 'f_insight-2',
  'Quote': 'f_quote-2',
  'Quote Reference': 'f_quote-reference',
  'Amazon_Referral_LInk': 'f_amazon-url'
};

// Use trimmed versions where available (cleaner HTML)
const TRIMMED_ALTERNATIVES = {
  'The Big Ideas': 'Big Idea Trimmed',
  'Insight 1': 'Insight 1 Trimmed copy',
  'Insight 2': 'Insight 2 Trimmed'
};

// Fields that contain HTML and need markdown conversion
const HTML_FIELDS = ['Conclusion', 'The Big Ideas', 'Insight 1', 'Insight 2'];

// Fields that are plain text (no HTML conversion needed)
const PLAIN_FIELDS = ['Quote', 'Quote Reference', 'Amazon_Referral_LInk'];

function htmlToMarkdown(html) {
  if (!html || html.trim() === '') return '';
  let md = turndown.turndown(html);
  // Clean up excessive whitespace
  md = md.replace(/\n{3,}/g, '\n\n').trim();
  return md;
}

async function fetchAllRecords() {
  let allRecords = [];
  let offset = null;

  // Only request the fields we need
  const fields = [
    'Unique Number', 'Slug',
    ...Object.keys(FIELD_MAP),
    ...Object.values(TRIMMED_ALTERNATIVES)
  ];
  const fieldParams = fields.map(f => `fields[]=${encodeURIComponent(f)}`).join('&');

  do {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}?pageSize=100&${fieldParams}${offset ? `&offset=${offset}` : ''}`;

    const resp = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}` }
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Airtable API error ${resp.status}: ${err}`);
    }

    const data = await resp.json();
    allRecords = allRecords.concat(data.records);
    offset = data.offset;
    process.stderr.write(`  Fetched ${allRecords.length} records...\r`);
  } while (offset);

  process.stderr.write(`  Fetched ${allRecords.length} records total.\n`);
  return allRecords;
}

function buildLookup(records) {
  const byUniqueNumber = {};
  const bySlug = {};

  for (const rec of records) {
    const fields = rec.fields;
    if (fields['Unique Number']) {
      byUniqueNumber[fields['Unique Number']] = fields;
    }
    if (fields['Slug']) {
      bySlug[fields['Slug']] = fields;
    }
  }

  return { byUniqueNumber, bySlug };
}

function processImport(lookup) {
  const dir = path.join(__dirname, '../../cms/summaries');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

  let stats = {
    total: files.length,
    matched: 0,
    unmatched: 0,
    fieldsRestored: 0,
    filesUpdated: 0,
    byField: {}
  };

  for (const key of Object.values(FIELD_MAP)) {
    stats.byField[key] = 0;
  }

  for (const filename of files) {
    const filePath = path.join(dir, filename);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(raw);

    // Match by unique number first, then slug
    let atFields = null;
    if (data['f_unique-number']) {
      atFields = lookup.byUniqueNumber[data['f_unique-number']];
    }
    if (!atFields) {
      const slug = data.slug || filename.replace('.md', '');
      atFields = lookup.bySlug[slug];
    }

    if (!atFields) {
      stats.unmatched++;
      continue;
    }
    stats.matched++;

    let updated = false;

    for (const [atField, fmField] of Object.entries(FIELD_MAP)) {
      // Skip if frontmatter already has content
      const existing = data[fmField];
      if (existing && String(existing).trim() !== '') continue;

      // Try trimmed alternative first for HTML fields
      let atValue = null;
      if (TRIMMED_ALTERNATIVES[atField] && atFields[TRIMMED_ALTERNATIVES[atField]]) {
        atValue = atFields[TRIMMED_ALTERNATIVES[atField]];
      }
      if (!atValue) {
        atValue = atFields[atField];
      }

      if (!atValue || String(atValue).trim() === '') continue;

      // Convert HTML to markdown for HTML fields
      let newValue;
      if (HTML_FIELDS.includes(atField)) {
        newValue = htmlToMarkdown(String(atValue));
      } else {
        newValue = String(atValue).trim();
      }

      if (newValue && newValue.trim() !== '') {
        // Update affiliate tag to new one
        if (fmField === 'f_amazon-url') {
          newValue = newValue.replace('gooseducmedi-20', 'actionableb08-20');
        }
        data[fmField] = newValue;
        updated = true;
        stats.fieldsRestored++;
        stats.byField[fmField]++;
      }
    }

    if (updated) {
      // Write back the file preserving the body content
      const newContent = matter.stringify(content, data);
      fs.writeFileSync(filePath, newContent);
      stats.filesUpdated++;
    }
  }

  return stats;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('=== Airtable Import ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no files will be modified)' : 'LIVE'}`);
  console.log('');

  console.log('1. Fetching records from Airtable...');
  const records = await fetchAllRecords();

  console.log('2. Building lookup tables...');
  const lookup = buildLookup(records);
  console.log(`   ${Object.keys(lookup.byUniqueNumber).length} records by Unique Number`);
  console.log(`   ${Object.keys(lookup.bySlug).length} records by Slug`);

  if (dryRun) {
    // In dry-run mode, just report what would be changed
    const dir = path.join(__dirname, '../../cms/summaries');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    let wouldFill = {};
    for (const key of Object.values(FIELD_MAP)) wouldFill[key] = 0;
    let matched = 0;

    for (const filename of files) {
      const { data } = matter(fs.readFileSync(path.join(dir, filename), 'utf8'));
      let atFields = null;
      if (data['f_unique-number']) atFields = lookup.byUniqueNumber[data['f_unique-number']];
      if (!atFields) atFields = lookup.bySlug[data.slug || filename.replace('.md', '')];
      if (!atFields) continue;
      matched++;

      for (const [atField, fmField] of Object.entries(FIELD_MAP)) {
        const existing = data[fmField];
        if (existing && String(existing).trim() !== '') continue;
        let atValue = TRIMMED_ALTERNATIVES[atField] ? atFields[TRIMMED_ALTERNATIVES[atField]] : null;
        if (!atValue) atValue = atFields[atField];
        if (atValue && String(atValue).trim() !== '') wouldFill[fmField]++;
      }
    }

    console.log(`\n3. DRY RUN RESULTS:`);
    console.log(`   Matched: ${matched}/${files.length}`);
    console.log(`   Would fill:`);
    for (const [k, v] of Object.entries(wouldFill)) {
      console.log(`     ${k}: ${v}`);
    }
    return;
  }

  console.log('3. Processing import...');
  const stats = processImport(lookup);

  console.log('\n=== IMPORT COMPLETE ===');
  console.log(`Matched: ${stats.matched}/${stats.total}`);
  console.log(`Unmatched: ${stats.unmatched}`);
  console.log(`Files updated: ${stats.filesUpdated}`);
  console.log(`Fields restored: ${stats.fieldsRestored}`);
  console.log('');
  console.log('By field:');
  for (const [k, v] of Object.entries(stats.byField)) {
    console.log(`  ${k}: ${v}`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
