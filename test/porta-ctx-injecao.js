// A INJEÇÃO DO PACK_DO_CTX_EXTRA SEM TOCAR EM ferramentas/pacotes.js — 03/09, item
// `porta-entrada-cresce-em-silencio`.
//
// NÃO É UM PORTÃO. É um PRÉ-CARREGAMENTO, usado assim:
//
//   PORTA_CTX_REMOVER=vao-cidade-africana node -r ./test/porta-ctx-injecao.js ferramentas/construir.js
//
// Mesma forma do `test/qa-vercel-injecao.js`, mas para um MÓDULO, não um arquivo de config:
// `ferramentas/pacotes.js` é `require()`ado, não lido por `fs.readFileSync`, então o desvio não
// é sobre leitura de bytes — é sobre o CACHE de módulo do Node. `require()` guarda o resultado em
// `require.cache`, indexado pelo caminho ABSOLUTO resolvido; quem pede o mesmo caminho de novo
// recebe o MESMO objeto (`module.exports`), não uma cópia. Este arquivo roda ANTES de
// `ferramentas/construir.js` (via `-r`), carrega `ferramentas/pacotes.js` primeiro — populando
// esse cache — e MUTA o objeto `PACK_DO_CTX_EXTRA` exportado, apagando a(s) chave(s) pedidas por
// `PORTA_CTX_REMOVER` (lista separada por vírgula). Quando `ferramentas/construir.js` faz
// `require('./pacotes.js')` mais tarde, o Node devolve o MESMO objeto já mutado — nenhuma escrita
// em disco, em arquivo nenhum, em momento nenhum. Um SIGKILL no pior instante não deixa lixo.
//
// Isto simula exatamente o defeito que o item mediu: uma chave de CTX_B64 que NUNCA teve entrada
// em `PACK_DO_CTX_EXTRA` — nem por prefixo `capN` (ela não tem), nem por exceção nomeada (aqui,
// apagada de propósito). É o estado do repositório ANTES do conserto desta rodada.
const path = require('path');

const ALVO = path.resolve(__dirname, '..', 'ferramentas', 'pacotes.js');
const remover = String(process.env.PORTA_CTX_REMOVER || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);

let apagadas = 0;
if (remover.length) {
  const mod = require(ALVO);   // popula require.cache[ALVO] — o mesmo que construir.js vai pegar
  for (const chave of remover) {
    if (Object.prototype.hasOwnProperty.call(mod.PACK_DO_CTX_EXTRA, chave)) {
      delete mod.PACK_DO_CTX_EXTRA[chave];
      apagadas++;
    }
  }
}

process.on('exit', function () {
  try { process.stderr.write('[injecao-porta-ctx] ' + apagadas + ' chave(s) apagada(s) de PACK_DO_CTX_EXTRA\n'); } catch (e) { /* pipe fechado */ }
});
