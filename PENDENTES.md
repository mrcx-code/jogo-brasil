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
