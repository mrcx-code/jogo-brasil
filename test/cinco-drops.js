// CONTRAPROVA: os quatro bots dos cinco minutos mediram ZERO drop nascido e ZERO chegada
// atendida. Antes de escrever isso num relatório, é preciso saber se o número é do JOGO ou
// do INSTRUMENTO — um embrulho que não pega a chamada interna mede zero para sempre.
//
// Aqui a mão é generosa: entra na rua e SEGURA o botão dourado (o repetidor de ~7 golpes/s)
// por 40 s. Se nem assim nascer drop, o zero é do jogo. E mede pelos dois caminhos: o
// embrulho (como os bots) e o estado do próprio jogo (S.recursos, drops.length), que não
// depende de embrulho nenhum.
//
//   node test/cinco-drops.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', process.env.JOGO_HTML || 'index.html'));

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const erros = [];
  page.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('CONSOLE: ' + m.text()); });
  await page.goto(ALVO);
  await page.waitForTimeout(900);

  await page.evaluate(() => {
    const Q = window.__D = { sol: 0, col: 0, che: 0 };
    const _s = window.soltarDrop; window.soltarDrop = function () { Q.sol++; return _s.apply(this, arguments); };
    const _c = window.coletarDrop; window.coletarDrop = function () { Q.col++; return _c.apply(this, arguments); };
    const _r = window.registrarChegada; window.registrarChegada = function (a) { if (a) Q.che++; return _r.apply(this, arguments); };
  });

  // entrar na rua pelo caminho do jogo, e pular a abertura como quem já leu
  const b = await page.locator('#btnJogar').boundingBox();
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(600);
  await page.evaluate(() => { if (typeof encerrarFala === 'function') encerrarFala(); fecharTudo(); });
  await page.waitForTimeout(400);

  // segurar o botão dourado por 40 s
  const c = await page.locator('#btnClique').boundingBox();
  await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
  await page.mouse.down();
  const marcos = [];
  for (let i = 1; i <= 4; i++) {
    await page.waitForTimeout(10000);
    marcos.push(await page.evaluate(() => ({
      s: Math.round(relogio),
      impacto: Math.round(S.energiaTotal),
      recursos: JSON.parse(JSON.stringify(S.recursos)),
      dropsNoChao: typeof drops !== 'undefined' ? drops.length : -1,
      mobsVivos: typeof mobs !== 'undefined' ? mobs.length : -1,
      embrulho: window.__D
    })));
  }
  await page.mouse.up();
  for (const m of marcos) console.log(JSON.stringify(m));
  await page.screenshot({ path: path.join(__dirname, 'CINCO-drops-40s-segurando.png') });
  console.log('erros: ' + (erros.length ? erros.join(' | ') : '(nenhum)'));
  await browser.close();
})().catch(e => { console.error('EXPLODIU:', e); process.exit(1); });
