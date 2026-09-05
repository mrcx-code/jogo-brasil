// Grade de medicao: para cada familia de arte com MESTRE em PNG, encoda em varias
// larguras e qualidades e mede (a) o base64 em KB e (b) o erro medio por canal contra
// o que HOJE esta embutido em src/jogo.ts — que e a perda que o jogador realmente veria.
//
//   node test/otimizar-medir.js ctx
//   node test/otimizar-medir.js cen
//
// Comparar candidato x mestre nao serve quando a largura muda (dimensoes diferentes).
// Entao o candidato e reamostrado de volta a resolucao ATUAL, com suavizacao alta — que e
// o que o navegador faz ao desenhar — e so entao a diferenca e medida. Assim a coluna de
// erro responde "quanto pior que hoje", que e a pergunta.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');   // onde o Chromium esta (test/abrir.js)

const RAIZ = path.resolve(__dirname, '..');
const ARQ = path.join(RAIZ, 'src', 'jogo.ts');
const src = fs.readFileSync(ARQ, 'utf8');

function bloco(nome) {
  const i = src.indexOf('/*' + nome + '_START'), j = src.indexOf('/*' + nome + '_END');
  if (i < 0 || j < 0) throw new Error('marcadores de ' + nome);
  return src.slice(i, j);
}
const RE_URI = /data:image\/webp;base64,[A-Za-z0-9+/=]+/g;

const familias = {
  // chave do CTX_B64 -> mestre
  ctx: () => {
    const b = bloco('CTX_B64');
    const uris = b.match(RE_URI);
    const chaves = [...b.matchAll(/"([a-z0-9-]+)":\s*"data:image/g)].map(m => m[1]);
    const M = path.join(RAIZ, 'assets', 'entrada');
    return chaves.map((k, i) => {
      const a = path.join(M, 'ctx-' + k + '.png');
      const b2 = path.join(M, k.replace(/^(cap\d+)-/, '$1-ctx-') + '.png');
      return { nome: k, mestre: fs.existsSync(a) ? a : b2, atual: uris[i] };
    });
  },
  // as duas listas de cenario, na ordem de CAPS do inline-fundos.js
  cen: () => {
    const b = bloco('CEN_FUNDO_B64');
    const uris = b.match(RE_URI);
    const CAPS = ['cap1', 'cap1v', 'cap2', 'cap2v', 'cap4', 'cap3', 'cap3v'];
    const D = path.join(RAIZ, 'assets', 'cenarios-novos');
    const E = path.join(RAIZ, 'assets', 'entrada');
    const out = [];
    CAPS.forEach((c, i) => {
      const alto = c === 'cap4' ? path.join(E, 'cap4-fundo-alto.png') : path.join(D, c + '-alto.png');
      out.push({ nome: c + '-alto', mestre: alto, atual: uris[i] });
    });
    CAPS.forEach((c, i) => {
      const chao = c === 'cap4' ? path.join(E, 'cap4-fundo-chao.png') : path.join(D, c + '-baixo.png');
      out.push({ nome: c + '-chao', mestre: chao, atual: uris[CAPS.length + i] });
    });
    return out;
  }
};

const alvo = process.argv[2];
if (!familias[alvo]) { console.error('uso: node test/otimizar-medir.js ctx|cen'); process.exit(1); }
const itens = familias[alvo]();
for (const it of itens) if (!fs.existsSync(it.mestre)) { console.error('sem mestre: ' + it.nome + ' -> ' + it.mestre); process.exit(1); }

// grade padrao, ou `node test/otimizar-medir.js ctx 780@0.75 660@0.8`
const GRADE = process.argv.length > 3
  ? process.argv.slice(3).map(s => [parseInt(s), parseFloat(s.split('@')[1])])
  : alvo === 'ctx'
    ? [[780, 0.80], [780, 0.72], [780, 0.65], [660, 0.80], [660, 0.72], [520, 0.80]]
    : [[720, 0.80], [720, 0.72], [720, 0.65], [600, 0.80], [600, 0.72]];

(async () => {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage();
  await pg.goto('about:blank');

  const soma = {};
  const linhas = [];
  for (const it of itens) {
    const mestre = 'data:image/png;base64,' + fs.readFileSync(it.mestre).toString('base64');
    const r = await pg.evaluate(async function (d) {
      const carregar = async (u) => { const i = new Image(); i.src = u; await i.decode(); return i; };
      const mi = await carregar(d.mestre);
      const ai = await carregar(d.atual);           // o que esta embutido hoje
      const AW = ai.naturalWidth, AH = ai.naturalHeight;
      const ca = document.createElement('canvas'); ca.width = AW; ca.height = AH;
      const ga = ca.getContext('2d'); ga.drawImage(ai, 0, 0);
      const base = ga.getImageData(0, 0, AW, AH).data;

      const saida = [];
      for (const [W0, q] of d.grade) {
        const W = Math.min(W0, mi.naturalWidth);
        const H = Math.round(mi.naturalHeight * W / mi.naturalWidth);
        const c = document.createElement('canvas'); c.width = W; c.height = H;
        const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
        g.drawImage(mi, 0, 0, W, H);
        const uri = c.toDataURL('image/webp', q);
        // reamostra de volta a resolucao de hoje, como o navegador faria ao desenhar
        const ci = await carregar(uri);
        const c2 = document.createElement('canvas'); c2.width = AW; c2.height = AH;
        const g2 = c2.getContext('2d'); g2.imageSmoothingQuality = 'high';
        g2.drawImage(ci, 0, 0, AW, AH);
        const dep = g2.getImageData(0, 0, AW, AH).data;
        let s = 0, mx = 0, n = 0;
        for (let k = 0; k < base.length; k += 4) {
          if (base[k + 3] < 8) continue;
          for (let z = 0; z < 3; z++) { const dd = Math.abs(base[k + z] - dep[k + z]); s += dd; if (dd > mx) mx = dd; n++; }
        }
        // desconta o perfil ICC que o canvas carimba: o pipeline o remove depois (tirar-icc.js),
        // e o que esta embutido hoje ja esta sem ele — comparar com ele dentro mentiria ~0,6 KB
        // por imagem a favor do que ja existe.
        const semPerfil = uri.length - 620;
        saida.push({ W, H, q, kb: semPerfil / 1024, medio: s / n, max: mx });
      }
      return { atualKB: d.atual.length / 1024, aw: AW, ah: AH, saida };
    }, { mestre, atual: it.atual, grade: GRADE });

    linhas.push(it.nome.padEnd(16) + 'hoje ' + r.atualKB.toFixed(0).padStart(4) + ' KB (' + r.aw + 'x' + r.ah + ')');
    r.saida.forEach((s, i) => {
      const k = s.W + '@' + s.q;
      soma[k] = (soma[k] || 0) + s.kb;
      linhas.push('   ' + (s.W + 'px q' + s.q).padEnd(14) + s.kb.toFixed(0).padStart(5) + ' KB   erro med '
        + s.medio.toFixed(2).padStart(5) + '  max ' + String(s.max).padStart(3));
    });
    process.stdout.write(linhas.splice(0).join('\n') + '\n');
  }
  await nav.close();

  const hoje = itens.reduce((a, x) => a + x.atual.length, 0) / 1024;
  console.log('\n=== TOTAL da familia ' + alvo + ' — hoje ' + hoje.toFixed(0) + ' KB ===');
  for (const [k, v] of Object.entries(soma))
    console.log('  ' + k.padEnd(12) + v.toFixed(0).padStart(5) + ' KB   (' + (v - hoje >= 0 ? '+' : '') + (v - hoje).toFixed(0) + ' KB)');
})();
