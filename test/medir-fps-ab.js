// FPS EM A/B, DENTRO DA MESMA CARGA — a régua que faltava em 21/08.
//
// POR QUE ELE EXISTE, e custou um merge bloqueado. O passe de pixel (PIXEL VENCE) foi barrado
// porque o capítulo-CONTROLE — litoral/PINDORAMA, que não recebe passe nenhum — teria caído de
// 42 para 25 FPS. Duas coisas estavam erradas na frase, e nenhuma delas era o código:
//
//   1. O "antes" da segunda rodada tinha sido medido no build COM o passe (o próprio JSON
//      mostrava o CAIS com 56 cores onde o antes de verdade tem 1.281). O `medir-pixel.js`
//      passou a RECUSAR gravar um "antes" com o ticket ligado por causa disso.
//   2. **Duas execuções não se comparam.** Medido nesta máquina, o MESMO capítulo no MESMO
//      build deu 30 FPS numa carga e 18 noutra, meia hora depois. A deriva entre execuções é
//      MAIOR que o efeito que se queria ler — então qualquer antes/depois feito em dois
//      processos separados mede a carga da máquina, não a mudança.
//
// A saída é medir os dois braços na MESMA carga, ALTERNADOS. `GRAO_PINT` é um array `const` de
// escopo de módulo — e `const` prende o vínculo, não o conteúdo: esvaziá-lo faz `construirGrao`
// devolver cedo e nenhum canvas ser alocado, que é bit a bit o motor de antes. Alternar
// passe/sem/passe/sem dentro de uma carga cancela a deriva, porque ela afeta os dois braços
// igualmente.
//
//   node test/medir-fps-ab.js ab 5        → o A/B alternado (é este que decide)
//   node test/medir-fps-ab.js puro 3      → sem pré-carga e sem passeio: o que o smoke vê
//   node test/medir-fps-ab.js passe 3     → pré-carga + passeio pelos 13, passe ligado
//   node test/medir-fps-ab.js sem 3       → o mesmo, com o passe desligado na carga inteira
//   TMP_ALVOS=litoral,aceiro              → quais capítulos medir (padrão: estes dois)
//
// RESULTADO DE 21/08, cinco rodadas alternadas: controle 24,2 (passe) contra 25,6 (sem), e
// O ACEIRO 26,6 contra 24,4 — o passe não custa nada ao controle e ACELERA o capítulo pintado,
// que é o esperado: desenhar um canvas de 304x405 AMPLIADO é mais barato que desenhar a
// pintura inteira REDUZIDA a cada quadro.
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

const MODO = (process.argv[2] || 'passe').toLowerCase();
const RODADAS = parseInt(process.argv[3] || '3', 10);
const ALVOS = (process.env.TMP_ALVOS || 'litoral,aceiro').split(',');

(async () => {
  const file = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const erros = [];
  page.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('CONSOLE: ' + m.text()); });
  await page.goto(file);
  await page.waitForTimeout(1200);

  if (MODO === 'sem') {
    const z = await page.evaluate(() => { GRAO_PINT.fill(0); return GRAO_PINT.join(','); });
    console.log('GRAO_PINT zerado: ' + z);
  }

  if (MODO !== 'puro') {
    await page.evaluate(async () => {
      if (typeof fecharTelas === 'function') fecharTelas();
      for (let e = 0; e < EPOCAS.length; e++) garantirEpoca(e);
      for (let t = 0; t < 400 && Object.keys(pacoteEstado).some(n => pacoteEstado[n] !== 'aqui'); t++) {
        await new Promise(r => setTimeout(r, 25));
      }
    });
  }

  if (MODO === 'sem' || MODO === 'passe' || MODO === 'ab') {
    const N = await page.evaluate(() => EPOCAS.length);
    for (let i = 0; i < N; i++) {
      await page.evaluate((i) => {
        fecharTelas(); entrarNaEpoca(i); redesenharFundo();
        mobs.length = 0; drops.length = 0; floats.length = 0;
      }, i);
      await page.waitForTimeout(650);
      await page.evaluate(() => { fecharTelas(); mobs.length = 0; drops.length = 0; floats.length = 0; });
      await page.waitForTimeout(250);
    }
  }

  // MODO AB — o A/B dentro da MESMA carga, alternado. Mata a deriva entre execuções, que nesta
  // máquina é maior que o efeito procurado (28 FPS numa carga, 18 noutra, sem mudar uma linha).
  let abLinhas = null;
  if (MODO === 'ab') {
    const orig = await page.evaluate(() => GRAO_PINT.slice());
    console.log('GRAO_PINT original: ' + orig.join(','));
    const linhas = [];
    for (const alvo of ALVOS) {
      for (let r = 0; r < RODADAS; r++) {
        for (const braco of ['passe', 'sem']) {
          await page.evaluate(([lugar, braco, orig]) => {
            GRAO_PINT.length = 0;
            for (const v of (braco === 'sem' ? orig.map(() => 0) : orig)) GRAO_PINT.push(v);
            const i = EPOCAS.findIndex(e => e.lugar === lugar);
            fecharTelas(); entrarNaEpoca(i >= 0 ? i : 0); redesenharFundo();
          }, [alvo, braco, orig]);
          await page.waitForTimeout(400);
          await page.evaluate(() => fecharTelas());
          const v = await page.evaluate(() => new Promise(res => {
            let n = 0; const t0 = performance.now();
            (function f() { n++; performance.now() - t0 < 2000 ? requestAnimationFrame(f) : res(Math.round(n / 2)); })();
          }));
          // e o custo DIRETO da função mudada, sem o resto do quadro por perto
          const ms = await page.evaluate(() => {
            rolarFundo(); const t0 = performance.now();
            for (let k = 0; k < 60; k++) rolarFundo();
            return +((performance.now() - t0) / 60).toFixed(3);
          });
          linhas.push({ lugar: alvo, rodada: r + 1, braco, fps: v, rolarMs: ms });
          console.log('ab  ' + alvo.padEnd(10) + ' r' + (r + 1) + ' ' + braco.padEnd(5) + ': ' + v + ' FPS   rolarFundo ' + ms + ' ms');
        }
      }
    }
    abLinhas = linhas;
    for (const alvo of ALVOS) {
      for (const braco of ['passe', 'sem']) {
        const f = linhas.filter(l => l.lugar === alvo && l.braco === braco);
        const m = f.reduce((a, l) => a + l.fps, 0) / f.length;
        const mm = f.reduce((a, l) => a + l.rolarMs, 0) / f.length;
        console.log('MEDIA ' + alvo.padEnd(10) + ' ' + braco.padEnd(5) + ': ' + m.toFixed(1) + ' FPS   ' + mm.toFixed(3) + ' ms/rolarFundo');
      }
    }
  }

  const heap = await page.evaluate(() => Math.round((performance.memory ? performance.memory.usedJSHeapSize : 0) / 1048576));
  const out = { modo: MODO, heapMB: heap, medidas: abLinhas || [] };
  for (const alvo of (MODO === 'ab' ? [] : ALVOS)) {
    for (let r = 0; r < RODADAS; r++) {
      await page.evaluate((lugar) => {
        const i = EPOCAS.findIndex(e => e.lugar === lugar);
        fecharTelas(); entrarNaEpoca(i >= 0 ? i : 0); redesenharFundo();
      }, alvo);
      await page.waitForTimeout(500);
      await page.evaluate(() => fecharTelas());
      const v = await page.evaluate(() => new Promise(res => {
        let n = 0; const t0 = performance.now();
        (function f() { n++; performance.now() - t0 < 2000 ? requestAnimationFrame(f) : res(Math.round(n / 2)); })();
      }));
      out.medidas.push({ lugar: alvo, rodada: r + 1, fps: v });
      console.log(MODO + '  ' + alvo.padEnd(10) + ' r' + (r + 1) + ': ' + v + ' FPS');
    }
  }
  const h2 = await page.evaluate(() => Math.round((performance.memory ? performance.memory.usedJSHeapSize : 0) / 1048576));
  console.log('heap: ' + heap + ' MB antes das medidas, ' + h2 + ' MB depois');
  if (erros.length) console.log('ERROS:\n' + erros.join('\n'));
  fs.writeFileSync(path.join(__dirname, 'FPS-AB-' + MODO + '.json'), JSON.stringify(out, null, 1));
  await browser.close();
  process.exit(0);
})();
