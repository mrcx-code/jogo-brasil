// PORTAO DE REGRESSAO — valor de <meta content> que nao aponta arquivo nao pode contar como
// referencia em test/dist-inventario.js. Achado pela 2a revisao adversarial (04/09, agente
// ab4eb82fc129f73b2), consertado no mesmo commit.
//
//   node test/dist-inventario-meta-sem-arquivo.js     (exige `npm run build` antes)
//
// O QUE ERA: o conserto do gap anterior (test/dist-inventario-mencao-nao-e-citacao.js) trocou
// `indexOf` solto por `referenciaReal()`, exigindo o nome dentro de `src=`/`href=`/`content=`/
// `fetch(`. Isso fechou a MENCAO EM PROSA — mas `content=` casava QUALQUER `<meta content="...">`,
// e nem todo meta aponta arquivo:
//
//   <meta property="og:type"        content="website">      -> aceitava um arquivo `website`
//   <meta property="og:locale"      content="pt_BR">        -> aceitava `pt_BR`
//   <meta property="og:site_name"   content="BRASIL">       -> aceitava `BRASIL`
//   <a href="/de-onde-vem/">   (o `endsWith('/'+f)` pega o ultimo segmento da PASTA)
//                                                           -> aceitava `de-onde-vem`
//
// MEDIDO em 04/09: os 5 nomes abaixo, plantados no disco, passavam o portao com exit 0 — a MESMA
// classe do gap anterior (valor que nao e referencia de arquivo contando como referencia), so que
// por meta em vez de por prosa. Gravidade menor (nenhum e saida plausivel de build de hoje, sem
// extensao), mas e a superficie exata que o proximo trecho de build ia encontrar.
//
// CONSERTADO: `referenciaReal()` agora exige que o valor referenciado tenha extensao no ultimo
// segmento (`apontaArquivo()`) — todo arquivo publicado hoje (29 de 29) tem; nenhum valor de meta
// que nao aponta arquivo tem. Uma regra so fecha as duas brechas (prosa e meta).
const fs = require('fs'), path = require('path'), cp = require('child_process');
const RAIZ = path.resolve(__dirname, '..'), DIST = path.join(RAIZ, 'dist');
const PORTAO = path.join(__dirname, 'dist-inventario.js');
if (!fs.existsSync(DIST)) { console.error('FALHA: dist/ nao existe. Rode `npm run build` antes.'); process.exit(1); }
const portao = () => cp.spawnSync(process.execPath, [PORTAO], { cwd: RAIZ, encoding: 'utf8' }).status;
if (portao() !== 0) { console.error('FALHA: dist/ ja sujo antes da sonda.'); process.exit(1); }

const CASOS = [
  ['website', 'og:type content="website" na raiz'],
  ['glossario/de-onde-vem', 'href="/de-onde-vem/" — o endsWith pega o ultimo segmento da pasta'],
  ['dashboard/pin-local', 'href="#..."/valor de meta do dashboard'],
  ['jogo/BRASIL', 'og:site_name content="BRASIL"'],
  ['territorio/pt_BR', 'og:locale content="pt_BR"'],
];
let brechas = 0;
console.log('REGRESSAO: valor de <meta content> que nao aponta arquivo nao pode contar como referencia\n');
for (const [rel, porque] of CASOS) {
  const alvo = path.join(DIST, rel);
  if (fs.existsSync(alvo)) { console.log('  (pulado, existe de verdade) ' + rel); continue; }
  fs.writeFileSync(alvo, '-- arquivo de teste, nunca deveria ser publicado --\n');
  const code = portao();
  fs.unlinkSync(alvo);
  if (code === 0) brechas++;
  console.log('  ' + (code === 0 ? 'FALHA — BRECHA VOLTOU' : 'ok — reprovou        ') + '  dist/' + rel + '\n            ' + porque);
}
if (portao() !== 0) { console.error('FALHA: o teste deixou dist/ sujo — defeito DO TESTE, nao do portao.'); process.exit(1); }
console.log('\n' + (CASOS.length - brechas) + ' de ' + CASOS.length + ' caso(s) continuam reprovando. dist/ devolvido limpo.');
if (brechas) { console.error('\nREPROVADO — ' + brechas + ' caso(s) de meta-sem-arquivo voltaram a passar.'); process.exit(1); }
console.log('\ntudo verde');
process.exit(0);
