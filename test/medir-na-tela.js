// Compara a arte de HOJE (working tree) com a do ultimo commit, NA ESCALA EM QUE ELA APARECE.
//
//   node test/medir-na-tela.js
//
// Por que na escala de tela: a pintura de cenario e desenhada AMPLIADA 2,53x num aparelho de
// 390x844 com dpr 3 (a conta esta em redesenharFundo: o termo (1-gd)*ch/((1-gs)*ih) domina).
// Erro medido no arquivo, pixel a pixel, conta ruido que a ampliacao com suavizacao apaga
// antes de chegar ao olho. O numero honesto e este.
//
// Comparar o quadro do jogo rodando NAO serve: o mundo rola, e dois runs param em posicoes
// diferentes — o diff mede o deslocamento, nao a qualidade. Ja tentado, ja descartado.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');   // onde o Chromium esta (test/abrir.js)

const RAIZ = path.resolve(__dirname, '..');
const RE = /data:image\/webp;base64,[A-Za-z0-9+/=]+/g;
const novo = fs.readFileSync(path.join(RAIZ, 'src', 'jogo.ts'), 'utf8');
const velho = execSync('git show HEAD:src/jogo.ts', { cwd: RAIZ, maxBuffer: 1 << 30 }).toString('utf8');

function bloco(src, n) {
  const i = src.indexOf('/*' + n + '_START'), j = src.indexOf('/*' + n + '_END');
  if (i < 0 || j < 0) throw new Error('marcadores de ' + n);
  return src.slice(i, j).match(RE) || [];
}

// escala de exibicao medida no motor, por familia
const ALVOS = [
  { nome: 'CEN_FUNDO_B64', escala: 2.53, nota: 'pintura ampliada no fundoHD (390x844 dpr3)' },
  { nome: 'CTX_B64', escala: 1.50, nota: 'contexto: 780 px de arte em 390 css x dpr3 = 1170' },
  { nome: 'HERO_B64', escala: 0.55, nota: 'folha de 184 px desenhada em ~101 px de tela' },
  { nome: 'NPC_B64', escala: 0.55, nota: null },
  { nome: 'RETRATO_B64', escala: 1.00, nota: 'retrato 132x300 css x dpr3 sobre mestre de 300' },
  { nome: 'DECOR_B64', escala: 0.55, nota: null }
];

(async () => {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage(); await pg.goto('about:blank');
  for (const alvo of ALVOS) {
    const A = bloco(velho, alvo.nome), B = bloco(novo, alvo.nome);
    if (A.length !== B.length) { console.log(alvo.nome + ': contagem mudou (' + A.length + ' -> ' + B.length + ') — pulado'); continue; }
    let soma = 0, mx = 0, n = 0, kbA = 0, kbB = 0;
    for (let i = 0; i < A.length; i += 8) {
      const lote = A.slice(i, i + 8).map((a, k) => [a, B[i + k]]);
      const r = await pg.evaluate(async function (d) {
        const carregar = async (u) => { const i = new Image(); i.src = u; await i.decode(); return i; };
        let s = 0, m = 0, n = 0;
        for (const [a, b] of d.lote) {
          const ia = await carregar(a), ib = await carregar(b);
          const W = Math.max(1, Math.round(ia.naturalWidth * d.e)), H = Math.max(1, Math.round(ia.naturalHeight * d.e));
          const px = (im) => { const c = document.createElement('canvas'); c.width = W; c.height = H;
            const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
            g.drawImage(im, 0, 0, W, H); return g.getImageData(0, 0, W, H).data; };
          const P = px(ia), Q = px(ib);
          for (let k = 0; k < P.length; k += 4) {
            if (P[k + 3] < 8) continue;
            for (let z = 0; z < 3; z++) { const dd = Math.abs(P[k + z] - Q[k + z]); s += dd; if (dd > m) m = dd; n++; }
          }
        }
        return { s, m, n };
      }, { lote, e: alvo.escala });
      soma += r.s; n += r.n; if (r.m > mx) mx = r.m;
    }
    A.forEach(u => kbA += u.length / 1024); B.forEach(u => kbB += u.length / 1024);
    console.log(alvo.nome.padEnd(15) + 'x' + alvo.escala.toFixed(2) + '  '
      + kbA.toFixed(0).padStart(5) + ' -> ' + kbB.toFixed(0).padStart(5) + ' KB   '
      + 'erro medio NA TELA ' + (soma / n).toFixed(2).padStart(5) + '  max ' + mx
      + (alvo.nota ? '   (' + alvo.nota + ')' : ''));
  }
  await nav.close();
})();
