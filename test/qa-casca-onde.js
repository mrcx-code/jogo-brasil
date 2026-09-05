// ONDE ESTÃO OS PIXELS DE "CASCA" — a aferição que a remedição não fez.
const { chromium } = require('playwright');
const path = require('path');
const RAIZ = 'C:/Users/User/Downloads/jogo-brasil/.claude/worktrees/agent-ab362375450b10100';
const ABRIR = require(path.join(RAIZ, 'test/abrir.js'));
(async () => {
  const url = ABRIR('file://' + path.join(RAIZ, 'index.html'));
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await pg.goto(url);
  await pg.waitForFunction(() => typeof S !== 'undefined' && !!window.geoFundo && !!window.geoFundo(), null, { timeout: 30000 });
  await pg.evaluate(async () => {
    if (typeof fecharTelas === 'function') fecharTelas();
    for (let e = 0; e < EPOCAS.length; e++) garantirEpoca(e);
    for (let t = 0; t < 800 && Object.keys(pacoteEstado).some(n => pacoteEstado[n] !== 'aqui'); t++) await new Promise(r => setTimeout(r, 25));
  });
  for (const pint of [2, 3, 6]) {
    const o = await pg.evaluate(({ pint }) => {
      fundoAtivo = pint; worldX = 0; redesenharFundo();
      const g = window.geoFundo(), dpr = window.devicePixelRatio || 2;
      const im = window.pecaExibida(pint, 'alto');
      const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false; cx.drawImage(im, 0, 0);
      const d = cx.getImageData(0, 0, w, h).data;
      const escalaCss = (g.dw / dpr) / w;
      const pedido = (Math.min(g.dy + g.dh * FUNDO_GROUND_SRC, g.dh * FUNDO_GROUND_SRC) / dpr) / escalaCss;
      const yCorte = h - Math.round(pedido);
      const ehCasca = (R, G, B) => R > G + 6 && G > B + 2;
      let cima = 0, baixo = 0, clara = 0, escura = 0, tot = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const p = (y * w + x) * 4; if (d[p + 3] < 128) continue; tot++;
        const R = d[p], G = d[p + 1], B = d[p + 2];
        if (!ehCasca(R, G, B)) continue;
        if (y < yCorte) cima++; else baixo++;
        if (0.299 * R + 0.587 * G + 0.114 * B >= 150) clara++; else escura++;
      }
      fundoAtivo = -1; worldX = 0; redesenharFundo();
      return { pint, w, h, yCorte, pedido: Math.round(pedido), tot, cima, baixo, clara, escura };
    }, { pint });
    const t = o.cima + o.baixo;
    console.log('pint ' + o.pint + ': peca ' + o.w + 'x' + o.h + ', faixa do tronco = y ' + o.yCorte + '..' + o.h + ' (' + o.pedido + ' px)');
    console.log('  casca TOTAL ' + t + ' px (' + (100 * t / o.tot).toFixed(2) + '% da peca)');
    console.log('  DENTRO da faixa do tronco: ' + o.baixo + ' px (' + (100 * o.baixo / Math.max(1, t)).toFixed(2) + '% de toda a casca)');
    console.log('  ACIMA dela (ceu/nuvem):    ' + o.cima + ' px (' + (100 * o.cima / Math.max(1, t)).toFixed(2) + '%)');
    console.log('  luma>=150 (creme/nuvem): ' + o.clara + ' px (' + (100 * o.clara / Math.max(1, t)).toFixed(2) + '%) | escura (madeira): ' + o.escura + ' px (' + (100 * o.escura / Math.max(1, t)).toFixed(2) + '%)');
  }
  await nav.close(); process.exit(0);
})();
