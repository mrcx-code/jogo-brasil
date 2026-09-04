// NENHUM OBJETO RITUAL SOBREVIVE COMO DROP — o portão do §2.4 item 5 do CLAUDE.md.
//
// A regra é categórica e sem exceção: "objeto ritual não é colecionável — entra como fala,
// nunca como drop". SALVADOR a violava: acarajé, pano da costa e búzios caíam no chão da rua
// para o dedo recolher, e entravam em `S.energia`/`S.recursos` como qualquer outro item. O
// búzio é instrumento de adivinhação no candomblé; o acarajé é comida de santo (é a ficha do
// IPHAN que diz isso); o pano da costa é o alaká das casas de culto. O capítulo VIZINHO — O
// CAIS — já tinha RECUSADO búzios como item pela MESMA regra: mesmo objeto, mesma regra,
// decisão oposta. Auditoria §2 dos treze capítulos, 03/09; quatro refutações adversariais
// caíram; o dono decidiu TROCA em 03/09.
//
// POR QUE ESTE ARQUIVO EXISTE, e não bastava o commit: a troca é de UMA LINHA numa lista de
// nomes de arquivo (`DROPS` em test/inline-objetos.js). Reverter sem querer é trivial, e o
// jogo não reclama — ele desenha o que estiver na lista. Sem portão, a regra volta a valer
// só enquanto alguém lembrar dela.
//
// O QUE ELE COBRA:
//   1. as três artes rituais NÃO aparecem em drop nenhum, de capítulo nenhum (mover búzios
//      para outro capítulo é a mesma violação com outro endereço);
//   2. os três drops de SALVADOR SÃO os três objetos de trabalho de rua aprovados;
//   3. os três VERBETES do glossário continuam de pé. Isto não é enfeite: a regra manda tirar
//      da MÃO, nunca calar — "entra como fala". Apagar ACARAJÉ, PANO DA COSTA ou BÚZIOS do
//      glossário passaria neste teste pelo item 1 e seria o erro oposto, então o item 3 é a
//      outra mandíbula da mesma tenaz.
//
// COMO ELE NÃO SE DEIXA ENGANAR: compara PIXEL DECODIFICADO, nunca bytes. O bloco embutido
// passa pelo `test/tirar-icc.js` (que muda os bytes e não muda um pixel), e uma regravação em
// outra qualidade mudaria o hash sem mudar a figura. A assinatura é a imagem reduzida a 16x16
// sobre fundo cinza; a distância entre duas figuras diferentes deste jogo é de dezenas, a
// distância de uma figura para ela mesma regravada é de unidades — o log imprime a matriz
// inteira, então a folga do limiar é visível e não jurada.
//
// O ÍNDICE DE SALVADOR NÃO É CHUTADO: sai do `arteCap` que a própria época declara em EPOCAS.
// (É 2, e não 3 como o sufixo `cap4` dos arquivos sugere — o sufixo é o número do PEDIDO na
// mesa, não o do capítulo.)
//
//   node test/salvador-drop-sem-ritual.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}

const RAIZ = path.resolve(__dirname, '..');
const FONTE = path.join(RAIZ, 'src', 'jogo.ts');
const OBJ = path.join(RAIZ, 'assets', 'objetos');

// As três artes que NÃO podem ser o que a mão recolhe. Ficam no repositório de propósito:
// são o registro do que foi trocado, e são a referência contra a qual este portão mede.
const RITUAL = { 'drop-cap4-1': 'acarajé', 'drop-cap4-2': 'pano da costa', 'drop-cap4-3': 'búzios' };
// O que SALVADOR passa a deixar no chão, na ordem de DROP_IDX (smog / barrel / cash).
const TRABALHO = ['drop-cap4-tabuleiro', 'drop-cap4-balde', 'drop-cap4-trouxa'];
// Verbetes que a troca NÃO pode levar junto.
const VERBETES = ['ACARAJÉ', 'PANO DA COSTA', 'BÚZIOS'];
// Distância abaixo da qual duas assinaturas são "a mesma figura". Calibrado com a matriz que
// este próprio script imprime: mesma figura ≈ 0, figuras diferentes ≥ 40 neste conjunto.
const LIMIAR = 12;

let falhas = 0;
function ok(cond, msg) { console.log((cond ? '  ok   ' : '  FALHA ') + msg); if (!cond) falhas++; }

function semComentario(txt) {
  return txt.split('\n').map(function (l) {
    const i = l.indexOf('//');
    return i >= 0 ? l.slice(0, i) : l;
  }).join('\n');
}

(async () => {
  const src = fs.readFileSync(FONTE, 'utf8');

  // ---- 1. de quem é o bloco de arte de SALVADOR, lido de EPOCAS ----
  const limpo = semComentario(src);
  const pos = limpo.indexOf('id: "salvador"');
  if (pos < 0) { console.error('não achei a época salvador em EPOCAS'); process.exit(1); }
  const m = limpo.slice(pos, pos + 4000).match(/arteCap:\s*(\d+)/);
  if (!m) { console.error('a época salvador não declara arteCap'); process.exit(1); }
  const IDX = parseInt(m[1], 10);
  console.log('SALVADOR declara arteCap ' + IDX + ' — é este o índice de DROP_B64 que ela usa');

  // ---- 2. o bloco DROP_B64, do jeito que o gerador o deixa ----
  const bloco = src.match(/\/\*DROP_B64_START[\s\S]*?const DROP_B64 = (\[[\s\S]*?\n\];)\r?\n\/\*DROP_B64_END\*\//);
  if (!bloco) { console.error('marcadores DROP_B64 não encontrados em src/jogo.ts'); process.exit(1); }
  const DROP = new Function('return ' + bloco[1].replace(/;$/, ''))();
  console.log('DROP_B64: ' + DROP.length + ' listas — ' + DROP.map(l => l.length).join('/') + ' arte(s) por capítulo');

  // ---- 3. o mesmo, do PACOTE que o jogador baixa (é ele que chega no aparelho) ----
  let doPack = null;
  const arqPack = path.join(RAIZ, 'pack-salvador.json');
  if (fs.existsSync(arqPack)) {
    const p = JSON.parse(fs.readFileSync(arqPack, 'utf8'));
    const achados = [];
    (p.itens || []).forEach(function (it) {
      const c = it[0];
      if (c && c[0] === 'DROP_B64' && c[1] === IDX) achados[c[2]] = p.arte[it[1]];
    });
    if (achados.length) doPack = achados;
  }
  console.log('pack-salvador.json: ' + (doPack ? doPack.length + ' drops do bloco ' + IDX : 'sem drops (não construído?)'));

  // ---- 4. assinatura por PIXEL ----
  const nav = await chromium.launch({ executablePath: chromiumPath() });
  const pg = await nav.newPage();
  await pg.goto('about:blank');

  const alvos = [];
  for (const n of Object.keys(RITUAL)) alvos.push({ nome: 'RITUAL:' + n, uri: uriDe(n) });
  for (const n of TRABALHO) alvos.push({ nome: 'ok:' + n, uri: uriDe(n) });
  DROP.forEach(function (lista, i) {
    lista.forEach(function (d, j) { alvos.push({ nome: 'src DROP_B64[' + i + '][' + j + ']', uri: d }); });
  });
  if (doPack) doPack.forEach(function (d, j) { alvos.push({ nome: 'pack DROP_B64[' + IDX + '][' + j + ']', uri: d }); });

  function uriDe(n) {
    return 'data:image/webp;base64,' + fs.readFileSync(path.join(OBJ, n + '.webp')).toString('base64');
  }

  const assinaturas = await pg.evaluate(async function (lista) {
    const out = [];
    for (const it of lista) {
      const im = new Image(); im.src = it.uri; await im.decode();
      const c = document.createElement('canvas'); c.width = 16; c.height = 16;
      const x = c.getContext('2d');
      x.fillStyle = '#808080'; x.fillRect(0, 0, 16, 16);   // composto: alfa 0 tem RGB indefinido
      x.imageSmoothingEnabled = true;
      x.drawImage(im, 0, 0, 16, 16);
      const d = x.getImageData(0, 0, 16, 16).data;
      const v = [];
      for (let i = 0; i < d.length; i += 4) { v.push(d[i], d[i + 1], d[i + 2]); }
      out.push(v);
    }
    return out;
  }, alvos);
  await nav.close();

  function dist(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
    return s / a.length;
  }
  const idxDe = {};
  alvos.forEach(function (a, i) { idxDe[a.nome] = i; });

  // A MATRIZ, impressa: é ela que mostra que o limiar tem folga, em vez de eu afirmar que tem.
  const refs = alvos.filter(a => /^RITUAL:|^ok:/.test(a.nome));
  const testados = alvos.filter(a => /^src |^pack /.test(a.nome));
  console.log('\ndistância de cada drop até cada referência (média por canal, 0 = a mesma figura):');
  console.log('  ' + ' '.repeat(26) + refs.map(r => r.nome.replace('RITUAL:drop-cap4-', 'RIT-').replace('ok:drop-cap4-', 'ok-').padStart(10)).join(''));
  testados.forEach(function (t) {
    const linha = refs.map(r => dist(assinaturas[idxDe[t.nome]], assinaturas[idxDe[r.nome]]).toFixed(1).padStart(10)).join('');
    console.log('  ' + t.nome.padEnd(26) + linha);
  });

  console.log('\nportão:');
  // (1) nenhum drop, de capítulo nenhum, é uma das três artes rituais
  testados.forEach(function (t) {
    Object.keys(RITUAL).forEach(function (n) {
      const d = dist(assinaturas[idxDe[t.nome]], assinaturas[idxDe['RITUAL:' + n]]);
      ok(d > LIMIAR, t.nome + ' não é ' + RITUAL[n] + ' (distância ' + d.toFixed(1) + ' > ' + LIMIAR + ')');
    });
  });
  // (2) os três de SALVADOR são os três objetos de trabalho aprovados, na ordem
  ok(DROP[IDX] && DROP[IDX].length === TRABALHO.length,
    'SALVADOR tem ' + (DROP[IDX] ? DROP[IDX].length : 0) + ' drops (esperado ' + TRABALHO.length + ')');
  TRABALHO.forEach(function (n, j) {
    const alvo = 'src DROP_B64[' + IDX + '][' + j + ']';
    if (idxDe[alvo] === undefined) { ok(false, 'falta ' + alvo); return; }
    const d = dist(assinaturas[idxDe[alvo]], assinaturas[idxDe['ok:' + n]]);
    ok(d <= LIMIAR, alvo + ' é ' + n + ' (distância ' + d.toFixed(1) + ')');
  });
  if (doPack) TRABALHO.forEach(function (n, j) {
    const alvo = 'pack DROP_B64[' + IDX + '][' + j + ']';
    if (idxDe[alvo] === undefined) { ok(false, 'falta ' + alvo + ' no pacote'); return; }
    const d = dist(assinaturas[idxDe[alvo]], assinaturas[idxDe['ok:' + n]]);
    ok(d <= LIMIAR, alvo + ' é ' + n + ' no pacote que o jogador baixa (distância ' + d.toFixed(1) + ')');
  });
  // (3) a fala continua: os verbetes não foram apagados junto
  VERBETES.forEach(function (v) {
    ok(src.indexOf('t: "' + v + '"') >= 0, 'o verbete ' + v + ' continua no glossário (a regra tira da mão, não cala)');
  });

  console.log(falhas ? '\n' + falhas + ' FALHA(S)' : '\ntudo verde');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
