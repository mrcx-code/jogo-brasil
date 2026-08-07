// Os quadros de um `.json` (ou de um bloco do HERO_B64) lado a lado numa PNG, com a linha de
// chão e o número do quadro. Reconstruída junto com o `medir-sola.js`: número prova que não
// quebrou, tira prova que ficou bom, e o CLAUDE.md §6 pede as duas coisas.
//
// A linha VERMELHA é a borda de baixo do quadro, que é o chão comum — a personagem é desenhada
// com o pé nela (`desenharHeroiHD` ancora por baixo). Quadro em que a tinta não encosta na
// linha é quadro em que ela está no AR, e é isso que se quer ver numa corrida.
//
// uso: folha-png.js <arquivo.json | bloco@src/jogo.ts> <saida.png> [--ordem=a,b,c] [--esc=1]
const fs = require('fs');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const pos = args.filter(a => !a.startsWith('--'));
const ALVO = pos[0], OUT = pos[1];
const ORDEM = (args.find(a => a.startsWith('--ordem=')) || '').slice(8);
const ESC = parseFloat((args.find(a => a.startsWith('--esc=')) || '--esc=1').slice(6));
if (!ALVO || !OUT) { console.error('uso: folha-png.js <json|bloco@arquivo> <saida.png> [--ordem=a,b,c] [--esc=1]'); process.exit(1); }

function lerBloco(nome, arq) {
  const txt = fs.readFileSync(arq, 'utf8');
  const i = txt.indexOf('\n  ' + nome + ': [');
  if (i < 0) throw new Error('bloco ' + nome + ' nao achado');
  const j = txt.indexOf('\n  ]', i);
  return (txt.slice(i, j).match(/"data:image\/webp;base64,[^"]+"/g) || []).map(s => ({ b64: JSON.parse(s) }));
}
let frames;
if (ALVO.includes('@')) { const [n, a] = ALVO.split('@'); frames = lerBloco(n, a); }
else frames = JSON.parse(fs.readFileSync(ALVO, 'utf8')).frames;
const idx = ORDEM ? ORDEM.split(',').map(s => parseInt(s, 10) - 1) : frames.map((_, i) => i);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const png = await p.evaluate(async (a) => {
    const imgs = await Promise.all(a.fr.map(f => new Promise((r, j) => {
      const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = f.b64;
    })));
    const W = Math.round(imgs[0].naturalWidth * a.esc), H = Math.round(imgs[0].naturalHeight * a.esc);
    const MARG = 26;                       // espaço abaixo da linha de chão, para o rótulo
    const c = document.createElement('canvas');
    c.width = W * a.idx.length; c.height = H + MARG;
    const g = c.getContext('2d');
    g.fillStyle = '#1b1b22'; g.fillRect(0, 0, c.width, c.height);
    a.idx.forEach((k, n) => {
      const x = n * W;
      g.fillStyle = n % 2 ? '#23232c' : '#1b1b22'; g.fillRect(x, 0, W, c.height);
      g.imageSmoothingQuality = 'high';
      g.drawImage(imgs[k], x, 0, W, H);
      g.strokeStyle = '#ff3b3b'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, H - 0.5); g.lineTo(x + W, H - 0.5); g.stroke();
      g.fillStyle = '#c9c9d4'; g.font = '13px monospace';
      g.fillText(String(k + 1), x + 6, H + 17);
    });
    return c.toDataURL('image/png');
  }, { fr: frames, idx, esc: ESC });
  await b.close();
  fs.writeFileSync(OUT, Buffer.from(png.split(',')[1], 'base64'));
  console.log(OUT, '·', idx.length, 'quadros');
})();
