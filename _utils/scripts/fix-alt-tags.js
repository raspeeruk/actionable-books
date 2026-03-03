/**
 * Fix null alt tags on images across summaries and authors.
 * Summaries: alt → "[Book Title] book cover"
 * Authors: alt → "[Author Name]"
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function fixCollection(dir, altGenerator, label) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  let fixed = 0;

  for (const filename of files) {
    const filePath = path.join(dir, filename);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(raw);

    if (data.f_image && (data.f_image.alt === null || data.f_image.alt === undefined || data.f_image.alt === '')) {
      data.f_image.alt = altGenerator(data);
      const newContent = matter.stringify(content, data);
      fs.writeFileSync(filePath, newContent);
      fixed++;
    }
  }

  console.log(`${label}: fixed ${fixed}/${files.length} alt tags`);
  return fixed;
}

// Fix summaries: "[Book Title] book cover"
const summariesDir = path.join(__dirname, '../../cms/summaries');
fixCollection(summariesDir, (data) => `${data.title} book cover`, 'Summaries');

// Fix authors: "[Author Name]"
const authorsDir = path.join(__dirname, '../../cms/authors');
fixCollection(authorsDir, (data) => data.title, 'Authors');
