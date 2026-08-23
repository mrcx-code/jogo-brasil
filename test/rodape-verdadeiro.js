// test/rodape-verdadeiro.js — O RODAPE DO DASHBOARD TEM DE DIZER A VERDADE (PENDENTES 60)
//
// POR QUE ESTE ARQUIVO EXISTE. Em 23/08 o juridico leu o rodape contra o codigo, linha a linha,
// e achou tres furos numa frase so: (1) "ate voce sair" valia para a sessao e NAO para o
// contador de erros de PIN, que so morria em login OK; (2) a fila local — ate 50 itens, 200 KB
// do texto que o dono escreveu, e a MAIOR das tres — nao era citada; (3) um PIN em claro no
// sessionStorage. Nada disso foi mentira deliberada: as tres chaves nasceram DEPOIS da frase, e
// ninguem tinha um motivo para reler o rodape ao acrescentar uma. E assim que uma promessa de
// privacidade apodrece — nao por ma-fe, por acumulo.
//
// Entao a regra que este portao prega e simples e mecanica: TODA CHAVE QUE A PAGINA GRAVA TEM DE
// ESTAR NA TABELA ABAIXO, e cada linha da tabela tem de achar a frase dela no rodape. Chave nova
// sem frase nova = exit 1. A proxima quebra este teste em vez de virar mentira silenciosa.
//
// COMO ELE PROCURA AS CHAVES — dois metodos, e os dois tem limite declarado:
//
//   (A) EM EXECUCAO. Um `addInitScript` embrulha `Storage.prototype.setItem` ANTES de qualquer
//       script da pagina rodar e anota (onde, chave) de cada gravacao; no fim, soma a isso as
//       chaves realmente presentes nos dois armazenamentos (`Object.keys`), que pega tambem o
//       que tenha entrado por caminho torto, como `localStorage.foo = 1`.
//       LIMITE: so ve o que as cenas daqui EXERCITAM. Um caminho que este arquivo nunca aciona
//       nao grava nada e passa despercebido. Por isso existe o (B).
//
//   (B) ESTATICO, sobre o texto do arquivo. Le cada `setItem(` e resolve o 1o argumento: aceita
//       string literal, ou identificador declarado como `var NOME="mesa-brasil-..."`. Argumento
//       que ele NAO consegue resolver e REPROVACAO, nao silencio — a armadilha classica de uma
//       varredura por regex e achar que "nao encontrei" quer dizer "nao existe". Ele confere
//       tambem que todo `setItem(` do arquivo foi visto por essa conta, e varre atribuicao
//       direta de propriedade (`localStorage.x = ...`).
//       LIMITE: chave montada em tempo de execucao (concatenacao, template, indireta por
//       variavel reatribuida) ele NAO resolve — e por isso ele REPROVA ao inves de ignorar.
//
// Alem das chaves, ele cobra as afirmacoes que o rodape faz sobre COMPORTAMENTO, e cobra na
// pratica, nao no texto: o que o rodape diz que some ao sair some mesmo (sair() e chamado de
// verdade, pelo botao), o que ele diz que fica continua la, o PIN nao fica guardado nem quando
// ha sessao viva e valor legado (cena 6), e a fila sobe sozinha quando a rede volta (cena 7).
//
// AS CENAS 6 E 7 EXISTEM PORQUE ESTE ARQUIVO JA FALHOU UMA VEZ, E DA FORMA MAIS CONSTRANGEDORA
// POSSIVEL: o commit que o criou para tirar tres frases falsas do rodape embarcou uma QUARTA
// frase falsa ("ela sobe sozinha assim que a rede volta" — nao subia) e deixou vivo um PIN em
// claro num caminho que afirmava ter fechado. As duas passaram porque as cenas de entao cobravam
// que a FRASE EXISTISSE, nao que ela fosse VERDADE. Lição 2.8 num lugar novo: nao basta o portao
// morder, ele tem de morder a AFIRMACAO. Toda linha nova de rodape que prometa comportamento
// precisa de uma cena que exercite esse comportamento pelo caminho da pessoa.
//
// COMO VER ELE REPROVANDO (lição 2.8 do EQUIPE.md — instrumento nunca visto reprovando e
// decoração):
//     RODAPE_ISCA=chave node test/rodape-verdadeiro.js     # grava uma chave-isca: tem de dar 1
//     RODAPE_HTML=<copia mutilada> node test/rodape-verdadeiro.js   # rodape sem uma frase
//
// Exit 0 = tudo verdadeiro. Exit 1 = o rodape mente em algum ponto. Exit 2 = o teste envelheceu.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const HTML = process.env.RODAPE_HTML
  ? path.resolve(process.env.RODAPE_HTML)
  : path.resolve(__dirname, '..', 'dashboard', 'index.html');
const ISCA = process.env.RODAPE_ISCA || '';
const HOST_WEB = 'https://mesa.brasil.test';
const HOST_LOCAL = 'http://localhost:8199';
const CAMINHO = '/dashboard/';
const SB = 'https://hdhqziqvrthxtgyraemk.supabase.co';
const EMAIL_DONO = 'dono@mesa.brasil';
// Um PIN improvavel de aparecer por acaso dentro de um token ou de um JSON — e o que a cena do
// segredo procura nos valores guardados.
const PIN_DO_ARQUIVO = '31415926';

// ============================ A TABELA — chave por chave, frase por frase ============================
// `diz` sao as frases que o rodape TEM de conter por causa desta chave. `fica` responde a
// pergunta "e depois de sair?", e e cobrada com o botao de sair, nao com o texto.
const CHAVES = [
  {
    chave: 'mesa-brasil-sessao1', onde: 'localStorage', fica: false,
    oque: 'a sessao (access_token + refresh_token)',
    diz: [/\bsess[ãa]o\b/i, /apagad\w+ quando voc[êe] sai/i],
  },
  {
    chave: 'mesa-brasil-pin-erros', onde: 'localStorage', fica: false,
    oque: 'o contador de erros de PIN (UX, nao seguranca)',
    diz: [/contador de erros de PIN/i, /apagad\w+ quando voc[êe] sai/i],
  },
  {
    chave: 'mesa-brasil-fila4', onde: 'localStorage', fica: true,
    oque: 'a fila local das respostas que ainda nao subiram — ate 50 itens / 200 KB do texto do dono',
    diz: [/fila de respostas/i, /n[ãa]o some ao sair/i, /50/, /200/],
  },
  {
    chave: 'mesa-brasil-pin-local-recusado', onde: 'sessionStorage', fica: true,
    oque: 'a marca (derivacao PBKDF2, nunca o PIN) de que o PIN do arquivo local foi recusado',
    diz: [/marca de PIN recusado/i, /morre ao fechar a aba/i, /deriva[çc][ãa]o/i],
  },
];
const CONHECIDA = c => CHAVES.some(k => k.chave === c);

let falhas = 0, cenas = 0;
function ok(cond, msg, extra) {
  if (cond) { console.log('  ok  ' + msg); return true; }
  const curto = extra == null ? '' : String(extra).slice(0, 240);
  falhas++; console.log('  FALHOU  ' + msg + (curto ? '  <- ' + curto : ''));
  return false;
}
function parou(msg) { console.log('PAROU: ' + msg); process.exit(2); }

const fonte = fs.readFileSync(HTML, 'utf8');

// ============================ O RODAPE, como texto ============================
function textoDoRodape(html) {
  const m = html.match(/<footer class="rod">([\s\S]*?)<\/footer>/);
  if (!m) parou('nao achei <footer class="rod"> em ' + HTML + ' — o teste envelheceu ou o alvo e outro');
  return m[1]
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================ (B) A VARREDURA ESTATICA ============================
// Resolve o 1o argumento de cada setItem. Devolve {chaves, naoResolvidos, avulsos, props}.
function varrerFonte(src) {
  const decl = {};
  const reDecl = /\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*"([^"]+)"/g;
  let m;
  while ((m = reDecl.exec(src))) decl[m[1]] = m[2];

  const chaves = new Set(), naoResolvidos = [];
  const reSet = /([A-Za-z_$][\w$]*)\s*\.\s*setItem\(\s*([^,]+?)\s*,/g;
  let vistos = 0;
  while ((m = reSet.exec(src))) {
    vistos++;
    const obj = m[1], arg = m[2].trim();
    if (obj !== 'localStorage' && obj !== 'sessionStorage') {
      naoResolvidos.push('objeto desconhecido: ' + obj + '.setItem(' + arg + ')');
      continue;
    }
    const lit = arg.match(/^"([^"]*)"$/) || arg.match(/^'([^']*)'$/);
    if (lit) { chaves.add(lit[1]); continue; }
    if (Object.prototype.hasOwnProperty.call(decl, arg)) { chaves.add(decl[arg]); continue; }
    naoResolvidos.push('1o argumento nao resolvido: ' + obj + '.setItem(' + arg + ', …)');
  }
  // Todo `setItem(` do arquivo passou pela conta acima? Se um escapou, a regex nao cobre a forma
  // que ele usa — e um teste que finge cobrir tudo e pior que um que declara o que cobre.
  const total = (src.match(/\.setItem\(/g) || []).length;
  const avulsos = total - vistos;
  // Atribuicao direta de propriedade nao passa por setItem nenhum.
  const props = [];
  const reProp = /(localStorage|sessionStorage)\s*\.\s*([A-Za-z_$][\w$]*)\s*=(?!=)/g;
  const METODOS = ['setItem', 'getItem', 'removeItem', 'clear', 'key', 'length'];
  while ((m = reProp.exec(src))) if (METODOS.indexOf(m[2]) < 0) props.push(m[1] + '.' + m[2]);
  return { chaves: [...chaves], naoResolvidos, avulsos, props };
}

// ============================ O PALCO ============================
function tokenJson(acesso) {
  return JSON.stringify({
    access_token: acesso, refresh_token: 'refresh-' + acesso, token_type: 'bearer',
    expires_in: 3600, user: { id: 'uuid-do-dono', email: EMAIL_DONO },
  });
}

async function palco(nav, plano) {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  // O GRAVADOR, antes de tudo: embrulha Storage.prototype.setItem para que NENHUMA gravacao da
  // pagina passe sem ser anotada — inclusive as de chave montada por variavel, que a varredura
  // estatica nao alcanca. E o motivo de o metodo (A) existir ao lado do (B).
  await ctx.addInitScript(() => {
    window.__CHAVES = [];
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      try {
        window.__CHAVES.push({
          onde: this === window.localStorage ? 'localStorage'
            : (this === window.sessionStorage ? 'sessionStorage' : 'outro'),
          chave: String(k),
        });
      } catch (e) { /* anotar nunca pode quebrar a pagina medida */ }
      return orig.apply(this, arguments);
    };
  });
  if (ISCA === 'chave') {
    // A ISCA (ver o cabecalho): uma chave que o rodape nao menciona, gravada de proposito.
    await ctx.addInitScript(() => { localStorage.setItem('mesa-brasil-isca', '1'); });
  }
  if (plano.sessao) {
    await ctx.addInitScript(s => localStorage.setItem('mesa-brasil-sessao1', s), JSON.stringify(plano.sessao));
  }
  if (plano.pinErros) {
    await ctx.addInitScript(s => localStorage.setItem('mesa-brasil-pin-erros', s), JSON.stringify(plano.pinErros));
  }
  // O ESTADO HERDADO DE ONTEM: o PIN em claro que o JS da versao anterior gravou. Nao e cenario
  // inventado — e o que existe hoje na aba do plantao que atravessou um deploy.
  if (plano.pinRecusadoCru) {
    await ctx.addInitScript(s => sessionStorage.setItem('mesa-brasil-pin-local-recusado', s), plano.pinRecusadoCru);
  }
  const pag = await ctx.newPage();
  const erros = [];
  pag.on('pageerror', e => erros.push('pageerror: ' + e.message));
  pag.on('console', m => {
    if (m.type() !== 'error') return;
    if (/^Failed to load resource/.test(m.text())) return;
    erros.push(m.text());
  });

  const base = plano.local ? HOST_LOCAL : HOST_WEB;
  await pag.route(base + '/**', r => {
    const p = new URL(r.request().url()).pathname;
    if (p === CAMINHO || p === CAMINHO + 'index.html')
      return r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(HTML) });
    if (p === '/pin-local' && plano.pinLocal)
      return r.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', body: plano.pinLocal });
    return r.fulfill({ status: 404, contentType: 'text/plain', body: '404' });
  });
  await pag.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await pag.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 200, body: '' }));
  await pag.route(SB + '/**', rota => {
    const req = rota.request(), url = req.url();
    if (url.indexOf('/auth/v1/token') >= 0) {
      if (url.indexOf('grant_type=password') >= 0) {
        if (plano.senha === 'errada')
          return rota.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"invalid_grant"}' });
        return rota.fulfill({ status: 200, contentType: 'application/json', body: tokenJson('tok-novo') });
      }
      return rota.fulfill({ status: 200, contentType: 'application/json', body: tokenJson('tok-fresco') });
    }
    if (url.indexOf('/auth/v1/logout') >= 0) return rota.fulfill({ status: 204, body: '' });
    if (req.method() === 'POST' && url.indexOf('/rest/v1/mesa_resposta') >= 0) {
      // `plano.escrita` e lido A CADA pedido de proposito: a cena 7 o vira de 'fechada' para
      // 'ok' no meio, que e como se simula "a rede voltou" sem recarregar nada.
      if (plano.escrita === 'ok') return rota.fulfill({ status: 201, contentType: 'application/json', body: '' });
      return rota.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"row-level security"}' });
    }
    return rota.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await pag.goto(base + CAMINHO, { waitUntil: 'domcontentloaded' });
  if (!await pronta(pag)) parou('a pagina nao terminou a partida em 15 s — nada abaixo mediria o que diz medir');
  return { ctx, pag, erros };
}

// ESPERA QUE NAO ESTOURA O RELOGIO (emprestada do fila-auth.js): devolve false em vez de derrubar
// a cena, para a assercao falar em vez de o teste morrer sem dizer por que.
async function esperar(pag, fn, ms) {
  const ate = Date.now() + (ms == null ? 8000 : ms);
  for (;;) {
    let v = false;
    try { v = await pag.evaluate(fn); } catch (e) { v = false; }
    if (v) return true;
    if (Date.now() > ate) return false;
    await pag.waitForTimeout(50);
  }
}

// A PARTIDA TERMINOU? `data-auth` e escrito por `pintarConta()` dentro do bloco sincrono da
// partida. Como JS e uma linha so, ve-lo de fora significa que o bloco INTEIRO rodou — inclusive
// o `lerMarca()` que apaga o PIN herdado. E ancora determinista, nao um `waitForTimeout` no
// escuro: medido, a carga fria desta pagina levou 4112 ms (a fria; as quentes, 358 a 506 ms), e
// era exatamente isso que fazia uma espera fixa de 900 ms reprovar a esmo.
const pronta = pag => esperar(pag, () => !!document.body.getAttribute('data-auth'), 15000);

// Tudo o que a pagina gravou: o que o gravador anotou MAIS o que esta la de fato (Object.keys
// pega ate o que tenha entrado por atribuicao direta de propriedade).
const colher = pag => pag.evaluate(() => {
  const anot = (window.__CHAVES || []).map(x => x.onde + ':' + x.chave);
  const presentes = [];
  const vals = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i); presentes.push('localStorage:' + k); vals['localStorage:' + k] = localStorage.getItem(k);
  }
  for (let i = 0; i < sessionStorage.length; i++) {
    const k = sessionStorage.key(i); presentes.push('sessionStorage:' + k); vals['sessionStorage:' + k] = sessionStorage.getItem(k);
  }
  return { anotadas: anot, presentes, valores: vals };
});

// Escreve na conversa e ESPERA A RESPOSTA CAIR NA FILA — que e o desfecho de que as cenas
// dependem quando o servidor recusa. Devolve false se ela nao caiu, para a cena decidir.
async function falar(pag, texto) {
  await pag.fill('#compor-txt', texto);
  await pag.click('#compor-btn');
  return esperar(pag, () => JSON.parse(localStorage.getItem('mesa-brasil-fila4') || '[]').length > 0);
}
const naFila = pag => pag.evaluate(() => JSON.parse(localStorage.getItem('mesa-brasil-fila4') || '[]').length);

(async () => {
  console.log('RODAPE VERDADEIRO — ' + path.relative(process.cwd(), HTML) + (ISCA ? '   [ISCA: ' + ISCA + ']' : ''));
  const rodape = textoDoRodape(fonte);
  console.log('\nO RODAPE, como o dono le:\n  ' + rodape.replace(/\. /g, '.\n  '));

  // ---------------------------------------------------------------- 1
  console.log('\n[1] A TABELA ACHA A FRASE DE CADA CHAVE NO RODAPE');
  cenas++;
  for (const k of CHAVES) {
    for (const re of k.diz)
      ok(re.test(rodape), 'o rodape diz ' + re + ' (por causa de ' + k.chave + ')', k.oque);
  }

  // ---------------------------------------------------------------- 2
  console.log('\n[2] VARREDURA ESTATICA — todo setItem do arquivo aponta para chave da tabela');
  cenas++;
  const v = varrerFonte(fonte);
  ok(v.avulsos === 0, 'todo `.setItem(` do arquivo foi lido pela conta (nenhuma forma escapou)', 'escaparam ' + v.avulsos);
  ok(v.naoResolvidos.length === 0, 'nenhum setItem com chave que a varredura nao resolve', v.naoResolvidos.join(' | '));
  ok(v.props.length === 0, 'ninguem grava por atribuicao direta de propriedade', v.props.join(' | '));
  ok(v.chaves.length > 0, 'a varredura achou chaves (se achasse zero, ela estaria quebrada)', String(v.chaves.length));
  for (const c of v.chaves) ok(CONHECIDA(c), 'a chave ' + c + ' esta na tabela e portanto no rodape', 'chave nova, rodape velho');
  for (const k of CHAVES) ok(v.chaves.indexOf(k.chave) >= 0, 'a tabela nao tem linha morta: ' + k.chave + ' ainda e gravada', 'a chave sumiu do codigo');

  const nav = await chromium.launch();

  // ---------------------------------------------------------------- 3
  console.log('\n[3] EM EXECUCAO, EM LOCALHOST — fila local e a marca do PIN recusado');
  cenas++;
  {
    const { ctx, pag, erros } = await palco(nav, { local: true, pinLocal: PIN_DO_ARQUIVO, senha: 'errada' });
    ok(await falar(pag, 'resposta que nao sobe, para a fila encher'), 'a resposta recusada caiu na fila', 'nao caiu em 8 s');
    // A marca chega DEPOIS do 400 do /auth (fetch + PBKDF2). Medido: 358 a 506 ms na carga
    // quente e 4112 ms na fria — por isso se espera pelo FATO, nunca por um relogio.
    ok(await esperar(pag, () => !!sessionStorage.getItem('mesa-brasil-pin-local-recusado')),
      'a marca do PIN recusado foi escrita', 'nao apareceu em 8 s');
    const c = await colher(pag);
    const todas = [...new Set([...c.anotadas, ...c.presentes])];
    console.log('    gravou: ' + todas.join(', '));
    for (const t of todas) ok(CONHECIDA(t.split(':')[1]), 'gravou ' + t + ' — e o rodape menciona', 'chave sem frase');
    ok(c.presentes.indexOf('localStorage:mesa-brasil-fila4') >= 0, 'a fila local existe mesmo (a maior das tres)', c.presentes.join(','));
    ok(c.presentes.indexOf('sessionStorage:mesa-brasil-pin-local-recusado') >= 0, 'e ela esta guardada, nao so escrita', c.presentes.join(','));
    // O SEGREDO: nenhum valor guardado pode CONTER o PIN. Era exatamente isto que o item 3 do
    // PENDENTES 60 acusava, e e a unica cena que o prova em vez de acreditar no comentario.
    const comPin = Object.keys(c.valores).filter(k => String(c.valores[k]).indexOf(PIN_DO_ARQUIVO) >= 0);
    ok(comPin.length === 0, 'nenhum valor guardado contem o PIN em claro', comPin.join(','));
    const marca = c.valores['sessionStorage:mesa-brasil-pin-local-recusado'] || '';
    ok(/"sal"\s*:/.test(marca) && /"marca"\s*:/.test(marca), 'a marca e {sal, marca} — derivacao, nao credencial', marca.slice(0, 80));
    ok(erros.length === 0, 'zero erro de script na pagina', erros.join(' | '));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 4
  console.log('\n[4] "APAGADOS QUANDO VOCE SAI" — cobrado com o botao, nao com o texto');
  cenas++;
  {
    const { ctx, pag, erros } = await palco(nav, {
      sessao: { access_token: 'tok-velho', refresh_token: 'ref-velho', expira_em: Date.now() + 3600e3 },
      pinErros: { erros: 3, ate: 0 },
    });
    ok(await falar(pag, 'uma resposta presa na fila antes de sair'), 'a resposta recusada caiu na fila', 'nao caiu em 8 s');
    const antes = await colher(pag);
    ok(antes.presentes.indexOf('localStorage:mesa-brasil-sessao1') >= 0, 'antes de sair: a sessao esta la', antes.presentes.join(','));
    ok(antes.presentes.indexOf('localStorage:mesa-brasil-pin-erros') >= 0, 'antes de sair: o contador de erros esta la', antes.presentes.join(','));
    ok(antes.presentes.indexOf('localStorage:mesa-brasil-fila4') >= 0, 'antes de sair: a fila esta la', antes.presentes.join(','));

    await pag.click('#conta-btn');            // SAIR — o caminho da pessoa, nao um atalho por dentro
    ok(await esperar(pag, () => document.body.getAttribute('data-auth') === 'fora'),
      'o clique em Sair foi recebido (a conta volta a "fora")', 'a pagina nao saiu em 8 s');
    const depois = await colher(pag);
    console.log('    depois de sair: ' + depois.presentes.join(', '));
    // SEM ANISTIA (lição 2.8): chave que nem existia antes de sair nao vira "ok" de graca — ela
    // e DECLARADA fora da cena, em voz alta. Anistiar em silencio e como um filtro passa em 8 de
    // 8 telas com tres delas incapazes de reprovar.
    for (const k of CHAVES) {
      const alvo = k.onde + ':' + k.chave;
      const tinha = antes.presentes.indexOf(alvo) >= 0;
      const ta = depois.presentes.indexOf(alvo) >= 0;
      if (!tinha) { console.log('    (fora desta cena: ' + k.chave + ' nao foi gravada aqui — quem a cobra e a cena 3)'); continue; }
      if (k.fica) ok(ta, 'o rodape diz que ' + k.chave + ' FICA — e fica', 'sumiu ao sair, e o rodape promete que nao some');
      else ok(!ta, 'o rodape diz que ' + k.chave + ' some ao sair — e some', 'continua la depois de sair');
    }
    for (const t of [...new Set([...depois.anotadas, ...depois.presentes])])
      ok(CONHECIDA(t.split(':')[1]), 'gravou ' + t + ' — e o rodape menciona', 'chave sem frase');
    ok(erros.length === 0, 'zero erro de script na pagina', erros.join(' | '));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 5
  console.log('\n[5] O CONTADOR DE ERROS — escrito ao errar o PIN, e some ao sair depois');
  cenas++;
  {
    const { ctx, pag } = await palco(nav, { senha: 'errada' });
    await pag.click('#conta-btn');            // abre o portao de entrada
    await esperar(pag, () => !document.getElementById('login').hasAttribute('hidden'));
    await pag.fill('#login-pin', '12345678');
    await pag.click('#login-entrar');
    ok(await esperar(pag, () => !!localStorage.getItem('mesa-brasil-pin-erros')),
      'errar o PIN escreve o contador', 'nao apareceu em 8 s');
    const c = await colher(pag);
    for (const t of [...new Set([...c.anotadas, ...c.presentes])])
      ok(CONHECIDA(t.split(':')[1]), 'gravou ' + t + ' — e o rodape menciona', 'chave sem frase');
    const comPin = Object.keys(c.valores).filter(k => String(c.valores[k]).indexOf('12345678') >= 0);
    ok(comPin.length === 0, 'e o PIN digitado nao fica guardado em lugar nenhum', comPin.join(','));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 6
  console.log('\n[6] O PIN EM CLARO HERDADO MORRE NA PARTIDA — mesmo com sessao viva (B2)');
  cenas++;
  // ESTA CENA EXISTE PORQUE O PORTAO FALHOU. Ele foi escrito para o rodape nao mentir e, no
  // mesmo commit, deixou passar a mentira: a linha 453 promete que "o PIN em si nao fica
  // guardado", e a limpeza morava dentro de `pinJaRecusado`, que so roda no `autoLoginLocal`,
  // que desiste na primeira linha quando ha sessao. Com o dono entrado — o estado normal dele —
  // o segredo herdado de uma aba aberta durante o deploy sobrevivia a toda carga. O erro de
  // desenho foi cobrar que a FRASE EXISTA em vez de cobrar que ela seja VERDADE.
  {
    const { ctx, pag, erros } = await palco(nav, {
      local: true,
      sessao: { access_token: 'tok-velho', refresh_token: 'ref-velho', expira_em: Date.now() + 3600e3 },
      pinRecusadoCru: PIN_DO_ARQUIVO,          // exatamente o que o JS de ontem gravava
      pinLocal: PIN_DO_ARQUIVO, senha: 'errada',
    });
    const c1 = await colher(pag);
    const comPin1 = Object.keys(c1.valores).filter(k => String(c1.valores[k]).indexOf(PIN_DO_ARQUIVO) >= 0);
    ok(comPin1.length === 0, 'carga 1 com sessao viva: o PIN herdado NAO esta mais guardado', comPin1.join(','));
    // E nas cargas seguintes, que foi onde a sonda da seguranca o viu vivo (1, 2 e 3).
    await pag.reload({ waitUntil: 'domcontentloaded' });
    ok(await pronta(pag), 'a carga 2 terminou a partida', 'nao terminou em 15 s');
    const c2 = await colher(pag);
    const comPin2 = Object.keys(c2.valores).filter(k => String(c2.valores[k]).indexOf(PIN_DO_ARQUIVO) >= 0);
    ok(comPin2.length === 0, 'carga 2: idem — o segredo nao ressuscita', comPin2.join(','));
    for (const t of [...new Set([...c2.anotadas, ...c2.presentes])])
      ok(CONHECIDA(t.split(':')[1]), 'gravou ' + t + ' — e o rodape menciona', 'chave sem frase');
    ok(erros.length === 0, 'zero erro de script na pagina', erros.join(' | '));
    await ctx.close();
  }

  // ---------------------------------------------------------------- 7
  console.log('\n[7] "SOBE SOZINHA ASSIM QUE A REDE VOLTA" — a fila drena SEM recarregar (B1)');
  cenas++;
  // A outra metade da mesma licao: o rodape passou a PROMETER isto, e a cena 1 so conferia que a
  // frase estava escrita. Medido pela seguranca com a frase no ar e o codigo sem o ouvinte:
  // 1 item parado em t+3s, +8s, +16s e +25s, drenando so no reload.
  {
    const plano = { escrita: 'fechada' };
    const { ctx, pag, erros } = await palco(nav, plano);
    await falar(pag, 'resposta escrita com a rede caida');
    const presa = await naFila(pag);
    ok(presa === 1, 'com a rede recusando, a resposta fica na fila local', String(presa));

    plano.escrita = 'ok';                       // a rede voltou
    await ctx.setOffline(true);
    await ctx.setOffline(false);                // o evento `online` de verdade, nao um dispatch a mao
    // Sem reload, sem toque: so o tempo passando. O teto de 8 s e generoso para uma lavagem de
    // um item e MUITO menor que os 25 s em que a sonda da seguranca viu o item parado — e, o que
    // importa, ele nao pode virar anistia: sem o ouvinte, a fila nao drena NUNCA sem recarregar,
    // entao esperar mais nao salvaria o defeito (provado injetando-o: exit 1).
    const vazia = await esperar(pag, () => JSON.parse(localStorage.getItem('mesa-brasil-fila4') || '[]').length === 0);
    ok(vazia, 'a fila subiu sozinha quando a rede voltou — sem recarregar a pagina', 'continua presa depois de 8 s');
    ok(erros.length === 0, 'zero erro de script na pagina', erros.join(' | '));
    await ctx.close();
  }

  await nav.close();
  console.log('\n' + (falhas ? 'REPROVOU: ' + falhas + ' verificacao(oes) em ' + cenas + ' cenas'
    : 'PASSOU: ' + cenas + ' cenas, nenhuma falha'));
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
