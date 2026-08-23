// O PORTÃO DA MEDIÇÃO DAS PÁGINAS — o que o bloco 17 do encaixe.js é para o jogo.
//
// O jogo tem um portão de privacidade desde 10/08 e as páginas da plataforma não tinham
// nenhum, porque não mediam nada. Desde 22/08 medem — uma abertura anônima por seção — e a
// regra do §3 do CLAUDE.md passa a valer para elas do mesmo jeito. Este arquivo é quem cobra.
//
// AS TRÊS PROMESSAS, e nenhuma delas é texto aqui: as três viram número.
//   (a) SÓ SAI UM EVENTO, e com uma propriedade de conteúdo só. O corpo de cada pedido é
//       aberto e conferido campo a campo, nas CINCO páginas — não numa amostra.
//   (b) ADBLOCK, 503 E SERVIDOR MUDO NÃO QUEBRAM A PÁGINA. Zero erro de console, zero erro
//       de página, e o conteúdo continua inteiro. É a promessa mais fácil de quebrar do
//       repositório: bastaria um `await`.
//   (c) DESLIGAR DESLIGA DE VERDADE. Não é "menos dados": é zero pedido. E religar volta a
//       medir, senão o interruptor seria uma porta de mão única disfarçada.
//
// E UM QUARTO, que é de arquitetura: a chave e o host das páginas são OS MESMOS do jogo,
// lidos de `ferramentas/medir-secao.js` e conferidos contra `src/jogo.ts`. Duas cópias de um
// endereço divergem em silêncio — os dois endereços do PostHog respondem 200 OK a qualquer
// coisa, e o sintoma de errar seria um painel vazio semanas depois (o erro de região de
// 10/08). Um portão que não cobra isso deixa passar o defeito mais caro possível.
//
// COMO. As páginas do disco são servidas a partir de uma origem https falsa, por
// interceptação — porque sob `file://` o bloco não manda nada (guarda deliberada, a mesma do
// jogo) e o teste passaria sem exercitar uma linha. Cada página abre num contexto próprio,
// então o `localStorage` de uma não contamina a outra.
//
// O AUTOTESTE (EQUIPE.md 2.8 — portão que nunca foi visto reprovando é decoração). No fim,
// TRÊS defeitos são injetados de propósito no HTML servido e o portão tem de MORDER os três:
// uma propriedade a mais no corpo, o interruptor que não desliga, e o teto que deixou de
// segurar um laço. Se um deles passar, este arquivo sai 1 dizendo que ele mesmo não presta.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const MED = require('../ferramentas/medir-secao.js');

const RAIZ = path.resolve(__dirname, '..');
const ORIGEM = 'https://medir-paginas.local/';

// As cinco páginas: pasta no disco, valor de `secao` esperado, e o marcador de que a página
// está VIVA. O marcador é conteúdo real de cada uma, não `document.title`: uma página que
// explodiu no primeiro script ainda tem título.
const PAGINAS = [
  { arq: 'historia/index.html',    secao: 'historia',    marcador: '.momento', minimo: 40 },
  { arq: 'glossario/index.html',   secao: 'glossario',   marcador: '.verbete', minimo: 150 },
  { arq: 'de-onde-vem/index.html', secao: 'de-onde-vem', marcador: '.ref',     minimo: 50 },
  { arq: 'territorio/index.html',  secao: 'territorio',  marcador: '.pl',      minimo: 5 },
  { arq: 'plataforma/index.html',  secao: 'porta',       marcador: 'a.card',   minimo: 4 },
];

let falhas = 0, passes = 0;
const log = (s) => console.log(s);
function ok(cond, msg) {
  if (cond) { passes++; console.log('  ok  ' + msg); }
  else { falhas++; console.log('  X   ' + msg); }
  return !!cond;
}
function sec(t) { console.log('\n=== ' + t); }

// ---------------------------------------------------------------- o servidor de mentira
//
// `modo` decide o que acontece com o pedido da medição:
//   adblock  — o navegador recusa, como um bloqueador faria
//   503      — o servidor responde erro
//   mudo     — aceita a conexão e NUNCA responde (o pior caso: é o que trava quem espera)
async function abrir(browser, pag, modo, op) {
  op = op || {};
  const html0 = fs.readFileSync(path.join(RAIZ, pag.arq), 'utf8');
  const html = op.remendo ? op.remendo(html0) : html0;
  const pg = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  // "JÁ CHEGUEI DESLIGADO" — a escolha guardada ANTES da primeira carga. É o caso que separa
  // "não manda" de "não grava": pelo botão, o identificador já nasceu na carga em que a
  // medição ainda estava ligada, e vê-lo lá não prova nada.
  if (op.jaDesligado) await pg.addInitScript(() => { try { localStorage.setItem('jogo_brasil_medir', 'nao'); } catch (e) {} });
  const pedidos = [];
  const ruins = [];
  pg.on('pageerror', (e) => ruins.push('PAGEERROR: ' + e.message));
  pg.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    // Pedido de rede que o NAVEGADOR recusou não é defeito da página — é exatamente o que
    // este arquivo está encenando, e um adblock de verdade escreve a mesma linha.
    if (/posthog|Failed to load resource|ERR_/i.test(t)) return;
    ruins.push('CONSOLE: ' + t);
  });
  await pg.route('**/*', async (route) => {
    const req = route.request();
    const u = req.url();
    if (u.indexOf(MED.MEDIDA_HOST) === 0) {
      pedidos.push({ url: u, corpo: req.postData(), cabecalhos: req.headers() });
      if (modo === 'adblock') return route.abort('blockedbyclient');
      if (modo === 'mudo') return;                        // aceita e nunca responde
      return route.fulfill({ status: 503, body: 'fora do ar' });
    }
    // A folha do Google Fonts é servida VAZIA em vez de abortada: abortar imprimiria um erro
    // de console e obrigaria o filtro acima a ficar mais largo — e filtro largo é como um
    // erro de verdade passa despercebido.
    if (/fonts\.(googleapis|gstatic)\.com/.test(u)) {
      return route.fulfill({ contentType: 'text/css', body: '' });
    }
    if (u === ORIGEM || u === ORIGEM.slice(0, -1)) {
      return route.fulfill({ contentType: 'text/html; charset=utf-8', body: html });
    }
    return route.abort();
  });
  const t0 = Date.now();
  await pg.goto(ORIGEM);
  if (op.desligar) {
    // desliga pelo BOTÃO do rodapé, como a pessoa desligaria, e recarrega
    await pg.waitForSelector('#medirBt');
    await pg.evaluate(() => document.getElementById('medirBt').click());
    pedidos.length = 0;
    await pg.reload();
  }
  // ERA waitForTimeout(op.espera || 900) para os dois casos, e eles pedem esperas OPOSTAS:
  //   · ligado    — a asserção é que o evento SAIU. Isso é um evento, e evento se espera.
  //   · desligado — a asserção é que NENHUM saiu. Ausência não tem estado a esperar: só o
  //                 relógio a prova, e por isso ele fica aqui, de propósito e por escrito.
  if (op.desligar) {
    await pg.waitForTimeout(op.espera || 900);
  } else {
    const tE = Date.now();
    while (!pedidos.length && Date.now() - tE < (op.teto || 30000)) await pg.waitForTimeout(50);
  }
  const vivo = await pg.evaluate(({ sel }) => ({
    nos: document.querySelectorAll(sel).length,
    botao: !!document.getElementById('medirBt'),
    rotulo: document.getElementById('medirBt') ? document.getElementById('medirBt').textContent : '',
    guardado: (function () { try { return localStorage.getItem('jogo_brasil_medir'); } catch (e) { return 'ERRO'; } })(),
    anon: (function () { try { return localStorage.getItem('jogo_brasil_anon'); } catch (e) { return 'ERRO'; } })(),
    frase: /abertura anônima/.test(document.body.innerText)
  }), { sel: pag.marcador });
  const ms = Date.now() - t0;
  const extra = op.depois ? await op.depois(pg, pedidos) : null;
  await pg.close();
  return { pedidos, ruins, vivo, ms, extra };
}

const corpos = (r) => r.pedidos.map((p) => { try { return JSON.parse(p.corpo || '{}'); } catch (e) { return {}; } });

// ---------------------------------------------------------------- a conferência de um corpo
//
// Separada em função porque o AUTOTESTE a reusa: é a MESMA régua que morde o defeito
// injetado, não uma cópia mais frouxa escrita para o controle passar.
function conferirCorpo(pag, c, cabecalhos, url, reprovar) {
  const diga = reprovar || ok;
  diga(c.event === MED.EVENTO, pag.secao + ': o evento é "' + MED.EVENTO + '" (veio "' + c.event + '")');
  const props = Object.keys(c.properties || {}).sort();
  const esperadas = ['$ip', '$lib', '$process_person_profile', 'secao'];
  diga(props.join(',') === esperadas.join(','),
    pag.secao + ': as propriedades são exatamente ' + esperadas.join(', ') + ' (vieram: ' + props.join(', ') + ')');
  diga(props.every((p) => MED.PERMITIDAS.indexOf(p) >= 0),
    pag.secao + ': nenhuma propriedade fora da lista branca');
  diga((c.properties || {}).secao === pag.secao,
    pag.secao + ': a propriedade `secao` diz "' + (c.properties || {}).secao + '"');
  diga(MED.SECOES.indexOf((c.properties || {}).secao) >= 0,
    pag.secao + ': e o valor está entre os cinco nomes aprovados');
  diga((c.properties || {}).$ip === null,
    pag.secao + ': manda `$ip: null` — o PostHog descarta o endereço em vez de guardar e geolocalizar');
  diga((c.properties || {}).$process_person_profile === false,
    pag.secao + ': e `$process_person_profile: false` — conta o evento sem abrir ficha de ninguém');
  diga(/^phc_/.test(c.api_key || ''),
    pag.secao + ': a chave do corpo é publicável (phc_) e é a única credencial nele');
  diga(/^[0-9a-f]{32}$/.test(c.distinct_id || ''),
    pag.secao + ': o identificador é um sorteio de 32 dígitos hex — não veio de nada seu');
  diga(!cabecalhos.cookie, pag.secao + ': e o pedido vai sem cookie nenhum (credentials omit)');
  diga(url.indexOf(MED.MEDIDA_HOST + '/') === 0,
    pag.secao + ': o endereço chamado é o único host aprovado (' + MED.MEDIDA_HOST + ')');
  diga(!/nome|email|e-mail|user|agent|referr|tela|screen|idioma|lang|fuso/i.test(
    JSON.stringify(c).replace(/"\$ip":/g, '""')),
    pag.secao + ': e o corpo inteiro não carrega palavra de identificação escondida');
}

(async () => {
  // ============================================================
  sec('1 · a fonte é UMA — a chave e o host das páginas são os do jogo');
  const jogoTs = fs.readFileSync(path.join(RAIZ, 'src', 'jogo.ts'), 'utf8');
  const kJogo = (jogoTs.match(/const MEDIDA_CHAVE = "([^"]*)";/) || [])[1];
  const eJogo = (jogoTs.match(/const ENDERECO_MEDIDA = "([^"]*)";/) || [])[1];
  ok(kJogo === MED.MEDIDA_CHAVE, 'a chave das páginas é byte a byte a do src/jogo.ts');
  ok(eJogo === MED.ENDERECO_MEDIDA, 'e o endereço também: ' + MED.ENDERECO_MEDIDA);
  ok(/^phc_[A-Za-z0-9]{20,}$/.test(MED.MEDIDA_CHAVE),
    'e ela é a PUBLICÁVEL — chave de serviço num arquivo que roda no navegador de outra pessoa é a conta inteira entregue');
  const construir = fs.readFileSync(path.join(RAIZ, 'ferramentas', 'construir.js'), 'utf8');
  ok(/require\('\.\/medir-secao\.js'\)\.MEDIDA_HOST/.test(construir),
    'e o build tira o MEDIDA_HOST da MESMA constante — a CSP do jogo e as páginas não têm como divergir');

  // ============================================================
  sec('2 · as cinco páginas, lidas do disco: um endereço, uma frase, um botão');
  for (const pag of PAGINAS) {
    const t = fs.readFileSync(path.join(RAIZ, pag.arq), 'utf8');
    const nEnd = (t.split(MED.ENDERECO_MEDIDA).length - 1);
    ok(nEnd === 1, pag.secao + ': o endereço da medição aparece UMA vez em ' + pag.arq + ' (achei ' + nEnd + ')');
    // Nenhum outro host: um `fetch` para qualquer outro lugar é rede nova sem ninguém ter dito.
    const outros = (t.match(/fetch\(\s*["'][^"']*["']/g) || []).filter((s) => s.indexOf('ENDERECO') < 0);
    ok(outros.length === 0, pag.secao + ': nenhum fetch com endereço literal fora da constante'
      + (outros.length ? ' — achei ' + outros[0] : ''));
    ok(t.indexOf('id="medirBt"') > 0, pag.secao + ': o interruptor está no rodapé da página');
    ok(/abertura anônima/.test(t) && /Sem nome, sem e-mail, sem IP, sem cookie/.test(t),
      pag.secao + ': e a frase de privacidade que ele torna verdadeira está ao lado dele');
    ok(/Desligar desliga de verdade, aqui e no jogo/.test(t),
      pag.secao + ': a frase diz que o interruptor é o MESMO do jogo — que é o que a chave compartilhada faz');
    ok(t.indexOf(MED.CHAVE_MEDIR) > 0 && t.indexOf(MED.CHAVE_ANON) > 0,
      pag.secao + ': e ele usa as chaves de localStorage do jogo (' + MED.CHAVE_MEDIR + ')');
  }

  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });

  // ============================================================
  sec('3 · adblock, 503 e servidor mudo: a página não sente, e o corpo é aberto');
  for (const pag of PAGINAS) {
    for (const modo of ['adblock', '503', 'mudo']) {
      const r = await abrir(browser, pag, modo).catch((e) => ({ erro: String(e) }));
      if (r.erro) { ok(false, pag.secao + '/' + modo + ': o teste explodiu — ' + r.erro); continue; }
      log('   [' + pag.secao + '/' + modo + '] ' + r.pedidos.length + ' pedido(s) | '
        + r.vivo.nos + ' ' + pag.marcador + ' na página | ' + r.ruins.length + ' erro(s) | carga em ' + r.ms + ' ms');
      ok(r.pedidos.length === 1,
        pag.secao + '/' + modo + ': saiu EXATAMENTE um pedido (' + r.pedidos.length + ')');
      ok(r.ruins.length === 0, r.ruins.length === 0
        ? pag.secao + '/' + modo + ': e a página não soltou um erro sequer'
        : pag.secao + '/' + modo + ': a página reclamou por causa da medição — ' + r.ruins[0]);
      ok(r.vivo.nos >= pag.minimo && r.vivo.botao && r.vivo.frase,
        pag.secao + '/' + modo + ': e o conteúdo seguiu inteiro (' + r.vivo.nos + ' >= ' + pag.minimo
        + ', botão e frase no lugar)');
      if (modo === 'adblock' && r.pedidos.length === 1) {
        conferirCorpo(pag, corpos(r)[0], r.pedidos[0].cabecalhos, r.pedidos[0].url);
        ok(/^[0-9a-f]{32}$/.test(r.vivo.anon || ''),
          pag.secao + ': o identificador ficou guardado no aparelho, e é só ele');
      }
    }
  }

  // ============================================================
  sec('4 · desligar desliga de verdade — zero pedido, e nada é sorteado');
  for (const pag of PAGINAS) {
    const r = await abrir(browser, pag, 'adblock', {
      desligar: true,
      // e RELIGAR volta a medir: interruptor de mão única seria pior que nenhum
      depois: async (pg) => {
        await pg.evaluate(() => document.getElementById('medirBt').click());
        const rotulo = await pg.evaluate(() => document.getElementById('medirBt').textContent);
        const guardado = await pg.evaluate(() => localStorage.getItem('jogo_brasil_medir'));
        return { rotulo, guardado };
      }
    }).catch((e) => ({ erro: String(e) }));
    if (r.erro) { ok(false, pag.secao + '/desligado: o teste explodiu — ' + r.erro); continue; }
    log('   [' + pag.secao + '/desligado] ' + r.pedidos.length + ' pedido(s) | rótulo "' + r.vivo.rotulo
      + '" | localStorage=' + r.vivo.guardado + ' | anon=' + (r.vivo.anon === null ? 'nenhum' : 'existe'));
    ok(r.pedidos.length === 0,
      pag.secao + '/desligado: ZERO pedido depois de desligar e recarregar (' + r.pedidos.length + ')');
    ok(r.vivo.guardado === 'nao', pag.secao + '/desligado: e a escolha persiste no aparelho');
    ok(r.vivo.rotulo.indexOf('desligada') >= 0,
      pag.secao + '/desligado: o rótulo do botão conta o estado ("' + r.vivo.rotulo + '")');
    ok(r.vivo.nos >= pag.minimo, pag.secao + '/desligado: a página continua inteira sem a medição');
    ok(r.extra && r.extra.guardado === 'sim' && r.extra.rotulo.indexOf('ligada') >= 0,
      pag.secao + '/desligado: e religar volta atrás — o interruptor tem os dois sentidos');
  }

  // ============================================================
  // 4b · QUEM CHEGA JÁ DESLIGADO. A cena acima mede o caminho da PESSOA — e por isso o
  //     identificador anônimo já existe nela: ele nasceu na primeira carga, quando a medição
  //     ainda estava ligada, antes de haver botão para tocar. Isso enganou a primeira versão
  //     deste arquivo, que reprovou cinco vezes acusando um defeito que não existia
  //     (EQUIPE.md 2.1: pergunte se o instrumento exercita o caminho certo).
  //     Aqui a escolha chega ANTES da página, que é o estado de quem já decidiu — e é só aqui
  //     que "desligado não GRAVA nada" pode ser afirmado.
  // ============================================================
  sec('4b · quem chega com a medição já desligada: nada sai e nada é gravado');
  for (const pag of PAGINAS) {
    const r = await abrir(browser, pag, 'adblock', { jaDesligado: true }).catch((e) => ({ erro: String(e) }));
    if (r.erro) { ok(false, pag.secao + '/jaDesligado: o teste explodiu — ' + r.erro); continue; }
    log('   [' + pag.secao + '/já desligado] ' + r.pedidos.length + ' pedido(s) | anon='
      + (r.vivo.anon === null ? 'nenhum' : r.vivo.anon));
    ok(r.pedidos.length === 0, pag.secao + '/já desligado: ZERO pedido (' + r.pedidos.length + ')');
    ok(r.vivo.anon === null,
      pag.secao + '/já desligado: e o identificador anônimo nem chega a ser sorteado — nada é gravado');
    ok(r.vivo.rotulo.indexOf('desligada') >= 0 && r.vivo.nos >= pag.minimo,
      pag.secao + '/já desligado: o rótulo já abre desligado e a página está inteira');
  }

  // ============================================================
  // 5 · O AUTOTESTE. Três defeitos injetados no HTML servido, e o portão tem de morder os
  //     três. Sem isto o arquivo inteiro seria uma promessa por escrito (EQUIPE.md 2.8).
  // ============================================================
  sec('5 · o portão visto REPROVANDO — três defeitos injetados de propósito');
  const CONTROLES = [
    {
      nome: 'propriedade a mais no corpo (a lista branca tem de morder)',
      remendo: (h) => h.replace('secao: SECAO', 'secao: SECAO, tela: screen.width'),
      rodar: async (pag) => {
        const r = await abrir(browser, pag, 'adblock');
        let mordeu = 0;
        const morde = (c) => { if (!c) mordeu++; };
        if (r.pedidos.length === 1) conferirCorpo(pag, corpos(r)[0], r.pedidos[0].cabecalhos, r.pedidos[0].url, morde);
        return mordeu;
      }
    },
    {
      nome: 'o interruptor que não desliga (a cena 4 tem de morder)',
      remendo: (h) => h.replace('if (!ligado) return;', 'if (false) return;'),
      rodar: async (pag) => {
        const r = await abrir(browser, pag, 'adblock', { desligar: true });
        return r.pedidos.length > 0 ? 1 : 0;
      }
    },
    {
      nome: 'o teto removido e a medição num laço (a cena 3 tem de morder)',
      // O ALVO DA CHAMADA CASA COM \r\n, e a falta disso deixava este controle MUDO em toda
      // máquina Windows (22/08). O texto procurado era `'  medir();\n'`; a página no disco vem
      // com CRLF (o checkout converte), então a segunda troca nunca acontecia — a primeira
      // acontecia, o `remendado === guardado` não acusava nada, e o controle saía "não mordeu"
      // sem ter injetado defeito nenhum. É a 2.8 mordendo o próprio portão: um controle que não
      // altera o que pretende altera é pior que ausente, porque reprova em silêncio no lugar
      // errado. O laço agora é regex, tolerante à quebra de linha, e o `pos` abaixo confere que
      // as DUAS trocas pegaram.
      remendo: (h) => h.replace('if (enviados >= TETO) return;', '')
        .replace(/\n( *)medir\(\);(\r?\n)/, '\n$1for (var i = 0; i < 30; i++) medir();$2'),
      pos: (h) => h.indexOf('for (var i = 0; i < 30; i++) medir();') >= 0
        && h.indexOf('if (enviados >= TETO) return;') < 0,
      rodar: async (pag) => {
        const r = await abrir(browser, pag, 'adblock');
        return r.pedidos.length !== 1 ? 1 : 0;
      }
    }
  ];
  const alvoCtl = PAGINAS[0];
  for (const c of CONTROLES) {
    // o remendo entra pelo HTML SERVIDO, nunca no disco: o controle não pode deixar rastro
    const abrirOrig = abrir;
    const mordidas = await (async () => {
      const guardado = fs.readFileSync(path.join(RAIZ, alvoCtl.arq), 'utf8');
      const remendado = c.remendo(guardado);
      if (remendado === guardado) return -1;   // o remendo não achou o que remendar
      // …e "mudou ALGUMA coisa" não é "mudou o que eu queria": um remendo de duas trocas com
      // uma só pegando passa nesta guarda e injeta meio defeito. `pos` é a conferência do
      // controle que faz duas coisas — sem ela, este arquivo reprovou por dias no Windows
      // apontando para o portão em vez de para si mesmo.
      if (c.pos && !c.pos(remendado)) return -1;
      // troca temporária do leitor: `abrir` lê do disco, então o remendo viaja por aqui
      const antes = fs.readFileSync;
      fs.readFileSync = function (p, o) {
        if (String(p).indexOf(alvoCtl.arq.split('/').join(path.sep)) >= 0) return remendado;
        return antes.apply(fs, arguments);
      };
      try { return await c.rodar(alvoCtl); } finally { fs.readFileSync = antes; }
    })();
    void abrirOrig;
    if (mordidas === -1) ok(false, 'CONTROLE "' + c.nome + '": o remendo não achou o trecho — o controle está cego');
    else ok(mordidas > 0, 'CONTROLE "' + c.nome + '": o portão reprovou (' + mordidas + ' verificação(ões) mordendo)');
  }

  await browser.close();

  console.log('\n' + (falhas === 0 ? 'MEDIÇÃO DAS PÁGINAS OK' : 'MEDIÇÃO DAS PÁGINAS REPROVADA')
    + ' — ' + passes + ' verificações passaram, ' + falhas + ' falharam');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
