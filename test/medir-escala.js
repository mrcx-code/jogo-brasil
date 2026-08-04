// Head width is the one measure that does not move with the pose: legs extend, arms swing, the
// skull stays the skull. Widest ink run inside the top fifth of each figure.
const fs = require('fs');
const { chromium } = require('playwright');
function chromiumPath() { return process.env.PW_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined); }
(async () => {
  const b = await chromium.launch({ executablePath: chromiumPath() });
  const p = await b.newPage();
  const medir = async (jsonPath) => {
    const dados = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    return p.evaluate(async (fr) => {
      const imgs = await Promise.all(fr.map(f => new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = f.b64; })));
      return imgs.map(im => {
        const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
        const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data;
        const on = (x, y) => d[(y * c.width + x) * 4 + 3] > 40;
        let t = -1, bt = -1;
        for (let y = 0; y < c.height; y++) { let h = false; for (let x = 0; x < c.width && !h; x++) if (on(x, y)) h = true; if (h) { t = y; break; } }
        for (let y = c.height - 1; y >= 0; y--) { let h = false; for (let x = 0; x < c.width && !h; x++) if (on(x, y)) h = true; if (h) { bt = y; break; } }
        const ate = t + Math.round((bt - t) * 0.2);
        let larguraMax = 0;
        for (let y = t; y <= ate; y++) {
          let x0 = -1, x1 = -1;
          for (let x = 0; x < c.width; x++) if (on(x, y)) { if (x0 < 0) x0 = x; x1 = x; }
          if (x1 - x0 + 1 > larguraMax) larguraMax = x1 - x0 + 1;
        }
        return larguraMax;
      });
    }, dados.frames);
  };
  const andar = await medir(process.argv[2]);
  const pulo = await medir(process.argv[3]);
  await b.close();
  const mA = andar.reduce((a, x) => a + x, 0) / andar.length;
  const mP = pulo.reduce((a, x) => a + x, 0) / pulo.length;
  console.log('cabeca andando:', andar.join(', '), '-> media', mA.toFixed(1));
  console.log('cabeca pulando:', pulo.join(', '), '-> media', mP.toFixed(1));
  console.log('razao a aplicar no pulo:', (mA / mP).toFixed(4));
})();
