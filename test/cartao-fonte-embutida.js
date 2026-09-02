// O CONTROLE DA FONTE EMBUTIDA DO CARTÃO — as três recusas novas, vistas reprovando.
//
// POR QUE ELE EXISTE, e é a lição 2.8 do EQUIPE.md aplicada no lugar onde ela acabou de doer:
// a cobrança antiga do cartão (`getComputedStyle(h1).fontFamily === CHROME.TITULO`) **nunca
// reprovou, em máquina nenhuma**, o defeito de o cartão sair com a tipografia do host — ela lê
// a lista declarada no CSS, não o glifo pintado (PENDENTES 101c, provado ao vivo). Trocar um
// portão cego por três asserções novas só vale se as três forem VISTAS mordendo; senão o
// conserto é decoração assinada de verde, que é exatamente o defeito que ele veio corrigir.
//
// O QUE ELE FAZ. Roda `CARTAO.tirar()` sobre uma CÓPIA de uma seção, em `test/TMP-fonte/`,
// quatro vezes:
//   1. com `CARTAO_TIPOGRAFIA_DEFEITO=fonte-nao-carrega`  -> o `src` do @font-face aponta para
//      bytes que não são fonte; a família entra em `status:"error"`. TEM de recusar.
//   2. com `CARTAO_TIPOGRAFIA_DEFEITO=sem-familias`       -> a lista de famílias da serifa da
//      casa sai vazia, então nada é trocado. TEM de recusar.
//   3. com `CARTAO_TIPOGRAFIA_DEFEITO=titulo-fora`        -> a fonte carrega e o corpo troca,
//      mas o `h1` fica de fora. TEM de recusar, e é ESTA que prova que a medida é do glifo:
//      as duas de cima poderiam ser pegas por qualquer coisa; esta só é pega por largura de
//      avanço, porque o CSS declarado do título continua idêntico ao da página limpa.
//   4. SEM defeito                                        -> TEM de passar (controle negativo:
//      sem ele, as três de cima poderiam estar recusando por um motivo que não é o injetado).
//
// ONDE ELE DEVERIA MORAR. O lugar natural das injeções do cartão é a lista `DEFEITOS` de
// `test/cartao-controle.js`. Ele nasceu separado porque aquele arquivo estava em uso por outra
// entrega na mesma rodada — juntar os dois é trabalho de uma linha por defeito e vale ser feito.
// Nada aqui escreve em pasta publicada.
const fs = require('fs');
const path = require('path');
const CARTAO = require('../ferramentas/cartao-secao.js');
const TIPO = require('../ferramentas/tipografia-cartao.js');

const RAIZ = path.resolve(__dirname, '..');
const TMP = path.join(RAIZ, 'test', 'TMP-fonte');
const SECAO = process.env.CARTAO_SECAO || 'historia';

const DEFEITOS = [
  { modo: 'fonte-nao-carrega', espera: /a fonte embutida .* nao carregou/ },
  { modo: 'sem-familias', espera: /nenhum elemento da pagina veste a serifa da casa/ },
  { modo: 'titulo-fora', espera: /o titulo nao esta sendo PINTADO na fonte embutida/ },
];

let falhas = 0;
function ok(cond, msg) {
  console.log((cond ? '  ok  ' : '  FALHA  ') + msg);
  if (!cond) falhas++;
  return cond;
}

(async () => {
  console.log('=== o portão da fonte embutida do cartão, visto REPROVANDO (' + SECAO + ')');
  console.log('    família: ' + TIPO.FAMILIA + ' ' + TIPO.VERSAO + ' · OFL 1.1 · '
    + 'ferramentas/tipografia/OFL.txt');

  fs.mkdirSync(TMP, { recursive: true });
  fs.copyFileSync(path.join(RAIZ, SECAO, 'index.html'), path.join(TMP, 'index.html'));

  try {
    for (const d of DEFEITOS) {
      process.env.CARTAO_TIPOGRAFIA_DEFEITO = d.modo;
      let erro = null;
      try { await CARTAO.tirar(TMP, {}); } catch (e) { erro = String(e.message || e); }
      delete process.env.CARTAO_TIPOGRAFIA_DEFEITO;
      ok(!!erro && d.espera.test(erro), 'CONTROLE "' + d.modo + '": '
        + (erro ? 'recusou — ' + erro.slice(0, 110).replace(/\s+/g, ' ') : 'PASSOU, e não podia'));
    }

    let limpo = null, erroLimpo = null;
    try { limpo = await CARTAO.tirar(TMP, {}); } catch (e) { erroLimpo = String(e.message || e); }
    ok(!!limpo, 'CONTROLE NEGATIVO: a mesma página SEM defeito passa'
      + (limpo ? ' (' + limpo.kb.toFixed(1) + ' KB · ' + limpo.fixados + ' elementos fixados em '
        + limpo.fonte + ')' : ' — recusou: ' + erroLimpo));
  } finally {
    fs.rmSync(TMP, { recursive: true, force: true });
  }

  console.log(falhas
    ? '\nFONTE DO CARTÃO: ' + falhas + ' falha(s) — um controle que não morde é decoração'
    : '\nFONTE DO CARTÃO OK — 3/3 defeitos mordidos e o controle negativo passa');
  process.exit(falhas ? 1 : 0);
})();
