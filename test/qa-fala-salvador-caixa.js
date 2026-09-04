// A FALA NOVA CABE NA CAIXA? — medida em três telas, não numa só.
//
// Escrito pelo QA em 04/09 contra a alegação 8 de `entrega/salvador-fala-abertura`: "seis
// linhas na caixa a 390x844, sem rolagem (scrollHeight 197 = clientHeight 197)". A frase de
// abertura de SALVADOR passou de 170 para 239 caracteres — 40% mais texto — e uma medida numa
// tela só não responde à pergunta que interessa, que é se ela cabe na MENOR tela que o jogo
// atende. O teto de 260 do `encaixe.js` é uma régua de CARACTERES; caber é uma régua de PIXEL,
// e as duas não são a mesma coisa quando a largura muda.
//
// Ele anda pelo caminho da pessoa (`mostrarAbertura` + `avancarFala`, como o test/ver-capitulo.js),
// espera a linha TERMINAR de ser escrita — a caixa revela ~14 caracteres por segundo, e medir
// antes disso mede meia frase e passa — e só então lê `scrollHeight`/`clientHeight`.
//
//   node test/qa-fala-salvador-caixa.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const DIR = __dirname;
const TELAS = [[390, 844], [360, 640], [320, 568]];
const FALA = 4;            // EPOCAS[salvador].abertura[4] — a que a entrega reescreveu

let falhas = 0;
function ok(cond, msg) { console.log((cond ? '  ok    ' : '  FALHA ') + msg); if (!cond) falhas++; }

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  for (const [w, h] of TELAS) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await page.goto(ABRIR('file://' + path.resolve(DIR, '..', 'index.html')));
    await page.evaluate(() => { localStorage.clear(); });
    await page.reload();
    await page.waitForTimeout(900);
    await page.evaluate(() => {
      const e = EPOCAS.findIndex(x => x.id === 'salvador');
      fecharTudo(); entrarNaEpoca(e); redesenharFundo(); fecharTelas(); mostrarAbertura(undefined, true);
    });
    await page.waitForTimeout(4200);                       // a cerimônia do nome segura 3,4 s
    for (let i = 0; i < FALA; i++) {
      await page.waitForTimeout(400);
      await page.evaluate(() => avancarFala());            // termina a linha
      await page.waitForTimeout(200);
      await page.evaluate(() => avancarFala());            // vira a página
    }
    await page.waitForTimeout(500);
    await page.evaluate(() => avancarFala());              // completa a fala 5 sem virar
    await page.waitForTimeout(400);

    const m = await page.evaluate(function () {
      const txt = document.getElementById('falaTxt');
      const palco = document.getElementById('falaPalco');
      const caixa = document.getElementById('falaCaixa');
      const cs = getComputedStyle(txt);
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4;
      const r = txt.getBoundingClientRect();
      return {
        texto: txt.textContent,
        linhas: Math.round(r.height / lh),
        lh: +lh.toFixed(1),
        txt: { s: txt.scrollHeight, c: txt.clientHeight },
        palco: { s: palco.scrollHeight, c: palco.clientHeight },
        caixa: { s: caixa.scrollHeight, c: caixa.clientHeight, topo: caixa.getBoundingClientRect().top, base: caixa.getBoundingClientRect().bottom },
        janela: innerHeight
      };
    });
    const arq = path.join(DIR, 'QAFALA-salvador-' + w + 'x' + h + '.png');
    await page.screenshot({ path: arq });

    console.log('\n' + w + 'x' + h + ' — ' + m.texto.length + ' caracteres, ' + m.linhas + ' linhas (line-height ' + m.lh + ')');
    console.log('  falaTxt   ' + m.txt.s + '/' + m.txt.c + '   falaPalco ' + m.palco.s + '/' + m.palco.c +
      '   falaCaixa ' + m.caixa.s + '/' + m.caixa.c + '  (topo ' + Math.round(m.caixa.topo) + ', base ' + Math.round(m.caixa.base) + ' de ' + m.janela + ')');
    console.log('  print: ' + arq);
    ok(m.texto.indexOf('não se recolhe') >= 0, 'a fala medida é a nova (termina em "não se recolhe")');
    ok(m.palco.s <= m.palco.c + 1, 'o palco da fala não rola (' + m.palco.s + ' ≤ ' + m.palco.c + ')');
    ok(m.caixa.s <= m.caixa.c + 1, 'a caixa da fala não rola (' + m.caixa.s + ' ≤ ' + m.caixa.c + ')');
    ok(m.caixa.base <= m.janela + 1, 'a caixa termina dentro da tela (base ' + Math.round(m.caixa.base) + ' ≤ ' + m.janela + ')');
    await page.close();
  }
  await browser.close();
  console.log(falhas ? '\n' + falhas + ' FALHA(S)' : '\ntudo verde');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
