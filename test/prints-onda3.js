// Onda 3 da Direção de Evolução — a cerimônia de virada de era, medida no tempo.
// Uso: node test/prints-onda3.js [prefixo] [fração-da-hora]   (padrão "O3" e 0.75 = NOITE)
//
// Provoca uma virada de era REAL (época 0 → 1, cruzando o limiar de impacto), com a hora
// do dia fixada antes, e fotografa a cerimônia em sequência: o instante em que ela abre e
// mais cinco quadros ao longo dela. Em cada quadro mede:
//   - a fração do dia (relogio/DIA_SEG % 1) — a posição do sol
//   - luma média do CÉU (10..30% da altura) e do MEIO (30..55%) no #fundoHD
// É a régua do "nascer do sol na pintura nova": no ANTES a varredura é +1 hora linear a
// partir de onde o relógio estiver; a onda 3 quer que ela TERMINE na manhã, com física.
// (getImageData não vê o filtro CSS de brilho — a leitura absoluta subestima o dia; a
// curva no TEMPO e a fração do dia é que contam a história. O print julga o resto.)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');
const { ehRuidoDeRedeExterna } = require('./rede-externa.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}

(async () => {
  const pref = process.argv[2] || 'O3';
  const fHora = process.argv[3] !== undefined ? parseFloat(process.argv[3]) : 0.75;
  const file = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !ehRuidoDeRedeExterna(m)) errors.push('CONSOLE: ' + m.text()); });
  await page.goto(file);
  await page.waitForTimeout(1200);
  await page.evaluate(() => { if (typeof fecharTelas === 'function') fecharTelas(); });
  await page.waitForTimeout(300);

  // A duração REAL da cerimônia, medida de dentro: o instante em que a classe entra e sai.
  await page.evaluate(() => {
    window.__cer = { on: 0, off: 0 };
    new MutationObserver(() => {
      const c = document.getElementById('telaFala').classList.contains('cerimoniando');
      if (c && !window.__cer.on) window.__cer.on = performance.now();
      if (!c && window.__cer.on && !window.__cer.off) window.__cer.off = performance.now();
    }).observe(document.getElementById('telaFala'), { attributes: true, attributeFilter: ['class'] });
  });

  // Arma a virada: última cena da época 0, impacto encostado no limiar, hora fixada.
  // aberturas = 1 (época 0 já lida) e fechos = 0, para o fecho e a cerimônia falarem.
  await page.evaluate((f) => {
    S.cenario = cenarioDaEpoca(1) - 1;
    S.energiaTotal = LIMIARES[S.cenario] - 3;
    S.aberturas = 1; S.fechos = 0;
    redesenharFundo();
    window.setHora(f);
    mobs.length = 0; drops.length = 0; floats.length = 0;
  }, fHora);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(__dirname, `${pref}-0-antes-da-virada.png`) });

  // Cruza o limiar e espera o FECHO abrir (verificarCenario roda no laço do HUD, ~0,2 s).
  await page.evaluate(() => { S.energiaTotal += 6; });
  await page.waitForTimeout(500);

  // Atravessa o fecho: cada toque primeiro completa a linha, o seguinte avança.
  for (let i = 0; i < 30; i++) {
    const ceri = await page.evaluate(() =>
      document.getElementById('telaFala').classList.contains('cerimoniando'));
    if (ceri) break;
    await page.evaluate(() => { if (typeof avancarFala === 'function') avancarFala(); });
    await page.waitForTimeout(90);
  }

  // A cerimônia está aberta: fotografa a sequência e mede o sol atrás dela.
  const t0 = Date.now();
  const MARCAS = [0.05, 0.6, 1.2, 1.8, 2.6, 3.4];
  const linhas = [];
  for (const alvo of MARCAS) {
    const falta = t0 + alvo * 1000 - Date.now();
    if (falta > 0) await page.waitForTimeout(falta);
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
      return {
        fracao: (relogio / DIA_SEG) % 1,
        resta: typeof saltoHora === 'number' ? saltoHora : -1,
        ceri: document.getElementById('telaFala').classList.contains('cerimoniando'),
        ceu: banda(0.10, 0.30), meio: banda(0.30, 0.55)
      };
    });
    m.t = (Date.now() - t0) / 1000;      // o tempo REAL — o screenshot atrasa as marcas
    linhas.push(m);
    await page.screenshot({ path: path.join(__dirname, `${pref}-t${alvo.toFixed(2)}.png`) });
  }
  const cer = await page.evaluate(() => window.__cer);

  console.log(`virada com a hora partindo de ${fHora} (0=manhã 0.25=tarde 0.5=pós-chuva 0.75=noite)`);
  console.log('   t  | fração do dia | resta (s de jogo) | céu   | meio  | cerimônia');
  for (const l of linhas)
    console.log(` ${l.t.toFixed(2)} |     ${l.fracao.toFixed(3)}     |      ${String(Math.round(l.resta)).padStart(5)}      | ${l.ceu.toFixed(1).padStart(5)} | ${l.meio.toFixed(1).padStart(5)} | ${l.ceri ? 'aberta' : 'FECHOU'}`);
  if (cer && cer.on && cer.off) console.log(`cerimônia durou ${((cer.off - cer.on) / 1000).toFixed(2)} s (classe medida por observer)`);
  if (errors.length) { console.log('ERROS:'); errors.forEach(e => console.log(' ', e)); process.exit(1); }
  await browser.close();
})();
