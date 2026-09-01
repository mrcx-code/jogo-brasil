// test/painel-sem-sinal.js — O PAINEL NAO PODE AFIRMAR "AGORA" QUANDO NAO SABE.
//
// POR QUE EXISTE, com a data e o numero. Em 01/09, as 10h44, o dono olhou o dashboard e viu
// quatro cartoes na faixa AGORA — Claude, dev-plataforma, historiador, dev-dados — todos
// dizendo "TRABALHANDO / agora", com bonequinho martelando. O ultimo sinal deles no
// `mesa_agente` tinha 315 minutos e era da rodada `nuvem-20260901T0823`, que ja tinha pousado.
// A rodada que estava REALMENTE no ar naquele momento (`nuvem-20260901T1340`, commit as 10h42)
// nunca tocou a mesa. O painel nao estava atrasado: ele estava AFIRMANDO com a confianca de
// quem sabe. As palavras do dono foram "nao faz sentido manter algo q nunca vai mostrar a
// realidade" — e ele tinha razao sobre o painel de entao.
//
// SAO DUAS DOENCAS DA MESMA FAMILIA, e este arquivo cobra as duas:
//
//   (A) CHEGOU DADO VELHO. `st==="trabalhando" ? "agora" : ...` — o status e a ultima coisa que
//       ALGUEM ESCREVEU. Quem cai, quem estoura cota e quem esquece de pousar deixa a linha
//       acesa para sempre. Sem olhar a IDADE do sinal nao ha como separar "trabalhando" de
//       "morreu trabalhando", e essa e justamente a diferenca que decide se o dono precisa
//       acordar alguem.
//
//   (B) PAROU DE CHEGAR DADO — achado do QA no mesmo dia, e o mais caro dos dois porque nao
//       aparece na tabela. `r.ok ? r.json() : []` fazia 401 (token vencido numa aba velha) e
//       503 virarem LISTA VAZIA: nenhum cartao reescrito, `Promise.all` RESOLVENDO, e o rodape
//       imprimindo "ao vivo · <hora de agora>" por cima do estado de horas atras. Medido pelo
//       QA: 503, 401, fetch abortado e 200-com-[] davam os quatro "agora" depois de 3 h.
//
// A INVARIANTE, uma so, que cobre as duas: O PAINEL SO DIZ "AGORA" QUANDO TEM SINAL RECENTE NA
// MAO. Sinal com mais de 45 min, sinal ausente, sinal com carimbo no FUTURO (relogio
// dessincronizado entre maquinas do plantao) e servidor que parou de responder — os quatro
// viram "sem sinal", o cartao esfria, o boneco PARA de fato (a animacao na tela, nao so a
// classe) e ele sai da faixa AGORA, porque posicao tambem afirma.
//
// O CONTROLE (EQUIPE.md 2.8 — portao nunca visto reprovando e decoracao). A primeira versao
// deste arquivo trazia um "controle" que o QA derrubou em uma linha: ele REPETIA a asserção
// contra a copia velha em vez de EXERCITA-LA, entao dava para matar as quatro asserções
// centrais e o teste continuava verde. Agora o bloco de asserções e UM SO (`conferir`) e roda
// duas vezes: contra a pagina de verdade, onde tem de dar ZERO falha, e contra copias
// MUTILADAS, onde cada uma tem de acusar pelo menos uma. Matar uma asserção quebra o controle
// dela junto — que e a unica forma de um controle valer alguma coisa.
//
// Nao precisa de login: os cartoes sao lidos com a chave publicavel. Toda a rede e roteada;
// nada sai da maquina. O relogio da pagina e deslocavel por `window.__DESVIO`, que e como a
// cena do servidor mudo envelhece 3 horas sem esperar 3 horas.
//
// Exit 0 = o painel diz a verdade. Exit 1 = ele mente, ou um controle nao mordeu. Exit 2 = o
// teste envelheceu (nao achou o alvo no arquivo).

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..');
const HTML = process.env.PAINEL_HTML ? path.resolve(process.env.PAINEL_HTML)
  : path.join(RAIZ, 'dashboard', 'index.html');
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
// Nao e copia manual: o QA mostrou que com o teto escrito AQUI dava para mudar o da pagina para
// 5, 20 ou 40 e o portao passava nos tres. O numero sai do arquivo medido, e o valor combinado
// e cobrado a parte — assim uma deriva do teto REPROVA em vez de passar em silencio.
const TETO_ACORDADO = 45;
function tetoDaPagina(fonte) {
  const m = fonte.match(/var\s+SEM_SINAL_MIN\s*=\s*(\d+)/);
  if (!m) parou('nao achei `var SEM_SINAL_MIN=<n>` em ' + HTML + ' — o teste envelheceu');
  return parseInt(m[1], 10);
}

// ====================== AS COPIAS MUTILADAS, uma por capacidade ======================
const LINHA_NOVA = 'card.querySelector(".ult").textContent = rotuloUltimo(st, item.ativo_em, Date.now());';
const LINHA_VELHA = 'card.querySelector(".ult").textContent = st==="trabalhando"?"agora":"'
  + 'última: ' + '"+desde(item.ativo_em);';

function mutantes(fonte) {
  const fora = [];
  // M1 · o rotulo volta ao ternario de 01/09 (o defeito original, exato)
  if (fonte.indexOf(LINHA_NOVA) < 0) {
    // A DIFERENCA IMPORTA: alvo ausente E ternario velho PRESENTE nao e "o teste envelheceu", e
    // REGRESSAO da pagina — sai 1, nao 2. O QA pegou isto: o exit 2 mandava consertar o teste
    // quando quem tinha regredido era o produto.
    if (fonte.indexOf(LINHA_VELHA) >= 0) {
      console.log('  FALHOU  a pagina VOLTOU ao rotulo antigo (ternario cru, sem idade)');
      falhas++;
    } else {
      parou('nao achei a chamada de rotuloUltimo em ' + HTML + ' — o teste envelheceu');
    }
  } else {
    fora.push({ nome: 'M1 rotulo antigo', html: fonte.replace(LINHA_NOVA, LINHA_VELHA) });
  }
  // M2 · a classe `frio` deixa de ser posta
  const reToggle = /card\.classList\.toggle\("frio",[^;]+;/;
  if (!reToggle.test(fonte)) parou('nao achei o toggle("frio") — o teste envelheceu');
  fora.push({ nome: 'M2 sem a classe frio', html: fonte.replace(reToggle, '') });
  // M3 · a classe continua, mas o CSS que PARA o boneco some. A versao anterior deste portao
  // passava neste mutante, porque lia `classList.contains` em vez da animacao na tela.
  const semCss = fonte.replace(/\.ag\.frio \.bon\{[^}]*\}/, '')
    .replace(/\.ag\.frio \.bon \.braco\{[^}]*\}/, '')
    .replace(/\.ag\.frio \.faisca\{[^}]*\}/, '');
  if (semCss === fonte) parou('nao achei as regras CSS de .ag.frio — o teste envelheceu');
  fora.push({ nome: 'M3 boneco continua martelando', html: semCss });
  // M4 · o cartao frio volta a subir para a faixa AGORA
  const reAlvo = /var alvo=\(st==="trabalhando" && !frio\)\?grupoAgora\(\):grupoDe\(item\.squad\);/;
  if (!reAlvo.test(fonte)) parou('nao achei a escolha de grupo — o teste envelheceu');
  fora.push({
    nome: 'M4 frio sobe para a faixa AGORA',
    html: fonte.replace(reAlvo, 'var alvo=(st==="trabalhando")?grupoAgora():grupoDe(item.squad);'),
  });
  // M7 · o rotulo de ESTADO volta a dizer sempre "trabalhando". Sem este mutante a asserção do
  // `.st` ficava sem controle nenhum — nenhum dos outros quatro a derruba.
  const reSt = /card\.querySelector\("\.st"\)\.textContent = frio\?"sem sinal"/;
  if (!reSt.test(fonte)) parou('nao achei o rotulo de estado — o teste envelheceu');
  fora.push({ nome: 'M7 estado sempre "trabalhando"',
    html: fonte.replace(reSt, 'card.querySelector(".st").textContent = false?"sem sinal"') });
  return fora;
}

// ====================== O QUE CADA MUTANTE TEM DE DERRUBAR ======================
// Exigir que o bloco "acuse alguma coisa" NAO protege asserção nenhuma: o QA matou as quatro
// asserções centrais e o portao continuou verde, porque outras acusavam no lugar delas. Entao o
// controle passa a cobrar o CONJUNTO EXATO. Matar uma asserção a tira desta lista e reprova;
// acrescentar uma que tambem pegue o mutante obriga a atualizar a lista aqui, de proposito —
// e quem escreve fica sabendo o que a asserção nova cobre de verdade.
const ESPERADO = {
  'M1 rotulo antigo': [
    'sinal de 315 min NAO diz "agora"  (o defeito de 01/09)',
    'e diz "sem sinal ..."',
    'com a idade dentro (5h)',
    'sem ativo_em nao vira "agora" — nao saber != ser recente',
    'logo acima do teto ja e "sem sinal"',
    'carimbo 10 dias no FUTURO nao diz "agora"',
    'e diz "sem sinal — carimbo no futuro"',
  ],
  'M2 sem a classe frio': [
    'e o cartao esfria',
    'e o boneco PARA de verdade (animacao na tela, nao a classe)',
    'e o cartao sem data esfria',
    'e esfria: sinal em que nao se pode acreditar e "nao sei"',
  ],
  'M3 boneco continua martelando': [
    'e o boneco PARA de verdade (animacao na tela, nao a classe)',
  ],
  'M4 frio sobe para a faixa AGORA': [
    'e sai da faixa AGORA — posicao tambem afirma',
    'e nao fica na faixa AGORA',
  ],
  'M7 estado sempre "trabalhando"': [
    'e o rotulo de estado deixa de dizer "trabalhando"',
  ],
};

// O SERVIDOR MUDO E CONSERTADO POR DUAS COISAS DIFERENTES, e por isso tem dois controles. A
// primeira versao deste arquivo tinha um so, e ele NAO mordia: a repintura por relogio sozinha
// ja esfriava o cartao, entao reverter o `corpo()` nao reproduzia o sintoma. Um controle que
// nao reproduz o defeito nao prova nada — e essa foi a mesma armadilha que o QA nomeou hoje.
//
//   M5 · sem a repintura por relogio: o cartao fica no rotulo do ultimo fetch que deu certo —
//        "agora" para sempre, com a rede fora do ar. E o sintoma que o dono viu.
function semRepintura(fonte) {
  if (fonte.indexOf('setInterval(repintarIdades, 20000);') < 0) parou('nao achei o intervalo de repintura — o teste envelheceu');
  return fonte.replace('setInterval(repintarIdades, 20000);', '')
    .replace(/\n\s*repintarIdades\(\);/, '');
}
//   M6 · com o `corpo()` revertido para o `r.ok?r.json():[]` de antes: a falha vira lista vazia,
//        o `Promise.all` RESOLVE, e o rodape carimba "ao vivo · <hora de agora>" por cima de
//        uma tela que nao recebeu nada. A mentira muda de lugar, do cartao para o rodape.
function semDistinguirVazio(fonte) {
  const re = /function corpo\(r\)\{[^}]*\}/;
  if (!re.test(fonte)) parou('nao achei function corpo(r) — o teste envelheceu');
  return fonte.replace(re, 'function corpo(r){ return r.ok?r.json():Promise.resolve([]); }');
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

// Le o estado de cada cartao NA TELA. `animBon` vem do `getComputedStyle` — nao do nome da
// classe: da para deixar o boneco martelando com a classe posta, e o QA provou isso.
const LEITURA = () => {
  const out = {};
  document.querySelectorAll('.ag').forEach(c => {
    const n = c.querySelector('.nome');
    if (!n) return;
    const bon = c.querySelector('.bon');
    out[n.textContent.trim()] = {
      ult: (c.querySelector('.ult') || {}).textContent || '',
      st: (c.querySelector('.st') || {}).textContent || '',
      frio: c.classList.contains('frio'),
      animBon: bon ? getComputedStyle(bon).animationName : '(sem boneco)',
      noAgora: !!(c.closest('.grupo-ag') && c.closest('.grupo-ag').classList.contains('agora')),
    };
  });
  return out;
};

async function abrir(nav, html, linhas) {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  // O RELOGIO DESLOCAVEL: a cena do servidor mudo precisa de 3 horas de idade sem esperar 3
  // horas. Nao e mock de Date inteiro — so um desvio somado, que a propria pagina enxerga.
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
    if (estado.queda) return rota.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"fora do ar"}' });
    const url = rota.request().url();
    const corpo = url.indexOf('/rest/v1/mesa_agente') >= 0 ? JSON.stringify(linhas) : '[]';
    return rota.fulfill({ status: 200, contentType: 'application/json', body: corpo });
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

  reg(Object.keys(v).length >= CENAS.length, 'os ' + CENAS.length + ' cartoes renderizaram', Object.keys(v).join(','));

  reg(f.ult === 'agora', 'sinal de 3 min continua dizendo "agora"', f.ult);
  reg(f.frio === false, 'cartao fresco NAO esfria', String(f.frio));
  reg(f.noAgora === true, 'e continua na faixa AGORA', String(f.noAgora));
  reg(f.animBon !== 'none' && f.animBon !== '(sem boneco)', 'e o boneco dele se mexe', f.animBon);

  reg(c.ult !== 'agora', 'sinal de 315 min NAO diz "agora"  (o defeito de 01/09)', c.ult);
  reg(/^sem sinal/.test(c.ult), 'e diz "sem sinal ..."', c.ult);
  reg(/5h/.test(c.ult), 'com a idade dentro (5h)', c.ult);
  reg(c.frio === true, 'e o cartao esfria', String(c.frio));
  reg(c.animBon === 'none', 'e o boneco PARA de verdade (animacao na tela, nao a classe)', c.animBon);
  reg(c.noAgora === false, 'e sai da faixa AGORA — posicao tambem afirma', String(c.noAgora));
  reg(/sem sinal/.test(c.st), 'e o rotulo de estado deixa de dizer "trabalhando"', c.st);

  reg(/^sem sinal/.test(s.ult), 'sem ativo_em nao vira "agora" — nao saber != ser recente', s.ult);
  reg(s.frio === true, 'e o cartao sem data esfria', String(s.frio));

  reg(/^última:/.test(p.ult), 'quem esta em espera continua com "ultima:"', p.ult);
  reg(p.frio === false, 'e nao esfria (frio e so para quem se diz trabalhando)', String(p.frio));

  reg(/^sem sinal/.test(b.ult), 'logo acima do teto ja e "sem sinal"', b.ult);

  reg(fu.ult !== 'agora', 'carimbo 10 dias no FUTURO nao diz "agora"', fu.ult);
  reg(/^sem sinal/.test(fu.ult), 'e diz "sem sinal — carimbo no futuro"', fu.ult);
  reg(fu.frio === true, 'e esfria: sinal em que nao se pode acreditar e "nao sei"', String(fu.frio));
  reg(fu.noAgora === false, 'e nao fica na faixa AGORA', String(fu.noAgora));
}

// ====================== A CENA DO SERVIDOR MUDO ======================
// Cartao fresco na tela, servidor CAI, o relogio anda 3 h. O painel tem de esfriar sozinho, sem
// nunca mais receber uma linha.
async function cenaQueda(nav, html) {
  const p = await abrir(nav, html, [agente('fresco', 'trabalhando', 1)]);
  const antes = await p.pag.evaluate(LEITURA);
  p.estado.queda = true;                                   // 503 daqui para a frente
  await p.pag.evaluate(() => { window.__DESVIO = 3 * 3600 * 1000; });
  // Espera o painel NOTAR sozinho — nao um sleep cego: a recarga e de 7 s e a repintura de 20 s;
  // o que se cobra e que um dos dois chegue ate o cartao.
  await p.pag.waitForFunction(() => {
    const c = document.querySelector('.ag .ult');
    return !!c && c.textContent.indexOf('agora') < 0;
  }, null, { timeout: 30000 }).catch(() => { /* a asserção abaixo reprova com o texto visto */ });
  const depois = await p.pag.evaluate(LEITURA);
  const rodape = await p.pag.evaluate(() => (document.getElementById('quando') || {}).textContent || '');
  await p.ctx.close();
  return { antes: antes['fresco'] || {}, depois: depois['fresco'] || {}, rodape };
}

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

    console.log('\n[3] O SERVIDOR MUDO — cartao fresco, 503, e o relogio anda 3 h');
    const q = await cenaQueda(nav, fonte);
    ok(q.antes.ult === 'agora', 'no comeco ele diz "agora", como deve', q.antes.ult);
    ok(q.depois.ult !== 'agora', 'depois de 3 h sem resposta ele NAO diz mais "agora"', q.depois.ult);
    ok(/^sem sinal/.test(q.depois.ult), 'e diz "sem sinal ..."', q.depois.ult);
    ok(q.depois.animBon === 'none', 'e o boneco parou', q.depois.animBon);
    ok(!/ao vivo/.test(q.rodape), 'e o rodape nao diz mais "ao vivo"', q.rodape);

    console.log('\n[4] OS CONTROLES — cada mutante tem de ACUSAR (2.8)');
    for (const m of mutantes(fonte)) {
      const rm = await ler(nav, m.html, CENAS);
      const caiu = [];
      conferir(rm.vistos, (cond, msg) => { if (!cond) caiu.push(msg); });
      const esp = ESPERADO[m.nome] || [];
      const faltou = esp.filter(e => caiu.indexOf(e) < 0);
      const sobrou = caiu.filter(x => esp.indexOf(x) < 0);
      ok(faltou.length === 0 && sobrou.length === 0,
        'CONTROLE ' + m.nome + ' — derruba exatamente as ' + esp.length + ' asserções dele',
        faltou.length ? 'NAO derrubou: ' + faltou.join(' | ')
          : (sobrou.length ? 'derrubou a mais: ' + sobrou.join(' | ') : ''));
    }
    const q5 = await cenaQueda(nav, semRepintura(fonte));
    ok(q5.depois.ult === 'agora',
      'CONTROLE M5 sem repintura por relogio — o cartao fica preso em "agora"', q5.depois.ult);
    const q6 = await cenaQueda(nav, semDistinguirVazio(fonte));
    ok(/ao vivo/.test(q6.rodape),
      'CONTROLE M6 falha virando lista vazia — o rodape volta a carimbar "ao vivo"', q6.rodape);
  } finally {
    await nav.close();
  }

  console.log(falhas === 0 ? '\nPAINEL HONESTO: ok' : '\nPAINEL MENTE: ' + falhas + ' falha(s)');
  process.exit(falhas === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
