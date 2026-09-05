// UNIDADE DO FILTRO DE RUÍDO DE REDE EXTERNA — a mordida por ORIGEM, nos dois sentidos.
// dev-jogo, 05/09. Item `rede-externa-compara-prefixo-cru-e-cala-dominio-vizinho`.
//
// POR QUE ESTE ARQUIVO EXISTE. `test/qa-rede-externa-erro-real.js` e
// `test/filtro-console-controle.js` medem o filtro num Chromium de verdade, com cenas reais.
// Nenhum dos dois consegue fabricar a cena que este item achou: um DOMÍNIO VIZINHO que só
// compartilha os caracteres do começo do `MEDIDA_HOST` (`https://us.i.posthog.com.atacante.
// example`, `https://us.i.posthog.comx.example`). Registrar esse domínio não está ao alcance de
// ninguém aqui — mas a decisão do filtro é uma função pura de (tipo, texto, url), e função pura
// se mede por unidade. É o que este arquivo faz, sem navegador e sem rede.
//
// O DEFEITO MEDIDO: a linha era `url.indexOf(MEDIDA_HOST) === 0` — prefixo CRU de string, que
// não distingue "o host" de "um host mais longo que começa igual". Erro de um domínio vizinho
// era CALADO junto com o ruído legítimo.
//
// ESTE ARQUIVO NÃO SERVE DE NADA SE NÃO PEGAR A VOLTA. Por isso ele roda cada caso DUAS vezes:
// pela regra de hoje e pela REGRA VELHA reescrita aqui como controle. Se a regra velha passar
// nos mesmos casos, o teste não mede nada e ele mesmo REPROVA dizendo isso.
//
//   node test/rede-externa-unidade.js     # exit 0 = a mordida existe e o teste a detecta
'use strict';

const { ehRuidoDeRedeExterna, ehDoHostDaMedicao, MEDIDA_HOST } = require('./rede-externa.js');

const RUIDO = 'Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED';

// mensagem de console falsa, com a mesma superfície que o Playwright entrega
function msg(url, txt, tipo) {
  return { type: () => tipo || 'error', text: () => txt, location: () => ({ url: url }) };
}

// CONTROLE — a regra VELHA, tal como estava em `rede-externa.js:49` antes deste item.
// Ela existe só para provar que os casos abaixo separam as duas regras.
function regraVelha(m) {
  if (m.type() !== 'error') return false;
  const url = (m.location && m.location().url) || '';
  if (!url) return false;
  return url.indexOf(MEDIDA_HOST) === 0 && /Failed to load resource: net::ERR_/i.test(m.text());
}

const CASOS = [
  // id                                    url                                    texto    esperado
  ['o host da medição, caminho do evento', MEDIDA_HOST + '/i/v0/e/', RUIDO, 'calar'],
  ['o host da medição, nu (sem caminho)', MEDIDA_HOST, RUIDO, 'calar'],
  ['o host da medição, com porta explícita', MEDIDA_HOST + ':443/i/v0/e/', RUIDO, 'acusar'],
  ['VIZINHO: subdomínio colado por ponto', MEDIDA_HOST + '.atacante.example/x', RUIDO, 'acusar'],
  ['VIZINHO: mesma raiz com letra colada', MEDIDA_HOST + 'x.example/x', RUIDO, 'acusar'],
  ['VIZINHO: hífen colado no host', MEDIDA_HOST + '-falso.example/x', RUIDO, 'acusar'],
  ['outro host qualquer', 'https://exemplo.invalid/x', RUIDO, 'acusar'],
  ['o host certo, mas o texto não é net::ERR_', MEDIDA_HOST + '/i/v0/e/',
    'Failed to load resource: the server responded with a status of 503', 'acusar'],
  ['erro sem url de origem', '', RUIDO, 'acusar'],
];

console.log('MEDIDA_HOST = ' + MEDIDA_HOST + '\n');
console.log('  ' + 'caso'.padEnd(46) + 'esperado  hoje      regra velha');

let falhas = 0, separou = 0;
CASOS.forEach(function (c) {
  const m = msg(c[1], c[2]);
  const hoje = ehRuidoDeRedeExterna(m) ? 'calar' : 'acusar';
  const velha = regraVelha(m) ? 'calar' : 'acusar';
  const certo = hoje === c[3];
  if (!certo) falhas++;
  if (hoje !== velha) separou++;
  console.log('  ' + c[0].padEnd(46) + c[3].padEnd(10) + hoje.padEnd(10) + velha
    + (certo ? '' : '   *** FORA DA PROMESSA ***'));
});

// tipo diferente de 'error' nunca entra na pergunta — a porta 1 da regra
if (ehRuidoDeRedeExterna(msg(MEDIDA_HOST + '/i/v0/e/', RUIDO, 'warning'))) {
  console.log('  FALHA  um console de tipo "warning" foi classificado como ruído — a regra 1 caiu');
  falhas++;
}

// a função de origem, medida sozinha
[[MEDIDA_HOST, true], [MEDIDA_HOST + '/', true], [MEDIDA_HOST + '/i/v0/e/', true],
[MEDIDA_HOST + '.atacante.example/x', false], [MEDIDA_HOST + 'x', false], ['', false]]
  .forEach(function (p) {
    if (ehDoHostDaMedicao(p[0]) !== p[1]) {
      console.log('  FALHA  ehDoHostDaMedicao(' + JSON.stringify(p[0]) + ') deveria ser ' + p[1]);
      falhas++;
    }
  });

console.log('\n  casos em que a regra de hoje e a regra VELHA discordam: ' + separou);
if (separou === 0) {
  console.log('  FALHA  nenhum caso separa as duas regras — este teste passaria com o defeito no lugar,');
  console.log('         logo ele não mede nada. Acrescente um caso que a regra velha erre.');
  falhas++;
}

console.log('\n' + (falhas ? 'REPROVOU (' + falhas + ')' : 'PASSOU — o filtro decide pelo host, não pelo prefixo de texto'));
process.exit(falhas ? 1 : 0);
