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

## O que mudou por último — 06/08, sessão longa

Tudo abaixo está **integrado, publicado e verde**. Nada pendente de integração.

- **Migração TypeScript + Capacitor.** A fonte agora é `src/jogo.ts` + `src/estilo.css` +
  molde; `npm run build` reembute num `index.html` autocontido. **A garantia de arquivo único
  virou automática**: o build recusa escrever se o `tsc` falhar, se aparecer `src=`/`href=`
  fora de `data:`, ou se houver mais de um `<script>`. A CSP não abriu.
- **Uma pessoa por era**, com passada medida em cada: 6,377 (n=10) · 7,492 (n=12) · 6,918
  (n=11); escorregamento 0,48% · 0,00% · 0,67%.
- **Retratos de frente**, um por era, atrás da caixa de fala, só o busto.
- **Seis imagens de contexto** na história, trocando quando o ASSUNTO muda — não a cada fala.
  As duas últimas falas de cada capítulo ficam sem imagem de propósito: são as que descrevem
  a tela.
- **Som**, sintetizado com WebAudio, **zero byte de áudio**, +22,9 KB de código. Alcançar
  anda por uma pentatônica maior — a mesma altura nunca sai duas vezes seguidas. O passo sai
  no mesmo evento que troca o quadro do sprite, então casa com o pé por construção.
  **Nenhum som de dano, dor ou golpe.**
- **Em Palmares, quem chega é GENTE** e passa a andar com você, visível na tela. Sem barra de
  vida sobre pessoa; o progresso está no anel de luz no chão. Cabem cinco; a sexta faz a da
  frente ficar pela serra — ninguém some.

## Duas dívidas honestas

1. **`index.html` está em 3,7 MB**, acima do teto de 3,6 que eu mesmo dei. Medido: WebP a
   660 px corta 22%, a 520 px corta 46%. A próxima arte exige um dos dois.
2. **Alcançar continua sendo o gesto de BATER por baixo** — combo de cinco, `hp` decrescendo,
   e a quinta batida vale dobrado. Sobre gente, mecânica e tela falam línguas diferentes.
   Toda a gramática *visível* de combate saiu; o verbo do motor não. **Sessão própria, e é
   decisão do dono.**

## Nada pronto e não integrado

Todos os agentes voltaram e todo o trabalho está na `main`. Receita de integração, que
funcionou onze vezes: `git diff <base> -- src/ > x.patch` e `git apply --3way x.patch`.
Quando dois agentes tocam o mesmo lugar, resolva a favor de **manter os dois** — foi o caso
de `som` e `grupo` no `ESQUEMA_SAVE`.

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

- **Quantos drops** destrancam o capítulo. Ele já decidiu que é **pelo total**, não por tipo.
  Falta o número, e ele sai de medição, não de palpite.
- **O verbo do motor sobre gente**, a dívida nº 2 acima. É §2 e não decida sozinho.

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
| peso do index.html | **3,7 MB** (teto que eu mesmo dei: 3,6) |

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
