// Separa duas figuras que se encostaram numa folha em grade, pintando uma coluna de
// magenta na coluna MENOS entintada da faixa dada. Existe porque o recortar-folha.js
// aborta (e faz bem) quando uma mancha passa de 1,9 célula: duas pessoas coladas viram
// um quadro com duas metades. Aqui a emenda é desfeita ANTES do corte, no pixel que
// menos custa — nunca no meio de um corpo.
//
// uso: separar-encosto.js <entrada.png> <saida.png> <x0> <x1> [largura=3]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const [ENT, SAI, X0, X1, LARG] = process.argv.slice(2);
if (!SAI) { console.error('uso: separar-encosto.js <ent.png> <sai.png> <x0> <x1> [larg]'); process.exit(1); }

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file:///' + path.resolve(ENT).split(path.sep).join('/'));
  const out = await p.evaluate(async (a) => {
    const im = document.querySelector('img');
    await im.decode();
    const c = document.createElement('canvas');
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    // "tinta" = longe do magenta pela mesma régua do recortador: min(R,B) − G alto é fundo.
    const ehTinta = (i) => (Math.min(d[i], d[i + 2]) - d[i + 1]) < 60;
    let melhorX = -1, melhorN = Infinity;
    for (let x = a.x0; x <= a.x1 && x < c.width; x++) {
      let n = 0;
      for (let y = 0; y < c.height; y++) if (ehTinta((y * c.width + x) * 4)) n++;
      if (n < melhorN) { melhorN = n; melhorX = x; }
    }
    g.fillStyle = '#FF00FF';
    g.fillRect(melhorX - (a.larg >> 1), 0, a.larg, c.height);
    return { x: melhorX, tinta: melhorN, url: c.toDataURL('image/png') };
  }, { x0: +X0, x1: +X1, larg: +(LARG || 3) });
  fs.writeFileSync(SAI, Buffer.from(out.url.split(',')[1], 'base64'));
  console.log('coluna escolhida x=' + out.x + ' com ' + out.tinta + ' px de tinta -> ' + SAI);
  await b.close();
})();
