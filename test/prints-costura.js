// A COSTURA VERTICAL DO CHÃO, capítulo a capítulo — o material da CONDIÇÃO 1 do PENDENTES 54.
//
// A condição é da arte e é explícita: *"a costura vertical se julga por PRINT, e o precedente
// tem nome: JABAQUARA"*. Repetir a peça de chão espelhada na vertical cria uma linha de simetria,
// e simetria em textura orgânica FABRICA ROSTO — foi o que a auditoria de coerência de 21/08
// achou em JABAQUARA, num espelho que também era não-intencional. A linha nova nasce sob
// suspeita, e quem decide se ela pode ficar é a arte, olhando.
//
// O QUE ELE GERA, por capítulo (390×844, o retrato de referência, onde a subida acontece):
//
//   COSTURA-home-NN-<capitulo>.png   a home INTEIRA, como a pessoa vê — mobília, poste e tudo.
//                                    É o estado real e é o que decide.
//   COSTURA-tira-NN-<capitulo>.png   a camada `#fundoHD` NUA, recortada na faixa das costuras,
//                                    em px de dispositivo (dpr 2, sem reamostrar). É a lupa: no
//                                    print da home a maior parte da faixa cai atrás do poste, e
//                                    julgar simetria por uma nesga de 43 px de cada lado seria
//                                    julgar no escuro.
//
// A tira leva DUAS marcas de 1 px nas bordas laterais (fora da imagem, na moldura) apontando a
// altura exata de cada costura, para o olho saber ONDE procurar em vez de caçar.
//
// Uso:  node test/prints-costura.js [prefixo]
const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');
const ABRIR = require('./abrir.js');   // onde o Chromium esta (test/abrir.js)

const RAIZ = path.resolve(__dirname, '..');
const PREF = process.argv[2] || 'COSTURA';
const TIPOS = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg' };

function servir() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/' || p === '') p = '/index.html';
      const alvo = path.join(RAIZ, p);
      if (!alvo.startsWith(RAIZ) || !fs.existsSync(alvo) || fs.statSync(alvo).isDirectory()) {
        res.writeHead(404); res.end('nao'); return;
      }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(alvo)] || 'application/octet-stream' });
      fs.createReadStream(alvo).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => ok({ s, url: 'http://127.0.0.1:' + s.address().port + '/index.html' }));
  });
}

(async () => {
  const { s, url } = await servir();
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const erros = [];
  const pg = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    hasTouch: true, isMobile: true });
  pg.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
  pg.on('console', m => { if (m.type() === 'error') erros.push('CONSOLE: ' + m.text()); });
  await pg.goto(url);
  await pg.waitForFunction(() => typeof S !== 'undefined' && !!window.geoFundo && !!window.geoFundo(),
    null, { timeout: 30000 }).catch(() => {});

  // TODA a arte primeiro: sem isto os capítulos 2+ desenhariam a pintura do capítulo 1 e o
  // instrumento estaria julgando a mesma costura treze vezes (a armadilha do `file://`, aqui
  // em outra roupa).
  const capitulos = await pg.evaluate(async () => {
    for (let e = 0; e < EPOCAS.length; e++) garantirEpoca(e);
    for (let t = 0; t < 800 && Object.keys(pacoteEstado).some(n => pacoteEstado[n] !== 'aqui'); t++) {
      await new Promise(r => setTimeout(r, 25));
    }
    return EPOCAS.map((ep, i) => ({ i, nome: ep.nome, cena: cenarioDaEpoca(i) }));
  });

  console.log('capítulos: ' + capitulos.length + '\n');
  for (const c of capitulos) {
    const m = await pg.evaluate(async ([cena]) => {
      S.cenario = cena; S.fronteira = Math.max(S.fronteira | 0, cena);
      fecharTelas(); abrirTela('telaMenu');
      fitCanvas(); redesenharFundo();
      const tela = document.getElementById('telaMenu');
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const vivas = tela.getAnimations({ subtree: true })
        .filter(a => a.animationName !== 'respira').map(a => a.finished.catch(() => {}));
      await Promise.race([Promise.all(vivas), new Promise(r => setTimeout(r, 2500))]);
      await new Promise(r => requestAnimationFrame(r));
      const g = window.geoFundo();
      const altChao = g.dh * 0.25;
      const linhas = [];
      let yb = g.dy + g.dh;
      while (linhas.length < 12 && yb < g.ch) { linhas.push(yb); yb += altChao; }
      // A TIRA: da primeira costura menos um respiro até a última mais outro, em px de
      // DISPOSITIVO. `#fundoHD` tem `width`/`height` em px de canvas, então o recorte é 1:1 —
      // nenhuma reamostragem entre o que o aparelho desenhou e o que a arte vê.
      const cv = document.getElementById('fundoHD');
      const y0 = Math.max(0, Math.floor(linhas[0] - 90));
      const y1 = Math.min(cv.height, Math.ceil((linhas[linhas.length - 1] || linhas[0]) + 90));
      const rec = document.createElement('canvas');
      rec.width = cv.width; rec.height = Math.max(1, y1 - y0);
      const rx = rec.getContext('2d');
      rx.drawImage(cv, 0, y0, cv.width, rec.height, 0, 0, cv.width, rec.height);
      // as marcas: 1 px nas duas bordas, na altura exata de cada costura
      rx.fillStyle = '#ff2ad4';
      linhas.forEach(l => { const y = Math.round(l - y0);
        if (y >= 0 && y < rec.height) { rx.fillRect(0, y, 14, 1); rx.fillRect(cv.width - 14, y, 14, 1); } });
      return { url: rec.toDataURL('image/png'), copias: linhas.length,
        linhas: linhas.map(v => Math.round(v)), chao: chaoHome, dh: Math.round(g.dh),
        dy: Math.round(g.dy), ch: g.ch, idx: fundoIdx(), y0, alt: rec.height };
    }, [c.cena]);
    const base = PREF + '-' + String(c.i).padStart(2, '0') + '-'
      + c.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '');
    await pg.screenshot({ path: path.join(__dirname, base.replace(PREF + '-', PREF + '-home-')) + '.png' });
    fs.writeFileSync(path.join(__dirname, base.replace(PREF + '-', PREF + '-tira-')) + '.png',
      Buffer.from(m.url.split(',')[1], 'base64'));
    console.log('  ' + String(c.i).padStart(2, '0') + ' ' + c.nome.padEnd(18)
      + ' pintura#' + m.idx + ' · chão ' + (m.chao ? m.chao.toFixed(4) : '0,6800')
      + ' · dh ' + m.dh + ' dy ' + m.dy + ' · costuras em y=' + m.linhas.join(', ')
      + ' (de ' + m.ch + ' px de canvas) · tira ' + m.alt + 'px a partir de ' + m.y0);
  }
  await pg.close();

  // ---- O PAR QUE FICA VERSIONADO: 390×844 antes/depois, na home de estreia ----
  //
  // Em **dsf1 de propósito**, e é a mesma decisão que o PENDENTES 54 registrou para os quatro
  // prints de 22/08: 400–500 KB em vez de 1,4 MB cada, e o que se julga aqui é COMPOSIÇÃO — se
  // ela entrou em cena, se o logo tem céu atrás, se o mar continua. A fidelidade de pixel que a
  // COSTURA exige está nas tiras acima, que são dsf1:1 sem reamostrar.
  for (const lado of ['ANTES', 'DEPOIS']) {
    const p2 = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1,
      hasTouch: true, isMobile: true });
    p2.on('pageerror', e => erros.push(lado + ' PAGEERROR: ' + e.message));
    await p2.goto(url);
    await p2.waitForFunction(() => typeof S !== 'undefined' && !!window.geoFundo && !!window.geoFundo(),
      null, { timeout: 30000 }).catch(() => {});
    const m = await p2.evaluate(async ([antes]) => {
      // ANTES = a chave BAIXADA à mão, que é o estado publicado entre 22/08 e 02/09.
      if (antes) CHAO_HOME_LIGADO = false;
      fecharTelas(); abrirTela('telaMenu');
      fitCanvas(); redesenharFundo();
      const tela = document.getElementById('telaMenu');
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const vivas = tela.getAnimations({ subtree: true })
        .filter(a => a.animationName !== 'respira').map(a => a.finished.catch(() => {}));
      await Promise.race([Promise.all(vivas), new Promise(r => setTimeout(r, 2500))]);
      await new Promise(r => requestAnimationFrame(r));
      const img = heroBloco('walk')[0];
      const sc = HERO_TARGET / img.naturalHeight;
      const kx = telaW() / W, ky = telaH() / H;
      const dw = img.naturalWidth * sc * kx, dh = img.naturalHeight * sc * ky;
      const ela = { x: HX * kx - dw / 2, y: GROUND * ky - dh, w: dw, h: dh };
      const p = document.getElementById('poste').getBoundingClientRect();
      const escondida = ela.x >= p.left - 1 && ela.x + ela.w <= p.right + 1
        && ela.y >= p.top - 1 && ela.y + ela.h <= p.bottom + 1;
      const g = window.geoFundo();
      return { chao: chaoHome, GROUND, H, escondida, dh: Math.round(g.dh), dy: Math.round(g.dy),
        ela: [ela.x, ela.y, ela.w, ela.h].map(v => Math.round(v * 10) / 10).join('/') };
    }, [lado === 'ANTES']);
    await p2.screenshot({ path: path.join(__dirname, 'CEU-' + lado + '-390x844.png') });
    await p2.close();
    console.log('\n  CEU-' + lado + '-390x844.png · chão ' + (m.chao ? m.chao.toFixed(4) : '0,6800')
      + ' · GROUND ' + m.GROUND + '/' + m.H + ' · dh ' + m.dh + ' dy ' + m.dy
      + ' · personagem ' + m.ela + (m.escondida ? '  <-- INTEIRA atrás do poste' : '  (APARECE)'));
  }

  await nav.close();
  s.close();
  console.log('\n' + (erros.length ? 'ERROS:\n' + erros.join('\n') : 'zero erro de console'));
})();
