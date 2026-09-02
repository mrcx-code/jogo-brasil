# QA.md — relatório vivo do QA (automação e teste)

**Relatório 3 — A SEQUÊNCIA INTEIRA, do save vazio ao fecho (2026-08-09).** É o item 3 do
`PENDENTES.md`, e é pedido do dono: *"dá uma testada no jogo como um todo: se as coisas estão
encaixadas certinho, o que precisa ser feito, o passo a passo, os capítulos, as coisas
acontecendo na sequência."* Substitui o Relatório 2 (2026-08-08), cujos bugs vivos foram
reconferidos um a um e estão marcados abaixo como CORRIGIDO ou SEGUE.

Papel em `EQUIPE.md`. **Território: `test/` e este arquivo. Nada em `src/` foi tocado** — o que
só passa mudando o jogo está aqui como BUG, não como conserto. Nada commitado, nada empurrado.

Alvo: `index.html` da RAIZ como está na `main` (`60700b0`), **sem build**, 390×844, dsf 2,
toque real (Playwright, `hasTouch`). `node test/smoke.js` contra esse arquivo: **PASS**.

## Como foi feito

| instrumento | o que faz |
|---|---|
| `test/percurso.js` (existia, morreu antes de virar relatório; **corrigido** aqui) | a travessia inteira por toque: boot → capítulo 1 → fronteira → fecho → A TRAVESSIA → PALMARES → SALVADOR → AINDA AQUI → fim; A HISTÓRIA página a página; o dia 2. Prints `test/X-*.png`. |
| `test/encaixe.js` (**novo**) | 8 blocos de asserção sobre coisas que desencaixam **em silêncio absoluto** — sem erro de console, sem tela em branco, sem print óbvio. Sai 1 na primeira falha. |

**Um conserto no `percurso.js`, e ele é uma armadilha que vale registrar:** duas rodadas
mediram *"+0 de impacto no dia 2"* e não havia bug nenhum. `body.emTela` translada `#controls`
para fora da tela e a volta tem transição; medir a caixa do botão dourado no MESMO instante em
que a classe sai devolve a posição de FORA, e os 30 toques seguintes caem no vazio. Repro
independente com espera: **+96 de impacto em 30 toques**, tudo normal. As esperas entraram no
arquivo com a nota do porquê.

---

# 1 · A SEQUÊNCIA, ELO POR ELO

Percorrida na ordem, por toque. Onde há semente, ela pula **grind**, nunca tela, fala ou decisão.

| # | elo | veredito | medido |
|---|---|---|---|
| 1 | boot com save vazio → menu | **encaixa** | `telaMenu` aberta, 4 botões (JOGAR · A HISTÓRIA · DE ONDE VEM · AJUSTES), painel de retorno fechado |
| 2 | JOGAR → cerimônia → abertura PINDORAMA | **encaixa** | cerimônia dura **2.000 ms** sozinha; abertura de 5 falas, 3 com imagem; **5.989 ms** do JOGAR ao fim, tocando depressa |
| 3 | a rua, primeiro quadro | **encaixa** | nenhuma tela aberta, rótulo PINDORAMA, cartões ANDAR/MELHORIAS/MENU |
| 4 | os primeiros 45 s a dedo | **encaixa** | 282 toques → **374 de impacto (8,31/s)**, 1.748 px de chão, 24,9% da cena. Projeção até a 1ª virada: **2,3 min** |
| 5 | virada de CENA 0→1 (dentro de PINDORAMA) | **SALTA** | o único texto que aparece é o float **"NOVA ERA"** — e a era não mudou (§2, `N4`) |
| 6 | fronteira → fecho de PINDORAMA | **encaixa** | 6 falas, violência com sujeito, termina em "e o que elas construíram tem nome" |
| 7 | fecho → **A TRAVESSIA** | **encaixa como corte** | entra sem cerimônia, HUD some, `body.travessando`, PULAR escondido na 1ª vez |
| 8 | A TRAVESSIA por dentro | **QUEBRA** | 17 falas · **15 imagens** → tudo depois da fala 8 escorrega (`N1`, ALTA). E ela **não anda sozinha**: 25 s sem tocar = linha 0 (`N2`, ALTA) |
| 9 | as 5 verticais | **QUEBRA** | `p08-captura` e `p09-navio` no lugar; `p10-travessia` e `p11-oceano` já uma fala adiante do texto que as chama; **`p07-africa` cai na fala do Brookes** |
| 10 | a frase do oceano · Curitiba · Paraguai | **encaixa** | as três presentes e na ordem (`O Atlântico é o maior cemitério…` na 10, Curitiba na 8, Paraguai na 9) |
| 11 | o botão inerte | **encaixa em parte** | inerte, sim — mas **aceso e rotulado `+1.0`** (`N7`) |
| 12 | travessia → cerimônia → PALMARES | **encaixa** | desemboca em `PALMARES@2`, cerimônia, abertura de 5 falas |
| 13 | PALMARES, 30 s a dedo | **encaixa · o verbo é cumprido** | 281 (9,37/s), **+13 acolhidas**, fila viva de 5 |
| 14 | fecho de PALMARES → SALVADOR | **REPETE / cola** | sem travessia entre eles, fecho (4) e abertura (5) viram **um bloco contínuo de 9 falas** sem corte perceptível (`N11`) |
| 15 | SALVADOR, 30 s a dedo | **encaixa · o verbo é cumprido** | 307 (10,23/s), **7 pela mão + 9 pela corrente** — a palavra corre sem o dedo |
| 16 | SALVADOR, a pintura | **SALTA** | corte vertical no meio da tela, **salto de 122/255** e **sem espelho** (`N5`) |
| 17 | fecho de SALVADOR → AINDA AQUI | **REPETE / cola** | outro bloco de 9 falas coladas |
| 18 | AINDA AQUI, 30 s a dedo | **encaixa, mas sem verbo próprio** | 290 (9,67/s), 0 acolhidas, 0 palavra — o texto diz que é o trabalho do capítulo 1, "não é coincidência" |
| 19 | o fecho do jogo (10.500) | **FALTA** | 3 falas e a pessoa volta para **a mesma rua, barra em 100%**; 40 toques depois: +56 e nada acontece (`N3`, ALTA) |
| 20 | A HISTÓRIA (26 páginas, save do DIA 1) | **encaixa** | 26 páginas de 844 px, rolo 21.944, barra 0, montagem **928 ms**, **7 pontos de parada** (7,10,12,14,20,21,24), véu da saída presente |
| 21 | o dia 2 (save de 9 h, `ultimo` = ontem) | **encaixa** | painel abre ACIMA do menu e é alcançável; 4 linhas, ×1,02, "17 pessoas acolhidas"; um toque fecha |
| 22 | dia 2 → JOGAR → lista de eras | **encaixa** | 4 eras, 2 vencidas, 1 `livre`, 1 `presa` |
| 23 | escolher o capítulo da FRONTEIRA | **CORRIGIDO** | retoma em `SALVADOR@4`, `visitando: false`, **não rebobina** — o B1 do Relatório 2 morreu |
| 24 | visitar um capítulo antigo | **encaixa por dentro, FALTA por fora** | `PINDORAMA@0`, fronteira intacta em 4, nada avança — e nada na tela diz que se está visitando nem como sair (`N10`) |
| 25 | os nichos de drop da onda 11 | **encaixa** | nascem ocultos, aparecem no instante do primeiro item, a fileira cresce um a um |
| 26 | a seta da microdica | **encaixa** | mede o nicho já visível: **erro horizontal 0 px**, 4 px abaixo dele, dentro da tela |

## O verbo prometido, capítulo a capítulo — a mão faz o que o texto promete?

É a tese do produto, e a resposta é **sim em três dos quatro**, com um asterisco no quarto.

| capítulo | o que a abertura promete | o que a mão fez em 30 s |
|---|---|---|
| PINDORAMA | *"Alcance quem puder"* · três coisas que enchem contador | 8,31/s, os três contadores enchem, a folha só cai para quem pula |
| PALMARES | *"alcançar é acolher. Quem chega vem ficar"* | **+13 acolhidas, 5 andando atrás dela** |
| SALVADOR | *"alcançar é levar palavra: quem você alcança passa a saber"* | **7 pela mão, 9 pela corrente** — a palavra propagou sozinha |
| AINDA AQUI | *"o trabalho aqui é o mesmo do primeiro capítulo"* | exatamente isso: 0 acolhidas, 0 palavra. **O texto não mente — mas o jogo termina com a mecânica com que começou** |

O `encaixe.js` §5 passou a cobrar isso por asserção: o texto da abertura e a chave do motor
(`CAP_GENTE`/`CAP_PALAVRA`) têm de concordar. Hoje concordam nos quatro.

---

# 2 · BUGS, por gravidade

## N1 — ALTA · A TRAVESSIA tem 17 falas e 15 imagens: as verticais do dono estão duas casas atrás

`TRAVESSIAS[0].linhas` tem **17** itens; `TRAVESSIAS[0].imgs` tem **15**. O cabeçalho do próprio
bloco manda o contrário, em voz alta: *"A lista tem o MESMO tamanho de `linhas`, posição por
posição."* As duas comparações que o dono pediu em 08/08 (Curitiba e Guerra do Paraguai)
entraram como falas 8 e 9 e **ninguém acrescentou as duas posições na lista de imagens**.

`abrirFala` faz `falaImgs = linhas.map((_, i) => (imgs && imgs[i]) || null)`. Lista curta não dá
erro: ela só **cala** as duas últimas falas e **empurra** todas as imagens depois do buraco para
a fala errada.

**Repro** (`node test/encaixe.js`, bloco 1 — e confirmado ao vivo, fala por fala):

| fala | o texto | a imagem que aparece hoje | a que o comentário do arquivo manda |
|---|---|---|---|
| 8 | *Um milhão e oitocentas mil pessoas é a cidade de Curitiba inteira* | `p11-oceano` | — |
| 10 | *O Atlântico é o maior cemitério de africanos do mundo* | (nenhuma) | `p11-oceano` |
| **12** | *A imagem que quase todo livro usa — o desenho de um navio visto de cima, com centenas de corpos encaixados lado a lado…* | **`p07-africa`** | (nenhuma — a recusa é dita sobre o mar) |
| **14** | *Quem foi trazido não era carga, não era número e não era "escravo"… não o que elas eram* | (nenhuma) | **`p07-africa`** |
| 15, 16 | as duas últimas | mudas por lista curta | — |

**Por que isto é o mais grave desta rodada, e por que é §2 e não estética.** `p07-africa` é a
cidade africana viva — mercado, forja, gente carregando, criança brincando. Ela existe, e o
comentário do arquivo diz isso com todas as letras, para ser a **prova** da frase *"não o que
elas eram"*. Hoje ela pousa em cheio na fala que descreve o diagrama do *Brookes* — a única
imagem que este jogo se recusa a usar, e que o texto está ali para recusar. O leitor vê a
cidade africana enquanto lê *"desenha pessoas como padrão de carga"*, e a leitura natural é
que a imagem **ilustra** a frase. É uma afirmação que ninguém escreveu, num trecho que existe
inteiro para não afirmar coisa errada.

Print: **`test/E-trav-linha12.png`**. É o print para levar ao dono.

## N2 — ALTA · A TRAVESSIA não anda sozinha (SEGUE, e agora tem número no elo certo)

Era o gap nº 5 do Relatório 2; agora foi percorrido pelo caminho do jogo.

**Repro** (`percurso.js` §2): entrar na travessia pela virada de verdade e **não tocar em nada
por 25 s**. Medido: `linha 0 → 0`, `travessiaT 26`, relógio andou de 764 para 1016. O desenho no
`src/jogo.ts` promete *"dura o que o texto durar (~90 s)"* — os 90 s são o tempo de **quem
toca**. Quem larga o telefone fica na primeira linha para sempre, num trecho em que o HUD sumiu,
o botão não responde e **não há nenhum outro sinal de que o jogo está vivo**.

Print: `test/X-08-travessia-25s-sem-tocar.png`.

## N3 — ALTA · o jogo acaba e não diz que acabou

**Repro** (`percurso.js` §3): impacto em `LIMIAR_FIM` (10.500) → o fecho de AINDA AQUI abre
(3 falas) → a pessoa é devolvida **à mesma rua, na mesma cena, com a barra em 100%**. Medido:
40 toques depois do fecho rendem +56 de impacto, nenhuma fala, progresso parado em 100%.

Não há tela de fim, crédito, convite, nem sequer uma mudança de rótulo. O percurso inteiro —
quatro capítulos, uma travessia, sete cenas — termina sem fecho de **produto**. E é o elo que
mais decide se alguém volta: a última coisa que o jogo faz é não fazer nada.

Prints: `test/X-18-fecho-final.png`, `test/X-19-depois-do-fim.png`.

## N4 — MÉDIA · a virada de CENA anuncia "NOVA ERA", e a era não mudou

`verificarCenario()` (`src/jogo.ts` l. 4951) cria o float com o texto `"NOVA ERA"` dentro de
`if (!vira)` — isto é, **exatamente quando a próxima cena pertence ao MESMO capítulo**. O
comentário logo acima explica bem por que o float não fala na virada de capítulo (a placa
grande já diz o nome); ninguém releu o texto que sobrou para o outro caso.

**Repro** (`encaixe.js` bloco 2, e print de rua real): impacto em `LIMIAR_CENA` estando em
PINDORAMA@0. Medido: `cena 0→1, ainda em PINDORAMA | floats: NOVA ERA`.

Print: **`test/X-05-virada-de-cena.png`** — "NOVA ERA" no meio da tela e a placa embaixo dela
ainda dizendo PINDORAMA. É a perna **ensina** falhando na única frase que aparece no momento em
que a paisagem troca.

## N5 — MÉDIA · SALVADOR está partida ao meio por um corte vertical

A pintura de SALVADOR mostra, a qualquer momento, uma **descontinuidade vertical no meio da
tela**: metade escura e fria, metade clara e quente, duas ruas que não se encontram.

**Medido** (varredura de luminância numa linha a 35% da altura do `#fundoHD`, procurando o
maior salto entre colunas vizinhas, e depois o erro de espelho em torno dele):

| capítulo | maior salto | erro de espelho em volta |
|---|---|---|
| PINDORAMA | 48/255 | 24 |
| PALMARES | 45/255 | 20 |
| AINDA AQUI | 64/255 | 56 |
| **SALVADOR** | **122/255** | **93** |

O corte anda com o chão (não é uma emenda de canvas parada na tela), e é **2,5× mais forte** que
o pior dos outros capítulos. O §4 do `CLAUDE.md` diz que a cópia espelhada elimina a emenda
porque "uma borda só encontra o próprio reflexo"; em SALVADOR o que está na tela não se reflete.

Prints: **`test/E-02-salvador-emenda.png`** e `test/X-15-salvador-30s.png` (esta apanhada em
partida de verdade, sem provocação). Decisão é da Direção de Arte; o número é meu.

## N6 — MÉDIA · o bit da travessia é gravado no COMEÇO dela (SEGUE do Relatório 2, B2)

`correrTravessia` faz `S.travessias |= (1 << i)` e `salvar()` **antes** de abrir a fala.
Medido nesta rodada, na primeira linha: `bit gravado JÁ: 1`. Recarregar ali devolve o PULAR sem
que ninguém tenha atravessado — e os minutos em que o botão é inerte são exatamente a janela em
que alguém troca de aplicativo no celular.

## N7 — MÉDIA · o botão dourado promete `+1.0` durante a travessia (SEGUE do Relatório 2, B7)

Medido: rótulo `"+1.0"`, aceso, **10 toques = +0,00 e 0 falas avançadas**. É a única coisa na
tela que promete o que não vai acontecer, e o jogo passou os 15 minutos anteriores ensinando a
tocar justamente ali. A saída existe, mas é tocar em **outro** lugar — e a seta *"toque para
continuar"* está a **0,35 de opacidade**. Continua sendo dúvida aberta do Dev para a Arte.

Prints: `test/X-07-travessia-linha1.png`, `test/E-trav-linha12.png`.

## N8 — MÉDIA (era BAIXA) · os três recursos não sobrevivem ao boot — e agora isso APARECE

`S.recursos` não está no `ESQUEMA_SAVE`, então não é gravado. Era B5 do Relatório 2 e estava
como BAIXA porque *"não quebra nada"*. **A onda 11 mudou o custo disso.** Antes, os três
contadores estavam sempre na tela mostrando zeros; agora os nichos **só existem enquanto o
número diz alguma coisa**. Quem fecha o dia 1 com três lajes de pedra na fileira volta no dia 2
com a fileira vazia — o HUD encolhe, e o encolhimento é a leitura de "você perdeu o que tinha".

**Repro** (`encaixe.js` bloco 6, ciclo de vida real, sem semear nada): jogar por toque →
`{"flor":0,"agua":0,"refeicao":2}` → recarregar → `{"flor":0,"agua":0,"refeicao":0}`. Impacto,
cena, fronteira e falas lidas voltam inteiros; só os recursos somem. Decidir se persistem é do
PM; registrar que hoje não persistem, e que a onda 11 tornou a perda visível, é meu.

## N9 — MÉDIA · três folhas na tela querendo dizer três coisas diferentes

Na mesma faixa de 40 px do alto: o **placar** é um ícone `leaf`, e o primeiro **nicho de drop**
(flor) é o ícone autoral `folha`. Em baixo, o **botão dourado** mostra uma terceira folha ao lado
de `+1.0`. Três desenhos de folha simultâneos para: impacto acumulado, quantidade de um recurso,
e ganho por toque. Print: **`test/E-01-nicho-e-seta.png`** — as duas folhas do alto lado a lado.

## N10 — MÉDIA · visitar um capítulo antigo não tem saída ensinada (SEGUE)

**Repro** (`percurso.js` §5): MENU → JOGAR → PINDORAMA estando em SALVADOR. Medido:
`visitando: true`, barra em **100%**, sussurro vazio, marco vazio, 40 toques não movem a cena.
Nada na tela diz que se está visitando, e a saída (MENU → JOGAR → escolher o capítulo da
fronteira) não é ensinada em lugar nenhum. Print: `test/X-27-visitando-pindorama.png`.

## N11 — MÉDIA · quando não há travessia, fecho e abertura viram um bloco só

**Medido** (`percurso.js` §3): na virada PALMARES→SALVADOR o instrumento leu **9 falas
consecutivas** sem que `falaAberta()` fechasse uma única vez — as 4 do fecho de PALMARES e as 5
da abertura de SALVADOR, na mesma caixa, com o mesmo gesto. Idem em SALVADOR→AINDA AQUI.

A cerimônia acontece (o smoke afirma a ordem `fecho → cerimônia → abertura`), mas ela é overlay:
**o dedo não sente onde um capítulo acabou e outro começou**. A virada PINDORAMA→PALMARES não
tem esse problema porque A TRAVESSIA respira entre as duas — e é justamente a comparação que
mostra o que falta nas outras duas.

## N12 — BAIXA · a gaveta de MELHORIAS nasce fechada e nada diz que ela existe

**Medido** (`percurso.js` §1): ao fim dos primeiros 45 s a pessoa tem **374 de impacto** e o `u1`
custa 150 — ela já podia ter comprado duas coisas. `sheetUpgrades.aberto: false`, e o único
sinal na tela é o cartão MELHORIAS no rodapé, sem nenhum destaque quando há saldo.

## N13 — BAIXA · o rolo diz `proximity` e a documentação diz "encaixe obrigatório"

`#listaCenas` tem `scroll-snap-type: y proximity`. O comentário três linhas acima dele diz
*"scroll-snap com encaixe obrigatório"*, e a onda 10 do `DIRECAO.md` fala em *"7 pontos finais"*.
Com `proximity`, soltar entre ~35% e ~65% de uma página **não assenta**: medido em três posições
de largada (0,5 · 1,4 · 2,6 de página), o rolo ficou onde foi solto, com duas meias páginas na
tela. Nas outras duas (0,25 · 0,75) assentou.

**Limite dito por inteiro:** o headless não produz arremesso com momento — três caminhos
tentados (arrasto de ponteiro, roda, `scrollTop`) e só o terceiro move o rolo. O número acima é
de largada programática. **Isto precisa de um dedo de verdade num aparelho** antes de virar
ticket; o que afirmo sem reserva é a divergência entre o que o CSS faz e o que a documentação
diz que ele faz.

## Confirmações e enterros do Relatório 2

- **B1 (a lista de eras rebobinava a cronologia): CORRIGIDO.** Escolher o próprio capítulo
  retoma (`cena 4 → 4`), visitar um antigo não move a fronteira (`fronteira 4` intacta), e o
  smoke ganhou o bloco `cronologia` que vigia isso. Era o bug mais grave da rodada anterior.
- **B3 (as páginas sem imagem eram uma janela de 12% para o jogo rodando): CORRIGIDO** no
  quadrinho — `#listaCenas` recebeu fundo opaco próprio. Fica registrado que `.tela` continua em
  `rgba(12,10,7,.88)` para as **outras** telas (menu, AJUSTES, DE ONDE VEM), o que é a decisão
  declarada "a tela é o mundo" e não bug.
- **B2, B5, B7: SEGUEM**, agora como N6, N8 e N7.
- **B4 (barra de vida colada na personagem) e B6 (relógio adiantado): NÃO RE-MEDIDOS.** O
  `hostil.js` do Relatório 2 não sobreviveu à sessão que o escreveu. Declaro o buraco em vez de
  repetir de cabeça o que não medi.

---

# 3 · O PASSO A PASSO QUE FALTA

Onde uma pessoa nova fica sem saber o que fazer. Em ordem de encontro:

1. **Minuto 1 — as melhorias.** Ela tem saldo para comprar e nada na tela diz que há o que
   comprar (N12). É o primeiro degrau de progressão do jogo e ele é invisível.
2. **Minuto ~3 — a virada de cena.** A paisagem troca e a única palavra na tela mente (N4).
   Não há nada dizendo o que acabou de acontecer nem o que muda.
3. **A TRAVESSIA — onde tocar.** O jogo ensinou um botão; ali o botão está aceso, promete
   `+1.0` e não responde (N7). O que funciona é tocar em qualquer outro lugar, e o único aviso é
   uma seta a 0,35 de opacidade. Quem larga o telefone não é resgatado por nada (N2).
4. **A virada de capítulo sem travessia** — nove falas coladas e nenhuma pausa que diga "isto
   aqui foi um capítulo inteiro" (N11).
5. **Visitar um capítulo antigo** — sem indicação de estado nem de saída (N10).
6. **O fim** — o jogo acaba e não avisa; a pessoa continua tocando numa rua que não anda mais
   (N3).

O padrão dos seis é o mesmo, e vale dizer em uma frase: **o jogo ensina bem o gesto e não ensina
nenhuma transição.** Tudo o que é "estado mudou" — cena nova, capítulo novo, trecho sem jogo,
visita, fim — chega sem contorno.

---

# 4 · GAPS — o que ninguém está olhando

Lista do Relatório 2 conferida item a item, mais o que apareceu agora.

1. **A travessia INTEIRA em tempo real — SEGUE, e piorou de natureza.** Continua sem ninguém
   esperar os 90 s; e agora sabemos por quê: **não há 90 s.** O trecho não tem duração própria.
   Testar "o que acontece entre o segundo 30 e o 85" deixou de ser uma tarefa possível antes de
   alguém decidir se o trecho anda sozinho.
2. **Uma resolução só — SEGUE.** Tudo aqui rodou em 390×844. Nenhuma medida em tela curta.
3. **Relógio hostil — SEGUE.** Meia-noite virando com a sessão aberta e fuso trocado entre
   sessões continuam sem caso.
4. **Ciclo de vida de verdade — FECHADO.** Era o gap nº 9; virou o bloco 6 do `encaixe.js`:
   joga por toque, recarrega, e confere que impacto, cena, fronteira e falas lidas voltam
   inteiros (e que os recursos não voltam — N8). Fecho o gap.
5. **O quadrinho do DIA 1 — FECHADO EM PARTE.** Era o gap nº 6. Percorrido com save de dia 1:
   26 páginas, 7 pontos de parada, véu presente, nenhuma travada. O que **continua** sem
   asserção de conteúdo são as páginas `qMais` ("E MAIS N MARCOS À FRENTE"), que são justamente
   o motivo de voltar amanhã.
6. **Custo de montar o quadrinho — AGORA TEM NÚMERO: 928 ms** num save de dia 1, do toque em
   A HISTÓRIA até a tela montada. É quase um segundo de nada acontecendo depois de um toque, e
   ninguém tinha medido. Nenhum número ainda sobre memória.
7. **O gesto de verdade no rolo — ACRESCENTO como gap de FERRAMENTA.** Três caminhos tentados,
   nenhum reproduz arremesso com momento em headless. Enquanto isso não existir, tudo o que a
   onda 10 fez de ritmo é verificado por estilo computado, nunca por comportamento.
8. **A promessa de privacidade — ACRESCENTO, e já entrou como asserção.** A tela de AJUSTES diz
   *"NADA SAI DESTE APARELHO · O JOGO NÃO TEM REDE"*. É a única afirmação do jogo com data de
   validade marcada (o §3 do `CLAUDE.md` avisa que o Supabase a torna falsa). O bloco 8 do
   `encaixe.js` amarra a frase à CSP: se `connect-src` abrir e a frase ficar, o teste reprova.
9. **A forma do arco — ACRESCENTO, e é de PM, não de teste.** Quatro capítulos, três verbos, e
   o quarto repete a mecânica do primeiro **de propósito e por escrito**. Ninguém decidiu se
   isso lê como fecho ("o trabalho continua o mesmo, e é esse o ponto") ou como anticlímax. É a
   pergunta do último elo do percurso, e ela não tem dono.
10. **Confirmo os dois grandes sem nada a acrescentar:** nenhum humano jogou isto (H1 segue sem
    denominador) e doze capítulos não cabem no arquivo único.

---

# 5 · ASSERÇÕES NOVAS — `test/encaixe.js`

Oito blocos, escolhidos por um critério só: **coisas que, quando desencaixam, desencaixam sem
erro de console, sem tela em branco e sem print óbvio.** Roda contra o `index.html` da raiz sem
build. Estado hoje: **3 asserções vermelhas, todas bug de verdade** (N1 ×2 e N4).

1. **A lista de imagens tem o tamanho da lista de falas** — para EPOCAS e TRAVESSIAS. Hoje:
   4 aberturas verdes, `TRAVESSIAS[atlantico]` **VERMELHA** (17 × 15). Mais uma asserção de
   conteúdo: `p07-africa` tem de pousar na fala que ela prova — **VERMELHA**.
2. **"NOVA ERA" só quando a era é nova** — **VERMELHA**.
3. **Os nichos de drop e a seta da microdica (onda 11)** — nascem ocultos; o placar fica; o
   nicho aparece no mesmo instante em que o contador enche; a seta mede um nicho **já visível**
   (rect 26×26, erro horizontal 0 px, 4 px abaixo, dentro da tela); a fileira cresce um a um.
   Verde. É o item 7 do ticket, e ele está são.
4. **Toda virada tem fecho, abertura, cena e "quando"**, e nenhum é vazio — capítulo novo que
   entrasse sem `fecho` seria pulado em silêncio. Verde nos quatro.
5. **O verbo prometido tem mecânica atrás** — o texto da abertura e `CAP_GENTE`/`CAP_PALAVRA`
   têm de concordar. Verde nos quatro. É a tese do produto virada asserção.
6. **Um ciclo de vida de verdade** — joga por toque, recarrega, confere. Verde no que persiste;
   imprime em voz alta o que não persiste.
7. **O ritmo do rolo (onda 10)** — 7 pontos de parada em 26, alinhamento `start`, véu da saída
   existente. Verde.
8. **A promessa de privacidade e a CSP** — uma não pode mudar sem a outra. Verde.

**Uma armadilha do próprio teste, anotada no arquivo para o próximo:** `beforeunload` grava o
save ao sair, então `localStorage.clear()` seguido de `reload()` devolve exatamente o estado que
se tentou apagar. Sem neutralizar `salvar` antes, todo teste de save vazio testa o save de
ontem.

---

# 6 · ESTADO

- `node test/smoke.js` contra o `index.html` da raiz, **sem build: PASS**, zero erro de console
  em todas as passadas (percurso completo, `encaixe.js`, `prints-vento.js`, `prints-grao.js`).
- `node test/encaixe.js`: **FALHOU em 3 asserções** — e as três são N1 (duas) e N4. Vermelho
  honesto.
- Prints novos em `test/`: `E-01-nicho-e-seta.png`, `E-02-salvador-emenda.png`,
  `E-trav-linha4/8/12/14.png`, e os 27 `X-*.png` do percurso, regravados nesta passada e
  olhados um a um.
- Alterado fora dos prints: `test/percurso.js` (as esperas que consertam o falso "+0" do dia 2)
  e `test/encaixe.js` (novo). **Nada em `src/`. Nada commitado.**

**Se for para pegar um único item desta lista, pegue o N1.** É o mais barato de consertar (duas
posições numa lista), é o único que toca o §2, e é o que está hoje no ar mostrando a cidade
africana viva embaixo do parágrafo sobre o diagrama do *Brookes*.
