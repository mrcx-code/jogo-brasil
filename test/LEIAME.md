# test/ — o que roda aqui

## `smoke.js` — o único teste

```bash
node test/smoke.js
```

Headless, viewport 390×844. Falha se houver erro de console, se o segurar-pra-atacar parar
de repetir, se um upgrade não aplicar, se a metade errada da tela responder, se um save
adulterado envenenar o estado, ou se os monstros pararem de andar. Salva prints
`shot-*.png` (ignorados pelo git). **Tem que passar antes de todo push.**

## Pipeline de sprites

A arte da personagem chega de fora como folha em fundo **magenta `#FF00FF`**, hoje em
**grade** (`4x3`, `3x2`, `4x1`) e não em tira, porque o gerador não desenha uma tira de
12,6:1. As folhas do capítulo 1 estão em `assets/entrada/` (fora do git, é entrada bruta).
Reproduzir a personagem do capítulo 1:

```bash
# 1. recortar. Argumentos: folha, grade, saída, compressão vertical, e quais células manter.
#    --quadros escolhe E ORDENA: a caminhada sai da célula 6, depois 5, depois 2.
node test/recortar-folha.js assets/entrada/sprite-cap1-andar.png    4x3 /tmp/andar.json 0 --quadros=6,5,2
node test/recortar-folha.js assets/entrada/sprite-cap1-pular.png    3x2 /tmp/pular.json 0
node test/recortar-folha.js assets/entrada/sprite-cap1-alcancar.png 4x1 /tmp/alc.json   0 --quadros=2,3,4,1

# 2. conferir se as folhas foram desenhadas na mesma escala (mede LARGURA DA CABEÇA,
#    que é a única medida que não muda com a pose) e reescalar as que destoarem.
#    O 4º argumento do reescalar é a largura do quadro de destino (191 se omitido).
node test/medir-escala.js /tmp/andar.json /tmp/pular.json
node test/reescalar.js /tmp/pular.json 0.7933 /tmp/pular2.json 309
node test/reescalar.js /tmp/alc.json   0.5672 /tmp/alc2.json   260

# 3. embutir no index.html. A forma com chave aceita qualquer bloco, e chave vazia esvazia:
node test/embutir-heroi.js walk=/tmp/andar.json run= sp=/tmp/pular2.json \
                           atk1=/tmp/alc2.json atk2=/tmp/alc2.json
```

**Atenção ao `medir-escala.js` em pose de braço levantado.** Ele mede a linha mais larga do
quinto superior da figura, e um braço erguido ou esticado entra nesse quinto e infla o
número: na folha de salto ele deu `99, 157, 93, 104, 91, 92` — o 157 é o braço do quadro do
impulso, não a cabeça. Use a mediana, não a média que ele imprime.

Os capítulos 2 e 3 seguem o mesmo caminho, com as **suas** escolhas de célula — a folha do
capítulo 1 não responde por nenhuma outra:

```bash
node test/recortar-folha.js assets/entrada/sprite-cap2-andar.png    4x3 /tmp/c2.json   0 --quadros=1,5,8
node test/recortar-folha.js assets/entrada/sprite-cap2-pular.png    5x1 /tmp/c2p.json  0
node test/recortar-folha.js assets/entrada/sprite-cap2-alcancar.png 5x1 /tmp/c2a.json  0 --quadros=2,3,4,5,1
node test/reescalar.js /tmp/c2p.json 0.6778 /tmp/c2p2.json 280
node test/reescalar.js /tmp/c2a.json 0.6559 /tmp/c2a2.json 303
node test/recortar-folha.js assets/entrada/sprite-cap3-andar.png    4x3 /tmp/c3.json   0 --quadros=7,11,2
node test/recortar-folha.js assets/entrada/sprite-cap3-pular.png    3x2 /tmp/c3p.json  0
node test/recortar-folha.js assets/entrada/sprite-cap3-alcancar.png 2x2 /tmp/c3a.json  0
node test/reescalar.js /tmp/c3p.json 0.6436 /tmp/c3p2.json 300
node test/reescalar.js /tmp/c3a.json 0.6280 /tmp/c3a2.json 240
node test/embutir-heroi.js walk2=/tmp/c2.json walk3=/tmp/c3.json sp3=/tmp/c3p2.json \
                           sp2=/tmp/c2p2.json atk1_2=/tmp/c2a2.json atk2_2=/tmp/c2a2.json \
                           atk1_3=/tmp/c3a2.json atk2_3=/tmp/c3a2.json
```

**A grade anunciada no pedido não é a grade da folha.** As três folhas refeitas do capítulo 2
vieram com `.txt` dizendo `4x3`, `3x2` e `4x1`; as imagens têm 8 poses em `4x2`, 5 em `5x1` e
5 em `5x1`. Conte as manchas com o `validar-folha.js` sem passar grade nenhuma antes de cortar
— ele diz quantas achou, e é esse número que manda. Passar a grade errada não dá erro: o
cortador reparte a faixa em células erradas e devolve quadros com duas metades de pessoa.

**A ordem de `alcancar` termina em REPOUSO.** A animação toca uma vez por toque e volta ao
estado parado, então a pose neutra vai por último: no capítulo 1 é `--quadros=2,3,4,1`, no 2 é
`--quadros=2,3,4,5,1` (esticar, esticar fundo, receber, abraçar, repousar). Sem isso o gesto
começa em repouso e congela segurando a coisa.

As chaves com sufixo são os blocos por capítulo: sem sufixo é o capítulo 1, `2` e `3` são os
outros. Um bloco vazio faz aquele capítulo cair na **própria caminhada dele**, nunca na de
outro capítulo — trocar a pessoa no meio de um capítulo é o erro do CLAUDE.md §2.

### A folha nem sempre é um ciclo, e o `--quadros` é a resposta

A folha de caminhada do capítulo 1 tem doze figuras da **mesma pessoa** (CV de 1,0% na
largura da cabeça) mas só **três fases distintas**. Medido em `discordância de silhueta da
metade de baixo`: as células 3, 4, 6, 7, 8, 9 divergem entre si de 11% a 19% e têm o
calcanhar do pé da frente entre +31 e +42 px de sprite — dez px de sprite é **1,4 px de
mundo**, ou seja a mesma pose na tela. As células 5, 10, 11 e 12 divergem de 4% a 13% entre
si: quatro cópias da passagem. Sobram três fases reais.

Enfiar as doze num ciclo puxado pela distância deixa o pé parado por vários quadros e depois
o faz saltar — é isso que lê como manqueira, e `PASSO_PX` certo não salva.

**Cada folha tem a própria estrutura de fases.** No capítulo 1 sobram três de doze e elas são
as células 6, 5, 2. No capítulo 2 são 1, 5, 8; no 3, 7, 11, 2. Não há como adivinhar: os
índices repetidos de uma folha dizem quais quadros *sobram*, não quais formam o ciclo.

**A medição virou ferramenta: `medir-sola.js`.** Até o capítulo 4 isto se fazia à mão, folha
por folha. Agora:

```bash
node test/validar-folha.js assets/entrada/cap4-sprite-v2.png            # quantas manchas? 8
node test/validar-folha.js assets/entrada/cap4-sprite-v2.png 4x2        # e batem 4|4?
node test/recortar-folha.js assets/entrada/cap4-sprite-v2.png 4x2 /tmp/todos.json 0
node test/medir-sola.js /tmp/todos.json --faixa=18      # o pé quadro a quadro
node test/medir-sola.js /tmp/todos.json --ciclo=2,3,4   # e o escorregamento do ciclo
node test/montar-quadros.js /tmp/todos.json /tmp/pes.png 0.62 --pes=18   # e olhar
```

**A grade sem grade vem primeiro.** `validar-folha.js` sem argumento de grade conta as manchas
e é esse número que manda; a v2 foi pedida com 12 poses e entregou 8. Só depois se confere a
grade candidata (`4x2`), que tem de fechar `4 | 4` por linha. A folha da v2 tem as figuras
DESCENTRADAS nas células (a quarta cruza a linha da célula em 1330 px), e mesmo assim o corte
sai inteiro, porque o recortador preenche a mancha na folha toda e reancora pela cabeça — é
para isso que essas duas decisões existem.

`medir-sola.js` imprime duas leituras por quadro. A **SOLA** é a do parágrafo abaixo: colunas
cuja tinta mais baixa fica a ≤ 2 px da base. Os **PÉS** são os borrões da faixa de baixo
(`--faixa`, em px acima da base) — existem porque a sola só enxerga o pé que encosta, e o
rastro de um pé que levanta o calcanhar fica com buraco. `--faixa` tem de ficar ABAIXO da
barra do vestido ou da túnica: com 45 px a saia da ganhadeira colava os dois pés num borrão
só, e com 18 eles se separaram. O quadro já vem ancorado pela cabeça, então x é comparável
entre quadros.

**O que fazer quando a folha não é um ciclo.** Foi o caso do capítulo 4 e é o caso dele até
hoje. A PRIMEIRA folha (`cap4-sprite.png`) tinha onze poses e o calcanhar do pé de apoio só
aparecia na chegada e na saída, sem nenhuma pose no meio do apoio: **87,80%** de escorregamento
pela régua do `medir-sola.js`, contra 0,00% (cap 1) e 1,82% (cap 2) medidos com esta mesma
ferramenta. A SEGUNDA (`cap4-sprite-v2.png`, 2026-08-07), pedida como *ciclo descrito pose a
pose*, veio com **8 poses em 4x2** e continua não sendo um ciclo — só que agora dá para provar
com uma varredura em vez de com um argumento:

- quadros 1, 4, 5, 8 → o MESMO apoio duplo, calcanhar de trás em 57 / 58 / 55 / 56 px
  (três px de amplitude entre quatro poses);
- quadros 2, 3, 6, 7 → a MESMA passagem, calcanhar em 96 a 122;
- entre 230 (o pé acabou de tocar à frente) e 122, nenhuma pose. É o trecho do APOIO.

Varridos os 42 ciclos de três quadros e os 89 de quatro que a folha permite, o melhor é
**2→3→4 com 18,75%** e o melhor de quatro é 37,9%. Foi essa a folha que entrou, porque 87,80%
→ 18,75% é 4,7× e a sola desliza 4,4 px de mundo por segundo contra 28,9 da anterior — mas
**18,75% não é a faixa das outras eras e o `PASSO_CAP` diz isso em voz alta**. A lição de
método, que vale para a próxima folha de qualquer capítulo: quando a folha não fecha, varra
TODOS os ciclos possíveis antes de concluir, e diga no pedido novo **quais poses faltam** —
aqui, as do pé plantado com o corpo passando por cima dele. Quatro das oito poses entregues
são cópias do contato e podem ser trocadas por essas quatro. Código nenhum conserta isto.

**O laço pela separação dos calcanhares é FALLBACK, e desconfie dele.** A primeira folha do
capítulo 4 derivou o `laco` da separação entre os dois calcanhares no apoio duplo porque as
recessões eram inúteis. Medido depois no capítulo 1, cuja caminhada é perfeita: as separações
dão 110 e 68 px enquanto o laço pelas recessões dá 141 — a separação erra em 58% justamente
onde não há erro nenhum a medir. Ela serve para saber que a folha tem uma passada; não serve
para dizer o tamanho dela. **O laço sai das recessões do calcanhar** (`recuo médio × n` do
`medir-sola.js --ciclo`), como nos capítulos 1, 2 e 4, e é o que a folha nova usa.

**Como escolher, com número e não com olho:** meça a **sola**, não o centroide do pé. No
apoio duplo o pé de trás está na ponta e o da frente chapado, e os centroides mentem sobre
onde cada um encosta. A sola é o trecho de colunas cuja tinta mais baixa fica a ≤ 2 px da
base da figura; ela sai com 45–49 px quando o pé está chapado e com 14–16 quando está na
ponta ou no calcanhar. O marco que serve de régua é o **calcanhar** (borda esquerda da
sola). Ele tem que andar para trás em passos iguais; se anda, o pé está plantado.

### O que cada decisão do recortador resolve

**Corte em células iguais, não por colunas vazias.** A varinha atravessa a linha da
célula, então uma divisão por espaço em branco cola um quadro no outro.

**Mancha preenchida na folha inteira**, semeada pela coluna com mais tinta *dentro* da
célula — o corpo, nunca a ponta da varinha. Assim a varinha vem junto sem trazer o
vizinho. Aborta se uma mancha passar de 1,9 célula: sinal de que duas personagens
encostaram.

**Âncora na cabeça** (centro do quinto superior). Ancorar pelo pé mais baixo faz ela
avançar e recuar, porque numa passada o pé mais baixo é ora o da frente ora o de trás.
Medido na folha de caminhada: 49 px de deriva ancorando pela célula, 0,8 px pela cabeça.

**Desfranjamento.** Os pixels do contorno são uma *mistura* da personagem com o magenta.
Um teste binário os deixa passar com opacidade total e pinta um aro rosa. O recortador
mede `min(R,B) − G` — alto no fundo, baixo na personagem, intermediário exatamente na
borda — usa isso como alfa e desmistura a cor: `F = (C − (1−a)·B) / a`.

**Compressão vertical** (último argumento):

| valor | efeito | usar quando |
|---|---|---|
| `1` | preserva a subida e descida da folha | quando o balanço da folha é autoral |
| `0.35` | achata para 35% | folha que sobe muito — 57 px numa personagem de 44 lê como pulinho |
| `0` | achata tudo | **todas as folhas do capítulo 1**, e o pulo, cujo arco o código já desenha |

**Por que o capítulo 1 usa `0` até na caminhada.** Numa folha em GRADE, o desnível vertical
entre poses não é balanço: é o degrau entre as **linhas da grade**. Medido na folha de
caminhada, a base das poses cai em 387 / 353 / 322 px conforme a linha, e *dentro* de cada
linha varia ±1,5 px. As doze figuras medem 318 a 323 px de altura — 1,5% de variação, ou
seja, a personagem não sobe nem desce. Achatar não perde balanço nenhum e resolve dois
problemas de uma vez: o quadro deixa de ter 388 px de altura para ter 322 (a personagem
renderizava a 36,6 px de mundo em vez de 44, porque `heroScale = HERO_TARGET / altura do
quadro`), e a sola passa a encostar na borda de baixo, o que zera o `HERO_PISO`.

## Um capítulo inteiro, do zero: o que SALVADOR (cap. 4) pediu

A ordem que funcionou, com as oito imagens em `assets/entrada/cap4-*.png`:

```bash
# 1. a personagem — medir antes de cortar, cortar depois de escolher o ciclo
node test/validar-folha.js assets/entrada/cap4-sprite-v2.png         # quantas manchas? 8
node test/recortar-folha.js assets/entrada/cap4-sprite-v2.png 4x2 /tmp/todos.json 0
node test/medir-sola.js /tmp/todos.json --faixa=18                   # escolhe o ciclo
# --qualidade é a do CLAUDE.md §6 para a personagem. Encodar já na qualidade final evita o
# segundo passo de compressão que o requalificar.js faria em cima do primeiro.
node test/recortar-folha.js assets/entrada/cap4-sprite-v2.png 4x2 /tmp/andar.json 0 \
                            --quadros=2,3,4 --qualidade=0.76
node test/embutir-heroi.js walk4=/tmp/andar.json atk1_4= atk2_4= sp4= run4=

# 2. as pinturas (duas peças por cena)
node test/converter-fundo.js assets/entrada/cap4-fundo-alto.png alto assets/cenarios-novos/cap4-alto.png
node test/converter-fundo.js assets/entrada/cap4-fundo-chao.png baixo assets/cenarios-novos/cap4-baixo.png
node test/inline-fundos.js            # CAPS, no arquivo, é a ordem das CENAS

# 3. objetos e drops — a folha vem com três numa imagem só
node test/cortar-celulas.js assets/entrada/cap4-itens.png 3x1 assets/entrada/cap4-item
node test/converter-objeto.js assets/entrada/cap4-item-1.png assets/objetos/cap4-obj-tabuleiro.webp 120 24
node test/converter-objeto.js assets/entrada/cap4-drop-1.png assets/objetos/drop-cap4-1.webp 104 22
node test/inline-objetos.js           # MOBS/DROPS/RETRATOS, na ordem de EPOCAS

# 4. contexto da caixa de fala — o arquivo tem de se chamar ctx-<chave>.png
node test/inline-contexto.js          # embute TODOS os ctx-*.png da pasta

# 5. a hora do dia na pintura nova, e o print de tudo
node test/prints-onda2.js C4          # topo/céu por pintura, tarde e noite
node test/calibrar-ceu.js 4 0,0.1,0.2,0.3 0.24     # varre a dose até topo/céu ≤ 1,1
node test/prints-cap4.js              # o capítulo JOGANDO, não a pintura forçada
```

Três armadilhas que este capítulo pagou:

- **`inline-contexto.js` reescreve o bloco INTEIRO com o que achar na pasta.** Numa pasta com
  só as imagens novas, ele apaga em silêncio as dos outros capítulos. Tenha todas ali.
- **O número no nome do arquivo não é o número do capítulo.** `cap4-*` é o quarto PEDIDO da
  mesa; SALVADOR é o TERCEIRO capítulo (1835 vem antes de hoje). Todas as listas por capítulo
  — `CAPS`, `MOBS`, `DROPS`, `RETRATOS`, `HERO_CAP_B64`, `PASSO_CAP`, `CEU_PINT`, `FRENTE_CAP`
  — estão na ordem de `EPOCAS`, e reordenar uma sem as outras troca a arte de dono.
- **Capítulo que entra no MEIO da cronologia desloca índice guardado no save.** Ver
  `migrarArco()`: sem ele, quem parou no último capítulo acorda no capítulo novo.

### Ferramentas que este LEIAME citava e a pasta não tinha

A integração do worktree de SALVADOR trouxe o capítulo e deixou quatro ferramentas para trás:
o texto acima as citava e o arquivo não existia. **`montar-quadros.js` e `prints-cap4.js`
voltaram commitados em 2026-08-07**, reescritos a partir do que o LEIAME dizia deles.
`cortar-celulas.js` e `calibrar-ceu.js` **continuam faltando** — quem precisar dos dois vai ter
de reescrevê-los; não perca tempo procurando. A lição: ferramenta citada no LEIAME e ausente da
pasta é pior que ferramenta não documentada, porque manda a próxima sessão procurar.

`prints-cap4.js` tem duas armadilhas pagas, e as duas moram no comentário dele: encher
`energiaTotal` ANTES de escolher o capítulo faz `verificarCenario()` empurrar a pessoa até a
última cena em poucos quadros (o print sai do capítulo errado, sem aviso), e a tela de abertura
sobe UM quadro depois de o cenário mudar, o que para o mundo pelo portão de `historiaAberta()`
e congela o `worldX` para sempre.

## `inline-cenarios.js`, `inline-sheets.js`

Embutem os 7 cenários e as folhas do mundo (monstros, NPCs, itens, decoração) a partir de
`assets/`. Rodados uma vez cada; ficam aqui porque são a única descrição de como aquela
arte entrou no arquivo.
