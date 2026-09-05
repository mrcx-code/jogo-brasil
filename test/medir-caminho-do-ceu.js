// O CAMINHO-DO-CÉU, medido — PENDENTES 54, condições 1 e 4 (03/09).
//
// O que este arquivo responde, com número e não com impressão:
//
//   (1) INÉRCIA. Com a linha do chão na fração de sempre (jogo, deitado, desktop), a geometria
//       do fundo tem de ser BYTE A BYTE a de antes da mudança. Ele não confia em print: computa
//       aqui a fórmula ANTIGA — `max(cw/iw, ch/ih, gd·ch/(gs·ih), (1−gd)·ch/((1−gs)·ih))` — e
//       compara com o `geoFundo()` que o jogo devolve. Divergência de mais de 0,01 px reprova.
//       (Print não serve para isto: a luz da hora, o vento e a `respira` do logo mudam bytes
//       sem mudar geometria nenhuma — foi a primeira coisa que este instrumento tentou.)
//
//   (2) O QUE A SUBIDA FAZ COM O CÉU. Com a chave ligada, quanto da pintura sobra em quadro,
//       quantas cópias de chão a repetição vertical precisa desenhar, e — o número que decide o
//       veto de 22/08 — se a pintura AMPLIOU ou ENCOLHEU contra o estado publicado.
//
//   (4) FPS EM A/B NA MESMA CARGA, com ORDEM ALTERNADA. A ordem fixa já inventou 10% de custo
//       numa medição desta casa (o vento, 22/08), então A e B se revezam (A B B A A B B A…) e o
//       relatório traz a mediana das rodadas de cada lado, não a média de uma passada só. Cada
//       amostra roda com a personagem em pose DIFERENTE — o quadro do sprite sai da distância
//       percorrida, então `worldX` é empurrado entre as rodadas para o braço não ser sempre o
//       mesmo desenho.
//
// Uso:  node test/medir-caminho-do-ceu.js
const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { ehRuidoDeRedeExterna } = require('./rede-externa.js');

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

const RETRATOS = [
  { nome: 'iphone SE',      w: 320, h: 568 },
  { nome: 'android baixo',  w: 360, h: 640 },
  { nome: 'retrato curto',  w: 390, h: 568 },
  { nome: 'iphone 12/13',   w: 390, h: 844 },
  { nome: 'pixel 7/8',      w: 412, h: 915 },
  { nome: 'iphone 15 pmax', w: 430, h: 932 },
];
const OUTRAS = [
  { nome: 'deitado',        w: 844, h: 390 },
  { nome: 'notebook',       w: 1366, h: 768 },
];

// A LEITURA DO ESTADO, feita dentro da página. Devolve a caixa da pintura, as peças e a conta
// de repetições que `rolarFundo()` vai fazer — derivada da MESMA desigualdade que ele usa.
const LER = () => {
  const g = window.geoFundo();
  const alto = CENARIO_ALTO[fundoIdx()], chao = CENARIO_CHAO[fundoIdx()];
  const iw = alto.naturalWidth, ih = alto.naturalHeight + chao.naturalHeight;
  const altChao = g ? g.dh * 0.25 : 0;
  let copias = 0;
  if (g && altChao > 0.5) { let yb = g.dy + g.dh; while (copias < 12 && yb < g.ch) { copias++; yb += altChao; } }
  return { g, iw, ih, W, H, GROUND, ESCALA, chaoHome, ligado: CHAO_HOME_LIGADO,
    idx: fundoIdx(), copias, altChao };
};

async function abrirMenuParado(page) {
  await page.evaluate(async () => {
    fecharTelas(); abrirTela('telaMenu');
    const tela = document.getElementById('telaMenu');
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const vivas = tela.getAnimations({ subtree: true })
      .filter(a => a.animationName !== 'respira').map(a => a.finished.catch(() => {}));
    await Promise.race([Promise.all(vivas), new Promise(r => setTimeout(r, 3000))]);
    await new Promise(r => requestAnimationFrame(r));
  });
}

// Uma amostra de FPS: conta quadros por `requestAnimationFrame` durante `ms`, depois de um
// aquecimento que joga fora o primeiro quadro (o que redesenha o fundo e não é regime).
const AMOSTRA = (ms) => new Promise((ok) => {
  let n = 0; let t0 = 0;
  requestAnimationFrame(function primeiro(t) { t0 = t; requestAnimationFrame(function passo(u) {
    n++; if (u - t0 < ms) requestAnimationFrame(passo); else ok(n * 1000 / (u - t0));
  }); });
});

(async () => {
  const { s, url } = await servir();
  const nav = await chromium.launch();
  let falhou = false;
  const erros = [];

  // ---------------------------------------------------------------- (1) INÉRCIA
  console.log('\n---- INÉRCIA: a geometria do fundo NO JOGO, com a linha do chão de sempre ----');
  console.log('   (a conta ANTIGA, computada aqui, contra o que o jogo devolve)\n');
  console.log('   A medida é com as telas FECHADAS — a partida rodando — porque é ali que o');
  console.log('   contrato vale: a subida é da HOME em retrato e de mais lugar nenhum.\n');
  for (const t of RETRATOS.concat(OUTRAS)) {
    const pg = await nav.newPage({ viewport: { width: t.w, height: t.h }, deviceScaleFactor: 2,
      hasTouch: t.w < 900, isMobile: t.w < 900 });
    pg.on('pageerror', e => erros.push(t.nome + ' PAGEERROR: ' + e.message));
    pg.on('console', m => { if (m.type() === 'error' && !ehRuidoDeRedeExterna(m)) erros.push(t.nome + ' CONSOLE: ' + m.text()); });
    await pg.goto(url);
    await pg.waitForFunction(() => typeof S !== 'undefined' && !!window.geoFundo && !!window.geoFundo(),
      null, { timeout: 30000 }).catch(() => {});
    await pg.evaluate(() => { fecharTelas(); fitCanvas(); redesenharFundo(); });
    await pg.waitForTimeout(300);
    const m = await pg.evaluate(LER);
    await pg.close();
    if (!m.g) { console.log('  ✗ ' + t.nome + ' — sem geometria'); falhou = true; continue; }
    const { cw, ch } = m.g, gs = 0.75, gd = 0.68;
    const scale = Math.max(cw / m.iw, ch / m.ih, gd * ch / (gs * m.ih), (1 - gd) * ch / ((1 - gs) * m.ih));
    const dw = m.iw * scale, dh = m.ih * scale;
    let dy = gd * ch - gs * dh; dy = Math.min(0, Math.max(ch - dh, dy));
    const erro = Math.max(Math.abs(dw - m.g.dw), Math.abs(dh - m.g.dh), Math.abs(dy - m.g.dy));
    const ok = erro <= 0.01 && m.copias === 0 && !m.chaoHome;
    if (!ok) falhou = true;
    console.log('  ' + (ok ? '✓' : '✗') + ' ' + t.nome.padEnd(16) + ' ' + t.w + 'x' + t.h
      + ' · dw ' + m.g.dw.toFixed(1) + ' dh ' + m.g.dh.toFixed(1) + ' dy ' + m.g.dy.toFixed(1)
      + ' · conta antiga ' + dw.toFixed(1) + '/' + dh.toFixed(1) + '/' + dy.toFixed(1)
      + ' · erro ' + erro.toFixed(3) + 'px · cópias verticais ' + m.copias);
  }

  // ------------------------------------------------- (2) O QUE A SUBIDA FAZ COM O CÉU
  console.log('\n---- COM A LINHA DO CHÃO SUBINDO: o que sobra de pintura em quadro ----');
  console.log('   (publicado = a chave desligada · caminho-do-céu = a chave ligada com repetição)\n');
  for (const t of RETRATOS) {
    const pg = await nav.newPage({ viewport: { width: t.w, height: t.h }, deviceScaleFactor: 2,
      hasTouch: true, isMobile: true });
    pg.on('pageerror', e => erros.push(t.nome + ' PAGEERROR: ' + e.message));
    await pg.goto(url);
    await pg.waitForFunction(() => typeof S !== 'undefined' && !!window.geoFundo && !!window.geoFundo(),
      null, { timeout: 30000 }).catch(() => {});
    await abrirMenuParado(pg);
    await pg.waitForTimeout(250);
    // O LADO "PUBLICADO" É A CHAVE BAIXADA À MÃO — desde 03/09 ela nasce ligada, então ler a
    // página como ela está daria o MESMO dos dois lados e a coluna de comparação viraria enfeite.
    const antes = await pg.evaluate(() => {
      CHAO_HOME_LIGADO = false; medirChaoDaHome();
      GROUND = Math.round(H * (chaoHome || 0.68)); redesenharFundo();
      const g = window.geoFundo();
      return { g, chaoHome };
    });
    const dep = await pg.evaluate(() => {
      CHAO_HOME_LIGADO = true; medirChaoDaHome();
      GROUND = Math.round(H * (chaoHome || 0.68)); redesenharFundo();
      const g = window.geoFundo();
      const alto = CENARIO_ALTO[fundoIdx()], chao = CENARIO_CHAO[fundoIdx()];
      const altChao = g ? g.dh * 0.25 : 0;
      let copias = 0;
      if (g && altChao > 0.5) { let yb = g.dy + g.dh; while (copias < 12 && yb < g.ch) { copias++; yb += altChao; } }
      return { g, chaoHome, GROUND, H, copias,
        iw: alto.naturalWidth, ih: alto.naturalHeight + chao.naturalHeight };
    });
    await pg.close();
    // A ALTERNATIVA VETADA, para o número do veto continuar na mesma tabela: qual seria a
    // ampliação se a faixa de baixo AINDA tivesse de ser coberta pela própria pintura.
    const gs = 0.75, gd = dep.chaoHome || 0.68, { cw, ch } = dep.g;
    const scVeto = Math.max(cw / dep.iw, ch / dep.ih, gd * ch / (gs * dep.ih),
      (1 - gd) * ch / ((1 - gs) * dep.ih));
    const dhVeto = dep.ih * scVeto;
    const subiu = !!dep.chaoHome;
    // O NÚMERO QUE RESPONDE À OBJEÇÃO DA ARTE ("o MAR some, e o mar é o que a home diz sem
    // escrever"): que FRAÇÃO da peça de CÉU está dentro do quadro. A peça de céu vai de `dy` a
    // `dy + 0,75·dh`; o que se vê dela é de 0 (a borda de cima da tela) até a linha do horizonte.
    // Comparar `dh` entre os três estados não responde isso — a pintura menor mostra MAIS
    // conteúdo por px, mas a linha do horizonte também sobe, e é o saldo que interessa.
    const ceuVis = (g, gdd) => { const alto = gs * g.dh; return (alto + g.dy) / alto; };
    const dyVeto = gd * ch - gs * dhVeto;
    const ceuVeto = (gs * dhVeto + dyVeto) / (gs * dhVeto);
    console.log('  ' + (subiu ? '↑' : '=') + ' ' + t.nome.padEnd(16) + ' ' + t.w + 'x' + t.h
      + ' · chão ' + (dep.chaoHome ? dep.chaoHome.toFixed(4) : '0,6800')
      + '\n      publicado      dh ' + antes.g.dh.toFixed(0) + ' dy ' + antes.g.dy.toFixed(0)
      + ' · da peça de CÉU está em quadro ' + (100 * ceuVis(antes.g)).toFixed(1) + '%'
      + '\n      caminho-do-céu dh ' + dep.g.dh.toFixed(0) + ' dy ' + dep.g.dy.toFixed(0)
      + ' · da peça de CÉU está em quadro ' + (100 * ceuVis(dep.g)).toFixed(1) + '%'
      + ' · cópias ' + dep.copias
      + '\n      pintura ' + (dep.g.dh / antes.g.dh).toFixed(3) + '× do publicado'
      + '  ·  o caminho VETADO em 22/08 daria ' + (dhVeto / antes.g.dh).toFixed(3) + '× e '
      + (100 * ceuVeto).toFixed(1) + '% de céu em quadro');
  }

  // ------------------------------------------------------------------ (4) FPS A/B
  //
  // TRÊS LADOS, NÃO DOIS, e o terceiro é o que dá sentido aos outros: `A'` é a MESMA condição
  // de `A`, medida noutro momento. O delta A'−A é o RUÍDO do instrumento nesta máquina, e sem
  // ele um delta B−A de 8% não se distingue de um forno de laptop. Ordem `A B A' | A' B A`,
  // invertida a cada bloco — ordem fixa já inventou 10% de custo nesta casa (o vento, 22/08).
  console.log('\n---- FPS EM A/B NA MESMA CARGA, ordem alternada, pose variando ----');
  console.log("   A = chave desligada · B = caminho-do-céu · A' = A de novo (o ruído do instrumento)\n");
  const ORDEM = [0, 1, 2, 2, 1, 0];
  const CICLOS = 4;          // 24 amostras por tela, 8 de cada lado
  const MS = 1200;
  for (const t of [{ nome: 'pixel 7/8', w: 412, h: 915 }, { nome: 'iphone 12/13', w: 390, h: 844 },
                   { nome: 'retrato curto', w: 390, h: 568 }]) {
    const pg = await nav.newPage({ viewport: { width: t.w, height: t.h }, deviceScaleFactor: 2,
      hasTouch: true, isMobile: true });
    pg.on('pageerror', e => erros.push(t.nome + ' FPS PAGEERROR: ' + e.message));
    await pg.goto(url);
    await pg.waitForFunction(() => typeof S !== 'undefined' && !!window.geoFundo && !!window.geoFundo(),
      null, { timeout: 30000 }).catch(() => {});
    await abrirMenuParado(pg);
    await pg.waitForTimeout(400);
    const lados = [[], [], []];
    let copiasB = 0;
    for (let i = 0; i < ORDEM.length * CICLOS; i++) {
      const lado = ORDEM[i % ORDEM.length];
      const r = await pg.evaluate(async ([qual, ms, passo]) => {
        // A POSE MUDA A CADA RODADA: o quadro do sprite sai da distância percorrida, então
        // empurrar `worldX` troca o desenho do braço — medir sempre a mesma pose é medir um
        // desenho, não o laço.
        worldX += passo;
        CHAO_HOME_LIGADO = (qual === 1);
        medirChaoDaHome();
        GROUND = Math.round(H * (chaoHome || 0.68));
        redesenharFundo();
        const g = window.geoFundo();
        const altChao = g ? g.dh * 0.25 : 0;
        let copias = 0;
        if (g && altChao > 0.5) { let yb = g.dy + g.dh; while (copias < 12 && yb < g.ch) { copias++; yb += altChao; } }
        await new Promise(r => setTimeout(r, 250));
        let n = 0, t0 = 0;
        const fps = await new Promise((ok) => {
          requestAnimationFrame(function pri(t) { t0 = t; requestAnimationFrame(function p(u) {
            n++; if (u - t0 < ms) requestAnimationFrame(p); else ok(n * 1000 / (u - t0));
          }); });
        });
        return { fps, copias };
      }, [lado, MS, 37 + i * 13]);
      lados[lado].push(r.fps);
      if (lado === 1) copiasB = r.copias;
    }
    await pg.close();
    const med = (v) => { const s = v.slice().sort((x, y) => x - y);
      return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
    const a = med(lados[0]), b = med(lados[1]), a2 = med(lados[2]);
    const pc = (x, y) => ((x - y) / y * 100).toFixed(1) + '%';
    console.log('  ' + t.nome.padEnd(16) + ' ' + t.w + 'x' + t.h
      + '  ·  cópias de chão desenhadas por quadro em B: ' + copiasB
      + '\n      A  ' + lados[0].map(v => v.toFixed(1)).join(' ') + '   mediana ' + a.toFixed(1)
      + '\n      B  ' + lados[1].map(v => v.toFixed(1)).join(' ') + '   mediana ' + b.toFixed(1)
      + "\n      A' " + lados[2].map(v => v.toFixed(1)).join(' ') + '   mediana ' + a2.toFixed(1)
      + '\n      CUSTO  B−A = ' + (b - a >= 0 ? '+' : '') + (b - a).toFixed(1) + ' FPS (' + pc(b, a) + ')'
      + '   ·   RUÍDO  A′−A = ' + (a2 - a >= 0 ? '+' : '') + (a2 - a).toFixed(1) + ' FPS (' + pc(a2, a) + ')');
  }

  // ------------------------------------------------- (4b) O CUSTO DIRETO DO PASSE DE FUNDO
  //
  // O FPS ACIMA É A MEDIDA QUE A CONDIÇÃO PEDE, mas ele mede o quadro INTEIRO num navegador
  // headless sem GPU — e o ruído A′−A prova sozinho quanto disso é a máquina. Este bloco mede a
  // coisa exata que mudou: quantos milissegundos custa UMA passada de `rolarFundo()`, cronometrada
  // 400 vezes de cada lado, na mesma página, em ordem alternada. É determinístico, não depende do
  // escalonador de quadros, e é onde o custo de "uma peça de chão desenhada duas vezes por
  // quadro" aparece se existir.
  console.log('\n---- O PASSE DE FUNDO, cronometrado direto (400 chamadas de rolarFundo por lado) ----\n');
  for (const t of [{ nome: 'pixel 7/8', w: 412, h: 915 }, { nome: 'iphone 12/13', w: 390, h: 844 },
                   { nome: 'retrato curto', w: 390, h: 568 }]) {
    const pg = await nav.newPage({ viewport: { width: t.w, height: t.h }, deviceScaleFactor: 2,
      hasTouch: true, isMobile: true });
    pg.on('pageerror', e => erros.push(t.nome + ' PASSE PAGEERROR: ' + e.message));
    await pg.goto(url);
    await pg.waitForFunction(() => typeof S !== 'undefined' && !!window.geoFundo && !!window.geoFundo(),
      null, { timeout: 30000 }).catch(() => {});
    await abrirMenuParado(pg);
    await pg.waitForTimeout(300);
    const r = await pg.evaluate(async () => {
      const N = 400, BLOCOS = 6;
      const arma = (lig) => { CHAO_HOME_LIGADO = !!lig; medirChaoDaHome();
        GROUND = Math.round(H * (chaoHome || 0.68)); redesenharFundo(); };
      const cronometrar = () => { const t0 = performance.now();
        for (let i = 0; i < N; i++) { worldX += 1; rolarFundo(); } return (performance.now() - t0) / N; };
      const A = [], B = [];
      for (let k = 0; k < BLOCOS; k++) {
        // ordem alternada A B | B A, o mesmo cuidado do bloco de FPS
        if (k % 2 === 0) { arma(0); A.push(cronometrar()); arma(1); B.push(cronometrar()); }
        else { arma(1); B.push(cronometrar()); arma(0); A.push(cronometrar()); }
        await new Promise(r => setTimeout(r, 60));
      }
      arma(1);
      const g = window.geoFundo();
      const altChao = g ? g.dh * 0.25 : 0;
      let copias = 0;
      if (g && altChao > 0.5) { let yb = g.dy + g.dh; while (copias < 12 && yb < g.ch) { copias++; yb += altChao; } }
      return { A, B, copias };
    });
    await pg.close();
    const med = (v) => { const s = v.slice().sort((x, y) => x - y);
      return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
    const a = med(r.A), b = med(r.B);
    console.log('  ' + t.nome.padEnd(16) + ' ' + t.w + 'x' + t.h + '  ·  cópias em B: ' + r.copias
      + '\n      A ' + r.A.map(v => v.toFixed(3)).join(' ') + '  mediana ' + a.toFixed(3) + ' ms/passe'
      + '\n      B ' + r.B.map(v => v.toFixed(3)).join(' ') + '  mediana ' + b.toFixed(3) + ' ms/passe'
      + '\n      CUSTO ' + (b - a >= 0 ? '+' : '') + (b - a).toFixed(3) + ' ms por quadro ('
      + ((b - a) / a * 100).toFixed(1) + '%)  ·  a 60 Hz isso são '
      + ((b - a) * 60 / 10).toFixed(2) + '% do orçamento de um quadro');
  }

  await nav.close();
  s.close();
  if (erros.length) { console.log('\nERROS DE CONSOLE:\n' + erros.join('\n')); falhou = true; }
  else console.log('\nzero erro de console');
  if (falhou) { console.error('\nCAMINHO-DO-CÉU: REPROVOU'); process.exit(1); }
  console.log('\nCAMINHO-DO-CÉU: a inércia está de pé e os números estão medidos.');
})();
