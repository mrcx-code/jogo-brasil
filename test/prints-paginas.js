// Prints página a página do quadrinho novo — as três famílias que a passada de 2026-08-08
// criou ou mudou: página de PAPEL (momento sem arte curada, com e sem comentário), momento
// COM pintura de capítulo em tela cheia + paisagem de contexto + comentário, e o marco com
// o selo VOCÊ ESTÁ AQUI. TAG=depois por padrão.
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
const shot = (p, nome) => p.screenshot({ path: path.resolve(__dirname, 'QP-' + TAG + '-' + nome + '.png') });
(async () => {
  const b = await chromium.launch({ executablePath: chromiumPath() });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await p.goto(ALVO);
  await p.waitForTimeout(900);
  await p.evaluate(() => {
    fecharTelas();
    // meio do jogo: PALMARES — para o selo VOCÊ ESTÁ AQUI aparecer num marco do meio.
    // energiaTotal BAIXA de propósito: acima do limiar da cena, verificarCenario() dispara
    // a virada com cerimônia POR CIMA da tela (o B1 do QA, pago aqui no primeiro print).
    S.cenario = 2; S.energiaTotal = 100;
    window.setHora(0.30);
    montarCompletude(); abrirTela('telaCompletude');
  });
  await p.waitForTimeout(800);
  // páginas (1-based): 2 papel+comentário (Lagoa Santa) · 4 papel sem comentário (Marajó) ·
  // 8 momento com pintura+ctx+comentário (i=0) · 12 papel duro (a travessia forçada, silêncio) ·
  // 14 marco PALMARES com selo · 20 papel Salvador (ganhadeiras, comentário) · 26 ponta fim
  for (const pag of [2, 4, 8, 12, 14, 20, 26]) {
    await p.evaluate((n) => {
      const el = document.getElementById('listaCenas');
      el.style.scrollSnapType = 'none';
      el.scrollTop = el.clientHeight * (n - 1);
    }, pag);
    await p.waitForTimeout(450);
    await shot(p, 'pag' + String(pag).padStart(2, '0'));
  }
  await b.close();
})();
