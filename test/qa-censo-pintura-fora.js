// A CATRACA DA PINTURA FORA DO CENSO — o que `decorativoInerte` ABSOLVE tem de pintar ZERO PIXEL
//
//   node test/qa-censo-pintura-fora.js
//
// POR QUE ESTE ARQUIVO EXISTE, e a frase que o pediu (03/09). O `ferramentas/cartao-censo.js`
// absolve um elemento por três coisas ao mesmo tempo:
//
//     decorativoInerte = aria-hidden="true"  E  innerText vazio  E  !pinta()
//
// A terceira é uma ENUMERAÇÃO de mecanismos de CSS, e ela está do lado que REPROVA: para o
// mecanismo que ninguém escreveu, `pinta()` devolve falso, `!pinta()` vira verdade, e o elemento é
// ABSOLVIDO — em silêncio, com o portão verde e a tinta no cartão publicado. A entrega de 03/09
// declarou um teto de mecanismos e a justificativa dele estava ERRADA (dizia que esquecer viraria
// "reprovação barulhenta"); o teto declarado também estava errado, **por dois** — `list-style-image`
// e `content:url()` não estavam nele. A frase caiu no mesmo dia. **O buraco não.**
//
// A DOENÇA É A MESMA DO CABEÇALHO DO `cartao-censo.js`: lista finita contra universo infinito. Lá
// a cura foi virar a lista de lado (default-deny). Aqui não dá para virar: não existe "default-deny
// de pintura" que uma função rodando DENTRO da página possa perguntar — `censoDoQuadro` roda no
// `pg.evaluate` e não tem câmera. Então a cura é outra, e é o que este arquivo faz:
//
//   **UM ORÁCULO DE PIXEL, e uma CATRACA em cima dele.** O oráculo tem câmera (Playwright), então
//   ele não precisa de lista nenhuma para responder "isto pintou?". A catraca compara a resposta
//   do oráculo com a resposta do censo, mecanismo a mecanismo, e REPROVA toda divergência que não
//   esteja registrada aqui com o número que ela mediu. Verde deixa de significar "não há buraco" e
//   passa a significar, cobrado por exit code: **"o conjunto de fugas é exatamente o registrado"**.
//   Acrescentar mecanismo ao catálogo não pede mudança nenhuma no corpo do teste; se ele fugir, a
//   catraca fica vermelha sozinha e diz o nome dele.
//
// O ORÁCULO, e por que ele é `visibility:hidden` e não uma segunda carga da página.
// A primeira versão desta sonda comparava DUAS CARGAS (uma com o mutante, outra sem) e mediu
// `zoom:2` como fuga de **49.737 px**. Não era: `zoom:2` dobra a caixa, EMPURRA o resto da
// `.lista`, e o diff contava o deslocamento dos vizinhos como tinta do mutante. Isso é ruído de
// instrumento com cara de achado — e o `span.vaoMedida` real EXISTE para ocupar espaço, então
// "deslocou" nunca poderia ser o critério.
// O oráculo certo é `visibility:hidden` no PRÓPRIO mutante, na MESMA carga: o leiaute não muda um
// pixel e toda a pintura dele (inclusive `::before`, `::after`, `::marker` e a alça de `resize`)
// desaparece. O diff passa a ser, por construção, exatamente os pixels que aquele elemento pinta.
// Medido depois da troca: `zoom:2` = **0 px**, que é a resposta certa.
//
// O PISO DE RUÍDO, e ele é cobrado por exit code em CADA medição.
// O mapa do TERRITÓRIO anima sozinho. Comparar o quadro INTEIRO de 1200x630 dá diferença sem
// mutante nenhum — medido nesta máquina em duas execuções: **194 px** e **1028 px**, e 1028 px
// acusaria dezenas de fugas falsas. O recorte na caixa do mutante mais 48 px de folga zera o piso,
// e o zero é COBRADO, não confiado: antes de trocar qualquer coisa, o teste tira DUAS fotos
// idênticas do mesmo recorte e exige diferença zero. Instrumento que não cobra o próprio piso
// mede ruído e chama de achado — foi o que quase aconteceu duas vezes aqui.
//
// ELA JÁ FOI VISTA MORDENDO, das duas maneiras (EQUIPE.md 2.8 — instrumento que ninguém viu
// reprovando é decoração), e as duas com exit code REAL:
//
//   1) EM MECANISMO QUE NINGUÉM TINHA ESCRITO — nem na régua, nem neste catálogo, nem no
//      registro. Na primeira vez em que a catraca rodou contra a régua já corrigida:
//        CATRACA_EXTRA_NOME=pseudoItemDeLista \
//        CATRACA_EXTRA_ESTILO='.qaFuga::before{content:"";display:list-item;list-style-type:disc}' \
//        node test/qa-censo-pintura-fora.js        →  exit 1
//        "FUGA pseudoItemDeLista 25 px censo=ABSOLVE"
//      Era um buraco de verdade: o pseudo-elemento virando item de lista ganha um `::marker`
//      PRÓPRIO, uma camada abaixo do que a régua olhava. Foi fechado no mesmo commit, entrou no
//      catálogo pelo nome, e hoje o mesmo comando devolve exit 0 com ele marcado FECHADO — que é
//      o contraponto, e é o que impede a asserção de virar "reprova tudo".
//
//   2) EM RÉGUA CEGADA DE PROPÓSITO — a mordida que continua reproduzível depois de o buraco
//      fechar, porque não depende de existir uma fuga nova:
//        CATRACA_CEGA="s.backdropFilter !== 'none'" node test/qa-censo-pintura-fora.js  →  exit 1
//        "FUGA backdropFilter 5700 px" + "FUGA pseudoBackdrop 3600 px"
//      Ela troca aquele pedaço por `false` na função que o Playwright serializa. Sem o env, exit 0.
//
// O QUE ESTE ARQUIVO NÃO RESOLVE, dito em vez de escondido. O catálogo continua sendo uma lista,
// e mecanismo que não está nele não é medido. A diferença em relação ao teto de ontem é de
// NATUREZA, não de tamanho: a lista de ontem estava dentro da régua e absolvia em silêncio o que
// não conhecia; esta está dentro do TESTE e, para tudo o que conhece, a resposta vem da CÂMERA.
// Acrescentar um nome aqui custa uma linha e nenhum raciocínio — e a linha vermelha aparece
// sozinha se a régua não o cobrir.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');
const CENSO = require('../ferramentas/cartao-censo.js');

const RAIZ = path.resolve(__dirname, '..');
const L = CENSO.L, A = CENSO.A;
const ARQ = path.join(RAIZ, 'territorio', 'index.html');
let falhas = 0;
function ok(cond, msg) { console.log((cond ? '  ok  ' : '  X   ') + msg); if (!cond) falhas++; return !!cond; }

// Uma imagem de 40x40 vermelha, em `data:` — nenhuma referência externa, nem aqui.
const SVG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22'
  + ' height=%2240%22%3E%3Crect width=%2240%22 height=%2240%22 fill=%22%23ff0000%22/%3E%3C/svg%3E';

// ------------------------------------------------------------------------------------ O CATÁLOGO
// Cada entrada é UM jeito de um `<span aria-hidden="true">` SEM TEXTO aparecer (ou não) na foto.
// Ninguém aqui é "esperado pintar" ou "esperado não pintar": quem responde é a câmera. O que o
// catálogo faz é dizer O QUE MEDIR — e é por isso que os que pintam zero ficam, em vez de serem
// apagados por serem "chatos": eles são a prova de que a régua não virou "reprova tudo".
const CATALOGO = {
  // os seis já fechados em 03/09 — ficam para a catraca ver se algum reabre num refactor
  border: { css: 'border:4px solid red' },
  backgroundColor: { css: 'background-color:#ff00ff' },
  backgroundAtalho: { css: 'background:#00ff00' },
  outline: { css: 'outline:4px solid #00ffff' },
  outlineComRecuo: { css: 'outline:3px solid #00ffff;outline-offset:9px' },
  boxShadow: { css: 'box-shadow:0 0 0 6px #ffcc00' },
  pseudoAfter: { estilo: '.qaFuga::after{content:"";display:block;width:150px;height:38px;background:#ff3300}' },
  pseudoBefore: { estilo: '.qaFuga::before{content:"";display:block;width:150px;height:38px;background:#33ff00}' },
  pseudoTexto: { estilo: '.qaFuga::after{content:"MEDIÇÃO";color:#fff;background:#333}' },

  // as CINCO fugas medidas pelo QA em 03/09 e fechadas nesta entrega
  backdropFilter: { css: 'backdrop-filter:invert(1)' },
  borderImage: { css: 'border-image:linear-gradient(#f00,#00f) 30 / 10px' },
  marcadorDisco: { css: 'display:list-item;list-style-type:disc;color:#ff0000;margin-left:20px' },
  listStyleImage: { css: 'display:list-item;list-style-image:url("' + SVG + '");margin-left:44px' },
  contentUrl: { css: 'content:url("' + SVG + '")' },

  // as VARIANTES que a forma ingênua de cada conserto deixaria passar — cada uma achada por pixel
  contentGradiente: { css: 'content:linear-gradient(#f00,#00f)' },
  contentImageSet: { css: 'content:image-set(url("' + SVG + '") 1x)' },
  marcadorTipoTexto: { css: 'display:list-item;list-style-type:"AB";color:#f00;margin-left:30px' },
  marcadorPseudoContent: { css: 'display:list-item;margin-left:30px', estilo: '.qaFuga::marker{content:"XX";color:#ff0000}' },
  pseudoBackdrop: { estilo: '.qaFuga::after{content:"";display:block;width:120px;height:30px;backdrop-filter:blur(6px) invert(1)}' },
  pseudoBorderImage: { estilo: '.qaFuga::after{content:"";display:block;width:100px;height:30px;border-image:linear-gradient(#0f0,#00f) 30 / 8px}' },
  // A SÉTIMA, achada PELA CATRACA deste arquivo depois de as seis primeiras estarem fechadas: o
  // pseudo-elemento vira item de lista e ganha um `::marker` próprio. 25 px, censo absolvia.
  pseudoItemDeLista: { estilo: '.qaFuga::before{content:"";display:list-item;list-style-type:disc;color:#f00;margin-left:20px}' },
  pseudoItemDeListaImagem: { estilo: '.qaFuga::after{content:"";display:list-item;list-style-image:url("' + SVG + '");margin-left:44px}' },

  // A SEXTA, que não estava em teto nenhum — nem no declarado, nem no que o corrigiu.
  agarraAuto: { css: 'resize:both;overflow:auto' },
  agarraHidden: { css: 'resize:both;overflow:hidden' },
  agarraVertical: { css: 'resize:vertical;overflow:auto' },

  // O LADO QUE ABSOLVE — medido, não confiado. Se algum destes virar RECUSA, o conserto trocou o
  // falso-negativo por um falso-positivo do mesmo tamanho, e a catraca diz qual.
  nada: {},
  contentTexto: { css: 'content:"XXXX";color:#f00' },
  marcadorSemTipo: { css: 'display:list-item;list-style-type:none' },
  marcadorContentVazio: { css: 'display:list-item;list-style-type:none;margin-left:30px', estilo: '.qaFuga::marker{content:"";background:#f00}' },
  agarraSemOverflow: { css: 'resize:both' },
  borderImageSemLargura: { css: 'border:0 solid transparent;border-image:linear-gradient(#0f0,#f0f) 30 / 0 / 14px' },
  zoom: { css: 'zoom:2' },
  filtroDropShadow: { css: 'filter:drop-shadow(0 0 8px #f00)' },
  filtroInverte: { css: 'filter:sepia(1) invert(1)' },
  mascara: { css: 'mask:linear-gradient(#000,#000)' },
  clipPath: { css: 'clip-path:circle(40%)' },
  primeiraLinha: { estilo: '.qaFuga::first-line{background:#f00}' },
  barraDeRolagem: { css: 'overflow:scroll', estilo: '.qaFuga::-webkit-scrollbar{width:12px;background:#ff0000}' },
  regraDeColuna: { css: 'column-count:2;column-rule:6px solid #f0f' },
  cursorUrl: { css: 'cursor:url("' + SVG + '"),auto' },
  caretColor: { css: 'caret-color:#f00' },
  textShadow: { css: 'text-shadow:0 0 9px #f00' },
  boxReflect: { css: '-webkit-box-reflect:below 2px linear-gradient(transparent,#f00)' },
  aparencia: { css: '-webkit-appearance:menulist;appearance:auto' },
  misturaBlend: { css: 'mix-blend-mode:difference;isolation:isolate' },
  fundoClipTexto: { css: 'background:linear-gradient(#f00,#00f);-webkit-background-clip:text;color:transparent' },
};

// ------------------------------------------------------------------------------------- A CATRACA
// Os dois registros abaixo SÃO a catraca. Vazio no primeiro é o estado desta entrega; qualquer
// coisa que apareça e não esteja escrita aqui deixa o exit code vermelho, com o nome e o número.
//
// FUGA = a câmera vê tinta E o censo absolve. É o buraco. Depois desta entrega o conjunto é VAZIO,
// e é isso que a catraca prega: a próxima fuga tem de ser DECIDIDA por alguém (escrevendo o nome
// aqui, com o número que ela mede) em vez de aparecer sozinha no cartão publicado.
const FUGAS_REGISTRADAS = {};

// FALSO-POSITIVO = a câmera não vê tinta E o censo recusa. Não é buraco de segurança — é a régua
// sendo mais paranoica que o navegador —, mas é dívida, porque régua que reprova o certo é a
// primeira que alguém afrouxa inteira (cabeçalho do `cartao-censo.js`). Cada um fica registrado
// com o motivo e com o número medido, e a catraca impede que a lista CRESÇA sem alguém decidir.
const FALSOS_REGISTRADOS = {
  // `background-image` posto só para colorir TEXTO (`background-clip:text`) com o elemento vazio:
  // não há letra para recortar, então nada aparece. A régua vê `backgroundImage !== 'none'` e
  // recusa. Manter é o lado seguro: o dia em que houver texto, ele pinta.
  fundoClipTexto: 'background-image existe mas está recortado em texto que não existe',
};

// ---------------------------------------------------------------------- A PÁGINA, COMO O CARTÃO A VÊ
// Cópia declarada da exclusão de `test/qa-censo-passo2.js` (que por sua vez copia a do gerador):
// sem ela eu mediria a página num estado que o cartão nunca fotografa.
async function excluir(pg) {
  return pg.evaluate(() => {
    const ALVOS_CONTROLE = 'button, [role="button"], input, select, summary';
    const esconder = (e) => { if (e && e.style.display !== 'none') e.style.display = 'none'; };
    document.querySelectorAll('.med').forEach(esconder);
    const b = document.getElementById('medirBt'); if (b) esconder(b);
    document.querySelectorAll('.vaoMedida').forEach(esconder);
    document.querySelectorAll('body *').forEach((e) => {
      const s = getComputedStyle(e);
      if ((s.position === 'fixed' || s.position === 'sticky') && e.matches(ALVOS_CONTROLE)) esconder(e);
    });
    document.querySelectorAll('.barra').forEach((x) => { x.style.scrollPaddingRight = '0px'; x.scrollLeft = 0; });
    const a = document.querySelector('.barra a.aqui');
    if (a && a.scrollIntoView) a.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    window.scrollTo(0, 0);
  });
}
async function abrirPagina(nav) {
  const pg = await nav.newPage({ viewport: { width: L, height: A }, deviceScaleFactor: 1 });
  await pg.goto(ABRIR('file:///' + ARQ.split(path.sep).join('/')));
  await pg.evaluate(() => document.fonts.ready).catch(() => {});
  await pg.waitForFunction('window.__pronto === true', null, { timeout: 8000 }).catch(() => {});
  await pg.waitForTimeout(600);
  return pg;
}

// O MUTANTE VAI NA `.lista`, NUNCA NA `.barra` — armadilha registrada pelo QA em 03/09 e
// reconferida aqui: a `.barra` tem `overflow-x:auto` e empurra o mutante para fora da janela do
// contêiner, fabricando um "escapou da caixa de rolagem" que é do instrumento, não da régua. A
// `.lista` das tábuas de lugar não rola e é `dono` provado do mesmo jeito.
function injetar(arg) {
  const l = document.querySelector('.lista');
  if (!l) throw new Error('nao achei .lista (a .barra NAO serve — overflow-x:auto tira o mutante da janela)');
  if (arg.estilo) { const st = document.createElement('style'); st.textContent = arg.estilo; document.head.appendChild(st); }
  const s = document.createElement('span');
  s.className = 'qaFuga';
  s.setAttribute('aria-hidden', 'true');   // o MESMO atributo do vão real
  // e NENHUM texto: é exatamente o par que `decorativoInerte` absolve
  let base = 'box-sizing:border-box;display:inline-block;width:150px;height:38px;vertical-align:middle;';
  if (arg.css) base += arg.css;
  s.style.cssText = base;
  l.appendChild(s);
  window.__qaFuga = s;
  const r = s.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

// O RECORTE: a caixa do mutante mais 48 px de folga, presa dentro do quadro. A folga não é
// enfeite — `outline-offset`, `box-shadow` e a alça de `resize` pintam FORA do retângulo do
// elemento, e um recorte justo os leria como zero.
const FOLGA = 48;
function recortar(r) {
  const x0 = Math.max(0, Math.floor(r.x - FOLGA)), y0 = Math.max(0, Math.floor(r.y - FOLGA));
  const x1 = Math.min(L, Math.ceil(r.x + r.w + FOLGA)), y1 = Math.min(A, Math.ceil(r.y + r.h + FOLGA));
  return { x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0) };
}
// A CONTA DOS PIXELS DIFERENTES. O Node deste repositório não tem decodificador de PNG e não vale
// acrescentar dependência por isto: o próprio Chromium decodifica, numa aba `about:blank` à parte.
async function diferenca(aux, a, b) {
  const n = await aux.evaluate(async ([a, b]) => {
    const carregar = (s) => new Promise((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('png ilegível'));
      i.src = 'data:image/png;base64,' + s;
    });
    const ia = await carregar(a), ib = await carregar(b);
    if (ia.width !== ib.width || ia.height !== ib.height) return -1;
    const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(ia, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data;
    x.clearRect(0, 0, c.width, c.height);
    x.drawImage(ib, 0, 0); const db = x.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < da.length; i += 4) {
      if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2] || da[i + 3] !== db[i + 3]) n++;
    }
    return n;
  }, [a.toString('base64'), b.toString('base64')]);
  return n;
}

(async () => {
  console.log('CATRACA DA PINTURA FORA DO CENSO — recorte ' + L + 'x' + A + ', oráculo por visibility:hidden');
  if (!fs.existsSync(ARQ)) { console.log('territorio/index.html não existe — rode `npm run build`'); process.exit(1); }

  // A CATRACA TEM DE PODER SER VISTA MORDENDO EM MECANISMO NÃO REGISTRADO (EQUIPE.md 2.8), e não
  // dá para provar isso com um mecanismo do catálogo — todos eles a régua já cobre. Estas duas
  // variáveis metem no catálogo um mecanismo que NINGUÉM escreveu na régua nem aqui:
  //   CATRACA_EXTRA_NOME=xis CATRACA_EXTRA_CSS='...' node test/qa-censo-pintura-fora.js
  // Se ele pintar e o censo absolver, a catraca fica vermelha pelo nome dele. É a prova da mordida.
  if (process.env.CATRACA_EXTRA_NOME) {
    CATALOGO[process.env.CATRACA_EXTRA_NOME] = {
      css: process.env.CATRACA_EXTRA_CSS || '', estilo: process.env.CATRACA_EXTRA_ESTILO || '',
    };
    console.log('  (mecanismo EXTRA injetado por ambiente: ' + process.env.CATRACA_EXTRA_NOME + ')');
  }

  // A SEGUNDA MORDIDA, e ela é a que continua reproduzível depois de o buraco fechar. A de cima
  // precisa de um mecanismo que ninguém cobriu — e, no dia em que a régua cobre todos os do
  // catálogo, ela deixa de ficar vermelha por construção. Esta CEGA a régua de propósito:
  //   CATRACA_CEGA="s.backdropFilter !== 'none'" node test/qa-censo-pintura-fora.js
  // troca aquele pedaço por `false` na função que o Playwright serializa, e a catraca tem de
  // apontar `backdropFilter` (e `pseudoBackdrop`) pelo nome. É a prova de que verde aqui é
  // resultado da régua, não do teste ser complacente.
  let censar = CENSO.censoDoQuadro;
  if (process.env.CATRACA_CEGA) {
    const fonte = censar.toString();
    if (fonte.indexOf(process.env.CATRACA_CEGA) === -1) {
      console.log('CATRACA_CEGA não casou nada em censoDoQuadro: ' + process.env.CATRACA_CEGA);
      process.exit(1);
    }
    // eslint-disable-next-line no-new-func
    censar = new Function('return (' + fonte.split(process.env.CATRACA_CEGA).join('false') + ')')();
    console.log('  (régua CEGADA de propósito em: ' + process.env.CATRACA_CEGA + ')');
  }

  const nav = await chromium.launch({ args: ['--enable-unsafe-swiftshader'], executablePath: ABRIR.chromiumPath() });
  const aux = await nav.newPage();
  await aux.goto('about:blank');
  const permitidos = CENSO.permitidosDaPagina('territorio', fs.readFileSync(ARQ, 'utf8'));
  const doPasso2 = (e) => /contêiner já provado/.test(e.motivo || '');

  // ---------------------------------------------------------------- 1. O PISO DE RUÍDO, MEDIDO
  // Por que o recorte existe, em número: o quadro inteiro NUNCA é estável (o mapa anima), o
  // recorte é. As duas medidas saem da MESMA carga, sem tocar em nada entre as fotos.
  console.log('\n=== 1. O PISO DE RUÍDO — duas fotos idênticas, sem mudar nada');
  const pgP = await abrirPagina(nav);
  await excluir(pgP);
  const rP = await pgP.evaluate(injetar, {});
  const cP = recortar(rP);
  const inteiro = { x: 0, y: 0, width: L, height: A };
  const i1 = await pgP.screenshot({ clip: inteiro });
  const c1 = await pgP.screenshot({ clip: cP });
  await pgP.waitForTimeout(400);
  const i2 = await pgP.screenshot({ clip: inteiro });
  const c2 = await pgP.screenshot({ clip: cP });
  await pgP.close();
  const pisoInteiro = await diferenca(aux, i1, i2);
  const pisoRecorte = await diferenca(aux, c1, c2);
  console.log('  quadro inteiro ' + L + 'x' + A + ': ' + pisoInteiro + ' px de ruído'
    + (pisoInteiro > 0 ? '  <- é por isto que o quadro inteiro não serve de régua' : ''));
  console.log('  recorte ' + JSON.stringify(cP) + ': ' + pisoRecorte + ' px');
  ok(pisoRecorte === 0, 'o recorte na caixa do mutante +' + FOLGA + ' tem piso de ruído ZERO'
    + (pisoRecorte ? ' — mediu ' + pisoRecorte + ' px, e toda medição abaixo estaria contaminada' : ''));

  // ------------------------------------------------------- 2. CÂMERA CONTRA CENSO, UM POR UM
  console.log('\n=== 2. O CATÁLOGO — a câmera diz se pintou, o censo diz se recusou');
  const fugas = {}, falsos = {};
  for (const nome of Object.keys(CATALOGO)) {
    const pg = await abrirPagina(nav);
    await excluir(pg);
    let r = null, erro = '';
    try { r = await pg.evaluate(injetar, CATALOGO[nome]); } catch (e) { erro = String(e.message || e); }
    if (erro) { await pg.close(); ok(false, nome + ': o mutante não pôde ser injetado — ' + erro); continue; }
    const clip = recortar(r);
    const comEle = await pg.screenshot({ clip });
    const estranhos = await pg.evaluate(censar, [L, A, permitidos, CENSO.SELETOR_INTERATIVO]);
    // O PISO DESTA MEDIÇÃO, cobrado aqui e não uma vez só lá em cima: cada mecanismo mexe na
    // caixa, e um recorte que passe a pegar o mapa deixaria de ter piso zero SÓ NAQUELE caso.
    const outraVez = await pg.screenshot({ clip });
    await pg.evaluate(() => { window.__qaFuga.style.visibility = 'hidden'; });
    const semEle = await pg.screenshot({ clip });
    await pg.close();
    const piso = await diferenca(aux, comEle, outraVez);
    const px = await diferenca(aux, comEle, semEle);
    const recusou = estranhos.some(doPasso2);
    const marca = px > 0 ? (recusou ? 'FECHADO' : 'FUGA   ') : (recusou ? 'FALSO+ ' : 'inerte ');
    console.log('  ' + marca + ' ' + nome.padEnd(24) + String(px).padStart(6) + ' px'
      + '  censo=' + (recusou ? 'RECUSA ' : 'ABSOLVE') + '  piso=' + piso);
    if (piso !== 0) { ok(false, nome + ': o piso de ruído do recorte deste mutante é ' + piso + ' px, não zero — a medição dele não vale'); continue; }
    if (px < 0) { ok(false, nome + ': as duas fotos saíram com tamanhos diferentes — recorte inválido'); continue; }
    if (px > 0 && !recusou) fugas[nome] = px;
    if (px === 0 && recusou) falsos[nome] = true;
  }

  // ------------------------------------------------------------------------- 3. A CATRACA
  console.log('\n=== 3. A CATRACA — o conjunto de divergências tem de ser o registrado');
  const novas = Object.keys(fugas).filter((n) => !(n in FUGAS_REGISTRADAS));
  const sumidas = Object.keys(FUGAS_REGISTRADAS).filter((n) => !(n in fugas));
  const novosFalsos = Object.keys(falsos).filter((n) => !(n in FALSOS_REGISTRADOS));
  const falsosSumidos = Object.keys(FALSOS_REGISTRADOS).filter((n) => !(n in falsos));

  ok(novas.length === 0, 'nenhuma FUGA nova — mecanismo que pinta e o censo absolve'
    + (novas.length ? ': ' + novas.map((n) => n + ' (' + fugas[n] + ' px)').join(', ')
      + '  <- ou a régua fecha, ou o nome entra em FUGAS_REGISTRADAS com o número' : ''));
  ok(novosFalsos.length === 0, 'nenhum FALSO-POSITIVO novo — mecanismo que não pinta e o censo recusa'
    + (novosFalsos.length ? ': ' + novosFalsos.join(', ')
      + '  <- a régua ficou mais paranoica que o navegador; régua que reprova o certo é a que alguém afrouxa' : ''));
  // A CATRACA ANDA NOS DOIS SENTIDOS. Fuga registrada que PAROU de fugir é boa notícia — e a
  // linha vermelha existe para o registro não virar folclore: quem fecha, apaga o nome daqui.
  ok(sumidas.length === 0, 'nenhuma fuga registrada ficou obsoleta'
    + (sumidas.length ? ': ' + sumidas.join(', ') + ' <- foi fechada; apague de FUGAS_REGISTRADAS' : ''));
  ok(falsosSumidos.length === 0, 'nenhum falso-positivo registrado ficou obsoleto'
    + (falsosSumidos.length ? ': ' + falsosSumidos.join(', ') + ' <- apague de FALSOS_REGISTRADOS' : ''));
  console.log('  catálogo: ' + Object.keys(CATALOGO).length + ' mecanismos medidos por pixel'
    + ' · fugas ' + Object.keys(fugas).length + ' · falso-positivos ' + Object.keys(falsos).length);

  await nav.close();
  if (falhas) { console.log('\nREPROVADO — ' + falhas + ' problema(s)'); process.exit(1); }
  console.log('\nok');
})();
