// SONDA DO QA (lote-0903) — mede se as cobrancas NOVAS da entrega `vercel-valor-e-topo` mordem
// de verdade, e se elas deixam passar o que e LEGITIMO. Casos escritos por mim, nao copiados
// do harness do autor: o harness dele foi calibrado pelo mesmo raciocinio que escreveu o
// conserto (EQUIPE.md 3.1 item 3).
//
//   node test/qa-lote-0903-mordidas-entrega-a.js
//
// Cada caso diz o portao que deve morde-lo e o exit esperado. Controle = exit 0 exigido.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const ARQ = path.join(RAIZ, 'vercel.json');
const ORIGINAL = fs.readFileSync(ARQ, 'utf8');
const PRELOAD = path.join(__dirname, 'qa-vercel-injecao.js');
const INJETADO = path.join(os.tmpdir(), 'qa-lote0903.' + process.pid + '.json');

const BUILD = path.join(RAIZ, 'ferramentas', 'construir.js');
const CAB = path.join(__dirname, 'qa-csp-cabecalhos.js');

function com(mudar) {
  const v = JSON.parse(ORIGINAL);
  mudar(v);
  return JSON.stringify(v, null, 2) + '\n';
}
function referrer(fonte, valor) {
  return com(function (v) {
    const r = v.headers.find(function (x) { return String(x.source) === fonte; });
    const h = r.headers.find(function (x) { return x.key === 'Referrer-Policy'; });
    if (!h) throw new Error(fonte + ' nao declara Referrer-Policy');
    h.value = valor;
  });
}

const CASOS = [
  // ---- familia TOPO: chave A MAIS ----
  { n: 'topo+ redirects externo', p: BUILD, esperado: 1,
    t: () => com(v => { v.redirects = [{ source: '/glossario/(.*)', destination: 'https://exfil.example.com/:path*', permanent: false }]; }) },
  { n: 'topo+ rewrites', p: BUILD, esperado: 1,
    t: () => com(v => { v.rewrites = [{ source: '/glossario/(.*)', destination: 'https://exfil.example.com/:path*' }]; }) },
  { n: 'topo+ routes (legado: desliga headers)', p: BUILD, esperado: 1,
    t: () => com(v => { v.routes = [{ src: '/(.*)', dest: '/index.html' }]; }) },
  { n: 'topo+ cleanUrls', p: BUILD, esperado: 1, t: () => com(v => { v.cleanUrls = true; }) },
  { n: 'topo+ public', p: BUILD, esperado: 1, t: () => com(v => { v.public = true; }) },
  // ---- familia TOPO: chave A MENOS ----
  { n: 'topo- sem outputDirectory', p: BUILD, esperado: 1, t: () => com(v => { delete v.outputDirectory; }) },
  { n: 'topo- sem trailingSlash', p: BUILD, esperado: 1, t: () => com(v => { delete v.trailingSlash; }) },
  { n: 'topo- sem $schema', p: BUILD, esperado: 1, t: () => com(v => { delete v['$schema']; }) },
  { n: 'topo- sem framework', p: BUILD, esperado: 1, t: () => com(v => { delete v.framework; }) },
  // ---- familia TOPO: VALOR ----
  { n: 'topoV outputDirectory "."', p: BUILD, esperado: 1, t: () => com(v => { v.outputDirectory = '.'; }) },
  { n: 'topoV buildCommand trocado', p: BUILD, esperado: 1, t: () => com(v => { v.buildCommand = 'cat /etc/passwd'; }) },
  { n: 'topoV framework nextjs', p: BUILD, esperado: 1, t: () => com(v => { v.framework = 'nextjs'; }) },
  { n: 'topoV trailingSlash false', p: BUILD, esperado: 1, t: () => com(v => { v.trailingSlash = false; }) },
  { n: 'topoV $schema outro dominio', p: BUILD, esperado: 1, t: () => com(v => { v['$schema'] = 'https://exfil.example.com/vercel.json'; }) },
  // ---- familia VALOR de cabecalho permitido ----
  { n: 'ref unsafe-url', p: CAB, esperado: 1, t: () => referrer('/glossario/(.*)', 'unsafe-url') },
  { n: 'ref vazio', p: CAB, esperado: 1, t: () => referrer('/glossario/(.*)', '') },
  { n: 'ref origin', p: CAB, esperado: 1, t: () => referrer('/glossario/(.*)', 'origin') },
  { n: 'ref no-referrer-when-downgrade', p: CAB, esperado: 1, t: () => referrer('/glossario/(.*)', 'no-referrer-when-downgrade') },
  { n: 'ref same-origin', p: CAB, esperado: 1, t: () => referrer('/glossario/(.*)', 'same-origin') },
  // ---- CONTROLES: tem de sair 0 ----
  { c: true, n: '(C) ref no-referrer no glossario', p: CAB, esperado: 0, t: () => referrer('/glossario/(.*)', 'no-referrer') },
  { c: true, n: '(C) ref strict-origin no /mesa', p: CAB, esperado: 0, t: () => referrer('/mesa', 'strict-origin-when-cross-origin') },
  { c: true, n: '(C) arquivo limpo x cabecalhos', p: CAB, esperado: 0, t: () => ORIGINAL },
  { c: true, n: '(C) arquivo limpo x build', p: BUILD, esperado: 0, t: () => ORIGINAL },
];

const MARCA = /\[injecao-vercel\] (\d+) leitura\(s\) desviada\(s\)/;
let ruins = 0, semDesvio = 0;
console.log('MORDIDAS DA ENTREGA A — ' + CASOS.length + ' caso(s) (' + CASOS.filter(c => c.c).length + ' controle)\n');
try {
  for (const c of CASOS) {
    fs.writeFileSync(INJETADO, c.t());
    const r = spawnSync(process.execPath, ['-r', PRELOAD, c.p],
      { cwd: RAIZ, encoding: 'utf8', env: Object.assign({}, process.env, { QA_VERCEL_INJETADO: INJETADO }), maxBuffer: 64 * 1024 * 1024 });
    const saida = String(r.stdout || '') + String(r.stderr || '');
    const m = saida.match(MARCA);
    const desvios = m ? Number(m[1]) : null;
    if (desvios === null || desvios < 1) { semDesvio++; }
    const ok = (c.esperado === 0) ? (r.status === 0) : (r.status !== 0);
    if (!ok) ruins++;
    console.log((ok ? '  ok  ' : '  X   ') + c.n.padEnd(38)
      + path.basename(c.p).padEnd(22) + 'exit ' + r.status
      + '  (esperado ' + (c.esperado === 0 ? '0' : '!=0') + ', desvios ' + desvios + ')');
  }
} finally { if (fs.existsSync(INJETADO)) fs.unlinkSync(INJETADO); }

console.log('');
if (fs.readFileSync(ARQ, 'utf8') !== ORIGINAL) {
  console.error('FALHA: o vercel.json da raiz mudou durante esta execucao.'); process.exit(1);
}
if (semDesvio) { console.error('FALHA DE DESVIO em ' + semDesvio + ' execucao(oes).'); process.exit(1); }
if (ruins) { console.error('FALHA: ' + ruins + ' caso(s) fora do esperado.'); process.exit(1); }
console.log('ok — todas as mordidas mordem e todos os controles passam.');
process.exit(0);
