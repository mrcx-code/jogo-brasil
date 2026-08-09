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

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}
function alvo() {
  const p = process.env.JOGO_HTML;
  if (p && /^https?:\/\//i.test(p)) return p;
  return 'file://' + path.resolve(__dirname, '..', p || 'index.html');
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
  // A tela de AJUSTES diz ao jogador "NADA SAI DESTE APARELHO · O JOGO NÃO TEM REDE". Hoje é
  // verdade e quem a cobra é a CSP do <head>. O CLAUDE.md §3 avisa que a fase do Supabase abre
  // a rede e manda reescrever a tela NA MESMA FASE — "afirmação de privacidade que virou falsa
  // é pior que nenhuma". Ninguém vigiava as duas juntas: abrir a CSP é uma linha, e a frase
  // continuaria na tela dizendo o contrário. Este bloco amarra uma à outra.
  // ============================================================
  sec('8 · a promessa de privacidade e a CSP contam a mesma história');
  const priv = await page.evaluate(() => {
    fecharTudo(); abrirTela('telaConfig');
    if (typeof montarConfig === 'function') montarConfig();
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const csp = meta ? meta.getAttribute('content') : '';
    const txt = [...document.querySelectorAll('#cfgInfo div')].map(d => d.getAttribute('aria-label') || '').join(' ');
    return { csp: csp, txt: txt,
      fechada: /connect-src\s+'none'/.test(csp) && /default-src\s+'none'/.test(csp),
      promete: /NADA SAI DESTE APARELHO/.test(txt) && /NÃO TEM REDE/.test(txt) };
  });
  log('   AJUSTES diz: "' + priv.txt.slice(-60) + '"');
  log('   CSP: ' + priv.csp);
  ok(priv.promete === priv.fechada,
    priv.promete
      ? (priv.fechada ? 'a tela promete "sem rede" e a CSP fecha a rede'
                      : 'a tela AINDA promete "sem rede" e a CSP JÁ ABRIU — reescreva a tela na mesma fase')
      : 'a tela não promete mais "sem rede" (e a CSP ' + (priv.fechada ? 'continua fechada' : 'abriu') + ')');

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
  const arte = await page.evaluate(() => {
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

  sec('ERROS DE CONSOLE');
  log(erros.length ? erros.join('\n') : '(nenhum)');
  if (erros.length) falhas++;

  await browser.close();
  console.log('\n' + (falhas ? 'FALHOU em ' + falhas + ' asserção(ões)' : 'PASSOU'));
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error('EXPLODIU:', e); process.exit(1); });
