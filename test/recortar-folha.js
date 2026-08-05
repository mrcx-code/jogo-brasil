// One slicer for every sheet, and this time it de-fringes.
//
// The earlier cuts tested for magenta strictly — R and B both above 180, G below 90 — and kept
// everything else at full opacity. But the pixels along her outline are a BLEND of the
// character and the magenta behind her: a half-and-half edge pixel comes out around
// (190, 60, 160), which fails that test, so it survived at alpha 255 and painted a pink rim
// around every frame. That rim is the "sobra" on the character.
//
// The fix measures how magenta a pixel is instead of asking yes or no. Magenta is the colour
// where red and blue are both high and green is low, so min(R,B) - G is near 255 for the
// background, near zero for skin, cloth and hair, and somewhere in between exactly on the
// blended edge. That number drives the alpha, and the colour is un-blended from it, which
// recovers what the pixel would have been over nothing at all.
//
// The sheet is either a horizontal strip (N frames side by side) or a GRID of C columns by R
// rows, read left to right and top to bottom. The grid exists because the image model cannot
// draw a 12.6:1 strip — past roughly 1:2.5 it degrades and duplicates bodies — so a twelve-pose
// sheet is generated as 1024x1024 in 4 columns by 3 rows and cut from there. A strip is simply
// the R = 1 case and walks the same code, not a second path.
//
// The one thing a grid needs that a strip does not is a PER-CELL baseline. Every vertical
// measurement — the shared ground line, the bounce each pose keeps above it, the flattening —
// is taken from the top of the pose's OWN cell rather than the top of the sheet. Measured from
// the sheet, a pose on the second row sits a whole cell lower than one on the first, and the
// common baseline would drag it off the canvas. When R = 1 the cell top is 0 and every number
// below is the number the strip has always produced.
//
// KEEPING ONLY SOME OF THE CELLS, IN A CHOSEN ORDER. --quadros=6,5,2 emits three frames, in
// that order, and ignores the other nine. It exists because a generated sheet is a bag of
// poses, not a cycle: the walk sheet of chapter 1 has twelve figures of the same person but
// only three distinct PHASES, the rest being near-duplicates a couple of sprite px apart.
// Feeding all twelve to a distance-driven walk makes the foot stall for several frames, which
// reads as a limp. The selection happens AFTER every cell is measured, so the cells are found
// exactly as they always were; it is the shared margin, the common ground line and the canvas
// size that are then computed over the kept frames alone — which is what they should be, since
// a discarded pose has no business setting the canvas for the ones that ship.
//
// Usage: recortar-folha.js <sheet> <N | CxR | CxR:N> <saida.json> [compressaoVertical] [--quadros=a,b,c]
//   12      12 frames side by side           (the strip, unchanged)
//   4x3     4 columns by 3 rows, 12 frames   (reading order: left to right, top to bottom)
//   3x3:7   the first 7 cells of a 3x3 grid  (for a grid whose last row is not full)
const fs = require('fs');
const { chromium } = require('playwright');

const argv = process.argv.slice(2);
const QARG = argv.find(a => a.startsWith('--quadros='));
const pos = argv.filter(a => !a.startsWith('--'));
const SRC = pos[0];
const GRADE = pos[1];
const OUT = pos[2];
const COMP = pos[3] === undefined ? 1 : parseFloat(pos[3]);
// 1-based, in the order they should come out; repeats are allowed (a pose may serve twice)
const QUADROS = QARG ? QARG.slice(10).split(',').map(s => parseInt(s, 10)) : null;

const USO = 'uso: recortar-folha.js <sheet> <N | CxR | CxR:N> <saida.json> [comp] [--quadros=a,b,c]';
// "12" parses as C=12, R=1: the strip is the one-row grid, so there is nothing to keep in sync
const gr = /^(\d+)(?:[xX](\d+))?(?::(\d+))?$/.exec(GRADE || '');
if (!SRC || !gr || !OUT) { console.error(USO); process.exit(1); }
const COLS = parseInt(gr[1], 10);
const ROWS = gr[2] === undefined ? 1 : parseInt(gr[2], 10);
const N = gr[3] === undefined ? COLS * ROWS : parseInt(gr[3], 10);
if (!COLS || !ROWS || !N) { console.error(USO); process.exit(1); }
if (N > COLS * ROWS) {
  console.error('ERRO: ' + N + ' quadros nao cabem numa grade ' + COLS + 'x' + ROWS +
    ', que tem ' + COLS * ROWS + ' celulas');
  process.exit(1);
}
if (QUADROS && (!QUADROS.length || QUADROS.some(q => !(q >= 1 && q <= N)))) {
  console.error('ERRO: --quadros aceita indices de 1 a ' + N);
  process.exit(1);
}

function chromiumPath() {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM;
  if (fs.existsSync('/opt/pw-browsers/chromium')) return '/opt/pw-browsers/chromium';
  return undefined;
}
const ext = SRC.toLowerCase().endsWith('.webp') ? 'webp' : 'png';
const dataUrl = 'data:image/' + ext + ';base64,' + fs.readFileSync(SRC).toString('base64');

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage();
  const saida = await page.evaluate(async (args) => {
    const { src, N, COLS, ROWS, COMP, QUADROS } = args;
    const im = await new Promise((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src;
    });
    const W = im.naturalWidth, H = im.naturalHeight;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, W, H).data;
    const at = (x, y) => (y * W + x) * 4;

    // 0 for anything that is plainly the character, 1 for the background, in between on the edge
    function magentice(i) {
      const r = d[i], vd = d[i + 1], b = d[i + 2];
      return Math.max(0, Math.min(r, b) - vd) / 255;
    }
    const FUNDO = 0.42;    // above this the pixel is background and goes entirely
    const BORDA = 0.14;    // below this it is the character and keeps full opacity
    const branco = (i) => d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235;

    // the band: rows that are mostly background
    let y0 = -1, y1 = -1;
    for (let y = 0; y < H; y++) {
      let m = 0, n = 0;
      for (let x = 0; x < W; x += 4) { n++; if (magentice(at(x, y)) > FUNDO) m++; }
      if (m / n > 0.5) { if (y0 < 0) y0 = y; y1 = y; }
    }
    if (y0 < 0) { y0 = 0; y1 = H - 1; }
    let bx0 = W, bx1 = -1;
    for (let x = 0; x < W; x++) {
      let m = false;
      for (let y = y0; y <= y1 && !m; y++) if (magentice(at(x, y)) > FUNDO) m = true;
      if (m) { if (x < bx0) bx0 = x; bx1 = x; }
    }
    if (bx1 < 0) { bx0 = 0; bx1 = W - 1; }
    const BW = bx1 - bx0 + 1, BH = y1 - y0 + 1;
    // equal cells, never a split on empty columns: an object in the hand crosses the cell line
    const larg = BW / COLS, alt = BH / ROWS;   // ROWS = 1 makes alt the whole band, as before

    // ink: anything that is not background and not the white page around the band
    const tinta = new Uint8Array(BW * BH);
    for (let y = 0; y < BH; y++)
      for (let x = 0; x < BW; x++) {
        const i = at(bx0 + x, y0 + y);
        if (magentice(i) <= FUNDO && !branco(i) && d[i + 3] > 12) tinta[y * BW + x] = 1;
      }

    let poses = [];
    for (let k = 0; k < N; k++) {
      // reading order: left to right, top to bottom. With ROWS = 1 this is cx = k, cy = 0.
      const cx = k % COLS, cy = (k / COLS) | 0;
      const a = Math.round(cx * larg), b = Math.round((cx + 1) * larg) - 1;
      const topo = Math.round(cy * alt), baixo = Math.round((cy + 1) * alt) - 1;
      let col = -1, colN = -1;
      for (let x = a; x <= b; x++) {
        let n = 0;
        for (let y = topo; y <= baixo; y++) if (tinta[y * BW + x]) n++;
        if (n > colN) { colN = n; col = x; }
      }
      if (colN <= 0) return { erro: 'celula ' + (k + 1) + ' vazia' };
      let sy = -1;
      for (let y = topo; y <= baixo; y++) if (tinta[y * BW + col]) { sy = y; break; }

      // flood the whole band so the wand, which crosses the cell line, comes along
      const manter = new Uint8Array(BW * BH);
      const pilha = [sy * BW + col]; manter[sy * BW + col] = 1;
      while (pilha.length) {
        const p = pilha.pop(), px = p % BW, py = (p / BW) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx, ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= BW || ny >= BH) continue;
          const q = ny * BW + nx;
          if (tinta[q] && !manter[q]) { manter[q] = 1; pilha.push(q); }
        }
      }

      let ex0 = BW, ex1 = -1, ey0 = BH, ey1 = -1;
      for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) if (manter[y * BW + x]) {
        if (x < ex0) ex0 = x; if (x > ex1) ex1 = x;
        if (y < ey0) ey0 = y; if (y > ey1) ey1 = y;
      }
      // the flood is deliberately NOT clipped to the cell, so a held object crossing the cell
      // line comes along; these two size checks are what catches a blob that ran into a
      // neighbour instead. With ROWS = 1, alt is the whole band and the vertical one never fires.
      if (ex1 - ex0 + 1 > larg * 1.9) return { erro: 'a mancha do frame ' + (k + 1) + ' encostou na vizinha' };
      if (ey1 - ey0 + 1 > alt * 1.9) return { erro: 'a mancha do frame ' + (k + 1) + ' encostou na de cima ou na de baixo' };

      // register on the head: the lowest ink is the front foot on one beat and the back foot
      // on the next, so anchoring there makes her surge forward and back
      let hs = 0, hn = 0;
      const ate = ey0 + Math.round((ey1 - ey0) * 0.2);
      for (let y = ey0; y <= ate; y++) for (let x = 0; x < BW; x++) if (manter[y * BW + x]) { hs += x; hn++; }
      // every vertical number is stored relative to the top of the pose's own cell, so that poses
      // on different rows share one ground line. topo is 0 when ROWS is 1, leaving these as they
      // were. x needs no such shift: the head anchor is only ever used as a difference in x.
      poses.push({ manter, topo, ex0, ex1, ey0: ey0 - topo, ey1: ey1 - topo, cabeca: hn ? hs / hn : (ex0 + ex1) / 2 });
    }

    // from here on "poses" means the poses that SHIP: margin, ground line and canvas are
    // measured over those alone, so a discarded pose cannot inflate the frame
    if (QUADROS) poses = QUADROS.map(q => poses[q - 1]);

    const esq = Math.ceil(Math.max(...poses.map(p => p.cabeca - p.ex0))) + 1;
    const dir = Math.ceil(Math.max(...poses.map(p => p.ex1 - p.cabeca))) + 1;
    const margem = Math.max(esq, dir);
    const baseComum = Math.max(...poses.map(p => p.ey1));
    const FW = margem * 2 + 1;
    // the canvas has to fit each pose AFTER its lift, or a flattened set stays as tall as the
    // arc it no longer draws
    const FH = Math.max(...poses.map(function (p) {
      return baseComum - p.ey0 - (baseComum - p.ey1) * (1 - COMP);
    })) + 1;
    const FHi = Math.ceil(FH);

    const frames = [];
    for (const p of poses) {
      const fc = document.createElement('canvas'); fc.width = FW; fc.height = FHi;
      const fg = fc.getContext('2d');
      const img = fg.createImageData(FW, FHi);
      const lift = (baseComum - p.ey1) * (1 - COMP);   // COMP<1 flattens the bounce
      const dx = Math.round(margem - p.cabeca), dy = Math.round(FHi - 1 - baseComum + lift);
      for (let y = 0; y < BH; y++) {
        for (let x = 0; x < BW; x++) {
          if (!p.manter[y * BW + x]) continue;
          const tx = x + dx, ty = y - p.topo + dy;   // p.topo is 0 for a strip
          if (tx < 0 || ty < 0 || tx >= FW || ty >= FHi) continue;
          const s = at(bx0 + x, y0 + y), t = (ty * FW + tx) * 4;
          const m = magentice(s);
          // alpha falls off across the blended edge instead of snapping from 255 to 0
          let al = 1;
          if (m > BORDA) al = Math.max(0, 1 - (m - BORDA) / (FUNDO - BORDA));
          if (al <= 0.02) { img.data[t + 3] = 0; continue; }
          // un-blend: observed = al*F + (1-al)*fundo, so F = (observed - (1-al)*fundo)/al
          const un = (v, fundo) => Math.max(0, Math.min(255, Math.round((v - (1 - al) * fundo) / al)));
          img.data[t] = un(d[s], 255);
          img.data[t + 1] = un(d[s + 1], 0);
          img.data[t + 2] = un(d[s + 2], 255);
          img.data[t + 3] = Math.round(al * 255);
        }
      }
      fg.putImageData(img, 0, 0);
      frames.push({ w: FW, h: FHi, b64: fc.toDataURL('image/webp', 0.92) });
    }
    return { frames };
  }, { src: dataUrl, N, COLS, ROWS, COMP, QUADROS });
  await browser.close();

  if (saida.erro) { console.error('ERRO:', saida.erro); process.exit(1); }
  fs.writeFileSync(OUT, JSON.stringify(saida));
  const kb = Math.round(saida.frames.reduce((n, f) => n + f.b64.length, 0) / 1024);
  // the strip's line is left exactly as it was, so a grid announces itself and nothing else moves
  console.log(saida.frames.length, 'frames em', saida.frames[0].w + 'x' + saida.frames[0].h,
    '|', kb + ' kb' + (ROWS > 1 ? ' | grade ' + COLS + 'x' + ROWS : '') +
    (QUADROS ? ' | de ' + N + ', mantidos ' + QUADROS.join(',') : ''));
})();
