// O scroll do quadrinho: "amigável" ou "travadão"? — pedido do dono (2026-08-08):
// "o scroll tem que ser amigável e não assim travadão".
//
//   TAG=antes  ALVO=<html da main> node test/medir-scroll.js
//   TAG=depois node test/medir-scroll.js
//
// O que trava é `scroll-snap-type: y mandatory` + `scroll-snap-stop: always`: TODO gesto,
// por mais forte, para na página seguinte. O headless desta máquina não produz fling de
// toque (medido: touchmove chega, momentum não), então o instrumento mede com o que o
// ambiente dá, e mede as DUAS metades do pedido:
//   1. o gesto FORTE (synthesizeScrollGesture, distância de 3 páginas — o arremesso de um
//      polegar decidido): quantos até atravessar as 26 páginas? No `stop: always` a
//      resposta é sempre "uma página por gesto", e é esse o número do travadão.
//   2. o ARRASTO CURTO de dedo (dispatchTouchEvent, 300 px soltos a meia página): o
//      `mandatory` REBOBINA a página para onde estava — o leitor que quis espiar o começo
//      da página seguinte é devolvido. Com `proximity` o rolo fica onde o dedo deixou.
//   3. o encaixe que FICA: um arrasto que solta PERTO de uma borda (a ~90 px) tem que
//      assentar nela — é a metade do pedido que não pode morrer ("cada página assenta").
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

async function assentar(p) {
  await p.evaluate(() => new Promise((res) => {
    const el = document.getElementById('listaCenas');
    let last = -1, still = 0;
    const tick = () => {
      if (el.scrollTop === last) { if (++still >= 10) return res(null); }
      else { still = 0; last = el.scrollTop; }
      requestAnimationFrame(tick);
    };
    tick();
  }));
}

(async () => {
  const b = await chromium.launch({ executablePath: chromiumPath() });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await p.goto(ALVO);
  await p.waitForTimeout(900);
  await p.evaluate(() => {
    fecharTelas();
    S.cenario = TOTAL_CENAS - 1; S.energiaTotal = LIMIAR_FIM - 200;
    montarCompletude(); abrirTela('telaCompletude');
    document.getElementById('listaCenas').scrollTop = 0;
  });
  await p.waitForTimeout(600);
  const cdp = await p.context().newCDPSession(p);
  const medir = () => p.evaluate(() => {
    const el = document.getElementById('listaCenas');
    return { top: el.scrollTop, h: el.clientHeight, total: el.scrollHeight };
  });
  const m0 = await medir();
  const fim = m0.total - m0.h;

  // ---- 1. o gesto forte: pede 3 páginas ----
  let gestos = 0; const paradas = [];
  while (gestos < 60) {
    const antes = (await medir()).top;
    if (antes >= fim - 2) break;
    await cdp.send('Input.synthesizeScrollGesture', {
      x: 195, y: 500, xDistance: 0, yDistance: -(m0.h * 3), speed: 6000,
      gestureSourceType: 'mouse'
    });
    gestos++;
    await assentar(p);
    const dep = await medir();
    paradas.push(Math.round(dep.top / dep.h * 10) / 10);
    if (dep.top <= antes + 2) break;
  }
  console.log(TAG, '-> rolo de', (m0.total / m0.h).toFixed(1), 'telas |',
    'gestos fortes (3 páginas cada) até o fim:', gestos);
  console.log(TAG, '-> onde cada gesto parou (em páginas):', JSON.stringify(paradas));

  // ---- 2. o arrasto curto: 300 px soltos no meio da página ----
  async function arrastar(dy, passos, msPorPasso) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 620 }] });
    for (let i = 1; i <= passos; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 620 + dy * i / passos }] });
      await new Promise((r) => setTimeout(r, msPorPasso));
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await p.evaluate(() => { document.getElementById('listaCenas').scrollTop = 0; });
  await p.waitForTimeout(400);
  await arrastar(-300, 10, 16);
  await assentar(p);
  const c2 = await medir();
  console.log(TAG, '-> arrasto curto (300px): o rolo ficou em', c2.top,
    c2.top === 0 ? '(REBOBINADO para o começo)' : '(ficou onde o dedo deixou)');

  // ---- 3. soltar perto da borda tem que assentar nela ----
  await p.evaluate(() => { document.getElementById('listaCenas').scrollTop = 0; });
  await p.waitForTimeout(400);
  await arrastar(-750, 14, 16);   // solta a ~90 px da borda da página 2
  await assentar(p);
  const c3 = await medir();
  const resto3 = Math.round(c3.top % c3.h);
  console.log(TAG, '-> arrasto até ~90px da borda: parou em', c3.top,
    '(resto', resto3 + ')', '— assentou na borda:', resto3 <= 2 || resto3 >= c3.h - 2);
  await b.close();
})();
