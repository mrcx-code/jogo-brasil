// QUEM REALMENTE DECIDE POR ERRO DE CONSOLE — recontagem independente, QA 05/09.
//
// O item `filtro-de-console-copiado-por-arquivo` afirma "18 arquivos DECIDEM, 28 só logam" e
// converteu 17. Se um arquivo classificado como "só loga" na verdade DECIDE, ele ficou sem
// filtro e sem conserto — e o defeito de 04/09 (engolir erro real por substring de texto)
// continua vivo ali. Este arquivo refaz a contagem por caminho proprio.
//
// COMO ELE DECIDE QUE UM ARQUIVO "DECIDE":
//   1. o arquivo instala um escutador `.on('console', ...)`;
//   2. dentro do corpo do escutador ele guarda o erro numa VARIAVEL (push/++/=);
//   3. essa mesma variavel aparece depois numa expressao que muda o VEREDITO — `process.exit`,
//      um contador de falhas, um `ok(...)`/`assert`, ou uma comparacao `.length` num if que
//      leva a exit/falha.
// Onde a heuristica nao consegue decidir sozinha, o arquivo IMPRIME a linha e marca `?` em vez
// de chutar — "nao sei" e desfecho (EQUIPE.md 3).
//
// Sai 1 se achar um arquivo que DECIDE e nao esta nem em GOVERNADOS nem em EXEMPTO do
// `test/rede-externa-sem-copia.js` — ou seja, um buraco que a entrega nao fechou.
'use strict';

const fs = require('fs');
const path = require('path');
const DIR = __dirname;

// lê as duas listas do próprio portão da entrega, para a recontagem ser contra o que ele diz
const CAMINHO_PORTAO = path.join(DIR, 'rede-externa-sem-copia.js');
if (!fs.existsSync(CAMINHO_PORTAO)) {
  console.error('ESTA SONDA MEDE A ENTREGA B (filtro-de-console-copiado-por-arquivo), que ainda nao');
  console.error('esta neste ramo: test/rede-externa-sem-copia.js nao existe. Integre a entrega B antes.');
  process.exit(2);
}
const portao = fs.readFileSync(CAMINHO_PORTAO, 'utf8');
function listaDe(nome) {
  const m = portao.match(new RegExp('const ' + nome + ' = ([\\[{][\\s\\S]*?[\\]}]);'));
  if (!m) throw new Error('não achei ' + nome + ' em rede-externa-sem-copia.js');
  const semCom = m[1].split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  return (semCom.match(/'([a-z0-9\-.]+\.js)'/gi) || []).map(s => s.replace(/'/g, ''));
}
const GOVERNADOS = listaDe('GOVERNADOS');
const EXEMPTO = listaDe('EXEMPTO');

// EXCECAO MEDIDA PELO QA em 05/09, nao herdada da entrega: arquivo que DECIDE por erro de
// console e nao esta em GOVERNADOS nem em EXEMPTO, mas nao PODE ver ruido de rede externa
// porque intercepta a rota antes. Medido, nao suposto — ver o motivo em cada linha.
const IMUNE_POR_ROTA = {
  // pg.route('https://us.i.posthog.com/**') com route.fulfill(200) em medirPagina(): o pedido
  // nunca sai da maquina, entao net::ERR_ do MEDIDA_HOST nao tem como chegar ao console.
  // Medido em 05/09: node test/csp-paginas.js -> exit 0, erros=0 nas 7 rotas.
  // O que fica de aviso: se alguem tirar o route mock, este arquivo passa a decidir sobre
  // ruido de maquina SEM filtro nenhum, e nada avisa. Por isso ele esta escrito aqui.
  'csp-paginas.js': 'route mock do MEDIDA_HOST (fulfill 200) — o ruido nao chega ao console',
};

const arquivos = fs.readdirSync(DIR).filter(f => f.endsWith('.js'));
const linhas = [];

for (const nome of arquivos) {
  const txt = fs.readFileSync(path.join(DIR, nome), 'utf8');
  const codigo = txt.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  if (!/\.on\(\s*['"]console['"]/.test(codigo)) continue;

  // corpo do escutador: do `.on('console'` até 400 caracteres adiante (cobre todos os casos
  // deste repositório; imprime o trecho quando não fecha, para não decidir às cegas)
  const corpos = [];
  const re = /\.on\(\s*['"]console['"]\s*,([\s\S]{0,600})/g;
  let m;
  while ((m = re.exec(codigo))) corpos.push(m[1]);

  // variáveis alimentadas dentro do escutador
  const vars = new Set();
  corpos.forEach(function (c) {
    (c.match(/([A-Za-zÀ-ú_$][\w$À-ú]*)\s*\.push\(/g) || []).forEach(s => vars.add(s.replace(/\s*\.push\($/, '')));
    (c.match(/([A-Za-zÀ-ú_$][\w$À-ú]*)\s*\+\+/g) || []).forEach(s => vars.add(s.replace(/\s*\+\+$/, '')));
    (c.match(/([A-Za-zÀ-ú_$][\w$À-ú]*)\s*\+=\s*1/g) || []).forEach(s => vars.add(s.replace(/\s*\+=\s*1$/, '')));
  });

  // a variável muda o veredito?
  let decide = false, prova = '';
  const linhasCod = codigo.split('\n');
  for (const v of vars) {
    if (!v || v === 'console' || v === 'm') continue;
    for (let i = 0; i < linhasCod.length; i++) {
      const l = linhasCod[i];
      if (l.indexOf('.push(') >= 0 && new RegExp('\\b' + v + '\\s*\\.push\\(').test(l)) continue; // é a alimentação
      const usa = new RegExp('\\b' + v + '\\b').test(l);
      if (!usa) continue;
      if (/process\.exit|falhas?\s*(\+\+|\+=)|\bok\s*\(|assert|REPROV|FALHA|throw /i.test(l)) {
        decide = true; prova = (i + 1) + ': ' + l.trim().slice(0, 110); break;
      }
    }
    if (decide) break;
  }

  linhas.push({
    nome, decide, prova,
    vars: Array.from(vars).join(','),
    governado: GOVERNADOS.indexOf(nome) >= 0,
    exempto: EXEMPTO.indexOf(nome) >= 0,
    usaHelper: /require\(['"]\.\.?\/rede-externa\.js['"]\)/.test(codigo),
  });
}

const dec = linhas.filter(l => l.decide);
const log = linhas.filter(l => !l.decide);
console.log('RECONTAGEM INDEPENDENTE — ' + linhas.length + ' arquivos de test/ escutam console de navegador');
console.log('  DECIDEM (erro de console muda o veredito) ... ' + dec.length);
console.log('  só logam .............................. ' + log.length);
console.log('  a entrega afirma: 18 decidem · 28 só logam · 46 escutam\n');

console.log('  OS QUE DECIDEM:');
dec.forEach(function (l) {
  const marca = l.usaHelper ? 'helper'
    : l.exempto ? 'EXEMPTO'
    : IMUNE_POR_ROTA[l.nome] ? 'imune por rota (QA)'
    : '*** SEM FILTRO CENTRAL ***';
  console.log('   ' + l.nome.padEnd(42) + marca.padEnd(28) + (l.governado ? '[governado]' : ''));
  if (!l.usaHelper && !l.exempto && !IMUNE_POR_ROTA[l.nome]) console.log('        prova de que decide → ' + l.prova);
});

const buracos = dec.filter(l => !l.usaHelper && !l.exempto && !IMUNE_POR_ROTA[l.nome]);
console.log('\n  GOVERNADOS declarados: ' + GOVERNADOS.length + ' · EXEMPTO declarados: ' + EXEMPTO.length);
console.log('  arquivos que DECIDEM e não estão cobertos por nenhuma das duas listas: ' + buracos.length);
buracos.forEach(l => console.log('   · ' + l.nome + '  (vars: ' + l.vars + ')'));

console.log('\n  os que SÓ LOGAM (controle — se algum destes decidir, a heurística errou):');
console.log('   ' + log.map(l => l.nome).join(' '));

process.exit(buracos.length ? 1 : 0);
