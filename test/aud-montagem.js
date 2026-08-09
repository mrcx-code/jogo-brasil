const { chromium } = require('playwright');
const path = require('path');
const ALVO = 'file://' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/');
(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await pg.goto(ALVO); await pg.waitForTimeout(1200);
  await pg.evaluate(async () => {
    const lista = CENARIO_ALTO_B64;
    const cw = 55, ch = 119;   // cover 390x844 em miniatura, 7 lado a lado = 385
    const cv = document.createElement('canvas'); cv.width = cw * lista.length; cv.height = ch;
    const cx = cv.getContext('2d');
    for (let i = 0; i < lista.length; i++) {
      const img = new Image();
      await new Promise((ok) => { img.onload = ok; img.src = lista[i]; });
      const esc = Math.max(cw / img.width, ch / img.height);
      const dw = img.width * esc, dh = img.height * esc;
      cx.save(); cx.beginPath(); cx.rect(i * cw, 0, cw, ch); cx.clip();
      cx.drawImage(img, i * cw + (cw - dw) / 2, (ch - dh) / 2, dw, dh); cx.restore();
    }
    cv.id = 'audMontagem';
    cv.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;background:#000;image-rendering:pixelated;width:390px;height:auto';
    document.body.appendChild(cv);
  });
  const clip = await pg.evaluate(() => { const b = document.getElementById('audMontagem').getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; });
  await pg.screenshot({ path: path.join(__dirname, 'AUD-pinturas-lado-a-lado.png'), clip });
  await nav.close();
})();
