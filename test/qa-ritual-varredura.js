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
// ── 04/09, segunda passada: ESPELHO NA DISTÂNCIA, e o que ele custa ──────────────────────
// Este arquivo é LISTA NEGRA por construção — fora do lugar de drop não existe tabela de arte
// aprovada, então aqui não há a lista branca que o `test/salvador-drop-sem-ritual.js` passou a
// usar. Sobra medir a figura contra o ritual, e a fuga medida é banal: uma figura dista **47,8**
// do próprio reflexo horizontal. Então a distância passou a ser `min(d(a,b), d(a,espelho(b)))`.
//
// **O que isso compra, medido, e é POUCO:** de treze disfarces do búzios, o espelho compra
// dois (e os dois são a mesma transformação). Continuam passando: espelho vertical 52,0 ·
// rodado 180° 52,2 · rodado 90° 53,9 · rodado 8° 33,7 · matiz +40° 21,9 · **brilho ×1,25 =
// 14,0** · moldura +12% 28,8. A mais barata nem é geometria. Este instrumento NÃO fecha a
// classe; ele fecha um caso e imprime o tamanho do que sobra.
//
// **O que isso custa, medido nas 518 imagens:** o piso (a menor distância encontrada até um
// ritual em todo o repositório) cai de 29,9 para o número que este arquivo imprime nas DUAS
// colunas. Enquanto a coluna do espelho ficar bem acima do limiar, o espelho não fabricou
// falso positivo nenhum. É por isso que ele imprime as duas e não só a que decide.
//
// ── O QUE ESTE ARQUIVO LÊ, e por que a frase importa (04/09, achado A3 do QA) ─────────────
// **Ele lê a SAÍDA**: o `index.html` da raiz mais os `pack-*.json` da raiz. Não lê `src/`.
// O portão irmão (`test/salvador-drop-sem-ritual.js`) lê o contrário — a FONTE `src/jogo.ts`
// mais os pacotes. Rodados a mão **sem `npm run build`**, os dois mentem, e o QA pagou as
// duas pontas na mesma rodada: esta varredura saiu **exit 0** com búzios já injetado no `src`,
// porque o `index.html` do disco ainda era o de antes.
//
// Desde 04/09 isso deixou de ser conselho: `test/saida-fresca.js` **recusa medir** (exit 2) se
// o `index.html` for mais velho que qualquer fonte de `src/`. Para medir mesmo assim os bytes
// que estão no disco — uso legítimo que o `CLAUDE.md` §6 nomeia —, `QA_ACEITA_SAIDA_VELHA=1`.
// Dentro do `npm test` nada disso dispara: o build é o primeiro elo da corrente.
//
//   node test/qa-ritual-varredura.js
//   QA_LIMIAR=12 node test/qa-ritual-varredura.js
//   QA_ACEITA_SAIDA_VELHA=1 node test/qa-ritual-varredura.js   # medir o artefato do disco

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

// A saída no disco tem de corresponder à fonte, senão este instrumento mede o artefato de
// ontem e diz verde. Recusa com exit 2; a porta com nome é QA_ACEITA_SAIDA_VELHA=1.
require('./saida-fresca.js').cobrar(
  'test/qa-ritual-varredura.js',
  ['index.html'].concat(fs.readdirSync(RAIZ).filter(f => /^pack-.*\.json$/.test(f)).sort()),
  ['src/jogo.ts', 'src/index.html', 'src/estilo.css']
);

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
  console.log('ESTE INSTRUMENTO LÊ A SAÍDA CONSTRUÍDA (index.html + pack-*.json), não `src/`.');
  console.log('  o portão irmão test/salvador-drop-sem-ritual.js lê a FONTE (src/jogo.ts) + pacotes.');
  console.log('  sem `npm run build` antes, os dois medem coisas de épocas diferentes.');

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
          const ass = function (esp) {
            const c = document.createElement('canvas'); c.width = 16; c.height = 16;
            const x = c.getContext('2d');
            x.fillStyle = '#808080'; x.fillRect(0, 0, 16, 16);
            x.imageSmoothingEnabled = true;
            if (esp) { x.translate(16, 0); x.scale(-1, 1); }
            x.drawImage(im, 0, 0, 16, 16);
            const d = x.getImageData(0, 0, 16, 16).data;
            const r = [];
            for (let i = 0; i < d.length; i += 4) { r.push(d[i], d[i + 1], d[i + 2]); }
            return r;
          };
          v = { n: ass(false), e: ass(true) };
        } catch (e) { v = null; }
        out.push(v);
      }
      return out;
    }, alvos.slice(k, k + passo).map(a => ({ uri: a.uri })));
    parte.forEach(p => ass.push(p));
  }
  await nav.close();

  function bruta(a, b) {
    if (!a || !b) return Infinity;
    let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
    return s / a.length;
  }
  // simples: figura contra figura. espelho: cega ao reflexo horizontal — é a que DECIDE.
  const dSimples = (a, b) => (a && b ? bruta(a.n, b.n) : Infinity);
  const dEspelho = (a, b) => (a && b ? Math.min(bruta(a.n, b.n), bruta(a.n, b.e)) : Infinity);

  const naoDecodificou = alvos.filter((a, i) => !ass[i]);
  ok(naoDecodificou.length === 0, naoDecodificou.length + ' imagem(ns) não decodificaram (uma que não decodifica é uma que não foi medida)');

  console.log('\nmenor distância do REPOSITÓRIO INTEIRO até cada arte ritual');
  console.log('(duas colunas: SIMPLES / com ESPELHO — a segunda decide; a primeira mostra o que o espelho custou)');
  let pisoS = Infinity, pisoE = Infinity;
  refs.forEach(function (r, ri) {
    const linhas = [];
    for (let i = refs.length; i < alvos.length; i++) {
      linhas.push({ s: dSimples(ass[i], ass[ri]), d: dEspelho(ass[i], ass[ri]), onde: alvos[i].nome, uri: alvos[i].uri });
    }
    linhas.sort((a, b) => a.d - b.d);
    console.log('  ' + RITUAL[r.nome] + ' (' + r.nome + '):');
    linhas.slice(0, 3).forEach(function (l, k) {
      const outros = vistos.get(l.uri) || [];
      console.log('     ' + (k + 1) + '. ' + l.s.toFixed(1).padStart(6) + ' / ' + l.d.toFixed(1).padStart(6) + '  ' + l.onde +
        (outros.length > 1 ? '  [+' + (outros.length - 1) + ' endereço(s) com a mesma arte]' : ''));
    });
    pisoS = Math.min(pisoS, linhas.reduce((m, l) => Math.min(m, l.s), Infinity));
    pisoE = Math.min(pisoE, linhas[0].d);
    ok(linhas[0].d > LIMIAR, 'nenhuma arte carregada pelo jogo é ' + RITUAL[r.nome] +
      ' nem o reflexo dele (mínimo ' + linhas[0].d.toFixed(1) + ' > ' + LIMIAR + ', em ' + linhas[0].onde + ')');
  });

  console.log('\no que o espelho custou em margem, nas ' + lista.length + ' imagens:');
  console.log('  piso simples ' + pisoS.toFixed(1) + '  →  piso com espelho ' + pisoE.toFixed(1) +
    '   (perdeu ' + (pisoS - pisoE).toFixed(1) + '; limiar ' + LIMIAR + ')');
  // Esta linha só faz sentido quando NÃO há ritual no repositório: aí a queda do piso mede o
  // preço do espelho em arte legítima. Com um ritual dentro, a queda é o achado, não o custo —
  // e afirmar "falso positivo" sobre um positivo verdadeiro seria o portão mentindo na saída.
  if (falhas === 0) {
    ok(pisoE > LIMIAR, 'o espelho não fabricou falso positivo: a arte legítima mais próxima de um ritual ' +
      'continua a ' + pisoE.toFixed(1) + ' do limiar ' + LIMIAR + ' (folga ' + (pisoE / LIMIAR).toFixed(1) + '×)');
  } else {
    console.log('  (a queda acima é o RITUAL encontrado, não o custo do espelho — o custo em arte');
    console.log('   legítima só se lê quando a varredura está verde)');
  }
  console.log('\nO QUE ESTA VARREDURA NÃO PEGA, e está medido (test/qa-ritual-disfarce.js):');
  console.log('  espelho vertical 52,0 · rodado 180° 52,2 · rodado 90° 53,9 · rodado 8° 33,7');
  console.log('  matiz +40° 21,9 · BRILHO ×1,25 = 14,0 · moldura +12% 28,8   — todos acima de ' + LIMIAR + '.');
  console.log('  Em lugar de DROP isso está fechado por LISTA BRANCA (test/salvador-drop-sem-ritual.js).');
  console.log('  Em MOB_B64/ICONE_B64/FRENTE_B64/GENTE_EP_B64 continua aberto: não há lista branca ali.');

  console.log(falhas ? '\n' + falhas + ' FALHA(S)' : '\ntudo verde');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
