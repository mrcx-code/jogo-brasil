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
// O host da medição sai da constante ÚNICA que alimenta a CSP e o build (CLAUDE.md §3.2) —
// nunca escrito à mão aqui. Quem o lê é o coletor de erros de console, lá embaixo.
const { MEDIDA_HOST } = require('../ferramentas/medir-secao.js');

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

// ABRIR O MENU E ESPERAR ELE PARAR DE ANDAR — e isto não é zelo, é o conserto de um portão que
// era cara ou coroa (21/08).
//
// O sintoma: os blocos 21 e 30 mediam o poste com `waitForTimeout` e devolviam números
// DIFERENTES no MESMO build, em cargas seguidas — 390×568 deu rolagem 6 numa execução e 1 na
// seguinte (e reprovou por exit code numa delas); 1024×768 deu o pé do CONFIGURAÇÕES em 766,
// 770 e 773 em três execuções. Sete pixels de espalhamento numa régua cuja folga é de 4 é a
// mesma lição do FPS de 20/08: se o espalhamento do instrumento é da ordem do que se mede, não
// há o que ler.
//
// A causa é a mobília BROTANDO. `#telaMenu.aberta > *` roda `brota .42s` com `animation-delay`
// de .12s no terceiro filho — o próprio poste —, então a tela só para de andar em 540 ms, e o
// que a animação faz é `translateY(18px)`. Um `waitForTimeout(420)` (bloco 30) ou de 600 ms
// (bloco 21) cai DENTRO ou logo na borda dessa janela conforme a máquina esteja mais ou menos
// carregada, e o que sobra de deslocamento entra direto na medida.
//
// O conserto não é esperar mais — é esperar A COISA CERTA: `getAnimations({subtree:true})` e
// as promessas `finished` de cada uma. A `respira` do logo é INFINITA e nunca resolve, então
// ela sai da lista pelo nome; a corrida com um teto de 3 s existe para um motor que um dia não
// implemente `finished` não pendurar o teste inteiro.
async function abrirMenuParado(page) {
  await page.evaluate(() => { fecharTelas(); abrirTela('telaMenu'); });
  return await telaParada(page, 'telaMenu');
}

// A ESPERA DE `abrirMenuParado`, GENERALIZADA (23/08) — porque a doença não era do menu.
//
// O bloco 3 media o nicho 400 ms depois de `fecharTelas()`, e os blocos 21/24/30 mediam a
// geometria de uma tela 500–900 ms depois de abri-la. É o mesmo erro em oito lugares: dormir
// um número e supor que a animação acabou. Esta função espera as promessas `finished` da tela
// inteira (subárvore) e devolve QUANTO esperou, para o log dizer se a máquina está lenta em
// vez de o portão virar cara ou coroa.
//
// Duas exclusões, as duas necessárias: `respira` (o logo) é infinita e nunca resolve, e
// qualquer outra animação de iterações infinitas cairia na mesma armadilha. O teto de 20 s é
// DETECTOR DE TRAVAMENTO — nunca régua de ritmo.
async function telaParada(pg, id) {
  return await pg.evaluate(async (id) => {
    const t0 = performance.now();
    const tela = document.getElementById(id);
    if (!tela) return { ms: 0, quantas: 0, achou: false };
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const vivas = (tela.getAnimations ? tela.getAnimations({ subtree: true }) : [])
      .filter(a => a.animationName !== 'respira' && a.playState !== 'idle')
      .filter(a => !(a.effect && a.effect.getTiming && a.effect.getTiming().iterations === Infinity))
      .map(a => a.finished.catch(() => {}));
    await Promise.race([Promise.all(vivas), new Promise(r => setTimeout(r, 20000))]);
    await new Promise(r => requestAnimationFrame(r));
    return { ms: Math.round(performance.now() - t0), quantas: vivas.length, achou: true };
  }, id);
}

// ESPERAR UMA CONDIÇÃO DA PÁGINA SEM EXPLODIR — devolve `false` no estouro em vez de derrubar
// o instrumento inteiro. É o que permite trocar `waitForTimeout` por espera de estado sem
// perder a asserção: quem chama continua dizendo `ok(...)` com a mensagem que já dizia, e o
// portão continua MORDENDO (a lição 2.8) — só deixa de morder o relógio.
async function esperarNaPagina(pg, fn, ms, arg) {
  try { await pg.waitForFunction(fn, arg, { timeout: ms || 20000 }); return true; }
  catch (e) { return false; }
}

// ESPERAR O JOGO TERMINAR DE NASCER — condição, não relógio (23/08).
//
// Depois de um `reload()` o instrumento precisa saber que o boot acabou. Dormir 700 ms é uma
// aposta: sob carga o Chromium chega atrasado, o relógio não, e o que vem depois mede uma
// página pela metade.
//
// A CONDIÇÃO CERTA NÃO É "os símbolos existem", E ISTO QUASE ME ESCAPOU. `S` e `fecharTelas`
// nascem no topo do módulo, muito antes do fim do boot — esperar por eles resolveria cedo
// demais, o `fecharTelas()` seguinte fecharia um menu que ainda não abriu, e o
// `abrirTela("telaMenu")` da ÚLTIMA linha do `DOMContentLoaded` (src/jogo.ts) reabriria a tela
// por baixo do teste. Seria trocar um flake por outro, mais silencioso.
//
// O fim do boot é observável: `abrirTela("telaMenu")` é a última coisa que ele faz. Então a
// condição é o menu ABERTO. Teto de 30 s como DETECTOR DE TRAVAMENTO; devolve `false` no
// estouro em vez de derrubar o instrumento, para quem chamou decidir.
async function jogoPronto(pg) {
  // A GUARDA DE `null` NAO E ZELO — sem ela isto vira NO-OP EM SILENCIO (achado do QA, 23/08).
  // `waitForFunction` REJEITA quando o predicado lanca, e `esperarNaPagina` engole a rejeicao:
  // numa pagina sem `#telaMenu`, `.classList` de `null` estoura, a promessa cai no catch e a
  // espera devolve `false` em ~64 ms sem ter esperado coisa nenhuma. O `bootPronto` do smoke ja
  // guardava; este nao guardava, e a diferenca era invisivel porque aqui a pagina e sempre o jogo.
  return await esperarNaPagina(pg, () => {
    const m = document.getElementById('telaMenu');
    return typeof S !== 'undefined' && typeof fecharTelas === 'function' &&
      !!document.getElementById('hudTop') && !!document.getElementById('pdFlor') &&
      !!m && m.classList.contains('aberta');
  }, 30000);
}

// ESPERAR A BARRA DE CIMA VOLTAR PARA A TELA — o conserto do bloco 3 (23/08).
//
// O bloco 3 chamava `fecharTelas()` e dormia 400 ms. `#hudTop, #controls { transition:
// transform .34s }` (estilo.css 582) e `body.emTela` os estaciona fora da tela — então eram
// 60 ms de folga sobre 340 ms de transição. Sob carga a transição nem começava, e o bloco lia
// o nicho com a barra inteira em `translateY(-115%)`, `opacity 0`: nicho em y = -79, seta fora
// da tela, seis asserções vermelhas por causa do relógio.
//
// MEDIDO, as duas esperas na mesma execução (`test/nicho-antes-depois.js`, 128 amostras com
// 5 a 10 processos em paralelo mais `test/carga.js`): 400 ms de relógio -> 6 falhas (4,7%);
// esperando o estado -> 0 falhas (0%). E é MAIS RÁPIDO, não mais lento: a espera real ficou
// entre 190 e 260 ms na máquina calma. Alargar o 400 para 2 s teria comprado o verde de hoje
// e devolvido o vermelho na próxima máquina cheia.
//
// O teto de 20 s existe para uma transição que NUNCA termine não pendurar o portão — é
// detector de travamento, nunca régua de ritmo.
async function hudNoLugar(pg) {
  return await pg.evaluate(async () => {
    const t0 = performance.now();
    // dois quadros para o navegador recalcular o estilo e CRIAR a transição; sem isto
    // `getAnimations()` pode devolver lista vazia porque ela ainda nem nasceu.
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const vivas = [];
    for (const id of ['hudTop', 'controls']) {
      const el = document.getElementById(id);
      if (!el || !el.getAnimations) continue;
      for (const a of el.getAnimations()) {
        if (a.playState === 'idle') continue;
        // animação infinita (a `respira` e parentes) nunca resolve `finished`
        if (a.effect && a.effect.getTiming && a.effect.getTiming().iterations === Infinity) continue;
        vivas.push(a.finished.catch(() => {}));
      }
    }
    await Promise.race([Promise.all(vivas), new Promise(r => setTimeout(r, 20000))]);
    await new Promise(r => requestAnimationFrame(r));
    const cs = getComputedStyle(document.getElementById('hudTop'));
    const cc = document.getElementById('controls');
    return { ms: Math.round(performance.now() - t0), quantas: vivas.length,
             emTela: document.body.classList.contains('emTela'),
             transform: cs.transform, opacity: cs.opacity,
             opControles: cc ? getComputedStyle(cc).opacity : null };
  });
}

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2
  });
  const erros = [];
  page.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
  // O COLETOR GLOBAL APLICA A MESMA REGRA QUE O BLOCO DA MEDIÇÃO JÁ APLICAVA, e não uma nova
  // (31/08). O bloco de baixo (procure `posthog|Failed to load resource` neste arquivo) já
  // decidiu por escrito, faz semanas: *"pedido de rede que o NAVEGADOR recusou não é defeito do
  // jogo — um adblock de verdade escreve a mesma linha"*. Este coletor, que é o que alimenta a
  // asserção final ERROS DE CONSOLE, nunca recebeu a regra. Dois coletores da mesma coisa, um
  // com o critério e outro sem: é o buraco que o PENDENTES 68 nomeia, do lado de cá.
  //
  // O QUE FEZ APARECER: numa máquina cujo proxy recusa o host da medição, o jogo roda inteiro
  // e o `encaixe.js` sai **1** — medido em 31/08 na `main` LIMPA, sem uma linha de mudança:
  // uma asserção, oito linhas de `Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED`.
  // O portão reprovava um jogo perfeito por causa da rede de quem o roda.
  //
  // E O FILTRO É ESTREITO DE PROPÓSITO — mais estreito que o do bloco de baixo. Ele NÃO cala
  // "Failed to load resource" em geral: isso engoliria um `pack-*.json` que some, que é defeito
  // de verdade e dos caros (o capítulo roda com a arte errada, sem erro nenhum). Ele cala UM
  // host: o da medição, e só quando o próprio Chromium diz que não conseguiu buscá-lo.
  //   · o host sai da constante ÚNICA (`MEDIDA_HOST`), a mesma que alimenta a CSP e o build —
  //     escrever 'posthog' aqui à mão criaria a segunda cópia que o §3.2 existe para não ter;
  //   · a URL vem de `m.location().url`, e que ela chega foi MEDIDO, não suposto:
  //     `https://us.i.posthog.com/i/v0/e/` com `net::ERR_TUNNEL_CONNECTION_FAILED`.
  // Erro de console SEM url, ou com url de qualquer outro lugar, continua reprovando.
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const url = (m.location() && m.location().url) || '';
    if (url.indexOf(MEDIDA_HOST) === 0 && /Failed to load resource/i.test(m.text())) return;
    erros.push('CONSOLE: ' + m.text());
  });
  // O FLAKE DE DUAS NOITES, nomeado em 22/08 pelo log inteiro do portão (PENDENTES 52):
  // não era asserção nenhuma — era page.reload() levando net::ERR_CONNECTION_REFUSED do
  // servidor efêmero, SÓ sob a carga do funil (npm test termina segundos antes); em série
  // calma, 8/8 verdes. Três tentativas com respiro curam a recusa transitória sem esconder
  // defeito real: servidor MORTO recusa as três e continua reprovando.
  async function recarregar(pg) {
    for (let t = 1; ; t++) {
      try { await pg.reload(); return; }
      catch (e) {
        if (t >= 6 || String(e).indexOf('ERR_CONNECTION_REFUSED') < 0) throw e;
        await new Promise(r => setTimeout(r, 500 * t));   // 0,5+1+1,5+2+2,5 = 7,5 s de paciencia
      }
    }
  }
  await page.goto(alvo());
  await page.evaluate(() => { localStorage.clear(); });
  await recarregar(page);
  await jogoPronto(page);                                    // era waitForTimeout(900)

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
  await recarregar(page);
  await jogoPronto(page);                                    // era waitForTimeout(700)
  await page.evaluate(() => { fecharTelas(); S.aberturas = MASCARA_EPOCAS; salvar(); });
  const volta = await hudNoLugar(page);                      // era waitForTimeout(400)
  log('   a barra de cima voltou em ' + volta.ms + ' ms (' + volta.quantas + ' animações esperadas) — '
    + volta.transform + ', opacity ' + volta.opacity);
  ok(!volta.emTela && volta.opacity === '1',
    !volta.emTela && volta.opacity === '1'
      ? 'a leitura acontece com a barra de cima JÁ na tela, não 400 ms depois de torcer'
      : 'a barra de cima ainda está fora da tela na hora de ler o nicho (' + volta.transform
        + ', opacity ' + volta.opacity + ') — a espera de estado não segurou');
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
  await recarregar(page);
  await jogoPronto(page);                                    // era waitForTimeout(800)
  await page.evaluate(() => { fecharTelas(); S.aberturas = MASCARA_EPOCAS; salvar(); });
  // ERA waitForTimeout(500), e o comentário de então já dizia o defeito sem saber: "#controls
  // volta com transição; medir antes disso mede o vazio". Medir o vazio é o caso BOM — o caso
  // ruim é TOCAR o vazio: as 60 batidas abaixo miram a caixa de `#btnClique`, e com o bloco
  // ainda em `translateY(150%)` o dedo cai fora do botão e o impacto não sobe. Mesma cura do
  // bloco 3: esperar o estado.
  const voltou = await hudNoLugar(page);
  ok(!voltou.emTela && voltou.opControles === '1',
    'os controles voltaram para a tela ANTES das 60 batidas (' + voltou.ms + ' ms, '
      + voltou.quantas + ' animações, opacity ' + voltou.opControles
      + ') — o dedo mira um botão que está lá');
  const bot = await page.locator('#btnClique').boundingBox();
  const cena = await page.locator('#scene').boundingBox();
  for (let i = 0; i < 60; i++) {
    await page.touchscreen.tap(bot.x + bot.width / 2, bot.y + bot.height / 2);
    if (i % 9 === 8) await page.touchscreen.tap(cena.x + cena.width * 0.25, cena.y + cena.height * 0.5);
    // 45 ms FICA DE PROPÓSITO: não é espera de animação, é a CADÊNCIA do dedo — sessenta
    // batidas em ~2,7 s, que é como uma pessoa bate. Não há estado a esperar entre uma batida
    // e a próxima; o que se mede depois é o total acumulado, não o instante de nenhuma delas.
    await page.waitForTimeout(45);
  }
  const antes = await page.evaluate(() => {
    salvar();
    // E O SAVE FICA CONGELADO AQUI (15/08): o `reload` logo abaixo dispara `beforeunload`, que
    // grava DE NOVO — com o estado de ~100 ms depois deste snapshot. Nesse vão o mundo anda e a
    // personagem recolhe um drop, e o teste comparava o snapshot com um save mais novo que ele:
    // "o impacto voltou inteiro (79 -> 82)", falhando só quando havia drop no caminho — 1 em 4.
    // Neutralizar `salvar` depois do snapshot faz a asserção medir exatamente o que promete:
    // o que foi salvo é o que volta.
    window.salvar = function () {};
    return { total: Math.round(S.energiaTotal), energia: Math.round(S.energia), cena: S.cenario,
      fronteira: S.fronteira, rec: JSON.stringify(S.recursos), aber: S.aberturas };
  });
  log('   jogado por toque: impacto ' + antes.total + ' | recursos ' + antes.rec);
  ok(antes.total > 0, 'o toque pagou alguma coisa antes de fechar (' + antes.total + ')');
  await recarregar(page);
  await jogoPronto(page);                                    // era waitForTimeout(1000)
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
  // `fecharTudo` e nao `fecharTelas` de proposito (a 2.9): este bloco tem de rodar no estado
  // que a secao 6 deixou. So a ESPERA muda — era waitForTimeout(600), agora e o estado.
  await page.evaluate(() => { fecharTudo(); abrirTela('telaMenu'); });
  const menuPronto = await telaParada(page, 'telaMenu');
  const vis = await page.evaluate(() => {
    const b = document.getElementById('btnCompletude');
    const r = b.getBoundingClientRect();
    return { menu: document.getElementById('telaMenu').className, box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      op: getComputedStyle(document.getElementById('telaMenu')).opacity };
  });
  log('   menu parou de andar em ' + menuPronto.ms + ' ms (' + menuPronto.quantas + ' animações)'
    + ' | menu: ' + vis.menu + ' opacidade ' + vis.op + ' | caixa do A HISTÓRIA ' + JSON.stringify(vis.box));
  await page.touchscreen.tap(vis.box[0] + vis.box[2] / 2, vis.box[1] + vis.box[3] / 2);
  // ERA waitForTimeout(1000). O que se quer saber é se o toque MONTOU o quadrinho — e isso é
  // observável: a lista tem filhos ou não tem. Espera-se a lista, com teto de 20 s; se ela não
  // vier, `esperarNaPagina` devolve `false` e a asserção abaixo reprova com a mesma frase de
  // sempre. O portão continua mordendo (2.8) — deixou de morder o relógio da máquina.
  await esperarNaPagina(page, () => {
    const l = document.getElementById('listaCenas');
    return !!l && l.children.length > 0;
  }, 20000);
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
      // quem DEVE parar, lido dos dados e não contado à mão: uma placa por capítulo escrito
      // (`qMarco`) mais as páginas que o conteúdo trata como duras (`qDura`).
      devem: paradas.filter(p => /\bqMarco\b|\bqDura\b/.test(p.cls)).map(p => p.i),
      align: [...new Set(paradas.map(p => p.align))],
      veu: (function () {
        // o ::after de cada quadro é o véu; sem ele a página que sai não apaga
        const s = getComputedStyle(pgs[1], '::after');
        return { conteudo: s.content, cor: s.backgroundColor, z: s.zIndex };
      })()
    };
  }) : { n: 0, snap: '?', sempre: [], devem: [], align: [], veu: { conteudo: 'none', cor: '?', z: '?' } };
  log('   snap do rolo: "' + rolo.snap + '" | alinhamento das páginas: ' + rolo.align.join(','));
  log('   páginas com ponto final: ' + rolo.sempre.join(',') + ' (' + rolo.sempre.length + ' de ' + rolo.n + ')');
  log('   deviam ter (placa de capítulo + página dura): ' + rolo.devem.join(','));
  log('   véu da saída: content ' + rolo.veu.conteudo + ' | cor ' + rolo.veu.cor + ' | z ' + rolo.veu.z);
  // ERA `=== 7`, E O 7 ERA A CONTA DE UM DIA — quatro placas de capítulo mais três páginas
  // duras, o quadrinho de 09/08. Escrever um capítulo acrescenta uma placa, e a asserção
  // reprovava por isso: dizia "o ritmo do rolo quebrou" quando o que houve foi o arco crescer.
  // A regra de verdade é a que o comentário de `montarCompletude` já escreve — a amarra é pelo
  // NÓ, nunca pela posição nem pela contagem: **para quem tem `qMarco` ou `qDura`, e só.**
  ok(rolo.sempre.length && JSON.stringify(rolo.sempre) === JSON.stringify(rolo.devem),
    'param exatamente as placas de capítulo e as páginas duras (' + rolo.sempre.length +
    ' de ' + rolo.n + ')');
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
  // O INSTRUMENTO MUDOU EM 23/08, e a razão é o que ele estava medindo de verdade.
  //
  // Antes: dorme 15 s e olha uma vez. O número era aritmética honesta — 3,4 s de cerimônia do
  // nome + (0,74 de digitação + 2,33 de pausa) da linha 0 + (1,06 + 2,87) da linha 1 = 10,4 s,
  // com 4,6 s de margem. Mesmo assim caiu no funil com DOIS agentes rodando Chromium pesado em
  // paralelo, e a entrega em julgamento era um texto de divulgação que não toca o jogo.
  //
  // O diagnóstico: uma janela de parede fixa contra uma cena que o navegador anima com timer.
  // Sob carga, o jogo dilata junto — então a asserção deixava de medir "a travessia tem duração
  // própria" e passava a medir "esta máquina está livre agora". Alargar o 15 para 25 seria
  // afrouxar a régua até passar, que é a saída proibida.
  //
  // Agora: ESPERA O EVENTO em vez de amostrar o relógio. Pergunta a cada 200 ms e resolve no
  // instante em que a fala anda sozinha; o teto de 40 s é detector de travamento, não régua de
  // ritmo. A afirmação verificada continua sendo a mesma — ela anda SEM a mão —, e o tempo que
  // levou vai para o log, que é onde uma lentidão real fica visível sem virar intermitência.
  const anda = await page.evaluate(() => new Promise(res => {
    fecharTudo();
    correrTravessia("pindorama", "palmares", function () { });
    const t0 = Date.now();
    let rotulo = null;
    const h = setInterval(() => {
      // o rótulo do botão dourado, que continuava prometendo "+1,0" num trecho em que
      // `clicar()` sai na primeira linha: a interface anunciando o que o jogo recusa.
      // Lido a cada volta e guardado o último, para ser sempre um rótulo DE DENTRO da travessia.
      const el = document.querySelector('#cliqueRotulo');
      if (el && el.getAttribute) rotulo = el.getAttribute('aria-label');
      const estourou = Date.now() - t0 > 40000;
      if (falaI >= 2 || estourou) {
        clearInterval(h);
        res({ i: falaI, viva: !!falaViva, n: falaLinhas.length, rotulo: rotulo,
              ms: Date.now() - t0, estourou: estourou });
      }
    }, 200);
  }));
  log('   o botão dourado, durante a travessia, diz: "' + anda.rotulo + '"');
  ok(!/\+/.test(anda.rotulo || ''), /\+/.test(anda.rotulo || '')
    ? 'o botão promete "' + anda.rotulo + '" num trecho em que ele não rende nada'
    : 'e o botão aceso não promete ganho nenhum (QA relatório 3)');
  log('   sem encostar na tela: linha ' + anda.i + ' de ' + anda.n + ' em ' +
      (anda.ms / 1000).toFixed(1) + ' s' + (anda.estourou ? ' (TETO DE 40 s ESTOURADO)' : '') +
      '   [a conta sem carga dá 10,4 s até a linha 2]');
  ok(anda.i >= 2, anda.i >= 2
    ? 'o trecho se conta sozinho (' + anda.i + ' linhas, sem a mão)'
    : 'a travessia PAROU na linha ' + anda.i + ' — ela não tem duração própria');

  // ESTA METADE MEDIA COM A TRAVESSIA AINDA VIVA POR BAIXO, e passava por 1 s de sorte (20/08).
  // A metade de cima deixa a travessia CORRENDO — ela dura ~90 s e o teste espera 15. `fecharTudo()`
  // fecha as BANDEJAS; quem chama `fimTravessia()` é `fecharTelas()` (EQUIPE.md 2.9, a mesma
  // confusão de nomes pela segunda vez). Medido nas quatro células de `test/tmp-hist-portao9.js`:
  // `travessiaAtiva()` continuava `true` ao abrir a abertura, e o que segurava a asserção era o
  // COMPRIMENTO da primeira fala — 3,4 s de cerimônia + 2,07 s de digitação + 4,55 s de pausa =
  // 10,0 s, logo acima da janela de 9 s. Encurtar a frase para 84 caracteres derrubava o bloco
  // (8,53 s) sem que nada no jogo tivesse mudado — foi o que segurou a revisão de PINDORAMA por
  // um dia. Com a travessia encerrada, os dois textos ficam na linha 0.
  // Agora o estado é limpo E cobrado: se alguém voltar a medir com a travessia viva, a asserção
  // nova reprova em vez de depender de quantas letras a fala tem.
  const parada = await page.evaluate(() => new Promise(res => {
    fecharTudo();
    fecharTelas();                       // e é ESTA que encerra a travessia da metade de cima
    const trav = travessiaAtiva();
    // a abertura do capítulo 1, forçada a aparecer mesmo já vista
    S.aberturas = 0; S.cenario = 0;
    mostrarAbertura(function () { }, true);
    setTimeout(() => res({ i: falaI, viva: !!falaViva, trav: trav }), 9000);
  }));
  ok(parada.trav === false, parada.trav === false
    ? 'a abertura é medida sem travessia viva por baixo — o estado da metade de cima foi encerrado'
    : 'a travessia continuava VIVA ao abrir a abertura: este bloco estaria medindo o comprimento da fala, não o motor');
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
  await recarregar(page);
  await jogoPronto(page);                                    // era waitForTimeout(900)
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

  // ---- E NENHUMA FALA MAIS COMPRIDA DO QUE A CAIXA SABE ESCREVER ----
  // A caixa revela letra a letra. Os quatro capítulos escritos até 10/08 tinham no máximo
  // 251 caracteres por fala; a primeira versão do fecho de O CAIS saiu com 382 — e o print
  // mostrou o que isso é na prática: passados quatro segundos e meio, a linha ia em "Em 7 de
  // nove". Ninguém lê uma fala que leva vinte e cinco segundos para acabar de aparecer, e
  // quem não lê aperta PULAR — perdendo justamente a frase com fonte. O teto é 260, um pouco
  // acima da maior já medida, e existe para a próxima sessão descobrir isto aqui e não no
  // telefone de alguém. Fala grande não se aperta com fonte menor: parte-se em duas.
  const compridas = await page.evaluate(() => {
    const fora = [];
    EPOCAS.forEach(function (e) {
      e.abertura.concat(e.fecho).forEach(function (l, i) {
        if (l.length > 260) fora.push(e.id + '#' + i + ' (' + l.length + ')');
      });
    });
    const todas = EPOCAS.reduce(function (a, e) { return a.concat(e.abertura, e.fecho); }, []);
    return { fora: fora, max: Math.max.apply(null, todas.map(function (l) { return l.length; })) };
  });
  log('   fala mais comprida do jogo: ' + compridas.max + ' caracteres (teto 260)');
  ok(!compridas.fora.length, compridas.fora.length
    ? 'fala comprida demais para a revelação letra a letra: ' + compridas.fora.join(', ')
    : 'nenhuma fala passa dos 260 caracteres — a caixa consegue escrever todas antes de cansar');

  // ---- E CADA CAPÍTULO FALA COM A PRÓPRIA CARA (§2) ----
  // O contrato MUDOU em 15/08 e a mudança é a evolução que ele guardava: com os nove rostos
  // aprovados em ROSTOS.md, RETRATO_B64 tem uma pessoa POR ÉPOCA e o gate DONO_DO_BLOCO
  // morreu. O que o §2 cobra agora é mais forte: o retrato mostrado em cada capítulo tem de
  // ser O DELE — nunca o de outra época (o defeito original: a cara de AINDA AQUI narrando o
  // Valongo), e nunca escondido se a época tem retrato de verdade no aparelho. Medido de fora,
  // abrindo a fala de CADA capítulo: o src do elemento tem de bater com RETRATO_B64[i].
  const rostos = await page.evaluate(async () => {
    const fora = [];
    for (let i = 0; i < EPOCAS.length; i++) {
      fecharTudo();
      entrarNaEpoca(i); fecharTelas(); mostrarAbertura(undefined, true);
      await new Promise(r => setTimeout(r, 30));
      const r = document.getElementById('falaRetrato');
      const visivel = !!r && !r.classList.contains('oculta');
      const meu = RETRATO_B64[i] || '';
      const temRetrato = meu.length >= 200;              // stub de pacote = ~80 chars
      const srcCerto = !!r && r.getAttribute('src') === meu;
      const emprestado = visivel && !srcCerto;
      fora.push({ nome: EPOCAS[i].nome, visivel: visivel, temRetrato: temRetrato,
        ok: temRetrato ? (visivel && srcCerto) : !visivel, emprestado: emprestado });
    }
    fecharTudo();
    return fora;
  });
  log('   com rosto: ' + rostos.filter(r => r.visivel).map(r => r.nome).join(' · '));
  log('   sem rosto (pacote ainda não chegou): ' + (rostos.filter(r => !r.visivel).map(r => r.nome).join(' · ') || '(nenhum)'));
  const rostoErrado = rostos.filter(r => !r.ok).map(r => r.nome + (r.emprestado ? ' (rosto de OUTRA época!)' : r.visivel ? ' (visível sem retrato)' : ' (rosto próprio escondido)'));
  ok(!rostoErrado.length, rostoErrado.length
    ? '§2: ' + rostoErrado.join(', ')
    : 'cada capítulo fala com a própria cara — treze épocas, treze pessoas, nenhum empréstimo');

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
    // o que os capítulos ESCRITOS custam sozinhos — é contra isto que a fração se mede
    escritos: EPOCAS.filter(function (e) { return !e.emObra; })
      .reduce(function (s, e) { return s + LIMIAR_CENA * e.cenas; }, 0),
    total: EPOCAS.length
  }));
  log('   ' + eco.obras + ' de ' + eco.total + ' capítulos em obra | fim em ' + eco.fim +
    ' | escritos somam ' + eco.escritos + ' | primeiros limiares ' + eco.primeiros.join(', '));
  // A RÉGUA SAI DO DADO, e passou a sair em 2026-08-11. Ela era o literal 10.500 — o fim do
  // jogo com os QUATRO capítulos escritos daquele dia — e isso a fazia reprovar por MOTIVO
  // ERRADO no dia em que um esqueleto virasse capítulo: escrever três capítulos levou o fim a
  // 15.900, e a asserção teria dito "os capítulos em obra passaram de um quarto do jogo"
  // quando o que aconteceu foi o contrário — a fatia deles ENCOLHEU, de 11,4% para 5,7%.
  // O que se quer cobrar é a FRAÇÃO, e ela agora se compara com o que os escritos somam hoje.
  ok(eco.fim < eco.escritos * 1.25,
    'os capítulos em obra somam menos de um quarto do jogo (fim em ' + eco.fim +
    ', régua ' + Math.round(eco.escritos * 1.25) + ')');
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
  // O CAMINHO DEIXOU DE SER A RAIZ (22/08), e isto é o que torna a saída para a plataforma
  // MEDÍVEL aqui: `montarSaidaPlataforma()` esconde a nota de margem quando o jogo É a raiz
  // (no aplicativo do Capacitor `/` é o próprio jogo), então com `https://encaixe.local/` o
  // link nem existia na página e o evento `saiu` não teria como ser disparado pelo caminho da
  // PESSOA. Em produção o jogo mora em `/jogo/` desde 20/08 — este endereço passa a ser o de
  // verdade, e o roteador continua servindo o mesmo HTML e os mesmos pacotes.
  const ORIGEM = 'https://encaixe.local/jogo/';
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
      await jogoPronto(pg);                                  // era waitForTimeout(600)
      await pg.evaluate(() => {
        fecharTudo(); abrirTela('telaConfig'); montarConfig();
        document.getElementById('btnMedir').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      });
      pedidos.length = 0;
      await pg.reload();
    }
    // AS DUAS METADES DESTE BLOCO PEDEM ESPERAS DIFERENTES, e misturá-las num relógio só era o
    // defeito (23/08):
    //   · ligado    — a asserção é "o jogo TENTOU medir". Isso é um EVENTO, e evento se espera.
    //                 1400 ms de relógio bastavam na máquina calma e reprovavam na cheia.
    //   · desligado — a asserção é "nenhum pedido saiu". Isso é uma AUSÊNCIA, e ausência não
    //                 tem estado a esperar: só se prova deixando o tempo passar. Aqui o relógio
    //                 é o instrumento certo, e ele FICA, de propósito e por escrito.
    await jogoPronto(pg);
    if (modo === 'desligado') {
      await pg.waitForTimeout(1400);      // a janela em que um pedido apareceria se fosse aparecer
    } else {
      const t1 = Date.now();
      while (!pedidos.length && Date.now() - t1 < 30000) await pg.waitForTimeout(50);
    }
    let colhido = null;
    if (op.provocar) {
      colhido = await op.provocar(pg);
      if (modo === 'desligado') {
        await pg.waitForTimeout(600);     // de novo a AUSÊNCIA: só o relógio a prova
      } else {
        // o `provocar` dispara eventos; espera-se a CHEGADA do próximo, com teto de 10 s
        const antes = pedidos.length, t2 = Date.now();
        while (pedidos.length === antes && Date.now() - t2 < 10000) await pg.waitForTimeout(50);
      }
    }
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
      // A LISTA BRANCA NÃO MORA MAIS AQUI, e a mudança é o conserto do PENDENTES 33: ela
      // conferia o corpo de UM pedido — `pedidos[0]`, que é sempre o `abriu` — e prometia por
      // escrito cobrir "qualquer propriedade nova". Passou a ser conferida logo abaixo, sobre
      // os NOVE eventos, disparados de propósito em vez de esperados por acaso.
      ok(!/nome|email|e-mail|ip|user|agent/i.test(JSON.stringify(c).replace(/"(nome|\$ip)":/g, '""')),
        'e o corpo inteiro não carrega palavra de identificação escondida');
    }
  }

  // ============================================================
  // 17b · OS NOVE EVENTOS, DISPARADOS DE PROPÓSITO — o portão de privacidade, fechado
  //
  // O DEFEITO QUE ISTO EXISTE PARA NÃO TER DE NOVO (PENDENTES 33, achado em 19/08). A lista
  // branca prometia, por escrito, que "qualquer propriedade nova aparece aqui como falha, e é
  // de propósito". A promessa era falsa: o bloco abria o corpo de UM pedido — `pedidos[0]`, e
  // o primeiro pedido de toda carga é sempre o `abriu`. Os eventos tardios (`voltou`,
  // `capitulo`, `terminou`, `volta`, `parou`) nascem blocos depois, quando ninguém mais está
  // conferindo. Medido: `ativos` foi acrescentado ao `parou` e o portão passou sem um pio.
  //
  // A correção é não esperar que a partida produza os eventos por acaso. Esta página DISPARA
  // os onze pontos de `medir()` do jogo, cada um pelo gatilho de verdade, e só então abre os
  // corpos. Os gatilhos, na ordem em que rodam:
  //   abriu    · sozinho, na carga da página
  //   erro     · uma exceção de verdade, injetada no HTML servido, pelo `window.onerror`
  //   voltou   · `R.ultimo` recuado + `marcarDia()`, o único lugar que sabe que o dia é novo
  //   capitulo · `verificarCenario()` na PRIMEIRA fronteira sem travessia declarada, com o
  //              fecho do capítulo que sai já marcado como lido — aí `mostrarFecho` e
  //              `correrTravessia` chamam o retorno na hora e `avancar()` roda sem os 90 s de
  //              água no meio. (Na fronteira 0→1 há travessia, e o teste levaria 90 s.)
  //   historia · toque em `btnCompletude`, e depois em `btnFimHist` — são DOIS `medir()`
  //   fontes   · toque em `btnFontes`, e depois em `btnFimFontes` — idem, e o segundo leva
  //              `daChegada`, que é propriedade que só existe naquele caminho
  //   terminou · `chegarAoFim()`
  //   volta    · `responderVolta(2)`
  //   parou    · `pagehide`, o gancho que manda no celular
  //
  // DUAS ARMADILHAS, e as duas foram medidas antes de escrever:
  //  (a) esses gatilhos GRAVAM estado (`chegarAoFim` incrementa `R.chegou` e salva). Nada
  //      vaza para os blocos seguintes porque `browser.newPage()` abre um CONTEXTO próprio:
  //      esta página tem `localStorage` só dela, e ainda por cima noutra origem que a do
  //      `page` principal. Medido: os blocos 18/19/20 dão o mesmo resultado com e sem isto.
  //  (b) `medirParou()` se desarma na primeira passada. Como o bloco 20 roda na página DELE,
  //      o desarme daqui não o alcança — e mesmo assim a página rearma ao terminar.
  // ============================================================
  sec('17b · os nove eventos saem, e o corpo de cada um é aberto — não só o primeiro');
  // Toda propriedade que o jogo tem licença de mandar. É esta lista que reprova o campo novo.
  // `msg`, `arquivo` e `linha` entraram com o relatório de erro (bloco 18) — as três, e nada
  // além delas: relatório de defeito é o esconderijo clássico de dado de gente, porque parece
  // técnico e ninguém o lê como dado pessoal. `resposta` entrou com a pergunta da CHEGADA
  // (bloco 19) e `sessao` com o "onde parou" (bloco 20). `ativos` entrou em 19/08 com a
  // decisão do dono sobre o que conta como tempo jogado: `minutos` é tempo com o jogo na
  // frente, `ativos` é quanto disso teve a mão nele — inteiro de minutos, como o vizinho.
  // `local` entrou em 23/08 e é TÉCNICA, não conteúdo: vale 1 quando o jogo roda em
  // localhost/127.0.0.1 — ou seja, em bancada e no CI — e some do corpo em produção
  // (`undefined` não sobrevive ao JSON.stringify). Ela existe porque a PRIMEIRA leitura da
  // medição não mediu gente, mediu a gente: 11.576 "aparelhos", 838 "terminaram o arco" e uma
  // curva de retenção PLANA, com um `dia 20000` que só o `robusto-tudo` produz. Nada no corpo
  // dizia de onde vinha, então aqueles 30 dias não têm conserto — daqui para a frente têm.
  const PERMITIDAS = ['$ip', '$lib', '$process_person_profile', 'arquivo', 'ativos',
    'capitulo', 'daChegada', 'dia', 'linha', 'local', 'minutos', 'msg', 'n', 'nome', 'resposta',
    'sessao', 'terminou', 'vez'];
  // E POR EVENTO, que é mais apertado do que a lista corrida: com ela sozinha, mudar `parou`
  // para levar `resposta` passaria — a palavra está aprovada, só que para OUTRO evento. Aqui
  // cada um só pode levar o que foi aprovado PARA ELE. As três técnicas valem em todos.
  const TECNICAS = ['$ip', '$lib', '$process_person_profile', 'local'];
  const ESPERADAS = {
    abriu:    ['dia', 'capitulo', 'nome', 'minutos', 'terminou'],
    voltou:   ['dia'],
    capitulo: ['n', 'nome', 'minutos', 'dia'],
    historia: ['vez', 'dia', 'daChegada'],
    fontes:   ['vez', 'dia', 'daChegada'],
    terminou: ['vez', 'minutos', 'dia'],
    volta:    ['resposta', 'dia', 'minutos', 'vez'],
    parou:    ['capitulo', 'nome', 'minutos', 'sessao', 'ativos', 'dia'],
    erro:     ['msg', 'arquivo', 'linha'],
    // A PORTA DA PLATAFORMA (22/08, decisão do dono): NENHUMA propriedade além das três
    // técnicas. Lista vazia não é esquecimento — é a régua mais apertada que existe aqui, e
    // qualquer campo que alguém acrescente a este evento reprova na hora.
    saiu:     [],
    // ...e A PORTA DAS PALAVRAS, que estava FORA deste portão desde que nasceu (19/08). O
    // achado é de 22/08 e é do próprio instrumento: a varredura da fonte casava
    // `medir\("([a-z]+)"` — sem o sublinhado —, então `glossario_do_capitulo` nunca entrava na
    // conta dos eventos declarados e o corpo dele nunca foi aberto por ninguém. O CLAUDE.md
    // dizia DEZ e o portão cobrava NOVE, e a diferença passou dois dias sem ser vista.
    glossario_do_capitulo: ['n', 'dia']
  };
  const nove = await rodarMedida('adblock', {
    esperado: /encaixe-portao/,
    // O `erro` é o único que não se chama pelo nome: ele nasce de uma exceção de verdade e sobe
    // pelo `window.onerror`. Mesma injeção do bloco 18, e pelo mesmo motivo — script criado por
    // código chega sem `filename`.
    injetar: 'setTimeout(function(){ throw new Error("encaixe-portao"); }, 0);',
    provocar: async (pg) => pg.evaluate(async () => {
      const nota = [];
      const espera = ms => new Promise(r => setTimeout(r, ms));
      const toque = id => {
        const e = document.getElementById(id);
        if (!e) { nota.push('AUSENTE ' + id); return; }
        e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      };
      fecharTelas(); fecharTudo();
      // VOLTOU
      R.ultimo = '2000-01-01';
      marcarDia();
      // CAPÍTULO — a fronteira mais barata: a primeira sem travessia declarada entre os dois.
      let corte = -1;
      for (let i = 0; i + 1 < TOTAL_CENAS && i < LIMIARES.length; i++) {
        const de = epocaDoCenario(i), para = epocaDoCenario(i + 1);
        if (de === para) continue;
        if (travessiaEntre(EPOCAS[de].id, EPOCAS[para].id) >= 0) continue;
        corte = i; break;
      }
      nota.push('fronteira usada: cena ' + corte + (corte >= 0
        ? ' (' + EPOCAS[epocaDoCenario(corte)].id + ' -> ' + EPOCAS[epocaDoCenario(corte + 1)].id + ')'
        : ' — NENHUMA fronteira sem travessia'));
      if (corte >= 0) {
        visitando = false;
        S.cenario = corte; S.fronteira = corte;
        S.fechos = ((S.fechos | 0) | (1 << epocaDoCenario(corte))) >>> 0;
        S.energiaTotal = LIMIARES[corte];
        verificarCenario();
        await espera(150);
        fecharTelas(); fecharTudo();
      }
      // A HISTÓRIA e DE ONDE VEM, pelo menu
      toque('btnCompletude'); await espera(80); fecharTelas();
      toque('btnFontes'); await espera(80); fecharTelas();
      // TERMINOU, a pergunta de uma linha, e as duas portas da CHEGADA (que levam `daChegada`)
      chegarAoFim(); await espera(150);
      responderVolta(2);
      toque('btnFimHist'); await espera(80); fecharTelas();
      toque('btnFimFontes'); await espera(80); fecharTelas();
      // A PORTA DAS PALAVRAS. Chamada pela função e não pelo botão `falaGloss`, e a razão é
      // dita: o botão só existe DENTRO de um fecho de capítulo com palavras, e este bloco
      // acabou de fechar todas as telas para disparar o `terminou`. O que este portão confere
      // é o CORPO do evento, e o corpo é o mesmo pelos dois caminhos — a linha do `medir()`
      // está dentro de `abrirGlossarioDoCap`, não do ouvinte do botão.
      let capPal = -1;
      for (let i = 0; i < EPOCAS.length; i++) if (capPalavras(i).length) { capPal = i; break; }
      nota.push('capitulo com palavras: ' + capPal);
      if (capPal >= 0) { abrirGlossarioDoCap(capPal); await espera(80); }
      fecharTelas(); fecharTudo();
      // A SAÍDA PARA A PLATAFORMA, pelo CAMINHO DA PESSOA — o clique na âncora de verdade.
      // A navegação é barrada por um ouvinte de captura em `document` que só chama
      // `preventDefault()`: ele cancela a IDA e não interrompe a propagação, então o ouvinte
      // da própria âncora (que é quem mede) roda igual. Medir por `medir("saiu")` à mão
      // provaria o corpo e não provaria a ligação, que é justamente o que pode quebrar.
      // (a nota de margem já está no DOM: quem a monta é `montarFim()`, chamada pelo
      //  `chegarAoFim()` lá de cima — fechar a tela não desfaz o que foi montado)
      document.addEventListener('click', function (ev) { ev.preventDefault(); }, true);
      const cxSai = document.getElementById('fimPlataforma');
      const linkSai = cxSai && cxSai.querySelector('a');
      nota.push('saida visivel: ' + !!(linkSai && !cxSai.hidden) + ' | pathname ' + location.pathname);
      if (linkSai) linkSai.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await espera(80);
      fecharTelas(); fecharTudo();
      // ONDE PAROU — pelo gancho de verdade, e rearmado em seguida para a página não ficar muda
      window.dispatchEvent(new Event('pagehide'));
      medirParouArmado = true;
      nota.push('R.dias=' + R.dias + ' R.chegou=' + R.chegou + ' R.volta=' + R.volta
        + ' epoca=' + epocaAtual());
      return nota;
    })
  }).catch(e => ({ erro: String(e) }));
  if (nove.erro) { ok(false, 'o portão dos nove eventos explodiu — ' + nove.erro); }
  else {
    const corpos = eventos(nove);
    log('   ' + (nove.colhido || []).join(' | '));
    for (const c of corpos) {
      log('   · ' + String(c.event || '?').padEnd(9) + ' ' + Object.keys(c.properties || {}).sort().join(', '));
    }
    // (1) OS NOVE SAÍRAM. Sem isto o portão volta a conferir só o que calhou de sair, que é
    // exatamente o defeito — e ele voltaria em silêncio, porque um portão que não vê nada passa.
    const nomes = [...new Set(corpos.map(c => c.event))];
    // A lista de nomes sai da FONTE, não de um literal aqui: um evento novo que ninguém ensinou
    // este bloco a disparar reprova na hora, em vez de ficar de fora do portão para sempre.
    // (O `index.html` construído não tem comentário — a régua conta código, EQUIPE §2.6.)
    // O SUBLINHADO ENTROU NA VARREDURA EM 22/08, e ele valia um evento inteiro: sem ele
    // `glossario_do_capitulo` não era achado na fonte, não entrava na conta e o corpo dele
    // nunca era aberto — o portão prometia cobrir "qualquer propriedade nova" e cobria as de
    // nove eventos dos onze. É a lição 2.8 pela terceira vez neste mesmo bloco.
    const naFonte = [...new Set([...HTML.matchAll(/medir\("([a-z_]+)"/g)].map(m => m[1]))];
    const faltando = naFonte.filter(n => nomes.indexOf(n) < 0);
    log('   eventos na fonte: ' + naFonte.length + ' | disparados aqui: ' + nomes.length
      + ' | pedidos: ' + corpos.length);
    // O NÚMERO É O DA FONTE, e a lista do CLAUDE.md §3 ainda diz DEZ: ela não conta o `saiu`
    // (22/08) e o texto pronto para colar está no PENDENTES 56 — quem edita o CLAUDE.md é o
    // dono/plantão, não o agente. O portão continua sendo ESTE número, não o do documento.
    ok(naFonte.length === 11,
      'o jogo declara onze eventos, e todos passam pela lista branca (achei ' + naFonte.length + ')');
    ok(faltando.length === 0, faltando.length === 0
      ? 'e os onze saíram nesta página: ' + nomes.sort().join(' · ')
      : 'evento que o portão NÃO conseguiu disparar, e portanto não confere: ' + faltando.join(', '));
    // (2) A LISTA BRANCA, agora sobre todos os corpos
    const fora = [];
    const foraDoEvento = [];
    for (const c of corpos) {
      for (const p of Object.keys(c.properties || {})) {
        if (PERMITIDAS.indexOf(p) < 0) fora.push(c.event + '.' + p);
        const dele = ESPERADAS[c.event];
        if (dele && TECNICAS.indexOf(p) < 0 && dele.indexOf(p) < 0) foraDoEvento.push(c.event + '.' + p);
      }
    }
    ok(fora.length === 0, fora.length === 0
      ? 'nenhuma propriedade fora da lista branca em NENHUM dos nove — nada de tela, idioma, fuso ou navegador'
      : 'propriedade que ninguém aprovou: ' + [...new Set(fora)].join(', '));
    ok(foraDoEvento.length === 0, foraDoEvento.length === 0
      ? 'e nenhum evento carrega propriedade aprovada para OUTRO evento — a régua é por evento'
      : 'propriedade aprovada, mas não para este evento: ' + [...new Set(foraDoEvento)].join(', '));
    // (3) O corpo inteiro, atrás de palavra de identificação — em todos, não só no primeiro
    const suspeito = corpos.filter(c =>
      /nome|email|e-mail|ip|user|agent/i.test(JSON.stringify(c).replace(/"(nome|\$ip)":/g, '""')));
    ok(suspeito.length === 0, suspeito.length === 0
      ? 'e nenhum dos corpos carrega palavra de identificação escondida'
      : 'palavra de identificação no corpo de: ' + suspeito.map(c => c.event).join(', '));
    // (4) E disparar tudo isso não pode ser o que quebra o jogo
    ok(nove.ruins.length === 0, nove.ruins.length === 0
      ? 'e os onze pontos de medição rodaram sem o jogo soltar um erro sequer'
      : 'disparar os nove eventos quebrou o jogo: ' + nove.ruins[0]);
    ok(nove.vivo.andou > 1 && nove.vivo.tela,
      'com a partida seguindo inteira depois deles (a rua andou ' + nove.vivo.andou.toFixed(1) + ' px)');
  }
  // O INTERRUPTOR. Não é "menos dados": é nenhum. Desde 22/08 ele é provocado com o CLIQUE NA
  // SAÍDA no meio — o evento novo é o único que nasce de uma navegação, e "desligar desliga de
  // verdade" tem de valer para ele também, ou o interruptor passa a ter uma exceção silenciosa.
  const desl = await rodarMedida('desligado', {
    provocar: async (pg) => pg.evaluate(async () => {
      const espera = ms => new Promise(r => setTimeout(r, ms));
      fecharTelas(); fecharTudo();
      chegarAoFim(); await espera(150);
      document.addEventListener('click', function (ev) { ev.preventDefault(); }, true);
      const cxSai = document.getElementById('fimPlataforma');
      const linkSai = cxSai && cxSai.querySelector('a');
      if (linkSai) linkSai.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await espera(80);
      fecharTelas(); fecharTudo();
      return ['saida clicada com a medicao desligada: ' + !!linkSai];
    })
  }).catch(e => ({ modo: 'desligado', erro: String(e) }));
  if (desl.erro) { ok(false, 'desligado: o teste explodiu — ' + desl.erro); }
  else {
    log('   [desligado] ' + desl.pedidos.length + ' pedido(s) à medição | a rua andou '
      + desl.vivo.andou.toFixed(1) + ' px | ' + (desl.colhido || []).join(' | '));
    ok((desl.colhido || []).join('').indexOf('true') >= 0,
      'a saída para a plataforma EXISTE nesta página — senão o clique abaixo não provaria nada');
    ok(desl.pedidos.length === 0,
      desl.pedidos.length === 0
        ? 'com a contagem desligada não sai UM byte — nem no boot, nem ao abrir A HISTÓRIA, nem ao SAIR para a plataforma'
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
      // 1200 ms FICA DE PROPÓSITO: aqui o relógio NÃO é a espera de uma animação — ele é a
      // grandeza medida. A asserção é que o evento leva o tempo daquela sessão, e para haver
      // tempo é preciso que tempo passe. Sob carga isto só cresce, e crescer é inofensivo:
      // a régua abaixo é "maior que zero", não "igual a 1,2 s".
      await pg.waitForTimeout(1200);
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
  // ============================================================
  // 24 · A OBRA DO LUGAR — o mutirão avança com gente, não avança sem, e ninguém é gasto
  //
  // Três coisas que desencaixam em SILÊNCIO ABSOLUTO, que é o critério deste arquivo:
  //
  //   (a) `taxaMutirao(0)` deixar de devolver zero. O jogo não daria erro nenhum: a obra
  //       simplesmente passaria a crescer para quem nunca acolheu ninguém, e a frase que
  //       sustenta a mecânica inteira — *é a gente que ele acolheu trabalhando junto* —
  //       viraria mentira sem um pixel fora do lugar. É o §2 escrito como asserção.
  //   (b) uma acolhida ser consumida. `S.acolhidos` e `S.recursos` são os dois números que a
  //       obra toca, e só UM deles pode descer. Gente nunca é recurso.
  //   (c) o vão entre canteiros encolher. A média de objetos em cena é pura geometria —
  //       (W + largura) / (vão do nascer ao nascer) — e ela é a trava de composição do dono.
  //       Aqui ela é medida NA GEOMETRIA, não em 90 s de amostra: é a mesma conta que o
  //       `medir-poluicao.js` observa, sem o ruído das folhas por cima.
  // ============================================================
  sec('24 · a obra avança com gente, não avança sem, e ninguém é gasto nela');
  const oMutirao = await page.evaluate(() => {
    fecharTelas(); fecharTudo();
    const medir = (a) => {
      S.obra = { roca: 0, palicada: 0, casa: 0 };
      S.recursos = { flor: 500, agua: 500, refeicao: 500 };
      S.acolhidos = EPOCAS.map(() => 0); S.acolhidos[CAP_GENTE] = a;
      const gasto0 = 1500;
      // uma NOITE inteira no teto de ausência, pelo mesmo caminho que `carregar()` usa
      const seg = CFG.capOfflineHoras * 3600;
      const r = avancarObra(Math.floor(seg / 3600 * taxaMutirao(S.acolhidos[CAP_GENTE])));
      return { pontos: r.pontos, gente: S.acolhidos[CAP_GENTE],
        gasto: gasto0 - (S.recursos.flor + S.recursos.agua + S.recursos.refeicao),
        obra: S.obra.roca + S.obra.palicada + S.obra.casa };
    };
    const zero = medir(0), poucas = medir(3), muitas = medir(60);
    // A TRAVA DE COMPOSIÇÃO, VARRIDA E NÃO ESTIMADA: 20 mil px de estrada pelo MESMO
    // `atualizarCanteiros()` que o laço de quadro chama, contando quantos canteiros ficam em
    // quadro a cada 5 px. É a mesma conta que o `medir-poluicao.js` observa em 90 s de amostra,
    // só que sem o ruído das folhas e das chegadas por cima — aqui o número é do canteiro e de
    // mais nada, e é ele que precisa caber nos 0,4 de folga do capítulo 2.
    S.acolhidos = EPOCAS.map(() => 0); S.acolhidos[CAP_GENTE] = 12;
    S.cenario = cenarioDaEpoca(CAP_GENTE);
    S.energiaTotal = LIMIAR_CENA * S.cenario + LIMIAR_CENA * EPOCAS[CAP_GENTE].cenas * 0.9;
    const x0 = worldX;
    canteiros.length = 0; proximoCanteiro = 0;
    let soma = 0, amostras = 0, pior = 0;
    for (let i = 0; i < 4000; i++) {
      worldX += 5;
      atualizarCanteiros();
      const n = canteiros.filter(function (c) {
        const sx = c.wx - worldX;
        return sx < W && sx + OBRA_LARGURA[c.tipo] > 0;
      }).length;
      soma += n; amostras++; if (n > pior) pior = n;
    }
    worldX = x0; canteiros.length = 0;
    return { zero, poucas, muitas, mediaCanteiros: +(soma / amostras).toFixed(3), pior,
      teto: OBRA_MAX, derivado: OBRA_PONTOS_ESTAGIO * OBRA_ESTAGIOS };
  });
  log('   sem ninguém acolhido: ' + JSON.stringify(oMutirao.zero));
  log('   com 3 acolhidas:      ' + JSON.stringify(oMutirao.poucas));
  log('   com 60 acolhidas:     ' + JSON.stringify(oMutirao.muitas));
  log('   canteiros em cena, varrendo 20 mil px: média ' + oMutirao.mediaCanteiros
    + ' | pior momento ' + oMutirao.pior);
  ok(oMutirao.zero.pontos === 0 && oMutirao.zero.obra === 0,
    'ZERO acolhidas = ZERO avanço da obra (a frase que sustenta a mecânica)');
  ok(oMutirao.zero.gasto === 0,
    'e zero acolhidas não gasta um grão de mantimento — não existe upkeep, ninguém "come o estoque"');
  ok(oMutirao.poucas.pontos > 0 && oMutirao.muitas.pontos > 0,
    'com gente acolhida a obra anda (' + oMutirao.poucas.pontos + ' e ' + oMutirao.muitas.pontos + ' pontos numa noite)');
  ok(oMutirao.muitas.pontos > oMutirao.poucas.pontos,
    'mais gente adianta mais — mas a taxa satura, e o smoke cobra a saturação');
  ok(oMutirao.poucas.gente === 3 && oMutirao.muitas.gente === 60,
    'NENHUMA acolhida é consumida pela obra: gente não é recurso (§2)');
  ok(oMutirao.muitas.gasto > 0, 'o que a obra consome é mantimento, e só ele (' + oMutirao.muitas.gasto + ')');
  ok(oMutirao.mediaCanteiros <= 0.4,
    'o vão entre canteiros mantém a média em cena em ' + oMutirao.mediaCanteiros + ' (teto de projeto 0,40)');
  ok(oMutirao.pior <= 1,
    'e NUNCA há dois canteiros no mesmo quadro (pior momento em 20 mil px: ' + oMutirao.pior + ')');
  ok(oMutirao.teto === oMutirao.derivado, 'OBRA_MAX continua derivado de estágio × estágios, nunca literal');

  // ============================================================
  // 27 · O LUGAR — a página da obra conta, e não comanda
  //
  // A tela nasceu de um defeito de LEITURA: na estrada a obra pronta lê como cenário, e quem
  // a construiu não percebe que construiu. A página é a resposta. Seis coisas que, se
  // quebrarem, quebram em silêncio absoluto — que é o critério deste arquivo:
  //
  //   (a) ID REPETIDO NO POSTE. Este bloco nasce com uma cicatriz: o commit do glossário
  //       duplicou a tábua DE ONDE VEM e o menu ficou DIAS mostrando-a duas vezes, a segunda
  //       em Arial Black — porque `pixelRotulo` pinta o primeiro nó com o id e o segundo
  //       ficava com o texto cru do molde. Nenhum teste viu; id repetido não dá erro.
  //   (b) a tela fora de `TELAS`. Ela ficaria aberta para sempre atrás do jogo, e o `emTela`
  //       preso — o chrome nunca voltaria. É o modo de falha de toda tela nova.
  //   (c) `montarObra` ESCREVER no jogo. Uma página que se lê não pode mexer em `obra`,
  //       `recursos` nem `acolhidos`. A única coisa que ela grava é a própria fotografia.
  //   (d) a fotografia carimbada CEDO. Se `obraVista` fosse carimbada ao ABRIR a tela e não
  //       no fim de montá-la, a página diria "nada mudou" para sempre, e o defeito seria
  //       invisível — é justamente a frase que faz voltar.
  //   (e) UM DÍGITO DA OBRA na página. O MUTIRAO.md é literal: a obra não tem número em lugar
  //       nenhum, o progresso é o desenho. Um "3/6" que alguém acrescente por gentileza
  //       transforma trabalho coletivo em placar.
  //   (f) o DESENHO parar de crescer. Se a chapa da página deixar de responder a `S.obra`, a
  //       tela vira decoração: é o desenho que é o placar, e ele tem de ter MAIS pixel de pé
  //       numa obra maior. É a asserção que amarra a página à rua — as duas passam pela
  //       MESMA `desenharCanteiro`.
  // ============================================================
  sec('27 · O LUGAR: a página da obra conta o que cresceu, e não comanda ninguém');
  const oLugar = await page.evaluate(async () => {
    fecharTelas(); fecharTudo();
    // (a) nenhum id repetido no poste do menu
    const ids = Array.from(document.querySelectorAll('#poste [id]')).map(e => e.id);
    const repetidos = ids.filter((x, i) => ids.indexOf(x) !== i);
    // A PORTA APARECE QUANDO A OBRA PASSA A EXISTIR NO JOGO DA PESSOA — e este contrato MUDOU
    // em 14/08. Ele era "só aparece depois de acolher alguém", e o dono achou o defeito do jeito
    // mais direto que existe: pediu para olhar a página nova do mutirão e não conseguiu achá-la.
    // A página que explica o mutirão estava trancada atrás de já ter usado o mutirão, e ele já
    // tinha dito DUAS vezes que nunca entendeu o que o mutirão faz. Este teste cobrava a trava.
    // Agora: antes de chegar em Palmares a tábua não existe (não há obra nenhuma no seu jogo);
    // ao chegar, ela aparece mesmo com tudo zerado, e a página é que convida.
    S.acolhidos = EPOCAS.map(() => 0);
    S.obra = { roca: 0, palicada: 0, casa: 0 };
    S.obraVista = { roca: 0, palicada: 0, casa: 0 };
    const fronteiraGuardada = S.fronteira;
    S.fronteira = 0;                       // ainda no primeiro capítulo, antes de Palmares
    abrirTela('telaMenu');
    const bl0 = document.getElementById('btnLugar');
    // A TÁBUA NÃO SOME MAIS, ELA TRANCA (15/08, decisão do dono). O contrato mudou de "aparece
    // quando há lugar" para "está sempre no poste, com cadeado até haver". A razão é a mesma que
    // fez a página aparecer: porta escondida não ensina que existe, e ele passou dias sem
    // entender o mutirão porque a única tela que o explica era invisível. Porta trancada à vista
    // promete; porta ausente não conta nem que há o que esperar. E, de quebra, o menu para de
    // mudar de tamanho sozinho no meio da partida.
    const semGente = !bl0.classList.contains('oculto') && bl0.classList.contains('travada') && bl0.disabled;
    S.fronteira = CAP_GENTE;               // chegou em Palmares, e ainda não acolheu ninguém
    abrirTela('telaMenu');
    const bl1 = document.getElementById('btnLugar');
    const soDeChegar = !bl1.classList.contains('oculto') && !bl1.classList.contains('travada') && !bl1.disabled;
    S.fronteira = fronteiraGuardada;
    S.acolhidos[CAP_GENTE] = 7;
    abrirTela('telaMenu');
    const blG = document.getElementById('btnLugar');
    const comGente = !blG.classList.contains('oculto') && !blG.classList.contains('travada');
    // (c) e (d): um estado conhecido, uma visita, e o que a página diz
    S.obra = { roca: 65, palicada: 30, casa: 0 };
    S.obraVista = { roca: 55, palicada: 30, casa: 0 };
    S.recursos = { flor: 50, agua: 50, refeicao: 50 };
    const antes = JSON.stringify([S.obra, S.recursos, S.acolhidos]);
    montarObra(); abrirTela('telaObra');
    const depois = JSON.stringify([S.obra, S.recursos, S.acolhidos]);
    const primeira = document.getElementById('obraNovo').textContent;
    const carimbo = JSON.stringify(S.obraVista);
    // (e) nenhum dígito na área dos canteiros
    const textoCanteiros = document.getElementById('obraCanteiros').textContent;
    // segunda visita, sem nada ter mudado: a página tem de dizer isso
    montarObra();
    const segunda = document.getElementById('obraNovo').textContent;
    // (f) o desenho cresce com a obra — mesma chapa, dois estados, pixels de pé contados
    const dePe = (o) => {
      S.obra = o;
      const c = document.createElement('canvas');
      pintarCanteiroNaPagina(c, 'casa');
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      // tudo que não é o fundo da chapa (#191510) nem a linha de chão (#2a1c0c)
      for (let i = 0; i < d.length; i += 4) {
        const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
        if (k !== 0x191510 && k !== 0x2a1c0c) n++;
      }
      return n;
    };
    const vazia = dePe({ roca: 0, palicada: 0, casa: 0 });
    const meia = dePe({ roca: 0, palicada: 0, casa: 90 });
    const cheia = dePe({ roca: 0, palicada: 0, casa: OBRA_MAX });
    // (g) A OUTRA METADE DO MESMO TICKET: na RUA, um estágio inteiro ficando de pé sob a mão
    // era MUDO — o estilhaço dizia "trabalhou", e a coisa que merecia nome não tinha nome.
    // Aqui se cobra que a palavra nasce, que ela é a MESMA das outras superfícies
    // (`ESTAGIO_CURTO`), e que nenhuma vogal acentuada entra nela: `texto()` desenha todo
    // glifo numa caixa de 7×9 e as acentuadas têm 9 linhas de mapa — sairiam espremidas.
    fecharTelas(); fecharTudo();
    // O MESMO SANEAMENTO QUE O smoke.js PASSOU A FAZER EM 15/08, e aqui é prevenção e não
    // conserto: este bloco arma a obra à mão (`obraDedo` + `trabalharNaObra`), então ele passa
    // pelo mesmo `obraPodeArmar()` e é vulnerável ao mesmo vazamento. `fecharTelas()` não zera
    // um pulo herdado nem uma fala viva, e as duas dizem não ali — o pulo sem parar o mundo, a
    // fala parando. Duas causas, sintomas opostos, e foi isso que fez o bloco irmão do smoke
    // piscar em metade das execuções por dois dias.
    pararFala();
    jumpT = 0; attackT = 0; combo = 0;
    obraDedo = 0; obraTrabalhando = false;
    S.acolhidos = EPOCAS.map(() => 0); S.acolhidos[CAP_GENTE] = 9;
    S.cenario = cenarioDaEpoca(CAP_GENTE);
    // A FAIXA PELO CAPÍTULO FECHADO, e não por uma fração do vão: o laço de quadro continua
    // rodando durante este bloco, o impacto sobe sozinho e uma medida "a 88% do vão" virava a
    // cena no meio da preparação — a faixa morria e a asserção reprovava uma vez sim, uma não.
    // `faixaViva()` devolve verdadeiro para sempre num capítulo já fechado, e é a única forma
    // estável de estar na faixa.
    S.fechos = (S.fechos | 0) | (1 << CAP_GENTE);
    S.energiaTotal = LIMIAR_CENA * S.cenario + LIMIAR_CENA * EPOCAS[CAP_GENTE].cenas * 0.5;
    S.recursos = { flor: 90, agua: 90, refeicao: 90 };
    canteiros.length = 0; proximoCanteiro = 0;
    for (let k = 0; k < 4000; k++) {
      worldX += 4; atualizarCanteiros();
      const v = canteiroNaTela();
      if (v && v.wx - worldX <= W * 0.42) break;
    }
    const naRuaC = canteiroNaTela();
    let dito = '(nenhum canteiro em quadro)';
    if (naRuaC) {
      S.obra = { roca: 180, palicada: 180, casa: 180 };
      S.obra[naRuaC.tipo] = 59;
      nomeObraTxt = ''; nomeObraAte = 0; jumpT = 0;
      obraDedo = performance.now() - 600;
      trabalharNaObra(1.1);
      dito = nomeObraTxt;
      soltarObra();
    }
    const podeArmar = obraPodeArmar();
    const curtos = [].concat(ESTAGIO_CURTO.roca, ESTAGIO_CURTO.palicada, ESTAGIO_CURTO.casa)
      .map(s => s.toUpperCase());
    const acentoRuim = curtos.filter(s => /[ÁÀÂÃÉÊÍÓÔÕÚ]/.test(s));
    // (b) a tela fecha com todas as outras
    fecharTelas();
    const presa = document.getElementById('telaObra').classList.contains('aberta');
    const emTela = document.body.classList.contains('emTela');
    return { repetidos, semGente, comGente, soDeChegar, mexeu: antes !== depois, primeira, segunda,
      carimbo, digitos: (textoCanteiros.match(/[0-9]/g) || []).join(''),
      vazia, meia, cheia, presa, emTela, naLista: TELAS.indexOf('telaObra') >= 0,
      dito, curtos, acentoRuim, podeArmar, naFaixa: faixaViva() };
  });
  log('   ids repetidos no poste: ' + (oLugar.repetidos.length ? oLugar.repetidos.join(', ') : '(nenhum)'));
  log('   1ª visita diz: ' + JSON.stringify(oLugar.primeira));
  log('   2ª visita diz: ' + JSON.stringify(oLugar.segunda));
  log('   casa desenhada, pixels de pé: vazia ' + oLugar.vazia + ' | meia ' + oLugar.meia
    + ' | cheia ' + oLugar.cheia);
  ok(!oLugar.repetidos.length, 'nenhum id se repete no poste do menu — a tábua duplicada não volta');
  ok(oLugar.semGente && oLugar.soDeChegar && oLugar.comGente,
    'a tábua O LUGAR fica sempre no poste e DESTRANCA ao chegar em Palmares' +
    ' (antes: presente e trancada = ' + oLugar.semGente + ' · só de chegar: destrancada = ' +
    oLugar.soDeChegar + ' · com gente: ' + oLugar.comGente + ')');
  ok(oLugar.naLista && !oLugar.presa && !oLugar.emTela,
    'a tela está em TELAS e `fecharTelas()` a devolve, com o chrome do jogo junto');
  ok(!oLugar.mexeu, 'abrir a página não move obra, recursos nem acolhidas — ela LÊ o jogo (§2)');
  ok(/roça|paliçada|casa/i.test(oLugar.primeira),
    'a primeira visita diz o que cresceu desde a última vez');
  ok(/nada mudou/i.test(oLugar.segunda),
    'e a segunda, sem nada ter mudado, diz que nada mudou — a fotografia é carimbada no fim');
  ok(oLugar.carimbo === JSON.stringify({ roca: 65, palicada: 30, casa: 0 }),
    'a fotografia guardada é a obra do momento da visita (' + oLugar.carimbo + ')');
  ok(oLugar.digitos === '',
    'nenhum dígito da obra na página: o progresso é o desenho, nunca um placar');
  ok(oLugar.meia > oLugar.vazia && oLugar.cheia > oLugar.meia,
    'e o desenho CRESCE com a obra — é a mesma `desenharCanteiro` da rua, e é ela o placar');
  log('   na rua, o estágio que ficou de pé diz: ' + JSON.stringify(oLugar.dito)
    + ' (faixa viva: ' + oLugar.naFaixa + ', gesto armável: ' + oLugar.podeArmar + ')');
  ok(!!oLugar.dito && oLugar.curtos.indexOf(oLugar.dito) >= 0,
    'na RUA, fechar um estágio com a mão acende o NOME dele — e é a mesma palavra da página');
  ok(!oLugar.acentoRuim.length,
    'e nenhuma dessas palavras tem vogal acentuada, que a fonte do mundo espremeria'
      + (oLugar.acentoRuim.length ? ' — ' + oLugar.acentoRuim.join(', ') : ''));

  sec('21 · deitado, o menu inteiro cabe na tela e o JOGAR recebe o dedo');
  for (const vp of [{ w: 844, h: 390, nome: 'telefone deitado 844×390' },
                    { w: 1024, h: 768, nome: 'tablet deitado 1024×768' }]) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await abrirMenuParado(page);
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
    await hudNoLugar(page);                                  // era waitForTimeout(700)

    // ---- A ESCALA INTEIRA E O CHÃO, que é a armadilha nº 1 do §7 ----
    // A escala do mundo tem de ser um INTEIRO igual nos dois eixos: com `pixelated`, uma
    // fração faz um pixel de mundo virar 2 px de tela e o vizinho 3. Medido antes desta
    // passada: 3,0029 × 3 no tablet deitado e 2 × 1,9978 no Pixel — em RETRATO.
    // E o preço do conserto (a caixa do mundo passou a ser W×ESCALA, que SANGRA alguns px
    // para fora da janela) é exatamente o que pode fazer a personagem levitar: se as três
    // camadas deixarem de cobrir o MESMO retângulo, a linha do chão pintado desencontra do
    // GROUND. As duas coisas são medidas juntas de propósito — são a mesma decisão.
    const mundo = await page.evaluate(() => {
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const cv = document.getElementById('scene').getBoundingClientRect();
      const hd = document.getElementById('heroHD').getBoundingClientRect();
      const fd = document.getElementById('fundoHD').getBoundingClientRect();
      const cvEl = document.getElementById('scene');
      return {
        ex: +(cv.width / cvEl.width).toFixed(4), ey: +(cv.height / cvEl.height).toFixed(4),
        cobre: cv.width >= innerWidth - 1 && cv.height >= innerHeight - 1,
        mesmaCaixa: Math.abs(cv.width - hd.width) < 0.6 && Math.abs(cv.height - hd.height) < 0.6
                 && Math.abs(cv.width - fd.width) < 0.6 && Math.abs(cv.height - fd.height) < 0.6,
        // FUNDO_GROUND_SRC = 0.75: onde o chão começa DENTRO da pintura.
        difChao: fundoGeo ? +((fundoGeo.dy + 0.75 * fundoGeo.dh) - GROUND * ESCALA * dpr).toFixed(1) : null,
        caixas: Math.round(cv.width) + '×' + Math.round(cv.height) + ' · ' +
                Math.round(hd.width) + '×' + Math.round(hd.height) + ' · ' +
                Math.round(fd.width) + '×' + Math.round(fd.height),
      };
    });
    log('   ' + vp.nome + ': escala ' + mundo.ex + '×' + mundo.ey + ' | caixas ' + mundo.caixas
      + ' | chão pintado − GROUND = ' + mundo.difChao + ' px de aparelho');
    const inteiro = v => Math.abs(v - Math.round(v)) < 0.002;
    ok(inteiro(mundo.ex) && inteiro(mundo.ey) && Math.abs(mundo.ex - mundo.ey) < 0.002,
      vp.nome + ': a escala do mundo é um inteiro, igual nos dois eixos (' + mundo.ex + '×' + mundo.ey + ')');
    ok(mundo.cobre, vp.nome + ': e o mundo cobre a tela inteira');
    ok(mundo.mesmaCaixa, vp.nome + ': as três camadas ocupam a MESMA caixa (' + mundo.caixas + ')');
    ok(mundo.difChao !== null && Math.abs(mundo.difChao) <= 2,
      vp.nome + ': o chão pintado bate com o GROUND — a personagem não levita (' + mundo.difChao + ' px)');

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
    await telaParada(page, 'telaCompletude');                // era waitForTimeout(900)
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
    // A pergunta de uma linha NASCE `oculta` e um save que já respondeu a esconde para
    // sempre — então ela tem de ser forçada, ou a CHEGADA é medida sem o inquilino mais novo
    // dela. Foi assim que três tábuas de resposta com o rótulo estourando a caixa (e o "NÃO"
    // 33 px abaixo da borda a 640×360) passaram por toda medida deitada sem uma reprovação.
    for (const t of [{ id: 'telaFim', nome: 'CHEGADA',
                       mostra: 'montarFim(); montarPergunta();' +
                               'document.getElementById("fimPergunta").classList.remove("oculto");' +
                               'document.getElementById("fimPerguntaBotoes").classList.remove("oculto");' },
                     { id: 'telaConfig', mostra: 'montarConfig();', nome: 'AJUSTES' }]) {
      await page.evaluate(function (t) {
        fecharTelas(); eval(t.mostra); abrirTela(t.id);
      }, t);
      await telaParada(page, t.id);                          // era waitForTimeout(500)
      const r = await page.evaluate(function (t) {
        const H = document.documentElement.clientHeight, W = document.documentElement.clientWidth;
        const tela = document.getElementById(t.id);
        const fora = [], baixos = [];
        tela.querySelectorAll('.telaBtn, .telaTit, .telaTxt, #fimPlacar, #cfgInfo, #fimPerguntaTxt').forEach(function (e) {
          const s = getComputedStyle(e);
          if (s.display === 'none' || s.visibility === 'hidden') return;
          const b = e.getBoundingClientRect();
          if (b.width <= 0 || b.height <= 0) return;
          const id = e.id || e.className.split(' ')[0];
          if (b.top < -1 || b.bottom > H + 1 || b.left < -1 || b.right > W + 1) {
            fora.push(id + ' ' + Math.round(b.top) + '..' + Math.round(b.bottom) +
                      ' x ' + Math.round(b.left) + '..' + Math.round(b.right));
          }
          // as tábuas de resposta entram na conta: elas tinham 36 px e a exceção que as
          // dispensava era o preço de caberem empilhadas, que a coluna dupla acabou de pagar
          if (e.classList.contains('telaBtn') && b.height < 44) {
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
  // devolve a medida da casa antes do bloco 22, que mede JOGO e não tela
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { fecharTelas(); });
  await hudNoLugar(page);                                    // era waitForTimeout(400)

  // ============================================================
  // 22 · PALMARES: UM TOQUE ACOLHE — e nada ali é gramática de combate
  //
  // O verbo do capítulo 2 é ACOLHER: quem chega a Palmares já se libertou por conta própria, e
  // acolher é dar lugar, comida e água a quem chegou. Nunca libertar, nunca resgatar — o §2.4.3
  // é explícito, e libertar-com-o-toque é o poder do senhor invertido em fantasia.
  //
  // Por baixo, porém, o gesto foi `m.hp -= dmg` até 2026-08-11: de cinco a treze toques até uma
  // PESSOA "ser acolhida", que é bater até alguém ceder com nome novo por cima. A dívida estava
  // declarada no Diário desde 2026-08-06 e o capítulo 3 já a tinha pago com a conversa.
  //
  // Este bloco é a trava. Ele falha se o dano voltar por qualquer porta — e cada asserção cai
  // por um motivo diferente, porque o dano volta de jeitos diferentes: contando dois toques,
  // baixando hp, piscando branco, empurrando, ou pendurando uma barra de vida sobre a cabeça
  // de alguém (uma barra conta quantas pancadas essa pessoa aguenta: a linha exata do §2.2).
  // ============================================================
  sec('22 · em PALMARES um toque acolhe, e nada ali é combate');
  const acolher = await page.evaluate(async () => {
    const cenarioAntes = S.cenario, cuidadoAntes = S.cuidado;
    // POR IDENTIDADE, nunca por posição: `CAP_GENTE` é o próprio motor dizendo qual capítulo
    // tem fila. PALMARES deixou de ser a época 1 no dia em que os capítulos em obra entraram.
    S.cenario = cenarioDaEpoca(CAP_GENTE);
    mobs.length = 0; drops.length = 0; parts.length = 0;
    grupo.length = 0; ficando.length = 0; S.grupo = 0;
    S.acolhidos = S.acolhidos.map(function () { return 0; });
    S.cuidado = 0.5; cuidadoVisto = 0.5;
    proximoMob = 1e9;                                  // ninguém novo chega durante a medida
    // `cash` é o hp 8 do jeito velho — o valor do meio, para o "um toque" não passar por acaso
    const m = novoMob('cash', worldX + HX + 30);
    m.parado = true; m.espera = 999;
    mobs.push(m);
    const hp0 = m.hp, wx0 = m.wx, drops0 = drops.length;
    // A BARRA DE VIDA, cobrada na porta em que ela apareceria: `desenharVidaMob` é chamada num
    // laço guardado por `!pessoaNaRua()`. Se alguém tirar a guarda, o contador acusa.
    let barras = 0;
    const barraOriginal = window.desenharVidaMob;
    window.desenharVidaMob = function () { barras++; return barraOriginal.apply(null, arguments); };
    let toques = 0, piscou = false, empurrou = false, hpCaiu = false;
    const fracAntes = fracAlcance(m);
    clicar(false, true, true); toques++;
    desenhar();
    // SEM arredondar: o toque abre o acolhimento com 1e-6 s, e `toFixed(3)` disso é "0.000" —
    // a primeira versão desta asserção reprovou o código certo por causa da própria régua.
    const fracAoAbrir = fracAlcance(m);
    // 4 s de relógio, duas vezes e meia o ACOLHER_SEG de 1,6 — margem de aritmética, não chute
    let fracMeio = 0;
    for (let i = 0; i < 240 && !m.dead; i++) {
      atualizarMobs(1 / 60);
      if (i === 40) { fracMeio = fracAlcance(m); desenhar(); }
      if (m.flash > 0) piscou = true;
      if (m.wx > wx0) empurrou = true;
      if (m.hp < hp0) hpCaiu = true;
    }
    window.desenharVidaMob = barraOriginal;
    const r = {
      toques: toques, ficou: grupo.length, acolhidos: S.acolhidos[CAP_GENTE] | 0,
      dropsNovos: drops.length - drops0,
      dropDoTipo: drops.length ? drops[drops.length - 1].type : null,
      hpCaiu: hpCaiu, piscou: piscou, empurrou: empurrou, barras: barras,
      fracAntes: fracAntes, fracAoAbrir: fracAoAbrir, fracMeio: fracMeio,
      cuidadoSubiu: S.cuidado > 0.5
    };
    S.cenario = cenarioAntes; S.cuidado = cuidadoAntes; cuidadoVisto = cuidadoAntes;
    mobs.length = 0; drops.length = 0; parts.length = 0;
    grupo.length = 0; ficando.length = 0; S.grupo = 0;
    proximoMob = -1; mobChao = 0;
    return r;
  });
  log('   um toque -> ' + acolher.toques + ' toque(s), ela ficou (fila ' + acolher.ficou +
    ', acolhidas ' + acolher.acolhidos + ') | o que trazia caiu: ' + acolher.dropsNovos +
    ' (' + acolher.dropDoTipo + ') | anel ' + acolher.fracAntes.toFixed(3) + ' -> ' +
    acolher.fracAoAbrir.toExponential(1) + ' -> ' + acolher.fracMeio.toFixed(3));
  ok(acolher.toques === 1 && acolher.ficou === 1,
    acolher.toques === 1 && acolher.ficou === 1
      ? 'UM toque acolhe, e quem foi acolhida entra na fila que anda junto'
      : 'foram ' + acolher.toques + ' toque(s) e ' + acolher.ficou + ' na fila — se virar dois, o dano voltou');
  ok(acolher.acolhidos === 1, 'e a época lembra dela (S.acolhidos[' + 'CAP_GENTE' + '] = ' + acolher.acolhidos + ')');
  ok(!acolher.hpCaiu, acolher.hpCaiu
    ? 'o hp de uma PESSOA caiu: `m.hp -= dmg` voltou ao capítulo 2 (§2.2)'
    : 'nenhum toque tirou nada de ninguém — o hp da pessoa não se move');
  ok(acolher.dropsNovos === 1, 'o que ela TRAZIA fica no chão, e é uma coisa só (' + acolher.dropsNovos + ')');
  ok(!acolher.piscou, 'sem pisca branco sobre uma pessoa (§2)');
  ok(!acolher.empurrou, 'sem empurrão: ninguém empurra para trás quem veio ficar (§2)');
  ok(acolher.barras === 0,
    acolher.barras === 0
      ? 'e nenhuma barra de vida sobre a cabeça de alguém — a barra conta pancadas (§2.2)'
      : 'desenharVidaMob rodou ' + acolher.barras + 'x em PALMARES: alguém pendurou uma barra sobre uma pessoa');
  // O CHÃO É QUEM LÊ O PROGRESSO, e essa leitura já morreu em silêncio uma vez: quando o
  // capítulo 3 trocou o dano pela conversa, `1 − hp/hpMax` virou zero para sempre e o anel
  // parou de encher sem um erro no console. `fracAlcance` é o lugar único das três contas.
  ok(acolher.fracAntes === 0 && acolher.fracAoAbrir > 0 && acolher.fracMeio > 0.2,
    'o lugar no chão está vazio antes do toque e enche enquanto ela é acolhida (' +
    acolher.fracAntes.toFixed(3) + ' -> ' + acolher.fracMeio.toFixed(3) + ')');
  ok(acolher.cuidadoSubiu, 'e o mundo responde ao acolhimento como sempre respondeu (S.cuidado subiu)');

  // e o mesmo anel no capítulo 3, que é o outro capítulo de gente e o que perdeu a leitura
  const anelPalavra = await page.evaluate(async () => {
    const cenarioAntes = S.cenario;
    S.cenario = cenarioDaEpoca(CAP_PALAVRA);
    mobs.length = 0; proximoMob = 1e9;
    const m = novoMob('cash', worldX + HX + 30);
    m.parado = true; m.espera = 999; mobs.push(m);
    S.modo = 'limpo';
    clicar(false, true, true);
    const a = fracAlcance(m);
    for (let i = 0; i < 40; i++) atualizarMobs(1 / 60);
    const b = fracAlcance(m);
    S.cenario = cenarioAntes; mobs.length = 0; proximoMob = -1; mobChao = 0;
    return { a: a, b: b };
  });
  log('   SALVADOR: o mesmo anel, ' + anelPalavra.a.toExponential(1) + ' -> ' + anelPalavra.b.toFixed(3));
  ok(anelPalavra.a > 0 && anelPalavra.b > 0.2,
    'e em SALVADOR o anel também enche com a conversa, pela mesma função');

  // devolve a medida da casa: o que vier depois continua medindo o que sempre mediu
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { fecharTelas(); });
  await hudNoLugar(page);                                    // era waitForTimeout(400)

  // ============================================================
  // 23 · OS MARCOS NO CHÃO EM TODO CAPÍTULO — e as três coisas que quebram em silêncio
  //
  // A lista de placas deixou de ser `[0, 2, 3]` escrito à mão e passou a se derivar da
  // LINHA_TEMPO. Uma derivação erra sem fazer barulho: um capítulo com momento com fonte
  // que fica sem placa não dá erro nenhum — só some da estrada uma história que existe.
  // Um capítulo SEM momento que ganha placa é pior: seria uma placa muda, ou uma placa
  // afirmando o momento do capítulo vizinho. E a máscara de bits, que era de 3, hoje é de
  // treze: se ela estourar a faixa do ESQUEMA_SAVE, o save inteiro cai no padrão em silêncio.
  //
  // O quarto item é a trava do dono: a placa é UM objeto a mais em cena, e a média de
  // objetos não pode passar a do capítulo 1. Aqui ela é medida ao vivo, com a máscara zerada
  // — que a 85% do vão comprime o orçamento inteiro de placas do capítulo dentro da célula, e
  // é portanto um teto e não uma amostra.
  //
  // A TRAVA É RELATIVA, E NÃO PODIA SER OUTRA COISA — descoberto medindo, em 11/08. O número
  // "4,7 / 5,4" que o NOTES.md registra NÃO se reproduz entre sessões: o `medir-poluicao.js`
  // rodado no MESMO build de ontem devolveu 5,25 e 5,18 andando, contra os 4,43 medidos horas
  // antes, e a diferença inteira estava em `folhas` (1,09 → 2,17), que nenhuma mudança de
  // código tocou. Quantas folhas ficam em quadro depende de quantas a personagem colhe, e isso
  // anda com o orçamento de quadro da máquina. Comparar uma medição de hoje com um número
  // gravado ontem mede o computador, não o jogo. Então este bloco mede a RÉGUA (o capítulo 1)
  // na mesma sessão, com a mesma célula, e cobra os outros contra ela — e mede o custo da
  // placa por subtração DENTRO do mesmo quadro, que é a única forma imune a isso.
  // ============================================================
  sec('23 · marco em capítulo que tem momento, e em nenhum outro');
  const mk = await page.evaluate(() => {
    const caps = EPOCAS.map(function (e, i) {
      const momentos = LINHA_TEMPO.filter(function (n) {
        return n.tipo === 'momento' && n.t && n.d && n.f && epocaDoCenario((n.cena || 0) | 0) === i;
      });
      const meus = MARCOS.filter(function (m) { return m.ep === i; });
      const ini = LIMIAR_CENA * cenarioDaEpoca(i), vao = LIMIAR_CENA * e.cenas;
      return {
        id: e.id, nome: e.nome, cenas: e.cenas, momentos: momentos.length,
        marcos: meus.length, teto: tetoMarcos(i),
        titulos: meus.map(function (m) { return m.no.t; }),
        semFonte: meus.filter(function (m) { return !m.no.f; }).length,
        alvos: meus.map(function (m) { return marcoAlvo(m); }),
        ini: ini, fim: ini + vao
      };
    });
    return {
      caps: caps, total: MARCOS.length, mascara: MASCARA_MARCOS,
      maxEsq: ESQUEMA_SAVE.marcos.max, espaco: espacoMarco(),
      // A PROVA DE QUE A DERIVAÇÃO NÃO INVENTOU NADA: aplicada ao vão de Palmares ela tem de
      // devolver a MESMA escolha que o historiador tinha feito à mão — [0,2,3].
      //
      // Mede a derivação CRUA, e a diferença importa. Depois dela roda uma segunda regra: um
      // capítulo cuja rua é feita de GENTE carrega uma placa a menos, porque quem foi acolhida
      // continua em quadro e a trava do dono é que nenhum capítulo passe o capítulo 1. Medir o
      // resultado final aqui misturaria as duas regras e a prova deixaria de provar o que ela
      // existe para provar. As duas são cobradas, cada uma na sua asserção.
      palmaresCru: (function () {
        const i = iEp('palmares');
        const n = LINHA_TEMPO.filter(function (x) {
          return x.tipo === 'momento' && x.t && x.d && x.f && epocaDoCenario((x.cena || 0) | 0) === i;
        }).length;
        const vao = LIMIAR_CENA * EPOCAS[i].cenas;
        return escolherMarcos(n, Math.max(0, Math.round(vao / espacoMarco()) - 1));
      })(),
      palmares: (function () {
        const i = iEp('palmares');
        const todos = LINHA_TEMPO.filter(function (n) {
          return n.tipo === 'momento' && n.t && n.d && n.f && epocaDoCenario((n.cena || 0) | 0) === i;
        });
        return MARCOS.filter(function (m) { return m.ep === i; })
          .map(function (m) { return todos.indexOf(m.no); });
      })()
    };
  });
  mk.caps.forEach(function (c) {
    log('   ' + c.nome.padEnd(26) + c.cenas + ' cena(s) · ' + c.momentos + ' momento(s) com fonte · teto ' +
      c.teto + ' · ' + c.marcos + ' marco(s)' + (c.titulos.length ? ' — ' + c.titulos.join(' | ') : ''));
  });
  mk.caps.forEach(function (c) {
    if (c.momentos > 0) {
      ok(c.marcos > 0, c.nome + ' tem momento com fonte e ganhou placa na estrada (' + c.marcos + ')');
      ok(c.marcos <= c.teto, c.nome + ': ' + c.marcos + ' placa(s) para um teto de ' + c.teto +
        ' — o espaçamento medido no cap. 2 não foi apertado');
    } else {
      ok(c.marcos === 0, c.nome + ' não tem momento com fonte e ficou SEM placa — placa muda não existe');
    }
    ok(!c.semFonte, c.nome + ': nenhuma placa sem fonte (§2)');
    ok(c.alvos.every(function (a) { return a > c.ini && a < c.fim; }),
      c.nome + ': todo alvo cai DENTRO do vão do capítulo (' + c.ini + '..' + c.fim + ')');
  });

  // A CATRACA DA PERNA "ENSINA" (18/08). Este bloco MEDIA momentos por capitulo desde que
  // existe e nunca cobrou que houvesse algum -- entao cinco capitulos de treze rodaram em
  // producao com ZERO, e ninguem soube. Sem momento com fonte nao ha placa na estrada, nao ha
  // entrada em A HISTORIA, e nao ha nada para a nota da volta sortear: o capitulo e bonito, e
  // jogavel, e nao ensina nada. Numa tese em que bonito · divertido · ensina pesam igual, isso
  // e um terco da entrega faltando em silencio.
  //
  // A lista e nominal pelo mesmo motivo das outras deste arquivo: um capitulo novo que entre
  // sem historia exige escrever o id aqui, e isso aparece no diff. Hoje ela esta VAZIA -- os
  // treze ensinam -- e e assim que ela deve ficar.
  {
    const SEM_HISTORIA_ACEITO = [];
    const mudos = mk.caps.filter(function (c) { return c.momentos === 0; });
    if (mudos.length) log('   ⚠ capitulos sem nenhum momento com fonte: ' + mudos.map(function (c) { return c.nome; }).join(', '));
    const novos = mudos.filter(function (c) { return SEM_HISTORIA_ACEITO.indexOf(c.id) < 0; })
      .map(function (c) { return c.nome + ' (' + c.id + ')'; });
    ok(novos.length === 0,
      'todo capítulo tem pelo menos um momento com fonte — nenhum trecho de estrada é mudo' +
      (novos.length ? ' — NÃO ENSINA NADA: ' + novos.join(', ') +
        '. Pendure um momento com fonte na cena dele e a placa aparece sozinha.' : ''));
    const jaEnsinam = SEM_HISTORIA_ACEITO.filter(function (id) {
      const c = mk.caps.find(function (x) { return x.id === id; });
      return c && c.momentos > 0;
    });
    ok(jaEnsinam.length === 0,
      'a lista de exceção não guarda capítulo que já tem história' +
      (jaEnsinam.length ? ' — TIRE DAQUI: ' + jaEnsinam.join(', ') : ''));
  }
  log('   total ' + mk.total + ' marcos · máscara ' + mk.mascara + ' · espaçamento mínimo ' + mk.espaco);
  ok(mk.total > 0 && mk.total <= 30,
    'a lista derivada cabe numa máscara de bits (' + mk.total + ' marcos, teto 30)');
  ok(mk.mascara === Math.pow(2, mk.total) - 1,
    'MASCARA_MARCOS deriva do dado, não de um literal (' + mk.mascara + ')');
  ok(mk.maxEsq === mk.mascara,
    'e o ESQUEMA_SAVE aceita a faixa nova — max ' + mk.maxEsq + ' para uma máscara de ' + mk.mascara);
  ok(mk.caps.filter(function (c) { return c.marcos > 0; }).length >= 5,
    'a estrada tem placa em ' + mk.caps.filter(function (c) { return c.marcos > 0; }).length +
    ' capítulos — deixou de ser protótipo de um só');
  log('   PALMARES: derivação crua ' + JSON.stringify(mk.palmaresCru) +
    ' → depois da regra da rua com gente ' + JSON.stringify(mk.palmares));
  ok(JSON.stringify(mk.palmaresCru) === '[0,2,3]',
    'a derivação devolve em PALMARES a mesma escolha que o historiador fez à mão: [' +
    mk.palmares.join(',') + '] (o último do vão, com o sujeito em quem resistiu, fica)');

  ok(mk.palmares.length === mk.palmaresCru.length - 1
     && mk.palmares[0] === mk.palmaresCru[0]
     && mk.palmares[mk.palmares.length - 1] === mk.palmaresCru[mk.palmaresCru.length - 1],
    'e a rua com GENTE carrega uma placa a menos, some a do meio: ' +
    JSON.stringify(mk.palmaresCru) + ' -> ' + JSON.stringify(mk.palmares));
  // ---- a máscara de um save antigo não cala placa nenhuma
  const velho = await page.evaluate(() => {
    // um save gravado quando só Palmares tinha placa: três bits ligados, sem `marcosN`
    const bruto = JSON.parse(localStorage.getItem(CHAVE_JOGO) || '{}');
    // SEM o campo `marcosN`, que é como um save de verdade daquela época está no disco. Escrever
    // `marcosN: 3` aqui esconderia o defeito: `S.marcosN` já nasce valendo o número de hoje, e o
    // laço do `carregar` só sobrescreve campo que EXISTE no JSON — sem esta ausência o teste
    // passava e o jogo calava as placas novas de quem já tinha jogado.
    bruto.marcos = 7; delete bruto.marcosN; bruto.arco = S.arco;
    localStorage.setItem(CHAVE_JOGO, JSON.stringify(bruto));
    S.marcos = 7;
    carregar(true);
    return { marcos: S.marcos, n: S.marcosN };
  });
  ok(velho.marcos === 0 && velho.n > 3,
    'save de quando só Palmares tinha placa (marcos=7) não cala as placas novas — zerou e regravou para ' +
    velho.n + ' marcos');

  // ---- e a trava do dono, medida ao vivo: um marco a mais é UM objeto a mais
  sec('23b · a placa não estourou o teto de tela poluída (a régua é o cap. 1, medido agora)');
  // UMA célula por capítulo, com DOIS acumuladores: o total em cena e o mesmo total sem a
  // placa. Medir "com" e "sem" em células separadas parecia mais honesto e é o contrário:
  // duas amostras independentes de 12 s diferem sozinhas em ~0,4 objeto só pelo sorteio dos
  // spawns, e a diferença medida (1,22) dizia mais sobre o sorteio que sobre a placa. No
  // mesmo quadro, a subtração é exata e a asserção passa a cobrar o que quer cobrar.
  const celula = async function (cap) {
    return await page.evaluate(async (a) => {
      fecharTudo();
      // ...E AS TELAS TAMBÉM, que `fecharTudo` não fecha (ele fecha as bandejas). Esta linha
      // entrou em 12/08 e a célula mede outra coisa sem ela: desde que o MENU virou LOOP (o
      // mundo roda, a partida não), medir a rua com uma tela ainda aberta mede uma rua VAZIA —
      // e a régua do bloco, que é o capítulo 1 medido agora, saía baixa por esse motivo e não
      // pelo capítulo. Antes do loop a mesma sujeira só deslocava o número um pouco.
      fecharTelas();
      const c0 = cenarioDaEpoca(a.cap);
      S.cenario = c0; S.fronteira = TOTAL_CENAS - 1;
      const ini = LIMIAR_CENA * c0, vao = LIMIAR_CENA * EPOCAS[a.cap].cenas;
      S.energiaTotal = ini + vao * 0.85; S.energia = 1e6;
      S.aberturas = MASCARA_EPOCAS; S.fechos = 0;
      // Máscara zerada e o impacto a 85% do vão: todos os alvos do capítulo já batidos, ou
      // seja, o orçamento INTEIRO de placas dele comprimido nesta célula. Em jogo essas
      // mesmas placas se espalham pelo capítulo todo; isto é teto, não amostra.
      S.marcos = 0;
      marcoAtivo = null; S.u1 = S.u2 = S.u3 = true;
      S.modo = 'carvao';
      mobs.length = 0; drops.length = 0; folhas.length = 0; floats.length = 0;
      verificarCenario = function () {};
      abrirFala = function () {};        // fala aberta PARA o mundo; aqui só se mede a rua
      let n = 0, soma = 0, somaSem = 0, pior = 0, placas = 0;
      await new Promise(function (pronto) {
        const t = setInterval(function () {
          // contagem e não booleano: se um dia `marcoAtivo` virar lista, esta linha conta
          // duas placas e a asserção quebra — que é exatamente o serviço dela
          const placaN = marcoAtivo ? (Array.isArray(marcoAtivo) ? marcoAtivo.length : 1) : 0;
          const semPlaca = mobs.filter(function (m) { return !m.dying && !m.dead; }).length +
            drops.filter(function (d) { return !d.morto; }).length +
            folhas.length + floats.length;
          if (placaN) placas++;
          n++; soma += semPlaca + placaN; somaSem += semPlaca;
          if (semPlaca + placaN > pior) pior = semPlaca + placaN;
          if (n >= 60) { clearInterval(t); pronto(); }
        }, 200);
      });
      return { media: soma / Math.max(1, n), mediaSem: somaSem / Math.max(1, n),
        pior: pior, placas: placas, n: n, nome: EPOCAS[a.cap].nome };
    }, { cap: cap });
  };
  // O capítulo 1 primeiro: é ele a régua, e ela é medida agora, nesta máquina, nesta célula.
  const regua = await celula(0);
  log('   RÉGUA · ' + regua.nome + ': a mesma rua sem a placa ' + regua.mediaSem.toFixed(2) +
    ' · com ela ' + regua.media.toFixed(2) + ' (placa em cena em ' + regua.placas + ' de ' +
    regua.n + ' amostras) · pior ' + regua.pior);
  ok(regua.media - regua.mediaSem <= 1.0, regua.nome + ': a placa custou ' +
    (regua.media - regua.mediaSem).toFixed(2) +
    ' objeto de média — um marco é UM objeto, nunca dois');
  // 1 = PALMARES (3 placas + a gente que anda junto) · 6 = AS PORTAS (capítulo em obra, 1 placa)
  for (const alvoCap of [1, 6]) {
    const c = await celula(alvoCap);
    log('   ' + c.nome + ': a mesma rua sem a placa ' + c.mediaSem.toFixed(2) + ' · com ela ' +
      c.media.toFixed(2) + ' (placa em cena em ' + c.placas + ' de ' + c.n +
      ' amostras) · pior ' + c.pior);
    // A FOLGA SUBIU DE 0,3 PARA 0,8 EM 12/08, E FOI MEDIDA — não afrouxada por conveniência.
    // O instrumento novo `test/medir-celula-poluicao.js` roda esta mesma célula fora do bloco,
    // alternando os dois capítulos: PINDORAMA deu 4,15 · 4,42 · 4,28 · 5,22 e PALMARES
    // 4,40 · 4,43 · 4,12 · 4,10 em builds diferentes — ou seja, o MESMO capítulo varia ~1,0
    // entre amostras de 12 s, porque o vão entre chegadas é sorteado. Uma folga de 0,3 é MENOR
    // que o ruído do instrumento: a asserção estava tirando cara ou coroa, e falhou sozinha em
    // 12/08 com a rua intacta. 0,8 continua abaixo do que a trava existe para pegar — uma
    // placa a mais custa ~1,0 objeto, e é a asserção logo abaixo, medida no MESMO quadro, que
    // cobra isso com precisão.
    ok(c.media <= regua.media + 0.8, c.nome + ': média de objetos ' + c.media.toFixed(2) +
      ' não passou a do capítulo 1 medida agora (' + regua.media.toFixed(2) + ')');
    ok(c.media - c.mediaSem <= 1.0, c.nome + ': a placa custou ' +
      (c.media - c.mediaSem).toFixed(2) + ' objeto de média — um marco é UM objeto, nunca dois');
  }
  await page.evaluate(() => { localStorage.clear(); });
  await recarregar(page);
  await jogoPronto(page);                                    // era waitForTimeout(600)

  // ============================================================
  // 25 · QUEM FALA FICA COLADA NA CAIXA, EM QUALQUER LARGURA
  //
  // O retrato estava preso à BORDA DA TELA (`left: 8px`) e a caixa CENTRALIZA
  // (`width: min(560px, 100%)`). Em telefone estreito os dois coincidem por acidente e parece
  // certo — em qualquer tela mais larga que 560 px a caixa recua para o meio e a pessoa fica
  // sozinha na beirada, com as pernas de fora, AO LADO do texto em vez de atrás dele.
  // O dono apontou num print. Nenhum teste via, porque todos mediam 390.
  // ============================================================
  sec('25 · quem fala fica colada na caixa, em qualquer largura');
  for (const larg of [390, 680, 1024]) {
    await page.setViewportSize({ width: larg, height: 844 });
    const fa = await page.evaluate(async () => {
      fecharTelas(); S.aberturas = 0; S.cenario = 0;
      mostrarAbertura(function () { }, true);
      await new Promise(r => setTimeout(r, 3900));
      const c = document.getElementById('falaCaixa').getBoundingClientRect();
      const q = document.getElementById('falaRetrato').getBoundingClientRect();
      return { dif: Math.round(q.left - c.left), pernas: q.bottom <= c.bottom + 1,
        atras: +getComputedStyle(document.getElementById('falaRetrato')).zIndex
             < +getComputedStyle(document.getElementById('falaCaixa')).zIndex };
    });
    log('   ' + larg + ' px: retrato a ' + fa.dif + ' px da borda da caixa');
    ok(Math.abs(fa.dif) <= 12, larg + ' px: quem fala nasce colada na caixa (' + fa.dif + ' px)');
    ok(fa.pernas, larg + ' px: e o papel cobre as pernas — ela é cortada na cintura');
    ok(fa.atras, larg + ' px: e ela fica ATRÁS do papel, nunca ao lado dele');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => fecharTelas());

  // ============================================================
  // 26 · NA TRAVESSIA, A LEITURA ENCOSTA NO PÉ DA TELA E NÃO HÁ BOTÃO
  //
  // O botão dourado ficava aceso e inerte durante a travessia, de propósito: a ideia era que
  // quem tocasse nele descobrisse com o dedo que ali não há o que fazer. **O dono leu como
  // defeito** ("o botão não deveria aparecer aqui, né"), e um sinal que precisa de nota de
  // rodapé não é sinal. Saiu — `travessiaViva` já fazia `clicar()` sair na primeira linha, e a
  // segunda fala do trecho diz com todas as letras que o jogo aqui não tem o que você faça.
  //
  // E com ele saiu o recuo que existia para a caixa não ficar atrás dele — que era a outra
  // metade do que ele apontou no mesmo print: a leitura flutuava no meio do quadro.
  // ============================================================
  sec('26 · na travessia a leitura encosta no pé, e não há botão');
  for (const larg of [390, 680]) {
    await page.setViewportSize({ width: larg, height: 844 });
    const tv = await page.evaluate(async () => {
      fecharTelas();
      correrTravessia('pindorama', 'palmares', function () { });
      await new Promise(r => setTimeout(r, 4200));
      const c = document.getElementById('falaCaixa').getBoundingClientRect();
      const ctl = document.getElementById('controls');
      const r = { folga: Math.round(window.innerHeight - c.bottom),
        botao: getComputedStyle(ctl).display !== 'none' };
      fecharTelas();
      return r;
    });
    log('   ' + larg + ' px: a caixa para a ' + tv.folga + ' px do pé | botão visível: ' + tv.botao);
    ok(tv.folga <= 24, larg + ' px: a leitura encosta no pé da tela (' + tv.folga + ' px)');
    ok(!tv.botao, larg + ' px: e não há botão de jogo numa tela em que não há jogo');
  }
  await page.setViewportSize({ width: 390, height: 844 });

  // ============================================================
  // 28 · O MENU É CENÁRIO, NÃO PARTIDA
  //
  // Decisão do dono (2026-08-12): com o menu aberto o mundo roda em LOOP — a personagem anda e
  // a estrada rola, mas nada nasce, nada é contado e nada é perdido. É o tipo de coisa que
  // desencaixa em silêncio absoluto: basta uma função nova entrar do lado errado do portão do
  // laço de quadro e o jogo volta a render atrás do menu sem um erro de console, sem um print
  // diferente e sem ninguém perceber por semanas. Por isso as três metades são cobradas aqui.
  //
  // ⚠ ESTE BLOCO FOI RECONSTRUÍDO em 12/08 pela Direção de Evolução, e a nota fica porque a
  // reconstrução merece revisão de quem o escreveu: duas sessões trabalhavam nesta MESMA
  // árvore, e eu restaurei um backup deste arquivo por cima da versão que já tinha o bloco —
  // o texto abaixo foi remontado a partir da saída do teste e das linhas que eu tinha lido.
  // A INTENÇÃO e as cinco asserções são as originais; a linha de `aberturas`/`fechos` no
  // preparo é minha, e resolve a única coisa que o bloco não tinha: vindo logo depois do 26
  // (a travessia), a ABERTURA do capítulo seguinte reabria sozinha durante os 5 s de espera e
  // a pré-condição "sem tela aberta" reprovava — medido três vezes, sempre igual.
  // ============================================================
  sec('28 · com o menu aberto, o cenário roda e a partida não');
  const loop = await page.evaluate(async () => {
    // O estado importa: com o jogo no fim (que é onde os blocos anteriores o deixam) a CHEGADA
    // se põe na frente sozinha e a rua nunca enche — o teste passaria medindo uma tela aberta
    // atrás da outra. Volta para o meio do capítulo 1, com a rua livre.
    S.cenario = 0; S.fronteira = 0; S.energiaTotal = LIMIAR_CENA * 0.4; S.energia = 300;
    S.u1 = 1; S.u2 = 1; S.u3 = 1;        // a ajuda automática é a renda que não precisa de dedo
    // ...e com toda abertura e todo fecho JÁ LIDOS: o bloco anterior é a travessia, e a
    // abertura do capítulo do outro lado dela sobe sozinha no meio da espera.
    S.aberturas = MASCARA_EPOCAS; S.fechos = MASCARA_EPOCAS; S.marcos = MASCARA_MARCOS;
    redesenharFundo();
    fecharTelas();
    await new Promise(r => setTimeout(r, 5000));   // a rua enche: chegadas, drops, folhas
    // E FECHA DE NOVO ANTES DE MEDIR. Os blocos anteriores deixam gatilhos armados no estado
    // (um deles reabre a fala da travessia sozinho neste intervalo), e uma tela de HISTÓRIA
    // aberta aqui pararia o mundo por OUTRO motivo — o teste passaria medindo o portão errado.
    fecharTelas();
    await new Promise(r => setTimeout(r, 400));
    const antes = { e: S.energiaTotal, x: worldX,
      tela: TELAS.filter(function (t) {
        const n = document.getElementById(t);
        return n && n.classList.contains('aberta');
      }).join(',') || '(nenhuma)',
      mobs: mobs.length, drops: drops.length, folhas: folhas.length };
    abrirTela('telaMenu');
    await new Promise(r => setTimeout(r, 3000));
    const dentro = { e: S.energiaTotal, x: worldX, marcos: S.marcos | 0,
      mobs: mobs.length, drops: drops.length, folhas: folhas.length,
      grupo: grupo.length, moradores: moradores.length, canteiros: canteiros.length,
      marco: marcoAtivo ? 1 : 0 };
    fecharTelas();
    await new Promise(r => setTimeout(r, 120));
    const depois = { e: S.energiaTotal, mobs: mobs.length, drops: drops.length, folhas: folhas.length };
    return { antes, dentro, depois };
  });
  const naRua = loop.dentro.mobs + loop.dentro.drops + loop.dentro.folhas +
    loop.dentro.grupo + loop.dentro.moradores + loop.dentro.canteiros + loop.dentro.marco;
  log('   antes do menu: impacto ' + loop.antes.e.toFixed(1) + ' | ' + loop.antes.mobs + ' chegadas, ' +
    loop.antes.drops + ' itens, ' + loop.antes.folhas + ' folhas | tela aberta: ' + loop.antes.tela);
  log('   com o menu aberto: impacto ' + loop.dentro.e.toFixed(1) + ' | ' + naRua + ' coisas alcançáveis em cena | a rua andou ' +
    (loop.dentro.x - loop.antes.x).toFixed(1) + ' px');
  log('   ao fechar: impacto ' + loop.depois.e.toFixed(1) + ' | ' + loop.depois.mobs + ' chegadas, ' +
    loop.depois.drops + ' itens, ' + loop.depois.folhas + ' folhas');
  ok(loop.antes.tela === '(nenhuma)' && loop.antes.mobs + loop.antes.folhas > 0,
    'a medida vale: a rua estava viva e sem tela aberta antes do menu (tela: ' + loop.antes.tela + ')');
  ok(Math.abs(loop.dentro.e - loop.antes.e) < 0.01,
    'nada é contado atrás do menu (Δ impacto ' + (loop.dentro.e - loop.antes.e).toFixed(2) + ')');
  ok(naRua === 0, 'nada alcançável fica em cena atrás do menu (' + naRua + ' coisas)');
  ok(loop.dentro.x - loop.antes.x > 30,
    'o cenário continua rodando: a rua andou ' + (loop.dentro.x - loop.antes.x).toFixed(1) + ' px em 3 s');
  // NADA FOI PERDIDO — e "perdido" é para MENOS, nunca para mais: ao fechar o menu a partida
  // recomeça, e a ajuda automática (`u3`, ligada no preparo) rende nos 120 ms de espera. A
  // primeira versão desta linha exigia impacto IDÊNTICO e reprovava conforme o tique caísse
  // dentro ou fora da janela — medido, +3 numa execução e 0 na seguinte.
  ok(loop.depois.e >= loop.antes.e - 0.01
     && loop.depois.mobs + loop.depois.drops + loop.depois.folhas > 0,
    'ao fechar, a partida volta inteira — nada foi perdido no caminho ('
      + loop.antes.e.toFixed(1) + ' -> ' + loop.depois.e.toFixed(1) + ', '
      + (loop.depois.mobs + loop.depois.drops + loop.depois.folhas) + ' coisas de volta)');

  // ============================================================
  // 29 · NENHUMA TÁBUA REPETIDA NO POSTE, E NENHUMA SEM TINTA
  //
  // Isto existe por um defeito REAL, que o dono viu antes de qualquer teste: "o menu tá com um
  // segundo DE ONDE VEM estranho". Estava — o print `test/LG-antes-menu-zero.png` guarda a
  // cena: duas tábuas DE ONDE VEM, a segunda em Arial Black. O commit do glossário v2 duplicou
  // a linha do molde, e o modo de falha é o pior que existe: **id repetido não dá erro**. O
  // navegador aceita, `pixelRotulo` pinta o PRIMEIRO nó com aquele id e o segundo fica com o
  // texto cru do molde — nenhum erro de console, nenhuma tela quebrada, nenhuma asserção
  // vermelha. Só apareceu porque alguém olhou.
  //
  // As três asserções são as três metades do defeito: id repetido, rótulo repetido, e tábua
  // sem bitmap (que é o que denuncia a tinta do sistema). `dataset.px` é a chave que o
  // `pixelRotulo` deixa gravada no elemento — é dela que sai o rótulo de cada tábua.
  // ============================================================
  sec('29 · o poste não tem tábua repetida nem tábua sem tinta');
  const poste = await page.evaluate(() => {
    fecharTelas(); abrirTela('telaMenu');
    const tabuas = Array.from(document.querySelectorAll('#poste .telaBtn')).map(function (b) {
      return { id: b.id, px: b.dataset.px ? String(b.dataset.px).split('|')[0] : null,
        cru: (b.textContent || '').trim(), canvas: !!b.querySelector('canvas'),
        oculta: b.classList.contains('oculto') };
    });
    const ids = {}, repetidos = [];
    document.querySelectorAll('[id]').forEach(function (e) {
      if (ids[e.id]) repetidos.push(e.id); else ids[e.id] = 1;
    });
    return { tabuas: tabuas, repetidos: repetidos };
  });
  log('   tábuas: ' + poste.tabuas.map(t => t.px + (t.oculta ? '(oculta)' : '')).join(' · '));
  const semTinta = poste.tabuas.filter(t => !t.px || !t.canvas);
  const rotulos = poste.tabuas.map(t => t.px);
  const repetidoRot = rotulos.filter((r, i) => rotulos.indexOf(r) !== i);
  ok(poste.repetidos.length === 0, 'nenhum id repetido no documento (' +
    (poste.repetidos.join(', ') || 'nenhum') + ')');
  ok(repetidoRot.length === 0, 'nenhuma tábua do poste repete o rótulo de outra (' +
    (repetidoRot.join(', ') || 'nenhuma') + ')');
  ok(semTinta.length === 0, 'toda tábua do poste tem rótulo em bitmap, nenhuma caiu na fonte do sistema (' +
    (semTinta.map(t => t.id + ': "' + t.cru + '"').join(', ') || 'nenhuma') + ')');

  sec('30 · o menu fecha em TODA altura, e não só nas três que alguém já olhou');
  // O DEFEITO QUE ESTE BLOCO EXISTE PARA NÃO TER DE NOVO (14/08). O menu tinha um degrau só,
  // `max-height: 600px`, e entre 601 e 811 px de altura não havia desenho nenhum: a versão
  // inteira precisa de 744 px, a apertada cabe em 568, e as duas estavam separadas por 1 px de
  // consulta. Em 390×601 a última tábua caía 87 px ABAIXO da borda e o menu rolava 143 px.
  //
  // Por que ninguém tinha visto, e é a parte que importa: as três telas que o repositório
  // media — 390×844, 844×390 e 320×568 — passam todas POR FORA da faixa quebrada. Testar os
  // aparelhos que se tem à mão não cobre a TRAVESSIA entre eles, e é na travessia que um
  // @media mal posto aparece. As alturas abaixo são justamente as que ninguém olhava, mais os
  // dois degraus antigos (600/601) para o salto não poder voltar sem o teste ficar vermelho.
  for (const h of [568, 600, 601, 640, 700, 720, 812, 932]) {
    await page.setViewportSize({ width: 390, height: h });
    await abrirMenuParado(page);
    const m = await page.evaluate(() => {
      const H = document.documentElement.clientHeight;
      const tela = document.getElementById('telaMenu');
      const t = [];
      document.querySelectorAll('#poste .telaBtn').forEach(function (b) {
        if (getComputedStyle(b).display === 'none') return;
        const c = b.getBoundingClientRect();
        t.push({ id: b.id, pe: Math.round(c.bottom), alt: Math.round(c.height), fora: c.bottom > H + 1 || c.top < -1 });
      });
      return { n: t.length, fora: t.filter(x => x.fora), baixa: t.filter(x => x.alt < 44),
        menorAlt: t.length ? Math.min.apply(null, t.map(x => x.alt)) : 0,
        maiorAlt: t.length ? Math.max.apply(null, t.map(x => x.alt)) : 0,
        // QUEM OCUPA A ALTURA, para a falha explicar a si mesma. Sem isto, "rola 2 px" manda
        // alguém procurar os dois pixels no arquivo inteiro — e foi o que aconteceu comigo.
        pilha: [...tela.children].map(function (e) {
          const r = e.getBoundingClientRect(); return e.id + ' ' + Math.round(r.height);
        }).join(' + '),
        rolagem: tela ? Math.max(0, tela.scrollHeight - tela.clientHeight) : 0 };
    });
    log('   390×' + h + ': ' + m.n + ' tábuas · ' + m.menorAlt + '–' + m.maiorAlt + 'px · rolagem ' +
      m.rolagem + 'px' + (m.rolagem ? '  [' + m.pilha + ']' : ''));
    ok(!m.fora.length, '390×' + h + ': nenhuma tábua fora da tela' +
      (m.fora.length ? ' — ' + m.fora.map(x => x.id + ' com o pé em ' + x.pe).join(', ') : ''));
    // A rolagem do menu continua DECLARADA de propósito, para o dia em que uma tábua nova não
    // couber. O que não pode é ela aparecer com todas as tábuas dentro da tela: isso não é
    // rolagem, é composição estourando por baixo — foi assim que o mastro escondeu 457 px em
    // 12/08 e assim que a faixa morta se anunciou em 14/08.
    //
    // A FOLGA É DE 4 px E FOI MEDIDA, não afrouxada — e a medição é a parte que importa.
    // Perseguindo "3 px de rolagem" em 390×568 eu economizei 10 px de respiro e o número caiu
    // 1, que é a assinatura de um defeito que não existe. A pilha ali soma sempre o mesmo, em
    // três execuções seguidas: `logoImg 120 + menuSub 25 + poste 366` = 511, mais 4 px de topo
    // = **515 numa tela de 568**. São 53 px de FOLGA, e mesmo assim o `scrollHeight` sobe 2 a
    // 3 px — `deviceScaleFactor: 2` com `gap: 4,0028px` fracionário e uma margem `auto` de
    // flex arredondam para cima. Régua mais fina que o instrumento é cara ou coroa, que é a
    // mesma lição do teto de poluição (0,3 → 0,8 em 12/08). E 4 px não escondem defeito: a
    // faixa morta que este bloco existe para pegar valia 143.
    ok(m.rolagem <= 4, '390×' + h + ': o menu não rola com todas as tábuas dentro (' + m.rolagem +
      'px, folga de 4 para arredondamento de subpixel)');
    ok(!m.baixa.length, '390×' + h + ': nenhuma tábua abaixo dos 44 px de dedo' +
      (m.baixa.length ? ' — ' + m.baixa.map(x => x.id + ' ' + x.alt).join(', ') : ''));
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { fecharTelas(); });
  await hudNoLugar(page);                                    // era waitForTimeout(400)

  sec('31 · arte recusada que foi refeita não pode esperar em silêncio');
  // O DEFEITO QUE ISTO EXISTE PARA NÃO TER DE NOVO (14/08). Seis artes recusadas por §2 foram
  // refeitas pelo dono em 10/08 e **ficaram quatro dias paradas sem ninguém saber**. A regra que
  // levanta uma recusa quando os bytes do arquivo mudam funciona exatamente como projetada — o
  // problema é que ela levanta em SILÊNCIO: a peça troca de coluna numa página que só existe
  // enquanto alguém roda `npm run mesa`. Não havia aviso, não havia teste, não havia nada.
  // Enquanto isso ele continuava gerando, e uma delas era a pintura que consertava a única
  // dívida de luz que o jogo tinha.
  // Agora "ninguém olhou" é teste vermelho. É a única asserção deste arquivo que não olha o
  // jogo — olha a fila —, e ela mora aqui porque é aqui que se cobra o que desencaixa calado.
  {
    const fsN = require('fs');
    const pathN = require('path');
    const raiz = pathN.resolve(__dirname, '..');
    const lerJ = (n) => { try { return JSON.parse(fsN.readFileSync(pathN.join(raiz, 'ferramentas', n), 'utf8')); } catch (e) { return null; } };
    const recJ = lerJ('recusadas.json');
    if (!recJ) {
      log('   (recusadas.json não encontrado — nada a cobrar)');
    } else {
      const ressuscitadas = [];
      (recJ.itens || []).forEach(function (r) {
        if (typeof r.bytes !== 'number') return;      // recusa antiga, sem impressão digital
        const arq = pathN.join(raiz, 'assets', 'entrada', r.n + '.png');
        if (!fsN.existsSync(arq)) return;             // nunca foi entregue: continua com o dono
        const agora = fsN.statSync(arq).size;
        if (agora !== r.bytes) ressuscitadas.push(r.n + ' (' + r.bytes + ' → ' + agora + ' bytes)');
      });
      log('   recusas ativas: ' + ((recJ.itens || []).length || 0) +
        ' · refeitas e ainda não revistas: ' + ressuscitadas.length);
      ok(ressuscitadas.length === 0,
        'nenhuma peça recusada foi refeita sem alguém olhar' +
        (ressuscitadas.length ? ' — ESPERANDO REVISÃO: ' + ressuscitadas.join(', ') +
          '. Olhe a arte e resolva a recusa (aprovar e embutir, ou recusar de novo com o motivo novo).' : ''));
    }
  }

  // ============================================================
  // 32 · O CENSO DOS VERBOS
  //
  // O GAP QUE ISTO FECHA (18/08). O bloco 5 confere se o TEXTO e o MOTOR concordam — mas só
  // sobre dois capítulos, porque foi escrito quando havia dois verbos. Hoje há doze, e nada
  // olhava o conjunto. Um capítulo podia sair da `CAPS_VERBO` num refactor e ninguém saberia:
  // o smoke continuaria verde, porque cada asserção dele testa o capítulo em que por acaso está.
  //
  // E há uma consequência pior que perder um verbo, e é a dívida do §2 voltando pela porta dos
  // fundos: rua COM GENTE e SEM VERBO é gente que a mão só alcança batendo. Foi exatamente o
  // que eu introduzi em 15/08 em cinco capítulos, e foi o smoke que pegou, não eu. Aquilo foi
  // sorte. Isto é teste.
  //
  // A lista de exceção é nominal de propósito: acrescentar capítulo sem verbo passa a exigir
  // escrever o id aqui, o que é uma decisão visível no diff — e não um silêncio.
  // ============================================================
  sec('32 · o censo dos verbos: nenhum capítulo perde o seu em silêncio');
  {
    // AINDA AQUI é o único sem verbo aprovado, e é decisão do dono (§2): o capítulo do presente
    // fala de povos que estão aqui AGORA, e que gesto a mão faz ali não é coisa que eu invente.
    const SEM_VERBO_APROVADO = ['hoje'];

    const censo = await page.evaluate(() => {
      const fila = (typeof CAP_FILA !== 'undefined') ? CAP_FILA : null;
      const verbo = (typeof CAPS_VERBO !== 'undefined') ? CAPS_VERBO : null;
      const gente = (typeof GENTE_EP_B64 !== 'undefined') ? GENTE_EP_B64 : null;
      return {
        achouListas: !!(fila && verbo),
        achouGente: !!gente,
        caps: EPOCAS.map(function (e, i) {
          // `desenha` pergunta ao PORTÃO, não ao inventário: é `pessoaNaRua()` que decide se a
          // folha de gente chega ao quadro. Uma folha guardada e dormente não é dívida nenhuma —
          // dívida é gente DESENHADA numa rua onde a mão só alcança batendo.
          const guardado = S.cenario;
          S.cenario = cenarioDaEpoca(i);
          const desenha = pessoaNaRua();
          S.cenario = guardado;
          return {
            id: e.id,
            nome: e.nome,
            temVerbo: !!(fila && verbo) && (fila.indexOf(i) >= 0 || verbo.indexOf(i) >= 0),
            temGente: !!(gente && gente[e.id]),
            desenha: desenha
          };
        })
      };
    });

    ok(censo.achouListas, 'as listas de verbo (CAP_FILA / CAPS_VERBO) são alcançáveis — sem elas o censo passaria vazio');
    ok(censo.achouGente, 'o mapa de gente (GENTE_EP_B64) é alcançável');

    const semVerbo = censo.caps.filter(c => !c.temVerbo);
    const comGente = censo.caps.filter(c => c.temGente);
    log('   capítulos: ' + censo.caps.length + ' · com verbo: ' + (censo.caps.length - semVerbo.length) +
      ' · com gente na rua: ' + comGente.length);
    censo.caps.forEach(function (c) {
      log('     ' + c.nome.padEnd(24) + ' verbo ' + (c.temVerbo ? 'sim' : 'NÃO') + ' · folha ' + (c.temGente ? 'sim' : 'não') + ' · desenha ' + (c.desenha ? 'sim' : 'não'));
    });

    // (a) quem não tem verbo tem de estar na lista, pelo nome
    const surpresas = semVerbo.filter(c => SEM_VERBO_APROVADO.indexOf(c.id) < 0).map(c => c.nome + ' (' + c.id + ')');
    ok(surpresas.length === 0,
      'todo capítulo sem verbo está declarado na exceção' +
      (surpresas.length ? ' — PERDEU O VERBO EM SILÊNCIO: ' + surpresas.join(', ') : ''));

    // (b) a lista de exceção encolhe quando o dono decide: id que ganhou verbo não fica nela
    const obsoletos = SEM_VERBO_APROVADO.filter(id => {
      const c = censo.caps.find(x => x.id === id);
      return c && c.temVerbo;
    });
    ok(obsoletos.length === 0,
      'a lista de exceção não guarda capítulo que já tem verbo' +
      (obsoletos.length ? ' — TIRE DAQUI: ' + obsoletos.join(', ') : ''));

    // (c) §2, a asserção que mais importa deste arquivo: rua que DESENHA gente é rua com verbo.
    // Repare que ela olha `desenha`, e não `temGente` — a primeira versão deste bloco reprovou
    // AINDA AQUI, que tem folha pronta e portão fechado, e reprovar isso seria cobrar o inverso
    // do certo: guardar a arte à espera da decisão do dono é o comportamento correto.
    const dividaDoDois = censo.caps.filter(c => c.desenha && !c.temVerbo).map(c => c.nome);
    ok(dividaDoDois.length === 0,
      'nenhuma rua DESENHA gente sem ter verbo (§2.2 — pessoa não se alcança por dano)' +
      (dividaDoDois.length ? ' — VIOLAÇÃO: ' + dividaDoDois.join(', ') : ''));

    // (d) e o outro lado da mesma moeda: capítulo COM verbo tem de abrir o portão. Se um verbo
    // for acrescentado à lista mas `pessoaNaRua()` não o reconhecer, a rua fica vazia em
    // silêncio — que é o defeito de `fracAlcance` anotado logo acima dela, na outra direção.
    const portaoFechado = censo.caps.filter(c => c.temVerbo && !c.desenha).map(c => c.nome);
    ok(portaoFechado.length === 0,
      'todo capítulo com verbo abre o portão de pessoaNaRua()' +
      (portaoFechado.length ? ' — VERBO SEM PORTÃO: ' + portaoFechado.join(', ') : ''));

    const dormentes = censo.caps.filter(c => c.temGente && !c.desenha).map(c => c.nome);
    if (dormentes.length) log('   folha pronta e portão fechado (esperando decisão): ' + dormentes.join(', '));

    // (e) A CATRACA. Ha um terceiro estado, e o print do dia 18/08 mostrou o quanto ele e feio:
    // capitulo com verbo VIVO e folha de gente NAO ENTREGUE. O jogo abre o portao, nao acha a
    // folha, e recai na arte generica de objeto -- entao O QUE TEM FONTE promete CONFERIR A
    // FONTE de quem voce cruza e quem cruza e um TOCO DE ARVORE com o anel de aproximacao em
    // volta. E exatamente a versao "objetos boiando" que a campanha de gente inteira existiu
    // para consertar, embarcada no capitulo mais novo.
    //
    // Isto NAO reprova, e a razao importa: a arte esta pedida ha dias e depende do dono, e
    // deixar a main vermelha por trabalho de outra pessoa e transformar o portao de qualidade
    // em ruido que se aprende a ignorar. Mas nao pode CRESCER: escrever o proximo capitulo e
    // solta-lo sem gente vira teste vermelho, porque exige acrescentar um nome aqui.
    // VAZIA desde 18/08, e e assim que ela deve ficar: gente-temfonte chegou no mesmo dia em
    // que a catraca foi escrita, e foi a propria catraca que mandou tirar o nome daqui. De
    // agora em diante, capitulo com verbo e sem folha e vermelho na hora.
    const SEM_FOLHA_ACEITO = [];
    const semFolhaNoAr = censo.caps.filter(c => c.desenha && !c.temGente);
    if (semFolhaNoAr.length) {
      log('   ⚠ verbo no ar SEM folha de gente (a rua mostra objeto): ' +
        semFolhaNoAr.map(c => c.nome).join(', '));
    }
    const novosSemFolha = semFolhaNoAr.filter(c => SEM_FOLHA_ACEITO.indexOf(c.id) < 0).map(c => c.nome + ' (' + c.id + ')');
    ok(novosSemFolha.length === 0,
      'nenhum capítulo NOVO abriu o verbo antes de ter a folha de gente' +
      (novosSemFolha.length ? ' — SOLTOU SEM GENTE: ' + novosSemFolha.join(', ') +
        '. Ou entregue a folha, ou mantenha o portão fechado até ela chegar.' : ''));
    const jaTemFolha = SEM_FOLHA_ACEITO.filter(id => {
      const c = censo.caps.find(x => x.id === id);
      return c && c.temGente;
    });
    ok(jaTemFolha.length === 0,
      'a catraca não guarda capítulo cuja folha já chegou' +
      (jaTemFolha.length ? ' — TIRE DAQUI: ' + jaTemFolha.join(', ') : ''));
  }

  // ============================================================
  // 33 · A VOLTA NO DIA 2 — a tela que a pergunta de tres dias inteira atravessa
  //
  // O GAP (18/08). "O jogo segura alguem por tres dias?" e a pergunta do repositorio, e a
  // unica tela que existe para responde-la -- o papel ENQUANTO VOCE ESTEVE FORA -- nao tinha
  // uma assercao sequer. Ela abre uma vez por dia, no primeiro segundo da sessao, e e a
  // primeira coisa que a pessoa ve e pode tocar ao voltar. Se ela quebrar, quebra calada e o
  // sintoma e o unico que este projeto nao pode medir: alguem nao volta.
  //
  // E ela ja estava errada. Ver a assercao (c).
  // ============================================================
  sec('33 · a volta no dia 2: o papel abre, diz a verdade, e traz historia com fonte');
  {
    const volta = await page.evaluate(() => {
      const ler = () => [...document.querySelectorAll('#retLista .retLinha')].map(d => d.textContent);
      const limpar = () => { document.getElementById('retLista').textContent = ''; };
      const fechar = () => { const e = document.getElementById('retorno'); if (e) e.classList.remove('aberto'); };
      const r = {};

      // (a) ausencia curta nao faz cerimonia
      limpar(); fechar(); mostrarRetorno(30);
      r.curta = document.getElementById('retorno').classList.contains('aberto');

      // (b) o dia 2 de quem so jogou o capitulo 1 -- que e TODO MUNDO no dia 2
      S.acolhidos = S.acolhidos.map(() => 0);
      S.acolhidos[CAP_FILA[0]] = 5;
      S.grupo = 5; S.fronteira = 0; R.dias = 2;
      limpar(); fechar(); mostrarRetorno(12 * 3600);
      r.abriu = document.getElementById('retorno').classList.contains('aberto');
      r.novato = ler();
      const nota = document.querySelector('#retLista .retNota');
      r.temNota = !!nota;
      r.notaTemFonte = !!(nota && /fonte:/i.test(nota.textContent || ''));

      // (c) a mesma gente, agora na vaga da obra
      S.acolhidos = S.acolhidos.map(() => 0);
      S.acolhidos[CAP_GENTE] = 5;
      S.fronteira = CAP_GENTE;
      limpar(); fechar(); mostrarRetorno(12 * 3600);
      r.naObra = ler();

      // (d) quantas notas existem no pior caso -- fronteira zero
      r.notasNaFronteiraZero = LINHA_TEMPO.filter(n =>
        n.tipo === 'momento' && ((n.cena || 0) | 0) <= 0 && !!n.t && !!n.d && !!n.f).length;
      return r;
    });

    const moram = (linhas) => linhas.some(l => /vive[m]? no lugar/i.test(l));
    log('   dia 2 de quem so jogou o cap. 1:');
    volta.novato.forEach(l => log('     · ' + l));
    log('   a mesma gente na vaga da obra:');
    volta.naObra.forEach(l => log('     · ' + l));
    log('   notas de historia disponiveis na fronteira 0: ' + volta.notasNaFronteiraZero);

    ok(!volta.curta, 'ausência de 30 s não abre o papel da volta — voltar do bolso não é voltar');
    ok(volta.abriu, 'ausência de 12 h abre o papel da volta');
    ok(volta.temNota, 'quem volta no dia 2 recebe uma nota de história');
    ok(volta.notaTemFonte, 'a nota da volta traz a fonte junto (§2: onde há fonte, ela aparece)');
    ok(volta.notasNaFronteiraZero > 0,
      'há nota disponível já na fronteira 0 — senão quem volta no dia 2 sem ter avançado não recebe nada');

    // (c) O DEFEITO QUE ISTO PEGOU, e ele estava no ar (18/08). A linha "N pessoas acolhidas
    // vivem no lugar que voces abriram" somava TODAS as vagas de `S.acolhidos` -- era o unico
    // leitor do jogo que somava, contra seis que usam `[CAP_GENTE]`. Consequencia: quem jogou
    // so PINDORAMA lia que gente acolhida em 1500 vivia na roca do quilombo, que e exatamente
    // a conflacao que a linha 1061 do jogo.ts proibe por escrito ("faria a roca do quilombo
    // crescer com gente de Santos de 1888"). O codigo recusava fazer isso na economia e o
    // texto fazia na tela. De quebra, contradizia a linha seguinte: dizia que cinco pessoas
    // moravam ali e, logo abaixo, que a estrada tinha esperado.
    ok(!moram(volta.novato),
      'acolhida em outro capítulo NÃO é dita morando no lugar do mutirão (§2 — não se mistura povo e século)');
    ok(moram(volta.naObra),
      'acolhida na vaga da obra É dita morando lá — o conserto não pode ter apagado a linha');
  }

  sec('ERROS DE CONSOLE');
  log(erros.length ? erros.join('\n') : '(nenhum)');
  if (erros.length) falhas++;

  await browser.close();
  console.log('\n' + (falhas ? 'FALHOU em ' + falhas + ' asserção(ões)' : 'PASSOU'));
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error('EXPLODIU:', e); process.exit(1); });
