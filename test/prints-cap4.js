// FOTOGRAFA UM CAPÍTULO JOGANDO, não a pintura forçada.
//
// Uso: node test/prints-cap4.js [prefixo] [época] [fração-da-hora]
//   node test/prints-cap4.js C4 2 0.35      # SALVADOR, meio da tarde
//
// A diferença entre isto e um screenshot qualquer: aqui a personagem ANDA. O quadro do sprite
// é escolhido pela DISTÂNCIA percorrida (§4 do CLAUDE.md), então uma foto parada mostra sempre
// a mesma pose e não diz nada sobre a passada. Este script anda um `laço` inteiro e fotografa
// N vezes ao longo dele, com o `worldX` de cada foto impresso — é assim que se olha a caminhada
// nova sem confiar na memória de como era a antiga.
//
// Ele também IMPRIME a régua da passada do capítulo (passo, velocidade, quadros de tela por
// pose) lida do próprio jogo, para o print e o número saírem da mesma execução.
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

(async () => {
  const pref = process.argv[2] || 'C4';
  const epoca = process.argv[3] !== undefined ? parseInt(process.argv[3], 10) : 2;
  const fHora = process.argv[4] !== undefined ? parseFloat(process.argv[4]) : 0.35;
  const alvo = process.env.JOGO_HTML || path.resolve(__dirname, '..', 'index.html');
  const file = /^https?:/.test(alvo) ? alvo : ABRIR('file://' + path.resolve(alvo));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const erros = [];
  page.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('CONSOLE: ' + m.text()); });
  await page.goto(file);
  await page.waitForTimeout(1200);

  // Entra no capítulo pela porta do jogo (cenarioDaEpoca), não escrevendo no save à mão: é a
  // mesma conta que a linha do tempo usa, e um capítulo que entre no meio da cronologia
  // continua achando o próprio cenário sem este script saber disso.
  const regua = await page.evaluate((arg) => {
    S.cenario = cenarioDaEpoca(arg.epoca);
    // O IMPACTO TEM DE FICAR ABAIXO DO PRÓXIMO LIMIAR. `verificarCenario()` roda todo quadro e
    // avança a cena assim que `energiaTotal` alcança o alvo: encher a bolsa antes de escolher o
    // capítulo empurra a pessoa até a ÚLTIMA cena em poucos quadros, e o print sai do capítulo
    // errado sem nenhum aviso — foi o que aconteceu na primeira versão deste script.
    const teto = proximoLimiar();
    S.energiaTotal = teto === null ? LIMIAR_FIM - 1 : teto - 1;
    S.energia = 500;
    S.aberturas = 0xffff;                      // nenhuma tela de abertura por cima da rua
    // E FECHA O QUE JÁ ESTIVER ABERTO. Com uma tela narrativa no ar o mundo PARA (o portão de
    // `historiaAberta()`), o `worldX` não anda, e este script esperaria para sempre por uma
    // distância que nunca chega. A tela de retorno/abertura sobe sozinha no carregamento.
    if (typeof fecharTelas === 'function') fecharTelas();
    if (typeof redesenharFundo === 'function') redesenharFundo();
    if (window.setHora) window.setHora(arg.fHora);
    const c = passoCap();
    return {
      epoca: EPOCAS[epocaAtual()].nome, cena: S.cenario,
      passo: c.passo, laco: c.laco, alturaQuadro: c.alturaQuadro, tela: c.tela,
      quadros: heroBloco('walk').length, velocidade: c.passo * 60 / c.tela
    };
  }, { epoca, fHora });
  await page.waitForTimeout(700);

  // ANDAR: o mundo só corre quando nenhuma tela narrativa está aberta, e o `worldX` é o relógio
  // de verdade da caminhada. Fotografa em N pontos igualmente espaçados de UM laço completo.
  const N = 6;
  const laco = regua.passo * regua.quadros;
  const fotos = [];
  for (let k = 0; k < N; k++) {
    // O portão de `historiaAberta()` para o mundo, e a abertura do capítulo sobe UM quadro
    // depois de o cenário mudar — fechar uma vez antes do laço não basta, porque ela reaparece
    // no primeiro quadro da espera e o `worldX` congela para sempre. Fecha a cada volta.
    const alvoX = await page.evaluate((d) => new Promise((res) => {
      const de = worldX;
      const olhar = () => {
        if (historiaAberta()) fecharTelas();
        if (worldX - de >= d) res(worldX); else requestAnimationFrame(olhar);
      };
      olhar();
    }), k === 0 ? 0 : laco / N);
    const nome = pref + '-anda-' + (k + 1) + '.png';
    await page.screenshot({ path: path.join(__dirname, nome) });
    fotos.push({ nome, worldX: Math.round(alvoX * 100) / 100 });
  }
  await page.screenshot({ path: path.join(__dirname, pref + '-rua.png') });

  await browser.close();
  const f2 = (x) => (Math.round(x * 100) / 100).toFixed(2).replace('.', ',');
  console.log('\n' + regua.epoca + '  (cena ' + regua.cena + ', hora ' + fHora + ')');
  console.log('  laco ' + regua.laco + ' px de sprite | quadro ' + regua.alturaQuadro +
    ' px | ' + regua.quadros + ' quadros de ciclo');
  console.log('  passo ' + f2(regua.passo) + ' px de mundo por pose | tela ' + regua.tela +
    ' quadros | velocidade ' + f2(regua.velocidade) + ' px/s');
  console.log('  um laco inteiro = ' + f2(laco) + ' px de mundo');
  fotos.forEach(f => console.log('    ' + f.nome.padEnd(18) + ' worldX ' + f.worldX));
  console.log('    ' + (pref + '-rua.png').padEnd(18) + ' (a rua)');
  if (erros.length) { console.log('\nERROS:'); erros.forEach(e => console.log('  ' + e)); process.exit(1); }
  console.log('\nsem erro de console.');
})();
