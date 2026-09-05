# CORTE DAS CÉLULAS DOBRADAS DE `GENTE_EP_B64` — veredito visual da direção de arte

**05/09** · item `praca-tres-celulas-mostram-pessoa-em-dobro` · nada em `src/` foi tocado.
Ferramentas novas: `test/arte-receita-corte-gente.js` (a receita + a prova) e
`test/arte-varre-celulas-gente.js` (a varredura). Provas: `test/CORTE-*.png`.

---

## 0. O que mudou na leitura do item, e é a primeira coisa

O item nomeia **4 células dobradas** (3 em A PRAÇA + 1 em PINDORAMA). A varredura das **13
folhas / 312 quadros** achou **6**:

| capítulo | célula | célula (px) | vão de colunas vazias | fração |
|---|---|---|---|---|
| praca | `f0q3` | 330×258 | 24 px em x=153 | 50,0% |
| praca | `f2q3` | 323×268 | 28 px em x=147 | 49,8% |
| praca | `f2q6` | 322×268 | 27 px em x=146 | 49,7% |
| pindorama | `f2q6` | 295×253 | 52 px em x=113 | 47,1% |
| **temfonte** | **`f2q5`** | 324×257 | 29 px em x=153 | 51,8% |
| **segurou** | **`f2q5`** | 314×257 | 42 px em x=138 | 50,6% |

As duas últimas são novas: **TEM FONTE e O QUE SEGUROU têm o mesmo defeito** e nenhum item as
nomeia. Elas fecham a conta (ver §3).

---

## 1. `aprovado` — as 6 células se cortam limpas, e este é o ponto de corte de cada uma

Olhei as seis ampliadas a 2× sobre xadrez, com o perfil de tinta por coluna desenhado embaixo
(`test/arte-receita-corte-gente.js`). **Nas seis: duas figuras completas, sem sobreposição,
separadas por um corredor de 24 a 52 colunas de alfa zero.** Nenhuma metade fica cortada.
Nenhum veto por célula.

**O corte NÃO é no meio geométrico**, e a razão está no motor, não no gosto. `src/jogo.ts:6393-6396`:

```js
const sc = mobEhGente ? (GENTE4_ALVO / img.naturalHeight) : ...
const dw = Math.round(img.naturalWidth * sc), dh = Math.round(img.naturalHeight * sc);
const dx = Math.round(cxm - dw / 2), dy = Math.round(GROUND - lift - dh);
```

A âncora horizontal é o **centro da célula**, não a cabeça. Então quem decide se a pessoa anda
reto é **onde a cabeça cai dentro do retângulo novo** — a mesma regra que o §5 do `CLAUDE.md`
já manda ("registre pela cabeça"). Medido: cortar no centro do vão deixa as duas metades com a
cabeça a **−14,5 e −4** do centro (praca `f0q3`), enquanto as 7 células irmãs da fileira vivem
entre −13,5 e −10. Isso é **10,5 px de fonte de diferença entre as duas metades, 3× a amplitude
natural da fileira** — a mulher daria um passo de lado uma vez por ciclo.

**A receita, então:** janela que (a) contém a tinta inteira da figura, (b) é simétrica em torno
de `C = cabeça − T`, com `T` = deslocamento canônico da cabeça naquela fileira, e (c) completa
com transparente o que sobrar fora da folha. A largura pode ficar alguns px maior que a das
irmãs — não custa nada, porque **a escala vem da ALTURA**.

### As coordenadas, em px de fonte, prontas para o dev

| célula | fileira: T | metade **A** (recorte x) | metade **B** (recorte x) |
|---|---|---|---|
| `praca f0q3` (330×258) | f0: **−11** | `[0 .. 158)` — larg 158 | `[176 .. 334)` — larg 158, **+4 px transparentes à direita** |
| `praca f2q3` (323×268) | f2: **−7** | `[−4 .. 148)` — larg 152, **+4 px transp. à esquerda** | `[172 .. 322)` — larg 150 |
| `praca f2q6` (322×268) | f2: **−7** | `[−3 .. 147)` — larg 150, **+3 px transp. à esquerda** | `[169 .. 321)` — larg 152 |
| `pindorama f2q6` (295×253) | f2: **−9,5** | `[0 .. 114)` — larg 114 | `[164 .. 300)` — larg 136, **+5 px transp. à direita** |
| `temfonte f2q5` (324×257) | f2: **−6** | `[−8 .. 154)` — larg 162, **+8 px transp. à esquerda** | `[181 .. 327)` — larg 146, **+3 px transp. à direita** |
| `segurou f2q5` (314×257) | f2: **+10,5** | `[0 .. 138)` — larg 138 | `[179 .. 319)` — larg 140, **+5 px transp. à direita** |

Erro residual da cabeça depois do corte: **0 a 0,5 px de fonte** (≈0,08 px de mundo) em todas as
doze metades. A altura da célula **não muda** — é ela que carrega a escala.

Confirmado que as metades cabem na fileira (mediana das irmãs): altura da figura dentro de
0,8%, **largura da cabeça dentro de 4,2%**, linha do pé dentro de 2 px. Nenhum pulo de escala.

### As poses, descritas

- **`praca f0q3`** — moça de prancheta e bolsa a tiracolo. *A:* passada aberta, pé de trás
  apoiado, torso reto. *B:* a mesma passada com o pé da frente um pouco mais adiante e a bolsa
  recuada. Distância entre as duas: 1,38 (mediana da fileira 1,91) — **são duas poses**.
- **`praca f2q3`** e **`praca f2q6`** — rapaz de mochila e livros. As quatro metades são
  passadas abertas quase iguais entre si (0,59 e 0,78; e `f2q3A ≈ f2q6A` a **0,43**).
- **`pindorama f2q6`** — a mais bem-comportada das seis. *A:* passo curto, calcanhar de trás
  levantado (abertura de pés 44,6% da altura). *B:* passada longa, os dois pés apoiados
  (51,4%). Distância 3,74 contra mediana 3,01 da fileira — **as duas metades são as poses mais
  distintas de toda a fileira**, e caem exatamente na alternância curto/longo que os outros seis
  quadros já fazem. O corte aqui é ganho puro.
- **`temfonte f2q5`** (mulher de óculos com pilha de livros) e **`segurou f2q5`** (senhor de
  sacola de feira): duas passadas limpas cada, sem sobreposição.

---

## 2. A conta que fecha sozinha — cada fileira pousa em **8** sem copiar nem esvaziar nada

`test/embutir-gente.js` **recusa folha que não tenha 24 quadros**, e o `tapar-buraco-gente.js`
documenta por que 7 não serve (o laço cobriria 39,12 px contra 45,04 de passada desenhada =
**13,1% de deslize**, a armadilha nº 1 do §7). Então a fileira tem de continuar com oito.

Medi quais quadros são **byte-idênticos** hoje (lendo o índice de `__ART` dos `pack-*.json`, não
olhando pixel):

```
pack-naodito.json  arte[54] serve a 2:  praca f0q6 , praca f0q7
pack-naodito.json  arte[63] serve a 2:  praca f2q0 , praca f2q1
pack-naodito.json  arte[92] serve a 2:  segurou f2q6 , segurou f2q7
pack-hoje.json     arte[44] serve a 2:  temfonte f2q0 , temfonte f2q7
```

São as cópias que o `tapar-buraco-gente.js` deixou em 04–05/09 tapando buracos. **Cada fileira
com célula dobrada tem exatamente um buraco tapado ou vazio** — e o corte produz exatamente um
quadro novo para ocupá-lo:

| fileira | hoje | depois do corte (8 quadros, todos reais) |
|---|---|---|
| `praca f0` | q3 dobrada · q7 = cópia de q6 | q0 q1 q2 **q3A q3B** q4 q5 q6 |
| `praca f2` | q3 e q6 dobradas · q1 = cópia de q0 · q7 vazia | q0 q2 **q3A q3B** q4 q5 **q6A q6B** |
| `pindorama f2` | q6 dobrada · q7 vazia (1×1) | q0 q1 q2 q3 q4 q5 **q6A q6B** |
| `temfonte f2` | q5 dobrada · q7 = cópia de q0 | q0 q1 q2 q3 q4 **q5A q5B** q6 |
| `segurou f2` | q5 dobrada · q7 = cópia de q6 | q0 q1 q2 q3 q4 **q5A q5B** q6 |

**Resultado:** 6 cortes retiram 2 quadros vazios, 4 cópias e 6 pessoas em dobro, e as cinco
fileiras terminam com 8 quadros autorais. Nada é inventado, nada é copiado, nada sobra.
Em PINDORAMA a alternância curto/longo/curto/longo fica **intacta** com o corte na posição
natural.

---

## 3. `veto` — três coisas que não entram

1. **Corte no meio geométrico da célula (50% da largura).** Não é o defeito de meio pixel: dá
   até **10,5 px de fonte de descasamento entre as duas metades**, contra 3,5–4,5 px de
   amplitude natural da fileira. A pessoa passa a dar um passo lateral uma vez por ciclo.
   O motivo visual está no §1 e a coordenada certa está na tabela.
2. **Forçar a largura mediana da fileira nas células novas.** Foi a primeira receita que tentei
   e ela **decepa braço e pé** em 4 das 12 metades (medido). A largura da célula não carrega
   escala nenhuma — deixe a janela crescer os poucos px que precisar.
3. **Fechar o item dizendo "PINDORAMA resolvido".** No mesmo `pindorama f2` está o defeito
   descrito em §4, que é MAIOR do que o do corte, e é a fileira do capítulo de §2.1. Fechar o
   corte é correto; fechar a fileira, não.

Nenhum veto por célula: as seis se cortam.

---

## 4. `pedidos` — o que a varredura achou e ninguém tinha medido

### 4.1 CÉLULA INCHADA: 13 quadros em que a pessoa **encolhe ~25% e flutua ~9 px acima do chão**

Pela mesma linha `sc = GENTE4_ALVO / img.naturalHeight` e `dy = GROUND − dh`: uma célula mais
alta que a figura **encolhe a pessoa e a solta do chão**. Medido, em 11 capítulos:

| capítulo · quadro | célula | figura firme | encolhe | flutua (px de mundo) |
|---|---|---|---|---|
| cais `f2q0` | 181×341 | 137×266 | 28,2% | 9,24 |
| segurou `f2q0` | 168×331 | 133×256 | 29,3% | 9,52 |
| palmares `f2q0` e `f2q7` | 179/183×337 | ~131×263 | 28,1% | 9,22 |
| **pindorama `f2q0`** | **157×319** | **111×251** | **27,1%** | **8,82** |
| portas `f2q0` | 183×334 | 133×263 | 27,0% | 8,93 |
| naodito `f2q0` | 214×340 | 183×269 | 26,4% | 8,77 |
| pequenaafrica `f2q0` | 193×339 | 145×269 | 26,0% | 8,55 |
| aceiro `f2q0` e `f2q7` | 178/184×333 | ~144×275 | ~21% | ~7,4 |
| hoje `f2q0` | 184×340 | 155×282 | 20,6% | 7,04 |
| jabaquara `f2q0` | 183×336 | 149×271 | 24,0% | 8,13 |

Em `GENTE4_ALVO = 42`, flutuar 9 px é **21% da altura do corpo**. Uma vez por ciclo de oito
passos a pessoa daquele capítulo encolhe um quarto e sobe do chão. É visível a olho na tira —
compare `f2q0` com `f2q1` em `test/CORTE-pindorama-f2.png` e em `test/CORTE-segurou-f2.png`.

**A causa, medida em `pindorama f2q0` e não suposta:** a figura de verdade ocupa `y 1..251` e
`x 46..156`; o resto da célula é transparente **exceto um único pixel em y=318 com alfa 31**.
Um cisco quase invisível estica a célula em 67 linhas. É a mordida do desfranjamento do §5
falhando por baixo do limiar.

**Pedido ao dev-jogo (item novo, camada média):** retrimar as 13 células com o mesmo limiar que
o jogo usa para decidir se há figura, e provar por antes/depois medindo `altura na tela` e
`largura da cabeça na tela` — hoje `pindorama f2q0` chega com cabeça de **8,03 px** contra
**9,87** nas seis irmãs. O corte das dobradas e este retrim são independentes e podem ir juntos
ou em rodadas separadas.

### 4.2 SALVADOR: a folha inteira 13–20% menor que a dos outros capítulos

As 24 células de `salvador` são 189×299 com figuras de 249 a 284 px — inflação **uniforme**,
então não há solavanco dentro da fileira, mas a gente daquele capítulo chega na rua **12 a 20%
menor** que a dos outros doze. É a mesma classe da 4.1 com prioridade menor; entra na fila,
não bloqueia nada.

### 4.3 O que este item **não** conserta, e é bom estar escrito

**Nenhuma dessas fileiras é um ciclo de caminhada.** Medi a fase da passada (abertura dos pés em
% da altura da figura):

- `praca f0`: 56,6 · 58,6 · 60,2 · 59,0 · 58,2 · 57,8 · 56,6 · 58,6 · 58,6 → **amplitude 3,6 pp**
- `praca f2`: 54,1 a 55,6 → **amplitude 1,5 pp**
- `pindorama f2`: 43,8 · 47,4 · 44,2 · 51,0 · 44,2 · 48,2 · 44,6 · 51,4 → **alterna curto/longo**

Uma passada de verdade vai de pés juntos (~10%) a pés abertos (~55%). A PRAÇA fica travada no
máximo em **todos** os quadros: aquelas duas pessoas não caminham, **deslizam numa lunge**. Só
PINDORAMA tem duas fases alternando, e por isso lê como caminhada (grossa, mas caminhada).

Isso é **arte nova**, não corte — e é o pedido de arte que vale mais que os outros dois. Deixo o
diagnóstico registrado e **não** peço a arte nesta rodada, porque pedido de arte precisa da
imagem de referência na mesa (lição do EQUIPE.md) e a decisão de refazer folha de gente de um
capítulo passa pela fila do dono. **O que não pode acontecer é alguém cortar as seis células e
anunciar que a caminhada foi consertada** — ela não foi; o que foi consertado é a pessoa aparecer
em dobro.

---

## 5. `duvida`

**Nenhuma bloqueante, e a de §2.1 eu respondi medindo em vez de devolver.** Registro as duas
verificações para ninguém refazer:

1. **PINDORAMA — o corte cria representação nova?** Não. Olhei as duas metades ampliadas
   (`test/CORTE-pindorama-f2.png`): é a **mesma anciã**, mesmo penteado, mesmo colar, mesma
   pintura corporal, mesma vasilha de cerâmica, mesma saia — duas fases da mesma caminhada.
   O corte não recorta objeto nenhum (o vão de 52 px é o mais largo das seis), não muda pose,
   não muda leitura. E o que ele **remove** é o que o §2.1 tem razão de temer: hoje, num passo
   de oito, ela aparece **duplicada lado a lado** — figura repetida lê como ornamento, não como
   gente. Foi exatamente o argumento com que a historiadora barrou o remendo em 04/09; o corte
   o resolve em vez de contorná-lo.
2. **Ela é golpeada?** Não. `pindorama` está em `CAP_FILA` (`src/jogo.ts:2920`), então
   `pessoaNaRua()` vale `true` e a gramática de bater não se aplica.

**A pergunta que eu não decido e não é urgente**, deixada nomeada para o dono se um dia a fila
chegar nela: cada capítulo tem **três** pessoas (uma por fileira), cada uma repetida em laço. Em
PINDORAMA isso significa que o capítulo dos povos originários mostra três indivíduos em
repetição. Não é erro do corte nem deste item — é uma pergunta de acervo, e é dele.

---

## 6. Ferramentas — o que existe e o que falta

| ferramenta | serve para o corte? |
|---|---|
| `test/cortar-gente.js` | **Não.** Corta a folha ORIGINAL de `assets/entrada/` por mancha de tinta e **exige exatamente 8 manchas por fileira** — é ele que produziu a célula dobrada, porque as duas figuras não se separaram na varredura de magenta. Refazer por aqui é reabrir a mesma porta. |
| `test/tapar-buraco-gente.js` | **Não, e o item já diz.** Ele **copia** a pose vizinha; foi ele que criou as 4 cópias byte-idênticas do §2. |
| `test/recortar-folha.js` | **Não diretamente.** Tem `--quadros=` para escolher e reordenar células, e faz o desfranjamento — mas parte da folha em magenta, não de `GENTE_EP_B64` já cortado. |
| `test/embutir-gente.js` | Emenda a folha pronta no `src/jogo.ts`. **Recusa se não vierem 24 quadros** e recusa se a chave já existir — trocar folha existente vai precisar de uma porta explícita. |
| `test/cortar-pacote.js` | Outro assunto (vegetação). |

**Não existe ferramenta que aceite um ponto de corte customizado numa célula já cortada.**

**Pedido ao dev-jogo:** uma ferramenta que leia o quadro atual de `GENTE_EP_B64[cap][f][q]`,
recorte a janela `[x0, x1)` dada na linha de comando (aceitando `x0 < 0` e `x1 > largura` como
preenchimento transparente), reencode em WebP na qualidade da casa (0,76 para gente) e devolva
os DOIS quadros na posição pedida da fileira, mantendo os 24. As coordenadas estão na tabela do
§1 e saem reproduzíveis de `node test/arte-receita-corte-gente.js <cap> <fXqY,...>` — rode-a
antes e depois e **compare as tiras `test/CORTE-*.png`**: se a cabeça sair da linha vermelha
tracejada em qualquer quadro, o corte errou.

E, do lado do portão: `test/qa-praca-o-que-a-pessoa-ve.js` continua **fora** do `npm test`. Ele
tem de ser pendurado **antes** do corte, como o aceite do item já manda — e agora ele tem cinco
capítulos para cobrir, não um.

---

## Linha do placar (pregar em `EQUIPE.md` §5 na integração)

| 05/09 | arte (corte das celulas dobradas de GENTE_EP_B64) | rodadas 1 | achados 6 | reais 6 | desmentidos 0 | do dono 1 | Veredito VISUAL, nada em src/ tocado. (1) O item nomeia 4 celulas dobradas; a varredura das 13 folhas achou **6** — temfonte f2q5 e segurou f2q5 sao novas. (2) Cortar no meio geometrico esta ERRADO e o motivo e o motor: `dx = cxm - dw/2` ancora pelo CENTRO DA CELULA, entao o corte no meio do vao deixa as metades com a cabeca a -14,5 e -4 numa fileira cuja amplitude natural e 3,5 — receita entregue com as 12 coordenadas em px de fonte, erro residual 0 a 0,5 px. (3) A conta fecha sozinha: as 5 fileiras afetadas tem exatamente 1 buraco tapado/vazio cada (4 copias byte-identicas provadas pelo indice `__ART` dos pack-*.json), e cada corte produz 1 quadro real para ocupa-lo — todas pousam em **8 quadros autorais**, zero copia, zero vazio. (4) Achado MAIOR que o item, nao medido por ninguem: **13 celulas INCHADAS em 11 capitulos** fazem a pessoa encolher 20-29% e **flutuar ate 9,5 px de mundo acima do chao** uma vez por ciclo (pindorama f2q0: causa isolada = UM pixel de alfa 31 em y=318 esticando a celula em 67 linhas). (5) Achado que reenquadra o item: **nenhuma dessas fileiras e um ciclo de caminhada** — abertura de pes de praca f0 varia 3,6 pp e de praca f2 varia 1,5 pp em 9 quadros; elas deslizam numa lunge. So pindorama alterna duas fases. Cortar conserta a pessoa em dobro, NAO a caminhada. §2.1: nenhuma duvida devolvida — verificado por medida que o corte de pindorama nao cria representacao nova (mesma anciã, mesma vasilha, o vao de 52 px nao toca objeto) e que ela nao e golpeada (CAP_FILA, jogo.ts:2920); o 1 "do dono" e a pergunta de acervo (3 pessoas por capitulo em laco), nomeada e nao urgente. Ferramentas: **nao existe** ferramenta de corte com ponto customizado — pedido escrito; `cortar-gente.js` foi quem PRODUZIU a dobra e `tapar-buraco-gente.js` foi quem produziu as 4 copias. 2 ferramentas novas entregues (`test/arte-receita-corte-gente.js`, `test/arte-varre-celulas-gente.js`) e 5 tiras de prova (`test/CORTE-*.png`). |
