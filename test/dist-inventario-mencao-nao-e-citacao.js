// PORTAO DE REGRESSAO — mencao nao vira citacao em test/dist-inventario.js, 04/09.
//
//   node test/dist-inventario-mencao-nao-e-citacao.js     (exige `npm run build` antes)
//
// NASCEU sonda do QA (agente a0389cc0bd332cfb0), revisando a entrega de dist-inventario.js:
// a 1a versao aceitava um arquivo se o NOME dele aparecesse em QUALQUER lugar do HTML como
// `/nome`, `"nome"` ou `'nome'` — inclusive dentro de comentario ou prosa. `indexOf` nao
// distingue uma REFERENCIA (`src=`/`href=`/`content=`/`fetch(`) de uma MENCAO (comentario de
// codigo, prosa, texto de SVG). Medido contra o dist/ de 04/09: 128 nomes mencionados sem
// serem referenciados, em 8 das 9 pastas — e os 6 casos abaixo, plantados de verdade no disco,
// PASSARAM o portao antigo. O primeiro e o que mais importa: `privacidade-texto.md` e
// exatamente a CLASSE `.md` que o vazamento de 23/08 criou o portao inteiro para impedir.
//
// CONSERTADO no mesmo commit (test/dist-inventario.js: `referenciaReal()`, regex sobre
// src=/href=/content=/fetch(...) em vez de `indexOf` solto). Este arquivo virou o teste de
// REGRESSAO: cada caso abaixo tem de REPROVAR o portao — se algum passar (BRECHA), o buraco
// voltou.
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const DIST = path.join(RAIZ, 'dist');
const PORTAO = path.join(__dirname, 'dist-inventario.js');

if (!fs.existsSync(DIST)) {
  console.error('FALHA: dist/ nao existe. Rode `npm run build` antes.');
  process.exit(1);
}

const portao = () => cp.spawnSync(process.execPath, [PORTAO], { cwd: RAIZ, encoding: 'utf8' }).status;

if (portao() !== 0) {
  console.error('FALHA: o dist/ ja esta sujo antes do teste — o portao reprova sem injecao nenhuma.');
  process.exit(1);
}

// Cada linha: [caminho relativo dentro de dist/, por que o nome já aparece MENCIONADO na página
// (nunca referenciado de verdade) — a mordida deste teste é essa distinção sobreviver].
const CASOS = [
  ['privacidade/privacidade-texto.md', 'a pagina /privacidade/ menciona o nome em comentario — a MESMA classe .md de 23/08'],
  ['jogo.ts', 'a home menciona o nome do arquivo-FONTE; publicar a fonte inteira passaria'],
  ['estilo.css', 'a home menciona o nome da folha de estilo da fonte'],
  ['dashboard/fila-auth.sql', 'o dashboard menciona o nome do esquema de banco'],
  ['jogo/tmp-painel2.js', 'a pagina do jogo menciona um script temporario de medicao'],
  ['territorio/three.core.min.js', 'a pagina do territorio menciona a biblioteca'],
];

console.log('REGRESSAO: nome MENCIONADO nao pode contar como CITADO em dist-inventario.js\n');
let falhas = 0;
for (const [rel, porque] of CASOS) {
  const alvo = path.join(DIST, rel);
  if (fs.existsSync(alvo)) {
    console.log('  (pulado, ja existe de verdade) ' + rel);
    continue;
  }
  fs.writeFileSync(alvo, '-- arquivo de teste, nunca deveria ser publicado --\n');
  const code = portao();
  fs.unlinkSync(alvo);
  const brecha = code === 0;
  if (brecha) falhas++;
  console.log('  ' + (brecha ? 'FALHA — BRECHA VOLTOU' : 'ok — reprovou') + '  dist/' + rel);
  console.log('            ' + porque);
}

if (portao() !== 0) {
  console.error('FALHA: o teste deixou dist/ sujo — isto e um defeito DO TESTE, nao do portao.');
  process.exit(1);
}

console.log('\n' + (CASOS.length - falhas) + ' de ' + CASOS.length + ' caso(s) de mencao-sem-referencia'
  + ' continuam reprovando. dist/ devolvido limpo (portao exit 0).');

if (falhas) {
  console.error('\nREPROVADO — ' + falhas + ' caso(s) de mencao voltaram a passar como citacao.');
  process.exit(1);
}
console.log('\ntudo verde');
process.exit(0);
