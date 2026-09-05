// AUDITORIA HOLÍSTICA (2026-08-09) — o que só aparece olhando o jogo INTEIRO.
// Não conserta nada; mede e fotografa. Prints: test/AUD-*.png
//
//   node test/aud-holistica.js
//
// Mede, por tela e no conjunto:
//   1. font-size / família / peso computados DISTINTOS em elementos visíveis com texto;
//   2. raios de canto computados distintos;
//   3. assinaturas de receita (box-shadow + 1ª camada de background) por família de
//      material (papel / madeira / pedra / ouro) — vocabulário duplicado é assinatura a mais;
//   4. luminância média, saturação média e temperatura (R−B) de cada pintura de capítulo,
//      recortada em COVER 390×844 — a escala em que ela é exibida.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', process.env.ALVO || 'index.html').split(path.sep).join('/'));
const OUT = (n) => path.join(__dirname, 'AUD-' + n + '.png');

// ---------- parte offline: a paleta declarada no CSS ----------
function analisarPaletaCSS() {
  const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'estilo.css'), 'utf8');
  const hex = (css.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []).map(h => h.toLowerCase());
  const uniq = [...new Set(hex)];
  const rgb = (h) => {
    if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  };
  const hsl = ([r, g, b]) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    let h = 0, s = 0;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [h, s * 100, l * 100];
  };
  const grupos = { quaseNegro: [], marromEscuro: [], marromMedio: [], marromClaro: [], ouro: [], papelCreme: [], pedraCinza: [], verde: [], vermelho: [], outro: [] };
  for (const c of uniq) {
    const [h, s, l] = hsl(rgb(c));
    if (l < 10) grupos.quaseNegro.push(c);
    else if (s < 14 && l >= 10) grupos.pedraCinza.push(c);
    else if (h >= 60 && h < 170) grupos.verde.push(c);
    else if ((h < 18 || h > 340) && s > 25) grupos.vermelho.push(c);
    else if (h >= 18 && h <= 55 && l >= 78) grupos.papelCreme.push(c);
    else if (h >= 30 && h <= 52 && l >= 55 && s >= 45) grupos.ouro.push(c);
    else if (h >= 18 && h <= 55 && l < 24) grupos.marromEscuro.push(c);
    else if (h >= 18 && h <= 55 && l < 45) grupos.marromMedio.push(c);
    else if (h >= 18 && h <= 55) grupos.marromClaro.push(c);
    else grupos.outro.push(c);
  }
  console.log('\n===== PALETA DECLARADA (src/estilo.css) =====');
  console.log('cores hex distintas: ' + uniq.length + '  (ocorrências: ' + hex.length + ')');
  for (const [g, lista] of Object.entries(grupos)) {
    if (lista.length) console.log('  ' + g.padEnd(12) + ' ' + String(lista.length).padStart(3) + '  ' + lista.join(' '));
  }
  return { uniq: uniq.length, grupos };
}

// ---------- parte viva ----------
(async () => {
  analisarPaletaCSS();

  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  pg.on('pageerror', e => console.log('PAGEERROR: ' + e.message));
  await pg.goto(ALVO);
  await pg.waitForTimeout(1400);

  // o varredor de tipografia/raio de uma tela
  const varrer = (rotulo) => pg.evaluate((rotulo) => {
    const vis = (e) => {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      const b = e.getBoundingClientRect();
      return b.width > 0 && b.height > 0;
    };
    const temTexto = (e) => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    const fontes = {}, familias = {}, pesos = {}, raios = {};
    document.querySelectorAll('body *').forEach((e) => {
      if (!vis(e)) return;
      const cs = getComputedStyle(e);
      const nome = (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') || e.tagName;
      if (temTexto(e)) {
        const fs = Math.round(parseFloat(cs.fontSize) * 2) / 2;
        (fontes[fs] = fontes[fs] || new Set()).add(nome);
        const fam = cs.fontFamily.split(',')[0].replace(/"/g, '').trim();
        (familias[fam] = familias[fam] || new Set()).add(nome);
        (pesos[cs.fontWeight] = pesos[cs.fontWeight] || new Set()).add(nome);
      }
      const br = cs.borderRadius;
      if (br && br !== '0px' && (cs.boxShadow !== 'none' || cs.backgroundImage !== 'none' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)')) {
        (raios[br] = raios[br] || new Set()).add(nome);
      }
    });
    const s = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, [...v].slice(0, 4)]));
    return { rotulo, fontes: s(fontes), familias: s(familias), pesos: s(pesos), raios: s(raios) };
  }, rotulo);

  const telas = [];
  const foto = (n) => pg.screenshot({ path: OUT(n) });

  // 1 · MENU (boot)
  telas.push(await varrer('menu')); await foto('menu');

  // 2 · CAIXA DE FALA
  await pg.evaluate(() => { abrirFala('PINDORAMA', 'muito antes de 1500', ['Uma linha de medida para a auditoria ler o corpo do texto no papel de campo.'], null); });
  await pg.waitForTimeout(900);
  telas.push(await varrer('fala')); await foto('fala');

  // 3 · RUA (HUD + rodapé) — com os nichos de drop visíveis (a subtração da onda 11 os esconde a zero)
  await pg.evaluate(() => { fecharTelas(); S.folhas = 3; S.agua = 2; S.sementes = 1; });
  await pg.waitForTimeout(700);
  telas.push(await varrer('rua')); await foto('rua');

  // 4 · MELHORIAS (bandeja aberta)
  await pg.evaluate(() => { document.getElementById('sheetUpgrades').classList.add('aberto'); });
  await pg.waitForTimeout(400);
  telas.push(await varrer('melhorias')); await foto('melhorias');
  await pg.evaluate(() => { document.getElementById('sheetUpgrades').classList.remove('aberto'); });

  // 5 · ERAS
  await pg.evaluate(() => { montarCapitulos(); abrirTela('telaCapitulos'); });
  await pg.waitForTimeout(600);
  telas.push(await varrer('eras')); await foto('eras');

  // 6 · AJUSTES
  await pg.evaluate(() => { montarConfig(); abrirTela('telaConfig'); });
  await pg.waitForTimeout(600);
  telas.push(await varrer('ajustes')); await foto('ajustes');

  // 7 · A HISTÓRIA (quadrinho) — fim de jogo, tudo aberto
  await pg.evaluate(() => { S.cenario = 2; S.energiaTotal = 100; montarCompletude(); abrirTela('telaCompletude'); });
  await pg.waitForTimeout(900);
  telas.push(await varrer('historia'));
  await foto('historia-p1');
  await pg.evaluate(() => { const el = document.getElementById('listaCenas'); el.style.scrollSnapType = 'none'; el.scrollTop = el.clientHeight * 13; });
  await pg.waitForTimeout(500); await foto('historia-p14');

  // 8 · DE ONDE VEM (fontes)
  await pg.evaluate(() => { montarFontes(); abrirTela('telaFontes'); });
  await pg.waitForTimeout(600);
  telas.push(await varrer('fontes')); await foto('fontes');

  // 9 · A CHEGADA
  await pg.evaluate(() => { montarFim(); abrirTela('telaFim'); });
  await pg.waitForTimeout(600);
  telas.push(await varrer('chegada')); await foto('chegada');

  // ---------- consolidação tipográfica ----------
  const uniao = { fontes: {}, familias: {}, pesos: {}, raios: {} };
  for (const t of telas) {
    for (const dim of ['fontes', 'familias', 'pesos', 'raios']) {
      for (const [k, exemplos] of Object.entries(t[dim])) {
        (uniao[dim][k] = uniao[dim][k] || { telas: new Set(), exemplos: new Set() });
        uniao[dim][k].telas.add(t.rotulo);
        exemplos.forEach(e => uniao[dim][k].exemplos.add(e));
      }
    }
  }
  console.log('\n===== TIPOGRAFIA E RAIO — computados, elementos visíveis =====');
  for (const t of telas) {
    console.log('  ' + t.rotulo.padEnd(10) + ' tamanhos: ' + Object.keys(t.fontes).length +
      '  famílias: ' + Object.keys(t.familias).length + '  pesos: ' + Object.keys(t.pesos).length +
      '  raios: ' + Object.keys(t.raios).length);
  }
  const lista = (dim, ordenaNum) => {
    const ks = Object.keys(uniao[dim]).sort((a, b) => ordenaNum ? parseFloat(a) - parseFloat(b) : a.localeCompare(b));
    console.log('\n-- ' + dim.toUpperCase() + ' no conjunto: ' + ks.length + ' valores distintos --');
    for (const k of ks) {
      const u = uniao[dim][k];
      console.log('  ' + String(k).padEnd(8) + ' [' + [...u.telas].join(',') + ']  ex: ' + [...u.exemplos].slice(0, 5).join(' · '));
    }
  };
  lista('fontes', true); lista('familias'); lista('pesos', true); lista('raios');

  // ---------- vocabulário: assinaturas de receita por material ----------
  const receitas = await pg.evaluate(() => {
    // garantir presença: fala + completude + fontes + fim já montadas; medir por querySelector
    const alvos = {
      papel: ['#falaCaixa', '#retorno', '#cfgInfo', '.ltMomento', '.fnItem', '.fimLin', '.qBalao'],
      madeira: ['.telaBtn', '#btnJogar', '.capItem', '.capItem.livre', '.ltMarco', '.telaTit', '#linhaEpoca', '.qAqui', '#btnFalaPular', '#telaMenu .telaTxt'],
      pedra: ['.rec', '.chip', '.cartao', '.sheet', '.upgrade', '.upgrade button'],
      ouro: ['#btnClique'],
    };
    const out = {};
    for (const [fam, sels] of Object.entries(alvos)) {
      out[fam] = [];
      for (const sel of sels) {
        const e = document.querySelector(sel);
        if (!e) { out[fam].push({ sel, ausente: true }); continue; }
        const cs = getComputedStyle(e);
        out[fam].push({ sel, radius: cs.borderRadius, shadow: cs.boxShadow, bg1: cs.backgroundImage.split('),')[0].slice(0, 60), pad: cs.padding });
      }
    }
    return out;
  });
  console.log('\n===== ASSINATURAS POR MATERIAL (box-shadow computado) =====');
  for (const [fam, itens] of Object.entries(receitas)) {
    const assin = {};
    for (const i of itens) {
      if (i.ausente) { console.log('  [' + fam + '] ' + i.sel + '  (ausente no DOM)'); continue; }
      (assin[i.shadow] = assin[i.shadow] || []).push(i.sel + ' (r=' + i.radius + ')');
    }
    console.log('  ' + fam.toUpperCase() + ': ' + Object.keys(assin).length + ' assinaturas de sombra em ' + itens.filter(i => !i.ausente).length + ' superfícies');
    Object.values(assin).forEach((v, n) => console.log('    #' + (n + 1) + '  ' + v.join(' · ')));
  }

  // ---------- as pinturas de capítulo, na escala de exibição ----------
  const pinturas = await pg.evaluate(async () => {
    const W = 390, H = 844;
    const lista = (typeof CENARIO_ALTO_B64 !== 'undefined') ? CENARIO_ALTO_B64 : [];
    const res = [];
    for (let i = 0; i < lista.length; i++) {
      const img = new Image();
      await new Promise((ok, ruim) => { img.onload = ok; img.onerror = ruim; img.src = lista[i]; });
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const cx = cv.getContext('2d');
      // COVER: casa a altura/largura como .qFundo e #fundoHD exibem
      const esc = Math.max(W / img.width, H / img.height);
      const dw = img.width * esc, dh = img.height * esc;
      cx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      const d = cx.getImageData(0, 0, W, H).data;
      let n = 0, luma = 0, sat = 0, temp = 0;
      for (let p = 0; p < d.length; p += 16) {   // 1 a cada 4 px
        const r = d[p], g = d[p + 1], b = d[p + 2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        luma += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        sat += mx ? (mx - mn) / mx : 0;
        temp += r - b; n++;
      }
      res.push({ i, w: img.width, h: img.height, luma: +(luma / n).toFixed(1), sat: +(100 * sat / n).toFixed(1), temp: +(temp / n).toFixed(1) });
    }
    return res;
  });
  console.log('\n===== PINTURAS DE CAPÍTULO — cover 390×844 (escala de exibição) =====');
  console.log('  idx  nativo      luma   sat%   R−B');
  for (const p of pinturas) {
    console.log('  ' + p.i + '    ' + (p.w + 'x' + p.h).padEnd(10) + '  ' + String(p.luma).padStart(5) + '  ' + String(p.sat).padStart(5) + '  ' + String(p.temp).padStart(6));
  }

  // montagem lado a lado para o print
  await pg.evaluate(async () => {
    const lista = (typeof CENARIO_ALTO_B64 !== 'undefined') ? CENARIO_ALTO_B64 : [];
    const cw = 110, ch = 238;
    const cv = document.createElement('canvas'); cv.width = cw * lista.length; cv.height = ch;
    const cx = cv.getContext('2d');
    for (let i = 0; i < lista.length; i++) {
      const img = new Image();
      await new Promise((ok) => { img.onload = ok; img.src = lista[i]; });
      const esc = Math.max(cw / img.width, ch / img.height);
      const dw = img.width * esc, dh = img.height * esc;
      cx.save(); cx.beginPath(); cx.rect(i * cw, 0, cw, ch); cx.clip();
      cx.drawImage(img, i * cw + (cw - dw) / 2, (ch - dh) / 2, dw, dh); cx.restore();
    }
    cv.id = 'audMontagem';
    cv.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;background:#000';
    document.body.appendChild(cv);
  });
  const clip = await pg.evaluate(() => { const c = document.getElementById('audMontagem'); const b = c.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; });
  await pg.screenshot({ path: OUT('pinturas-lado-a-lado'), clip });
  await nav.close();
  console.log('\nPrints em test/AUD-*.png — olhe, o número não conta se ficou bonito.');
})();
