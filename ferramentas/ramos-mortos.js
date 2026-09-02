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

function ehAncestral(sha, de) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', sha, de], { cwd: RAIZ, stdio: 'ignore' });
    return true;
  } catch (_) {
    return false;
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
const MAIN = git('rev-parse', 'origin/main').trim();

const mortos = [];
const vivos = [];

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
  if (ehAncestral(r.sha, MAIN)) {
    mortos.push([r.ref, 'já é ancestral da origin/main — consumido pelo funil']);
    continue;
  }
  // Órfão de VERDADE: tem commit que a `main` não tem. Pode ser trabalho a salvar — ou pode ser
  // trabalho que entrou por outra rota, e só quem olhar o diff sabe. Nunca chute aqui.
  const item = porId.get(r.id);
  const estado = item ? item.estado : 'sem item';
  vivos.push([
    r.ref,
    'ÓRFÃO (não está na main) · backlog: ' + estado + ' · confira antes: git diff origin/main...' + r.sha.slice(0, 7),
  ]);
}

if (!SO_VIVOS) {
  console.log('MORTOS — ' + mortos.length + ' ref(s), nada a salvar:');
  for (const [ref, por] of mortos) console.log('  ' + ref.padEnd(46) + ' ' + por);
  if (!mortos.length) console.log('  (nenhum)');
  console.log('');
}

console.log('DE PÉ — ' + vivos.length + ' ref(s), NÃO apague sem olhar:');
for (const [ref, por] of vivos) console.log('  ' + ref.padEnd(46) + ' ' + por);
if (!vivos.length) console.log('  (nenhum)');

if (APAGAR) {
  console.log('');
  console.log('# Para a máquina que TEM delete_ref (Mac, Windows). A nuvem leva 403 aqui.');
  console.log('# Confira a lista acima antes de colar — este arquivo classifica, não decide por você.');
  for (const [ref] of mortos) console.log('git push origin --delete ' + ref.replace('refs/heads/', ''));
}
