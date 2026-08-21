// VÊ E MEDE A PÁGINA "O TERRITÓRIO" — a placa 3D.
//
// Um print não prova nada sozinho, então este instrumento MEDE seis coisas junto com ele:
//   1. erro de console e falha de WebGL (o recuo digno tem de ser exceção, não o normal);
//   2. quadros por segundo, custo do primeiro quadro e orçamento de desenho;
//   3. a cor do topo da placa contra a FAIXA travada #e9d8ae–#d8c391 — luz mal calibrada tinge
//      a placa inteira e nenhum olho pega 6% de desvio num print (pegou: um sol quente puxava
//      o azul 15/255 para fora da faixa);
//   4. o toque no pino: a área de 44 px DE TELA tem de abrir o cartão mesmo errando o mesh;
//   5. o GIRO do aparelho — os cinco pinos têm de continuar dentro da tela depois dele;
//   6. o cartão do ponto que carrega DOIS capítulos (o Rio), que é onde o §2 mora aqui.
//
// Os itens 5 e 6 não são zelo: os dois REPROVARAM na primeira vez que rodaram, e os dois
// defeitos eram reais (ver o Diário de 21/08 no NOTES.md).
//
// Uso: node test/ver-territorio.js   (sai 1 se algo acima falhar)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

const RAIZ = path.resolve(__dirname, '..');
const ALVO = ABRIR('file:///' + path.join(RAIZ, 'territorio', 'index.html').split(path.sep).join('/'));

// RESPONSIVIDADE NÃO É SÓ O CELULAR (EQUIPE.md, lição de 20/08 — custou uma sessão). O
// enquadramento da placa sai de uma área MEDIDA no DOM, e é justamente aí que tablet e
// notebook quebram sem ninguém ver: 768 cai no lado estreito do corte de 820 px e 1024 no largo.
const TELAS = [
  { nome: 'TERRITORIO-3d.png', l: 1366, a: 768 },
  { nome: 'TERRITORIO-3d-mobile.png', l: 390, a: 844 },
  { nome: 'TERRITORIO-3d-768.png', l: 768, a: 1024 },
  { nome: 'TERRITORIO-3d-1024.png', l: 1024, a: 768 },
];

function hex(p) { return '#' + [p[0], p[1], p[2]].map((v) => v.toString(16).padStart(2, '0')).join(''); }

(async () => {
  let falhas = 0;
  const nav = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  for (const t of TELAS) {
    const pg = await nav.newPage({ viewport: { width: t.l, height: t.a }, deviceScaleFactor: 2 });
    const erros = [];
    pg.on('pageerror', (e) => erros.push('pageerror: ' + e));
    pg.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
    await pg.goto(ALVO);
    await pg.waitForFunction('window.__pronto === true', null, { timeout: 20000 }).catch(() => {});

    const sem = await pg.evaluate(() => document.body.classList.contains('sem'));
    if (sem) { console.log('  ' + t.nome + ': RECUO SEM WEBGL — o navegador não desenhou'); falhas++; }

    // FPS: dois instantes do contador de quadros da própria página
    const q0 = await pg.evaluate(() => window.__quadros || 0);
    await pg.waitForTimeout(2000);
    const q1 = await pg.evaluate(() => window.__quadros || 0);
    const fps = ((q1 - q0) / 2).toFixed(1);

    // A COR DO TOPO contra a paleta travada. O desvio importa porque luz mal calibrada tinge a
    // placa inteira alguns por cento — e nenhum olho pega isso num print.
    const cor = await pg.evaluate(() => {
      const c = window.__centro();
      return window.__cor(c.fx, c.fy);
    }).catch(() => null);
    // A régua é a FAIXA travada, não uma cor só: o topo é pintado entre #e9d8ae e #d8c391 (a
    // mancha larga do grão), então um pixel legítimo cai entre as duas. O que esta asserção
    // pega é o que NÃO pode acontecer — a luz puxar o topo para fora da faixa.
    const CLARO = [0xe9, 0xd8, 0xae], ESCURO = [0xd8, 0xc3, 0x91], FOLGA = 6;
    let desvio = null;
    if (cor) desvio = Math.max.apply(null, cor.map((v, k) =>
      Math.max(0, v - Math.max(CLARO[k], ESCURO[k]), Math.min(CLARO[k], ESCURO[k]) - v)));
    const corTxt = cor ? hex(cor) + ' (faixa #e9d8ae–#d8c391, fora por ' + desvio + '/255)' : '(não leu)';
    if (desvio == null || desvio > FOLGA) {
      console.log('  ' + t.nome + ': o topo saiu ' + corTxt + ' — a paleta travada não está saindo na tela');
      falhas++;
    }

    await pg.screenshot({ path: path.join(RAIZ, 'test', t.nome) });

    // o toque no pino: mira 20 px ao lado do centro projetado, para exercitar o raio de 44 px
    const toque = await pg.evaluate(async () => {
      const c = document.getElementById('palco');
      const r = c.getBoundingClientRect();
      // o pino de Brasília é o mais central; usa o botão da lista para saber qual é o índice
      const alvo = 4;
      const ev = (tipo, x, y) => c.dispatchEvent(new PointerEvent(tipo, { clientX: x, clientY: y, bubbles: true }));
      // pega a posição projetada pela própria página, empurrando 20 px para o lado
      const p = window.__pos ? window.__pos(alvo) : null;
      const x = (p ? p.x : r.width / 2) + 20, y = (p ? p.y : r.height / 2) + 12;
      ev('pointerdown', x + r.left, y + r.top);
      ev('pointerup', x + r.left, y + r.top);
      await new Promise((s) => setTimeout(s, 500));
      const k = document.getElementById('cartao');
      return { aberto: k.classList.contains('aberto'), texto: k.textContent.slice(0, 60) };
    });
    if (!toque.aberto) { console.log('  ' + t.nome + ': o toque a 20 px do pino NÃO abriu o cartão'); falhas++; }
    await pg.waitForTimeout(700);
    await pg.screenshot({ path: path.join(RAIZ, 'test', t.nome.replace('.png', '-cartao.png')) });

    // GIRAR O APARELHO. Já custou uma sessão neste repositório (19/08): dois consertos de
    // layout deixavam de valer na rotação e ninguém media. Aqui a prova é dura — depois de
    // girar, os cinco pinos têm de continuar DENTRO da tela, o que só acontece se o
    // enquadramento tiver sido refeito com a área nova.
    await pg.setViewportSize({ width: t.a, height: t.l });
    await pg.waitForTimeout(600);
    const girado = await pg.evaluate(() => {
      const n = document.querySelectorAll('.pl').length;
      const fora = [];
      for (let i = 0; i < n; i++) {
        const p = window.__pos(i);
        if (p.x < 0 || p.y < 0 || p.x > window.innerWidth || p.y > window.innerHeight) fora.push(i);
      }
      return { n: n, fora: fora };
    });
    if (girado.fora.length) {
      console.log('  ' + t.nome + ': depois de girar, ' + girado.fora.length + ' de ' + girado.n
        + ' pinos saíram da tela — o enquadramento não refez');
      falhas++;
    }
    await pg.setViewportSize({ width: t.l, height: t.a });

    // O PONTO QUE CARREGA DOIS CAPÍTULOS. O Rio aparece duas vezes na história do jogo e a
    // 20 km de escala é UM pino só; se o cartão mostrar um capítulo, o outro ficou inalcançável
    // — foi por isso que o mapa do jogo agrupou. E o endereço de um não pode rotular os dois.
    const rio = await pg.evaluate(async () => {
      const bs = [].slice.call(document.querySelectorAll('.pl'));
      const b = bs.filter((x) => x.textContent.indexOf('Rio de Janeiro') >= 0)[0];
      if (!b) return { erro: 'sem botão do Rio' };
      b.click();
      await new Promise((s) => setTimeout(s, 400));
      const txt = document.getElementById('cartao').textContent || '';
      const tit = (document.querySelector('#cartao .kCidade') || {}).textContent || '';
      return { txt: txt, tit: tit };
    });
    const doisCaps = rio.txt && rio.txt.indexOf('O CAIS') >= 0 && rio.txt.indexOf('PEQUENA ÁFRICA') >= 0;
    const tituloLimpo = rio.tit && rio.tit.indexOf('Valongo') < 0;
    if (!doisCaps || !tituloLimpo) {
      console.log('  ' + t.nome + ': o cartão do Rio falhou — dois capítulos: ' + !!doisCaps
        + ', título sem endereço de um só: ' + !!tituloLimpo + ' (' + JSON.stringify(rio.tit) + ')');
      falhas++;
    }

    const custo = await pg.evaluate(() => ({ t: window.__primeiro || 0, i: window.__info || {} }));
    console.log('     primeiro quadro em ' + Math.round(custo.t) + ' ms · '
      + custo.i.chamadas + ' chamadas de desenho · ' + custo.i.triangulos + ' triângulos');
    console.log('  ' + t.nome + ' — ' + t.l + 'x' + t.a + ' · ' + fps + ' fps · topo ' + corTxt
      + ' · cartão ' + (toque.aberto ? 'abriu: ' + JSON.stringify(toque.texto) : 'FECHADO')
      + ' · erros: ' + erros.length);
    for (const e of erros.slice(0, 3)) console.log('     ' + e);
    if (erros.length) falhas++;
    await pg.close();
  }
  await nav.close();
  const kb = (fs.statSync(path.join(RAIZ, 'territorio', 'index.html')).size / 1024).toFixed(0);
  console.log('  página: ' + kb + ' KB');
  if (falhas) { console.log('REPROVADO — ' + falhas + ' problema(s)'); process.exit(1); }
  console.log('ok');
})();
