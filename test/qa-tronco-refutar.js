// QA — REFUTAÇÃO ADVERSARIAL DA REMEDIÇÃO DO TRONCO (`medir-tronco-remedicao.js`).
//
//   node test/qa-tronco-refutar.js            (todas as pinturas, calibra o detector)
//   node test/qa-tronco-refutar.js 2          (só a pintura 2, e despeja os PNGs)
//
// POR QUE ISTO EXISTE, e são três defeitos de método que o instrumento do dev-jogo tem e que
// não aparecem no número que ele devolve:
//
//   (1) VIÉS DE SELEÇÃO. Ele escolhe a janela vencedora pelo MÁXIMO DE ALTURA e só DEPOIS
//       pergunta de que ela é feita. Numa pintura de mata a coluna mais alta é, por
//       construção, a que atravessa mais folha — então "a janela vencedora é 0% casca" é
//       quase uma tautologia do critério de escolha, não um achado sobre a pintura. A
//       pergunta certa é conjunta: existe janela que tenha altura E casca ao mesmo tempo?
//       Aqui a busca é feita com PISO DE CASCA variável, e devolve a fronteira inteira.
//
//   (2) A CORRIDA QUEBRA NO PRIMEIRO PIXEL FORA. Um tronco real com uma linha de luz, um
//       galho claro atravessando ou um pixel de céu entre folhas é CORTADO ali, e a altura
//       medida despenca. Aqui a corrida tem tolerância a buraco (`FOLGA`), e o efeito dela
//       é reportado — se a altura pular muito com folga pequena, a régua sem folga era um
//       falso-negativo.
//
//   (3) RACIOCÍNIO CIRCULAR NA AFERIÇÃO. O dev afere o detector de casca contra A PRÓPRIA
//       PINTURA em questão ("a pintura 2 inteira é 3,36% casca"). Isso mostra que o detector
//       acha ALGUM marrom, não que ele ache TRONCO. A aferição honesta é contra uma pintura
//       cujo tronco a gente sabe que existe. Por isso o modo padrão roda TODAS as pinturas:
//       se nenhuma pintura do jogo passa a régua, o problema é da RÉGUA, não de PALMARES.
//
// Nada aqui julga composição. Isso é da arte.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ABRIR = require('./abrir.js');

const ARG = process.argv[2];
const SO_UMA = ARG !== undefined && ARG !== 'todas';
const PINT = SO_UMA ? parseInt(ARG, 10) : null;
const FOLGA = parseInt(process.env.FOLGA || '8', 10);   // pixels de buraco tolerados na corrida

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

  const nPint = await pg.evaluate(() => CENARIO_ALTO.length);
  const alvos = SO_UMA ? [PINT] : Array.from({ length: nPint }, (_, i) => i);

  const tudo = [];
  for (const pint of alvos) {
    const r = await pg.evaluate(({ pint, FOLGA, despejar }) => {
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

      // mesmos detectores do dev-jogo, para o número ser comparável ao dele
      const ehCasca = (R, G, B) => R > G + 6 && G > B + 2;
      const ehFolha = (R, G, B) => G >= R && G > B;
      // "pertence à mata" — o critério de altura. Uso o do QA (G > B - 10), que é o mais
      // generoso dos dois que não é o "não-céu" (o não-céu mede ausência de céu, e nisso o
      // dev-jogo tem razão).
      const ehMata = (R, G, B) => G > B - 10;

      // (2) corrida COM TOLERÂNCIA A BURACO: só encerra depois de `folga` pixels seguidos
      // fora do critério, e devolve a altura até o último pixel BOM (não conta o buraco).
      function corrida(x, folga) {
        let n = 0, ruim = 0, bom = 0;
        for (let y = h - 1; y >= 0; y--) {
          const p = (y * w + x) * 4;
          if (d[p + 3] < 128) break;
          if (ehMata(d[p], d[p + 1], d[p + 2])) { n++; bom = n; ruim = 0; }
          else { n++; ruim++; if (ruim > folga) break; }
        }
        return bom;
      }
      const c0 = new Int32Array(w), cF = new Int32Array(w);
      for (let x = 0; x < w; x++) { c0[x] = corrida(x, 0); cF[x] = corrida(x, FOLGA); }

      // fração de casca de cada coluna, DENTRO da faixa de altura que interessa (a parte
      // visível da peça de cima), que é onde o tronco teria de estar — não a pintura inteira.
      const alturaPedida = Math.min(h, Math.round(pedido));
      const cascaCol = new Float64Array(w), folhaCol = new Float64Array(w);
      for (let x = 0; x < w; x++) {
        let cc = 0, ff = 0, nn = 0;
        for (let y = h - 1; y > h - 1 - alturaPedida; y--) {
          const p = (y * w + x) * 4;
          if (d[p + 3] < 128) continue;
          nn++;
          const R = d[p], G = d[p + 1], B = d[p + 2];
          if (ehCasca(R, G, B)) cc++; else if (ehFolha(R, G, B)) ff++;
        }
        cascaCol[x] = nn ? cc / nn : 0; folhaCol[x] = nn ? ff / nn : 0;
      }

      // (1) A BUSCA CONJUNTA. Para cada piso de casca, qual a MAIOR altura alcançável por uma
      // janela de L px cuja fração de casca >= piso? Isso é a fronteira altura-x-casca, e é
      // ela que responde "existe tronco aqui", sem o viés de escolher por altura primeiro.
      function fronteira(c) {
        const out = [];
        for (const piso of [0, 0.05, 0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70]) {
          let melhor = -1, ondeX = -1, quantas = 0;
          for (let x = 0; x + L <= w; x++) {
            let sc = 0, m = Infinity;
            for (let k = 0; k < L; k++) { sc += cascaCol[x + k]; if (c[x + k] < m) m = c[x + k]; }
            sc /= L;
            if (sc < piso) continue;
            quantas++;
            if (m > melhor) { melhor = m; ondeX = x; }
          }
          out.push({ piso, alt: melhor, pct: melhor < 0 ? null : +(100 * melhor / pedido).toFixed(1),
            x: ondeX, janelas: quantas });
        }
        return out;
      }

      // a janela mais MARROM da faixa, e a altura QUE ELA TEM (o dev não reporta esta altura —
      // ele reporta só onde a faixa mais marrom está)
      let mc = -1, mcX = -1;
      for (let x = 0; x + L <= w; x++) {
        let s = 0; for (let k = 0; k < L; k++) s += cascaCol[x + k]; s /= L;
        if (s > mc) { mc = s; mcX = x; }
      }
      let altMarrom0 = Infinity, altMarromF = Infinity;
      for (let k = 0; k < L; k++) {
        if (c0[mcX + k] < altMarrom0) altMarrom0 = c0[mcX + k];
        if (cF[mcX + k] < altMarromF) altMarromF = cF[mcX + k];
      }

      // pintura inteira, para comparar entre capítulos
      let cascaTudo = 0, folhaTudo = 0, opacos = 0;
      for (let i = 0; i < w * h; i++) {
        const p = i * 4; if (d[p + 3] < 128) continue;
        opacos++;
        const R = d[p], G = d[p + 1], B = d[p + 2];
        if (ehCasca(R, G, B)) cascaTudo++; else if (ehFolha(R, G, B)) folhaTudo++;
      }

      let png = null, pngMask = null;
      if (despejar) {
        png = cv.toDataURL('image/png');
        // máscara: casca em vermelho, folha em verde escuro, resto preto — para OLHAR onde o
        // detector acha marrom, em vez de acreditar na porcentagem
        const mv = document.createElement('canvas'); mv.width = w; mv.height = h;
        const mx = mv.getContext('2d');
        const md = mx.createImageData(w, h);
        for (let i = 0; i < w * h; i++) {
          const p = i * 4; const R = d[p], G = d[p + 1], B = d[p + 2];
          let o = [0, 0, 0];
          if (d[p + 3] >= 128) {
            if (ehCasca(R, G, B)) o = [255, 40, 40];
            else if (ehFolha(R, G, B)) o = [0, 90, 0];
            else o = [40, 40, 90];
          }
          md.data[p] = o[0]; md.data[p + 1] = o[1]; md.data[p + 2] = o[2]; md.data[p + 3] = 255;
        }
        mx.putImageData(md, 0, 0);
        pngMask = mv.toDataURL('image/png');
      }

      fundoAtivo = -1; worldX = 0; redesenharFundo();
      return {
        pint, w, h, L, pedido: +pedido.toFixed(1),
        cascaPint: +(100 * cascaTudo / Math.max(1, opacos)).toFixed(2),
        folhaPint: +(100 * folhaTudo / Math.max(1, opacos)).toFixed(2),
        maxSemFolga: Math.max(...c0), maxComFolga: Math.max(...cF),
        pctSemFolga: +(100 * Math.max(...c0) / pedido).toFixed(1),
        pctComFolga: +(100 * Math.max(...cF) / pedido).toFixed(1),
        marromPct: +(100 * mc).toFixed(2), marromX: mcX,
        marromAlt0: altMarrom0, marromAltF: altMarromF,
        marromAltPct: +(100 * altMarromF / pedido).toFixed(1),
        fronteira0: fronteira(c0), fronteiraF: fronteira(cF),
        png, pngMask,
      };
    }, { pint, FOLGA, despejar: SO_UMA });

    if (r.png) {
      fs.writeFileSync(path.join(__dirname, 'QA-tronco-pint' + pint + '.png'),
        Buffer.from(r.png.split(',')[1], 'base64'));
      fs.writeFileSync(path.join(__dirname, 'QA-tronco-mascara-pint' + pint + '.png'),
        Buffer.from(r.pngMask.split(',')[1], 'base64'));
      console.log('  (PNG e máscara despejados em test/QA-tronco-*pint' + pint + '.png)');
    }
    delete r.png; delete r.pngMask;
    tudo.push(r);
  }

  console.log('');
  console.log('=== QA · REFUTAÇÃO DO TRONCO · folga de buraco = ' + FOLGA + ' px ===');
  console.log('');
  console.log('  pint  peça       L   pedido  casca%  folha%   maxAlt(s/folga)  maxAlt(c/folga)');
  for (const r of tudo) {
    console.log('  ' + String(r.pint).padStart(4) + '  ' + (r.w + 'x' + r.h).padEnd(10)
      + String(r.L).padStart(3) + String(r.pedido).padStart(9)
      + String(r.cascaPint).padStart(8) + String(r.folhaPint).padStart(8)
      + String(r.maxSemFolga + ' (' + r.pctSemFolga + '%)').padStart(18)
      + String(r.maxComFolga + ' (' + r.pctComFolga + '%)').padStart(17));
  }
  console.log('');
  console.log('  A FRONTEIRA ALTURA x CASCA (com folga) — "maior altura alcançável por uma janela');
  console.log('  de L px com pelo menos P% de casca". É a pergunta conjunta que o instrumento do');
  console.log('  dev-jogo não faz. `--` = nenhuma janela da pintura tem tanta casca assim.');
  for (const r of tudo) {
    console.log('');
    console.log('    pint ' + r.pint + '  (faixa mais marrom: ' + r.marromPct + '% de casca em x='
      + r.marromX + ', e ela alcança ' + r.marromAltF + ' px = ' + r.marromAltPct + '% do pedido)');
    let l1 = '      piso casca ', l2 = '      altura %  ', l3 = '      janelas   ';
    for (const f of r.fronteiraF) {
      l1 += String((f.piso * 100).toFixed(0) + '%').padStart(8);
      l2 += String(f.pct === null ? '--' : f.pct + '%').padStart(8);
      l3 += String(f.janelas).padStart(8);
    }
    console.log(l1); console.log(l2); console.log(l3);
  }
  console.log('');
  if (erros.length) { console.log('ERROS:'); erros.forEach(e => console.log('  ' + e)); }
  await nav.close();
  process.exit(0);
})();
