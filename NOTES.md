# NOTES — o jogo como ele é

Duas partes. Esta primeira descreve o **estado atual**; a partir de "## Diário" vem o
histórico, uma entrada por sessão. Se as duas discordarem, esta é a verdade.

## Onde este projeto está

Produção: <https://jogo-brasil-mrcx.vercel.app>

**No começo.** O que existe hoje é o motor herdado, funcionando, com a arte e a temática do
projeto anterior ainda dentro dele. Nada de história do Brasil foi feito. A primeira coisa
a decidir com o dono é *como* a passagem do tempo aparece — se é cenário que troca, se é
capítulo, se é outra coisa — porque essa decisão define quase todo o resto.

## O motor herdado

### Entrada

| onde | o que faz |
|---|---|
| metade esquerda da tela | pula (e acerta um golpe na subida) |
| metade direita da tela | golpeia |
| botão dourado | golpeia; segurar repete |
| card do ritmo | alterna andar / correr |
| card UPGRADES | abre o painel; enquanto aberto, vira um ✕ vermelho |

Nada é desenhado para marcar a divisão da tela.

### Combate

Alcance de 80 px. Combo de cinco batidas: quatro conjurações alternando entre duas poses, e
na quinta ela salta — alcance 96 e dano dobrado.

| inimigo | vida |
|---|---:|
| smog | 5 |
| cash | 8 |
| barrel | 13 |

Eles **passam reto**. Chegam em intervalos sorteados entre 0,45× e 1,4× de
`CFG.mobIntervalo`. Ao morrer largam um drop, recolhido ao passar por cima.

### Economia

| upgrade | custo | efeito |
|---|---:|---|
| `u1` | 150 | cada golpe conta 3× |
| `u2` | 900 | o que você pega vale o dobro |
| `u3` | 4.000 | ajudam sozinhos, 2 golpes/s |
| `u4` | grátis | **interruptor de teste**: ×100 no toque |

Mais `bonusDias()`, que cresce com dias distintos jogados. Sete cenários, cada um a
**3.000 de impacto acumulado**, plano: `LIMIARES = [3000, 6000, 9000, 12000, 15000, 18000]`.
Medido no projeto anterior: ~25 minutos golpeando para ver os sete, ou ~15 segundos com o
`u4` ligado.

O `u4` vai para produção junto — num arquivo único sem build não existe "só em dev". Está
vestido de vermelho e escrito TEST para não ser confundido com upgrade.

### Movimento — o que faz o pé não deslizar

O quadro do sprite é escolhido pela **distância percorrida**, não pelo tempo.

| | passada | velocidade | ciclos/s | fps da animação |
|---|---:|---:|---:|---:|
| andar | 40,9 px | 40,9 px/s | 1,00 | 12 |
| correr | 73,6 px | 92,0 px/s | 1,25 | 15 |

As velocidades são `PASSO × 60 / n` com `n` inteiro, para que um quadro de sprite dure um
número inteiro de quadros de tela. Com 88 px/s cada quadro durava 2,3 quadros de tela e a
cadência saía 2-2-3-2-2-3, lendo como trepidação.

A passada da caminhada foi **medida** na arte: na pose de maior abertura as duas solas ficam
a 85,5 px de sprite, centro a centro; na escala 44/184 isso dá 20,45 px de passo e 40,9 de
passada. A da corrida é **derivada**, não medida — as duas medições automáticas falham numa
corrida, porque na fase de voo não há segundo pé no chão. É a da caminhada × 1,8.

### Camadas

`#fundoHD` (pintura, resolução do dispositivo) → `#scene` (mundo, baixa resolução,
pixelado) → `#heroHD` (personagem, resolução do dispositivo).

A personagem tem canvas próprio porque dentro do `#scene` a arte de 184 px era esmagada para
44 e depois ampliada de volta: seis vezes o tamanho guardado. Agora é escalada uma vez só,
1,43×.

### Segurança

- **CSP no `<head>`**: `default-src 'none'`, imagens só `data:`, `connect-src 'none'`.
- **O save é entrada não confiável.** `ESQUEMA_SAVE` lista os campos permitidos com tipo e
  faixa; o que não está lá não entra, tipo errado cai no padrão, e a gravação emite só esses
  campos. O smoke test alimenta um save adulterado e verifica que nada vaza.
- Nenhum `eval`, `new Function`, `fetch`, `XMLHttpRequest`, `document.write` ou `innerHTML`.

## O que foi decidido com o dono

Decidido em 2026-08-04. As cinco perguntas que abriam esta seção estão respondidas.

1. **O tempo passa em ordem cronológica, em três capítulos.** Começa no passado e termina
   hoje. Três, e não sete: um cenário codado custava entre 485 e 978 linhas mais ~210 KB de
   pintura, então sete capítulos bem feitos seriam o arquivo inteiro de novo.
2. **O capítulo final é o presente**, com a mesma gente na terra dela. É ele que cumpre o
   "e continuam aqui" do CLAUDE.md §2.1 — e é a razão de a ordem cronológica não cair na
   armadilha de "os originários são a fase que a história superou".
   **Guarda:** o capítulo 3 não termina em "deu certo". Demarcação hoje é disputa em curso.
3. **Uma protagonista por capítulo, sem nome próprio.** Sem nome porque os nomes
   documentados dos dois períodos são quase todos de lideranças, e quase todos homens — o
   arquivo registrou quem o colonizador combateu ou negociou. Dar um desses a uma pessoa
   comum transformaria uma pessoa real em avatar do jogador. Os nomes documentados entram
   nas **pontes** entre capítulos, com fonte.
4. **O verbo é `alcançar`, não golpear.** Mesma entrada, mesmo alcance de 80 px. O que passa
   na tela não é algo a destruir: é algo que precisa de você e vai embora se você não
   alcançar. Aproveita de graça o "os inimigos passam reto" que o motor já tinha. A pergunta
   do jogo deixa de ser "matei tudo?" e vira "o que eu deixei passar?".
   - **cap. 1, Tupinambá, séc. XVI** — alcançar é o trabalho do dia: colher, pescar, plantar.
     O que chega depois e *não* pode ser alcançado é a invasão: ela não para para você.
   - **cap. 2, Palmares, séc. XVII** — alcançar é acolher quem chega. **Trava do §2.2:** não
     pode ser "pegar pessoa" como se pega um drop. Quem você alcança passa a **andar com
     você**, visível na tela, em vez de virar número no HUD.
   - **cap. 3, hoje** — mesmo verbo do capítulo 1. A repetição *é* o argumento: mesmo
     trabalho, cinco séculos depois. Zero código novo.
5. **Moeda por capítulo, sem total global.** Um número que só sobe atravessando os períodos
   diria "os períodos são etapas de um mesmo acúmulo" — a escada voltando pela porta dos
   fundos. Nome de jogo, nunca de fato histórico.
6. **Interface sempre em português**, linguagem acessível e inclusiva.
7. **Estética mantida:** pixel art pintada em alta resolução, não 8-bit. 1 px de mundo = 2 de
   tela, personagem 44 px de mundo, folha de sprite em magenta `#FF00FF`.
8. **Nome adiado** até o capítulo 1 rodar. Renomear depois custa ~15 min (10 ocorrências,
   mais repo e projeto na Vercel). O custo não cresce; nomear cedo é nomear a coisa errada.

### Pendências desta decisão

- Referência visual do capítulo 1 **precisa ser aprovada pelo dono antes** de qualquer prompt
  de imagem. Modelos de imagem devolvem cocar das Planícies norte-americanas para um povo do
  litoral atlântico do séc. XVI — o erro do §2.1 gerado automaticamente, com confiança.
- Formato das pontes: caixa de texto estilo jogo antigo (referência do dono: Pokémon).

## Medidas reais da arte, para gerar a nova

| ativo | dimensão | quantidade |
|---|---|---:|
| pintura de cenário | 720 × 1279 (retrato), chão a **75%** da altura | 1 por capítulo |
| quadro de caminhada | 191 × 182 | 12 |
| quadro de corrida | 191 × 189 | 12 |
| quadro de salto | 191 × 206 | 6 |
| quadros de ação | ~170 × 148 | 4 + 4 |
| altura no jogo | 44 px de mundo (escala 0,242 sobre a arte) | — |

Folha de caminhada montada: **2292 × 182**, magenta `#FF00FF` puro.

**Modelo escolhido pelo dono:** [`nerijs/pixel-art-xl`](https://huggingface.co/nerijs/pixel-art-xl),
LoRA de estilo para SDXL. Duas coisas medidas sobre ele:

- **Não resolve a consistência de personagem.** É LoRA de estilo — muda a aparência, não a
  identidade entre quadros. Gerar a folha inteira num render só *ajuda* (o modelo mantém
  roupa e cabelo por coerência interna da imagem), mas não garante.
- **SDXL não renderiza 2292 × 182.** É treinado perto de 1024×1024 e degrada acima de ~1:2,5
  de proporção; a 12,6:1 duplica corpos. Então a folha sai em **grade, não em tira**:
  1024×1024 com 4×3 dá células de ~256×341, maiores que os 191×182 finais — sobra resolução,
  e reduzir é sempre melhor que ampliar. O `test/recortar-folha.js` corta tira hoje; ensinar
  a cortar grade é mudança pequena.

## O que o motor ainda não tem

1. **Som.** Nenhum. Maior retorno por esforço da lista, e dá para sintetizar com WebAudio
   sem quebrar as regras de arquivo único e zero rede.
2. **Variedade de inimigo.** Três tipos que só diferem em vida e cor; todos andam para a
   esquerda.
3. **O que vem depois do sétimo cenário.** Hoje: nada.

## Diário

Uma entrada por sessão, mais recente no fim. Formato: data · o que fiz · o que **medi**
(número, não impressão) · o que quebrou · próximo passo. Este é o ponto de retomada: toda
sessão começa lendo a última entrada.

### 2026-08-04 · repositório criado a partir do motor

Cópia do projeto anterior, com história git nova e nenhuma referência cruzada: sem remote
compartilhado, sem menção ao repo de origem, `package.json` e títulos renomeados.

O que veio: `index.html` (2,8 MB, a maior parte arte em base64), o smoke test, o pipeline de
sprites em `test/` com o `LEIAME.md`, e `assets/` com as folhas-fonte e os masters dos
cenários. O que não veio: o Diário do outro projeto — o histórico dele é dele.

Nada de história do Brasil foi feito ainda. A seção "O que precisa ser decidido" acima é o
começo real do trabalho.

**Próximo passo:** decidir com o dono como a passagem do tempo aparece no jogo. É a decisão
que trava todas as outras.

### 2026-08-04 · deploy próprio, independente do projeto de origem

Projeto criado na Vercel a partir do `mrcx-code/jogo-brasil`, preset Other, raiz `./`,
sem build. Push na `main` publica sozinho.

Nasceu com **Vercel Authentication** ligada — as URLs pediam login e devolviam a página de
login da Vercel em vez do jogo. Desliguei para ficar igual ao projeto de origem, que é
público. Medido depois: `<title>BRASIL</title>`, CSP presente, 2.871.381 bytes.

Verifiquei que os dois projetos são independentes: nenhum `vercel.json` nem pasta
`.vercel` em qualquer um dos repos — a ligação vive do lado da Vercel, e são dois projetos
distintos apontando para dois repositórios distintos.

Atenção a uma pegadinha: `jogo-brasil.vercel.app` (sem o sufixo do time) **não é seu** —
esse domínio genérico já pertence a outra conta e serve um "Vite App". A URL desta produção
é a com `-mrcx`.

### 2026-08-04 · as cinco decisões, e a primeira faxina

Sessão de decisão com o dono. As cinco perguntas em aberto foram respondidas — estão na
seção "O que foi decidido com o dono" acima, que é a verdade; esta entrada registra só o
caminho e os números.

**O alerta que mudou o desenho.** A progressão herdada era `LIMIARES` acumulando impacto até
trocar de cenário, para nunca mais voltar. Com períodos históricos em ordem, essa mecânica
afirma sozinha que os povos originários são a fase 1, a que se supera — o erro do §2.1, dito
pela regra e não pelo texto, onde nenhuma arte bonita conserta. O dono escolheu ordem
cronológica mesmo assim, e a escolha se sustenta por outro motivo: o capítulo final é a mesma
gente na terra dela, hoje. Não é "a história superou o começo", é "eles continuam aqui".

**Medido antes de opinar:** `index.html` tinha 5.882 linhas e 2.871.381 bytes; as 7 pinturas
de fundo somavam ~1,5 MB (54% do arquivo); os 3 cenários com desenho codado somavam 2.088
linhas; a progressão inteira cabia em ~15 linhas. Daí saiu o argumento de três capítulos e
não sete: cenário custa ~800 linhas + 210 KB cada, e sete seria o arquivo inteiro de novo.

**Três faxinas, todas com o teste verde e publicadas:**

1. **1.947 linhas de cenário que nunca rodavam.** Os sete ganchos de desenho (`fundo`, `meio`,
   `veg`, `chao`, `segmentos`, `moldura`, `fios`) só são chamados dentro de `if (!pintado)`.
   Como as sete pinturas existem, `fundoPintado()` é sempre verdadeiro e o ramo é
   inalcançável. **Provado no navegador, não deduzido:** 7/7 pinturas carregadas,
   `fundoPintado()` verdadeiro nas sete. Sobraram por cenário só `id`, `nome`, `paleta`,
   `ceu`, `chaoCor`.
   Aprendizado que custou uma tentativa: comparar os prints byte a byte **não serve** de
   prova aqui — relógio, clima e chegada sorteada de inimigo fazem dois quadros nunca serem
   iguais. A prova certa foi mostrar que o ramo não executa.
2. **As chaves do `localStorage`.** Seis ocorrências de `proto_savetheworld_*` sobreviveram à
   cópia. Não era cosmético: `localStorage` é por origem, origem inclui a porta, e servir os
   dois jogos na mesma porta de localhost fazia um ler o save do outro. Medido depois da
   troca: o navegador ainda tinha as chaves antigas ao lado das novas, e o jogo passou a
   ignorá-las. As órfãs ficam — escrever código que as apague reintroduziria o nome removido.
3. **O tema do jogo anterior.** Três alvos já eram inalcançáveis, não só desatualizados:
   `chamada` nascia `null` e nada lhe atribuía objeto; `mutiraoT` nascia 0 e nada
   incrementava; `especiais` nunca era referenciado. Saíram junto os textos vivos do tema
   antigo. Ficou o bônus por dias distintos — era mecânica, não tema.

**O que quebrou, e o que ensinou.** Ao apagar `NOTAS_VOLTA` o smoke test caiu, e por um bom
motivo: ele guardava a regra de que nenhum texto autoral pode conter dígito — o §2 com
dentes, porque número solto em frase de jogo lê como afirmação histórica. A regra vale mais
que o texto que ela vigiava. O array virou `TEXTOS`, hoje vazio, onde as pontes entre
capítulos vão morar já cobertas pela regra.

Também tentei validar o corte contando chaves e o contador acusou desequilíbrio. Antes de
acreditar, rodei o mesmo contador no arquivo **original e intocado**: mesmo −1. O teste é que
era ruim — um apóstrofo em comentário em prosa abre uma string que nunca fecha. Trocado por
`new Function` sobre cada bloco `<script>`, que é o parser de verdade.

**Números:** 5.882 → 3.843 linhas (−2.039, 35% do arquivo). 2.871.381 → 2.749.183 bytes. As 7
pinturas continuam lá e continuam sendo 54% do peso — sem elas `fundoPintado()` vira falso, o
jogo cai no ramo apagado e a tela fica vazia. **Elas saem quando a arte dos capítulos chegar,
não antes.** Smoke test verde em todos os três commits, 61–62 FPS.

**Dúvida nova.** O verbo `alcançar` foi decidido no papel e ainda não existe no código: hoje o
motor tem `golpear` com dano e morte de inimigo. A conversão não é renomear — é trocar o que
acontece quando o alcance encosta em algo. Ainda não sei se isso cabe no motor atual sem
mexer no laço de combate inteiro.

**Próximo passo:** a referência visual do capítulo 1, que precisa da aprovação do dono antes
de qualquer prompt de imagem, e a conversão de `golpear` para `alcançar`.
