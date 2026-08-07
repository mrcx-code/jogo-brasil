// ESCOLHE O CICLO DE UMA FOLHA DE CORRIDA, com número em vez de olho.
//
// O problema que ela resolve: uma folha gerada é um SACO DE POSES, não um ciclo (test/LEIAME.md).
// Na caminhada dá para escolher no olho porque sobram três fases; numa corrida de 7 ou 8 poses
// não dá, e a régua do calcanhar sozinha não fecha o laço — na fase de voo nenhum pé marca o
// chão, então o percurso do calcanhar mede só a parte apoiada da passada.
//
// A conta, em duas réguas independentes:
//
//   1. O COMPRIMENTO DA PASSADA vem do VÃO DOS PÉS, que sobrevive ao voo. A caminhada do mesmo
//      capítulo é a referência: ela tem laço medido e no jogo, e as duas folhas são desenhadas
//      na MESMA escala de mundo (o motor usa `44 / altura do quadro de caminhada` para as duas),
//      então os px de sprite de uma valem os da outra.
//         passoCorrida = lacoCaminhada x (vaoCorrida / vaoCaminhada)
//   2. O NÚMERO DE QUADROS e a ORDEM saem de minimizar o ESCORREGAMENTO: escolhido o ciclo, o
//      mundo anda `passada / n` por quadro, sempre igual, e o calcanhar do pé apoiado tem de
//      recuar exatamente isso. Tudo que sobra é sola arrastando.
//
// A ordem candidata de um subconjunto é UMA só e não se chuta: as poses de APOIO entram em
// calcanhar decrescente (é o que um pé plantado faz), e as de VOO vão para o fim, depois da
// saída do pé. Sobra varrer os subconjuntos, que são poucos.
//
// uso: ciclo-corrida.js <corrida.json> <caminhada@src/jogo.ts> [--chao=8] [--min=4] [--max=8]
const fs = require('fs');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const pos = args.filter(a => !a.startsWith('--'));
const CHAO = (args.find(a => a.startsWith('--chao=')) || '--chao=8');
const NMIN = parseInt((args.find(a => a.startsWith('--min=')) || '--min=4').slice(6), 10);
const NMAX = parseInt((args.find(a => a.startsWith('--max=')) || '--max=8').slice(6), 10);
if (pos.length < 2) { console.error('uso: ciclo-corrida.js <corrida.json> <caminhada@arq> [--chao=8]'); process.exit(1); }

// Reusa o medir-sola.js como biblioteca de medida, lendo a saída dele: uma régua só no
// repositório, e nenhuma chance de duas ferramentas divergirem no limiar de alfa ou de chão.
function medir(alvo, chao) {
  const txt = execFileSync(process.execPath, ['test/medir-sola.js', alvo, chao], { encoding: 'utf8' });
  const linhas = txt.split('\n');
  const q = [];
  for (const l of linhas) {
    const m = /^\s+(\d+)\s+(\d+)x(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(.+?)\s+(\d+)\s+([\d,]+)%\s*$/.exec(l);
    if (!m) continue;
    const pes = m[7].includes('no ar') ? [] : m[7].trim().split(/\s+/).map(s => {
      const [a, b] = s.split('..'); return { x0: +a, x1: +b };
    });
    q.push({ i: +m[1], levanta: +m[6], pes, vao: +m[8] });
  }
  const hm = /quadros de (\d+)x(\d+)/.exec(txt);
  return { quadros: q, H: hm ? +hm[2] : 0, vaoMax: Math.max(...q.map(x => x.vao)) };
}

const R = medir(pos[0], CHAO);
const C = medir(pos[1], '--chao=2');

// laço da caminhada: recuo médio das transições internas x número de quadros. Mesma conta que
// produziu os laços 140 / 165 / 150 já gravados no PASSO_CAP.
const recuosCam = [];
for (let i = 0; i + 1 < C.quadros.length; i++) {
  let melhor = null;
  for (const a of C.quadros[i].pes) for (const b of C.quadros[i + 1].pes) {
    const r = a.x0 - b.x0; if (r > 0 && (melhor === null || r < melhor)) melhor = r;
  }
  if (melhor !== null) recuosCam.push(melhor);
}
const lacoCam = recuosCam.length
  ? recuosCam.reduce((a, x) => a + x, 0) / recuosCam.length * C.quadros.length : 0;

const passada = lacoCam * R.vaoMax / C.vaoMax;   // em px de sprite, os dois na mesma escala
const f1 = (x) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
const f2 = (x) => (Math.round(x * 100) / 100).toFixed(2).replace('.', ',');

console.log('\nCAMINHADA ' + pos[1]);
console.log('  laco medido ......... ' + f1(lacoCam) + ' px de sprite em ' + C.quadros.length + ' quadros' +
  '   (recuos ' + recuosCam.join('/') + ')');
console.log('  vao dos pes maximo .. ' + C.vaoMax);
console.log('\nCORRIDA ' + pos[0] + '   ' + R.quadros.length + ' poses, quadro de ' + R.H + ' px');
console.log('  vao dos pes maximo .. ' + R.vaoMax + '   -> passada = ' + f1(lacoCam) + ' x ' +
  R.vaoMax + '/' + C.vaoMax + ' = ' + f1(passada) + ' px de sprite');

// varredura dos subconjuntos
const N = R.quadros.length;
let melhor = null;
for (let mask = 1; mask < (1 << N); mask++) {
  const sel = [];
  for (let i = 0; i < N; i++) if (mask & (1 << i)) sel.push(R.quadros[i]);
  if (sel.length < NMIN || sel.length > NMAX) continue;
  const voo = sel.filter(q => !q.pes.length);
  const apoio = sel.filter(q => q.pes.length);
  if (!voo.length) continue;                 // sem voo não é corrida, é caminhada apressada
  if (apoio.length < 2) continue;            // sem dois apoios não há recuo para medir
  // ordem: apoios em calcanhar decrescente, voos no fim (depois da saída do pé)
  apoio.sort((a, b) => b.pes[0].x0 - a.pes[0].x0);
  const ordem = apoio.concat(voo);
  const p = passada / ordem.length;
  // ESCORREGAMENTO, na definição da casa (a que produziu 0,48% / 0,00% / 0,67% para as três
  // caminhadas, e está escrita no comentário do PASSO_CAP): o MAIOR recuo fora do passo,
  // sobre a PASSADA inteira. Ou seja, o maior deslize de um único quadro medido contra o
  // passo todo, e não contra o passo de um quadro — é por isso que ela dá décimos e não
  // unidades. Só as transições de APOIO entram: na fase de voo não há sola para arrastar.
  const err = [];
  for (let i = 0; i + 1 < apoio.length; i++) {
    const r = apoio[i].pes[0].x0 - apoio[i + 1].pes[0].x0;
    err.push(Math.abs(r - p));
  }
  const esc = 100 * Math.max(...err) / passada;
  if (!melhor || esc < melhor.esc) melhor = { esc, ordem, p, apoio: apoio.length, voo: voo.length };
}

if (!melhor) { console.log('\n  nenhum ciclo candidato (falta pose de voo ou de apoio)'); process.exit(0); }
console.log('\nMELHOR CICLO');
console.log('  quadros ............. ' + melhor.ordem.map(q => q.i).join(' -> ') +
  '   (' + melhor.apoio + ' de apoio, ' + melhor.voo + ' de voo)');
console.log('  PASSO por quadro .... ' + f2(melhor.p) + ' px de sprite');
console.log('  ESCORREGAMENTO ...... ' + f2(melhor.esc) + '%');
console.log('  recuos vs passo ..... ' + melhor.ordem.filter(q => q.pes.length).map(q => q.pes[0].x0).join('/') +
  '  contra ' + f1(melhor.p) + ' por quadro');
console.log('');
