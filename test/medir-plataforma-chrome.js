// O PORTÃO DO CHROME DA PLATAFORMA — a 1ª onda da arte (22/08), virada em número.
//
// O dono reclamou que a plataforma "tá estranha" e "muito diferente da home". A arte auditou e
// achou o defeito: a plataforma falava três línguas visuais e nenhuma era a do jogo. A nav era o
// pior — alvo de toque de 21 px (o piso da casa é 44 e não negocia), quebrava em duas linhas no
// celular, e três de cinco páginas não tinham link para o jogo. Este arquivo cobra a correção,
// pelos números que a arte deu, nas CINCO páginas e em TRÊS larguras.
//
// O QUE ELE MEDE (aceite da arte 1–4):
//   1. TOKENS/TEXTURA — o chrome-plataforma.js existe e as 5 páginas o consomem: os tokens
//      exatos (papel #e9d8ae, tinta #33240f) estão no HTML e a textura de madeira/papel entra
//      como data-URI.
//   2. BARRA DE TÁBUAS — alvo de toque >=44x44 por rect E por elementFromPoint em 390/430/1366;
//      UMA linha (rows==1) nas três larguras; link /jogo/ presente em 5/5; a font-family
//      computada da barra byte-igual nas cinco.
//   3. SERIFA DA CASA — zero requisição a fonts.googleapis/gstatic; o corpo computado resolve
//      numa serifa (nada de Source Sans / Bitter / IBM Plex Mono).
//   4. GRÃO NO CHROME — a primeira camada de background computada é url(data:…) em >=3 materiais
//      (a tábua JOGAR da porta, as tábuas da barra, os cartões-papel).
//
// O AUTOTESTE (EQUIPE.md 2.8 — portão nunca visto reprovando é decoração). No fim, defeitos são
// injetados de propósito e o portão TEM de mordê-los: a barra de texto de volta (alvo < 44), a
// folha do Google de volta (requisição proibida), e a barra forçada a quebrar (rows > 1). Se um
// deles passar, este arquivo sai 1 dizendo que ele mesmo não presta.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const ORIGEM = 'https://chrome-plataforma.local/';
const LARGURAS = [390, 430, 1366];
const PAGINAS = [
  { arq: 'plataforma/index.html', chave: 'porta' },
  { arq: 'historia/index.html', chave: 'historia' },
  { arq: 'glossario/index.html', chave: 'glossario' },
  { arq: 'de-onde-vem/index.html', chave: 'de-onde-vem' },
  { arq: 'territorio/index.html', chave: 'territorio' },
];

let falhas = 0, passes = 0;
function ok(cond, msg) {
  if (cond) { passes++; console.log('  ok  ' + msg); }
  else { falhas++; console.log('  X   ' + msg); }
  return !!cond;
}
function sec(t) { console.log('\n=== ' + t); }

// Serve a página do disco a partir de uma origem falsa (mesma tática do medir-paginas.js): a
// folha do Google, se algum dia voltar, é servida VAZIA e CONTADA; todo o resto é abortado.
async function carregar(browser, arq, W, remendo) {
  const html0 = fs.readFileSync(path.join(RAIZ, arq), 'utf8');
  const html = remendo ? remendo(html0) : html0;
  const pg = await browser.newPage({ viewport: { width: W, height: 844 }, hasTouch: true, isMobile: W < 800 });
  const fontesGoogle = [];
  const erros = [];
  pg.on('pageerror', (e) => erros.push('PAGEERROR: ' + e.message));
  await pg.route('**/*', async (route) => {
    const u = route.request().url();
    if (/fonts\.(googleapis|gstatic)\.com/.test(u)) {
      fontesGoogle.push(u);
      return route.fulfill({ contentType: 'text/css', body: '' });
    }
    if (u === ORIGEM || u === ORIGEM.slice(0, -1)) {
      return route.fulfill({ contentType: 'text/html; charset=utf-8', body: html });
    }
    return route.abort();
  });
  await pg.goto(ORIGEM);
  await pg.waitForTimeout(500);
  return { pg, fontesGoogle, erros };
}

// Mede uma página numa largura: a barra, os alvos, a linha, as fontes, o grão.
async function medir(pg) {
  return pg.evaluate(() => {
    function primeiraCamada(el) {
      if (!el) return null;
      const bi = getComputedStyle(el).backgroundImage;
      if (!bi || bi === 'none') return null;
      return bi.split(/,(?![^()]*\))/)[0].trim(); // 1ª camada, sem cortar dentro de url(...)
    }
    const barra = document.querySelector('.barra');
    const as = barra ? [...barra.querySelectorAll('a')] : [];
    // A barra rola na horizontal quando as tábuas não cabem (é o pedido: 1 linha, nunca quebra).
    // Uma tábua fora da tela é ALCANÇÁVEL por rolagem — então rolamos cada uma até o centro
    // antes de checar elementFromPoint. É a diferença entre "está tapada" (defeito) e "está
    // rolada para fora" (por design). O `top` não muda com rolagem horizontal.
    const alvos = as.map((a) => {
      a.scrollIntoView({ block: 'nearest', inline: 'center' });
      const r = a.getBoundingClientRect();
      const cx = Math.min(Math.max(r.left + r.width / 2, 1), window.innerWidth - 1);
      const cy = Math.min(Math.max(r.top + r.height / 2, 1), window.innerHeight - 1);
      const el = document.elementFromPoint(cx, cy);
      return {
        href: a.getAttribute('href'),
        w: r.width, h: r.height, top: Math.round(r.top),
        acerta: !!el && (a === el || a.contains(el)),
        fam: getComputedStyle(a).fontFamily,
      };
    });
    const cartao = document.querySelector('.verbete, .hoje, .papel, a.card, .grupo');
    return {
      temBarra: !!barra,
      alvos: alvos,
      bodyFam: getComputedStyle(document.body).fontFamily,
      bgTabua: primeiraCamada(as[1] || as[0]),
      bgJogar: primeiraCamada(document.querySelector('a.jogar, .jogar')),
      bgCartao: primeiraCamada(cartao),
    };
  });
}

const ehDataUri = (s) => !!s && /^url\((["']?)data:/.test(s);
const ehSerifa = (s) => /serif|georgia|palatino|iowan|times|noto serif/i.test(s || '')
  && !/source sans|bitter|ibm plex/i.test(s || '');

(async () => {
  const browser = await chromium.launch();
  const famBarraPorPagina = {};
  const materiaisComGrao = new Set();

  for (const P of PAGINAS) {
    sec(P.chave.toUpperCase() + '  (' + P.arq + ')');
    // TOKENS no HTML (aceite 1): a página consome o chrome-plataforma.js.
    const html = fs.readFileSync(path.join(RAIZ, P.arq), 'utf8');
    ok(html.indexOf('#e9d8ae') >= 0, 'token papel #e9d8ae presente');
    ok(html.indexOf('#33240f') >= 0, 'token tinta #33240f presente');
    ok(/--veioPx:url\(data:image\/png/.test(html), 'textura de madeira (--veioPx) como data-URI');
    ok(!/fonts\.(googleapis|gstatic)\.com/.test(html), 'nenhum link do Google Fonts no HTML');

    for (const W of LARGURAS) {
      const { pg, fontesGoogle, erros } = await carregar(browser, P.arq, W);
      const d = await medir(pg);

      if (W === 390) {
        ok(d.temBarra, 'existe a barra de tábuas');
        // 6 tábuas: marca + JOGAR + 4 seções
        ok(d.alvos.length === 6, 'a barra tem 6 tábuas (tem ' + d.alvos.length + ')');
        const temJogo = d.alvos.some((a) => a.href === '/jogo/');
        ok(temJogo, 'link /jogo/ presente na barra');
        ok(ehSerifa(d.bodyFam), 'corpo em serifa: ' + JSON.stringify(d.bodyFam).slice(0, 54));
        famBarraPorPagina[P.chave] = d.alvos[0] ? d.alvos[0].fam : null;
        if (ehDataUri(d.bgJogar)) materiaisComGrao.add(P.chave + ':jogar');
        if (ehDataUri(d.bgTabua)) materiaisComGrao.add(P.chave + ':tabua');
        if (ehDataUri(d.bgCartao)) materiaisComGrao.add(P.chave + ':cartao');
      }

      ok(fontesGoogle.length === 0, W + 'px: 0 requisição a fonts.google* (teve ' + fontesGoogle.length + ')');
      ok(erros.length === 0, W + 'px: 0 erro de página' + (erros.length ? ' — ' + erros[0] : ''));

      // ALVO >=44x44 por rect E por elementFromPoint
      const menor = d.alvos.reduce((m, a) => Math.min(m, a.w, a.h), 1e9);
      ok(menor >= 44, W + 'px: menor alvo ' + menor.toFixed(1) + 'px (>=44 rect)');
      const todosAcertam = d.alvos.every((a) => a.acerta);
      ok(todosAcertam, W + 'px: elementFromPoint acerta as ' + d.alvos.length + ' tábuas');

      // UMA LINHA: um único `top` distinto (tolerância 2px)
      const tops = [...new Set(d.alvos.map((a) => a.top))];
      const linhas = tops.reduce((acc, t) => {
        if (!acc.some((x) => Math.abs(x - t) <= 2)) acc.push(t);
        return acc;
      }, []).length;
      ok(linhas === 1, W + 'px: a barra ocupa 1 linha (rows=' + linhas + ')');

      await pg.close();
    }
  }

  sec('COERÊNCIA ENTRE AS 5');
  const fams = Object.values(famBarraPorPagina);
  const iguais = fams.length === 5 && fams.every((f) => f && f === fams[0]);
  ok(iguais, 'font-family da barra byte-igual nas 5: ' + JSON.stringify(fams[0] || null).slice(0, 48));
  if (!iguais) console.log('      ' + JSON.stringify(famBarraPorPagina));
  ok(materiaisComGrao.size >= 3, 'grão (url(data:) 1ª camada) em >=3 materiais: ' + materiaisComGrao.size
    + ' [' + [...materiaisComGrao].join(', ') + ']');

  // ---------------------------------------------- A COSTURA PORTA<->JOGO (onda 4, 22/08)
  // "A porta é a CLAREIRA antes do poste": quem sai da plataforma para o jogo não pode sentir
  // troca de produto. Três coisas fazem essa frase ser verificável, e as três caem por motivos
  // diferentes se alguém mexer sem querer:
  //   (a) A IDA é direta. JOGAR leva a /jogo/, sem tela intermediária — na tábua da barra E no
  //       portal do hero, que são dois caminhos para a mesma porta.
  //   (b) A PORTA COMEÇA NA MATA. O hero nasce em y=0 e a barra de tábuas flutua sobre ele.
  //       A faixa de papel de 58 px que existia acima era o maior salto de paleta da sequência
  //       (medido: ΔRGB 169 contra os 58 px de cima da home do jogo).
  //   (c) A VOLTA cai aqui. O link da CHEGADA (montarSaidaPlataforma, no jogo) aponta para a
  //       RAIZ, e a raiz publicada é esta página — `construir.js` copia plataforma/index.html
  //       para dist/index.html. Quem volta reconhece onde chegou porque acha a mesma barra.
  sec('A COSTURA PORTA<->JOGO (onda 4)');
  {
    const { pg } = await carregar(browser, 'plataforma/index.html', 390);
    const c = await pg.evaluate(() => {
      const hero = document.querySelector('.hero');
      const barra = document.querySelector('.barra');
      const rh = hero ? hero.getBoundingClientRect() : null;
      const rb = barra ? barra.getBoundingClientRect() : null;
      const antes = hero ? getComputedStyle(hero, '::before').backgroundImage : '';
      return {
        portalJogar: (document.querySelector('.portal.jogar') || {}).getAttribute
          ? document.querySelector('.portal.jogar').getAttribute('href') : null,
        barraJogar: (document.querySelector('.barra a.jogar') || {}).getAttribute
          ? document.querySelector('.barra a.jogar').getAttribute('href') : null,
        heroTopo: rh ? Math.round(rh.top) : null,
        barraSobreHero: !!(rh && rb && rb.top >= rh.top - 1 && rb.bottom > rh.top + 8),
        veuNoHero: /linear-gradient/.test(antes) && /rgba\(10, ?9, ?6/.test(antes),
      };
    });
    await pg.close();
    ok(c.portalJogar === '/jogo/', 'o portal JOGAR do hero leva a /jogo/ (é ' + c.portalJogar + ')');
    ok(c.barraJogar === '/jogo/', 'a tábua JOGAR da barra leva a /jogo/ (é ' + c.barraJogar + ')');
    ok(c.heroTopo === 0, 'o hero começa em y=0 — a porta abre NA MATA (topo ' + c.heroTopo + ')');
    ok(c.barraSobreHero, 'a barra de tábuas flutua SOBRE a mata, como o poste do jogo');
    ok(c.veuNoHero, 'o hero usa o véu do menu do jogo (rgba(10,9,6) no ::before)');
    // (c) a volta: lida do JOGO CONSTRUÍDO, que é o que a pessoa abre.
    const jogo = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
    ok(/montarSaidaPlataforma/.test(jogo) && /setAttribute\("href", ?"\/"\)/.test(jogo),
      'a saída da CHEGADA (no jogo) aponta para a RAIZ');
    const construir = fs.readFileSync(path.join(RAIZ, 'ferramentas', 'construir.js'), 'utf8');
    ok(/plataforma['"], ?['"]index\.html['"]\)[\s\S]{0,120}dist['"], ?['"]index\.html/.test(construir),
      'a raiz publicada é a PORTA (construir.js: plataforma -> dist/index.html)');
  }

  // ------------------------------------------------------------------ AUTOTESTE (2.8)
  sec('AUTOTESTE — o portão TEM de morder o defeito');
  let mordidas = 0, controles = 0;
  async function controle(nome, arq, W, remendo, checa) {
    controles++;
    const { pg, fontesGoogle } = await carregar(browser, arq, W, remendo);
    const d = await medir(pg);
    const menor = d.alvos.length ? d.alvos.reduce((m, a) => Math.min(m, a.w, a.h), 1e9) : 0;
    const tops = [...new Set(d.alvos.map((a) => a.top))];
    const linhas = tops.reduce((acc, t) => { if (!acc.some((x) => Math.abs(x - t) <= 2)) acc.push(t); return acc; }, []).length;
    const pego = checa({ d, menor, linhas, fontesGoogle });
    await pg.close();
    if (pego) { mordidas++; console.log('  ok  mordeu: ' + nome); }
    else { console.log('  X   PASSOU (não mordeu): ' + nome); }
  }
  // (1) a nav de texto de volta: alvo esmagado a 20px
  await controle('barra com alvo de 20px', 'historia/index.html', 390,
    (h) => h.replace('</head>', '<style>.barra a{min-height:20px!important;padding:0 4px!important;}</style></head>'),
    ({ menor }) => menor < 44);
  // (2) a folha do Google de volta
  await controle('link do Google Fonts de volta', 'glossario/index.html', 390,
    (h) => h.replace('</head>', '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bitter&display=swap"></head>'),
    ({ fontesGoogle }) => fontesGoogle.length > 0);
  // (3) a barra forçada a quebrar em duas linhas
  await controle('barra forçada a quebrar', 'de-onde-vem/index.html', 390,
    (h) => h.replace('</head>', '<style>.barra{flex-wrap:wrap!important;width:120px!important;}</style></head>'),
    ({ linhas }) => linhas > 1);

  // (4) a costura desfeita: a barra volta ao FLUXO e empurra o hero para baixo — a faixa de
  //     papel de 58 px no alto da porta, que é exatamente o defeito que a onda 4 tirou.
  controles++;
  {
    const { pg } = await carregar(browser, 'plataforma/index.html', 390,
      (h) => h.replace('</head>', '<style>body>.barra{position:static!important;}</style></head>'));
    const topo = await pg.evaluate(() => {
      const r = document.querySelector('.hero').getBoundingClientRect();
      return Math.round(r.top);
    });
    await pg.close();
    if (topo !== 0) { mordidas++; console.log('  ok  mordeu: barra de volta ao fluxo (hero em y=' + topo + ')'); }
    else console.log('  X   PASSOU (não mordeu): barra de volta ao fluxo');
  }

  ok(mordidas === controles, 'o portão mordeu os ' + controles + ' defeitos injetados (' + mordidas + '/' + controles + ')');

  await browser.close();
  console.log('\n' + (falhas ? 'FALHOU' : 'OK') + ' — ' + passes + ' verificações, ' + falhas + ' falha(s), '
    + mordidas + '/' + controles + ' controles');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
