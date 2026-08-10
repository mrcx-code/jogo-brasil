// CONFIRMAR — os carregados do relatório anterior, remedidos de primeira mão.
// Sem herdar conclusão de ninguém: cada um roda contra o index.html da RAIZ de hoje.
// node test/confirmar.js
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const ABRIR = require('./abrir.js');
function chromiumPath() { for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p; return undefined; }
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', process.env.JOGO_HTML || 'index.html'));
const log = (...a) => console.log(...a);

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const erros = []; page.on('pageerror', e => erros.push(e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await page.goto(ALVO); await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(900);

  // ---- 1 · recarregar NO MEIO da travessia devolve o PULAR (B2 do relatório 2) ----
  log('\n== 1 · recarregar no meio da travessia ==');
  await page.evaluate(() => {
    localStorage.clear();
    S.travessias = 0; S.aberturas = 1; S.fechos = 1;
    S.cenario = 1; S.fronteira = 1; S.energiaTotal = LIMIARES[1] + 5; S.energia = S.energiaTotal;
    fecharTelas();
    correrTravessia('pindorama', 'palmares', function () {});
  });
  await page.waitForTimeout(3800);
  const meio = await page.evaluate(() => ({
    ativa: travessiaAtiva(), bit: S.travessias, linha: falaI,
    pular: getComputedStyle(document.getElementById('btnFalaPular')).display
  }));
  log('   no meio -> ativa:', meio.ativa, '| bit já gravado:', meio.bit, '| linha', meio.linha, '| PULAR:', meio.pular);
  await page.evaluate(() => { salvar(); });
  await page.reload(); await page.waitForTimeout(1200);
  const depois = await page.evaluate(() => {
    // a volta cai no menu; entrar de novo é o caminho de quem volta
    fecharTelas(); S.energiaTotal = LIMIARES[1] + 5;
    verificarCenario();
    return { bit: S.travessias, trav: travessiaAtiva(), fala: falaAberta() };
  });
  await page.waitForTimeout(300);
  const volta = await page.evaluate(() => ({
    trav: travessiaAtiva(), bit: S.travessias,
    pular: getComputedStyle(document.getElementById('btnFalaPular')).display,
    semPular: document.body.classList.contains('semPular')
  }));
  log('   depois do reload -> bit:', volta.bit, '| travessia rodando de novo:', volta.trav,
    '| PULAR:', volta.pular, '| body.semPular:', volta.semPular);
  log('   VEREDITO: ' + (volta.pular !== 'none'
    ? 'CONFIRMADO — o PULAR volta sem ninguém ter atravessado uma vez'
    : 'não reproduziu — o PULAR continua escondido'));

  // ---- 2 · os três contadores do HUD sobrevivem ao boot? (B5) ----
  log('\n== 2 · os três contadores do HUD ==');
  const rec = await page.evaluate(() => {
    S.recursos = { flor: 7, agua: 3, refeicao: 9 };
    salvar();
    const bruto = JSON.parse(localStorage.getItem(CHAVE_JOGO));
    return { noSave: 'recursos' in bruto, noEsquema: 'recursos' in ESQUEMA_SAVE, campos: Object.keys(bruto).length };
  });
  await page.reload(); await page.waitForTimeout(900);
  const rec2 = await page.evaluate(() => JSON.stringify(S.recursos));
  log('   gravado no save:', rec.noSave, '| existe no ESQUEMA_SAVE:', rec.noEsquema, '| depois do boot:', rec2);
  log('   VEREDITO: ' + (rec.noSave ? 'persiste' : 'CONFIRMADO — os três contadores zeram a cada boot'));

  // ---- 3 · a barra de vida sobre a coluna da personagem (B4) ----
  log('\n== 3 · barra de vida na coluna da personagem (capítulo 1) ==');
  const barra = await page.evaluate(async () => {
    fecharTelas();
    S.cenario = 0; S.fronteira = 0; S.energiaTotal = 100; S.energia = 100;
    mobs.length = 0; drops.length = 0; folhas.length = 0;
    const m = novoMob('smog', worldX + HX);
    mobs.push(m);
    m.hp = Math.max(1, Math.floor(m.hpMax / 2));
    desenharMundo && desenharMundo();
    await new Promise(r => setTimeout(r, 120));
    const cv = document.getElementById('scene');
    const g = cv.getContext('2d');
    // a faixa da barra fica sobre a cabeça da chegada; varremos a coluna da personagem
    const x0 = Math.max(0, Math.round(HX) - 14), larg = 28;
    const y0 = Math.max(0, GROUND - 44), alt = 26;
    const d = g.getImageData(x0, y0, larg, alt).data;
    let pintados = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 40) pintados++;
    return { pintados, total: larg * alt, hp: m.hp, hpMax: m.hpMax, tipo: m.tipo };
  });
  log('   chegada na MESMA coluna da personagem, com dano -> pixels pintados na faixa da barra:',
    barra.pintados, 'de', barra.total, '| tipo', barra.tipo, '| hp', barra.hp + '/' + barra.hpMax);
  await page.screenshot({ path: path.join(__dirname, 'X-29-barra-na-coluna.png') });

  // ---- 4 · a caixa vazia da travessia, em print ----
  log('\n== 4 · print da linha mais curta da travessia (a caixa é do tamanho da mais longa) ==');
  await page.evaluate(async () => {
    fecharTelas();
    S.travessias = 1;
    correrTravessia('pindorama', 'palmares', function () {});
    await new Promise(r => setTimeout(r, 3600));
    if (emCerimonia()) fimCerimonia();
    // a linha "Então este trecho é só o mar" — a mais curta com peso
    falaI = TRAVESSIAS[0].linhas.findIndex(l => /só o mar/.test(l));
    revelarFala();
    await new Promise(r => setTimeout(r, 1200));
    terminarLinha();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(__dirname, 'X-30-travessia-caixa-vazia.png') });
  const vazio = await page.evaluate(() => {
    const cx = document.getElementById('falaCaixa').getBoundingClientRect();
    const rg = document.createRange();
    rg.selectNodeContents(document.getElementById('falaTxt'));
    const t = rg.getBoundingClientRect();
    return { caixa: Math.round(cx.height), texto: Math.round(t.height),
      vazio: Math.round(100 * (1 - t.height / cx.height)) };
  });
  log('   caixa ' + vazio.caixa + ' px, texto ' + vazio.texto + ' px -> ' + vazio.vazio + '% de papel vazio nesta linha');

  log('\n== ERROS ==');
  log(erros.length ? erros.join('\n') : '(nenhum)');
  await browser.close();
})().catch(e => { console.error('EXPLODIU:', e); process.exit(1); });
