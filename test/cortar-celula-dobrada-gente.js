// PARTE UMA CELULA DOBRADA DE `GENTE_EP_B64` EM DUAS POSES — no ponto que a direcao de arte
// aprovou, nao no meio geometrico.
//
// POR QUE ELE EXISTE (05/09). Seis das 312 celulas de `GENTE_EP_B64` guardam DUAS poses da mesma
// pessoa coladas lado a lado: o corte original (`test/cortar-gente.js`) varre a folha em magenta
// por MANCHA e exige exatamente 8 manchas por fileira, entao duas figuras que quase se tocam
// entram como uma so. O motor centra pela LARGURA DO QUADRO (`dx = cxm - dw/2`, jogo.ts ~6395) e
// normaliza pela ALTURA, entao esse passo desenha a pessoa em dobro — 1 de 8 passos da fileira.
//
// NENHUMA FERRAMENTA DA CASA SERVIA, e vale escrito para ninguem tentar de novo:
//   · `cortar-gente.js` foi QUEM produziu a dobra (parte da folha em magenta, por mancha);
//   · `tapar-buraco-gente.js` so COPIA a pose vizinha (foi ele que fez as 4 copias byte-identicas);
//   · `recortar-folha.js` parte de folha em magenta, nao de `GENTE_EP_B64` ja cortado;
//   · `embutir-gente.js` emenda folha nova inteira e recusa chave que ja existe.
// Faltava o que aceita um PONTO DE CORTE CUSTOMIZADO numa celula ja cortada. E este.
//
// ONDE CORTAR NAO E ESCOLHA DESTE ARQUIVO. O meio geometrico esta ERRADO e o motivo e o motor:
// como a ancora horizontal e o CENTRO DA CELULA, quem decide se a pessoa anda reto e onde a
// CABECA cai dentro do retangulo novo (o "registre pela cabeca" do §5 do CLAUDE.md). Cortar no
// meio do vao deixa as duas metades com a cabeca a -14,5 e -4 numa fileira cuja amplitude natural
// e 3,5 px de fonte: a pessoa daria um passo de lado uma vez por ciclo. As coordenadas certas
// saem de `node test/arte-receita-corte-gente.js <cap> <fXqY,...>` e o julgamento visual delas
// esta em `ferramentas/arte-corte-gente-dobrada-05-09.md`.
//
// USO — a fileira INTEIRA e reescrita, e a receita e explicita:
//
//   node test/cortar-celula-dobrada-gente.js <cap> <fileira> <8 entradas>
//   node test/cortar-celula-dobrada-gente.js praca 0 q0 q1 q2 q3:0:158 q3:176:334 q4 q5 q6
//
//   `qN`            mantem o quadro N da fileira, byte por byte;
//   `qN:x0:x1`      recorta a janela [x0, x1) do quadro N. x0 < 0 e x1 > largura sao aceitos e
//                   viram preenchimento TRANSPARENTE (alfa 0) — nunca esticar nem repetir borda.
//
// AS TRAVAS, e cada uma existe por um jeito conhecido de estragar a fileira:
//   1. **Oito entradas, sempre.** `GENTE4_PASSO` foi derivado de "laco completo em OITO quadros";
//      com sete o laco cobre 39,12 px de mundo contra 45,04 de passada desenhada = 13,1% de
//      deslize, a armadilha nº 1 do §7 por uma porta nova. `embutir-gente.js` tambem recusa folha
//      que nao tenha 24.
//   2. **Quadro que SAI da fileira tem de ser vazio (<=1px) ou copia byte-identica de um que
//      FICA.** E o que impede o corte de apagar arte de verdade sem ninguem ver. Sai da conta:
//      cada fileira com celula dobrada tem exatamente um buraco tapado ou vazio, e cada corte
//      produz exatamente um quadro real para ocupa-lo.
//   3. **A ALTURA nao muda.** E ela que carrega a escala (`sc = GENTE4_ALVO / naturalHeight`);
//      mexer nela e mudar o tamanho da pessoa na rua.
//   4. **A janela tem de conter uma FIGURA, nao tinta.** Medido contra este proprio arquivo em
//      05/09: a primeira versao cobrava `tinta > 0` e ACEITOU o corredor vazio de `praca f0q3`
//      (janela [153..176), 23x258) porque ele tem DOIS pixels perdidos em y 236..237. Um portao
//      que passa com 2 pixels de 5.934 nao e portao. A regua passou a ser a altura da mancha:
//      uma pessoa ocupa quase a celula inteira (a janela boa mede 99,6% da altura; o corredor
//      mede 0,8%), entao a caixa de tinta precisa de >= 50% da altura e >= 1% da area.
//
// Reencode em WebP **0,76** — a regua da casa para personagem/NPC (CLAUDE.md §6); e a mesma
// qualidade com que `cortar-gente.js` gerou estes quadros. Rode `node test/tirar-icc.js` depois:
// todo reencode pelo canvas do Chromium recarimba o perfil sRGB de 456 bytes.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ABRIR = require('./abrir.js');

const QUAL = 0.76;

const cap = process.argv[2];
const fArg = process.argv[3];
const receita = process.argv.slice(4);
if (!cap || fArg === undefined || !receita.length) {
  console.error('uso: node test/cortar-celula-dobrada-gente.js <cap> <fileira 0-2> <8 entradas qN ou qN:x0:x1>');
  process.exit(1);
}
const fi = +fArg;
if (!(fi >= 0 && fi <= 2)) { console.error('fileira fora de 0..2'); process.exit(1); }
if (receita.length !== 8) {
  console.error('a fileira tem de terminar com OITO quadros — vieram ' + receita.length +
    '. Sete quadros dao 13,1% de deslize do pe (ver cabecalho).');
  process.exit(1);
}

const passos = receita.map((t, k) => {
  const m = t.match(/^q(\d+)(?::(-?\d+):(-?\d+))?$/);
  if (!m) { console.error('entrada ' + k + ' invalida: "' + t + '" (esperado qN ou qN:x0:x1)'); process.exit(1); }
  const q = +m[1];
  if (!(q >= 0 && q <= 7)) { console.error('entrada ' + k + ': quadro ' + q + ' fora de 0..7'); process.exit(1); }
  if (m[2] === undefined) return { fonte: q, corte: null };
  const x0 = +m[2], x1 = +m[3];
  if (x1 <= x0) { console.error('entrada ' + k + ': janela vazia [' + x0 + '..' + x1 + ')'); process.exit(1); }
  return { fonte: q, corte: [x0, x1] };
});

// ---- localiza os 24 data-URI do capitulo, com a mesma leitura de tapar-buraco-gente.js ----
const alvo = path.resolve(__dirname, '..', 'src', 'jogo.ts');
const s = fs.readFileSync(alvo, 'utf8');
const iIni = s.indexOf('/*GENTE_EP_B64_START');
const iFim = s.indexOf('/*GENTE_EP_B64_END');
if (iIni < 0 || iFim < 0) { console.error('as marcas GENTE_EP_B64_START/END nao estao no lugar'); process.exit(1); }
const bloco = s.slice(iIni, iFim);
const reCap = /^  ([A-Za-z0-9_]+): \[$/gm;
let m2, caps = [];
while ((m2 = reCap.exec(bloco))) caps.push({ nome: m2[1], i: m2.index });
const ci = caps.findIndex(c => c.nome === cap);
if (ci < 0) { console.error('nao ha folha de gente para "' + cap + '" — ha: ' + caps.map(c => c.nome).join(', ')); process.exit(1); }
const de = caps[ci].i, ate = ci + 1 < caps.length ? caps[ci + 1].i : bloco.length;
const achados = [];
const reU = /"data:[^"]*"/g;
let u;
const trecho = bloco.slice(de, ate);
while ((u = reU.exec(trecho))) achados.push({ txt: u[0], ini: de + u.index, fim: de + u.index + u[0].length });
if (achados.length !== 24) { console.error(cap + ': ' + achados.length + ' quadros, esperava 24'); process.exit(1); }

const daFileira = achados.slice(fi * 8, fi * 8 + 8);

// ---- dimensoes pelo cabecalho WebP, sem navegador ----
function dim(uri) {
  const b = Buffer.from(uri.slice(uri.indexOf(',') + 1, -1), 'base64');
  if (b.length < 30 || b.toString('ascii', 8, 12) !== 'WEBP') return [0, 0];
  const tag = b.toString('ascii', 12, 16);
  if (tag === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (tag === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (tag === 'VP8L') { const bits = b.readUInt32LE(21); return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1]; }
  return [0, 0];
}
const dims = daFileira.map(a => dim(a.txt));

// TRAVA 4 (parte 1): fonte de corte nao pode ser quadro vazio.
for (const p of passos) if (p.corte && dims[p.fonte][0] <= 1) {
  console.error(cap + ' f' + fi + 'q' + p.fonte + ' esta vazio (' + dims[p.fonte].join('x') + ') — nao ha o que cortar.');
  process.exit(1);
}

// TRAVA 2: todo quadro que SAI tem de ser vazio ou copia byte-identica de um que FICA.
const usados = new Set(passos.map(p => p.fonte));
const ficam = passos.filter(p => !p.corte).map(p => daFileira[p.fonte].txt);
for (let q = 0; q < 8; q++) {
  if (usados.has(q)) continue;
  const txt = daFileira[q].txt;
  if (dims[q][0] <= 1) { console.log('  sai q' + q + ' — quadro VAZIO (' + dims[q].join('x') + ')'); continue; }
  const igualA = passos.findIndex(p => !p.corte && daFileira[p.fonte].txt === txt);
  if (igualA >= 0) { console.log('  sai q' + q + ' — COPIA byte-identica de q' + passos[igualA].fonte); continue; }
  console.error(cap + ' f' + fi + 'q' + q + ' sairia da fileira e NAO e vazio nem copia de um quadro que fica ' +
    '(' + dims[q].join('x') + ', ' + txt.length + ' caracteres). Isso apagaria arte — recusado.');
  process.exit(1);
}

(async function () {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const page = await nav.newPage();
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  await page.setContent('<!doctype html><meta charset="utf-8"><title>corte</title>');

  const saida = await page.evaluate(async ({ entradas, qual }) => {
    async function carregar(d) {
      const im = new Image(); im.src = d;
      await new Promise(r => { im.complete ? r() : (im.onload = r, im.onerror = r); });
      return im;
    }
    function tinta(g, w, h) {
      const px = g.getImageData(0, 0, w, h).data;
      let n = 0, minX = w, maxX = -1, minY = h, maxY = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
        if (px[(y * w + x) * 4 + 3] > 24) { n++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
      return { n, minX, maxX, minY, maxY };
    }
    const fora = [];
    for (const e of entradas) {
      const im = await carregar(e.uri);
      if (!e.corte) { fora.push({ uri: e.uri, w: im.naturalWidth, h: im.naturalHeight, mantido: true }); continue; }
      const [x0, x1] = e.corte;
      const w = x1 - x0, h = im.naturalHeight;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d');
      // NADA de esticar nem repetir borda: o canvas ja nasce transparente e so a parte que
      // existe na folha e desenhada. O que cair fora fica com alfa 0.
      g.imageSmoothingEnabled = false;
      const sx = Math.max(0, x0), sx1 = Math.min(im.naturalWidth, x1);
      if (sx1 > sx) g.drawImage(im, sx, 0, sx1 - sx, h, sx - x0, 0, sx1 - sx, h);
      const t = tinta(g, w, h);
      fora.push({
        uri: c.toDataURL('image/webp', qual), w, h, mantido: false,
        padEsq: Math.max(0, -x0), padDir: Math.max(0, x1 - im.naturalWidth),
        fonteW: im.naturalWidth, tinta: t
      });
    }
    return fora;
  }, { entradas: passos.map(p => ({ uri: daFileira[p.fonte].txt.slice(1, -1), corte: p.corte })), qual: QUAL });

  await nav.close();
  if (erros.length) { console.error('erro no navegador: ' + erros.join(' | ')); process.exit(1); }

  // TRAVA 3: a altura nao muda. TRAVA 4 (parte 2): a janela tem de conter tinta.
  const alt = dims[passos[0].fonte][1];
  let mal = 0;
  saida.forEach((r, k) => {
    const p = passos[k];
    if (p.corte) {
      const altMancha = r.tinta.n ? (r.tinta.maxY - r.tinta.minY + 1) / r.h : 0;
      const areaMancha = r.tinta.n / (r.w * r.h);
      if (altMancha < 0.5 || areaMancha < 0.01) {
        console.error('  q' + p.fonte + ' [' + p.corte.join('..') + ') nao contem FIGURA: mancha de tinta cobre ' +
          (altMancha * 100).toFixed(1) + '% da altura e ' + (areaMancha * 100).toFixed(2) + '% da area (regua: 50% e 1%). ' +
          'Provavelmente e o corredor entre as duas poses, nao uma delas — recusado.');
        mal++;
      }
      if (r.h !== dims[p.fonte][1]) { console.error('  q' + p.fonte + ': altura mudou ' + dims[p.fonte][1] + ' -> ' + r.h + ' — a escala vem da altura.'); mal++; }
    }
  });
  if (mal) process.exit(1);

  console.log('\n' + cap + ' f' + fi + ' — fileira reescrita, ' + saida.length + ' quadros:');
  saida.forEach((r, k) => {
    const p = passos[k];
    if (r.mantido) { console.log('  q' + k + '  <- q' + p.fonte + '            ' + r.w + 'x' + r.h + '   (mantido)'); return; }
    console.log('  q' + k + '  <- q' + p.fonte + ' [' + p.corte[0] + '..' + p.corte[1] + ')  ' +
      r.w + 'x' + r.h + '   de ' + r.fonteW + 'px' +
      (r.padEsq ? '  +' + r.padEsq + 'px transp. ESQ' : '') +
      (r.padDir ? '  +' + r.padDir + 'px transp. DIR' : '') +
      '   tinta x ' + r.tinta.minX + '..' + r.tinta.maxX + ' y ' + r.tinta.minY + '..' + r.tinta.maxY);
  });

  // ---- grava, de tras para frente para os deslocamentos continuarem valendo ----
  let novo = s;
  for (let k = 7; k >= 0; k--) {
    const a = daFileira[k];
    novo = novo.slice(0, iIni + a.ini) + '"' + saida[k].uri + '"' + novo.slice(iIni + a.fim);
  }
  fs.writeFileSync(alvo, novo);
  const antes = daFileira.reduce((n, a) => n + a.txt.length, 0);
  const depois = saida.reduce((n, r) => n + r.uri.length + 2, 0);
  console.log('  gravado em src/jogo.ts — ' + antes + ' -> ' + depois + ' caracteres (' +
    (depois - antes >= 0 ? '+' : '') + (depois - antes) + '). Rode `node test/tirar-icc.js` depois.');
})().catch(e => { console.error(e); process.exit(1); });
