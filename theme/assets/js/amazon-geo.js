/**
 * Amazon Geo-Redirect Script
 * Replaces GeniusLink — detects visitor locale and rewrites Amazon links
 * to the correct regional domain, preserving ASIN and affiliate tag.
 */
(function () {
  'use strict';

  var domainMap = {
    US: 'www.amazon.com',
    CA: 'www.amazon.ca',
    GB: 'www.amazon.co.uk',
    DE: 'www.amazon.de',
    FR: 'www.amazon.fr',
    ES: 'www.amazon.es',
    IT: 'www.amazon.it',
    JP: 'www.amazon.co.jp',
    AU: 'www.amazon.com.au',
    IN: 'www.amazon.in',
    BR: 'www.amazon.com.br',
    MX: 'www.amazon.com.mx',
    NL: 'www.amazon.nl',
    SE: 'www.amazon.se',
    SG: 'www.amazon.sg',
    AE: 'www.amazon.ae'
  };

  // Map timezone regions to country codes
  var timezoneToCountry = {
    'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
    'America/Los_Angeles': 'US', 'America/Anchorage': 'US', 'Pacific/Honolulu': 'US',
    'America/Phoenix': 'US', 'America/Indiana': 'US', 'America/Detroit': 'US',
    'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA',
    'America/Winnipeg': 'CA', 'America/Halifax': 'CA', 'America/St_Johns': 'CA',
    'America/Montreal': 'CA', 'America/Regina': 'CA',
    'Europe/London': 'GB', 'Europe/Belfast': 'GB',
    'Europe/Berlin': 'DE', 'Europe/Vienna': 'DE',
    'Europe/Paris': 'FR',
    'Europe/Madrid': 'ES',
    'Europe/Rome': 'IT',
    'Asia/Tokyo': 'JP',
    'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU',
    'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU', 'Australia/Hobart': 'AU',
    'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
    'America/Sao_Paulo': 'BR', 'America/Fortaleza': 'BR',
    'America/Mexico_City': 'MX', 'America/Cancun': 'MX',
    'Europe/Amsterdam': 'NL',
    'Europe/Stockholm': 'SE',
    'Asia/Singapore': 'SG',
    'Asia/Dubai': 'AE'
  };

  function detectCountry() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && timezoneToCountry[tz]) {
        return timezoneToCountry[tz];
      }
      // Fallback: check timezone region prefix
      if (tz) {
        var region = tz.split('/')[0];
        if (region === 'Australia') return 'AU';
        if (region === 'Asia') {
          // Use language hint for ambiguous Asian timezones
          var lang = (navigator.language || '').toLowerCase();
          if (lang.indexOf('ja') === 0) return 'JP';
          if (lang.indexOf('hi') === 0 || lang.indexOf('en-in') === 0) return 'IN';
          if (lang.indexOf('zh-sg') === 0) return 'SG';
        }
      }
    } catch (e) {
      // Intl not supported
    }

    // Fallback: use navigator.language
    var lang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (lang.indexOf('en-gb') === 0) return 'GB';
    if (lang.indexOf('en-au') === 0) return 'AU';
    if (lang.indexOf('en-ca') === 0 || lang.indexOf('fr-ca') === 0) return 'CA';
    if (lang.indexOf('en-in') === 0) return 'IN';
    if (lang.indexOf('de') === 0) return 'DE';
    if (lang.indexOf('fr') === 0) return 'FR';
    if (lang.indexOf('es-mx') === 0) return 'MX';
    if (lang.indexOf('es') === 0) return 'ES';
    if (lang.indexOf('it') === 0) return 'IT';
    if (lang.indexOf('ja') === 0) return 'JP';
    if (lang.indexOf('pt-br') === 0) return 'BR';
    if (lang.indexOf('nl') === 0) return 'NL';
    if (lang.indexOf('sv') === 0) return 'SE';

    // Default to US
    return 'US';
  }

  function rewriteLinks() {
    var country = detectCountry();
    var targetDomain = domainMap[country];

    // No rewrite needed if US (links already point to amazon.com)
    if (!targetDomain || targetDomain === 'www.amazon.com') return;

    var links = document.querySelectorAll('a[href*="amazon.com"]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (href && href.indexOf('www.amazon.com') !== -1) {
        links[i].setAttribute('href', href.replace('www.amazon.com', targetDomain));
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', rewriteLinks);
  } else {
    rewriteLinks();
  }
})();
