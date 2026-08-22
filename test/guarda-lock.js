// O PORTÃO DO PORTÃO — mede o lock entre máquinas (Proposta B do PR #4, 23/08).
//
// Ele chama `quemTrava()` direto, sem simular o harness, e chama o `guarda.js` de verdade por
// stdin para provar que a recusa sai com EXIT 2 — as duas coisas, porque a lógica certa num
// portão que não recusa é decoração.
//
// A régua inteira nasce da proposta: as três condições (território · em-curso · outra máquina),
// as três exceções (arquivo novo · diário · item do dono) e a validade de 2 h, que trocou as
// 12 h chutadas por um número medido (rodadas de 2 a 67 min em 21-22/08).
//
//   node test/guarda-lock.js            → tem de sair 0
//   node test/guarda-lock.js --controle → apaga um conserto por vez e exige que cada um morda
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const GUARDA = path.join(RAIZ, '.claude', 'hooks', 'guarda.js');

let falhas = 0;
function ok(cond, msg, extra) {
  if (cond) { console.log('  ok  ' + msg); return true; }
  falhas++; console.log('  FALHOU  ' + msg + (extra == null ? '' : '  <- ' + String(extra).slice(0, 200)));
  return false;
}
function sec(t) { console.log('\n---- ' + t); }

// Um repositório de mentira, com a forma mínima que o lock precisa enxergar.
function palco(itens, maquina, arquivos) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-'));
  fs.mkdirSync(path.join(dir, 'ferramentas'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'ferramentas', 'backlog.json'), JSON.stringify({ itens }, null, 1));
  if (maquina != null) fs.writeFileSync(path.join(dir, '.claude', 'maquina'), maquina + '\n');
  for (const a of (arquivos || [])) {
    const p = path.join(dir, a);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, '// existe\n');
  }
  return dir;
}
const agoraISO = (minAtras) => new Date(Date.now() - minAtras * 60000).toISOString();

// O lock-maquina.js do ramo, carregado fresco a cada cena (o require cacheia).
function carregar() {
  const p = path.join(RAIZ, '.claude', 'hooks', 'lock-maquina.js');
  delete require.cache[require.resolve(p)];
  return require(p);
}

const ITEM_OUTRA = {
  id: 'caminho-do-ceu', titulo: 'O caminho do céu', estado: 'em-curso',
  maquina: 'mac-sessao', desde: agoraISO(10),
  territorio: ['src/jogo.ts', 'src/estilo.css', 'test/regua-larga.js'],
};

const cenas = [];
function cena(nome, fn) { cenas.push([nome, fn]); }

cena('1 · o território de outra máquina é RECUSADO', () => {
  const { quemTrava } = carregar();
  const dir = palco([ITEM_OUTRA], 'windows-plantao', ['src/jogo.ts']);
  const t = quemTrava('src/jogo.ts', dir);
  ok(!!t, 'src/jogo.ts trava', JSON.stringify(t));
  ok(t && t.maquina === 'mac-sessao', 'a mensagem sabe de QUEM é o lock', t && t.maquina);
});

cena('2 · o MEU próprio item não me trava', () => {
  const { quemTrava } = carregar();
  const meu = Object.assign({}, ITEM_OUTRA, { maquina: 'windows-plantao' });
  const dir = palco([meu], 'windows-plantao', ['src/jogo.ts']);
  ok(quemTrava('src/jogo.ts', dir) === null, 'trabalhar no que EU peguei continua livre');
});

cena('3 · as três exceções da proposta', () => {
  const { quemTrava } = carregar();
  // ATENÇÃO, lição do controle (23/08): o item destas cenas precisa ter um território que
  // ENGLOBE o alvo — senão a exceção passa por acaso e a cena vira decoração. Foi o que o
  // controle pegou nas duas primeiras versões disto aqui.
  const largo = Object.assign({}, ITEM_OUTRA, { territorio: ['src/', 'NOTES.md'] });
  const dir = palco([largo], 'windows-plantao', ['src/jogo.ts', 'NOTES.md']);
  ok(quemTrava('src/jogo.ts', dir) !== null, 'o território largo TRAVA o que existe (a cena mede algo)');
  ok(quemTrava('src/arquivo-novo.ts', dir) === null, 'arquivo NOVO dentro do território travado nunca trava (o git funde sozinho)');
  ok(quemTrava('NOTES.md', dir) === null, 'diário DENTRO do território travado nunca trava (merge=union resolve)');
  const doDono = Object.assign({}, largo, { estado: 'do-dono' });
  const d2 = palco([doDono], 'windows-plantao', ['src/jogo.ts']);
  ok(quemTrava('src/jogo.ts', d2) === null, 'item do-dono não é lock de máquina');
});

cena('4 · a validade de 2 h — o número que trocou o chute de 12 h', () => {
  const { quemTrava } = carregar();
  const fresco = palco([Object.assign({}, ITEM_OUTRA, { desde: agoraISO(115) })], 'windows-plantao', ['src/jogo.ts']);
  ok(!!quemTrava('src/jogo.ts', fresco), 'lock de 1h55 ainda vale (a rodada mais longa medida foi 67 min)');
  const velho = palco([Object.assign({}, ITEM_OUTRA, { desde: agoraISO(125) })], 'windows-plantao', ['src/jogo.ts']);
  ok(quemTrava('src/jogo.ts', velho) === null, 'lock de 2h05 VENCEU e deixa passar');
});

cena('5 · degradar é a regra: dado ruim nunca vira bloqueio', () => {
  const { quemTrava } = carregar();
  const semNome = palco([ITEM_OUTRA], null, ['src/jogo.ts']);
  ok(quemTrava('src/jogo.ts', semNome) === null, 'sem .claude/maquina: não trava nada');
  const dir = palco([ITEM_OUTRA], 'windows-plantao', ['src/jogo.ts']);
  fs.writeFileSync(path.join(dir, 'ferramentas', 'backlog.json'), '{ isto não é json');
  ok(quemTrava('src/jogo.ts', dir) === null, 'backlog QUEBRADO: não trava (a mesa do dono edita ao vivo)');
  const semCarimbo = palco([Object.assign({}, ITEM_OUTRA, { desde: 'ontem de tarde' })], 'windows-plantao', ['src/jogo.ts']);
  ok(quemTrava('src/jogo.ts', semCarimbo) === null, 'carimbo ilegível: não trava');
});

cena('6 · as três formas de território casam, e só elas', () => {
  const { casaTerritorio } = carregar();
  ok(casaTerritorio('dashboard/index.html', 'dashboard/'), 'prefixo de pasta');
  ok(casaTerritorio('ferramentas/gerar-historia.js', 'ferramentas/gerar-*.js'), 'glob de um segmento');
  ok(casaTerritorio('src/jogo.ts', 'src/jogo.ts'), 'caminho exato');
  ok(!casaTerritorio('src/jogo.test.ts', 'src/jogo.ts'), 'exato NÃO pega vizinho parecido');
  ok(!casaTerritorio('ferramentas/sub/gerar-x.js', 'ferramentas/gerar-*.js'), 'glob não atravessa pasta');
});

cena('7 · o guarda de verdade recusa com EXIT 2', () => {
  const dir = palco([ITEM_OUTRA], 'windows-plantao', ['src/jogo.ts']);
  // o guarda resolve a RAIZ pelo próprio caminho; copiamos os hooks para o palco
  fs.mkdirSync(path.join(dir, '.claude', 'hooks'), { recursive: true });
  for (const f of ['guarda.js', 'lock-maquina.js']) {
    fs.copyFileSync(path.join(RAIZ, '.claude', 'hooks', f), path.join(dir, '.claude', 'hooks', f));
  }
  const chamar = (rel) => spawnSync(process.execPath, [path.join(dir, '.claude', 'hooks', 'guarda.js')], {
    input: JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: path.join(dir, rel), old_string: 'a', new_string: 'b' } }),
    encoding: 'utf8',
  });
  const r = chamar('src/jogo.ts');
  ok(r.status === 2, 'território de outra máquina: exit 2 (recusa de verdade)', 'exit ' + r.status);
  ok(/mac-sessao/.test(r.stderr || ''), 'o stderr diz QUAL máquina segura', (r.stderr || '').slice(0, 120));
  ok(/outro item livre|fale com o dono/.test(r.stderr || ''), 'e diz o que fazer, não só que não pode');
  const livre = chamar('README.md');
  ok(livre.status === 0, 'arquivo fora de território: passa (exit 0)', 'exit ' + livre.status);
});

for (const [nome, fn] of cenas) { sec(nome); fn(); }
console.log('\n' + (falhas ? 'FALHOU em ' + falhas + ' verificação(ões)' : 'guarda-lock: tudo verde'));
process.exit(falhas ? 1 : 0);
