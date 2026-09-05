// Prints do ACOLHIMENTO em PALMARES — quem chega, o toque, o meio, e ela ficando.
//
//   node test/prints-acolher.js     → test/ACOLHER-*.png
//
// O laço de quadro é CONGELADO para a foto sair no instante escolhido e não no que der: o
// acolhimento dura 1,6 s e o meio dele é o quadro que interessa (o anel do chão pela metade,
// sem barra de vida em cima de ninguém — §2.2). Com o laço parado, `atualizarMobs` é chamada
// à mão e `desenhar()` repinta o mundo.
//
// ATENÇÃO ao ler os prints: a GENTE é desenhada na camada da personagem (#heroHD), e essa
// camada é pintada pelo laço, não por `desenhar()` — com o laço congelado, as figuras ficam
// no último quadro vivo. Por isso a foto do "ela ficou" espera o laço voltar.
// E, sob `file://`, os pacotes de arte não são buscados: as figuras aparecem com a arte do
// capítulo 1. É a perda registrada no PENDENTES §8, não um defeito daqui.
const { chromium } = require('playwright');
const path = require('path');
const RAIZ = path.resolve(__dirname, '..');
const ABRIR = require('./abrir.js');

(async () => {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  pg.on('pageerror', e => console.log('PAGEERROR', e.message));
  await pg.goto(ABRIR('file://' + path.join(RAIZ, 'index.html')));
  await pg.waitForTimeout(1200);
  const geo = await pg.evaluate(() => {
    fecharTelas(); fecharTudo();
    S.aberturas = MASCARA_EPOCAS; S.fechos = MASCARA_EPOCAS; S.marcos = MASCARA_MARCOS;
    const c0 = cenarioDaEpoca(CAP_GENTE);
    S.cenario = c0; S.fronteira = c0; visitando = false;
    S.energiaTotal = LIMIAR_CENA * c0 + 200; S.energia = 5e5;
    S.modo = 'limpo';
    mobs.length = 0; drops.length = 0; grupo.length = 0; ficando.length = 0; S.grupo = 0;
    verificarCenario = function () {};
    proximoMob = 1e9;
    // CONGELA o laço de quadro: a foto tem de sair no instante escolhido, não no que der.
    // Mesma manobra do medir-luz.js — zerar o requestAnimationFrame do desenho contínuo.
    window.__raf = window.requestAnimationFrame;
    window.requestAnimationFrame = function () { return 0; };
    const m = novoMob('cash', worldX + HX + 60);
    m.parado = true; m.espera = 999;
    mobs.push(m);
    window.__alvo = m;
    desenhar();
    return { W: W, HX: HX, sx: Math.round(m.wx - worldX) };
  });
  console.log('geometria', JSON.stringify(geo));
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(RAIZ, 'test', 'ACOLHER-1-quem-chega.png') });
  const passo = async (dt, nome) => {
    const r = await pg.evaluate(function (dt) {
      const n = Math.round(dt * 60);
      for (let i = 0; i < n; i++) { atualizarMobs(1 / 60); }
      desenhar();
      const m = window.__alvo;
      return { acolhida: +(m.acolhida || 0).toFixed(2), frac: +fracAlcance(m).toFixed(2),
        sx: Math.round(m.wx - worldX), fila: grupo.length, drops: drops.length };
    }, dt);
    console.log(nome, JSON.stringify(r));
    await pg.waitForTimeout(200);
    await pg.screenshot({ path: path.join(RAIZ, 'test', nome) });
  };
  await pg.evaluate(() => { clicar(false, true, true); desenhar(); });
  await pg.waitForTimeout(200);
  await pg.screenshot({ path: path.join(RAIZ, 'test', 'ACOLHER-2-o-toque.png') });
  await passo(0.8, 'ACOLHER-3-no-meio.png');
  await passo(0.9, 'ACOLHER-4-ela-ficou-camada-velha.png');
  // A CAMADA DA GENTE é desenhada pelo laço de quadro (#heroHD, em desenharHeroiHD), não por
  // `desenhar()` — com o laço congelado, as figuras ficam no último quadro vivo. Para a foto
  // do "ela ficou" o laço volta.
  await pg.evaluate(() => { window.requestAnimationFrame = window.__raf; });
  await pg.waitForTimeout(500);
  const fim = await pg.evaluate(() => ({ fila: grupo.length, drops: drops.length, mobs: mobs.length }));
  console.log('ela ficou', JSON.stringify(fim));
  await pg.screenshot({ path: path.join(RAIZ, 'test', 'ACOLHER-4-ela-ficou.png') });
  await nav.close();
})();
