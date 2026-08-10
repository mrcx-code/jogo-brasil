// A PARTIÇÃO DA ARTE — quem viaja no arquivo de abertura e quem espera ser pedido.
//
// Motivo, com número (RELATORIO-PESO.md): o jogo levava 16,6 s para aceitar o primeiro toque
// num celular em 3G, e 91% do peso é imagem. A abertura carregava a arte dos DOZE capítulos
// antes de deixar alguém jogar o primeiro. Com a arte de cada capítulo chegando quando a
// pessoa chega nele, a abertura cai para ~8,7 s — e, o que importa mais, PARA DE CRESCER:
// capítulo novo passa a custar zero na porta de entrada.
//
// Este arquivo é lido por DOIS lados e é por isso que ele existe separado:
//   · `ferramentas/construir.js` usa as tabelas para tirar a arte do `index.html` e escrever
//     os `pack-*.json` ao lado dele;
//   · o próprio jogo recebe estas mesmas tabelas embutidas (`var __PACOTES`), e é com elas que
//     ele descobre, em tempo de jogo, quais pacotes o capítulo em que a pessoa está precisa.
// Uma tabela só, dois leitores: duas cópias divergiriam em silêncio, e o sintoma seria a
// pintura de um capítulo nascendo vazia.
//
// O QUE ENTRA NUM PACOTE, e isto foi medido antes de ser decidido: a pintura do capítulo E OS
// SPRITES DA ÉPOCA (personagem, objetos da rua, drops, vegetação, retrato). Só a pintura não
// bastava — os sprites por época são ~225 KB por capítulo, e deixá-los na abertura fazia o
// arquivo inicial voltar a crescer (8,7 s no capítulo 4 virariam 15,7 s no 12). Com eles
// dentro, a abertura fica em 8,7 s nos dois.
//
// O QUE NUNCA SAI DA ABERTURA: tudo o que o capítulo 1 usa, mais o que TODAS as eras usam
// (NPCs, decoração, ícones de HUD). O jogo tem de ser jogável no primeiro segundo, e a arte
// do capítulo 1 é justamente o chão em que ele cai quando um pacote ainda não chegou.

// ---- a pintura de cenário, por índice de CENA em CENARIO_ALTO_B64 / CENARIO_CHAO_B64 ----
// Espelha o campo `arte` de cada objeto de EPOCAS no src/jogo.ts. `null` = fica na abertura.
const PACK_DA_CENA = [null, null, "palmares", "palmares", "salvador", "hoje", "hoje"];

// ---- os sprites da época, por BLOCO DE ARTE (o campo `arteCap` de EPOCAS) ----
// Índice = arteCap. É este número que HERO_CAP_B64, MOB_B64, DROP_B64, RETRATO_B64 e
// FRENTE_CAP já usam no src/jogo.ts; aqui ele só ganha um pacote.
const PACK_DO_BLOCO = [null, "palmares", "salvador", "hoje"];

// ---- de qual bloco de arte é cada folha do HERO_B64 ----
// As chaves do bloco são `walk`, `walk2`, `walk3`, `walk4`… e o SUFIXO é o número do PEDIDO
// à mesa, não o do capítulo. Quem casa sufixo com bloco é HERO_CAP_B64 (src/jogo.ts), nesta
// ordem: sem sufixo → 0, `2` → 1, `4` → 2 (SALVADOR), `3` → 3 (AINDA AQUI).
const HERO_SUFIXO_BLOCO = { "": 0, "2": 1, "4": 2, "3": 3 };

// ---- de qual bloco de arte é cada oitava de FRENTE_B64 ----
// A vegetação vem em pacotes de OITO elementos, um pacote por capítulo que tem vegetação.
// `FRENTE_CAP = [0, 1, -1, 2]` no src/jogo.ts diz qual pacote cada bloco usa (SALVADOR não
// usa nenhum: ladeira de pedra não tem rodapé de mata). Esta é a mesma tabela ao contrário.
const FRENTE_OITAVA_BLOCO = [0, 1, 3];

// ---- as imagens de contexto de fala, pelo prefixo do arquivo entregue ----
// A numeração dos arquivos é anterior à reordenação das épocas: cap3-* é AINDA AQUI e cap4-*
// é SALVADOR. Mesma tabela que o test/peso-composicao.js já carregava.
const PACK_DO_CTX_PREFIXO = { cap1: null, cap2: "palmares", cap3: "hoje", cap4: "salvador" };

// ---- as páginas verticais (QUAD_B64) ----
// `p1`..`p6` abrem a linha do tempo e ficam na abertura — são as primeiras coisas que alguém
// vê ao tocar A HISTÓRIA. As com sufixo (`p08-captura`, `p09-navio`…) são as cinco da
// TRAVESSIA. O resto é o corpo da linha do tempo, que só existe dentro daquela tela.
function packDaPagina(chave) {
  if (/^p[1-6]$/.test(chave)) return null;
  if (/^p\d+-/.test(chave)) return "travessia";
  return "historia";
}

// A PINTURA DA TRAVESSIA (TRAV_B64) inteira vai com a travessia.
const PACK_DA_TRAVESSIA = "travessia";

// ---------------------------------------------------------------------------------------
// De um ENDEREÇO de arte para o pacote dele. O endereço é o caminho da literal dentro da
// fonte — `["CENARIO_ALTO_B64", 2]`, `["HERO_B64", "walk2", 0]`, `["MOB_B64", "smog", 1]` —
// e quem os extrai é o `ferramentas/construir.js`. Devolver `null` significa "fica na
// abertura", e é a resposta certa para tudo o que não estiver nomeado aqui: um bloco de arte
// novo que ninguém classificou pesa na porta de entrada, o que é ruim, mas nunca some do
// jogo, o que seria pior.
function pacoteDoEndereco(caminho) {
  const c = caminho[0];
  if (c === "CENARIO_ALTO_B64" || c === "CENARIO_CHAO_B64") return PACK_DA_CENA[caminho[1]] || null;
  if (c === "HERO_B64") {
    const m = String(caminho[1]).match(/(\d)$/);
    const bloco = HERO_SUFIXO_BLOCO[m ? m[1] : ""];
    return bloco == null ? null : (PACK_DO_BLOCO[bloco] || null);
  }
  // MOB_B64.smog[i] e RETRATO_B64[i] e DROP_B64[i][j]: o índice do capítulo é o `arteCap`.
  if (c === "MOB_B64") return PACK_DO_BLOCO[caminho[2]] || null;
  if (c === "RETRATO_B64" || c === "DROP_B64") return PACK_DO_BLOCO[caminho[1]] || null;
  if (c === "FRENTE_B64") return PACK_DO_BLOCO[FRENTE_OITAVA_BLOCO[Math.floor(caminho[1] / 8)]] || null;
  if (c === "CTX_B64") {
    const m = String(caminho[1]).match(/^(cap\d)/);
    return (m && PACK_DO_CTX_PREFIXO[m[1]]) || null;
  }
  if (c === "QUAD_B64") return packDaPagina(String(caminho[1]));
  if (c === "TRAV_B64") return PACK_DA_TRAVESSIA;
  return null;
}

// Os containers cujo conteúdo pode viajar em pacote. O jogo declara os mesmos nomes em
// `ARTE_CONTAINERS` (src/jogo.ts) para saber onde devolver cada imagem quando ela chegar.
const CONTAINERS = ["CENARIO_ALTO_B64", "CENARIO_CHAO_B64", "HERO_B64", "MOB_B64",
  "DROP_B64", "FRENTE_B64", "RETRATO_B64", "CTX_B64", "QUAD_B64", "TRAV_B64"];

module.exports = { PACK_DA_CENA, PACK_DO_BLOCO, PACK_DO_CTX_PREFIXO, CONTAINERS, pacoteDoEndereco };
