#!/usr/bin/env node
// O VEREDITO DO `ramos-mortos.js` NÃO PODE DEPENDER DA PROFUNDIDADE DO CLONE.
//
//   node test/ramos-mortos-veredito.js
//
// POR QUE EXISTE. Em 03/09, `nuvem-20260903T1623` rodou o `ferramentas/ramos-mortos.js` em quatro
// clones do MESMO repositório e recebeu quatro respostas diferentes sobre os mesmos 32 ramos
// `entrega/`:
//
//   | clone profundo (unshallow) | 29 ancestrais |  3 ÓRFÃOS  | ← a verdade
//   | --depth=186                | 29 ancestrais |  3 ÓRFÃOS  |
//   | --depth=20                 |  7 ancestrais | 25 ÓRFÃOS  |
//   | --depth=1                  |  0 ancestrais | 32 ÓRFÃOS  |
//
// A causa era uma linha: `try { merge-base --is-ancestor } catch { return false }`. O `catch`
// tratava "não é ancestral" e "não consigo ver esse commit" como a mesma coisa, e a segunda saía
// impressa com a palavra ÓRFÃO. Como o PLANTÃO §7 manda *"auditar e integrar"* todo `entrega/`
// órfão, e a nuvem SEMPRE clona raso, o instrumento fabricava trabalho que não existe — no lugar
// exato onde a rodada decide o que despachar.
//
// O QUE ESTE PORTÃO COBRA, e são as duas metades que uma sozinha não sustenta:
//   1. num clone RASO, um ramo já consumido pela `main` NUNCA sai como ÓRFÃO;
//   2. e o programa não vira covarde: um órfão de VERDADE continua saindo como ÓRFÃO.
//
// Sem a cena 2 o portão passaria com um programa que simplesmente parou de dizer órfão — que é a
// forma mais barata de ficar verde e a que esta casa mais persegue.
//
// NÃO USA REDE. Monta um repositório de mentira em `os.tmpdir()` e clona por `file://`, que é o
// único protocolo local que respeita `--depth` (um clone por caminho simples ignora a opção em
// silêncio, e foi por isso que a primeira tentativa deste teste nasceu verde sem medir nada).
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
let falhas = 0;
let checagens = 0;

function ok(cond, oque, detalhe) {
  checagens++;
  console.log((cond ? 'OK      ' : 'FALHOU  ') + oque + (cond || !detalhe ? '' : ' — ' + detalhe));
  if (!cond) falhas++;
}

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

// ── o palco ────────────────────────────────────────────────────────────────────────────────────
// `origem` ganha história suficiente para que um `--depth=1` deixe os dois ramos `entrega/` FORA
// do que o clone enxerga: é essa cegueira que o teste precisa reproduzir.
const palco = fs.mkdtempSync(path.join(os.tmpdir(), 'ramos-mortos-'));
const origem = path.join(palco, 'origem');
fs.mkdirSync(origem);

git(origem, 'init', '--quiet', '--initial-branch=main');
git(origem, 'config', 'user.email', 'palco@exemplo.invalido');
git(origem, 'config', 'user.name', 'Palco');
// `file://` recusa clonar raso de um repositório sem `receive.denyCurrentBranch` resolvido? Não —
// mas exige que o `origin` sirva o ref; um repo comum serve. Nada de bare, para o teste ficar legível.

function commitar(msg) {
  fs.appendFileSync(path.join(origem, 'linha.txt'), msg + '\n');
  git(origem, 'add', 'linha.txt');
  git(origem, 'commit', '--quiet', '-m', msg);
}

function commitarArquivo(nomeArquivo, conteudo, msg) {
  fs.writeFileSync(path.join(origem, nomeArquivo), conteudo);
  git(origem, 'add', nomeArquivo);
  git(origem, 'commit', '--quiet', '-m', msg);
}

commitar('base');

// (a) um ramo que a `main` JÁ consumiu — o caso que o defeito chamava de órfão.
git(origem, 'checkout', '--quiet', '-b', 'entrega/ja-consumido');
commitar('trabalho que foi integrado');
git(origem, 'checkout', '--quiet', 'main');
git(origem, 'merge', '--quiet', '--no-ff', '-m', 'Integra ja-consumido', 'entrega/ja-consumido');

// (b) um órfão de VERDADE — trabalho que a `main` nunca viu, em NENHUMA rota.
// `simbolo-que-nunca-chega-999` é kebab-case de 10+ letras de propósito: dá para EXTRAIR (a
// camada 2 do `extrairSimbolos` pega), e mesmo assim não aparece em lugar nenhum da main — é o
// caso que precisa continuar apontado, não o de "nada para automatizar".
git(origem, 'checkout', '--quiet', '-b', 'entrega/orfao-de-verdade');
commitar('simbolo-que-nunca-chega-999');
git(origem, 'checkout', '--quiet', 'main');

// (c) 04/09: um ramo cujo CONTEÚDO já está na main por OUTRO commit — canonical-jogo,
// glossario-substancia e dashboard-trio de verdade. A ancestralidade dá "não é ancestral"; o
// conteúdo (mesma chave, achada por `git log -S`) diz que não há nada a integrar.
git(origem, 'checkout', '--quiet', '-b', 'entrega/absorvido-por-outra-rota');
commitarArquivo('caracteristica.txt', 'chave-absorvida-em-outra-rota\n',
  'feature que ninguem integrou por aqui');
git(origem, 'checkout', '--quiet', 'main');
commitarArquivo('rota-via-outro-commit.txt', 'chave-absorvida-em-outra-rota\n',
  'implementa a mesma coisa direto na main, sem passar pelo ramo acima');

// (d) o caso que a afirmação 2 do pedido desconfiava de existir: PARCIAL — duas chaves no mesmo
// ramo, uma entra por outra rota, a outra nunca aparece. Nem "absorvido" nem "órfão" descreve
// isto sozinho, e é o rótulo que o teste abaixo cobra que exista.
git(origem, 'checkout', '--quiet', '-b', 'entrega/conteudo-misto');
commitarArquivo('misto.txt',
  'fragmento-que-entra-por-outro-lado\nfragmento-que-fica-de-fora-777\n',
  'duas metades, uma vai por outro caminho');
git(origem, 'checkout', '--quiet', 'main');
commitarArquivo('metade-que-chega.txt', 'fragmento-que-entra-por-outro-lado\n',
  'so metade do trabalho do ramo conteudo-misto chega por aqui');

// história por cima, para afundar os quatro ramos abaixo do horizonte de um `--depth=1`.
for (let i = 0; i < 12; i++) commitar('enchimento ' + i);

// ── o clone raso, que é a máquina da nuvem ────────────────────────────────────────────────────
// CADA RODADA GANHA UM CLONE NOVO, e isto não é zelo: a primeira versão deste teste reaproveitava
// um clone só e o **controle passou a mentir**. O programa conserta o clone (`--unshallow`) na
// primeira execução, então a segunda — a da injeção — já rodava sobre um repositório profundo e
// acertava mesmo com o defeito antigo dentro. Palco que guarda estado entre as cenas mede a cena
// anterior, não a atual.
let nClones = 0;
function montarRaso(fonteDoPrograma) {
  const dir = path.join(palco, 'raso' + ++nClones);
  git(palco, 'clone', '--quiet', '--depth=1', 'file://' + origem, dir);
  fs.mkdirSync(path.join(dir, 'ferramentas'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'ferramentas', 'ramos-mortos.js'), fonteDoPrograma);
  // os dois itens ficam `concluido` de propósito: assim nada aqui depende do backlog do projeto.
  fs.writeFileSync(path.join(dir, 'ferramentas', 'backlog.json'), JSON.stringify({
    itens: [
      { id: 'ja-consumido', estado: 'concluido' },
      { id: 'orfao-de-verdade', estado: 'concluido' },
    ],
  }, null, 2));
  return dir;
}

const PROGRAMA = fs.readFileSync(path.join(RAIZ, 'ferramentas', 'ramos-mortos.js'), 'utf8');

function rodarEm(dir) {
  try {
    return execFileSync('node', ['ferramentas/ramos-mortos.js'],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    return String(e.stdout || '') + String(e.stderr || '');
  }
}

const raso = montarRaso(PROGRAMA);
ok(git(raso, 'rev-parse', '--is-shallow-repository').trim() === 'true',
  'o palco realmente montou um clone RASO (senão o teste não mede nada)');

// a linha de cada ref, para julgar pelo VEREDITO e não por uma palavra solta no relatório inteiro.
// A partir de 04/09 a linha do rótulo vem seguida de evidência em linhas indentadas por baixo —
// então `linhaDe` devolve o BLOCO inteiro (rótulo + evidência), não só a primeira linha, senão os
// testes que checam "o diff --stat aparece" ou "o `git log -S` aparece" nunca acham nada.
function linhaDe(saida, ref) {
  const linhas = saida.split('\n');
  const inicio = linhas.findIndex((l) => l.indexOf('entrega/' + ref) !== -1);
  if (inicio === -1) return '';
  let fim = linhas.length;
  for (let i = inicio + 1; i < linhas.length; i++) {
    if (/^  refs\/heads\//.test(linhas[i]) || /^(MORTOS|DE PÉ|NÃO MEDIDO)/.test(linhas[i])) { fim = i; break; }
  }
  return linhas.slice(inicio, fim).join('\n').trim();
}

// em que seção (MORTOS · DE_PE · NÃO_MEDIDO) o ref caiu — é a diferença que o item cobra: um ramo
// ABSORVIDO não pode aparecer em "DE PÉ, NÃO apague sem olhar" como se fosse trabalho a integrar.
function secaoDe(saida, ref) {
  const linhas = saida.split('\n');
  const idxMortos = linhas.findIndex((l) => l.startsWith('MORTOS —'));
  const idxDePe = linhas.findIndex((l) => l.startsWith('DE PÉ —'));
  const idxNaoMedido = linhas.findIndex((l) => l.startsWith('NÃO MEDIDO —'));
  const idxRef = linhas.findIndex((l) => l.indexOf('entrega/' + ref) !== -1);
  if (idxRef === -1) return 'ausente';
  const fimDePe = idxNaoMedido === -1 ? linhas.length : idxNaoMedido;
  if (idxDePe !== -1 && idxRef > idxDePe && idxRef < fimDePe) return 'DE_PE';
  const fimMortos = idxDePe === -1 ? linhas.length : idxDePe;
  if (idxMortos !== -1 && idxRef > idxMortos && idxRef < fimMortos) return 'MORTOS';
  if (idxNaoMedido !== -1 && idxRef > idxNaoMedido) return 'NAO_MEDIDO';
  return 'indeterminada';
}

const saida = rodarEm(raso);
const lConsumido = linhaDe(saida, 'ja-consumido');
const lOrfao = linhaDe(saida, 'orfao-de-verdade');
console.log('   consumido → ' + (lConsumido || '(ausente)'));
console.log('   órfão     → ' + (lOrfao || '(ausente)'));

// CENA 1 — a que o defeito reprovava. O rótulo mudou em 04/09 (era "ÓRFÃO", agora é
// "NAO-E-ANCESTRAL, confira por conteudo" — ver o cabeçalho do programa); o que a cena cobra é a
// mesma coisa de sempre: ramo já consumido não pode carregar o rótulo de "confira por conteúdo".
ok(lConsumido.indexOf('NAO-E-ANCESTRAL') === -1,
  'num clone raso, ramo já consumido pela main NÃO sai como NAO-E-ANCESTRAL', lConsumido);

// CENA 2 — e o programa não ficou covarde para passar na cena 1.
ok(lOrfao.indexOf('NAO-E-ANCESTRAL') !== -1,
  'e um órfão de VERDADE continua saindo como NAO-E-ANCESTRAL, confira por conteudo', lOrfao);

// ── A MORDIDA, provada por injeção ────────────────────────────────────────────────────────────
// Reverte o classificador para os dois estados de antes (o `catch` que devolvia `false`) e exige
// que o portão reprove. Asserção sem controle é decoração, e decoração assinada de verde é pior
// que teste nenhum (PLANTÃO §8).
const bom = PROGRAMA;
const doente = bom
  .replace(/function classificar\(sha, de\) \{[\s\S]*?\n\}/,
    'function classificar(sha, de) {\n' +
    '  try {\n' +
    "    execFileSync('git', ['merge-base', '--is-ancestor', sha, de], { cwd: RAIZ, stdio: 'ignore' });\n" +
    "    return 'ancestral';\n" +
    "  } catch (_) { return 'orfao'; }\n" +
    '}')
  // e desarma o conserto do raso, senão o `--unshallow` sozinho já salvaria o doente.
  .replace(/git\('fetch', '--unshallow', 'origin', '--quiet'\);/,
    "throw new Error('desarmado pelo controle do portao');");

ok(doente !== bom, 'o controle conseguiu injetar o defeito antigo (senão a injeção não testa nada)');
const saidaDoente = rodarEm(montarRaso(doente));

const lConsumidoDoente = linhaDe(saidaDoente, 'ja-consumido');
console.log('   com o defeito antigo, consumido → ' + (lConsumidoDoente || '(ausente)'));
ok(lConsumidoDoente.indexOf('NAO-E-ANCESTRAL') !== -1,
  'CONTROLE: com o classificador de dois estados, o ramo consumido volta a pedir auditoria — a cena 1 morde',
  lConsumidoDoente);

// ── CENA 4 — a linha 95 sozinha, isolada ──────────────────────────────────────────────────────
// ACHADA PELO QA em 03/09, contra este próprio portão, e é o tipo de buraco que só um adversário
// externo vê: a injeção acima derruba `classificar()` **junto com** o `--unshallow`, então ela
// prova "classificador quebrado + busca quebrada" e nunca "classificador quebrado sozinho". Como
// o `--unshallow` roda ANTES de `classificar()` e já deixa `temCommit()` verdadeiro para os dois
// shas do palco, a linha `if (!temCommit(sha)) return 'desconhecido'` ficava **código morto** nas
// cenas 1-3. Um regresso de uma linha — `'desconhecido'` virando `'orfao'`, que é o defeito
// original voltando por um merge malfeito — passava **verde 3 vezes seguidas** (medido pelo QA).
//
// O que isola a linha: um clone **profundo** (nada a aprofundar) e **`--single-branch`** (os tips
// de `entrega/*` não vieram), com a busca dos refs `entrega/*` falhando. Aí `temCommit()` é falso
// de verdade, com os dois consertos do programa intactos — e a única coisa que decide o veredito
// é a linha 95. Não é cenário artificial: é exatamente o que acontece quando o `fetch` dos refs
// leva 403, rate limit ou rede caída, que o próprio programa já trata com aviso.
function montarSemEntregas(fonteDoPrograma) {
  const dir = path.join(palco, 'unico' + ++nClones);
  git(palco, 'clone', '--quiet', '--single-branch', '--branch', 'main', 'file://' + origem, dir);
  fs.mkdirSync(path.join(dir, 'ferramentas'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'ferramentas', 'ramos-mortos.js'), fonteDoPrograma);
  fs.writeFileSync(path.join(dir, 'ferramentas', 'backlog.json'), JSON.stringify({
    itens: [{ id: 'ja-consumido', estado: 'concluido' }, { id: 'orfao-de-verdade', estado: 'concluido' }],
  }, null, 2));
  return dir;
}

// a busca dos `entrega/*` falha — e SÓ ela; o `--unshallow` do programa fica intacto.
const semBusca = PROGRAMA.replace(
  /git\('fetch', 'origin', '--quiet', '\+refs\/heads\/entrega\/\*:refs\/remotes\/origin\/entrega\/\*'\);/,
  "throw new Error('busca dos refs entrega/ indisponivel (palco da cena 4)');");
ok(semBusca !== PROGRAMA, 'a cena 4 conseguiu desarmar SÓ a busca dos refs entrega/');

const semEntregas = montarSemEntregas(semBusca);
ok(git(semEntregas, 'rev-parse', '--is-shallow-repository').trim() === 'false',
  'o palco da cena 4 é PROFUNDO (senão quem responde é o --unshallow, não a linha 95)');
const saidaSemBusca = rodarEm(semEntregas);
const lSemBusca = linhaDe(saidaSemBusca, 'orfao-de-verdade');
console.log('   sem a busca dos entrega/, órfão → ' + (lSemBusca || '(ausente)'));
ok(lSemBusca.indexOf('NAO-E-ANCESTRAL') === -1 && lSemBusca.indexOf('não está neste clone') !== -1,
  'commit que o clone nunca buscou sai como NÃO MEDIDO, nunca com rótulo de conteúdo', lSemBusca);

// e o controle da cena 4: o defeito de UMA linha, com os dois consertos de pé.
const linha95Doente = semBusca.replace(
  "if (!temCommit(sha)) return 'desconhecido';",
  "if (!temCommit(sha)) return 'orfao';");
ok(linha95Doente !== semBusca, 'o controle da cena 4 conseguiu injetar o defeito de uma linha só');
const lLinha95 = linhaDe(rodarEm(montarSemEntregas(linha95Doente)), 'orfao-de-verdade');
console.log('   com a linha 95 doente, órfão → ' + (lLinha95 || '(ausente)'));
ok(lLinha95.indexOf('NAO-E-ANCESTRAL') !== -1,
  'CONTROLE: trocar só `desconhecido` por `orfao` na linha 95 volta a mentir — a cena 4 morde',
  lLinha95);

// ── e a versão profunda continua respondendo o mesmo ───────────────────────────────────────────
// A mesma pergunta num clone completo: as duas leituras têm de coincidir, que é a coisa toda.
const fundo = path.join(palco, 'fundo');
git(palco, 'clone', '--quiet', 'file://' + origem, fundo);
fs.mkdirSync(path.join(fundo, 'ferramentas'), { recursive: true });
fs.writeFileSync(path.join(fundo, 'ferramentas', 'ramos-mortos.js'), PROGRAMA);
fs.copyFileSync(path.join(raso, 'ferramentas', 'backlog.json'),
  path.join(fundo, 'ferramentas', 'backlog.json'));
const saidaFundo = rodarEm(fundo);
ok(linhaDe(saidaFundo, 'ja-consumido').indexOf('NAO-E-ANCESTRAL') === -1
  && linhaDe(saidaFundo, 'orfao-de-verdade').indexOf('NAO-E-ANCESTRAL') !== -1,
  'clone RASO e clone PROFUNDO dão o MESMO veredito sobre os mesmos dois ramos');

// ── CENA 5 — 04/09: conteúdo já ABSORVIDO por outra rota não pode pedir auditoria ────────────────
// `entrega/absorvido-por-outra-rota` não é ancestral (nunca foi mergeado), e mesmo assim tem
// gêmeo: a chave `chave-absorvida-em-outra-rota` foi implementada direto na main, por outro
// commit. É exatamente `canonical-jogo`/`glossario-substancia`/`dashboard-trio` de 04/09 — os
// três reais, medidos no início deste arquivo.
const lAbsorvido = linhaDe(saidaFundo, 'absorvido-por-outra-rota');
console.log('   absorvido → ' + (lAbsorvido || '(ausente)'));
ok(lAbsorvido.indexOf('ABSORVIDO-POR-OUTRA-ROTA') !== -1,
  'ramo cujo conteúdo já está na main por outro commit sai com rótulo PRÓPRIO (não é "confira por conteúdo")',
  lAbsorvido);
ok(lAbsorvido.indexOf('NAO-E-ANCESTRAL') === -1,
  'e esse rótulo NÃO carrega o "confira por conteúdo" — quem já mediu não pede pra medir de novo',
  lAbsorvido);
ok(secaoDe(saidaFundo, 'absorvido-por-outra-rota') === 'MORTOS',
  'e ele sai na seção MORTOS — não pode aparecer em "DE PÉ, NÃO apague sem olhar" como trabalho a integrar',
  secaoDe(saidaFundo, 'absorvido-por-outra-rota'));
ok(lAbsorvido.indexOf('chave-absorvida-em-outra-rota') !== -1
  && lAbsorvido.indexOf('ENCONTRADO') !== -1,
  'a evidência (aceite do item): a saída mostra o símbolo e onde o `git log -S` o encontrou',
  lAbsorvido);
ok(lAbsorvido.indexOf('caracteristica.txt') !== -1,
  'a evidência (aceite do item): a saída mostra o `git diff --stat` do que o ramo escreveu',
  lAbsorvido);

// ── CENA 6 — a afirmação 2 do pedido: existe caso "meio dentro, meio fora" ───────────────────────
// `entrega/conteudo-misto` tem DUAS chaves; só uma delas chegou à main por outra rota. Nem
// ABSORVIDO (sobrou uma sem entrada) nem o "confira por conteúdo" simples de um órfão comum
// descreve isto sozinho — por isso o rótulo carrega PARCIAL.
const lMisto = linhaDe(saidaFundo, 'conteudo-misto');
console.log('   misto    → ' + (lMisto || '(ausente)'));
ok(lMisto.indexOf('NAO-E-ANCESTRAL') !== -1 && lMisto.indexOf('PARCIAL') !== -1,
  'ramo com conteúdo MISTO (parte entrou por outra rota, parte não) ganha rótulo PARCIAL, não ABSORVIDO nem órfão simples',
  lMisto);
ok(secaoDe(saidaFundo, 'conteudo-misto') === 'DE_PE',
  'e continua em "DE PÉ" — parcial ainda é trabalho a conferir, não trabalho morto',
  secaoDe(saidaFundo, 'conteudo-misto'));
ok(lMisto.indexOf('fragmento-que-entra-por-outro-lado') !== -1
  && lMisto.indexOf('fragmento-que-fica-de-fora-777') !== -1,
  'a evidência lista as DUAS chaves, não só a que combinou',
  lMisto);

// ── A MORDIDA DO ITEM, nos DOIS sentidos que o pedido cobrou explicitamente ──────────────────────
// Sentido 1: um programa que decide "absorvido" sem medir nunca pode passar despercebido — testado
// contra o órfão de VERDADE (que não tem gêmeo nenhum): se ele aparecer em MORTOS, é mentira.
const sempreAbsorvido = PROGRAMA.replace(
  /function avaliarConteudo\(sha, main\) \{[\s\S]*?\nfunction textoEvidencia/,
  "function avaliarConteudo(sha, main) {\n" +
  "  return { diffStat: '(controle: avaliarConteudo desarmado)', evidencias: [], classe: 'absorvido' };\n" +
  "}\nfunction textoEvidencia");
ok(sempreAbsorvido !== PROGRAMA, 'o controle 1 conseguiu desarmar avaliarConteudo() para SEMPRE dizer absorvido');
const saidaSempreAbsorvido = rodarEm(montarRaso(sempreAbsorvido));
const lOrfaoFalsoAbsorvido = linhaDe(saidaSempreAbsorvido, 'orfao-de-verdade');
console.log('   CONTROLE 1 (sempre absorvido), órfão de verdade → ' + (lOrfaoFalsoAbsorvido || '(ausente)'));
ok(lOrfaoFalsoAbsorvido.indexOf('ABSORVIDO-POR-OUTRA-ROTA') !== -1
  && secaoDe(saidaSempreAbsorvido, 'orfao-de-verdade') === 'MORTOS',
  'CONTROLE 1: com avaliarConteudo() sempre dizendo "absorvido", um órfão de VERDADE some para MORTOS — a cena 5 morde',
  lOrfaoFalsoAbsorvido);

// Sentido 2: um programa que nunca extrai símbolo nenhum nunca vai poder dizer "absorvido" — e
// então um ramo já consumido por outra rota volta a exigir auditoria à toa, que é trabalho
// FABRICADO, o próprio custo que o item nomeia.
const semSimbolo = PROGRAMA.replace(
  /function extrairSimbolos\(diffTexto\) \{[\s\S]*?\nconst TETO_OCORRENCIAS/,
  "function extrairSimbolos(diffTexto) { return []; }\nconst TETO_OCORRENCIAS");
ok(semSimbolo !== PROGRAMA, 'o controle 2 conseguiu desarmar extrairSimbolos() para NUNCA achar símbolo');
const saidaSemSimbolo = rodarEm(montarRaso(semSimbolo));
const lAbsorvidoFalsoOrfao = linhaDe(saidaSemSimbolo, 'absorvido-por-outra-rota');
console.log('   CONTROLE 2 (nunca extrai símbolo), absorvido de verdade → ' + (lAbsorvidoFalsoOrfao || '(ausente)'));
ok(lAbsorvidoFalsoOrfao.indexOf('NAO-E-ANCESTRAL') !== -1
  && secaoDe(saidaSemSimbolo, 'absorvido-por-outra-rota') === 'DE_PE',
  'CONTROLE 2: sem extração de símbolo, um ramo JÁ ABSORVIDO volta a pedir auditoria (trabalho fabricado) — a cena 5 morde ao contrário',
  lAbsorvidoFalsoOrfao);

fs.rmSync(palco, { recursive: true, force: true });

console.log('');
console.log(falhas ? 'REPROVOU — ' + falhas + ' de ' + checagens : 'PASSOU — ' + checagens + ' checagens');
process.exit(falhas ? 1 : 0);
