const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const dir = path.join(__dirname, '../../cms/summaries');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
let missing = [];

for (const f of files) {
  const { data } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
  const q = data['f_quote-2'];
  if ((!q || String(q).trim() === '') && data['f_unique-number']) {
    missing.push({ slug: f.replace('.md', ''), num: data['f_unique-number'], title: data.title });
  }
}

console.log(`Total missing quotes: ${missing.length}`);
missing.slice(0, 5).forEach(m => console.log(JSON.stringify(m)));
