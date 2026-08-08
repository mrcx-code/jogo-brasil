// CALIBRAR-FPS — quantas vezes for preciso, para escolher um limiar RELATIVO que não seja
// flaky. Piso absoluto de FPS é ruído de máquina (16/36/37/61 medidos na mesma máquina em
// dias diferentes); a razão entre a rua VAZIA e a rua CHEIA, medida na mesma rodada, não é.
// Run: node test/calibrar-fps.js [rodadas]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const alvo = () => 'file://' + path.resolve(__dirname, '..', process.env.JOGO_HTML || 'index.html');

async function medir(page) {
  return page.evaluate(async () => {
    const conta = (ms) => new Promise(res => {
      let n = 0; const t0 = performance.now();
      (function f() { n++; performance.now() - t0 < ms ? requestAnimationFrame(f) : res(n / (ms / 1000)); })();
    });
    const limpar = () => { mobs.length = 0; drops.length = 0; folhas.length = 0;
      floats.length = 0; parts.length = 0; magias.length = 0; shocks.length = 0; };
    fecharTelas(); fecharTudo();
    S.cenario = 0; S.u1 = S.u2 = S.u3 = S.u4 = false; redesenharFundo();
    limpar();
    await new Promise(r => setTimeout(r, 400));
    const vazia = await conta(1500);
    // a rua CHEIA: o pior quadro plausível — chegadas, drops, folhas e partículas juntos
    for (let i = 0; i < 8; i++) mobs.push(novoMob(['smog', 'cash', 'barrel'][i % 3], worldX + 40 + i * 34));
    for (let i = 0; i < 8; i++) drops.push({ wx: worldX + 60 + i * 30, type: 'cash', t: 0, valor: 3 });
    for (let i = 0; i < 8; i++) folhas.push({ wx: worldX + 30 + i * 36, y: GROUND - 40 - i, fase: i });
    for (let i = 0; i < 6; i++) burst(40 + i * 40, GROUND - 30, 24, ['#6fdd94', '#ffe08a']);
    S.u3 = true;
    await new Promise(r => setTimeout(r, 200));
    const cheia = await conta(1500);
    S.u3 = false; limpar();
    return { vazia: Math.round(vazia), cheia: Math.round(cheia) };
  });
}

(async () => {
  const n = parseInt(process.argv[2] || '3', 10);
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await page.goto(alvo());
  await page.waitForTimeout(900);
  await page.evaluate(() => fecharTelas());
  const razoes = [];
  for (let i = 0; i < n; i++) {
    const m = await medir(page);
    const r = +(m.cheia / m.vazia).toFixed(3);
    razoes.push(r);
    console.log('rodada', i + 1, '-> vazia', m.vazia, 'fps | cheia', m.cheia, 'fps | razão', r);
  }
  razoes.sort((a, b) => a - b);
  console.log('razões:', razoes.join(', '), '| mínima', razoes[0]);
  await browser.close();
})();
