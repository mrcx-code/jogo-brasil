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

A arte da personagem chega de fora como uma folha horizontal em fundo **magenta
`#FF00FF`**. As folhas-fonte estão versionadas em `assets/hero/`. Reproduzir:

```bash
# 1. recortar (o último argumento é a compressão vertical, ver abaixo)
node test/recortar-folha.js assets/hero/folha_andar_12.webp  12 /tmp/andar.json 1
node test/recortar-folha.js assets/hero/folha_correr_12.webp 12 /tmp/correr.json 0.35
node test/recortar-folha.js assets/hero/folha_pular_6.webp    6 /tmp/pular.json  0

# 2. conferir se as folhas foram desenhadas na mesma escala (mede LARGURA DA CABEÇA,
#    que é a única medida que não muda com a pose) e reescalar as que destoarem
node test/medir-escala.js /tmp/andar.json /tmp/correr.json
node test/reescalar.js /tmp/correr.json 0.9252 /tmp/correr2.json
node test/reescalar.js /tmp/pular.json   0.6445 /tmp/pular2.json

# 3. embutir no index.html (ordem: walk, run, sp)
node test/embutir-heroi.js /tmp/andar.json /tmp/correr2.json /tmp/pular2.json
```

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
| `1` | preserva a subida e descida da folha | caminhada — o balanço é autoral |
| `0.35` | achata para 35% | corrida — a folha sobe 57 px, o que numa personagem de 44 px lê como pulinho |
| `0` | achata tudo | pulo — o **código** já desenha o arco; manter os dois dobra o salto |

## `inline-cenarios.js`, `inline-sheets.js`

Embutem os 7 cenários e as folhas do mundo (monstros, NPCs, itens, decoração) a partir de
`assets/`. Rodados uma vez cada; ficam aqui porque são a única descrição de como aquela
arte entrou no arquivo.
