// A CATRACA DA PINTURA FORA DO CENSO — o que `decorativoInerte` ABSOLVE tem de pintar ZERO PIXEL
//
//   node test/qa-censo-pintura-fora.js
//
// POR QUE ESTE ARQUIVO EXISTE, e a frase que o pediu (03/09). O `ferramentas/cartao-censo.js`
// absolve um elemento por três coisas ao mesmo tempo:
//
//     decorativoInerte = aria-hidden="true"  E  innerText vazio  E  !pinta()
//
// A terceira é uma ENUMERAÇÃO de mecanismos de CSS, e ela está do lado que REPROVA: para o
// mecanismo que ninguém escreveu, `pinta()` devolve falso, `!pinta()` vira verdade, e o elemento é
// ABSOLVIDO — em silêncio, com o portão verde e a tinta no cartão publicado. A entrega de 03/09
// declarou um teto de mecanismos e a justificativa dele estava ERRADA (dizia que esquecer viraria
// "reprovação barulhenta"); o teto declarado também estava errado, **por dois** — `list-style-image`
// e `content:url()` não estavam nele. A frase caiu no mesmo dia. **O buraco não.**
//
// A DOENÇA É A MESMA DO CABEÇALHO DO `cartao-censo.js`: lista finita contra universo infinito. Lá
// a cura foi virar a lista de lado (default-deny). Aqui não dá para virar: não existe "default-deny
// de pintura" que uma função rodando DENTRO da página possa perguntar — `censoDoQuadro` roda no
// `pg.evaluate` e não tem câmera. Então a cura é outra, e é o que este arquivo faz:
//
//   **UM ORÁCULO DE PIXEL, e uma CATRACA em cima dele.** O oráculo tem câmera (Playwright), então
//   ele não precisa de lista nenhuma para responder "isto pintou?". A catraca compara a resposta
//   do oráculo com a resposta do censo, mecanismo a mecanismo, e REPROVA toda divergência que não
//   esteja registrada aqui com o número que ela mediu.
//   Acrescentar mecanismo ao catálogo não pede mudança nenhuma no corpo do teste; se ele fugir, a
//   catraca fica vermelha sozinha e diz o nome dele.
//
//   ⚠ **O QUE O VERDE DESTA CATRACA SIGNIFICA — e o que ele NÃO significa.** Esta linha dizia, até
//   03/09, que verde passava a significar *"o conjunto de fugas é exatamente o registrado"*. **Não
//   significa, e a frase caiu com número** (QA cruzado de 03/09, auditando `censo-cinco-fugas-medidas`).
//   O verde significa o que está medido e nada além: **dos mecanismos que o catálogo enumera, os
//   que fogem são exatamente os registrados — **pelo NOME, e só pelo nome.** Mecanismo fora do
//   catálogo continua sem ninguém medindo — foi assim que o `::before::marker` apareceu como
//   **8ª fuga**: a catraca **PEGA** ela quando escrita à mão, mas ninguém a pôs no catálogo, então
//   nenhuma execução a exercita. **Rede furada é melhor que rede nenhuma; não é rede fechada.**
//
//   ⚠ **E O NÚMERO AO LADO DO NOME NÃO É COBRADO POR NADA.** Esta caixa dizia *"com o tamanho
//   registrado"* — escrito por mim nesta rodada, e **derrubado pelo QA na auditoria desta própria
//   entrega, horas depois.** A comparação é `!(n in FUGAS_REGISTRADAS)` (linha ~429): testa a
//   **chave**, e o valor ao lado nunca é lido. Registrar um mecanismo com o número errado — typo,
//   número copiado de outra fuga — passa **verde**. Provado com exit code real: mecanismo
//   registrado com **1 px** contra fuga que mede **495 px** → **exit 0**, reproduzido 2×.
//   Cobrado agora por `test/qa-catraca-tamanho-ignorado.js`, que **registra** o buraco em vez de o
//   descrever: no dia em que alguém fizer o valor ser comparado, aquele arquivo fica vermelho
//   sozinho pedindo para ser apagado.
//
//   **A frase caiu na MESMA caixa em que eu já tinha corrigido dois números no mesmo dia**, e essa
//   é a lição de método: quem acaba de se corrigir duas vezes numa frase para de reler a metade
//   que sobrou. Corrigir uma afirmação não vacina as vizinhas.
//
//   Reproduzido em 03/09 por `nuvem-20260903T1623`, com exit code real:
//     CATRACA_EXTRA_NOME=pseudoMarkerDoPseudo \
//     CATRACA_EXTRA_ESTILO='.qaFuga::before{content:"";display:list-item;list-style-type:none}
//                           .qaFuga::before::marker{content:"XXXXX";color:#f00;font-size:40px}' \
//     node test/qa-censo-pintura-fora.js      →  exit 1 · "FUGA pseudoMarkerDoPseudo 495 px"
//
//   **E o 495 não contradiz os 183 px que o QA mediu — os dois estão certos, e a diferença é o
//   aviso.** O tamanho de uma fuga é propriedade da REGRA que se escreve (aqui, um marcador de
//   40 px), não do mecanismo. Então número de fuga no catálogo é referência da regra que o mediu,
//   nunca constante do CSS: ao registrar um mecanismo, registre a regra junto, senão o próximo a
//   medir acha que achou divergência quando só mudou a tinta.
//
// O ORÁCULO, e por que ele é `visibility:hidden` e não uma segunda carga da página.
// A primeira versão desta sonda comparava DUAS CARGAS (uma com o mutante, outra sem) e mediu
// `zoom:2` como fuga de **49.737 px**. Não era: `zoom:2` dobra a caixa, EMPURRA o resto da
// `.lista`, e o diff contava o deslocamento dos vizinhos como tinta do mutante. Isso é ruído de
// instrumento com cara de achado — e o `span.vaoMedida` real EXISTE para ocupar espaço, então
// "deslocou" nunca poderia ser o critério.
// O oráculo certo é `visibility:hidden` no PRÓPRIO mutante, na MESMA carga: o leiaute não muda um
// pixel, e a pintura dele — `::before`, `::after`, `::marker` e a alça de `resize` incluídos —
// some nos casos que o catálogo cobre. Medido depois da troca: `zoom:2` = **0 px**, que é a
// resposta certa.
//
// ⚠ **DUAS FRASES JÁ ERRARAM SOBRE "POR CONSTRUÇÃO" NESTE PARÁGRAFO, E A HISTÓRIA FICA AQUI EM VEZ
// DE SER APAGADA.** A primeira dizia que o diff era *"por construção, exatamente os pixels que
// aquele elemento pinta"*. Caiu com dois furos medidos pelo QA cruzado em 03/09 — FURO A
// (`visibility` é herdada, e um `::before` podia redeclarar `visibility:visible` e continuar
// pintando depois de o hospedeiro já estar `hidden` — o oráculo lia 0 px onde a tinta era de
// centenas) e FURO B (o recorte de 48 px de folga perdia tinta deslocada além dele).
//
// OS DOIS FORAM FECHADOS EM 03/09 (item `censo-oraculo-dois-furos`, parte B), e o conserto NÃO foi
// "esconder melhor" — foi trocar O QUE o oráculo desliga. Hoje, ao medir se o mutante pintou,
// ele (1) põe `visibility:hidden` NO HOSPEDEIRO — layout-neutro, e já bastava para todo mecanismo
// que pinta pela CAIXA do próprio elemento (border, background, outline, box-shadow, backdrop-
// filter, border-image, o `::marker` PADRÃO de `list-item`, a alça de `resize`, `content`
// substituído) — E (2) DESLIGA A FOLHA DE ESTILO inteira que `injetar()` cria para `arg.estilo`
// (`disabled=true`, não `visibility`). Como a declaração `content` que cria QUALQUER pseudo-
// elemento do mutante vive NAQUELA MESMA folha, desligá-la apaga o `::before`/`::after` por
// inteiro — não sobra pseudo nenhum para ter `visibility` própria, então não há herança para
// recusar. Duas tentativas mais óbvias foram MEDIDAS e DESCARTADAS antes desta (apagar o nó do
// DOM; resetar o `style.cssText` inteiro) — as duas quebravam o LEIAUTE da `.lista` (que é
// `display:flex`) para mecanismos que mudam o tamanho da caixa, como `zoom`, trocando os dois
// furos por um terceiro maior. A explicação inteira, com os números desta máquina, está junto do
// oráculo em si, mais abaixo. O recorte também mudou — ver `FOLGA`.
//
// A SEGUNDA FRASE, escrita nesta mesma correção: **não a repito.** "Por construção, completo" já
// errou uma vez neste parágrafo — o que fica é que os DOIS furos medidos (herança de `visibility`
// e recorte curto) estão fechados, cobrados por regressão no próprio CATÁLOGO
// (`pseudoLonge` — FECHADO, prova que a folga alargada alcança tinta a 330 px) e não que nenhum
// furo A/B-like possa existir de novo — a próxima prova disso é medir, não declarar.
//
// UM TERCEIRO MECANISMO FICOU ABERTO NA MESMA RODADA, DECIDIDO EM VEZ DE FECHADO:
// `netoMarkerCustom` — o `::marker` de um `::before`/`::after` (o "neto"), com `content` próprio.
// Ver a entrada dele no CATÁLOGO logo abaixo para a medição e a decisão por extenso; fica
// registrado em `FUGAS_REGISTRADAS`, não fechado em `pinta()`, porque `getComputedStyle` não
// resolve pseudo-elemento encadeado — provado, não suposto.
//
// O INSTRUMENTO QUE MEDIA OS DOIS FUROS ANTIGOS, `test/qa-catraca-oraculo.js`, FOI APAGADO NESTA
// ENTREGA (03/09, parte B). Ele reproduzia, à parte e sem chamar este arquivo, a estratégia ANTIGA
// (só `visibility:hidden`, sem desligar a folha) — e por ser uma cópia independente, ele NÃO ficou
// vermelho sozinho quando o oráculo real mudou (a promessa de "fica vermelho sozinho", escrita por
// quem o trouxe, não se sustentou: é uma reprodução hardcoded da estratégia antiga, não um teste
// do código de produção). Confirmado com exit code real, ANTES de apagar: rodado sem tocar uma
// linha, ele continuou `ok` — mede uma propriedade de "`visibility:hidden` sozinho, sem desligar a
// folha" que é verdadeira para sempre, independente do que este arquivo faz hoje. O que prova que
// os furos fecharam DE VERDADE, aqui, é `pseudoLonge` (FECHADO no catálogo abaixo) e a ausência
// estrutural de qualquer `visibility` sobrevivente para recusar — os dois medidos NESTE arquivo,
// que é o que roda no portão.
//
// O PISO DE RUÍDO, e ele é cobrado por exit code em CADA medição.
// O mapa do TERRITÓRIO anima sozinho. Comparar o quadro INTEIRO de 1200x630 dá diferença sem
// mutante nenhum — medido nesta máquina em várias execuções: entre **~1100 e ~1108 px**, e isso
// acusaria dezenas de fugas falsas. O recorte na caixa do mutante mais a folga (`FOLGA`, hoje
// 400 px — ver o comentário ao lado da constante) zera o piso NESTA POSIÇÃO (medido nos nove
// valores de folga entre 48 e 400, zero nos nove), e o zero é COBRADO, não confiado: antes de
// trocar qualquer coisa, o teste tira DUAS fotos idênticas do mesmo recorte e exige diferença
// zero. Instrumento que não cobra o próprio piso mede ruído e chama de achado — foi o que quase
// aconteceu duas vezes aqui.
//
// ELA JÁ FOI VISTA MORDENDO, das duas maneiras (EQUIPE.md 2.8 — instrumento que ninguém viu
// reprovando é decoração), e as duas com exit code REAL:
//
//   1) EM MECANISMO QUE NINGUÉM TINHA ESCRITO — nem na régua, nem neste catálogo, nem no
//      registro. Na primeira vez em que a catraca rodou contra a régua já corrigida:
//        CATRACA_EXTRA_NOME=pseudoItemDeLista \
//        CATRACA_EXTRA_ESTILO='.qaFuga::before{content:"";display:list-item;list-style-type:disc}' \
//        node test/qa-censo-pintura-fora.js        →  exit 1
//        "FUGA pseudoItemDeLista 25 px censo=ABSOLVE"
//      Era um buraco de verdade: o pseudo-elemento virando item de lista ganha um `::marker`
//      PRÓPRIO, uma camada abaixo do que a régua olhava. Foi fechado no mesmo commit, entrou no
//      catálogo pelo nome, e hoje o mesmo comando devolve exit 0 com ele marcado FECHADO — que é
//      o contraponto, e é o que impede a asserção de virar "reprova tudo".
//
//   2) EM RÉGUA CEGADA DE PROPÓSITO — a mordida que continua reproduzível depois de o buraco
//      fechar, porque não depende de existir uma fuga nova:
//        CATRACA_CEGA="s.backdropFilter !== 'none'" node test/qa-censo-pintura-fora.js  →  exit 1
//        "FUGA backdropFilter 5700 px" + "FUGA pseudoBackdrop 3600 px"
//      Ela troca aquele pedaço por `false` na função que o Playwright serializa. Sem o env, exit 0.
//
// O QUE ESTE ARQUIVO NÃO RESOLVE, dito em vez de escondido — e o primeiro item foi achado
// FURANDO ESTA MESMA CATRACA de propósito, depois de escrita, com número.
//
//   1. **PINTURA QUE NÃO É DO PRÓPRIO ELEMENTO — o furo, e ele é grande.** O oráculo (mesmo
//      depois da parte B) segue medindo só o que o MUTANTE INJETADO pinta — é o `.qaFuga` que
//      ele acende e apaga. Um mutante que apenas RE-ESTILIZA conteúdo JÁ ACEITO (não injeta nada
//      novo, só muda a folha de um elemento que o censo já aprovou) escapa das duas pontas ao
//      mesmo tempo:
//        CATRACA_EXTRA_NOME=furoVizinho \
//        CATRACA_EXTRA_ESTILO='.lista .pl{background:#0f0}' node test/qa-censo-pintura-fora.js
//      devolve `inerte 0 px censo=ABSOLVE` e **exit 0** — reproduzido em 03/09
//      (`nuvem-20260903T2022`) e confirmado: o oráculo não muda porque o `.qaFuga` que ele liga e
//      desliga é OUTRO elemento, nunca o `.pl` que a regra mira. O que muda de verdade é a caixa
//      da `.lista`: **15.118 px** nesta máquina (medido fora da catraca, comparando a MESMA
//      captura antes/depois de aplicar a regra, sem mutante nenhum — o registro anterior, de
//      outra máquina, tinha **15.135 px**; a mesma disciplina do resto deste arquivo: o que se
//      cobra é a ORDEM DE GRANDEZA e o fenômeno, não a constante). O censo não vê porque as
//      tábuas de lugar são PERMITIDAS por IDENTIDADE (href/rótulo) e nunca pergunta como elas SE
//      PARECEM; o oráculo não vê porque ele só fotografa o `.qaFuga` que injeta, e este mutante
//      não injeta nada.
//      É a mesma CLASSE do `q107c` de `test/qa-censo-passo2.js` (texto entrando por `::after` de
//      uma tábua aceita), que já está lá declarado como ALCANCE não cobrado.
//
//      DECISÃO (item `censo-restilizar-o-aceito`, 03/09, `nuvem-20260903T2022`): **NÃO** fechar
//      agora — fica registrado como ALCANCE aberto, com o número, não como buraco escondido. As
//      duas contas que sustentam o NÃO, medidas antes de decidir (não supostas):
//        · **O custo de FECHAR** seria de outra ORDEM que os 48 mecanismos acima: aqui o
//          catálogo testa UM mutante injetado contra UMA caixa fixa. Comparar APARÊNCIA do
//          aceito contra referência pediria uma imagem de referência por ELEMENTO ACEITO — os 9
//          do TERRITÓRIO (4 links da `.barra` + 5 `button.pl`) mais os 4 links da `.barra` em
//          cada uma das outras quatro páginas — **25 referências**, cada uma sujeita ao MESMO
//          piso de ruído do mapa que animou este arquivo inteiro (~1100 px no quadro cheio desta
//          máquina) e que precisaria ser medido e recortado 25 vezes, não 1. E teria de ser
//          RE-BASELINED a cada conteúdo novo — arte de capítulo, PONTO novo no mapa, mudança de
//          rótulo —, que é exatamente o tipo de evento que este repositório já tem com
//          frequência (ver `docs/arquivo/`, a evolução ano a ano do §8 do `CLAUDE.md`). Referência
//          que precisa ser re-aprovada toda hora ou vira ruído que alguém ignora (ela reprova o
//          certo) ou vira rito que ninguém confere de verdade (ela deixa de proteger) — as duas
//          são o modo de falha que este arquivo inteiro existe para evitar do outro lado.
//        · **O custo de DEIXAR ABERTO** é o de hoje: **15.118 px** de mudança visível sem
//          reprovação, **mas** o vetor exige ESCREVER CSS no repositório (a `arg.estilo` só
//          existe porque `CATRACA_EXTRA_ESTILO` a injeta como sonda de teste; no mundo real, o
//          equivalente é editar `territorio/index.html`/`src/estilo.css` e mandar pelo build) —
//          é a MESMA fronteira de confiança que qualquer outra linha de `src/` ou `ferramentas/`:
//          quem tem acesso de commit já pode mudar o que o cartão mostra de dezenas de outras
//          formas sem precisar deste furo específico. Não é um vetor de runtime (XSS, conteúdo de
//          usuário) — é a mesma classe do `q107c`, que já está aberto há mais tempo sem incidente.
//      Se a conta acima mudar — um vetor de RUNTIME aparecer, ou o custo de referência cair por
//      alguma técnica que não pede 25 baselines —, a decisão é revisitável; até lá, fechar com
//      "não, e aqui está o número" é o desfecho deste item, não uma pendência.
//
//   2. **UMA SUPERFÍCIE SÓ.** Tudo aqui é medido no `territorio/index.html`, na `.lista`. Um
//      mecanismo cuja tinta dependa do que está ATRÁS (é o caso de `backdrop-filter`) pode medir
//      diferente noutra das cinco páginas. O varrimento das cinco continua sendo do bloco 1 de
//      `test/qa-censo-passo2.js`, que cobra ZERO falso-positivo em cada uma.
//
//   3. **O CATÁLOGO CONTINUA SENDO UMA LISTA**, e mecanismo que não está nele não é medido. A
//      diferença em relação ao teto de ontem é de NATUREZA, não de tamanho: a lista de ontem
//      estava dentro da RÉGUA e absolvia em silêncio o que não conhecia; esta está dentro do
//      TESTE e, para tudo o que conhece, a resposta vem da CÂMERA. Acrescentar um nome aqui custa
//      uma linha e nenhum raciocínio — e a linha vermelha aparece sozinha se a régua não o cobrir.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');
const CENSO = require('../ferramentas/cartao-censo.js');

const RAIZ = path.resolve(__dirname, '..');
const L = CENSO.L, A = CENSO.A;
const ARQ = path.join(RAIZ, 'territorio', 'index.html');
let falhas = 0;
function ok(cond, msg) { console.log((cond ? '  ok  ' : '  X   ') + msg); if (!cond) falhas++; return !!cond; }

// Uma imagem de 40x40 vermelha, em `data:` — nenhuma referência externa, nem aqui.
const SVG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22'
  + ' height=%2240%22%3E%3Crect width=%2240%22 height=%2240%22 fill=%22%23ff0000%22/%3E%3C/svg%3E';

// ------------------------------------------------------------------------------------ O CATÁLOGO
// Cada entrada é UM jeito de um `<span aria-hidden="true">` SEM TEXTO aparecer (ou não) na foto.
// Ninguém aqui é "esperado pintar" ou "esperado não pintar": quem responde é a câmera. O que o
// catálogo faz é dizer O QUE MEDIR — e é por isso que os que pintam zero ficam, em vez de serem
// apagados por serem "chatos": eles são a prova de que a régua não virou "reprova tudo".
const CATALOGO = {
  // os seis já fechados em 03/09 — ficam para a catraca ver se algum reabre num refactor
  border: { css: 'border:4px solid red' },
  backgroundColor: { css: 'background-color:#ff00ff' },
  backgroundAtalho: { css: 'background:#00ff00' },
  outline: { css: 'outline:4px solid #00ffff' },
  outlineComRecuo: { css: 'outline:3px solid #00ffff;outline-offset:9px' },
  boxShadow: { css: 'box-shadow:0 0 0 6px #ffcc00' },
  pseudoAfter: { estilo: '.qaFuga::after{content:"";display:block;width:150px;height:38px;background:#ff3300}' },
  pseudoBefore: { estilo: '.qaFuga::before{content:"";display:block;width:150px;height:38px;background:#33ff00}' },
  pseudoTexto: { estilo: '.qaFuga::after{content:"MEDIÇÃO";color:#fff;background:#333}' },

  // as CINCO fugas medidas pelo QA em 03/09 e fechadas nesta entrega
  backdropFilter: { css: 'backdrop-filter:invert(1)' },
  borderImage: { css: 'border-image:linear-gradient(#f00,#00f) 30 / 10px' },
  marcadorDisco: { css: 'display:list-item;list-style-type:disc;color:#ff0000;margin-left:20px' },
  listStyleImage: { css: 'display:list-item;list-style-image:url("' + SVG + '");margin-left:44px' },
  contentUrl: { css: 'content:url("' + SVG + '")' },

  // as VARIANTES que a forma ingênua de cada conserto deixaria passar — cada uma achada por pixel
  contentGradiente: { css: 'content:linear-gradient(#f00,#00f)' },
  contentImageSet: { css: 'content:image-set(url("' + SVG + '") 1x)' },
  marcadorTipoTexto: { css: 'display:list-item;list-style-type:"AB";color:#f00;margin-left:30px' },
  marcadorPseudoContent: { css: 'display:list-item;margin-left:30px', estilo: '.qaFuga::marker{content:"XX";color:#ff0000}' },
  pseudoBackdrop: { estilo: '.qaFuga::after{content:"";display:block;width:120px;height:30px;backdrop-filter:blur(6px) invert(1)}' },
  pseudoBorderImage: { estilo: '.qaFuga::after{content:"";display:block;width:100px;height:30px;border-image:linear-gradient(#0f0,#00f) 30 / 8px}' },
  // A SÉTIMA, achada PELA CATRACA deste arquivo depois de as seis primeiras estarem fechadas: o
  // pseudo-elemento vira item de lista e ganha um `::marker` próprio. 25 px, censo absolvia.
  pseudoItemDeLista: { estilo: '.qaFuga::before{content:"";display:list-item;list-style-type:disc;color:#f00;margin-left:20px}' },
  pseudoItemDeListaImagem: { estilo: '.qaFuga::after{content:"";display:list-item;list-style-image:url("' + SVG + '");margin-left:44px}' },

  // A NONA — REGRESSÃO DO FURO B (`test/qa-catraca-oraculo.js`), acrescentada em 03/09 na parte B
  // de `censo-oraculo-dois-furos`: um `::before` com a tinta a 330 px da caixa do mutante, dentro
  // dos 400 px de folga de hoje e fora dos 48 px de antes. Com a folga alargada, a câmera E o
  // oráculo enxergam os dois, e este mecanismo devolve `FECHADO` — é o contraponto que prova que a
  // folga maior fecha o furo, e não só o desloca.
  pseudoLonge: { estilo: '.qaFuga::before{content:"";display:block;width:60px;height:30px;background:#0ff;margin-left:330px}' },
  // A DÉCIMA — O `::marker` DE UM PSEUDO-ELEMENTO (o "neto"), acrescentada em 03/09 na parte B.
  // Achada por `test/qa-catraca-oraculo.js` como o CONTRAPONTO da prova dos furos: um `::before`
  // que vira item de lista com `list-style-type:none` (sem marcador PADRÃO) mas ganha um `::marker`
  // PRÓPRIO, com `content` custom, por uma regra `.qaFuga::before::marker{...}` — 367 px nesta
  // máquina (183–495 px conforme a máquina, a mesma disciplina do resto do catálogo: o que se
  // cobra é a relação, não a constante).
  //
  // DECISÃO (item 1, sub-item 3, `censo-oraculo-dois-furos` parte B): ENTRA no catálogo — SIM.
  // Não fica fora só porque é raro ou difícil: é um mecanismo de pintura real, e a régua deste
  // arquivo é "o que a câmera vê", não "o que é fácil de perguntar". Mas ele NÃO foi fechado em
  // `pinta()` (`ferramentas/cartao-censo.js`), e a razão é medida, não preguiça: `getComputedStyle`
  // não resolve pseudo-elemento ENCADEADO. Provado com uma sonda (`getComputedStyle(e,
  // '::before::marker')`) contra a MESMA regra que pinta 367 px na câmera: devolve uma
  // `CSSStyleDeclaration` VAZIA — `content=''`, `display=''` — enquanto `getComputedStyle(e,
  // '::before')` e `getComputedStyle(e, '::marker')` (os dois de UM nível só) funcionam normalmente.
  // Não há como `censoDoQuadro` — que roda dentro do `pg.evaluate`, sem câmera — perguntar ao
  // navegador "o `::marker` do `::before` deste elemento pinta?": a única alternativa seria
  // reimplementar o casamento de seletor CSS por cima de `document.styleSheets`, textualmente, o
  // que é uma ORDEM DE FRAGILIDADE diferente do resto deste módulo (que já desconfia de listas —
  // ver o cabeçalho) e trocaria uma fuga medida por um falso-positivo ou falso-negativo não
  // medido. Fica registrado em `FUGAS_REGISTRADAS`, ao lado do `fundoClipTexto` em
  // `FALSOS_REGISTRADOS`: dívida declarada, não buraco escondido.
  netoMarkerCustom: {
    estilo: '.qaFuga::before{content:"";display:list-item;list-style-type:none}'
      + ' .qaFuga::before::marker{content:"XXXX";color:#ff0000;font-size:20px}',
  },

  // A SEXTA, que não estava em teto nenhum — nem no declarado, nem no que o corrigiu.
  agarraAuto: { css: 'resize:both;overflow:auto' },
  agarraHidden: { css: 'resize:both;overflow:hidden' },
  agarraVertical: { css: 'resize:vertical;overflow:auto' },

  // O LADO QUE ABSOLVE — medido, não confiado. Se algum destes virar RECUSA, o conserto trocou o
  // falso-negativo por um falso-positivo do mesmo tamanho, e a catraca diz qual.
  nada: {},
  contentTexto: { css: 'content:"XXXX";color:#f00' },
  marcadorSemTipo: { css: 'display:list-item;list-style-type:none' },
  marcadorContentVazio: { css: 'display:list-item;list-style-type:none;margin-left:30px', estilo: '.qaFuga::marker{content:"";background:#f00}' },
  agarraSemOverflow: { css: 'resize:both' },
  borderImageSemLargura: { css: 'border:0 solid transparent;border-image:linear-gradient(#0f0,#f0f) 30 / 0 / 14px' },
  zoom: { css: 'zoom:2' },
  filtroDropShadow: { css: 'filter:drop-shadow(0 0 8px #f00)' },
  filtroInverte: { css: 'filter:sepia(1) invert(1)' },
  mascara: { css: 'mask:linear-gradient(#000,#000)' },
  clipPath: { css: 'clip-path:circle(40%)' },
  primeiraLinha: { estilo: '.qaFuga::first-line{background:#f00}' },
  barraDeRolagem: { css: 'overflow:scroll', estilo: '.qaFuga::-webkit-scrollbar{width:12px;background:#ff0000}' },
  regraDeColuna: { css: 'column-count:2;column-rule:6px solid #f0f' },
  cursorUrl: { css: 'cursor:url("' + SVG + '"),auto' },
  caretColor: { css: 'caret-color:#f00' },
  textShadow: { css: 'text-shadow:0 0 9px #f00' },
  boxReflect: { css: '-webkit-box-reflect:below 2px linear-gradient(transparent,#f00)' },
  aparencia: { css: '-webkit-appearance:menulist;appearance:auto' },
  misturaBlend: { css: 'mix-blend-mode:difference;isolation:isolate' },
  fundoClipTexto: { css: 'background:linear-gradient(#f00,#00f);-webkit-background-clip:text;color:transparent' },
};

// ------------------------------------------------------------------------------------- A CATRACA
// Os dois registros abaixo SÃO a catraca. Vazio no primeiro é o estado desta entrega; qualquer
// coisa que apareça e não esteja escrita aqui deixa o exit code vermelho, com o nome e o número.
//
// FUGA = a câmera vê tinta E o censo absolve. É o buraco. A próxima fuga tem de ser DECIDIDA por
// alguém (escrevendo o nome aqui, com o número que ela mede) em vez de aparecer sozinha no cartão
// publicado.
//
// UMA FUGA FICA, DECIDIDA EM 03/09 (item 1, sub-item 3, `censo-oraculo-dois-furos` parte B):
// `netoMarkerCustom` — o `::marker` de um `::before`/`::after` (o "neto" do pseudo), com `content`
// próprio, quando o pseudo em si usa `list-style-type:none` (sem marcador PADRÃO para
// `pintaMarcador`/`pseudoPinta` fecharem). Ver o comentário ao lado da entrada no CATÁLOGO acima
// para a medição que provou a causa: `getComputedStyle` não resolve pseudo-elemento encadeado
// (`::before::marker` devolve uma `CSSStyleDeclaration` vazia), então `ferramentas/cartao-
// censo.js` não tem como perguntar ao navegador se aquilo pinta — e reimplementar casamento de
// seletor CSS por cima de `document.styleSheets` é uma ordem de fragilidade diferente do resto
// deste módulo. Fica registrada, ao lado do `fundoClipTexto` em `FALSOS_REGISTRADOS`: dívida
// declarada, não buraco escondido — e a régua deste arquivo continua cobrando o TAMANHO dela.
const FUGAS_REGISTRADAS = { netoMarkerCustom: 367 };

// FALSO-POSITIVO = a câmera não vê tinta E o censo recusa. Não é buraco de segurança — é a régua
// sendo mais paranoica que o navegador —, mas é dívida, porque régua que reprova o certo é a
// primeira que alguém afrouxa inteira (cabeçalho do `cartao-censo.js`). Cada um fica registrado
// com o motivo e com o número medido, e a catraca impede que a lista CRESÇA sem alguém decidir.
const FALSOS_REGISTRADOS = {
  // `background-image` posto só para colorir TEXTO (`background-clip:text`) com o elemento vazio:
  // não há letra para recortar, então nada aparece. A régua vê `backgroundImage !== 'none'` e
  // recusa. Manter é o lado seguro: o dia em que houver texto, ele pinta.
  fundoClipTexto: 'background-image existe mas está recortado em texto que não existe',
};

// ---------------------------------------------------------------------- A PÁGINA, COMO O CARTÃO A VÊ
// Cópia declarada da exclusão de `test/qa-censo-passo2.js` (que por sua vez copia a do gerador):
// sem ela eu mediria a página num estado que o cartão nunca fotografa.
async function excluir(pg) {
  return pg.evaluate(() => {
    const ALVOS_CONTROLE = 'button, [role="button"], input, select, summary';
    const esconder = (e) => { if (e && e.style.display !== 'none') e.style.display = 'none'; };
    document.querySelectorAll('.med').forEach(esconder);
    const b = document.getElementById('medirBt'); if (b) esconder(b);
    document.querySelectorAll('.vaoMedida').forEach(esconder);
    document.querySelectorAll('body *').forEach((e) => {
      const s = getComputedStyle(e);
      if ((s.position === 'fixed' || s.position === 'sticky') && e.matches(ALVOS_CONTROLE)) esconder(e);
    });
    document.querySelectorAll('.barra').forEach((x) => { x.style.scrollPaddingRight = '0px'; x.scrollLeft = 0; });
    const a = document.querySelector('.barra a.aqui');
    if (a && a.scrollIntoView) a.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    window.scrollTo(0, 0);
  });
}
async function abrirPagina(nav) {
  const pg = await nav.newPage({ viewport: { width: L, height: A }, deviceScaleFactor: 1 });
  await pg.goto(ABRIR('file:///' + ARQ.split(path.sep).join('/')));
  await pg.evaluate(() => document.fonts.ready).catch(() => {});
  await pg.waitForFunction('window.__pronto === true', null, { timeout: 8000 }).catch(() => {});
  await pg.waitForTimeout(600);
  return pg;
}

// O MUTANTE VAI NA `.lista`, NUNCA NA `.barra` — armadilha registrada pelo QA em 03/09 e
// reconferida aqui: a `.barra` tem `overflow-x:auto` e empurra o mutante para fora da janela do
// contêiner, fabricando um "escapou da caixa de rolagem" que é do instrumento, não da régua. A
// `.lista` das tábuas de lugar não rola e é `dono` provado do mesmo jeito.
function injetar(arg) {
  const l = document.querySelector('.lista');
  if (!l) throw new Error('nao achei .lista (a .barra NAO serve — overflow-x:auto tira o mutante da janela)');
  // `id="qaEstilo"` (não só a var local `st`, que este `evaluate` não devolve): é o gancho que o
  // ORÁCULO usa para DESLIGAR a folha inteira mais tarde — ver o motivo perto de `window.__qaFuga`.
  if (arg.estilo) {
    const st = document.createElement('style');
    st.id = 'qaEstilo';
    st.textContent = arg.estilo;
    document.head.appendChild(st);
  }
  const s = document.createElement('span');
  s.className = 'qaFuga';
  s.setAttribute('aria-hidden', 'true');   // o MESMO atributo do vão real
  // e NENHUM texto: é exatamente o par que `decorativoInerte` absolve
  let base = 'box-sizing:border-box;display:inline-block;width:150px;height:38px;vertical-align:middle;';
  if (arg.css) base += arg.css;
  s.style.cssText = base;
  l.appendChild(s);
  window.__qaFuga = s;
  const r = s.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

// O RECORTE: a caixa do mutante mais FOLGA px, presa dentro do quadro. A folga não é enfeite —
// `outline-offset`, `box-shadow` e a alça de `resize` pintam FORA do retângulo do elemento, e um
// recorte justo os leria como zero.
//
// ERA 48 ATÉ 03/09 (parte B de `censo-oraculo-dois-furos`), E FOI ALARGADA PARA 400 POR MEDIÇÃO,
// NÃO POR PALPITE — é exatamente o FURO B que `test/qa-catraca-oraculo.js` mediu (arquivo APAGADO
// nesta mesma entrega — ver a nota histórica logo acima, perto do início do cabeçalho): um
// `::before` com `margin-left:330px` põe a tinta a 330 px da caixa do mutante, e 48 não alcança.
// `400` foi escolhido por ser o recorte que aquele instrumento já usava como "ORÁCULO B" (a folha
// desligada, que não depende de recorte nenhum) para PROVAR o furo — reusar o mesmo número aqui
// fecha o mesmo caso pelo lado do recorte. A REGRESSÃO fica aqui dentro agora, no catálogo
// (`pseudoLonge`, logo abaixo), em vez de num arquivo à parte.
//
// O RISCO ÓBVIO — alargar o recorte pode alcançar o `#palco` (o mapa `position:fixed;inset:0` que
// ANIMA por trás de tudo, e que é a razão de o quadro INTEIRO ter piso de ruído de ~1000 px, ver
// o bloco 1 abaixo) — foi MEDIDO antes de trocar o número, não assumido: nesta posição (a `.lista`
// do TERRITÓRIO) o piso de ruído do recorte segue ZERO até 400 px de folga (medido: 48, 80, 120,
// 160, 200, 260, 330, 350, 400 — os nove, zero nos nove). O bloco 1 abaixo CONTINUA cobrando isso
// a cada execução — se o mapa um dia animar também nesta região, ou se a folga crescer mais, a
// asserção do piso reprova antes de qualquer número virar achado falso.
const FOLGA = 400;
function recortar(r) {
  const x0 = Math.max(0, Math.floor(r.x - FOLGA)), y0 = Math.max(0, Math.floor(r.y - FOLGA));
  const x1 = Math.min(L, Math.ceil(r.x + r.w + FOLGA)), y1 = Math.min(A, Math.ceil(r.y + r.h + FOLGA));
  return { x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0) };
}
// A CONTA DOS PIXELS DIFERENTES. O Node deste repositório não tem decodificador de PNG e não vale
// acrescentar dependência por isto: o próprio Chromium decodifica, numa aba `about:blank` à parte.
async function diferenca(aux, a, b) {
  const n = await aux.evaluate(async ([a, b]) => {
    const carregar = (s) => new Promise((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('png ilegível'));
      i.src = 'data:image/png;base64,' + s;
    });
    const ia = await carregar(a), ib = await carregar(b);
    if (ia.width !== ib.width || ia.height !== ib.height) return -1;
    const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(ia, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data;
    x.clearRect(0, 0, c.width, c.height);
    x.drawImage(ib, 0, 0); const db = x.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < da.length; i += 4) {
      if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2] || da[i + 3] !== db[i + 3]) n++;
    }
    return n;
  }, [a.toString('base64'), b.toString('base64')]);
  return n;
}

(async () => {
  console.log('CATRACA DA PINTURA FORA DO CENSO — recorte ' + L + 'x' + A + ', oráculo por visibility:hidden');
  if (!fs.existsSync(ARQ)) { console.log('territorio/index.html não existe — rode `npm run build`'); process.exit(1); }

  // A CATRACA TEM DE PODER SER VISTA MORDENDO EM MECANISMO NÃO REGISTRADO (EQUIPE.md 2.8), e não
  // dá para provar isso com um mecanismo do catálogo — todos eles a régua já cobre. Estas duas
  // variáveis metem no catálogo um mecanismo que NINGUÉM escreveu na régua nem aqui:
  //   CATRACA_EXTRA_NOME=xis CATRACA_EXTRA_CSS='...' node test/qa-censo-pintura-fora.js
  // Se ele pintar e o censo absolver, a catraca fica vermelha pelo nome dele. É a prova da mordida.
  if (process.env.CATRACA_EXTRA_NOME) {
    CATALOGO[process.env.CATRACA_EXTRA_NOME] = {
      css: process.env.CATRACA_EXTRA_CSS || '', estilo: process.env.CATRACA_EXTRA_ESTILO || '',
    };
    console.log('  (mecanismo EXTRA injetado por ambiente: ' + process.env.CATRACA_EXTRA_NOME + ')');
  }

  // A SEGUNDA MORDIDA, e ela é a que continua reproduzível depois de o buraco fechar. A de cima
  // precisa de um mecanismo que ninguém cobriu — e, no dia em que a régua cobre todos os do
  // catálogo, ela deixa de ficar vermelha por construção. Esta CEGA a régua de propósito:
  //   CATRACA_CEGA="s.backdropFilter !== 'none'" node test/qa-censo-pintura-fora.js
  // troca aquele pedaço por `false` na função que o Playwright serializa, e a catraca tem de
  // apontar `backdropFilter` (e `pseudoBackdrop`) pelo nome. É a prova de que verde aqui é
  // resultado da régua, não do teste ser complacente.
  let censar = CENSO.censoDoQuadro;
  if (process.env.CATRACA_CEGA) {
    const fonte = censar.toString();
    if (fonte.indexOf(process.env.CATRACA_CEGA) === -1) {
      console.log('CATRACA_CEGA não casou nada em censoDoQuadro: ' + process.env.CATRACA_CEGA);
      process.exit(1);
    }
    // eslint-disable-next-line no-new-func
    censar = new Function('return (' + fonte.split(process.env.CATRACA_CEGA).join('false') + ')')();
    console.log('  (régua CEGADA de propósito em: ' + process.env.CATRACA_CEGA + ')');
  }

  const nav = await chromium.launch({ args: ['--enable-unsafe-swiftshader'], executablePath: ABRIR.chromiumPath() });
  const aux = await nav.newPage();
  await aux.goto('about:blank');
  const permitidos = CENSO.permitidosDaPagina('territorio', fs.readFileSync(ARQ, 'utf8'));
  const doPasso2 = (e) => /contêiner já provado/.test(e.motivo || '');

  // ---------------------------------------------------------------- 1. O PISO DE RUÍDO, MEDIDO
  // Por que o recorte existe, em número: o quadro inteiro NUNCA é estável (o mapa anima), o
  // recorte é. As duas medidas saem da MESMA carga, sem tocar em nada entre as fotos.
  console.log('\n=== 1. O PISO DE RUÍDO — duas fotos idênticas, sem mudar nada');
  const pgP = await abrirPagina(nav);
  await excluir(pgP);
  const rP = await pgP.evaluate(injetar, {});
  const cP = recortar(rP);
  const inteiro = { x: 0, y: 0, width: L, height: A };
  const i1 = await pgP.screenshot({ clip: inteiro });
  const c1 = await pgP.screenshot({ clip: cP });
  await pgP.waitForTimeout(400);
  const i2 = await pgP.screenshot({ clip: inteiro });
  const c2 = await pgP.screenshot({ clip: cP });
  await pgP.close();
  const pisoInteiro = await diferenca(aux, i1, i2);
  const pisoRecorte = await diferenca(aux, c1, c2);
  console.log('  quadro inteiro ' + L + 'x' + A + ': ' + pisoInteiro + ' px de ruído'
    + (pisoInteiro > 0 ? '  <- é por isto que o quadro inteiro não serve de régua' : ''));
  console.log('  recorte ' + JSON.stringify(cP) + ': ' + pisoRecorte + ' px');
  ok(pisoRecorte === 0, 'o recorte na caixa do mutante +' + FOLGA + ' tem piso de ruído ZERO'
    + (pisoRecorte ? ' — mediu ' + pisoRecorte + ' px, e toda medição abaixo estaria contaminada' : ''));

  // ------------------------------------------------------- 2. CÂMERA CONTRA CENSO, UM POR UM
  console.log('\n=== 2. O CATÁLOGO — a câmera diz se pintou, o censo diz se recusou');
  const fugas = {}, falsos = {};
  for (const nome of Object.keys(CATALOGO)) {
    const pg = await abrirPagina(nav);
    await excluir(pg);
    let r = null, erro = '';
    try { r = await pg.evaluate(injetar, CATALOGO[nome]); } catch (e) { erro = String(e.message || e); }
    if (erro) { await pg.close(); ok(false, nome + ': o mutante não pôde ser injetado — ' + erro); continue; }
    const clip = recortar(r);
    const comEle = await pg.screenshot({ clip });
    const estranhos = await pg.evaluate(censar, [L, A, permitidos, CENSO.SELETOR_INTERATIVO]);
    // O PISO DESTA MEDIÇÃO, cobrado aqui e não uma vez só lá em cima: cada mecanismo mexe na
    // caixa, e um recorte que passe a pegar o mapa deixaria de ter piso zero SÓ NAQUELE caso.
    const outraVez = await pg.screenshot({ clip });
    // O ORÁCULO — ATÉ 03/09 escondia o mutante com `visibility:hidden` NELE MESMO, e só isso. Era
    // o FURO A (`test/qa-catraca-oraculo.js`, parte B de `censo-oraculo-dois-furos`): `visibility`
    // é HERDADA, e um pseudo-elemento pode REDECLARAR `visibility:visible` e continuar pintando
    // depois de o hospedeiro já estar `hidden` — o oráculo lia 0 px onde a tinta do próprio
    // mutante era de centenas de px.
    //
    // A PRIMEIRA CORREÇÃO TENTADA FOI `window.__qaFuga.remove()` — apagar o nó do DOM inteiro (que
    // É imune a herança: sem hospedeiro não há pseudo-elemento) — E, SEPARADAMENTE, resetar o
    // `style.cssText` para a caixa nua em vez de só escondê-la. AS DUAS FORAM MEDIDAS E
    // DESCARTADAS, por dois motivos de reflow diferentes:
    //   1. `.remove()` — a `.lista` é `display:flex`, e tirar um filho dela FAZ O LAYOUT RE-FLUIR:
    //      os vizinhos se reposicionam, e o recorte (geometria FIXA, medida antes da remoção) passa
    //      a fotografar outra coisa. Medido: os mecanismos que deveriam ser `inerte 0 px` passaram a
    //      medir ~102.800 px — o ruído do reflow, não do mutante.
    //   2. Resetar `style.cssText` por inteiro — layout-neutro para border/outline/box-shadow
    //      (com `box-sizing:border-box` a caixa EXTERNA não muda), mas `zoom` é uma propriedade DE
    //      LAYOUT: `zoom:2` (do catálogo `zoom`, que o censo já absolve corretamente hoje) dobra a
    //      caixa e empurra os vizinhos da `.lista`, e resetar o cssText desfaz isso NO MEIO da
    //      medição. Medido: `zoom` foi de `inerte 0 px` para `FUGA 143.311 px` — reflow de novo,
    //      disfarçado de achado.
    //
    // O QUE FICA, e fecha o furo A sem repetir os dois erros acima: `visibility:hidden` continua NO
    // HOSPEDEIRO (layout-neutro por construção — é o que já funcionava para border, background,
    // outline, box-shadow, backdrop-filter, border-image, o `::marker` PADRÃO de `list-item`, a
    // alça de `resize` e `content` substituído; `zoom` incluído, porque esconder não muda o
    // tamanho da caixa) — E, JUNTO, a folha de `arg.estilo` (marcada com `id="qaEstilo"` em
    // `injetar()`) é DESLIGADA por `disabled=true`. Sem a folha, a declaração `content` que cria
    // o `::before`/`::after` deixa de existir — `content` computa `normal`, não há pseudo-elemento
    // NENHUM gerado, e não sobra `visibility` de ninguém para herdar OU recusar: a folha inteira
    // some, a redeclaração de `visibility:visible` some junto porque estava NA MESMA folha. Nem
    // `visibility:hidden` nem `disabled=true` tocam em `width`/`height`/`zoom` do hospedeiro —
    // os dois são layout-neutros, e é isso que o piso de cada mecanismo (medido logo abaixo, a
    // cada iteração) cobra.
    await pg.evaluate(() => {
      window.__qaFuga.style.visibility = 'hidden';
      const st = document.getElementById('qaEstilo');
      if (st) st.disabled = true;
    });
    const semEle = await pg.screenshot({ clip });
    await pg.close();
    const piso = await diferenca(aux, comEle, outraVez);
    const px = await diferenca(aux, comEle, semEle);
    const recusou = estranhos.some(doPasso2);
    const marca = px > 0 ? (recusou ? 'FECHADO' : 'FUGA   ') : (recusou ? 'FALSO+ ' : 'inerte ');
    console.log('  ' + marca + ' ' + nome.padEnd(24) + String(px).padStart(6) + ' px'
      + '  censo=' + (recusou ? 'RECUSA ' : 'ABSOLVE') + '  piso=' + piso);
    if (piso !== 0) { ok(false, nome + ': o piso de ruído do recorte deste mutante é ' + piso + ' px, não zero — a medição dele não vale'); continue; }
    if (px < 0) { ok(false, nome + ': as duas fotos saíram com tamanhos diferentes — recorte inválido'); continue; }
    if (px > 0 && !recusou) fugas[nome] = px;
    if (px === 0 && recusou) falsos[nome] = true;
  }

  // ------------------------------------------------------------------------- 3. A CATRACA
  console.log('\n=== 3. A CATRACA — o conjunto de divergências tem de ser o registrado');
  const novas = Object.keys(fugas).filter((n) => !(n in FUGAS_REGISTRADAS));
  const sumidas = Object.keys(FUGAS_REGISTRADAS).filter((n) => !(n in fugas));
  const novosFalsos = Object.keys(falsos).filter((n) => !(n in FALSOS_REGISTRADOS));
  const falsosSumidos = Object.keys(FALSOS_REGISTRADOS).filter((n) => !(n in falsos));

  ok(novas.length === 0, 'nenhuma FUGA nova — mecanismo que pinta e o censo absolve'
    + (novas.length ? ': ' + novas.map((n) => n + ' (' + fugas[n] + ' px)').join(', ')
      + '  <- ou a régua fecha, ou o nome entra em FUGAS_REGISTRADAS com o número' : ''));
  ok(novosFalsos.length === 0, 'nenhum FALSO-POSITIVO novo — mecanismo que não pinta e o censo recusa'
    + (novosFalsos.length ? ': ' + novosFalsos.join(', ')
      + '  <- a régua ficou mais paranoica que o navegador; régua que reprova o certo é a que alguém afrouxa' : ''));
  // A CATRACA ANDA NOS DOIS SENTIDOS. Fuga registrada que PAROU de fugir é boa notícia — e a
  // linha vermelha existe para o registro não virar folclore: quem fecha, apaga o nome daqui.
  ok(sumidas.length === 0, 'nenhuma fuga registrada ficou obsoleta'
    + (sumidas.length ? ': ' + sumidas.join(', ') + ' <- foi fechada; apague de FUGAS_REGISTRADAS' : ''));
  ok(falsosSumidos.length === 0, 'nenhum falso-positivo registrado ficou obsoleto'
    + (falsosSumidos.length ? ': ' + falsosSumidos.join(', ') + ' <- apague de FALSOS_REGISTRADOS' : ''));
  console.log('  catálogo: ' + Object.keys(CATALOGO).length + ' mecanismos medidos por pixel'
    + ' · fugas ' + Object.keys(fugas).length + ' · falso-positivos ' + Object.keys(falsos).length);

  await nav.close();
  if (falhas) { console.log('\nREPROVADO — ' + falhas + ' problema(s)'); process.exit(1); }
  console.log('\nok');
})();
