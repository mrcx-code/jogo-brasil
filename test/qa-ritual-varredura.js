// VARREDURA INDEPENDENTE — nenhuma arte ritual sobrevive EM LUGAR NENHUM que o jogo carregue.
//
// Escrito pelo QA em 04/09 para tentar DERRUBAR a entrega `entrega/salvador-fala-abertura`,
// não para confirmá-la. O portão do autor (`test/salvador-drop-sem-ritual.js`) mede só o bloco
// `DROP_B64` da fonte mais os drops do `pack-salvador.json`. Isso responde "o drop trocou?",
// e NÃO responde "sobrou culto recolhível em algum caminho?" — que é outra pergunta:
//
//   · `MOB_B64` — o que o mob CARREGA é o que ele deixa cair; a figura pode reaparecer ali;
//   · `ICONE_B64` / `FRENTE_B64` / `GENTE_EP_B64` — arte que o autor não mede;
//   · os OUTROS DEZ pacotes — o portão do autor só abre o de SALVADOR;
//   · o `index.html` da raiz, que é o que o aparelho realmente executa (o autor mede a FONTE).
//
// Este arquivo varre TUDO: cada imagem única do `index.html` construído (o vetor `__ART` mais
// as URIs ainda embutidas) e cada imagem de cada `pack-*.json`, com o endereço que o pacote
// declara em `itens`. Assinatura por PIXEL decodificado a 16x16 sobre cinza — a mesma ideia do
// portão do autor, de propósito, para os dois números serem comparáveis.
//
// O QUE ELE IMPRIME, e é o ponto: a MENOR distância encontrada até cada uma das três artes
// rituais, com o endereço de onde ela está. Se a troca foi completa, o mínimo do repositório
// inteiro tem de ficar muito acima do limiar; se alguém devolveu o búzio a qualquer bloco, o
// endereço aparece aqui com distância ~0.
//
//   node test/qa-ritual-varredura.js
//   QA_LIMIAR=12 node test/qa-ritual-varredura.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}

const RAIZ = path.resolve(__dirname, '..');
const OBJ = path.join(RAIZ, 'assets', 'objetos');
const LIMIAR = Number(process.env.QA_LIMIAR || 12);

// As três artes que a entrega tirou do chão. Elas continuam no repositório de propósito —
// são o registro do que foi trocado e a referência contra a qual esta varredura mede.
const RITUAL = { 'drop-cap4-1': 'acarajé', 'drop-cap4-2': 'pano da costa', 'drop-cap4-3': 'búzios' };

let falhas = 0;
function ok(cond, msg) { console.log((cond ? '  ok    ' : '  FALHA ') + msg); if (!cond) falhas++; }

function uris() {
  const out = [];
  const vistos = new Map();          // uri -> primeiro endereço (a dedupe do build repete arte)
  function põe(uri, onde) {
    if (!uri || uri.indexOf('data:image/') !== 0) return;
    if (vistos.has(uri)) { vistos.get(uri).push(onde); return; }
    vistos.set(uri, [onde]);
    out.push({ uri, onde });
  }

  // 1. o index.html da raiz — é ele que o navegador executa
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  const mArt = html.match(/var __ART=(\[[\s\S]*?\]);/);
  if (mArt) {
    const arr = JSON.parse(mArt[1]);
    arr.forEach(function (u, i) { põe(u, 'index.html __ART[' + i + ']'); });
  }
  let n = 0;
  html.replace(/"(data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+)"/g, function (_, u) { põe(u, 'index.html embutida #' + (n++)); return _; });

  // 2. cada pacote de arte, com o endereço que ele mesmo declara
  fs.readdirSync(RAIZ).filter(f => /^pack-.*\.json$/.test(f)).sort().forEach(function (f) {
    const p = JSON.parse(fs.readFileSync(path.join(RAIZ, f), 'utf8'));
    const end = [];
    (p.itens || []).forEach(function (it) { end[it[1]] = (end[it[1]] ? end[it[1]] + '+' : '') + it[0].join('.'); });
    (p.arte || []).forEach(function (u, i) { põe(u, f + ' ' + (end[i] || 'arte[' + i + ']')); });
  });

  return { lista: out, vistos };
}

(async () => {
  const { lista, vistos } = uris();
  console.log('varridas ' + lista.length + ' imagens únicas (index.html + ' +
    fs.readdirSync(RAIZ).filter(f => /^pack-.*\.json$/.test(f)).length + ' pacotes)');

  const refs = Object.keys(RITUAL).map(function (n) {
    return { nome: n, uri: 'data:image/webp;base64,' + fs.readFileSync(path.join(OBJ, n + '.webp')).toString('base64') };
  });
  // CONTROLE DO INSTRUMENTO: a mesma arte ritual, recomprimida noutra qualidade. Se a
  // assinatura fosse por bytes, isto passaria despercebido; a distância dela tem de ficar
  // perto de zero, e é ela que diz se o limiar cobre re-encode.
  const alvos = refs.map(r => ({ nome: 'REF:' + r.nome, uri: r.uri }))
    .concat(lista.map((it, i) => ({ nome: it.onde, uri: it.uri, i })));

  const nav = await chromium.launch({ executablePath: chromiumPath() });
  const pg = await nav.newPage();
  await pg.goto('about:blank');
  const ass = [];
  const passo = 60;
  for (let k = 0; k < alvos.length; k += passo) {
    const parte = await pg.evaluate(async function (l) {
      const out = [];
      for (const it of l) {
        let v = null;
        try {
          const im = new Image(); im.src = it.uri; await im.decode();
          const c = document.createElement('canvas'); c.width = 16; c.height = 16;
          const x = c.getContext('2d');
          x.fillStyle = '#808080'; x.fillRect(0, 0, 16, 16);
          x.imageSmoothingEnabled = true;
          x.drawImage(im, 0, 0, 16, 16);
          const d = x.getImageData(0, 0, 16, 16).data;
          v = [];
          for (let i = 0; i < d.length; i += 4) { v.push(d[i], d[i + 1], d[i + 2]); }
        } catch (e) { v = null; }
        out.push(v);
      }
      return out;
    }, alvos.slice(k, k + passo).map(a => ({ uri: a.uri })));
    parte.forEach(p => ass.push(p));
  }
  await nav.close();

  function dist(a, b) {
    if (!a || !b) return Infinity;
    let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
    return s / a.length;
  }

  const naoDecodificou = alvos.filter((a, i) => !ass[i]);
  ok(naoDecodificou.length === 0, naoDecodificou.length + ' imagem(ns) não decodificaram (uma que não decodifica é uma que não foi medida)');

  console.log('\nmenor distância do REPOSITÓRIO INTEIRO até cada arte ritual:');
  refs.forEach(function (r, ri) {
    const linhas = [];
    for (let i = refs.length; i < alvos.length; i++) {
      linhas.push({ d: dist(ass[i], ass[ri]), onde: alvos[i].nome, uri: alvos[i].uri });
    }
    linhas.sort((a, b) => a.d - b.d);
    console.log('  ' + RITUAL[r.nome] + ' (' + r.nome + '):');
    linhas.slice(0, 3).forEach(function (l, k) {
      const outros = vistos.get(l.uri) || [];
      console.log('     ' + (k + 1) + '. ' + l.d.toFixed(1) + '  ' + l.onde +
        (outros.length > 1 ? '  [+' + (outros.length - 1) + ' endereço(s) com a mesma arte]' : ''));
    });
    ok(linhas[0].d > LIMIAR, 'nenhuma arte carregada pelo jogo é ' + RITUAL[r.nome] +
      ' (mínimo ' + linhas[0].d.toFixed(1) + ' > ' + LIMIAR + ', em ' + linhas[0].onde + ')');
  });

  console.log(falhas ? '\n' + falhas + ' FALHA(S)' : '\ntudo verde');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
