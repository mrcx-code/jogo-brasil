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

## Roteiro de ondas futuras

- **Onda 3 — a cerimônia vira cinema**: a abertura de era hoje é véu + settle. Dar a ela
  a varredura de luz da virada (nascer do sol na pintura nova), som e 1 s a mais de
  respiro. Nada de arte nova. Agora que a NOITE fecha por pintura, a varredura tem mais
  contraste para varrer — conferir a virada às 0,75 nos prints antes de mexer.
- **Onda 4 — toque com física no canvas**: o mundo reagir ao dedo (onda de chão sutil no
  golpe, kick de câmera de 1–2 px com mola crítica). Câmera é território sensível
  (PASSO_CAP intocável) — protótipo atrás de flag antes de valer.
- **Onda 5 — clima raro**: chuva fina no PÓS-CHUVA (o nome já promete), 1 vez por ciclo,
  partículas na camada da pintura. Escala com nada — clima é fato, não juízo. O teto da
  onda 2 já escurece o zênite do PÓS-CHUVA a 35% — a chuva nasce de um céu que já pesa.
- **Dívida deixada de propósito**: o TARDE das pinturas 0 e 4 (litoral) ainda mede razão
  topo/céu 1,43–1,56 — no print lê como névoa alta acesa pelo sol baixo, que é plausível,
  então a dose ficou contida (princípio 5: quase invisível > dramático). Se o dono achar
  o entardecer tímido, o botão é o `teto` da TARDE (0,55) — subir para ~0,75 aprofunda o
  zênite sem tocar o ouro.
- **Contínuo**: medir FPS e peso a cada onda; qualquer efeito que não sobreviver ao
  print com "isso parece 2026?" sai na onda seguinte. O medidor da onda 2
  (`prints-onda2.js`, na raiz) fica: 6 pinturas × 2 horas, topo/céu/meio e a cor média
  de um mob sob a noite.

## O que foi avaliado e NÃO entrou (para ninguém reabrir sem motivo)

- **Grain de filme**: sobre pintura reencodada em WebP 0,80 a 390 px, grain vira ruído de
  compressão amplificado. Fora até a arte mudar.
- **Scanlines/CRT**: já entraram e saíram uma vez ("greyed down the whole frame"). Não
  voltam.
- **Paralaxe nova, blur, bloom de verdade**: ou quebram o §7 (chão 1:1) ou pedem WebGL.
  O jogo é canvas 2D por decisão; bloom aqui é gradiente, e gradiente já há.
