# RETOMADA — leia isto primeiro na próxima sessão

Atualizado em 2026-08-09, com a janela de contexto perto do limite. **Leia depois do
`CLAUDE.md` e antes de tocar em qualquer coisa.** Nada aqui é impressão: tudo foi medido ou
decidido pelo dono, e o `NOTES.md` tem os números.

## A régua que manda em tudo (`CLAUDE.md` §8)

**bonito · divertido · ensina**, os três com o mesmo peso. Entrega que ganha numa às custas
de outra não está pronta. E o §2 inteiro decide-se com o dono — é o único assunto em que
decidir sozinho é a escolha errada.

## O que o dono espera da ARTE (dito em 09/08, já dentro de cada prompt da mesa)

> *"Imagens lindas mas impactantes, de forma artística mas educadora"* · *"e respeitosa,
> apesar dos massacres."*

Quatro pontos operáveis: composição de ilustração de verdade · o que a imagem ENSINA tem que
estar visível · dignidade sempre (rosto individual, nunca massa anônima nem corpo como
espetáculo) · **o peso vem da situação e da luz, não do sangue** — o que faz doer é
reconhecer gente, não ver ferida.

## ESPERANDO O DONO — a mesa (`npm run mesa` → localhost:8200)

1. **`q-p19` refazer** — a legenda cobre o tabuleiro inteiro, e é dele que o texto fala.
   O prompt já pede o tabuleiro no MEIO do quadro.
2. **As 3 folhas de CORRIDA** — recusadas por §2: trazem pessoa diferente da caminhada.
3. **Decisão de PESO**: o arquivo está em **4,3 MB** contra teto de 3,6. Carga sob demanda
   (quebra o arquivo único de saída) ou aceitar o arquivo maior. **Trava o arco a partir do
   6º capítulo.**
4. **Orientação deitada**: o jogo cabe e não quebra em 844×390, mas a composição é de
   retrato. Travar em retrato ou compor para as duas?

**Regra de enquadramento para toda vertical nova, medida:** a página corta pelos **LADOS**
(15,4% de cada), então o assunto cabe nos **70% centrais** e o **terço inferior fica calmo**
— é onde a legenda senta.

## O TICKET DE MAIOR VALOR NA FILA VISUAL

**O grão do chrome.** O mundo é pixel art com grão; o HUD e o rodapé são gradiente CSS liso —
**vetor sobre pixel**. É a única hipótese que explica a queixa do dono (*"não parecem do mesmo
jogo"*) ter sobrevivido a três ondas de conserto de paleta e construção. A solução desenhada
(três texturas de ruído determinístico geradas em canvas e servidas ao CSS como `url(data:)`,
zero byte de arte) está descrita no `NOTES.md`; o código chegou pela metade e foi revertido.

## O que entrou nas últimas horas

Escala do mundo **inteira** em 7 de 7 telas (era 0 de 7 — pixel desigual no jogo inteiro) ·
alvos de toque em 44 px · tipografia um degrau acima e **título com voz própria** (serifa de
ler não titula) · logo 52vw→72vw · **onda 10** (a saída cede o palco, transição do conteúdo,
peso vira tempo com 7 pontos finais) · as **5 verticais da travessia** ligadas linha a linha ·
a frase do oceano com a comparação (Curitiba inteira, 4,5 Guerras do Paraguai) · o ×100 de
volta com marca na retenção · a planta andando **1:1 com o chão**.

## Fila de trabalho, em ordem — e o `PENDENTES.md` é a fonte

**Regra nova do dono (09/08), já no `CLAUDE.md` §6:** *reverter o que está pela metade é
certo, mas registra no `PENDENTES.md` no mesmo commit.* Código morto não entra na `main`;
reverter sem registrar perde o trabalho duas vezes, porque some o código E o diagnóstico.

1. **O grão do chrome** (`PENDENTES.md` 1) — EM VOO agora. É a única hipótese que explica a
   queixa "não parecem do mesmo jogo" sobreviver a três ondas: o mundo tem grão, o chrome é
   gradiente liso. Vetor sobre pixel.
2. ~~O efeito de corrida~~ — **FEITO** (o vento da corrida, 09/08).
3. **QA da sequência inteira** — o jogo do zero ao fim nunca foi percorrido depois de ~15
   integrações. O critério é a tese: *a abertura promete um verbo; a mão faz o que o texto
   promete?*
4. **O historiador do contemporâneo** — ditadura, Covid, polarização e **agronegócio** (tema
   que o arco de 12 não cobria). Fonte forte: INPE/PRODES, MapBiomas, IBAMA.
5. **A auditoria holística** — o que só se vê no conjunto: paleta entre capítulos, vocabulário
   visual duplicado, quantos tamanhos de texto existem de verdade.
6. **O comentário do personagem integrado** — da cintura para cima como no jogo, em vez do
   balão flutuante ao lado (`PENDENTES.md` 6).

## Como trabalhar (não mude sem motivo)

- `npm test` verde **e LEIA A SAÍDA** antes de commitar. `main` é produção.
- Integração de agente: `git diff <base> -- src/ > x.patch && git apply --3way`. Conflito
  entre agentes: **manter os dois lados**.
- **Worktree morta no limite: TESTE antes de descartar.** Duas foram salvas assim (as 19
  imagens, a onda 10) e uma foi revertida por ser código morto. Testar é mais barato que
  refazer.
- **Um agente por vez** enquanto o limite estiver apertado; o que der para fazer sozinho,
  faça — sai muito mais barato.
- `test/medir-telas.js` roda as 7 telas · `test/medir-poluicao.js` a renda/min · `npm test`
  cobra §2 no vocabulário, o quadrinho, a cronologia e o FPS relativo.

## Documentos vivos

`CLAUDE.md` (regras, tese, §2 com as travas e a REGRA DO DOCUMENTO) · `DIRECAO.md` (arte:
a barra premiada, as referências, **A LEI DO RITMO**, ondas 1–10) · `SPRINT.md` (PM) ·
`QA.md` · `EQUIPE.md` · `JOGABILIDADE.md` · `NOTES.md` (Diário, fontes, vocabulário, o arco
aprovado de 12 capítulos).
