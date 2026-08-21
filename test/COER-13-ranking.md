# OS 13 CAPÍTULOS — material de decisão (coerência visual)

Acompanha `test/COER-13-mosaico.png` (13 capítulos lado a lado, ordenados do melhor para o
pior, com print da RUA em 390×844 dsf2, sem HUD). Este documento é o texto de apoio à mesma
pergunta: **duas técnicas de renderização coexistem no jogo sem ponte** — 3 capítulos em
pixel art crua, 10 em pintura semi-realista de tom contínuo — e o dono pediu para "ver mais
antes" de decidir o quê fazer. Fonte da auditoria original: `DIRECAO.md`, seção "AUDITORIA
(2026-08-21): OS 13 CAPÍTULOS LADO A LADO".

## Ranking, melhor → pior

| # | Capítulo | Família | Por quê |
|---|---|---|---|
| 1 | PINDORAMA | PIXEL | pixel art fundadora, zero artefato |
| 2 | PALMARES | PIXEL | mesma família, zero artefato |
| 3 | O QUE TEM FONTE | PINTURA | interior fechado e simétrico (biblioteca) — a costura do espelho cai sobre estante repetitiva e não chama atenção; a pintura mais bem resolvida do lote |
| 4 | SALVADOR | PINTURA | coerente internamente, sem artefato de emenda visível no recorte medido |
| 5 | AS PORTAS | PINTURA | coerente, tom apropriadamente mais cinza/concreto para o período |
| 6 | A PEQUENA ÁFRICA | PINTURA | coerente, sem artefato visível |
| 7 | AINDA AQUI (hoje) | PIXEL (fundo) + herói fino | fundo volta à família pixel art (bom, fecha o arco), mas o herói é do registro fino de AS PORTAS/NÃO DITO — único capítulo em que fundo e personagem pertencem a famílias DIFERENTES ao mesmo tempo |
| 8 | O CAIS QUE VOLTOU À LUZ | PINTURA | a pintura mais bonita do lote isoladamente, mas é o capítulo-dobradiça: depois de dois capítulos inteiros de pixel art, é aqui que o jogo muda de técnica pela primeira vez, sem ponte nenhuma |
| 9 | O QUE NÃO PODIA SER DITO | PINTURA | coerente, primeira das quatro a repetir a arte de `arte:[10]` |
| 10 | A PRAÇA | PINTURA | mesma pintura de NÃO DITO — a repetição começa a se notar |
| 11 | O QUE SEGUROU | PINTURA | terceira repetição consecutiva da mesma pintura |
| 12 | O ACEIRO | PINTURA | quarta repetição consecutiva — indistinguível dos três anteriores sem ler o nome no letreiro de madeira |
| 13 | JABAQUARA | PINTURA | pior colocado: além de pertencer à família pintura (mesmo corte de 8–12), é o único com um artefato de composição visível e não-intencional (a raiz detalhada reflete sobre o eixo do espelho e forma um rosto simétrico) — visível no mosaico, atrás do herói |

**O achado central não é sobre nenhum capítulo isolado — é que a linha entre #6 e #8 corta o
jogo ao meio.** PINDORAMA/PALMARES são um vocabulário (blocos de cor chapada, grão grosso); os
10 capítulos de CAIS em diante são outro (sombra suave, perspectiva de concept art). A saturação
medida confirma por número: família pixel 59–66%, família pintura 34–52%. Não é a paleta — é a
TÉCNICA de renderização mudando de capítulo para capítulo.

## Os 3 caminhos, com o custo honesto de cada um

### Caminho A — o pixel vence: os 10 capítulos de pintura recebem um passe de código

Um passo de quantização de cor + redução de resolução efetiva, aplicado NA EXIBIÇÃO sobre os
10 `CENARIO_ALTO_B64` da família pintura (e os `HERO_B64` que os acompanham), até a
granulometria bater com o `--graoPx`/passo de 2px que o chrome já usa desde a onda 11. Não
reprocessa arquivo — um canvas intermediário em `redesenharFundo()`.

- **Custo:** zero arte nova. É código (`src/jogo.ts`), medido em FPS antes de entrar (piso 58).
  Risco principal: a pintura mais elogiada do lote (CAIS, SALVADOR, O QUE TEM FONTE) perde
  detalhe fino — sombra suave e perspectiva de concept art são exatamente o que o passe apaga.
  Também não resolve sozinho o problema 2 (4 capítulos com a mesma pintura) nem o 3 (rosto no
  espelho de JABAQUARA) — cada um pede correção própria além deste passe.
- **Quando escolher:** se a opinião é que a pixel art crua (PINDORAMA/PALMARES) é a voz mais
  "do jogo" — mais barata de produzir em escala (a "plataforma que cresce ano a ano" do
  CLAUDE.md §8 pede conteúdo novo todo ano) e mais coerente com o chrome bitmap 5×7 que já
  domina HUD, botões e rótulos.

### Caminho B — a pintura vence: os 3 capítulos pixel art recebem arte nova

Repintar PINDORAMA, PALMARES e AINDA AQUI no registro "pintura" para igualar aos outros 10.

- **Custo:** arte nova de verdade — não é passe de código. E PINDORAMA e PALMARES são
  exatamente os capítulos dos **povos originários e de Palmares**: qualquer arte nova ali
  reabre o §2 do CLAUDE.md por inteiro (representação decide-se com o dono; "na dúvida, pare e
  pergunte" é a única matéria deste repositório em que decidir sozinho é o erro). Perde-se
  também o bookend deliberado — PINDORAMA abre o arco em pixel art crua e AINDA AQUI fecha nele
  de propósito, e essa simetria de abertura/fechamento é composição, não acidente.
- **Quando escolher:** se a opinião é que a pintura semi-realista é a direção nova do jogo (é a
  técnica de 10 dos 13 capítulos, e é a que lê mais perto das referências premiadas citadas em
  `DIRECAO.md` — Art of Fauna, Florence) e vale pagar o preço de reabrir representação em 2
  capítulos sensíveis para chegar lá.

### Caminho C — conviver: uma ponte de grão e luz entre as duas famílias, sem repintar nada

Não escolhe um vencedor. Trata as duas famílias como dois materiais que precisam de UMA régua
de transição, do mesmo jeito que a onda 11 tratou "vetor sobre pixel" no chrome: uma textura de
grão determinística aplicada nas BORDAS de cada transição (a costura PALMARES→CAIS, hoje sem
ponte nenhuma) e o sistema de hora do dia (`HORAS`/`luzDoDia()`) estendido aos 4 capítulos que
hoje repetem `arte:[10]` — uma hora fixa e diferente por capítulo (MANHÃ para NÃO DITO, TARDE
para A PRAÇA…), o que resolve o achado 2 sem pintar nada de novo.

- **Custo:** o mais barato dos três em arte (zero imagem nova) e o mais caro em disciplina de
  produto — não resolve o achado central (duas línguas visuais), só o torna menos abrupto na
  costura e ataca a repetição. Continua sendo dois jogos que se cumprimentam na porta, não um
  jogo só. E ainda deixa em aberto o que fazer com o rosto no espelho de JABAQUARA (correção de
  posição à parte, barata, nos três caminhos).
- **Quando escolher:** se o objetivo agora é ganhar tempo — publicar uma melhora visível sem
  comprometer a arquitetura visual de longo prazo, deixando a decisão A-vs-B para quando houver
  mais capítulos pintados ou mais capítulos pixel art no acervo, e a "maioria" for mais clara do
  que 10 contra 3 hoje.

## Nota de fora do escopo desta cadeira

Decidir se os 10 capítulos "pintura" são a direção nova do jogo (Caminho B ao contrário — os 3
pixel art é que precisam mudar) é decisão de arquitetura visual de longo prazo: cito, não
decido. Nada disto é pergunta de representação (§2) por si — mas o Caminho B, especificamente,
esbarra nela em 2 dos 3 capítulos que tocaria, e isso está escrito acima, não escondido.
