// PERCORRER O MENU POR TOQUE REAL — a queixa do dono e' "o menu ainda esta estranho ao passar
// de alguns itens", e ela e' ambigua. Este instrumento nao adivinha: ele TOCA, um passo por
// vez, fotografa cada tela e MEDE o que a regua do menu (DIRECAO.md) manda medir —
// raio de canto, altura de cada item, se a lista rola, se sobra ou falta, e quem esta no
// topo em cada ponto.
//
//   node test/percorrer-menu.js [tag]        (tag entra no nome do print: M-<tag>-*.png)
//   JOGO_HTML=test/_antes.html node test/percorrer-menu.js A
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const TAG = (process.argv[2] || 'A').toUpperCase();
const dir = __dirname;
let passo = 0;

(async () => {
  const file = ABRIR('file://' + path.resolve(process.env.JOGO_HTML || path.join(dir, '..', 'index.html')));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const erros = [];
  page.on('pageerror', e => erros.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('CONSOLE ' + m.text()); });
  await page.goto(file);
  await page.waitForTimeout(1400);

  const foto = async (nome) => {
    passo++;
    const p = path.join(dir, 'M-' + TAG + '-' + String(passo).padStart(2, '0') + '-' + nome + '.png');
    await page.screenshot({ path: p });
    return path.basename(p);
  };
  const tocar = async (sel) => {
    const el = await page.$(sel);
    if (!el) return false;
    const b = await el.boundingBox();
    if (!b) return false;
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(420);
    return true;
  };
  const aberta = () => page.evaluate(() => {
    const t = Array.from(document.querySelectorAll('.tela')).filter(e => e.classList.contains('aberta'));
    return t.map(e => e.id);
  });

  // ---- estado: quatro capitulos abertos, para a lista de eras ficar cheia ----
  await page.evaluate(() => {
    if (typeof fecharTelas === 'function') fecharTelas();
    S.aberturas = MASCARA_EPOCAS; S.fechos = MASCARA_EPOCAS; S.marcos = MASCARA_MARCOS;
    S.travessias = MASCARA_TRAVESSIAS;
    S.cenario = 5; S.energiaTotal = 9000; S.fronteira = 6; S.energia = 9000;
    if (typeof salvar === 'function') salvar();
  });
  await page.waitForTimeout(300);
  console.log('boot ->', await foto('boot'), JSON.stringify(await aberta()));

  // ---- MENU pelo botao do rodape ----
  await tocar('#abrirMenu');
  console.log('MENU ->', await foto('menu'), JSON.stringify(await aberta()));

  // ---- JOGAR -> a lista de eras ----
  await tocar('#btnJogar');
  console.log('JOGAR ->', await foto('capitulos'), JSON.stringify(await aberta()));

  // A REGUA, medida na lista de eras
  const reg = await page.evaluate(() => {
    const lista = document.getElementById('listaCapitulos');
    const cs = getComputedStyle(lista);
    const itens = Array.from(lista.querySelectorAll('.capItem')).map(function (b) {
      const s = getComputedStyle(b);
      const r = b.getBoundingClientRect();
      return {
        classe: b.className.replace('capItem', '').trim() || '(aberta)',
        alt: Math.round(r.height), topo: Math.round(r.top),
        raio: s.borderRadius, fundo: s.backgroundImage.slice(0, 42),
        cor: s.color, sombra: s.boxShadow.split(',').length + ' camadas',
        rotulo: (b.querySelector('.capNome canvas') ? 'bitmap' : 'texto'),
        rotuloLarg: (function () { const c = b.querySelector('.capNome canvas'); return c ? c.width + 'x' + c.height : '-'; })(),
        escala: (function () { const c = b.querySelector('.capNome canvas'); if (!c) return '-'; const rr = c.getBoundingClientRect(); return (rr.width / c.width).toFixed(3); })()
      };
    });
    const volta = document.getElementById('btnVoltarCap').getBoundingClientRect();
    return {
      itens: itens,
      lista: { alt: Math.round(lista.getBoundingClientRect().height), rolo: lista.scrollHeight,
        rola: lista.scrollHeight > lista.clientHeight + 1, maxH: cs.maxHeight, larg: cs.width,
        barra: lista.offsetWidth - lista.clientWidth },
      voltar: { topo: Math.round(volta.top), alt: Math.round(volta.height), visivel: volta.bottom <= 844 },
      vh: window.innerHeight
    };
  });
  console.log('REGUA lista de eras:', JSON.stringify(reg, null, 1));

  // ---- estado de TOQUE de cada cartao: a regua manda descer 4px e o degrau sumir ----
  const toque = await page.evaluate(() => {
    const out = [];
    ['.capItem.livre', '.capItem.preso', '.capItem'].forEach(function (sel) {
      const b = document.querySelector(sel); if (!b) return;
      const antes = getComputedStyle(b);
      out.push({ sel: sel, classe: b.className, transformNormal: antes.transform, sombraNormal: antes.boxShadow.slice(-40) });
    });
    return out;
  });
  console.log('TOQUE (repouso):', JSON.stringify(toque));

  // ---- tocar numa era JA VENCIDA e ver o que acontece (o B1 do QA) ----
  const antesCena = await page.evaluate(() => ({ cena: S.cenario, ep: epocaAtual() }));
  const alvo = await page.$$('.capItem');
  if (alvo.length > 1) {
    const b = await alvo[1].boundingBox();
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(500);
  }
  console.log('tocar PALMARES ->', await foto('apos-tocar-era'), JSON.stringify(await aberta()),
    JSON.stringify(await page.evaluate(() => ({ cena: S.cenario, ep: epocaAtual() }))), 'antes:', JSON.stringify(antesCena));
  await page.waitForTimeout(2500);
  console.log('  2,5 s depois ->', await foto('era-2500ms'), JSON.stringify(await aberta()),
    JSON.stringify(await page.evaluate(() => ({ cena: S.cenario, ep: epocaAtual() }))));

  // ---- volta ao menu e passa pelas outras portas ----
  await page.evaluate(() => fecharTelas());
  await page.waitForTimeout(300);
  await tocar('#abrirMenu');
  await tocar('#btnJogar');
  await tocar('#btnVoltarCap');
  console.log('VOLTAR da lista ->', await foto('voltar-da-lista'), JSON.stringify(await aberta()));

  await tocar('#btnCompletude');
  console.log('A HISTORIA ->', await foto('historia'), JSON.stringify(await aberta()));
  await tocar('#btnVoltarComp');
  console.log('VOLTAR ->', await foto('voltar-da-historia'), JSON.stringify(await aberta()));

  await tocar('#btnFontes');
  console.log('DE ONDE VEM ->', await foto('fontes'), JSON.stringify(await aberta()));
  await tocar('#btnVoltarFontes');
  console.log('VOLTAR ->', await foto('voltar-das-fontes'), JSON.stringify(await aberta()));

  await tocar('#btnConfig');
  console.log('AJUSTES ->', await foto('ajustes'), JSON.stringify(await aberta()));
  await tocar('#btnVoltarCfg');
  console.log('VOLTAR ->', await foto('voltar-dos-ajustes'), JSON.stringify(await aberta()));

  // ---- MELHORIAS, que e' irma do menu e tem que falar a mesma lingua ----
  await page.evaluate(() => fecharTelas());
  await page.waitForTimeout(250);
  await tocar('#openUpgrades');
  console.log('MELHORIAS ->', await foto('melhorias'), JSON.stringify(await aberta()));

  console.log('erros de console:', erros.length ? erros : 'nenhum');
  await browser.close();
})();
