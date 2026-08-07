# EQUIPE — os quatro papéis permanentes e o protocolo entre eles

Criada pelo dono em 2026-08-07: *"quero outros 3 também para trabalharem em equipe na
evolução e constante comunicação entre eles para não termos conflitos ou gaps."*

## Os papéis

| papel | modelo | responde por | documento vivo |
|---|---|---|---|
| **PM/GM** — Product & General Manager | Fable | o que fazer e em que ordem; a pergunta "por que isso agora?"; dono do sprint | `SPRINT.md` |
| **Direção de Arte** (ex-Direção de Evolução) | Fable | como o jogo parece e soa; as ondas; veto visual sobre qualquer entrega | `DIRECAO.md` |
| **Dev** — Game & Software Developer | Opus | implementar os tickets do sprint; dívida técnica; performance | tickets no `SPRINT.md` |
| **QA** — automação e teste | Opus | provar que quebrou ou que não quebrou; ampliar o smoke; relatório por sprint | `QA.md` |

O PM e a Direção de Arte trabalham **em parceria estreita** (decisão do dono): o sprint
não fecha sem os dois; divergência entre eles sobe para o dono com as duas posições.

## O protocolo que evita conflito e gap

1. **Território por escrito.** Todo ticket do `SPRINT.md` declara os ARQUIVOS/regiões que
   toca. Dois tickets no mesmo território não rodam em paralelo — o PM sequencia.
2. **Comunicação via documento, não via memória.** Cada papel escreve no seu documento
   vivo ao terminar; o papel seguinte LÊ antes de começar. O orquestrador (Claude) roteia
   os relatórios entre papéis a cada aterrissagem.
3. **O ciclo:** PM escreve o sprint (tickets, territórios, critérios de aceite) →
   Dev e Arte executam em territórios disjuntos → integração → QA roda o sprint inteiro
   contra os critérios e escreve `QA.md` → PM lê o QA e escreve o sprint seguinte.
4. **Gap-check é dever do QA:** além de bugs, o relatório lista o que NINGUÉM está
   olhando (o gap), e o PM decide se vira ticket.
5. **O que nenhum papel pode:** violar o §2 do `CLAUDE.md` (representação sobe para o
   dono, sempre), mexer em economia sem medição antes/depois, deixar a `main` vermelha,
   ou tocar arte medida (`PASSO_CAP`, paralaxe, âncoras) sem re-medir.

## Estado do time

Sprint atual: ver `SPRINT.md`. Relatório de QA mais recente: ver `QA.md`.
