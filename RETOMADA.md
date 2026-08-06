# RETOMADA — leia isto primeiro na próxima sessão

Escrito em 2026-08-05, no fim de uma sessão longa, para a sessão seguinte começar sabendo
onde as coisas estão. **Leia depois do `CLAUDE.md` e antes de tocar em qualquer coisa.**

## Em uma frase

O jogo virou um jogo sobre a história do Brasil que **ensina antes de deixar jogar**: menu →
escolher a era → a personagem conta a história com fonte → os itens param e esperam ajuda →
quem não é atendido faz o mundo ralear.

## O que está rodando e onde

| coisa | onde |
|---|---|
| jogo | `npm start` → localhost:8199 |
| mesa de entrega | `npm run mesa` → localhost:8200 |
| produção | <https://jogo-brasil-mrcx.vercel.app> |

## As DUAS coisas grandes que estão prontas e NÃO integradas

Ambas em worktrees, verdes, sem commit. **Integrar as duas é o primeiro trabalho.**

1. **Migração TypeScript + Capacitor** — corta `index.html` em `src/`. Construída sete
   commits atrás; a lista exata do que portar está no `BACKLOG.md`.
2. **Personagem por época** — mede as 8 folhas de cap.2 e cap.3. Estava rodando quando a
   sessão acabou; pode ter terminado.

Integração é sempre a mesma receita, e funcionou seis vezes:
`git diff <base-do-agente> -- index.html > x.patch` e `git apply --3way x.patch`.

## O que o dono pediu e ainda NÃO foi feito

Em ordem do que ele falou por último:

1. **Itens esperam mais e chegam mais espaçados.** Hoje `CFG.mobEspera = 2,4 s` e
   `CFG.mobVao = 69 px`. Ele achou rápido demais e quer **intervalo aleatório** entre
   chegadas. Meça antes e depois — a fração atendida andando é 1,00 e correndo 0,48.
2. **Só voa o que faz sentido voar.** `MOB_LIFT` é por capítulo. Hoje há coisa flutuando sem
   razão; cesto e mandioca não voam, cacho pendurado pode.
3. **Revisar todos os assets** à luz do pulo e do subir.
4. **Backgrounds na história**, trocando por fala. Barato: reaproveita as 12 peças que já
   estão embutidas.
5. **Explicar os itens no fim da história**, antes de jogar. Fecha o buraco dos primeiros
   cinco minutos. **O texto é conteúdo — mostre rascunho, não publique sozinho.**
6. **Plataformas estilo Mario.** É uma SESSÃO INTEIRA: `GROUND` é constante hoje, e altura
   variável reabre a armadilha nº 1 do §7. Avisei que o verbo do jogo é *alcançar* e
   plataforma é *chegar* — podem competir. Ele não respondeu a isso.
7. **Emenda dos fundos** ainda incomoda ele, mesmo com o mato na costura.
8. **Melhorar menu, jogabilidade, HUD, textos e os botões de baixo.**

## Decidido pelo dono, ainda não implementado

**Drops destrancam o capítulo.** Ideia dele, e é a melhor resposta ao último item grande: o
toque no vazio é 65% da renda, e exigir uma coleta mínima por capítulo faz o alcance virar
obrigatório **sem mexer em nenhum valor**. Drop só existe se você alcançou alguém.
Faltam dois números: **quantos**, e **se exige os três tipos ou só o total** (recomendei o
total, mostrando os três contadores).

**Supabase:** código de transferência sem conta, placar **anônimo**, público jovem adulto.
Obrigação que anda junto: a tela de AJUSTES diz *"nada sai deste aparelho"* — vira mentira no
instante em que o primeiro byte sair, e tem que ser reescrita **na mesma fase**.

## O que o dono ainda não respondeu

- **Imagens de contexto na história**: paisagem sem gente (seguro) ou cena com pessoas
  (mais forte, mais risco)? É §2 e não decida sozinho.
- **Os números dos drops** acima.

## Números medidos — não os re-derive, estão certos

| | |
|---|---|
| `PASSO_PX` | `140 × 44 / 322 / 3` = 6,377 · andar `n=10`, correr `n=5` |
| escorregamento do pé | 0,5% |
| paralaxe | 0,45 céu · 1,0 chão · 1,35 folhagem |
| atendido em 60 s | andando 1,00 · correndo 0,48 · parado 0,00 |
| renda de correr | +16% (era −5% antes do spawn por distância) |
| o que atravessa a tela | 18,3% da renda (era 4%) |
| toque no vazio | **65% da renda** — o último item grande |
| do zero até ver tudo | 5 min 07 s |

## Armadilhas que já custaram sessão — não repita

- **Paralaxe é fatal no horizonte e abaixo, inócua acima.** O chão é 1:1 e não se negocia.
- **Centroide do pé MENTE.** Meça a SOLA.
- **CSS órfão não dá erro** — só faz a coisa errada em silêncio. Mordeu duas vezes.
- **`z-index` negativo não tira um filho de trás do fundo do pai.** Tem que virar irmão.
- **Erro de sintaxe derruba tudo** e o sintoma aparece longe: o smoke test disse `CFG is not
  defined` quando a causa era um `else` órfão. Bisecção acha em um minuto.
- **`git add -A` com agente rodando** varre trabalho alheio para dentro do commit errado.
- **`\n` em heredoc de shell vira quebra real** e quebra a string. Use `Write` ou `
`.

## Como o dono quer trabalhar

Decidir sozinho, ser direto, **medir em vez de achar**, e avisar antes de quebrar algo.
Perguntas desnecessárias ele lê como desobediência ao pedido de autonomia. A exceção é
**representação histórica** — ali, decidir sozinho é a escolha errada.

Ele pediu explicitamente: **operar no máximo a 98% do limite**, ir mais devagar ao se
aproximar, e escrever um texto de retomada como este antes de resetar. Este arquivo é isso.
