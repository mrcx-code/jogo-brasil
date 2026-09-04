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
// A PRIMEIRA VERSÃO (95a3ea4) cobria duas travas e o próprio QA achou TRÊS buracos nela, todos
// medidos e fechados aqui:
//   1. `entrega/<id>` cujo item está `em-curso` casava só por IGUALDADE — `entrega/<id>-qa` (o
//      ramo de revisão de uma entrega ainda em-curso) passava incólume;
//   2. o ramo do HEAD só olhava ESTA cópia — um ramo checked-out num worktree IRMÃO do mesmo
//      clone (outro agente, mesma máquina) não era visto;
//   3. o item em-curso vinha só do `backlog.json` local, que pode estar atrás da origin.
//
// E COBRA A METADE QUE FAZ AS TRÊS VALEREM ALGUMA COISA (CENA 0): o `--apagar` continua cuspindo
// o comando para os ramos que ESTÃO liberados, e sai 0. Um portão que só cobrasse "recuse" seria
// atendido por um programa que parou de imprimir qualquer comando — a forma mais barata de ficar
// verde, e a que esta casa mais persegue (EQUIPE.md §2.8).
//
// AS INJEÇÕES no fim provam a mordida uma trava de cada vez, cada uma trocando UMA condição por um
// comportamento mais fraco (nunca as duas ao mesmo tempo) — foi esse exatamente o buraco que o QA
// achou no portão irmão (`ramos-mortos-veredito.js`, cena 4) em 03/09: injeção que derruba duas
// coisas juntas prova "existe alguma trava aí", nunca "esta trava aqui morde".
//
// NÃO USA REDE: monta repositório de mentira em `os.tmpdir()` e clona por `file://`, como os dois
// portões irmãos. A trava do backlog-desatualizado (item 3) É exercitada aqui via `git show
// origin/main:...` contra o clone de mentira — o clone TEM um `origin/main` de verdade (é um clone
// normal, não bare), só não tem `ferramentas/backlog.json` commitado nele (os testes escrevem esse
// arquivo direto no disco, sem commitar), então o caminho de recuo é o que roda nestas cenas. A
// UNIÃO com sucesso (quando o `show` acha o arquivo) é exercitada à parte, contra um clone que
// COMMITA o backlog.
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
// QUATRO ramos `entrega/`, todos já consumidos pela `main` — quer dizer: todos entram em MORTOS
// pelo critério que já existia, e a classificação NÃO é o que este portão mede. O que muda de cena
// para cena é só o backlog e o HEAD (ou os worktrees), que é onde as travas moram.
//   - alvo         : o ramo cujo item costuma estar em-curso
//   - vizinho      : controle — nunca tem item no backlog, tem de sair sempre que liberado
//   - alvo-qa      : o par PREFIXO real (o padrão medido: ramo de revisão de uma entrega em-curso)
//   - alvografia   : controle NEGATIVO do prefixo — começa com as mesmas letras de "alvo", mas a
//                    fronteira não é `-`, então "alvo" em-curso NÃO pode recusá-lo
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
for (const nome of ['alvo', 'vizinho', 'alvo-qa', 'alvografia']) {
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

// ── CENA 1 — TRAVA 1: item em-curso, IGUALDADE ─────────────────────────────────────────────────
{
  const r = apagar(montar(FONTE, { alvo: 'em-curso', vizinho: 'concluido' }, 'main'));
  ok(!mandaApagar(r.saida, 'entrega/alvo'),
    'item EM-CURSO (igualdade): o comando de apagar `entrega/alvo` NÃO sai na lista colável',
    'exit ' + r.codigo + '\n' + r.saida);
  ok(r.codigo !== 0,
    'item EM-CURSO (igualdade): o --apagar sai com código != 0, para a recusa não passar batida num log longo',
    'exit ' + r.codigo + '\n' + r.saida);
  ok(/RECUSADO/.test(r.saida) && /entrega\/alvo/.test(r.saida) && /EM-CURSO/.test(r.saida),
    'item EM-CURSO (igualdade): a mensagem NOMEIA o ramo e diz o motivo',
    'exit ' + r.codigo + '\n' + r.saida);
  ok(mandaApagar(r.saida, 'entrega/vizinho'),
    'item EM-CURSO (igualdade): os OUTROS ramos continuam saindo — a recusa pula o ramo, não aborta a lista',
    'exit ' + r.codigo + '\n' + r.saida);
}

// ── CENA 1b — TRAVA 1: item em-curso, PREFIXO na fronteira `-` ────────────────────────────────
// O par real medido pelo QA em 04/09: `censo-foto` / `entrega/censo-foto-qa`. Aqui: item em-curso
// `alvo` tem de recusar `entrega/alvo-qa` (fronteira `-`, o padrão de um ramo de revisão) E NÃO
// pode recusar `entrega/alvografia` (mesmas letras iniciais, fronteira não é `-` — outro id).
{
  const r = apagar(montar(FONTE, { alvo: 'em-curso', vizinho: 'concluido' }, 'main'));
  ok(!mandaApagar(r.saida, 'entrega/alvo-qa'),
    'item EM-CURSO (prefixo): `entrega/alvo-qa` (o par -qa de um item em-curso) NÃO sai na lista colável',
    'exit ' + r.codigo + '\n' + r.saida);
  ok(/RECUSADO/.test(r.saida) && /entrega\/alvo-qa/.test(r.saida),
    'item EM-CURSO (prefixo): a mensagem NOMEIA `entrega/alvo-qa` entre os recusados',
    r.saida);
  ok(mandaApagar(r.saida, 'entrega/alvografia'),
    'CONTROLE — falso-positivo simétrico: `entrega/alvografia` (começa igual, fronteira não é `-`) CONTINUA saindo',
    'exit ' + r.codigo + '\n' + r.saida);
  ok(mandaApagar(r.saida, 'entrega/vizinho'),
    'item EM-CURSO (prefixo): o ramo sem relação nenhuma continua saindo',
    'exit ' + r.codigo + '\n' + r.saida);
}

// ── CENA 2 — TRAVA 2: o ramo do HEAD desta cópia ───────────────────────────────────────────────
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

// ── CENA 2b — TRAVA 2: o ramo checked-out num WORKTREE IRMÃO do mesmo clone ───────────────────
// A cópia que RODA o --apagar fica na `main` (HEAD normal); um worktree IRMÃO do MESMO clone tem
// `entrega/alvo` checked-out. `git worktree list` é o que enxerga isso — `rev-parse HEAD` da cópia
// que roda o comando nunca veria.
{
  const dir = montar(FONTE, { alvo: 'concluido', vizinho: 'concluido' }, 'main');
  const irmao = dir + '-irmao';
  git(dir, 'worktree', 'add', '--quiet', irmao, 'entrega/alvo');
  const r = apagar(dir);
  ok(!mandaApagar(r.saida, 'entrega/alvo'),
    'worktree IRMÃO: `entrega/alvo` (checked-out num worktree irmão, não no HEAD desta cópia) NÃO sai na lista colável',
    'exit ' + r.codigo + '\n' + r.saida);
  ok(r.codigo !== 0,
    'worktree IRMÃO: o --apagar sai com código != 0',
    'exit ' + r.codigo + '\n' + r.saida);
  ok(/RECUSADO/.test(r.saida) && /entrega\/alvo/.test(r.saida) && /WORKTREE/.test(r.saida),
    'worktree IRMÃO: a mensagem NOMEIA o ramo e diz que é outro worktree',
    'exit ' + r.codigo + '\n' + r.saida);
  ok(mandaApagar(r.saida, 'entrega/vizinho'),
    'worktree IRMÃO: os OUTROS ramos continuam saindo',
    'exit ' + r.codigo + '\n' + r.saida);
  git(dir, 'worktree', 'remove', '--force', irmao);
}

// ── CENA 3b — TRAVA 3: o item em-curso vem também da origin, não só do disco local ─────────────
// O `backlog.json` deste clone diz `alvo: livre` (ou nem tem o item) — mas a ORIGIN, cujo commit
// mais recente TEM `ferramentas/backlog.json` commitado com `alvo: em-curso`, é mais nova. O
// `--apagar` tem de enxergar a origin e recusar mesmo assim.
{
  const origemComBacklog = path.join(palco, 'origem-backlog');
  fs.mkdirSync(origemComBacklog);
  git(origemComBacklog, 'init', '--quiet', '--initial-branch=main');
  git(origemComBacklog, 'config', 'user.email', 'palco@exemplo.invalido');
  git(origemComBacklog, 'config', 'user.name', 'Palco');
  fs.writeFileSync(path.join(origemComBacklog, 'linha.txt'), 'base\n');
  fs.mkdirSync(path.join(origemComBacklog, 'ferramentas'));
  fs.writeFileSync(path.join(origemComBacklog, 'ferramentas', 'backlog.json'),
    JSON.stringify({ itens: [{ id: 'alvo', estado: 'livre' }, { id: 'vizinho', estado: 'concluido' }] }, null, 2));
  git(origemComBacklog, 'add', '-A');
  git(origemComBacklog, 'commit', '--quiet', '-m', 'base, alvo livre');
  for (const nome of ['alvo', 'vizinho']) {
    git(origemComBacklog, 'checkout', '--quiet', '-b', 'entrega/' + nome);
    fs.appendFileSync(path.join(origemComBacklog, 'linha.txt'), 'trabalho de ' + nome + '\n');
    git(origemComBacklog, 'add', '-A');
    git(origemComBacklog, 'commit', '--quiet', '-m', 'trabalho de ' + nome);
    git(origemComBacklog, 'checkout', '--quiet', 'main');
    git(origemComBacklog, 'merge', '--quiet', '--no-ff', '-m', 'Integra ' + nome, 'entrega/' + nome);
  }
  // outra máquina trava `alvo` DEPOIS — a origin avança, este clone (feito antes) não vê.
  const dir = path.join(palco, 'copia-backlog-desatualizado');
  git(palco, 'clone', '--quiet', 'file://' + origemComBacklog, dir);
  fs.writeFileSync(path.join(origemComBacklog, 'ferramentas', 'backlog.json'),
    JSON.stringify({ itens: [{ id: 'alvo', estado: 'em-curso', maquina: 'outra-maquina' }, { id: 'vizinho', estado: 'concluido' }] }, null, 2));
  git(origemComBacklog, 'add', '-A');
  git(origemComBacklog, 'commit', '--quiet', '-m', 'trava alvo em-curso');

  fs.mkdirSync(path.join(dir, 'ferramentas'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'ferramentas', 'ramos-mortos.js'), FONTE);
  // o backlog LOCAL deste clone é o de ANTES da trava — sem fetch, diria "livre".
  fs.writeFileSync(path.join(dir, 'ferramentas', 'backlog.json'),
    JSON.stringify({ itens: [{ id: 'alvo', estado: 'livre' }, { id: 'vizinho', estado: 'concluido' }] }, null, 2));

  const r = apagar(dir);
  ok(!mandaApagar(r.saida, 'entrega/alvo'),
    'backlog desatualizado: com a origin mais nova dizendo em-curso, `entrega/alvo` NÃO sai na lista mesmo com o disco local dizendo livre',
    'exit ' + r.codigo + '\n' + r.saida);
  ok(r.codigo !== 0,
    'backlog desatualizado: o --apagar sai com código != 0',
    'exit ' + r.codigo + '\n' + r.saida);
  ok(/origin\/main/.test(r.saida) && /união|uniao/i.test(r.saida),
    'backlog desatualizado: a saída DIZ qual fonte de backlog valeu (a união com a origin), nunca em silêncio',
    r.saida);
  ok(mandaApagar(r.saida, 'entrega/vizinho'),
    'backlog desatualizado: o ramo sem relação nenhuma continua saindo',
    'exit ' + r.codigo + '\n' + r.saida);
}

// ── CENA 3c — TRAVA 3: o RECUO é dito quando o `git show` na origin falha ──────────────────────
// Nas cenas 0/1/1b/2/2b o clone TEM `origin/main`, mas sem `ferramentas/backlog.json` commitado
// nele (os testes escrevem esse arquivo direto no disco) — então o recuo para o disco acontece em
// TODAS elas. Aqui só confirmamos que ele é NOMEADO, nunca silencioso.
{
  const r = apagar(montar(FONTE, { alvo: 'concluido', vizinho: 'concluido' }, 'main'));
  ok(/disco local/.test(r.saida),
    'recuo dito: quando a origin não tem o backlog commitado, a saída nomeia "disco local" como fonte',
    r.saida);
}

// ── INJEÇÃO 1 — a trava do PREFIXO, sozinha (a IGUALDADE continua de pé) ──────────────────────
// Reverte só o laço de prefixo para o comportamento antigo (`porId.get(alvo)` exato). A trava da
// igualdade (cena 1) fica intacta de propósito — é isso que separa "o prefixo morde" de "existe
// alguma trava de em-curso aí".
{
  const doente = FONTE.replace(
    "  for (const item of porId.values()) {\n"
    + "    if (item.estado === 'em-curso' && alvo.startsWith(item.id + '-')) return item;\n"
    + "  }\n"
    + '  return null;',
    '  return null;');
  ok(doente !== FONTE, 'a injeção 1 conseguiu desarmar SÓ o laço de prefixo');
  const r = apagar(montar(doente, { alvo: 'em-curso', vizinho: 'concluido' }, 'main'));
  ok(mandaApagar(r.saida, 'entrega/alvo-qa'),
    'CONTROLE: sem o laço de prefixo, `entrega/alvo-qa` volta a sair na lista colável — a cena 1b morde',
    'exit ' + r.codigo + '\n' + r.saida);
  ok(!mandaApagar(r.saida, 'entrega/alvo'),
    'e a igualdade exata (cena 1) continua recusando `entrega/alvo` — a injeção não tocou nela',
    r.saida);
}

// ── INJEÇÃO 2 — a trava do WORKTREE IRMÃO, sozinha (o HEAD desta cópia continua protegido) ────
// Reverte `ramosProtegidosPorWorktree` para só enxergar o HEAD desta cópia (o `RAMO_ATUAL`), sem
// consultar `git worktree list`. A cena 2 (HEAD desta cópia) fica intacta de propósito.
{
  const doente = FONTE.replace(
    "function ramosProtegidosPorWorktree() {\n"
    + '  const ramos = new Set();\n'
    + '  if (RAMO_ATUAL) ramos.add(RAMO_ATUAL);\n'
    + '  try {\n'
    + "    const saida = git('worktree', 'list', '--porcelain');\n"
    + '    for (const bloco of saida.split(/\\n\\n+/)) {\n'
    + '      const m = /^branch refs\\/heads\\/(.+)$/m.exec(bloco);\n'
    + '      if (m) ramos.add(m[1]);\n'
    + '    }\n'
    + "  } catch (_) { /* sem suporte a worktree ou comando falhou: só o RAMO_ATUAL acima fica protegido */ }\n"
    + '  return ramos;\n'
    + '}',
    'function ramosProtegidosPorWorktree() {\n'
    + '  const ramos = new Set();\n'
    + '  if (RAMO_ATUAL) ramos.add(RAMO_ATUAL);\n'
    + '  return ramos;\n'
    + '}');
  ok(doente !== FONTE, 'a injeção 2 conseguiu desarmar SÓ a checagem de worktrees irmãos');

  const dir = montar(doente, { alvo: 'concluido', vizinho: 'concluido' }, 'main');
  const irmao = dir + '-irmao';
  git(dir, 'worktree', 'add', '--quiet', irmao, 'entrega/alvo');
  const r = apagar(dir);
  ok(mandaApagar(r.saida, 'entrega/alvo') && r.codigo === 0,
    'CONTROLE: sem consultar `git worktree list`, `entrega/alvo` (checked-out no irmão) volta a sair na lista e o exit volta a 0 — a cena 2b morde',
    'exit ' + r.codigo + '\n' + r.saida);
  git(dir, 'worktree', 'remove', '--force', irmao);

  // e o HEAD desta PRÓPRIA cópia continua protegido pelo RAMO_ATUAL, que a injeção não tocou.
  const r2 = apagar(montar(doente, { alvo: 'concluido', vizinho: 'concluido' }, 'entrega/alvo'));
  ok(!mandaApagar(r2.saida, 'entrega/alvo'),
    'e o HEAD desta própria cópia continua recusado (cena 2) — a injeção não tocou o RAMO_ATUAL',
    'exit ' + r2.codigo + '\n' + r2.saida);
}

// ── CENA 4 — o relatório sem `--apagar` continua sendo relatório ───────────────────────────────
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
