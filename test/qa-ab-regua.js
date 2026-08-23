// QA — A/B DA ESPERA DA `regua-larga` (23/08, auditoria do ramo a0db28de).
//
// Roda N pares: a régua deste ramo (espera de ESTADO) e a mesma régua com a espera ANTIGA de
// volta (1400 ms de relógio, gerada por `qa-fazer-regua-velha.js`), e compara exit code E
// saída linha a linha. É o único jeito de responder se a espera nova mudou algum número que
// o portão julga, em vez de só mudar quando ele olha.
//
//   node test/qa-fazer-regua-velha.js && node test/qa-ab-regua.js 3
const { spawn } = require('child_process');
const path = require('path');
const RAIZ = path.resolve(__dirname, '..');
const N = Number(process.argv[2] || 3);

function roda(arq) {
  return new Promise(res => {
    const t0 = Date.now();
    const p = spawn(process.execPath, [arq], { cwd: RAIZ });
    let out = '';
    p.stdout.on('data', d => out += d); p.stderr.on('data', d => out += d);
    p.on('close', code => res({ code, out, s: ((Date.now() - t0) / 1000).toFixed(1) }));
  });
}
const limpa = s => s.split('\n').filter(l => l.trim() && !/ja esta servindo/.test(l)).map(l => l.trim());

(async () => {
  let divergentes = 0;
  for (let i = 1; i <= N; i++) {
    const v = await roda('test/tmp-regua-velha.js');
    const n = await roda('test/regua-larga.js');
    const lv = limpa(v.out), ln = limpa(n.out);
    const igual = lv.length === ln.length && lv.every((l, k) => l === ln[k]);
    if (!igual) divergentes++;
    console.log('par ' + i + ': velha exit ' + v.code + ' (' + v.s + 's) | nova exit ' + n.code
      + ' (' + n.s + 's) | saida ' + (igual ? 'IDENTICA' : 'DIFERENTE'));
    if (!igual) {
      const m = Math.max(lv.length, ln.length);
      for (let k = 0; k < m; k++) if (lv[k] !== ln[k]) {
        console.log('    velha> ' + (lv[k] || '(sem linha)'));
        console.log('    nova > ' + (ln[k] || '(sem linha)'));
      }
    }
  }
  console.log('RESULTADO: ' + divergentes + ' pares divergentes em ' + N);
  process.exit(0);
})();
