// QA — CAÇA À INTERMITÊNCIA DO `fila-auth.js` (23/08, auditoria do ramo a0db28de).
//
// A entrega deixou o `fila-auth.js` (23 relógios, portão do CI) sem tocar, com o argumento de
// ter medido 0 falhas em 6 processos sob carga. Seis é pouco: na minha primeira bancada ele
// caiu 1 vez em 3. Este runner roda N vezes EM FILA (paralelo não serve: as cenas 23/24
// escrevem `test/tmp-pin-local-*.txt` com nome FIXO e duas cópias se atropelam), guarda o log
// inteiro de cada rodada e imprime a linha `FALHOU` de quem cair — que é o que falta para
// consertar em vez de adivinhar (a lição 2.9).
//
//   node test/carga.js 8 1200 &
//   node test/qa-caca-fila-auth.js 10
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const RAIZ = path.resolve(__dirname, '..');
const N = Number(process.argv[2] || 10);
const SAIDA = path.join(__dirname, 'tmp-caca-fila');

if (!fs.existsSync(SAIDA)) fs.mkdirSync(SAIDA, { recursive: true });

function roda(i) {
  return new Promise(res => {
    const t0 = Date.now();
    const p = spawn(process.execPath, ['test/fila-auth.js'], { cwd: RAIZ });
    let out = '';
    p.stdout.on('data', d => out += d); p.stderr.on('data', d => out += d);
    p.on('close', code => {
      fs.writeFileSync(path.join(SAIDA, 'rodada-' + i + '.log'), out);
      const falhou = out.split('\n').filter(l => /FALHOU|REPROVOU|TimeoutError/.test(l)).map(l => l.trim());
      console.log('  rodada ' + i + ': exit ' + code + ' | ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'
        + (falhou.length ? '  <<< CAIU' : ''));
      falhou.slice(0, 6).forEach(l => console.log('      ' + l));
      res(code);
    });
  });
}

(async () => {
  const codes = [];
  for (let i = 1; i <= N; i++) codes.push(await roda(i));
  const maus = codes.filter(c => c !== 0).length;
  console.log('RESULTADO: ' + maus + ' falhas em ' + N + ' (logs em ' + SAIDA + ')');
  process.exit(0);
})();
