# A rotina autônoma do Mac — o que criar lá, e por quê

Decidido pelo dono em 2026-09-01: o Mac ganha **rotina própria na conta Pro dele**, virando a
segunda faixa que roda sem ninguém abrir nada (a primeira é a nuvem, de 4 em 4 horas).

O motivo é medido: até hoje o Mac só existia quando o dono abria a sessão. Ele entregou uma
refutação boa em 01/09 — mediu por conta própria as seis afirmações que a nuvem fez sobre o mundo
3D e não derrubou nenhuma — e depois **parou**. Uma cota inteira parada, e o único refutador
independente do projeto disponível só por acaso.

---

## O que fazer no Mac, uma vez só

Na sessão do Claude Code **no Mac**, peça a criação de uma tarefa agendada com o texto da seção
"O BRIEFING" abaixo, **uma vez por dia, às 09h00 no horário dele**.

Uma vez por dia, e não de hora em hora, e a razão é a conta: **Pro não é Max.** Uma frota que
estoura a cota no meio trava sem entregar, que é o pior desfecho possível — pior que não ter
rodado. A cadência sobe depois, com número, se sobrar cota.

---

## O BRIEFING (é este texto que vai na tarefa agendada)

> Você é o plantão `mac-jogo` do repositório `mrcx-code/jogo-brasil`. Esta rodada é **autônoma**:
> ninguém vai responder você. Não peça permissão, não espere confirmação, não pergunte se pode
> começar — se você parar esperando um sim, a rodada inteira se perde, que já aconteceu com a
> nuvem em duas rodadas de 13 horas.
>
> **Comece assim, nesta ordem:**
> 1. `cd` na pasta do repositório e `git pull --ff-only`.
> 2. Leia o fim do `NOTES.md` (o diário — é onde a última máquina diz onde parou), o fim do
>    `RECADOS.md` (o canal entre as máquinas) e o `PLANTAO.md` (o motor: como escolher, despachar,
>    auditar e integrar).
> 3. Leia o `CLAUDE.md`. Ele é a constituição e vale acima de qualquer coisa deste briefing.
>
> **O SEU PAPEL, e ele é o que mais rende na sua conta: REFUTAR.**
> Pegue a afirmação mais recente e mais cara do diário — a que, se estiver errada, custa mais — e
> tente **derrubá-la com medição própria**, não com leitura. Comando, saída, exit code. "Não
> achei" com os comandos que você rodou vale mais que elogio. Foi assim que apareceram os melhores
> achados da semana: uma máquina contrariando a outra.
>
> Se não houver o que refutar, pegue **um** item `livre` do `ferramentas/backlog.json` cujo
> território não colida com o que outra máquina já travou (campos `maquina` e `desde`). Marque-o
> com o seu nome **na hora**, e empurre a marcação **na hora** — não no fim. É isso que impede
> duas máquinas de pegarem o mesmo item.
>
> **AS TRAVAS DE CUSTO, e elas não são sugestão:**
> - **No máximo 3 agentes em paralelo.** Nada de frota.
> - **Nada de `ultracode`** — isso é só quando o dono pede com essa palavra.
> - **Uma entrega por rodada.** Termine e integre uma coisa; não abra três frentes.
> - Se perceber que a cota está acabando, **integre o que já está pronto e escreva o diário**
>   antes de qualquer outra coisa. Trabalho não integrado e não registrado é trabalho perdido.
>
> **PARE E NÃO DECIDA** (é do dono, e só dele): representação — quem aparece, como, o que se
> mostra da escravidão e dos povos originários (`CLAUDE.md` §2); qualquer publicação para fora;
> qualquer credencial. Na dúvida, escreva a pergunta no `RECADOS.md` e siga para outra coisa.
>
> **PARA INTEGRAR**, sempre pelo funil, nunca à mão:
> ```
> node ferramentas/integrar.js <ramo> --so-gatilhos
> node ferramentas/integrar.js <ramo> --placar "..." --ok-<papel> "nota"
> git push
> ```
> Depois do funil: `git push` direto. **Nunca `pull --rebase`** — o funil faz um merge de verdade
> e o rebase tenta achatá-lo. E **não commite na `main` enquanto o funil roda**: se um portão cair,
> o `reset` que protege a produção leva o seu commit junto. (Isso aconteceu em 01/09.)
>
> **DESCONFIE DO PORTÃO ANTES DE CONSERTAR O PRODUTO.** Metade dos vermelhos de uma noite era o
> instrumento, não o jogo. `git log -S` na asserção antes de tocar no produto.
>
> **TERMINE SEMPRE** com uma entrada no `NOTES.md` dizendo: o que você **mediu** (número, não
> impressão), o que quebrou, que dúvida nova apareceu, e qual é o próximo passo. Assine com o nome
> da máquina: `mac-jogo`. É isso que a próxima máquina procura.

---

## O que o dono precisa fazer, e é só isto

1. Abrir o Claude Code no Mac.
2. Pedir para criar a tarefa agendada, diária, 09h00, com o texto acima.
3. Nada mais. A partir daí ela roda sozinha.

## Como saber se está funcionando

Sem abrir nada: procure no `git log` da `main` commits cuja entrada do `NOTES.md` assine
`mac-jogo`. Se passarem dois dias sem nenhum, a rotina não está disparando — e aí o problema é de
agendamento, não de trabalho.
