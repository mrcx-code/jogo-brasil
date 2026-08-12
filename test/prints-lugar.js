// PRINTS DE "O LUGAR" — o menu e a tela nova da obra, em dois estados da obra.
//
// O teste diz que não quebrou; o print diz se dá para entender. Este instrumento existe
// para a segunda pergunta, que é a do ticket: quem levantou a obra percebe que levantou?
//
//   node test/prints-lugar.js [prefixo]
//
// Prints em test/LG-<prefixo>-*.png. 390×844, dsf 2, contra o index.html da RAIZ.
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
const PRE = process.argv[2] || 'depois';
const DIR = __dirname;
const alvo = ABRIR('file://' + path.resolve(DIR, '..', process.env.JOGO_HTML || 'index.html'));

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2
  });
  page.on('pageerror', e => console.log('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE: ' + m.text()); });
  await page.goto(alvo);
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  await page.waitForTimeout(900);
  const tira = async (nome) => {
    await page.waitForTimeout(320);
    await page.screenshot({ path: path.resolve(DIR, 'LG-' + PRE + '-' + nome + '.png') });
    console.log('  ' + nome);
  };

  // ---- o menu como ele abre, sem nada construído
  await page.evaluate(() => { fecharTelas(); abrirTela('telaMenu'); });
  await tira('menu-zero');

  // ---- a obra pela metade: quem acolheu gente e passou uma noite fora
  await page.evaluate(() => {
    S.acolhidos = EPOCAS.map(() => 0); S.acolhidos[CAP_GENTE] = 9;
    S.recursos = { flor: 40, agua: 2, refeicao: 40 };
    S.obra = { roca: 74, palicada: 38, casa: 12 };
    if (typeof S.obraVista === 'object') S.obraVista = { roca: 60, palicada: 30, casa: 0 };
    if (typeof abrirTela === 'function') { fecharTelas(); abrirTela('telaMenu'); }
  });
  await tira('menu-meio');
  const temTela = await page.evaluate(() => !!document.getElementById('telaObra'));
  if (temTela) {
    await page.evaluate(() => { montarObra(); abrirTela('telaObra'); });
    await tira('lugar-meio');
    // ---- e a obra inteira de pé
    await page.evaluate(() => {
      S.obra = { roca: 180, palicada: 180, casa: 180 };
      S.obraVista = { roca: 180, palicada: 180, casa: 180 };
      S.recursos = { flor: 90, agua: 90, refeicao: 90 };
      montarObra();
    });
    await tira('lugar-pronta');
    // ---- e o caso do §2: ninguém acolhido, a obra só anda com a mão
    await page.evaluate(() => {
      S.acolhidos = EPOCAS.map(() => 0);
      S.obra = { roca: 0, palicada: 0, casa: 0 };
      S.obraVista = { roca: 0, palicada: 0, casa: 0 };
      montarObra();
    });
    await tira('lugar-vazia');
  } else {
    console.log('  (ainda não existe #telaObra — só o menu)');
  }

  // ---- e a obra na estrada, que é onde a mão trabalha
  await page.evaluate(() => {
    fecharTelas(); fecharTudo();
    S.acolhidos = EPOCAS.map(() => 0); S.acolhidos[CAP_GENTE] = 9;
    S.obra = { roca: 180, palicada: 120, casa: 60 };
    S.cenario = cenarioDaEpoca(CAP_GENTE);
    S.energiaTotal = LIMIAR_CENA * S.cenario + LIMIAR_CENA * EPOCAS[CAP_GENTE].cenas * 0.95;
    canteiros.length = 0; proximoCanteiro = 0;
  });
  // anda até um canteiro entrar em quadro e para nele
  for (let i = 0; i < 60; i++) {
    const perto = await page.evaluate(() => {
      for (let k = 0; k < 40; k++) { worldX += 8; atualizarCanteiros(); }
      const c = canteiroNaTela();
      return c ? Math.round(c.wx - worldX) : -999;
    });
    if (perto > 60 && perto < 200) break;
  }
  await tira('estrada');
  await browser.close();
})();
