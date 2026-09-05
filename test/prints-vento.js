// O VENTO DA CORRIDA — prova em print que andar e correr não são a mesma tela.
//   node test/prints-vento.js
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');
(async () => {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await pg.goto(ABRIR('file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/')));
  await pg.waitForTimeout(1800);
  const foto = async (modo, nome, espera) => {
    await pg.evaluate(m => { fecharTelas(); S.modo = m; }, modo);
    await pg.waitForTimeout(espera);
    await pg.screenshot({ path: path.join(__dirname, nome) });
    // quanto do vento está aceso, e quantos riscos há de fato
    return pg.evaluate(() => {
      const c = document.getElementById('heroHD');
      const g = c.getContext('2d');
      const d = g.getImageData(0, 0, c.width, Math.round(c.height * 0.45)).data;
      let claros = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 3] > 8) claros++;
      return claros;
    });
  };
  const andando = await foto('limpo', 'VENTO-andando.png', 900);
  const correndo = await foto('carvao', 'VENTO-correndo.png', 900);
  const voltou = await foto('limpo', 'VENTO-voltou.png', 1200);
  console.log('pixels claros na metade de cima —',
    'andando:', andando, '| correndo:', correndo, '| voltou a andar:', voltou);
  console.log(correndo > andando * 1.5
    ? '✓ correr acende o ar; andar não'
    : '✗ o vento não se distingue de andar');
  console.log(voltou <= andando * 1.5
    ? '✓ e apaga ao voltar a andar'
    : '✗ ficou aceso depois de parar de correr');
  await nav.close();
})();
