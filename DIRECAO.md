# DIREÇÃO DE ARTE — BRASIL

## A barra, definida pelo dono em 2026-08-07 (permanente, acima de qualquer onda)

> *"Espero uma qualidade diferenciada e componentes que se conversem, não quero um
> frankenstein, o jogo precisa ser bonito, use referências premiadas para se basear
> (como o Awwwards, mas para um jogo de celular)."*

Três coisas que isso obriga, e valem para toda entrega deste papel:

1. **Componentes conversam ou não entram.** Nada de superfície nova que fale um dialeto
   próprio. A régua do menu (abaixo) é lei; o que não couber nela DERIVA dela, com a
   derivação escrita — nunca inventa.
2. **A barra é prêmio, não "ficou ok".** Antes de entregar, a pergunta não é "quebrou?",
   é *"isto ganharia um prêmio de jogo mobile?"*. Se a resposta for não, itera.
3. **Referência é obrigatória, não decorativa.** Toda decisão visual grande cita a
   referência que a sustenta e o que foi tirado dela — e por que ela serve a um jogo de
   pixel art histórico brasileiro, e não a um portfólio.

## As referências premiadas — o que cada uma dá a ESTE jogo (2026-08-07)

Pesquisadas de verdade (Apple Design Awards, BAFTA, IGF, Peabody), com a pergunta
certa: não "o que é bonito", mas *o que ela faz que este jogo não faz — e serve aqui?*
Um portfólio de Awwwards e um jogo de pixel art histórico brasileiro **não têm a mesma
régua**: Awwwards premia navegação-espetáculo em desktop (scroll cinematográfico, WebGL,
tipografia gigante); jogo mobile premiado ganha por coerência de material, toque nativo
e 60 fps. O que atravessa as duas réguas — e é o que o dono está pedindo — é só isto:
**uma língua visual única e profundidade no detalhe.** Referências, da mais útil à
mais distante:

1. **Art of Fauna** (Apple Design Award 2025) — caderno naturalista de época: gravuras
   de fauna, papel texturizado e tipografia SERIFADA de livro conduzindo tudo. O que ela
   faz que este jogo não fazia: a voz de leitura pertence ao material (tinta de pena
   sobre papel), não ao sistema operacional. **SERVE, e é a referência da onda 6**: o
   nosso papel de campo já existia; a tinta dele é que ainda era Arial Black.
2. **Florence** (ADA 2018 · BAFTA 2019 de jogo mobile) — tema sério e íntimo, zero
   panfleto, e TODA superfície fala uma língua só; a UI é material da história (balões
   que viram peças de quebra-cabeça). **SERVE como régua da barra do dono**: é o
   estado-da-arte de "componentes que se conversam" num jogo de celular premiado.
3. **Dandara: Trials of Fear** (Long Hat House, BRASIL — Palmares na origem do nome;
   pixel art "handcrafted" elogiada pela crítica, mobile de nascença) — prova que jogo
   brasileiro de história em pixel art lê como premium quando a direção é autoral, não
   herdada do motor. **SERVE como irmão direto** — e como aviso: a crítica elogia a
   beleza e cobra a fricção; beleza não compra jogabilidade.
4. **Afterplace** (ADA 2023) — pixel art nascida PARA o telefone: uma mão, gestos, sem
   chrome de desktop. O que faz que este jogo não faz: quase não há HUD; o mundo é a
   interface. **SERVE em parte**: valida a entrada por metades de tela; a lente da
   subtração de HUD fica anotada para quando houver medição pedindo.
5. **Alto's Odyssey** (ADA 2018) — luz dinâmica e hora do dia como identidade, "polish
   até o menor detalhe". **JÁ SERVE**: é a espinha das ondas 1–3; segue sendo a régua
   do sistema de luz.
6. **Never Alone (Kisima Iŋitchuŋa)** (BAFTA Best Debut · Peabody) — co-autoria
   cultural real: "Cultural Ambassadors" Iñupiat dentro dos créditos e do processo.
   **NÃO serve como referência visual** (3D atmosférico, outra linguagem) — serve como
   referência de GOVERNANÇA: é a versão premiada do nosso §2 e do critério do logo
   (grafismo tem dono; representação se decide com quem é representado).

Fontes: apple.com/newsroom (ADA 2023/2025/2026), neveralonegame.com e Peabody via
lakotatimes.com, wikipedia/Florence (premiações), minireview.io e thirdcoastreview.com
(Dandara), altosodyssey.com. Nada disso entra no jogo — a CSP continua fechada; a
pesquisa é de fora.

## A auditoria de conversa — o que AINDA não fala a língua da casa (2026-08-07)

Percorri o jogo inteiro a 390×844 dsf2 (prints `A6-*-antes.png` em `test/`), com a
lista do PM na mão. O veredito, item a item:

1. **CONFIRMO, e era o maior: a voz de leitura.** Todo texto corrido — fala, linha do
   tempo, fontes, retorno — era **Arial Black 900**: peso de manchete em corpo de
   parágrafo, quatro papéis tipográficos (data, título, corpo, fonte) com um peso só.
   Hierarquia por volume não é hierarquia. É o item que a onda 6 corrige (abaixo).
2. **CONFIRMO, e é a próxima frente: os ícones do motor antigo.** Três provas no print
   `A6-jogo-antes.png`: (a) o chip de impacto usa uma folha PROCEDURAL 12×12 com
   contorno **navy `#12242e`** — a cor que a própria paleta proíbe ("no navy anywhere")
   — na mesma fileira de três contadores com arte AUTORAL 26×26: duas folhas de
   dialetos diferentes lado a lado, dizendo coisas diferentes; (b) o botão dourado
   desenha a **varinha mágica do motor antigo** (paleta velha `#eba748` sobre o ouro
   novo `#f3c05c`), um objeto que não existe neste jogo; (c) MELHORIAS usa o martelo
   12×12 do mesmo conjunto velho.
3. **ACRESCENTO: escala não-inteira nos ícones procedurais.** `.pi` é canvas 12×12
   exibido a **20 px (1,67×)** e `.pi.big` a **30 px (2,5×)** — pixel de tamanho
   desigual, o pecado capital da pixel art, visível no glifo da varinha do botão
   principal. Os autorais (26 px em canvas 26) estão em 1×, corretos.
4. **ACRESCENTO: MENU é o único cartão do rodapé sem ícone** — quebra o ritmo
   ícone+rótulo dos vizinhos.
5. **DERRUBO em parte: "HUD de cima e rodapé com densidades diferentes".** A diferença
   de densidade é por função (contadores pequenos, ações grandes) e não incomoda no
   print; o que destoava ali era o item 2 (dialetos de ícone) e o chip de impacto mais
   alto que os três vizinhos. Não é frente própria — resolve junto com os ícones.
6. **Restos de sistema fora das superfícies de leitura** (menores, anotados): o
   `#cerQuando` da cerimônia era sans espaçada (entrou na onda 6 como serifa de
   inscrição); os fallbacks Arial de `.rec b`/`.chip .valor`/`.cartao .cn` só aparecem
   se o bitmap falhar — ficam.

**A frente escolhida — e por quê.** Entre a voz de leitura (1) e os ícones (2–4),
escolhi a **voz de leitura**: a missão do jogo é EDUCAR, a superfície onde ele educa é
o papel, e era exatamente ali que ele falava a língua de site; são cinco superfícies
corrigidas por UM sistema (fala, linha do tempo, fontes, retorno, cerimônia); e é a
maior metragem de tela do frankenstein. Os ícones são a próxima onda do roteiro — com
o diagnóstico já medido acima, é meio dia de mapas de pixel na paleta da casa.

## Onda 6 — IMPLEMENTADA (2026-08-07): A TINTA DO PAPEL

A régua ganhou a linha que faltava, e ela é derivação, não invenção: **madeira e pedra
falam bitmap 5×7; PAPEL fala serifa de caderno de campo; o mundo fala bitmap.** Arial
Black deixa de existir como voz do jogo — vira só fallback de rótulo.

1. **`--leitura`: Georgia → Iowan Old Style → Times New Roman → Noto Serif → serif.**
   Zero rede (§3): tudo fonte do aparelho — Georgia em iOS/macOS/Windows, Noto Serif
   no Android pelo genérico `serif`. Referência que sustenta: Art of Fauna (ADA 2025),
   caderno naturalista com serifa de época; Florence, uma língua por jogo.
2. **A hierarquia de um caderno de campo**, nos cinco papéis: DATA em itálico de
   margem (`.ltQ`, `#falaSub`), TÍTULO em negrito de verbete (`.ltT`), CORPO em
   redonda 400 (`#falaPalco` 16 px, `.ltD`/`.fnT` 13,5 px, `.retLinha` 14 px), FONTE
   em itálico de citação (`.ltF`, `.fnQ`). Os sussurros ("toque para continuar",
   "toque para seguir") viram itálico pequeno — voz de nota, não etiqueta.
3. **A tinta senta na PAUTA**: corpo com entrelinha de **22 px = 2 × a pauta de 11 px**
   do papel — cada linha de texto ocupa duas réguas, e a escrita passa a parecer NO
   papel. É o detalhe que separa "texto sobre um fundo" de "página".
4. **Madeira terminou de falar bitmap**: o QUANDO das placas da linha do tempo
   (`.ltMarcoQuando`) era o último texto de sistema pregado em tábua — virou
   `pixelRotulo` (caps 5×7), com a tinta da placa. A serifa nova é tinta de papel,
   nunca de madeira.
5. **`#cerQuando`** (a inscrição sob o nome da era): serifa em caixa alta espaçada —
   lápide, não etiqueta de app.

**Medido:** prints `A6-*-antes/depois.png` + `A6-historia-marco-depois.png` em `test/`,
olhados um a um com a pergunta do dono ("isto ganharia um prêmio de jogo mobile?") — a
linha do tempo e DE ONDE VEM agora leem como caderno de historiador, e é a primeira vez
que uma tela de leitura deste jogo responde sim. FPS 61/62/61 em três rodadas (piso 58);
`index.html` 3.451.684 → 3.454.226 bytes LF (**+2,5 KB, só código**); zero imagem nova;
zero rede; `npm test` verde sem ajuste em teste nenhum. Glifos conferidos: a 5×7 cobre
todo caractere que as placas usam (acentos, `·`, vírgula, dígitos).

## O diagnóstico — por que o jogo lê como velho, medido no jogo real

Joguei a build a 390×844 dsf2 e olhei com olho de 2026. O que envelhece o jogo NÃO é a
pixel art nem a composição das telas (o menu-poste, o papel de campo e a linha do tempo em
cipó são composição boa, de material e lugar). É isto, em ordem de peso:

1. **O mundo vive num meio-dia eterno.** O motor tem um sistema de hora do dia completo —
   `HORAS` (MANHÃ/TARDE/PÓS-CHUVA/NOITE), `luzDoDia()`, ciclo de 30 min — mas ele só
   alcança o mundo procedural, que as pinturas HD cobriram. `#fundoHD` recebe apenas a
   lavagem de cuidado (`lavarFundo`), nunca a hora. Resultado: a luz do quadro é IDÊNTICA
   no minuto 1 e no minuto 40. Jogo de 2026 tem luz que vive; este tinha e desligou sem
   querer.
2. **Nada respira quando nada acontece.** Parado, o quadro inteiro é estático: partículas
   só existem como estilhaço de golpe. Não há vida ambiente — nem poeira de sol na mata,
   nem vaga-lume ao anoitecer. O menu tem o mundo vivo atrás, mas o mundo parado é cenário,
   não lugar.
3. **O feedback numérico é linear.** Os floats (`+4.0`) sobem a 0,7 px/quadro constante e
   somem. Movimento constante lê como planilha; movimento com física (impulso que
   desacelera) lê como coisa no mundo.
4. **As viradas de capítulo trocam a pintura por corte.** O tema do jogo é ATRAVESSAR O
   TEMPO, e a virada de era — o momento em que mais tempo passa — não move a luz um grau.

## Os princípios — 7, acionáveis

1. **Luz é a modernidade mais barata.** Antes de qualquer shader, partícula ou arte nova:
   a mesma cena sob luz que muda já é outra geração. Toda camada nova entra SOB o sistema
   de horas, nunca por cima dele.
2. **Movimento só com propósito nomeável.** Cada efeito precisa completar a frase "isto
   existe para dizer que ___". Vaga-lume diz "a mata que você cuidou está viva à noite".
   Poeira de sol diz "há luz atravessando a copa". Enfeite que não diz nada, não entra.
3. **O jogo responde ao cuidado, sempre.** `cuidadoVisto`/`worldHealth()` é a alma da
   economia; qualquer sistema visual novo escala com ele. Mundo bem cuidado = mais vivo.
   É a versão visual do que o jogo existe para medir.
4. **Física, não interpolação linear.** Tudo que se move na tela desacelera, assenta ou
   respira — nunca velocidade constante, nunca corte seco. (O CSS das telas já cumpre;
   o canvas ainda não cumpria.)
5. **O pós-processamento serve à leitura, não ao clima.** A direção C tirou scanlines e
   vinhetas porque puxavam o quadro "para a lama". A regra nova não é "nada": é *no máximo
   um passe, quase invisível, e só se o print provar que não come valor*. Grain fica fora
   até prova em contrário.
6. **60 fps é parte da estética.** Efeito que derruba o FPS abaixo de 58 no smoke sai, sem
   discussão. Modernidade que engasga é a mais velha de todas.
7. **Zero arte nova por padrão.** O peso está em 3,9 MB com teto estourado. Evolução
   visual se faz com código sobre a arte que existe; imagem nova só com decisão do dono.

## Onda 1 — IMPLEMENTADA neste sprint

1. **A hora chega à pintura** (`lavarFundo` + passe de tinta em `rolarFundo`): a pintura
   recebe brilho/saturação da hora via filtro CSS (GPU) e a tinta da hora via passe de
   gradiente no canvas — dourado ao entardecer, azul à noite, com piso de valor para nunca
   afundar a leitura. Propósito: o mundo tem dia.
2. **O relógio nasce da hora real do aparelho**: abrir o jogo à noite abre a mata ao
   anoitecer. O ciclo de 30 min continua a partir daí. `window.setHora(f)` existe para
   testes e prints. Propósito: o jogo vive no mesmo dia que a pessoa.
3. **Vida ambiente com propósito**: vaga-lumes ao anoitecer (quantidade escala com
   `cuidadoVisto`) e poeira de sol de dia, desenhados na camada da pintura (atrás do
   jogo, sem tocar leitura nem teste). Propósito: o lugar respira, e respira mais para
   quem cuidou.
4. **Floats com física**: impulso inicial que desacelera em decaimento exponencial, com
   chegada suave. Propósito: número que nasce de um gesto se move como coisa, não como
   planilha.
5. **A virada de era move o sol**: ao trocar de capítulo, o relógio varre ~1 hora de jogo
   em ~2 s — a luz do mundo inteiro rola para frente. Propósito: atravessar o tempo é o
   tema; a virada agora TEM passagem de tempo.
6. **Vinheta de canvas quase invisível** sobre a pintura (0,14 nos cantos): assenta o
   quadro sem escurecer a leitura. Avaliada no print antes de ficar (princípio 5).
7. **Micro-brilho na barra de época**: um glint lento (a cada ~7 s) só na parte
   preenchida. Propósito: o progresso é ouro, e ouro reluz.

## Onda 2 — IMPLEMENTADA (2026-08-07)

1. **A tinta da hora alcançou os sprites do `#scene`** — e a separação sinal×coisa é por
   MOMENTO DO DESENHO, não por camada: um passe `source-atop` roda logo depois de
   `drawMobs()`, quando o canvas só contém folha + mob + sombra; magia, faísca, float,
   barra, anel e texto desenham depois e continuam sem tinta (a regra do sinal vale).
   O item do drop (que desenha tarde, em `desenharMundo`) toma a hora por cópia cacheada
   (`spriteComHora`, refeita a cada 15 s de jogo) e a placa de marco por cor cacheada
   (`tintaCor`). Dose: 80% da do mundo, a mesma da personagem. Medido: um cacho de fruta
   à NOITE lia RGB 136,119,65 (R−B = 71, meio-dia); agora 141,130,99 (R−B = 42) — e o
   valor continua vindo só do passe final, para não pagar duas vezes.
2. **O teto do céu, por pintura** (`CEU_PINT` + campo `teto` nas `HORAS`): cinco das seis
   pinturas guardavam uma faixa CLARA no alto do quadro que à NOITE era a coisa mais
   clara da tela — razão topo/céu medida no ANTES: 1,45 / 0,89 / 1,37 / 1,28 / 1,58 /
   1,35 (céu noturno de verdade brilha de BAIXO; a razão certa é ≤ ~1,1). Um gradiente
   por pintura, calibrado em duas rodadas de medição (`prints-onda2.js`), fechou em
   1,13 / 0,84 / 1,10 / 1,11 / 1,18 / 1,12. No entardecer o mesmo teto entra a 55% com
   azul-violeta — o zênite afunda enquanto o horizonte guarda o ouro, que é o que um fim
   de tarde faz. FPS 62 nas três rodadas; +8,8 KB de código; zero imagem nova.

**A fragilidade (b) da onda 2 foi PAGA em 2026-08-07, com a chegada de SALVADOR.** Era ela:
`CEU_PINT` é indexada por pintura, e pintura nova sem entrada cai na [0] por guarda, que é
chute. Duas coisas mudaram e as duas ficam:

- O `prints-onda2.js` deixou de contar 6 pinturas com um literal e lê
  `CENARIO_ALTO_B64.length`. Instrumento com número escrito à mão mede o passado — este
  mediria seis e calaria justamente sobre a sétima, a única ainda não calibrada.
- Nasceu o `test/calibrar-ceu.js`: varre doses numa pintura e imprime topo/céu na tarde e na
  noite, para a dose sair de uma curva e não de duas rodadas no olho.

SALVADOR é o segundo caso (depois da pintura 1) de pintura **sem** faixa clara — o alto do
quadro é telhado, não névoa. Sem dose nenhuma já media 1,04 à noite. Ficou com 0,10, a dose
mínima da pintura 1 e pelo mesmo motivo: para o zênite dela AFUNDAR junto com as irmãs no
entardecer, em vez de ser a única parada. Depois: 1,09 tarde, 0,99 noite. As sete, à noite:
1,13 · 0,84 · 1,10 · 1,11 · **0,99** · 1,17 · 1,01.

**Regra que fica desta rodada:** arte nova de cenário e `prints-onda2.js` no MESMO commit —
e a ordem de `CEU_PINT` é a das CENAS, não a de chegada da arte. SALVADOR entrou entre
Palmares e hoje porque 1835 vem antes de agora, e a lista foi reordenada junto com todas as
outras listas por capítulo.

## Onda 3 — IMPLEMENTADA (2026-08-07)

A cerimônia de virada de era virou cinema, medida antes e depois com um instrumento novo
(`test/prints-onda3.js`: provoca uma virada REAL cruzando o limiar de impacto com a hora
fixada, fotografa a cerimônia em seis marcas de tempo e mede fração do dia + luma do céu
em cada uma; um MutationObserver mede a duração real da classe `cerimoniando`).

1. **A varredura TERMINA no nascer do sol.** O ANTES media o problema: a varredura era
   "+1 hora de onde estiver" — partindo de 0,40 a era nova abria às 0,654, ANOITECENDO
   (céu caindo 76→67 ao longo da cerimônia); só partindo de 0,75 o amanhecer acontecia
   por coincidência aritmética. Agora a virada de CAPÍTULO varre até a próxima manhã
   (`max(1 hora, o que falta até fração 0)`), sempre na pintura nova, atrás da placa —
   medido: dos dois pontos de partida a cerimônia fecha com o dia em 0,00. Entre cenas
   do MESMO capítulo segue a hora de sempre (uma hora, sem alvo).
2. **A varredura ganhou física** (princípio 4): decaimento exponencial com piso, em vez
   de 220 s/s linear — parte depressa e assenta chegando. Do pior caso (quase um dia até
   a manhã) leva ~2,3 s; da varredura mínima ~1,5 s. Sempre acaba dentro da cerimônia.
3. **Um segundo a mais de respiro**: 2,41 s → 3,46 s medidos. É o que deixa o sol chegar
   com a placa ainda de pé e o nome descansar assentado antes de a caixa subir. O toque
   continua encerrando na hora.
4. **O som do sol**: `somEra` ganhou uma voz a mais SÓ na virada de capítulo — senoide
   alta (880 Hz) inchando em meio segundo de ataque, um segundo depois do arpejo, junto
   com a luz. Baixa (0,07): quem não reparar não nota; quem reparar ouve o amanhecer.
5. **O float "NOVA ERA" sai de cena na virada de capítulo** — o print do ANTES o pegou
   atravessando a placa dizendo o que ela já diz, dois títulos disputando o quadro. Nas
   trocas de cena sem cerimônia ele continua, porque ali é o único aviso.

FPS 61/61/62 nas três rodadas (piso 58); +1,9 KB; zero imagem nova; zero rede. Prints
`A3-*`/`D3-*` em `test/` (noite 0,75 e tarde 0,40 × seis tempos).

## A composição do quadro — IMPLEMENTADA (2026-08-07)

Pedido do dono: *"a tela tá muito poluída com tantos elementos ao mesmo tempo, deve ser
aleatório mas não desorganizado ou caótico"* — e, na mesma família: *"temos vários itens
voando no jogo haha, não faz sentido, deveriam estar presos ao chão"*. O diagnóstico do PM
estava certo e foi confirmado com instrumento novo (`test/prints-composicao.js`): a
quantidade já estava baixa (média 4,7–5,4 objetos no pior cenário); o que lia como caos era
o ONDE — altura sorteada em faixa contínua punha **34% das folhas visíveis na faixa do
corpo** (h 30–52, a mesma da cabeça da personagem, dos mobs e de quem chega), e **20% dos
quadros tinham folha cruzando uma silhueta no mesmo X**. Duas regras novas de direção:

1. **Aleatório no tempo, organizado no espaço.** O QUANDO continua sorteado (a rua não pode
   virar relógio); o ONDE anda em TRILHOS: chão (h 16–26, pega-se passando), copa (h 56–74,
   pega-se pulando), e o meio VAZIO de propósito — é a faixa onde vivem as silhuetas.
   Peso 55/45 entre os trilhos preserva a fração pega andando e com ela a renda. Mais um
   respiro horizontal na entrada: folha que nasceria a <28 px de uma chegada entra 30 px
   depois (adia, nunca rejeita — em Palmares ninguém corta cota de gente).
2. **Sinal não aparece sobre leitura** — a regra irmã de "sinal não toma tinta" (onda 2).
   O mundo vive atrás do véu das telas, e a personagem passava por folhas sozinha: um
   "+4.0" subia POR CIMA da tela de história (print do dono). Todo float nasce por
   `novoFloat()`: sob `body.emTela` não nasce (o ganho fica, o número cala) e os vivos
   somem no desenho.
3. **Tudo encosta no chão; só flutua o que voa por natureza.** `MOB_LIFT` do smog (herança
   do motor de rua, onde smog era fumaça) zerado — o cacho do cap 1 boiava a 32 px de tela.
   Drops assentados: a base do item em `GROUND` (era `GROUND−6` ± balanço senoidal, que em
   coisa apoiada é tremor), com sombra de contato que esmaece junto. A única exceção
   legítima é a folha ao vento.

**Medido (antes → depois):** folhas na faixa do corpo 34% → **0%**; quadros com colisão de
silhueta 20% → **0%**; floats vivos sob tela 3 → **0** (e golpe sob tela não nasce número);
renda/min nas seis células do `medir-poluicao.js` variou de −0,7% a +1,5% (limite ±10%);
FPS 61 no smoke; zero imagem nova. Prints `COMP-A-*`/`COMP-D-*` em `test/`.

## Onda 5 — IMPLEMENTADA (2026-08-07): VOLTAR É AMANHECER

**A decisão, e por que a chuva perdeu.** Meu roteiro previa chuva no PÓS-CHUVA; o PM
propôs no `SPRINT.md` §3.3 trocar por uma onda do retorno. A decisão é minha, e decido
**pelo retorno** — não por deferência, mas porque a chuva perde no confronto com os meus
próprios princípios:

- **Princípio 2 (propósito nomeável):** a chuva diz "está chovendo". O amanhecer do
  retorno diz *"valeu a pena voltar"* — e essa é a frase que a pergunta aberta do
  produto (alguém volta no dia 2?) precisa que o jogo diga.
- **Princípio 3 (responde ao cuidado):** chuva escala com nada — eu mesma escrevi. O
  amanhecer só existe para quem voltou, e o que ele acende — poeira de sol, mata,
  quem foi acolhida vivendo na faixa final — já escala com `cuidadoVisto`. Zero linha
  nova de escala; a resposta ao cuidado vem de graça.
- **Princípio 1 (luz antes de partícula):** chuva é partícula; o retorno é luz. A onda
  mais barata e mais moderna das duas.
- E o custo marginal: a onda 3 já construiu a varredura, a física e a voz do sol. O
  retorno reaproveita os três; a chuva construiria do zero.

A chuva não morre: desce no roteiro como candidata (abaixo), atrás de qualquer coisa
que mova a pergunta do dia 2.

**O desenho.** Fechar o papel "ENQUANTO VOCÊ ESTEVE FORA" num **dia novo de travessia**
(`diaNovo` — a régua da retenção, não qualquer pausa de café) dispara a varredura de luz
até a próxima manhã, pelo MESMO canal da virada de era (`saltoHora`, com a física da
onda 3), com a voz do sol sozinha e mais baixa (0,06, sem arpejo — não é cerimônia, é
chegada). O menu está aberto atrás e o menu tem o mundo vivo: o lugar acorda com a
pessoa na porta. A licença de mexer no relógio semeado pela hora real é a MESMA da onda
3 ("era nova é dia novo"), aqui literal: dia novo É dia novo. Guardas: já é manhã
(fração ≤ 0,04) → não fala; varredura de cerimônia em curso → não empilha. Retorno no
mesmo dia (café, almoço) → nada, para o amanhecer não virar moeda.

**Medido** (`test/prints-onda5.js`, novo — provoca o dia 2 REAL: save de 20 h atrás +
retenção só com ontem, recarrega, fecha o papel com o toque do jogo, marca em tempo
REAL): ANTES, fechar o papel deixava a fração do dia onde estava (0,752 / 0,402 — a
pessoa voltava para a mesma noite parada). DEPOIS, dos dois pontos de partida a luz
fecha em **0,001–0,002** (manhã) em ~1,8–2,0 s, assentando com a física — céu (luma
10–30%) 71 → 101 partindo da noite. Prints `O5-A-*`/`O5-D-*` em `test/`: o D-t3.40 é o
menu com a mata acesa de manhã e a acolhida visível na luz; o A-t3.40 é a mesma cena
numa noite que não respondeu. FPS 61/61/61 (piso 58); `index.html` 4.560.521 →
4.562.826 bytes LF (+2,3 KB, só código); zero imagem nova; zero rede; `npm test` verde
(o fluxo day-2 do smoke continua passando sem ajuste).

**Armadilha nova, paga e anotada no instrumento:** o jogo salva no `pagehide` — adulterar
o save e recarregar na mesma página desfaz a adulteração. O instrumento neutraliza
`salvar`/`salvarRetencao` antes do reload.

**Fora do meu território, confirmado de passagem:** o print `O5-A-0-retorno.png` pegou o
papel do retorno abrindo ATRÁS do logo e da tagline — é o z-index que o Dev já está
consertando em paralelo; não toquei.

## Roteiro de ondas futuras

- **Onda 7 — os ícones falam a língua da casa** (diagnóstico pronto na auditoria acima):
  redesenhar como mapas de pixel na paleta ATUAL (tinta `#2a2418` sobre pedra, contorno
  `#191510` — nunca o navy `#12242e` do motor antigo) os três ícones procedurais que
  restam; aposentar a VARINHA do botão dourado por um ícone do gesto deste jogo; dar
  ícone ao cartão MENU; e matar a escala não-inteira (12→20/30 px) desenhando em 13×13
  exibido a 26 px (2× exato). Zero imagem: mapa de pixel é código. Meio dia.
- **Onda 4 — toque com física no canvas**: FEITA — `atualizarKick` no laço, mola do
  quadro no relógio do quadro.
- **Clima raro (ex-onda 5, rebaixada em 2026-08-07)**: chuva fina no PÓS-CHUVA, 1 vez
  por ciclo, partículas na camada da pintura. Perdeu a vez para o retorno (ver onda 5:
  escala com nada, diz pouco, custa mais). Só volta ao topo quando houver medição
  dizendo que a pergunta do dia 2 está respondida — ou pedido do dono.
- **Dívida deixada de propósito**: o TARDE das pinturas 0 e 4 (litoral) ainda mede razão
  topo/céu 1,43–1,56 — no print lê como névoa alta acesa pelo sol baixo, que é plausível,
  então a dose ficou contida (princípio 5: quase invisível > dramático). Se o dono achar
  o entardecer tímido, o botão é o `teto` da TARDE (0,55) — subir para ~0,75 aprofunda o
  zênite sem tocar o ouro.
- **Contínuo**: medir FPS e peso a cada onda; qualquer efeito que não sobreviver ao
  print com "isso parece 2026?" sai na onda seguinte. Os medidores ficam em `test/`:
  `prints-onda2.js` (todas as pinturas × 2 horas, topo/céu/meio e a cor média de um mob sob
  a noite — o caminho para o `index.html` e a contagem de pinturas foram consertados em
  2026-08-07), `calibrar-ceu.js` (varredura de dose numa pintura), `prints-onda3.js`
  (virada de era real, cerimônia no tempo) e `prints-onda5.js` (retorno de dia 2 real,
  o amanhecer no tempo).

## A RÉGUA DO MENU — a especificação que toda superfície de UI segue

Mandato do dono (2026-08-07): *"o menu e botões não se conversam, todos devem seguir a
estética do menu principal."* O MENU PRINCIPAL é o padrão-ouro; tudo se ajusta a ele,
nunca o contrário. Medido do print `test/C-menu-antes.png` (390×844 dsf2) e do CSS que
o produz — nenhuma tela futura tem desculpa:

**Os materiais — três, cada um com UM sentido (já era lei; a régua a torna medível):**

| material | onde | receita |
|---|---|---|
| **MADEIRA escura** | navegação e placas (tábuas do poste, títulos, PULAR, plaquinha da época) | `linear-gradient(180deg, #7c552c → #4c3016)` + veio `repeating-linear-gradient` de 2px/8px; título/placa usa a madeira mais escura `#503319 → #38220e` |
| **MADEIRA clara** | o destaque (JOGAR, a era atual) — destaque por MATERIAL, nunca por tamanho ou ouro | `#b8834a → #7c4f24`, mesmo veio |
| **PEDRA** | ferramenta de jogo (rodapé, nichos do HUD, bandeja de MELHORIAS) | chapada `#a39a83`; acesa `#bcb298`; encardida `#8f8770` |
| **OURO** | SÓ a ação principal do contexto (botão de golpe) | `#f3c05c`/base `--ouroA` |
| **PAPEL de campo** | toda superfície cuja função é LER (caixa de fala, AJUSTES-info, retorno, e — desta passada — os cartões de A HISTÓRIA e DE ONDE VEM) | pauta `repeating-linear-gradient(0deg, rgba(120,90,40,.06) 0 1px, transparent 1px 11px)` sobre `--papel → --papel2`, tinta escura `--tintaP` |

**A construção — a mesma laje sempre, quatro coisas em box-shadow empilhado:**

1. luz na aresta de cima: `inset 0 3px 0 <tom claro>` (2px nas peças pequenas);
2. sombra na aresta de baixo: `inset 0 -4px 0 <tom escuro>` (−2/−3 nas pequenas);
3. contorno escuro duro: `inset 0 0 0 2px <quase-preto do material>`;
4. o degrau que a apoia: `0 5px 0 <#120c06|#191510>` + `0 7px 0 rgba(0,0,0,.4)`
   (3px nas peças pequenas). Papel usa moldura de madeira no lugar de luz/sombra:
   `inset 0 0 0 3px #241a10, inset 0 0 0 7px #7a5430` (2px/5px no recorte pequeno).

**Raio:** 0–5px, sempre — 2–3px em madeira, 4–5px em pedra. Canto ≥ 8px é vocabulário
de aplicativo e não entra. **Toque:** `:active` desce `translateY(4px)` e o degrau
some (`0 1px 0`) — a tábua afunda até onde o degrau estava. **Rótulo:** todo rótulo de
botão e título é fonte bitmap 5×7 via `pixelRotulo` (escala 1–4); texto corrido de
leitura pode ser a fonte do sistema, mas SEMPRE tinta escura sobre papel — nunca texto
claro sobre painel preto, que é o vocabulário de site que esta régua existe para matar.
**Pregos** só nas tábuas do poste. **Nada de navy, nada de painel translúcido.**

A passada de consistência (prints `C-*-antes/depois.png` em `test/`) aplicou a régua a
A HISTÓRIA e DE ONDE VEM (nichos pretos de texto claro → papel de campo com tinta) e
removeu o CSS morto do motor antigo (`#cartao` navy, `#offline`, `.pop`, `.tend`).

## O que foi avaliado e NÃO entrou (para ninguém reabrir sem motivo)

- **Grain de filme**: sobre pintura reencodada em WebP 0,80 a 390 px, grain vira ruído de
  compressão amplificado. Fora até a arte mudar.
- **Scanlines/CRT**: já entraram e saíram uma vez ("greyed down the whole frame"). Não
  voltam.
- **Paralaxe nova, blur, bloom de verdade**: ou quebram o §7 (chão 1:1) ou pedem WebGL.
  O jogo é canvas 2D por decisão; bloom aqui é gradiente, e gradiente já há.
