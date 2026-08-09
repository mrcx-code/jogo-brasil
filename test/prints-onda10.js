// Onda 10 — O RITMO DO ROLO: o instrumento fotografa o quadrinho NO MEIO das viradas,
// que é onde a onda inteira acontece (a penumbra da página que sai, o conteúdo que chega
// escalonado, a placa que pousa, a capa que abre por tempo).
//
//   TAG=antes  node test/prints-onda10.js     (na build da main, antes da onda)
//   TAG=depois node test/prints-onda10.js     (depois de npm run build)
//
// O que sai por rodada (prints O10-<tag>-*.png):
//   capa-t02 / capa-t09 / capa-t20  — a abertura da tela em três tempos (0,2 s / 0,9 s / 2 s):
//                                     a capa é a única transição POR TEMPO da tela
//   comum-f35 / comum-f60 / comum-f85 — a virada da página 7→8 (marco→momento comum) em três
//                                     frações: a página que sai deve APAGAR, a que chega acender
//   marco-f45 / marco-f80           — a virada 13→14 (PALMARES): a placa no meio do pouso
//   dura-f35 / dura-f60 / dura-f90  — a virada 11→12 (a travessia forçada): o quadro deve
//                                     ficar SOZINHO um instante; o papel chega tarde
//   papel-f55                       — a virada 21→22 (página de PAPEL): o caderno abrindo
//                                     (armadilha própria, paga: fotografar a MENOS de
//                                     ~800 ms de abrirTela pega o crossfade das telas e
//                                     o menu aparece fantasmado no quadro)
// E os números:
//   - opacity do véu de penumbra (::after) da página que sai, a meio-exit — ANTES é 0 sempre
//   - scroll-snap-stop computado nos marcos e nas duras — ANTES é "normal" em tudo
//   - contagem de animações scroll-driven numa página comum e numa dura
//
// Armadilha herdada da onda 8, ainda válida: o encaixe re-encaixa scrollTop programático;
// para fotografar meio de virada o snap é solto SÓ durante as fotos.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}
const TAG = process.env.TAG || 'depois';
const ALVO = 'file://' + path.resolve(__dirname, '..', process.env.ALVO || 'index.html');
const shot = (p, nome) => p.screenshot({ path: path.resolve(__dirname, 'O10-' + TAG + '-' + nome + '.png') });
(async () => {
  const b = await chromium.launch({ executablePath: chromiumPath() });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await p.goto(ALVO);
  await p.waitForTimeout(900);

  // ---- A CAPA: a única transição por tempo — fotografada logo ao abrir ----
  await p.evaluate(() => {
    fecharTelas();
    S.cenario = TOTAL_CENAS - 1; S.energiaTotal = LIMIAR_FIM - 200;
    window.setHora(0.30);
    montarCompletude(); abrirTela('telaCompletude');
  });
  await p.waitForTimeout(200);  await shot(p, 'capa-t02');
  await p.waitForTimeout(700);  await shot(p, 'capa-t09');
  await p.waitForTimeout(1100); await shot(p, 'capa-t20');

  // ---- meio de virada: snap solto SÓ para as fotos ----
  const meia = async (paginaQueChega, frac, nome) => {
    await p.evaluate(({ pg, f }) => {
      const el = document.getElementById('listaCenas');
      el.style.scrollSnapType = 'none';
      // a página N fica inteira em (N-1)*h; a virada (N-1)→N corre de (N-2)*h a (N-1)*h
      el.scrollTop = el.clientHeight * (pg - 2 + f);
    }, { pg: paginaQueChega, f: frac });
    await p.waitForTimeout(120);
    await shot(p, nome);
  };
  // virada comum: 7 (marco PINDORAMA) → 8 (momento com paisagem)
  await meia(8, 0.35, 'comum-f35');
  await meia(8, 0.60, 'comum-f60');
  // a meio-exit, o véu da página que sai — medido na página 7 (a 3ª .qQuadro é irrelevante:
  // pega-se o quadro cujo topo está ACIMA do viewport e o fundo ainda dentro)
  const veu = await p.evaluate(() => {
    const el = document.getElementById('listaCenas');
    const quadros = Array.from(el.querySelectorAll('.qQuadro'));
    const saindo = quadros.find((q) => {
      const r = q.getBoundingClientRect();
      return r.top < -10 && r.bottom > 60;
    });
    if (!saindo) return { achou: false };
    const cs = getComputedStyle(saindo, '::after');
    return { achou: true, opacity: cs.opacity, animacoes: saindo.getAnimations({ subtree: true }).length };
  });
  await meia(8, 0.85, 'comum-f85');
  // marco: 13 (momento de Palmares) → 14 (marco PALMARES): a placa no meio do pouso
  await meia(14, 0.45, 'marco-f45');
  await meia(14, 0.80, 'marco-f80');
  // dura: 11 (a terra esvaziada) → 12 (a travessia forçada): o papel chega TARDE
  await meia(12, 0.35, 'dura-f35');
  await meia(12, 0.60, 'dura-f60');
  await meia(12, 0.90, 'dura-f90');
  // papel: 21 (1888) → 22 (a Constituinte, página de papel): o caderno abre
  await meia(22, 0.55, 'papel-f55');

  // ---- números ----
  const nums = await p.evaluate(() => {
    const el = document.getElementById('listaCenas');
    const quadros = Array.from(el.querySelectorAll('.qQuadro'));
    const stopDe = (q) => getComputedStyle(q).scrollSnapStop;
    const marcos = quadros.filter((q) => q.classList.contains('qMarco')).map(stopDe);
    const duras = quadros.filter((q) => q.classList.contains('qDura')).map(stopDe);
    const comuns = quadros.filter((q) => !q.classList.contains('qMarco') && !q.classList.contains('qDura')).map(stopDe);
    return {
      paginas: quadros.length,
      marcos: marcos.join(','), duras: duras.join(','),
      comunsComStop: comuns.filter((s) => s === 'always').length,
      anims11: quadros[10] ? quadros[10].getAnimations({ subtree: true }).length : -1,
      anims12: quadros[11] ? quadros[11].getAnimations({ subtree: true }).length : -1
    };
  });
  await p.evaluate(() => { document.getElementById('listaCenas').style.scrollSnapType = ''; });
  console.log(TAG, '-> páginas:', nums.paginas,
    '| snap-stop marcos: [' + nums.marcos + '] duras: [' + nums.duras + ']',
    '| comuns com stop:', nums.comunsComStop);
  console.log(TAG, '-> véu da página que sai a meio-exit: opacity',
    veu.achou ? veu.opacity : '(quadro não achado)',
    '| animações no quadro que sai:', veu.achou ? veu.animacoes : '-');
  console.log(TAG, '-> animações scroll-driven: página 11 (comum):', nums.anims11,
    '| página 12 (dura):', nums.anims12);
  await b.close();
})();
