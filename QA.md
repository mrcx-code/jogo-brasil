# QA.md — relatório vivo do QA (automação e teste)

**Relatório 2 — a passada pós-integração (2026-08-08).** Substitui o relatório do Sprint 1
(T4), cujos resultados estão resumidos no fim, em *O que o relatório anterior deixou*.
Papel em `EQUIPE.md`. Território: `test/` apenas. Nada em `src/` foi tocado — o que só passa
mudando o jogo está aqui como BUG, não como conserto.

Alvo: `index.html` da RAIZ como está na `main` (`9b8a6c3`), sem build, 390×844, dsf 2.

## Como foi feito

Três instrumentos novos, todos em `test/`:

| arquivo | o que faz |
|---|---|
| `test/percorrer.js` | a passada por TOQUE REAL: boot → capítulo 1 → a travessia pela virada de verdade → os quatro capítulos pela lista → o quadrinho página a página → a volta com save de arco velho. 20 prints `test/P-*.png`. |
| `test/hostil.js` | os casos que ninguém percorre: recarregar no meio da travessia, save carimbado no futuro, `visibilitychange`, persistência dos recursos, barra de vida na coluna da personagem. |
| `test/calibrar-fps.js` | mede a razão FPS rua-vazia / rua-cheia N vezes, para escolher um limiar que não seja flaky. |

E o `test/smoke.js` ganhou três blocos (detalhe na seção *O smoke ampliado*).

## BUGS, por gravidade

### B1 — ALTA · a lista de eras rebobina a cena, e o jogo remonta a cronologia sozinho

`montarCapitulos()` escreve `S.cenario = cenarioDaEpoca(i)` e **não toca em
`S.energiaTotal`**. `verificarCenario()` decide só por `S.energiaTotal >= LIMIARES[cenario]`.
Resultado: o impacto acumulado reconquista, sozinho e imediatamente, todas as cenas entre a
escolhida e a que a pessoa já tinha — com fecho, travessia e abertura de cada uma.

**Repro A — o caminho comum do dia 2** (`percorrer.js` §4c, medido):
estar na 2ª cena de PALMARES (cena 3) → MENU → JOGAR → tocar em PALMARES.
Medido: `cena 3 → a lista põe em 2 → ~1 s depois está de volta em 3`, com a cerimônia de
virada de cena no meio. Escolher **o próprio capítulo** rebobina.

**Repro B — o pior caso** (`percorrer.js` §4b, medido):
estar em AINDA AQUI, escolher PINDORAMA, **não tocar em mais nada por 12 s**.
Medido: `PINDORAMA@0 → PALMARES@3`, com **40 falas abrindo sozinhas** e **25 quadros
passados dentro da TRAVESSIA**. Em 12 segundos.

Por que é a mais grave das três pernas: a lista de eras é a única porta do JOGAR a partir do
capítulo 2 — é *o* caminho de volta do dia 2, o que a missão do protótipo mede. E há um
agravante de §2: A TRAVESSIA, o trecho que existe para o jogo explicar em voz alta a própria
recusa de encenar o porão, é **re-encenada como efeito colateral de um toque no menu**, sem
que ninguém a tenha pedido.

Não proponho a correção (é `src/`), mas registro o que o teste sabe: o sintoma some se a
escolha de era levar `S.energiaTotal` junto com `S.cenario` — e é isso que o `percorrer.js`
faz à mão para conseguir andar nos quatro capítulos.

### B2 — MÉDIA · o bit da travessia é gravado no COMEÇO dela

`correrTravessia()` (`src/jogo.ts` l. 6505) faz
`S.travessias |= (1 << i)` e chama `salvar()` **antes** de a travessia rodar.

**Repro** (`hostil.js` §1, medido): entrar na travessia pelo caminho do jogo → recarregar a
página. Volta: `trav: true` (a travessia recomeça, o que é certo) mas
`PULAR: block` — **visível**. Ou seja, a promessa escrita no `NOTES.md` ("não é pulável na
primeira vez") cai sem que ninguém tenha atravessado uma vez.

Agravante de produto: os 90 s em que o botão dourado é inerte são exatamente a janela em que
alguém troca de aplicativo no celular. O bug mora onde o comportamento o convida.

### B3 — MÉDIA · as páginas sem imagem do quadrinho são uma janela de 12% para o jogo rodando

`.tela { background: rgba(12,10,7,.88) }` (`src/estilo.css` l. 355) — 12% do que está atrás
atravessa. E o mundo **não para** sob o menu e irmãs (decisão registrada em `historiaAberta()`
e no `DIRECAO.md`: "a tela é o mundo"). No quadrinho, **15 das 26 páginas** não têm imagem
própria (`qPonta`, `qMomento semImg`, `qMais`) e nelas o que preenche o quadro é a rua viva.

**Medido** (`percorrer.js` §5b): dois prints do MESMO quadro, 800 ms de distância, sem
ninguém tocar em nada — **diferentes**. Nos prints `P-09-quadrinho-p1.png`,
`P-10-quadrinho-p4.png` e `P-12-quadrinho-fim.png` dá para ver a personagem andando atrás do
texto, e na última página o **eixo de espelho da mata** (aquele que a sessão anterior mediu e
consertou em SALVADOR) aparece bem no meio da página.

Isso é decisão de Direção de Arte, não bug de código: a onda 8 diz que a página escura é "escura
de propósito", e o que está na tela não é uma página escura, é uma janela. Reporto com o número.

### B4 — BAIXA/MÉDIA · barra de vida colada na personagem

As chegadas são desenhadas no `#scene`; a personagem tem canvas próprio **por cima**
(`#heroHD`, §4 do CLAUDE.md). Quando uma chegada ocupa a mesma coluna que ela, o corpo dela
cobre o sprite da chegada e **sobra só a barra de vida**, na altura da cintura dela.

**Medido** (`hostil.js` §5): chegada em `worldX + HX`, com dano — **42 px pintados** na faixa
da barra, na coluna da personagem. Print de rua real onde isso aconteceu sem ser provocado:
`test/P-08-cap2-rua.png`. A leitura na tela é "a heroína tem barra de vida" — e ela não tem.

### B5 — BAIXA · os três recursos do HUD não sobrevivem ao boot

`S.recursos` (flor/água/refeição) **não está no `ESQUEMA_SAVE`** e portanto não é gravado
(`hostil.js` §4: `recursos no save: false | no esquema: false`). Os três contadores ficam no
alto da tela a sessão inteira e zeram no próximo boot. Hoje eles não têm consumidor, então
não quebra nada — mas é estado visível que mente sobre ser progresso, e é exatamente o tipo de
campo que o §3.3 do CLAUDE.md manda pôr no esquema quando virar persistente. Decidir se
persiste é do PM; registrar que HOJE não persiste é meu.

### B6 — BAIXA · relógio adiantado congela a contagem de dias

**Repro** (`hostil.js` §2): registro de retenção com `ultimo` de amanhã (relógio do aparelho
adiantado e depois corrigido). Medido: `ultimo: 2026-08-09`, `hoje: 2026-08-08`. Nada quebra —
o painel não abre, `bonus` fica em 1,04, nenhum número impossível na tela — mas **enquanto o
relógio real não alcançar aquela data, nenhum dia novo é contado**, e o protótipo existe para
contar dias. É o gap nº 1 do relatório anterior, agora com um caso concreto e um número.

### B7 — BAIXA · o botão dourado promete `+1.0` durante a travessia

Confirmado no print `test/P-04-travessia.png`: o botão está aceso, com o rótulo `+1.0`, e
**não paga** (medido: 10 toques + 1 pulo = `+0,00`). É a dúvida nº 1 que o Dev deixou por
escrito no `NOTES.md` e que a Direção de Arte ainda não respondeu. Registro para não se perder:
é a única coisa na tela que promete o que não vai acontecer.

### Confirmações do relatório anterior

- **B1 do relatório 1 (o painel do retorno debaixo do menu): CORRIGIDO.** O smoke agora
  pergunta ao navegador quem está no ponto do painel e toca de verdade com o menu aberto —
  verde em todas as rodadas. Print `test/B1-retorno-antes-do-menu.png`.
- **B2 do relatório 1 (bloco morto do "third hit leap") — SEGUE LÁ.** `smoke.js` l. 450–465
  ainda imprime `jumpT mid: 0 | shockwaves: 0` com as duas asserções comentadas como
  obsoletas. Não removi: continua sendo diff de outra coisa, e agora ele ao menos serve de
  gancho para os prints `shot-jump/slam/wave`. Candidato a subtração.

## O smoke ampliado

`test/smoke.js` ganhou três blocos. Rodado **cinco vezes** contra o `index.html` da raiz sem
build: **PASS nas cinco**.

### 1. O quadrinho — a tela mais citada do sprint, e não tinha asserção nenhuma

O que passou a ser cobrado, e por que cada um quebra em silêncio:

- **26 páginas** (falha abaixo de 20): página perdida ou duplicada aparece aqui.
- **cada página tem EXATAMENTE a altura da tela** — medido `[844]` contra viewport 844. Se
  `height: 100%` deixar de resolver (um `position` novo no pai, um `display` trocado), as
  páginas encolhem para o conteúdo e **o quadrinho vira lista de novo, sem erro nenhum**.
- **o rolo mede N páginas**: `scrollHeight 21944` = 26 × 844.
- **nenhuma barra de rolagem**: `offsetWidth − clientWidth = 0`. É o pedido do dono em voz
  alta ("sem aparecer scroll") e era a única coisa que o print garantia.
- **o encaixe FUNCIONA, exercido**: rolar 3/4 de página, três vezes, e medir o resto contra a
  altura — medido `[0, 0, 0]`. Sem isto, `scroll-snap-type` podia continuar declarado no CSS
  e não assentar em nada.
- **nenhuma página vazia** e **o VOLTAR flutuante alcançável** (`elementFromPoint`).
- Print novo: `shot-quadrinho.png`.

### 2. FPS — afirmado, e afirmado de um jeito que não é flaky

O gap que eu mesmo levantei. Piso absoluto não serve: a mesma máquina mediu **16, 36, 37 e 61**
em dias diferentes, e um piso em 58 reprovaria por ambiente. O que não depende de máquina é a
**razão medida na mesma rodada, no mesmo segundo**, entre a rua vazia e a rua cheia (8 chegadas
+ 8 drops + 8 folhas + 6 jatos de partícula + a ajuda automática do u3 ligada).

Calibrado com `test/calibrar-fps.js`, 5 rodadas: **1,00 · 1,00 · 1,00 · 1,02 · 1,02**.
Limiar escolhido: **0,75** — um quarto de folga sobre a pior medida. Se a máquina inteira for
lenta, as duas medidas caem juntas e a razão fica onde estava; se DESENHAR passar a custar
caro, só a segunda cai. Fica também um piso absoluto de **12 fps**, e só para pegar laço morto.

Medido nas cinco rodadas: vazia 61–62, cheia 61–62, razão 0,98–1,02.

### 3. A trava de vocabulário do §2 — a regra que só existia na cabeça de quem escreve

O `CLAUDE.md` nomeia palavras que **não existem** neste arquivo: *descobrimento* (não houve —
havia gente aqui), *pré-história*, *primitivo* (§2.1) e *escravo* como identidade (§2.4.8).
Nenhuma era cobrada por teste — um texto novo escrito às pressas em qualquer capítulo passaria.
O bloco varre **119 falas autorais** (EPOCAS abertura/fecho, MOMENTOS, LINHA_TEMPO, TRAVESSIAS,
TEXTOS) e reprova.

Duas exclusões, e as duas são deliberadas — a primeira versão do teste **reprovou** por causa
delas, o que é o argumento de que precisam existir:

1. **o campo `f` (a fonte) não entra** (20 linhas): ele carrega TÍTULOS de obra, e o título de
   quem pesquisa o assunto é dele — *Rebelião escrava no Brasil* (Reis, 2003) é a referência
   mais citada do capítulo de 1835, e reescrevê-la seria falsificar a bibliografia;
2. **trechos entre aspas não entram**: o jogo usa a palavra proibida exatamente para recusá-la
   (*"não era 'escravo'. Escravizar foi o que fizeram com ela"*), e um teste que reprovasse isso
   empurraria o texto para **deixar de nomear o problema** — o oposto da regra.

O que sobra é a voz do jogo falando por conta própria, que é onde a regra vale. Medido: **0**.

## O que a passada percorreu e achou SÃO

Rodado por toque real, os quatro capítulos:

- **boot → capítulo 1**: menu abre, JOGAR entra, a abertura fecha em **11 toques**, 12 toques
  no botão + pulo + golpe rendem 14–21 de impacto e ~250 px de chão.
- **a travessia pela virada de verdade** (1→2, sem semear estado de travessia): entra pelo
  fecho, 10 toques no botão dourado + 1 pulo rendem **+0,00**, PULAR escondido, retrato fora
  do quadro, sai por toque e desemboca em **PALMARES**. Print `P-04-travessia.png`.
- **os quatro capítulos pela lista**: PINDORAMA, PALMARES, SALVADOR e AINDA AQUI abrem, a
  abertura fala, o PULAR aparece para quem já leu, e nenhuma tela fica presa. Prints
  `P-07-cap*.png` e `P-08-cap*.png`.
- **o quadrinho, 26 páginas roladas uma a uma**: nenhuma desencaixada, chegou ao fim exato
  (21100 de 21100), nenhuma página vazia, VOLTAR alcançável no fim do rolo.
- **volta com save do ARCO VELHO** (cena 4 do arco 0, 9 h atrás): acorda em `AINDA AQUI@6`,
  `arco 1`, painel do retorno aberto, alcançável e com os cinco números batendo com a semente
  (`17 pessoas acolhidas` = 3+5+9). Print `P-13-retorno.png`.
- **zero erro de console** em todas as passadas.
- `fecharTelas()` encerra a travessia e o cartão MENU segue intocável durante ela.
- Recarregar no meio da travessia **repete** a travessia (só o PULAR vaza — B2).

## GAPS — o que ninguém está olhando

Conferência da lista antiga, item por item, mais o que apareceu agora.

1. **FPS sem asserção — RESOLVIDO.** Entrou no smoke, relativo e calibrado. Fecho o gap.
2. **Volta ao jogo no capítulo 2+ — RESOLVIDO, e foi ele que revelou o B1.** Era o gap nº 4
   do relatório anterior; percorrido, achou o bug mais grave desta rodada. Fecho o gap.
3. **Relógio hostil — CONFIRMO, e agora um terço dele tem número.** O caso "save/registro no
   futuro" virou B6. Seguem **descobertos e concretos**: (a) meia-noite virando com a sessão
   aberta (`marcarDia` só roda a cada 30 s e no `visibilitychange`); (b) fuso trocado entre
   sessões (`diaLocal()` muda de resposta sem nada mudar no mundo).
4. **Som — mantenho DERRUBADO.** Nove efeitos e o orçamento de vozes testados; nada novo.
5. **A travessia INTEIRA nunca roda — ACRESCENTO.** Nem o smoke nem a passada esperam os 90 s:
   os dois a atravessam avançando a fala na mão. Ninguém sabe o que acontece nos segundos 30 a
   85 — se o céu chega onde promete, se o relógio a 10× estoura o dia, se a memória cresce.
   É o único trecho do jogo em que o tempo REAL é o conteúdo, e é o único que nenhum teste vive.
6. **O quadrinho só é testado CHEIO — ACRESCENTO.** Todas as asserções novas rodam com
   `aberturas = MASCARA_EPOCAS` e o impacto no teto. As páginas `qMais` ("E MAIS N MARCOS À
   FRENTE") e `qMarco longe` — que são justamente **o motivo de voltar amanhã** — nunca são
   montadas por teste nenhum. Quem abre A HISTÓRIA no dia 1 vê uma tela que ninguém verificou.
7. **Ninguém mede o custo de montar o quadrinho — ACRESCENTO.** 26 páginas, várias com pintura
   de capítulo em base64 de tela cheia, montadas de uma vez a cada toque em A HISTÓRIA. O
   `content-visibility: auto` está lá para isso e **não tem `contain-intrinsic-size`**; funciona
   hoje porque a altura é explícita, e deixa de funcionar em silêncio se alguém mexer no
   `height: 100%`. Nenhum número existe sobre tempo de montagem nem sobre memória.
8. **Uma resolução só — ACRESCENTO.** Tudo roda em 390×844. O quadrinho depende de
   `height: 100%` e de `env(safe-area-inset-*)`; a tela de fala depende de `--hControles`.
   Numa tela curta (por exemplo 360×640) ninguém sabe se o papel do momento cabe na página.
9. **Nenhum ciclo de vida de verdade — ACRESCENTO.** Todo teste de persistência semeia o
   `localStorage` à mão. Ninguém joga, fecha, reabre e confere que o que voltou é o que ficou.
   É a diferença entre provar o esquema e provar o save.
10. **Confirmo os dois grandes do PM sem nada a acrescentar:** nenhum humano jogou (H1 sem
    denominador) e doze capítulos não cabem no arquivo único. Decisão de dono, não de teste.

## Estado

`node test/smoke.js` contra o `index.html` da raiz, sem build: **PASS (5×)**, com os três
blocos novos (quadrinho, FPS relativo, vocabulário do §2) integrados.
Prints novos: `shot-quadrinho.png` (raiz) e 21 em `test/` (`P-*.png`, `H-*.png`) — olhados de
verdade, um a um; os dois que mais dizem coisa são `P-08-cap2-rua.png` (B4) e
`P-12-quadrinho-fim.png` (B3).
Nada commitado, nada empurrado, nada fora de `test/`.
