// MEDIR ASSENTO — a distancia da BASE OPACA de cada sprite ate a linha do chao (GROUND),
// em px de MUNDO, capitulo por capitulo. Nao le formula nenhuma: espiona todo drawImage das
// duas camadas (#scene, em px de mundo, e #heroHD, em px de aparelho) e mede onde a tinta
// do sprite realmente ACABA — que e o que o olho ve, e nao onde o retangulo do quadro cai.
//
//   gap > 0  => a coisa esta no ar (px de mundo; 1 px de mundo ~ 2,17 px de tela a 390x844)
//   gap = 0  => assentada
//   gap < 0  => enterrada
//
// node test/medir-assento.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const CENAS = [
  { cena: 0, nome: 'cap1 PINDORAMA' },
  { cena: 2, nome: 'cap2 PALMARES' },
  { cena: 4, nome: 'cap3 SALVADOR' },
  { cena: 5, nome: 'cap4 AINDA AQUI' }
];

const ESPIAO = () => {
  // base opaca de uma imagem/canvas, em linhas a partir do topo (cache por objeto)
  const cacheBase = new WeakMap();
  window.__baseOpaca = function (img) {
    if (cacheBase.has(img)) return cacheBase.get(img);
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    let r = { h: h, base: h };
    try {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, w, h).data;
      let base = 0;
      for (let y = h - 1; y >= 0; y--) {
        let achou = false;
        for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 16) { achou = true; break; }
        if (achou) { base = y + 1; break; }
      }
      r = { h: h, base: base };
    } catch (e) { }
    cacheBase.set(img, r);
    return r;
  };
  window.__fase = '';
  window.__visto = [];
  // NOME de cada imagem: percorre os acervos e batiza. Sem isso "66x132" e' oito plantas
  // diferentes somadas numa linha so, e a que voa se esconde na media.
  const nomes = new WeakMap();
  const batiza = function (arr, pref) {
    if (typeof arr === 'undefined' || !arr) return;
    arr.forEach(function (im, i) { if (im && !nomes.has(im)) nomes.set(im, pref + i); });
  };
  try { batiza(FRENTE_SPR, 'frente#'); } catch (e) { }
  try { for (const k in MOB_SPR) MOB_SPR[k].forEach(function (im, i) { if (im) nomes.set(im, 'mob.' + k + '@cap' + i); }); } catch (e) { }
  try { DROP_SPR.forEach(function (l, i) { l.forEach(function (im, j) { if (im) nomes.set(im, 'drop' + j + '@cap' + i); }); }); } catch (e) { }
  window.__idImg = function (img) {
    if (nomes.has(img)) return nomes.get(img);
    return (img.tagName === 'CANVAS' ? 'cv' : 'img') + ':' + (img.naturalWidth || img.width) + 'x' + (img.naturalHeight || img.height);
  };
  const P = CanvasRenderingContext2D.prototype;
  if (!P.__espiado) {
    const orig = P.drawImage;
    P.__espiado = true;
    P.drawImage = function (img) {
      if (window.__fase && arguments.length >= 5) {
        const a = arguments;
        let dy, dh;
        if (a.length === 5) { dy = a[2]; dh = a[4]; }
        else { dy = a[6]; dh = a[8]; }
        const b = window.__baseOpaca(img);
        const nat = (img.naturalHeight || img.height) || 1;
        const recorte = a.length === 9 ? a[7] : nat;
        const escala = dh / recorte;
        const baseDesenho = a.length === 9 ? dy + dh : dy + b.base * escala;
        // A TRANSFORMACAO CONTA. Quem desenha espelhado (desenharGenteHD, quem CHEGA) chama
        // drawImage com dy=0 dentro de um translate/scale — ler o argumento cru daria uma
        // levitacao inventada de 150 px. getTransform mapeia para o espaco do canvas.
        const t = this.getTransform();
        const mapY = function (y) { return t.f + t.d * y; };
        window.__visto.push({
          f: window.__fase, alvo: this.canvas.id || '?',
          dy: dy, dh: dh, nat: nat, base: b.base,
          fundo: mapY(dy + dh), tinta: mapY(baseDesenho), w: (img.naturalWidth || img.width),
          id: window.__idImg(img)
        });
      }
      return orig.apply(this, arguments);
    };
  }
  // fases: envolve as funcoes de desenho para saber QUEM desenhou
  const envolve = function (nome, rot) {
    const f = window[nome];
    if (typeof f !== 'function' || f.__env) return false;
    const g = function () {
      const ant = window.__fase; window.__fase = rot;
      try { return f.apply(this, arguments); } finally { window.__fase = ant; }
    };
    g.__env = true; window[nome] = g; return true;
  };
  return {
    drawMobs: envolve('drawMobs', 'mob'),
    genteHD: envolve('desenharGenteHD', 'gente'),
    frente: envolve('desenharFrente', 'frente'),
    heroi: envolve('desenharHeroiHD', 'heroi'),
    decor: envolve('decorBlit', 'decor'),
    mundo: envolve('desenharMundo', 'drop')
  };
};

(async () => {
  const file = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await page.goto(file);
  await page.waitForTimeout(1400);
  await page.evaluate(() => { if (typeof fecharTelas === 'function') fecharTelas(); if (typeof fecharTudo === 'function') fecharTudo(); });
  await page.waitForTimeout(200);
  const env = await page.evaluate(ESPIAO);
  console.log('envolvidas:', JSON.stringify(env));

  // ---- CENSO ESTATICO: quanto vazio cada folha de arte carrega EMBAIXO ----
  // Recorte em celulas iguais (CLAUDE.md §5) deixa sobra sob a mancha. Quem ancora pela
  // CAIXA e nao pela TINTA levita exatamente essa sobra.
  const censo = await page.evaluate(() => {
    const linha = function (nome, im) {
      if (!im || !im.complete || !im.naturalWidth) return null;
      const b = window.__baseOpaca(im);
      return { nome: nome, h: b.h, base: b.base, vazio: b.h - b.base, frac: (b.h - b.base) / b.h };
    };
    const out = [];
    try { FRENTE_SPR.forEach(function (im, i) { const l = linha('frente#' + i, im); if (l) out.push(l); }); } catch (e) { }
    try { for (const k in MOB_SPR) MOB_SPR[k].forEach(function (im, i) { const l = linha('mob.' + k + '@cap' + i, im); if (l) out.push(l); }); } catch (e) { }
    try { DROP_SPR.forEach(function (l2, i) { l2.forEach(function (im, j) { const l = linha('drop' + j + '@cap' + i, im); if (l) out.push(l); }); }); } catch (e) { }
    try {
      for (let c = 0; c < 4; c++) {
        const bl = (typeof HERO_SPR_CAP !== 'undefined' && HERO_SPR_CAP[c]) ? HERO_SPR_CAP[c] : null;
        if (bl && bl.walk) bl.walk.forEach(function (im, i) { const l = linha('heroi.walk' + i + '@cap' + c, im); if (l) out.push(l); });
      }
    } catch (e) { }
    return out;
  });
  console.log('\n=== CENSO DAS FOLHAS — vazio SOB a mancha, em linhas da fonte');
  const ruins = censo.filter(l => l.frac > 0.02);
  console.log('  ' + censo.length + ' quadros medidos, ' + ruins.length + ' com sobra > 2%');
  ruins.sort((a, b) => b.frac - a.frac).forEach(l => {
    console.log('  ' + l.nome.padEnd(22) + ' altura ' + String(l.h).padStart(4) +
      '  tinta acaba em ' + String(l.base).padStart(4) + '  vazio ' + String(l.vazio).padStart(4) +
      ' (' + (l.frac * 100).toFixed(1) + '%)');
  });

  for (const c of CENAS) {
    const r = await page.evaluate(async (cena) => {
      S.cenario = cena; S.modo = 'limpo'; S.energiaTotal = Math.max(S.energiaTotal, 1500 * cena + 10);
      if (typeof verificarCenario === 'function') { }
      mobs.length = 0; drops.length = 0; folhas.length = 0;
      proximoMob = 1e9; mobChao = 0;
      // uma de cada, parada, com o lugar de espera aceso
      ['smog', 'barrel', 'cash'].forEach(function (t, i) {
        const m = novoMob(t, worldX + 50 + i * 34);
        m.parado = true; m.espera = 1e9; m.hp = m.hpMax; mobs.push(m);
      });
      // um drop de cada
      ['smog', 'barrel', 'cash'].forEach(function (t, i) {
        drops.push({ wx: worldX + 20 + i * 24, t: 0, type: t, valor: 4 });
      });
      // uma folha em cada trilho
      folhas.push({ wx: worldX + 100, y: GROUND - 16, fase: 0 });
      folhas.push({ wx: worldX + 130, y: GROUND - 60, fase: 0 });
      proximaFolha = 1e9; folhaChao = 0;
      window.__visto.length = 0;
      await new Promise(res => setTimeout(res, 900));
      const hc = document.getElementById('heroHD');
      const ky = hc.height / H;
      const out = {};
      window.__visto.forEach(function (v) {
        const k = v.f + '|' + v.alvo + '|' + v.id;
        const esc = v.alvo === 'heroHD' ? ky : 1;
        const gapTinta = (GROUND * esc - v.tinta) / esc;
        const gapCaixa = (GROUND * esc - v.fundo) / esc;
        if (!out[k]) out[k] = { n: 0, tMin: 1e9, tMax: -1e9, cMin: 1e9, cMax: -1e9, base: v.base, nat: v.nat };
        const o = out[k];
        o.n++;
        o.tMin = Math.min(o.tMin, gapTinta); o.tMax = Math.max(o.tMax, gapTinta);
        o.cMin = Math.min(o.cMin, gapCaixa); o.cMax = Math.max(o.cMax, gapCaixa);
      });
      return { out: out, GROUND: GROUND, W: W, H: H, ky: ky, epoca: epocaAtual(), capArte: capArte() };
    }, c.cena);
    console.log('\n=== ' + c.nome + '  (cena ' + c.cena + ', epoca ' + r.epoca + ', arte ' + r.capArte + ', GROUND ' + r.GROUND + ')');
    const chaves = Object.keys(r.out).sort();
    if (!chaves.length) console.log('  (nada desenhado)');
    chaves.forEach(function (k) {
      const o = r.out[k];
      const f = function (x) { return (Math.round(x * 100) / 100).toFixed(2); };
      console.log('  ' + k.padEnd(34) +
        ' n=' + String(o.n).padStart(4) +
        '  gap TINTA ' + f(o.tMin).padStart(7) + ' .. ' + f(o.tMax).padStart(7) +
        '  | caixa ' + f(o.cMin).padStart(7) + ' .. ' + f(o.cMax).padStart(7) +
        '  | base ' + o.base + '/' + o.nat);
    });
  }
  await browser.close();
})();
