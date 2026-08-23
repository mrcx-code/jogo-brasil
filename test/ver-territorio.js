// VÊ E MEDE A PÁGINA "O TERRITÓRIO" — a placa 3D.
//
// Um print não prova nada sozinho, então este instrumento MEDE seis coisas junto com ele:
//   1. erro de console e falha de WebGL (o recuo digno tem de ser exceção, não o normal);
//   2. quadros por segundo, custo do primeiro quadro e orçamento de desenho;
//   3. a cor do topo da placa contra a FAIXA travada #e9d8ae–#d8c391 — luz mal calibrada tinge
//      a placa inteira e nenhum olho pega isso num print. Lida como MEDIANA de um retalho de
//      5x5 desde 23/08 (um pixel só era loteria contra o grão) e com a sensibilidade medida:
//      ~10% de desvio na tela para cima, não os 6% que este cabeçalho dizia. Ver o CONTROLE
//      no fim do arquivo, que traz a varredura inteira;
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

// A FAIXA TRAVADA e a conta de quanto uma cor sai dela. Extraídas para funções em 23/08 porque
// o CONTROLE do fim do arquivo precisa da MESMA régua — controle mais frouxo que a cobrança não
// prova nada (EQUIPE.md 2.8).
const CLARO = [0xe9, 0xd8, 0xae], ESCURO = [0xd8, 0xc3, 0x91], FOLGA = 6;
function desvioDaFaixa(cor) {
  if (!cor) return null;
  return Math.max.apply(null, cor.map((v, k) =>
    Math.max(0, v - Math.max(CLARO[k], ESCURO[k]), Math.min(CLARO[k], ESCURO[k]) - v)));
}

// A COR DO TOPO É A MEDIANA DE UM RETALHO DE 5x5, NÃO UM PIXEL — mudado em 23/08, e o motivo é
// medido. O topo não é chapado: por cima da mancha larga (que é o que a faixa descreve) há o
// GRÃO, poro escuro em 11% das células e cisco claro em 5,5%, e esses pixels estão FORA da
// faixa de propósito — é a mesma receita da Onda 11 do jogo. Contados num retalho de 21x21 em
// volta do centro, com a página certa: 1,8% dos pixels fora da faixa em 390x844, 4,8% em
// 1366x768, 5,9% em 768x1024, 5,7% em 1024x768. Ou seja, ler UM pixel era tirar a sorte contra
// um dado de ~5% a cada rodada, e um vermelho desses não diria nada sobre a tinta.
// A FAIXA NÃO FOI ALARGADA — nem um bit. O que mudou é de onde vem a amostra: a mediana de 25
// pixels é insensível ao grão e continua sensível ao que a régua existe para pegar, que é a luz
// tingindo a placa INTEIRA. O quanto ela pega está MEDIDO no controle do fim deste arquivo, e
// é menos do que se dizia: da ordem de 10% na tela, não 6%.
async function lerTopoMediana(pg) {
  return pg.evaluate(() => {
    const c = window.__centro();
    const cv = document.getElementById('palco');
    const W = cv.width, H = cv.height, tudo = [];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      tudo.push(window.__cor(c.fx + dx / W, c.fy + dy / H));
    }
    return [0, 1, 2].map((k) => {
      const v = tudo.map((p) => p[k]).sort((a, b) => a - b);
      return v[(v.length - 1) >> 1];
    });
  }).catch(() => null);
}

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
    const cor = await lerTopoMediana(pg);
    // A régua é a FAIXA travada, não uma cor só: o topo é pintado entre #e9d8ae e #d8c391 (a
    // mancha larga do grão), então um pixel legítimo cai entre as duas. O que esta asserção
    // pega é o que NÃO pode acontecer — a luz puxar o topo para fora da faixa.
    const desvio = desvioDaFaixa(cor);
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

  // --------------------------------------------------- O CONTROLE DA COR (23/08, EQUIPE.md 2.8)
  //
  // Régua que ninguém viu reprovar é decoração — e esta acabou de ser AFROUXADA de um pixel para
  // a mediana de 25, o que torna a prova obrigatória e não opcional. O defeito injetado é o
  // MESMO que o comentário do gerador diz ter sido pego uma vez: um sol quente. A página é
  // servida de uma origem falsa com o literal da luz trocado, e o resto é byte a byte o arquivo
  // publicado — nada é reimplementado aqui, e a régua que julga é a de cima, `desvioDaFaixa`.
  //
  // Três células, não uma: com a luz adoecida de dois jeitos diferentes a régua TEM de
  // reprovar; com a página intacta servida pelo MESMO caminho ela TEM de aprovar. Só o
  // conjunto prova que quem reprovou foi a tinta e não o andaime.
  //
  // O QUE ESTA RÉGUA PEGA, MEDIDO — e é menos do que o comentário do gerador dá a entender.
  // Varridas dez doses de luz errada com a página servida daqui (23/08), lendo a mediana no
  // mesmo ponto:
  //     sol 0xfff2d8 -> #e9d19d  0/255  passa      luz somando 0,90 -> #decea6   0/255  passa
  //     sol 0xffe8c0 -> #e9cb93  0/255  passa      luz somando 0,78 -> #d1c19c   7/255  reprova
  //     sol 0xffd28c -> #e9c080 17/255  reprova    luz somando 0,72 -> #c9bb96  15/255  reprova
  //     sol 0xffbe60 -> #e9b675 28/255  reprova    luz somando 0,62 -> #bcae8c  28/255  reprova
  // Ou seja: a faixa travada é LARGA por construção (R 216–233, G 195–216, B 145–174, mais 6 de
  // folga), então esta régua pega luz errada da ordem de ~10% na tela para cima, e não os 6%
  // que o cabeçalho promete. Quem quiser mais fino tem de apertar a FAIXA, não a amostra — e
  // apertar a faixa é decisão de arte, não de teste. Fica medido para não ser redescoberto.
  // E fica um desmentido: o sol 0xfff2d8 que o `gerar-territorio.js` diz ter puxado "o azul
  // 15/255 para fora" sai HOJE em 0/255 no ponto lido. Provável explicação: aquela medição foi
  // feita com o `__cor` ESPELHADO, isto é, noutro ponto da placa. Não reescrevi a história do
  // gerador; o controle usa as doses que ele mesmo acabou de medir.
  {
    const ORIGEM = 'https://territorio-controle.local/';
    const bruto = fs.readFileSync(path.join(RAIZ, 'territorio', 'index.html'), 'utf8');
    const quente = bruto.replace('new THREE.DirectionalLight(0xffffff', 'new THREE.DirectionalLight(0xffd28c');
    const fraca = bruto.replace('const A_AMB = 0.34, A_DIR = 0.66;', 'const A_AMB = 0.245, A_DIR = 0.475;');
    if (quente === bruto || fraca === bruto) {
      console.log('  CONTROLE: não achei a linha da luz para adoecer — o controle não rodou');
      falhas++;
    } else {
      for (const [nome, html, deveReprovar] of [
        ['sol quente 0xffd28c', quente, true],
        ['luz somando 0,72 em vez de 1,00', fraca, true],
        ['página intacta', bruto, false],
      ]) {
        const pg = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
        await pg.route('**/*', (r) => (r.request().url().indexOf(ORIGEM) === 0
          ? r.fulfill({ contentType: 'text/html; charset=utf-8', body: html })
          : r.abort()));
        await pg.goto(ORIGEM);
        await pg.waitForFunction('window.__pronto === true', null, { timeout: 20000 }).catch(() => {});
        const cor = await lerTopoMediana(pg);
        const d = desvioDaFaixa(cor);
        await pg.close();
        const reprovou = d == null || d > FOLGA;
        const certo = reprovou === deveReprovar;
        console.log('  CONTROLE ' + nome + ': topo ' + (cor ? hex(cor) : '(não leu)') + ' fora por ' + d
          + ' — ' + (reprovou ? 'REPROVOU' : 'aprovou') + (certo ? ' (como devia)' : ' — ERRADO'));
        if (!certo) falhas++;
      }
    }
  }
  await nav.close();
  const kb = (fs.statSync(path.join(RAIZ, 'territorio', 'index.html')).size / 1024).toFixed(0);
  console.log('  página: ' + kb + ' KB');
  if (falhas) { console.log('REPROVADO — ' + falhas + ' problema(s)'); process.exit(1); }
  console.log('ok');
})();
