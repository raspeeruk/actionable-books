const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const code = fs.readFileSync(require.resolve('../theme/assets/js/library.js'), 'utf8');
function visit({ choice, query = '', jar = new Map([['_ga', 'old'], ['necessary', 'keep']]) } = {}) {
  const storage = new Map(choice ? [['actionablebooks-privacy-v1', choice]] : []);
  const scripts = [], listeners = {}, buttons = {};
  const button = consent => ({ dataset: { consent }, addEventListener: (_, fn) => { buttons[consent] = fn; } });
  const panel = { hidden: true, querySelector: () => ({ focus() {} }) };
  const document = {
    documentElement: { classList: { add() {} } }, referrer: 'https://example.org/article?query=PRIVATE_REFERRER', title: 'Search',
    querySelector: () => null, getElementById: id => id === 'cookie-panel' ? panel : null,
    querySelectorAll: selector => selector === '[data-consent]' ? [button('denied'), button('granted')] : [],
    addEventListener: (event, fn) => { listeners[event] = fn; }, createElement: () => ({}), head: { append: script => scripts.push(script.src) }
  };
  Object.defineProperty(document, 'cookie', { get: () => [...jar].map(([k, v]) => k + '=' + v).join('; '), set: value => { const [key, val] = value.split(';')[0].split('='); if (/Max-Age=0/.test(value)) jar.delete(key); else jar.set(key, val); } });
  const location = { origin: 'https://actionablebooks.com', hostname: 'actionablebooks.com', pathname: '/search/', search: query, reload() { result.reloads++; } };
  const window = {};
  const result = { window, scripts, panel, jar, reloads: 0, consent: value => buttons[value](), commands: () => (window.dataLayer || []).map(args => Array.from(args)) };
  vm.runInNewContext(code, { document, window, location, localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v) }, URL, URLSearchParams, Date });
  return result;
}
test('no Analytics loader or queue exists before choice or after rejection', () => {
  const fresh = visit();
  assert.equal(fresh.panel.hidden, false);
  assert.deepEqual(fresh.scripts, []);
  assert.equal(fresh.window.dataLayer, undefined);
  fresh.consent('denied');
  assert.deepEqual(fresh.scripts, []);
  assert.equal(visit({ choice: 'denied' }).window.dataLayer, undefined);
});
test('grant queues one explicit page view with sanitized location/referrer and no search/form text', () => {
  const page = visit({ query: '?query=PRIVATE_SEARCH&email=PRIVATE_EMAIL&utm_source=PRIVATE_CAMPAIGN' });
  page.consent('granted');
  assert.equal(page.scripts.length, 1);
  const commands = page.commands();
  assert.equal(commands.filter(c => c[0] === 'event' && c[1] === 'page_view').length, 1);
  const config = commands.find(c => c[0] === 'config')[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.page_location, 'https://actionablebooks.com/search/');
  assert.equal(config.page_referrer, 'https://example.org/article');
  assert.equal(config.allow_google_signals, false);
  assert.ok(!JSON.stringify(commands).includes('PRIVATE_'));
});
test('only the exact reviewed placement combination becomes campaign metadata', () => {
  const accepted = visit({ choice: 'granted', query: '?utm_source=linkedin&utm_medium=referral&utm_campaign=external-search-pilot&utm_content=p01-coaching-conversation' });
  assert.equal(accepted.commands().find(c => c[0] === 'config')[2].campaign_content, 'p01-coaching-conversation');
  const invalid = visit({ choice: 'granted', query: '?utm_source=medium&utm_medium=referral&utm_campaign=external-search-pilot&utm_content=p01-coaching-conversation' });
  assert.equal(invalid.commands().find(c => c[0] === 'config')[2].campaign_content, undefined);
});
test('withdrawal disables collection, preserves necessary cookies and reloads; regrant works', () => {
  const page = visit({ choice: 'granted' });
  page.consent('denied');
  assert.equal(page.window['ga-disable-G-1JN72T7V0Y'], true);
  assert.equal(page.jar.has('_ga'), false);
  assert.equal(page.jar.get('necessary'), 'keep');
  assert.equal(page.reloads, 1);
  const next = visit({ choice: 'denied', jar: page.jar });
  next.consent('granted');
  assert.equal(next.scripts.length, 1);
  assert.equal(next.window['ga-disable-G-1JN72T7V0Y'], false);
});
