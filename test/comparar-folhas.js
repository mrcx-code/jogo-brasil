// DUAS FOLHAS NA ESCALA DO MOTOR, lado a lado, sobre a mesma linha de chão.
//
// Por que ela existe: a régua da casa para escala entre folhas é a LARGURA DA CABEÇA, e numa
// folha de CORRIDA ela mente. O cabelo voa para trás, entra no quinto superior da figura e
// entra na medida: no capítulo 1 a cabeça lê 110 a 156 px na corrida contra 76 fixos na
// caminhada — 1,45x de diferença que NÃO existe no corpo, porque as figuras têm 305 e 322 px
// de altura. Reescalar por esse número encolheria a personagem em 30% ao correr.
//
// Aqui as duas folhas são desenhadas exatamente como `desenharHeroiHD` desenha: escala
// `44 / altura do quadro de CAMINHADA`, ancorada por baixo em HX. O que sair de tamanho
// diferente na imagem sai de tamanho diferente no jogo. Olho contra número, e o olho decide
// nesta pergunta específica porque o número já se provou enganado.
//
// uso: comparar-folhas.js <A: json|bloco@arq> <B> <saida.png> [--zoom=8]
const fs = require('fs');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');   // onde o Chromium esta (test/abrir.js)
const args = process.argv.slice(2);
const pos = args.filter(a => !a.startsWith('--'));
const ZOOM = parseFloat((args.find(a => a.startsWith('--zoom=')) || '--zoom=8').slice(7));
const ALVO = 44;   // HERO_TARGET
if (pos.length < 3) { console.error('uso: comparar-folhas.js <A> <B> <saida.png> [--zoom=8]'); process.exit(1); }

function ler(alvo) {
  if (!alvo.includes('@')) return JSON.parse(fs.readFileSync(alvo, 'utf8')).frames;
  const [nome, arq] = alvo.split('@');
  const txt = fs.readFileSync(arq, 'utf8');
  const i = txt.indexOf('\n  ' + nome + ': [');
  const j = txt.indexOf('\n  ]', i);
  return (txt.slice(i, j).match(/"data:image\/webp;base64,[^"]+"/g) || []).map(s => ({ b64: JSON.parse(s) }));
}
const A = ler(pos[0]), B = ler(pos[1]);

(async () => {
  const b = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const p = await b.newPage();
  const png = await p.evaluate(async (a) => {
    const carrega = (fr) => Promise.all(fr.map(f => new Promise((r, j) => {
      const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = f.b64;
    })));
    const ia = await carrega(a.A), ib = await carrega(a.B);
    // A escala do motor sai da CAMINHADA (folha A, por convenção de chamada) e vale para as duas.
    const sc = a.ALVO / ia[0].naturalHeight * a.ZOOM;
    const larg = (im) => Math.round(im.naturalWidth * sc);
    const todos = ia.concat(ib);
    const W = todos.reduce((n, im) => n + larg(im) + 4, 0);
    const H = Math.round(Math.max(...todos.map(im => im.naturalHeight)) * sc) + 30;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#15151b'; g.fillRect(0, 0, W, H);
    const chao = H - 22;
    let x = 0;
    todos.forEach((im, k) => {
      const w = larg(im), h = Math.round(im.naturalHeight * sc);
      g.fillStyle = k < ia.length ? '#1d2430' : '#2a1d24'; g.fillRect(x, 0, w + 4, H);
      g.imageSmoothingQuality = 'high';
      g.drawImage(im, x + 2, chao - h, w, h);
      x += w + 4;
    });
    g.strokeStyle = '#ff3b3b'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, chao + 0.5); g.lineTo(W, chao + 0.5); g.stroke();
    // linha do TOPO DA CABEÇA da primeira folha, que é a altura de referência
    const topoA = chao - Math.round(ia[0].naturalHeight * sc);
    g.strokeStyle = '#4ad0ff';
    g.beginPath(); g.moveTo(0, topoA + 0.5); g.lineTo(W, topoA + 0.5); g.stroke();
    g.fillStyle = '#8fa'; g.font = '12px monospace';
    g.fillText('azul = topo do quadro da folha A (44 px de mundo)   vermelho = chao', 6, H - 6);
    return c.toDataURL('image/png');
  }, { A, B, ALVO, ZOOM });
  await b.close();
  fs.writeFileSync(pos[2], Buffer.from(png.split(',')[1], 'base64'));
  console.log(pos[2], '·', A.length, '+', B.length, 'quadros');
})();
