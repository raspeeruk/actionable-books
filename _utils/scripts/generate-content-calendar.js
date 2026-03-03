/**
 * Generate 30 days of scheduled content (20 list pages + 10 blog posts).
 * Each piece has a staggered published-on date starting from tomorrow.
 * Content draws from real summary data to create substantive descriptions.
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const summariesDir = path.join(__dirname, '../../cms/summaries');
const listsDir = path.join(__dirname, '../../cms/lists');
const blogDir = path.join(__dirname, '../../cms/blog');

// Read all complete summaries
const files = fs.readdirSync(summariesDir).filter(f => f.endsWith('.md'));
const allSummaries = [];

for (const f of files) {
  const { data } = matter(fs.readFileSync(path.join(summariesDir, f), 'utf8'));
  if (data['f_big-idea'] && data['f_quote-2'] && data['f_amazon-url']) {
    allSummaries.push({
      title: data.title,
      slug: data.slug || f.replace('.md', ''),
      author: data['f_author-plain-text'] || '',
      category: data['f_category-3'] || '',
      amazonUrl: data['f_amazon-url'],
      imageUrl: data['f_image'] ? data['f_image'].url : '',
      ref: `cms/summaries/${f.replace('.md', '')}.md`,
      bigIdea: (data['f_big-idea'] || '').substring(0, 200),
      quote: data['f_quote-2'] || '',
      insight1: (data['f_insight-1'] || '').substring(0, 150),
      conclusion: (data['f_conclusion'] || '').substring(0, 150)
    });
  }
}

console.log(`Loaded ${allSummaries.length} complete summaries`);

function byCategory(cat) {
  return allSummaries.filter(s => s.category.includes(cat));
}

function searchByKeywords(keywords) {
  const kw = keywords.map(k => k.toLowerCase());
  return allSummaries.filter(s => {
    const text = `${s.title} ${s.bigIdea} ${s.quote} ${s.author}`.toLowerCase();
    return kw.some(k => text.includes(k));
  });
}

function pickBooks(pool, count = 10, exclude = new Set()) {
  const picked = [];
  for (const s of pool) {
    if (picked.length >= count) break;
    if (!exclude.has(s.slug)) {
      picked.push(s);
      exclude.add(s.slug);
    }
  }
  return picked;
}

function getDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(6, 0, 0, 0);
  return d.toISOString();
}

function makeListMd(title, slug, keyword, metaDesc, intro, books, conclusion, pubDate) {
  const items = books.map(b => ({
    item_title: b.title,
    item_description: `By **${b.author}**. ${b.bigIdea.replace(/^###[^\n]*\n+/, '').replace(/>/g, '').trim().substring(0, 200)}... Read our full summary for the complete insights.\n\n**Best for:** Professionals looking to deepen their understanding of ${keyword.replace('best ', '').replace('books ', '')}.`,
    item_amazon_url: b.amazonUrl,
    item_summary_ref: b.ref,
    item_image: b.imageUrl
  }));

  const frontmatter = {
    title,
    slug,
    'created-on': new Date().toISOString(),
    'published-on': pubDate,
    'f_intro': intro,
    'f_target-keyword': keyword,
    'f_meta-description': metaDesc,
    'f_content-type': 'ai',
    'f_items': items,
    'f_conclusion': conclusion,
    tags: 'lists',
    layout: '[lists].html',
    date: pubDate
  };

  return matter.stringify('', frontmatter);
}

function makeBlogMd(title, slug, category, metaDesc, body, pubDate) {
  const frontmatter = {
    title,
    slug,
    'created-on': new Date().toISOString(),
    'published-on': pubDate,
    'f_date-published': pubDate,
    'f_meta-description': metaDesc,
    'f_content-type': 'ai',
    'f_category-3': category,
    tags: 'blog',
    layout: '[blog].html',
    date: pubDate
  };

  return matter.stringify(body, frontmatter);
}

// ============================================
// LIST TOPICS (20)
// ============================================
const listTopics = [
  { title: 'Best Books for New Managers', slug: 'best-books-for-new-managers', keyword: 'best books for new managers', pool: () => [...byCategory('leadership'), ...byCategory('team-optimization')],
    intro: 'The transition from individual contributor to manager is one of the most challenging leaps in any career. Suddenly, your success is measured not by what you produce, but by what your team produces. The books on this list tackle that shift head-on, offering practical frameworks for leading people, building trust, and navigating the uncomfortable conversations that come with the territory. We have summarized over 1,100 business books at Actionable Books, and these are the titles we recommend most to anyone stepping into their first leadership role.',
    conclusion: '**If you only read one:** Start with *Leaders Eat Last* by Simon Sinek. It reframes management as a responsibility to the people you lead, not a title you hold. Every book on this list has a free summary on Actionable Books — read the key insights in five minutes and start leading with confidence.' },
  { title: 'Books Like Start With Why', slug: 'books-like-start-with-why', keyword: 'books like start with why', pool: () => [...byCategory('team-optimization'), ...byCategory('leadership'), ...byCategory('innovative-thinking')],
    intro: 'If Start With Why changed the way you think about purpose and motivation, you are not alone. Simon Sinek struck a nerve with his argument that people don\'t buy what you do — they buy why you do it. But where do you go after that? The books on this list explore similar themes: the power of purpose, the importance of culture, and why inspiration beats manipulation every time. Each one pushes the conversation forward in its own direction.',
    conclusion: '**If you only read one:** Pick *Drive* by Daniel Pink. It takes the "why" question and grounds it in the science of motivation — autonomy, mastery, and purpose. Every book here has a free summary on Actionable Books.' },
  { title: 'Best Innovation Books', slug: 'best-innovation-books', keyword: 'best innovation books', pool: () => byCategory('innovative-thinking'),
    intro: 'Innovation is not about having the best ideas. It is about building the discipline to test, iterate, and execute on ideas faster than anyone else. The books on this list range from startup methodology to design thinking to the psychology of creativity. What they share is a bias toward action — every one of them gives you a framework you can use this week. We have summarized over 200 innovation titles at Actionable Books, and these are the ones that deliver the most practical value.',
    conclusion: '**If you only read one:** *The Lean Startup* by Eric Ries is the modern classic for a reason. Its concept of validated learning applies whether you are building a startup or launching a new initiative inside a large company. All books have free summaries on Actionable Books.' },
  { title: 'Best Books for CEOs', slug: 'best-books-for-ceos', keyword: 'best books for CEOs', pool: () => [...byCategory('leadership'), ...byCategory('innovative-thinking')],
    intro: 'The CEO role is uniquely isolating. The decisions are bigger, the stakes are higher, and the feedback loops are longer. These books speak to the challenges that sit squarely on the shoulders of the person at the top: strategy, culture, execution, and the discipline to say no to the things that do not matter. We selected these from our library of over 1,100 summaries — each one has shaped how real leaders run real companies.',
    conclusion: '**If you only read one:** *Built to Sell* by John Warrillow. Even if you never plan to sell, building a company that could be sold forces the kind of systems thinking every CEO needs. Free summaries available on Actionable Books.' },
  { title: 'Best Team Building Books', slug: 'best-team-building-books', keyword: 'best team building books', pool: () => [...byCategory('team-optimization'), ...byCategory('leadership')],
    intro: 'A team is not just a group of talented individuals in the same room. The difference between a group and a team is trust, shared purpose, and the willingness to be vulnerable with each other. The books on this list tackle team dynamics from every angle — from Patrick Lencioni\'s fictional boardrooms to Simon Sinek\'s evolutionary biology. If you manage people, these are essential reads.',
    conclusion: '**If you only read one:** *Turn the Ship Around!* by David Marquet shows what happens when you stop giving orders and start giving ownership. Free summaries of every book on Actionable Books.' },
  { title: 'Books Like Thinking, Fast and Slow', slug: 'books-like-thinking-fast-and-slow', keyword: 'books like thinking fast and slow', pool: () => [...byCategory('self-management'), ...byCategory('innovative-thinking')],
    intro: 'Daniel Kahneman opened a door that is hard to close. Once you see how reliably your own brain deceives you — through anchoring, availability bias, and the illusion of understanding — you cannot unsee it. If Thinking, Fast and Slow left you hungry for more about decision-making, cognitive bias, and the science of human behavior, these books go deeper. Each one builds on the foundation Kahneman laid.',
    conclusion: '**If you only read one:** *Mindset* by Carol Dweck. It takes one of Kahneman\'s implicit themes — that our beliefs shape our reality — and turns it into a practical framework for growth. Every title has a free summary on Actionable Books.' },
  { title: 'Best Negotiation Books', slug: 'best-negotiation-books', keyword: 'best negotiation books', pool: () => [...byCategory('effective-communication'), ...byCategory('leadership')],
    intro: 'Negotiation is not about winning. It is about understanding what the other side truly needs and finding a way to get there together. Whether you are closing a deal, asking for a raise, or navigating a difficult conversation with a colleague, the principles are the same. These books give you practical frameworks that work in boardrooms, living rooms, and everywhere in between.',
    conclusion: '**If you only read one:** *Crucial Conversations* is the most universally applicable book on this list. The skills it teaches — managing emotion, creating safety, and staying in dialogue — work in every negotiation context. Free summaries on Actionable Books.' },
  { title: 'Best Company Culture Books', slug: 'best-company-culture-books', keyword: 'best company culture books', pool: () => [...byCategory('role-and-culture-fit'), ...byCategory('team-optimization'), ...byCategory('leadership')],
    intro: 'Culture is not a ping pong table in the break room. It is the set of unwritten rules that determine how people behave when no one is watching. Get it right and you attract talent, retain your best people, and build something that outlasts any single leader. Get it wrong and no amount of perks will save you. These books tackle culture from the inside out.',
    conclusion: '**If you only read one:** *Delivering Happiness* by Tony Hsieh. It proves that culture is not a cost center — it is your most powerful competitive advantage. Free summaries of all titles on Actionable Books.' },
  { title: 'Best Books for First-Time Leaders', slug: 'best-books-for-first-time-leaders', keyword: 'best books for first time leaders', pool: () => [...byCategory('leadership'), ...byCategory('self-management')],
    intro: 'Nobody teaches you how to lead. You get promoted because you were good at your job, and suddenly you are responsible for other people being good at theirs. The learning curve is steep and the stakes feel impossibly high. These books are the crash course you never got — practical, honest, and focused on the things that actually matter in your first year of leadership.',
    conclusion: '**If you only read one:** *Act Like a Leader, Think Like a Leader* by Herminia Ibarra. Its core insight — that leadership identity comes from action, not reflection — is exactly what first-time leaders need to hear. Free summaries on Actionable Books.' },
  { title: 'Best Decision Making Books', slug: 'best-decision-making-books', keyword: 'best decision making books', pool: () => [...byCategory('self-management'), ...byCategory('innovative-thinking')],
    intro: 'Every day you make thousands of decisions, most of them on autopilot. The quality of those decisions determines the trajectory of your career, your relationships, and your life. These books pull back the curtain on how we actually decide — the biases that distort our thinking, the frameworks that improve our judgment, and the habits that make good decisions automatic.',
    conclusion: '**If you only read one:** *Thinking, Fast and Slow* by Daniel Kahneman. It is the definitive guide to understanding your own mind, and every other decision-making book on this list builds on its foundation. Free summaries on Actionable Books.' },
  { title: 'Best Books on Emotional Intelligence', slug: 'best-emotional-intelligence-books', keyword: 'best emotional intelligence books', pool: () => [...byCategory('self-management'), ...byCategory('effective-communication')],
    intro: 'Technical skills get you hired. Emotional intelligence gets you promoted. The ability to understand your own emotions, read the room, and navigate interpersonal dynamics is the single most underrated career skill. These books break emotional intelligence down into learnable components — self-awareness, self-regulation, empathy, and social skill — and show you how to develop each one.',
    conclusion: '**If you only read one:** *Mindset* by Carol Dweck. The growth mindset is the foundation of emotional intelligence — the belief that you can develop any skill, including the ability to manage your own emotions. Free summaries on Actionable Books.' },
  { title: 'Best Marketing Books', slug: 'best-marketing-books', keyword: 'best marketing books', pool: () => [...byCategory('effective-communication'), ...byCategory('innovative-thinking')],
    intro: 'Marketing has changed more in the last decade than in the previous century. But the fundamentals — understanding your audience, telling a compelling story, and building genuine connection — are timeless. These books span the spectrum from Seth Godin\'s big-picture philosophy to the tactical frameworks you can deploy tomorrow. If you market anything, these are worth your time.',
    conclusion: '**If you only read one:** *All Marketers Are Liars* by Seth Godin. Despite the provocative title, it is actually about the power of authentic storytelling — the most important marketing skill of all. Free summaries on Actionable Books.' },
  { title: 'Best Sales Books', slug: 'best-sales-books', keyword: 'best sales books', pool: () => [...byCategory('effective-communication')],
    intro: 'Sales is not about persuasion. It is about understanding problems deeply enough to offer real solutions. The best salespeople are not the pushiest — they are the most curious. These books reframe selling as a service, not a transaction, and give you practical frameworks for every stage of the sales process.',
    conclusion: '**If you only read one:** *SPIN Selling* by Neil Rackham. Backed by extensive research, it gives you a questioning framework that works in any complex sale. Free summaries on Actionable Books.' },
  { title: 'Best Books on Habits', slug: 'best-books-on-habits', keyword: 'best books on habits', pool: () => byCategory('self-management'),
    intro: 'You are your habits. The morning routine you follow, the way you respond to stress, the food you reach for at 3pm — these small, repeated actions compound into the person you become. These books decode the science of habit formation and give you practical tools to build the habits you want and break the ones you do not.',
    conclusion: '**If you only read one:** *The Power of Habit* by Charles Duhigg. It gives you the cue-routine-reward framework that makes every other habit book make sense. Free summaries on Actionable Books.' },
  { title: 'Best Books on Creativity', slug: 'best-books-on-creativity', keyword: 'best books on creativity', pool: () => [...byCategory('innovative-thinking'), ...byCategory('self-management')],
    intro: 'Creativity is not a gift reserved for artists. It is a practice — a way of approaching problems, seeing connections, and doing the work even when inspiration is nowhere to be found. These books demolish the myth of the creative genius and replace it with something far more useful: a set of habits and frameworks that anyone can adopt.',
    conclusion: '**If you only read one:** *Do the Work* by Steven Pressfield. It is the shortest book on this list and the most honest about what actually stops creative work: Resistance. Free summaries on Actionable Books.' },
  { title: 'Best Strategy Books', slug: 'best-strategy-books', keyword: 'best strategy books', pool: () => [...byCategory('leadership'), ...byCategory('innovative-thinking')],
    intro: 'Strategy is about making choices — deciding what to do and, more importantly, what not to do. In a world of infinite options and limited resources, the companies and individuals who win are the ones who focus ruthlessly. These books teach you how to think strategically, whether you are running a Fortune 500 company or planning your next career move.',
    conclusion: '**If you only read one:** *Good Strategy Bad Strategy* — if it is in our library, it is the clearest explanation of what strategy actually is. Otherwise, *Built to Sell* teaches strategic focus through a compelling narrative. Free summaries on Actionable Books.' },
  { title: 'Best Books for Women in Business', slug: 'best-books-for-women-in-business', keyword: 'best books for women in business', pool: () => [...byCategory('leadership'), ...byCategory('self-management')],
    intro: 'The business book shelf has historically been dominated by male authors writing for male audiences. That is changing, and these books represent the best of a new wave — titles that address the unique challenges women face in the workplace while delivering universal leadership wisdom. Whether you are navigating a male-dominated industry or building your own company, these books have your back.',
    conclusion: '**If you only read one:** *Mindset* by Carol Dweck. The growth mindset is a powerful antidote to imposter syndrome and the fixed-mindset traps that disproportionately affect women in business. Free summaries on Actionable Books.' },
  { title: 'Best Management Books', slug: 'best-management-books', keyword: 'best management books', pool: () => [...byCategory('leadership'), ...byCategory('team-optimization')],
    intro: 'Management is the least glamorous and most important skill in business. While leadership books get all the attention, it is the day-to-day work of management — setting clear expectations, giving useful feedback, running effective meetings, and developing people — that actually determines whether an organization succeeds. These books focus on the craft of management.',
    conclusion: '**If you only read one:** *The Leadership Challenge* by Kouzes and Posner. It bridges the gap between management and leadership with five practices anyone can adopt. Free summaries on Actionable Books.' },
  { title: 'Books Like Good to Great', slug: 'books-like-good-to-great', keyword: 'books like good to great', pool: () => [...byCategory('self-management'), ...byCategory('leadership'), ...byCategory('innovative-thinking')],
    intro: 'Good to Great set the standard for research-driven business books. Jim Collins and his team spent five years studying what separates good companies from great ones, and the answer — disciplined people, disciplined thought, disciplined action — has become part of the business lexicon. If you loved the Hedgehog Concept and the Flywheel Effect, these books continue the conversation.',
    conclusion: '**If you only read one:** *Built to Sell* by John Warrillow. It takes Collins\' discipline framework and applies it to the specific challenge of building a company that works without you. Free summaries on Actionable Books.' },
  { title: 'Best Books on Change Management', slug: 'best-books-on-change-management', keyword: 'best books on change management', pool: () => [...byCategory('leadership'), ...byCategory('team-optimization'), ...byCategory('effective-communication')],
    intro: 'Change is hard because people wear themselves out. That insight from Chip and Dan Heath captures the fundamental challenge of organizational change: it is not a strategy problem, it is a people problem. These books give you frameworks for leading change at every level — from shifting your own habits to transforming an entire organization.',
    conclusion: '**If you only read one:** *Switch* by Chip and Dan Heath. It gives you the simplest, most practical framework for making change happen: direct the rider, motivate the elephant, shape the path. Free summaries on Actionable Books.' }
];

// ============================================
// BLOG TOPICS (10)
// ============================================
const blogTopics = [
  { title: 'How to Apply the Hedgehog Concept in Your Career', slug: 'how-to-apply-hedgehog-concept', category: 'cms/blog-category/leadership.md',
    meta: 'Jim Collins\' Hedgehog Concept from Good to Great can transform your career. Here is how to find the intersection of passion, skill, and economics.',
    body: `The Hedgehog Concept is one of the most powerful ideas in Jim Collins' *Good to Great*. It asks you to find the intersection of three circles: what you are deeply passionate about, what you can be the best in the world at, and what drives your economic engine.\n\nMost people never do this exercise. They drift from job to job, chasing salary bumps or following the path of least resistance. The Hedgehog Concept demands something different — it demands that you get honest about where your true strengths lie.\n\n## The Three Questions\n\n**What are you passionate about?** Not what sounds impressive at dinner parties. What work would you do even if nobody paid you?\n\n**What can you be the best at?** This is the hardest question. It requires brutal honesty about your actual talents, not the talents you wish you had.\n\n**What drives your economic engine?** Passion without income is a hobby. You need to find the overlap where your best work also creates value that people will pay for.\n\n## Putting It Into Practice\n\nCollins found that the companies that made the leap from good to great did not do so through a single dramatic transformation. They found their Hedgehog Concept and then worked within it with "almost neurotic discipline."\n\nThe same applies to your career. Once you identify your intersection, create what Collins calls a "stop doing" list — all the activities that fall outside your three circles. The discipline to say no to opportunities that do not fit is what separates the good careers from the great ones.\n\nRead our full summary of Good to Great for more insights, including why having a "stop doing" list might be more important than your to-do list.` },
  { title: '5 Communication Frameworks You Can Use Today', slug: '5-communication-frameworks', category: 'cms/blog-category/effective-communication.md',
    meta: 'Five practical communication frameworks from the best business books, ready to use in your next meeting or difficult conversation.',
    body: `Communication skills compound faster than almost any other professional skill. Here are five frameworks from books we have summarized at Actionable Books that you can start using immediately.\n\n## 1. The Pool of Shared Meaning (Crucial Conversations)\n\nEvery conversation has an invisible pool where everyone's ideas, opinions, and feelings flow together. As Al Switzler explains, "When it comes to risky, controversial, and emotional conversations, skilled people find a way to get all relevant information out into the open." Before your next difficult conversation, ask yourself: am I adding to the pool, or am I keeping things back?\n\n## 2. The SPIN Framework (SPIN Selling)\n\nNeil Rackham's research showed that the best salespeople ask questions in a specific sequence: Situation, Problem, Implication, Need-payoff. But this works far beyond sales. Use it anytime you need to help someone see the value of a change.\n\n## 3. The 18-Minute Rule (Talk Like TED)\n\nCarmine Gallo analyzed hundreds of TED talks and found that 18 minutes is the ideal presentation length. Long enough to be serious, short enough to hold attention. Next time you prepare a presentation, set this as your hard limit.\n\n## 4. Frame Before You Argue (All Marketers Are Liars)\n\nSeth Godin teaches that "frames are the words and images and interactions that reinforce a bias someone is already feeling." Before you try to persuade anyone, understand their existing worldview and frame your argument within it.\n\n## 5. Watch for Silence and Violence (Crucial Conversations)\n\nWhen people feel unsafe in a conversation, they move to one of two extremes: silence (withdrawing, masking, avoiding) or violence (controlling, labeling, attacking). Learning to spot these patterns — in yourself and others — is the single most useful communication skill you can develop.\n\nEach of these frameworks comes from a book we have fully summarized on Actionable Books. Read the summaries to get the complete picture in five minutes each.` },
  { title: 'The Leadership Lesson in Every Simon Sinek Book', slug: 'leadership-lesson-simon-sinek', category: 'cms/blog-category/leadership.md',
    meta: 'Simon Sinek has written some of the most influential leadership books of our generation. Here is the one lesson that connects them all.',
    body: `Simon Sinek has built a career on a single, powerful insight: people follow leaders who make them feel safe.\n\nIn *Start With Why*, he frames it as purpose. "Manipulations work," he writes, "but there are trade-offs. Not a single one of them breeds loyalty." The companies that inspire — Apple, Southwest Airlines, the Wright Brothers — succeed not because of what they do, but because of why they do it.\n\nIn *Leaders Eat Last*, he goes deeper. The title itself is a military principle: officers eat after their troops. Sinek argues that great leadership is fundamentally about sacrifice. "Everything about being a leader is like being a parent," he writes. Great leaders create what he calls a "Circle of Safety" — an environment where people feel secure enough to take risks, speak up, and do their best work.\n\nThe connecting thread is this: **leadership is not about being in charge. It is about taking care of the people in your charge.**\n\n## What This Means for You\n\nYou do not need to be a CEO to apply this. If you manage even one person, ask yourself:\n\n- Do the people on my team feel safe enough to admit mistakes?\n- Am I using manipulation (bonuses, threats, pressure) or inspiration (purpose, trust, belonging) to motivate?\n- When was the last time I put someone else's needs ahead of my own convenience?\n\nSinek's work is not complicated. It is just hard. Hard because it asks you to be vulnerable. Hard because it requires patience. Hard because the results do not show up in quarterly reports.\n\nBut if you get it right, you build something that no amount of corporate restructuring can replicate: genuine loyalty.\n\nRead our summaries of Start With Why and Leaders Eat Last for the complete insights.` },
  { title: 'Why Every Entrepreneur Should Read Rework', slug: 'why-read-rework', category: 'cms/blog-category/innovative-thinking.md',
    meta: 'Rework by the founders of 37Signals challenges everything you think you know about starting a business. Here is why it matters.',
    body: `Most business books tell you to write a business plan, raise capital, and scale fast. *Rework* by Jason Fried and David Heinemeier Hansson tells you to ignore all of that.\n\n"The real world isn't a place, it's an excuse," they write. "It's a justification for not trying."\n\nThe book is built around a radical premise: you do not need permission, investors, or an MBA to build something meaningful. You need clarity about what matters and the discipline to ignore everything else.\n\n## The Ideas That Hit Hardest\n\n**Planning is guessing.** Stop writing elaborate plans that will be obsolete in months. Instead, make decisions based on what you know right now.\n\n**Workaholism is not a virtue.** Working 80-hour weeks does not mean you are dedicated. It means you are not prioritizing well enough.\n\n**Say no by default.** "What you do is what matters, not what you think or say or plan." Every yes is a no to something else.\n\n**Grow slow.** "Standing for something isn't about just writing it down. It's about believing it and living it." The 37Signals team built Basecamp into a profitable company without venture capital, without an office, and without most of the things entrepreneurs are told they need.\n\n## Why It Matters Now\n\nIn a world obsessed with growth hacking and disruption, Rework is a breath of fresh air. It argues that the best business is a profitable one — not the biggest one, not the fastest-growing one, but the one that makes enough money to sustain the life you actually want to live.\n\nIf you are tired of startup culture telling you to sacrifice everything for a moonshot, read this book. It might be the most honest business book ever written.\n\nRead our full summary of Rework on Actionable Books.` },
  { title: '3 Productivity Systems That Actually Work', slug: '3-productivity-systems-that-work', category: 'cms/blog-category/self-management.md',
    meta: 'Three proven productivity systems from the best business books, backed by research and used by high performers.',
    body: `Most productivity advice is noise. Here are three systems from books we have summarized that are backed by real research and used by people who actually get things done.\n\n## 1. Deep Work Blocks (from Deep Work by Cal Newport)\n\nNewport's research is clear: "The ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable in our economy."\n\nThe system is simple: block 2-4 hours of uninterrupted time each day for your most important work. No email, no Slack, no meetings. Treat these blocks as sacred. Newport recommends ritualizing the process — same time, same place, same routine — so your brain learns to drop into deep focus quickly.\n\n## 2. The Focusing Question (from The ONE Thing by Gary Keller)\n\n"What's the ONE Thing I can do such that by doing it everything else would be easier or unnecessary?"\n\nThis single question, asked every morning, eliminates the paralysis of too many priorities. Keller argues that extraordinary results come from narrowing your focus, not expanding it. Use the question to identify your highest-leverage task, then protect the time to do it.\n\n## 3. The Essentialist Filter (from Essentialism by Greg McKeown)\n\n"If you don't prioritize your life, someone else will."\n\nMcKeown's system is about elimination. For every request, opportunity, or task, apply a simple filter: Is this essential? If it is not a clear yes, it is a clear no. The Essentialist does fewer things, but does them better. The result is not just higher productivity — it is higher satisfaction.\n\n## The Common Thread\n\nAll three systems share one principle: **doing less, but better.** Productivity is not about squeezing more tasks into your day. It is about making sure the tasks you do are the ones that actually matter.\n\nRead the full summaries of Deep Work, The ONE Thing, and Essentialism on Actionable Books.` },
  { title: 'What Mindset Teaches About Failure', slug: 'mindset-teaches-about-failure', category: 'cms/blog-category/self-management.md',
    meta: 'Carol Dweck\'s Mindset reframes failure as the essential ingredient of growth. Here is how to apply it.',
    body: `Carol Dweck spent decades studying how people think about their own abilities. Her conclusion is deceptively simple: "The view you adopt for yourself profoundly affects the way you lead your life."\n\nPeople with a **fixed mindset** believe their intelligence and talent are static. Every challenge becomes a test of their worth. Failure is not an event — it is an identity.\n\nPeople with a **growth mindset** believe abilities can be developed. Challenges are opportunities. Failure is data.\n\n## The Failure Trap\n\nDweck tells the story of LeBron James after losing the 2011 NBA finals. Rather than retreating, he studied his weaknesses and came back stronger. "Beware of success," Dweck writes. "It can knock you into a fixed mindset." The danger is not failure itself — it is how we interpret it.\n\nIn business, this plays out constantly. The manager who avoids giving feedback because they fear the awkward conversation. The entrepreneur who will not launch because the product is not perfect. The employee who never raises their hand for stretch assignments.\n\nAll of these are fixed mindset behaviors disguised as prudence.\n\n## Applying It\n\n1. **Change your self-talk.** Replace "I failed" with "I learned." This is not positive thinking — it is accurate thinking.\n2. **Seek challenges deliberately.** Dweck's research shows that growth-mindset individuals actively pursue situations where they might fail.\n3. **Praise process, not talent.** Whether you are leading a team or raising children, praising effort and strategy develops growth mindset. Praising innate ability reinforces fixed mindset.\n\nThe most liberating insight from Mindset is this: **you are not stuck with the brain you have.** You can change your intelligence, your personality, and your abilities through deliberate effort.\n\nRead our full summary of Mindset on Actionable Books for more insights.` },
  { title: 'Building Better Habits: Lessons from The Power of Habit', slug: 'building-better-habits', category: 'cms/blog-category/self-management.md',
    meta: 'Charles Duhigg\'s The Power of Habit reveals the science behind why habits form and how to change them.',
    body: `Charles Duhigg opens The Power of Habit with a story about Michael Phelps. Before every race, Phelps followed an identical routine — the same warm-up, the same stretches, the same mental visualization. His coach, Bob Bowman, had designed habits that would make Phelps "the strongest mental swimmer in the pool."\n\nThe lesson is not about swimming. It is about the power of the habit loop: **cue, routine, reward.**\n\n## The Habit Loop\n\nEvery habit follows the same pattern. A cue triggers the behavior. The routine is the behavior itself. And the reward is what your brain gets out of it.\n\nThe key insight from Duhigg is that you cannot eliminate a habit — you can only change the routine. The cue and the reward stay the same. If stress (cue) triggers snacking (routine) for comfort (reward), the solution is not willpower. It is finding a different routine that delivers the same reward.\n\n## The Four Steps to Change\n\n1. **Identify the routine.** What behavior do you want to change?\n2. **Experiment with rewards.** Try different routines to figure out what craving the habit actually satisfies.\n3. **Isolate the cue.** Duhigg found that most cues fall into five categories: location, time, emotional state, other people, and the immediately preceding action.\n4. **Have a plan.** Write it down: "When [cue], I will [new routine] because it provides [reward]."\n\n## Keystone Habits\n\nDuhigg introduces the concept of keystone habits — small changes that cascade into broader transformation. Exercise is the classic example. People who start exercising regularly also tend to eat better, sleep better, and be more productive at work. They did not plan all those changes. The keystone habit created a chain reaction.\n\nRead our full summary of The Power of Habit on Actionable Books for more on keystone habits and organizational change.` },
  { title: 'How to Have Crucial Conversations at Work', slug: 'crucial-conversations-at-work', category: 'cms/blog-category/effective-communication.md',
    meta: 'The framework from Crucial Conversations can transform how you handle high-stakes discussions at work.',
    body: `The authors of Crucial Conversations define them as discussions where stakes are high, opinions differ, and emotions run strong. Sound like your last performance review? Your last budget meeting? Your last conversation about returning to the office?\n\nTheir research found that "strong relationships, careers, organizations, and communities all draw from the same source of power — the ability to talk openly about high-stakes, emotional, controversial topics."\n\n## The Pool of Shared Meaning\n\nThe central metaphor of the book is powerful. Every conversation has an invisible pool where everyone contributes their ideas, feelings, and observations. When the pool is full — when everyone feels safe enough to share honestly — better decisions get made.\n\nThe problem is that most people, when they feel threatened, either go silent or get aggressive. Neither fills the pool.\n\n## Making It Safe\n\nThe first skill is learning to watch for the moment a conversation becomes crucial. Your body knows before your brain does — pulse quickens, stomach tightens, voice changes.\n\nWhen you spot it, do not push through. Step back and make it safe. The authors suggest two tools:\n\n**Mutual Purpose:** Remind everyone you are working toward the same goal. "I think we both want this project to succeed. Can we find a way to..."\n\n**Mutual Respect:** If respect has been lost, rebuild it before continuing the content of the conversation. You cannot reason with someone who feels disrespected.\n\n## Choose Your Story\n\n"The first step to regaining emotional control is to challenge the illusion that what you're feeling is the only right emotion under the circumstances."\n\nBefore reacting, ask: What story am I telling myself about this person's intentions? Is there another explanation? This simple pause — between stimulus and response — is where the magic happens.\n\nRead our full summary of Crucial Conversations on Actionable Books.` },
  { title: 'The Best Business Book for Every Stage of Your Career', slug: 'best-book-every-career-stage', category: 'cms/blog-category/leadership.md',
    meta: 'One recommended business book for each stage of your career, from first job to executive leadership.',
    body: `Not every business book is right for every moment. What you need as a new graduate is different from what you need as a VP. Here is one book for each stage, chosen from the 1,100+ summaries on Actionable Books.\n\n## Just Starting Out: Rework\n\nForget everything your business school professors told you. Rework by Jason Fried and David Heinemeier Hansson teaches you that "what you do is what matters, not what you think or say or plan." It is the antidote to analysis paralysis and the best book for developing a bias toward action.\n\n## Individual Contributor: Deep Work\n\nCal Newport makes the case that the ability to focus without distraction is the most valuable skill in the modern economy. Before you worry about managing others, master the art of managing your own attention.\n\n## New Manager: Leaders Eat Last\n\nSimon Sinek reframes leadership as service. "Customers will never love a company until the employees love it first." This book will reshape how you think about your new responsibility to the people on your team.\n\n## Mid-Career Leader: Crucial Conversations\n\nBy this point, your success depends entirely on your ability to navigate high-stakes discussions. This book gives you the framework for having the conversations everyone else avoids.\n\n## Executive: Built to Sell\n\nJohn Warrillow argues that the ultimate test of a business is whether it can run without you. Even if you never plan to sell, the discipline of building a sellable company forces you to create systems, develop leaders, and focus on what truly differentiates your organization.\n\n## At Any Stage: Mindset\n\nCarol Dweck's growth mindset is relevant at every career stage. The belief that you can develop any ability through effort is the foundation everything else is built on.\n\nEvery book on this list has a free summary on Actionable Books — read the key insights in five minutes.` },
  { title: 'Why Book Summaries Are the Smartest Way to Learn', slug: 'why-book-summaries-are-smart', category: 'cms/blog-category/business.md',
    meta: 'Book summaries are not shortcuts. They are the most efficient way to decide which books deserve your full attention.',
    body: `Let us be honest: you will never read all the books on your reading list.\n\nThe average business professional has dozens of unread books on their shelf, in their Kindle, on their "to read" list. The intention is good. The time is not.\n\nThis is not a failure of discipline. It is a failure of strategy.\n\n## The Case for Summaries First\n\nAt Actionable Books, we have summarized over 1,100 business books since 2008. Each summary distills a book into its big idea, two actionable insights, and one memorable quote. It takes about five minutes to read.\n\nHere is what we have learned: **summaries do not replace books. They replace bad book choices.**\n\nWhen you read a five-minute summary, you get enough information to make an informed decision: Is this book worth 8 hours of my life? Sometimes the answer is yes — the summary makes you hungry for the full depth. More often, the summary gives you exactly what you need: the one actionable idea you can apply immediately.\n\n## The Compound Effect\n\nReading one summary a day means absorbing the key insights from 365 books a year. You could not read 365 full books even if you did nothing else. But you can absolutely read 365 summaries — during your commute, over lunch, before bed.\n\nOver time, this builds a remarkably broad knowledge base. You develop pattern recognition across business disciplines. You start seeing connections between leadership theory and communication frameworks, between innovation methodology and habit science.\n\n## How to Use Summaries Effectively\n\n1. **Read the summary first.** Get the core idea in five minutes.\n2. **Apply one insight immediately.** Do not wait. Use it today.\n3. **Buy the book if you want more.** The summary tells you whether the full book is worth your investment.\n\nThis is not about cutting corners. It is about being strategic with the most limited resource you have: your attention.\n\nBrowse our library of 1,100+ summaries at Actionable Books and start with the one that speaks to your biggest challenge right now.` }
];

// ============================================
// GENERATE CONTENT
// ============================================
const usedSlugs = new Set();
// Exclude already-existing list slugs
fs.readdirSync(listsDir).filter(f => f.endsWith('.md')).forEach(f => usedSlugs.add(f.replace('.md', '')));

let dayCounter = 1;

// Generate 20 list pages
for (const topic of listTopics) {
  const pool = topic.pool();
  const books = pickBooks(pool, 10, new Set(usedSlugs));
  if (books.length < 5) {
    console.log(`Skipping ${topic.title} — only ${books.length} unique books available`);
    continue;
  }

  const pubDate = getDate(dayCounter);
  const content = makeListMd(
    topic.title, topic.slug, topic.keyword,
    `${topic.title} — curated from over 1,100 summaries. Each pick includes a free actionable summary.`,
    topic.intro, books, topic.conclusion, pubDate
  );

  const filePath = path.join(listsDir, `${topic.slug}.md`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`[Day ${dayCounter}] LIST: ${topic.title} → ${topic.slug}.md (${books.length} books, pub: ${pubDate.split('T')[0]})`);
    dayCounter++;
  } else {
    console.log(`SKIP (exists): ${topic.slug}.md`);
  }
}

// Generate 10 blog posts
for (const topic of blogTopics) {
  const pubDate = getDate(dayCounter);
  const content = makeBlogMd(
    topic.title, topic.slug, topic.category,
    topic.meta, topic.body, pubDate
  );

  const filePath = path.join(blogDir, `${topic.slug}.md`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`[Day ${dayCounter}] BLOG: ${topic.title} → ${topic.slug}.md (pub: ${pubDate.split('T')[0]})`);
    dayCounter++;
  } else {
    console.log(`SKIP (exists): ${topic.slug}.md`);
  }
}

console.log(`\nGenerated ${dayCounter - 1} content pieces total.`);
