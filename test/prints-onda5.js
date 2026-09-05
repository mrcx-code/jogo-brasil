// Onda 5 da Direção de Arte — VOLTAR É AMANHECER, medido no tempo.
// Uso: node test/prints-onda5.js [prefixo] [fração-da-hora]   (padrão "O5" e 0.75 = NOITE)
//
// Provoca um retorno de DIA 2 REAL: joga um pouco, salva, adultera o save para "ontem"
// (salvoEm − 20 h) e a retenção para conter só o dia de ontem, e recarrega — o papel
// "ENQUANTO VOCÊ ESTEVE FORA" tem que abrir com diaNovo verdadeiro. Fixa a hora, fecha o
// papel com um toque e fotografa a sequência, medindo em cada marca:
//   - a fração do dia (relogio/DIA_SEG % 1) — a posição do sol
//   - saltoHora restante — a varredura em curso (0 no ANTES, que não varre nada)
//   - luma média do CÉU (10..30% da altura) no #fundoHD
// A régua: no ANTES fechar o papel deixa a luz onde estava; a onda 5 quer que ela TERMINE
// na manhã (fração 0,00), com a física da onda 3. Tempo REAL nas marcas — o screenshot
// atrasa ~0,4 s e a onda 3 já pagou essa armadilha.
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
  const pref = process.argv[2] || 'O5';
  const fHora = process.argv[3] !== undefined ? parseFloat(process.argv[3]) : 0.75;
  const alvo = process.env.JOGO_HTML || path.resolve(__dirname, '..', 'index.html');
  const file = /^https?:/.test(alvo) ? alvo : ABRIR('file://' + path.resolve(alvo));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !ehRuidoDeRedeExterna(m)) errors.push('CONSOLE: ' + m.text()); });
  await page.goto(file);
  await page.waitForTimeout(1200);

  // Uma sessão de "ontem": estado mínimo salvo, depois o carimbo e a retenção adulterados.
  // Os dois gravadores são NEUTRALIZADOS em seguida, porque o jogo salva no pagehide e
  // desfaria a adulteração no próprio reload — meia sessão de armadilha, paga aqui.
  await page.evaluate(() => {
    S.energiaTotal = 800; S.energia = 200;
    salvar();
    window.salvar = function () {};
    window.salvarRetencao = function () {};
    const s = JSON.parse(localStorage.getItem('jogo_brasil_v1'));
    s.salvoEm = Date.now() - 20 * 3600 * 1000;              // saiu ontem à noite
    localStorage.setItem('jogo_brasil_v1', JSON.stringify(s));
    const d = new Date(Date.now() - 24 * 3600 * 1000);
    const ontem = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
      + '-' + String(d.getDate()).padStart(2, '0');
    localStorage.setItem('jogo_brasil_retencao',
      JSON.stringify({ dias: [ontem], segundos: 1200, tochas: 0 }));
  });

  // O DIA 2: recarrega. marcarDia() acha um dia que não é o de ontem → diaNovo; o save de
  // 20 h atrás → o papel da volta abre por cima do menu.
  await page.reload();
  await page.waitForTimeout(1500);
  const aberto = await page.evaluate(() =>
    document.getElementById('retorno').classList.contains('aberto'));
  if (!aberto) {
    console.log('FALHA: o papel de retorno não abriu — o cenário do dia 2 não se armou.');
    process.exit(1);
  }

  // A hora do teste (a semeadura veio da hora real da máquina; o teste precisa de escuro
  // determinístico) e a foto do papel aberto sobre a noite.
  await page.evaluate((f) => { window.setHora(f); }, fHora);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(__dirname, `${pref}-0-retorno.png`) });
  const f0 = await page.evaluate(() => (relogio / DIA_SEG) % 1);

  // Fecha o papel com o toque que o jogo espera — e mede o que a luz faz em seguida.
  await page.evaluate(() => {
    document.getElementById('retorno').dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true }));
  });
  const t0 = Date.now();
  const MARCAS = [0.05, 0.6, 1.2, 1.8, 2.6, 3.4];
  const linhas = [];
  for (const m of MARCAS) {
    const falta = t0 + m * 1000 - Date.now();
    if (falta > 0) await page.waitForTimeout(falta);
    const l = await page.evaluate(() => {
      const fc = document.getElementById('fundoHD');
      const fx = fc.getContext('2d');
      const w = fc.width, h = fc.height;
      const d = fx.getImageData(0, Math.round(h * 0.10), w, Math.max(1, Math.round(h * 0.20))).data;
      let s = 0, n = 0;
      for (let i = 0; i < d.length; i += 16) { s += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; n++; }
      return {
        fracao: (relogio / DIA_SEG) % 1,
        resta: typeof saltoHora === 'number' ? saltoHora : -1,
        ceu: s / n
      };
    });
    l.t = (Date.now() - t0) / 1000;      // o tempo REAL — o screenshot atrasa as marcas
    linhas.push(l);
    await page.screenshot({ path: path.join(__dirname, `${pref}-t${m.toFixed(2)}.png`) });
  }

  console.log(`retorno de dia 2 fechado com a hora partindo de ${f0.toFixed(3)} (pedida: ${fHora})`);
  console.log('   t  | fração do dia | resta (s de jogo) | céu');
  for (const l of linhas)
    console.log(` ${l.t.toFixed(2)} |     ${l.fracao.toFixed(3)}     |      ${String(Math.round(l.resta)).padStart(5)}      | ${l.ceu.toFixed(1)}`);
  const fim = linhas[linhas.length - 1];
  console.log(fim.fracao < 0.02 || fim.fracao > 0.98
    ? 'FECHOU EM MANHÃ (fração ~0,00) — voltar amanheceu.'
    : `fechou em ${fim.fracao.toFixed(3)} — a luz NÃO varreu até a manhã.`);
  if (errors.length) { console.log('ERROS:'); errors.forEach(e => console.log(' ', e)); process.exit(1); }
  await browser.close();
})();
