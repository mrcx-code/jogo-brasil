// ASSINATURA INVARIANTE — a que fecha o buraco que a distância crua deixava FORA do drop.
//
// Escrito em 05/09 pelo dev-jogo, item `ritual-fora-do-drop-sem-lista-branca`. Aqui não há
// regra nova de representação: o §2.4 item 5 do `CLAUDE.md` é o mesmo de sempre (*objeto
// ritual não é colecionável*). O que muda é o INSTRUMENTO que cobra a trava onde a lista
// branca não cabe.
//
// ── O PROBLEMA, com o número que o criou ─────────────────────────────────────────────────
// Em lugar de DROP a trava está fechada por LISTA BRANCA (`test/salvador-drop-sem-ritual.js`):
// toda arte que ocupa um lugar de drop tem de SER uma das oito aprovadas. Isso fecha as treze
// linhas da tabela de disfarces com folga mínima de 31,5 contra limiar 12.
//
// Fora dali — `MOB_B64`, `ICONE_B64`, `FRENTE_B64`, `GENTE_EP_B64`, `RETRATO_B64`, centenas de
// artes — **não existe tabela de arte aprovada**, então não há lista branca possível. Sobra a
// lista NEGRA: medir cada imagem contra as três artes rituais. E a lista negra por distância
// CRUA (RGB 16×16 sobre cinza, com espelho) tinha buraco medido:
//
//   brilho ×1,25 = 14,0 · matiz +40° = 21,9 · moldura +12% = 28,8 · espelho vertical = 52,0
//   180° = 52,2 · 90° = 53,9 · 8° = 33,7        — todos ACIMA do limiar 12, todos PASSAVAM.
//
// Um búzio ACLARADO em `MOB_B64` entrava e o `npm test` saía verde.
//
// ── POR QUE NÃO SE RESOLVE MEXENDO NO LIMIAR, e o número é o oposto do que parece ─────────
// A saída "(a) baixar o limiar" não existe: baixar o limiar faz o portão pegar MENOS, não
// mais. Para pegar o brilho ×1,25 (14,0) seria preciso SUBIR o limiar acima de 14. Medido em
// 05/09 nas 518 imagens da saída construída, o piso de arte legítima na distância crua é
// **29,9** — e ele está em `MOB_B64` (`pack-palmares.json MOB_B64.drum.1`), quer dizer que a
// janela existe também fora do lugar de drop. Então subir o limiar de 12 para ~20 fecharia
// brilho (14,0) e matiz (21,9)… e pararia aí: moldura +12% (28,8) encosta no piso 29,9, e as
// rotações (52 a 54) estão acima do piso e **nenhum limiar as alcança**. Mexer no limiar é
// remendo de duas linhas de treze, e compra as duas gastando a folga inteira.
//
// ── O QUE ESTE ARQUIVO FAZ, e ele é uma AFIRMAÇÃO com medição ao lado ─────────────────────
// A distância crua compara TINTA. Quem quer devolver o búzio ao chão muda a tinta, e a tinta é
// o mais barato de mudar (um filtro). Então a assinatura passa a ser sobre a FORMA:
//
//   1. **corta na mancha** (caixa de alfa > 16, a mesma regra do `test/aparar-objeto.js`) —
//      mata moldura, recuo e esticada, porque tudo é reescalado para o mesmo quadrado;
//   2. reduz a 16×16 e tira a **luma**;
//   3. **z-normaliza** a luma (subtrai média, divide por desvio) — mata brilho e contraste,
//      que são ganho e deslocamento afins;
//   4. junta o **módulo do gradiente**, normalizado pela própria média — que é invariante a
//      ganho por construção e é o que sobrevive a matiz, sépia e dessaturação;
//   5. compara contra um **banco de orientações** da arte ritual em vez de contra uma só:
//      ângulos de 5 em 5 graus (com e sem corte de canto, que são coisas diferentes quando
//      se gira dentro do mesmo quadro), cada um nas 8 simetrias do quadrado, cada um também
//      com a metade luma NEGADA — que fecha a classe do negativo, porque |grad(−f)| = |grad(f)|
//      e só a luma inverte de sinal.
//
// **A afirmação, e como ela se separa da alternativa:** o que fecha o brilho ×1,25 é o passo 3,
// não o passo 5. A medição que separa: com o mesmo banco de orientações e SEM a z-normalização
// (a distância crua), brilho ×1,25 mede 14,0; com a z-normalização, mede 8,0 e o teto inteiro
// dos 35 disfarces cai para 14,8. E o que fecha as rotações é o passo 5, não o 3: só com a
// z-normalização e o espelho, o espelho vertical continua em 47,8. Os dois passos fecham
// classes diferentes e nenhum dos dois é dispensável — está na tabela do `QA_TABELA=1`.
//
// ── A JANELA, MEDIDA EM 05/09 (518 imagens da saída × 3 rituais) ─────────────────────────
//
//   teto dos 35 disfarces .......... 14,8   (brilho ×1,25 combinado com rotação de 8°)
//   LIMIAR_INV ..................... 20
//   piso de arte LEGÍTIMA .......... 28,8   (`index.html` embutida #12)
//
//   janela: **14,8 < 20 < 28,8** — folga 1,35× para pegar e 1,44× para não errar.
//
// **O que essa janela custa, e é honesto dizer:** ela é mais apertada que a da distância crua
// (que tem 2,5× para o lado do falso positivo, e um buraco do outro). Assinatura invariante
// vê menos diferença entre figuras diferentes — é o preço de ver menos diferença entre uma
// figura e o disfarce dela. Por isso este módulo **NÃO substitui** a distância crua: o portão
// cobra as DUAS, e uma imagem só passa se passar nas duas. A crua guarda a folga grande contra
// a cópia quase exata; esta guarda a classe.
//
// ── COMO ELE SE MEDE CONTRA SI MESMO ─────────────────────────────────────────────────────
// `test/qa-ritual-varredura.js` fabrica, a cada execução, disfarces de controle das três artes
// rituais e EXIGE que caiam abaixo do limiar. Se um dia a assinatura regredir, o portão reprova
// a si mesmo antes de reprovar o jogo. A tabela completa dos 35 disfarces sai com
// `QA_TABELA=1 node test/qa-ritual-varredura.js`.

const N = 16;                 // lado da grade da assinatura
const ESC = 40;               // escala do número; não muda ordem nenhuma, só o deixa legível
const LIMIAR_INV = 20;        // ver a janela acima: 14,8 < 20 < 28,8
// de 5 em 5 graus até 85: com as 8 simetrias do quadrado isso cobre o círculo inteiro com
// resíduo máximo de 2,5°. O resíduo é o que sobra para o disfarce ganhar distância.
const ANGULOS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85];

// ── lado navegador ───────────────────────────────────────────────────────────────────────
// Instala `window.__ritLum(im, ang, cortando)`: devolve a grade NxN de luma, cortada na
// mancha, opcionalmente girando a fonte antes. `cortando` distingue girar DENTRO do quadro
// (cantos perdidos, que é o que acontece quando alguém gira uma arte no editor) de girar
// para um quadro maior (nada se perde).
function instalar(pg) {
  return pg.evaluate(function (N) {
    window.__ritN = N;
    window.__ritCarregar = async function (u) { const im = new Image(); im.src = u; await im.decode(); return im; };
    window.__ritLum = function (im, ang, cortando) {
      const N = window.__ritN, w = im.naturalWidth, h = im.naturalHeight;
      let fonte, fw, fh;
      if (ang && cortando) {
        fw = w; fh = h;
        const c2 = document.createElement('canvas'); c2.width = w; c2.height = h;
        const x2 = c2.getContext('2d');
        x2.translate(w / 2, h / 2); x2.rotate(ang * Math.PI / 180); x2.drawImage(im, -w / 2, -h / 2);
        fonte = c2;
      } else if (ang) {
        const co = Math.abs(Math.cos(ang * Math.PI / 180)), se = Math.abs(Math.sin(ang * Math.PI / 180));
        fw = Math.ceil(w * co + h * se); fh = Math.ceil(w * se + h * co);
        const c2 = document.createElement('canvas'); c2.width = fw; c2.height = fh;
        const x2 = c2.getContext('2d');
        x2.translate(fw / 2, fh / 2); x2.rotate(ang * Math.PI / 180); x2.drawImage(im, -w / 2, -h / 2);
        fonte = c2;
      } else {
        fw = w; fh = h;
        const c2 = document.createElement('canvas'); c2.width = w; c2.height = h;
        c2.getContext('2d').drawImage(im, 0, 0); fonte = c2;
      }
      // caixa da mancha — a MESMA regra do test/aparar-objeto.js (alfa > 16). É ela que faz
      // moldura, recuo e esticada custarem quase nada.
      const dd = fonte.getContext('2d').getImageData(0, 0, fw, fh).data;
      let x0 = fw, x1 = -1, y0 = fh, y1 = -1;
      for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) {
        if (dd[(j * fw + i) * 4 + 3] > 16) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
      }
      if (x1 < 0) { x0 = 0; x1 = fw - 1; y0 = 0; y1 = fh - 1; }
      const c = document.createElement('canvas'); c.width = N; c.height = N;
      const x = c.getContext('2d');
      x.fillStyle = '#808080'; x.fillRect(0, 0, N, N);
      x.imageSmoothingEnabled = true;
      x.drawImage(fonte, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, N, N);
      const d = x.getImageData(0, 0, N, N).data;
      const lum = [];
      for (let i = 0; i < d.length; i += 4) lum.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
      return lum;
    };
  }, N);
}

// Lê as grades de luma de uma lista de URIs. Em lotes, porque 518 imagens de uma vez
// estouram a serialização da ponte.
async function lumas(pg, us, ang, cortando) {
  const out = [];
  for (let k = 0; k < us.length; k += 40) {
    const parte = await pg.evaluate(async function (a) {
      const r = [];
      for (const u of a.l) {
        try { r.push(window.__ritLum(await window.__ritCarregar(u), a.ang, a.co)); } catch (e) { r.push(null); }
      }
      return r;
    }, { l: us.slice(k, k + 40), ang: ang || 0, co: !!cortando });
    parte.forEach(p => out.push(p));
  }
  return out;
}

// ── lado node: o vetor e a distância ─────────────────────────────────────────────────────
function znorm(v) {
  let m = 0; for (let i = 0; i < v.length; i++) m += v[i]; m /= v.length;
  let s = 0; for (let i = 0; i < v.length; i++) s += (v[i] - m) * (v[i] - m);
  s = Math.sqrt(s / v.length) || 1;
  const o = new Float64Array(v.length);
  for (let i = 0; i < v.length; i++) o[i] = (v[i] - m) / s;
  return o;
}
function gradiente(l) {
  const at = (x, y) => l[Math.min(N - 1, Math.max(0, y)) * N + Math.min(N - 1, Math.max(0, x))];
  const g = new Float64Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const gx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
    const gy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
    g[y * N + x] = Math.sqrt(gx * gx + gy * gy);
  }
  let m = 0; for (let i = 0; i < g.length; i++) m += g[i]; m = (m / g.length) || 1;
  const o = new Float64Array(g.length);
  for (let i = 0; i < g.length; i++) o[i] = g[i] / m;
  return o;
}
// o vetor: luma-z e gradiente intercalados, 2 canais por célula
function vetor(lum) {
  if (!lum) return null;
  const l = Float64Array.from(lum);
  const a = znorm(l), b = gradiente(l);
  const o = new Float64Array(a.length * 2);
  for (let i = 0; i < a.length; i++) { o[i * 2] = a[i]; o[i * 2 + 1] = b[i]; }
  return o;
}
// as 8 simetrias do quadrado, exatas sobre a grade
function diedro(g, k) {
  const out = new Float64Array(g.length);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let sx, sy; const t = k & 3, esp = k & 4; let ax = x, ay = y;
    if (esp) ax = N - 1 - x;
    if (t === 0) { sx = ax; sy = ay; }
    else if (t === 1) { sx = ay; sy = N - 1 - ax; }
    else if (t === 2) { sx = N - 1 - ax; sy = N - 1 - ay; }
    else { sx = N - 1 - ay; sy = ax; }
    out[(y * N + x) * 2] = g[(sy * N + sx) * 2];
    out[(y * N + x) * 2 + 1] = g[(sy * N + sx) * 2 + 1];
  }
  return out;
}
// negativo: só a metade luma inverte de sinal — |grad(−f)| = |grad(f)|
function negar(v) {
  const o = new Float64Array(v.length);
  for (let i = 0; i < v.length; i += 2) { o[i] = -v[i]; o[i + 1] = v[i + 1]; }
  return o;
}
function mad(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; }

// Monta o banco de uma arte ritual: para cada grade de luma dada (uma por ângulo × corte),
// as 8 simetrias e o negativo de cada. 35 grades → 560 vetores.
function banco(gradesDaArte) {
  const bs = [];
  gradesDaArte.forEach(function (l) {
    if (!l) return;
    const v = vetor(l);
    for (let k = 0; k < 8; k++) { const dv = diedro(v, k); bs.push(dv); bs.push(negar(dv)); }
  });
  return bs;
}
function distancia(v, bs) {
  if (!v) return Infinity;
  let m = Infinity;
  for (let i = 0; i < bs.length; i++) { const t = mad(v, bs[i]); if (t < m) m = t; }
  return m * ESC;
}

// ── os disfarces, num lugar só ───────────────────────────────────────────────────────────
// As treze primeiras receitas são as de `test/qa-ritual-disfarce.js`, copiadas de lá de
// propósito para os dois números serem comparáveis linha a linha. As demais foram escritas
// em 05/09 contra ESTA assinatura — e três delas a derrubaram na primeira volta (o negativo
// media 33,6, acima do piso legítimo de 30,3), que é por que o banco ganhou o negativo e o
// corte de canto. Disfarce que ninguém tentou não prova nada.
function receitas(pg, uri, quais) {
  return pg.evaluate(async function (args) {
    const u = args.u;
    const im = await window.__ritCarregar(u);
    const w = im.naturalWidth, h = im.naturalHeight;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(im, 0, 0);
    const d = c.getContext('2d').getImageData(0, 0, w, h).data;
    let x0 = w, x1 = -1, y0 = h, y1 = -1;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (d[(j * w + i) * 4 + 3] > 16) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    }
    if (x1 < 0) { x0 = 0; x1 = w - 1; y0 = 0; y1 = h - 1; }
    const nw = x1 - x0 + 1, nh = y1 - y0 + 1;
    function rec() { const r = document.createElement('canvas'); r.width = nw; r.height = nh; r.getContext('2d').drawImage(c, x0, y0, nw, nh, 0, 0, nw, nh); return r; }
    function esp() { const r = document.createElement('canvas'); r.width = w; r.height = h; const x = r.getContext('2d'); x.translate(w, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return r; }
    function red(f) { const r = document.createElement('canvas'); r.width = Math.round(w * f); r.height = Math.round(h * f); r.getContext('2d').drawImage(c, 0, 0, r.width, r.height); return r; }
    function gir(g) { const r = document.createElement('canvas'); r.width = w; r.height = h; const x = r.getContext('2d'); x.translate(w / 2, h / 2); x.rotate(g * Math.PI / 180); x.drawImage(c, -w / 2, -h / 2); return r; }
    function fil(f) { const r = document.createElement('canvas'); r.width = w; r.height = h; const x = r.getContext('2d'); x.filter = f; x.drawImage(c, 0, 0); return r; }
    const t = {
      'idêntico (o caso do autor)': u,
      'recomprimido q=0,50': c.toDataURL('image/webp', 0.5),
      'aparado na mancha (esteira real)': rec().toDataURL('image/webp', 0.8),
      'reduzido a 60%': red(0.6).toDataURL('image/webp', 0.8),
      'espelhado (horizontal)': esp().toDataURL('image/webp', 0.8),
      'espelhado vertical': (function () { const r = document.createElement('canvas'); r.width = w; r.height = h; const x = r.getContext('2d'); x.translate(0, h); x.scale(1, -1); x.drawImage(c, 0, 0); return r; })().toDataURL('image/webp', 0.8),
      'rodado 180°': gir(180).toDataURL('image/webp', 0.8),
      'rodado 90°': (function () { const r = document.createElement('canvas'); r.width = h; r.height = w; const x = r.getContext('2d'); x.translate(h, 0); x.rotate(Math.PI / 2); x.drawImage(c, 0, 0); return r; })().toDataURL('image/webp', 0.8),
      'rodado 8° (torto de leve)': gir(8).toDataURL('image/webp', 0.8),
      'paleta: matiz +40°': fil('hue-rotate(40deg)').toDataURL('image/webp', 0.8),
      'paleta: brilho ×1,25': fil('brightness(1.25)').toDataURL('image/webp', 0.8),
      'espelho + aparado': (function () { const r = document.createElement('canvas'); r.width = nw; r.height = nh; const x = r.getContext('2d'); x.translate(nw, 0); x.scale(-1, 1); x.drawImage(c, x0, y0, nw, nh, 0, 0, nw, nh); return r; })().toDataURL('image/webp', 0.8),
      'moldura +12% (recuado)': (function () { const r = document.createElement('canvas'); r.width = w; r.height = h; r.getContext('2d').drawImage(c, w * 0.06, h * 0.06, w * 0.88, h * 0.88); return r; })().toDataURL('image/webp', 0.8),
      'paleta: brilho ×0,70': fil('brightness(0.7)').toDataURL('image/webp', 0.8),
      'paleta: contraste ×1,60': fil('contrast(1.6)').toDataURL('image/webp', 0.8),
      'paleta: dessaturado (cinza)': fil('saturate(0)').toDataURL('image/webp', 0.8),
      'paleta: NEGATIVO (invert)': fil('invert(1)').toDataURL('image/webp', 0.8),
      'paleta: matiz +180°': fil('hue-rotate(180deg)').toDataURL('image/webp', 0.8),
      'paleta: sépia': fil('sepia(1)').toDataURL('image/webp', 0.8),
      'desfocado 1,5px': fil('blur(1.5px)').toDataURL('image/webp', 0.8),
      'esticado 1,35× na horizontal': (function () { const r = document.createElement('canvas'); r.width = Math.round(w * 1.35); r.height = h; r.getContext('2d').drawImage(c, 0, 0, r.width, r.height); return r; })().toDataURL('image/webp', 0.8),
      'recomprimido q=0,25': c.toDataURL('image/webp', 0.25),
      'reduzido a 25%': red(0.25).toDataURL('image/webp', 0.8),
      'brilho ×1,25 + espelho': (function () { const r = document.createElement('canvas'); r.width = w; r.height = h; const x = r.getContext('2d'); x.filter = 'brightness(1.25)'; x.translate(w, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return r; })().toDataURL('image/webp', 0.8),
      'brilho ×1,25 + rodado 8°': (function () { const r = document.createElement('canvas'); r.width = w; r.height = h; const x = r.getContext('2d'); x.filter = 'brightness(1.25)'; x.translate(w / 2, h / 2); x.rotate(8 * Math.PI / 180); x.drawImage(c, -w / 2, -h / 2); return r; })().toDataURL('image/webp', 0.8)
    };
    for (const g of [3, 5, 12, 17, 23, 28, 33, 37, 42, 45]) t['rodado ' + g + '°'] = gir(g).toDataURL('image/webp', 0.8);
    if (args.quais) { const o = {}; args.quais.forEach(k => { if (t[k] !== undefined) o[k] = t[k]; }); return o; }
    return t;
  }, { u: uri, quais: quais || null });
}

// Os disfarces que o PORTÃO fabrica a cada execução para se medir contra si mesmo. Três, e
// os três escolhidos por serem os PIORES casos medidos, não os mais fáceis — um controle
// tem de ficar perto da borda para dizer alguma coisa:
//   · `brilho ×1,25` .............. o buraco que a distância crua deixava mais barato (14,0)
//   · `brilho ×1,25 + rodado 8°` .. o TETO dos 35 disfarces nesta assinatura (14,8 de 20)
//   · `NEGATIVO (invert)` ......... o que derrubou a primeira versão dela (media 33,6, acima
//                                   do piso legítimo, e foi por ele que o banco ganhou o −z)
// Ângulo exato do banco (45°, 90°) seria controle fraco: cai em 1,4 porque está no banco.
const CONTROLE = ['paleta: brilho ×1,25', 'brilho ×1,25 + rodado 8°', 'paleta: NEGATIVO (invert)'];

module.exports = { N, ESC, LIMIAR_INV, ANGULOS, CONTROLE, instalar, lumas, vetor, diedro, negar, banco, distancia, receitas };
