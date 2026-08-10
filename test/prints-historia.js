// Prints da HISTÓRIA com o mundo parado. Duas fotos da MESMA fala, com 3 s entre elas:
// no ANTES a rua andou entre as duas (a personagem em outra pose, folha e chegada em outro
// lugar); no DEPOIS o quadro é o mesmo pixel a pixel atrás do texto.
//
//   git show <commit>:index.html > test/antes.html
//   ALVO=test/antes.html TAG=antes node test/prints-historia.js
//   TAG=depois node test/prints-historia.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}
const TAG = process.env.TAG || 'depois';
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', process.env.ALVO || 'index.html'));
(async () => {
  const b = await chromium.launch({ executablePath: chromiumPath() });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await p.goto(ALVO);
  await p.waitForTimeout(900);
  await p.evaluate(() => {
    fecharTelas();
    S.u3 = true; S.energiaTotal = 100; S.cenario = 0; S.modo = 'limpo';
    mobs.length = 0; drops.length = 0; folhas.length = 0;
    window.setHora(0.35);
  });
  await p.waitForTimeout(1500);          // deixa a rua povoar antes de a fala abrir
  await p.evaluate(() => abrirFala('PINDORAMA', 'antes de 1500',
    ['A terra ja tinha nome, e tinha gente que o dizia.'], null));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: path.resolve(__dirname, 'HIST-' + TAG + '-t0.png') });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: path.resolve(__dirname, 'HIST-' + TAG + '-t3.png') });
  const n = await p.evaluate(() => ({ worldX, mobs: mobs.length, folhas: folhas.length }));
  console.log(TAG, '-> depois de 3 s de fala:', JSON.stringify(n));
  await b.close();
})();
