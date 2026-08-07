// A RÉGUA QUE ESCOLHE QUADRO E MEDE O PASSO. Reconstruída: a de 2026-08-06 morava em `tmpart/`
// e não foi commitada, e o NOTES.md cita os números dela — sem a ferramenta, "≤ o da caminhada"
// vira lembrança em vez de comparação. Esta versão volta commitada.
//
// O QUE ELA MEDE, E POR QUÊ CADA COISA
//
// · CONTATO pela LINHA DE CHÃO do quadro, não pela tinta mais baixa da figura. Numa folha
//   cortada com compressão 1 a borda de baixo do quadro É o chão comum (`baseComum` do
//   recortador), e a personagem no ar tem a tinta mais baixa acima dela. Medir "a 2 px da
//   tinta mais baixa da própria pose" acha uma sola até numa pose de voo, e foi assim que a
//   corrida do capítulo 2 de 2026-08-06 pareceu ter apoio que não tinha.
// · A sola vem em GRUPOS. Andando há um pé; correndo, no apoio duplo, há dois, e a borda
//   esquerda do conjunto salta de um pé para o outro. Agrupar separa o que é um pé do que é
//   o outro, e o calcanhar de cada grupo é o marco.
// · CALCANHAR = borda esquerda do grupo. Com o pé plantado ele anda para TRÁS exatamente
//   tanto quanto o mundo anda para a frente. O jogo escolhe o quadro pela distância, então o
//   mundo anda `passo` por quadro, sempre igual: se dois recuos consecutivos diferem, a sola
//   arrasta essa diferença. É essa diferença que aqui se chama ESCORREGAMENTO.
// · ABERTURA = distância entre o pé da frente e o de trás na pose de maior abertura. É a
//   segunda régua do passo, e a única que sobrevive a uma corrida — na fase de voo não há
//   segundo pé no chão, então o recuo do calcanhar não fecha o laço sozinho (NOTES 2026-08-04
//   já registrava isso: "a da corrida é derivada, não medida"). Aqui as duas são medidas e
//   comparadas, em vez de uma ser assumida.
// · LEVANTAMENTO = quantos px a tinta mais baixa está acima da linha de chão. É o que diz se
//   os DOIS pés saíram do chão, que é a diferença entre correr e andar depressa.
// · DISCORDÂNCIA de silhueta da metade de baixo entre quadros vizinhos: duas poses que
//   discordam pouco são a mesma fase desenhada duas vezes, e enfiar as duas no ciclo faz o pé
//   parar num quadro e saltar no seguinte.
//
// uso: medir-sola.js <arquivo.json | bloco@src/jogo.ts> [--ciclo=a,b,c] [--alvo=44] [--chao=N]
//   --chao é a tolerância, em px de sprite, do que conta como "encostando". 2 na caminhada,
//   onde a folha é chapada; 8 numa corrida, porque o desnível de 4 a 7 px entre poses de apoio
//   é a jitter com que o modelo desenhou as figuras na folha, não intenção — o voo de verdade
//   mede 25 a 79. Confundir os dois faz uma pose de apoio contar como voo e o passo sumir.
const fs = require('fs');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const ALVO = args.find(a => !a.startsWith('--'));
const CICLO = (args.find(a => a.startsWith('--ciclo=')) || '').slice(8);
const ALTURA_MUNDO = parseFloat((args.find(a => a.startsWith("--alvo=")) || "--alvo=44").slice(7));
const TOL_CHAO = parseFloat((args.find(a => a.startsWith("--chao=")) || "--chao=2").slice(7));
if (!ALVO) { console.error('uso: medir-sola.js <arquivo.json | bloco@src/jogo.ts> [--ciclo=a,b,c]'); process.exit(1); }

// Ler um bloco do HERO_B64 direto da fonte, para medir exatamente os bytes que o jogo usa.
function lerBloco(nome, arq) {
  const txt = fs.readFileSync(arq, 'utf8');
  const i = txt.indexOf('\n  ' + nome + ': [');
  if (i < 0) throw new Error('bloco ' + nome + ' nao achado em ' + arq);
  const j = txt.indexOf('\n  ]', i);
  const fr = txt.slice(i, j).match(/"data:image\/webp;base64,[^"]+"/g) || [];
  return fr.map(s => ({ b64: JSON.parse(s) }));
}

let frames;
if (ALVO.includes('@')) { const [n, a] = ALVO.split('@'); frames = lerBloco(n, a); }
else frames = JSON.parse(fs.readFileSync(ALVO, 'utf8')).frames;
if (!frames.length) { console.error('bloco vazio'); process.exit(1); }

const f1 = (x) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
const f2 = (x) => (Math.round(x * 100) / 100).toFixed(2).replace('.', ',');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const M = await p.evaluate(async (arg) => {
    const fr = arg.fr, CHAO = arg.CHAO;
    const imgs = await Promise.all(fr.map(f => new Promise((r, j) => {
      const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = f.b64;
    })));
    const W = imgs[0].naturalWidth, H = imgs[0].naturalHeight;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });
    const VAO = 12;      // px de intervalo que separa um pé do outro
    const sils = [];
    const out = imgs.map(im => {
      g.clearRect(0, 0, W, H); g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, W, H).data;
      const op = (x, y) => d[(y * W + x) * 4 + 3] >= 128;   // alfa 128, o limiar da casa
      let x0 = W, x1 = -1, y0 = H, y1 = -1, area = 0;
      const baixo = new Int32Array(W).fill(-1);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (op(x, y)) {
        area++;
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
        if (y > baixo[x]) baixo[x] = y;
      }
      // contato: colunas que encostam na LINHA DE CHÃO DO QUADRO (borda de baixo)
      const toca = [];
      for (let x = 0; x < W; x++) if (baixo[x] >= H - 1 - CHAO) toca.push(x);
      // agrupa em pés: um vão de VAO px separa um pé do outro
      const pes = [];
      for (const x of toca) {
        const u = pes[pes.length - 1];
        if (u && x - u.x1 <= VAO) { u.x1 = x; u.n++; } else pes.push({ x0: x, x1: x, n: 1 });
      }
      // abertura: da borda esquerda do pé mais atrás à borda direita do mais à frente, mas só
      // quando são DOIS pés — com um pé só a medida seria o comprimento do próprio pé.
      const abertura = pes.length >= 2 ? pes[pes.length - 1].x1 - pes[0].x0 : 0;
      // CABEÇA: maior trecho SEM buraco no quinto superior. É a régua de escala entre folhas
      // (a única medida que não muda com a pose) e é a "corrida" do validar-folha.js, imune a
      // objeto erguido ao lado da cabeça. Numa corrida o cabelo VOA e entra no quinto superior,
      // então a mediana entre quadros vale mais que a média — um quadro de cabelo esticado
      // infla a média e encolheria a personagem inteira na reamostragem.
      let cab = 0;
      const ateT = y0 + Math.round((y1 - y0) * 0.2);
      for (let y = y0; y <= ateT; y++) {
        let run = 0;
        for (let x = 0; x < W; x++) { if (op(x, y)) { run++; if (run > cab) cab = run; } else run = 0; }
      }
      // ABERTURA DOS PÉS: vão de tinta na faixa dos pés (15% de baixo da figura), com os dois
      // pés no chão ou não. É a régua do comprimento da passada que sobrevive a uma corrida —
      // na fase de voo não há segundo pé no chão, mas há segundo pé.
      const deY = y1 - Math.round((y1 - y0) * 0.15);
      let px0 = -1, px1 = -1;
      for (let y = deY; y <= y1; y++) for (let x = 0; x < W; x++) if (op(x, y)) { if (px0 < 0 || x < px0) px0 = x; if (x > px1) px1 = x; }
      const vaoPes = px1 >= 0 ? px1 - px0 + 1 : 0;
      const meio = Math.round((y0 + y1) / 2);
      const sil = new Uint8Array(W * Math.max(1, y1 - meio + 1));
      for (let y = meio; y <= y1; y++) for (let x = 0; x < W; x++) if (op(x, y)) sil[(y - meio) * W + x] = 1;
      sils.push(sil);
      return { larg: x1 - x0 + 1, alt: y1 - y0 + 1, area, levanta: (H - 1) - y1, pes, abertura, cab, vaoPes, toca: toca.length };
    });
    const disc = [];
    for (let i = 0; i < sils.length; i++) {
      const a = sils[i], b2 = sils[(i + 1) % sils.length];
      const n = Math.min(a.length, b2.length);
      let x = 0, u = 0;
      for (let k = 0; k < n; k++) { if (a[k] !== b2[k]) x++; if (a[k] || b2[k]) u++; }
      disc.push(u ? 100 * x / u : 0);
    }
    return { W, H, out, disc };
  }, { fr: frames, CHAO: TOL_CHAO });
  await b.close();

  const esc = ALTURA_MUNDO / M.H;      // sprite px -> world px: a mesma conta do heroScale
  console.log('\n' + ALVO + '   ' + frames.length + ' quadros de ' + M.W + 'x' + M.H +
    '   (1 px de sprite = ' + f2(esc) + ' px de mundo)');
  console.log('\n   #   caixa      area  cabeca  levanta  pes no chao (calcanhar..ponta)   vao dos pes  disc');
  M.out.forEach((q, i) => {
    const ps = q.pes.length ? q.pes.map(f => f.x0 + '..' + f.x1).join('  ') : '— no ar —';
    console.log('  ' + String(i + 1).padStart(2) + '  ' + (q.larg + 'x' + q.alt).padStart(8) +
      String(q.area).padStart(8) + String(q.cab).padStart(8) + String(q.levanta).padStart(8) + '  ' + ps.padEnd(30) +
      String(q.vaoPes).padStart(8) + f1(M.disc[i]).padStart(9) + '%');
  });
  const mediana = (v) => { const s = v.slice().sort((a, b) => a - b); const k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
  const cabs = M.out.map(q => q.cab);
  console.log('\n  cabeca .............. mediana ' + f1(mediana(cabs)) + '  media ' + f1(cabs.reduce((a, x) => a + x, 0) / cabs.length) +
    '  min ' + Math.min(...cabs) + '  max ' + Math.max(...cabs) + '   (a MEDIANA e a regua: o cabelo voa)');
  const vaoMax = Math.max(...M.out.map(q => q.vaoPes));
  console.log('  vao dos pes maximo .. ' + vaoMax + ' px de sprite = ' + f1(vaoMax * esc) + ' px de mundo');
  console.log('  quadros no ar ....... ' + M.out.filter(q => !q.pes.length).length + ' de ' + M.out.length +
    '   (nenhum pe a menos de ' + TOL_CHAO + ' px da linha de chao)');

  if (CICLO) {
    const idx = CICLO.split(',').map(s => parseInt(s, 10) - 1);
    const q = idx.map(i => M.out[i]);
    console.log('\nCICLO ' + idx.map(i => i + 1).join(' -> ') + '  (' + idx.length + ' quadros)');
    // O calcanhar do pé plantado recua. Entre dois quadros vizinhos, o par de pés cujo
    // calcanhar RECUOU (x diminuiu) sem trocar de pé é o par que mede o passo: procura-se o
    // menor recuo POSITIVO entre qualquer pé do quadro i e qualquer pé do quadro i+1, que é o
    // mesmo pé seguindo em frente. Um salto grande é troca de pé, e é descartado.
    // A COSTURA DO CICLO (último -> primeiro) fica FORA da estatística: é a única transição em
    // que os dois quadros pertencem a passadas diferentes, e nenhum critério de imagem sabe
    // dizer se o pé do quadro 1 é o mesmo do último. Medida na caminhada do capítulo 1 ela
    // devolve 16 px contra os 47 das transições internas — não é escorregamento, é o pareamento
    // errado. O laço continua sendo recuo médio x n, que é assumir que a costura se comporta
    // como o resto; foi essa a conta que produziu os laços 140 / 165 / 150 já gravados.
    const recuos = [];
    for (let i = 0; i + 1 < idx.length; i++) {
      const a = q[i], b2 = q[i + 1];
      let melhor = null;
      for (const pa of a.pes) for (const pb of b2.pes) {
        const r = pa.x0 - pb.x0;
        if (r > 0 && (melhor === null || r < melhor)) melhor = r;
      }
      recuos.push(melhor);
    }
    console.log('  recuo do calcanhar .. ' + recuos.map(r => r === null ? '—' : String(r)).join(' / '));
    const val = recuos.filter(r => r !== null);
    const med = val.length ? val.reduce((a, x) => a + x, 0) / val.length : 0;
    console.log('  recuo medio ......... ' + f1(med) + ' px de sprite  (' + val.length + ' de ' +
      idx.length + ' transicoes com o mesmo pe no chao)');
    const escorr = med && val.length > 1
      ? 100 * val.reduce((a, x) => a + Math.abs(x - med), 0) / val.length / med : null;
    console.log('  ESCORREGAMENTO ...... ' + (escorr === null ? 'nao mensuravel (menos de 2 transicoes)' : f2(escorr) + '%') +
      '   (desvio medio do recuo sobre o recuo medio)');
    const lacoRecuo = med * idx.length;
    console.log('  laco pelo calcanhar . ' + f1(lacoRecuo) + ' px de sprite = ' + f1(lacoRecuo * esc) + ' de mundo');
    console.log('  PASSO por quadro .... ' + f2(lacoRecuo * esc / idx.length) + ' px de mundo');
    const aMax = Math.max(...q.map(x => x.abertura));
    console.log('  abertura no ciclo ... ' + aMax + ' px de sprite = ' + f1(aMax * esc) + ' de mundo');
    console.log('  levantamento ........ ' + q.map(x => x.levanta).join(' / ') + ' px de sprite = ' +
      q.map(x => f1(x.levanta * esc)).join(' / ') + ' de mundo');
  }
  console.log('');
})();
