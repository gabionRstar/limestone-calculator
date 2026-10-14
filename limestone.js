// ===== ASSUMPTIONS — edit here =====
const C = {
  BLOCK_L: 1000, BLOCK_W: 350, BLOCK_H: 350, // mm
  MORTAR: 20,            // mm mortar joint (bed + perp + across)
  PRICE_DEFAULT: 90,     // $ per block installed
  MAX_H: 3000,           // mm, Structerre H23R max
  MIN_BASE: 650,         // mm, min base width for H<=1000
  EMBED_LOW: 200, EMBED_HIGH: 300, EMBED_SWITCH: 1000, // mm
  POST_SPACING: 2.4,     // m, fence posts max c/c
  ANCHOR_ZONE: 3.6       // m from fence free ends
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
  const bpm = sum / ((C.BLOCK_L + C.MORTAR) / 1000);
  const blocks = Math.ceil(L * bpm - 1e-9);
  return { embed, base, total, courses, list, bpm, blocks, cost: blocks * price, perM: bpm * price };
}
if (typeof module !== 'undefined') module.exports = { calc, C };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id), fmt = n => '$' + Math.round(n).toLocaleString('en-AU');
  $('price').value = C.PRICE_DEFAULT;
  const sync = (a, b) => { $(a).oninput = () => { $(b).value = $(a).value; run(); }; };
  sync('lenR', 'len'); sync('len', 'lenR'); sync('hR', 'h'); sync('h', 'hR');
  ['price', 'fence', 'postPrice'].forEach(i => $(i).oninput = run);
  function run() {
    const L = +$('len').value || 0, H = +$('h').value || 0, p = +$('price').value || 0;
    $('warn').hidden = H <= C.MAX_H;
    const r = calc(L, Math.min(H, C.MAX_H), p);
    $('total').textContent = fmt(r.cost);
    $('perm').textContent = fmt(r.perM) + ' / m';
    $('out').innerHTML = [['Total blocks', r.blocks], ['Blocks per metre', r.bpm.toFixed(2)], ['Courses', r.courses + ' (' + r.total + ' mm incl. embedment)'],
      ['Base width', Math.round(r.base) + ' mm'], ['Embedment', r.embed + ' mm'], ['Blocks wide at base', r.list[0]], ['Blocks wide bottom→top', r.list.join(' · ')]]
      .map(([k, v]) => `<div class="row"><span>${k}</span><b>${v}</b></div>`).join('');
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
