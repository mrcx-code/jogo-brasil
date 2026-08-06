// Print dos tres objetos de cada capitulo, parados no mesmo lugar, para julgar levitacao.
// node test/shot-objetos.js <sufixo>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const SUF = process.argv[2] || '';
(async () => {
  const file = 'file://' + path.resolve(__dirname, '..', 'index.html');
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(file);
  await page.waitForTimeout(1200);
  await page.evaluate(() => { if (typeof fecharTelas === 'function') fecharTelas(); if (typeof fecharTudo === 'function') fecharTudo(); });
  await page.waitForTimeout(200);
  for (const cena of [0, 2, 4]) {
    await page.evaluate((cena) => {
      S.cenario = cena; S.modo = 'limpo';
      mobs.length = 0; drops.length = 0; folhas.length = 0;
      proximoMob = 1e9; mobChao = 0; proximaFolha = 1e9; folhaChao = 0;
      ['smog', 'barrel', 'cash'].forEach(function (t, i) {
        const m = novoMob(t, worldX + 62 + i * 42);
        m.parado = true; m.espera = 1e9; m.hp = m.hpMax;
        mobs.push(m);
      });
    }, cena);
    await page.waitForTimeout(700);
    const cap = 1 + cena / 2;
    await page.screenshot({ path: path.resolve(__dirname, '..', 'shot-obj-cap' + cap + SUF + '.png'), clip: { x: 100, y: 420, width: 290, height: 200 } });
    console.log('cap' + cap + ' ok');
  }
  await browser.close();
})();
