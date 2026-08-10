// Quanto custa, e quanto estraga, cada largura de embutir das páginas do quadrinho.
//
//   node test/medir-quadrinho.js            mede 390, 468 e 546 px
//   node test/medir-quadrinho.js 390,624    mede as larguras que você pedir
//
// A régua da casa é o ERRO NA TELA, não no arquivo (CLAUDE.md §6): a arte é reamostrada antes
// de chegar ao olho, e a suavização apaga parte do ruído que a compressão introduziu. Aqui a
// conta é feita no tamanho em que a página REALMENTE aparece — e esse tamanho tem uma
// surpresa que vale mais que o número:
//
// **A PÁGINA CORTA PELOS LADOS, NÃO POR CIMA.** O `.qFundo` usa `background-size: cover`. A
// tela é 390×844 (proporção 0,462) e a arte é 2:3 (0,667), ou seja a arte é MAIS LARGA em
// proporção. `cover` casa a ALTURA: a imagem entra com 563×844 css e perde 173 px de largura,
// 15,4% de cada lado. O pedido à mesa dizia "a imagem é cortada por cima" e isso está errado —
// nada some em cima, e some quase um terço da largura. Quem enquadra a próxima leva do jogo
// duas regras, não uma: terço inferior calmo E assunto dentro dos 70% centrais da largura.
//
// Daí a escala de exibição: 563/L em css, ×dpr no aparelho. A 390 px de arte e dpr 3, a
// página é ampliada 4,33× — mais que a pintura de cenário (2,53×), que já é a família mais
// esticada do arquivo. O erro abaixo é medido em css×2 (1126×1688) para caber na memória do
// navegador headless; a ordem de grandeza é a mesma.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');

const RAIZ = path.resolve(__dirname, '..');
const DIR = path.join(RAIZ, 'assets', 'entrada');
const QUAL = 0.72;
const LARGURAS = (process.argv[2] || '390,468,546').split(',').map(Number);
const TELA_W = 1126, TELA_H = 1688;   // 563×844 css a dpr 2

(async () => {
  const arqs = fs.readdirSync(DIR).filter(f => /^q-p\d+\.png$/.test(f))
    .sort((a, b) => parseInt(a.slice(3), 10) - parseInt(b.slice(3), 10));
  const nav = await chromium.launch();
  const pg = await nav.newPage();
  console.log('página  largura   KB b64   erro médio   erro máx   (erro na tela ' + TELA_W + 'x' + TELA_H + ')');
  const soma = {}, kbs = {};
  for (const a of arqs) {
    await pg.goto(ABRIR('file:///' + path.join(DIR, a).replace(/\\/g, '/')));
    for (const L of LARGURAS) {
      const r = await pg.evaluate(async function (d) {
        const im = document.querySelector('img');
        await im.decode();
        const desenhar = function (fonte, W, H) {
          const c = document.createElement('canvas'); c.width = W; c.height = H;
          const g = c.getContext('2d');
          g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
          g.drawImage(fonte, 0, 0, W, H);
          return c;
        };
        // candidato: mestre -> L px -> WebP q -> de volta ao tamanho de tela
        const H = Math.round(im.naturalHeight * d.L / im.naturalWidth);
        const uri = desenhar(im, d.L, H).toDataURL('image/webp', d.q);
        const cand = new Image(); cand.src = uri; await cand.decode();
        const A = desenhar(im, d.W, d.H).getContext('2d').getImageData(0, 0, d.W, d.H).data;
        const B = desenhar(cand, d.W, d.H).getContext('2d').getImageData(0, 0, d.W, d.H).data;
        let s = 0, m = 0, n = 0;
        for (let k = 0; k < A.length; k += 4)
          for (let z = 0; z < 3; z++) {
            const e = Math.abs(A[k + z] - B[k + z]); s += e; if (e > m) m = e; n++;
          }
        return { kb: uri.length / 1024, med: s / n, max: m };
      }, { L, q: QUAL, W: TELA_W, H: TELA_H });
      soma[L] = (soma[L] || 0) + r.med;
      kbs[L] = (kbs[L] || 0) + r.kb;
      console.log(a.replace(/^q-|\.png$/g, '').padEnd(6) + String(L).padStart(8)
        + r.kb.toFixed(0).padStart(9) + r.med.toFixed(2).padStart(13) + String(r.max).padStart(11));
    }
  }
  await nav.close();
  console.log('\nlargura   total b64   erro médio das ' + arqs.length + '   ampliação css   (régua da casa: 2,6)');
  LARGURAS.forEach(function (L) {
    console.log(String(L).padStart(7) + (kbs[L] / 1024).toFixed(2).padStart(10) + ' MB'
      + (soma[L] / arqs.length).toFixed(2).padStart(16)
      + ('×' + (563 / L).toFixed(2)).padStart(16));
  });
})();
