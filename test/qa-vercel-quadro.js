// A PROVA DE MORDIDA DO QUADRO DE ROTAS — item `csp-tabela-de-rotas-e-conjunto`, 03/09.
//
//   node test/qa-vercel-quadro.js
//
// POR QUE ELE EXISTE. Em 03/09 o `conferirVercelJson()` do `ferramentas/construir.js` passou a
// cobrar as 22 regras do `vercel.json` contra um QUADRO_DE_ROTAS: a lista de `source` na ORDEM e
// com repetição, e a CSP de cada uma diretiva por diretiva. Asserção nova sem controle é
// decoração, e decoração assinada de verde é pior que teste nenhum (EQUIPE.md 2.8) — este arquivo
// é o controle.
//
// COMO ELE MEDE, e é de propósito que seja caro: para cada caso ele escreve o `vercel.json`
// DEFEITUOSO num arquivo temporário FORA do repositório, roda `node -r test/qa-vercel-injecao.js
// ferramentas/construir.js` como processo separado — o pré-carregamento desvia a leitura daquele
// caminho e só daquele —, e lê o **exit code real** do processo, nunca de um tubo. O que está
// sendo provado não é o parser: é O PORTÃO, o mesmo binário que a `main` roda, vendo exatamente
// os bytes envenenados.
//
// O `vercel.json` DA RAIZ NUNCA É ABERTO PARA ESCRITA, e isso é o conserto de 03/09, não zelo.
// A versão anterior deste arquivo mutava o arquivo em disco e restaurava em `finally` e num
// `process.on('exit')`. Medido, com exit code real: `timeout -s TERM 5` (exit 124) e
// `timeout -s KILL 5` (exit 137) deixavam a regra `/historia` DUPLICADA — 21 linhas a mais — no
// arquivo que a Vercel publica a cada push na `main`; e o `process.on('SIGINT')` era código morto,
// porque o `spawnSync` bloqueia o laço de eventos (medido: o processo imprimiu os 14 casos até o
// fim), enquanto o sinal chegando ao GRUPO matava o build filho e imprimia VERMELHO FALSO
// (`X duplicata  build exit null`). O porquê da saída escolhida, e por que a outra foi recusada,
// está por extenso em `test/qa-vercel-injecao.js`.
//
// O CONTROLE DO CONTROLE são DOIS, e nenhum é cerimônia:
//   · o último caso não injeta nada e roda o build SEM o pré-carregamento — ele lê o `vercel.json`
//     do repositório, do disco, e tem de sair **0**. Sem ele, um harness que reprovasse por
//     qualquer motivo (uma dependência faltando, um erro de digitação neste arquivo) mostraria 13
//     vermelhos e passaria por prova de mordida;
//   · todo caso injetado exige a marca `[injecao-vercel] N leitura(s) desviada(s)` com N >= 1 na
//     saída. Se um dia o build passar a ler o `vercel.json` por outro caminho, o desvio deixaria
//     de pegar e o build leria o arquivo LIMPO — sem esta exigência isso apareceria como "o
//     defeito não morde" (que já reprova, mas pelo motivo errado) ou, pior, como verde num caso
//     que esperasse 0. Com ela, desvio quebrado é vermelho com o nome certo.
//
// AS TRÊS CLASSES QUE O ITEM NOMEIA, medidas ANTES do conserto com o método antigo (build exit
// 0 nas três): rotas trocadas · rota duplicada, que ainda imprimia "14 rota(s) … (tabela
// ROTAS_QUE_MEDEM, 13 rotas)" · `script-src https://exfil.example.com` numa regra que mede. As
// cinco que a rodada anterior já cobrava (região, esquema, dedo, escape unicode, connect-src
// removido) são re-medidas aqui para nenhuma delas deixar de morder em silêncio.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const ARQ = path.join(RAIZ, 'vercel.json');
const HOST = require('../ferramentas/medir-secao.js').MEDIDA_HOST;
const escapar = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };

const ORIGINAL = fs.readFileSync(ARQ, 'utf8');
// FORA do repositório, e com o pid no nome: duas execuções em paralelo não se veem, e um SIGKILL
// no pior instante deixa lixo em /tmp em vez de política envenenada no arquivo que a Vercel lê.
const INJETADO = path.join(os.tmpdir(), 'qa-vercel-quadro.' + process.pid + '.json');
const PRELOAD = path.join(__dirname, 'qa-vercel-injecao.js');

// A regra atacada é quase sempre `/historia` (sem barra final): nenhuma rota publicada a resolve,
// então ela é o ponto cego do `test/csp-paginas.js` e o lugar onde o quadro é o único portão.
function comObjeto(mudar) {
  const v = JSON.parse(ORIGINAL);
  const i = v.headers.findIndex(function (r) { return String(r.source) === '/historia'; });
  if (i < 0) throw new Error('a regra /historia sumiu do vercel.json — a injeção não tem onde morder');
  mudar(v, i);
  return JSON.stringify(v, null, 2) + '\n';
}
function naCsp(i, trocar) {
  return comObjeto(function (v, idx) {
    const alvo = i === undefined ? idx : i;
    const h = v.headers[alvo].headers.find(function (x) { return x.key === 'Content-Security-Policy'; });
    h.value = trocar(h.value);
  });
}
// As quatro do texto atacam a SEGUNDA ocorrência do host, que é a da regra `/historia`.
function noTexto(de, para) {
  let n = -1;
  return ORIGINAL.replace(new RegExp(de, 'g'), function (m) { n++; return n === 1 ? para : m; });
}

const CASOS = [
  // --- as três classes deste item ---
  {
    nome: 'troca',
    porque: '/territorio e /glossario trocam de `source`: o território perde o `blob:` que faz a placa 3D desenhar e o glossário ganha CSP mais frouxa. O CONJUNTO de rotas não muda — só a ordem e o par rota/política',
    espero: 'nao e a do QUADRO_DE_ROTAS',
    texto: function () {
      return comObjeto(function (v) {
        const a = v.headers.findIndex(function (r) { return r.source === '/territorio'; });
        const b = v.headers.findIndex(function (r) { return r.source === '/glossario'; });
        v.headers[a].source = '/glossario';
        v.headers[b].source = '/territorio';
      });
    },
  },
  {
    nome: 'duplicata',
    porque: 'a regra /historia entra duas vezes. Conjunto idêntico, multiconjunto não — e era aqui que o portão imprimia "14 rota(s) … (tabela de 13 rotas)" e saía 0',
    espero: 'nao e a do QUADRO_DE_ROTAS',
    texto: function () {
      return comObjeto(function (v, i) { v.headers.splice(i + 1, 0, JSON.parse(JSON.stringify(v.headers[i]))); });
    },
  },
  {
    nome: 'exfil',
    porque: 'host estranho em OUTRA diretiva de uma regra que mede — a cobrança antiga só procurava a string "posthog"',
    espero: 'script-src',
    texto: function () {
      return naCsp(undefined, function (v) { return v.replace("script-src 'unsafe-inline'", "script-src 'unsafe-inline' https://exfil.example.com"); });
    },
  },
  // --- o resto do que o quadro passou a cobrar ---
  {
    nome: 'reordenada',
    porque: 'duas regras trocam de POSIÇÃO sem mudar de conteúdo: multiconjunto idêntico, ordem não. A ordem decide qual regra a Vercel aplica (last-match-wins)',
    espero: 'nao e a do QUADRO_DE_ROTAS',
    texto: function () {
      return comObjeto(function (v) {
        const a = v.headers.findIndex(function (r) { return r.source === '/historia/'; });
        const b = v.headers.findIndex(function (r) { return r.source === '/historia/(.*)'; });
        const t = v.headers[a]; v.headers[a] = v.headers[b]; v.headers[b] = t;
      });
    },
  },
  {
    nome: 'curinga',
    porque: 'curinga em img-src — o §3 manda escrever por extenso, com esquema, nenhum curinga, nunca',
    espero: 'CURINGA',
    texto: function () {
      return naCsp(undefined, function (v) { return v.replace('img-src data:', 'img-src data: https://*.exemplo.com'); });
    },
  },
  {
    nome: 'repetida',
    porque: 'a MESMA diretiva duas vezes, com o mesmo valor: a comparação de valor não tem o que reprovar e sobra só a cobrança de forma. Sem ela, uma segunda `script-src` frouxa antes da conferida seria invisível para quem monta objeto — o navegador aplica a PRIMEIRA',
    espero: 'repete a(s) diretiva(s)',
    texto: function () {
      return naCsp(undefined, function (v) { return v.replace("script-src 'unsafe-inline';", "script-src 'unsafe-inline'; script-src 'unsafe-inline';"); });
    },
  },
  {
    nome: 'rota-nova',
    porque: 'rota nova com CSP fora da forma família-de-seção e SEM connect-src: a asserção da família não a vê, porque ela não é da família',
    espero: 'nao e a do QUADRO_DE_ROTAS',
    texto: function () {
      return comObjeto(function (v, i) {
        v.headers.splice(i, 0, {
          source: '/quilombos',
          headers: [{ key: 'Content-Security-Policy', value: "script-src 'unsafe-inline'; frame-ancestors 'none'" }],
        });
      });
    },
  },
  {
    nome: 'mencao-solta',
    porque: 'o host escrito num campo que NÃO é CSP: a comparação de diretivas não olha para lá, e é a contagem de menções contra o QUADRO que pega',
    espero: '"posthog" aparece',
    texto: function () {
      return comObjeto(function (v, i) {
        v.headers[i].headers.push({ key: 'X-Nota', value: 'ver painel do posthog' });
      });
    },
  },
  // --- as cinco que a rodada anterior já cobrava: nenhuma pode deixar de morder ---
  {
    nome: 'regiao', porque: 'região trocada (eu em vez de us) — os dois respondem 200 OK a qualquer chave',
    espero: 'connect-src', texto: function () { return noTexto(escapar(HOST), 'https://eu.i.posthog.com'); },
  },
  {
    nome: 'esquema', porque: 'esquema rebaixado para http://',
    espero: 'connect-src', texto: function () { return noTexto(escapar(HOST), 'http://us.i.posthog.com'); },
  },
  {
    nome: 'erro-de-dedo', porque: 'psthog em vez de posthog',
    espero: 'connect-src', texto: function () { return noTexto(escapar(HOST), 'https://us.i.psthog.com'); },
  },
  {
    nome: 'escape-unicode', porque: 'o `p` escrito como \\u0070: só o JSON.parse desfaz, e a varredura de texto não vê',
    espero: 'connect-src', texto: function () { return noTexto(escapar(HOST), 'https://eu.i.\\u0070osthog.com'); },
  },
  {
    nome: 'connect-src-removido', porque: 'a rota perde a contagem anônima inteira, em silêncio',
    espero: 'connect-src', texto: function () { return noTexto('connect-src ' + escapar(HOST) + '; ', ''); },
  },
  // --- o controle do controle: sem injeção e SEM desvio, lendo o arquivo do repositório ---
  { nome: '(sem defeito)', porque: 'o arquivo como está no repositório, lido do disco, sem pré-carregamento nenhum — tem de sair 0', espero: null, texto: null },
];

const MARCA = /\[injecao-vercel\] (\d+) leitura\(s\) desviada\(s\)/;

// `texto === null` roda o build NU, contra o vercel.json do disco. Qualquer outra coisa vai para
// um arquivo em /tmp e o `-r` desvia a leitura para lá — o arquivo do repositório fica intocado.
function construir(texto) {
  const args = [];
  const env = Object.assign({}, process.env);
  if (texto === null) {
    delete env.QA_VERCEL_INJETADO;
  } else {
    fs.writeFileSync(INJETADO, texto);
    env.QA_VERCEL_INJETADO = INJETADO;
    args.push('-r', PRELOAD);
  }
  args.push(path.join(RAIZ, 'ferramentas', 'construir.js'));
  const r = spawnSync(process.execPath, args,
    { cwd: RAIZ, encoding: 'utf8', env: env, maxBuffer: 64 * 1024 * 1024 });
  const saida = String(r.stdout || '') + String(r.stderr || '');
  const m = saida.match(MARCA);
  return { code: r.status, saida: saida, desvios: m ? Number(m[1]) : null };
}

let falhas = 0;
console.log('PROVA DE MORDIDA DO QUADRO_DE_ROTAS — ' + CASOS.length + ' caso(s), cada um roda o build de verdade');
console.log('o vercel.json da raiz não é escrito em momento nenhum: a injeção vai para ' + INJETADO);
console.log('');
try {
  for (const c of CASOS) {
    const r = construir(c.texto === null ? null : c.texto());
    const querVermelho = c.espero !== null;
    const desviou = c.texto === null ? true : (r.desvios !== null && r.desvios >= 1);
    const passou = desviou && (querVermelho ? (r.code !== 0 && r.saida.indexOf(c.espero) >= 0) : r.code === 0);
    if (!passou) falhas++;
    console.log((passou ? '  ok  ' : '  X   ') + c.nome.padEnd(22) + ' build exit ' + r.code
      + (c.texto === null ? '  (esperado 0, sem desvio)' : '  (esperado != 0, com "' + c.espero + '" na mensagem; ' + r.desvios + ' leitura desviada)'));
    console.log('        ' + c.porque);
    if (!desviou) {
      console.log('        FALHA DE DESVIO: o build não leu o vercel.json pelo caminho que');
      console.log('        test/qa-vercel-injecao.js intercepta — ele leu o arquivo LIMPO, e este');
      console.log('        caso não provou nada. Veja como conferirVercelJson() abre o arquivo.');
    }
    if (!passou) {
      console.log('        SAIDA DO BUILD (últimas 12 linhas):');
      for (const l of r.saida.trim().split('\n').slice(-12)) console.log('        | ' + l);
    }
  }
} finally {
  if (fs.existsSync(INJETADO)) fs.unlinkSync(INJETADO);
}

// ============================================================================
// O NÚMERO DAS REGRAS INERTES, MEDIDO E COMPARADO — e ele já esteve errado.
//
// O comentário do `conferirVercelJson()` afirmava "as oito regras que nenhuma rota publicada
// decide". São **14 de 22**: a conta velha só olhou a família de seção e esqueceu `/mesa`,
// `/jogo` e `/dashboard`, que sofrem o mesmo nas duas formas. O QA de 03/09 pegou, e a lição é a
// do próprio item: número escrito e não comparado envelhece errado em silêncio. Então ele deixa
// de ser prosa e passa a ser asserção, contra as páginas enumeradas de `dist/` (que o caso
// `(sem defeito)` acabou de reconstruir).
//
// INERTE = a regra está no arquivo, a Vercel a lê, e ela não decide byte nenhum do cabeçalho
// servido HOJE a página nenhuma. É o lugar mais barato para uma CSP frouxa passar despercebida —
// e é exatamente por isso que o QUADRO_DE_ROTAS cobra as 22 como se qualquer uma pudesse decidir.
//
// FECHADA EM 04/09 — A DÚVIDA ABAIXO TEM RESPOSTA, E A ASSERÇÃO CONTINUA CERTA. A hipótese
// verdadeira é a (c): TODAS as regras que casam rodam (as 25 saem de `@vercel/routing-utils` 6.5.0
// com `continue: true`, e a doc oficial do `Source` route define `continue` como "routing will
// continue even when the src is matched" — <https://vercel.com/docs/build-output-api/configuration>).
// O medo embutido em (c) — duas CSP viajando e o navegador aplicando a interseção — NÃO acontece:
// medido em produção, `/historia/` casa duas regras e recebe 4 linhas de cabeçalho, uma por chave,
// então chave repetida é SOBRESCRITA pela última. Por isso last-match-wins segue sendo o resolvedor
// certo e este número segue certo. O que muda é a PALAVRA: as 8 formas com barra final não são
// inertes, são sobrescritas — chave que falte na regra seguinte sobreviveria. As 8 formas SEM barra
// final são inalcançáveis mesmo, mas pelo 308 do `trailingSlash`, que vem antes delas e não tem
// `continue`, e não por precedência de cabeçalho. Prova inteira em `ferramentas/construir.js`, no
// bloco logo acima de `CSP_SECAO_VERCEL`. Contar pelas DUAS ordens continua sendo o certo a fazer.
//
// A DÚVIDA QUE NÃO SE RESOLVE AQUI, E COMO ESTA ASSERÇÃO SOBREVIVE A ELA. Qual regra vence quando
// duas casam com a mesma rota é INFERIDO DE MEDIÇÃO, NÃO DOCUMENTADO: a documentação da Vercel
// alcançável desta máquina não afirma a precedência do array `headers` para a MESMA chave de
// cabeçalho — o que ela documenta como "a primeira que casa vence" é a regra de ROTEAMENTO
// (rewrite/redirect/status), que é outra coisa. Há três hipóteses vivas, e nenhuma foi confirmada
// em documento: (a) a última que casa vence, que é o que o `test/csp-paginas.js` resolve e o que o
// QA mediu; (b) a primeira que casa vence; (c) as duas são enviadas e o navegador aplica a
// INTERSECÇÃO das políticas — que, se for o caso, torna "inerte" um nome errado e a cobrança das
// 22 ainda mais necessária.
//
// Por isso esta asserção NÃO escolhe hipótese: ela conta as inertes pelas DUAS ordens e exige o
// mesmo número nas duas. Medido em 03/09 com as 8 páginas de hoje: 14 pela última-vence e 14 pela
// primeira-vence — o NÚMERO não depende da dúvida, só a IDENTIDADE das 14 depende (pela última
// vencem as 7 formas `(.*)`; pela primeira vencem as 7 com barra final). O que é estável nas duas:
// `/` decide, e as 7 formas SEM barra final não casam com página publicada nenhuma.
//
// Mudou de propósito (rota nova, página nova em dist/)? mude este número no MESMO commit e diga
// no commit por quê — é a mesma disciplina do quadro, e é de propósito que seja chata.
// 04/09: 14 -> 16. A rota `/privacidade/` entrou (item `pagina-privacidade`) com as MESMAS três
// formas das outras seções, e ela acrescenta exatamente 2 inertes em qualquer das hipóteses de
// precedência: a forma SEM barra final (`/privacidade`) não casa com página publicada nenhuma, e
// das duas que casam uma perde para a outra — pela última-vence perde `/privacidade/`, pela
// primeira-vence perde `/privacidade/(.*)`. O número continua estável nas duas ordens, que é o
// que esta asserção existe para exigir.
const INERTES_ESPERADAS = 16;
const DIST = path.join(RAIZ, 'dist');
function paginasPublicadas(dir, prefixo) {
  let fora = [];
  for (const f of fs.readdirSync(dir)) {
    const pp = path.join(dir, f);
    if (fs.statSync(pp).isDirectory()) fora = fora.concat(paginasPublicadas(pp, prefixo + f + '/'));
    else if (f === 'index.html') fora.push(prefixo);
  }
  return fora;
}
if (!fs.existsSync(DIST)) {
  console.error('');
  console.error('FALHA: dist/ não existe — o caso `(sem defeito)` deveria tê-lo construído.');
  process.exit(1);
}
const rotasPublicadas = paginasPublicadas(DIST, '/').sort();
const regrasDoArquivo = JSON.parse(ORIGINAL).headers || [];
const casa = function (fonte, rota) {
  return fonte.endsWith('/(.*)') ? rota.startsWith(fonte.slice(0, -4)) : rota === fonte;
};
function inertesPor(primeiraVence) {
  const decidem = new Set();
  for (const rota of rotasPublicadas) {
    const dono = {};
    regrasDoArquivo.forEach(function (r, i) {
      if (!casa(String(r.source || ''), rota)) return;
      for (const h of (r.headers || [])) {
        if (primeiraVence && Object.prototype.hasOwnProperty.call(dono, h.key)) continue;
        dono[h.key] = i;
      }
    });
    for (const k of Object.keys(dono)) decidem.add(dono[k]);
  }
  return regrasDoArquivo
    .map(function (r, i) { return { fonte: String(r.source || ''), i: i }; })
    .filter(function (x) { return !decidem.has(x.i); })
    .map(function (x) { return x.fonte; });
}
const inertesUltima = inertesPor(false);
const inertesPrimeira = inertesPor(true);
console.log('');
console.log('REGRAS INERTES — as que não decidem cabeçalho de página nenhuma publicada em dist/');
console.log('  páginas em dist/ (' + rotasPublicadas.length + '): ' + JSON.stringify(rotasPublicadas));
console.log('  pela ÚLTIMA-que-casa-vence:  ' + inertesUltima.length + ' de ' + regrasDoArquivo.length
  + ' — ' + JSON.stringify(inertesUltima));
console.log('  pela PRIMEIRA-que-casa-vence: ' + inertesPrimeira.length + ' de ' + regrasDoArquivo.length
  + ' — ' + JSON.stringify(inertesPrimeira));
if (inertesUltima.length !== INERTES_ESPERADAS || inertesPrimeira.length !== INERTES_ESPERADAS) {
  falhas++;
  console.error('  X   o número mudou: INERTES_ESPERADAS diz ' + INERTES_ESPERADAS + ' e a medição deu '
    + inertesUltima.length + ' (última vence) e ' + inertesPrimeira.length + ' (primeira vence).'
    + ' Rota nova? página nova em dist/? mude o número no MESMO commit e diga por quê.');
} else {
  console.log('  ok  ' + INERTES_ESPERADAS + ' nas duas ordens — o número não depende da precedência,'
    + ' que desde 04/09 também não é mais dúvida: TODAS as que casam rodam, e chave repetida'
    + ' é sobrescrita pela última (provas em ferramentas/construir.js, acima de CSP_SECAO_VERCEL)');
}

console.log('');
// Não é restauração: é INVARIANTE. Este arquivo nunca escreve o vercel.json, então vê-lo mudado
// aqui significa que outra coisa o mudou durante a execução — e isso merece vermelho, não silêncio.
if (fs.readFileSync(ARQ, 'utf8') !== ORIGINAL) {
  console.error('FALHA: o vercel.json da raiz mudou durante esta execução, e este portão não o escreve.');
  console.error('       Alguém mais mexeu nele (outro processo? outro agente?). Confira `git diff vercel.json`.');
  process.exit(1);
}
if (falhas) { console.error('REPROVADO — ' + falhas + ' caso(s) não morderam'); process.exit(1); }
console.log('ok — ' + (CASOS.length - 1) + ' injeção(ões) mordem e o arquivo do repositório passa; vercel.json nunca foi escrito');
process.exit(0);
