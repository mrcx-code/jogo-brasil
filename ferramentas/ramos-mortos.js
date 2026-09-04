#!/usr/bin/env node
// RAMOS MORTOS — a varredura que toda rodada vinha refazendo à mão.
//
//   node ferramentas/ramos-mortos.js            lista, e SAI 0 (é relatório, não portão)
//   node ferramentas/ramos-mortos.js --apagar   imprime os comandos de apagar, um por linha
//   node ferramentas/ramos-mortos.js --so-vivos só o que está de pé de verdade
//
// POR QUE EXISTE. O PLANTÃO §7 já tem as duas regras que decidem isto, e as duas custaram uma
// rodada cada: *"o marcador `voo/` é pista, nunca prova — quem decide é o `backlog.json`"* (01/09)
// e *"antes de devolver item a `livre`, procure o ramo `entrega/<id>`"* (01/09). O que faltava era
// alguém que as APLICASSE sem que uma pessoa tivesse de lembrar das duas ao mesmo tempo.
//
// Medido em 02/09 por `nuvem-20260902T1623`, à mão, e é o número que motivou o arquivo: a origin
// carregava **15 ramos `entrega/` e 9 `voo/`**, e os **24 estavam mortos**. Doze `entrega/` já
// eram ancestrais da `main`; os outros três (`canonical-jogo`, `dashboard-trio`,
// `glossario-substancia`) eram órfãos cujo conteúdo entrou na `main` por OUTRA rota — que é
// justamente o caso que a regra do §7 não pega sozinha, porque o ramo não é ancestral e mesmo
// assim não há trabalho a salvar. Os nove `voo/` apontavam para item `concluido` ou para item que
// nem existe mais.
//
// A CONSEQUÊNCIA DE NÃO TER ISTO é a fila secar por sujeira: a nuvem **cria** marcador e nunca o
// apaga (403 do GitHub, re-medido nesta data pela quarta vez — exit real 1, e a última linha do
// log ainda diz `Everything up-to-date`, que é a armadilha). Rodando de 4 em 4 horas, sem
// varredura todo item que ela tocar passa a PARECER ocupado para sempre, com trabalho livre
// embaixo.
//
// ESTE ARQUIVO NÃO APAGA NADA, DE PROPÓSITO. Ele classifica e imprime. Apagar é da máquina que
// tem `delete_ref` (Mac e Windows); a nuvem cola a saída do `--apagar` no RECADOS e segue. Um
// programa que apaga ref remota sozinho é exatamente o tipo de coisa que não se quer rodando
// sem alguém olhando.
//
// ⚠ E POR ISSO MESMO O `--apagar` TEM DUAS TRAVAS — achado do QA em 04/09, no gap-check de uma
// entrega vizinha. A rede de segurança do `--apagar` era a linha *"confira a lista acima antes de
// colar"*, e essa linha pede exatamente a coisa que a divisão de trabalho torna impossível: quem
// TEM `delete_ref` é o Mac e o Windows (a nuvem sai 403), então quem cola é justamente quem **não
// acompanhou a rodada que criou o ramo** e não tem como conferir nada. Uma instrução dirigida a
// alguém que não pode cumpri-la não é proteção; é a ausência de proteção com nome de proteção.
// As duas travas estão em `recusaDe()`, lá embaixo, e cada uma tem cena e injeção em
// `test/ramos-mortos-apagar-travas.js`.
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const APAGAR = process.argv.includes('--apagar');
const SO_VIVOS = process.argv.includes('--so-vivos');

// Duas horas — a mesma validade que o guarda do lock usa. Medida em 23/08 sobre rodadas de 2 a
// 67 min; as 12 h da proposta original eram chute.
const VALIDADE_MS = 2 * 60 * 60 * 1000;

function git(...args) {
  return execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function refsRemotos(padrao) {
  const saida = git('ls-remote', '--heads', 'origin', padrao).trim();
  if (!saida) return [];
  return saida.split('\n').map((l) => {
    const [sha, ref] = l.split('\t');
    return { sha, ref, id: ref.replace(/^refs\/heads\/(voo|entrega)\//, '') };
  });
}

// ⚠ O VEREDITO TEM TRÊS ESTADOS, E ISSO NÃO É PREGUIÇA DE DECIDIR — É O DEFEITO QUE ESTA
// FUNÇÃO TINHA (achado em 03/09 por `nuvem-20260903T1623`).
//
// A versão anterior era `try { merge-base --is-ancestor } catch { return false }`, e o `catch`
// engolia DUAS causas diferentes como se fossem uma: "medi e o sha não é ancestral" (que é um
// órfão de verdade) e "não consigo medir porque o sha não está no disco" (que não é resposta
// nenhuma). O `ls-remote` lê o sha do SERVIDOR; num clone raso esse commit não está aqui, o
// `git` sai diferente de zero, e o `false` vira a palavra **ÓRFÃO** num relatório que a rodada
// usa para decidir o que auditar.
//
// Medido nesta data com ESTE MESMO arquivo, em quatro clones do mesmo repositório, contando os
// 32 ramos `entrega/` que a origin carregava:
//
//   | clone                       | ancestrais | declarados ÓRFÃO |
//   | clone profundo (unshallow)  |     29     |        3         |  ← a verdade
//   | --depth=186 (551 commits)   |     29     |        3         |
//   | --depth=20  (50 commits)    |      7     |       25         |
//   | --depth=1                   |      0     |    32 de 32      |
//
// E a nuvem **sempre** clona raso. O PLANTÃO §7 manda *"auditar e integrar"* todo `entrega/`
// órfão, então no pior caso o instrumento manda a rodada reintegrar o repositório inteiro —
// no lugar exato onde se decide o que despachar. É a mesma doença que a casa caça nos portões
// (afirmação que o objeto não cumpre), invertida: em vez de assinar de verde o que está
// quebrado, ele assina de vermelho o que está pronto, e fabrica trabalho que não existe.
//
// A regra que fica: **"não sei" é um desfecho, e tem de aparecer com esse nome.** Órfão só se
// alguém mediu.
function temCommit(sha) {
  try {
    execFileSync('git', ['cat-file', '-e', sha + '^{commit}'], { cwd: RAIZ, stdio: 'ignore' });
    return true;
  } catch (_) {
    return false;
  }
}

// Devolve 'ancestral' | 'orfao' | 'desconhecido'. Nunca chute — ver o bloco acima.
function classificar(sha, de) {
  if (!temCommit(sha)) return 'desconhecido';
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', sha, de], { cwd: RAIZ, stdio: 'ignore' });
    return 'ancestral';
  } catch (e) {
    // `--is-ancestor` sai 1 para "não é ancestral" e ≥128 para erro de verdade (objeto faltando
    // do lado da `main`, repositório corrompido). Só o 1 é uma resposta.
    return e.status === 1 ? 'orfao' : 'desconhecido';
  }
}

// A VERDADE É O BACKLOG (PLANTÃO §7). O marcador é pista.
const bruto = JSON.parse(fs.readFileSync(path.join(RAIZ, 'ferramentas', 'backlog.json'), 'utf8'));
const itens = Array.isArray(bruto) ? bruto : bruto.itens || Object.values(bruto);
const porId = new Map(itens.map((i) => [i.id, i]));

// Sem a `origin/main` fresca a resposta sobre `entrega/` sai errada para o lado perigoso: um ramo
// já integrado pareceria órfão, e alguém iria "auditar e integrar" o que já está dentro.
try {
  git('fetch', 'origin', 'main', '--quiet');
} catch (e) {
  console.log('AVISO: não consegui buscar a origin/main (' + e.message.split('\n')[0] + ').');
  console.log('       A classificação de `entrega/` abaixo pode estar velha.');
}

// A TRAVA DE ITEM EM-CURSO NÃO PODE CONFIAR SÓ NO DISCO LOCAL — achado do QA em 04/09. O
// `backlog.json` deste clone pode estar atrás da origin: outra máquina trava um item minutos antes
// desta leitura, e sem isto o item parece `livre` aqui enquanto já está `em-curso` lá. Depois do
// `fetch` acima, lemos também o backlog QUE A ORIGIN TEM, e a origin decide em caso de conflito —
// é ela quem qualquer outra máquina publicou por último. Recuo automático para o disco se o `show`
// falhar (rede fora, clone sem esse commit ainda, etc.), e o recuo é DITO, nunca silencioso: quem
// lê a saída precisa saber qual fonte valeu antes de confiar na trava.
let fonteBacklog = 'disco local';
try {
  const brutoRemoto = JSON.parse(git('show', 'origin/main:ferramentas/backlog.json'));
  const itensRemoto = Array.isArray(brutoRemoto) ? brutoRemoto : brutoRemoto.itens || Object.values(brutoRemoto);
  for (const item of itensRemoto) porId.set(item.id, item); // origin decide em caso de conflito
  fonteBacklog = 'disco local + origin/main (união; origin decide em conflito)';
} catch (e) {
  fonteBacklog = 'SÓ disco local — recuo automático: git show origin/main:ferramentas/backlog.json falhou (' + e.message.split('\n')[0] + ')';
}
console.log('backlog usado para a trava de item em-curso: ' + fonteBacklog);
console.log('');
// O CLONE RASO SE CONSERTA ANTES DE MEDIR, não depois de errar. O contêiner da nuvem clona com
// profundidade limitada (medido em 03/09: 186 commits no clone da sessão), e sem isto a tabela do
// bloco `classificar` acontece de novo toda rodada. `--unshallow` é uma busca só, custa segundos,
// e é o que torna a resposta a mesma nas três máquinas.
let raso = false;
try {
  raso = git('rev-parse', '--is-shallow-repository').trim() === 'true';
} catch (_) { /* git antigo não conhece a opção; segue como profundo */ }
if (raso) {
  console.log('AVISO: este clone é RASO — a ancestralidade não é mensurável assim. Aprofundando…');
  try {
    git('fetch', '--unshallow', 'origin', '--quiet');
    raso = git('rev-parse', '--is-shallow-repository').trim() === 'true';
    console.log(raso ? '       ainda raso. Os `entrega/` sairão como DESCONHECIDO, nunca como ÓRFÃO.'
      : '       pronto: clone completo, o veredito abaixo vale.');
  } catch (e) {
    console.log('       não consegui (' + e.message.split('\n')[0] + ').');
    console.log('       Os `entrega/` sairão como DESCONHECIDO — rode `git fetch --unshallow` e repita.');
  }
  console.log('');
}

// E O `--unshallow` SOZINHO NÃO BASTA — medido em 03/09, e é a metade que faltava.
// `git clone --depth=N` implica `--single-branch`: o clone traz `main` e mais nada. Aprofundar
// deepens a história DA MAIN; os tips de `entrega/*` continuam sem estar no disco, então o
// `ls-remote` segue devolvendo shas que este repositório nunca viu. Sem esta busca, o conserto
// acima troca um erro por outro: em vez de chamar de ÓRFÃO o que não enxerga, chamaria tudo de
// DESCONHECIDO — honesto, e inútil.
try {
  git('fetch', 'origin', '--quiet', '+refs/heads/entrega/*:refs/remotes/origin/entrega/*');
} catch (e) {
  console.log('AVISO: não consegui buscar os ramos `entrega/` (' + e.message.split('\n')[0] + ').');
  console.log('       O que faltar sairá como NÃO MEDIDO abaixo — nunca como ÓRFÃO.');
  console.log('');
}

const MAIN = git('rev-parse', 'origin/main').trim();

const mortos = [];
const vivos = [];
const naoSei = [];

for (const r of refsRemotos('refs/heads/voo/*')) {
  const item = porId.get(r.id);
  if (!item) {
    mortos.push([r.ref, 'o item nem existe mais no backlog']);
  } else if (item.estado === 'concluido') {
    mortos.push([r.ref, 'item concluido']);
  } else if (item.estado === 'livre') {
    mortos.push([r.ref, 'item livre — marcador mente, o backlog manda']);
  } else if (item.estado === 'em-curso') {
    const desde = item.desde ? Date.parse(item.desde) : NaN;
    const idade = Number.isNaN(desde) ? null : Date.now() - desde;
    if (idade === null) {
      mortos.push([r.ref, 'em-curso SEM `desde` — a trava não sustenta, trate como livre']);
    } else if (idade > VALIDADE_MS) {
      mortos.push([r.ref, 'em-curso vencido (' + Math.round(idade / 6e4) + ' min > 120)']);
    } else {
      vivos.push([r.ref, 'em voo há ' + Math.round(idade / 6e4) + ' min por ' + (item.maquina || '?')]);
    }
  } else {
    vivos.push([r.ref, 'item ' + item.estado]);
  }
}

for (const r of refsRemotos('refs/heads/entrega/*')) {
  const veredito = classificar(r.sha, MAIN);
  if (veredito === 'ancestral') {
    mortos.push([r.ref, 'já é ancestral da origin/main — consumido pelo funil']);
    continue;
  }
  const item = porId.get(r.id);
  const estado = item ? item.estado : 'sem item';
  if (veredito === 'desconhecido') {
    // NÃO É ÓRFÃO — é ausência de medição, e a diferença é a razão de este bucket existir.
    naoSei.push([r.ref, 'o commit ' + r.sha.slice(0, 7) + ' não está neste clone · backlog: ' + estado]);
    continue;
  }
  // Órfão de VERDADE: tem commit que a `main` não tem. Pode ser trabalho a salvar — ou pode ser
  // trabalho que entrou por outra rota, e só quem olhar o diff sabe. Nunca chute aqui.
  vivos.push([
    r.ref,
    'ÓRFÃO (não está na main) · backlog: ' + estado + ' · confira antes: git diff origin/main...' + r.sha.slice(0, 7),
  ]);
}

// ── AS TRÊS TRAVAS DO `--apagar` ──────────────────────────────────────────────────────────────
// Elas não corrigem a CLASSIFICAÇÃO — um ramo recusado aqui continua morto pelo critério que o
// pôs em MORTOS. Elas param a única coisa **irreversível** que sai deste arquivo: a linha
// `git push origin --delete`, que outra máquina cola sem contexto.
//
// TRAVA 1 — `entrega/<id>` cujo item está `em-curso` no backlog. A pergunta que ela responde não é
// "o trabalho já está na main?" (a classificação responde isso, contra um `origin/main` buscado
// AGORA), e sim "alguém ainda vai empurrar para este ramo?". Entre a medição e a colagem passam
// minutos ou horas, em máquinas diferentes; um ramo ancestral às 10h pode ter commit novo às 11h,
// e a corrida é real porque o PLANTÃO despacha em paralelo. `em-curso` é a declaração de que há
// mão no ramo, e é a única informação que este arquivo tem sobre o FUTURO dele.
//
// Só vale para `entrega/`, e a exclusão do `voo/` é deliberada: a expiração de 2 h do marcador
// (`VALIDADE_MS`) é uma decisão medida em 23/08 sobre rodadas de 2 a 67 min, e existe justamente
// para que marcador esquecido de item `em-curso` VÁ para MORTOS. Estender a trava ao `voo/`
// desfaria a regra do §7 (*"o marcador é pista, nunca prova"*) por um efeito colateral.
//
// TRAVA 2 — o ramo do HEAD desta cópia. Serrar o galho em que se está sentado nunca é o que se
// quis: quem roda o comando de dentro do worktree da própria entrega vê o remoto sumir embaixo do
// que está commitando. HEAD solto (detached) não é ramo e não tem o que proteger.
//
// TRAVA 2b — o ramo do HEAD de QUALQUER worktree IRMÃO do mesmo clone, não só desta cópia. Achado
// do QA em 04/09: um agente que roda `--apagar` de uma cópia parada na `main` não via o ramo que
// outro agente do MESMO clone está com `entrega/<x>` checked-out num worktree vizinho — `rev-parse
// HEAD` só enxerga a própria árvore de trabalho. `git worktree list --porcelain` enxerga todas.
//
// TRAVA 1 — item `em-curso` que é PREFIXO de `<x>` na fronteira `-`, não só igual. Achado do QA
// em 04/09: `entrega/<id>-qa` (o ramo de revisão de uma entrega que ainda está em-curso) passava
// incólume porque a comparação antiga era só `porId.get(m[1])`, igualdade exata. A fronteira TEM
// de ser o hífen — `censo-foto` não pode recusar `entrega/censo-fotografia`, que é outro id.
//
// A ESCOLHA: PULA O RECUSADO, NÃO ABORTA A LISTA — e o motivo é o comportamento de quem lê.
// Abortar tudo devolveria uma saída sem comando nenhum, e a pessoa que precisa apagar 14 ramos
// mortos escreveria os 14 à mão a partir da seção MORTOS — sem trava nenhuma, que é pior que o
// estado de hoje. Pulando, a lista colável sai COMPLETA e SEGURA (os recusados não estão nela),
// o bloco RECUSADO diz nome e motivo, e o **exit != 0** é o que impede a recusa de passar
// despercebida num log longo.
function ramoDoHEAD() {
  try {
    const nome = git('rev-parse', '--abbrev-ref', 'HEAD').trim();
    return nome && nome !== 'HEAD' ? nome : null;
  } catch (_) {
    return null;
  }
}

const RAMO_ATUAL = ramoDoHEAD();

// Todo ramo com HEAD em algum worktree DESTE CLONE — o principal (onde `--apagar` está rodando) e
// cada `git worktree add` irmão. O `RAMO_ATUAL` já entra aqui (a própria cópia é um worktree do
// clone), e fica calculado à parte só como FALLBACK: se `git worktree list` falhar ou não existir
// (git antigo), a proteção da própria cópia continua de pé por `rev-parse --abbrev-ref HEAD`, que
// é um comando mais velho e mais simples. Worktree com HEAD destacado (sem `branch`) não entra —
// não é ramo, não tem o que proteger.
function ramosProtegidosPorWorktree() {
  const ramos = new Set();
  if (RAMO_ATUAL) ramos.add(RAMO_ATUAL);
  try {
    const saida = git('worktree', 'list', '--porcelain');
    for (const bloco of saida.split(/\n\n+/)) {
      const m = /^branch refs\/heads\/(.+)$/m.exec(bloco);
      if (m) ramos.add(m[1]);
    }
  } catch (_) { /* sem suporte a worktree ou comando falhou: só o RAMO_ATUAL acima fica protegido */ }
  return ramos;
}

const RAMOS_PROTEGIDOS = ramosProtegidosPorWorktree();

// Devolve o item `em-curso` cujo id CASA com `alvo` — igual, ou prefixo dele na fronteira `-`.
// `null` se nenhum casar. Nunca usa substring crua: o caractere seguinte ao id tem de ser `-`.
function itemEmCursoQueCasa(alvo) {
  const exato = porId.get(alvo);
  if (exato && exato.estado === 'em-curso') return exato;
  for (const item of porId.values()) {
    if (item.estado === 'em-curso' && alvo.startsWith(item.id + '-')) return item;
  }
  return null;
}

// Devolve o motivo da recusa, ou `null` se o ref pode entrar na lista de apagar.
function recusaDe(ref) {
  const nome = ref.replace(/^refs\/heads\//, '');
  if (RAMOS_PROTEGIDOS.has(nome)) {
    return nome === RAMO_ATUAL
      ? 'É O RAMO DO HEAD desta cópia — não se apaga o galho em que se está sentado'
      : 'está com HEAD em OUTRO WORKTREE deste clone — não se apaga o galho em que uma cópia irmã está sentada';
  }
  const m = /^entrega\/(.+)$/.exec(nome);
  if (m) {
    const item = itemEmCursoQueCasa(m[1]);
    if (item) {
      const porPrefixo = item.id !== m[1];
      return 'o item `' + item.id + '` está EM-CURSO no backlog'
        + (item.maquina ? ' (' + item.maquina + ')' : '')
        + (porPrefixo ? ' — `' + nome + '` começa com o id dele na fronteira `-`' : '')
        + ' — pode haver commit novo depois desta medição';
    }
  }
  return null;
}

if (!SO_VIVOS) {
  console.log('MORTOS — ' + mortos.length + ' ref(s), nada a salvar:');
  for (const [ref, por] of mortos) {
    const recusa = recusaDe(ref);
    console.log('  ' + ref.padEnd(46) + ' ' + por + (recusa ? ' · ⛔ RECUSADO no --apagar' : ''));
  }
  if (!mortos.length) console.log('  (nenhum)');
  console.log('');
}

console.log('DE PÉ — ' + vivos.length + ' ref(s), NÃO apague sem olhar:');
for (const [ref, por] of vivos) console.log('  ' + ref.padEnd(46) + ' ' + por);
if (!vivos.length) console.log('  (nenhum)');

// Sai por último e com o nome próprio: quem lê tem de ver que ninguém mediu estes, em vez de
// ler um "órfão" que o programa inventou por não enxergar. Não entram na lista do `--apagar`.
if (naoSei.length) {
  console.log('');
  console.log('NÃO MEDIDO — ' + naoSei.length + ' ref(s). Isto NÃO quer dizer órfão:');
  for (const [ref, por] of naoSei) console.log('  ' + ref.padEnd(46) + ' ' + por);
  console.log('  → `git fetch --unshallow origin` (ou `git fetch origin <ref>`) e rode de novo.');
}

if (APAGAR) {
  const recusados = [];
  const liberados = [];
  for (const [ref] of mortos) {
    const por = recusaDe(ref);
    if (por) recusados.push([ref, por]);
    else liberados.push(ref);
  }

  console.log('');
  console.log('# Para a máquina que TEM delete_ref (Mac, Windows). A nuvem leva 403 aqui.');
  console.log('# Esta lista já saiu SEM os refs recusados abaixo — colar o bloco inteiro é seguro.');
  for (const ref of liberados) console.log('git push origin --delete ' + ref.replace('refs/heads/', ''));
  if (!liberados.length) console.log('# (nenhum ref liberado para apagar)');

  if (recusados.length) {
    console.log('');
    console.log('RECUSADO — ' + recusados.length + ' ref(s) que este arquivo NÃO manda apagar:');
    for (const [ref, por] of recusados) console.log('  ' + ref.replace('refs/heads/', '').padEnd(46) + ' ' + por);
    console.log('');
    console.log('Nada foi apagado — este arquivo nunca apaga. Para apagar um destes mesmo assim, é');
    console.log('à mão e de olho aberto: mude o item no backlog (ou saia deste ramo) e rode de novo.');
    // `exitCode` em vez de `process.exit(1)`: a saída acima ainda pode estar na fila do pipe, e o
    // `exit` a corta no Windows. Este bloco é a última coisa do arquivo, então basta marcar.
    process.exitCode = 1;
  }
}
