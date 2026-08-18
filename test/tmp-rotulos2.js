// SONDA TEMPORÁRIA 2 — ciclo de vida, largura REAL disponível e simulação dos patches.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const TELAS = [{ w: 320, h: 568 }, { w: 360, h: 640 }, { w: 390, h: 844 }];

(async () => {
  const alvo = ABRIR('file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/'));
  const nav = await chromium.launch();
  for (const t of TELAS) {
    const pg = await nav.newPage({ viewport: { width: t.w, height: t.h }, deviceScaleFactor: 2 });
    const erros = [];
    pg.on('pageerror', e => erros.push(e.message));
    await pg.goto(alvo);
    await pg.waitForTimeout(1400);
    console.log('\n================ ' + t.w + 'x' + t.h + ' ================');

    // 0) CICLO DE VIDA — o que dá para medir ANTES de abrir a tela
    const vida = await pg.evaluate(() => {
      const f = (id) => {
        const e = document.getElementById(id);
        const cs = getComputedStyle(e);
        return { display: cs.display, visibility: cs.visibility, clientW: e.clientWidth,
          rectW: +e.getBoundingClientRect().width.toFixed(1) };
      };
      return { telaFim: f('telaFim'), fimTit: f('fimTit'), telaFala: f('telaFala'),
        falaCorpo: f('falaCorpo'), falaTit: f('falaTit'), telaConfig: f('telaConfig'),
        retorno: f('retorno') };
    });
    console.log('0) ANTES de abrir  ', JSON.stringify(vida));

    // 1) TODA TELA: quem rola de lado, e por causa de quem
    const varrer = await pg.evaluate(() => {
      const estados = [
        ['eras', () => { fecharTelas(); montarCapitulos(); abrirTela('telaCapitulos'); }],
        ['historia', () => { fecharTelas(); montarCompletude(); abrirTela('telaCompletude'); }],
        ['fontes', () => { fecharTelas(); montarFontes(); abrirTela('telaFontes'); }],
        ['ajustes', () => { fecharTelas(); montarConfig(); abrirTela('telaConfig'); }],
        ['chegada2', () => { R.chegou = 2; fecharTelas(); montarFim(); abrirTela('telaFim'); }],
      ];
      const saida = [];
      for (const [nome, abre] of estados) {
        abre();
        const tela = document.querySelector('.tela.aberta');
        if (!tela) { saida.push({ nome, erro: 'nao abriu' }); continue; }
        tela.scrollLeft = 9999; const sl = tela.scrollLeft; tela.scrollLeft = 0;
        // quem passa da borda?
        const culpados = [];
        const lim = tela.clientWidth;
        tela.querySelectorAll('*').forEach(function (e) {
          const b = e.getBoundingClientRect();
          if (b.width === 0) return;
          if (b.right > lim + 0.5 || b.left < -0.5) {
            culpados.push((e.id || e.className || e.tagName) + ' [' +
              Math.round(b.left) + '..' + Math.round(b.right) + '] w=' + Math.round(b.width));
          }
        });
        saida.push({ nome, id: tela.id, clientW: tela.clientWidth, scrollW: tela.scrollWidth,
          scrollLeftMax: sl, culpados: culpados.slice(0, 6) });
      }
      return saida;
    });
    console.log('1) telas que rolam de lado:');
    varrer.forEach(v => console.log('   ', JSON.stringify(v)));

    // 2) A — a largura DISPONÍVEL de verdade (caixa de conteúdo do pai menos o recheio da placa)
    const A = await pg.evaluate(() => {
      R.chegou = 2; fecharTelas(); montarFim(); abrirTela('telaFim');
      const tela = document.getElementById('telaFim'), tit = document.getElementById('fimTit');
      const cst = getComputedStyle(tela), csi = getComputedStyle(tit);
      const disp = tela.clientWidth - parseFloat(cst.paddingLeft) - parseFloat(cst.paddingRight)
        - parseFloat(csi.paddingLeft) - parseFloat(csi.paddingRight);
      return { padTela: parseFloat(cst.paddingLeft) + parseFloat(cst.paddingRight),
        padTit: parseFloat(csi.paddingLeft) + parseFloat(csi.paddingRight),
        disp, escQueCabe: escalaQueCabe('DE NOVO ATÉ AQUI', 3, disp),
        escCurto: escalaQueCabe('ATÉ AQUI', 3, disp) };
    });
    console.log('2) A: disponivel   ', JSON.stringify(A));

    // 3) A — simulação do patch com a largura certa
    const Asim = await pg.evaluate(() => {
      const tela = document.getElementById('telaFim'), tit = document.getElementById('fimTit');
      const cst = getComputedStyle(tela), csi = getComputedStyle(tit);
      const disp = tela.clientWidth - parseFloat(cst.paddingLeft) - parseFloat(cst.paddingRight)
        - parseFloat(csi.paddingLeft) - parseFloat(csi.paddingRight);
      const txt = 'DE NOVO ATÉ AQUI';
      pixelRotulo(tit, txt, escalaQueCabe(txt, 3, disp), '#ffd98a');
      tela.scrollLeft = 9999; const sl = tela.scrollLeft; tela.scrollLeft = 0;
      return { canvasCSS: parseFloat(tit.querySelector('canvas').style.width),
        titRect: +tit.getBoundingClientRect().width.toFixed(1),
        scrollW: tela.scrollWidth, clientW: tela.clientWidth, scrollLeftMax: sl };
    });
    console.log('3) A: DEPOIS       ', JSON.stringify(Asim));
    await pg.screenshot({ path: 'test/tmp2-A-depois-' + t.w + '.png' });

    // 3b) A — e se fosse SÓ um max-width no CSS?
    await pg.evaluate(() => { R.chegou = 2; fecharTelas(); montarFim(); abrirTela('telaFim'); });
    await pg.addStyleTag({ content: '.telaTit { max-width: 100%; box-sizing: border-box; }' });
    await pg.waitForTimeout(200);
    const Amax = await pg.evaluate(() => {
      const tela = document.getElementById('telaFim'), tit = document.getElementById('fimTit');
      tela.scrollLeft = 9999; const sl = tela.scrollLeft; tela.scrollLeft = 0;
      const cv = tit.querySelector('canvas');
      return { titRect: +tit.getBoundingClientRect().width.toFixed(1),
        canvasRect: +cv.getBoundingClientRect().width.toFixed(1),
        canvasRight: +cv.getBoundingClientRect().right.toFixed(1),
        scrollW: tela.scrollWidth, clientW: tela.clientWidth, scrollLeftMax: sl };
    });
    console.log('3b) A: so max-width', JSON.stringify(Amax));
    await pg.screenshot({ path: 'test/tmp2-A-maxwidth-' + t.w + '.png' });
    await pg.reload(); await pg.waitForTimeout(1400);

    // 4) B — a largura NO MOMENTO EXATO da chamada dentro de abrirFala, na PRIMEIRA fala da vida
    const Bmomento = await pg.evaluate(() => {
      const orig = pixelRotulo;
      const reg = [];
      window.__reg = reg;
      // embrulha o global: registra a largura do corpo no instante da chamada
      // (não dá para reatribuir `pixelRotulo` declarado com function no escopo léxico global?
      //  dá: declaração de função vira propriedade de window em script clássico)
      window.pixelRotulo = function (el, txt, esc, cor, con) {
        if (el && el.id === 'falaTit') {
          const corpo = document.getElementById('falaCorpo');
          const caixa = document.getElementById('falaCaixa');
          const cc = getComputedStyle(caixa);
          reg.push({ txt, esc, corpoClientW: corpo.clientWidth,
            caixaRectW: +caixa.getBoundingClientRect().width.toFixed(1),
            caixaPad: parseFloat(cc.paddingLeft) + parseFloat(cc.paddingRight),
            telaAberta: document.getElementById('telaFala').classList.contains('aberta'),
            vis: getComputedStyle(document.getElementById('telaFala')).visibility });
        }
        return orig.apply(null, arguments);
      };
      fecharTelas();
      abrirFala('O QUE NÃO PODIA SER DITO', '1964 a 1985', ['linha um.', 'linha dois.'], null, null, false);
      window.pixelRotulo = orig;
      return reg;
    });
    console.log('4) B: no instante da chamada', JSON.stringify(Bmomento));

    // 5) B — quanto o rótulo passa da moldura interna (o aro de 9 px do box-shadow)
    await pg.waitForTimeout(700);
    const B = await pg.evaluate(() => {
      const out = [];
      for (const tt of ['O QUE NÃO PODIA SER DITO', 'O CAIS QUE VOLTOU À LUZ', 'A LEI QUE VEIO DEPOIS']) {
        fecharTelas();
        abrirFala(tt, 'quando', ['linha um.', 'linha dois.'], null, null, false);
        const tit = document.getElementById('falaTit');
        const cv = tit.querySelector('canvas');
        const caixa = document.getElementById('falaCaixa');
        const cc = getComputedStyle(caixa);
        const rc = caixa.getBoundingClientRect(), rt = cv.getBoundingClientRect();
        const dentroDoAro = rc.right - parseFloat(cc.paddingRight);   // borda do papel útil
        out.push({ tt, canvas: parseFloat(cv.style.width),
          disp: +(rc.width - parseFloat(cc.paddingLeft) - parseFloat(cc.paddingRight)).toFixed(1),
          passaDoPapel: +(rt.right - dentroDoAro).toFixed(1),
          passaDaCaixa: +(rt.right - rc.right).toFixed(1) });
      }
      return out;
    });
    console.log('5) B: por quanto passa', JSON.stringify(B));

    // 6) C — simulação: tábua um pouco mais larga, SÓ no bloco que a AJUSTES já tem
    await pg.evaluate(() => { fecharTelas(); montarConfig(); abrirTela('telaConfig'); });
    await pg.waitForTimeout(400);
    await pg.screenshot({ path: 'test/tmp2-C-antes-' + t.w + '.png' });
    await pg.addStyleTag({ content: '@media (orientation: portrait) and (max-height: 600px) { #telaConfig .telaBtn { width: min(78vw, 290px); } }' });
    await pg.waitForTimeout(250);
    const C = await pg.evaluate(() => {
      const out = [];
      for (const id of ['btnSom', 'btnMedir', 'btnApagar', 'btnVoltarCfg']) {
        const b = document.getElementById(id); if (!b) continue;
        const cv = b.querySelector('canvas'); const r = b.getBoundingClientRect();
        out.push({ id, canvas: cv ? parseFloat(cv.style.width) : null, btnW: +r.width.toFixed(1),
          foraCadaLado: cv ? +(((parseFloat(cv.style.width) - r.width) / 2)).toFixed(1) : null,
          alturaMin: +r.height.toFixed(1) });
      }
      const tela = document.getElementById('telaConfig');
      tela.scrollLeft = 9999; const sl = tela.scrollLeft; tela.scrollLeft = 0;
      return { botoes: out, clientW: tela.clientWidth, scrollW: tela.scrollWidth, scrollLeftMax: sl,
        docScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    console.log('6) C: com 78vw     ', JSON.stringify(C));
    await pg.screenshot({ path: 'test/tmp2-C-depois-' + t.w + '.png' });

    if (erros.length) console.log('ERROS DE CONSOLE:', erros);
    await pg.close();
  }
  await nav.close();
})();
