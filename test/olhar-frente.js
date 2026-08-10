// OLHAR A VEGETACAO DE FRENTE — o print que resolve a discussao. Para cada planta da camada
// desenharFrente(), desenha por cima: CIANO no fundo da CELULA (onde o codigo ancora) e
// VERMELHO na base da TINTA (onde a planta realmente acaba). A regua ROSA e' GROUND.
// Se o vermelho estiver acima do rosa, a planta esta no ar — e a distancia se le no print.
//   node test/olhar-frente.js [cena]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const CENAS = [{ cena: 0, nome: 'cap1' }, { cena: 2, nome: 'cap2' }, { cena: 5, nome: 'cap4' }];
(async () => {
  const file = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(file);
  await page.waitForTimeout(1400);
  await page.evaluate(() => { fecharTelas(); if (typeof fecharTudo === 'function') fecharTudo(); });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const cacheBase = new WeakMap();
    window.__base = function (img) {
      if (cacheBase.has(img)) return cacheBase.get(img);
      const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, w, h).data;
      let base = h;
      for (let y = h - 1; y >= 0; y--) {
        let achou = false;
        for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 16) { achou = true; break; }
        if (achou) { base = y + 1; break; }
      }
      cacheBase.set(img, { h: h, base: base });
      return cacheBase.get(img);
    };
    window.__logf = [];
    const P = CanvasRenderingContext2D.prototype, orig = P.drawImage;
    let dentro = false;
    const f = window.desenharFrente;
    window.desenharFrente = function () { dentro = true; try { return f.apply(this, arguments); } finally { dentro = false; } };
    P.drawImage = function (img) {
      const r = orig.apply(this, arguments);
      if (dentro && arguments.length === 5 && (img.naturalHeight || 0) > 100) {
        const dx = arguments[1], dy = arguments[2], dw = arguments[3], dh = arguments[4];
        const b = window.__base(img);
        const tinta = dy + dh * b.base / b.h;
        this.save();
        this.setLineDash([]); this.lineWidth = 2;
        this.strokeStyle = '#35e0ff';                        // fundo da CELULA
        this.beginPath(); this.moveTo(dx, dy + dh); this.lineTo(dx + dw, dy + dh); this.stroke();
        this.strokeStyle = '#ff3b30';                        // base da TINTA
        this.beginPath(); this.moveTo(dx, tinta); this.lineTo(dx + dw, tinta); this.stroke();
        this.restore();
        const ky = this.canvas.height / H;
        window.__logf.push({ x: Math.round(dx / (this.canvas.width / W)), gap: Math.round((GROUND * ky - tinta) / ky * 10) / 10, alt: Math.round(dh / ky), base: b.base });
      }
      return r;
    };
  });
  for (const c of CENAS) {
    const geo = await page.evaluate(async (cena) => {
      S.aberturas = MASCARA_EPOCAS; S.fechos = MASCARA_EPOCAS; S.marcos = MASCARA_MARCOS; S.travessias = MASCARA_TRAVESSIAS;
      S.cenario = cena; S.modo = 'limpo'; S.energiaTotal = 1500 * cena + 40;
      window.setHora(0.5);
      mobs.length = 0; drops.length = 0; folhas.length = 0;
      proximoMob = 1e9; proximaFolha = 1e9;
      fecharTelas();
      await new Promise(r => setTimeout(r, 600));
      fecharTelas();
      window.__logf.length = 0;
      await new Promise(r => setTimeout(r, 120));
      return { GROUND: GROUND, H: H };
    }, c.cena);
    const gTela = Math.round(geo.GROUND * (844 / geo.H));
    await page.evaluate((y) => {
      let d = document.getElementById('__regua');
      if (!d) { d = document.createElement('div'); d.id = '__regua'; document.body.appendChild(d); }
      d.style.cssText = 'position:fixed;left:0;right:0;top:' + y + 'px;height:2px;background:#ff2b6b;z-index:99999;pointer-events:none';
    }, gTela);
    await page.screenshot({ path: path.resolve(__dirname, 'FR-' + c.nome + '.png'), clip: { x: 0, y: gTela - 230, width: 390, height: 300 }, scale: 'device' });
    const log = await page.evaluate(() => window.__logf.slice(-12));
    console.log(c.nome, 'chao y=' + gTela, JSON.stringify(log));
  }
  await browser.close();
})();
