// TENTATIVA DE BURLA DO PORTÃO ANTI-RECOPIA — QA, 05/09.
//
// `test/rede-externa-sem-copia.js` promete: "reprova qualquer arquivo novo que reimplemente o
// filtro a mão". A prova do autor foi UMA forma — a expressão regular literal com a palavra
// proibida seguida de `.test(`. Portão anti-recopia que só pega a forma que o autor imaginou é
// decoração (EQUIPE.md 2.8). Este arquivo escreve arquivos NOVOS em `test/tmp-burla-*.js`,
// cada um com uma forma DIFERENTE do mesmo filtro proibido, roda o portão de verdade por exit
// code, e diz quais formas passaram.
//
// NOTA SOBRE ESTE ARQUIVO: as palavras proibidas são montadas por concatenação de propósito.
// Escrevê-las inteiras aqui faria o portão reprovar ESTA sonda — o que, medido em 05/09, é o
// que aconteceu na primeira volta: o portão não distingue o padrão dentro de um LITERAL DE
// TEXTO (uma carga de teste) do padrão em código que decide. Isso está no relatório.
//
// Sai 1 se alguma forma BURLAR (o portão sai 0 com o filtro proibido no disco).
//
//   node test/qa-rede-externa-burla.js
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const PORTAO = path.join(DIR, 'rede-externa-sem-copia.js');

if (!fs.existsSync(PORTAO)) {
  console.error('ESTA SONDA MEDE A ENTREGA B (filtro-de-console-copiado-por-arquivo), que ainda nao');
  console.error('esta neste ramo: test/rede-externa-sem-copia.js nao existe. Integre a entrega B antes.');
  process.exit(2);
}

// montadas por partes — ver a nota do cabeçalho
const E = 'ERR' + '_TUNNEL_CONNECTION_FAILED';
const E2 = 'ERR' + '_';
const P = 'post' + 'hog';
const F = 'Failed to load ' + 'resource';

// Cada burla é um CORPO de escutador que decide "é ruído da máquina" por TEXTO, sem olhar a
// origem — exatamente o defeito de 04/09, escrito de outro jeito.
const BURLAS = [
  ['forma do autor (controle: TEM de ser pega)',
    "pg.on('console', m => { if (/" + E + "/.test(m.text())) return; erros.push(m.text()); });"],
  ['regex guardada numa constante, .test na constante',
    "const RUIDO = /" + E + "|" + P + "/;\npg.on('console', m => { if (RUIDO.test(m.text())) return; erros.push(m.text()); });"],
  ['indexOf de substring, sem regex nenhuma',
    "pg.on('console', m => { if (m.text().indexOf('" + E + "') >= 0) return; erros.push(m.text()); });"],
  ['String.includes',
    "pg.on('console', m => { if (m.text().includes('" + P + "')) return; erros.push(m.text()); });"],
  ['regex literal com .exec em vez de .test',
    "pg.on('console', m => { if (/" + E2 + "PROXY|" + E2 + "TUNNEL/.exec(m.text())) return; erros.push(m.text()); });"],
  ['String.match com regex literal',
    "pg.on('console', m => { if (m.text().match(/" + F + "/)) return; erros.push(m.text()); });"],
  ['String.search',
    "pg.on('console', m => { if (m.text().search(/" + E2 + "/) >= 0) return; erros.push(m.text()); });"],
  ['comparação de .url() por substring (a forma que PARECE certa e não é)',
    "pg.on('console', m => { const u = (m.location() || {}).url || ''; if (u.includes('" + P + "')) return; erros.push(m.text()); });"],
  ['helper local com outro nome, mesmo defeito',
    "function ehBarulho(m) { return /" + E2 + "TUNNEL|" + P + "/i.test(m.text()); }\npg.on('console', m => { if (ehBarulho(m)) return; erros.push(m.text()); });"],
  ['filtro dentro de if aninhado (forma do autor, só que aninhada)',
    "pg.on('console', m => { if (m.type() === 'error') { if (m.text()) { if (/" + E2 + "TUNNEL/.test(m.text())) { return; } } } erros.push(m.text()); });"],
  ['regex montada por new RegExp(string)',
    "const RE = new RegExp('" + E + "|" + P + "');\npg.on('console', m => { if (RE.test(m.text())) return; erros.push(m.text()); });"],
  ['array de palavras + some()',
    "const PALAVRAS = ['" + E + "', '" + P + "', '" + F + "'];\npg.on('console', m => { if (PALAVRAS.some(p => m.text().includes(p))) return; erros.push(m.text()); });"],
  ['o arquivo mora numa SUBPASTA de test/',
    'SUBPASTA:' + "pg.on('console', m => { if (/" + E + "/.test(m.text())) return; erros.push(m.text()); });"],
];

const escritos = [];
function limpar() {
  escritos.forEach(p => { try { fs.unlinkSync(p); } catch (e) { } });
  try { fs.rmdirSync(path.join(DIR, 'tmp-burla-sub')); } catch (e) { }
}
process.on('exit', limpar);

function rodarPortao() {
  try { execFileSync(process.execPath, [PORTAO], { stdio: 'pipe' }); return 0; }
  catch (e) { return e.status === undefined ? -1 : e.status; }
}

const limpo = rodarPortao();
console.log('CONTROLE: portão no estado limpo → exit ' + limpo + (limpo === 0 ? '  (ok)' : '  *** já vermelho: o resto não vale ***'));
if (limpo !== 0) { console.log('  (rode `node test/rede-externa-sem-copia.js` para ver quem o deixou vermelho)'); process.exit(2); }

console.log('\nTENTATIVAS DE BURLA — cada uma é um arquivo NOVO em test/ com um filtro por TEXTO,');
console.log('sem olhar a origem, que é o defeito de 04/09. O portão TEM de sair 1 em todas.\n');
console.log('  ' + 'forma'.padEnd(60) + 'exit  veredito');

let burlaram = 0;
BURLAS.forEach(function (b, i) {
  let corpo = b[1], p;
  if (corpo.indexOf('SUBPASTA:') === 0) {
    corpo = corpo.slice('SUBPASTA:'.length);
    const sub = path.join(DIR, 'tmp-burla-sub');
    if (!fs.existsSync(sub)) fs.mkdirSync(sub);
    p = path.join(sub, 'filtro.js');
  } else {
    p = path.join(DIR, 'tmp-burla-' + i + '.js');
  }
  escritos.push(p);
  fs.writeFileSync(p, "'use strict';\nconst erros = [];\nconst pg = { on() {} };\n" + corpo + "\nmodule.exports = { erros };\n");
  const ec = rodarPortao();
  try { fs.unlinkSync(p); } catch (e) { }
  const pego = ec === 1;
  if (!pego) burlaram++;
  console.log('  ' + b[0].padEnd(60) + String(ec).padStart(4) + '  ' + (pego ? 'PEGA' : '*** BURLOU ***'));
});

console.log('\n  formas que BURLARAM o portão: ' + burlaram + ' de ' + BURLAS.length);
if (burlaram) {
  console.log('  O portão cobra UMA forma sintática (regex literal + `.test(`, no primeiro nível de');
  console.log('  test/). Isso não o torna inútil — a trava de REGRESSÃO nos GOVERNADOS (bloco A)');
  console.log('  é outra coisa e essa funciona —, mas a promessa escrita, "reprova qualquer');
  console.log('  arquivo novo que reimplemente o filtro a mão", é mais larga do que ele mede.');
}
process.exit(burlaram ? 1 : 0);
