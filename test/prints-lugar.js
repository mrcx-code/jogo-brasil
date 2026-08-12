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

  // ---- e a obra na estrada, que é onde a mão trabalha. Tudo NUMA evaluate só: o laço de
  // quadro continua rodando entre uma chamada e outra, e ele virou a cena no meio da
  // preparação mais de uma vez — a faixa morria e o canteiro sumia sem aviso.
  const naRua = await page.evaluate(() => {
    fecharTelas(); fecharTudo();
    S.acolhidos = EPOCAS.map(() => 0); S.acolhidos[CAP_GENTE] = 9;
    S.obra = { roca: 180, palicada: 120, casa: 60 };
    S.recursos = { flor: 90, agua: 90, refeicao: 90 };
    S.cenario = cenarioDaEpoca(CAP_GENTE);
    // a faixa pelo capítulo FECHADO, e não por uma fração do vão: o impacto sobe sozinho
    // enquanto o print é montado, e a 95% do vão a cena virava no meio da preparação
    S.fechos = (S.fechos | 0) | (1 << CAP_GENTE);
    S.energiaTotal = LIMIAR_CENA * S.cenario + LIMIAR_CENA * EPOCAS[CAP_GENTE].cenas * 0.5;
    canteiros.length = 0; proximoCanteiro = 0;
    // anda até o canteiro entrar em quadro e PARA com ele no meio da tela: o laço de quadro
    // continua andando ~40 px enquanto o print espera, e semeá-lo colado na borda esquerda o
    // punha fora do quadro na hora da foto.
    for (let k = 0; k < 4000; k++) {
      worldX += 4; atualizarCanteiros();
      const v = canteiroNaTela();
      if (v && v.wx - worldX <= W * 0.42) break;
    }
    const c = canteiroNaTela();
    return c ? { tipo: c.tipo, sx: Math.round(c.wx - worldX) } : null;
  });
  console.log('  canteiro em quadro: ' + JSON.stringify(naRua));
  await tira('estrada');

  // ---- e o momento em que a estrada era MUDA: um estágio inteiro ficando de pé sob a mão
  const nome = await page.evaluate(() => {
    const c = canteiroNaTela();
    if (!c) return '(nenhum canteiro em quadro)';
    // um ponto antes de fechar um estágio, no canteiro que está em quadro — é ele que a mão
    // alcança, e é o tipo dele que decide a palavra
    S.obra[c.tipo] = 59;
    jumpT = 0;
    // o dedo, do jeito que o jogo o recebe: pousado há mais que o `MUTIRAO_HOLD_MS`. E ele
    // FICA pousado de propósito: segurando, a personagem PARA e o canteiro não vai embora —
    // que é a cena real de quem está trabalhando.
    obraDedo = performance.now() - 600;
    trabalharNaObra(1.1);
    return nomeObraTxt || '(sem a linha)';
  });
  console.log('  a rua diz: ' + JSON.stringify(nome));
  await tira('estrada-nome');
  await browser.close();
})();
