// CARGA — ocupa a máquina de propósito, para o `repetir.js` medir sob pressão REPRODUTÍVEL.
//
// POR QUE EXISTE (23/08). O `repetir.js` responde "cai sempre ou cai às vezes?", mas o "às
// vezes" depende de quanto a máquina está ocupada NAQUELE minuto — e isso não é controlável
// só disparando cópias do instrumento: um teste de navegador passa a maior parte do tempo
// esperando, então seis deles em paralelo podem deixar quatro núcleos ociosos. Medido em
// 23/08: 6 cópias do `nicho-antes-depois.js` derrubaram a espera de relógio 2 vezes em 48
// (4%), enquanto o QA, num minuto mais cheio, tinha medido 28%. Comparar conserto contra
// defeito com essa variação não prova nada.
//
// Isto queima CPU em N processos por T segundos e sai sozinho. Não é teste, não tem asserção
// e não entra em CI nenhum: é o peso que a gente põe na balança para pesar o instrumento.
//
//   node test/carga.js [n=nucleos] [segundos=120] &
//   node test/repetir.js test/o-instrumento.js 5 1
//
// Sempre em SEGUNDO plano e sempre com prazo: carga sem prazo esquecida na máquina é a
// próxima meia sessão perdida procurando por que tudo ficou lento.
const { fork } = require('child_process');
const os = require('os');

const N = Number(process.argv[2] || os.cpus().length);
const SEG = Number(process.argv[3] || 120);

if (process.env.CARGA_FILHO) {
  const fim = Date.now() + SEG * 1000;
  let x = 0;
  // laço apertado com um respiro mínimo: ocupa o núcleo sem impedir o SO de escalonar nada.
  (function girar() {
    const ate = Date.now() + 50;
    while (Date.now() < ate) { x += Math.sqrt(x + 1) % 7; }
    if (Date.now() < fim) setImmediate(girar); else process.exit(0);
  })();
} else {
  console.log('carga: ' + N + ' processos por ' + SEG + ' s (nucleos da maquina: ' + os.cpus().length + ')');
  const filhos = [];
  for (let i = 0; i < N; i++) {
    filhos.push(fork(__filename, [String(N), String(SEG)], { env: Object.assign({}, process.env, { CARGA_FILHO: '1' }) }));
  }
  let vivos = filhos.length;
  filhos.forEach(f => f.on('exit', () => { if (--vivos === 0) { console.log('carga: fim'); process.exit(0); } }));
}
