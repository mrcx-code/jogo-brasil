// Onda 2 da Direção de Evolução — prints e MEDIÇÃO por pintura e por hora.
// Uso: node prints-onda2.js [prefixo]   (padrão "O2")
// Para cada uma das 6 pinturas, fixa TARDE (0.25) e NOITE (0.75) puras via setHora,
// tira print 390×844 dsf2 e mede no #fundoHD:
//   - luma média da FAIXA DO TOPO (0..10% da altura) — a "faixa clara" apontada na onda 1
//   - luma média do CÉU logo abaixo (10..30%)
//   - razão topo/céu — >1.2 à NOITE é a faixa clara lendo como defeito
// Também mede a cor média de um mob em cena (canvas #scene, banda do chão) para provar
// que a tinta da hora alcançou (ou não) os sprites da camada de jogo.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}

(async () => {
  const pref = process.argv[2] || 'O2';
  const file = 'file://' + path.resolve(__dirname, '..', 'index.html');
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  await page.goto(file);
  await page.waitForTimeout(1200);
  await page.evaluate(() => { if (typeof fecharTelas === 'function') fecharTelas(); });
  await page.waitForTimeout(200);

  const HORAS = [[0.25, 'tarde'], [0.75, 'noite']];
  const linhas = [];
  // Quantas pinturas o jogo TEM, não um literal: quando SALVADOR entrou, o `6` daqui deixou de
  // fora justamente a pintura nova — o instrumento mediria seis e calaria sobre a sétima, que
  // é a única que ainda não fora calibrada. Instrumento com o número escrito à mão mede o
  // passado. (É a fragilidade (b) da onda 2, registrada no DIRECAO.md.)
  const N_PINT = await page.evaluate(() => CENARIO_ALTO_B64.length);
  for (let idx = 0; idx < N_PINT; idx++) {
    for (const [f, nome] of HORAS) {
      await page.evaluate(({ idx, f }) => {
        window.setFundo(idx);
        window.setHora(f);
        // limpa a rua para a medição do céu não pegar float por cima, mas deixa o jogo rodar
        mobs.length = 0; drops.length = 0; floats.length = 0;
      }, { idx, f });
      // espera o rebake do filtro (horaKey>>3) e alguns quadros de mundo
      await page.waitForTimeout(700);
      const m = await page.evaluate(() => {
        const fc = document.getElementById('fundoHD');
        const fx = fc.getContext('2d');
        const w = fc.width, h = fc.height;
        function banda(y0, y1) {
          const d = fx.getImageData(0, Math.round(h * y0), w, Math.max(1, Math.round(h * (y1 - y0)))).data;
          let s = 0, n = 0;
          for (let i = 0; i < d.length; i += 16) { s += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; n++; }
          return s / n;
        }
        // o filtro CSS (brightness/saturate) NÃO entra no getImageData — ler o pixel cru
        // subestima o que o olho vê de dia e superestima a escuridão à noite. Registrado:
        // a régua aqui é RELATIVA (topo ÷ céu logo abaixo), e o filtro é o mesmo nas duas
        // bandas, então a razão sobrevive ao filtro. O print é quem julga o absoluto.
        return { topo: banda(0, 0.10), ceu: banda(0.10, 0.30), meio: banda(0.30, 0.55) };
      });
      m.razao = m.topo / m.ceu;
      linhas.push({ pintura: idx, hora: nome, ...m });
      await page.screenshot({ path: path.join(__dirname, `${pref}-p${idx}-${nome}.png`) });
    }
  }

  // A COR DO SPRITE SOB A NOITE: capítulo 1, noite fechada, um mob parado em cena.
  await page.evaluate(() => {
    window.setFundo(0);
    window.setHora(0.75);
    mobs.length = 0; drops.length = 0; floats.length = 0; folhas.length = 0;
  });
  await page.waitForTimeout(400);
  const sprite = await page.evaluate(async () => {
    // um mob plantado na frente da protagonista, parado, para medir a cor dele
    const tipos = Object.keys(MOB_KEY || { smog: 1 });
    mobs.push({ wx: worldX + Math.round(W * 0.7), type: tipos[0], hp: 5, hpMax: 5,
      parado: false, dying: 0, flash: 0, espera: 9, vel: 0 });
    await new Promise(r => setTimeout(r, 300));
    const cvs = document.getElementById('scene');
    const g = cvs.getContext('2d');
    const sx = Math.round(mobs[0].wx - worldX);
    const d = g.getImageData(sx - 8, GROUND - 24, 16, 22).data;
    let r0 = 0, v = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 40) continue;
      r0 += d[i]; v += d[i + 1]; b += d[i + 2]; n++;
    }
    return n ? { r: r0 / n, g: v / n, b: b / n, n } : null;
  });
  await page.screenshot({ path: path.join(__dirname, `${pref}-sprite-noite.png`) });

  console.log('pintura | hora  |  topo |  céu  |  meio | topo/céu');
  for (const l of linhas)
    console.log(`   ${l.pintura}    | ${l.hora} | ${l.topo.toFixed(1).padStart(5)} | ${l.ceu.toFixed(1).padStart(5)} | ${l.meio.toFixed(1).padStart(5)} |  ${l.razao.toFixed(2)}`);
  if (sprite) console.log(`mob à noite (média RGB sobre alpha>40): ${sprite.r.toFixed(0)},${sprite.g.toFixed(0)},${sprite.b.toFixed(0)} em ${sprite.n} px`);
  else console.log('mob à noite: não medido (nenhum pixel)');
  if (errors.length) { console.log('ERROS:'); errors.forEach(e => console.log(' ', e)); process.exit(1); }
  await browser.close();
})();
