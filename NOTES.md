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

### 2026-08-04 · o fundo em duas camadas, e um bug que estava vivo em produção

**A camada dupla, e por que paralaxe deixou de ser proibida.** O dono pediu fundo com
sensação de movimento contínuo sem animar muito. Paralaxe é a armadilha nº 1 do CLAUDE.md §7
e custou uma sessão no motor anterior — mas o diagnóstico registrado estava incompleto. Não é
que paralaxe seja proibida: ela é **fatal no horizonte e abaixo, e inócua acima**. O que
quebrou foi aplicar uma fração a uma pintura que continha o chão, e aí a rua deslizava sob os
pés a um terço da velocidade que eles cobriam.

`rolarFundo()` agora ladrilha em duas passadas: acima da linha do chão na fração
`paralaxeLonge`, do horizonte para baixo sempre a 1:1. Com `paralaxeLonge = 0` desenha numa
passada só, idêntico ao de antes — mesmo contrato do `ceu`, em que cenário que não declara
nada computa o que computava. Verificado no navegador: nasce em 0, liga em 0,35, renderiza
sem erro, e a camada que a personagem pisa continua a 1:1 por construção.

**A decisão tinha prazo.** Arte em duas peças custa 6 renders em vez de 3 e é de graça
enquanto nada foi gerado; depois de gerado, é regerar tudo. Por isso entrou antes da arte.

**O bug.** Um agente de auditoria apontou que `definirModo()` lançava `ReferenceError`. Não
aceitei de cara — ele avisou que não tinha rodado o jogo. Verificado por mim no navegador:

```
definirModo('carvao') -> ReferenceError: delta is not defined
definirModo('limpo')  -> ReferenceError: cansacoEq is not defined
```

Quatro identificadores inexistentes (`delta`, `saudeFim`, `fracaoPerdida`, `rampaCheia`)
montavam uma faixa de texto sobre cansaço de time, resto da economia passiva do jogo
anterior. Em `use strict` isso é exceção, não `undefined`. **Um dos três botões do jogo,
quebrado nos dois sentidos, em produção.**

**A lição não é sobre o código, é sobre o teste.** `modeQuick` não aparecia uma única vez no
`smoke.js`. Todo teste que mexia em ritmo escrevia `S.modo` direto. **Escrever no estado prova
a fórmula; só o clique prova o botão.** O teste agora toca no card duas vezes e confere que o
modo troca, que volta e que nada estourou. E o guarda foi **provado**, não presumido: com um
`ReferenceError` injetado de propósito o teste falha com 4 erros; removido, passa.

**Erro de processo meu, registrado para não repetir.** O commit `e64afc7` levou três coisas —
o conserto do card, a camada dupla e trabalho de um agente que ainda estava escrevendo — e a
mensagem descreve só a primeira. Causa: `git add -A` com agentes rodando em paralelo. Com
mais de um agente ativo, commitar por caminho explícito, nunca `-A`.

**Dúvida nova.** A camada dupla está implementada mas nunca foi vista com arte de duas peças,
porque ela não existe. O que testei foi que a fração se aplica e que o chão não se mexe — não
que o resultado seja bonito. Isso só dá para julgar com a arte do capítulo 1 na mão.

**Próximo passo:** as correções de fonte da pesquisa (ver abaixo) e a conversão de `golpear`
para `alcançar`.

### 2026-08-04 · o recortador aprende a cortar grade

`test/recortar-folha.js` agora aceita `N`, `CxR` ou `CxR:N`. A tira deixou de ser um caminho
separado: virou o caso de uma linha só, e `12` é lido como 12 colunas × 1 linha. Existe porque
SDXL não desenha uma tira de 12,6:1 — acima de ~1:2,5 ele duplica corpos — então a folha de 12
poses sai 1024×1024 em 4×3 e é cortada de lá.

**A única adição de substância é a linha de base POR CÉLULA.** Toda medida vertical — o chão
comum, o quique que cada pose guarda acima dele, o achatamento — passa a ser tirada do topo da
célula da própria pose, não do topo da folha. Sem isso, uma pose da segunda linha fica uma
célula inteira abaixo de uma da primeira e a base comum a arrasta para fora do canvas. Medido:
desligando a base por célula, a mesma grade 4×3 produz quadros de **25×515 em vez de 25×133**,
3,9× altos demais. Com uma linha só, o topo da célula é 0 e todo número sai igual ao de antes.

**Regressão provada, não presumida.** Antes de comparar, o agente estabeleceu a precondição:
rodou o script antigo duas vezes e obteve SHA-256 idênticos, então comparar bytes significa
alguma coisa. Depois, script novo contra a saída capturada do antigo:

| folha | bytes | quadros | canvas | sha |
|---|---:|---:|---|---|
| andar (12, comp 1) | 174.032 | 12/12 | 191×182 | igual |
| correr (12, comp 0,35) | 182.368 | 12/12 | 217×204 | igual |
| pular (6, comp 0) | 153.860 | 6/6 | 297×319 | igual |

**30/30 quadros idênticos byte a byte.** `12` e `12x1` dão o mesmo SHA. E a ordem de leitura da
grade não é verificação vazia: uma grade com as linhas trocadas produz hash diferente.

**As três decisões já pagas continuam de pé:** corte em células iguais (agora em 2D),
desfranjamento intocado, registro pela cabeça intocado — e este último não precisa de
normalização por célula porque a âncora só é usada como *diferença* em x, então um
deslocamento de célula inteira se cancela.

**O achado que veio de um caminho errado, e vale mais que o acerto:** a primeira tentativa de
montar uma grade de teste copiou os retângulos nominais das células e só 6 de 12 quadros
bateram. A causa não era o recortador — **as doze personagens não estão alinhadas à grade
nominal de células**. Toda mancha atravessa uma linha de célula; a da pose 1 ocupa `[10,195]`
numa célula `[0,166]`, e a transbordagem vai de 3 a 46 px. Quem realmente encontra cada
personagem é a mancha; a divisão em células só precisa conter a coluna-semente certa. Isso
está correto por projeto, mas significa que **"cortar uma tira nas linhas de célula" não é
jeito válido de montar uma grade de teste** — e é a armadilha em que a próxima pessoa cairia.

Falta o `test/LEIAME.md` documentar a forma de grade; hoje ele descreve só a tira, que segue
funcionando literalmente.

### 2026-08-05 · a arte do capítulo 1 entra no jogo

Primeira vez que o tema aparece na tela. Antes disso o repositório falava de história do
Brasil e mostrava uma rua contemporânea.

**A cadeia inteira, ponta a ponta.** O dono gera fora (ChatGPT), cola na mesa de entrega
(`ferramentas/receber.js`, localhost:8200), o arquivo cai em `assets/entrada/`, o
`test/converter-fundo.js` recorta/reduz/quantiza, e o `test/inline-fundos.js` embute em WebP.
Doze imagens recebidas: seis peças de cenário e seis objetos.

**O achado que destravou tudo: a quantização não é conserto, é o passo que faz a arte
existir.** O gerador não faz pixel art — as seis peças vieram com 220 mil a 328 mil cores
depois de *dois rounds* pedindo 32, sem mover o número. Isso é limite do modelo, não do
prompt. Mas cortar para 48 cores por popularidade não estragou nada: transformou degradê
suave em banda com granulado, que lê como dithering; nuvem ganhou bloco; copa virou mancha
chapada. **O que era ilustração suave virou pixel art de verdade.** Medido na peça de cima do
capítulo 1: 1024×1536 → recorte 1024×1364 → 720×959, 173.679 cores → 48.

**As duas camadas, funcionando.** `rolarFundo()` ladrilha duas imagens em passadas separadas:
a de cima na fração `paralaxeLonge`, a de baixo **sempre 1:1**. A geometria não precisou
mudar — as peças têm 959 e 320 px, somam 1279, e a emenda cai em 0,75, exatamente o
`FUNDO_GROUND_SRC` que a conta já usava quando a pintura era uma só. `fundoPintado()` agora
exige as duas peças carregadas: meia paisagem é pior que nenhuma, porque a personagem
apareceria pisando no vazio por alguns quadros.

**Sete cenários viram três capítulos.** `LIMIARES` cai de seis limiares para dois, e o campo
`cenario` do `ESQUEMA_SAVE` de `max: 6` para `max: 2` — save é entrada não confiável e o
esquema é a única porta.

**Números:** index.html 2,75 → **2,41 MB**. Encolheu mesmo trocando toda a arte, porque as
seis peças em WebP pesam menos que as sete pinturas antigas. Em PNG teriam levado o arquivo a
~4,1 MB. Smoke test verde, 61 FPS.

**O que está feio agora, e é honesto registrar:** a protagonista continua sendo a menina
contemporânea do projeto anterior, com varinha, plantada numa mata atlântica do século XVI. É
o contraste mais gritante do jogo hoje, e não tem conserto por ferramenta — ver a seção sobre
o muro abaixo.

**Ferramentas de geração, três testadas e três paredes.** Hugging Face (Space pausado, widget
exige login), Civitai (bloqueou o prompt com "Inappropriate minor content" — falso positivo,
o prompt não tinha pessoa nenhuma) e ChatGPT. As três compartilham dois limites: **nenhuma faz
pixel art nativa**, e **todas bloqueiam a descrição do corpo de uma criança**. O primeiro eu
contorno quantizando; o segundo não tem contorno.

**A protagonista é o caminho crítico e não se resolve com prompt melhor.** Cenário perdoa a
quantização; sprite não, porque precisa de 12 quadros com a *mesma* pessoa, e quantizar 12
imagens ligeiramente diferentes dá 12 personagens piscando. Precisa de alguém desenhando.

**Feito na sequência, mesma noite:**

- **Interface em português.** IMPACTO, ANDAR/CORRER, MELHORIAS, GRÁTIS. `lang="pt-BR"` no
  html — não é cosmético, leitor de tela e corretor seguem esse atributo. `toLocaleString`
  em pt-BR, então o milhar sai `1.234`. ANDAR/CORRER no lugar de STEADY/FAST: o modo já era
  isso na prática; "limpo/carvão" era vocabulário de energia do jogo anterior.
- **Os objetos do capítulo 1 substituíram os monstros de poluição.** Fruta, peixe e muda no
  lugar de fumaça, tambor e saco de dinheiro. `test/converter-objeto.js` faz o caminho do
  magenta ao quadro, e o passo que não é óbvio é o **desfranjamento**: os pixels de contorno
  são *mistura* do objeto com o fundo, porque o gerador antialiasa a borda contra o magenta.
  Teste binário deixaria esses pixels opacos e pintaria um aro rosa em volta de tudo. Mede-se
  `min(R,B) − G`, isso vira o alfa, e a cor é desmisturada.
- Seis fatias iguais por objeto: o motor pede seis quadros e há uma arte só. Objeto parado
  certo vale mais que objeto animado errado.

**Ferramentas novas em `test/`:** `converter-fundo.js` (recorte, redução, quantização),
`converter-objeto.js` (desfranjamento do magenta) e `inline-fundos.js` (embute em WebP).
`ferramentas/servir.js` e `.claude/launch.json` declaram os dois servidores — jogo na 8199,
mesa de entrega na 8200. O `npm start` estava quebrado: chamava `python3`, que neste Windows
não existe.

**Próximo passo:** a personagem é o contraste mais gritante da tela — menina contemporânea com
varinha numa mata do séc. XVI. Sem solução por ferramenta. Depois dela: os drops (ainda são
os do jogo antigo), o segundo cenário por capítulo, e dar peso ao verbo `alcançar` — hoje
ignorar o que passa não custa nada, então o verbo mudou de nome mas não de consequência.

## Fontes — o que a pesquisa achou, e uma correção

**CORREÇÃO: "Angola Janga" não pode ser apresentado como fato histórico.** Eu havia afirmado
ao dono, com base em enciclopédia aberta, que quem morava em Palmares chamava o lugar assim.
A pesquisa não localizou **nenhuma atestação do termo em documento colonial do século XVII**.
As ocorrências remontam a dicionários do século XX (Clóvis Moura, "pequena Angola"; Nei Lopes,
"minha Angola" — e os dois **divergem** no sentido) e à popularização pela graphic novel
*Angola Janga*, de Marcelo D'Salete (2017), que é pesquisa séria mas é ficção histórica.
Sinal decisivo: o estudo mais completo e recente da toponímia palmarina a partir da
documentação primária — Silvia Hunold Lara, "O território dos Palmares", *Afro-Ásia* n. 64,
2021 — **não menciona o termo em momento nenhum**. Antes de qualquer uso, buscar *janga* /
*ianga* no corpus do Documenta Palmares. Sem isso, o jogo não afirma; no máximo credita como
nome consagrado pela cultura contemporânea.

**Base documental central do capítulo 2:** [Documenta Palmares](https://palmares.ifch.unicamp.br)
(Silvia H. Lara, Unicamp/CECULT) — ~4.400 cópias digitais de documentos dos séc. XVII–XIX, de
arquivos brasileiros, portugueses e holandeses, mais cartografia interativa dos mocambos. A
própria apresentação avisa que as informações são "incompletas e muitas vezes contraditórias".

**Grafias corrigidas por paleografia** (Lara & Fachin, *Guerra contra Palmares: o manuscrito de
1678*, Chão Editora, 2021): **"Gana Zumba"**, não "Ganga Zumba" — em quimbundo *gana* é
"senhor" e *ganga* é "sacerdote"; e **"Aca Inene"**, não "Acotirene". Mocambos documentados:
Macaco, Subupira, Amaro, Andalaquituche, Osenga, Dambrabanga, Arotirene, Tabocas, Aqualtune,
Zumbi, Acotirene, Gongro. (Minha lista anterior tinha grafias erradas.)

**O achado que liga o capítulo 1 ao 3: os Tupinambá não são passado.** Existe o povo
**Tupinambá de Olivença**, no sul da Bahia, com terra em demarcação **agora**: Portaria
Declaratória nº 1075/2025, ~47.376 ha em Ilhéus, Una e Buerarema, 23 comunidades — o
penúltimo passo administrativo, após o processo ficar parado mais de uma década depois do
RCID de 2009. ([Enciclopédia Povos Indígenas no Brasil / ISA](https://pib.socioambiental.org/pt/Povo:Tupinambá))

**O objeto que atravessa os três capítulos:** o **manto Tupinambá**, penas de guará, na
Dinamarca desde 1644, reconhecido em 2000 pela anciã Nivalda Amaral, do povo Tupinambá de
Olivença, e recebido pelo Museu Nacional/UFRJ em 12 de setembro de 2024.
([UFRJ](https://ufrj.br/2024/09/cerimonia-oficial-marca-chegada-do-manto-tupinamba-ao-museu-nacional-da-ufrj/))

**O dado mais forte para o §2.1**, e vem do Estado, não de opinião: Censo 2022 do IBGE —
**391 etnias e 295 línguas indígenas**, 1,69 milhão de pessoas, crescimento de 88,96% entre
2010 e 2022. É o argumento factual contra tratar "índio" como categoria única.

**Terminologia, com base legal:** Lei nº 14.402/2022 institui o Dia dos Povos Indígenas e
revoga o "Dia do Índio" de 1943. É o Estado brasileiro, em lei, adotando "povos indígenas" no
plural. ([Planalto](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/L14402.htm))

**"Confederação dos Tamoios" é rótulo do século XIX**, consolidado pelo poema épico de
Gonçalves de Magalhães (1856), não autodenominação. O conflito (1554–1567) é real; o nome é
construção romântica imperial. Usar com aspas ou explicar a origem.

**Tibiriçá — erro confirmado como erro.** Era **Tupiniquim**, em Piratininga (São Paulo), não
guarani na Bahia. E era aliado dos portugueses, tendo lutado contra outros povos indígenas.
Impróprio para o capítulo 1 por duas razões independentes.

### Números que NÃO podem entrar como fato

- **População indígena em 1500:** sem consenso. Rosenblat 1 milhão (1945), Hemming 2,4 milhões
  (1978 — que chamou o próprio número de *"pure guess-work"*), Denevan 4,8 milhões (1976,
  criticado por basear-se em potencial agrícola). O **IBGE publica 2.431.000 sem ressalva
  metodológica**, atribuído a Darcy Ribeiro (1957) e Kietzman (1967). Recomendação: **não citar
  número; citar a disputa.** (Carrara, *Tempo* v. 20, 2014)
- **População de Palmares:** a Fundação Cultural Palmares, órgão federal, afirma "cerca de 20
  mil pessoas"; Silvia Lara classifica os números da documentação seiscentista como
  **exagerados**. Um órgão do Estado e a historiadora de referência discordam. Não escolher
  lado: dizer que a documentação colonial registra números que a pesquisa atual considera
  inflados.
- **Tombamento da Serra da Barriga:** 1985 (Fundação Palmares) × 31/01/1986 (outras fontes).
  A página do IPHAN não abriu. Verificar antes de usar.

### Lacuna de método, não de bibliografia

Nenhuma fonte levantada é de **autoria indígena ou quilombola direta** — todas são de
instituições e pesquisadores *sobre* esses povos. Para um repositório cuja regra diz que "o
protagonismo é de quem foi escravizado" e que os povos originários "continuam aqui", isso é
uma falha de método. Buscar publicações da APIB, do ISA em coautoria indígena, e autores como
Ailton Krenak, Davi Kopenawa, Daniel Munduruku, Beatriz Nascimento e Abdias do Nascimento —
**antes** de escrever qualquer ponte, não depois.

### 2026-08-05 · as sprites saem por IA, contra o meu próprio veredito

Eu havia dito que a protagonista não sairia por gerador. **Estava errado, e por um motivo que
era suposição minha:** a parede de política vinha de eu descrever *criança*, porque a arte
herdada tem proporção infantil (2,0 × a largura da cabeça). Com pessoa adulta, o gatilho não
aparece.

O outro medo — 12 quadros com a mesma pessoa — **foi resolvido pela folha em render único**.
Medido pelo `test/validar-folha.js` na caminhada do capítulo 1:

| medida | valor |
|---|---|
| largura da cabeça | média 76,8 · min 76 · max 78 · **CV 1,0%** |
| amplitude | 2,6% da média |
| altura/cabeça | 4,2 · CV 1,2% |
| manchas | 12, em 4 \| 4 \| 4, zero fragmento |
| franja | 0,55 px (o desfranjador resolve até ~1) |

CV de 1,0% na cabeça é a prova: o modelo manteve a mesma pessoa porque desenhou as doze
figuras **no mesmo render**, e coerência interna da imagem fez o trabalho que memória entre
chamadas não faria.

**Consequência já prevista e ainda não paga:** altura/cabeça passa de 2,0 para 4,2 — proporção
adulta. `PASSO_PX` foi *medido* na arte antiga (40,9/12 px por quadro, tirado da pose de maior
abertura). Com corpo novo, essa medida não vale mais, e usar a velha faz o pé deslizar. É meia
sessão de medição e é bloqueante para trocar a personagem.

**Dúvida de representação que fica aberta, e é do dono:** a figura veio com tanga e braçadeira.
Não caiu no erro do cocar das Planícies — o aviso no prompt funcionou —, mas "tanga genérica"
ainda é uma escolha sobre cultura material Tupinambá que eu não devo tomar sozinho. Está entre
as 15 do `PROMPTS.md`.

## Telas que faltam — pedido do dono, 2026-08-05

O jogo tem uma tela só. Faltam quatro, em ordem de valor:

1. **Menu inicial.** Hoje o jogo começa sem começar. É a primeira impressão e não existe.
2. **Transição entre capítulos.** É onde as PONTES vivem — o texto curto que contextualiza,
   estilo caixa de jogo antigo (referência do dono: Pokémon). Toda afirmação histórica ali
   precisa de fonte no `NOTES.md`, e o `TEXTOS` já é varrido pelo smoke test contra dígitos.
3. **Visão de completude.** O que a pessoa já viu e o que falta. É o motivo de voltar amanhã.
4. **Configurações.** Som (que não existe ainda), e apagar o save.

Nenhuma delas precisa de arte nova: são interface, e a interface do jogo já tem vocabulário
próprio (as sheets de MELHORIAS). Fazer com o que existe é mais rápido e fica mais coeso.
