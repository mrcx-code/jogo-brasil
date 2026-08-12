// O MENU É CENÁRIO, NÃO PARTIDA — o instrumento que mede a afirmação inteira.
//
// O dono, olhando a tela: "o jogo não deveria rodar enquanto está no menu, deve aparecer
// apenas o personagem andando e o cenário em si — sem itens, sem pessoas, sem as folhas para
// coletar, sem as placas de história… talvez valha ficar num loop para não bugar o jogo."
//
// São QUATRO afirmações, e cada uma vira número aqui:
//   1. NADA É CONTADO   — ΔenergiaTotal, Δmarcos e Δobra com o menu aberto.
//   2. NADA NASCE       — quantos mobs/drops/folhas/canteiros existem antes e depois.
//   3. NADA É PERDIDO   — cada coisa que estava lá continua lá, e no MESMO lugar de tela:
//                         wx_depois − wx_antes tem de ser exatamente worldX_depois − worldX_antes.
//   4. O CENÁRIO VIVE   — worldX andou, e a pintura de fundo mudou de pixel entre dois prints.
//
// E, de quebra, as duas medidas de tela do mesmo ticket: rolagem do #telaMenu (tem de ser
// ZERO em 390×844 e em 844×390) e prints do menu nas duas orientações.
//
//   node test/medir-loop-menu.js            (grava M-loop-*.png em test/)
//   ROTULO=antes node test/medir-loop-menu.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const ROTULO = process.env.ROTULO || 'depois';
const SEG_MENU = +(process.env.SEG_MENU || 12);

// O retrato do mundo alcançável: tudo que a mão pode encontrar na rua, com a posição de cada
// coisa. É o mesmo objeto antes e depois — a comparação é a medida.
const RETRATO = () => ({
  worldX: worldX,
  energiaTotal: S.energiaTotal,
  energia: S.energia,
  marcos: S.marcos | 0,
  obra: JSON.stringify(S.obra),
  acolhidos: JSON.stringify(S.acolhidos),
  mobs: mobs.map(m => Math.round(m.wx * 100) / 100),
  drops: drops.map(d => Math.round(d.wx * 100) / 100),
  folhas: folhas.map(f => Math.round(f.wx * 100) / 100),
  canteiros: canteiros.map(c => Math.round(c.wx * 100) / 100),
  grupo: grupo.map(c => Math.round(c.x * 100) / 100),
  moradores: moradores.map(m => Math.round(m.x * 100) / 100),
  marco: marcoAtivo ? Math.round(marcoAtivo.wx * 100) / 100 : null,
});

function comparaLista(nome, antes, depois, dx, out) {
  if (antes.length !== depois.length) {
    out.push('  ' + nome.padEnd(10) + ' ' + antes.length + ' → ' + depois.length +
      '  <<< ' + (depois.length > antes.length ? 'NASCEU' : 'SUMIU') + ' ' + Math.abs(depois.length - antes.length));
    return false;
  }
  let pior = 0;
  for (let i = 0; i < antes.length; i++) pior = Math.max(pior, Math.abs((depois[i] - antes[i]) - dx));
  out.push('  ' + nome.padEnd(10) + ' ' + String(antes.length).padStart(2) + ' itens, maior desvio de posição na tela: ' +
    pior.toFixed(2) + ' px' + (pior > 1 ? '  <<< SAIU DO LUGAR' : ''));
  return pior <= 1;
}

(async () => {
  const file = ABRIR('file://' + path.resolve(process.env.JOGO_HTML || path.join(__dirname, '..', 'index.html')));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(file);
  await page.waitForTimeout(1600);

  // Uma partida em andamento no capítulo da gente, com a ajuda automática ligada: é o pior
  // caso para a queixa, porque o u3 rende SEM dedo nenhum — era ele que subia atrás do menu.
  await page.evaluate(() => {
    fecharTelas();
    S.aberturas = MASCARA_EPOCAS; S.fechos = MASCARA_EPOCAS;
    S.cenario = cenarioDaEpoca(CAP_GENTE); S.fronteira = 6;
    S.energiaTotal = LIMIAR_CENA * S.cenario + LIMIAR_CENA * 0.9;
    S.energia = 5000; S.u1 = 1; S.u2 = 1; S.u3 = 1;
    S.acolhidos[CAP_GENTE] = 6; S.grupo = 3; semearGrupo();
    redesenharFundo();
  });
  await page.waitForTimeout(6000);       // a rua enche: chegadas, drops, folhas, canteiros

  const antes = await page.evaluate(RETRATO);
  await page.evaluate(() => { abrirTela('telaMenu'); });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(__dirname, 'M-loop-' + ROTULO + '-menu-390.png') });
  const pix1 = await page.evaluate(() => {
    const c = document.getElementById('fundoHD');
    return c.getContext('2d').getImageData(0, 0, Math.min(80, c.width), 8).data.join(',');
  });
  await page.waitForTimeout(SEG_MENU * 1000);
  const pix2 = await page.evaluate(() => {
    const c = document.getElementById('fundoHD');
    return c.getContext('2d').getImageData(0, 0, Math.min(80, c.width), 8).data.join(',');
  });
  await page.screenshot({ path: path.join(__dirname, 'M-loop-' + ROTULO + '-menu-390-depois-de-esperar.png') });

  // A ROLAGEM: o menu tem de caber. Medida com o menu aberto, nas duas orientações.
  const rol390 = await page.evaluate(() => {
    const t = document.getElementById('telaMenu');
    return { sobra: t.scrollHeight - t.clientHeight, y: getComputedStyle(t).overflowY };
  });

  const depois = await page.evaluate(RETRATO);
  await page.evaluate(() => { fecharTelas(); });
  await page.waitForTimeout(60);
  const voltou = await page.evaluate(RETRATO);
  await page.screenshot({ path: path.join(__dirname, 'M-loop-' + ROTULO + '-rua-depois-do-menu.png') });

  const dx = depois.worldX - antes.worldX;
  const out = [];
  console.log('\n===== O MENU COMO CENÁRIO — ' + ROTULO + ' (' + SEG_MENU + ' s de menu aberto)');
  console.log('\n1. NADA É CONTADO');
  console.log('  impacto total  ' + antes.energiaTotal.toFixed(2) + ' → ' + depois.energiaTotal.toFixed(2) +
    '   (Δ ' + (depois.energiaTotal - antes.energiaTotal).toFixed(2) + ')' +
    (depois.energiaTotal - antes.energiaTotal > 0.001 ? '  <<< O JOGO CONTOU ATRÁS DO MENU' : ''));
  console.log('  marcos         ' + antes.marcos + ' → ' + depois.marcos + (antes.marcos !== depois.marcos ? '  <<< PLACA LIDA SEM NINGUÉM' : ''));
  console.log('  obra           ' + antes.obra + ' → ' + depois.obra);
  console.log('  acolhidos      ' + antes.acolhidos + ' → ' + depois.acolhidos);
  console.log('\n2/3. NADA NASCE, NADA É PERDIDO  (a rua andou ' + dx.toFixed(1) + ' px de mundo)');
  ['mobs', 'drops', 'folhas', 'canteiros', 'grupo', 'moradores'].forEach(k => comparaLista(k, antes[k], depois[k], dx, out));
  out.forEach(l => console.log(l));
  console.log('  marco      ' + (antes.marco === null ? 'nenhum' : antes.marco.toFixed(1)) + ' → ' +
    (depois.marco === null ? 'nenhum' : depois.marco.toFixed(1)) +
    (antes.marco !== null && depois.marco !== null ? '  (desvio ' + ((depois.marco - antes.marco) - dx).toFixed(2) + ' px)' : ''));
  console.log('\n4. O CENÁRIO VIVE');
  console.log('  worldX andou   ' + dx.toFixed(1) + ' px' + (dx < 100 ? '  <<< O CENÁRIO PAROU' : ''));
  console.log('  pintura de fundo mudou de pixel entre os dois prints: ' + (pix1 !== pix2 ? 'SIM' : 'NÃO  <<< QUADRO CONGELADO'));
  console.log('\n5. AO FECHAR, A PARTIDA VOLTA');
  console.log('  impacto        ' + voltou.energiaTotal.toFixed(2) + '   mobs ' + voltou.mobs.length +
    '  drops ' + voltou.drops.length + '  folhas ' + voltou.folhas.length);
  console.log('\n6. A ROLAGEM DO MENU');
  console.log('  390×844   overflow-y ' + rol390.y + '   sobra ' + rol390.sobra + ' px' + (rol390.sobra > 0 ? '  <<< ROLA' : ''));

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(500);
  await page.evaluate(() => { abrirTela('telaMenu'); });
  // 900 ms e não 400: a mobília do menu BROTA (translateY 18 → 0, .42 s com até .12 s de
  // atraso), e transform entra na área rolável — medir antes do fim da animação acusa 3 px de
  // rolagem que não existem meio segundo depois.
  await page.waitForTimeout(900);
  const rolDeit = await page.evaluate(() => {
    const t = document.getElementById('telaMenu');
    return { sobra: t.scrollHeight - t.clientHeight, y: getComputedStyle(t).overflowY };
  });
  console.log('  844×390   overflow-y ' + rolDeit.y + '   sobra ' + rolDeit.sobra + ' px' + (rolDeit.sobra > 0 ? '  <<< ROLA' : ''));
  await page.screenshot({ path: path.join(__dirname, 'M-loop-' + ROTULO + '-menu-844.png') });

  // e uma tela estreita e baixa, onde a quinta tábua aperta de verdade
  await page.setViewportSize({ width: 320, height: 568 });
  await page.waitForTimeout(500);
  const rol320 = await page.evaluate(() => {
    const t = document.getElementById('telaMenu');
    return { sobra: t.scrollHeight - t.clientHeight, y: getComputedStyle(t).overflowY };
  });
  console.log('  320×568   overflow-y ' + rol320.y + '   sobra ' + rol320.sobra + ' px' + (rol320.sobra > 0 ? '  <<< ROLA (e aqui é legítimo se não couber)' : ''));
  await page.screenshot({ path: path.join(__dirname, 'M-loop-' + ROTULO + '-menu-320.png') });

  await browser.close();
})();
