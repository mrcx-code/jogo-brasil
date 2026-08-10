// QUANTO O JOGO AGUENTA DE TELA — a medição que faltava.
//
// O QA registrou como gap: "tudo roda numa resolução só". O jogo é testado a 390×844 e
// publicado para qualquer aparelho. Isto mede o que quebra fora dessa medida, em vez de
// adivinhar: para cada viewport, procura transbordo horizontal, sobreposição de elementos
// que não deviam se cruzar, texto cortado e alvo de toque menor que o mínimo de dedo.
//
//   node test/medir-telas.js
//
// Não conserta nada. Só diz onde dói, com número — para a passada de responsivo ter escopo
// em vez de escopo imaginado.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

// O cardápio: os aparelhos que existem de verdade, não potências de dois.
const TELAS = [
  { nome: 'pequeno  360×640', w: 360, h: 640 },   // Android popular, ainda comum no Brasil
  { nome: 'padrão   390×844', w: 390, h: 844 },   // a medida em que tudo foi feito
  { nome: 'Pixel    412×915', w: 412, h: 915 },
  { nome: 'grande   430×932', w: 430, h: 932 },   // Pro Max
  { nome: 'estreito 320×568', w: 320, h: 568 },   // o piso do que ainda se vende
  { nome: 'tablet   768×1024', w: 768, h: 1024 },
  { nome: 'deitado  844×390', w: 844, h: 390 },   // o telefone virado
];

const ALVO_MIN = 44;   // px de dedo — o mínimo que Apple e Google recomendam

(async () => {
  const alvo = ABRIR('file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/'));
  const nav = await chromium.launch();
  const linhas = [];

  for (const t of TELAS) {
    const pg = await nav.newPage({ viewport: { width: t.w, height: t.h }, deviceScaleFactor: 2 });
    const erros = [];
    pg.on('pageerror', e => erros.push(e.message));
    await pg.goto(alvo);
    await pg.waitForTimeout(1400);

    const r = await pg.evaluate((ALVO_MIN) => {
      const vis = e => {
        const s = getComputedStyle(e);
        if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
        const b = e.getBoundingClientRect();
        return b.width > 0 && b.height > 0;
      };
      const cruza = (a, b) =>
        a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

      const W = document.documentElement.clientWidth;
      const H = document.documentElement.clientHeight;

      // 1. TRANSBORDO: a página nunca pode rolar de lado.
      const transborda = document.documentElement.scrollWidth - W;

      // 2. O que sai da tela pelos lados ou por baixo, estando visível.
      const fora = [];
      document.querySelectorAll('#hudTop *, #controls *, .tela *').forEach(function (e) {
        if (!vis(e)) return;
        const b = e.getBoundingClientRect();
        if (b.right > W + 1 || b.left < -1) fora.push((e.id || e.className || e.tagName) + ' →' + Math.round(b.right - W));
      });

      // 3. SOBREPOSIÇÃO entre o HUD de cima e a barra de baixo: se elas se cruzam, a tela
      //    é curta demais para o chrome, e é o defeito mais provável no telefone deitado.
      const hud = document.getElementById('hudTop');
      const ctl = document.getElementById('controls');
      let colide = false;
      if (hud && ctl && vis(hud) && vis(ctl)) {
        colide = cruza(hud.getBoundingClientRect(), ctl.getBoundingClientRect());
      }

      // 4. ALVO DE TOQUE pequeno demais.
      const miudos = [];
      document.querySelectorAll('button, .cartao, .capItem, .telaBtn').forEach(function (e) {
        if (!vis(e)) return;
        const b = e.getBoundingClientRect();
        if (b.height < ALVO_MIN || b.width < ALVO_MIN) {
          miudos.push((e.id || e.className) + ' ' + Math.round(b.width) + '×' + Math.round(b.height));
        }
      });

      // 5. TEXTO CORTADO: o conteúdo não cabe na caixa que o guarda.
      const cortados = [];
      document.querySelectorAll('#hudTop *, #controls *, .tela *').forEach(function (e) {
        if (!vis(e) || !e.textContent.trim()) return;
        if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'auto') {
          cortados.push((e.id || e.className) + ' ' + e.scrollWidth + '>' + e.clientWidth);
        }
      });

      // 5b. RÓTULO BITMAP MAIOR QUE A CAIXA. Este buraco deixou passar o título do papel da
      //     volta, que saía cortado no "FO" em 320 px e passava verde aqui: a checagem 5 usa
      //     `scrollWidth > clientWidth`, e um <canvas> não faz o pai transbordar — ele
      //     simplesmente é desenhado por fora e o navegador recorta. Rótulo do jogo é canvas,
      //     então metade da tipografia da tela estava fora da medição.
      const estourados = [];
      document.querySelectorAll('canvas').forEach(function (c) {
        const pai = c.parentElement;
        if (!pai || pai.id === 'app' || c.id) return;      // só os rótulos, não os canvas do jogo
        if (!vis(c)) return;
        const a = c.getBoundingClientRect(), b = pai.getBoundingClientRect();
        if (a.width > b.width + 1) {
          estourados.push((pai.id || pai.className) + ' ' + Math.round(a.width) + '>' + Math.round(b.width));
        }
      });

      // 6. O MUNDO: o canvas cobre a tela inteira? Pixel art esticada em fração quebrada
      //    borra — a régua do §4 vale em qualquer largura, não só em 390.
      const cv = document.getElementById('scene');
      const cb = cv ? cv.getBoundingClientRect() : null;
      const mundo = cb ? {
        cobre: Math.abs(cb.width - W) < 2 && Math.abs(cb.height - H) < 2,
        escala: cv.width ? +(cb.width / cv.width).toFixed(3) : 0
      } : null;

      return { W, H, transborda, fora: fora.slice(0, 4), colide,
               miudos: miudos.slice(0, 4), cortados: cortados.slice(0, 4),
               estourados: estourados.slice(0, 6), mundo };
    }, ALVO_MIN);

    await pg.screenshot({ path: path.join(__dirname, 'TELA-' + t.w + 'x' + t.h + '.png') });
    await pg.close();

    const problemas = [];
    if (r.transborda > 1) problemas.push('rola de lado ' + r.transborda + 'px');
    if (r.colide) problemas.push('HUD colide com o rodapé');
    if (r.fora.length) problemas.push('fora da tela: ' + r.fora.join(', '));
    if (r.miudos.length) problemas.push('alvo < ' + ALVO_MIN + 'px: ' + r.miudos.join(', '));
    if (r.cortados.length) problemas.push('texto cortado: ' + r.cortados.join(', '));
    if (r.estourados.length) problemas.push('rótulo bitmap fora da caixa: ' + r.estourados.join(', '));
    if (r.mundo && !r.mundo.cobre) problemas.push('o mundo não cobre a tela');
    if (erros.length) problemas.push('ERRO: ' + erros[0]);

    linhas.push({ tela: t.nome, escala: r.mundo ? r.mundo.escala : 0,
                  ok: problemas.length === 0, problemas });
    console.log((problemas.length ? '✗ ' : '✓ ') + t.nome +
      '  escala do mundo ' + (r.mundo ? r.mundo.escala : '?') +
      (problemas.length ? '\n    ' + problemas.join('\n    ') : ''));
  }

  await nav.close();
  const ok = linhas.filter(l => l.ok).length;
  console.log('\n' + ok + ' de ' + linhas.length + ' telas sem problema.');
  console.log('Prints em test/TELA-*.png — olhe, o número não conta se ficou bonito.');
})();
