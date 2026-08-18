# PENDENTES — o que foi revertido ou ficou pela metade, e continua valendo

Regra do dono (2026-08-09): *"tudo bem reverter o que estiver pela metade, mas mantenha como
tarefas ainda pendentes para continuarmos."*

Este arquivo existe porque reverter sem registrar é perder trabalho duas vezes: perde-se o
código **e** o diagnóstico que custou a sessão inteira. **Nada sai daqui sem estar feito ou
sem o dono descartar.** Quem reverter alguma coisa escreve aqui no mesmo commit.

---

## 1. O GRÃO DO CHROME — **FEITO em 2026-08-09** (Direção de Arte, onda 11)

Saiu daqui porque está feito: `texturaChrome()` roda no boot, as três texturas
(`--veioPx`/`--graoPx`/`--graoOuroPx`) são consumidas como primeira camada de `background`
em toda superfície da régua, e a subtração do HUD foi junto (os três nichos de drop nascem
com o primeiro item). Medição, prints `GR-*` e o registro completo: `DIRECAO.md`, onda 11.
Instrumento que vigia: `test/prints-grao.js`.

---

## 2. ~~O EFEITO DE CORRIDA~~ — FEITO em 09/08 (o vento da corrida)

Correr dobra a cadência e muda a tinta do rótulo, e **não há nenhuma resposta visual de
velocidade**. O dono pediu: *"quando tiver correndo, tem que ter algum efeitinho como se fosse
uma corrida de velocidade, pra dar a impressão de fato."*

**Como ficou:** o ar cortado — riscos horizontais finos passando pela personagem, nascidos do
MUNDO ANDADO (a fase vem de `worldX`, a mesma fonte que escolhe o quadro do sprite, então
parar de andar para o vento no mesmo instante). Sobe e desce em ~0,45 s, porque ligar e
desligar seco lê como falha de desenho e a rampa é justamente o que dá a arrancada. Mora na
metade de cima e na barra do pé — **passa longe da faixa de leitura**, a mesma que a passada
de composição esvaziou. Medido: 1638 px acesos correndo, 0 andando, 0 ao voltar a andar.

**A trava foi o que desenhou a solução:** as folhas de corrida foram recusadas por §2 (pessoa diferente da caminhada), então
**o sprite continua o da caminhada**. Não dava para vender velocidade pela POSE — então ela
teve que vir do AR. É por isso que o efeito é o ar cortado e não rastro colado na personagem,
que exigiria pose. A velocidade e a cadência não foram tocadas.

---

## 3. ~~QA DA SEQUÊNCIA INTEIRA~~ — FEITO em 09/08 (Relatório 3 no `QA.md`)

Percorrido. **Os verbos são cumpridos** — PALMARES +13 acolhidas em 30 s, SALVADOR 7 pela mão
e **9 pela corrente** —, os nichos e a seta da microdica estão perfeitos (erro horizontal 0 px),
e os bugs B1 e B3 do relatório anterior estão corrigidos.

**Dois consertos entraram no mesmo dia**, os dois de bugs que o QA achou: a lista de imagens
da travessia (ver abaixo) e o float que dizia "NOVA ERA" na virada de CENA — `!vira` é
justamente o caso em que a era NÃO mudou; a guarda estava certa, a palavra é que mentia.
Virou "MAIS ADIANTE".

**Fica pendente do relatório 3, e é fila nova:**
- **N2 · a travessia não anda sozinha** — 25 s sem tocar e ela fica na linha 0. Os "~90 s"
  são o tempo de quem toca; o trecho não tem duração própria.
- **N3 · o jogo acaba e não avisa** — o fecho final devolve à mesma rua, barra em 100%, e
  nada. Sem tela de fim, sem crédito, sem convite.
- SALVADOR tem um corte vertical de 122/255 no meio da tela (os outros capítulos ficam em
  45–64) — espera a pintura ladrilhável que está na mesa.
- O `+1.0` do botão inerte segue na travessia · os recursos não persistem, e a onda 11 tornou
  a perda **visível** (a fileira de nichos encolhe no dia 2) · três folhas na tela para três
  significados · fecho+abertura viram um bloco de 9 falas quando não há travessia.
- **Gap de forma, e é do dono:** o 4º capítulo repete a mecânica do 1º **de propósito**, e
  ninguém decidiu se isso lê como fecho ou como anticlímax.

---

## 4. ~~O HISTORIADOR DO CONTEMPORÂNEO~~ — FEITO em 09/08 (`HISTORIA-CONTEMPORANEO.md`)

O relatório saiu inteiro: o capítulo do **agronegócio** desenhado (O ACEIRO, no cerrado — o
INPE registrou 7.235 km² lá contra 5.796 na Amazônia em 2025), a fila reordenada com o custo
dito em voz alta, e a revisão dos contemporâneos. Todo número carrega estado de verificação
e a regra nova é: **só fonte primária ou institucional vira fala.**

**O que ele deixou para o dono, e nenhum item é meu:** nove decisões ⚠ no fim do arquivo.
As três que travam trabalho:

- **reordenar a fila** (ditadura → agronegócio → Covid → volta ao XIX). O custo é atravessar
  a abolição sem jogá-la, mitigável com marcos na `LINHA_TEMPO` no mesmo lote;
- **carga sob demanda**, que a fila nova torna bloqueante **dois lotes mais cedo**;
- **a régua da imagem do fogo** — o §2.4 abriu a imagem para a travessia, e fogo é outra
  conversa.

---

## 5. ~~A AUDITORIA HOLÍSTICA~~ — FEITA em 09/08 (`AUDITORIA.md`)

Nove telas medidas, instrumentos em `test/aud-*.js`, prints em `test/AUD-*.png`.
**Veredito de uma linha: o jogo NÃO é um frankenstein** — as onze ondas fizeram das telas de
jogo uma língua só, e ela é medível (4 raios de canto no jogo inteiro, 3 pesos, 3 famílias,
cinco telas com ZERO texto de sistema, o ouro com uma superfície só).

**Consertado no mesmo dia:** a CHEGADA falando Arial Black (a tela mais nova falando a língua
mais velha), as 24 variáveis mortas do `:root` (37 → 13, e elas eram a CAUSA do primeiro
achado), o DOM sem dono, as seis camadas de veio que nunca renderam um pixel (provado a 0 por
`test/prova-camada.js`), a pauta do caderno colada sete vezes, e o canto do PULAR.

**O que ficou, e cada um precisa de decisão ou de print antes/depois:**

### 5a · ~~Os pares de cores quase-idênticas~~ — o degrau Δ≤2 FEITO em 09/08
116 hex distintos no chrome; **54 pares com Δ≤6 por canal**, dos quais **10 com Δ≤2** —
indistinguíveis a olho: `#8d8272~#8d8271` (Δ1), `#0d0b08~#0e0b07` (Δ1), `#1c2010~#1a1e10`,
`#1e1206~#1c1106`, `#2a2418~#2c2418`, `#221806~#241605`, `#4a2f16~#4c3016`, `#16110a~#14100a`.
O grupo "quase-preto" tem **16 membros** para um papel que a régua nomeia com três tintas.
Os marrons somam **55** para ~16–20 que a régua legitima.
**Feito:** `test/juntar-cores.js` acha os grupos por união-busca dentro de um limiar e faz o
mais usado sobreviver; `test/prova-cores.js` fotografa peça por peça antes e depois. Sete
substituições, **99 → 92 cores**, diferença máxima **2 em 255** — abaixo do que qualquer olho
separa. (O número caiu de 116 porque a limpeza das variáveis mortas e das camadas de veio já
tinha levado parte.)

**O que ficou:** os marrons ainda somam bem mais do que os ~16–20 que a régua legitima, mas
consolidá-los é decisão de MATERIAL, não de aritmética — dois marrons a 6 de distância podem ser
duas madeiras diferentes de propósito. Pede uma passada de arte com print antes/depois, não um
script. Vale também anotar na régua as três tintas de quase-preto como as únicas válidas.

### 5b · ~~A escala `--fs-*` é decorativa~~ — RESOLVIDA em 09/08
Os quatro degraus são referenciados **6 vezes em ~45 declarações**, e **nenhum texto visível
os usa** — o texto vivo tem **9 corpos literais** (10 · 11,5 · 13 · 13,5 · 14 · 14,5 · 16 · 19
· 22). Dentro deles, DATA (13 itálico) e FONTE (11,5 itálico) são disciplinados, mas o **corpo
de leitura tem 4 tamanhos**: 16 (fala/retorno), 14,5 (história), 13,5 (fontes), 13 (placar).
**Decidido:** nem matar a escala nem inventar outra — **nomear o que existe**. Seis vozes com
trabalho declarado (CORPO 16/25 · CORPO SM 14,5/22 · MARGEM 13 · FONTE 11,5 it · VERBETE 19 ·
VOZ 13 it), e os `--fs-*` **renomeados** para `--fb-*`, porque tinham trabalho real (vestir o
fallback sob os canvas de rótulo) e nome errado.
**Medido depois:** 5 tamanhos distintos em quatro telas, 8 combinações, cada uma numa voz
nomeada — as três de 13 px são a mesma camada em pesos diferentes, que é o que uma camada é.

### 5c · Rebarbas — uma FEITA, a outra REFUTADA pela medição

**O `✕` saiu, e era o último glifo Arial Black do chrome de pedra.** Não virou um ✕ desenhado
na malha: virou a PALAVRA "FECHAR", na mesma fonte bitmap de todos os outros rótulos. Símbolo
que precisa ser aprendido perde para palavra que se lê — e o rótulo agora diz o que o toque
FAZ. Medido depois: **zero** elementos em fonte de sistema no `#controls` e no `#hudTop`.

**A sombra da `.telaTit` NÃO é rebarba, e a auditoria errou.** Ela dizia que o −3 px "não é nem
o degrau grande (−4) nem o pequeno (−2)". Contei antes de mexer: a aresta de baixo tem
**quatro** valores vivos — 1(×1), 2(×9), **3(×7)**, 4(×17). O −3 tem sete usos; é uma camada,
não um deslize. E o único valor solitário (o `inset 0 ±1px` dos pregos) é um 1 px numa peça de
**5×5** — a proporção certa para o tamanho dela.

**A lição fica registrada: a auditoria é um relatório, não um veredito.** Este achado teria me
feito mexer numa camada legítima de sete peças por causa de uma premissa que ninguém contou.

---

## 6. ~~A TIPOGRAFIA DO QUADRINHO~~ — FEITA (09/08 fechou o que faltava)

A escala, a `--titulo` encorpada e o logo maior já estavam no ar. Faltava o comentário do
personagem **integrado como no jogo**, e o dono tinha dito com todas as letras: *"tem que ser
integrado, né, com a pessoa só até a metade, como se fosse igual do jogo."*

Era um balão AO LADO de uma figura inteira de 56 px — dois objetos flutuando um do lado do
outro, e a pessoa pequena demais para ter rosto. Agora é a mesma construção da caixa de fala:
a pessoa em cima, o papel subindo sobre a metade de baixo dela.

**O que a primeira tentativa ensinou, e vale guardar:** deixar a figura INTEIRA atrás do papel
não funciona — quem decide onde ela é cortada passa a ser a ALTURA DO BILHETE, e um comentário
de duas linhas é mais baixo que as pernas, então os pés reapareciam embaixo dele. O corte tem
de ser na ARTE (`cover` + `object-position: top`), e aí ele cai sempre no mesmo ponto do corpo.
Os quatro retratos medem 112×300, 106×300, 212×482 e 105×300; numa caixa de 104×145 isso dá
52%, 49% e 61% da figura.

---

## 7. OS DOZE CAPÍTULOS EXISTEM — o que ficou aberto neles (09/08, Dev)

Feito: os oito capítulos que faltavam entraram em `EPOCAS` marcados `emObra: true`, jogáveis,
sem uma linha de afirmação histórica sem fonte. Registro completo no `NOTES.md`, diário de
09/08 ("OS DOZE CAPÍTULOS PASSAM A EXISTIR"). O que **não** está feito, e é do dono:

- **⚠ A partida ficou 2,14× mais longa.** `LIMIAR_FIM` foi de 10.500 para 22.500 de impacto,
  porque oito capítulos novos ocupam oito cenas. É ECONOMIA, e economia não se decide sem o
  dono nem sem medição antes/depois. O botão é uma linha (`LIMIAR_CENA = 1500`); três opções
  na mesa (aceitar · baixar o passo para ~700 · passo mais curto só para os capítulos em obra).
- **⚠ A pintura de um capítulo em obra é a do anterior**, e pintura afirma lugar: JABAQUARA
  (Santos) roda sobre a ladeira de Salvador. §2 de representação. A alternativa é mundo sem
  chão, que é pior — mas a decisão é dele.
- ~~**⚠ O ACEIRO fora do arco.**~~ **RESOLVIDO em 10/08:** o dono disse **sim**. O capítulo
  entrou em `EPOCAS` como o décimo terceiro, `emObra: true`, na posição cronológica (depois de
  O QUE SEGUROU, antes de O QUE TEM FONTE) — **sem reordenar capítulo nenhum**, porque o pedido
  dele foi explícito: *"quero incluir esses marcos na linha do tempo mas mantendo a ordem
  cronológica."* O texto com fonte continua guardado no `HISTORIA-CONTEMPORANEO.md`.
- **Os capítulos em obra ainda não têm PLACA na `LINHA_TEMPO`** (`{ tipo: "marco" }`), e isso
  continua de propósito: a placa é do capítulo, e capítulo em obra não tem o que afirmar. O que
  entrou em 10/08 foram **seis momentos** cobrindo o vão de 1888 a 1964 — normas com número,
  conferidas — para o salto deixar de ser mudo. Ver o diário de 10/08. **Os três do século XIX
  ganharam a placa deles em 11/08**, ao deixarem de ser esqueleto: sobram seis sem placa.
- ~~**Verbo por escolher em quatro**~~ — **DOIS RESOLVIDOS em 11/08**, com o texto dos capítulos:
  JABAQUARA é **abrir caminho** e A PEQUENA ÁFRICA é **guardar o lugar**. Faltam AS PORTAS e A PRAÇA.
- **⚠ A pintura de O ACEIRO é a de O QUE SEGUROU** — uma rua urbana num capítulo cujo `quando`
  diz "cerrado". É a mesma pendência de herança de paisagem do item 8, e nele ela desencaixa
  mais que nos outros, porque o lugar não é cidade. O pedido de pintura de cerrado (seca, borda
  queimada, fumaça no horizonte) ainda não foi à mesa, e o §2 dele é decisão do dono: **quanto
  do fogo a imagem mostra, e se pode aparecer casa, roça ou bicho na frente dele**
  (recomendação do historiador: paisagem sem gente e sem animal).

---

## 8. AS DUAS PINTURAS QUE VIERAM COM O CHÃO TROCADO (10/08, Dev)

Das catorze pinturas entregues em 10/08 para os sete capítulos em obra, **dez entraram** e
quatro não. Duas peças de CHÃO não são chão:

- **`cap-praca-fundo-chao.png`** — o pedido era *piso de mosaico português de praça, ondulado
  em preto e branco desgastado*. O que chegou é uma **rua de periferia inteira**, com casario,
  poste, encosta e céu. Como pintura de cima seria boa; como chão é impossível.
- **`cap-segurou-fundo-chao.png`** — o pedido era *rua de concreto batido com escadaria
  lateral e canaleta*. O que chegou é a **sala de leitura do arquivo público**, que é o
  assunto da peça de cima de O QUE TEM FONTE (e essa já veio, e já entrou).

Consequência: **A PRAÇA e O QUE SEGUROU continuam sem pintura própria** e herdam a de O QUE
NÃO PODIA SER DITO (era a de SALVADOR — a herança melhorou, mas continua sendo herança). Não
dá para integrar meia paisagem: `fundoPintado()` recusa céu sem chão de propósito, porque
sem chão a personagem apareceria pisando no vazio por alguns quadros.

**O que resolve:** duas pinturas de chão, com o mesmo pedido que já está em
`ferramentas/necessario.json` (itens `cap-praca-fundo-chao` e `cap-segurou-fundo-chao`).
As peças de CIMA das duas já chegaram e estão certas — só o chão falta. Os arquivos errados
continuam em `assets/entrada`; a mesa vai continuar oferecendo os dois itens porque eles não
entraram em `processadas.json`.

**E um achado que vale para toda entrega futura:** o pedido de chão precisa dizer, em voz
alta, *sem céu e sem horizonte* — as duas peças erradas obedecem à letra de "o chão onde a
personagem pisa" e ainda assim não servem, porque trouxeram o mundo inteiro junto.
## 8. CARGA SOB DEMANDA — o que ficou de fora, de propósito (10/08, Plataforma)

Feito: a arte dos capítulos 2+ sai para `pack-*.json` e chega quando a pessoa chega no
capítulo. Medido **16,65 s → 6,30 s** em Fast 3G. Diário completo no `NOTES.md` (10/08). Estas
três coisas foram consideradas e **não** feitas — nenhuma delas é dívida, mas nenhuma se perde:

- **Pré-busca do capítulo seguinte.** Baixar o pacote de `época + 1` enquanto a pessoa joga a
  atual tornaria a virada instantânea (hoje ela custa 3,66 s em 3G, dentro da cerimônia). O que
  segura: baixa 753 KB para quem talvez nunca chegue lá, e em rede medida isso é um custo que a
  pessoa não pediu. **Decidir com medição:** quantos jogadores atravessam o primeiro capítulo?
  Sem esse número, a pré-busca é palpite. Custo de fazer: quatro linhas em `garantirEpoca`.
- **Servir `.webp` de verdade em vez de base64 dentro de JSON.** Economiza ~25% do arquivo
  **cru** — o que importa para o APK e para a memória, não para o fio, porque o brotli já
  devolve quase todo o inchaço do base64. Custa uma segunda diretiva de CSP
  (`img-src data: 'self'`) e uma reescrita do pipeline de arte. Achado do `RELATORIO-PESO.md`,
  §4. **Só se decide com medição própria.**
- **Comentário do CSS e do molde fora da saída.** 54,8 KB crus, **22,8 KB no fio, 0,12 s**. É de
  graça e a varredura correta (que respeita as fronteiras de `<script>` e `<style>` — um
  `.replace()` cego produz arquivo que não abre) já está escrita e testada em
  `test/peso-restante.js`. Não entrou aqui para não misturar duas mudanças no mesmo build.

**E uma perda registrada e aceita, que não tem conserto dentro deste desenho:** abrir o
`index.html` da raiz com dois cliques (`file://`) mostra a arte do capítulo 1 em todo lugar. O
Chromium recusa o `fetch` sob `file://` e o jogo nem tenta. O jogo roda inteiro assim; só a arte
dos capítulos 2+ não aparece. Para ver o jogo como ele é: `npm start`.

---

## 10. A LEVA DE 17 ARTES DE 10/08 — o que a triagem decidiu, e por que ela parou (10/08, Dev)

Dezessete arquivos chegaram em `assets/entrada` e a mesa passou a bola. A triagem foi feita
inteira e cada item tem número; **a integração parou no primeiro embutimento** por uma colisão
de sessão descrita no fim desta seção. Nada aqui é opinião pendurada: o que não entrou tem
medida, e as medidas estão em `ferramentas/recusadas.json`.

### Entrou (1 de 17), e está NO DISCO mas NÃO COMMITADO

- **`cap4-sprite-v3`** — a caminhada da ganhadeira de SALVADOR, terceira tentativa, e desta vez
  a folha fecha. A anterior escorregava **18,75%** (o melhor ciclo de três que as oito poses
  permitiam); esta dá **1,23%** no ciclo **4 → 7 → 1**, que é **15,2x melhor** e põe SALVADOR na
  faixa das irmãs (capítulo 1: 0,00%; capítulo 2: 1,82%). O pedido tinha sido "SÓ AS POSES DO
  APOIO" e foi exatamente isso que faltava: o calcanhar do pé plantado agora recua **41 e 40 px**
  de sprite em duas transições seguidas — o mesmo pé, andando para trás em passos iguais, que é
  a definição de pé plantado. Varridos os 617 ciclos válidos de três e quatro quadros que as oito
  poses permitem; o melhor de quatro é 4,8,3,7 com 2,67%.
  - `laco` passa de **96 para 121,5** px de sprite e `alturaQuadro` de **396 para 421**, o que dá
    `passo` = **4,23** px de mundo por quadro (era 3,56).
  - **`tela` precisa passar de 6 para 7** e `telaCorrer` fica em 3. Com n = 7 a caminhada anda a
    **36,3 px/s**, dentro da família das irmãs (35,6 · 37,5 · 37,7 · 38,3); a corrida fica em
    84,6 px/s, ao lado dos 83,0 de AINDA AQUI. **Esta linha do `PASSO_CAP` ainda NÃO foi
    escrita** — é a primeira coisa a fazer quando esta seção for retomada, porque a folha nova
    já está embutida e sem ela a passada fica 19% rápida demais para a arte.
  - Ferramenta nova, commitada: **`test/separar-encosto.js`**. A folha vem com as duas últimas
    figuras encostadas e o `recortar-folha.js` aborta (e faz bem — mancha colada vira quadro com
    duas metades de pessoa). O script pinta uma coluna de magenta na coluna MENOS entintada da
    faixa indicada; aqui escolheu x=1526, com 16 px de tinta. `node test/separar-encosto.js
    assets/entrada/cap4-sprite-v3.png saida.png 1500 1600 3`.

### Aprovado pela triagem, ainda NÃO embutido (5)

Nenhum destes tem defeito conhecido — só não chegaram a entrar porque a integração parou.

- **`q-p19`** — o refazer resolveu. Detalhe em `recusadas.json`, lista `resolvidas`.
- **`cap4-obj-v2`** — os três itens de SALVADOR (tabuleiro, balde d'água, trouxa de roupa)
  recortados com folga, em magenta limpo. São OBJETOS, que é o que a §2 exige do que a mão
  alcança: a frase de abertura do capítulo já promete exatamente estes três.
- **`cap3-obj-galao-v2`** — o galão de 20 L de AINDA AQUI, centrado e com contorno duro.
- **`ctx-vao-cidade-africana`** — a Salvador panorâmica do marco "A cidade africana". **Atenção
  de peso:** o prefixo do arquivo é `vao`, e `PACK_DO_CTX_PREFIXO` (`ferramentas/pacotes.js`) só
  conhece `cap1..cap4`. Sem uma linha nova ali, `pacoteDoEndereco` devolve `null`, a imagem cai
  na PORTA DE ENTRADA e o build avisa. Ela é de marco, não de capítulo: o pacote provável é
  `salvador`, e a decisão tem de ser escrita na tabela, não deixada no silêncio.
- **`trav-mar`** — o mar aberto da TRAVESSIA, sem navio e sem gente. Vai para `TRAV_B64`, que
  inteiro já viaja no pacote `travessia`.

### Não entrou (10), com o número em `recusadas.json`

- **`cap1-corrida`, `cap2-corrida`, `cap3-corrida`** — §2, **terceira** recusa. Ver abaixo.
- **`cap4-fundo-alto-v2` + `cap4-fundo-chao-v2`** — a repintura piora a temperatura que veio
  consertar: R−B de **+59,4 para +84,5** (as irmãs ficam entre −10 e −55). A saturação melhora e
  passa (48,7% → 62,0%), mas o ganho é o laranja do poente. A v2 é literalmente um pôr do sol com
  o disco no horizonte, e o jogo tinge a pintura pelo relógio dele.
- **`q-p22`** — vela, pena de ave e pergaminho lacrado para o marco de **1988**.
- **`cap-praca-fundo-alto/chao`, `cap-segurou-fundo-alto/chao`** — nada novo: são os mesmos
  quatro arquivos já triados na **§8 acima**, e a inspeção desta sessão confirma o diagnóstico
  dela. As duas peças de CIMA estão certas; as duas de CHÃO trazem céu e teto e não servem, e
  `fundoPintado()` recusa meia paisagem. Continuam esperando as duas pinturas de chão.

### As folhas de corrida, e a régua que finalmente decide

Elas foram recusadas duas vezes por "não é a mesma pessoa" e voltaram uma terceira vez com
outra pessoa de novo. O que faltava era um número que não dependesse da pose, porque a régua da
casa — **largura da cabeça** (§5) — mente justamente aqui: numa folha de corrida o cabelo voa
para dentro do quinto superior e entra na medida (é o que o `test/comparar-folhas.js` documenta).

A régua que serve é **ALTURA / CABEÇA**, que o `validar-folha.js` já imprime e que, nas palavras
dele, *"muda quando o modelo troca o corpo, não o zoom"*:

| capítulo | caminhada | corrida | razão |
|---|---|---|---|
| 1 · PINDORAMA | **4,4** cabeças | **2,3** | 1,9× |
| 2 · PALMARES | **5,2** | **2,8** | 1,9× |
| 3 · AINDA AQUI | **4,9** | **2,2** | 2,2× |

Ninguém perde metade da própria altura em cabeças por estar correndo: são dois cânones de corpo
diferentes, um realista de cinco cabeças e um de cabeça grande. E o resto é visível sem medir —
as três caminhadas são homens, as três corridas são mulheres, com outro cabelo e outra roupa.

**O pedido novo tem de mudar de forma, não de adjetivo.** Pedir "a mesma pessoa" já falhou três
vezes. O que muda o resultado é dar a régua junto: *altura entre 4,4 e 5,2 cabeças* (por capítulo),
e a folha de caminhada correspondente como referência anexa.

### POR QUE ISTO PAROU: duas sessões escrevendo no mesmo `src/jogo.ts`

Ao commitar o primeiro embutimento, a árvore apareceu com **outra sessão em pleno voo no mesmo
arquivo**: `ferramentas/construir.js`, `src/index.html` e catorze blocos do `src/jogo.ts` ganharam,
entre 11:16 e 11:22 de 10/08, a **medição anônima por PostHog** — `ENDERECO_MEDIDA`,
`connect-src https://eu.i.posthog.com` na CSP, interruptor na tela de AJUSTES e cobranças novas no
build. Trabalho coerente e que compila (`npm run tipos` passa), mas **não é meu e não está
commitado**, e abrir a rede é item da lista de "pare e pergunte" do CLAUDE.md §3.2.

Continuar seria destruir trabalho: **todo `inline-*.js` reescreve um BLOCO INTEIRO** do
`src/jogo.ts` (`inline-contexto.js` e `inline-quadrinho.js` dizem isso em voz alta). Duas sessões
regravando blocos do mesmo arquivo de 5 MB perdem o trabalho de uma das duas, em silêncio e sem
erro nenhum. Por isso esta sessão parou no primeiro item e commitou **só o que é dela e não
encosta em arquivo compartilhado**: este registro, o `recusadas.json` e o `test/separar-encosto.js`.

**O que retomar, em ordem, quando a outra sessão tiver pousado:** (1) a linha do `PASSO_CAP` de
SALVADOR (`laco` 121,5 · `alturaQuadro` 421 · `tela` 7); (2) `npm test` e `node test/encaixe.js`;
(3) os cinco aprovados acima, um incremento por vez, com `node test/peso-abrir.js` antes e depois
e `node test/tirar-icc.js` por último; (4) `processadas.json` recebendo o que entrou.

---

## 11. `cap4-gente` — A PERGUNTA DE REPRESENTAÇÃO QUE É DO DONO (10/08, Dev)

**Não embutida, e não porque tenha defeito.** O CLAUDE.md §2 diz que este é o único assunto do
repositório em que decidir sozinho é a escolha errada. Aqui está tudo o que a triagem apurou,
para que a decisão seja de quem tem de tomá-la.

### O que a imagem é

Três ciclos de caminhada de oito poses, em magenta, das pessoas que trabalham na rua de
Salvador: um homem carregando um **barril** nas costas, um homem com uma **trouxa** amarrada, e
uma **ganhadeira** com tabuleiro de comida na cabeça. Sem corrente, sem tronco, sem feitor. De
pé, de rosto inteiro e de perfil individual — roupas, brincos, pano de cintura diferentes um do
outro. O nome do pedido era *"a gente da rua (o que falta para o verbo se LER)"*.

### O que joga a favor de ela entrar

1. **O capítulo já diz quem elas são, com fonte.** A abertura de SALVADOR, no `src/jogo.ts`,
   afirma: *"Quem faz esta rua andar são as ganhadeiras: mulheres africanas e crioulas que
   vendem, carregam e negociam de sol a sol — escravizadas e libertas, com o próprio ganho na
   mão"*, e depois *"Pela ladeira vem tabuleiro, barril d'água e trouxa de roupa — o trabalho da
   rua"*. A folha entrega **exatamente esses três carregos**: foi desenhada para essa frase.
   As fontes já estão creditadas (João José Reis; Cecília Moreira Soares).
2. **A protagonista é uma delas.** Quem a pessoa joga em SALVADOR é a ganhadeira de tabuleiro
   (`cap4-sprite-v3`). Estas não são "outras pessoas ao fundo": são as iguais dela.
3. **NPC neste motor é cenário puro, por construção.** O bloco `NPC_B64` diz por extenso: *"THEY
   ARE SCENERY. They carry no state, no hitbox and no entity… Nothing here can be tapped, damaged,
   or collected… never stand in the road"*. Ou seja, a trava §2.4.3 — *pessoa escravizada não é
   NPC alcançável* — continuaria valendo: não há como alcançá-las.
4. **O que a mão alcança em SALVADOR são OBJETOS**, não gente: tabuleiro, balde e trouxa
   (`cap4-obj-v2`). Isso já está resolvido e certo.
5. **É o que o dono pediu em 2026-08-08**, quando reviu o §2.4: *"nas imagens não está aparecendo
   pessoas… mostrem como foi essa dura realidade"*. Uma Salvador de 1835 com a rua VAZIA é a
   cidade cuja economia inteira dependia de trabalho negro desenhada sem uma pessoa negra.

### O que joga contra, e é por isso que a pergunta sobe

1. **O próprio texto do capítulo diz "escravizadas e libertas".** Logo, pelo que o jogo afirma,
   parte destas figuras é gente em situação de escravidão — e elas entrariam como **cenário
   ambiente**, andando de um lado ao outro sem nome e sem fala. A pergunta é literal: *mostrar
   trabalho escravizado como paisagem de fundo honra ou naturaliza?* A resposta não é técnica.
2. **O homem do barril às costas** é iconografia reconhecível de Debret e Rugendas, inclusive do
   barril de dejetos. Pode ser exatamente o realismo que o dono pediu, ou pode ser a imagem mais
   pesada do lote entrando sem uma linha de texto que a explique.
3. **Elas não têm voz.** Todo o resto do capítulo nomeia e credita; estas figuras passariam
   caladas. Se entrarem, provavelmente devem entrar **com uma fala de rua ou uma legenda** — e
   isso é conteúdo histórico novo, que é decisão de quem escreve o capítulo.

### E um impedimento TÉCNICO, que existe mesmo se o dono disser sim

Hoje **não há caminho para NPC por capítulo**. `NPC_B64` é global: um só elenco
(`avental`, `chapeu`, `crianca`, `avo`, `bone`, `cadeira`, mais o cachorro) desenhado em TODOS os
doze capítulos, sem índice por `arteCap` — diferente de `HERO_CAP_B64`, `MOB_B64`, `DROP_B64` e
`RETRATO_B64`, que já são por bloco de arte. Embutir esta folha como está poria carregadores de
1835 andando em **PINDORAMA (antes de 1500)** e em **AINDA AQUI (hoje)** — o que seria um erro de
§2 muito maior que qualquer um discutido acima. Além disso o contrato de quadro não bate: os NPCs
atuais são **2 poses de parada, 11×22 px de mundo**, e esta folha traz **8 poses de caminhada**.

**Portanto, mesmo com um "sim", o trabalho é:** dar `arteCap` ao `NPC_B64` (tabela em
`ferramentas/pacotes.js` junto), abrir um caminho de NPC que ANDA, e só então embutir. Estimativa
honesta: um incremento próprio, não um embutimento.

### A pergunta, em uma linha

**As pessoas da rua de Salvador entram como cenário que caminha — e, se entram, entram caladas ou
com uma fala?** Enquanto não houver resposta, a folha fica em `assets/entrada` e fora de
`processadas.json`, para a mesa continuar mostrando que ela existe.


---

## 12. O LOTE DO SÉCULO XIX TEM TEXTO E NÃO TEM ARTE (11/08, Historiador)

**Feito em 11/08:** `O CAIS QUE VOLTOU À LUZ`, `JABAQUARA` e `A PEQUENA ÁFRICA` deixaram de ser
esqueleto — abertura de 5 falas e fecho de 6 em cada um, com fonte conferida por fala, `emObra`
removido, placa na `LINHA_TEMPO`, e 17 entradas novas em DE ONDE VEM. Diários no `NOTES.md`.
O que **não** está feito é tudo visual, e três coisas são do dono:

- **⚠ QUEM REPRESENTA CADA UM DOS TRÊS.** Os três falam **sem rosto**, e agora por regra de
  código: `DONO_DO_BLOCO` faz o retrato aparecer só para o capítulo DONO do bloco de arte que
  veste (antes a condição era `emObra`, e tirar o `emObra` devolveu a cara de AINDA AQUI narrando
  o Valongo — achado de print, não de teste). Escalar quem aparece é §2 e é dele. Enquanto não
  houver resposta, ninguém é escalado, e o `encaixe.js` bloco 15 cobra isso.
- **⚠ A ARTE DE RUA DOS TRÊS.** O que atravessa a tela e o que fica no chão continuam
  emprestados de AINDA AQUI — muda, galão e cesto num cais de 1811. A última fala da abertura de
  cada capítulo **diz isso em voz alta** em vez de fingir, o que é honesto e é feio. É a maior
  dívida visual do lote, e ela depende do item acima: definida a gente, definem-se as coisas.
- **⚠ A PINTURA DE O CAIS é a de SALVADOR** (`arte: [4]`). Era a de PALMARES — serra, mata
  fechada — e isso ficou insustentável quando o texto passou a dizer *"isto é o Rio de Janeiro"*:
  pintura afirma lugar. Cidade colonial de pedra com mar é a menos falsa que existe hoje, e
  continua sendo **outra cidade**. `cap-cais-fundo-alto` e `cap-cais-fundo-chao` estão pedidos.

E quatro pedidos de **imagem de contexto** na fila de `ferramentas/necessario.json`, todos
paisagem 1536×640 sem gente, os capítulos já escritos com as chaves à espera (chave que não
existe em `CTX_B64` é tratada como `null`, então nada quebra enquanto não chegam):
`ctx-cap5-cais` · `ctx-cap5-coberto` · `ctx-cap6-serra` · `ctx-cap6-morro` · `ctx-cap7-praca` ·
`ctx-cap7-casa`. O de `ctx-cap5-*` carrega uma linha que não é enfeite e não se apaga: **nada de
osso, restos humanos ou sepultura — este é o CAIS, não é cemitério** (§2.4.4).

### E um achado de tela que não é do lote, mas apareceu nele

**O nome do capítulo não cabe na cerimônia.** "O CAIS QUE VOLTOU À LUZ" sangra pelas duas bordas
na tela do nome, a 390 px de largura (print `test/CAP-cais-ab1.png`). Vale igual para "O QUE NÃO
PODIA SER DITO". É anterior a 11/08 — nenhum nome mudou —, e encolher a fonte da cerimônia é
decisão de Arte, não de conteúdo. Fica registrado para não se descobrir de novo.

---

## 13. ~~O `npm test` falha em metade das execuções~~ — **RESOLVIDO em 2026-08-15**

Fica o registro porque a **hipótese que estava aqui era falsa**, e uma sessão futura poderia
gastar o mesmo dia perseguindo-a de novo.

**O que este item dizia (12/08, e estava errado):** que o preparo do teste escreve
`S.energia = 1e6` e que o `clicar()` do gesto empurraria `energiaTotal` por cima de uma fronteira
de cena, abrindo uma fala que derrubaria `obraPodeArmar()`.

**O número que a derrubou.** Ferramenta nova, `test/repro-obra.js`, que roda só este bloco N vezes
no mesmo navegador — dezenas de amostras no tempo de uma execução do smoke. Rodado sozinho, o
bloco passou **16 de 16**, a cena nunca virou (3→3), e fala e tela nunca abriram. E a aritmética
fecha a porta: **um golpe vale 1,0 ponto e faltam 300 para a fronteira de cena.** Não dá, nem em
cem gestos.

**A causa real: o bloco é limpo, o que suja é o que vem antes dele.** O preparo chamava
`fecharTelas(); fecharTudo()` e não tocava em três coisas que bloqueiam `obraPodeArmar()` e
sobrevivem a isso:

- **`jumpT > 0`** (um pulo herdado) — bloqueia armar e **não** para o mundo. É exatamente o par de
  sintomas *"built nothing: 0"* + *"she kept walking: 79px"*. Os blocos anteriores tocam a metade
  esquerda o tempo todo, e a metade esquerda pula.
- **`falaViva`** (uma fala aberta) — bloqueia armar e **para** o mundo. É o outro sintoma,
  *"the street stopped outside the faixa: 1px"*.
- **`travessiaViva`** — mesma família.

**Eram dois vazamentos diferentes com sintomas opostos** — por isso o par parecia falhar "ao
contrário" e por isso a leitura de "estados trocados" não levava a lugar nenhum. Não era um estado
trocado; eram duas causas distintas na mesma execução.

**O conserto** é do teste, não do jogo, como a sessão anterior suspeitava — só que por outras
portas. Os dois preparos passaram a chamar `pararFala()` e a zerar `jumpT`, `attackT`, `combo`,
`obraDedo` e `obraTrabalhando`. E cada asserção passou a **imprimir qual cláusula de
`obraPodeArmar()` disse não**, porque `built nothing: 0` sem isso manda alguém procurar a causa no
jogo inteiro — que foi o que custou duas sessões.

**Medido depois:** 5 de 5 verdes de imediato, contra ~50% antes.

---

## 14. Duas coisas ficaram pela metade em 15/08

**(a) Print da corrida nova.** Liguei a folha de corrida do bloco de arte 3 e medi tudo o que
importa (passada, ciclo, velocidade, renda), mas **não consegui uma foto limpa dela correndo**.
Todo caminho de entrar num capítulo pelo estado abre alguma tela: entrar em AINDA AQUI dispara a
CHEGADA (é o último capítulo, e é por projeto), e entrar em O QUE SEGUROU abre a fala de fecho do
capítulo anterior. Insistir custou seis tentativas e parei.
O que falta é um jeito de instrumentação de "me põe na rua deste capítulo, sem tela nenhuma" —
provavelmente uma função de teste que sele `aberturas`, `fechos` e a fala de uma vez. Vale porque
**toda** medição visual futura vai precisar disso, não só esta.

**(b) O `encaixe.js` falhou uma vez e não reproduz.** Uma execução deu `FALHOU em 1 asserção` e as
quatro seguintes passaram; não capturei qual bloco. Fica registrado para não virar "eu acho que vi
uma falha" daqui a uma semana. Se voltar, o caminho é o mesmo que resolveu o bloco do mutirão:
fazer a asserção imprimir a causa em vez de só o resultado.

---

## 15. O mapa como lista de eras esbarra no §2.1, e a saída é decisão de projeto (16/08)

Aprovado no check de 15/08: "o mapa vira a lista de eras". Ao começar, o bloqueio: **PINDORAMA
e AINDA AQUI não têm pino DE PROPÓSITO** — os dois falam de povos em muitos territórios, e
fincar um pino num deles diria que a história é de um lugar só (foi decisão registrada no
próprio mapa, e é §2.1). Um mapa que SUBSTITUI a lista não tem como alcançar os dois primeiros
e o último capítulo do arco.

Saídas possíveis, para o próximo check (com a minha recomendação):

- **(a) ⭐ O mapa entra na tela de eras, não no lugar dela**: a lista continua sendo a escolha,
  e o mapa vira o corpo visual dela — os capítulos com lugar aparecem como pinos, e PINDORAMA /
  AINDA AQUI como faixas que atravessam o país inteiro (que é literalmente o que eles dizem).
  Custa mais desenho e é o único que representa os dois sem mentir.
- **(b) Mapa + prateleira**: o mapa em cima, e abaixo dele uma fileira de tábuas para os
  capítulos sem lugar único. Barato, mas cria duas classes de capítulo na mesma tela.
- **(c) Fica como está**: mapa é índice (ONDE FOI), lista é escolha. Zero trabalho, e as duas
  telas seguem contando histórias diferentes.

Não comecei a construir para não meio-fazer uma decisão de representação.

---

## 16. A rua de SALVADOR: a gente cortada, o motor por ligar (16/08)

`cap4-gente` chegou LIMPA (grade 8×3, três pessoas de 1835: o do barril, o do fardo, a
quituteira do tabuleiro — todas as células separadas) e está cortada em `test/cap4-gente.json`
(24 quadros, 189×299, 243 KB). **O que falta é MOTOR, não arte:** hoje o que atravessa a tela
em SALVADOR é desenhado como OBJETO parado (a dívida "muda, galão e cesto num cais de 1811").
A folha existe para trocar objeto por PESSOA ANDANDO.

O desenho da ligação, para a próxima sessão não redescobrir:
- Um bloco novo (`GENTE4_B64`, 3 pessoas × 8 quadros) embutido pelo mesmo caminho do herói;
  viaja no `pack-salvador` (regra dos retratos: quem veste paga o pacote de quem é dono).
- No desenho do mob, quando `capArte() === 2` e o bloco estiver no aparelho: sortear uma das 3
  pessoas por mob e escolher o quadro pela DISTÂNCIA percorrida (a regra da casa — pé não
  desliza), não pelo tempo. Altura alvo = a mesma dos mobs de hoje.
- Recuo seguro: sem bloco (pacote não chegou), continua o objeto de hoje — mesmo padrão do
  retrato que fala sozinho.
- Medir DEPOIS: renda/min (contrato ±10%) e poluição — pessoa é maior que objeto na tela.

E `cap4-sprite-v3` foi RECUSADA por sobreposição (as figuras invadem as células vizinhas — não
há corte vertical possível; medido coluna a coluna). O desenho em si está certo; o pedido novo
exige vão de magenta puro ≥20px entre figuras.

---

## 17. Os três verbos do lote 2, aprovados no check de 16/08 — por implementar

- **JABAQUARA · GUIAR**: toque forma a FILA (molde de PALMARES); levar ao alto conta a chegada.
- **O CAIS · VARRER**: trechos do chão vêm cobertos; SEGURAR revela o calçamento por baixo, e fica.
- **A PEQUENA ÁFRICA · CONVIDAR**: toque convida; a pessoa entra pela porta da casa na cena; casa cheia é o placar.

Os três reusam moldes medidos (fila, segurar, acolher). Regra de sempre: renda ±10% por capítulo ao ligar.

---

## 18. O lote 3 de verbos, aprovado em 17/08 — fecha o desenho dos nove

- **O QUE SEGUROU · CHEGAR**: casas ao longo da rua; tocar atende quem está na porta, mas a que
  CONTA é a do fim do quarteirão, e só se chega nela andando até lá. Recompensa persistência,
  não velocidade — o verbo ao pé da letra.
- **O ACEIRO · ABAFAR**: frentes de fogo atravessam; cada uma que passa esquenta o mundo (motor
  de sinal já existe). Tocar abafa, **correr não abafa**. Fogo nunca é pessoa nem máquina.
- **O QUE TEM FONTE · CONFERIR**: atravessam FRASES que o jogo já afirmou nos 12 capítulos;
  tocar abre quem mediu, como e onde está publicado. O que passa sem conferência some — que é
  literalmente o que o capítulo diz.

**Com os 17 e o lote 1 já feito, os NOVE verbos têm desenho aprovado.** Restam implementar: os
três do 17 (fila/varrer/convidar) e estes três.

---

## 19. A pergunta de três dias segue sem dado, por decisão — 17/08

Perguntado no check de produto: doze dias de construção e **zero jogadores reais**; todo número
de retenção é bot. O dono escolheu **continuar construindo** em vez de testar agora.

Fica registrado porque é a decisão de maior risco do projeto, não porque seja errada: a perna
**divertido** da tese é a única sem medidor, e a única medição possível é gente jogando. As
outras duas (bonito, ensina) se defendem com número; essa se defende com opinião.

Quando o teste vier, o que já está pronto para medi-lo: PostHog com 9 eventos, a pergunta
"você voltaria amanhã?" na CHEGADA, e a retenção local (dias distintos, tempo, tochas).

**Aprovado no mesmo check:** medir e cortar o peso da porta AGORA (1.510 KB era a meta, hoje
2.137) antes de mais arte entrar · e a obra passar a CHAMAR ao abrir o jogo — hoje o que cresceu
só aparece se a pessoa for procurar em O LUGAR, e esse é o único motivo de voltar amanhã que não
depende de conteúdo novo.

---

## 19. ⚠ EU RECRIEI A DÍVIDA DE §2.2 QUE SALVADOR PAGOU — travado em 17/08

**O que aconteceu.** Liguei a folha de gente em onze capítulos. Cinco deles ainda alcançam por
HP (`m.hp -= dmg`, cinco a treze toques): `hoje`, `pequenaafrica`, `aceiro`, `cais`, `pindorama`.
Desenhar uma PESSOA atravessando a rua nesses capítulos é exatamente a dívida que SALVADOR
pagou em 11/08 — *"bater por baixo com nome novo por cima"*. Eu troquei a arte e não o gesto.

**Como apareceu.** Não foi por eu perceber: o `smoke` reprovou com *"an untouched trouble is
drawing an empty bar again"*. A barra de vida só some onde `pessoaNaRua()` é verdadeiro, e essa
função conhece os capítulos com VERBO, não os com arte de gente. O teste pegou pela geometria o
que era um problema de representação — e é por isso que a asserção existe.

**A trava.** `mobFrame` só usa a folha de gente onde `pessoaNaRua()` é verdadeiro. A arte fica
no repositório e **acende sozinha** no dia em que o capítulo ganhar o verbo — nada a refazer.

**Hoje com gente na rua (6):** salvador, palmares, jabaquara, naodito, portas, praca.
**Esperando o verbo (5):** pindorama, cais, pequenaafrica, aceiro, hoje.

**A lição, para não repetir:** arte de gente e mecânica de gente são a MESMA decisão. Ligar uma
sem a outra não é meio caminho andado — é o §2 quebrado com pixel bonito.

---

## 20. PINDORAMA aprovado como TROCAR — e o smoke mede o hp no capítulo 1 (17/08)

O dono aprovou "trocar com quem passa" para PINDORAMA no check de 17/08. Implementado (uma
linha em `CAP_FILA`), **revertido no mesmo minuto** para não deixar a `main` vermelha: o
`smoke.js` usa o **capítulo 1 como referência do mecanismo de hp** e três asserções caem —
*"the health readout does not change when a trouble is damaged"*, *"chapter 1 stopped
dissipating what crosses the street"*, *"beating a trouble left no drop"*.

**Não é bug: é o teste seguindo o jogo.** As três medem o alcance por dano, que continua
existindo — só que não mais no capítulo 1.

**A pergunta estrutural, e ela é do dono:** com nove dos treze já em verbo e PINDORAMA aprovado,
o alcance por HP está virando o caminho minoritário. Restam com hp: `segurou`, `temfonte`,
`hoje`, `aceiro` — e os três primeiros já têm verbo desenhado e aprovado (PENDENTES 18).
**No fim do plano, nenhum capítulo alcança por dano.** Então:

- **(a)** apontar as três asserções para um capítulo que ainda tem hp, e repetir a mudança a cada
  verbo novo — adia a decisão e mente sobre onde o jogo está;
- **(b) ⭐** assumir que o alcance por dano é caminho de saída: as três asserções passam a cobrar
  o alcance POR VERBO (toque abre, tempo resolve, drop cai), e a gramática de dano é apagada
  quando o último capítulo receber o dele;
- **(c)** manter PINDORAMA batendo por hp e aceitar que o primeiro capítulo do jogo — onde todo
  mundo entra — é o que ensina a gramática que o resto do jogo abandonou.

Não decidi sozinho porque isto muda o que o jogo É, não como ele está escrito.

### 20.1 · O que MEDI antes de parar (17/08, segunda tentativa)

Duas tentativas, as duas revertidas — e a regra das duas tentativas do `AGENTES.md` vale para
mim também. **Mas o diagnóstico avançou**, e é isto que o próximo não precisa redescobrir:

- **A faixa do CHÃO tem 96 pixels pintados SEMPRE** — com a pessoa andando, parada, intacta ou
  alcançada. É a **sombra de contato**, não o anel. Qualquer asserção de "intacto não desenha
  nada" amostrada no chão mede sombra e reprova por construção. Foi nisso que iterei às cegas.
- **A leitura tem de ser por DIFERENÇA**: a sombra é constante, logo toda diferença entre dois
  estados é o anel. Alfa absoluto no chão nunca vai servir.
- **A barra some sozinha em capítulo com verbo** (`pessoaNaRua()` já governa isso), então a
  asserção certa ali é a da AUSÊNCIA — §2.2 não admite barra de aflição sobre gente.
- **O que derrubou a segunda tentativa:** o bloco `vida` do smoke roda no capítulo em que o
  teste estiver naquele instante, e não necessariamente no 1. Meu `capFila()` dentro da amostra
  avaliava o capítulo errado. **Quem pegar isto: fixe `S.cenario` explicitamente no começo do
  bloco e restaure no fim** — é a mesma cura do `medir-acompanhar.js`, que media O CAIS achando
  que media SALVADOR por índice fixo.

O caminho está claro; o que falta é uma passada com o bloco inteiro na mão, não remendo.

## 23 · O recuo troca a PINTURA e não troca a TINTA (diagnosticado 18/08, não consertado)

**Reproduzido pelo caminho normal**, com `garantirEpoca()` pedindo o pacote de verdade e a rede
negando (`page.route` → `abort`). Não é artefato de sonda: os pedidos saem (`pack-hoje.json` e
`pack-naodito.json` negados), o jogo não quebra, zero erro de console — e o `#fundoHD` pinta um
**borrão laranja** em vez da mata atlântica. Print: `test/RECUO-temfonte.png`.

**As quatro medidas que fecham o diagnóstico:**

| situação | `fundoIdx()` | o que o `#fundoHD` pinta |
|---|---|---|
| PINDORAMA, pacote negado | 0 | verde — `rgb(63,89,35)` ✔ |
| O QUE TEM FONTE, pacote negado | **0 também** | laranja borrado ✘ |
| O QUE TEM FONTE, pacote chega | 11 | o arquivo, correto ✔ |
| a imagem de recuo | — | 720×959, **o mesmo objeto** que o capítulo 1 desenha ✔ |

**O mesmo índice, a mesma imagem, e cores diferentes.** Logo a escolha da PINTURA recua certo —
`fundoIdx()` e `fundoComArte()` fazem o trabalho deles. O que não recua junto é a **tinta do**
**capítulo**: o tom quente de sala de arquivo aplicado sobre a mata atlântica dá exatamente esse
laranja. É a classe de erro "identidade > posição" uma camada acima da que este repositório já
pagou: a arte pertence ao capítulo, e o TRATAMENTO DE COR também tem de pertencer ao capítulo
**de onde a arte veio**, não àquele em que a pessoa está.

**Quanto dura:** só enquanto o pacote não chega — medido: assim que ele chega, a tela fica
correta sozinha. Em 3G isso é a janela de ~6 s da entrada do capítulo. Não é permanente, e foi
por isso que não parou a fila.

**Por que não consertei:** o conserto é fazer a tinta seguir o mesmo recuo da pintura, num lugar
só. Não achei esse lugar dentro do orçamento de duas tentativas (a pista são os "três passes por
quadro sobre o #fundoHD", `src/jogo.ts` ~7832), e mexer na camada visual sem print antes/depois
e sem o aval de `DIRECAO.md` seria trocar um defeito de 6 segundos por um risco permanente.

**Como retomar, e agora é barato:** o sintoma virou número — cor média do topo do `#fundoHD`
com o pacote negado. Verde em PINDORAMA, laranja em O QUE TEM FONTE. Quando a tinta recuar
junto, os dois ficam verdes, e isso vira teste em três linhas.


## 24 · A CHEGADA rola de lado na segunda visita

**Medido em 18/08, com número próprio.** Na segunda chegada o título vira `DE NOVO ATÉ AQUI` e
`pixelRotulo` o desenha em **escala fixa 3** — 291 px de canvas numa `.telaTit` que fica com 335 px
de largura intrínseca, em qualquer tela. Como `#telaFim` tem `overflow: auto`, a tela **arrasta na
horizontal**:

| tela | 1ª chegada | 2ª chegada |
|---|---|---|
| 320×568 | 0 px | **32 px de arrasto** |
| 360×640 | 0 px | **12 px de arrasto** |
| 390×844 | 0 px | 0 px |

Atinge só quem **volta** — que é exatamente o público da pergunta de três dias — e só abaixo de
~390 px de largura.

**A causa é de família:** `escalaQueCabe()` existe e é chamada em **um único lugar do arquivo**
(o `#retTit` do papel da volta). Todo outro rótulo do jogo usa escala fixa. Este é o primeiro que
estoura de verdade; pode não ser o último.

**A armadilha do conserto, e ela já foi paga uma vez:** medir a caixa **antes** de o elemento
estar visível devolve zero, e a escala cai no padrão — foi assim que "ENQUANTO VOCÊ ESTEVE FORA"
saía cortado. E `montarFim()` roda **antes** de `abrirTela("telaFim")`, então uma chamada ingênua
a `escalaQueCabe` dentro de `montarFim` mede zero. O `#retTit` resolve pintando **depois** do
`.aberto`; o `#fimTit` teria de fazer o mesmo.

**Estado:** um agente estava preparando o patch medido quando a sessão virou. Retomar por aí.

## 25 · O corte de AJUSTES relatado em 360×640 NÃO reproduz — e o registro é o valor

Um agente relatou, com números, que a tela de AJUSTES saía 22 px acima e 18 px abaixo da janela
em 360×640, e que a faixa 601–690 inteira estava quebrada por a única consulta de retrato ser
`max-height: 600px`.

**Não reproduz.** Medido em carga fresca a cada altura de 560 a 900, e depois elemento por
elemento a 360×640: título em y=102, último botão terminando em 534 de 640, **nenhum** dos 10
elementos visíveis fora da janela, e o print (`test/CFG-360x640.png`) mostra a tela inteira com
folga — cinco tábuas e o VOLTAR sobrando espaço embaixo.

**Fica registrado por dois motivos.** Primeiro, para ninguém "consertar" isto de novo a partir do
mesmo relatório: mexer numa consulta de mídia que está certa é como se ganha uma faixa morta.
Segundo, porque o instrumento que desmentiu o achado nasceu disso e ficou —
`test/medir-telas-altura.js`, que varre a altura de 20 em 20 px em oito telas. Foi ele que
confirmou o item 24 no mesmo passe.

**O que eu não sei:** por que o agente mediu o que mediu. Pode ter medido outro estado de tela.
Não gastei uma terceira tentativa nisso, porque a pergunta que importa — *a tela cabe?* — está
respondida com print.
