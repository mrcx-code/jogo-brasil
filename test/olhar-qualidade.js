// Lado a lado a 3x de ampliacao: um recorte da mesma pintura em varias qualidades WebP.
// Salva test/olhar-<nome>.png. Existe porque erro medio por canal nao decide nada sozinho —
// a regra da casa e olhar o print.
//
//   node test/olhar-qualidade.js assets/cenarios-novos/cap2-alto.png 0.80 0.76 0.72 0.65

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');   // onde o Chromium esta (test/abrir.js)

const mestre = process.argv[2];
const quals = process.argv.slice(3).map(Number);
if (!mestre || !quals.length) { console.error('uso: node test/olhar-qualidade.js <mestre.png> q [q...]'); process.exit(1); }

// recorte no meio da imagem, o tamanho que cabe legivel a 3x
const CW = 200, CH = 150, ZOOM = 3;

(async () => {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage();
  await pg.goto('about:blank');
  const b64 = 'data:image/png;base64,' + fs.readFileSync(mestre).toString('base64');
  const png = await pg.evaluate(async function (d) {
    const carregar = async (u) => { const i = new Image(); i.src = u; await i.decode(); return i; };
    const mi = await carregar(d.b64);
    // a pintura entra no jogo em 720 de largura; e essa a imagem a comparar
    const W = Math.min(720, mi.naturalWidth), H = Math.round(mi.naturalHeight * W / mi.naturalWidth);
    const base = document.createElement('canvas'); base.width = W; base.height = H;
    const bg = base.getContext('2d'); bg.imageSmoothingQuality = 'high'; bg.drawImage(mi, 0, 0, W, H);

    const sx = Math.max(0, Math.round(W / 2 - d.CW / 2)), sy = Math.max(0, Math.round(H * 0.62 - d.CH / 2));
    const tira = document.createElement('canvas');
    tira.width = d.CW * d.ZOOM; tira.height = (d.CH * d.ZOOM + 22) * d.quals.length;
    const tg = tira.getContext('2d');
    tg.fillStyle = '#111'; tg.fillRect(0, 0, tira.width, tira.height);
    tg.imageSmoothingEnabled = false;
    let y = 0;
    for (const q of d.quals) {
      const uri = base.toDataURL('image/webp', q);
      const im = await carregar(uri);
      tg.drawImage(im, sx, sy, d.CW, d.CH, 0, y, d.CW * d.ZOOM, d.CH * d.ZOOM);
      y += d.CH * d.ZOOM;
      tg.fillStyle = '#111'; tg.fillRect(0, y, tira.width, 22);
      tg.fillStyle = '#ffd479'; tg.font = '15px monospace';
      tg.fillText('q=' + q.toFixed(2) + '   ' + Math.round(uri.length / 1024) + ' KB base64', 8, y + 16);
      y += 22;
    }
    return tira.toDataURL('image/png');
  }, { b64, quals, CW, CH, ZOOM });
  await nav.close();
  const saida = path.join(__dirname, 'olhar-' + path.basename(mestre, '.png') + '.png');
  fs.writeFileSync(saida, Buffer.from(png.split(',')[1], 'base64'));
  console.log('escrito ' + saida);
})();
