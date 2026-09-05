// TENTATIVA DE BURLA DO PORTÃO ANTI-RECOPIA — QA, 05/09; ampliada pelo dev-jogo em 05/09.
//
// `test/rede-externa-sem-copia.js` promete duas coisas: que ninguém REIMPLEMENTE o filtro de
// rede externa à mão, e (desde 05/09) que ninguém DECIDA por erro de console sem passar pelo
// helper. Portão anti-recopia que só pega a forma que o autor imaginou é decoração
// (EQUIPE.md 2.8). Este arquivo escreve arquivos NOVOS em `test/tmp-burla-*.js`, cada um com uma
// forma DIFERENTE do mesmo defeito, roda o portão de verdade por exit code, e diz quais passaram.
//
// TRÊS BLOCOS:
//   1. CONTROLE LIMPO — o portão no estado do disco tem de sair 0. Sem isso o resto não vale.
//   2. RECOPIA — 13 formas de reescrever o filtro por TEXTO. Todas têm de sair 1.
//   3. FALSOS POSITIVOS — três arquivos que o portão NÃO pode reprovar: um que só LOGA (sem
//      veredito), uma sonda que carrega o padrão como CARGA DE TEXTO, e um que passa pelo
//      helper. Mais o caso que DEVE reprovar e não é recopia nenhuma: decide e não filtra NADA.
//
// NOTA DE 05/09 — O QUE MUDOU AQUI E POR QUÊ. Até esta versão as palavras proibidas eram
// montadas por concatenação (`'ERR' + '_'`) porque o portão antigo procurava texto no arquivo
// inteiro e REPROVAVA ESTA SONDA. Isso era o incentivo invertido: quem fosse testar a área
// precisava contornar o portão. O portão passou a ler o arquivo como CÓDIGO (analisador léxico:
// um `.on('console'` dentro de um literal de texto é carga, não escutador), então as palavras
// abaixo estão escritas por extenso — e o bloco 3 mede justamente que isso continua exit 0.
//
// Sai 1 se alguma forma BURLAR, ou se algum falso positivo voltar.
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

const E = 'ERR_TUNNEL_CONNECTION_FAILED';
const E2 = 'ERR_';
const P = 'posthog';
const F = 'Failed to load resource';

// ————— BLOCO 2: cada burla é um CORPO de escutador que decide "é ruído da máquina" por TEXTO,
// sem olhar a origem — exatamente o defeito de 04/09, escrito de outro jeito. —————
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

// ————— BLOCO 3: o que o portão TEM de deixar passar, e o que ele TEM de pegar sem ser recopia.
// Cada entrada é [nome, corpo, exit esperado]. —————
const CASOS_FINOS = [
  ['DECIDE por erro de console e não filtra NADA (o caso de 05/09)',
    "pg.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });\n"
    + "if (erros.length) { console.log('FALHA: ' + erros.length); process.exit(1); }\nprocess.exit(0);", 1],
  ['só LOGA: guarda e imprime, nunca vira veredito',
    "pg.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });\n"
    + "console.log('erros vistos: ' + erros.length);", 0],
  ['sonda que carrega o padrão como CARGA DE TEXTO (string, não código)',
    "const CORPO = \"pg.on('console', m => { if (/" + E + "|" + P + "/.test(m.text())) return; });\";\n"
    + "const PALAVRA = '" + F + ": net::" + E + "';\n"
    + "require('fs').writeFileSync(require('path').join(__dirname, 'tmp-nao-escrito.txt'), CORPO + PALAVRA);\n"
    + "require('fs').unlinkSync(require('path').join(__dirname, 'tmp-nao-escrito.txt'));", 0],
  ['decide, mas passa pelo helper (o caminho certo)',
    "const { ehRuidoDeRedeExterna } = require('./rede-externa.js');\n"
    + "pg.on('console', m => { if (m.type() !== 'error') return; if (ehRuidoDeRedeExterna(m)) return; erros.push(m.text()); });\n"
    + "if (erros.length) process.exit(1);", 0],
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

function escreverEMedir(corpo, prefixo) {
  let p;
  if (corpo.indexOf('SUBPASTA:') === 0) {
    corpo = corpo.slice('SUBPASTA:'.length);
    const sub = path.join(DIR, 'tmp-burla-sub');
    if (!fs.existsSync(sub)) fs.mkdirSync(sub);
    p = path.join(sub, 'filtro.js');
  } else {
    p = path.join(DIR, prefixo + '.js');
  }
  escritos.push(p);
  fs.writeFileSync(p, "'use strict';\nconst erros = [];\nconst pg = { on() {} };\n" + corpo + "\nmodule.exports = { erros };\n");
  const ec = rodarPortao();
  try { fs.unlinkSync(p); } catch (e) { }
  return ec;
}

const limpo = rodarPortao();
console.log('CONTROLE: portão no estado limpo → exit ' + limpo + (limpo === 0 ? '  (ok)' : '  *** já vermelho: o resto não vale ***'));
if (limpo !== 0) { console.log('  (rode `node test/rede-externa-sem-copia.js` para ver quem o deixou vermelho)'); process.exit(2); }

console.log('\nBLOCO 2 — RECOPIA. Cada forma é um arquivo NOVO em test/ com um filtro por TEXTO,');
console.log('sem olhar a origem, que é o defeito de 04/09. O portão TEM de sair 1 em todas.\n');
console.log('  ' + 'forma'.padEnd(60) + 'exit  veredito');

let burlaram = 0;
BURLAS.forEach(function (b, i) {
  const ec = escreverEMedir(b[1], 'tmp-burla-' + i);
  const pego = ec === 1;
  if (!pego) burlaram++;
  console.log('  ' + b[0].padEnd(60) + String(ec).padStart(4) + '  ' + (pego ? 'PEGA' : '*** BURLOU ***'));
});
console.log('\n  formas que BURLARAM o portão: ' + burlaram + ' de ' + BURLAS.length);

console.log('\nBLOCO 3 — O QUE ELE NÃO PODE ERRAR: o arquivo sem filtro nenhum tem de reprovar, e');
console.log('quem só loga, quem carrega o padrão como texto e quem usa o helper têm de passar.\n');
console.log('  ' + 'caso'.padEnd(60) + 'exit  esperado  veredito');

let finosErrados = 0;
CASOS_FINOS.forEach(function (c, i) {
  const ec = escreverEMedir(c[1], 'tmp-fino-' + i);
  const certo = ec === c[2];
  if (!certo) finosErrados++;
  console.log('  ' + c[0].padEnd(60) + String(ec).padStart(4) + String(c[2]).padStart(10) + '  '
    + (certo ? 'ok' : '*** ERRADO ***'));
});

console.log('\n  casos finos errados: ' + finosErrados + ' de ' + CASOS_FINOS.length);
if (burlaram || finosErrados) {
  console.log('\n  A promessa escrita no cabeçalho do portão é mais larga do que ele mede. Ou feche a');
  console.log('  forma que passou, ou estreite a promessa — nunca deixe as duas desencontradas.');
}
process.exit((burlaram || finosErrados) ? 1 : 0);
