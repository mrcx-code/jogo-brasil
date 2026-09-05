// A REGRA DE RUÍDO DE REDE EXTERNA — POR ORIGEM, NUNCA POR TEXTO.
//
// ACHADO DO QA em 04/09 (rodada nuvem-20260904T2022, item
// `rede-externa-e-substring-de-texto-e-engole-erro-real`): `test/ver-territorio.js` e
// `test/qa-salvador-vivo.js` decidiam se um erro de console era "a máquina, não o jogo" casando
// SUBSTRING DO TEXTO contra `/posthog|ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY/`. Medido com dois
// erros REAIS fabricados de propósito: o filtro engoliu 2 de 3 — um `console.error()` do próprio
// jogo que só MENCIONASSE "posthog" no texto desaparecia do mesmo jeito que o ruído de verdade.
//
// A CURA JÁ ESTAVA ESCRITA NO PRÓPRIO REPOSITÓRIO, uma porta ao lado: `test/encaixe.js` decide
// pela ORIGEM (`m.location().url` contra `MEDIDA_HOST`, a constante única do §3 do CLAUDE.md) e
// isso está PROVADO por `test/filtro-console-controle.js` com seis cenas reais no jogo de
// verdade — incluindo os dois casos que uma regra "origem == host basta" erraria: uma resposta
// HTTP real do host da medição (404/400 — CULPA DO JOGO, tem de acusar) e um `console.error()`
// disparado no mesmo host mas que não é falha de carga (também tem de acusar). Este arquivo
// EXTRAI essa regra já testada, em vez de escrever uma quarta variante.
//
// A REGRA, nesta ordem:
//   1. só `m.type() === 'error'` entra na pergunta;
//   2. SEM `m.location().url` NUNCA é ruído — "não sei de onde veio" tem de contar como erro
//      real, nunca virar "ignorado" por acidente (nem todo console message carrega location útil,
//      ex.: exceção lançada de um contexto sem script);
//   3. só é ruído se a URL É o `MEDIDA_HOST` ou continua nele por `/` (o único host externo que
//      a CSP do jogo permite; comparar prefixo CRU calaria um domínio VIZINHO que só compartilha
//      os caracteres — ver `ehDoHostDaMedicao` no fim do arquivo) E o texto é exatamente
//      "Failed to load resource: net::ERR_..." — o Chromium usa
//      essa MESMA frase para "não cheguei lá" (rede de quem roda: proxy, adblock, túnel) e para
//      "cheguei e o servidor respondeu 404/400" (endereço errado — culpa do jogo, e o §3.2 do
//      CLAUDE.md chama isso de pior modo de falha porque os dois endereços de verdade respondem
//      200 OK a qualquer coisa). Sem o `net::ERR_` no texto, mesmo estando no host certo, o erro
//      acusa.
//
// O QUE ISTO NÃO COBRE: o favicon (outro host/caminho — 404 do próprio servidor de teste). Cada
// portão que precisa disso continua testando `/\/favicon\.ico$/.test(url)` por conta própria,
// porque já é uma checagem por origem/caminho, não por texto (a metade que já estava certa).
//
// USO:
//   const { ehRuidoDeRedeExterna } = require('./rede-externa.js');
//   pg.on('console', (m) => {
//     if (m.type() !== 'error') return;
//     (ehRuidoDeRedeExterna(m) ? ignorados : erros).push('console: ' + m.text());
//   });
'use strict';

const { MEDIDA_HOST } = require('../ferramentas/medir-secao.js');

function ehRuidoDeRedeExterna(m) {
  if (m.type() !== 'error') return false;
  const url = (m.location && m.location().url) || '';
  if (!url) return false; // sem origem: nunca vira "ignorado" por acidente — conta como erro real
  return ehDoHostDaMedicao(url) && /Failed to load resource: net::ERR_/i.test(m.text());
}

// A ORIGEM É O HOST DA MEDIÇÃO — comparação EXATA ou prefixo de CAMINHO, nunca prefixo de texto.
//
// ACHADO DO QA em 05/09 (nuvem-20260905T0023, item `rede-externa-compara-prefixo-cru-e-cala-
// dominio-vizinho`): a linha era `url.indexOf(MEDIDA_HOST) === 0`, prefixo CRU de string. Com
// isso `https://us.i.posthog.com.atacante.example/x` e `https://us.i.posthog.comx.example/x`
// eram CALADOS junto com o host de verdade — são domínios DIFERENTES, e erro deles tem de
// acusar. Não é explorabilidade de produção (isto é instrumento de teste); é uma cegueira que
// cresceu de tamanho quando o helper passou de 3 para 21 arquivos.
//
// A regra: ou a URL é o host inteiro (`https://us.i.posthog.com`), ou ela continua com `/`, que
// é a única coisa que pode seguir um host numa URL sem trocar de host.
function ehDoHostDaMedicao(url) {
  return url === MEDIDA_HOST || url.startsWith(MEDIDA_HOST + '/');
}

module.exports = { ehRuidoDeRedeExterna, ehDoHostDaMedicao, MEDIDA_HOST };
