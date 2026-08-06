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
//   smog  -> "flor"      colheita: fruta (cap 1), mandioca (cap 2), muda (cap 3)
//   drum  -> "agua"      água:     muda (cap 1, sem arte de água), pote (cap 2), galão (cap 3)
//   cash  -> "refeicao"  comida:   peixe (cap 1), cesto (cap 2), cesto (cap 3)
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
  smog: ['cap1-obj-fruta', 'cap2-obj-roca', 'cap3-obj-muda'],
  cash: ['cap1-obj-peixe', 'cap2-obj-cesto', 'cap3-obj-cesto'],
  drum: ['cap1-obj-muda', 'cap2-obj-agua', 'cap3-obj-agua']
};
// Uma lista por capítulo. Capítulos 2 e 3 têm uma arte só, e a lista curta é lida como
// "todo mundo deixa isto" — ver o comentário do bloco no index.html.
const DROPS = [
  ['drop-semente', 'drop-broto', 'drop-peixe'],
  ['drop-cap2-1'],
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
                             ['ICONE_B64', '{' + icone + '}']]) {
  try { new Function('return ' + corpo); }
  catch (e) { console.error('SINTAXE QUEBRADA em ' + nome + ': ' + e.message + ' — nada gravado'); process.exit(1); }
}
fs.writeFileSync(ARQ, src);
console.log('arte embutida: ' + Math.round(total / 1024) + ' KB · src/jogo.ts '
  + src.split('\n').length + ' linhas, ' + (src.length / 1048576).toFixed(2) + ' MB'
  + ' — rode `npm run build`');
