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
  // 360x640 entrou em 04/09 porque foi ELE que expôs o defeito da placa sob o papel: das cinco
  // telas é a mais baixa, e é a única em que o cabeçalho mais o painel do censo não deixam os
  // 28% de faixa que `areaUtil()` pede. Medido antes do conserto: 144 px de placa escondidos
  // atrás do painel — defeito ANTERIOR à camada das divisas, que nenhuma das outras quatro via.
  { nome: 'TERRITORIO-3d-360.png', l: 360, a: 640 },
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
//
// E UMA HONESTIDADE QUE O QA CRUZADO COBROU, porque muda o que cada conserto pode reivindicar:
// os DOIS consertos de 23/08 — o espelho do `__cor` na página e a mediana aqui — estão
// CONFUNDIDOS, e cada um sozinho já deixaria o portão verde. Medido na página da main, em
// 390x844, com a fórmula AINDA espelhada: um pixel dá #c9b78b, 15/255, reprova; a mediana 5x5
// dá #d8c597, 0/255, aprova. Ou seja, o verde de hoje NÃO é prova de que o espelho era o
// defeito. O espelho continua sendo bug real — está provado por outra via, comparando o
// `__cor` velho com o pixel do reflexo lido por `drawImage`+`getImageData`, que casam byte a
// byte nas quatro telas —, mas quem o afirma tem de apontar para ESSA prova, não para o verde.
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

// ------------------------------------------------------------------ A CAMADA DAS DIVISAS
//
// Três coisas, e as três são o que a camada nova promete:
//   (a) tocar DENTRO de um estado abre o cartão daquele estado — e o alvo é escolhido pelo
//       NOME, com a página dizendo onde ele cai na tela, porque coordenada de tela chutada
//       muda a cada viewport e passaria a testar outra coisa em cada uma das quatro telas;
//   (b) o realce PINTA de verdade — a cor no ponto tocado tem de mudar, dentro de uma faixa.
//       Sem isto o cartão podia abrir com a placa igualzinha e o teste passaria mentindo;
//   (c) o pino GANHA do estado. Todo pino está dentro de algum estado, então uma ordem de
//       desempate errada tornaria os cinco pinos inalcançáveis — e o cartão do pino, que é o
//       conteúdo mais antigo desta página, sumiria sem nenhum portão notar.
//
// MEDIR E JULGAR SÃO DUAS FUNÇÕES, e é de propósito: o CONTROLE do fim do arquivo chama
// exatamente estas, e não uma cópia mais frouxa (EQUIPE.md 2.8 — controle mais frouxo que a
// cobrança não prova nada).
async function medirDivisas(pg) {
  return pg.evaluate(async () => {
    const c = document.getElementById('palco');
    const r = c.getBoundingClientRect();
    const ev = (t, x, y) => c.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: y, bubbles: true, pointerType: 'mouse' }));
    const esc = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    if (!window.__dentroDe || !window.__telaDe || !window.__ufSel) return { erro: 'a página não expõe os ganchos da camada de divisas' };
    // A CÂMERA PRECISA TER PARADO ANTES DA PRIMEIRA LEITURA, e isto já produziu um número
    // falso: o teste do cartão do Rio, logo acima, faz a câmera se aproximar do pino; o Escape
    // começa o caminho de volta, que leva 600 ms. Lendo a cor 120 ms depois, o "antes" e o
    // "depois" caíam em pontos DIFERENTES da placa — e o Δ saía 214/255 em três das quatro
    // telas, que é a diferença entre a placa e a mesa escura, não entre realçado e não
    // realçado. Um portão verde pelo motivo errado. Espera a volta inteira, com folga.
    esc();
    await new Promise((s) => setTimeout(s, 900));

    const alvo = window.__dentroDe('AM');            // longe dos cinco pinos e grande na tela
    if (!alvo) return { erro: 'nao achei ponto dentro do AM' };
    const p = window.__telaDe(alvo.lat, alvo.lon);
    const fx = p.x / c.clientWidth, fy = 1 - p.y / c.clientHeight;
    const antes = window.__cor(fx, fy);
    const quem = window.__ufNoPixel(p.x, p.y);

    ev('pointerdown', p.x + r.left, p.y + r.top);
    ev('pointerup', p.x + r.left, p.y + r.top);
    await new Promise((s) => setTimeout(s, 450));
    const depois = window.__cor(fx, fy);
    // e a PROVA de que os dois tiros foram no mesmo alvo: escolher um estado não mexe a
    // câmera (só o pino faz dolly), então o mesmo lat/lon tem de cair no mesmo pixel. Se
    // andou, o Δ acima não fala de realce nenhum e o número não vale.
    const p2 = window.__telaDe(alvo.lat, alvo.lon);
    const andou = Math.max(Math.abs(p2.x - p.x), Math.abs(p2.y - p.y));
    const tit = (document.querySelector('#cartao .kCidade') || {}).textContent || '';
    const sel = window.__ufSel();

    // (c) o pino ganha: mira o CENTRO do pino de Brasília e o cartão tem de ser o do lugar
    esc();
    await new Promise((s) => setTimeout(s, 120));
    const pp = window.__pos(4);
    ev('pointerdown', pp.x + r.left, pp.y + r.top);
    ev('pointerup', pp.x + r.left, pp.y + r.top);
    await new Promise((s) => setTimeout(s, 450));
    const titPino = (document.querySelector('#cartao .kCidade') || {}).textContent || '';
    const selPino = window.__ufSel();
    esc();
    return { quem, tit, sel, antes, depois, andou, titPino, selPino };
  }).catch((e) => ({ erro: String(e).slice(0, 120) }));
}

// ------------------------------------------------ A PLACA NÃO PODE FICAR ATRÁS DO PAPEL
//
// O painel do censo é papel OPACO. A placa é desenhada no canvas, ATRÁS dele. Se o
// enquadramento puser parte do país embaixo do painel, essa parte simplesmente não existe para
// quem olha — e nada acusa: não há erro de console, a cor do topo continua certa, o cartão
// continua abrindo, o print continua "bonito" porque o que sumiu foi justamente o que não
// aparece. Foi assim que 144 px de Rio Grande do Sul ficaram escondidos em 360x640 sem nenhum
// portão notar.
//
// A MEDIDA É GEOMÉTRICA, não de pixel: a página projeta a SILHUETA da placa para a tela e o
// teste pergunta se algum pedaço dela cai dentro do retângulo do painel. Duas perguntas, porque
// uma só deixa passar um caso: (1) algum ponto do contorno cai sobre o papel — é o caso comum,
// a placa descendo por baixo do painel; (2) algum canto do painel cai DENTRO do contorno — é o
// caso de o painel estar inteiramente por cima do país, sem que a borda cruze nada.
//
// A REGRA VALE COM A CÂMERA EM REPOUSO, e essa ressalva é a diferença entre um portão e um
// alarme falso: escolher um pino faz um dolly de propósito (0,8x da distância), e aí a placa
// PODE passar por baixo do painel — é o preço combinado de chegar perto. O que não pode é o
// enquadramento de repouso esconder país. Este medidor viu a diferença do jeito difícil: rodando
// logo depois do teste do cartão do Rio, ele media a cena AINDA aproximada e acusava 185 px de
// invasão em 1366x768, onde em repouso a folga é de 49 px. Zera a seleção e espera a volta.
async function medirSobreposicao(pg) {
  return pg.evaluate(async () => {
    if (!window.__contorno) return { erro: 'a página não expõe __contorno' };
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await new Promise((s) => setTimeout(s, 900));
    const c = document.getElementById('censo').getBoundingClientRect();
    // a silhueta com os lados subdivididos: dois vértices vizinhos do contorno podem estar a
    // dezenas de pixels um do outro, e o pedaço de reta entre eles também é placa
    const bruto = window.__contorno();
    const pts = [];
    for (let i = 0; i < bruto.length; i++) {
      const a = bruto[i], b = bruto[(i + 1) % bruto.length];
      for (let k = 0; k < 12; k++) pts.push([a[0] + (b[0] - a[0]) * k / 12, a[1] + (b[1] - a[1]) * k / 12]);
    }
    const noPapel = (p) => p[0] >= c.left && p[0] <= c.right && p[1] >= c.top && p[1] <= c.bottom;
    let dentro = 0, fundo = 0;
    for (const p of pts) {
      if (!noPapel(p)) continue;
      dentro++;
      // o quanto ele entrou: a menor distância até sair do retângulo
      fundo = Math.max(fundo, Math.min(p[0] - c.left, c.right - p[0], p[1] - c.top, c.bottom - p[1]));
    }
    // e o caso inverso: um canto do painel dentro da silhueta
    const emPoli = (x, y) => {
      let d = false;
      for (let i = 0, j = bruto.length - 1; i < bruto.length; j = i++) {
        const xi = bruto[i][0], yi = bruto[i][1], xj = bruto[j][0], yj = bruto[j][1];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) d = !d;
      }
      return d;
    };
    const cantos = [[c.left, c.top], [c.right, c.top], [c.left, c.bottom], [c.right, c.bottom]]
      .filter((q) => emPoli(q[0], q[1])).length;
    return { pontos: dentro, cantos: cantos, fundo: Math.round(fundo),
      censo: { t: Math.round(c.top), b: Math.round(c.bottom), l: Math.round(c.left), r: Math.round(c.right) } };
  }).catch((e) => ({ erro: String(e).slice(0, 120) }));
}

function julgarSobreposicao(r) {
  if (r.erro) return { ok: false, texto: r.erro };
  if (r.pontos > 0 || r.cantos > 0) {
    return { ok: false, texto: 'a placa fica atrás do painel de papel do censo — ' + r.pontos
      + ' ponto(s) da silhueta caem sobre o papel (até ' + r.fundo + ' px para dentro) e '
      + r.cantos + ' canto(s) do painel caem sobre o país. Essa parte fica invisível. Painel em '
      + JSON.stringify(r.censo) };
  }
  return { ok: true, texto: 'a silhueta inteira da placa fica fora do painel do censo' };
}

function julgarDivisas(uf) {
  if (uf.erro) return { ok: false, texto: uf.erro };
  const achou = !!(uf.quem && uf.quem.uf === 'AM');
  const abriu = uf.sel === 'AM' && uf.tit.indexOf('Amazonas') >= 0;
  const delta = Math.max.apply(null, uf.antes.map((v, k) => Math.abs(v - uf.depois[k])));
  // A FAIXA TEM TETO, e o teto é o que pega a leitura desalinhada. O realce é uma demão de
  // laranja a 34% sobre o topo: MEDIDO, ele desloca a cor 34–35 de 255 nas quatro telas. Um Δ
  // de 200 não é realce mais forte — é a sonda tendo lido a mesa escura num dos dois tiros, que
  // foi exatamente o defeito deste teste na primeira vez que ele rodou.
  const pintou = delta >= 8 && delta <= 90;
  const parada = uf.andou <= 1;
  const pinoGanha = uf.selPino === null && uf.titPino.indexOf('Brasília') >= 0;
  const ok = achou && abriu && pintou && parada && pinoGanha;
  if (ok) {
    return { ok: true, delta, texto: 'toque no AM abre "' + uf.tit.trim() + '", realce muda a cor em '
      + delta + '/255 com a câmera parada, e o pino de Brasília continua ganhando do estado' };
  }
  return { ok: false, delta, texto: 'ponto cai no AM: ' + achou + ' (' + JSON.stringify(uf.quem)
    + '), cartão do estado: ' + abriu + ' (' + JSON.stringify(uf.tit) + '/' + JSON.stringify(uf.sel)
    + '), realce pintou: ' + pintou + ' (Δcor ' + delta + '/255, faixa 8 a 90)'
    + ', câmera parada entre os dois tiros: ' + parada + ' (andou ' + uf.andou.toFixed(1) + ' px, teto 1)'
    + ', pino ganha do estado: ' + pinoGanha + ' (' + JSON.stringify(uf.titPino) + '/' + JSON.stringify(uf.selPino) + ')' };
}

(async () => {
  let falhas = 0;
  // executablePath, nunca lancamento nu — a mesma regra que test/portao-navegador.js cobra dos
  // outros portoes. Achado ao pendurar este arquivo em npm test (04/09): lancado nu, ele MORRIA
  // nesta maquina em 0,56 s, antes de abrir qualquer pagina — o Playwright deste projeto espera
  // a build chromium_headless_shell-1234 e a maquina so tem a 1194 provisionada em
  // /opt/pw-browsers. ABRIR.chromiumPath() e a mesma resolucao que csp-paginas.js e os demais
  // portoes ja usam; sem ela este arquivo nunca teria sido visto passando fora do CI (que
  // reinstala o navegador antes de cada job).
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath(), args: ['--enable-unsafe-swiftshader'] });
  for (const t of TELAS) {
    const pg = await nav.newPage({ viewport: { width: t.l, height: t.a }, deviceScaleFactor: 2 });
    const erros = [];
    const ignorados = [];
    // DOIS RUÍDOS QUE NÃO SÃO O JOGO, ACHADOS AO PENDURAR ESTE ARQUIVO EM npm test (04/09):
    //   1. a contagem anônima da página (us.i.posthog.com) não sobe de dentro de um sandbox
    //      com proxy — o pedido morre em ERR_TUNNEL_CONNECTION_FAILED. É a MÁQUINA, não o jogo
    //      (mesmo filtro em test/qa-salvador-vivo.js), e sem ele este portão reprovaria SEMPRE
    //      nesta máquina, decoração de vermelho em vez de medir WebGL — a mesma armadilha que a
    //      lição 2.8 da casa persegue, só que ao contrário (vermelho que não fala nada de real).
    //   2. o favicon que o Chromium pede sozinho — 404 porque test/abrir.js só serve arquivo
    //      que existe (mesmo filtro em test/qa-privacidade-muda.js).
    const REDE_EXTERNA = /posthog|ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY/;
    pg.on('pageerror', (e) => erros.push('pageerror: ' + e));
    pg.on('console', (m) => {
      if (m.type() !== 'error') return;
      const t = m.text();
      // o "Failed to load resource: 404" nao carrega a URL no TEXTO — so em location().url,
      // que e exatamente onde qa-privacidade-muda.js confere o favicon.
      const url = (m.location && m.location().url) || '';
      (REDE_EXTERNA.test(t) || /\/favicon\.ico$/.test(url) ? ignorados : erros).push('console: ' + t);
    });
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

    // a placa não pode ficar atrás do papel — medida e julgada pelas MESMAS funções do controle
    const sobre = julgarSobreposicao(await medirSobreposicao(pg));
    if (!sobre.ok) { console.log('  ' + t.nome + ': ' + sobre.texto); falhas++; }
    else console.log('     enquadramento: ' + sobre.texto);

    // a camada das divisas — medida e julgada pelas MESMAS funções que o controle usa
    const veredito = julgarDivisas(await medirDivisas(pg));
    if (!veredito.ok) { console.log('  ' + t.nome + ': a camada das divisas falhou — ' + veredito.texto); falhas++; }
    else console.log('     divisas: ' + veredito.texto);

    // O PRINT DO ESTADO ESCOLHIDO — a prova visual da camada nova, para o dono comparar com o
    // antes. A Bahia é o primeiro alvo porque ela tem capítulo do jogo (Salvador), então o
    // cartão mostra as duas coisas que ele passou a juntar: o número do Censo e a história que
    // se passou ali.
    //
    // O RECUO PARA O AMAZONAS NÃO É DESLEIXO, é o desempate funcionando: em 390x844 e 360x640 a
    // placa é pequena e os 44 px do pino de Salvador cobrem o miolo da Bahia, então o toque
    // abre o pino — que é a ordem certa. A cobertura está medida logo abaixo.
    let quemPrint = null;
    for (const sigla of ['BA', 'AM']) {
      const deu = await pg.evaluate(async (s) => {
        const c = document.getElementById('palco');
        const r = c.getBoundingClientRect();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await new Promise((x) => setTimeout(x, 900));
        const alvo = window.__dentroDe(s);
        if (!alvo) return false;
        const p = window.__telaDe(alvo.lat, alvo.lon);
        for (const t of ['pointerdown', 'pointerup']) {
          c.dispatchEvent(new PointerEvent(t, { clientX: p.x + r.left, clientY: p.y + r.top, bubbles: true, pointerType: 'mouse' }));
        }
        await new Promise((x) => setTimeout(x, 600));
        return window.__ufSel() === s;
      }, sigla);
      if (deu) { quemPrint = sigla; break; }
    }
    if (quemPrint) await pg.screenshot({ path: path.join(RAIZ, 'test', t.nome.replace('.png', '-estado.png')) });
    else { console.log('  ' + t.nome + ': não consegui abrir o cartão de nenhum estado para o print'); falhas++; }

    // QUANTO DA PLACA O DEDO NÃO ALCANÇA COMO ESTADO. Os 44 px de raio de cada pino existem
    // porque o pino é pequeno; o efeito colateral é que, quanto menor a placa na tela, maior a
    // fatia do país em que o toque abre o pino em vez do estado. É a tensão real entre as duas
    // camadas desta página, e ela só aparece com número — num print as duas parecem conviver.
    const cobertura = await pg.evaluate(() => {
      const c = document.getElementById('palco');
      const L = c.clientWidth, A = c.clientHeight;
      const RAIO = 44;
      const pinos = [];
      for (let i = 0; i < document.querySelectorAll('.pl').length; i++) pinos.push(window.__pos(i));
      let placa = 0, sob = 0;
      for (let y = 0; y < A; y += 4) for (let x = 0; x < L; x += 4) {
        if (!window.__ufNoPixel(x, y)) continue;      // fora da placa
        placa++;
        for (const p of pinos) {
          if ((p.x - x) * (p.x - x) + (p.y - y) * (p.y - y) < RAIO * RAIO) { sob++; break; }
        }
      }
      return { placa: placa, sob: sob };
    });
    const pct = cobertura.placa ? (cobertura.sob / cobertura.placa * 100).toFixed(1) : '?';
    console.log('     pinos cobrem ' + pct + '% da placa (o toque ali abre o pino, não o estado)'
      + ' · print do estado: ' + (quemPrint || 'nenhum'));

    const custo = await pg.evaluate(() => ({ t: window.__primeiro || 0, i: window.__info || {} }));
    console.log('     primeiro quadro em ' + Math.round(custo.t) + ' ms · '
      + custo.i.chamadas + ' chamadas de desenho · ' + custo.i.triangulos + ' triângulos');
    console.log('  ' + t.nome + ' — ' + t.l + 'x' + t.a + ' · ' + fps + ' fps · topo ' + corTxt
      + ' · cartão ' + (toque.aberto ? 'abriu: ' + JSON.stringify(toque.texto) : 'FECHADO')
      + ' · erros: ' + erros.length);
    for (const e of erros.slice(0, 3)) console.log('     ' + e);
    if (ignorados.length) console.log('     (ignorado, é a máquina e não o jogo: ' + ignorados[0] + ')');
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
  // E FICA UM NAO PROVADO, que é diferente de um desmentido: o sol 0xfff2d8 que o
  // gerar-territorio.js diz ter puxado "o azul 15/255 para fora" sai HOJE em 0/255 no ponto
  // lido, nas quatro telas. Eu tinha escrito que a medição original fora feita com o __cor
  // espelhado; o QA cruzado foi ao commit que a escreveu (fad3a5d), reconstruiu a página e o
  // máximo que obteve foi 3/255, COM espelho e SEM. Então a minha explicação não se sustenta
  // com o que se conseguiu reproduzir: o número de 15/255 não reproduz, e a razão não foi
  // estabelecida. O controle usa as doses que ele mesmo acabou de medir, e a história do
  // gerador fica como está — corrigir um registro sem saber o que houve é trocar um erro por
  // outro mais confiante.
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
  // ----------------------------------------- O CONTROLE DAS DIVISAS (EQUIPE.md 2.8)
  //
  // O portão acima nasceu nesta rodada e já mostrou que sabe mentir: na primeira versão ele
  // media a cor com a câmera em movimento e devolvia 214/255 achando que media realce. Então
  // ele não entra sem prova de que REPROVA — e a prova são os dois defeitos que ele existe para
  // pegar, injetados de propósito na página publicada, servida de uma origem falsa. Quem julga
  // é `julgarDivisas`, a MESMA função da cobrança, e não uma régua paralela.
  //
  //   · "estado ganha do pino": inverte a ordem de desempate do pointerup. A placa continua
  //     bonita, o cartão do estado continua abrindo — e os cinco pinos ficam inalcançáveis.
  //     É o defeito que nenhum print pegaria.
  //   · "realce mudo": pintarTopo devolve sem pintar. O cartão do estado abre igual, e a placa
  //     não responde. É o defeito que só a leitura de pixel pega.
  {
    const ORIGEM = 'https://territorio-divisas.local/';
    const bruto = fs.readFileSync(path.join(RAIZ, 'territorio', 'index.html'), 'utf8');
    const alvoPino = '  const i = pinoPerto(px, py);\n  if (i >= 0) {';
    const semPino = bruto.replace(alvoPino, '  const i = -1;\n  if (i >= 0) {');
    const alvoRealce = 'function pintarTopo(iUf) {\n  if (!cvTopo) return;';
    const semRealce = bruto.replace(alvoRealce, 'function pintarTopo(iUf) {\n  if (cvTopo) return;');
    if (semPino === bruto || semRealce === bruto) {
      console.log('  CONTROLE divisas: não achei a linha para injetar o defeito — o controle não rodou');
      falhas++;
    } else {
      for (const [nome, html, deveReprovar] of [
        ['estado ganha do pino', semPino, true],
        ['realce mudo', semRealce, true],
        ['página intacta', bruto, false],
      ]) {
        const pg = await nav.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 2 });
        await pg.route('**/*', (r) => (r.request().url().indexOf(ORIGEM) === 0
          ? r.fulfill({ contentType: 'text/html; charset=utf-8', body: html })
          : r.abort()));
        await pg.goto(ORIGEM);
        await pg.waitForFunction('window.__pronto === true', null, { timeout: 20000 }).catch(() => {});
        const v = julgarDivisas(await medirDivisas(pg));
        await pg.close();
        const certo = (!v.ok) === deveReprovar;
        console.log('  CONTROLE divisas · ' + nome + ': ' + (v.ok ? 'aprovou' : 'REPROVOU')
          + (certo ? ' (como devia)' : ' — ERRADO') + ' — ' + v.texto);
        if (!certo) falhas++;
      }
    }
  }

  // ------------------------------------- O CONTROLE DO ENQUADRAMENTO (EQUIPE.md 2.8)
  //
  // O defeito injetado é a REGRA ANTIGA, palavra por palavra: o retângulo fixo de 22% a 72% da
  // altura, que ignorava onde o painel começava. Ele esconde a placa em 360x640 e em 390x844, e
  // é o que estava publicado até 04/09. Servir a regra velha e ver o portão reprovar é a prova
  // de que ele pega o defeito que motivou o conserto — e não outra coisa.
  {
    const ORIGEM = 'https://territorio-enquadra.local/';
    const bruto = fs.readFileSync(path.join(RAIZ, 'territorio', 'index.html'), 'utf8');
    const novo = '  const base = censo.top - folga;\n'
      + '  let topo = cab[cab.length - 1].bottom + folga;\n'
      + '  if (base - topo < H * 0.28) topo = Math.max(folga, base - H * 0.28);\n'
      + '  return { x: folga, y: topo, w: W - folga * 2, h: Math.max(60, base - topo) };';
    const velho = '  const topo = cab[cab.length - 1].bottom + folga;\n'
      + '  const base = censo.top - folga;\n'
      + '  if (base - topo < H * 0.28) return { x: folga, y: H * 0.22, w: W - folga * 2, h: H * 0.5 };\n'
      + '  return { x: folga, y: topo, w: W - folga * 2, h: base - topo };';
    const regraVelha = bruto.replace(novo, velho);
    if (regraVelha === bruto) {
      console.log('  CONTROLE enquadramento: não achei a regra nova para trocar pela velha — o controle não rodou');
      falhas++;
    } else {
      for (const [nome, html, tela, deveReprovar] of [
        ['regra antiga (retângulo fixo) em 360x640', regraVelha, { l: 360, a: 640 }, true],
        ['regra antiga (retângulo fixo) em 390x844', regraVelha, { l: 390, a: 844 }, true],
        ['página intacta em 360x640', bruto, { l: 360, a: 640 }, false],
      ]) {
        const pg = await nav.newPage({ viewport: { width: tela.l, height: tela.a }, deviceScaleFactor: 1 });
        await pg.route('**/*', (r) => (r.request().url().indexOf(ORIGEM) === 0
          ? r.fulfill({ contentType: 'text/html; charset=utf-8', body: html })
          : r.abort()));
        await pg.goto(ORIGEM);
        await pg.waitForFunction('window.__pronto === true', null, { timeout: 20000 }).catch(() => {});
        const v = julgarSobreposicao(await medirSobreposicao(pg));
        await pg.close();
        const certo = (!v.ok) === deveReprovar;
        console.log('  CONTROLE enquadramento · ' + nome + ': ' + (v.ok ? 'aprovou' : 'REPROVOU')
          + (certo ? ' (como devia)' : ' — ERRADO') + ' — ' + v.texto);
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
