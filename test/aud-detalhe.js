// Detalhe da auditoria: assinaturas completas do papel + quase-duplicatas de cor.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/'));
(async () => {
  // quase-duplicatas na paleta declarada
  const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'estilo.css'), 'utf8');
  const uniq = [...new Set((css.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []).map(h => h.toLowerCase()))];
  const rgb = (h) => { if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]; };
  const pares = [];
  for (let i = 0; i < uniq.length; i++) for (let j = i + 1; j < uniq.length; j++) {
    const a = rgb(uniq[i]), b = rgb(uniq[j]);
    const d = Math.max(Math.abs(a[0]-b[0]), Math.abs(a[1]-b[1]), Math.abs(a[2]-b[2]));
    if (d <= 6) pares.push(uniq[i] + ' ~ ' + uniq[j] + ' (Δmax ' + d + ')');
  }
  console.log('QUASE-DUPLICATAS (Δ por canal <= 6): ' + pares.length);
  pares.forEach(p => console.log('  ' + p));

  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await pg.goto(ALVO); await pg.waitForTimeout(1200);
  await pg.evaluate(() => {
    abrirFala('X', 'x', ['x'], null); fecharTelas();
    S.cenario = 2; S.energiaTotal = 100; montarCompletude(); montarFontes(); montarFim();
    abrirTela('telaFim');
  });
  await pg.waitForTimeout(500);
  const r = await pg.evaluate(() => {
    const dump = (sel) => {
      const e = document.querySelector(sel);
      if (!e) return sel + ': AUSENTE';
      const cs = getComputedStyle(e);
      return sel + '\n  radius ' + cs.borderRadius + ' | pad ' + cs.padding + '\n  shadow ' + cs.boxShadow;
    };
    return ['#falaCaixa', '#retorno', '#telaConfig #cfgInfo', '.ltMomento', '.fnItem',
            '.fimLin', '.fimLin.falta', '.qBalao', '#btnFimHist', '#fimTit'].map(dump).join('\n');
  });
  console.log('\n' + r);
  // o texto do fim: que fonte computada?
  const f = await pg.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('#fimTit'));
    const cb = getComputedStyle(document.querySelector('#btnFimHist'));
    const tem = (el) => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    return { fimTitTexto: tem(document.querySelector('#fimTit')), fimTitFonte: cs.fontFamily.split(',')[0] + ' ' + cs.fontWeight + ' ' + cs.fontSize,
             btnTexto: tem(document.querySelector('#btnFimHist')), btnFonte: cb.fontFamily.split(',')[0] + ' ' + cb.fontWeight + ' ' + cb.fontSize };
  });
  console.log('\nFIM: ' + JSON.stringify(f));
  await nav.close();
})();
