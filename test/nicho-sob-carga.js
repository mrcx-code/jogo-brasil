// NICHO-SOB-CARGA — o bloco 3 do `encaixe.js`, isolado e repetido, para separar flake de defeito.
//
// Reproduz VERBATIM o caminho do bloco 3 (os nichos nascem com o primeiro item + a seta pousa
// no nicho) e imprime os números crus de cada rodada, para responder "cai sempre ou cai às
// vezes?" sem pagar 2.800 linhas de portão por amostra (o `encaixe.js` inteiro leva 234 s).
//
// O QUE ELE ACHOU, 22/08, e é o ingrediente com nome:
//   calmo, em fila            -> 0 falhas em 8 rodadas
//   5 processos em paralelo   -> 14 falhas em 50 rodadas (28%)
// No instante da falha o nicho lê y = -79 (fora da tela) e a cadeia mostra
// `#hudTop = matrix(1,0,0,1,0,-93.15)` com `opacity 0` e a transição `transform@hudTop` em
// currentTime 0 — ou seja, a BARRA DE CIMA INTEIRA ainda está estacionada fora da tela.
// `#hudTop, #controls { transition: transform .34s }` e `body.emTela #hudTop { translateY(-115%) }`
// (estilo.css 582-583): o bloco 3 chama `fecharTelas()` e espera 400 ms de RELÓGIO — 60 ms de
// folga sobre 340 ms de transição que, sob carga, nem começou quando a leitura acontece.
// É a mesma doença da seção 9, e a mesma cura: esperar O ESTADO (as `finished` das animações),
// nunca o relógio. Depois de assentar o nicho volta para y = 14 em 100% das falhas — o layout
// está certo; quem estava errado era o instante da leitura.
//
// (A seta é caso à parte e fica registrada: ela é posicionada UMA vez, no instante em que é
// armada, e nunca se reancora — por isso, nas rodadas ruins, ela continua em y negativo mesmo
// depois de o nicho assentar. No jogo de verdade ela só é armada com a pessoa já na rua, bem
// depois dos 340 ms, então não há defeito medido para a pessoa; há fragilidade para quem medir.)
//
// node test/nicho-sob-carga.js [n]
// node test/repetir.js test/nicho-sob-carga.js 5 1     # o número sob carga
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

const N = Number(process.argv[2] || 5);
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', process.env.JOGO_HTML || 'index.html'));
const log = (...a) => console.log(...a);

async function recarregar(pg) {
  for (let t = 1; ; t++) {
    try { await pg.reload(); return; }
    catch (e) {
      if (t >= 6 || String(e).indexOf('ERR_CONNECTION_REFUSED') < 0) throw e;
      await new Promise(r => setTimeout(r, 500 * t));
    }
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  let mau = 0;
  for (let i = 1; i <= N; i++) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(ALVO);
    await page.evaluate(() => { localStorage.clear(); });
    await recarregar(page);
    await page.waitForTimeout(900);

    // ---- o caminho do bloco 3, igual ao encaixe.js ----
    await page.evaluate(() => { localStorage.clear(); });
    await recarregar(page);
    await page.waitForTimeout(700);
    await page.evaluate(() => { fecharTelas(); S.aberturas = MASCARA_EPOCAS; salvar(); });
    await page.waitForTimeout(400);

    const nasceu = await page.evaluate(() => {
      S.energiaTotal = 10; S.energia = 10;
      dicaSetaArmada = true; dicaSetaVista = false;
      drops.length = 0;
      coletarDrop({ wx: worldX + HX, type: 'smog', valor: 3, t: 0 }, false);
      const rec = document.getElementById('nFlor').parentElement;
      const nicho = document.getElementById('pdFlor').getBoundingClientRect();
      const seta = document.getElementById('dicaSeta');
      const s = seta.getBoundingClientRect();
      return {
        display: getComputedStyle(rec).display, flor: S.recursos.flor,
        viva: seta.classList.contains('viva'),
        nicho: { x: Math.round(nicho.left), y: Math.round(nicho.top), w: Math.round(nicho.width), h: Math.round(nicho.height) },
        seta: { x: Math.round(s.left), y: Math.round(s.top), w: Math.round(s.width) },
        erroX: Math.round(Math.abs((s.left + s.width / 2) - (nicho.left + nicho.width / 2))),
        abaixo: Math.round(s.top - nicho.bottom),
        naTela: s.top >= 0 && s.left >= 0 && s.top < 844 && s.left < 390,
        noPonto: (function () {
          const el = document.elementFromPoint(nicho.left + nicho.width / 2, nicho.top + nicho.height / 2);
          return el ? (el.id || el.className || el.tagName) : null;
        })(),
        // QUEM ESTÁ ANDANDO no instante da leitura — o ingrediente com nome
        anims: (document.getAnimations ? document.getAnimations() : []).map(function (a) {
          const t = a.effect && a.effect.target;
          return (a.animationName || a.transitionProperty || '?') + '@' +
            (t ? (t.id || t.className || t.tagName) : '?') + ':' + Math.round(a.currentTime || 0);
        }),
        transf: (function () {
          const p = document.getElementById('pdFlor');
          const out = [];
          for (let e = p; e && e !== document.documentElement; e = e.parentElement) {
            const cs = getComputedStyle(e);
            if (cs.transform && cs.transform !== 'none') out.push((e.id || e.className) + '=' + cs.transform);
            if (cs.opacity !== '1') out.push((e.id || e.className) + ' op=' + cs.opacity);
          }
          return out;
        })(),
        prontidao: document.readyState,
      };
    });

    // e o MESMO estado relido DEPOIS de a animação de entrada assentar — a hipótese do pai
    const depois = await page.evaluate(async () => {
      const fila = document.getElementById('pdFlor').parentElement || document.body;
      const vivas = fila.getAnimations ? fila.getAnimations({ subtree: true }).map(a => a.finished.catch(() => {})) : [];
      await Promise.race([Promise.all(vivas), new Promise(r => setTimeout(r, 2000))]);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const nicho = document.getElementById('pdFlor').getBoundingClientRect();
      const s = document.getElementById('dicaSeta').getBoundingClientRect();
      return {
        nicho: { x: Math.round(nicho.left), y: Math.round(nicho.top), w: Math.round(nicho.width), h: Math.round(nicho.height) },
        setaY: Math.round(s.top),
        naTela: s.top >= 0 && s.left >= 0 && s.top < 844 && s.left < 390,
        noPonto: (function () {
          const el = document.elementFromPoint(nicho.left + nicho.width / 2, nicho.top + nicho.height / 2);
          return el ? (el.id || el.className || el.tagName) : null;
        })(),
      };
    });

    const falhou = !(nasceu.display !== 'none') || !(nasceu.nicho.w > 0 && nasceu.nicho.h > 0) ||
      !nasceu.viva || !nasceu.naTela || !(nasceu.erroX <= 4) ||
      !(nasceu.abaixo >= 0 && nasceu.abaixo <= 12) || nasceu.noPonto === null;
    if (falhou) mau++;
    log('rodada ' + i + ': ' + (falhou ? 'FALHA' : 'ok   ') +
      ' | nicho ' + JSON.stringify(nasceu.nicho) + ' seta y=' + nasceu.seta.y +
      ' erroX=' + nasceu.erroX + ' abaixo=' + nasceu.abaixo + ' naTela=' + nasceu.naTela +
      ' noPonto=' + nasceu.noPonto);
    if (falhou) {
      log('        ANDANDO no instante: ' + (nasceu.anims.length ? nasceu.anims.join(' | ') : '(nenhuma animacao)'));
      log('        TRANSFORMS na cadeia: ' + (nasceu.transf.length ? nasceu.transf.join(' | ') : '(nenhum)') + ' | readyState=' + nasceu.prontidao);
    }
    log('        DEPOIS de assentar: nicho ' + JSON.stringify(depois.nicho) + ' setaY=' + depois.setaY +
      ' naTela=' + depois.naTela + ' noPonto=' + depois.noPonto);
    await ctx.close();
  }
  log('RESULTADO: ' + mau + ' falhas em ' + N + ' rodadas');
  await browser.close();
  process.exit(mau ? 1 : 0);
})().catch(e => { console.error('EXPLODIU:', e); process.exit(2); });
