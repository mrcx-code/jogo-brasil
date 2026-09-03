// O QUE A LISTA FECHADA NÃO FECHA — QA, 03/09, auditoria da entrega `csp-tabela-de-rotas-e-conjunto`.
//
//   node test/qa-vercel-fora-do-conjunto.js
//
// ⚠ ELE SAI 1 HOJE, DE PROPÓSITO. Não é defeito do instrumento: é o achado. **NÃO PENDURE NO CI
// enquanto ele estiver vermelho** — quando o buraco fechar, ele vira verde e AÍ ele é o portão que
// impede o buraco de voltar. Este é o mesmo arquivo, antes e depois; só o exit code muda.
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
