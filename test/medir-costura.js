// ONDE A EMENDA DO ESPELHO PODE CAIR — a régua do achado 3 do ticket COERENCIA-VISUAL (21/08).
//
//   node test/medir-costura.js [pintura]     (padrão 7 = JABAQUARA)
//
// O DEFEITO: a técnica de repetição do §7 (cópias alternadas espelhadas) elimina a emenda
// porque uma borda só encontra o próprio reflexo. O preço é que TODA junta é um eixo de
// simetria — e onde a pintura tem detalhe forte e não-repetitivo no eixo, o reflexo vira um
// padrão simétrico que o olho lê como rosto. Em JABAQUARA é uma raiz de árvore no chão; em
// PINDORAMA a mesma técnica é invisível, porque folhagem chapada já é repetitiva.
//
// A CORREÇÃO É DE POSIÇÃO, não de arte: ladrilhar uma JANELA da fonte em vez da largura
// inteira move os dois eixos (a borda esquerda e a direita do que se repete) para outras
// colunas da pintura. Este instrumento diz PARA ONDE.
//
// COMO ELE MEDE: para cada coluna da peça, a energia de borda numa banda de ±B px em volta
// dela (média de |dI/dx| na luma, por linha). Quanto maior, mais detalhe o espelho teria para
// duplicar ali. Depois varre todas as janelas [a,b] com largura mínima e devolve a que
// MINIMIZA o pior dos dois eixos — porque um eixo limpo e outro sujo continua sendo um rosto.
//
// POR QUE PELO JOGO E NÃO PELO ARQUIVO: a peça que chega ao aparelho pode ser a quantizada
// (o passe de pixel de 21/08), e é a granulometria dela que decide o que o espelho duplica.
// `window.pecaExibida` devolve exatamente a que `rolarFundo()` desenha.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ABRIR = require('./abrir.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
}

const PINT = parseInt(process.argv[2] || '7', 10);
const LARG_MIN = 0.80;      // não encolher o ladrilho abaixo disto: menos pintura por volta

(async () => {
  const file = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await page.goto(file);
  await page.waitForTimeout(1200);

  const r = await page.evaluate(async ({ pint, largMin }) => {
    if (typeof fecharTelas === 'function') fecharTelas();
    for (let e = 0; e < EPOCAS.length; e++) garantirEpoca(e);
    for (let t = 0; t < 400 && Object.keys(pacoteEstado).some(n => pacoteEstado[n] !== 'aqui'); t++) {
      await new Promise(r2 => setTimeout(r2, 25));
    }
    // entra no capítulo que USA esta pintura, para `pecaExibida` devolver a peça tratada
    let alvo = 0;
    for (let e = 0; e < EPOCAS.length; e++) {
      const a = EPOCAS[e].arte || [];
      if (a.indexOf(pint) >= 0) { alvo = e; break; }
    }
    fecharTelas(); entrarNaEpoca(alvo); redesenharFundo();
    await new Promise(r2 => setTimeout(r2, 400));
    const peca = window.pecaExibida(pint, 'chao');
    const w = peca.naturalWidth || peca.width, h = peca.naturalHeight || peca.height;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
    cx.drawImage(peca, 0, 0);
    const d = cx.getImageData(0, 0, w, h).data;
    const L = new Float64Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      L[y * w + x] = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
    }
    // ESTRUTURA, NÃO TEXTURA. A primeira versão deste instrumento media |dI/dx| coluna a
    // coluna e a resposta foi "todas as colunas são iguais" (ganho de 7% na melhor janela):
    // a peça inteira é raiz e terra, e a energia de borda é uniforme. Só que o que lê como
    // ROSTO não é textura fina — é uma MANCHA grande e escura duplicada. Então o que se mede
    // é a baixa frequência: a luma borrada num raio de ~5 px de fonte (≈20 px de aparelho),
    // e o desvio dela ao longo da coluna. Terra batida some no borrão; raiz grossa não.
    // Os borrões saem de SOMA DE PREFIXO, e isso não é elegância: a primeira versão usava
    // janela deslizante escrevendo em `x - R`, e as últimas R colunas de cada linha nunca
    // recebiam valor — ficavam com o lixo da linha anterior. O instrumento então apontou a
    // borda DIREITA como a pior de todas (19,8 contra 2,8), que era o artefato dele mesmo
    // falando. Soma de prefixo trata a borda por construção. (EQUIPE.md 2.8: um instrumento
    // que nunca foi visto errando é decoração — este foi, e é por isso que a conta mudou.)
    function borrar(src, rx, ry) {
      const t = new Float64Array(w * h), o = new Float64Array(w * h);
      for (let y = 0; y < h; y++) {
        const pre = new Float64Array(w + 1);
        for (let x = 0; x < w; x++) pre[x + 1] = pre[x] + src[y * w + x];
        for (let x = 0; x < w; x++) {
          const a = Math.max(0, x - rx), b = Math.min(w - 1, x + rx);
          t[y * w + x] = (pre[b + 1] - pre[a]) / (b - a + 1);
        }
      }
      if (!ry) return t;
      for (let x = 0; x < w; x++) {
        const pre = new Float64Array(h + 1);
        for (let y = 0; y < h; y++) pre[y + 1] = pre[y] + t[y * w + x];
        for (let y = 0; y < h; y++) {
          const a = Math.max(0, y - ry), b = Math.min(h - 1, y + ry);
          o[y * w + x] = (pre[b + 1] - pre[a]) / (b - a + 1);
        }
      }
      return o;
    }
    const R = Math.max(2, Math.round(w * 0.018));
    const bl = borrar(L, R, R);
    // BANDA PASSANTE: quanto o borrão fino se afasta do borrão LARGO da mesma linha. O borrão
    // largo é o "fundo" daquela faixa (a terra, a copa); o que sobra é a mancha — a raiz. Toda
    // coluna tem a mesma estratificação vertical (copa em cima, terra no meio), então medir
    // desvio ao longo de Y daria o mesmo número em toda parte; o que distingue uma coluna da
    // vizinha é a ANOMALIA horizontal.
    const RL = Math.max(6, Math.round(w * 0.08));
    const larga = borrar(bl, RL, 0);
    const col = new Float64Array(w);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) col[x] += Math.abs(bl[y * w + x] - larga[y * w + x]) / h;
    }
    // banda de ±B: é o que o olho vê em volta do eixo, não a coluna isolada
    const B = Math.max(3, Math.round(w * 0.02));
    const banda = new Float64Array(w);
    for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let k = -B; k <= B; k++) { const j = x + k; if (j >= 0 && j < w) { s += col[j]; n++; } }
      banda[x] = s / n;
    }
    // varredura das janelas
    const passo = Math.max(1, Math.round(w / 200));
    let melhor = null;
    for (let a = 0; a < w * (1 - largMin); a += passo) {
      for (let b = Math.round(a + w * largMin); b < w; b += passo) {
        const pior = Math.max(banda[a], banda[b - 1]);
        if (!melhor || pior < melhor.pior) melhor = { a, b, pior, ea: banda[a], eb: banda[b - 1] };
      }
    }
    return { w, h, hoje: { a: 0, b: w, ea: banda[0], eb: banda[w - 1], pior: Math.max(banda[0], banda[w - 1]) },
      melhor, media: Array.from(banda).reduce((s, v) => s + v, 0) / w };
  }, { pint: PINT, largMin: LARG_MIN });

  const f = n => n.toFixed(3);
  console.log('pintura ' + PINT + ' — peça de baixo ' + r.w + 'x' + r.h + '  (energia média de borda: ' + f(r.media) + ')');
  console.log('HOJE   janela [0,1]           eixos: ' + f(r.hoje.ea) + ' e ' + f(r.hoje.eb) + '  → pior ' + f(r.hoje.pior));
  console.log('MELHOR janela [' + (r.melhor.a / r.w).toFixed(4) + ',' + (r.melhor.b / r.w).toFixed(4) + ']'
    + '  eixos: ' + f(r.melhor.ea) + ' e ' + f(r.melhor.eb) + '  → pior ' + f(r.melhor.pior));
  console.log('ganho: pior eixo cai ' + (100 * (1 - r.melhor.pior / r.hoje.pior)).toFixed(1) + '%');
  await browser.close();
})();
