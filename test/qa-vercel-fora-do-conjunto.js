// O QUE A LISTA FECHADA NÃO FECHA — QA, 03/09, auditoria da entrega `csp-tabela-de-rotas-e-conjunto`.
//
//   node test/qa-vercel-fora-do-conjunto.js
//
// ⚠ ELE SAIA 1 QUANDO FOI ESCRITO, DE PROPÓSITO — não era defeito do instrumento, era o achado.
// **ELE SAI 0 DESDE 03/09** (porteiro, item `vercel-valor-e-topo`), com as duas famílias fechadas
// DO LADO DO PRODUTO e nenhuma asserção afrouxada: este é o mesmo arquivo, byte a byte, tirando
// este parágrafo e o de baixo; só o exit code mudou, que era exatamente o que o autor prometeu.
// Medido, com exit code real do terminal, um comando de cada vez:
//     antes do conserto  -> exit 1, "ACHADO ABERTO — 5 de 5 injeção(ões) atravessam os QUATRO"
//     depois do conserto -> exit 0, as 5 mordidas por algum portão + o controle mordido
// O que fechou cada família, e as duas cobranças nasceram com a prova de mordida junto:
//   · família 1 (VALOR de chave permitida): `COMPANHEIROS['Referrer-Policy']` deixou de ser
//     `null` e virou LISTA FECHADA em `test/qa-csp-cabecalhos.js` — quem morde as duas injeções
//     de referrer é ele, exit 1;
//   · família 2 (chave de TOPO): a tabela `TOPO_DO_VERCEL` no `conferirVercelJson()` do
//     `ferramentas/construir.js`, conjunto EXATO e valor comparado — quem morde `redirects`,
//     `outputDirectory` e `trailingSlash` é o BUILD, exit 1.
// Agora que está verde, ele É o portão que impede as duas de voltarem, e está pendurado no CI
// (.github/workflows/teste.yml, job `smoke`, ao lado dos outros portões do vercel.json).
//
// A TERCEIRA FAMÍLIA ENTROU AQUI EM 05/09 (porteiro, item `vercel-propriedade-dentro-da-regra`), e
// com ela os três casos `regra-has`, `regra-missing` e `regra-destination` abaixo. Ela estava
// escrita neste cabeçalho desde 03/09 como ACHADO ABERTO — medida e deixada de fora DE PROPÓSITO,
// para não entrar de carona num item que não a pediu — e era o PENDENTES 103.
//
// O QUE ERA: propriedade desconhecida DENTRO DA REGRA de `headers[]`, entre `source` e `headers`.
// Não é chave de cabeçalho (a `CHAVES_PERMITIDAS` fecha o conjunto DENTRO de `headers[].headers`)
// nem chave de topo (a `TOPO_DO_VERCEL` fecha o conjunto FORA de `headers[]`): era a única casa
// que nenhum portão lia. **Reconfirmado em 05/09 antes de consertar**, cada injeção sozinha, na
// regra decisiva `/glossario/(.*)`, com exit code real do terminal e o desvio conferido, agora
// contra CINCO portões (construir.js · qa-vercel-host.js · qa-vercel-diretiva-repetida.js ·
// qa-csp-cabecalhos.js · csp-paginas.js):
//     has:     [{type:"header", key:"x-nunca-enviado"}]  -> 0·0·0·0·0
//     missing: [{type:"header", key:"accept"}]           -> 0·0·0·0·0
//     destination: "https://exfil.example.com"           -> 0·0·0·0·0
// `has`/`missing` são a classe grave: tornam a regra CONDICIONAL sem mudar um byte do `source` nem
// do `headers`, então a CSP conferida diretiva por diretiva continua escrita, pregada e verde, e
// simplesmente NÃO É SERVIDA numa visita normal.
//
// O QUE FECHOU: a tabela `PROPRIEDADES_DA_REGRA` no `conferirVercelJson()` do
// `ferramentas/construir.js` — conjunto exato (`source` e `headers`, e nada mais), nos dois
// sentidos, com a mesma disciplina da `TOPO_DO_VERCEL`. Quem morde as três é o BUILD, exit 1.
//
// E A SEMÂNTICA DEIXOU DE SER INFERIDA. O PENDENTES 103 registrava, com todas as letras, que a
// existência de `has`/`missing` vinha de busca e não de leitura da fonte, porque aquela máquina
// batia 403 no proxy de egresso. Foi LIDA em 05/09 de uma máquina com egresso, e a citação inteira
// está no bloco da `PROPRIEDADES_DA_REGRA`: a tabela "Header object definition" de
// <https://vercel.com/docs/project-configuration/vercel-json> e, mais forte que a prosa porque é o
// que a Vercel valida, o esquema oficial <https://openapi.vercel.sh/vercel.json>, que em
// `properties.headers.items` traz `additionalProperties: false`, `required: ["source","headers"]` e
// exatamente quatro propriedades: `source`, `headers`, `has`, `missing`.
//
// O QUE ELE REFUTA. Em 03/09 a entrega `csp-tabela-de-rotas-e-conjunto` fechou um buraco real: os
// quatro portões do `vercel.json` cobravam VALOR e nenhum cobrava o CONJUNTO de chaves, então
// `Access-Control-Allow-Origin: *` numa regra decisiva atravessava os quatro. O conserto foi a
// `CHAVES_PERMITIDAS` do `test/qa-csp-cabecalhos.js`. Medido aqui, chave por chave: os 14 nomes
// perigosos que eu tentei (CORS inteiro, `Timing-Allow-Origin`, `Set-Cookie`, `Permissions-Policy`,
// `Content-Security-Policy-Report-Only`, `Link`, `Refresh`, e as variações de CAIXA) reprovam
// todos, exit 1. A lista funciona para o que ela diz cobrir.
//
// O QUE ELA NÃO COBRE, E É ONDE ESTE ARQUIVO MORDE. O conjunto é fechado DENTRO de
// `headers[].headers`. Duas famílias inteiras ficam de fora, e as duas foram medidas com exit code
// real dos QUATRO portões (`construir.js`, `qa-vercel-host.js`, `qa-vercel-diretiva-repetida.js`,
// `qa-csp-cabecalhos.js`), cada um rodado sozinho, com a leitura desviada por
// `test/qa-vercel-injecao.js` — o `vercel.json` da raiz nunca é escrito:
//
//   1. CHAVE PERMITIDA COM VALOR QUE ANULA O CABEÇALHO. `Referrer-Policy` entrou na lista com
//      valor LIVRE (`COMPANHEIROS['Referrer-Policy'] = null`), e o `QUADRO_DE_ROTAS` do build só
//      lê `cab["Content-Security-Policy"]` — nenhum portão olha o valor dessa chave. Medido, com
//      `Referrer-Policy: unsafe-url` na regra DECISIVA `/glossario/(.*)`:
//          node ferramentas/construir.js            -> exit 0
//          node test/qa-vercel-host.js              -> exit 0
//          node test/qa-vercel-diretiva-repetida.js -> exit 0
//          node test/qa-csp-cabecalhos.js           -> exit 0
//      Quatro verdes. `unsafe-url` manda o CAMINHO COMPLETO da página para todo destino externo,
//      inclusive em downgrade para http — exatamente o que o comentário do `qa-csp-cabecalhos.js`
//      diz que a policy existe para impedir ("algumas destas URLs dizem o que a pessoa estava
//      lendo"). `Referrer-Policy: ""` (presente e inerte) também sai 0 nos quatro.
//      É a MESMA classe do achado que abriu o item, uma casa adiante: fechou-se QUAL chave, não
//      QUAL valor — e das quatro chaves, três têm valor cobrado e uma não.
//
//   2. CHAVE DE TOPO DO ARQUIVO. Os quatro portões só olham `vercel.headers`. O `vercel.json` tem
//      hoje `$schema`, `buildCommand`, `outputDirectory`, `framework`, `trailingSlash` — e aceita
//      `redirects` e `rewrites`. Medido, cada um sozinho, quatro verdes em todos:
//          redirects: [{ source: "/glossario/(.*)", destination: "https://exfil.example.com/:path*" }]
//          outputDirectory: "."          (publica a raiz do repositório em vez de dist/)
//          buildCommand:   outro comando
//          trailingSlash:  invertido     (muda QUAL regra decide cada rota, e portanto a conta
//                                         de regras inertes que a entrega acabou de pregar em 14)
//      Um `redirects` externo é mais forte que qualquer CSP: a pessoa nem chega na página cuja
//      política foi conferida. Nenhum portão do `vercel.json` o vê.
//
// COMO FECHAR (é o critério de aceite deste arquivo virar verde):
//   · dar valor cobrado a `Referrer-Policy` (uma lista fechada de valores aceitos, do mesmo jeito
//     que `X-Frame-Options` é cobrado `DENY` e `X-Content-Type-Options` é cobrado `nosniff`);
//   · cobrar o CONJUNTO DE CHAVES DE TOPO do `vercel.json` contra uma lista fechada, com a mesma
//     disciplina do QUADRO_DE_ROTAS: chave de topo nova reprova até alguém escrever no commit o
//     que passou a valer.
//
// POR QUE ELE RODA OS QUATRO E NÃO SÓ UM: o achado não é "um portão falhou", é "o CONJUNTO dos
// portões não olha para lá". Rodar um só permitiria alguém consertar aquele e achar que fechou.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const ARQ = path.join(RAIZ, 'vercel.json');
const ORIGINAL = fs.readFileSync(ARQ, 'utf8');
const PRELOAD = path.join(__dirname, 'qa-vercel-injecao.js');
// pid no nome e FORA do repositório, pela mesma razão do `test/qa-vercel-quadro.js`: um sinal no
// pior instante deixa lixo em /tmp, nunca política envenenada no arquivo que a Vercel publica.
const INJETADO = path.join(os.tmpdir(), 'qa-vercel-fora.' + process.pid + '.json');

const PORTOES = [
  ['ferramentas/construir.js', path.join(RAIZ, 'ferramentas', 'construir.js')],
  ['test/qa-vercel-host.js', path.join(__dirname, 'qa-vercel-host.js')],
  ['test/qa-vercel-diretiva-repetida.js', path.join(__dirname, 'qa-vercel-diretiva-repetida.js')],
  ['test/qa-csp-cabecalhos.js', path.join(__dirname, 'qa-csp-cabecalhos.js')],
];

function comObjeto(mudar) {
  const v = JSON.parse(ORIGINAL);
  mudar(v);
  return JSON.stringify(v, null, 2) + '\n';
}
function noCabecalho(fonte, chave, valor) {
  return comObjeto(function (v) {
    const r = v.headers.find(function (x) { return String(x.source) === fonte; });
    if (!r) throw new Error('a regra ' + fonte + ' sumiu do vercel.json — a injeção não tem onde morder');
    const h = (r.headers || []).find(function (x) { return x.key === chave; });
    if (!h) throw new Error('a regra ' + fonte + ' não declara ' + chave);
    h.value = valor;
  });
}
// A TERCEIRA FAMÍLIA: propriedade DENTRO da regra, entre `source` e `headers` — nem cabeçalho, nem
// topo. Escreve na regra, não no array de cabeçalhos dela.
function naRegra(fonte, propriedade, valor) {
  return comObjeto(function (v) {
    const r = v.headers.find(function (x) { return String(x.source) === fonte; });
    if (!r) throw new Error('a regra ' + fonte + ' sumiu do vercel.json — a injeção não tem onde morder');
    r[propriedade] = valor;
  });
}

const CASOS = [
  {
    nome: 'referrer-unsafe-url',
    porque: '`Referrer-Policy: unsafe-url` em /glossario/(.*), que é a regra DECISIVA do glossário:'
      + ' o caminho completo da página vaza para todo destino externo, e em downgrade http também',
    texto: function () { return noCabecalho('/glossario/(.*)', 'Referrer-Policy', 'unsafe-url'); },
  },
  {
    nome: 'referrer-vazio',
    porque: 'a mesma chave com valor VAZIO: presente para quem só confere presença, inerte para o navegador',
    texto: function () { return noCabecalho('/glossario/(.*)', 'Referrer-Policy', ''); },
  },
  {
    nome: 'redirects-externo',
    porque: 'chave de TOPO `redirects` mandando /glossario/(.*) para outro domínio — a pessoa nem'
      + ' chega na página cuja CSP foi conferida diretiva por diretiva',
    texto: function () {
      return comObjeto(function (v) {
        v.redirects = [{ source: '/glossario/(.*)', destination: 'https://exfil.example.com/:path*', permanent: false }];
      });
    },
  },
  {
    nome: 'outputDirectory',
    porque: 'chave de TOPO `outputDirectory` apontando para a raiz do repositório em vez de dist/:'
      + ' publica o que o build nunca conferiu',
    texto: function () { return comObjeto(function (v) { v.outputDirectory = '.'; }); },
  },
  {
    // O CONTROLE DO CONTROLE, e ele não é cerimônia: sem um caso que SABIDAMENTE morde, um harness
    // quebrado (um caminho errado, um `-r` que não carrega, uma dependência faltando) mostraria
    // cinco X e passaria por prova de buraco. Este é o cabeçalho que a entrega de 03/09 fechou:
    // ele TEM de ser pego, e por `test/qa-csp-cabecalhos.js`.
    controle: true,
    nome: '(controle) CORS aberto',
    porque: 'Access-Control-Allow-Origin: * na mesma regra decisiva — foi o achado que abriu o item'
      + ' e a CHAVES_PERMITIDAS o fechou. Se ESTE não morder, o harness está quebrado',
    texto: function () {
      return comObjeto(function (v) {
        const r = v.headers.find(function (x) { return String(x.source) === '/glossario/(.*)'; });
        r.headers.push({ key: 'Access-Control-Allow-Origin', value: '*' });
      });
    },
  },
  {
    nome: 'regra-has',
    porque: 'TERCEIRA família: `has` DENTRO da regra /glossario/(.*) — a regra vira CONDICIONAL sem'
      + ' mudar um byte do `source` nem do `headers`, e a CSP conferida diretiva por diretiva'
      + ' simplesmente não é servida numa visita normal. É documentada e válida para a Vercel'
      + ' (esquema oficial), e é exatamente por isso que ela passa em silêncio',
    texto: function () { return naRegra('/glossario/(.*)', 'has', [{ type: 'header', key: 'x-nunca-enviado' }]); },
  },
  {
    nome: 'regra-missing',
    porque: 'a irmã da anterior, pelo avesso: `missing` casa pela AUSÊNCIA. `accept` vai em todo'
      + ' pedido de navegador, então a condição nunca casa e a regra nunca serve nada',
    texto: function () { return naRegra('/glossario/(.*)', 'missing', [{ type: 'header', key: 'accept' }]); },
  },
  {
    nome: 'regra-destination',
    porque: 'propriedade que nem existe em regra de `headers[]` (o esquema oficial traz'
      + ' `additionalProperties: false`). O esperado é que a Vercel a recuse no deploy — mas depender'
      + ' da validação de terceiro para o que este repositório afirma sobre si mesmo é aposta, e a'
      + ' recusa dela chegaria DEPOIS do push',
    texto: function () { return naRegra('/glossario/(.*)', 'destination', 'https://exfil.example.com'); },
  },
  {
    nome: 'regra-sem-headers',
    porque: 'o outro sentido do conjunto: a regra decisiva do glossário PERDE o array `headers`.'
      + ' Regra sem cabeçalho não serve política nenhuma, e `headers` é `required` no esquema oficial',
    texto: function () {
      return comObjeto(function (v) {
        const r = v.headers.find(function (x) { return String(x.source) === '/glossario/(.*)'; });
        delete r.headers;
      });
    },
  },
  {
    nome: 'trailingSlash',
    porque: 'chave de TOPO `trailingSlash` invertida: muda QUAL regra decide cada rota, e portanto a'
      + ' conta de regras inertes que o test/qa-vercel-quadro.js acabou de pregar em 14',
    texto: function () { return comObjeto(function (v) { v.trailingSlash = !v.trailingSlash; }); },
  },
];

const MARCA = /\[injecao-vercel\] (\d+) leitura\(s\) desviada\(s\)/;
function rodar(alvo, texto) {
  fs.writeFileSync(INJETADO, texto);
  const env = Object.assign({}, process.env, { QA_VERCEL_INJETADO: INJETADO });
  const r = spawnSync(process.execPath, ['-r', PRELOAD, alvo],
    { cwd: RAIZ, encoding: 'utf8', env: env, maxBuffer: 64 * 1024 * 1024 });
  const saida = String(r.stdout || '') + String(r.stderr || '');
  const m = saida.match(MARCA);
  return { code: r.status, desvios: m ? Number(m[1]) : null };
}

let abertos = 0;
let desvioQuebrado = 0;
let controleQuebrado = 0;
console.log('O QUE A LISTA FECHADA NÃO FECHA — ' + CASOS.length + ' caso(s), 1 deles CONTROLE × ' + PORTOES.length + ' portão(ões)');
console.log('o vercel.json da raiz não é escrito: a injeção vai para ' + INJETADO);
console.log('');
try {
  for (const c of CASOS) {
    const texto = c.texto();
    const linhas = [];
    let algumMordeu = false;
    for (const [nome, alvo] of PORTOES) {
      const r = rodar(alvo, texto);
      // Se o desvio parar de pegar, o portão leu o arquivo LIMPO e este caso não provou nada —
      // o mesmo controle-do-controle do test/qa-vercel-quadro.js (lição 2.8).
      if (r.desvios === null || r.desvios < 1) { desvioQuebrado++; linhas.push(nome + ' DESVIO NÃO PEGOU'); continue; }
      if (r.code !== 0) algumMordeu = true;
      linhas.push(nome + ' exit ' + r.code);
    }
    if (c.controle) {
      if (!algumMordeu) controleQuebrado++;
    } else if (!algumMordeu) abertos++;
    console.log((algumMordeu ? '  ok  ' : '  X   ') + c.nome.padEnd(24)
      + (algumMordeu ? 'algum portão morde' : 'PASSA NOS QUATRO'));
    console.log('        ' + c.porque);
    console.log('        ' + linhas.join(' · '));
  }
} finally {
  if (fs.existsSync(INJETADO)) fs.unlinkSync(INJETADO);
}

console.log('');
// Não é restauração: é INVARIANTE. Este arquivo nunca escreve o vercel.json — vê-lo mudado aqui
// significa que outra coisa o mudou durante a execução, e isso merece vermelho, não silêncio.
if (fs.readFileSync(ARQ, 'utf8') !== ORIGINAL) {
  console.error('FALHA: o vercel.json da raiz mudou durante esta execução, e este portão não o escreve.');
  process.exit(1);
}
if (desvioQuebrado) {
  console.error('FALHA DE DESVIO em ' + desvioQuebrado + ' execução(ões): o portão leu o vercel.json LIMPO,');
  console.error('       então o caso não provou nada. Veja como aquele portão abre o arquivo.');
  process.exit(1);
}
if (controleQuebrado) {
  console.error('HARNESS QUEBRADO: o caso de CONTROLE (CORS aberto) não foi pego por portão nenhum.');
  console.error('       Ele É pego hoje — se não foi, o problema é neste arquivo, não no vercel.json,');
  console.error('       e os outros casos não provam nada.');
  process.exit(1);
}
if (abertos) {
  console.error('ACHADO ABERTO — ' + abertos + ' de ' + (CASOS.length - 1) + ' injeção(ões) atravessam os QUATRO portões.');
  console.error('  O conjunto fechado do `qa-csp-cabecalhos.js` fecha QUAL CHAVE dentro de');
  console.error('  headers[].headers. Não fecha o VALOR de Referrer-Policy nem o conjunto de');
  console.error('  chaves de TOPO do vercel.json. Critério de aceite para este arquivo virar');
  console.error('  verde está no cabeçalho dele.');
  process.exit(1);
}
console.log('ok — nenhuma das ' + (CASOS.length - 1) + ' injeções atravessa os quatro portões; o buraco de 03/09 está fechado.');
process.exit(0);
