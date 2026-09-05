// MEDIR O GRÃO DA PINTURA — a régua do ticket COERENCIA-VISUAL / PIXEL VENCE (21/08).
//
//   node test/medir-pixel.js antes      → grava test/PIXEL-antes-*.png  + test/PIXEL-antes.json
//   node test/medir-pixel.js depois     → grava test/PIXEL-depois-*.png + test/PIXEL-depois.json
//                                         e imprime a tabela antes→depois se o "antes" existir
//
// O QUE ELE MEDE, E POR QUE ESTAS TRÊS COISAS:
//   · SATURAÇÃO média (HSV S, em %) — é o número com que a auditoria de arte de 21/08 separou
//     as duas famílias: pixel 59–66%, pintura 34–52%. Medida na MESMA superfície que ela mediu:
//     o #fundoHD já desenhado, na escala de exibição.
//   · CORES DISTINTAS numa janela fixa de 320×320 do quadro — é o que "quantização" quer dizer
//     em número. Tom contínuo vive na casa das dezenas de milhar; pixel art, na das centenas.
//   · GRÃO: comprimento médio de trecho horizontal de cor IDÊNTICA, em px de aparelho. É a
//     "resolução efetiva". A régua é o passo do chrome desde a onda 11 (--graoPx, 2 px CSS =
//     4 px de aparelho a dpr 2): a pintura casa com o chrome quando o trecho médio se aproxima
//     disso pelo lado de baixo.
//
// E MAIS DUAS QUE O TICKET COBRA:
//   · o FILTRO CSS de cada capítulo (lavarFundo) — é ele que prova que os quatro capítulos que
//     dividem `arte:[10]` deixaram de ter a MESMA luz;
//   · FPS medido DENTRO de um capítulo pintado, com a rua andando — o smoke mede no capítulo 1,
//     que é pixel art e não passa pelo passe nenhum.
//
// POR QUE PELO CAMINHO DA PESSOA (EQUIPE.md 2.1): entra por `entrarNaEpoca` e espera o pacote
// de arte chegar (`pacoteEstado`), como o bloco 12 do encaixe faz. Medir antes do pacote é medir
// o RECUO — a pintura do capítulo 1 — achando que se mede a do capítulo 9.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');
const { ehRuidoDeRedeExterna } = require('./rede-externa.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}

// ===== O QUE ESTE INSTRUMENTO PASSOU A COBRAR DE SI MESMO (21/08) =====
//
// Custou um bloqueio de merge. A arte leu "o capítulo-CONTROLE caiu de 42 para 25 FPS" e
// segurou a integração — e as duas metades daquela frase estavam quebradas:
//
//   1. **O "antes" da segunda rodada foi medido no build COM o passe.** Basta rodar
//      `node test/medir-pixel.js antes` depois de construir o passe: o arquivo sai chamado
//      "antes" e contém números de "depois". Dava para ver no próprio JSON — o CAIS tinha 56
//      cores distintas onde o antes de verdade tem 1.281 — mas ninguém tem de conferir isso a
//      olho. **Agora o instrumento se recusa a escrever um "antes" com o ticket ligado**, e o
//      jeito certo de produzir um antes deixa de ser trocar de build: `PIXEL_SEM_TICKET=1`
//      neutraliza o passe, a hora presa e o véu EM TEMPO DE EXECUÇÃO, no mesmo binário.
//   2. **Uma leitura de FPS não é um número, é uma amostra.** Medido nesta máquina, o MESMO
//      capítulo, no MESMO build, dá de 13 a 30 FPS conforme a carga da hora. Uma rodada só
//      não distingue efeito de humor da máquina. Agora são três por alvo, e o que se compara
//      é a MEDIANA — com o mínimo e o máximo impressos ao lado, que é o que deixa a variância
//      visível em vez de escondida atrás de uma média.
const FASE = (process.argv[2] || 'antes').toLowerCase();
const SEM_TICKET = !!process.env.PIXEL_SEM_TICKET;
const RODADAS_FPS = parseInt(process.env.PIXEL_RODADAS || '3', 10);
const mediana = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
// Os exemplares que ficam versionados; o resto dos prints é descartável e some no fim.
// `PIXEL_TODOS=1` guarda os treze, para quando se quer olhar o arco inteiro.
//   aceiro   — um dos QUATRO que dividem a mesma pintura (e o mais pintado do lote)
//   temfonte — pintura típica, e a mais bem resolvida segundo a auditoria
//   jabaquara— o capítulo do artefato de espelho
//   naodito  — a prova da hora presa: o mesmo pixel de aceiro, sob outra luz
const GUARDAR = ['aceiro', 'temfonte', 'jabaquara', 'naodito'];

(async () => {
  const file = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const erros = [];
  page.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !ehRuidoDeRedeExterna(m)) erros.push('CONSOLE: ' + m.text()); });
  await page.goto(file);
  await page.waitForTimeout(1200);

  // O ARM "ANTES", NO MESMO BINÁRIO. As três alavancas do ticket são estruturas de escopo de
  // módulo e todas as três podem ser esvaziadas por dentro — um `const` prende o vínculo, não
  // o conteúdo. Desligadas as três, este é bit a bit o motor de antes do ticket, medido com os
  // mesmos bytes, na mesma carga e na mesma máquina que o "depois".
  if (SEM_TICKET) {
    await page.evaluate(() => {
      GRAO_PINT.fill(0);
      for (const k of Object.keys(HORA_FIXA)) delete HORA_FIXA[k];
      for (const k of Object.keys(VEU_AMBAR)) delete VEU_AMBAR[k];
    });
    console.log('PIXEL_SEM_TICKET: passe, hora presa e véu DESLIGADOS em tempo de execução');
  }
  // O A/B DO VÉU sozinho, sem mexer no resto do ticket: é o que responde "quanto o véu move o
  // luma", que é a pergunta da arte. Use com um nome de fase próprio para não pisar no par
  // antes/depois — por exemplo `PIXEL_SEM_VEU=1 node test/medir-pixel.js semveu`.
  if (process.env.PIXEL_SEM_VEU) {
    await page.evaluate(() => { for (const k of Object.keys(VEU_AMBAR)) delete VEU_AMBAR[k]; });
    console.log('PIXEL_SEM_VEU: véu âmbar DESLIGADO (passe e hora presa continuam ligados)');
  }
  const ticketLigado = await page.evaluate(() => ({
    grao: GRAO_PINT.slice(), horaFixa: Object.assign({}, HORA_FIXA), veu: Object.assign({}, VEU_AMBAR)
  }));
  const ativo = ticketLigado.grao.some(v => v > 0) || Object.keys(ticketLigado.horaFixa).length > 0
    || Object.keys(ticketLigado.veu).length > 0;
  // O PORTÃO QUE FALTAVA: um arquivo chamado "antes" com o ticket ligado é uma medição
  // rotulada errado, e foi exatamente ela que bloqueou o merge de 21/08. Reprova por exit
  // code em vez de gravar — arquivo errado no disco vira "fato" na sessão seguinte.
  if (FASE === 'antes' && ativo) {
    console.log('RECUSADO: fase "antes" com o ticket LIGADO (GRAO_PINT/HORA_FIXA/VEU_AMBAR).');
    console.log('          Isto gravaria números de DEPOIS num arquivo chamado ANTES.');
    console.log('          Use:  PIXEL_SEM_TICKET=1 node test/medir-pixel.js antes');
    await browser.close();
    process.exit(1);
  }

  // toda a arte no aparelho antes de medir qualquer coisa
  await page.evaluate(async () => {
    if (typeof fecharTelas === 'function') fecharTelas();
    for (let e = 0; e < EPOCAS.length; e++) garantirEpoca(e);
    for (let t = 0; t < 400 && Object.keys(pacoteEstado).some(n => pacoteEstado[n] !== 'aqui'); t++) {
      await new Promise(r => setTimeout(r, 25));
    }
  });

  const linhas = [];
  const N = await page.evaluate(() => EPOCAS.length);
  for (let i = 0; i < N; i++) {
    await page.evaluate((i) => {
      fecharTelas();
      entrarNaEpoca(i);
      redesenharFundo();
      mobs.length = 0; drops.length = 0; floats.length = 0;
    }, i);
    await page.waitForTimeout(650);
    await page.evaluate(() => { fecharTelas(); mobs.length = 0; drops.length = 0; floats.length = 0; });
    await page.waitForTimeout(250);

    const m = await page.evaluate(() => {
      const fc = document.getElementById('fundoHD');
      const fx = fc.getContext('2d');
      // A ROLAGEM PRESA EM ZERO, E ISTO CORRIGE UM DEFEITO REAL DESTE INSTRUMENTO (21/08).
      // A pintura rola com `worldX`, então a janela medida cai sobre um PEDAÇO DIFERENTE do
      // quadro a cada execução — e o pedaço é que decide o luma. Medido: O QUE SEGUROU deu
      // 132,1 numa execução e 119,5 noutra, com o MESMO filtro CSS e o mesmo código. Doze
      // unidades de ruído numa régua cuja faixa útil tem oito. Zerando a rolagem e
      // redesenhando no mesmo `evaluate` (nenhum quadro cabe no meio), a comparação passa a
      // ser sempre sobre os mesmos pixels da pintura.
      worldX = 0; rolarFundo();
      const w = fc.width, h = fc.height;
      // banda do meio do quadro: fora do céu chapado do topo e fora do rodapé de folhagem
      const y0 = Math.round(h * 0.18), hh = Math.round(h * 0.60);
      const d = fx.getImageData(0, y0, w, hh).data;
      let sat = 0, luma = 0, n = 0;
      for (let p = 0; p < d.length; p += 4 * 7) {
        const r = d[p], v = d[p + 1], b = d[p + 2];
        const mx = Math.max(r, v, b), mn = Math.min(r, v, b);
        sat += mx ? (mx - mn) / mx : 0;
        luma += 0.299 * r + 0.587 * v + 0.114 * b;
        n++;
      }
      // CORES DISTINTAS numa janela fixa de 160×160 (a mesma em todos os capítulos).
      // A janela é PEQUENA de propósito: a vinheta e a tinta da hora são gradientes contínuos
      // pintados sobre TUDO em luzDaPintura(), e numa janela grande elas sozinhas dão cor única
      // a quase todo pixel — medido: 24.310 cores em PINDORAMA, que é pixel art chapada. Numa
      // janela de 160 px a vinheta varia ~1 nível, e o balde de 4 níveis abaixo a engole.
      const jw = Math.min(160, w), jy = Math.max(0, Math.round(h * 0.42));
      const jh = Math.min(160, h - jy);
      const jx = Math.max(0, Math.round(w / 2 - jw / 2));
      const jd = fx.getImageData(jx, jy, jw, jh).data;
      const exato = new Set(), balde = new Set();
      for (let p = 0; p < jd.length; p += 4) {
        exato.add((jd[p] << 16) | (jd[p + 1] << 8) | jd[p + 2]);
        balde.add(((jd[p] >> 2) << 12) | ((jd[p + 1] >> 2) << 6) | (jd[p + 2] >> 2));
      }
      // GRÃO: comprimento médio de trecho horizontal sem DEGRAU de cor. Com tolerância, porque
      // a pintura é desenhada com suavização e um bloco chapado ampliado 2,5x chega ao aparelho
      // com uma rampa de 1 px na borda; sem tolerância o instrumento mede a rampa, não o bloco.
      let trechos = 0, pixels = 0, grad = 0, ng = 0;
      for (let y = 0; y < jh; y += 2) {
        let ar = -99, av = -99, ab = -99;
        for (let x = 0; x < jw; x++) {
          const p = (y * jw + x) * 4;
          const dr = Math.abs(jd[p] - ar), dv = Math.abs(jd[p + 1] - av), db = Math.abs(jd[p + 2] - ab);
          if (Math.max(dr, dv, db) > 6) { trechos++; ar = jd[p]; av = jd[p + 1]; ab = jd[p + 2]; }
          if (x) { grad += Math.abs(0.299 * (jd[p] - jd[p - 4]) + 0.587 * (jd[p + 1] - jd[p - 3]) + 0.114 * (jd[p + 2] - jd[p - 2])); ng++; }
          pixels++;
        }
      }
      // ===== O LUMA COMO O OLHO O RECEBE (21/08) =====
      //
      // `luma` acima lê o CONTEÚDO do canvas — e o filtro CSS de `lavarFundo()` NÃO está nele:
      // `filter` é efeito de composição do elemento, e `getImageData` devolve os pixels de
      // antes dele. Ou seja: a régua que a arte usa para dizer "este capítulo tem outra luz"
      // estava cega justamente para a linha de código que dá a luz ao capítulo.
      //
      // A correção não precisa de print: o canvas 2D aceita a MESMA gramática de filtro no
      // contexto. Desenhar o #fundoHD num canvas de trabalho com `ctx.filter` igual ao
      // `getComputedStyle(...).filter` reproduz o que a composição faria, e aí sim os pixels
      // lidos são os que chegam ao olho — saturate, sepia, brightness e contrast inclusive.
      const filtroCss = getComputedStyle(fc).filter;
      let lumaFiltrada = 0, satFiltrada = 0;
      {
        const tc = document.createElement('canvas');
        tc.width = w; tc.height = hh;
        const tx = tc.getContext('2d');
        tx.filter = filtroCss && filtroCss !== 'none' ? filtroCss : 'none';
        tx.drawImage(fc, 0, y0, w, hh, 0, 0, w, hh);
        const fd = tx.getImageData(0, 0, w, hh).data;
        let nf = 0;
        for (let p = 0; p < fd.length; p += 4 * 7) {
          const r = fd[p], v = fd[p + 1], b = fd[p + 2];
          const mx = Math.max(r, v, b), mn = Math.min(r, v, b);
          satFiltrada += mx ? (mx - mn) / mx : 0;
          lumaFiltrada += 0.299 * r + 0.587 * v + 0.114 * b;
          nf++;
        }
        lumaFiltrada /= nf; satFiltrada /= nf;
      }
      return {
        sat: sat / n, luma: luma / n, lumaFiltrada, satFiltrada,
        cores: balde.size, coresExatas: exato.size,
        grao: pixels / trechos, gradiente: grad / ng,
        filtro: filtroCss,
        pintura: fundoIdx(), cena: S.cenario, lugar: (EPOCAS[epocaAtual()] || {}).lugar || '',
        nome: (EPOCAS[epocaAtual()] || {}).nome || ''
      };
    });
    linhas.push(m);
    const alvo = path.join(__dirname, 'PIXEL-' + FASE + '-' + i + '-' + m.lugar + '.png');
    await page.screenshot({ path: alvo });
    console.log(String(i).padStart(2) + ' ' + m.lugar.padEnd(14) + ' pint=' + String(m.pintura).padStart(2)
      + '  sat=' + (m.sat * 100).toFixed(1) + '%  cores=' + String(m.cores).padStart(5) + '/' + String(m.coresExatas).padStart(6)
      + '  grao=' + m.grao.toFixed(2) + 'px  luma=' + m.luma.toFixed(1) + '  LUMA-NA-TELA=' + m.lumaFiltrada.toFixed(1));
  }

  // FPS DENTRO DE UM CAPÍTULO PINTADO, com a rua andando de verdade.
  const fps = [];
  // `litoral` é o CONTROLE: capítulo 1, família pixel art, NÃO passa pelo passe. Se ele cair
  // junto com os outros, quem caiu foi o instrumento (13 pacotes decodificados de uma vez),
  // não o passe — e é por isso que ele está aqui.
  for (const alvo of ['litoral', 'aceiro', 'temfonte', 'cais']) {
    const rodadas = [];
    for (let r = 0; r < RODADAS_FPS; r++) {
      await page.evaluate((lugar) => {
        const i = EPOCAS.findIndex(e => e.lugar === lugar);
        fecharTelas(); entrarNaEpoca(i >= 0 ? i : 0); redesenharFundo();
      }, alvo);
      await page.waitForTimeout(500);
      await page.evaluate(() => fecharTelas());
      rodadas.push(await page.evaluate(() => new Promise(res => {
        let n = 0; const t0 = performance.now();
        (function f() { n++; performance.now() - t0 < 2000 ? requestAnimationFrame(f) : res(Math.round(n / 2)); })();
      })));
    }
    const med = mediana(rodadas);
    fps.push({ lugar: alvo, fps: med, rodadas: rodadas });
    console.log('FPS ' + alvo.padEnd(9) + ': mediana ' + med + '  (rodadas ' + rodadas.join(', ')
      + ', min ' + Math.min(...rodadas) + ' max ' + Math.max(...rodadas) + ')');
  }
  // A VARIÂNCIA DO PRÓPRIO INSTRUMENTO, dita em número e ao lado do resultado. Se ela for da
  // ordem da diferença que se quer ler, não há diferença a ler — e é essa conta que faltava
  // quando "42 → 25" virou uma condição de merge.
  const espalha = fps.map(f => Math.max(...f.rodadas) - Math.min(...f.rodadas));
  console.log('espalhamento do instrumento (max-min por alvo): ' + espalha.join(', ') + ' FPS');

  const saida = { fase: FASE, ticket: { ativo, ...ticketLigado }, linhas, fps, erros };
  fs.writeFileSync(path.join(__dirname, 'PIXEL-' + FASE + '.json'), JSON.stringify(saida, null, 1));

  // guarda só os três exemplares pedidos; o resto some para não engordar o repositório
  for (let i = 0; i < linhas.length; i++) {
    if (GUARDAR.indexOf(linhas[i].lugar) >= 0) continue;
    const p = path.join(__dirname, 'PIXEL-' + FASE + '-' + i + '-' + linhas[i].lugar + '.png');
    if (fs.existsSync(p) && !process.env.PIXEL_TODOS) fs.unlinkSync(p);
  }

  const outro = path.join(__dirname, 'PIXEL-' + (FASE === 'antes' ? 'depois' : 'antes') + '.json');
  if (fs.existsSync(outro)) {
    const o = JSON.parse(fs.readFileSync(outro, 'utf8'));
    const A = FASE === 'antes' ? saida : o, B = FASE === 'antes' ? o : saida;
    if (A.ticket && A.ticket.ativo) {
      console.log('\nAVISO: o PIXEL-antes.json do disco foi medido com o TICKET LIGADO — ele é um');
      console.log('       "depois" com nome de "antes", e a comparação abaixo não vale nada.');
      console.log('       Refaça:  PIXEL_SEM_TICKET=1 node test/medir-pixel.js antes');
    }
    console.log('\ncap            | sat antes→depois | cores antes→depois | grão antes→depois | luma antes→depois');
    for (let i = 0; i < Math.min(A.linhas.length, B.linhas.length); i++) {
      const a = A.linhas[i], b = B.linhas[i];
      console.log(a.lugar.padEnd(14) + ' | ' + (a.sat * 100).toFixed(1) + '% → ' + (b.sat * 100).toFixed(1)
        + '% | ' + String(a.cores).padStart(6) + ' → ' + String(b.cores).padStart(5)
        + ' | ' + a.grao.toFixed(2) + ' → ' + b.grao.toFixed(2)
        + ' | ' + a.luma.toFixed(1) + ' → ' + b.luma.toFixed(1));
    }
  }

  if (erros.length) console.log('ERROS DE CONSOLE:\n' + erros.join('\n'));
  await browser.close();
  process.exit(erros.length ? 1 : 0);
})();
