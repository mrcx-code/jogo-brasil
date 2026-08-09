# PENDENTES — o que foi revertido ou ficou pela metade, e continua valendo

Regra do dono (2026-08-09): *"tudo bem reverter o que estiver pela metade, mas mantenha como
tarefas ainda pendentes para continuarmos."*

Este arquivo existe porque reverter sem registrar é perder trabalho duas vezes: perde-se o
código **e** o diagnóstico que custou a sessão inteira. **Nada sai daqui sem estar feito ou
sem o dono descartar.** Quem reverter alguma coisa escreve aqui no mesmo commit.

---

## 1. O GRÃO DO CHROME — alto valor, revertido em 09/08

**O diagnóstico, que é o mais valioso da fila visual:** o mundo é pixel art com grão por toda
parte, e o HUD e o rodapé são gradiente CSS **liso** — vetor sobre pixel. É a única hipótese
que explica a queixa do dono (*"o menu de cima e os botões de baixo não parecem do mesmo
jogo"*) ter sobrevivido a **três** ondas de conserto que mexeram em paleta e construção e
nunca no grão.

**A solução desenhada:** três texturas de ruído determinístico (o mesmo `hash01` do mundo)
desenhadas num canvas no boot e servidas ao CSS como `url(data:)` — veio de tábua serrada,
grão de pedra lavrada, e o mesmo grão com metade da força para o metal do botão dourado.
Zero byte de arte no arquivo; `var(--veioPx, none)` deixa o chrome exatamente como era se o JS
não rodar.

**Por que foi revertido:** o gerador ficou órfão — nunca chamado, e o CSS nunca consumiu as
variáveis. Faltava a metade do trabalho.

**Para retomar:** `NOTES.md`, seção "O diagnóstico do GRÃO DO CHROME". Precisa de: chamar
`texturaChrome()` no boot, e somar cada grão como **primeira camada** de `background` nas
superfícies da régua (madeira, pedra, ouro), em pixel de 2 px css — o mesmo passo dos ícones
da onda 7.

---

## 2. O EFEITO DE CORRIDA — nunca implementado

Correr dobra a cadência e muda a tinta do rótulo, e **não há nenhuma resposta visual de
velocidade**. O dono pediu: *"quando tiver correndo, tem que ter algum efeitinho como se fosse
uma corrida de velocidade, pra dar a impressão de fato."*

**Trava:** as folhas de corrida foram recusadas por §2 (pessoa diferente da caminhada), então
**o sprite continua o da caminhada** — o efeito tem que fazer a corrida se ler mesmo com a
pose de andar. Isso é parte do problema, não desculpa. E não se toca na velocidade nem na
cadência: elas são `PASSO × 60 / n` com `n` inteiro, medido.

---

## 3. QA DA SEQUÊNCIA INTEIRA — morreu antes de escrever

O jogo do zero ao fim nunca foi percorrido depois das últimas ~15 integrações. O pedido do
dono era claro: *"se as coisas estão encaixadas certinho, o passo a passo, os capítulos, as
coisas acontecendo na sequência"* — com o critério que é a tese do produto: **em cada
capítulo, a abertura promete um verbo; a mão faz o que o texto promete?**

---

## 4. O HISTORIADOR DO CONTEMPORÂNEO — morreu no limite

O dono apontou o desequilíbrio: *"vc ta focando mto nos indígenas pensando no hoje; podemos
tratar vários temas do Brasil também — momentos políticos, ditadura militar, Covid,
agronegócio acabando com a natureza."* O **agronegócio** é tema que o arco de 12 não cobria e
precisa de desenho próprio (fonte forte: INPE/PRODES, MapBiomas, IBAMA). O relatório chegou a
baixar o PDF do INPE e morreu.

---

## 5. A AUDITORIA HOLÍSTICA — morreu no limite

O que só se vê no conjunto: coerência de paleta entre capítulos, vocabulário visual duplicado,
quantos tamanhos de texto existem de verdade, densidade de informação entre telas. O roteiro
das ondas 10+ ficou com só a onda 10 feita.

---

## 6. A TIPOGRAFIA DO QUADRINHO — parcialmente absorvida

A worktree conflitava com a onda 10 e morreu sem teste. **O essencial foi refeito à mão e está
no ar** (escala um degrau acima, `--titulo` encorpada, logo maior). O que ficou de fora e vale
conferir depois: o comentário do personagem **integrado como no jogo** — pessoa da cintura para
cima, texto embaixo — em vez do balão flutuante ao lado.
