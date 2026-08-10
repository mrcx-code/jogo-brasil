// medir-luz.js — a régua de LUZ de uma pintura de cenário, medida e não olhada.
//
//   node test/medir-luz.js [arquivo.png|dir] ...     mede arquivos de assets/
//   node test/medir-luz.js --embutidas               mede as que já estão no src/jogo.ts
//
// Por que existe: o pedido de cada pintura de fundo manda "LUZ NEUTRA DE MEIO-DIA" e diz o
// alvo em número — **média de VERMELHO ≤ média de AZUL** e **saturação média ≥ 55%**. Esse
// alvo não é gosto: SALVADOR chegou com um entardecer PINTADO NA TINTA (R−B = +45, contra
// −22 a −48 das irmãs) e ficou presa nele para sempre, porque o jogo tem relógio próprio e
// tinge a pintura por cima — pintura que já é entardecer vira entardecer duas vezes e nunca
// vira meio-dia. Medir na chegada é o único momento em que dá para recusar.
//
// Saturação é a do HSV (max−min)/max, média ponderada por pixel não-preto: é a que
// corresponde a "paleta saturada" do pedido de estilo.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..');

function alvos() {
  const args = process.argv.slice(2).filter(a => a !== '--embutidas');
  const out = [];
  for (const a of args) {
    const p = path.resolve(a);
    if (fs.statSync(p).isDirectory()) {
      for (const f of fs.readdirSync(p)) if (/\.png$/i.test(f)) out.push(path.join(p, f));
    } else out.push(p);
  }
  return out;
}

const MEDIR = async function () {
  const im = document.querySelector('img') || window.__im;
  await im.decode();
  const c = document.createElement('canvas');
  // Amostra reduzida: a média de cor não muda com a escala e 1536×640 inteiro custa caro
  // quando são 21 peças. 384 px de largura preserva a média dentro de 0,2 por canal.
  const k = Math.min(1, 384 / im.naturalWidth);
  c.width = Math.max(1, Math.round(im.naturalWidth * k));
  c.height = Math.max(1, Math.round(im.naturalHeight * k));
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0, c.width, c.height);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  let sr = 0, sg = 0, sb = 0, ss = 0, n = 0, nsat = 0;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    sr += r; sg += g; sb += b; n++;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx > 8) { ss += (mx - mn) / mx; nsat++; }
  }
  return { w: im.naturalWidth, h: im.naturalHeight, r: sr / n, g: sg / n, b: sb / n, sat: nsat ? ss / nsat : 0 };
};

function linha(nome, m) {
  const t = m.r - m.b, s = m.sat * 100;
  const okT = t <= 0, okS = s >= 55;
  return [
    nome.padEnd(30),
    (m.w + 'x' + m.h).padEnd(10),
    ('R' + m.r.toFixed(0) + ' G' + m.g.toFixed(0) + ' B' + m.b.toFixed(0)).padEnd(20),
    ('R-B ' + (t >= 0 ? '+' : '') + t.toFixed(1)).padEnd(11) + (okT ? 'ok ' : 'QUENTE '),
    ('sat ' + s.toFixed(1) + '%').padEnd(11) + (okS ? 'ok' : 'BAIXA')
  ].join(' ');
}

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage();
  let falhas = 0;

  const lista = alvos();
  for (const arq of lista) {
    await pg.goto('file:///' + arq.replace(/\\/g, '/'));
    const m = await pg.evaluate(MEDIR);
    const l = linha(path.basename(arq, '.png'), m);
    if (/QUENTE|BAIXA/.test(l)) falhas++;
    console.log(l);
  }

  if (process.argv.includes('--embutidas')) {
    const src = fs.readFileSync(path.join(RAIZ, 'src', 'jogo.ts'), 'utf8');
    const i = src.indexOf('/*CEN_FUNDO_B64_START'), j = src.indexOf('/*CEN_FUNDO_B64_END');
    const trecho = src.slice(i, j);
    const iC = trecho.indexOf('CENARIO_CHAO_B64');
    const pecas = [];
    (trecho.slice(0, iC).match(/data:image\/webp;base64,[A-Za-z0-9+/=]+/g) || [])
      .forEach((u, k) => pecas.push(['alto ' + k, u]));
    (trecho.slice(iC).match(/data:image\/webp;base64,[A-Za-z0-9+/=]+/g) || [])
      .forEach((u, k) => pecas.push(['chao ' + k, u]));
    await pg.goto('about:blank');
    console.log('--- já embutidas em src/jogo.ts ---');
    for (const [nome, uri] of pecas) {
      await pg.evaluate(function (u) { const im = new Image(); im.src = u; window.__im = im; }, uri);
      console.log(linha(nome, await pg.evaluate(MEDIR)));
    }
  }

  await nav.close();
  if (falhas) console.log('\n' + falhas + ' peça(s) fora da régua de luz.');
})();
