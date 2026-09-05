// QA 05/09 — O QUE A PESSOA VE EM A PRACA, desenhado pelo MOTOR e nao pelo instrumento.
//
// POR QUE ELE EXISTE, e e o buraco que o lote de 04-05/09 deixou aberto. Ha tres portoes sobre a
// folha de gente e nenhum olha o PIXEL QUE SAI:
//   · `qa-gente-quadro-que-chega.js` cobra que o quadro tenha TINTA (`esperando()`, 1x1);
//   · `qa-gente-quadro-dobrado.js` cobra a LARGURA contra a mediana da fileira, lendo o
//     cabecalho WebP — nunca abre o navegador;
//   · `qa-praca-quadro-vazio-vira-objeto.js` cobra `mobEhGente`, que e um booleano.
// Um quadro com DUAS pessoas coladas passa nos tres: tem tinta, esta na lista de conhecidos, e
// `mobEhGente` e true. O defeito §2 que sobra — a figura desenhada em dobro num passo de oito —
// nunca chega a ser VISTO por instrumento nenhum. Este arquivo desenha os 24 passos com a
// MESMA matematica do motor e mede a figura resultante.
//
// A MATEMATICA COPIADA E DECLARADA: `desenharGente` centra pela LARGURA do quadro
// (`dx = cxm - dw/2`) e normaliza pela ALTURA (`GENTE4_ALVO / naturalHeight`). E por isso que a
// celula dobrada nao "aparece maior": ela aparece como duas figuras de tamanho certo, uma de
// cada lado do centro do passo.
//
// A REGUA: depois de normalizar pela altura, quantos CORREDORES de figura ha na celula? Um passo
// so pode ter UM. Dois corredores separados por um vao vertical = pessoa em dobro.
//
// USO:  node test/qa-praca-o-que-a-pessoa-ve.js [capitulo]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');
const { ehRuidoDeRedeExterna } = require('./rede-externa.js');
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
const CAP = process.argv[2] || 'praca';

// Estado medido em 05/09 pelo QA, DEPOIS da entrega que tapou f0q7 e f2q0. Cada linha e um passo
// em que a pessoa aparece em DOBRO. Nao ha nenhum a mais e nenhum a menos; o portao reprova nos
// dois sentidos, como os irmaos dele.
const DOBRO_CONHECIDO = { praca: ['f0q3', 'f2q3', 'f2q6'] };
// E o passo que nao tem pessoa nenhuma (cai no barril/saco). Um so, e nomeado.
const SEM_PESSOA = { praca: ['f2q7'] };

let falhas = 0;
function ok(c, m) { console.log((c ? '  ok    ' : '  FALHA ') + m); if (!c) falhas++; }

(async function () {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const page = await nav.newPage({ viewport: { width: 390, height: 844 } });
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !ehRuidoDeRedeExterna(m)) erros.push(m.text()); });
  await page.goto(ALVO, { waitUntil: 'load' });
  await page.waitForFunction('typeof EPOCAS !== "undefined" && typeof mobFrame === "function"', { timeout: 30000 });

  // A folha de A PRACA viaja no `pack-naodito.json`; sem entrar no capitulo ela e 1x1 inteira.
  await page.evaluate((cap) => {
    const ep = EPOCAS.findIndex(e => e.id === cap);
    let cen = -1;
    for (let n = 0; n < TOTAL_CENAS; n++) if (epocaDoCenario(n) === ep) { cen = n; break; }
    S.cenario = cen; S.fronteira = Math.max(S.fronteira, cen);
    if (typeof visitando !== 'undefined') visitando = false;
    garantirEpoca(ep);
  }, CAP);
  await page.waitForFunction((cap) => {
    const f = GENTE_EP_SPR[cap];
    if (!f) return false;
    let v = 0; f.forEach(fl => fl.forEach(im => { if (im.complete && im.naturalWidth > 1) v++; }));
    return v >= 20;
  }, CAP, { timeout: 30000 });

  const r = await page.evaluate((cap) => {
    const CARGA = ['barrel', 'cash', 'smog'];
    const ALVO_ALT = (typeof GENTE4_ALVO !== 'undefined') ? GENTE4_ALVO : 96;
    const passos = [];
    for (let fi = 0; fi < 3; fi++) for (let qi = 0; qi < 8; qi++) {
      const img = mobFrame({ type: CARGA[fi], d: (qi + 0.5) * GENTE4_PASSO });
      const gente = !!mobEhGente;
      const id = 'f' + fi + 'q' + qi;
      if (!img || !img.naturalWidth || !img.naturalHeight) { passos.push({ id, gente, corredores: 0, nota: 'sem imagem' }); continue; }
      // A NORMALIZACAO DO MOTOR: escala pela altura, largura acompanha.
      const k = ALVO_ALT / img.naturalHeight;
      const dw = Math.max(1, Math.round(img.naturalWidth * k)), dh = Math.round(ALVO_ALT);
      const c = document.createElement('canvas'); c.width = dw; c.height = dh;
      const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      g.drawImage(img, 0, 0, dw, dh);
      const px = g.getImageData(0, 0, dw, dh).data;
      const col = new Array(dw).fill(0);
      for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) if (px[(y * dw + x) * 4 + 3] > 24) col[x]++;
      // corredor = trecho contiguo de colunas com tinta acima de 4% da altura. Vao mais estreito
      // que 4 px na escala de tela nao separa figura: e o vao entre perna e braco.
      const min = Math.max(1, Math.round(dh * 0.04));
      const corredores = [];
      let ini = -1;
      for (let x = 0; x <= dw; x++) {
        const cheio = x < dw && col[x] > min;
        if (cheio && ini < 0) ini = x;
        if (!cheio && ini >= 0) { corredores.push([ini, x - 1]); ini = -1; }
      }
      const grandes = corredores.filter(c2 => (c2[1] - c2[0] + 1) >= Math.round(dw * 0.15));
      passos.push({ id, gente, dw, dh, larguraFonte: img.naturalWidth,
        corredores: grandes.length, faixas: grandes.map(c2 => c2[0] + '-' + c2[1]).join(' | ') });
    }
    return { passos, ALVO_ALT };
  }, CAP);

  console.log('O QUE O MOTOR DESENHA — ' + CAP + ', altura normalizada ' + r.ALVO_ALT + 'px\n');
  console.log('  passo   fonte  desenhado  gente?  figuras  faixas de coluna');
  for (const p of r.passos) {
    console.log('  ' + p.id.padEnd(6) + '  ' + String(p.larguraFonte || 0).padStart(5) +
      '  ' + String((p.dw || 0) + 'x' + (p.dh || 0)).padStart(9) + '  ' + String(p.gente).padStart(6) +
      '  ' + String(p.corredores).padStart(7) + '  ' + (p.faixas || p.nota || ''));
  }
  console.log('');

  const emDobro = r.passos.filter(p => p.gente && p.corredores >= 2).map(p => p.id);
  const semPessoa = r.passos.filter(p => !p.gente).map(p => p.id);
  const esperadoDobro = DOBRO_CONHECIDO[CAP] || [];
  const esperadoSem = SEM_PESSOA[CAP] || [];

  ok(semPessoa.length === esperadoSem.length && esperadoSem.every(v => semPessoa.indexOf(v) >= 0),
    CAP + ': os passos SEM pessoa sao exatamente [' + esperadoSem.join(', ') + '] — achei [' + semPessoa.join(', ') + ']');
  ok(emDobro.length === esperadoDobro.length && esperadoDobro.every(v => emDobro.indexOf(v) >= 0),
    CAP + ': os passos com a pessoa EM DOBRO sao exatamente [' + esperadoDobro.join(', ') + '] — achei [' + emDobro.join(', ') + ']' +
    '. Quadro dobrado tem tinta, esta na lista de largos e `mobEhGente` e true: nenhum dos tres portoes irmaos o ve chegar.');

  // O NUMERO QUE FALTAVA NO RELATORIO: quantos dos 24 passos mostram UMA pessoa inteira.
  const limpos = r.passos.filter(p => p.gente && p.corredores === 1).length;
  console.log('   ' + limpos + ' de 24 passos mostram UMA pessoa · ' + emDobro.length +
    ' mostram a pessoa em DOBRO · ' + semPessoa.length + ' nao mostram pessoa nenhuma');
  ok(!erros.length, 'sem erro de console' + (erros.length ? ': ' + erros.slice(0, 3).join(' | ') : ''));

  await nav.close();
  console.log(falhas ? '\nREPROVOU (' + falhas + ')' : '\nPASSOU');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
