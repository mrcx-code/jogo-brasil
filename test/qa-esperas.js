// QA — AS ESPERAS NOVAS POSTAS CONTRA SI MESMAS (23/08, auditoria do ramo a0db28de).
//
// A pergunta única deste arquivo: **existe caminho em que a espera devolve sem o estado ter
// acontecido?** Esperar um estado que já é verdadeiro é o jeito elegante de desligar um teste.
//
// Cinco sondas, cada uma com o número na tela:
//   1. `waitForFunction` com predicado que LANÇA — rejeita na hora, ou continua tentando?
//      É o que decide se `jogoPronto` vira no-op quando `#telaMenu` ainda não nasceu.
//   2. `jogoPronto` depois de `goto` e depois de `reload` — devolve `true`? em quantos ms?
//   3. `jogoPronto` contra uma página que NUNCA fica pronta (o menu proibido de abrir):
//      devolve `false` — mas devolve DEPOIS de 30 s, ou na hora?
//   4. `hudNoLugar` — pode devolver com a barra ainda fora da tela?
//   5. `telaParada(id, aberta)` do smoke — quantos dos seis usos mudam de estado de verdade?
//
// Sai 0 sempre: é medida, não portão.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', process.env.JOGO_HTML || 'index.html'));
const log = (...a) => console.log(...a);

// cópias FIÉIS das funções do ramo auditado — nada é importado, para a sonda não herdar
// nenhuma correção que o autor tenha feito fora do arquivo.
async function esperarNaPagina(pg, fn, ms, arg) {
  try { await pg.waitForFunction(fn, arg, { timeout: ms || 20000 }); return true; }
  catch (e) { return false; }
}
async function jogoPronto(pg) {
  return await esperarNaPagina(pg, () => typeof S !== 'undefined' && typeof fecharTelas === 'function' &&
    !!document.getElementById('hudTop') && !!document.getElementById('pdFlor') &&
    document.getElementById('telaMenu').classList.contains('aberta'), 30000);
}
async function hudNoLugar(pg) {
  return await pg.evaluate(async () => {
    const t0 = performance.now();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const vivas = [];
    for (const id of ['hudTop', 'controls']) {
      const el = document.getElementById(id);
      if (!el || !el.getAnimations) continue;
      for (const a of el.getAnimations()) {
        if (a.playState === 'idle') continue;
        if (a.effect && a.effect.getTiming && a.effect.getTiming().iterations === Infinity) continue;
        vivas.push(a.finished.catch(() => {}));
      }
    }
    await Promise.race([Promise.all(vivas), new Promise(r => setTimeout(r, 20000))]);
    await new Promise(r => requestAnimationFrame(r));
    const cs = getComputedStyle(document.getElementById('hudTop'));
    const cc = document.getElementById('controls');
    return { ms: Math.round(performance.now() - t0), quantas: vivas.length,
             emTela: document.body.classList.contains('emTela'),
             transform: cs.transform, opacity: cs.opacity,
             opControles: cc ? getComputedStyle(cc).opacity : null };
  });
}

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

  // ---- 1 · predicado que LANÇA ----
  await page.goto(ALVO);
  let t0 = Date.now();
  const lancou = await esperarNaPagina(page, () => document.getElementById('naoExisteEsteId').classList.contains('x'), 5000);
  log('1 · predicado que lanca -> devolveu ' + lancou + ' em ' + (Date.now() - t0) + ' ms'
    + '   (se for `false` em ~0 ms, waitForFunction REJEITA no primeiro erro e a espera vira no-op)');

  // ---- 2 · jogoPronto no caminho normal ----
  t0 = Date.now();
  let r = await jogoPronto(page);
  log('2a · jogoPronto depois de goto      -> ' + r + ' em ' + (Date.now() - t0) + ' ms');
  await page.reload();
  t0 = Date.now();
  r = await jogoPronto(page);
  log('2b · jogoPronto depois de reload    -> ' + r + ' em ' + (Date.now() - t0) + ' ms');

  // quanto do boot ja tinha acontecido quando o `goto`/`reload` devolveu?
  await page.reload({ waitUntil: 'commit' });
  const cedo = await page.evaluate(() => ({
    S: typeof S !== 'undefined', hud: !!document.getElementById('hudTop'),
    menu: !!document.getElementById('telaMenu'),
    aberta: !!(document.getElementById('telaMenu') || {}).classList
      && document.getElementById('telaMenu').classList.contains('aberta'),
  })).catch(e => ({ erro: String(e).split('\n')[0] }));
  log('2c · estado logo depois de reload(commit): ' + JSON.stringify(cedo));

  // ---- 3 · a pagina ERRADA: existe `#hudTop`, nao existe `#telaMenu` (e o caso do 404 que
  //          derrubou o CI em 20/08, e o caso de um molde que perdeu a tela) ----
  const pg2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await pg2.setContent('<div id="hudTop"></div><canvas id="pdFlor"></canvas>'
    + '<script>window.S={};window.fecharTelas=function(){};</script>');
  t0 = Date.now();
  const errada = await jogoPronto(pg2);
  log('3a · jogoPronto numa pagina SEM #telaMenu -> ' + errada + ' em ' + (Date.now() - t0)
    + ' ms   (30000 = teto respeitado; ~0 = a espera nao esperou e o instrumento segue em frente)');
  // e o contraste: condicao apenas FALSA, sem lancar
  const pg3 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await pg3.setContent('<div id="hudTop"></div><canvas id="pdFlor"></canvas><div id="telaMenu"></div>'
    + '<script>window.S={};window.fecharTelas=function(){};</script>');
  t0 = Date.now();
  const falsa = await esperarNaPagina(pg3, () => typeof S !== 'undefined' &&
    document.getElementById('telaMenu').classList.contains('aberta'), 4000);
  log('3b · a MESMA espera com a condicao so FALSA -> ' + falsa + ' em ' + (Date.now() - t0)
    + ' ms   (o teto de 4000 respeitado: lancar e falsear tem destinos diferentes)');
  await pg2.close(); await pg3.close();

  // ---- 4 · hudNoLugar ----
  await page.reload();
  await jogoPronto(page);
  t0 = Date.now();
  const h = await hudNoLugar(page);   // SEM fechar as telas: a barra esta FORA da tela
  log('4a · hudNoLugar com o menu ABERTO (barra fora) -> ' + JSON.stringify(h));
  await page.evaluate(() => fecharTelas());
  const h2 = await hudNoLugar(page);
  log('4b · hudNoLugar logo depois de fecharTelas()   -> ' + JSON.stringify(h2));
  const h3 = await hudNoLugar(page);
  log('4c · hudNoLugar chamado de novo (ja parado)    -> ' + JSON.stringify(h3));

  // ---- 5 · telaParada(id, aberta) do smoke: o estado ja era o pedido? ----
  const seq = [
    ['abrirMenu', 'telaMenu', true], ['btnCompletude', 'telaCompletude', true],
    ['btnVoltarComp', 'telaMenu', true], ['btnConfig', 'telaConfig', true],
    ['btnVoltarCfg', 'telaMenu', true], ['btnJogar', 'telaMenu', false],
  ];
  log('5 · a sequencia de seis toques do smoke, com o estado ANTES de cada espera:');
  for (const [botao, tela, quer] of seq) {
    const antes = await page.evaluate(id => {
      const t = document.getElementById(id);
      return t ? t.classList.contains('aberta') : null;
    }, tela);
    await page.tap('#' + botao).catch(e => log('      (tap em #' + botao + ' falhou: ' + String(e).split('\n')[0] + ')'));
    const t1 = Date.now();
    const chegou = await esperarNaPagina(page, ([id, ab]) => {
      const t = document.getElementById(id);
      return !!t && t.classList.contains('aberta') === ab;
    }, 20000, [tela, quer]);
    log('   #' + botao.padEnd(14) + ' espera ' + tela.padEnd(15) + '=' + String(quer).padEnd(5)
      + ' | antes do toque a tela ja estava ' + String(antes).padEnd(5)
      + ' | chegou ' + chegou + ' em ' + (Date.now() - t1) + ' ms');
  }

  await browser.close();
  process.exit(0);
})().catch(e => { console.error('EXPLODIU:', e); process.exit(2); });
