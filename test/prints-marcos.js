// AS PLACAS NA TELA — dois prints por capítulo pedido, e são eles que decidem.
//
// O `encaixe.js` prova que a placa nasce no capítulo certo e que ela não estourou a trava de
// tela poluída. Nenhum dos dois diz se ela ESTÁ LEGÍVEL, e é para isso que este arquivo
// existe: para cada capítulo, um print com a placa vindo pela estrada (silhueta alta e parada
// contra os itens, que são baixos e móveis — o risco declarado no docs/arquivo/JOGABILIDADE.md) e um com a
// fala do momento aberta, a placa ainda em quadro.
//
//   node test/prints-marcos.js [index.html] [caps separados por vírgula]
//
// Prints em test/M-<id do capítulo>-{placa,fala}.png. Sempre olhe os prints.
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
const ARQ = process.argv[2] || path.resolve(__dirname, '..', 'index.html');
const CAPS = (process.argv[3] || '0,1,5,12').split(',').map(function (s) { return +s.trim(); });

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2
  });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(ABRIR('file://' + path.resolve(ARQ)));
  await page.waitForTimeout(1200);
  // O jogo abre no MENU, e `fecharTudo()` sozinho não o tira: com o menu aberto `telaAberta()`
  // é true e a placa passa sem falar de propósito (falar por baixo de outra tela seria pior).
  // Foi assim que a primeira rodada deste arquivo saiu com três prints sem fala nenhuma.
  await page.tap('#btnJogar').catch(() => {});
  await page.waitForTimeout(500);

  for (const cap of CAPS) {
    // O estado: o capítulo, o impacto UM PASSO ANTES do alvo do primeiro marco dele, e a
    // máscara zerada. A placa nasce sozinha no quadro seguinte, como nasce em jogo.
    const info = await page.evaluate(async (c) => {
      fecharTelas(); fecharTudo();
      const meus = MARCOS.filter(function (m) { return m.ep === c; });
      if (!meus.length) return { pulou: true, nome: EPOCAS[c].nome };
      S.cenario = cenarioDaEpoca(c); S.fronteira = TOTAL_CENAS - 1;
      S.aberturas = MASCARA_EPOCAS; S.fechos = 0;
      S.marcos = 0; marcoAtivo = null;
      S.energia = 1e6; S.energiaTotal = marcoAlvo(meus[0]);
      S.u1 = S.u2 = S.u3 = true; S.modo = 'limpo';
      S.acolhidos = S.acolhidos.map(function () { return 0; });
      grupo.length = 0; ficando.length = 0; moradores.length = 0;
      mobs.length = 0; drops.length = 0; folhas.length = 0; floats.length = 0;
      verificarCenario = function () {};      // o capítulo não vira no meio do print
      garantirEpoca(c);
      redesenharFundo();
      await new Promise(r => setTimeout(r, 2200));   // dá tempo do pacote de arte chegar
      redesenharFundo();
      return { pulou: false, nome: EPOCAS[c].nome, id: EPOCAS[c].id, titulo: meus[0].no.t };
    }, cap);
    if (info.pulou) { console.log('cap', cap, info.nome, '— sem marco, pulado'); continue; }

    // 1) a placa VINDO: espera ela entrar e chegar à metade da tela
    await page.waitForFunction(() => typeof marcoAtivo !== 'undefined' && marcoAtivo &&
      marcoAtivo.wx - worldX < W * 0.62, null, { timeout: 20000 }).catch(() => {});
    const p1 = path.resolve(__dirname, 'M-' + info.id + '-placa.png');
    await page.screenshot({ path: p1 });

    // 2) a FALA do momento, com a placa ainda em quadro
    await page.waitForFunction(() => typeof falaAberta === 'function' && falaAberta(),
      null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(700);
    const p2 = path.resolve(__dirname, 'M-' + info.id + '-fala.png');
    await page.screenshot({ path: p2 });
    const est = await page.evaluate(() => ({
      falou: falaAberta(), bits: S.marcos, tela: telaAberta(),
      abertas: TELAS.filter(function (t) { return document.getElementById(t).classList.contains('aberta'); }),
      naTela: typeof marcoAtivo !== 'undefined' && marcoAtivo ? Math.round(marcoAtivo.wx - worldX) : null
    }));
    if (!est.falou) console.log('   nao falou — telaAberta:', est.tela, '| abertas:', est.abertas.join(',') || '(nenhuma)');
    console.log('cap', cap, info.nome, '| primeiro marco:', info.titulo,
      '| fala aberta:', est.falou, '| placa em x =', est.naTela, '| bits', est.bits);
    await page.evaluate(() => { pararFala(); fecharTudo(); });
    await page.waitForTimeout(300);
  }
  await browser.close();
})();
