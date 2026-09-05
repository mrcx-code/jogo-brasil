// A TIRA DE CONTATO DE UMA FILEIRA DE `GENTE_EP_B64` — com o numero ao lado da imagem.
//
// POR QUE ELE EXISTE (05/09). `arte-receita-corte-gente.js` desenha a tira, mas so das fileiras
// que AINDA tem celula dobrada — depois do corte ele nao tem mais o que mostrar. Faltava o
// depois: olhar a fileira ja consertada com a mesma matematica do motor e medir se a cabeca
// parou no lugar. "Sempre olhe os prints" do §6 vale para o print DEPOIS, nao so para o antes.
//
// O QUE ELE DESENHA, e por que assim. Cada quadro e escalado pela ALTURA e centrado pela LARGURA
// DO QUADRO — as duas linhas do motor (`sc = GENTE4_ALVO / naturalHeight`, `dx = cxm - dw/2`,
// jogo.ts ~6393-6396). A linha vermelha tracejada e o ponto CANONICO da cabeca na fileira: a
// mediana de `cabeca - largura/2` entre os quadros. Se a receita de corte prestou, a cabeca de
// todo quadro — cortado ou nao — encosta nessa linha.
//
// O NUMERO: `off` de cada quadro e o desvio da cabeca em relacao ao centro da celula, em px de
// FONTE. O que interessa nao e o valor absoluto e sim a AMPLITUDE da fileira: e ela que vira
// passo de lado na tela. A conversao para px de mundo sai de `GENTE4_ALVO / altura`.
//
// USO:  node test/tira-gente-fileira.js <cap> [fileira]     (sem fileira, faz as tres)
//       node test/tira-gente-fileira.js praca 0
// Salva test/TIRA-<cap>-f<n>.png.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');
const { ehRuidoDeRedeExterna } = require('./rede-externa.js');
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
const CAP = process.argv[2] || 'praca';
const FIL = process.argv[3] === undefined ? null : +process.argv[3];

(async function () {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const page = await nav.newPage({ viewport: { width: 900, height: 700 } });
  page.on('console', m => { if (m.type() === 'error' && !ehRuidoDeRedeExterna(m)) console.log('CONSOLE ' + m.text()); });
  await page.goto(ALVO, { waitUntil: 'load' });
  await page.waitForFunction('typeof GENTE_EP_B64 !== "undefined" && typeof garantirEpoca === "function"', { timeout: 30000 });
  await page.evaluate((cap) => {
    const ep = EPOCAS.findIndex(e => e.id === cap);
    let cen = -1;
    for (let n = 0; n < TOTAL_CENAS; n++) if (epocaDoCenario(n) === ep) { cen = n; break; }
    S.cenario = cen; S.fronteira = Math.max(S.fronteira, cen);
    if (typeof visitando !== 'undefined') visitando = false;
    garantirEpoca(ep);
  }, CAP);
  await page.waitForFunction((cap) => {
    const f = GENTE_EP_SPR[cap]; if (!f) return false;
    let n = 0; f.forEach(fl => fl.forEach(im => { if (im.complete && im.naturalWidth > 1) n++; }));
    return n > 0;
  }, CAP, { timeout: 30000 });

  const out = await page.evaluate(async ({ cap, fil }) => {
    const folha = GENTE_EP_B64[cap];
    const ALVOH = (typeof GENTE4_ALVO !== 'undefined') ? GENTE4_ALVO : 42;
    async function carregar(d) { const im = new Image(); im.src = d; await new Promise(r => { im.complete ? r() : (im.onload = r, im.onerror = r); }); return im; }
    function analisar(im) {
      const w = im.naturalWidth, h = im.naturalHeight;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      const px = g.getImageData(0, 0, w, h).data;
      let minY = h, maxY = -1, minX = w, maxX = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
        if (px[(y * w + x) * 4 + 3] > 24) { if (y < minY) minY = y; if (y > maxY) maxY = y; if (x < minX) minX = x; if (x > maxX) maxX = x; }
      // a cabeca: os 12% de cima da mancha
      const alt = maxY - minY + 1, ate = minY + Math.max(2, Math.round(alt * 0.12));
      let ca = 1e9, cb = -1;
      for (let y = minY; y <= ate; y++) for (let x = 0; x < w; x++)
        if (px[(y * w + x) * 4 + 3] > 24) { if (x < ca) ca = x; if (x > cb) cb = x; }
      return { im, w, h, minY, maxY, minX, maxX, hc: cb < 0 ? null : (ca + cb) / 2, hw: cb < 0 ? 0 : cb - ca + 1 };
    }
    const md = arr => { const s = arr.slice().sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };

    const res = { fileiras: [] };
    const alvoF = fil === null ? folha.map((_, i) => i) : [fil];
    for (const fi of alvoF) {
      const qs = [];
      for (let qi = 0; qi < folha[fi].length; qi++) {
        const im = await carregar(folha[fi][qi]);
        if (im.naturalWidth <= 1) { qs.push({ id: 'q' + qi, vazio: true }); continue; }
        const a = analisar(im);
        qs.push({ id: 'q' + qi, a, off: a.hc - a.w / 2, escala: ALVOH / a.h });
      }
      const cheios = qs.filter(q => !q.vazio);
      const T = md(cheios.map(q => q.off));
      const CEL = 190, H = 300, PADT = 22;
      const c = document.createElement('canvas'); c.width = qs.length * CEL; c.height = H + PADT + 20;
      const g = c.getContext('2d');
      for (let y = 0; y < c.height; y += 16) for (let x = 0; x < c.width; x += 16)
      { g.fillStyle = (((x / 16) + (y / 16)) % 2 === 0) ? '#33333b' : '#26262c'; g.fillRect(x, y, 16, 16); }
      g.font = 'bold 12px monospace'; g.textBaseline = 'top';
      qs.forEach((q, i) => {
        g.strokeStyle = 'rgba(255,255,255,.15)'; g.strokeRect(i * CEL + .5, .5, CEL - 1, c.height - 1);
        if (q.vazio) { g.fillStyle = '#ff6b6b'; g.fillText(q.id + ' VAZIO', i * CEL + 6, PADT + H - 12); return; }
        const sc = (H - 20) / q.a.h;                       // mesma regra do jogo: escala pela ALTURA
        const dw = Math.round(q.a.w * sc), dh = Math.round(q.a.h * sc);
        const cxm = i * CEL + CEL / 2;
        const dx = Math.round(cxm - dw / 2), dy = PADT + (H - 20) - dh + 10;
        g.save(); g.beginPath(); g.rect(i * CEL, 0, CEL, c.height); g.clip();
        g.drawImage(q.a.im, dx, dy, dw, dh); g.restore();
        const xc = cxm + T * sc;
        g.strokeStyle = 'rgba(255,90,90,.85)'; g.lineWidth = 1; g.setLineDash([4, 4]);
        g.beginPath(); g.moveTo(xc, PADT); g.lineTo(xc, PADT + H - 24); g.stroke(); g.setLineDash([]);
        g.fillStyle = '#ffe9a8';
        g.fillText(q.id + ' ' + q.a.w + 'x' + q.a.h, i * CEL + 6, PADT + H - 12);
      });
      res.fileiras.push({
        fi, T, png: c.toDataURL('image/png'),
        quadros: qs.map(q => q.vazio ? { id: q.id, vazio: true } : {
          id: q.id, w: q.a.w, h: q.a.h, off: +q.off.toFixed(2),
          desvio: +(q.off - T).toFixed(2), mundo: +((q.off - T) * q.escala).toFixed(3),
          cabecaTela: +(q.a.hw * q.escala).toFixed(2),
          altTela: +((q.a.maxY - q.a.minY + 1) * q.escala).toFixed(2)
        })
      });
    }
    return res;
  }, { cap: CAP, fil: FIL });

  for (const F of out.fileiras) {
    const cheios = F.quadros.filter(q => !q.vazio);
    const offs = cheios.map(q => q.off);
    console.log('\n=== ' + CAP + ' fileira ' + F.fi + '  —  cabeca canonica T = ' + F.T +
      '   amplitude ' + (Math.max(...offs) - Math.min(...offs)).toFixed(1) + ' px de fonte');
    console.log('  quadro   celula     off    desvio de T   px de mundo   cabeca na tela   altura na tela');
    for (const q of F.quadros) {
      if (q.vazio) { console.log('  ' + q.id.padEnd(8) + ' VAZIO'); continue; }
      console.log('  ' + q.id.padEnd(8) + (q.w + 'x' + q.h).padEnd(10) +
        String(q.off).padStart(7) + String(q.desvio).padStart(14) +
        String(q.mundo).padStart(14) + String(q.cabecaTela).padStart(17) + String(q.altTela).padStart(17));
    }
    const f = path.join(__dirname, 'TIRA-' + CAP + '-f' + F.fi + '.png');
    fs.writeFileSync(f, Buffer.from(F.png.split(',')[1], 'base64'));
    console.log('  -> ' + path.basename(f));
  }
  await nav.close();
})().catch(e => { console.error(e); process.exit(1); });
