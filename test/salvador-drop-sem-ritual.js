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
// ────────────────────────────────────────────────────────────────────────────────────────
// A VIRADA DE 04/09: DE LISTA NEGRA PARA LISTA BRANCA. Leia isto antes de mexer.
//
// A versão anterior perguntava "este drop é uma das três artes rituais?". Isso é lista NEGRA,
// e lista negra só pega o que ela já conhece. O QA fabricou a fuga e ela é banal: **búzios
// ESPELHADO** posto em `DROP_B64[3]` — o bloco que dez capítulos vestem — passava a suíte
// inteira com exit 0, porque a distância de uma figura até o próprio reflexo é 47,8 e o
// limiar é 12.
//
// Este arquivo passou a perguntar o contrário: **"este drop É uma das artes aprovadas?"**.
// Toda arte que ocupa um lugar de drop, em qualquer bloco, na fonte E em qualquer pacote,
// tem de ser identificada como uma das oito da tabela `APROVADOS` abaixo. Não é preciso
// reconhecer o disfarce — basta não reconhecer o aprovado.
//
// A DIFERENÇA ESTÁ MEDIDA, e a tabela abaixo é a SAÍDA de `node test/qa-ritual-disfarce.js`
// (04/09; treze disfarces das três artes rituais). Ela não é citada de memória: rode e
// compare. Nas duas primeiras colunas o veredito é do PIOR dos três rituais; na terceira é
// do disfarce que mais se APROXIMA de uma arte aprovada, que é o pior caso da lista branca.
//
//   disfarce do ritual       lista negra   lista negra+espelho   LISTA BRANCA
//   idêntico                  0,0 PEGO        0,0 PEGO           33,4 PEGO
//   recomprimido q=0,50       1,8 PEGO        1,8 PEGO           33,4 PEGO
//   aparado na mancha         1,2 PEGO        1,2 PEGO           33,3 PEGO
//   reduzido a 60%            9,1 PEGO        9,1 PEGO           32,5 PEGO
//   ESPELHADO horizontal     47,8 passa       2,0 PEGO           34,6 PEGO
//   espelho + aparado        47,8 passa       2,0 PEGO           34,6 PEGO
//   espelhado vertical       53,1 passa      52,0 passa          35,2 PEGO
//   rodado 180°              52,2 passa      52,2 passa          34,9 PEGO
//   rodado 90°               53,9 passa      53,9 passa          34,4 PEGO
//   rodado 8°                33,7 passa      33,7 passa          31,7 PEGO
//   paleta: matiz +40°       21,9 passa      21,9 passa          37,2 PEGO
//   paleta: brilho ×1,25     14,0 passa      14,0 passa          35,8 PEGO
//   moldura +12% (recuado)   28,8 passa      28,8 passa          31,5 PEGO
//
// **A saída do espelho — `min(d(a,b), d(a,espelho(b)))` — foi medida e RECUSADA como conserto
// principal: ela é remendo de CASO, não de CLASSE.** Compra 2 das 13 linhas (e as duas são a
// mesma transformação). Sete continuam passando, e a mais barata de todas nem é geometria:
// **brilho ×1,25 mede 14,0** — um filtro, nenhum recorte, a mesma figura na tela. Quem
// quisesse devolver o búzio ao chão contornaria o espelho sem saber que existia.
//
// A lista branca fecha as treze com folga mínima de **31,5** contra um limiar de 12.
//
// A JANELA DA LISTA BRANCA, MEDIDA NESTA MESMA EXECUÇÃO (o portão a reimprime e a COBRA —
// veja o bloco "a janela" no fim; se ela fechar, o portão reprova a si mesmo antes de
// reprovar o jogo):
//
//   · pior distância de um drop embutido até o arquivo que ele deve ser ....... 0,00
//     (a esteira embute o WebP como está; mesmo se passasse a reencodar, o pior caso
//      medido dessa família é "reduzido a 60%" = 9,1, ainda dentro do limiar)
//   · menor distância de um drop até uma arte aprovada ERRADA ................. 27,0
//     (`drop-broto` × `drop-cap3-1`, o par mais parecido das oito)
//   · menor distância de um disfarce de ritual até qualquer arte aprovada ..... 31,5
//
//   janela: **0,00 < 12 < 27,0**. Folga de 2,2× para o lado do falso positivo.
//
// O NÚMERO ANTIGO DESTE CABEÇALHO ERA FALSO e fica registrado: dizia "figuras diferentes ≥
// 40" e citava 33,4 como folga. 33,4 era a distância do par pano-da-costa/tabuleiro-novo —
// não era a folga de nada. A folga real da lista NEGRA era **9,1 < 12 < 29,9** (QA, 04/09).
//
// O QUE ESTE PORTÃO NÃO COBRE, e não adianta ele fingir que cobre:
//   · **só olha lugar de DROP.** `MOB_B64`, `ICONE_B64`, `FRENTE_B64` e `GENTE_EP_B64` não
//     têm lista branca possível aqui — são centenas de artes sem tabela de aprovação. Ali
//     sobra a lista negra, com o buraco medido acima (brilho ×1,25 = 14,0). Quem varre esses
//     blocos é `test/qa-ritual-varredura.js`, e ele herda o mesmo buraco.
//   · **não sabe se o jogo FALA dos três.** Ver a ressalva A do Diário de 03/09.
//   · **capítulo novo com drop novo deixa este arquivo VERMELHO** até alguém escrever a arte
//     em `APROVADOS`. Isso é de propósito e é o preço da lista branca: quem acrescenta um
//     colecionável é obrigado a passar os olhos na lista do que pode ser colecionável.
// ────────────────────────────────────────────────────────────────────────────────────────
//
// COMO ELE NÃO SE DEIXA ENGANAR: compara PIXEL DECODIFICADO, nunca bytes. O bloco embutido
// passa pelo `test/tirar-icc.js` (que muda os bytes e não muda um pixel), e uma regravação em
// outra qualidade mudaria o hash sem mudar a figura. A assinatura é a imagem reduzida a 16x16
// sobre fundo cinza; o log imprime a matriz inteira, então a folga é visível e não jurada.
//
// A TABELA `APROVADOS` É DESTE ARQUIVO DE PROPÓSITO, e não é duplicação preguiçosa: ler a
// lista do gerador (`DROPS`, em test/inline-objetos.js) faria o portão comparar a saída do
// gerador com a entrada do gerador — tautologia. A troca que este portão existe para pegar
// é EXATAMENTE uma linha daquela lista. Duas declarações independentes é o que dá ao portão
// alguma coisa para discordar.
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

// A LISTA BRANCA: a única arte que pode ocupar um lugar de drop, por bloco e por posição.
// Um bloco por capítulo-de-arte; a ordem é a de DROP_IDX. Acrescentar arte de drop passa
// obrigatoriamente por aqui — e é para obrigar isso que a lista existe.
const APROVADOS = [
  ['drop-semente', 'drop-broto', 'drop-peixe'],                          // 0 · a mata
  ['drop-cap2-1'],                                                        // 1 · (palmares veste)
  ['drop-cap4-tabuleiro', 'drop-cap4-balde', 'drop-cap4-trouxa'],         // 2 · SALVADOR: trabalho de rua
  ['drop-cap3-1']                                                         // 3 · (dez capítulos vestem)
];
// As três artes que NÃO podem ser o que a mão recolhe. Ficam no repositório de propósito:
// são o registro do que foi trocado, e são a referência contra a qual este portão mede.
const RITUAL = { 'drop-cap4-1': 'acarajé', 'drop-cap4-2': 'pano da costa', 'drop-cap4-3': 'búzios' };
// O que SALVADOR passa a deixar no chão, na ordem de DROP_IDX (smog / barrel / cash).
const TRABALHO = ['drop-cap4-tabuleiro', 'drop-cap4-balde', 'drop-cap4-trouxa'];
// Verbetes que a troca NÃO pode levar junto.
const VERBETES = ['ACARAJÉ', 'PANO DA COSTA', 'BÚZIOS'];
// Distância abaixo da qual duas assinaturas são "a mesma figura". A janela medida que o
// sustenta está no cabeçalho e é recobrada no fim deste arquivo: 0,00 < 12 < 27,0.
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

  // ---- 3. o mesmo, de TODOS os pacotes (é o pacote que chega no aparelho) ----
  // A versão anterior abria só `pack-salvador.json`. Isso deixava DROP_B64[1] (pack-palmares)
  // e DROP_B64[3] (pack-hoje) — justamente o bloco que dez capítulos vestem — sem portão
  // nenhum do lado do que o jogador baixa.
  const doPack = [];        // { arq, i, j, uri }
  const arqsPack = fs.readdirSync(RAIZ).filter(f => /^pack-.*\.json$/.test(f)).sort();
  arqsPack.forEach(function (f) {
    const p = JSON.parse(fs.readFileSync(path.join(RAIZ, f), 'utf8'));
    (p.itens || []).forEach(function (it) {
      const c = it[0];
      if (c && c[0] === 'DROP_B64') doPack.push({ arq: f, i: c[1], j: c[2], uri: p.arte[it[1]] });
    });
  });
  console.log('pacotes: ' + arqsPack.length + ' arquivos, ' + doPack.length + ' endereço(s) de DROP_B64 — ' +
    (doPack.map(d => d.arq.replace(/^pack-|\.json$/g, '') + '[' + d.i + '][' + d.j + ']').join(' ') || '(nenhum; construiu?)'));

  // ---- 4. assinatura por PIXEL, normal e espelhada ----
  const nav = await chromium.launch({ executablePath: chromiumPath() });
  const pg = await nav.newPage();
  await pg.goto('about:blank');

  function uriDe(n) {
    return 'data:image/webp;base64,' + fs.readFileSync(path.join(OBJ, n + '.webp')).toString('base64');
  }

  const alvos = [];
  const nomesAprovados = [].concat.apply([], APROVADOS);
  for (const n of Object.keys(RITUAL)) alvos.push({ nome: 'RITUAL:' + n, uri: uriDe(n) });
  for (const n of nomesAprovados) alvos.push({ nome: 'ok:' + n, uri: uriDe(n) });
  DROP.forEach(function (lista, i) {
    lista.forEach(function (d, j) { alvos.push({ nome: 'src DROP_B64[' + i + '][' + j + ']', uri: d }); });
  });
  doPack.forEach(function (d) {
    alvos.push({ nome: d.arq.replace(/^pack-|\.json$/g, '') + ' DROP_B64[' + d.i + '][' + d.j + ']', uri: d.uri, i: d.i, j: d.j, pack: true });
  });

  const assinaturas = await pg.evaluate(async function (lista) {
    const out = [];
    for (const it of lista) {
      const im = new Image(); im.src = it.uri; await im.decode();
      function ass(esp) {
        const c = document.createElement('canvas'); c.width = 16; c.height = 16;
        const x = c.getContext('2d');
        x.fillStyle = '#808080'; x.fillRect(0, 0, 16, 16);   // composto: alfa 0 tem RGB indefinido
        x.imageSmoothingEnabled = true;
        if (esp) { x.translate(16, 0); x.scale(-1, 1); }
        x.drawImage(im, 0, 0, 16, 16);
        const d = x.getImageData(0, 0, 16, 16).data;
        const v = [];
        for (let i = 0; i < d.length; i += 4) { v.push(d[i], d[i + 1], d[i + 2]); }
        return v;
      }
      out.push({ n: ass(false), e: ass(true) });
    }
    return out;
  }, alvos);
  await nav.close();

  function bruta(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
    return s / a.length;
  }
  const idxDe = {};
  alvos.forEach(function (a, i) { idxDe[a.nome] = i; });
  // distância simples: figura contra figura.
  function dist(x, y) { return bruta(assinaturas[idxDe[x]].n, assinaturas[idxDe[y]].n); }
  // distância cega ao espelho horizontal — usada só na lista NEGRA, e ela sozinha NÃO
  // resolve nada (ver a tabela do cabeçalho: compra 2 dos 13 disfarces). Está aqui porque
  // custa uma linha e a lista negra é tudo o que sobra fora do lugar de drop.
  function distEsp(x, y) {
    return Math.min(bruta(assinaturas[idxDe[x]].n, assinaturas[idxDe[y]].n),
      bruta(assinaturas[idxDe[x]].n, assinaturas[idxDe[y]].e));
  }

  // A MATRIZ, impressa: é ela que mostra que o limiar tem folga, em vez de eu afirmar que tem.
  const refs = alvos.filter(a => /^RITUAL:|^ok:/.test(a.nome));
  const testados = alvos.filter(a => / DROP_B64\[/.test(a.nome));
  console.log('\ndistância de cada drop até cada referência (média por canal, 0 = a mesma figura):');
  console.log('  ' + ' '.repeat(30) + refs.map(r => r.nome.replace('RITUAL:drop-cap4-', 'RIT-').replace(/^ok:drop-(cap\d-)?/, '').slice(0, 9).padStart(10)).join(''));
  testados.forEach(function (t) {
    const linha = refs.map(r => dist(t.nome, r.nome).toFixed(1).padStart(10)).join('');
    console.log('  ' + t.nome.padEnd(30) + linha);
  });

  console.log('\nportão:');

  // ---------- (1) LISTA BRANCA: todo lugar de drop é uma arte APROVADA ----------
  // Esta é a mandíbula que morde disfarce, e ela não precisa reconhecer o disfarce: um búzio
  // espelhado, rodado, aclarado ou recortado continua não sendo `drop-cap3-1`.
  ok(DROP.length === APROVADOS.length,
    'DROP_B64 tem ' + DROP.length + ' bloco(s), a lista branca declara ' + APROVADOS.length +
    ' (bloco novo sem arte aprovada é vermelho de propósito)');
  let piorIdentidade = 0, menorErrada = Infinity, ondeErrada = '';
  function cobrarLugar(nome, i, j) {
    const esperado = APROVADOS[i] && APROVADOS[i][j];
    if (!esperado) { ok(false, nome + ' não tem arte aprovada declarada para este lugar'); return; }
    const d = dist(nome, 'ok:' + esperado);
    piorIdentidade = Math.max(piorIdentidade, d);
    ok(d <= LIMIAR, nome + ' É a arte aprovada ' + esperado + ' (distância ' + d.toFixed(1) + ' ≤ ' + LIMIAR + ')');
    // e não é nenhuma das outras: mede a separação da própria lista branca
    nomesAprovados.forEach(function (n) {
      if (n === esperado) return;
      const v = dist(nome, 'ok:' + n);
      if (v < menorErrada) { menorErrada = v; ondeErrada = nome + ' × ' + n; }
    });
  }
  DROP.forEach(function (lista, i) {
    ok(APROVADOS[i] && lista.length === APROVADOS[i].length,
      'DROP_B64[' + i + '] tem ' + lista.length + ' arte(s), a lista branca declara ' + ((APROVADOS[i] || []).length));
    lista.forEach(function (_, j) { cobrarLugar('src DROP_B64[' + i + '][' + j + ']', i, j); });
  });
  doPack.forEach(function (d) {
    cobrarLugar(d.arq.replace(/^pack-|\.json$/g, '') + ' DROP_B64[' + d.i + '][' + d.j + ']', d.i, d.j);
  });
  // o pacote que o jogador baixa não pode estar VAZIO de drops enquanto a fonte tem: seria
  // portão que passa por não ter o que medir.
  const blocosNaFonte = DROP.map((l, i) => (l.length ? i : -1)).filter(i => i >= 0);
  const blocosNoPack = Array.from(new Set(doPack.map(d => d.i)));
  ok(blocosNoPack.length > 0, 'os pacotes trazem drop de ' + blocosNoPack.length + ' bloco(s) (fonte tem ' + blocosNaFonte.length + ')');

  // ---------- (2) LISTA NEGRA: e nenhum deles é uma das três artes rituais ----------
  // Redundante com (1) para DROP_B64, de propósito: dá a mensagem que NOMEIA o objeto, e
  // sobrevive a alguém que estique `APROVADOS` sem ler o §2.
  testados.forEach(function (t) {
    Object.keys(RITUAL).forEach(function (n) {
      const d = distEsp(t.nome, 'RITUAL:' + n);
      ok(d > LIMIAR, t.nome + ' não é ' + RITUAL[n] + ' nem o reflexo dele (distância ' + d.toFixed(1) + ' > ' + LIMIAR + ')');
    });
  });

  // ---------- (3) SALVADOR continua sendo os três objetos de trabalho, na ordem ----------
  ok(APROVADOS[IDX] && APROVADOS[IDX].length === TRABALHO.length &&
    APROVADOS[IDX].every((n, j) => n === TRABALHO[j]),
    'a lista branca do bloco de SALVADOR (' + IDX + ') são os três objetos de trabalho de rua, na ordem');

  // ---------- (4) a fala continua: os verbetes não foram apagados junto ----------
  VERBETES.forEach(function (v) {
    ok(src.indexOf('t: "' + v + '"') >= 0, 'o verbete ' + v + ' continua no glossário (a regra tira da mão, não cala)');
  });

  // ---------- a janela, recobrada: o portão mede a si mesmo antes de medir o jogo ----------
  console.log('\na janela medida NESTA execução (o cabeçalho diz 0,00 < ' + LIMIAR + ' < 27,0):');
  console.log('  pior distância de um drop até a arte aprovada que ele deve ser: ' + piorIdentidade.toFixed(2));
  console.log('  menor distância de um drop até uma arte aprovada ERRADA: ' + menorErrada.toFixed(1) + '  (' + ondeErrada + ')');
  ok(piorIdentidade < LIMIAR, 'a borda de baixo da janela está aberta (' + piorIdentidade.toFixed(2) + ' < ' + LIMIAR + ')');
  ok(menorErrada > LIMIAR, 'a borda de cima da janela está aberta (' + menorErrada.toFixed(1) + ' > ' + LIMIAR + ') — se fechar, duas artes aprovadas ficaram parecidas demais para o limiar separar');

  console.log(falhas ? '\n' + falhas + ' FALHA(S)' : '\ntudo verde');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
