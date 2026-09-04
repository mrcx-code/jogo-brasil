// TEM TRONCO RECORTÁVEL NESTA PINTURA? — a pergunta que decide se o item
// `palmares-emenda-horizontal-rosto` vira código ou vira pedido de arte.
//
//   node test/medir-tronco-palmares.js [pintura]        (padrão 2)
//
// O aceite pede uma COLUNA VERTICAL recortada da PRÓPRIA pintura: tronco opaco de ≥ 28 px CSS
// de largura cobrindo o eixo em TODA a altura da peça de cima em quadro, e copa de ≥ 120 px CSS
// no topo. E proíbe, com todas as letras, montar essa coluna empilhando recortes repetidos —
// "repetição vertical lê como azulejo". Então ou existe na pintura uma faixa vertical contínua
// dessa largura e dessa altura, ou o item para e devolve o pedido de arte.
//
// COMO SE MEDE, e por que assim: o que separa mata de céu nesta paleta é `G > B` — folha e
// tronco são verdes e marrons (G ≥ B), céu, nuvem e montanha azulada são B ≥ G. Para cada
// coluna da peça de cima, o instrumento sobe do rodapé contando quantos pixels seguidos de
// mata existem antes do primeiro pixel de céu. Esse é o teto do que um recorte VERTICAL
// CONTÍNUO daquela coluna pode dar. Depois desliza uma janela da largura pedida e pega o
// MÍNIMO dentro dela — porque um tronco de 33 px só é opaco até onde a sua coluna mais curta
// chega; a mais alta não cobre o buraco da vizinha.
//
// Nenhuma opinião sobre a arte sai daqui. Só o teto por construção.
const { chromium } = require('playwright');
const path = require('path');
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
    const dpr = window.devicePixelRatio || 2;
    const im = window.pecaExibida(pint, 'alto');
    const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
    cx.drawImage(im, 0, 0);
    const d = cx.getImageData(0, 0, w, h).data;

    const escalaCss = (g.dw / dpr) / w;           // 1 px de fonte -> px CSS na tela
    // a altura da peça de cima QUE APARECE: de y=0 da tela até a linha do chão
    const yChaoDev = g.dy + g.dh * FUNDO_GROUND_SRC;
    const altoEmQuadroCss = Math.min(yChaoDev, g.dh * FUNDO_GROUND_SRC) / dpr;
    const pedidoTroncoCss = 28, pedidoCopaCss = 120;
    const pedidoTroncoFonte = pedidoTroncoCss / escalaCss;
    const pedidoCopaFonte = pedidoCopaCss / escalaCss;
    const alturaPedidaCss = altoEmQuadroCss;      // do chão até o topo da tela
    const alturaPedidaFonte = alturaPedidaCss / escalaCss;

    // corrida contínua de MATA (G > B) subindo do rodapé, por coluna
    const corrida = new Int32Array(w);
    for (let x = 0; x < w; x++) {
      let n = 0;
      for (let y = h - 1; y >= 0; y--) {
        const p = (y * w + x) * 4;
        if (d[p + 3] < 128) break;
        if (d[p + 1] > d[p + 2]) n++; else break;   // G > B = folha/tronco; senão céu/montanha
      }
      corrida[x] = n;
    }
    function melhorJanela(larg) {
      const L = Math.max(1, Math.round(larg));
      let melhor = -1, ondeX = -1;
      for (let x = 0; x + L <= w; x++) {
        let m = Infinity;
        for (let k = 0; k < L; k++) if (corrida[x + k] < m) m = corrida[x + k];
        if (m > melhor) { melhor = m; ondeX = x; }
      }
      return { alturaFonte: melhor, x: ondeX };
    }
    const tronco = melhorJanela(pedidoTroncoFonte);
    const copa = melhorJanela(pedidoCopaFonte);
    let maxCol = 0, maxColX = -1;
    for (let x = 0; x < w; x++) if (corrida[x] > maxCol) { maxCol = corrida[x]; maxColX = x; }

    fundoAtivo = -1; worldX = 0; redesenharFundo();
    return {
      pint, w, h, escalaCss: +escalaCss.toFixed(4),
      alturaPedidaCss: +alturaPedidaCss.toFixed(1), alturaPedidaFonte: +alturaPedidaFonte.toFixed(1),
      pedidoTroncoFonte: +pedidoTroncoFonte.toFixed(1), pedidoCopaFonte: +pedidoCopaFonte.toFixed(1),
      colunaMaisAlta: { fonte: maxCol, css: +(maxCol * escalaCss).toFixed(1), x: maxColX },
      tronco: { fonte: tronco.alturaFonte, css: +(tronco.alturaFonte * escalaCss).toFixed(1), x: tronco.x },
      copa: { fonte: copa.alturaFonte, css: +(copa.alturaFonte * escalaCss).toFixed(1), x: copa.x },
      alturaPecaMaisFolga: h + 8,
    };
  }, { pint: PINT });

  console.log('=== PINTURA ' + r.pint + ' · peça de cima ' + r.w + 'x' + r.h + ' px de fonte ===');
  console.log('  escala fonte->CSS ' + r.escalaCss);
  console.log('');
  console.log('  O QUE O ACEITE PEDE, convertido para px de fonte:');
  console.log('    tronco: ' + r.pedidoTroncoFonte + ' px de largura (28 CSS)  x  '
    + r.alturaPedidaFonte + ' px de altura (' + r.alturaPedidaCss + ' CSS, do chão ao topo da tela)');
  console.log('    copa:   ' + r.pedidoCopaFonte + ' px de largura (120 CSS)');
  console.log('');
  console.log('  O QUE A PINTURA TEM (corrida contínua de mata subindo do rodapé):');
  console.log('    coluna isolada mais alta:        ' + r.colunaMaisAlta.fonte + ' px de fonte ('
    + r.colunaMaisAlta.css + ' CSS)  em x=' + r.colunaMaisAlta.x);
  console.log('    melhor faixa de ' + Math.round(r.pedidoTroncoFonte) + ' px (tronco):  '
    + r.tronco.fonte + ' px de fonte (' + r.tronco.css + ' CSS)  em x=' + r.tronco.x);
  console.log('    melhor faixa de ' + Math.round(r.pedidoCopaFonte) + ' px (copa):   '
    + r.copa.fonte + ' px de fonte (' + r.copa.css + ' CSS)  em x=' + r.copa.x);
  console.log('');
  const okTronco = r.tronco.fonte >= r.alturaPedidaFonte;
  console.log('  VEREDITO: ' + (okTronco
    ? 'a pintura RENDE o tronco pedido — segue para o recorte.'
    : 'a pintura NÃO RENDE o tronco pedido (' + r.tronco.css + ' CSS contra '
      + r.alturaPedidaCss + ' CSS pedidos, ' + (100 * r.tronco.fonte / r.alturaPedidaFonte).toFixed(1)
      + '% do necessário) — o item vira PEDIDO DE ARTE.'));
  console.log('');
  console.log('  Para preencher o pedido de arte do backlog:');
  console.log('    copa >= ' + Math.ceil(r.pedidoCopaFonte) + ' px de mundo · tronco entre '
    + Math.ceil(r.pedidoTroncoFonte) + ' e ' + Math.ceil(r.pedidoTroncoFonte * 1.35) + ' px de mundo');
  console.log('    altura = altura da peça de cima + 8 = ' + r.alturaPecaMaisFolga + ' px de mundo');
  await nav.close();
  process.exit(0);
})();
