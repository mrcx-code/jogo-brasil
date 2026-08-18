// SONDA TEMPORÁRIA — mede os três rótulos que estouram. Apagar depois de usar.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const TELAS = [{ w: 320, h: 568 }, { w: 360, h: 640 }];

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

    // ---------- A ----------
    await pg.evaluate(() => {
      R.chegou = 2; R.dias = 3; R.historia = 1; R.fontes = 1;
      fecharTelas(); montarFim(); montarPergunta();
      const p = document.getElementById('fimPergunta'); if (p) p.classList.remove('oculto');
      const b = document.getElementById('fimPerguntaBotoes'); if (b) b.classList.remove('oculto');
      abrirTela('telaFim');
    });
    await pg.waitForTimeout(600);
    const A = await pg.evaluate(() => {
      const tit = document.getElementById('fimTit');
      const cv = tit.querySelector('canvas');
      const tela = document.getElementById('telaFim');
      const cs = getComputedStyle(tit);
      tela.scrollLeft = 9999;
      const sl = tela.scrollLeft;
      tela.scrollLeft = 0;
      return {
        texto: tit.getAttribute('aria-label'),
        canvasCSS: cv ? parseFloat(cv.style.width) : null,
        titRect: +tit.getBoundingClientRect().width.toFixed(1),
        titLeft: +tit.getBoundingClientRect().left.toFixed(1),
        titRight: +tit.getBoundingClientRect().right.toFixed(1),
        padH: parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight),
        telaClientW: tela.clientWidth, telaScrollW: tela.scrollWidth,
        scrollLeftMax: sl,
        docScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        escComRect: escalaQueCabe('DE NOVO ATÉ AQUI', 3, tit.getBoundingClientRect().width),
        escComPai: escalaQueCabe('DE NOVO ATÉ AQUI', 3, tela.clientWidth - (parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight))),
      };
    });
    console.log('A) CHEGADA 2a vez  ', JSON.stringify(A));
    await pg.screenshot({ path: 'test/tmp-A-antes-' + t.w + '.png' });

    const Asim = await pg.evaluate(() => {
      const tit = document.getElementById('fimTit');
      const tela = document.getElementById('telaFim');
      const cs = getComputedStyle(tit);
      const disp = tela.clientWidth - (parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight));
      const e = escalaQueCabe('DE NOVO ATÉ AQUI', 3, disp);
      pixelRotulo(tit, 'DE NOVO ATÉ AQUI', e, '#ffd98a');
      tela.scrollLeft = 9999; const sl = tela.scrollLeft; tela.scrollLeft = 0;
      return { esc: e, disp,
        canvasCSS: parseFloat(tit.querySelector('canvas').style.width),
        titRect: +tit.getBoundingClientRect().width.toFixed(1),
        telaScrollW: tela.scrollWidth, telaClientW: tela.clientWidth, scrollLeftMax: sl };
    });
    console.log('A) DEPOIS do patch ', JSON.stringify(Asim));
    await pg.screenshot({ path: 'test/tmp-A-depois-' + t.w + '.png' });

    // ---------- B ----------
    const TITULOS = ['O QUE NÃO PODIA SER DITO', 'O CAIS QUE VOLTOU À LUZ', 'PINDORAMA'];
    for (const titulo of TITULOS) {
      await pg.evaluate((tt) => {
        fecharTelas();
        abrirFala(tt, '1964 a 1985', ['Uma linha qualquer para a caixa ter corpo e altura.',
          'Outra linha, para o fantasma medir dois paragrafos.'], null, null, false);
      }, titulo);
      await pg.waitForTimeout(900);
      const B = await pg.evaluate(() => {
        const tit = document.getElementById('falaTit');
        const cv = tit.querySelector('canvas');
        const caixa = document.getElementById('falaCaixa');
        const corpo = document.getElementById('falaCorpo');
        const cc = getComputedStyle(caixa);
        const rc = caixa.getBoundingClientRect(), rt = cv ? cv.getBoundingClientRect() : null;
        return {
          texto: tit.getAttribute('aria-label'),
          canvasCSS: cv ? parseFloat(cv.style.width) : null,
          caixaW: +rc.width.toFixed(1),
          caixaPad: parseFloat(cc.paddingLeft) + parseFloat(cc.paddingRight),
          dispCorpo: corpo ? corpo.clientWidth : null,
          sobraNoPapel: rt ? +(rt.right - (rc.right - parseFloat(cc.paddingRight))).toFixed(1) : null,
          foraDaCaixa: rt ? +(rt.right - rc.right).toFixed(1) : null,
          foraDaTela: rt ? +(rt.right - document.documentElement.clientWidth).toFixed(1) : null,
          escSeChamasseAgora: escalaQueCabe(tit.getAttribute('aria-label'), 2, corpo ? corpo.clientWidth : 0),
        };
      });
      console.log('B) fala "' + titulo + '"  ', JSON.stringify(B));
      await pg.screenshot({ path: 'test/tmp-B-' + titulo.slice(0, 6).replace(/\s/g, '') + '-' + t.w + '.png' });
    }

    const Bzero = await pg.evaluate(() => {
      fecharTelas();
      const corpo = document.getElementById('falaCorpo');
      const tit = document.getElementById('falaTit');
      return { corpoClientW_fechado: corpo.clientWidth,
        titRect_fechado: tit.getBoundingClientRect().width,
        escComZero: escalaQueCabe('O QUE NÃO PODIA SER DITO', 2, corpo.clientWidth) };
    });
    console.log('B) com a tela FECHADA', JSON.stringify(Bzero));

    await pg.evaluate(() => {
      fecharTelas();
      abrirFala('O QUE NÃO PODIA SER DITO', '1964 a 1985', ['Uma linha qualquer para a caixa ter corpo.',
        'Outra linha.'], null, null, false);
    });
    await pg.waitForTimeout(900);
    const Bsim = await pg.evaluate(() => {
      const titulo = 'O QUE NÃO PODIA SER DITO';
      const tit = document.getElementById('falaTit');
      const caixa = document.getElementById('falaCaixa');
      const cc = getComputedStyle(caixa);
      const disp = caixa.getBoundingClientRect().width - parseFloat(cc.paddingLeft) - parseFloat(cc.paddingRight);
      const cabe = Math.floor(disp / 12);
      const saida = { disp: +disp.toFixed(1), cabe, linhas: 1 };
      if (titulo.length > cabe && titulo.indexOf(' ') > 0) {
        const meio = Math.floor(titulo.length / 2);
        let corte = -1;
        for (let k = 0; k < titulo.length; k++) {
          if (titulo.charAt(k) !== ' ') continue;
          if (corte < 0 || Math.abs(k - meio) < Math.abs(corte - meio)) corte = k;
        }
        tit.textContent = ''; tit.dataset.px = '';
        const l1 = document.createElement('div'), l2 = document.createElement('div');
        tit.appendChild(l1); tit.appendChild(l2);
        pixelRotulo(l1, titulo.slice(0, corte), 2, '#5c3210');
        pixelRotulo(l2, titulo.slice(corte + 1), 2, '#5c3210');
        saida.linhas = 2; saida.l1 = titulo.slice(0, corte); saida.l2 = titulo.slice(corte + 1);
      }
      const cvs = Array.prototype.slice.call(tit.querySelectorAll('canvas')).map(c => parseFloat(c.style.width));
      saida.canvases = cvs;
      saida.maiorFora = +(Math.max.apply(null, cvs) - disp).toFixed(1);
      saida.altura = +tit.getBoundingClientRect().height.toFixed(1);
      return saida;
    });
    console.log('B) DEPOIS do patch ', JSON.stringify(Bsim));
    await pg.screenshot({ path: 'test/tmp-B-depois-' + t.w + '.png' });

    // ---------- C ----------
    await pg.evaluate(() => { fecharTelas(); montarConfig(); abrirTela('telaConfig'); });
    await pg.waitForTimeout(600);
    const C = await pg.evaluate(() => {
      const ids = ['btnSom', 'btnMedir', 'btnApagar', 'btnVoltarCfg'];
      const out = [];
      for (const id of ids) {
        const b = document.getElementById(id); if (!b) continue;
        const cv = b.querySelector('canvas');
        const cs = getComputedStyle(b);
        const r = b.getBoundingClientRect();
        out.push({ id, texto: b.getAttribute('aria-label'),
          canvasCSS: cv ? parseFloat(cv.style.width) : null,
          btnW: +r.width.toFixed(1),
          padH: parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight),
          conteudo: +(r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)).toFixed(1),
          foraDaTabuaCadaLado: cv ? +(((parseFloat(cv.style.width) - r.width) / 2)).toFixed(1) : null,
          escSeChamasse: cv ? escalaQueCabe(b.getAttribute('aria-label'), 2, r.width) : null });
      }
      const tela = document.getElementById('telaConfig');
      tela.scrollLeft = 9999; const sl = tela.scrollLeft; tela.scrollLeft = 0;
      return { botoes: out, telaClientW: tela.clientWidth, telaScrollW: tela.scrollWidth, scrollLeftMax: sl,
        docScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    console.log('C) AJUSTES         ', JSON.stringify(C, null, 1));
    await pg.screenshot({ path: 'test/tmp-C-antes-' + t.w + '.png' });

    await pg.addStyleTag({ content: '@media (max-width: 360px) { .tela .telaBtn { width: min(84vw, 290px); padding-left: 14px; padding-right: 14px; } }' });
    await pg.waitForTimeout(300);
    const Csim = await pg.evaluate(() => {
      const out = [];
      for (const id of ['btnSom', 'btnMedir', 'btnApagar', 'btnVoltarCfg']) {
        const b = document.getElementById(id); if (!b) continue;
        const cv = b.querySelector('canvas'); const r = b.getBoundingClientRect();
        out.push({ id, canvasCSS: cv ? parseFloat(cv.style.width) : null, btnW: +r.width.toFixed(1),
          foraCadaLado: cv ? +(((parseFloat(cv.style.width) - r.width) / 2)).toFixed(1) : null });
      }
      const tela = document.getElementById('telaConfig');
      return { botoes: out, telaScrollW: tela.scrollWidth, telaClientW: tela.clientWidth,
        docScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    console.log('C) com tabua larga ', JSON.stringify(Csim));
    await pg.screenshot({ path: 'test/tmp-C-larga-' + t.w + '.png' });

    await pg.addStyleTag({ content: '@media (max-width: 360px) { .tela .telaBtn { width: min(70vw, 290px); padding-left: 34px; padding-right: 34px; } }' });
    await pg.waitForTimeout(200);
    const Csim2 = await pg.evaluate(() => {
      const b = document.getElementById('btnApagar');
      const t = 'APAGAR MEU PROGRESSO';
      const e = escalaQueCabe(t, 2, b.getBoundingClientRect().width);
      pixelRotulo(b, t, e, '#e8a595');
      const cv = b.querySelector('canvas'); const r = b.getBoundingClientRect();
      return { esc: e, canvasCSS: parseFloat(cv.style.width), btnW: +r.width.toFixed(1) };
    });
    console.log('C) com escalaQueCabe', JSON.stringify(Csim2));
    await pg.screenshot({ path: 'test/tmp-C-esc-' + t.w + '.png' });

    if (erros.length) console.log('ERROS DE CONSOLE:', erros);
    await pg.close();
  }
  await nav.close();
})();
