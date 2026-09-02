// A TIPOGRAFIA DO CARTÃO DE LINK — a fonte que o print carrega consigo.
//
// POR QUE ESTE ARQUIVO EXISTE, e o número que o pediu (PENDENTES 101b, 01–02/09).
// `ferramentas/cartao-secao.js` tira o cartão printando a própria página. A página veste a
// serifa da casa por PILHA DE FONTE DE SISTEMA — `--titulo` pede Palatino Linotype, Palatino,
// Georgia e só então a genérica `serif`; `--leitura` pede Georgia primeiro. Não há um único
// `@font-face` em lugar nenhum. Consequência medida: **o cartão publicado sai com a tipografia
// da máquina que o gerou**. Regerar os três cartões nesta máquina de nuvem os encolheu ~10% em
// bytes (de-onde-vem 87.538→79.409, glossario 81.115→76.385, historia 83.486→74.829) porque a
// fonte trocou, não porque a compressão melhorou.
//
// O QUE ESTA MÁQUINA REALMENTE PINTA, e aqui o diagnóstico anterior ERRAVA O NOME DA FONTE.
// Estava escrito no PENDENTES que ela pintava DejaVu Serif, porque `fc-match serif` responde
// `DejaVuSerif.ttf`. O Chromium NÃO usa essa resposta. Medido em 02/09 por hash de bitmap
// (canvas, 48px, mesma cadeia, hash FNV do canal alfa — não por `getComputedStyle`):
//
//     hash d9f9577f, largura 917,20 px  ->  serif · a pilha do --titulo · a pilha do --leitura
//                                           · "Liberation Serif" · "Times New Roman" · "Tinos"
//                                           · "Nimbus Roman" · "Familia Inexistente 98765"
//     hash 6167a9ce, largura 1123,88 px ->  "DejaVu Serif"
//     hash 11e38e47, largura 907,15 px  ->  "FreeSerif"
//
// Ou seja: a genérica `serif` do Chromium aqui resolve em **Liberation Serif** (métrica de
// Times), e não em DejaVu. Duas coisas decorrem, e as duas importam:
//   (a) O cartão gerado nesta máquina já perdia a distinção de desenho entre TÍTULO e CORPO —
//       as duas pilhas caem no MESMO glifo, com o mesmo hash de bitmap.
//   (b) Liberation Serif é ~18% mais ESTREITA que DejaVu no mesmo corpo, o que casa com o
//       sintoma relatado ("os botões da barra estreitaram") e não casaria com DejaVu.
//
// O QUE ESTE MÓDULO FAZ. Entrega ao `cartao-secao.js` (1) o CSS de `@font-face` com a fonte
// EMBUTIDA em base64 e (2) a lista de nomes de família que contam como "serifa da casa",
// derivada das constantes `TITULO`/`LEITURA` do `chrome-plataforma.js` — derivada, para não
// existirem duas listas que possam divergir.
//
// O QUE ELE NÃO FAZ, e é decisão, não esquecimento: **não toca em página publicada**. O
// `@font-face` entra na página EM MEMÓRIA, na hora do print, e nenhum byte de
// `<secao>/index.html` muda por causa dele. É o mesmo lugar onde o `GRAO_FORA` já mora
// (aquele bloco tira o grão só do print, e o argumento está escrito lá). Se um dia a
// plataforma quiser a fonte também para quem VISITA, isso é outra decisão, é de arte, e custa
// KB em toda página — nada disso está aqui.
//
// A LICENÇA, com nome de arquivo e versão: Gelasio, Version 1.008, SIL Open Font License 1.1,
// cópia integral em `ferramentas/tipografia/OFL.txt`. Proveniência, sha256 e o que foi
// modificado (nada além do nome do arquivo) estão em `ferramentas/tipografia/LEIAME.txt`.
// Por que Gelasio e não um clone de Palatino: também está lá, com as duas recusas medidas
// (URW P052 é AGPL cuja exceção cobre só PostScript/PDF; TeX Gyre Pagella tem licença boa mas
// as duas origens dos binários são negadas pela política de egresso desta máquina).
const fs = require('fs');
const path = require('path');
const CHROME = require('./chrome-plataforma.js');

const DIR = path.join(__dirname, 'tipografia');
const FAMILIA = 'Gelasio';
const VERSAO = 'Version 1.008';
const ARQUIVOS = {
  normal: path.join(DIR, 'Gelasio-wght.ttf'),
  italic: path.join(DIR, 'Gelasio-Italic-wght.ttf'),
};

// As genéricas do CSS. `sans-serif` está aqui de propósito e a armadilha é velha: ela CONTÉM
// a cadeia `serif`, e foi exatamente assim que o portão do cartão ficou mudo por um dia em
// 22/08 (leia o comentário do controle em test/cartao-controle.js). Por isso a comparação
// abaixo é de IGUALDADE de token, nunca de substring.
const GENERICAS = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui',
  'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'math', 'emoji', 'fangsong',
]);

function tokens(pilha) {
  return String(pilha || '').split(',').map((s) => s.trim().replace(/^["']|["']$/g, '').toLowerCase())
    .filter(Boolean);
}

// Os nomes que, aparecendo numa pilha, dizem "isto é texto de leitura da casa". Sai das
// constantes do chrome, mais a genérica `serif` — porque uma pilha que termina em `serif` e
// não tem nenhuma das nomeadas instalada também cai na fonte do host, que é o defeito inteiro.
const FAMILIAS_SERIFA = (() => {
  const s = new Set();
  tokens(CHROME.TITULO).forEach((t) => { if (!GENERICAS.has(t)) s.add(t); });
  tokens(CHROME.LEITURA).forEach((t) => { if (!GENERICAS.has(t)) s.add(t); });
  s.add('serif');
  return [...s];
})();

let cacheB64 = null;
function base64() {
  if (!cacheB64) {
    cacheB64 = {
      normal: fs.readFileSync(ARQUIVOS.normal).toString('base64'),
      italic: fs.readFileSync(ARQUIVOS.italic).toString('base64'),
    };
  }
  return cacheB64;
}

// O CSS que viaja para dentro da página, na hora do print.
//
// `font-weight:400 700` porque os dois arquivos são VARIÁVEIS no eixo wght (o METADATA.pb do
// upstream declara min 400, max 700) e as páginas usam 400, 600 e 700 — os três dentro da
// faixa, sem síntese de negrito pelo navegador, que seria mais uma coisa a variar por máquina.
//
// `defeito` é o gancho de AUTOTESTE (EQUIPE 2.8: portão nunca visto reprovando é decoração).
// Com ele, o `src` aponta para bytes que não são fonte; a família entra em `status:"error"` e
// a conferência do cartao-secao.js TEM de recusar. O modo de falha se ele for ligado por
// acidente é uma RECUSA, nunca uma publicação errada.
function css(op) {
  op = op || {};
  const b = base64();
  const fonte = (estilo, dados) => {
    const src = op.defeito === 'fonte-nao-carrega'
      ? 'url(data:font/ttf;base64,QUFBQQ==) format("truetype")'
      : 'url(data:font/ttf;base64,' + dados + ') format("truetype")';
    return '@font-face{font-family:"' + FAMILIA + '";font-style:' + estilo + ';'
      + 'font-weight:400 700;font-display:block;src:' + src + ';}';
  };
  return fonte('normal', b.normal) + '\n' + fonte('italic', b.italic) + '\n';
}

// O peso do que viaja — para o relatório, e para ninguém precisar adivinhar.
function peso() {
  const b = base64();
  return {
    ttfNormal: fs.statSync(ARQUIVOS.normal).size,
    ttfItalico: fs.statSync(ARQUIVOS.italic).size,
    b64Normal: b.normal.length,
    b64Italico: b.italic.length,
    css: css().length,
  };
}

// OS OUTROS DOIS MODOS DE DEFEITO, e existem pela mesma razao do de cima: uma assercao que
// ninguem viu reprovar e decoracao assinada de verde (EQUIPE 2.8). Um esvazia a lista de
// familias (simula alguem renomear a serifa da casa e a troca nao pegar nada); o outro deixa
// o titulo de fora da troca (simula a lista cobrindo o corpo e nao o titulo). Nos tres, o
// modo de falha e RECUSA — nenhum deles pode fazer o gerador publicar coisa errada.
function familias(defeito) { return defeito === 'sem-familias' ? [] : FAMILIAS_SERIFA; }
function pularTitulo(defeito) { return defeito === 'titulo-fora'; }

module.exports = { FAMILIA, VERSAO, ARQUIVOS, FAMILIAS_SERIFA, css, peso, familias, pularTitulo };
