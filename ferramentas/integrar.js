// O FUNIL — a integração de worktree deixou de ser cópia manual e memória (21/08, decidido
// pelo dono no caminho A da revisão do Fable).
//
//   node ferramentas/integrar.js <ramo> --placar "<linha da tabela>" [auditorias...]
//
// POR QUE ELE EXISTE, com as cicatrizes numeradas:
//   · A cópia de arquivo quase perdeu o NOTES.md DUAS vezes no mesmo dia (EQUIPE.md 2.10) —
//     aqui a integração é `git merge --no-ff`, que sabe fazer três-vias.
//   · O placar dependia de cada um lembrar (fragilidade 4 da revisão) — aqui SEM `--placar`
//     não há merge, e a linha é pregada no EQUIPE.md §5 no mesmo ato.
//   · A auditoria era por memória (og:image faltou em 4 de 6 páginas por DIAS) — aqui o DIFF
//     decide quem tinha de olhar, e cada papel exigido sai como `--ok-<papel> "nota"` ou
//     `--sem-<papel> "motivo"`: pular fica ESCRITO, nunca silencioso.
//   · Worktrees acumulavam às dezenas (60 em 21/08) — no verde, o worktree e o ramo morrem.
//
// GATILHOS (o diff manda, não a lembrança):
//   página pública  -> growth       (plataforma/, secoes geradas, geradores, dashboard/)
//   rede/chave/CSP  -> seguranca    (dashboard/, receber.*, construir.js, src/index.html, workflows)
//   história        -> historiador  (o diff de src/jogo.ts toca EPOCAS/GLOSSARIO/LINHA_TEMPO/FONTES)
//   mecânica/portão -> qa           (src/jogo.ts, src/estilo.css, test/)
//
// PORTÕES por exit code REAL (a lição do pipe): npm test E node test/encaixe.js. Vermelho
// desfaz o merge (`reset --hard ORIG_HEAD`) e sai 1 — a main nunca fica esperando conserto.
// O push fica com quem chamou: integrar é decisão local, publicar é outra.

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PAPEIS = ['growth', 'seguranca', 'historiador', 'qa'];

function morre(msg) { console.error('\nINTEGRAR RECUSOU: ' + msg); process.exit(1); }
function git(args, opts) {
  const r = spawnSync('git', args, Object.assign({ cwd: RAIZ, encoding: 'utf8', windowsHide: true }, opts || {}));
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

// ---- argumentos ----
const argv = process.argv.slice(2);
const ramo = argv[0];
if (!ramo || ramo.startsWith('--')) morre('uso: node ferramentas/integrar.js <ramo> --placar "..." [--ok-papel "nota" | --sem-papel "motivo"]');
const flags = {};
for (let i = 1; i < argv.length; i++) {
  if (argv[i].startsWith('--')) { flags[argv[i].slice(2)] = argv[i + 1] || ''; i++; }
}
if (!flags.placar || !flags.placar.trim()) morre('sem --placar não há merge — a linha do EQUIPE.md §5 é parte da entrega (fragilidade 4).');

// ---- o ramo existe? ----
if (git(['rev-parse', '--verify', ramo]).code !== 0) morre('ramo não existe: ' + ramo);

// ---- worktree do ramo: sujeira que não for saída de build recusa ----
const SAIDA_BUILD = /^(index\.html|pack-[\w-]+\.json|dist\/|build\/)/;
const wts = git(['worktree', 'list', '--porcelain']).out.split('\n\n');
let wtPath = null;
for (const b of wts) {
  if (b.includes('branch refs/heads/' + ramo)) { wtPath = (b.match(/^worktree (.+)$/m) || [])[1] || null; }
}
if (wtPath) {
  const suja = git(['status', '--porcelain'], { cwd: wtPath }).out.split('\n').filter(l => l.length > 3);
  const grave = suja.filter(l => !SAIDA_BUILD.test(l.slice(3).replace(/^"|"$/g, '')));
  if (grave.length) morre('árvore do worktree suja (entrega não commitada?):\n  ' + grave.join('\n  ') + '\nCommite no ramo — entrega termina commitada (EQUIPE.md §1).');
  if (suja.length) {
    git(['checkout', '--', '.'], { cwd: wtPath });
    git(['clean', '-fd', '--', 'dist'], { cwd: wtPath });
    console.log('  (sujeira de saída de build descartada no worktree)');
  }
}

// ---- o diff decide as auditorias ----
const arquivos = git(['diff', '--name-only', 'main...' + ramo]).out.split('\n').filter(Boolean);
if (!arquivos.length) morre('o ramo não traz mudança nenhuma sobre a main.');
const exigidos = new Set();
const PUB = /^(plataforma|historia|glossario|de-onde-vem|territorio|dashboard)\/|^ferramentas\/gerar-/;
const REDE = /^dashboard\/|^ferramentas\/(receber|construir)|^src\/index\.html$|^\.github\/workflows\//;
const MEC = /^src\/(jogo\.ts|estilo\.css)$|^test\//;
for (const a of arquivos) {
  if (PUB.test(a)) exigidos.add('growth');
  if (REDE.test(a)) exigidos.add('seguranca');
  if (MEC.test(a)) exigidos.add('qa');
}
if (arquivos.includes('src/jogo.ts')) {
  const diffJogo = git(['diff', 'main...' + ramo, '--', 'src/jogo.ts']).out;
  if (/^[+-].*(EPOCAS|GLOSSARIO|LINHA_TEMPO|FONTES)\b/m.test(diffJogo)) exigidos.add('historiador');
}
const auditoria = [];
for (const p of exigidos) {
  if (flags['ok-' + p]) auditoria.push(p + ':ok(' + flags['ok-' + p] + ')');
  else if (flags['sem-' + p]) auditoria.push(p + ':PULADO(' + flags['sem-' + p] + ')');
  else morre('o diff exige auditoria de "' + p + '" (' + arquivos.filter(a =>
    (p === 'growth' && PUB.test(a)) || (p === 'seguranca' && REDE.test(a)) ||
    (p === 'qa' && MEC.test(a)) || (p === 'historiador' && a === 'src/jogo.ts')).slice(0, 3).join(', ') +
    '...). Rode o agente e passe --ok-' + p + ' "nota", ou assuma por escrito com --sem-' + p + ' "motivo".');
}
console.log('diff: ' + arquivos.length + ' arquivo(s) · auditorias: ' + (auditoria.length ? auditoria.join(' · ') : '(nenhuma exigida)'));

// ---- merge ----
const antes = git(['rev-parse', 'HEAD']).out.trim();
const m = git(['merge', '--no-ff', ramo, '-m',
  'Integra ' + ramo + ' pelo funil (integrar.js)\n\nAuditorias: ' + (auditoria.join(' · ') || 'nenhuma exigida pelo diff') +
  '\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>']);
if (m.code !== 0) {
  git(['merge', '--abort']);
  morre('conflito no merge — resolvido NUNCA às cegas. Saída do git:\n' + m.out.slice(0, 800));
}
console.log('merge feito. Portões...');

// ---- portões por exit code REAL ----
function portao(nome, cmd, args, minutos) {
  const r = spawnSync(cmd, args, { cwd: RAIZ, encoding: 'utf8', windowsHide: true, shell: cmd === 'npm', timeout: minutos * 60000 });
  console.log('  ' + nome + ' -> exit ' + r.status);
  if (r.status !== 0) {
    console.error((r.stdout || '').split('\n').slice(-15).join('\n'));
    git(['reset', '--hard', antes]);
    morre(nome + ' vermelho — merge DESFEITO (main voltou a ' + antes.slice(0, 7) + ').');
  }
}
portao('npm test', 'npm', ['test'], 10);
portao('encaixe', process.execPath, [path.join(RAIZ, 'test', 'encaixe.js')], 12);

// ---- prega o placar ----
const eq = path.join(RAIZ, 'EQUIPE.md');
let linha = flags.placar.trim();
if (!linha.startsWith('|')) linha = '| ' + linha + ' |';
if (auditoria.length) linha = linha.replace(/\|\s*$/, ' · aud: ' + auditoria.join(' ') + ' |');
fs.appendFileSync(eq, linha + '\n');
git(['add', 'EQUIPE.md']);
git(['commit', '-m', 'Placar: rodada integrada pelo funil (' + ramo + ')\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>']);

// ---- limpeza ----
if (wtPath) git(['worktree', 'remove', '--force', wtPath]);
git(['branch', '-D', ramo]);
console.log('\nINTEGRADO: ' + ramo + ' -> main, portões verdes, placar pregado, worktree e ramo removidos.');
console.log('O push é seu: git push (e confira o CI).');
