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
// ── 05/09, terceira passada: O BURACO DO PARÁGRAFO ACIMA ESTÁ FECHADO ────────────────────
// O parágrafo anterior descreve o estado até 04/09 e fica de propósito: ele é o registro de
// por que existe uma SEGUNDA medida aqui, e o `QA_TABELA=1` reimprime os números dele na
// coluna CRUA. O que mudou é que a coluna crua deixou de ser a única.
//
// **A saída escolhida foi (b) do item `ritual-fora-do-drop-sem-lista-branca`: assinatura
// invariante, em `test/assinatura-ritual.js`** — forma em vez de tinta (corte na mancha,
// luma z-normalizada, gradiente normalizado, banco de orientações com negativo). As duas
// medidas rodam e uma imagem só passa se passar nas DUAS. Medido nesta mesma execução, nas
// 518 imagens da saída construída:
//
//   35 disfarces das três artes rituais    crua PEGA 12 · INVARIANTE PEGA **35**
//   teto dos 35 na invariante ............ 14,8  (brilho ×1,25 combinado com giro de 8°)
//   LIMIAR_INV .......................... 20
//   piso de arte LEGÍTIMA ............... 28,8  (`index.html` embutida #12)
//   janela .............................. **14,8 < 20 < 28,8**, separação 1,95×
//
// **(a) — "mexer no limiar" — foi medida e morreu, e o número é o contrário do que o nome
// diz.** Baixar o limiar faz o portão pegar MENOS; para pegar o brilho ×1,25 (14,0) seria
// preciso SUBIR o limiar acima de 14. E aí ele para: o piso legítimo da distância crua é
// 29,9 — medido em 05/09, e está em **MOB_B64** (`pack-palmares.json MOB_B64.drum.1`), quer
// dizer que a janela vale fora do lugar de drop também —, então um limiar de ~20 compraria
// brilho (14,0) e matiz (21,9) e nada mais: moldura +12% (28,8) encosta no piso, e as
// rotações (52 a 54) estão ACIMA do piso, onde limiar nenhum alcança. Duas linhas de treze,
// gastando a folga inteira.
//
// **O que a invariante custa, e não se esconde:** a folga dela para o lado do falso positivo
// é 1,44× (28,8 sobre 20), contra 2,5× da crua. Assinatura que vê menos diferença entre uma
// figura e o disfarce dela vê menos diferença entre figuras diferentes — é a mesma
// propriedade. Por isso ela ACRESCENTA e não substitui, e por isso o portão imprime quantas
// imagens legítimas moram abaixo de 30: é esse número que avisa se o acervo está apertando
// a folga. Em 05/09 são **5 de 518**.
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
//   QA_TABELA=1 node test/qa-ritual-varredura.js               # os 35 disfarces nas 2 medidas
//   QA_ACEITA_SAIDA_VELHA=1 node test/qa-ritual-varredura.js   # medir o artefato do disco

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ASS = require('./assinatura-ritual.js');   // a assinatura INVARIANTE, acrescentada em 05/09

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

  // ── SEGUNDA MEDIDA: a assinatura INVARIANTE (05/09) ────────────────────────────────────
  // A de cima compara TINTA e é a que tem a folga grande contra a cópia quase exata. Esta
  // compara FORMA e é a que fecha a classe do disfarce barato. As duas rodam, e uma imagem
  // só passa se passar nas duas — a nova NÃO substitui a velha, ver test/assinatura-ritual.js.
  await ASS.instalar(pg);
  const gradesRef = [[], [], []];
  for (const a of ASS.ANGULOS) for (const corte of [false, true]) {
    if (a === 0 && corte) continue;                       // girar 0° dentro ou fora do quadro é o mesmo
    const ls = await ASS.lumas(pg, refs.map(r => r.uri), a, corte);
    ls.forEach((l, ri) => gradesRef[ri].push(l));
  }
  const bancos = gradesRef.map(g => ASS.banco(g));
  const lumRepo = await ASS.lumas(pg, lista.map(it => it.uri));

  // CONTROLE DO INSTRUMENTO, fabricado a cada execução: três disfarces das próprias artes
  // rituais que ESTA assinatura promete pegar. Se subirem acima do limiar, o portão reprova a
  // si mesmo antes de reprovar o jogo (lição 2.8 do EQUIPE.md).
  const controle = [];
  for (let ri = 0; ri < refs.length; ri++) {
    const rec = await ASS.receitas(pg, refs[ri].uri, ASS.CONTROLE);
    const nomes = Object.keys(rec);
    const ls = await ASS.lumas(pg, nomes.map(k => rec[k]));
    nomes.forEach((k, i) => controle.push({ ritual: RITUAL[refs[ri].nome], disfarce: k, v: ASS.vetor(ls[i]), ri }));
  }

  // A TABELA INTEIRA dos disfarces sai sob demanda: ela fabrica 35 imagens por ritual e não
  // decide nada, então não paga o custo dentro do `npm test`.
  let tabela = null;
  if (process.env.QA_TABELA) {
    tabela = [];
    for (let ri = 0; ri < refs.length; ri++) {
      const rec = await ASS.receitas(pg, refs[ri].uri);
      const nomes = Object.keys(rec);
      const ls = await ASS.lumas(pg, nomes.map(k => rec[k]));
      const brutas = await pg.evaluate(async function (l) {   // a mesma assinatura CRUA da medida de cima
        const out = [];
        for (const u of l) {
          try {
            const im = new Image(); im.src = u; await im.decode();
            const c = document.createElement('canvas'); c.width = 16; c.height = 16;
            const x = c.getContext('2d');
            x.fillStyle = '#808080'; x.fillRect(0, 0, 16, 16);
            x.imageSmoothingEnabled = true;
            x.drawImage(im, 0, 0, 16, 16);
            const d = x.getImageData(0, 0, 16, 16).data;
            const r = []; for (let i = 0; i < d.length; i += 4) r.push(d[i], d[i + 1], d[i + 2]);
            out.push(r);
          } catch (e) { out.push(null); }
        }
        return out;
      }, nomes.map(k => rec[k]));
      nomes.forEach((k, i) => tabela.push({ ri, nome: k, v: ASS.vetor(ls[i]), bruta: brutas[i] }));
    }
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
  // ── A SEGUNDA MEDIDA, a INVARIANTE (05/09) ─────────────────────────────────────────────
  console.log('\n── assinatura INVARIANTE a brilho, matiz, moldura e giro ' +
    '(test/assinatura-ritual.js; limiar ' + ASS.LIMIAR_INV + ') ──');
  console.log('  banco de ' + bancos[0].length + ' orientações por ritual: ' + ASS.ANGULOS.length +
    ' ângulos × {com, sem corte de canto} × 8 simetrias × {luma, negativo}');

  // 1. o controle: o portão mede a si mesmo antes de medir o jogo
  let piorControle = -Infinity, piorNome = '';
  controle.forEach(function (c) {
    const d = ASS.distancia(c.v, bancos[c.ri]);
    if (d > piorControle) { piorControle = d; piorNome = c.ritual + ' ' + c.disfarce; }
  });
  ok(piorControle <= ASS.LIMIAR_INV, 'CONTROLE: os ' + controle.length + ' disfarces fabricados agora ' +
    'continuam sendo reconhecidos (pior ' + piorControle.toFixed(1) + ' ≤ ' + ASS.LIMIAR_INV + ', ' + piorNome + ')');

  // 2. a varredura propriamente dita
  let pisoInv = Infinity;
  const vRepo = lumRepo.map(l => ASS.vetor(l));
  // a matriz sai UMA vez: 518 × 3 × 560 comparações já são o grosso do tempo deste arquivo,
  // e recalculá-la para imprimir o número de vizinhos dobraria o custo à toa
  const dInv = vRepo.map(v => bancos.map(b => ASS.distancia(v, b)));
  refs.forEach(function (r, ri) {
    const linhas = [];
    for (let i = 0; i < lista.length; i++) linhas.push({ d: dInv[i][ri], onde: lista[i].onde, uri: lista[i].uri });
    linhas.sort((a, b) => a.d - b.d);
    console.log('  ' + RITUAL[r.nome] + ':');
    linhas.slice(0, 3).forEach(function (l, k) {
      const outros = vistos.get(l.uri) || [];
      console.log('     ' + (k + 1) + '. ' + l.d.toFixed(1).padStart(6) + '  ' + l.onde +
        (outros.length > 1 ? '  [+' + (outros.length - 1) + ' endereço(s) com a mesma arte]' : ''));
    });
    pisoInv = Math.min(pisoInv, linhas[0].d);
    ok(linhas[0].d > ASS.LIMIAR_INV, 'nenhuma arte carregada pelo jogo é ' + RITUAL[r.nome] +
      ' aclarado, tingido, emoldurado, girado ou negativado (mínimo ' + linhas[0].d.toFixed(1) +
      ' > ' + ASS.LIMIAR_INV + ', em ' + linhas[0].onde + ')');
  });
  // quantas artes legítimas moram perto do limiar — é o número que diz se a folga está
  // encolhendo com o acervo, e ele tem de ser lido junto com o verde, não em vez dele
  const perto = dInv.map(l => Math.min.apply(null, l)).filter(d => d < ASS.LIMIAR_INV * 1.5).length;
  console.log('  piso de arte LEGÍTIMA: ' + pisoInv.toFixed(1) + '  (limiar ' + ASS.LIMIAR_INV +
    ', folga ' + (pisoInv / ASS.LIMIAR_INV).toFixed(2) + '×) · ' + perto + ' de ' + lista.length +
    ' imagens abaixo de ' + (ASS.LIMIAR_INV * 1.5).toFixed(0) + ' — se este número crescer, a folga está acabando');

  if (tabela) {
    console.log('\n── OS 35 DISFARCES SOB AS DUAS MEDIDAS (QA_TABELA=1) ──');
    console.log('  ' + 'disfarce'.padEnd(34) + '   CRUA  INVAR   veredito');
    const nomes = tabela.filter(t => t.ri === 0).map(t => t.nome);
    let teto = -Infinity, tn = '';
    nomes.forEach(function (n) {
      const lin = tabela.filter(t => t.nome === n);
      const inv = Math.max.apply(null, lin.map(t => ASS.distancia(t.v, bancos[t.ri])));
      const cru = Math.max.apply(null, lin.map(function (t) {
        return t.bruta && ass[t.ri] ? Math.min(bruta(t.bruta, ass[t.ri].n), bruta(t.bruta, ass[t.ri].e)) : Infinity;
      }));
      if (inv > teto) { teto = inv; tn = n; }
      console.log('  ' + n.padEnd(34) + cru.toFixed(1).padStart(7) + inv.toFixed(1).padStart(7) + '   ' +
        (cru <= LIMIAR ? 'crua PEGA' : 'crua passa') + ' · ' + (inv <= ASS.LIMIAR_INV ? 'INVAR PEGA' : 'INVAR PASSA'));
    });
    console.log('\n  teto dos ' + nomes.length + ' disfarces na invariante: ' + teto.toFixed(1) + ' (' + tn + ')');
    console.log('  JANELA: ' + teto.toFixed(1) + ' < ' + ASS.LIMIAR_INV + ' < ' + pisoInv.toFixed(1) +
      '   (separação ' + (pisoInv / teto).toFixed(2) + '×)');
  } else {
    console.log('  (a tabela dos 35 disfarces sai com QA_TABELA=1 — ela fabrica 105 imagens e não decide nada)');
  }

  console.log('\nO QUE ESTA VARREDURA NÃO PEGA, e o resto está medido:');
  console.log('  · figura DIFERENTE do mesmo objeto — outro búzio, desenhado de novo, de outro ângulo.');
  console.log('    Nenhuma medida de pixel pega isso; quem pega é olho, e é por isso que em lugar de');
  console.log('    DROP a trava é LISTA BRANCA (test/salvador-drop-sem-ritual.js) e não lista negra.');
  console.log('  · a folga da invariante é mais apertada que a da crua (1,4× contra 2,5×): é o preço');
  console.log('    de ver menos diferença entre uma figura e o disfarce dela. As duas rodam juntas.');

  console.log(falhas ? '\n' + falhas + ' FALHA(S)' : '\ntudo verde');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
