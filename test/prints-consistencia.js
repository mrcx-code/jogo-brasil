// A RÉGUA DO MENU — instrumento da passada de consistência visual (pedido do dono:
// "o menu e botões não se conversam, todos devem seguir a estética do menu principal").
// Uso: node test/prints-consistencia.js [prefixo]     (padrão "C" e sufixo "-antes")
//      node test/prints-consistencia.js C depois      → sufixo "-depois"
//
// Fotografa TODAS as superfícies de UI a 390×844 dsf2, uma por print, com o estado
// provocado por dentro (as mesmas portas de teste que o smoke usa). Nenhuma medição
// numérica aqui: a régua desta passada é o próprio menu, e o juiz é o olho no print.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}

(async () => {
  const pref = process.argv[2] || 'C';
  const suf = '-' + (process.argv[3] || 'antes');
  const file = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  await page.goto(file);
  await page.waitForTimeout(1400);
  // hora fixa de manhã: a luz não pode ser variável entre o antes e o depois
  await page.evaluate(() => { if (window.setHora) window.setHora(0.05); });

  const shot = async (nome) => {
    await page.screenshot({ path: path.join(__dirname, `${pref}-${nome}${suf}.png`) });
    console.log(`  ${pref}-${nome}${suf}.png`);
  };

  // 1. O MENU — a régua. O jogo abre nele.
  await page.evaluate(() => { fecharTudo(); abrirTela('telaMenu'); });
  await page.waitForTimeout(700);
  await shot('menu');

  // 2. Seleção de eras (estado natural: a atual livre e clara, as outras presas)
  await page.evaluate(() => { montarCapitulos(); abrirTela('telaCapitulos'); });
  await page.waitForTimeout(700);
  await shot('eras');

  // 3. A HISTÓRIA
  await page.evaluate(() => { montarCompletude(); abrirTela('telaCompletude'); });
  await page.waitForTimeout(700);
  await shot('historia');

  // 4. DE ONDE VEM
  await page.evaluate(() => { montarFontes(); abrirTela('telaFontes'); });
  await page.waitForTimeout(700);
  await shot('fontes');

  // 5. AJUSTES
  await page.evaluate(() => { montarConfig(); abrirTela('telaConfig'); });
  await page.waitForTimeout(700);
  await shot('ajustes');

  // 6. A caixa de fala com PULAR (cerimônia encerrada antes do print)
  await page.evaluate(() => { fecharTelas(); S.aberturas = 0; mostrarAbertura(); });
  await page.waitForTimeout(900);
  await page.evaluate(() => { if (typeof emCerimonia === 'function' && emCerimonia()) fimCerimonia(); });
  await page.waitForTimeout(1600);
  await shot('fala');
  // fecha a fala e qualquer outra que a troca de cena tenha enfileirado
  for (let i = 0; i < 6; i++) {
    const aberta = await page.evaluate(() =>
      document.getElementById('telaFala').classList.contains('aberta'));
    if (!aberta) break;
    await page.evaluate(() => { if (typeof emCerimonia === 'function' && emCerimonia()) fimCerimonia(); encerrarFala(); });
    await page.waitForTimeout(450);
  }

  // 7. O jogo: HUD de cima + rodapé (ANDAR), com o sussurro e o marco quietos
  await page.evaluate(() => { fecharTelas(); });
  await page.waitForTimeout(600);
  await shot('jogo');

  // 8. O rodapé em CORRER (o cartão de ritmo no outro estado)
  await page.evaluate(() => { document.getElementById('modeQuick').click(); });
  await page.waitForTimeout(500);
  await shot('jogo-correr');
  await page.evaluate(() => { document.getElementById('modeQuick').click(); });

  // 9. MELHORIAS aberta (bandeja + rodapé no estado fechando)
  await page.evaluate(() => { document.getElementById('openUpgrades').click(); });
  await page.waitForTimeout(600);
  await shot('melhorias');
  await page.evaluate(() => { document.getElementById('openUpgrades').click(); });
  await page.waitForTimeout(400);

  // 10. ENQUANTO VOCÊ ESTEVE FORA (o papel do dia 2), provocada direto
  await page.evaluate(() => { mostrarRetorno(7300); });
  await page.waitForTimeout(500);
  await shot('retorno');
  await page.evaluate(() => { fecharRetorno(); });

  if (errors.length) { console.error('ERROS:\n' + errors.join('\n')); process.exit(1); }
  await browser.close();
  console.log('ok');
})();
