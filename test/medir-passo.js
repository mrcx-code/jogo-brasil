// MEDIR-PASSO — o que a tela ENSINA no passo a passo, medido em pixels.
//
// Três perguntas que o percurso levantou e que print sozinho não responde:
//   §A a caixa de papel: quanto dela fica VAZIA em cada fala, e o "toque para continuar"
//      está mesmo alcançável/visível na travessia?
//   §B a rua do capítulo 1: o que a pessoa vê ANTES de saber o que fazer — quantos px de
//      instrução existem, e a gaveta de melhorias avisa quando dá para comprar?
//   §C a barra de era e o rótulo: eles dizem para onde se está indo?
//
// Roda contra o index.html da RAIZ, sem build. node test/medir-passo.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const ALVO = 'file://' + path.resolve(__dirname, '..', process.env.JOGO_HTML || 'index.html');

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const erros = [];
  page.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('CONSOLE: ' + m.text()); });
  await page.goto(ALVO);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(900);

  const log = (...a) => console.log(...a);

  // ======================= §A · a caixa de papel =======================
  log('\n===== §A · A CAIXA DE PAPEL — quanto dela fica vazio =====');
  // mede TODA fala do jogo: abertura, fecho e travessia, linha a linha, sem tocar em nada
  const caixa = await page.evaluate(async () => {
    const out = [];
    const espera = ms => new Promise(r => setTimeout(r, ms));
    const conjuntos = [];
    EPOCAS.forEach((e, i) => { conjuntos.push({ nome: e.nome + ' · abertura', l: e.abertura }); conjuntos.push({ nome: e.nome + ' · fecho', l: e.fecho }); });
    TRAVESSIAS.forEach(t => conjuntos.push({ nome: t.nome, l: t.linhas }));
    for (const c of conjuntos) {
      fecharTelas();
      abrirFala(c.nome, '', c.l, null);
      abrirTela('telaFala');
      await espera(60);
      const cx = document.getElementById('falaCaixa');
      const palco = document.getElementById('falaPalco');
      const alturaCaixa = cx.getBoundingClientRect().height;
      // a altura NATURAL de cada linha sai do fantasma: cada filho dele é uma linha, todos
      // empilhados na mesma célula da grade, e cada um mede a sua própria caixa de texto.
      // ...e a altura tem que sair de um Range sobre o TEXTO: os filhos do fantasma são itens
      // de grade e a grade os estica todos para a célula, então medir a caixa deles devolve
      // sempre a mesma altura — a da linha mais alta, que é justamente o que se quer comparar.
      const alturas = [...document.getElementById('falaFantasma').children].map(d => {
        const rg = document.createRange(); rg.selectNodeContents(d);
        return Math.round(rg.getBoundingClientRect().height);
      });
      const palcoH = palco.getBoundingClientRect().height;
      out.push({
        nome: c.nome, n: c.l.length, caixa: Math.round(alturaCaixa), palco: Math.round(palcoH),
        min: Math.round(Math.min(...alturas)), max: Math.round(Math.max(...alturas)),
        med: Math.round(alturas.reduce((a, b) => a + b, 0) / alturas.length),
        vazioMedio: Math.round(100 * (1 - alturas.reduce((a, b) => a + b, 0) / alturas.length / palcoH)),
        vazioPior: Math.round(100 * (1 - Math.min(...alturas) / palcoH))
      });
      pararFala(); fecharTelas();
    }
    return out;
  });
  log('conjunto de falas               n  caixa palco  min  med  max  vazio médio  vazio pior');
  caixa.forEach(c => log(
    c.nome.padEnd(30).slice(0, 30) + String(c.n).padStart(3) + String(c.caixa).padStart(7) +
    String(c.palco).padStart(6) + String(c.min).padStart(5) + String(c.med).padStart(5) + String(c.max).padStart(5) +
    String(c.vazioMedio + '%').padStart(13) + String(c.vazioPior + '%').padStart(12)));

  // a seta "toque para continuar": existe, é visível, alguém a cobre?
  log('\n-- a única instrução da tela de fala: "toque para continuar" --');
  const seta = await page.evaluate(async () => {
    const espera = ms => new Promise(r => setTimeout(r, ms));
    const medir = (rotulo) => {
      const s = document.getElementById('falaSeta');
      const r = s.getBoundingClientRect();
      const cs = getComputedStyle(s);
      const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { rotulo, txt: s.textContent.trim(), op: cs.opacity, vis: cs.visibility, disp: cs.display,
        y: Math.round(r.y), h: Math.round(r.height), dentro: r.y + r.height <= innerHeight,
        quemEsta: el ? (el.id || el.className || el.tagName) : null };
    };
    const r = [];
    // fala normal
    fecharTelas(); abrirFala('X', '', EPOCAS[0].abertura, null); abrirTela('telaFala');
    await espera(500); if (falaTimer) terminarLinha(); await espera(80);
    r.push(medir('fala normal (pronta)'));
    pararFala(); fecharTelas();
    // travessia
    S.travessias = 0;
    correrTravessia('pindorama', 'palmares', null);
    abrirTela('telaFala');
    await espera(2500);
    if (emCerimonia()) fimCerimonia();
    await espera(500); if (falaTimer) terminarLinha(); await espera(80);
    r.push(medir('travessia (pronta)'));
    const b = document.getElementById('btnClique').getBoundingClientRect();
    const elB = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
    r.push({ rotulo: 'quem está no ponto do botão dourado, na travessia', quemEsta: elB ? (elB.id || elB.className) : null });
    fimTravessia(); pararFala(); fecharTelas();
    return r;
  });
  seta.forEach(s => log('  ' + JSON.stringify(s)));

  // ======================= §B · a rua sem instrução =======================
  log('\n===== §B · A RUA DO CAPÍTULO 1 — o que ensina o que fazer =====');
  await page.evaluate(() => { fecharTelas(); });
  await page.waitForTimeout(300);
  const rua = await page.evaluate(() => {
    const visivel = el => { if (!el) return false; const c = getComputedStyle(el); const r = el.getBoundingClientRect();
      return c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0.05 && r.width > 0 && r.height > 0; };
    const rotulo = el => el ? (el.getAttribute('aria-label') || el.textContent.trim()) : null;
    return {
      dicaSeta: { vis: visivel(document.getElementById('dicaSeta')), aria: document.getElementById('dicaSeta').getAttribute('aria-hidden') },
      sussurro: { txt: rotulo(document.getElementById('sussurroEra')), vis: visivel(document.getElementById('sussurroEra')) },
      marcoDist: { txt: rotulo(document.getElementById('marcoDist')), vis: visivel(document.getElementById('marcoDist')) },
      cartoes: [...document.querySelectorAll('#controls .cartao')].map(c => ({ id: c.id, n: rotulo(c.querySelector('.cn')), v: rotulo(c.querySelector('.cv')) })),
      botao: rotulo(document.getElementById('cliqueRotulo')),
      era: rotulo(document.getElementById('rotuloEpoca')),
      // TODO texto legível na tela do jogo (fora canvas)
      textoVisivel: [...document.querySelectorAll('#hudTop *, #controls *')].map(e => e.getAttribute('aria-label')).filter(Boolean)
    };
  });
  log('  dica de seta:', JSON.stringify(rua.dicaSeta), '| sussurro:', JSON.stringify(rua.sussurro), '| marco:', JSON.stringify(rua.marcoDist));
  log('  cartões:', JSON.stringify(rua.cartoes));
  log('  botão dourado:', rua.botao, '| era:', rua.era);
  log('  TODO rótulo legível na moldura do jogo:', rua.textoVisivel.join(' · '));

  // a gaveta de melhorias avisa quando dá para comprar?
  const gaveta = await page.evaluate(async () => {
    const espera = ms => new Promise(r => setTimeout(r, ms));
    const antes = { aberta: document.getElementById('sheetUpgrades').classList.contains('aberto'),
      pulsa: document.getElementById('openUpgrades').className };
    S.energia = 100000; S.energiaTotal = 100000;
    await espera(700);
    const dep = { aberta: document.getElementById('sheetUpgrades').classList.contains('aberto'),
      pulsa: document.getElementById('openUpgrades').className,
      selo: document.querySelectorAll('#openUpgrades .selo, #openUpgrades .aviso, .podeComprar').length,
      custos: [...document.querySelectorAll('#listaUp .upgrade:not(.oculta)')].map(u => ({ id: u.id, cls: u.className,
        btn: (u.querySelector('button').getAttribute('aria-label') || u.querySelector('button').textContent).trim() })) };
    S.energia = 0; S.energiaTotal = 0;
    return { antes, dep };
  });
  log('  gaveta com dinheiro sobrando -> aberta:', gaveta.dep.aberta, '| classe do cartão MELHORIAS:', JSON.stringify(gaveta.dep.pulsa), '| selo de aviso:', gaveta.dep.selo);
  gaveta.dep.custos.forEach(c => log('     ' + c.id + ' [' + c.cls + '] botão: ' + JSON.stringify(c.btn)));

  // ======================= §C · a barra de era =======================
  log('\n===== §C · A BARRA DE ERA — ela diz para onde se está indo? =====');
  const barra = await page.evaluate(() => {
    const r = [];
    for (const alvo of [0, 700, 1499, 1501, 2999, 5000, 10499, 10500]) {
      S.energiaTotal = alvo;
      const el = document.getElementById('barraEpocaFill');
      // força o HUD a redesenhar
      if (typeof atualizarHUD === 'function') atualizarHUD();
      r.push({ total: alvo, cena: S.cenario, era: EPOCAS[epocaAtual()].nome,
        prog: +(progressoCena() * 100).toFixed(1),
        larguraCSS: el.style.width || getComputedStyle(el).width,
        rotulo: document.getElementById('rotuloEpoca').getAttribute('aria-label') });
    }
    S.energiaTotal = 0;
    return r;
  });
  barra.forEach(b => log('  impacto ' + String(b.total).padStart(6) + ' -> ' + b.era.padEnd(11) + ' cena ' + b.cena + ' | barra ' + String(b.prog).padStart(5) + '% (' + b.larguraCSS + ') | rótulo ' + b.rotulo));

  log('\n===== ERROS =====');
  log(erros.length ? erros.join('\n') : '(nenhum)');
  await browser.close();
})().catch(e => { console.error('EXPLODIU:', e); process.exit(1); });
