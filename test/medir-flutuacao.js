// Mede quanto cada objeto SOBE E DESCE na tela, capitulo por capitulo.
// Nao le a formula: espiona o drawImage de verdade e anota o dy de cada sprite de objeto.
// node test/medir-flutuacao.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const NOME = [
  { smog: 'fruta', barrel: 'muda', cash: 'peixe' },
  { smog: 'mandioca', barrel: 'pote de agua', cash: 'cesto' },
  { smog: 'muda', barrel: 'galao de agua', cash: 'cesto' }
];
(async () => {
  const file = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(file);
  await page.waitForTimeout(1200);
  await page.evaluate(() => { if (typeof fecharTelas === 'function') fecharTelas(); if (typeof fecharTudo === 'function') fecharTudo(); });
  await page.waitForTimeout(200);
  for (const cena of [0, 2, 4]) {
    const r = await page.evaluate(async (cena) => {
      S.cenario = cena; S.modo = 'limpo';
      mobs.length = 0; drops.length = 0; folhas.length = 0;
      proximoMob = 1e9; mobChao = 0; proximaFolha = 1e9; folhaChao = 0;
      const alvo = {};
      ['smog', 'barrel', 'cash'].forEach(function (t, i) {
        const m = novoMob(t, worldX + 62 + i * 42);
        m.parado = true; m.espera = 1e9; m.hp = m.hpMax; mobs.push(m);
        alvo[t] = m;
      });
      // espia o desenho de verdade: para cada objeto, guarda o dy que ele recebeu
      const g = document.getElementById('scene').getContext('2d');
      const orig = g.drawImage;
      const visto = { smog: [], barrel: [], cash: [] };
      const chave = {};
      ['smog', 'barrel', 'cash'].forEach(function (t) { chave[t] = mobFrame(alvo[t]); });
      g.drawImage = function (img) {
        for (const t in chave) if (img === chave[t] && arguments.length >= 5) visto[t].push(arguments[2]);
        return orig.apply(this, arguments);
      };
      await new Promise(res => setTimeout(res, 2000));
      g.drawImage = orig;
      const out = {};
      for (const t in visto) {
        const v = visto[t];
        out[t] = v.length ? { n: v.length, amp: Math.max.apply(null, v) - Math.min.apply(null, v) } : { n: 0, amp: -1 };
      }
      return out;
    }, cena);
    const cap = cena / 2;
    console.log('cap' + (cap + 1) + ':', ['smog', 'barrel', 'cash'].map(function (t) {
      return NOME[cap][t] + ' sobe-e-desce ' + r[t].amp + ' px (' + r[t].n + ' quadros)';
    }).join(' | '));
  }
  await browser.close();
})();
