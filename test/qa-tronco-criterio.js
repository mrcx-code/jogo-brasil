// QA — O CRITÉRIO `G > B` DO `medir-tronco-palmares.js` AGUENTA SER ATACADO?
//
//   node test/qa-tronco-criterio.js [pintura]
//
// A alegação sob ataque: "a melhor faixa de 33 px cobre só 61,4% (pint. 2) / 52,7% (pint. 3) da
// altura exigida, logo a pintura não rende o tronco". Ela depende inteiramente de um teste de
// um pixel: `G > B` = mata, senão céu.
//
// DOIS MODOS DE FALHA, e eles puxam para lados opostos:
//   FALSO POSITIVO  — grama rala, barranco esverdeado, água esverdeada contam como "tronco".
//                     Isso INFLA a altura medida, então só pode fazer a pintura parecer MELHOR
//                     do que é. Um veredito de reprovação sobrevive a ele por construção.
//   FALSO NEGATIVO  — tronco em sombra azulada, ou borda de tronco misturada com o céu, tem
//                     B ≥ G e QUEBRA a corrida cedo. Esse sim derrubaria a conclusão: um tronco
//                     de verdade medido curto.
//
// Então o ataque útil é o segundo, e o jeito de fazê-lo é AFROUXAR o critério em favor da
// pintura: `G > B − tol`. Se com tolerância generosa a faixa continuar abaixo do pedido, a
// conclusão não depende do critério. Mede-se também a contagem de colunas que MUDAM de classe,
// para saber se a tolerância está fazendo alguma coisa ou só passeando.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const PINT = parseInt(process.argv[2] || '2', 10);

(async () => {
  const url = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true,
  });
  await pg.goto(url);
  await pg.waitForFunction(() => typeof S !== 'undefined' && !!window.geoFundo && !!window.geoFundo(),
    null, { timeout: 30000 });
  await pg.evaluate(async () => {
    if (typeof fecharTelas === 'function') fecharTelas();
    for (let e = 0; e < EPOCAS.length; e++) garantirEpoca(e);
    for (let t = 0; t < 800 && Object.keys(pacoteEstado).some(n => pacoteEstado[n] !== 'aqui'); t++) {
      await new Promise(r => setTimeout(r, 25));
    }
  });

  const r = await pg.evaluate(({ pint }) => {
    fundoAtivo = pint; worldX = 0; redesenharFundo();
    const g = window.geoFundo();
    const dpr = window.devicePixelRatio || 2;
    const im = window.pecaExibida(pint, 'alto');
    const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
    cx.drawImage(im, 0, 0);
    const d = cx.getImageData(0, 0, w, h).data;
    const escalaCss = (g.dw / dpr) / w;
    const pedidoFonte = (Math.min(g.dy + g.dh * FUNDO_GROUND_SRC, g.dh * FUNDO_GROUND_SRC) / dpr)
      / escalaCss;
    const largFonte = Math.round(28 / escalaCss);

    function corridas(ok) {
      const c = new Int32Array(w);
      for (let x = 0; x < w; x++) {
        let n = 0;
        for (let y = h - 1; y >= 0; y--) {
          const p = (y * w + x) * 4;
          if (d[p + 3] < 128) break;
          if (ok(d[p], d[p + 1], d[p + 2])) n++; else break;
        }
        c[x] = n;
      }
      return c;
    }
    function melhorJanela(c, L) {
      let melhor = -1, ondeX = -1;
      for (let x = 0; x + L <= w; x++) {
        let m = Infinity;
        for (let k = 0; k < L; k++) if (c[x + k] < m) m = c[x + k];
        if (m > melhor) { melhor = m; ondeX = x; }
      }
      return { alt: melhor, x: ondeX };
    }
    const linhas = [];
    // tolerância crescente: quanto mais alta, mais generosa com a pintura
    for (const tol of [0, 10, 20, 40, 80]) {
      const c = corridas((R, G, B) => G > B - tol);
      const j = melhorJanela(c, largFonte);
      let maxc = 0; for (let x = 0; x < w; x++) if (c[x] > maxc) maxc = c[x];
      linhas.push({ nome: 'G > B - ' + tol, alt: j.alt, x: j.x, maxCol: maxc,
        pct: +(100 * j.alt / pedidoFonte).toFixed(1) });
    }
    // critério totalmente diferente: "não é céu" = pixel escuro OU saturado (o céu é claro e
    // dessaturado-azulado). Nada a ver com G/B.
    {
      const c = corridas((R, G, B) => {
        const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
        const lum = 0.299 * R + 0.587 * G + 0.114 * B;
        return lum < 150 || (mx - mn) > 40;
      });
      const j = melhorJanela(c, largFonte);
      let maxc = 0; for (let x = 0; x < w; x++) if (c[x] > maxc) maxc = c[x];
      linhas.push({ nome: 'nao-ceu (escuro OU saturado)', alt: j.alt, x: j.x, maxCol: maxc,
        pct: +(100 * j.alt / pedidoFonte).toFixed(1) });
    }
    // TETO ABSOLUTO: qualquer pixel opaco conta. Nenhum critério de cor pode passar disto.
    {
      const c = corridas(() => true);
      const j = melhorJanela(c, largFonte);
      linhas.push({ nome: 'TETO: qualquer pixel opaco', alt: j.alt, x: j.x, maxCol: h,
        pct: +(100 * j.alt / pedidoFonte).toFixed(1) });
    }
    fundoAtivo = -1; worldX = 0; redesenharFundo();
    return { pint, w, h, pedidoFonte: +pedidoFonte.toFixed(1), largFonte, linhas };
  }, { pint: PINT });

  console.log('=== QA CRITÉRIO DO TRONCO · pint ' + r.pint + ' · peça ' + r.w + 'x' + r.h + ' ===');
  console.log('  pedido: faixa de ' + r.largFonte + ' px de largura x ' + r.pedidoFonte
    + ' px de altura');
  for (const l of r.linhas) {
    console.log('  ' + l.nome.padEnd(30) + ' melhor faixa ' + String(l.alt).padStart(4)
      + ' px = ' + String(l.pct).padStart(5) + '% do pedido   (x=' + l.x
      + ', coluna isolada mais alta ' + l.maxCol + ')');
  }
  await nav.close();
  process.exit(0);
})();
