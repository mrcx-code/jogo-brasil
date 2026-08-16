const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');
const PACK = { pindorama:null, palmares:'palmares', cais:'cais', salvador:'salvador',
  jabaquara:'jabaquara', pequenaafrica:'pequenaafrica', portas:'portas', naodito:'naodito',
  praca:'naodito', segurou:'naodito', aceiro:'naodito', temfonte:'hoje', hoje:'hoje' };
(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const erros = []; pg.on('pageerror', e => erros.push(e.message));
  await pg.goto(ABRIR('file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/')));
  await pg.waitForTimeout(1300);
  const resumo = [];
  for (const id of Object.keys(PACK)) {
    await pg.evaluate(([id, pk]) => {
      localStorage.clear(); fecharTelas(); pararFala();
      if (pk && typeof garantirPacote === 'function') garantirPacote(pk);
      const i = EPOCAS.findIndex(e => e.id === id);
      S.cenario = cenarioDaEpoca(i); S.fronteira = S.cenario;
    }, [id, PACK[id]]);
    await pg.waitForTimeout(PACK[id] ? 3500 : 600);
    await pg.evaluate(([id]) => {
      const i = EPOCAS.findIndex(e => e.id === id);
      mostrarAbertura(undefined, true);
    }, [id]);
    await pg.waitForTimeout(4300);
    for (let k = 0; k < 20; k++) {
      const st = await pg.evaluate(() => ({ i: falaI, n: falaLinhas.length }));
      if (st.n > 0 && st.i >= st.n - 1) break;
      await pg.evaluate(() => avancarFala());
      await pg.waitForTimeout(280);
    }
    await pg.waitForTimeout(1300);
    const d = await pg.evaluate(() => {
      const r = document.getElementById('falaRetrato');
      const ctx = document.querySelector('.falaCtx.viva');
      return { linhas: falaLinhas.length,
        ultima: (falaLinhas[falaI] || '').slice(0, 34),
        retrato: !!r && !r.classList.contains('oculta'),
        ctxViva: !!ctx };
    });
    d.id = id; resumo.push(d);
    await pg.screenshot({ path: path.join(__dirname, 'VARRE-' + id + '.png') });
    await pg.evaluate(() => pararFala());
  }
  resumo.forEach(d => console.log(d.id.padEnd(14) + ' linhas ' + String(d.linhas).padStart(2) +
    ' | retrato ' + (d.retrato ? 'SIM' : 'nao') + ' | ctx ' + (d.ctxViva ? 'SIM' : 'nao') +
    ' | ultima: ' + d.ultima));
  console.log('erros:', erros.length ? erros[0] : '(nenhum)');
  await nav.close();
})();
