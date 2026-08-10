// Prints da tela A HISTÓRIA — o antes (lista rolável) e o depois (quadrinho de tela cheia).
//
//   TAG=antes node test/prints-quadrinho.js      (na build da main, antes da onda)
//   TAG=depois node test/prints-quadrinho.js     (depois de npm run build)
//
// Três estados por rodada:
//   *-cheia-0/1/2  — jogo terminado (tudo revelado): topo, meio e fim do rolo
//   *-meio-transicao — foto NO MEIO de uma rolagem (sem esperar o encaixe), para ver a
//                      transição de um quadro para o outro — pedido da entrega
//   *-inicio       — jogo recém-começado: o que um save novo vê (marcos escondidos)
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
const shot = (p, nome) => p.screenshot({ path: path.resolve(__dirname, 'Q-' + TAG + '-' + nome + '.png') });
(async () => {
  const b = await chromium.launch({ executablePath: chromiumPath() });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await p.goto(ALVO);
  await p.waitForTimeout(900);

  // ---- jogo terminado: tudo revelado ----
  await p.evaluate(() => {
    fecharTelas();
    // a revelação lê S.cenario; energiaTotal fica ABAIXO de LIMIAR_FIM para o fecho
    // do último capítulo não abrir por cima da tela (armadilha paga no primeiro print)
    S.cenario = TOTAL_CENAS - 1; S.energiaTotal = LIMIAR_FIM - 200;
    window.setHora(0.30);
    montarCompletude(); abrirTela('telaCompletude');
  });
  await p.waitForTimeout(800);
  await shot(p, 'cheia-0');
  const box = () => p.evaluate(() => {
    const el = document.getElementById('listaCenas');
    return { h: el.clientHeight, total: el.scrollHeight };
  });
  const m = await box();
  console.log(TAG, '-> rolo:', JSON.stringify(m), '(', (m.total / m.h).toFixed(1), 'telas )');
  // meio do rolo (deixa encaixar)
  await p.evaluate((y) => { document.getElementById('listaCenas').scrollTop = y; }, m.total * 0.5);
  await p.waitForTimeout(700);
  await shot(p, 'cheia-1');
  // fim do rolo
  await p.evaluate(() => { const el = document.getElementById('listaCenas');
    el.scrollTop = el.scrollHeight; });
  await p.waitForTimeout(700);
  await shot(p, 'cheia-2');
  // ---- o MEIO de uma transição ----
  // O encaixe obrigatório re-encaixa scrollTop programático antes do screenshot (armadilha
  // medida: os valores voltavam binários, from/to). Para FOTOGRAFAR o meio da virada, o
  // snap é solto SÓ aqui — o dedo de verdade produz exatamente estas posições contínuas.
  await p.evaluate(() => { const el = document.getElementById('listaCenas');
    el.style.scrollSnapType = 'none';
    el.scrollTop = el.clientHeight * 6.55;   // a página 8 (imagem + papel) meio-virada
  });
  await p.waitForTimeout(120);
  await shot(p, 'meio-transicao');
  await p.evaluate(() => { document.getElementById('listaCenas').style.scrollSnapType = ''; });

  // ---- save novo: o que a primeira sessão vê ----
  await p.evaluate(() => {
    S.cenario = 0; S.energiaTotal = 0;
    montarCompletude();
    document.getElementById('listaCenas').scrollTop = 0;
  });
  await p.waitForTimeout(500);
  await shot(p, 'inicio');
  await b.close();
})();
