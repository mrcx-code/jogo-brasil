// O VERBO DE SALVADOR, EM PRINT — porque o smoke garante que não quebrou, nunca que ficou bom.
//
// Encena o mesmo quadro três vezes, do MESMO worldX e na mesma hora do dia, para que a única
// diferença entre as imagens seja o que este ticket mudou:
//
//   PALAVRA-A-espera  : três pessoas esperando na ladeira, nenhuma alcançada.
//   PALAVRA-B-corrente: a mais próxima foi alcançada e virou PORTADORA — sobe a ladeira com a
//                       luz apertada que ela leva junto, enquanto as outras ainda têm o anel
//                       largo do lugar de espera. É o par que decide se o sinal se lê.
//   PALAVRA-C-rua     : dois segundos depois, sem dedo nenhum — a palavra correu.
//
// node test/prints-palavra.js [index.html] [prefixo]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}
const ARQ = process.argv[2] || path.resolve(__dirname, '..', 'index.html');
const PREFIXO = process.argv[3] || 'PALAVRA';

// Montagem comum: a mesma rua, do mesmo lugar, sem folha e sem chegada nova para o quadro
// não mudar por baixo da comparação.
const MONTAR = `
  mobs.length = 0; drops.length = 0; folhas.length = 0; floats.length = 0; parts.length = 0;
  proximoMob = 1e9; proximaFolha = 1e9;
  palavraDedo = 0; palavraCorrente = 0;
  worldX = window.__wx0;
  [30, 90, 130].forEach(function (dx) {
    const m = novoMob('smog', worldX + HX + dx);
    m.parado = true; m.espera = 999;
    mobs.push(m);
  });
`;
const ALCANCAR = `
  let n = 0; while (mobs[0].hp > 0 && n < 40) { clicar(false, true, true); n++; }
`;
const ANDAR = (q) => `
  for (let i = 0; i < ${q}; i++) { atualizarMobs(1/60); atualizarDrops(1/60); worldX += velocidadeMundo()/60; }
`;
const CENAS = [
  ['A-espera', MONTAR + 'desenhar();'],
  ['B-corrente', MONTAR + ALCANCAR + ANDAR(26) + 'desenhar();'],
  ['C-rua', MONTAR + ALCANCAR + ANDAR(120) + 'desenhar();']
];

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto('file://' + path.resolve(ARQ));
  await page.waitForTimeout(900);

  await page.evaluate(() => {
    if (typeof fecharTelas === 'function') fecharTelas();
    if (typeof fecharTudo === 'function') fecharTudo();
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    fecharTudo();
    const cap = 2;
    S.cenario = cenarioDaEpoca(cap);
    S.energiaTotal = LIMIAR_CENA * S.cenario + LIMIAR_CENA * EPOCAS[cap].cenas * 0.85;
    S.energia = 1e6; S.aberturas = MASCARA_EPOCAS; S.fechos = 0;
    S.u1 = true; S.u2 = true; S.u3 = false; S.modo = 'limpo';
    verificarCenario = function () {};
    if (window.setHora) window.setHora(0.35);      // tarde alta: a ladeira no seu melhor
    window.__wx0 = worldX + 400;
    redesenharFundo();
  });

  for (const [nome, corpo] of CENAS) {
    await page.evaluate(corpo);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.resolve(__dirname, PREFIXO + '-' + nome + '.png') });
    const n = await page.evaluate(() => ({
      esperando: mobs.filter(m => m.parado && !m.sabe).length,
      portadoras: mobs.filter(m => m.sabe).length,
      drops: drops.length, dedo: palavraDedo, corrente: palavraCorrente
    }));
    console.log(nome.padEnd(12), JSON.stringify(n));
  }
  await page.close();

  // D — O PAR QUE DECIDE. A portadora e quem ainda espera, lado a lado, no mesmo chão, com a
  // rua CONGELADA (`atualizarMobs` neutralizado só nesta página) e a 3× de ampliação: é o único
  // jeito de olhar o sinal em vez de olhar o borrão. Um anel apertado × dois anéis largos.
  const lupa = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  lupa.on('pageerror', e => console.log('PAGEERROR', e.message));
  await lupa.goto('file://' + path.resolve(ARQ));
  await lupa.waitForTimeout(900);
  await lupa.evaluate(() => {
    if (typeof fecharTelas === 'function') fecharTelas();
    if (typeof fecharTudo === 'function') fecharTudo();
  });
  await lupa.waitForTimeout(300);
  await lupa.evaluate(() => {
    fecharTudo();
    S.cenario = cenarioDaEpoca(2);
    S.energiaTotal = LIMIAR_CENA * S.cenario + LIMIAR_CENA * EPOCAS[2].cenas * 0.85;
    S.energia = 1e6; S.aberturas = MASCARA_EPOCAS; S.fechos = 0;
    S.u1 = true; S.u2 = true; S.u3 = false; S.modo = 'limpo';
    verificarCenario = function () {};
    if (window.setHora) window.setHora(0.35);
    redesenharFundo();
    mobs.length = 0; drops.length = 0; folhas.length = 0; floats.length = 0; parts.length = 0;
    proximoMob = 1e9; proximaFolha = 1e9;
    const a = novoMob('smog', worldX + HX + 40); a.parado = true; a.espera = 999; a.hp = 0; mobs.push(a);
    const c = novoMob('smog', worldX + HX + 95); c.parado = true; c.espera = 999; mobs.push(c);
    virarPortadora(a);
    parts.length = 0;
    atualizarMobs = function () {};        // a rua para, só para o print
    desenhar();
  });
  await lupa.waitForTimeout(250);
  await lupa.screenshot({ path: path.resolve(__dirname, PREFIXO + '-D-lado-a-lado.png'),
    clip: { x: 0, y: 400, width: 390, height: 250 } });
  console.log('D-lado-a-lado  (3x) portadora à esquerda, quem espera à direita');
  await browser.close();
})();
