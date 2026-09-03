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

commitar('base');

// (a) um ramo que a `main` JÁ consumiu — o caso que o defeito chamava de órfão.
git(origem, 'checkout', '--quiet', '-b', 'entrega/ja-consumido');
commitar('trabalho que foi integrado');
git(origem, 'checkout', '--quiet', 'main');
git(origem, 'merge', '--quiet', '--no-ff', '-m', 'Integra ja-consumido', 'entrega/ja-consumido');

// (b) um órfão de VERDADE — trabalho que a `main` nunca viu.
git(origem, 'checkout', '--quiet', '-b', 'entrega/orfao-de-verdade');
commitar('trabalho que ficou de fora');
git(origem, 'checkout', '--quiet', 'main');

// história por cima, para afundar os dois ramos abaixo do horizonte de um `--depth=1`.
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
function linhaDe(saida, ref) {
  return (saida.split('\n').find((l) => l.indexOf('entrega/' + ref) !== -1) || '').trim();
}

const saida = rodarEm(raso);
const lConsumido = linhaDe(saida, 'ja-consumido');
const lOrfao = linhaDe(saida, 'orfao-de-verdade');
console.log('   consumido → ' + (lConsumido || '(ausente)'));
console.log('   órfão     → ' + (lOrfao || '(ausente)'));

// CENA 1 — a que o defeito reprovava.
ok(lConsumido.indexOf('ÓRFÃO') === -1,
  'num clone raso, ramo já consumido pela main NÃO sai como ÓRFÃO', lConsumido);

// CENA 2 — e o programa não ficou covarde para passar na cena 1.
ok(lOrfao.indexOf('ÓRFÃO') !== -1,
  'e um órfão de VERDADE continua saindo como ÓRFÃO', lOrfao);

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
ok(lConsumidoDoente.indexOf('ÓRFÃO') !== -1,
  'CONTROLE: com o classificador de dois estados, o ramo consumido volta a sair ÓRFÃO — a cena 1 morde',
  lConsumidoDoente);

// ── e a versão profunda continua respondendo o mesmo ───────────────────────────────────────────
// A mesma pergunta num clone completo: as duas leituras têm de coincidir, que é a coisa toda.
const fundo = path.join(palco, 'fundo');
git(palco, 'clone', '--quiet', 'file://' + origem, fundo);
fs.mkdirSync(path.join(fundo, 'ferramentas'), { recursive: true });
fs.writeFileSync(path.join(fundo, 'ferramentas', 'ramos-mortos.js'), PROGRAMA);
fs.copyFileSync(path.join(raso, 'ferramentas', 'backlog.json'),
  path.join(fundo, 'ferramentas', 'backlog.json'));
const saidaFundo = rodarEm(fundo);
ok(linhaDe(saidaFundo, 'ja-consumido').indexOf('ÓRFÃO') === -1
  && linhaDe(saidaFundo, 'orfao-de-verdade').indexOf('ÓRFÃO') !== -1,
  'clone RASO e clone PROFUNDO dão o MESMO veredito sobre os mesmos dois ramos');

fs.rmSync(palco, { recursive: true, force: true });

console.log('');
console.log(falhas ? 'REPROVOU — ' + falhas + ' de ' + checagens : 'PASSOU — ' + checagens + ' checagens');
process.exit(falhas ? 1 : 0);
