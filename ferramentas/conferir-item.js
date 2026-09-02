#!/usr/bin/env node
// O CONTRATO DO ITEM, COM PORTÃO — item despachável diz o que toca, quem pega e quando parar.
//
//   node ferramentas/conferir-item.js             confere o backlog real e reprova (exit 1)
//   node ferramentas/conferir-item.js --controle  planta 6 mutantes e exige ver cada um reprovado
//
// POR QUE EXISTE. O dono viu o cartão rico do backlog em 02/09 e reagiu: *"me assusta que só
// titulo e detalhe estão presentes em todos, precisamos refinar isso"*. Medido no mesmo dia:
// dos 68 itens, `aceite` estava em 19 (28%) — e 9 dos 16 itens `livre` não tinham. Um item
// `livre` é o próximo trabalho de um agente; sem `aceite` o agente não sabe quando parar, sem
// `territorio` o despacho simultâneo não sabe se ele colide, sem `camada` não se sabe o motor.
// O `conferir-fila.js` cobra que a fila não SEQUE; este cobra que o que está nela seja
// DESPACHÁVEL. São perguntas diferentes e cada uma tem seu portão.
//
// O CONTRATO, por estado — a exigência é diferente porque o uso é diferente:
//   livre     → id, titulo, detalhe, aceite, dono (agente OU papel), territorio (ARRAY), camada.
//   em-curso  → tudo de livre + maquina e desde (o LOCK: máquina que sai deixando em-curso
//               trava o território para as outras até o lock vencer — territorio-rico, 23/08 —
//               e sem maquina/desde ninguém sabe de quem é o lock nem quando vence).
//   bloqueado → tudo de livre MENOS aceite (o aceite pode depender de como o bloqueio se
//               resolve; a cobrança chega no instante em que o item vira livre, e o CI roda
//               este portão a cada push).
//   do-dono   → nada além de titulo+detalhe: é a mesa dele, não fila de agente. Quando ele
//               destrava, o item vira livre e o contrato cobra tudo aí.
//   concluido → nada: é registro, não fila. Endurecer registro velho é reescrever história.
//
// DOIS FORMATOS QUE O CONTRATO FECHA de agora em diante (ambos medidos em 02/09):
//   - `territorio` era metade array, metade string com vírgulas (8/8 nos livres). O dado do
//     despacho é uma LISTA; daqui em diante item despachável declara array. Os strings dos
//     livres foram normalizados no mesmo commit que este portão.
//   - `agente` e `papel` são DOIS nomes para o dono (42+26, nenhum item com os dois). O portão
//     aceita qualquer um — migrar os 26 `papel` é decisão à parte, junto com os leitores — mas
//     REPROVA item não-concluído com OS DOIS ao mesmo tempo: dois campos de dono com valores
//     diferentes é ambiguidade que os leitores resolvem em silêncio (`agente ||` ganha).
//
// O que este portão NÃO cobra, de propósito: o VOCABULÁRIO de `camada` (hoje 8 valores
// misturando motor [pesado/medio/leve] com área [esteira/plataforma/...] — reclassificar é
// decisão de despacho do pm, não formato) e o CONTEÚDO do aceite (frase verificável é juízo,
// não esquema; o padrão vive nos 28 exemplos do próprio arquivo).
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const CONTROLE = process.argv.includes('--controle');

function carregar() {
  const p = path.join(RAIZ, 'ferramentas', 'backlog.json');
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  return Array.isArray(d) ? d : (d.itens || d.items || []);
}

const texto = (v) => typeof v === 'string' && v.trim().length > 0;
const listaDeCaminhos = (v) => Array.isArray(v) && v.length > 0 && v.every(texto);
const dono = (i) => i.agente || i.papel || null;

// Devolve a lista de falhas de UM item contra o contrato do estado dele.
function falhasDoItem(i) {
  const f = [];
  const rotulo = (i.id || '(sem id)') + ' [' + (i.estado || 'sem estado') + ']';
  if (i.estado === 'concluido' || i.estado === 'do-dono') return f;

  if (i.agente && i.papel) {
    f.push(rotulo + ': tem `agente` E `papel` ao mesmo tempo — dois campos de dono é ambiguidade; fique com um.');
  }
  if (i.estado !== 'livre' && i.estado !== 'em-curso' && i.estado !== 'bloqueado') {
    f.push(rotulo + ': estado desconhecido — os estados são os do topo do backlog.json.');
    return f;
  }

  if (!texto(i.id)) f.push(rotulo + ': sem `id`.');
  if (!texto(i.titulo)) f.push(rotulo + ': sem `titulo`.');
  if (!texto(i.detalhe)) f.push(rotulo + ': sem `detalhe`.');
  if (!dono(i)) f.push(rotulo + ': sem dono (`agente` ou `papel`) — ninguém sabe quem pega.');
  if (!listaDeCaminhos(i.territorio)) {
    f.push(rotulo + ': `territorio` precisa ser ARRAY não-vazio de caminhos — é o dado do despacho simultâneo'
      + (typeof i.territorio === 'string' ? ' (veio string; separe em array)' : '') + '.');
  }
  if (!texto(i.camada)) f.push(rotulo + ': sem `camada` — o despacho não sabe o motor.');

  if (i.estado === 'livre' || i.estado === 'em-curso') {
    if (!texto(i.aceite)) f.push(rotulo + ': sem `aceite` — o agente que pegar não sabe quando parar.');
  }
  if (i.estado === 'em-curso') {
    if (!texto(i.maquina)) f.push(rotulo + ': em-curso sem `maquina` — lock sem dono trava o território para todas.');
    if (!texto(i.desde)) f.push(rotulo + ': em-curso sem `desde` — lock sem data nunca vence.');
  }
  return f;
}

function conferir(itens) {
  const falhas = [];
  for (const i of itens) falhas.push(...falhasDoItem(i));
  return falhas;
}

if (!CONTROLE) {
  const falhas = conferir(carregar());
  console.log(falhas.length
    ? 'ITENS: FALHOU\n  ✗ ' + falhas.join('\n  ✗ ')
    : 'ITENS: PASSOU — todo item despachável diz o que toca, quem pega e quando parar.');
  process.exit(falhas.length ? 1 : 0);
}

// --controle: um portão que nunca foi visto reprovando é decoração (EQUIPE.md 2.8). Seis
// mutantes plantados EM MEMÓRIA sobre o backlog real; cada um tem de ser pego, e o backlog
// real, limpo, tem de passar.
(() => {
  const real = carregar();
  const base = real.find((i) => i.estado === 'livre');
  if (!base) { console.log('CONTROLE: não há item livre para mutar — inconclusivo.'); process.exit(1); }
  const clone = () => JSON.parse(JSON.stringify(base));

  const mutantes = [
    ['livre sem aceite', (m) => { delete m.aceite; }],
    ['livre com territorio string', (m) => { m.territorio = 'a.js,b.js'; }],
    ['livre sem camada', (m) => { delete m.camada; }],
    ['livre sem dono', (m) => { delete m.agente; delete m.papel; }],
    ['livre com agente E papel', (m) => { m.agente = 'dev-jogo'; m.papel = 'arte'; }],
    ['em-curso sem maquina/desde', (m) => { m.estado = 'em-curso'; delete m.maquina; delete m.desde; }],
  ];

  let vermelhos = 0;
  for (const [nome, mutar] of mutantes) {
    const m = clone(); m.id = 'mutante-' + vermelhos; mutar(m);
    const pego = conferir([m]).length > 0;
    console.log('  ' + (pego ? '✗ pego (exit 1): ' : '✓ ESCAPOU: ') + nome);
    if (pego) vermelhos++;
  }
  const limpo = conferir(real).length === 0;
  console.log('  ' + (limpo ? '✓' : '✗') + ' backlog real limpo: ' + (limpo ? 'passa' : 'FALHA'));

  const ok = vermelhos === mutantes.length && limpo;
  console.log('\nCONTROLE: ' + (ok
    ? 'PASSOU — ' + vermelhos + '/' + mutantes.length + ' mutantes reprovados e o real passa.'
    : 'FALHOU — ' + vermelhos + '/' + mutantes.length + ' mutantes pegos; real limpo: ' + limpo + '.'));
  process.exit(ok ? 0 : 1);
})();
