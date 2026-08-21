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

## 25 · ~~NÃO reproduz~~ **REPRODUZ SIM** — eu medi uma tela vazia e disse que cabia

**Retificado em 18/08, no mesmo dia.** Este item dizia que o corte da AJUSTES em 360×640 não
reproduzia, e mandava ninguém consertar. **Estava errado, e o erro era meu.**

**O que eu fiz de errado:** medi chamando `abrirTela("telaConfig")` direto. Isso ABRE a tela mas
não a MONTA — quem enche é `montarConfig()`, chamada pelo toque no botão. Medi uma tela de
**10 nós** e conclui que cabia. **Tela vazia cabe em qualquer altura.**

**Medido de novo pelo caminho real** — abrir o menu e tocar em CONFIGURAÇÕES, que é o que a
pessoa faz. A tela tem **41 nós**, e ela corta:

| tela | título | VOLTAR termina em | rola? | veredito |
|---|---|---|---|---|
| 360×640 | **y = −22** | **658** de 640 | 0 px | corta 22 acima, 18 abaixo |
| 320×520 | **y = −13** | **532** de 520 | 0 px | corta 13 acima, 12 abaixo |
| 360×700 | y = 8 | 688 de 700 | 0 px | cabe |
| 390×844 | y = 80 | 760 de 844 | 0 px | cabe |

`overflow-y: visible` — forçar `scrollTop` move **zero px**. Nada resgata.

**O primeiro agente estava certo, e com os números exatos** (22 acima, 18 abaixo). Eu o
desmenti com um instrumento cego e registrei o desmentido aqui, que é a pior das duas coisas:
um erro que manda a próxima pessoa não olhar.

**A lição vale mais que o conserto:** antes de escrever "não reproduz", pergunte se o
instrumento exercita o caminho da PESSOA. `abrirTela` é atalho de teste; `montarX()` é o jogo.
Seis das oito telas do `medir-telas-altura.js` estavam sendo medidas vazias pelo mesmo motivo —
A HISTÓRIA com 5 nós em vez de 568, DE ONDE VEM com 4 em vez de 207.

## 26 · Tela parada e VISÍVEL conta como tempo jogado — e isso é decisão do dono

**Medido em 18/08**, 15 s de página aberta e visível **sem um único toque**: `R.segundos` **+15,02**.
O laço de quadro soma `dt` em todo quadro, sem guarda de ociosidade.

**Não estou chamando isso de defeito, e a razão é que o comentário do código é mais preciso do
que parece.** Ele diz: *"mede tempo JOGADO e não tempo de aba aberta: uma noite com o jogo
esquecido numa aba **de fundo** não conta um segundo, porque o `rAF` não roda"*. A frase fala de
aba **de fundo**, e ali ela está certa. Ela não afirma nada sobre aba visível e parada.

**A pergunta é de produto, não de código:** uma pessoa com o jogo aberto na tela, sem tocar,
está jogando? Num jogo *idle* a resposta não é óbvia — parte do gênero é justamente o número
subir sozinho enquanto se olha.

**A exposição real é menor do que parece, e isto importa para a decisão.** O alvo é celular, e
lá a tela apaga sozinha por conta do sistema (~30 s a 2 min). Ao apagar, a aba fica oculta e o
`rAF` para. Então o tempo parado-e-visível é limitado pelo tempo de tela do aparelho, não pelo
descuido da pessoa. No computador — que não é o alvo — uma aba visível esquecida contaria horas.

**O que muda conforme a resposta:** `minutos` e `sessao` do evento `parou`, o total da tela de
AJUSTES, e a janela dos primeiros 60 s da hipótese H5. São os números que respondem a pergunta
de três dias.

**As saídas, se ele quiser mexer:**
- **(a) deixar como está** — "tempo com o jogo na frente" é uma definição defensável para idle, e
  a exposição no celular é curta;
- **(b) guarda de ociosidade** — parar de contar após N segundos sem toque. Escolher o N é a
  decisão real: 30 s corta a contemplação legítima do idle, 5 min quase não corta nada;
- **(c) contar as duas coisas** — um contador de tempo com a tela na frente e outro de tempo com
  toque nos últimos N segundos, e comparar. Custa um campo no save e responde a pergunta em vez
  de arbitrá-la.

**O que EU consertei sozinho, porque ali a intenção já estava escrita:** `sessaoSeg` não
reiniciava ao voltar do segundo plano, então a segunda saída do dia relatava a carga de página
inteira como uma sentada só. O comentário do próprio campo diz que ele existe para separar *"parou
no capítulo 3 com 40 s"* de *"parou no capítulo 3 com 25 min"* — duas pessoas opostas. Corrigido e
medido: 2ª sentada relata 4,42 s em vez de 10,85, e `R.segundos` segue sendo o total do save.

## 27 · Vinte e dois momentos com fonte JÁ LIDA, prontos e não aplicados

**18/08.** Uma varredura do `NOTES.md` inteiro achou **27 afirmações com fonte lida e citação
literal já registrada** que nunca viraram momento na `LINHA_TEMPO` — e só o que está lá vira
placa, entra em A HISTÓRIA e alimenta a nota da volta e a rua de O QUE TEM FONTE.

**Dez entraram** (O CAIS 1831 e 1850; O QUE SEGUROU calamidade+auxílio, ADI 6341, Anvisa):
momentos 31 → **41**, e **nenhuma placa trocou**, que era a condição em todas as rodadas.
**Faltam 17**, e os que sobraram são justamente os que MUDAM a placa ou dependem do §2.

### A regra mecânica que decide tudo isto, e ela foi medida em 10 de 10 capítulos

Capítulo de **1 cena carrega exatamente 1 placa**, quantos momentos tenha — então acrescentar
momento nos onze capítulos de uma cena **não mexe no save**. E, com uma vaga só, **a placa é o
ÚLTIMO momento do capítulo na ordem da lista**. Ou seja: **a posição de inserção escolhe qual
fato vai para a estrada.** Isso não é detalhe de implementação; é decisão editorial disfarçada.

### O que falta, por capítulo, e o que cada lote faria com a placa

| capítulo | nós prontos | a placa | fonte no NOTES |
|---|---|---|---|
| JABAQUARA (1 momento) | **4** | trocaria para *"Todos de profissão roceiros"* — o sujeito vira quem sustenta | 5013–5030 |
| O QUE NÃO PODIA SER DITO (1) | **3** (+1 opcional) | trocaria para *"Vinte e quatro horas dão para copiar"* — idem | 6404–6418 |
| A PEQUENA ÁFRICA (2) | **4** | trocaria para *"A certidão e o título que falta"* | 5091–5103 |
| SALVADOR (2) | **2** (o levante de 1835) | depende do ponto — ver PARE abaixo | 1935–1937 |

| A PRAÇA (2) | **1** (+1 opcional) | trocaria para *"Trinta mil assinaturas"* | 6508–6510 |

| AINDA AQUI (2) | **1** (Lei 14.402/2022) | é o único que muda `MARCOS.length` (17 → 18) | 489–491 |

**O que isto move, medido:** momentos 36 → **58** com tudo. Capítulos com 3 ou mais momentos:
4 de 13 → **12 de 13**. E a rua de O QUE TEM FONTE cresce sozinha junto, porque
`montarConferiveis()` deriva da `LINHA_TEMPO`.

**PINDORAMA, PALMARES e O QUE TEM FONTE não crescem** — os dois primeiros estão saturados
(5 e 4 momentos, tetos 3 e 2) e o terceiro não tem de onde tirar sem inventar: o assunto dele é
o método, e todo fato datado que ele usa é do capítulo anterior e já é nó.

### ⚠ TRÊS PERGUNTAS DE §2 QUE SÃO DO DONO, e por isso nada de JABAQUARA e SALVADOR entrou

1. **Quintino de Lacerda pode ser nomeado?** Ele liderava o quilombo do Jabaquara, já é nomeado
   na abertura e no fecho do capítulo — mas virou vereador de Santos em 1895, e a regra diz
   *nunca nomeia político*. Há duas versões do nó prontas: com o nome (só como quem liderava o
   quilombo, sem a vereança) e sem o nome.
2. **A placa de SALVADOR pode anunciar o levante de 1835?** O §2 escrito no próprio arquivo manda
   o 25 de janeiro ficar *"no FECHO e na LINHA_TEMPO — nunca jogável"*. A placa é uma **terceira**
   superfície: deriva da LINHA_TEMPO e aparece **durante** o capítulo, cuja mecânica é a véspera.
   Inserir antes de *"As ganhadeiras"* mantém a placa como está; inserir depois faz a estrada
   anunciar o levante.
3. **O manto Tupinambá entra como nó?** Objeto sagrado de povo vivo, e o nó nomearia uma anciã
   viva. O §2.4.5 permite como fala e proíbe como item — e um nó é fala. Não decidido. Se entrar,
   a fonte precisa ser relida na origem: o NOTES traz resumo com link, não citação literal.

### E uma dúvida estrutural que vale mais que os 22 nós

**Os seis nós indexados (`{ tipo: "momento", i: 0..5 }`) são invisíveis para dois dos três
consumidores.** Sem `t`/`d`/`f` no próprio nó, eles não entram na `notaDaVolta` nem em
`montarConferiveis()` — só aparecem como página de A HISTÓRIA. Para as placas isso é deliberado
(não têm `cena`); para os outros dois parece acidente. Consequência: **Zumbi, os mocambos, o
Censo de 2022 indígena e a portaria dos Tupinambá nunca saem na nota da volta.** O conserto não
inventa nada — copiar `q`/`t`/`d`/`f` de `MOMENTOS` para os nós, ou dar `cena` a eles.

## 28 · O que o QA adversarial derrubou e eu ainda não consertei

**18/08.** Um QA independente tentou derrubar os nove consertos do dia. Derrubou **cinco**. Um
já foi consertado (o `salvoEm`, abaixo). Ficam quatro, e o mais grave nem estava na lista.

### `medir-telas-altura.js` tem asserção vazia em 3 de 8 telas

O filtro `!podeRolar` descarta toda reprovação de tela que rola — e `telaMenu`, `telaFim` e
`telaObra` rolam, então **nunca podem reprovar**. Pior: o seletor cobre 4 classes, o que na
CHEGADA são 7 nós de 61. Medido com o botão-âncora de cada tela: o VOLTAR da CHEGADA fica
**abaixo da dobra em 10 de 10 alturas** (+192 a +522 px), e o da obra em 10 de 10 a 320 px.
Pode ser desenho — páginas que rolam —, mas então a frase "cabe em toda altura" não descreve o
que foi medido, e o instrumento não tem como um dia dizer o contrário.

### O que o QA NÃO derrubou, com número

O pagamento da ausência ao voltar do segundo plano (cinco ataques de pagamento duplo, todos
negativos, inclusive com duas abas), o reinício de `sessaoSeg` (13 campos varridos, nada mais
mudou; uma saída dispara UM evento), as 17 placas (bits únicos, nenhuma fora do vão, nenhuma
inalcançável, folga mínima de 750 de impacto), e o save hostil contra 17 ataques novos que eu não
tinha escrito — `arco` fora de faixa, `marcosN` mentiroso, `obraVista` maior que `obra`, recursos
fracionários, `\u0000` no `modo`, `acolhidos` como objeto com `length`. Nenhum vazou.

## 32 · ~~A primeira linha de PINDORAMA: a revisão está pronta e o teste reprova~~ — RESOLVIDO 20/08

**RESOLVIDO em 20/08 pela historiadora, e a hipótese registrada abaixo estava CERTA: o defeito era
do instrumento.** O bloco 9 do `encaixe.js` media a abertura com a **travessia ainda viva por
baixo** — a metade de cima do bloco a deixa correndo (~90 s; o teste espera 15) e a de baixo
chamava `fecharTudo()`, que fecha as BANDEJAS. Quem chama `fimTravessia()` é `fecharTelas()`
(EQUIPE.md 2.9, a mesma confusão de nomes pela segunda vez). Com a travessia viva,
`terminarLinha()` arma o avanço automático também na abertura, e o que decidia era o COMPRIMENTO
da fala: 3,4 s de cerimônia + 2,07 s de digitação + 4,55 s de pausa = **10,0 s**, logo acima da
janela de 9 s; com 84 caracteres dá **8,53 s**. Ou seja: **o portão passava por 1 segundo de
sorte**, e não por o motor estar certo.

Medido em quatro células (`test/tmp-hist-portao9.js`, tabela no NOTES.md de 20/08): com
`fecharTelas()` antes, os DOIS textos ficam na linha 0. O bloco 9 passou a limpar o estado **e a
cobrar `travessiaAtiva() === false`**, e a frase nova entrou. Nada do motor precisou mudar.

<details><summary>o diagnóstico original de 19/08, que continua valendo como registro</summary>

## 32 · A primeira linha de PINDORAMA: a revisão está pronta e o teste reprova

**19/08.** A historiadora propôs, e eu concordo com a razão: a primeira frase do jogo mede o tempo
pelo navio europeu — *"Muito antes de qualquer navio europeu aparecer no horizonte, já havia gente
aqui"* — num capítulo cujo próprio comentário diz que ele *"deixa de se definir pela chegada dos
outros"*. O texto novo, pronto e sem afirmação nova (a `LINHA_TEMPO` já diz "há mais de onze mil
anos"): **"Este lugar é o litoral atlântico, e faz milhares de anos que tem gente vivendo nele."**

**Aplicada, o bloco 9 do `encaixe.js` reprova**, e o número é limpo: a abertura do capítulo, que
deve **esperar o dedo**, avança para a linha 1 em 9 s. Sem a mudança, fica na 0. **A regressão é
da mudança** — medido com `git stash`, os dois sentidos.

**O que eu NÃO descobri em duas tentativas:** por quê. O avanço automático só roda com
`travessiaViva` (`src/jogo.ts` ~10534), e a suspeita óbvia era vazamento do bloco da travessia,
que roda logo antes no `encaixe`. **Não reproduz isoladamente**: numa sonda que abre a travessia,
fecha, e abre a abertura, `travessiaViva` volta `false` e a linha fica em 0 nos dois casos.

**A hipótese que sobra, e é a mais interessante:** o texto antigo tem 115 caracteres e o novo 84.
Se algo avança a fala e o prazo depende do comprimento, o texto longo **escondia** o defeito e o
curto o revelou. Nesse caso a asserção está certa e o defeito é anterior — a mensagem dela diz
exatamente isso: *"o automático vazou da travessia"*. Vale checar antes de culpar a frase.

**As outras seis revisões da mesma rodada entraram** e os quatro portões ficaram verdes com elas
— só esta ficou de fora.

**Como retomar:** instrumentar `avancarFala` para registrar QUEM o chamou (pilha ou uma marca por
chamador) e rodar o `encaixe` até o bloco 9. Se for vazamento, o conserto é no motor e a frase
entra junto. Se for a frase, a saída é outra redação com o mesmo sentido e mais corpo.

</details>

## 33 · A lista branca da medição só vê os eventos que dispararam antes dela

**19/08, achado ao acrescentar uma propriedade.** O bloco 17 do `encaixe.js` é o portão de
privacidade do repositório: *"qualquer propriedade nova aparece aqui como falha, e é de
propósito — o jeito de vazar algo é acrescentar um campo achando que ele é inofensivo"*.

Acrescentei `ativos` ao evento `parou` e **o bloco passou**. Não porque a propriedade fosse
aprovada — ela não estava na lista —, mas porque **o bloco examina só os eventos que já
dispararam quando ele roda**, e o `parou` nasce no bloco 20, doze blocos depois.

**A consequência é a que o comentário do bloco promete não ter:** hoje dá para acrescentar
qualquer propriedade a `parou`, a `terminou` ou a `volta` e o portão não vê. Só os eventos
precoces — `abriu`, `capitulo` — estão realmente cobertos.

**O conserto é pequeno e não é adivinhação:** o bloco deve DISPARAR cada um dos nove eventos
antes de conferir, em vez de esperar que a partida os produza. `medirParou()`, `chegarAoFim()` e
os outros são chamáveis; o bloco 20 já mostra como se força o `parou`.

**Enquanto isso**, `ativos` entrou na lista à mão, com o motivo escrito ao lado — e o comentário
do bloco diz agora que ele tem esse buraco, para ninguém confiar nele mais do que deve.

## 34 · ~~O jogo se joga sozinho~~ — RETIFICADO 19/08: ERA ERRO DE INSTRUMENTO

**RETIFICAÇÃO (19/08, medido):** o número que motivou este item (parado 4.035/min) estava
ERRADO. Medição desagregada correta: sem U3, parado rende 0/min e tocando 558/min; com U3
(automação comprada), parado 245 e tocando 618 (o toque vale 2,5×). O jogo NUNCA se joga sozinho.
A decisão (b) foi tomada sobre premissa falsa e NÃO foi aplicada. Vai à mesa do dono. Ver NOTES.
O bloco original abaixo fica como registro do que se acreditava.


**19/08, medido por `test/medir-arco.js` e por sonda dedicada.** Não é hipótese, e não é opinião
de gosto: são dois instrumentos e o segundo existe só para responder de onde vem a renda.

| ponto da curva | PARADO, sem tocar em nada | TOCANDO 7×/s | o toque acrescenta |
|---:|---:|---:|---:|
| 0 | 80/min | 437/min | **+357/min** |
| 8.000 | 5.045/min | 4.038/min | −1.007/min |
| 20.000 | 4.035/min | 4.186/min | **+151/min (3,7%)** |

A renda vem dos drops recolhidos pela corrida, e a personagem corre sozinha. Dos ~7.500 de
impacto em diante, largar o telefone na mesa rende o mesmo que jogar. E o arco inteiro leva
**8 a 10 minutos**, então isso vale para quase todo o jogo.

**Por que isto não é bug de número:** `ganhoClique()` vale 1 sem melhoria e 3 com a `u1`. O toque
não ficou fraco — a corrida ficou rica. Consertar mexendo no toque é tratar o sintoma.

**POR QUE NÃO DECIDO SOZINHO.** Mexer aqui é mexer na economia, e o `CLAUDE.md` exige medição
antes/depois — que agora existe, então o impedimento não é esse. O impedimento é que as três
saídas plausíveis mudam coisas diferentes da tese, e a escolha é de produto:

- **(a) o drop deixa de ser automático** — passa a exigir o toque para ser recolhido. Devolve o
  verbo ALCANÇAR ao lugar que o comentário do `src/jogo.ts` já diz que ele tem. Risco: castiga
  quem lê, e o §2.2 já barrou "punir por não alcançar" no capítulo de Palmares, onde quem
  atravessa a tela é GENTE. **A forma teria de ser ganho a mais, nunca perda.**
- **(b) a renda passiva vira teto, não motor** — o automático paga até uma fração da renda do
  minuto e o resto vem do toque. Mexe menos na sensação e menos no §2.
- **(c) não conserta: assume que o jogo é de LEITURA** — e então o laço nunca foi a resposta dos
  três dias, e o esforço vai todo para capítulo novo. É defensável e é honesto; só não pode ser
  escolhido por omissão, que é o que está acontecendo hoje.

Vai para a mesa do próximo `check`, camada OPORTUNIDADES, com **(b)** marcada.

## 35 · O jogo se contradiz sobre a Comissão Nacional da Verdade

**19/08, achado pela varredura da historiadora e confirmado por medição própria nas três fontes.**

- A **fala** de O QUE NÃO PODIA SER DITO (`src/jogo.ts` 2323) declara em voz alta: *"nenhum deles
  entrou: não foi possível ler o documento. Sem fonte na mão, o jogo cala."*
- O **glossário** (12681) afirma: *"O relatório listou 434 mortos e desaparecidos políticos,
  identificou 377 agentes do Estado como responsáveis."*
- O **NOTES.md** (4310) registra por que a fala está certa: *"o servidor dela devolve certificado
  inválido e eu não o li. Continua ✖N e não entrou em fala nenhuma."*

Mas entrou — no glossário, pelo commit `db51b90` (glossário v2), na mesma leva que duplicou a
tábua do menu. **Um número histórico está na superfície que afirma, sem a fonte ter sido lida.**
É o §2 direto, e é do tipo que o repositório inteiro existe para não deixar acontecer.

**Não confundir com o outro número da CNV.** Os 8.350 indígenas mortos entre 1946 e 1988
(verbete RELATÓRIO FIGUEIREDO) foram **aprovados explicitamente pelo dono** em 06/08 — NOTES.md
linha 578, *"são dados importantes"*, com a ressalva da própria Comissão. Aquele fica.

Uma historiadora está tentando LER a fonte agora. Duas saídas, e a segunda é a que vale se ela
não conseguir: ou o número ganha lastro e a **fala** muda para afirmá-lo, ou o número **sai do
glossário** e o jogo volta a dizer a mesma coisa nas duas superfícies.

## 36 · DO DONO — o marco temporal pode subir de verbete para fala?

**Devolvido pela historiadora, que parou sozinha na regra certa.** A fala de AINDA AQUI diz
apenas *"É uma disputa em curso"*. O verbete MARCO TEMPORAL nomeia a disputa inteira: o STF
julgou a tese inconstitucional em setembro de 2023 (RE 1.017.365, repercussão geral); semanas
depois o Congresso aprovou a Lei nº 14.701/2023, que a reinstituiu em texto legal.

A régua dos cinco anos do §2.6 diz **"nada em julgamento"**, e a disputa segue no Judiciário.

- **(a)** sobe para a fala, citada como decisão com número de processo e lei com número, sem
  adjetivo — a pessoa fica sabendo que a disputa tem forma jurídica, não só clima.
- **(b)** fica no glossário até haver decisão sem litígio pendente — coerente com a régua, e o
  capítulo do presente continua dizendo "disputa em curso" sem dizer qual.

A fala hoje tem 103 caracteres; com os dois documentos teria ~180.

## 37 · DO DONO — o fio quilombola tem fecho próprio ou entra na fala de AINDA AQUI?

**Também devolvido pela historiadora, e ela não escreveu texto de propósito** — `ROSTOS.md` é
somente leitura para agente e a pergunta é de representação.

Existe um nó da LINHA_TEMPO **pendurado na cena de AINDA AQUI** — *"2022 · Quilombos hoje: o
Censo de 2022 contou, pela primeira vez na história do país, mais de um milhão de quilombolas"*
(IBGE · Censo 2022 · Fundação Cultural Palmares) — e **nenhuma fala do capítulo o diz**. A
abertura traz só 1,69 milhão de indígenas, 391 etnias, 295 línguas. O verbete CONSTITUIÇÃO DE
1988 chama os dois de *"os dois fios deste jogo"*, e o último capítulo só amarra um.

- **(a)** entra uma fala com o dado do Censo no capítulo final.
- **(b)** fica só na linha do tempo, como está.
- **(c)** o fio quilombola ganha superfície própria.

A pergunta por trás, e é ela que é do dono: o capítulo final, cuja protagonista e cujo retrato
foram aprovados como presença indígena, passa a afirmar também o presente quilombola — ou isso é
pedir que um rosto represente dois povos?

**Junto destes dois vai um terceiro, da TRAVESSIA:** a fala *"O resto deste trecho é o mar, e o
tempo que ele leva"* não diz o tempo, e o verbete TUMBEIRO diz — *"de trinta a cinquenta dias"*
(Jaime Rodrigues, *De costa a costa*, 2005 · SlaveVoyages). Boa parte daquele roteiro é do dono
palavra por palavra e o §2.4 é dele, então nem isto se propõe sozinho.

## 38 · 55 worktrees de agente parados na árvore, e apagar em massa é irreversível

**19/08.** `git worktree list` devolve **56 entradas**. Sete estavam limpos e saíram; os cinco
desta sessão foram integrados e removidos. Sobram **55 com alteração não commitada**.

**Quase todos são falso positivo, e a razão é boba:** o que os marca como sujos é `M index.html`,
que é **saída de build** — qualquer agente que tenha rodado `npm test` sujou o arquivo sem ter
escrito nada. O sinal de verdade seria `M src/…` com conteúdo que não está na `main`.

Não apaguei porque separar os dois exige abrir um a um, e `git worktree remove --force`
descarta trabalho sem volta. É disco e velocidade de `git`, não correção — mas cresce sozinho:
são cinco novos por sessão de equipe.

**O conserto certo não é uma faxina, é uma regra:** o agente que entrega deve terminar com a
árvore dele limpa (commit no ramo do worktree, ou nada), e aí `remove` fica seguro por
construção. Vai para o `EQUIPE.md` quando alguém confirmar que não há trabalho preso ali.

## 39 · A MESA TEM DE CARREGAR A IMAGEM, NÃO O NOME DO ARQUIVO — pedido do dono, 2ª vez

**19/08, e ele já tinha dito.** Palavras dele: *"as imagens de referência não estão aparecendo na
mesa… não adianta enviar o nome do arquivo, preciso da imagem em si para copiar (já falei isso
haha garanta q sempre apareça caso precise para dar contexto)"*.

O caso que o fez repetir foi o `cap4-retrato-v2`: a mesa pedia o retrato novo da ganhadeira de
SALVADOR citando **só o nome do arquivo**. Quem lê no celular, prestes a mandar o pedido para o
gerador de imagem, não tem como anexar um nome.

**A regra, e ela vale para toda mesa daqui em diante:** toda linha de arte na página publicada
carrega a imagem **embutida em base64** — a de REFERÊNCIA e, quando for substituição, também a
ATUAL que vai sair —, mais o prompt num bloco de copiar ao lado. Se a imagem não couber na
página, ela vai como arquivo entregue na conversa **no mesmo momento** em que o pedido é feito.

**Por que isto é estrutural e não descuido:** o pedido de arte só existe para virar imagem, e o
gargalo dele é o momento em que ele sai da mesa para o gerador. Um pedido sem a referência anexa
não é um pedido incompleto — **é um pedido que não pode ser executado**, e cada um deles custa
uma ida e volta com o dono.

*(O desencontro do `cap4-retrato-v2`, medido comparando a folha com o retrato: o pano da costa do
sprite é listrado azul/vermelho/rosa/branco amarrado na cintura com franja, e o do retrato é cru
e ferrugem atravessado no peito; o torço do sprite é do mesmo tecido listrado, e o do retrato é
liso. São duas mulheres diferentes vestidas parecido — e o retrato é o rosto de quem se joga.)*

## 40 · Os 14 verbetes dos 3 capítulos sem porta — aguardando QA, correção do 1932 já feita

**19/08.** A historiadora entregou 14 verbetes que dão porta de glossário a A PRAÇA, O QUE
SEGUROU e O QUE TEM FONTE (hoje com zero), mais a correção do voto de 1932 e 3 revisões de fala.

**FEITO e verificado por mim na fonte primária:** a correção do 1932. O glossário afirmava que o
voto feminino exigia "autorização do marido", citando o próprio Decreto nº 21.076 — que diz o
oposto ("sem distinção de sexo", art. 2º; voto facultativo para mulheres, art. 121). Li as duas
cópias (Câmara legin e Planalto), confirmei, corrigi. Commit `c705a30`.

**AGUARDANDO QA adversarial** (rodando): os 14 verbetes. O rascunho está preservado em
`scratchpad/verbetes-propostos.json` e nas sondas do worktree `agent-ab61180f159d428c0`
(`test/tmp-propostos.json`). Cada um afirma número de lei/artigo, e a regra do dono é verificar a
fonte primária, não confiar no relatório do agente. O QA vai a cada lei citada. Só integro os que
ele confirmar.

**3 revisões de fala seguradas, cada uma com armadilha já identificada** (do relatório anterior):
(a) AS PORTAS 1932 — resolvida pela correção acima, a fala pode citar o art. 2º; (b) A PRAÇA
1989 — precisa ancorar à derrota de 1984 e não virar última palavra; (c) SAMBA — a disputa de
autoria de "Pelo Telefone" precisa da citação exata (a historiadora achou: nota do Jornal do
Brasil de 4/02/1917, mas as fontes divergem se era criação coletiva; o conserto é no verbete).

**PENDENTES do dono que saíram deste trabalho:** a exceção do nome-de-lei se estica para "Lei
Caó" e "Lei Afonso Arinos" (verbete INAFIANÇÁVEL)? E nomear os cinco sambistas da nota de 1917?
Os dois são representação — vão para a mesa dele, não decido.

## DECISÕES DO DONO em 19/08 (check clicável) — quatro resolvidas

1. **PENDENTES 34 (a economia depois do cap. 5) → decidido (b): renda passiva vira teto, não motor.**
   O ganho automático passa a pagar até uma fração da renda do minuto; o resto vem do toque. É
   MINHA para fazer, com medição antes/depois (a régua do CLAUDE.md). NÃO fechada até aplicada e
   medida — continua aqui como tarefa minha, sai quando estiver no ar.

2. **A exceção do nome-de-lei se estica → SIM.** "Lei Caó" (7.716/1989) e "Lei Afonso Arinos"
   (1.390/1951) podem ser nomeadas, como a Emenda Dante de Oliveira — NOMEANDO a lei, nunca
   narrando a pessoa. FEITO: verbete INAFIANÇÁVEL E IMPRESCRITÍVEL passou a citar os dois nomes
   populares. Confirmado que são os nomes consagrados (Câmara, Senado, Agência Brasil). RESOLVIDO.

3. **PENDENTES 36 (marco temporal sobe para fala?) → NÃO.** Fica no glossário até não haver
   litígio pendente. A régua dos 5 anos do §2.6 diz "nada em julgamento", e a disputa segue no
   Judiciário. RESOLVIDO — a fala de AINDA AQUI continua "disputa em curso" sem citar processo.

4. **PENDENTES 37 (o fio quilombola no capítulo final) → ganha SUPERFÍCIE PRÓPRIA.** Não entra na
   fala de AINDA AQUI (cuja protagonista foi aprovada como presença indígena — pedir que um rosto
   represente dois povos seria errado). O QUE a superfície é ainda precisa de decisão de
   representação do dono; a DIREÇÃO está dada. Fica aberto só nessa parte.

## 41 · A PLATAFORMA COMEÇA PELAS SEÇÕES QUE JÁ EXISTEM — decidido pelo dono, 19/08 (check)

Escolha dele no check: dar **endereço próprio** às seções já escritas, antes de qualquer migração.
`matheusferreira.cc/historia` · `/glossario` · `/de-onde-vem` como páginas navegáveis, reusando o
texto que já está no jogo (medido: as seções dependem do jogo em 1,9% a 17,4% — quase autônomas).

**É a "home como proposta" nascendo com o que existe.** Ordem dada por ele: (1) endereço às
seções; (2) a home; (3) a migração. A /sala e a migração ficam para depois.

**MINHA para fazer, e é trabalho de plataforma, não de jogo.** Restrições que já valem:
- Cada seção precisa **valer sozinha** (o teste do dono: dá para mandar o link a quem nunca jogou?).
- Sai do mesmo texto-fonte do jogo — não duplicar conteúdo, gerar as páginas a partir de
  `LINHA_TEMPO`, `GLOSSARIO`, `FONTES`. Uma fonte, duas saídas (como o build já faz com o jogo).
- Endereço no domínio → passa pela Vercel (`dist/`), como a `/mesa`. Sem login.
- A tela ONDE FOI continua sendo do dono (TERRITORIO.md) — o mapa é seção dele, não minha.
- O §2 vale igual: as páginas afirmam história, então cada número tem fonte, e a home é a
  proposta sem virar palanque (a mão leve do §1).

**Próximo passo concreto:** um spec curto de como as 3 seções viram páginas a partir do
texto-fonte, e qual a primeira (proponho A HISTÓRIA — é a mais autônoma, 1,9%, e é uma linha do
tempo do Brasil publicável hoje).

## 41 (progresso) · A HISTÓRIA virou página — o padrão está de pé

**FEITO em 19/08:** `matheusferreira.cc/historia` no ar (HTTP 200), gerada por
`ferramentas/gerar-historia.js` a partir do `LINHA_TEMPO` do jogo — uma fonte, duas saídas, 47
momentos com fonte. Define o padrão visual das outras seções (tokens papel/tinta/mata do check,
Bitter+Source Sans, a fonte ao lado de cada momento, "quem lê hoje" marcado como leitura).

**Falta, e é a fila da plataforma:**
- **O GLOSSÁRIO vira `/glossario`** e **DE ONDE VEM vira `/de-onde-vem`**, no mesmo molde — um
  `gerar-glossario.js` e um `gerar-fontes.js` irmãos do de história. O build já tem o loop de
  seções (`for (const secao of ['historia'])`) — é acrescentar o nome.
- **A HOME precisa LINKAR para as páginas.** Hoje os botões A HISTÓRIA/GLOSSÁRIO abrem as telas
  DENTRO do jogo; a plataforma tem as páginas SEPARADAS. Falta decidir com o dono: as páginas
  são a cara pública (a home aponta para elas) ou um espelho? É pergunta de produto — não decido.
- **A home da plataforma** (a proposta como página, separada do menu do jogo) — item 2 da ordem
  do dono, depois das seções.

**Aprovação pendente do dono:** o padrão visual da /historia. Se ele aprovar, as outras saem
iguais; se não, ajusto antes de replicar (para não refazer três).

## DECISÕES DO DONO em 19/08 (check de fim de dia) — quatro

1. **O padrão visual das seções → APROVADO, publicado.** /glossario (181 verbetes) e
   /de-onde-vem (60 fontes) estão no ar, no molde da /historia. A plataforma passou de uma seção
   para três. RESOLVIDO.

2. **PENDENTES 41 (as páginas são cara ou espelho?) → A CARA da plataforma.** A home aponta para
   elas, elas convidam a jogar; o jogo é uma seção entre elas. RESOLVIDO — e vira a fila: falta a
   HOME DA PLATAFORMA (a proposta como página que linka para as seções), item 2 da ordem do dono.

3. **PENDENTES 34 (a economia) → FICA COMO ESTÁ.** O toque vale 2,5×, o U3 é automação comprada,
   não há vazamento (era erro de instrumento). Sem ajuste. FECHADO.

4. **O verbo de AINDA AQUI → "ACOMPANHAR".** O dono escolheu das três opções (acompanhar ·
   conferir a demarcação · não atravessar). Isto DESTRAVA o único capítulo sem verbo e a folha de
   gente dormente dele. **O QUE FALTA, e é §2 + design, não invento sozinho:** o que "acompanhar"
   FAZ mecanicamente — a mão da pessoa no capítulo do presente indígena. Preciso PROPOR a mecânica
   (como os outros 12 verbos, mas sem transformar presença indígena viva em recurso a coletar) e
   levar ao dono. É o próximo item de conteúdo que move a tese (bonito·divertido·ensina) no fim
   do arco. Ver NOTES.md ~7284 (a folha de gente existe, dormente).

## 42 · A HOME DA PLATAFORMA está pronta em rascunho — falta o dono decidir ONDE ela mora

**19/08.** A home da plataforma (a cara que amarra as 3 seções + o jogo) está gerada por
`ferramentas/gerar-home.js` em `plataforma/index.html` (rascunho, gitignored, fora do loop de
seções do build). Mostrada ao dono: o nome BRASIL, a proposta aprovada, JOGAR como chamariz em
destaque, e A HISTÓRIA/O GLOSSÁRIO/DE ONDE VEM como cartões com número.

**A DECISÃO É DELE, e é de arquitetura — mexe na URL do jogo:**
- **(a) A home vira a raiz** (`matheusferreira.cc/`), e o jogo move para `/jogo`. A home é a
  primeira coisa que a pessoa vê — é a "home = proposta" que ele desenhou, ao pé da letra. Custo:
  muda a URL do jogo (estabelecida, no cartão do link do WhatsApp), mexe no build (o index.html da
  raiz deixa de ser o jogo), e os pack-*.json e o `dominio.js` precisam acompanhar. É a mudança
  mais fiel à visão e a mais trabalhosa.
- **(b) A home num subcaminho** (`/inicio` ou `/sobre`), a raiz continua o jogo. Baixo custo, não
  mexe em nada do jogo — mas a home não é a "primeira coisa", e quem digita o domínio cai no jogo,
  não na proposta.

**Quando ele decidir:** se (a), é uma fase com cuidado (mover o jogo, ajustar build/dominio/cartão
do link, testar que o jogo abre na URL nova); se (b), é rápido (acrescentar 'plataforma' ao loop
de seções com o nome do subcaminho, tirar do gitignore, build, push).

## 43 · PALMARES: duas precisões que a historiadora mediu e NÃO aplicou (20/08)

As duas são **acréscimo**, não correção — nenhuma das duas falas está errada —, e as duas mexem em
mais de um lugar. Por isso ficaram fora da rodada dos quatro textos e ficam aqui inteiras, com
fonte, para não custarem pesquisa de novo.

**(a) Palmares é mais velho do que a fala diz.** A abertura 2 e o verbete PALMARES dizem os dois
*"a partir de mais ou menos 1630"*. **Flávio dos Santos Gomes** (*Palmares*, Contexto, 2005 — já é
a fonte do verbete) registra que as **primeiras referências documentais a Palmares são de 1597**, e
que há menção a um quilombo formado por fugidos de engenhos de Pernambuco por volta de **1580**.
**Silvia Hunold Lara** data em **1630–1654** (ocupação holandesa) a consolidação da REDE de mocambos
que ficou conhecida como Palmares — que é o que a fala descreve. As duas coisas convivem: mocambos
antes, rede depois. O que a fala de hoje faz sem querer é datar o começo da fuga pela guerra
europeia. **Custo:** uma frase na fala (cabe: a linha tem 130 de 260) **e** uma no verbete, senão as
duas superfícies discordam.

**(b) A Coroa terceirizou a guerra, e a fala esconde isso.** O fecho 1 diz *"as tropas da Coroa
destruíram Palmares"*. Quem tomou o Macaco em 1694 foi uma tropa **contratada**: contrato de guerra
de **1687** com o governador da capitania, e outro de **dezembro de 1691** com o governador de
Pernambuco, pagando em **sesmarias na área do quilombo**, **um quinto** do que fosse tomado e
gratificação por pessoa devolvida ao senhor. Isso paga a linha da abertura ("mais de vinte
expedições") e é a lição inteira: depois de vinte fracassos, a Coroa comprou a guerra. **Custo e
por que não entrou:** a versão medida (`as tropas contratadas pelo governo da capitania`) dá **257
de 260 caracteres** — 3 de folga é frágil demais para uma fala que alguém vai reescrever —, e o
pagamento em terra e em gente pede verbete próprio para não virar frase solta. **§2:** o nome do
contratado NÃO entra em fala nenhuma; o sujeito é o governo, o documento é o contrato.

## 44 · `encaixe.js` está VERMELHO na main, e não é de agora (20/08) — **FECHADO em 20/08, mesma noite**: era regressão MINHA (clamp da proposta, +0,46px×2 linhas + line-height 1,28 em 390px estourava a folga de 4px). Consertado em src/estilo.css (calc 5px+1.4vw, line-height 1,15 no celular); encaixe 395/395 exit 0.

`node test/encaixe.js` sai **1**: *"390×812: o menu não rola com todas as tábuas dentro (7px, folga
de 4 para arredondamento de subpixel)"* — `7 tábuas · 50–72px · rolagem 7px [logoImg 210 + menuSub
39 + poste 498]`. Só nessa altura; 640, 700, 720 e 932 passam com rolagem 0.

**Medido com `git stash` nos dois sentidos na rodada da historiadora: idêntico no HEAD**, sem
nenhuma das mudanças de texto. É defeito anterior, de layout, e está no portão que a EQUIPE.md
manda ler por exit code — ou seja, **hoje qualquer agente que rode os quatro portões vê vermelho e
não sabe se é dele**. Conserto provável: 7 px em `logoImg`/`menuSub`/`poste` naquela faixa. Quem
pegar: registre o antes/depois nas cinco alturas, não só na que falha.

## 45 · RECORRENTE — validade dos numeros datados (decidido em 21/08)

Todo outubro/novembro: nota do PRODES (O ACEIRO, fala 2 + fecho 1 + duas fontes). Todo maio:
MapBiomas RAD. Censo IBGE: proxima edicao a verificar. O alerta automatico mensal
(scheduled task alerta-validade-brasil) avisa na mesa; ESTE item garante que mesmo sem o
alerta alguem olhe nas janelas certas. Nao fecha nunca — e recorrente de proposito.
linha de teste do funil (21/08) — apagar apos o teste
