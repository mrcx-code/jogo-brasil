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
// Usage: slice_geral.js <sheet> <n frames> <saida.json> [compressaoVertical]
const fs = require('fs');
const { chromium } = require('playwright');

const SRC = process.argv[2];
const N = parseInt(process.argv[3], 10);
const OUT = process.argv[4];
const COMP = process.argv[5] === undefined ? 1 : parseFloat(process.argv[5]);
if (!SRC || !N || !OUT) { console.error('uso: slice_geral.js <sheet> <n> <saida.json> [comp]'); process.exit(1); }

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
    const { src, N, COMP } = args;
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
    const BW = bx1 - bx0 + 1, BH = y1 - y0 + 1, larg = BW / N;

    // ink: anything that is not background and not the white page around the band
    const tinta = new Uint8Array(BW * BH);
    for (let y = 0; y < BH; y++)
      for (let x = 0; x < BW; x++) {
        const i = at(bx0 + x, y0 + y);
        if (magentice(i) <= FUNDO && !branco(i) && d[i + 3] > 12) tinta[y * BW + x] = 1;
      }

    const poses = [];
    for (let k = 0; k < N; k++) {
      const a = Math.round(k * larg), b = Math.round((k + 1) * larg) - 1;
      let col = -1, colN = -1;
      for (let x = a; x <= b; x++) {
        let n = 0;
        for (let y = 0; y < BH; y++) if (tinta[y * BW + x]) n++;
        if (n > colN) { colN = n; col = x; }
      }
      if (colN <= 0) return { erro: 'celula ' + (k + 1) + ' vazia' };
      let sy = -1;
      for (let y = 0; y < BH; y++) if (tinta[y * BW + col]) { sy = y; break; }

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
      if (ex1 - ex0 + 1 > larg * 1.9) return { erro: 'a mancha do frame ' + (k + 1) + ' encostou na vizinha' };

      // register on the head: the lowest ink is the front foot on one beat and the back foot
      // on the next, so anchoring there makes her surge forward and back
      let hs = 0, hn = 0;
      const ate = ey0 + Math.round((ey1 - ey0) * 0.2);
      for (let y = ey0; y <= ate; y++) for (let x = 0; x < BW; x++) if (manter[y * BW + x]) { hs += x; hn++; }
      poses.push({ manter, ex0, ex1, ey0, ey1, cabeca: hn ? hs / hn : (ex0 + ex1) / 2 });
    }

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
          const tx = x + dx, ty = y + dy;
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
  }, { src: dataUrl, N, COMP });
  await browser.close();

  if (saida.erro) { console.error('ERRO:', saida.erro); process.exit(1); }
  fs.writeFileSync(OUT, JSON.stringify(saida));
  console.log(N, 'frames em', saida.frames[0].w + 'x' + saida.frames[0].h,
    '|', Math.round(saida.frames.reduce((n, f) => n + f.b64.length, 0) / 1024), 'kb');
})();
