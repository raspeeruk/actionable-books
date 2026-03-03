const fs = require('fs');
const matter = require('gray-matter');
const path = require('path');

const dir = path.join(__dirname, '../../cms/summaries');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

let stats = { total: 0, ec: 0, eb: 0, e1: 0, e2: 0, eq: 0, eqr: 0, ea: 0 };
let examples = { ec: [], eb: [], e1: [], e2: [], eq: [], eqr: [], ea: [] };

for (const f of files) {
  const { data } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
  stats.total++;

  const isEmpty = (v) => !v || String(v).trim() === '';

  if (isEmpty(data['f_conclusion'])) { stats.ec++; if (examples.ec.length < 3) examples.ec.push(f); }
  if (isEmpty(data['f_big-idea'])) { stats.eb++; if (examples.eb.length < 3) examples.eb.push(f); }
  if (isEmpty(data['f_insight-1'])) { stats.e1++; if (examples.e1.length < 3) examples.e1.push(f); }
  if (isEmpty(data['f_insight-2'])) { stats.e2++; if (examples.e2.length < 3) examples.e2.push(f); }
  if (isEmpty(data['f_quote-2'])) { stats.eq++; if (examples.eq.length < 3) examples.eq.push(f); }
  if (isEmpty(data['f_quote-reference'])) { stats.eqr++; if (examples.eqr.length < 3) examples.eqr.push(f); }
  if (isEmpty(data['f_amazon-url'])) { stats.ea++; if (examples.ea.length < 3) examples.ea.push(f); }
}

console.log('=== BASELINE CONTENT AUDIT ===');
console.log('Total summaries:', stats.total);
console.log('');
console.log('Missing fields:');
console.log(`  f_conclusion:       ${stats.ec}  ${examples.ec.length ? '(e.g. ' + examples.ec[0] + ')' : ''}`);
console.log(`  f_big-idea:         ${stats.eb}  ${examples.eb.length ? '(e.g. ' + examples.eb[0] + ')' : ''}`);
console.log(`  f_insight-1:        ${stats.e1}  ${examples.e1.length ? '(e.g. ' + examples.e1[0] + ')' : ''}`);
console.log(`  f_insight-2:        ${stats.e2}  ${examples.e2.length ? '(e.g. ' + examples.e2[0] + ')' : ''}`);
console.log(`  f_quote-2:          ${stats.eq}  ${examples.eq.length ? '(e.g. ' + examples.eq[0] + ')' : ''}`);
console.log(`  f_quote-reference:  ${stats.eqr}  ${examples.eqr.length ? '(e.g. ' + examples.eqr[0] + ')' : ''}`);
console.log(`  f_amazon-url:       ${stats.ea}  ${examples.ea.length ? '(e.g. ' + examples.ea[0] + ')' : ''}`);
