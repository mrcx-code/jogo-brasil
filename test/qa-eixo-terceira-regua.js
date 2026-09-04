// QA — TERCEIRA RÉGUA PARA O EIXO DE SIMETRIA, para tentar DESMENTIR as duas primeiras.
//
//   node test/qa-eixo-terceira-regua.js [pintura]
//
// A alegação sob ataque: `test/medir-eixo-palmares.js` trocou "luma crua" por "luma menos a
// média da linha" e o piso de ruído caiu de 53,3% para ~16% (pint. 2). A defesa dele é que a
// média da linha é o componente CONSTANTE AO LONGO DE x — o céu com degradê vertical —, e que
// tirá-lo deixa só a estrutura horizontal, que é a que o espelho duplica.
//
// Se isso é verdade, uma régua que NUNCA veja o componente vertical tem de chegar ao mesmo
// veredito SEM precisar do truque. A derivada horizontal é essa régua: D[x] = L[x] − L[x−1]
// zera qualquer coisa que só varie em y, então o céu some por construção, não por subtração.
//
// E ela lê o espelho de forma DIFERENTE, o que é o ponto de ser independente: numa reflexão
// L(x0+t) = L(x0−t), a derivada é ANTISSIMÉTRICA — D[x0+t] = −D[x0−t+1]. Então a régua
// correlaciona `−D[x0−t+1]` contra `D[x0+t]`. Um espelho dá +1; uma parede de imagens
// repetidas SEM espelho não dá, porque translação preserva o sinal da derivada em vez de
// invertê-lo.
//
// Concordar com a segunda régua é confirmação; discordar é achado.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const PINT = parseInt(process.argv[2] || '2', 10);
const RAIO = 40;
const AMOSTRAS = 64;

(async () => {
  const url = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true,
  });
  const erros = [];
  pg.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
  await pg.goto(url);
  await pg.waitForFunction(
    () => typeof S !== 'undefined' && !!window.geoFundo && !!window.geoFundo(), null, { timeout: 30000 });
  await pg.evaluate(async () => {
    if (typeof fecharTelas === 'function') fecharTelas();
    for (let e = 0; e < EPOCAS.length; e++) garantirEpoca(e);
    for (let t = 0; t < 800 && Object.keys(pacoteEstado).some(n => pacoteEstado[n] !== 'aqui'); t++) {
      await new Promise(r => setTimeout(r, 25));
    }
  });

  const r = await pg.evaluate(({ pint, raio, amostras }) => {
    fundoAtivo = pint; worldX = 0; redesenharFundo();
    const g = window.geoFundo();
    const rep = REPETICAO_PINT[pint];
    const fracao = rep[1] > 0 ? rep[1] : 1;
    const tw = g.dw, volta = tw * 2;
    const ciclo = volta / (fracao * (g.cw / W));
    const y0 = Math.max(0, Math.round(g.dy));
    const y1 = Math.min(g.ch, Math.round(g.dy + g.dh * FUNDO_GROUND_SRC));
    const alt = Math.max(1, y1 - y0);
    const fx = document.getElementById('fundoHD').getContext('2d');

    // A DERIVADA HORIZONTAL DA LUMA — sem tirar média de nada. O que só varia em y morre aqui.
    function deriv() {
      const d = fx.getImageData(0, y0, g.cw, alt).data;
      const D = new Float64Array(g.cw * alt);
      for (let y = 0; y < alt; y++) {
        let ant = 0;
        for (let x = 0; x < g.cw; x++) {
          const p = ((y * g.cw) + x) * 4;
          const L = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
          D[y * g.cw + x] = x === 0 ? 0 : L - ant;
          ant = L;
        }
      }
      return D;
    }
    // Pearson entre -D[x0-t+1] (esquerda, sinal virado) e D[x0+t] (direita).
    function simetriaDeriv(D, x0) {
      if (x0 - raio < 1 || x0 + raio >= g.cw) return null;
      let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, n = 0;
      for (let t = 1; t <= raio; t++) {
        for (let y = 0; y < alt; y++) {
          const a = -D[y * g.cw + (x0 - t + 1)], b = D[y * g.cw + (x0 + t)];
          sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b; n++;
        }
      }
      const va = saa - sa * sa / n, vb = sbb - sb * sb / n;
      if (va <= 1e-9 || vb <= 1e-9) return null;
      return (sab - sa * sb / n) / Math.sqrt(va * vb);
    }
    function eixos(wx) {
      const desl = ((wx * fracao * (g.cw / W)) % volta + volta) % volta;
      const out = [];
      for (let k = Math.floor(desl / tw) - 1; k * tw - desl <= g.cw + tw; k++) {
        const x = k * tw - desl;
        if (x >= 0 && x <= g.cw) out.push(x);
      }
      return out;
    }
    function varrer() {
      let maxEixo = -2; const piso = [];
      for (let i = 0; i < amostras; i++) {
        const wx = ciclo * i / amostras;
        worldX = wx; redesenharFundo();
        const D = deriv();
        const ex = eixos(wx);
        for (const x of ex) {
          const s = simetriaDeriv(D, Math.round(x));
          if (s !== null && s > maxEixo) maxEixo = s;
        }
        for (let j = 0; j < 6; j++) {
          const x = Math.round(raio + 1
            + (((i * 7919 + j * 104729) % 1000) / 1000) * (g.cw - 2 * raio - 2));
          if (ex.some(e => Math.abs(e - x) < 2 * raio)) continue;
          const s = simetriaDeriv(D, x);
          if (s !== null) piso.push(s);
        }
      }
      piso.sort((a, b) => a - b);
      return {
        eixo: +(maxEixo).toFixed(4),
        pisoMed: +(piso[piso.length >> 1]).toFixed(4),
        pisoP90: +(piso[Math.floor(piso.length * 0.9)]).toFixed(4),
        pisoMax: +(piso[piso.length - 1]).toFixed(4), n: piso.length,
      };
    }
    const orig = rep[0];
    const A = varrer();
    window.setRepeticao(pint, false);
    const B = varrer();
    window.setRepeticao(pint, orig);
    fundoAtivo = -1; worldX = 0; redesenharFundo();
    return { pint, espelha: orig, A, B };
  }, { pint: PINT, raio: RAIO, amostras: AMOSTRAS });

  console.log('=== TERCEIRA RÉGUA (derivada horizontal, SEM tirar média de linha) · pint '
    + r.pint + ' ===');
  for (const k of ['A', 'B']) {
    const e = r[k];
    console.log('  ' + (k === 'A' ? 'A como está (espelho) ' : 'B sem espelho        ')
      + ' simetria no eixo ' + (e.eixo * 100).toFixed(1) + '%'
      + '   piso: mediana ' + (e.pisoMed * 100).toFixed(1) + '%'
      + ' p90 ' + (e.pisoP90 * 100).toFixed(1) + '%'
      + ' max ' + (e.pisoMax * 100).toFixed(1) + '%  (n=' + e.n + ')');
  }
  if (erros.length) { console.log('ERROS:'); erros.forEach(e => console.log('  ' + e)); }
  await nav.close();
  process.exit(0);
})();
