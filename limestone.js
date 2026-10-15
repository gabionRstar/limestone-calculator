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
  FENCE_PRICE: 110,      // $ per linear metre, 1.8 m Colorbond fence
  FENCE_H: 1.8,          // m
  MIN_WALL_POSTS: 900    // mm, min wall height for fence posts
};
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
  const bpm = Math.ceil(sum / ((C.BLOCK_L + C.MORTAR) / 1000) - 1e-9); // rounded up to whole blocks/m
  const blocks = Math.ceil(L * bpm - 1e-9);
  return { embed, base, total, courses, list, bpm, blocks, cost: blocks * price, perM: bpm * price };
}
const SIDE=['0900','1000','1100','1200','1300-1500','1600-1700','1800-1900','2000','2100-2200','2300','2400-2500','2600','2700-2800','2900-3000'];
function sideFile(H){for(const r of SIDE){const [a,b=a]=r.split('-').map(Number);if(H>=a&&H<=b)return 'img/wall-'+r+'.png';}return null;}
if (typeof module !== 'undefined') module.exports = { calc, C, sideFile };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id), fmt = n => '$' + Math.round(n).toLocaleString('en-AU');
  $('price').value = C.PRICE_DEFAULT; $('fencePrice').value = C.FENCE_PRICE;
  const sync = (a, b) => { $(a).oninput = () => { $(b).value = $(a).value; run(); }; };
  sync('lenR', 'len'); sync('len', 'lenR'); sync('hR', 'h'); sync('h', 'hR');
  ['price', 'fence', 'fencePrice'].forEach(i => $(i).oninput = run);
  function run() {
    const L = +$('len').value || 0, H = +$('h').value || 0, p = +$('price').value || 0;
    $('warn').hidden = H <= C.MAX_H;
    const e = calc(L, Math.min(H, C.MAX_H), p), f = $('fence').checked;
    $('fenceBox').hidden = !f;
    const fp = +$('fencePrice').value || 0, fc = f ? L * fp : 0;
    $('total').textContent = fmt(e.cost + fc);
    $('perm').textContent = fmt(e.perM + (f ? fp : 0)) + ' / m';
    const rows = [['Limestone wall', fmt(e.cost)]];
    if (f) rows.push(['Colorbond fence ' + C.FENCE_H + ' m', fmt(fc)]);
    rows.push(['<b>Total</b>', fmt(e.cost + fc)], ['Total blocks', e.blocks], ['Blocks per metre', e.bpm],
      ['Wall $ per metre', fmt(e.perM) + ' / m'], ['Courses', e.courses + ' (' + e.total + ' mm incl. embedment)'],
      ['Base width', Math.round(e.base) + ' mm'], ['Embedment', e.embed + ' mm'], ['Blocks wide bottom→top', e.list.join(' · ')]);
    $('out').innerHTML = rows.map(([k, v]) => `<div class="row"><span>${k}</span><b>${v}</b></div>`).join('');
    if (f) $('fenceOut').innerHTML = `Posts at ${C.POST_SPACING} m max centres, cored through the limestone and grouted. Min wall height ${C.MIN_WALL_POSTS} mm for posts.` +
      (H < C.MIN_WALL_POSTS ? ' <b>Wall is below the minimum height for fence posts.</b>' : '');
    const hh = Math.min(H, C.MAX_H), sf = sideFile(Math.round(hh / 100) * 100);
    $('sideFig').hidden = !sf; $('sideNote').hidden = !!sf;
    if (sf) { if (!$('sideImg').src.endsWith(sf)) $('sideImg').src = sf;
      $('sideImg').alt = `Side view of a ${hh} mm limestone wall, ${e.courses} courses laid ${e.list.join('·')} blocks wide from the bottom up`; }
  }
  run();
}
