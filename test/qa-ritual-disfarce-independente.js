// DISFARCES QUE O AUTOR DA ASSINATURA NAO ESCREVEU — sonda do QA, 05/09.
//
// `test/assinatura-ritual.js` afirma "invariante PEGA 35 de 35 disfarces, teto 14,8 contra
// limiar 20". Os 35 disfarces sao do PROPRIO autor e saem de dentro do arquivo que ele testa
// (`ASS.receitas`). Isso mede a assinatura contra a imaginacao de quem a escreveu, e a licao
// 2.8 do EQUIPE.md diz que instrumento assim vale o que vale.
//
// Este arquivo fabrica disfarces ESCRITOS POR OUTRA CABECA e mede as duas medidas do portao
// (`crua`, limiar 12, e `invariante`, limiar 20) para cada um. O portao so PEGA quando pelo
// menos uma das duas fica ABAIXO do seu limiar. Um disfarce com crua > 12 E invar > 20
// ESCAPA: seria injetavel em MOB_B64/ICONE_B64/GENTE_EP_B64 com `npm test` verde.
//
// Uso:   node test/qa-ritual-disfarce-independente.js
//        QA_SO_TABELA=1 node ...   # imprime e sai 0 mesmo com escape (para medir sem travar)
//
// Sai 1 quando algum disfarce ESCAPA — que e o achado, nao a falha do instrumento.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'assinatura-ritual.js'))) {
  console.error('ESTA SONDA MEDE A ENTREGA A (ritual-fora-do-drop-sem-lista-branca), que ainda nao');
  console.error('esta neste ramo: test/assinatura-ritual.js nao existe. Integre a entrega A antes.');
  process.exit(2);
}
const ASS = require('./assinatura-ritual.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
const RAIZ = path.resolve(__dirname, '..');
const OBJ = path.join(RAIZ, 'assets', 'objetos');
const RITUAL = { 'drop-cap4-1': 'acaraje', 'drop-cap4-2': 'pano da costa', 'drop-cap4-3': 'buzios' };
const LIMIAR_CRU = Number(process.env.QA_LIMIAR || 12);

// As receitas do QA. Nenhuma delas esta em ASS.receitas — conferido por nome antes de rodar.
// A familia que interessa e a de FUNDO OPACO: o corte na mancha do passo 1 da assinatura usa
// alfa > 16, entao qualquer fundo opaco faz a caixa virar o quadro inteiro e a figura encolher
// dentro da grade 16x16. Arte de icone e de mob costuma ter fundo opaco.
function receitasQA(pg, uri) {
  return pg.evaluate(async function (u) {
    const im = await window.__ritCarregar(u);
    const w = im.naturalWidth, h = im.naturalHeight;
    const base = document.createElement('canvas'); base.width = w; base.height = h;
    base.getContext('2d').drawImage(im, 0, 0);

    function tela(cw, ch) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(cw)); c.height = Math.max(1, Math.round(ch)); return c; }
    const saida = {};
    function pom(nome, c) { saida[nome] = c.toDataURL('image/webp', 0.8); }

    // 1. FUNDO OPACO — a familia que o corte na mancha nao ve
    [['#f0e2c8', 'creme'], ['#1b1b1b', 'quase preto']].forEach(function (par) {
      const c = tela(w, h); const x = c.getContext('2d');
      x.fillStyle = par[0]; x.fillRect(0, 0, w, h); x.drawImage(base, 0, 0);
      pom('fundo opaco ' + par[1], c);
    });
    [1.25, 1.6, 2.0].forEach(function (f) {
      const c = tela(w * f, h * f); const x = c.getContext('2d');
      x.fillStyle = '#f0e2c8'; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(base, (c.width - w) / 2, (c.height - h) / 2);
      pom('fundo opaco + folga x' + f, c);
    });
    // fundo opaco descentrado: muda enquadramento sem mudar tamanho
    (function () {
      const c = tela(w * 1.6, h * 1.6); const x = c.getContext('2d');
      x.fillStyle = '#f0e2c8'; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(base, c.width - w, c.height - h);
      pom('fundo opaco + canto', c);
    })();
    // fundo opaco + giro + brilho, tudo junto
    (function () {
      const c = tela(w * 1.4, h * 1.4); const x = c.getContext('2d');
      x.fillStyle = '#f0e2c8'; x.fillRect(0, 0, c.width, c.height);
      x.filter = 'brightness(1.2)';
      x.translate(c.width / 2, c.height / 2); x.rotate(11 * Math.PI / 180);
      x.drawImage(base, -w / 2, -h / 2);
      pom('COMPOSTO fundo+giro11+brilho', c);
    })();

    // 2. PONTO OPACO SOLTO — um pixel de sujeira longe da figura estica a caixa da mancha
    [0.20, 0.45].forEach(function (f) {
      const c = tela(w * (1 + f), h * (1 + f)); const x = c.getContext('2d');
      x.drawImage(base, 0, 0);
      x.fillStyle = 'rgba(0,0,0,0.9)'; x.fillRect(c.width - 3, c.height - 3, 2, 2);
      pom('ponto solto no canto +' + Math.round(f * 100) + '%', c);
    });

    // 3. RECORTE PARCIAL — some com um pedaco da figura
    [0.15, 0.30, 0.45].forEach(function (f) {
      const c = tela(w, h); const x = c.getContext('2d');
      x.drawImage(base, 0, 0);
      x.clearRect(0, 0, w * f, h);            // corta a faixa esquerda
      pom('recorte: perde ' + Math.round(f * 100) + '% a esquerda', c);
    });
    (function () {   // corta um quarto na diagonal (canto inferior direito)
      const c = tela(w, h); const x = c.getContext('2d');
      x.drawImage(base, 0, 0); x.clearRect(w * 0.6, h * 0.6, w, h);
      pom('recorte: some o quarto inferior-direito', c);
    })();

    // 4. RUIDO
    [12, 30, 60].forEach(function (amp) {
      const c = tela(w, h); const x = c.getContext('2d');
      x.drawImage(base, 0, 0);
      const d = x.getImageData(0, 0, w, h);
      for (let i = 0; i < d.data.length; i += 4) {
        const r = (Math.random() * 2 - 1) * amp;
        d.data[i] = Math.max(0, Math.min(255, d.data[i] + r));
        d.data[i + 1] = Math.max(0, Math.min(255, d.data[i + 1] + r));
        d.data[i + 2] = Math.max(0, Math.min(255, d.data[i + 2] + r));
      }
      x.putImageData(d, 0, 0);
      pom('ruido +-' + amp, c);
    });

    // 5. REDIMENSIONAMENTO NAO UNIFORME FORTE (a esticada do autor era 1,35x)
    [[2.2, 1], [1, 2.2], [3.0, 1], [1.6, 0.6]].forEach(function (p) {
      const c = tela(w * p[0], h * p[1]);
      c.getContext('2d').drawImage(base, 0, 0, c.width, c.height);
      pom('nao uniforme ' + p[0] + 'x' + p[1], c);
    });

    // 6. GIRO NO RESIDUO DO BANCO — o banco tem passo de 5 graus com 8 simetrias, entao o
    // pior residuo teorico e 2,5 graus. E o angulo onde o disfarce ganha mais.
    [2.5, 22.5, 47.5, 67.5].forEach(function (g) {
      const c = tela(w, h); const x = c.getContext('2d');
      x.translate(w / 2, h / 2); x.rotate(g * Math.PI / 180); x.drawImage(base, -w / 2, -h / 2);
      pom('giro ' + g + ' (residuo do banco)', c);
    });

    // 7. CISALHAMENTO / PERSPECTIVA barata
    [0.25, 0.5].forEach(function (s) {
      const c = tela(w * (1 + s), h); const x = c.getContext('2d');
      x.setTransform(1, 0, s, 1, 0, 0); x.drawImage(base, 0, 0);
      pom('cisalhado ' + s, c);
    });

    // 8. COMPOSICOES do enunciado: giro + brilho + moldura transparente juntos
    (function () {
      const c = tela(w, h); const x = c.getContext('2d');
      x.filter = 'brightness(1.25) hue-rotate(25deg)';
      x.translate(w / 2, h / 2); x.rotate(13 * Math.PI / 180);
      x.drawImage(base, -w * 0.44, -h * 0.44, w * 0.88, h * 0.88);
      pom('COMPOSTO giro13+brilho+matiz+moldura', c);
    })();
    (function () {   // negativo + espelho + giro
      const c = tela(w, h); const x = c.getContext('2d');
      x.filter = 'invert(1)';
      x.translate(w, 0); x.scale(-1, 1);
      x.translate(w / 2, h / 2); x.rotate(-7 * Math.PI / 180); x.translate(-w / 2, -h / 2);
      x.drawImage(base, 0, 0);
      pom('COMPOSTO negativo+espelho+giro7', c);
    })();
    (function () {   // ruido + nao uniforme + brilho
      const c = tela(w * 1.5, h * 0.8); const x = c.getContext('2d');
      x.filter = 'brightness(1.3)';
      x.drawImage(base, 0, 0, c.width, c.height);
      const d = x.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < d.data.length; i += 4) {
        const r = (Math.random() * 2 - 1) * 25;
        d.data[i] += r; d.data[i + 1] += r; d.data[i + 2] += r;
      }
      x.putImageData(d, 0, 0);
      pom('COMPOSTO ruido+nao uniforme+brilho', c);
    })();

    // 9. POSTERIZACAO / limiar duro — mata degrade, mantem silhueta
    (function () {
      const c = tela(w, h); const x = c.getContext('2d');
      x.drawImage(base, 0, 0);
      const d = x.getImageData(0, 0, w, h);
      for (let i = 0; i < d.data.length; i += 4) {
        for (let k = 0; k < 3; k++) d.data[i + k] = Math.round(d.data[i + k] / 64) * 64;
      }
      x.putImageData(d, 0, 0);
      pom('posterizado 4 niveis', c);
    })();

    // 10. RECOMPRESSAO destrutiva de verdade
    pom('reduzido a 12% e reampliado', (function () {
      const p = tela(w * 0.12, h * 0.12); p.getContext('2d').drawImage(base, 0, 0, p.width, p.height);
      const c = tela(w, h); c.getContext('2d').drawImage(p, 0, 0, w, h); return c;
    })());

    return saida;
  }, uri);
}

(async () => {
  const refs = Object.keys(RITUAL).map(function (n) {
    return { nome: n, ritual: RITUAL[n], uri: 'data:image/webp;base64,' + fs.readFileSync(path.join(OBJ, n + '.webp')).toString('base64') };
  });

  const nav = await chromium.launch({ executablePath: chromiumPath() });
  const pg = await nav.newPage();
  await pg.goto('about:blank');
  await ASS.instalar(pg);

  // banco IGUAL ao do portao — 18 angulos x {com,sem corte} x 8 simetrias x {luma,negativo}
  const gradesRef = [[], [], []];
  for (const a of ASS.ANGULOS) for (const corte of [false, true]) {
    if (a === 0 && corte) continue;
    const ls = await ASS.lumas(pg, refs.map(r => r.uri), a, corte);
    ls.forEach((l, ri) => gradesRef[ri].push(l));
  }
  const bancos = gradesRef.map(g => ASS.banco(g));

  // a medida CRUA do portao (16x16 RGB sobre cinza, com espelho)
  async function crua(us) {
    const out = [];
    for (let k = 0; k < us.length; k += 40) {
      const p = await pg.evaluate(async function (l) {
        const r = [];
        for (const u of l) {
          try {
            const im = new Image(); im.src = u; await im.decode();
            const f = function (esp) {
              const c = document.createElement('canvas'); c.width = 16; c.height = 16;
              const x = c.getContext('2d');
              x.fillStyle = '#808080'; x.fillRect(0, 0, 16, 16);
              x.imageSmoothingEnabled = true;
              if (esp) { x.translate(16, 0); x.scale(-1, 1); }
              x.drawImage(im, 0, 0, 16, 16);
              const d = x.getImageData(0, 0, 16, 16).data;
              const o = []; for (let i = 0; i < d.length; i += 4) o.push(d[i], d[i + 1], d[i + 2]);
              return o;
            };
            r.push({ n: f(false), e: f(true) });
          } catch (e) { r.push(null); }
        }
        return r;
      }, us.slice(k, k + 40));
      p.forEach(v => out.push(v));
    }
    return out;
  }
  const cruRef = await crua(refs.map(r => r.uri));
  function mad(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; }
  const dCru = (a, b) => (a && b ? Math.min(mad(a.n, b.n), mad(a.n, b.e)) : Infinity);

  // confere que nenhuma receita minha repete nome de receita do autor
  const doAutor = Object.keys(await ASS.receitas(pg, refs[0].uri));
  const linhas = [];
  for (let ri = 0; ri < refs.length; ri++) {
    const rec = await receitasQA(pg, refs[ri].uri);
    const nomes = Object.keys(rec);
    nomes.forEach(function (n) { if (doAutor.indexOf(n) >= 0) throw new Error('receita repetida do autor: ' + n); });
    const ls = await ASS.lumas(pg, nomes.map(k => rec[k]));
    const cs = await crua(nomes.map(k => rec[k]));
    nomes.forEach(function (n, i) {
      linhas.push({
        ri, ritual: refs[ri].ritual, nome: n,
        inv: ASS.distancia(ASS.vetor(ls[i]), bancos[ri]),
        cru: dCru(cs[i], cruRef[ri])
      });
    });
  }
  await nav.close();

  const nomes = linhas.filter(l => l.ri === 0).map(l => l.nome);
  console.log('DISFARCES DO QA (nenhum deles esta em ASS.receitas) — ' + nomes.length +
    ' receitas x ' + refs.length + ' rituais = ' + linhas.length + ' imagens');
  console.log('  limiares do portao: CRUA ' + LIMIAR_CRU + ' · INVARIANTE ' + ASS.LIMIAR_INV);
  console.log('  ESCAPA = crua > ' + LIMIAR_CRU + ' E invar > ' + ASS.LIMIAR_INV + ' (o portao deixa passar)\n');
  console.log('  ' + 'disfarce (pior dos 3 rituais)'.padEnd(40) + '   CRUA  INVAR   veredito');

  let escapes = 0, teto = -Infinity, tn = '';
  nomes.forEach(function (n) {
    const l3 = linhas.filter(l => l.nome === n);
    // o pior caso para o PORTAO e o disfarce cuja MENOR das duas medidas fica mais alta;
    // entre os 3 rituais, o que mais escapa e o de maior invariante
    const pior = l3.reduce((a, b) => (b.inv > a.inv ? b : a));
    const escapa = pior.cru > LIMIAR_CRU && pior.inv > ASS.LIMIAR_INV;
    if (escapa) escapes++;
    if (pior.inv > teto) { teto = pior.inv; tn = n + ' [' + pior.ritual + ']'; }
    console.log('  ' + n.padEnd(40) + pior.cru.toFixed(1).padStart(7) + pior.inv.toFixed(1).padStart(7) +
      '   ' + (escapa ? '*** ESCAPA ***' : 'pego') + '  (' + pior.ritual + ')');
  });

  console.log('\n  teto da invariante nestes ' + nomes.length + ' disfarces: ' + teto.toFixed(1) + '  (' + tn + ')');
  console.log('  limiar da invariante: ' + ASS.LIMIAR_INV + ' · piso de arte legitima medido em 05/09: 28,8');
  console.log('  disfarces que ESCAPAM: ' + escapes + ' de ' + nomes.length);
  if (escapes) {
    console.log('\n  ACHADO: a afirmacao "invariante PEGA 35 de 35" nao se estende a disfarces');
    console.log('  escritos por outra cabeca. Os que escapam estao marcados acima.');
  }
  if (process.env.QA_SO_TABELA) process.exit(0);
  process.exit(escapes ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
