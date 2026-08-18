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
// O ÍNDICE AQUI É O DA PINTURA (`arteDaCena`), NÃO O DA CENA — e a diferença passou a
// importar quando os oito capítulos-esqueleto entraram. `arteDaCena` mapeia cena → pintura, e
// os dois deixaram de coincidir: a cena 13 (AINDA AQUI) usa a pintura 5, e a cena 6
// (JABAQUARA) usa a 7. Ler esta tabela pela CENA poria a arte no pacote errado, em silêncio.
//
// 0 e 1 ficam `null` de propósito: são a arte do capítulo 1, que mora na PORTA DE ENTRADA —
// é ela que segura o jogo enquanto qualquer pacote não chegou.
//
// As pinturas 7 a 11 chegaram em 09/08 e são dos capítulos em obra. Elas não têm pacote
// próprio (um pacote por capítulo-esqueleto seriam sete requisições para conteúdo que ainda
// não existe): viajam no pacote `hoje`, que é o mais tardio do arco e o mais provável de já
// ter sido baixado quando alguém chegar num deles. Quando um capítulo desses ganhar texto e
// virar capítulo de verdade, ele ganha o pacote dele e sai daqui.
//
// E FOI O QUE ACONTECEU em 2026-08-11 com as pinturas 7 e 8: JABAQUARA e A PEQUENA ÁFRICA
// deixaram de ser esqueleto, então saíram do pacote coletivo e ganharam o pacote de cada um.
// Não é arrumação: quem chega em JABAQUARA passa a baixar a pintura de JABAQUARA, e não os
// 1,3 MB de tudo o que ainda está em obra.
//
// O CAIS não aparece aqui e a ausência é a informação: ele veste a pintura `[4]`, de SALVADOR,
// até a dele chegar (o porquê está no objeto dele em src/jogo.ts). No dia em que
// `cap-cais-fundo-alto`/`-chao` entrarem, a pintura nova ganha o índice 12 e a linha dela vem
// para cá apontando `"cais"` — que é o pacote que as imagens de contexto dele já criam.
// E DE NOVO em 2026-08-12, com o lote do século XX: as pinturas 9 e 10 saíram do pacote
// coletivo. A 9 é de AS PORTAS e a 10 é de O QUE NÃO PODIA SER DITO — os dois deixaram de ser
// esqueleto. **A PRAÇA, O QUE SEGUROU e O ACEIRO vestem a pintura 10 emprestada**, e por isso
// passam a puxar o pacote `naodito`: é o mesmo desenho de O CAIS, que veste a `[4]` e puxa
// `salvador`. Quem VESTE paga o pacote de quem é DONO — não há terceira opção, porque a
// pintura é uma só e o pacote é dela.
const PACK_DA_CENA = [null, null, "palmares", "palmares", "salvador", "hoje", "hoje",
  "jabaquara", "pequenaafrica", "portas", "naodito", "hoje",
  // 12 = a pintura própria de O CAIS, que chegou em 15/08 — e esta linha veio JUNTO, como o
  // comentário acima prometia. Sem ela a pintura 12 cairia na porta de entrada em silêncio.
  "cais"];

// ---- os sprites da época, por BLOCO DE ARTE (o campo `arteCap` de EPOCAS) ----
// Índice = arteCap. É este número que HERO_CAP_B64, MOB_B64, DROP_B64, RETRATO_B64 e
// FRENTE_CAP já usam no src/jogo.ts; aqui ele só ganha um pacote.
const PACK_DO_BLOCO = [null, "palmares", "salvador", "hoje"];

// ---- o retrato de fala, por ÉPOCA (índice = posição em EPOCAS) ----
// pindorama fica na abertura (é a arte que segura o jogo); hoje idem — o retrato dela é o
// que o jogo inteiro usava até 15/08 e a CHEGADA o mostra. Os demais vão no pacote que o
// capítulo já baixa, pela regra "quem veste paga o pacote de quem é dono".
// O ÚLTIMO ERA `null` E NÃO DEVIA (18/08). Medido: o retrato de AINDA AQUI viajava na PORTA DE
// ENTRADA, 16 KB pagos por quem abre o jogo pela primeira vez e talvez nunca chegue ao capítulo
// 13. Os outros doze estão certos — só este ficou para trás, e a razão é a reindexação dos
// retratos feita nesta mesma manhã: eles passaram de índice de BLOCO DE ARTE (4 posições) para
// índice de ÉPOCA (13), e a última posição do mapa nasceu vazia sem ninguém reparar.
//
// O `null` da posição 0 é outro caso e continua certo: PINDORAMA é o capítulo 1, e a arte dele
// nunca sai da abertura por decisão — é ela que faz o jogo ter chão enquanto o pacote viaja.
//
// A conferência que pega isto de novo é de uma linha: para cada época i > 0, `PACK_DO_RETRATO[i]`
// tem de ser um dos pacotes que `pacotesDaEpoca(i)` pede. Ver o bloco 35 do `test/encaixe.js`.
const PACK_DO_RETRATO = [null, "palmares", "cais", "salvador", "jabaquara", "pequenaafrica",
  "portas", "naodito", "naodito", "naodito", "naodito", "hoje", "hoje"];

// ---- de qual bloco de arte é cada folha do HERO_B64 ----
// As chaves do bloco são `walk`, `walk2`, `walk3`, `walk4`… e o SUFIXO é o número do PEDIDO
// à mesa, não o do capítulo. Quem casa sufixo com bloco é HERO_CAP_B64 (src/jogo.ts), nesta
// ordem: sem sufixo → 0, `2` → 1, `4` → 2 (SALVADOR), `3` → 3 (AINDA AQUI).
const HERO_SUFIXO_BLOCO = { "": 0, "2": 1, "4": 2, "3": 3 };

// E O SUFIXO NÃO É "O ÚLTIMO DÍGITO DA CHAVE" — esta função existe porque a primeira versão
// achou que era, e isso classificava `atk2` (a folha de ALCANCE do capítulo 1) como sendo do
// capítulo 2. Só não virou defeito visível por acidente: `atk2` é byte a byte igual a `atk1`,
// que fica na abertura, e a regra "literal que já está paga na abertura não viaja" a segurou.
// Acidente não é projeto. Aqui os dois grupos de chave são lidos pela forma DELES:
//   · `walk` `sp` `run` levam o sufixo colado — `walk2`, `sp3`, `run4`
//   · `atk1` e `atk2` já terminam em dígito, e o sufixo do capítulo vem depois de `_`
function blocoDaChaveDoHeroi(chave) {
  let m = String(chave).match(/^(?:walk|sp|run)(\d?)$/);
  if (m) return HERO_SUFIXO_BLOCO[m[1]];
  m = String(chave).match(/^atk[12](?:_(\d))?$/);
  if (m) return HERO_SUFIXO_BLOCO[m[1] || ""];
  return undefined;   // chave que esta tabela não conhece — o build avisa
}

// ---- de qual bloco de arte é cada oitava de FRENTE_B64 ----
// A vegetação vem em pacotes de OITO elementos, um pacote por capítulo que tem vegetação.
// `FRENTE_CAP = [0, 1, -1, 2]` no src/jogo.ts diz qual pacote cada bloco usa (SALVADOR não
// usa nenhum: ladeira de pedra não tem rodapé de mata). Esta é a mesma tabela ao contrário.
const FRENTE_OITAVA_BLOCO = [0, 1, 3];

// ---- as imagens de contexto de fala, pelo prefixo do arquivo entregue ----
// A numeração dos arquivos é anterior à reordenação das épocas: cap3-* é AINDA AQUI e cap4-*
// é SALVADOR. Mesma tabela que o test/peso-composicao.js já carregava.
//
// `cap5`, `cap6` e `cap7` entraram em 2026-08-11 com os três capítulos do século XIX. O número
// continua sendo ORDEM DE PEDIDO, não posição no arco — é o que a linha acima já dizia, e vale
// repetir para ninguém tentar "consertar" a numeração e quebrar o casamento com os arquivos
// que a mesa entrega. cap5 = O CAIS · cap6 = JABAQUARA · cap7 = A PEQUENA ÁFRICA.
//
// As três chaves apontam para o pacote do PRÓPRIO capítulo, e é de propósito que O CAIS tenha
// um `pack-cais.json` antes de ter pintura própria: quando `cap-cais-fundo-alto`/`-chao`
// chegarem, eles entram nesse mesmo pacote e nada aqui muda. Enquanto a arte de contexto não
// existe, o build simplesmente não escreve o pacote e `mapaCtx` fica sem a chave — o jogo não
// pede nada e não há 404 nenhum (ver `mapaCtx` em ferramentas/construir.js).
// `cap8`, `cap9` e `cap10` entraram em 2026-08-12 com o lote do século XX:
// cap8 = AS PORTAS · cap9 = O QUE NÃO PODIA SER DITO · cap10 = A PRAÇA.
//
// ⚠ E COM O `cap10` O PADRÃO DE LEITURA MUDOU, porque ele tinha um defeito silencioso
// esperando: o recorte do prefixo era `^(cap\d)` — UM dígito. Com dez capítulos, `cap10-praca`
// casaria como `cap1`, cairia no `null` do capítulo 1 e a imagem viajaria na PORTA DE ENTRADA,
// sem erro, sem aviso e sem ninguém notar até o arquivo inicial engordar. Agora é `\d+`, nos
// dois lugares que leem o prefixo (`pacoteDoEndereco` e `conhecido`). Se um dia houver `cap100`,
// a mesma forma continua valendo.
const PACK_DO_CTX_PREFIXO = { cap1: null, cap2: "palmares", cap3: "hoje", cap4: "salvador",
  cap5: "cais", cap6: "jabaquara", cap7: "pequenaafrica",
  cap8: "portas", cap9: "naodito", cap10: "praca" };

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
    const bloco = blocoDaChaveDoHeroi(caminho[1]);
    return bloco == null ? null : (PACK_DO_BLOCO[bloco] || null);
  }
  // MOB_B64.smog[i] e RETRATO_B64[i] e DROP_B64[i][j]: o índice do capítulo é o `arteCap`.
  if (c === "MOB_B64") return PACK_DO_BLOCO[caminho[2]] || null;
  if (c === "DROP_B64") return PACK_DO_BLOCO[caminho[1]] || null;
  // RETRATO_B64 mudou de régua em 15/08: TREZE entradas, uma por ÉPOCA (os nove rostos de
  // ROSTOS.md). Cada retrato viaja no pacote que o capítulo dele JÁ PUXA — quem veste pintura
  // emprestada (A PRAÇA, O QUE SEGUROU, O ACEIRO → naodito) leva o rosto no mesmo embrulho.
  if (c === "RETRATO_B64") return PACK_DO_RETRATO[caminho[1]] || null;
  // A gente das ruas, POR ÉPOCA (16/08): caminho[1] é o id do capítulo, e cada folha viaja
  // no pacote que o capítulo já puxa — a regra dos retratos.
  if (c === "GENTE_EP_B64") {
    const PACK_DA_GENTE = { salvador: "salvador", palmares: "palmares", jabaquara: "jabaquara",
      naodito: "naodito", cais: "cais", pequenaafrica: "pequenaafrica", portas: "portas",
      praca: "naodito", segurou: "naodito", aceiro: "naodito", temfonte: "hoje", hoje: "hoje",
      pindorama: null };
    return PACK_DA_GENTE[caminho[1]] || null;
  }
  if (c === "FRENTE_B64") return PACK_DO_BLOCO[FRENTE_OITAVA_BLOCO[Math.floor(caminho[1] / 8)]] || null;
  if (c === "CTX_B64") {
    const m = String(caminho[1]).match(/^(cap\d+)/);
    return (m && PACK_DO_CTX_PREFIXO[m[1]]) || null;
  }
  if (c === "QUAD_B64") return packDaPagina(String(caminho[1]));
  if (c === "TRAV_B64") return PACK_DA_TRAVESSIA;
  return null;
}

// "FICA NA ABERTURA" TEM DUAS CAUSAS, e confundi-las é como a porta de entrada volta a crescer
// em silêncio. Uma é DELIBERADA — a arte do capítulo 1, as páginas que abrem a linha do tempo,
// o que todas as eras usam. A outra é ESQUECIMENTO: pintura nova entrou, ninguém acrescentou a
// linha aqui, e `pacoteDoEndereco` devolveu `null` sem ter opinião nenhuma. As duas produzem
// exatamente o mesmo resultado e nenhuma mensagem.
//
// Esta função separa as duas: `true` quer dizer "eu reconheço este endereço e a resposta foi
// pensada". O build avisa (sem derrubar) sobre tudo que der `false`. O saber de qual índice
// significa o quê fica AQUI, junto das tabelas — no build ele erraria: o índice do `FRENTE_B64`
// é por ELEMENTO (oito por capítulo) e não por capítulo, e essa confusão já produziu um aviso
// falso na primeira versão.
function conhecido(caminho) {
  const c = caminho[0];
  if (c === "CENARIO_ALTO_B64" || c === "CENARIO_CHAO_B64") return caminho[1] < PACK_DA_CENA.length;
  if (c === "HERO_B64") return blocoDaChaveDoHeroi(caminho[1]) != null;
  if (c === "MOB_B64") return caminho[2] < PACK_DO_BLOCO.length;
  if (c === "DROP_B64") return caminho[1] < PACK_DO_BLOCO.length;
  if (c === "RETRATO_B64") return caminho[1] < PACK_DO_RETRATO.length;
  if (c === "GENTE_EP_B64") return true;
  if (c === "FRENTE_B64") return Math.floor(caminho[1] / 8) < FRENTE_OITAVA_BLOCO.length;
  if (c === "CTX_B64") {
    const m = String(caminho[1]).match(/^(cap\d+)/);
    return !!(m && Object.prototype.hasOwnProperty.call(PACK_DO_CTX_PREFIXO, m[1]));
  }
  if (c === "QUAD_B64" || c === "TRAV_B64") return true;
  return false;
}

// Os containers cujo conteúdo pode viajar em pacote. O jogo declara os mesmos nomes em
// `ARTE_CONTAINERS` (src/jogo.ts) para saber onde devolver cada imagem quando ela chegar.
const CONTAINERS = ["CENARIO_ALTO_B64", "CENARIO_CHAO_B64", "HERO_B64", "MOB_B64",
  "DROP_B64", "FRENTE_B64", "RETRATO_B64", "GENTE_EP_B64", "CTX_B64", "QUAD_B64", "TRAV_B64"];

// `PACK_DO_RETRATO` sai daqui para o `construir.js` poder COBRAR que ele não tenha posição
// vazia — mapa escrito à mão com posição esquecida é 16 KB na porta de entrada, em silêncio.
module.exports = { PACK_DA_CENA, PACK_DO_BLOCO, PACK_DO_CTX_PREFIXO, PACK_DO_RETRATO, CONTAINERS, pacoteDoEndereco, conhecido };
