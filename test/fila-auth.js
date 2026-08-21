// FILA-AUTH — o portao do login do dashboard, medido nos DOIS MUNDOS.
//
// Por que existe: a partir de 21/08 a fila `mesa_resposta` deixa de aceitar escrita anonima
// (ferramentas/fila-auth.sql). As politicas sao aplicadas no Supabase, fora daqui — entao a
// pagina tem de funcionar ANTES e DEPOIS de aplicarem, sem tocar em nada. Este instrumento
// exercita os dois mundos com o backend TODO simulado por `page.route`: nenhum pedido sai
// para o projeto de verdade, e nenhuma linha de teste entra na fila do dono.
//
// Ele reprova por EXIT CODE. Rode:  node test/fila-auth.js
//
// O que cada cena prova esta escrito no nome dela. Duas merecem aviso:
//   * "refresh recusado" e "refresh sem rede" parecem a mesma coisa e sao opostas — servidor
//     que RECUSA o refresh_token desloga; rede que CAI nao pode deslogar, senao o dono perde
//     a sessao toda vez que o metro entra no tunel.
//   * "mundo aberto" tem de continuar passando: enquanto o SQL nao for aplicado, deslogado
//     ainda escreve com a chave publicavel. Um portao que so mede o mundo novo nao percebe
//     que quebrou o de hoje.

const path = require('path');
const ABRIR = require('./abrir.js');
const { chromium } = require('playwright');

const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'dashboard', 'index.html'));
const SB = 'https://hdhqziqvrthxtgyraemk.supabase.co';
const PUB = 'sb_publishable_kR7pCuqZrPAr24Xdr0F4Nw_t1j5YUKN';

let falhas = 0, cenas = 0;
function ok(cond, msg, extra) {
  if (cond) { console.log('  ok  ' + msg); return true; }
  falhas++; console.log('  FALHOU  ' + msg + (extra ? '  <- ' + extra : ''));
  return false;
}

function tokenJson(acesso, seg) {
  return JSON.stringify({
    access_token: acesso, refresh_token: 'refresh-' + acesso, token_type: 'bearer',
    expires_in: seg == null ? 3600 : seg, user: { id: 'uuid-do-dono', email: 'dono@exemplo.test' }
  });
}

// Prepara uma pagina com TODO o backend simulado. `plano` decide o que cada rota responde.
async function palco(navegador, plano) {
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
  const erros = [], escritas = [], autenticacoes = [];
  if (plano.sessao) {
    await ctx.addInitScript(s => {
      localStorage.setItem('mesa-brasil-sessao1', s);
    }, JSON.stringify(plano.sessao));
  }
  const pag = await ctx.newPage();
  // "Failed to load resource: ... 401" e o navegador narrando a RESPOSTA que a cena pediu —
  // um 401 simulado de proposito nao e defeito da pagina. O que interessa e excecao de
  // script, que continua contando inteira.
  pag.on('console', m => {
    if (m.type() !== 'error') return;
    if (/^Failed to load resource/.test(m.text())) return;
    erros.push(m.text());
  });
  pag.on('pageerror', e => erros.push('pageerror: ' + e.message));

  // Fontes de fora: servidas vazias, para "falhou o recurso" nao virar erro de console e
  // envenenar a contagem que interessa.
  await pag.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await pag.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 200, body: '' }));

  await pag.route(SB + '/**', async rota => {
    const req = rota.request();
    const url = req.url();
    const aut = (req.headers()['authorization'] || '');
    if (url.indexOf('/auth/v1/otp') >= 0) {
      autenticacoes.push({ rota: 'otp', corpo: req.postDataJSON(), url });
      return rota.fulfill({ status: plano.otp || 200, contentType: 'application/json', body: '{}' });
    }
    if (url.indexOf('/auth/v1/verify') >= 0) {
      autenticacoes.push({ rota: 'verify', corpo: req.postDataJSON() });
      if (plano.verify === 'erro') return rota.fulfill({ status: 403, contentType: 'application/json', body: '{"msg":"Token has expired or is invalid"}' });
      return rota.fulfill({ status: 200, contentType: 'application/json', body: tokenJson('tok-novo') });
    }
    if (url.indexOf('/auth/v1/token') >= 0) {
      autenticacoes.push({ rota: 'refresh', corpo: req.postDataJSON() });
      if (plano.refresh === 'recusado') return rota.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"invalid_grant"}' });
      if (plano.refresh === 'semrede') return rota.abort('failed');
      return rota.fulfill({ status: 200, contentType: 'application/json', body: tokenJson('tok-fresco') });
    }
    if (url.indexOf('/auth/v1/user') >= 0) {
      return rota.fulfill({ status: 200, contentType: 'application/json', body: '{"email":"dono@exemplo.test"}' });
    }
    if (req.method() === 'POST' && url.indexOf('/rest/v1/mesa_resposta') >= 0) {
      escritas.push({ aut, corpo: req.postDataJSON() });
      const st = plano.escrita === 'fechada' ? 401 : 201;
      if (plano.escrita === 'semrede') return rota.abort('failed');
      return rota.fulfill({ status: st, contentType: 'application/json', body: st === 201 ? '' : '{"message":"new row violates row-level security policy"}' });
    }
    // leitura dos paineis: sempre aberta
    return rota.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await pag.goto(ALVO + (plano.hash || ''), { waitUntil: 'domcontentloaded' });
  await pag.waitForTimeout(450);
  return { ctx, pag, erros, escritas, autenticacoes };
}

async function falarNaConversa(pag, texto) {
  await pag.fill('#compor-txt', texto);
  await pag.click('#compor-btn');
  await pag.waitForTimeout(400);
}

const estado = pag => pag.evaluate(() => ({
  auth: document.body.getAttribute('data-auth'),
  loginVisivel: !document.getElementById('login').hasAttribute('hidden'),
  quem: document.getElementById('conta-quem').textContent,
  botao: document.getElementById('conta-btn').textContent,
  soLeitura: getComputedStyle(document.querySelectorAll('.so-leitura')[0]).display,
  fila: JSON.parse(localStorage.getItem('mesa-brasil-fila4') || '[]').length,
  sessao: localStorage.getItem('mesa-brasil-sessao1'),
  hash: location.hash
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
    ok(erros.length === 0, 'zero erro de console mesmo levando 401', erros.join(' | '));
    ok(e.loginVisivel, 'o 401 ABRE o login em vez de sumir com a resposta');
    ok(e.fila === 1, 'a resposta foi guardada na fila local', String(e.fila));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 3
  console.log('\n[3] A PORTA — e-mail, codigo, e a fila presa sai sozinha');
  cenas++;
  {
    const { ctx, pag, erros, escritas, autenticacoes } = await palco(nav, { escrita: 'fechada' });
    await falarNaConversa(pag, 'resposta que vai ficar presa');
    // o proprio 401 ja abriu o painel — clicar em "Entrar" agora o FECHARIA (e alternador)
    ok(await pag.isVisible('#login-email'), 'o campo de e-mail ja esta a mao depois do 401');
    await pag.fill('#login-email', 'dono@exemplo.test');
    await pag.click('#login-pedir');
    await pag.waitForTimeout(300);
    const passo2 = await pag.isVisible('#login-p2');
    ok(passo2, 'pedir o codigo leva ao passo 2');
    const pedido = autenticacoes.find(a => a.rota === 'otp');
    ok(!!pedido && pedido.corpo.email === 'dono@exemplo.test', 'o OTP foi pedido para o e-mail digitado');
    ok(!!pedido && pedido.url.indexOf('redirect_to=') > 0, 'o pedido leva redirect_to (o link magico volta para ca)');

    // dali em diante a escrita passa a ser aceita: e o que o SQL faz para quem entrou
    await pag.unroute(SB + '/**');
    const escritasDepois = [];
    await pag.route(SB + '/**', async rota => {
      const req = rota.request();
      if (req.url().indexOf('/auth/v1/verify') >= 0)
        return rota.fulfill({ status: 200, contentType: 'application/json', body: tokenJson('tok-novo') });
      if (req.method() === 'POST' && req.url().indexOf('/rest/v1/mesa_resposta') >= 0) {
        escritasDepois.push(req.headers()['authorization']);
        return rota.fulfill({ status: 201, contentType: 'application/json', body: '' });
      }
      return rota.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await pag.fill('#login-cod', '123456');
    await pag.click('#login-entrar');
    await pag.waitForTimeout(600);
    const e = await estado(pag);
    ok(erros.length === 0, 'zero erro de console no fluxo inteiro', erros.join(' | '));
    ok(e.auth === 'dentro', 'entrou');
    ok(!e.loginVisivel, 'o painel de login se fecha ao entrar');
    ok(e.botao.trim() === 'Sair', 'o botao vira Sair', e.botao);
    ok((e.quem || '').indexOf('dono@exemplo.test') >= 0, 'a conta aparece na barra', e.quem);
    ok(!!e.sessao && JSON.parse(e.sessao).refresh_token === 'refresh-tok-novo', 'os DOIS tokens ficam guardados');
    ok(escritasDepois.length >= 1 && escritasDepois[0] === 'Bearer tok-novo', 'a resposta presa saiu sozinha com o token do usuario', escritasDepois.join(','));
    ok(e.fila === 0, 'a fila local esvaziou', String(e.fila));
    void escritas;
    await ctx.close();
  }

  // ---------------------------------------------------------------- 4
  console.log('\n[4] SESSAO GUARDADA — voltar nao pede login de novo');
  cenas++;
  {
    const { ctx, pag, erros, escritas } = await palco(nav, {
      sessao: { access_token: 'tok-guardado', refresh_token: 'r1', expira_em: Date.now() + 3600e3, email: 'dono@exemplo.test' }
    });
    await falarNaConversa(pag, 'oi da cena 4');
    const e = await estado(pag);
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(e.auth === 'dentro', 'ja entra logado (login unico)');
    ok(e.soLeitura === 'none', 'as faixas de "modo leitura" somem', e.soLeitura);
    ok(escritas[0] && escritas[0].aut === 'Bearer tok-guardado', 'o POST leva o token do usuario', escritas[0] && escritas[0].aut);
    await ctx.close();
  }

  // ---------------------------------------------------------------- 5
  console.log('\n[5] TOKEN VENCIDO — renova sozinho antes de escrever');
  cenas++;
  {
    const { ctx, pag, erros, escritas, autenticacoes } = await palco(nav, {
      sessao: { access_token: 'tok-velho', refresh_token: 'r1', expira_em: Date.now() - 1000, email: 'dono@exemplo.test' }
    });
    await falarNaConversa(pag, 'oi da cena 5');
    const e = await estado(pag);
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(autenticacoes.some(a => a.rota === 'refresh'), 'o refresh foi chamado');
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
      sessao: { access_token: 'tok-velho', refresh_token: 'r1', expira_em: Date.now() - 1000, email: 'dono@exemplo.test' }
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
      sessao: { access_token: 'tok-velho', refresh_token: 'r1', expira_em: Date.now() - 1000, email: 'dono@exemplo.test' }
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
  console.log('\n[8] LINK MAGICO — voltar do e-mail com #access_token entra e limpa a barra');
  cenas++;
  {
    const { ctx, pag, erros } = await palco(nav, {
      hash: '#access_token=tok-do-link&refresh_token=r-do-link&expires_in=3600&token_type=bearer&type=magiclink'
    });
    const e = await estado(pag);
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(e.auth === 'dentro', 'o link do e-mail entra');
    ok(e.hash === '', 'o token some da barra de endereco', e.hash);
    ok(!!e.sessao && JSON.parse(e.sessao).access_token === 'tok-do-link', 'a sessao do link ficou guardada');
    await ctx.close();
  }

  // ---------------------------------------------------------------- 9
  console.log('\n[9] LINK COM ERRO — mostra o motivo, nao a tela quebrada');
  cenas++;
  {
    const { ctx, pag, erros } = await palco(nav, {
      hash: '#error=access_denied&error_description=Email+link+is+invalid+or+has+expired'
    });
    const e = await estado(pag);
    ok(erros.length === 0, 'zero erro de console', erros.join(' | '));
    ok(e.auth === 'fora', 'nao entra com link invalido');
    ok(e.loginVisivel, 'o login aparece explicando');
    ok(e.hash === '', 'a barra de endereco fica limpa', e.hash);
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

  await nav.close();
  console.log('\n' + (falhas ? 'REPROVOU: ' + falhas + ' verificacao(oes) em ' + cenas + ' cenas'
    : 'PASSOU: ' + cenas + ' cenas, nenhuma falha'));
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
