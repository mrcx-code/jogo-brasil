// O PISO DA ARTE LEGITIMA, MEDIDO POR FORA — sonda do QA, 05/09.
//
// `test/qa-ritual-varredura.js` afirma "piso de arte LEGITIMA 28,8 em 518 imagens, folga
// 1,44x" e imprime "5 de 518 abaixo de 30". Este arquivo remede o mesmo piso com extracao
// propria das URIs e banco proprio, e responde tres coisas que aquele nao imprime:
//
//   1. quantas imagens legitimas moram abaixo de 30, de 25 e de 22 (a folga real);
//   2. as 15 mais proximas, com endereco — para saber QUAL arte esta encostando;
//   3. o piso POR PACOTE, que e o piso POR CAPITULO: e ele que responde com que velocidade
//      a folga encolhe quando entra capitulo novo. Um capitulo novo sorteia um piso da mesma
//      distribuicao; o minimo de N sorteios cai com N.
//
// Nao decide nada (sai 0 sempre, salvo erro) — e medida, nao portao.
//
//   node test/qa-ritual-piso-independente.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'assinatura-ritual.js'))) {
  console.error('ESTA SONDA MEDE A ENTREGA A (ritual-fora-do-drop-sem-lista-branca), que ainda nao');
  console.error('esta neste ramo: test/assinatura-ritual.js nao existe. Integre a entrega A antes.');
  process.exit(2);
}
const ASS = require('./assinatura-ritual.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const RAIZ = path.resolve(__dirname, '..');
const OBJ = path.join(RAIZ, 'assets', 'objetos');
const RITUAL = { 'drop-cap4-1': 'acaraje', 'drop-cap4-2': 'pano da costa', 'drop-cap4-3': 'buzios' };

function uris() {
  const out = [], vistos = new Set();
  function poe(uri, onde, grupo) {
    if (!uri || uri.indexOf('data:image/') !== 0 || vistos.has(uri)) return;
    vistos.add(uri); out.push({ uri, onde, grupo });
  }
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  const m = html.match(/var __ART=(\[[\s\S]*?\]);/);
  if (m) JSON.parse(m[1]).forEach((u, i) => poe(u, 'index.html __ART[' + i + ']', 'index.html'));
  let n = 0;
  html.replace(/"(data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+)"/g, function (_, u) { poe(u, 'index.html embutida #' + (n++), 'index.html'); return _; });
  fs.readdirSync(RAIZ).filter(f => /^pack-.*\.json$/.test(f)).sort().forEach(function (f) {
    const p = JSON.parse(fs.readFileSync(path.join(RAIZ, f), 'utf8'));
    const end = [];
    (p.itens || []).forEach(it => { end[it[1]] = (end[it[1]] ? end[it[1]] + '+' : '') + it[0].join('.'); });
    (p.arte || []).forEach((u, i) => poe(u, f + ' ' + (end[i] || 'arte[' + i + ']'), f));
  });
  return out;
}

(async () => {
  const lista = uris();
  const refs = Object.keys(RITUAL).map(n => ({
    nome: n, ritual: RITUAL[n],
    uri: 'data:image/webp;base64,' + fs.readFileSync(path.join(OBJ, n + '.webp')).toString('base64')
  }));
  const nav = await chromium.launch({ executablePath: chromiumPath() });
  const pg = await nav.newPage();
  await pg.goto('about:blank');
  await ASS.instalar(pg);
  const grades = [[], [], []];
  for (const a of ASS.ANGULOS) for (const corte of [false, true]) {
    if (a === 0 && corte) continue;
    const ls = await ASS.lumas(pg, refs.map(r => r.uri), a, corte);
    ls.forEach((l, ri) => grades[ri].push(l));
  }
  const bancos = grades.map(g => ASS.banco(g));
  const lum = await ASS.lumas(pg, lista.map(it => it.uri));
  await nav.close();

  const d = lum.map(function (l, i) {
    const v = ASS.vetor(l);
    const ds = bancos.map(b => ASS.distancia(v, b));
    return { d: Math.min.apply(null, ds), onde: lista[i].onde, grupo: lista[i].grupo };
  });
  d.sort((a, b) => a.d - b.d);

  const L = ASS.LIMIAR_INV;
  console.log('PISO DA ARTE LEGITIMA, medido por fora — ' + lista.length + ' imagens unicas, limiar ' + L);
  console.log('  piso  ................ ' + d[0].d.toFixed(1) + '  (folga ' + (d[0].d / L).toFixed(2) + 'x)  em ' + d[0].onde);
  [L, 22, 25, 30, 35].forEach(function (t) {
    console.log('  abaixo de ' + String(t).padStart(2) + ' ........... ' + String(d.filter(x => x.d < t).length).padStart(3) + ' de ' + lista.length);
  });
  console.log('\n  as 15 artes legitimas mais proximas de um ritual:');
  d.slice(0, 15).forEach((x, i) => console.log('   ' + String(i + 1).padStart(3) + '. ' + x.d.toFixed(1).padStart(6) + '  ' + x.onde));

  // piso POR PACOTE = piso POR CAPITULO. E a serie que diz o que um capitulo novo custa.
  const porGrupo = new Map();
  d.forEach(function (x) {
    const g = porGrupo.get(x.grupo);
    if (!g || x.d < g.d) porGrupo.set(x.grupo, { d: x.d, onde: x.onde, n: 0 });
  });
  d.forEach(x => { porGrupo.get(x.grupo).n++; });
  const gs = Array.from(porGrupo.entries()).map(([k, v]) => ({ pack: k, d: v.d, n: v.n, onde: v.onde })).sort((a, b) => a.d - b.d);
  console.log('\n  PISO POR PACOTE (= por capitulo) — com que velocidade a folga encolhe:');
  gs.forEach(g => console.log('   ' + g.d.toFixed(1).padStart(6) + '  ' + String(g.n).padStart(3) + ' img  ' + g.pack));
  const meds = gs.map(g => g.d).sort((a, b) => a - b);
  console.log('\n   pisos por capitulo: min ' + meds[0].toFixed(1) + ' · mediana ' +
    meds[Math.floor(meds.length / 2)].toFixed(1) + ' · max ' + meds[meds.length - 1].toFixed(1) +
    '  (' + meds.length + ' grupos)');
  console.log('   quantos grupos ja tem piso abaixo de 30: ' + meds.filter(x => x < 30).length + ' de ' + meds.length);
  console.log('   quantos grupos ja tem piso abaixo de ' + L + ': ' + meds.filter(x => x < L).length + ' de ' + meds.length);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
