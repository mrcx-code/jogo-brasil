// DESPEJA A PEÇA EXIBIDA de uma pintura, em resolução nativa — para o olho procurar tronco.
//
//   node test/ver-peca-palmares.js [pintura]
//
// Existe para responder a pergunta que o aceite do item `palmares-emenda-horizontal-rosto`
// coloca antes de qualquer código: a pintura TEM um tronco reto e uma copa larga recortáveis
// nas medidas pedidas, ou o item vira pedido de arte? Sem olhar a peça que o aparelho desenha
// (não a fonte crua — o passe de pixel muda a granulometria) isso é adivinhação.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

const PINT = parseInt(process.argv[2] || '2', 10);

(async () => {
  const url = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true,
  });
  await pg.goto(url);
  await pg.waitForFunction(() => typeof S !== 'undefined' && !!window.geoFundo && !!window.geoFundo(),
    null, { timeout: 30000 });
  await pg.evaluate(async () => {
    if (typeof fecharTelas === 'function') fecharTelas();
    for (let e = 0; e < EPOCAS.length; e++) garantirEpoca(e);
    for (let t = 0; t < 800 && Object.keys(pacoteEstado).some(n => pacoteEstado[n] !== 'aqui'); t++) {
      await new Promise(r => setTimeout(r, 25));
    }
  });
  const r = await pg.evaluate(({ pint }) => {
    fundoAtivo = pint; worldX = 0; redesenharFundo();
    const g = window.geoFundo();
    const out = {};
    ['alto', 'chao'].forEach(function (qual) {
      const im = window.pecaExibida(pint, qual);
      const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
      cx.drawImage(im, 0, 0);
      out[qual] = { w, h, url: cv.toDataURL('image/png') };
    });
    // a escala fonte -> CSS: a pintura inteira cobre g.dw px de dispositivo = g.dw/dpr CSS
    const escalaCss = (g.dw / (window.devicePixelRatio || 2)) / out.alto.w;
    fundoAtivo = -1; worldX = 0; redesenharFundo();
    return { out, escalaCss: +escalaCss.toFixed(4), dw: +g.dw.toFixed(1), dh: +g.dh.toFixed(1),
      dy: +g.dy.toFixed(1), ch: g.ch, dpr: window.devicePixelRatio, linha: FUNDO_GROUND_SRC };
  }, { pint: PINT });

  for (const qual of ['alto', 'chao']) {
    const p = path.join(__dirname, 'PECA-' + PINT + '-' + qual + '.png');
    fs.writeFileSync(p, Buffer.from(r.out[qual].url.split(',')[1], 'base64'));
    console.log(qual + ': ' + r.out[qual].w + 'x' + r.out[qual].h + ' px de fonte -> ' + p);
  }
  console.log('escala fonte->CSS: ' + r.escalaCss + '  (1 px de fonte = ' + r.escalaCss + ' px CSS)');
  console.log('  logo: 28 px CSS = ' + (28 / r.escalaCss).toFixed(1) + ' px de fonte'
    + ' · 120 px CSS = ' + (120 / r.escalaCss).toFixed(1) + ' px de fonte');
  console.log('geometria: dw ' + r.dw + ' dh ' + r.dh + ' dy ' + r.dy + ' ch ' + r.ch
    + ' dpr ' + r.dpr + ' linha ' + r.linha);
  await nav.close();
  process.exit(0);
})();
