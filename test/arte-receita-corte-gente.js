// ONDE CORTAR UMA CELULA DE GENTE QUE VEIO DOBRADA — a receita, em px de fonte, e a prova.
//
// Escrito pela direcao de arte em 05/09 para o item praca-tres-celulas-mostram-pessoa-em-dobro.
// Ele NAO corta nada: mede e desenha, para o corte do dev nao ser feito as cegas.
//
// A primeira receita tentada forcava a largura MEDIANA da fileira e decepava braco e pe. Esta:
//   1. a janela SEMPRE contem a tinta inteira da figura;
//   2. ela e SIMETRICA em torno de C = (cabeca - T), com T = deslocamento canonico da cabeca
//      na fileira — assim a cabeca cai exatamente onde ela cai nas celulas irmas quando o
//      jogo desenha com dx = cxm - dw/2 (src/jogo.ts:6395);
//   3. o que sobrar fora da folha vira preenchimento TRANSPARENTE (poucos px).
// A largura da celula pode ficar alguns px maior que a das irmas: nao custa nada, porque a
// ESCALA vem da ALTURA (sc = GENTE4_ALVO / naturalHeight), nao da largura.
//
// Depois desenha a FILEIRA INTEIRA no anexo do jogo (cada quadro centrado no mesmo cxm), com
// uma linha vertical onde a cabeca deveria estar — se a receita presta, a cabeca nao balanca.
// Salva test/CORTE-<cap>-f<fileira>.png.
// USO: node test/arte-receita-corte-gente.js <cap> <fXqY,...>
//      node test/arte-receita-corte-gente.js praca f0q3,f2q3,f2q6
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');
const { ehRuidoDeRedeExterna } = require('./rede-externa.js');
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
const CAP = process.argv[2] || 'praca';
const IDS = (process.argv[3] || '').split(',').filter(Boolean);

(async function () {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const page = await nav.newPage({ viewport: { width: 900, height: 700 } });
  page.on('console', m => { if (m.type() === 'error' && !ehRuidoDeRedeExterna(m)) console.log('CONSOLE ' + m.text()); });
  await page.goto(ALVO, { waitUntil: 'load' });
  await page.waitForFunction('typeof GENTE_EP_B64 !== "undefined" && typeof garantirEpoca === "function"', { timeout: 30000 });
  await page.evaluate((cap) => {
    const ep = EPOCAS.findIndex(e => e.id === cap);
    let cen = -1;
    for (let n = 0; n < TOTAL_CENAS; n++) if (epocaDoCenario(n) === ep) { cen = n; break; }
    S.cenario = cen; S.fronteira = Math.max(S.fronteira, cen);
    if (typeof visitando !== 'undefined') visitando = false;
    garantirEpoca(ep);
  }, CAP);
  await page.waitForFunction((cap) => {
    const f = GENTE_EP_SPR[cap]; if (!f) return false;
    let n = 0; f.forEach(fl => fl.forEach(im => { if (im.complete && im.naturalWidth > 1) n++; }));
    return n > 0;
  }, CAP, { timeout: 30000 });

  const out = await page.evaluate(async ({ cap, ids }) => {
    const folha = GENTE_EP_B64[cap];
    const ALVOH = (typeof GENTE4_ALVO !== 'undefined') ? GENTE4_ALVO : 42;
    async function carregar(d) { const im = new Image(); im.src = d; await new Promise(r => { im.complete ? r() : (im.onload = r, im.onerror = r); }); return im; }
    function analisar(im) {
      const w = im.naturalWidth, h = im.naturalHeight;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      const px = g.getImageData(0, 0, w, h).data;
      const col = new Array(w).fill(0); let minY = h, maxY = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
        if (px[(y * w + x) * 4 + 3] > 24) { col[x]++; if (y < minY) minY = y; if (y > maxY) maxY = y; }
      return { im, w, h, col, minY, maxY, px };
    }
    function cabeca(a, x0, x1) {
      const alt = a.maxY - a.minY + 1, ate = a.minY + Math.max(2, Math.round(alt * 0.12));
      let ca = 1e9, cb = -1;
      for (let y = a.minY; y <= ate; y++) for (let x = x0; x < x1; x++)
        if (a.px[(y * a.w + x) * 4 + 3] > 24) { if (x < ca) ca = x; if (x > cb) cb = x; }
      return cb < 0 ? null : (ca + cb) / 2;
    }
    const md = arr => { const s = arr.slice().sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };

    const res = { fileiras: {}, alvos: [], tiras: [] };
    const porFileira = {};
    for (let fi = 0; fi < folha.length; fi++) {
      porFileira[fi] = [];
      const off = [], larg = [];
      for (let qi = 0; qi < folha[fi].length; qi++) {
        const id = 'f' + fi + 'q' + qi;
        const im = await carregar(folha[fi][qi]);
        if (im.naturalWidth <= 1) { porFileira[fi].push({ id, vazio: true }); continue; }
        const a = analisar(im); const hc = cabeca(a, 0, a.w);
        porFileira[fi].push({ id, a, hc, dobrada: ids.indexOf(id) >= 0 });
        if (ids.indexOf(id) < 0) { off.push(hc - a.w / 2); larg.push(a.w); }
      }
      res.fileiras[fi] = { n: off.length, T: md(off), largMed: md(larg), min: Math.min(...off), max: Math.max(...off) };
    }

    // ---- receita por metade ----
    const receitas = {};
    for (const id of ids) {
      const mm = id.match(/^f(\d+)q(\d+)$/); const fi = +mm[1];
      const item = porFileira[fi].find(p => p.id === id); const a = item.a;
      const lim = Math.max(1, Math.floor(a.h * 0.02));
      const de = a.col.findIndex(v => v > lim), ate = a.col.length - 1 - a.col.slice().reverse().findIndex(v => v > lim);
      let melhor = 0, ini = 0, atual = 0;
      for (let x = de; x <= ate; x++) { if (a.col[x] <= lim) { atual++; if (atual > melhor) { melhor = atual; ini = x - atual + 1; } } else atual = 0; }
      const vFim = ini + melhor - 1, meio = Math.round(ini + melhor / 2);
      let aAte = de; for (let x = de; x < ini; x++) if (a.col[x] > lim) aAte = x;
      let bDe = -1; for (let x = vFim + 1; x <= ate; x++) if (a.col[x] > lim) { bDe = x; break; }
      const T = res.fileiras[fi].T;
      const partes = [
        { lado: 'A', i0: de, i1: aAte, hc: cabeca(a, 0, meio) },
        { lado: 'B', i0: bDe, i1: ate, hc: cabeca(a, meio, a.w) }
      ].map(p => {
        const C = p.hc - T;                        // centro que a celula precisa ter
        const HW = Math.ceil(Math.max(C - p.i0, p.i1 - C)) + 1;
        const x0 = Math.round(C - HW), x1 = Math.round(C + HW);
        return Object.assign(p, { C, x0, x1, larg: x1 - x0,
          padEsq: Math.max(0, -x0), padDir: Math.max(0, x1 - a.w),
          offFinal: +(p.hc - (x0 + x1) / 2).toFixed(2) });
      });
      receitas[id] = { fi, w: a.w, h: a.h, vao: [ini, vFim], meio, T, partes,
        escala: +(ALVOH / a.h).toFixed(4) };
      res.alvos.push(Object.assign({ id }, receitas[id]));
    }

    // ---- prova visual: a fileira inteira, cada quadro centrado como o jogo centra ----
    for (const fi of Object.keys(porFileira)) {
      const quadros = [];
      for (const p of porFileira[fi]) {
        if (p.vazio) continue;
        if (!p.dobrada) { quadros.push({ id: p.id, im: p.a.im, sx: 0, sw: p.a.w }); continue; }
        const r = receitas[p.id];
        for (const q of r.partes) quadros.push({ id: p.id + q.lado, im: p.a.im, sx: q.x0, sw: q.larg, novo: true });
      }
      if (!quadros.some(q => q.novo)) continue;
      const CEL = 200, H = 300, PADT = 24;
      const c = document.createElement('canvas'); c.width = quadros.length * CEL; c.height = H + PADT + 18;
      const g = c.getContext('2d');
      for (let y = 0; y < c.height; y += 16) for (let x = 0; x < c.width; x += 16)
        { g.fillStyle = (((x / 16) + (y / 16)) % 2 === 0) ? '#33333b' : '#26262c'; g.fillRect(x, y, 16, 16); }
      g.font = 'bold 12px monospace'; g.textBaseline = 'top';
      quadros.forEach((q, i) => {
        const sc = (H - 20) / q.im.naturalHeight;             // mesma regra do jogo: escala pela ALTURA
        const dw = Math.round(q.sw * sc), dh = Math.round(q.im.naturalHeight * sc);
        const cxm = i * CEL + CEL / 2;
        const dx = Math.round(cxm - dw / 2), dy = PADT + (H - 20) - dh + 10;
        g.save(); g.beginPath(); g.rect(i * CEL, 0, CEL, c.height); g.clip();
        g.imageSmoothingEnabled = true;
        g.drawImage(q.im, q.sx, 0, q.sw, q.im.naturalHeight, dx, dy, dw, dh);
        g.restore();
        g.strokeStyle = 'rgba(255,255,255,.15)'; g.strokeRect(i * CEL + .5, .5, CEL - 1, c.height - 1);
        g.fillStyle = q.novo ? '#7dff9b' : '#ffe9a8';
        g.fillText(q.id, i * CEL + 6, PADT + H - 12);
      });
      // linha do ponto canonico da cabeca, ja em coordenadas de tela
      const T = res.fileiras[fi].T;
      quadros.forEach((q, i) => {
        const sc = (H - 20) / q.im.naturalHeight;
        const cxm = i * CEL + CEL / 2;
        const xc = cxm + T * sc;
        g.strokeStyle = 'rgba(255,90,90,.85)'; g.lineWidth = 1; g.setLineDash([4, 4]);
        g.beginPath(); g.moveTo(xc, PADT); g.lineTo(xc, PADT + H - 24); g.stroke(); g.setLineDash([]);
      });
      res.tiras.push({ fi, png: c.toDataURL('image/png'), n: quadros.length });
    }
    return res;
  }, { cap: CAP, ids: IDS });

  for (const fi of Object.keys(out.fileiras)) {
    const F = out.fileiras[fi];
    console.log(`[${CAP}] fileira ${fi}: irmas n=${F.n}  larg mediana ${F.largMed}  cabeca T=${F.T}  faixa ${F.min}..${F.max} (amplitude ${(F.max - F.min).toFixed(1)})`);
  }
  for (const t of out.alvos) {
    console.log(`\n=== ${CAP} ${t.id}  fonte ${t.w}x${t.h}   1px de fonte = ${t.escala} px de mundo`);
    console.log(`  vao [${t.vao[0]}..${t.vao[1]}]  meio ${t.meio}   T da fileira = ${t.T}`);
    for (const p of t.partes)
      console.log(`  metade ${p.lado}: tinta ${p.i0}..${p.i1}  cabeca ${p.hc}  ->  RECORTE x [${p.x0} .. ${p.x1})  largura ${p.larg}` +
        (p.padEsq ? `  (+${p.padEsq}px transparente a ESQUERDA)` : '') +
        (p.padDir ? `  (+${p.padDir}px transparente a DIREITA)` : '') +
        `   cabeca final off ${p.offFinal} (alvo ${t.T})`);
  }
  for (const t of out.tiras) {
    const f = path.join(__dirname, 'CORTE-' + CAP + '-f' + t.fi + '.png');
    fs.writeFileSync(f, Buffer.from(t.png.split(',')[1], 'base64'));
    console.log('\n  tira da fileira ' + t.fi + ' (' + t.n + ' quadros) -> ' + path.basename(f));
  }
  await nav.close();
})().catch(e => { console.error(e); process.exit(1); });
