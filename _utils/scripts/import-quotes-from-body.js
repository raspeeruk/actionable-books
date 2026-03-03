/**
 * Extract missing quotes from the Airtable Body field.
 * The first <blockquote> in the Body contains the page quote.
 * Also extracts Conclusion from Body when missing.
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const envPath = path.join(__dirname, '../../.env');
const envLines = fs.readFileSync(envPath, 'utf8').trim().split('\n');
const AIRTABLE_PAT = envLines[0].trim();
const AIRTABLE_BASE_ID = envLines[1].trim();

async function fetchAllRecords() {
  let allRecords = [];
  let offset = null;
  const fields = ['Unique Number', 'Slug', 'Body', 'Introduction', 'Title_of_Summary', 'Conclusion'];
  const fieldParams = fields.map(f => `fields[]=${encodeURIComponent(f)}`).join('&');

  do {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Summaries?pageSize=100&${fieldParams}${offset ? `&offset=${offset}` : ''}`;
    const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}` } });
    if (!resp.ok) throw new Error(`API error ${resp.status}`);
    const data = await resp.json();
    allRecords = allRecords.concat(data.records);
    offset = data.offset;
    process.stderr.write(`  Fetched ${allRecords.length} records...\r`);
  } while (offset);
  process.stderr.write(`  Fetched ${allRecords.length} records total.\n`);
  return allRecords;
}

function htmlDecode(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&#\d+;/g, m => String.fromCharCode(parseInt(m.slice(2, -1))));
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, '').trim();
}

function extractQuoteFromBody(body) {
  if (!body) return null;

  // Find the first blockquote
  const bqMatch = body.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/);
  if (!bqMatch) return null;

  const bqHtml = bqMatch[1];

  // Extract quote text (before footer/cite)
  let quoteHtml = bqHtml.replace(/<footer>[\s\S]*/, '');
  let quoteText = htmlDecode(stripHtml(quoteHtml)).trim();

  // Extract citation
  let cite = '';
  const citeMatch = bqHtml.match(/<cite>([\s\S]*?)<\/cite>/);
  if (citeMatch) {
    cite = htmlDecode(stripHtml(citeMatch[1])).trim();
  } else {
    const footerMatch = bqHtml.match(/<footer>([\s\S]*?)<\/footer>/);
    if (footerMatch) {
      cite = htmlDecode(stripHtml(footerMatch[1])).trim();
    }
  }

  // If no separate cite, try splitting on "- " at the end
  if (!cite && quoteText.includes('- ')) {
    const lastDash = quoteText.lastIndexOf('- ');
    const afterDash = quoteText.slice(lastDash + 2);
    // Only split if what's after the dash looks like a citation (contains "page" or a book-like reference)
    if (afterDash.match(/page|p\.|chapter|ch\.|introduction|preface|,/i)) {
      cite = '- ' + afterDash;
      quoteText = quoteText.slice(0, lastDash).trim();
    }
  }

  // Clean up quote text - remove surrounding quotes if present
  quoteText = quoteText.replace(/^[""\u201C]+/, '').replace(/[""\u201D]+$/, '').trim();

  if (!quoteText || quoteText.length < 10) return null;

  return { quote: quoteText, reference: cite };
}

function extractConclusionFromBody(body) {
  if (!body) return null;

  // Look for conclusion section - typically the last box-grey section or content after "Insight #2"
  // Pattern: content after the last </section> of summaries-boxes, before social links
  const conclusionMatch = body.match(/<\/section>\s*<\/section>\s*([\s\S]*?)(?:<div class="addtoany|<div class="wpcnt|<div id="jp-post|$)/);
  if (!conclusionMatch) return null;

  let html = conclusionMatch[1].trim();
  if (!html || html.length < 50) return null;

  // Convert basic HTML to text
  let text = htmlDecode(stripHtml(html)).trim();
  if (text.length < 30) return null;

  return text;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`=== Extract Quotes & Conclusions from Body (${dryRun ? 'DRY RUN' : 'LIVE'}) ===\n`);

  console.log('1. Fetching records...');
  const records = await fetchAllRecords();

  // Build lookup by unique number
  const lookup = {};
  for (const rec of records) {
    const num = rec.fields['Unique Number'];
    if (num) lookup[num] = rec.fields;
  }

  console.log('2. Scanning local files...');
  const dir = path.join(__dirname, '../../cms/summaries');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

  let stats = { quotesFound: 0, quotesFilled: 0, conclusionsFound: 0, conclusionsFilled: 0 };

  for (const filename of files) {
    const filePath = path.join(dir, filename);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(raw);

    const atFields = data['f_unique-number'] ? lookup[data['f_unique-number']] : null;
    if (!atFields) continue;

    let updated = false;

    // Fill missing quote from Body
    if (!data['f_quote-2'] || String(data['f_quote-2']).trim() === '') {
      const extracted = extractQuoteFromBody(atFields['Body']);
      if (extracted) {
        stats.quotesFound++;
        if (!dryRun) {
          data['f_quote-2'] = extracted.quote;
          if (extracted.reference && (!data['f_quote-reference'] || String(data['f_quote-reference']).trim() === '')) {
            data['f_quote-reference'] = extracted.reference;
          }
          updated = true;
          stats.quotesFilled++;
        } else {
          console.log(`  Would fill quote for: ${data.title}`);
          console.log(`    "${extracted.quote.slice(0, 100)}..."`);
          console.log(`    Ref: ${extracted.reference}`);
        }
      }
    }

    // Fill missing conclusion from Body
    if (!data['f_conclusion'] || String(data['f_conclusion']).trim() === '') {
      // Check if Airtable has Conclusion in the dedicated field first
      const atConclusion = atFields['Conclusion'];
      if (!atConclusion || atConclusion.trim() === '') {
        // Could try extracting from Body but it's less reliable
        // Skip for now - conclusion extraction from Body is unreliable
      }
    }

    if (updated) {
      const newContent = matter.stringify(content, data);
      fs.writeFileSync(filePath, newContent);
    }
  }

  console.log('\n=== RESULTS ===');
  console.log(`Quotes found in Body: ${stats.quotesFound}`);
  console.log(`Quotes filled: ${stats.quotesFilled}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
