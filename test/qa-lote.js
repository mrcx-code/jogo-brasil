// QA — LOTE COM LEITURA, não só com exit code (23/08, auditoria do ramo a0db28de).
//
// O `repetir.js` conta exit codes. Isto conta exit codes E colhe a linha que interessa de
// cada rodada, para responder o que o exit code não responde: quando o portão passou, ele
// passou porque estava VENDO, ou porque estava cego?
//
//   node test/qa-lote.js <script> <n> <paralelo 0|1> [regex-da-linha]
//
// Exemplo: node test/qa-lote.js test/smoke.js 6 1 "resume -> first frame"
const { spawn } = require('child_process');
const path = require('path');

const ALVO = process.argv[2];
const N = Number(process.argv[3] || 3);
const PAR = process.argv[4] === '1';
const RE = process.argv[5] ? new RegExp(process.argv[5]) : null;
const RAIZ = path.resolve(__dirname, '..');

function roda(i) {
  return new Promise(res => {
    const t0 = Date.now();
    const p = spawn(process.execPath, [ALVO], { cwd: RAIZ });
    let out = '';
    p.stdout.on('data', d => out += d);
    p.stderr.on('data', d => out += d);
    p.on('close', code => {
      const linhas = RE ? out.split('\n').filter(l => RE.test(l)).map(l => l.trim()) : [];
      const timeouts = (out.match(/TimeoutError/g) || []).length;
      const crash = /Target crashed/.test(out);
      console.log('  rodada ' + i + ': exit ' + code + ' | ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'
        + (timeouts ? ' | ' + timeouts + 'x TimeoutError' : '') + (crash ? ' | TARGET CRASHED' : ''));
      linhas.forEach(l => console.log('      > ' + l));
      if (code !== 0) console.log('      ' + out.trim().split('\n').slice(-8).join('\n      '));
      res({ code, linhas });
    });
  });
}

(async () => {
  console.log(ALVO + ' x' + N + (PAR ? ' EM PARALELO' : ' em fila'));
  let r = [];
  if (PAR) r = await Promise.all(Array.from({ length: N }, (_, i) => roda(i + 1)));
  else for (let i = 0; i < N; i++) r.push(await roda(i + 1));
  const maus = r.filter(x => x.code !== 0).length;
  console.log('RESULTADO: ' + maus + ' falhas em ' + N + ' (exit: ' + r.map(x => x.code).join(',') + ')');
  process.exit(0);
})();
