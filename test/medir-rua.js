// Mede a rua no jogo de verdade: fracao atendida, chegadas/min, fila media e pico.
// Segura o botao dourado o tempo todo, andando e correndo.
// node medir-rua.js <caminho-do-index.html> <segundos>
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
const ARQ = process.argv[2];
const SEG = +(process.argv[3] || 90);

(async () => {
  const file = ABRIR('file://' + path.resolve(ARQ));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(file);
  await page.waitForTimeout(900);
  await page.evaluate(() => { if (typeof fecharTelas === 'function') fecharTelas(); if (typeof fecharTudo === 'function') fecharTudo(); });
  await page.waitForTimeout(200);

  const geom = await page.evaluate(() => ({ W: W, HX: HX, mobEspera: CFG.mobEspera, mobVao: CFG.mobVao, vel: velocidadeMundo() }));
  console.log('geometria: W', geom.W, 'HX', geom.HX, 'espera', geom.mobEspera, 'vao', geom.mobVao);

  async function celula(modo) {
    await page.evaluate((modo) => {
      S.modo = modo;
      mobs.length = 0; drops.length = 0; folhas.length = 0;
      mobChao = 0; proximoMob = -1;
      window.__m = { chegou: 0, alcancou: 0, perdeu: 0, filaSoma: 0, filaN: 0, filaPico: 0, esperaSoma: 0, esperaN: 0 };
      if (!window.__origReg) {
        window.__origReg = registrarChegada;
        registrarChegada = function (a) {
          if (window.__m) { window.__m.chegou++; if (a) window.__m.alcancou++; else window.__m.perdeu++; }
          return window.__origReg(a);
        };
      }
      if (!window.__origNovo) {
        window.__origNovo = novoMob;
        novoMob = function (t, wx) { if (window.__m) window.__m.nasceu = (window.__m.nasceu || 0) + 1; return window.__origNovo(t, wx); };
      }
      if (!window.__amostra) {
        window.__amostra = setInterval(function () {
          if (!window.__m) return;
          const n = mobs.filter(function (m) { return !m.dying && !m.dead; }).length;
          window.__m.filaSoma += n; window.__m.filaN++;
          if (n > window.__m.filaPico) window.__m.filaPico = n;
        }, 100);
      }
    }, modo);
    // segura o botao dourado
    const box = await page.evaluate(() => {
      const b = document.getElementById('btnClique');
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, id: b.id };
    });
    if (!box) throw new Error('botao dourado nao encontrado');
    await page.mouse.move(box.x, box.y);
    await page.mouse.down();
    await page.waitForTimeout(SEG * 1000);
    await page.mouse.up();
    const m = await page.evaluate(() => { const r = window.__m; window.__m = null; return r; });
    const min = SEG / 60;
    return {
      modo: modo,
      chegadasMin: +(m.chegou / min).toFixed(1),
      nascimentosMin: +((m.nasceu || 0) / min).toFixed(1),
      fracao: +(m.alcancou / Math.max(1, m.chegou)).toFixed(2),
      filaMedia: +(m.filaSoma / Math.max(1, m.filaN)).toFixed(2),
      filaPico: m.filaPico,
      bruto: m
    };
  }

  const andando = await celula('limpo');
  console.log('ANDANDO ', JSON.stringify(andando));
  const correndo = await celula('carvao');
  console.log('CORRENDO', JSON.stringify(correndo));
  await browser.close();
})();
