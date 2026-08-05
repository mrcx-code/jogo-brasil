// Corta os PACOTES de vegetação e embute os elementos no index.html.
//
// Pacote é uma imagem só com N objetos em grade, sobre magenta. A ideia é do dono e resolve o
// defeito que ele apontou: elementos gerados um a um não combinam entre si — cada geração é
// um desenhista diferente. Num render único o modelo mantém paleta, luz e contorno por
// coerência interna da imagem. Os três pacotes saíram até com o mesmo tufo de capim na base,
// o que faz todos assentarem no chão do mesmo jeito.
//
// Faz o corte em células iguais, o desfranjamento do magenta (min(R,B)-G vira alfa, e a cor é
// desmisturada) e a quantização — os três passos que o resto do pipeline já usa.
//
//   node test/cortar-pacote.js

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..');
const PACOTES = ['pacote-cap1-frente', 'pacote-cap2-frente', 'pacote-cap3-frente'];
const COLS = 4, LINS = 2, ALTURA = 132, CORES = 22;

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage();
  const todos = [];

  for (const nome of PACOTES) {
    const arq = path.join(RAIZ, 'assets', 'entrada', nome + '.png');
    if (!fs.existsSync(arq)) { console.log(nome + ': não está na pasta, pulando'); continue; }
    await pg.goto('file:///' + arq.split(path.sep).join('/'));
    const cels = await pg.evaluate(async function (a) {
      const im = document.querySelector('img');
      await im.decode();
      const W = im.naturalWidth, H = im.naturalHeight;
      const cw = Math.floor(W / a.cols), ch = Math.floor(H / a.lins);
      const out = [];
      for (let r = 0; r < a.lins; r++) for (let c = 0; c < a.cols; c++) {
        const cv = document.createElement('canvas');
        cv.width = cw; cv.height = ch;
        const x = cv.getContext('2d');
        x.drawImage(im, c * cw, r * ch, cw, ch, 0, 0, cw, ch);
        const dd = x.getImageData(0, 0, cw, ch), d = dd.data;
        let x0 = cw, y0 = ch, x1 = -1, y1 = -1;
        for (let i = 0, p = 0; i < d.length; i += 4, p++) {
          const R = d[i], G = d[i + 1], B = d[i + 2];
          const m = Math.min(R, B) - G;
          if (m <= 0) { d[i + 3] = 255; }
          else {
            const al = Math.max(0, 255 - m);
            d[i + 3] = al;
            if (al > 0) {
              const k = 255 / al;
              d[i] = Math.max(0, Math.min(255, (R - (255 - al)) * k));
              d[i + 2] = Math.max(0, Math.min(255, (B - (255 - al)) * k));
            }
          }
          if (d[i + 3] > 40) {
            const px = p % cw, py = (p / cw) | 0;
            if (px < x0) x0 = px; if (px > x1) x1 = px;
            if (py < y0) y0 = py; if (py > y1) y1 = py;
          }
        }
        x.putImageData(dd, 0, 0);
        if (x1 < 0) continue;                      // célula vazia: o pacote veio com menos
        const bw = x1 - x0 + 1, bh = y1 - y0 + 1, esc = a.alt / bh;
        const o = document.createElement('canvas');
        o.width = Math.max(1, Math.round(bw * esc)); o.height = a.alt;
        const ox = o.getContext('2d');
        ox.imageSmoothingEnabled = true; ox.imageSmoothingQuality = 'high';
        ox.drawImage(cv, x0, y0, bw, bh, 0, 0, o.width, o.height);
        const od = ox.getImageData(0, 0, o.width, o.height), q = od.data;
        const cnt = new Map();
        for (let i = 0; i < q.length; i += 4) {
          if (q[i + 3] < 128) continue;
          const k = ((q[i] >> 3) << 10) | ((q[i + 1] >> 3) << 5) | (q[i + 2] >> 3);
          cnt.set(k, (cnt.get(k) || 0) + 1);
        }
        const pal = [...cnt.entries()].sort((p1, p2) => p2[1] - p1[1]).slice(0, a.cores)
          .map(e => [((e[0] >> 10) & 31) * 8 + 4, ((e[0] >> 5) & 31) * 8 + 4, (e[0] & 31) * 8 + 4]);
        for (let i = 0; i < q.length; i += 4) {
          if (q[i + 3] < 128) { q[i + 3] = 0; continue; }
          q[i + 3] = 255;
          let b = 0, dist = Infinity;
          for (let j = 0; j < pal.length; j++) {
            const dr = q[i] - pal[j][0], dg = q[i + 1] - pal[j][1], db = q[i + 2] - pal[j][2];
            const v = dr * dr + dg * dg + db * db;
            if (v < dist) { dist = v; b = j; }
          }
          q[i] = pal[b][0]; q[i + 1] = pal[b][1]; q[i + 2] = pal[b][2];
        }
        ox.putImageData(od, 0, 0);
        out.push(o.toDataURL('image/webp', 0.94));
      }
      return out;
    }, { cols: COLS, lins: LINS, alt: ALTURA, cores: CORES });
    console.log(nome + ': ' + cels.length + ' elementos');
    todos.push.apply(todos, cels);
  }
  await nav.close();

  const arqHtml = path.join(RAIZ, 'index.html');
  let s = fs.readFileSync(arqHtml, 'utf8');
  const bloco = '/*FRENTE_B64_START — gerado por test/cortar-pacote.js, não edite à mão*/\n'
    + '// Vegetação de frente, cortada dos PACOTES — um por capítulo, oito elementos cada,\n'
    + '// gerados num render só para que combinem entre si.\n'
    + 'const FRENTE_B64 = [\n' + todos.map(x => '  "' + x + '"').join(',\n') + '\n];\n'
    + '/*FRENTE_B64_END*/';
  s = s.replace(/\/\*FRENTE_B64_START[\s\S]*?FRENTE_B64_END\*\//, bloco);
  const bs = s.match(/<script\b[^>]*>([\s\S]*?)<\/script>/g) || [];
  for (const b of bs) {
    try { new Function(b.replace(/^<script\b[^>]*>/, '').replace(/<\/script>$/, '')); }
    catch (e) { console.error('SINTAXE QUEBRADA: ' + e.message + ' — nada gravado'); process.exit(1); }
  }
  fs.writeFileSync(arqHtml, s);
  console.log('total ' + todos.length + ' elementos · ' + (s.length / 1048576).toFixed(2) + ' MB');
})();
