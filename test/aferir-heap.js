// AFERIR-HEAP — o `performance.memory` deste navegador enxerga alguma coisa?
//
// POR QUE EXISTE (23/08, QA). O `martelo.js` conclui "DELTA HEAP 0,0 MB em 38 s" lendo
// `performance.memory.usedJSHeapSize`. Antes de aceitar esse zero como medida, este arquivo
// pergunta se o campo é capaz de sair de zero: abre o MESMO jogo, RETÉM uma quantidade
// conhecida de memória, e vê quanto disso aparece no número.
//
// MEDIDO em 23/08 (Windows, Chromium do Playwright):
//   sem bandeira          -> used fica em 10.000.000 e total em 11.900.000, CONGELADOS.
//                            80 MB retidos movem o campo em 0,00 MB.
//   --enable-precise-memory-info -> os mesmos 80 MB movem o campo em 38,62 MB.
// Ou seja: na configuração que o martelo.js usa, "delta 0,0 MB" é o único valor possível —
// não é uma medida de vazamento, é o valor que o Chromium sempre devolve. O Chromium
// quantiza `performance.memory` em faixas grosseiras e só o atualiza de longe em longe,
// justamente para não virar canal lateral de medição entre sites.
//
// node test/aferir-heap.js            # afere a configuração do martelo.js (hoje: reprova)
// node test/aferir-heap.js --preciso  # afere com a bandeira que faz o campo se mexer
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

const PRECISO = process.argv.indexOf('--preciso') >= 0;
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', process.env.JOGO_HTML || 'index.html'));
const MB = b => (b / 1048576).toFixed(2);
// ~80 MB retidos em arrays de smi, que é heap de JS de verdade (ArrayBuffer não conta em
// `usedJSHeapSize` em todas as versões, e por isso não serve de lastro aqui).
const LASTRO_MB_NOMINAL = 80;

(async () => {
  const browser = await chromium.launch({
    executablePath: chromiumPath(),
    args: PRECISO ? ['--enable-precise-memory-info'] : undefined,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(ALVO);
  await page.waitForTimeout(1200);

  const existe = await page.evaluate(() => !!(window.performance && performance.memory));
  console.log('bandeira --enable-precise-memory-info: ' + (PRECISO ? 'SIM' : 'nao') +
    ' | performance.memory existe: ' + existe);
  if (!existe) {
    console.log('REPROVADO: sem a API, todo instrumento que a lê imprime 0,0 MB e chama isso de medida.');
    await browser.close();
    process.exit(1);
  }

  const ler = () => page.evaluate(() => performance.memory.usedJSHeapSize);
  const antes = await ler();
  await page.evaluate(() => {
    window.__lastro = [];
    for (let i = 0; i < 640; i++) window.__lastro.push(new Array(16384).fill(i));
  });
  await page.waitForTimeout(1200);
  const vivo = await page.evaluate(() => window.__lastro.length + ':' + window.__lastro[639][16383]);
  const depois = await ler();

  console.log('  lastro retido e comprovadamente vivo: ' + vivo + ' (~' + LASTRO_MB_NOMINAL + ' MB nominais)');
  console.log('  usedJSHeapSize ' + antes + ' -> ' + depois + '   (delta ' + MB(depois - antes) + ' MB)');

  // Régua: se ~80 MB retidos não movem o campo nem 4 MB, ele não mede nada que um vazamento
  // de jogo produza em 40 s — e um instrumento cego não pode absolver ninguém.
  const passou = (depois - antes) > 4 * 1048576;
  console.log(passou
    ? 'APROVADO: o campo se mexe; um delta 0,0 MB aqui seria informação.'
    : 'REPROVADO: ~' + LASTRO_MB_NOMINAL + ' MB retidos moveram ' + MB(depois - antes) +
      ' MB. Nesta configuracao "DELTA HEAP 0,0 MB" nao prova ausencia de vazamento.');
  await browser.close();
  process.exit(passou ? 0 : 1);
})().catch(e => { console.error('EXPLODIU:', e); process.exit(2); });
