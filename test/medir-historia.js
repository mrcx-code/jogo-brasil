// MEDIDOR: o que o mundo faz enquanto a HISTÓRIA fala.
//
// Existe porque o pedido do dono em 2026-08-07 ("o jogo já acontece enquanto a história passa,
// não deve ser assim") é uma afirmação sobre NÚMERO, e número se mede — não se olha. Abre uma
// fala de verdade (abrirFala, o mesmo caminho da abertura, do fecho, da cerimônia e da fala dos
// marcos), deixa a tela aberta por 5 s de relógio real e conta o que o mundo fez por baixo:
// impacto somado, chão andado, quanta coisa nasceu e quanta sumiu.
//
// No fim mede a ARMADILHA CLÁSSICA: fechar a tela não pode entregar um dt acumulado ao primeiro
// quadro. Compara o chão andado no primeiro quadro depois de fechar com o de um quadro normal.
//
// Uso:
//   node test/medir-historia.js                          (o index.html da raiz = DEPOIS)
//   git show <commit>:index.html > test/antes.html
//   JOGO_HTML=test/antes.html node test/medir-historia.js   (uma build antiga = ANTES)
// A build antiga é um arquivo de 4 MB e NÃO fica no repositório — o `git show` a reconstrói
// em um segundo, e um binário de saída versionado duas vezes é peso sem informação.
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
function alvo() {
  const p = process.env.JOGO_HTML;
  if (p && /^https?:\/\//i.test(p)) return p;
  return ABRIR('file://' + path.resolve(__dirname, '..', p || 'index.html'));
}

const SEG = Number(process.env.SEGUNDOS || 5);

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto(alvo());
  await page.waitForTimeout(900);

  // Partida em andamento, com u3 ligado: o u3 é o único ganho que não precisa de dedo, e é
  // justamente ele que fazia a leitura render impacto sozinha.
  await page.evaluate(() => {
    fecharTelas();
    S.u1 = S.u2 = false; S.u3 = true; S.u4 = false;
    S.energia = 0; S.energiaTotal = 100; S.cenario = 0; S.modo = 'limpo';
    mobs.length = 0; drops.length = 0; folhas.length = 0; floats.length = 0;
  });
  await page.waitForTimeout(400);

  const antes = await page.evaluate(() => {
    // uma fala de verdade, pelo mesmo caminho de toda a narrativa
    abrirFala('MEDIÇÃO', 'agora', ['Uma linha qualquer, só para a tela ficar aberta.'], null);
    return { t: performance.now(), worldX, energiaTotal: S.energiaTotal,
      mobs: mobs.length, drops: drops.length, folhas: folhas.length,
      relogio, aberta: document.getElementById('telaFala').classList.contains('aberta') };
  });
  await page.waitForTimeout(SEG * 1000);
  const depois = await page.evaluate(() => ({
    t: performance.now(), worldX, energiaTotal: S.energiaTotal,
    mobs: mobs.length, drops: drops.length, folhas: folhas.length, relogio,
    aberta: document.getElementById('telaFala').classList.contains('aberta') }));

  const seg = (depois.t - antes.t) / 1000;
  console.log('ALVO:', alvo());
  console.log('tela de história aberta:', antes.aberta, '->', depois.aberta, '| janela real', seg.toFixed(2) + 's');
  console.log('  impacto somado .......', (depois.energiaTotal - antes.energiaTotal).toFixed(2),
    '(' + ((depois.energiaTotal - antes.energiaTotal) / seg).toFixed(2) + '/s)');
  console.log('  chão andado ..........', (depois.worldX - antes.worldX).toFixed(1), 'px de mundo');
  console.log('  relógio do dia .......', (depois.relogio - antes.relogio).toFixed(1), 's de jogo');
  console.log('  chegadas em cena .....', antes.mobs, '->', depois.mobs);
  console.log('  drops em cena ........', antes.drops, '->', depois.drops);
  console.log('  folhas em cena .......', antes.folhas, '->', depois.folhas);

  // ---- o retorno sem solavanco ----
  const volta = await page.evaluate(() => new Promise(res => {
    const x0 = worldX;
    fecharTelas();
    requestAnimationFrame(() => {
      const x1 = worldX;                         // primeiro quadro depois de fechar
      requestAnimationFrame(() => {
        const x2 = worldX;                       // um quadro normal, para comparar
        res({ primeiro: x1 - x0, normal: x2 - x1 });
      });
    });
  }));
  console.log('  retorno: 1º quadro andou', volta.primeiro.toFixed(3), 'px | quadro seguinte',
    volta.normal.toFixed(3), 'px | razão', (volta.primeiro / (volta.normal || 1)).toFixed(2));

  await browser.close();
})();
