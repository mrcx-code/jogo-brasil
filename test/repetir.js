// REPETIR — roda o mesmo instrumento N vezes e conta EXIT CODES de verdade.
//
// POR QUE EXISTE (22/08). "Caiu hoje" não distingue regressão de intermitência, e quase todo
// flake deste repositório é o mesmo bicho: o instrumento amostra o RELÓGIO e a máquina sob
// carga chega atrasada. Este runner responde a pergunta que decide — "cai sempre ou cai às
// vezes?" — em série CALMA e em PARALELO (que é a carga do funil e a de vários agentes
// tocando ao mesmo tempo). Sem esse par de números, consertar é adivinhar.
//
// Ele lê o exit code do processo filho, nunca a saída — EQUIPE.md, "rode o portão por exit
// code" — e só imprime o rabo do log quando o filho sai diferente de zero.
//
// node test/repetir.js <script> <n> [paralelo]
//   paralelo = 1 dispara todos de uma vez (carga na maquina); 0 roda em fila.
//
// MEDIDO em 22/08 com o `nicho-sob-carga.js`: 0 falhas em 8 rodadas em fila calma, 14 em 50
// com cinco processos em paralelo (28%). Mesmo build, zero mudança de código entre elas.
const { spawn } = require('child_process');
const path = require('path');

const ALVO = process.argv[2];
const N = Number(process.argv[3] || 3);
const PAR = process.argv[4] === '1';
const RAIZ = path.resolve(__dirname, '..');

function roda(i) {
  return new Promise(res => {
    const t0 = Date.now();
    const p = spawn(process.execPath, [ALVO], { cwd: RAIZ });
    let out = '';
    p.stdout.on('data', d => out += d);
    p.stderr.on('data', d => out += d);
    p.on('close', code => {
      const crash = /Target crashed/.test(out);
      const explodiu = /EXPLODIU/.test(out);
      console.log('  rodada ' + i + ': exit ' + code + ' | ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s' +
        (crash ? ' | TARGET CRASHED' : '') + (explodiu ? ' | EXPLODIU' : ''));
      if (code !== 0) {
        const l = out.trim().split('\n').slice(-6).join('\n      ');
        console.log('      ' + l);
      }
      res(code);
    });
  });
}

(async () => {
  console.log(ALVO + ' x' + N + (PAR ? ' EM PARALELO' : ' em fila'));
  let codes = [];
  if (PAR) codes = await Promise.all(Array.from({ length: N }, (_, i) => roda(i + 1)));
  else for (let i = 0; i < N; i++) codes.push(await roda(i + 1));
  const maus = codes.filter(c => c !== 0).length;
  console.log('RESULTADO: ' + maus + ' falhas em ' + N + ' rodadas (exit codes: ' + codes.join(',') + ')');
  process.exit(0);
})();
