// QA — O HOST DA MEDIÇÃO NO `vercel.json`, COBRADO PELO JSON E NÃO PELO TEXTO (02/09)
//
//   node test/qa-vercel-host.js
//   QA_VERCEL_DEFEITO=esquema node test/qa-vercel-host.js     -> tem de sair 1
//
// POR QUE ESTE ARQUIVO EXISTE, e é achado de auditoria com número, não capricho.
//
// A entrega `csp-constante` acrescentou `conferirVercelJson()` ao `ferramentas/construir.js`. Ela
// promete, por escrito no próprio comentário, que "um literal errado (região trocada, host de
// teste esquecido, ERRO DE DEDO) derruba o build antes de chegar à Vercel". A promessa foi testada
// e falha em três das cinco formas que eu injetei, porque a varredura é feita no TEXTO do arquivo
// com a regex `/https:\/\/[a-z0-9.-]*posthog[a-z0-9.-]*/gi` — quem não casa com ela é invisível.
// Medido em 02/09, um por vez, na ocorrência do bloco `/historia` (que nenhuma rota publicada
// resolve, então o `test/csp-paginas.js` também não a vê), com `node ferramentas/construir.js` e
// o exit code lido do comando, nunca do tubo:
//
//   injeção                                        regex vê   BUILD    csp-paginas.js
//   https://eu.i.posthog.com  (região trocada)         sim    exit 1        —
//   http://us.i.posthog.com   (esquema rebaixado)      NÃO    exit 0     exit 0
//   https://us.i.psthog.com   (erro de dedo)           NÃO    exit 0        —
//   https://eu.i.posthog.com (escape JSON)        NÃO    exit 0        —
//   connect-src removido daquela rota                  NÃO    exit 0        —
//
// As três últimas linhas são o mesmo modo de falha do §3 do CLAUDE.md — "errar a região falha em
// SILÊNCIO: os dois endereços respondem 200 OK a qualquer chave, e o sintoma seria um painel vazio
// semanas depois" — e a quinta é pior: a rota perde a contagem inteira e o portão IMPRIME
// "12 ocorrência(s) … todas == MEDIDA_HOST", porque a contagem não é cobrada contra nada.
//
// A CORREÇÃO É DE MÉTODO, e é uma linha de ideia: **cobrar o JSON, não o texto.** Depois do
// `JSON.parse` o escape `p` já virou `p`, o esquema está inteiro no valor, e a diretiva
// `connect-src` de cada regra é uma string que se compara com `MEDIDA_HOST` byte a byte — sem
// regex, sem lista de grafias possíveis. É o mesmo argumento que o cabeçalho do
// `ferramentas/cartao-censo.js` faz para o censo: enumerar o que é PROIBIDO perde para uma
// renomeação; enumerar o que é PERMITIDO, não.
//
// O QUE ESTE ARQUIVO COBRA, e cada linha diz por quê:
//   1. toda regra do `vercel.json` cuja CSP declara `connect-src` declara EXATAMENTE `MEDIDA_HOST`
//      — nem outro esquema, nem outra região, nem host a mais;
//   2. o NÚMERO de regras com `connect-src` é o número de regras da família de seção (as que têm
//      `default-src 'none'` e `img-src`), para uma rota não perder a contagem em silêncio;
//   3. nenhuma menção a "posthog" sobra em lugar nenhum do arquivo fora de um `connect-src` já
//      conferido — pega o host escrito numa diretiva errada (`script-src`, por exemplo).
//
// PROVA DE MORDIDA (EQUIPE.md 2.8): `QA_VERCEL_DEFEITO=<modo>` aplica a injeção EM MEMÓRIA e este
// arquivo tem de sair 1. Os cinco modos são os cinco da tabela acima; os cinco foram vistos
// saindo 1, e sem a variável o arquivo sai 0 contra o `vercel.json` de hoje (13 ocorrências).
// Ele é verde na `main` limpa também — a `main` e a entrega têm o MESMO `vercel.json` (0 linhas
// de diff), então isto não é portão que nasce vermelho.
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const MED = require('../ferramentas/medir-secao.js');
const HOST = MED.MEDIDA_HOST;
const ARQ = path.join(RAIZ, 'vercel.json');

const DEFEITO = process.env.QA_VERCEL_DEFEITO || '';
const TROCAS = {
  regiao: 'https://eu.i.posthog.com',
  esquema: 'http://us.i.posthog.com',
  digito: 'https://us.i.psthog.com',
  unicode: 'https://eu.i.\\u0070osthog.com',
};

let falhas = 0;
function ok(cond, msg) { console.log((cond ? '  ok  ' : '  X   ') + msg); if (!cond) falhas++; return !!cond; }

let texto = fs.readFileSync(ARQ, 'utf8');
if (DEFEITO) {
  // A INJEÇÃO ATACA A SEGUNDA OCORRÊNCIA (a regra `/historia`, sem barra final) DE PROPÓSITO:
  // nenhuma rota publicada a resolve, então ela é o ponto cego do `test/csp-paginas.js` e o único
  // lugar onde a cobrança do `vercel.json` é a ÚNICA que existe.
  let n = -1;
  if (DEFEITO === 'sumir') {
    texto = texto.replace(new RegExp('connect-src ' + HOST.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '; ', 'g'),
      function (m) { n++; return n === 1 ? '' : m; });
  } else if (TROCAS[DEFEITO]) {
    texto = texto.replace(new RegExp(HOST.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      function (m) { n++; return n === 1 ? TROCAS[DEFEITO] : m; });
  } else {
    console.error('QA_VERCEL_DEFEITO desconhecido: ' + DEFEITO + ' (há: regiao, esquema, digito, unicode, sumir)');
    process.exit(2);
  }
  console.log('*** DEFEITO INJETADO EM MEMÓRIA: ' + DEFEITO + ' na 2ª ocorrência (regra /historia) ***');
}

const vercel = JSON.parse(texto);   // se não for JSON válido, falhar aqui já é o resultado certo
const regras = vercel.headers || [];
ok(regras.length > 0, 'vercel.json tem ' + regras.length + ' regra(s) de cabeçalho');

function partir(csp) {
  const d = {};
  String(csp).split(';').forEach(function (p) {
    const t = p.trim(); if (!t) return;
    const i = t.indexOf(' ');
    d[i < 0 ? t : t.slice(0, i)] = i < 0 ? '' : t.slice(i + 1).trim();
  });
  return d;
}

let comConnect = 0, familiaSecao = 0;
for (const r of regras) {
  const cab = {};
  for (const h of (r.headers || [])) cab[h.key] = h.value;
  const csp = cab['Content-Security-Policy'];
  if (!csp) continue;
  const d = partir(csp);
  // 1. o valor do connect-src, byte a byte, DEPOIS do JSON.parse
  if (Object.prototype.hasOwnProperty.call(d, 'connect-src')) {
    comConnect++;
    ok(d['connect-src'] === HOST, 'connect-src de "' + r.source + '" == MEDIDA_HOST'
      + (d['connect-src'] === HOST ? '' : ' — está "' + d['connect-src'] + '" e MEDIDA_HOST é "' + HOST + '"'));
  }
  // 2. a família de seção: quem tem `default-src 'none'` E `img-src` é página de leitura, e
  //    página de leitura manda evento — se ela perdeu o connect-src, perdeu a contagem.
  if (d['default-src'] === "'none'" && Object.prototype.hasOwnProperty.call(d, 'img-src')) {
    familiaSecao++;
    ok(Object.prototype.hasOwnProperty.call(d, 'connect-src'),
      '"' + r.source + '" é da família de seção e declara connect-src'
      + (Object.prototype.hasOwnProperty.call(d, 'connect-src') ? '' : ' — SUMIU: esta rota perdeu a contagem em silêncio'));
  }
}
ok(comConnect === familiaSecao && comConnect > 0,
  'toda rota com connect-src é da família de seção e vice-versa — ' + comConnect + ' de ' + familiaSecao);

// 3. nenhuma menção solta ao host fora de um connect-src conferido (host numa diretiva errada,
//    host num campo que não é cabeçalho, host num comentário-que-não-existe-em-JSON…)
const mencoes = (texto.match(/posthog/gi) || []).length;
ok(mencoes === comConnect, 'a palavra "posthog" aparece ' + mencoes + ' vez(es) no arquivo e há '
  + comConnect + ' connect-src conferido(s) — sobra nenhuma'
  + (mencoes === comConnect ? '' : ' — há menção ao host fora de um connect-src conferido'));

console.log('');
if (falhas) { console.error('REPROVADO — ' + falhas + ' problema(s)'); process.exit(1); }
console.log('ok — ' + comConnect + ' rota(s) com connect-src, todas == ' + HOST);
process.exit(0);
