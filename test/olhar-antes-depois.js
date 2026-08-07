// Lado a lado ANTES (ultimo commit) x DEPOIS (working tree) da mesma imagem embutida,
// ja reamostrada para o tamanho em que ela APARECE e depois ampliada 3x para o olho.
//
//   node test/olhar-antes-depois.js HERO_B64 0 0.80
//   node test/olhar-antes-depois.js CEN_FUNDO_B64 4 2.53 --recorte 260,700,220,150

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..');
const RE = /data:image\/webp;base64,[A-Za-z0-9+/=]+/g;
const [nome, idxS, escS] = process.argv.slice(2);
const idx = parseInt(idxS || '0'), esc = parseFloat(escS || '1');
const rec = (process.argv.find(a => a.startsWith('--recorte=')) || '').split('=')[1];

function bloco(src) {
  const i = src.indexOf('/*' + nome + '_START'), j = src.indexOf('/*' + nome + '_END');
  return src.slice(i, j).match(RE) || [];
}
const A = bloco(execSync('git show HEAD:src/jogo.ts', { cwd: RAIZ, maxBuffer: 1 << 30 }).toString('utf8'))[idx];
const B = bloco(fs.readFileSync(path.join(RAIZ, 'src', 'jogo.ts'), 'utf8'))[idx];
if (!A || !B) { console.error('imagem ' + idx + ' de ' + nome + ' nao encontrada'); process.exit(1); }

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage(); await pg.goto('about:blank');
  const png = await pg.evaluate(async function (d) {
    const carregar = async (u) => { const i = new Image(); i.src = u; await i.decode(); return i; };
    const na = async (u) => {
      const im = await carregar(u);
      const W = Math.max(1, Math.round(im.naturalWidth * d.esc)), H = Math.max(1, Math.round(im.naturalHeight * d.esc));
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, W, H);
      return c;
    };
    const ca = await na(d.A), cb = await na(d.B);
    let [sx, sy, sw, sh] = d.rec ? d.rec.split(',').map(Number) : [0, 0, ca.width, ca.height];
    sw = Math.min(sw, ca.width - sx); sh = Math.min(sh, ca.height - sy);
    const Z = 3, GAP = 24;
    const out = document.createElement('canvas');
    out.width = sw * Z; out.height = (sh * Z + GAP) * 2;
    const g = out.getContext('2d');
    g.fillStyle = '#111'; g.fillRect(0, 0, out.width, out.height);
    g.imageSmoothingEnabled = false;
    let y = 0;
    for (const [c, rot] of [[ca, 'ANTES'], [cb, 'DEPOIS']]) {
      g.drawImage(c, sx, sy, sw, sh, 0, y, sw * Z, sh * Z);
      y += sh * Z;
      g.fillStyle = '#111'; g.fillRect(0, y, out.width, GAP);
      g.fillStyle = '#ffd479'; g.font = '15px monospace'; g.fillText(rot, 8, y + 17);
      y += GAP;
    }
    return out.toDataURL('image/png');
  }, { A, B, esc, rec });
  await nav.close();
  const saida = path.join(__dirname, 'olhar-' + nome + '-' + idx + '.png');
  fs.writeFileSync(saida, Buffer.from(png.split(',')[1], 'base64'));
  console.log('escrito ' + saida);
})();
