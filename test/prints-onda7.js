// ONDA 7 — os ícones falam a língua da casa (instrumento).
// Uso: node test/prints-onda7.js [sufixo]     (padrão "antes"; "depois" na build nova)
//
// Duas coisas, nas mesmas condições do smoke (390×844 dsf2, hora fixa de manhã):
//  1. MEDE cada ícone/glifo desenhado do chrome: lado nativo do canvas × lado exibido
//     (getBoundingClientRect) e a razão de escala — a régua exige razão INTEIRA.
//  2. FOTOGRAFA o jogo com HUD e rodapé vivos, um drop com o "+" de pickup e uma folha
//     no ar, mais recortes ampliados de cada família de ícone, para o olho julgar com a
//     pergunta da barra: "isto ganharia um prêmio de jogo mobile?".
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
  const suf = '-' + (process.argv[2] || 'antes');
  const file = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !ehRuidoDeRedeExterna(m)) errors.push('CONSOLE: ' + m.text()); });
  await page.goto(file);
  await page.waitForTimeout(1400);
  await page.evaluate(() => { if (window.setHora) window.setHora(0.05); });

  const shot = async (nome, clip) => {
    await page.screenshot({ path: path.join(__dirname, `O7-${nome}${suf}.png`), clip });
    console.log(`  O7-${nome}${suf}.png`);
  };

  // ---- 1. a medida: todo canvas de ícone do chrome, nativo × exibido ----
  const medidas = await page.evaluate(() => {
    const linhas = [];
    document.querySelectorAll('canvas.pi, canvas.pd').forEach(c => {
      const r = c.getBoundingClientRect();
      const pai = c.closest('[id]') ? c.closest('[id]').id : '?';
      const razao = (r.width / c.width).toFixed(3);
      linhas.push(`${pai.padEnd(14)} ${(c.dataset.i || c.id || '·').padEnd(9)} nativo ${c.width}×${c.height}  exibido ${r.width.toFixed(1)}×${r.height.toFixed(1)}  escala ${razao}${Number.isInteger(r.width / c.width) ? '  (inteira)' : '  <<< NÃO-INTEIRA'}`);
    });
    return linhas;
  });
  console.log('— escala dos ícones do chrome —');
  medidas.forEach(l => console.log('  ' + l));

  // ---- 2. o jogo vivo: HUD + rodapé, com drop e folha provocados ----
  await page.tap('#btnJogar');                       // do menu para a rua
  await page.waitForTimeout(900);
  // primeira corrida abre a fala do capítulo — PULAR devolve a rua
  const falou = await page.evaluate(() => document.getElementById('telaFala').classList.contains('aberta'));
  if (falou) { await page.tap('#btnFalaPular'); await page.waitForTimeout(900); }
  await page.evaluate(() => {
    if (window.setHora) window.setHora(0.05);
    // um drop no meio do quadro, para o "+" de pickup aparecer no print…
    drops.push({ wx: worldX + 190, type: 'smog', t: 0, valor: 4 });
    // …e uma folha no trilho da copa, à direita
    folhas.push({ wx: worldX + 250, y: GROUND - 62, fase: 0 });
  });
  await page.waitForTimeout(600);
  await shot('jogo');
  // recortes ampliados (o dsf 2 já dobra o pixel; o clip aproxima o olho)
  await shot('hud-zoom', { x: 0, y: 20, width: 390, height: 70 });
  await shot('rodape-zoom', { x: 0, y: 720, width: 390, height: 124 });
  await shot('mundo-zoom', { x: 120, y: 380, width: 240, height: 240 });

  if (errors.length) { console.error('ERROS NA PÁGINA:'); errors.forEach(e => console.error('  ' + e)); process.exitCode = 1; }
  await browser.close();
})();
