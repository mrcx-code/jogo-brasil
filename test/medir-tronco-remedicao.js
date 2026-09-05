// REMEDIÇÃO DO TRONCO DE PALMARES — o que o `qa-tronco-criterio.js` deixou em aberto.
//
//   node test/medir-tronco-remedicao.js [pintura]        (padrão 2)
//
// DE ONDE ISTO VEM. O `medir-tronco-palmares.js` mediu com `G > B` e concluiu que a pintura não
// rende o tronco (61,4% na pint. 2, 52,7% na pint. 3). O QA provou que `G > B` tem falso-negativo
// dentro de sombra: afrouxando 10/255 a pint. 2 vai a 101,5%. Isso derruba o NÚMERO, e o item
// mandou remedir antes de pedir arte. Só que "101,5% do pedido" ainda não responde a pergunta
// que decide, porque a régua do QA mede ALTURA e a coluna precisa de altura E de ser um tronco.
//
// AS DUAS PERGUNTAS QUE FALTAM, e as duas são de contagem, não de gosto:
//
//   (1) QUANTAS janelas passam? A régua pega o MÁXIMO sobre x. Se um lugar só passa, existe um
//       candidato a tronco. Se QUASE TODO x passa, a pintura é uma parede de mata que encosta no
//       céu — e aí "101,5%" não achou um tronco, achou que não há céu naquela faixa. As duas
//       leituras dão o mesmo máximo e mandam fazer coisas opostas.
//
//   (2) DO QUE É FEITA a janela vencedora? Tronco é casca: R > G > B, marrom. Folha é verde:
//       G é o canal máximo. A janela que ganhou a corrida de altura é feita de casca ou de
//       folha? Um recorte de 33 px de largura por 690 px de altura sem pixel de casca nenhum é
//       uma coluna de folhagem, e o aceite proíbe empilhar folhagem repetida ("lê como azulejo").
//
// Nenhum julgamento de composição sai daqui — isso é da arte, e já foi dado em 04/09. Aqui só
// saem contagens.
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
    const pedido = (Math.min(g.dy + g.dh * FUNDO_GROUND_SRC, g.dh * FUNDO_GROUND_SRC) / dpr)
      / escalaCss;
    const L = Math.round(28 / escalaCss);

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
    // casca: marrom, R > G > B com separação real (não é folha escura nem sombra cinza)
    function ehCasca(R, G, B) { return R > G + 6 && G > B + 2; }
    function ehFolha(R, G, B) { return G >= R && G > B; }

    const CRIT = [
      { nome: 'G > B (original)', f: (R, G, B) => G > B },
      { nome: 'G > B - 10 (QA)', f: (R, G, B) => G > B - 10 },
      { nome: 'nao-ceu (QA)', f: (R, G, B) => {
        const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
        return (0.299 * R + 0.587 * G + 0.114 * B) < 150 || (mx - mn) > 40; } },
    ];
    const saida = [];
    for (const cr of CRIT) {
      const c = corridas(cr.f);
      // (1) quantas janelas de L px passam a altura pedida, e melhor janela
      let passam = 0, melhor = -1, ondeX = -1;
      const janelas = [];
      for (let x = 0; x + L <= w; x++) {
        let m = Infinity;
        for (let k = 0; k < L; k++) if (c[x + k] < m) m = c[x + k];
        janelas.push(m);
        if (m >= pedido) passam++;
        if (m > melhor) { melhor = m; ondeX = x; }
      }
      // blocos contíguos de x que passam — quantos "candidatos a tronco" distintos existem
      let blocos = 0, dentro = false;
      for (let i = 0; i < janelas.length; i++) {
        if (janelas[i] >= pedido) { if (!dentro) { blocos++; dentro = true; } } else dentro = false;
      }
      // (2) composição da janela vencedora, na altura que ela de fato cobre
      let casca = 0, folha = 0, outro = 0;
      const altura = Math.min(melhor, Math.round(pedido));
      for (let k = 0; k < L; k++) {
        for (let y = h - 1; y > h - 1 - altura; y--) {
          const p = (y * w + (ondeX + k)) * 4;
          const R = d[p], G = d[p + 1], B = d[p + 2];
          if (ehCasca(R, G, B)) casca++; else if (ehFolha(R, G, B)) folha++; else outro++;
        }
      }
      const tot = Math.max(1, casca + folha + outro);
      saida.push({
        nome: cr.nome, melhor, pct: +(100 * melhor / pedido).toFixed(1), ondeX,
        passam, totalJanelas: janelas.length, pctX: +(100 * passam / janelas.length).toFixed(1),
        blocos,
        casca: +(100 * casca / tot).toFixed(1), folha: +(100 * folha / tot).toFixed(1),
        outro: +(100 * outro / tot).toFixed(1),
      });
    }
    // AFERIÇÃO DO PRÓPRIO DETECTOR: quanta casca existe na PINTURA INTEIRA. Se der 0 aqui, o
    // "0% de casca na janela vencedora" não diz nada sobre a janela — diz que o detector não
    // acha marrom em lugar nenhum, e aí a medida é lixo. A coluna de casca mais densa (a melhor
    // faixa de L px por fração de casca) diz onde está o tronco mais marrom da pintura.
    let cascaTudo = 0, folhaTudo = 0, opacos = 0;
    const cascaCol = new Float64Array(w);
    for (let x = 0; x < w; x++) {
      let cc = 0, nn = 0;
      for (let y = 0; y < h; y++) {
        const p = (y * w + x) * 4;
        if (d[p + 3] < 128) continue;
        const R = d[p], G = d[p + 1], B = d[p + 2];
        opacos++; nn++;
        if (ehCasca(R, G, B)) { cascaTudo++; cc++; } else if (ehFolha(R, G, B)) folhaTudo++;
      }
      cascaCol[x] = nn ? cc / nn : 0;
    }
    let melhorCasca = -1, melhorCascaX = -1;
    for (let x = 0; x + L <= w; x++) {
      let s = 0; for (let k = 0; k < L; k++) s += cascaCol[x + k];
      s /= L;
      if (s > melhorCasca) { melhorCasca = s; melhorCascaX = x; }
    }
    const afericao = {
      cascaPint: +(100 * cascaTudo / Math.max(1, opacos)).toFixed(2),
      folhaPint: +(100 * folhaTudo / Math.max(1, opacos)).toFixed(2),
      melhorFaixaCasca: +(100 * melhorCasca).toFixed(2), melhorFaixaCascaX: melhorCascaX,
    };

    fundoAtivo = -1; worldX = 0; redesenharFundo();
    return { pint, w, h, L, pedido: +pedido.toFixed(1), escalaCss: +escalaCss.toFixed(4), saida,
      afericao };
  }, { pint: PINT });

  console.log('=== REMEDIÇÃO DO TRONCO · pint ' + r.pint + ' · peça ' + r.w + 'x' + r.h + ' ===');
  console.log('  pedido: faixa de ' + r.L + ' px de fonte (28 CSS) x ' + r.pedido + ' px de altura');
  console.log('');
  for (const s of r.saida) {
    console.log('  ' + s.nome);
    console.log('    melhor janela      ' + String(s.melhor).padStart(4) + ' px = '
      + String(s.pct).padStart(5) + '% do pedido  (x=' + s.ondeX + ')');
    console.log('    janelas que PASSAM ' + String(s.passam).padStart(4) + ' de ' + s.totalJanelas
      + ' posições de x = ' + s.pctX + '%   em ' + s.blocos + ' bloco(s) contíguo(s)');
    console.log('    a janela vencedora é feita de: casca ' + s.casca + '% · folha ' + s.folha
      + '% · outro ' + s.outro + '%');
    console.log('');
  }
  console.log('  AFERIÇÃO DO DETECTOR DE CASCA (contra a pintura inteira):');
  console.log('    a pintura inteira é: casca ' + r.afericao.cascaPint + '% · folha '
    + r.afericao.folhaPint + '%');
  console.log('    a faixa de ' + r.L + ' px mais marrom da pintura tem '
    + r.afericao.melhorFaixaCasca + '% de casca  (x=' + r.afericao.melhorFaixaCascaX + ')');
  console.log('');
  if (erros.length) { console.log('ERROS:'); erros.forEach(e => console.log('  ' + e)); }
  await nav.close();
  process.exit(0);
})();
