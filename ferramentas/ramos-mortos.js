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
// ⚠ EM 04/09 O DEFEITO NÃO ERA MAIS O CLONE RASO — ERA A PERGUNTA ERRADA.
//
// Com o clone já aprofundado (713 commits) a ancestralidade acertou nos três `entrega/` que ela
// mediu, e mesmo assim os três vereditos ÓRFÃO eram inúteis: `canonical-jogo` (a main já tem
// `canonical` 8x em `test/encaixe.js`), `glossario-substancia` (os três verbetes já estavam em
// `src/jogo.ts`, entraram pelas rev2/rev3) e `dashboard-trio` (as metades entraram por `bccbf16`
// e `532a9e7`; a main está ADIANTE do ramo, e mergeá-lo dá conflito). Órfãos de verdade: ZERO,
// pela segunda vez seguida. O custo não é o ramo esquecido — é o PLANTÃO §7 mandar "auditar e
// integrar" três ramos já consumidos, trabalho FABRICADO no lugar exato onde se decide o que
// despachar.
//
// A causa: "ancestral?" e "o conteúdo já chegou?" são perguntas DIFERENTES, e só a primeira
// estava sendo feita. Um ramo pode não ser ancestral e ainda assim não ter uma linha de trabalho
// a salvar — porque o mesmo conteúdo entrou pela `main` por OUTRO commit (rebase, reescrita,
// reimplementação). A palavra ÓRFÃO não sobrevive a essa distinção: ela lê como "trabalho
// perdido", e nos três casos não havia nenhum.
//
// O QUE MUDOU, e é o que esta ferramenta agora GARANTE em vez de afirmar: para todo ramo que a
// ancestralidade não encontra na main, ela imprime (a) o `git diff --stat` contra a main — o que
// esse ramo tem que a main não tem, no MOMENTO em que os dois se separaram — e (b) o resultado de
// `git log -S` sobre símbolos extraídos desse diff, rodado sobre a HISTÓRIA da main. Se os
// símbolos aparecem lá por outro commit, o ramo não é trabalho a integrar — é ancestralidade que
// não enxerga rebase. O nome do desfecho passa a dizer isso: em vez de ÓRFÃO, que é conclusão,
// `NAO-E-ANCESTRAL, confira por conteudo`, que é o que a ferramenta de fato sabe.
//
// ESCOLHER O SÍMBOLO AUTOMATICAMENTE FUNCIONA ATÉ ONDE DÁ PARA MEDIR, E NÃO MAIS QUE ISSO — a
// extração por camadas (título em CAIXA-ALTA entre aspas, chave kebab/snake-case, atributo do
// tipo `chave="valor"`) resolveu os três casos reais de 04/09 sem falso positivo. Quando o diff
// não tem NENHUM símbolo desse formato, o programa não inventa um: diz que não extraiu nada e
// devolve o mesmo desfecho de "confira por conteúdo" — a mesma disciplina do desfecho DESCONHECIDO
// de 03/09, "não sei" é uma resposta, e só vira ÓRFÃO quem foi medido de verdade.
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

// ─────────────────────────────────────────────────────────────────────────────────────────────
// A PERGUNTA DE CONTEÚDO (04/09). "Não é ancestral" não decide sozinho se há trabalho a salvar —
// decide só que a `main` não passou por AQUELE commit. As três funções abaixo respondem a
// pergunta que falta: o que este ramo tem que a main não tinha quando se separaram (a), e esse
// conteúdo já chegou à main por outra rota (b)?

// (a) o diff --stat, cortado para caber num relatório. `MAIN + '...' + sha` é o diff de três
// pontos: a base de comparação é o ANCESTRAL COMUM, não a ponta da main — é o que isola o que o
// ramo fez, sem misturar tudo que a main andou depois que os dois se separaram (medido: nos três
// casos de 04/09 o diff de dois pontos trazia milhares de linhas de ruído; o de três pontos, a
// dúzia de linhas que o ramo realmente escreveu).
function diffStatCurto(sha, main) {
  let saida;
  try {
    saida = git('diff', '--stat', main + '...' + sha).trim();
  } catch (e) {
    return '(não consegui calcular o diff --stat: ' + e.message.split('\n')[0] + ')';
  }
  if (!saida) return '(diff vazio — o conteúdo já é idêntico ao da origin/main)';
  const linhas = saida.split('\n');
  if (linhas.length <= 14) return saida;
  return linhas.slice(0, 12).join('\n') + '\n      … (+' + (linhas.length - 12) + ' linha(s) do diff omitidas)\n' + linhas[linhas.length - 1];
}

// PALAVRAS COMUNS DO CÓDIGO. Nunca viram símbolo — combinam com metade dos commits do
// repositório e não provam nada.
const PALAVRAS_COMUNS = new Set(['function', 'return', 'const', 'let', 'var', 'import', 'export',
  'require', 'default', 'async', 'await', 'true', 'false', 'null', 'undefined', 'console']);

// (b-1) extrai até 3 símbolos característicos do diff — SÓ dos que o ramo ACRESCENTOU (linhas
// `+`). Três camadas, na ordem em que uma casa como esta escreve nome de coisa:
//   1. título em CAIXA-ALTA entre aspas — "ECONOMIA DO OURO", "CRITÉRIO BRASIL" (glossário);
//   2. chave kebab/snake-case de 10+ letras — "mesa-brasil-perdidas" (chave de localStorage);
//   3. atributo `chave="valor"` ou seletor `[chave="valor"]` — `rel="canonical"` (HTML/CSS).
// Só se NENHUMA das três achar nada é que ele recorre a uma quarta, de prosa entre aspas — e o
// desfecho abaixo trata essa quarta camada como confiança MENOR, nunca como as três primeiras.
//
// ISTO NÃO É UMA GARANTIA — é medido contra os três casos reais de 04/09 e resolveu os três sem
// falso positivo (achado em `ferramentas/ramos-mortos.js`, ver o cabeçalho). Quando nada aqui
// combina com o jeito que o código foi escrito, a função devolve lista vazia, e é ISSO que o
// chamador tem de aceitar como resposta — nunca forçar um candidato ruim para não ficar de mãos
// vazias. "Não extraí símbolo" é um resultado, do mesmo jeito que DESCONHECIDO é um veredito.
function extrairSimbolos(diffTexto) {
  const linhasAdicionadas = diffTexto.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++'));
  const candidatos = new Map();
  const add = (bruto, pontos) => {
    const t = bruto.trim();
    if (t.length < 6 || t.length > 60) return;
    candidatos.set(t, Math.max(candidatos.get(t) || 0, pontos));
  };

  const reTitulo = /['"]([A-ZÀ-Ü][A-ZÀ-Ü0-9 ]{4,40})['"]/g;
  const reChave = /\b([a-z][a-z0-9]*(?:[-_][a-z0-9]+){1,6})\b/g;
  const reAtributo = /([a-zA-Z-]+\s*=\s*["'][^"']{2,30}["']|\[[a-zA-Z-]+=["'][^"']+["']\])/g;
  const reProsa = /['"]([^'"]{10,60})['"]/g;

  let achouEstrutural = false;
  for (const linha of linhasAdicionadas) {
    let m;
    reTitulo.lastIndex = 0;
    while ((m = reTitulo.exec(linha))) { add(m[1], 4); achouEstrutural = true; }
    reChave.lastIndex = 0;
    while ((m = reChave.exec(linha))) {
      if (m[1].length >= 10 && !PALAVRAS_COMUNS.has(m[1].toLowerCase())) { add(m[1], 3); achouEstrutural = true; }
    }
    reAtributo.lastIndex = 0;
    while ((m = reAtributo.exec(linha))) { add(m[1], 3.5); achouEstrutural = true; }
  }
  if (!achouEstrutural) {
    for (const linha of linhasAdicionadas) {
      let m;
      reProsa.lastIndex = 0;
      while ((m = reProsa.exec(linha))) {
        const t = m[1];
        if (/^[0-9.,\s]+$/.test(t)) continue;
        add(t, t.includes(' ') ? 2 : 1);
      }
    }
  }
  return [...candidatos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s);
}

// TETO DE OCORRÊNCIAS — um símbolo que aparece em dezenas de commits não é característico, é
// vocabulário comum do repositório, e "encontrado" nesse caso não prova entrada por outra rota.
const TETO_OCORRENCIAS = 40;

// (b-2) roda o `git log -S<símbolo>` sobre a história da main e devolve o que ele achou, sem
// interpretar — quem interpreta é `avaliarConteudo`.
function ocorrenciasEm(simbolo, main) {
  try {
    const saida = git('log', '--oneline', '-S' + simbolo, main).trim();
    if (!saida) return { simbolo, encontrado: false, total: 0 };
    const linhas = saida.split('\n');
    if (linhas.length > TETO_OCORRENCIAS) {
      return { simbolo, encontrado: false, total: linhas.length, generico: true };
    }
    return { simbolo, encontrado: true, total: linhas.length, exemplo: linhas[0] };
  } catch (e) {
    return { simbolo, encontrado: false, total: 0, erro: e.message.split('\n')[0] };
  }
}

// (b-3) a peça que decide o rótulo — mas só depois de reunir a evidência (a) + (b), nunca antes.
//   'absorvido'     — todo símbolo extraído já está na história da main → não é trabalho a integrar.
//   'orfao'         — símbolo(s) extraídos, NENHUM apareceu na main → confira por conteúdo.
//   'parcial'       — parte apareceu, parte não → confira por conteúdo, mas avise que é misto.
//   'indeterminado' — não deu para extrair símbolo confiável → confira por conteúdo, sem atalho.
function avaliarConteudo(sha, main) {
  const diffStat = diffStatCurto(sha, main);
  let diffTexto = '';
  try {
    diffTexto = git('diff', main + '...' + sha);
  } catch (_) { /* sem o texto do diff, extrairSimbolos devolve lista vazia sozinho */ }
  const simbolos = extrairSimbolos(diffTexto);
  if (!simbolos.length) return { diffStat, evidencias: [], classe: 'indeterminado' };

  const evidencias = simbolos.map((s) => ocorrenciasEm(s, main));
  const achados = evidencias.filter((e) => e.encontrado).length;
  const usaveis = evidencias.filter((e) => e.encontrado || !e.generico).length; // exclui só os genéricos do total
  let classe;
  if (achados === 0) classe = usaveis > 0 ? 'orfao' : 'indeterminado';
  else if (achados === usaveis) classe = 'absorvido';
  else classe = 'parcial';
  return { diffStat, evidencias, classe };
}

function textoEvidencia(avaliacao) {
  const linhas = [];
  linhas.push('      diff --stat (contra o ancestral comum com a origin/main):');
  for (const l of avaliacao.diffStat.split('\n')) linhas.push('        ' + l);
  if (avaliacao.evidencias.length) {
    linhas.push('      git log -S <símbolo do diff> na história da origin/main:');
    for (const e of avaliacao.evidencias) {
      if (e.erro) {
        linhas.push('        "' + e.simbolo + '" → não consegui medir (' + e.erro + ')');
      } else if (e.generico) {
        linhas.push('        "' + e.simbolo + '" → aparece em ' + e.total + ' commits — genérico demais para servir de evidência, descartado');
      } else if (e.encontrado) {
        linhas.push('        "' + e.simbolo + '" → ENCONTRADO em ' + e.total + ' commit(s) da main — ex.: ' + e.exemplo);
      } else {
        linhas.push('        "' + e.simbolo + '" → não encontrado em nenhum commit da main');
      }
    }
  } else {
    linhas.push('      git log -S: nenhum símbolo característico extraído do diff — leia o diff --stat acima à mão.');
  }
  return linhas.join('\n');
}
// ─────────────────────────────────────────────────────────────────────────────────────────────

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
    console.log(raso ? '       ainda raso. Os `entrega/` sairão como DESCONHECIDO, nunca com rótulo de conteúdo.'
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
  console.log('       O que faltar sairá como NÃO MEDIDO abaixo — nunca com rótulo de conteúdo.');
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
  // Não é ancestral. ISSO SOZINHO NÃO DIZ SE HÁ TRABALHO A SALVAR (04/09) — mede-se por
  // conteúdo: o que o ramo tem que a main não tinha (a), e se esse conteúdo já chegou por outra
  // rota (b). `avaliarConteudo` reúne as duas e SÓ ela decide o balde final.
  const avaliacao = avaliarConteudo(r.sha, MAIN);
  const evidencia = textoEvidencia(avaliacao);
  if (avaliacao.classe === 'absorvido') {
    // Todo símbolo extraído já está na história da main por OUTRO commit — não é trabalho a
    // integrar. Vai para MORTOS, com rótulo que NÃO é "ancestral" (não é — é conteúdo).
    mortos.push([r.ref,
      'ABSORVIDO-POR-OUTRA-ROTA — não é ancestral, mas o conteúdo já está na main · backlog: ' + estado + '\n' + evidencia]);
  } else if (avaliacao.classe === 'parcial') {
    vivos.push([r.ref,
      'NAO-E-ANCESTRAL, confira por conteudo · PARCIAL: parte do conteúdo entrou por outra rota, parte não · backlog: ' + estado + '\n' + evidencia]);
  } else if (avaliacao.classe === 'indeterminado') {
    vivos.push([r.ref,
      'NAO-E-ANCESTRAL, confira por conteudo · nenhum símbolo característico deu para extrair, leia o diff acima · backlog: ' + estado + '\n' + evidencia]);
  } else { // 'orfao'
    vivos.push([r.ref,
      'NAO-E-ANCESTRAL, confira por conteudo · nenhuma evidência de entrada por outra rota · backlog: ' + estado + '\n' + evidencia]);
  }
}

function imprimirItem(ref, por) {
  const linhas = String(por).split('\n');
  console.log('  ' + ref.padEnd(46) + ' ' + linhas[0]);
  for (let i = 1; i < linhas.length; i++) console.log(linhas[i]);
}

if (!SO_VIVOS) {
  console.log('MORTOS — ' + mortos.length + ' ref(s), nada a salvar:');
  for (const [ref, por] of mortos) imprimirItem(ref, por);
  if (!mortos.length) console.log('  (nenhum)');
  console.log('');
}

console.log('DE PÉ — ' + vivos.length + ' ref(s), NÃO apague sem olhar:');
for (const [ref, por] of vivos) imprimirItem(ref, por);
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
  console.log('');
  console.log('# Para a máquina que TEM delete_ref (Mac, Windows). A nuvem leva 403 aqui.');
  console.log('# Confira a lista acima antes de colar — este arquivo classifica, não decide por você.');
  for (const [ref] of mortos) console.log('git push origin --delete ' + ref.replace('refs/heads/', ''));
}
