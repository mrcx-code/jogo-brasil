// QA INDEPENDENTE DO CAMINHO-DO-CÉU — escrito para DERRUBAR o item, não para confirmá-lo.
//
// O `medir-caminho-do-ceu.js` do dev mede a inércia com as TELAS FECHADAS e conta as cópias
// verticais REIMPLEMENTANDO a desigualdade do motor em JavaScript de teste. As duas coisas são
// buracos de instrumento, e são exatamente os dois lugares onde um vazamento caberia:
//
//   (a) telas fechadas não é o único "fora da home retrato". Home ABERTA em DEITADO, em
//       DESKTOP e em TABLET PAISAGEM, e QUALQUER OUTRA TELA aberta em retrato, são todos
//       estados que a pessoa alcança e que o instrumento do dev não visita.
//   (b) contar cópias por fórmula reescrita no teste é acreditar na fórmula. Se o motor
//       desenhar uma cópia que a fórmula do teste não prevê (arredondamento de ponto
//       flutuante no `dy + dh >= ch`, por exemplo), o instrumento do dev diz "zero cópias" e
//       o motor desenha uma. Aqui a contagem sai do PRÓPRIO `drawImage`, interceptado.
//
// O que este arquivo mede, com as próprias mãos:
//
//   BLOCO 1 — VAZAMENTO. `CanvasRenderingContext2D.prototype.drawImage` é interceptado e cada
//     passada de `rolarFundo()` é contada: quantos desenhos, quantos com a matriz de espelho
//     VERTICAL (`d < 0`, que só o caminho-do-céu produz) e quantos são MOITA de cobertura de
//     costura (a chamada de 5 argumentos do bloco COSTURA_COBRE; `ladrilhar` sempre usa 9).
//     Cruzado com 13 capítulos × 5 contextos.
//
//   BLOCO 2 — INÉRCIA ESTENDIDA. A conta ANTIGA contra o `geoFundo()` do jogo em todos os
//     contextos do bloco 1 que não são a home em retrato.
//
//   BLOCO 3 — A RÉGUA, medida de novo e por fora: faixa livre, respiro e cruzamento em px² nas
//     quatro telas em que ela passa a entrar, e a negativa nas três em que não deve entrar.
//     Mais uma conferência de PIXEL: onde a tinta dela está de verdade no `#heroHD`.
//
//   BLOCO 4 — O EPSILON. Varredura aritmética pura: existe alguma tela em que, com a fração de
//     sempre, `dy + dh` cai um fio abaixo de `ch` e o laço de repetição roda uma volta que
//     ninguém pediu? (É o modo de falha que a contagem por fórmula do dev não veria.)
//
// Uso:  node test/qa-caminho-do-ceu.js
const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

const RAIZ = path.resolve(__dirname, '..');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg' };

function servir() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/' || p === '') p = '/index.html';
      const alvo = path.join(RAIZ, p);
      if (!alvo.startsWith(RAIZ) || !fs.existsSync(alvo) || fs.statSync(alvo).isDirectory()) {
        res.writeHead(404); res.end('nao'); return;
      }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(alvo)] || 'application/octet-stream' });
      fs.createReadStream(alvo).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => ok({ s, url: 'http://127.0.0.1:' + s.address().port + '/index.html' }));
  });
}

const problemas = [];
const rep = (ok, txt) => { if (!ok) problemas.push(txt); return ok ? '✓' : '✗'; };

// A SONDA. Instala o interceptador e devolve, por passada de `rolarFundo()`, o que o motor
// REALMENTE desenhou na camada do fundo.
// ⚠ O PRIMEIRO DETECTOR DE MOITA ESTAVA ERRADO, e a lição 2.8 do EQUIPE.md pegou-o na primeira
// rodada: contar "chamada de 5 argumentos" acusa TAMBÉM o `matoDaEmenda()`, que tapa a emenda
// HORIZONTAL e roda em quase todo capítulo, em toda tela. Ele marcou moita em 12 dos 13
// capítulos na home de retrato e em TODOS os contextos deitados — um falso positivo que teria
// virado "o COSTURA_COBRE vaza" no relatório.
// O discriminador certo é a ALTURA: a moita de costura é desenhada centrada na costura
// VERTICAL, que por construção fica em `g.dy + g.dh` ou abaixo (o pé da pintura); o mato da
// emenda fica em `g.dy + 0,75·g.dh`, um quarto de pintura acima — centenas de px de folga.
const SONDA = `
window.__qaSonda = function () {
  const fc = document.getElementById('fundoHD');
  const proto = CanvasRenderingContext2D.prototype;
  if (!proto.__qaOrig) proto.__qaOrig = proto.drawImage;
  const orig = proto.__qaOrig;
  const g = window.geoFundo();
  const pe = g ? g.dy + g.dh - 20 : Infinity;   // o pé da pintura, com 20 px de folga
  const c = { total: 0, espY: 0, moitas: 0, matoEmenda: 0 };
  proto.drawImage = function () {
    if (this.canvas === fc) {
      c.total++;
      const t = this.getTransform();
      if (t.d < 0) c.espY++;
      if (arguments.length === 5) {
        const centro = arguments[2] + arguments[4] / 2;
        if (centro > pe) c.moitas++; else c.matoEmenda++;
      }
    }
    return orig.apply(this, arguments);
  };
  try { rolarFundo(); } finally { proto.drawImage = orig; }
  return c;
};`;

// Monta um contexto e devolve a leitura completa. `modo` é o estado que a pessoa alcança.
const LER = async (pg, modo) => await pg.evaluate(async (modo) => {
  if (modo === 'home') { fecharTelas(); abrirTela('telaMenu'); }
  else if (modo === 'jogo') { fecharTelas(); }
  else { fecharTelas(); abrirTela(modo); }
  // Espera a mobília parar: `brota` mexe o layout e `medirChaoDaHome` lê LAYOUT, não rect,
  // mas esperar é barato e tira a dúvida de vez.
  const tela = document.querySelector('.tela.aberta');
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  if (tela) {
    const vivas = tela.getAnimations({ subtree: true })
      .filter(a => a.animationName !== 'respira').map(a => a.finished.catch(() => {}));
    await Promise.race([Promise.all(vivas), new Promise(r => setTimeout(r, 1200))]);
  }
  await new Promise(r => requestAnimationFrame(r));
  fitCanvas(); redesenharFundo();
  // ---- O CONTROLE (lição 2.8 do EQUIPE.md): instrumento que nunca foi visto reprovando é
  // decoração. `QA_DEFEITO=vazar` força a linha do chão a subir em TODO contexto, inclusive os
  // deitados e o desktop — que é exatamente o vazamento que os blocos 1 e 2 existem para achar.
  // Com ele o arquivo TEM de sair com exit 1 e apontar cópia vertical fora da home em retrato.
  if (window.__qaDefeito === 'vazar') {
    chaoHome = 0.45; GROUND = Math.round(H * chaoHome); redesenharFundo();
  }
  const c = window.__qaSonda();
  const g = window.geoFundo();
  const alto = CENARIO_ALTO[fundoIdx()], chao = CENARIO_CHAO[fundoIdx()];
  return { g, c, chaoHome, ligado: CHAO_HOME_LIGADO, GROUND, H, W, ESCALA,
    epoca: epocaAtual(), idx: fundoIdx(), naHome: document.body.classList.contains('naHome'),
    iw: alto.naturalWidth, ih: alto.naturalHeight + chao.naturalHeight };
}, modo);

// A conta ANTIGA, escrita aqui e não importada — é o ponto do bloco de inércia.
function contaAntiga(cw, ch, iw, ih) {
  const gs = 0.75, gd = 0.68;
  const scale = Math.max(cw / iw, ch / ih, gd * ch / (gs * ih), (1 - gd) * ch / ((1 - gs) * ih));
  const dw = iw * scale, dh = ih * scale;
  let dy = gd * ch - gs * dh;
  dy = Math.min(0, Math.max(ch - dh, dy));
  return { dw, dh, dy };
}

const CONTEXTOS = [
  { nome: 'home RETRATO',       w: 390,  h: 844,  modo: 'home',          subir: true  },
  { nome: 'home DEITADO',       w: 844,  h: 390,  modo: 'home',          subir: false },
  { nome: 'home DESKTOP',       w: 1366, h: 768,  modo: 'home',          subir: false },
  { nome: 'home TABLET paisag', w: 1024, h: 768,  modo: 'home',          subir: false },
  { nome: 'JOGO retrato',       w: 390,  h: 844,  modo: 'jogo',          subir: false },
  { nome: 'telaCapitulos retr', w: 390,  h: 844,  modo: 'telaCapitulos', subir: false },
];

const COSTURA_COBRE_ESPERADO = [12, 5, 1];

(async () => {
  const { s, url } = await servir();
  const nav = await chromium.launch();
  const erros = [];

  // ======================================================= BLOCO 1 + 2
  console.log('\n================ BLOCO 1+2 — VAZAMENTO E INÉRCIA, 13 capítulos × 6 contextos');
  console.log('   espY = cópias verticais espelhadas desenhadas de verdade (matriz d<0)');
  console.log('   moita = chamada de 5 argumentos, que só o bloco COSTURA_COBRE faz\n');
  for (const ctx of CONTEXTOS) {
    const pg = await nav.newPage({ viewport: { width: ctx.w, height: ctx.h }, deviceScaleFactor: 2,
      hasTouch: ctx.w < 900, isMobile: ctx.w < 900 });
    pg.on('pageerror', e => erros.push(ctx.nome + ' PAGEERROR: ' + e.message));
    pg.on('console', m => { if (m.type() === 'error') erros.push(ctx.nome + ' CONSOLE: ' + m.text()); });
    await pg.goto(url);
    await pg.waitForFunction(() => typeof S !== 'undefined' && !!window.geoFundo && !!window.geoFundo(),
      null, { timeout: 30000 }).catch(() => {});
    await pg.evaluate(SONDA);
    await pg.evaluate((d) => { window.__qaDefeito = d; }, process.env.QA_DEFEITO || '');
    const caps = await pg.evaluate(async () => {
      for (let e = 0; e < EPOCAS.length; e++) garantirEpoca(e);
      for (let t = 0; t < 800 && Object.keys(pacoteEstado).some(n => pacoteEstado[n] !== 'aqui'); t++) {
        await new Promise(r => setTimeout(r, 25));
      }
      return EPOCAS.map((ep, i) => ({ i, nome: ep.nome, cena: cenarioDaEpoca(i) }));
    });
    let linhas = [];
    let somaEspY = 0, somaMoitas = 0, piorErro = 0, capsComMoita = [];
    for (const c of caps) {
      await pg.evaluate(([cena]) => { S.cenario = cena; S.fronteira = Math.max(S.fronteira | 0, cena); }, [c.cena]);
      const m = await LER(pg, ctx.modo);
      const a = contaAntiga(m.g.cw, m.g.ch, m.iw, m.ih);
      const erro = Math.max(Math.abs(a.dw - m.g.dw), Math.abs(a.dh - m.g.dh), Math.abs(a.dy - m.g.dy));
      somaEspY += m.c.espY; somaMoitas += m.c.moitas;
      if (m.c.moitas > 0) capsComMoita.push(m.epoca);
      if (!ctx.subir) piorErro = Math.max(piorErro, erro);
      linhas.push({ cap: c.i, nome: c.nome, epoca: m.epoca, espY: m.c.espY, moitas: m.c.moitas,
        mato: m.c.matoEmenda, total: m.c.total, chaoHome: m.chaoHome, erro });
    }
    await pg.close();

    console.log('---- ' + ctx.nome + '  ' + ctx.w + 'x' + ctx.h + '  (modo ' + ctx.modo + ')');
    linhas.forEach(l => console.log('     cap ' + String(l.cap).padStart(2) + ' ' + l.nome.padEnd(24)
      + ' época ' + String(l.epoca).padStart(2)
      + ' · chaoHome ' + (l.chaoHome ? l.chaoHome.toFixed(4) : '0     ')
      + ' · drawImage ' + String(l.total).padStart(3)
      + ' · espY ' + l.espY + ' · moitas ' + l.moitas + ' · mato da emenda ' + l.mato
      + (ctx.subir ? '' : ' · erro vs conta ANTIGA ' + l.erro.toFixed(4) + 'px')));

    if (ctx.subir) {
      const semEspY = linhas.filter(l => l.espY === 0);
      console.log('   ' + rep(semEspY.length === 0,
        ctx.nome + ': ' + semEspY.length + ' capítulos SEM cópia vertical (esperado: nenhum)')
        + ' toda tela tem cópia vertical  (total espY ' + somaEspY + ')');
      const set = [...new Set(capsComMoita)].sort((a, b) => a - b);
      const esperado = COSTURA_COBRE_ESPERADO.slice().sort((a, b) => a - b);
      console.log('   ' + rep(JSON.stringify(set) === JSON.stringify(esperado),
        ctx.nome + ': moitas em épocas ' + JSON.stringify(set) + ' em vez de ' + JSON.stringify(esperado))
        + ' moitas só nas épocas ' + JSON.stringify(set));
    } else {
      console.log('   ' + rep(somaEspY === 0, ctx.nome + ': VAZOU — ' + somaEspY
        + ' cópias verticais desenhadas fora da home em retrato') + ' zero cópia vertical');
      console.log('   ' + rep(somaMoitas === 0, ctx.nome + ': VAZOU — ' + somaMoitas
        + ' moitas de costura desenhadas fora da home em retrato') + ' zero moita');
      console.log('   ' + rep(piorErro <= 0.01, ctx.nome + ': INÉRCIA QUEBRADA — pior erro '
        + piorErro.toFixed(4) + 'px contra a conta antiga')
        + ' inércia: pior erro ' + piorErro.toFixed(4) + 'px');
    }
    console.log('');
  }

  // ======================================================= BLOCO 3 — A RÉGUA, por fora
  console.log('\n================ BLOCO 3 — FAIXA, RESPIRO E CRUZAMENTO, medidos por fora');
  const TELAS_R = [
    { nome: 'iphone 12/13',   w: 390,  h: 844,  entra: true  },
    { nome: 'pixel 7/8',      w: 412,  h: 915,  entra: true  },
    { nome: 'iphone 15 pmax', w: 430,  h: 932,  entra: true  },
    { nome: 'tablet retrato', w: 768,  h: 1024, entra: true  },
    { nome: 'iphone SE',      w: 320,  h: 568,  entra: false },
    { nome: 'android baixo',  w: 360,  h: 640,  entra: false },
    { nome: 'retrato curto',  w: 390,  h: 568,  entra: false },
  ];
  for (const t of TELAS_R) {
    const pg = await nav.newPage({ viewport: { width: t.w, height: t.h }, deviceScaleFactor: 2,
      hasTouch: t.w < 900, isMobile: t.w < 900 });
    pg.on('pageerror', e => erros.push(t.nome + ' REGUA PAGEERROR: ' + e.message));
    await pg.goto(url);
    // O CAMINHO DA PESSOA: a home é a tela do boot, não se abre à mão. Espera ela parar.
    await pg.waitForFunction(() => typeof S !== 'undefined'
      && document.getElementById('telaMenu').classList.contains('aberta'), null, { timeout: 30000 }).catch(() => {});
    await pg.evaluate(async () => {
      const tela = document.getElementById('telaMenu');
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const vivas = tela.getAnimations({ subtree: true })
        .filter(a => a.animationName !== 'respira').map(a => a.finished.catch(() => {}));
      await Promise.race([Promise.all(vivas), new Promise(r => setTimeout(r, 3000))]);
    });
    await pg.waitForTimeout(250);
    const m = await pg.evaluate(() => {
      const off = (id) => { const e = document.getElementById(id); if (!e) return null;
        let tt = 0; for (let p = e; p && p.id !== 'telaMenu'; p = p.offsetParent) tt += p.offsetTop;
        return { topo: tt, alt: e.offsetHeight }; };
      const img = heroBloco('walk')[0];
      const sc = HERO_TARGET / img.naturalHeight;
      const kx = telaW() / W, ky = telaH() / H;
      const dw = img.naturalWidth * sc * kx, dh = img.naturalHeight * sc * ky;
      const ela = { x: HX * kx - dw / 2, y: GROUND * ky - dh, w: dw, h: dh };
      const sub = off('menuSub'), poste = off('poste');
      const r = (id) => { const e = document.getElementById(id).getBoundingClientRect();
        return { t: e.top, b: e.bottom, l: e.left, r: e.right }; };
      const tabuas = [...document.querySelectorAll('#poste .telaBtn')]
        .filter(b => getComputedStyle(b).display !== 'none')
        .map(b => { const q = b.getBoundingClientRect();
          return { id: b.id, t: q.top, b: q.bottom, l: q.left, r: q.right }; });
      // ---- A CONFERÊNCIA DE PIXEL: onde a tinta dela está de verdade na camada `#heroHD`,
      // dentro da COLUNA analítica. Se a caixa analítica for ficção, isto acusa.
      const hc = document.getElementById('heroHD');
      const hx = hc.getContext('2d');
      const dpr = hc.width / parseFloat(hc.style.width);
      const x0 = Math.max(0, Math.round(ela.x * dpr)), x1 = Math.min(hc.width, Math.round((ela.x + ela.w) * dpr));
      let topo = -1, base = -1;
      if (x1 > x0) {
        const d = hx.getImageData(x0, 0, x1 - x0, hc.height).data;
        const larg = x1 - x0;
        for (let y = 0; y < hc.height; y++) {
          let tem = false;
          for (let x = 0; x < larg; x++) if (d[(y * larg + x) * 4 + 3] > 40) { tem = true; break; }
          if (tem) { if (topo < 0) topo = y; base = y; }
        }
      }
      return { ela, chaoHome, GROUND, H, ligado: CHAO_HOME_LIGADO,
        subBase: sub.topo + sub.alt, posteTopo: poste.topo,
        subCx: r('menuSub'), posteCx: r('poste'), tabuas,
        tintaTopo: topo / dpr, tintaBase: base / dpr, dpr };
    });
    await pg.close();
    const cruza = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l))
                          * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
    const cx = { l: m.ela.x, r: m.ela.x + m.ela.w, t: m.ela.y, b: m.ela.y + m.ela.h };
    const faixa = m.posteTopo - m.subBase, precisa = m.ela.h + 16;
    const sPoste = cruza(cx, m.posteCx), sSub = cruza(cx, m.subCx);
    const sTab = m.tabuas.reduce((a, b) => a + cruza(cx, b), 0);
    const acima = cx.t - m.subBase, abaixo = m.posteTopo - cx.b;
    console.log('  ' + t.nome.padEnd(16) + t.w + 'x' + t.h
      + ' · chaoHome ' + (m.chaoHome ? m.chaoHome.toFixed(4) : '0')
      + ' · faixa ' + faixa.toFixed(1) + ' (precisa ' + precisa.toFixed(1) + ')'
      + ' · caixa dela ' + m.ela.w.toFixed(1) + 'x' + m.ela.h.toFixed(1)
      + '\n      respiro ' + acima.toFixed(1) + '/' + abaixo.toFixed(1)
      + ' · cruzamento poste ' + Math.round(sPoste) + 'px² · proposta ' + Math.round(sSub)
      + 'px² · tábuas ' + Math.round(sTab) + 'px²'
      + '\n      tinta no #heroHD na coluna dela: y ' + m.tintaTopo.toFixed(1) + '..'
      + m.tintaBase.toFixed(1) + '  (caixa analítica ' + cx.t.toFixed(1) + '..' + cx.b.toFixed(1) + ')');
    if (t.entra) {
      console.log('   ' + rep(!!m.chaoHome, t.nome + ': a faixa deveria dar e a linha do chão NÃO subiu')
        + ' ela entra');
      console.log('   ' + rep(faixa >= precisa, t.nome + ': faixa ' + faixa.toFixed(1)
        + ' < precisa ' + precisa.toFixed(1)) + ' faixa cabe');
      console.log('   ' + rep(sPoste === 0 && sSub === 0 && sTab === 0, t.nome + ': cruzamento não é zero — poste '
        + Math.round(sPoste) + ' proposta ' + Math.round(sSub) + ' tábuas ' + Math.round(sTab))
        + ' cruzamento zero');
      console.log('   ' + rep(acima >= 8 && abaixo >= 8, t.nome + ': respiro abaixo de 8 ('
        + acima.toFixed(1) + '/' + abaixo.toFixed(1) + ')') + ' respiro >= 8');
    } else {
      console.log('   ' + rep(!m.chaoHome, t.nome + ': a faixa NÃO dá e mesmo assim a linha subiu para '
        + (m.chaoHome || 0)) + ' ela NÃO entra, como manda a régua');
      console.log('   ' + rep(m.GROUND === Math.round(m.H * 0.68), t.nome + ': GROUND ' + m.GROUND
        + ' != 0,68 de H=' + m.H) + ' GROUND intacto');
    }
  }

  // ======================================================= BLOCO 3b — OS 37 PX
  //
  // A alegação é "83,0 → 120,0". O 120 o bloco 3 acabou de medir; falta o 83, e ele não é
  // verificável olhando o código: é o layout de ONTEM. Reproduzi-lo é neutralizar os dois
  // `clamp` que o commit acrescentou (o `padding-top` do #telaMenu e o `max-height` do #logoImg)
  // e medir a MESMA faixa na MESMA página.
  console.log('\n================ BLOCO 3b — os 37 px, medidos contra a composição de ontem');
  {
    const SEM_CLAMP = '#telaMenu{padding-top:var(--mTopo)!important}'
                    + '#logoImg{max-height:var(--mLogoAlt)!important}';
    for (const t of [{ w: 390, h: 844 }, { w: 412, h: 915 }, { w: 430, h: 932 }, { w: 768, h: 1024 }]) {
      const linha = [];
      for (const antigo of [true, false]) {
        const pg = await nav.newPage({ viewport: { width: t.w, height: t.h }, deviceScaleFactor: 2,
          hasTouch: t.w < 900, isMobile: t.w < 900 });
        await pg.goto(url);
        await pg.waitForFunction(() => typeof S !== 'undefined'
          && document.getElementById('telaMenu').classList.contains('aberta'), null, { timeout: 30000 }).catch(() => {});
        if (antigo) await pg.addStyleTag({ content: SEM_CLAMP });
        await pg.waitForTimeout(600);
        const v = await pg.evaluate(() => {
          const off = (id) => { const e = document.getElementById(id);
            let tt = 0; for (let p = e; p && p.id !== 'telaMenu'; p = p.offsetParent) tt += p.offsetTop;
            return { topo: tt, alt: e.offsetHeight }; };
          const s = off('menuSub'), p = off('poste');
          const img = heroBloco('walk')[0];
          const h = img.naturalHeight * (HERO_TARGET / img.naturalHeight) * (telaH() / H);
          return { faixa: p.topo - (s.topo + s.alt), precisa: h + 16,
            logo: document.getElementById('logoImg').getBoundingClientRect().height };
        });
        await pg.close();
        linha.push(v);
      }
      const [ant, nov] = linha;
      console.log('  ' + t.w + 'x' + t.h + ' · faixa ANTES ' + ant.faixa.toFixed(1)
        + ' → DEPOIS ' + nov.faixa.toFixed(1) + '  (ganho ' + (nov.faixa - ant.faixa).toFixed(1) + 'px)'
        + ' · precisa ' + nov.precisa.toFixed(1)
        + ' · logo ' + ant.logo.toFixed(1) + ' → ' + nov.logo.toFixed(1) + 'px');
      if (t.w === 390 && t.h === 844) {
        console.log('   ' + rep(Math.abs(ant.faixa - 83) < 1.5, '390x844: a faixa ANTES mede '
          + ant.faixa.toFixed(1) + ', não os 83,0 alegados') + ' faixa ANTES bate com os 83,0 do relatório');
        console.log('   ' + rep(Math.abs(nov.faixa - 120) < 1.5, '390x844: a faixa DEPOIS mede '
          + nov.faixa.toFixed(1) + ', não os 120,0 alegados') + ' faixa DEPOIS bate com os 120,0 do relatório');
      }
    }
  }

  // ======================================================= BLOCO 4 — O EPSILON
  console.log('\n================ BLOCO 4 — O EPSILON: `dy+dh < ch` por arredondamento?');
  console.log('   (com a fração de sempre o laço não pode rodar. A guarda é `yb < g.ch` com');
  console.log('    yb = dy+dh — se o ponto flutuante devolver 843,99999 em vez de 844, o motor');
  console.log('    desenha uma cópia que a fórmula do teste do dev nunca contaria.)\n');
  let pior = 0, casos = 0, exemplo = '';
  // as proporções reais das pinturas, lidas do jogo (bloco 1 já as tem, mas aqui a varredura é
  // grossa: qualquer razão iw/ih plausível, para não depender de uma pintura só)
  for (let ih = 900; ih <= 2600; ih += 13) {
    for (let iw = 1200; iw <= 3200; iw += 29) {
      for (let chCss = 320; chCss <= 1400; chCss += 1) {
        for (const cwCss of [320, 360, 390, 412, 430, 768, 844, 1024, 1366, 1920]) {
          for (const dpr of [1, 2, 3]) {
            const cw = cwCss * dpr, ch = chCss * dpr;
            const gs = 0.75, gd = 0.68;
            const scale = Math.max(cw / iw, ch / ih, gd * ch / (gs * ih), (1 - gd) * ch / ((1 - gs) * ih));
            const dh = ih * scale;
            let dy = gd * ch - gs * dh;
            dy = Math.min(0, Math.max(ch - dh, dy));
            const yb = dy + dh;
            if (yb < ch) {
              casos++;
              const falta = ch - yb;
              if (falta > pior) { pior = falta; exemplo = cw + 'x' + ch + ' iw' + iw + ' ih' + ih
                + ' falta ' + falta.toExponential(3) + 'px'; }
            }
          }
        }
      }
    }
  }
  console.log('   casos em que `dy+dh < ch` com a fração de sempre: ' + casos
    + (casos ? '  ·  pior: ' + exemplo : ''));
  console.log('   ' + (casos
    ? 'ATENÇÃO: o laço RODARIA nesses casos — mas veja a linha seguinte, o desenho cai fora da tela'
    : 'nenhum: a guarda `yb < g.ch` é segura em aritmética de ponto flutuante nesta faixa'));
  if (casos) problemas.push('EPSILON: ' + casos + ' geometrias em que `dy+dh < ch` com a fração de sempre — '
    + 'o laço de repetição roda uma volta fora da home em retrato (' + exemplo + ')');

  await nav.close();
  s.close();
  if (erros.length) { console.log('\nERROS DE CONSOLE/PÁGINA:\n' + erros.join('\n')); problemas.push('erros de console'); }
  else console.log('\nzero erro de console');

  console.log('\n================ VEREDITO');
  if (problemas.length) {
    console.error('REPROVOU — ' + problemas.length + ' problema(s):');
    problemas.forEach(p => console.error('  · ' + p));
    process.exit(1);
  }
  console.log('PASSOU — nenhum vazamento, inércia de pé, régua conferida por fora.');
})();
