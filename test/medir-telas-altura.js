// A FAIXA MORTA DE ALTURA, tela por tela (18/08).
//
// O DEFEITO QUE ISTO EXISTE PARA NÃO TER DE NOVO. Em 17/08 o menu principal foi consertado: ele
// tinha 211 px de altura (601..811) em que o layout cheio não cabia e o compacto já não era
// aplicado, separados por uma consulta de mídia de 1 px. Trocou-se o degrau por sete variáveis
// que interpolam, e ficou são. **Só que o conserto foi feito no menu e em mais nenhuma tela** —
// e a AJUSTES tem exatamente o mesmo degrau, escrito olhando 320×568, com o mesmo sintoma numa
// faixa que inclui 360×640: o aparelho Android mais comum do país.
//
// Este instrumento varre a altura de 20 em 20 px e mede, em CADA tela, se algo saiu da janela.
// Ele não olha só o caso fácil — medir o caso fácil é pior que não medir, porque dá confiança.
const { chromium } = require('playwright');
const path = require('path');
const ABRIR = require('./abrir.js');

const ALVO = ABRIR('file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/'));

// A tela do MAPA (ONDE FOI) é território do dono e não se mede aqui, por decisão de 17/08.
const TELAS = ['telaMenu', 'telaConfig', 'telaFim', 'telaCapitulos', 'telaCompletude',
  'telaFontes', 'telaGlossario', 'telaObra'];
const LARGURA = Number(process.argv[2] || 360);
const H0 = Number(process.argv[3] || 560);
const H1 = Number(process.argv[4] || 900);

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage({ viewport: { width: LARGURA, height: H1 }, hasTouch: true, isMobile: true });
  const erros = [];
  pg.on('pageerror', e => erros.push(e.message));
  await pg.goto(ALVO);
  await pg.waitForTimeout(1600);
  // um save que abre tudo: a CHEGADA na segunda vez, a obra de pé, os capítulos lidos
  await pg.evaluate(() => {
    localStorage.clear();
    S.aberturas = MASCARA_EPOCAS; S.fechos = MASCARA_EPOCAS; S.travessias = 1;
    S.cenario = TOTAL_CENAS - 1; S.fronteira = S.cenario;
    S.acolhidos = S.acolhidos.map(() => 0); S.acolhidos[CAP_GENTE] = 6;
    R.chegou = 2; R.dias = 4; R.segundos = 9000; R.historia = 3; R.fontes = 2;
    fecharTudo(); pararFala();
  });

  const faixa = {};
  TELAS.forEach(t => { faixa[t] = []; });

  for (let h = H0; h <= H1; h += 20) {
    await pg.setViewportSize({ width: LARGURA, height: h });
    await pg.waitForTimeout(180);
    for (const t of TELAS) {
      const r = await pg.evaluate((t) => {
        fecharTudo();
        if (t === 'telaFim' && typeof montarFim === 'function') montarFim();
        abrirTela(t);
        const el = document.getElementById(t);
        if (!el) return null;
        const cx = el.getBoundingClientRect();
        // o que EXTRAPOLA a janela, em px, em cima e embaixo — medido no filho mais externo
        let acima = 0, abaixo = 0, largura = 0;
        const filhos = [...el.querySelectorAll('.telaTit, .telaBtn, .cartao, #cfgInfo')];
        filhos.forEach(function (f) {
          const b = f.getBoundingClientRect();
          if (b.height === 0) return;
          acima = Math.max(acima, Math.round(-b.top));
          abaixo = Math.max(abaixo, Math.round(b.bottom - window.innerHeight));
          largura = Math.max(largura, Math.round(b.right - window.innerWidth), Math.round(-b.left));
        });
        return {
          acima, abaixo, largura,
          rolaX: el.scrollWidth > el.clientWidth ? el.scrollWidth - el.clientWidth : 0,
          rolaCorpo: document.body.scrollWidth > window.innerWidth,
          podeRolar: getComputedStyle(el).overflowY !== 'visible',
        };
      }, t);
      if (r) faixa[t].push({ h, ...r });
    }
  }

  console.log('largura ' + LARGURA + ' px · alturas ' + H0 + '..' + H1 + '\n');
  let reprovas = 0;
  for (const t of TELAS) {
    // corte de verdade = sai da janela E a tela não rola para resgatar
    const cortes = faixa[t].filter(x => (x.acima > 0 || x.abaixo > 0) && !x.podeRolar);
    const lados = faixa[t].filter(x => x.largura > 0 || x.rolaX > 0);
    const corpo = faixa[t].filter(x => x.rolaCorpo);
    const alt = cortes.map(x => x.h);
    console.log(t.padEnd(16) +
      (alt.length ? 'CORTA em ' + alt.length + ' altura(s): ' + alt[0] + '..' + alt[alt.length - 1] +
        ' (pior: ' + Math.max(...cortes.map(x => x.acima)) + ' px acima, ' +
        Math.max(...cortes.map(x => x.abaixo)) + ' px abaixo)'
        : 'cabe em todas') +
      (lados.length ? ' · SAI DE LADO em ' + lados.length : '') +
      (corpo.length ? ' · CORPO ROLA em ' + corpo.length : ''));
    if (alt.length) reprovas++;
    if (lados.length) reprovas++;
  }
  console.log('\nerros de console: ' + (erros.length ? erros[0] : '(nenhum)'));
  console.log(reprovas ? '\nFALHOU: ' + reprovas + ' problema(s) de encaixe' : '\nPASSOU');
  await nav.close();
  process.exit(reprovas ? 1 : 0);
})();
