// QA 05/09 — A TIRA DE CONTATO DE A PRACA, para OLHAR em vez de acreditar.
//
// A largura sozinha nao prova "duas poses coladas": uma pose unica com o braco esticado ou com
// um objeto comprido tambem e larga. A decisao §2-sensivel de deixar `praca f2q7` VAZIO (a
// pessoa vira barril num passo de oito) esta apoiada nessa palavra, entao ela tem de ser vista.
//
// Este arquivo desenha as 24 celulas da folha, uma por linha de fileira, com a largura escrita
// em cima e uma REGUA vertical no meio de cada celula suspeita — se houver duas poses, a regua
// cai no vao entre elas; se for uma pose so, ela corta a figura. Salva `QA-praca-tira.png` e
// recortes ampliados das celulas largas.
//
// USO:  node test/qa-praca-tira-de-contato.js [capitulo]
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');
const { ehRuidoDeRedeExterna } = require('./rede-externa.js');
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
const CAP = process.argv[2] || 'praca';

(async function () {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const page = await nav.newPage({ viewport: { width: 1400, height: 1200 } });
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !ehRuidoDeRedeExterna(m)) erros.push(m.text()); });
  await page.goto(ALVO, { waitUntil: 'load' });
  await page.waitForFunction('typeof GENTE_EP_B64 !== "undefined" && typeof garantirEpoca === "function"', { timeout: 30000 });

  // ENTRAR NO CAPITULO PRIMEIRO — e isto NAO e detalhe. A folha de A PRACA viaja no
  // `pack-naodito.json` (ferramentas/pacotes.js, PACK_DA_GENTE), entao na carga a folha inteira
  // e pixel de espera 1x1. A primeira versao deste instrumento leu `GENTE_EP_B64` direto e
  // reportou 24 de 24 vazios — o mesmo modo de falha que o `abrir.js` descreve. Fica registrado.
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
    let comTinta = 0;
    f.forEach(fl => fl.forEach(im => { if (im.complete && im.naturalWidth > 1) comTinta++; }));
    return comTinta > 0;
  }, CAP, { timeout: 30000 });

  const dados = await page.evaluate(async (cap) => {
    const folha = GENTE_EP_B64[cap];
    const ims = [];
    for (const fl of folha) {
      const linha = [];
      for (const d of fl) {
        const im = new Image(); im.src = d;
        await new Promise(r => { im.complete ? r() : (im.onload = r, im.onerror = r); });
        linha.push(im);
      }
      ims.push(linha);
    }
    // uma tira por fileira, celulas lado a lado, fundo xadrez para ver alfa
    const ALT = 300, PAD = 6;
    const larguras = ims.map(fl => fl.reduce((s, im) => s + Math.max(im.naturalWidth, 20) + PAD, 0));
    const W = Math.max(...larguras) + 20, H = ims.length * (ALT + 30) + 20;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#202024'; g.fillRect(0, 0, W, H);
    // xadrez
    for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16)
      if (((x / 16) + (y / 16)) % 2 === 0) { g.fillStyle = '#2b2b31'; g.fillRect(x, y, 16, 16); }
    g.font = '12px monospace'; g.textBaseline = 'top';
    const medidas = [];
    ims.forEach((fl, fi) => {
      let x = 10; const y = 10 + fi * (ALT + 30);
      fl.forEach((im, qi) => {
        const w = Math.max(im.naturalWidth, 20), h = im.naturalHeight;
        if (im.naturalWidth > 1) g.drawImage(im, x, y + (ALT - h));
        else { g.fillStyle = '#b02020'; g.fillRect(x, y + ALT - 40, 20, 40); }
        g.strokeStyle = 'rgba(255,255,255,.25)'; g.strokeRect(x - .5, y - .5, w + 1, ALT + 1);
        g.fillStyle = '#ffd';
        g.fillText('f' + fi + 'q' + qi + ' ' + im.naturalWidth, x + 2, y + ALT + 4);
        medidas.push({ id: 'f' + fi + 'q' + qi, w: im.naturalWidth, h: im.naturalHeight, x: x, y: y + (ALT - h) });
        x += w + PAD;
      });
    });
    return { png: c.toDataURL('image/png'), medidas, W, H };
  }, CAP);

  const fs = require('fs');
  fs.writeFileSync(path.join(__dirname, 'QA-' + CAP + '-tira.png'),
    Buffer.from(dados.png.split(',')[1], 'base64'));

  // ---- o teste que a largura sozinha nao faz: onde estao as COLUNAS COM TINTA? ----
  // Uma celula com DUAS poses tem um VAO vertical de alfa zero (ou quase) no meio. Uma pose
  // unica larga, nao. Medimos o perfil de opacidade por coluna e procuramos o vao.
  const perfis = await page.evaluate(async (cap) => {
    const folha = GENTE_EP_B64[cap];
    const out = [];
    for (let fi = 0; fi < folha.length; fi++) {
      for (let qi = 0; qi < folha[fi].length; qi++) {
        const im = new Image(); im.src = folha[fi][qi];
        await new Promise(r => { im.complete ? r() : (im.onload = r, im.onerror = r); });
        if (im.naturalWidth <= 1) { out.push({ id: 'f' + fi + 'q' + qi, w: im.naturalWidth, vazio: true }); continue; }
        const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
        const g = c.getContext('2d'); g.drawImage(im, 0, 0);
        const px = g.getImageData(0, 0, c.width, c.height).data;
        const col = new Array(c.width).fill(0);
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++)
          if (px[(y * c.width + x) * 4 + 3] > 24) col[x]++;
        const tinta = col.reduce((s, v) => s + v, 0);
        // o maior corredor interno de colunas quase-vazias (< 2% da altura)
        const limiar = Math.max(1, Math.floor(c.height * 0.02));
        let melhor = 0, atual = 0, centroMelhor = 0;
        const de = col.findIndex(v => v > limiar), ate = col.length - 1 - col.slice().reverse().findIndex(v => v > limiar);
        for (let x = de; x <= ate; x++) {
          if (col[x] <= limiar) { atual++; if (atual > melhor) { melhor = atual; centroMelhor = x - atual / 2; } }
          else atual = 0;
        }
        out.push({ id: 'f' + fi + 'q' + qi, w: c.width, h: c.height, tinta: tinta,
          densidade: +(tinta / (c.width * c.height)).toFixed(3),
          vao: melhor, vaoCentro: Math.round(centroMelhor), vaoFrac: +(centroMelhor / c.width).toFixed(2),
          de: de, ate: ate });
      }
    }
    return out;
  }, CAP);

  console.log('PERFIL DE COLUNA — ' + CAP + '  (vao = maior corredor interno de colunas vazias)\n');
  console.log('  id     larg  tinta(px)  dens   vao  centro-do-vao');
  for (const p of perfis) {
    if (p.vazio) { console.log('  ' + p.id.padEnd(6) + '  ' + String(p.w).padStart(4) + '   PIXEL DE ESPERA (1x1) — nao ha figura'); continue; }
    console.log('  ' + p.id.padEnd(6) + '  ' + String(p.w).padStart(4) + '  ' + String(p.tinta).padStart(8) +
      '  ' + String(p.densidade).padStart(5) + '  ' + String(p.vao).padStart(4) + '   ' + p.vaoFrac);
  }
  console.log('\n  tira salva em test/QA-' + CAP + '-tira.png');
  if (erros.length) console.log('  ERROS DE CONSOLE: ' + erros.slice(0, 3).join(' | '));
  await nav.close();
})().catch(e => { console.error(e); process.exit(1); });
