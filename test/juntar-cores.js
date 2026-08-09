// CONSOLIDAR AS CORES INDISTINGUÍVEIS — achado 5 da auditoria holística.
//
// O CSS do chrome tinha 116 hex distintos, e 54 pares diferiam em 6 ou menos por canal. Dez
// pares diferiam em 2 ou menos — `#8d8272` contra `#8d8271`, `#0d0b08` contra `#0e0b07` —
// e isso não é vocabulário, é acidente de digitação repetido ao longo de onze ondas. O grupo
// "quase-preto" chegou a dezesseis membros para um papel que a régua nomeia com três tintas.
//
//   node test/juntar-cores.js            só mede e lista
//   node test/juntar-cores.js --aplicar  reescreve o src/estilo.css
//
// A regra de qual cor sobrevive é uma só e não é gosto: **a mais usada**. Empate desempata
// pela que aparece primeiro no arquivo, para o resultado não depender da ordem do Map.
//
// LIMIAR 2 de 255. Abaixo disso nenhum olho separa as duas num degradê de madeira, e a prova
// vai no print: `test/prova-cores.js` compara as telas antes e depois.
const fs = require('fs');
const path = require('path');

const ARQ = path.resolve(__dirname, '..', 'src', 'estilo.css');
const LIMIAR = 2;
const aplicar = process.argv.indexOf('--aplicar') >= 0;

const css = fs.readFileSync(ARQ, 'utf8');
const achados = [...css.matchAll(/#([0-9a-fA-F]{6})\b/g)].map(m => '#' + m[1].toLowerCase());
const uso = new Map();
const ordem = [];
achados.forEach(c => {
  if (!uso.has(c)) { uso.set(c, 0); ordem.push(c); }
  uso.set(c, uso.get(c) + 1);
});
const rgb = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const dif = (a, b) => {
  const x = rgb(a), y = rgb(b);
  return Math.max(Math.abs(x[0] - y[0]), Math.abs(x[1] - y[1]), Math.abs(x[2] - y[2]));
};

console.log('cores distintas no CSS:', ordem.length);

// União-busca sobre os pares dentro do limiar: se A~B e B~C, os três viram um grupo só.
const pai = {};
ordem.forEach(c => { pai[c] = c; });
const raiz = c => { while (pai[c] !== c) c = pai[c]; return c; };
let pares = 0;
for (let i = 0; i < ordem.length; i++) {
  for (let j = i + 1; j < ordem.length; j++) {
    if (dif(ordem[i], ordem[j]) <= LIMIAR) { pares++; pai[raiz(ordem[j])] = raiz(ordem[i]); }
  }
}
const grupos = new Map();
ordem.forEach(c => {
  const r = raiz(c);
  if (!grupos.has(r)) grupos.set(r, []);
  grupos.get(r).push(c);
});

const trocas = [];
grupos.forEach(membros => {
  if (membros.length < 2) return;
  // o sobrevivente é o mais usado; empate, o que aparece primeiro
  let melhor = membros[0];
  membros.forEach(c => { if (uso.get(c) > uso.get(melhor)) melhor = c; });
  membros.forEach(c => {
    if (c === melhor) return;
    trocas.push({ de: c, para: melhor, usos: uso.get(c), delta: dif(c, melhor) });
  });
});

console.log('pares dentro do limiar de ' + LIMIAR + ':', pares);
console.log('grupos com mais de um membro:', [...grupos.values()].filter(g => g.length > 1).length);
console.log('substituições:', trocas.length);
trocas.forEach(t => console.log('  ' + t.de + ' -> ' + t.para +
  '  (Δ' + t.delta + ', ' + t.usos + ' uso' + (t.usos > 1 ? 's' : '') + ')'));
console.log('cores depois:', ordem.length - trocas.length);

if (!aplicar) { console.log('\n(só medindo — passe --aplicar para reescrever)'); process.exit(0); }

let saida = css;
trocas.forEach(t => {
  saida = saida.replace(new RegExp(t.de.replace('#', '#'), 'gi'), t.para);
});
fs.writeFileSync(ARQ, saida, 'utf8');
console.log('\nsrc/estilo.css reescrito. Rode `npm test` e o test/prova-cores.js.');
