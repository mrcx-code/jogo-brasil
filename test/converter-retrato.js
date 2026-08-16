// PNG magenta de entrada -> mestre webp do retrato de fala (assets/objetos/retrato-*.webp).
//
//   node test/converter-retrato.js cap-cais-retrato:retrato-cais [mais pares...]
//
// Mesmo desfranje do pipeline de sprites (min(R,B)-G vira alfa, cor desmisturada), depois
// apara as margens transparentes e reduz para ALTURA 300 — a caixa do retrato de fala mede
// 132x300 CSS e os mestres antigos sao 112x300: manter a mesma regua e o que faz os treze
// retratos pesarem ~12 KB cada em vez de 1,8 MB.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const RAIZ = path.resolve(__dirname, '..');
const pares = process.argv.slice(2).map(a => a.split(':'));
if (!pares.length) { console.error('uso: converter-retrato.js entrada:saida ...'); process.exit(1); }
(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage();
  for (const [ent, sai] of pares) {
    const b64 = 'data:image/png;base64,' +
      fs.readFileSync(path.join(RAIZ, 'assets', 'entrada', ent + '.png')).toString('base64');
    const uri = await pg.evaluate(async (u) => {
      const im = new Image(); im.src = u; await im.decode();
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height);
      const px = d.data;
      for (let i = 0; i < px.length; i += 4) {
        const m = Math.max(0, Math.min(px[i], px[i + 2]) - px[i + 1]);   // quao magenta
        const a = Math.max(0, 255 - m);
        if (a < 250) {                                    // desmistura a cor da borda
          const f = a / 255;
          if (f > 0.02) {
            px[i] = Math.min(255, (px[i] - 255 * (1 - f)) / f);
            px[i + 2] = Math.min(255, (px[i + 2] - 255 * (1 - f)) / f);
          }
          px[i + 3] = a < 30 ? 0 : a;
        }
      }
      g.putImageData(d, 0, 0);
      // apara
      let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        if (px[(y * c.width + x) * 4 + 3] > 20) {
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
      const H = 300, W = Math.round((x1 - x0 + 1) * H / (y1 - y0 + 1));
      const c2 = document.createElement('canvas'); c2.width = W; c2.height = H;
      const g2 = c2.getContext('2d'); g2.imageSmoothingQuality = 'high';
      g2.drawImage(c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, W, H);
      return c2.toDataURL('image/webp', 0.76);
    }, b64);
    const buf = Buffer.from(uri.split(',')[1], 'base64');
    fs.writeFileSync(path.join(RAIZ, 'assets', 'objetos', sai + '.webp'), buf);
    console.log(sai + '.webp  ' + (buf.length / 1024).toFixed(0) + ' KB');
  }
  await nav.close();
})();
