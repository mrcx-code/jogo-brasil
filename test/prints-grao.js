// O GRÃO DO CHROME (instrumento) — o mundo é pixel art com grão; o chrome era
// gradiente CSS liso. Este script mede e fotografa o encontro dos dois.
// Uso: node test/prints-grao.js [sufixo]   (padrão "antes"; "depois" na build nova)
//
// 1. MEDE: para cada superfície da régua (madeira, pedra, ouro), o background-image
//    computado — o grão só conta se a PRIMEIRA camada for url(data:) — e o peso em
//    bytes das três texturas geradas no boot (zero byte de arte no arquivo: o custo
//    é de runtime e este número o vigia).
// 2. FOTOGRAFA em zoom os três materiais contra o mundo, para o olho julgar com a
//    pergunta da barra: HUD e rodapé agora pertencem à rua?
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
    await page.screenshot({ path: path.join(__dirname, `GR-${nome}${suf}.png`), clip });
    console.log(`  GR-${nome}${suf}.png`);
  };

  // ---- 1. a medida: o grão chegou a cada material? ----
  const medidas = await page.evaluate(() => {
    const linhas = [];
    const raiz = getComputedStyle(document.documentElement);
    ['--veioPx', '--graoPx', '--graoOuroPx'].forEach(v => {
      const val = raiz.getPropertyValue(v).trim();
      linhas.push(`${v.padEnd(13)} ${val ? val.length + ' chars (data URL)' : 'AUSENTE'}`);
    });
    const olha = (sel, material) => {
      const el = document.querySelector(sel);
      if (!el) { linhas.push(`${sel.padEnd(22)} ${material.padEnd(8)} ELEMENTO AUSENTE`); return; }
      const bg = getComputedStyle(el).backgroundImage;
      const primeira = bg.split('url(')[0] === '' && bg.startsWith('url("data:');
      linhas.push(`${sel.padEnd(22)} ${material.padEnd(8)} 1ª camada ${primeira ? 'GRÃO (url data:)' : 'SEM GRÃO <<< '}`);
    };
    olha('#linhaEpoca', 'madeira');
    olha('.telaBtn', 'madeira');
    olha('#btnJogar', 'madeira');
    olha('.rec', 'pedra');
    olha('.chip', 'pedra');
    olha('.cartao', 'pedra');
    olha('#btnClique', 'ouro');
    return linhas;
  });
  console.log('— o grão nas superfícies da régua —');
  medidas.forEach(l => console.log('  ' + l));

  // ---- 2. o menu (madeira contra a mata) ----
  await shot('menu');
  await shot('menu-poste-zoom', { x: 40, y: 520, width: 310, height: 250 });

  // ---- 3. o jogo vivo: HUD e rodapé contra a rua ----
  await page.tap('#btnJogar');
  await page.waitForTimeout(900);
  const falou = await page.evaluate(() => document.getElementById('telaFala').classList.contains('aberta'));
  if (falou) { await page.tap('#btnFalaPular'); await page.waitForTimeout(900); }
  await page.evaluate(() => { if (window.setHora) window.setHora(0.05); });
  await page.waitForTimeout(400);
  await shot('jogo');
  await shot('hud-zoom', { x: 0, y: 20, width: 390, height: 92 });
  // a subtração do HUD: um drop no caminho — o nicho do contador deve NASCER com ele
  await page.evaluate(() => { drops.push({ wx: worldX + 30, type: 'smog', t: 0, valor: 4 }); });
  await page.waitForTimeout(1200);
  await shot('hud-um-drop', { x: 0, y: 20, width: 390, height: 92 });
  await shot('rodape-zoom', { x: 0, y: 716, width: 390, height: 128 });
  await shot('ouro-zoom', { x: 96, y: 738, width: 200, height: 92 });

  // ---- 4. a bandeja de MELHORIAS (pedra sobre pedra) ----
  await page.tap('#openUpgrades');
  await page.waitForTimeout(500);
  await shot('melhorias', { x: 0, y: 560, width: 390, height: 284 });

  if (errors.length) { console.error('ERROS NA PÁGINA:'); errors.forEach(e => console.error('  ' + e)); process.exitCode = 1; }
  await browser.close();
})();
