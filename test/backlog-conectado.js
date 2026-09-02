// test/backlog-conectado.js — A FILA TENTA DE NOVO SOZINHA, E NUNCA APAGA O QUE JA E VERDADE.
//
// POR QUE EXISTE, com a data. Em 02/09 o dono abriu "Acionar arte" no painel e viu "Não consegui
// ler a fila (backlog.json) — Só o caminho aberto abaixo." A reação dele foi direta: *"deve ler o
// nosso backlog e sempre estarem conectados, não faz sentido esse trabalhar no que for mais
// valioso agora"*.
//
// A CAUSA, achada lendo o proprio codigo: `carregarBacklog()` rodava UMA VEZ no load, sem teto e
// sem AbortController. Um `qa-caminhos-sonda.js` de 24/08 ja tinha medido as duas metades do
// defeito e so imprimia (nao e portao de CI): um fetch que FALHA deixa "nao consegui ler" ate a
// pessoa recarregar a pagina a mao; um fetch que PENDURA (proxy, portal cativo) deixa "carregando"
// para sempre, porque sem teto o retry nunca dispara — uma promessa pendurada nao falha, so nunca
// resolve.
//
// O CONSERTO: `agendarBacklog()` tenta de novo com espera crescente ate conseguir, e depois
// continua atualizando sozinha a cada 2 min. Cada tentativa tem TETO de 8 s via AbortController —
// sem ele o retry nunca teria chance de rodar contra um fetch pendurado.
//
// A PARTE QUE ESTE ARQUIVO EXISTE PARA TRAVAR, e que um conserto ingenuo quebraria facil: UMA
// FALHA DEPOIS DE JA TER FUNCIONADO NAO PODE APAGAR O QUE JA ESTA NA TELA. Se o refresh
// periodico simplesmente reusasse o catch antigo (que sempre escondia a secao e sempre podia
// derrubar o estado), um blip de rede 2 minutos depois de tudo certo apagaria uma fila que
// continuava verdadeira. O guardiao e a mesma regra que o painel de agentes aprendeu com o
// servidor mudo em 01/09: "nao chegou dado" e "chegou dado vazio" sao coisas diferentes, e
// nenhum dos dois apaga um estado bom anterior.
//
// COMO ESTE ARQUIVO MEDE O TEMPO: `page.clock` (Playwright >= 1.45) substitui os timers da
// pagina por timers falsos. Usa `runFor`, nao `fastForward`: medido nesta versao do Playwright,
// `fastForward` pula direto para o alvo e so dispara os timers que JA estavam agendados na
// hora da chamada — um timer novo, agendado como EFEITO de outro que disparou durante o pulo
// (exatamente o caso de agendarBacklog reagendando a si mesmo), fica para tras. `runFor` avanca
// em passos e processa essas cascatas, que e o que um retry encadeado precisa.
//
// O CONTROLE (EQUIPE.md 2.8): a copia com o comportamento ANTIGO restaurado (sem teto, sem
// guarda) TEM de reprovar nas mesmas cenas. Se ela passar, o portao nao prova nada.
//
// Exit 0 = a fila fica conectada e nunca apaga o que ja e verdade. Exit 1 = ela mente, ou o
// controle nao mordeu. Exit 2 = o teste envelheceu.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');

const RAIZ = path.resolve(__dirname, '..');
const HTML_PATH = path.join(RAIZ, 'dashboard', 'index.html');
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

// ---------------------------------------------------------------- a copia antiga, restaurada
// NAO reconstroi o defeito por fora: extrai a funcao NOVA do arquivo de verdade e a troca pela
// forma antiga, documentada aqui por extenso — a mesma tecnica de painel-sem-sinal.js. Se a
// funcao nova mudar de nome ou desaparecer, o teste envelhece em vez de mentir.
const CHAMADA_NOVA = 'agendarBacklog();';
const CHAMADA_VELHA = 'carregarBacklog();';
function mutanteAntigo(fonte) {
  const iniFn = fonte.indexOf('function carregarBacklog(){');
  const iniChamada = fonte.indexOf(CHAMADA_NOVA);
  if (iniFn < 0 || iniChamada < 0) parou('nao achei carregarBacklog/agendarBacklog — o teste envelheceu');
  // acha o fim da funcao carregarBacklog por balanco de chaves (nunca "proximo } na coluna 0" —
  // a armadilha nomeada no CLAUDE.md §7).
  let prof = 0, i = fonte.indexOf('{', iniFn), fim = -1;
  for (let k = i; k < fonte.length; k++) {
    if (fonte[k] === '{') prof++;
    else if (fonte[k] === '}') { prof--; if (prof === 0) { fim = k + 1; break; } }
  }
  if (fim < 0) parou('nao fechei as chaves de carregarBacklog — o teste envelheceu');
  const FN_VELHA = `function carregarBacklog(){
    return fetch("backlog.json",{headers:{}}).then(function(r){
      if(!r.ok) throw 0;
      return r.json();
    }).then(function(j){
      if(!j || !Array.isArray(j.itens)) throw 0;
      var itens=j.itens;
      backlogPorAgente=indexarBacklog(itens); backlogTravas=indexarTravas(itens); backlogEstado="ok";
      var abertos=itens.filter(function(it){ return it && it.estado!=="concluido"; });
      if(!abertos.length) throw 0;
      var cont=document.getElementById("lista-backlog"); cont.innerHTML="";
      abertos.forEach(function(it){
        var el=document.createElement("div"); el.className="bl-item";
        el.innerHTML='<div class="bl-tit">'+escH(it.titulo||it.id||"-")+'</div>';
        cont.appendChild(el);
      });
      document.getElementById("backlog").hidden=false;
      document.getElementById("vazio-backlog").hidden=true;
    }).catch(function(){
      backlogEstado="falhou";
      document.getElementById("backlog").hidden=true;
    });
  }`;
  let f = fonte.slice(0, iniFn) + FN_VELHA + fonte.slice(fim);
  f = f.replace(CHAMADA_NOVA, CHAMADA_VELHA);
  return f;
}

// ---------------------------------------------------------------------------------- o palco
function agente(nome, papel) {
  return { nome, papel, cor: '#7d8479', status: 'espera', atividade: '', ativo_em: new Date().toISOString(), ordem: 1 };
}
const ITEM_LIVRE = { id: 'item-de-teste', titulo: 'Item de teste da fila', agente: 'arte', estado: 'livre' };

async function abrir(nav, html, opts) {
  opts = opts || {};
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  const pag = await ctx.newPage();
  await pag.clock.install({ time: Date.now() });
  const erros = [];
  pag.on('pageerror', e => erros.push('pageerror: ' + e.message));
  const estado = { backlog: opts.backlogInicial || { itens: [] }, pendura: !!opts.pendura, pedidos: 0 };
  await pag.route(HOST + '/**', r => {
    const p = new URL(r.request().url()).pathname;
    if (p === CAMINHO || p === CAMINHO + 'index.html')
      return r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
    if (p === CAMINHO + 'backlog.json') {
      estado.pedidos++;
      if (estado.pendura) return; // nunca resolve — e o cenario do fetch pendurado
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(estado.backlog) });
    }
    return r.fulfill({ status: 404, contentType: 'text/plain', body: '404' });
  });
  await pag.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await pag.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 200, body: '' }));
  await pag.route(SB + '/**', r => r.fulfill({
    status: 200, contentType: 'application/json',
    body: r.request().url().indexOf('/rest/v1/mesa_agente') >= 0 ? JSON.stringify(opts.agentes || []) : '[]',
  }));
  await pag.goto(HOST + CAMINHO, { waitUntil: 'domcontentloaded' });
  return { ctx, pag, estado, erros };
}

async function esperarCard(pag, nome) {
  // o cartao so existe depois que o primeiro ciclo de carregar() monta os agentes — clicar
  // antes disso e testar o harness, nao o produto.
  await pag.waitForFunction((nome) => {
    const cards = [...document.querySelectorAll('.ag')];
    const card = cards.find(c => (c.querySelector('.nome') || {}).textContent === nome);
    return !!(card && card.querySelector('.acionar'));
  }, nome, { timeout: 15000 });
}

async function modalDe(pag, nome) {
  // localiza o botao "Acionar" do cartao com este nome e le o texto do modal depois de clicar.
  return pag.evaluate((nome) => {
    const cards = [...document.querySelectorAll('.ag')];
    const card = cards.find(c => (c.querySelector('.nome') || {}).textContent === nome);
    if (!card) return { achou: false };
    const btn = card.querySelector('.acionar');
    if (!btn) return { achou: true, semBotao: true };
    btn.click();
    return { achou: true, sub: (document.getElementById('modal-sub') || {}).textContent || '' };
  }, nome);
}

async function backlogVisivel(pag) {
  return pag.evaluate(() => ({
    escondido: document.getElementById('backlog').hidden,
    itens: [...document.querySelectorAll('#lista-backlog .bl-item .bl-tit')].map(e => e.textContent),
  }));
}

(async () => {
  const fonte = fs.readFileSync(HTML_PATH, 'utf8');
  const velha = mutanteAntigo(fonte);
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  try {
    console.log('[1] O FETCH PENDURADO NAO TRAVA "carregando" PARA SEMPRE');
    {
      const p = await abrir(nav, fonte, { pendura: true, agentes: [agente('arte', 'direção de arte')] });
      await esperarCard(p.pag, 'arte');
      const cedo = await modalDe(p.pag, 'arte');
      ok(/Ainda estou lendo/.test(cedo.sub || ''), 'no comeco, "ainda estou lendo"', cedo.sub);
      await p.pag.evaluate(() => document.getElementById('modal-cancelar').click());
      // 8 s de teto + 4 s da primeira espera de retry + folga: a SEGUNDA tentativa so e
      // agendada DEPOIS que a primeira aborta, entao 9 s nao bastam — foi o que a primeira
      // versao deste teste mediu errado.
      await p.pag.clock.runFor('00:14');
      const depois = await modalDe(p.pag, 'arte');
      ok(!/Ainda estou lendo/.test(depois.sub || ''), 'depois do teto, NAO fica preso em "ainda estou lendo"', depois.sub);
      ok(/Não consegui ler|continuo tentando/.test(depois.sub || ''), 'e diz que nao conseguiu e que continua tentando', depois.sub);
      ok(p.estado.pedidos >= 2, 'e ISTO PROVA o retry: mais de uma tentativa de fetch em 14 s', p.estado.pedidos);
      ok(p.erros.length === 0, 'zero erro de console', p.erros.join(' | '));
      await p.ctx.close();
    }

    console.log('\n[2] SUCESSO, DEPOIS FALHA DE REFRESH: A FILA JA MOSTRADA NAO SOME');
    let resultadoCena2 = null;
    {
      const p = await abrir(nav, fonte, {
        backlogInicial: { itens: [ITEM_LIVRE] },
        agentes: [agente('arte', 'direção de arte')],
      });
      await esperarCard(p.pag, 'arte');
      await p.pag.waitForFunction(() => !document.getElementById('backlog').hidden, null, { timeout: 15000 })
        .catch(() => {});
      const antes = await backlogVisivel(p.pag);
      ok(antes.escondido === false, 'a fila carregou e a secao apareceu', JSON.stringify(antes));
      ok(antes.itens.indexOf('Item de teste da fila') >= 0, 'com o item real dentro', antes.itens.join(','));
      const m1 = await modalDe(p.pag, 'arte');
      ok(/Da fila oficial/.test(m1.sub || ''), 'e o Acionar oferece a fila oficial', m1.sub);
      await p.pag.evaluate(() => document.getElementById('modal-cancelar').click());

      // agora o servidor comeca a pendurar TODA resposta futura — simula o deploy no meio ou o
      // blip de rede que a rodada seguinte de fetch encontra.
      p.estado.pendura = true;
      await p.pag.clock.runFor('02:10'); // passa do ciclo de sucesso (2 min) + o teto da tentativa

      const depois = await backlogVisivel(p.pag);
      resultadoCena2 = { antes, depois };
      ok(depois.escondido === false, 'a secao CONTINUA visivel depois da falha de refresh', JSON.stringify(depois));
      ok(depois.itens.indexOf('Item de teste da fila') >= 0, 'com o MESMO item — nada foi apagado', depois.itens.join(','));
      const m2 = await modalDe(p.pag, 'arte');
      ok(/Da fila oficial/.test(m2.sub || ''), 'e o Acionar continua oferecendo a fila real, nao "nao consegui ler"', m2.sub);
      ok(p.erros.length === 0, 'zero erro de console', p.erros.join(' | '));
      await p.ctx.close();
    }

    console.log('\n[3] FILA VAZIA (tudo concluido) NAO E "NAO CONSEGUI LER"');
    {
      const p = await abrir(nav, fonte, {
        backlogInicial: { itens: [{ id: 'x', titulo: 'feito', agente: 'arte', estado: 'concluido' }] },
        agentes: [agente('arte', 'direção de arte')],
      });
      await p.pag.waitForTimeout(700);
      const m = await modalDe(p.pag, 'arte');
      ok(/Nada livre para/.test(m.sub || ''), 'o Acionar diz que nao ha item livre — nao que a fila falhou', m.sub);
      ok(!/Não consegui ler/.test(m.sub || ''), 'e nao confunde "vazia de verdade" com "nao consegui ler"', m.sub);
      ok(p.erros.length === 0, 'zero erro de console', p.erros.join(' | '));
      await p.ctx.close();
    }

    console.log('\n[4] O CONTROLE — a versao ANTIGA reprova nas mesmas cenas (2.8)');
    {
      const p = await abrir(nav, velha, { pendura: true, agentes: [agente('arte', 'direção de arte')] });
      await esperarCard(p.pag, 'arte');
      await p.pag.clock.runFor('00:14');
      const m = await modalDe(p.pag, 'arte');
      ok(/Ainda estou lendo|Se isto nao mudar/.test(m.sub || ''),
        'CONTROLE cena 1: a copia antiga FICA PRESA em "carregando" (prova que o teto e o retry sao o que resolve)', m.sub);
      ok(p.estado.pedidos === 1, 'CONTROLE: e fez UMA UNICA tentativa em 9 s (sem retry nenhum)', p.estado.pedidos);
      await p.ctx.close();
    }
    {
      // Sem `agendarBacklog`, nao existe NADA que dispare uma segunda busca — nem em falha, nem
      // em sucesso. Isto prova a metade que a cena 2 principal nao consegue provar sozinha: a
      // versao antiga nao teria como voltar a se conectar mesmo que a rede voltasse.
      const p = await abrir(nav, velha, {
        backlogInicial: { itens: [ITEM_LIVRE] },
        agentes: [agente('arte', 'direção de arte')],
      });
      await esperarCard(p.pag, 'arte');
      await p.pag.waitForFunction(() => !document.getElementById('backlog').hidden, null, { timeout: 15000 })
        .catch(() => {});
      await p.pag.clock.runFor('10:00'); // dez minutos: bem alem do ciclo de 2 min do conserto
      ok(p.estado.pedidos === 1, 'CONTROLE cena 2: sem agendarBacklog, dez minutos depois AINDA e um pedido so', p.estado.pedidos);
      await p.ctx.close();
    }
  } finally {
    await nav.close();
  }

  console.log(falhas === 0 ? '\nFILA CONECTADA: ok' : '\nFILA MENTE OU SOME: ' + falhas + ' falha(s)');
  process.exit(falhas === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
