#!/usr/bin/env node
// O DESFECHO CARO DO `ramos-mortos.js` É `ABSORVIDO-POR-OUTRA-ROTA`, E ELE NÃO É SIMÉTRICO.
//
//   node test/ramos-mortos-falso-absorvido.js
//   RAMOS_MORTOS_JS=/caminho/para/outro/ramos-mortos.js node test/ramos-mortos-falso-absorvido.js
//
// POR QUE EXISTE, e o número que o motivou. Um falso "NÃO É ANCESTRAL" custa uma conferência a
// mais. Um falso "ABSORVIDO-POR-OUTRA-ROTA" **esconde trabalho perdido**: o ramo sai da seção
// "DE PÉ, não apague sem olhar", entra em MORTOS, e o `--apagar` cospe
// `git push origin --delete <ele>` para a máquina que tem `delete_ref` colar. Os dois erros não
// custam a mesma coisa, então o portão só olha para um lado.
//
// MEDIDO PELO QA EM 04/09, contra `origin/entrega/ramos-mortos-conteudo` (f6ee368), rodando a
// ferramenta daquele ramo no repositório de verdade:
//
//   git merge-base --is-ancestor origin/entrega/ramos-mortos-conteudo origin/main  → EXIT 1
//   (ou seja: 360 linhas que a main nunca viu — a main ainda está em 9197835 naquele arquivo)
//
//   e mesmo assim a saída da ferramenta dizia:
//     refs/heads/entrega/ramos-mortos-conteudo  ABSORVIDO-POR-OUTRA-ROTA — ... o conteúdo já
//     está na main   ← em MORTOS, e na lista do --apagar
//
//   a "evidência" que sustentava isso eram os símbolos "ECONOMIA DO OURO" e "CRITÉRIO BRASIL",
//   que naquele ramo existem em UMA linha só, e é uma linha de COMENTÁRIO — a que documenta a
//   própria camada 1 do extrator:
//     +//   1. título em CAIXA-ALTA entre aspas — "ECONOMIA DO OURO", "CRITÉRIO BRASIL" (glossário);
//   O `git log -S` achou as duas na main porque a main tem os VERBETES do glossário com esses
//   nomes. A ferramenta casou o exemplo escrito na própria documentação com um verbete homônimo
//   e concluiu que o ramo já tinha sido absorvido. Coincidência, no sentido que apaga trabalho.
//
// AS QUATRO CENAS ABAIXO SÃO ESSE MECANISMO, ISOLADO. Nenhuma usa rede: montam repositório de
// mentira em `os.tmpdir()` e clonam por `file://`, como o `ramos-mortos-veredito.js` vizinho.
//
// ⚠ HOJE NENHUMA DAS DUAS VERSÕES DA FERRAMENTA PASSA ESTE PORTÃO INTEIRO, e isso é de propósito:
//   · a da `main` (sem pergunta de conteúdo) reprova a CENA 0 — ela nunca diz ABSORVIDO, então
//     não resolve o trabalho fabricado que o item nomeia;
//   · a de `entrega/ramos-mortos-conteudo` passa a CENA 0 e reprova as CENAS 1 a 4.
// É o critério de aceite do conserto: as duas metades ao mesmo tempo. Um portão que só cobrasse
// "nunca diga absorvido" seria a forma mais barata de ficar verde (EQUIPE.md §2.8).
//
// REMÉDIO MEDIDO, para quem for consertar (não é opinião — está no relatório do QA de 04/09):
// exigir que o commit que "achou" o símbolo toque ALGUM dos caminhos que o ramo tocou,
// desconsiderando os arquivos de registro (NOTES/PENDENTES/RECADOS/PLANTAO/docs/backlog.json),
// que são onde a rodada escreve SOBRE o ramo e viram prova circular. Contado no repositório real:
//   entrega/ramos-mortos-conteudo   3 de 3 símbolos "encontrados" → 1 de 3   (sai de MORTOS)
//   entrega/glossario-substancia    exemplo impresso deixa de ser o Diário 76184d7 e passa a ser
//                                   2396a90, que é o commit que de fato trouxe os verbetes
//   entrega/canonical-jogo · dashboard-trio   continuam com evidência de mesmo caminho (não quebra)
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PROGRAMA = process.env.RAMOS_MORTOS_JS || path.join(RAIZ, 'ferramentas', 'ramos-mortos.js');
let falhas = 0;
let checagens = 0;

function ok(cond, oque, detalhe) {
  checagens++;
  console.log((cond ? 'OK      ' : 'FALHOU  ') + oque);
  if (!cond) {
    falhas++;
    // IMPRIME O ESTADO NO INSTANTE DA FALHA (EQUIPE.md §2.9) — o bloco inteiro do veredito, não
    // um "não bateu". Sem isto o próximo palpite é às cegas.
    for (const l of String(detalhe || '(sem detalhe)').split('\n')) console.log('        | ' + l);
  }
}

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

const palco = fs.mkdtempSync(path.join(os.tmpdir(), 'falso-absorvido-'));

// Monta uma origem onde `entrega/<nome>` NÃO é ancestral da main, roda a ferramenta num clone
// dela e devolve { secao, bloco }. `antes` escreve na main ANTES do ramo nascer; `depois`, depois.
function medir(nome, noRamo, antes, depois) {
  const origem = path.join(palco, nome);
  fs.mkdirSync(origem, { recursive: true });
  git(origem, 'init', '--quiet', '--initial-branch=main');
  git(origem, 'config', 'user.email', 'qa@exemplo.invalido');
  git(origem, 'config', 'user.name', 'QA');
  const commit = (arquivo, conteudo, msg) => {
    fs.writeFileSync(path.join(origem, arquivo), conteudo);
    git(origem, 'add', '-A');
    git(origem, 'commit', '--quiet', '-m', msg);
  };
  commit('base.txt', 'base\n', 'base');
  if (antes) antes(commit, origem);
  git(origem, 'checkout', '--quiet', '-b', 'entrega/' + nome);
  noRamo(commit, origem);
  git(origem, 'checkout', '--quiet', 'main');
  if (depois) depois(commit, origem);
  for (let i = 0; i < 3; i++) {
    fs.appendFileSync(path.join(origem, 'base.txt'), 'anda ' + i + '\n');
    git(origem, 'add', '-A');
    git(origem, 'commit', '--quiet', '-m', 'a main anda ' + i);
  }

  const clone = path.join(palco, nome + '-clone');
  git(palco, 'clone', '--quiet', 'file://' + origem, clone);
  fs.mkdirSync(path.join(clone, 'ferramentas'), { recursive: true });
  fs.copyFileSync(PROGRAMA, path.join(clone, 'ferramentas', 'ramos-mortos.js'));
  fs.writeFileSync(path.join(clone, 'ferramentas', 'backlog.json'),
    JSON.stringify({ itens: [{ id: nome, estado: 'livre' }] }, null, 2));

  let saida;
  try {
    saida = execFileSync('node', ['ferramentas/ramos-mortos.js'],
      { cwd: clone, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { saida = String(e.stdout || '') + String(e.stderr || ''); }

  const linhas = saida.split('\n');
  const i = linhas.findIndex((l) => l.indexOf('entrega/' + nome) !== -1);
  if (i === -1) return { secao: 'ausente', bloco: saida.trim() };
  let fim = linhas.length;
  for (let j = i + 1; j < linhas.length; j++) {
    if (/^  refs\/heads\//.test(linhas[j]) || /^(MORTOS|DE PÉ|NÃO MEDIDO)/.test(linhas[j])) { fim = j; break; }
  }
  const idxMortos = linhas.findIndex((l) => l.startsWith('MORTOS —'));
  const idxDePe = linhas.findIndex((l) => l.startsWith('DE PÉ —'));
  const idxNaoMedido = linhas.findIndex((l) => l.startsWith('NÃO MEDIDO —'));
  let secao = 'indeterminada';
  if (idxNaoMedido !== -1 && i > idxNaoMedido) secao = 'NAO_MEDIDO';
  else if (idxDePe !== -1 && i > idxDePe) secao = 'DE_PE';
  else if (idxMortos !== -1 && i > idxMortos) secao = 'MORTOS';
  return { secao, bloco: linhas.slice(i, fim).join('\n') };
}

// A pergunta única deste portão. "Saiu de MORTOS" é o que importa — o rótulo é consequência.
function ehAbsorvido(r) {
  return r.secao === 'MORTOS' && r.bloco.indexOf('ABSORVIDO') !== -1;
}

console.log('programa sob teste: ' + PROGRAMA);
console.log('');

// ── CENA 0 — CONTROLE POSITIVO: a ferramenta PRECISA saber dizer absorvido ────────────────────
// Sem esta cena, "nunca diga ABSORVIDO" passaria de verde — e seria o trabalho fabricado de volta.
// Absorção de verdade: a mesma chave estrutural, no MESMO arquivo, entrando na main por outro
// commit e continuando viva na ponta.
{
  const r = medir('absorcao-de-verdade',
    (c) => c('motor.txt', 'const chave-do-trabalho-real = 1;\n', 'o ramo escreve o trabalho'),
    null,
    (c) => c('motor.txt', 'const chave-do-trabalho-real = 1;\n', 'a main implementa o mesmo, por outra rota'));
  ok(ehAbsorvido(r),
    'CONTROLE POSITIVO: absorção REAL (mesma chave, mesmo arquivo, viva na main) sai ABSORVIDO em MORTOS',
    r.secao + '\n' + r.bloco);
}

// ── CENA 1 — a camada 4 (prosa entre aspas) não pode decidir o desfecho caro sozinha ───────────
// O próprio cabeçalho da ferramenta chama a camada 4 de recurso fraco e afirma que "o desfecho
// abaixo trata essa quarta camada como confiança MENOR". Medido: `extrairSimbolos` devolve
// `.map(([s]) => s)` e joga os pontos fora, então `avaliarConteudo` não tem como saber de que
// camada veio o símbolo — a afirmação do comentário não existe no código.
{
  const r = medir('so-prosa',
    (c) => c('falas.txt',
      "fala('Os Tupinamba plantavam mandioca antes de qualquer chegada.')\n" +
      "fala('A travessia atlantica durava semanas em porao fechado.')\n",
      'texto de capítulo novo — trabalho que a main nunca recebeu'),
    (c) => c('comentario.txt',
      "// 'Os Tupinamba plantavam mandioca antes de qualquer chegada.'\n" +
      "// 'A travessia atlantica durava semanas em porao fechado.'\n",
      'a main já citava as duas frases dentro de um comentário'),
    null);
  ok(!ehAbsorvido(r),
    'prosa entre aspas (camada 4, a que o autor chama de fraca) NÃO decide ABSORVIDO sozinha',
    r.secao + '\n' + r.bloco);
}

// ── CENA 2 — conteúdo que entrou na main e foi REVERTIDO não está na main ──────────────────────
// `git log -S` conta toda mudança no NÚMERO de ocorrências — inclusive a REMOÇÃO. Então um
// símbolo que entrou e saiu aparece com 2 commits e é lido como "encontrado". O `CLAUDE.md` §6
// autoriza reverter o que está pela metade, então esta não é uma cena de laboratório.
{
  const r = medir('entrou-e-saiu',
    (c) => c('novo.txt', 'chave-do-trabalho-perdido\n', 'trabalho do ramo'),
    null,
    (c, origem) => {
      c('tentativa.txt', 'chave-do-trabalho-perdido\n', 'a main tentou por outra rota');
      fs.unlinkSync(path.join(origem, 'tentativa.txt'));
      git(origem, 'add', '-A');
      git(origem, 'commit', '--quiet', '-m', 'a main REVERTEU: não ficou uma linha');
    });
  ok(!ehAbsorvido(r),
    'conteúdo que entrou na main e foi REVERTIDO não conta como absorvido (o -S conta a remoção)',
    r.secao + '\n' + r.bloco);
}

// ── CENA 3 — o caso real de 04/09, reduzido: símbolo citado em COMENTÁRIO ─────────────────────
// O ramo escreve trabalho de verdade e, numa linha de documentação, CITA nomes que a main já tem
// em outro assunto. Foi assim que `entrega/ramos-mortos-conteudo` (a própria entrega) foi
// declarado absorvido e entrou na lista do `--apagar`.
//
// ⚠ A PRIMEIRA VERSÃO DESTA CENA PASSOU DE VERDE PELO MOTIVO ERRADO, e o registro fica porque a
// causa é um segundo achado: o trabalho de verdade estava escrito `const trabalho-de-verdade-do-ramo`,
// que é kebab-case — a camada 2 o extraía, ele não estava na main, e o veredito virava PARCIAL
// sem que a coincidência tivesse sido exercida. No ramo real o trabalho novo são FUNÇÕES
// (`avaliarConteudo`, `extrairSimbolos`), e o extrator é **cego a camelCase**: a camada 2 exige
// um `-` ou `_` (`[a-z][a-z0-9]*(?:[-_][a-z0-9]+){1,6}`). Então, para todo ramo de JavaScript
// desta casa, os "símbolos característicos" nunca são o código novo — são as strings entre aspas
// e as chaves de configuração, isto é, a DOCUMENTAÇÃO. A cena abaixo escreve o trabalho em
// camelCase, que é a forma verdadeira, e aí a coincidência decide sozinha.
{
  const r = medir('cita-em-comentario',
    (c) => c('ferramenta.txt',
      '// exemplos do formato: "ECONOMIA DO OURO", "CRITERIO BRASIL", "A CONTA DA ESCRAVIDAO"\n' +
      'function avaliarConteudoNovo() { return calcularCoisaNova(); }\n',
      'ramo com trabalho real (camelCase) + um comentário que cita nomes alheios'),
    (c) => c('glossario.txt',
      'verbete: "ECONOMIA DO OURO"\nverbete: "CRITERIO BRASIL"\nverbete: "A CONTA DA ESCRAVIDAO"\n',
      'a main tem verbetes homônimos, de outro assunto'),
    null);
  ok(!ehAbsorvido(r),
    'símbolo que o ramo só CITA num comentário (e a main tem por outro assunto) não prova absorção',
    r.secao + '\n' + r.bloco);
}

// ── CENA 4 — a fronteira do TETO_OCORRENCIAS = 40, que é um número sem medição ─────────────────
// Medido pelo QA: `git log --all -S'TETO_OCORRENCIAS'` devolve só o commit que o criou, e nem o
// NOTES nem o PLANTAO o mencionam — não há medição por trás dele. E o efeito é ao contrário do
// que a segurança pede: quanto MAIS comum o símbolo (evidência mais fraca), mais fácil o
// ABSORVIDO — até 40. Medido nos dois lados: 39 commits → MORTOS/ABSORVIDO; 41 → DE PÉ.
// O portão não cobra o número; cobra que vocabulário comum não decida o desfecho caro sozinho.
{
  const r = medir('vocabulario-comum',
    (c) => c('doramo.txt', 'chave-muito-comum-aqui\n', 'trabalho do ramo, nunca integrado'),
    (c, origem) => {
      for (let i = 0; i < 39; i++) {
        fs.writeFileSync(path.join(origem, 'comum.txt'),
          i % 2 === 0 ? 'chave-muito-comum-aqui\n'.repeat(i + 1) : 'nada\n');
        git(origem, 'add', '-A');
        git(origem, 'commit', '--quiet', '-m', 'a main mexe no vocabulário comum ' + i);
      }
    },
    null);
  ok(!ehAbsorvido(r),
    'símbolo que a main mexeu em 39 commits é vocabulário comum e não decide ABSORVIDO sozinho',
    r.secao + '\n' + r.bloco);
}

// ── CENA 5 — diff maior que o buffer não pode ser relatado como "não tem símbolo" ─────────────
// `execFileSync` tem maxBuffer padrão de 1 MiB. Medido no repositório real: o diff de
// `origin/entrega/salvador-drop-ritual` tem 1.159.921 bytes e a chamada lança `ENOBUFS`, que o
// `catch (_) {}` engole. O veredito sai "nenhum símbolo característico deu para extrair" — que é
// uma frase FALSA: o instrumento não leu o diff, e diz que leu e não achou nada. O balde
// (DE PÉ) é o seguro; a frase é que mente sobre a causa, e é ela que faz alguém não olhar de novo.
{
  const grande = 'linha de enchimento para passar de um mebibyte no diff\n'.repeat(24000);
  const r = medir('diff-maior-que-o-buffer',
    (c) => c('grande.txt', grande + 'chave-caracteristica-do-ramo\n', 'ramo com diff acima de 1 MiB'),
    null,
    (c) => c('outra.txt', 'chave-caracteristica-do-ramo\n', 'a main recebeu a mesma chave por outra rota'));
  const mentiu = r.bloco.indexOf('nenhum símbolo característico') !== -1;
  ok(!mentiu,
    'diff acima do buffer não é relatado como "nenhum símbolo característico" — a causa é nomeada',
    r.secao + '\n' + r.bloco);
}

fs.rmSync(palco, { recursive: true, force: true });

console.log('');
console.log(falhas ? 'REPROVOU — ' + falhas + ' de ' + checagens : 'PASSOU — ' + checagens + ' checagens');
process.exit(falhas ? 1 : 0);
