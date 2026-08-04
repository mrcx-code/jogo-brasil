// Measures a generated sheet before anyone spends time cutting it. It reports numbers and
// nothing else: there is no pass, no fail, no opinion. The person who generated the sheet reads
// the numbers and decides whether to regenerate.
//
// It exists because the failures of an image model are quiet ones. The background comes back
// almost magenta instead of magenta, and a lossy save is indistinguishable from a wrong prompt
// unless someone counts. Two poses merge into one blob and the cutter emits eleven frames from a
// twelve-pose sheet without complaining until the walk cycle limps. And the model, which keeps
// no memory of a character between one corner of the canvas and the other, quietly hands back a
// different girl in frame 9.
//
// That last one is what the HEAD WIDTH column is for, and it is the reason this script exists at
// all. Legs extend, arms swing, a jump stretches the whole body — height is worthless as a
// yardstick between poses. The skull stays the skull. Same measure test/medir-escala.js uses to
// reconcile two sheets; here it is turned inward, across the frames of ONE sheet, where a wide
// spread means the character changed mid-render rather than mid-pose.
//
// Everything below is deliberately the same arithmetic as test/recortar-folha.js — the same
// magenta metric, the same two thresholds, the same equal-cell reading order, the same head
// anchor — so that the frame size printed here is the frame size the cutter will produce. A
// measurement taken with a different ruler than the tool it predicts is worse than no
// measurement.
//
// Usage: validar-folha.js <folha> [N | CxR | CxR:N] [--ref=andar|correr|pular|LxA] [--comp=X]
//   validar-folha.js nova.png                    just measure; blobs counted, nothing expected
//   validar-folha.js nova.png 4x3                12 poses in 4 columns by 3 rows
//   validar-folha.js nova.png 4x3 --ref=andar    also compare the cut size against 191x182
//   validar-folha.js nova.png 4x3 --comp=0.35    predict the height at that vertical squash
//
// --comp is the cutter's last argument and it changes the predicted HEIGHT, so pass the one the
// sheet will really be cut with (1 walking, 0.35 running, 0 jumping) or the height comparison in
// section 5 is against a frame nobody will ever produce.
const fs = require('fs');
const { chromium } = require('playwright');

// The frames the current art actually produced, cut, rescaled and embedded. A new sheet is
// measured against these because the game is built around them: the hero is drawn 44 world px
// tall, a 0.242 scale on a 182 px frame.
const REF = { andar: [191, 182], correr: [191, 189], pular: [191, 206] };
// test/reescalar.js does not scale a frame to fit — it re-lays every frame onto a canvas of this
// fixed width, head centred, feet on the bottom edge. So width is a FIT question, not a scale
// question: past 191 the sides are cropped.
const LARGURA_FINAL = 191;
// Head width of the walk sheet, measured by this script on assets/hero/folha_andar_12.webp. It is
// the yardstick because the walk sheet is the one that ships unrescaled, so its head is the size
// the character is supposed to be. Deriving the rescale factor as this over the new sheet's head
// reproduces the two factors recorded in test/LEIAME.md to within 0.1%: 0.9243 against the 0.9252
// used on the run sheet, 0.6446 against the 0.6445 used on the jump sheet.
const CABECA_REF = 86.7;

const SRC = process.argv[2];
const args = process.argv.slice(3);
const REFARG = (args.find(a => a.startsWith('--ref=')) || '').slice(6);
const COMPARG = args.find(a => a.startsWith('--comp='));
const COMP = COMPARG === undefined ? 1 : parseFloat(COMPARG.slice(7));
const GRADE = args.find(a => !a.startsWith('--'));

const USO = 'uso: validar-folha.js <folha> [N | CxR | CxR:N] [--ref=andar|correr|pular|LxA] [--comp=X]';
if (!(COMP >= 0 && COMP <= 1)) { console.error(USO); process.exit(1); }
if (!SRC || !fs.existsSync(SRC)) { console.error(USO); process.exit(1); }

// "12" parses as C=12, R=1, exactly as the cutter reads it: a strip is the one-row grid
let COLS = 0, ROWS = 0, N = 0;
if (GRADE) {
  const gr = /^(\d+)(?:[xX](\d+))?(?::(\d+))?$/.exec(GRADE);
  if (!gr) { console.error(USO); process.exit(1); }
  COLS = parseInt(gr[1], 10);
  ROWS = gr[2] === undefined ? 1 : parseInt(gr[2], 10);
  N = gr[3] === undefined ? COLS * ROWS : parseInt(gr[3], 10);
  if (!COLS || !ROWS || !N || N > COLS * ROWS) { console.error(USO); process.exit(1); }
}

let refAlvo = null, refNome = '';
if (REFARG) {
  if (REF[REFARG]) { refAlvo = REF[REFARG]; refNome = REFARG; }
  else {
    const m = /^(\d+)[xX](\d+)$/.exec(REFARG);
    if (!m) { console.error(USO); process.exit(1); }
    refAlvo = [parseInt(m[1], 10), parseInt(m[2], 10)]; refNome = REFARG;
  }
}

function chromiumPath() {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM;
  if (fs.existsSync('/opt/pw-browsers/chromium')) return '/opt/pw-browsers/chromium';
  return undefined;
}
const low = SRC.toLowerCase();
const ext = low.endsWith('.webp') ? 'webp' : low.endsWith('.jpg') || low.endsWith('.jpeg') ? 'jpeg' : 'png';
const bytes = fs.readFileSync(SRC);
const dataUrl = 'data:image/' + ext + ';base64,' + bytes.toString('base64');

// ---- formatting helpers, all of them dumb on purpose -------------------------------------
const br = (x) => Math.round(x).toLocaleString('pt-BR');
const pc = (a, b) => b ? (100 * a / b).toFixed(2).replace('.', ',') + '%' : '-';
const f1 = (x) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
const f2 = (x) => (Math.round(x * 100) / 100).toFixed(2).replace('.', ',');
const lin = (rot, val) => console.log('  ' + (rot + ' ').padEnd(24, '.') + ' ' + val);
const tit = (s) => console.log('\n' + s + '\n' + '-'.repeat(Math.max(64, s.length)));

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage();
  const M = await page.evaluate(async (a) => {
    const { src, COLS, ROWS, N, COMP } = a;
    const im = await new Promise((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('nao decodificou')); i.src = src;
    });
    const W = im.naturalWidth, H = im.naturalHeight;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, W, H).data;
    const at = (x, y) => (y * W + x) * 4;

    // The same metric the cutter de-fringes with: magenta is where red and blue are both high
    // and green is low, so min(R,B) - G runs near 1 on the background, near 0 on the character,
    // and lands in between on precisely the blended pixels of the outline.
    const magentice = (i) => Math.max(0, Math.min(d[i], d[i + 2]) - d[i + 1]) / 255;
    const FUNDO = 0.42;   // above this the cutter throws the pixel away
    const BORDA = 0.14;   // below this it keeps it at full opacity; between the two is the fringe
    const branco = (i) => d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235;
    const vazio = (i) => d[i + 3] < 8;

    // ---- 1. purity, counted over the whole image ------------------------------------------
    let exato = 0, tol4 = 0, tol16 = 0, tol48 = 0, brancos = 0, transp = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], vd = d[i + 1], b = d[i + 2];
      if (d[i + 3] < 8) { transp++; continue; }
      const dist = Math.max(Math.abs(r - 255), vd, Math.abs(b - 255));
      if (dist === 0) exato++;
      if (dist <= 4) tol4++;
      if (dist <= 16) tol16++;
      if (dist <= 48) tol48++;
      if (branco(i)) brancos++;
    }

    // ---- 2. the band, found exactly as the cutter finds it ---------------------------------
    // Rows that are mostly background, then the columns of those rows. The existing sheets are a
    // magenta band floating on a white page, so the band is not always the image.
    let y0 = -1, y1 = -1;
    for (let y = 0; y < H; y++) {
      let m = 0, n = 0;
      for (let x = 0; x < W; x += 4) { n++; if (magentice(at(x, y)) > FUNDO) m++; }
      if (m / n > 0.5) { if (y0 < 0) y0 = y; y1 = y; }
    }
    const semFaixa = y0 < 0;
    if (semFaixa) { y0 = 0; y1 = H - 1; }
    let bx0 = W, bx1 = -1;
    for (let x = 0; x < W; x++) {
      let m = false;
      for (let y = y0; y <= y1 && !m; y++) if (magentice(at(x, y)) > FUNDO) m = true;
      if (m) { if (x < bx0) bx0 = x; bx1 = x; }
    }
    if (bx1 < 0) { bx0 = 0; bx1 = W - 1; }
    const BW = bx1 - bx0 + 1, BH = y1 - y0 + 1;

    // ---- 3. classify every pixel of the band ----------------------------------------------
    // tinta = what the cutter keeps at full opacity, franja = the blended outline it has to
    // un-mix, fundo = what it discards. White is excluded from ink by hand: white has
    // min(R,B) - G = 0, so the page around the band reads as pure character unless you say so.
    const TINTA = 1, FRANJA = 2, FUNDOP = 3, PAGINA = 4;
    const cls = new Uint8Array(BW * BH);
    let nTinta = 0, nFranja = 0, nFundo = 0, nPagina = 0;
    let exatoFaixa = 0, fundoFaixa = 0;
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      const i = at(bx0 + x, y0 + y), k = y * BW + x;
      const m = magentice(i);
      if (vazio(i) || branco(i)) { cls[k] = PAGINA; nPagina++; continue; }
      if (m > FUNDO) {
        cls[k] = FUNDOP; nFundo++; fundoFaixa++;
        if (d[i] === 255 && d[i + 1] === 0 && d[i + 2] === 255) exatoFaixa++;
      } else if (m > BORDA) { cls[k] = FRANJA; nFranja++; }
      else { cls[k] = TINTA; nTinta++; }
    }

    // fringe thickness: how many blended pixels sit around each ink pixel that touches the edge.
    // A clean render rings the figure once; a blurred or upscaled one rings it three times.
    let perim = 0;
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      if (cls[y * BW + x] !== TINTA) continue;
      const viz = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dy] of viz) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= BW || ny >= BH) continue;
        if (cls[ny * BW + nx] !== TINTA) { perim++; break; }
      }
    }

    // ---- 4. logical pixel size ------------------------------------------------------------
    // How many screen pixels one painted pixel occupies. Runs of identical colour along a row,
    // measured only inside the ink. A mode of 1 is a native render; a mode of 3 or 4 means the
    // sheet was upscaled after the fact and carries no detail above that block.
    const hist = new Array(9).fill(0);
    for (let y = 0; y < BH; y += 3) {
      let run = 0, pr = -1, pg = -1, pb = -1;
      for (let x = 0; x < BW; x++) {
        const k = y * BW + x;
        if (cls[k] !== TINTA) { if (run) hist[Math.min(run, 8)]++; run = 0; pr = -1; continue; }
        const i = at(bx0 + x, y0 + y);
        if (d[i] === pr && d[i + 1] === pg && d[i + 2] === pb) run++;
        else { if (run) hist[Math.min(run, 8)]++; run = 1; pr = d[i]; pg = d[i + 1]; pb = d[i + 2]; }
      }
      if (run) hist[Math.min(run, 8)]++;
    }
    // distinct colours in the ink, capped so a photographic sheet cannot eat all the memory
    const cores = new Set();
    let estourou = false;
    for (let y = 0; y < BH && !estourou; y++) for (let x = 0; x < BW; x++) {
      if (cls[y * BW + x] !== TINTA) continue;
      const i = at(bx0 + x, y0 + y);
      cores.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
      if (cores.size > 300000) { estourou = true; break; }
    }

    if (semFaixa || nFundo < BW * BH * 0.05) {
      return { W, H, exato, tol4, tol16, tol48, brancos, transp, semFaixa: true,
        faixa: { x: bx0, y: y0, w: BW, h: BH }, nTinta, nFranja, nFundo, nPagina,
        exatoFaixa, fundoFaixa, perim, hist, cores: cores.size, coresEstourou: estourou };
    }

    // ---- 5. blobs -------------------------------------------------------------------------
    // Flood fill over everything the cutter would keep (ink plus fringe, which is what the
    // cutter's own `magentice <= FUNDO` test means), 8-connected, exactly as the cutter floods.
    // The count of blobs is the count of figures the cutter will find, so two poses that touch
    // show up here as one blob and as one missing frame there.
    const eTinta = new Uint8Array(BW * BH);
    for (let k = 0; k < cls.length; k++) if (cls[k] === TINTA || cls[k] === FRANJA) eTinta[k] = 1;
    const rot = new Int32Array(BW * BH).fill(-1);
    const manchas = [];
    for (let s = 0; s < eTinta.length; s++) {
      if (!eTinta[s] || rot[s] >= 0) continue;
      const id = manchas.length;
      let area = 0, ex0 = BW, ex1 = -1, ey0 = BH, ey1 = -1;
      const pilha = [s]; rot[s] = id;
      while (pilha.length) {
        const p = pilha.pop(), px = p % BW, py = (p / BW) | 0;
        area++;
        if (px < ex0) ex0 = px; if (px > ex1) ex1 = px;
        if (py < ey0) ey0 = py; if (py > ey1) ey1 = py;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx, ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= BW || ny >= BH) continue;
          const q = ny * BW + nx;
          if (eTinta[q] && rot[q] < 0) { rot[q] = id; pilha.push(q); }
        }
      }
      manchas.push({ id, area, ex0, ex1, ey0, ey1 });
    }
    if (!manchas.length) {
      return { W, H, exato, tol4, tol16, tol48, brancos, transp, semTinta: true,
        faixa: { x: bx0, y: y0, w: BW, h: BH }, nTinta, nFranja, nFundo, nPagina,
        exatoFaixa, fundoFaixa, perim, hist, cores: cores.size, coresEstourou: estourou };
    }

    // A speck is anything under 5% of the largest blob: a dropped leaf, a bit of the staff the
    // model detached, JPEG noise that survived the threshold. Counted, never silently dropped.
    const maiorArea = Math.max(...manchas.map(m => m.area));
    const grandes = manchas.filter(m => m.area >= maiorArea * 0.05);
    const fragmentos = manchas.filter(m => m.area < maiorArea * 0.05);

    // reading order: rows top to bottom, then left to right inside a row. With one row this is
    // simply left to right, the order the strip has always been read in.
    const altCel = ROWS > 1 ? BH / ROWS : BH;
    for (const m of grandes) {
      m.cx = (m.ex0 + m.ex1) / 2; m.cy = (m.ey0 + m.ey1) / 2;
      m.linha = ROWS > 1 ? Math.min(ROWS - 1, Math.floor(m.cy / altCel)) : 0;
    }
    grandes.sort((p, q) => p.linha - q.linha || p.cx - q.cx);

    for (const m of grandes) {
      const alt = m.ey1 - m.ey0 + 1;
      // Head width, on the top fifth of the figure. Two readings, because they fail differently:
      // `vao` is first-ink to last-ink on the row, which is what medir-escala.js reports and is
      // therefore comparable to it, but it swallows the gap when a raised staff floats beside the
      // head. `corrida` is the longest UNBROKEN run, which ignores the staff and is the number to
      // read when a pose lifts something above the shoulder.
      let vao = 0, corrida = 0;
      const ate = m.ey0 + Math.round((m.ey1 - m.ey0) * 0.2);
      for (let y = m.ey0; y <= ate; y++) {
        let x0 = -1, x1 = -1, run = 0;
        for (let x = m.ex0; x <= m.ex1; x++) {
          if (rot[y * BW + x] === m.id) {
            if (x0 < 0) x0 = x; x1 = x; run++;
            if (run > corrida) corrida = run;
          } else run = 0;
        }
        if (x1 - x0 + 1 > vao) vao = x1 - x0 + 1;
      }
      m.cabecaVao = vao; m.cabecaRun = corrida;
      m.larg = m.ex1 - m.ex0 + 1; m.alt = alt;
      // head anchor: centroid of the ink in that same top fifth, the x the cutter registers on
      let hs = 0, hn = 0;
      for (let y = m.ey0; y <= ate; y++) for (let x = m.ex0; x <= m.ex1; x++)
        if (rot[y * BW + x] === m.id) { hs += x; hn++; }
      m.ancora = hn ? hs / hn : m.cx;
    }

    // ---- 6. the frame the cutter would emit ------------------------------------------------
    // Same arithmetic as recortar-folha.js: width is twice the largest reach from the head anchor
    // to either side, height is the tallest pose measured down to the shared ground line AFTER
    // the vertical squash, because a flattened set must not stay as tall as the arc it no longer
    // draws. Vertical numbers come off the top of each pose's own cell, which is the whole reason
    // a grid works at all.
    const esq = Math.ceil(Math.max(...grandes.map(m => m.ancora - m.ex0))) + 1;
    const dir = Math.ceil(Math.max(...grandes.map(m => m.ex1 - m.ancora))) + 1;
    const margem = Math.max(esq, dir);
    const FW = margem * 2 + 1;
    const topoCel = (m) => ROWS > 1 ? Math.round(m.linha * altCel) : 0;
    const rel = grandes.map(m => ({ ey0: m.ey0 - topoCel(m), ey1: m.ey1 - topoCel(m) }));
    const baseComum = Math.max(...rel.map(p => p.ey1));
    const FH = Math.ceil(Math.max(...rel.map(p =>
      baseComum - p.ey0 - (baseComum - p.ey1) * (1 - COMP)))) + 1;

    return {
      W, H, exato, tol4, tol16, tol48, brancos, transp,
      faixa: { x: bx0, y: y0, w: BW, h: BH },
      nTinta, nFranja, nFundo, nPagina, exatoFaixa, fundoFaixa, perim, hist,
      cores: cores.size, coresEstourou: estourou,
      total: manchas.length, fragmentos: fragmentos.length,
      areaFragmentos: fragmentos.reduce((n, m) => n + m.area, 0),
      quadros: grandes.map(m => ({
        larg: m.larg, alt: m.alt, area: m.area, linha: m.linha,
        x: m.ex0 + bx0, y: m.ey0 + y0,
        cabecaVao: m.cabecaVao, cabecaRun: m.cabecaRun
      })),
      FW, FH, margem
    };
  }, { src: dataUrl, COLS, ROWS, N, COMP }).catch(e => ({ falhou: e.message }));
  await browser.close();

  if (!M || M.falhou) {
    console.error('ERRO: nao foi possivel decodificar ' + SRC + (M && M.falhou ? ' (' + M.falhou + ')' : ''));
    process.exit(1);
  }

  const px = M.W * M.H;
  console.log('\nFOLHA  ' + SRC + '  (' + br(bytes.length / 1024) + ' kb, ' + ext + ')');

  // ---- imagem ----------------------------------------------------------------------------
  tit('1. IMAGEM');
  lin('dimensao', M.W + ' x ' + M.H + ' px');
  const razao = M.W / M.H;
  const rz = razao >= 1 ? f2(razao) + ':1' : '1:' + f2(1 / razao);
  lin('proporcao', rz + '   (SDXL degrada acima de ~2,5:1 — ' +
    (Math.max(razao, 1 / razao) > 2.5 ? 'ACIMA' : 'dentro') + ')');
  lin('pixels', br(px));
  lin('transparentes', br(M.transp) + '  (' + pc(M.transp, px) + ')');

  // ---- fundo -----------------------------------------------------------------------------
  tit('2. FUNDO MAGENTA');
  lin('#FF00FF exato', br(M.exato) + '  (' + pc(M.exato, px) + ' da imagem)');
  lin('a <=4 de #FF00FF', br(M.tol4) + '  (' + pc(M.tol4, px) + ')');
  lin('a <=16', br(M.tol16) + '  (' + pc(M.tol16, px) + ')');
  lin('a <=48', br(M.tol48) + '  (' + pc(M.tol48, px) + ')');
  lin('branco de pagina', br(M.brancos) + '  (' + pc(M.brancos, px) + ')');
  if (M.exato < M.tol16 * 0.9) {
    console.log('  nota: o fundo tem mais pixel PERTO de #FF00FF do que EXATO. Isso e assinatura');
    console.log('        de salvamento com perdas (JPEG/WEBP lossy), nao de prompt errado.');
  }
  if (M.semFaixa) {
    console.log('\n  Nenhuma linha da imagem e majoritariamente magenta. Sem fundo nao ha o que');
    console.log('  segmentar: as secoes 3 a 5 precisam de uma folha com fundo #FF00FF.');
    process.exit(0);
  }
  const F = M.faixa, faixaPx = F.w * F.h;
  lin('faixa de fundo', 'x ' + F.x + '..' + (F.x + F.w - 1) + ', y ' + F.y + '..' + (F.y + F.h - 1) +
    '  ->  ' + F.w + ' x ' + F.h);
  const rzF = F.w / F.h;
  lin('proporcao da faixa', (rzF >= 1 ? f2(rzF) + ':1' : '1:' + f2(1 / rzF)) + '   (' + pc(faixaPx, px) + ' da imagem)');
  lin('  dela: fundo', br(M.nFundo) + '  (' + pc(M.nFundo, faixaPx) + ')  — exato ' + pc(M.exatoFaixa, M.fundoFaixa) + ' do fundo');
  lin('  dela: tinta', br(M.nTinta) + '  (' + pc(M.nTinta, faixaPx) + ')');
  lin('  dela: franja', br(M.nFranja) + '  (' + pc(M.nFranja, faixaPx) + ')');
  lin('  dela: pagina', br(M.nPagina) + '  (' + pc(M.nPagina, faixaPx) + ')');
  const espessura = M.perim ? M.nFranja / M.perim : 0;
  lin('espessura da franja', f2(espessura) + ' px em media  (' + br(M.nFranja) + ' de mistura / ' +
    br(M.perim) + ' px de contorno)');
  console.log('        franja e o pixel que nao e nem personagem nem fundo: a mistura dos dois na');
  console.log('        borda. O recortador desmistura ate ~1 px sem deixar aro rosa; muito acima');
  console.log('        disso a folha foi borrada ou ampliada depois de gerada.');
  let modo = 1;
  for (let i = 2; i < M.hist.length; i++) if (M.hist[i] > M.hist[modo]) modo = i;
  const somaRuns = M.hist.reduce((n, v, i) => n + v * i, 0), qtRuns = M.hist.reduce((n, v) => n + v, 0);
  lin('pixel logico', 'moda ' + modo + ' px, media ' + f2(qtRuns ? somaRuns / qtRuns : 0) + ' px' +
    (modo > 1 ? '   (folha ampliada depois de gerada)' : ''));
  lin('cores na tinta', (M.coresEstourou ? '>300.000' : br(M.cores)));

  if (M.semTinta) {
    console.log('\n  A faixa nao tem tinta nenhuma. Nada a medir nas secoes 3 a 5.');
    process.exit(0);
  }

  // ---- manchas ---------------------------------------------------------------------------
  tit('3. MANCHAS');
  const Q = M.quadros;
  if (N) lin('esperado', N + ' quadros' + (COLS ? '  (grade ' + COLS + 'x' + ROWS + ')' : ''));
  lin('encontrado', Q.length + ' mancha' + (Q.length === 1 ? '' : 's') + ' grande' + (Q.length === 1 ? '' : 's'));
  lin('fragmentos', M.fragmentos + '  (<5% da maior, somando ' + br(M.areaFragmentos) + ' px)');
  if (N) {
    const dif = Q.length - N;
    lin('diferenca', dif === 0 ? 'nenhuma' : (dif > 0 ? '+' : '') + dif +
      (dif < 0 ? '   — manchas a menos: poses encostadas contam como uma' :
        '   — manchas a mais: algo solto virou figura'));
    if (COLS) {
      const porLinha = new Array(ROWS).fill(0);
      for (const q of Q) porLinha[q.linha]++;
      lin('por linha', porLinha.join(' | ') + '   (esperado ' +
        new Array(ROWS).fill(0).map((_, r) => Math.max(0, Math.min(COLS, N - r * COLS))).join(' | ') + ')');
    }
  }

  // ---- cabeca ----------------------------------------------------------------------------
  tit('4. LARGURA DA CABECA, QUADRO A QUADRO');
  console.log('  A cabeca e a unica medida que nao muda com a pose: a perna estica, o braco balanca,');
  console.log('  o pulo alonga o corpo inteiro, o cranio continua o cranio. Variacao grande entre');
  console.log('  quadros nao e pose diferente: e personagem diferente. O modelo nao guarda memoria');
  console.log('  de um canto da tela para o outro.\n');
  console.log('   #  lin     x       caixa       area   cabeca(vao)  cabeca(corrida)  alt/cab');
  const vaos = Q.map(q => q.cabecaVao), runs = Q.map(q => q.cabecaRun);
  const prop = Q.map(q => q.alt / (q.cabecaRun || 1));
  const est = (v) => {
    const m = v.reduce((a, x) => a + x, 0) / v.length;
    const sd = Math.sqrt(v.reduce((a, x) => a + (x - m) * (x - m), 0) / v.length);
    return { m, sd, min: Math.min(...v), max: Math.max(...v), cv: m ? 100 * sd / m : 0,
      amp: m ? 100 * (Math.max(...v) - Math.min(...v)) / m : 0 };
  };
  const eV = est(vaos), eR = est(runs), eP = est(prop);
  Q.forEach((q, i) => {
    const marca = q.cabecaRun === eR.min || q.cabecaRun === eR.max ? ' <' : '';
    console.log('  ' + String(i + 1).padStart(2) + '   ' + String(q.linha + 1).padStart(2) + '  ' +
      String(q.x).padStart(5) + '   ' +
      (q.larg + 'x' + q.alt).padStart(9) + '  ' + br(q.area).padStart(8) + '   ' +
      String(q.cabecaVao).padStart(8) + '   ' + String(q.cabecaRun).padStart(12) + '   ' +
      f1(q.alt / (q.cabecaRun || 1)).padStart(6) + marca);
  });
  console.log('');
  lin('cabeca (corrida)', 'media ' + f1(eR.m) + '  min ' + eR.min + '  max ' + eR.max +
    '  desvio ' + f1(eR.sd) + '  CV ' + f1(eR.cv) + '%');
  lin('  amplitude', f1(eR.amp) + '% da media   (max-min sobre a media)');
  lin('cabeca (vao)', 'media ' + f1(eV.m) + '  min ' + eV.min + '  max ' + eV.max +
    '  CV ' + f1(eV.cv) + '%');
  lin('altura/cabeca', 'media ' + f1(eP.m) + '  min ' + f1(eP.min) + '  max ' + f1(eP.max) +
    '  CV ' + f1(eP.cv) + '%');
  console.log('        vao = da primeira a ultima tinta da linha (mesma medida do medir-escala.js);');
  console.log('        corrida = maior trecho SEM buraco, imune a objeto erguido ao lado da cabeca.');
  console.log('        altura/cabeca mede proporcao: muda quando o modelo troca o corpo, nao o zoom.');

  // ---- escala ----------------------------------------------------------------------------
  tit('5. ESCALA CONTRA A ARTE ATUAL');
  console.log('  O que o test/recortar-folha.js emitiria desta folha com compressao ' + COMP + ', pela');
  console.log('  mesma aritmetica: largura = duas vezes o maior alcance da ancora da cabeca ate a');
  console.log('  borda, altura = a pose mais alta ate a linha de chao comum, ja achatada.\n');
  lin('quadro previsto', M.FW + ' x ' + M.FH + ' px   (margem ' + M.margem + ', compressao ' + COMP + ')');
  lin('cabeca desta folha', f1(eR.m) + ' px   (referencia: ' + f1(CABECA_REF) + ' px, a folha de andar)');
  // The pipeline picks the rescale factor from head width, never from frame size, because head
  // width is the only measure that survives a change of pose. Same reasoning as medir-escala.js.
  const R = CABECA_REF / eR.m;
  lin('fator de reescala', f2(R) + '   ->  node test/reescalar.js saida.json ' +
    R.toFixed(4) + ' saida2.json');
  const lr = Math.round(M.FW * R), hr = Math.round(M.FH * R);
  lin('  largura a esse fator', M.FW + ' -> ' + lr + ' px   (canvas fixo de ' + LARGURA_FINAL + ': ' +
    (lr > LARGURA_FINAL ? 'CORTA ' + (lr - LARGURA_FINAL) + ' px, ' + f1((lr - LARGURA_FINAL) / 2) + ' de cada lado'
      : 'sobra ' + (LARGURA_FINAL - lr) + ' px de folga') + ')');
  lin('  altura a esse fator', M.FH + ' -> ' + hr + ' px');
  const alvos = refAlvo ? [[refNome, refAlvo]] : Object.entries(REF);
  for (const [nome, [rw, rh]] of alvos) {
    const dh = hr - rh;
    console.log('  ' + (nome + ' ' + rw + 'x' + rh + ' ').padEnd(24, '.') +
      ' altura ' + hr + ' contra ' + rh + '   (' + (dh > 0 ? '+' : '') + dh + ' px)');
  }
  console.log('\n        o fator sai da CABECA, nao do tamanho do quadro: e a unica medida que nao');
  console.log('        muda com a pose. Fator abaixo de 1 reduz, que preserva detalhe; acima de 1');
  console.log('        AMPLIA, que inventa — folha pequena demais se regera, nao se estica.');
  console.log('        A largura final e um canvas fixo de ' + LARGURA_FINAL + ' px com a cabeca centrada, entao');
  console.log('        largura excedente e recortada dos lados, nao encolhida.');
  console.log('');
})();
