// Mede a COMPOSIÇÃO do quadro, não a quantidade (a quantidade o medir-poluicao.js já mede).
// A queixa do dono: "aleatório mas não desorganizado ou caótico". A hipótese da Direção:
// a bagunça não é quantos objetos há, é ONDE eles nascem — alturas sorteadas em faixa
// contínua fazem folha, mob, NPC e número dividirem a mesma faixa de leitura.
//
// O que este script mede, segurando o botão por N segundos no cap 1 (u1):
//   1. histograma da ALTURA das folhas (h = GROUND - y), em 3 faixas: chão (h<30, se pega
//      andando), corpo (30<=h<52 — a faixa da cabeça da personagem e dos mobs), copa (h>=52,
//      só pulando);
//   2. quantos quadros amostrados têm uma folha na faixa do CORPO cruzando (|dx|<=18 px) a
//      personagem, um mob ou um NPC — a "colisão de silhueta" que o print do dono pegou;
//   3. o menor vão horizontal entre objetos de chão visíveis (mob/drop/gente), por amostra;
//   4. VAZAMENTO: abre uma tela com floats vivos e conta quantos floats continuam vivos /
//      nascendo sob body.emTela (a regra irmã de "sinal não toma tinta": sinal não aparece
//      sobre leitura).
// Fotografa o pior quadro de colisão de silhueta e o vazamento.
//
// node test/prints-composicao.js [index.html] [segundos] [prefixo]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}
const ARQ = process.argv[2] || path.resolve(__dirname, '..', 'index.html');
const SEG = +(process.argv[3] || 60);
const PREFIXO = process.argv[4] || 'COMP';

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto('file://' + path.resolve(ARQ));
  await page.waitForTimeout(900);
  await page.evaluate(() => { fecharTelas(); fecharTudo(); });
  await page.waitForTimeout(200);

  // estado: fim do cap 1, u1, correndo (o quadro mais cheio do jogo comum)
  await page.evaluate(() => {
    fecharTelas(); fecharTudo();
    const c0 = cenarioDaEpoca(0);
    S.cenario = c0;
    S.energiaTotal = LIMIAR_CENA * c0 + LIMIAR_CENA * EPOCAS[0].cenas * 0.85;
    S.energia = 1e6; S.u1 = true;
    S.modo = 'carvao';
    mobs.length = 0; drops.length = 0; folhas.length = 0; floats.length = 0; parts.length = 0;
    mobChao = 0; proximoMob = -1; folhaChao = 0; proximaFolha = -1;
    verificarCenario = function () {};
    redesenharFundo();
    window.__c = {
      n: 0, faixas: { chao: 0, corpo: 0, copa: 0 }, colisoes: 0, piorColisao: 0,
      vaoMin: Infinity, vaosSoma: 0, vaosN: 0, alturas: []
    };
    if (window.__amostraC) clearInterval(window.__amostraC);
    window.__amostraC = setInterval(function () {
      const c = window.__c; if (!c) return; c.n++;
      // 1. alturas das folhas visíveis
      let corpoAgora = 0;
      folhas.forEach(function (f) {
        const sx = f.wx - worldX; if (sx < -14 || sx > W + 14) return;
        const h = GROUND - f.y;
        c.alturas.push(Math.round(h));
        const faixa = h < 30 ? 'chao' : h < 52 ? 'corpo' : 'copa';
        c.faixas[faixa]++;
        // 2. colisão de silhueta: folha na faixa do corpo cruzando gente/mob/personagem
        if (faixa === 'corpo') {
          const xs = [HX];
          mobs.forEach(function (m) { if (!m.dying) xs.push(m.wx - worldX); });
          (typeof grupo !== 'undefined' ? grupo : []).forEach(function (g) { xs.push(g.x - worldX); });
          if (xs.some(function (x) { return Math.abs(x - sx) <= 18; })) corpoAgora++;
        }
      });
      if (corpoAgora) c.colisoes++;
      window.__colAgora = corpoAgora;
      // 3. vãos horizontais entre objetos de chão visíveis
      const chao = [];
      mobs.forEach(function (m) { if (!m.dying) { const x = m.wx - worldX; if (x > -10 && x < W + 10) chao.push(x); } });
      drops.forEach(function (d) { if (!d.morto) { const x = d.wx - worldX; if (x > -10 && x < W + 10) chao.push(x); } });
      chao.sort(function (a, b) { return a - b; });
      for (let i = 1; i < chao.length; i++) {
        const v = chao[i] - chao[i - 1];
        c.vaosSoma += v; c.vaosN++; if (v < c.vaoMin) c.vaoMin = v;
      }
    }, 200);
  });

  const box = await page.evaluate(() => {
    const r = document.getElementById('btnClique').getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  let piorCol = -1;
  const fim = Date.now() + SEG * 1000;
  while (Date.now() < fim) {
    await page.waitForTimeout(1200);
    const agora = await page.evaluate(() => window.__colAgora || 0);
    if (agora > piorCol) {
      piorCol = agora;
      await page.screenshot({ path: path.resolve(__dirname, PREFIXO + '-silhueta.png') });
    }
  }
  await page.mouse.up();

  const m = await page.evaluate(() => {
    clearInterval(window.__amostraC); window.__amostraC = null;
    const c = window.__c; window.__c = null;
    c.vaoMin = c.vaoMin === Infinity ? null : Math.round(c.vaoMin);
    c.vaoMedio = c.vaosN ? Math.round(c.vaosSoma / c.vaosN) : null;
    // histograma compacto das alturas, passos de 10
    const hist = {};
    c.alturas.forEach(function (h) { const k = Math.floor(h / 10) * 10; hist[k] = (hist[k] || 0) + 1; });
    c.hist = hist; delete c.alturas;
    return c;
  });
  const totF = m.faixas.chao + m.faixas.corpo + m.faixas.copa || 1;
  console.log('FAIXAS das folhas (amostras):', JSON.stringify(m.faixas),
    '| corpo =', (100 * m.faixas.corpo / totF).toFixed(0) + '%');
  console.log('HISTOGRAMA h (passos de 10 px):', JSON.stringify(m.hist));
  console.log('COLISÕES de silhueta: em', m.colisoes, 'de', m.n, 'amostras ('
    + (100 * m.colisoes / m.n).toFixed(0) + '%)');
  console.log('VÃO de chão: mínimo', m.vaoMin, 'px · médio', m.vaoMedio, 'px');

  // 4. VAZAMENTO: floats vivos + nascendo sob body.emTela
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await page.waitForTimeout(1200);           // floats do toque vivos
  const vaz = await page.evaluate(() => {
    abrirTela('telaMenu');                    // qualquer tela de leitura serve
    const antes = floats.length;
    clicar(false, false, false);              // um golpe COM a tela aberta: nasce float?
    return { vivosAoAbrir: antes, aposGolpe: floats.length, emTela: document.body.classList.contains('emTela') };
  });
  await page.waitForTimeout(400);            // deixa o quadro desenhar com a tela aberta
  const vaz2 = await page.evaluate(() => ({ vivosDepois: floats.length }));
  await page.screenshot({ path: path.resolve(__dirname, PREFIXO + '-vazamento.png') });
  await page.mouse.up();
  console.log('VAZAMENTO sob emTela:', JSON.stringify(Object.assign(vaz, vaz2)),
    '(regra: floats não nascem e os vivos somem — qualquer valor > 0 depois é vazamento)');
  await browser.close();
})();
