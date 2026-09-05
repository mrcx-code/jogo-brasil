// CHECAR-CI-VEREDITO — prova que ferramentas/checar-ci.js julga pelo `conclusion` de um run
// COMPLETO e nunca por `status: in_progress`. Fixtures em test/fixtures/ci-*.json: os dois
// primeiros são runs REAIS gravados desta rodada (05/09) — o run 33932926532 (vermelho, a
// "cobaia histórica" que o item plantao-nao-le-o-ci cita) e o run 33934651864 (o primeiro
// verde depois do conserto). O terceiro combina os dois runs "in_progress" reais mais o
// green real, na ordem real devolvida por `gh run list`. O quarto (só em andamento, nenhum
// completo) é CONSTRUÍDO — não existe de verdade um momento em que a main não tenha nenhum
// run completo, então este cobre o caso de borda sem fingir que foi medido ao vivo.
const fs = require('fs');
const path = require('path');
const { veredito } = require('../ferramentas/checar-ci.js');

let falhas = 0;
function ok(cond, txt) {
  console.log((cond ? '  ok   ' : '  FALHA ') + txt);
  if (!cond) falhas++;
}

function ler(nome) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', nome), 'utf8'));
}

console.log('\n---- run completo REPROVOU (cobaia histórica: run 605/33932926532)');
{
  const v = veredito(ler('ci-vermelho-605.json'));
  ok(v.estado === 'vermelho', 'veredito é vermelho, não "desconhecido" nem "verde"');
  ok(v.run && v.run.databaseId === 33932926532, 'aponta para o run real que reprovou');
}

console.log('\n---- run completo PASSOU');
{
  const v = veredito(ler('ci-verde.json'));
  ok(v.estado === 'verde', 'veredito é verde');
  ok(v.run && v.run.databaseId === 33934651864, 'aponta para o run real que passou');
}

console.log('\n---- run mais novo está EM ANDAMENTO, mas o último COMPLETO foi verde');
{
  const v = veredito(ler('ci-verde-com-em-andamento.json'));
  ok(v.estado === 'verde', 'o veredito ainda é verde — o in_progress mais novo não vira veredito');
  ok(v.run && v.run.databaseId === 33934651864, 'o run usado para o veredito é o COMPLETO, não o in_progress');
  ok(!!v.rodando && v.rodando.status === 'in_progress', 'mas o run em andamento é reportado à parte, não descartado');
}

console.log('\n---- NENHUM run completo ainda (só em andamento) — caso de borda construído');
{
  const v = veredito(ler('ci-so-em-andamento.json'));
  ok(v.estado === 'desconhecido', 'sem run completo, o veredito é desconhecido — nunca verde por omissão');
  ok(v.run === null, 'não há run "do veredito" para apontar');
}

console.log('\n---- o script inteiro, via CI_INJETAR, sai pelo CÓDIGO certo (não só a última linha)');
{
  const { execFileSync } = require('child_process');
  function saidaDe(fixture) {
    try {
      execFileSync(process.execPath, [path.join(__dirname, '..', 'ferramentas', 'checar-ci.js')], {
        env: { ...process.env, CI_INJETAR: path.join(__dirname, 'fixtures', fixture) },
        encoding: 'utf8',
      });
      return 0;
    } catch (e) {
      return e.status;
    }
  }
  ok(saidaDe('ci-vermelho-605.json') === 1, 'CLI real: fixture vermelha sai exit 1');
  ok(saidaDe('ci-verde.json') === 0, 'CLI real: fixture verde sai exit 0');
  ok(saidaDe('ci-so-em-andamento.json') === 0, 'CLI real: sem run completo sai 0 (desconhecido não bloqueia)');
}

console.log('\n---- CI_INJETAR_ERRO: a consulta falhando de verdade NUNCA pode sair como "verde" nem "desconhecido"');
{
  // A LIÇÃO DE 05/09: a 1ª versão desta ferramenta chamava `gh` via execFileSync, e na nuvem
  // (sem `gh` instalado) a falha saiu SILENCIOSA — o processo composto terminou exit 0, "de
  // longe parecia que rodou". Reescrita para usar https embutido do Node (sem CLI nenhum), e
  // esta asserção prova que uma consulta que falha vira um ESTADO PRÓPRIO (exit 2), nunca
  // confundido com os outros dois exit 0.
  const { execFileSync } = require('child_process');
  function saidaComErroInjetado(motivo) {
    try {
      execFileSync(process.execPath, [path.join(__dirname, '..', 'ferramentas', 'checar-ci.js')], {
        env: { ...process.env, CI_INJETAR_ERRO: motivo },
        encoding: 'utf8',
      });
      return { codigo: 0, saida: '' };
    } catch (e) {
      return { codigo: e.status, saida: (e.stdout || '') };
    }
  }
  const r = saidaComErroInjetado('rede indisponível (simulado, sem tocar rede de verdade)');
  ok(r.codigo === 2, 'CLI real: consulta que falha sai exit 2, NUNCA 0 nem 1 (era o bug: "de longe parecia que rodou")');
  ok(r.saida.includes('ERRO AO CONSULTAR'), 'a mensagem nomeia que foi ERRO, não silêncio nem "desconhecido"');
}

console.log('\n' + (falhas === 0 ? 'PASSOU' : ('FALHOU — ' + falhas + ' asserç' + (falhas === 1 ? 'ão' : 'ões'))));
process.exit(falhas === 0 ? 0 : 1);
