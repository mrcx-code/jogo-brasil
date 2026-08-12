// A CÉLULA DE POLUIÇÃO, ISOLADA — a mesma do encaixe bloco 23b, fora dele.
//
// Existe porque a asserção do 23b compara PALMARES com PINDORAMA medidos NA MESMA RODADA, e
// quando ela falha não dá para saber se o capítulo piorou ou se a régua caiu. Aqui a célula
// roda sozinha, alternando os dois capítulos, e mostra a média COMPONENTE A COMPONENTE — que é
// o que separa "nasceu mais gente" de "sumiu uma folha".
//   node test/medir-celula-poluicao.js [caminho/do/index.html]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');
function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
(async () => {
  const file = ABRIR('file://' + path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html')));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(file);
  await page.waitForTimeout(1500);
  console.log('alvo: ' + file);
  for (const cap of [0, 1, 0, 1]) {
    const m = await page.evaluate(async (CAP) => {
      fecharTudo(); fecharTelas();
      const c0 = cenarioDaEpoca(CAP);
      S.cenario = c0; S.fronteira = TOTAL_CENAS - 1;
      const ini = LIMIAR_CENA * c0, vao = LIMIAR_CENA * EPOCAS[CAP].cenas;
      S.energiaTotal = ini + vao * 0.85; S.energia = 1e6;
      S.aberturas = MASCARA_EPOCAS; S.fechos = 0; S.marcos = 0;
      marcoAtivo = null; S.u1 = S.u2 = S.u3 = true; S.modo = 'carvao';
      mobs.length = 0; drops.length = 0; folhas.length = 0; floats.length = 0;
      verificarCenario = function () {};
      abrirFala = function () {};
      let n = 0, sm = 0, sd = 0, sf = 0, sfl = 0, sp = 0;
      await new Promise(function (pronto) {
        const t = setInterval(function () {
          sm += mobs.filter(m => !m.dying && !m.dead).length;
          sd += drops.filter(d => !d.morto).length;
          sf += folhas.length; sfl += floats.length; sp += marcoAtivo ? 1 : 0;
          n++;
          if (n >= 60) { clearInterval(t); pronto(); }
        }, 200);
      });
      return { nome: EPOCAS[CAP].nome, mobs: sm / n, drops: sd / n, folhas: sf / n,
        floats: sfl / n, placa: sp / n, tela: telaAberta() };
    }, cap);
    console.log('  ' + String(m.nome).padEnd(10) + ' chegadas ' + m.mobs.toFixed(2) + ' · itens ' + m.drops.toFixed(2) +
      ' · folhas ' + m.folhas.toFixed(2) + ' · números ' + m.floats.toFixed(2) + ' · placa ' + m.placa.toFixed(2) +
      '  = ' + (m.mobs + m.drops + m.folhas + m.floats + m.placa).toFixed(2) +
      (m.tela ? '   <<< MEDIDO COM TELA ABERTA, não vale' : ''));
  }
  await browser.close();
})();
