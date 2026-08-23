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
  // TUDO O QUE A PÁGINA TENTA BUSCAR FORA DA PRÓPRIA ORIGEM. A cena do interruptor cobra que
  // ele não trouxe rede nenhuma junto — ícone, fonte, folha de estilo. O único endereço de fora
  // que pode aparecer é o da medição, e mesmo ele só quando ela está LIGADA.
  const defora = [];
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
    defora.push(u);
    return route.abort();
  });
  await pg.goto(ORIGEM);
  // ERA waitForTimeout(500), e o que vem depois mede GEOMETRIA (barra de tábuas, alvo de 44 px
  // no interruptor) — medida antes de a fonte assentar, ela muda. `readyState` e
  // `document.fonts.ready` são o estado real; teto de 20 s como DETECTOR DE TRAVAMENTO, nunca
  // régua de ritmo. Os `.catch` mantêm as asserções de baixo como quem reprova: uma espera que
  // estoura não pode derrubar o instrumento inteiro (lição 2.8).
  await pg.waitForFunction(() => document.readyState === 'complete',
    null, { timeout: 20000 }).catch(() => {});
  await pg.evaluate(() => (document.fonts && document.fonts.ready ? document.fonts.ready : null)).catch(() => {});
  // `defora` é da cena do interruptor (entrou na main enquanto isto era escrito): ela cobra que
  // subir o interruptor para a barra não trouxe rede nenhuma junto. As duas coisas convivem —
  // o conflito era de texto, não de intenção.
  return { pg, fontesGoogle, defora, erros };
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

// ------------------------------------------- O INTERRUPTOR DA MEDIÇÃO, MEDIDO (23/08)
//
// POR QUE ESTA RÉGUA EXISTE, com o número que a pediu: o parecer do jurídico mediu que o
// interruptor que desliga a contagem estava a **116 telas de rolagem** do topo em algumas
// páginas. Ele existia e funcionava — `test/medir-paginas.js` prova que desligar dá ZERO
// pedido —, e mesmo assim ninguém o achava. O dono decidiu manter a medição LIGADA por padrão,
// e a condição que ele pôs para isso ser defensável é que DESLIGAR SEJA FÁCIL. Este bloco é a
// metade técnica dessa condição, e ele cobra quatro coisas que, juntas, são "fácil":
//   (a) está no CHROME — dentro da `.barra`, que é a única coisa igual nas cinco páginas —,
//       e é UM só no documento inteiro (dois controles da mesma preferência se contradizem);
//   (b) dá para acertar com o dedo: >=44x44 por rect E por elementFromPoint, nas três larguras;
//   (c) o ESTADO é legível sem tocar: o texto visível diz "ligada" ou "desligada" e o
//       aria-pressed diz a mesma coisa (um interruptor que só se explica depois de apertado
//       obriga a mexer na configuração para descobri-la);
//   (d) não trouxe rede nenhuma junto, e a barra continua sem transbordar a tela.
// A MESMA função mede a página verdadeira e os defeitos injetados — régua única, senão o
// controle passa por ser mais frouxo que a cobrança (a disciplina do medir-paginas.js).
async function medirInterruptor(pg) {
  return pg.evaluate(() => {
    const bt = document.getElementById('medirBt');
    const barra = document.querySelector('.barra');
    if (!bt) {
      return { existe: false, naBarra: false, quantos: document.querySelectorAll('#medirBt').length,
        rodape: document.querySelectorAll('footer button, .med button').length };
    }
    const r = bt.getBoundingClientRect();
    const cx = Math.min(Math.max(r.left + r.width / 2, 1), window.innerWidth - 1);
    const cy = Math.min(Math.max(r.top + r.height / 2, 1), window.innerHeight - 1);
    const el = document.elementFromPoint(cx, cy);
    const rb = barra ? barra.getBoundingClientRect() : null;
    return {
      existe: true,
      naBarra: !!bt.closest('.barra'),
      quantos: document.querySelectorAll('#medirBt').length,
      rodape: document.querySelectorAll('footer button, .med button').length,
      w: r.width, h: r.height,
      acerta: !!el && (bt === el || bt.contains(el)),
      texto: (bt.innerText || '').replace(/\s+/g, ' ').trim(),
      pressed: bt.getAttribute('aria-pressed'),
      rotulo: bt.getAttribute('aria-label') || '',
      barraDentro: !!rb && rb.right <= window.innerWidth + 0.5 && rb.left >= -0.5,
      rolagemH: document.documentElement.scrollWidth - window.innerWidth,
      // A TÁBUA .aqui NÃO PODE FICAR EMBAIXO DO INTERRUPTOR. Achado no primeiro print de
      // 23/08: em O TERRITÓRIO a .aqui é a ÚLTIMA, a barra rola até ela na carga e ela parava
      // sob o botão grudado — sobrava a letra "O" de "O Território". Ler o mesmo "você está
      // aqui" que o scrollIntoView existe para garantir, e cobrar que ele continua legível.
      aquiVisivel: (function () {
        const a = document.querySelector('.barra a.aqui');
        if (!a) return true;                       // a porta marca a MARCA, não uma tábua
        const ra = a.getBoundingClientRect();
        const tapado = Math.max(0, Math.min(ra.right, r.right) - Math.max(ra.left, r.left));
        return ra.width > 0 && tapado / ra.width < 0.35;
      })(),
    };
  });
}
// O ESTADO É LEGÍVEL? A resposta não pode ser "tem um botão": tem de ser a palavra certa no
// texto visível E o aria-pressed concordando com ela.
function estadoLegivel(d) {
  if (!d.existe) return false;
  const desligada = /desligada/i.test(d.texto), ligada = /(^|[^s])ligada/i.test(d.texto);
  if (desligada === ligada) return false;              // nem as duas, nem nenhuma
  return d.pressed === (desligada ? 'false' : 'true');
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

  // -------------------------------------- O INTERRUPTOR DA MEDIÇÃO NO CHROME (23/08)
  sec('O INTERRUPTOR DA MEDIÇÃO — alcançável de qualquer página');
  for (const P of PAGINAS) {
    for (const W of LARGURAS) {
      const { pg, defora } = await carregar(browser, P.arq, W);
      const d = await medirInterruptor(pg);
      const rotulo = P.chave + '/' + W + 'px';
      if (W === LARGURAS[0]) {
        ok(d.existe && d.naBarra, rotulo + ': o interruptor está na BARRA (chrome), não no rodapé');
        ok(d.quantos === 1, rotulo + ': existe UM só no documento (achei ' + d.quantos + ')');
        ok(d.rodape === 0, rotulo + ': e ZERO botão sobrou no rodapé (achei ' + d.rodape + ')');
        // O interruptor não pode ter trazido rede junto. Com a medição LIGADA sai o pedido da
        // própria medição e nada mais; qualquer outro endereço é asset novo sem ninguém pedir.
        const estranhos = defora.filter((u) => u.indexOf('us.i.posthog.com') < 0);
        ok(estranhos.length === 0, rotulo + ': zero fonte de rede nova ('
          + (estranhos[0] || 'nenhuma') + ')');
      }
      const menor = d.existe ? Math.min(d.w, d.h) : 0;
      ok(menor >= 44, rotulo + ': alvo de ' + menor.toFixed(1) + 'px (>=44 rect)');
      ok(d.acerta, rotulo + ': elementFromPoint acerta o interruptor (não está tapado)');
      ok(estadoLegivel(d), rotulo + ': o estado é legível sem clicar — "' + d.texto
        + '" / aria-pressed=' + d.pressed);
      ok(d.barraDentro && d.rolagemH <= 0, rotulo + ': a barra cabe na tela (rolagem horizontal '
        + d.rolagemH + 'px)');
      ok(d.aquiVisivel, rotulo + ': o interruptor NÃO tapa a tábua "você está aqui"');
      await pg.close();
    }
  }
  // E ELE LIGA E DESLIGA DE VERDADE — a mesma chave do jogo, e a escolha sobrevive à recarga.
  // O `try` existe porque este bloco TOCA o botão: se alguém o apagar do chrome, o clique
  // explode e o portão morreria antes de contar os outros 200 achados. Com a rede de baixo ele
  // reprova UMA linha e o relatório sai inteiro — provado apagando o botão da fonte de verdade
  // (o gerador do glossário rodado sem ele: exit 1, 14 linhas vermelhas, relatório completo).
  try {
    const { pg } = await carregar(browser, 'glossario/index.html', 390);
    const antes = await medirInterruptor(pg);
    await pg.evaluate(() => document.getElementById('medirBt').click());
    await pg.waitForTimeout(150);
    const depois = await medirInterruptor(pg);
    const guardado = await pg.evaluate(() => localStorage.getItem('jogo_brasil_medir'));
    await pg.reload();
    await pg.waitForTimeout(400);
    const recarregado = await medirInterruptor(pg);
    await pg.close();
    ok(/ligada/i.test(antes.texto) && !/desligada/i.test(antes.texto),
      'nasce LIGADA (decisão do dono, 23/08): "' + antes.texto + '"');
    ok(/desligada/i.test(depois.texto) && depois.pressed === 'false',
      'um toque desliga, e o botão conta: "' + depois.texto + '"');
    ok(guardado === 'nao', 'a escolha foi gravada em jogo_brasil_medir=' + guardado);
    ok(/desligada/i.test(recarregado.texto), 'e ela sobrevive à recarga: "' + recarregado.texto + '"');
    // A PREFERÊNCIA É UMA SÓ, e é a do jogo. Lido no artefato que a pessoa abre, não no fonte.
    const jogo = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
    ok(jogo.indexOf('jogo_brasil_medir') > 0,
      'o JOGO usa a MESMA chave — desligar na barra desliga lá (jogo_brasil_medir)');
  } catch (e) {
    ok(false, 'ligar/desligar pelo interruptor da barra explodiu — ' + String(e).slice(0, 120));
  }

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
    // A COBRANÇA É NO ARTEFATO, não no texto do build (conserto de 22/08). Ela era um `grep`
    // pela expressão `plataforma…index.html` seguida de `dist…index.html` dentro do
    // `construir.js`, e caiu no dia em que o build passou a escrever numa pasta de obra: a
    // promessa continuava verdadeira e o portão ficou vermelho porque duas literais mudaram de
    // forma. Portão que lê o CÓDIGO de quem ele vigia reprova refatoração e dorme em bug — o
    // que interessa é o byte que a Vercel publica. Comparado direto, e com a mensagem dizendo
    // para rodar o build se a pasta não estiver lá.
    const distIndex = path.join(RAIZ, 'dist', 'index.html');
    const portaFonte = path.join(RAIZ, 'plataforma', 'index.html');
    ok(fs.existsSync(distIndex), 'dist/index.html existe (se não, rode npm run build antes)');
    ok(fs.existsSync(distIndex) && fs.existsSync(portaFonte)
      && Buffer.compare(fs.readFileSync(distIndex), fs.readFileSync(portaFonte)) === 0,
      'a raiz publicada é a PORTA — dist/index.html é byte a byte plataforma/index.html');
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

  // (5)-(8) O INTERRUPTOR (23/08). Quatro maneiras de ele voltar a ser inalcançável, e a cena
  // acima TEM de morder as quatro — senão ela é decoração (EQUIPE.md 2.8) e a condição que o
  // dono pôs para manter a medição ligada deixa de ter portão.
  async function controleInterruptor(nome, arq, W, remendo, checa) {
    controles++;
    const { pg } = await carregar(browser, arq, W, remendo);
    const d = await medirInterruptor(pg);
    const pego = checa(d);
    await pg.close();
    if (pego) { mordidas++; console.log('  ok  mordeu: ' + nome); }
    else { console.log('  X   PASSOU (não mordeu): ' + nome + ' — ' + JSON.stringify(d).slice(0, 150)); }
  }
  // (5) alguém apaga o interruptor do chrome — o defeito de 116 telas, de volta
  await controleInterruptor('interruptor apagado do chrome', 'glossario/index.html', 390,
    (h) => h.replace(/<button type="button" id="medirBt"[\s\S]*?<\/button>/, ''),
    (d) => !d.existe || !d.naBarra);
  // (6) ele volta ao rodapé E fica na barra: dois controles da mesma preferência
  await controleInterruptor('um segundo interruptor no rodapé', 'historia/index.html', 390,
    (h) => h.replace('</footer>', '<button type="button" id="medirBt">medição: ligada</button></footer>'),
    (d) => d.quantos !== 1 || d.rodape !== 0);
  // (7) o alvo esmagado — o defeito de 21 px da nav velha, aplicado ao interruptor. O
  //     `align-self:center` faz parte do defeito e não é enfeite: sem ele o `align-items:
  //     stretch` da barra devolve os 44 px de altura e o controle PASSA sem morder (visto:
  //     53,6x44 na primeira tentativa). Defeito que a própria folha conserta não é controle.
  await controleInterruptor('interruptor esmagado a 20px', 'de-onde-vem/index.html', 390,
    (h) => h.replace('</head>', '<style>.barra .medida{align-self:center!important;height:20px!important;'
      + 'min-height:20px!important;width:20px!important;min-width:20px!important;padding:0!important;'
      + 'font-size:6px!important;overflow:hidden}</style></head>'),
    (d) => Math.min(d.w, d.h) < 44);
  // (8) o estado deixa de ser legível sem clicar: o botão vira um rótulo mudo. O defeito é
  //     posto no CSS de propósito — apagar o texto do span não serviria de controle, porque o
  //     `pintar()` da medição o reescreve na carga e o defeito se conserta sozinho.
  await controleInterruptor('interruptor sem contar o estado', 'territorio/index.html', 390,
    (h) => h.replace('</head>', '<style>.barra .medida .medEst{display:none!important}</style></head>'),
    (d) => !estadoLegivel(d));

  // (9) o vão e o scroll-padding somem: a tábua "você está aqui" volta para BAIXO do
  //     interruptor em O TERRITÓRIO, que é o defeito que o primeiro print de 23/08 mostrou
  //     (sobrava a letra "O" de "O Território"). É o controle da linha `aquiVisivel`.
  await controleInterruptor('a tábua "você está aqui" tapada pelo interruptor', 'territorio/index.html', 390,
    (h) => h.replace('<span class="vaoMedida" aria-hidden="true"></span>', '')
      .replace('</head>', '<style>.barra{scroll-padding-right:0!important}</style></head>'),
    (d) => !d.aquiVisivel);

  ok(mordidas === controles, 'o portão mordeu os ' + controles + ' defeitos injetados (' + mordidas + '/' + controles + ')');

  await browser.close();
  console.log('\n' + (falhas ? 'FALHOU' : 'OK') + ' — ' + passes + ' verificações, ' + falhas + ' falha(s), '
    + mordidas + '/' + controles + ' controles');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
