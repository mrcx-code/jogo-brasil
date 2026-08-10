// MEDIR O MENU contra a REGUA DO MENU (DIRECAO.md): largura, borda esquerda/direita, altura,
// raio, alinhamento do rotulo e escala do bitmap, superficie por superficie. O menu principal
// e' o padrao-ouro; tudo aqui e' medido CONTRA ele.
//   node test/medir-menu.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const CAIXA = () => {
  window.__cx = function (sel, rot) {
    const e = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!e) return null;
    const r = e.getBoundingClientRect(), s = getComputedStyle(e);
    const cv = e.querySelector('canvas');
    return {
      o: rot, x: Math.round(r.left), dir: Math.round(r.right), larg: Math.round(r.width),
      alt: Math.round(r.height), raio: s.borderRadius,
      texto: s.textAlign, rotulo: cv ? (cv.width + 'x' + cv.height + ' @' + (cv.getBoundingClientRect().width / cv.width).toFixed(2) + 'x') : 'sem bitmap'
    };
  };
};
const mostra = (t, l) => {
  console.log('\n=== ' + t);
  l.filter(Boolean).forEach(function (c) {
    console.log('  ' + String(c.o).padEnd(26) + ' x ' + String(c.x).padStart(4) + '..' + String(c.dir).padStart(4) +
      '  larg ' + String(c.larg).padStart(4) + '  alt ' + String(c.alt).padStart(3) +
      '  raio ' + String(c.raio).padEnd(8) + ' texto ' + String(c.texto).padEnd(7) + ' rotulo ' + c.rotulo);
  });
};
(async () => {
  const file = ABRIR('file://' + path.resolve(process.env.JOGO_HTML || path.join(__dirname, '..', 'index.html')));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(file);
  await page.waitForTimeout(1400);
  await page.evaluate(CAIXA);
  await page.evaluate(() => {
    fecharTelas();
    S.aberturas = MASCARA_EPOCAS; S.fechos = MASCARA_EPOCAS; S.marcos = MASCARA_MARCOS;
    S.travessias = MASCARA_TRAVESSIAS; S.cenario = 5; S.energiaTotal = 9000; S.fronteira = 6;
  });

  await page.evaluate(() => { abrirTela('telaMenu'); });
  await page.waitForTimeout(300);
  mostra('MENU PRINCIPAL — o padrao-ouro', await page.evaluate(() => [
    window.__cx('#btnJogar', 'JOGAR'),
    window.__cx('#btnCompletude', 'A HISTORIA'), window.__cx('#btnFontes', 'DE ONDE VEM'),
    window.__cx('#btnConfig', 'AJUSTES')
  ]));

  for (const cen of [0, 2, 5]) {
    await page.evaluate((c) => { S.cenario = c; S.energiaTotal = 1500 * c + 40; fecharTelas(); montarCapitulos(); abrirTela('telaCapitulos'); }, cen);
    await page.waitForTimeout(250);
    mostra('ESCOLHA A ERA (cena ' + cen + ')', await page.evaluate(() => {
      const l = [window.__cx('#telaCapitulos .telaTit', 'titulo'), window.__cx('#listaCapitulos', 'a lista')];
      document.querySelectorAll('.capItem').forEach(function (b, i) {
        l.push(window.__cx(b, 'item ' + i + ' ' + (b.className.replace('capItem', '').trim() || 'aberta')));
      });
      l.push(window.__cx('#btnVoltarCap', 'VOLTAR'));
      return l;
    }));
  }

  // A TINTA CONTRA A TABUA: a regua do menu diz destaque por MATERIAL, e material so' se le se
  // a tinta vier dele. Aqui a luma media do rotulo e' comparada com a da tabua embaixo dele —
  // rotulo mais escuro que a tabua escura foi como o nome da era sumiu.
  await page.evaluate(() => { S.cenario = 5; S.energiaTotal = 9000; fecharTelas(); montarCapitulos(); abrirTela('telaCapitulos'); });
  await page.waitForTimeout(250);
  const tinta = await page.evaluate(() => {
    const luma = function (d) { let s = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 100) { s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++; } return n ? Math.round(s / n) : -1; };
    const doCanvas = function (cv) { if (!cv) return -1; return luma(cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data); };
    const doHex = function (h) { const m = /(\d+), (\d+), (\d+)/.exec(h); return m ? Math.round(0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3]) : -1; };
    return Array.from(document.querySelectorAll('.capItem')).map(function (b, i) {
      const s = getComputedStyle(b);
      return { i: i, tabua: (b.className.replace('capItem', '').trim() || 'escura'),
        lumaTabua: doHex(s.backgroundImage), lumaNome: doCanvas(b.querySelector('.capNome canvas')),
        lumaQuando: doCanvas(b.querySelector('.capQuando canvas')) };
    });
  });
  console.log('\n=== TINTA x TABUA na lista de eras');
  tinta.forEach(t => {
    const dn = Math.abs(t.lumaNome - t.lumaTabua), dq = Math.abs(t.lumaQuando - t.lumaTabua);
    console.log('  item ' + t.i + ' tabua ' + String(t.tabua).padEnd(7) +
      ' luma tabua ' + String(t.lumaTabua).padStart(3) +
      '  nome ' + String(t.lumaNome).padStart(3) + ' (d ' + String(dn).padStart(3) + ')' +
      '  quando ' + String(t.lumaQuando).padStart(3) + ' (d ' + String(dq).padStart(3) + ')' +
      (dn < 60 ? '  <<< NOME SEM SEPARACAO DA TABUA' : '') +
      (dq < 45 ? '  <<< QUANDO SEM SEPARACAO' : '') +
      (dq > dn ? '  <<< HIERARQUIA INVERTIDA: a linha de baixo le melhor que o nome' : ''));
  });

  await page.evaluate(() => { fecharTelas(); if (typeof montarConfig === 'function') montarConfig(); abrirTela('telaConfig'); });
  await page.waitForTimeout(250);
  mostra('AJUSTES', await page.evaluate(() => [
    window.__cx('#telaConfig .telaTit', 'titulo'), window.__cx('#cfgInfo', 'papel de info'),
    window.__cx('#btnSom', 'SOM'), window.__cx('#btnApagar', 'APAGAR'), window.__cx('#btnVoltarCfg', 'VOLTAR')
  ]));

  await page.evaluate(() => { fecharTelas(); montarFontes(); abrirTela('telaFontes'); });
  await page.waitForTimeout(250);
  mostra('DE ONDE VEM', await page.evaluate(() => {
    const l = [window.__cx('#telaFontes .telaTit', 'titulo'), window.__cx('#listaFontes', 'a lista'),
      window.__cx('#btnVoltarFontes', 'VOLTAR')];
    const lf = document.getElementById('listaFontes');
    if (lf) {
      const r = lf.getBoundingClientRect(), v = document.getElementById('btnVoltarFontes').getBoundingClientRect();
      l.push({ o: 'corte da lista', x: Math.round(r.bottom), dir: Math.round(v.top), larg: Math.round(v.top - r.bottom), alt: 0, raio: '-', texto: '-', rotulo: 'lista termina em ' + Math.round(r.bottom) + ', VOLTAR comeca em ' + Math.round(v.top) });
    }
    return l;
  }));

  await browser.close();
})();
