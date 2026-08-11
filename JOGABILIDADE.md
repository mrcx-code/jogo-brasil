# JOGABILIDADE — travessia + lugar vivo

Decidido pelo dono em 2026-08-06: *"não tô vendo muito sentido em ficar correndo o tempo
todo"* → o coração vira **travessia com destino + lugar que se enche de vida**, mantendo
**pelo menos um capítulo no padrão atual** (decisão dele: o cap. 1). Este documento é o
desenho técnico para a implementação não decidir no escuro. Nada aqui é código ainda.

## O diagnóstico que gerou a decisão

Correr não tem sentido porque (a) a estrada é infinita — não há "chegar"; (b) o que se
produz vira número no contador, não coisa no mundo. Idle bom se joga para *voltar e ver o
que cresceu*.

## Parte 1 — a travessia com destino

**O que é:** cada capítulo é um trecho de estrada FINITO com 2–4 marcos visíveis — a
linha do tempo materializada no chão. Chegar num marco dispara a fala daquele momento.
Chegar no último fecha o capítulo. Correr passa a significar "quero chegar logo".

**Como desenhar o marco se aproximando SEM paralaxe nova** (o chão 1:1 é inegociável e a
armadilha nº 1 do §7): o marco é um OBJETO DO MUNDO, como os itens que chegam — uma placa
de madeira fincada no chão, na camada do mundo, rolando 1:1. A "aproximação" é literal:
ela entra pela borda direita quando falta pouco. Para antecipação de longe, um indicador
DISCRETO no HUD (distância até o próximo marco, em passos — o jogo já mede distância
percorrida para o sprite; reusar o contador é custo zero e é o mesmo dado).

**Distância entre marcos:** derivada dos `LIMIARES` de cenário existentes — o capítulo
continua custando o mesmo impacto; o marco só dá corpo ao que hoje é um número invisível.
Nenhuma mudança de economia nesta fase.

> **FEITO, E EM TODO CAPÍTULO — 2026-08-11.** Os marcos deixaram de ser protótipo do capítulo 2.
> A lista de placas se DERIVA da `LINHA_TEMPO` (momento com título, texto e fonte no próprio nó),
> cada uma pertence ao capítulo que contém a `cena` dela, e os `n` marcos de um capítulo dividem
> o vão de impacto dele em `n+1` partes iguais — os quartos do protótipo quando são três, a
> metade quando é um. Quantos cabem sai de **um marco a cada 750 de impacto**, que é o
> espaçamento que o capítulo 2 já tinha e que foi o que se mediu. Hoje: **13 placas em 7
> capítulos**; seis capítulos ficam sem porque não têm momento com fonte. Números, prints e a
> resposta sobre os seis marcos de 1888–1964 no `NOTES.md`.

## Parte 2 — o lugar vivo

**O que é:** cada capítulo tem um LUGAR (o arraial, o pátio da hospedaria, o canteiro, a
tava) que acumula visualmente o progresso. Quem foi alcançado/acolhido aparece LÁ,
morando e agindo — o mecanismo de Palmares (S.grupo, gente que anda com você)
generalizado e persistido.

**Arquitetura barata (fase 1):** o lugar é a FAIXA FINAL do trecho do capítulo — os
últimos ~2 telas antes do marco de fecho. As pessoas acolhidas (`S.grupo` de hoje, que
vira `S.acolhidos[epoca]` no save) são desenhadas nessa faixa com os sprites que já
existem, em poses paradas/andando curto. Custo: zero arte nova, um campo novo no
ESQUEMA_SAVE, desenho reusando drawHero com offset.

**Fase 2 (exige arte):** camadas de cena que ligam com o progresso — a roça plantada, a
casa levantada. Uma imagem extra por capítulo por estágio (2 estágios bastam). Entra na
mesa quando a fase 1 provar que o loop segura.

**O idle:** o lugar produz enquanto a pessoa está fora (a taxa que o cap. já tem), e a
volta mostra: quem chegou de novo, o que mudou. A tela de retorno ("enquanto você
esteve fora") lista em texto o que o lugar fez — barata e forte.

## O que NÃO muda

- Cap. 1 fica no padrão atual (decisão do dono) — e vira o termo de comparação honesto.
  **PONTO EM ABERTO desde 2026-08-11, e é do dono:** o ticket "leve os marcos para TODOS os
  capítulos" foi cumprido ao pé da letra e o capítulo 1 ganhou três placas. O que ele guardou
  do padrão antigo continua guardado — a estrada dele não tem fim, não tem marco de fecho e
  não tem faixa viva (isso é só o cap. 2) —, mas a decisão de 06/08 dizia "pelo menos um
  capítulo no padrão atual" e placa de história na estrada é parte 1 desta mesma reforma. Se o
  termo de comparação tiver de voltar a ser puro, é **uma linha** em `derivarMarcos`: pular o
  capítulo. Fica registrado para ele decidir, e não para uma sessão futura descobrir sozinha.
- Economia, custos de upgrade, LIMIARES: intocados nesta fase. Uma mudança de cada vez,
  medida.
- Motor de renderização (§7): marcos e lugar são objetos do mundo, camada existente.

## Ordem de implementação

1. ~~Marcos no chão + indicador de distância (só cap. 2, como protótipo).~~ **Feito, e
   generalizado para todo capítulo em 2026-08-11 — ver o quadro na Parte 1.**
2. `S.acolhidos` por época no esquema + faixa final com os acolhidos visíveis (cap. 2).
3. Tela de retorno "enquanto você esteve fora".
4. Medir: o tempo de sessão e a taxa de volta-no-dia-2 mudam? (instrumentação local já
   é tarefa antiga.) Só depois estender aos outros capítulos.

## Riscos declarados

- Marco entrando pela borda direita compete visualmente com os itens que chegam —
  resolver por silhueta (placa alta e parada × item baixo e móvel).
- A faixa final não pode virar "zoológico de acolhidos": máximo em tela igual ao limite
  atual do grupo (5–6), o resto é dito em texto. Ninguém vira multidão-textura (§2).
