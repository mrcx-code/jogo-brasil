// A PROVA DE MORDIDA de `porta-entrada-cresce-em-silencio` — 03/09.
//
//   node test/porta-ctx-sem-forma.js
//
// O QUE ESTE ITEM CONSERTOU. `CTX_B64["vao-cidade-africana"]` não tinha prefixo `capN` — é a
// panorâmica de um MARCO ("A cidade africana"), não de um capítulo — então a regex de
// `pacoteDoEndereco`/`conhecido` (ferramentas/pacotes.js) nunca a via, e ela pagava 60,9 KB
// (62.371 bytes de data URI) na PORTA DE ENTRADA em silêncio, sob um AVISO que ninguém reprova.
// Medido por nuvem-20260902T1623 em 02/09, conferido de forma independente por
// nuvem-20260903T0822 em 03/09.
//
// O CONSERTO tem duas metades: (1) `PACK_DO_CTX_EXTRA` classifica a chave por nome, à mão, para
// "salvador"; (2) `formaCtxDaChave()` separa "capítulo em obra" (prefixo `capN` sem entrada na
// tabela — AVISO, cresce sozinho) de "forma desconhecida" (nem `capN` nem `PACK_DO_CTX_EXTRA` —
// ERRO, o build reprova) e `ferramentas/construir.js` derruba o build (exit 1) só no segundo caso.
//
// A REGRA É POR TABELA, NÃO GLOBAL — e é a armadilha que o item avisou explicitamente: `QUAD_B64`
// tem 20 chaves sem prefixo `capN` (`p1`..`p6`, `p07-africa`…) e `TRAV_B64` tem `mar`, as duas de
// PROPÓSITO. Uma regex `capN` aplicada a TODAS as tabelas acusaria os 21 de uma vez. Este arquivo
// prova as duas pontas: a mordida (CTX_B64 sem forma reprova) e o CONTROLE PERIGOSO (QUAD_B64 e
// TRAV_B64 intactas continuam exit 0).
//
// COMO ELE MEDE: para a mordida e a restauração, ele roda `ferramentas/construir.js` DE VERDADE
// como processo separado — não a função isolada — porque o que precisa ser provado é o PORTÃO,
// o mesmo binário que a `main` roda. A injeção não toca `ferramentas/pacotes.js` em disco: ela
// muta o `require.cache` num pré-carregamento (`test/porta-ctx-injecao.js`), do mesmo jeito que
// `test/qa-vercel-injecao.js` desvia leitura de arquivo — ver o porquê da forma por extenso lá.
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const CONSTRUIR = path.join(RAIZ, 'ferramentas', 'construir.js');
const PRELOAD = path.join(__dirname, 'porta-ctx-injecao.js');
const MARCA = /\[injecao-porta-ctx\] (\d+) chave\(s\) apagada\(s\)/;

// `comTsc` existe por causa de um vermelho FALSO que o porteiro reproduziu em 03/09, e que
// custaria uma sessão a quem o encontrasse no CI. `--sem-tsc` faz o `construir.js` pular a
// compilação e ler `build/jogo.js` — que é **gitignored** (`.gitignore:17`) e não rastreado.
// Num checkout limpo, que é exatamente o caso do CI, esse arquivo NÃO EXISTE, e as três
// asserções saíam vermelhas por um motivo que nada tem a ver com o defeito que elas medem.
// Pior que a ausência é a versão VELHA: numa árvore onde outra entrega já compilou, o
// `--sem-tsc` mede o que foi compilado da última vez, não o `src/` de agora — e aí ele fabrica
// verde falso, que ninguém procuraria. Foi assim que o próprio porteiro se auto-desmentiu:
// uma chave `phx_` injetada por ele minutos antes tinha ficado compilada ali dentro.
// Conserto: a PRIMEIRA passada compila de verdade e deixa `build/jogo.js` fresco; as
// seguintes reaproveitam com `--sem-tsc`, que era o ganho de tempo original.
function rodarBuild(remover, comTsc) {
  const args = [];
  const env = Object.assign({}, process.env);
  if (remover) {
    args.push('-r', PRELOAD);
    env.PORTA_CTX_REMOVER = remover;
  } else {
    delete env.PORTA_CTX_REMOVER;
  }
  args.push(CONSTRUIR);
  if (!comTsc) args.push('--sem-tsc');   // --sem-tsc: este teste mede a classificação de arte, não o tsc — mais rápido, e o tsc já roda no `npm test`
  const r = spawnSync(process.execPath, args, { cwd: RAIZ, encoding: 'utf8', env: env, maxBuffer: 64 * 1024 * 1024 });
  const saida = String(r.stdout || '') + String(r.stderr || '');
  const m = saida.match(MARCA);
  return { code: r.status, saida: saida, apagadas: m ? Number(m[1]) : null };
}

let falhas = 0;
function ok(cond, msg) {
  if (cond) { console.log('  OK  ' + msg); }
  else { console.log('  FALHA  ' + msg); falhas++; }
}

console.log('PROVA DE MORDIDA — porta-entrada-cresce-em-silencio (CTX_B64 sem forma de capítulo)');
console.log('');

// ---- 1) checagens diretas da tabela (sem subprocesso) ----
console.log('1) as tabelas de ferramentas/pacotes.js, direto (sem build)');
{
  delete require.cache[require.resolve('../ferramentas/pacotes.js')];
  const P = require('../ferramentas/pacotes.js');

  ok(P.conhecido(['CTX_B64', 'vao-cidade-africana']) === true,
    'CTX_B64[vao-cidade-africana] passou a ser conhecido()');
  ok(P.pacoteDoEndereco(['CTX_B64', 'vao-cidade-africana']) === 'salvador',
    'CTX_B64[vao-cidade-africana] classificado para o pacote "salvador"');
  ok(P.formaCtxDaChave('vao-cidade-africana') === 'extra',
    'a forma dela é "extra" (PACK_DO_CTX_EXTRA), não capítulo');

  // capítulo em obra: tem CARA de capN mas essa posição não está na tabela — isto é AVISO, não erro
  ok(P.formaCtxDaChave('cap37-nada') === 'capitulo',
    'capN cuja posição ainda não existe na tabela é "capitulo" (cresce sozinho, não é erro)');
  ok(P.conhecido(['CTX_B64', 'cap37-nada']) === false,
    'e continua não-conhecido até alguém acrescentar a linha — comportamento antigo intocado');

  // chave verdadeiramente sem forma nenhuma
  ok(P.formaCtxDaChave('qualquer-outra-coisa') === 'desconhecida',
    'chave sem capN e sem PACK_DO_CTX_EXTRA é "desconhecida" — a classe que o build reprova');

  // ---- O CONTROLE PERIGOSO: QUAD_B64 e TRAV_B64 não podem ser tocadas por este conserto ----
  console.log('');
  console.log('2) controle perigoso — as 21 chaves sem prefixo capN que NÃO podem reprovar');
  const QUAD_SEM_PREFIXO = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p07-africa', 'p08-captura',
    'p09-navio', 'p10', 'p10-travessia', 'p11', 'p11-oceano', 'p12', 'p13', 'p18', 'p19', 'p21', 'p23', 'p26'];
  let quadOk = true;
  for (const chave of QUAD_SEM_PREFIXO) {
    if (P.conhecido(['QUAD_B64', chave]) !== true) { quadOk = false; console.log('    ' + chave + ' NAO e conhecido()'); }
  }
  ok(quadOk, 'as ' + QUAD_SEM_PREFIXO.length + ' chaves de QUAD_B64 sem prefixo capN continuam conhecido()===true');
  ok(P.conhecido(['TRAV_B64', 'mar']) === true, 'TRAV_B64[mar], sem prefixo capN, continua conhecido()===true');
}

// ---- 2) a mordida de verdade: build real, com e sem o defeito injetado ----
console.log('');
console.log('3) o build de verdade (processo separado), com a injeção de require.cache');

{
  // COM tsc, e só esta: ela é quem deixa `build/jogo.js` fresco para as duas seguintes.
  const semDefeito = rodarBuild(null, true);
  ok(semDefeito.code === 0, 'SEM injeção (repositório como está): build sai 0 — ' + 'exit=' + semDefeito.code);
  ok(!/CTX_B64 tem \d+ chave/.test(semDefeito.saida), 'e não imprime a mensagem de CTX_B64 sem forma');
}

{
  const comDefeito = rodarBuild('vao-cidade-africana');
  ok(comDefeito.apagadas === 1, 'a injeção apagou 1 chave de PACK_DO_CTX_EXTRA (desvio confirmado, não decoração) — apagadas=' + comDefeito.apagadas);
  ok(comDefeito.code === 1, 'COM a chave apagada (simula "nunca classificada"): build sai 1 — exit=' + comDefeito.code);
  ok(/CTX_B64 tem 1 chave/.test(comDefeito.saida) && /vao-cidade-africana/.test(comDefeito.saida),
    'a mensagem nomeia a chave e a tabela');
  ok(/PACK_DO_CTX_EXTRA/.test(comDefeito.saida), 'a mensagem diz onde consertar (PACK_DO_CTX_EXTRA)');
}

{
  // restauração: injeta e IMEDIATAMENTE roda de novo sem remover nada — prova que o processo
  // seguinte, sem o env, volta a ler a tabela intacta (o require.cache mutado morreu com o
  // processo anterior; nada em disco foi tocado).
  const restaurado = rodarBuild(null);
  ok(restaurado.code === 0, 'processo seguinte, sem a injeção: volta a sair 0 — exit=' + restaurado.code);
}

console.log('');
if (falhas) { console.log(falhas + ' FALHA(S)'); process.exit(1); }
console.log('tudo verde.');
