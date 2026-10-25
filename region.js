// Which currency a visitor sees (Hassan, 22 Oct 2026): Egypt EGP, Saudi Arabia SAR, everyone else USD.
// The country comes from the visitor's internet address (the region function), the device's time zone until it
// answers. ?cur=egp|sar|usd in the link overrides it, for testing. InstaPay and the Egyptian wallets show only to Egypt (class eg-only;
// non-eg is the text shown elsewhere instead).
(() => {
  // Hassan's prices (22 Oct 2026; Saudi Max 399.99 -> 374.99 on 25 Oct), the same as Stripe's. Egypt and Saudi Arabia
  // pay these or the exact dollar equivalent.
  const PRICES = {
    mini: { egp: 199, sar: 19.99, usd: 9.99 },
    plus: { egp: 499, sar: 49.99, usd: 18.99 },
    max: { egp: 4999, sar: 374.99, usd: 99.99 },
  };
  let zone = '';
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  const forced = new URLSearchParams(location.search).get('cur');
  // Where the visitor is, by the rule billing charges by (the region function: their internet address; Hassan, 25 Oct
  // 2026: "why is it showing me US prices while I'm in Egypt"). The last answer is kept in this browser; the time zone
  // is only the first guess. When the answer differs, the page loads once more in the right currency.
  let known = null;
  try { known = localStorage.getItem('mared-cur'); } catch (e) {}
  const guess = known || (zone === 'Africa/Cairo' ? 'egp' : zone === 'Asia/Riyadh' ? 'sar' : 'usd');
  const cur = ['egp', 'sar', 'usd'].includes(forced) ? forced : guess;
  if (!forced) {
    fetch('https://btyuidhqihwxnynivbgz.supabase.co/functions/v1/region').then((r) => r.json()).then((j) => {
      const real = { eg: 'egp', sa: 'sar' }[j.region] || 'usd';
      try { localStorage.setItem('mared-cur', real); } catch (e) { return; } // without storage, no reload: it would never stop
      if (real !== cur) location.reload();
    }).catch(() => {});
  }
  const num = (n) => n.toLocaleString('en', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const UNIT = { egp: 'جنيه', sar: 'ريال' };

  // "499 جنيه" / "EGP 499", "74.99 ريال" / "SAR 74.99", "$19.99" in both languages.
  const price = (plan, isEn) => {
    const n = PRICES[plan][cur];
    return cur === 'usd' ? `$${num(n)}` : isEn ? `${cur.toUpperCase()} ${num(n)}` : `${num(n)} ${UNIT[cur]}`;
  };
  // The big price on a plan card: the number large, the unit and "/ month" small.
  const amountHtml = (plan, isEn) => {
    const n = num(PRICES[plan][cur]);
    if (cur === 'usd') return `$${n} <small>${isEn ? '/ month' : '/ شهر'}</small>`;
    return isEn ? `${cur.toUpperCase()} ${n} <small>/ month</small>` : `${n} <small>${UNIT[cur]} / شهر</small>`;
  };

  document.documentElement.classList.add(cur === 'egp' ? 'eg' : 'not-eg');
  const style = document.createElement('style');
  style.textContent = 'html.not-eg .eg-only, html.eg .non-eg { display: none !important; }';
  document.head.append(style);
  window.MARED = { cur, egypt: cur === 'egp', price, amountHtml };
})();
