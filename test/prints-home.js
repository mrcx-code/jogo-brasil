// A HOME NAS QUATRO TELAS QUE A DECIDEM — o instrumento do increment 2 (diorama, 22/08).
//
// POR QUE ELE É PERMANENTE E OS PRINTS NÃO SÃO. Um par 1366×768 pesa 10 MB; os oito prints da
// rodada de 22/08 pesavam 18 MB, num repositório onde 12 MB de print já entraram por engano uma
// vez (ver .gitignore). Então versiona-se o par 390×844 — que é o antes/depois que sustenta o
// número no NOTES.md — e o resto se refaz aqui, num comando:
//
//     node test/prints-home.js DIO-DEPOIS
//
// Ele imprime junto os números que a arte pede para julgar sem abrir o DOM: rolagem do menu,
// caixa do poste, do logo, do JOGAR e do CONFIGURAÇÕES, e a caixa da PERSONAGEM em px de CSS —
// é ela que diz, sem discussão, em que telas a personagem aparece e em quais o poste a cobre
// inteira (PENDENTES 53).
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
const PREF = process.argv[2] || 'HOME';

const TELAS = [
  { nome: '390x844', w: 390, h: 844 },     // o celular de referência do smoke
  { nome: '390x568', w: 390, h: 568 },     // o retrato curto, piso do que ainda se vende
  { nome: '844x390', w: 844, h: 390 },     // telefone deitado — o poste de dois lados
  { nome: '1366x768', w: 1366, h: 768 },   // notebook — a home cinemática
];

// Esperar a mobília PARAR de brotar, e não um relógio: é o conserto de 21/08 que tirou 7 px de
// espalhamento das medidas do poste (a `respira` do logo é infinita e sai da lista pelo nome).
async function abrirMenuParado(page) {
  await page.evaluate(async () => {
    fecharTelas(); abrirTela('telaMenu');
    const tela = document.getElementById('telaMenu');
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const vivas = tela.getAnimations({ subtree: true })
      .filter(a => a.animationName !== 'respira')
      .map(a => a.finished.catch(() => {}));
    await Promise.race([Promise.all(vivas), new Promise(r => setTimeout(r, 3000))]);
    await new Promise(r => requestAnimationFrame(r));
  });
}

(async () => {
  const nav = await chromium.launch();
  const erros = [];
  for (const t of TELAS) {
    const pg = await nav.newPage({ viewport: { width: t.w, height: t.h }, deviceScaleFactor: 2,
      hasTouch: t.w < 900, isMobile: t.w < 900 });
    pg.on('pageerror', e => erros.push(t.nome + ' PAGEERROR: ' + e.message));
    pg.on('console', m => { if (m.type() === 'error') erros.push(t.nome + ' CONSOLE: ' + m.text()); });
    await pg.goto(ALVO);
    await pg.evaluate(() => localStorage.clear());
    await pg.reload();
    await pg.waitForTimeout(1200);
    await abrirMenuParado(pg);
    await pg.waitForTimeout(500);
    const m = await pg.evaluate(() => {
      const cx = (id) => { const e = document.getElementById(id); if (!e) return null;
        const r = e.getBoundingClientRect();
        return [r.x, r.y, r.width, r.height].map(v => Math.round(v * 10) / 10).join('/'); };
      const tela = document.getElementById('telaMenu');
      const hc = document.getElementById('heroHD');
      const cssW = parseFloat(hc.style.width), cssH = parseFloat(hc.style.height);
      const alt = HERO_TARGET * (cssH / H);
      const ela = { x: Math.round(HX * (cssW / W) - 20), y: Math.round(GROUND * (cssH / H) - alt),
        w: 40, h: Math.round(alt) };
      const p = document.getElementById('poste').getBoundingClientRect();
      const escondida = ela.x > p.left - 20 && ela.x + ela.w < p.right + 20
        && ela.y > p.top - 2 && ela.y + ela.h < p.bottom + 2;
      const dio = document.getElementById('homeCena');
      return {
        rolagem: tela.scrollHeight - tela.clientHeight,
        poste: cx('poste'), logo: cx('logoImg'), jogar: cx('btnJogar'), config: cx('btnConfig'),
        ela: ela.x + '/' + ela.y + '/' + ela.w + '/' + ela.h,
        elaAtrasDoPoste: escondida,
        diorama: dio ? getComputedStyle(dio).display : 'ausente',
      };
    });
    console.log(t.nome.padEnd(9) + ' rolagem ' + String(m.rolagem).padStart(3)
      + '  poste ' + m.poste + '  logo ' + m.logo
      + '\n          jogar ' + m.jogar + '  config ' + m.config
      + '\n          personagem ' + m.ela + (m.elaAtrasDoPoste ? '  <-- INTEIRA atrás do poste' : '  (aparece)')
      + '  ·  diorama ' + m.diorama);
    await pg.screenshot({ path: path.join(__dirname, PREF + '-' + t.nome + '.png') });
    await pg.close();
  }
  console.log(erros.length ? 'ERROS:\n' + erros.join('\n') : 'zero erro de console nas quatro telas');
  await nav.close();
})();
