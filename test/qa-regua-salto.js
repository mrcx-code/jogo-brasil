// QA — A RÉGUA DO SALTO POSTA CONTRA SI MESMA (23/08, auditoria do ramo a0db28de).
//
// O smoke passou a julgar o primeiro quadro depois de fechar A HISTÓRIA por TAXA
// (px por ms) em vez de por PIXEL. A entrega afirma que a régua nova reprova o caso
// ruim; este instrumento não confia na afirmação: ele INJETA o caso ruim em doses e
// mede em que dose cada régua morde.
//
//   node test/qa-regua-salto.js [--doses=0,0.5,1,...] [--lento=0] [--repeticoes=1]
//
// `--lento=N` põe N ms de trabalho síncrono dentro do quadro de referência, para
// simular a máquina cheia sem depender de a máquina estar cheia. É assim que se
// responde a pergunta que a entrega não faz: a régua nova ainda morde quando o
// quadro é longo?
//
// Sai 0 sempre — é medida, não portão. Quem lê a tabela decide.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

const arg = (n, d) => {
  const m = process.argv.find(a => a.startsWith('--' + n + '='));
  return m ? m.split('=')[1] : d;
};
const DOSES = String(arg('doses', '0,0.5,1,1.5,2,3,5,9')).split(',').map(Number);
const LENTO = Number(arg('lento', 0));
const REP = Number(arg('repeticoes', 1));

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', process.env.JOGO_HTML || 'index.html'));

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await page.goto(ALVO);
  await page.waitForFunction(() => typeof S !== 'undefined'
    && document.getElementById('telaMenu').classList.contains('aberta'), null, { timeout: 30000 });

  console.log('dose(px)  primeiro   ms1    taxa1     normal   ms2    taxa2     teto      NOVA    VELHA');
  const linhas = [];
  for (const dose of DOSES) {
    for (let r = 0; r < REP; r++) {
      // o mesmo cenário do FLOW 4 do smoke, montado do zero a cada dose
      const m = await page.evaluate(async (cfg) => {
        fecharTelas();
        S.u1 = S.u2 = false; S.u3 = true; S.u4 = false;
        S.energia = 0; S.energiaTotal = 100; S.cenario = 0; S.modo = 'limpo'; saltoHora = 0;
        mobs.length = 0; drops.length = 0; folhas.length = 0; floats.length = 0;
        await new Promise(r => setTimeout(r, 300));
        abrirFala('QA', 'agora', ['Uma linha, so para a tela ficar aberta.'], null);
        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => setTimeout(r, 1000));
        return await new Promise(res => {
          requestAnimationFrame(() => {
            const x0 = worldX, tA = performance.now();
            fecharTelas();
            // O DEFEITO INJETADO: chão despejado no primeiro quadro depois de fechar.
            if (cfg.dose) worldX += cfg.dose;
            // ...e o quadro de referência esticado de propósito, quando pedido.
            if (cfg.lento) { const ate = performance.now() + cfg.lento; while (performance.now() < ate); }
            requestAnimationFrame(() => {
              const x1 = worldX, tB = performance.now();
              requestAnimationFrame(() => res({
                primeiro: x1 - x0, normal: worldX - x1,
                ms1: tB - tA, ms2: performance.now() - tB,
              }));
            });
          });
        });
      }, { dose, lento: LENTO });

      const taxa = (px, ms) => (ms > 0 ? px / ms : 0);
      const taxa1 = taxa(m.primeiro, m.ms1), taxa2 = taxa(m.normal, m.ms2);
      const teto = Math.max(taxa2 * 3, 0.115);
      const nova = taxa1 > teto;
      const velha = m.primeiro > Math.max(m.normal * 3, 3);
      linhas.push({ dose, nova, velha });
      console.log(
        String(dose).padStart(7) + '  ' + m.primeiro.toFixed(3).padStart(8) + ' ' + m.ms1.toFixed(0).padStart(5)
        + '  ' + taxa1.toFixed(4).padStart(7) + '  ' + m.normal.toFixed(3).padStart(8) + ' ' + m.ms2.toFixed(0).padStart(5)
        + '  ' + taxa2.toFixed(4).padStart(7) + '  ' + teto.toFixed(4).padStart(7)
        + '   ' + (nova ? 'REPROVA' : 'passa  ') + ' ' + (velha ? 'REPROVA' : 'passa'));
    }
  }
  const menorNova = linhas.filter(l => l.nova).map(l => l.dose).sort((a, b) => a - b)[0];
  const menorVelha = linhas.filter(l => l.velha).map(l => l.dose).sort((a, b) => a - b)[0];
  console.log('\nlento=' + LENTO + ' ms | menor dose que a NOVA reprova: ' + (menorNova === undefined ? 'NENHUMA' : menorNova + ' px')
    + ' | menor dose que a VELHA reprovava: ' + (menorVelha === undefined ? 'NENHUMA' : menorVelha + ' px'));
  await browser.close();
  process.exit(0);
})().catch(e => { console.error('EXPLODIU:', e); process.exit(2); });
