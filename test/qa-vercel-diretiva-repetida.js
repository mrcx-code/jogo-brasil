// QA — DIRETIVA DE CSP REPETIDA NO `vercel.json`: O NAVEGADOR APLICA A PRIMEIRA, OS PORTÕES
// LEEM A ÚLTIMA (03/09).
//
//   node test/qa-vercel-diretiva-repetida.js               -> 0 contra o vercel.json de hoje
//   QA_DUP_DEFEITO=1 node test/qa-vercel-diretiva-repetida.js  -> tem de sair 1 (lição 2.8)
//   node test/qa-vercel-diretiva-repetida.js --navegador   -> mede a semântica num Chromium
//
// POR QUE ELE EXISTE, e é achado de auditoria com exit code, não capricho.
//
// A entrega `csp-host-constante` (03/09) fez `conferirVercelJson()` cobrar o JSON DEPOIS do
// parse, e isso está certo: o escape unicode vira letra e o esquema entra no valor. Ela e o
// `test/qa-vercel-host.js` (02/09) fazem os dois a mesma coisa para partir a CSP — montam um
// OBJETO, `d[nome] = valor`, varrendo as diretivas na ordem. Objeto guarda UMA chave: quando a
// mesma diretiva aparece duas vezes na mesma CSP, os dois portões leem a ÚLTIMA.
//
// O NAVEGADOR FAZ O CONTRÁRIO. CSP Level 3, §"Parse a serialized CSP": se o conjunto já contém
// uma diretiva com aquele nome, a instância nova é IGNORADA. Vale a PRIMEIRA. Medido aqui num
// Chromium de verdade (`--navegador`, três origens locais, portas diferentes): a 1ª
// `connect-src` PASSOU e a 2ª foi BLOQUEADA.
//
// A CONSEQUÊNCIA, medida em 03/09 injetando no `vercel.json` em disco, um por vez, exit code
// lido do comando:
//
//   injeção                                                     BUILD   qa-vercel-host.js
//   1ª connect-src = https://exfil.example.com (a 2ª correta)   exit 0      exit 0
//   1ª connect-src = https://eu.i.posthog.com  (a 2ª correta)   exit 1      exit 1
//
// A segunda linha só morde por acidente: a contagem da palavra "posthog" passa de 13 para 14 e
// a asserção 4 reprova. Um host que NÃO tenha "posthog" no nome — que é justamente o caso que
// interessa — atravessa os dois portões, e o que a Vercel serve é `connect-src
// https://exfil.example.com`: a medição das quatro seções morre em SILÊNCIO (o §3 do CLAUDE.md:
// "o sintoma seria um painel vazio semanas depois") e um endereço que ninguém aprovou passa a
// ser o único alcançável.
//
// A COBRANÇA AQUI É DE FORMA, NÃO DE VALOR, e de propósito: nenhuma CSP deste arquivo pode
// repetir diretiva NENHUMA. É mais larga que o host porque a mesma armadilha vale para
// `script-src` e `img-src` — e porque uma regra de forma não precisa saber quais valores são
// legítimos hoje.
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const ARQ = path.join(RAIZ, 'vercel.json');
const CABECALHO_CSP = 'Content-Security-Policy';

let falhas = 0;
function ok(cond, msg) { console.log((cond ? '  ok  ' : '  X   ') + msg); if (!cond) falhas++; return !!cond; }

// Conta quantas vezes cada nome de diretiva aparece — sem montar objeto, que é justamente o
// erro que este arquivo existe para pegar.
function contarDiretivas(valor) {
  const conta = {};
  String(valor).split(';').forEach(function (dir) {
    const t = dir.trim(); if (!t) return;
    const i = t.indexOf(' ');
    const nome = (i < 0 ? t : t.slice(0, i)).toLowerCase();   // CSP: nome é ASCII case-insensitive
    conta[nome] = (conta[nome] || 0) + 1;
  });
  return conta;
}

function conferir(vercel) {
  const regras = (vercel && vercel.headers) || [];
  ok(regras.length > 0, 'vercel.json tem ' + regras.length + ' regra(s) de cabeçalho');
  let comCsp = 0;
  for (const r of regras) {
    const cab = {};
    for (const h of (r.headers || [])) cab[h.key] = h.value;
    const csp = cab[CABECALHO_CSP];
    if (!csp) continue;
    comCsp++;
    const conta = contarDiretivas(csp);
    const repetidas = Object.keys(conta).filter(function (n) { return conta[n] > 1; });
    ok(repetidas.length === 0,
      '"' + r.source + '" não repete diretiva nenhuma'
      + (repetidas.length === 0 ? '' : ' — REPETIDA(S): ' + JSON.stringify(repetidas)
        + '. O navegador aplica a PRIMEIRA; `conferirVercelJson` e `qa-vercel-host.js` leem a ÚLTIMA,'
        + ' então os dois podem estar verdes sobre um valor que a Vercel não serve'));
  }
  ok(comCsp > 0, comCsp + ' regra(s) com ' + CABECALHO_CSP + ' conferida(s)');
}

// ---- a prova de mordida (EQUIPE.md 2.8): injeta a repetição EM MEMÓRIA ----
const texto = fs.readFileSync(ARQ, 'utf8');
const vercel = JSON.parse(texto);
if (process.env.QA_DUP_DEFEITO) {
  const alvo = vercel.headers.find(function (r) {
    return (r.headers || []).some(function (h) { return h.key === CABECALHO_CSP && /connect-src/.test(h.value); });
  });
  if (!alvo) { console.error('não achei regra com connect-src para injetar'); process.exit(2); }
  const h = alvo.headers.find(function (x) { return x.key === CABECALHO_CSP; });
  h.value = h.value.replace('script-src', 'connect-src https://exfil.example.com; script-src');
  console.log('*** DEFEITO INJETADO EM MEMÓRIA: connect-src repetido em "' + alvo.source + '" ***');
}

conferir(vercel);

// ---- opcional: a semântica medida num navegador de verdade ----
async function medirNoNavegador() {
  const http = require('http');
  const { chromium } = require('playwright');
  function servir(corpo, cabecalhos) {
    return new Promise(function (res) {
      const s = http.createServer(function (req, r) {
        r.writeHead(200, Object.assign({ 'content-type': 'text/html; charset=utf-8' }, cabecalhos || {}));
        r.end(corpo);
      });
      s.listen(0, '127.0.0.1', function () { res({ srv: s, porta: s.address().port }); });
    });
  }
  const A = await servir('A', {});
  const B = await servir('B', {});
  const oA = 'http://127.0.0.1:' + A.porta, oB = 'http://127.0.0.1:' + B.porta;
  const csp = "default-src 'none'; connect-src " + oA + "; script-src 'unsafe-inline'; connect-src " + oB;
  const pagina = await servir('<!doctype html><meta charset=utf-8><body>', { 'content-security-policy': csp });
  const exe = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
  const nav = await chromium.launch({ executablePath: exe });
  const pg = await nav.newPage();
  await pg.goto('http://127.0.0.1:' + pagina.porta + '/');
  const r = await pg.evaluate(async function (u) {
    const tenta = async function (x) {
      try { await fetch(x + '/z', { mode: 'no-cors' }); return 'PASSOU'; } catch (e) { return 'BLOQUEADO'; }
    };
    return { primeira: await tenta(u[0]), segunda: await tenta(u[1]) };
  }, [oA, oB]);
  await nav.close();
  [A, B, pagina].forEach(function (s) { s.srv.close(); });
  console.log('  CSP servida: ' + csp);
  ok(r.primeira === 'PASSOU' && r.segunda === 'BLOQUEADO',
    'o navegador aplica a PRIMEIRA connect-src e ignora a segunda — 1ª ' + r.primeira + ', 2ª ' + r.segunda);
}

(async function () {
  if (process.argv.indexOf('--navegador') >= 0) await medirNoNavegador();
  console.log('');
  if (falhas) { console.error('REPROVADO — ' + falhas + ' problema(s)'); process.exit(1); }
  console.log('ok — nenhuma CSP do vercel.json repete diretiva');
  process.exit(0);
})();
