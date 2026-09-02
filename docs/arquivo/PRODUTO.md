# PRODUTO — o jogo visto de fora

Escrito por quem não construiu o motor. Documento de produto: não altera código, não decide
representação histórica. Onde a decisão for do dono, está marcado **[DONO]**.

**O que foi medido, como e quando.** Tudo abaixo veio de rodar o jogo em `localhost:8199`
(`npm start`), viewport 390×844 e 375×812, com o save zerado pelo próprio `zerarJogo()`, mais
leitura do `index.html`. As medidas são de 2026-08-05, contra a árvore de trabalho no commit
`86dfa47` com edições não commitadas em curso. **O arquivo estava sendo editado por outro
agente enquanto eu media** — os números de linha podem ter andado; os fatos foram
reconferidos por `grep` no fim. Onde eu não medi, digo que não medi.

**As duas telas novas não mudam nenhuma conclusão deste documento — elas agravam a de nº 2
do backlog.** A tela `A HISTÓRIA` (seis MOMENTOS com data, contexto e fonte) e a tela
`DE ONDE VEM` (fontes, com a seção `ONDE AS FONTES DISCORDAM`) são hoje **o melhor conteúdo
do jogo, de longe** — é a única parte que cumpre o que o CLAUDE.md §2 pede. E as duas estão
atrás do menu inicial, que fica inacessível assim que você ganha o primeiro ponto. Conteúdo
bom trancado é pior que conteúdo ausente: ninguém sabe que perdeu.

---

## 1. O que o jogo é hoje, em três frases

Uma personagem caminha sem parar por uma paisagem pintada em pixel art que rola para a
esquerda, e o jogador toca a tela para golpear o que passa, pular, e acumular um número
chamado IMPACTO. Ao atravessar cinco limiares de impacto, o cenário troca — seis cenas em
três épocas, do litoral Tupinambá do século XVI a hoje — e, a cada duas cenas, uma tela de
ÉPOCA interrompe a partida. Fora disso o jogo não tem estados: não há falha, não há fim, não
há nada que se perca, e a única coisa que o jogador decide é quando parar de segurar o botão.

---

## 2. A pergunta que o jogo ainda não responde

O `NOTES.md` já registrou a intenção: *"a pergunta do jogo deixa de ser 'matei tudo?' e vira
'o que eu deixei passar?'"*. Essa é a pergunta certa, e é a razão de o verbo ser **alcançar**.

**O jogo hoje não consegue respondê-la, e dá para mostrar isso com um número.**

Segurando o botão dourado por 12,0 s, sem melhoria nenhuma, o ganho foi **141 de impacto**,
assim repartido:

| origem | impacto | fatia | exige o quê do jogador |
|---|---:|---:|---|
| toque no vazio | 83 | **59%** | segurar o dedo |
| folha apanhada | 52 | **37%** | nada — a personagem recolhe andando |
| drop de quem passou | 6 | **4%** | alcançar |

Com a melhoria `u1` (×3 por alcance, custa 150), 12,0 s deram **300 de impacto**, e a fatia do
que passa na tela **caiu para 1%** (3 de 300).

E do outro lado: **parado no menu, sem tocar em nada, 25,2 s renderam 56 de impacto** — 14
folhas apanhadas sozinhas, zero toques. São **2,2 impacto/s com o telefone na mesa**, e isso
acontece com a tela de menu aberta, antes de alguém apertar JOGAR.

Ou seja: alcançar o que passa é entre 1% e 4% da economia; deixar passar não custa nada; e o
jogo continua ganhando pontos sozinho. O verbo trocou de nome e não trocou de consequência —
o `BACKLOG.md` já diz isso em uma linha ("Dar peso ao verbo"), e este é o número que a
sustenta.

**O que falta para o jogo poder responder.** Uma consequência para o que atravessa a tela sem
ser alcançado. Não precisa ser punição — pode ser ausência: aquilo que você alcançou aparece,
e aquilo que você deixou passar não. Qual é a coisa que passa e o que significa deixá-la
passar em cada capítulo é **[DONO]**, porque em Palmares "alcançar quem chega" é gente, e o
§2.2 já traçou a linha ali.

---

## 3. Os cinco primeiros minutos

Testado com o save zerado, em 375×812. Sequência real, tela por tela.

**Segundo 0 — a tela de menu.** Título `BRASIL`, subtítulo *"um jogo sobre quem já estava
aqui"*, e quatro botões: `JOGAR`, `A HISTÓRIA`, `DE ONDE VEM`, `AJUSTES`. Boa primeira
impressão, e é a única vez que o jogo se apresenta. **Dois problemas aqui:** (a) o jogo já
está rodando atrás e já está pontuando — medi 2,2 impacto/s enquanto a tela de menu estava
aberta e eu não tocava em nada; o contador do topo sobe sozinho antes de você começar; (b)
esta é a **única** aparição desses quatro botões na vida daquele save (ver adiante).

**Segundo 1 — aperta `JOGAR`, e ninguém explica nada.** Contei os botões visíveis em jogo:
são exatamente três — `ANDAR` (canto esquerdo), o botão dourado `+1.0` (centro) e `MELHORIAS`
(canto direito). O que o jogo **não** diz em lugar nenhum: que a **metade esquerda da tela
pula** e a **metade direita golpeia**. Não há linha divisória, não há dica, não há tutorial.
Existe um balão de ajuda no HTML (`#guia`, com botões "entendi" e "pular") — **ele nunca
aparece**: nada no código adiciona a classe que o torna visível, e as duas funções que seus
botões chamam (`dispensarGuia`, `pularGuia`) **não existem mais no arquivo**. É um tutorial
morto e um `ReferenceError` esperando alguém religar o elemento.

**Entre 0 e 2 minutos — a coisa mais provável de acontecer é o jogo acabar.** Abrindo
`MELHORIAS` você vê cinco cartões lado a lado. Os três reais custam 150, 900 e 4.000. Os
outros dois são vermelhos: `×100 TEST` marcado **`GRÁTIS`**, e `ZERAR TEST` marcado `APAGAR`.
Para quem abriu o jogo agora, o cartão mais atraente da tela é o único de graça — e apertar
`GRÁTIS` faz o toque valer 300, ou seja **cerca de 2.070 impacto/s**, o que consome os 7.500
de todo o conteúdo do jogo **em torno de quatro segundos**. O `NOTES.md` justifica o `u4` ir
para produção ("num arquivo único sem build não existe 'só em dev'"), e a justificativa é
verdadeira — mas ele não precisa estar no mesmo painel, com a palavra mais convidativa da
interface.

**Aos ~2 minutos — a primeira troca de cena.** Segurando o botão sem melhoria nenhuma o ritmo
medido foi 11,75 impacto/s; o primeiro limiar é 1.500, logo ~128 s. A cena troca com um baque
e um `NOVO CAPÍTULO` flutuando. Isso funciona.

**Aos ~4 minutos — a primeira tela de ÉPOCA, e ela está vazia.** Forcei o limiar de 3.000 e
tirei print: a tela mostra o título `ÉPOCA 2`, um **retângulo pequeno e vazio** no meio, e o
botão `CONTINUAR`. O array `TEXTOS` está vazio de propósito (e com razão — ninguém deve
inventar conteúdo histórico), mas o efeito para quem joga é que o único momento em que o jogo
para para falar com você é o momento em que ele não tem nada a dizer, e ainda desenha uma
moldura em volta do silêncio. **A moldura vazia é pior que nenhuma tela.**

**Aos ~5 minutos — acabou.** Contas com os ritmos medidos, partindo do zero, comprando `u1`
assim que dá: 150 ÷ 11,75 = 12,8 s, mais 7.350 ÷ 25,0 = 294 s. **307 segundos, cerca de
5 min 07 s, para ver as seis cenas, as três épocas e todo o conteúdo que existe.** Depois
disso `proximoLimiar()` devolve `null`, a barra de progresso fica 100% cheia para sempre e a
personagem continua andando. Não há tela de fim, epílogo, nem qualquer sinal de que acabou.

**E o que o jogador não vê, porque não tem como.** A partir do primeiro ponto ganho, as telas
`A HISTÓRIA`, `DE ONDE VEM` e `AJUSTES` ficam **inacessíveis**. O menu só abre em
`if (!S.energiaTotal) abrirTela("telaMenu")`, no carregamento, e nenhum dos três botões em
jogo o reabre. Quem jogou 30 segundos e fechou nunca mais alcança, naquele save, a única
parte do jogo que fala de história do Brasil.

---

## 4. O motivo de voltar amanhã

**É pouco. É quase nada, e o pouco que existe está quebrado ou em inglês.**

O que existe hoje, inteiro:

1. **O bônus por dia distinto.** `bonusDia: 0.02`, teto de 10 dias: voltar amanhã multiplica
   tudo por 1,02. Depois de **dez dias** de jogo o bônus chega a ×1,20. Comparação honesta:
   comprar `u1` por 150 — o que leva 13 segundos — vale ×3. Uma melhoria de 13 segundos vale
   quinze vezes mais que dez dias de fidelidade.
2. **A mensagem de boas-vindas.** É o único evento do dia 2, e reproduzi o texto exato:
   `🌙 AWAY 8h00 — DAY 3, the neighbourhood knows you: ×1.04`. Está **em inglês**, num jogo
   cuja decisão nº 6 com o dono é "interface sempre em português"; carrega **dígitos** numa
   frase de jogo, que é o que o §2 existe para impedir (o smoke test não pega porque só varre
   `TEXTOS`); e fala de *"the neighbourhood"*, vocabulário do projeto de origem. É a primeira
   frase que um jogador retornante lê.
3. **Ganho offline: zero.** `simularOffline()` percorre um laço que não acumula nada e devolve
   `0`. `capOfflineHoras: 12` está vivo no CFG e não paga nada. Dormir não rende.
4. **A tela `A HISTÓRIA`.** Esta é a boa notícia, e é nova: seis momentos com data, contexto e
   fonte visível, revelados conforme você avança. **É o melhor motivo de voltar que o jogo
   tem** — e o jogador não consegue abri-la depois do primeiro ponto (seção 3).

Resumo brutal: se alguém voltar amanhã, encontra exatamente a mesma rua, +2% de ganho, uma
saudação em inglês, e nenhum caminho até a única coisa nova que teria para ler.

---

## 5. Backlog priorizado

**Critério de ordenação, explícito.** Ordenei por, nesta ordem:

1. **O que impede o jogo de responder à própria pergunta** (seção 2). Um protótipo que não
   mede a coisa que ele existe para medir não é um protótipo, é uma demo.
2. **O que alguém perde nos primeiros cinco minutos** — porque quase todo jogador só terá
   cinco minutos.
3. **O que dá motivo de voltar amanhã** — a regra de corte que o `BACKLOG.md` já declara.
4. **Custo**, só como desempate.

Não ordenei nada que toque representação histórica; esses itens estão marcados **[DONO]** e
ficam fora da ordem.

| # | item | por que importa | custo |
|---|---|---|---|
| 1 | **Dar consequência a ALCANÇAR** | Medido: o que passa na tela vale 4% da renda sem melhorias e 1% com `u1`; ignorar tudo não custa nada; parado rende 2,2/s. O verbo é a tese do jogo e hoje é um rótulo. Sem isso, todo o resto é decoração. **O que significa "deixar passar" em cada capítulo é [DONO]** — em Palmares é gente. | grande |
| 2 | **Um jeito de abrir o menu durante a partida** | `A HISTÓRIA` e `DE ONDE VEM` são o melhor conteúdo do jogo e ficam inacessíveis a partir do primeiro ponto. Um quarto botão (ou um toque no rótulo `ÉPOCA n` do HUD, que já existe e não faz nada) devolve todo esse conteúdo. Melhor razão-valor/custo da lista inteira. | pequeno |
| 3 | **O conteúdo acaba em 5 minutos — recalibrar `LIMIARES` contra o ritmo medido** | `LIMIARES = [1500…7500]` foi escolhido antes de alguém medir 11,75 e 25,0 impacto/s. Hoje o jogo inteiro cabe num intervalo de ônibus, e a terceira época — a que carrega "eles continuam aqui" — chega antes de a pessoa ter se acostumado com o botão. Trocar cinco números e remedir é barato; **descobrir qual é o ritmo certo é o que custa** (ver hipótese H1). | pequeno a médio |
| 4 | **A ponte de época não pode ser uma moldura vazia** | É o único momento em que o jogo para para falar, e ele não fala. Duas saídas independentes: (a) enquanto `TEXTOS` estiver vazio, não desenhar a caixa — só título e `CONTINUAR`; (b) mostrar ali o MOMENTO recém-desbloqueado, que **já existe, já tem fonte e já foi escrito**. A (a) é técnica e imediata; a (b) é reaproveitamento, não invenção. **Texto novo é [DONO].** | pequeno (a) · médio (b) |
| 5 | **Tirar o `×100 GRÁTIS` do painel de MELHORIAS** | É o cartão mais convidativo da única tela de progressão e consome todo o conteúdo do jogo em ~4 s. Não precisa sumir (a razão do `NOTES.md` continua válida): precisa sair de perto das melhorias reais — outra tela, ou dentro de AJUSTES. | pequeno |
| 6 | **Consertar o dia 2** | A saudação em inglês com dígitos (seção 4) é o primeiro texto que um retornante lê e viola duas decisões do dono. Traduzir é meia hora. **Dar um motivo real de voltar é o item 1 disfarçado** — sem consequência para o que passa, não há o que reencontrar amanhã. | pequeno (texto) |
| 7 | **Decidir o destino dos três contadores de recurso** | Flor, água e refeição ocupam três quartos da barra superior, **nada os gasta**, e eles **nem sequer são salvos**: `recursos` não está no `ESQUEMA_SAVE`, então zeram a cada carregamento. Três números que resetam sozinhos e não servem para nada ensinam ao jogador que os números do HUD não valem atenção. Ou viram mecânica, ou saem. | pequeno (sair) · médio (virar mecânica) |
| 8 | **O peso do arquivo** | Medi: 3,79 MB, 119 imagens WebP embutidas = 70% do arquivo; comprimido ainda são 2,62 MB, e o servidor local não comprime. Tudo precisa chegar antes do primeiro quadro, num jogo declaradamente mobile-first. Não medi o tempo real de carga em rede móvel — ver H4. | médio |
| 9 | **Trocar a personagem** (já no `BACKLOG.md`) | Continua sendo o contraste mais gritante da tela. Não subi mais porque o `NOTES.md` já mediu que **a arte nova não é um ciclo de caminhada** (vão pé-a-pé `110 94 132 131 \| 22 27 26 25 \| 125 51 52 51`): está bloqueado na arte, não na fila. | grande |
| — | **Nomeação, identidade visual, conteúdo histórico novo** | **[DONO]**, por regra do CLAUDE.md §2 e §8. Não entram nesta ordem. | — |

**Um item que eu deliberadamente NÃO coloquei na lista:** som. O `NOTES.md` o chama de "maior
retorno por esforço", e num jogo com loop resolvido eu concordaria. Com o verbo sem
consequência (item 1), som só torna mais agradável um loop que ainda não mede nada. É o
próximo da fila depois do item 1, não antes.

---

## 6. Hipóteses a medir

Hipótese sem método é opinião. Cada uma abaixo tem o método junto.

**H1 — O ritmo está calibrado para uma sessão de cinco minutos, e ninguém escolheu isso.**
*Como medir:* já existe metade da medição (11,75 e 25,0 impacto/s, segurando, com e sem
`u1`). Falta o denominador humano: pôr três pessoas que nunca viram o jogo para jogar até
enjoar, sem instrução, e cronometrar **quando largaram o telefone**, não quando terminaram.
Se largaram antes dos 7.500, o problema não é o ritmo — é o loop. Se chegaram ao fim e
continuaram segurando, o ritmo é curto demais. Sem esse número, mexer em `LIMIARES` é chute.

**H2 — Ninguém descobre sozinho que a metade esquerda da tela pula.**
*Como medir:* instrumentação local de dez linhas, sem rede: contar em `localStorage` quantos
toques caíram em cada metade do canvas nos primeiros 60 s de uma partida nova. Se a metade
esquerda ficar abaixo de ~5% dos toques, a mecânica do pulo — e as folhas altas que só ela
alcança — é conteúdo que o jogo tem e não entrega. Barato e definitivo.

**H3 — A escolha ANDAR/CORRER não tem consequência.**
*Já medi, e ela quase não tem.* Doze segundos segurando o botão com `u1`: `ANDAR` deu 25,0
impacto/s; `CORRER` deu 26,7 com bônus de dia ×1,04, ou **25,7 normalizado — 3% de
diferença**, dentro do ruído. E `CORRER` percorreu 1.105 px em 12 s (92 px/s) contra 40,9
px/s andando: **2,25× mais mundo atravessado para a mesma renda**, porque folhas e chegadas
nascem por relógio, não por distância. *O que falta medir:* se alguém percebe. Perguntar a
um jogador, depois da partida, o que o botão `ANDAR/CORRER` fazia. Se ninguém souber
responder, é um dos três botões do jogo sem função — e aí ou ele passa a valer alguma coisa
(por exemplo: correr faz você alcançar mais e cansar mais) ou sai.

**H4 — 3,79 MB afasta gente no celular.**
*Como medir:* `throttling` de rede no DevTools em perfil 4G lento, cronômetro do primeiro
byte ao primeiro quadro jogável, três repetições. Se passar de ~8 s, vale conferir o que
acontece com a tela nesse intervalo: `fundoPintado()` exige as **duas** peças carregadas, e
eu não verifiquei o que aparece antes disso. **Não medi; é hipótese, não achado.**

**H5 — A tela `A HISTÓRIA` é o motivo de voltar, e ninguém a encontra.**
*Como medir:* contar localmente quantas vezes ela foi aberta contra quantas sessões
existiram. Se a razão for próxima de zero — e a seção 3 diz que ela deve ser exatamente
zero para todo save com mais de um ponto —, o item 2 do backlog está confirmado por
número, não por leitura de código.

**H6 — A revelação por progresso é o gancho certo para a tela `A HISTÓRIA`.**
Momento não visto fica oculto, o que é uma boa aposta de retenção. *Como medir:* com a tela
acessível (item 2), ver se as pessoas a abrem **antes** de terminar o jogo — quem abre no
meio está sendo puxado pelo que falta; quem só abre no fim, não. **[DONO]** para qualquer
mudança no conteúdo dos momentos; a medição em si é livre.

---

## 7. O que dá para tirar sem piorar

Levantei isto por `grep` sobre a árvore de trabalho. Cada item foi conferido: ou nada o lê,
ou lê e o resultado não vai a lugar nenhum. **Nada aqui muda uma linha do que o jogador vê.**

**a) O tutorial que nunca aparece.** O elemento `#guia`, seu CSS (`.guiaBolha`, `.guiaRow`,
`.guiaCaret`, duas `@keyframes`, `.guiaAlvo`) e os dois botões `entendi` / `pular`. Nada
adiciona a classe `mostra`, então ele nunca é exibido. Junto saem três listeners que chamam
**funções inexistentes** — `dispensarGuia()` e `pularGuia()` — e as variáveis `guiaAtual`,
`guiaAlvoEl`, `guiaMostradoEm`. Isto é mais que faxina: é exatamente a forma do bug do
`definirModo()` que o `NOTES.md` registrou como "um dos três botões do jogo, quebrado em
produção". Está armado de novo, só que atrás de um `display:none`. **Se o jogo vai ganhar
tutorial, escreva um novo; não religue este.**

**b) O muro.** `CHAVE_MURO`, `MURO_MAX`, `MURO`, `carregarMuro()` — ~20 linhas que leem o
`localStorage`, validam campo a campo e preenchem um array que **nenhuma linha do arquivo
lê**. O painel que o mostrava já foi removido.

**c) A chamada da comunidade.** `atualizarChamada()` tem corpo vazio mas é chamada todo
quadro; `chamada`, `chamadaT`, `chamadaDobrada`, `CFG.chamadaIntervalo`, `CFG.chamadaVolta` e
o bloco no `DOMContentLoaded` que arma `chamadaT` para um temporizador que ninguém avança.

**d) Os anúncios.** `anunciar()` (documentada como "faz nada"), `verificarAnuncios()`
(vazia, chamada todo quadro), `semearAnuncios()`, `alertaMundo()` (vazia, chamada dentro de
`desenhar()`) e as flags `anChamada`, `anMutirao`, `anSuper`, `anBloqueio`, `anTocha`.

**e) O ganho offline que não existe.** `simularOffline()` é um laço que decrementa um
contador e devolve `0`; `CFG.capOfflineHoras` só serve para limitar um `dt` cujo resultado é
descartado. Ou some, ou vira o ganho offline de verdade — **as duas são melhores que a de
hoje, que é código que parece fazer algo e não faz.**

**f) O aviso de volta em inglês.** O bloco que monta `"🌙 AWAY … the neighbourhood knows
you: ×…"`, mais `notaDeVolta()`, que devolve `null` sempre. Se o jogo vai saudar quem volta
— e deveria —, esse texto se escreve do zero em português. Ele não é base para nada.

**g) Onze chaves mortas no `CFG`.** `prodCarvao`, `prodLimpoBase`, `rampaLimpoSeg`,
`tetoLimpo`, `poluicaoPorGerador`, `decaimentoPoluicao`, `bloqueioPorMob`, `dropPorProjeto`,
`superCombos`, `divisorInovacao` — nenhuma é lida em lugar nenhum — mais os comentários
longos sobre projetos especiais, tocha, super e AUTO-FIRE que descrevem sistemas removidos.
**Cuidado com duas vizinhas:** `metaPrestigio` **está viva** (alimenta `worldHealth()`, que
alimenta a paleta em `drawScene()`), e `CFG["custoU" + n]` é a armadilha nº 5 do §7 — os
`custoU1..4` só aparecem por chave montada. Não toque nessas.

**h) CSS de telas que já não existem.** `.loreBox`, `#loreArt`, `#btnBegin`, `#epilogoVoz`
— seletores sem elemento correspondente no documento.

**i) O arquivo vazio chamado `3` na raiz do repositório.** Zero bytes, não rastreado,
provavelmente um redirecionamento de shell que escapou.

**j) [DONO], e por isso não é remoção, é pergunta.** Duas coisas que eu **tiraria** se
mandasse, e não mando:
- **Os três contadores de recurso** (item 7 do backlog): ocupam a maior parte da barra
  superior, nada os gasta, e não são persistidos.
- **A dupla ANDAR/CORRER** (H3): um terço dos botões do jogo, 3% de diferença medida.
  Tirar libera espaço e simplifica; mantê-la só se ela passar a custar ou render algo.

**O que NÃO tirar, apesar da aparência.** As sete pinturas antigas continuam sendo peso morto
no arquivo? Não — o `NOTES.md` já registrou que sem elas `fundoPintado()` vira falso e a tela
esvazia. `worldHealth()` parece herança do jogo anterior e alimenta a cor de tudo. E as
armadilhas do §7 valem inteiras aqui: antes de apagar qualquer corpo de função, validar
balanço de chaves — não procurar o próximo `}` na coluna 0.

**Ordem de grandeza.** Não medi as linhas exatas, mas os itens (a) a (h) são
código-que-não-roda em um arquivo que a última faxina já reduziu em 35%. O ganho não é
tamanho: é que hoje `verificarAnuncios()` e `alertaMundo()` rodam **a cada quadro** sem
fazer nada, e é que a próxima pessoa a ler este arquivo vai gastar meia hora entendendo a
tocha, o mutirão e a chamada antes de descobrir que não existem.
