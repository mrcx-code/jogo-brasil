// Corta uma folha de GENTE (grade 8x3) pelo VALE DE TINTA perto de cada fronteira — as folhas
// chegam com figuras mais largas que a celula, e o corte fixo decepava tabuleiro e calcanhar.
// O vale e seguro AQUI (e nao nas folhas de heroi) porque nada e segurado atravessando o vao:
// o portao tecnico ja mediu vale <= 8 antes de esta ferramenta rodar.
//   node test/cortar-gente.js <entrada-sem-ext> <saida.json>
const fs = require('fs'); const path = require('path'); const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');   // onde o Chromium esta (test/abrir.js)
const [ent, sai] = process.argv.slice(2);
(async () => {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() }); const pg = await nav.newPage();
  const b64 = 'data:image/png;base64,' + fs.readFileSync(path.resolve('assets/entrada', ent + '.png')).toString('base64');
  const frames = await pg.evaluate(async (u) => {
    const im = new Image(); im.src = u; await im.decode();
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const tinta = (x, y0, y1) => { let t = 0; for (let y = y0; y < y1; y++) { const i = (y * c.width + x) * 4; if (Math.min(d[i], d[i + 2]) - d[i + 1] < 180) t++; } return t; };
    const rw = c.width / 8, rh = c.height / 3;
    const sai = [];
    for (let f = 0; f < 3; f++) {
      const y0 = Math.round(f * rh), y1 = Math.round((f + 1) * rh);
      // POR MANCHA, NAO POR GRADE (17/08). A versao anterior procurava o vale a mais ou menos
      // 40px de cada fronteira da grade — e reprovava folhas BOAS: em gente-pindorama as oito
      // figuras medem 101 a 127px numa celula de 192, ou seja sobra espaco de sobra, mas elas
      // nao nascem centradas na celula e o vale real cai fora da janela de busca. Medido: a
      // folha acusava "colada, vale 70" com as figuras claramente separadas.
      // Agora as manchas de tinta sao encontradas onde estiverem e cada uma vira um quadro.
      // So se houver MAIS ou MENOS que oito e que a folha volta — e ai o motivo e verdadeiro.
      const manchas = [];
      let x = 0;
      while (x < c.width) {
        while (x < c.width && tinta(x, y0, y1) === 0) x++;
        const ini = x;
        while (x < c.width && tinta(x, y0, y1) > 0) x++;
        if (x > ini) manchas.push([ini, x]);
      }
      // OITO FIGURAS, LOGO SETE VAOS — e sao os SETE MAIORES (17/08). Duas tentativas
      // anteriores falharam por escolher limiar fixo: parte solta (uma vara na mao, um braco
      // atras do corpo) vira mancha extra, e limiar generoso o bastante para junta-las colapsa
      // a fileira inteira numa figura so quando a folha e apertada. Como o numero de figuras e
      // CONHECIDO, nao ha limiar a escolher: ordena-se os vaos e corta-se nos sete maiores.
      // Funciona igual na folha larga e na apertada, e nunca devolve numero errado de quadros.
      const vaos = [];
      for (let k = 1; k < manchas.length; k++) vaos.push({ i: k, g: manchas[k][0] - manchas[k - 1][1] });
      vaos.sort(function (a, b) { return b.g - a.g; });
      const corta = {};
      for (let k = 0; k < 7 && k < vaos.length; k++) corta[vaos[k].i] = 1;
      const juntas = [];
      for (let k = 0; k < manchas.length; k++) {
        if (k === 0 || corta[k]) juntas.push([manchas[k][0], manchas[k][1]]);
        else juntas[juntas.length - 1][1] = manchas[k][1];
      }
      manchas.length = 0;
      for (let k = 0; k < juntas.length; k++) manchas.push(juntas[k]);
      if (manchas.length !== 8) throw new Error('fileira ' + f + ': ' + manchas.length + ' figuras, esperava 8');
      const cortes = manchas.map(function (m) { return m[0]; });
      cortes.push(c.width);
      for (let k = 0; k < 8; k++) {
        const cw = (k < 7 ? manchas[k + 1][0] : c.width) - cortes[k], ch = y1 - y0;
        const c2 = document.createElement('canvas'); c2.width = cw; c2.height = ch;
        const g2 = c2.getContext('2d', { willReadFrequently: true });
        g2.drawImage(c, cortes[k], y0, cw, ch, 0, 0, cw, ch);
        const dd = g2.getImageData(0, 0, cw, ch); const px = dd.data;
        for (let i = 0; i < px.length; i += 4) {
          const m = Math.max(0, Math.min(px[i], px[i + 2]) - px[i + 1]);
          const a = Math.max(0, 255 - m);
          if (a < 250) {
            const fr = a / 255;
            if (fr > 0.02) { px[i] = Math.min(255, (px[i] - 255 * (1 - fr)) / fr); px[i + 2] = Math.min(255, (px[i + 2] - 255 * (1 - fr)) / fr); }
            px[i + 3] = a < 64 ? 0 : Math.round((a - 64) * 255 / 191);
          }
        }
        g2.putImageData(dd, 0, 0);
        let x0 = cw, x1 = 0, yy0 = ch, yy1 = 0;
        for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++)
          if (px[(y * cw + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < yy0) yy0 = y; if (y > yy1) yy1 = y; }
        const c3 = document.createElement('canvas'); c3.width = x1 - x0 + 1; c3.height = yy1 - yy0 + 1;
        c3.getContext('2d').drawImage(c2, x0, yy0, c3.width, c3.height, 0, 0, c3.width, c3.height);
        sai.push(c3.toDataURL('image/webp', 0.76));
      }
    }
    return sai;
  }, b64);
  fs.writeFileSync(sai, JSON.stringify({ frames: frames.map(b => ({ b64: b })) }));
  console.log(ent + ': ' + frames.length + ' quadros, ' + Math.round(frames.join('').length / 1024) + ' KB');
  await nav.close();
})();
