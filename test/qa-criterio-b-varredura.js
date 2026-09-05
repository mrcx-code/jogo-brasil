// QA — CRITÉRIO (b) NUMA VARREDURA DE CICLO INTEIRO, e a fração de tempo que a costura fica
// na tela. Os dois números que a remedição de 05/09 AFIRMOU no backlog e que NENHUM arquivo
// deste repositório calculava.
//
//   node test/qa-criterio-b-varredura.js [pint] [amostras]     (padrão 2, 64)
//
// POR QUE ISTO EXISTE. O item de PALMARES tem três critérios de aceite. O (a) — simetria no
// eixo — tem régua committada (`qa-eixo-terceira-regua.js`, que já varre o ciclo). O (b) —
// "coluna mais dura de |dI/dx| sobre a costura <= 1,3x a mediana das colunas da própria
// pintura" — NÃO tinha, e o (c) manda que os dois valham numa VARREDURA, não num worldX só.
// O número de 04/09 ("2,17x sobe para 2,47x") é de um ponto. A remedição de 05/09 relatou
// 4,09x e 6,63x de varredura sem deixar o instrumento que os produziu. Este é o instrumento.
//
// COMO MEDE. Para cada amostra de worldX ao longo de um ciclo: renderiza, tira |dI/dx| da
// luma linha a linha na faixa da PEÇA DE CIMA, e reduz cada coluna à média do módulo. A
// mediana de TODAS as colunas é o piso da pintura. A dureza da costura é o máximo, sobre as
// costuras visíveis, da coluna daquela costura — e o veredito é o PIOR (maior) valor ao longo
// da varredura inteira, porque um corte que só aparece em 1 de 64 quadros continua sendo um
// corte que a pessoa vê.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const PINT = parseInt(process.argv[2] || '2', 10);
const AMOSTRAS = parseInt(process.argv[3] || '64', 10);
const LIMITE = 1.3;

(async () => {
  const url = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true,
  });
  const erros = [];
  pg.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
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

  const r = await pg.evaluate(({ pint, amostras }) => {
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

    // |dI/dx| médio por coluna
    function colunas() {
      const d = fx.getImageData(0, y0, g.cw, alt).data;
      const C = new Float64Array(g.cw);
      for (let y = 0; y < alt; y++) {
        let ant = 0;
        for (let x = 0; x < g.cw; x++) {
          const p = ((y * g.cw) + x) * 4;
          const L = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
          if (x > 0) C[x] += Math.abs(L - ant);
          ant = L;
        }
      }
      for (let x = 0; x < g.cw; x++) C[x] /= alt;
      return C;
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
      let pior = 0, piorWx = -1, naTela = 0;
      const razoes = [];
      for (let i = 0; i < amostras; i++) {
        const wx = ciclo * i / amostras;
        worldX = wx; redesenharFundo();
        const C = colunas();
        const ord = Array.from(C).slice(1).sort((a, b) => a - b);
        const med = ord[ord.length >> 1] || 1e-9;
        const ex = eixos(wx);
        if (ex.length) naTela++;
        let dura = 0;
        for (const x of ex) {
          // a costura pode cair entre pixels: pega a coluna mais dura numa vizinhança de +-2
          const xi = Math.round(x);
          for (let t = -2; t <= 2; t++) {
            const xx = xi + t;
            if (xx > 0 && xx < g.cw && C[xx] > dura) dura = C[xx];
          }
        }
        if (ex.length) {
          const raz = dura / med;
          razoes.push(raz);
          if (raz > pior) { pior = raz; piorWx = wx; }
        }
      }
      razoes.sort((a, b) => a - b);
      return {
        pior: +pior.toFixed(3), piorWx: Math.round(piorWx),
        mediana: +(razoes[razoes.length >> 1] || 0).toFixed(3),
        p90: +(razoes[Math.floor(razoes.length * 0.9)] || 0).toFixed(3),
        naTela: +(100 * naTela / amostras).toFixed(1), n: razoes.length,
      };
    }
    const orig = rep[0];
    const A = varrer();
    window.setRepeticao(pint, false);
    const B = varrer();
    window.setRepeticao(pint, orig);
    fundoAtivo = -1; worldX = 0; redesenharFundo();
    return { pint, espelha: orig, A, B, ciclo: +ciclo.toFixed(1),
      cw: g.cw, tw: +tw.toFixed(1), fracCwTw: +(100 * Math.min(1, g.cw / tw)).toFixed(1) };
  }, { pint: PINT, amostras: AMOSTRAS });

  console.log('=== CRITÉRIO (b) NA VARREDURA · pint ' + r.pint + ' · ' + AMOSTRAS + ' amostras de '
    + 'um ciclo (' + r.ciclo + ' px de mundo) ===');
  console.log('  limite do aceite: ' + LIMITE + 'x a mediana das colunas da própria pintura');
  console.log('');
  for (const k of ['A', 'B']) {
    const e = r[k];
    console.log('  ' + (k === 'A' ? 'A como está (espelho)' : 'B sem espelho        ')
      + '  PIOR ' + String(e.pior).padStart(6) + 'x'
      + '   mediana ' + String(e.mediana).padStart(6) + 'x'
      + '   p90 ' + String(e.p90).padStart(6) + 'x'
      + '   ' + (e.pior <= LIMITE ? 'PASSA' : 'REPROVA (' + (e.pior / LIMITE).toFixed(1) + 'x o limite)'));
  }
  console.log('');
  console.log('  FRAÇÃO DO CICLO COM COSTURA NA TELA: ' + r.A.naTela + '% (varredura, estado A) · '
    + r.B.naTela + '% (estado B)');
  console.log('  conferência independente pela geometria (cw/tw = ' + r.cw + '/' + r.tw + '): '
    + r.fracCwTw + '%');
  console.log('');
  if (erros.length) { console.log('ERROS:'); erros.forEach(e => console.log('  ' + e)); }
  await nav.close();
  process.exit(0);
})();
