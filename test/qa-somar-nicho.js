// QA — soma o A/B do `nicho-antes-depois.js` de VÁRIOS processos em paralelo (23/08,
// auditoria do ramo a0db28de). A entrega mediu 4,0% (relógio) contra 0% (estado) em 176
// leituras; isto refaz a conta com bancada própria, porque sonda do autor foi calibrada pelo
// mesmo raciocínio que escreveu o conserto (EQUIPE.md §3.1.3).
//
//   node test/carga.js 8 900 &
//   node test/qa-somar-nicho.js <processos> <rodadas por processo>
const { spawn } = require('child_process');
const path = require('path');
const RAIZ = path.resolve(__dirname, '..');
const P = Number(process.argv[2] || 5);
const N = Number(process.argv[3] || 6);

function roda(i) {
  return new Promise(res => {
    const p = spawn(process.execPath, ['test/nicho-antes-depois.js', String(N)], { cwd: RAIZ });
    let out = '';
    p.stdout.on('data', d => out += d); p.stderr.on('data', d => out += d);
    p.on('close', code => {
      const g = (re) => { const m = out.match(re); return m ? Number(m[1]) : null; };
      const a = g(/A\s+400 ms de rel[oó]gio\s+->\s+(\d+) falhas/);
      const b = g(/B\s+esperando o estado\s+->\s+(\d+) falhas/);
      const ctrl = out.match(/acusou a barra fora da tela em (\d+) de (\d+)/);
      console.log('  proc ' + i + ': exit ' + code + ' | A ' + a + '/' + N + ' | B ' + b + '/' + N
        + ' | controle ' + (ctrl ? ctrl[1] + '/' + ctrl[2] : '?'));
      res({ code, a, b, ca: ctrl ? Number(ctrl[1]) : 0, cb: ctrl ? Number(ctrl[2]) : 0 });
    });
  });
}

(async () => {
  console.log(P + ' processos x ' + N + ' rodadas, em paralelo');
  const r = await Promise.all(Array.from({ length: P }, (_, i) => roda(i + 1)));
  const somaA = r.reduce((s, x) => s + (x.a || 0), 0);
  const somaB = r.reduce((s, x) => s + (x.b || 0), 0);
  const tot = P * N;
  const ca = r.reduce((s, x) => s + x.ca, 0), cb = r.reduce((s, x) => s + x.cb, 0);
  const pct = n => (100 * n / tot).toFixed(1) + '%';
  console.log('\nSOMA em ' + tot + ' rodadas:');
  console.log('  A  400 ms de relogio  -> ' + somaA + ' falhas (' + pct(somaA) + ')');
  console.log('  B  esperando o estado -> ' + somaB + ' falhas (' + pct(somaB) + ')');
  console.log('  CONTROLE 2.8 (a zero ms a assercao acusa a barra fora): ' + ca + ' de ' + cb);
  process.exit(0);
})();
