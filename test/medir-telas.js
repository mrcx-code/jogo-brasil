// QUANTO O JOGO AGUENTA DE TELA — a medição que faltava.
//
// O QA registrou como gap: "tudo roda numa resolução só". O jogo é testado a 390×844 e
// publicado para qualquer aparelho. Isto mede o que quebra fora dessa medida, em vez de
// adivinhar: para cada viewport, procura transbordo horizontal, sobreposição de elementos
// que não deviam se cruzar, texto cortado e alvo de toque menor que o mínimo de dedo.
//
//   node test/medir-telas.js
//
// Não conserta nada. Só diz onde dói, com número — para a passada de responsivo ter escopo
// em vez de escopo imaginado.
//
// ===== O QUE ESTE ARQUIVO DEIXOU PASSAR ATÉ 2026-08-10, E POR QUÊ =====
// Ele já rodava `deitado 844×390` e dava VERDE. O telefone virado estava quebrado desde
// sempre — o JOGAR do menu nascia 52 px ABAIXO da borda de baixo, ou seja o jogo não podia
// nem ser começado deitado — e nada aqui reprovava. Três buracos, os três consertados agora:
//
//   1. SÓ MEDIA A HORIZONTAL. A checagem "fora da tela" olhava `b.right > W` e `b.left < 0`
//      e nunca `b.bottom > H`. Deitado o lado curto é a ALTURA, então o eixo em que tudo
//      quebra era exatamente o que ninguém olhava.
//   2. SÓ MEDIA O ESTADO DE ARRANQUE. Abria o jogo, esperava 1,4 s e media o que estivesse
//      na tela — que é sempre o menu. A HISTÓRIA (26 páginas), a CHEGADA, a caixa de fala, a
//      bandeja de MELHORIAS e o próprio jogo rodando nunca foram medidos em largura nenhuma.
//   3. IMPRIMIA A ESCALA E NÃO A COBRAVA. A linha dizia "escala do mundo 3.003" no tablet
//      deitado e chamava a tela de boa. O §4 do CLAUDE.md manda a escala ser INTEIRA — é a
//      razão de `fitCanvas` usar `floor` —, e um número quebrado impresso sem asserção é um
//      defeito documentado, não um defeito pego.
//
// A régua de ergonomia (bloco 8) é nova e vale a pena dizer por quê: deitado, o polegar não
// está onde estava. Com o aparelho na horizontal as duas mãos seguram as PONTAS, e um botão
// no meio da borda de baixo — que em retrato é o lugar mais confortável que existe — passa a
// ser o ponto mais longe dos dois polegares.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

// O cardápio: os aparelhos que existem de verdade, não potências de dois.
const TELAS = [
  { nome: 'pequeno  360×640', w: 360, h: 640 },   // Android popular, ainda comum no Brasil
  { nome: 'padrão   390×844', w: 390, h: 844 },   // a medida em que tudo foi feito
  { nome: 'Pixel    412×915', w: 412, h: 915 },
  { nome: 'grande   430×932', w: 430, h: 932 },   // Pro Max
  { nome: 'estreito 320×568', w: 320, h: 568 },   // o piso do que ainda se vende
  { nome: 'tablet   768×1024', w: 768, h: 1024 },
  { nome: 'deitado  844×390', w: 844, h: 390 },   // o telefone virado
  { nome: 'deitado  932×430', w: 932, h: 430 },   // o Pro Max virado
  { nome: 'deitado  640×360', w: 640, h: 360 },   // o pequeno virado — o pior caso de altura
  { nome: 'deitado 1024×768', w: 1024, h: 768 },  // o tablet virado
];

const ALVO_MIN = 44;   // px de dedo — o mínimo que Apple e Google recomendam

// ===== OS ESTADOS DO JOGO =====
// Cada um é uma tela que a pessoa alcança de verdade. Medir só o arranque é medir o menu e
// mais nada; foi assim que o resto do jogo passou dez viewports sem ser olhado uma vez.
// O `abre` roda DENTRO da página e devolve depois de a tela estar montada.
const ESTADOS = [
  { id: 'menu', abre: () => { fecharTelas(); abrirTela('telaMenu'); } },
  { id: 'jogo', abre: () => { fecharTelas(); } },
  { id: 'eras', abre: () => { fecharTelas(); montarCapitulos(); abrirTela('telaCapitulos'); } },
  { id: 'fala', abre: () => {
      fecharTelas();
      const e = EPOCAS[0];
      abrirFala(e.nome, e.quando, e.abertura.slice(0, 3), null,
                e.aberturaImg ? e.aberturaImg.slice(0, 3) : null, false);
    } },
  { id: 'historia', abre: () => { fecharTelas(); montarCompletude(); abrirTela('telaCompletude'); } },
  // A pergunta de uma linha NASCE OCULTA (`.oculto`), e um save que já respondeu a mantém
  // oculta para sempre. Medir a CHEGADA sem forçá-la é medir a tela sem o inquilino mais
  // novo dela — foi assim que três tábuas de resposta com o rótulo estourando a caixa
  // passaram despercebidas em toda medida deitada.
  { id: 'chegada', abre: () => {
      fecharTelas(); montarFim(); montarPergunta();
      document.getElementById('fimPergunta').classList.remove('oculto');
      document.getElementById('fimPerguntaBotoes').classList.remove('oculto');
      abrirTela('telaFim');
    } },
  { id: 'fontes', abre: () => { fecharTelas(); montarFontes(); abrirTela('telaFontes'); } },
  { id: 'ajustes', abre: () => { fecharTelas(); montarConfig(); abrirTela('telaConfig'); } },
  { id: 'volta', abre: () => { fecharTelas(); mostrarRetorno(3600 * 6); } },
  { id: 'melhorias', abre: () => {
      fecharTelas();
      document.getElementById('retorno').classList.remove('aberto');
      document.getElementById('retVeu').classList.remove('aberto');
      document.getElementById('sheetUpgrades').classList.add('aberto');
    } },
];

(async () => {
  const alvo = ABRIR('file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/'));
  const nav = await chromium.launch();
  const linhas = [];

  for (const t of TELAS) {
    const pg = await nav.newPage({ viewport: { width: t.w, height: t.h }, deviceScaleFactor: 2 });
    const erros = [];
    pg.on('pageerror', e => erros.push(e.message));
    await pg.goto(alvo);
    await pg.waitForTimeout(1400);

    // ---- o que só depende da geometria do mundo, e por isso se mede uma vez ----
    const g = await pg.evaluate(() => {
      const cv = document.getElementById('scene');
      const b = cv.getBoundingClientRect();
      return {
        W: document.documentElement.clientWidth, H: document.documentElement.clientHeight,
        transborda: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        cvW: cv.width, cvH: cv.height,
        caixaW: b.width, caixaH: b.height,
        ex: +(b.width / cv.width).toFixed(4), ey: +(b.height / cv.height).toFixed(4),
      };
    });

    const problemas = [];
    if (g.transborda > 1) problemas.push('rola de lado ' + g.transborda + 'px');

    // 6 · O MUNDO COBRE A TELA. Sobra de tela é chão que não existe.
    if (g.caixaW < g.W - 1 || g.caixaH < g.H - 1) {
      problemas.push('o mundo não cobre a tela (' + Math.round(g.caixaW) + '×' + Math.round(g.caixaH) +
        ' numa de ' + g.W + '×' + g.H + ')');
    }
    // 7 · ESCALA INTEIRA — a régua do §4, agora COBRADA e não só impressa.
    //     `image-rendering: pixelated` com fração quebrada faz um pixel de mundo virar 2 px de
    //     tela e o vizinho virar 3. Foi o conserto mais importante de pixel art do jogo, e o
    //     tablet deitado o desfazia em silêncio: 341 px de canvas exibidos em 1024 = 3,003.
    const inteiro = v => Math.abs(v - Math.round(v)) < 0.002;
    if (!inteiro(g.ex) || !inteiro(g.ey)) {
      problemas.push('escala do mundo QUEBRADA ' + g.ex + '×' + g.ey +
        ' (canvas ' + g.cvW + '×' + g.cvH + ' numa caixa de ' + Math.round(g.caixaW) + '×' + Math.round(g.caixaH) + ')');
    } else if (Math.abs(g.ex - g.ey) > 0.002) {
      problemas.push('pixel RETANGULAR ' + g.ex + '×' + g.ey);
    }

    // ---- e agora estado por estado ----
    for (const est of ESTADOS) {
      await pg.evaluate(est.abre);
      // A fala se revela letra a letra e o quadrinho monta 26 páginas de tela cheia: dar tempo
      // é o que separa medir a TELA de medir a animação dela. O quadrinho pede o dobro por um
      // motivo concreto — `#listaCenas` entra com o `brota` de 0,42 s (translateY 18px), e num
      // tablet a montagem das páginas atrasa o início dela o bastante para a medição pegar o
      // rolo dois pixels fora do lugar. Foi exatamente o falso positivo que apareceu aqui.
      await pg.waitForTimeout(est.id === 'fala' || est.id === 'historia' ? 1500 : 500);

      const r = await pg.evaluate(({ ALVO_MIN, estado }) => {
        const vis = e => {
          const s = getComputedStyle(e);
          if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
          const b = e.getBoundingClientRect();
          return b.width > 0 && b.height > 0;
        };
        const nome = e => (e.id || (typeof e.className === 'string' ? e.className.split(' ')[0] : '') || e.tagName);
        const W = document.documentElement.clientWidth;
        const H = document.documentElement.clientHeight;
        // O chrome do jogo sai de cena por `transform` quando uma tela abre (body.emTela):
        // ele está legitimamente fora da moldura e não é defeito de layout.
        const chromeFora = document.body.classList.contains('emTela');
        const doJogo = e => e.closest('#hudTop, #controls');

        const alvos = '.tela.aberta *, #hudTop *, #controls *, #retorno.aberto *, .sheet.aberto *';

        // QUEM RESPONDE PELO ELEMENTO. Um item dentro de um rolo (as 26 páginas do quadrinho,
        // a lista de fontes, a lista de eras) está legitimamente fora da moldura: o dedo o
        // alcança rolando. O mesmo vale para quem mora dentro de um `overflow: hidden` — ali
        // quem decide o recorte é o pai, de propósito. Sem esta regra a medição vira ruído:
        // ela acusava 26 páginas de quadrinho por estarem abaixo da dobra de um rolo vertical.
        // Então o teste sobe até achar o primeiro ancestral que recorta ou rola, e cobra ELE.
        const gerido = function (e) {
          for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
            const s = getComputedStyle(p);
            if (s.overflowX !== 'visible' || s.overflowY !== 'visible') return true;
          }
          return false;
        };

        // 2 · O QUE SAI DA TELA — pelos LADOS **e por baixo**. A metade de baixo desta
        //     checagem não existia, e é a única que importa com o telefone deitado.
        const fora = [], abaixo = [];
        document.querySelectorAll(alvos).forEach(function (e) {
          if (!vis(e) || (chromeFora && doJogo(e)) || gerido(e)) return;
          const b = e.getBoundingClientRect();
          if (b.right > W + 1 || b.left < -1) fora.push(nome(e) + ' →' + Math.round(b.right - W));
          // nascer inteiramente fora é pior que ser cortado: o elemento não existe para quem joga
          if (b.top > H - 4) abaixo.push(nome(e) + ' NASCE FORA (topo em ' + Math.round(b.top) + ', tela tem ' + H + ')');
          else if (b.bottom > H + 1) abaixo.push(nome(e) + ' cortado embaixo +' + Math.round(b.bottom - H));
          else if (b.bottom < 4 || b.top < -1) abaixo.push(nome(e) + ' acima da tela ' + Math.round(b.top));
        });

        // 3 · SOBREPOSIÇÃO entre o HUD de cima e a barra de baixo.
        const cruza = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const hud = document.getElementById('hudTop');
        const ctl = document.getElementById('controls');
        let colide = false;
        if (!chromeFora && hud && ctl && vis(hud) && vis(ctl)) {
          colide = cruza(hud.getBoundingClientRect(), ctl.getBoundingClientRect());
        }

        // 4 · ALVO DE TOQUE pequeno demais.
        const miudos = [];
        document.querySelectorAll('button, .cartao, .capItem, .telaBtn').forEach(function (e) {
          if (!vis(e) || (chromeFora && doJogo(e))) return;
          const b = e.getBoundingClientRect();
          if (b.height < ALVO_MIN || b.width < ALVO_MIN) {
            miudos.push(nome(e) + ' ' + Math.round(b.width) + '×' + Math.round(b.height));
          }
        });

        // 5 · TEXTO CORTADO: o conteúdo não cabe na caixa que o guarda. Só vale para caixa
        //     que NÃO recorta nem rola de propósito — `overflow: hidden` é decisão de
        //     composição (o quadro do quadrinho), e ali `scrollWidth` mede o filho ampliado
        //     pela animação de entrada, não texto perdido.
        const cortados = [];
        document.querySelectorAll(alvos).forEach(function (e) {
          if (!vis(e) || !e.textContent.trim() || (chromeFora && doJogo(e))) return;
          const s = getComputedStyle(e);
          if (s.overflowX !== 'visible' || s.overflowY !== 'visible') return;
          if (e.scrollWidth > e.clientWidth + 2) {
            cortados.push(nome(e) + ' ' + e.scrollWidth + '>' + e.clientWidth);
          }
        });

        // 5b · RÓTULO BITMAP MAIOR QUE A CAIXA (um <canvas> não faz o pai transbordar).
        const estourados = [];
        document.querySelectorAll('canvas').forEach(function (c) {
          const pai = c.parentElement;
          if (!pai || pai.id === 'app' || c.id) return;      // só os rótulos, não os canvas do jogo
          if (!vis(c) || (chromeFora && doJogo(c))) return;
          const a = c.getBoundingClientRect(), b = pai.getBoundingClientRect();
          if (a.width > b.width + 1) estourados.push(nome(pai) + ' ' + Math.round(a.width) + '>' + Math.round(b.width));
        });

        // 8 · O POLEGAR, E O ALUGUEL QUE O CHROME PAGA. Duas contas, e as duas só existem
        //     porque deitado a resposta muda:
        //      · o bloco de controles come uma FATIA DA ALTURA. Em retrato 63 px de 844 são
        //        7,5%; deitado os mesmos 63 px de 390 são 16,2% — a mesma barra passa a valer
        //        o dobro do jogo, sem ninguém ter decidido isso.
        //      · deitado, as duas mãos seguram as PONTAS. Um botão no meio da borda de baixo
        //        é, na horizontal, o ponto mais distante dos dois polegares que existe.
        let chrome = null;
        if (estado === 'jogo' && ctl && vis(ctl)) {
          const b = ctl.getBoundingClientRect();
          const acao = document.getElementById('btnClique');
          const ab = acao ? acao.getBoundingClientRect() : null;
          chrome = {
            pctAltura: +((b.height / H) * 100).toFixed(1),
            acaoPctX: ab ? +(((ab.left + ab.right) / 2 / W) * 100).toFixed(1) : null,
          };
        }

        // 8b · A CHEGADA CABE SEM ROLAR. Ela é a única `.tela` que rola por dentro, e o
        //      CLAUDE/CSS já registra por que isso não basta: "um botão que só existe depois
        //      de um gesto que ninguém pediu é um botão que metade das pessoas não acha".
        //      Como a tela rola, a checagem 2 não a alcança — esta a alcança.
        //      E ela olha TODO alvo da tela, não só a última tábua da coluna das portas: a
        //      pergunta de uma linha quebra em duas fileiras quando as três palavras não
        //      cabem, e foi assim que o NÃO saiu pela borda de baixo com a medição verde.
        let chegada = null;
        if (estado === 'chegada') {
          const t = document.getElementById('telaFim');
          const fora = [];
          t.querySelectorAll('.telaBtn, .telaTit, .fimLin, #fimPerguntaTxt').forEach(function (e) {
            if (!vis(e)) return;
            const b = e.getBoundingClientRect();
            if (b.bottom > H + 1 || b.top < -1 || b.right > W + 1 || b.left < -1) {
              fora.push(nome(e) + ' ' + Math.round(b.top) + '..' + Math.round(b.bottom));
            }
          });
          chegada = { rola: Math.round(t.scrollHeight - t.clientHeight), fora: fora.slice(0, 5) };
        }

        // 9 · A PÁGINA DO QUADRINHO CABE NA PÁGINA. `.qQuadro` é `overflow: hidden`, então
        //     conteúdo maior que o quadro não transborda, não rola e não avisa: ele é
        //     simplesmente recortado. É a tela em que o jogo ENSINA — o corte cai no texto.
        let comic = null;
        if (estado === 'historia') {
          const apertados = [];
          document.querySelectorAll('.qQuadro').forEach(function (q, i) {
            let alt = 0;
            q.querySelectorAll(':scope > .ltMomento, :scope > .ltMarco, :scope > .qCentro, :scope > .qFala')
              .forEach(function (f) { alt += f.getBoundingClientRect().height; });
            const esp = q.getBoundingClientRect().height - parseFloat(getComputedStyle(q).paddingBottom);
            if (alt > esp + 1) apertados.push(i + ' (' + Math.round(alt) + '>' + Math.round(esp) + ')');
          });
          comic = apertados;
        }

        return { fora: fora.slice(0, 4), abaixo: abaixo.slice(0, 5), colide,
                 miudos: miudos.slice(0, 4), cortados: cortados.slice(0, 3),
                 estourados: estourados.slice(0, 4), chrome, comic, chegada };
      }, { ALVO_MIN, estado: est.id });

      const p = s => problemas.push(est.id + ': ' + s);
      if (r.colide) p('o HUD colide com o rodapé');
      if (r.fora.length) p('fora da tela pelos lados: ' + r.fora.join(', '));
      if (r.abaixo.length) p('fora da tela por baixo: ' + r.abaixo.join(', '));
      if (r.miudos.length) p('alvo < ' + ALVO_MIN + 'px: ' + r.miudos.join(', '));
      if (r.cortados.length) p('texto cortado: ' + r.cortados.join(', '));
      if (r.estourados.length) p('rótulo bitmap fora da caixa: ' + r.estourados.join(', '));
      if (r.chegada && r.chegada.fora.length) {
        p('a CHEGADA passa da dobra (a tela rola ' + r.chegada.rola + 'px): ' + r.chegada.fora.join(', '));
      }
      if (r.comic && r.comic.length) {
        p(r.comic.length + ' de 26 páginas com conteúdo maior que o quadro — ' + r.comic.slice(0, 6).join(', '));
      }
      if (r.chrome) {
        // 14% é a fatia que o rodapé ocupa a 430×932 com folga; acima disso a barra deixou de
        // ser rodapé e virou metade da composição.
        if (r.chrome.pctAltura > 14) p('o rodapé come ' + r.chrome.pctAltura + '% da altura (teto 14%)');
        // Só deitado: em retrato o meio da borda de baixo é o melhor lugar que existe.
        if (t.w > t.h && r.chrome.acaoPctX !== null && r.chrome.acaoPctX > 33 && r.chrome.acaoPctX < 67) {
          p('deitado, a ação principal está no meio da borda (' + r.chrome.acaoPctX + '% da largura) — longe dos dois polegares');
        }
      }

      if (est.id === 'jogo' || est.id === 'menu' || est.id === 'historia') {
        await pg.screenshot({ path: path.join(__dirname, 'TELA-' + t.w + 'x' + t.h + '-' + est.id + '.png') });
      }
    }

    await pg.close();
    if (erros.length) problemas.push('ERRO: ' + erros[0]);

    linhas.push({ tela: t.nome, ok: problemas.length === 0, problemas });
    console.log((problemas.length ? '✗ ' : '✓ ') + t.nome +
      '  escala do mundo ' + g.ex + '×' + g.ey +
      (problemas.length ? '\n    ' + problemas.join('\n    ') : ''));
  }

  await nav.close();
  const ok = linhas.filter(l => l.ok).length;
  console.log('\n' + ok + ' de ' + linhas.length + ' telas sem problema.');
  console.log('Prints em test/TELA-*.png — olhe, o número não conta se ficou bonito.');
  // Instrumento que só imprime é instrumento que ninguém lê num pipeline. Ele SAI 1 quando
  // alguma tela reprova — é o que o transforma de relatório em cobrança.
  process.exit(ok === linhas.length ? 0 : 1);
})();
