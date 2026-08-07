# DIREÇÃO DE EVOLUÇÃO — o que "moderno" significa para BRASIL

Mandato criado pelo dono em 2026-08-07: *"use todo o potencial para trazer o jogo para o
futuro, esse layout parece tão velho"*. Este documento é a visão que os sprints de evolução
seguem. Ele NÃO revoga nada do `CLAUDE.md` §2 (representação se decide com o dono), nem o
logo, nem o nome, nem as regras técnicas, nem a regra de que economia só muda com medição.

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

## Roteiro de ondas futuras

- **Onda 4 — toque com física no canvas**: o mundo reagir ao dedo (onda de chão sutil no
  golpe, kick de câmera de 1–2 px com mola crítica). Câmera é território sensível
  (PASSO_CAP intocável) — protótipo atrás de flag antes de valer.
  Refinado pela onda 3: o instrumento certo já existe como molde — medir ANTES com um
  script dedicado que provoca o gesto real e fotografa em marcas de tempo, não confiar
  no olho. E registrar o tempo REAL de cada marca (o screenshot atrasa; a onda 3 pagou
  meia sessão até perceber que as marcas nominais mentiam ~0,5 s).
- **Onda 5 — clima raro**: chuva fina no PÓS-CHUVA (o nome já promete), 1 vez por ciclo,
  partículas na camada da pintura. Escala com nada — clima é fato, não juízo. O teto da
  onda 2 já escurece o zênite do PÓS-CHUVA a 35% — a chuva nasce de um céu que já pesa.
- **Dívida deixada de propósito**: o TARDE das pinturas 0 e 4 (litoral) ainda mede razão
  topo/céu 1,43–1,56 — no print lê como névoa alta acesa pelo sol baixo, que é plausível,
  então a dose ficou contida (princípio 5: quase invisível > dramático). Se o dono achar
  o entardecer tímido, o botão é o `teto` da TARDE (0,55) — subir para ~0,75 aprofunda o
  zênite sem tocar o ouro.
- **Contínuo**: medir FPS e peso a cada onda; qualquer efeito que não sobreviver ao
  print com "isso parece 2026?" sai na onda seguinte. Os medidores ficam em `test/`:
  `prints-onda2.js` (6 pinturas × 2 horas, topo/céu/meio e a cor média de um mob sob a
  noite — atenção: o caminho dele para o `index.html` precisa de ajuste desde que foi
  movido da raiz) e `prints-onda3.js` (virada de era real, cerimônia no tempo).

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
