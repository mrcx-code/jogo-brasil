// ============================================================================
// O CONTROLE DO FILTRO DE ERROS DE CONSOLE DO `encaixe.js` — escrito pelo QA em 31/08.
// ============================================================================
//
// POR QUE ELE EXISTE. O commit 952e3aa afrouxou uma asserção que reprovava: o coletor global de
// erros de console do `test/encaixe.js` passou a CALAR o host da medição. O motivo era bom e está
// medido — nesta máquina o proxy responde **403 ao CONNECT** para `us.i.posthog.com`, e o
// `encaixe.js` saía **1 num jogo perfeito**, por causa da rede de quem o roda.
//
// Mas quem escreveu o defeito, o conserto, o portão E o controle foi a mesma pessoa. Este arquivo
// é o adversário que faltava, e a pergunta dele é a inversa da que o autor fez:
//
//     **que erro de console REAL o filtro passa a engolir, e não devia?**
//
// ELE NÃO ESPELHA O FILTRO — ele o EXTRAI. A promessa do comentário do `encaixe.js` é literal:
//
//     "Ele cala UM host: o da medição, e só quando o próprio Chromium diz que
//      NÃO CONSEGUIU BUSCÁ-LO."
//
// Espelhar a regra aqui seria repetir o erro que o próprio `encaixe.js` acabou de consertar noutro
// bloco (o espelho de `notaDaVolta`): no instante em que os dois divergem, o espelho fica verde
// mentindo. Então o corpo do `page.on('console', ...)` é lido do arquivo, compilado, e é ELE que
// julga as cenas. Mudou o filtro lá, este controle mede o filtro novo.
//
// AS CENAS SÃO REAIS. Cada linha da tabela é um erro que um Chromium de verdade escreveu, no jogo
// de verdade, com a CSP de verdade — `m.location().url` e `m.text()` saem do navegador, não de uma
// fixture. As rotas fabricam a CAUSA, nunca a mensagem.
//
// ============================================================================
// O QUE ESTE CONTROLE MEDIU EM 31/08, E POR QUE ELE SAI 1 HOJE
// ============================================================================
//
//   cena                                                     url do erro              veredito
//   -------------------------------------------------------  -----------------------  --------
//   A  proxy recusa o host da medição (o caso que motivou)    posthog/i/v0/e/          ENGOLE ✔
//   B  pack-*.json do próprio jogo some (404 em 'self')       127.0.0.1/pack-...       acusa  ✔
//   C  CSP barra host não autorizado                          (sem url)                acusa  ✔
//   D  a MEDIÇÃO responde **404** — endereço malformado       posthog/i/v0/ERRADO/     ENGOLE ✘
//   E  a MEDIÇÃO responde **400** — payload inválido          posthog/i/v0/ruim/       ENGOLE ✘
//   F  console.error() do próprio jogo                        (sem url)                acusa  ✔
//
// D e E são o achado, e ele é estreito e concreto: o filtro casa `Failed to load resource` no host
// da medição SEM olhar a causa, e o Chromium usa a MESMA frase para "não consegui chegar lá"
// (`net::ERR_...`) e para "cheguei e o servidor respondeu 404/400". A segunda é **culpa do jogo** —
// endereço malformado, payload inválido — e é exatamente o modo de falha que o `CLAUDE.md` §3.2
// nomeia como o pior: *"errar nela falha em SILÊNCIO ... o sintoma seria um painel vazio semanas
// depois"*. O filtro removeu o único sinal que ainda apitava quando o CAMINHO está errado (a
// região errada já era silenciosa, porque os dois endereços respondem 200 OK).
//
// O CONSERTO É UMA LINHA, e é do dono do `encaixe.js`, não meu (quem mede não edita):
//
//     - if (url.indexOf(MEDIDA_HOST) === 0 && /Failed to load resource/i.test(m.text())) return;
//     + if (url.indexOf(MEDIDA_HOST) === 0 && /Failed to load resource: net::ERR_/i.test(m.text())) return;
//
// Medido: a cena A escreve `Failed to load resource: net::ERR_FAILED` (e, com o proxy de verdade,
// `net::ERR_TUNNEL_CONNECTION_FAILED`) — continua calada. D e E voltam a acusar, com a url.
//
// **ENQUANTO ESSA LINHA NÃO ENTRAR, ESTE ARQUIVO SAI 1, E ISSO É DE PROPÓSITO** — é a lição 2.8 da
// casa ao contrário: um controle que nascesse verde sobre um filtro que engole 404 seria a
// decoração que ele existe para não ser. **Não o ponha no CI antes do conserto**: portão que nasce
// vermelho por defeito real ensina a equipe a ignorar o CI.
//
// COMO USAR
//   node test/filtro-console-controle.js     # exit 0 = o filtro cumpre a promessa escrita nele
// ============================================================================
'use strict';

const path = require('path');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');
const fs = require('fs');
const { MEDIDA_HOST } = require('../ferramentas/medir-secao.js');

// ————— 1. O FILTRO, EXTRAÍDO DO `encaixe.js` (nunca copiado) —————
//
// Recorta o corpo do `page.on('console', ...)` equilibrando chaves a partir da âncora e o compila.
// Se a âncora sumir, o controle sai 2 dizendo isso: sonda que não achou o que mede tem de gritar,
// não devolver verde.
function filtroDoEncaixe() {
  const txt = fs.readFileSync(path.join(__dirname, 'encaixe.js'), 'utf8');
  const ANCORA = "page.on('console', m => {";
  const i = txt.indexOf(ANCORA);
  if (i < 0) return null;
  const abre = txt.indexOf('{', i + ANCORA.length - 1);
  let prof = 0, fim = -1;
  for (let k = abre; k < txt.length; k++) {
    if (txt[k] === '{') prof++;
    else if (txt[k] === '}') { prof--; if (prof === 0) { fim = k; break; } }
  }
  if (fim < 0) return null;
  const corpo = txt.slice(abre + 1, fim);
  // `erros` e `MEDIDA_HOST` são o ambiente que o corpo enxerga lá dentro; aqui viram parâmetros.
  // eslint-disable-next-line no-new-func
  const f = new Function('m', 'erros', 'MEDIDA_HOST', corpo);
  return function (tipo, url, texto) {
    const recolhidos = [];
    f({ type: () => tipo, location: () => ({ url }), text: () => texto }, recolhidos, MEDIDA_HOST);
    return recolhidos.length === 0;      // true = ENGOLIU
  };
}

// ————— 2. AS CENAS —————
//
// `espera`: 'calar' = rede recusando a medição, não é defeito do jogo (o filtro DEVE engolir).
//           'acusar' = defeito do jogo ou da casa; o portão TEM de reprovar.
const CENAS = [
  { id: 'A', nome: 'proxy recusa o host da medição (o caso que motivou o filtro)', espera: 'calar' },
  { id: 'B', nome: 'pack-*.json do próprio jogo some (404 em self)', espera: 'acusar' },
  { id: 'C', nome: 'CSP barra um host não autorizado', espera: 'acusar' },
  { id: 'D', nome: 'a MEDIÇÃO responde 404 — endereço malformado, culpa do jogo', espera: 'acusar' },
  { id: 'E', nome: 'a MEDIÇÃO responde 400 — payload inválido, culpa do jogo', espera: 'acusar' },
  { id: 'F', nome: 'console.error() do próprio jogo', espera: 'acusar' },
];

// Cada cena é reconhecida pela url + um pedaço do texto. É assim que o navegador de verdade
// é ligado à linha da tabela, sem inventar a mensagem.
function qualCena(url, texto) {
  if (url.indexOf(MEDIDA_HOST + '/i/v0/e/') === 0) return 'A';
  if (/pack-que-nao-existe-zzz/.test(url)) return 'B';
  if (/Content Security Policy/i.test(texto) && /exemplo-nao-autorizado/.test(texto)) return 'C';
  if (url.indexOf(MEDIDA_HOST + '/i/v0/ERRADO') === 0) return 'D';
  if (url.indexOf(MEDIDA_HOST + '/i/v0/ruim') === 0) return 'E';
  if (/BRASIL: o jogo gritou/.test(texto)) return 'F';
  return null;
}

(async () => {
  const engole = filtroDoEncaixe();
  if (!engole) {
    console.log('INCONCLUSIVO — a âncora `page.on(\'console\', m => {` sumiu do test/encaixe.js.');
    console.log('Conserte a EXTRAÇÃO deste controle, nunca o filtro, para fazer isto passar.');
    process.exit(2);
  }

  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  const pg = await ctx.newPage();

  const crus = [];
  pg.on('console', (m) => {
    if (m.type() !== 'error') return;
    crus.push({ url: (m.location() && m.location().url) || '', texto: m.text() });
  });

  await pg.route('**/*', async (route) => {
    const u = route.request().url();
    if (u.indexOf(MEDIDA_HOST + '/i/v0/e/') === 0) return route.abort('failed');
    if (u.indexOf(MEDIDA_HOST + '/i/v0/ERRADO') === 0) return route.fulfill({ status: 404, body: 'nao existe' });
    if (u.indexOf(MEDIDA_HOST + '/i/v0/ruim') === 0) return route.fulfill({ status: 400, body: 'payload' });
    return route.continue();
  });

  // O JOGO DE VERDADE, e não uma página de mentira: é a CSP dele que decide a cena C, e ela é a
  // única coisa aqui que não dá para simular sem errar.
  const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
  await pg.goto(ALVO, { waitUntil: 'domcontentloaded' });

  await pg.evaluate(async (h) => {
    const t = (f) => f().catch(() => {});
    await t(() => fetch(h + '/i/v0/e/', { method: 'POST', body: '{}' }));
    await t(() => fetch('/pack-que-nao-existe-zzz.json'));
    await t(() => fetch('https://exemplo-nao-autorizado.invalid/x'));
    await t(() => fetch(h + '/i/v0/ERRADO/', { method: 'POST', body: '{}' }));
    await t(() => fetch(h + '/i/v0/ruim/', { method: 'POST', body: '{}' }));
    console.error('BRASIL: o jogo gritou de verdade');
  }, MEDIDA_HOST);

  await pg.waitForTimeout(900);
  await nav.close();

  console.log('MEDIDA_HOST = ' + MEDIDA_HOST + '   ·   erros de console crus: ' + crus.length);
  console.log('');

  let falhas = 0;
  const vistas = new Set();
  for (const c of crus) {
    const id = qualCena(c.url, c.texto);
    if (!id) continue;                     // ruído do próprio jogo/ambiente, fora da tabela
    vistas.add(id);
    const cena = CENAS.find((x) => x.id === id);
    const eng = engole('error', c.url, c.texto);
    const certo = (cena.espera === 'calar') === eng;
    if (!certo) falhas++;
    console.log('  ' + id + '  ' + (eng ? 'ENGOLE' : 'acusa ') + '  ' + (certo ? '✔' : '✘ ERRADO')
      + '   ' + cena.nome);
    console.log('       url:   ' + (c.url || '(sem url)'));
    console.log('       texto: ' + c.texto.split('\n')[0]);
  }

  console.log('');
  const faltando = CENAS.filter((c) => !vistas.has(c.id)).map((c) => c.id);
  if (faltando.length) {
    console.log('CENAS QUE NÃO ACONTECERAM: ' + faltando.join(', ')
      + ' — sem elas a tabela não prova nada, e isso conta como falha.');
    falhas += faltando.length;
  }

  // A cena A é a razão de o filtro existir: se ela deixar de ser calada, o conserto de 952e3aa
  // foi desfeito e o `encaixe.js` volta a reprovar jogo perfeito em máquina com proxy fechado.
  if (vistas.has('A')) {
    const a = crus.find((c) => qualCena(c.url, c.texto) === 'A');
    if (!engole('error', a.url, a.texto)) {
      console.log('REGRESSÃO: a cena A voltou a acusar — o encaixe.js reprova jogo perfeito onde a rede recusa a medição.');
    }
  }
  // E o coletor nunca pode calar um erro SEM url: `''.indexOf(host)` é −1, e é isso que segura o
  // caso "a mensagem não traz location".
  if (engole('error', '', 'Failed to load resource: the server responded with a status of 404 (Not Found)')) {
    console.log('  ✘ ERRADO  erro SEM url foi engolido — o filtro deixou de exigir o host');
    falhas++;
  } else {
    console.log('  ok  erro de console SEM url continua acusando (o `|| \'\'` não vira curinga)');
  }
  // E um erro que não seja de carga, no host da medição, também tem de passar.
  if (engole('error', MEDIDA_HOST + '/i/v0/e/', 'Uncaught TypeError: algo do jogo quebrou')) {
    console.log('  ✘ ERRADO  erro que não é de carga foi engolido só por estar no host da medição');
    falhas++;
  } else {
    console.log('  ok  erro que não é "Failed to load resource" continua acusando mesmo no host da medição');
  }

  console.log('');
  console.log(falhas
    ? 'REPROVADO — ' + falhas + ' cena(s) fora da promessa escrita no filtro. O conserto está no cabeçalho.'
    : 'VERDE — o filtro cala a rede que recusa a medição e acusa tudo o mais.');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
