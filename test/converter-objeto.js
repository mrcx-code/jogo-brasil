// Converte um objeto gerado fora, sobre fundo magenta, em quadro pronto para o jogo.
//
// O passo que não é óbvio é o DESFRANJAMENTO. Os pixels de contorno não são do objeto nem do
// fundo: são mistura dos dois, porque o gerador antialiasa a borda contra o magenta. Um teste
// binário ("é magenta? joga fora") deixa esses pixels passarem OPACOS e pinta um aro rosa em
// volta de tudo. A medida certa está no test/LEIAME.md: `min(R,B) − G` mede quanto de magenta
// há na mistura, isso vira o alfa, e a cor é DESMISTURADA — recupera o que o pixel seria
// sobre nada.
//
// Depois: recorte na mancha, redução por área, quantização (o gerador não faz pixel art).
//
//   node test/converter-objeto.js <entrada> <saida.png> [altura] [cores]

const path = require('path');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');

const ENT = process.argv[2], SAI = process.argv[3];
const ALT = parseInt(process.argv[4] || '120', 10);
const CORES = parseInt(process.argv[5] || '24', 10);
if (!ENT || !SAI) { console.error('uso: converter-objeto.js <entrada> <saida.png> [alt] [cores]'); process.exit(1); }

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage();
  await pg.goto(ABRIR('file:///' + path.resolve(ENT).replace(/\\/g, '/')));

  const r = await pg.evaluate(async function (args) {
    const im = document.querySelector('img');
    await im.decode();
    const w = im.naturalWidth, h = im.naturalHeight;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const dd = x.getImageData(0, 0, w, h), d = dd.data;

    // desfranjamento: quanto de magenta há em cada pixel
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const R = d[i], G = d[i + 1], B = d[i + 2];
      // Nem toda arte vem sobre magenta: algumas chegam já com alfa. Aí o teste do magenta
      // lê (0,0,0,0) como "sem magenta" e devolve a imagem inteira OPACA E PRETA. Honrar o
      // alfa da origem antes de qualquer coisa é o que evita isso.
      if (d[i + 3] < 8) { d[i + 3] = 0; continue; }
      const m = Math.min(R, B) - G;            // >0 = tem magenta na mistura
      if (m <= 0) { d[i + 3] = 255; }          // sem magenta: opaco
      else {
        const a = Math.max(0, 255 - m);        // muito magenta -> transparente
        d[i + 3] = a;
        if (a > 0) {                           // desmistura: tira o magenta que sobrou
          const k = 255 / a;
          d[i] = Math.max(0, Math.min(255, (R - (255 - a)) * k));
          d[i + 2] = Math.max(0, Math.min(255, (B - (255 - a)) * k));
        }
      }
      // Mancha, para o recorte. O corte é em 128 e não em 40 porque o magenta do gerador não
      // é chapado: tem ruído, e um punhado de pixels de fundo passa de 40 de alfa. Com 40, a
      // mancha de TODAS estas artes dava a moldura inteira — nada era recortado, o objeto
      // ficava com uma borda de vazio de tamanho arbitrário, e como a escala no jogo é
      // altura-do-quadro / altura-alvo, essa borda virava objeto pequeno E flutuando acima do
      // chão. 128 é meio alfa: pega o corpo, ignora a franja e o ruído.
      if (d[i + 3] > 128) {
        const px = p % w, py = (p / w) | 0;
        if (px < x0) x0 = px; if (px > x1) x1 = px;
        if (py < y0) y0 = py; if (py > y1) y1 = py;
      }
    }
    x.putImageData(dd, 0, 0);
    if (x1 < 0) return { erro: 'nenhum pixel opaco — a imagem é toda magenta?' };

    // recorte na mancha + redução por área para a altura alvo
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
    const esc = args.alt / ch;
    const o = document.createElement('canvas');
    o.width = Math.max(1, Math.round(cw * esc)); o.height = args.alt;
    const ox = o.getContext('2d');
    ox.imageSmoothingEnabled = true; ox.imageSmoothingQuality = 'high';
    ox.drawImage(c, x0, y0, cw, ch, 0, 0, o.width, o.height);

    // quantização por popularidade, só sobre o que é opaco
    const od = ox.getImageData(0, 0, o.width, o.height), q = od.data;
    const conta = new Map();
    for (let i = 0; i < q.length; i += 4) {
      if (q[i + 3] < 128) continue;
      const k = ((q[i] >> 3) << 10) | ((q[i + 1] >> 3) << 5) | (q[i + 2] >> 3);
      conta.set(k, (conta.get(k) || 0) + 1);
    }
    const pal = [...conta.entries()].sort((a, b) => b[1] - a[1]).slice(0, args.cores)
      .map(e => [((e[0] >> 10) & 31) * 8 + 4, ((e[0] >> 5) & 31) * 8 + 4, (e[0] & 31) * 8 + 4]);
    for (let i = 0; i < q.length; i += 4) {
      if (q[i + 3] < 128) { q[i + 3] = 0; continue; }   // borda: ou é sólido, ou some
      q[i + 3] = 255;
      let melhor = 0, dist = Infinity;
      for (let j = 0; j < pal.length; j++) {
        const dr = q[i] - pal[j][0], dg = q[i + 1] - pal[j][1], db = q[i + 2] - pal[j][2];
        const v = dr * dr + dg * dg + db * db;
        if (v < dist) { dist = v; melhor = j; }
      }
      q[i] = pal[melhor][0]; q[i + 1] = pal[melhor][1]; q[i + 2] = pal[melhor][2];
    }
    ox.putImageData(od, 0, 0);
    return { dados: o.toDataURL('image/webp', 0.95), origem: w + 'x' + h,
             mancha: cw + 'x' + ch, saida: o.width + 'x' + o.height, cores: pal.length };
  }, { alt: ALT, cores: CORES });

  if (r.erro) { console.error(r.erro); process.exit(1); }
  require('fs').writeFileSync(SAI, Buffer.from(r.dados.split(',')[1], 'base64'));
  console.log(path.basename(ENT) + ': ' + r.origem + ' -> mancha ' + r.mancha
    + ' -> ' + r.saida + ' · ' + r.cores + ' cores');
  await nav.close();
})();
