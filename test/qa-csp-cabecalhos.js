// OS CABEÇALHOS QUE O `test/csp-paginas.js` IMPRIME E NÃO COBRA — QA, 02/09.
//
//   node test/qa-csp-cabecalhos.js
//
// O QUE ISTO FECHA, e é um achado medido, não uma opinião. O portão da CSP (`test/csp-paginas.js`)
// desenha uma tabela por rota que TERMINA em `XFO=DENY  nosniff=sim`. Lida de relance, essa
// coluna parece cobertura. Não é: os dois valores só vão para o `console.log`, nunca para o
// `reprovar()`. Medido em 02/09, removendo um cabeçalho por vez do `vercel.json` e lendo o exit
// code de verdade:
//
//     removido X-Frame-Options       de /glossario/  → node test/csp-paginas.js  exit 0
//     removido X-Content-Type-Options de /glossario/ → node test/csp-paginas.js  exit 0
//     removido Referrer-Policy        de /           → node test/csp-paginas.js  exit 0
//
// Três dos quatro cabeçalhos que aquela entrega acrescenta não são cobrados por nada. Este
// arquivo cobra os três, e mais uma coisa que ninguém estava olhando: a COERÊNCIA entre rotas.
//
// A REGRA, e ela é condicional de propósito. Não é "toda rota tem os quatro" — é:
//
//     rota que declara Content-Security-Policy declara também X-Frame-Options,
//     X-Content-Type-Options e Referrer-Policy.
//
// Condicional porque assim ela é verdadeira ANTES e DEPOIS da entrega da CSP: no `vercel.json`
// de hoje só `/dashboard*` tem cabeçalho, e as três rotas dele já têm os quatro. Uma regra
// absoluta ficaria vermelha na `main` limpa e vermelho de instrumento tem cara de vermelho de
// produto (EQUIPE.md).
//
// MEDIDO CONTRA O RAMO `entrega/csp-paginas-publicas`: ele REPROVA, e o que ele acha é real —
// `/jogo`, `/jogo/` e `/jogo/(.*)` são as três únicas rotas publicadas que ganham CSP e NÃO
// ganham `X-Content-Type-Options: nosniff` nem `Referrer-Policy`. `/jogo/(.*)` é o que serve os
// `pack-*.json` e o `compartilhar.jpg`; é também a rota mais visitada do site, porque o jogo é o
// chamariz. Foi omissão, não decisão: as outras sete famílias de rota da mesma entrega têm os
// quatro. Isto NÃO é o QA consertando — é o QA dizendo, com exit code, o que falta.
//
// PROVA DE QUE REPROVA (EQUIPE.md 2.8): `QA_CAB_DEFEITO=X-Frame-Options` tira aquele cabeçalho
// de TODAS as rotas, em memória, e este portão tem de sair 1. Visto saindo 1 para os três nomes.
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const VERCEL = path.join(RAIZ, 'vercel.json');
const DEFEITO = process.env.QA_CAB_DEFEITO || '';

// Os três que acompanham uma CSP. O porquê de cada um fica escrito aqui, porque cabeçalho sem
// porquê escrito é cabeçalho que alguém tira por conveniência seis meses depois.
const COMPANHEIROS = {
  'X-Frame-Options': 'DENY',
  //  o par de `frame-ancestors 'none'` para navegador velho que não lê CSP nível 2.
  'X-Content-Type-Options': 'nosniff',
  //  sem ele o navegador pode ADIVINHAR o tipo de um JSON ou de um .jpg e executá-lo como HTML;
  //  é o que separa um `pack-*.json` de um vetor de XSS de mesma origem.
  'Referrer-Policy': null,
  //  valor livre (as rotas de leitura usam strict-origin-when-cross-origin, as de painel usam
  //  no-referrer). O que se cobra é que EXISTA uma: sem ela o caminho completo da página vaza
  //  para todo destino externo, e algumas destas URLs dizem o que a pessoa estava lendo.
};

if (!fs.existsSync(VERCEL)) { console.error('REPROVADO: vercel.json não existe'); process.exit(1); }
const vercel = JSON.parse(fs.readFileSync(VERCEL, 'utf8'));
const regras = vercel.headers || [];
if (!regras.length) { console.error('REPROVADO: vercel.json não declara cabeçalho nenhum'); process.exit(1); }

if (DEFEITO) {
  let n = 0;
  for (const r of regras) {
    const antes = (r.headers || []).length;
    r.headers = (r.headers || []).filter((h) => h.key !== DEFEITO);
    n += antes - r.headers.length;
  }
  console.error('[DEFEITO] tirei "' + DEFEITO + '" de ' + n + ' regra(s), em memória');
}

const falhas = [];
const reprovar = (m) => falhas.push(m);

console.log('rota                   CSP  XFO   nosniff  Referrer-Policy');
let comCsp = 0;
for (const r of regras) {
  const src = String(r.source || '');
  const m = {};
  for (const h of (r.headers || [])) {
    if (m[h.key] !== undefined) {
      reprovar(src + ' declara "' + h.key + '" DUAS vezes na mesma regra — a Vercel manda as duas'
        + ' e o navegador aplica a INTERSEÇÃO das CSPs, que não é o que ninguém escreveu.');
    }
    m[h.key] = h.value;
  }
  const csp = m['Content-Security-Policy'];
  console.log(src.padEnd(22)
    + ' ' + (csp ? 'sim' : ' - ').padEnd(4)
    + ' ' + String(m['X-Frame-Options'] || '-').padEnd(5)
    + ' ' + String(m['X-Content-Type-Options'] || '-').padEnd(8)
    + ' ' + String(m['Referrer-Policy'] || '-'));
  if (!csp) continue;
  comCsp++;
  for (const [chave, valor] of Object.entries(COMPANHEIROS)) {
    const achado = m[chave];
    if (achado === undefined) {
      reprovar(src + ' declara Content-Security-Policy e NÃO declara "' + chave + '". Rota que'
        + ' recebe política recebe as quatro — o portão da CSP imprime esta coluna e não a cobra,'
        + ' então sem esta linha ninguém percebe a que faltou.');
    } else if (valor !== null && achado !== valor) {
      reprovar(src + ': "' + chave + '" está "' + achado + '" e tem de ser "' + valor + '".');
    }
  }
  if (csp.indexOf('*') >= 0) {
    reprovar(src + ' tem CURINGA na CSP: "' + csp + '" (CLAUDE.md §3: nenhum curinga, nunca).');
  }
  if (/frame-ancestors/.test(csp) && m['X-Frame-Options'] !== 'DENY') {
    reprovar(src + " tem `frame-ancestors` e o X-Frame-Options não é DENY — as duas defesas contra"
      + ' clickjacking têm de dizer a mesma coisa.');
  }
}

console.log('---');
console.log(comCsp + ' regra(s) com Content-Security-Policy, de ' + regras.length + ' regra(s).');
if (falhas.length) {
  console.error('REPROVADO — ' + falhas.length + ' falha(s):');
  falhas.forEach((f) => console.error('  - ' + f));
  process.exit(1);
}
console.log('cabeçalhos: toda rota com CSP traz também XFO=DENY, nosniff e Referrer-Policy.');
