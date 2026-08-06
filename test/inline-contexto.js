// Embute as IMAGENS DE CONTEXTO da caixa de fala em src/jogo.ts, em WebP.
//
//   node test/inline-contexto.js            grava
//   node test/inline-contexto.js --medir    só mede, em várias larguras, e não grava
//
// O que são: paisagens largas que aparecem ATRÁS da caixa de fala e trocam conforme a fala
// avança. Chegam em `assets/entrada/ctx-<capítulo>-<nome>.png`, que é pasta de ENTREGA e é
// ignorada pelo git — o que fica versionado é o base64 que este script escreve.
//
// DUAS decisões que valem mais que o código:
//
// 1. **Largura de embutir, não largura de origem.** As peças chegam com ~1940 px de largura e
//    a tela mostra 390. Embutir o mestre custaria megabytes por nada. `LARGURA` é 2× a tela
//    de referência — o suficiente para telas de densidade alta, e o dobro do que se vê. Meça
//    com `--medir` antes de mudar: o arquivo é único e cada KB é tela branca no celular.
//
// 2. **Nenhuma figura humana.** Estas imagens acompanham texto que AFIRMA história, e uma
//    pessoa desenhada afirma junto: roupa, corpo e adorno viram declaração sobre um povo real
//    (§2 do CLAUDE.md). As peças embutidas até aqui são paisagem de propósito. Se chegar uma
//    com gente, ela NÃO entra sem o dono aprovar a cena — relate, não embuta.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..');
const ARQ = path.join(RAIZ, 'src', 'jogo.ts');
const DIR = path.join(RAIZ, 'assets', 'entrada');

const LARGURA = 780;    // 2× os 390 px da tela de referência
const QUAL = 0.80;      // a mesma qualidade das pinturas de cenário, medida e aprovada

const medir = process.argv.includes('--medir');
const LARGURAS = medir ? [520, 660, 780, 900, 1100] : [LARGURA];

(async () => {
  const arqs = fs.existsSync(DIR)
    ? fs.readdirSync(DIR).filter(f => /^ctx-[a-z0-9-]+\.png$/.test(f)).sort()
    : [];
  if (!arqs.length) { console.error('nenhuma ctx-*.png em assets/entrada'); process.exit(1); }

  const nav = await chromium.launch();
  const pg = await nav.newPage();
  const feito = {};

  for (const a of arqs) {
    const chave = a.replace(/^ctx-|\.png$/g, '');
    await pg.goto('file:///' + path.join(DIR, a).replace(/\\/g, '/'));
    for (const L of LARGURAS) {
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
        return { uri: c.toDataURL('image/webp', d.q), w: W, h: H, ow: im.naturalWidth };
      }, { L, q: QUAL });
      console.log(chave.padEnd(14) + String(r.w).padStart(5) + 'x' + r.h
        + ' · ' + (r.uri.length / 1024).toFixed(0) + ' KB base64'
        + (medir ? '' : ' (mestre ' + r.ow + ' px)'));
      if (!medir) feito[chave] = r.uri;
    }
  }
  await nav.close();
  if (medir) return;

  const chaves = Object.keys(feito).sort();
  const bloco =
    '/*CTX_B64_START — gerado por test/inline-contexto.js, não edite à mão*/\n' +
    '// Paisagem por trás da caixa de fala. A chave é o nome do arquivo entregue sem o `ctx-`;\n' +
    '// quem associa fala e imagem é `imgs` em EPOCAS, não este bloco.\n' +
    'const CTX_B64: Record<string, string> = {\n'
    + chaves.map(k => '  "' + k + '": "' + feito[k] + '"').join(',\n') + '\n};\n' +
    '/*CTX_B64_END*/';

  let src = fs.readFileSync(ARQ, 'utf8');
  const re = /\/\*CTX_B64_START[\s\S]*?CTX_B64_END\*\//;
  if (!re.test(src)) { console.error('marcadores CTX_B64 não encontrados em src/jogo.ts'); process.exit(1); }
  for (const k of chaves) {
    if (/["'`\\]/.test(feito[k]) || /["'`\\]/.test(k)) {
      console.error('aspas em chave ou URI — nada gravado'); process.exit(1);
    }
  }
  src = src.replace(re, bloco);
  fs.writeFileSync(ARQ, src);
  const total = chaves.reduce((a, k) => a + feito[k].length, 0);
  console.log(chaves.length + ' imagens · ' + (total / 1024).toFixed(0) + ' KB no total');
  console.log('src/jogo.ts: ' + (src.length / 1048576).toFixed(2) + ' MB — rode `npm run build`');
})();
