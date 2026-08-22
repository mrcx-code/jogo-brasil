// O PORTÃO DO PAPEL DE CAMPO — a 3ª onda da arte (22/08), virada em número.
//
// A onda 1 trouxe o CHROME (barra de tábuas, tokens, serifa) para as seções, mas o CORPO de
// leitura seguia creme chapado — e o glossário tinha grão ATRÁS do texto corrido (medido no
// print O3-glossario-antes). A arte cravou a matéria de leitura do jogo: o FUNDO vira papel de
// campo (pauta de 11px + grão sutil), os cartões (verbetes/momentos/fichas) ganham FIO DE
// MADEIRA e papel limpo, a CITAÇÃO é itálico serifado — e a disciplina que não se negocia:
// grão nos MATERIAIS, NUNCA sob a coluna longa de leitura.
//
// A RÉGUA (aceite numérico da arte, 22/08), nas 3 seções de leitura:
//   (a) o FUNDO (body) tem a pauta (repeating-linear-gradient) E o grão (url(data:…)).
//   (b) a coluna de leitura tem contraste tinta×papel >= 4.5:1 (WCAG AA), medido contra o
//       papel MAIS ESCURO do cartão (papel2) — o pior caso.
//   (c) a citação/fonte resolve em ITÁLICO SERIFADO (font-style:italic + família serifa).
//   (d) NENHUM texto corrido leva grão atrás: o cartão e o elemento de leitura NÃO têm
//       url(data:…) no background computado.
//   (e) 0 requisição a fonts.google* (a serifa é da casa).
//   (f) o CHROME segue intacto: a barra existe, 6 tábuas, e a tábua tem o veio (url(data:…))
//       como primeira camada — só o corpo mudou.
//
// O AUTOTESTE (EQUIPE.md 2.8 — portão nunca visto reprovando é decoração). No fim, quatro
// defeitos são injetados e o portão TEM de mordê-los: o fundo sem grão (a cai), o grão de volta
// atrás do texto (d cai), a citação em redonda sem serifa (c cai), e a tinta clareada perto do
// papel (b cai). Se um passar, este arquivo sai 1 dizendo que ele mesmo não presta.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const ORIGEM = 'https://leitura-secao.local/';
const PAGINAS = [
  { chave: 'historia',    arq: 'historia/index.html',    cartao: '.corpo',   leitura: '.texto', cita: '.fonte.citaCampo' },
  { chave: 'glossario',   arq: 'glossario/index.html',   cartao: '.verbete', leitura: '.def',   cita: '.fonte.citaCampo' },
  { chave: 'de-onde-vem', arq: 'de-onde-vem/index.html', cartao: '.fonte',   leitura: '.ref',   cita: '.traz.citaCampo' },
];

let falhas = 0, passes = 0;
function ok(cond, msg) {
  if (cond) { passes++; console.log('  ok  ' + msg); }
  else { falhas++; console.log('  X   ' + msg); }
  return !!cond;
}
function sec(t) { console.log('\n=== ' + t); }

// ---- WCAG: contraste entre duas cores ----
function canal(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function lum(r, g, b) { return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b); }
function parseCor(s) {
  s = String(s || '').trim();
  let m = s.match(/^#([0-9a-f]{6})$/i);
  if (m) { const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  m = s.match(/rgba?\(([^)]+)\)/i);
  if (m) { const p = m[1].split(',').map((x) => parseFloat(x)); return [p[0], p[1], p[2]]; }
  return null;
}
function contraste(a, b) {
  const A = parseCor(a), B = parseCor(b);
  if (!A || !B) return null;
  const la = lum(A[0], A[1], A[2]), lb = lum(B[0], B[1], B[2]);
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}
const temDataUri = (s) => /url\(\s*(["']?)data:/.test(s || '');
const temPauta = (s) => /repeating-linear-gradient/.test(s || '');
const ehSerifa = (s) => /serif|georgia|palatino|iowan|times|noto serif/i.test(s || '')
  && !/sans|mono|menlo|consolas|ibm plex mono/i.test(s || '');

async function carregar(browser, arq, remendo) {
  const html0 = fs.readFileSync(path.join(RAIZ, arq), 'utf8');
  const html = remendo ? remendo(html0) : html0;
  const pg = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const fontesGoogle = [];
  pg.on('pageerror', () => {});
  await pg.route('**/*', async (route) => {
    const u = route.request().url();
    if (/fonts\.(googleapis|gstatic)\.com/.test(u)) { fontesGoogle.push(u); return route.fulfill({ contentType: 'text/css', body: '' }); }
    if (u === ORIGEM || u === ORIGEM.slice(0, -1)) return route.fulfill({ contentType: 'text/html; charset=utf-8', body: html });
    return route.abort();
  });
  await pg.goto(ORIGEM);
  await pg.waitForTimeout(400);
  return { pg, fontesGoogle };
}

async function medir(pg, P) {
  return pg.evaluate((sel) => {
    const bi = (el) => (el ? getComputedStyle(el).backgroundImage : 'none');
    const raiz = getComputedStyle(document.documentElement);
    const cart = document.querySelector(sel.cartao);
    const leit = document.querySelector(sel.leitura);
    const cit = document.querySelector(sel.cita);
    const barra = document.querySelector('.barra');
    const tabua = barra ? barra.querySelectorAll('a')[1] : null; // a[0] é a marca; a[1] é uma tábua
    const primeira = (el) => { const s = bi(el); return s && s !== 'none' ? s.split(/,(?![^()]*\))/)[0].trim() : null; };
    return {
      fundoBg: bi(document.body),
      papel: raiz.getPropertyValue('--papel').trim(),
      papel2: raiz.getPropertyValue('--papel2').trim(),
      cartaoBg: bi(cart),
      leituraBg: bi(leit),
      leituraCor: leit ? getComputedStyle(leit).color : null,
      citaFS: cit ? getComputedStyle(cit).fontStyle : null,
      citaFam: cit ? getComputedStyle(cit).fontFamily : null,
      temBarra: !!barra,
      nTabuas: barra ? barra.querySelectorAll('a').length : 0,
      tabua1a: primeira(tabua),
    };
  }, P);
}

(async () => {
  const browser = await chromium.launch();

  for (const P of PAGINAS) {
    sec(P.chave.toUpperCase() + '  (' + P.arq + ')');
    const { pg, fontesGoogle } = await carregar(browser, P.arq);
    const d = await medir(pg, P);

    // (a) FUNDO = papel de campo: pauta + grão
    ok(temPauta(d.fundoBg), '(a) o fundo tem a pauta (repeating-linear-gradient)');
    ok(temDataUri(d.fundoBg), '(a) o fundo tem o grão (url(data:…))');

    // (b) contraste da coluna de leitura >= 4.5 (contra o papel mais escuro do cartão)
    const cP = contraste(d.leituraCor, d.papel);
    const cP2 = contraste(d.leituraCor, d.papel2);
    const pior = Math.min(cP || 0, cP2 || 0);
    ok(pior >= 4.5, '(b) contraste tinta×papel ' + (pior ? pior.toFixed(2) : '?') + ':1 (>=4.5) [' + d.leituraCor + ' × ' + d.papel2 + ']');

    // (c) citação/fonte em itálico serifado
    ok(d.citaFS === 'italic', '(c) a citação é itálico (font-style=' + d.citaFS + ')');
    ok(ehSerifa(d.citaFam), '(c) a citação é serifada: ' + JSON.stringify(d.citaFam).slice(0, 46));

    // (d) NENHUM grão atrás do texto corrido
    ok(!temDataUri(d.cartaoBg), '(d) o cartão ' + P.cartao + ' NÃO tem grão atrás');
    ok(!temDataUri(d.leituraBg), '(d) a coluna ' + P.leitura + ' NÃO tem grão atrás');

    // (e) 0 fontes do Google
    ok(fontesGoogle.length === 0, '(e) 0 requisição a fonts.google* (teve ' + fontesGoogle.length + ')');

    // (f) o chrome segue intacto
    ok(d.temBarra && d.nTabuas === 6, '(f) barra intacta com 6 tábuas (tem ' + d.nTabuas + ')');
    ok(temDataUri(d.tabua1a), '(f) a tábua tem o veio (url(data:…)) como 1ª camada');

    await pg.close();
  }

  // ---------------------------------------------------------------- AUTOTESTE (2.8)
  sec('AUTOTESTE — o portão TEM de morder o defeito');
  let mordidas = 0, controles = 0;
  async function controle(nome, arq, P, remendo, checa) {
    controles++;
    const { pg, fontesGoogle } = await carregar(browser, arq, remendo);
    const d = await medir(pg, P);
    const pego = checa({ d, fontesGoogle });
    await pg.close();
    if (pego) { mordidas++; console.log('  ok  mordeu: ' + nome); }
    else { console.log('  X   PASSOU (não mordeu): ' + nome); }
  }
  const glo = PAGINAS[1], his = PAGINAS[0];
  // (1) fundo sem grão -> (a) cai
  await controle('fundo sem grão', glo.arq, glo,
    (h) => h.replace('.fundoCampo{ background:var(--graoPx,none), var(--pauta), var(--papel); }',
      '.fundoCampo{ background:var(--papel); }'),
    ({ d }) => !temDataUri(d.fundoBg));
  // (2) grão de volta atrás do texto corrido -> (d) cai
  await controle('grão de volta atrás do verbete', glo.arq, glo,
    (h) => h.replace('</head>', '<style>.verbete{background:var(--graoPx) var(--realce)!important;}</style></head>'),
    ({ d }) => temDataUri(d.cartaoBg));
  // (3) citação em redonda sem serifa -> (c) cai
  await controle('citação sem itálico e sem serifa', his.arq, his,
    (h) => h.replace('</head>', '<style>.fonte.citaCampo{font-style:normal!important;font-family:Arial,sans-serif!important;}</style></head>'),
    ({ d }) => !(d.citaFS === 'italic' && ehSerifa(d.citaFam)));
  // (4) tinta clareada perto do papel -> (b) cai
  await controle('tinta clareada (contraste abaixo de 4.5)', his.arq, his,
    (h) => h.replace('</head>', '<style>.texto{color:#c9b98e!important;}</style></head>'),
    ({ d }) => { const c = Math.min(contraste(d.leituraCor, d.papel) || 0, contraste(d.leituraCor, d.papel2) || 0); return c < 4.5; });

  ok(mordidas === controles, 'o portão mordeu os ' + controles + ' defeitos injetados (' + mordidas + '/' + controles + ')');

  await browser.close();
  console.log('\n' + (falhas ? 'FALHOU' : 'OK') + ' — ' + passes + ' verificações, ' + falhas + ' falha(s), '
    + mordidas + '/' + controles + ' controles');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
