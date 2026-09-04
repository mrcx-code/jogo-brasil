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

### Aprovado pela triagem, ainda NÃO embutido (4)

Nenhum destes tem defeito conhecido — só não chegaram a entrar porque a integração parou.

- **`q-p19`** — o refazer resolveu. Detalhe em `recusadas.json`, lista `resolvidas`.
- **`cap4-obj-v2`** — os três itens de SALVADOR (tabuleiro, balde d'água, trouxa de roupa)
  recortados com folga, em magenta limpo. São OBJETOS, que é o que a §2 exige do que a mão
  alcança: a frase de abertura do capítulo já promete exatamente estes três.
- **`cap3-obj-galao-v2`** — o galão de 20 L de AINDA AQUI, centrado e com contorno duro.
- **`trav-mar`** — o mar aberto da TRAVESSIA, sem navio e sem gente. Vai para `TRAV_B64`, que
  inteiro já viaja no pacote `travessia`.

`ctx-vao-cidade-africana` SAIU desta lista em 03/09 — a nota acima estava desatualizada em dois
pontos: (a) ela já estava embutida desde 15/08 (`ferramentas/processadas.json`), não "ainda não
embutida"; (b) o prefixo `vao` nunca teve como ganhar linha em `PACK_DO_CTX_PREFIXO` (que só lê
`capN`), então ela pesava **60,9 KB (62.371 bytes)** na PORTA DE ENTRADA em silêncio — achado do
item `porta-entrada-cresce-em-silencio`, medido por nuvem-20260902T1623 e conferido por
nuvem-20260903T0822. **Consertado nesta rodada:** `PACK_DO_CTX_EXTRA` classifica a chave por
nome para o pacote `salvador` (é onde o CTX de SALVADOR já mora, e onde PENDENTES já a triava),
e o build passa a REPROVAR (exit 1) se uma chave de CTX_B64 sem forma `capN` aparecer sem entrada
nessa tabela — ver `ferramentas/pacotes.js` (`formaCtxDaChave`) e `ferramentas/construir.js`.
**O que continua em aberto, e é do dono (§2), não desta entrega:** nenhum código exibe esta
imagem hoje (a chave aparece uma vez só em `src/jogo.ts`, a própria definição — conferido por
`git grep -c`). A pergunta "ela deveria ser exibida em SALVADOR, ligada a um marcador de A
HISTÓRIA, ou sair do repositório?" não foi decidida — só a classificação técnica, que serve às
três respostas igualmente.

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

**19/08.** A home da plataforma (a cara que amarra as 3 seções + o jogo) já está no ar como a
PORTA — `plataforma/index.html` — e desde 22/08 é GERADA por `ferramentas/gerar-porta.js`, com
os números extraídos do jogo headless (portão `test/medir-porta-secao.js`). Mostra ao dono: o
nome BRASIL, a proposta aprovada, JOGAR como chamariz em destaque, e A HISTÓRIA/O GLOSSÁRIO/DE
ONDE VEM como cartões com número. *(O rascunho anterior `gerar-home.js`, estagnado e fora do
loop, foi removido em 22/08 — superado por gerar-porta.js.)*

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

## 44 · `encaixe.js` está VERMELHO na main, e não é de agora (20/08)
 — **FECHADO em 20/08, mesma noite**: era regressão MINHA (clamp da proposta, +0,46px×2 linhas + line-height 1,28 em 390px estourava a folga de 4px). Consertado em src/estilo.css (calc 5px+1.4vw, line-height 1,15 no celular); encaixe 395/395 exit 0.

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

## 46 · `encaixe.js` bloco 14 VERMELHO na main desde 801394c (21/08) — **não é do dev-jogo**

`node test/encaixe.js` sai **1** numa asserção só: *"a imagem mora no MESMO endereço da página (as
URLs mudam juntas ou a prévia quebra)"*. Medido nesta rodada com CONTROLE no HEAD antes de
qualquer mudança minha: **394 ok · 1 FALHA, idêntico antes e depois** — a home increment 2 não
tocou nisso.

**A causa, achada por `git log -S`:** o commit `801394c` ("Growth aplicado — og/canonical/sitemap")
mudou o `og:url` de `@@BASE@@/` para `@@BASE@@/jogo/` em `src/index.html`, seguindo a decisão
D-home (o jogo mora em `/jogo`, a porta na raiz). O `og:image` continua — **corretamente** — em
`@@BASE@@/compartilhar.jpg`, que é onde o arquivo é publicado (`dist/compartilhar.jpg`, na raiz).

**O defeito é da ASSERÇÃO, não do jogo.** Ela compara prefixo de CAMINHO
(`ogI.indexOf(ogU_sem_barra + '/') === 0`), o que passou a exigir que a imagem morasse *debaixo de*
`/jogo/`. A promessa que o bloco escreve para si mesmo é outra, e continua boa: *"as URLs mudam
JUNTAS ou a prévia quebra"* — ou seja, mesma ORIGEM. O conserto é comparar a origem em vez do
caminho: extrair `new URL(x).origin` das duas e exigir que sejam a mesma. Isso continua reprovando
o defeito para o qual o bloco nasceu (trocar de domínio e deixar a imagem no antigo) e para de
reprovar a separação de caminho que a D-home criou de propósito.

**Por que não apliquei:** onde o jogo mora e as tags `og:` são do **dev-plataforma** (fronteira da
DUPLA, 21/08). Fica aqui com o diagnóstico pronto — não sai daqui sem estar feito ou descartado
pelo dono.

## 46 · FILA-AUTH — a pagina ja fecha, o BANCO ainda nao (21/08, dev-plataforma)

**ATUALIZADO EM 22/08 — o login virou PIN** (dono: *"o login do celular deve ser com um pin,
simples mesmo... nao patinhas"* e *"localhost n precisa entrar ne"*). O OTP por e-mail saiu
inteiro do `dashboard/index.html`; entrou um campo de PIN, que por baixo e a senha de uma conta
sintetica (`dono@mesa.brasil`, `grant_type=password`), mais "trocar PIN" (PUT `/auth/v1/user`)
e o gate de localhost. **O minimo do PIN e 8 digitos** (dono, 22/08, apos a conta da seguranca:
10^6 -> 10^8) — cobrado no cliente na entrada e na troca, e o painel precisa da linha
`password_min_length = 8` para valer tambem para quem nao passa pela pagina (BLOCO 3, item 7).
Medido em **19 cenas** (`node test/fila-auth.js`, exit 0) com **13 defeitos vistos mordendo**
(`node test/fila-auth-controle.js`, exit 0).

**Mas a fila `mesa_resposta` continua aceitando INSERT
anonimo** — a metade que falta e SQL, e SQL nao se aplica pelo REST anonimo. Esta escrito e
comentado em `ferramentas/fila-auth.sql`, para quem integra aplicar pelo MCP do Supabase.

Enquanto nao for aplicado, o buraco e o de sempre: **qualquer pessoa com a chave publicavel
escreve na fila que ACIONA agente**. A pagina ja funciona nos dois mundos, entao aplicar nao
quebra nada e nao precisa de deploy junto.

Cinco coisas que o SQL sozinho NAO resolve, e estao no proprio arquivo:

1. **`authenticated` nao e "o dono".** Com o cadastro aberto no Auth, qualquer um cria conta
   por e-mail e volta a escrever. Fechar o cadastro (BLOCO 3) **e** prender a policy ao uuid
   dele (BLOCO 2-B) — as duas, nao uma.
2. **A conta precisa nascer JA CONFIRMADA** (`email_confirm: true` no `createUser` do MCP —
   BLOCO 3, item 2). `dono@mesa.brasil` nao existe como caixa postal e nunca vai receber
   confirmacao nenhuma: criada sem isso, com "Confirm email" ligado, ela fica pendente para
   sempre e o login devolve *"Email not confirmed"* sem nenhuma tela explicando por que.
   *(Substitui o item que pedia `{{ .Token }}` no template de Magic Link — sem OTP, nao ha
   template a configurar, e a lista de Redirect URLs deixou de ser usada pela pagina.)*
3. **Uma senha adivinhada TROCA a propria conta.** O PUT `/auth/v1/user` que o dono usa para
   trocar o PIN tambem troca o E-MAIL — quem acertar o PIN tranca o dono para fora, e a tranca
   sobrevive a trocar o PIN de volta. O que corta e a trava de painel "Secure password change"
   (BLOCO 3, item 6), da MESMA sentada dos outros. Achado P1 da 2a auditoria (22/08).
4. **O PIN inicial e temporario e a troca e do dono.** Quem cria a conta define uma senha pelo
   MCP e a entrega por fora do repositorio; a primeira coisa depois de entrar e tocar "trocar
   PIN". Enquanto isso nao acontecer, o PIN e conhecido por duas pessoas.
5. **A mesa local (`ferramentas/receber.html`) perde o botao "confirmar prioridades"** — ela
   roda em localhost, sem sessao, e escreve na mesma tabela. A mensagem dela ja foi corrigida
   para dizer a verdade (401/403 = "a fila exige login"), mas o aviso em si passa a sair so
   pelo dashboard. Se isso incomodar, o conserto certo e o `servir.js` ganhar uma rota que
   grave no disco local, nao afrouxar a policy.
   **O dashboard em localhost cai no mesmo caso, e por decisao (22/08):** la nao ha portao, a
   escrita sai anonima e, depois do SQL, vai levar 401 e cair na fila local — o item nao se
   perde, mas tambem nao chega. O administrativo local e do plantao, pelo MCP.



## 48 — A mesa sobrescreve o backlog com retrato VELHO (lost update) — dev-plataforma — **FEITO em 21/08 (dev-plataforma)**

**Como ficou:** `GET /backlog` devolve o documento com um `hash` (sha1 dos BYTES em disco), o
`POST /backlog` exige esse campo e responde **409 "recarregue a mesa"** quando a base não bate;
o POST devolve o hash NOVO, senão a segunda reordenação seguida cairia em 409 sozinha. A mesa
(`ferramentas/receber.html`) guarda o hash do GET, manda em todo POST e, num 409, **recarrega e
avisa** em vez de insistir — insistir é o próprio lost update. Medido por curl contra uma cópia
do servidor em porta separada (`MESA_PORTA=8271`, a mesa do dono intocada em 8200): hash errado
→ **409**; sem hash → **400**; hash certo → **200** e a ordem no disco trocada; POST encadeado
com o hash devolvido → **200**; **reenvio do mesmo corpo (base agora velha) → 409** — que é o
cenário de 21/08 reproduzido e barrado. O campo `hash` não é gravado no arquivo.

Visto em 21/08: a arvore principal tinha um ferramentas/backlog.json SEM tres itens que o HEAD ja tinha (tag-s2, hardening, quarto-portal) e com um titulo revertido. Causa: a mesa aberta havia horas POSTou de volta o retrato que carregou — o POST /backlog do receber.js grava o array inteiro sem conferir contra o que esta no disco. Desta vez o HEAD era a verdade e nada do dono se perdeu (diff conferido linha a linha antes de descartar); da proxima pode ser a ordem NOVA dele que se perde. Conserto: o GET /backlog passa a devolver um hash do arquivo, o POST manda o hash de base, e o servidor RECUSA escrita cuja base nao bate (a mesa entao recarrega e reaplica). Enquanto isso, plantao confere git diff do backlog antes de qualquer descarte.


## 49 — O bloco 30 do `encaixe.js` VOLTOU a piscar: 5 px em 390×568 (21/08, visto pelo dev-plataforma) — dev-jogo

Não é regressão de ninguém desta rodada e a medição diz por quê: `node test/encaixe.js` saiu **1**
uma vez em três execuções do MESMO build — *"FALHA 390×568: o menu não rola com todas as tábuas
dentro (5px, folga de 4)"* —, e o **controle** (minhas mudanças em `git stash`, HEAD limpo) saiu
**0**, assim como a re-execução com elas de volta. Meu diff não toca `src/`: dashboard, mesa,
SQL e testes de fila, nenhum arquivo que o `encaixe.js` lê.

O que isso contradiz: o NOTES de 21/08 registra que o recheio cedeu 2 px, o poste fechou em 359 e
o número voltou à banda **2 · 3 · 1** em três execuções. Hoje ele bateu **5** com folga 4 — a banda
é mais larga do que a medição de ontem sugeria, e o portão continua sendo cara ou coroa em 390×568.
Ele reprova sozinho num CI e faz a próxima pessoa caçar defeito que não existe (já custou isso ao
funil em 21/08, na linha "flake de timing" do placar).

Duas saídas, e a segunda é a que eu faria: **(a)** ceder mais recheio até a banda ficar longe da
folga — conserto de verdade, mas às cegas enquanto ninguém souber o que varia; **(b)** medir
primeiro: rodar o bloco 30 umas 20 vezes no mesmo build imprimindo o número, para saber se é fonte
que carrega tarde, arredondamento de subpixel ou layout que assenta depois do primeiro quadro. Sem
essa distribuição, qualquer conserto é palpite — 2.9.
## 49 — 480×320 deitado: o poste de OITO tábuas rola 95 px (21/08, dev-jogo)

**Não é regressão nova, é a mesma dívida crescendo, e o número está medido dos dois lados.** Com
sete tábuas o menor deitado que ainda se vende (480×320) já rolava **9 px**; com a oitava (o
portão DE ONDE VEM, decisão do dono de 21/08) passou a rolar **95**. A aritmética não tem saída
numa coluna só: 4 portões de 51 + 4 tábuas de 44 + 7 vãos de 3 = **401 px** num aparelho de 320.

O conserto do telefone deitado grande (844×390) foi o **poste de dois lados** — quatro portões à
esquerda do mastro, quatro utilidades à direita, altura 413 → 225 px, e o bloco 21 do
`encaixe.js` voltou ao verde. Ele **não** foi estendido a 480 px de largura de propósito: duas
tábuas de 280 mais o mastro tomariam 586 dos 480, e estreitar a tábua até caber derruba o rótulo
para escala 1 (a régua de escala mede e cede sozinha, mas a 1 a letra deixa de ser legível).

O que **está** garantido lá hoje: nenhuma tábua fica inalcançável. O `justify-content: safe
center` que entrou nesta rodada faz o poste desistir de centrar quando estoura, então a rolagem
resgata tudo — antes disto o JOGAR nascia com o topo em −27 px, cortado e **sem jeito de chegar
nele**, porque rolagem só anda para o fim.

Caminhos, para quem pegar: (a) duas colunas também abaixo de 700 px, com o logo saindo da linha
das tábuas em vez de dividir a largura com elas; (b) o poste de dois lados virar o padrão de todo
deitado e a marca ir para cima das tábuas; (c) aceitar a rolagem em 480×320 e escrevê-la como
decisão, com o número. Nenhuma foi medida.

## 50 — A home CINEMÁTICA corta o poste quando a altura é curta (21/08, dev-jogo)

**Dois tamanhos, o mesmo defeito, e o pior deles é num NOTEBOOK.** O painel da direita
(`min-width: 900px`) empilha logo, frase e as oito tábuas numa faixa de `clamp(360px, 33vw,
460px)`, e não pergunta se a altura dá. Medido depois desta rodada:

| tela | poste | rolagem | o que fica cortado |
|---|---:|---:|---|
| 1366×768 (notebook) | 438 | **73** | ATÉ AQUI 66% visível · CONFIGURAÇÕES **fora** (pé em 831) |
| 926×428 (telefone deitado moderno) | 417 | **205** | FONTES 86% · as quatro de baixo fora |
| 1024×768 (tablet) | 438 | 8 | nada |
| 1366×900 | 444 | 2 | nada |
| 1920×1080 | 559 | 0 | nada |

**Pré-existente e agravado, e os dois lados estão medidos:** com sete tábuas o 1366×768 já
rolava 55 e o 926×428 já rolava 159 — a oitava somou ~20 e ~50. A `test/regua-larga.js` passa
e está certa em passar: ela cobra que CONFIGURAÇÕES seja **alcançável pelo dedo**, e é (o menu
declara `overflow-y: auto` desde 14/08). Alcançável não é visível, e numa home que é a porta
da plataforma a segunda coisa importa tanto quanto a primeira.

**A RESPOSTA JÁ EXISTE NESTE REPOSITÓRIO e é o poste de dois lados** (entrou em 21/08 para o
telefone deitado, `estilo.css`). O que está errado hoje é o **gatilho**: ele é por LARGURA
(700–899 px) quando o que decide é a ALTURA DISPONÍVEL contra a altura do poste. 1366×768 tem
largura de sobra e cai no mesmo caso; 1366×900 não cai. O corte fica por volta de **830 px de
altura** nessa largura — medido, não estimado.

Caminho, para quem pegar: trocar a janela de largura por uma de altura (`max-height` na casa
dos 830) e, na cinemática, deixar a faixa da direita crescer o bastante para duas pistas de
tábua — hoje ela tem 360–460 px, e duas pistas dentro disso dariam ~175 px cada, abaixo do que
o rótulo "DE ONDE VEM" precisa a escala 3 (201 px de canvas + 48 de recheio + 16 de prego). Ou
seja: não é copiar o bloco, é alargar a faixa primeiro. **Não medido.**


## 51 — A tela CONFIGURACOES do jogo nao conta que o interruptor vale para as paginas — dev-jogo — **FEITO em 22/08 (dev-jogo)**

**Como ficou:** duas linhas no papel de CONFIGURAÇÕES, uma por estado, escritas na mesma voz
das outras (nenhuma palavra de programador). Ligada: `DESLIGAR VALE AQUI E NAS PÁGINAS` ·
`DO SITE: O INTERRUPTOR É UM SÓ.` Desligada, o outro lado da mesma verdade, emendado no
`NÃO SAI UM BYTE DAQUI.` que já estava lá: `NEM DAS PÁGINAS DO SITE:` · `O INTERRUPTOR É UM
SÓ.` É o espelho do que o rodapé das páginas já diz ("Desligar desliga de verdade, aqui e no
jogo") — as duas pontas da mesma chave de `localStorage` agora descrevem o mesmo botão.

**Medido pelo caminho da PESSOA** (toque em CONFIGURAÇÕES no menu, que é quem chama
`montarConfig()`; medir por `abrirTela` mediria a tela vazia — lição 2.1), A/B na mesma carga
com as duas linhas removidas do papel: o papel vai de 14 para 16 linhas (7 → 9 desligada) e a
tela **continua cabendo inteira em todas as telas medidas**. A folga que sobra embaixo, com as
linhas novas: 320×568 **21 px** (era 36) · 360×640 **23** (era 37) · 390×844 **95** ·
844×390 **40** · 1366×768 **229**. A largura não mudou: a linha mais larga do papel continua
sendo uma das antigas, **223 px** nas seis telas. `encaixe.js` bloco 8 verde sem uma asserção
tocada (ele casa por regex e as frases que ele cobra continuam palavra por palavra).
O `medir-telas-altura.js` mostra o preço com o controle rodado: `telaConfig` passa de
**rola em 2/23 alturas (+4 a +24 px)** para **3/23 (+14 a +54)** — conteúdo cabe em todas e a
saída se alcança rolando nas duas versões, e o portão sai 0 nas duas.

Desde 22/08 o interruptor de medicao e UM so (mesma chave de localStorage, decisao de uma origem = uma escolha): desligar no rodape de qualquer secao desliga o jogo, e vice-versa. O rodape das paginas ja diz isso; a tela de CONFIGURACOES do jogo ainda diz o interruptor esta aqui sem dizer e vale para as paginas tambem. E uma linha em src/jogo.ts (territorio do dev-jogo). A frase precisa continuar verdadeira dos DOIS lados.


## 52 — O integrar.js trunca o log do encaixe vermelho — plantao/dev-plataforma

Duas noites seguidas (funil da growth 21/08, funil do link-jogo 22/08) o encaixe reprovou 1-2 assercoes na 1a tentativa, passou na 2a, e o log do funil NAO diz QUAL assercao mordeu — ele guarda so o fim da saida, e a falha rola para fora. Sem o nome da assercao, flake nao vira diagnostico. Conserto: o integrar.js salva a saida INTEIRA do encaixe num arquivo ao lado (encaixe-vermelho-<data>.log) quando exit != 0, e imprime o caminho. Uma linha de tee com exit real preservado.


## 53 — Em RETRATO a personagem esta 100% escondida atras do poste — arte/dono — **FEITO em 03/09 (dev-jogo), FALTA SO O VEREDITO DA ARTE**

**Ela entra em QUATRO das sete telas de retrato medidas, e a de REFERENCIA e uma delas.** Medido
em 03/09, com a chave `CHAO_HOME_LIGADO` subida e o caminho-do-ceu do PENDENTES 54 feito
(`node test/regua-larga.js`, exit 0):

| tela | faixa livre | precisa | o que acontece | chao |
|---|---:|---:|---|---|
| 320x568 | 9,0 | 104 | **nao entra** — nada se mexe | 0,6800 |
| 360x640 | 16,0 | 104 | **nao entra** | 0,6800 |
| 390x568 | 9,0 | 104 | **nao entra** | 0,6800 |
| 390x844 | **120,0** (era 83) | 104 | **ENTRA** — era o caso que doia | **0,4384** |
| 412x915 | 156,0 (era 119) | 104 | **ENTRA** | 0,4563 |
| 430x932 | 165,0 (era 128) | 104 | **ENTRA** | 0,4614 |
| 768x1024 | 207,0 | 192 | **ENTRA** (tablet em retrato, achado desta rodada) | 0,5313 |

Nas quatro em que ela entra: **zero px2** de cruzamento com o poste, com as oito tabuas e com a
proposta, e respiro de 8 px acima e abaixo cumprido nas quatro. Nas tres em que nao entra, a
regua cobra que NADA se mexeu (`GROUND == round(H x 0,68)`), e cobra por asserção.

**O que destravou o 390x844 foi COMPOSICAO, nao motor** — que e exatamente onde o PENDENTES 54
dizia estar a alavanca. Faltavam 21 px (83 contra 104) e foram comprados 37, divididos entre as
duas pecas de cima em `src/estilo.css`: **19 px de respiro do topo** (`#telaMenu{padding-top}`) e
**18 px de teto do logo** (`#logoImg{max-height}`), por uma reta continua (`clamp`) que vale ZERO
abaixo de 700 px de altura. A conta e do layout e por isso e barata: o `#poste` tem
`margin-top: auto`, entao todo pixel raspado ACIMA da base da proposta vira pixel de faixa, um
por um. As tres telas curtas e o telefone deitado ficam byte a byte.

**As tres saidas que 22/08 recusou continuam recusadas** — nenhuma delas foi usada. Nao se
encolheu poste, nao se desenhou segunda figura, e `GROUND`/`fitCanvas` continuam com o 0,68 de
sempre em todo lugar que nao seja a home em retrato.

**⚠ O QUE FALTA: o veredito da ARTE sobre a costura vertical (condicao 1 do 54).** Os prints
estao gerados e o item nao fecha sem ele. Ver o 54.

Medido em 22/08 (dev-jogo, increment 2 da home), pelo DOM e nao pelo olho: a caixa dela na home
mede **x 82..122 · y 486..574** em 390x844 e **x 82..122 · y 298..386** em 390x568, e o poste
ocupa **x 43..347 · y 386..844** e **x 43..347 · y 155..568** nas duas. Ou seja: nas duas telas
de retrato ela cai INTEIRA atras das tabuas — nao e "pouco visivel", e zero pixel.

Isso e o que sobrou do ticket home-inc2 depois da entrega: a **presenca da personagem so existe
onde ha cena** (a cinematica >=900 e o telefone deitado). Em retrato ela nao aparece, e a home de
celular e justamente a tela que mais gente ve.

**Por que nao foi consertado nesta rodada:** as tres saidas possiveis mexem em coisa que nao e do
dev-jogo decidir sozinho.

1. **Encolher/subir o poste** para abrir uma faixa de chao — mexe na composicao que o dono
   aprovou em 21-22/08 (oito tabuas, piso de 44 px de dedo, rolagem 0 em oito alturas). A conta
   nao fecha sem tirar tabua: as oito ja somam 413..464 px numa tela de 844.
2. **Desenhar uma SEGUNDA figura** dela no diorama, grande, no plano da frente — duas
   personagens na mesma tela, e o dono pediu em 12/08 *"apenas o personagem andando e o cenario
   em si"*, no singular. Recusado por isso.
3. **Enquadrar a home mais alto** (a linha do chao subir so no menu) — mexe em `GROUND`/`fitCanvas`,
   que sao as constantes medidas do motor (§7 do CLAUDE.md). Nao se toca por composicao de menu.

**A pergunta para a arte:** vale abrir uma faixa de cena no retrato tirando o logo um degrau, ou
o retrato fica sendo a tela da MARCA (logo + proposta + portoes) e a personagem e coisa das telas
largas? As duas leituras sao defensaveis; a segunda e a de hoje, e agora esta medida.

**MECANISMO FEITO E INTEGRADO INERTE em 22/08 (dev-jogo); a arte VETOU liga-lo hoje e o
destravamento virou o PENDENTES 54, priorizado.** A tabela abaixo e o que a regua responde
QUANDO a chave subir — hoje `CHAO_HOME_LIGADO = false` e nada se mexe em tela nenhuma, o que a
`regua-larga.js` cobra por asserção de inércia nas seis telas de retrato. O 53 so fecha com o
54, porque o que ele pede (ela aparecer no retrato) continua nao acontecendo.

**FEITO EM PARTE em 22/08 (dev-jogo), e a regua do dono decidiu sozinha em que telas.** O dono
mandou subir a linha do chao so no menu em retrato, com regua dura: 0% de sobreposicao, respiro
>= 8 px acima e abaixo, e faixa livre >= altura dela + 16 — **e, se nao der, ela NAO entra**.

Medida a faixa livre (topo do poste menos a base da frase de proposta, por `offsetTop`, que nao
enxerga a animacao `brota`) contra os 88 px de altura dela (HERO_TARGET x ESCALA), a regua
responde diferente em cada tela, e a resposta e o entregavel:

| tela | faixa livre | precisa | o que acontece | GROUND |
|---|---:|---:|---|---|
| 320x568 | 9,0 | 104 | **nao entra** — nada se mexe | 193/284 (0,68) |
| 360x640 | 16,0 | 104 | **nao entra** | 218/320 (0,68) |
| 390x568 | 9,0 | 104 | **nao entra** | 193/284 (0,68) |
| 390x844 | 83,0 | 104 | **nao entra** (faltam 21 px) | 287/422 (0,68) |
| 412x915 | 119,0 | 104 | **ENTRA** — chao sobe para 0,4760 | 311 -> **218**/458 |
| 430x932 | 128,0 | 104 | **ENTRA** — chao sobe para 0,4807 | 317 -> **224**/466 |

Nas duas em que ela entra: caixa dela `81..135 x 348..436` (Pixel) e `85..139 x 360..448`
(iPhone Max), respiro **14,4 / 15,9** e **19,3 / 20,0**, e **zero px2** de cruzamento com o
poste, com as oito tabuas e com a proposta. Nas quatro em que nao entra, o portao exige que
NADA tenha se mexido (GROUND continua exatamente `round(H x 0,68)`) e que ela continue inteira
atras do poste — espremer reprova.

**O 390x844 e o caso que doi, e ele esta medido:** faltam **21 px**. A faixa e 83 e a conta pede
104 (88 dela + 8 + 8). Nao ha alavanca dentro do territorio do dev: a altura dela e
`HERO_TARGET x ESCALA` e a escala e do motor; abrir a faixa exigiria mexer no logo ou na frase,
que sao composicao aprovada. Se o dono quiser ela no celular de referencia, a decisao e **abrir
a faixa** (logo um degrau menor, ou a proposta mais colada nele) — e ai a regua passa a caber
sozinha, sem mudar uma linha do que entrou hoje.

**Como ficou por dentro:** `0,68` deixou de ser literal em tres lugares (`fitCanvas`,
`redesenharFundo`, a nevoa do `pintarHomeCena`) e passou a sair de `fracChao()`. `chaoHome` e a
unica coisa que muda, medida por `medirChaoDaHome()` no `fitCanvas` e na troca de tela. Ida e
volta provada: home 218 -> JOGAR 311 -> home 218 -> girado deitado 140 (0,68 de 206) -> girado
de volta 218 -> `fecharTelas` 311, zero erro de console.


## 54 — O CAMINHO-DO-CEU: destravar a subida do chao no retrato — dev-jogo/arte — **FEITO em 03/09; 3 DAS 4 CONDICOES MEDIDAS, A 1a (VEREDITO DA ARTE) ESTA NA MESA**

**O caminho foi feito, e ele fez mais do que se esperava dele: o ceu nao so ficou — ficou MAIS
inteiro do que estava no ar.** A peca de CHAO passou a se repetir espelhada na vertical em
`rolarFundo()`, o mesmo truque que ja elimina a emenda na horizontal, e com isso o termo que
obrigava a pintura a cobrir a faixa de baixo saiu do `Math.max` de `redesenharFundo()`.

### O QUE FOI MEDIDO (`node test/medir-caminho-do-ceu.js`, exit 0, tudo na MESMA execucao)

**A peca de CEU que fica em quadro** — o numero que responde ao veto de 22/08 palavra por
palavra (*"o MAR some, e o mar e o que a home diz sem escrever"*):

| tela | publicado | caminho-do-ceu | o caminho VETADO daria |
|---|---:|---:|---:|
| 390x844 | 70,8% | **71,2%** | 26,0% |
| 412x915 | 70,8% | **76,2%** | 28,0% |
| 430x932 | 70,8% | **75,1%** | 28,6% |

Ou seja: o caminho vetado mostraria **um quarto** do ceu, e este mostra **mais que o publicado**.
O par de prints `test/CEU-ANTES-390x844.png` / `test/CEU-DEPOIS-390x844.png` e a mesma coisa em
imagem — no DEPOIS a baia, os navios e as montanhas estao no alto, o logo tem ceu atras da folha,
e ela esta em cena.

**A pintura ENCOLHE, e isso e ganho de nitidez de brinde:** 0,624 a 0,641x a publicada, o que
derruba a ampliacao de cerca de 1,69x para ~1,08x na home em retrato — o §6 do CLAUDE.md avisa
que a pintura e desenhada AMPLIADA e que isso e o que mais falta nela.

**⚠ O SEGUNDO TERMO CAIU JUNTO, e so o print mostrou.** A primeira versao tirou do `Math.max` so
o termo de cobertura do chao e deixou o `ch/ih`. Os numeros pareciam bons (pintura 0,781x) e o
print reprovou: com `ch/ih` a tela passava a cortar a pintura em **31,2%** da altura em vez de
21,9%, e o que mora nesses 9 pontos e justamente o ceu e o mar — a home virava parede de copas,
que e a objecao da arte chegando pelo outro lado. Fica registrado porque a licao e geral: **numero
de geometria nao substitui o print quando o que se julga e enquadramento.**

### INERCIA — o jogo nao se mexeu um pixel

Com a fracao de sempre (jogo, deitado, desktop, telas curtas), `dw`/`dh`/`dy` batem com a conta
ANTIGA com erro de **0,000 px** nas oito telas medidas, e o laco de repeticao roda **zero**
voltas. O termo so sai do `Math.max` quando `gd < CHAO_FRAC`, que e a home em retrato e mais nada.

### AS QUATRO CONDICOES DA ARTE — onde cada uma esta

1. **COSTURA VERTICAL JULGADA POR PRINT** — ⏳ **NA MESA DA ARTE, e o item nao fecha sem isto.**
   `node test/prints-costura.js` gera, para os treze capitulos, a home inteira em 390x844 e uma
   TIRA da camada `#fundoHD` nua, recortada na faixa das costuras, em px de dispositivo 1:1, com
   marcas de 1 px nas bordas apontando a altura exata de cada uma. Duas ficam versionadas por
   cobrirem os extremos de textura: `test/COSTURA-tira-00-PINDORAMA.png` (mata — a costura some na
   terra) e `test/COSTURA-tira-03-SALVADOR.png` (calcamento de pedra — e onde mais aparece, porque
   la `frenteBloco() < 0` e nao ha mato na emenda para escondê-la). Em 390x844 as duas costuras
   caem em y=543 e y=716 (CSS), ou seja **atras do poste**, com ~43 px de cada lado a mostra.
   O precedente JABAQUARA e o motivo de a arte olhar: simetria em textura organica fabrica rosto.
2. **A REFERENCIA 390x844 GANHOU A HEROINA** — ✅ faixa **83 -> 120 px** contra os 104 que a regua
   pede, e ela ENTRA. O item nao desceu de prioridade: nao destravou so Pixel e iPhone Max.
3. **A REGUA INTEIRA** — ✅ `node test/regua-larga.js` exit **0** nas doze telas. Zero px2 de
   sobreposicao com poste, tabuas e proposta; respiro >= 8 px dos dois lados; piso de 44 px das
   tabuas intocado (medido 44 no nivel 2 e 51-53 nos portoes, nas seis de retrato).
4. **FPS EM A/B NA MESMA CARGA, ORDEM ALTERNADA** — ✅ e com um TERCEIRO lado que a condicao nao
   pedia e sem o qual o numero nao valeria: `A'` e a mesma condicao de `A`, medida noutro momento,
   e o delta A'-A e o RUIDO da maquina. Ordem `A B A' | A' B A`, 24 amostras por tela, `worldX`
   empurrado entre rodadas para o quadro do sprite (e o braco) mudar a cada amostra.

   | tela | A | B | CUSTO B-A | RUIDO A'-A |
   |---|---:|---:|---:|---:|
   | 412x915 | 23,3 | 23,8 | **+0,6 FPS (+2,4%)** | +1,6 FPS (+6,7%) |
   | 390x844 | 25,5 | 26,3 | **+0,8 FPS (+3,2%)** | +0,5 FPS (+1,8%) |
   | 390x568 (0 copias) | 39,5 | 41,3 | +1,8 FPS (+4,6%) | +1,0 FPS (+2,4%) |

   **O custo esta dentro do ruido nas tres, e o sinal ate saiu positivo** — o que faz sentido: a
   pintura encolheu 36%, entao o passe desenha MENOS pixel por copia. Para nao depender de um FPS
   headless sem GPU, o mesmo instrumento cronometra o passe direto (400 chamadas de `rolarFundo()`
   por lado, ordem alternada): **+0,010 ms/quadro em 412x915 e +0,007 em 390x844**, que a 60 Hz
   sao **0,06% e 0,04%** do orcamento de um quadro. Em 390x568, onde a linha nao sobe e o laco de
   repeticao roda zero voltas, o custo mede **-0,005 ms** — ruido, e o controle negativo certo.
   (Precedente que a condicao cita: o vento custou 9 FPS e foi cortado por medicao em 22/08.)

### UM ACHADO QUE NAO ESTAVA NO ITEM: o TABLET EM RETRATO nao tinha regua nenhuma

`tablet retrato` (768x1024) mora na lista das telas LARGAS da `regua-larga.js` **e e retrato**,
entao `medirChaoDaHome()` sobe a linha la — e a unica assercao que o alcancava era `chaoIntacto`,
a que diz que ela NAO pode subir. Com a chave ligada, a regua reprovou nele, corretamente e por
motivo errado. Afrouxar aquela assercao seria o conserto errado (e ela que impede um erro na
guarda de orientacao de reenquadrar o notebook em silencio). O conserto foi dar ao tablet em
retrato a MESMA regua dos dois lados, extraindo `lerChao()`/`conferirChao()` para os dois lacos
compartilharem. Medido antes de escrever a assercao, nas tres resolucoes de tablet em retrato que
existem de verdade: 768x1024 faixa 207/192 respiro 15/16 · 810x1080 faixa 245/192 respiro 33/36 ·
600x960 faixa 175/148 respiro 21/22 — **cruzamento 0 px2 nas tres**. O iPad Pro em retrato
(1024x1366) cai na home CINEMATICA por largura e a linha NAO sobe la (`chaoHome = 0`, medido).

### OS CONTROLES DO AUTOTESTE FORAM REFEITOS (licao 2.8)

Os antigos (`ligar`, `ligar-real`) passaram a injetar o estado de PRODUCAO quando a chave subiu —
controle que injeta producao e decoracao. Os tres novos, com exit code real desta rodada:

- `REGUA_CHAO=espremer` (chao a 0,60 com a chave ligada) — **exit 1, reprova 12 de 12**.
- `REGUA_CHAO=nao-subir` (chave ligada, `chaoHome` zerado a mao) — **exit 1, reprova 4**: as
  quatro telas de retrato em que a faixa da. E o controle do lado que este item existe para
  garantir.
- `REGUA_CHAO=desligar` (chave baixada e medida refeita) — **exit 0**, aprovado pelo ramo de
  INERCIA. E o controle POSITIVO do estado publicado entre 22/08 e 02/09, e o que prova que
  aquele ramo continua vivo em vez de ter morrido junto com o veto.
- E as receitas de `REGUA_DEFEITO` continuam mordendo: a da hierarquia sai **exit 1 em 12 de 12**.

**A chave subiu:** `CHAO_HOME_LIGADO = false -> true` em `src/jogo.ts`. Tudo o mais (a medida, a
regua, os portoes, os controles) ja estava no lugar, como o 54 previa.

---

*(O texto abaixo e o do item como ele foi escrito em 22/08, mantido inteiro porque e o material
da decisao e porque a condicao 1 dele ainda nao foi respondida.)*

## 54 (o item original, 22/08) — destravar a subida do chao no retrato — dev-jogo/arte

**Medido em 22/08, na mesma rodada que fez o 53, com print antes/depois em
`test/CHAO-ANTES-412x915.png` e `test/CHAO-DEPOIS-412x915.png`.** Nao e efeito colateral de
implementacao: e geometria, e ela nao tem saida barata.

> **CUIDADO AO LER OS PRINTS:** o `CHAO-DEPOIS-412x915.png` e o que a subida FARIA, tirado com a
> chave ligada. **Nao e o estado publicado** — com `CHAO_HOME_LIGADO = false` o que esta no ar
> em 412x915 e o `CHAO-ANTES`. Os dois ficam versionados porque sao o material da decisao deste
> item; o par 390x844 e outra coisa: la o ANTES e o DEPOIS sao a mesma composicao, e ele esta
> ali para provar que a tela de referencia nao se mexeu.

A pintura tem **75% de ceu+mata e 25% de chao** (a emenda das duas pecas, `FUNDO_GROUND_SRC`).
Para a linha do chao subir de 0,68 para 0,476 da tela, a faixa de chao ABAIXO dela cresce de
0,32 para 0,524 da tela — e como so existe 25% de chao na fonte, a unica forma de cobrir e
AMPLIAR a pintura inteira. Medido em 412x915 dpr2: `dh` de **2.345 -> 3.840 px** de dispositivo
(**1,64x**), e o que sai de quadro e justamente o alto: **o ceu, o mar e as montanhas somem**, e
a home passa a ser uma parede de mata. Nas telas onde a regua nao deixa subir (390x844 e as
menores) nada disso acontece — o print de la e a mesma composicao, com numeros identicos antes
e depois (GROUND 287/422, dh 2161, dw 1216, dy -473, tudo em dpr2). Os quatro prints
versionados sao em **dsf1** de proposito — 480 a 534 KB cada em vez de 1,4 a 1,6 MB, e o que a
arte precisa julgar aqui e composicao, nao fidelidade de pixel; os numeros estao no texto.

Ou seja: **a home teria duas composicoes diferentes conforme a altura do celular.**

### O PARECER DA ARTE (22/08, veredito b) — mecanismo APROVADO, subida VETADA

**Aprovado:** o mecanismo inteiro. Palavras dela: *a regua dizendo NAO em 4 de 6 telas e prova,
nao defeito* — um enquadramento que se recusa a entrar quando nao cabe e exatamente o que se
queria construir.

**Vetado:** liga-lo hoje. Tres razoes, e a terceira e a que fecha:

1. **O logo perde o recorte da folha contra o CEU.** A costela-de-adao do logo e lida porque
   tem ceu atras dela; com a mata ampliada 1,64x, vira folha sobre folha.
2. **O MAR some**, e o mar e o que a home diz sem escrever — *travessia*. Perder o mar e perder
   a unica palavra que a imagem da porta de entrada diz sozinha.
3. **Duas homes por altura de aparelho, na PORTA DE ENTRADA da plataforma** = "nao parecem do
   mesmo jogo". Esse argumento vale mais que a presenca dela numa tela.

**Como ficou integrado:** INERTE. `CHAO_HOME_LIGADO = false` em `src/jogo.ts`, chave DEDICADA
(a arte foi explicita: **nao** reaproveitar `CHAO_FRAC_MIN` como interruptor — trava de sanidade
nao vira chave, e o proximo a ler 0,34 nao entenderia o numero). A `test/regua-larga.js` cobra
INERCIA com a chave desligada: `GROUND == round(H x 0,68)` e `chaoHome == 0` nas SEIS telas de
retrato. A regua dos dois lados continua inteira e volta a valer no instante em que a chave
subir — provado pelo controle positivo `REGUA_CHAO=ligar-real`, que passa com as duas telas
entrando dentro da regua.

### AS QUATRO CONDICOES DA ARTE PARA LIGAR A CHAVE

Elas sao de aceite, nao de intencao — quem pegar este item entrega as quatro ou nao liga nada.

1. **A COSTURA VERTICAL SE JULGA POR PRINT, e o precedente tem nome: JABAQUARA.** Repetir a peca
   de chao espelhada na vertical cria uma linha de simetria, e simetria em textura organica
   FABRICA ROSTO — foi exatamente o que a auditoria de coerencia de 21/08 achou em JABAQUARA
   ("raiz detalhada forma rosto simetrico na costura"), num espelho que tambem era
   nao-intencional. A costura nova nasce sob suspeita: print de cada capitulo com a home aberta,
   olhado pela arte, antes de qualquer verde de portao.
2. **A REFERENCIA 390x844 TEM QUE GANHAR A HEROINA — senao a prioridade cai.** Com o ceu
   preservado o argumento (3) do veto morre, mas o (3) so morre de verdade se a home for A
   MESMA em todo retrato. Hoje faltam **21 px** de faixa em 390x844 (83 contra 104), e a
   alavanca esta na composicao (logo um degrau menor, ou a proposta mais colada nele), nao no
   motor. Se a entrega chegar destravando so Pixel e iPhone Max, ela reintroduz as duas homes e
   **este item desce de prioridade em vez de fechar**.
3. **A REGUA DE HOJE CONTINUA VALENDO INTEIRA:** 0% de sobreposicao com poste, tabuas e
   proposta · respiro >= 8 px acima e abaixo · piso de 44 px das tabuas intocado. Nada disso se
   renegocia em nome do ceu.
4. **FPS MEDIDO EM A/B NA MESMA CARGA, e o precedente tambem tem numero: o vento custou 9 FPS**
   e foi cortado por medicao em 22/08, antes de a arte precisar veta-lo. Uma peca de chao
   desenhada duas vezes por quadro e trabalho novo no laco; o A/B com ordem ALTERNADA (ordem
   fixa inventou 10% de custo naquela mesma rodada) vem escrito antes, nao depois.

**O caminho que preserva o ceu, ja pensado e NAO feito (nao medido):** repetir a peca de CHAO
verticalmente, espelhada, em `rolarFundo()` — e o mesmo truque de espelho que ja elimina a
emenda na horizontal. Com o chao podendo se repetir, a restricao "a faixa de baixo tem de ser
coberta pela pintura" cai, o `scale` volta a ser governado por `ch/ih` e a pintura ficaria
**menor** que hoje (mais ceu, nao menos). O preco: mexer em `rolarFundo`, no passe de
quantizacao (`construirGrao`) e na linha da emenda que tres instrumentos leem
(`test/medir-conversa.js`, `desenharFrente`). Estimativa honesta: uma sessao, com risco de
costura visivel. **Nao foi feito porque o despacho pedia a regua, nao a reescrita do fundo** —
e agora ele e o item, com as quatro condicoes acima como criterio de aceite.

**O dia em que fechar, muda UMA LINHA no jogo:** `CHAO_HOME_LIGADO = false` -> `true`. Todo o
resto (a medida, a regua, os portoes, os controles) ja esta no lugar e ja foi visto funcionando
com a chave ligada a mao.


## 55 — A caixa alfa do #heroHD NAO e a caixa dela — dev-jogo — **FECHADO na medicao de 22/08**

Fica registrado porque um instrumento futuro vai cair nisto de novo. Medir a personagem pela
mancha de pixels nao-transparentes do `#heroHD` da **102 px de altura onde ela tem 88**, e
**511 px de largura em tela deitada** — porque `desenharFrente()` (o plano da frente da mata) e
`desenharVento()` desenham na MESMA camada, depois dela. A caixa que vale e a analitica, a do
`desenharHeroiHD`: `HX*kx - dw/2` por `GROUND*ky - dh`. O `prints-home.js` usava uma
aproximacao pior ainda (largura fixa de 40 px, x-20, errando 13 px) e foi corrigido.


## 56 — ~~O CLAUDE.md §3 ainda diz DEZ eventos, e agora sao ONZE~~ — FEITO em 27/08 (dono autorizou no encerramento; §3.2 agora diz "Onze" e lista o evento `saiu para a plataforma`)

O evento `saiu` entrou em 22/08 por decisao do dono e o portao do `encaixe.js` bloco 17b ja o
cobra (11 na fonte, 11 disparados, lista branca por evento com `saiu: []`). O que **nao** foi
alterado e o `CLAUDE.md`, porque editar o documento de instrucoes permanentes nao e coisa de
agente — vai ao dono/plantao. **O patch, pronto para colar** no paragrafo "A contagem, e os
limites dela" do §3.2:

- trocar `Dez eventos anonimos` por `Onze eventos anonimos`;
- e emendar, depois de `atras de um botao que nada apontava.`:

> · **saiu para a plataforma** (SEM propriedade nenhuma), o clique na nota de margem da CHEGADA
> — acrescentado em 22/08 por decisao do dono, e pela mesma razao do anterior: essa linha e a
> UNICA costura entre o chamariz e as secoes, e sem evento "o jogo traz gente para a
> plataforma" continua sendo intencao escrita aqui em vez de numero. O `keepalive` do `medir()`
> deixa de ser detalhe e vira requisito — e o unico evento que nasce de uma NAVEGACAO.

Vale registrar junto o achado que fez a conta fechar: a lista do §3.2 dizia DEZ desde 19/08 e o
portao cobrava NOVE, porque a varredura da fonte casava `medir\("([a-z]+)"` **sem sublinhado** e
`glossario_do_capitulo` nunca entrava. Corrigido no codigo do portao; o documento e que ficou.



## 57 — Auto-login LOCAL da mesa/dashboard por arquivo fora do git — dev-plataforma — **FEITO em 22/08 (noite)**

**Como ficou.** `ferramentas/pin-local.js` (novo) guarda a rota e a regra; `servir.js` e
`receber.js` a montam antes de qualquer outro caminho; o dashboard, em localhost e sem sessao,
pede `/pin-local` UMA vez e entra pela MESMA funcao do login normal (`pedirToken`). Sem arquivo,
sem rota: o toast honesto continua — e agora ele NOMEIA o arquivo que resolve, em vez de
prometer uma obra que ja existe.

**O que o dono faz, uma vez:** cria **`~/.mesa-brasil-pin`** (no homedir — em `C:\Users\<voce>` no
Windows, `$HOME` no resto) com o PIN numa linha. Nada mais. Se nao criar, nada muda. **O plantao
nunca le esse arquivo** — esta escrito no cabecalho do `pin-local.js` e no teste, que escreve um
arquivo proprio com um PIN inventado.

**A AUDITORIA DA SEGURANCA REPROVOU a 1a versao e mudou 2 coisas de desenho** (22/08 noite): o PIN
saia do loopback por duas portas. **(S1)** o arquivo estava em `ferramentas/`, e `npm start` serve
a RAIZ do repo -> `GET /ferramentas/mesa-pin.local` era servido VERBATIM pelo docroot (200
medido). Conserto: o arquivo **saiu do repo** para o homedir — por isso o caminho mudou. **(S2)**
a rota nao conferia o `Host` -> DNS rebinding (`evil.com` -> 127.0.0.1) devolvia o PIN. Conserto:
`hostLocal()` recusa todo Host que nao seja local. Mais **(S3)** padroes largos no `.gitignore`
(`ferramentas/*.local*`, `mesa-pin*`) como defesa em profundidade, e **(S4)** o dashboard nao
repete um PIN ja recusado na mesma sessao (senao um PIN velho queima a cota do rate limit a cada
carga). Provado ao vivo: docroot -> **404**, loopback -> **200**, `Host: evil.com` -> **404**.

**Medido:** `fila-auth.js` 19 -> **24 cenas** e 129 -> **212 verificacoes**; `fila-auth-controle.js`
13 -> **21 defeitos**, todos vistos mordendo. A cena 21 e uma ARMADILHA (serve `/pin-local` no
host da WEB e cobra que a pagina nao o peca); a 23 mede a rota do servidor sem navegador (loopback,
Host, homedir). O bind e `127.0.0.1` nos dois servidores — conexao pelo IP de rede da maquina nao
completa (curl `000`), medido.

**O que fica aberto e NAO e deste item:** os 4 cliques do dono no painel do Supabase (cadastro
OFF, **Secure password change ON**, leaked passwords ON, minimo 8). O terceiro deles e o que
limita o dano de quem tiver o PIN — sem ele, quem entra troca o PIN e o e-mail da conta.

---

Registro original, para quem for ler o porque:

Decisao do dono (22/08): localhost interage SEM entrar, sempre. Hoje vale porque a fila esta aberta; depois do RLS, quem valida e o banco (que nao enxerga localhost). Desenho: um arquivo local gitignored (ex.: ferramentas/mesa-pin.local, criado PELO DONO uma unica vez) com o PIN; servido apenas em loopback pelo receber.js/servir.js; a pagina em localhost le e faz o grant_type=password sozinha, invisivel. O plantao NUNCA ve o PIN final. Entra no mesmo pacote do fechamento da fila, depois da auditoria da seguranca no ramo do PIN.


## 58 — Flake 2 do encaixe NOMEADO: o nicho apontado esta no topo no ponto dele (null) — dev-jogo

Segunda familia de corrida no encaixe (a 1a era o reload, morta em 22/08). Mordeu o funil do B3 em 22/08: bloco 3, a assercao "o nicho apontado esta no topo no ponto dele" devolveu null — o elemento do nicho ainda nao estava montado/apontado no instante da leitura (nasce com o 1o item + seta). 395 ok no mesmo run; verde na 2a tentativa. Conserto: esperar o elemento de verdade (o padrao abrirMenuParado/esperar() que os instrumentos novos ja usam) em vez de ler no relogio. O log inteiro fica em test/portao-vermelho-encaixe.log quando morder de novo.

---

## 59 — FEITO 23/08 — O LOCK ENTRE MÁQUINAS SOMIA EM SILÊNCIO QUANDO HAVIA SYMLINK NO CAMINHO — plantao/dev-plataforma (achado pelo mac-jogo em 23/08)

**A liderança deste conserto é de quem escreveu a trava** (a sessão do Windows, PR #5). Isto
aqui é achado + diagnóstico + remendo proposto e já provado, para ele decidir a forma. O Mac
não tocou `.claude/hooks/` — o remendo abaixo foi validado numa cópia.

**O SINTOMA:** `node test/guarda-lock.js` dá **exit real 1** no Mac. Cenas 1 a 6 passam (a
lógica do `lock-maquina.js` está certa); **a cena 7 falha nas três verificações** — "o guarda
de verdade recusa com EXIT 2" devolve **exit 0 com stderr vazio**.

**A CAUSA, isolada e medida.** O guarda compara duas pontas que se resolvem de formas
diferentes:

```js
const RAIZ = path.resolve(__dirname, '..', '..');            // o Node JÁ resolveu o symlink
const rel  = path.relative(RAIZ, path.resolve(alvo)) ...     // o alvo vem CRU da ferramenta
```

O `__dirname` do Node é resolvido por symlink; o `file_path` que chega da ferramenta, não.
Sempre que houver symlink no caminho, as duas discordam, o `path.relative` devolve
`../../../..`, **nada casa território, e o guarda passa sem escrever uma linha**. No macOS isso
não é caso raro: `os.tmpdir()` devolve `/var/folders/...`, que é symlink de
`/private/var/folders/...` — e é exatamente onde o teste monta o palco.

Provado nas duas formas, mesmo palco, mesmo item:

| alvo passado ao guarda | exit | stderr |
|---|---|---|
| `/var/folders/.../src/jogo.ts` | **0** | vazio |
| `/private/var/folders/.../src/jogo.ts` | **2** | a recusa correta, com o nome da máquina |

**O QUE ISSO CUSTA DE VERDADE.** Dois efeitos, e o segundo é o grave:

1. O teste fica **vermelho em qualquer Mac** — ninguém deste lado distingue verde de vermelho
   no `guarda-lock.js`, que é justamente o instrumento da trava.
2. Um clone sob caminho com symlink **perde a trava inteira sem avisar**. "Degradar em
   silêncio" foi escrito para **dado ruim** (sem `.claude/maquina`, JSON quebrado, carimbo
   ilegível) — não para formato de caminho. Aqui o silêncio esconde uma trava que sumiu.

**O QUE NÃO ESTÁ QUEBRADO, e também foi medido:** em `/Users/matf/brasil` não há symlink no
caminho, então a trava **funciona de verdade nesta máquina** — palco fora do `/var`, item em
curso na `windows-plantao`, escrita em `src/jogo.ts` recusada com exit 2 e a mensagem certa.

**O REMENDO PROPOSTO** — resolver as duas pontas, tolerando arquivo que ainda não existe (que
o guarda já trata como seguro):

```js
function real(p) {
  const abs = path.resolve(p);
  try { return fs.realpathSync(abs); } catch {}
  // arquivo que ainda não existe: resolve a PASTA, que quase sempre existe, e recola o nome
  try { return path.join(fs.realpathSync(path.dirname(abs)), path.basename(abs)); } catch {}
  return abs;                                   // nem a pasta existe: melhor cru que errado
}
const RAIZ = real(path.resolve(__dirname, '..', '..'));
const rel  = path.relative(RAIZ, real(alvo)).split(path.sep).join('/');
```

Rodado lado a lado no mesmo palco `/var/folders/...`: **guarda de hoje VERMELHO (3 falhas) ·
guarda remendado VERDE (4 de 4)**, e o "fora de território passa com exit 0" continua passando
nos dois — o remendo não fecha nada que estava aberto.

**A SUGESTÃO QUE VAI ALÉM DO REMENDO, e é a que interessa:** consertar o `real()` deixa o teste
verde, mas não impede a próxima trava de sumir do mesmo jeito. O que impediria é o guarda
**dizer alto** quando o alvo cai fora da RAIZ — hoje ele trata "fora da raiz" e "dentro da raiz
e liberado" como a mesma coisa, exit 0 calado. Uma linha em stderr no caso "fora da raiz"
(sem recusar) transforma esta classe inteira de defeito em algo visível na primeira vez, em
vez de invisível para sempre. Fica como proposta, não como pedido: a chamada é de quem lidera.

**FICA TAMBÉM REGISTRADO, e é de outra natureza:** os dois itens `em-curso` do backlog
(`auto-login-local`, `territorio-rico`) estão com `maquina: null` e `desde: null`. Sem esses
campos o `quemTrava` devolve `null` por construção — ou seja, **a trava está de pé mas ainda
não sustenta nada na prática**. São itens e territórios do Windows, que o Mac não ia tocar de
qualquer forma; o registro é só para o mecanismo não parecer engatado antes de estar.


## 60 — O rodape do dashboard e FALSO em tres pontos — dev-plataforma — **FEITO em 23/08 (dev-plataforma)**

Achado do juridico em 23/08, verificado no codigo linha a linha. O rodape (dashboard/index.html:453) diz que no aparelho ficam a sessao e um contador de erros ate voce sair. Errado tres vezes: (1) sair() so apaga a sessao — o contador mesa-brasil-pin-erros so morre em login OK (linhas 890/983), entao o ate-voce-sair e falso para ele; (2) a fila local mesa-brasil-fila4 guarda ate 50 itens / 200 KB do texto que o dono escreveu, sobrevive ao logout e NAO e citada — e a maior das tres; (3) mesa-brasil-pin-local-recusado guarda um PIN em claro no sessionStorage. Conserto: o texto pronto esta no parecer do juridico (23/08), OU fazer sair() chamar zerarTentativas() e ai o texto encolhe — a fila continua precisando ser dita de todo jeito, porque apaga-la ao sair perderia trabalho do dono. Regra da casa (par.3): afirmacao falsa e pior que nenhuma.

---

## 62 — O `index.html` NASCE SUJO NO MAC A CADA BUILD: `newLine: crlf` no tsconfig — plantao/dev-plataforma (medido pelo mac-jogo em 23/08)

> **Era 60 e virou 62 em 23/08.** As duas sessoes numeraram um item ao mesmo tempo, cada uma
> no fim do proprio arquivo, e o `merge=union` juntou os dois sem conflito — que e exatamente o
> que ele foi feito para fazer. Colisao de numero e o preco de duas maquinas escrevendo no mesmo
> diario; renumerei o mais novo. Quem procurar por "PENDENTES 60" nos commits do mac-jogo, e isto.

**Território compartilhado (`tsconfig.json` + `.gitattributes`), então proponho em vez de
aplicar** — e há uma metade que eu **não consigo verificar daqui**, escrita no fim.

**O SINTOMA:** todo `npm test` ou `npm run build` no Mac deixa o `index.html` modificado com
um diff de **9.863 linhas** num arquivo de 2,5 MB. **O diff é 100% fim-de-linha:**
`git diff --ignore-cr-at-eol index.html` devolve **vazio**. Nenhum byte de texto mudou.

**O CUSTO, que é maior do que parece:** árvore suja deixa de ser sinal. Só nesta sessão
descartei **três stashes** que eram exclusivamente esse ruído — e qualquer um deles poderia ter
escondido trabalho de verdade no meio. Uma máquina que aprende a ignorar `git status` perde o
instrumento mais barato que existe para "eu mexi em algo sem querer?".

**A CAUSA, rastreada até o byte:**

| medida | valor |
|---|---|
| `src/index.html`, `src/estilo.css`, `src/jogo.ts` | **0 CR** — os fontes são LF puro |
| `core.autocrlf` no Mac | não definido |
| `index.html` no git | **0 CR** |
| `index.html` no disco após o build | **9.863 CR** |
| onde o primeiro CR aparece | logo após `"use strict";` — o começo exato da saída do `tsc` |

[`tsconfig.json:31`](tsconfig.json#L31) diz `"newLine": "crlf"`. **No Windows isso não aparece**
porque o `core.autocrlf=true` de lá normaliza nos dois sentidos e fecha o círculo: build escreve
CRLF, git grava LF, checkout devolve CRLF, status limpo. **Só o Mac paga**, porque sem
`autocrlf` o disco fica CRLF e o blob LF, para sempre.

**A PROCEDÊNCIA, e é por isso que vale perguntar:** a linha entrou em `ea04bc1` (07/08), um
commit sobre *a sala de máquinas mudar para dentro da mesa* — assunto totalmente diferente, sem
comentário e sem uma palavra na mensagem. Num repositório que escreve cada armadilha ao lado do
código que a pagou, uma linha muda tem chance alta de ser o padrão local de uma máquina virando
ajuste global, e não decisão. **Se foi decisão, ignore este item e escreva o porquê** — que é o
que estava faltando.

**O CONSERTO, e ele tem DUAS peças. Uma sozinha não serve:**

1. `tsconfig.json`: `"newLine": "lf"` — o build passa a emitir LF em qualquer plataforma.
2. `.gitattributes`: `index.html text eol=lf` — o checkout dá LF **mesmo no Windows com
   `autocrlf=true`**, que hoje reverteria a peça 1.

**Medido aqui, uma peça de cada vez:**

| tentativa | resultado |
|---|---|
| só `.gitattributes` com `index.html text eol=lf` | **não resolve** — declara a intenção, o arquivo continua modificado |
| `tsconfig` com `"newLine": "lf"` | **`index.html` limpo · 0 CR no disco · `node test/smoke.js` exit real 0** |

**O QUE EU NÃO CONSIGO VERIFICAR, e é a razão de isto ser proposta e não PR:** a metade
Windows. Aplicar só a peça 1 limpa o Mac e **suja a sua árvore** — o mesmo problema de mão
trocada. A peça 2 é o que deveria impedir isso, mas quem confirma é você, rodando um build aí e
olhando o `git status`. Se depois das duas peças a sua árvore ficar suja, o caminho é o inverso
(`eol=crlf` no `.gitattributes` e o tsconfig como está), e aí quem paga volta a ser o Mac —
nesse caso prefiro pagar eu e deixar registrado por quê.

**Fica de fora de propósito:** os prints `test/*.png` que o smoke regenera a cada rodada também
sujam a árvore, mas ali o byte muda de verdade (é imagem nova). É outro assunto, e não é este.
## 61 — O `qa` e o `historiador` nao existem para esta sessao — o registro de agentes congela no inicio

Achado em 23/08 ao tentar despachar o QA para refutar o crash do `medir-emenda`. O erro:
`Agent type 'qa' not found`, e a lista devolvida traz 10 dos 12 arquivos de `.claude/agents/`
— faltam exatamente `qa` e `historiador`. Os dois arquivos estao no disco, versionados, com
git status limpo desde 21/08.

O que foi descartado por medicao, e cada um custou uma hipotese:
- **nao e o frontmatter**: os dois tem 6 linhas, 2 separadores, zero caractere de controle,
  zero NBSP, e a mesma forma dos que carregam;
- **nao e `model: opus` nem `isolation: worktree`**: `dev-dados`, `dev-jogo` e `dev-plataforma`
  declaram os dois campos identicos e carregam;
- **nao e a linha `tools:`**: a do `qa` e byte a byte igual a do `arte`, que carrega;
- **nao e colisao com agente global ou plugin**: `~/.claude/agents/` nao existe e nao ha plugins;
- **nao e filtro de configuracao**: o `.claude/settings.json` so registra o hook do guarda.

O QUE PROVOU A CAUSA: criei `.claude/agents/teste-registro.md`, minimo e em ASCII puro, e
tentei despachar. Deu `not found` tambem. **O registro nao le arquivo novo** — ele e uma
fotografia tirada no inicio da sessao. Entao a causa nao esta no conteudo dos dois arquivos
hoje; esta em que a fotografia desta sessao saiu sem eles.

POR QUE IMPORTA MAIS QUE PARECE: o `qa` e o refutador independente, e o CLAUDE.md par. 5.2 o
poe como portao OBRIGATORIO antes de integrar. O `historiador` e quem escreve e corta texto
sobre gente real. Perder os dois em silencio significa que uma sessao inteira pode integrar
sem refutacao e sem revisao historica **achando que a maquina esta completa**.

CONSERTO: reiniciar a sessao refaz a fotografia (nao testavel de dentro dela). Contorno usado
hoje: despachar `general-purpose` com o corpo do `qa.md` colado como briefing — mesma funcao,
sem o portao de ferramentas que o arquivo declara.

O QUE FALTA, e e o que evita a repeticao: uma conferencia de arranque que compare a lista de
agentes viva com o que ha em `.claude/agents/` e GRITE na diferenca. Hoje o sintoma so aparece
quando alguem tenta despachar o agente que sumiu — e quem nao tentar, nao descobre.

## 63 — O `abrir.js` afirma por escrito uma garantia FALSA: portas colidem entre copias — plantao/dev

Achado pelo QA em 23/08, medido duas vezes por dois agentes diferentes. O cabecalho do
`test/abrir.js` diz que "duas copias diferentes nunca pedem a mesma porta". Nao e verdade e nao
tem como ser: sao **254 vagas** e o problema do aniversario. Medido sobre as raizes vivas do
disco: **69 raizes, 59 portas distintas, 10 pares colidindo**.

O modo de falha que o arquivo foi escrito para matar — medir o `index.html` de OUTRA arvore,
sem erro, com print bonito — esta vivo de novo para 20 das 69 copias. Isto e grave porque e
silencioso: o teste passa, o numero sai, e ele descreve o jogo de outra pasta.

CONSERTO PROPOSTO pelo QA, e ele fecha a categoria inteira em vez do caso: um `GET /__raiz` que
devolve o caminho servido, e o cliente confere que e a arvore dele antes de medir qualquer
coisa. E o mesmo remedio que tirou o smoke do `file://` — parar de confiar em suposicao sobre
o ambiente e PERGUNTAR.

Hoje o `abrir.js` tambem engole `EADDRINUSE` sem checar quem respondeu.

SEGUNDA METADE, ja feita em 23/08: o combustivel era o acumulo de worktrees. Estavam **64
registrados e 68 copias no disco**; removi 55 worktrees e 68 ramos ja integrados, e sobraram 9.
Ninguem media nem limpava isso — a limpeza precisa virar rotina, senao volta sozinha.

## 64 — A coluna de heap do `martelo.js` mede o balde do navegador, nao o jogo — qa/dev

Achado pelo QA em 23/08 auditando o instrumento que outro QA tinha acabado de escrever.

`performance.memory` no Chromium do Playwright **sem** `--enable-precise-memory-info` devolve
constante quantizada: `usedJSHeapSize = 10.000.000`, congelado. Medido: 12 leituras seguidas
dao **1 valor distinto em 12**; reter **80 MB comprovadamente vivos** move o campo **0,00 MB**;
com a bandeira, os mesmos 80 MB movem 38,62 MB.

A prova que fecha: injetaram um vazamento de ~2 MB por batida DENTRO do proprio martelo, 36
batidas em 12 s, e ele imprimiu `DELTA HEAP 0.0 MB` e saiu **0**. Ou seja, o "delta 0,0 MB em
38 s" nao era medida — era o **unico valor que aquela configuracao podia produzir**, para
vazamento de qualquer tamanho.

O QUE CONTINUA VALENDO da rodada que usou esse numero: a refutacao de que martelar mata a aba
se sustenta, porque ela vem de `page.on('crash')` e da ausencia de excecao, que sao sinais
verdadeiros. So a linha de memoria cai.

CONSERTO: uma linha, `args: ['--enable-precise-memory-info']` — ou tirar a coluna. Enquanto nao
for feito, **nao cite heap desse instrumento como prova de nada**, e o guarda
`performance.memory ? ... : 0` precisa parar de imprimir `0.0 MB` quando a API nao existe: nao
distinguir "medi zero" de "nao consegui medir" e como o numero enganou.

Dois defeitos vizinhos, medidos na mesma auditoria: o martelo **nao sai 1 com erro de pagina**
(5 excecoes injetadas, exit 0) e **nao afere que martelou** (landou 2 toques onde o limpo faz
15-25, e passou) — um instrumento cuja tese e "bate por 40 s" pode bater duas vezes e absolver.

## 65 — Toda medicao de cor feita com `__cor` desde 21/08 e suspeita — plantao/dev-plataforma

Consequencia do espelho vertical achado em 23/08 (a fórmula lia `altura*(1-fy)` contra um
`readPixels` que conta de baixo, e devolvia o pixel refletido). O conserto entrou; o que NAO foi
feito e revisar o que aquela funcao ja tinha afirmado.

Concreto: a tabela do NOTES de 21/08 traz **768×1024 = `#dfcc9e`**, e essa cor **hoje nao sai**
naquele ponto. Provavel leitura espelhada — e ninguem revisou a tabela.

Vale a pena porque numero errado no diario e pior que numero ausente: ele vira linha de base
para a proxima comparacao, e a proxima pessoa mede contra uma mentira sem saber.

Duas coisas medidas em 23/08 que ajudam a revisar: a distancia entre o ponto e o reflexo NAO e
"~10 px" em toda tela — e 10 px em 1366×768, **8 px** em 1024×768 e **87 px** em 768×1024. E o
sol `0xfff2d8` que o `gerar-territorio.js` afirma ter puxado "15/255 para fora" **nao reproduz**:
reconstruido no commit `fad3a5d`, o maximo obtido foi 3/255, com espelho ou sem. A causa daquele
15/255 continua **nao estabelecida** — nao escreva que foi o espelho, porque isso nao foi provado.

## 66 — Ninguem olhava os cartoes de link, e a barra a 1200 px nao e medida por ninguem — qa

Achado pelo QA em 23/08 auditando outra coisa, e ele pegou estrago real: o
`territorio/compartilhar.jpg` **commitado** saiu com o interruptor de privacidade dentro do
quadro, e com "A Historia" fora da barra e "Glossario" cortado em "lossario".

Duas lacunas, e as duas continuam abertas depois do conserto daquele cartao:

**(a) O cartao de link e o unico artefato que ninguem reve depois de publicado** — palavras do
proprio gerador. O robo da rede social busca uma vez e guarda por semanas. O
`gerar-territorio.js` cobra peso, pinos e WebGL do cartao; nunca cobrou **o que esta no quadro**.

**(b) A barra a 1200 px nao e medida.** O `medir-plataforma-chrome.js` testa 390, 430 e 1366. O
cartao e 1200 — e foi exatamente ali que a barra perdeu uma tabua, entre dois viewports testados.

O QA escreveu `test/medir-cartao-controle.js` para fechar (a): abre cada secao em 1200×630,
aplica a MESMA exclusao do gerador dela — com assinatura de fonte, para a tabela nao envelhecer
calada — e cobra zero controle flutuante no quadro. Visto reprovando: exit 0 na main, exit 1 no
ramo com o defeito, mais 3 controles injetados. Falta integrar e falta (b).

## 67 — O portao do cartao cobra ESFORCO, nao RESULTADO — e ha caminho de volta com os dois verdes — qa/dev-plataforma

Achado pelo QA em 23/08, na re-auditoria que APROVOU o conserto do cartao. Nao bloqueou porque
o artefato de hoje esta certo; entra aqui porque a FORMA do portao deixa o mesmo defeito voltar.

O gerador do TERRITORIO passou a recusar construir se a exclusao do cartao esconder **menos de
2** controles. Isso cobra quantos nos foram escondidos — esforco —, nao se **sobrou** controle no
quadro — resultado.

O QA reproduziu o caminho de volta, e ele nao e rebuscado: **alguem envolve o interruptor num
`span` com `position:sticky`, o botao passa a `position:static` e muda de id.** Medido na pagina
do ramo: a exclusao ainda esconde `.med` e `.vaoMedida`, dois nos, entao o `throw` **deixa
passar**; o `medir-cartao-controle.js` devolve lista vazia e **aprova**; e o botao fica em
**x=331, y=31, 72x44, dentro do quadro e por cima**, com `elementFromPoint` acertando nele. O
print mostra "MEDICAO / ligada" tapando "O Territorio" ate sobrar a letra O. **E o defeito de
23/08 de volta, com os dois portoes verdes.**

CONSERTO VOTADO PELO QA, e nao e mexer no numero: trocar a contagem por uma **pos-condicao**.
Depois de excluir, o gerador rele o quadro com a MESMA leitura do instrumento e recusa se sobrou
qualquer controle; e recusa tambem se um alvo nomeado (`MED.ID_BOTAO`, a frase) **existe na
pagina e nao saiu**. Sao ~6 linhas reaproveitando codigo que ja esta escrito, e ficam imunes a
renome, a involucro e a contagem.

## 68 — A lista de alvos e a mesma no gerador e no instrumento, e por isso os dois tem o MESMO buraco — qa/dev-plataforma

Segundo achado da mesma re-auditoria, e o dev tinha declarado a duvida antes de alguem perguntar
— manteve a lista identica de proposito, para as duas nao divergirem. O QA votou o contrario, e
com medida.

A lista e `button, [role=button], input, select, summary`. O QA grudou na barra uma
`div class="qaDiv" onclick tabindex="0"`: a exclusao do gerador **nao a retira**, o instrumento
com a lista identica **nao a ve**, e uma lista paranoica (mais `[onclick]`,
`[tabindex]:not([tabindex="-1"])`, `[contenteditable]`, `label`, `a[href]` fora da barra)
**acha**, em 33,31 42x44.

O ARGUMENTO, e ele vale alem deste arquivo: lista compartilhada da **um lugar para consertar** e
**um buraco para os dois**. E a mesma forma do defeito da semana — a regua e a coisa regulada
partilhando a suposicao. O medo de divergir ja esta resolvido pelo mecanismo de **assinatura**
que o instrumento tem: se o gerador mudar de regra, o teste reprova dizendo que a tabela
envelheceu, em vez de aprovar calado.

REGRA PROPOSTA: **instrumento estritamente mais largo que o gerador.** Quando ele reprovar algo
que o gerador nao pega, o gerador se alarga. Um instrumento que so pode confirmar o gerador nao
e um segundo par de olhos. Medido que alargar e seguro: com a lista paranoica, as quatro paginas
intactas continuam devolvendo lista vazia.

## 69 — A `regua-larga.js` recebeu METADE da cura, e mede um layout que ainda esta assentando — qa/dev-jogo

Achado pelo QA em 23/08, auditando a varredura de intermitencia. **Nao bloqueou**, e a razao esta
medida abaixo — mas e margem perdida que ninguem pediu.

A varredura trocou o relogio da regua por espera de estado, so que pela metade: ela espera o
`#telaMenu` ganhar a classe `aberta` e **nao** espera as animacoes. O `estilo.css:587` roda
`brota .42s` em `#telaMenu.aberta > *`, com `.12s` de atraso no terceiro filho — a mobilia so
para em ~540 ms.

Medido nas SEIS telas que a regua julga: a espera nova resolve em **81 a 301 ms**, com **4
animacoes ainda correndo**, e o `#btnConfig` — o botao que a regua julga — esta de **18 a 223 px**
da posicao final:

| tela | na espera nova | depois | delta | cabia direto |
|---|---:|---:|---:|---|
| tablet retrato 768x1024 | 978 | 960 | -18 | sim -> sim |
| tablet paisagem 1024x768 | 739,7 | 713,7 | **-26** | **nao -> sim** |
| notebook 1366x768 | 804,8 | 713,8 | **-91** | **nao -> sim** |
| landscape 899x500 | 427,5 | 409,5 | -18 | sim -> sim |
| telefone deitado 926x428 | 597 | 374 | **-223** | **nao -> sim** |
| ultrawide 1920x1080 | 931,4 | 913,4 | -18 | sim -> sim |

Em **3 de 6 telas o caminho julgado mudou**: o portao passa pelo ramo de resgate por rolagem
onde antes o botao cabia direto.

POR QUE NAO BLOCKEOU: A/B da regua do ramo contra uma copia com o `waitForTimeout(1400)` de volta
deu **exit 0 nos dois, saida identica linha a linha em 3 de 3 pares sob carga** — e a nova e bem
mais rapida (26-34 s contra 47-52 s). **Perda de margem provada, regressao de resultado nao.**

O PERIGO E FUTURO, e por isso vale o item: o dia em que alguem acrescentar uma assercao de
geometria vertical ali, ela estara medindo um layout que ainda esta assentando. O conserto e o
mesmo `telaParada()` que o `encaixe.js` ja usa — e o cabecalho do proprio encaixe, de 21/08,
chama a versao sem espera de animacao de "portao que era cara ou coroa".

## 70 — Tres cegueiras de instrumento que o QA nomeou e ninguem esta olhando — qa/dev-jogo

> **(a) e (b) RESOLVIDOS — 31/08, dev-jogo.** E as duas ja estavam no codigo antes desta rodada:
> a rodada verificou em vez de reescrever, que e a diferenca entre fechar item e fingir.
>
> **(a) medido, nao suposto.** Sonda propria contra uma pagina sintetica com `#hudTop` e
> `#pdFlor` e **sem** `#telaMenu`, teto de 3.000 ms, os DOIS predicados na MESMA pagina:
> ingenuo `false` em **65 / 6 / 4 ms** (mudo); guardado `false` em **3005 / 3001 / 3004 ms**
> (o teto inteiro — barulhento, que e o que se quer). Controle na pagina CERTA: os dois `true`
> em 3 e 2 ms, entao a guarda nao custa nada onde a pagina esta certa. O `jogoPronto` do
> `encaixe.js` **ja tem** a guarda (`!!m && m.classList…`).
>
> **(b) o aviso ja existia; o que faltava era o numero nao envelhecer.** A conta, refeita do
> zero: clamp de dt `0,25 s` (src/jogo.ts) x `velocidadeMundo()` medida no jogo aberto
> **38,2609 px/s** = **9,5652 px** — o pior quadro que o motor CONSEGUE produzir — dividido
> pelo piso `0,115` = **83,176 ms**. Falsificado com a MESMA dose (a saturacao do clamp) em
> varios ms1: **REPROVA a 83 ms, PASSA a 84 ms**. Mesma dose, vereditos opostos: acima do
> limiar a regua mede a maquina, nao o defeito. O `83` literal virou derivado
> (`test/smoke.js`, `PISO_TAXA`/`CLAMP_DT`/`msCego`) porque `PASSO_PX` e o `n` inteiro da
> velocidade sao constantes MEDIDAS que o CLAUDE.md §3 promete re-derivar na migracao —
> escrito a mao, o 83 passaria a avisar na hora errada em silencio. **Provado que dispara:**
> com um quadro de 150 ms injetado de proposito, o smoke imprimiu
> `AVISO: quadro de 169ms, acima dos 83.2ms…` e saiu **exit 0** (avisa, nao reprova).
>
> **(c) continua aberto** — `fila-auth.js` e o `test/tmp-pin-local-*.txt` de nome fixo, mais os
> 21 relogios do `smoke.js`. Nao foi tocado nesta rodada.


Todas de 23/08, todas medidas, nenhuma bloqueou a entrega.

**(a) O `jogoPronto` vira no-op de 64 ms na pagina errada.** Ele nao guarda contra `null` antes de
ler o `#telaMenu`, e o `waitForFunction` **REJEITA no primeiro predicado que lanca** — provado por
sonda: `false` em 334 ms contra 4168 ms quando a condicao e so *falsa*. Numa pagina com `#hudTop`
e `#pdFlor` mas **sem** `#telaMenu`, a espera devolve false em 64 ms. Essa pagina nao e hipotese:
e o 404 que o `abrir.js` serviu nas 16 h de CI vermelho de 20/08. Nao esconde defeito do jogo (as
assercoes seguintes caem), mas troca "estou apontado para a pagina errada" de um timeout
barulhento por um false rapido e mudo. **O mesmo autor acertou isso no `bootPronto` do smoke** —
e uma linha.

**(b) A regua de taxa e infalsificavel quando o quadro passa de 83 ms, e nao avisa.** O teto e
`0,115 x ms1`, e como o motor nunca avanca mais de 9,5655 px por `dt`, a assercao so consegue ver
defeito enquanto `ms1 < 83 ms`. Medido sob carga: ms1 = 22, 27, **167**, **123**, 45, 34 — **2 de
6 rodadas (33%) no regime cego**. Nao e erro de desenho, porque ali o clamp torna bom e ruim o
mesmo numero; o defeito e o teste **calar** sobre isso. Numa maquina de CI cronicamente lenta a
assercao fica muda para sempre. Um `console.log` de "quadro longo demais para julgar" resolve.

**(c) O `fila-auth.js` NAO e paralelizavel, e quem usar o `repetir.js` nele mede a coisa errada.**
As cenas 23 e 24 escrevem `test/tmp-pin-local-*.txt` com nome **fixo**, entao rodar N em paralelo
mede colisao de arquivo, nao intermitencia. Junto: o QA achou **1 falha em 35 rodadas em fila
(2,9%)** e **nao conseguiu reproduzir em 32 tentativas seguintes** — a assercao culpada fica **NAO
PROVADA**, e fica registrado que o "0 de 6" que justificou nao tocar o arquivo era amostra pequena
demais.

**Sobra tambem:** 21 relogios ainda no `smoke.js` (30 na main), e pelo menos um trava pelo
mecanismo que a varredura chamou de o mais caro do arquivo — `tap('#openUpgrades')` seguido de
`waitForTimeout(350)` e tres toques com 80 ms entre eles, julgados por "some upgrade did not
apply". Mesmo arquivo, mesma doenca, intocada.

## 71 — `setInterval(salvar, 10000)` passa o VALOR, e o save real apaga a semente de QUALQUER teste — dev-jogo (src/, e a maquina do mac)

> **RESOLVIDO — 31/08, dev-jogo. O conserto ja estava em `src/jogo.ts` (`setInterval(() =>
> salvar(), 10000)`); o que faltava era a PROVA de que ele morde.** Feita por injecao de
> regressao, os dois lados na mesma maquina e no mesmo dia:
>
> | codigo | 0s..9s | 10s..13s | veredito |
> |---|---|---|---|
> | `setInterval(() => salvar(), 10000)` (hoje) | semente | **semente** | sobreviveu |
> | `setInterval(salvar, 10000)` (regressao injetada, build refeito) | semente | **REGRAVADO** `{"energia":0,"energiaTotal":0,"modo":"limpo",…}` | sobrescrita aos 10 s |
>
> Bate com a sonda do QA de 23/08 no segundo exato. Regressao revertida e `index.html`
> reconstruido byte-identico ao de HEAD (`git diff -- src/ index.html` vazio).
>
> **IRMAOS: procurados e nenhum precisa de conserto.** `grep -nE "set(Interval|Timeout)\(
> *[A-Za-z_$][A-Za-z0-9_$]* *,"` devolve tres — `pintarHomeCena`, `fimCerimonia`,
> `avancarFala` —, e **nenhum teste reatribui esses nomes** (os testes os CHAMAM, que e outra
> coisa). Os nomes que os testes dublam sao tres: `salvar`, `salvarRetencao` e `clicar`;
> `salvarRetencao` nao e agendado, e `clicar` ja esta na forma de seta (src/jogo.ts:15776).
> Diff nao alargado por simetria, de proposito.


Causa raiz PROVADA pelo QA em 23/08, e ela explica uma **classe inteira** de vermelho
intermitente que ninguem tinha nomeado.

`src/jogo.ts:16073` faz `setInterval(salvar, 10000)` — passando o **valor** da funcao. O estafeta
`salvar = function(){}` que o `smoke.js`, o `robusto-tudo.js` e o `medir-save-hostil.js` **todos**
usam reatribui o NOME e **nao alcanca** o que o intervalo ja segura. Entao, a cada 10 s, o save
REAL sobrescreve a semente que o teste plantou.

Sonda do QA, amostrando de segundo em segundo:

```
0s:semente | 1s:semente | ... | 9s:semente | 10s:REGRAVADO
REGRAVADO aos 10s -> {"energia":994965,"energiaTotal":994965,"modo":"carvao","u1"...
```

**Bytes identicos aos de uma falha real** que ele viu: `npm test` reprovando em *"a non-boolean
was accepted as an upgrade"* mostrando exatamente esse objeto. O save adulterado que o smoke
semeia tinha sido substituido por um save de verdade antes da recarga.

Medido: **2 vermelhos em 4 rodadas do `npm test` na main**, com `git diff --stat main HEAD -- src/
ferramentas/` **vazio** — ou seja, nao era entrega nenhuma, era isto.

CONSERTO: uma linha. `setInterval(() => salvar(), 10000)`. E de `src/`, entao e territorio da
outra maquina — passar pelo canal.

O QUE ESCAPA E O QUE NAO: cena que faz `setItem` + `carregar()` **sincronos dentro de um
evaluate** e imune. Cena que faz `setItem` + `reload` **nao e** — e sao essas que reprovam quando
o tique de 10 s cai na janela entre gravar e ler.

## 72 — O teto do ganho offline tem um IRMAO sem cobertura nenhuma: a aba oculta — dev-jogo

> **RESOLVIDO — 31/08, dev-jogo. `test/robusto-tudo.js`, cena 3c.** E este era o unico dos
> quatro que faltava de verdade: nao havia uma linha de teste no caminho da aba oculta.
>
> **Onde, e por que ali:** cenario 3 do `robusto-tudo` chama-se *"a aba em segundo plano por
> horas"* e a 3b ja cobre a metade que ESCONDE. A 3c e a metade que VOLTA — mesmo cenario,
> mesmas ferramentas (`paginaLimpa`, o truque do `Object.defineProperty` em `document.hidden`),
> ao lado das asseercoes de teto da 2c. Nao foi para o `smoke.js` porque uma cena que forja
> `document.hidden` e `escondidoEm` no meio de um arquivo sequencial de 2.474 linhas envenena
> o estado das ~40 cenas seguintes. **Ressalva honesta: o `robusto-tudo` esta FORA do CI (item
> 73), entao o alcance desta assercao depende do 73 — nao dupliquei a cena no smoke por causa
> disso.**
>
> **O que ela cobra** (sentinela `voltouDepoisDe = -1` antes de cada volta, a disciplina da 2c —
> zero e o valor de repouso e passaria nos dois mundos):
>
> | aba oculta por | esperado | medido |
> |---|---:|---:|
> | 30 s | 30 s, sem papel da volta | 30 s, papel `false` |
> | 8 h (ausencia honesta) | 28.800 s | 28.800 s |
> | 3 anos (relogio pulou) | 43.200 s (teto de 12 h) | 43.200 s |
> | −6 h (relogio recuou) | 0 s | 0 s |
>
> Mais: `escondidoEm` zerado nas quatro (a mesma ausencia nao pode ser paga duas vezes) e a
> sentinela morta nas quatro (o caminho RODOU).
>
> **PROVA DE QUE MORDE, feita na ordem exigida.** Com `Math.min` arrancado do produto e o build
> refeito:
> - `node test/robusto-tudo.js` -> **exit 1**, `✗ 3c: O TETO DE 12 H NAO SEGUROU NA ABA OCULTA
>   — 3 anos escondida deviam virar 43200s, viraram 94608000`
> - e os vizinhos, com o MESMO defeito no lugar: `node test/smoke.js` **exit 0**,
>   `node test/medir-save-hostil.js` **exit 0** — o "quatro verdes com o teto arrancado" do QA
>   reproduzido, agora com um vermelho no meio.
> - defeito revertido, build refeito: `node test/robusto-tudo.js` -> **exit 0**.
>
> Nada do produto foi mudado para o portao passar: a cena prega o comportamento que ja existe.
> (`git log -S` na linha nao mostra bomba desarmada — o unico commit que a toca e o import
> comprimido de 23/08, que contem o repositorio inteiro.)


Achado pelo QA em 23/08, auditando outra coisa. `src/jogo.ts:16123`:

```js
pagarAusencia(Math.max(0, Math.min((Date.now() - escondidoEm)/1000, CFG.capOfflineHoras*3600)))
```

E o caminho da **aba oculta**, que nao passa por `carregar()`. Mesma constante, mesma
consequencia — e zero cobertura: `grep -rn` por `escondidoEm` ou `pagarAusencia` em `test/*.js`
devolve **nada**.

O QA removeu o `Math.min` inteiro e rodou os quatro portoes: `robusto-tudo` **0**,
`medir-save-hostil` **0**, `encaixe` **0**, `smoke` **0**. **Quatro verdes com o teto arrancado.**

Isto responde uma pergunta que eu tinha feito com um sim desconfortavel: existe caminho em que o
teto some sem nenhuma cena reprovar. E o irmao esquecido do `carregar()`.

## 73 — `robusto-tudo` e `medir-save-hostil` estao FORA do CI, e foi isso que deixou a contradicao viver nove dias — plantao

> **RESOLVIDO — 01/09, commit `e2d92a3` ("Fecha as ressalvas do QA de lote e poe robusto-tudo e
> save-hostil no CI"). Marcado aqui em 02/09 pelo plantao `nuvem-20260902T0023`, que foi pegar o
> item `endurecer-portoes` e achou este pedaco ja feito e ainda escrito como aberto.**
>
> Medido na `main` de hoje: `.github/workflows/teste.yml` tem `node test/robusto-tudo.js`
> (timeout 5 min) e `node test/medir-save-hostil.js` (timeout 4 min), com o comentario que
> registra o motivo de o item ter saido da fila — a cena **3c** do `robusto-tudo`, a UNICA linha
> de teste no caminho da aba oculta, rodava em **zero** lugares automaticos. A condicao que o
> item exigia antes de acrescentar ("conferir se sao estaveis, porque o `robusto-tudo` depende do
> save semeado") foi atendida pelo caminho certo: o **PENDENTES 71 fechou primeiro**, em 31/08,
> exatamente na ordem que este item sugeria.
>
> **A licao nao e sobre o CI, e sobre este arquivo.** O item ficou fechado no codigo e aberto no
> `PENDENTES.md` por um dia inteiro, e chegou a esta rodada dentro do escopo de um item do
> backlog — quem pegasse ao pe da letra escreveria as duas linhas de novo, veria `git diff`
> vazio, e teria como **confirmar um achado que ja nao existia**. E o mesmo falso verde do
> `canonical-jogo` (`PLANTAO.md` §5), sete dias depois, e a cura e a mesma: `git log -S` na
> assercao ANTES de despachar o conserto.

O `.github/workflows/teste.yml` roda 12 portoes. **Estes dois nao estao entre eles** — sao
portoes de mao.

A consequencia foi medida em 23/08: a `main` carregava **dois portoes em contradicao direta sobre
a mesma entrada** (`salvoEm: 5e12`) por **nove dias**. O `robusto-tudo` exigia que aquele carimbo
forjado batesse no teto de 12 h; o `medir-save-hostil`, nascido no commit que desarmou a bomba,
exigia que valesse zero. Ninguem tropecou porque nenhum dos dois roda sozinho.

Acrescentar os dois ao CI e barato. **Conferir antes se eles sao estaveis** — o `robusto-tudo`
depende do save semeado, e o PENDENTES 71 mostra que a semente e apagada a cada 10 s.
**COMO FICOU (23/08).** Duas das tres viraram conserto de CODIGO e uma virou texto — nessa ordem,
porque frase que explica excecao e frase que ninguem le.

- **(1) conserto de codigo.** `sair()` passa a chamar `zerarTentativas()`. O "ate voce sair" voltou a
  ser verdade para o contador, e o rodape ENCOLHEU em vez de crescer. Sem folga de seguranca: aquele
  contador e UX (o comentario dele ja dizia isso), quem ataca nao passa por esta pagina, e sair exige
  ja estar dentro.
- **(3) confirmado, e era um PIN de verdade — conserto de codigo.** A linha que sustenta:
  `function marcarRecusado(pin){ try{ sessionStorage.setItem(PIN_RECUSADO,pin); }catch(e){} }`, com o
  `pin` vindo de `(t||"").split("\n")[0].trim()` sobre o corpo de `/pin-local`. O argumento antigo ("o
  recusado nao e o certo") e fraco justamente no caso que a funcao existe para atender: o dono
  TROCOU o PIN e esqueceu de reescrever o arquivo, entao o valor recusado ali e, quase sempre, o PIN
  ANTERIOR dele. Agora guarda-se `{sal, marca}` — PBKDF2-SHA256, sal aleatorio de 16 bytes, 60.000
  voltas, pelo `crypto.subtle` do proprio navegador: nada caseiro, nenhuma biblioteca. A pergunta que
  a funcao precisa fazer ("e o mesmo PIN que ja foi recusado?") continua respondida; o segredo nao
  fica. Valor no formato VELHO (PIN em claro numa aba que ja estava aberta) e apagado na primeira
  leitura. Sem `crypto.subtle` a pagina simplesmente NAO LEMBRA e volta a tentar uma vez por carga —
  degradar para nao lembrar e aceitavel, degradar para guardar o segredo nao e.
- **(2) so tinha saida por texto**, como o item ja previa: apagar a fila ao sair jogaria fora o que o
  dono escreveu. O rodape passa a dize-la, com o teto (50 itens / 200 KB), com o motivo de ela ficar
  e com o fato de ela subir sozinha quando a rede volta.

**O PORTAO NOVO, para isto nao apodrecer de novo: `test/rodape-verdadeiro.js`.** As tres chaves
nasceram DEPOIS da frase, e ninguem tinha motivo para reler o rodape ao acrescentar uma — foi por
acumulo, nao por ma-fe, e so um portao corrige acumulo. Ele abre o dashboard headless, colhe as
chaves que a pagina realmente grava (gravador embrulhando `Storage.prototype.setItem` antes de
qualquer script + `Object.keys` dos dois armazenamentos + varredura estatica que REPROVA o `setItem`
cuja chave ela nao consegue resolver) e falha se existir chave que o rodape nao menciona. Cobra
tambem, com o BOTAO de sair e nao com o texto, o que o rodape promete que some e o que promete que
fica, e que nenhum valor guardado contenha o PIN.

**Visto reprovando** em quatro defeitos injetados — chave-isca gravada, rodape sem a frase da fila,
`sair()` sem zerar o contador, marca de volta em claro: **exit 1 nos quatro**. **Limite declarado** no
cabecalho do arquivo: o metodo em execucao so ve o que as cenas exercitam, e o estatico nao resolve
chave montada em tempo de execucao (concatenacao, template, variavel reatribuida) — por isso ele
reprova em vez de ignorar. Junto foi atualizado o par de mutacao do S4 em
`test/fila-auth-controle.js`: a guarda mudou de forma (virou assincrona) e o controle apontaria para
uma linha que nao existe mais, saindo com "envelheceu" (exit 2).

**Portoes:** `npm test` 0 · `node test/encaixe.js` 0 · `node test/fila-auth.js` 0 (24 cenas, inclusive a
24, que e a do PIN recusado) · `node test/medir-save-hostil.js` 0 · `node test/medir-telas-altura.js 360
500 950` 0 · `node test/rodape-verdadeiro.js` 0.

**A SEGURANCA REPROVOU O COMMIT ACIMA (0015e70) COM SONDA PROPRIA, E TINHA RAZAO — 23/08.** O
commit que existia para tirar tres frases falsas do rodape embarcou uma QUARTA frase falsa e
deixou vivo um PIN em claro num caminho que ele afirmava ter fechado. Mesma classe de defeito,
mesmo paragrafo, mesmo dia. Fica escrito porque a licao vale mais que o conserto:

- **B1 — "ela sobe sozinha assim que a rede volta" era falso.** `flush()` so era chamado na carga,
  no login e no auto-login; nao havia ouvinte de `online`. Medido pela seguranca com a aba aberta e
  a rede de volta: 1 item parado em t+3s, +8s, +16s e +25s, drenando so no reload. Havia duas
  saidas — encolher a frase ou cumpri-la. Escolhida a segunda, que e a que serve ao dono:
  `window.addEventListener("online", function(){ flush(); });` na partida. Uma linha, e a trava do A7
  (`lavando`/`relavar`) continua sendo quem impede duas lavagens.
- **B2 — o PIN em claro herdado sobrevivia a toda carga quando havia sessao.** A limpeza morava
  dentro de `lerMarca()`, chamada so por `pinJaRecusado()`, chamada so por `autoLoginLocal()`, que
  desiste na primeira linha: `if(!LOCAL || ses) return;`. Com o dono entrado — o estado normal
  dele — a limpeza nunca rodava; medido presente nas cargas 1, 2 e 3. E a aba que atravessa um
  deploy roda o JS de ontem, que grava em claro. Conserto: `lerMarca();` na PARTIDA, antes de
  `autoLoginLocal();`. O comentario que afirmava "apaga-se na hora" foi reescrito para descrever o
  que o codigo faz.
- **Nao bloqueantes, tambem corrigidos:** o comentario dizia "no maximo uma derivacao por carga" e
  sao DUAS no pior caso (medido: 51,1 ms); e o argumento da forca da derivacao passou a dizer o
  que ela entrega de verdade — **valor CATEGORICO, nao criptografico: nenhuma credencial em
  repouso**. Os numeros da seguranca: 60.000 voltas contra 10^8 candidatos = ~17 min de GPU, ~15
  centavos de dolar, e um script na propria pagina pega o PIN inteiro de graca com
  `fetch("/pin-local")`. As voltas NAO foram aumentadas (um dia de GPU exigiria 5,1 milhoes, 2 a 13 s
  por carga), e "nao guardar nada" foi recusado pela propria seguranca com argumento: reabre o S4
  de 22/08 e quebra a asserção do PIN corrigido na cena 24.

**A LICAO, e ela e a parte que vale para as proximas rodadas:** o portao cobrava que a FRASE
EXISTISSE, nao que ela fosse VERDADE — por isso ele mordeu isca e mutante e deixou passar os dois
defeitos do mesmo commit. E a lição 2.8 do EQUIPE.md num lugar novo. Duas cenas novas fecham isso,
e sao a parte mais valiosa desta rodada: **[6]** valor legado em claro + sessao viva (cobra a
ausencia do PIN nas cargas 1 e 2) e **[7]** fila presa + rede que volta (cobra que ela drene SEM
recarregar). Ambas vistas reprovando com o defeito injetado: **exit 1**, agora 6 defeitos no
controle de mordida.

**E uma armadilha de instrumento que apareceu no caminho:** a cena 3 reprovou uma vez sozinha. Em
vez de repetir ate passar, medi (lição 2.9): a carga FRIA da pagina leva **4112 ms** (a pagina so
pediu `/pin-local` em +2941 ms), contra 358–506 ms nas quentes, e minhas esperas fixas somavam 900
ms. Todas as esperas por relogio sairam do arquivo: a partida agora e ancorada em `data-auth`
(que, sendo escrito no bloco sincrono da partida, prova que `lerMarca()` ja rodou) e o resto espera
pelo FATO, com teto que devolve false para a assercao falar. Tres execucoes seguidas: 0, 0, 0.

**Portoes da segunda volta:** `node test/rodape-verdadeiro.js` 0 (7 cenas) · `node test/fila-auth.js` 0
(24 cenas) · `node test/fila-auth-controle.js` 0 (21 defeitos) · `npm test` 0 · `node test/encaixe.js` 0.

**3a VOLTA — O CONSERTO DO B1 CRIOU PERDA SILENCIOSA DO TEXTO DO DONO, e a seguranca mediu.** Os
dois consertos da 2a volta foram verificados e fechados (B2: `null` nas tres cargas, semeando o PIN
de novo em cada uma; B1: drena em 121 ms). O bloqueante novo nasceu do MEU conserto:

- **O ouvinte de `online` + o contador de tentativas = 25 piscadas apagam a resposta.** Cada
  `flush()` que falhava incrementava `tentativas` **inclusive com falha de rede** (`st===0`), e
  `TENTATIVAS_MAX=25` descarta. Sonda com servidor inalcancavel e 30 quedas-e-voltas de ~300 ms:
  fila 1 / tentativas 6, 12, 24 — e **na piscada 25 a fila esvaziou**. Controle que prova que e
  NOVO deste commit, 12 piscadas: main **0**, mutante sem ouvinte **0**, o meu **12**. Antes,
  queimar as 25 exigia 25 CARGAS DE PAGINA (ato do dono); depois, bastam um trem e um elevador.
  **Conserto, uma linha:** `if(st) g[0].tentativas=…` — falha sem status e falha do caminho, nao
  do conteudo; contar seria punir o texto do dono pelo Wi-Fi dele. 503 continua contando, e 503
  nao dispara `online`. **Nao se conserta com flush periodico:** cada tentativa gasta uma das 25,
  entao um `flush()` no `setInterval(carregar, 7000)` jogaria o texto fora em ~3 min de servidor
  caido.
- **E o descarte era MUDO** — so `console.warn`, enquanto o caminho irmao (`podarFilaHerdada`) ja
  mostrava `toast` desde o N10. Agora avisa na tela. Perder resposta do dono em silencio e
  perde-la duas vezes: ele nao sabe que precisa reescrever.
- **A frase do rodape mudou, e a razao e medida.** Refeito sem `setOffline`, nas tres formas de a
  fila encher: navegador offline de verdade → o evento dispara e drena em **121 ms**; servidor
  caido (503) → nao dispara; **conectividade morta com interface viva** (captive portal, DNS
  morto) → nao dispara. O 503 a frase nem promete; o terceiro caso e a falsidade real, e a saida
  honesta e a FRASE, porque o conserto em codigo e justamente o que apaga o texto do dono. Ficou:
  *"…ela sobe sozinha quando a rede volta — e, se o navegador nao perceber que ela voltou, na
  proxima vez que voce abrir a mesa."*
- **Duas oracoes de comentario**, as duas cobradas: a condicao da ancora `data-auth` (so vale
  enquanto `lerMarca()` ficar no mesmo bloco sincrono e sem excecao no meio — verificado pela
  seguranca com MutationObserver: `data-auth` aos 53,2 ms, limpeza aos 53,1 ms) e o alcance real
  do conserto do B2 (**a aba que ainda nao recarregou roda o JS de ontem e nada deste commit a
  alcanca**).

**O que virou PORTAO em vez de raciocinio:** a cena 2 passou a cobrar `lerMarca();` como chamada
SOLTA no topo da partida. A seguranca provou que a distincao nao e ORDEM — `lerMarca()` depois de
`autoLoginLocal()` passa, e passar esta certo, os dois no mesmo bloco sincrono — e sim
INCONDICIONALIDADE: o mutante `if(!ses) lerMarca()` e mordido pelas duas pontas (portao estatico
e cena 6).

**Cenas novas: [8]** 30 piscadas com servidor mudo — a resposta sobrevive e `tentativas` nao sai
do zero; **[9]** recusa permanente (422) — o item sai da fila E o dono VE o toast. A cena 9
ensinou algo ao ser escrita: `registrar()` enfileira ate a recusa permanente, e quem descarta e a
lavagem SEGUINTE — entao o descarte (e o aviso) so chega quando algo pede lavagem: a proxima
carga, o login, ou a rede voltando.

**A LICAO DESTA VOLTA, e ela nao e sobre uma linha de codigo:** consertar uma frase falsa criou
uma perda de dados silenciosa, e isso **nao dava para prever lendo o codigo** — so medindo o que
o conserto faz quando o mundo se comporta mal. E o argumento mais forte que ja apareceu aqui para
o auditor rodar DEPOIS do conserto, e nao so antes.

**Portoes da terceira volta:** `node test/rodape-verdadeiro.js` 0 (9 cenas) · `node test/fila-auth.js`
0 (24 cenas) · `node test/fila-auth-controle.js` 0 (21 defeitos) · `npm test` 0 · `node
test/encaixe.js` 0 · mordida **10 de 10** (exit 1 em todos).

**4a VOLTA — A GROWTH REPROVOU PELA FORMA, com a reescrita pronta (23/08).** Conteudo certo, fatos
completos, nada precisava sumir; o defeito era de construcao e de densidade:

- **O verbo estava ELIDIDO.** *"…ela sobe sozinha quando a rede volta — e, se o navegador nao
  perceber que ela voltou, na proxima vez que voce abrir a mesa"*: a pessoa tinha de carregar "ela
  sobe" por cima de um travessao e de uma condicional intercalada para encaixa-lo na oracao final.
  Le-se em voz alta e a voz chega ao fim sem verbo. Repetir o verbo custou tres palavras.
- **189 palavras, 7 frases, um `<p>` so, em letra miuda cinza** — o par que sinaliza "isto e para
  nao ler", que e o oposto do que quatro voltas de trabalho tentaram conquistar. Virou **cinco
  paragrafos**.
- **Duas trocas de vocabulario:** "derivacao" saiu (a conclusao que importa — *"e calculada a
  partir do PIN, mas nao da para reconstruir o PIN a partir dela"* — ja estava na mesma frase, e
  entao o conceito nao precisa ser exigido de quem le) e "sintetico" virou *"inventado (nao e o
  seu)"*. Ficaram, com argumento dela: "Supabase Auth" (nome proprio que o dono conhece), "resumo
  criptografico", "sessao" e "fila de respostas que ainda nao subiram".
- **O toast do descarte passou a dizer o que fazer.** Ela foi conferir se cabia "copie antes" e
  descobriu que NAO: `composto.value=""` limpa o campo assim que a resposta entra na fila, muito
  antes do descarte — quando o toast aparece, o texto ja nao esta em campo editavel nenhum. Entao
  a unica acao verdadeira e *"Se ainda for importante, escreva de novo."* Ela recusou sugerir um
  lugar de recuperacao, porque seria verdade em parte dos fluxos e mentira em outros — e este
  rodape ja pagou caro por afirmacao que vale so as vezes.

**O QUE A MEDICAO DESMENTIU NO PARECER DELA, e e o achado desta volta:** o parecer dizia, de
boa-fe, que a mudanca "nao toca CSS". **Toca.** O reset da linha 66
(`body,h1,h2,h3,p,ul,li{margin:0}`) zera a margem de TODO `p`, entao os cinco paragrafos saiam com
**0 px** entre eles — medido: `espacoEntre: [0,0,0,0]`. Visualmente **o mesmo muro**, com marcacao
diferente: a reescrita inteira teria sido invisivel para quem le. Uma regra resolveu —
`footer.rod p+p{margin-top:.62rem}` — e a medicao nova da **10 px** entre cada par. Print conferido.

**Isso virou a cena [10]**, e ela cobra o que a PESSOA VE (espaco renderizado entre os
paragrafos), nao a folha de estilo: trocar rem por em, ou mover a regra de lugar, passa; o muro
nao passa. Mordida: 11 defeitos, exit 1 em todos.

**Quatro cenas dependiam da redacao antiga e foram ajustadas — nenhuma afrouxou, e aqui esta cada
uma:** `/apagad\w+ quando voce sai/` → `/os dois somem quando voce sai/` (MAIS especifica: exige o
"os dois", que e o que torna a frase verdadeira para as duas chaves); `/marca de PIN recusado/` →
`/marca do ultimo PIN recusado/`; e `/derivacao/` → **duas** regexes que cobram a GARANTIA em vez
da palavra tecnica (`/nao da para reconstruir o PIN a partir dela/` e `/o PIN em si nao fica
guardado/`). Palavra qualquer um escreve; garantia e afirmacao.

**Portoes da quarta volta:** `node test/rodape-verdadeiro.js` 0 (10 cenas) · `node
test/fila-auth.js` 0 (24 cenas) · `node test/fila-auth-controle.js` 0 (21 defeitos) · `npm test`
0 · mordida **11 de 11**.

## 74 — Cinco gaps do portao do rodape, todos nomeados pelo QA ao APROVAR — dev-plataforma

Nenhum bloqueou, e nenhum e sobre o que a entrega mudou: sao sobre o que ela ainda nao cobre.

**(a) Os numeros do rodape nao estao amarrados ao codigo, e essa e a MESMA doenca do item 60.**
A cena 1 cobra `/50/` e `/200/` como TEXTO; `FILA_MAX=50` e `FILA_BYTES=200*1024` vivem em
`dashboard/index.html:552` e **nada liga os dois**. Hoje batem. Trocar `FILA_MAX` para 100 deixa
o rodape falso **com o portao verde** — que e literalmente a classe de defeito que o item 60
existiu para diagnosticar. Uma linha na cena 2 fecha.

**(b) Nada cobra `cenas === 10`.** Apagar uma cena imprime `PASSOU: 9 cenas` e sai **0**. Portao
que pode **encolher em silencio** — e o arquivo passou de 5 para 10 cenas em cinco voltas, entao
encolher e um risco real.

**(c) Anistia nao declarada na cena 8.** A segunda assercao (`!f[0] || !f[0].tentativas`) passa
**vacuamente** quando a fila esvazia — o QA viu isso acontecer no mutante: a primeira assercao
pegou o defeito e a segunda ficou verde com `f[0]` indefinido. Cosmetico, mas num arquivo que
declara todas as outras anistias em voz alta.

**(d) A varredura estatica nao cobre `localStorage["k"]=v`** (so `localStorage.k=`). O metodo por
execucao pega, mas so se alguma cena exercitar o caminho. Os outros limites do metodo estao
declarados no cabecalho; este nao.

**(e) Consequencia ACEITA do `if(st)`, e nao defeito — fica escrito para ninguem redescobrir.**
Com o host permanentemente inalcancavel (adblock, DNS morto, CORS), o item da cabeca da fila
nunca recebe status, nunca conta tentativa e **nunca e descartado** — a fila pode encher ate 50 e
passar a recusar respostas novas. E o tradeoff certo, porque o texto do dono vale mais que a
vazao, e o rodape declara o teto. Mas e uma cabeca imortal, e alguem vai encontrar isso um dia
achando que e bug.

---

## 75 — A CHEGADA tem UM ALVO PRESO em 640×360 para quem volta e toca — dev-jogo (achado do qa em 23/08)

**É defeito do JOGO, não do instrumento, e é o mais grave dos três achados da auditoria.** Está
aqui e não bloqueou a integração porque **já existia na `main`** — a entrega de hoje não piorou
nada; ela apenas não enxerga este estado.

A 640×360, quem **já terminou uma vez** e **tocou numa conferência** vê um `.cfItem` de
**377 px numa janela de 360**. Pela régua nova do próprio bloco 8b isso é `alvo PRESO (nem
rolando)` — não há posição de rolagem em que ele caiba inteiro. Reproduzido pelo qa na árvore da
entrega.

**A LACUNA QUE O EXPÔS, e ela é a lição:** o `ROLO_MEDIDO` do `medir-telas` guarda **o estado
mais curto de quatro**. `.cfRev` nasce `oculto` e sai do oculto em **qualquer** toque numa opção
— que é a única coisa que há para fazer nessa tela. E quem volta (`R.chegou > 1`) vê outro título
e outro trio.

| estado | 390×844 | 640×360 | 1024×768 | teto |
|---|---:|---:|---:|---|
| 1ª · fechada (**o que o portão mede**) | 442 | 528 | 21 | 496 / 592 / 45 |
| 1ª · **tocada** | **610** | **863** | **189** | idem |
| volta · fechada | 514 | 572 | 93 | idem |
| volta · **tocada** | **699** | **974** | **278** | idem |

**27 dos 40 estados já nascem acima do teto**, e a linha que o portão imprime (*"a CHEGADA rola
442px"*) erra a tela real em até **63%**. O 10/10 é verde porque ele não olha, não porque a tela
está boa.

**O instrumento que fecha a lacuna já existe** e entrou junto: `test/chegada-estados.js`, escrito
pelo qa, mede os quatro estados × dez telas e foi medido contra si mesmo com três defeitos
injetados. Hoje ele passa (exit 0) porque só INFORMA a caixa mais alta que a janela; o
`.cfItem 377>360` está no relatório dele.

**Conserto pendente:** fazer o `.cfItem` caber em 360 px de altura, ou aceitar e escrever por quê.
**Não corte texto sem passar pelo dono** — o que a CHEGADA afirma é §2.

---

## 76 — A 4ª receita de autoteste do medir-telas sai VERDE como está escrita — dev-jogo (qa, 23/08)

O commit `199be46` afirma que *"as quatro reprovam por exit code, verificadas uma a uma nesta
rodada"*. Para o artefato que ficou no repositório, **isso é falso**: a receita do rodapé é

```
TELAS_SO=390x844 node test/medir-telas.js TELAS_DEFEITO='#fimPergunta{position:fixed;...}'
```

com a variável **depois** do comando — o shell a passa como `argv`, e `process.env.TELAS_DEFEITO`
fica `undefined`. Copiada literal, sai **exit 0, verde**. Movendo-a para antes do `node`, sai 1
com a mensagem prometida.

Conserto: uma linha no rodapé do arquivo. **A urgência não é o bug, é o folclore** — receita de
autoteste que "prova" e não prova é pior que autoteste nenhum, porque a próxima pessoa confia.
É a lição 2.8 do `EQUIPE.md` em miniatura, e desta vez ela pegou quem escreveu a lição.

---

## 77 — O bloco 9 mede o quadrinho sob `content-visibility: auto` — dev-jogo (qa, 23/08)

`.qQuadro` tem `content-visibility: auto`, então o navegador **não dispõe** o conteúdo fora da
janela — e o portão mede a caixa não disposta. Erro **sistemático de 29 px** contra um limiar de
**1 px**, reprodutível ao pixel em duas execuções:

| página 46 | como o portão mede | realmente disposta |
|---|---:|---:|
| entrega, 320×568 | 488 em 500 | **517 em 500** |
| entrega, 640×360 | 297 em 302 | **307 em 302** |
| `main`, 320×568 | 539 em 496 | **572 em 496** |

**O efeito visual da entrega está certo** — nos prints a linha `fonte: INPE · PRODES…` aparece
inteira na entrega e é encoberta pelo VOLTAR na `main`. O que **não** está provado é o número:
pelo próprio bloco 9, medido direito, a página ainda estoura.

Conserto: forçar a disposição antes de medir (`contentVisibility: 'visible'` na medição, ou
rolar até a página) — e então re-decidir se 46 passa.

---

## 78 — O medir-telas tem intermitência PRÉ-EXISTENTE, e uma rodada verde não prova 10/10 — qa (23/08)

Em **1 de ~9 execuções** da fatia 390×844, o portão imprimiu
`volta: fora da tela por baixo: hudLinha acima da tela -4` e saiu **1**, sozinho, **sem disputa de
porta** (o qa confirmou rodando um portão de cada vez). Não reproduziu na repetição idêntica.

Isto é irmão do `PENDENTES 71` e do achado da porta única: **reprovação por sorteio**. E tem
consequência imediata — o `medir-telas` **não está no CI** hoje (o job `portoes` roda outros
oito), então ele entra no PR #6 com essa intermitência viva. Um portão que falha 1 em 9 no CI
ensina todo mundo a reapertar o botão, que é o começo de não ter portão.

**Piso de ruído medido pelo qa:** a mesma medição rodada duas vezes deu **0 px de diferença em
todas as telas** — então não é ruído de medição, é estado.

**Ainda em aberto, do mesmo bloco:** a tabela `ROLO_MEDIDO` prende dez números à métrica de fonte
desta máquina. A pilha é de sistema (`Georgia, Iowan Old Style, Times New Roman, …`) e o
`ubuntu-latest` não tem nenhuma das três primeiras. Medido: trocar a fonte move ±22 px, e
American Typewriter move +22 a +40 e **reprova a 768×1024** (+27 contra folga de 26). **O piso de
24 px compra exatamente UMA linha quebrada e nada mais.**

---

## 79 — O "guardado, não enviado" morre no F5, e o painel convida a acionar de novo — dev-plataforma (qa, 24/08)

Medido pelo QA: o marcador **aguenta 20,1 s** e atravessa dois ciclos do refresh de 7 s — a
alegação era 7,6 s, então ele é melhor que o prometido. **Mas some no recarregar.** Depois de um
F5 o rótulo volta a *"em espera"*, o botão volta a **"Acionar"**, e a fila local
(`mesa-brasil-fila4`) **continua com o pedido dentro** — medida: 157 → 172 bytes, com 3 POSTs
tentados e recusados com 401.

**Por que isso importa mais do que parece:** convidar a acionar de novo o que já está pedido é
a MESMA família do defeito que esta entrega veio consertar — o dono agindo sobre trabalho que
não precisava. Só que agora em vez de refazer item concluído, ele duplica o próprio chamado.

O marcador vive **na memória da aba**, de propósito: o rodapé promete a lista de chaves que a
página grava, e o autor não quis acrescentar nenhuma sem atualizar a promessa. **O dado para
consertar já está lá** — derivar a marca da fila do `localStorage`, que é onde o pedido está.
Custo: uma chave nova **mais** uma frase nova no rodapé, e o `rodape-verdadeiro.js` cobra as duas.

**Nota do mesmo bloco:** `marcaLocal` só é limpa quando o status deixa de ser `espera`. O
`flush()` que consegue enviar não avisa ninguém — então o cartão continua dizendo *"guardado, não
enviado"* depois de o item ter saído de verdade, até o plantão consumir a fila. É a mesma classe
de frase que mente, na direção oposta. **Achado da segurança**, no mesmo dia.

---

## 80 — `window.__XSS` medido no mesmo tick é uma asserção CEGA — qa (24/08)

O `test/caminhos-do-backlog.js` verifica `m5.xss === false` para provar que o título hostil não
executa. **Essa asserção não pode falhar**, e o QA provou rodando-a contra um dashboard
**vulnerável de propósito** (`textContent` trocado por `innerHTML`):

```
window.__XSS  = false   no tick do clique
window.__XSS  = true    1,5 s depois
```

O `onerror` de um `<img>` é **assíncrono**; o portão mede no mesmo tick e sempre vê `false`.
A alegação *"XSS testado, window.__XSS false"* **não prova nada** — quem prova, e morde de
verdade, é `tagsInjetadas === 0` e o texto aparecer literal.

Conserto: esperar (ou usar um payload síncrono) antes de ler a bandeira, **ou** tirar a asserção
e não fingir que ela cobre. Fingir é pior: dá licença por escrito para o caso difícil quebrar.

**Dois gaps do mesmo portão, para o mesmo conserto:** nenhuma cena cobre o estado
**"carregando"**, e nenhuma cobre o marcador guardado/enviado — ou seja, duas das três alegações
de estado da entrega ficaram **sem portão**.

---

## 81 — Dois itens livres são ÓRFÃOS do painel: não há como acioná-los — plantao (qa, 24/08)

`rotina-7-sinais` (agente `dev-dados`) e `fichas-lote-2` (agente `pesquisadora-fontes`) estão
`livre` no backlog, mas **não têm linha correspondente em `mesa_agente`** — a tabela que desenha
os cartões do painel. Sem cartão, não há botão; sem botão, não há como acionar.

Isso não é regressão da entrega: era assim antes e continua depois. **O que mudou é que agora dá
para ver** — antes os caminhos eram escritos à mão e ninguém comparava as duas listas.

Conserto: ou os dois agentes ganham linha em `mesa_agente`, ou o backlog deixa de apontar para
agente que não existe no painel. **A escolha é de produto, não de código:** o `dev-dados` está
declarado ATIVO no `AGENTES.md` desde 22/08, e a `pesquisadora-fontes` foi contratada em 22/08 —
então provavelmente é a tabela que está atrasada, não o backlog que está errado.

**E vale a trava:** nada mede hoje o desencontro entre `backlog.json` e `mesa_agente`. Um item
pode nascer apontando para um agente inexistente e ninguém sabe até alguém procurar o botão.

---

## 82 — O funil não audita rede/credencial, e um teste RENOMEADO some do diff — plantao/seguranca (caça de gap, 24/08)

Dois buracos no `ferramentas/integrar.js`, os dois medidos ao vivo pelo QA.

**(a) 19 de 20 caminhos de rede/credencial saem `NENHUMA` auditoria.** Os que doem, e o que
carregam sem disparar gatilho nenhum:

| arquivo | carrega | gatilho hoje |
|---|---|---|
| `vercel.json` | CSP `frame-ancestors`, X-Frame-Options, Referrer-Policy, nosniff do `/dashboard` | **nenhum** |
| `ferramentas/pin-local.js` | a porta do painel | **nenhum** |
| `ferramentas/fila-auth.sql` | as regras de linha (RLS) | **nenhum** |
| `ferramentas/conteudo-esquema.sql` | o esquema do banco | **nenhum** |
| `ferramentas/integrar.js` | o próprio funil | **nenhum** |
| `.claude/hooks/guarda.js` | a trava de território | **nenhum** |

Apagar o bloco `headers` inteiro do `vercel.json` integra com `--placar` e mais nada.

**(b) O RENAME contorna a auditoria.** `git diff --name-only main...ramo` mostra **só o destino**.
`git mv test/medir-save-hostil.js medir-save-hostil.js.bak` produz um diff sem `test/` nenhum →
**zero auditoria**, e `npm test` fica verde porque o teste sumiu. **Nada conta testes.**

Sãos (o QA disse com todas as letras): arquivo **NOVO** em `plataforma/` dispara `growth`;
`git rm test/alvo.js` aparece no diff e dispara `qa`. Só o rename escapa.

**Conserto:** `git diff --name-status -M` (origem E destino), acrescentar ao `REDE` os arquivos
acima, e um portão que conta os testes de `test/` e reprova se o número cair sem registro.

---

## 83 — O gatilho do historiador casa a DECLARAÇÃO do glossário, nunca o CONTEÚDO — plantao (caça de gap, 24/08)

`ferramentas/integrar.js:88`:
```js
if (/^[+-].*(EPOCAS|GLOSSARIO|LINHA_TEMPO|FONTES)\b/m.test(diffJogo)) exigidos.add('historiador');
```
Casa **3 de 1.056 linhas** do bloco `GLOSSARIO` — a linha da declaração, nunca o texto dos
verbetes. **Provado ao vivo:** um ramo que muda o texto de um verbete (`d: "…"`) exige só `qa`,
zero historiador. E o texto do verbete é exatamente a **afirmação histórica** que o §2 e a
licença de revisão de 19/08 mandam revisar por quem tem lugar de fala.

**Conserto:** exigir historiador por **faixa de linhas** (do `const GLOSSARIO` até o fecho do
bloco), não por token na linha mudada. É irmão do gatilho do glossário no dashboard.

---

## 84 — O lock entre máquinas não trava 7 de 46 itens (território STRING) e depende de 2 campos que 0 itens têm — plantao/seguranca (caça de gap, 24/08)

`.claude/hooks/lock-maquina.js:74` só lê `territorio` **array**. No `backlog.json`: **23 array,
7 string, 16 sem campo.** Para os 7 string, `terr = []`, `quemTrava` devolve `null`. E o
`test/guarda-lock.js` alimenta **array** — o teste defende a forma que a mesa não escreve.

Os 7: `rotulo-medicao-anonima`, `dashboard-sem-google`, `recusa-por-desenho-tem-nome`,
`perda-de-resposta-deixa-rastro`, `endurecer-portoes`, `contato-placeholder`, `ler-a-medicao`.

**E o lock inteiro depende de dois campos que ninguém preenche:** `maquina` e `desde` estão em
**0 de 46** itens. Sem eles `quemTrava` devolve `null` por construção — a trava está de pé e não
sustenta caso nenhum, exatamente como em 23/08. Some a isso o caminho "arquivo ainda não existe →
não trava": o comentário diz "o git funde sozinho", mas duas criações do mesmo caminho é conflito
**add/add**, que o git **não** funde.

**Conserto:** normalizar `territorio` (string→lista, e AVISAR na forma não reconhecida em vez de
virar `[]`); o teste passar a alimentar as duas formas.

---

## 85 — 60 de 147 testes não conseguem reprovar, e um deles é citado como PROVA — qa (caça de gap, 24/08)

Recontagem (o instrumento se corrigiu no caminho: a 1ª varredura deu 79 e errava, porque
`process.exit(cond?1:0)` não casa `process.exit(1`): **82 podem reprovar · 5 só se explodirem ·
60 não têm exit≠0 nem throw.** É 56% capaz de reprovar, contra 47% do inventário anterior — o
número melhorou, mas os piores continuam de pé:

1. **`test/peso-file-fetch.js`** — o `CLAUDE.md` §6 o cita como **a prova** de que `file://`
   quebra o `fetch`. Ele imprime "ok 200" ou "ERRO" e sai 0 nos dois. **Hoje sai 1 pelo motivo
   errado** (o protótipo em `os.tmpdir()` sumiu e o `goto` estoura). Vermelho que não significa nada.
2. **`test/medir-cinco-minutos.js`** — o termômetro do "divertido". Não reprova.
3. **`test/medir-arco.js`** — o que já anunciou um arco de 400 h (lição 2.9). Um número errado
   entra no `NOTES.md` como fato.
4. **`test/medir-caminho-glossario.js`** — o caminho do "64% do texto atrás de um botão". Não reprova.
5. **`test/medir-renda-passiva.js`** e os `qa-*` — nome de portão, comportamento de impressora.

**Papelada morta:** `CLAUDE.md`/`EQUIPE.md` citam `test/tmp-casar.js`, que **não existe** (é
`tmp-*`, gitignored). Referência morta num documento que é lei.

---

## 86 — Nenhum portão roda no caminho do Bash a não ser o guarda, e o vercel.json ninguém audita — plantao (caça de gap, 24/08)

Fechei o furo do guarda (o Bash entrou no matcher, 24/08), mas o gap-check do QA deixou dois
pontos que não são do guarda:

- **`TERRITORIO.md` não tem régua.** `guarda.js` sai 0 se o arquivo sumir; a zona do dono rende
  hoje **22 símbolos + 6 seletores**, e nenhum teste cobra esse número. O gerador
  (`ferramentas/gerar-territorio.js`) está no território de um item `livre` — um bug nele apaga a
  trava do dono **em silêncio**.
- **A porta que a `main` publica não é lida por teste nenhum:** `vercel.json` (item 82) não tem
  portão que confira que os cabeçalhos de segurança do `/dashboard` continuam lá.

---

## 87 — Mudar texto de glossário no jogo dessincroniza o espelho no banco, e nada lembra — plantao/dev-dados (24/08)

**Aconteceu e deixou a main vermelha.** O historiador enriqueceu o verbete LEI DE TERRAS em
`src/jogo.ts`; o portão `conteudo-conferir.js` (o "espelho do conteúdo") reprovou porque a tabela
`conteudo_glossario` no banco ficou com o texto antigo. Duas verdades divergindo — exatamente o
que esse portão existe para pegar. Consertado à mão (fechar rev vigente, inserir rev+1 via MCP,
`conteudo:puxar`, `conteudo:conferir` verde), mas **o defeito é de processo, não pontual.**

O funil já exige `historiador` quando o diff toca a faixa do `GLOSSARIO` (PENDENTES 83, feito).
Falta o **par disso**: quando um diff toca `GLOSSARIO`/`EPOCAS`/`FONTES` em `src/jogo.ts`, o funil
deveria **exigir também o passo de espelho** — ou pelo menos AVISAR "o banco precisa de rev+1;
rode `conteudo:puxar` e atualize a linha vigente antes de integrar". Sem isso, toda edição de
glossário no jogo é uma bomba-relógio de CI vermelho para quem integrar depois.

**Conserto proposto:** no `integrar.js`, quando o diff casar a faixa do glossário, acrescentar um
gatilho `espelho` (ou uma checagem que roda `conteudo:conferir` e exige verde) — o mesmo padrão
"pedir vira garantir" dos outros portões. Território: `ferramentas/integrar.js` + talvez
`conteudo-conferir.js`.

### ✅ FEITO — e a descoberta é que **já estava feito** (31/08)

O conserto proposto **está no `integrar.js`**, em `ferramentas/integrar.js:195-200`, com o
comentário citando este item por número: *"PENDENTES 87: editar o glossario no jogo
dessincroniza o espelho no banco… o funil roda o espelho e REVERTE se divergir"*. A condição é
exatamente a proposta acima (`if (exigidos.has('historiador')) portao('espelho do conteudo',
'npm', ['run', 'conteudo:conferir'], 3)`) — o mesmo gatilho que já exige o historiador.

Conferido por medição em 31/08, e não por leitura: `npm run conteudo:conferir` na `main` sai
**0**, com `JOGO` e `BANCO` em **181 verbetes · 17 grupos · 644 pares** e o **mesmo hash**
(`1b97fe85…`). O item ficou aberto por dias descrevendo trabalho concluído — que é a doença que
o `PLANTAO.md` §5 nomeia: *backlog que diz "livre" para item feito é a mesma doença que a casa
caça nos portões, no lugar exato onde se decide o que despachar.*

---

## 88 — DEZ portões lançavam o Chromium NUS, e `npm test` saía 1 DEPOIS de o smoke dizer PASS — plantao (31/08)

**Achado e consertado em 31/08**, e ele é da família que este repositório mais teme: o portão
que mede a coisa errada, ou não mede coisa nenhuma, sem ninguém perceber.

### O que era

Este repositório tem **118 lugares** que abrem um Chromium (contados no CÓDIGO, com comentário
fora — a primeira contagem, por `grep` de arquivo, disse 125 e estava inflada por prosa que cita
a chamada). O `smoke.js` e o `encaixe.js` passam `executablePath` — e cada arquivo que acertava
carregava a **sua própria cópia** da função que resolve esse caminho. **Antes desta sessão: 60
vestidos e 58 nus. Depois: 71 e 47** — e nenhum dos 47 que sobram é portão do CI ou do ciclo.

Onde a máquina roda `npx playwright install`, nu e vestido dão no mesmo — é por isso que isto
sobreviveu meses, e é por isso que **o CI nunca acusou**: o `teste.yml` instala o navegador.
Onde o navegador vem **provisionado numa build diferente** da que o Playwright espera (uma
máquina de nuvem; qualquer máquina cujo Playwright subiu de versão sem reinstalar o navegador),
o lançamento nu morre — e a mensagem manda **instalar navegador**, quando o navegador está no
disco e o que falta é dizer onde.

### O estrago, medido

| | |
|---|---|
| `chromium.launch()` nu, nesta máquina | **FALHA** — `Executable doesn't exist at …chromium_headless_shell-1234…` |
| `chromium.launch({ executablePath: … })` | **OK — Chromium 141.0.7390.37** |
| `npm test` | **EXIT 1** — e **não** no smoke, que imprimiu `PASS — no errors`; morria depois, no `regua-larga.js` |
| portões do ciclo do plantão | **2 dos 4** mortos: `medir-save-hostil.js` e `medir-telas-altura.js` |
| portão do funil para diff de glossário | `conteudo-espelho.js` morto — um diff de texto histórico seria revertido por falta de navegador, com a mensagem dizendo que o banco divergiu |

**A armadilha de leitura, e ela quase me pegou:** o smoke imprime `PASS — no errors` e o
`npm test` continua depois dele. Quem julgar pela última linha do log do smoke lê PASS e empurra
com o `npm test` vermelho. Foi exatamente o que eu fiz na primeira medição desta sessão — julguei
por um resumo em vez do exit code, e o resumo mentia por construção.

### O que ficou

- **Uma definição canônica**, exportada de `test/abrir.js` (`ABRIR.chromiumPath()`) — o módulo que
  os instrumentos já carregam. Sem `PW_CHROMIUM` e sem `/opt/pw-browsers/chromium` ela devolve
  `undefined`, que é o lançamento nu: **numa máquina que instalou o navegador, nada muda.**
- **Dez portões vestidos:** `regua-larga`, `medir-save-hostil`, `medir-telas-altura`,
  `medir-porta-secao`, `fila-auth`, `caminhos-do-backlog`, `medir-plataforma-chrome`,
  `medir-leitura-secao`, `medir-paginas`, `ferramentas/conteudo-espelho.js`, mais o
  `ferramentas/cartao-secao.js` que o próprio portão novo achou.
- **`test/portao-navegador.js`** — estático, ~40 ms, no CI antes do navegador (é o único passo que
  ainda funciona quando o navegador é o problema). A lista de portões é **derivada** do
  `teste.yml` e do `package.json` mais um nível de `require` local — lista chumbada envelhece em
  silêncio, e é assim que ele alcança o `conteudo-espelho.js`, que ninguém chama direto.
- **O autoteste** (`--autoteste`) injeta um lançamento nu num portão real, exige exit 1 apontando
  para ele, e restaura. Visto morder: `nus: 0 → 1 (pegou medir-save-hostil) → 0`.

### E dois achados de brinde, os dois do próprio instrumento contra ele mesmo

1. **`ferramentas/conteudo-espelho.js` era BINÁRIO para o git.** Dois bytes **NUL literais**,
   escritos como o caractere de verdade em vez do escape, dentro de um `join()`. Efeito:
   `git diff` não mostrava nada e todo grep do repositório o pulava (*"binary file matches"*).
   Num portão do funil isso é sério — a correção acima entraria **invisível na revisão**.
   Trocados pela sequência de escape: o arquivo voltou a ser texto, e a prova de que o valor não
   mudou é o **hash do espelho, idêntico** antes e depois.
2. **A segunda versão do portão errava para o lado perigoso, e vale guardar a lição.** Para não
   tropeçar em prosa, ela apagava comentário **e string** antes de varrer. Um scanner que não
   conhece literal de expressão regular lê o `"` de `.replace(/"/g, …)` (`cartao-secao.js:102`)
   como abertura de string e **engole as 50 linhas seguintes** — entre elas o lançamento nu da
   121. O portão foi de *"3 achados, 2 falsos"* para **"0 achados, VERDE"**, escondendo um defeito
   real. A versão final **não toca em string nenhuma**: só comentário, com `//` valendo como
   início só quando não vem depois de `:` (preserva `http://`). **Falso positivo é barulhento e se
   conserta; falso negativo é mudo e assina o verde.**

### ⚠ O AMBIENTE MUDOU NO MEIO DA SESSÃO — leia isto antes de concluir que o item é fantasia

Horas depois, o QA mediu o mesmo lançamento nu e ele **funcionou**. Não é contradição, e a
explicação está no disco: `/opt/pw-browsers` ganhou `chromium_headless_shell-1234` **durante a
sessão** (algum agente rodou `npx playwright install`). Antes disso a pasta tinha só a build
**1194**, e o `playwright` que o `npm install` resolve hoje é **1.62.1**, que pede a **1234**.

**Então o defeito é estrutural e volta em toda máquina nova:** a imagem traz 1194, o
`package.json` pede `playwright ^1.47`, o `npm install` não baixa navegador, e o lançamento nu
morre até alguém instalar à mão. A medição original está no log desta sessão e não é reconstrução:
`Executable doesn't exist at …/chromium_headless_shell-1234/…` e `npm test` **EXIT 1** em
`test/regua-larga.js:70`.

**E o conserto custa zero onde o nu já funciona** — medido pelo QA com o disco mentido
(`existsSync` negando os dois candidatos): `chromiumPath()` devolve `undefined` e
`launch({ executablePath: undefined })` abre o **mesmo Chromium 141.0.7390.37** do lançamento nu.

### O que NÃO foi feito, de propósito

Sobram **47 lançamentos nus em 46 arquivos** que **não são portão** — ferramentas de arte
(`inline-*.js`, `converter-*.js`, `cortar-*.js`), sondas e medições de mão. Elas quebram do mesmo
jeito nesta classe de máquina, e cada uma custa uma linha. **Não entraram neste lote** para não
misturar 62 arquivos com a mudança que precisa ser revisada; e o portão novo **não as cobra**,
porque cobrar o que ninguém roda no CI transforma o vermelho em ruído. Quem for mexer numa delas
e topar com o erro do Playwright: o conserto é `executablePath: ABRIR.chromiumPath()`, e a função
já existe.

---

## 89 — O `encaixe.js` reprovava um jogo PERFEITO quando a rede de quem roda recusa o host da medição — plantao (31/08)

**Achado e consertado em 31/08**, e ele é irmão do 88: mesma classe (o portão reprova por causa
do ambiente, não do produto), descoberto na mesma sessão, mas por outra porta.

### O que acontecia

Numa máquina cujo proxy recusa `us.i.posthog.com` — que é o caso da máquina de nuvem onde a
rotina do plantão roda —, o jogo abre, roda inteiro e não perde nada. O Chromium, porém, escreve
no console uma linha por pedido recusado, e o coletor global do `encaixe.js` empilhava todas:

```
---- ERROS DE CONSOLE
CONSOLE: Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED   (×8)
FALHOU em 1 asserção(ões)
```

**Medido na `main` LIMPA, sem uma linha de mudança** (com `git stash` e o `encaixe.js` da própria
`main`): **EXIT 1**. Não era regressão de ninguém — estava assim para qualquer máquina desta
classe, e o portão está no CI e no ciclo do plantão.

### O que torna isto um defeito do PORTÃO, e não uma regra nova

**A casa já tinha decidido, por escrito, semanas antes** — e num outro coletor do MESMO arquivo.
O bloco da medição (procure `posthog|Failed to load resource` no `encaixe.js`) diz:

> *"Pedido de rede que o NAVEGADOR recusou não é defeito do jogo — é exatamente o que este bloco
> está encenando, e um adblock de verdade escreve a mesma linha."*

**Dois coletores da mesma coisa, um com o critério e outro sem.** É o `PENDENTES 68` visto do
outro lado: lá o problema era a régua e o regulado compartilharem a suposição; aqui é a mesma
régua aplicada num lugar e esquecida no outro. E o `CLAUDE.md` §3.2 afirma que a medição cair não
custa nada ao jogo (*"adblock, servidor mudo, 503 — medido: zero erro, zero espera"*) — a recusa
no nível do túnel é um **quarto** modo de falha, que ninguém tinha medido, e nele o Chromium
escreve no console de qualquer jeito, com ou sem `catch` no jogo.

### O conserto, e por que ele é ESTREITO

O coletor global passou a calar **um host e uma frase**, e nada além:

- o host sai da constante **única** (`MEDIDA_HOST`, de `ferramentas/medir-secao.js`) — a mesma que
  alimenta a CSP e o build. Escrever `posthog` à mão ali criaria a segunda cópia que o §3.2
  existe para não ter;
- a URL vem de `m.location().url`, e **que ela chega foi medido, não suposto**:
  `https://us.i.posthog.com/i/v0/e/` com `net::ERR_TUNNEL_CONNECTION_FAILED`;
- ele **não** cala `Failed to load resource` em geral — isso engoliria um `pack-*.json` que some,
  que é defeito real e dos caros (o capítulo roda com a arte errada, sem erro nenhum).

### A prova de que continua mordendo, nos dois sentidos

Controle escrito e rodado antes de aceitar o verde:

| cena | esperado | medido |
|---|---|---|
| A · a rede nega o host da medição | o filtro engola | engolidos 1 · **passaram 0** ✔ |
| B · um recurso do jogo some (404) | o filtro deixe passar | engolidos 1 · **passaram 1** ✔ — `Failed to load resource: 404` com a URL `127.0.0.1:8343/nao-existe-controle-do-filtro.json` |
| C · a medição falha por culpa do JOGO (CSP) | o filtro deixe passar | **passou** ✔ — `Refused to connect… violates the Content Security Policy` |
| D · erro de console **sem url** de recurso | o filtro deixe passar | **passou** ✔ (`url.indexOf(...) === 0` é falso para `''`) |

As cenas C e D respondem a pergunta certa sobre um filtro que depende de `m.location().url`:
**ele cala a rede de quem RODA, nunca a culpa do jogo.** Se a medição um dia falhar porque a CSP
está errada ou o endereço está malformado, o portão continua acusando — foi medido, não deduzido.

**E a cena C só valeu na segunda tentativa, que é a lição:** a primeira disparava o `fetch` por
`addInitScript`, que roda **antes de o `<head>` ser lido** — a meta da CSP ainda não existe, o
pedido sai sem política nenhuma e volta como falha de rede. A sonda media o próprio artefato e
teria registrado *"a CSP não bloqueia"*, que é um susto de segurança falso. Disparado **depois da
carga**, o Chromium recusa como deve.

Depois: `node test/encaixe.js` → **EXIT 0**, e o bloco ERROS DE CONSOLE imprime **`(nenhum)`** —
ou seja, o filtro não estava escondendo mais nada junto.

**E a primeira versão do controle não provava nada, o que é a lição a guardar:** a cena B negava
`**/pack-*.json` e media zero — não porque o filtro engolisse, mas porque **no menu o jogo nunca
pede pacote nenhum** (a arte do capítulo 1 é embutida; pacote só na chegada do capítulo 2+).
Instrumento que não percorre o caminho da pessoa mede o próprio silêncio e assina verde.

### ⚠ O QA DERRUBOU A PRIMEIRA VERSÃO DESTE FILTRO, E ELE TINHA RAZÃO (31/08)

Registrado com destaque porque **é o achado mais valioso da noite**, e foi contra o autor: eu
achei o defeito, escrevi o conserto, escrevi o portão que o vigia e escrevi o controle que diz
que o portão morde. O QA de lote foi mandado justamente para desconfiar disso, e achou.

**O buraco:** o Chromium usa a MESMA frase — `Failed to load resource` — para duas coisas opostas:

| o que o navegador diz | o que significa | de quem é a culpa |
|---|---|---|
| `net::ERR_…` | **não cheguei lá** | da rede de quem roda (proxy, adblock, servidor mudo) |
| `the server responded with a status of 404` / `400` | **cheguei, e levei um não** | **do jogo** — endereço malformado, payload inválido |

A primeira versão filtrava por `/Failed to load resource/` e engolia as duas. Ou seja: com a
promessa escrita de calar *"só quando o próprio Chromium diz que não conseguiu buscá-lo"*, ela
calava também o 404 do próprio endereço da medição.

**E isso é grave por uma razão que o `CLAUDE.md` §3.2 já tinha escrito**, sobre errar o endereço
da medição: *"errar nela falha em SILÊNCIO: os dois endereços respondem 200 OK a qualquer chave,
e o sintoma seria um painel vazio semanas depois"*. O caminho errado (contra a região errada) é o
que ainda dava sinal — um 4xx. **O filtro tirava o único sinal que sobrava.**

**O conserto é uma linha:** `/Failed to load resource: net::ERR_/`. Aplicado, e verificado nos
dois sentidos por medição própria:

- com o buraco de volta: `test/filtro-console-controle.js` → **exit 1**, apontando `D` e `E`
  (*"a MEDIÇÃO responde 404 / 400 — culpa do jogo"*) e passando as outras quatro;
- com o conserto: **exit 0**, seis cenas certas.

### O controle virou PERMANENTE e está no CI

`test/filtro-console-controle.js` (escrito pelo QA, 227 linhas) roda as seis cenas **no jogo de
verdade, com a CSP de verdade**: A proxy recusa a medição (engole) · B `pack-*.json` do jogo some
(acusa) · C CSP barra host não autorizado (acusa) · D medição responde 404 (acusa) · E medição
responde 400 (acusa) · F `console.error()` do jogo (acusa). Mais duas verificações de borda: erro
**sem url** continua acusando (o `|| ''` não virou curinga) e erro que não é `Failed to load
resource` continua acusando **mesmo no host da medição**.

**A lição, e ela não é sobre este filtro:** quem escreve o conserto não pode ser o único a
escrever o controle dele. O meu controle temporário testava duas direções e as duas passavam — e
o buraco estava numa terceira que eu não imaginei, porque quem imaginou o conserto imagina as
mesmas cenas duas vezes.

---

## 90 — TRÊS VERBETES DE GLOSSÁRIO PRONTOS E NÃO INTEGRADOS: o passo de banco e uma aspa sem página — plantao/historiador/dev-dados (31/08)

**O texto está escrito, com fonte, e passou pelo QA. O que segura é mecânica de banco e uma
citação — nenhum dos dois é opinião.**

**Onde a entrega está:** ramo **`entrega/glossario-substancia`** no remoto (empurrado em 31/08
justamente para não morrer com o contêiner — worktree de agente é efêmero e ramo local não
sobrevive). O diff é de dois arquivos: `src/jogo.ts` (o bloco `GLOSSARIO`) e `NOTES.md`.

Os três fecham o item `glossario-substancia-descolonial` do backlog (que tinha **1 de 4** feito,
a LEI DE TERRAS):

| verbete | o que ele mostra | fonte principal |
|---|---|---|
| **ECONOMIA DO OURO** | o ouro de Minas atravessa Portugal e paga indústria fora daqui, pelo Tratado de Methuen (1703) | Virgílio Noya Pinto, 1979 · Laura de Mello e Souza, 1982 · Arquivo Nacional/MAPA |
| **A CONTA DA ESCRAVIDÃO** | 1833: o Parlamento britânico indeniza **quem constava como dono**; quem foi escravizado não recebeu nada — e a Lei nº 3.353 de 1888 também não previu nada | Eric Williams, 1944 · Legacies of British Slavery (UCL) · Slavery Abolition Act 1833 · Abdias do Nascimento, 1978 |
| **CRITÉRIO BRASIL** | a régua de "classe" mede **posse de bens e consumo**, não renda nem patrimônio | ABEP, o próprio critério |

Eles cumprem a linha editorial de 24/08 sem escorregar: a tese de Williams entra **atribuída**
(`dv: 1`), não afirmada na voz do jogo; "propriedade" vai entre aspas como vocabulário de quem
indenizou; e um número que ficaria bonito — a história de que o contribuinte britânico só terminou
de pagar em 2015 — **ficou de fora** porque o Tesouro respondeu, em pedido de acesso à informação
de 2018, que não tem registro de quanto do empréstimo de 1833 seguia em aberto. Recusar número sem
documento que o feche é exatamente o §2 funcionando.

### O que trava, medido

**(1) ⛔ O ESPELHO DO CONTEÚDO.** `npm run conteudo:conferir` sai **1** com os três dentro:

```
JOGO  : 184 verbetes · 17 grupos · 661 pares · f2917388…
BANCO : 181 verbetes · 17 grupos · 644 pares · 1b97fe85…
DIVERGE — 24 diferença(s) em 24 chave(s)
```

Controle rodado pelo QA (`git checkout main -- src/jogo.ts` + build): **exit 0**, `181/17/644`,
hash idêntico. A vermelhidão é dos verbetes e de mais nada. Esse passo é **portão do CI sem
`continue-on-error`** e é portão do funil (PENDENTES 87): integrar sem aplicar o `rev+1` no banco
**na mesma operação** deixa a `main` vermelha no ar.

**O trabalho é do `dev-dados` e não é grande, mas não é digitação:** 3 `INSERT` em
`conteudo_glossario` (`rev` 1, `estado` publicado, `vigente_ate` null) **mais o deslocamento de
`ordem`** dos verbetes que vêm depois de ECONOMIA DO OURO no grupo dele — os outros dois fecham
grupo e não deslocam ninguém. **A verificação é byte-exata e decide sozinha:** aplicar,
`npm run conteudo:puxar`, `conteudo:conferir`; hash igual dos dois lados ou reverter.

**Por que não fiz nesta sessão:** o plantão rodou sem ninguém acordado, e a operação escreve na
base de conteúdo do dono. Ela é reversível e verificável, mas o custo de errá-la de madrugada é o
histórico de revisão do acervo — e o `tag_s2` dos 181 verbetes, que foi um item inteiro de
backlog, mora nessas linhas. Recarregar do zero pelo `conteudo-carga.js` **apagaria** esse
trabalho: não é o caminho.

**(2) A ASPA SEM PÁGINA, e é do historiador.** A frase *"os ingleses absorviam quase 60%, somente
com o comércio lícito"* entra **entre aspas**, atribuída a um livro impresso de 1979, **sem número
de página**, e foi verificada só por busca — o proxy desta máquina responde **403 ao CONNECT** em
todos os hosts de fonte (`legislation.gov.uk`, `ucl.ac.uk`, `planalto.gov.br`, `abep.org`), então
**nenhum documento primário foi aberto nesta sessão**, nem pelo historiador nem pelo QA.

O placar de 21/08 registra exatamente este defeito nesta casa: *aspas que citavam frase inexistente
— paráfrase dentro de aspas*. **Duas saídas, as duas honestas:** o historiador fecha com página, ou
a frase vira paráfrase sem aspas. O número (`876.629 kg`) pode ficar como está — vem atribuído e o
próprio verbete diz que é estimativa.

**(3) Duas dívidas de validade** (`vence_em`, a pergunta "quando isto vence?" do CLAUDE.md §8): a
tabela de corte do Critério Brasil é **revista todo ano** pela ABEP e o verbete cita só "versão em
vigor desde 2015"; e *"a estimativa mais usada pelos historiadores"* é uma afirmação **sobre a
historiografia**, sem fonte própria.

**(4) §2, e já está com o dono:** a entrada ou não de Clóvis Moura na linha de fonte — a editora
carrega selo de corrente, e a linha editorial de 24/08 manda minerar a substância e recusar o
dicionário de corrente. Encaminhada pelo próprio autor; ninguém decidiu sozinho.

---

## 91 — O que o QA de lote deixou nomeado e ninguém está olhando (31/08)

Nenhum bloqueou entrega; cada um tem número.

1. **Seis lançamentos de Chromium nus em `ferramentas/gerar-*.js`** (`gerar-fontes`,
   `gerar-glossario`, `gerar-historia`, `gerar-porta`, `gerar-territorio` ×2). Estão **fora do
   alcance do `portao-navegador.js` por desenho** — não são portões. Mas são **a esteira que
   publica as cinco páginas da plataforma**: na classe de máquina do `PENDENTES 88` elas morrem e
   as páginas ficam velhas **em silêncio**. Nas palavras do QA: *"o portão está certo no escopo que
   declarou; o escopo é que tem buraco."* **Não consertei porque `ferramentas/gerar-*.js` é
   território declarado da outra máquina** — o conserto é uma linha por arquivo,
   `executablePath: ABRIR.chromiumPath()`, e a função já existe.
2. **`ferramentas/conteudo-*.js` e `gerar-glossario.js` afirmam "181 verbetes" e "644 pares" em
   comentário** — números que, com o item 90 aplicado, passam a ser 184/661. Comentário que
   envelhece é como a próxima sessão herda um fato falso.
3. **`test/medir-nos-indexados.js` não está em portão nenhum.** Nasceu como diagnóstico de uma
   pergunta já respondida; sem dono, vira arquivo morto na próxima varredura de código.
4. **O bloco 33(e) do `encaixe.js` deixa o estado global mais sujo do que achou** — `R.dias` 2 → 60
   e `S.fronteira` `CAP_GENTE` → 0 para os 20+ blocos seguintes. Empiricamente inofensivo (o
   encaixe sai 0), mas envenenamento de estado sequencial **já custou sessão nesta casa** — foi a
   causa do `PENDENTES 13`, e ninguém compara o log NUMÉRICO do encaixe antes e depois de uma
   mudança dessas: só o exit code responde por isso.

---

## 92 — O `portao-navegador.js` diz VERDE sobre arquivos que ele nunca chega a ler — plantao/pre-integrador (01/09)

**É um portão que mente de verde, que é a classe que esta casa mais teme** — e ele foi achado
pelo pré-integrador rodando **depois** de um conserto, não antes, que é exatamente a regra do
`PLANTAO.md` §8 pagando por si mesma.

### O que é

`test/portao-navegador.js` existe para garantir que nenhum portão lance o Chromium **nu** (sem
`executablePath`) — o defeito do `PENDENTES 88`. Para isso ele varre os arquivos e, antes de
procurar `chromium.launch`, tira os comentários com `semComentarios()` (linhas ~158-171).

`semComentarios()` procura `/*` **no texto bruto, sem entender strings**. E
`test/rodape-verdadeiro.js` usa `'/**'` — o curinga de rota do Express — **seis vezes**
(linhas 243, 251-253, 679, 685). O parser lê o `/*` de dentro dessa string como abertura de
comentário de bloco, não acha um `*/` por perto, e **engole tudo até o próximo `*/` legítimo
do arquivo**, inclusive o `chromium.launch()` real da linha 368.

Prova isolada, fora do arquivo real:

```js
semComentarios("await pag.route(base + '/**', r => {});\nconst nav = await chromium.launch();\n")
// -> "await pag.route(base + '               \n                                    \n  "
```

### O estrago, medido

Reinjetado o lançamento nu em `test/rodape-verdadeiro.js` e rodado o portão que deveria pegá-lo:

```
portões derivados: 25 · com os requires locais: 32
VERDE — todo portão diz onde o Chromium está.
EXIT_COM_DEFEITO=0        <- deveria ser 1
```

**Não são só este arquivo.** Varridos todos os `test/*.js`, comparando quantas ocorrências de
`chromium.launch` existem no texto contra quantas sobrevivem ao `semComentarios()`: **8
arquivos hoje no alcance do portão têm pelo menos uma ocorrência inteiramente engolida** —
`test/abrir.js`, `test/caminhos-do-backlog.js`, `test/fila-auth.js`,
`test/medir-leitura-secao.js`, `test/medir-paginas.js`, `test/medir-plataforma-chrome.js`,
`test/rodape-verdadeiro.js` e **o próprio `test/portao-navegador.js`**.

### Por que o autoteste não salvou

O `--autoteste` embutido sai verde e diz *"o portão morde e solta"*. Ele injeta **sempre no
mesmo arquivo-cobaia** (`test/medir-save-hostil.js`), que não tem o padrão `'/**'`. Então ele
prova que a varredura morde **naquele caso** e dá confiança de que morde em geral. É o aviso do
`CLAUDE.md` sobre controle que morde sozinho mas não morde no conjunto, com número: **1 cobaia
fixa contra 8 arquivos cegos.**

### A correção honesta de uma afirmação que foi para a `main`

O commit `532a9e7` diz, na mensagem, que o `rodape-verdadeiro.js` foi *"amarrado também em
`test/portao-navegador.js`"* e ficou *"vigiado por ele"*. **A primeira metade é verdadeira e a
segunda é falsa:** a linha `fontes.push('node test/rodape-verdadeiro.js')` está lá e está
correta, mas o arquivo **não é vigiado**, porque a mesma string que o faz funcionar (`'/**'`) é
a que o torna invisível ao scanner. Fica registrado aqui porque afirmação que o objeto não
cumpre é precisamente o que esta casa caça — e ela entrou na `main` dentro de uma entrega boa,
que é como esse tipo de coisa costuma entrar.

O que **é** verdade e foi medido: `node test/rodape-verdadeiro.js` roda **15/15 cenas, exit 0,
limpo, sem preload nenhum** nesta máquina. O `chromium.launch()` dele deixou de ser nu de
verdade. O que não existe é a vigilância contra ele voltar a ser.

### O conserto

`semComentarios()` precisa pular literais de string (`'...'` e `"..."`) ao procurar `//` e
`/*`. Não precisa ser parser JS completo — reconhecer as duas aspas e pular o conteúdo basta.

**Aceite:** com o conserto, reinjetar `chromium.launch()` nu em `test/rodape-verdadeiro.js` e
o portão sair **exit 1**; e o `--autoteste` deixar de ter cobaia única — que ele injete também
num arquivo com `'/**'`, senão o próximo buraco desta forma volta a passar. Rodar a varredura
nos 8 arquivos e reportar o número novo de engolidos (esperado: 0).

---

## 93 — Três PNGs rastreados sujam a árvore a cada `npm test` — plantao (01/09)

**Papercut pequeno com consequência feia**, e ninguém tinha registrado até hoje.

Rodar `npm test` regenera três capturas rastreadas pelo git e elas saem **sempre diferentes**,
sem que nada do produto tenha mudado:

| arquivo | delta |
|---|---|
| `test/E-01-nicho-e-seta.png` | 1.625.321 → 1.510.620 bytes |
| `test/B1-retorno-antes-do-menu.png` | 261.384 → 244.571 bytes |
| `test/T1-ajustes-retencao.png` | 163.367 → 163.603 bytes |

São ~400 KB de diferença binária por rodada, com **zero** significado. Medido nesta data
rodando o baseline da `main`, sem entrega nenhuma aplicada.

**Por que isso importa mais do que parece.** Toda rodada que roda a suíte — ou seja, toda
rodada — termina com a árvore suja. Aí há dois desfechos, e os dois são ruins:

1. quem não repara **commita**, e a `main` leva 400 KB de churn binário fingindo ser trabalho,
   dentro de um commit cuja mensagem fala de outra coisa;
2. quem repara **gasta atenção** desfazendo à mão, toda vez. Nesta rodada aconteceu **três
   vezes**: eu na árvore principal e os dois agentes nos worktrees deles — o `pre-integrador`
   inclusive relatou o descarte como higiene do próprio processo, sem saber que era conhecido,
   porque não era.

O risco maior é o (1) combinado com o funil: o `integrar.js` recusa worktree sujo que não seja
saída de build, e estes PNGs **não** casam com `SAIDA_BUILD` (`index.html`, `pack-*.json`,
`dist/`, `build/`). Então eles podem reprovar uma entrega boa por sujeira que a entrega não fez.

**Caminhos possíveis, e nenhum é óbvio — por isso vai para a mesa em vez de eu escolher:**
(a) tirar as três do git e gerar em pasta ignorada, se ninguém as compara entre commits;
(b) mantê-las rastreadas e **acrescentá-las ao `SAIDA_BUILD`** do `integrar.js`, o que resolve
o funil e não resolve o churn; (c) achar por que a captura não é determinística (fonte,
antialiasing, hora do dia no jogo?) e fixá-la, que é o conserto de verdade e o mais caro.

Território: `test/`, e o (b) toca `ferramentas/integrar.js`. Quem pegar: mede primeiro se
alguém de fato compara esses PNGs entre commits — se ninguém compara, o (a) é barato e fecha.

---

## 94 — `chromium.launch()` na MESMA linha de um regex com barra escapada é engolido — pre-integrador (01/09)

**Sem instância real hoje. Registrado para não ser redescoberto do zero**, que é a única razão
de este item existir.

Achado pelo `pre-integrador` auditando o conserto do PENDENTES 92 — ou seja, pelo auditor
rodando **depois** do conserto, que é o §8 do `PLANTAO.md` pagando por si mesmo pela segunda vez
no mesmo dia.

O `semComentarios()` novo entende string e fechou a classe do PENDENTES 92. Ele **não** entende
**literal de regex**. Então `/^file:\/\//i` tem, no texto bruto, duas barras adjacentes (`\/\/`)
que o varredor lê como início de comentário de linha, e o resto da linha vira espaço.

O autor do conserto declarou esse gap e mediu que **o dano fica preso àquela linha** — o
auditor confirmou byte a byte (`test/abrir.js:100` zera; 101-106 saem idênticas à entrada).
A alegação está certa.

**O que o autor não relatou, e o auditor achou com caso adversarial próprio:** se um
`chromium.launch()` estiver **na mesma linha** de um regex desses, ele é engolido — **0
detectados onde deveria haver 1**. É falso-negativo silencioso da mesma classe do 92, por vetor
diferente (regex, não string de rota).

**Por que não bloqueou a integração:** varridos `test/*.js` e `ferramentas/*.js` à procura de
uma linha real que combine `chromium.launch` com barra escapada — **não existe nenhuma hoje**.
O padrão `\/\/` dentro de regex aparece em 10 arquivos (`abrir.js`, `smoke.js`, `robusto-tudo.js`,
`percurso.js`, `medir-acolher.js`, `medir-acompanhar.js`, `medir-historia.js`, `encaixe.js`,
`duble-alcanca.js`), mas nunca compartilhando linha com um `launch`.

**Por que não foi fechado junto:** desambiguar literal de regex de divisão (`a / b`) exige olhar
o token significativo anterior — palavra-chave, identificador ou operador. É outra ordem de
trabalho que "string vs. comentário", e ninguém pediu para pagá-la hoje.

**Aceite, se alguém pegar:** o parser passa a reconhecer literal de regex; o controle é um
`chromium.launch()` nu na mesma linha de `/^file:\/\//i` fazendo o portão sair **exit 1**
(hoje sai 0). Território: `test/portao-navegador.js`.

**A régua para decidir se vale:** isto é dívida latente, não defeito ativo. Se o repositório
seguir sem nenhuma linha que junte as duas coisas, o item pode envelhecer parado sem custo —
o que **não** pode é alguém reencontrar o buraco daqui a um mês e pagar a investigação de novo.

---

## 95 — A NUVEM NÃO ALCANÇA O SUPABASE PELO `conteudo:puxar`, e isso quebra a metade de volta do espelho — plantao (01/09)

**Medido nesta data, e é estrutural como o 403 do `delete_ref`:** a máquina da nuvem não fala com
o host do Supabase por HTTP direto.

```
npm run conteudo:puxar
PUXANDO O CONTEÚDO — https://hdhqziqvrthxtgyraemk.supabase.co (chave publicável, só GET)
Error: conteudo_glossario_grupo: HTTP 403 — Host not in allowlist:
       hdhqziqvrthxtgyraemk.supabase.co. Add this host to your network egress settings.
exit 1
```

**Por que isso importa mais do que parece.** O espelho do conteúdo tem duas metades: o plantão
**escreve** no banco (via MCP, que funciona) e o `conteudo:puxar` **traz de volta** para o arquivo
versionado que o portão `conteudo:conferir` compara. A nuvem tem a ida e **não tem a volta**. Como
o funil roda `conteudo:conferir` sempre que o diff toca o glossário (PENDENTES 87), o efeito
prático é: **a nuvem consegue mexer no glossário e não consegue fechar o ciclo pelo caminho
normal.**

**O que esta rodada fez, e é contorno, não conserto.** Os três `ferramentas/conteudo/*.json` foram
**reconstruídos** a partir do banco (conteúdo do jogo recém-escrito lá; governança herdada da linha
anterior) e depois **provados contra o banco** por md5 das três tabelas, coluna por coluna,
governança inclusive — calculado dos dois lados com a mesma serialização (`to_json(col)#>>'{}'`
para timestamp, para bater a forma que o PostgREST emite):

| tabela | linhas | md5 do arquivo | md5 do banco |
|---|---:|---|---|
| `conteudo_glossario_grupo` | 17 | `e3ac32e8…` | `e3ac32e8…` |
| `conteudo_glossario` | 184 | `25b34b5c…` | `25b34b5c…` |
| `conteudo_glossario_rel` | 661 | `7b0872bd…` | `7b0872bd…` |

**Duas armadilhas pagas ao montar essa prova, e as duas valem para quem repetir:**
1. **A ordenação tem de ser `collate "C"`.** O `canonizarLinhas` do puxão ordena por unidade de
   código UTF-16; `order by chave` no Postgres usa a collation do banco e dá **outra ordem** com
   acento. Hash diferente sem uma linha de dado diferente.
2. **O primeiro hash que eu imprimi estava errado** e me fez perseguir um fantasma: eu hasheava a
   estrutura em memória, não o arquivo escrito. **Hash de prova se calcula do ARQUIVO**, que é o
   objeto que vai para o git — senão prova-se a intenção, não o resultado.

**O conserto de verdade, e é decisão de quem tem acesso ao ambiente:** ou o host entra na
allowlist de egresso da nuvem (é `GET` com chave publicável que só lê o publicado e vigente —
a mesma que o dashboard usa no navegador de qualquer pessoa), ou o `conteudo-puxar.js` ganha um
modo `--de <arquivo.json>` que aceita as linhas obtidas por outro transporte e as escreve pela
mesma forma canônica. A segunda opção é uma tarde e não depende de ninguém; a primeira é uma
linha de configuração e some com o problema.

**Enquanto nenhuma das duas existir:** a nuvem pode mexer no glossário, mas **tem de provar por
md5** e escrever a prova no commit. Reconstruir sem provar é fabricar um arquivo que parece o
banco — e o portão diria verde sobre ele, porque o portão compara o arquivo com o JOGO, nunca com
o banco.

---

## 96 — Duas lacunas de LUGAR DE FALA nos verbetes novos, e as duas são do dono — historiador/dono (01/09)

Achadas pelo `historiador` ao auditar a entrega do glossário. **Ele não as fechou sozinho, e está
certo:** a linha de fonte é visível na tela, e escolher quem narra é escolher quem representa —
§2, que é do dono.

**1. ECONOMIA DO OURO.** A frase que nomeia gente ("quem cavou foi gente africana escravizada") e
a remissão para QUILOMBO são sustentadas só por historiografia econômica branca do período (Noya
Pinto, Laura de Mello e Souza). Proposta: **Clóvis Moura, *Rebeliões da senzala: quilombos,
insurreições, guerrilhas*, Edições Zumbi, 1959.**

**O fato novo, e ele muda a premissa da decisão de 24/08:** Moura tinha ficado de fora porque a
edição corrente de outra obra dele carrega selo de corrente, e a linha editorial recusa isso. Mas
a **1ª edição desta obra, de 1959, é da Edições Zumbi** — casa que fechou três anos depois de
fundada e não carrega selo nenhum. A objeção de 24/08 não alcança esta citação.

**2. CRITÉRIO BRASIL.** A nota da entrega dizia que "fonte institucional basta, porque o verbete
não interpreta a vida de ninguém". **Não basta, e o historiador desmentiu com o próprio texto:** a
última oração do verbete — *"a régua enxerga o que a casa comprou e não enxerga o que a família
herdou"* — **é** interpretação sobre desigualdade, e hoje quem a carrega é uma fonte de mercado
publicitário (a ABEP). Proposta: **Marcelo Paixão (coord.), *Relatório Anual das Desigualdades
Raciais no Brasil 2009–2010*, LAESER/UFRJ, 2010** (economista negro, laboratório que existe para
mostrar o que os classificadores socioeconômicos escondem sobre raça e patrimônio); alternativa
**Cida Bento, *O pacto da branquitude*, 2022**.

**Os três verbetes entraram SEM esses nomes** — o texto está no ar e correto; o que falta é a
autoria com propriedade sobre a interpretação. Fechar é uma linha de `f:` em cada verbete, mais o
passo de banco.

---

## 97 — O `--sql` do espelho perdeu `fonte_revisao` na primeira versão, e o controle que eu escrevi para isso era CIRCULAR — plantao (01/09)

Registrado porque as duas metades ensinam, e a segunda ensina mais.

**O defeito.** O emissor de rev+1 herdava cinco colunas de governança e deixava `fonte_revisao`
de fora, além de carimbar `revisado_por` com o nome da máquina. Os 181 verbetes tinham
`revisado_por` = "historiador" e `fonte_revisao` = *"parecer 21/08/2026: triagem §2 dos 181
verbetes"* — que foi um item inteiro de backlog. **Quatro linhas perderam isso** antes de alguém
olhar; foram restauradas a partir do rev anterior, e o `TUMBEIRO` recuperou também o
`s2_alto aprovado pelo dono 21/08`.

E vale dizer o que o defeito ensinou sobre o modelo: **deslocar a `ordem` de um verbete não é
revisar o verbete.** Quem o revisou continua sendo quem o revisou; quem aplicou vai em
`aprovado_por`. Carimbar `revisado_por` é assinar o parecer de outra pessoa.

**A parte que vale mais: o primeiro controle não mordia.** Escrevi um autoteste que percorria
`GOVERNANCA_HERDADA` exigindo que toda coluna dali fosse herdada. Injetado o defeito real (tirar
`fonte_revisao` **daquela lista**), o autoteste saiu **exit 0** — ele deixava de procurar a coluna
**junto com** o emissor. Controle que lê a mesma variável que o defeito estraga é decoração
assinada de verde, que esta casa considera pior que teste nenhum.

**O conserto:** a lista de cobrança passou a vir do `conteudo-puxar.js`, que é **outro arquivo** e
a outra ponta do espelho — toda coluna de governança que o puxão traz do banco tem de ser herdada,
menos as sete que o emissor decide de propósito, cada uma nomeada com o motivo. Medido, com os
dois defeitos injetados um de cada vez:

| cena | exit |
|---|---|
| sem defeito | **0** |
| `fonte_revisao` fora da lista herdada | **1** — "a coluna de governança fonte_revisao não é herdada…" |
| `revisado_por` carimbado com quem aplicou | **1** — "carimba o nome de quem aplicou 2 vez(es)…" |

**A regra que sai daqui, e ela é geral:** *o controle de uma lista nunca se escreve a partir da
lista que ele controla.* Ele se escreve a partir da outra ponta — o esquema, o outro arquivo, a
outra ferramenta. Senão o teste encolhe junto com o defeito.

---

## 98 — `gerar-glossario.js` não roda nesta máquina: o lançamento nu de Chromium do PENDENTES 91 (1) agora tem número — porteiro (01/09)

O `PENDENTES 91` item 1 listou **seis** `chromium.launch()` nus em `ferramentas/gerar-*.js` e disse
que eles estão "fora do alcance do `portao-navegador.js` por desenho". Faltava a medida do custo.
Ela apareceu hoje, ao auditar a entrega do glossário: **o gerador da página pública simplesmente
não roda.** Ele tenta abrir `chromium_headless_shell-1234`, que não existe aqui; só a revisão
`1194` está instalada, e é a que o `test/smoke.js` acha por fallback explícito (`PW_CHROMIUM` /
`/opt/pw-browsers/chromium`).

**Não é regressão da entrega:** o porteiro reproduziu o mesmo erro em `origin/main`. E o contorno
que ele usou (um wrapper que só troca o `executablePath` em tempo de execução, sem tocar arquivo
do repositório) provou que, **passado o lançamento, o gerador está certo**: saiu
`glossario/index.html — 184 verbetes em 17 grupos, 341 KB`, com 184 blocos `DefinedTerm` no
JSON-LD e nenhum `181` remanescente (as duas ocorrências de "181" no HTML são o ano **18**11 do
cais, falso positivo).

**Por que isto é pior do que "ferramenta que não roda":** é a esteira que publica `/glossario`, uma
das cinco páginas da plataforma. Numa máquina onde ela morre, a página fica **velha em silêncio** —
ninguém recebe vermelho, porque nenhum portão cobre o gerador. Hoje a página do ar teria continuado
dizendo 181 enquanto o jogo diz 184.

**Aceite, e é uma linha por arquivo:** `ferramentas/gerar-*.js` passam a usar o mesmo fallback de
`executablePath` que o `test/smoke.js` já tem — a função existe, é só chamá-la. Território:
`dev-plataforma` (os `gerar-*.js` são dele).

---

## 99 — O `tag_s2` não distingue "triado e decidido que não" de "nunca triado" — qa/dev-dados (01/09)

Achado pelo `qa` ao auditar a entrega do glossário, e é do tipo que só aparece quando alguém
olha a coluna em vez do portão.

`conteudo_glossario.tag_s2` é `bool not null default false`. Então um verbete que **entra sem
ninguém triar** fica `false` — exatamente igual a um que o historiador **leu e decidiu** que não
toca o §2. Os três verbetes novos entraram assim: `tag_s2 = false` por default do esquema,
`revisado_por` e `fonte_revisao` nulos. E o critério de 21/08 é, por escrito, **"na dúvida,
true"** (176 de 181 na época). Um verbete chamado **A CONTA DA ESCRAVIDÃO** ficou marcado como
não-§2 sem que ninguém tivesse decidido isso.

**Fechado nesta rodada, para os três:** postos em `true`, com `revisado_por = historiador` e o
parecer de hoje em `fonte_revisao` (o historiador verificou §2 item a item nos três — está no
NOTES). Medido depois: **179 de 184 em `true`**, e as **5** que seguem `false` têm parecer
explícito escrito ("sem superfície de representação — mecanismo/instituição").
**Hoje nenhuma linha vigente está sem parecer.**

**O que continua aberto, e é o item:** nada IMPEDE que a próxima linha entre assim de novo. O
`values` do emissor não escreve `tag_s2` de propósito — script não dá parecer de §2, e isso está
certo (`conteudo-carga.js` §26 diz o mesmo). O buraco é o `default false` fazendo o silêncio
parecer decisão.

**Duas saídas, e a segunda é melhor:** (a) o `conteudo-vigia.js` ganha um sinal "verbete vigente
com `revisado_por` nulo" — barato, e transforma o silêncio em fila de trabalho; (b) a coluna vira
`bool null` com `default null`, e aí "não sei" tem como ser dito. (b) é a modelagem correta e
custa migração + ajuste de quem lê; (a) resolve o sintoma hoje. Território: `dev-dados`.

---

## 100 — O portão do cartão fecha os dois mutantes do 67 e 68, e uma variante de UMA LINHA passa limpa — qa/dev-plataforma (02/09)

**Achado pelo `pre-integrador` em 02/09, auditando `entrega/portao-cartao-pos-condicao` (`5908bba`)
antes do funil. A entrega NÃO foi integrada por causa disto** — o ramo continua na `origin`, e o
que falta é uma linha, não uma reescrita.

**O que a entrega alega, e a parte que é verdade.** Ela troca a cobrança de ESFORÇO ("quantos nós
eu escondi") por duas pós-condições de RESULTADO em `ferramentas/gerar-territorio.js`:
`sobrouControle` (varre `body *` e reprova elemento fixed/sticky que bata na lista paranoica) e
`alvoNomeado` (reprova se o botão continuar visível por `id` OU por `aria-label` "Medição…").
Isso funciona: os **dois mutantes exatos** do PENDENTES 67 e 68, reproduzidos com código copiado
verbatim do gerador e rodados contra a página real `territorio/index.html` já commitada, são
**recusados** — `sobrouControle: div.qaDiv @ 354,31 44x44` e `alvoNomeado: #medirBt2 escondido=false`.

**O que é falso é a frase central do commit — "não há mais caminho de volta com os dois portões
verdes".** Existe, e custa uma linha a mais que o mutante do QA: **mudar o `id` E o `aria-label`
juntos.** O `aria-label` deixa de começar com "Medição", o `id` deixa de ser o esperado, e as duas
pós-condições passam vazias:

```
exclusao escondeu: .med, .vaoMedida
estado do botao real apos exclusao: id=medirBt2 | aria-label=Contagem ligada. Toque para desligar.
  | position=static | display=flex | rect=334,31 69x44
sobrouControle: []   alvoNomeado: []
```

Com print no mesmo enquadramento 1200×630 do cartão real: a tábua **"MEDIÇÃO / ligada" volta ao
lado de "O Território"** — o defeito de 23/08 que o item 67 existe para impedir, de volta, com os
dois portões **verdes**. É a mesma doença que o 67 nomeia, num degrau acima: a pós-condição
continua reconhecendo o alvo por **como ele se chama**, e o que se chama pode ser renomeado.

**A saída, e ela decorre do próprio item 68** (*o instrumento tem de ser estritamente mais
paranoico que a coisa medida*): parar de identificar o alvo por nome e passar a cobrá-lo por
**posição e geometria** — nenhum elemento interativo dentro do recorte 1200×630 do cartão, seja
qual for o `id` ou o rótulo. Nome é atributo do autor; retângulo não é.

**Dois achados menores da mesma auditoria, para não se perderem:**
- **O CONTROLE já commitado em `test/medir-cartao-controle.js` é decoração parcial** (EQUIPE.md 2.8):
  as 4 linhas `ok` só injetam um `<button>` genérico sticky — que a lista **antiga** já pegava.
  Ele nunca exercita os mutantes específicos do 67 (span+static+id) nem do 68 (div+onclick+tabindex)
  contra a página real. A mensagem do commit descreve um wrapper de teste que **não está commitado**,
  e foi por isso que o auditor teve de reconstruí-lo para provar — e para desmentir.
- **`sobrouControle` no gerador não é byte a byte igual** ao corpo de `test/medir-cartao-controle.js`
  (falta o `|| e.id === 'medirBt'`), embora o comentário mande ser IDÊNTICO. Não achamos caminho
  explorável por causa disso — `alvoNomeado` cobre o caso —, mas é a divergência que a régua da
  própria casa reprovaria se fosse cobrada por assinatura.

**Nota de máquina, não da entrega:** `medir-cartao-controle.js` e `gerar-territorio.js` chamam
`chromium.launch()` **puro**, sem `ABRIR.chromiumPath()` — é o PENDENTES 91/98 num terceiro lugar,
pré-existente ao diff. Na nuvem isso exigiu contorno para rodar.

---

## 101 — A seção pública está 3 verbetes atrasada, e o gerador assa a fonte do host no cartão publicado — dev-plataforma/porteiro (02/09)

**Achado pela linha principal do plantão `nuvem-20260902T0823`**, ao consertar o PENDENTES 91/98
nos quatro geradores (`entrega/geradores-chromium`, `8f9eab0`). O conserto é pequeno e está
provado; **o que ele revelou ao rodar é maior que ele**, e são duas coisas independentes.

### 101a · A porta e o glossário públicos mentem o número, e é a doença de 22/08 de volta

Rodados os quatro geradores contra a `main` de hoje, a saída **diverge do que está commitado**:

| arquivo | commitado | gerado hoje |
|---|---|---|
| `glossario/index.html` (`<meta description>`, `og:description`, corpo) | **181 verbetes** | **184** |
| `plataforma/index.html` (portal + cartão) | **181 verbetes** | **184** |

Três verbetes entraram no `src/jogo.ts` e **nenhuma das duas páginas públicas foi regerada**. É
exatamente a classe de erro que criou o `gerar-porta.js` em 22/08 — *"a porta dizia 60 fontes
enquanto DE ONDE VEM já dizia 61"* —, só que agora a página envelhece mesmo sendo gerada, porque
**ninguém roda o gerador**. O portão `medir-porta-secao.js` compara porta × seção, e as duas
estão erradas **pelo mesmo número**, então ele fica verde: duas cópias que concordam entre si e
discordam da fonte.

**PROVADO por exit code, e o portão se autoincrimina.** `node test/medir-porta-secao.js` na
`main` de hoje, com o jogo em 184:

```
OK  momentos: porta=47 · historia=47
OK  verbetes: porta=181 · glossario=181
OK  fontes: porta=61 · de-onde-vem=61
OK  capítulos: porta=13 · jogo (EPOCAS)=13
porta×seção: 4/4 batem.
EXIT REAL=0
```

Ele imprime a palavra `OK` ao lado do número errado e sai **verde**, porque a única coisa que ele
compara é porta **contra** seção — nunca contra o jogo, que é a fonte. É a mesma doença do
PENDENTES 68 (*o instrumento tem de ser estritamente mais paranoico que a coisa medida*) num
lugar novo: aqui o instrumento é tão paranoico quanto duas cópias que se copiaram.

**AGRAVADO PELO PORTEIRO na mesma data, e isto é maior que o número em texto:** não são só o
`<meta description>` e o `og:description` que mentem. O **JSON-LD `DefinedTermSet`** da página
commitada tem **181 entradas `DefinedTerm`**, contadas programaticamente — ou seja, **três
verbetes reais estão ausentes dos dados estruturados indexáveis**. Crawler e rich snippet que
leem `schema.org` não têm como saber que esses três existem. O risco de SEO é de outra ordem que
"um número errado no texto", e reforça que o conserto certo é **regerar com máquina qualificada**,
não deixar a página velha no ar.

**O que falta é o gatilho, não o gerador.** Aceite sugerido: um portão que compare o número
AFIRMADO nas páginas com o EXTRAÍDO do jogo headless e reprove por exit code — a mesma disciplina
do espelho do conteúdo (PENDENTES 87), que o funil já roda quando o diff toca o glossário.

### 101b · O cartão publicado muda de tipografia conforme a máquina que o gera — trava de publicação

**Medido, com as duas imagens olhadas lado a lado** (`glossario/compartilhar.jpg`, recorte
1200×630 real): regerar nesta máquina muda o número **e a fonte**. Os três cartões encolheram
~10% em bytes — `de-onde-vem` 87.538 → 79.409, `glossario` 81.115 → 76.385, `historia` 83.486 →
74.829 —, e a comparação visual mostra por quê: **os botões da barra estreitaram, o corpo do
texto quebra em outro ponto, o peso do serifado mudou.** Não é compressão: é **substituição de
fonte**. Esta máquina não tem as fontes que a máquina que gerou os cartões commitados tinha.

**A consequência é de infraestrutura, não de estética:** o gerador de seção **não é
determinístico entre máquinas**. Qualquer uma das três que rode `gerar-*.js` publica um cartão
com a tipografia do próprio host — e o push na `main` publica sozinho, então isso chega ao
WhatsApp de quem receber o link.

**Por isso esta rodada NÃO empurrou a saída regerada**, embora o número 184 esteja certo: separar
a deriva legítima (181→184) da ilegítima (fonte trocada) exigiria uma máquina qualificada, e
esta não é. Empurrar cartão publicado a partir de máquina que renderiza diferente é a definição
de mudança externa sem sign-off (`CLAUDE.md` §8 e as travas do plantão).

**Aceite:** ou o gerador passa a **embutir a fonte** que usa (como o build já faz com a arte, e
aí qualquer máquina gera o mesmo byte), ou ele **recusa rodar** onde a fonte esperada não existe
— e nesse caso quem recusa diz qual fonte faltou. As duas saídas são cobráveis por exit code; a
terceira ("cuidado ao rodar") não é, e por isso não conta.

**A DÚVIDA CAIU NO MESMO DIA — o porteiro achou a causa, e ela responde qual renderização é a
certa.** Eu tinha escrito aqui que *"não dá para saber qual das duas é a certa"* e que descobrir
exigiria gerar nas três máquinas. Não exige. Medido por ele:

- `ferramentas/chrome-plataforma.js:28` declara `--titulo: "Palatino Linotype",Palatino,Georgia,serif`
  — **sem nenhum `@font-face`**. É fallback de fonte de sistema puro.
- Nesta máquina, `fc-list | grep -i "palatino\|georgia"` devolve **zero**, e `fc-match serif`
  devolve **DejaVu Serif**.

Logo: **a renderização da nuvem é provadamente o último recurso da cadeia, não a intenção de
design.** A commitada está mais perto do que o design pede. Isso não torna a página commitada
correta (ela ainda mente 181), mas resolve a pergunta que travava o item.

### 101c · O controle que deveria pegar isto compara texto de CSS, não o glifo pintado

**Provado ao vivo pelo porteiro, e é a lição 2.8 do `EQUIPE.md` num lugar novo.**
`ferramentas/cartao-secao.js` cobra `getComputedStyle(h1).fontFamily === CHROME.TITULO`. Mas
`getComputedStyle().fontFamily` devolve **a lista declarada no CSS**, nunca a fonte que o
navegador de fato pintou: numa `pg.setContent()` com a mesma declaração, ele devolveu a string
`"Palatino Linotype", Palatino, Georgia, serif` **intacta** — na mesma máquina que estava
pintando DejaVu Serif.

**Consequência:** esse controle **nunca reprova esta classe de defeito, em máquina nenhuma.** Ele
foi desenhado assim de propósito, para evitar um falso positivo anterior (Google Fonts
assíncrona), e supercorrigiu para o lado cego — trocou o falso positivo por cegueira total.

#### ⚠ CORREÇÃO DE 02/09 (`nuvem-20260902T1234`): não é DejaVu — o Chromium pinta **Liberation Serif**

O 101b acima diz que esta máquina renderiza **DejaVu Serif**. A metade que ele mediu está certa:
`fc-match serif` responde DejaVu mesmo — re-medido hoje. O que está errado é a **inferência**, e
ela é a que importa: o que o `fc-match` responde **não é** o que o Chromium pinta.

Medido pelo porteiro em 02/09 por **hash de bitmap** (48 px, FNV do canal alfa), que é a única
medida que olha o glifo em vez de perguntar ao sistema:

| hash / largura de avanço | quem cai nesse grupo |
|---|---|
| `d9f9577f` · 917,20 px | `serif` · a pilha do `--titulo` · a pilha do `--leitura` · Liberation Serif · Times New Roman · Tinos · Nimbus Roman · **uma família inexistente** |
| `6167a9ce` · 1123,88 px | DejaVu Serif |
| `11e38e47` · 907,15 px | FreeSerif |

A pilha do `--titulo` cai no grupo do **Liberation Serif**, não no do DejaVu. E isso **casa com o
sintoma** que o próprio 101b registrou ("os botões da barra estreitaram"): Liberation tem métrica
de Times, ~18% mais estreita — DejaVu é mais **larga** e teria alargado a barra, não estreitado.
O sintoma sempre desmentiu a causa escrita; ninguém tinha cruzado os dois.

**Duas coisas que saem daqui e valem mais que o nome da fonte:**

1. **`fc-match` não é instrumento para esta pergunta.** Ele responde pela cadeia do fontconfig do
   sistema; o Chromium tem a sua própria. Usar um para afirmar o outro é o mesmo erro de categoria
   do 101c (perguntar ao CSS o que só o pixel sabe), num lugar novo.
2. **Nesta máquina o cartão já perdia a distinção título × corpo:** `--titulo` e `--leitura` caem
   no MESMO hash. A diferença entre a voz encorpada e a de ler já estava desfeita aqui, antes de
   qualquer conserto — e nenhum controle via, porque todos perguntavam ao CSS.

**E as duas pontas se resolvem com o mesmo conserto:** embutir a fonte como `@font-face`, no
mesmo padrão que o build já usa para embutir arte em base64. Aí qualquer máquina gera o mesmo
byte **e** o controle passa a poder checar `document.fonts.check()` contra uma família que
carregou de verdade — o que hoje ele não pode fazer, porque não há `@font-face` para checar.

### 101d · Os quatro geradores consertados estão fora do alcance do portão que vigia o padrão

Achado do porteiro, **pré-existente e não regressão**: `test/portao-navegador.js` cobre 33 portões
(`exit 0`) e os quatro `gerar-*.js` ficam de fora por desenho — não são chamados pelo CI nem pelo
`package.json`, e o PENDENTES 91 já registrava isso. Fica anotado porque **nada nesta entrega
fecha o buraco**: se alguém reintroduzir `chromium.launch()` nu num desses quatro amanhã, nenhum
portão morde. É a pergunta que o PLANTAO §5 manda fazer antes de dar item por fechado — *"e o
que garante que isto não volte?"* — e a resposta hoje é: nada.
### FECHADO em 02/09 por `entrega/cartao-geometria` (dev-plataforma) — e o que a hipótese custou

**A saída proposta ("nenhum elemento interativo dentro do recorte") FOI MEDIDA E É FALSA.** Contra
a página real, depois da exclusão do gerador, há **NOVE elementos interativos legítimos** dentro do
1200x630: 4 links `a.tabua` da barra e 5 tábuas de lugar `button.pl` (União dos Palmares AL · Rio
de Janeiro RJ · Salvador BA · Santos SP · Brasília DF), todos `position:static`, todos no cartão
desde 21/08. A régua ingênua reprovaria o desenho CERTO — e régua que reprova o certo é a que
alguém afrouxa inteira na primeira vez que ela grita.

> **Este parágrafo já envelheceu, e a data dele é o mesmo dia — a nota fica de propósito.** Ao
> integrar, com a `main` de 02/09 mergeada, são **6 tábuas** na barra e a lista derivada tem
> **11 entradas**, não 4 e 9: a tábua "Jogar" entrou na barra nesta mesma data. **O código se
> ajustou sozinho** — a lista sai de `MAPA_PONTOS` extraído do jogo headless, então ela absorveu
> a tábua nova sem uma linha mudar, e é essa a prova viva de que a derivação é derivação. Só a
> **prosa** redigitou o número e envelheceu em horas. É a doença do PENDENTES 101a — número
> redigitado à mão que envelhece sozinho — aparecendo dentro do texto que a documenta.

**O que entrou no lugar, e a virada é de lado da lista:** `ferramentas/cartao-censo.js`. A régua
deixa de enumerar o que é PROIBIDO (lista de nomes, infinita, sempre um rename atrás) e passa a
enumerar o que é PERMITIDO, derivado do dado que gerou a página — os `href` E os rótulos do `<nav>`
que o `chrome-plataforma.js` escreveu, e as tábuas de lugar de `D.pontos`. Quem cai dentro do
recorte e não está na lista, reprova: **flutuando ou não, com id ou sem, com qualquer `aria-label`.**
Renomear deixou de ser fuga e virou a forma mais rápida de cair FORA da lista.

**A geometria entra duas vezes:** (1) quem é INSPECIONADO é decidido por retângulo, não por
`position` — é isso que alcança o mutante `static` do 100; (2) um permitido tem de caber na CAIXA DE
ROLAGEM do contêiner que ele diz ser dele, o que derruba o impostor que rouba identidade legítima e
se muda de lugar.

**Sete mutantes, todos vistos reprovando** (`CARTAO_MUTANTE=<nome> node ferramentas/gerar-territorio.js`,
e o mesmo conjunto no controle de `test/medir-cartao-controle.js`): `m67` `m68` `m100` mais quatro
ADVERSARIAIS escritos para derrubar a régua nova. **`m103` PASSOU na primeira versão** — apagar a
tábua "A História" e vestir o interruptor com o `href` dela —, e é por causa dele que o RÓTULO
entrou na lista junto do `href`. Mutante que já passou uma vez é a única prova de que a régua mudou
por medição e não por gosto.

**Os dois achados menores fechados junto:** o controle agora exercita os mutantes REAIS contra
`territorio/index.html` (antes era um `<button>` genérico sticky que a lista antiga já pegava), e as
duas cópias que juravam ser idênticas viraram **um `require`** — a assinatura da tabela do
instrumento passou a ser `require('./cartao-censo.js')`, que prova que os dois RODAM o mesmo código
em vez de provar que alguém escreveu as mesmas letras duas vezes.

**Os três `chromium.launch()` nus foram consertados** no mesmo ramo (`ABRIR.chromiumPath()`), e o
`test/portao-navegador.js` continua VERDE (33 arquivos no alcance).

### O QUE SOBROU, e é achado novo desta rodada

1. **`test/medir-cartao-controle.js` NÃO É RODADO POR NINGUÉM.** Não está no `npm test`, não está no
   `ferramentas/integrar.js` e não está no `.github/workflows/teste.yml` (que roda o
   `test/cartao-controle.js`, que é outro arquivo — peso e forma do `og:image`). Desde 23/08 este
   portão só rodou à mão. É a mesma doença num degrau acima do PENDENTES 100: não adianta a régua
   ser mais paranoica que a coisa medida se ninguém a lê. **Custo estimado: 31 s** (medido nesta
   máquina, com os 8 carregamentos da página 3D do censo). Território: quem manda no
   `.github/workflows/teste.yml` e no `integrar.js`.

   **FECHADO em 02/09 por nuvem-20260902T1234 (item `controle-cartao-sem-dono`).** Renomeado para
   `test/cartao-quadro-controle.js` (junto no mesmo commit, como o pré-integrador pediu — os dois
   nomes lado a lado num YAML não existem mais). Roda em dois lugares: passo novo no
   `.github/workflows/teste.yml`, logo depois de `cartao-controle.js` no job `portoes` (mesmo
   Chromium já instalado, EXIT REAL 0 em 32,48 s medido isolado); e um portão a mais no
   `ferramentas/integrar.js` (constante `CARTAO_CENSO`) quando o diff toca
   `ferramentas/gerar-territorio.js`, `ferramentas/cartao-censo.js` ou `territorio/`. As
   referências dentro de `ferramentas/gerar-territorio.js` (3 comentários) ficaram com o nome
   velho — fora do território desta entrega, outro agente nele agora — registrado como órfão
   consciente, sem efeito funcional (são prosa, não código lido).
2. **A barra do cartão continua cortando a primeira tábua.** No `compartilhar.jpg` commitado ela lê
   "istória"; regerado nesta máquina, ". História". É a mesma família do defeito de 23/08 ("comeu A
   História e deixou lossário") e **nenhum portão olha para isso** — o censo cobra QUEM está no
   quadro, não se o texto de quem está foi decepado. Piorou com a tábua "Jogar" que a `main`
   acrescentou à barra. Território: `chrome-plataforma.js` + o enquadramento do gerador.
3. **A build recusava porque a MEDIÇÃO não sai desta máquina.** Com o `chromium.launch()` nu
   consertado, o gerador passou a rodar e passou a RECUSAR — não pelo cartão, mas porque o POST
   anônimo para `MEDIDA_HOST` falha aqui: `RECUSADO: erro na página ao tirar o cartão: console:
   Failed to load resource: 404`. O §3 manda o contrário ("o jogo NUNCA depende dela"), e um JPEG
   não tem nada a ver com o evento. Consertado no mesmo ramo, e **sem afrouxar**: as URLs que
   falharam são recolhidas COM a URL, e as linhas de console de recurso (que não trazem URL) só são
   perdoadas quando TODA URL que falhou é a do host da medição. Qualquer outra volta a recusar.

### 102 · Os 4 residuais do censo do cartão (item `censo-cartao-residuais`) — o (1) fechado, os outros 3 medidos e deixados

O pré-integrador, ao APROVAR `entrega/cartao-geometria` em 02/09, mediu quatro residuais e os
declarou NÃO bloqueantes — o teto honesto da régua do censo. O aceite mandou fechar só o (1), que
era o único com print de defeito reproduzido; os outros três ficam aqui, medidos, para quem passar
por ali.

**(1) FECHADO — `ferramentas/cartao-censo.js`, função `censoDoQuadro`.** O censo só olhava para o
que é INTERATIVO (seletor + `tabindex`); uma `<div>` sem `onclick`, sem `tabindex` e sem `role`,
lendo "MEDIÇÃO ligada", colada dentro da `.barra` de verdade, nunca acionava o filtro e o censo
voltava VAZIO — o defeito visual de 23/08 reproduzido com o portão verde (print do pré-integrador).
**Não é o modo de falha do PENDENTES 100** (lá o alvo era um interruptor DE VERDADE; virá-lo `<div>`
inerte seria desfazer o botão, não fugir do censo) — aqui o cartão é uma FOTO, e o que aparece nela
não depende de ser clicável.

A régua virou DUAS PASSADAS: a primeira (inalterada) casa elementos INTERATIVOS contra a lista de
permitidos e, ao aceitar um, registra o próprio elemento (`aceitos`) e o CONTÊINER dele (`donos` —
`.barra`, `.lista`…), sempre por terem sido PROVADOS reais (um filho aceito dentro), nunca por nome.
A segunda passada varre TODOS os descendentes de cada `dono` provado e reprova quem não é um aceito
nem parte interna de um aceito — interativo ou não. Uma `.barra` ou `.lista` de MENTIRA plantada do
lado de fora não vira `dono` de graça: só convenceria a primeira passada com um link cujo `href` E
rótulo batessem com o dado real, e aí já teria caído antes.

Mutante novo, versionado junto dos outros sete em `ferramentas/cartao-censo.js` (`MUTANTES.m106`):
a `<div>` inerte, sem nenhum atributo interativo, colada na `.barra` real. `test/cartao-quadro-controle.js`
já roda os OITO contra o `territorio/index.html` commitado.

**MORDIDA PROVADA POR INJEÇÃO, com os dois EXIT CODE reais do terminal:**
- Censo com a lógica ANTIGA (uma passada só) + o mutante `m106` novo → `node
  test/cartao-quadro-controle.js` → **EXIT REAL 1**, com a linha `X CONTROLE DO CENSO m106: o censo
  RECUSA o mutante — PASSOU LIMPO, o buraco do PENDENTES 100 está aberto de novo` — reproduzindo
  exatamente o achado do pré-integrador.
- Arquivo restaurado para a lógica NOVA (duas passadas) → mesmo comando → **EXIT REAL 0**, com `ok
  CONTROLE DO CENSO m106: o censo RECUSA o mutante (dentro de um contêiner já provado do cartão, mas
  fora da lista de permitidos — não depende de ser clicável…)`.

**MEDIDA DE FALSO-POSITIVO** (o cuidado pedido: "se o censo passar a contar TUDO que tem texto, ele
pode reprovar coisa legítima"): rodado contra o `territorio/index.html` REAL de hoje, sem mutante
nenhum — únicas duas linhas que usam o censo (`territorio: o censo do quadro só achou o que a lista
de permitidos autoriza` e `CONTROLE DO CENSO sem mutante: o censo APROVA a página como está`) — as
duas **`ok`**, zero estranhos. A segunda passada não vira "todo texto reprova": ela só varre dentro
de contêineres já PROVADOS por um filho aceito, então o `h1`, o `<p class="sub">` e a caixa de
estatísticas do censo de 2022 (fora de `.barra`/`.lista`) nunca entram na varredura — medido à parte
com uma sonda descartável que listou os 20 elementos de texto visíveis no recorte antes de escrever
o conserto.

**(2) CONFIRMADO — risco zero hoje.** `querySelectorAll('body *')` não atravessa shadow DOM nem
`<iframe>`. Grep próprio, direto (não herdado do pré-integrador): `grep -c attachShadow` e `grep -ci
"<iframe"` em `ferramentas/cartao-secao.js`, `ferramentas/gerar-territorio.js`,
`ferramentas/chrome-plataforma.js` e nos QUATRO artefatos commitados (`historia/index.html`,
`glossario/index.html`, `de-onde-vem/index.html`, `territorio/index.html`) — **0 em todos**. Anotação
que fica: se algum dia entrar um `<iframe>` ou um `attachShadow` numa dessas páginas, o censo (e o
`controlesNoQuadro` do teste) para de enxergar o que está dentro — nenhum portão hoje cobra isso.

**(3) CONFIRMADO — gap real, custo de uma folha de estilo.** `innerText` não vê `::after`. Sonda:
abri `territorio/index.html`, apliquei a exclusão real, injetei só um `<style>` com
`.barra a.aqui::after { content: " ligada" }` (sem tocar o DOM do `<a>`) — `innerText` do elemento
**não mudou** (`"O Território"` antes e depois) e o censo devolveu `estranhos: []` os dois lados. A
foto real mostraria "O Território ligada"; o censo não tem como ver. Não é o modo de falha do (1)
(lá faltava INSPECIONAR o elemento; aqui o elemento É inspecionado e aceito, só o texto que ele
declara está incompleto) — por isso fica como item separado, não dobrado no mesmo conserto.

**(4) CONFIRMADO — cosmético hoje, linha e arquivo batem.** `ferramentas/gerar-territorio.js:852`:
`const doHostDaMedicao = (u) => u.indexOf(MED.MEDIDA_HOST) === 0;`, com `MEDIDA_HOST =
'https://us.i.posthog.com'` (`ferramentas/medir-secao.js:44`). Prefixo, não origem: uma URL como
`https://us.i.posthog.com.qualquercoisa/x` seria perdoada como "falha do host da medição" mesmo sem
ser. Risco hoje é mesmo cosmético — nenhum código do repositório constrói uma URL desse formato, e a
CSP (`connect-src 'self' https://us.i.posthog.com`, sem curinga) já bloqueia o navegador de tentar
qualquer host que não seja exatamente esses dois — mas é bug de classe (comparação por prefixo em
vez de origem) e o mesmo padrão poderia reaparecer em outro lugar. Troca sugerida para quando alguém
passar por ali: `new URL(u).origin === new URL(MED.MEDIDA_HOST).origin`.

**Nenhuma das quatro classificações do pré-integrador foi derrubada** — as quatro se confirmaram
como ele descreveu (o (1) real e bloqueante o bastante para ter print; os outros três reais mas sem
caminho de exploração hoje). O viés que o plantão avisou (*"entrega que ache defeito contra si mesma
é onde eu baixo a guarda"*) não achou nada mais frouxo aqui: a régua dele já era honesta.

Território tocado: só `ferramentas/cartao-censo.js` (o `test/cartao-quadro-controle.js` não precisou
de mudança — os oito mutantes já rodam pelo `Object.keys(CENSO.MUTANTES)`). Portão rodado:
`node test/cartao-quadro-controle.js`, EXIT REAL 0. `npm test` cheio rodado uma vez antes de
entregar (tokenmaxxing, PLANTAO §3.2).

---

## 102 — A linha `voo/<id>` do PROMPT AGENDADO da nuvem precisa da mão do dono — plantao (03/09)

**Isto é a única coisa que falta para fechar `marcador-voo-so-acumula`, e nenhuma sessão pode
fazê-la.** A decisão está tomada e escrita no `PLANTAO.md` §7 (03/09): a nuvem **para de criar**
marcador `voo/<id>`, porque não consegue apagá-lo (403, medido pela quinta vez, exit real 1) e
porque a saída alternativa — o coveiro `ferramentas/ramos-mortos.js`, que existe desde 02/09 —
foi pedida em **4 rodadas** do `RECADOS.md` e produziu **0 apagamentos**, enquanto os marcadores
iam de **9 para 23 em 24 h**.

**O que sobra:** o texto guardado do agendamento da nuvem ainda diz *"use ramo marcador
`voo/<id>`"*. Esse texto roda **fora do repositório** e não há sessão que o edite — nem eu, nem
agente nenhum. Enquanto ele estiver lá, cada rodada nova lê uma ordem que o `PLANTAO.md`
revoga.

**Contenção que já está no ar, e por isso isto não é urgente:** o próprio prompt manda ler o
`PLANTAO.md` **antes** de despachar, e a revogação está escrita lá em caixa alta, com a data e o
número. Uma rodada que leia como mandado não cria marcador. Foi o que esta rodada fez.

**A mão do dono, em uma linha:** apagar do prompt agendado a frase *"e use ramo marcador
voo/<id>"*. Nada mais.

**Como conferir se pegou, sem acreditar em ninguém:** `git ls-remote origin 'refs/heads/voo/*' | wc -l`
dá **23** em 03/09 08h UTC. Se as próximas rodadas da nuvem mantiverem 23 ou menos, pegou. Se
subir, alguma rodada obedeceu ao prompt em vez do arquivo.

**Legado, para quem tem `delete_ref` (Mac e Windows):** `node ferramentas/ramos-mortos.js --apagar`
e colar. São 23 `voo/` e 28 `entrega/` no servidor hoje. Isso continua valendo — mas agora a
pilha para de crescer mesmo que ninguém rode.

**SEGUNDA CONFERÊNCIA, por `nuvem-20260903T2022` em 03/09 20h UTC: `voo/` = 29. A CONTENÇÃO
FALHOU, e quem a furou fui eu.** Criei **seis** marcadores (`poste-sobre-a-proposta`,
`regua-ancestral-acima-do-menu`, `porta-entrada-cresce-em-silencio`, `censo-oraculo-dois-furos`,
`censo-restilizar-o-aceito`, `cartao-margem-esquerda`) antes de chegar à revogação. `entrega/`
foi de 33 para 34 no mesmo intervalo.

**O mecanismo do furo, medido, porque ele não é distração e sim desenho:** a contenção supunha
que ler o `PLANTAO.md` antes de despachar bastasse. Mas a revogação mora na **linha 386 de um
arquivo de 646**, e o `PLANTAO.md` §3.2 manda **ler por faixa para poupar token**. Eu li do §1
ao §6 — que é onde estão o laço, o brief e o funil, tudo o que a rodada precisa para começar —,
dei por lido e obedeci à linha do prompt agendado, que aparece **antes** no que eu leio e é
**explícita**. As duas ordens estavam no ar ao mesmo tempo e a que chegou primeiro venceu.

**O que eu fiz a respeito, e é o que uma sessão pode fazer:** a revogação subiu para um **§0 do
`PLANTAO.md`**, antes do §1, junto com a outra ordem que o prompt agendado contradiz (rodar o
funil em segundo plano). É a mesma correção que 03/09 de manhã aplicou à regra do `node_modules`
— *"regra que mora longe de quem a executa não é regra, é anotação"* —, e o fato de a mesma
classe de erro voltar **em doze horas** é o argumento de que a posição no arquivo é causa, não
descuido.

**O que isto NÃO conserta, e por que continua sendo a mão do dono:** o §0 depende de a próxima
rodada ler o topo do arquivo antes de agir. É mais provável que ler a linha 386, mas continua
sendo uma corrida entre dois textos que se contradizem, e um deles está fora do repositório.
Uma linha apagada do prompt agendado encerra a corrida. Enquanto ela não for apagada, a série
de medições continua: `git ls-remote origin 'refs/heads/voo/*' | wc -l` — **23** (08h), **23**
(16h), **29** (20h).

**PRIMEIRA CONFERÊNCIA, por `nuvem-20260903T1623` em 03/09 16h UTC: `voo/` = 23, o mesmo número.**
A rodada leu o `PLANTAO.md` como mandado e **não criou marcador**. Uma leitura não fecha o item —
o prompt agendado continua dizendo o contrário, e basta uma rodada obedecer a ele para o número
subir —, mas é a primeira medição da série que o próprio item pediu, e ela deu o resultado bom.
`entrega/`, no mesmo intervalo, foi de **28 para 33**: esse lado não tem quem apague e segue
subindo, o que é o argumento para a lista do `--apagar` (agora correta, ver `RECADOS.md` de hoje)
finalmente ser colada.

---

## 104 — O `check` NÃO TEM COMO SAIR CLICÁVEL numa rodada agendada da nuvem — plantao (03/09)

**Medido em 03/09 21h UTC por `nuvem-20260903T2022`, e o dono cobrou na hora** (*"nao veio o
clicavel kkkk de novo esqueceu"*). Não foi esquecimento: **a ferramenta de pergunta clicável
nativa não está no registro de ferramentas da sessão agendada da nuvem.** Conferido três vezes,
inclusive pedindo pelo nome exato (`select:AskUserQuestion` → *No matching deferred tools
found*), mais duas buscas por palavra-chave que devolveram só ferramentas alheias.

**Por que isto é estrutural e não um contratempo:** o `CLAUDE.md` §6 fecha a forma do check com
todas as letras — *"SEMPRE clicável nativo, SEMPRE SEM EXCEÇÃO"*, e **proíbe** as duas saídas
que sobram (publicar Artifact/página, inventar layout). Numa rodada agendada as três opções
estão fechadas ao mesmo tempo: a permitida não existe, e as proibidas continuam proibidas. A
sessão do app/CLI **tem** a ferramenta; a agendada não. Então a regra não está errada — ela
pressupõe uma sessão que o `check` nem sempre acontece dentro.

**O que a rodada fez, e por que esta é a menos ruim das saídas:** entregou as quatro camadas
escritas na conversa (metas · objetivos · oportunidades · decisões) e as decisões em **lista
numerada com opções nomeadas, consequência dita e a recomendada marcada com ⭐** — que é a forma
que o próprio §6 descreve como base (*"Ele responde por número — 1. C, 2. A"*) e a mesma que ele
manda usar para o excedente das quatro perguntas. Nenhuma página foi publicada.

**As saídas, e as duas primeiras são dele:**
1. **Pedir `check` na sessão do app/CLI**, não na agendada — sai clicável, sem mudar nada.
2. **Emendar o §6** com uma linha dizendo o que vale quando a ferramenta não existe (a lista
   numerada), para a proibição não fechar as três portas de uma vez. **Escrever no `CLAUDE.md`
   é dele** — é lei, e ele a reforçou em 25/08 justamente para ela não ser reinterpretada por
   sessão nenhuma. Eu não emendo.
3. Não fazer nada: cada `check` agendado repete a cobrança, e a rodada gasta o tempo
   reconferindo o registro de ferramentas antes de responder.

**Como conferir sem acreditar em mim:** numa rodada agendada, `ToolSearch` com
`select:AskUserQuestion`. Se um dia devolver a ferramenta, este item morreu sozinho e some.

---

## 103 — A TERCEIRA família do `vercel.json`: propriedade desconhecida DENTRO da regra de `headers[]` — porteiro (03/09)

**Achado separado de propósito, e não consertado de carona.** Ele apareceu no item
`vercel-valor-e-topo`, que fechou as duas famílias que o QA tinha medido (VALOR de chave permitida
e chave de TOPO). O brief do item mandou procurar a terceira antes de fechar e, se achasse,
**deixar escrita como achado separado em vez de remendar junto** — que é o que o autor do item
anterior fez e foi o certo. Está aqui por isso, e não por falta de conserto: ele cabe em poucas
linhas.

**O que é.** As cinco cobranças que hoje existem sobre o `vercel.json` leem, de cada regra de
`headers[]`, exatamente duas coisas: `source` e `headers`. O objeto da regra aceita mais
propriedades, e o que estiver nelas não é lido por portão nenhum — não é chave de cabeçalho (a
`CHAVES_PERMITIDAS` não alcança) nem chave de topo (a `TOPO_DO_VERCEL`, escrita neste item, também
não).

**Medido, DEPOIS do conserto desta entrega**, cada injeção sozinha, com a leitura desviada por
`test/qa-vercel-injecao.js` (o `vercel.json` da raiz nunca é escrito), exit code real do terminal,
na ordem `construir.js` · `qa-vercel-host.js` · `qa-vercel-diretiva-repetida.js` ·
`qa-csp-cabecalhos.js`:

| injeção na regra `/glossario/(.*)` | exit dos quatro |
|---|---|
| `has: [{ type: "header", key: "x-nunca-enviado" }]` | **0 · 0 · 0 · 0** |
| `missing: [{ type: "header", key: "accept" }]` | **0 · 0 · 0 · 0** |
| `destination: "https://exfil.example.com"` | **0 · 0 · 0 · 0** |

**Por que `has`/`missing` são o caso grave, e é uma classe nova, não uma dose menor.** As duas
outras famílias mudavam algo que se vê: um valor, uma chave. Estas tornam a regra **CONDICIONAL**
sem mudar um byte do `source` nem do `headers`. A CSP de `/glossario/(.*)` continua escrita
inteira, continua pregada no `QUADRO_DE_ROTAS` e continua **verde nos cinco portões** — e
simplesmente não é servida numa visita normal, porque a condição não casa. É o único defeito desta
família inteira que deixa o arquivo conferido byte a byte e a página pública sem política.

**O que está medido e o que é inferido, e a distinção é a mesma da dúvida de precedência já
registrada no `conferirVercelJson()`:** o que eu medi com exit code é que **os quatro portões
saem 0**. O que `has`/`missing` fazem na Vercel é conhecido por documentação que **esta máquina
não alcança** — `openapi.vercel.sh` e `vercel.com` estão bloqueados pelo proxy de egresso (medido:
`curl` exit 56, "CONNECT tunnel failed, response 403`). A existência de `has`/`missing` em regras
de `headers` veio de busca, não de leitura da fonte. **Escrito como inferido, não como sabido** —
e quem fechar isto confirma com a documentação ou com medição contra a produção.

**O conserto proposto, e ele é pequeno.** No mesmo `conferirVercelJson()` do
`ferramentas/construir.js`, ao lado da `TOPO_DO_VERCEL`: conjunto FECHADO de propriedades por
regra — hoje `source` e `headers`, e nada mais —, com a mesma disciplina (propriedade a mais
reprova, e acrescentar uma é dizer no commit o que ela passou a fazer). A prova de mordida cabe
como três casos novos no `test/qa-vercel-fora-do-conjunto.js`, que já tem a bancada montada.

**Enquanto não for feito:** o buraco é de quem tem acesso de escrita ao repositório, como os
outros dois eram — não é alcançável de fora. Fica registrado para não ser redescoberto do zero, e
está escrito também no cabeçalho do `test/qa-vercel-fora-do-conjunto.js`, que é onde a próxima
pessoa vai olhar.

---

## 105 — Auditoria dos 13 capítulos contra o §2, via ultracode: 3 achados ALTA, um confirmado por verificação adversarial — plantao/ultracode (03/09)

Rodada `ultracode` pedida pelo dono, 13 capítulos auditados em paralelo (um agente por capítulo,
opus, lendo CLAUDE.md §2 inteiro + o conteúdo do capítulo em `src/jogo.ts`), com segunda camada de
verificação adversarial (um segundo agente tentando REFUTAR cada achado, com as próprias mãos, sem
herdar o raciocínio do primeiro). **A rodada foi interrompida pelo limite de sessão da conta** (reset
23:20 America/Sao_Paulo) no meio da verificação — a auditoria dos 13 capítulos terminou 13 de 13, a
verificação terminou só 15 de 40 achados. **7 capítulos ficam sem NENHUMA verificação**: O CAIS QUE
VOLTOU À LUZ, A PRAÇA, O QUE NÃO PODIA SER DITO, O QUE SEGUROU, O QUE TEM FONTE, O ACEIRO, AINDA AQUI.

**Contagem de achados brutos (antes de qualquer verificação) por capítulo:** PALMARES 0 · A PEQUENA
ÁFRICA 4 · SALVADOR 4 · AS PORTAS 1 · JABAQUARA 3 · PINDORAMA 3 · O CAIS QUE VOLTOU À LUZ 5 · A PRAÇA
3 · O QUE NÃO PODIA SER DITO 4 · O QUE SEGUROU 3 · O QUE TEM FONTE 3 · O ACEIRO 4 · AINDA AQUI 3.
Total: 40. A maioria é severidade baixa/média (fonte fraca, redação que poderia ser mais precisa). Só
TRÊS acharam severidade ALTA, e são os três que importam de verdade:

### 1. SALVADOR — objeto ritual como drop colecionável (§2 item 4.5) — CONFIRMADO por verificação adversarial

Búzios, pano da costa e acarajé caem como drop em SALVADOR e entram em `S.energia`/`S.recursos`
(`concluirAlcance()`, `soltarDrop()` incondicional na linha ~1195; `coletarDrop()` linha ~890). A
regra é categórica e sem exceção: "Objeto ritual não é colecionável — entra como fala, nunca como
drop" (§2, item 4.5). A verificação adversarial tentou quatro linhas de refutação e as quatro caíram,
e ainda achou duas peças de contexto que agravam:

- **Já foi decidido no capítulo VIZINHO, ao contrário.** `NOTES.md:4953` aplica a mesma regra ao
  capítulo O CAIS para RECUSAR búzios como item de escavação — mesmo objeto, mesma regra, decisão
  OPOSTA em SALVADOR.
- **A pendência foi vista e ignorada.** `docs/arquivo/SPRINT.md:134-139`, ticket T1 de SALVADOR:
  "Drops continuam nascendo no chão (acarajé, pano, búzios)... ⚠ decisão-do-dono antes de ir à main
  (§2...)" — o aviso existia, foi escrito, e o código foi para produção sem resposta.
- **O próprio pedido de arte se contradiz.** `ferramentas/necessario.json:60`: "Decisão do projeto:
  NENHUMA escrita árabe como item — escrita sagrada não é colecionável" — na MESMA frase que pede
  búzios e pano da costa como item.
- **A troca é barata.** Já existem objetos de trabalho de rua desenhados e não usados
  (`cap4-obj-*`: tabuleiro, trouxa, água) em `assets/objetos/`.

**A pergunta, na forma exata em que já foi feita ao dono em 09/08 e nunca respondida: o drop continua
ou troca?**

### 2. O CAIS QUE VOLTOU À LUZ — a salvaguarda do texto existe só como intenção, não em tela (§2.2 + §2.4.3) — NÃO VERIFICADO (achado bruto, detalhado)

O capítulo é sobre o cais do Valongo — maior porto de desembarque de africanos escravizados das
Américas — e tem gente de verdade atravessando a rua (`GENTE_EP_B64.cais`, 24 quadros), que a mão
alcança e que entra numa fila que anda atrás da protagonista (`acolherPessoa`). O PRÓPRIO comentário
do capítulo escreve a condição: "PALMARES e SALVADOR são os capítulos em que quem atravessa a tela é
GENTE, e isso só se sustenta com o texto que explica por quê. Sem esse texto escrito, pessoa na rua
não entra" (`src/jogo.ts` ~2054-2056). **O texto que explica não existe em tela.** O rótulo do
capítulo diz "século XIX" e a primeira fala fixa "Foi construído em 1811" — mas o brief de arte
original (`ferramentas/necessario.json`, item `gente-cais`) pedia "TRÊS pessoas da Saúde/Gamboa, Rio
de Janeiro, HOJE... gente contemporânea, nunca cena de época". Sem o texto que marca "isto é hoje",
figuras que a mão alcança e "recolhe" numa fila num capítulo sobre o maior porto de desembarque podem
ser lidas como gente daquele tempo naquele cais — a leitura exata que §2.2/§2.4.3 existem para
impedir. **Não decidido — precisa da verificação adversarial que não rodou, e do dono.**

### 3. O ACEIRO — a garantia de §2 escrita no código não é verdade na build (§2 item 4 + regra prática) — NÃO VERIFICADO (achado bruto, detalhado)

O comentário do bloco ABAFAR (`src/jogo.ts` ~2662-2669) afirma: "O que atravessa a tela ali continua
sendo FOGO — nunca pessoa, nunca maquina, nunca marca (§2)". **Isso deixou de ser verdade quando
`aceiro` entrou em `CAPS_VERBO` em 18/08** — `pessoaNaRua()` passa a valer true no capítulo, e
`mobFrame()` troca o objeto pela folha de gente: uma brigadista, uma apanhadora de flores
sempre-vivas, um vaqueiro (comunidade tradicional reconhecida). A mão os alcança e o que carregam cai
como drop recolhido. O próprio `PENDENTES.md §18` registrou o desenho aprovado dizendo o contrário
("Fogo nunca é pessoa nem máquina"), e o `§19` já nomeou esta CLASSE de erro antes: "arte de gente e
mecânica de gente são a MESMA decisão... é o §2 quebrado com pixel bonito". **O achado aqui é
factual, não decide se pessoa-na-rua é aceitável em O ACEIRO — isso é do dono. O que é fato é que a
garantia escrita no código é falsa, e garantia de §2 falsa no registro é pior que garantia nenhuma.**
Precisa da verificação adversarial que não rodou.

### O que fica pendente

Continuar a verificação dos 7 capítulos sem checagem (O CAIS, A PRAÇA, O QUE NÃO PODIA SER DITO, O
QUE SEGUROU, O QUE TEM FONTE, O ACEIRO, AINDA AQUI) assim que o limite de sessão resetar. O relatório
bruto completo (13 auditorias + 15 verificações) está em
`C:\Users\User\.claude\projects\C--Users-User-Downloads-jogo-brasil\6a4dc769-e89d-42a7-b775-bae7f3d1a2b0\subagents\workflows\wf_2ac10252-4f7\journal.jsonl`
— não apagar antes de terminar de ler os 25 achados ainda não vistos (os 12 capítulos com achado
menos os 3 já detalhados acima têm mais 22 achados baixa/média não listados aqui, a maioria sobre
fonte fraca ou redação imprecisa, não sobre mecânica).

### FECHAMENTO da auditoria (verificação dos 7 capítulos que faltavam) — plantao/ultracode (04/09)

Os 25 achados brutos dos 7 capítulos pendentes (O CAIS, A PRAÇA, O QUE NÃO PODIA SER DITO, O QUE
SEGUROU, O QUE TEM FONTE, O ACEIRO, AINDA AQUI) passaram pela verificação adversarial. **17
confirmados, 8 refutados.** Os 13 capítulos estão agora com auditoria E verificação completas.

**Achado ALTA de O CAIS foi REBAIXADO para MÉDIA na verificação.** A verificação foi conferir a arte
já entregue (`GENTE_EP_B64.cais`, 24 quadros) em vez de confiar no relato: são pessoas contemporâneas
sem ambiguidade — um entregador de bicicleta com bag térmica, uma senhora com carrinho de feira, um
rapaz com fone de ouvido. Não sustenta a leitura de "gente escravizada de 1811" que fazia o achado
original ser ALTA. O que sobrevive, confirmado: a quinta fala da abertura do capítulo está OBSOLETA E
FALSA — diz "a arte deste cais não chegou, é emprestada de outro capítulo", quando já chegou arte
própria; e o verbo que o texto promete ("alcançar é cavar") não é o que a mecânica faz (é "acolher",
igual a PALMARES). Nenhuma linha em tela diz ao jogador que a rua é HOJE, o que seria a âncora que
falta. Effort baixo: 2-3 frases de texto, sem mudança de mecânica.

**O ACEIRO segue ALTA, confirmado sem ressalva.** Ver item de backlog `aceiro-fogo-vira-gente` — a
pergunta é do dono.

**Os outros 15 achados confirmados** (média/baixa, nos 7 capítulos) são majoritariamente sobre
procedência de fonte (número certo, mas apontando pro documento errado ou pra tela errada) e
comentários de código desatualizados que podem confundir uma sessão futura — nenhum é mecânica
quebrando §2. Ficam registrados aqui, não viraram item de backlog individual por serem numerosos e
de baixo risco; o relatório completo com trecho, local e justificativa de cada um está no journal do
workflow: `wf_c36b3335-bf1` (a auditoria original, capítulos que fecharam de primeira, está em
`wf_2ac10252-4f7`). Quem for revisar texto histórico por outro motivo deveria ler este bloco antes.

---

## 106 — `encaixe.js` reprovou o retro-2 (docs puro) por instrumento, não por defeito — e o `push` correu na frente do funil — plantao (04/09)

**O erro, com todas as letras: eu li `git log` e empurrei pro `origin/main` ENQUANTO o funil ainda
rodava em segundo plano**, antes dele terminar de rodar `test/encaixe.js`. O funil reprovou depois
("INTEGRAR RECUSOU: encaixe vermelho — merge DESFEITO") e desfez o merge NA ÁRVORE LOCAL, mas o
commit já tinha ido pro servidor. Por um tempo, `origin/main` teve um commit que a própria máquina
que o gerou tinha rejeitado.

**A investigação, e o que ela realmente achou:** a entrega do retro-2 (`worktree-agent-a28212480b4eedcf6`)
toca só 5 arquivos, todos `.md` (`EQUIPE.md` + 4 prompts de agente) — zero código, zero conteúdo de
jogo. `test/encaixe.js` testa mecânica (retenção, capítulos, notas de história) e não tem como ler
prompt de agente. Rodei o mesmo `encaixe.js` de três jeitos: (1) na árvore principal, sem o retro-2
— PASSOU; (2) num worktree separado (`/tmp/verificar-origin`), com o retro-2 — FALHOU, duas vezes,
com contagens de asserção DIFERENTES entre as duas (1 e depois 2); (3) revertido o retro-2 nesse
MESMO worktree separado, árvore byte a byte igual à (1) — **FALHOU DE NOVO**, com a mesma dupla
contagem. **Isso prova que o defeito não estava no conteúdo — estava no worktree** (`/tmp/verificar-origin`,
provavelmente contenção de recurso: várias outras sessões de agente rodando Chromium em paralelo
nesta máquina no mesmo instante). Confirmação final: mesclei o retro-2 de volta na árvore principal
e rodei `node test/encaixe.js` sozinho — **PASSOU, exit 0**, junto com `npm test` inteiro.

**O conserto:** nenhum código mudou. Mesclei `origin/main` (que já tinha o retro-2, correto) com o
`main` local (que tinha o cartão da porta), sem conflito, `npm test` e `encaixe.js` verdes, e
empurrei — commit `7769b50`. Nada foi perdido, nada ficou quebrado no ar além do intervalo entre o
push precoce e este commit (poucos minutos).

**A lição, e ela é sobre PROCESSO, não sobre este achado:** nunca ler `git log`/checar estado e
empurrar enquanto um `integrar.js` em segundo plano ainda não devolveu o resultado final — o `tail`
de um log parcial não é prova de que o funil terminou. E: **um teste que passa numa árvore e falha
numa cópia byte a byte idêntica noutro worktree é sinal de dependência de ambiente** (caminho
absoluto, porta de rede, contenção de CPU/Chromium) — vale investigar QUAL é essa dependência antes
de confiar em qualquer resultado de teste rodado fora do worktree principal sob carga pesada. Não
investiguei a causa exata (qual recurso colide) porque o achado mais urgente — produção correta —
já estava resolvido, e a questão de instrumento fica aberta para quem quiser.
