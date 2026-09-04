// QA · O CAMINHO ESCOLAR (?origem=escola) NASCE DESLIGADO **NAS PÁGINAS DA PLATAFORMA**
//
// POR QUE ESTE ARQUIVO EXISTE, e ele não é cópia do `test/qa-eca-escolar.js`. Aquele mede o
// JOGO. Este mede as SEIS páginas de fora dele — A HISTÓRIA, o GLOSSÁRIO, DE ONDE VEM, O
// TERRITÓRIO, a PORTA e a POLÍTICA DE PRIVACIDADE. O buraco que ele fecha foi levantado em
// 04/09 pelo dev-jogo, ao fechar o item do ECA Digital: o mecanismo (parâmetro de URL +
// chave compartilhada `jogo_brasil_medir`) protegia o jogo e, POR TABELA, calava as páginas
// no mesmo aparelho — mas só depois que a pessoa tivesse passado pelo jogo. Quem recebe do
// professor um link direto para o GLOSSÁRIO e nunca abre o jogo continuava sendo medido,
// porque nenhuma das páginas lia o parâmetro por si mesma.
//
// A LEI E A DECISÃO são as mesmas: Lei nº 15.211/2025 (ECA Digital), em vigor desde
// 17/03/2026, e a decisão do dono de 03/09 — desligada por padrão SÓ no link que vai para
// professores, ligada no resto. As duas metades são medidas aqui, porque uma proteção que
// também desligasse o público geral seria tão errada quanto uma que não desliga ninguém.
//
// O INSTRUMENTO é o do `test/medir-paginas.js`: a página do disco é servida de uma origem
// https falsa por interceptação, porque sob `file://` o bloco não manda nada (guarda
// deliberada) e o teste passaria sem exercitar uma linha. Cada carga abre num contexto
// próprio, então o `localStorage` de uma página não contamina a outra. AUSÊNCIA SÓ SE PROVA
// COM RELÓGIO: quando a asserção é "não saiu nada", não há estado a esperar — só o tempo.
//
// E ELE TERMINA SE VENDO REPROVAR (EQUIPE.md 2.8). Três defeitos são injetados no HTML
// servido e o portão tem de morder os três: o bloco escolar removido, a CHAVE do parâmetro
// lida sem normalizar (o gap que a revisão adversarial achou no jogo em 04/09), e a decisão
// prévia sendo sobrescrita pelo padrão de origem — que é o link escolar virando jaula.
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');   // só pelo chromiumPath(): este portão serve a própria página
const fs = require('fs');
const path = require('path');
const MED = require('../ferramentas/medir-secao.js');

const RAIZ = path.resolve(__dirname, '..');
const ORIGEM = 'https://qa-eca-paginas.local/';

// As seis páginas. `mede` diz se a página tem o bloco de evento (a de privacidade tem só o
// INTERRUPTOR, de propósito: medi-la tornaria falsa a frase dela que diz "qual das CINCO
// seções foi aberta"). Nas duas famílias a leitura da escolha é a MESMA função emitida, e é
// exatamente isso que este arquivo cobra.
const PAGINAS = [
  { arq: 'historia/index.html',     rot: 'historia',    marcador: '.momento', minimo: 40, mede: true },
  { arq: 'glossario/index.html',    rot: 'glossario',   marcador: '.verbete', minimo: 150, mede: true },
  { arq: 'de-onde-vem/index.html',  rot: 'de-onde-vem', marcador: '.ref',     minimo: 50, mede: true },
  { arq: 'territorio/index.html',   rot: 'territorio',  marcador: '.pl',      minimo: 5,  mede: true },
  { arq: 'plataforma/index.html',   rot: 'porta',       marcador: 'a.card',   minimo: 4,  mede: true },
  { arq: 'privacidade/index.html',  rot: 'privacidade', marcador: 'h2',       minimo: 5,  mede: false },
];

let falhas = 0, contas = 0;
function ok(c, msg) {
  contas++;
  if (c) console.log('  ok   ' + msg);
  else { falhas++; console.log('  X    ' + msg); }
  return !!c;
}
function sec(t) { console.log('\n=== ' + t); }

// Uma carga de página, com a busca pedida. Devolve o estado CRU: quantos pedidos saíram para
// o host da medição, as duas chaves do aparelho, e o rótulo do interruptor — que é o que a
// pessoa LÊ, e portanto a única prova de que a página não mostra uma coisa e faz outra.
async function carga(browser, pag, busca, op) {
  op = op || {};
  const html0 = op.html !== undefined ? op.html : fs.readFileSync(path.join(RAIZ, pag.arq), 'utf8');
  const pg = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  if (op.semear) await pg.addInitScript(op.semear);
  const pedidos = [];
  const ruins = [];
  pg.on('pageerror', (e) => ruins.push('PAGEERROR: ' + e.message));
  pg.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/posthog|Failed to load resource|ERR_/i.test(t)) return;
    ruins.push('CONSOLE: ' + t);
  });
  await pg.route('**/*', async (route) => {
    const u = route.request().url();
    if (u.indexOf(MED.MEDIDA_HOST) === 0) { pedidos.push(u); return route.abort('blockedbyclient'); }
    if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return route.fulfill({ contentType: 'text/css', body: '' });
    // a página serve-se por PATHNAME: com busca, a URL deixa de ser igual à origem crua
    let p = '';
    try { p = new URL(u).pathname; } catch (e) { p = ''; }
    if (p === '/') return route.fulfill({ contentType: 'text/html; charset=utf-8', body: html0 });
    return route.abort();
  });
  await pg.goto(ORIGEM + busca);
  if (op.tocar) {
    await pg.waitForSelector('#' + MED.ID_BOTAO);
    await pg.evaluate((id) => document.getElementById(id).click(), MED.ID_BOTAO);
    pedidos.length = 0;
    // e VOLTA pelo mesmo link escolar — é a única cena que só se prova com duas cargas
    await pg.goto(ORIGEM + (op.buscaVolta !== undefined ? op.buscaVolta : busca));
  }
  // O relógio: a asserção mais frequente aqui é de AUSÊNCIA, e ausência não tem estado a esperar.
  await pg.waitForTimeout(op.espera || 1200);
  const est = await pg.evaluate(({ sel, id }) => ({
    nos: document.querySelectorAll(sel).length,
    rotulo: document.getElementById(id) ? document.getElementById(id).textContent : '',
    medir: (function () { try { return localStorage.getItem('jogo_brasil_medir'); } catch (e) { return 'ERRO'; } })(),
    anon: (function () { try { return localStorage.getItem('jogo_brasil_anon'); } catch (e) { return 'ERRO'; } })()
  }), { sel: pag.marcador, id: MED.ID_BOTAO });
  await pg.close();
  return { busca, pedidos: pedidos.length, ruins, ...est };
}

const linha = (rot, r) => console.log('   [' + rot + ' ' + JSON.stringify(r.busca) + '] pedidos=' + r.pedidos
  + ' | medir=' + JSON.stringify(r.medir) + ' | anon=' + (r.anon ? 'SORTEADO' : r.anon)
  + ' | botão="' + String(r.rotulo).replace(/\s+/g, ' ').trim() + '"');

// "PROTEGIDO" tem quatro partes, e nenhuma delas sozinha é a promessa: zero pedido, a escolha
// GRAVADA (senão a proteção morre com o parâmetro, e o favorito de amanhã volta a medir), o
// identificador anônimo NEM SORTEADO (nada é gravado, não só nada é mandado) e o botão dizendo
// "desligada" — porque uma página que faz o certo e mostra o contrário mente para quem lê.
const protegido = (r) => r.pedidos === 0 && r.medir === 'nao' && r.anon === null
  && String(r.rotulo).indexOf('desligada') >= 0;

(async () => {
  // ============================================================
  sec('1 · a fonte do parâmetro é UMA — as páginas e o jogo leem a MESMA palavra');
  const jogoTs = fs.readFileSync(path.join(RAIZ, 'src', 'jogo.ts'), 'utf8');
  const bJogo = (jogoTs.match(/const ORIGEM_BUSCA = "([^"]*)";/) || [])[1];
  const eJogo = (jogoTs.match(/const ORIGEM_ESCOLA = "([^"]*)";/) || [])[1];
  ok(bJogo === MED.ORIGEM_BUSCA,
    'a chave do parâmetro das páginas é byte a byte a do src/jogo.ts ("' + MED.ORIGEM_BUSCA + '")');
  ok(eJogo === MED.ORIGEM_ESCOLA,
    'e o valor também ("' + MED.ORIGEM_ESCOLA + '") — um link só, dois lugares que o entendem igual');
  // Duas cópias do bloco divergiriam em silêncio; a página que ficasse para trás seria a que
  // continua medindo a turma. Então ele é emitido UMA vez, e as seis páginas o recebem igual.
  const blocos = PAGINAS.map((p) => {
    const t = fs.readFileSync(path.join(RAIZ, p.arq), 'utf8');
    const m = t.match(/var ligado = true;[\s\S]*?\n  \}\)\(\);\n/);
    return { rot: p.rot, txt: m ? m[0].replace(/\r/g, '') : null };
  });
  ok(blocos.every((b) => b.txt),
    'as ' + PAGINAS.length + ' páginas trazem a leitura do parâmetro ('
    + blocos.filter((b) => !b.txt).map((b) => b.rot).join(', ') + ' sem ela)');
  ok(blocos.every((b) => b.txt && b.txt === blocos[0].txt),
    'e as ' + PAGINAS.length + ' cópias são byte a byte a mesma função — escrita uma vez em ferramentas/medir-secao.js');
  // A PÁGINA NO DISCO É SAÍDA, E SAÍDA ENVELHECE. Sem esta linha, mexer no `medir-secao.js` e
  // esquecer de rodar os geradores deixaria este portão medindo as páginas de ontem — verde,
  // e falso. É o mesmo modo de falha que tirou o smoke test do `file://`.
  const agora = (MED.script('historia').match(/var ligado = true;[\s\S]*?\n  \}\)\(\);\n/) || [])[0];
  ok(!!agora && blocos[0].txt === agora.replace(/\r/g, ''),
    'e o que está no disco é o que o módulo emite AGORA — as páginas não são a saída de ontem');

  const browser = await chromium.launch({ executablePath: ABRIR.chromiumPath(), args: ['--enable-unsafe-swiftshader'] });

  // ============================================================
  // 2 · A TABELA, nas seis páginas: o link do professor de um lado, todo o resto do outro.
  // ============================================================
  sec('2 · o link escolar nasce desligado nas seis páginas, e o link comum não');
  for (const pag of PAGINAS) {
    const a = await carga(browser, pag, '?origem=escola'); linha(pag.rot + ' escola', a);
    ok(protegido(a) && a.nos >= pag.minimo && a.ruins.length === 0,
      pag.rot + '/escola: 0 pedido, medir="nao", anon NÃO sorteado, botão "desligada" — e a página inteira');

    const b = await carga(browser, pag, ''); linha(pag.rot + ' comum', b);
    if (pag.mede) {
      ok(b.pedidos > 0 && b.medir === null && !!b.anon && b.rotulo.indexOf('ligada') >= 0,
        pag.rot + '/link comum: mediu (' + b.pedidos + ' pedido), nada gravado em jogo_brasil_medir, anon sorteado');
    } else {
      // a página de privacidade não mede NUNCA — nela a metade "não vazou" se lê no botão e na
      // ausência de gravação, que é o que ela de fato controla
      ok(b.pedidos === 0 && b.medir === null && b.rotulo.indexOf('ligada') >= 0,
        pag.rot + '/link comum: não mede (por desenho), nada gravado, e o botão abre "ligada"');
    }

    const c = await carga(browser, pag, '?utm_source=zap&origem=jornal'); linha(pag.rot + ' parecido', c);
    ok(c.medir === null && c.rotulo.indexOf('ligada') >= 0 && (pag.mede ? c.pedidos > 0 : c.pedidos === 0),
      pag.rot + '/origem=jornal com utm_: igual ao link comum — a proteção não vaza para o público geral');
  }

  // ============================================================
  // 3 · AS BORDAS. A mesma cobertura do portão do jogo, agora nas páginas. O alvo é o
  //     GLOSSÁRIO porque é ele o destino do link de professor que o achado descreve.
  // ============================================================
  sec('3 · as bordas do parâmetro — as mesmas oito que o portão do jogo cobre');
  const alvo = PAGINAS[1];
  for (const [rot, q, espera] of [
    ['valor MAIÚSCULO',        '?origem=ESCOLA', true],
    ['valor com espaços',      '?origem=%20escola%20', true],
    ['CHAVE maiúscula',        '?ORIGEM=escola', true],
    ['chave e valor MAIÚSC',   '?ORIGEM=ESCOLA', true],
    ['parâmetros extras',      '?a=1&origem=escola&b=2', true],
    ['origem repetida',        '?origem=escola&origem=jornal', true],
    ['origem repetida ao contrário', '?origem=jornal&origem=escola', true],
    ['no hash, não na busca',  '#origem=escola', false],
    ['quase (escolar)',        '?origem=escolar', false],
    ['chave quase (origens)',  '?origens=escola', false],
  ]) {
    const r = await carga(browser, alvo, q); linha(rot, r);
    ok(protegido(r) === espera,
      '[' + rot + '] protegido=' + protegido(r) + ' (esperado ' + espera + ')');
  }

  // ============================================================
  // 4 · A DECISÃO DA PESSOA GANHA DO PADRÃO DE ORIGEM — a diferença entre padrão e jaula.
  // ============================================================
  sec('4 · o save como entrada não confiável, e a decisão manual vencendo a origem');
  const g = await carga(browser, alvo, '?origem=escola', {
    semear: () => { try { localStorage.setItem('jogo_brasil_medir', 'talvez'); } catch (e) {} }
  }); linha('adulterado "talvez" + escola', g);
  ok(protegido(g), 'chave adulterada ("talvez") é "ninguém decidiu": o padrão escolar tem voz e protege');

  const h = await carga(browser, alvo, '?origem=escola', {
    semear: () => { try { localStorage.setItem('jogo_brasil_medir', ''); } catch (e) {} }
  }); linha('string vazia + escola', h);
  ok(protegido(h), 'string vazia idem — protege');

  const i = await carga(browser, alvo, '?origem=escola', {
    semear: () => { try { localStorage.setItem('jogo_brasil_medir', 'sim'); } catch (e) {} }
  }); linha('decisão "sim" prévia + escola', i);
  ok(i.pedidos > 0 && i.medir === 'sim' && i.rotulo.indexOf('ligada') >= 0,
    'quem JÁ tinha decidido "sim" chega pela escola e continua ligado — decisão não se sobrescreve');

  const j = await carga(browser, alvo, '?origem=escola', { tocar: true }); linha('escola→toque→escola', j);
  ok(j.pedidos > 0 && j.medir === 'sim' && j.rotulo.indexOf('ligada') >= 0,
    'chegou pela escola, TOCOU no interruptor e voltou pelo MESMO link: a escolha manual venceu o padrão');

  const k = await carga(browser, alvo, '', {
    tocar: true, buscaVolta: '?origem=escola'
  }); linha('comum→desligou→escola', k);
  ok(k.pedidos === 0 && k.medir === 'nao',
    'e quem desligou à mão e depois chega pela escola continua desligado — os dois caminhos concordam');

  // ============================================================
  // 5 · O PORTÃO VISTO REPROVANDO. Três defeitos no HTML servido; morder os três é o que
  //     separa este arquivo de uma promessa por escrito (EQUIPE.md 2.8).
  // ============================================================
  sec('5 · o portão visto REPROVANDO — três defeitos injetados de propósito');
  const CONTROLES = [
    {
      nome: 'o bloco escolar removido (a cena 2 tem de morder)',
      remendo: (h2) => h2.replace(/if \(!decidido && chegouPelaEscola\(\)\)/g, 'if (false)'),
      rodar: async (html) => protegido(await carga(browser, alvo, '?origem=escola', { html })) ? 0 : 1
    },
    {
      nome: 'a CHAVE do parâmetro lida sem normalizar (a cena 3 tem de morder)',
      remendo: (h2) => h2.replace(/String\(k\)\.toLowerCase\(\)/g, 'String(k)'),
      rodar: async (html) => protegido(await carga(browser, alvo, '?ORIGEM=escola', { html })) ? 0 : 1
    },
    {
      nome: 'a decisão prévia sobrescrita pela origem (a cena 4 tem de morder)',
      remendo: (h2) => h2.replace(/var decidido = \(g === "sim" \|\| g === "nao"\) \? g : "";/g,
        'var decidido = "";'),
      rodar: async (html) => {
        const r = await carga(browser, alvo, '?origem=escola', {
          html, semear: () => { try { localStorage.setItem('jogo_brasil_medir', 'sim'); } catch (e) {} }
        });
        return (r.pedidos > 0 && r.medir === 'sim') ? 0 : 1;
      }
    }
  ];
  const original = fs.readFileSync(path.join(RAIZ, alvo.arq), 'utf8');
  for (const c of CONTROLES) {
    const remendado = c.remendo(original);
    if (remendado === original) { ok(false, 'CONTROLE "' + c.nome + '": o remendo não achou o trecho — o controle está cego'); continue; }
    const mordeu = await c.rodar(remendado);
    ok(mordeu > 0, 'CONTROLE "' + c.nome + '": o portão reprovou');
  }

  await browser.close();
  console.log('\n' + (falhas ? 'REPROVADO — ' + falhas + ' falha(s) de ' + contas
    : 'PASSOU — ' + contas + ' asserções') );
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
