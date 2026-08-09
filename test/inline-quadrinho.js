// Embute as PÁGINAS VERTICAIS do quadrinho (tela A HISTÓRIA) em src/jogo.ts, em WebP.
//
//   node test/inline-quadrinho.js               grava na largura/qualidade padrão
//   node test/inline-quadrinho.js --medir        só mede, em várias larguras, e não grava
//   node test/inline-quadrinho.js --largura=560  grava noutra largura
//   node test/inline-quadrinho.js --qual=0.68    grava noutra qualidade
//
// O que são: as imagens 2:3 de tela cheia que a mesa gera por PÁGINA do quadrinho. Chegam
// em `assets/entrada/q-p<N>.png` (N = número da página), pasta de ENTREGA ignorada pelo git;
// o que fica versionado é o base64 que este script escreve. A chave do bloco é `pN`, e quem
// associa página e imagem é o campo `qi` de LINHA_TEMPO — não este bloco.
//
// POR QUE UM BLOCO PRÓPRIO, e não o CTX_B64: o `inline-contexto.js` reescreve o bloco inteiro
// com o que achar na pasta, e numa pasta só com arte nova ele apaga em silêncio o resto
// (armadilha já paga, está no LEIAME). Bloco separado + filtro `^q-p\d+\.png$` faz com que
// rodar um NUNCA toque no outro.
//
// AS DUAS DECISÕES QUE VALEM MAIS QUE O CÓDIGO — as mesmas do inline-contexto, com um porém:
//
// 1. **Largura de embutir, não largura de origem.** As peças chegam com ~1024 px e a tela
//    mostra 390. Mas aqui a imagem é VERTICAL e sangra a página inteira: a 2:3, cada 100 px de
//    largura custa 150 px de altura, ou seja o preço por px de largura é 1,5× o de uma
//    paisagem larga. São 13 páginas num arquivo com teto de 3,6 MB — meça com `--medir` antes
//    de mexer, e meça na TELA (test/medir-na-tela.js), não no arquivo.
// 2. **Nenhuma figura humana sem o dono aprovar a cena.** Vale a mesma regra do CTX_B64 e do
//    §2: o pedido de cada página no NOTES.md diz onde gente é proibida (p10, p12, p1…) e onde
//    é "aprovação cena a cena". Se chegar uma com gente onde o pedido não previa, ela NÃO
//    entra sem o dono — relate, não embuta.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..');
const ARQ = path.join(RAIZ, 'src', 'jogo.ts');
const DIR = path.join(RAIZ, 'assets', 'entrada');

const arg = function (nome, padrao) {
  const a = process.argv.find(function (s) { return s.indexOf('--' + nome + '=') === 0; });
  return a ? Number(a.split('=')[1]) : padrao;
};
const LARGURA = arg('largura', 780);   // 2× os 390 px da tela de referência
const QUAL = arg('qual', 0.72);        // a qualidade de fundos e contextos desde 2026-08-07

const medir = process.argv.includes('--medir');
const LARGURAS = medir ? [390, 468, 546, 624, 780] : [LARGURA];
const QUAIS = medir && process.argv.includes('--grade') ? [0.55, 0.62, 0.72] : [QUAL];

(async () => {
  const arqs = fs.existsSync(DIR)
    ? fs.readdirSync(DIR).filter(f => /^q-p\d+\.png$/.test(f))
        .sort(function (a, b) { return parseInt(a.slice(3), 10) - parseInt(b.slice(3), 10); })
    : [];
  if (!arqs.length) { console.error('nenhuma q-p*.png em assets/entrada'); process.exit(1); }

  const nav = await chromium.launch();
  const pg = await nav.newPage();
  const feito = {};
  let somaPorLargura = {};

  for (const a of arqs) {
    const chave = a.replace(/^q-|\.png$/g, '');
    await pg.goto('file:///' + path.join(DIR, a).replace(/\\/g, '/'));
    for (const L of LARGURAS) for (const Q of QUAIS) {
      const r = await pg.evaluate(async function (d) {
        const im = document.querySelector('img');
        await im.decode();
        const W = Math.min(d.L, im.naturalWidth);
        const H = Math.round(im.naturalHeight * W / im.naturalWidth);
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        g.imageSmoothingQuality = 'high';
        g.drawImage(im, 0, 0, W, H);
        return { uri: c.toDataURL('image/webp', d.q), w: W, h: H, ow: im.naturalWidth, oh: im.naturalHeight };
      }, { L, q: Q });
      const kb = r.uri.length / 1024;
      somaPorLargura[L + '@' + Q] = (somaPorLargura[L + '@' + Q] || 0) + kb;
      console.log(chave.padEnd(5) + String(r.w).padStart(5) + 'x' + String(r.h).padEnd(5)
        + ' q' + Q + ' · ' + kb.toFixed(0).padStart(4) + ' KB base64'
        + (medir ? '' : ' (mestre ' + r.ow + 'x' + r.oh + ')'));
      if (!medir) feito[chave] = r.uri;
    }
  }
  await nav.close();
  if (medir) {
    console.log('\nTOTAL por largura (13 páginas, base64):');
    Object.keys(somaPorLargura).forEach(function (k) {
      console.log('  ' + k.padEnd(10) + (somaPorLargura[k] / 1024).toFixed(2) + ' MB');
    });
    return;
  }

  const chaves = Object.keys(feito).sort(function (a, b) {
    return parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10);
  });
  const bloco =
    '/*QUAD_B64_START — gerado por test/inline-quadrinho.js, não edite à mão*/\n' +
    '// A página vertical de tela cheia do quadrinho. A chave é `p<N>` — o N do arquivo\n' +
    '// entregue (`q-pN.png`), que é o número da página no pedido; quem associa página e\n' +
    '// imagem é o campo `qi` da LINHA_TEMPO, não este bloco.\n' +
    'const QUAD_B64: Record<string, string> = {\n'
    + chaves.map(k => '  "' + k + '": "' + feito[k] + '"').join(',\n') + '\n};\n' +
    '/*QUAD_B64_END*/';

  let src = fs.readFileSync(ARQ, 'utf8');
  const re = /\/\*QUAD_B64_START[\s\S]*?QUAD_B64_END\*\//;
  if (!re.test(src)) { console.error('marcadores QUAD_B64 não encontrados em src/jogo.ts'); process.exit(1); }
  for (const k of chaves) {
    if (/["'`\\]/.test(feito[k]) || /["'`\\]/.test(k)) {
      console.error('aspas em chave ou URI — nada gravado'); process.exit(1);
    }
  }
  src = src.replace(re, bloco);
  fs.writeFileSync(ARQ, src);
  const total = chaves.reduce((a, k) => a + feito[k].length, 0);
  console.log(chaves.length + ' páginas · ' + (total / 1048576).toFixed(2) + ' MB no total');
  console.log('src/jogo.ts: ' + (src.length / 1048576).toFixed(2) + ' MB — rode `npm run build`');
})();
