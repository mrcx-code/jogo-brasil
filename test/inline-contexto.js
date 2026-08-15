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
// 1. **Recorta primeiro, reamostra depois** (revisto em 15/08 — antes era só reamostrar, e a
//    frase que morava aqui dizia que `LARGURA` era "2× a tela", o que virou mentira e pior:
//    escondia o defeito). A peça é desenhada em tela cheia com `object-fit: cover`, então o
//    que sobra da proporção da tela é jogado fora na exibição. Reamostrar a imagem INTEIRA para
//    780 px fazia a faixa visível de uma entrega deitada de 1942 px nascer de 150 px reais,
//    esticados por 780 de tela. `LARGURA` agora é a largura da TELA e o recorte vem antes.
//    Meça com `--medir` antes de mudar: o arquivo é único e cada KB é tela branca no celular.
//
// 2. **Nenhuma figura humana.** Estas imagens acompanham texto que AFIRMA história, e uma
//    pessoa desenhada afirma junto: roupa, corpo e adorno viram declaração sobre um povo real
//    (§2 do CLAUDE.md). As peças embutidas até aqui são paisagem de propósito. Se chegar uma
//    com gente, ela NÃO entra sem o dono aprovar a cena — relate, não embuta.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');

const RAIZ = path.resolve(__dirname, '..');
const ARQ = path.join(RAIZ, 'src', 'jogo.ts');
const DIR = path.join(RAIZ, 'assets', 'entrada');

// A LARGURA DO ALVO, E ELA MUDOU DE SIGNIFICADO EM 15/08. Era 780 = "2x a tela", aplicado
// sobre a imagem INTEIRA — e como a peca e recortada pelo `cover` na hora de exibir, a faixa
// que realmente aparecia numa entrega deitada de 1942 px vinha de 780 x (374/1942) = **150 px
// reais esticados por 780 de tela**. Era essa a moleza das imagens de historia, e ela nunca
// foi de qualidade de WebP: era resolucao jogada fora no recorte.
// Agora o recorte vem ANTES da reamostragem, entao 390 e a largura da tela de referencia e
// significa 1 px por px de CSS — o mesmo que as 17 pecas deitadas ja entregavam na pratica,
// e 2,5x mais do que elas entregavam de verdade. O numero e igual para toda peca, deitada ou
// retrato: quem manda no tamanho e a TELA, nunca a forma do arquivo que chegou.
const LARGURA = 390;
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
    await pg.goto(ABRIR('file:///' + path.join(DIR, a).replace(/\\/g, '/')));
    for (const L of LARGURAS) {
      const r = await pg.evaluate(async function (d) {
        const im = document.querySelector('img');
        await im.decode();
        const iw = im.naturalWidth, ih = im.naturalHeight;
        // ===== NÃO SE EMBUTE O QUE A TELA NÃO MOSTRA (15/08) =====
        // A peça é desenhada em TELA CHEIA com `object-fit: cover`, então tudo o que sobra da
        // proporção da tela é recortado fora na hora de exibir — e até hoje viajava mesmo assim.
        // Só importou quando as entregas viraram RETRATO: uma peça deitada pesava 84 KB e a
        // primeira retrato pesou 288, e a porta de entrada saltou de 1.837 para 2.122 KB por
        // causa de UMA imagem. São bytes que ninguém nunca vê.
        // Aqui a peça é recortada ao CENTRO na proporção da tela de referência antes de
        // reamostrar. Nenhum pixel visível se perde em retrato: é exatamente a mesma região que
        // o `cover` escolheria. O que se perde é o que já era descartado.
        // O CUSTO, dito por extenso: deitado, o `cover` recortaria diferente e passa a ter menos
        // material nas laterais. É a mesma troca do §3.4 — mobile primeiro —, e a saída barata
        // continua sendo a régua do LEIAME: assunto nos 70% centrais.
        const pAlvo = d.pw / d.ph;
        let cx = 0, cy = 0, cw = iw, ch = ih;
        if (iw / ih > pAlvo) { cw = Math.round(ih * pAlvo); cx = Math.round((iw - cw) / 2); }
        else { ch = Math.round(iw / pAlvo); cy = Math.round((ih - ch) / 2); }
        const W = Math.min(d.L, cw);
        const H = Math.round(ch * W / cw);
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        g.imageSmoothingQuality = 'high';
        g.drawImage(im, cx, cy, cw, ch, 0, 0, W, H);
        return { uri: c.toDataURL('image/webp', d.q), w: W, h: H, ow: iw, oh: ih };
      }, { L, q: QUAL, pw: 390, ph: 844 });
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
