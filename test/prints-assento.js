// PRINTS DO ASSENTO — a mesma rua, nos quatro capitulos, no mesmo worldX e na mesma hora,
// com folha nos dois trilhos e um objeto de cada. Salva a tela inteira e uma LUPA de 3x na
// faixa do chao, que e onde a levitacao se ve.
//   node test/prints-assento.js A     (antes)
//   node test/prints-assento.js D     (depois)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const TAG = (process.argv[2] || 'A').toUpperCase();
const CENAS = [
  { cena: 0, nome: 'cap1' }, { cena: 2, nome: 'cap2' },
  { cena: 4, nome: 'cap3' }, { cena: 5, nome: 'cap4' }
];
(async () => {
  // JOGO_HTML aponta o alvo — o ANTES sai de um build guardado, nao do arquivo de agora.
  const file = 'file://' + path.resolve(process.env.JOGO_HTML || path.join(__dirname, '..', 'index.html'));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  // dsf 3: a lupa precisa de pixel de sobra para o olho decidir se a base encosta. O mundo
  // (W/H/GROUND) sai de innerWidth/innerHeight e nao muda com isto — so a camada HD engorda.
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(file);
  await page.waitForTimeout(1400);
  await page.evaluate(() => { if (typeof fecharTelas === 'function') fecharTelas(); if (typeof fecharTudo === 'function') fecharTudo(); });
  await page.waitForTimeout(200);
  for (const c of CENAS) {
    const geo = await page.evaluate(async (cena) => {
      // nada de abertura, fecho ou marco por cima da rua: o que se mede aqui e o chao
      if (typeof MASCARA_EPOCAS !== 'undefined') { S.aberturas = MASCARA_EPOCAS; S.fechos = MASCARA_EPOCAS; }
      if (typeof MASCARA_MARCOS !== 'undefined') S.marcos = MASCARA_MARCOS;
      if (typeof MASCARA_TRAVESSIAS !== 'undefined') S.travessias = MASCARA_TRAVESSIAS;
      S.cenario = cena; S.modo = 'limpo'; S.energiaTotal = 1500 * cena + 40;
      // hora fixa: meio-dia, para a luz nao mudar entre A e D
      if (typeof window.setHora === 'function') window.setHora(0.5);
      worldX = 1200;
      mobs.length = 0; drops.length = 0; folhas.length = 0;
      proximoMob = 1e9; mobChao = 0; proximaFolha = 1e9; folhaChao = 0;
      ['smog', 'barrel', 'cash'].forEach(function (t, i) {
        const m = novoMob(t, worldX + 46 + i * 32);
        m.parado = true; m.espera = 1e9; m.hp = m.hpMax; mobs.push(m);
      });
      ['smog', 'barrel', 'cash'].forEach(function (t, i) {
        drops.push({ wx: worldX + 8 + i * 18, t: 0, type: t, valor: 4 });
      });
      const semearFolhas = function () {
        folhas.length = 0;
        // Tres folhas, uma por estado. No ANTES o trilho de baixo nao tem queda nenhuma e as
        // duas primeiras ficam paradas onde nasceram — que e' exatamente o defeito medido.
        const caindo = typeof FOLHA_POUSO !== 'undefined'
          ? function (wx, y, t) { return { wx: wx, y: y, fase: 0, yFim: GROUND - FOLHA_POUSO, q0: worldX - 90 * t, queda: 90 }; }
          : function (wx, y) { return { wx: wx, y: y, fase: 0 }; };
        folhas.push(caindo(worldX + 24, GROUND - 24, 1));     // ja pousada (atras dela: nao e' recolhida no meio do print)
        folhas.push(caindo(worldX + 95, GROUND - 24, 0.45));  // no meio da queda
        folhas.push({ wx: worldX + 62, y: GROUND - 62, fase: 0 });   // copa: a excecao legitima
      };
      semearFolhas();
      fecharTelas();
      await new Promise(res => setTimeout(res, 700));
      fecharTelas();
      await new Promise(res => setTimeout(res, 120));
      // a rua anda entre uma chamada e a proxima, e folha rente ao chao e' COLETAVEL — se ela
      // for semeada aqui, o print pega o "+4.0" e nao a folha. Fica exposta para ser semeada
      // no ultimo instante, ja com a regua na tela.
      window.__semear = semearFolhas;
      const hc = document.getElementById('heroHD');
      return { GROUND: GROUND, H: H, ky: hc.height / H, dpr: window.devicePixelRatio || 1 };
    }, c.cena);
    const est = await page.evaluate(() => ({ cen: S.cenario, et: Math.round(S.energiaTotal), cls: document.body.className, trav: travessiaAtiva(), fala: falaAberta(), folhas: folhas.length, mobs: mobs.length, drops: drops.length }));
    console.log('   estado:', JSON.stringify(est));
    const gTela = Math.round(geo.GROUND * (844 / geo.H));
    // A REGUA: uma linha de 1 px na altura EXATA de GROUND, por cima de tudo. Sem ela o olho
    // negocia com a pintura sobre onde o chao esta; com ela nao ha negociacao.
    await page.evaluate((y) => {
      let d = document.getElementById('__regua');
      if (!d) { d = document.createElement('div'); d.id = '__regua'; document.body.appendChild(d); }
      d.style.cssText = 'position:fixed;left:0;right:0;top:' + y + 'px;height:1px;background:#ff2b6b;z-index:99999;pointer-events:none';
    }, gTela);
    await page.evaluate(() => { window.__semear(); });
    const alvo = path.resolve(__dirname, 'AS-' + TAG + '-' + c.nome + '.png');
    await page.screenshot({ path: alvo });
    await page.evaluate(() => { window.__semear(); });
    const y0 = Math.max(0, gTela - 150), alt = Math.min(844 - y0, 190);
    await page.screenshot({ path: path.resolve(__dirname, 'AS-' + TAG + '-' + c.nome + '-lupa.png'),
      clip: { x: 0, y: y0, width: 320, height: alt }, scale: 'device' });
    await page.evaluate(() => { const d = document.getElementById('__regua'); if (d) d.remove(); });
    console.log('AS-' + TAG + '-' + c.nome + '  chao na tela y=' + gTela);
  }
  await browser.close();
})();
