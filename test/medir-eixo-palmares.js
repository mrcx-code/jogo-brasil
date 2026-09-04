// O EIXO DE SIMETRIA DA PEÇA DE CIMA — a régua do item `palmares-emenda-horizontal-rosto`.
//
//   node test/medir-eixo-palmares.js [pintura]      (padrão 2 — a primeira cena de PALMARES)
//
// POR QUE UM INSTRUMENTO NOVO. A rodada de 04/09 que achou o eixo mediu e NÃO versionou a
// régua: o commit 566cd04 guardou os dois prints (PAL-EIXO-A, PAL-EIXO-B) e o relatório, não o
// código. Sem régua versionada, o aceite do item ("contraste ≤ 20%", "≤ 1,3× a mediana") não
// tem como ser cobrado por comando por ninguém — nem por mim, nem pelo QA que vier depois.
// Então a régua nasce aqui, e ela se AFERE antes de julgar: mede o piso de ruído (colunas
// sorteadas longe de qualquer eixo) na mesma execução em que mede o eixo. Um número de simetria
// sem o piso ao lado não diz nada — 40% pode ser limpo ou sujo dependendo do que a pintura faz
// sozinha.
//
// AS TRÊS MEDIDAS
//
//   (0) A FRAÇÃO DO TEMPO com um eixo em quadro. É a dúvida que a arte pediu antes de investir:
//       se a costura mal aparece, uma coluna de altura inteira não se paga. Sai por dois
//       caminhos que têm de bater — a conta (cw/tw, porque os eixos são periódicos com passo
//       `tw` na tela) e a varredura (contar quantas amostras de um ciclo inteiro de worldX têm
//       pelo menos um eixo dentro de [0, cw]).
//
//   (a) CONTRASTE DE SIMETRIA no eixo: correlação de Pearson entre a luma à esquerda e a luma
//       espelhada à direita, numa faixa de ±R px de dispositivo, em TODA a altura da peça de
//       cima em quadro. 1,00 = reflexão exata. O piso de ruído é a MEDIANA da mesma correlação
//       em colunas sorteadas a mais de 2R de qualquer eixo.
//
//       ⚠ A MÉDIA DE CADA LINHA SAI ANTES, e isto não é refinamento — é o que faz a régua medir
//       alguma coisa. Na primeira versão o piso de ruído deu **53,3%**: metade de cima da
//       pintura é CÉU, e duas colunas quaisquer de céu têm o mesmo degradê vertical, então
//       correlacionam altíssimo em qualquer lugar. Com 53% de piso, um eixo a 94% não prova
//       nada. Tirando a média da linha (`L[x,y] -= média_x da linha y`) sobra só a ESTRUTURA
//       horizontal — que é exatamente o que o espelho duplica e o que o olho lê como rosto.
//
//   (b) COLUNA MAIS DURA de |dI/dx| sobre a costura, em múltiplos da MEDIANA das colunas da
//       própria pintura em quadro. É a medida que reprova o corte nu: tirar o espelho troca o
//       rosto por uma linha vertical dura, e essa linha aparece aqui.
//
// POR QUE PELO CANVAS DESENHADO e não pelo arquivo da pintura: o que fabrica o rosto é o
// LADRILHO — a cópia espelhada encostada na original —, não a pintura. Medir a fonte mediria
// uma coisa que não existe na tela.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const PINT = parseInt(process.argv[2] || '2', 10);
const RAIO = 40;        // ±40 px de dispositivo = ±20 px CSS de cada lado do eixo
const AMOSTRAS = 64;    // quantos worldX num ciclo inteiro da pintura

(async () => {
  const url = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true,
  });
  const erros = [];
  pg.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
  pg.on('console', m => { if (m.type() === 'error') erros.push('CONSOLE: ' + m.text()); });
  await pg.goto(url);
  await pg.waitForFunction(
    () => typeof S !== 'undefined' && !!window.geoFundo && !!window.geoFundo(),
    null, { timeout: 30000 });

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
    const tw = g.dw;                 // a peça de cima ladrilha a largura inteira (ini/fim nulos)
    const volta = tw * 2;
    // um ciclo inteiro em worldX: `desl` varre [0, volta) a `fracao * cw / W` px por px de mundo
    const ciclo = volta / (fracao * (g.cw / W));

    const linha = FUNDO_GROUND_SRC;
    const y0 = Math.max(0, Math.round(g.dy));
    const y1 = Math.min(g.ch, Math.round(g.dy + g.dh * linha));
    const alt = Math.max(1, y1 - y0);
    const fc = document.getElementById('fundoHD');
    const fx = fc.getContext('2d');

    function luma(tirarMedia) {
      const d = fx.getImageData(0, y0, g.cw, alt).data;
      const L = new Float64Array(g.cw * alt);
      for (let i = 0, n = g.cw * alt; i < n; i++) {
        const p = i * 4;
        L[i] = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
      }
      if (tirarMedia) {
        for (let y = 0; y < alt; y++) {
          let s = 0;
          for (let x = 0; x < g.cw; x++) s += L[y * g.cw + x];
          const m = s / g.cw;
          for (let x = 0; x < g.cw; x++) L[y * g.cw + x] -= m;
        }
      }
      return L;
    }
    // Pearson entre a luma a x0-d e a luma a x0+d, d = 1..raio, sobre todas as linhas da faixa.
    function simetria(L, x0) {
      if (x0 - raio < 0 || x0 + raio >= g.cw) return null;
      let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, n = 0;
      for (let d = 1; d <= raio; d++) {
        for (let y = 0; y < alt; y++) {
          const a = L[y * g.cw + (x0 - d)], b = L[y * g.cw + (x0 + d)];
          sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b; n++;
        }
      }
      const va = saa - sa * sa / n, vb = sbb - sb * sb / n;
      if (va <= 1e-9 || vb <= 1e-9) return null;
      return (sab - sa * sb / n) / Math.sqrt(va * vb);
    }
    // |dI/dx| medio por coluna (diferença para a coluna à esquerda)
    function bordas(L) {
      const E = new Float64Array(g.cw);
      for (let x = 1; x < g.cw; x++) {
        let s = 0;
        for (let y = 0; y < alt; y++) s += Math.abs(L[y * g.cw + x] - L[y * g.cw + x - 1]);
        E[x] = s / alt;
      }
      E[0] = E[1];
      return E;
    }
    function mediana(arr) {
      const v = Array.prototype.slice.call(arr).sort((a, b) => a - b);
      return v[v.length >> 1];
    }
    // os eixos analíticos: x = k*tw - desl, para todo k, dentro de [0, cw]
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
      const linhas = [];
      let comEixo = 0; const pisoAmostras = [];
      for (let i = 0; i < amostras; i++) {
        const wx = ciclo * i / amostras;
        worldX = wx; redesenharFundo();
        const Le = luma(false);            // bruta: a dureza é de contraste real, não de estrutura
        const Ls = luma(true);             // sem a média da linha: só a estrutura horizontal
        const E = bordas(Le);
        const ex = eixos(wx);
        if (ex.length) comEixo++;
        // A MEDIANA EXCLUI a vizinhança dos eixos: incluir a coluna que se julga na régua que a
        // julga é deixar o defeito puxar a própria referência para cima.
        const limpas = [];
        for (let x = 0; x < g.cw; x++) {
          if (ex.some(e => Math.abs(e - x) <= 6)) continue;
          limpas.push(E[x]);
        }
        const med = mediana(limpas);
        const linhaOut = { wx: +wx.toFixed(1), frac: +(i / amostras).toFixed(3), eixos: [] };
        for (const x of ex) {
          const xi = Math.round(x);
          const s = simetria(Ls, xi);
          let dur = 0;
          for (let d = -3; d <= 3; d++) { const c = xi + d; if (c >= 0 && c < g.cw && E[c] > dur) dur = E[c]; }
          linhaOut.eixos.push({
            x: xi, xCss: +(xi / 2).toFixed(1),
            sim: s === null ? null : +s.toFixed(4),
            dur: +(dur / med).toFixed(3),
          });
        }
        // piso de ruído: 6 colunas sorteadas (determinístico) a mais de 2*raio de qualquer eixo
        for (let j = 0; j < 6; j++) {
          const x = Math.round(raio + 1
            + (((i * 7919 + j * 104729) % 1000) / 1000) * (g.cw - 2 * raio - 2));
          if (ex.some(e => Math.abs(e - x) < 2 * raio)) continue;
          const s = simetria(Ls, x);
          if (s !== null) pisoAmostras.push(s);
        }
        linhas.push(linhaOut);
      }
      pisoAmostras.sort((a, b) => a - b);
      let pior = { sim: -2, frac: 0, x: 0, wx: 0 }, piorDur = { dur: -1, frac: 0, x: 0, wx: 0 };
      for (const l of linhas) for (const e of l.eixos) {
        if (e.sim !== null && e.sim > pior.sim) pior = { sim: e.sim, frac: l.frac, x: e.xCss, wx: l.wx };
        if (e.dur > piorDur.dur) piorDur = { dur: e.dur, frac: l.frac, x: e.xCss, wx: l.wx };
      }
      return {
        fracaoVarrida: +(comEixo / amostras).toFixed(4),
        piso: {
          n: pisoAmostras.length,
          mediana: pisoAmostras.length ? +pisoAmostras[pisoAmostras.length >> 1].toFixed(4) : null,
          p90: pisoAmostras.length ? +pisoAmostras[Math.floor(pisoAmostras.length * 0.9)].toFixed(4) : null,
          max: pisoAmostras.length ? +pisoAmostras[pisoAmostras.length - 1].toFixed(4) : null,
        },
        pior, piorDur, linhas,
      };
    }

    // OS ESTADOS, na MESMA execução — é a única forma de o "antes" e o "depois" saírem da mesma
    // régua, do mesmo navegador e da mesma pintura carregada.
    // `rep` é a LINHA VIVA de REPETICAO_PINT e `setRepeticao` escreve nela: guardar o valor
    // original ANTES é o que permite devolver o estado publicado no fim (a primeira versão
    // devolvia `rep[0]` já mutado, e o cabeçalho saía dizendo "espelha=false" sobre o estado A).
    const espelhaOrig = rep[0];
    const estados = {};
    estados.A_como_esta = varrer();
    if (typeof window.setRepeticao === 'function') {
      window.setRepeticao(pint, false);       // B: peça de cima sem espelho
      estados.B_sem_espelho = varrer();
      window.setRepeticao(pint, espelhaOrig); // devolve o estado publicado
    }

    fundoAtivo = -1; worldX = 0; redesenharFundo();
    return {
      pint, W, cw: g.cw, ch: g.ch, dw: +g.dw.toFixed(1), dh: +g.dh.toFixed(1), dy: +g.dy.toFixed(1),
      fracao, espelha: espelhaOrig, tw: +tw.toFixed(1), twCss: +(tw / 2).toFixed(1),
      ciclo: +ciclo.toFixed(1), bandaY: [y0, y1], alt,
      fracaoConta: +Math.min(1, g.cw / tw).toFixed(4),
      estados,
    };
  }, { pint: PINT, raio: RAIO, amostras: AMOSTRAS });

  console.log('=== PINTURA ' + r.pint + ' · 390x844 dsf2 ===');
  console.log('  W(mundo) ' + r.W + ' · canvas ' + r.cw + 'x' + r.ch
    + ' · dw ' + r.dw + ' dh ' + r.dh + ' dy ' + r.dy);
  console.log('  peça de cima: espelha=' + r.espelha + ' fração=' + r.fracao
    + ' · ladrilho tw ' + r.tw + ' px dev = ' + r.twCss + ' px CSS');
  console.log('  faixa medida (peça de cima em quadro): y ' + r.bandaY[0] + '..' + r.bandaY[1]
    + ' = ' + r.alt + ' px dev');
  console.log('');
  console.log('=== (0) FRAÇÃO DO TEMPO DE CAMINHADA COM UM EIXO EM QUADRO ===');
  console.log('  ciclo inteiro da pintura = ' + r.ciclo + ' px de mundo');
  console.log('  pela conta (cw/tw):  ' + (r.fracaoConta * 100).toFixed(1) + '%');
  for (const k in r.estados) {
    console.log('  pela varredura (' + k + '): ' + (r.estados[k].fracaoVarrida * 100).toFixed(1)
      + '%  (' + AMOSTRAS + ' amostras de um ciclo)');
  }

  for (const k in r.estados) {
    const e = r.estados[k];
    console.log('');
    console.log('======== ESTADO ' + k + ' ========');
    console.log('  piso de ruído (colunas longe de eixo): n=' + e.piso.n
      + '  mediana ' + (e.piso.mediana * 100).toFixed(1) + '%'
      + '  p90 ' + (e.piso.p90 * 100).toFixed(1) + '%'
      + '  max ' + (e.piso.max * 100).toFixed(1) + '%');
    console.log('  (a) simetria MÁXIMA no eixo   ' + (e.pior.sim * 100).toFixed(1) + '%'
      + '   a ' + (e.pior.frac * 100).toFixed(1) + '% do ciclo (wx=' + e.pior.wx + ', x=' + e.pior.x + ' css)');
    console.log('  (b) dureza MÁXIMA sobre o eixo ' + e.piorDur.dur + 'x a mediana'
      + '   a ' + (e.piorDur.frac * 100).toFixed(1) + '% do ciclo (wx=' + e.piorDur.wx + ', x=' + e.piorDur.x + ' css)');
    if (process.env.DETALHE) {
      for (const l of e.linhas) {
        if (!l.eixos.length) continue;
        const t = l.eixos.map(x => 'x=' + x.xCss + 'css sim='
          + (x.sim === null ? '—' : (x.sim * 100).toFixed(1) + '%') + ' dur=' + x.dur + 'x').join('  |  ');
        console.log('    ' + (l.frac * 100).toFixed(1).padStart(5) + '%  wx=' + String(l.wx).padStart(7) + '  ' + t);
      }
    }
  }
  if (erros.length) { console.log('\nERROS DE CONSOLE:'); erros.forEach(e => console.log('  ' + e)); }
  await nav.close();
  process.exit(0);
})();
