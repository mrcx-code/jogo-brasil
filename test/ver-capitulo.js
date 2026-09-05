// VER UM CAPÍTULO — print de cada fala da abertura e do fecho, por identidade.
//
//   node test/ver-capitulo.js cais
//
// Existe porque o CLAUDE.md manda olhar os prints ao mexer em conteúdo, e não havia como
// olhar um capítulo do MEIO do arco: o percurso (`test/percurso.js`) anda do começo e para
// onde a partida chega, e o smoke fotografa a rua do capítulo 1. Escrever o texto de
// JABAQUARA e conferir por leitura de código é exatamente o erro que este repositório já
// pagou uma vez — foi um print, não um teste, que mostrou o retrato de AINDA AQUI narrando
// o Valongo (§2), porque nenhuma asserção olhava para a cara de quem fala.
//
// Roda contra o `index.html` da RAIZ como ele está, sem build — rode `npm run build` antes se
// acabou de mexer em `src/`. Salva `test/CAP-<id>-ab<N>.png`, `-rua` e `-fe<N>`, e imprime
// os erros de console que aparecerem no caminho.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');
const { ehRuidoDeRedeExterna } = require('./rede-externa.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}
const DIR = __dirname;
const id = process.argv[2];
if (!id) { console.error('uso: node test/ver-capitulo.js <id do capítulo>'); process.exit(2); }

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2
  });
  const erros = [];
  page.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !ehRuidoDeRedeExterna(m)) erros.push('CONSOLE: ' + m.text()); });
  await page.goto(ABRIR('file://' + path.resolve(DIR, '..', 'index.html')));
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  await page.waitForTimeout(900);

  const n = await page.evaluate((id) => {
    const e = EPOCAS.findIndex(x => x.id === id);
    if (e < 0) return -1;
    fecharTudo();
    entrarNaEpoca(e); redesenharFundo(); fecharTelas(); mostrarAbertura(undefined, true);
    return EPOCAS[e].abertura.length;
  }, id);
  if (n < 0) { console.error('não existe capítulo com id `' + id + '`'); await browser.close(); process.exit(2); }

  // A caixa revela letra a letra a ~14 caracteres por segundo: uma fala de 250 leva 18 s para
  // acabar de aparecer, e o print sairia com meia frase. É o mesmo toque que a pessoa dá —
  // `avancarFala()` numa linha ainda escrevendo TERMINA a linha; na linha pronta, vira a
  // página. Então: um toque para completar, o print, e outro toque para passar.
  const completar = () => page.evaluate(() => avancarFala());
  // a cerimônia do nome segura a caixa por 3,4 s antes de a primeira linha começar a escrever;
  // tocar dentro dela adianta uma fala e o rolo de prints sai deslocado em um.
  await page.waitForTimeout(4200);
  for (let i = 0; i < n; i++) {
    await page.waitForTimeout(600);
    await completar();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(DIR, 'CAP-' + id + '-ab' + (i + 1) + '.png') });
    await completar();
  }
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(DIR, 'CAP-' + id + '-rua.png') });

  const nf = await page.evaluate((id) => {
    const e = EPOCAS.findIndex(x => x.id === id);
    abrirFala(EPOCAS[e].nome, EPOCAS[e].quando, EPOCAS[e].fecho);
    return EPOCAS[e].fecho.length;
  }, id);
  for (let i = 0; i < nf; i++) {
    await page.waitForTimeout(600);
    await completar();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(DIR, 'CAP-' + id + '-fe' + (i + 1) + '.png') });
    await completar();
  }
  console.log(id + ': ' + n + ' falas de abertura, ' + nf + ' de fecho | erros de console: '
    + (erros.length ? '\n' + erros.join('\n') : 'nenhum'));
  await browser.close();
  process.exit(erros.length ? 1 : 0);
})();
