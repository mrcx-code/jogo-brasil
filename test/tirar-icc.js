// Remove o perfil ICC (chunk ICCP) de todo WebP embutido em src/jogo.ts.
//
//   node test/tirar-icc.js --medir     so mede
//   node test/tirar-icc.js             grava
//
// Por que e seguro: o perfil que o canvas do Chromium carimba em cada imagem e um sRGB
// generico de 456 bytes. Sem ICCP o navegador assume sRGB — o mesmo espaco. Sao 464 bytes
// crus por imagem, ~620 em base64, vezes 153 imagens: peso puro, zero pixel.
//
// O script NAO acredita nisso de graca: com `--verificar` ele decodifica antes e depois no
// Chromium e falha se um unico canal de um unico pixel mudar.

const fs = require('fs');
const path = require('path');

const ARQ = path.join(__dirname, '..', 'src', 'jogo.ts');
const medir = process.argv.includes('--medir');
const verificar = process.argv.includes('--verificar');

function semIcc(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  let off = 12;
  const pedacos = [];
  let achou = false, vp8x = null;
  while (off + 8 <= buf.length) {
    const tag = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    const fim = off + 8 + size + (size & 1);
    if (tag === 'ICCP') { achou = true; }
    else { pedacos.push(buf.slice(off, Math.min(fim, buf.length))); if (tag === 'VP8X') vp8x = pedacos[pedacos.length - 1]; }
    off = fim;
  }
  if (!achou) return null;
  if (vp8x) { const f = Buffer.from(vp8x); f[8] = f[8] & ~0x20; pedacos[pedacos.indexOf(vp8x)] = f; }  // apaga o bit de ICC
  const corpo = Buffer.concat(pedacos);
  const cab = Buffer.alloc(12);
  cab.write('RIFF', 0, 'ascii'); cab.writeUInt32LE(4 + corpo.length, 4); cab.write('WEBP', 8, 'ascii');
  return Buffer.concat([cab, corpo]);
}

let src = fs.readFileSync(ARQ, 'utf8');
const RE = /data:image\/webp;base64,([A-Za-z0-9+/=]+)/g;
let antes = 0, depois = 0, n = 0, tocadas = 0;
const pares = [];
const novo = src.replace(RE, (todo, b64) => {
  n++; antes += todo.length;
  const s = semIcc(Buffer.from(b64, 'base64'));
  if (!s) { depois += todo.length; return todo; }
  tocadas++;
  const r = 'data:image/webp;base64,' + s.toString('base64');
  depois += r.length;
  if (verificar) pares.push([todo, r]);
  return r;
});

const kb = (x) => (x / 1024).toFixed(1);
console.log(n + ' webp · ' + tocadas + ' com ICC · ' + kb(antes) + ' KB -> ' + kb(depois) + ' KB  (' + kb(antes - depois) + ' KB a menos)');

(async () => {
  if (verificar) {
    const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');   // onde o Chromium esta (test/abrir.js)
    const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
    const pg = await nav.newPage(); await pg.goto('about:blank');
    let pior = 0;
    for (let i = 0; i < pares.length; i += 20) {
      const lote = pares.slice(i, i + 20);
      const d = await pg.evaluate(async function (ps) {
        const px = async (u) => {
          const im = new Image(); im.src = u; await im.decode();
          const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
          c.getContext('2d').drawImage(im, 0, 0);
          return c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        };
        let m = 0;
        for (const [a, b] of ps) {
          const A = await px(a), B = await px(b);
          if (A.length !== B.length) return 999;
          for (let k = 0; k < A.length; k++) { const dd = Math.abs(A[k] - B[k]); if (dd > m) m = dd; }
        }
        return m;
      }, lote);
      if (d > pior) pior = d;
    }
    await nav.close();
    console.log('diferenca maxima de canal apos tirar o ICC: ' + pior);
    if (pior !== 0) { console.error('NAO e sem perda — nada gravado'); process.exit(1); }
  }
  if (!medir) { fs.writeFileSync(ARQ, novo); console.log('src/jogo.ts gravado — rode `npm run build`'); }
})();
