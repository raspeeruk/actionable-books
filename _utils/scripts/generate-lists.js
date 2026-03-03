/**
 * Generate the first 5 curated list pages from existing summary data.
 * Picks the best books (complete content + Amazon URL) for each list.
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const summariesDir = path.join(__dirname, '../../cms/summaries');
const listsDir = path.join(__dirname, '../../cms/lists');

// Read all summaries
const files = fs.readdirSync(summariesDir).filter(f => f.endsWith('.md'));
const summaries = [];

for (const f of files) {
  const { data } = matter(fs.readFileSync(path.join(summariesDir, f), 'utf8'));
  const complete = data['f_big-idea'] && data['f_quote-2'] && data['f_amazon-url'];
  if (complete) {
    summaries.push({
      title: data.title,
      slug: data.slug || f.replace('.md', ''),
      author: data['f_author-plain-text'] || '',
      category: data['f_category-3'] || '',
      amazonUrl: data['f_amazon-url'],
      imageUrl: data['f_image'] ? data['f_image'].url : '',
      ref: `cms/summaries/${f.replace('.md', '')}.md`
    });
  }
}

function byCategory(cat) {
  return summaries.filter(s => s.category.includes(cat));
}

function pickBooks(pool, slugPriority, count = 10) {
  const picked = [];
  const used = new Set();
  // Pick priority books first
  for (const slug of slugPriority) {
    const found = pool.find(s => s.slug === slug);
    if (found && !used.has(found.slug)) {
      picked.push(found);
      used.add(found.slug);
    }
  }
  // Fill remaining from pool
  for (const s of pool) {
    if (picked.length >= count) break;
    if (!used.has(s.slug)) {
      picked.push(s);
      used.add(s.slug);
    }
  }
  return picked;
}

function makeListMd(title, slug, keyword, metaDesc, intro, books, conclusion) {
  const items = books.map(b => ({
    item_title: b.title,
    item_description: `By **${b.author}**. A must-read for anyone looking to grow professionally. Read our full actionable summary to get the key insights in five minutes.`,
    item_amazon_url: b.amazonUrl,
    item_summary_ref: b.ref,
    item_image: b.imageUrl
  }));

  const frontmatter = {
    title,
    slug,
    'created-on': new Date().toISOString(),
    'published-on': new Date().toISOString(),
    'f_intro': intro,
    'f_target-keyword': keyword,
    'f_meta-description': metaDesc,
    'f_content-type': 'ai',
    'f_items': items,
    'f_conclusion': conclusion,
    tags: 'lists',
    layout: '[lists].html',
    date: new Date().toISOString()
  };

  return matter.stringify('', frontmatter);
}

// List 1: Best Leadership Books
const leadershipBooks = pickBooks(byCategory('leadership'), [
  'leaders-eat-last', 'start-with-why', 'the-21-irrefutable-laws-of-leadership',
  'tribal-leadership', 'turn-the-ship-around', 'good-to-great',
  'multipliers', 'primal-leadership', 'the-leadership-challenge', 'dare-to-serve'
]);

fs.writeFileSync(path.join(listsDir, 'best-leadership-books.md'), makeListMd(
  'Best Leadership Books',
  'best-leadership-books',
  'best leadership books',
  'The best leadership books to help you lead with confidence. Each pick includes an actionable summary with key insights you can apply today.',
  'Whether you are a first-time manager or a seasoned executive, the right leadership book can transform the way you lead. We have reviewed hundreds of leadership titles and selected the ones that deliver the most actionable advice. Each book on this list has a full summary on Actionable Books so you can get the key takeaways in five minutes.',
  leadershipBooks,
  'Great leadership is a skill you build over time. Pick one book from this list, read the summary, and commit to applying one insight this week. Then come back for the next one. That is the Actionable Books way.'
));

// List 2: Best Books for Entrepreneurs
const entrepreneurBooks = pickBooks(
  [...byCategory('innovative-thinking'), ...byCategory('leadership'), ...byCategory('self-management')],
  ['the-lean-startup', 'start-with-why', 'the-4-hour-workweek', 'rework',
   'zero-to-one', 'the-e-myth-revisited', 'built-to-sell', 'anything-you-want',
   'delivering-happiness', 'crush-it']
);

fs.writeFileSync(path.join(listsDir, 'best-books-for-entrepreneurs.md'), makeListMd(
  'Best Business Books for Entrepreneurs',
  'best-books-for-entrepreneurs',
  'best books for entrepreneurs',
  'The best business books every entrepreneur should read. From startup strategy to mindset, each pick includes a free actionable summary.',
  'Building a business demands a blend of strategic thinking, resilience, and relentless execution. The books on this list have guided thousands of founders through every stage of the entrepreneurial journey. Each one is summarized on Actionable Books so you can absorb the key ideas in five minutes and get back to building.',
  entrepreneurBooks,
  'The entrepreneurial journey never really ends. Keep learning, keep adapting, and keep taking action. These books are your roadmap.'
));

// List 3: Best Self-Help Books
const selfHelpBooks = pickBooks(byCategory('self-management'), [
  'mindset-the-new-psychology-of-success', 'thinking-fast-and-slow', 'grit',
  'deep-work', 'the-power-of-habit', 'the-4-hour-workweek',
  'essentialism', 'do-the-work', 'drive', 'outliers'
]);

fs.writeFileSync(path.join(listsDir, 'best-self-help-books.md'), makeListMd(
  'Best Self-Help Books for Professional Growth',
  'best-self-help-books',
  'best self help books',
  'The best self-help books for professional growth. Build better habits, sharpen your mindset, and unlock your potential with these actionable reads.',
  'Personal growth is the foundation of professional success. These books tackle the habits, mindset shifts, and mental models that separate high performers from everyone else. Each title includes a full summary on Actionable Books with insights you can apply immediately.',
  selfHelpBooks,
  'The best investment you can make is in yourself. Start with one book from this list, apply its insights, and watch the compound effect over time.'
));

// List 4: Best Communication Books
const commBooks = pickBooks(byCategory('effective-communication'), [
  'crucial-conversations', 'how-to-win-friends-and-influence-people-in-the-digital-age',
  'never-split-the-difference', 'talk-like-ted', 'spin-selling',
  'enchantment', 'difficult-conversations', 'influence',
  'made-to-stick', 'switch'
]);

fs.writeFileSync(path.join(listsDir, 'best-communication-books.md'), makeListMd(
  'Best Books on Communication',
  'best-communication-books',
  'best communication books',
  'Master the art of communication with these essential books. From difficult conversations to persuasion, each includes a free actionable summary.',
  'Whether you are presenting to a boardroom, negotiating a deal, or navigating a difficult conversation at home, communication is the most valuable skill you can develop. These books offer practical frameworks you can use immediately. Each one has a full summary on Actionable Books.',
  commBooks,
  'Communication is a skill that improves with practice. Pick one framework from these books, use it in your next conversation, and notice the difference.'
));

// List 5: Best Productivity Books
const productivityBooks = pickBooks(
  [...byCategory('self-management'), ...byCategory('team-optimization')],
  ['deep-work', 'the-4-hour-workweek', 'essentialism', 'getting-things-done',
   'eat-that-frog', 'the-one-thing', 'the-power-of-habit', 'do-the-work',
   'do-more-great-work', 'making-ideas-happen']
);

fs.writeFileSync(path.join(listsDir, 'best-productivity-books.md'), makeListMd(
  'Best Productivity Books',
  'best-productivity-books',
  'best productivity books',
  'The best productivity books to help you work smarter. From deep focus to habit building, each includes a free actionable summary.',
  'Productivity is not about doing more — it is about doing what matters. These books cut through the noise and give you practical systems for managing your time, energy, and attention. Each one is summarized on Actionable Books with insights you can apply in five minutes.',
  productivityBooks,
  'Real productivity comes from clarity about what matters most. Choose one book, apply its core idea for a week, and see what changes.'
));

console.log('Generated 5 list pages:');
fs.readdirSync(listsDir).filter(f => f.endsWith('.md')).forEach(f => console.log(`  cms/lists/${f}`));
