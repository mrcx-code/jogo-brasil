// AFERIR-REPETIR — o instrumento que mantém o `repetir.js` honesto.
//
// POR QUE EXISTE (23/08, QA). O `repetir.js` virou a régua que decide quais dos ~77 testes
// deste repositório são intermitentes: o número que ele imprime vira a prova, e ninguém
// desconfia de um contador. Contador quebrado é pior que contador nenhum — ele FABRICA
// confiança. Então o contador também precisa de um contador.
//
// Ele afere o `repetir.js` contra alvos de resultado CONHECIDO, criados aqui na hora:
//   · zero    — sai sempre 0, mas o TEXTO grita "EXPLODIU / Target crashed / 4 falhas".
//               Se o repetir contar falha, ele está lendo a saída, e o cabeçalho dele promete
//               o contrário.
//   · um      — sai sempre 1, mas o TEXTO diz "0 falhas, tudo verde". O espelho do de cima.
//   · alterna — sai 1 nas execuções PARES e 0 nas ÍMPARES (contador em arquivo, vale entre
//               processos). A contagem tem de bater EXATAMENTE metade, e a sequência de exit
//               codes tem de bater posição por posição.
//   · lento   — dura ~1,6 s e registra a própria janela. Em paralelo as janelas têm de se
//               SOBREPOR; se a concorrência máxima observada for 1, o modo paralelo enfileira
//               e os números "sob carga" nunca mediram carga nenhuma.
//
// PROVA DE QUE ELE REPROVA (EQUIPE.md 2.8 — instrumento nunca visto reprovando é decoração):
//   AFERIR_DEFEITO=alterna  faz o alvo "alterna" parar de alternar (sai sempre 0).
//   AFERIR_DEFEITO=serie    faz o modo paralelo ser pedido como fila.
//   Nos dois casos este arquivo tem de sair 1. Medido em 23/08: sai.
//
// node test/aferir-repetir.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const OBRA = path.join(__dirname, 'tmp-aferir');
const REPETIR = path.join('test', 'repetir.js');
const DEFEITO = process.env.AFERIR_DEFEITO || '';
let ruim = 0;

function ok(cond, texto, extra) {
  console.log((cond ? '  ok   ' : '  FALHA') + ' ' + texto + (extra ? '  [' + extra + ']' : ''));
  if (!cond) ruim++;
}

function escrever(nome, corpo) {
  const p = path.join(OBRA, nome);
  fs.writeFileSync(p, corpo);
  return path.relative(RAIZ, p).split(path.sep).join('/');
}

function rodar(args) {
  return new Promise(res => {
    const p = spawn(process.execPath, [REPETIR].concat(args), { cwd: RAIZ });
    let out = '';
    p.stdout.on('data', d => out += d);
    p.stderr.on('data', d => out += d);
    p.on('close', code => res({ code, out }));
  });
}

// "RESULTADO: 3 falhas em 10 rodadas (exit codes: 0,1,0,...)"
function ler(out) {
  const m = out.match(/RESULTADO:\s*(\d+)\s+falhas em\s+(\d+)\s+rodadas\s*\(exit codes:\s*([^)]*)\)/);
  if (!m) return null;
  return { falhas: Number(m[1]), n: Number(m[2]), codes: m[3].split(',').map(s => s.trim()) };
}

(async () => {
  fs.rmSync(OBRA, { recursive: true, force: true });
  fs.mkdirSync(OBRA, { recursive: true });

  const zero = escrever('alvo-zero.js', [
    "console.log('RESULTADO: 4 falhas em 4 rodadas');",
    "console.log('EXPLODIU: tudo perdido');",
    "console.log('Target crashed');",
    "console.error('FALHA FALHA FALHA');",
    'process.exit(0);',
  ].join('\n'));

  const um = escrever('alvo-um.js', [
    "console.log('RESULTADO: 0 falhas em 4 rodadas');",
    "console.log('tudo verde');",
    'process.exit(1);',
  ].join('\n'));

  const alterna = escrever('alvo-alterna.js', [
    "const fs = require('fs'), path = require('path');",
    "const arq = path.join(__dirname, 'contador.txt');",
    'let n = 0;',
    "try { n = Number(fs.readFileSync(arq, 'utf8')) || 0; } catch (e) { n = 0; }",
    'n++;',
    'fs.writeFileSync(arq, String(n));',
    DEFEITO === 'alterna'
      ? 'process.exit(0);   // DEFEITO INJETADO: parou de alternar'
      : 'process.exit(n % 2 === 0 ? 1 : 0);',
  ].join('\n'));

  const lento = escrever('alvo-lento.js', [
    "const fs = require('fs'), path = require('path');",
    "const arq = path.join(__dirname, 'janelas.txt');",
    'const t0 = Date.now();',
    "setTimeout(function () { fs.appendFileSync(arq, t0 + ' ' + Date.now() + '\\n'); process.exit(0); }, 1600);",
  ].join('\n'));

  console.log('AFERIR-REPETIR' + (DEFEITO ? '  (COM DEFEITO INJETADO: ' + DEFEITO + ')' : ''));

  // 1. alvo que sempre passa, com texto de catástrofe
  let r = ler((await rodar([zero, '8', '0'])).out);
  ok(!!r, 'o repetir imprime a linha RESULTADO com os exit codes');
  if (r) {
    ok(r.falhas === 0 && r.n === 8, 'alvo sempre-0 com texto de catastrofe: 0 falhas em 8',
      r.falhas + '/' + r.n);
    ok(r.codes.join(',') === '0,0,0,0,0,0,0,0', 'os exit codes vem todos 0', r.codes.join(','));
  }

  // 2. alvo que sempre falha, com texto de sucesso
  r = ler((await rodar([um, '8', '0'])).out);
  ok(r && r.falhas === 8 && r.n === 8, 'alvo sempre-1 com texto de sucesso: 8 falhas em 8',
    r ? r.falhas + '/' + r.n : 'sem linha');

  // 3. alvo que alterna — a contagem E a sequencia
  try { fs.unlinkSync(path.join(OBRA, 'contador.txt')); } catch (e) {}
  r = ler((await rodar([alterna, '10', '0'])).out);
  ok(r && r.falhas === 5, 'alvo que alterna: exatamente 5 falhas em 10',
    r ? String(r.falhas) : 'sem linha');
  ok(r && r.codes.join(',') === '0,1,0,1,0,1,0,1,0,1', 'a sequencia bate posicao por posicao',
    r ? r.codes.join(',') : '-');
  const execucoes = Number(fs.readFileSync(path.join(OBRA, 'contador.txt'), 'utf8'));
  ok(execucoes === 10, 'o alvo foi executado 10 vezes de verdade', String(execucoes));

  // 4. paralelo tem de SOBREPOR
  try { fs.unlinkSync(path.join(OBRA, 'janelas.txt')); } catch (e) {}
  await rodar([lento, '5', DEFEITO === 'serie' ? '0' : '1']);
  const L = fs.readFileSync(path.join(OBRA, 'janelas.txt'), 'utf8').trim().split('\n')
    .map(l => l.split(' ').map(Number));
  const ev = [];
  L.forEach(function (x) { ev.push([x[0], 1]); ev.push([x[1], -1]); });
  ev.sort(function (a, b) { return a[0] - b[0]; });
  let c = 0, mx = 0;
  ev.forEach(function (e) { c += e[1]; if (c > mx) mx = c; });
  ok(L.length === 5, 'os 5 lentos rodaram', String(L.length));
  ok(mx >= 4, 'em paralelo as janelas se sobrepoem (concorrencia maxima >= 4)',
    'observada ' + mx + '/5');

  fs.rmSync(OBRA, { recursive: true, force: true });
  console.log(ruim ? 'REPROVADO: ' + ruim + ' asserçoes falharam' : 'APROVADO: o repetir.js conta exit code, e o paralelo é paralelo');
  process.exit(ruim ? 1 : 0);
})().catch(function (e) { console.error('EXPLODIU:', e); process.exit(2); });
