# CINCO-MINUTOS.md — os primeiros cinco minutos, medidos

**QA de produto · 2026-08-09.** A lente do critério do dono (§6f do `CLAUDE.md`) que nunca
tinha sido usada: *alguém que abre o jogo agora entende o que fazer? Onde trava?*

Alvo: o `index.html` da **raiz**, como está no disco, sem build. 390×844, dsf 2, toque real
(Playwright, `hasTouch`), `localStorage` limpo em contexto novo. **Nada em `src/` foi tocado.**
Zero erro de console nas quatro rodadas.

**Cinco minutos de relógio, inteiros, em todas as rodadas — não houve redução.** A CURIOSA já
tinha uma rodada parcial de 45 s no disco (`--rapido`, do agente anterior); ela foi refeita
por inteiro e é a de 300 s que está aqui.

| instrumento | o que faz |
|---|---|
| `test/cinco-minutos.js` (do agente anterior; ganhou a 4ª pessoa) | os bots, o coletor de eventos com carimbo de tempo, a tabela por minuto, os prints |
| `test/cinco-lista-eras.js` (novo) | por que A CURIOSA passou 184 s parada na tela ESCOLHA A ERA |
| `test/cinco-drops.js` (novo) | contraprova: o "zero drops" é do jogo ou do instrumento? |

## As quatro pessoas, e por que são quatro

O ticket pediu três. A quarta nasceu de um achado do primeiro minuto: **o ponto que define A
TÍMIDA — o centro da metade direita da tela, (292, 422) — cai em cima do `telaMenu`**, porque o
jogo abre no menu e o menu é a tela inteira. A TÍMIDA literal do ticket nunca chega a ver a rua.
Isso é resultado, não defeito do bot, e está reportado como tal. Mas ele engoliria a pergunta 3,
então entrou **A TÍMIDA-DENTRO**: um único toque em JOGAR e, daí em diante, idêntica — a cada
3 s, sempre o mesmo pixel, sem nunca descobrir o pulo nem o botão dourado.

---

# 1 · A TABELA POR MINUTO

`impacto` = acumulado · `hist.` = telas de história abertas (cerimônias + falas) · `linhas` =
linhas de texto histórico efetivamente lidas · `chegadas` = pessoas/coisas alcançadas ÷ que
atravessaram a tela · `drops` = recolhidos ÷ perdidos · `dicas` = microdicas que apareceram ·
`u1?` = a primeira melhoria já está comprável.

## A PARADA — abre e não toca em nada

| min | impacto | hist. | linhas | chegadas | drops | dicas | u1? |
|---|---|---|---|---|---|---|---|
| 1 | 8 | 0 | 0 | — | 0/0 | 0 | não |
| 2 | 16 | 0 | 0 | — | 0/0 | 0 | não |
| 3 | 36 | 0 | 0 | — | 0/0 | 0 | não |
| 4 | 40 | 0 | 0 | — | 0/0 | 0 | não |
| 5 | 56 | 0 | 0 | 0 ÷ 144 | 0/0 | 0 | não |

**Dois eventos em cinco minutos**, os dois no primeiro segundo e meio: o estado inicial (0,2 s)
e a primeira chegada nascendo atrás do menu (1,5 s). Depois disso, **298,5 s sem um único
evento**. Ela termina os cinco minutos olhando exatamente a tela do segundo zero.

O impacto sobe sem ninguém tocar em nada porque **o mundo roda por trás do menu** e a
personagem colhe folha ao passar. É o único sinal de vida da tela — e é invisível, porque o
número está atrás do logo. Prints: `test/CINCO-parada-00-boot.png` e
`test/CINCO-parada-02-150s.png`. **São a mesma tela, com dois minutos e meio entre elas**; o que
mudou é a paisagem rolando ao fundo.

## A TÍMIDA — um toque a cada 3 s, sempre em (292, 422)

| min | impacto | hist. | linhas | chegadas | drops | dicas | u1? |
|---|---|---|---|---|---|---|---|
| 1 | 16 | 0 | 0 | — | 0/0 | 0 | não |
| 2 | 52 | 0 | 0 | — | 0/0 | 0 | não |
| 3 | 72 | 0 | 0 | — | 0/0 | 0 | não |
| 4 | 96 | 0 | 0 | — | 0/0 | 0 | não |
| 5 | 112 | 0 | 0 | 0 ÷ 142 | 0/0 | 0 | não |

**100 toques, zero respostas.** Mesmos dois eventos da PARADA, mesmo vão de 298,2 s. O ponto
dela cai na madeira do menu, entre o subtítulo e a tábua do JOGAR, e ali não há alvo nenhum. O
impacto que sobe é o mesmo mundo rodando sozinho — ou seja, **os 112 de impacto dela não têm
relação com os 100 toques que ela deu**.

## A TÍMIDA-DENTRO — o mesmo toque, mas já na rua

| min | impacto | hist. | linhas | chegadas | drops | dicas | u1? |
|---|---|---|---|---|---|---|---|
| 1 | 24 | 2 | 5 | — | 0/0 | 1 | não |
| 2 | 76 | 2 | 5 | — | 0/0 | 1 | não |
| 3 | 128 | 2 | 5 | — | 0/0 | 1 | não |
| 4 | 176 | 2 | 5 | — | 0/0 | 1 | **sim (217,0 s)** |
| 5 | 228 | 2 | 5 | **0 ÷ 132** | 0/0 | 1 | sim |

A linha do tempo dela, inteira: cerimônia e abertura de PINDORAMA de 1,5 s a 30,3 s (5 falas),
a rua às 33,2 s, a microdica **ESQUERDA PULA** às 36,3 s — e **nada mais até os 217,0 s**, que é
quando a primeira melhoria fica comprável sem que nada na tela diga isso. **Momento morto:
180,7 s.** Três minutos em que a única coisa que muda na tela é um número subindo de um em um.

Print: `test/CINCO-timida-dentro-03-toque-40.png` — 77 de impacto, a barra de PINDORAMA quase
vazia, a fileira dos três contadores **ausente** (ela nunca recolheu nada), e uma barra de vida
azul flutuando sobre um vulto que ela não vai derrubar.

## A CURIOSA — toca em tudo

| min | impacto | hist. | linhas | chegadas | drops | dicas | u1? |
|---|---|---|---|---|---|---|---|
| 1,1 | **2.455** | 2 | 5 | — | 0/0 | 1 | sim (23,5 s) |
| 2 | 3.365 | 5 | 33 | — | 0/0 | 1 | sim |
| 3 | 3.437 | 5 | 33 | — | 0/0 | 1 | sim |
| 4 | 3.509 | 5 | 33 | — | 0/0 | 1 | sim |
| 5 | 3.575 | 5 | 33 | **0 ÷ 223** | 0/0 | 1 | sim |

Ela abriu a bandeja de MELHORIAS aos 16,8 s e, aos **20,2 s**, comprou a primeira coisa do jogo:
o **×100 TESTE**, que é grátis. Daí em diante o botão dourado passou a dizer **+300,0** (print
`test/CINCO-curiosa-04-bandeja.png`). Consequência medida: **PINDORAMA inteiro terminou aos
76 s**, A TRAVESSIA correu de 77 s a 101 s, e ela estava em PALMARES **aos 1 min 42**. Os
capítulos 1 e 2 de um jogo de quatro, no primeiro terço dos cinco minutos.

E aos **117,2 s** ela abriu a tela ESCOLHA A ERA e **não saiu mais dela até os 301 s** — 183,9 s
parada. Ver §6, com a ressalva de instrumento que esse número exige.

---

# 2 · AS CINCO PERGUNTAS

## 1. Qual é o primeiro momento em que o jogo diz o que fazer?

**Três respostas diferentes, e a distância entre elas é o problema.**

- **Para quem não toca em JOGAR: nunca.** Em 300 s a PARADA e a TÍMIDA não receberam uma única
  palavra de instrução. O menu tem quatro tábuas e um subtítulo — *"um jogo sobre quem já
  estava aqui"* — e nenhum dos cinco textos diz o que a mão faz.
- **A primeira frase que diz o que fazer** chega dentro da abertura de PINDORAMA, na **4ª de 5
  falas**: *"Aqui você vai fazer o trabalho do dia. O que passa precisa de alguém. Alcance quem
  puder."* Medido: **24,3 s** para quem lê no ritmo da TÍMIDA-DENTRO; **8,6 s** para quem toca
  depressa. Ela diz o **verbo**, não o **gesto** — "alcance" não informa que se toca a metade
  direita da tela.
- **A primeira frase que ensina um gesto** é a microdica **"ESQUERDA PULA"**, aos **36,3 s**
  (12,2 s na CURIOSA). Ela dura 2,8 s, é desenhada no canvas e ensina o pulo — que é a metade
  **secundária** da interface. **A metade principal, o golpe, nunca é ensinada por texto
  nenhum**: ela é descoberta por acidente, e é o acidente que arma a dica do pulo.

## 2. Quanto tempo até a primeira decisão real?

Depende de a pessoa achar a bandeja, e a diferença entre os dois casos é de **quase três
minutos e meio**:

| quem | quando a 1ª melhoria fica comprável | quando ela ficaria sabendo |
|---|---|---|
| A CURIOSA (abriu MELHORIAS por conta) | 23,5 s | 23,5 s |
| A TÍMIDA-DENTRO | **217,0 s** | **nunca dentro dos 5 min** |

E há um asterisco que desqualifica a palavra "decisão": na mesma bandeja, ao lado das três
melhorias com preço, está o **×100 TESTE, que custa zero**. Uma escolha em que uma das opções é
gratuita e vale cem vezes mais que as outras não é decisão — é um botão certo. A CURIOSA achou
em 20,2 s.

A **primeira escolha oferecida** de fato é anterior a todas: o cartão de ritmo **CORRER/ANDAR**,
visível no primeiro quadro da rua (a CURIOSA trocou aos 15,5 s). Mas ele não se apresenta como
decisão: não há custo, não há texto, e nada na tela diz o que muda ao trocar.

## 3. A TÍMIDA fica presa?

**Sim, e de duas maneiras diferentes — a segunda é a séria.**

**Presa na porta.** A TÍMIDA literal do ticket nunca sai do menu: 100 toques, 5 minutos, zero
respostas, porque o ponto dela cai na madeira entre o subtítulo e o JOGAR. Nada acontece e nada
sinaliza que ali não há nada.

**Presa no loop, que é pior.** Já dentro da rua, ela toca 100 vezes e **não conclui um único
alcance em cinco minutos** — 132 vultos atravessaram a tela, nenhum foi alcançado. A causa não é
azar; é aritmética: `CFG.mobHp` vale **5 (fumaça), 8 (dinheiro) e 13 (tambor)**, e um toque
solto tira **1**. Derrubar o mais fraco exige cinco golpes no mesmo alvo, ou seja **15 s** no
ritmo dela — e ninguém fica 15 s na frente dela.

**A contraprova** (`test/cinco-drops.js`): segurando o botão dourado, que repete a ~7 golpes/s,
**40 s rendem 20 chegadas atendidas, 19 drops recolhidos, os três contadores em 5/6/8 e 358 de
impacto**. O mesmo jogo, a mesma rua, o mesmo minuto.

O que isso significa em produto: **o jogo só acontece para quem segura o botão, e nada na tela
ensina a segurar.** Quem toca solto passa cinco minutos vendo um número subir de um em um e
**nunca vê o evento central do jogo** — ninguém é alcançado, nenhum drop cai, nenhum dos três
contadores aparece, a microdica da seta nunca dispara, e a promessa literal da 5ª fala da
abertura (*"cada uma enche um contador lá em cima"*) fica sem cumprimento visível.

## 4. O que aparece nos primeiros 30 s que ela não sabe o que é?

Percorrido elemento por elemento, na rua, com save novo. "Explica?" = existe algo **no jogo**
que diga o que aquilo é.

| elemento | o que é | explica? |
|---|---|---|
| chip com folha + número (`chipTaxa`) | impacto acumulado | **não** — nem rótulo, nem unidade |
| barra `PINDORAMA` (`linhaEpoca`) | progresso até a próxima cena (1.500 de impacto) | **não** — enche sozinha e nada diz até onde |
| os três contadores (`recursos`) | flor · água · refeição | **a fala 5 promete**, e eles **não estão na tela**: nascem ocultos e só aparecem com o primeiro drop — que a mão solta nunca consegue. A explicação chega antes da coisa |
| cartão **CORRER** (pé) | troca o ritmo do mundo | **não** — sem custo, sem texto, sem consequência dita |
| botão dourado, folha + **+1.0** | o golpe, e o quanto rende | **sim, em parte** — o número é autoexplicativo; que ele **repete se segurar** não é dito em lugar nenhum, e é a informação mais valiosa da tela (§ pergunta 3) |
| cartão **MELHORIAS** | abre a bandeja | **não** — e não muda de aparência quando há saldo para comprar |
| cartão **MENU** | volta ao menu | sim |
| barra azul sobre os vultos | a vida do que atravessa | **não** — e é justamente o número que explica por que os toques dela não resolvem |
| `sussurroEra` e `marcoDist` | avisos de "falta pouco" e "marco em N passos" | ficam vazios nos primeiros 30 s; o primeiro `MAIS ADIANTE` só apareceu na CURIOSA, aos 49,3 s |
| **×100 TESTE**, na bandeja | interruptor de teste, grátis | **não** — e é o único cartão sem preço, o que o faz ler como "o de graça" |

Três folhas verdes convivem nessa tela querendo dizer três coisas diferentes (impacto, um dos
recursos, ganho por toque). Já era o N9 do relatório 3; nos primeiros 30 s ele custa mais, porque
é quando nenhuma das três tem significado ainda.

## 5. Onde está o momento morto?

| quem | maior vão sem nada novo | onde |
|---|---|---|
| A PARADA | **298,5 s** | do segundo 1,5 ao fim. Os cinco minutos inteiros |
| A TÍMIDA | **298,2 s** | idem |
| A TÍMIDA-DENTRO | **180,7 s** | de 36,3 s (a microdica do pulo) a 217,0 s (u1 comprável, sem aviso) |
| A CURIOSA | 5,2 s dentro da rua · **183,9 s** presa na tela ESCOLHA A ERA | ver §6 |

**O momento morto do jogo é o trecho de 36 s a 217 s da TÍMIDA-DENTRO**, e ele é o mais
importante dos quatro porque é o único que descreve alguém jogando de verdade: passada a
abertura, o jogo não tem **nenhum** evento agendado para os três minutos seguintes. Nada
aparece, nada muda de estado, nada é dito. A primeira coisa nova que o motor tem para oferecer
depois do boot é a virada de cena, que exige **1.500 de impacto** — no ritmo da mão solta,
**mais de meia hora**.

---

# 3 · OS TRÊS CONSERTOS MAIS BARATOS

Ordenados por **quanto melhoram o primeiro minuto por linha de código**. Todos em `src/`; nada
foi alterado — isto é diagnóstico, não conserto.

## 1º — a microdica que falta: **SEGURE**

**Arquivo: `src/jogo.ts`, linha 8360** (onde a dica do pulo é armada, dentro do
`pointerdown` do canvas) — com o estado espelhando as linhas **2448-2452** e o desenho as
**6655-6661**, que já existem prontos para a outra dica.

Hoje aquela linha diz, ao primeiro toque na metade direita:

```
if (!dicaPuloVista && dicasValem()) { dicaPuloVista = true; dicaPuloAte = relogio + 2.8; }
```

Ou seja: o jogo já detecta o primeiro golpe, já tem o mecanismo de dica efêmera, já tem a fonte,
e usa tudo isso para ensinar **o pulo**. Falta uma segunda dica, no mesmo lugar e no mesmo
molde, dizendo que **o botão repete se você segurar** — ou, melhor ainda, armada quando o motor
vê o que os bots viram: um alvo saindo da tela com a vida arranhada.

**O que compra:** a diferença medida entre 0 chegadas em 100 toques e 20 chegadas em 40 s. É a
única das três que muda o que a pessoa **consegue fazer**, e não só o que ela vê. Custo estimado:
três linhas de estado, uma condição, e uma string — o bloco de desenho já serve os dois casos.

## 2º — o **×100 TESTE** não pode nascer visível num save novo

**Arquivo: `src/index.html`, linha 237.**

```
<div class="upgrade teste" id="cardU4"><span class="nome">×100<br>RÁPIDO</span><button id="btnU4"></button></div>
```

A linha 238, logo abaixo, já mostra o padrão pronto: `<div class="upgrade teste oculta"
id="cardU5">`. **Uma palavra** (`oculta`) esconde o cartão; uma condição em JS o devolve a quem
o queira (impacto acima do primeiro limiar, ou uma porta em AJUSTES). O `CFG.custoU4 = 0` da
linha 121 do `jogo.ts` tem, ao lado, o comentário honesto: *"the test switch: free, and it ends
the progression"*.

**O que compra:** a CURIOSA comprou aos 20,2 s e liquidou dois dos quatro capítulos antes dos
2 minutos. Enquanto ele estiver ali, **os cinco minutos que este relatório mede não existem**
para quem abre a bandeja — e abrir a bandeja é exatamente o que se quer que a pessoa faça.

## 3º — **MELHORIAS** precisa acender quando há saldo

**Arquivo: `src/jogo.ts`, linhas 8218-8223** (`rotuloMelhorias()`), que já é chamada em toda
abertura e fechamento da bandeja e já sabe trocar a palavra do cartão entre `MELHORIAS` e
`FECHAR`. Falta o terceiro estado: **há algo comprável agora**.

**O que compra:** fecha o momento morto de 180,7 s exatamente onde ele termina. A TÍMIDA-DENTRO
alcança os 150 aos **217,0 s** e o jogo não dá **nenhum** sinal; a CURIOSA só soube porque abriu
a gaveta por curiosidade. Duas linhas em JS e uma regra de CSS. (Era o N12 do relatório 3, com
medida nova: agora sabemos que o silêncio dura três minutos e é o vão mais longo da partida.)

---

# 4 · O QUE ESTE RELATÓRIO NÃO PROVA

- **A tela ESCOLHA A ERA, e o número de 183,9 s.** A CURIOSA toca no **centro geométrico** de
  `#listaCapitulos`, e o centro (195, 416) cai num **vão de 10 px entre duas tábuas** — o toque
  pousa no contêiner, não num botão. Uma pessoa acertaria uma tábua. **O achado que sobrevive à
  ressalva** (medido em `test/cinco-lista-eras.js`, print
  `test/CINCO-curiosa-08-presa-nas-eras.png`): **três toques em cima de uma tábua TRANCADA não
  mudam um único byte do HTML da página** — nem classe, nem tremor, nem linha explicando por que
  não abre. A tela tem VOLTAR, então ninguém fica preso de verdade; mas o alvo maior da tela é
  mudo, e mudo é o que o relatório 3 já chamou de "o jogo não ensina nenhuma transição".
- **Nenhum humano jogou isto.** Quatro bots com padrões fixos não são quatro pessoas. O que os
  números sustentam é o **limite inferior**: se um bot que toca 100 vezes não vê um único
  alcance, o problema não depende de talento.
- **Uma resolução só.** Tudo aqui é 390×844.
- **Nada foi medido depois dos 5 minutos**, exceto a sonda do APAGAR (que estava no instrumento
  do agente anterior) e as duas contraprovas.

# 5 · ESTADO

- Rodadas: `parada`, `timida`, `timida-dentro`, `curiosa`, **300 s cada**, save limpo,
  **zero erro de console** nas quatro.
- Dados: `test/cinco-{parada,timida,timida-dentro,curiosa}.json` e os `.log` ao lado.
- Prints: `test/CINCO-*.png` (19), olhados um a um.
- Alterado: `test/cinco-minutos.js` (a 4ª pessoa), `test/cinco-lista-eras.js` e
  `test/cinco-drops.js` (novos). **Nada em `src/`. Nada commitado.**
