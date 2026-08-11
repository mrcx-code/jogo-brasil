// A CAPA DO GLOSSARIO — o instrumento da tela de ASSUNTOS (Direcao de Arte, onda 12).
//
// O que ele faz que o olho sozinho nao faz:
//   1. FOTOGRAFA a tela de assuntos nas tres larguras da regua (375x812, 320x568, 1280x800)
//      com o localStorage LIMPO antes de cada foto — senao o painel "ENQUANTO VOCE ESTEVE
//      FORA" cobre a tela e a foto nao mostra o glossario.
//   2. MEDE o que decide se a capa funciona: quantas portas cabem na primeira tela sem rolar,
//      a altura de cada porta, a fase da porta contra a pauta de 11 px, e se o VOLTAR
//      continua dentro da tela. Numa capa, "quantas cabem" e' a metade do argumento.
//   3. Confere que a rolagem HORIZONTAL nao voltou (scrollWidth > clientWidth em qualquer
//      caixa da tela e' o defeito que esta tela existe para ter matado).
//
//   node test/prints-capa.js               -> prints CAPA-depois-*.png
//   ROTULO=antes node test/prints-capa.js  -> prints CAPA-antes-*.png
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ROT = process.env.ROTULO || 'depois';
const DIR = __dirname;
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
// A tela abre por `pointerdown` no botao do menu, e nao por .click(): e' assim que o jogo
// abre para o dedo, e e' o unico caminho que exercita o carimbo do gesto (glDaqui).
async function abrirGlossario(page) {
  await page.evaluate(() => {
    const b = document.getElementById('btnGlossario');
    if (b) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  });
}
const MEDE = () => {
  const box = document.getElementById('listaGlossario');
  const r = box.getBoundingClientRect();
  const portas = [...box.querySelectorAll('.glAssunto')];
  const v = document.getElementById('btnVoltarGloss').getBoundingClientRect();
  // "cabe" = a porta termina acima do pe visivel do rolo, sem precisar rolar
  const cabem = portas.filter(p => p.getBoundingClientRect().bottom <= r.bottom + 1).length;
  const alturas = portas.map(p => Math.round(p.getBoundingClientRect().height));
  // fase contra a pauta de 11: o topo de cada porta contra o topo do papel
  const fases = portas.slice(0, 8).map(p => Math.round(p.getBoundingClientRect().top - r.top + box.scrollTop) % 11);
  // rolagem horizontal em qualquer caixa da tela — o defeito que esta tela matou
  const horiz = [...document.querySelectorAll('#telaGlossario *')]
    .filter(e => e.scrollWidth > e.clientWidth + 1)
    .map(e => (e.id || e.className) + ' ' + e.scrollWidth + '>' + e.clientWidth);
  return {
    janela: window.innerHeight,
    portas: portas.length,
    cabemSemRolar: cabem,
    rolo: box.scrollHeight + ' px de conteudo em ' + Math.round(r.height) + ' px de janela',
    alturas: alturas.join(' '),
    fasePauta: fases.join(' '),
    voltarNaTela: v.bottom <= window.innerHeight,
    rolagemHorizontal: horiz.length ? horiz.join(' | ') : 'nenhuma'
  };
};
(async () => {
  const file = 'file://' + path.resolve(process.env.JOGO_HTML || path.join(__dirname, '..', 'index.html'));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  for (const vp of [{ width: 375, height: 812 }, { width: 320, height: 568 }, { width: 1280, height: 800 }]) {
    const movel = vp.width < 900;
    const page = await browser.newPage({ viewport: vp, hasTouch: true, isMobile: movel,
      deviceScaleFactor: movel ? 2 : 1 });
    page.on('pageerror', e => console.log('PAGEERROR', e.message));
    // localStorage limpo ANTES da carga: o painel de retorno cobre a tela inteira e a foto
    // sairia dele, nao do glossario.
    await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
    await page.goto(file);
    await page.waitForTimeout(1200);
    await abrirGlossario(page);
    await page.waitForTimeout(700);
    const m = await page.evaluate(MEDE);
    console.log('\n=== CAPA (' + ROT + ') ' + vp.width + 'x' + vp.height);
    Object.keys(m).forEach(k => console.log('  ' + k.padEnd(18) + ' ' + m[k]));
    await page.screenshot({ path: path.join(DIR, 'CAPA-' + ROT + '-' + vp.width + 'x' + vp.height + '.png') });
    // a lista de um assunto, para provar que a porta continua levando a algum lugar
    await page.evaluate(() => {
      const p = [...document.querySelectorAll('#listaGlossario .glAssunto')][3];
      if (p) p.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(DIR, 'CAPA-' + ROT + '-lista-' + vp.width + 'x' + vp.height + '.png') });
    await page.close();
  }
  await browser.close();
  console.log('\nprints CAPA-' + ROT + '-*.png em test/');
})();
