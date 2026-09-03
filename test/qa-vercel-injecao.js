// A INJEÇÃO DO vercel.json SEM TOCAR NO vercel.json — 03/09, item `csp-tabela-de-rotas-e-conjunto`.
//
// NÃO É UM PORTÃO. É um PRÉ-CARREGAMENTO, usado assim:
//
//   QA_VERCEL_INJETADO=/tmp/x.json node -r ./test/qa-vercel-injecao.js ferramentas/construir.js
//   QA_VERCEL_INJETADO=/tmp/x.json node -r ./test/qa-vercel-injecao.js test/qa-vercel-host.js
//
// O `./` não é enfeite: sem ele o `-r` procura em `node_modules` e o processo morre com
// MODULE_NOT_FOUND antes de rodar o portão — medido, exit 1 com a mensagem errada, que é o jeito
// mais rápido de alguém achar que o portão reprovou. O `test/qa-vercel-quadro.js` passa o caminho
// ABSOLUTO e não tem essa armadilha.
//
// POR QUE ELE EXISTE, e o número é medido. Até 03/09 o `test/qa-vercel-quadro.js` provava a
// mordida do quadro ESCREVENDO o defeito no `vercel.json` da raiz e restaurando depois, em
// `finally` e num `process.on('exit')`. Medido nesta máquina, com exit code real do terminal:
//
//   timeout -s TERM  5 node test/qa-vercel-quadro.js   -> exit 124 (o filho levou SIGTERM)
//     `git status` depois: ` M vercel.json` · `git diff --numstat`: 21 linhas a mais
//     (a regra `/historia` DUPLICADA, deixada no arquivo que a Vercel publica)
//   timeout -s KILL  5 node test/qa-vercel-quadro.js   -> exit 137
//     mesmo estrago: 21 linhas a mais no `vercel.json` da raiz
//   timeout -s INT   5 node test/qa-vercel-quadro.js   -> exit 124, e o processo NÃO parou:
//     imprimiu os 14 casos até o fim. O `process.on('SIGINT')` era CÓDIGO MORTO — o `spawnSync`
//     bloqueia o laço de eventos, então o manipulador só rodaria depois do build, que é
//     exatamente quando ele não é mais preciso. E o sinal, chegando ao GRUPO, matou o build
//     filho e produziu VERMELHO FALSO: `X duplicata  build exit null`.
//
// `main` é produção e publica na Vercel a cada push (CLAUDE.md §8). Um portão de segurança que,
// interrompido, deixa `script-src 'unsafe-inline' https://exfil.example.com` no arquivo de
// cabeçalhos não é um portão: é a superfície que ele deveria fechar, aberta pelo próprio guarda.
//
// A SAÍDA ESCOLHIDA, E POR QUE NÃO A OUTRA. Havia duas: (a) esta — mutar em memória e desviar a
// leitura; (b) restaurar de uma cópia de nome fixo na ENTRADA da execução seguinte. A (b) foi
// recusada por três razões, e nenhuma é de gosto:
//   1. ela não fecha o buraco, só encurta a janela. Entre o SIGKILL e a próxima execução o
//      `vercel.json` fica poluído no disco — e o que publica não é a próxima execução, é o
//      `git push`. Basta um `git add -A && git push` no meio para a política envenenada ir ao ar;
//   2. a cópia de nome fixo é feita de quê? Se for feita na entrada a partir do arquivo atual,
//      uma execução morta anterior já poluiu esse arquivo e a cópia CANONIZA o veneno. Se for
//      feita só quando ainda não existe, ela vira estado durável em `/tmp` que ninguém revisa e
//      que sobrevive a mudanças legítimas do `vercel.json` — restaurar dela apagaria a mudança;
//   3. nome fixo mais duas execuções em paralelo (o CI e um agente, ou dois agentes em worktrees
//      diferentes que compartilham `/tmp`) é uma execução restaurando o arquivo enquanto a outra
//      tem o defeito injetado: as duas viram ruído, e o vermelho passa a ser intermitente.
// A (a) não tem janela nenhuma: o `vercel.json` da raiz NUNCA é aberto para escrita. O arquivo
// injetado vive em `os.tmpdir()`, com o pid no nome, FORA do repositório — um SIGKILL no pior
// instante deixa lixo em `/tmp` e o repositório intacto.
//
// POR QUE O DESVIO MORA AQUI E NÃO NUMA VARIÁVEL LIDA PELO `construir.js`. A outra forma de
// passar o caminho seria o build aceitar `VERCEL_JSON=...` e conferir esse arquivo. Isso põe no
// build de produção um botão que aponta a ÚNICA conferência dos cabeçalhos publicados para outro
// arquivo — `VERCEL_JSON=/tmp/limpo.json npm run build` sairia 0 com o `vercel.json` de verdade
// envenenado. O buraco seria pequeno e real, e é o tipo de conveniência que o §3 manda não abrir.
// Aqui o `ferramentas/construir.js` não ganha botão nenhum: quem desvia é o processo de teste,
// por `-r`, e o build de produção continua sem caminho para ler outra coisa.
//
// O DESVIO NÃO PODE FALHAR EM SILÊNCIO. Se um dia o `construir.js` passar a ler o `vercel.json`
// por outro caminho (`fs.promises`, `readFile` assíncrono, `require`), o desvio deixaria de pegar
// e o build leria o arquivo LIMPO — e todos os casos com defeito sairiam 0, isto é, o arquivo de
// prova de mordida viraria decoração assinada de verde (lição 2.8). Duas coisas impedem isso:
//   · este arquivo imprime, ao sair, `[injecao-vercel] N leitura(s) desviada(s)`;
//   · o `test/qa-vercel-quadro.js` EXIGE N >= 1 em cada caso injetado e reprova sem isso.
// Falha de desvio vira, portanto, vermelho — nunca verde.
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const ALVO = path.join(RAIZ, 'vercel.json');
const FONTE = process.env.QA_VERCEL_INJETADO;
if (!FONTE) {
  console.error('qa-vercel-injecao.js: falta QA_VERCEL_INJETADO com o caminho do vercel.json injetado.');
  console.error('  Este arquivo não é um portão — é um `-r` para os portões que precisam ler outro vercel.json.');
  process.exit(2);
}
if (!fs.existsSync(FONTE)) {
  console.error('qa-vercel-injecao.js: QA_VERCEL_INJETADO aponta para "' + FONTE + '", que não existe.');
  process.exit(2);
}
const TEXTO = fs.readFileSync(FONTE, 'utf8');

let desvios = 0;
const ehOAlvo = function (p) {
  if (typeof p !== 'string') return false;             // fd, Buffer e URL não são o caminho do build
  try { return path.resolve(p) === ALVO; } catch (e) { return false; }
};
// A codificação pode vir como string ("utf8") ou dentro de um objeto ({ encoding: "utf8" }).
// Sem codificação, `readFileSync` devolve Buffer — e devolver string ali mudaria o tipo debaixo
// de quem chama, que é o jeito de um desvio de teste inventar um defeito que não existe.
const lerOriginal = fs.readFileSync;
fs.readFileSync = function (arquivo, opcoes) {
  if (!ehOAlvo(arquivo)) return lerOriginal.apply(fs, arguments);
  desvios++;
  const cod = typeof opcoes === 'string' ? opcoes : (opcoes && opcoes.encoding);
  return cod ? Buffer.from(TEXTO, 'utf8').toString(cod) : Buffer.from(TEXTO, 'utf8');
};
const existiaOriginal = fs.existsSync;
fs.existsSync = function (arquivo) {
  if (ehOAlvo(arquivo)) return true;
  return existiaOriginal.apply(fs, arguments);
};

process.on('exit', function () {
  // stderr, e não stdout, para não entrar no meio da saída que os portões imprimem.
  try { process.stderr.write('[injecao-vercel] ' + desvios + ' leitura(s) desviada(s)\n'); } catch (e) { /* pipe fechado */ }
});
