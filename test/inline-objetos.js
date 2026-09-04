// Embute no index.html os objetos que atravessam a tela, os drops e os ícones do painel.
//
// Três blocos, um por marcador: MOB_B64, DROP_B64 e ICONE_B64. Os arquivos entram como estão
// em assets/objetos — já saíram do test/converter-objeto.js em WebP, com o magenta desfranjado
// e a mancha recortada justo. Aqui não há conversão nenhuma: é leitura, base64 e substituição.
//
// A LISTA ABAIXO É A DECISÃO DE CONTEÚDO. Cada chave interna (smog/cash/drum) é uma vaga, e
// cada vaga recebe um objeto POR CAPÍTULO. As chaves são herdadas do motor e não descrevem
// mais nada — o que descreve é o recurso que a vaga alimenta (`RECURSO_DE` no index.html):
//
//   smog  -> "flor"      colheita: fruta, mandioca, tabuleiro de quitutes, muda
//   drum  -> "agua"      água:     muda (sem arte de água no cap 1), pote, barril, galão
//   cash  -> "refeicao"  comida:   peixe, cesto, trouxa de roupa, cesto
//
// TODAS as listas por capítulo deste arquivo estão na ordem de `EPOCAS`, que é CRONOLÓGICA:
// litoral, Palmares, SALVADOR (1835), hoje. Os arquivos de Salvador se chamam `cap4` porque
// foram o quarto PEDIDO da mesa, e é a única coisa neste repositório em que o número do
// arquivo não é o número do capítulo. Reordenar uma destas listas sem reordenar as outras põe
// o cesto de hoje na mão da ganhadeira de 1835.
//
// Ficaram de fora, por não haver quarta vaga: cap2-obj-3 (feixe de lenha) e cap3-obj-3
// (enxada). Estão convertidos em assets/objetos, prontos para quando houver onde pôr.
//
//   node test/inline-objetos.js

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
// ALVO: src/jogo.ts, a FONTE. O index.html da raiz virou SAIDA do build na migracao para
// TypeScript — escrever nele funciona e some no proximo `npm run build`, sem erro nenhum.
const ARQ = path.join(RAIZ, 'src', 'jogo.ts');
const DIR = path.join(RAIZ, 'assets', 'objetos');

const MOBS = {
  smog: ['cap1-obj-fruta', 'cap2-obj-roca', 'cap4-obj-tabuleiro', 'cap3-obj-muda'],
  cash: ['cap1-obj-peixe', 'cap2-obj-cesto', 'cap4-obj-trouxa', 'cap3-obj-cesto'],
  drum: ['cap1-obj-muda', 'cap2-obj-agua', 'cap4-obj-agua', 'cap3-obj-agua']
};
// Os retratos de quem FALA em cada capítulo. Entraram nesta lista porque até aqui o bloco
// RETRATO_B64 era o único pedaço de arte embutido à mão — "gerado" no comentário e por
// ninguém no código. Um capítulo novo precisava de um base64 colado, que é exatamente o tipo
// de passo que se esquece.
// TREZE, UM POR ÉPOCA, NA ORDEM DE `EPOCAS` (15/08 — os nove rostos aprovados pelo dono em
// ROSTOS.md). O índice deixou de ser bloco de arte: retrato é PESSOA, e cada capítulo tem a
// sua. Os sufixos numéricos são o número do pedido antigo (cap4 = SALVADOR, cap3 = AINDA AQUI).
const RETRATOS = ['retrato-cap1', 'retrato-cap2', 'retrato-cais', 'retrato-cap4',
  'retrato-jabaquara', 'retrato-pequenaafrica', 'retrato-portas', 'retrato-naodito',
  'retrato-praca', 'retrato-segurou', 'retrato-aceiro', 'retrato-temfonte', 'retrato-cap3'];
// Uma lista por capítulo. Capítulos 2 e 3 têm uma arte só, e a lista curta é lida como
// "todo mundo deixa isto" — ver o comentário do bloco no index.html.
const DROPS = [
  ['drop-semente', 'drop-broto', 'drop-peixe'],
  ['drop-cap2-1'],
  // SALVADOR: tabuleiro, balde d'água, trouxa de roupa — O TRABALHO DA RUA, e nada de culto.
  //
  // ERA acarajé, pano da costa e búzios (`drop-cap4-1/2/3`, que continuam em assets/objetos
  // como registro e não entram em tabela nenhuma). Isso violava o §2.4 item 5 do CLAUDE.md,
  // que é categórico: "objeto ritual não é colecionável — entra como fala, nunca como drop".
  // O búzio é instrumento de adivinhação no candomblé, o acarajé é comida de santo (é a
  // própria ficha do IPHAN que diz isso) e o pano da costa é o alaká das casas de culto — e o
  // capítulo VIZINHO, O CAIS, já tinha RECUSADO búzios como item de escavação pela mesma
  // regra (NOTES.md:4952). Mesmo objeto, mesma regra, decisão oposta. A auditoria §2 dos treze
  // capítulos achou isso em 03/09, quatro refutações adversariais caíram, e o dono decidiu:
  // TROCA. Os três verbetes do glossário (ACARAJÉ, PANO DA COSTA, BÚZIOS) FICAM, e é neles que
  // a dimensão sagrada continua sendo contada — a regra não manda calar, manda tirar da mão.
  //
  // A ORDEM VAI PELO QUE A PESSOA DA RUA CARREGA, não pelo nome do arquivo, e as duas coisas
  // divergem aqui. Quem atravessa a rua em SALVADOR é GENTE (`GENTE_EP_SPR.salvador`), e
  // `GENTE_FILEIRA` já casa carga com vaga: barril→drum, trouxa→cash, tabuleiro→smog. O drop
  // é o que essa pessoa TROUXE e deixou no chão, então ele tem de ser a carga dela:
  //   smog  ← tabuleiro     (quem passa leva tabuleiro)
  //   drum  ← BALDE D'ÁGUA, que é o que `cap4-obj-trouxa.webp` desenha
  //   cash  ← TROUXA DE ROUPA, que é o que `cap4-obj-agua.webp` desenha
  // MEDIDO em 04/09 abrindo os três arquivos: os nomes de `cap4-obj-agua` e `cap4-obj-trouxa`
  // estão TROCADOS em relação ao que eles desenham. A lista de `MOBS` acima herdou a troca e
  // não foi mexida aqui (mob de SALVADOR é gente, o objeto nunca chega à tela) — está anotado
  // em PENDENTES para quem for tocar `MOBS`. Ir pelo nome do arquivo põe balde na vaga da
  // comida e trouxa na vaga da água.
  //
  // E NÃO SÃO OS `cap4-obj-*` DIRETO, por uma medida: o drop é escalado por
  // `DROP_TARGET / naturalHeight`, então a margem vazia daqueles quadros ENCOLHE o objeto na
  // tela — o tabuleiro saía 9x9 px com 46 das 120 linhas de tinta, e o quadro do balde ainda
  // trazia o fragmento de um objeto vizinho cortado pela célula, que descentrava o balde.
  // `test/aparar-objeto.js` recorta na mancha (e na maior ilha de colunas, no caso do balde) e
  // regrava a 0,80. Na tela: 9x9 → 20x9 · 11x9 → 7x9 limpo · 8x9 → 11x9. Erro de recompressão
  // na escala de exibição: 0,93 · 0,48 · 1,25 de 255, contra a régua de 2,6 do §6.
  ['drop-cap4-tabuleiro', 'drop-cap4-balde', 'drop-cap4-trouxa'],
  ['drop-cap3-1']
];
const ICONES = { folha: 'icone-folha', agua: 'icone-agua', cesto: 'icone-cesto', passo: 'icone-passo' };

let total = 0;
function uri(nome) {
  const p = path.join(DIR, nome + '.webp');
  const b = fs.readFileSync(p);
  total += b.length;
  console.log('  ' + nome.padEnd(18) + ' ' + Math.round(b.length / 1024) + ' KB');
  return 'data:image/webp;base64,' + b.toString('base64');
}

console.log('objetos:');
const mob = Object.keys(MOBS).map(function (k) {
  return '  ' + k + ': [\n' + MOBS[k].map(function (n) { return '    "' + uri(n) + '"'; }).join(',\n') + '\n  ]';
}).join(',\n');
console.log('drops:');
const drop = DROPS.map(function (lista) {
  return '  [\n' + lista.map(function (n) { return '    "' + uri(n) + '"'; }).join(',\n') + '\n  ]';
}).join(',\n');
console.log('ícones:');
const icone = Object.keys(ICONES).map(function (k) {
  return '  ' + k + ': "' + uri(ICONES[k]) + '"';
}).join(',\n');
console.log('retratos:');
const retrato = RETRATOS.map(function (n) { return '  "' + uri(n) + '"'; }).join(',\n');

let src = fs.readFileSync(ARQ, 'utf8');
// `\r?\n` e não `\n`: no Windows o checkout vem com CRLF, e um `\n` cru não casa com nada.
const NL = '\\r?\\n';
const FIM = src.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
trocar('(\\/\\*MOB_B64_START[\\s\\S]*?const MOB_B64 = \\{' + NL + ')[\\s\\S]*?(' + NL
  + '\\};' + NL + '\\/\\*MOB_B64_END\\*\\/)', mob, 'MOB_B64');
trocar('(\\/\\*DROP_B64_START[\\s\\S]*?const DROP_B64 = \\[' + NL + ')[\\s\\S]*?(' + NL
  + '\\];' + NL + '\\/\\*DROP_B64_END\\*\\/)', drop, 'DROP_B64');
trocar('(\\/\\*ICONE_B64_START[\\s\\S]*?const ICONE_B64 = \\{)[\\s\\S]*?(\\};' + NL
  + '\\/\\*ICONE_B64_END\\*\\/)', FIM + icone + FIM, 'ICONE_B64');
trocar('(\\/\\*RETRATO_B64_START[\\s\\S]*?const RETRATO_B64 = \\[' + NL + ')[\\s\\S]*?(' + NL
  + '\\];' + NL + ')', retrato, 'RETRATO_B64');

function trocar(padrao, corpo, nome) {
  const re = new RegExp(padrao);
  if (!re.test(src)) { console.error('marcadores ' + nome + ' não encontrados'); process.exit(1); }
  const txt = corpo.split('\n').join(FIM);       // o bloco novo sai na quebra de linha do arquivo
  src = src.replace(re, function (_, a, b) { return a + txt + b; });
}

// Sintaxe antes de gravar. O alvo é TypeScript, então varrer `<script>` não acha nada e a
// checagem antiga passaria calada — o que este script escreve é DADO, e é isso que se verifica.
// O resto do arquivo quem confere é o `tsc`, dentro do `npm run build`, que se recusa a
// escrever o index.html se algo estiver quebrado.
for (const [nome, corpo] of [['MOB_B64', '{' + mob + '}'], ['DROP_B64', '[' + drop + ']'],
                             ['ICONE_B64', '{' + icone + '}'], ['RETRATO_B64', '[' + retrato + ']']]) {
  try { new Function('return ' + corpo); }
  catch (e) { console.error('SINTAXE QUEBRADA em ' + nome + ': ' + e.message + ' — nada gravado'); process.exit(1); }
}
fs.writeFileSync(ARQ, src);
console.log('arte embutida: ' + Math.round(total / 1024) + ' KB · src/jogo.ts '
  + src.split('\n').length + ' linhas, ' + (src.length / 1048576).toFixed(2) + ' MB'
  + ' — rode `npm run build`');
