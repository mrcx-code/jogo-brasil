// O QUE FICA NO CHÃO DE SALVADOR — print do drop EM JOGO, não da folha de arte.
//
// Existe porque a troca dos três drops de 1835 (§2.4 item 5: "objeto ritual não é
// colecionável — entra como fala, nunca como drop", decisão do dono em 03/09: TROCA) precisa
// de prova visual, e prova visual de arte de 9 px de altura não se tira do arquivo: o drop é
// desenhado no #scene em BAIXA resolução e depois ampliado, então o que importa é o que sobra
// depois da ampliação, não o que existe no WebP.
//
// COMO ELE NÃO MENTE:
//  · abre por http (test/abrir.js) — sob file:// o pack-salvador.json não chega e o instrumento
//    mediria o drop do capítulo 1 achando que mede o de 1835 (a armadilha do §6 do CLAUDE.md);
//  · ESPERA a arte do bloco 2 chegar de verdade (`DROP_SPR[2]` completo e com naturalWidth),
//    em vez de dormir um número de milissegundos e torcer;
//  · repõe os três drops a cada quadro, porque o mundo rola 1:1 e um drop solto sai de quadro
//    antes do print;
//  · recorta a FAIXA DO CHÃO em coordenadas lidas do canvas (getBoundingClientRect + a escala
//    real), nunca em pixels chutados.
//
//   node test/olhar-drop-salvador.js            → test/SALVDROP-<rotulo>.png
//   SALVDROP_ROTULO=antes node test/olhar-drop-salvador.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', process.env.JOGO_HTML || 'index.html'));
const ROTULO = process.env.SALVDROP_ROTULO || 'agora';

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3
  });
  const erros = [];
  page.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('CONSOLE: ' + m.text()); });
  await page.goto(ALVO);
  await page.waitForTimeout(900);

  const b = await page.locator('#btnJogar').boundingBox();
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(700);
  await page.evaluate(() => { if (typeof encerrarFala === 'function') encerrarFala(); fecharTudo(); });
  await page.waitForTimeout(300);

  // ir para SALVADOR pelo índice que o próprio jogo declara, e pedir o pacote da época
  const ida = await page.evaluate(() => {
    const ep = iEp('salvador');
    S.cenario = cenarioDaEpoca(ep); S.fronteira = S.cenario;
    S.energiaTotal = LIMIAR_CENA * S.cenario + 10; S.energia = S.energiaTotal;
    S.u3 = false;                        // sem ajuda automática: nada recolhe o drop sozinho
    if (typeof encerrarFala === 'function') encerrarFala();
    fecharTelas(); fecharTudo();
    garantirEpoca(ep);
    if (typeof redesenharFundo === 'function') redesenharFundo();
    return { ep, cenario: S.cenario, arteCap: capArte() };
  });

  // ESPERAR A ARTE CHEGAR — nunca dormir e torcer
  await page.waitForFunction(() => {
    const l = DROP_SPR[capArte()];
    return !!l && l.length > 0 && l.every(im => im.complete && im.naturalWidth > 0);
  }, null, { timeout: 20000 });

  const info = await page.evaluate(() => {
    const l = DROP_SPR[capArte()];
    window.__fix = setInterval(() => {
      drops.length = 0;
      // 75/120/165 num mundo de W=195: os três à DIREITA da personagem (que anda por volta de
      // x=48), senão o primeiro nasce atrás dela e o print perde justamente um dos três.
      ['smog', 'barrel', 'cash'].forEach((t, i) => drops.push({ wx: worldX + 75 + i * 45, type: t, t: 0, valor: 1 }));
    }, 16);
    return {
      arteCap: capArte(), n: l.length,
      dim: l.map(im => im.naturalWidth + 'x' + im.naturalHeight),
      naTela: l.map(im => Math.round(im.naturalWidth * (9 / im.naturalHeight)) + 'x9')
    };
  });
  await page.waitForTimeout(600);

  const cx = await page.evaluate(() => {
    const cv = document.getElementById('scene');
    const r = cv.getBoundingClientRect();
    const esc = r.width / cv.width;
    return { x: r.left, y: r.top + (GROUND - 22) * esc, w: r.width, h: 30 * esc, esc, W: cv.width, GROUND };
  });

  const arq = path.join(__dirname, 'SALVDROP-' + ROTULO + '.png');
  await page.screenshot({ path: arq, clip: { x: cx.x, y: cx.y, width: cx.w, height: cx.h } });
  const arqInt = path.join(__dirname, 'SALVDROP-' + ROTULO + '-inteira.png');
  await page.screenshot({ path: arqInt });
  // O MESMO CHÃO DE PERTO: 9 px de drop numa faixa de 195 px de mundo ficam do tamanho de uma
  // unha na tela do relatório. Este segundo recorte pega só os três, e é nele que dá para
  // julgar se a arte AINDA LÊ depois de reduzida — que é a pergunta que o print grande não
  // responde.
  const perto = path.join(__dirname, 'SALVDROP-' + ROTULO + '-perto.png');
  await page.screenshot({
    path: perto,
    clip: { x: cx.x + 62 * cx.esc, y: cx.y + 8 * cx.esc, width: 128 * cx.esc, height: 20 * cx.esc }
  });

  console.log('época salvador = ' + ida.ep + ' · cenário ' + ida.cenario + ' · arteCap ' + info.arteCap);
  console.log('drops do bloco ' + info.arteCap + ': ' + info.n + ' — folha ' + info.dim.join(' · '));
  console.log('  na tela (9 px de alvo):   ' + info.naTela.join(' · '));
  console.log('recorte: escala ' + cx.esc.toFixed(3) + ' · W=' + cx.W + ' · GROUND=' + cx.GROUND);
  console.log('escrito: ' + arq);
  console.log('escrito: ' + arqInt);
  if (erros.length) { console.error('ERROS DE CONSOLE:\n' + erros.join('\n')); await browser.close(); process.exit(1); }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
