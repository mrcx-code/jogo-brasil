#!/usr/bin/env node
// O `--apagar` DO `ramos-mortos.js` NÃO PODE MANDAR APAGAR RAMO COM MÃO EM CIMA.
//
//   node test/ramos-mortos-apagar-travas.js
//   RAMOS_MORTOS_JS=/caminho/para/outro/ramos-mortos.js node test/ramos-mortos-apagar-travas.js
//
// POR QUE EXISTE. Achado pelo QA em 04/09, no gap-check de uma entrega vizinha: o `--apagar`
// cospe `git push origin --delete <ref>` para toda a seção MORTOS, sem nenhuma trava, e a rede de
// segurança inteira era uma frase — *"confira a lista acima antes de colar"*. A frase pede o que a
// divisão de trabalho torna impossível: quem TEM `delete_ref` é o Mac e o Windows (a nuvem sai 403
// nisso, re-medido quatro vezes), então quem cola é **justamente quem não acompanhou a rodada que
// criou o ramo**. Instrução dirigida a quem não pode cumpri-la não é proteção.
//
// AS DUAS COISAS QUE ESTE PORTÃO COBRA, e são as que o `--apagar` não sabia recusar:
//   1. `entrega/<id>` cujo item está `em-curso` no `backlog.json` — outra máquina pode empurrar
//      commit para esse ramo DEPOIS desta medição, e o apagamento é irreversível do lado de cá;
//   2. o ramo do HEAD desta cópia — serrar o galho em que se está sentado nunca foi o que se quis.
//
// E COBRA A METADE QUE FAZ AS DUAS VALEREM ALGUMA COISA (CENA 0): o `--apagar` continua cuspindo
// o comando para os ramos que ESTÃO liberados, e sai 0. Um portão que só cobrasse "recuse" seria
// atendido por um programa que parou de imprimir qualquer comando — a forma mais barata de ficar
// verde, e a que esta casa mais persegue (EQUIPE.md §2.8).
//
// AS DUAS INJEÇÕES no fim provam a mordida uma trava de cada vez, cada uma trocando UMA condição
// por `false`. Injeção que derruba as duas juntas provaria "as travas existem", nunca "esta trava
// aqui morde" — foi esse exatamente o buraco que o QA achou no portão irmão (`ramos-mortos-
// veredito.js`, cena 4) em 03/09.
//
// NÃO USA REDE: monta repositório de mentira em `os.tmpdir()` e clona por `file://`, como os dois
// portões irmãos.
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PROGRAMA = process.env.RAMOS_MORTOS_JS || path.join(RAIZ, 'ferramentas', 'ramos-mortos.js');
const FONTE = fs.readFileSync(PROGRAMA, 'utf8');
let falhas = 0;
let checagens = 0;

function ok(cond, oque, detalhe) {
  checagens++;
  console.log((cond ? 'OK      ' : 'FALHOU  ') + oque);
  if (!cond) {
    falhas++;
    // O estado NO INSTANTE DA FALHA, inteiro (EQUIPE.md §2.9) — sem isto o próximo palpite é às cegas.
    for (const l of String(detalhe || '(sem detalhe)').split('\n')) console.log('        | ' + l);
  }
}

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

// ── o palco ────────────────────────────────────────────────────────────────────────────────────
// DOIS ramos `entrega/`, os dois já consumidos pela `main` — quer dizer: os dois entram em MORTOS
// pelo critério que já existia, e a classificação NÃO é o que este portão mede. O que muda de cena
// para cena é só o backlog e o HEAD, que é onde as travas moram.
const palco = fs.mkdtempSync(path.join(os.tmpdir(), 'apagar-travas-'));
const origem = path.join(palco, 'origem');
fs.mkdirSync(origem);
git(origem, 'init', '--quiet', '--initial-branch=main');
git(origem, 'config', 'user.email', 'palco@exemplo.invalido');
git(origem, 'config', 'user.name', 'Palco');

function commitar(msg) {
  fs.appendFileSync(path.join(origem, 'linha.txt'), msg + '\n');
  git(origem, 'add', '-A');
  git(origem, 'commit', '--quiet', '-m', msg);
}

commitar('base');
for (const nome of ['alvo', 'vizinho']) {
  git(origem, 'checkout', '--quiet', '-b', 'entrega/' + nome);
  commitar('trabalho de ' + nome);
  git(origem, 'checkout', '--quiet', 'main');
  git(origem, 'merge', '--quiet', '--no-ff', '-m', 'Integra ' + nome, 'entrega/' + nome);
}

let nClones = 0;
// `estados` diz o estado de cada item no backlog; `head` diz em que ramo a cópia fica parada.
function montar(fonte, estados, head) {
  const dir = path.join(palco, 'copia' + ++nClones);
  git(palco, 'clone', '--quiet', 'file://' + origem, dir);
  if (head && head !== 'main') git(dir, 'checkout', '--quiet', head);
  fs.mkdirSync(path.join(dir, 'ferramentas'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'ferramentas', 'ramos-mortos.js'), fonte);
  fs.writeFileSync(path.join(dir, 'ferramentas', 'backlog.json'), JSON.stringify({
    itens: Object.keys(estados).map((id) => ({
      id, estado: estados[id], maquina: 'maquina-de-mentira', desde: new Date().toISOString(),
    })),
  }, null, 2));
  return dir;
}

function apagar(dir) {
  try {
    const saida = execFileSync('node', ['ferramentas/ramos-mortos.js', '--apagar'],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { codigo: 0, saida };
  } catch (e) {
    return { codigo: e.status === undefined ? -1 : e.status, saida: String(e.stdout || '') + String(e.stderr || '') };
  }
}

// A pergunta que decide tudo: a LINHA DE COMANDO daquele ref saiu, ou não saiu?
function mandaApagar(saida, ref) {
  return saida.split('\n').some((l) => l.trim() === 'git push origin --delete ' + ref);
}

console.log('programa sob teste: ' + PROGRAMA);
console.log('');

// ── CENA 0 — CONTROLE POSITIVO: sem mão em cima, o --apagar continua apagando ──────────────────
{
  const r = apagar(montar(FONTE, { alvo: 'concluido', vizinho: 'concluido' }, 'main'));
  ok(r.codigo === 0 && mandaApagar(r.saida, 'entrega/alvo') && mandaApagar(r.saida, 'entrega/vizinho'),
    'CONTROLE POSITIVO: com os dois itens concluídos e HEAD na main, o --apagar cospe os DOIS comandos e sai 0',
    'exit ' + r.codigo + '\n' + r.saida);
}

// ── CENA 1 — TRAVA 1: item em-curso ────────────────────────────────────────────────────────────
{
  const r = apagar(montar(FONTE, { alvo: 'em-curso', vizinho: 'concluido' }, 'main'));
  ok(!mandaApagar(r.saida, 'entrega/alvo'),
    'item EM-CURSO: o comando de apagar `entrega/alvo` NÃO sai na lista colável',
    'exit ' + r.codigo + '\n' + r.saida);
  ok(r.codigo !== 0,
    'item EM-CURSO: o --apagar sai com código != 0, para a recusa não passar batida num log longo',
    'exit ' + r.codigo + '\n' + r.saida);
  ok(/RECUSADO/.test(r.saida) && /entrega\/alvo/.test(r.saida) && /EM-CURSO/.test(r.saida),
    'item EM-CURSO: a mensagem NOMEIA o ramo e diz o motivo',
    'exit ' + r.codigo + '\n' + r.saida);
  ok(mandaApagar(r.saida, 'entrega/vizinho'),
    'item EM-CURSO: os OUTROS ramos continuam saindo — a recusa pula o ramo, não aborta a lista',
    'exit ' + r.codigo + '\n' + r.saida);
}

// ── CENA 2 — TRAVA 2: o ramo do HEAD ───────────────────────────────────────────────────────────
{
  const r = apagar(montar(FONTE, { alvo: 'concluido', vizinho: 'concluido' }, 'entrega/alvo'));
  ok(!mandaApagar(r.saida, 'entrega/alvo'),
    'ramo do HEAD: o comando de apagar o próprio ramo NÃO sai na lista colável',
    'exit ' + r.codigo + '\n' + r.saida);
  ok(r.codigo !== 0,
    'ramo do HEAD: o --apagar sai com código != 0',
    'exit ' + r.codigo + '\n' + r.saida);
  ok(/RECUSADO/.test(r.saida) && /entrega\/alvo/.test(r.saida) && /HEAD/.test(r.saida),
    'ramo do HEAD: a mensagem NOMEIA o ramo e diz que é o HEAD',
    'exit ' + r.codigo + '\n' + r.saida);
  ok(mandaApagar(r.saida, 'entrega/vizinho'),
    'ramo do HEAD: os OUTROS ramos continuam saindo',
    'exit ' + r.codigo + '\n' + r.saida);
}

// ── INJEÇÃO 1 — a trava do em-curso, sozinha ───────────────────────────────────────────────────
// UMA condição trocada por `false`. A trava do HEAD fica intacta de propósito: é isso que separa
// "esta trava morde" de "existe alguma trava aí".
{
  const doente = FONTE.replace("if (item && item.estado === 'em-curso') {", 'if (false) {');
  ok(doente !== FONTE, 'a injeção 1 conseguiu desarmar SÓ a trava do em-curso');
  const r = apagar(montar(doente, { alvo: 'em-curso', vizinho: 'concluido' }, 'main'));
  ok(mandaApagar(r.saida, 'entrega/alvo') && r.codigo === 0,
    'CONTROLE: sem a trava do em-curso, o ramo com mão em cima volta a sair na lista e o exit volta a 0 — a cena 1 morde',
    'exit ' + r.codigo + '\n' + r.saida);
}

// ── INJEÇÃO 2 — a trava do HEAD, sozinha ───────────────────────────────────────────────────────
{
  const doente = FONTE.replace('if (RAMO_ATUAL && nome === RAMO_ATUAL) {', 'if (false) {');
  ok(doente !== FONTE, 'a injeção 2 conseguiu desarmar SÓ a trava do HEAD');
  const r = apagar(montar(doente, { alvo: 'concluido', vizinho: 'concluido' }, 'entrega/alvo'));
  ok(mandaApagar(r.saida, 'entrega/alvo') && r.codigo === 0,
    'CONTROLE: sem a trava do HEAD, o próprio ramo volta a sair na lista e o exit volta a 0 — a cena 2 morde',
    'exit ' + r.codigo + '\n' + r.saida);
}

// ── CENA 3 — o relatório sem `--apagar` continua sendo relatório ───────────────────────────────
// O cabeçalho do programa promete: *"lista, e SAI 0 (é relatório, não portão)"*. A trava não pode
// transformar a listagem num portão, senão quem só quer olhar passa a receber vermelho.
{
  const dir = montar(FONTE, { alvo: 'em-curso', vizinho: 'concluido' }, 'entrega/alvo');
  let codigo = 0;
  let saida = '';
  try {
    saida = execFileSync('node', ['ferramentas/ramos-mortos.js'],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    codigo = e.status === undefined ? -1 : e.status;
    saida = String(e.stdout || '') + String(e.stderr || '');
  }
  ok(codigo === 0, 'sem --apagar, a listagem continua saindo 0 mesmo com ramo recusado presente',
    'exit ' + codigo + '\n' + saida);
  ok(/⛔ RECUSADO no --apagar/.test(saida),
    'e a listagem já marca o ramo recusado, para quem apaga à mão a partir da seção MORTOS',
    saida);
}

fs.rmSync(palco, { recursive: true, force: true });

console.log('');
console.log(falhas ? 'REPROVOU — ' + falhas + ' de ' + checagens : 'PASSOU — ' + checagens + ' checagens');
process.exit(falhas ? 1 : 0);
