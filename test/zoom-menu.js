// ZOOM NO POSTE — recortes ampliados da madeira atrás das tábuas, que é a queixa do dono
// ("a madeira atrás das opções tá estranho"). Sem ampliar, um mastro de 18 px não se julga.
//   ROTULO=antes node test/zoom-menu.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const ROTULO = process.env.ROTULO || 'depois';
(async () => {
  const file = ABRIR('file://' + path.resolve(process.env.JOGO_HTML || path.join(__dirname, '..', 'index.html')));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true,
    isMobile: true, deviceScaleFactor: 3 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(file);
  await page.waitForTimeout(1600);
  await page.evaluate(() => { abrirTela('telaMenu'); });
  await page.waitForTimeout(600);
  const caixas = await page.evaluate(() => {
    const p = document.getElementById('poste').getBoundingClientRect();
    const j = document.getElementById('btnJogar').getBoundingClientRect();
    const a = document.getElementById('btnConfig').getBoundingClientRect();
    return {
      topo: { x: Math.round(p.left + p.width / 2 - 45), y: Math.round(p.top - 10), width: 90, height: Math.round(j.top - p.top + 30) },
      meio: { x: Math.round(p.left + p.width / 2 - 45), y: Math.round(j.bottom - 6), width: 90, height: 30 },
      pe: { x: Math.round(p.left + p.width / 2 - 45), y: Math.round(a.bottom - 6), width: 90,
        height: Math.min(120, Math.round(window.innerHeight - a.bottom + 6)) },
    };
  });
  for (const k of Object.keys(caixas)) {
    const c = caixas[k];
    if (c.height <= 0 || c.width <= 0) { console.log('recorte ' + k + ' vazio', c); continue; }
    await page.screenshot({ path: path.join(__dirname, 'Z-poste-' + ROTULO + '-' + k + '.png'), clip: c });
    console.log('Z-poste-' + ROTULO + '-' + k + '.png', JSON.stringify(c));
  }
  // e a mesma coisa deitado
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(500);
  const cD = await page.evaluate(() => {
    const p = document.getElementById('poste').getBoundingClientRect();
    const a = document.getElementById('btnConfig').getBoundingClientRect();
    return { x: Math.round(p.left + p.width / 2 - 60), y: Math.round(a.bottom - 10), width: 120,
      height: Math.max(10, Math.round(window.innerHeight - a.bottom + 10)) };
  });
  await page.screenshot({ path: path.join(__dirname, 'Z-poste-' + ROTULO + '-deitado-pe.png'), clip: cD });
  console.log('Z-poste-' + ROTULO + '-deitado-pe.png', JSON.stringify(cD));
  await browser.close();
})();
