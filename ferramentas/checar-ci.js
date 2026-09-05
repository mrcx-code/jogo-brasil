// CHECAR O CI DA MAIN — o sinal que faltava no laço do plantão (item `plantao-nao-le-o-ci`,
// PENDENTES.md / backlog, medido por nuvem-20260905T0023 em 05/09: a main ficou VERMELHA no
// CI por 2h35 e quatro pushes seguidos, e nenhuma rodada olhou, porque nenhuma etapa do laço
// olhava. O `npm test` desta máquina mede o disco local; isto aqui mede o GitHub Actions.
//
//   node ferramentas/checar-ci.js
//
// Sai 1 se o veredito for VERMELHO (o último run COMPLETO do workflow `teste` na `main`
// reprovou). Sai 0 nos outros dois casos (VERDE, ou DESCONHECIDO — nenhum run completo ainda).
// A REGRA QUE ESTE ARQUIVO EXISTE PARA CUMPRIR: julgar pelo campo `conclusion` de um run
// `completed`, NUNCA pela última linha de log e NUNCA tratando `status: in_progress` como
// veredito — um run em andamento não é verde nem vermelho, é indefinido, e confundi-lo com
// verde é exatamente a armadilha que deixou a main vermelha sem ninguém notar.
//
// TESTÁVEL SEM REDE: CI_INJETAR=<caminho.json> substitui a chamada ao `gh` por um array de
// runs lido de arquivo (mesma forma que `gh run list --json` devolve) — é o que
// `test/checar-ci-veredito.js` usa, com fixtures gravadas de runs REAIS desta rodada.
const { execFileSync } = require('child_process');
const fs = require('fs');

function runsDoGh(workflow, limite) {
  const bruto = execFileSync('gh', [
    'run', 'list',
    '--branch', 'main',
    '--workflow', workflow,
    '--limit', String(limite || 10),
    '--json', 'databaseId,conclusion,status,headSha,createdAt,workflowName,url',
  ], { encoding: 'utf8' });
  return JSON.parse(bruto);
}

function runsParaVeredito(workflow) {
  if (process.env.CI_INJETAR) {
    const todos = JSON.parse(fs.readFileSync(process.env.CI_INJETAR, 'utf8'));
    return todos.filter(r => r.workflowName === workflow);
  }
  return runsDoGh(workflow);
}

// A FUNÇÃO PURA — o que o teste exercita sem tocar rede. Recebe os runs de UM workflow,
// mais recente primeiro (é a ordem que `gh run list` já devolve), e devolve o veredito mais
// autoritativo: o `conclusion` do run mais recente cujo `status` é `completed`. Runs
// `in_progress`/`queued` mais recentes que esse são informativos (o `rodando` do retorno),
// nunca o veredito.
function veredito(runs) {
  const completo = runs.find(r => r.status === 'completed');
  const rodando = runs.find(r => r.status !== 'completed');
  if (!completo) {
    return { estado: 'desconhecido', run: null, rodando: rodando || null };
  }
  const estado = completo.conclusion === 'success' ? 'verde'
    : completo.conclusion === 'failure' ? 'vermelho'
    : 'desconhecido';
  return { estado, run: completo, rodando: (rodando && rodando.createdAt > completo.createdAt) ? rodando : null };
}

function main() {
  const runs = runsParaVeredito('teste');
  const v = veredito(runs);
  if (v.estado === 'vermelho') {
    console.log('CI DA MAIN: VERMELHO — ' + (v.run ? v.run.url : '(sem url)'));
    console.log('O último run completo do workflow "teste" em main REPROVOU. Antes de despachar');
    console.log('o primeiro agente da rodada, conserte isto ou registre por que não bloqueia.');
    if (v.rodando) console.log('(há um run mais novo ainda em andamento: ' + v.rodando.url + ')');
    process.exitCode = 1;
    return;
  }
  if (v.estado === 'desconhecido') {
    console.log('CI DA MAIN: DESCONHECIDO — nenhum run completo do workflow "teste" encontrado.');
    if (v.rodando) console.log('Run em andamento: ' + v.rodando.url);
  } else {
    console.log('CI DA MAIN: verde (' + (v.run ? v.run.url : '') + ')');
  }
  process.exitCode = 0;
}

module.exports = { veredito, runsDoGh };
if (require.main === module) main();
