// A PROVA de que remover a camada de veio não pinta um pixel diferente.
// O print do jogo não serve: o mundo anda atrás do menu e o relógio do dia muda a luz, então
// dois prints em momentos diferentes divergem por motivo nenhum. Aqui as duas pilhas de
// `background` são desenhadas lado a lado, paradas, e comparadas canal a canal.
const { chromium } = require('playwright');

const PARES = [
  ['#btnJogar',
   'linear-gradient(180deg,#b8834a,#96632f 60%,#7c4f24),repeating-linear-gradient(180deg,rgba(0,0,0,.05) 0 2px,transparent 2px 8px)',
   'linear-gradient(180deg,#b8834a,#96632f 60%,#7c4f24)'],
  ['.telaBtn',
   'linear-gradient(180deg,#7c552c,#5d3d1e 60%,#4c3016),repeating-linear-gradient(180deg,rgba(0,0,0,.06) 0 2px,transparent 2px 8px)',
   'linear-gradient(180deg,#7c552c,#5d3d1e 60%,#4c3016)'],
  ['.capItem',
   'linear-gradient(180deg,#6d4b28,#503319 60%,#40270f),repeating-linear-gradient(180deg,rgba(0,0,0,.06) 0 2px,transparent 2px 8px)',
   'linear-gradient(180deg,#6d4b28,#503319 60%,#40270f)'],
  ['#poste',
   'linear-gradient(90deg,#4a2f16,#6d4b28 30%,#7c5730 55%,#4a2f16),repeating-linear-gradient(180deg,rgba(0,0,0,.10) 0 3px,transparent 3px 11px)',
   'linear-gradient(90deg,#4a2f16,#6d4b28 30%,#7c5730 55%,#4a2f16)'],
];

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: 400, height: 200 } });
  await pg.goto('about:blank');
  let pior = 0;
  for (const [nome, antes, depois] of PARES) {
    await pg.setContent('<div id="x" style="width:300px;height:60px;background:' + antes + '"></div>');
    const im1 = await (await pg.$('#x')).screenshot();
    await pg.setContent('<div id="x" style="width:300px;height:60px;background:' + depois + '"></div>');
    const im2 = await (await pg.$('#x')).screenshot();
    const dif = await pg.evaluate(async ([p, q]) => {
      const L = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; });
      const A = await L(p), B = await L(q);
      const cv = document.createElement('canvas'); cv.width = A.width; cv.height = A.height;
      const g = cv.getContext('2d');
      g.drawImage(A, 0, 0); const da = g.getImageData(0, 0, cv.width, cv.height).data;
      g.clearRect(0, 0, cv.width, cv.height);
      g.drawImage(B, 0, 0); const db = g.getImageData(0, 0, cv.width, cv.height).data;
      let max = 0;
      for (let i = 0; i < da.length; i += 4) for (let k = 0; k < 3; k++) {
        const v = Math.abs(da[i + k] - db[i + k]); if (v > max) max = v;
      }
      return max;
    }, ['data:image/png;base64,' + im1.toString('base64'),
        'data:image/png;base64,' + im2.toString('base64')]);
    if (dif > pior) pior = dif;
    console.log('  ' + nome.padEnd(10) + ' diferença máxima por canal: ' + dif);
  }
  console.log(pior === 0
    ? '\n✓ ZERO. A camada removida nunca pintou um pixel — a prova, não a intuição.'
    : '\n✗ diferença de ' + pior + ' — a camada RENDIA, e remover mudou a tela.');
  await nav.close();
  process.exit(pior === 0 ? 0 : 1);
})();
