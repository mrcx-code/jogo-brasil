// ENCAIXE — as asserções que faltavam para a SEQUÊNCIA, e que nem o smoke nem o percurso cobrem.
//
// O percurso PERGUNTA "encaixa?" e responde por leitura humana dos prints. Este arquivo é a
// parte da resposta que dá para AFIRMAR: coisas que, quando desencaixam, desencaixam em
// silêncio absoluto — nenhum erro de console, nenhuma tela em branco, nenhum print óbvio.
//
//   node test/encaixe.js
//
// Roda contra o index.html da RAIZ como está (sem build), 390×844, dsf 2.
// Sai 1 na primeira falha. Prints em test/E-*.png.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}
function alvo() {
  const p = process.env.JOGO_HTML;
  if (p && /^https?:\/\//i.test(p)) return p;
  return ABRIR('file://' + path.resolve(__dirname, '..', p || 'index.html'));
}
const DIR = __dirname;
let falhas = 0;
function ok(cond, txt) {
  console.log((cond ? '  ok   ' : '  FALHA ') + txt);
  if (!cond) falhas++;
}
const log = (...a) => console.log(...a);
const sec = t => log('\n---- ' + t);

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2
  });
  const erros = [];
  page.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('CONSOLE: ' + m.text()); });
  await page.goto(alvo());
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  await page.waitForTimeout(900);

  // ============================================================
  // 1 · TEXTO E IMAGEM ANDAM JUNTOS — a lista de imagens tem que ter o tamanho da lista de falas
  //
  // `abrirFala` faz `linhas.map((_, i) => imgs[i] || null)`: uma lista de imagens CURTA não
  // dá erro nenhum, ela só cala as últimas falas — e uma linha inserida no meio EMPURRA todas
  // as imagens depois dela para a fala errada. É o modo de falha mais silencioso do jogo, e
  // ele acontece justamente onde a imagem carrega §2: a vertical certa na frase errada é uma
  // afirmação que ninguém escreveu.
  // ============================================================
  sec('1 · a lista de imagens tem o tamanho da lista de falas');
  const pares = await page.evaluate(() => {
    const r = [];
    EPOCAS.forEach(function (e) {
      r.push({ onde: 'EPOCAS[' + e.id + '].abertura', n: e.abertura.length, m: (e.aberturaImg || []).length,
        img: (e.aberturaImg || []).slice() });
    });
    TRAVESSIAS.forEach(function (t) {
      r.push({ onde: 'TRAVESSIAS[' + t.id + '].linhas', n: t.linhas.length, m: (t.imgs || []).length,
        img: (t.imgs || []).slice(), linhas: t.linhas.slice() });
    });
    return r;
  });
  pares.forEach(function (p) {
    ok(p.n === p.m, p.onde + ': ' + p.n + ' falas para ' + p.m + ' imagens' +
      (p.n === p.m ? '' : '  <-- as ' + (p.n - p.m) + ' últimas falas ficam mudas e tudo depois do buraco escorrega'));
  });

  // e o encaixe de CONTEÚDO onde ele é verificável: a vertical da cidade africana viva existe
  // para ser a PROVA da frase "não o que elas eram" (comentário do próprio TRAVESSIAS).
  const africa = await page.evaluate(() => {
    const t = TRAVESSIAS[0];
    const iImg = (t.imgs || []).indexOf('p07-africa');
    const iTxt = t.linhas.findIndex(function (l) { return /não o que elas eram/.test(l); });
    return { iImg: iImg, iTxt: iTxt, naImg: iImg >= 0 ? t.linhas[iImg] : null };
  });
  log('   p07-africa está na posição ' + africa.iImg + '; a frase que ela prova está na ' + africa.iTxt);
  if (africa.naImg) log('   hoje ela pousa em: "' + africa.naImg.slice(0, 110) + '"');
  ok(africa.iImg === africa.iTxt,
    'a cidade africana viva pousa na fala que ela prova ("não o que elas eram")');

  // ============================================================
  // 2 · "NOVA ERA" só quando a era é nova
  //
  // O float nasce em `verificarCenario`, dentro de `if (!vira)` — ou seja, exatamente quando a
  // próxima cena é do MESMO capítulo. Não é erro de código: é o rótulo dizendo o contrário do
  // que aconteceu, e nenhum teste olhava para o texto dele.
  // ============================================================
  sec('2 · o float da virada de CENA não pode dizer "NOVA ERA"');
  const vf = await page.evaluate(async () => {
    fecharTelas(); S.aberturas = MASCARA_EPOCAS;
    S.cenario = 0; S.fronteira = 0; visitando = false;
    floats.length = 0;
    S.energiaTotal = LIMIAR_CENA + 1; S.energia = S.energiaTotal;
    verificarCenario();
    await new Promise(r => setTimeout(r, 300));
    return { cena: S.cenario, epoca: EPOCAS[epocaAtual()].nome, txts: floats.map(f => f.txt).filter(Boolean) };
  });
  log('   virada de cena 0->' + vf.cena + ', ainda em ' + vf.epoca + ' | floats: ' + vf.txts.join(' / '));
  ok(!vf.txts.some(t => /NOVA ERA/i.test(t)),
    'a cena mudou dentro de ' + vf.epoca + ' e o jogo NÃO anunciou "NOVA ERA"');

  // ============================================================
  // 3 · OS NICHOS DE DROP NASCEM COM O PRIMEIRO ITEM (onda 11) — e a seta acerta o nicho
  //
  // Os três contadores passaram a nascer ocultos. Duas coisas podem quebrar em silêncio:
  // o nicho não voltar quando o item chega, e a seta da microdica medir um nicho que ainda
  // estava `display:none` (rect zerado) e pousar no canto superior esquerdo da tela.
  // ============================================================
  sec('3 · os nichos nascem com o primeiro item, e a seta pousa no nicho');
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
  await page.waitForTimeout(700);
  await page.evaluate(() => { fecharTelas(); S.aberturas = MASCARA_EPOCAS; salvar(); });
  await page.waitForTimeout(400);
  const zero = await page.evaluate(() => {
    const v = ['nFlor', 'nAgua', 'nRef'].map(function (id) {
      const b = document.getElementById(id).parentElement;
      return { id: id, oculto: b.classList.contains('oculto'), vis: getComputedStyle(b).display };
    });
    return { recs: v, rec: JSON.stringify(S.recursos), placar: getComputedStyle(document.getElementById('energia').parentElement).display };
  });
  zero.recs.forEach(r => log('   boot: ' + r.id + ' display ' + r.vis));
  ok(zero.recs.every(r => r.vis === 'none'), 'no boot os três nichos de drop estão fora da tela');
  ok(zero.placar !== 'none', 'o placar (o nicho que É o jogo) continua na tela no boot');

  const nasceu = await page.evaluate(() => {
    // um drop de fumaça (flor) exatamente sob a personagem, e a seta ARMADA como a primeira
    // espera atendida a arma
    S.energiaTotal = 10; S.energia = 10;             // dentro do teto das microdicas
    dicaSetaArmada = true; dicaSetaVista = false;
    drops.length = 0;
    coletarDrop({ wx: worldX + HX, type: 'smog', valor: 3, t: 0 }, false);
    const rec = document.getElementById('nFlor').parentElement;
    const nicho = document.getElementById('pdFlor').getBoundingClientRect();
    const seta = document.getElementById('dicaSeta');
    const s = seta.getBoundingClientRect();
    return {
      display: getComputedStyle(rec).display, flor: S.recursos.flor,
      viva: seta.classList.contains('viva'),
      nicho: { x: Math.round(nicho.left), y: Math.round(nicho.top), w: Math.round(nicho.width), h: Math.round(nicho.height) },
      seta: { x: Math.round(s.left), y: Math.round(s.top), w: Math.round(s.width) },
      // a ponta do triângulo é o meio dele; o alvo é o meio do nicho
      erroX: Math.round(Math.abs((s.left + s.width / 2) - (nicho.left + nicho.width / 2))),
      abaixo: Math.round(s.top - nicho.bottom),
      naTela: s.top >= 0 && s.left >= 0 && s.top < 844 && s.left < 390,
      // ninguém mais na frente: a seta é decoração, mas o nicho tem de estar visível
      noPonto: (function () {
        const el = document.elementFromPoint(nicho.left + nicho.width / 2, nicho.top + nicho.height / 2);
        return el ? (el.id || el.className || el.tagName) : null;
      })()
    };
  });
  log('   nicho pdFlor: ' + JSON.stringify(nasceu.nicho) + ' | seta: ' + JSON.stringify(nasceu.seta));
  ok(nasceu.display !== 'none', 'o nicho da flor apareceu no MESMO instante em que o contador encheu (' + nasceu.flor + ')');
  ok(nasceu.nicho.w > 0 && nasceu.nicho.h > 0, 'o nicho tem caixa medível quando a seta o mede (rect ' + nasceu.nicho.w + 'x' + nasceu.nicho.h + ')');
  ok(nasceu.viva, 'a seta da microdica acendeu');
  ok(nasceu.naTela, 'a seta pousou DENTRO da tela');
  ok(nasceu.erroX <= 4, 'a seta está centrada no nicho (erro horizontal ' + nasceu.erroX + ' px)');
  ok(nasceu.abaixo >= 0 && nasceu.abaixo <= 12, 'a seta está logo abaixo do nicho, apontando para ele (' + nasceu.abaixo + ' px)');
  ok(nasceu.noPonto !== null, 'o nicho apontado está no topo no ponto dele (' + nasceu.noPonto + ')');
  await page.screenshot({ path: path.join(DIR, 'E-01-nicho-e-seta.png') });

  // os outros dois continuam fora até a rua dar o tipo deles
  const soUm = await page.evaluate(() => ['nFlor', 'nAgua', 'nRef'].map(function (id) {
    return id + ':' + getComputedStyle(document.getElementById(id).parentElement).display;
  }).join(' '));
  log('   ' + soUm);
  ok(/nAgua:none/.test(soUm) && /nRef:none/.test(soUm), 'a fileira CRESCE: só o contador que encheu está na tela');

  // ============================================================
  // 4 · A SEQUÊNCIA DECLARADA BATE COM A SEQUÊNCIA VIVIDA
  //
  // O smoke já afirma a ordem (fecho → travessia → cerimônia → abertura) simulando as funções.
  // O que ninguém afirmava: que TODA virada de capítulo passa por um fecho e uma abertura, e
  // que nenhuma delas é vazia. Capítulo novo entra em EPOCAS sem `fecho` e o jogo pula direto —
  // sem erro, sem tela, sem ninguém notando.
  // ============================================================
  sec('4 · toda virada tem fecho e abertura, e nenhuma é vazia');
  const conteudo = await page.evaluate(() => EPOCAS.map(function (e, i) {
    return { id: e.id, nome: e.nome, ab: (e.abertura || []).length, fe: (e.fecho || []).length,
      cenas: e.cenas, quando: e.quando || '' };
  }));
  conteudo.forEach(function (c) {
    log('   ' + c.nome.padEnd(11) + ' abertura ' + c.ab + ' · fecho ' + c.fe + ' · cenas ' + c.cenas + ' · ' + c.quando);
    ok(c.ab > 0, c.nome + ' tem abertura');
    ok(c.fe > 0, c.nome + ' tem fecho');
    ok(c.cenas > 0, c.nome + ' ocupa ao menos uma cena');
    ok(!!c.quando, c.nome + ' diz QUANDO é');
  });

  // ============================================================
  // 5 · O VERBO PROMETIDO EXISTE NA MÃO
  //
  // Cada abertura promete um verbo. O texto é dado; a mecânica é código. Aqui só se afirma o
  // que dá para afirmar sem jogar 30 s: que o capítulo que promete ACOLHER tem fila de
  // acolhidas viva, e que o que promete LEVAR PALAVRA tem corrente. Se um dia a mecânica sair
  // e o texto ficar, isto reprova — e é exatamente a mentira que a tese do produto proíbe.
  // ============================================================
  sec('5 · o verbo que a abertura promete tem mecânica atrás');
  const verbos = await page.evaluate(() => {
    const r = [];
    EPOCAS.forEach(function (e, i) {
      const txt = e.abertura.join(' ');
      r.push({
        nome: e.nome,
        promete_acolher: /alcançar é acolher|vem ficar|passa a andar com você/i.test(txt),
        promete_palavra: /levar palavra|passa a saber/i.test(txt),
        promete_colher: /colher|plantar|contador/i.test(txt),
        // a mecânica correspondente, perguntada ao motor e não ao texto
        temAcolher: i === CAP_GENTE,
        temPalavra: i === CAP_PALAVRA
      });
    });
    return r;
  });
  verbos.forEach(function (v) {
    log('   ' + v.nome.padEnd(11) + ' promete[acolher ' + v.promete_acolher + ' · palavra ' + v.promete_palavra +
      ' · colher ' + v.promete_colher + '] motor[acolhe ' + v.temAcolher + ' · palavra ' + v.temPalavra + ']');
    if (v.temAcolher !== null) ok(v.promete_acolher === v.temAcolher, v.nome + ': o texto e o motor concordam sobre ACOLHER');
    if (v.temPalavra !== null) ok(v.promete_palavra === v.temPalavra, v.nome + ': o texto e o motor concordam sobre LEVAR PALAVRA');
  });

  // ============================================================
  // 6 · UM CICLO DE VIDA DE VERDADE — jogar, fechar, voltar
  //
  // Era o gap nº 9 do relatório anterior: todo teste de persistência SEMEAVA o localStorage à
  // mão, o que prova o esquema e não prova o save. Aqui ninguém semeia: joga-se por toque, a
  // página recarrega, e o que voltou tem de ser o que ficou.
  // ============================================================
  sec('6 · jogar por toque, fechar, reabrir — o que voltou é o que ficou');
  // `beforeunload` grava o save ao sair: limpar e recarregar sem neutralizar `salvar` devolve
  // exatamente o estado que se tentou apagar. É a mesma armadilha anotada no percurso.js.
  await page.evaluate(() => { window.salvar = function () {}; localStorage.clear(); });
  await page.reload();
  await page.waitForTimeout(800);
  await page.evaluate(() => { fecharTelas(); S.aberturas = MASCARA_EPOCAS; salvar(); });
  await page.waitForTimeout(500);   // #controls volta com transição; medir antes disso mede o vazio
  const bot = await page.locator('#btnClique').boundingBox();
  const cena = await page.locator('#scene').boundingBox();
  for (let i = 0; i < 60; i++) {
    await page.touchscreen.tap(bot.x + bot.width / 2, bot.y + bot.height / 2);
    if (i % 9 === 8) await page.touchscreen.tap(cena.x + cena.width * 0.25, cena.y + cena.height * 0.5);
    await page.waitForTimeout(45);
  }
  const antes = await page.evaluate(() => {
    salvar();
    return { total: Math.round(S.energiaTotal), energia: Math.round(S.energia), cena: S.cenario,
      fronteira: S.fronteira, rec: JSON.stringify(S.recursos), aber: S.aberturas };
  });
  log('   jogado por toque: impacto ' + antes.total + ' | recursos ' + antes.rec);
  ok(antes.total > 0, 'o toque pagou alguma coisa antes de fechar (' + antes.total + ')');
  await page.reload();
  await page.waitForTimeout(1000);
  const depois = await page.evaluate(() => ({
    total: Math.round(S.energiaTotal), energia: Math.round(S.energia), cena: S.cenario,
    fronteira: S.fronteira, rec: JSON.stringify(S.recursos), aber: S.aberturas,
    telas: ["telaMenu", "telaCapitulos", "telaFala"].filter(t => document.getElementById(t).classList.contains('aberta'))
  }));
  log('   voltou com: impacto ' + depois.total + ' | recursos ' + depois.rec + ' | telas ' + (depois.telas.join(',') || '(nenhuma)'));
  ok(depois.total === antes.total, 'o impacto voltou inteiro (' + antes.total + ' -> ' + depois.total + ')');
  ok(depois.cena === antes.cena && depois.fronteira === antes.fronteira,
    'a cena e a fronteira voltaram (' + antes.cena + '/' + antes.fronteira + ' -> ' + depois.cena + '/' + depois.fronteira + ')');
  ok(depois.aber === antes.aber, 'as falas já lidas continuam lidas');
  // os três contadores de drop NÃO estão no ESQUEMA_SAVE — isto não é asserção, é o número
  log('   recursos gravados? ' + (depois.rec === antes.rec ? 'sim' : 'NÃO — ' + antes.rec + ' virou ' + depois.rec));

  // ============================================================
  // 7 · O RITMO DO ROLO (onda 10) — os 7 pontos de parada e o véu da saída
  //
  // O smoke afirma que a tela abre e que as 26 páginas medem a tela. O que a onda 10
  // acrescentou — parar em 7 das 26 e apagar a página que sai — não tem asserção nenhuma:
  // uma classe renomeada em `montarCompletude` apaga os dois em silêncio.
  // ============================================================
  sec('7 · o quadrinho: 7 pontos de parada em 26, e o véu da saída');
  // NÃO se mexe em `S.energiaTotal` aqui: empurrá-lo para o teto faz `verificarCenario` disparar
  // fecho→travessia→abertura em cascata e FECHAR o menu por baixo do teste. Isto roda no estado
  // que a seção 6 deixou — a partida do DIA 1, que é justamente o quadrinho que ninguém testou.
  await page.evaluate(() => { fecharTudo(); abrirTela('telaMenu'); });
  await page.waitForTimeout(600);
  const vis = await page.evaluate(() => {
    const b = document.getElementById('btnCompletude');
    const r = b.getBoundingClientRect();
    return { menu: document.getElementById('telaMenu').className, box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      op: getComputedStyle(document.getElementById('telaMenu')).opacity };
  });
  log('   menu: ' + vis.menu + ' opacidade ' + vis.op + ' | caixa do A HISTÓRIA ' + JSON.stringify(vis.box));
  await page.touchscreen.tap(vis.box[0] + vis.box[2] / 2, vis.box[1] + vis.box[3] / 2);
  await page.waitForTimeout(1000);
  const montou = await page.evaluate(() => document.getElementById('listaCenas').children.length);
  ok(montou > 0, 'A HISTÓRIA montou o quadrinho pelo toque no menu (' + montou + ' páginas)');
  if (!montou) { console.log('  (sem páginas: o resto da seção 7 não tem o que medir)'); }
  const rolo = montou ? await page.evaluate(() => {
    const l = document.getElementById('listaCenas');
    const pgs = [...l.children];
    const paradas = pgs.map(function (p, i) { return { i: i + 1, cls: p.className,
      stop: getComputedStyle(p).scrollSnapStop, align: getComputedStyle(p).scrollSnapAlign }; });
    return {
      n: pgs.length,
      snap: getComputedStyle(l).scrollSnapType,
      sempre: paradas.filter(p => p.stop === 'always').map(p => p.i),
      align: [...new Set(paradas.map(p => p.align))],
      veu: (function () {
        // o ::after de cada quadro é o véu; sem ele a página que sai não apaga
        const s = getComputedStyle(pgs[1], '::after');
        return { conteudo: s.content, cor: s.backgroundColor, z: s.zIndex };
      })()
    };
  }) : { n: 0, snap: '?', sempre: [], align: [], veu: { conteudo: 'none', cor: '?', z: '?' } };
  log('   snap do rolo: "' + rolo.snap + '" | alinhamento das páginas: ' + rolo.align.join(','));
  log('   páginas com ponto final: ' + rolo.sempre.join(',') + ' (' + rolo.sempre.length + ' de ' + rolo.n + ')');
  log('   véu da saída: content ' + rolo.veu.conteudo + ' | cor ' + rolo.veu.cor + ' | z ' + rolo.veu.z);
  ok(rolo.sempre.length === 7, 'sete pontos finais em ' + rolo.n + ' páginas (onda 10)');
  ok(rolo.align.length === 1 && rolo.align[0] === 'start', 'toda página encaixa pelo topo');
  ok(rolo.veu.conteudo !== 'none', 'o véu da saída existe em cada quadro');
  // o rolo DECLARADO no comentário do CSS e no DIRECAO.md é "encaixe obrigatório"; o que está
  // no arquivo é `proximity`. Não reprovo o valor (é decisão de Arte), reprovo o silêncio:
  // se um dia virar `mandatory`, quem mudar tem de saber que estas medidas mudam junto.
  log('   (o CSS declara `y proximity`, não `mandatory` — soltar no meio da página NÃO assenta)');

  // ============================================================
  // 8 · A ÚNICA AFIRMAÇÃO DO JOGO COM DATA DE VALIDADE
  //
  // A tela de AJUSTES faz uma afirmação sobre o que sai do aparelho de quem joga, e quem a
  // cobra do navegador é a CSP do <head>. O CLAUDE.md §3 manda reescrever a tela NA MESMA FASE
  // que ligar a rede — "afirmação de privacidade que virou falsa é pior que nenhuma". Ninguém
  // vigiava as duas juntas: abrir a CSP é uma linha, e a frase continuaria na tela dizendo o
  // contrário. Este bloco amarra uma à outra, e ele já cobrou duas vezes.
  //
  // QUATRO ESTADOS, e não dois — a CSP deixou de ser um interruptor em 10/08 e mudou duas
  // vezes no mesmo dia. Um estado que ninguém escreveu aqui é REPROVADO, nunca ignorado: é o
  // que impede que a próxima abertura de rede passe calada por esta asserção.
  //   · `fechada`   — nenhuma rede. A promessa mais forte que este jogo já pôde fazer.
  //   · `soPropria` — só o próprio site (carga sob demanda da arte).
  //   · `comMedida` — o próprio site MAIS um host, escrito inteiro: a contagem anônima.
  //   · qualquer outra coisa — uma fase que ninguém escreveu.
  //
  // E no estado `comMedida` a cobrança fica MAIS dura, não menos, porque agora sai dado de
  // quem joga: a tela tem de dizer o que sai, tem de dizer o que NÃO sai, tem de ter um
  // interruptor, e o interruptor tem de mudar a própria frase. O host que a CSP abre tem de
  // ser o host que o jogo de fato chama — duas cópias divergentes deixariam a CSP autorizando
  // um endereço e o jogo falando com outro.
  // ============================================================
  sec('8 · a promessa de privacidade e a CSP contam a mesma história');
  const priv = await page.evaluate(() => {
    fecharTudo(); abrirTela('telaConfig');
    if (typeof montarConfig === 'function') montarConfig();
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const csp = meta ? meta.getAttribute('content') : '';
    const dir = {};
    csp.split(';').forEach(function (d) {
      const t = d.trim(); if (!t) return;
      const i = t.indexOf(' ');
      dir[i < 0 ? t : t.slice(0, i)] = i < 0 ? [] : t.slice(i + 1).trim().split(/\s+/);
    });
    const conectar = dir['connect-src'] || [];
    const ler = function () {
      return [...document.querySelectorAll('#cfgInfo div')].map(d => d.getAttribute('aria-label') || '').join(' ');
    };
    const bt = document.getElementById('btnMedir');
    const txtLigado = ler();
    const rotLigado = bt ? bt.getAttribute('aria-label') : null;
    // O INTERRUPTOR MUDA A FRASE. Um botão que não muda o texto que a pessoa acabou de ler é
    // um botão que ninguém tem como saber se funcionou.
    let txtDesligado = null, rotDesligado = null;
    if (bt) {
      bt.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      txtDesligado = ler();
      rotDesligado = bt.getAttribute('aria-label');
      bt.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));  // devolve como estava
    }
    return { csp: csp, conectar: conectar, txt: txtLigado, txtOff: txtDesligado,
      rot: rotLigado, rotOff: rotDesligado, temBotao: !!bt,
      // o endereço que o JOGO chama, lido do próprio jogo e não de uma segunda cópia no teste
      endereco: typeof ENDERECO_MEDIDA === 'string' ? ENDERECO_MEDIDA : null,
      chave: typeof MEDIDA_CHAVE === 'string' ? MEDIDA_CHAVE : null,
      fechada: conectar.length === 1 && conectar[0] === "'none'",
      soPropria: conectar.length === 1 && conectar[0] === "'self'",
      comMedida: conectar.length === 2 && conectar[0] === "'self'" && /^https:\/\/[a-z0-9.-]+$/.test(conectar[1]),
      prometeSemRede: /NADA SAI DESTE APARELHO/.test(txtLigado) || /NÃO TEM REDE/.test(txtLigado)
        || /NÃO SAI UM BYTE/.test(txtLigado),
      dizArtePropria: /FICA NESTE APARELHO/.test(txtLigado) && /SÓ BAIXA A ARTE DELE/.test(txtLigado) };
  });
  log('   AJUSTES diz: "' + priv.txt + '"');
  log('   CSP connect-src: ' + priv.conectar.join(' '));
  if (priv.fechada) {
    ok(priv.prometeSemRede, priv.prometeSemRede
      ? 'a tela promete "sem rede" e a CSP fecha a rede'
      : 'a CSP não deixa nada sair e a tela deixou de dizer isso — a promessa mais forte foi perdida de graça');
  } else if (priv.soPropria) {
    ok(!priv.prometeSemRede && priv.dizArtePropria,
      !priv.prometeSemRede && priv.dizArtePropria
        ? 'a CSP abriu só para o próprio site e a tela diz exatamente isso'
        : (priv.prometeSemRede
            ? 'a tela AINDA promete "sem rede" e a CSP JÁ ABRIU — reescreva a tela na mesma fase'
            : 'a CSP abriu para o próprio site e a tela não conta o que o jogo busca — diga, ou a omissão vira a mentira seguinte'));
  } else if (priv.comMedida) {
    const host = priv.conectar[1];
    log('   host aberto: ' + host + ' | o jogo chama: ' + priv.endereco);
    log('   botão: "' + priv.rot + '" -> um toque -> "' + priv.rotOff + '"');
    log('   e a frase vira: "' + (priv.txtOff || '').slice(-70) + '"');
    // 1. a tela não pode mais prometer o que a CSP já não garante
    ok(!priv.prometeSemRede,
      !priv.prometeSemRede
        ? 'a CSP abriu um host de fora e a tela parou de prometer que nada sai'
        : 'a tela AINDA promete que nada sai e a CSP JÁ ABRIU um host — reescreva a tela na mesma fase');
    // 2. e continua dizendo o que continua verdade, que é a parte que a pessoa quer ouvir
    ok(priv.dizArtePropria,
      'a tela continua dizendo que o PROGRESSO fica no aparelho e que o jogo baixa a arte dele');
    // 3. o que sai, dito em palavras de gente — e o que NÃO sai, item por item
    const conta = /MANDA UMA CONTAGEM/.test(priv.txt);
    const negativas = ['SEM NOME', 'SEM E-MAIL', 'SEM IP', 'SEM COOKIE', 'SEM ANÚNCIO']
      .filter(n => new RegExp(n).test(priv.txt));
    ok(conta, conta ? 'a tela diz, em português de gente, que uma contagem sai daqui'
                    : 'a CSP abriu um host e a tela não diz que algo sai — a omissão É a mentira seguinte');
    ok(negativas.length === 5, 'e diz o que NÃO sai, uma coisa por vez: ' + negativas.join(' · '));
    // 3b. E DIZ AS DUAS COISAS QUE NÃO SÃO "CONTAGEM". O relatório de erro e a resposta da
    //     pergunta do fim entraram depois dos sete eventos de retenção e são de outra
    //     natureza — um é um defeito, o outro é uma frase que alguém escolheu. "Uma contagem
    //     anônima" continuaria verdadeiro ao pé da letra e falso no que importa, que é a
    //     forma mais elegante de a tela mentir sem uma palavra falsa. §3 do CLAUDE.md.
    const dizErro = /A MENSAGEM/.test(priv.txt) && /DO ERRO/.test(priv.txt);
    const dizResposta = /RESPOSTA À PERGUNTA DO FIM/.test(priv.txt);
    ok(dizErro, dizErro
      ? 'a tela diz que, se o jogo quebrar, a mensagem do erro sai daqui'
      : 'o jogo manda relatório de erro e a tela não conta — "uma contagem" não descreve isso');
    ok(dizResposta, dizResposta
      ? 'e diz que a resposta da pergunta do fim sai junto, se a pessoa responder'
      : 'a pergunta do fim manda a resposta para fora e a tela não conta que manda');
    // 4. afirmação sem interruptor é aviso, não escolha
    ok(priv.temBotao && /LIGADA/.test(priv.rot || ''),
      'existe um interruptor na própria tela, e ele diz que está ligado');
    ok(/DESLIGADA/.test(priv.rotOff || '') && /NÃO SAI UM BYTE/.test(priv.txtOff || ''),
      'um toque desliga, e a FRASE muda junto — a confirmação é o texto, não um alerta');
    // 5. a CSP autoriza exatamente o endereço que o jogo chama, e não um parecido
    ok(!!priv.endereco && priv.endereco.indexOf(host + '/') === 0,
      'o host que a CSP abre é o host que o jogo chama (' + host + ')');
    // 6. e a chave é a PUBLICÁVEL. O build já reprova isso, mas o build lê o disco e este teste
    //    lê o jogo VIVO — e é o jogo vivo que vai para o navegador de outra pessoa.
    ok(/^phc_/.test(priv.chave || ''),
      'a chave embutida é a publicável do PostHog (phc_), nunca uma de serviço');
  } else {
    ok(false, 'a CSP `connect-src` está "' + priv.conectar.join(' ')
      + '" — nenhum dos estados que esta asserção conhece. Escreva o estado novo aqui junto.');
  }

  // ============================================================
  // 9 · A TRAVESSIA TEM DURAÇÃO PRÓPRIA
  //
  // O relatório 3 do QA mediu: 25 s sem tocar e a tela continuava na linha 0. Os "~90 s" do
  // desenho eram o tempo de quem toca — e a travessia é justamente o trecho cuja tese é que
  // não há o que a sua mão faça ali. Agora a fala anda sozinha DENTRO da travessia, e só
  // dentro dela: abertura e fecho de capítulo continuam esperando o dedo.
  //
  // As duas metades são verificadas, porque uma sem a outra é um defeito diferente: se só a
  // primeira passar, o jogo anda sozinho onde não devia; se só a segunda, voltamos ao 25 s.
  // ============================================================
  sec('9 · a travessia anda sozinha; a abertura de capítulo não');
  const anda = await page.evaluate(() => new Promise(res => {
    fecharTudo();
    correrTravessia("pindorama", "palmares", function () { });
    setTimeout(() => res({ i: falaI, viva: !!falaViva, n: falaLinhas.length,
      // e o rótulo do botão dourado, que continuava prometendo "+1,0" num trecho em que
      // `clicar()` sai na primeira linha: a interface anunciando o que o jogo recusa
      rotulo: (document.querySelector('#cliqueRotulo') || {}).getAttribute
        ? document.querySelector('#cliqueRotulo').getAttribute('aria-label') : null }), 15000);
  }));
  // 15 s, e o número é ARITMÉTICA, não chute — com 11 s este bloco falhava uma vez a cada
  // sete rodadas, e uma asserção intermitente é uma asserção que se aprende a ignorar.
  // A conta até a linha 2: 3,4 s de cerimônia do nome + (0,74 s de digitação + 2,33 s de
  // pausa) da linha 0 + (1,06 + 2,87) da linha 1 = **10,4 s**. Com 11 s a margem era de 600
  // ms — menos que um engasgo de GC no headless. Com 15 s ela é de 4,6 s, e o teto de pausa
  // (4,6 s) garante que nem a linha mais longa estica isso.
  log('   o botão dourado, durante a travessia, diz: "' + anda.rotulo + '"');
  ok(!/\+/.test(anda.rotulo || ''), /\+/.test(anda.rotulo || '')
    ? 'o botão promete "' + anda.rotulo + '" num trecho em que ele não rende nada'
    : 'e o botão aceso não promete ganho nenhum (QA relatório 3)');
  log('   15 s sem encostar na tela: linha ' + anda.i + ' de ' + anda.n);
  ok(anda.i >= 2, anda.i >= 2
    ? 'o trecho se conta sozinho (' + anda.i + ' linhas em 15 s)'
    : 'a travessia PAROU na linha ' + anda.i + ' — ela não tem duração própria');

  const parada = await page.evaluate(() => new Promise(res => {
    fecharTudo();
    // a abertura do capítulo 1, forçada a aparecer mesmo já vista
    S.aberturas = 0; S.cenario = 0;
    mostrarAbertura(function () { }, true);
    setTimeout(() => res({ i: falaI, viva: !!falaViva }), 9000);
  }));
  log('   abertura de capítulo, 9 s sem encostar: linha ' + parada.i);
  ok(parada.i === 0, parada.i === 0
    ? 'e a abertura de capítulo espera o dedo, como sempre esperou'
    : 'a abertura de capítulo TAMBÉM anda sozinha — o automático vazou da travessia');
  await page.evaluate(() => fecharTudo());

  // ============================================================
  // 10 · A CHEGADA — o jogo tem de avisar que acabou, e não pode avisar por cima de ninguém
  //
  // O relatório 3 do QA: "o fecho final devolve à mesma rua, barra em 100%, 40 toques depois
  // +56 e nada." Três coisas podem quebrar em silêncio aqui, e as três estão abaixo:
  //  · a tela não nascer no fim (volta ao defeito de origem);
  //  · a tela nascer POR CIMA de uma leitura — foi o que o smoke pegou na primeira versão,
  //    porque `verificarCenario` roda a cada quadro e o mundo vive sob o menu;
  //  · o placar mentir. Ele é a única parte da tela que faz afirmação, e afirmação sobre o
  //    que a pessoa leu tem de bater com os bits que o save guarda.
  // ============================================================
  sec('10 · a chegada avisa, é honesta, e não atropela leitura');
  const fim = await page.evaluate(async () => {
    fecharTudo(); fecharTelas();
    // a última cena, e o fecho do último capítulo JÁ LIDO — é o caminho de quem fechou o
    // jogo antes de a CHEGADA existir, e é o que exercita o segundo ramo da guarda
    R.chegou = 0; S.aberturas = 1; S.fechos = MASCARA_EPOCAS; S.travessias = 0;
    R.historia = 0; R.fontes = 0; visitando = false;
    S.cenario = TOTAL_CENAS - 1; S.fronteira = S.cenario;
    S.energiaTotal = LIMIAR_FIM + 1; S.energia = S.energiaTotal;
    verificarCenario();
    await new Promise(r => setTimeout(r, 500));
    const t = document.getElementById('telaFim');
    const linhas = [...document.querySelectorAll('#fimPlacar .fimLin')].map(function (d) {
      return { r: d.querySelector('.fimR').textContent, v: d.querySelector('.fimV').textContent,
               falta: d.classList.contains('falta') };
    });
    return { aberta: t.classList.contains('aberta'), chegou: R.chegou | 0,
      linhas: linhas, porta: !document.getElementById('btnFim').classList.contains('oculto') };
  });
  log('   ' + fim.linhas.map(l => l.r + ' = ' + l.v + (l.falta ? ' ⟵falta' : '')).join(' | '));
  ok(fim.aberta, fim.aberta ? 'o jogo acaba e AVISA' : 'o jogo acabou e não avisou (N3)');
  ok(fim.chegou === 1, 'a chegada ficou registrada uma vez (chegou=' + fim.chegou + ')');
  const capAb = fim.linhas.find(l => /aberturas/.test(l.r));
  ok(!!capAb && /^1 de /.test(capAb.v) && capAb.falta,
    'o placar conta o que a pessoa REALMENTE leu, e marca o que falta');
  const dv = fim.linhas.find(l => /DE ONDE VEM/.test(l.r));
  ok(!!dv && dv.v === 'nunca aberta' && dv.falta, 'quem nunca abriu as fontes descobre aqui');
  // e o placar NÃO pode carregar placar de jogo: impacto e recursos são número de jogo, e
  // número de jogo virando nota de história é o que o §2 proíbe.
  const juntos = fim.linhas.map(l => l.r + ' ' + l.v).join(' ');
  ok(!/impacto|recurso|pontos|score/i.test(juntos),
    'e não há pontuação nenhuma — a chegada não é troféu');

  // agora com uma tela aberta: a chegada tem de ESPERAR
  const atropelo = await page.evaluate(async () => {
    fecharTelas(); R.chegou = 0; S.cenario = TOTAL_CENAS - 1; visitando = false;
    montarCompletude(); abrirTela('telaCompletude');
    S.energiaTotal = LIMIAR_FIM + 1; S.energia = S.energiaTotal;
    verificarCenario();
    await new Promise(r => setTimeout(r, 400));
    const quem = document.getElementById('telaFim').classList.contains('aberta');
    fecharTelas();
    return { roubou: quem, chegou: R.chegou | 0 };
  });
  log('   com A HISTÓRIA aberta: a chegada ' + (atropelo.roubou ? 'ROUBOU' : 'esperou'));
  ok(!atropelo.roubou, atropelo.roubou
    ? 'a chegada nasceu por cima de uma leitura em curso'
    : 'e ela espera a pessoa voltar para a rua em vez de interromper');
  await page.evaluate(() => fecharTelas());

  // ============================================================
  // 11 · O QUE FOI RECOLHIDO CONTINUA RECOLHIDO
  //
  // Os três contadores de drop eram estado de SESSÃO por esquecimento, não por decisão:
  // `recursos` nunca esteve no ESQUEMA_SAVE, e campo que não está lá não é lido nem gravado.
  // Ficou invisível enquanto os nichos existiam sempre; a onda 11 os fez nascer com o
  // primeiro item, e aí a perda apareceu — a fileira encolhia de volta a nada no dia
  // seguinte, como se nada tivesse sido recolhido. Num jogo cujo critério é dar motivo para
  // voltar amanhã, perder o que a pessoa juntou é o defeito mais caro que existe.
  // ============================================================
  sec('11 · os recursos sobrevivem ao dia seguinte');
  await page.evaluate(() => { S.recursos = { flor: 7, agua: 3, refeicao: 2 }; salvar(); });
  await page.reload();
  await page.waitForTimeout(900);
  const rec = await page.evaluate(() => ({
    vivo: JSON.stringify(S.recursos),
    // e a régua do §3: chave inventada não entra, valor fora da faixa não passa
    sujo: JSON.stringify(valida(ESQUEMA_SAVE.recursos,
      { flor: 5e9, agua: 'muitas', refeicao: -5, inventado: 9 }))
  }));
  log('   depois de recarregar: ' + rec.vivo);
  log('   um save adulterado vira: ' + rec.sujo);
  ok(rec.vivo === '{"flor":7,"agua":3,"refeicao":2}',
    'o que foi recolhido continua recolhido depois do recarregamento');
  ok(!/inventado/.test(rec.sujo) && /"agua":0/.test(rec.sujo) && /"refeicao":0/.test(rec.sujo),
    'e um save adulterado não escreve nada no nicho: chave inventada some, valor torto vira 0');

  // ============================================================
  // 12 · A PINTURA PERTENCE AO CAPÍTULO, NÃO À POSIÇÃO DELE
  //
  // Era o último lugar do jogo em que acrescentar um capítulo QUEBRAVA os outros, e o mais
  // silencioso: `CENARIO_ALTO_B64` é uma lista em ordem de cena, e o índice saía direto de
  // `S.cenario`. Um capítulo inserido no meio empurra todas as cenas depois dele — e a
  // pintura de AINDA AQUI vai parar no capítulo errado, sem um erro no console. Mesmo modo
  // de falha que custou §2 na travessia; mesma cura: identidade em vez de posição.
  //
  // A asserção SIMULA a inserção: mexe no `arte` como se um capítulo novo tivesse entrado, e
  // cobra que ninguém se mova. Verificar só o mapeamento de hoje não prova nada — ele estava
  // certo antes também.
  // ============================================================
  sec('12 · inserir capítulo não move a pintura de ninguém');
  const arte = await page.evaluate(async () => {
    // A ARTE TEM DE ESTAR TODA AQUI ANTES DE MEDIR. Desde a carga sob demanda (10/08) a
    // pintura dos capítulos 2+ chega por pacote, e `fundoIdx()` RECUA para uma pintura que já
    // carregou enquanto o pacote viaja — de propósito, para o jogo nunca ficar sem chão. Medir
    // antes de os pacotes chegarem media o recuo, não o mapeamento: PALMARES aparecia como
    // "0,0" e a asserção acusava uma regressão que não existia.
    for (let e = 0; e < EPOCAS.length; e++) garantirEpoca(e);
    for (let t = 0; t < 400 && Object.keys(pacoteEstado).some(n => pacoteEstado[n] !== 'aqui'); t++) {
      await new Promise(r => setTimeout(r, 25));
    }
    const antes = [];
    for (let n = 0; n < TOTAL_CENAS; n++) { S.cenario = n; antes.push(fundoIdx()); }
    // finge um capítulo novo entre SALVADOR e AINDA AQUI: uma cena a mais, sem pintura
    const novo = { id: 'ensaio', nome: 'ENSAIO', quando: '', cenas: 1, lugar: 'hoje',
      abertura: ['x'], fecho: ['x'] };
    EPOCAS.splice(EPOCAS.length - 1, 0, novo);
    EPOCA_CENA0.length = 0; const guardaTotal = TOTAL_CENAS;
    let t = 0;
    EPOCAS.forEach(function (ep) { EPOCA_CENA0.push(t); t += ep.cenas; });
    TOTAL_CENAS = t;
    const depois = [];
    // as cenas do capítulo novo entram no meio, então cada capítulo é conferido pelo NOME
    const porCapitulo = {};
    for (let n = 0; n < TOTAL_CENAS; n++) {
      S.cenario = n;
      const nome = EPOCAS[epocaDoCenario(n)].nome;
      (porCapitulo[nome] = porCapitulo[nome] || []).push(fundoIdx());
    }
    // desfaz
    EPOCAS.splice(EPOCAS.length - 2, 1);
    EPOCA_CENA0.length = 0; t = 0;
    EPOCAS.forEach(function (ep) { EPOCA_CENA0.push(t); t += ep.cenas; });
    TOTAL_CENAS = guardaTotal; S.cenario = 0;
    return { antes: antes, porCapitulo: porCapitulo };
  });
  log('   antes da inserção, cena→pintura: ' + arte.antes.join(', '));
  Object.keys(arte.porCapitulo).forEach(function (k) {
    log('   depois: ' + k + ' → ' + arte.porCapitulo[k].join(', '));
  });
  const esperado = { PINDORAMA: '0,1', PALMARES: '2,3', SALVADOR: '4', 'AINDA AQUI': '5,6' };
  Object.keys(esperado).forEach(function (k) {
    const teve = (arte.porCapitulo[k] || []).join(',');
    ok(teve === esperado[k], teve === esperado[k]
      ? k + ' continua com a pintura dele (' + teve + ') depois de um capítulo entrar no meio'
      : k + ' PERDEU a pintura: era ' + esperado[k] + ', virou ' + teve);
  });

  // ============================================================
  // 13 · O PRIMEIRO MINUTO — o gesto que o jogo exige e não ensinava
  //
  // O QA dos cinco minutos mediu o pior número que este repositório já produziu: uma pessoa
  // que TOCA (cem toques, um a cada três segundos, cinco minutos) consegue **zero alcances em
  // 132 vultos**. `CFG.mobHp` é 5/8/13 e um toque solto tira 1. Segurando, 40 s rendem 20
  // chegadas. O jogo só acontece para quem segura, e nada dizia isso.
  //
  // E o `×100 TESTE` era grátis e visível no segundo zero: comprado aos 20,2 s, PINDORAMA
  // liquidado aos 76. Um interruptor que trivializa o jogo não pode ser a porta de entrada.
  // ============================================================
  sec('13 · o primeiro minuto: a dica de segurar, e o ×100 fora da porta');
  const inicio = await page.evaluate(async () => {
    localStorage.clear();
    fecharTelas(); fecharTudo();
    S.aberturas = MASCARA_EPOCAS; S.energiaTotal = 0; S.energia = 0; S.u4 = false;
    dicaSegurarVista = false; dicaSegurarAte = 0; toquesSoltos = 0;
    desenhar();
    // um toque na metade DIREITA da rua, pelo mesmo caminho que o dedo usa
    const cv = document.getElementById('scene');
    const cr = cv.getBoundingClientRect();
    const tocarDireita = function () {
      cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1,
        clientX: cr.left + cr.width * 0.75, clientY: cr.top + cr.height * 0.7 }));
    };
    const card = document.getElementById('cardU4');
    const noBoot = getComputedStyle(card).display;
    // dois toques soltos: ainda não é teimosia o bastante
    tocarDireita(); tocarDireita();
    const doisToques = dicaSegurarAte > relogio;
    tocarDireita();
    const tresToques = dicaSegurarAte > relogio;
    // e segurar mata a dica na hora
    document.getElementById('btnClique').dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
    await new Promise(r => setTimeout(r, 60));
    const depoisDeSegurar = dicaSegurarAte > relogio;
    document.getElementById('btnClique').dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
    S.energiaTotal = 149; desenhar();
    const com149 = getComputedStyle(card).display;
    S.energiaTotal = 150; desenhar();
    const com150 = getComputedStyle(card).display;
    return { noBoot: noBoot, doisToques: doisToques, tresToques: tresToques,
      depoisDeSegurar: depoisDeSegurar, com149: com149, com150: com150 };
  });
  log('   dica de segurar: 2 toques → ' + inicio.doisToques + ' | 3 toques → ' + inicio.tresToques +
    ' | depois de segurar → ' + inicio.depoisDeSegurar);
  log('   ×100 no boot: ' + inicio.noBoot + ' | com 149: ' + inicio.com149 + ' | com 150: ' + inicio.com150);
  ok(!inicio.doisToques && inicio.tresToques,
    'o terceiro toque solto acende "SEGURE PARA ALCANÇAR" (e o segundo ainda não)');
  ok(!inicio.depoisDeSegurar, 'e segurar apaga a dica na hora — quem descobriu não precisa de aviso');
  ok(inicio.noBoot === 'none' && inicio.com149 === 'none' && inicio.com150 !== 'none',
    'o ×100 só aparece quando a primeira melhoria de verdade fica ao alcance (150)');

  // ============================================================
  // 14 · O CARTÃO DO LINK — a única coisa fora do arquivo único
  //
  // Um jogo web sem prévia vira retângulo cinza no WhatsApp, que é por onde ele vai circular
  // no Brasil. As tags og: não são carregadas pelo jogo (quem as lê é o robô da rede social),
  // e por isso ninguém percebe quando elas quebram — robô não reclama, só mostra o cinza.
  // Três coisas podem apodrecer em silêncio, e as três estão abaixo:
  //  · as URLs desencontrarem quando o domínio próprio chegar (elas mudam JUNTAS ou nada);
  //  · a imagem sumir de `dist/`, que é de onde a Vercel publica;
  //  · o tamanho declarado deixar de bater com o arquivo, e o cartão sair cortado.
  // ============================================================
  sec('14 · o cartão do link não apodrece em silêncio');
  const cartao = await page.evaluate(() => {
    const m = function (sel) { const e = document.querySelector(sel); return e ? e.content : null; };
    return { titulo: document.title, desc: m('meta[name="description"]'),
      ogT: m('meta[property="og:title"]'), ogD: m('meta[property="og:description"]'),
      ogU: m('meta[property="og:url"]'), ogI: m('meta[property="og:image"]'),
      w: m('meta[property="og:image:width"]'), h: m('meta[property="og:image:height"]'),
      tw: m('meta[name="twitter:card"]') };
  });
  const dominio = (cartao.ogU || '').replace(/\/$/, '');
  log('   ' + cartao.titulo + ' → ' + cartao.ogI);
  ok(!!cartao.ogT && !!cartao.ogD && !!cartao.ogI && cartao.tw === 'summary_large_image',
    'o link tem título, descrição, imagem e cartão grande');
  ok(!!dominio && (cartao.ogI || '').indexOf(dominio + '/') === 0,
    'a imagem mora no MESMO endereço da página (as URLs mudam juntas ou a prévia quebra)');
  ok(cartao.w === '1200' && cartao.h === '630',
    'o tamanho declarado é o que WhatsApp, Twitter e Facebook usam');
  const previa = fs.existsSync(path.resolve(__dirname, '..', 'dist', 'compartilhar.jpg'));
  const kb = previa ? Math.round(fs.statSync(path.resolve(__dirname, '..', 'dist', 'compartilhar.jpg')).size / 1024) : 0;
  log('   dist/compartilhar.jpg: ' + (previa ? kb + ' KB' : 'AUSENTE'));
  ok(previa, 'a imagem está em dist/, que é de onde a Vercel publica');
  ok(kb > 0 && kb < 400, 'e ela pesa ' + kb + ' KB — o robô da prévia desiste de imagem grande');

  // ============================================================
  // 15 · O CAPÍTULO EM OBRA NÃO AFIRMA HISTÓRIA
  //
  // Os doze capítulos do arco existem na estrutura desde 09/08 (decisão do dono: "garantir
  // que tudo já exista e tenha como placeholder"). O risco que isso cria é UM só e é §2:
  // alguém preenche um placeholder com "uma frase só para não ficar vazio", e o jogo passa a
  // afirmar história sem fonte — em silêncio, porque nenhum teste olhava para o texto de um
  // capítulo em obra. Aqui se cobra o mínimo verificável por máquina: NENHUM DÍGITO na fala
  // de um capítulo em obra. Data, quantidade e ano são o que exige fonte, e o `quando` (que
  // é o RECORTE do arco, não uma afirmação solta) fica de fora da varredura de propósito.
  //
  // E mais duas amarras estruturais que, quebradas, não dão erro nenhum: AINDA AQUI tem de
  // continuar sendo o ÚLTIMO (a tela de CHEGADA diz o nome dele em voz alta), e todo capítulo
  // tem de apontar para um bloco de arte que existe.
  // ============================================================
  sec('15 · capítulo em obra: existe, é jogável, e não afirma nada');
  const obra = await page.evaluate(() => ({
    n: EPOCAS.length,
    ultimo: EPOCAS[EPOCAS.length - 1].nome,
    emObra: EPOCAS.filter(e => e.emObra).map(e => e.nome),
    comDigito: EPOCAS.filter(e => e.emObra)
      .filter(e => [...e.abertura, ...e.fecho].some(l => /\d/.test(l))).map(e => e.nome),
    arteFora: EPOCAS.filter(e => e.arteCap == null || e.arteCap < 0 || e.arteCap >= HERO_CAP_B64.length)
      .map(e => e.nome),
    cenaFora: EPOCAS.filter(e => (e.arte || []).some(i => i < 0 || i >= CENARIO_ALTO_B64.length))
      .map(e => e.nome),
    mascara: MASCARA_EPOCAS, acolhidos: S.acolhidos.length, cenas: TOTAL_CENAS, fim: LIMIAR_FIM
  }));
  log('   ' + obra.n + ' capítulos, ' + obra.emObra.length + ' em obra | ' + obra.cenas +
    ' cenas | LIMIAR_FIM ' + obra.fim + ' | máscara ' + obra.mascara);
  log('   em obra: ' + obra.emObra.join(' · '));
  ok(obra.ultimo === 'AINDA AQUI', 'AINDA AQUI continua sendo o último capítulo (a CHEGADA depende disso)');
  ok(!obra.comDigito.length, obra.comDigito.length
    ? 'capítulo em obra escrevendo número: ' + obra.comDigito.join(', ')
    : 'nenhum capítulo em obra escreve dígito na fala — sem fonte, não se afirma');
  ok(!obra.arteFora.length, 'todo capítulo aponta para um bloco de arte que existe' +
    (obra.arteFora.length ? ' — fora: ' + obra.arteFora.join(', ') : ''));
  ok(!obra.cenaFora.length, 'toda cena declarada tem pintura' +
    (obra.cenaFora.length ? ' — fora: ' + obra.cenaFora.join(', ') : ''));
  ok(obra.acolhidos === obra.n, 'S.acolhidos tem uma posição por capítulo (' + obra.acolhidos + ')');
  ok(obra.mascara === (Math.pow(2, obra.n) - 1) && obra.n < 31,
    'a máscara de bits das falas cabe nos ' + obra.n + ' capítulos');

  // ============================================================
  // 16 · CAPÍTULO VAZIO NÃO COBRA PEDÁGIO
  //
  // Os oito capítulos-esqueleto entraram para a estrutura existir antes do conteúdo. Com o
  // passo plano (`LIMIAR_CENA * li`), a partida inteira ficou **2,14× mais longa** de um
  // commit para o outro — 10.500 viraram 22.500. Doze mil de impacto cobrados para atravessar
  // capítulos que ainda não têm uma frase para ler, que é o contrário do que foi pedido.
  //
  // Duas coisas são cobradas aqui, e a segunda é a que protege o que já estava medido: o
  // capítulo em obra custa uma fração, E os limiares dos capítulos ESCRITOS não se movem.
  // Sem a segunda, um conserto de comprimento vira uma mudança de economia por tabela.
  // ============================================================
  sec('16 · capítulo em obra custa uma fração, e os escritos não se movem');
  const eco = await page.evaluate(() => ({
    fim: LIMIAR_FIM, cena: LIMIAR_CENA, obra: LIMIAR_OBRA,
    primeiros: LIMIARES.slice(0, 4),
    obras: EPOCAS.filter(function (e) { return e.emObra; }).length,
    total: EPOCAS.length
  }));
  log('   ' + eco.obras + ' de ' + eco.total + ' capítulos em obra | fim em ' + eco.fim +
    ' | primeiros limiares ' + eco.primeiros.join(', '));
  // 10.500 é o fim do jogo com os QUATRO capítulos escritos, e é a régua: os oito esqueletos
  // podem acrescentar um tanto, nunca dobrar.
  ok(eco.fim < 10500 * 1.25,
    'os capítulos em obra somam menos de um quarto do jogo (fim em ' + eco.fim + ', régua 13.125)');
  ok(eco.obra * 4 <= eco.cena,
    'um capítulo em obra custa no máximo um quarto do que custa um escrito');
  ok(JSON.stringify(eco.primeiros) === JSON.stringify([1500, 3000, 4500, 6000]),
    'e os limiares dos capítulos escritos continuam onde foram medidos');

  // ============================================================
  // 17 · A MEDIÇÃO NÃO PODE ATRAPALHAR NINGUÉM — e não pode levar ninguém junto
  //
  // Duas promessas foram feitas na tela de AJUSTES e no CLAUDE.md, e as duas são do tipo que
  // ninguém percebe quando quebra, porque quebram no aparelho de outra pessoa:
  //
  //  (a) **O JOGO NUNCA DEPENDE DISTO.** PostHog fora do ar, endereço bloqueado por adblock,
  //      servidor que aceita a conexão e nunca responde — o jogo tem de rodar igual, sem erro
  //      e sem espera. É a promessa mais fácil de quebrar do repositório: basta um `await`.
  //  (b) **NÃO SAI NADA QUE IDENTIFIQUE NINGUÉM.** A tela lista cinco negativas (sem nome, sem
  //      e-mail, sem IP, sem cookie, sem anúncio). Aqui elas param de ser texto e viram
  //      medida: o corpo do pedido é aberto e conferido campo a campo, e o cabeçalho é lido
  //      atrás de cookie.
  //
  // COMO: o `index.html` do disco é servido a partir de uma origem https falsa, por
  // interceptação — porque sob `file://` o jogo não manda nada (guarda deliberada, mesma de
  // `garantirPacote`) e o teste passaria sem exercitar uma linha. Quatro cenários, cada um em
  // sua própria página, e o quarto é o interruptor.
  // ============================================================
  sec('17 · a medição some sem levar o jogo junto, e não carrega ninguém consigo');
  const HTML = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
  const ORIGEM = 'https://encaixe.local/';
  // `op.esperado` é a válvula dos blocos 18 e 20: eles PROVOCAM um defeito de propósito, e sem
  // ela o próprio erro encenado seria contado como erro do jogo. `op.provocar` roda com a
  // página já viva, depois da espera, e antes da conferência de que a partida seguiu.
  async function rodarMedida(modo, op) {
    op = op || {};
    const pg = await browser.newPage({
      viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2
    });
    const pedidos = [];
    const ruins = [];
    pg.on('pageerror', e => { if (op.esperado && op.esperado.test(e.message)) return; ruins.push('PAGEERROR: ' + e.message); });
    pg.on('console', m => {
      if (m.type() !== 'error') return;
      const t = m.text();
      // Pedido de rede que o NAVEGADOR recusou não é defeito do jogo — é exatamente o que este
      // bloco está encenando, e um adblock de verdade escreve a mesma linha. O que não pode
      // aparecer é qualquer outro erro: esse seria do jogo.
      if (/posthog|Failed to load resource|ERR_/i.test(t)) return;
      if (op.esperado && op.esperado.test(t)) return;
      ruins.push('CONSOLE: ' + t);
    });
    await pg.route('**/*', async (route) => {
      const req = route.request();
      const u = req.url();
      if (/posthog/.test(u)) {
        pedidos.push({ url: u, corpo: req.postData(), cabecalhos: req.headers() });
        if (modo === 'adblock') return route.abort('blockedbyclient');
        if (modo === 'mudo') return;                       // aceita e nunca responde
        return route.fulfill({ status: 503, body: 'fora do ar' });
      }
      if (u === ORIGEM || u === ORIGEM.slice(0, -1)) {
        // `op.injetar` entra no HTML SERVIDO, como último script do corpo — depois do jogo,
        // que registra os ganchos de erro no topo do módulo. Tem de ser assim e não por
        // `createElement('script')`: o Chromium só dá `filename` a script que veio do
        // ANALISADOR da página. Script criado por código, ou jogado por `page.evaluate`,
        // chega com o campo vazio — e o teste acusaria o jogo de não saber dizer o arquivo.
        const corpo = op.injetar
          ? HTML.replace('</body>', () => '<script>' + op.injetar + '</scr' + 'ipt></body>')
          : HTML;
        return route.fulfill({ contentType: 'text/html; charset=utf-8', body: corpo });
      }
      const pack = u.match(/\/(pack-[\w-]+\.json)$/);
      if (pack) {
        const f = path.resolve(__dirname, '..', pack[1]);
        if (fs.existsSync(f)) return route.fulfill({ contentType: 'application/json', body: fs.readFileSync(f) });
      }
      return route.abort();
    });
    const t0 = Date.now();
    await pg.goto(ORIGEM);
    if (modo === 'desligado') {
      // desliga pelo BOTÃO da tela, como a pessoa desligaria, e recarrega
      await pg.waitForTimeout(600);
      await pg.evaluate(() => {
        fecharTudo(); abrirTela('telaConfig'); montarConfig();
        document.getElementById('btnMedir').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      });
      pedidos.length = 0;
      await pg.reload();
    }
    await pg.waitForTimeout(1400);
    let colhido = null;
    if (op.provocar) { colhido = await op.provocar(pg); await pg.waitForTimeout(600); }
    // e o jogo continua sendo jogado: a rua anda e a leitura abre
    const vivo = await pg.evaluate(async () => {
      fecharTudo();
      const antes = worldX;
      document.getElementById('btnCompletude').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await new Promise(r => setTimeout(r, 500));
      return { andou: worldX - antes, tela: document.getElementById('telaCompletude').classList.contains('aberta') };
    });
    const ms = Date.now() - t0;
    await pg.close();
    return { modo, pedidos, ruins, vivo, ms, colhido };
  }
  // os eventos que saíram, abertos — é assim que os blocos 18/19/20 leem o que foi medido
  const eventos = r => r.pedidos.map(p => { try { return JSON.parse(p.corpo || '{}'); } catch (e) { return {}; } });
  // O marcador de "o jogo já responde" é a RUA TER ANDADO: não há relógio melhor, porque o
  // laço de quadro só existe depois de o jogo estar inteiro de pé.
  for (const modo of ['adblock', 'mudo', '503']) {
    const r = await rodarMedida(modo).catch(e => ({ modo, erro: String(e) }));
    if (r.erro) { ok(false, modo + ': o teste explodiu — ' + r.erro); continue; }
    log('   [' + modo + '] ' + r.pedidos.length + ' pedido(s) à medição | a rua andou '
      + r.vivo.andou.toFixed(1) + ' px | ' + r.ruins.length + ' erro(s) do jogo | carga em ' + r.ms + ' ms');
    ok(r.pedidos.length > 0, 'com o endereço ' + modo + ', o jogo TENTOU medir (' + r.pedidos.length + ' pedido)');
    ok(r.ruins.length === 0, r.ruins.length === 0
      ? 'e não soltou um erro sequer: ' + modo + ' não é problema do jogador'
      : 'o jogo reclamou por causa da medição: ' + r.ruins[0]);
    ok(r.vivo.andou > 1 && r.vivo.tela,
      'e a partida seguiu inteira — a rua andou e A HISTÓRIA abriu (' + modo + ')');
    // O CORPO, ABERTO. Só no primeiro cenário: é o mesmo corpo nos três.
    if (modo === 'adblock') {
      const c = JSON.parse(r.pedidos[0].corpo || '{}');
      const props = Object.keys(c.properties || {}).sort();
      log('   corpo: evento "' + c.event + '" | distinct_id ' + String(c.distinct_id).slice(0, 8)
        + '… | propriedades: ' + props.join(', '));
      ok(/^phc_/.test(c.api_key || ''), 'o corpo leva a chave publicável, e é a única credencial nele');
      ok(/^[0-9a-f]{32}$/.test(c.distinct_id || ''),
        'o identificador é um número sorteado de 32 dígitos hex — não veio de nada seu');
      ok(c.properties && c.properties.$ip === null,
        'o corpo manda `$ip: null` — o PostHog descarta o endereço em vez de guardar e geolocalizar');
      ok(c.properties && c.properties.$process_person_profile === false,
        'e `$process_person_profile: false` — o evento é contado sem abrir ficha de ninguém');
      ok(!r.pedidos[0].cabecalhos.cookie,
        'e o pedido vai sem cookie nenhum (credentials: "omit")');
      // A LISTA BRANCA. Qualquer propriedade nova aparece aqui como falha, e é de propósito:
      // o jeito de vazar algo é acrescentar um campo achando que ele é inofensivo.
      // `msg`, `arquivo` e `linha` entraram com o relatório de erro (bloco 18) — as três, e
      // nada além delas: relatório de defeito é o esconderijo clássico de dado de gente,
      // porque parece técnico e ninguém o lê como dado pessoal.
      // `resposta` entrou com a pergunta da CHEGADA (bloco 19) e `sessao` com o "onde parou"
      // (bloco 20).
      const PERMITIDAS = ['$ip', '$lib', '$process_person_profile', 'arquivo', 'capitulo',
        'daChegada', 'dia', 'linha', 'minutos', 'msg', 'n', 'nome', 'resposta', 'sessao',
        'terminou', 'vez'];
      const estranhas = props.filter(p => PERMITIDAS.indexOf(p) < 0);
      ok(estranhas.length === 0, estranhas.length === 0
        ? 'e nenhuma propriedade fora da lista branca — nada de tela, idioma, fuso ou navegador'
        : 'propriedade que ninguém aprovou no corpo do evento: ' + estranhas.join(', '));
      ok(!/nome|email|e-mail|ip|user|agent/i.test(JSON.stringify(c).replace(/"(nome|\$ip)":/g, '""')),
        'e o corpo inteiro não carrega palavra de identificação escondida');
    }
  }
  // O INTERRUPTOR. Não é "menos dados": é nenhum.
  const desl = await rodarMedida('desligado').catch(e => ({ modo: 'desligado', erro: String(e) }));
  if (desl.erro) { ok(false, 'desligado: o teste explodiu — ' + desl.erro); }
  else {
    log('   [desligado] ' + desl.pedidos.length + ' pedido(s) à medição | a rua andou '
      + desl.vivo.andou.toFixed(1) + ' px');
    ok(desl.pedidos.length === 0,
      desl.pedidos.length === 0
        ? 'com a contagem desligada não sai UM byte — nem no boot, nem ao abrir A HISTÓRIA'
        : 'a contagem está desligada e ainda saíram ' + desl.pedidos.length + ' pedido(s)');
    ok(desl.vivo.andou > 1 && desl.vivo.tela, 'e o jogo desligado continua sendo o mesmo jogo');
  }

  // ============================================================
  // 18 · O JOGO QUEBRA E ALGUÉM FICA SABENDO — sem virar tempestade
  //
  // O defeito que este bloco protege é o mais barato de introduzir e o mais caro de perceber:
  // uma exceção dentro do laço de quadro dispara SESSENTA VEZES POR SEGUNDO. Sem agrupamento e
  // sem teto, um jogo quebrado no telefone de outra pessoa vira trinta e seis mil pedidos por
  // dez minutos — pagos com a bateria dela e com a cota que o "voltou no dia 3" precisa.
  //
  // Três medidas, e nenhuma delas se conserva sozinha num refactor:
  //  (a) a exceção CHEGA, com mensagem, arquivo e linha, e NADA além disso;
  //  (b) a mesma mensagem repetida duzentas vezes vale UM evento;
  //  (c) mensagens todas diferentes param no teto que o próprio jogo declara.
  // ============================================================
  sec('18 · o jogo quebra, o aviso sai uma vez, e a tempestade não sai');
  const tempestade = await rodarMedida('mudo', {
    esperado: /encaixe-/,
    // O DEFEITO NASCE DENTRO DA PÁGINA, do mesmo lugar de onde um defeito do jogo nasceria.
    injetar: [
      // um defeito, uma vez — e depois o MESMO defeito duzentas vezes, que é o formato exato
      // de uma exceção presa no laço de quadro
      'setTimeout(function(){ throw new Error("encaixe-defeito-unico"); }, 0);',
      'for (var i = 0; i < 200; i++) setTimeout(function(){ throw new Error("encaixe-tempestade"); }, 0);',
      // e uma promessa recusada sem catch, que não passa pelo `onerror` — é outro canal, e é
      // justamente o canal do fetch do pacote de arte
      'setTimeout(function(){ Promise.reject(new Error("encaixe-promessa")); }, 0);'
    ].join('\n'),
    provocar: async (pg) => pg.evaluate(() => (typeof MEDIDA_ERRO_TETO === 'number' ? MEDIDA_ERRO_TETO : null))
  }).catch(e => ({ erro: String(e) }));
  if (tempestade.erro) { ok(false, 'o bloco 18 explodiu — ' + tempestade.erro); }
  else {
    const errs = eventos(tempestade).filter(c => c.event === 'erro');
    const msgs = errs.map(c => (c.properties || {}).msg || '');
    log('   teto declarado pelo jogo: ' + tempestade.colhido + ' | eventos "erro": ' + errs.length);
    log('   ' + msgs.map(m => '"' + m.slice(0, 46) + '"').join(' | '));
    ok(errs.length > 0, errs.length > 0
      ? 'o jogo quebrou e o aviso saiu — o defeito parou de morrer no telefone de outra pessoa'
      : 'o jogo quebrou e ninguém ficou sabendo (é o estado anterior, e é o mais caro que existe)');
    // (b) 201 exceções, duas mensagens distintas: uma vez cada
    const daTempestade = msgs.filter(m => /encaixe-tempestade/.test(m));
    ok(daTempestade.length === 1,
      daTempestade.length === 1
        ? 'duzentas exceções da MESMA mensagem valeram um evento só — o agrupamento é por mensagem'
        : 'a mesma mensagem saiu ' + daTempestade.length + ' vezes: o laço de quadro vira tempestade');
    ok(msgs.some(m => /promessa: .*encaixe-promessa/.test(m)),
      'promessa recusada sem catch também é relatada, e diz que veio do outro canal');
    // (a) o corpo: três propriedades e nada de estado de jogo
    const p = (errs[0] || {}).properties || {};
    const extras = Object.keys(p).filter(k => ['$ip', '$lib', '$process_person_profile', 'msg', 'arquivo', 'linha'].indexOf(k) < 0);
    log('   corpo do erro: ' + Object.keys(p).sort().join(', ') + ' | linha ' + p.linha + ' | arquivo "' + p.arquivo + '"');
    ok(extras.length === 0, extras.length === 0
      ? 'e o corpo leva a mensagem, o arquivo e a linha — nada do estado do jogo foi de carona'
      : 'o relatório de erro levou junto: ' + extras.join(', '));
    ok(typeof p.linha === 'number' && p.linha > 0, 'a linha veio preenchida (' + p.linha + ')');
    ok(!!p.arquivo && !/\?|#|:\/\//.test(String(p.arquivo)),
      'e o arquivo é um caminho preenchido, sem domínio, sem consulta e sem âncora ("'
        + p.arquivo + '") — URL é o outro esconderijo de dado de gente');
    ok(tempestade.vivo.andou > 1 && tempestade.vivo.tela,
      'e a partida seguiu inteira depois de 201 exceções — o relatório não derruba quem ele relata');
  }
  // (c) o TETO, medido com mensagens todas diferentes: é o caso que escapa do agrupamento
  const distintas = await rodarMedida('mudo', {
    esperado: /encaixe-/,
    injetar: 'for (var i = 0; i < 40; i++) (function(n){ setTimeout(function(){'
      + ' throw new Error("encaixe-distinta-" + n); }, 0); })(i);',
    provocar: async (pg) => pg.evaluate(() => (typeof MEDIDA_ERRO_TETO === 'number' ? MEDIDA_ERRO_TETO : null))
  }).catch(e => ({ erro: String(e) }));
  if (distintas.erro) { ok(false, 'o teto do bloco 18 explodiu — ' + distintas.erro); }
  else {
    const n = eventos(distintas).filter(c => c.event === 'erro').length;
    log('   40 mensagens DIFERENTES -> ' + n + ' evento(s), com teto ' + distintas.colhido);
    ok(n === distintas.colhido,
      n === distintas.colhido
        ? 'quarenta mensagens diferentes pararam no teto de ' + distintas.colhido + ' — o agrupamento tem fundo'
        : 'quarenta mensagens diferentes renderam ' + n + ' eventos: o teto de ' + distintas.colhido + ' não segura');
    ok(distintas.vivo.andou > 1, 'e o jogo continua andando com o teto batido');
  }

  // ============================================================
  // 19 · A PERGUNTA DE UMA LINHA — feita uma vez, sem pedágio, sem nota
  //
  // O repositório existe para responder se o laço segura alguém por três dias, e até aqui só
  // um bot respondia. A pergunta na CHEGADA é a única vez em que o jogo fala com quem o joga.
  // Três coisas a protegem, e as três somem no primeiro refactor sem asserção:
  //  (a) ela aparece UMA vez e não insiste — nem com quem respondeu, nem com quem calou;
  //  (b) ela não é pedágio: as portas continuam do outro lado dela, funcionando;
  //  (c) ela não é avaliação. Nada de estrela, nota ou "gostou" — §2.1, a CHEGADA não é troféu.
  // ============================================================
  sec('19 · a pergunta do fim: uma vez, sem pedágio, e sem virar avaliação');
  const perg = await page.evaluate(async () => {
    fecharTudo(); fecharTelas();
    R.volta = 0; R.chegou = 1;
    montarFim(); abrirTela('telaFim');
    await new Promise(r => setTimeout(r, 200));
    const cx = document.getElementById('fimPergunta');
    const txt = document.getElementById('fimPerguntaTxt');
    const bts = [...document.querySelectorAll('#fimPerguntaBotoes .perguntaBtn')]
      .map(b => b.getAttribute('aria-label') || '');
    const visivel = !cx.classList.contains('oculto');
    const marcada = R.volta | 0;                    // perguntar já marca: o silêncio é resposta
    // (b) as portas do fim continuam alcançáveis com a pergunta em pé
    const portas = ['btnFimHist', 'btnFimFontes', 'btnFimVoltar'].map(function (id) {
      const e = document.getElementById(id), r = e.getBoundingClientRect();
      return { id: id, ok: r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none' };
    });
    // e fechar a tela sem tocar em nada funciona
    document.getElementById('btnFimVoltar').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    const fechou = !document.getElementById('telaFim').classList.contains('aberta');
    // (a) reabrir: quem calou não é perguntado de novo
    montarFim(); abrirTela('telaFim');
    await new Promise(r => setTimeout(r, 150));
    const insiste = !document.getElementById('fimPergunta').classList.contains('oculto');
    fecharTelas();
    return { visivel, marcada, pergunta: txt.textContent, bts, portas, fechou, insiste,
      // (c) o vocabulário inteiro do bloco, para a mesma régua do bloco 10
      vocab: (txt.textContent + ' ' + bts.join(' ')) };
  });
  log('   "' + perg.pergunta + '" -> ' + perg.bts.join(' · '));
  ok(perg.visivel && /voltaria amanhã/i.test(perg.pergunta),
    'a CHEGADA faz a pergunta que o repositório inteiro existe para responder');
  ok(perg.bts.length === 3 && perg.bts.every(t => t.length > 0),
    'e oferece três respostas, todas com rótulo: ' + perg.bts.join(' · '));
  ok(perg.marcada > 0 && !perg.insiste,
    perg.marcada > 0 && !perg.insiste
      ? 'perguntada uma vez, ela não volta a perguntar — nem para quem não respondeu'
      : 'a pergunta reaparece: convite feito duas vezes é cobrança, e cobrança não mede intenção');
  ok(perg.portas.every(p => p.ok) && perg.fechou,
    'e ela não é pedágio: as duas portas e o VOLTAR seguem lá, e sair sem responder sai');
  ok(!/estrela|nota|avali|gost|pontos|score|impacto/i.test(perg.vocab),
    'nenhuma palavra de avaliação na pergunta nem nas respostas — a CHEGADA não é troféu (§2.1)');
  // e a resposta VAI para a medição, com a palavra escolhida e mais nada
  const resp = await rodarMedida('mudo', {
    provocar: async (pg) => pg.evaluate(async () => {
      fecharTudo(); fecharTelas();
      R.volta = 0; R.chegou = 1;
      montarFim(); abrirTela('telaFim');
      await new Promise(r => setTimeout(r, 150));
      document.getElementById('btnVolta2').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await new Promise(r => setTimeout(r, 150));
      return { volta: R.volta | 0,
        papel: (document.getElementById('fimPerguntaTxt') || {}).textContent,
        botoes: document.getElementById('fimPerguntaBotoes').classList.contains('oculto') };
    })
  }).catch(e => ({ erro: String(e) }));
  if (resp.erro) { ok(false, 'o bloco 19 explodiu — ' + resp.erro); }
  else {
    const v = eventos(resp).filter(c => c.event === 'volta');
    const pv = (v[0] || {}).properties || {};
    log('   toque em TALVEZ -> evento "volta" ' + v.length + 'x | resposta "' + pv.resposta
      + '" | R.volta ' + resp.colhido.volta + ' | o papel diz "' + resp.colhido.papel + '"');
    ok(v.length === 1 && typeof pv.resposta === 'string' && pv.resposta.length > 0,
      'responder manda UM evento, com a palavra escolhida (' + pv.resposta + ')');
    ok(resp.colhido.volta > 1, 'e o aparelho guarda que foi respondida (volta=' + resp.colhido.volta + ')');
    ok(/anotado/i.test(resp.colhido.papel || '') && resp.colhido.botoes,
      'a confirmação é o próprio papel mudando, e as tábuas somem — botão que não faz mais nada engana');
  }

  // ============================================================
  // 20 · ONDE A PESSOA PAROU — o inverso de "chegou no capítulo X"
  //
  // "Chegou no capítulo 3" e "parou no capítulo 3" são a mesma pessoa lida por lados opostos,
  // e só o segundo responde "onde as pessoas desistem". Ele sai quando a aba se esconde ou a
  // página se despede — e no celular é `pagehide` quem manda, porque o `beforeunload` não é
  // garantido no iOS. Junto vai o tempo DAQUELA sessão: parar no capítulo 3 com 40 s e parar
  // no capítulo 3 com meia hora são duas pessoas opostas com o mesmo capítulo.
  // ============================================================
  sec('20 · o "onde parou" sai no pagehide, e leva o tempo daquela sessão');
  const parou = await rodarMedida('mudo', {
    provocar: async (pg) => {
      const antes = await pg.evaluate(() => { fecharTudo(); return { cap: epocaAtual() }; });
      await pg.waitForTimeout(1200);   // deixa a sessão acumular segundos de jogo de verdade
      await pg.evaluate(() => window.dispatchEvent(new Event('pagehide')));
      await pg.evaluate(() => { medirParouArmado = true; });   // rearma como a volta à aba faria
      return antes;
    }
  }).catch(e => ({ erro: String(e) }));
  if (parou.erro) { ok(false, 'o bloco 20 explodiu — ' + parou.erro); }
  else {
    const ps = eventos(parou).filter(c => c.event === 'parou');
    const pp = (ps[0] || {}).properties || {};
    log('   pagehide -> ' + ps.length + ' evento(s) "parou" | capítulo ' + pp.capitulo
      + ' "' + pp.nome + '" | sessão ' + pp.sessao + 's | vida ' + pp.minutos + 'min');
    ok(ps.length === 1, ps.length === 1
      ? 'esconder a página manda o "onde parou" — e uma vez só'
      : '"parou" saiu ' + ps.length + ' vezes: os três ganchos viraram três eventos');
    ok(typeof pp.capitulo === 'number' && typeof pp.nome === 'string' && pp.nome.length > 0,
      'e ele diz em que capítulo ela estava quando foi embora (' + pp.capitulo + ' · ' + pp.nome + ')');
    ok(typeof pp.sessao === 'number' && pp.sessao >= 1,
      typeof pp.sessao === 'number' && pp.sessao >= 1
        ? 'com o tempo DAQUELA sessão junto, em segundos (' + pp.sessao + ')'
        : 'o "onde parou" foi sem o tempo da sessão (' + pp.sessao + ') — o capítulo sozinho não diz se ela desistiu');
    ok(pp.sessao <= 60, 'e a sessão é a desta carga de página, não a vida inteira do save (' + pp.sessao + 's)');
  }

  // ============================================================
  // 21 · O TELEFONE DEITADO — e o defeito mais caro que este repositório já teve em silêncio
  //
  // Ninguém nunca decidiu o que acontece quando a pessoa vira o aparelho. Medido em 844×390
  // antes desta passada: o poste do menu saía 270 px abaixo da borda, o JOGAR era cortado
  // 52 px (zero pixel tocável) e as outras três tábuas NASCIAM fora — topos em 454, 518 e 582
  // numa tela de 390. Deitado, o jogo não podia nem ser começado.
  //
  // E ele passava verde em tudo: o smoke roda numa medida só (390×844) e o `medir-telas.js`,
  // que já rodava `deitado 844×390`, só olhava para os LADOS — nunca para baixo. Deitado o
  // lado curto é a ALTURA, então o único eixo que quebra era o único que ninguém media.
  //
  // Este bloco é a trava. Ele não mede beleza: mede que TODA tábua do menu está inteira
  // dentro da tela e recebe o dedo, nas duas medidas que o `LANCAMENTO.md` chama de deitado.
  // ============================================================
  sec('21 · deitado, o menu inteiro cabe na tela e o JOGAR recebe o dedo');
  for (const vp of [{ w: 844, h: 390, nome: 'telefone deitado 844×390' },
                    { w: 1024, h: 768, nome: 'tablet deitado 1024×768' }]) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.evaluate(() => { fecharTelas(); abrirTela('telaMenu'); });
    await page.waitForTimeout(600);
    const menu = await page.evaluate(() => {
      const H = document.documentElement.clientHeight, W = document.documentElement.clientWidth;
      const r = [];
      document.querySelectorAll('#poste .telaBtn').forEach(function (b) {
        if (getComputedStyle(b).display === 'none') return;
        const c = b.getBoundingClientRect();
        // "no dedo" é mais que "na tela": o ponto que o toque vai acertar é o CENTRO, e
        // `elementFromPoint` é quem sabe se alguma coisa está por cima dele.
        const alvo = document.elementFromPoint((c.left + c.right) / 2, (c.top + c.bottom) / 2);
        r.push({
          nome: b.id, topo: Math.round(c.top), pe: Math.round(c.bottom),
          alt: Math.round(c.height),
          dentro: c.top >= -1 && c.bottom <= H + 1 && c.left >= -1 && c.right <= W + 1,
          recebe: !!(alvo && (alvo === b || b.contains(alvo))),
        });
      });
      return r;
    });
    log('   ' + vp.nome + ': ' + menu.map(m => m.nome + ' ' + m.topo + '..' + m.pe).join(' | '));
    ok(menu.length >= 4, vp.nome + ': o menu tem as tábuas todas (' + menu.length + ')');
    const fora = menu.filter(m => !m.dentro);
    ok(!fora.length, vp.nome + ': toda tábua do menu está inteira dentro da tela' +
      (fora.length ? ' — FORA: ' + fora.map(m => m.nome + ' pé em ' + m.pe + ' numa tela de ' + vp.h).join(', ') : ''));
    const surda = menu.filter(m => !m.recebe);
    ok(!surda.length, vp.nome + ': e o centro de cada uma recebe o toque' +
      (surda.length ? ' — SURDAS: ' + surda.map(m => m.nome).join(', ') : ''));
    const baixa = menu.filter(m => m.alt < 44);
    ok(!baixa.length, vp.nome + ': nenhuma tábua abaixo dos 44 px de dedo' +
      (baixa.length ? ' — ' + baixa.map(m => m.nome + ' ' + m.alt).join(', ') : ''));

    // ---- e o rodapé, que é onde o polegar muda de lugar quando o aparelho vira ----
    await page.evaluate(() => { fecharTelas(); });
    await page.waitForTimeout(400);
    const rod = await page.evaluate(() => {
      const H = document.documentElement.clientHeight, W = document.documentElement.clientWidth;
      const c = document.getElementById('controls').getBoundingClientRect();
      const a = document.getElementById('btnClique').getBoundingClientRect();
      const cartoes = [];
      document.querySelectorAll('#controls .cartao, #btnClique').forEach(function (b) {
        const r = b.getBoundingClientRect();
        cartoes.push({ nome: b.id || b.className, alt: Math.round(r.height) });
      });
      return {
        pctAltura: +((c.height / H) * 100).toFixed(1),
        acaoPctX: +((((a.left + a.right) / 2) / W) * 100).toFixed(1),
        // A metade que PULA é a esquerda, e o polegar esquerdo pousa exatamente em cima do
        // gesto dele. O canto onde ele descansa é o que precisa ficar livre — não a metade
        // inteira: o alcance de um polegar a partir do canto de baixo de uma tela deitada é
        // de uns 60 a 75 mm, que num aparelho de 844 px (~146 mm) dá perto de 30% da largura.
        // É esse pedaço que não pode ter botão, e é ele que este número cobra.
        comecaEmPct: +((c.left / W) * 100).toFixed(1),
        baixos: cartoes.filter(x => x.alt < 44),
      };
    });
    log('   ' + vp.nome + ': rodapé ' + rod.pctAltura + '% da altura | ação a ' + rod.acaoPctX
      + '% da largura | começa a ' + rod.comecaEmPct + '%');
    ok(rod.pctAltura <= 14, vp.nome + ': o rodapé não come mais de 14% da altura (' + rod.pctAltura + '%)');
    ok(rod.acaoPctX >= 67, vp.nome + ': deitado, a ação principal fica na ponta, não no meio da borda (' + rod.acaoPctX + '%)');
    ok(rod.comecaEmPct >= 30, vp.nome + ': o canto onde o polegar que PULA descansa fica sem botão (o rodapé começa a ' + rod.comecaEmPct + '%)');
    ok(!rod.baixos.length, vp.nome + ': nenhum alvo do rodapé abaixo de 44 px' +
      (rod.baixos.length ? ' — ' + rod.baixos.map(x => x.nome + ' ' + x.alt).join(', ') : ''));

    // ---- e A HISTÓRIA, que é a tela em que o jogo ENSINA ----
    // `.qQuadro` é `overflow: hidden`: conteúdo mais alto que o quadro não transborda, não
    // rola e não avisa — é recortado. Medido antes desta passada, em 844×390: DOZE das 26
    // páginas cortavam texto, a pior com 365 px de papel num espaço de 306. Um verbete com
    // fonte perdendo a linha da fonte é o §2 sendo apagado por CSS.
    await page.evaluate(() => { fecharTelas(); montarCompletude(); abrirTela('telaCompletude'); });
    await page.waitForTimeout(900);
    const comic = await page.evaluate(() => {
      const apertadas = [];
      const paginas = document.querySelectorAll('.qQuadro');
      paginas.forEach(function (q, i) {
        let alt = 0;
        q.querySelectorAll(':scope > .ltMomento, :scope > .ltMarco, :scope > .qCentro, :scope > .qFala')
          .forEach(function (f) { alt += f.getBoundingClientRect().height; });
        const esp = q.getBoundingClientRect().height - parseFloat(getComputedStyle(q).paddingBottom);
        if (alt > esp + 1) apertadas.push(i + ' (' + Math.round(alt) + '>' + Math.round(esp) + ')');
      });
      return { n: paginas.length, apertadas };
    });
    log('   ' + vp.nome + ': quadrinho com ' + comic.n + ' páginas, ' + comic.apertadas.length + ' apertada(s)');
    ok(comic.n > 20, vp.nome + ': o quadrinho montou as páginas (' + comic.n + ')');
    ok(!comic.apertadas.length, vp.nome + ': nenhuma página do quadrinho corta o próprio texto' +
      (comic.apertadas.length ? ' — ' + comic.apertadas.slice(0, 6).join(', ') : ''));

    // ---- A CHEGADA e os AJUSTES: as duas pilhas verticais longas do jogo ----
    // A CHEGADA rola por dentro, e é justamente por isso que ela precisa desta asserção: a
    // checagem genérica de "fora da tela" pula tudo o que mora num rolo, e o CSS desta casa
    // já registrou por que rolar não basta — "um botão que só existe depois de um gesto que
    // ninguém pediu é um botão que metade das pessoas não acha". Medido antes: a última
    // tábua terminava 86 px abaixo da dobra a 844×390 e 116 px a 640×360.
    // AJUSTES é pior e mais simples: ela NÃO rola, e o título dela ficava 116 px ACIMA da
    // borda de cima — para cima não existe rolagem, então ele simplesmente não existia.
    for (const t of [{ id: 'telaFim', mostra: 'montarFim(); montarPergunta();', ult: 'btnFimVoltar', nome: 'CHEGADA' },
                     { id: 'telaConfig', mostra: 'montarConfig();', ult: 'btnVoltarCfg', nome: 'AJUSTES' }]) {
      await page.evaluate(function (t) {
        fecharTelas(); eval(t.mostra); abrirTela(t.id);
      }, t);
      await page.waitForTimeout(500);
      const r = await page.evaluate(function (t) {
        const H = document.documentElement.clientHeight, W = document.documentElement.clientWidth;
        const tela = document.getElementById(t.id);
        const fora = [], baixos = [];
        tela.querySelectorAll('.telaBtn, .telaTit, .telaTxt, #fimPlacar, #cfgInfo').forEach(function (e) {
          const s = getComputedStyle(e);
          if (s.display === 'none' || s.visibility === 'hidden') return;
          const b = e.getBoundingClientRect();
          if (b.width <= 0 || b.height <= 0) return;
          const id = e.id || e.className.split(' ')[0];
          if (b.top < -1 || b.bottom > H + 1 || b.left < -1 || b.right > W + 1) {
            fora.push(id + ' ' + Math.round(b.top) + '..' + Math.round(b.bottom) +
                      ' x ' + Math.round(b.left) + '..' + Math.round(b.right));
          }
          if (e.classList.contains('telaBtn') && !e.classList.contains('perguntaBtn') && b.height < 44) {
            baixos.push(id + ' ' + Math.round(b.height));
          }
        });
        return { fora, baixos, rola: tela.scrollHeight - tela.clientHeight };
      }, t);
      ok(!r.fora.length, vp.nome + ' · ' + t.nome + ': tudo dentro da tela, sem precisar rolar' +
        (r.fora.length ? ' — FORA: ' + r.fora.slice(0, 4).join(' | ') : ''));
      ok(!r.baixos.length, vp.nome + ' · ' + t.nome + ': toda tábua com 44 px de dedo' +
        (r.baixos.length ? ' — ' + r.baixos.join(', ') : ''));
    }
  }
  // devolve a medida da casa: o que vier depois continua medindo o que sempre mediu
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { fecharTelas(); });
  await page.waitForTimeout(400);

  sec('ERROS DE CONSOLE');
  log(erros.length ? erros.join('\n') : '(nenhum)');
  if (erros.length) falhas++;

  await browser.close();
  console.log('\n' + (falhas ? 'FALHOU em ' + falhas + ' asserção(ões)' : 'PASSOU'));
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error('EXPLODIU:', e); process.exit(1); });
