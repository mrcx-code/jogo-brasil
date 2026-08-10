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
- **⚠ O ACEIRO fora do arco.** Desenhado inteiro no `HISTORIA-CONTEMPORANEO.md` e pedido pelo
  dono em 08/08, mas não está no arco de doze aprovado em 07/08. Entrar exige reordenar a fila
  — item 1 das nove decisões ⚠ do historiador. A estrutura já o recebe em dois passos.
- **Os oito capítulos ainda não têm nó na `LINHA_TEMPO`**, de propósito: A HISTÓRIA só mostra o
  que tem fonte. Cada marco entra junto com a pesquisa do capítulo dele.
- **Verbo por escolher em quatro:** JABAQUARA · A PEQUENA ÁFRICA · AS PORTAS · A PRAÇA.

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
