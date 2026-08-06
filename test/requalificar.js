// Reencoda em WebP a arte que JÁ está embutida em src/jogo.ts, bloco a bloco.
//
//   node test/requalificar.js 0.80 MOB_B64 DROP_B64 ICONE_B64 FRENTE_B64 RETRATO_B64
//   node test/requalificar.js 0.80 --medir MOB_B64        (só mede, não grava)
//
// Existe porque nem toda arte tem mestre em PNG: as peças de cenário vêm de
// `assets/cenarios-novos/*.png` e são reencodadas pelo `inline-fundos.js` direto da fonte sem
// perda de geração, mas objetos, drops, ícones, vegetação de frente e retratos já chegam em
// WebP. Para esses, baixar a qualidade é um segundo passo de compressão em cima do primeiro —
// perda de geração, de verdade. Por isso este script MEDE antes de gravar, e por isso o número
// que ele imprime (erro médio por canal contra o que estava lá) é a coisa a olhar, não o KB.
//
// Alvo: src/jogo.ts, a FONTE. O index.html da raiz é saída do build.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..');
const ARQ = path.join(RAIZ, 'src', 'jogo.ts');

const args = process.argv.slice(2);
const QUAL = parseFloat(args[0]);
const medir = args.includes('--medir');
const BLOCOS = args.slice(1).filter(a => a !== '--medir');
if (!(QUAL > 0 && QUAL <= 1) || !BLOCOS.length) {
  console.error('uso: node test/requalificar.js <qualidade> [--medir] BLOCO [BLOCO...]');
  process.exit(1);
}

const RE_URI = /data:image\/webp;base64,[A-Za-z0-9+/=]+/g;

(async () => {
  let src = fs.readFileSync(ARQ, 'utf8');
  const nav = await chromium.launch();
  const pg = await nav.newPage();
  await pg.goto('about:blank');

  let mudou = false;
  for (const nome of BLOCOS) {
    const i = src.indexOf('/*' + nome + '_START');
    const j = src.indexOf('/*' + nome + '_END');
    if (i < 0 || j < 0 || j < i) { console.error('marcadores de ' + nome + ' não encontrados'); process.exit(1); }
    const bloco = src.slice(i, j);
    const uris = bloco.match(RE_URI) || [];
    if (!uris.length) { console.log(nome + ': nenhuma imagem WebP'); continue; }

    const r = await pg.evaluate(async function (d) {
      const saida = [];
      for (const u of d.uris) {
        const im = new Image(); im.src = u; await im.decode();
        const c = document.createElement('canvas');
        c.width = im.naturalWidth; c.height = im.naturalHeight;
        const g = c.getContext('2d');
        g.drawImage(im, 0, 0);
        const antes = g.getImageData(0, 0, c.width, c.height).data;
        const novo = c.toDataURL('image/webp', d.q);
        // erro do NOVO contra o que estava embutido — é essa a perda que se está aceitando
        const i2 = new Image(); i2.src = novo; await i2.decode();
        const c2 = document.createElement('canvas');
        c2.width = c.width; c2.height = c.height;
        const g2 = c2.getContext('2d'); g2.drawImage(i2, 0, 0);
        const dep = g2.getImageData(0, 0, c.width, c.height).data;
        let s = 0, m = 0;
        for (let k = 0; k < antes.length; k += 4) {
          if (antes[k + 3] < 8) continue;            // pixel transparente não tem cor a comparar
          for (let z = 0; z < 3; z++) {
            const dd = Math.abs(antes[k + z] - dep[k + z]); s += dd; if (dd > m) m = dd;
          }
        }
        saida.push({ uri: novo, medio: s / (antes.length / 4 * 3), max: m, w: c.width, h: c.height });
      }
      return saida;
    }, { uris, q: QUAL });

    const antesKB = uris.reduce((a, u) => a + u.length, 0) / 1024;
    const depoisKB = r.reduce((a, x) => a + x.uri.length, 0) / 1024;
    const medio = r.reduce((a, x) => a + x.medio, 0) / r.length;
    const max = r.reduce((a, x) => Math.max(a, x.max), 0);
    console.log(nome.padEnd(14) + uris.length + ' imagens · ' + antesKB.toFixed(0) + ' KB -> '
      + depoisKB.toFixed(0) + ' KB (' + (100 - depoisKB / antesKB * 100).toFixed(0) + '%)'
      + ' · erro médio ' + medio.toFixed(2) + ' máx ' + max);

    if (!medir) {
      let k = 0;
      const novoBloco = bloco.replace(RE_URI, () => r[k++].uri);
      src = src.slice(0, i) + novoBloco + src.slice(j);
      mudou = true;
    }
  }
  await nav.close();

  if (mudou) {
    // O que este script troca são literais de string dentro de blocos existentes; a checagem
    // possível aqui é a das próprias strings. O arquivo inteiro é conferido pelo `tsc` dentro
    // do `npm run build`, que se recusa a escrever o index.html se algo estiver quebrado.
    for (const u of src.match(RE_URI) || []) {
      if (/["'`\\]/.test(u)) { console.error('URI com aspas — nada gravado'); process.exit(1); }
    }
    fs.writeFileSync(ARQ, src);
    console.log('src/jogo.ts: ' + (src.length / 1048576).toFixed(2) + ' MB — rode `npm run build`');
  }
})();
