// VARRE TODAS AS FOLHAS DE GENTE atras de duas
// familias de defeito de CELULA, as duas invisiveis no codigo e visiveis na rua:
//
//  (1) CELULA DOBRADA — duas poses numa celula so (corredor interno de colunas vazias).
//  (2) CELULA INCHADA — a caixa de alfa>24 e muito maior que a de alfa>64: um punhado de
//      pixels quase invisiveis estica a celula. Como o jogo escala por sc = GENTE4_ALVO /
//      naturalHeight e alinha por dy = GROUND - dh (src/jogo.ts:6393-6396), esticar a celula
//      ENCOLHE a pessoa e a faz FLUTUAR acima do chao naquele quadro.
//
// Escrito pela direcao de arte em 05/09. Diagnostico, nao portao: nao entra no npm test.
// USO: node test/arte-varre-celulas-gente.js
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');
const { ehRuidoDeRedeExterna } = require('./rede-externa.js');
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));

(async function () {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const page = await nav.newPage({ viewport: { width: 900, height: 700 } });
  page.on('console', m => { if (m.type() === 'error' && !ehRuidoDeRedeExterna(m)) console.log('C ' + m.text()); });
  await page.goto(ALVO, { waitUntil: 'load' });
  await page.waitForFunction('typeof GENTE_EP_B64 !== "undefined" && typeof garantirEpoca === "function"', { timeout: 30000 });
  const caps = await page.evaluate(() => Object.keys(GENTE_EP_B64));
  const achados = [];
  for (const cap of caps) {
    await page.evaluate((c) => {
      const ep = EPOCAS.findIndex(e => e.id === c); if (ep < 0) return;
      let cen = -1; for (let n = 0; n < TOTAL_CENAS; n++) if (epocaDoCenario(n) === ep) { cen = n; break; }
      if (cen < 0) return;
      S.cenario = cen; S.fronteira = Math.max(S.fronteira, cen);
      if (typeof visitando !== 'undefined') visitando = false; garantirEpoca(ep);
    }, cap);
    await page.waitForTimeout(400);
    const r = await page.evaluate(async (c) => {
      const folha = GENTE_EP_B64[c]; const out = [];
      const ALVOH = (typeof GENTE4_ALVO !== 'undefined') ? GENTE4_ALVO : 42;
      for (let fi = 0; fi < folha.length; fi++) for (let qi = 0; qi < folha[fi].length; qi++) {
        const im = new Image(); im.src = folha[fi][qi];
        await new Promise(res => { im.complete ? res() : (im.onload = res, im.onerror = res); });
        if (im.naturalWidth <= 1) { out.push({ id: 'f' + fi + 'q' + qi, espera: true }); continue; }
        const w = im.naturalWidth, h = im.naturalHeight;
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
        const px = g.getImageData(0, 0, w, h).data;
        const col = new Array(w).fill(0);
        let y0 = h, y1 = -1, y0f = h, y1f = -1, x0f = w, x1f = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const A = px[(y * w + x) * 4 + 3];
          if (A > 24) { col[x]++; if (y < y0) y0 = y; if (y > y1) y1 = y; }
          if (A > 64) { if (y < y0f) y0f = y; if (y > y1f) y1f = y; if (x < x0f) x0f = x; if (x > x1f) x1f = x; }
        }
        const lim = Math.max(1, Math.floor(h * 0.02));
        const de = col.findIndex(v => v > lim), ate = col.length - 1 - col.slice().reverse().findIndex(v => v > lim);
        let vao = 0, ini = 0, at = 0;
        for (let x = de; x <= ate; x++) { if (col[x] <= lim) { at++; if (at > vao) { vao = at; ini = x - at + 1; } } else at = 0; }
        const sc = ALVOH / h;
        out.push({ id: 'f' + fi + 'q' + qi, w, h, vao, vaoIni: ini,
          altFirme: y1f - y0f + 1, largFirme: x1f - x0f + 1,
          folgaBaixo: h - 1 - y1f, folgaCima: y0f,
          flutua: +((h - 1 - y1f) * sc).toFixed(2), encolhe: +(((h / (y1f - y0f + 1)) - 1) * 100).toFixed(1) });
      }
      return out;
    }, cap);
    for (const q of r) {
      if (q.espera) { achados.push({ cap, ...q }); continue; }
      if (q.vao >= 8) achados.push({ cap, tipo: 'DOBRADA', ...q });
      else if (q.flutua >= 1 || q.encolhe >= 4) achados.push({ cap, tipo: 'INCHADA', ...q });
    }
  }
  console.log('DEFEITOS DE CELULA NAS FOLHAS DE GENTE (' + caps.length + ' capitulos)\n');
  let d = 0, i = 0, e = 0;
  for (const a of achados) {
    if (a.espera) { e++; console.log('  ' + (a.cap + ' ' + a.id).padEnd(24) + 'PIXEL DE ESPERA 1x1 (quadro vazio na fonte)'); continue; }
    if (a.tipo === 'DOBRADA') { d++; console.log('  ' + (a.cap + ' ' + a.id).padEnd(24) + 'DOBRADA  ' + a.w + 'x' + a.h + '  vao de ' + a.vao + ' px em x=' + a.vaoIni); }
    else { i++; console.log('  ' + (a.cap + ' ' + a.id).padEnd(24) + 'INCHADA  celula ' + a.w + 'x' + a.h + '  figura firme ' + a.largFirme + 'x' + a.altFirme +
      '  -> encolhe ' + a.encolhe + '%  e flutua ' + a.flutua + ' px de mundo (folga embaixo ' + a.folgaBaixo + ' px de fonte)'); }
  }
  console.log('\n  dobradas: ' + d + '   inchadas: ' + i + '   quadros vazios: ' + e);
  await nav.close();
})().catch(er => { console.error(er); process.exit(1); });
