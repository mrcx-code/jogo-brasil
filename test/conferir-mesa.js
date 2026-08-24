#!/usr/bin/env node
// A MESA NÃO PODE DIZER "FAÇA" O QUE O REGISTRO DURÁVEL DIZ "FEITO" — o portão do susto de 24/08.
//
//   node test/conferir-mesa.js
//
// POR QUE EXISTE, e é a garantia que o dono pediu com todas as letras: *"a mesa e o dashboard
// precisam funcionar e ser fontes confiáveis e atualizadas"*. O susto foi a mesa abrir dizendo
// **111 a gerar** quando **88 deles** constavam em `processadas.json` como já feitos — 79% da fila
// era pedido para refazer o que existe. A causa: `estadoDaFila` decidia pelo ARQUIVO numa pasta
// de rascunho gitignored (`assets/entrada`), vazia nesta máquina, ANTES de consultar o registro
// durável. Ausência de disco virava a afirmação "faça".
//
// A INVARIANTE que este portão crava, e que vale em QUALQUER estado do disco: **nenhum item que
// a mesa classifica como `gerar` pode estar em `processadas.json`.** Se estiver, a mesa está lendo
// a fonte errada de novo. É o mesmo padrão que a caça de 24/08 nomeou em cinco lugares — a
// ferramenta afirma a partir de um sinal frágil em vez de dizer "não sei" — e este é o cão de
// guarda dele para a mesa.
//
// Ele chama `estadoDaFila` DIRETO (o `receber.js` exporta e só abre porta quando executado
// direto), então não depende de rede nem de servidor no ar — roda no CI como qualquer portão.
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');

// Durável tem de PARSEAR. Corrompido não é "vazio" — é dado perdido, e some com o registro que
// este portão usa de régua. Falha alto, nomeando o arquivo.
function durable(nome) {
  const p = path.join(RAIZ, 'ferramentas', nome);
  if (!fs.existsSync(p)) return { itens: [] };
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { console.error('  ✗ ' + nome + ' CORROMPIDO: ' + e.message); process.exit(1); }
}

const falhas = [];
const ok = (cond, msg, extra) => { if (!cond) falhas.push(msg + (extra ? '  ← ' + extra : '')); };

let estado;
try { estado = require(path.join(RAIZ, 'ferramentas', 'receber.js')).estadoDaFila(); }
catch (e) { console.error('  ✗ não consegui ler a fila da mesa: ' + e.message); process.exit(1); }

const proc = new Set((durable('processadas.json').itens || []));
const itens = estado.itens || [];
const c = estado.contagem || {};

const gerar = itens.filter((i) => i.estado === 'gerar');
const fantasmas = gerar.filter((i) => proc.has(i.nome));

console.log('  mesa: gerar ' + (c.gerar || 0) + ' · chegou ' + (c.chegou || 0)
  + ' · pronto ' + (c.pronto || 0) + ' · pronto-sem-copia ' + (c.prontoSemCopia || 0)
  + ' · total ' + (c.total || 0));
console.log('  registro durável: ' + proc.size + ' artes em processadas.json');

// 1 · A INVARIANTE. Nada "a gerar" pode já estar feito no registro durável.
ok(fantasmas.length === 0,
  fantasmas.length + ' item(ns) que a mesa manda GERAR já estão em processadas.json — '
  + 'ela está lendo o disco efêmero em vez do registro durável, o defeito de 24/08.',
  fantasmas.slice(0, 6).map((i) => i.nome).join(', '));

// 2 · Nada some em silêncio: a soma dos estados fecha com o total.
const soma = (c.gerar || 0) + (c.chegou || 0) + (c.pronto || 0) + (c.prontoSemCopia || 0);
ok(soma === (c.total || 0),
  'a soma dos estados (' + soma + ') não fecha com o total (' + (c.total || 0) + ') — algum item '
  + 'caiu num estado que a contagem não conhece.');

// 3 · A mesa não devolveu erro de fonte (o /fila honesto do mesmo conserto).
ok(!estado.erro, 'a mesa devolveu erro de fonte', estado.erro);

console.log('\n' + (falhas.length
  ? 'MESA: FALHOU\n  ✗ ' + falhas.join('\n  ✗ ')
  : 'MESA: PASSOU — nada "a gerar" está no registro durável; a fila é fonte confiável.'));
process.exit(falhas.length ? 1 : 0);
