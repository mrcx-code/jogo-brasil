// SONDA: por que A CURIOSA ficou 184 s parada na tela ESCOLHA A ERA?
//
// O bot toca no CENTRO de #listaCapitulos, que é o gesto de quem toca em tudo. Se o centro
// da lista cai num item que não responde, e nada na tela diz por quê, quem abriu esta tela
// no primeiro minuto não sai dela. Esta sonda mede o que existe no centro, item por item,
// com save VAZIO — o estado de quem acabou de abrir o jogo.
//
//   node test/cinco-lista-eras.js

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

  // O ESTADO EM QUE A CURIOSA ESTAVA aos 117 s: ela já tinha atravessado PINDORAMA e estava
  // em PALMARES — é a partir da 2ª era que o JOGAR abre a lista em vez de entrar direto
  // (l. 8038 do src/jogo.ts). A semente pula GRIND, não pula tela nenhuma: o toque medido
  // abaixo é o mesmo toque do bot, na mesma tela, montada pelo próprio jogo.
  await page.evaluate(() => {
    S.cenario = cenarioDaEpoca(1); S.fronteira = S.cenario; S.energiaTotal = 1500; S.energia = 1500;
  });
  await page.evaluate(() => { fecharTudo(); abrirTela('telaMenu'); });
  await page.waitForTimeout(300);
  const b = await page.locator('#btnJogar').boundingBox();
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(800);

  const info = await page.evaluate(() => {
    const g = id => document.getElementById(id);
    const lista = g('listaCapitulos');
    const r = lista.getBoundingClientRect();
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    const noCentro = document.elementFromPoint(cx, cy);
    return {
      telaAberta: ['telaMenu', 'telaCapitulos', 'telaFala'].filter(i => g(i) && g(i).classList.contains('aberta')),
      caixaLista: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      centro: { x: Math.round(cx), y: Math.round(cy) },
      noCentro: noCentro ? (noCentro.id || noCentro.className || noCentro.tagName) : '(nada)',
      itens: [...lista.children].map(el => {
        const c = el.getBoundingClientRect();
        return {
          classe: el.className,
          texto: (el.innerText || '').replace(/\n+/g, ' · ').trim().slice(0, 80),
          y: Math.round(c.y), h: Math.round(c.height),
          temOnclick: !!el.onclick,
          pegaOCentro: cy >= c.y && cy <= c.y + c.height
        };
      })
    };
  });
  console.log(JSON.stringify(info, null, 1));

  // agora o toque exato do bot, três vezes, medindo se alguma coisa muda
  const antes = await page.evaluate(() => ({ tela: [...document.querySelectorAll('.tela.aberta')].map(e => e.id).join(','), epoca: typeof S !== 'undefined' ? S.cenario : -1 }));
  for (let i = 0; i < 3; i++) { await page.touchscreen.tap(info.centro.x, info.centro.y); await page.waitForTimeout(500); }
  const depois = await page.evaluate(() => ({ tela: [...document.querySelectorAll('.tela.aberta')].map(e => e.id).join(','), epoca: typeof S !== 'undefined' ? S.cenario : -1 }));
  console.log('3 toques no centro — antes: ' + JSON.stringify(antes) + '  depois: ' + JSON.stringify(depois));

  // e o toque em cima da TÁBUA TRANCADA: uma pessoa acerta a tábua, não o vão. O que o jogo
  // responde a quem toca no que não está aberto ainda?
  const presa = info.itens.findIndex(i => /preso/.test(i.classe));
  if (presa >= 0) {
    const it = info.itens[presa];
    const y = it.y + it.h / 2;
    const antesP = await page.evaluate(() => document.body.innerHTML.length);
    for (let i = 0; i < 3; i++) { await page.touchscreen.tap(195, y); await page.waitForTimeout(400); }
    const dp = await page.evaluate(() => ({ tela: [...document.querySelectorAll('.tela.aberta')].map(e => e.id).join(','), html: document.body.innerHTML.length }));
    console.log('3 toques na TÁBUA TRANCADA (y=' + Math.round(y) + ') — tela: ' + dp.tela +
      ' | html mudou: ' + (dp.html !== antesP) + ' (antes ' + antesP + ', depois ' + dp.html + ')');
  }
  await page.screenshot({ path: path.join(__dirname, 'CINCO-curiosa-08-presa-nas-eras.png') });
  console.log('erros de console: ' + (erros.length ? erros.join(' | ') : '(nenhum)'));
  await browser.close();
})().catch(e => { console.error('EXPLODIU:', e); process.exit(1); });
