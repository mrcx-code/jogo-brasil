// test/painel-sem-sinal.js — O PAINEL NAO PODE DIZER "AGORA" SOBRE UM CARTAO SEM SINAL.
//
// POR QUE EXISTE, com a data e o numero. Em 01/09, as 10h44, o dono olhou o dashboard e viu
// quatro cartoes na faixa AGORA — Claude, dev-plataforma, historiador, dev-dados — todos
// dizendo "TRABALHANDO / agora", com bonequinho martelando. O ultimo sinal deles no
// `mesa_agente` tinha 315 minutos e era da rodada `nuvem-20260901T0823`, que ja tinha pousado.
// A rodada que estava REALMENTE no ar naquele momento (`nuvem-20260901T1340`, commit as 10h42)
// nunca tocou a mesa. O painel nao estava atrasado: ele estava AFIRMANDO uma coisa falsa com a
// confianca de quem sabe.
//
// A CAUSA era uma linha: `st==="trabalhando" ? "agora" : ...`. O status e a ultima coisa que
// ALGUEM ESCREVEU. Quem cai, quem estoura cota e quem esquece de pousar deixa a linha acesa
// para sempre — e um painel que confia no status sem olhar a idade do sinal nao tem como
// distinguir "trabalhando" de "morreu trabalhando". Sao estados diferentes, e a diferenca e
// justamente a que o dono usa para saber se precisa acordar alguem.
//
// A INVARIANTE: cartao que se diz `trabalhando` e cujo `ativo_em` tem mais de 45 min nao pode
// dizer "agora" — nem no texto, nem na animacao. Ele diz "sem sinal ha Xh" e o boneco para.
// `ativo_em` ausente e o caso pior e vira "sem sinal — sem data": nao saber a idade nao e o
// mesmo que ser recente.
//
// O CONTROLE (EQUIPE.md 2.8 — portao nunca visto reprovando e decoracao). Este arquivo monta
// uma COPIA da pagina com o comportamento ANTIGO restaurado (a linha de 01/09, com o ternario
// cru) e roda a cena da idade contra ela. Se a copia velha PASSAR, o portao nao presta, e este
// arquivo sai 1 dizendo isso — nao sai 0 em silencio.
//
// Nao precisa de login: os cartoes sao lidos com a chave publicavel, que e o que o painel usa
// para o quadro de agentes. Toda a rede e roteada; nada sai da maquina.
//
// Exit 0 = o painel diz a verdade sobre a idade do sinal. Exit 1 = ele mente, ou o controle
// nao mordeu. Exit 2 = o teste envelheceu (nao achou o alvo).

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..');
const HTML = process.env.PAINEL_HTML ? path.resolve(process.env.PAINEL_HTML)
  : path.join(RAIZ, 'dashboard', 'index.html');
const HOST = 'https://mesa.brasil.test';
const CAMINHO = '/dashboard/';
const SB = 'https://hdhqziqvrthxtgyraemk.supabase.co';
const TETO_MIN = 45;   // tem de bater com SEM_SINAL_MIN da pagina; a cena da borda cobra que bata

let falhas = 0;
function ok(cond, msg, extra) {
  if (cond) { console.log('  ok  ' + msg); return true; }
  falhas++;
  console.log('  FALHOU  ' + msg + (extra == null ? '' : '  <- ' + String(extra).slice(0, 200)));
  return false;
}
function parou(msg) { console.log('PAROU: ' + msg); process.exit(2); }

// ---------------------------------------------------------------- a linha antiga, restaurada
// A COPIA VELHA nao e "um html quebrado": e exatamente o codigo que estava na main ate hoje.
// Trocar a chamada nova pelo ternario cru reproduz o defeito de 01/09 e nada mais.
const LINHA_NOVA = 'card.querySelector(".ult").textContent = rotuloUltimo(st, item.ativo_em, Date.now());';
const LINHA_VELHA = 'card.querySelector(".ult").textContent = st==="trabalhando"?"agora":"' + 'última: ' + '"+desde(item.ativo_em);';

function copiaVelha(fonte) {
  if (fonte.indexOf(LINHA_NOVA) < 0) parou('nao achei a chamada de rotuloUltimo em ' + HTML + ' — o teste envelheceu');
  // tira tambem o esfriamento do cartao: senao o controle passaria pela animacao, e o que se
  // quer provar aqui e que a asserção do TEXTO morde.
  return fonte.replace(LINHA_NOVA, LINHA_VELHA)
    .replace(/card\.classList\.toggle\("frio",[^;]+;/, '');
}

// ---------------------------------------------------------------------------------- o palco
function agente(nome, status, minutosAtras) {
  return {
    nome, papel: 'papel de teste', cor: '#7d8479', status,
    atividade: 'atividade de teste', ordem: 1, squad: null,
    ativo_em: minutosAtras === null ? null
      : new Date(Date.now() - minutosAtras * 60000).toISOString(),
  };
}

async function ler(nav, html, linhas) {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push('pageerror: ' + e.message));
  pag.on('console', m => {
    if (m.type() !== 'error') return;
    if (/^Failed to load resource/.test(m.text())) return;
    erros.push(m.text());
  });
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
    const corpo = url.indexOf('/rest/v1/mesa_agente') >= 0 ? JSON.stringify(linhas) : '[]';
    return rota.fulfill({ status: 200, contentType: 'application/json', body: corpo });
  });
  await pag.goto(HOST + CAMINHO, { waitUntil: 'domcontentloaded' });
  // Espera os cartoes EXISTIREM — nao um sleep: o quadro so aparece depois do fetch roteado.
  await pag.waitForFunction(n => document.querySelectorAll('.ag').length >= n, linhas.length, { timeout: 15000 })
    .catch(() => { /* a contagem abaixo reprova com nome, que diz mais que um timeout */ });
  const vistos = await pag.evaluate(() => {
    const out = {};
    document.querySelectorAll('.ag').forEach(c => {
      const n = c.querySelector('.nome');
      if (!n) return;
      out[n.textContent.trim()] = {
        ult: (c.querySelector('.ult') || {}).textContent || '',
        st: (c.querySelector('.st') || {}).textContent || '',
        frio: c.classList.contains('frio'),
        // A POSICAO tambem afirma: a faixa AGORA responde "tem gente trabalhando neste
        // instante?". Cartao sem sinal la dentro e a mesma mentira, em posicao em vez de texto.
        noAgora: !!(c.closest('.grupo-ag') && c.closest('.grupo-ag').classList.contains('agora')),
      };
    });
    return out;
  });
  await ctx.close();
  return { vistos, erros };
}

(async () => {
  const fonte = fs.readFileSync(HTML, 'utf8');
  const velha = copiaVelha(fonte);

  const nav = await chromium.launch();
  try {
    // ======================= as cenas, contra a pagina de verdade =======================
    const linhas = [
      agente('fresco', 'trabalhando', 3),
      agente('congelado', 'trabalhando', 315),      // o caso real de 01/09
      agente('sem-data', 'trabalhando', null),
      agente('parado', 'espera', 2880),
      agente('na-borda', 'trabalhando', TETO_MIN + 5),
      // O FUTURO (achado do porteiro, 01/09): com o clamp em zero que a primeira versao tinha,
      // dez dias adiante viravam idade 0 e o cartao voltava a dizer "agora", martelando. Duas
      // maquinas do plantao com relogio dessincronizado bastam.
      agente('futuro', 'trabalhando', -60 * 24 * 10),
    ];
    const r = await ler(nav, fonte, linhas);
    const vistos = r.vistos;
    ok(r.erros.length === 0, 'a pagina carrega sem erro de console', r.erros.join(' | '));
    ok(Object.keys(vistos).length >= linhas.length, 'os ' + linhas.length + ' cartoes renderizaram',
      Object.keys(vistos).join(','));

    const f = vistos['fresco'] || {}, c = vistos['congelado'] || {},
      s = vistos['sem-data'] || {}, p = vistos['parado'] || {}, b = vistos['na-borda'] || {};

    ok(f.ult === 'agora', 'sinal de 3 min continua dizendo "agora"', f.ult);
    ok(f.frio === false, 'cartao fresco NAO esfria', String(f.frio));

    ok(c.ult !== 'agora', 'sinal de 315 min NAO diz "agora"  (o defeito de 01/09)', c.ult);
    ok(/^sem sinal/.test(c.ult), 'e diz "sem sinal ..."', c.ult);
    ok(/5h/.test(c.ult), 'com a idade dentro (5h)', c.ult);
    ok(c.frio === true, 'e o cartao congelado esfria (o boneco para)', String(c.frio));
    ok(c.noAgora === false, 'e SAI da faixa AGORA — posicao tambem afirma', String(c.noAgora));
    ok(/sem sinal/.test(c.st), 'e o proprio rotulo de estado deixa de dizer "trabalhando"', c.st);
    ok(f.noAgora === true, 'enquanto o cartao fresco CONTINUA na faixa AGORA', String(f.noAgora));

    ok(/^sem sinal/.test(s.ult), 'sem ativo_em nao vira "agora" — nao saber != ser recente', s.ult);
    ok(s.frio === true, 'e o cartao sem data esfria', String(s.frio));

    ok(/^última:/.test(p.ult), 'quem esta em espera continua com "ultima:"', p.ult);
    ok(p.frio === false, 'e nao esfria (frio e so para quem se diz trabalhando)', String(p.frio));

    ok(/^sem sinal/.test(b.ult), 'logo acima do teto de ' + TETO_MIN + ' min ja e "sem sinal"', b.ult);

    const fu = vistos['futuro'] || {};
    ok(fu.ult !== 'agora', 'carimbo 10 dias no FUTURO nao diz "agora"  (achado do porteiro)', fu.ult);
    ok(/^sem sinal/.test(fu.ult), 'e diz "sem sinal — carimbo no futuro"', fu.ult);
    ok(fu.frio === true, 'e esfria: sinal em que nao se pode acreditar e "nao sei"', String(fu.frio));
    ok(fu.noAgora === false, 'e nao fica na faixa AGORA', String(fu.noAgora));

    // ============================== O CONTROLE ==============================
    // A copia com a linha de ontem TEM de dizer "agora" no cartao de 315 min. Se ela nao disser,
    // a asserção acima passaria de graca — e o portao seria decoracao.
    const alvo = await ler(nav, velha, [agente('congelado', 'trabalhando', 315)]);
    const dito = (alvo.vistos['congelado'] || {}).ult;
    ok(dito === 'agora',
      'CONTROLE: a versao antiga reprova (ela diz "agora" com 315 min de idade)', dito);
  } finally {
    await nav.close();
  }

  console.log(falhas === 0 ? '\nPAINEL HONESTO: ok' : '\nPAINEL MENTE: ' + falhas + ' falha(s)');
  process.exit(falhas === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
