# RETOMADA — leia isto primeiro na próxima sessão

Atualizado em 2026-08-06. Existe para a sessão seguinte começar sabendo onde tudo está. **Leia depois do `CLAUDE.md` e antes de tocar em qualquer coisa.**

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

## O que mudou por último

- **Retratos das três eras** entraram: cada capítulo é narrado por quem viveu nele.
  Palmares estava sendo contada pelo rosto do litoral, o que contradizia o texto lido.
- **Ritmo da rua** ajustado: paciência 3,6 s, vão médio 78 px, janela **aleatória em pixel**.
  O achado: quem produz "item colado no outro" é o FUNDO da janela, não a média — o pior
  caso foi de 0,81 s para 1,33 s de caminhada.
- **Só o cacho de fruta voa.** O erro não era o `MOB_LIFT`, era um tremor de 1 px que o motor
  aplicava a todo mundo, herança de quando tudo que passava era fumaça.
- **Cada capítulo apresenta os próprios itens** ao fim da abertura, sem afirmar história —
  só nomeia o objeto desenhado e o contador que ele enche.

**Rodando agora:** um agente portando a migração TypeScript + Capacitor para o estado atual,
e reconstruindo a arte em WebP 0,80 (medido: 274 KB → 165 KB por peça, −40%). Se ele voltar
com o build verde e a tela igual, integre; se a diferença aparecer, volte para 0,92.

**O `index.html` está em 3,91 MB.** Não é urgente, mas cada arte nova pesa. O caminho é
qualidade de WebP ou menos cores — **nunca cortar conteúdo**, e **nunca SVG**: medido, pixel
art em vetor vira dezenas de milhares de retângulos, maior que o WebP e mais lento.

## O que está pronto e NÃO integrado

**Só uma coisa:** a migração TypeScript + Capacitor. Um agente está portando agora; se ele
falhar, a worktree `agent-a3040c2ea3c2db2f8` tem a versão original e o `BACKLOG.md` a lista.

A personagem por época **já foi integrada** — as três eras têm pessoa e passada próprias.

Receita de integração, que funcionou sete vezes:
`git diff <base-do-agente> -- index.html > x.patch` e `git apply --3way x.patch`.
Ela NÃO serve para a migração, porque essa muda a FORMA do arquivo, não o conteúdo.

## O que o dono pediu e ainda NÃO foi feito

Em ordem do que ele falou por último:

1. **Revisar todos os assets** à luz do pulo e do subir.
2. **Backgrounds na história**, trocando por fala. Barato: reaproveita as 12 peças embutidas.
3. **Plataformas estilo Mario.** É uma SESSÃO INTEIRA: `GROUND` é constante hoje, e altura
   variável reabre a armadilha nº 1 do §7. Avisei que o verbo do jogo é *alcançar* e
   plataforma é *chegar* — podem competir. Ele não respondeu a isso.
4. **Emenda dos fundos** ainda incomoda ele, mesmo com o mato na costura.
5. **Melhorar menu, jogabilidade, HUD, textos e os botões de baixo.**

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
| passada, por era | 6,377 (n=10) · 7,492 (n=12) · 6,918 (n=11) |
| escorregamento do pé | 0,48% · 0,00% · 0,67% |
| paralaxe | 0,45 céu · 1,0 chão · 1,35 folhagem |
| atendido em 60 s | andando 1,00 · correndo 0,66 · parado 0,00 |
| renda de correr | +16% (era −5% antes do spawn por distância) |
| o que atravessa a tela | 18,3% da renda (era 4%) |
| toque no vazio | **65% da renda** — o último item grande |
| do zero até ver tudo | 5 min 07 s |
| peso do index.html | 3,91 MB |

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
