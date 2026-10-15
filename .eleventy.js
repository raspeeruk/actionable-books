const { createLibrary, cleanBody, renderBody, jsonLd, escapeHtml } = require('./_utils/library');
const { createView, entryFor, entrySchema } = require('./_utils/library-view');

module.exports = function (eleventyConfig) {
  let catalog;
  let view;
  const getCatalog = () => catalog || (catalog = createLibrary());
  const getView = () => view || (view = createView(getCatalog()));
  eleventyConfig.on('eleventy.before', () => { catalog = null; view = null; });
  eleventyConfig.setQuietMode(true);
  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true });
  eleventyConfig.addGlobalData('library', () => getView());
  eleventyConfig.addGlobalData('release', () => {
    let sourceCommit = process.env.COMMIT_REF || process.env.GITHUB_SHA || null;
    if (!sourceCommit) { try { sourceCommit = require('node:child_process').execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch (_) { /* Unknown stays explicit. */ } }
    return { sourceCommit, builtAt: new Date().toISOString(), note: 'Build identity only. This is not an article publication date.' };
  });
  eleventyConfig.addFilter('libraryEntry', (input, url, title, description) => entryFor(getCatalog(), input, url, title, description));
  eleventyConfig.addFilter('directoryFor', url => getView().directoryByUrl[url] || null);
  eleventyConfig.addFilter('entrySchema', entrySchema);
  eleventyConfig.addFilter('jsonLd', jsonLd);
  eleventyConfig.addFilter('json', value => JSON.stringify(value));
  eleventyConfig.addFilter('escape', escapeHtml);
  eleventyConfig.addFilter('markdown', content => renderBody(content).html);
  eleventyConfig.addFilter('dateDisplay', value => value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '');
  eleventyConfig.addFilter('dateRss', value => value ? new Date(value).toUTCString() : '');
  eleventyConfig.addFilter('published', items => (items || []).filter(item => !item.data?.['published-on'] || new Date(item.data['published-on']) <= new Date()));
  eleventyConfig.addPassthroughCopy({ 'theme/assets': 'assets' });
  eleventyConfig.addPassthroughCopy('admin');
  return { htmlTemplateEngine: 'njk', markdownTemplateEngine: 'liquid', dir: { input: 'cms', includes: '../theme', output: 'dist' } };
};
