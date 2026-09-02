# Como provar que funciona

**Feature**: 001-painel-derivado · **Data**: 2026-09-01

Cinco provas. Cada uma corresponde a um critério de sucesso do [spec](./spec.md), e cada uma tem
de terminar num **exit code**, não numa impressão. Enquanto as cinco não passarem, a feature não
está pronta — mesmo que a tela pareça certa.

---

## Antes de tudo

```bash
npm run build
```

O build é quem gera o retrato. Se ele não gerar, nada abaixo faz sentido — e essa é a primeira
coisa a conferir quando algum passo daqui parecer inexplicável.

---

## Prova 1 — SC-001: a tela fica certa sem ninguém escrever à mão

**A prova que decide se a feature valeu.** Se ainda for preciso escrever à mão para a tela estar
certa, a fonte não foi trocada: foi acrescentada.

1. Não escreva nada no estado durante uma rodada inteira de trabalho.
2. Ao fim, confira que a tela mostrou o estado certo em todas as amostragens.

```bash
node test/pulso-derivado.js
```

O portão faz isso sem esperar uma rodada real: monta retratos de várias idades e confere o que a
tela deriva de cada um. **Exit 0 = a derivação está certa.**

## Prova 2 — SC-002: a rodada morta some sozinha

Uma máquina entrega, some, e o relógio anda. Ninguém escreve nada.

O portão desloca o relógio da página (a mesma técnica do `painel-sem-sinal.js`, que já está em
produção) e cobra que a máquina **saia da faixa AGORA** dentro do teto. Sem `sleep`: espera o
evento, com teto de tempo — `sleep` cego é como um portão vira lento e mentiroso ao mesmo tempo.

## Prova 3 — SC-003: zero "ativo" para sinal velho

O caso exato de 01/09: um sinal de **315 minutos**. A tela não pode dizer "agora" para ele, em
nenhum caminho — nem no texto, nem na posição, nem na animação.

Já coberto pelo portão que está em produção; aqui ele passa a ser cobrado **também** sobre o dado
derivado, e não só sobre o dado escrito à mão.

## Prova 4 — SC-005: nenhuma credencial no que é publicado

```bash
node ferramentas/construir.js
```

O build já recusa escrever se achar credencial na saída. Esta feature **não acrescenta nenhuma**,
por desenho — a prova aqui é negativa e é justamente por isso que ela é barata: não há o que
proteger.

## Prova 5 — SC-006: o portão morde (Artigo IV)

O portão planta, de propósito, cada um destes e **exige exit 1**:

| o que se planta | o que tem de acontecer |
|---|---|
| um retrato velho apresentado como atual | reprova |
| um instante no futuro | reprova (vira *não sei*, não vira "agora") |
| um retrato com forma errada | reprova se a tela tratar como "nada acontecendo" |
| o arquivo ausente | reprova se a tela mostrar faixa vazia em vez de *não sei* |
| um item travado há dias | reprova se aparecer como trabalho em andamento |

Se algum destes **passar**, o portão está mentindo, e o próprio portão sai 1 dizendo isso. É a
lição que custou duas rodadas de QA em 01/09: exigir que "alguma coisa acuse" não protege asserção
nenhuma — cada plantio cobra o conjunto exato que ele deve derrubar.

---

## O que NÃO prova nada, e vale dizer

- **Olhar a tela e ela parecer certa.** Foi assim que o defeito viveu horas: a tela parecia
  perfeita, com boneco martelando, sobre um sinal de cinco horas.
- **O portão passar sem nunca ter sido visto reprovando.** Ver a Prova 5.
- **Uma rodada em que alguém escreveu à mão.** Isso prova que a escrita à mão funciona, que já se
  sabia. A Prova 1 exige o contrário: que ninguém escreva.
