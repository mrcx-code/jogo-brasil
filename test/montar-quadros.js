// CONTACT SHEET: os quadros de um bloco lado a lado, com a LINHA DE CHÃO desenhada por cima.
//
// Existe porque `medir-sola.js` devolve número e número não mostra pose colada em pose. O
// `test/LEIAME.md` já documentava esta ferramenta desde o capítulo 4; o arquivo tinha se perdido
// na integração daquele worktree (o LEIAME cita, a pasta não tinha) e volta aqui commitado.
//
// A linha de chão é a BORDA DE BAIXO do quadro, que é o chão comum de todos eles quando a folha
// foi cortada com compressão 0 — é contra ela que se lê se a sola encosta ou se a pose está no
// ar. A faixa do pé (`--pes=N`, px acima da base) é a mesma faixa que o `medir-sola.js` usa para
// separar um pé do outro, e desenhá-la é a forma de conferir com o olho que ela ficou ABAIXO da
// barra do vestido: acima dela os dois pés viram um borrão só.
//
// uso: montar-quadros.js <arquivo.json | bloco@src/jogo.ts> <saida.png> [escala] [--pes=N] [--quadros=a,b,c]
const fs = require('fs');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');   // onde o Chromium esta (test/abrir.js)

const args = process.argv.slice(2);
const livres = args.filter(a => !a.startsWith('--'));
const ALVO = livres[0], SAIDA = livres[1];
const ESC = parseFloat(livres[2] || '1');
const PES = parseFloat((args.find(a => a.startsWith('--pes=')) || '--pes=0').slice(6));
const QUADROS = (args.find(a => a.startsWith('--quadros=')) || '').slice(10);
if (!ALVO || !SAIDA) {
  console.error('uso: montar-quadros.js <arquivo.json | bloco@src/jogo.ts> <saida.png> [escala] [--pes=N] [--quadros=a,b,c]');
  process.exit(1);
}

function lerBloco(nome, arq) {
  const txt = fs.readFileSync(arq, 'utf8');
  const i = txt.indexOf('\n  ' + nome + ': [');
  if (i < 0) throw new Error('bloco ' + nome + ' nao achado em ' + arq);
  const j = txt.indexOf('\n  ]', i);
  const fr = txt.slice(i, j).match(/"data:image\/webp;base64,[^"]+"/g) || [];
  return fr.map(s => ({ b64: JSON.parse(s) }));
}

let frames;
if (ALVO.includes('@')) { const [n, a] = ALVO.split('@'); frames = lerBloco(n, a); }
else frames = JSON.parse(fs.readFileSync(ALVO, 'utf8')).frames;
if (QUADROS) frames = QUADROS.split(',').map(s => frames[parseInt(s, 10) - 1]);
if (!frames.length || frames.some(f => !f)) { console.error('bloco vazio ou --quadros fora da faixa'); process.exit(1); }

(async () => {
  const b = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const p = await b.newPage();
  const dim = await p.evaluate(async (arg) => {
    const fr = arg.fr, ESC = arg.ESC, PES = arg.PES;
    const imgs = await Promise.all(fr.map(f => new Promise((r, j) => {
      const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = f.b64;
    })));
    const W = imgs[0].naturalWidth, H = imgs[0].naturalHeight;
    const MARG = 14;                       // respiro embaixo, para a linha de chão não colar
    const cw = Math.round(W * ESC), ch = Math.round(H * ESC);
    const c = document.createElement('canvas');
    c.width = cw * imgs.length; c.height = ch + MARG;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#1b1b20'; g.fillRect(0, 0, c.width, c.height);
    imgs.forEach((im, i) => {
      // xadrez claro/escuro por quadro: sem ele, duas poses parecidas viram uma figura só
      g.fillStyle = i % 2 ? '#26262e' : '#1b1b20';
      g.fillRect(i * cw, 0, cw, c.height);
      g.drawImage(im, i * cw, 0, cw, ch);
    });
    // LINHA DE CHÃO: a borda de baixo do quadro, contínua, atravessando a tira inteira.
    // 2 px e sobre a última linha de pixel do quadro, não abaixo dela: a 1 px e encostada na
    // borda ela some contra a sola escura, que é justamente onde se precisa olhar.
    g.strokeStyle = '#ff4d6d'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, ch - 1); g.lineTo(c.width, ch - 1); g.stroke();
    if (PES > 0) {                          // a faixa do pé, a mesma do medir-sola.js
      g.strokeStyle = 'rgba(90,200,255,0.85)';
      const y = ch - PES * ESC + 0.5;
      g.beginPath(); g.moveTo(0, y); g.lineTo(c.width, y); g.stroke();
    }
    // divisórias e número do quadro
    g.strokeStyle = 'rgba(255,255,255,0.18)';
    g.fillStyle = '#cfcfd8';
    g.font = '11px monospace'; g.textBaseline = 'bottom';
    imgs.forEach((_, i) => {
      g.beginPath(); g.moveTo(i * cw + 0.5, 0); g.lineTo(i * cw + 0.5, c.height); g.stroke();
      g.fillText(String(i + 1), i * cw + 4, c.height - 2);
    });
    document.body.style.margin = '0';
    document.body.appendChild(c);
    c.id = 'tira';
    return { W, H, n: imgs.length, cw: c.width, chh: c.height };
  }, { fr: frames, ESC, PES });
  const el = await p.$('#tira');
  await el.screenshot({ path: SAIDA });
  await b.close();
  console.log(SAIDA + '  ' + dim.n + ' quadros de ' + dim.W + 'x' + dim.H +
    ' a ' + ESC + 'x  ->  ' + dim.cw + 'x' + dim.chh + (PES > 0 ? '  (faixa do pe em ' + PES + ' px)' : ''));
})();
