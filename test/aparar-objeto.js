// APARA UM OBJETO JÁ CONVERTIDO — recorte justo na mancha, e nada mais.
//
// POR QUE ELE EXISTE, e a medida que o justifica: o drop é desenhado com escala
// `DROP_TARGET / naturalHeight` (src/jogo.ts, `dropScaleFor`). Quer dizer que MARGEM VAZIA
// DENTRO DO QUADRO ENCOLHE O OBJETO NA TELA — e encolhe em silêncio, porque o arquivo continua
// bonito quando aberto. Medido em 04/09 nas três artes de trabalho de SALVADOR:
//
//   cap4-obj-tabuleiro  120x120  mancha em 16..119 x 48..109  → o objeto tem 62 das 120 linhas
//   cap4-obj-trouxa     149x120  mancha em  0..17 (fragmento) + 58..148 (o balde)
//   cap4-obj-agua       107x120  mancha em  0..76 x 28..107
//
// A do meio traz um FRAGMENTO de outro objeto, cortado pela linha da célula (a armadilha do §5
// do CLAUDE.md, "corte em células iguais"): duas ilhas separadas por 40 colunas vazias. Como o
// drop é centrado pela LARGURA DA IMAGEM, o fragmento também empurrava o balde para fora do
// próprio centro — ele não era só sujeira, era descentragem.
//
// O que este script faz, e só isto: recorta na mancha (opcionalmente só na maior ilha de
// colunas) e regrava em WebP. Não redimensiona, não requantiza, não desfranja — quem faz isso
// é o test/converter-objeto.js, e a arte daqui já passou por ele.
//
// ELE SE MEDE CONTRA SI MESMO. Regravar WebP sobre WebP é recompressão, e recompressão sem
// número é fé: ao terminar ele decodifica ORIGEM e SAÍDA, desenha as duas NA ESCALA EM QUE O
// JOGO DESENHA (9 px de altura, `DROP_TARGET`) e imprime o erro médio por canal. É a mesma
// régua do §6 do CLAUDE.md — medir na tela, nunca no arquivo.
//
//   node test/aparar-objeto.js <entrada.webp> <saida.webp> [qualidade] [--maior-ilha]
//   node test/aparar-objeto.js assets/objetos/cap4-obj-trouxa.webp assets/objetos/drop-cap4-balde.webp 0.80 --maior-ilha

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}

const RAIZ = path.resolve(__dirname, '..');
const ENT = process.argv[2], SAI = process.argv[3];
const Q = parseFloat(process.argv[4] || '0.80');
const MAIOR = process.argv.includes('--maior-ilha');
if (!ENT || !SAI) {
  console.error('uso: aparar-objeto.js <entrada.webp> <saida.webp> [qualidade] [--maior-ilha]');
  process.exit(1);
}
const ALVO_TELA = 9;   // DROP_TARGET do src/jogo.ts — a altura em que o drop é desenhado

(async () => {
  const nav = await chromium.launch({ executablePath: chromiumPath() });
  const pg = await nav.newPage();
  await pg.goto('about:blank');
  const cru = fs.readFileSync(path.resolve(RAIZ, ENT));
  const uri = 'data:image/webp;base64,' + cru.toString('base64');

  const r = await pg.evaluate(async function (a) {
    async function carregar(u) { const im = new Image(); im.src = u; await im.decode(); return im; }
    // COMPOSTO SOBRE FUNDO OPACO, e não é detalhe: onde o alfa é 0 o RGB de um WebP é lixo
    // — decodificadores devolvem valores diferentes para o mesmo pixel invisível. Comparar
    // RGB cru dá erro médio de 21 de 255 num par de imagens visualmente idênticas (medido).
    // O que o olho vê é a imagem COMPOSTA; é ela que se mede. O cinza médio é escolhido para
    // não favorecer nem o claro nem o escuro da franja.
    function pixels(im, w, h) {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d');
      x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
      x.imageSmoothingEnabled = true;
      x.drawImage(im, 0, 0, w, h);
      return x.getImageData(0, 0, w, h).data;
    }
    const im = await carregar(a.uri);
    const w = im.naturalWidth, h = im.naturalHeight;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, w, h).data;

    // colunas e linhas com tinta (alfa > 16: a franja quase transparente não conta como mancha)
    const col = new Array(w).fill(0), lin = new Array(h).fill(0);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (d[(j * w + i) * 4 + 3] > 16) { col[i]++; lin[j]++; }
    }
    // ilhas de colunas separadas por coluna VAZIA
    const ilhas = [];
    for (let i = 0; i < w; i++) {
      if (col[i] > 0) { if (!ilhas.length || ilhas[ilhas.length - 1].fim !== i - 1) ilhas.push({ ini: i, fim: i }); else ilhas[ilhas.length - 1].fim = i; }
    }
    let x0 = 0, x1 = w - 1;
    if (ilhas.length) {
      if (a.maior) { const m = ilhas.slice().sort((p, q) => (q.fim - q.ini) - (p.fim - p.ini))[0]; x0 = m.ini; x1 = m.fim; }
      else { x0 = ilhas[0].ini; x1 = ilhas[ilhas.length - 1].fim; }
    }
    // linhas, medidas DENTRO da faixa de colunas escolhida
    let y0 = h, y1 = -1;
    for (let j = 0; j < h; j++) for (let i = x0; i <= x1; i++) {
      if (d[(j * w + i) * 4 + 3] > 16) { if (j < y0) y0 = j; if (j > y1) y1 = j; break; }
    }
    if (y1 < 0) { y0 = 0; y1 = h - 1; }
    const nw = x1 - x0 + 1, nh = y1 - y0 + 1;

    const rec = document.createElement('canvas'); rec.width = nw; rec.height = nh;
    rec.getContext('2d').drawImage(c, x0, y0, nw, nh, 0, 0, nw, nh);
    const saida = rec.toDataURL('image/webp', a.q);

    // OS DOIS LADOS PASSAM PELO MESMO CAMINHO, e isto foi um defeito medido do próprio
    // instrumento: comparar o CANVAS de origem contra a IMAGEM regravada dava erro médio de
    // 11,3 de 255 — e o número não se mexia com a qualidade (11,41 a q=0,80 contra 11,34 a
    // q=0,95), que é a assinatura de erro de instrumento, não de compressão. Canvas e imagem
    // não interpolam a borda transparente do mesmo jeito na redução. A referência passa a ser
    // o MESMO recorte gravado em PNG (sem perda) e decodificado como imagem: aí os dois lados
    // são imagens, e o que sobra é só o que a compressão fez. Com a correção o mesmo par mede
    // 2,42 no tamanho da folha e 0,68 na escala em que o jogo desenha.
    const ref = await carregar(rec.toDataURL('image/png'));
    const fim = await carregar(saida);
    const escala = a.alvo / nh, tw = Math.max(1, Math.round(nw * escala)), th = a.alvo;
    function erro(w2, h2) {
      const A = pixels(ref, w2, h2), B = pixels(fim, w2, h2);
      let soma = 0, pior = 0, n = 0;
      for (let i = 0; i < A.length; i += 4) {
        for (let k = 0; k < 3; k++) { const e = Math.abs(A[i + k] - B[i + k]); soma += e; if (e > pior) pior = e; n++; }
      }
      return { medio: soma / n, pior };
    }
    return {
      w, h, x0, y0, nw, nh, saida, ilhas: ilhas.map(v => v.ini + '..' + v.fim),
      naTela: tw + 'x' + th, folha: erro(nw, nh), tela: erro(tw, th)
    };
  }, { uri, q: Q, maior: MAIOR, alvo: ALVO_TELA });

  const bytes = Buffer.from(r.saida.split(',')[1], 'base64');
  fs.writeFileSync(path.resolve(RAIZ, SAI), bytes);
  await nav.close();

  console.log(ENT + '  ' + r.w + 'x' + r.h + '  ' + cru.length + ' B');
  console.log('  ilhas de coluna: ' + r.ilhas.join(' | ') + (MAIOR ? '   (fiquei com a maior)' : ''));
  console.log('  recorte: x' + r.x0 + ' y' + r.y0 + ' → ' + r.nw + 'x' + r.nh);
  console.log('  na tela a ' + ALVO_TELA + ' px de altura: ' + r.naTela
    + '   (antes: ' + Math.round(r.w * (ALVO_TELA / r.h)) + 'x' + ALVO_TELA + ')');
  console.log('  recompressão q=' + Q + ': erro médio ' + r.folha.medio.toFixed(3)
    + ' de 255 no tamanho da folha (pior canal ' + r.folha.pior + ')');
  console.log('                       ' + ' '.repeat(String(Q).length) + '  erro médio '
    + r.tela.medio.toFixed(3) + ' de 255 NA ESCALA DE EXIBIÇÃO (pior canal ' + r.tela.pior
    + ') — régua do §6: 2,6');
  console.log('  escrito: ' + SAI + '  ' + bytes.length + ' B');
})().catch(e => { console.error(e); process.exit(1); });
