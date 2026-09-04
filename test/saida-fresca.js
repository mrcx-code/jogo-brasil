// A SAÍDA NO DISCO É MAIS VELHA QUE A FONTE? — o guarda que impede um instrumento de mentir.
//
// POR QUE ISTO EXISTE, e custou DUAS medições erradas na MESMA rodada (QA, 04/09, achado A3):
// os dois instrumentos do ritual leem coisas diferentes, e nenhum dos dois dizia isso.
//
//   · `test/salvador-drop-sem-ritual.js` lê a FONTE (`src/jogo.ts`) + os `pack-*.json` da raiz;
//   · `test/qa-ritual-varredura.js`      lê a SAÍDA (`index.html` da raiz) + os `pack-*.json`.
//
// Rodados a mão **sem `npm run build`**, eles mentem nos DOIS sentidos, e o QA pagou as duas:
//   (1) com búzios injetado em `ICONE_B64` do `src`, a VARREDURA saiu **exit 0** — porque o
//       `index.html` no disco ainda era o de antes. Deveria ser 1.
//   (2) depois de RESTAURAR o `src`, o PORTÃO saiu **exit 1** — porque o `pack-salvador.json`
//       no disco ainda era do build com o defeito. Deveria ser 0.
//
// `md5sum -c` do `src` NÃO basta: tem de reconstruir. É a mesma disciplina que o `CLAUDE.md`
// §6 já escreve sobre o smoke test ("sem `npm run build` antes você testa o arquivo de ontem
// e ele passa") — a diferença é que aqui ela deixa de ser conselho e vira exit code.
//
// DENTRO DO `npm test` ISTO NUNCA DISPARA, por construção: o `npm run build` é o primeiro elo
// da corrente, então toda saída é mais nova que toda fonte quando o instrumento roda.
//
// RECUSAR, E NÃO SÓ AVISAR — a escolha, e o que a sustenta. Avisar num instrumento que imprime
// ~40 linhas de matriz é avisar para ninguém: a linha some no rolo e o exit code continua
// dizendo verde. Mas recusar seco quebraria um uso legítimo que o `CLAUDE.md` §6 nomeia por
// extenso ("testar exatamente os bytes que estão no disco"). Então: **recusa por padrão, com
// uma porta que tem nome** — `QA_ACEITA_SAIDA_VELHA=1`. Quem quer medir o artefato de ontem
// continua podendo, mas passa a ter de DIZER que é isso que quer.
//
// O código de saída é **2**, não 1, e é de propósito: 1 é "achei ritual", 2 é "não tenho o que
// medir". Mesma disciplina do `test/csp-paginas.js`, que já usa 2 para falha alta de tabela.

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');

function mt(p) {
  try { return fs.statSync(p).mtimeMs; } catch (e) { return null; }
}

// `saidas` e `fontes` são caminhos relativos à raiz do repositório.
// Devolve true quando seguiu em frente; sai com código 2 quando recusa.
function cobrar(quem, saidas, fontes) {
  const f = fontes.map(n => ({ n, t: mt(path.join(RAIZ, n)) })).filter(x => x.t !== null);
  const s = saidas.map(n => ({ n, t: mt(path.join(RAIZ, n)) }));

  const faltando = s.filter(x => x.t === null);
  const maisNova = f.reduce((a, b) => (a && a.t >= b.t ? a : b), null);
  const velhas = maisNova ? s.filter(x => x.t !== null && x.t < maisNova.t) : [];

  if (!faltando.length && !velhas.length) {
    console.log(quem + ' lê ' + saidas.length + ' arquivo(s) de SAÍDA (' + saidas.slice(0, 3).join(', ') +
      (saidas.length > 3 ? ', +' + (saidas.length - 3) + ')' : ')') +
      ' — conferidos mais novos que ' + (maisNova ? maisNova.n : 'a fonte') + '. Sem `npm run build` antes, este número não vale.');
    return true;
  }

  console.error('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.error('║  ' + quem.toUpperCase().padEnd(76) + '║');
  console.error('║  RECUSO MEDIR: a SAÍDA no disco não corresponde à FONTE.                     ║');
  console.error('╚══════════════════════════════════════════════════════════════════════════════╝');
  faltando.forEach(x => console.error('  FALTA    ' + x.n + ' — não existe. Rode `npm run build`.'));
  velhas.forEach(x => console.error('  VELHO    ' + x.n + ' é ' + Math.round((maisNova.t - x.t) / 1000) +
    's mais velho que ' + maisNova.n));
  console.error('\n  Este instrumento lê a saída construída, não a fonte. Medir a saída de ontem');
  console.error('  contra a fonte de hoje já produziu exit 0 onde devia ser 1 (QA, 04/09).');
  console.error('\n  CONSERTO:  npm run build   (e então rode de novo)');
  console.error('  Se você QUER mesmo medir os bytes que estão no disco: QA_ACEITA_SAIDA_VELHA=1\n');
  process.exit(2);
}

// Versão que não mata: usada onde a saída velha é só metade do que se lê.
function cobrarOuAvisar(quem, saidas, fontes) {
  if (process.env.QA_ACEITA_SAIDA_VELHA === '1') {
    console.log(quem + ': QA_ACEITA_SAIDA_VELHA=1 — a frescura da saída NÃO foi conferida. ' +
      'O número abaixo vale para os bytes que estão no disco, não para a fonte.');
    return false;
  }
  return cobrar(quem, saidas, fontes);
}

module.exports = { cobrar: cobrarOuAvisar, RAIZ };
