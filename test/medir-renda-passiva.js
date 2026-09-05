// DE ONDE VEM A RENDA PASSIVA (19/08) — a medição que precede o conserto (b) do PENDENTES 34.
//
// O QUE JÁ SE SABE, medido antes: parado (sem um toque) o jogo rende ~4.035/min a partir do
// capítulo 5, quase o mesmo que tocando 7×/s (4.186). O verbo ALCANÇAR virou decorativo, e o
// dono decidiu a saída (b): a renda passiva vira TETO, não motor — o automático paga até uma
// fração, o resto vem do toque, SEM punir quem lê (§2.2, a forma tem de ser ganho a mais).
//
// MAS ANTES DE MEXER, ISTO: de onde exatamente vem a renda parada? São dois caminhos, e o
// conserto depende de qual pesa. `coletarDrop(d, auto)` é chamado com:
//   · auto=FALSE quando a CORRIDA (worldX += velocidadeMundo·dt, automática) passa por cima do
//     drop — a personagem recolhe em mão o que atravessa.
//   · auto=TRUE quando o U3 (ajuda automática) recolhe um drop distante, a valor reduzido.
// Esta sonda instrumenta `coletarDrop`, deixa o jogo PARADO (nenhum toque) por uma janela, e
// conta quantos drops de cada tipo entram e quanto cada um rende — em pontos diferentes da curva
// e com melhorias diferentes. O número decide a forma do teto.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const ALVO = ABRIR('file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/'));
const JANELA = Number(process.argv[2] || 20);

(async () => {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await pg.goto(ALVO);
  await pg.waitForTimeout(2000);

  // instrumenta coletarDrop: uma vez, no escopo do jogo, contando auto/mão e somando o valor
  await pg.evaluate(() => {
    window.__renda = { auto: 0, mao: 0, vAuto: 0, vMao: 0 };
    const orig = window.coletarDrop;
    window.coletarDrop = function (d, auto) {
      const antes = S.energiaTotal;
      const r = orig.apply(this, arguments);
      const ganho = S.energiaTotal - antes;
      if (auto) { window.__renda.auto++; window.__renda.vAuto += ganho; }
      else { window.__renda.mao++; window.__renda.vMao += ganho; }
      return r;
    };
  });

  const cenas = [
    { rot: '20k SEM upgrades (o caso da sonda anterior)', energia: 20000, u1: false, u2: false, u3: false },
    { rot: '20k só u3 (a ajuda automática)', energia: 20000, u1: false, u2: false, u3: true },
    { rot: '20k tudo (u1+u2+u3)', energia: 20000, u1: true, u2: true, u3: true },
  ];

  console.log('DE ONDE VEM A RENDA PARADA (nenhum toque, ' + JANELA + ' s por ponto)\n');
  for (const c of cenas) {
    await pg.evaluate((cfg) => {
      localStorage.clear(); if (typeof fecharTelas === 'function') fecharTelas();
      fecharTudo(); pararFala();
      S.aberturas = MASCARA_EPOCAS; S.fechos = MASCARA_EPOCAS; S.travessias = 1;
      S.energiaTotal = cfg.energia; S.cenario = Math.min(TOTAL_CENAS - 1, Math.floor(cfg.energia / LIMIAR_CENA));
      S.fronteira = S.cenario; S.energia = cfg.energia;
      S.u1 = cfg.u1; S.u2 = cfg.u2; S.u3 = cfg.u3; S.u4 = false;
      window.__renda = { auto: 0, mao: 0, vAuto: 0, vMao: 0 };
    }, c);
    await pg.waitForTimeout(900);
    await pg.evaluate(() => { if (typeof fecharTelas === 'function') fecharTelas(); fecharTudo(); pararFala();
      window.__renda = { auto: 0, mao: 0, vAuto: 0, vMao: 0 }; });
    const t0 = Date.now();
    const antes = await pg.evaluate(() => S.energiaTotal);
    await pg.waitForTimeout(JANELA * 1000);   // PARADO — nenhum toque
    const r = await pg.evaluate(() => ({ renda: window.__renda, total: S.energiaTotal }));
    const seg = (Date.now() - t0) / 1000;
    const porMin = (r.total - antes) / seg * 60;
    const d = r.renda;
    console.log(c.rot);
    console.log('  renda total parada        ' + Math.round(porMin).toString().padStart(6) + '/min');
    console.log('  da CORRIDA (mão, auto=n)  ' + Math.round(d.vMao / seg * 60).toString().padStart(6) + '/min · '
      + d.mao + ' drops (' + (d.mao ? (d.vMao / d.mao).toFixed(1) : 0) + ' cada)');
    console.log('  do U3 (auto=sim)          ' + Math.round(d.vAuto / seg * 60).toString().padStart(6) + '/min · '
      + d.auto + ' drops (' + (d.auto ? (d.vAuto / d.auto).toFixed(1) : 0) + ' cada)');
    console.log('');
  }

  await nav.close();
})();
