// FILA-AUTH — o portao do login do dashboard, medido nos DOIS MUNDOS.
//
// Por que existe: a partir de 21/08 a fila `mesa_resposta` deixa de aceitar escrita anonima
// (ferramentas/fila-auth.sql). As politicas sao aplicadas no Supabase, fora daqui — entao a
// pagina tem de funcionar ANTES e DEPOIS de aplicarem, sem tocar em nada. Este instrumento
// exercita os dois mundos com o backend TODO simulado por `page.route`: nenhum pedido sai
// para o projeto de verdade, e nenhuma linha de teste entra na fila do dono.
//
// A PORTA VIROU UM PIN em 22/08 (decisao do dono: "o login do celular deve ser com um pin,
// simples mesmo... nao patinhas"). As cenas de OTP viraram cenas de PIN — nao ha mais e-mail
// a digitar, codigo a colar nem link magico a tocar, e por isso nao ha mais cena para eles.
//
// Ele reprova por EXIT CODE. Rode:  node test/fila-auth.js
//
// O que cada cena prova esta escrito no nome dela. Tres merecem aviso:
//   * "refresh recusado" e "refresh sem rede" parecem a mesma coisa e sao opostas — servidor
//     que RECUSA o refresh_token desloga; rede que CAI nao pode deslogar, senao o dono perde
//     a sessao toda vez que o metro entra no tunel.
//   * "mundo aberto" tem de continuar passando: enquanto o SQL nao for aplicado, deslogado
//     ainda escreve com a chave publicavel. Um portao que so mede o mundo novo nao percebe
//     que quebrou o de hoje.
//   * "localhost pula o portao" e a unica cena que abre a pagina noutro ENDERECO, e e o
//     endereco que ela mede — ver A CASA DA PAGINA, logo abaixo.
//
// A CASA DA PAGINA. Desde 22/08 o comportamento depende de `location.hostname` (em localhost
// nao ha portao), entao o instrumento nao pode mais deixar o endereco por conta do
// `test/abrir.js`, que serve tudo em 127.0.0.1 — o que faria TODA cena cair no caminho de
// localhost e o portao inteiro medir o mundo errado. Aqui a propria pagina e servida por
// `page.route`, a partir dos bytes do arquivo, em dois enderecos escolhidos:
//   * `https://mesa.brasil.test/dashboard/` — a web, onde o portao existe;
//   * `http://localhost:8199/dashboard/`    — a maquina do plantao, onde ele nao existe.
// Nenhum dos dois resolve em DNS nenhum: a rota intercepta antes. Continua valendo o que
// valia — nada sai desta maquina.
//
// O ALVO SE TROCA POR VARIAVEL DE AMBIENTE, e isso e o que torna este arquivo falsificavel
// (EQUIPE.md 2.8): instrumento que nunca foi visto reprovando e decoracao. Para provar que
// uma cena morde, copie o dashboard, apague o conserto que ela cobra e rode contra a copia:
//
//     FILA_AUTH_HTML=test/tmp-fila-defeito.html node test/fila-auth.js    # tem de sair 1
//
// O AUTO-LOGIN LOCAL entrou em 22/08 (PENDENTES 57) e trouxe CINCO cenas — 20 a 24. Quatro sao
// de navegador, como todas as outras, e a 23 nao: ela mede o modulo do SERVIDOR
// (ferramentas/pin-local.js) direto, sem Chromium, porque as regras que ela cobra sao sobre o
// remoteAddress do socket E o cabecalho Host, e NAO HA COMO produzir um socket nao-loopback (nem
// um Host forjado por script) contra um servidor que so escuta em 127.0.0.1. Chamar a funcao com
// um `req` de mentira e o unico jeito de exercitar esses caminhos — o rebinding (Host de fora
// sobre socket de loopback) inclusive, que e o buraco que a auditoria de 22/08 achou. Deixar de
// exercita-los seria ter a regra sem nunca a ter visto valer.
// O modulo tambem se troca por variavel de ambiente, pela mesma razao que o HTML:
//
//     PIN_LOCAL_JS=test/tmp-pin-defeito.js node test/fila-auth.js         # tem de sair 1
//
// E O ARQUIVO DO PIN: nenhuma cena aqui le `~/.mesa-brasil-pin`. Ele e do dono, o
// plantao nao o le, e um teste que o lesse imprimiria o PIN dele no log da primeira falha. A
// cena 23 escreve um arquivo PROPRIO em test/tmp-*, com um PIN inventado, e o apaga no fim.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const HTML = process.env.FILA_AUTH_HTML
  ? path.resolve(process.env.FILA_AUTH_HTML)
  : path.resolve(__dirname, '..', 'dashboard', 'index.html');
const MOD_PIN = process.env.PIN_LOCAL_JS
  ? path.resolve(process.env.PIN_LOCAL_JS)
  : path.resolve(__dirname, '..', 'ferramentas', 'pin-local.js');
const HOST_WEB = 'https://mesa.brasil.test';
const HOST_LOCAL = 'http://localhost:8199';
const CAMINHO = '/dashboard/';
const SB = 'https://hdhqziqvrthxtgyraemk.supabase.co';
const PUB = 'sb_publishable_kR7pCuqZrPAr24Xdr0F4Nw_t1j5YUKN';
// O e-mail da conta sintetica esta escrito aqui de PROPOSITO, e nao lido do arquivo: se
// alguem trocar a constante no dashboard sem pensar, as cenas de PIN reprovam e a troca vira
// uma decisao, nao um acidente. Ele nao e o e-mail de ninguem — e um nome de usuario.
const EMAIL_DONO = 'dono@mesa.brasil';

let falhas = 0, cenas = 0;
function ok(cond, msg, extra) {
  if (cond) { console.log('  ok  ' + msg); return true; }
  // o `extra` e cortado: um aviso repetido 60 vezes num laco encheu 35 KB de log na primeira
  // vez que este portao reprovou de verdade, e log que ninguem le e log que nao existe.
  const curto = extra == null ? '' : String(extra).slice(0, 240);
  falhas++; console.log('  FALHOU  ' + msg + (curto ? '  <- ' + curto : ''));
  return false;
}

function tokenJson(acesso, seg) {
  return JSON.stringify({
    access_token: acesso, refresh_token: 'refresh-' + acesso, token_type: 'bearer',
    expires_in: seg == null ? 3600 : seg, user: { id: 'uuid-do-dono', email: EMAIL_DONO }
  });
}

// Prepara uma pagina com TODO o backend simulado. `plano` decide o que cada rota responde.
async function palco(navegador, plano) {
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const erros = [], avisos = [], escritas = [], autenticacoes = [], pinPedidos = [];
  if (plano.sessao) {
    await ctx.addInitScript(s => {
      localStorage.setItem('mesa-brasil-sessao1', s);
    }, JSON.stringify(plano.sessao));
  }
  // Fila local ja cheia (ou com um item envenenado) ANTES de a pagina abrir: e o unico jeito
  // de medir o teto e o descarte sem tocar quarenta vezes na tela.
  if (plano.fila) {
    await ctx.addInitScript(s => {
      localStorage.setItem('mesa-brasil-fila4', s);
    }, JSON.stringify(plano.fila));
  }
  if (plano.pinErros) {
    await ctx.addInitScript(s => {
      localStorage.setItem('mesa-brasil-pin-erros', s);
    }, JSON.stringify(plano.pinErros));
  }
  const pag = await ctx.newPage();
  // "Failed to load resource: ... 401" e o navegador narrando a RESPOSTA que a cena pediu —
  // um 401 simulado de proposito nao e defeito da pagina. O que interessa e excecao de
  // script, que continua contando inteira.
  pag.on('console', m => {
    if (m.type() === 'warning') { avisos.push(m.text()); return; }
    if (m.type() !== 'error') return;
    if (/^Failed to load resource/.test(m.text())) return;
    erros.push(m.text());
  });
  pag.on('pageerror', e => erros.push('pageerror: ' + e.message));

  // A propria pagina, servida do disco no endereco que a cena escolheu (ver A CASA DA PAGINA).
  const base = plano.local ? (typeof plano.local === 'string' ? plano.local : HOST_LOCAL) : HOST_WEB;
  await pag.route(base + '/**', r => {
    const p = new URL(r.request().url()).pathname;
    if (p === CAMINHO || p === CAMINHO + 'index.html')
      return r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(HTML) });
    // /pin-local — o auto-login local (PENDENTES 57). A rota fica registrada nos DOIS hosts de
    // proposito: no da web ela e uma ARMADILHA (cena 21), e o que se cobra la e que a pagina
    // nunca a peca. `pinPedidos` conta os pedidos, e contar e a metade que importa: sem isso,
    // "a pagina nao entrou" poderia ser sorte de o PIN ter sido recusado, e nao disciplina.
    if (p === '/pin-local') {
      pinPedidos.push(new URL(r.request().url()).origin);
      if (plano.pinLocal) return r.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', body: plano.pinLocal });
      return r.fulfill({ status: 404, contentType: 'text/plain', body: '404' });
    }
    return r.fulfill({ status: 404, contentType: 'text/plain', body: '404' });
  });

  // Fontes de fora: servidas vazias, para "falhou o recurso" nao virar erro de console e
  // envenenar a contagem que interessa.
  await pag.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await pag.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 200, body: '' }));

  await pag.route(SB + '/**', async rota => {
    const req = rota.request();
    const url = req.url();
    const aut = (req.headers()['authorization'] || '');
    if (url.indexOf('/auth/v1/token') >= 0) {
      // O MESMO endpoint atende o PIN e o refresh; quem separa e o grant_type. Confundir os
      // dois faria a cena do PIN medir a renovacao do token e sair verde sem provar nada.
      if (url.indexOf('grant_type=password') >= 0) {
        autenticacoes.push({ rota: 'senha', corpo: req.postDataJSON(), url });
        if (plano.senha === 'errada') return rota.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"invalid_grant","error_description":"Invalid login credentials"}' });
        if (plano.senha === 'semrede') return rota.abort('failed');
        return rota.fulfill({ status: 200, contentType: 'application/json', body: tokenJson('tok-novo') });
      }
      autenticacoes.push({ rota: 'refresh', corpo: req.postDataJSON() });
      if (plano.refresh === 'recusado') return rota.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"invalid_grant"}' });
      if (plano.refresh === 'semrede') return rota.abort('failed');
      return rota.fulfill({ status: 200, contentType: 'application/json', body: tokenJson('tok-fresco') });
    }
    if (url.indexOf('/auth/v1/logout') >= 0) {
      autenticacoes.push({ rota: 'logout', aut });
      return rota.fulfill({ status: 204, body: '' });
    }
    if (url.indexOf('/auth/v1/user') >= 0) {
      if (req.method() === 'PUT') {
        autenticacoes.push({ rota: 'trocar', aut, corpo: req.postDataJSON() });
        if (plano.trocar === 'recusa') return rota.fulfill({ status: 422, contentType: 'application/json', body: '{"msg":"Password should be at least 6 characters"}' });
        return rota.fulfill({ status: 200, contentType: 'application/json', body: '{"id":"uuid-do-dono"}' });
      }
      autenticacoes.push({ rota: 'usuario', aut });
      return rota.fulfill({ status: 200, contentType: 'application/json', body: '{"id":"uuid-do-dono"}' });
    }
    if (req.method() === 'POST' && url.indexOf('/rest/v1/mesa_resposta') >= 0) {
      escritas.push({ aut, corpo: req.postDataJSON() });
      if (plano.escrita === 'semrede') return rota.abort('failed');
      // 'so-com-sessao' e o MUNDO REAL depois da RLS, e ele existe para a cena 20: a chave
      // publicavel leva 401, o Bearer de uma sessao passa. Com o 201 incondicional de sempre, a
      // primeira lavagem (que sai anonima, antes de o auto-login chegar) esvaziaria a fila e a
      // cena mediria uma corrida de tempo em vez do conserto.
      if (plano.escrita === 'so-com-sessao')
        return rota.fulfill(aut === 'Bearer ' + PUB
          ? { status: 401, contentType: 'application/json', body: '{"message":"new row violates row-level security policy"}' }
          : { status: 201, contentType: 'application/json', body: '' });
      // numero cru = o status que a cena quiser (400 permanente, 413, 422...)
      const st = typeof plano.escrita === 'number' ? plano.escrita : (plano.escrita === 'fechada' ? 401 : 201);
      return rota.fulfill({ status: st, contentType: 'application/json', body: st === 201 ? '' : '{"message":"new row violates row-level security policy"}' });
    }
    // leitura dos paineis: sempre aberta. `plano.leitura` deixa a cena servir linhas de
    // verdade (e linhas ENVENENADAS) em vez do array vazio de sempre.
    if (plano.leitura) {
      const tab = (url.split('/rest/v1/')[1] || '').split('?')[0];
      if (plano.leitura[tab]) return rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(plano.leitura[tab]) });
    }
    return rota.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await pag.goto(base + CAMINHO, { waitUntil: 'domcontentloaded' });
  await pag.waitForTimeout(450);
  return { ctx, pag, erros, avisos, escritas, autenticacoes, pinPedidos, base };
}

// ESPERA QUE NAO ESTOURA O RELOGIO. `waitForFunction` derruba a cena inteira por timeout quando
// o conserto nao esta la — e o controle de 22/08 mostrou o custo disso: a cena 17 ESTOUROU em
// vez de reprovar, e um instrumento que morre nao diz POR QUE morreu. Isto devolve `false` e
// deixa a assercao falar.
async function esperar(pag, fn, ms) {
  const ate = Date.now() + (ms == null ? 3000 : ms);
  for (;;) {
    let v = false;
    try { v = await pag.evaluate(fn); } catch (e) { v = false; }
    if (v) return true;
    if (Date.now() > ate) return false;
    await pag.waitForTimeout(50);
  }
}

async function falarNaConversa(pag, texto) {
  await pag.fill('#compor-txt', texto);
  await pag.click('#compor-btn');
  await pag.waitForTimeout(400);
}

const estado = pag => pag.evaluate(() => ({
  auth: document.body.getAttribute('data-auth'),
  loginVisivel: !document.getElementById('login').hasAttribute('hidden'),
  trocarVisivel: !document.getElementById('trocar').hasAttribute('hidden'),
  elo: !document.getElementById('conta-trocar').hidden,
  quem: document.getElementById('conta-quem').textContent,
  botao: document.getElementById('conta-btn').textContent,
  botaoVisivel: !document.getElementById('conta-btn').hidden,
  soLeitura: getComputedStyle(document.querySelectorAll('.so-leitura')[0]).display,
  fila: JSON.parse(localStorage.getItem('mesa-brasil-fila4') || '[]').length,
  sessao: localStorage.getItem('mesa-brasil-sessao1'),
  erros: localStorage.getItem('mesa-brasil-pin-erros'),
  aviso: document.getElementById('login-estado').textContent,
  avisoTrocar: document.getElementById('trocar-estado').textContent,
  pinNoCampo: document.getElementById('login-pin').value,
}));

(async () => {
  const nav = await chromium.launch();

  // ---------------------------------------------------------------- 1
  console.log('\n[1] MUNDO DE HOJE — deslogado, INSERT anon ainda aberto');
  cenas++;
  {
    const { ctx, pag, erros, escritas } = await palco(nav, {});
    await falarNaConversa(pag, 'oi da cena 1');
    const e = await estado(pag);
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(e.auth === 'fora', 'body data-auth=fora');
    ok(e.soLeitura === 'flex', 'a faixa "modo leitura" aparece deslogado', e.soLeitura);
    ok(e.botao.trim() === 'Entrar', 'o botao da conta convida a entrar', e.botao);
    ok(!e.elo, 'o elo "trocar PIN" NAO aparece deslogado');
    ok(escritas.length === 1, 'o POST saiu mesmo deslogado (o mundo de hoje segue de pe)', String(escritas.length));
    ok(escritas[0] && escritas[0].aut === 'Bearer ' + PUB, 'deslogado manda a chave publicavel', escritas[0] && escritas[0].aut);
    ok(e.fila === 0, 'nada ficou preso na fila local', String(e.fila));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 2
  console.log('\n[2] MUNDO NOVO — deslogado, fila ja fechada (401)');
  cenas++;
  {
    const { ctx, pag, erros } = await palco(nav, { escrita: 'fechada' });
    await falarNaConversa(pag, 'oi da cena 2');
    const e = await estado(pag);
    const toast2 = await pag.textContent('#toast');
    ok(erros.length === 0, 'zero erro de console mesmo levando 401', erros.join(' | '));
    ok(e.loginVisivel, 'o 401 ABRE o login em vez de sumir com a resposta');
    ok(e.fila === 1, 'a resposta foi guardada na fila local', String(e.fila));
    // o par da cena 18: FORA do localhost a frase de sempre continua verdadeira, porque o
    // login abre e o flush do login esvazia a fila. Se alguem tornar a frase nova (a de
    // localhost) incondicional, e AQUI que se percebe.
    ok(/guardei e reenvio/i.test(toast2 || ''), 'e o toast continua sendo o de sempre — aqui ha para onde reenviar', toast2);
    ok(!/PENDENTES 57/.test(toast2 || ''), 'sem a frase de localhost, que aqui seria falsa', toast2);
    await ctx.close();
  }

  // ---------------------------------------------------------------- 3
  console.log('\n[3] A PORTA — um PIN, e a fila presa sai sozinha');
  cenas++;
  {
    const { ctx, pag, erros, escritas, autenticacoes } = await palco(nav, { escrita: 'fechada' });
    await falarNaConversa(pag, 'resposta que vai ficar presa');
    // o proprio 401 ja abriu o painel — clicar em "Entrar" agora o FECHARIA (e alternador)
    ok(await pag.isVisible('#login-pin'), 'o campo do PIN ja esta a mao depois do 401');
    ok(await pag.getAttribute('#login-pin', 'type') === 'password', 'o PIN nao aparece na tela enquanto se digita');

    // dali em diante a escrita passa a ser aceita: e o que o SQL faz para quem entrou
    await pag.unroute(SB + '/**');
    const escritasDepois = [];
    await pag.route(SB + '/**', async rota => {
      const req = rota.request();
      if (req.url().indexOf('grant_type=password') >= 0) {
        autenticacoes.push({ rota: 'senha', corpo: req.postDataJSON(), url: req.url() });
        return rota.fulfill({ status: 200, contentType: 'application/json', body: tokenJson('tok-novo') });
      }
      if (req.method() === 'POST' && req.url().indexOf('/rest/v1/mesa_resposta') >= 0) {
        escritasDepois.push(req.headers()['authorization']);
        return rota.fulfill({ status: 201, contentType: 'application/json', body: '' });
      }
      return rota.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await pag.fill('#login-pin', '12345678');
    await pag.click('#login-entrar');
    await pag.waitForTimeout(700);
    const e = await estado(pag);
    const pedido = autenticacoes.find(a => a.rota === 'senha');
    ok(erros.length === 0, 'zero erro de console no fluxo inteiro', erros.join(' | '));
    ok(!!pedido && pedido.url.indexOf('grant_type=password') > 0, 'o PIN vai pelo grant_type=password', pedido && pedido.url);
    ok(!!pedido && pedido.corpo.email === EMAIL_DONO, 'com o e-mail SINTETICO da conta da mesa', pedido && pedido.corpo.email);
    ok(!!pedido && pedido.corpo.password === '12345678', 'e o PIN digitado como senha');
    ok(e.auth === 'dentro', 'entrou');
    ok(!e.loginVisivel, 'o painel de login se fecha ao entrar');
    ok(e.botao.trim() === 'Sair', 'o botao vira Sair', e.botao);
    ok(e.elo, 'o elo "trocar PIN" aparece so depois de entrar');
    ok(e.pinNoCampo === '', 'o PIN nao fica no campo depois de entrar', e.pinNoCampo);
    ok(!!e.sessao && JSON.parse(e.sessao).refresh_token === 'refresh-tok-novo', 'os DOIS tokens ficam guardados');
    ok(!!e.sessao && !('email' in JSON.parse(e.sessao)), 'e NENHUM e-mail e guardado no aparelho', e.sessao);
    ok(escritasDepois.length >= 1 && escritasDepois[0] === 'Bearer tok-novo', 'a resposta presa saiu sozinha com o token do usuario', escritasDepois.join(','));
    ok(e.fila === 0, 'a fila local esvaziou', String(e.fila));
    void escritas;
    await ctx.close();
  }

  // ---------------------------------------------------------------- 4
  console.log('\n[4] SESSAO GUARDADA — voltar nao pede PIN de novo');
  cenas++;
  {
    const { ctx, pag, erros, escritas, autenticacoes } = await palco(nav, {
      sessao: { access_token: 'tok-guardado', refresh_token: 'r1', expira_em: Date.now() + 3600e3 }
    });
    await falarNaConversa(pag, 'oi da cena 4');
    const e = await estado(pag);
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(e.auth === 'dentro', 'ja entra logado (login unico)');
    ok(e.soLeitura === 'none', 'as faixas de "modo leitura" somem', e.soLeitura);
    ok(escritas[0] && escritas[0].aut === 'Bearer tok-guardado', 'o POST leva o token do usuario', escritas[0] && escritas[0].aut);
    ok(autenticacoes.filter(a => a.rota === 'usuario').length === 0,
      'a carga NAO pergunta ao servidor quem entrou (nao ha mais e-mail a buscar)',
      JSON.stringify(autenticacoes.map(a => a.rota)));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 5
  console.log('\n[5] TOKEN QUE VENCE COM A PAGINA ABERTA — quem renova e a ESCRITA');
  cenas++;
  // A10 da auditoria (21/08): esta cena era CEGA. Ela guardava uma sessao ja vencida (`expira_em
  // = agora - 1000`), e uma sessao vencida na CARGA e renovada pela partida — a linha que roda
  // uma vez, no fim do script. Com o token ja fresco antes do primeiro toque, apagar a renovacao
  // do caminho de ESCRITA (`cabecalhoEscrita`) nao mudava nada: a cena continuava verde medindo
  // o conserto do vizinho. Ela passou a montar o caso REAL — a aba que fica aberta a tarde
  // inteira: sessao VALIDA quando a pagina carrega (nada a renovar) e VENCIDA na hora de
  // escrever, com o relogio da pagina deslocado DEPOIS da carga.
  {
    const { ctx, pag, erros, escritas, autenticacoes } = await palco(nav, {
      sessao: { access_token: 'tok-velho', refresh_token: 'r1', expira_em: Date.now() + 300e3 }
    });
    ok(autenticacoes.filter(a => a.rota === 'refresh').length === 0,
      'na carga NAO renova — a sessao ainda vale (e o que faz esta cena medir a escrita)',
      JSON.stringify(autenticacoes.map(a => a.rota)));
    // cinco minutos passam com a aba aberta: agora falta menos de 1 min para o token vencer
    await pag.evaluate(ms => { const real = Date.now; Date.now = () => real() + ms; }, 290e3);
    await falarNaConversa(pag, 'oi da cena 5');
    const e = await estado(pag);
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(autenticacoes.some(a => a.rota === 'refresh'), 'a ESCRITA renovou o token antes de mandar');
    ok(escritas[0] && escritas[0].aut === 'Bearer tok-fresco', 'o POST usou o token NOVO, nao o vencido', escritas[0] && escritas[0].aut);
    ok(e.auth === 'dentro', 'continua dentro');
    ok(JSON.parse(e.sessao).access_token === 'tok-fresco', 'o token novo ficou guardado');
    await ctx.close();
  }

  // ---------------------------------------------------------------- 6
  console.log('\n[6] REFRESH RECUSADO — desloga com dignidade, sem explodir');
  cenas++;
  {
    const { ctx, pag, erros } = await palco(nav, {
      refresh: 'recusado', escrita: 'fechada',
      sessao: { access_token: 'tok-velho', refresh_token: 'r1', expira_em: Date.now() - 1000 }
    });
    await falarNaConversa(pag, 'oi da cena 6');
    const e = await estado(pag);
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(e.auth === 'fora', 'saiu da sessao morta');
    ok(e.sessao === null, 'a sessao morta foi apagada do aparelho', String(e.sessao));
    ok(e.loginVisivel, 'e o login aparece');
    ok(e.fila === 1, 'a resposta nao se perdeu — ficou na fila', String(e.fila));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 7
  console.log('\n[7] REDE CAIDA NO REFRESH — NAO desloga (o oposto da cena 6)');
  cenas++;
  {
    const { ctx, pag, erros } = await palco(nav, {
      refresh: 'semrede', escrita: 'semrede',
      sessao: { access_token: 'tok-velho', refresh_token: 'r1', expira_em: Date.now() - 1000 }
    });
    await falarNaConversa(pag, 'oi da cena 7');
    const e = await estado(pag);
    ok(e.auth === 'dentro', 'rede caida nao tira o dono da sessao');
    ok(e.sessao !== null, 'a sessao continua no aparelho');
    ok(e.fila === 1, 'a resposta ficou na fila para reenviar', String(e.fila));
    void erros; // aqui o Chromium registra o ERR_FAILED do abort; nao e defeito da pagina
    await ctx.close();
  }

  // ---------------------------------------------------------------- 8
  console.log('\n[8] PIN ERRADO — nao entra, diz o motivo, e nao guarda nada');
  cenas++;
  {
    const { ctx, pag, erros, autenticacoes } = await palco(nav, { senha: 'errada' });
    await pag.click('#conta-btn');
    await pag.fill('#login-pin', '00000000');
    await pag.click('#login-entrar');
    await pag.waitForTimeout(500);
    const e = await estado(pag);
    const pedido = autenticacoes.find(a => a.rota === 'senha');
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(!!pedido && pedido.corpo.email === EMAIL_DONO, 'o pedido foi para a conta sintetica', pedido && pedido.corpo.email);
    ok(!!pedido && pedido.corpo.password === '00000000', 'com o PIN errado como senha');
    ok(e.auth === 'fora', 'nao entrou');
    ok(e.sessao === null, 'nenhuma sessao foi gravada', String(e.sessao));
    ok(e.loginVisivel, 'o painel continua aberto para tentar de novo');
    ok(/n[aã]o entrou/i.test(e.aviso), 'e a tela diz por que nao entrou', e.aviso);
    ok(e.pinNoCampo === '', 'o PIN errado sai do campo (nao se re-manda por engano)', e.pinNoCampo);
    await ctx.close();
  }

  // ---------------------------------------------------------------- 9
  console.log('\n[9] CINCO ERROS SEGUIDOS — o formulario espera 30 s (e volta sozinho)');
  cenas++;
  // ISTO E UX, NAO SEGURANCA, e a cena mede exatamente isso: que a pagina para de mandar
  // pedido depois do quinto erro e diz quanto falta. Quem ataca nao passa por esta pagina —
  // o que protege de verdade e o rate limit do GoTrue, o cadastro desligado e o tamanho do
  // dano (INSERT numa fila), e esta escrito por extenso no dashboard, ao lado do contador.
  {
    const { ctx, pag, erros, autenticacoes } = await palco(nav, { senha: 'errada' });
    await pag.click('#conta-btn');
    for (let i = 0; i < 5; i++) {
      await pag.fill('#login-pin', '0000000' + i);
      await pag.click('#login-entrar');
      await pag.waitForTimeout(260);
    }
    const depoisDe5 = autenticacoes.filter(a => a.rota === 'senha').length;
    const meio = await estado(pag);
    // a sexta tentativa NAO pode sair
    await pag.fill('#login-pin', '99999999');
    await pag.click('#login-entrar', { force: true });
    await pag.waitForTimeout(300);
    const depoisDe6 = autenticacoes.filter(a => a.rota === 'senha').length;
    const parado = await estado(pag);
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(depoisDe5 === 5, 'os cinco erros saíram mesmo (a cena mede algo)', String(depoisDe5));
    ok(/espere \d+ s/.test(meio.aviso), 'a tela mostra a espera com o numero de segundos', meio.aviso);
    ok(!!meio.erros && JSON.parse(meio.erros).erros >= 5, 'o contador ficou no aparelho', meio.erros);
    ok(depoisDe6 === 5, 'a SEXTA tentativa nao sai — nenhum pedido novo', String(depoisDe6));
    ok(await pag.isDisabled('#login-entrar'), 'e o botao fica desligado enquanto a espera corre');
    void parado;
    // 31 s depois o formulario volta sozinho: o contador re-desenha a cada 500 ms
    await pag.evaluate(ms => { const real = Date.now; Date.now = () => real() + ms; }, 31000);
    await pag.waitForTimeout(900);
    ok(!(await pag.isDisabled('#login-entrar')), 'passados 30 s o botao volta sozinho');
    await ctx.close();
  }

  // ---------------------------------------------------------------- 10
  console.log('\n[10] LEITURA — os paineis nunca dependem de estar logado');
  cenas++;
  {
    const { ctx, pag, erros } = await palco(nav, { escrita: 'fechada' });
    const leituras = await pag.evaluate(() => document.querySelectorAll('.camada').length);
    const e = await estado(pag);
    ok(erros.length === 0, 'zero erro de console deslogado', erros.join(' | '));
    ok(leituras >= 5, 'as secoes montam deslogado', String(leituras));
    ok((await pag.textContent('#quando')).indexOf('ao vivo') >= 0, 'o cabecalho diz "ao vivo" — o SELECT anonimo respondeu');
    ok(e.auth === 'fora', 'sem sessao');
    await ctx.close();
  }

  // ---------------------------------------------------------------- 11
  console.log('\n[11] TETO DA FILA — cheia, a pagina diz a verdade em vez de "guardei"');
  cenas++;
  // A5 da auditoria: sem teto, um erro que nunca passa empilhava um item por toque ate o
  // localStorage estourar — e o `catch(e){}` mudo engolia o estouro, entao o toast continuava
  // dizendo "guardei e reenvio" com nada guardado. Mentir sobre ter guardado e pior que perder.
  {
    const cheia = Array.from({ length: 50 }, (_, i) => ({ tipo: 'mensagem', chave: 'dono', valor: null, texto: 'antiga ' + i }));
    const { ctx, pag, erros, avisos } = await palco(nav, { escrita: 'semrede', fila: cheia });
    await falarNaConversa(pag, 'esta nao cabe');
    const e = await estado(pag);
    const toastTxt = await pag.textContent('#toast');
    const campo = await pag.inputValue('#compor-txt');
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(e.fila === 50, 'a fila para no teto de 50 — nao vira 51', String(e.fila));
    ok(/cheia/i.test(toastTxt || ''), 'o toast diz que NAO guardou', toastTxt);
    ok(campo === 'esta nao cabe', 'o texto perdido continua no campo (a unica copia que sobrou)', campo);
    ok(avisos.some(a => /teto/i.test(a)), 'o console avisa do teto', avisos.join(' | '));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 12
  console.log('\n[12] 4xx PERMANENTE — o item que nunca vai passar sai da fila, com aviso');
  cenas++;
  // A6: 400 nao e "tente de novo", e "isto esta errado para sempre". Insistir entope a fila e
  // esconde o motivo. 401/403 continuam sendo espera (cena 2 e 6), e e o par que prova a regra.
  {
    const { ctx, pag, erros, avisos, escritas } = await palco(nav, {
      escrita: 400,
      fila: [{ tipo: 'mensagem', chave: 'dono', valor: null, texto: 'item que o banco recusa' }]
    });
    await pag.waitForTimeout(350);
    const e = await estado(pag);
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(e.fila === 0, 'o item permanente saiu da fila', String(e.fila));
    ok(escritas.length === 1, 'e saiu depois de UMA tentativa, sem laco', String(escritas.length));
    ok(avisos.some(a => /descartei/i.test(a) && /400/.test(a)), 'o console diz o que foi descartado e por que', avisos.join(' | '));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 13
  console.log('\n[13] SAIR REVOGA NO SERVIDOR — nao so apaga do aparelho');
  cenas++;
  // A8: apagar o localStorage deixava o refresh_token VIVO do lado de la ate vencer. Quem
  // tivesse copiado o token continuava entrando depois de o dono "sair".
  {
    const { ctx, pag, erros, autenticacoes } = await palco(nav, {
      sessao: { access_token: 'tok-guardado', refresh_token: 'r1', expira_em: Date.now() + 3600e3 }
    });
    await pag.click('#conta-btn');
    await pag.waitForTimeout(300);
    const e = await estado(pag);
    const saida = autenticacoes.find(a => a.rota === 'logout');
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(!!saida, 'o POST /auth/v1/logout saiu', JSON.stringify(autenticacoes.map(a => a.rota)));
    ok(!!saida && saida.aut === 'Bearer tok-guardado', 'e foi com o token da sessao (o servidor sabe qual matar)', saida && saida.aut);
    ok(e.sessao === null, 'e o aparelho tambem ficou limpo', String(e.sessao));
    ok(e.auth === 'fora', 'a pagina volta ao modo leitura');
    ok(!e.elo, 'e o elo "trocar PIN" some junto');
    await ctx.close();
  }

  // ---------------------------------------------------------------- 14
  console.log('\n[14] TEXTO DO SERVIDOR ENVENENADO — nenhum atributo on* nasce no DOM');
  cenas++;
  // N6 da re-auditoria, e a razao de ela existir: NENHUMA cena media escape, e foi por isso que
  // o N2 passou por aqui verde. O `escH` escapava `<`, `>` e `&` e deixava as ASPAS passarem —
  // inofensivas dentro de um no de texto, fatais dentro de `data-v="..."`. Com a CSP nova ja em
  // vigor o XSS EXECUTOU (script-src 'unsafe-inline' autoriza manipulador embutido), entao o
  // que defende aqui e o escape, nao a politica. Esta cena serve os dois campos que o painel
  // le do servidor sem passar por lista branca — `mesa_agente.cor` (o A3) e `mesa_item.opcoes[].v`
  // (o N2) — e reprova se QUALQUER atributo comecando por "on" existir no DOM.
  {
    const veneno = {
      cor: '#fff" onload="window.__xss=1',
      v: 'x" onmouseover="window.__xss=2" data-z="',
      texto: '<img src=x onerror="window.__xss=3">',
    };
    const { ctx, pag, erros } = await palco(nav, {
      leitura: {
        mesa_item: [{
          tipo: 'decisao', chave: 'envenenada', titulo: veneno.texto, contexto: veneno.texto,
          recomendada: veneno.v, criado_em: '2026-08-21T00:00:00Z',
          opcoes: [{ v: veneno.v, label: veneno.texto, desc: veneno.texto }],
        }, {
          // O CARTAO NO FORMATO REAL DA MESA ({v, t}) — hotfix de 22/08: o refactor N2 passou a
          // ler o.label/o.desc, TODO cartao de producao usa {v, t}, e os botoes nasceram VAZIOS
          // no aparelho do dono. Nenhuma cena pegou porque o unico mock usava o formato novo.
          // Este cartao cobra que o rotulo do formato da mesa CHEGA ao botao.
          tipo: 'decisao', chave: 'formato-da-mesa', titulo: 'formato {v,t} da mesa',
          contexto: 'cartao real', recomendada: 'a', criado_em: '2026-08-21T00:00:01Z',
          opcoes: [{ v: 'a', t: 'ROTULO-DA-MESA-VISIVEL' }, { v: 'b', t: 'segunda-opcao' }],
        }],
        // `squad` entrou na leitura em 21/08 e vem envenenada aqui pela mesma razao que `cor`:
        // campo novo do servidor e campo novo de ataque ate alguem provar o contrario.
        mesa_agente: [{ nome: veneno.texto, papel: veneno.texto, cor: veneno.cor, squad: veneno.v, status: 'espera', atividade: '', ativo_em: '2026-08-21T00:00:00Z', ordem: 1 }],
      },
    });
    await pag.waitForTimeout(500);
    const m = await pag.evaluate(() => {
      const comOn = [];
      document.querySelectorAll('*').forEach(el => {
        for (const a of el.attributes) if (/^on/i.test(a.name)) comOn.push(el.tagName + '[' + a.name + ']');
      });
      const op = document.querySelector('#lista-dec .op');
      return {
        comOn, xss: window.__xss,
        imgs: document.querySelectorAll('#lista-dec img, #grade-ag img').length,
        ops: document.querySelectorAll('[data-k="envenenada"] .op').length,
        rotuloDaMesa: (function(){ const b=document.querySelector('[data-k="formato-da-mesa"] .op .lab'); return b?(b.textContent||'').trim():null; })(),
        dataV: op ? op.getAttribute('data-v') : null,
        rotulo: op ? (op.textContent || '').trim() : null,
        // o `cor` do agente pinta a camisa: o <rect> de x=4,y=7 do boneco de bon()
        fill: (document.querySelector('#grade-ag .bon rect[x="4"][y="7"]') || {}).getAttribute
          ? document.querySelector('#grade-ag .bon rect[x="4"][y="7"]').getAttribute('fill') : null,
      };
    });
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(m.ops === 1, 'a decisao envenenada foi renderizada (a cena mede algo)', String(m.ops));
    ok(m.comOn.length === 0, 'NENHUM atributo on* no DOM inteiro', m.comOn.join(','));
    ok(m.xss === undefined, 'nada executou (window.__xss segue indefinido)', String(m.xss));
    ok(m.imgs === 0, 'o <img> do payload virou texto, nao elemento', String(m.imgs));
    ok(m.dataV === veneno.v, 'o valor da opcao chega INTEIRO como dado (escapar nao e mutilar)', String(m.dataV));
    ok((m.rotuloDaMesa||'').indexOf('ROTULO-DA-MESA-VISIVEL') === 0, 'o formato {v,t} da mesa poe o ROTULO no botao (hotfix 22/08 — os botoes nasciam vazios em producao)', String(m.rotuloDaMesa));
    ok((m.rotulo || '').indexOf('<img') >= 0, 'e a marcacao do payload aparece como texto na tela', m.rotulo);
    ok(m.fill === '#7d8479', 'a cor invalida do agente cai no cinza padrao (o A3 continua fechado)', String(m.fill));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 15
  console.log('\n[15] FILA HERDADA ACIMA DO TETO — drena uma vez, nao entra em laco');
  cenas++;
  // N1 da re-auditoria, e foi o achado mais grave da entrega: o teto nasceu DEPOIS da fila.
  // Quem ja tinha 60 itens guardados no aparelho caia num laco — o shift deixava 59, ainda acima
  // do teto, `gravarFila` recusava em silencio, e o `lavarUm()` seguinte relia os mesmos 60 e
  // mandava o mesmo item de novo. Medido pelo auditor: 1173 POSTs em 6 s. Com o servidor
  // respondendo 201, seriam 1173 INSERTs REAIS da mesma resposta na fila que ACIONA agente.
  // Aqui a fila herdada tem 60 itens e o servidor aceita tudo: o certo e podar para 50 na carga
  // e mandar 50 POSTs — um por item, nunca o mesmo duas vezes.
  {
    const herdada = Array.from({ length: 60 }, (_, i) => ({ tipo: 'mensagem', chave: 'dono', valor: null, texto: 'herdada ' + i }));
    const { ctx, pag, erros, avisos, escritas } = await palco(nav, { fila: herdada });
    await pag.waitForTimeout(2500);
    const e = await estado(pag);
    const textos = escritas.map(x => x.corpo && x.corpo.texto);
    const repetidos = textos.length - new Set(textos).size;
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(escritas.length <= 60, 'o numero de POSTs e da ordem da fila, nao de um laco', String(escritas.length));
    ok(repetidos === 0, 'nenhuma resposta foi mandada duas vezes', String(repetidos));
    ok(e.fila === 0, 'a fila drenou ate o fim', String(e.fila));
    ok(avisos.some(a => /podei/i.test(a)), 'o console diz que podou a fila herdada', avisos.join(' | '));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 16
  console.log('\n[16] AS SQUADS — agrupa na ordem, e o refresh NAO duplica card');
  cenas++;
  // A organizacao em squads (dono, 21/08) tem um risco que nao e visual: `atualizaAg` cacheia
  // card por nome e a pagina recarrega sozinha a cada 7 s. Agrupamento feito com `appendChild`
  // a cada volta duplicaria a grade inteira sem ninguem perceber por um tempo — o painel so
  // ficaria "estranho". Entao esta cena espera UM refresh de verdade e conta de novo.
  // Ela mede tres coisas: a ORDEM dos cabecalhos, a ordem dos cards dentro dela, e que a
  // squad envenenada nao vira grupo nem atributo (a lista branca decide, o servidor nao).
  {
    const linhas = [
      { nome: 'dev-plataforma', squad: 'plataforma', ordem: 1 },
      { nome: 'claude', squad: 'central', ordem: 2 },
      { nome: 'historiador', squad: 'acervo', ordem: 3 },
      { nome: 'arte', squad: 'jogo', ordem: 4 },
      { nome: 'fantasma', squad: 'x" onmouseover="window.__xss=9', ordem: 5 },
      { nome: 'orfa', squad: null, ordem: 6 },
    ].map(l => Object.assign({ papel: 'papel', cor: '#7d8479', status: 'espera', atividade: '', ativo_em: '2026-08-21T00:00:00Z' }, l));
    const { ctx, pag, erros } = await palco(nav, { leitura: { mesa_agente: linhas } });
    const ler = () => pag.evaluate(() => {
      const comOn = [];
      document.querySelectorAll('*').forEach(el => {
        for (const a of el.attributes) if (/^on/i.test(a.name)) comOn.push(el.tagName + '[' + a.name + ']');
      });
      return {
        cards: document.querySelectorAll('#grade-ag .ag').length,
        nomes: Array.from(document.querySelectorAll('#grade-ag .ag .nome')).map(n => n.textContent).join(','),
        cabs: Array.from(document.querySelectorAll('#grade-ag .cab-squad')).map(n => n.textContent).join(' | '),
        comOn, xss: window.__xss, veneno: document.getElementById('grade-ag').innerHTML.indexOf('onmouseover') >= 0,
      };
    });
    await pag.waitForTimeout(600);
    const a = await ler();
    ok(a.cards === 6, 'os 6 agentes viraram 6 cards (a cena mede algo)', String(a.cards));
    ok(a.cabs === 'CENTRAL | SQUAD JOGO | SQUAD PLATAFORMA | SQUAD ACERVO',
      'os cabecalhos saem na ordem central -> jogo -> plataforma -> acervo', a.cabs);
    ok(a.nomes === 'claude,arte,dev-plataforma,historiador,fantasma,orfa',
      'os cards seguem a squad, nao a ordem do servidor, e quem nao tem squad fica no fim', a.nomes);
    ok(a.comOn.length === 0 && !a.veneno && a.xss === undefined,
      'a squad envenenada nao virou atributo nem grupo', a.comOn.join(',') + ' veneno=' + a.veneno);
    // o painel recarrega sozinho a cada 7 s; esperar o refresh e o ponto da cena
    await pag.waitForTimeout(7600);
    const b = await ler();
    ok(b.cards === 6, 'depois de um refresh de verdade continuam 6 cards (nada duplicou)', String(b.cards));
    ok(b.cabs === a.cabs, 'e nenhum cabecalho de squad nasceu de novo', b.cabs);
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 17
  console.log('\n[17] TROCAR O PIN — o dono troca o temporario sem passar por ninguem');
  cenas++;
  // O plantao entrega um PIN temporario (ele cria a conta e define a senha pelo MCP, com a
  // service_role que nunca sai do servidor). Esta e a tela que faz esse PIN deixar de ser
  // conhecido por qualquer outra pessoa — e o PUT vai com o Bearer DO USUARIO, nunca com a
  // chave publicavel: o GoTrue recusaria, e cobrar isso aqui e o ponto da cena.
  {
    const { ctx, pag, erros, autenticacoes } = await palco(nav, {
      sessao: { access_token: 'tok-guardado', refresh_token: 'r1', expira_em: Date.now() + 3600e3 }
    });
    const antes = await estado(pag);
    ok(antes.elo, 'o elo "trocar PIN" esta a mao para quem entrou');
    await pag.click('#conta-trocar');
    await pag.waitForTimeout(200);
    ok(await pag.isVisible('#trocar-novo'), 'o elo abre o painel de troca');
    // Reabre o painel antes de cada tentativa. Sem isto, uma COPIA DEFEITUOSA (o controle roda
    // uma por defeito) que aceite o PIN curto fecha o painel, e o `fill` seguinte fica 30 s
    // esperando um campo invisivel e derruba a cena inteira por timeout em vez de reprovar
    // pelas assercoes. Instrumento tem de reprovar dizendo POR QUE, nao estourando o relogio.
    const abrirTroca = async () => {
      if (!(await pag.isVisible('#trocar-novo'))) { await pag.click('#conta-trocar'); await pag.waitForTimeout(150); }
    };

    // SETE digitos: a borda nova. O minimo subiu de 6 para 8 em 22/08 (decisao do dono apos
    // a conta da seguranca, 10^6 -> 10^8), e um PIN de 7 e o unico valor que prova a mudanca —
    // com 5 a cena continuaria verde com o minimo velho de volta, medindo nada.
    await abrirTroca();
    await pag.fill('#trocar-novo', '1234567');
    await pag.fill('#trocar-conf', '1234567');
    await pag.click('#trocar-ok');
    await pag.waitForTimeout(250);
    const curto = await estado(pag);
    ok(autenticacoes.filter(a => a.rota === 'trocar').length === 0,
      'PIN de 7 nao vira pedido — a pagina nem tenta', JSON.stringify(autenticacoes.map(a => a.rota)));
    ok(/8 d[ií]gitos/.test(curto.avisoTrocar), 'e a tela diz o minimo NOVO, em portugues', curto.avisoTrocar);

    // os dois campos discordando: tambem nao sai
    await abrirTroca();
    await pag.fill('#trocar-novo', '11111111');
    await pag.fill('#trocar-conf', '22222222');
    await pag.click('#trocar-ok');
    await pag.waitForTimeout(250);
    const difere = await estado(pag);
    ok(autenticacoes.filter(a => a.rota === 'trocar').length === 0,
      'confirmacao diferente nao vira pedido', JSON.stringify(autenticacoes.map(a => a.rota)));
    ok(/n[aã]o batem/.test(difere.avisoTrocar), 'e a tela diz que os dois campos discordam', difere.avisoTrocar);

    // agora vale
    await abrirTroca();
    await pag.fill('#trocar-novo', '11111111');
    await pag.fill('#trocar-conf', '11111111');
    await pag.click('#trocar-ok');
    await pag.waitForTimeout(500);
    const fim = await estado(pag);
    const put = autenticacoes.find(a => a.rota === 'trocar');
    const toastTxt = await pag.textContent('#toast');
    ok(erros.length === 0, 'zero erro de console no fluxo inteiro', erros.join(' | '));
    ok(!!put, 'o PUT /auth/v1/user saiu', JSON.stringify(autenticacoes.map(a => a.rota)));
    ok(!!put && put.aut === 'Bearer tok-guardado', 'com o Bearer DO USUARIO, nao com a chave publicavel', put && put.aut);
    ok(!!put && put.corpo.password === '11111111', 'e o corpo leva so a senha nova', put && JSON.stringify(put.corpo));
    ok(!fim.trocarVisivel, 'o painel de troca se fecha sozinho');
    ok(fim.auth === 'dentro', 'e o dono continua entrado (trocar PIN nao desloga)');
    ok(/trocado/i.test(toastTxt || ''), 'o toast confirma a troca', toastTxt);
    await ctx.close();
  }

  // ---------------------------------------------------------------- 18
  console.log('\n[18] LOCALHOST PULA O PORTAO — sem login, e sem fingir sessao');
  cenas++;
  // Decisao do dono (22/08): "localhost n precisa entrar ne". A cena serve a MESMA pagina em
  // http://localhost:8199/dashboard/ e cobra as duas metades: o portao nao aparece NEM
  // quando o servidor devolve 401 (e ele devolve aqui, de proposito), e nada de sessao
  // inventada — `mesa-brasil-sessao1` continua vazio e o POST sai com a chave publicavel.
  // A resposta que levou 401 tem de cair na fila local, como em qualquer outra falha.
  {
    const { ctx, pag, erros, escritas } = await palco(nav, { local: true, escrita: 'fechada' });
    await falarNaConversa(pag, 'oi da cena 18');
    const e = await estado(pag);
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(e.auth === 'local', 'body data-auth=local (nem dentro, nem fora)', e.auth);
    ok(!e.loginVisivel, 'o portao NAO aparece, mesmo com a escrita levando 401');
    ok(!e.botaoVisivel, 'e nao ha botao "Entrar" para tocar por engano');
    ok(e.soLeitura === 'none', 'as faixas "escrever exige entrar" somem — aqui seria mentira', e.soLeitura);
    ok(e.sessao === null, 'NENHUMA sessao foi inventada', String(e.sessao));
    ok(escritas[0] && escritas[0].aut === 'Bearer ' + PUB, 'o POST sai anonimo, com a chave publicavel', escritas[0] && escritas[0].aut);
    ok(e.fila === 1, 'e a resposta recusada cai na fila local, como qualquer falha', String(e.fila));
    // P4 da 2a auditoria (22/08): "Sem conexao — guardei e reenvio" mente duas vezes aqui.
    // Nao foi conexao (foi 401) e nao vai haver reenvio, porque nesta pagina, neste endereco,
    // nao ha como conseguir sessao. A fila local NAO drena ate o auto-login local existir.
    const toast18 = await pag.textContent('#toast');
    ok(!/sem conex/i.test(toast18 || ''), 'o toast NAO diz "sem conexao" — foi autenticacao', toast18);
    ok(/PENDENTES 57/.test(toast18 || ''), 'e diz onde a espera esta registrada', toast18);
    ok(/localhost/i.test(toast18 || ''), 'nomeando o motivo: em localhost nao ha login', toast18);
    await ctx.close();
  }

  // ---------------------------------------------------------------- 19
  console.log('\n[19] 0.0.0.0 TAMBEM E A PROPRIA MAQUINA — P5 da 2a auditoria (22/08)');
  cenas++;
  // O alias que mais aparece na pratica: servidor que faz bind em 0.0.0.0 e a barra de
  // endereco repetindo o que foi digitado. Ficar de fora errava na direcao segura — o portao
  // APARECIA —, mas o custo era um formulario que o plantao nao tem como atravessar, porque
  // o PIN e do dono. A cena existe para o alias nao sumir do regex numa limpeza futura.
  {
    const { ctx, pag, erros } = await palco(nav, { local: 'http://0.0.0.0:8199', escrita: 'fechada' });
    await falarNaConversa(pag, 'oi da cena 19');
    const e = await estado(pag);
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(e.auth === 'local', 'body data-auth=local tambem em 0.0.0.0', e.auth);
    ok(!e.loginVisivel, 'o portao nao aparece nem levando 401');
    ok(e.sessao === null, 'e nenhuma sessao foi inventada', String(e.sessao));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 20
  console.log('\n[20] AUTO-LOGIN LOCAL — a maquina do dono entra sozinha, e a fila presa sai');
  cenas++;
  // PENDENTES 57. O mundo desta cena e o mundo REAL depois da RLS: escrita anonima leva 401,
  // Bearer passa ('so-com-sessao'). A fila ja chega com uma resposta presa de ontem, que e
  // exatamente o estado que o item existe para resolver — o toast honesto de 22/08 prometia
  // que ela sairia quando isto entrasse, e e essa promessa que se cobra aqui.
  {
    const { ctx, pag, erros, escritas, autenticacoes, pinPedidos } = await palco(nav, {
      local: true, pinLocal: '87654321\n', escrita: 'so-com-sessao',
      fila: [{ tipo: 'mensagem', chave: 'presa', valor: null, texto: 'resposta presa desde ontem' }],
    });
    const entrou = await esperar(pag, () => document.body.getAttribute('data-auth') === 'dentro');
    const e = await estado(pag);
    const pedido = autenticacoes.find(a => a.rota === 'senha');
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(pinPedidos.length === 1, 'a pagina pede /pin-local UMA vez (sem laco)', String(pinPedidos.length));
    ok(entrou, 'e entra sozinha: data-auth=dentro sem ninguem digitar nada', e.auth);
    ok(!!pedido, 'o PIN do arquivo virou grant_type=password', JSON.stringify(autenticacoes.map(a => a.rota)));
    ok(!!pedido && pedido.corpo.email === EMAIL_DONO, 'pela MESMA porta do login normal (e-mail sintetico)', pedido && pedido.corpo.email);
    ok(!!pedido && pedido.corpo.password === '87654321', 'com o PIN do arquivo, ja sem o \\n do fim');
    ok(!e.loginVisivel, 'SEM TELA — o formulario nunca aparece');
    // O botao aparece dizendo "Sair", e nao "Entrar": depois do auto-login o dono ESTA dentro,
    // e a pagina tem de ter a mesma cara de quem entrou digitando — e a mesma sessao. Esconder
    // o botao aqui seria a mentira oposta a de 22/08. (Tocar em Sair revoga do lado de la; a
    // proxima carga entra de novo pelo arquivo, o que e a leitura certa: o arquivo e que manda.)
    ok(e.botao.trim() === 'Sair' && e.botaoVisivel, 'e a conta mostra "Sair", como quem entrou digitando', e.botao);
    ok(e.elo, 'com o elo "trocar PIN" a mao — e a mesma sessao, nao um estado de segunda classe');
    ok(e.soLeitura === 'none', 'e nenhuma faixa de "modo leitura" sobra', e.soLeitura);
    ok(!!e.sessao && JSON.parse(e.sessao).refresh_token === 'refresh-tok-novo', 'a sessao guardada e uma de verdade, com os dois tokens', e.sessao);
    const vazia = await esperar(pag, () => JSON.parse(localStorage.getItem('mesa-brasil-fila4') || '[]').length === 0);
    ok(vazia, 'a resposta presa de ontem saiu sozinha — a fila local esvaziou', String((await estado(pag)).fila));
    const comBearer = escritas.filter(w => w.aut === 'Bearer tok-novo');
    ok(comBearer.length >= 1, 'e ela saiu com o Bearer do usuario, nao com a publicavel',
      escritas.map(w => w.aut).join(' , '));
    // SEM TOAST: o dono nao pediu login nenhum, e anunciar um login que ele nao pediu e ruido.
    // Vale so o que aconteceu ATE aqui — depois desta linha a cena escreve na conversa e o
    // toast de sucesso e legitimo.
    const toast20 = await pag.textContent('#toast');
    ok(!(toast20 || '').trim(), 'SEM TOAST — nada e anunciado', toast20);
    await falarNaConversa(pag, 'oi da cena 20');
    const depois = await estado(pag);
    ok(escritas.length >= 2 && escritas[escritas.length - 1].aut === 'Bearer tok-novo',
      'e a resposta NOVA tambem sai com sessao', escritas.map(w => w.aut).join(' , '));
    ok(depois.fila === 0, 'nada volta a ficar preso', String(depois.fila));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 21
  console.log('\n[21] A ARMADILHA NA WEB — /pin-local servido no host publico, e a pagina NAO pede');
  cenas++;
  // Esta cena e o par obrigatorio da 20, e a mais importante das quatro. O host aqui e o da
  // WEB, e a rota /pin-local responde 200 com um PIN valido — de proposito. Se a pagina
  // publicada pedir esse caminho, ela entra com um PIN que veio de um servidor que nao e a
  // maquina do dono. A cobranca e sobre o PEDIDO, nao sobre o resultado: `pinPedidos` tem de
  // ser ZERO. E o defeito que ela pega e de uma linha — `if(!LOCAL || ses) return;` virando
  // `if(ses) return;` numa limpeza distraida.
  {
    const { ctx, pag, erros, escritas, autenticacoes, pinPedidos } = await palco(nav, {
      pinLocal: '87654321', escrita: 'fechada',
    });
    await falarNaConversa(pag, 'oi da cena 21');
    const e = await estado(pag);
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(pinPedidos.length === 0, 'a pagina NAO pede /pin-local fora do localhost', pinPedidos.join(','));
    ok(autenticacoes.filter(a => a.rota === 'senha').length === 0,
      'e nenhuma entrada silenciosa acontece', JSON.stringify(autenticacoes.map(a => a.rota)));
    ok(e.auth === 'fora', 'na web continua valendo o portao (data-auth=fora)', e.auth);
    ok(e.sessao === null, 'nenhuma sessao foi criada por um PIN vindo de fora', String(e.sessao));
    ok(e.loginVisivel, 'e o 401 continua abrindo o login, como na cena 2');
    ok(escritas[0] && escritas[0].aut === 'Bearer ' + PUB, 'o POST saiu com a publicavel, como sempre', escritas[0] && escritas[0].aut);
    await ctx.close();
  }

  // ---------------------------------------------------------------- 22
  console.log('\n[22] PIN LOCAL RECUSADO — cai no comportamento de sempre, e sem queimar tentativa');
  cenas++;
  // O arquivo existe e esta DESATUALIZADO (o dono trocou o PIN e esqueceu de reescrever). Tres
  // coisas se cobram, e a terceira e a menos obvia: (1) tenta UMA vez, sem laco — martelar o
  // endpoint de entrada com um PIN que ja se sabe errado e o caminho mais curto para o rate
  // limit do GoTrue; (2) o toast honesto continua, porque a fila continua presa; (3) o contador
  // de erros de PIN NAO conta, porque ele existe para quem esta DIGITANDO parar de martelar o
  // proprio celular — cinco cargas de pagina com um arquivo velho trancariam o dono por 30 s
  // sem ele ter tocado em nada.
  {
    const { ctx, pag, erros, escritas, autenticacoes, pinPedidos } = await palco(nav, {
      local: true, pinLocal: '00000000', senha: 'errada', escrita: 'fechada',
    });
    await falarNaConversa(pag, 'oi da cena 22');
    await pag.waitForTimeout(300);
    const e = await estado(pag);
    const toast22 = await pag.textContent('#toast');
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(pinPedidos.length === 1, 'pediu /pin-local uma vez', String(pinPedidos.length));
    ok(autenticacoes.filter(a => a.rota === 'senha').length === 1,
      'e tentou o PIN UMA vez — sem laco de retry', JSON.stringify(autenticacoes.map(a => a.rota)));
    ok(e.auth === 'local', 'segue em localhost sem sessao (data-auth=local)', e.auth);
    ok(e.sessao === null, 'nenhuma sessao foi inventada depois da recusa', String(e.sessao));
    ok(!e.loginVisivel, 'o portao continua sem aparecer — o PIN e do dono, nao ha o que digitar aqui');
    ok(e.erros === null, 'a recusa do auto-login NAO conta como erro de quem digita', String(e.erros));
    ok(escritas[0] && escritas[0].aut === 'Bearer ' + PUB, 'a escrita saiu anonima, como antes', escritas[0] && escritas[0].aut);
    ok(e.fila === 1, 'a resposta ficou guardada na fila local', String(e.fila));
    ok(/PENDENTES 57/.test(toast22 || ''), 'e o toast honesto continua, dizendo onde mexer', toast22);
    ok(/mesa-pin\.local/.test(toast22 || ''), 'nomeando o arquivo que resolve', toast22);
    await ctx.close();
  }

  // ---------------------------------------------------------------- 23
  console.log('\n[23] A ROTA DO SERVIDOR — /pin-local so existe para o loopback');
  cenas++;
  // A unica cena sem navegador, e ela e assim porque TEM de ser: a regra e sobre o
  // remoteAddress do socket, e nao ha como abrir um socket nao-loopback contra um servidor que
  // escuta em 127.0.0.1. Chamar `atender` com um `req` de mentira e o unico jeito de ver a
  // regra valendo — e ve-la valendo e a diferenca entre ter a regra e achar que se tem.
  // O arquivo do PIN aqui e NOSSO, com um PIN inventado: ~/.mesa-brasil-pin e do dono e ninguem
  // o le, nem este teste (um log de falha imprimiria o PIN dele).
  {
    const pinLocal = require(MOD_PIN);
    const ARQ = path.join(__dirname, 'tmp-pin-local-cena23.txt');
    const PIN_FALSO = '90071992';
    fs.writeFileSync(ARQ, PIN_FALSO + '\r\n');
    const AUSENTE = path.join(__dirname, 'tmp-pin-local-que-nao-existe.txt');
    try { fs.unlinkSync(AUSENTE); } catch (e) { /* ja nao existia */ }

    // Um `res` de mentira que so anota o que lhe pediram. E um `console` capturado, porque
    // "o PIN nunca vai para o log" e uma afirmacao, e afirmacao sem medida e o que este
    // repositorio inteiro existe para evitar.
    // `host` e o 5o argumento e cai em 'localhost:8203' por padrao, para as chamadas antigas
    // seguirem medindo o que mediam. O DNS rebinding (cena abaixo) o troca por 'evil.com'.
    function chamar(metodo, url, endereco, arquivo, host) {
      const r = { st: 0, cab: null, corpo: null };
      const res = {
        writeHead(st, cab) { r.st = st; r.cab = cab; return res; },
        end(c) { r.corpo = c == null ? '' : String(c); return res; },
      };
      const req = { method: metodo, url, socket: { remoteAddress: endereco },
        headers: { host: host === undefined ? 'localhost:8203' : host } };
      const impressos = [];
      const guarda = ['log', 'info', 'warn', 'error'].map(n => {
        const orig = console[n];
        console[n] = function () { impressos.push(Array.prototype.join.call(arguments, ' ')); };
        return { n, orig };
      });
      let atendeu;
      try { atendeu = pinLocal.atender(req, res, arquivo === undefined ? ARQ : arquivo); }
      finally { guarda.forEach(g => { console[g.n] = g.orig; }); }
      return { atendeu, impressos, r };
    }

    for (const end of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) {
      const c = chamar('GET', '/pin-local', end);
      ok(c.atendeu === true && c.r.st === 200 && c.r.corpo === PIN_FALSO,
        'loopback ' + end + ' recebe o PIN, sem o \\r\\n do arquivo', c.r.st + ' / ' + JSON.stringify(c.r.corpo));
      ok(!!c.r.cab && c.r.cab['Cache-Control'] === 'no-store',
        'e a resposta nao fica em cache (' + end + ')', c.r.cab && c.r.cab['Cache-Control']);
      ok(c.impressos.length === 0, 'e NADA vai para o log (' + end + ')', c.impressos.join(' | '));
    }
    for (const end of ['10.0.0.5', '192.168.1.7', '::ffff:192.168.1.7', '203.0.113.9', '']) {
      const c = chamar('GET', '/pin-local', end);
      ok(c.atendeu === false && c.r.st === 0,
        'endereco NAO-loopback ' + JSON.stringify(end) + ' nao e atendido — cai no 404 do servidor, igual a rota inexistente',
        'atendeu=' + c.atendeu + ' status=' + c.r.st + ' corpo=' + JSON.stringify(c.r.corpo));
      ok(c.impressos.length === 0, 'e o PIN nao vaza para o log nem na recusa', c.impressos.join(' | '));
    }
    // DNS REBINDING (S2 da auditoria, 22/08). O socket e loopback — o atacante fez o dominio
    // dele resolver para 127.0.0.1 — mas o Host e o dele. Sem a conferencia do Host, o navegador
    // da vitima entrega o PIN de volta a evil.com. A cobranca: Host que nao e local NAO e
    // atendido, mesmo por loopback, e o PIN nao vai para o corpo nem para o log.
    for (const host of ['evil.com', 'attacker.example:8203', 'brasil.test', 'meu-site.com:80']) {
      const c = chamar('GET', '/pin-local', '127.0.0.1', undefined, host);
      ok(c.atendeu === false && c.r.st === 0 && c.r.corpo === null,
        'Host "' + host + '" sobre loopback NAO recebe o PIN (DNS rebinding fechado)',
        'atendeu=' + c.atendeu + ' status=' + c.r.st + ' corpo=' + JSON.stringify(c.r.corpo));
      ok(c.impressos.length === 0, 'e o PIN nao vaza para o log no rebinding (' + host + ')', c.impressos.join(' | '));
    }
    // e o Host local, nas formas que valem, continua entrando
    for (const host of ['localhost', 'localhost:8203', '127.0.0.1', '127.0.0.1:8200', '[::1]', '[::1]:8199']) {
      ok(chamar('GET', '/pin-local', '127.0.0.1', undefined, host).atendeu === true,
        'Host local "' + host + '" continua sendo atendido');
    }
    ok(chamar('GET', '/pin-local', '127.0.0.1', undefined, '').atendeu === false, 'Host vazio nao e atendido');
    ok(chamar('GET', '/pin-local?v=2', '127.0.0.1').atendeu === true, 'a query string nao esconde a rota');
    ok(chamar('POST', '/pin-local', '127.0.0.1').atendeu === false, 'POST /pin-local nao e atendido (a rota e GET)');
    ok(chamar('GET', '/pin-local/mais', '127.0.0.1').atendeu === false, 'e nem um caminho que apenas comeca igual');
    ok(chamar('GET', '/dashboard/', '127.0.0.1').atendeu === false, 'outro caminho segue para o servidor, intocado');
    const semArquivo = chamar('GET', '/pin-local', '127.0.0.1', AUSENTE);
    ok(semArquivo.atendeu === false && semArquivo.r.st === 0,
      'sem o arquivo do dono a rota nao existe — e o desfecho e o MESMO do nao-loopback',
      'atendeu=' + semArquivo.atendeu + ' status=' + semArquivo.r.st);
    const VAZIO = path.join(__dirname, 'tmp-pin-local-vazio.txt');
    fs.writeFileSync(VAZIO, '   \n');
    ok(chamar('GET', '/pin-local', '127.0.0.1', VAZIO).atendeu === false, 'arquivo em branco tambem nao vira rota');
    // O ARQUIVO MORA FORA DO DOCROOT (S1 da auditoria, 22/08). Enquanto ele vivia em
    // ferramentas/, `npm start` (que serve a RAIZ do repo) o entregava VERBATIM pelo caminho
    // estatico, sem passar por atender(). A prova de que essa porta morreu e esta: o caminho
    // padrao esta sob o homedir e NAO esta sob a arvore do repositorio — nao ha o que o servidor
    // estatico ache. ESTA VALE ATE SOB PIN_LOCAL_JS, e de proposito: uma copia defeituosa que NAO
    // mexe no ARQUIVO_PADRAO mantem a linha do homedir e passa; a copia do defeito "arquivo de
    // volta para ferramentas/" troca por path.join(__dirname, ...), e ai __dirname e test/ — a
    // igualdade com o homedir quebra e o controle ve o defeito morder. Fosse guardada por
    // `!PIN_LOCAL_JS`, esse defeito seria impossivel de pegar (a assercao dele ficaria de fora).
    {
      const os = require('os');
      const raiz = path.resolve(__dirname, '..');
      ok(pinLocal.ARQUIVO_PADRAO === path.join(os.homedir(), '.mesa-brasil-pin'),
        'o arquivo padrao mora no homedir (~/.mesa-brasil-pin), fora do repositorio', pinLocal.ARQUIVO_PADRAO);
      ok(pinLocal.ARQUIVO_PADRAO.indexOf(raiz + path.sep) !== 0,
        'e por construcao NAO esta sob a arvore do repo — nenhum docroot o alcanca (S1)', pinLocal.ARQUIVO_PADRAO);
      // Defesa em profundidade: se um dia um PIN reaparecer em ferramentas/, o git tem de
      // ignora-lo mesmo com o sufixo .txt que o Bloco de Notas cola sozinho. Sempre contra o
      // .gitignore REAL do repo (nao muda entre copia e original).
      const gi = fs.readFileSync(path.resolve(raiz, '.gitignore'), 'utf8');
      ok(/^ferramentas\/\*\.local\*$/m.test(gi) && /^ferramentas\/mesa-pin\*$/m.test(gi),
        'e o .gitignore guarda ferramentas/*.local* e mesa-pin* (defesa em profundidade)', '');
    }
    fs.unlinkSync(ARQ); fs.unlinkSync(VAZIO);
  }

  // ---------------------------------------------------------------- 24
  console.log('\n[24] PIN VELHO NAO QUEIMA COTA A CADA CARGA — recusado uma vez por sessao (S4)');
  cenas++;
  // O endpoint de entrada tem rate limit POR IP, e o login manual e o auto-login dividem o
  // balde. Um arquivo com o PIN velho fazia CADA carga gastar uma tentativa com um PIN que ja
  // se sabe errado, ate trancar o login de verdade. A cena carrega a MESMA aba duas vezes
  // (reload preserva o sessionStorage, que e onde o PIN recusado fica) e cobra que a segunda
  // carga NAO repita o grant_type=password.
  {
    const { ctx, pag, erros, autenticacoes, base } = await palco(nav, {
      local: true, pinLocal: '00000000', senha: 'errada', escrita: 'fechada',
    });
    await pag.waitForTimeout(300);
    const senha1 = autenticacoes.filter(a => a.rota === 'senha').length;
    ok(senha1 === 1, 'a primeira carga tenta o PIN uma vez', String(senha1));
    ok(erros.length === 0, 'zero erro de console na primeira carga', erros.join(' | '));
    // a segunda carga da MESMA aba: o sessionStorage lembra que aquele PIN foi recusado
    await pag.reload({ waitUntil: 'domcontentloaded' });
    await pag.waitForTimeout(400);
    const senha2 = autenticacoes.filter(a => a.rota === 'senha').length;
    ok(senha2 === 1, 'a segunda carga NAO repete o PIN recusado — a cota nao e queimada de novo', String(senha2));
    const e = await estado(pag);
    ok(e.auth === 'local', 'segue em localhost sem sessao', e.auth);
    ok(e.erros === null, 'e a recusa continua nao contando como erro de quem digita', String(e.erros));
    // a prova pela contramao: um PIN NOVO no arquivo volta a ser tentado na mesma sessao — o
    // que se bloqueia e repetir o MESMO errado, nao tentar de novo com um corrigido.
    await pag.unroute(base + '/**');
    await pag.route(base + '/**', r => {
      const p = new URL(r.request().url()).pathname;
      if (p === CAMINHO || p === CAMINHO + 'index.html')
        return r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(HTML) });
      if (p === '/pin-local') return r.fulfill({ status: 200, contentType: 'text/plain', body: '11112222' });
      return r.fulfill({ status: 404, contentType: 'text/plain', body: '404' });
    });
    await pag.reload({ waitUntil: 'domcontentloaded' });
    await pag.waitForTimeout(400);
    const senha3 = autenticacoes.filter(a => a.rota === 'senha').length;
    ok(senha3 === 2, 'um PIN NOVO no arquivo e tentado (bloqueia o errado repetido, nao a correcao)', String(senha3));
    await ctx.close();
  }

  await nav.close();
  console.log('\n' + (falhas ? 'REPROVOU: ' + falhas + ' verificacao(oes) em ' + cenas + ' cenas'
    : 'PASSOU: ' + cenas + ' cenas, nenhuma falha'));
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
