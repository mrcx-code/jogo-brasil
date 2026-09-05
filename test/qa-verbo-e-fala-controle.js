// CONTROLE DO PORTÃO "O VERBO E A FALA" — a prova de que `test/qa-verbo-e-fala.js` reprova.
//
//   node test/qa-verbo-e-fala-controle.js     → 0 se os 6 mutantes foram vistos reprovando
//                                               E a rodada limpa passou
//   node test/qa-verbo-e-fala-controle.js --autoteste
//                                             → PROVA que ESTE controle reprova: troca o
//                                               portão por um coto que sai 0 sempre, e exige
//                                               que a matriz acuse. Controle que nunca foi
//                                               visto reprovando é decoração de segundo grau.
//
// ============================================================================
// POR QUE ELE EXISTE (QA, 05/09 — auditoria da entrega `verbo-e-fala-passa-a-vazio`)
// ============================================================================
//
// O instrumento auditado nasceu com UMA injeção declarada: `QA_SEM_FRASE=<id>`, que apaga a
// abertura de um capítulo e prova a asserção da FRASE. Medido nesta auditoria, essa injeção
// cobre 1 das 4 famílias de asserção do arquivo:
//
//   1 · a simulação de época é fiel (5 asserções)          — sem injeção declarada
//   2a · capítulo com motor está no registro               — sem injeção declarada
//   2b · a abertura nomeia o gesto                         — coberta por QA_SEM_FRASE
//   2c · a família registrada é a que a mão faz            — SEM injeção declarada, e é ELA
//        que sustenta a entrega inteira: é a asserção que pega o que o bloco 5 do
//        `encaixe.js` deixa passar (JABAQUARA trocando de família com a abertura intacta,
//        `encaixe.js` inteiro exit 0 — reproduzido nesta auditoria)
//   3 · nenhum capítulo nas duas famílias                  — sem injeção declarada
//   2d · capítulo SEM motor não pode estar no registro     — sem injeção declarada
//
// Asserção que ninguém viu reprovando é decoração (lição 2.8 do EQUIPE.md), e três das seis
// famílias acima estavam nesse estado. Este arquivo fecha isso pelo caminho que a casa já usa
// em `cartao-quadro-controle.js` e `qa-vercel-host-controle.js`: injeta o defeito numa CÓPIA do
// `index.html` construído, roda o portão contra ela por EXIT CODE, e exige que ele reprove
// **pelo motivo certo** — o texto da falha tem de nomear o capítulo esperado. Mutante pego pelo
// motivo errado é verde de sorte.
//
// O QUE ELE NÃO TOCA: nada. As cópias vão para `test/tmp-*` (que o `.gitignore` já cobre) e o
// `index.html` da raiz nunca é aberto para escrita — a mesma correção que o `qa-vercel-quadro.js`
// precisou levar em 03/09, quando um `timeout -s KILL` deixava o `vercel.json` mutado no disco.
//
// CUSTO MEDIDO nesta máquina: 7 execuções do portão, ~3 s cada → ~22 s. É controle de funil/CI,
// não de `npm test` (o mesmo critério que mandou `qa-censo-passo2.js` para o funil).
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const FONTE = path.join(RAIZ, 'index.html');

// O AUTOTESTE (lição 2.8 aplicada ao próprio controle): com `--autoteste` o portão medido
// vira um COTO que sai 0 aconteça o que acontecer. A matriz inteira TEM de acusar — e o
// veredito se inverte, porque aqui "falhou" é a prova de que o controle enxerga.
const AUTOTESTE = process.argv.includes('--autoteste');
const COTO = path.join(__dirname, 'tmp-qavf-coto.js');
if (AUTOTESTE) fs.writeFileSync(COTO, 'process.exit(0);\n');
const PORTAO = AUTOTESTE ? COTO : path.join(__dirname, 'qa-verbo-e-fala.js');

let falhas = 0;
const log = (...a) => console.log(...a);
const sec = t => log('\n---- ' + t);
function ok(cond, txt) {
  console.log((cond ? '  ok   ' : '  FALHA ') + txt);
  if (!cond) falhas++;
}

if (!fs.existsSync(FONTE)) {
  console.error('index.html da raiz não existe — rode `npm run build` antes.');
  process.exit(2);
}
if (!fs.existsSync(PORTAO)) {
  console.error('test/qa-verbo-e-fala.js não existe — este controle não tem o que controlar.');
  process.exit(2);
}

const HTML = fs.readFileSync(FONTE, 'utf8');
const temporarios = [];
if (AUTOTESTE) temporarios.push(COTO);

// Escreve uma cópia mutada e devolve o caminho RELATIVO à raiz (que é o que o portão espera em
// JOGO_HTML). Cada troca cobra que a âncora apareça EXATAMENTE uma vez: âncora que sumiu num
// refactor faria o mutante não entrar, e um mutante que não entra passa por "não reprovou".
function copiaMutada(rotulo, trocas) {
  let h = HTML;
  for (const [antes, depois] of trocas) {
    const n = h.split(antes).length - 1;
    if (n !== 1) {
      ok(false, rotulo + ': a âncora da injeção apareceu ' + n + ' vez(es) no index.html ' +
        '(esperado 1) — o mutante NÃO ENTROU: «' + antes.slice(0, 60) + '…»');
      return null;
    }
    h = h.replace(antes, depois);
  }
  const rel = path.join('test', 'tmp-qavf-' + rotulo + '.html');
  fs.writeFileSync(path.join(RAIZ, rel), h);
  temporarios.push(path.join(RAIZ, rel));
  return rel;
}

function rodar(alvoRel, envExtra) {
  const r = spawnSync(process.execPath, [PORTAO], {
    cwd: RAIZ,
    encoding: 'utf8',
    timeout: 120000,
    env: Object.assign({}, process.env, envExtra || {}, alvoRel ? { JOGO_HTML: alvoRel } : {})
  });
  return { status: r.status, saida: (r.stdout || '') + (r.stderr || '') };
}

// `nome` tem de aparecer NUMA LINHA DE FALHA — não basta aparecer na saída, porque o portão
// imprime os 13 capítulos em toda rodada.
function reprovouPor(saida, nome, pedaco) {
  return saida.split('\n').some(l =>
    l.indexOf('FALHA') >= 0 && l.indexOf(nome) >= 0 && (!pedaco || l.indexOf(pedaco) >= 0));
}

// ————— as âncoras do motor, como o build as escreve —————
const VERBO = 'CAPS_VERBO = [iEp("salvador"), iEp("portas"), iEp("praca"), iEp("naodito"), iEp("aceiro"), iEp("segurou"), iEp("temfonte")];';
const FILA = 'CAP_FILA = [iEp("pindorama"), iEp("palmares"), iEp("jabaquara"), iEp("pequenaafrica"), iEp("cais")];';

try {
  // ============================================================
  // 0 · O CONTRAPONTO — sem mutante, o portão passa
  //
  // Sem esta linha, um portão quebrado (que reprovasse SEMPRE) daria seis mutantes "pegos" e
  // este controle verde. É o mesmo par que o `rede-da-casa-veredito.js --controle` faz.
  // ============================================================
  sec('0 · a rodada limpa passa (contraponto: portão que reprova sempre não vale como controle)');
  const limpo = rodar(null, null);
  ok(limpo.status === 0, 'sem mutante o portão sai 0 (saiu ' + limpo.status + ')');

  // ============================================================
  // 1 · O MUTANTE QUE SUSTENTA A ENTREGA — trocar de família de verbo
  //
  // JABAQUARA sai de CAP_FILA e entra em CAPS_VERBO: a mão troca de gesto e a abertura continua
  // dizendo "alcançar é abrir caminho". Medido nesta auditoria: `node test/encaixe.js` INTEIRO
  // sai **exit 0** com este mesmo mutante. É o buraco que o portão auditado existe para fechar.
  // ============================================================
  sec('1 · JABAQUARA troca de família de verbo com a abertura intacta');
  const relD = copiaMutada('familia', [
    [VERBO, VERBO.replace('];', ', iEp("jabaquara")];')],
    [FILA, 'CAP_FILA = [iEp("pindorama"), iEp("palmares"), iEp("pequenaafrica"), iEp("cais")];']
  ]);
  if (relD) {
    const r = rodar(relD, null);
    ok(r.status !== 0, 'o portão reprova (exit ' + r.status + ')');
    ok(reprovouPor(r.saida, 'JABAQUARA', 'família'),
      'e reprova PELO MOTIVO CERTO — a linha de falha nomeia JABAQUARA e a família');
  }

  // ============================================================
  // 2 · O CAPÍTULO NAS DUAS FAMÍLIAS AO MESMO TEMPO
  //
  // `pessoaNaRua()` é `capFila() || capPalavra()`: com o id nas duas listas o gesto fica
  // indefinido e nenhum outro portão diz nada.
  // ============================================================
  sec('2 · JABAQUARA nas DUAS listas ao mesmo tempo');
  const relDuplo = copiaMutada('duplo', [[VERBO, VERBO.replace('];', ', iEp("jabaquara")];')]]);
  if (relDuplo) {
    const r = rodar(relDuplo, null);
    ok(r.status !== 0, 'o portão reprova (exit ' + r.status + ')');
    // A linha esperada é a do BLOCO 3, medida: "FALHA nenhum capítulo tem as duas famílias
    // — TEM: JABAQUARA". Cobrar o pedaço "duas famílias" impede que este mutante seja dado por
    // pego pela asserção 2c, que neste caso passa (com o id nas duas listas, `simFila` é o
    // primeiro a ser lido e a família registrada continua batendo).
    ok(reprovouPor(r.saida, 'JABAQUARA', 'duas famílias'),
      'e reprova PELO MOTIVO CERTO — a linha de falha é a do bloco 3 e nomeia JABAQUARA');
  }

  // ============================================================
  // 3 · O MOTOR SOME E O REGISTRO FICA — fala prometendo o que a mão não faz
  //
  // O QUE TEM FONTE sai de CAPS_VERBO. A abertura continua dizendo "o verbo daqui é conferir".
  // Esta é a dívida que o bloco 5 mede na OUTRA direção e que aqui tem nome.
  // ============================================================
  sec('3 · O QUE TEM FONTE perde o motor e continua no registro');
  const relSemMotor = copiaMutada('sem-motor', [[VERBO, VERBO.replace(', iEp("temfonte")', '')]]);
  if (relSemMotor) {
    const r = rodar(relSemMotor, null);
    ok(r.status !== 0, 'o portão reprova (exit ' + r.status + ')');
    ok(reprovouPor(r.saida, 'O QUE TEM FONTE', 'registro'),
      'e a linha de falha nomeia O QUE TEM FONTE e o registro que sobrou');
  }

  // ============================================================
  // 4 · A INJEÇÃO DECLARADA PELO AUTOR — a abertura perde a frase
  // ============================================================
  sec('4 · a abertura de um capítulo com motor é apagada (QA_SEM_FRASE)');
  const rCais = rodar(null, { QA_SEM_FRASE: 'cais' });
  ok(rCais.status !== 0, 'QA_SEM_FRASE=cais reprova (exit ' + rCais.status + ')');
  ok(reprovouPor(rCais.saida, 'O CAIS QUE VOLTOU À LUZ', 'nomeia o gesto'),
    'e a linha de falha nomeia O CAIS');

  // ============================================================
  // 5 · O DEFEITO QUE NÃO ENTROU TAMBÉM É FALHA
  //
  // Injeção com id que não existe: se isto saísse 0, a prova de mordida do arquivo poderia ser
  // dada com um id errado e ninguém veria.
  // ============================================================
  sec('5 · injeção com id inexistente reprova em vez de passar em silêncio');
  const rNada = rodar(null, { QA_SEM_FRASE: 'este-id-nao-existe' });
  ok(rNada.status !== 0, 'QA_SEM_FRASE com id inexistente reprova (exit ' + rNada.status + ')');
  ok(rNada.saida.indexOf('ID NÃO EXISTE') >= 0, 'e diz que o defeito não entrou');

  // ============================================================
  // 6 · FAIL-CLOSED — alvo sem o jogo não pode sair verde
  //
  // Um portão que abre uma página sem `EPOCAS` e mesmo assim sai 0 é o pior modo de falha desta
  // casa: o do `file://` (mede a coisa errada e passa).
  // ============================================================
  sec('6 · alvo sem o jogo dentro reprova (não sai verde medindo o vazio)');
  const relVazio = path.join('test', 'tmp-qavf-vazio.html');
  fs.writeFileSync(path.join(RAIZ, relVazio), '<!doctype html><title>sem jogo</title><p>vazio</p>');
  temporarios.push(path.join(RAIZ, relVazio));
  const rVazio = rodar(relVazio, null);
  ok(rVazio.status !== 0, 'página sem o jogo reprova (exit ' + rVazio.status + ')');
} finally {
  for (const f of temporarios) { try { fs.unlinkSync(f); } catch (e) {} }
}

if (AUTOTESTE) {
  const viu = falhas >= 10;   // medido: com o coto, 11 das 12 asserções acusam (a de nº 0,
                              // "sem mutante o portão sai 0", é a única que o coto satisfaz)
  log('\nAUTOTESTE: o coto que sai 0 sempre foi acusado em ' + falhas + ' asserção(ões).');
  log(viu ? 'AUTOTESTE PASSOU — este controle enxerga um portão que não reprova.'
          : 'AUTOTESTE FALHOU — o controle deixou um portão cego passar.');
  process.exit(viu ? 0 : 1);
}
log(falhas ? '\nCONTROLE FALHOU em ' + falhas + ' asserção(ões) — o portão do verbo e da fala ' +
  'não foi visto reprovando em tudo o que ele promete cobrir'
  : '\nCONTROLE PASSOU — os 6 mutantes foram vistos reprovando pelo motivo certo, e a rodada limpa passou');
process.exit(falhas ? 1 : 0);
