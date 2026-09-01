// test/painel-sem-sinal.js — O PAINEL SO AFIRMA O QUE ELE SABE.
//
// POR QUE EXISTE, com a data e o numero. Em 01/09, as 10h44, o dono olhou o dashboard e viu
// quatro cartoes na faixa AGORA — Claude, dev-plataforma, historiador, dev-dados — todos
// dizendo "TRABALHANDO / agora", com bonequinho martelando. O ultimo sinal deles no
// `mesa_agente` tinha 315 minutos e era da rodada `nuvem-20260901T0823`, que ja tinha pousado.
// A rodada que estava REALMENTE no ar (`nuvem-20260901T1340`, commit as 10h42) nunca tocou a
// mesa. O painel nao estava atrasado: estava AFIRMANDO com a confianca de quem sabe.
//
// SAO TRES DOENCAS DA MESMA FAMILIA, e este arquivo cobra as tres. As duas ultimas so
// apareceram porque o QA tentou derrubar o conserto da primeira — e as duas eram DANO DO
// PROPRIO CONSERTO, que e a licao 2.9 do EQUIPE.md acontecendo de novo.
//
//   (A) ESFRIA DE MENOS — chegou dado velho. `st==="trabalhando" ? "agora" : ...`: o status e a
//       ultima coisa que ALGUEM escreveu. Quem cai, quem estoura cota e quem esquece de pousar
//       deixa a linha acesa para sempre.
//
//   (B) ESFRIA DE MENOS — parou de chegar dado. `r.ok ? r.json() : []` fazia 401 e 503 virarem
//       LISTA VAZIA: nenhum cartao reescrito, `Promise.all` RESOLVENDO, rodape carimbando
//       "ao vivo · <hora de agora>" sobre o estado de horas atras.
//
//   (C) ESFRIA DEMAIS — o outro lado, e sem ele metade das asserções fica orfa. O painel dizer
//       "sem sinal" sobre quem esta de fato trabalhando e tao falso quanto o contrario, e o QA
//       provou que dava para matar 7 das 21 asserções de uma vez com o portao VERDE, porque
//       nenhum mutante modelava esse lado.
//
// A INVARIANTE: O PAINEL DIZ "AGORA" QUANDO — E SO QUANDO — TEM SINAL RECENTE NA MAO. Sinal com
// mais de 45 min, ausente, com carimbo no FUTURO (relogio dessincronizado entre maquinas do
// plantao) ou servidor que parou de responder viram "sem sinal": o cartao esfria, TODAS as
// animacoes param (corpo, BRACO e faisca — o braco e o que le como "esta trabalhando", e era
// justamente o que nao era olhado) e ele sai da faixa AGORA, porque posicao tambem afirma. E o
// contrario tambem e cobrado: sinal fresco continua dizendo "agora", com o boneco se mexendo.
//
// O CONTROLE (EQUIPE.md 2.8). A primeira versao deste arquivo trazia um "controle" que o QA
// derrubou em uma linha: ele REPETIA a asserção contra a copia velha em vez de EXERCITA-LA. A
// segunda exigia que o bloco "acusasse alguma coisa", e o QA derrubou de novo: outras asserções
// acusavam no lugar das mortas. Agora o bloco de asserções e UM SO (`conferir`) e cada mutante
// cobra o CONJUNTO EXATO que deve derrubar — matar uma asserção a tira da lista e REPROVA.
//
// Nao precisa de login: os cartoes sao lidos com a chave publicavel. Toda a rede e roteada;
// nada sai da maquina. O relogio da pagina e deslocavel por `window.__DESVIO`, que e como as
// cenas de queda envelhecem 3 horas sem esperar 3 horas.
//
// COMO VER ELE REPROVANDO:
//     PAINEL_HTML=<copia mutilada> node test/painel-sem-sinal.js
//     PAINEL_DUMP=1 node test/painel-sem-sinal.js    # imprime o que cada mutante derruba
//
// Exit 0 = o painel diz a verdade. Exit 1 = ele mente, ou um controle nao mordeu. Exit 2 = o
// teste envelheceu (nao achou o alvo no arquivo).

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..');
const HTML = process.env.PAINEL_HTML ? path.resolve(process.env.PAINEL_HTML)
  : path.join(RAIZ, 'dashboard', 'index.html');
const DUMP = !!process.env.PAINEL_DUMP;
const HOST = 'https://mesa.brasil.test';
const CAMINHO = '/dashboard/';
const SB = 'https://hdhqziqvrthxtgyraemk.supabase.co';

let falhas = 0;
function parou(msg) { console.log('PAROU: ' + msg); process.exit(2); }
function ok(cond, msg, extra) {
  if (cond) { console.log('  ok  ' + msg); return true; }
  falhas++;
  console.log('  FALHOU  ' + msg + (extra == null ? '' : '  <- ' + String(extra).slice(0, 200)));
  return false;
}

// ============================== O TETO, LIDO DA PAGINA ==============================
// Nao e copia manual: com o teto escrito AQUI dava para mudar o da pagina para 5, 20 ou 40 e o
// portao passava nos tres. E nao basta procurar a string: o QA pos um COMENTARIO de isca
// ("// referencia: var SEM_SINAL_MIN = 45") antes da declaracao real e baixou o teto para 5 —
// exit 0. E a lição 2.6 do EQUIPE.md num repositorio onde toda constante tem paragrafo em cima.
// Entao: ancorado em INICIO DE LINHA (comentario nao casa) e exigindo casamento UNICO.
const TETO_ACORDADO = 45;
function tetoDaPagina(fonte) {
  const achados = fonte.match(/^[ \t]*var[ \t]+SEM_SINAL_MIN[ \t]*=[ \t]*(\d+)/gm) || [];
  if (achados.length === 0) parou('nao achei a declaracao de SEM_SINAL_MIN em ' + HTML + ' — o teste envelheceu');
  if (achados.length > 1) parou('achei ' + achados.length + ' declaracoes de SEM_SINAL_MIN — qual vale? o teste nao adivinha');
  return parseInt(achados[0].match(/(\d+)/)[1], 10);
}

// ====================== AS COPIAS MUTILADAS, uma por capacidade ======================
const LINHA_NOVA = 'card.querySelector(".ult").textContent = rotuloUltimo(st, item.ativo_em, Date.now());';
const LINHA_VELHA = 'card.querySelector(".ult").textContent = st==="trabalhando"?"agora":"'
  + 'última: ' + '"+desde(item.ativo_em);';
// A REGRESSAO E RECONHECIDA PELO PADRAO, nao pelo byte. O QA mostrou que o MESMO defeito escrito
// com outro espacamento saia 2 ("o teste envelheceu"), mandando consertar o teste quando quem
// regrediu era a pagina. O regex pega a forma, e a forma e o que importa.
const PADRAO_VELHO = /st\s*===\s*"trabalhando"\s*\?\s*"agora"/;

function trocaUnica(fonte, re, novo, oQue) {
  if (!re.test(fonte)) parou('nao achei ' + oQue + ' — o teste envelheceu');
  return fonte.replace(re, novo);
}

function mutantes(fonte) {
  const fora = [];
  // M1 · o rotulo volta ao ternario de 01/09 (o defeito original, exato)
  if (fonte.indexOf(LINHA_NOVA) < 0) {
    if (PADRAO_VELHO.test(fonte)) {
      console.log('  FALHOU  a pagina VOLTOU ao rotulo antigo (ternario cru, sem idade)');
      falhas++;
    } else {
      parou('nao achei a chamada de rotuloUltimo em ' + HTML + ' — o teste envelheceu');
    }
  } else {
    fora.push({ nome: 'M1 rotulo antigo', html: fonte.replace(LINHA_NOVA, LINHA_VELHA) });
  }
  // M2 · a classe `frio` deixa de ser posta
  fora.push({ nome: 'M2 sem a classe frio',
    html: trocaUnica(fonte, /card\.classList\.toggle\("frio",[^;]+;/, '', 'o toggle("frio")') });
  // M3a/b/c · a classe continua, mas o CSS que PARA cada animacao some. Sao TRES mutantes e nao
  // um: o QA mediu que, lendo so `.bon`, dava para apagar a regra do BRACO e a faisca continuava
  // — cartao "sem sinal ha 5h" com o braco batendo o martelo a 0,52 s por ciclo, portao verde.
  fora.push({ nome: 'M3a corpo continua balancando',
    html: trocaUnica(fonte, /\.ag\.frio \.bon\{[^}]*\}/, '', 'a regra CSS de .ag.frio .bon') });
  fora.push({ nome: 'M3b braco continua martelando',
    html: trocaUnica(fonte, /\.ag\.frio \.bon \.braco\{[^}]*\}/, '', 'a regra CSS de .ag.frio .bon .braco') });
  fora.push({ nome: 'M3c faisca continua saltando',
    html: trocaUnica(fonte, /\.ag\.frio \.faisca\{[^}]*\}/, '', 'a regra CSS de .ag.frio .faisca') });
  // M4 · o cartao frio volta a subir para a faixa AGORA
  fora.push({ nome: 'M4 frio sobe para a faixa AGORA',
    html: trocaUnica(fonte, /var alvo=\(st==="trabalhando" && !frio\)\?grupoAgora\(\):grupoDe\(item\.squad\);/,
      'var alvo=(st==="trabalhando")?grupoAgora():grupoDe(item.squad);', 'a escolha de grupo') });
  // M7 · o rotulo de ESTADO volta a dizer sempre "trabalhando"
  fora.push({ nome: 'M7 estado sempre "trabalhando"',
    html: trocaUnica(fonte, /card\.querySelector\("\.st"\)\.textContent = frio\?"sem sinal"/,
      'card.querySelector(".st").textContent = false?"sem sinal"', 'o rotulo de estado') });
  // M8 · ESFRIA DEMAIS: erro de unidade na idade (60x). Sem este mutante, cinco asserções — as
  // que guardam "quem esta trabalhando de verdade continua dizendo agora" — ficavam orfas: o QA
  // matou as sete de uma vez e o portao saiu 0. Um painel que esfria tudo e tao falso quanto um
  // que nao esfria nada, e so este lado prova que as duas metades tem dono.
  fora.push({ nome: 'M8 esfria demais (idade 60x)',
    html: trocaUnica(fonte, /return isNaN\(t\)\?null:\(agoraMs-t\)\/60000;/,
      'return isNaN(t)?null:(agoraMs-t)/1000;', 'o calculo de idade em idadeMin') });
  // M9 · o `frio` vaza para quem esta em ESPERA (quem nao se diz trabalhando nao tem sinal a dar)
  fora.push({ nome: 'M9 frio vaza para quem esta em espera',
    html: trocaUnica(fonte, /var frio=\(st==="trabalhando"\) && semSinal\(item\.ativo_em, Date\.now\(\)\);/,
      'var frio=semSinal(item.ativo_em, Date.now());', 'o calculo do frio') });
  // M10 · o rotulo de quem esta em espera vira "sem sinal" tambem
  fora.push({ nome: 'M10 espera perde o "ultima:"',
    html: trocaUnica(fonte, /if\(st!=="trabalhando"\) return "última: "\+desde\(iso\);/,
      '', 'o ramo de espera em rotuloUltimo') });
  return fora;
}

// A REPINTURA vira no-op pelo CORPO da funcao, nao apagando chamadas: ela e chamada de tres
// lugares agora (intervalo, o ramo de falha parcial, e o catch), e um mutante que apaga so uma
// das chamadas nao reproduz defeito nenhum — foi assim que a primeira versao deste controle
// passou a mentir depois que o `allSettled` entrou.
function semRepintura(fonte) {
  return trocaUnica(fonte, /function repintarIdades\(\)\{[\s\S]*?\n  \}/,
    'function repintarIdades(){ /* mutante: sem repintura por relogio */ }', 'a funcao repintarIdades');
}
function semDistinguirVazio(fonte) {
  return trocaUnica(fonte, /function corpo\(r\)\{[^}]*\}/,
    'function corpo(r){ return r.ok?r.json():Promise.resolve([]); }', 'a funcao corpo(r)');
}

// ---------------------------------------------------------------------------------- o palco
function agente(nome, status, minutosAtras) {
  return {
    nome, papel: 'papel de teste', cor: '#7d8479', status,
    atividade: 'atividade de teste', ordem: 1, squad: 'central',
    ativo_em: minutosAtras === null ? null
      : new Date(Date.now() - minutosAtras * 60000).toISOString(),
  };
}

// Le o estado de cada cartao NA TELA. As animacoes vem do `getComputedStyle` — nao do nome da
// classe, e nao so do `.bon`: o braco (`bonswing`) e a faisca tem regra propria, e eram elas que
// continuavam vivas num cartao "sem sinal ha 5h" com o portao verde.
const LEITURA = () => {
  const out = {};
  document.querySelectorAll('.ag').forEach(c => {
    const n = c.querySelector('.nome');
    if (!n) return;
    const bon = c.querySelector('.bon'), braco = c.querySelector('.bon .braco'), fai = c.querySelector('.faisca');
    const anim = el => (el ? getComputedStyle(el).animationName : '(ausente)');
    out[n.textContent.trim()] = {
      ult: (c.querySelector('.ult') || {}).textContent || '',
      st: (c.querySelector('.st') || {}).textContent || '',
      frio: c.classList.contains('frio'),
      animBon: anim(bon), animBraco: anim(braco), animFaisca: anim(fai),
      opFaisca: fai ? getComputedStyle(fai).opacity : '(ausente)',
      noAgora: !!(c.closest('.grupo-ag') && c.closest('.grupo-ag').classList.contains('agora')),
    };
  });
  return out;
};

async function abrir(nav, html, linhas) {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => {
    const D = Date.now;
    window.__DESVIO = 0;
    Date.now = () => D() + (window.__DESVIO || 0);
  });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push('pageerror: ' + e.message));
  pag.on('console', m => {
    if (m.type() !== 'error') return;
    if (/^Failed to load resource/.test(m.text())) return;
    erros.push(m.text());
  });
  // `queda` e o modo da segunda fase: false = servidor normal · '503' = fora do ar ·
  // 'vazio' = 200 OK com lista vazia (o caso que o `corpo()` NAO cobre, e que so a repintura
  // por relogio resolve — o QA achou que ele nao tinha cena e tinha razao).
  const estado = { queda: false };
  await pag.route(HOST + '/**', r => {
    const p = new URL(r.request().url()).pathname;
    if (p === CAMINHO || p === CAMINHO + 'index.html')
      return r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
    return r.fulfill({ status: 404, contentType: 'text/plain', body: '404' });
  });
  await pag.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await pag.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 200, body: '' }));
  await pag.route(SB + '/**', rota => {
    const url = rota.request().url();
    const ehAgente = url.indexOf('/rest/v1/mesa_agente') >= 0;
    if (estado.queda === '503')
      return rota.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"fora do ar"}' });
    if (estado.queda === 'vazio' && ehAgente)
      return rota.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    return rota.fulfill({ status: 200, contentType: 'application/json',
      body: ehAgente ? JSON.stringify(linhas) : '[]' });
  });
  await pag.goto(HOST + CAMINHO, { waitUntil: 'domcontentloaded' });
  await pag.waitForFunction(n => document.querySelectorAll('.ag').length >= n, linhas.length, { timeout: 15000 })
    .catch(() => { /* a contagem reprova com nome, que diz mais que um timeout */ });
  return { ctx, pag, estado, erros };
}

async function ler(nav, html, linhas) {
  const p = await abrir(nav, html, linhas);
  const vistos = await p.pag.evaluate(LEITURA);
  await p.ctx.close();
  return { vistos, erros: p.erros };
}

// ====================== O BLOCO DE ASSERCOES, UM SO ======================
const CENAS = [
  agente('fresco', 'trabalhando', 3),
  agente('congelado', 'trabalhando', 315),          // o caso real de 01/09
  agente('sem-data', 'trabalhando', null),
  agente('parado', 'espera', 2880),
  agente('na-borda', 'trabalhando', TETO_ACORDADO + 5),
  agente('futuro', 'trabalhando', -60 * 24 * 10),   // relogio dessincronizado entre maquinas
];

function conferir(v, reg) {
  const f = v['fresco'] || {}, c = v['congelado'] || {}, s = v['sem-data'] || {},
    p = v['parado'] || {}, b = v['na-borda'] || {}, fu = v['futuro'] || {};

  // Esta primeira e GUARDA, nao invariante: se os cartoes nao renderizarem, tudo abaixo falha
  // junto. Ela existe para o relatorio dizer "nao renderizou" em vez de vinte "undefined".
  reg(Object.keys(v).length >= CENAS.length, 'os ' + CENAS.length + ' cartoes renderizaram', Object.keys(v).join(','));

  // --- ESFRIA DE MENOS? (o defeito de 01/09)
  reg(c.ult !== 'agora', 'sinal de 315 min NAO diz "agora"  (o defeito de 01/09)', c.ult);
  reg(/^sem sinal/.test(c.ult), 'e diz "sem sinal ..."', c.ult);
  reg(/5h/.test(c.ult), 'com a idade dentro (5h)', c.ult);
  reg(c.frio === true, 'e o cartao esfria', String(c.frio));
  reg(c.animBon === 'none', 'e o CORPO para (animacao na tela, nao a classe)', c.animBon);
  reg(c.animBraco === 'none', 'e o BRACO para — e ele que le como "esta trabalhando"', c.animBraco);
  reg(c.animFaisca === 'none' || c.opFaisca === '0', 'e a FAISCA apaga', c.animFaisca + '/op ' + c.opFaisca);
  reg(c.noAgora === false, 'e sai da faixa AGORA — posicao tambem afirma', String(c.noAgora));
  reg(/sem sinal/.test(c.st), 'e o rotulo de estado deixa de dizer "trabalhando"', c.st);

  reg(/^sem sinal/.test(s.ult), 'sem ativo_em nao vira "agora" — nao saber != ser recente', s.ult);
  reg(s.frio === true, 'e o cartao sem data esfria', String(s.frio));

  reg(/^sem sinal/.test(b.ult), 'logo acima do teto ja e "sem sinal"', b.ult);

  reg(fu.ult !== 'agora', 'carimbo 10 dias no FUTURO nao diz "agora"', fu.ult);
  reg(/^sem sinal/.test(fu.ult), 'e diz "sem sinal — carimbo no futuro"', fu.ult);
  reg(fu.frio === true, 'e esfria: sinal em que nao se pode acreditar e "nao sei"', String(fu.frio));
  reg(fu.noAgora === false, 'e nao fica na faixa AGORA', String(fu.noAgora));

  // --- ESFRIA DEMAIS? (o outro lado, sem o qual as de cima ficam sem contraprova)
  reg(f.ult === 'agora', 'sinal de 3 min continua dizendo "agora"', f.ult);
  reg(f.frio === false, 'cartao fresco NAO esfria', String(f.frio));
  reg(f.noAgora === true, 'e continua na faixa AGORA', String(f.noAgora));
  reg(f.animBon !== 'none' && f.animBon !== '(ausente)', 'e o boneco dele se mexe', f.animBon);
  reg(f.animBraco !== 'none' && f.animBraco !== '(ausente)', 'e o braco dele martela', f.animBraco);

  reg(/^última:/.test(p.ult), 'quem esta em espera continua com "ultima:"', p.ult);
  reg(p.frio === false, 'e nao esfria (frio e so para quem se diz trabalhando)', String(p.frio));
}

// ====================== AS CENAS DE QUEDA ======================
// Cartao fresco na tela, o servidor para de servir dado util, o relogio anda 3 h. O painel tem
// de esfriar sozinho, sem nunca mais receber uma linha. Dois modos, porque sao dois caminhos:
// '503' (o `corpo()` rejeita) e 'vazio' (200 OK com [] — o `corpo()` resolve, e so a repintura
// por relogio salva). O segundo nao tinha cena e o QA achou.
async function cenaQueda(nav, html, modo) {
  const p = await abrir(nav, html, [agente('fresco', 'trabalhando', 1)]);
  const antes = await p.pag.evaluate(LEITURA);
  p.estado.queda = modo;
  await p.pag.evaluate(() => { window.__DESVIO = 3 * 3600 * 1000; });
  await p.pag.waitForFunction(() => {
    const c = document.querySelector('.ag .ult');
    return !!c && c.textContent.indexOf('agora') < 0;
  }, null, { timeout: 30000 }).catch(() => { /* a asserção reprova com o texto visto */ });
  const depois = await p.pag.evaluate(LEITURA);
  const rodape = await p.pag.evaluate(() => (document.getElementById('quando') || {}).textContent || '');
  await p.ctx.close();
  return { antes: antes['fresco'] || {}, depois: depois['fresco'] || {}, rodape };
}

// ====================== O QUE CADA MUTANTE TEM DE DERRUBAR ======================
// Exigir que o bloco "acuse alguma coisa" NAO protege asserção nenhuma: o QA matou quatro e o
// portao seguiu verde porque outras acusavam no lugar. Entao o controle cobra o CONJUNTO EXATO.
// Matar uma asserção a tira desta lista e reprova; uma asserção nova que tambem pegue o mutante
// obriga a atualizar a lista aqui, de proposito — quem escreve fica sabendo o que ela cobre.
// Rode `PAINEL_DUMP=1 node test/painel-sem-sinal.js` para ver o conjunto medido de cada um.
const ESPERADO = {
  'M1 rotulo antigo': [
    "sinal de 315 min NAO diz \"agora\"  (o defeito de 01/09)",
    "e diz \"sem sinal ...\"",
    "com a idade dentro (5h)",
    "sem ativo_em nao vira \"agora\" — nao saber != ser recente",
    "logo acima do teto ja e \"sem sinal\"",
    "carimbo 10 dias no FUTURO nao diz \"agora\"",
    "e diz \"sem sinal — carimbo no futuro\"",
  ],
  'M2 sem a classe frio': [
    "e o cartao esfria",
    "e o CORPO para (animacao na tela, nao a classe)",
    "e o BRACO para — e ele que le como \"esta trabalhando\"",
    "e a FAISCA apaga",
    "e o cartao sem data esfria",
    "e esfria: sinal em que nao se pode acreditar e \"nao sei\"",
  ],
  'M3a corpo continua balancando': [
    "e o CORPO para (animacao na tela, nao a classe)",
  ],
  'M3b braco continua martelando': [
    "e o BRACO para — e ele que le como \"esta trabalhando\"",
  ],
  'M3c faisca continua saltando': [
    "e a FAISCA apaga",
  ],
  'M4 frio sobe para a faixa AGORA': [
    "e sai da faixa AGORA — posicao tambem afirma",
    "e nao fica na faixa AGORA",
  ],
  'M7 estado sempre "trabalhando"': [
    "e o rotulo de estado deixa de dizer \"trabalhando\"",
  ],
  'M8 esfria demais (idade 60x)': [
    "sinal de 3 min continua dizendo \"agora\"",
    "cartao fresco NAO esfria",
    "e continua na faixa AGORA",
    "e o boneco dele se mexe",
    "e o braco dele martela",
  ],
  'M9 frio vaza para quem esta em espera': [
    "e nao esfria (frio e so para quem se diz trabalhando)",
  ],
  'M10 espera perde o "ultima:"': [
    "quem esta em espera continua com \"ultima:\"",
  ],
};

(async () => {
  const fonte = fs.readFileSync(HTML, 'utf8');
  const teto = tetoDaPagina(fonte);

  const nav = await chromium.launch();
  try {
    console.log('[1] O TETO E O DA PAGINA, e ele e o combinado');
    ok(teto === TETO_ACORDADO, 'SEM_SINAL_MIN da pagina e ' + TETO_ACORDADO + ' min', teto);

    console.log('\n[2] AS CENAS, contra a pagina de verdade');
    const r = await ler(nav, fonte, CENAS);
    ok(r.erros.length === 0, 'a pagina carrega sem erro de console', r.erros.join(' | '));
    conferir(r.vistos, ok);

    console.log('\n[3] O SERVIDOR MUDO — cartao fresco, e o relogio anda 3 h');
    for (const modo of ['503', 'vazio']) {
      const q = await cenaQueda(nav, fonte, modo);
      ok(q.antes.ult === 'agora', '[' + modo + '] no comeco ele diz "agora", como deve', q.antes.ult);
      ok(q.depois.ult !== 'agora', '[' + modo + '] depois de 3 h ele NAO diz mais "agora"', q.depois.ult);
      ok(/^sem sinal/.test(q.depois.ult), '[' + modo + '] e diz "sem sinal ..."', q.depois.ult);
      ok(q.depois.animBon === 'none' && q.depois.animBraco === 'none',
        '[' + modo + '] e corpo e braco pararam', q.depois.animBon + '/' + q.depois.animBraco);
      if (modo === '503') ok(!/ao vivo/.test(q.rodape), '[503] e o rodape nao diz mais "ao vivo"', q.rodape);
    }

    console.log('\n[4] OS CONTROLES — cada mutante derruba EXATAMENTE o que e dele (2.8)');
    for (const m of mutantes(fonte)) {
      const rm = await ler(nav, m.html, CENAS);
      const caiu = [];
      conferir(rm.vistos, (cond, msg) => { if (!cond) caiu.push(msg); });
      if (DUMP) { console.log('  >> ' + m.nome + ' => ' + JSON.stringify(caiu, null, 1)); continue; }
      const esp = ESPERADO[m.nome] || [];
      const faltou = esp.filter(e => caiu.indexOf(e) < 0);
      const sobrou = caiu.filter(x => esp.indexOf(x) < 0);
      ok(esp.length > 0 && !faltou.length && !sobrou.length,
        'CONTROLE ' + m.nome + ' — derruba exatamente as ' + esp.length + ' asserções dele',
        !esp.length ? 'sem conjunto declarado'
          : (faltou.length ? 'NAO derrubou: ' + faltou.join(' | ')
            : 'derrubou a mais: ' + sobrou.join(' | ')));
    }
    if (!DUMP) {
      const q5 = await cenaQueda(nav, semRepintura(fonte), 'vazio');
      ok(q5.depois.ult === 'agora',
        'CONTROLE M5 sem repintura por relogio — o cartao fica preso em "agora"', q5.depois.ult);
      const q6 = await cenaQueda(nav, semDistinguirVazio(fonte), '503');
      ok(/ao vivo/.test(q6.rodape),
        'CONTROLE M6 falha virando lista vazia — o rodape volta a carimbar "ao vivo"', q6.rodape);
    }
  } finally {
    await nav.close();
  }

  if (DUMP) { console.log('\n(DUMP — nada foi julgado)'); process.exit(0); }
  console.log(falhas === 0 ? '\nPAINEL HONESTO: ok' : '\nPAINEL MENTE: ' + falhas + ' falha(s)');
  process.exit(falhas === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
