// QA ADVERSARIAL 05/09 — MEDE DE NOVO, POR CONTA PROPRIA, O QUE O CORTE DAS CELULAS DOBRADAS
// DE `GENTE_EP_B64` ALEGA TER FEITO.
//
// POR QUE ELE EXISTE. A entrega do dev-jogo afirma seis numeros (312/312 quadros com tinta,
// zero celula larga, zero copia byte-identica em fileira, 24/24 passos com UMA pessoa em
// praca/pindorama/temfonte/segurou). Aceitar esses numeros do instrumento de quem cortou e
// aceitar a palavra de quem tem interesse no resultado. Este arquivo NAO importa nada do
// `cortar-celula-dobrada-gente.js` nem do `qa-gente-quadro-dobrado.js`: le a fonte, faz o
// proprio parse do bloco, tem o proprio leitor de cabecalho WebP e a propria contagem de tinta.
//
// O QUE ELE MEDE ALEM DO QUE OS PORTOES DA CASA MEDEM. Os portoes de la olham LARGURA contra a
// mediana da fileira — uma regua indireta, que so acha a celula dobrada quando ela e MUITO mais
// larga que as irmas. Aqui a pergunta e direta: quantas FIGURAS ha dentro do quadro? Conta-se o
// perfil de tinta por coluna e contam-se os aglomerados separados por um corredor vazio largo o
// bastante para nao ser o vao entre um braco e o tronco. Duas figuras num quadro = o defeito.
//
// USO:  node test/qa-refuta-corte-gente-05-09.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ABRIR = require('./abrir.js');

const FOCO = ['praca', 'pindorama', 'temfonte', 'segurou'];
// Corredor: quantas colunas seguidas sem tinta separam DUAS figuras. Uma pessoa de ~150px de
// largura nao tem 12 colunas vazias no meio do corpo; duas poses coladas tem (as medidas de
// 05/09 mostram vaos de 19 a 27 colunas). 12 e o meio termo, e o resultado nao muda entre 8 e 22.
const CORREDOR = 12;
// Uma "figura" tem de valer alguma coisa: aglomerado com menos de 2% da tinta do quadro e ponta
// de objeto (a vasilha na mao, a aba do chapeu), nao gente.
const MIN_FRACAO = 0.02;

// ---------- parse proprio do bloco, sem eval ----------
// GENTE_FONTE aponta o instrumento a outra copia de `jogo.ts` — e assim que se mede o ANTES
// (a `main`) com exatamente a mesma regua do DEPOIS, sem depender do numero de ninguem.
const fonte = fs.readFileSync(process.env.GENTE_FONTE || path.resolve(__dirname, '..', 'src', 'jogo.ts'), 'utf8');
const iIni = fonte.indexOf('/*GENTE_EP_B64_START');
const iFim = fonte.indexOf('/*GENTE_EP_B64_END');
if (iIni < 0 || iFim < 0) { console.error('marcas GENTE_EP_B64_START/END ausentes'); process.exit(1); }
const bloco = fonte.slice(iIni, iFim);
const folhas = {};
{
  const reCap = /^  ([A-Za-z0-9_]+): \[$/gm;
  const marcas = [];
  let m;
  while ((m = reCap.exec(bloco))) marcas.push({ nome: m[1], i: m.index });
  for (let k = 0; k < marcas.length; k++) {
    const de = marcas[k].i, ate = k + 1 < marcas.length ? marcas[k + 1].i : bloco.length;
    const uris = (bloco.slice(de, ate).match(/"data:[^"]*"/g) || []).map(s => s.slice(1, -1));
    folhas[marcas[k].nome] = uris;
  }
}

// ---------- leitor de cabecalho WebP, escrito aqui ----------
// RIFF(4) tam(4) WEBP(4) entao o primeiro chunk. VP8X carrega a lona (24 bits, -1); VP8 tem a
// dimensao no bitstream key-frame; VP8L nos 14+14 bits depois da assinatura 0x2f.
function cabecalho(uri) {
  const virg = uri.indexOf(',');
  if (virg < 0) return null;
  const b = Buffer.from(uri.slice(virg + 1), 'base64');
  if (b.length < 16) return { w: 0, h: 0, tag: 'curto', bytes: b.length };
  if (b.toString('latin1', 0, 4) !== 'RIFF' || b.toString('latin1', 8, 12) !== 'WEBP')
    return { w: 0, h: 0, tag: 'naoWebp', bytes: b.length };
  const tag = b.toString('latin1', 12, 16);
  const chunks = [];
  for (let p = 12; p + 8 <= b.length;) {
    const t = b.toString('latin1', p, p + 4);
    const n = b.readUInt32LE(p + 4);
    chunks.push(t);
    p += 8 + n + (n & 1);
  }
  if (tag === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3), tag, chunks, bytes: b.length };
  if (tag === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, tag, chunks, bytes: b.length };
  if (tag === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1, tag, chunks, bytes: b.length }; }
  return { w: 0, h: 0, tag, chunks, bytes: b.length };
}

let falhas = 0;
const linhas = [];
function ok(c, m) { console.log((c ? '  ok    ' : '  FALHA ') + m); if (!c) falhas++; }

(async function () {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const page = await nav.newPage();
  const erros = [];
  page.on('pageerror', e => erros.push(String(e)));
  await page.setContent('<!doctype html><meta charset="utf-8"><title>qa</title>');

  const caps = Object.keys(folhas);
  const medidas = {};
  for (const cap of caps) {
    medidas[cap] = await page.evaluate(async ({ uris, corredor, minFracao }) => {
      const fora = [];
      for (const d of uris) {
        const im = new Image(); im.src = d;
        await new Promise(r => { im.complete ? r() : (im.onload = r, im.onerror = r); });
        const w = im.naturalWidth, h = im.naturalHeight;
        if (!w || !h) { fora.push({ w, h, tinta: 0, figuras: 0, colunas: [] }); continue; }
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false;
        g.drawImage(im, 0, 0);
        const px = g.getImageData(0, 0, w, h).data;
        const col = new Array(w).fill(0);
        let tinta = 0, minY = h, maxY = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          if (px[(y * w + x) * 4 + 3] > 24) { col[x]++; tinta++; if (y < minY) minY = y; if (y > maxY) maxY = y; }
        }
        // aglomerados separados por >= `corredor` colunas vazias
        const grupos = [];
        let ini = -1, vazias = 0;
        for (let x = 0; x < w; x++) {
          if (col[x] > 0) {
            if (ini < 0) ini = x;
            vazias = 0;
          } else if (ini >= 0) {
            vazias++;
            if (vazias >= corredor) { grupos.push([ini, x - vazias]); ini = -1; vazias = 0; }
          }
        }
        if (ini >= 0) grupos.push([ini, w - 1]);
        const pesados = grupos.map(gp => {
          let n = 0; for (let x = gp[0]; x <= gp[1]; x++) n += col[x];
          return { de: gp[0], ate: gp[1], tinta: n };
        }).filter(gp => tinta > 0 && gp.tinta / tinta >= minFracao);
        fora.push({
          w, h, tinta, figuras: pesados.length, grupos: pesados,
          altMancha: maxY >= 0 ? (maxY - minY + 1) / h : 0,
        });
      }
      return fora;
    }, { uris: folhas[cap], corredor: CORREDOR, minFracao: MIN_FRACAO });
  }
  await nav.close();
  if (erros.length) { console.error('erro no navegador: ' + erros.join(' | ')); process.exit(1); }

  // ---------- 1. 312/312 quadros com tinta, nos 13 capitulos ----------
  let total = 0, comTinta = 0, vazios = [];
  for (const cap of caps) {
    folhas[cap].forEach((uri, i) => {
      const cab = cabecalho(uri), md = medidas[cap][i];
      total++;
      const vazio = !cab || cab.w <= 1 || md.tinta === 0;
      if (vazio) vazios.push(cap + ' f' + Math.floor(i / 8) + 'q' + (i % 8) + ' (' + (cab ? cab.w + 'x' + cab.h : '?') + ', tinta ' + md.tinta + ')');
      else comTinta++;
    });
  }
  console.log('\n== 1. QUADROS COM TINTA (decodificados por mim, nao pelo cabecalho) ==');
  console.log('   ' + caps.length + ' folhas · ' + total + ' quadros · ' + comTinta + ' com tinta');
  vazios.forEach(v => console.log('   VAZIO  ' + v));
  ok(total === 312, 'sao 312 quadros no total (medido: ' + total + ')');
  ok(comTinta === total, 'todos os ' + total + ' quadros tem tinta de verdade (medido: ' + comTinta + ')');

  // ---------- 2. UMA figura por quadro, nos 4 capitulos afetados ----------
  console.log('\n== 2. QUANTAS FIGURAS DENTRO DE CADA QUADRO (corredor >= ' + CORREDOR + ' colunas vazias) ==');
  let dobrados = [];
  for (const cap of caps) {
    medidas[cap].forEach((md, i) => {
      if (md.figuras > 1) dobrados.push({
        nome: cap + ' f' + Math.floor(i / 8) + 'q' + (i % 8), w: md.w, n: md.figuras,
        onde: md.grupos.map(g => g.de + '..' + g.ate).join(' | '),
      });
    });
  }
  for (const cap of FOCO) {
    const md = medidas[cap];
    const nFig = md.map(x => x.figuras);
    const um = nFig.filter(n => n === 1).length;
    console.log('   ' + cap.padEnd(10) + ' 24 quadros · com UMA figura: ' + um + '/24 · larguras ' +
      Math.min.apply(null, md.map(x => x.w)) + '..' + Math.max.apply(null, md.map(x => x.w)));
    ok(um === 24, cap + ': os 24 passos mostram UMA pessoa (medido: ' + um + '/24)');
  }
  dobrados.forEach(d => console.log('   DOBRADO  ' + d.nome.padEnd(18) + d.w + 'px · ' + d.n + ' figuras em ' + d.onde));
  ok(dobrados.length === 0, 'nenhum quadro em nenhum dos 13 capitulos guarda mais de uma figura' +
    (dobrados.length ? ' — ACHADOS: ' + dobrados.map(d => d.nome).join(', ') : ''));

  // ---------- 3. celula larga contra a mediana (regua da casa, refeita) ----------
  console.log('\n== 3. LARGURA CONTRA A MEDIANA DA FILEIRA (regua 1,6x, refeita aqui) ==');
  const largos = [];
  for (const cap of caps) {
    for (let f = 0; f < folhas[cap].length / 8; f++) {
      const ws = [];
      for (let q = 0; q < 8; q++) ws.push(medidas[cap][f * 8 + q].w);
      const ord = ws.filter(w => w > 1).slice().sort((a, b) => a - b);
      const med = ord[Math.floor(ord.length / 2)];
      ws.forEach((w, q) => { if (w > 1 && w > med * 1.6) largos.push(cap + ' f' + f + 'q' + q + ' (' + w + ' vs mediana ' + med + ')'); });
    }
  }
  largos.forEach(l => console.log('   LARGO  ' + l));
  ok(largos.length === 0, 'zero celula larga em 312 quadros (medido: ' + largos.length + ')');

  // ---------- 4. copia byte-identica dentro da fileira ----------
  console.log('\n== 4. COPIA BYTE-IDENTICA DENTRO DA MESMA FILEIRA ==');
  const copias = [];
  for (const cap of caps) {
    for (let f = 0; f < folhas[cap].length / 8; f++) {
      const vistos = new Map();
      for (let q = 0; q < 8; q++) {
        const u = folhas[cap][f * 8 + q];
        if (vistos.has(u)) copias.push(cap + ' f' + f + 'q' + q + ' == q' + vistos.get(u));
        else vistos.set(u, q);
      }
    }
  }
  copias.forEach(c => console.log('   COPIA  ' + c));
  ok(copias.length === 0, 'zero copia byte-identica dentro de fileira (medido: ' + copias.length + ')');

  // ---------- 5. tabela crua dos 4 capitulos, para o relatorio ----------
  console.log('\n== 5. TABELA CRUA (largura x altura · tinta · figuras) ==');
  for (const cap of FOCO) {
    for (let f = 0; f < 3; f++) {
      const l = [];
      for (let q = 0; q < 8; q++) {
        const md = medidas[cap][f * 8 + q], cab = cabecalho(folhas[cap][f * 8 + q]);
        l.push('q' + q + ' ' + md.w + 'x' + md.h + (cab && cab.w !== md.w ? '(!cab ' + cab.w + ')' : '') + ' t' + md.tinta + ' f' + md.figuras);
      }
      console.log('   ' + cap + ' f' + f + ': ' + l.join(' · '));
    }
  }

  console.log(falhas ? '\nREPROVOU (' + falhas + ')' : '\nPASSOU');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
