// O CONTROLE DO ORÁCULO DA CATRACA — escrito pelo QA em 03/09, auditando a entrega
// `censo-cinco-fugas-medidas` (ramo `qa/censo-cinco`).
//
//   node test/qa-catraca-oraculo.js
//
// POR QUE ELE EXISTE. O `test/qa-censo-pintura-fora.js` promete uma coisa forte, e a promessa
// está escrita lá no cabeçalho com a palavra que a torna verificável:
//
//     "O oráculo certo é `visibility:hidden` no PRÓPRIO mutante, na MESMA carga: (…) O diff
//      passa a ser, POR CONSTRUÇÃO, exatamente os pixels que aquele elemento pinta."
//
// **Não é por construção, e este arquivo mede o tamanho do que sobra de fora.** Dois furos, os
// dois com número, os dois no mesmo mecanismo (um `::before::marker`, que a régua também não vê
// — ver o caso 1). Nenhum dos dois é a classe já declarada como teto de lá (o `furoVizinho`, que
// é pintura de OUTRO elemento): aqui a tinta é do PRÓPRIO mutante, que é exatamente o que o
// oráculo jura enxergar.
//
//   FURO A — `visibility` é HERDADA, e herança se recusa. Um pseudo-elemento que declara
//   `visibility:visible` continua pintando depois de o oráculo pôr `visibility:hidden` no
//   mutante. Medido: o oráculo lê **0 px** e a tinta é de **183 px** no MESMO recorte.
//
//   FURO B — o recorte é a caixa do mutante + 48 px, e tinta que cai fora dele lê zero. Um
//   `::before` com `margin-left:330px` põe o marcador a 330 px do elemento: o oráculo lê
//   **0 px** no recorte de 48 e a câmera conta **~550 px** no recorte de 400.
//
// Nos dois casos a catraca de lá diz `inerte 0 px censo=ABSOLVE` e sai **exit 0** — verificado
// com exit code real, com `CATRACA_EXTRA_NOME`. É o modo de falha que ela existe para impedir,
// acontecendo dentro dela.
//
// O QUE ESTE ARQUIVO COBRA, e é a mesma disciplina do `FUGAS_REGISTRADAS` de lá: o furo tem o
// TAMANHO QUE TINHA. Se alguém consertar o oráculo (o caminho conhecido é comparar contra uma
// carga de referência sem o mutante, ou apagar o mutante do DOM em vez de escondê-lo, e alargar
// o recorte), esta linha fica VERMELHA e diz para apagar o registro. Registro que não sabe
// quando morreu vira folclore.
//
// A PROVA DE QUE ELE MORDE (EQUIPE.md 2.8), com dois defeitos injetáveis por ambiente:
//   QA_ORACULO=b        node test/qa-catraca-oraculo.js   -> exit 1 (o furo A "some": a medição
//                                                            do oráculo passa a usar a folha
//                                                            desligada, e a cegueira desaparece)
//   QA_MUTANTE_MUDO=1   node test/qa-catraca-oraculo.js   -> exit 1 (o mutante deixa de pintar,
//                                                            e os três casos perdem a tinta)
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

// O MECANISMO, e ele é um só nos três casos: um `::before` que vira item de lista e ganha um
// `::marker` PRÓPRIO — o NETO de pseudo-elemento. A régua de `cartao-censo.js` fecha o `::marker`
// do ELEMENTO (`pintaMarcador`) e o `::before` virando item de lista (`pseudoPinta`), mas o
// `::marker` DO `::before` está uma camada abaixo das duas, e ninguém pergunta por ele.
const MARCA = 'color:#ff0000;font-size:20px';
function regra(extra, recuo) {
  return '.qaFuga::before{content:"";display:list-item;list-style-type:none;margin-left:'
    + recuo + 'px;color:#f00;' + extra + '}'
    + ' .qaFuga::before::marker{content:"XXXX";' + MARCA + '}';
}
const CASOS = {
  // 1. o mecanismo cru: a régua absolve e o oráculo da catraca VÊ. É o contraponto — sem ele,
  //    "o oráculo é cego" não teria com o que ser comparado, e os furos abaixo poderiam ser
  //    apenas "o mecanismo não pinta".
  netoMarker: { estilo: regra('', 20) },
  // 2. FURO A: o mesmo, com o pseudo recusando a herança de `visibility`.
  netoInvisivel: { estilo: regra('visibility:visible;', 20) },
  // 3. FURO B: o mesmo, com a tinta a 330 px da caixa — fora dos 48 px de folga do recorte.
  netoLonge: { estilo: regra('', 330) },
};

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
// O mutante é o MESMO par que `decorativoInerte` absolve: `aria-hidden="true"` e sem texto.
function injetar(arg) {
  const l = document.querySelector('.lista');
  if (!l) throw new Error('não achei .lista');
  const st = document.createElement('style');
  st.id = 'qaEstilo';
  st.textContent = arg.estilo;
  document.head.appendChild(st);
  const s = document.createElement('span');
  s.className = 'qaFuga';
  s.setAttribute('aria-hidden', 'true');
  s.style.cssText = 'box-sizing:border-box;display:inline-block;width:150px;height:38px;vertical-align:middle;';
  l.appendChild(s);
  window.__qaFuga = s;
  const r = s.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}
function recortar(r, folga) {
  const x0 = Math.max(0, Math.floor(r.x - folga)), y0 = Math.max(0, Math.floor(r.y - folga));
  const x1 = Math.min(L, Math.ceil(r.x + r.w + folga)), y1 = Math.min(A, Math.ceil(r.y + r.h + folga));
  return { x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0) };
}
async function diferenca(aux, a, b) {
  return aux.evaluate(async ([a, b]) => {
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
}

(async () => {
  console.log('CONTROLE DO ORÁCULO DA CATRACA — o que `visibility:hidden` no mutante deixa de ver');
  if (!fs.existsSync(ARQ)) { console.log('territorio/index.html não existe — rode `npm run build`'); process.exit(1); }
  const MUDO = !!process.env.QA_MUTANTE_MUDO;
  const ORACULO_B = process.env.QA_ORACULO === 'b';
  if (MUDO) console.log('  (defeito injetado: QA_MUTANTE_MUDO — o mutante não pinta nada)');
  if (ORACULO_B) console.log('  (defeito injetado: QA_ORACULO=b — o "oráculo A" passa a ser o B)');

  const nav = await chromium.launch({ args: ['--enable-unsafe-swiftshader'], executablePath: ABRIR.chromiumPath() });
  const aux = await nav.newPage(); await aux.goto('about:blank');
  const permitidos = CENSO.permitidosDaPagina('territorio', fs.readFileSync(ARQ, 'utf8'));
  const doPasso2 = (e) => /contêiner já provado/.test(e.motivo || '');
  const m = {};

  for (const nome of Object.keys(CASOS)) {
    const arg = MUDO ? { estilo: '.qaNaoExiste{color:#f00}' } : CASOS[nome];
    const pg = await abrirPagina(nav);
    await excluir(pg);
    let r = null;
    try { r = await pg.evaluate(injetar, arg); } catch (e) { ok(false, nome + ': não injetou — ' + e.message); await pg.close(); continue; }
    const c48 = recortar(r, 48), c400 = recortar(r, 400);
    const a48 = await pg.screenshot({ clip: c48 });
    const a400 = await pg.screenshot({ clip: c400 });
    const estranhos = await pg.evaluate(CENSO.censoDoQuadro, [L, A, permitidos, CENSO.SELETOR_INTERATIVO]);
    // O PISO, cobrado aqui como lá: duas fotos do mesmo recorte, sem mexer em nada.
    const p48 = await diferenca(aux, a48, await pg.screenshot({ clip: c48 }));
    const p400 = await diferenca(aux, a400, await pg.screenshot({ clip: c400 }));
    // ORÁCULO A — o da catraca: `visibility:hidden` no próprio mutante.
    await pg.evaluate((b) => {
      if (b) { const st = document.getElementById('qaEstilo'); if (st) st.disabled = true; }
      else window.__qaFuga.style.visibility = 'hidden';
    }, ORACULO_B);
    const oa48 = await pg.screenshot({ clip: c48 });
    const oa400 = await pg.screenshot({ clip: c400 });
    // ORÁCULO B — desliga a FOLHA injetada: não depende de herança nenhuma.
    await pg.evaluate(() => {
      window.__qaFuga.style.visibility = '';
      const st = document.getElementById('qaEstilo'); if (st) st.disabled = true;
    });
    const ob48 = await pg.screenshot({ clip: c48 });
    const ob400 = await pg.screenshot({ clip: c400 });
    await pg.close();
    m[nome] = {
      a48: await diferenca(aux, a48, oa48), a400: await diferenca(aux, a400, oa400),
      b48: await diferenca(aux, a48, ob48), b400: await diferenca(aux, a400, ob400),
      p48, p400, recusa: estranhos.some(doPasso2),
    };
    const v = m[nome];
    console.log('  ' + nome.padEnd(14) + ' oráculoA(48)=' + String(v.a48).padStart(5)
      + '  oráculoB(48)=' + String(v.b48).padStart(5) + '  oráculoB(400)=' + String(v.b400).padStart(5)
      + '  piso=' + v.p48 + '/' + v.p400 + '  censo=' + (v.recusa ? 'RECUSA' : 'ABSOLVE'));
  }
  await nav.close();

  const t = (n) => m[n] || {};
  ok(t('netoMarker').p48 === 0 && t('netoInvisivel').p48 === 0 && t('netoLonge').p48 === 0
    && t('netoMarker').p400 === 0 && t('netoLonge').p400 === 0,
  'PISO: os dois recortes (48 e 400) medem ZERO de ruído nos três casos');

  // ---- o contraponto: sem os truques, o oráculo da catraca VÊ, e a régua não
  ok(t('netoMarker').a48 > 0, 'CONTRAPONTO netoMarker: o oráculo `visibility:hidden` ENXERGA a tinta ('
    + t('netoMarker').a48 + ' px) — sem isto, "cego" abaixo não significaria nada');
  ok(t('netoMarker').recusa === false, 'CONTRAPONTO netoMarker: e o CENSO ABSOLVE — `::before::marker` '
    + '(o marcador do pseudo) não é olhado por `pintaMarcador` nem por `pseudoPinta`');

  // ---- FURO A: visibility é herdada, e herança se recusa
  ok(t('netoInvisivel').a48 === 0 && t('netoInvisivel').b48 > 0,
    'FURO A REGISTRADO: com `visibility:visible` no pseudo, o oráculo da catraca lê '
    + t('netoInvisivel').a48 + ' px e a tinta do PRÓPRIO mutante é de ' + t('netoInvisivel').b48
    + ' px — "por construção, exatamente os pixels que aquele elemento pinta" não vale'
    + (t('netoInvisivel').a48 !== 0 ? '  <- o oráculo passou a ver: se foi conserto, apague este registro' : ''));

  // ---- FURO B: a tinta que cai fora do recorte de 48
  ok(t('netoLonge').a48 === 0 && t('netoLonge').b400 > 0,
    'FURO B REGISTRADO: com o marcador a 330 px da caixa, o recorte de 48 lê '
    + t('netoLonge').a48 + ' px e o de 400 conta ' + t('netoLonge').b400 + ' px'
    + (t('netoLonge').a48 !== 0 ? '  <- o recorte alargou: se foi conserto, apague este registro' : ''));

  ok(t('netoInvisivel').recusa === false && t('netoLonge').recusa === false,
    'os dois furos são SILENCIOSOS: o censo também absolve, então nada fica vermelho em lugar nenhum');

  if (falhas) { console.log('\nREPROVADO — ' + falhas + ' problema(s)'); process.exit(1); }
  console.log('\nok — os dois furos têm o tamanho registrado');
})();
