// A HOME NAS TELAS QUE A DECIDEM — o instrumento do increment 2 (diorama, 22/08).
// Eram quatro; passaram a SEIS em 22/08, com a subida da linha do chão (PENDENTES 53).
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
  // AS DUAS QUE A SUBIDA DO CHÃO ATINGE (22/08). A faixa livre entre a proposta e o topo do
  // poste só chega a caber a personagem MAIS 16 px de respiro em telas de retrato altas: 119
  // px no Pixel e 128 no iPhone Max, contra 83 no 390×844 e 9 no 390×568. Sem estas duas
  // linhas, o instrumento que existe para julgar o enquadramento não veria o enquadramento
  // novo em tela nenhuma.
  { nome: '412x915', w: 412, h: 915 },     // Pixel 7/8 — a faixa DÁ, o chão sobe
  { nome: '430x932', w: 430, h: 932 },     // iPhone 15 Pro Max — idem
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
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
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
      // A CAIXA DELA É A DO `desenharHeroiHD`, e a aproximação antiga (40 px de largura, x−20)
      // foi trocada em 22/08 porque ela erra 14 px de largura e não acompanha a folha do
      // capítulo. A caixa alfa do `#heroHD` TAMBÉM não serve: o plano da frente é desenhado na
      // mesma camada e a folha da quina entra na conta (medido: 102 px de altura onde ela tem
      // 88, e 511 px de largura em tela deitada).
      const img = heroBloco('walk')[0];
      const sc = HERO_TARGET / img.naturalHeight;
      const kx = telaW() / W, ky = telaH() / H;
      const ela = { x: HX * kx - img.naturalWidth * sc * kx / 2, y: GROUND * ky - HERO_TARGET * ky,
        w: img.naturalWidth * sc * kx, h: HERO_TARGET * ky };
      const p = document.getElementById('poste').getBoundingClientRect();
      const escondida = ela.x >= p.left - 1 && ela.x + ela.w <= p.right + 1
        && ela.y >= p.top - 1 && ela.y + ela.h <= p.bottom + 1;
      const dio = document.getElementById('homeCena');
      const sub = document.getElementById('menuSub');
      const posteEl = document.getElementById('poste');
      const r2 = (v) => Math.round(v * 10) / 10;
      return {
        rolagem: tela.scrollHeight - tela.clientHeight,
        poste: cx('poste'), logo: cx('logoImg'), jogar: cx('btnJogar'), config: cx('btnConfig'),
        ela: [ela.x, ela.y, ela.w, ela.h].map(r2).join('/'),
        elaAtrasDoPoste: escondida,
        // A FAIXA LIVRE e a régua do dono: altura dela + 8 de respiro de cada lado.
        faixa: r2(posteEl.offsetTop - (sub.offsetTop + sub.offsetHeight)),
        precisa: r2(ela.h + 16),
        chao: chaoHome ? chaoHome.toFixed(4) : '0.6800',
        ground: GROUND + '/' + H,
        diorama: dio ? getComputedStyle(dio).display : 'ausente',
      };
    });
    console.log(t.nome.padEnd(9) + ' rolagem ' + String(m.rolagem).padStart(3)
      + '  poste ' + m.poste + '  logo ' + m.logo
      + '\n          jogar ' + m.jogar + '  config ' + m.config
      + '\n          personagem ' + m.ela + (m.elaAtrasDoPoste ? '  <-- INTEIRA atrás do poste' : '  (aparece)')
      + '\n          faixa ' + m.faixa + ' (precisa ' + m.precisa + ')  ·  chão ' + m.chao
      + '  ·  GROUND ' + m.ground
      + '  ·  diorama ' + m.diorama);
    await pg.screenshot({ path: path.join(__dirname, PREF + '-' + t.nome + '.png') });
    await pg.close();
  }
  console.log(erros.length ? 'ERROS:\n' + erros.join('\n') : 'zero erro de console nas ' + TELAS.length + ' telas');
  await nav.close();
})();
