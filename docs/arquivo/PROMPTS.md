# PROMPTS.md — o que pedir ao modelo de imagem, e como conferir o que voltar

Documento de trabalho para gerar a arte dos três capítulos fora daqui, no Hugging Face, com
o LoRA [`nerijs/pixel-art-xl`](https://huggingface.co/nerijs/pixel-art-xl) sobre SDXL.

Nada neste repositório gera imagem, e não deve passar a gerar: a regra de **zero rede** do
`CLAUDE.md` §3.2 vale para o jogo e para as ferramentas. A geração acontece na sua mão, fora
daqui; o que volta é um arquivo, e o arquivo passa pelo `test/validar-folha.js` antes de
qualquer outra coisa.

Os prompts estão em inglês porque o SDXL responde a inglês. O texto ao redor está em português.

---

## 1. AVISO — o erro que o modelo vai cometer, e que só você pode pegar

> **Para o capítulo 1 e para o capítulo 3, o modelo vai devolver iconografia indígena
> norte-americana. Não às vezes: por padrão.**
>
> Cocar de penas em leque das Planícies, machadinha, tipi, faixa na testa com uma pena,
> franja de couro, "pintura de guerra" em listras, apanhador de sonhos. Nada disso tem
> relação com os povos do litoral atlântico do século XVI, nem com povo indígena nenhum do
> Brasil de hoje. É o que a internet chamou de "índio" por cem anos, e é dela que o modelo
> aprendeu.
>
> A lista de negativos da seção 4 empurra contra isso. **Ela não resolve.** Negativo reduz
> frequência, não elimina; e o modelo mistura — devolve um cocar pequeno, uma penugem na
> testa, um colar que parece de outro continente, e o resultado passa por plausível para
> quem não estiver procurando.
>
> **Olhe cada saída com este erro na cabeça, um quadro de cada vez.** Se aparecer, descarte
> a folha inteira em vez de corrigir um quadro: a folha é um render só, e o que contaminou
> um quadro contaminou a cabeça do modelo para os doze.

O erro equivalente no **capítulo 2** tem outro nome: pedir "quilombo" ou "Palmares" a um
modelo de difusão puxa "aldeia africana genérica" — cabana de palha redonda de fotografia de
safári, savana, acácia. Palmares ficava na mata da Serra da Barriga, em Alagoas, e a
documentação sobre a forma construída do lugar vem quase toda de quem foi atacá-la. Ver §6.

---

## 2. As restrições técnicas, todas medidas

### 2.1 Folha de personagem: GRADE 1024×1024, nunca tira

SDXL degrada acima de **~1:2,5** de proporção — passa a duplicar corpos e a repetir membros.
Uma folha de 12 poses lado a lado seria 12,6:1. Então a folha sai em **grade de 4 colunas ×
3 linhas em 1024×1024**, lida da esquerda para a direita e de cima para baixo. Célula de
~256×341, maior que o quadro final de 191×182 — sobra resolução, e **reduzir preserva
detalhe enquanto ampliar inventa**.

O `test/recortar-folha.js` já lê grade: `node test/recortar-folha.js folha.png 4x3 saida.json 1`.

**Regra que a arte atual quebrou e custou um quadro:** as figuras **não podem se encostar**.
Medido agora, com o validador, na folha de corrida que está no jogo: 12 células, **11 figuras**.
O recortador não reclama — ele semeia uma figura por célula, e duas células caíram na mesma
figura. Resultado conferido por hash: dos 12 quadros que ele emite, **os quadros 6 e 7 são
idênticos byte a byte**. Um quadro morto no ciclo de corrida, em produção, sem ninguém saber.
Peça vão de magenta entre as figuras e confira a contagem de manchas antes de cortar.

| | valor |
|---|---|
| resolução do render | **1024×1024** (bucket nativo do SDXL) |
| grade | **4 colunas × 3 linhas** = 12 poses |
| célula | ~256 × 341 |
| figura dentro da célula | ~220–280 px de altura, **com folga de magenta em volta** |
| fundo | `#FF00FF` chapado, sem sombra no chão, sem piso, sem moldura |
| formato do arquivo | **PNG** (ver 2.3) |

**A restrição é sobre a proporção da IMAGEM, não sobre quantas poses cabem nela.** Salto são
6 poses e cabem de duas formas: `3x2` em 1024×1024 (células ~341×512, boas para uma pose
esticada) ou `6x1` num bucket largo como 1536×640 (células 256×640). A segunda funciona — a
folha de salto que está no jogo é exatamente isso, 6 figuras num quadro 2:1.

A folha de caminhada de hoje é 3:1 com 12 poses, acima do limite, e passou. A de corrida é
3:1 também **e é a que voltou com 11 figuras em vez de 12**. Uma amostra de duas não prova
regra, mas a direção do risco está clara: quanto mais esticado o quadro e mais poses nele,
maior a chance de o modelo perder uma. A grade 4×3 existe para tirar as duas pressões ao
mesmo tempo.

### 2.2 Cenário: 720×1279 retrato, chão a 75%, em DUAS PEÇAS

A pintura final é **720 × 1279**, retrato, com a linha do chão a **75% da altura** — o pixel
959. É onde os pés da personagem pousam.

Ela sai em duas peças porque o motor rola as duas em velocidades diferentes:

| peça | tamanho final | o que contém | rolagem |
|---|---|---|---|
| **A — de cima** | 720 × **959** | céu, distância, o que estiver além | mais devagar (`paralaxeLonge`) |
| **B — de baixo** | 720 × **320** | o chão que a personagem pisa | **1:1 com o mundo** |

**A consequência de projeto que ninguém percebe até ver rodando:** na peça A, **nada pode
parecer apoiado na linha do chão**. Tudo que está na peça A anda mais devagar que o chão da
peça B; então uma casa, um tronco ou um poste desenhado *pisando* na linha do chão desliza
sobre o próprio pé enquanto o jogo rola. A borda de baixo da peça A tem que ser **distância**
— linha de mata, linha d'água, morro, neblina —, não objeto plantado no chão de perto.

Isto significa que as sete pinturas que estão hoje no jogo **não serviriam** partidas em
duas: a `cen1` tem casa e vaso de planta apoiados no calçamento. Elas foram feitas para
paralaxe zero, que é como o motor nasce configurado.

Resoluções de geração, escolhidas entre os buckets nativos do SDXL para que o corte final
saia por redução uniforme, nunca por esticão:

| peça | gere em | corte para | reduza para | fator |
|---|---|---|---|---|
| A | **896 × 1152** | 865 × 1152 (tira 31 px de largura) | 720 × 959 | 0,832 uniforme |
| B | **1536 × 640** | 1440 × 640 (tira 96 px de largura) | 720 × 320 | 0,500 uniforme |

**As duas peças são ladrilhadas com cópias espelhadas** — é o espelho que mata a emenda
lateral (`CLAUDE.md` §4). Duas consequências para a arte:

- **Sem texto, sem placa, sem letra.** Aparece invertido na cópia espelhada.
- **Sem marco único e dominante.** Um morro característico no meio da peça vira dois morros
  se encarando.
- **Luz alta e pareja.** Sol muito lateral inverte de lado a cada cópia e a virada aparece.
  A `cen1` tem sol do alto e à direita e sobrevive; sol rasante não sobreviveria.

### 2.3 Magenta: peça PNG, e não confie em "exato"

Medido na folha de caminhada que está no jogo: de 1.334.000 pixels, **23** são `#FF00FF`
exato. Onze por cento estão a distância ≤4, vinte e um por cento a ≤16. O arquivo é WEBP com
perdas, e a compressão comeu o magenta puro sem que isso quebrasse nada — o recortador não
testa igualdade, ele mede *o quanto* o pixel é magenta e usa isso como transparência.

Duas coisas decorrem disso:

1. **Salve em PNG.** Se o site devolver JPEG ou WEBP com perdas, o fundo vira uma nuvem em
   volta de `#FF00FF` e a franja engorda. Funciona, mas você perde margem à toa.
2. **Não julgue pelo número "exato".** O validador imprime a distribuição por tolerância
   justamente para separar *o modelo pintou o fundo errado* de *o arquivo foi salvo com
   perdas*. São problemas diferentes e a correção é diferente.

### 2.4 O ciclo, honestamente: o modelo não desenha ciclo de caminhada

SDXL devolve **doze variações de alguém andando**, não doze fases medidas de uma passada. O
motor escolhe o quadro pela **distância percorrida**, o que perdoa irregularidade de fase mas
não perdoa quadro repetido nem quadro fora de ordem. Conte com **reordenar os quadros à mão**
depois de cortar, e com descartar folha.

E o problema que o LoRA **não** resolve, porque é LoRA de estilo e não de identidade: **a
personagem muda no meio da folha.** Gerar as 12 poses num render só ajuda — o modelo mantém
roupa e cabelo por coerência interna da imagem — mas não garante. É exatamente isso que a
seção 4 do validador mede.

**Semente:** gere as três folhas de um mesmo capítulo (andar, correr, pular) com a **mesma
semente e o mesmo bloco de personagem**, mudando só a linha da ação. Valide a folha de
caminhada primeiro; se a personagem estiver certa, repita a semente nas outras duas.

### 2.5 O laço fechado

```bash
node test/validar-folha.js folha_nova.png 4x3 --ref=andar --comp=1
```

Ele mede e não opina: proporção, pureza e franja do fundo, número de manchas contra o número
de quadros esperado, **largura da cabeça quadro a quadro**, e o que o resto do pipeline vai
fazer com esta folha — o tamanho que o recortador emite e o fator que o `reescalar.js` precisa,
já na forma do comando a rodar.

Esse previsor foi conferido contra as três folhas que estão no jogo, e acerta a cadeia inteira:
quadros **191×182, 217×204 e 297×319** (os mesmos que o recortador imprime), fatores de
reescala **0,9241 e 0,6446** (contra os 0,9252 e 0,6445 registrados no `test/LEIAME.md`) e
alturas finais **182, 189 e 206**, todas com zero de erro. Ele também mostra o que ninguém
tinha escrito: a folha de corrida é **recortada em 5 px de cada lado** ao entrar no canvas fixo
de 191.

O que olhar primeiro, na ordem:

| seção | número | o que ele diz |
|---|---|---|
| 3 | manchas encontradas ≠ esperado | figuras encostadas (a menos) ou lixo solto (a mais) |
| 4 | **CV da cabeça** | acima de ~3% o modelo trocou a personagem no meio da folha |
| 4 | **altura/cabeça** | mudou a proporção do corpo, não só o zoom |
| 2 | espessura da franja | acima de ~1,5 px a folha foi borrada ou ampliada |
| 5 | fator de reescala **> 1** | a folha veio pequena demais. Regere maior; não estique |
| 5 | "CORTA N px" na largura | a essa escala a figura não cabe nos 191 px e perde os lados |

Referência medida nas folhas boas de hoje: **CV da cabeça 1,4% (andar) e 2,0% (correr)**,
franja 1,14 e 0,96 px, pixel lógico 1 px.

---

## 3. Direção de arte — a linguagem visual que já existe

Decisão do dono: **a referência é a personagem e os cenários que já estão no jogo**, adaptados
a cada época. Não é 8-bit, não é retrô de NES. É pixel art **pintada em alta resolução**.

Medido em `assets/scenarios/` e `assets/hero/`, para poder ser descrito sem adjetivo solto:

**Cenários** — ~1.000 cores distintas mesmo quantizando a 12 bits, ou seja, pintura com
muitos tons, não paleta indexada. Saturação média **0,57–0,68**, brilho médio **0,32–0,56**.
Céu em `#1188ee`–`#2288ee`; terra e pedra em `#886633`/`#775522`; folhagem profunda em
`#112200`/`#223300`. Sol do alto e à direita, sombras curtas e quentes. Textura por pixel:
cada pedra do calçamento tem quatro a seis tons e um chuvisco de grão. Profundidade por
perspectiva atmosférica — o morro distante perde saturação e vai para o azul-acinzentado. **O
cenário não tem contorno**: as formas se separam por valor e temperatura.

O chão da `cen1` quebra em **76,3%** da altura, medido — o contrato é 75%, e na prática tem
cerca de um por cento de folga. O plano do chão é desenhado em leve fuga (as pedras crescem
para baixo), não de lado, e é isso que faz a personagem desenhada de perfil parecer pousada
nele.

**Personagem** — saturação **0,72** e brilho **0,45**: ela é *mais saturada e mais escura* que
o fundo em que anda, e é assim que se destaca sem precisar de brilho. Tem **contorno**, que o
cenário não tem, em marrom muito escuro (`#221100`, `#110000`) e **nunca preto puro**. Roupa
em creme quente `#ffeeaa`/`#ffdd99` com debrum vermelho-terra; pele em terracota
`#aa5533`/`#bb6633`; verde-oliva escuro `#333300` na peça de baixo. Três a cinco tons por
material, transição por dithering curto, borda dura, sem anti-aliasing contra o fundo. Altura
total ≈ **2,0 × a largura da cabeça** (medido nas 12 poses; CV de 2,5%) — proporção infantil,
cabeça e cabelo grandes em relação ao corpo. Pixel lógico de 1 px: a arte é nativa na
resolução em que foi salva, não ampliada.

### Bloco de estilo, para colar em todo prompt

```
pixel art, hand-painted high-resolution pixel art, 16-bit era painted sprite style,
crisp hard pixel edges, no anti-aliasing, rich saturated palette, four to five tones
per material, short dithering in the transitions, warm directional sunlight from the
upper right, soft warm shadows
```

### Bloco de estilo só da personagem

```
full body, side view facing right, dark warm brown outline (not black), child
proportions with a large head, more saturated and slightly darker than a background
would be, readable silhouette
```

---

## 4. Negativos

**Compartilhado, em toda geração:**

```
3d render, cgi, photograph, photorealistic, realistic, oil painting, watercolor,
blurry, soft edges, anti-aliasing, glow, bloom, lens flare, depth of field,
text, letters, watermark, signature, logo, ui, hud, speech bubble,
frame, border, panel lines, grid lines, collage seams
```

`frame, border, panel lines, grid lines` não é preciosismo: uma linha de grade desenhada
**conecta as doze figuras numa mancha só** e o recortador aborta ou entrega lixo.

**Só na folha de personagem, acrescente:**

```
ground, floor, ground shadow, cast shadow, drop shadow, scenery, background objects,
white background, gradient background, multiple characters interacting, cropped limbs
```

Sombra no chão é tinta encostada na personagem: o recortador inunda a mancha e a sombra vem
junto, colada no pé.

**Nos capítulos 1 e 3 — a lista que existe por causa da §1:**

```
war bonnet, feathered war headdress, Plains Indian, Native American, North American
indigenous, teepee, tipi, tomahawk, dreamcatcher, war paint stripes, buckskin fringe,
moccasins, totem pole, single feather headband, cowboy, western, wild west,
Aztec, Mayan, Inca, Polynesian, generic tribal
```

`Native American` como negativo parece estranho num jogo sobre povos indígenas. Está aí por
um motivo mecânico: é a região do espaço latente do modelo onde mora a iconografia das
Planícies. O positivo nomeia o povo específico; o negativo empurra para longe do aglomerado
errado. **Continua não bastando.** Releia a §1.

**No capítulo 2, acrescente:**

```
savanna, acacia tree, safari, desert, sub-Saharan village stock photo, round thatched
hut, mud hut, tribal mask, chains, shackles, whip, plantation, slave imagery
```

---

## 5. Os prompts

Estrutura de cada um: `[bloco de estilo] + [bloco da personagem ou do cenário] + [bloco do
capítulo] + [bloco da grade]`. Os trechos entre `«...»` são **lacunas que eu não preenchi de
propósito** — são decisões de representação, e estão listadas uma a uma na §6. Preencha
depois de decidir; não gere com a lacuna dentro.

Sintaxe de peso — `(termo:1.2)` — funciona em Automatic1111 e ComfyUI e **não** funciona na
maioria dos Spaces do Hugging Face, que usam `diffusers` puro. Os prompts abaixo estão sem
peso, para funcionar nos dois. Se a sua interface aceitar peso, o candidato natural a subir é
o nome do povo.

### Bloco da grade (folha de personagem, colar no fim)

```
sprite sheet, a grid of 12 separate poses, 4 columns and 3 rows, each pose fully
inside its own cell with clear empty space around it, poses never touching each other,
identical character in every cell, same clothes same hair same colors in every cell,
flat solid magenta #FF00FF background, magenta background everywhere between the poses
```

Para salto, troque por `a grid of 6 separate poses, 3 columns and 2 rows`.

### Bloco da ação

| folha | linha a acrescentar |
|---|---|
| andar (12) | `twelve phases of one walking cycle, walking to the right, weight shifting from one foot to the other` |
| correr (12) | `twelve phases of one running cycle, running to the right, one phase with both feet off the ground` |
| pular (6) | `six phases of one jump, crouch, push off, rising, top of the arc, falling, landing` |

---

### Capítulo 1 — Tupinambá, litoral atlântico, século XVI

**Personagem:**

```
a Tupinambá child of the Atlantic coast of Brazil in the sixteenth century,
«idade e corpo», brown skin, «cabelo», «o que ela veste», «adornos»,
carrying «o objeto», calm and unhurried, at work, not fighting, not posing
```

**Cenário, peça A (896×1152):**

```
the Atlantic coast of Brazil seen from the shore, sixteenth century, tall Atlantic
forest meeting the sea, dense layered canopy, palms and broadleaf trees, distant
forested headlands fading into blue haze, calm ocean, bright sky with high cumulus
clouds, no buildings in the foreground, the bottom of the image is distant treeline
and waterline only, nothing standing on the near ground, no people
```

**Cenário, peça B (1536×640):**

```
the ground of a coastal clearing in the Atlantic forest, seen from just above,
packed pale sand and dark earth mixed, fallen leaves, short grass in tufts, small
roots and pebbles, dappled sunlight through canopy above, no people, no objects,
no buildings, seamless texture of ground receding slightly toward the top
```

### Capítulo 2 — Palmares, século XVII, do lado de quem resistia

**Personagem:**

```
a young person of Palmares in seventeenth century Brazil, «idade e corpo»,
dark brown skin, «cabelo», «o que veste», carrying «o objeto»,
standing tall, unhurried, at work in their own place, free, «marcas do corpo»
```

**Cenário, peça A (896×1152):**

```
the Serra da Barriga in Alagoas, Brazil, seventeenth century, forested hillside of
Atlantic forest in the transition to drier agreste, tall trees and palm, a ridge line
rising against the sky, warm afternoon light, distant slopes fading into haze,
«a forma construída», the bottom of the image is distant treeline only, nothing
standing on the near ground, no people
```

**Cenário, peça B (1536×640):**

```
the ground of a hilltop clearing in Brazil, seventeenth century, red-brown packed
earth, worn footpath, tufts of grass, «o que é cultivado ali», scattered stones,
strong warm sunlight, no people, no objects, no buildings, seamless texture of ground
receding slightly toward the top
```

### Capítulo 3 — presente, terra indígena demarcada

**Personagem:**

```
an Indigenous child in Brazil today, «de qual povo», «idade e corpo», brown skin,
«cabelo», «o que ela veste hoje», carrying «o objeto», at work, calm, contemporary,
present day, alive now, not historical, not a costume
```

**Cenário, peça A (896×1152):**

```
a demarcated Indigenous territory in Brazil, present day, «qual bioma», standing
forest, tall trees, «o que aparece da vida de hoje», bright sky, distant hills fading
into haze, the bottom of the image is distant treeline only, nothing standing on the
near ground, no people
```

**Cenário, peça B (1536×640):**

```
the ground of a village clearing in a demarcated Indigenous territory in Brazil,
present day, swept red earth, footpath, tufts of grass, «o que é cultivado ali»,
warm sunlight, no people, no objects, no buildings, seamless texture of ground
receding slightly toward the top
```

---

## 6. Dúvidas de representação — o que eu **não** decidi

O `CLAUDE.md` §2 diz que decidir sozinho sobre representação é a única coisa proibida neste
repositório. Cada item abaixo é uma lacuna `«...»` da §5 ou uma escolha embutida que eu me
recusei a fazer. Nenhuma delas é dúvida de gosto; todas mudam o que o jogo afirma.

**A dúvida que vem antes de todas as outras.** O modelo aprendeu com o acervo de imagens que
a internet tem de povos indígenas e de pessoas negras no Brasil — que é exatamente o acervo
cujo viés o §2 existe para resistir. Ele é confiável para luz, vegetação, terra, pedra,
madeira e clima. Ele é **menos** confiável justamente onde o jogo mais precisa de cuidado: no
corpo da pessoa. Vale considerar usar o modelo para o mundo e resolver a personagem por outro
caminho — mão humana, ou artista das comunidades retratadas. Não é decisão minha.

Some-se a isso o que o `NOTES.md` já registrou como **lacuna de método**: nenhuma fonte
levantada até aqui é de autoria indígena ou quilombola direta. A arte trava nessa mesma
lacuna.

### Capítulo 1 — Tupinambá

1. **Corpo e roupa.** As crônicas do século XVI (Léry, Staden, Thevet) descrevem os Tupinambá
   com pouca ou nenhuma roupa. As duas saídas custam caro em direções opostas: vestir é
   impor pudor colonial e apagar o registro; seguir a crônica é reproduzir o olhar de quem a
   escreveu — e, com protagonista criança, é inaceitável num jogo, ponto. Há caminhos
   intermediários (enquadramento, o que a personagem carrega, silhueta) que precisam ser
   escolhidos por você, não por mim. **Esta é a lacuna `«o que ela veste»` e `«idade e
   corpo»`, e é a mais séria do documento.**
2. **Pintura corporal.** Urucum e jenipapo estão documentados. Mas *padrão* de pintura é
   grafismo, e grafismo pertence a um povo — pedir "body paint" ao modelo é pedir que ele
   invente um. Inventar grafismo indígena é inventar patrimônio de gente viva. Deixar sem
   pintura também é uma afirmação. Não escolhi. (`«adornos»`)
3. **Cabelo.** A tonsura tupinambá aparece nas crônicas, associada a homens. Não sei o que a
   documentação diz sobre criança, e sobre menina, e não vou preencher por analogia.
   (`«cabelo»`)
4. **Tembetá e adorno de lábio.** Documentados, e marcadores de status, gênero e idade
   específicos — não enfeite genérico. Colocar num personagem sem saber o que aquilo marcava
   é dizer uma coisa sem saber que se está dizendo. (`«adornos»`)
5. **O manto tupinambá.** O `NOTES.md` o aponta como o objeto que atravessa os três
   capítulos. Mas é peça cerimonial, repatriada em 2024 e hoje no Museu Nacional. **Vestir**
   o manto numa personagem jogável é diferente de **mostrá-lo**. Não sei se é apropriado
   vesti-lo, e essa é a pergunta a fazer a quem tem autoridade para responder — o povo
   Tupinambá de Olivença, não eu.
6. **Que Tupinambá.** Se o capítulo 3 for a terra do povo **Tupinambá de Olivença** — que
   existe, no sul da Bahia, com demarcação em curso —, então o capítulo 1 provavelmente é
   aquele mesmo litoral, e o jogo passa a falar de uma comunidade real e identificável. Isso
   é bom para o argumento do §2.1 e é justamente por isso que não pode ser decidido sem
   consultá-los. Se for um litoral genérico, o capítulo 3 perde a ligação.
7. **O objeto na mão.** O verbo do capítulo 1 é colher, pescar, plantar. Arco lê como
   guerreiro e puxa o modelo para o clichê; cesto de carregar é mais próximo do verbo. Mas
   trançado tem padrão, e padrão é grafismo — cai no item 2. (`«o objeto»`)

### Capítulo 2 — Palmares

8. **Marcas no corpo.** Cicatriz, marca de ferro, ferro no tornozelo. Mostrar é dizer o que
   foi feito; não mostrar é deixar de dizer. O `CLAUDE.md` §2.2 garante que pessoa
   escravizada não vira recurso nem obstáculo, e isso está resolvido pela mecânica — mas o
   que o corpo da protagonista mostra é outra decisão, e é sua. (`«marcas do corpo»`)
9. **Origem e cultura material.** Palmares reunia gente de origens diferentes. Vestir a
   personagem com material de um povo específico da África central ou ocidental sem fonte é
   inventar; vestir com "roupa de pano cru" genérica é apagar. (`«o que veste»`, `«cabelo»`)
10. **A forma construída do lugar.** O que se sabe do desenho dos mocambos vem quase todo da
    documentação de quem os atacou — o manuscrito de 1678 e correlatos. Desenhar Palmares a
    partir daí é desenhar o lugar pelos olhos do cerco. A alternativa, não desenhar nada
    construído, também afirma algo (que não havia cidade, e havia). (`«a forma construída»`)
11. **O objeto na mão, de novo.** O verbo do capítulo 2 é acolher. Enxada é documentada — os
    mocambos plantavam — mas enxada na mão de pessoa negra no século XVII carrega leitura de
    trabalho forçado que o capítulo existe para negar. (`«o objeto»`, `«o que é cultivado
    ali»`)

### Capítulo 3 — presente

12. **Qual registro.** O modelo vai devolver ou uma pessoa do século XVI de tanga, ou uma
    pessoa genérica. A vida hoje numa terra demarcada tem celular, camiseta, escola, moto,
    roça, e também tem pintura e adorno em momento próprio. **Mostrar só o tradicional
    congela no passado; mostrar só o contemporâneo apaga o que é mantido de propósito.** A
    escolha do registro é o capítulo inteiro, porque é ele que cumpre o "e continuam aqui".
    (`«o que ela veste hoje»`, `«o que aparece da vida de hoje»`)
13. **De qual povo.** O Censo 2022 conta 391 etnias e 295 línguas. "Indígena genérico" é
    exatamente o que o §2.1 proíbe. Nomear um povo é o certo — e nomear um povo real numa
    obra sobre ele é coisa a fazer com ele. (`«de qual povo»`, `«qual bioma»`)
14. **A disputa em curso.** O `NOTES.md` guarda que o capítulo 3 não termina em "deu certo".
    A cena pode mostrar sinais disso — cerca, gado na borda, corte raso do outro lado, marco
    de demarcação — ou pode mostrar só a terra em pé. Mostrar a disputa é honesto; virar
    cenário de fundo para a luta de gente viva é outra coisa. Onde fica a linha, não sei.
15. **Se a terra é identificável.** Se for a TI Tupinambá de Olivença, é o território de uma
    comunidade específica, em processo administrativo agora. Retratá-lo pede a palavra deles.
    Eu não tenho como obtê-la; você tem como decidir buscá-la.

---

## 7. Conferência de cada saída, na ordem

1. **§1, sempre.** Cocar, machadinha, faixa com pena, franja de couro, cabana de safári.
   Achou: descarta a folha inteira, não o quadro.
2. `node test/validar-folha.js folha.png 4x3 --ref=andar` — manchas, CV da cabeça, franja,
   escala.
3. Abra a folha e **olhe as doze figuras lado a lado**. É a mesma pessoa? Mesma roupa, mesmo
   cabelo, mesma cor de pele, mesmo objeto na mão? O número da seção 4 pega troca de escala e
   de proporção; ele não pega o modelo trocando a cor da roupa.
4. Corte, e **confira duplicata** antes de embutir — foi assim que o quadro morto da corrida
   passou.
5. Cenário: cubra mentalmente a peça A com uma cópia espelhada dela mesma. Algum objeto
   parece pisando na linha do chão? Alguma letra? Algum marco único que vira dois?
