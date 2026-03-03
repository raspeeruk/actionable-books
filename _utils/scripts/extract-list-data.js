/**
 * Extract summary data for all books in all list pages.
 * Outputs JSON with the real content needed to write descriptions.
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const listsDir = path.join(__dirname, '../../cms/lists');
const summariesDir = path.join(__dirname, '../../cms/summaries');

const listFiles = fs.readdirSync(listsDir).filter(f => f.endsWith('.md'));

for (const listFile of listFiles) {
  const { data } = matter(fs.readFileSync(path.join(listsDir, listFile), 'utf8'));
  console.log(`\n${'='.repeat(60)}`);
  console.log(`LIST: ${data.title}`);
  console.log(`FILE: ${listFile}`);
  console.log(`${'='.repeat(60)}`);

  if (!data.f_items) continue;

  for (let i = 0; i < data.f_items.length; i++) {
    const item = data.f_items[i];
    console.log(`\n--- ${i + 1}. ${item.item_title} ---`);

    if (item.item_summary_ref) {
      const refFile = item.item_summary_ref.replace('cms/summaries/', '');
      const summaryPath = path.join(summariesDir, refFile);
      if (fs.existsSync(summaryPath)) {
        const { data: s, content: body } = matter(fs.readFileSync(summaryPath, 'utf8'));
        console.log(`Author: ${s['f_author-plain-text'] || 'unknown'}`);
        console.log(`Quote: ${(s['f_quote-2'] || '').substring(0, 200)}`);
        console.log(`Big Idea (first 300 chars): ${(s['f_big-idea'] || '').substring(0, 300)}`);
        console.log(`Insight 1 (first 200 chars): ${(s['f_insight-1'] || '').substring(0, 200)}`);
        console.log(`Insight 2 (first 200 chars): ${(s['f_insight-2'] || '').substring(0, 200)}`);
        console.log(`Conclusion (first 200 chars): ${(s['f_conclusion'] || '').substring(0, 200)}`);
      }
    }
  }
}
