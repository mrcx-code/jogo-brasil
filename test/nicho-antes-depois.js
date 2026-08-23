// NICHO ANTES x DEPOIS — as duas esperas medidas na MESMA EXECUÇÃO, sob a mesma carga.
//
// POR QUE EXISTE (23/08). O `nicho-sob-carga.js` do QA provou que o bloco 3 do `encaixe.js`
// cai sob carga (14 em 50 com 5 processos em paralelo) e nomeou o ingrediente: ele dorme
// 400 ms de RELÓGIO depois de `fecharTelas()` e lê o nicho enquanto `#hudTop` ainda está em
// `translateY(-115%)` com `opacity 0` — a barra de cima inteira fora da tela.
//
// O que faltava para consertar com honestidade era o PAR de números. Comparar "antes" de uma
// execução com "depois" de outra não vale nada aqui: a taxa de queda é função da carga da
// máquina naquele minuto, e ela varia de 0% a 40% entre duas execuções do MESMO build (medido:
// 3 falhas em 25 numa rodada, 0 em 25 na seguinte, zero mudança de código entre elas).
//
// Então este instrumento roda as DUAS esperas na mesma execução, alternando a ordem para tirar
// o viés de quem vai primeiro, e conta as falhas de cada uma pelo MESMO critério do bloco 3:
//
//   A (ANTES)  — `await page.waitForTimeout(400)`, o que o bloco 3 fazia.
//   B (DEPOIS) — espera O ESTADO: `body` sem `emTela` e as animações de `#hudTop`/`#controls`
//                com a promessa `finished` resolvida, teto de 20 s como DETECTOR DE TRAVAMENTO
//                (nunca régua de ritmo — alargar relógio é a saída proibida).
//
// Cada variante reinicia o jogo do zero, porque a seta da microdica é posicionada UMA vez, no
// instante em que é armada, e nunca se reancora: aproveitar a mesma rodada faria B herdar a
// seta que A armou no instante errado e as duas cairiam juntas.
//
//   node test/nicho-antes-depois.js [n]
//   node test/repetir.js test/nicho-antes-depois.js 5 1     # o par de números sob carga
//
// Ele sai 1 quando B falha alguma vez (B é a espera que o conserto instalou; se ela cai, o
// conserto não é conserto) e imprime a taxa das duas. A falha de A é ESPERADA e não reprova —
// ela é a medida do defeito, não um defeito do instrumento.
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

// O BOOT ACABOU? — condição, não relógio; a MESMA que o `encaixe.js` passou a usar.
// A condição é o menu ABERTO porque `abrirTela("telaMenu")` é a última linha do
// `DOMContentLoaded` do jogo: esperar só pelos símbolos resolveria antes do fim do boot e o
// `fecharTelas()` seguinte fecharia um menu que ainda não abriu.
// Ela é comum às duas variantes de propósito — o que se compara é a espera DE DEPOIS de
// `fecharTelas()`, e só ela.
async function jogoPronto(pg) {
  // guarda de `null`: predicado que lanca faz o `waitForFunction` REJEITAR, e a espera vira
  // no-op silencioso. A mesma linha que o `encaixe.js` levou.
  await pg.waitForFunction(() => {
    const m = document.getElementById('telaMenu');
    return typeof S !== 'undefined' && typeof fecharTelas === 'function' &&
      !!document.getElementById('hudTop') && !!document.getElementById('pdFlor') &&
      !!m && m.classList.contains('aberta');
  }, null, { timeout: 30000 });
}

// A BARRA DE CIMA VOLTOU? — o estado de que a leitura depende, esperado como estado.
async function hudNoLugar(pg) {
  return await pg.evaluate(async () => {
    const t0 = performance.now();
    // dois quadros para o navegador recalcular o estilo e CRIAR a transição; sem isto
    // `getAnimations()` pode devolver lista vazia porque ela ainda nem nasceu.
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const alvos = ['hudTop', 'controls'].map(id => document.getElementById(id)).filter(Boolean);
    const vivas = [];
    for (const el of alvos) {
      if (!el.getAnimations) continue;
      for (const a of el.getAnimations()) {
        // `respira` e companhia são infinitas e nunca resolvem; só as transições interessam.
        if (a.playState === 'idle') continue;
        if (a.effect && a.effect.getTiming && a.effect.getTiming().iterations === Infinity) continue;
        vivas.push(a.finished.catch(() => {}));
      }
    }
    // teto de 20 s: DETECTOR DE TRAVAMENTO. Uma transição que não termina em 20 s é defeito,
    // e cair aqui é informação; não é folga de ritmo.
    await Promise.race([Promise.all(vivas), new Promise(r => setTimeout(r, 20000))]);
    await new Promise(r => requestAnimationFrame(r));
    const h = document.getElementById('hudTop');
    const cs = getComputedStyle(h);
    return {
      ms: Math.round(performance.now() - t0), quantas: vivas.length,
      emTela: document.body.classList.contains('emTela'),
      transform: cs.transform, opacity: cs.opacity,
    };
  });
}

// A LEITURA DO BLOCO 3, verbatim — mesma provocação, mesmos critérios.
async function ler(pg) {
  return await pg.evaluate(() => {
    S.energiaTotal = 10; S.energia = 10;
    dicaSetaArmada = true; dicaSetaVista = false;
    drops.length = 0;
    coletarDrop({ wx: worldX + HX, type: 'smog', valor: 3, t: 0 }, false);
    const rec = document.getElementById('nFlor').parentElement;
    const nicho = document.getElementById('pdFlor').getBoundingClientRect();
    const s = document.getElementById('dicaSeta').getBoundingClientRect();
    return {
      display: getComputedStyle(rec).display,
      viva: document.getElementById('dicaSeta').classList.contains('viva'),
      w: Math.round(nicho.width), h: Math.round(nicho.height),
      nichoY: Math.round(nicho.top), setaY: Math.round(s.top),
      erroX: Math.round(Math.abs((s.left + s.width / 2) - (nicho.left + nicho.width / 2))),
      abaixo: Math.round(s.top - nicho.bottom),
      naTela: s.top >= 0 && s.left >= 0 && s.top < 844 && s.left < 390,
      noPonto: (function () {
        const el = document.elementFromPoint(nicho.left + nicho.width / 2, nicho.top + nicho.height / 2);
        return el ? (el.id || el.className || el.tagName) : null;
      })(),
    };
  });
}
const reprova = r => !(r.display !== 'none') || !(r.w > 0 && r.h > 0) || !r.viva || !r.naTela ||
  !(r.erroX <= 4) || !(r.abaixo >= 0 && r.abaixo <= 12) || r.noPonto === null;

// O CONTROLE (a lição 2.8): a asserção nova do bloco 3 diz "a barra de cima JÁ está na tela".
// Se ela disser isso TAMBÉM no instante seguinte a `fecharTelas()`, ela é decoração. Lido a
// zero milissegundo, ela tem de acusar a barra fora da tela — e é isso que este número prova.
async function estadoCru(pg) {
  return await pg.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('hudTop'));
    return { emTela: document.body.classList.contains('emTela'),
             transform: cs.transform, opacity: cs.opacity };
  });
}

async function umaVariante(pg, qual) {
  await pg.evaluate(() => { localStorage.clear(); });
  await recarregar(pg);
  await jogoPronto(pg);
  await pg.evaluate(() => { fecharTelas(); S.aberturas = MASCARA_EPOCAS; salvar(); });
  const cru = await estadoCru(pg);                          // o controle, a zero ms
  let espera = null;
  if (qual === 'A') await pg.waitForTimeout(400);          // o que o bloco 3 fazia
  else espera = await hudNoLugar(pg);                       // o que ele passou a fazer
  const r = await ler(pg);
  return { r, mau: reprova(r), espera, cru };
}

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  let mauA = 0, mauB = 0, msB = [], acusou = 0, lidos = 0;
  for (let i = 1; i <= N; i++) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(ALVO);
    // ordem alternada: quem mede primeiro pega a máquina em outro estado
    const ordem = (i % 2) ? ['A', 'B'] : ['B', 'A'];
    const res = {};
    for (const q of ordem) res[q] = await umaVariante(page, q);
    if (res.A.mau) mauA++;
    if (res.B.mau) mauB++;
    if (res.B.espera) msB.push(res.B.espera.ms);
    for (const q of ordem) if (res[q].cru.emTela || res[q].cru.opacity !== '1') acusou++;
    lidos += 2;
    log('rodada ' + i + ' (' + ordem.join('>') + ')' +
      '  A[400ms]: ' + (res.A.mau ? 'FALHA' : 'ok   ') + ' nichoY=' + res.A.r.nichoY + ' setaY=' + res.A.r.setaY + ' naTela=' + res.A.r.naTela +
      '  |  B[estado]: ' + (res.B.mau ? 'FALHA' : 'ok   ') + ' nichoY=' + res.B.r.nichoY + ' setaY=' + res.B.r.setaY +
      ' esperou=' + (res.B.espera ? res.B.espera.ms + 'ms/' + res.B.espera.quantas + 'anim' : '?'));
    await ctx.close();
  }
  const pct = n => (100 * n / N).toFixed(0) + '%';
  log('');
  log('RESULTADO em ' + N + ' rodadas na MESMA execução:');
  log('  A  400 ms de relógio  -> ' + mauA + ' falhas (' + pct(mauA) + ')');
  log('  B  esperando o estado -> ' + mauB + ' falhas (' + pct(mauB) + ')' +
    (msB.length ? '   [esperou ' + Math.min(...msB) + '–' + Math.max(...msB) + ' ms]' : ''));
  log('  CONTROLE (2.8): lida a zero ms, a asserção nova acusou a barra fora da tela em '
    + acusou + ' de ' + lidos + ' leituras');
  await browser.close();
  if (!acusou) {
    log('  A ASSERÇÃO NÃO SABE REPROVAR: a zero ms ela disse "já está na tela" em todas.');
    process.exit(3);
  }
  process.exit(mauB ? 1 : 0);
})().catch(e => { console.error('EXPLODIU:', e); process.exit(2); });
