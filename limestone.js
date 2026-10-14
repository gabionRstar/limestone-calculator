// ===== ASSUMPTIONS — edit here =====
const C = {
  BLOCK_L: 1000, BLOCK_W: 350, BLOCK_H: 350, // mm
  MORTAR: 20,            // mm mortar joint (bed + perp + across)
  PRICE_DEFAULT: 90,     // $ per block installed
  MAX_H: 3000,           // mm, Structerre H23R max
  MIN_BASE: 650,         // mm, min base width for H<=1000
  EMBED_LOW: 200, EMBED_HIGH: 300, EMBED_SWITCH: 1000, // mm
  POST_SPACING: 2.4,     // m, fence posts max c/c
  ANCHOR_ZONE: 3.6,      // m from fence free ends
  // Contractor (Bret) calibration: [visible height mm, blocks per metre of wall]
  CAL: [[500, 2.4], [1000, 3.9], [1500, 8.0]],
  QUOTED_MAX: 1500,      // mm, above this = outside quoted range
  QUOTES: [ // past jobs shown in 'Checked against past quotes'
    { job: 'Noranda', L: 28, H: 500, quote: 6000 },
    { job: 'Baldivis', L: 23, H: 1000, quote: 8000 },
    { job: 'South Lake', L: 15, H: 1500, quote: 11000, note: 'about 120 blocks' }
  ]
};
// Linear interpolation; extrapolates using the nearest segment's slope
function bretBpm(H) {
  const p = C.CAL; let i = 0;
  while (i < p.length - 2 && H > p[i + 1][0]) i++;
  const [h0, b0] = p[i], [h1, b1] = p[i + 1];
  return Math.max(1000 / (C.BLOCK_L + C.MORTAR), b0 + (b1 - b0) * (H - h0) / (h1 - h0));
}
function calcBret(L, H, price) {
  const bpm = bretBpm(H), blocks = Math.ceil(L * bpm - 1e-9);
  return { bpm, blocks, cost: blocks * price, perM: bpm * price, outside: H > C.QUOTED_MAX };
}
function calc(L, H, price) {
  const embed = H <= C.EMBED_SWITCH ? C.EMBED_LOW : C.EMBED_HIGH;
  let base = H / 2 + 200; if (H <= C.EMBED_SWITCH) base = Math.max(base, C.MIN_BASE);
  const total = H + embed, ch = C.BLOCK_H + C.MORTAR, pw = C.BLOCK_W + C.MORTAR;
  const courses = Math.ceil(total / ch);
  const wide = w => Math.max(1, Math.ceil((w + C.MORTAR) / pw));
  let sum = 0, list = [];
  for (let i = 0; i < courses; i++) {
    const f = courses > 1 ? i / (courses - 1) : 0;
    const n = wide(base - (base - C.BLOCK_W) * f); list.push(n); sum += n;
  }
  const bpm = sum / ((C.BLOCK_L + C.MORTAR) / 1000);
  const blocks = Math.ceil(L * bpm - 1e-9);
  return { embed, base, total, courses, list, bpm, blocks, cost: blocks * price, perM: bpm * price };
}
if (typeof module !== 'undefined') module.exports = { calc, calcBret, C };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id), fmt = n => '$' + Math.round(n).toLocaleString('en-AU');
  $('price').value = C.PRICE_DEFAULT;
  const sync = (a, b) => { $(a).oninput = () => { $(b).value = $(a).value; run(); }; };
  sync('lenR', 'len'); sync('len', 'lenR'); sync('hR', 'h'); sync('h', 'hR');
  ['price', 'fence', 'postPrice', 'eng'].forEach(i => $(i).oninput = run);
  function run() {
    const L = +$('len').value || 0, H = +$('h').value || 0, p = +$('price').value || 0;
    $('warn').hidden = H <= C.MAX_H;
    const Hc = Math.min(H, C.MAX_H), e = calc(L, Hc, p), b = calcBret(L, Hc, p), eng = $('eng').checked;
    const r = eng ? e : b;
    $('mode').textContent = eng ? 'Full engineering base width (H23R taper)' : 'Contractor (Bret) layout';
    $('total').textContent = fmt(r.cost);
    $('perm').textContent = fmt(r.perM) + ' / m';
    $('range').hidden = eng || !b.outside;
    const rows = [['Total blocks', r.blocks], ['Blocks per metre', r.bpm.toFixed(2)]];
    if (eng) rows.push(['Courses', e.courses + ' (' + e.total + ' mm incl. embedment)'], ['Base width', Math.round(e.base) + ' mm'],
      ['Embedment', e.embed + ' mm'], ['Blocks wide bottom→top', e.list.join(' · ')], ['Contractor layout would be', fmt(b.cost) + ' (' + b.blocks + ' blocks)']);
    else rows.push(['Full engineering base would be', fmt(e.cost) + ' (' + e.blocks + ' blocks)']);
    $('out').innerHTML = rows.map(([k, v]) => `<div class="row"><span>${k}</span><b>${v}</b></div>`).join('');
    $('quotes').innerHTML = C.QUOTES.map(q => { const c = calcBret(q.L, q.H, p);
      return `<tr><td>${q.job}<br><small>${q.L} m × ${q.H} mm${q.note ? ', ' + q.note : ''}</small></td><td>${fmt(q.quote)}</td><td>${fmt(c.cost)}<br><small>${c.blocks} blocks</small></td></tr>`; }).join('');
    const f = $('fence').checked; $('fenceBox').hidden = !f;
    if (f) {
      const posts = Math.ceil(L / C.POST_SPACING) + 1, pp = parseFloat($('postPrice').value);
      $('fenceOut').innerHTML = `<b>${posts} posts</b> at ${C.POST_SPACING} m max c/c, cored through the limestone and grouted.` +
        (pp ? ` Posts: ${fmt(posts * pp)} (not in total above).` : '') +
        `<br>Within ${C.ANCHOR_ZONE} m of a fence free end: 550×550×650 concrete anchor blocks with 2N12 dowels, or posts at 1200 c/c. Fence max 1800 high; wall min 900 high for posts.`;
    }
  }
  run();
}
