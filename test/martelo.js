// MARTELO — bate pointerdown no jogo por N segundos e vê se a aba morre ou se o heap cresce.
//
// POR QUE EXISTE (22/08). O `medir-emenda.js` foi relatado morrendo com `Target crashed` no §1,
// e "Target crashed" é a ABA MORRENDO, não uma asserção falhando. Duas causas com destinos
// opostos: (A) o instrumento — laço while de 40 s preso dentro de um único `page.evaluate`; ou
// (B) o JOGO — martelar `pointerdown` por 40 s mata a aba, defeito de robustez que nenhum
// portão pega, porque nenhum outro bate no jogo por 40 s sem soltar.
//
// Este é o roteiro MÍNIMO que separa os dois: só abre o jogo, bate no ritmo dado, e mede
// `usedJSHeapSize` e a contagem de nós ao longo do tempo. `--modo` liga e desliga o ingrediente
// suspeito (o laço longo dentro de um evaluate só), e `--acum` liga o outro (estado acumulado
// dentro do laço), para nomear QUAL mata em vez de chutar.
//
// MEDIDO em 22/08, Windows, 8 CPUs: modo=dentro ms=280 seg=40 -> heap 12,1 MB do começo ao fim
// (delta 0,0 MB em 38 s), nós 243 -> 249 e estáveis, zero crash. Seis processos deste em
// paralelo: 6/6 exit 0. (B) refutado.
//
// node test/martelo.js --modo=fora   --ms=280 --seg=40
// node test/martelo.js --modo=dentro --ms=280 --seg=40
//
//   modo `fora`   = um page.evaluate curto por batida (sem laço longo no renderer)
//   modo `dentro` = o laço de 40 s dentro de UM page.evaluate, como o §1 faz
//   --semear=0 pula a semeadura de estado do §1 (para isolar esse ingrediente)
//   --acum=1  acumula estado em array dentro do laço (o outro ingrediente do §1)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

const arg = (n, d) => {
  const m = process.argv.find(a => a.startsWith('--' + n + '='));
  return m ? m.split('=')[1] : d;
};
const MODO = arg('modo', 'fora');
const MS = Number(arg('ms', 280));
const SEG = Number(arg('seg', 40));
const SEMEAR = arg('semear', '1') !== '0';
const ACUM = arg('acum', '0') === '1';

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', process.env.JOGO_HTML || 'index.html'));
const log = (...a) => console.log(...a);
const MB = b => (b / 1048576).toFixed(1);

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  let morreu = null;
  page.on('crash', () => { morreu = 'page.crash'; });
  const erros = [];
  page.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('CONSOLE: ' + m.text()); });

  await page.goto(ALVO);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(900);

  if (SEMEAR) {
    await page.evaluate(() => {
      localStorage.clear();
      S.energiaTotal = LIMIARES[1] - 5; S.energia = S.energiaTotal;
      S.cenario = 1; S.fronteira = 1; S.aberturas = 1; S.fechos = 0; S.travessias = 1;
      fecharTelas();
    });
  }

  log('modo=' + MODO + ' ms=' + MS + ' seg=' + SEG + ' semear=' + SEMEAR + ' acum=' + ACUM);
  const amostras = [];
  const t0 = Date.now();
  let saida = null, falha = null;

  try {
    if (MODO === 'dentro') {
      saida = await page.evaluate(async (cfg) => {
        const espera = t => new Promise(rr => setTimeout(rr, t));
        const bater = () => document.getElementById('telaFala')
          .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 195, clientY: 500 }));
        const am = [], lixo = [];
        let toques = 0;
        const t00 = Date.now();
        let prox = 0;
        while (Date.now() - t00 < cfg.seg * 1000) {
          const dt = Date.now() - t00;
          if (dt >= prox) {
            prox += 2000;
            const m = performance.memory ? performance.memory.usedJSHeapSize : 0;
            am.push({ s: Math.round(dt / 1000), heap: m, nos: document.getElementsByTagName('*').length });
          }
          if (cfg.acum) lixo.push({ t: Date.now(), cls: document.getElementById('telaFala').className });
          bater(); toques++;
          await espera(cfg.ms);
        }
        return { am, toques, lixo: lixo.length };
      }, { ms: MS, seg: SEG, acum: ACUM });
      saida.am.forEach(a => amostras.push(a));
    } else {
      let toques = 0, prox = 0;
      while (Date.now() - t0 < SEG * 1000) {
        const dt = Date.now() - t0;
        if (dt >= prox) {
          prox += 2000;
          const a = await page.evaluate(() => ({
            heap: performance.memory ? performance.memory.usedJSHeapSize : 0,
            nos: document.getElementsByTagName('*').length,
          }));
          amostras.push({ s: Math.round(dt / 1000), ...a });
        }
        await page.evaluate(() => document.getElementById('telaFala')
          .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 195, clientY: 500 })));
        toques++;
        await page.waitForTimeout(MS);
      }
      saida = { toques };
    }
  } catch (e) {
    falha = String(e && e.message || e).split('\n')[0];
  }

  log('  duracao real ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s | toques ' + (saida ? saida.toques : '?'));
  amostras.forEach(a => log('   t=' + String(a.s).padStart(2) + 's heap ' + MB(a.heap).padStart(7) + ' MB | nos ' + a.nos));
  if (amostras.length > 1) {
    const d = amostras[amostras.length - 1].heap - amostras[0].heap;
    log('  DELTA HEAP ' + MB(d) + ' MB em ' + (amostras[amostras.length - 1].s - amostras[0].s) + ' s');
  }
  log('  crash do playwright: ' + (morreu || 'NAO'));
  log('  excecao: ' + (falha || 'nenhuma'));
  log('  erros de console: ' + (erros.length ? erros.slice(0, 5).join(' | ') : 'nenhum'));
  await browser.close();
  process.exit(falha || morreu ? 1 : 0);
})().catch(e => { console.error('EXPLODIU:', e); process.exit(2); });
