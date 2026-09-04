// QA — O HOST DA MEDIÇÃO NO `vercel.json`, COBRADO PELO JSON E NÃO PELO TEXTO (02/09)
//       ampliado em 03/09 (item `csp-tabela-de-rotas-e-conjunto`) com o que é cobrável SEM tabela.
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
// ============================================================================
// O QUE ESTE ARQUIVO PASSOU A COBRAR EM 03/09, E POR QUE ELE NÃO GANHOU A TABELA
//
// O `ferramentas/construir.js` ganhou no mesmo dia um QUADRO_DE_ROTAS: as 22 regras por nome, na
// ordem, cada uma com a CSP inteira esperada. Copiar esse quadro para cá seria repetir o erro que
// a auditoria de 03/09 já apontou uma vez — dois corpos transliterados não são duas leituras, e
// duas leituras que compartilham a mesma tabela compartilham o mesmo erro NA tabela. Então a
// divisão é de NATUREZA, e é ela que faz este arquivo continuar valendo alguma coisa:
//
//   · o BUILD cobra o que só uma tabela sabe — QUE rota tem QUE política (troca de `source`,
//     rota reordenada, diretiva a mais ou a menos numa rota específica);
//   · este arquivo cobra o que é verdade SEM tabela nenhuma, e por isso sobrevive a um erro
//     dentro do quadro.
//
// As cinco cobranças table-free, e cada uma existe por uma classe medida com exit code real:
//   1. toda regra cuja CSP declara `connect-src` declara EXATAMENTE `MEDIDA_HOST`;
//   2. regra da família de seção (`default-src 'none'` + `img-src`, isto é, página de leitura, que
//      manda evento) sem `connect-src` perdeu a contagem em silêncio;
//   3. NENHUM `source` aparece duas vezes. Regra duplicada é sempre erro: a segunda sobrescreve a
//      primeira em silêncio, e o arquivo passa a dizer duas coisas sobre a mesma rota. Medido em
//      03/09, com a regra `/historia` duplicada: BUILD exit 0 e este arquivo exit 0, imprimindo
//      "14 rota(s) … todas == MEDIDA_HOST" — número que ninguém comparava com nada;
//   4. TODO TOKEN de TODA diretiva de TODA CSP do arquivo está na lista do que é PERMITIDO:
//      `'none'`, `'self'`, `'unsafe-inline'`, `data:`, `blob:` e o `MEDIDA_HOST` — este último só
//      dentro de `connect-src`. É esta que pega o relaxamento em OUTRA diretiva sem saber o nome
//      do host estranho: medido em 03/09, `script-src 'unsafe-inline' https://exfil.example.com`
//      na regra `/historia` dava BUILD exit 0 e este arquivo exit 0, porque a cobrança antiga só
//      procurava a string "posthog". Enumerar o PERMITIDO não tem esse buraco.
//
//      O QUE ESTA LISTA PEGA E O QUE NÃO PEGA, e o parágrafo anterior mentia sobre isso. Estava
//      escrito aqui que "acrescentar `'self'` a uma página exige mexer aqui e escrever por quê".
//      É FALSO: `'self'` já está em TOKENS_PERMITIDOS, então acrescentá-lo a uma página passa por
//      este arquivo sem ruído nenhum. Medido em 03/09, com o desvio de `test/qa-vercel-injecao.js`
//      e exit code real do terminal:
//        `img-src data: 'self'` na regra `/historia`      -> este arquivo **exit 0**
//        `script-src 'unsafe-inline' 'unsafe-eval'` idem   -> este arquivo **exit 1**
//          ("token estranho na CSP de "/historia", diretiva `script-src`: "'unsafe-eval'"")
//      A lista pega o token que NÃO está nela — host novo, `'unsafe-eval'`, `'strict-dynamic'`,
//      nonce, hash. Ela NÃO pega a redistribuição dos cinco tokens que já são permitidos entre as
//      diretivas: `'self'` migrando para `script-src`, `blob:` saindo de ONDE FOI e aparecendo no
//      GLOSSÁRIO. Quem pega ISSO é o QUADRO_DE_ROTAS do build, que compara diretiva por diretiva
//      contra a política esperada de cada rota — e é por isso que os dois portões existem. Comentário
//      falso num portão é pior que comentário nenhum: ele faz a próxima pessoa confiar na cobertura
//      errada;
//   5. nenhuma CSP repete diretiva, e nenhum valor tem curinga. A repetida importa porque quem
//      monta um objeto ao partir a CSP fica com a ÚLTIMA e o navegador (CSP3) aplica a PRIMEIRA —
//      quem cobra isso no arquivo inteiro é `test/qa-vercel-diretiva-repetida.js`; aqui a mesma
//      cobrança existe para que a asserção 4 seja SÃ, e não para substituí-lo.
//
// O QUE ESTE ARQUIVO NÃO VÊ, e está escrito para ninguém confundir verde com cobertura: ele NÃO vê
// duas rotas trocando de política entre si (o conjunto de tokens do arquivo não muda), nem rota
// reordenada. Isso é do quadro do build, e a prova de mordida dele é `test/qa-vercel-quadro.js`.
//
// PROVA DE MORDIDA (EQUIPE.md 2.8): `QA_VERCEL_DEFEITO=<modo>` aplica a injeção EM MEMÓRIA e este
// arquivo tem de sair 1. Sem a variável ele sai 0 contra o `vercel.json` de hoje.
//
// São DEZ modos, e o décimo (`privacidade`) nasceu em 04/09 porque os nove primeiros miravam todos
// uma rota que MEDE — o que deixava a asserção 4b (a inversão de `SEM_CONTAGEM`) sem um comando que
// a fizesse reprovar. Ela mordia à mão, editando o `vercel.json`, e mordida que só existe à mão é a
// que ninguém repete. O raciocínio inteiro do modo está na caixa dele, junto da injeção.
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
const MODOS = ['regiao', 'esquema', 'digito', 'unicode', 'sumir', 'duplicata', 'exfil', 'curinga', 'repetida',
  'privacidade'];

// O ALVO DO 10º MODO, e ele não é `/historia` de propósito (04/09, item `sem-contagem-sem-modo-injecao`).
// Os nove modos acima miram todos uma rota que MEDE, então nenhum deles chega perto da asserção 4b —
// a inversão que cobra `/privacidade/` NÃO ter connect-src. Resultado: uma asserção que morde de
// verdade (provada à mão, editando o `vercel.json`) e que rodada nenhuma exercitava, que é o
// "instrumento nunca visto reprovando é decoração" da lição 2.8 do EQUIPE.md com outro nome.
const ALVO_SEM_CONTAGEM = '/privacidade/';

let texto = fs.readFileSync(ARQ, 'utf8');
function ondeMede(v) {
  // a 2ª ocorrência do host é a regra `/historia`, sem barra final: nenhuma rota publicada a
  // resolve, então ela é o ponto cego do `test/csp-paginas.js`.
  return v.headers.findIndex(function (r) {
    return String(r.source) === '/historia';
  });
}
function ondeNaoMede(v) {
  return v.headers.findIndex(function (r) {
    return String(r.source) === ALVO_SEM_CONTAGEM;
  });
}
if (DEFEITO) {
  // A INJEÇÃO ATACA A SEGUNDA OCORRÊNCIA (a regra `/historia`, sem barra final) DE PROPÓSITO:
  // nenhuma rota publicada a resolve, então ela é o ponto cego do `test/csp-paginas.js` e o único
  // lugar onde a cobrança do `vercel.json` é a ÚNICA que existe.
  let n = -1;
  let alvo = '/historia';
  if (DEFEITO === 'privacidade') {
    // O 10º MODO: a rota que NÃO mede passa a declarar `connect-src`.
    //
    // ELE USA O PRÓPRIO MEDIDA_HOST, e isso é escolha, não preguiça — é o mesmo argumento que a
    // `repetida` já faz duas caixas abaixo. Com um host de terceiro (`https://exfil.example.com`)
    // o arquivo sairia 1 por TRÊS caminhos ao mesmo tempo — a asserção 1 (valor != MEDIDA_HOST),
    // a 4 (token fora da lista) e a 4b —, e um vermelho que três asserções produzem não prova
    // NENHUMA delas. Com o host certo, a asserção 1 confere e passa, a lista de tokens confere e
    // passa, e a contagem de "posthog" continua batendo com `comConnect` (as duas sobem 1). Sobra
    // reprovando só o que este modo existe para exercitar.
    //
    // O QUE ELE PROVA E O QUE NÃO PROVA, escrito para ninguém ler cobertura demais no verde: as
    // linhas que ficam vermelhas são DUAS, e as duas por causa de `/privacidade/` —
    //   X   "/privacidade/" está na lista SEM_CONTAGEM e NÃO declara connect-src — mas declara: …
    //   X   toda rota com connect-src é da família de seção e vice-versa — 14 de 13
    // A segunda é o agregado, e ele reprova junto porque `comConnect` conta a rota nova enquanto
    // `familiaSecao` não.
    //
    // O QUE SOBRA DE VERMELHO QUANDO SE TIRA UMA DAS DUAS, medido pelo QA em 04/09 com mutantes do
    // próprio portão e exit code real (não é raciocínio, é tabela):
    //   apagar só a LINHA da 4b .......... modo exit 1, 1 linha X (o agregado, "14 de 13"). Certo.
    //   apagar só o AGREGADO ............. modo exit 1, 1 linha X, e ela é a da SEM_CONTAGEM.
    //     É ESTA a que prova o modo: a asserção 4b morde SOZINHA, sem o agregado carregando ela.
    //   neutralizar o BLOCO `if (SEM_CONTAGEM…)` .. o CONTROLE (sem injeção nenhuma) já sai 1, com
    //     TRÊS linhas X — porque as outras duas rotas da lista (`/privacidade` e
    //     `/privacidade/(.*)`) também são da família pela forma e também não declaram connect-src,
    //     então caem no `else` e são cobradas por um connect-src que não têm.
    //
    // A terceira linha corrige o que este comentário afirmava até 04/09 — que apagar o bloco
    // "faria as duas passarem". É FALSO, e por sorte na direção segura: o bloco não é removível em
    // silêncio, ele é removível em vermelho. Fica escrito porque comentário falso num portão é
    // pior que comentário nenhum, e este arquivo já cobra isso de si mesmo na asserção 4.
    // O modo continua mirando a LISTA, e não só a linha, porque é a lista que nomeia a exceção.
    const v = JSON.parse(texto);
    const i = ondeNaoMede(v);
    if (i < 0) { console.error('a regra ' + ALVO_SEM_CONTAGEM + ' sumiu do vercel.json — a injeção não tem onde morder'); process.exit(2); }
    const h = v.headers[i].headers.find(function (x) { return x.key === 'Content-Security-Policy'; });
    if (!h) { console.error('a regra ' + ALVO_SEM_CONTAGEM + ' não tem CSP — a injeção não tem onde morder'); process.exit(2); }
    const antes = h.value;
    h.value = antes.replace('img-src data:; ', 'img-src data:; connect-src ' + HOST + '; ');
    if (h.value === antes) {
      console.error('a CSP de ' + ALVO_SEM_CONTAGEM + ' mudou de forma e a injeção não pegou — conserte o modo, não o portão');
      process.exit(2);
    }
    texto = JSON.stringify(v, null, 2) + '\n';
    alvo = ALVO_SEM_CONTAGEM;
  } else if (DEFEITO === 'sumir') {
    texto = texto.replace(new RegExp('connect-src ' + HOST.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '; ', 'g'),
      function (m) { n++; return n === 1 ? '' : m; });
  } else if (TROCAS[DEFEITO]) {
    texto = texto.replace(new RegExp(HOST.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      function (m) { n++; return n === 1 ? TROCAS[DEFEITO] : m; });
  } else if (DEFEITO === 'duplicata' || DEFEITO === 'exfil' || DEFEITO === 'curinga' || DEFEITO === 'repetida') {
    // estes três mexem na ESTRUTURA, então é mais honesto mexer no objeto e reserializar
    const v = JSON.parse(texto);
    const i = ondeMede(v);
    if (i < 0) { console.error('a regra /historia sumiu do vercel.json — a injeção não tem onde morder'); process.exit(2); }
    if (DEFEITO === 'duplicata') {
      v.headers.splice(i + 1, 0, JSON.parse(JSON.stringify(v.headers[i])));
    } else {
      const h = v.headers[i].headers.find(function (x) { return x.key === 'Content-Security-Policy'; });
      if (DEFEITO === 'exfil') h.value = h.value.replace("script-src 'unsafe-inline'", "script-src 'unsafe-inline' https://exfil.example.com");
      if (DEFEITO === 'curinga') h.value = h.value.replace('img-src data:', 'img-src data: https://*.exemplo.com');
      // a repetida usa o MESMO valor de propósito: assim a comparação de valor não tem o que
      // reprovar e sobra só a cobrança de FORMA, que é a que está sendo provada aqui.
      if (DEFEITO === 'repetida') h.value = h.value.replace("script-src 'unsafe-inline';", "script-src 'unsafe-inline'; script-src 'unsafe-inline';");
    }
    texto = JSON.stringify(v, null, 2) + '\n';
  } else {
    console.error('QA_VERCEL_DEFEITO desconhecido: ' + DEFEITO + ' (há: ' + MODOS.join(', ') + ')');
    process.exit(2);
  }
  console.log('*** DEFEITO INJETADO EM MEMÓRIA: ' + DEFEITO + ' na regra ' + alvo + ' ***');
}

let falhas = 0;
function ok(cond, msg) { console.log((cond ? '  ok  ' : '  X   ') + msg); if (!cond) falhas++; return !!cond; }

const vercel = JSON.parse(texto);   // se não for JSON válido, falhar aqui já é o resultado certo
const regras = vercel.headers || [];
ok(regras.length > 0, 'vercel.json tem ' + regras.length + ' regra(s) de cabeçalho');

// O parser devolve as diretivas E as que apareceram mais de uma vez: quem monta objeto fica com a
// ÚLTIMA e o navegador aplica a PRIMEIRA, então sem esta lista a asserção 4 seria cega para um
// token estranho escondido numa diretiva repetida.
function partir(csp) {
  const d = {};
  const repetidas = [];
  String(csp).split(';').forEach(function (p) {
    const t = p.trim(); if (!t) return;
    const i = t.indexOf(' ');
    const nome = i < 0 ? t : t.slice(0, i);
    if (Object.prototype.hasOwnProperty.call(d, nome) && repetidas.indexOf(nome) < 0) repetidas.push(nome);
    d[nome] = i < 0 ? '' : t.slice(i + 1).trim();
  });
  return { diretivas: d, repetidas: repetidas };
}

// 4. O QUE É PERMITIDO APARECER numa CSP deste arquivo, por extenso. Acrescentar um token aqui é a
//    forma de dizer, no commit, o que passou a ser alcançável — e nada além disto passa.
const TOKENS_PERMITIDOS = ["'none'", "'self'", "'unsafe-inline'", 'data:', 'blob:'];

// 4b. A EXCEÇÃO NOMEADA À REGRA "página de leitura mede" (04/09, item `pagina-privacidade`).
//     `/privacidade/` é da família de seção pela forma (default-src 'none' + img-src) e NÃO mede
//     por decisão escrita: a seção 3 do texto dela descreve o evento como "qual das CINCO seções
//     foi aberta", então uma sexta seção medida tornaria falsa, no mesmo commit, uma frase da
//     página que existe para dizer a verdade sobre a medição. A exceção é uma LISTA POR EXTENSO,
//     e a asserção dela é INVERTIDA: estas rotas têm de NÃO ter connect-src. Assim o portão morde
//     nos dois sentidos — some o connect-src de uma seção que mede, ou aparece um numa que não
//     devia medir. Rota nova só entra aqui junto com o motivo, como qualquer tabela desta casa.
const SEM_CONTAGEM = ['/privacidade', '/privacidade/', '/privacidade/(.*)'];

let comConnect = 0, familiaSecao = 0;
const fontes = [];
for (const r of regras) {
  const fonte = String(r.source || '');
  fontes.push(fonte);
  const cab = {};
  for (const h of (r.headers || [])) cab[h.key] = h.value;
  const csp = cab['Content-Security-Policy'];
  if (!csp) continue;
  const lido = partir(csp);
  const d = lido.diretivas;
  // 1. o valor do connect-src, byte a byte, DEPOIS do JSON.parse
  if (Object.prototype.hasOwnProperty.call(d, 'connect-src')) {
    comConnect++;
    ok(d['connect-src'] === HOST, 'connect-src de "' + fonte + '" == MEDIDA_HOST'
      + (d['connect-src'] === HOST ? '' : ' — está "' + d['connect-src'] + '" e MEDIDA_HOST é "' + HOST + '"'));
  }
  // 2. a família de seção: quem tem `default-src 'none'` E `img-src` é página de leitura, e
  //    página de leitura manda evento — se ela perdeu o connect-src, perdeu a contagem.
  if (d['default-src'] === "'none'" && Object.prototype.hasOwnProperty.call(d, 'img-src')) {
    const tem = Object.prototype.hasOwnProperty.call(d, 'connect-src');
    if (SEM_CONTAGEM.indexOf(fonte) >= 0) {
      ok(!tem, '"' + fonte + '" está na lista SEM_CONTAGEM e NÃO declara connect-src'
        + (tem ? ' — mas declara: esta rota passou a poder falar com a rede, e o texto da própria'
          + ' página diz que ela não manda evento nenhum. Mude os dois juntos ou nenhum' : ''));
    } else {
      familiaSecao++;
      ok(tem, '"' + fonte + '" é da família de seção e declara connect-src'
        + (tem ? '' : ' — SUMIU: esta rota perdeu a contagem em silêncio'));
    }
  }
  // 5. nenhuma diretiva repetida (a asserção 4 lê a última; o navegador aplica a primeira)
  ok(lido.repetidas.length === 0, 'a CSP de "' + fonte + '" não repete diretiva'
    + (lido.repetidas.length ? ' — repete ' + JSON.stringify(lido.repetidas) + ', e o navegador (CSP3)'
      + ' aplica a PRIMEIRA: a segunda é invisível para quem monta um objeto' : ''));
  // 4. todo token de toda diretiva está na lista do que é PERMITIDO
  for (const nome of Object.keys(d)) {
    const tokens = String(d[nome]).split(/\s+/).filter(function (t) { return t.length > 0; });
    for (const t of tokens) {
      const permitido = TOKENS_PERMITIDOS.indexOf(t) >= 0 || (t === HOST && nome === 'connect-src');
      if (!permitido) {
        ok(false, 'token estranho na CSP de "' + fonte + '", diretiva `' + nome + '`: "' + t + '"'
          + ' — o permitido é ' + TOKENS_PERMITIDOS.join(' ') + ', mais o MEDIDA_HOST dentro de'
          + ' connect-src. Abrir a CSP é decisão que se escreve no commit (CLAUDE.md §3)');
      }
    }
  }
}
ok(comConnect === familiaSecao && comConnect > 0,
  'toda rota com connect-src é da família de seção e vice-versa — ' + comConnect + ' de ' + familiaSecao);

// 3. nenhum `source` duas vezes. Regra duplicada é sempre erro: a segunda sobrescreve a primeira e
//    o arquivo passa a dizer duas coisas sobre a mesma rota, sem que contagem nenhuma mude.
const repetidos = fontes.filter(function (s, i) { return fontes.indexOf(s) !== i; })
  .filter(function (s, i, a) { return a.indexOf(s) === i; });
ok(repetidos.length === 0, 'nenhum `source` aparece duas vezes no vercel.json'
  + (repetidos.length ? ' — repetido(s): ' + JSON.stringify(repetidos) : ''));

// nenhuma menção solta ao host fora de um connect-src conferido (host numa diretiva errada,
// host num campo que não é cabeçalho, host num comentário-que-não-existe-em-JSON…)
const mencoes = (texto.match(/posthog/gi) || []).length;
ok(mencoes === comConnect, 'a palavra "posthog" aparece ' + mencoes + ' vez(es) no arquivo e há '
  + comConnect + ' connect-src conferido(s) — sobra nenhuma'
  + (mencoes === comConnect ? '' : ' — há menção ao host fora de um connect-src conferido'));

console.log('');
if (falhas) { console.error('REPROVADO — ' + falhas + ' problema(s)'); process.exit(1); }
console.log('ok — ' + comConnect + ' rota(s) com connect-src, todas == ' + HOST);
process.exit(0);
