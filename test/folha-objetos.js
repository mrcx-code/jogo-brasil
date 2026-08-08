// Folha de contato de TODO objeto de mundo, por capítulo, no TAMANHO DE TELA em que o jogo
// desenha cada um (MOB_TARGET / DROP_TARGET / a altura da vegetação de frente) e, ao lado,
// ampliado 3× para julgar o traço. Ao pé de cada um: luma e R−B (a "temperatura" da tinta).
// É o instrumento da queixa "imagens que não se conversam": arte que conversa tem tinta da
// mesma família; a que não conversa aparece como número fora da fila.
//
// node test/folha-objetos.js [index.html] [saida.png]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const ARQ = process.argv[2] || path.resolve(__dirname, '..', 'index.html');
const SAI = process.argv[3] || path.resolve(__dirname, 'OBJ-folha.png');

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 1180, height: 760 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto('file://' + path.resolve(ARQ));
  await page.waitForTimeout(1200);

  const dados = await page.evaluate(() => {
    function stat(img) {
      if (!img || !img.complete || !img.naturalWidth) return null;
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let l = 0, r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 128) continue;
        l += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
      }
      if (!n) return null;
      return { luma: +(l / n).toFixed(0), rb: Math.round((r - b) / n), src: c.toDataURL('image/png'),
               w: c.width, h: c.height };
    }
    const linhas = [];
    for (let e = 0; e < EPOCAS.length; e++) {
      S.cenario = cenarioDaEpoca(e); S.energiaTotal = LIMIAR_CENA * S.cenario + 10;
      const cap = capArte();
      const itens = [];
      ['smog', 'drum', 'cash'].forEach(function (k) {
        const im = MOB_SPR[k][cap] || MOB_SPR[k][0];
        const s = stat(im); if (!s) return;
        const alvo = MOB_TARGET[k === 'drum' ? 'drum' : k];
        itens.push(Object.assign(s, { nome: 'mob.' + k, alvoH: alvo }));
      });
      (DROP_SPR[cap] || DROP_SPR[0]).forEach(function (im, i) {
        const s = stat(im); if (!s) return;
        itens.push(Object.assign(s, { nome: 'drop.' + i, alvoH: DROP_TARGET }));
      });
      const bl = frenteBloco();
      if (bl >= 0) for (let i = 0; i < 8; i++) {
        const s = stat(FRENTE_SPR[bl + i]); if (!s) continue;
        itens.push(Object.assign(s, { nome: 'frente.' + i, alvoH: 26 }));
      }
      linhas.push({ nome: EPOCAS[e].nome, cap: cap, itens: itens });
    }
    S.cenario = 0;
    return linhas;
  });

  // desenha a folha numa página em branco
  await page.setContent('<body style="margin:0;background:#efe6d2;font:12px Georgia,serif;color:#241a10"><div id=raiz></div></body>');
  await page.evaluate((linhas) => {
    const raiz = document.getElementById('raiz');
    linhas.forEach(function (L) {
      const h = document.createElement('div');
      h.textContent = L.nome + '  (bloco de arte ' + L.cap + ')';
      h.style.cssText = 'font-weight:bold;padding:6px 10px 2px;font-size:14px';
      raiz.appendChild(h);
      const fila = document.createElement('div');
      fila.style.cssText = 'display:flex;gap:10px;padding:0 10px 8px;align-items:flex-end;flex-wrap:wrap';
      L.itens.forEach(function (it) {
        const cel = document.createElement('div');
        cel.style.cssText = 'text-align:center;width:104px';
        const esc = it.alvoH / it.h;
        // 3x o tamanho de tela: é assim que se julga traço sem inventar resolução
        const w3 = Math.round(it.w * esc * 3), h3 = Math.round(it.h * esc * 3);
        cel.innerHTML = '<div style="height:' + (h3 + 4) + 'px;display:flex;align-items:flex-end;justify-content:center">' +
          '<img src="' + it.src + '" style="width:' + w3 + 'px;height:' + h3 + 'px;image-rendering:pixelated">' +
          '</div><div style="font-size:10px;line-height:1.3">' + it.nome +
          '<br>L ' + it.luma + ' · R−B ' + (it.rb > 0 ? '+' : '') + it.rb + '</div>';
        fila.appendChild(cel);
      });
      raiz.appendChild(fila);
    });
  }, dados);
  await page.waitForTimeout(400);
  const alt = await page.evaluate(() => document.getElementById('raiz').scrollHeight);
  await page.setViewportSize({ width: 1180, height: Math.min(3000, alt + 20) });
  await page.waitForTimeout(200);
  await page.screenshot({ path: SAI, fullPage: true });

  console.log('=== R−B (temperatura) e luma por objeto ===');
  dados.forEach(function (L) {
    console.log('--- ' + L.nome);
    L.itens.forEach(function (i) {
      console.log('   ' + i.nome.padEnd(12) + ' L ' + String(i.luma).padStart(4) + '  R−B ' + String(i.rb).padStart(5) +
        '  fonte ' + i.w + 'x' + i.h + ' -> tela ' + Math.round(i.w * i.alvoH / i.h) + 'x' + i.alvoH);
    });
  });
  console.log('folha: ' + SAI);
  await browser.close();
})();
