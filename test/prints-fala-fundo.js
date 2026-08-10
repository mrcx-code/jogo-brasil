// A caixa de fala tem fundo de tela cheia? — pedido do dono ("tem que ter sempre a
// imagenzinha do fundo mostrando o momento... não deixa só texto").
//
//   TAG=antes  node test/prints-fala-fundo.js    (na build da main)
//   TAG=depois node test/prints-fala-fundo.js    (depois de npm run build)
//
// Três provas por rodada:
//   *-abertura-img   — fala COM imagem de contexto curada (linha 1 da abertura)
//   *-abertura-tela  — fala SEM imagem curada (linha 4, a que descreve a tela):
//                      no antes o mundo roda atrás; no depois o cenário parado cobre
//   *-mexeu          — a MESMA fala 900 ms depois, sem toque nenhum: se os dois prints
//                      diferirem, é o mundo vivo vazando atrás da leitura
//   *-travessia      — a travessia continua SÓ mar e céu (o fundo de capítulo NÃO entra)
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
const shot = (p, nome) => p.screenshot({ path: path.resolve(__dirname, 'FALA-' + TAG + '-' + nome + '.png') });
(async () => {
  const b = await chromium.launch({ executablePath: chromiumPath() });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await p.goto(ALVO);
  await p.waitForTimeout(900);
  // a abertura do capítulo 1, do jeito que o jogo a abre (com cerimônia encerrada na hora)
  await p.evaluate(() => {
    fecharTelas(); window.setHora(0.30);
    abrirFala(EPOCAS[0].nome, EPOCAS[0].quando, EPOCAS[0].abertura, null, EPOCAS[0].aberturaImg, false);
  });
  await p.waitForTimeout(700);
  await shot(p, 'abertura-img');
  // avança até a linha 4 (índice 3), a primeira com aberturaImg = null
  await p.evaluate(() => { avancarFala(); avancarFala(); avancarFala(); avancarFala(); avancarFala(); avancarFala(); });
  await p.waitForTimeout(700);
  await shot(p, 'abertura-tela');
  await p.waitForTimeout(900);
  await shot(p, 'mexeu');
  // a travessia: mar e céu, nunca pintura de capítulo
  await p.evaluate(() => {
    fecharTelas();
    correrTravessia('pindorama', 'palmares', null);
  });
  await p.waitForTimeout(900);
  await shot(p, 'travessia');
  await b.close();
})();
