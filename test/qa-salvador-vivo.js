// SALVADOR MEDIDA NO JOGO VIVO — o QA tentando derrubar a entrega, não confirmá-la.
//
// Escrito em 04/09 contra `entrega/salvador-fala-abertura`. As três alegações que este arquivo
// ataca, e por que nenhuma delas se resolve lendo código:
//
//  1. "O drop de SALVADOR deixou de ser objeto de culto." — o portão do autor mede a FONTE e o
//     PACOTE. Aqui a medida é outra: qual imagem o jogo TEM NA MÃO (`DROP_SPR[capArte()]`)
//     depois de o pacote chegar de verdade, e qual imagem `dropDe(tipo)` devolve para cada um
//     dos três tipos que `concluirAlcance()` solta. É o caminho da pessoa, não o do arquivo.
//
//  2. "A economia não mudou." — alegação de "não mexi", que se prova recolhendo. Este arquivo
//     chama `coletarDrop()` nos três tipos, em SALVADOR e no capítulo 1, com U2 desligado,
//     com U2 ligado e pelo caminho automático (o do U3), e imprime o delta de `S.energia`,
//     `S.energiaTotal` e de cada contador de `S.recursos`. Se a troca de arte tivesse
//     encostado no valor, no recurso ou na faixa, sai aqui como número diferente.
//
//  3. "Apagar os três nomes da fala fecharia a porta AS PALAVRAS DAQUI para três verbetes
//     (7 → 4)." — reproduzida com instrumento próprio: troca `EPOCAS[i].abertura[4]` em
//     memória, ZERA `capPalavrasCache` (sem isso o segundo cálculo devolve o primeiro, e o
//     instrumento mediria a si mesmo) e recalcula, imprimindo os TÍTULOS, não só a contagem.
//     Mede também se os três sobrariam órfãos de TODA porta de capítulo, que é a pergunta que
//     a contagem de SALVADOR sozinha não responde.
//
//   node test/qa-salvador-vivo.js

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const RAIZ = path.resolve(__dirname, '..');
const OBJ = path.join(RAIZ, 'assets', 'objetos');
const ALVO = ABRIR('file://' + path.resolve(RAIZ, process.env.JOGO_HTML || 'index.html'));
const RITUAL = { 'drop-cap4-1': 'acarajé', 'drop-cap4-2': 'pano da costa', 'drop-cap4-3': 'búzios' };
const TRABALHO = { 'drop-cap4-tabuleiro': 'tabuleiro', 'drop-cap4-balde': 'balde', 'drop-cap4-trouxa': 'trouxa' };
const LIMIAR = 12;

// A fala de hoje, a proposta do PENDENTES 107 (sem os três nomes) e a fala ANTIGA — as três
// redações entram por aqui, em texto, para o casamento ser medido e não jurado.
const PROPOSTA = "Pela ladeira vem tabuleiro, barril d'água e trouxa de roupa — o trabalho da rua, e é ele que fica no chão: os mesmos três contadores de sempre.";
const ANTIGA = "Pela ladeira vem tabuleiro, barril d'água e trouxa de roupa — o trabalho da rua. No chão ficam acarajé, pano da costa e búzios, e são os mesmos três contadores de sempre.";

let falhas = 0;
function ok(cond, msg) { console.log((cond ? '  ok    ' : '  FALHA ') + msg); if (!cond) falhas++; }

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const erros = [], ignorados = [];
  page.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
  // A MEDIÇÃO ANÔNIMA (us.i.posthog.com) não sobe de dentro de um sandbox com proxy, e o
  // pedido morre em ERR_TUNNEL_CONNECTION_FAILED. Isso é a MÁQUINA, não o jogo — o §3 do
  // CLAUDE.md manda justamente que o jogo não dependa dela. Contar esse erro como falha faria
  // este instrumento reprovar sempre nesta máquina, que é o jeito mais rápido de um portão
  // virar decoração. Ele é impresso e não conta.
  const REDE_EXTERNA = /posthog|ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY/;
  page.on('console', m => { if (m.type() === 'error') (REDE_EXTERNA.test(m.text()) ? ignorados : erros).push('CONSOLE: ' + m.text()); });
  await page.goto(ALVO);
  await page.waitForTimeout(900);

  // pelo caminho da pessoa: o botão JOGAR, não um atalho (lição 2.1 do EQUIPE.md)
  const b = await page.locator('#btnJogar').boundingBox();
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(700);
  await page.evaluate(() => { if (typeof encerrarFala === 'function') encerrarFala(); fecharTelas(); fecharTudo(); });
  await page.waitForTimeout(300);

  // ---------------------------------------------------------------- 1. o que está no chão
  const ida = await page.evaluate(() => {
    const ep = iEp('salvador');
    S.cenario = cenarioDaEpoca(ep); S.fronteira = S.cenario;
    S.energiaTotal = LIMIAR_CENA * S.cenario + 10; S.energia = S.energiaTotal;
    S.u2 = false; S.u3 = false;
    if (typeof encerrarFala === 'function') encerrarFala();
    fecharTelas(); fecharTudo();
    garantirEpoca(ep);
    return { ep, arteCap: capArte(), nomeEp: EPOCAS[ep].nome || EPOCAS[ep].id };
  });
  await page.waitForFunction(() => {
    const l = DROP_SPR[capArte()];
    return !!l && l.length > 0 && l.every(im => im.complete && im.naturalWidth > 0);
  }, null, { timeout: 20000 });
  console.log('SALVADOR = época ' + ida.ep + ' (' + ida.nomeEp + ') · capArte() = ' + ida.arteCap);

  // as URIs que o jogo TEM NA MÃO para cada tipo que concluirAlcance() solta
  const vivo = await page.evaluate(() => {
    const tipos = ['smog', 'barrel', 'cash'];
    const l = DROP_SPR[capArte()];
    return {
      bloco: l.map(im => ({ src: im.src, dim: im.naturalWidth + 'x' + im.naturalHeight })),
      porTipo: tipos.map(t => {
        const im = dropDe(t);
        return { t, src: im ? im.src : null, dim: im ? im.naturalWidth + 'x' + im.naturalHeight : null, recurso: RECURSO_DE[t] || null };
      })
    };
  });

  // assinatura por pixel das imagens VIVAS contra as artes ritual e de trabalho
  const refs = [];
  for (const n of Object.keys(RITUAL)) refs.push({ nome: 'RITUAL:' + RITUAL[n], uri: 'data:image/webp;base64,' + fs.readFileSync(path.join(OBJ, n + '.webp')).toString('base64') });
  for (const n of Object.keys(TRABALHO)) refs.push({ nome: 'ok:' + TRABALHO[n], uri: 'data:image/webp;base64,' + fs.readFileSync(path.join(OBJ, n + '.webp')).toString('base64') });
  const ass = await page.evaluate(async function (a) {
    async function sig(u) {
      const im = new Image(); im.src = u; await im.decode();
      const c = document.createElement('canvas'); c.width = 16; c.height = 16;
      const x = c.getContext('2d');
      x.fillStyle = '#808080'; x.fillRect(0, 0, 16, 16);
      x.imageSmoothingEnabled = true; x.drawImage(im, 0, 0, 16, 16);
      const d = x.getImageData(0, 0, 16, 16).data; const v = [];
      for (let i = 0; i < d.length; i += 4) v.push(d[i], d[i + 1], d[i + 2]);
      return v;
    }
    const R = []; for (const r of a.refs) R.push(await sig(r.uri));
    const V = []; for (const u of a.vivas) V.push(await sig(u));
    function dist(p, q) { let s = 0; for (let i = 0; i < p.length; i++) s += Math.abs(p[i] - q[i]); return s / p.length; }
    return V.map(v => R.map(r => dist(v, r)));
  }, { refs, vivas: vivo.porTipo.map(p => p.src) });

  console.log('\no que o jogo VIVO tem na mão, por tipo de quem atravessa a rua:');
  vivo.porTipo.forEach(function (p, i) {
    const d = ass[i];
    const menor = d.indexOf(Math.min.apply(null, d));
    console.log('  ' + p.t.padEnd(7) + ' → ' + p.dim.padEnd(8) + ' contador "' + p.recurso + '"  ·  mais parecido com ' + refs[menor].nome + ' (' + d[menor].toFixed(1) + ')');
    refs.forEach(function (r, k) {
      if (r.nome.indexOf('RITUAL:') === 0) ok(d[k] > LIMIAR, 'o que cai por ' + p.t + ' não é ' + r.nome.slice(7) + ' (distância ' + d[k].toFixed(1) + ')');
    });
  });

  // ---------------------------------------------------------------- 2. a economia
  const eco = await page.evaluate(() => {
    const tipos = ['smog', 'barrel', 'cash'];
    function medir(auto, u2) {
      S.u2 = u2;
      const out = {};
      tipos.forEach(function (t) {
        const e0 = S.energia, tt0 = S.energiaTotal, r0 = JSON.parse(JSON.stringify(S.recursos));
        coletarDrop({ wx: worldX + 40, type: t, t: 0, valor: CFG.dropBase * bonusDias() }, auto);
        const dr = {};
        Object.keys(S.recursos).forEach(function (k) { const d = (S.recursos[k] || 0) - (r0[k] || 0); if (d) dr[k] = d; });
        out[t] = { energia: +(S.energia - e0).toFixed(3), total: +(S.energiaTotal - tt0).toFixed(3), recursos: dr };
      });
      return out;
    }
    const antes = { cenario: S.cenario, ep: epocaAtual() };
    const salvador = { mao: medir(false, false), maoU2: medir(false, true), auto: medir(true, false) };
    // o mesmo, no capítulo 1 — se a faixa dependesse do capítulo, sairia diferente aqui
    S.cenario = 0; S.fronteira = 0; S.energiaTotal = 10; S.energia = 10; garantirEpoca(0);
    const cap1 = { mao: medir(false, false), maoU2: medir(false, true), auto: medir(true, false) };
    S.cenario = antes.cenario;
    return {
      salvador, cap1,
      cfg: { dropBase: CFG.dropBase, valorDropU2: CFG.valorDropU2, dropAutoValor: CFG.dropAutoValor, bonusDias: bonusDias() },
      recursoDe: RECURSO_DE, dropIdx: DROP_IDX, dropTarget: DROP_TARGET
    };
  });
  console.log('\na economia, recolhida de verdade (CFG.dropBase=' + eco.cfg.dropBase + ' · valorDropU2=' + eco.cfg.valorDropU2 +
    ' · dropAutoValor=' + eco.cfg.dropAutoValor + ' · bonusDias=' + eco.cfg.bonusDias + '):');
  ['mao', 'maoU2', 'auto'].forEach(function (via) {
    ['smog', 'barrel', 'cash'].forEach(function (t) {
      const a = eco.salvador[via][t], c = eco.cap1[via][t];
      const igual = a.energia === c.energia && a.total === c.total && JSON.stringify(a.recursos) === JSON.stringify(c.recursos);
      console.log('  ' + via.padEnd(6) + ' ' + t.padEnd(7) + ' SALVADOR +' + String(a.energia).padStart(5) + ' energia, ' + JSON.stringify(a.recursos) +
        '   | cap1 +' + String(c.energia).padStart(5) + ' ' + JSON.stringify(c.recursos));
      ok(igual, 'o drop ' + t + ' por ' + via + ' rende em SALVADOR o mesmo que no capítulo 1');
    });
  });
  ok(JSON.stringify(eco.recursoDe) === JSON.stringify({ smog: 'flor', barrel: 'agua', cash: 'refeicao' }), 'RECURSO_DE intocado: ' + JSON.stringify(eco.recursoDe));
  ok(JSON.stringify(eco.dropIdx) === JSON.stringify({ smog: 0, barrel: 1, cash: 2 }), 'DROP_IDX intocado: ' + JSON.stringify(eco.dropIdx));

  // ---------------------------------------------------------------- 3. a porta das palavras
  const pal = await page.evaluate(function (a) {
    const ep = iEp('salvador');
    const original = EPOCAS[ep].abertura[4];
    function calcular() {
      capPalavrasCache = null;                     // sem isto o segundo cálculo devolve o primeiro
      const todos = capPalavrasCalcular();
      return {
        salvador: todos[ep].map(i => GLOSSARIO[i].t),
        onde: {}, todos: todos.map(l => l.map(i => GLOSSARIO[i].t))
      };
    }
    const r = {};
    r.hoje = calcular();
    EPOCAS[ep].abertura[4] = a.proposta; r.proposta = calcular();
    EPOCAS[ep].abertura[4] = a.antiga; r.antiga = calcular();
    EPOCAS[ep].abertura[4] = original; r.restaurada = calcular();
    r.texto = original;
    r.tamanho = original.length;
    return r;
  }, { proposta: PROPOSTA, antiga: ANTIGA });

  function ondeAparece(todos, termo) {
    const o = [];
    todos.forEach(function (l, i) { if (l.indexOf(termo) >= 0) o.push(i); });
    return o;
  }
  console.log('\na porta AS PALAVRAS DAQUI de SALVADOR, recalculada em memória:');
  ['hoje', 'proposta', 'antiga', 'restaurada'].forEach(function (k) {
    console.log('  ' + k.padEnd(11) + pal[k].salvador.length + ' — ' + pal[k].salvador.join(', '));
  });
  const perdidos = pal.hoje.salvador.filter(t => pal.proposta.salvador.indexOf(t) < 0);
  console.log('  o que a proposta sem os nomes perderia: ' + (perdidos.join(', ') || '(nada)'));
  ['PANO DA COSTA', 'ACARAJÉ', 'BÚZIOS'].forEach(function (t) {
    const naSalvador = pal.hoje.salvador.indexOf(t) >= 0;
    const outras = ondeAparece(pal.proposta.todos, t);
    ok(naSalvador, 'com a fala aplicada, ' + t + ' é oferecido na porta de SALVADOR');
    console.log('        sem os nomes, ' + t + ' aparece na porta de ' + (outras.length ? outras.join(',') : 'NENHUM capítulo'));
  });
  ok(pal.hoje.salvador.length === pal.restaurada.salvador.length, 'o instrumento devolve o mesmo número ao restaurar (controle de cache: ' + pal.hoje.salvador.length + ' → ' + pal.restaurada.salvador.length + ')');
  console.log('  fala aplicada, ' + pal.tamanho + ' caracteres:\n    ' + pal.texto);

  if (ignorados.length) console.log('\n(erro de console ignorado, é a máquina e não o jogo: ' + ignorados[0] + ')');
  if (erros.length) { console.error('ERROS DE CONSOLE:\n' + erros.join('\n')); falhas++; }
  await browser.close();
  console.log(falhas ? '\n' + falhas + ' FALHA(S)' : '\ntudo verde');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
