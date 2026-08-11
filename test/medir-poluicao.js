// Mede a POLUIÇÃO DE TELA no jogo de verdade: quantos objetos simultâneos visíveis
// (chegadas vivas + drops + folhas + floats de número + placa de marco), pior momento e
// média, por capítulo, andando e correndo — e a renda/min de cada célula, porque qualquer
// raleio mexe na renda e a variação tem de ficar dentro de ±10%.
//
// Segura o botão dourado o tempo todo (o jeito dominante de jogar). Upgrades por capítulo
// seguem a progressão real: cap 1 = u1; cap 2 = u1+u2; cap 3 = u1+u2+u3.
// O estado é posto a 85% do vão do capítulo (fim de capítulo é o momento mais cheio:
// faixa viva ligada no 2). `verificarCenario` é neutralizado SÓ NA PÁGINA MEDIDA para o
// capítulo não virar no meio da célula — instrumentação, nada disso toca o jogo.
//
// node test/medir-poluicao.js [index.html] [segundos-por-celula] [prefixo-prints]
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
const ARQ = process.argv[2] || path.resolve(__dirname, '..', 'index.html');
const SEG = +(process.argv[3] || 90);
const PREFIXO = process.argv[4] || 'D';

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(ABRIR('file://' + path.resolve(ARQ)));
  await page.waitForTimeout(900);
  await page.evaluate(() => { if (typeof fecharTelas === 'function') fecharTelas(); if (typeof fecharTudo === 'function') fecharTudo(); });
  await page.waitForTimeout(200);

  const UPS = [
    { u1: true, u2: false, u3: false },
    { u1: true, u2: true, u3: false },
    { u1: true, u2: true, u3: true }
  ];

  async function celula(cap, modo, tirarPrint) {
    await page.evaluate(function (a) {
      fecharTudo();
      // estado realista de fim de capítulo
      const c0 = cenarioDaEpoca(a.cap);
      S.cenario = c0;
      const ini = LIMIAR_CENA * c0, span = LIMIAR_CENA * EPOCAS[a.cap].cenas;
      S.energiaTotal = ini + span * 0.85;
      S.energia = 1e6;
      S.aberturas = MASCARA_EPOCAS; S.fechos = 0; S.marcos = MASCARA_MARCOS;
      S.u1 = a.ups.u1; S.u2 = a.ups.u2; S.u3 = a.ups.u3;
      S.acolhidos = S.acolhidos.map(function () { return 0; }); S.acolhidos[1] = 40;
      S.grupo = 0; grupo.length = 0; ficando.length = 0; moradores.length = 0;
      S.modo = a.modo;
      mobs.length = 0; drops.length = 0; folhas.length = 0; floats.length = 0; parts.length = 0;
      mobChao = 0; proximoMob = -1; folhaChao = 0; proximaFolha = -1;
      // instrumentação: o capítulo não vira no meio da célula
      verificarCenario = function () {};
      redesenharFundo();
      window.__p = {
        t0: performance.now(), e0: S.energiaTotal,
        n: 0, soma: 0, pior: 0,
        cat: { mobs: 0, drops: 0, folhas: 0, floats: 0, placa: 0, canteiros: 0, parts: 0, gente: 0 },
        piorCat: null, janelas: []
      };
      if (window.__amostraPol) clearInterval(window.__amostraPol);
      window.__amostraPol = setInterval(function () {
        const p = window.__p; if (!p) return;
        const mobsN = mobs.filter(function (m) { return !m.dying && !m.dead; }).length;
        const dropsN = drops.filter(function (d) { return !d.morto; }).length;
        const folhasN = folhas.length;
        const floatsN = floats.length;
        const placaN = (typeof marcoAtivo !== 'undefined' && marcoAtivo &&
          marcoAtivo.wx - worldX <= W + 44 && marcoAtivo.wx - worldX >= -30) ? 1 : 0;
        // O CANTEIRO É UM OBJETO, e entra na conta (MUTIRAO.md §3.3). O `typeof` deixa este
        // instrumento medir também o binário de ANTES da obra, para os dois lados da régua
        // saírem do MESMO código — sem ele, o "antes" mediria um contador a menos.
        const canteirosN = (typeof canteiros !== 'undefined' && canteiros)
          ? canteiros.filter(function (c) {
              const sx = c.wx - worldX;
              return sx <= W + 60 && sx >= -60;
            }).length : 0;
        const gente = grupo.length + ficando.length + moradores.length;
        const total = mobsN + dropsN + folhasN + floatsN + placaN + canteirosN;
        p.n++; p.soma += total;
        p.cat.mobs += mobsN; p.cat.drops += dropsN; p.cat.folhas += folhasN;
        p.cat.floats += floatsN; p.cat.placa += placaN; p.cat.parts += parts.length;
        p.cat.canteiros += canteirosN;
        p.cat.gente += gente;
        if (total > p.pior) {
          p.pior = total;
          p.piorCat = { mobs: mobsN, drops: dropsN, folhas: folhasN, floats: floatsN, placa: placaN, canteiros: canteirosN, parts: parts.length, gente: gente };
        }
        const j = Math.floor((performance.now() - p.t0) / 10000);
        if (p.janelas[j] === undefined || total > p.janelas[j]) p.janelas[j] = total;
        window.__totalAgora = total;
      }, 200);
    }, { cap: cap, modo: modo, ups: UPS[cap] });

    const box = await page.evaluate(() => {
      const b = document.getElementById('btnClique');
      const r = b.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await page.mouse.move(box.x, box.y);
    await page.mouse.down();
    // print do momento mais poluído visto até agora: sonda a cada 1,5 s e fotografa recordes
    let melhorPrint = -1;
    const fim = Date.now() + SEG * 1000;
    while (Date.now() < fim) {
      await page.waitForTimeout(1500);
      if (!tirarPrint) continue;
      const agora = await page.evaluate(() => window.__totalAgora || 0);
      if (agora > melhorPrint) {
        melhorPrint = agora;
        await page.screenshot({ path: tirarPrint });
      }
    }
    await page.mouse.up();
    const m = await page.evaluate(() => {
      clearInterval(window.__amostraPol); window.__amostraPol = null;
      const p = window.__p; window.__p = null;
      p.eFim = S.energiaTotal; p.ms = performance.now() - p.t0;
      return p;
    });
    const min = m.ms / 60000;
    const r = {
      cap: cap + 1, modo: modo === 'carvao' ? 'correndo' : 'andando',
      media: +(m.soma / Math.max(1, m.n)).toFixed(2),
      pior: m.pior, piorCat: m.piorCat,
      mediaCat: {
        mobs: +(m.cat.mobs / m.n).toFixed(2), drops: +(m.cat.drops / m.n).toFixed(2),
        folhas: +(m.cat.folhas / m.n).toFixed(2), floats: +(m.cat.floats / m.n).toFixed(2),
        placa: +(m.cat.placa / m.n).toFixed(2), canteiros: +(m.cat.canteiros / m.n).toFixed(2),
        parts: +(m.cat.parts / m.n).toFixed(1),
        gente: +(m.cat.gente / m.n).toFixed(2)
      },
      janelas10s: m.janelas,
      rendaMin: +((m.eFim - m.e0) / min).toFixed(0)
    };
    console.log(JSON.stringify(r));
    return r;
  }

  const tudo = [];
  for (let cap = 0; cap < 3; cap++) {
    tudo.push(await celula(cap, 'limpo', null));
    tudo.push(await celula(cap, 'carvao', PREFIXO + '-cap' + (cap + 1) + '.png'));
  }
  console.log('\nRESUMO (objetos = chegadas+drops+folhas+floats+placa+canteiros; gente fora da conta)');
  tudo.forEach(function (r) {
    console.log('cap' + r.cap, r.modo.padEnd(8), 'media', String(r.media).padEnd(6),
      'pior', String(r.pior).padEnd(3), 'renda/min', r.rendaMin,
      '| medias por categoria', JSON.stringify(r.mediaCat));
  });
  await browser.close();
})();
