// A CATRACA (`qa-censo-pintura-fora.js`) DIZ "COM O TAMANHO REGISTRADO". NÃO COBRA. — achado pelo
// QA em 03/09, auditando a entrega `censo-frases-abrandadas`.
//
//   node test/qa-catraca-tamanho-ignorado.js
//
// O CABEÇALHO DE `qa-censo-pintura-fora.js` (linha ~32) afirma:
//
//     "O verde significa o que está medido e nada além: dos mecanismos que o catálogo enumera, os
//      que fogem são exatamente os registrados, com o tamanho registrado."
//
// **A METADE "com o tamanho registrado" NÃO é cobrada.** A catraca (bloco 3 do arquivo) só compara
// CONJUNTOS DE NOMES:
//
//     const novas = Object.keys(fugas).filter((n) => !(n in FUGAS_REGISTRADAS));
//
// `n in FUGAS_REGISTRADAS` é teste de CHAVE, não de VALOR — o número que fica ao lado do nome em
// `FUGAS_REGISTRADAS` nunca é lido para comparação nenhuma. Só aparece numa mensagem de erro
// (`fugas[n] + ' px'`) quando a fuga é NOVA, o que é outro caso.
//
// A PROVA, com exit code real. Este arquivo:
//   1. copia `qa-censo-pintura-fora.js` para um arquivo-irmão temporário (para os `require`
//      relativos continuarem resolvendo) e troca `FUGAS_REGISTRADAS = {}` por
//      `FUGAS_REGISTRADAS = { <mecanismo extra>: 1 }` — um número propositalmente ERRADO;
//   2. roda a cópia com `CATRACA_EXTRA_NOME`/`CATRACA_EXTRA_ESTILO` do próprio cabeçalho de lá
//      (o `pseudoMarkerDoPseudo`, que mede ~367-495 px conforme a máquina — nunca 1);
//   3. apaga a cópia;
//   4. cobra: a catraca patcheada tem de sair **exit 0** mesmo com o número errado — se um dia ela
//      sair 1, a "cobrança de tamanho" passou a existir de verdade e ESTE ARQUIVO fica obsoleto
//      (apague-o, ou vire a asserção do avesso).
//
// O QUE ISTO SIGNIFICA PARA O CABEÇALHO DE LÁ: a frase "com o tamanho registrado" promete mais do
// que o código cumpre. Não é bug de segurança (a régua de nomes ainda pega mecanismo novo), mas é
// exatamente o padrão de número-que-não-é-cobrado que esta rodada inteira tentou consertar em
// outros dois lugares — e aqui ele sobreviveu ao "abrandamento" porque a frase ficou mais modesta
// no que diz sobre o ORÁCULO (furos A/B) e não foi reexaminada linha a linha contra O QUE O CÓDIGO
// DE FATO COMPARA.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const ORIGINAL = path.join(__dirname, 'qa-censo-pintura-fora.js');
const TEMP = path.join(__dirname, '_tmp-qa-tamanho-ignorado-prova.js');

let falhas = 0;
function ok(cond, msg) { console.log((cond ? '  ok  ' : '  X   ') + msg); if (!cond) falhas++; return !!cond; }

(async () => {
  console.log('A CATRACA "COM O TAMANHO REGISTRADO" — prova de que o número nunca é comparado');

  const fonte = fs.readFileSync(ORIGINAL, 'utf8');
  const alvo = 'const FUGAS_REGISTRADAS = {};';
  if (fonte.indexOf(alvo) === -1) {
    console.log('  X   não achei "' + alvo + '" em ' + ORIGINAL + ' — o arquivo mudou, reveja este teste');
    process.exit(1);
  }
  const NOME_EXTRA = 'provaTamanhoIgnorado';
  const NUMERO_ERRADO = 1; // deliberadamente absurdo; a fuga real mede centenas de px
  const patch = fonte.replace(alvo, 'const FUGAS_REGISTRADAS = { ' + NOME_EXTRA + ': ' + NUMERO_ERRADO + ' };');
  fs.writeFileSync(TEMP, patch);

  let saida = '', exitCode = 0;
  try {
    saida = execFileSync('node', [TEMP], {
      cwd: RAIZ,
      env: Object.assign({}, process.env, {
        CATRACA_EXTRA_NOME: NOME_EXTRA,
        CATRACA_EXTRA_ESTILO: '.qaFuga::before{content:"";display:list-item;list-style-type:none}'
          + ' .qaFuga::before::marker{content:"XXXXX";color:#f00;font-size:40px}',
      }),
      encoding: 'utf8',
      timeout: 480000,
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (e) {
    exitCode = (e && typeof e.status === 'number') ? e.status : 1;
    saida = (e && e.stdout) || '';
  } finally {
    fs.unlinkSync(TEMP);
  }

  const linhaFuga = saida.split('\n').find((l) => l.indexOf('FUGA') === 0 || l.indexOf('  FUGA') === 0);
  const m = linhaFuga && linhaFuga.match(/(\d+)\s*px/);
  const pxReal = m ? parseInt(m[1], 10) : null;

  console.log('  registrado (errado, de propósito): ' + NUMERO_ERRADO + ' px');
  console.log('  medido de verdade pela câmera: ' + (pxReal === null ? '(não achei a linha FUGA na saída)' : pxReal + ' px'));
  console.log('  exit code da catraca patcheada: ' + exitCode);

  ok(pxReal !== null && pxReal !== NUMERO_ERRADO,
    'a fuga real mede um número diferente do registrado (' + pxReal + ' px vs ' + NUMERO_ERRADO + ' px) — pré-condição da prova');

  ok(exitCode === 0,
    'CONFIRMADO: a catraca sai exit 0 mesmo com o "tamanho registrado" errado — ela não compara valor,'
    + ' só nome. Se isto virou 1, a cobrança de tamanho passou a existir: apague ou inverta este teste,'
    + ' e corrija/mantenha a frase do cabeçalho de qa-censo-pintura-fora.js de acordo.');

  if (falhas) { console.log('\nREPROVADO — ' + falhas + ' problema(s)'); process.exit(1); }
  console.log('\nok — achado registrado: "com o tamanho registrado" não é cobrado pelo código, só pelo nome');
})();
