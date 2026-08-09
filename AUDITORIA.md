# AUDITORIA HOLÍSTICA — o que só aparece olhando o jogo inteiro

Direção de Evolução/Arte, **2026-08-09**. Nove telas percorridas a 390×844 dsf 2 (menu · fala ·
rua · melhorias · eras · ajustes · história · fontes · chegada). Instrumentos:
`test/aud-holistica.js` (varredura de tipografia/raio/receita por tela, paleta declarada,
pinturas em cover), `test/aud-detalhe.js` (assinaturas completas e quase-duplicatas de cor),
`test/aud-montagem.js`. Prints em `test/AUD-*.png`.

**Onze ondas consertaram partes. Ninguém tinha medido o conjunto.**

> **Síntese em uma linha:** o jogo **não** é um frankenstein — as onze ondas fizeram das telas
> de jogo uma língua só, e ela é medível. O que sobrou é a tela mais nova falando a língua
> velha, um dicionário com verbetes mortos, e uma pintura com o sol pregado no lugar errado.

---

## O que estava BOM, e foi medido

Auditoria que só encontra defeito é auditoria que não mediu.

- **O raio de canto é uma gramática de verdade:** 4 valores computados no jogo inteiro
  (2 · 3 · 4 · 5 px), distribuídos como a régua manda — 2–3 em madeira, 4–5 em pedra — e
  **zero** canto ≥ 8 px em nove telas.
- **Cinco telas com zero texto de sistema:** menu, rua, melhorias, eras e ajustes renderizam
  100% dos rótulos em bitmap 5×7. A onda 6 venceu.
- **Pesos e famílias contidos:** 3 pesos (400/700/900) e 3 famílias no jogo todo.
- **O papel grande é UMA receita byte a byte:** `#falaCaixa`, `#retorno` e `#cfgInfo` têm
  assinaturas de sombra **idênticas** (moldura 3+7 px). Os papéis pequenos (2+5 px) divergem só
  no degrau e na sombra de assentamento sobre imagem — derivação documentada da onda 9.
- **Nicho de contador é um só:** `.rec` e `.chip`, assinaturas idênticas.
- **O ouro cumpre a exclusividade:** 1 assinatura, 1 superfície (`#btnClique`).
- **O valor das pinturas é coeso:** luminância 100–141 nas sete (razão 1,41), nenhuma
  aberração — a quebra de SALVADOR é de temperatura, não de valor.

---

## CONSERTADO no mesmo dia

### 1 · A CHEGADA falava Arial Black
**Medido:** `#fimTit` em *"Arial Black" 900 22px* e os três botões dela em *"Arial Black" 900
13,3px*. A **única** tela do jogo com rótulo em fonte de sistema.
**Mecanismo:** `pintarRotulos()` cobre todo `.telaTit` no boot, mas `montarFim()` **sobrescrevia
o canvas** com `textContent`; e os três botões nunca entraram na lista.
**Consertado:** `pixelRotulo` no título (repintado a cada montagem, porque o texto muda) e nos
quatro botões.

### 2 · 24 das 37 variáveis do `:root` estavam mortas
**Medido:** uso zero para `--bad --barra --barraOn --blue --chromeA --chromeB --chromeS
--chromeT --contorno --creme --gold2 --good --ink --navBg --navOn --ouroB --panel --panel2
--purple --raio --raioSm --sub --tinta --tinta2`. São o vocabulário do motor antigo — o "deep
olive" com painel, trilho de navegação, barra de progresso e semáforo verde/vermelho.
**E elas são a CAUSA do achado 1:** variável morta não é inerte, é convite. Quem pinta uma tela
nova encontra `--panel` declarado, usa, e a tela nasce falando a língua que o jogo levou onze
ondas para desaprender. **37 → 13.**

### 3 · DOM morto
O `✕` da bandeja (`data-close`) estava escondido por CSS desde a unificação dos botões e era o
único portador do atributo — saiu com a varredura que o procurava. E `#modeSub.cv` nunca foi
preenchido: era o único consumidor de `--fs-xs`.

### 4 · Seis camadas de veio que nunca renderam um pixel
Cada receita de madeira (`.telaBtn`, `#btnJogar`, `.ltMarco`, `.capItem`, `.capItem.livre`,
`#poste::before`) declarava o `repeating-gradient` de 2px/8px **depois** do gradiente de
preenchimento. Em `background` a primeira camada é a de cima, e o gradiente do meio é opaco —
o veio ficava embaixo, invisível.
**Provado, não intuído:** `test/prova-camada.js` desenha as duas pilhas paradas, lado a lado, e
compara canal a canal. **Diferença máxima 0** nas quatro receitas. O print do jogo não serviria
— o mundo anda atrás do menu e o relógio do dia muda a luz.

### 7 · A pauta do caderno estava copiada 7 vezes
`repeating-linear-gradient(0deg, rgba(120,90,40,.06) 0 1px, transparent 1px 11px)` idêntica em
`#retorno`, `#cfgInfo`, `#falaCaixa`, `.qBalao`, `.ltMomento`, `.fimLin`, `.fnItem`. O
vocabulário estava certo — é UMA gramática — mas colado, não derivado. Virou `--pauta`, e o
11 px ganhou a explicação que faltava: é metade da entrelinha de 22 do corpo de leitura.

### 9a · O `#btnFalaPular` tinha canto vivo
Único entre os irmãos de madeira pequena (`#linhaEpoca`, `.qAqui`, a tabuinha do menu, todos
com 2 px). Canto é material.

---

## ABERTO — na fila do `PENDENTES.md`

### 5 · O quase-preto está escrito de 16 jeitos
**116 cores hex distintas** no chrome; **54 pares com Δ≤6 por canal**, dos quais **10 com Δ≤2**
(indistinguíveis a olho): `#8d8272~#8d8271` (Δ1), `#0d0b08~#0e0b07` (Δ1), `#1c2010~#1a1e10`,
`#1e1206~#1c1106`, `#2a2418~#2c2418`, `#221806~#241605`, `#4a2f16~#4c3016`, `#16110a~#14100a`.
O grupo quase-negro tem **16 membros** para um papel que a régua nomeia com três tintas
(`#120c06` madeira, `#191510` pedra, `#0a0806` degrau). Os marrons somam **55** (22 escuros +
18 médios + 15 claros) para os ~16–20 que a régua legitima.
**Conserto:** consolidar primeiro os 10 pares Δ≤2 — mecânico e invisível, 116 → ~105.

### 6 · A escala `--fs-*` é decorativa
Os quatro degraus são referenciados **6 vezes em ~45 declarações** de fonte, e **nenhum texto
visível os usa**. O texto vivo tem **9 corpos literais**: 10 · 11,5 · 13 · 13,5 · 14 · 14,5 ·
16 · 19 · 22. Dentro deles, DATA (13 itálico) e FONTE (11,5 itálico) são disciplinados — mas o
**corpo de leitura tem 4 tamanhos**: 16 (fala/retorno), 14,5 (história), 13,5 (fontes), 13
(placar da chegada). Hoje há duas verdades e nenhuma manda.

### 8 · SALVADOR é a única pintura com a luz assada na tinta
**Medido em cover 390×844, a escala EXIBIDA.** Temperatura (R−B) das sete pinturas:
**−30 · −42 · −31 · −47 · +45 · −22 · −48**. Saturação: **61 · 69 · 66 · 68 · 39 · 65 · 57 %**.

SALVADOR está ~90 pontos mais quente e 20–30 menos saturada que todas as irmãs: é um entardecer
dourado **pintado na tinta**, enquanto o sistema de horas tinge as outras seis por cima de uma
luz neutra. De manhã no jogo, seis pinturas amanhecem e uma fica presa no pôr do sol.
**Encaminhado:** a repintura ladrilhável de Salvador já estava na mesa pelo corte vertical de
122/255; o pedido levou junto a régua de luz que faltava (neutra de meio-dia, R ≤ B, saturação
≥ 55%), para a peça não voltar com o mesmo defeito.

### 9b · Rebarbas de uma linha
`.telaTit` usa sombra de baixo −3 px, que não é nem o degrau grande (−4) nem o pequeno (−2). E
o `✕` do `.cartao.fechando` é o único glifo Arial Black dentro do chrome de pedra — a onda 7
tem malha 13×13 para isso, mas passar um `✕` pela 5×7 pede teste, não uma linha.

---

## ⚠ Fora da alçada da direção — medido, não decidido

- **Arte nova para Salvador** (achado 8): imagem é decisão do dono. O achado só acrescenta
  números a um pedido que ele já tem na mesa.
- **A `.telaTxt` da CHEGADA é serifa clara sobre véu escuro** (16 px Georgia `#e6dcc4`): a régua
  diz "nunca texto claro sobre painel preto", mas o CSS registra a escolha como deliberada, e
  mexer aí é mexer no desenho da tela de fim — que tem gap de forma aberto com o dono.
- **Nada nesta auditoria toca §2, logo, nome ou economia.**
