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

Eles **param e esperam**, e quem não é alcançado segue caminho. Chegam a cada 0,45× a 1,4× de
`CFG.mobVao`, que é medido em **pixels de mundo percorridos** e não em segundos — o mesmo vale
para as folhas. É essa unidade que faz **correr** significar alguma coisa: a rua é um lugar, não
um relógio, então quem corre atravessa o dobro dela e encontra o dobro de gente, com metade do
tempo para cada uma. Andando: ~34 chegadas/min, fração alcançada 1,00. Correndo: ~70/min, fração
0,46–0,51 e +13 a +18% de renda. Ao ser alcançado, cada um larga um drop, recolhido ao passar
por cima.

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

A conta mora em `velocidadeMundo()`, e ela tem **dois** clientes: o rolamento do mundo e o
nascimento das chegadas e das folhas, que são medidos em chão e não em relógio. Se os dois
divergirem, andar e correr deixam de ser a mesma rua vista em ritmos diferentes.

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
- ~~Formato das pontes: caixa de texto estilo jogo antigo (referência do dono: Pokémon).~~
  **Feito.** Virou a caixa de fala: personagem à esquerda, texto revelado letra a letra, toque
  para avançar, PULAR discreto. O conteúdo é `EPOCAS`, escrito pelo dono.

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

### Revisão do historiador — 2026-08-06, correções aplicadas no mesmo commit

Um agente historiador revisou tudo que o jogo afirma. Quatro correções entraram em produção:

1. **"Nos duzentos anos seguintes, milhões…" → "Ao longo de mais de três séculos, milhões…"**
   O tráfico durou até c. 1850 e o total de ~4,9 milhões de desembarcados é do período inteiro;
   até ~1700 a base registra perto de um milhão — "milhões" não se sustentava naquela janela.
   Fonte: *Trans-Atlantic Slave Trade Database* — SlaveVoyages.org (Emory University).
2. **"eram centenas de povos" → "E não estavam sozinhos: esta terra era de centenas de povos".**
   O referente escorregava: a frase atribuía as centenas de povos aos próprios Tupinambá —
   o erro do §2.1 em miniatura, dentro da frase que existe para combatê-lo.
3. **"dezesseis anos de processo parado" → "processo que ficou parado por mais de uma década"**
   (na abertura do cap. 3 e no momento 6). De 2009 a 2025 são dezesseis anos de *processo*,
   não de *paralisia* — houve etapas ativas nas pontas.
4. **Hans Staden "1554–1557" → "1554 · relato publicado em 1557".** O cativeiro durou ~9 meses;
   1557 é a publicação da *Warhaftige Historia*. O intervalo sugeria três anos de cativeiro.

**Fonte registrada para número já em produção:** "mais de vinte expedições militares" contra
Palmares — Flávio dos Santos Gomes, *Palmares: escravidão e liberdade no Atlântico Sul*
(Contexto, 2005); Fundação Cultural Palmares. O número estava no jogo sem registro aqui.

**Tensão de datas — RESOLVIDA pelo dono em 2026-08-06:** "resistiram por quase cem anos"
virou **"resistiram por décadas"**. Das duas leituras defensáveis (ancorar os mocambos no
início do séc. XVII, ou encurtar a afirmação), ele escolheu a que não afirma nada além do
que as duas fontes sustentam juntas.

**Os oito marcos ENTRARAM em produção em 2026-08-06** (dono: "ok"), pendurados nos dois
vãos da linha do tempo com `cena` de revelação (vão XVI→XVII revela ao alcançar Palmares;
vão XVII→hoje, ao alcançar o presente). As fontes de cada um estão no parágrafo acima.

~~**Tensão de datas que só o dono resolve (⚠):** "resistiram por quase cem anos" ao lado de
"a partir de mais ou menos 1630" não fecha (64 anos). O "quase um século" conta desde as
primeiras menções a mocambos no início do séc. XVII. Ou a abertura ancora mais cedo, ou o
"quase cem anos" vira "por décadas".~~

**Marcos propostos para a linha do tempo** (cada um com fonte completa, no relatório da
sessão): vão XVI→XVII — o açúcar (Schwartz 1988), a terra esvaziada à força (Monteiro 1994;
Cunha 1992), a travessia forçada (SlaveVoyages), a guerra holandesa (Gomes 2005); vão
XVII→presente — Bahia de 1835 (Reis 2003), a Lei Áurea de dois artigos (Lei 3.353/1888), a
Constituinte de 1988 (CF art. 231 e ADCT art. 68; discurso de Ailton Krenak, 04/09/1987), e
quilombolas no Censo 2022 (IBGE: 1.327.802 pessoas, primeira contagem; Fundação Palmares).
Beatriz Nascimento, "O conceito de quilombo…" (1985; org. Ratts, Zahar, 2021) para Palmares
como faixa que continua, não ponto que acaba. As formas da linha: borda esquerda aberta
(havia milênios antes), Palmares como FAIXA, borda direita aberta (disputa em curso), e os
dois fios — indígena e negro — visíveis, não achatados num traço só.

### Decisões do dono — noite de 2026-08-06, antes de dormir

O arco nacional de 10 capítulos foi **aprovado com mais densidade** e uma correção de
partida: **o jogo não pode começar no século XVI** — "já tinham pessoas por aqui…
toda a história do Brasil desde o começo, antes de mil e quinhentos, é importante".
Um capítulo (ou mais) de história profunda entra ANTES do atual cap. 1. Cuidado
explícito que ele pediu: **sem virar reconexão religiosa** — a espiritualidade dos
povos não é o assunto; o assunto é gente vivendo, tecnologia, agricultura, cidade.

As cinco decisões pontuais:
1. **Branqueamento entra** (Hospedaria) — "lembre que não queremos uma visão elitista
   ou europeia".
2. **Pessoas reais como HOMENAGEM em 8-bit**: Krenak na Constituinte pode aparecer como
   referência visual/retrato 8-bit em tom de homenagem — critério estendido a outras
   figuras importantes. NUNCA como inimigo, nunca jogável, sempre com dignidade (§2).
3. **Número da CNV entra** (8.350, com a ressalva da própria Comissão) — "são dados
   importantes".
4. **Conselheiro pode entrar como homenagem** (mesmo critério 8-bit do item 2).
5. **Custo dos 10 capítulos aprovado** — com a regra da fila: em qualquer ponto em que
   a produção parar, o jogo publicado é um arco completo e equilibrado.

Instruções operacionais da mesma mensagem: trabalhar sozinho ~10 h; explorar
jogabilidade (decisão dele: **travessia + lugar vivo**, com pelo menos 1 capítulo no
padrão atual), usabilidade e conexões; preparar a mesa de entrega para os assets
novos; foco permanente: **conscientizar, educar e passar conhecimento**.

### A história profunda — relatório pré-1500 (2026-08-06) e o que entrou

Cinco marcos entraram na LINHA_TEMPO, visíveis desde o início (são o chão de tudo, não
recompensa). Fontes: Neves & Piló (Luzia); **Maria Dulce Gaspar**, *Sambaqui: arqueologia
do litoral brasileiro* (Zahar, 2000); **Anna C. Roosevelt**, *Moundbuilders of the
Amazon* (1991) e **Denise Schaan**, *The Camutins Chiefdom* (2004); Schaan, Ranzi &
Pärssinen (Bol. Goeldi) e **Jennifer Watling** et al. (PNAS 2017) para os geoglifos e o
manejo milenar; Noelli, "The Tupi expansion" (Handbook of South American Archaeology,
2008). Optou-se por "mais de quinhentas" em vez do número 523 (levantamento com data —
recomendação do historiador).

**Regra de nomeação, agora escrita e permanente:** quem não deixou nome se nomeia pela
OBRA (o povo dos sambaquis, a gente de Marajó), nunca por etnia moderna projetada no
passado; o jogo diz que o nome se perdeu e POR QUÊ. "Pré-história" e "primitivo" são
palavras banidas — em fala, código, asset e nestas notas. Continuidade demonstrada se
diz como continuidade ("entraram na história dos povos que vieram depois"), nunca como
identidade. Banida também a comparação "mais antigos que as pirâmides" — régua estrangeira.

**Dois capítulos jogáveis desenhados e À ESPERA de decisão do dono:**
- **A COSTA QUE ELES LEVANTARAM** (sambaquis) — o monte cresce no fundo com S.cuidado.
- **A FLORESTA É OBRA** (Amazônia/geoglifos) — plantar; o capítulo "no padrão atual".
Ambos com abertura/fecho rascunhados e a trava anti-religião cumprida por desenho (nada
de enterramento, urna ou função cerimonial — só obra, datação e material).

**⚠ Pendências do dono (pré-1500):**
1. Renomear o atual cap. 1: "ANTES DA CHEGADA" vira nome errado como terceiro capítulo.
   Sugestões: A COSTA DOS TUPINAMBÁ · QUANDO OS NAVIOS APARECERAM.
2. Marajó: capítulo ou marco? Recomendação firme do historiador: MARCO — um capítulo
   honesto de Marajó seria sobre material funerário (o corte de religião o machuca).
3. A afirmação genômica do fecho dos sambaquis exige conferir o artigo original antes.
4. Inserir capítulos no INÍCIO desloca todos os índices — exige migração de save
   (S.cenario/aberturas/fechos) no mesmo commit.
5. A regra que o historiador propõe como inviolável: se não houver arte para os dois
   capítulos ficarem TÃO BONS quanto o melhor capítulo do jogo, é melhor não fazê-los —
   capítulo de abertura feio sobre engenheiros milenares diz "primitivo" sem usar a palavra.

### Regra de fonte do dono (2026-08-06) e a estante das pesquisadoras

O dono pediu: referências como Ailton Krenak, e **as mulheres que pesquisaram cada
período**. Vira critério permanente (está no CLAUDE.md §2). A estante mínima por período,
para qualquer capítulo futuro partir dela:

- **Povos originários / séc. XVI:** Manuela Carneiro da Cunha (org., *História dos índios
  no Brasil*, 1992); Maria Regina Celestino de Almeida (*Metamorfoses indígenas*, 2003);
  Eliane Potiguara (*Metade cara, metade máscara*, 2004 — autoria indígena).
- **Palmares / séc. XVII:** Silvia Hunold Lara (*Palmares & Cucaú*, 2021; Afro-Ásia 64) —
  já é a referência crítica da seção de fontes.
- **Guarani / Sete Povos:** Lía Quarleri (*Rebelión y guerra en las fronteras del Plata*,
  2009); Graciela Chamorro (*Terra Madura*, 2008).
- **Bahia de 1835:** João J. Reis é a âncora; ao lado, Cecília Moreira Soares (as
  ganhadeiras), Lisa Earl Castillo, Wlamyra Albuquerque (*O jogo da dissimulação*, 2009).
- **Pós-abolição / Pequena África:** Beatriz Nascimento (org. Ratts, 2021); Lélia Gonzalez
  (*Lugar de negro*, 1982); Conceição Evaristo para a voz literária.
- **Ditadura e povos indígenas / Constituinte:** CNV vol. II; Daniel Munduruku (2012);
  Ailton Krenak (Constituinte 1987; *Ideias para adiar o fim do mundo*, 2019); Davi
  Kopenawa & Bruce Albert (*A queda do céu*, 2015); Célia Xakriabá e Sônia Guajajara para
  o movimento contemporâneo (APIB).

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
2. ~~**Transição entre capítulos.**~~ **Feita**, e ela virou mais que transição: a abertura de
   cada capítulo fala **antes** de a pessoa jogar, e o fecho fala ao completá-lo. O texto é do
   dono e vive em `EPOCAS` — não em `TEXTOS`, que é ficção autoral e não pode conter dígito.
3. **Visão de completude.** O que a pessoa já viu e o que falta. É o motivo de voltar amanhã.
4. **Configurações.** Som (que não existe ainda), e apagar o save.

Nenhuma delas precisa de arte nova: são interface, e a interface do jogo já tem vocabulário
próprio (as sheets de MELHORIAS). Fazer com o que existe é mais rápido e fica mais coeso.

### 2026-08-05 · a passada medida na arte nova, e um problema que a medição achou

**A medição que bloqueava a troca da personagem, feita.** Na folha `sprite-cap1-andar`,
recortada em 4×3:

| | arte antiga | arte nova |
|---|---:|---:|
| maior abertura pé a pé | 85,5 px de sprite | **132 px** |
| altura da figura nessa pose | 184 px | **315 px** |
| escala para 44 px de mundo | 0,239 | **0,1397** |
| PASSO (meio passo) | 20,45 px | **18,44 px** |
| **PASSADA (ciclo)** | 40,9 px | **36,88 px** |

A passada nova é ~10% MENOR, não maior — contra a intuição, porque a figura adulta é mais
alta em pixels de arte, então a escala para caber nos mesmos 44 px de mundo é mais agressiva
e come a diferença da perna mais longa.

**Mas a medição achou um problema maior que o que foi resolver.** O vão pé-a-pé quadro a
quadro:

```
110  94  132  131  |  22  27  26  25  |  125  51  52  51
```

**Isso não é um ciclo de caminhada.** Ciclo real vai de aberto a fechado e volta, de forma
contínua. Aqui há um degrau brusco — quatro quadros abertos, quatro quase fechados, e depois
valores que não fecham o laço. O modelo desenhou **doze poses da mesma pessoa** (CV de 1,0%
na cabeça, isso ele acertou e era o difícil), mas não desenhou **um ciclo**.

Consequência: embutir assim faz a caminhada ler como tropeço, e aí `PASSO_PX` correto não
salva. **O bloqueio da troca de personagem deixou de ser medição e passou a ser a arte.**

Duas saídas, e a segunda é melhor:
1. Escolher a dedo os quadros que formam uma progressão e descartar o resto — sobra um ciclo
   de 6 ou 8 quadros, e as velocidades teriam que ser refeitas para `PASSO × 60 / n`.
2. Pedir a folha de novo com o ciclo descrito **pose a pose** no prompt, em vez de "um ciclo
   de caminhada completo". O modelo não sabe o que é fase de contato, de passagem e de
   impulso; ele sabe desenhar o que for descrito.

### 2026-08-05 · os objetos, os drops e os ícones param de ser só do capítulo 1

A auditoria da entrada anterior contou 23 imagens geradas e nunca embutidas. Esta sessão
embutiu 15 delas: seis objetos que atravessam a tela, dois drops e quatro ícones do painel — e
reconverteu as nove que já estavam no jogo, para que todas passem pela mesma régua.

**O que variava por capítulo era só a vegetação.** `FRENTE_B64` já escolhia o bloco do capítulo
com `Math.floor(cenarioAtual() / 2)`; `MOB_B64` e `DROP_B64` tinham um conjunto só, o do
capítulo 1. Na prática: em Palmares e hoje, o que atravessava a tela era o cacho de fruta do
litoral do século XVI. Agora as três estruturas usam o mesmo desenho — `capArte()` é a conta,
escrita uma vez.

| vaga | recurso | capítulo 1 | capítulo 2 | capítulo 3 |
|---|---|---|---|---|
| `smog` | flor | cacho de fruta | mandioca | muda em saco |
| `drum` | agua | muda | pote de água | galão de água |
| `cash` | refeicao | peixe | cesto de mantimento | cesto de hortaliça |

Sobraram sem vaga `cap2-obj-3` (feixe de lenha) e `cap3-obj-3` (enxada): são três tipos de
objeto e quatro artes por capítulo. Ficam convertidos em `assets/objetos`, prontos.

Drops: o capítulo 1 tem três (semente, broto, peixe); os capítulos 2 e 3 têm **um cada** —
mandioca e muda — porque foi o que se desenhou. `DROP_B64` virou uma lista por capítulo, e a
lista curta é lida como "todo mundo deixa isto". Repetir o mesmo base64 três vezes seria peso
por nada, e servir o drop do capítulo errado seria pior.

**O bug que a medição achou, e que estava em produção: nada era recortado.** O
`converter-objeto.js` monta a mancha com os pixels de alfa acima de **40**, e o magenta do
gerador não é chapado — tem ruído, e um punhado de pixels de fundo passa desse corte. Medido: a
mancha das 20 artes dava a **moldura inteira**, sempre. Como a escala no jogo é
`altura-alvo / altura-do-quadro`, essa borda de vazio virava duas coisas ao mesmo tempo:

- **objeto menor que o alvo** — 30 px de alvo davam 24 de fruta, 19,8 de muda, 16,9 de peixe;
- **objeto flutuando** — a borda de baixo empurrava tudo para cima: 6,0 · 5,3 · 5,0 px de mundo
  acima do chão, num jogo cuja primeira regra de integração de cenário é que nada levita.

O corte passou para 128 — meio alfa, que pega o corpo e ignora a franja e o ruído. E os alvos
foram refeitos para o objeto ficar do MESMO tamanho de antes na tela, agora sem a borda:

| | antes · quadro / objeto / flutua | depois |
|---|---|---|
| `smog` | 30,0 / 24,0 / **6,0** | 24,0 / **24,0** / **0,0** |
| `drum` | 30,0 / 19,8 / **5,3** | 20,0 / **20,0** / **0,0** |
| `cash` | 26,0 / 16,9 / **5,0** | 17,0 / **17,0** / **0,0** |
| drop | quadro de 18,0 para ~8,3 de objeto | 9,0 / 9,0 |

Medido no navegador nas duas versões, mesma cena, mesmos objetos.

**Segundo bug do mesmo conversor: `icone-agua` era um quadrado preto.** A arte chegou com alfa
em vez de magenta, e `min(R,B) − G` sobre um pixel transparente `(0,0,0,0)` dá 0, que o
conversor lê como "sem magenta, portanto opaco" — devolvendo a imagem inteira opaca e preta. O
arquivo já estava em `assets/objetos` desde a sessão passada. Honrar o alfa da origem antes do
teste do magenta resolve, e é uma linha.

**A levitação virou tabela por capítulo.** A vaga `smog` voa (levitação 16 mais senóide) porque
no capítulo 1 ela é um cacho pendurado. Nos capítulos 2 e 3 são mandioca e muda: `MOB_LIFT` é
um array de três, a senóide só existe onde a levitação é maior que zero, e mandioca não boia.

**Os seis quadros por objeto eram a mesma imagem seis vezes.** O motor pede seis quadros
(entrando, parado, dissipando) e há um desenho só por objeto, então o base64 estava guardado
seis vezes para produzir uma animação de quadros idênticos. Agora é uma arte por capítulo por
vaga, e `mobFrame()` devolve a do capítulo. Nada se perde: a animação já era um quadro parado.

**Os ícones do painel.** Os três contadores mostravam os DROPS do capítulo 1. Com o drop
variando por capítulo, o contador mudaria de figura no meio da partida — e ele conta um
acumulado que atravessa os capítulos. Agora são folha, água e cesto, que é exatamente o
`RECURSO_DE` (flor, agua, refeicao) e foi para isso que as artes foram pedidas. O quarto ícone,
o pé, é o cartão de ritmo, e é o **mesmo nos dois modos**: quem diz qual ritmo está valendo são
o nome e a cor do cartão, e a chama contra a folha era a mesma informação dita duas vezes. O
`renderIcon` procedural continua vivo e intocado para o `leaf`, o `sword` e o `up` da marcação.

**Números:** `index.html` 3,43 → **3,46 MB** (+34 KB). Cresceu embora cinco sextos da arte
repetida tenham saído, porque o recorte justo põe mais objeto e menos vazio dentro do mesmo
quadro, e vazio comprime melhor que desenho. Arte embutida: 122 KB de WebP. Smoke test verde,
61 FPS, e nenhum erro de console nos três capítulos.

**A medição que o capítulo 2 e o 3 pediam, feita — e ela diz para NÃO copiar o capítulo 1.**
A sessão passada escolheu os quadros 6, 5 e 2 da folha de caminhada do capítulo 1 medindo a
SOLA (as colunas cuja tinta mais baixa fica a ≤2 px da base da mancha). Repeti a medida nas
folhas de cap.2 e cap.3, e a estrutura de quadros repetidos é **outra**:

| folha | pares quase idênticos, por diferença de silhueta | cabeça CV |
|---|---|---|
| cap 1 | 6→7 (2,4%) · 7→8 (3,6%) · 10→11 (3,6%) · 11→12 (3,1%) | 1,0% |
| cap 2 | 3→4 (5,9%) · 7→8 (7,8%) · 8→9 (8,3%) | 0,8% |
| cap 3 | 3→4 (3,6%) · 8→9 (4,2%) · 6→7 (6,8%) | 0,8% |

As três folhas passam no teste que importava — 12 manchas, zero fragmento, cabeça com CV de
0,8%, ou seja **a mesma pessoa nos doze quadros**. Mas `--quadros=6,5,2` é resposta da folha do
capítulo 1 e de mais nenhuma: cada folha precisa da própria escolha e do próprio `PASSO_PX`.

**Por que as sprites de cap.2 e cap.3 NÃO entraram.** Não é a folha: é o motor. Hoje há um
`HERO_B64`, um `PASSO_PX` e um `heroScale`, todos únicos. Personagem por capítulo significa
velocidade de caminhada por capítulo, e a velocidade tem de continuar sendo `PASSO × 60 / n`
com `n` inteiro em **cada** capítulo — senão a cadência sai 2-2-3 e lê como trepidação. É a
armadilha nº 1 do §7 e é sessão própria, não sobra de sessão.

**Próximo passo:** as sprites de cap.2 e cap.3, começando pela escolha de quadros da tabela
acima e por decidir se `PASSO_PX` vira tabela por capítulo ou se as três folhas são reescaladas
para um passo comum.

### 2026-08-05 · o que passa para e espera, e o mundo responde a quem ficou sem ninguém

O produto mediu o buraco em uma linha: segurando o botão por 12 s, **o que atravessa a tela
valia 4% da renda** sem melhoria e **1% com a `u1`**; o resto era toque no vazio (59%) e folha
recolhida andando (37%). Ignorar tudo não custava nada. O verbo tinha trocado de nome —
"golpear" virou **alcançar** — e não tinha trocado de consequência.

Duas mudanças, e elas só funcionam juntas.

**1. O que chega PARA e espera.** `m.parado` existia desde o motor herdado, era escrito `false`
todo quadro e nunca virava `true`. Agora a coisa entra pela direita, para em `W - 8` e fica.
Quem a afasta é só a caminhada da personagem, e é aí que está o teto desta mecânica: **ela
nunca para de andar**, então a permanência máxima é a largura da tela dividida pela velocidade
dela. Medido, do instante em que para:

| | alcançável | na tela | desiste de esperar |
|---|---:|---:|---|
| antes (atravessando a 34 px/s contra ela) | 1,15 s | 2,3 s | — |
| andando (38,3 px/s) | **2,74 s** | **3,58 s** | aos 2,4 s |
| correndo (76,5 px/s) | 1,50 s | 2,28 s | a rua a leva antes, aos 2,28 s |

`CFG.mobEspera = 2,4 s` não é gosto: andando, a personagem cobre 92 px nesse tempo, e uma coisa
que parou em sx 122 está em sx 30 quando o relógio acaba — exatamente saindo do alcance de
80 px. A desistência acontece **dentro do quadro**, onde dá para ver, em vez de fora dele.

**O sinal de espera é dois anéis mornos no chão**, respirando devagar, do tamanho de um lugar
reservado. No lugar deles havia dois tiques **vermelhos** piscando nos pés — a gramática de
perigo e de erro. No capítulo 2 quem chega e espera é gente, e o §2.2 não admite barra de
aflição, contagem regressiva nem vermelho em cima dela. O anel não encolhe, não muda de cor e
não acelera: só apaga nos últimos 0,6 s, o que é despedida e não alarme. A primeira versão, a
1 px de traço, sumia contra a terra pintada — foi preciso **olhar o print**, que é o que o §6
manda e o teste não faz.

**2. Uma de cada vez, e o empurrão foi embora.** Com as coisas paradas, segurar o botão atendia
**tudo**: medido 21 de 21 andando e 28 de 28 correndo. Duas causas: o golpe atingia TODAS no
alcance (80 px é metade da tela), e cada acerto empurrava o alvo 10 px — a 6,9 golpes/s isso
devolve 70 px/s, mais do que os 38–77 px/s com que a caminhada afasta, então nada saía do
alcance enquanto apanhasse. Agora o golpe atende **a mais próxima** e não empurra quem está
parada — ninguém empurra para trás quem veio pedir ajuda. O alcance continua 80 px, então o fim
da fila continua alcançável; só que na vez dele.

**3. A rua ganhou fila.** `mobIntervalo` de 7 s para **1,8 s**, varrido em 300 s por ponto:

| intervalo | chegadas/min | fila média/pico | fração atendida andando | correndo |
|---:|---:|---:|---:|---:|
| 3,2 | 20 | 0,52 / 2 | 1,00 | 0,73 |
| 2,4 | 27 | 0,68 / 2 | 1,00 | 0,71 |
| **1,8** | **35** | **1,40 / 3** | **1,00** | **0,67–0,70** |
| 1,4 | 46 | 1,38 / 3 | 1,00 | 0,71 |
| 1,1 | 56 | 1,91 / 4 | 0,95 | 0,62 |

**4. O mundo responde — e não o placar.** `S.cuidado` é média móvel das chegadas: alcançou puxa
para 1, atravessou inteira puxa para 0. Converge para a **fração alcançada**, então a tela lê
literalmente "quanto do que passou por aqui teve alguém". Entra no `ESQUEMA_SAVE` com faixa
0..1 e padrão **1** — save adulterado cai no mundo inteiro, nunca no seco.

Ele move três coisas: a densidade da folhagem da frente (26% a 70% das casas da grade, mesma
grade e mesmo hash, então a mata **clareia** em vez de virar outra mata), o porte dessas plantas
(±16%), e um filtro CSS na camada da pintura (`saturate` 0,42→1,06, `sepia` 0,26→0, `brightness`
1,10→1,00). Só o `#fundoHD`: quem seca é a terra, não a personagem nem o que precisa de ajuda.
`worldHealth()` passa a ser multiplicado por `0,62 + 0,38·cuidado` — mas o efeito visível vem
das duas primeiras, porque com meta de 50 mil e conteúdo cabendo em 7,5 mil a rampa de
`worldHealth` mal sai do lugar dentro de uma partida.

Nada de número, mensagem, som ou vermelho: a resposta é do mundo. **Foi escolha do §2, não de
gosto** — nos três capítulos o que atravessa a tela é trabalho e é vida, e em Palmares quem
chega e você não alcança é gente. Descontar pontos por isso transformaria pessoas em recurso
perdido, que é exatamente o que o §2.2 proíbe.

**Legibilidade, medida em pixels.** Prints do mesmo quadro com o mundo congelado (o laço é
parado zerando o `requestAnimationFrame`, senão o rolamento afoga a medida), diferença média por
canal contra o mundo inteiro e fração de pixels que mudaram mais de 8:

| cuidado | plantas no quadro | dif. média | pixels alterados |
|---:|---:|---:|---:|
| 1,00 | 5 | — | — |
| 0,75 | 4 | 11,7 | 74% |
| 0,50 | 3 | 22,7 | 83% |
| 0,25 | 3 | 32,9 | 83% |
| 0,00 | 1 | 42,5 | 83% |

E o tempo até aparecer, sem tocar em nada: **0,94 aos 5 s · 0,54 aos 10 s · 0,33 aos 15 s ·
0,17 aos 20 s · 0,06 aos 30 s.** Voltando a atender, andando e segurando: **0,23 aos 5 s · 0,61
aos 10 s · 0,82 aos 15 s · 0,94 aos 25 s.** Simétrico e recuperável — não existe estado do qual
não se sai. `CUIDADO_ALFA = 0,18` é calibrado contra 35 chegadas/min; se a taxa mudar, ele muda.

**A renda mudou junto, sem ninguém tocar em fórmula de renda.** 300 s andando e segurando:

| | toque no vazio | o que atravessa a tela | folha |
|---|---:|---:|---:|
| antes (medida do produto) | 59% | **4%** | 37% |
| depois | 71% | **18,3%** | 11% |
| antes, com `u1` | — | **1%** | — |
| depois, com `u1` | 88% | **7,7%** | 4% |

**O que ficou frágil, e é o número que eu não consegui mover.** Andando e segurando o botão a
fração atendida é **1,00**, em qualquer densidade abaixo de 56 chegadas/min. A escolha existe
entre **andar e correr** (1,00 contra 0,67) e entre segurar e não segurar (1,00 contra 0,00) —
mas correr hoje não compra nada (o produto mediu 3% de diferença de renda, dentro do ruído), e
uma escolha cujo lado caro não paga nada não é escolha, é um botão que ninguém aperta. **Dar
motivo para correr é o que falta para a tensão morder**, e é decisão de dono. Os dois outros
caminhos medidos são densidade (56/min leva andando a 0,95, ao custo de uma rua cheia) e
encurtar o alcance de 80 px, que o §7 registra como deliberado e eu não mexi.

**Outra fragilidade:** `S.cuidado` atravessa a noite no save. Quem largou o jogo com o mundo
seco reencontra o mundo seco — 15 s de jogo desfazem, mas a primeira tela do dia 2 é a pior
possível. Uma volta em direção ao neutro enquanto se está fora resolveria; não fiz porque
mexeria no ganho offline, que é item próprio.

### 2026-08-05 · os capítulos ganham nome e falam antes de você jogar

**O pedido do dono, e ele é o coração do jogo:** contexto histórico não pode ficar escondido
numa tela de menu. A pessoa abre o jogo e, **antes de jogar**, recebe uma conversa que explica
onde ela está — caixa de diálogo de jogo antigo, referência dele: Pokémon. **O texto é dele,
palavra por palavra.** Nenhuma linha foi escrita, completada ou "melhorada na transição" aqui.

**As três épocas deixaram de ser números.** `ÉPOCA 1/2/3` virou `ANTES DA CHEGADA`,
`PALMARES` e `AINDA AQUI`, cada uma com um `quando` (lugar e século) e duas conversas: a
**abertura**, na primeira vez que se entra no capítulo, e o **fecho**, ao completá-lo.

**Onde esse texto mora, e por quê.** Numa estrutura própria, `EPOCAS`, ao lado de `MOMENTOS` e
`FONTES` — **nunca em `TEXTOS`**. As falas carregam 1500, 1630, 2022; `TEXTOS` é ficção autoral
e o smoke test falha se qualquer linha dela contiver dígito. As duas naturezas são diferentes e
misturá-las apagaria a regra que protege as duas. É o §2 com dentes, e ele continua de pé.

**Números da conversa,** medidos na página:

| capítulo | abertura | fecho | revelação da abertura |
|---|---:|---:|---:|
| ANTES DA CHEGADA | 4 falas · 454 car. | 4 falas · 370 car. | 8,2 s |
| PALMARES | 4 falas · 366 car. | 4 falas · 432 car. | 6,6 s |
| AINDA AQUI | 4 falas · 416 car. | 3 falas · 259 car. | 7,5 s |

A 18 ms por letra. **Toques por abertura: 4 se você deixa cada fala aparecer, 8 se você toca
por cima** — o primeiro toque completa a revelação, o segundo avança. Nunca se pula uma fala
sem querer, que é o motivo de a regra ser essa e não "um toque avança sempre".

**A altura da caixa não é um número escolhido, e não podia ser.** Medida a mesma fala em três
larguras: **5 linhas a 430 px, 6 a 390, 8 a 320**. Qualquer `min-height` erra numa das pontas, e
caixa que cresce letra a letra faz a moldura pular enquanto se lê. A solução é uma grade de uma
célula só com **todas as falas da conversa empilhadas invisíveis dentro dela**: a célula nasce
do tamanho da mais alta, exatamente, em qualquer largura.

**O nome não cabia onde o número cabia.** No chip do topo, espremido entre o impacto e os três
contadores, sobravam **73 px** para o rótulo e `ANTES DA CHEGADA` saía como `ANTES DA …`. O
rótulo desceu para a linha da barra de progresso — que é justamente o que ele nomeia — e agora
cabe inteiro nos três capítulos.

**Dois bugs que a tarefa achou de passagem, os dois vivos em produção:**

1. **O menu abria para todo mundo.** `if (!S.energiaTotal) abrirTela("telaMenu")` estava
   **acima** de `carregar()`, então `S.energiaTotal` ainda era 0 para qualquer save e quem
   estava no meio de uma partida caía no menu toda vez. A decisão desceu para depois da leitura
   do save. O `PRODUTO.md` cita essa linha e não pegou a ordem.
2. **Aparar não serve para máscara de bits.** `ESQUEMA_SAVE` só tinha `num`, que apara na
   faixa: um save com `aberturas: 999` viraria 7, isto é, **"já viu tudo"**, e trancaria o
   conteúdo histórico — a razão de o jogo existir — por causa de um save torto. Entrou o tipo
   `bits`: inteiro, dentro da faixa, ou o padrão 0. Fora da faixa erra para o lado de MOSTRAR.

**O capítulo 3 não tinha 100%, logo o fecho dele nunca falaria.** `proximoLimiar()` devolvia
`null` na última cena e a barra ficava cheia para sempre. `LIMIAR_FIM` é **derivado** do passo
plano que as outras cinco cenas já usam (`último + (segundo − primeiro)` = 9.000), não escolhido
à parte: se o passo mudar, ele muda junto. Não abre cena nova; só fecha a última, e é o que faz
a última fala do jogo existir. **Isto mexe em ritmo e é a única coisa aqui que o dono pode
querer rever** — o resto é conteúdo dele e interface.

**O que saiu:** `telaPonte`, `mostrarPonte()` e `ponteDepois`. A tela existia, era chamada com
`TEXTOS[n]` (vazio) e desenhava uma moldura em volta do silêncio — o `PRODUTO.md` a lista como
item 4 do backlog, dizendo que moldura vazia é pior que nenhuma tela. A caixa de fala ocupa o
mesmo lugar com o texto que faltava.

**A tela A HISTÓRIA** passou a agrupar os seis momentos por capítulo, com o mesmo nome que o
HUD mostra e a fala anuncia. Uma fonte só, `EPOCAS`, para os três lugares nunca discordarem.

**O teste aprendeu a conversa,** e não só a atravessá-la: JOGAR abre a fala, ela aparece letra a
letra (3 de 115 caracteres 60 ms depois de abrir), um toque completa a linha, a caixa fecha em 8
toques, e **não volta**. Mais a virada de capítulo (o fecho fala, a cena só troca depois dele, e
ele encadeia na abertura do seguinte), o fim do capítulo 3, e um save adulterado com
`aberturas: 99` e `fechos: "tudo"`. Smoke verde duas vezes seguidas, 61–62 FPS.

**O que achei frágil.** (a) A fala é a única coisa do jogo que **para** a partida, e o mundo
continua andando atrás — o impacto sobe enquanto se lê, e quem lê tudo chega ao fim do capítulo
com mais impacto do que quem pula. É pequeno hoje e cresce se as conversas crescerem. (b) O
retrato é `HERO_SPR.walk[0]`, um quadro de caminhada: a personagem "fala" de perfil, andando.
É a mesma pessoa que se joga, que era o pedido, mas uma pose parada de frente seria melhor e é
arte que não existe. (c) A abertura do capítulo 1 dispara no **JOGAR**, não no carregamento:
quem já tem partida em andamento e nunca viu a fala do capítulo em que está a recebe no boot,
o que é certo, mas é a única fala que aparece sem alguém ter apertado nada.

### 2026-08-05 · a rua vira lugar, e aí correr passa a significar alguma coisa

**Um erro de contagem que a medição achou, e ele estava em produção.** `dying` conta oito
quadros e zera dentro de `drawMobs()`, que marca `dead`; quem varre `dead` é o laço de
`atualizarMobs`, no quadro seguinte. Entre as duas coisas existe uma fresta — e o relógio do
segurar-pra-atacar (145 ms) não é o relógio do quadro. Um toque que caísse ali achava uma
chegada com `dying` 0 e `hp` 0, batia de novo e chamava `registrarChegada(true)` uma **segunda
vez pela mesma pessoa**. Medido: **19 alcances contados para 17 pessoas alcançadas em 30 s**,
12% de inflação em cima da média que o mundo lê — a mata ficava mais verde do que o cuidado
merecia. Uma condição no alvo (`m.dead || m.hp <= 0`) resolve, e o teste reproduz a fresta na
mão em vez de esperar dar sorte.

Duas sessões atrás o verbo virou **alcançar** e o mundo passou a responder. Ficou uma
fragilidade escrita com todas as letras no Diário: *"correr hoje não compra nada"* — 3% de
diferença de renda, dentro do ruído. Um dos três botões do jogo sem função.

**A causa não era o preço de correr, era a natureza da rua.** Chegadas e folhas nasciam de um
**cronômetro**. Quem corria atravessava o dobro de mata e encontrava exatamente a mesma gente,
com metade do tempo para cada uma: correr era desvantagem pura, e o botão só tinha razão de
existir se alguém gostasse de ver a paisagem passar rápido.

**A mudança é uma linha de ideia:** o que vem pela rua nasce por **distância percorrida**, não
por tempo. A rua deixa de ser um relógio e vira um **lugar**. `CFG.mobIntervalo` (1,8 s) virou
`CFG.mobVao` (69 px de mundo) e o vão entre folhas virou `34 + 84 px`; os dois números são a
conversão exata dos antigos pela velocidade da caminhada (38,26 px/s), então **andando a rua é
folha por folha e pessoa por pessoa a mesma de sempre**. Correndo é o dobro de gente no mesmo
minuto, com metade do tempo para cada uma.

**Medido no jogo de verdade**, 390×844, sem melhoria nenhuma, segurando o botão, 90 s por
célula, mesmo arnês nos dois lados (o "antes" é este mesmo arquivo com as duas somas devolvidas
ao relógio, para o A/B isolar só isto):

| | chegadas/min | fração alcançada | alcançadas/min | renda/min |
|---|---:|---:|---:|---:|
| **antes** · andar | 34 | 1,00 | 34 | 629 |
| **antes** · correr | 38 | 0,65 | 24,7 | **595 (−5%)** |
| **depois** · andar | 33–36 | 1,00 | 33–36 | 631–636 |
| **depois** · correr | 69–72 | **0,46–0,51** | 31–37 | **716–747 (+13 a +18%)** |

Correr saiu de **−5%** para **+13 a +18%** de renda, e a diferença não vem de "bater mais": vem
de atravessar o dobro de mata, o que dobra a folha apanhada (112 → 208–228 por minuto). O que
correr **custa** é metade da gente que apareceu ficar sem ninguém — e é o mundo, não o placar,
que cobra isso: `S.cuidado` estabiliza em 0,46–0,55 correndo contra 1,00 andando.

**A frase que alguém consegue dizer sem ver número**, que era o critério: *"andando eu alcanço
todo mundo e a mata fica inteira, mas passo por pouca gente; correndo passa o dobro, rende
mais, e metade fica sem ninguém — e a mata rala."* Medido em quanto tempo isso aparece, trocando
de ritmo em regime: a rua **enche em 6–8 s** (de 0,95 para 1,85–1,95 pessoas esperando na tela,
com picos de 3 e 4), e a folhagem responde a **9,1 s** (cuidado visto 0,90), **10,1 s** (0,75) e
**15,1 s** (0,50). A régua de legibilidade da sessão passada diz o que 0,75 já significa: 4
plantas na frente em vez de 5 e 74% dos pixels mudando. Dois prints do mesmo jogo, andando e
correndo, mostram a coisa inteira sem nenhum número na tela.

**O que NÃO mudou, de propósito:** as velocidades (`PASSO × 60 / n`, n = 10 e 5 — armadilha nº 1
do §7), `LIMIARES`, o alcance de 80 px, a paciência de 2,4 s, o valor de nada, e o
`ESQUEMA_SAVE`, que não ganhou campo porque a mudança não guarda estado novo.

**O que ficou frágil.**

1. **Andando, a fração continua 1,00.** Foi decidido, não esquecido: segurar o botão dá ~8,3 de
   dano por segundo e uma chegada custa 8,5 de vida em média, ou 1,03 s; a janela de alcance
   andando é 1,95 s. Há **quase o dobro de folga**, então nenhuma densidade plausível quebra o
   1,00 — o varrido da sessão passada já mostrou 46/min ainda em 1,00 e 56/min em 0,95, ao custo
   de uma rua que vira feira. Quebrar esse 1,00 exige mexer no **alcance de 80 px** ou na
   **paciência de 2,4 s**, e os dois foram escolhas medidas da sessão passada. Hoje o 1,00 deixou
   de ser "andar é de graça" e passou a ser o que andar **é**: cuidar bem de pouco, por menos.
2. **O toque no vazio ainda é 65% da renda** (414 de 631 por minuto, sem melhoria). Enquanto o
   botão pagar por ser apertado, e não por encontrar alguém, qualquer escolha sobre a rua move
   só a fatia de fora. O teto disso está medido: mesmo alcançando 100% das 72 chegadas de quem
   corre, o drop a 3 de impacto renderia 216/min. **Este é o item 1 do `PRODUTO.md` e ele não foi
   resolvido aqui.**
3. **`CUIDADO_ALFA` é por chegada**, então correndo a memória continua sendo ~5,5 chegadas e
   passa a valer ~4,5 s de relógio em vez de ~9 s. O equilíbrio continua sendo exatamente a
   fração alcançada nos dois ritmos; o que muda é a rapidez da resposta. Isso é desejável, mas
   é um segundo comportamento que ninguém escolheu explicitamente.

**Próximo passo:** o item 1 do `PRODUTO.md` — o que o botão paga. Enquanto ele pagar por ser
apertado, a rua é decoração cara.

### 2026-08-05 · a rua respira mais fundo, o galão para de flutuar, e o capítulo se apresenta

Três pedidos do dono, medidos um a um. Nada commitado — a worktree fica para ele revisar.

**1. Os itens esperam mais e chegam mais espaçados.** `CFG.mobEspera` 2,4 → **3,6 s** e
`CFG.mobVao` 69 → **78 px**, com a janela do sorteio virando `0,65 + rand × 0,7` (era
`0,45 + rand × 0,95`). A janela ficou **simétrica de propósito**: agora `mobVao` é literalmente o
vão MÉDIO, e não um valor de canto que ninguém sabia interpretar. A unidade continua sendo
**pixel de mundo** — devolver isto ao relógio desfaz o achado da sessão passada, e o smoke test
tem guarda para isso (razão de chão 2,00, razão de chegadas 2,01).

A queixa era "não aparece item tão rápido assim atrás do outro", e quem produz chegada colada em
chegada é o **fundo** da janela, não a média. O piso subiu 0,45 → 0,65: o menor vão sai de **31 px
(0,81 s de caminhada) para 51 px (1,33 s)**, +63%. O maior vão é 105 px (2,75 s).

Medido no jogo de verdade, 390×844, segurando o botão, 90 s por célula, duas amostras por célula:

| | chegadas/min | fração alcançada | fila média | pico |
|---|---:|---:|---:|---:|
| **antes** · andar | 34,7 | 1,00 | 1,10 | 3 |
| **antes** · correr | 68,7 | 0,63 | 2,04 | 4 |
| **depois** · andar | 29,3 e 30,0 | 1,00 | 0,91 e 0,99 | 2 |
| **depois** · correr | 55,3 e 56,0 | 0,67 e 0,65 | 1,57 | 3 e 4 |

**O que a medição respondeu e eu não sabia antes de medir:** espaçar as chegadas *deveria* ter
matado a tensão de correr, porque mais tempo por chegada é mais chance de alcançar cada uma.
Não matou — a fração correndo subiu só de 0,63 para 0,66, dentro de um passo de ruído. A razão é
que o gargalo de quem corre não é o vão entre chegadas, é o **dano por segundo contra a vida
média**: 8,3/s contra 8,5 de vida é 1,03 s de trabalho por chegada, e correndo chegam 0,93 por
segundo. Continua não cabendo. **Andar segue em 1,00 e correr segue deixando um terço para trás.**

**O que ficou pior, e foi escolhido:** a fila andando encostou em 1,0 (0,91–0,99), que é o piso do
varrido antigo — *"menos que isso e a rua é vazia"*. O pico andando caiu de 3 para 2: quase nunca
há três esperando. Foi por isso que a paciência subiu junto — menos gente, cada uma mais tempo no
quadro. Se ao jogar isso ler como rua deserta, o número a mexer é o `mobVao`, não a janela.

**O teto da paciência é geométrico e vale registrar:** parada em sx 152, a pessoa é levada para
fora do quadro (sx −24) em **4,6 s** de caminhada. Paciência acima disso deixa de existir —
ninguém desistiria, todo mundo só sairia de cena de pé. 3,6 s a deixa em **sx 14** quando o
relógio acaba: ainda no quadro, ainda dentro do alcance, então desistir continua sendo uma coisa
que se vê acontecer, que era a razão de o número ser 2,4.

**2. Só voa o que faz sentido voar.** `MOB_LIFT` já estava certo — só o cacho de fruta do
capítulo 1 tem levitação, e ele é a única das nove vagas que já vem pendurada no próprio desenho,
com o galho dentro do quadro. **O que estava errado era o `bob`**, um pisca-pisca de 1 px aplicado
a *todo mundo*, resto do motor antigo, onde tudo que atravessava a rua era fumaça.

Medido espionando o `drawImage` de verdade (não relendo a fórmula), 2 s por objeto, `dy` máximo
menos mínimo:

| | cap 1 | cap 2 | cap 3 |
|---|---|---|---|
| **antes** | fruta **7 px** · muda 1 · peixe 1 | mandioca 1 · pote 1 · cesto 1 | muda 1 · galão 1 · cesto 1 |
| **depois** | fruta **7 px** · muda 0 · peixe 0 | mandioca 0 · pote 0 · cesto 0 | muda 0 · galão 0 · cesto 0 |

1 px de mundo são 2,4 px de tela neste viewport, a 3,75 Hz. Um pote de barro, um cesto e um galão
de 20 L vibrando não leem como magia, leem como bug. Decisão objeto por objeto, olhando a arte:
**flutua** o cacho de fruta (cap 1, pendurado no galho); **não flutuam** muda com torrão, três
peixes, feixe de mandioca, pote de barro, cesto de raízes, muda em vaso, galão e cesto de legumes
— tudo coisa colhida, carregada ou pousada. Prints em `shot-obj-cap{1,2,3}-{antes,depois}.png`.

**3. O capítulo apresenta os próprios itens.** Uma linha nova ao fim de cada `abertura`, porque
quem entrava via fruta, peixe e muda passando sem nenhuma explicação — o buraco dos primeiros
cinco minutos que o `PRODUTO.md` aponta.

- cap 1: *"Pela mata vem cacho de fruta no galho, peixe e muda de plantar — três coisas diferentes,
  e cada uma enche um contador lá em cima. Folha solta no ar também conta, mas essa só cai para
  quem pula."*
- cap 2: *"Muda a paisagem e muda o que vem por ela: feixe de mandioca, pote de água e cesto cheio.
  São os mesmos três contadores do capítulo anterior, com outras coisas dentro."*
- cap 3: *"Pela estrada vem muda de plantar, galão de água e cesto de legumes — as mesmas três
  coisas do começo, com a cara de agora."*

**A regra sob a qual foram escritas, e ela vale para quem mexer nelas depois:** a linha
**descreve o que está na tela** — o objeto que vem pela rua e o contador que ele enche — e **não
afirma fato histórico novo**. Nenhuma delas diz o que um povo comia, plantava ou usava; isso é
afirmação com procedência e exige fonte no `NOTES.md` (§2). Por isso "cesto cheio" e não "cesto de
farinha". Elas foram escritas por agente, não pelo dono, e essa é a única exceção ao aviso de que
o texto de `EPOCAS` é dele palavra por palavra — o aviso agora carrega a exceção e a regra.

Medido na tela: caixa de 230–256 px de altura, texto inteiro visível, nada cortado, nada fora da
tela em 390×844. Prints em `shot-fala-cap{1,2,3}.png`.

**Ferramentas que ficaram** (não commitadas): `test/medir-rua.js` (fração, chegadas/min, fila
média e pico, andando e correndo), `test/medir-flutuacao.js` (quanto cada objeto sobe e desce,
espionando o `drawImage`), `test/shot-objetos.js` (os três objetos de cada capítulo lado a lado).

**Dúvida nova.** A fila andando em 0,95 e o pico em 2 são exatamente a borda do "rua vazia" do
varrido antigo. Ninguém mediu se rua mais rala **lê como calma ou como abandono** — é a diferença
entre o pedido ter sido atendido e o pedido ter sido cumprido ao pé da letra. Próximo passo:
jogar os dois e decidir com o dono, ou medir tempo até o primeiro tédio.

### 2026-08-06 · a pessoa de Palmares ganha salto e alcance, e a corrida continua sem apoio

**Primeiro a conferência que era a razão de a tarefa existir.** As três folhas do capítulo 2 que
tinham voltado erradas — `correr`, `pular`, `alcancar` — chegaram refeitas. Abri as quatro folhas
do capítulo lado a lado antes de cortar qualquer coisa. As novas trazem **cabelo crespo, túnica
creme sem manga, calça na altura da panturrilha, sandálias e cinto/faixa** — a mesma pessoa que a
folha de caminhada carrega. Nenhuma tanga branca, nenhum colar de contas, nenhuma braçadeira,
nenhum pé descalço, que era a figura do capítulo 1 que as versões anteriores desenhavam. As
antigas ficam como `*.ERRADA.png` e não entram em nada.

**A grade anunciada no pedido mentiu nas três.** Os `.txt` diziam `4x3` (corrida), `3x2` (salto) e
`4x1` (alcance). As imagens têm **8 poses em 4x2**, **5 em 5x1** e **5 em 5x1**. Contei as manchas
com o `validar-folha.js` sem passar grade — 8, 5 e 5, zero fragmento nas três. Passar a grade do
pedido não daria erro nenhum: o cortador reparte a faixa em células erradas e devolve quadros com
duas metades de pessoa. Ficou escrito no `test/LEIAME.md`.

**Escala: medir pela MEDIANA da cabeça, nunca pela média.** A personagem é desenhada com a escala
da CAMINHADA (`heroScale` = 44 / altura do quadro de walk), então toda folha que não seja a de
caminhada tem de ser reamostrada para o mesmo corpo. A cabeça é a única medida que não muda com a
pose — mas um braço esticado ou um tronco inclinado entra no quinto superior e infla o número:

| folha | cabeça por quadro | mediana | fator | quadro final |
|---|---|---:|---:|---|
| caminhada (referência) | 61 · 61 · 61 | 61 | — | 191×323 |
| salto | 88 · **110** · 90 · **105** · 88 | 90 | 0,6778 | 280×285 |
| alcance | 93 · *201* · *215* · 93 · 91 | 93 | 0,6559 | 303×279 |
| corrida | 90 · 90 · 90 · 89 · 87 · 85 · 85 · 88 | 88 | 0,6932 | 363×263 |

O 110 e o 105 do salto são ombro e braço nas poses inclinadas; o 201 e o 215 do alcance são o
braço esticado, e para esses vale a medida "corrida" do `validar-folha.js` (maior trecho sem
buraco), que dá 91–94. Depois de reamostrar, salto e alcance medem **61**, igual à caminhada: a
mesma pessoa, do mesmo tamanho, nas três folhas.

**A ordem do alcance termina em repouso.** `--quadros=2,3,4,5,1`: esticar o braço, esticar fundo
no avanço, receber a coisa na mão, abraçar, voltar ao parado. É a mesma lógica do `2,3,4,1` do
capítulo 1 — a animação toca uma vez por toque, então a pose neutra vai por ÚLTIMO, senão o gesto
começa parado e congela segurando o objeto. O salto sai na ordem da folha (agachar, impulso,
recolher no ápice, descer, aterrissar), que já é a ordem certa, com compressão 0 porque o arco
quem desenha é o código.

**Escorregamento.** Salto e alcance não são puxados por distância — o quadro sai do relógio do
pulo e do toque —, então não há escorregamento a medir neles; o que precisava valer é a sola
encostando na borda de baixo do quadro (`HERO_PISO = 0`), e vale nos dez: compressão 0 põe a tinta
mais baixa de cada pose na linha comum e o `reescalar.js` alinha por baixo. A caminhada do
capítulo 2 não foi tocada e continua nos calcanhares 135/80/25, laço 165, `PASSO = 7,492`,
`n = 12`, **0,00%**. Remedindo com o meu limiar de sola leio 135/81/23, que dá 5,6% — a diferença
é de 1 a 2 px de sprite, 0,27 px de mundo, ou seja ruído de limiar e não desacordo. Fica
registrado para ninguém "corrigir" o número gravado com base numa releitura.

**A corrida do capítulo 2 NÃO se salva, e a razão não é a pessoa.** A folha passa em tudo que
reprovou a do capítulo 1: mesma figura nas oito poses (cabeça CV 2,3%, amplitude 5,7%), zero
fragmento, e variação de altura de **11,2%** contra os 17% da do capítulo 1 — e essa variação
aqui é legítima, é o corpo encolhendo no recolhimento, não degrau de grade. O que falta é
**apoio**:

| | caminhada (no jogo) | corrida cap 2 |
|---|---:|---:|
| poses com sola chapada | 2 de 3 | 3 de 8, e duas são a mesma fase |
| percurso do calcanhar | 112 px de sprite = 15,3 de mundo | 24 px = 3,3 de mundo |
| passo | 22,5 px de mundo | ~31 px de mundo (abertura máxima 247 contra 181) |
| **pé plantado** | **68% do passo** | **11% do passo** |

Ligar essa folha faria o pé arrastar 90% do passo. E ainda haveria a segunda metade do problema,
que é do motor e não da arte: `velocidadeMundo()` usa o **mesmo** `passo` para andar e correr e só
dobra a cadência — correr é a caminhada apressada. Uma folha de corrida de verdade exige um
`passoCorrer` por capítulo dentro do `PASSO_CAP`, com `n` inteiro em cada um (armadilha nº 1 do
§7). É sessão própria, exatamente como a sessão de 2026-08-05 já tinha concluído para o capítulo 1.

**Números.** `index.html` 2,95 → **3,03 MB** (+80 KB: 69 de salto, 81 de alcance, embutido duas
vezes porque `atk1_2` e `atk2_2` compartilham a mesma folha, como nos outros capítulos). `npm test`
verde, 61 FPS, zero erro de console nas três eras. Prints por era em
`tmpart/era{1,2,3}-{anda,alcanca,ar}.png`.

**Ferramentas que ficaram** (em `tmpart/`, não commitadas): `medir-sola.js` (altura, sola,
calcanhar e discordância de silhueta quadro a quadro de um `.json` recortado — é a régua que
escolhe quadros), `medir-pes.js` (abertura entre os dois pés, que dá o comprimento da passada),
`folha-png.js` (os quadros de um `.json` lado a lado numa PNG, com a linha de chão), `shot-eras.js`
(um print por era em três estados).

**Dúvida nova, e é do dono.** O alcance do capítulo 2 termina com a pessoa **abraçando um objeto
redondo** — uma coisa que ela recebeu. No capítulo 1 o mesmo gesto era colher. Em Palmares, o §2.2
diz que alcançar é **acolher quem chega**, e quem chega é gente, não objeto. O gesto desenhado
continua sendo "receber uma coisa", e o `NOTES` de 2026-08-05 já tinha marcado essa trava. Não é
erro da folha nova — ela faz o que foi pedido — mas a pergunta de representação continua aberta:
em Palmares, o que a mão da pessoa recebe?

### 2026-08-06 · Palmares: quem chega é GENTE, e quem é acolhida anda com você

Executando a decisão do dono registrada aqui desde o começo — *"aqui, alcançar é acolher; quem
chega vem ficar"*. Até hoje o capítulo 2 tinha cesto, pote e feixe atravessando a tela, o que
fazia dele mais um capítulo de colher coisa. Agora, e **só no capítulo 2**, o que atravessa a
tela é uma pessoa; os capítulos 1 e 3 não mudaram um pixel.

**O §2.2 é quem desenhou isto, não o gosto.** O que ele proíbe, e o que sobrou depois de tirar:

| a regra | o que saiu do capítulo 2 | o que ficou no lugar |
|---|---|---|
| pessoa não é coisa a coletar | nada — ninguém é recolhido do chão | o drop continua sendo o que ela **trouxe**: feixe, pote, cesto |
| pessoa não vira número | contador, placar, tela de resumo | o **grupo na tela** é a recompensa inteira |
| barra de vida sobre gente conta pancada | `desenharVidaMob` não é chamada | o **chão** se enche de luz enquanto você chega até ela |
| nada de sinal de aflição | pisca branco, estilhaço, empurrão de 10 px | dois pontos de luz morna subindo por alcance |
| quem não é alcançada não é punida | nada mudou aqui | segue caminho e sai de quadro; responde `S.cuidado` |

**A fila.** Alcançada, a pessoa **vira** — deixa de vir na sua direção e passa a ir com você — e
anda a 0,55× da velocidade dela até a rua a deixar cair no lugar dela; daí em diante as duas
andam no mesmo passo. Cabem cinco (`GRUPO_MAX`); quando chega a sexta, a que está na frente
segue a 0,42× e fica pela serra. Ninguém desaparece e ninguém para: **todo estado da fila tem
velocidade própria e nenhum tem zero**, porque o quadro do sprite é escolhido pela distância
percorrida e uma figura parada em pose de caminhada é a armadilha nº 1 do §7 por outro ângulo.
A passada de cada uma é multiplicada pela altura dela — pessoa mais baixa, passo mais curto.

**Arte: nenhuma nova, e nenhum matiz mexido.** É a folha do capítulo 2 (`HERO_CAP_B64[1]`).
Quem chega vem **espelhada**, virada para a esquerda, andando na caminhada; parada esperando,
usa `atk1` quadro 3 — a pose de pé segurando o que trouxe, que é gesto de espera e não de
aflição. A única variação entre as figuras é a **altura, 0,82 a 0,95 da protagonista**. A
primeira faixa foi 0,88–1,02 e saiu errada em duas contas: metade do grupo ficava mais alta que
quem se joga, e a protagonista tem de manter margem sobre tudo que está na tela. Matiz foi
descartado de propósito: sortear tom de pele para "variar" é a versão em código de tratar
pessoas como textura.

**Medido**, viewport 390×844, capítulo 2, 30 s por linha:

| | chegadas/min | fração acolhida | fila média | fila cheia em | FPS |
|---|---:|---:|---:|---:|---:|
| andando, sem tocar | 26 | 0,00 | 0 | — | 60 |
| andando, segurando | 28 | **1,00** | 3,74 | 12,0 s | 60 |
| correndo, sem tocar | 54 | 0,00 | 0 | — | 60 |
| correndo, segurando | 56 | **0,68** | 4,15 | 9,5 s | 60 |

Os 0,68 correndo batem com os 0,66 já gravados para a rua antiga: **a economia não mudou**.
`m.hp` continua 5/8/13, o drop continua saindo no mesmo lugar e com o mesmo valor, e nada em
`LIMIARES`, `PASSO_CAP`, no alcance de 80 px ou na paciência de 3,6 s foi tocado. **Ao fim de
qualquer capítulo 2 a fila está em 5** — ela satura em 10 a 12 s e passa a ser um fluxo com
troca, não um saldo que cresce.

**O grupo não atrapalha ler o que vem.** Ele fica atrás da protagonista, na quarta parte
esquerda da tela (`HX` = 26% de `W`), e as chegadas nascem na borda direita: os dois nunca
disputam o mesmo espaço. A quinta figura sai pela borda esquerda, o que lê como "tem mais" e
não como corte.

**Estado novo:** `S.grupo`, no `ESQUEMA_SAVE`, `num` 0..5, padrão 0. É o tamanho da fila
visível, nunca um total — e é **remontado**, não guardado: o save carrega quantas, e lugar,
altura e fase da passada nascem de novo em `semearGrupo()`. Save adulterado com 900 não põe
novecentas figuras na tela. O `test/smoke.js` cobra a chave nova na lista de campos gravados.

**Texto.** A última linha da abertura do capítulo 2 apresentava os objetos e virou mentira:
agora diz que vem gente, que quem você alcança passa a andar com você, e que o que ela trazia
fica no chão. Descreve a tela e a mecânica, não afirma história — a regra estreita dessa linha
continua valendo.

**A dúvida da sessão passada está respondida.** "Em Palmares, o que a mão da pessoa recebe?" —
recebe o que quem chegou trazia. A pessoa não é recebida: ela passa a andar junto.

**O que ficou frágil, e é do §2, não do código:**

1. **Alcançar continua sendo o mesmo gesto de bater.** É o combo de cinco, com dano dobrado no
   quinto tempo, e por baixo é `m.hp -= dmg`. Tirei toda a gramática visível de combate, mas o
   verbo do motor continua sendo golpe, e quem lê o código lê isso. Trocar o nome em trinta
   lugares não muda um pixel; trocar o GESTO é sessão própria, e é decisão do dono.
2. **A quinta batida do combo alcança 96 px e vale dobrado.** Sobre gente isso é um golpe forte,
   e a arte dele é a mesma dos outros quatro. Não mexi porque mexer altera economia.
3. **Quem desiste e volta a andar não tem leitura de progresso**, porque o anel só existe para
   quem está parada. Acontece pouco (a paciência de 3,6 s quase sempre acaba fora do alcance),
   mas existe.
4. **A fila satura em cinco.** Cinco é o que cabe atrás dela em 390 px; acima disso as figuras
   saem de quadro sem serem vistas. É honesto, mas quer dizer que depois dos primeiros 12 s a
   recompensa de acolher é a fila TROCAR, não CRESCER.

**Próximo passo:** decidir com o dono se o gesto de alcançar em Palmares continua sendo o combo
de golpe (item 1 acima). É o único ponto do capítulo em que a mecânica ainda fala uma língua
diferente do que a tela mostra.

### 2026-08-06 · travessia + lugar vivo, fase 1 no capítulo 2 (worktree, para integrar)

Os passos 1, 2 e 3 da ordem de implementação do `JOGABILIDADE.md`, só no capítulo 2:

**1. Marcos no chão.** Três placas de madeira fincadas na estrada de Palmares — objetos do
mundo na camada 1:1 dos drops, nunca paralaxe nova. Cada uma materializa um momento que JÁ
existe na LINHA_TEMPO (vão XVI→XVII, `cena: 2`): O açúcar, A travessia forçada, A guerra que
abriu a serra — a última com o sujeito em quem resistiu, critério do historiador. Alvos
derivados dos LIMIARES (25/50/75% do vão de impacto do capítulo: 3.750, 4.500, 5.250);
economia intocada. A placa entra pela direita quando o alvo bate, e chegar nela (um corpo à
frente, `HX+24` — no `+8` a caixa de fala cobria a placa, medido no print) abre a fala curta
do momento. `S.marcos` (bits, padrão 0 = fala de novo, nunca cala) no ESQUEMA_SAVE. HUD:
`#marcoDist`, "MARCO EM N PASSOS" — N é distância medida ÷ `PASSO_CAP.passo`, o mesmo dado
que escolhe o quadro do sprite; some quando não há placa vindo.

**2. `S.acolhidos` por época.** Uma posição por época (tipo `lista` novo no esquema: tamanho
fixo `EPOCAS.length`, elemento a elemento em 0..9999 — teto derivado: uma chegada a cada
≥51 px de mundo ⇒ 9999 acolhidas ≈ 510 mil px ≈ 1,8 h de corrida contínua; acima é save
adulterado). `acolherPessoa()` incrementa a época atual. A FAIXA FINAL (últimos 20% do vão
de impacto, ou capítulo já fechado) desenha até **6** acolhidas vivendo ali — pose parada de
quem segura o que trouxe, ou passos curtos com quadro por distância (figura parada em pose
de caminhada é a armadilha nº 1 vista de outro ângulo). Excedente vira texto no chão
("E MAIS N VIVEM AQUI", preso ao quadro — na primeira versão cortava na borda, medido no
print). Ninguém vira multidão-textura.

**3. Tela de retorno.** `mostrarRetorno()`: papel de campo (mesmo material da caixa de fala)
ao voltar com >60 s fora. Só números da economia real: tempo medido, dia N × bônus
`bonusDias()` que já existia, fila salva (`S.grupo`), acolhidas salvas. Não há produção
offline nesta economia e a tela NÃO inventa uma — diz que a estrada esperou. Fecha num
toque. Substitui a tira `#offline`, que ainda falava a língua do tema anterior ("AWAY",
"the neighbourhood"). O aviso antigo saiu do `carregar()`.

**Medido:** smoke verde, FPS 62 (igual ao patamar anterior). `index.html`: 3.859.391 →
3.877.444 bytes (+17,6 KB, só código/CSS — nenhuma imagem nova; as placas são retângulos
nos tons da moldura do papel). Prints a 390×844 dsf2 na raiz do worktree: `V-marco-antes.png`
(placa + indicador), `V-marco.png` (fala aberta com placa em quadro), `V-faixa.png`
(6 figuras + "E MAIS 3"), `V-retorno.png`. Gerador: `prints-fase1.js` na raiz.

**O que ficou frágil:** (a) a placa continua rolando sob a fala aberta (o mundo não para —
decisão antiga) e sai de quadro em ~3 s; se a fala do capítulo estiver aberta na hora, a
placa passa SEM falar e é semeada de novo — auto-restaurável, mas alguém pode ver a mesma
placa entrar duas vezes. (b) A faixa final repovoa à frente enquanto a condição vale: o
"lugar" é uma faixa contínua, não um ponto — leitura certa para o idle, mas significa que
não existe UM lugar fixo no mundo. (c) O teto 9999 de acolhidos é derivação de rua, não de
design — se um capítulo futuro mudar o vão das chegadas, rederivar. (d) `marcoDist` divide
a linha com a barra da época; com nome de capítulo comprido pode apertar em telas <360 px.

**Próximo passo (passo 4 do JOGABILIDADE.md):** medir — tempo de sessão e volta-no-dia-2
mudam com marcos+faixa? Só depois estender aos outros capítulos.

### 2026-08-07 · o turno da noite: o jogo aprende a ensinar e a esperar

Dez horas autônomas enquanto o dono dormia. Oito publicações, `main` verde o tempo todo.

**Feito:** decisões da noite registradas → mesa com os 8 pedidos de SALVADOR → desenho
técnico da jogabilidade (`JOGABILIDADE.md`) → 5 marcos pré-1500 na linha do tempo, com a
regra de nomear pela obra → motor N-capítulos (capítulo virou objeto em EPOCAS + arte) →
lugar vivo fase 1 (marcos de história NA estrada, S.acolhidos persistente, tela do dia 2)
→ usabilidade 10/10 (a revisão fria achou dez; todos fechados no mesmo turno).

**Medido:** FPS 61–62 em todas as integrações; peso 3,9 MB (teto 3,6 estourado — a
comparação 660px×master é a primeira tarefa visual da manhã); +43 KB de código somados
na noite, zero imagem nova.

**Lente usada:** volta-no-dia-2 (a tela de retorno e os marcos na estrada são exatamente
isso) e primeiros-cinco-minutos (as microdicas). As duas lentes que as decisões do dono
apontavam.

**O que quebrou:** o smoke esperava barra de vida cheia desenhada — era o comportamento
que o achado nº 1 derrubou; o teste inverteu a expectativa e agora cobra o contrário.

**Dúvida nova:** o véu do menu é mais claro que o das telas de leitura e o brightness
.42 do herói é único — calibrado no olho para o menu; se alguma tela nova tiver véu
muito diferente, recalibrar.

**Próximo passo:** o da RETOMADA — mesa, Salvador, peso, estender o lugar vivo.

### 2026-08-07 · manhã: três respostas do dono viram três fatos

1. **Salvador**: ele vai gerar as 8 imagens da mesa. O capítulo 4 entra quando chegarem.
2. **O capítulo Tupinambá chama-se PINDORAMA** — critério dele: nome tirado de
   referências com bibliografia indígena. *Pindorama* é o nome de origem tupi para esta
   terra ("região das palmeiras"), registrado em Eduardo Navarro, *Dicionário de Tupi
   Antigo* (Global, 2013), e vivo no uso contemporâneo do movimento indígena — Ailton
   Krenak o usa nomeando o país anterior à invasão. O capítulo deixa de se definir pela
   chegada dos outros e passa a se chamar pelo nome que a terra já tinha. (O smoke test
   não verifica nome de época; conferido no print.)
3. **Marajó fica como MARCO** na linha do tempo ("gostei" à recomendação do historiador).

### 2026-08-07 · os botões falam uma língua só

Gramática escrita no CSS e aplicada ao jogo inteiro: MADEIRA = coisa posta no lugar
(navegação, telas, PULAR); PEDRA = ferramenta de jogo (rodapé, MELHORIAS, nichos);
OURO = exclusivo da única ação principal. Estado nunca troca o material — troca o valor
e a tinta. O rodapé perdeu as quatro cores; MELHORIAS perdeu o último painel de
aplicativo; "×" entrou na fonte bitmap.

**Mudança de comportamento junto (não só visual):** `podeComprar` contava o u4 de teste
(grátis, oculto), então MELHORIAS acendia SEMPRE — agora só conta as três da loja real.
O aceso passou a ser honesto. ~90 linhas de CSS morto do motor antigo saíram.
### 2026-08-07 · Direção de Evolução, onda 1: o mundo ganhou dia (worktree, para integrar)

Papel novo (mandato do dono, §8 do CLAUDE.md): a visão vive no `DIRECAO.md` novo — o
diagnóstico de "por que lê como velho", 7 princípios, o roteiro de ondas, e o que foi
avaliado e rejeitado (grain, scanlines, paralaxe nova). Esta entrada é a onda 1.

**O achado que pagou o sprint:** o motor tem um dia completo (`HORAS`, `luzDoDia`, ciclo
de 30 min) e as pinturas HD — que hoje cobrem o quadro inteiro — eram cegas a ele. O jogo
inteiro vivia num meio-dia eterno; era ISSO o "estático" que o dono sentia.

**Feito (tudo código, zero imagem nova):**
1. A hora chegou à pintura: valor via filtro CSS em `lavarFundo` (piso 0,24 — a leitura do
   chão manda), tinta via gradiente vertical no canvas (`luzDaPintura`), dose crescendo com
   `escuridao()` para a noite fechar de verdade.
2. A hora chegou à personagem (`aplicarHoraHeroHD`): dois fillRect `source-atop` na camada
   dela — pisos da direção antiga (valor no máx. 1/3 de volta, tinta a 80%) — cobrindo
   protagonista, gente do cap. 2 e vegetação de frente juntas.
3. A hora chegou à camada de jogo (`aplicarHoraScene`): SÓ valor, piso 0,5, azul-quase-preto
   — sinal de jogo não toma tinta, mas um drop branco não pode ser a coisa mais clara da
   NOITE (o defeito medido dos pips, invertido).
4. O relógio nasce da hora real do aparelho (`semearRelogio`, por âncoras: 5h→MANHÃ,
   11h→TARDE, 16h→PÓS-CHUVA, 19h→NOITE). Abrir à noite abre a mata à noite. Nada entra no
   save. `window.setHora(f)` para testes e prints.
5. Vida ambiente na camada da pintura: vaga-lumes ao anoitecer e poeira de sol de dia,
   contagem escalando com `cuidadoVisto` — o cuidado aparecendo no ar. Atrás do #scene:
   os leitores de pixel do smoke não veem.
6. Floats com física: impulso que decai exponencialmente + fade-in curto, em vez de
   0,7 px/quadro constante.
7. A virada de era varre ~1 hora de luz em ~2 s (`saltoHora`, consumido no frame loop a
   220 s/s) — atravessar o tempo agora É a transição. Medido: 453 s de relógio em 2,6 s.
8. Vinheta de canvas quase invisível (0,15 nos cantos, só na camada da pintura) e glint de
   ouro na barra de época (CSS, a cada 7 s, só na parte preenchida).

**Medido:** FPS 59 → 62 (smoke, três rodadas verdes); `index.html` 3.886.531 → 3.904.743
bytes (+17,8 KB, só código); prints `E-antes-*` / `E-depois-*` na raiz do worktree
(geradores: `prints-evolucao.js`, `prints-horas.js`, `verifica-onda1.js`). O smoke não
depende de hora: as checagens de pixel são por alpha no #scene e os passes novos não criam
pixel onde não há (`source-atop`).

**O que ficou frágil:** (a) mobs/NPCs/drops do #scene tomam só VALOR, não tinta — matiz de
meio-dia sob luz de noite; é a onda 2. (b) O topo do céu pintado na NOITE ainda guarda uma
faixa clara (base ~230 de luma sob tinta 0,54) — reavaliar quando a onda 2 calibrar por
capítulo. (c) As frações puras de hora são os INÍCIOS (0 / 0,25 / 0,5 / 0,75):
`horaAgora()` mistura ao longo da hora inteira — print de hora "pura" se tira no início
dela. (d) O véu do menu escurece o mundo já escurecido pela hora: à noite o menu fica
bem escuro — no print leu bem (o poste é opaco), mas é o lugar a recalibrar se reclamarem.

**Próximo passo:** onda 2 do `DIRECAO.md` — a hora alcançar os sprites do #scene com tinta,
e calibrar entardecer/noite por capítulo, print a print.
### 2026-08-07 · menos itens conforme o jogo anda: medido, raleado, medido de novo

Pedido do dono de manhã: *"menos itens no jogo conforme ele anda"*. Antes de tocar em
qualquer spawn, a afirmação foi medida (lente MEDIR): `test/medir-poluicao.js`, novo,
conta objetos simultâneos visíveis (chegadas vivas + drops + folhas + floats + placa)
por capítulo, andando e correndo, segurando o botão dourado, upgrades na progressão real
(cap 1 = u1 · cap 2 = u1+u2 · cap 3 = u1+u2+u3), estado a 85% do vão do capítulo.

**ANTES (média · pior · renda/min · médias por categoria):**

| célula | média | pior | renda/min | floats | folhas | mobs | drops |
|---|---|---|---|---|---|---|---|
| cap1 andando | 8,26 | 11 | 1373 | 4,92 | 2,02 | 0,84 | 0,48 |
| cap1 correndo | 8,78 | 11 | 1484 | 5,19 | 1,65 | 1,77 | 0,18 |
| cap2 andando | 8,18 | 11 | 1471 | 4,93 | 1,78 | 0,89 | 0,58 |
| cap2 correndo | 8,83 | 12 | 1588 | 5,18 | 2,05 | 1,36 | 0,25 |
| cap3 andando | 8,35 | 11 | 1856 | 5,02 | 1,79 | 0,81 | 0,73 |
| cap3 correndo | 8,91 | 11 | 1983 | 5,24 | 1,85 | 1,51 | 0,31 |

Os dois maiores contribuintes, de longe: **floats de número** (~5 simultâneos, 60% da
poluição — segurando a 7 golpes/s, cada golpe empilha um "+N" de 40 quadros sobre a
heroína) e **folhas** (~1,8–2,0, pico 4). Mobs e drops já são baixos e bem regulados —
teto por categoria não moveria o número, e em Palmares cortaria GENTE (§2): descartado.

**O raleio, guiado por isso (duas mudanças, ambas em `src/jogo.ts`):**

1. **Float do toque coalesce com u1 comprado.** Quem já entendeu que golpe paga não
   precisa reler "+3" sete vezes por segundo: os toques em sequência alimentam UM float
   que acumula a soma e renova a vida (28 quadros; ele sobe ~18 px e segura, para não
   sair da tela ainda vivo). Sem u1 — os primeiros minutos — cada toque segue com o
   próprio float: é assim que se aprende a economia. Renda: zero mudança por construção.
2. **A mata raleia por capítulo.** O vão sorteado entre folhas multiplica por
   `1 + 0,5 × época` (cap 1 ×1 — a mata de sempre, e é o capítulo-referência; cap 2
   ×1,5; cap 3 ×2). Continua DISTÂNCIA, nunca relógio. O valor da folha sobe pelo MESMO
   fator: metade das folhas valendo o dobro é a mesma renda por quilômetro para quem
   pula — menos coisa na tela, nada tirado de ninguém.

**DEPOIS (mesmo protocolo):** cap1 4,49/5,32 (pior 6–7) · cap2 3,72/4,53 (pior 6) ·
cap3 3,74/4,22 (pior 6). A média caiu ~45–55% e agora DESCE conforme o capítulo sobe,
que é literalmente o pedido. Renda/min: 1384/1485 · 1447/1559 · 1818/2050 — variação
de −2,0% a +3,4% contra o antes, dentro do ±10% exigido (ruído do sorteio de mobs).

**Smoke atualizado junto:** cobra 1 float segurando com u1 (e 10 sem u1), vão de folha
~×2 no cap 3 com valor compensando no mesmo fator. Prints `D-cap{1,2,3}-{antes,depois}.png`
na raiz — o antes é uma pilha ilegível de "+3"; o depois é um número somando.

**O que NÃO se fez, e por quê:** teto de simultâneos (mobs/drops já baixos; em Palmares
seria cota de gente), espaçamento de mob por capítulo (mobs não são o problema — média
≤1,8), partículas (não estavam na queixa; 2 px de lado, leem como textura). Se a
poluição voltar, o instrumento fica: `node test/medir-poluicao.js index.html 45 prefixo`.
### 2026-08-07 · Direção de Evolução, onda 2: a hora alcança quem anda na rua (worktree)

As duas frentes que a onda 1 deixou apontadas, executadas com medição antes/depois
(`prints-onda2.js`, novo, na raiz do worktree — 6 pinturas × TARDE/NOITE puras via
`setHora`, luma por banda do `#fundoHD` e cor média de um mob no `#scene`).

**1. A tinta da hora nos sprites do `#scene`.** A camada de jogo tomava só VALOR
(decisão certa para sinal), então folha, mob e drop ficavam com matiz de meio-dia sob
céu de noite — medido: cacho de fruta à NOITE em RGB 136,119,65, R−B = 71, mais quente
que o próprio entardecer. A separação sinal×coisa agora é por MOMENTO DO DESENHO, não
por camada: um passe `source-atop` (tinta a 80% da dose do mundo, a mesma da
personagem) roda logo depois de `drawMobs()`, quando o canvas só contém folha + mob +
sombra; magia, faísca, float, barra, anel e texto desenham DEPOIS e continuam sem
tinta. O que desenha tarde e é coisa do mundo entra por outra porta: o item do drop
por cópia cacheada (`spriteComHora`, invalidada no passo de hora, 120/dia), a placa
de marco por cor cacheada (`tintaCor`). VALOR continua vindo só do passe final —
dar valor no meio seria pagar duas vezes. DEPOIS: mob à noite em 141,130,99, R−B = 42.

**2. O teto do céu, por pintura (`CEU_PINT` + campo `teto` em `HORAS`).** Cinco das
seis pinturas guardam uma faixa clara no alto (névoa de horizonte, praia, céu lavado)
que à NOITE seguia sendo a coisa mais clara do quadro — a fragilidade (b) da onda 1.
Régua: razão topo (0–10% da altura) ÷ céu (10–30%); céu noturno brilha de baixo, então
a razão certa é ≤ ~1,1. Medido por pintura, NOITE:

| pintura | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| ANTES  | 1,45 | 0,89 | 1,37 | 1,28 | 1,58 | 1,35 |
| DEPOIS | 1,13 | 0,84 | 1,10 | 1,11 | 1,18 | 1,12 |

Duas rodadas de calibração (doses finais 0,44/0,10/0,36/0,26/0,48/0,36, faixa 0,22–0,30
da altura). O gradiente entra DEPOIS da tinta (no alto, o teto tem a última palavra),
em azul-violeta→azul-quase-preto conforme `escuridao()` — nunca preto, que é a lama que
a direção C proibiu. Na TARDE o mesmo teto entra a 55%: zênite afunda, horizonte guarda
o ouro. A régua é relativa de propósito: `getImageData` não vê o filtro CSS de brilho,
mas o filtro é igual nas duas bandas, então a razão sobrevive; o absoluto quem julga é
o print.

**Medido:** FPS 62 nas três rodadas do smoke (piso 58); `index.html` 3.899.494 →
3.908.474 bytes (+8,8 KB, só código e comentário — zero imagem nova; medido blob a
blob em LF, porque o checkout em CRLF infla o número do disco); MANHÃ intocada (no
shot-game do smoke — o passe de tinta a 0,04 é invisível e o teto é 0). Prints
`A2-*`/`D3-*` na raiz do worktree (13+13): por pintura e hora, mais `*-sprite-noite`
com o cacho de fruta antes neon e depois na luz da rua.

**O que ficou frágil:** (a) o TARDE do litoral (pinturas 0 e 4) ainda mede 1,43–1,56 —
no print lê como névoa alta acesa por sol baixo, plausível; ficou contido de propósito
(princípio 5) e o botão está anotado no `DIRECAO.md`. (b) `CEU_PINT` é indexada por
PINTURA: quando SALVADOR chegar com as 8 imagens, as pinturas novas precisam de dose
própria — sem entrada, caem na [0] por guarda, que é chute. Rodar `prints-onda2.js` no
mesmo commit que embutir arte nova. (c) O passe de sprites depende da ORDEM do desenho
(só folha+mob+sombra no canvas naquele ponto); quem inserir desenho novo antes de
`tintaSprites()` está o pondo DEBAIXO da tinta — é o contrato, está comentado no local.

**Próximo passo:** onda 3 do `DIRECAO.md` — a cerimônia de era vira cinema (varredura
de luz na abertura, que agora tem uma noite de verdade para varrer).

### 2026-08-07 · Direção de Evolução, onda 3: a cerimônia vira cinema (worktree)

O plano registrado no `DIRECAO.md` desde a onda 2, executado com o ANTES medido primeiro,
como o próprio plano mandava ("conferir a virada às 0,75 nos prints antes de mexer").

**O instrumento** (`test/prints-onda3.js`, novo): provoca uma virada de era REAL — arma a
última cena da época 0 com o impacto encostado no limiar, fixa a hora via `setHora`,
cruza o limiar e atravessa o fecho — e fotografa a cerimônia em seis marcas de tempo,
medindo em cada uma a fração do dia, o `saltoHora` restante e a luma do céu no `#fundoHD`.
Um `MutationObserver` na classe `cerimoniando` mede a duração real da cerimônia por
dentro. Armadilha paga: o screenshot a dsf2 atrasa ~0,4 s cada marca — a primeira rodada
imprimia o tempo NOMINAL e a cerimônia parecia fechar aos 1,8 s quando fechava aos 2,4.
Registrar o tempo real resolveu; anotado no `DIRECAO.md` para a onda 4 não repagar.

**O que o ANTES mediu:** cerimônia de 2,41 s; varredura linear (220 s/s) de exatamente
+1 hora "de onde estiver". Partindo de 0,75 (NOITE) ela terminava em 0,003 — amanhecer,
mas por coincidência (0,75+0,25=1,0). Partindo de 0,40 terminava em 0,654: a era nova
abria ANOITECENDO, céu caindo 76→67 ao longo da cerimônia — o momento que mais devia
parecer um começo terminava no escuro. E o float "NOVA ERA" atravessava a placa da
cerimônia dizendo o que ela já diz (print `A3-noite-t1.20`).

**As quatro mudanças (todas em `src/jogo.ts`, ~30 linhas):**
1. Virada de CAPÍTULO varre até a PRÓXIMA MANHÃ: `saltoHora = max(DIA_SEG/4, DIA_SEG −
   relogio % DIA_SEG)` — sempre ao menos uma hora, sempre terminando em fração 0,00, na
   pintura nova, atrás da placa. Troca de cena do mesmo capítulo mantém a hora de sempre.
2. O consumo ganhou física: `p = min(resto, max(resto·(1−e^(−1,9·dt)), 130·dt))` —
   decaimento exponencial com piso, parte depressa e assenta chegando. Pior caso (quase
   um dia inteiro) ~2,3 s; mínimo ~1,5 s. Era linear, que é planilha (princípio 4).
3. Cerimônia 2400 → 3400 ms — medido 3,41–3,46 s. O respiro extra é o que deixa a
   varredura TERMINAR com a placa de pé. O toque continua encerrando na hora.
4. `somEra(amanhece)`: uma voz a mais só na virada de capítulo — senoide de 880 Hz,
   ataque de 0,5 s, vol 0,07, entrando 950 ms depois do arpejo, junto com a luz.
   E o float "NOVA ERA" só nasce quando NÃO há cerimônia.

**DEPOIS (mesmo protocolo):** partindo de 0,75 E de 0,40, a cerimônia fecha com o dia em
0,00 — manhã na pintura nova nos dois casos (prints `D3-*-t2.60`/`t3.40`: o mesmo quadro
que no ANTES fechava em lusco-fusco fecha com névoa de manhã acesa na serra). Varredura
consumida aos ~2,4–2,7 s reais, dentro dos 3,4 s da cerimônia.

**Medido:** FPS 61/61/62 em três rodadas do smoke (piso 58); `index.html` 3.908.474 →
3.910.366 bytes (+1,9 KB, só código); zero imagem nova; zero rede; smoke verde sem tocar
em teste nenhum (o smoke chama `somEra()` sem argumento — sem a voz do sol, por
construção). Prints `A3-*`/`D3-*` em `test/`.

**Dúvida deixada:** a cerimônia aberta pela SELEÇÃO de era no menu não varre a luz — ali
não se atravessou tempo jogando, então decidi que o sol não anda; se o dono sentir falta
de cinema ali, é uma linha (`saltoHora` no handler de `montarCapitulos`).

**Próximo passo:** onda 4 do `DIRECAO.md` — toque com física no canvas (protótipo atrás
de flag; câmera é território sensível).

## O peso da invasão — fontes do fecho reescrito (2026-08-07)

Decisão do dono: *"foi uma invasão violenta e massacres aconteceram… não tem como ser algo
leve ou legal, é pesado e triste a realidade que esses povos viveram."*

**A regra que o historiador achou, e vale para TODO texto futuro: violência com sujeito.**
O arquivo inteiro punha violência em passiva sem agente ("chegaram navios", "seriam trazidas
à força", "foi destruída", "foi morto") e ação boa em voz ativa ("os Tupinambá plantavam").
Ninguém decidiu isso — é o modo automático da língua escolar, e apaga quem fez o quê.

**O limite oposto, marcado por ele e implementado:** capítulo que termina na destruição
reduz um povo a vítima, que é a outra forma de apagá-lo (§2.1). A fala 5 ("estão no sul da
Bahia agora, enquanto você joga") não é consolo: é fato com fonte, e é o que costura o
capítulo 1 ao 3.

### Fontes por fala do novo fecho de PINDORAMA

1. **Invasão** — CLAUDE.md §2.3 (vocabulário); Manuela Carneiro da Cunha (org.),
   *História dos índios no Brasil*, Companhia das Letras, 1992.
2. **Guerra justa** — Beatriz Perrone-Moisés, "Índios livres e índios escravos: os
   princípios da legislação indigenista do período colonial", em Cunha (org.), 1992;
   **Lei sobre a Liberdade dos Gentios, Évora, 20/03/1570** — declara livres todos os
   indígenas *exceto* os tomados em guerra justa. A escravização indígena não foi excesso
   de colono: foi política legislada, e a lei que dizia "livres" abria a exceção.
3. **Varíola de 1562–63** — cartas do padre Leonardo do Vale (Bahia, 1563); Dauril Alden &
   Joseph C. Miller, "Out of Africa: The Slave Trade and the Transmission of Smallpox to
   Brazil, 1560–1831", *Journal of Interdisciplinary History* 18(2), 1987. A oração final
   ("não foi acidente da natureza") tem literatura própria: David S. Jones, "Virgin Soils
   Revisited", *WMQ* 60(4), 2003 — a narrativa da epidemia em solo virgem funcionou
   historicamente para absolver a colonização. **Sem número, de propósito:** os que circulam
   são de cartas jesuíticas, o mesmo tipo de fonte que o jogo ensina a ler com desconfiança.
4. **Expulsão do litoral** — John M. Monteiro, *Negros da terra*, 1994; Maria Regina
   Celestino de Almeida, *Metamorfoses indígenas*, 2003.
5. **Continuidade** — ISA/PIB, Tupinambá de Olivença; Portaria Declaratória 1075/2025;
   IBGE, Censo 2022.
6. **Tráfico e açúcar** — SlaveVoyages.org (Emory); Stuart B. Schwartz, *Segredos internos*,
   1988.

### Vocabulário do jogo, agora escrito

**Banidos:** descobrimento/descoberta · encontro de culturas (simetria falsa: um lado veio
armado) · pré-história/primitivo · "índio" como categoria única (Lei 14.402/2022) ·
povoamento/colonizar a terra (exceto dentro de título de obra citada) · pacificação,
aculturação, assimilação · dizimados (passiva, e significa "um em dez") · sumiram,
desapareceram · tribo (use **povo**).

**Os quatro casos que o dono levantou:** *chegada* pode ser o que os navios fizeram, nunca
o que aconteceu com um povo · *contato* é termo correto da política indigenista de HOJE
(isolamento voluntário, recente contato) e pertence ao capítulo 3, não ao 1 · *conquista*
é honesto quando o sujeito é o colonizador, nunca como fato consumado sobre um povo ·
*guerra justa* é a melhor peça de ensino do capítulo, sempre marcada como termo deles.

**Usar:** invasão · pessoa escravizada (nunca "escravo" como identidade) · traficadas /
arrancadas, nunca "trazidas" · a doença que chegou nos navios · povos indígenas no plural,
e o nome do povo sempre que a fonte permitir · **PINDORAMA** era nome de TERRA, não de
unidade política: nunca escrever como se um país chamado Pindorama tivesse sido derrotado.

### O que NÃO entrou, e por quê

**A cabeça de Zumbi exposta em praça pública** — o historiador propôs e marcou como *não
verificada em fonte primária nesta sessão*. A regra da casa é fonte no mesmo commit; ficou
de fora. Verificar em Gomes (2005) ou no *Documenta Palmares* antes de qualquer uso.

### ⚠ Ainda do dono

Comprimento do fecho (4 falas/370 caracteres → 6/880: mais que o dobro de caixa num momento
em que se quer voltar a jogar; se cortar, fundir 1+2 é o mais barato) · tirar do fecho a
fala "O que os europeus escreveram" (feito — ela continua em MOMENTOS[1]) · endurecer o
fecho de Palmares e a abertura do cap. 2 para acompanhar, ou deixá-los (aviso de tom: se só
o cap. 1 endurecer, o 2 fica com cara de aventura por contraste).
### 2026-08-07 · Direção de Arte: a composição do quadro (worktree)

Pedido do dono: "aleatório mas não desorganizado ou caótico" + "itens voando... deveriam
estar presos ao chão". Instrumento novo (`test/prints-composicao.js`) confirmou o
diagnóstico do PM: a quantidade já estava certa; o caos era o ONDE.

**Medido ANTES (cap 1, u1, correndo, 50 s):** 34% das folhas visíveis na faixa do CORPO
(h 30–52 — a da cabeça da personagem, dos mobs, de quem chega); 20% dos quadros com folha
cruzando silhueta no mesmo X; drop com base em GROUND−6 ± seno; cacho do cap 1 levitando
16 px de mundo (`MOB_LIFT` herdado do motor de rua, onde smog era FUMAÇA); float "+4.0"
vivo e NASCENDO sobre tela aberta (3 vivos após 400 ms sob `emTela`).

**As quatro mudanças (`src/jogo.ts`, região spawn/desenho/floats):**
1. Folhas em DOIS TRILHOS: chão (16–26) e copa (56–74), peso 55/45 — o meio vazio de
   propósito; a fração pega andando (era 55%, h<50) se preserva e a renda junto.
2. Respiro horizontal na entrada: folha a <28 px de uma chegada entra 30 px depois.
3. Tudo no chão: `MOB_LIFT` zerado (sombra firma sozinha via `noAr`); drop com base em
   `GROUND`, sem balanço, com sombra de contato (sombra ANTES do alfa do item — `sombra()`
   zera `globalAlpha` ao sair, armadilha nova, paga aqui).
4. `novoFloat()`: sinal não aparece sobre leitura — sob `emTela` float não nasce e os
   vivos somem no `drawScene`. Regra irmã de "sinal não toma tinta" (onda 2).

**Medido DEPOIS (mesmo protocolo):** corpo 0%, colisões 0%, floats sob tela 0.
Renda/min (`medir-poluicao.js`, 6 células, 45 s): 1374→1392 · 1474→1463 · 1465→1478 ·
1604→1595 · 1822→1850 · 1997→1991 = −0,7% a +1,5%, dentro do ±10%. Smoke verde, FPS 61,
zero imagem nova. Prints `COMP-A-*`/`COMP-D-*` em `test/` (o A-silhueta pegou o cacho
boiando na altura da cabeça; o D-cap1 mostra copa em linha, meio limpo, drop assentado).

**Armadilha do instrumento, paga:** `fecharTudo()` fecha SHEETS, não TELAS — a primeira
rodada da sonda mediu o jogo inteiro atrás do MENU aberto. `fecharTelas()` junto resolve;
o `medir-poluicao.js` já fazia os dois.

**O que NÃO fiz, de propósito:** teto/faixa para o float do toque acumulado (ele sobe até
GROUND−52 e segura — 8 px acima da cabeça, lê como sinal do gesto, deixei); espaçamento
entre mobs (vão médio de chão 73–78 px, mínimo 54 quando não há drop de morte — já é
composição); nada em EPOCAS/arte/velocidades (Devs em campo lá). Vão mínimo de 5 px no
chão é drop nascendo de mob morto — filiação, não bagunça.

**Próximo passo:** QA pode querer promover a regra "float sob tela = 0" a asserção do
smoke; o instrumento já dá o número.
### 2026-08-07 · T5: o motor da corrida ganha passo próprio, e as três folhas ficam retidas

**O ticket.** `velocidadeMundo()` usava o MESMO `passo` para andar e correr e só dobrava a
cadência. O dono nomeou o sintoma antes de qualquer medição: *"o correr deve ser correr, parece
que ele tá andando rápido"*. Ele tinha razão, e a razão é aritmética — correr com o passo da
caminhada é literalmente andar depressa.

**O que entrou no motor** (vale com folha ou sem):

- `PASSO_CAP` ganhou `lacoCorrer` e `quadrosCorrer`, e deriva `passoCorrer` do mesmo jeito que
  `passo`: `laço × 44 / alturaQuadro / quadros`. Os dois em **zero** nos três capítulos, que é
  "não há folha aprovada" — aí `passoCorrer` cai no `passo` e nada muda.
- `temCorrida()` e `passoAgora()`: uma pergunta e uma conta, num lugar só. Elas têm três clientes
  que não podem divergir — a velocidade do mundo, o passo que escolhe o quadro e a folha
  desenhada. **E os três divergiam:** `drawHero()` lia `passoCap().passo` fixo, então uma folha de
  corrida ligada faria o quadro ser escolhido pelo passo da CAMINHADA enquanto o chão andava no
  passo da CORRIDA. É a armadilha nº 1 do §7 pela porta dos fundos, plantada esperando a folha.
- A altura do quadro da corrida **não** entra na conta: `desenharHeroiHD` desenha a folha de
  corrida com o `heroScale` da CAMINHADA, então um px de sprite de uma vale um px da outra.

**Aceite (a), provado por número:** com os campos em zero, o smoke mede `walking 11478 px /
running 22957 px` — os mesmos bytes de distância que a `main` mede antes da mudança. Zero
diferença de comportamento. Renda/min medida depois (`medir-poluicao.js`): 1395/1516 ·
1468/1627 · 1841/2008 (andando/correndo por capítulo) — inalterada por construção, porque
`velocidadeMundo()` devolve o mesmo número e é dela que as chegadas nascem.

**As três folhas (`cap{1,2,3}-corrida.png`, 2026-08-07) NÃO entraram, por DUAS razões
independentes. A primeira é do dono, não minha.**

**1. §2: a pessoa é outra.** Nas três eras a folha de corrida traz uma figura diferente da
caminhada do mesmo capítulo. Prints em `test/look-pessoa-era{1,2,3}.png`, as duas folhas na
escala real do motor sobre a mesma linha de chão:

| era | caminhada (no jogo) | corrida (chegou) |
|---|---|---|
| 1 · Pindorama | homem, tanga branca, colar de contas, sem adorno de cabeça | mulher, faixa branca no busto, saia vermelha com penas, cocar de penas |
| 2 · Palmares | pessoa de cabelo crespo, túnica creme **e calça**, cinto, sandálias | mulher de **lenço amarelo** na cabeça, blusa creme, **saia laranja**, faixa verde |
| 3 · Ainda aqui | pessoa de camiseta creme estampada, **bermuda escura**, sandálias, cabelo solto | mulher de camiseta branca e vermelha, **jeans**, tênis vermelho, rabo de cavalo |

O comentário do `heroBloco` já diz por que isso é veto e não ajuste: *"perder a animação de um
gesto é um defeito visível e reparável; trocar a pessoa no meio do capítulo é o erro do §2, e não
se conserta com arte melhor depois."* É o mesmo motivo que reprovou as folhas de salto e alcance
do capítulo 2 em 2026-08-05. O §2 é explícito: representação **não se decide sozinho**.
**Pergunta ao dono:** as folhas voltam com a pessoa da caminhada de cada era, ou a pessoa da
caminhada é que muda? (A segunda opção custa quatro folhas por era, não uma.)

**2. Mecânica: mesmo ignorando a pessoa, o escorregamento não fecha.** Régua da casa, a mesma que
produziu os `0,48% / 0,00% / 0,67%` das caminhadas: *o maior recuo fora do passo, sobre a passada
inteira*. Melhor ciclo que cada folha consegue formar, varrendo todos os subconjuntos:

| era | poses | passada medida | melhor ciclo | escorregamento | caminhada |
|---|---:|---:|---|---:|---:|
| 1 | 8 | 189,0 px de sprite | 5→6→1→3 (3 apoio, 1 voo) | **3,31%** | 0,48% |
| 2 | 8 | 217,0 | 5→6→3→4 (2 apoio, 2 voo) | **2,65%** | 0,00% |
| 3 | 7 | 219,9 | 5→1→3→4→6 (2 apoio, 3 voo) | **7,72%** | 0,67% |

Cinco a onze vezes a caminhada, e acima do 1,5% que se aceitaria sem investigar. A causa é a
mesma da folha reprovada em 2026-08-06: as poses **não amostram a passada por igual**. O modelo
desenha um saco de poses bonitas, não um ciclo — no capítulo 1 há sete poses de apoio e uma de
voo, com os calcanhares amontoados em 27/34/58/72 e um vão de 65 px entre 178 e 113.

**O que as folhas acertam, e é muito** (para quem for pedir as próximas): elas SÃO corrida.
Prints `test/look-corrida-era{1,2,3}.png`, quadro a quadro com a linha de chão em vermelho: há
fase de voo de verdade, com os dois pés fora do chão, medida em 47 / 49 / 79 px de sprite acima
da linha (6,6 / 6,6 / 11,2 px de mundo). A abertura dos pés é 1,34 / 1,31 / 1,44 vez a da
caminhada — passada de corredora. E a **escala está certa nas três**, sem reamostrar: as figuras
medem 305 / 328 / 306 px contra 322 / 323 / 318 da caminhada, e a diferença é a inclinação para a
frente, não tamanho. A grade não mentiu desta vez: 8, 8 e 7 poses em tira, contadas antes de
cortar, e é o que o cortador achou.

**Armadilha nova, e custou meia sessão: a LARGURA DA CABEÇA mente numa folha de corrida.** A
régua de escala da casa (§5) lê o maior trecho sem buraco no quinto superior da figura. Correndo,
o **cabelo voa** para trás e entra nesse quinto: no capítulo 1 a cabeça lê 110 a 156 px na corrida
contra 76 fixos na caminhada, e o `validar-folha.js` conclui fator 0,58 — encolheria a personagem
em 30%. O corpo desmente: 305 px de altura contra 322. Quando a pose faz o cabelo entrar no quinto
superior, a cabeça deixa de ser régua e o `test/comparar-folhas.js` (novo) decide no olho, que é o
que sobra. O `validar-folha.js` continua certo para caminhada, salto e alcance — o aviso é sobre
corrida.

**Ferramentas que voltaram, agora commitadas** (as de 2026-08-06 moravam em `tmpart/` e se
perderam, e este arquivo cita os números delas — sem a régua, "≤ o da caminhada" vira lembrança):

- `test/medir-sola.js` — contato pela LINHA DE CHÃO do quadro (não pela tinta mais baixa da
  própria pose, que acha sola até numa pose de voo), pés em grupos, calcanhar, levantamento, vão
  dos pés, cabeça e discordância de silhueta. Reproduz o que está gravado: a caminhada do capítulo
  2 devolve calcanhares 135/80/25, laço **165**, `PASSO 7,49`, vão dos pés **181**.
- `test/ciclo-corrida.js` — escolhe o ciclo de uma folha de corrida varrendo os subconjuntos. A
  passada vem do **vão dos pés** (a única régua que sobrevive ao voo), calibrada pela caminhada do
  mesmo capítulo; a ordem e o número de quadros vêm de minimizar o escorregamento.
- `test/folha-png.js` — os quadros lado a lado com a linha de chão.
- `test/comparar-folhas.js` — duas folhas na escala real do motor, para a pergunta de escala e
  para a pergunta da pessoa.

**Números.** `npm test` verde, FPS 61–62, `index.html` 3.919.750 bytes (a corrida não entrou,
então o peso novo é só comentário). Zero imagem nova, zero rede.

**Próximo passo.** Depende da resposta do dono sobre a pessoa. Se as folhas voltarem, o resto é
meia hora: `ciclo-corrida.js` dá o ciclo e a passada, `lacoCorrer`/`quadrosCorrer` entram no
`PASSO_CAP`, e `telaCorrer` é escolhido INTEIRO para a velocidade ficar dentro de ±10% da de hoje
(76,5 / 74,9 / 83,0 px/s) — a economia inteira nasce por DISTÂNCIA, então velocidade mudada é
renda/min mudada.
### 2026-08-07 · SALVADOR entra: o capítulo 4 sai do papel (worktree, para integrar)

As oito imagens do dono chegaram em `assets/entrada/cap4-*.png` e o T2 do `SPRINT.md`
deixou de ser preparação. O capítulo está no jogo, com a arte processada pelo pipeline,
a época em `EPOCAS`, a placa de 1835 reorganizada e a noite calibrada no mesmo commit.

**A decisão que custou mais que todo o resto: SALVADOR não é o quarto índice, é o
TERCEIRO.** 1835 vem antes de hoje, e um jogo sobre a história do Brasil que põe o levante
depois do presente está errado antes de qualquer discussão de arte. Inserir no meio desloca
todos os índices — era a pendência nº 4 do relatório pré-1500, e ela venceu agora:

- `EPOCAS` = PINDORAMA · PALMARES · **SALVADOR** · AINDA AQUI. As cenas passaram de 6 para
  7 (Salvador declara `cenas: 1`, porque chegou UMA pintura; duas cenas com a mesma pintura
  custariam 260 KB para repetir o quadro, e o motor N-capítulos aceita o número declarado).
- **Migração de save (`migrarArco`, campo `arco` novo no `ESQUEMA_SAVE`).** Quem parou em
  HOJE estava na cena 4; no arco de agora a cena 4 é 1835. Sem migrar, essa pessoa acordava
  no capítulo errado com a abertura dele marcada como lida — perderia para sempre a fala que
  é a razão de o jogo existir. Tabela explícita (`ARCO0_CENA`, `ARCO0_EPOCA`), rodando DEPOIS
  do esquema (só remapeia número que já passou pela régua) e sem gravar (`salvar()` carimba
  `salvoEm` e mataria a tela de retorno). **Save sem o campo `arco` é arco 0 por definição** —
  a linha que faltava na primeira versão, e sem a qual a migração nunca rodava justamente
  para quem tinha save antigo. Coberta no smoke: quatro casos, e ele falha se alguém acordar
  no capítulo errado, se a abertura nova vier marcada como lida, ou se as acolhidas mudarem
  de capítulo.
- `LINHA_TEMPO` deixou de usar índice de cena literal: `cena: cenarioDaEpoca(n)`. O próximo
  capítulo que entrar no meio não reescreve a linha do tempo inteira.
- `FRENTE_CAP = [0, 1, -1, 2]`: qual pacote de vegetação cada capítulo usa. O `-1` de
  Salvador não é falta de arte — rua de pedra de cidade não tem rodapé de mata, e o índice
  da época como índice do pacote plantaria a bananeira de hoje na ladeira de 1835.

**O marco 1835 virou PLACA.** "A Bahia se levanta" era uma linha de texto entre 1888 e 1988;
agora é capítulo. No lugar dele, dois momentos que EXPLICAM como se chega em 1835 — "A
cidade africana" (Reis) e "As ganhadeiras" (Cecília Moreira Soares) — e o levante contado no
FECHO, que é onde ele pode ser contado sem virar fase de jogo (§2.2).

**As travas de representação, cumpridas e escritas onde se quebrariam:** os drops são
acarajé, pano da costa e búzios (a lista está no `test/inline-objetos.js`, com a trava no
comentário); **nenhuma escrita árabe como item, imagem ou drop**; a imagem do pátio veio sem
símbolo religioso; a mecânica é a VÉSPERA — alcançar é levar palavra. Os textos de `EPOCAS`
estão marcados **⚠ RASCUNHO** no código: são proposta, e o texto final é do dono, palavra por
palavra (§2).

**Fontes deste capítulo** (as duas primeiras já visíveis na linha do tempo, ao lado do texto):

- João José Reis, *Rebelião escrava no Brasil: a história do levante dos malês em 1835*
  (ed. rev. e ampl., Companhia das Letras, 2003) — a data (madrugada de 24 para 25 de
  janeiro de 1835), a denúncia na véspera, a repressão e as leis de vigilância posteriores.
- Cecília Moreira Soares, "As ganhadeiras: mulher e resistência negra em Salvador no século
  XIX" (*Afro-Ásia*, 1996) — o trabalho de rua, o ganho próprio, a compra da alforria.
- Ao lado, para consulta futura: Lisa Earl Castillo; Wlamyra Albuquerque, *O jogo da
  dissimulação* (2009).

**A MEDIÇÃO DA CAMINHADA, E A MÁ NOTÍCIA QUE ELA TRAZ.** `PASSO_CAP` do capítulo: quadros
3, 4, 9 de 11, laço 106, quadro 317, `tela` 8 (inteiro), `telaCorrer` 4 → 4,9043 px de mundo
por quadro de sprite e **36,78 px/s**, −3,9% do capítulo 1 (38,26 · 37,46 · 37,74 · 36,78).

O laço veio da separação entre os dois calcanhares no apoio duplo: **106 / 107 / 106 / 106**
px de sprite em quatro quadros independentes, CV 0,4%. É a única medida desta folha que
quatro leituras confirmam — e teve de ser ela porque **a folha não é um ciclo**. Medido com
o `test/medir-sola.js` (ferramenta nova) nos 11 quadros: o calcanhar do pé de apoio só
aparece em 119 (o pé acabou de chegar) e em 12–28 (o pé está saindo, girando sobre a ponta).
Entre um e outro — os ~90 px em que o pé fica plantado e o corpo passa por cima dele — não
há UMA pose. Nove dos onze quadros são quase-cópias do contato.

**Escorregamento medido pela régua da casa (`max|recuo − laço/3| ÷ laço`): 52,5%**, contra
0,48% / 0,00% / 0,67% das três eras. Não há triplo melhor nesta folha: varridas as
combinações, o vão entre a chegada do pé (119) e a pose mais recuada disponível trava o
terceiro trecho em ≥ 62 px. É o mesmo defeito que fez a folha de CORRIDA do capítulo 2 ficar
de fora em 2026-08-06 (11% de apoio) — a diferença é que ali havia a caminhada para cair, e
aqui não: sem esta folha não há capítulo. **O conserto não é código: é uma folha de 12 poses
com o CORPO andando entre elas.** Fica como o primeiro pedido de arte do capítulo 4 e está
escrito no `PASSO_CAP` para ninguém confundir este número com os dos outros três.

**A noite, calibrada no mesmo commit** (a dívida (b) da onda 2 do `DIRECAO.md`): o
`prints-onda2.js` deixou de contar 6 pinturas com um literal e passa a ler
`CENARIO_ALTO_B64.length` — instrumento com número escrito à mão mede o passado, e mediria
seis calando justo sobre a sétima. Salvador é o segundo caso (depois da pintura 1) de
pintura SEM faixa clara: o alto do quadro é telhado, não névoa. Varrido com o
`test/calibrar-ceu.js` (novo): sem dose nenhuma, topo/céu à noite já dava **1,04**, dentro
do alvo ≤ 1,1. Ficou com **0,10**, a mesma dose mínima da pintura 1 e pelo mesmo motivo — o
zênite dela AFUNDA junto com as irmãs no entardecer em vez de ser a única parada. Medido
depois: **1,09 na tarde, 0,99 à noite**. As sete, à noite: 1,13 · 0,84 · 1,10 · 1,11 ·
**0,99** · 1,17 · 1,01.

**O retrato tinha um defeito que só o print pegou.** A moldura da fala é 132×300 com
`object-fit: contain` e o pé no chão da caixa; um BUSTO de 212×300 encaixa pela LARGURA e vai
parar no fundo da moldura — atrás da caixa, invisível. As três folhas anteriores eram figuras
INTEIRAS e por isso ninguém tinha visto. Resolvido estendendo a tela do retrato até a razão
da moldura (212×482, figura no topo): a escala não muda (a cabeça dá 59 px na tela nos
quatro capítulos, medida pela LARGURA DA CABEÇA como manda o §5) e a cabeça dela cai onde
estão as outras três.

**PESO — o número que o dono precisa (T3):** `index.html` **3.823 KB → 4.447 KB (+624 KB)**,
teto de 3.600 estourado em 23%. Tudo já em WebP 0,80, o mesmo do resto. O capítulo custou:
pintura alta 174 KB · pintura do chão 62 KB · contexto do porto 91 KB · contexto do pátio
49 KB · caminhada (3 quadros) 55 KB · retrato 18 KB · 3 objetos ~29 KB · 3 drops ~22 KB.
Por bloco, hoje: pinturas 1.679 KB · personagens 901 KB · contextos 739 KB · NPCs 188 KB ·
objetos 132 KB · vegetação 76 KB · drops 74 KB · retratos 64 KB. **A conta não fecha para 12
capítulos**: ao ritmo de ~500 KB por capítulo, o 6º passa de 6 MB. A comparação 660px×master
do T3 ataca justamente os contextos; a decisão estrutural (carga sob demanda) segue do dono.

**Ferramentas novas em `test/`** (todas no `test/LEIAME.md`): `medir-sola.js` (o pé quadro a
quadro — a medição que o LEIAME mandava fazer à mão desde o capítulo 1), `montar-quadros.js`
(contact sheet, com `--pes=N` para a faixa do pé), `cortar-celulas.js` (reparte folha de
objetos em células iguais, que é o que faltava para uma folha de 3 objetos virar 3 arquivos),
`calibrar-ceu.js` (varre doses de `CEU_PINT` numa pintura) e `prints-cap4.js` (fotografa o
capítulo JOGANDO, não a pintura forçada). O `ferramentas/construir.js` também aprendeu a
achar o `tsc` num worktree, onde o `node_modules` não é copiado e o caminho fixo morria.
O `inline-objetos.js` passou a gerar também o `RETRATO_B64`, que era o único bloco de arte
embutido à mão — "gerado" no comentário e por ninguém no código.

**Medido no fim:** `npm test` verde, FPS 61, zero erro de console. Prints a 390×844 dsf2 em
`test/`: `C4-rua.png` (o capítulo andando), `C4-abertura.png` (cerimônia, retrato e o porto
atrás), `C4-fala-patio.png` (o pátio à noite na terceira fala), `C4-linha-placa.png` (a placa
SALVADOR entre Palmares e hoje), `C4-noite.png` (a noite calibrada) e `O2-cap4-p4-tarde/noite.png` (a pintura de Salvador
nas duas horas, saídas do medidor).

**Próximo passo:** a folha de caminhada de 12 poses com o corpo andando (é o que separa este
capítulo dos outros três), e a segunda pintura de Salvador se o dono quiser `cenas: 2`.

### 2026-08-07 · O mundo PARA enquanto a história fala (worktree, para integrar)

Pedido do dono: *"Agora o jogo já acontece enquanto a história passa, não deve ser assim."*
Com uma tela narrativa aberta, o mundo seguia rodando por baixo — e quem estava lendo perdia
coisa e ganhava coisa sem saber.

**O NÚMERO DO ANTES, e ele é pior do que parecia.** `test/medir-historia.js` (ferramenta nova)
abre uma fala de verdade e conta 5 s de leitura, com `u3` ligado:

| | ANTES | DEPOIS |
|---|---|---|
| impacto somado em 5 s | **4,00** (0,80/s) | **0,00** |
| chão andado | **191,9 px de mundo** | **0,0** |
| relógio do dia | 5,0 s de jogo | 0,0 |
| chegadas nascidas | **3** | 0 |
| folhas nascidas | 1 | 0 |

Os 4,00 de impacto **não vinham do `u3`** — ele já estava barrado pelo antigo
`!contandoParado()`. Vinham de FOLHA colhida no caminho, dentro de `atualizarFolhas()`, que
roda no caminho de DESENHO (chamada de `drawHero()`) e por isso nunca passou por portão
nenhum. É a lição desta sessão: **o portão do laço de quadro não é o único caminho por onde o
mundo anda** — `drawHero()` mexe em mata, arco de pulo, golpe, poeira e som de passo depois de
desenhar, e precisou do mesmo portão repetido lá dentro.

**A distinção que vai parecer inconsistência e está escrita em três lugares no código:** MENU
tem o mundo vivo atrás (decisão de direção de arte, `DIRECAO.md`, "a tela é o mundo" — é o que
faz o menu ser um LUGAR e não um modal); HISTÓRIA para o mundo. São trabalhos diferentes: no
menu a pessoa ESCOLHE e o mundo é pano de fundo; na história a pessoa LÊ, e o mundo estava
competindo com o texto num jogo que existe para ensinar. `contandoParado()` virou
`historiaAberta()`, que é o nome do que ela sempre mediu.

**A exceção declarada: a varredura de luz da cerimônia.** A onda 3 varre o dia até o nascer do
sol na virada de capítulo ("era nova é dia novo"), e isso acontece exatamente com a tela de
história aberta. Se ela caísse no portão, a única passagem de tempo que o jogo ENCENA seria a
única que nunca rodaria. Ficou em **canal próprio**: `saltoHora` escreve em `relogio` direto,
no `dt` real, fora do portão. Medido no smoke depois da mudança: cerimônia partindo de 0,75 e
de 0,40 drena em 1,42 s / 1,88 s reais e fecha nas duas com a fração do dia em **0,000**.

**Dois relógios, e a diferença importa.** `tick` (quadros DESENHADOS) **não** para, porque é
dele que sai o orçamento de vozes por quadro — congelá-lo emudeceria o tique da própria fala
depois de meia dúzia de vozes. Nasceu `tickMundo` para o que é animação de MUNDO (marcha parada
dos NPCs, balanço do que voa). `animT` e `relogio` param.

**Ela fica no ar se a fala abrir no meio do pulo, e isso é de propósito.** Congelar é congelar.
Deixar o pulo terminar poria o pouso — com som, baque de câmera e onda de chão — por baixo do
texto, que é o tipo de coisa que este trabalho existe para tirar de cima de quem lê.

**O drop parado sob ela não gruda.** A colheita é por PASSAR POR CIMA; parada, ela não recolhe.
Um drop que esteja sob ela quando a tela abre fica intacto e sai no primeiro quadro depois de
fechar — nada se perde. Coberto no smoke.

**A armadilha do `dt` acumulado, testada explicitamente.** O laço NUNCA para de rodar e `ultimo`
é reposto em todo quadro; o que para é o que ele ATUALIZA. Medido: primeiro quadro depois de
fechar anda **0,635 px** contra **0,639 px** de um quadro normal (razão 0,99). Se alguém um dia
"otimizar" isto desligando o `requestAnimationFrame`, a asserção nova pega.

**Smoke:** nenhuma asserção existente precisou de ajuste — todas as que dependem do mundo andar
chamam `atualizarMobs`/`atualizarFolhas`/`atualizarDrops` **direto**, não pelo laço, e as de
fluxo já abriam com `fecharTelas()`. Entrou o FLOW 4 ("com a história aberta, o mundo não
anda"): posição, contagem de objetos, impacto e relógio iguais depois de 1 s, o drop parado que
não é colhido e não gruda, e o primeiro quadro do retorno. `npm test` verde, FPS 61, zero erro
de console.

**Ferramentas novas em `test/`:** `medir-historia.js` (o medidor da tabela acima, aponta para
qualquer build via `JOGO_HTML`) e `prints-historia.js` (duas fotos da MESMA fala com 3 s entre
elas). Prints `HIST-antes-t0/t3.png` e `HIST-depois-t0/t3.png`: no ANTES a rua andou 279 px
entre as duas fotos e a serra apareceu no horizonte; no DEPOIS o quadro atrás do texto é o
mesmo pixel a pixel.

**Próximo passo / dúvida deixada:** as partículas (`parts`) e as ondas de chão ainda decaem no
caminho de desenho a 1/60 fixo com a história aberta. São o rastro de um gesto já feito e
morrem em ~0,4 s, então congelá-las mostraria uma faísca pendurada — deixei correr de
propósito. Se o dono quiser o congelamento literal, o lugar é o laço de partículas em
`desenharMundo()`, e o preço é essa faísca parada.
---

## 2026-08-07 · Dev · O peso volta para debaixo do teto — 4.447 KB → 3.362 KB

Pedido do dono: *"bora otimizar as imagens"*. Meta: voltar abaixo de 3.600 KB sem perda
visível. **Fechou em 3.362 KB — 238 KB de folga, 24,4% a menos que os 4.447 de ontem.**

### 1. Medir primeiro: onde o peso estava DE VERDADE

`test/medir-peso.js` (novo) varre `src/jogo.ts`, atribui cada `data:` ao bloco que o contém e
soma. `test/medir-dim.js` (novo) lê o cabeçalho WebP e diz em quantos pixels cada família foi
guardada. A suposição do `SPRINT.md` T3 (contextos = alvo mais barato) estava **errada em
ordem de grandeza**:

| bloco | antes (KB) | depois (KB) |
|---|---:|---:|
| CENARIO_ALTO | 1.100 | 880 |
| HERO (folhas da personagem) | 900 | 546 na fonte, ~400 no `index.html` (ver §2) |
| CTX (contextos) | 739 | 610 |
| CENARIO_CHAO | 579 | 465 |
| NPC | 188 | 138 |
| MOB · DROP · FRENTE · DECOR · RETRATO · ICONE | 443 | 363 |
| **base64 total** | **3.949** | **3.002** |
| **`index.html`** | **4.455** | **3.362** |

O maior bloco isolado não era contexto: era **a personagem, 900 KB** — o único conjunto que o
`CLAUDE.md` §6 registrava como *nunca reencodado*. Era o KB mais barato do arquivo inteiro.

### 2. Duas economias SEM PERDA NENHUMA — 327 KB, zero pixel alterado

**(a) Arte repetida paga uma vez só (−235 KB no `index.html`).** Medido: `atk2` é cópia byte
a byte de `atk1` nos três capítulos, e dois quadros se repetem dentro de `atk1_3` — 12 imagens
duplicadas. Consertar na fonte não adianta: os blocos são GERADOS, e nenhum gerador sabe o que
outro escreveu. Então quem conserta é o **build**: `ferramentas/construir.js` agora recolhe
toda literal `"data:image/…"` repetida no JS num `__ART[]` e troca as ocorrências por
referência. É literal virando referência, sem tocar em byte de imagem, com a sintaxe conferida
por `vm.Script` antes de sair. Vale para sempre e para arte que ainda nem chegou.

**(b) Perfil ICC fora (−92 KB).** Cada WebP saído do canvas do Chromium carrega um sRGB
genérico de 456 bytes; 153 imagens × ~620 bytes de base64. Sem ICCP o navegador assume sRGB —
o mesmo espaço. `test/tirar-icc.js` (novo) remove o chunk e apaga o bit no `VP8X`, e com
`--verificar` decodifica as 153 antes e depois no Chromium: **diferença máxima de canal 0**.
Não é estimativa, é prova. **Roda por último**: qualquer reencode recarimba o perfil.

### 3. A parte com perda: qualidade, não resolução — e o número que decidiu

Medido com `test/otimizar-medir.js` (novo: grade largura × qualidade encodando dos PNG
mestres, com o candidato reamostrado de volta à resolução de hoje antes de comparar):

- **Resolução perde para qualidade.** Contextos a 660 px em 0,80 cortam 161 KB com erro médio
  6,3; a 780 px em 0,72 cortam 144 KB com erro **4,6**. Menos estrago por KB economizado vem
  da qualidade. As medições antigas (660 px corta 22%, 520 px corta 46%) continuam certas em
  KB e enganosas em custo. **Resolução descartada.**
- **A pintura de cenário já está SUB-resolvida.** `redesenharFundo()` a desenha ampliada
  **2,53×** num aparelho 390×844 com dpr 3 (o termo `(1-gd)*ch/((1-gs)*ih)` domina a conta).
  Reduzir os 720 px seria piorar o que já falta.
- **Paleta:** não rendeu. As pinturas não são quantizadas de verdade, e o WebP com perda já as
  trata melhor do que qualquer redução de paleta feita antes dele.

**Aplicado:** `test/requalificar.js` **0,72** em fundos e contextos (pintura ampliada 2,5×, ou
paisagem atrás de véu e caixa de texto) e **0,76** em personagem, NPCs, retratos e vegetação de
fundo. `FRENTE_B64` ficou como estava: a 0,72 ele **cresce 10%** — imagens de 66×132 já estão
abaixo do ponto em que a taxa manda. `MOB`, `DROP` e `ICONE` também ficaram: cortariam mais
~100 KB com erro ~3,0 em sprite visto quase 1:1, e a meta já estava batida. Qualidade que não
precisa ser gasta não se gasta.

### 4. Prova de que não estragou

O erro medido no ARQUIVO não é o que o olho recebe — a imagem é reamostrada antes de chegar
lá. `test/medir-na-tela.js` (novo) refaz a conta **na escala de exibição de cada família**:

| bloco | escala na tela | KB | erro no arquivo | **erro NA TELA** |
|---|---:|---:|---:|---:|
| CEN_FUNDO | ×2,53 | 1.679 → 1.346 | 3,24 | **2,65** |
| CTX | ×1,50 | 739 → 610 | 3,49 | **2,89** |
| HERO | ×0,80 | 901 → 547 | **1,16** | ~3,7 |
| NPC · RETRATO · DECOR | — | 330 → 229 | 2,1–2,7 | ~3,5 |

Os dois maiores blocos ficam **abaixo da régua da casa (2,6 de 255)** depois da ampliação: a
suavização apaga justamente o ruído que a compressão introduziu.

**E os prints, que é o que decide** (`test/olhar-antes-depois.js`, novo — reamostra para o
tamanho de exibição e amplia 3× o mesmo recorte, antes e depois): personagem (contas do colar,
brilho do cinto, rosto), pintura de mata a 7,6× efetivos, contexto do roçado, retrato de
Salvador. **Olhados um a um: não distingo antes de depois em nenhum.** A 0,65, também medida,
a mata perde a mancha fina de folha e o caminho de terra vira bloco — **0,65 foi recusada**, e
é onde eu pararia mesmo com meta por bater.

**Um caminho que não funcionou, para ninguém repetir:** comparar o QUADRO do jogo rodando,
antes e depois. O mundo rola, dois runs param em posições diferentes, e o diff mede o
deslocamento (erro 7 a 17), não a qualidade. Foi por isso que a medição virou por-imagem na
escala de tela, e não por-quadro.

### 5. O que isto NÃO resolve

Ganho de uma vez: **1.093 KB**. Ao ritmo de ~500 KB por capítulo (agora ~380 na qualidade
nova), o teto volta a estourar no **capítulo 6**, e 12 capítulos continuam não cabendo num
arquivo único. Isto comprou dois ou três capítulos de prazo para a decisão estrutural (carga
sob demanda / Phaser + Supabase); não a substituiu. O gap 2 do `SPRINT.md` segue de pé.

**Medido no fim:** `npm test` verde, FPS 61, zero erro de console, `index.html` 3.362 KB.

### 2026-08-07 · Direção de Arte, onda 5: VOLTAR É AMANHECER (worktree, para integrar)

**A negociação do `SPRINT.md` §3.3, decidida.** O PM propôs trocar a chuva do meu roteiro
pela onda do retorno. Aceitei — e a justificativa completa está no `DIRECAO.md`, mas a
essência é que a chuva perdia nos MEUS princípios: propósito nomeável (chuva diz "está
chovendo"; o amanhecer diz "valeu a pena voltar"), resposta ao cuidado (chuva escala com
nada; o que o amanhecer acende já escala com `cuidadoVisto` de graça) e luz antes de
partícula. A chuva desceu no roteiro como candidata futura, não morreu.

**Feito (src/jogo.ts, ~40 linhas na região retorno; zero imagem nova):** fechar o papel
"ENQUANTO VOCÊ ESTEVE FORA" num dia NOVO de travessia (`diaNovo`) varre a luz até a
próxima manhã pelo canal da onda 3 (`saltoHora`, mesma física), com a voz do sol sozinha
a 0,06. O flag arma na ABERTURA do papel (não no fechar — `diaNovo` também vira verdadeiro
se a meia-noite passar no meio de uma sessão, e isso não é retorno). Guardas: fração
≤ 0,04 (já é manhã) não fala; `saltoHora` em curso não empilha; retorno no mesmo dia não
dispara — o amanhecer não pode virar moeda.

**Medido (`test/prints-onda5.js`, novo — molde da onda 3, tempo REAL nas marcas):**

| partida | ANTES (fecha o papel) | DEPOIS |
|---|---|---|
| NOITE 0,75 | fração fica em 0,752; céu ~70 | fecha em **0,001** aos ~1,8 s; céu 71→101 |
| TARDE 0,40 | fica em 0,402 | fecha em **0,001** aos ~2,0 s |

FPS 61/61/61 (piso 58) · `index.html` 4.560.521 → 4.562.826 bytes LF (+2,3 KB, só
código) · `npm test` verde sem ajuste em teste nenhum (o fluxo day-2 do smoke segue
passando) · prints `O5-A-*`/`O5-D-*` em `test/` — o `O5-D-t3.40` é o menu com a mata
acesa de manhã e a acolhida na luz; o `O5-A-t3.40` é a mesma cena numa noite parada.

**Armadilha nova, paga:** o jogo salva no `pagehide` — adulterar `salvoEm`/retenção e
recarregar desfaz a adulteração no próprio reload. O instrumento neutraliza
`salvar`/`salvarRetencao` antes de recarregar; quem for escrever o teste de QA do dia 2
com reload vai bater na mesma pedra.

**Visto de passagem, território alheio:** `O5-A-0-retorno.png` confirma o papel do
retorno abrindo ATRÁS do logo/tagline do menu — o z-index que o Dev já está consertando.
Não toquei; quando o conserto dele aterrissar, o print do papel por cima sai de lá.

**Pendência minha que continua:** o parecer do peso (T3) — o lado-a-lado 660px×master do
Dev não está neste worktree e há um agente otimizando o peso agora; dou o parecer sobre
os prints que essa frente produzir, não fabrico os meus.

**Próximo passo:** integrar este worktree; depois, gerar a próxima onda pela lente
"volta no dia 2" com a instrumentação do T1 colhendo — ou o parecer do T3, o que chegar
primeiro.

### 2026-08-07 · Voltar vem ANTES do menu, e o jogo começa a se medir (B1 + T1, worktree)

Dev, sprint 1. Dois tickets: o bug **B1** do `QA.md` (pequeno, primeiro) e o **T1** (P0 do
sprint — instrumentação de retenção).

**B1 — o papel da volta nascia debaixo do menu.** O boot abre o menu SEMPRE (`.tela`, z 40)
e o `#retorno` vivia em z 30: o momento mais importante da retenção ficava visível pelo véu
e **morto ao toque** — "toque para seguir" não respondia até a pessoa apertar JOGAR. A camada
certa não é "junto", é **antes**: quem volta encontra primeiro o que o lugar guardou, e o menu
espera. `#retorno` foi para **z 60**, acima de qualquer tela, e ganhou um véu (`#retVeu`,
z 59) que escurece o menu atrás e fecha no mesmo toque.

*Erro pago no caminho, e vale para quem for repetir o truque:* o véu nasceu como `::before` do
próprio painel, com `z-index: -1`. Num elemento que cria contexto de empilhamento, filho de
z negativo pinta **depois do fundo do pai** — o papel saiu encardido, e dava para ver no
primeiro print (papel marrom-acinzentado contra o creme do papel de AJUSTES na mesma rodada).
Véu é **irmão**, nunca filho.

*Provado no smoke, não no olho:* o teste pergunta ao navegador quem está no ponto do painel
(`elementFromPoint`) — é o que separa "está desenhado" de "está alcançável" — e depois toca de
verdade **com o menu ainda aberto**, que é exatamente o gesto que não respondia. Também exige
que o véu esteja sobre o JOGAR. Print: `shot-retorno.png` (papel creme na frente, menu
escurecido atrás).

**T1 — a retenção deixou de ser uma lista de datas e virou medida.** Quatro números, todos
locais:

| campo | o que responde | faixa (derivada) |
|---|---|---|
| `dias` | dias distintos com sessão | 0..20000 (54 anos) |
| `segundos` | tempo REALMENTE jogado (já existia, reusado) | 0..1e9 |
| `historia` | quantas vezes A HISTÓRIA foi aberta — se o jogo ensina | 0..1e6 |
| `toqEsq`/`toqDir` | toques por metade da tela nos primeiros 60 s (H5) | 0..5000 |

O teto dos toques é derivado: a janela tem 60 s e um polegar não passa de ~20 toques/s
(1200 no pior caso físico); 5000 dá quatro vezes de folga sem virar número de enfeite.

**A lista de dias morreu, e o brinde foi robustez de relógio.** `R.dias` era um array que
crescia um item por dia, para sempre, para responder uma pergunta de UM número. Virou
contagem + `primeiro` + `ultimo`, espaço fixo. Como efeito, `marcarDia()` agora **ignora um
dia anterior ao último já contado** — relógio recuado ou fuso trocado no avião não inflam mais
a contagem, e é ela que multiplica a economia inteira em `bonusDias()`. (Cobre parte do gap 1
do `QA.md`; `salvoEm` no futuro continua descoberto.)

**O registro de retenção passou a ter esquema.** Nasceu o `ESQUEMA_RET`, mesma régua do
`ESQUEMA_SAVE`: campo que não está lá **não é lido nem gravado** — `salvarRetencao()` escreve
percorrendo a tabela, não o objeto. Dois tipos novos no `valida()`: `cont` (contador inteiro,
aparado na faixa) e `dia` (ou é `AAAA-MM-DD`, ou vira `""` — data adivinhada é pior que data
ausente). Mais uma passada de **coerência entre campos**, que faixa isolada não pega: sem
último dia não há dia contado; com último dia há pelo menos um. Migração: registro no formato
antigo entra pela contagem de datas válidas e distintas, e as pontas viram primeiro/último —
ninguém perde o dia 3 que já conquistou (o smoke semeia justamente o formato velho).

**A janela dos 60 s é de tempo JOGADO, não de relógio de parede** (`R.segundos < 60`): quem
abre, larga e volta amanhã continua dentro dos seus primeiros 60 s. Conta só o toque na RUA —
o botão dourado não é metade de tela nenhuma e responderia pela pergunta errada.

**Onde aparece:** o rodapé de AJUSTES que já existia, estendido (não é tela nova). A linha dos
60 s só existe enquanto tem o que dizer. Print: `shot-retencao-ajustes.png`.

**A frase continua verdadeira.** "NADA SAI DESTE APARELHO / O JOGO NÃO TEM REDE" segue palavra
por palavra: os quatro campos são `localStorage` no próprio aparelho, nada é identificador de
pessoa, e a CSP do `<head>` continua intocada.

**Smoke:** entrou o bloco T1 — toques reais nas duas metades dentro da janela e um depois dela
(2/1 contados, o quarto ignorado), A HISTÓRIA aberta por **toque no botão real** movendo o
contador, os campos gravados conferidos contra uma lista **independente** do esquema (a mesma
disciplina do save), e um registro adulterado campo a campo: `dias: "muitos"` → 1 (hoje),
`primeiro: "2026-13-99"` → hoje, `segundos: -900` → 0, `historia: Infinity` → 0, `toqEsq: 9e9`
→ 5000, `toqDir: 3,7` → 3, `tochas: NaN` → 0, campo inventado não entra. `npm test` verde,
FPS 61, zero erro de console.

**Medido:** `index.html` 4.569.608 bytes (4,36 MB) — cresceu ~1 KB com os dois tickets; o teto
segue estourado e é assunto do T3.

**Próximo passo / dúvida deixada:** com a instrumentação no ar, ninguém ainda **lê** esses
números fora do próprio aparelho — responder H2/H5 de verdade continua dependendo de humanos
jogando (gap 1 do PM). E `zerarJogo()` apaga a retenção junto com o progresso: é o certo para
"apagar meu progresso", mas significa que um teste de usabilidade que zere o save perde a
janela dos 60 s. Se o dono quiser medir várias pessoas no mesmo aparelho, o lugar de decidir
isso é antes de recrutar.

## SVG pesaria menos? — a resposta que eu devia ter dado dias atrás

Pergunta do dono, feita em 2026-08-05 e **nunca respondida por mim** — achada na auditoria
de handoff de 07/08. Resposta com número, não opinião:

**Não, e para a maior parte da arte seria muito pior.** SVG ganha em forma vetorial chapada
(ícone geométrico, contorno, tipografia). Perde em qualquer coisa pintada — e perde
catastroficamente em **pixel art**, onde a representação honesta é um retângulo por pixel:
uma imagem de 256×256 viraria dezenas de milhares de `<rect>`. Compressão de imagem existe
exatamente para isso.

Onde SVG PODERIA ganhar aqui, medido: os ícones do HUD somam **18,9 KB** nos quatro
(folha 5,8 · cesto 5,6 · água 4,2 · passo 3,3). Mesmo trocando todos por SVG perfeito e
levando a zero, o ganho é **0,6% do arquivo**. Os quatro maiores blocos — cenário alto
(880), contextos (610), personagem (546) e cenário chão (465) — são **83% do peso** e
nenhum deles é vetorizável sem virar outra arte.

**Conclusão:** o caminho de peso não é formato, é (a) qualidade de encode, que já rendeu
−24,5% em 07/08, e (b) **carga sob demanda** — a única saída estrutural para 12 capítulos,
já que a ~380 KB por capítulo o teto volta a estourar no 6º.
### 2026-08-07 · Direção de Arte, onda 6: A TINTA DO PAPEL (worktree, para integrar)

**O mandato novo do dono** ("qualidade diferenciada, componentes que se conversem, não
quero um frankenstein, referências premiadas") está registrado no topo do `DIRECAO.md`
como barra permanente. Este sprint respondeu a ele em três entregas, todas no
`DIRECAO.md`: a seção de **referências premiadas** (Art of Fauna ADA 2025, Florence
ADA+BAFTA, Dandara, Afterplace ADA 2023, Alto's Odyssey ADA 2018, Never Alone
BAFTA+Peabody — com o que cada uma dá a ESTE jogo e por que a régua do Awwwards NÃO é a
nossa), a **auditoria de conversa** (o que ainda não fala a língua da casa, item a item,
com confirmo/derrubo/acrescento sobre a lista do PM), e **UMA frente funda**: a voz de
leitura.

**Feito (src/estilo.css + 1 troca em src/jogo.ts; zero imagem nova):** todo texto
corrido era Arial Black 900 — peso de manchete em corpo de parágrafo, quatro papéis
(data/título/corpo/fonte) num peso só. A régua ganhou a linha que faltava, por
derivação: **madeira e pedra falam bitmap 5×7; PAPEL fala serifa de caderno de campo**
(`--leitura`: Georgia → Noto Serif, tudo fonte do aparelho, zero rede). Hierarquia de
caderno: data em itálico de margem, título em negrito de verbete, corpo em redonda 400
com **entrelinha de 22 px = 2× a pauta de 11 px do papel** (a tinta senta na pauta),
fonte em itálico de citação. O QUANDO das placas da linha do tempo era o último texto
de sistema pregado em MADEIRA — virou `pixelRotulo` bitmap. `#cerQuando` virou serifa
de inscrição.

**Medido:** FPS 61/62/61 (piso 58) · `index.html` 3.451.684 → 3.454.226 bytes LF
(+2,5 KB, só código) · `npm test` verde 3× sem ajuste em teste nenhum · prints
`A6-*-antes/depois.png` + `A6-historia-marco-depois.png` em `test/`, olhados com a
pergunta do dono — a linha do tempo e DE ONDE VEM agora leem como caderno de
historiador; é a primeira vez que uma tela de leitura deste jogo responde sim.

**Próxima frente já diagnosticada (onda 7, no roteiro do `DIRECAO.md`):** os ícones do
motor antigo — folha procedural com contorno navy `#12242e` (cor proibida pela própria
paleta) ao lado de contadores autorais, a VARINHA mágica do jogo de rua no botão
dourado, e escala não-inteira 12→20/30 px (pixel desigual). Mapa de pixel é código:
zero imagem, meio dia.
### 2026-08-07 · A folha nova da ganhadeira: melhorou 4,7× e ainda não é um ciclo

A segunda folha de caminhada de SALVADOR (`assets/entrada/cap4-sprite-v2.png`) foi pedida como
*ciclo descrito pose a pose, 12 poses*, para consertar o defeito medido na primeira. Ela entrou
no jogo. **Não fechou.**

**O que a folha é, medido antes de cortar.** `validar-folha.js` sem grade: **8 manchas**, não
12 — o pedido dizia doze. Grade `4x2`, `4 | 4` por linha, zero fragmentos. Fundo magenta com
assinatura de salvamento com perdas (0,00% de `#FF00FF` exato, 81,71% a ≤48), franja média de
0,58 px, dentro do que o desfranjamento resolve. A pessoa é a MESMA de ponta a ponta: CV de
**0,3%** na largura do topo da figura entre os oito quadros. As figuras estão DESCENTRADAS nas
células (a quarta cruza a linha da célula em 1330 px) e mesmo assim o corte sai inteiro,
porque o recortador preenche a mancha na folha toda e reancora pela cabeça.

**ESCALA: a largura da cabeça mentiu, como avisado.** A ganhadeira leva um TABULEIRO na cabeça,
então o quinto superior da figura é a bandeja e o `medir-escala.js` mede a bandeja, não o
crânio — é por isso que a "cabeça" dela dá 15 px de mundo e a do capítulo 1 dá 10. Comparada
por CORPO (perfil de largura normalizado pela altura, 20 fatias, mediana entre quadros), a
razão v2/v1 no tronco é **1,056**: a mesma pessoa, desenhada 6% mais robusta para a mesma
altura. Menos de 1 px de mundo na tela. Não se reescalou nada.

**O NÚMERO, que é o que interessa.** Régua: `test/medir-sola.js --ciclo`, chão 2 px, a mesma
para todos. Medida agora, com a ferramenta, e não de memória:

| | ciclo | recuos do calcanhar | escorregamento |
|---|---|---|---|
| cap 1 PINDORAMA | 3 quadros | 47 / 47 | **0,00%** |
| cap 2 PALMARES | 3 quadros | 54 / 56 | **1,82%** |
| cap 4 AINDA AQUI | 3 quadros | — / 51 | não mensurável (1 transição) |
| SALVADOR, folha v1 (em uso até hoje) | 3, 4, 9 | 77 / 5 | **87,80%** |
| SALVADOR, folha v2 (entrou) | 2, 3, 4 | 26 / 38 | **18,75%** |

**Por que 18,75% é o teto desta folha, e não uma escolha preguiçosa.** Varridos por programa
TODOS os ciclos que a folha permite — 42 de três quadros, 89 de quatro, 110 de seis, 2 de oito.
Melhor de três: 18,75%. Melhor de quatro: 37,90%. A folha tem **8 poses e 2 fases**: os quadros
1, 4, 5 e 8 são o mesmo apoio duplo (calcanhar de trás em 57 / 58 / 55 / 56 px — três px de
amplitude entre quatro poses) e os quadros 2, 3, 6 e 7 são a mesma passagem (96 a 122). Entre
230 px (o pé acabou de tocar à frente) e 122 px não há UMA pose. É exatamente o mesmo buraco da
v1, com quatro poses a menos para disfarçá-lo.

**O que melhorou, e é por isso que a folha entrou mesmo assim:**

- escorregamento **87,80% → 18,75%** (4,7×);
- a sola desliza **4,4 px de MUNDO por segundo** contra **28,9** da v1 — 6,6× menos. (Conta:
  soma dos desvios do recuo ao longo do laço, incluída a costura, dividida pela duração do
  laço. É o que a pessoa vê.);
- a passada deixou de ser miúda: laço 96 px de sprite num quadro de 396 contra 106 num de 317.

**O que NÃO fechou, dito com o número:** 18,75% contra 0,00% e 1,82%. Uma ordem de grandeza. A
meta era a faixa das outras eras e ela não foi atingida — está escrito no `PASSO_CAP`, em cima
dos literais, para ninguém confundir esta linha com as outras três.

**O PEDIDO CIRÚRGICO PARA A PRÓXIMA FOLHA.** O que falta não é "mais poses": são **as poses do
APOIO** — o pé plantado no chão e o CORPO passando por cima dele, entre o instante em que o
calcanhar toca à frente e o instante em que o quadril alcança o pé. Na folha entregue esse
trecho vale 108 px de sprite (de 230 a 122) e tem zero poses. Quatro das oito poses entregues
são cópias do contato e **podem ser trocadas** por essas quatro sem perder nada: o pedido não
precisa ser maior, precisa ser redistribuído.

**Números do motor que mudaram junto** (`PASSO_CAP`, terceira linha, ordem de `EPOCAS`):
`laco` 106 → **96**, `alturaQuadro` 317 → **396**, `tela` 8 → **6**, `telaCorrer` 4 → **3**.
Velocidade 36,78 → **35,56 px/s**, −7,1% do capítulo 1 (era −3,9%). É o maior desvio das quatro
eras e não há escolha melhor: com `passo` = 3,556, `tela` 6 dá 35,56 e `tela` 5 daria 42,67 —
erra 2,70 contra 4,41 px/s. Fracionar o `tela` para acertar a velocidade é a armadilha nº 1 do
§7 e não se faz.

**Uma régua que se provou ruim e fica registrada.** A v1 derivou o `laco` da separação entre os
dois calcanhares no apoio duplo, porque as recessões eram inúteis. Medida agora no capítulo 1,
cuja caminhada é perfeita, essa separação dá 110 e 68 px enquanto o laço pelas recessões dá
141 — erra 58% onde não há erro nenhum a medir. Ela serve para saber que existe uma passada;
não serve para dizer o tamanho dela. O laço da folha nova saiu das **recessões**, como nas
outras três eras.

**PESO.** `index.html` **3.451.684 → 3.478.149 bytes (3.370,8 → 3.396,6 KB, +25,8 KB, +0,8%)**.
A folha entrou em **WebP 0,76**, a qualidade nova da personagem (`CLAUDE.md` §6), encodada já
na saída do recortador: `recortar-folha.js` ganhou `--qualidade=`, porque baixar depois com o
`requalificar.js` seria um segundo passo de compressão em cima do primeiro, e à toa, já que
aqui a fonte ainda é o PNG mestre. O bloco `HERO_B64.walk4` custa 48,7 KB (era ~32) — o quadro
é 283×396 contra 159×317, e a largura vem da pose de apoio duplo, que é larga de propósito.

**Ferramentas.** `montar-quadros.js` e `prints-cap4.js` **voltaram commitadas**: o `LEIAME.md`
citava as duas desde o capítulo 4 e a pasta não tinha nenhuma — ficaram para trás na integração
daquele worktree. `cortar-celulas.js` e `calibrar-ceu.js` continuam faltando, e agora está
escrito no LEIAME para a próxima sessão não procurar. `prints-cap4.js` custou duas armadilhas,
ambas anotadas nele: encher `energiaTotal` antes de escolher o capítulo faz `verificarCenario()`
empurrar a pessoa até a ÚLTIMA cena em poucos quadros (o primeiro print saiu de AINDA AQUI
achando que era SALVADOR), e a tela de abertura sobe UM quadro depois de o cenário mudar, o que
para o mundo pelo portão de `historiaAberta()` e congela o `worldX` para sempre.

**Medido no fim:** `npm test` verde, FPS 61, zero erro de console. Prints em `test/`:
`C4-passada.png` (o ciclo quadro a quadro com a linha de chão e a faixa do pé),
`C4-folha-v2.png` (as oito poses entregues, onde se vê a olho que 1/4/5/8 são a mesma),
`C4-rua.png` e `C4-anda-1..6.png` (o capítulo JOGANDO, seis fotos ao longo de um laço inteiro,
com o `worldX` de cada uma impresso).

**Próximo passo / dúvida deixada:** a decisão é do dono e é barata de reverter — a folha v1
continua em `assets/entrada/cap4-sprite.png` e voltar é um `--quadros=3,4,9` mais três números
no `PASSO_CAP`. A dúvida honesta: com 3 quadros e um laço de 10,7 px de mundo, ela troca de
pose 10 vezes por segundo, contra 6 do capítulo 1 — a cadência fica mais miúda que a das
irmãs, e isso é consequência direta de a folha não ter o meio do apoio. Se a terceira folha
vier com as poses de apoio, o laço cresce e a cadência se acalma sozinha.

## O ESCOPO FINAL, dito pelo dono em 2026-08-07 (noite)

Palavras dele: *"Quero que a gente foque no Brasil como um todo. Vamos falar da escravidão,
do navio negreiro, da situação que foi a abolição, todo o processo que o pessoal teve que
passar, da luta que as mulheres tiveram pra conseguir votar, pra ter voz na sociedade, todo
o processo da ditadura, todos os momentos até hoje. Polarização, escândalos de corrupção,
Covid. Falar da realidade do ponto de vista do Brasil desde o começo. Completar de uma forma
que a gente consiga **cutucar a ferida, mas conscientizar as pessoas e dar informação**.
De forma prática, ter tudo num lugar só."*

O jogo deixa de ser "três retratos" e passa a ser **a história do Brasil até hoje, num lugar
só**. O arco de 12 vira maior. A tese continua: bonito · divertido · ensina.

### As duas linhas que este escopo cruza, e que NÃO se decidem sem o dono

**1. O navio negreiro.** O §2.2 foi escrito exatamente sobre isto: pessoas escravizadas não
viram recurso, inimigo, obstáculo nem coisa a coletar. Um capítulo de tumbeiro é o pedido de
maior risco do projeto inteiro — e também o mais necessário, porque a travessia é o fato
fundador que o país mais evita olhar. A pergunta não é *se*, é *como*: quem é o sujeito, o
que a mão faz, e o que o jogo se recusa a encenar.

**2. Política contemporânea.** Polarização, escândalos de corrupção e Covid são história
recente com feridas abertas e partido no meio. O CLAUDE.md já proíbe pessoa real como
inimigo, e o projeto-mãe alertava contra "cara de palanque". Dizer a verdade com fonte é
obrigação; escolher lado partidário é o fim do jogo como ferramenta de consciência. Precisa
de uma REGRA escrita, não de bom senso caso a caso.

### O que isso custa, dito antes de começar

Peso: ~380 KB por capítulo. Já estouramos o teto uma vez hoje e voltamos a 3,36 MB cortando
24,5%. **Com 15+ capítulos, carga sob demanda deixa de ser opção e vira requisito** — e ela
quebra a regra do arquivo único, que já foi flexibilizada uma vez. Decisão do dono.

## O arco até hoje — aprovado pelo dono em 2026-08-07 (noite)

**A travessia: as duas.** `A TRAVESSIA` como transição entre PINDORAMA e PALMARES (90 s em
que a estrada vira água, o HUD some, o botão dourado não faz nada, e o jogo diz em voz alta
que não vai mostrar o porão e por quê) **e** `O CAIS QUE VOLTOU À LUZ` como capítulo — o
Valongo, escavado em 2011, patrimônio da UNESCO. Verbo: **trazer à luz**. Os três contadores
viram *o que veio no corpo* · *o que se fez aqui* · **o que ficou escrito** — este último é
o achado: mostra com a mão que o tráfico teve livro, imposto e lucro.

**O contemporâneo: sim, sob a REGRA DO DOCUMENTO** (§2.5 do CLAUDE.md). Covid entra pelo
registro do Ministério da Saúde, por Manaus, pela **ADPF 709** (a primeira vez que uma
organização indígena foi parte no STF — costura o fio indígena de 1500 a 2020) e pela CPI
**ensinada como instituição**: *pedir indiciamento não é acusar, e acusar não é condenar*.
O vocabulário de acusação do relatório fica FORA. Corrupção começa no séc. XVIII, nomeia
lei e órgão, nunca pessoa, e cita caso sempre com condenações **e** anulações juntas.

### O arco de 12, na ordem cronológica

pré-1500 (2 caps., pendentes) · **1** PINDORAMA ✅ · *A TRAVESSIA* (transição) · **2**
PALMARES ✅ · **3** O CAIS QUE VOLTOU À LUZ · **4** SALVADOR ✅ · **5** JABAQUARA (1887–88:
a abolição foi arrancada por quem fugiu, não concedida por quem assinou) · **6** A PEQUENA
ÁFRICA (com o branqueamento como marco, não como capítulo — capítulo de Hospedaria teria o
imigrante europeu como protagonista, que é a visão que o dono mandou evitar) · **7** AS
PORTAS (o voto de 1932 valia para quem sabia ler; a exigência de alfabetização só caiu em
1985 — a mulher negra trabalhadora esperou mais 50 anos) · **8** O QUE NÃO PODIA SER DITO ·
**9** A PRAÇA · **10** O QUE SEGUROU (Covid) · **11** O QUE TEM FONTE · **12** AINDA AQUI ✅
(move para o fim, com migração de save UMA VEZ SÓ).

**A rima que é o achado narrativo do arco:** `levar palavra` em 1835 (cap. 4) e `fazer
passar` em 1968 (cap. 8) são **o mesmo verbo com 230 anos de distância**. Quando a pessoa
reconhece a mecânica na mão, aprendeu sozinha a tese do jogo — as tecnologias da resistência
se repetem porque as da repressão também.

**A frase que é a régua do arco inteiro:** o jogo nunca pede à pessoa que faça, com a mão,
aquilo que ele está condenando. Cavar para saber, levar recado, fazer passar a folha, chegar
na última casa, conferir de onde vem — cinco verbos, e **nenhum deles é o verbo de quem
manda**.

### Lotes de produção (parar em qualquer um deixa arco completo)

**A** migração + AINDA AQUI para o fim + A TRAVESSIA + marcos de 1700–1888 · **B** O CAIS ·
**C** JABAQUARA + PEQUENA ÁFRICA (**juntos, obrigatoriamente**: abolição sem o dia seguinte é
a mentira que a escola conta há um século) · **D** AS PORTAS · **E** O QUE NÃO PODIA SER DITO
+ A PRAÇA (**juntos**: ditadura sem redemocratização termina o jogo na derrota) · **F** O QUE
SEGUROU + O QUE TEM FONTE.

**Bloqueio que a fila atropela:** o peso estoura no capítulo 6, e a fila chega a seis no lote
C. **Carga sob demanda vira requisito no lote B/C** — e quebra o arquivo único de saída.
⚠ decisão do dono, ainda aberta.

### Direções da noite de 2026-08-07 (o dono dorme ~9 h)

1. **A HISTÓRIA vira QUADRINHO.** Palavras dele: *"vamos tentar transformar ela num
   quadrinho, imagens e texto pra ficar bem bonita… a ideia é que a pessoa role e não fique
   uma lista, então a tela toda vai se transformando de uma forma bonita, sem aparecer
   scroll."* Ou seja: a linha do tempo deixa de ser lista rolável e vira **narrativa
   visual** — a tela se transforma conforme se avança. Ele pode gerar imagens, e nós
   também temos licença de criar.
2. **O jogo mais fluido**, revendo três coisas que ele nomeou: **objetos que estão
   aleatórios**, **fundos que não fazem sentido**, e **imagens que não se conversam**.
3. Continuar o arco (lote A), manter tudo integrado e testado, e otimizar até de manhã.
4. Operacional: não travar; handoff antes do limite de contexto e seguir rodando.

## Diário — 2026-08-07 (madrugada) · Direção de Arte · Onda 8: A HISTÓRIA vira quadrinho

**O que fez.** O pedido da noite do dono, item 1: a tela A HISTÓRIA deixou de ser lista
rolável e virou quadrinho — uma página de tela cheia por nó da `LINHA_TEMPO`, rolagem com
encaixe obrigatório (scroll-snap), barra de rolagem inexistente, e a tela se transformando
DIRIGIDA PELO ROLO (view-timeline: imagem revela e assenta, papel sobe e pousa; rolar
devagar transforma devagar). Composição por tipo de página: marco alcançado = a pintura do
capítulo sangrada até as bordas com a placa de madeira por cima; momento de capítulo = a
paisagem de contexto (`CTX_B64`) abrindo o quadro e dissolvendo sobre o papel-legenda;
marco de vão = papel sobre página escura, SEM paisagem — decisão de §2 tanto quanto de
composição: paisagem bonita sob "a travessia forçada" afirmaria um clima que o texto não
afirma. A paisagem de um momento é a do capítulo do último marco passado na CRONOLOGIA
(Zumbi → serra de Palmares, nunca o porto de Salvador, embora se revele no capítulo dele).
O cipó continua: atravessa cada página pela esquerda e desvanece nas duas pontas, pelas
razões de sempre. Marco não alcançado segue sem lore (teasers e "E MAIS N" viram páginas).
Referência registrada no DIRECAO.md: Florence (ADA 2018 · BAFTA 2019), o quadrinho jogável.
Território: `src/estilo.css` (bloco A HISTÓRIA reescrito), `montarCompletude` em
`src/jogo.ts`, `test/prints-quadrinho.js` (instrumento novo). `EPOCAS` e o laço de quadro
não foram tocados.

**O que mediu.** ANTES: rolo de papel contínuo de 4.585 px (7,0 telas de lista). DEPOIS:
26 páginas de tela cheia no fim de jogo, 16 no início. Interpolação da transformação
confirmada com o snap solto: opacity da imagem 0,49→0,98 e papel translateY 44→1,5 px ao
longo de uma virada (4 pontos, getComputedStyle). FPS 61 no smoke (piso 58);
content-visibility: auto nos quadros. Peso 3.472.301 → 3.477.734 bytes LF (+5,4 KB, só
código); ZERO imagem nova; zero rede; `npm test` verde sem ajuste em teste nenhum. Prints
`Q-antes-*` e `Q-depois-*` em `test/` (páginas 8/17/19/25 do fim de jogo, início de jogo,
e `Q-depois-meio-transicao.png` no meio de uma virada), olhados um a um com a pergunta da
barra — a placa de PALMARES sobre a própria serra pintada e "E eles continuam aqui" sobre
a terra demarcada vista do alto respondem sim.

**O que quebrou (e foi pago).** Duas armadilhas, anotadas no instrumento: (a) `view()` no
FILHO termina cedo — a imagem completava a entrada com meia página e o papel só começava
no fim; o relógio certo é a view-timeline NOMEADA no quadro, os filhos escutam. (b) o
encaixe obrigatório re-encaixa scrollTop programático antes do screenshot — medição de
meio de virada sai binária se o snap não for solto só para a foto. E o primeiro print do
ANTES saiu com o FECHO do último capítulo por cima da tela: `energiaTotal` no teto dispara
o fim do jogo; o instrumento usa `LIMIAR_FIM - 200`.

**Dúvida nova.** As páginas escuras dos marcos de vão (4 seguidas no vão XVI→XVII quando
tudo estiver revelado) são deliberadas, mas quando o dono gerar imagens novas, esses vãos
são o primeiro lugar onde arte dedicada renderia — anotar na mesa dele: "a cidade africana"
e "as ganhadeiras" aceitariam paisagem de Salvador; "a travessia forçada" NÃO aceita
paisagem nenhuma (§2.4). Também fica para depois: um toque na metade de baixo/cima da tela
poderia virar página — só se alguém medir que o rolo não basta.

**Próximo passo.** Onda 7 (ícones falam a língua da casa) continua na fila com diagnóstico
pronto. QA deveria acrescentar ao smoke uma asserção de que `#listaCenas` tem
`scroll-snap-type` e barra invisível — hoje só os prints garantem.
## LOTE A, parte 1 — a migração por identidade e A TRAVESSIA (Dev, 2026-08-07)

### 1. O presente no fim, e a migração que não se repete mais

**Achado antes de mexer:** `AINDA AQUI` **já era** o último objeto de `EPOCAS` — o array está
em ordem cronológica desde que SALVADOR entrou. O ticket pedia "mover para o fim uma vez só
para não repetir a migração a cada capítulo", e mover não resolveria isso: capítulo novo
inserido acima dele desloca o índice dele de qualquer jeito, e o save guarda índices. O que
resolve é **parar de identificar capítulo por posição**.

Feito: cada época ganhou um `id` imutável (`pindorama`, `palmares`, `salvador`, `hoje`), e a
tabela de arcos deixou de ser duas listas de números escritas à mão (`ARCO0_CENA`,
`ARCO0_EPOCA`, apagadas) para ser uma lista de **linhas de arco** — `[id, cenas]` por
capítulo. A linha do arco de hoje **deriva de `EPOCAS`**, então não há como esquecer de
atualizá-la, e `ARCO_ATUAL` é só o índice da última linha. `migrarArco()` continua sendo a
única migração (foi estendida, não substituída): casa `id` com `id`, deriva a cena nova de
`EPOCA_CENA0` + o deslocamento dentro do capítulo, e remapeia `aberturas`, `fechos` e
`acolhidos` bit a bit / posição a posição.

**Custo de acrescentar um capítulo, a partir de agora:** pôr o objeto em `EPOCAS` acima de
AINDA AQUI e copiar para `ARCOS_ANTIGOS` a linha do arco de ontem. Nenhum número à mão. Serve
também para época que muda de tamanho — quando a 2ª pintura de SALVADOR chegar e `cenas`
virar 2, é o mesmo procedimento.

`S.arco` deixou de ser literal em `S` e passa a ser atribuído de `ARCO_ATUAL` logo abaixo de
`ARCOS`: literal repetido em dois lugares era uma dessincronia esperando acontecer — bastava
esquecer de somar 1 para toda partida nova ser "migrada".

**Medido (smoke, 5 casos novos além dos 4 que já existiam):** save do arco 0 no meio de
Palmares acorda em `PALMARES@2`; na 2ª cena de Palmares, em `PALMARES@3` (o deslocamento
dentro do capítulo sobrevive, e as 4 acolhidas viajam com ele); save já do arco atual sai
intocado (`SALVADOR@4`, aberturas 5); save com `arco: 9` (adulterado, ou de uma versão futura)
não é reescrito; `cenario: 99` apara em `AINDA AQUI@6`.

### 2. A TRAVESSIA — o trecho em que o jogo para de ser jogo

Transição entre PINDORAMA e PALMARES, disparada na virada de capítulo, na ordem
**fecho → travessia → troca de cena → abertura**. Não é capítulo: não tem cenas, não tem
economia, não entra em `EPOCAS`. Vive em `TRAVESSIAS`, com `de`/`para` por `id` — quando não
há travessia declarada entre dois capítulos, o caminho é o de sempre.

O que ela faz, item por item do desenho aprovado:

- a estrada vira água: o quadro inteiro é `desenharTravessia()` — pintura (`#fundoHD`) e
  personagem (`#heroHD`) limpas, mar e céu na camada pixelada do mundo;
- **nenhuma figura humana em cena**: o retrato da caixa de fala sai (`body.travessando`), e a
  rua é esvaziada ao entrar (chegadas, drops, folhas, fila, moradores);
- HUD e cartões somem; **o botão dourado continua ali e não faz nada** — `clicar()` e
  `pular()` saem na primeira linha enquanto `travessiaAtiva()`, o que vale também para o
  segurar e para a ajuda automática do u3;
- o texto diz isso em voz alta, na 2ª linha: *"Aqui o jogo não tem o que você fazer. Não foi
  esquecimento."*;
- o céu escurece pelo sistema de luz que já existe: o relógio é posto no fim da TARDE e corre
  a 10× (~90 s reais = 2 h do ciclo), terminando dentro da NOITE — e a cerimônia de PALMARES,
  logo depois, varre a luz até o nascer do sol. O capítulo novo abre de manhã do outro lado
  do mar;
- **não é pulável na primeira vez**: o bit `S.travessias` (novo no `ESQUEMA_SAVE`) esconde o
  PULAR enquanto estiver apagado.

**Sem arte nova, como pedido.** Céu por `rampaCeu`, água por duas cores passadas em
`luzDoDia`, horizonte a 1 px e vagas como riscos horizontais com espaçamento em potência
(perspectiva por compressão, não por câmera). Zero KB: o `index.html` continua em 3,33 MB.
O horizonte foi posto em `0,40·H` e não em `0,52` **olhando o print** — a 0,52 sobravam 47 px
de tela de água entre o horizonte e a caixa de texto, e a tela lia como céu com uma tira
escura embaixo; a 0,40 sobram ~165 px e a água é o quadro. Prints:
`test/trav-1-cerimonia.png`, `trav-2-linha1.png`, `trav-3-recusa.png`, `trav-4-fim.png`
(o mundo voltando inteiro), e `shot-travessia.png` do próprio smoke.

**⚠ O TEXTO É RASCUNHO, marcado no código.** Doze linhas, do dono palavra por palavra. Só
dois fatos, os que este NOTES.md já sustentava: o açúcar como motivo (Schwartz, *Segredos
internos*, 1988) e o volume — "de cada dez que atravessaram para as Américas, quase cinco
desembarcaram aqui" (*Trans-Atlantic Slave Trade Database*, SlaveVoyages.org), a mesma frase
que já está no marco "A travessia forçada" da LINHA_TEMPO. **Nenhum número novo entrou.** A
linha central é a recusa nomeada em voz alta: o jogo diz que não vai mostrar o porão e diz
por quê (a imagem de 1788 foi feita para chocar quem podia acabar com o tráfico; num jogo de
2026 ela desenha pessoas como padrão de carga) — §2.4.1 do CLAUDE.md. E diz que não vira
desafio: sem barra de água, ar ou ração (§2.4.4). Nunca "escravo" como identidade (§2.4.8).

**Medido (smoke, bloco novo):** durante a travessia, 40 toques + 1 pulo + 900 ms de mundo
rodando rendem **0,00 de impacto** e **0 objetos nascidos**; o botão dourado continua com área
na tela; PULAR e retrato com `display: none`; o relógio do dia andou 9 s em 900 ms (o 10×). Ao
terminar: o mundo volta a andar (19,8 px), o bit fica gravado, a segunda travessia já nasce
pulável, e `fecharTelas()` não deixa estado para trás.

**Um teste teve de mudar de alvo:** o FLUXO 2 (a varredura de luz da virada termina no nascer
do sol) media a virada do capítulo 1 para o 2 partindo de duas horas diferentes. Com a
travessia no meio, a hora de partida é apagada antes da cerimônia, e medir "de que hora se
parte" deixaria de medir. O mesmo contrato passa a ser medido na virada 2→3, que não tem
travessia; as duas horas de partida continuam lá.

**Dúvidas deixadas, nenhuma decidida sozinha:**

1. O botão dourado continua exibindo o rótulo `+1.0` durante a travessia. Mantive idêntico
   porque "o botão continua ali" é a frase do desenho, e rótulo alterado seria uma dica — mas
   é a única coisa na tela que promete algo que não vai acontecer. Direção de Arte decide.
2. A travessia **repete** toda vez que se cruza a fronteira (com PULAR, da segunda em diante).
   A alternativa seria só na primeira. É ritmo de produto, não código: PM decide.
3. Entrar em PALMARES pela tela de seleção de capítulo **não** passa pela travessia — o
   caminho da seleção nunca passou por fecho nem por fronteira. Se a travessia tiver de valer
   ali também, é ticket.
4. O horizonte é gradiente + vagas. Está honesto, não está impressionante. Se a Direção quiser
   a perna *bonito* no mesmo patamar dos capítulos pintados, é uma pintura de mar aberto — e
   aí o pedido volta para o dono gerar.
## Diário — 2026-08-07 · Dev · as três queixas do dono, medidas

Fui atrás das três queixas jogando e medindo, não supondo. Instrumentos novos:
`test/medir-conversa.js` (censo de arte por capítulo + eixo de espelho e degrau da emenda no
fundo + luma por bloco de arte contra a pintura) e `test/folha-objetos.js` (folha de contato
de todo objeto de mundo no tamanho de tela, com luma e R−B ao pé de cada um).

### O que a medida DERRUBOU

**Não há índice de arte errado em capítulo nenhum.** `MOB_B64`, `DROP_B64`, `FRENTE_CAP`,
`PASSO_CAP`, `HERO_CAP_B64`, `RETRATO` e `CEU_PINT` têm todos o comprimento certo (4, 4, 4,
4, 4, 4 e 7) e SALVADOR recebe exatamente o que a abertura dela promete: tabuleiro, balde
d'água e trouxa de roupa atravessando; acarajé, pano da costa e búzios no chão;
`FRENTE_CAP[2] = −1`, sem rodapé de mata na ladeira. A hipótese do índice trocado está
morta — o conteúdo por capítulo está certo.

### O que a medida CONFIRMOU, com número

| onde | medida | o que é |
|---|---|---|
| SALVADOR, peça de cima | eixo de reflexão em cena em **29% dos quadros**; uma largura de pintura = 1,56 tela = 249 px de mundo | o espelho que salva a mata destrói a fachada: catedral simétrica impossível, ladeira bifurcando em duas iguais |
| SALVADOR, as duas peças | cima a 0,45 e baixo a 1:1, **com a junta reta sob o pé dela** | mais de um terço da rua VISÍVEL é peça de cima: a metade de longe da mesma ladeira deslizava a menos da metade da velocidade da de perto — o §7 acontecendo 1 px acima da linha |
| SALVADOR, emenda | degrau de luma **26,0** entre linhas vizinhas | o `matoDaEmenda()` esconde a emenda nas seis pinturas de mata; em rua de pedra ele (certo) não roda, e o corte fica nu |
| AINDA AQUI, `mob.drum` (galão) | **R−B = −174**, único frio entre 42 objetos (os outros 41 vão de +1 a +141) | o objeto mais fora da conversa do jogo inteiro |
| SALVADOR, `mob.smog` (tabuleiro) | **56% da borda DIREITA do quadro opaca** | cortado pela célula (§5): na rua lê como bloco claro flutuando |
| SALVADOR, `mob.drum` (balde) | **51% da borda ESQUERDA opaca** | mesmo corte |
| AINDA AQUI, `mob.drum` | 25/25/26/31% nas quatro bordas | desenhado enchendo o quadro, cortado dos quatro lados |
| todos os capítulos | aura creme `#f3dda6` (luma 219) no chão de todo objeto `parado`, raio ~2× o objeto | o "lugar de espera" foi desenhado para PALMARES, onde quem chega é gente e o anel substitui a barra de vida (§2.2) — e roda em todos, virando círculo mágico sob um pote e sob um tabuleiro |
| drops, em todo capítulo | contorno do "+" em `#12242e` | o navy que a régua da DIREÇÃO proíbe, agora no mundo e não só no HUD |

### O que consertei (código e dado, zero imagem nova)

**A regra de repetição do fundo deixou de ser uma só e virou dado por pintura**
(`REPETICAO_PINT`, ao lado de `CEU_PINT` e na mesma ordem de CENAS). Cada entrada é
`[espelha a peça de CIMA, fração da peça de cima, costura a emenda, espelha a de BAIXO]`. As
seis orgânicas ficam com os valores de sempre e mediram **bit por bit iguais**; só SALVADOR
muda, e muda pelo que a pintura é:

1. **O espelho é por PEÇA, não por pintura** — medido no print, não deduzido. Desligar o
   espelho na pintura inteira trocava a catedral impossível por um corte vertical duro
   atravessando o calçamento de PERTO, que é onde o olho está. Fachada não espelha;
   calçamento é textura e espelha sem deixar rastro. Prints `JUNTA-*.png` (as quatro
   combinações no pior worldX) e `CONVERSA-A/D-salvador-wx400.png`.
2. **A ladeira inteira anda junta** (fração 1 em Salvador): some o deslize contínuo sob o
   pé. O preço, dito por inteiro: a junta da peça de cima passa a cada 249 px de mundo
   (~7 s) em vez de 553 (~15,5 s). Aceitei porque o deslize é permanente e a junta é
   intermitente, e porque o §7 nomeia o deslize como o erro fatal.
3. **A emenda ganhou costura** onde nada a cobre: as últimas linhas da peça de cima são
   reesticadas 0,8% da altura abaixo da junta, em 6 faixas esmaecendo — vira sombra de
   recessão, não linha de barbeiro. Nenhum pixel inventado: é tinta que já estava ali.
   Calibrado por varredura (0,006 a 0,014 de banda × 4 a 10 faixas).

**Medido, antes → depois:** eixo de reflexão em cena em SALVADOR **0,29 → 0,00** (simetria
mínima 0,7 → 9,0); degrau da emenda **26,0 → 12,6** no perfil de linha e **46,8 → 20,5** na
média da junta; as seis pinturas de mata inalteradas nas duas medidas. FPS 61/62 no smoke
(piso 58); `npm test` verde sem tocar em teste nenhum; renda/min nas seis células do
`medir-poluicao.js` variou de −3,5% a +2,9% (limite ±10%) — e não podia variar de outra
coisa senão ruído, porque nada aqui toca spawn nem economia.

**Gancho novo:** `window.setRepeticao(cena, espelhaAlto, fracao, costura, espelhaChao)`,
porque esta escolha é um confronto de defeitos e ninguém decide sem ver as combinações lado
a lado no mesmo quadro.

### O que NÃO consertei, e por quê

- **Os três objetos cortados pela célula** (tabuleiro e balde de Salvador, galão de hoje):
  pixel que o corte comeu não existe mais. É pedido de arte.
- **O galão azul**: o conteúdo está certo (é o que um galão de água é hoje, e é o único
  objeto industrial do jogo); o que não conversa é o traço, liso e envernizado. Passe de cor
  não conserta traço, e mudar a cor de um galão de água seria mentir sobre o objeto.
- **A aura do lugar de espera fora de Palmares** e **o navy do "+"**: são SINAL, não cenário.
  Mexer neles muda a leitura de uma mecânica e a gramática de sinal do jogo inteiro — sobe
  para a DIREÇÃO com o número, não se decide no meio de um conserto de arte.
- **"cacho de fruta no galho"** na abertura do capítulo 1 (`EPOCAS[0]`): o texto ainda promete
  pendurado, e o dono mandou tudo encostar no chão em 2026-08-07. É uma palavra, mas `EPOCAS`
  é território de outro agente nesta rodada.

## Diário — 2026-08-08 · Direção de Arte · Onda 7: os ícones falam a língua da casa

**O que fiz.** Os ícones desenhados do chrome eram a última herança visível do motor de
rua: contorno navy `#12242e` (a cor que a paleta proíbe), a varinha mágica no botão
dourado, e escala não-inteira. Tudo trazido para a régua — detalhe por detalhe e a
derivação escrita na seção "Onda 7 — IMPLEMENTADA" do `DIRECAO.md`. Território: só
`src/estilo.css`, o molde `src/index.html` e a região de ícones de `src/jogo.ts`
(`ICONS`/`renderIcon`, `texto`, `desenharFolhas`, a placa do "+"). Zero imagem nova:
mapa de pixel é código, como a onda 1 fez com os vaga-lumes.

**O que medi.** Instrumento novo `test/prints-onda7.js` (não toca nos scripts do QA):
- ANTES: `leaf` 12→20 px (**1,67×**), varinha 12→30 (**2,5×**), `up` 12→20 (**1,67×**)
  e — achado que a auditoria não tinha — `modeIcon` autoral de 26 px ENCOLHIDO a 20
  (**0,77×**). DEPOIS: **oito ícones, oito razões inteiras** (1×, 2× e 3×).
- Navy no `index.html` construído: das 5 ocorrências em desenho para **0** (sobra 1, em
  comentário que proíbe a cor). Contornos agora `#191510`, a tinta do degrau das lajes.
- FPS **62/61/62** em três rodadas (piso 58). Peso 3.503.451 → **3.504.101** bytes
  (**+650 B**, só código — os 8 ícones órfãos do motor saíram junto: bolt, tired, house,
  torch, sun, hands, gear, flame, nenhum `data-i` os chamava).
- `npm test` verde sem ajuste em teste nenhum. Prints `O7-*-antes/depois.png` em `test/`.

**O que quebrou.** Nada — mas a primeira iteração do ícone de MENU (duas tábuas num
cabo) saiu com a MESMA silhueta em T do martelo de MELHORIAS ao lado; o print pegou,
virou três tábuas. E o cetro da primeira passada lia como espelho de mão; as folhas do
aro ficaram simétricas e ele assentou. Duas iterações a mais, pagas pelo print.

**Decisão de direção que o Dev tinha subido para cá**: o navy do "+" de pickup. A
gramática do sinal NÃO mudou (segue a coisa mais escura do quadro com ouro em cima);
só a tinta da placa entrou na casa. A aura do lugar de espera continua INTOCADA — está
com o dono; deixei uma proposta anotada no roteiro do `DIRECAO.md`, sem mexer.

**Dúvida nova.** O chip de impacto e os três contadores agora têm a mesma laje e a mesma
malha — mas o chip usa folha 2× ao lado de arte autoral 1×, e a diferença de grão é
visível a quem procura. Se um dia incomodar no aparelho real, o caminho é arte autoral
de 26 px para a folha do chip (pedido de mesa), não esticar o mapa.

**Próximo passo.** O roteiro está sem onda aberta de ícones; a frente que o critério do
produto pede é medir de novo a pergunta do dia 2 antes de qualquer polimento novo.
## Diário — 2026-08-08 · Dev · SPRINT 2 T1: SALVADOR ganha o verbo que o texto já prometia

**A dívida, medida pelo PM antes de eu tocar em nada:** SALVADOR rendia 31,2 impacto/s contra
24,35 de PALMARES — isto é, jogava byte a byte como o capítulo 1. A abertura promete *"aqui,
alcançar é levar palavra: quem você alcança passa a saber o que precisa saber"* e a mão fazia
o mesmo que faz numa mata: bater até a coisa sumir. Não é queixa de diversão, é a perna
ENSINA falhando por dentro — e é a única das três que não aparece em print nenhum.

### O que passou a acontecer

**Quem é alcançada não se dissipa: vira PORTADORA e sobe a ladeira.** Descia com a carga;
recebida a palavra, acena (a luz morna do capítulo 2, a mesma) e volta por onde veio, no
sentido da protagonista e mais depressa que ela. É o único vulto da rua que anda para a
direita, e é isso — não um medidor — que diz quem já sabe.

**A palavra corre sem o dedo.** Subindo, ela cruza com quem ainda espera (janela de 14 px de
mundo, uma largura de corpo) e a espera é atendida ali: mesmo `registrarChegada(true)`, mesmo
que-ela-trazia ficando no chão, e a recém-atendida vira portadora também. Corrente, não
coleção. A decisão nova é QUEM alcançar primeiro, porque a corrente sobe a partir de onde
nasceu — alcançar quem está no fim da fila deixa metade da rua para trás.

**A gramática de combate saiu do capítulo, como saiu do 2.** Pisca branco, estilhaço, empurrão
de 10 px e barra de vida sobre a cabeça: nada disso sobrevive onde quem atravessa a rua é
gente. `capGente()` continua sendo só PALMARES (é lá que existe fila); a régua do §2 passou a
ler `pessoaNaRua()`, que é PALMARES **e** SALVADOR, para ninguém precisar lembrar de dois
lugares no próximo capítulo. O progresso é lido no CHÃO, no anel do lugar de espera enchendo —
a mesma substituição que PALMARES já fazia.

### O sinal, e por que ele é este

Zero elemento novo de vocabulário (critério de aceite do sprint) e zero HUD. É a MESMA luz
creme do lugar de espera, dizendo outra coisa pela FORMA:

| quem | desenho | o que diz |
|---|---|---|
| espera | dois anéis LARGOS (r 15 e 21) + poça, respirando devagar | um lugar reservado, e lugar é coisa parada |
| já sabe | UM anel APERTADO (r 9), firme, quase sem respiração | não é lugar: é luz que ela LEVA |

Traço e não só mancha, pela lição que já estava escrita duas telas acima no arquivo: a 1 px
numa tela de 160 px de mundo, mancha sozinha some contra a terra pintada. O par lado a lado,
a 3× de ampliação, está em `test/PALAVRA-D-lado-a-lado.png` — é o print que decide, e ele
decide a favor.

### Medido, antes → depois (`test/medir-poluicao.js`, células de 60 s)

| célula | renda/min antes | depois | Δ |
|---|---:|---:|---:|
| cap 3 andando | 1827 | 1801 | **−1,4%** |
| cap 3 correndo | 1971 | 2030 | **+3,0%** |
| cap 1 e cap 2 | 1386 / 1493 / 1465 / 1555 | 1369 / 1451 / 1451 / 1538 | −1,2% a −2,8% (ruído: nada os toca) |

Dentro dos ±10% do contrato, e por uma razão estrutural e não por sorte: segurando o botão o
jogador já atendia quase toda a rua, então a corrente atende quem ele atenderia — o que ela
muda é DE QUEM é o gesto, não quantos drops nascem. Sem dedo nenhum a corrente **não nasce**
(medido: 0 atendidas em 60 s de rua sem toque), o que era o risco real de virar renda passiva.

**A corrente, em número:** 60 s segurando o botão em SALVADOR = 15 atendidas pela mão e 12 pela
palavra. Um único alcance, com o dedo fora do vidro depois dele, atende mais 2 (asserção nova
do smoke).

**O que PIOROU, dito por inteiro:** a média de objetos em cena do cap. 3 subiu de 3,57 para
4,23 andando e de 3,92 para 5,17 correndo; o pior caso correndo foi de 6 para 9. A portadora
fica em quadro enquanto sobe, e isso é gasto de tela. Já foi cobrado uma vez: a 34 px/s de
tela ela levava 8,5 s para atravessar e a média correndo batia **6,34** com pior caso **11** —
a trava 3 do dono quebrada pela mecânica nova. Passou para 68 px/s (4,2 s de travessia) e o
número caiu para o patamar acima, que é o do capítulo 1 (4,71 / 5,43). Fica declarado: o
capítulo 3 deixou de ser o mais limpo dos três e virou o segundo. Se a Arte achar caro, o
botão é a velocidade — e ela mexe nos dois números ao mesmo tempo.

### A DÍVIDA QUE NÃO CONSERTEI, e ela é de representação

**Alcançar continua sendo `m.hp -= dmg`:** cinco a treze toques até a pessoa "passar a saber".
Tudo o que APARECE do combate saiu (pisca, estilhaço, empurrão, barra), e o que a mão faz
DEPOIS de alcançar virou outra coisa — mas a forma do gesto ainda é bater por baixo, com nome
novo por cima. Não se esconde: fica aqui e vai ao PM como ticket próprio.

**E o pedido de arte que este ticket não pôde fazer sozinho:** em SALVADOR quem atravessa a
rua é desenhado como **o objeto sozinho** — tabuleiro, balde d'água, trouxa de roupa —, sem
pessoa. O desenho do historiador diz "aguadeiro, carregador, outra ganhadeira", e o §2 diz
que o sinal mora na PESSOA. Hoje ele mora num tabuleiro que anda. Com arte de gente (mesmo
molde do capítulo 2: uma folha de caminhada, magenta `#FF00FF`, célula igual), "acena e muda o
passo" deixa de ser metáfora e o capítulo fecha as três pernas. Sem ela, o verbo está no
código e meio no olho.

### Fontes

Nenhuma afirmação histórica nova entrou nesta rodada — o texto da abertura e do fecho de
SALVADOR não mudou uma vírgula (é rascunho do dono, palavra por palavra). As fontes do
capítulo continuam as já registradas: João José Reis, *Rebelião escrava no Brasil* (2003);
Cecília Moreira Soares sobre as ganhadeiras; Lisa Earl Castillo; Wlamyra Albuquerque.

### Instrumento novo

`test/prints-palavra.js` — encena a mesma rua quatro vezes do mesmo `worldX` e na mesma hora:
A (três esperando), B (a primeira alcançada), C (dois segundos depois, sem dedo), D (a lupa de
3× com portadora e quem espera lado a lado). Prints `test/PALAVRA-*.png`.

### Próximo passo e as dúvidas que ficam

1. **Ao dono, e é o §2:** a arte de gente para SALVADOR (acima). É o que separa "o verbo existe"
   de "o verbo se lê".
2. **À Direção de Arte:** o anel apertado da portadora é meu risco, não o dela — o `SPRINT.md`
   §6.2 pede UMA decisão dela sobre esse sinal. Ele está no ar e é reversível numa função.
3. **Ao PM:** os 5 a 13 toques por pessoa (dívida acima), e se a portadora deve poder levar a
   palavra também a quem já DESISTIU de esperar. Hoje não pode, de propósito: "cruza com quem
   está esperando" é a frase do desenho, e quem seguiu caminho seguiu.

## Diário — 2026-08-08 · Direção de Arte · Onda 9: o quadrinho aberto, o scroll leve e o fundo de toda fala

**O que fiz.** As três correções do dono ("sempre a imagenzinha do fundo… não deixa só
texto" · "scroll amigável, não travadão" · "imagens sempre tela cheia") mais a mudança de
natureza que chegou no meio do sprint: pelo MENU, A HISTÓRIA fica **toda desbloqueada de
ponta a ponta**, o **personagem comenta** as páginas, **nada é desenhado** (arte que falta
vira pedido de imagem VERTICAL para a mesa) e a entrega central é a **sobreposição de
texto**. Território: `src/estilo.css`, `montarCompletude`/`abrirFala` (+ os campos
`com`/`quem` da `LINHA_TEMPO`) em `src/jogo.ts`. Detalhe por detalhe na seção "Onda 9"
do `DIRECAO.md`.

**O que medi.**
- **B3 do QA, pago:** as 26 páginas têm fundo opaco; dois prints do mesmo quadro a 800 ms
  agora são idênticos, e o eixo de espelho da mata sumiu da última página
  (`Q-depois-cheia-0/2.png`). A fala do jogo tinha o MESMO vazamento (personagem andando
  atrás do texto, `FALA-antes-abertura-tela.png` vs `-mexeu`) e agora abre sobre a pintura
  do cenário, parada (`FALA-depois-*`). A travessia continua só mar e céu
  (`FALA-depois-travessia.png`).
- **Scroll** (`test/medir-scroll.js`, antes na build da main): arrasto curto de 300 px era
  REBOBINADO a 0 pelo `mandatory`; agora fica onde o dedo deixou (285). Soltar a ~90 px da
  borda assenta NELA (resto 0) antes e depois — o encaixe não morreu. Limite do
  instrumento, declarado: este headless não produz fling de toque com momento, então o
  ganho de "arremessos até o fim" só se verá em aparelho real (com `stop: always`, todo
  arremesso parava na página seguinte por construção).
- **FPS 60/61/60** em três rodadas (piso 58). Peso 3.504.101 → **3.522.051** bytes LF
  (+17,5 KB, só código e texto — zero imagem nova). `node test/smoke.js` **PASS 3×**, sem
  ajuste em teste nenhum do repositório.
- Prints página a página das famílias novas: `QP-depois-pag02` (papel + comentário),
  `pag08` (pintura em tela cheia + paisagem de contexto + comentário), `pag12` (marco duro
  em papel, em silêncio), `pag14` (selo VOCÊ ESTÁ AQUI), `pag20` (marco SALVADOR), `pag26`
  (ponta final opaca).

**O que quebrou.** Nada no smoke — mas o primeiro `prints-paginas.js` semeou
`energiaTotal` acima do limiar e o `verificarCenario()` disparou fecho+cerimônia POR CIMA
da tela (o B1 do QA, reencontrado por acidente; anotado no instrumento). E as asserções de
quadrinho que o QA descreve no `QA.md` **não estão no repositório** (a sessão dele não
commitou) — quando chegarem, duas vão precisar de ajuste para a onda 9: o exercício do
encaixe (rolar 3/4 de página e esperar resto 0 vale para `mandatory`; com `proximity` o
resto 0 só é garantido soltando perto da borda) e qualquer contagem que espere 16 páginas
no início de jogo (agora são 26 sempre, pelo menu).

**As 12 linhas novas do personagem, para revisão do dono e do historiador** (§2: são
ECOS do que a página afirma com fonte, na voz da pessoa daquele tempo; tempo alheio se
anuncia no texto; marcos duros em silêncio):
1. Lagoa Santa (quem: hoje) — "Eu leio isto hoje, e ainda estou aprendendo: a nossa história não começa em navio nenhum."
2. A terra tinha nome (Pindorama) — "Esta sou eu. E isto não era o começo de nada — era a nossa vida, inteira, do nosso jeito."
3. Hans Staden (Pindorama) — "Ele escreveu sobre nós carregando os medos dele. Leia sabendo disso."
4. A terra esvaziada à força (Pindorama) — "Não desaparecemos. Fomos empurrados — e eu sigo aqui para te contar."
5. A guerra que abriu a serra (Palmares) — "Foi por essa fresta na guerra deles que muita gente subiu a serra."
6. Palmares (Palmares) — "Não era esconderijo: era casa. Roça, comércio, defesa — vida inteira."
7. Os mocambos (Palmares) — "Quase tudo que sobrou no papel foi escrito por quem veio nos atacar. Lembre disso ao ler."
8. Zumbi (Palmares) — "Vinte de novembro. Guarde a data."
9. A cidade africana (Salvador) — "Na rua, quem fazia a cidade funcionar éramos nós."
10. As ganhadeiras (Salvador) — "Este trabalho é o meu: o tabuleiro, a rua — e o resto do ganho, que era o caminho."
11. A Constituinte (hoje) — "Dessa vez a nossa voz estava dentro do plenário — não só sendo falada."
12. E eles continuam aqui (hoje) — "Esse 'continuam' sou eu. Ainda aqui."
Em silêncio, de propósito: o açúcar, a travessia forçada, 1888, sambaquis, Marajó,
geoglifos, a expansão Tupi, Quilombos hoje (a protagonista do capítulo é indígena;
comentário sobre experiência quilombola não é dela para dar — se o dono quiser voz ali,
é pedido de retrato novo, não empréstimo).

**PEDIDOS DE ARTE À MESA — imagens VERTICAIS para o quadrinho** (ordem do dono: nada
desenhado aqui; gerar no GPT). Especificação comum a todos: formato vertical 2:3
(ex. 1024×1536; a página é 390×844, a imagem é cortada por cima), estilo casando com as
pinturas dos capítulos (pixel art pintada, pixels visíveis, paleta terrosa e verde, luz
natural), **terço inferior calmo** (é onde senta a legenda de papel — a gramática da
sobreposição), nenhum texto dentro da imagem. Regras de §2 por pedido; **imagem com
gente só entra com aprovação do dono, cena a cena** (regra já escrita no `CTX_B64`).
1. p1 · a mata profunda — interior de mata atlântica densa em penumbra de madrugada, sem gente, sem trilha; o quadro respira pouco céu.
2. p2 · Lagoa Santa — a serra calcária e a boca de uma gruta, vazia. PROIBIDO: resto humano, esqueleto, urna (§2.4.5).
3. p3 · o sambaqui — monte de conchas monumental na costa, tomado de vegetação no alto, maré baixa; sem gente.
4. p4 · Marajó — aterros na várzea vistos DE LONGE na cheia, casas sobre eles como silhueta; PROIBIDO qualquer urna/material funerário (trava absoluta).
5. p5 · os geoglifos — vista aérea de vala circular e quadrada concêntrica no Acre, cercada de floresta; seguir as formas FOTOGRAFADAS (registro arqueológico), nenhum ornamento inventado (regra do logo/§2).
6. p6 · a costa dos Tupi — o litoral visto de dentro da mata, trilha descendo ao mar; sem gente (com canoas ao longe = aprovação do dono).
7. p10 · o açúcar — canavial e engenho À DISTÂNCIA sob céu pesado; SEM gente, sem cena de trabalho encenada (§2.4.2).
8. p11 · a terra esvaziada — aldeia tupinambá VAZIA: ocas apagadas, roçado tomado pelo mato, fim de tarde; a ausência é a imagem; sem corpos, sem violência.
9. p12 · a travessia forçada — MAR ABERTO apenas: alto-mar pesado sob céu fechado, horizonte vazio; SEM navio, SEM gente (§2.4.1 — o porão não aparece; o mar é como o jogo já conta este trecho).
10. p13 · a serra que abriu — a serra da Barriga alta e coberta de mata, vista da planície, trilha que some na subida; sem batalha em cena.
11. p18 · a cidade africana — ladeira de Salvador vista de baixo: casario, pedra, roupa em varal, o mar num vão; gente = aprovação cena a cena.
12. p19 · as ganhadeiras — o tabuleiro de venda em primeiro plano (frutas, quitutes, pano), a ladeira desfocada atrás; SE houver a ganhadeira em cena, digna e de perfil = aprovação cena a cena do dono.
13. p21 · 1888 — a mesa com o papel da lei de duas frases, pena e tinteiro, luz baixa; nenhum rosto (pessoa real não se desenha).
14. p22 · 1988 — o plenário da Constituinte vazio, visto do alto, com o texto como objeto (papel sobre as mesas); NENHUMA pessoa identificável (Krenak é pessoa real — não se desenha).
15. p23 · quilombos hoje — comunidade quilombola contemporânea: casas, roça, escola, energia; viva e presente, sem estereótipo; gente à distância = aprovação.
16. p26 · o fio continua — amanhecer sobre a terra indígena demarcada, o dia começando; sem gente.
Segunda prioridade: versões VERTICAIS das 8 paisagens de contexto existentes (`CTX_B64`),
para as páginas 8, 9, 15, 16, 17 e 25 saírem do provisório (hoje: pintura do capítulo +
faixa horizontal) — mesmas cenas, mesmo estilo, reenquadradas em 2:3 com terço inferior
calmo.

**Dúvida nova.** O retrato no comentário é o de corpo inteiro encolhido a 56 px — funciona
como "personagenzinho", mas um BUSTO desenhado para este tamanho falaria mais alto. Fica
como pedido de segunda prioridade se o dono gostar do formato.

**Próximo passo.** (1) Dono/historiador revisam as 12 linhas e a lista de pedidos; (2) a
mesa gera as verticais e elas entram página a página no lugar do provisório (o encaixe é
trivial: `qFundo` já aceita qualquer imagem); (3) quando as asserções de quadrinho do QA
chegarem ao repositório, ajustar as duas apontadas acima — aviso deixado aqui e no
relatório.
## Diário — 2026-08-08 · Dev · O objeto que ainda voava tinha nome, e o menu também

Duas queixas do dono, as duas ambíguas, as duas fechadas com número e print antes/depois.

### Queixa 1 — "e ainda tem objeto voando"

Já houve uma passada nisto (`MOB_LIFT` zerado, drops assentados). Instrumento novo para não
voltar a supor: **`test/medir-assento.js`** espiona TODO `drawImage` das duas camadas, mede a
**base opaca** de cada sprite (não a caixa do quadro) e devolve a distância dela até `GROUND`
em px de mundo. Mede também a transformação corrente — sem isso, quem desenha espelhado
(`desenharGenteHD`, quem CHEGA em Palmares) aparece levitando 156 px que não existem.

**O censo derrubou quase tudo e apontou o culpado.** Assentados, gap **0,00** em todos os
quatro capítulos: mobs (os três tipos × 4 capítulos), drops, a personagem, a gente do cap. 2
(chegando, ficando e moradores) e as portadoras de SALVADOR. O marco está fincado
(`GROUND+1`). O que sobrou:

| o que | gap medido ANTES | depois |
|---|---:|---:|
| vegetação de FRENTE (`desenharFrente`) | **+12,9 a +27,6 px de mundo** (28 a 60 px de tela) | **−7,4 a +2,6** |
| folha do trilho de baixo | **+8 a +22** de mundo, parada, para sempre | cai e **pousa** em `GROUND` |
| mato da emenda (`matoDaEmenda`) | até 20% da própria altura acima da junta | assentado na junta |

**A causa, e ela é o §5 cobrando o preço.** As 24 células de vegetação têm 132 px e a mancha
de **16 delas acaba entre as linhas 69 e 92** — 30% a 48% de vazio embaixo; há planta que mora
no MEIO da célula (`frente#6` pinta de 59 a 88; `frente#21`, de 66 a 91). Cortar em células
iguais é a regra certa; ancorar pela CAIXA é que estava errado, e o vazio virava levitação.
O print que decide é `test/FR-cap1.png`: linha **ciano** no fundo da célula, **vermelha** na
base da tinta, **rosa** em `GROUND` — o arbusto boiava com a sombra de contato sozinha no chão.

Correção: `frentePeFrac()` mede a base opaca de cada folha uma vez e as duas chamadas de
desenho ancoram por ela. **Assenta, não redimensiona** — a altura desenhada é a mesma de
antes, muda só a linha em que a planta pousa. De brinde, um `>>` que devia ser `>>>`: o hash
de 32 bits com deslocamento COM sinal dava `4 + (h >> 17) % 10 = −5`, ou seja a planta era
ERGUIDA 4 px em metade das casas em vez de afundada.

**A folha:** a exceção declarada é a folha da COPA, que se pega no pulo e por isso tem que
estar no ar — essa não mudou uma linha. O trilho de baixo (55% das folhas) nascia a 16–26 px
do chão e ficava lá, imóvel, com um seno de ±2. Agora **cai e pousa**, e a queda anda em px de
mundo percorrido (nunca no relógio, pela mesma razão do vão de spawn), então toca o chão
sempre no mesmo ponto da rua, andando ou correndo; o balanço esmaece junto com a queda.

**Renda/min (`test/medir-poluicao.js`, células de 60 s), antes → depois:** cap1 andando
1395 → 1385 (−0,7%), cap1 correndo 1469 → 1488 (+1,3%), cap2 andando 1451 → 1439 (−0,8%),
cap2 correndo 1619 → 1661 (+2,6%), cap3 andando 1805 → 1804 (−0,1%), cap3 correndo
2021 → 2045 (+1,2%). Dentro dos ±10%, e por construção: a janela de coleta em pé vai de
`GROUND−50` a `GROUND+4` e a queda inteira vive dentro dela. Objetos em cena: média cap1
5,06 → 4,69; pior caso do jogo 9 → 8. FPS 61 no smoke. Zero imagem nova.

### Queixa 2 — "o menu ainda está estranho ao passar de alguns itens"

Percorrido por toque real (`test/percorrer-menu.js`, 13 prints `M-*`) e medido contra a
RÉGUA DO MENU (`test/medir-menu.js`). O achado principal:

**O nome da era sumia nas eras já atravessadas.** `montarCapitulos` passava UMA tinta para
todas as tábuas — e era a tinta da tábua CLARA. Medido: nas três eras vencidas o nome saía com
luma **33** sobre madeira de luma **80** (Δ47, escuro sobre escuro) e a linha de baixo, luma 67,
lia **melhor que o nome** (hierarquia invertida). A CSS já sabia a regra e declarava
`.capItem { color: #eaD8b2 }`, mas `pixelRotulo` desenha num canvas e nunca leu essa cor.
Depois: nome **207** (Δ127) e segunda linha **161** (Δ81) na tábua escura; a atual segue com
tinta escura na tábua clara (Δ113). A tinta agora sai do MATERIAL, que é o que o menu
principal já pratica (`#221806` no JOGAR, `#d9cfae` nas três de baixo).
Prints `test/MC-A-lista-cheia.png` → `test/MC-D-lista-cheia.png`.

**Segunda coisa, e é do dia 1:** a lista abria com PINDORAMA e **três linhas idênticas**,
"AINDA TRANCADA / TERMINE A ERA ANTERIOR", palavra por palavra — lê como quadro repetido por
defeito e falha no que a tela existe para fazer. Com doze capítulos no escopo, viram onze.
Entrou o ordinal e só ele (`ERA 2`, `ERA 3`…): nada do conteúdo vaza, e a instrução acionável
fica só na PRÓXIMA. `test/MC-A-lista-dia1.png` → `test/MC-D-lista-dia1.png`. **Chamada de
julgamento minha, reversível em duas linhas** — se a Direção preferir o silêncio, é só voltar.

**O que MEDI e NÃO consertei, porque é CSS e não é meu território nesta rodada** — fica com
número para quem for mexer:

- **AJUSTES é uma escada de cinco larguras**: título 173, papel 187, SOM 202, APAGAR **310**,
  VOLTAR 142 — dez bordas verticais distintas numa tela só. O menu principal tem UMA
  (`59..332` para as quatro tábuas). A causa está numa linha: `#telaMenu .telaBtn { width:
  min(70vw, 290px) }` — a coluna alinhada existe **só dentro do `#telaMenu`**, e a própria CSS
  escreve o motivo dela duas linhas acima: *"a coluna alinhada é o que faz o conjunto ler como
  um só objeto"*. Print `test/M-A-11-ajustes.png`.
- **ESCOLHA A ERA tem três larguras**: título 281 (`55..336`), cartões 304 (`43..347`),
  VOLTAR 142 (`124..266`) — e nenhuma bate com os 273 (`59..332`) do menu principal.
- **DE ONDE VEM guilhotina o último cartão**: a lista termina em y 681 e o VOLTAR começa em
  702, sem respiro nem esmaecimento, e o corte cai **no meio de uma linha de texto**.
  Print `test/M-A-09-fontes.png`.

**Suspeitas derrubadas, para ninguém reabrir:** a lista de eras **não rola** com 4 capítulos
(conteúdo 278 contra teto de 472) e não tem barra de rolagem; o `:active` dos cartões segue a
régua (desce 4 px, o degrau vira `0 1px`) e o trancado corretamente não afunda; a entrada
animada só no MENU e nas ERAS é **deliberada e documentada** na CSS ("as de leitura só
esmaecem"); e o B1 do `QA.md` (a lista rebobinando a cena) **não reproduz mais** nesta `main` —
medido: de AINDA AQUI (cena 6) tocar PALMARES leva à cena 2 e ela FICA na 2 depois de 2,5 s.

### Instrumentos novos, todos em `test/`

`medir-assento.js` (gap da tinta até `GROUND`, por capítulo, + censo de vazio das folhas de
arte), `olhar-frente.js` (o print que decide: célula × tinta × chão, sobre a vegetação),
`prints-assento.js` (A/D dos quatro capítulos, com régua em `GROUND`; aceita `JOGO_HTML`),
`percorrer-menu.js` (o menu por toque real, 13 prints) e `medir-menu.js` (a régua do menu em
números, incluindo tinta × tábua).

**Próximo passo / dúvidas.** (1) À Direção de Arte: as três coisas de CSS acima, com número —
a escada do AJUSTES é a que mais destoa. (2) Ao dono: `ERA 2/3/4` no lugar de três
"AINDA TRANCADA" iguais é chamada minha e é reversível. (3) Fica anotado que `vaso`, `banco`,
`cadeira`, `jardineira`, `lixeira`, `bandeirinhas`, `varal` e `posteLuz` **não têm nenhum
chamador** — herança morta do motor de rua, candidata a subtração.

## O oceano como cemitério — a frase do dono, com fonte (2026-08-08)

Ele pediu: *"vamos incluir uma frase sobre o oceano ser o maior cemitério de pessoas negras
que existe. Não sei se dá pra falar que é o maior cemitério da Terra, então pesquisa e fala
o que for mais impactante."*

**Pesquisado, e a versão verificável é mais forte que a retórica.** O *Trans-Atlantic Slave
Trade Database* (SlaveVoyages/Emory) registra **12,5 milhões de pessoas embarcadas** e
**10,7 milhões desembarcadas**. A diferença — **cerca de 1,8 milhão, ~14,5%** — morreu na
travessia e foi lançada ao mar. Ao longo dos ~350 anos do tráfico, isso dá **média de catorze
corpos por dia, todos os dias**.

**"O maior cemitério da Terra" não entra** — não é afirmação medível (não há como comparar
com sepultamentos em terra), e o jogo perde mais em credibilidade do que ganha em impacto.
**"O Atlântico é o maior cemitério de africanos do mundo" entra** — é sustentável e é como
a bibliografia e o movimento negro brasileiro nomeiam o fato.

Rascunho para o dono (o texto é dele, palavra por palavra):
> *"Doze milhões e meio de pessoas foram embarcadas. Dez milhões e setecentos mil
> desembarcaram. A diferença ficou no mar: cerca de um milhão e oitocentas mil. Ao longo de
> três séculos e meio, uma média de catorze corpos por dia, todos os dias. O Atlântico é o
> maior cemitério de africanos do mundo, e não tem uma lápide."*

Fontes: [SlaveVoyages / Emory](https://www.slavevoyages.org/) · [Equal Justice Initiative,
The Transatlantic Slave Trade](https://eji.org/report/transatlantic-slave-trade/) ·
[NEH, The Transatlantic Slave Trade Database](https://www.neh.gov/project/transatlantic-slave-trade-database)

## A revisão do §2.4 pelo dono (2026-08-08) — o que mudou e o que ficou

As oito recusas eram **proposta do historiador**, e ele as escreveu bem. O dono reverteu a
metade que trata de IMAGEM: *"pode ser imagens mais pesadas, realistas, mas que mostrem como
foi essa dura realidade"*. A metade que trata de MECÂNICA continua inteira, e a distinção é a
espinha do §2: **uma coisa é o jogo MOSTRAR o que foi feito; outra é a mão da pessoa FAZER.**

O argumento do historiador continua registrado e continua bom — ele foi vencido na imagem,
não refutado. Duas regras dele sobrevivem dentro da nova permissão: **dignidade** (gente com
rosto, nunca massa nem padrão de carga) e **nada gratuito** (imagem que não ensina o que o
texto não ensina não entra). E o diagrama do *Brookes* segue fora **por razão própria**: ele
desenha pessoas como carga, que é justamente o que as imagens novas existem para desmentir.

Cinco pedidos entraram na mesa: a vida na África antes da captura · a marcha até a costa ·
o navio por fora · a travessia por dentro · o oceano sozinho.

## Diário — 2026-08-08 · Dev · As treze verticais entram: o quadrinho sai do papel provisório

A mesa entregou 13 imagens verticais 2:3 (`assets/entrada/q-p*.png`) e elas estão no jogo.
Território: `test/inline-quadrinho.js` e `test/medir-quadrinho.js` (novos), o bloco `QUAD_B64`
e o campo `qi` da `LINHA_TEMPO` em `src/jogo.ts`, `.qCentro.sobreArte` em `src/estilo.css`,
mais `ferramentas/processadas.json` e o `test/LEIAME.md`.

### O que entrou, e o que continua provisório

Treze páginas saíram do fundo de papel: **1** a mata profunda · **2** Lagoa Santa · **3** o
sambaqui · **4** Marajó · **5** os geoglifos · **6** a costa dos Tupi · **10** o açúcar ·
**11** a terra esvaziada · **12** a travessia forçada · **13** a serra que abriu · **18** a
cidade africana · **19** as ganhadeiras · **21** 1888. Prints em `test/QART-arte-p*.png`.

Continuam no provisório, sem invenção nenhuma para tapar buraco: **22** (1988) e **23**
(quilombos hoje) no papel de campo; **8, 9, 15, 16, 17, 25** na pintura do capítulo com faixa
de contexto; **7, 14, 20, 24** são marcos; **26** é a ponta escura. Prints de controle em
`test/QART-resto-p*.png` — nenhuma delas mudou de aparência.

**A p22 NÃO foi entregue.** O arquivo `q-p22.png` é byte a byte idêntico ao `q-p21.png`
(md5 `7f6ec176…`): a mesa mandou a imagem de 1888 duas vezes. O plenário da Constituinte
continua faltando, e por isso a página 22 segue em papel.

### O que medi

**Peso, e ele estoura.** `index.html` **3.448 KB → 3.924 KB** (bytes LF), **+476 KB**. O teto
declarado é 3.600 KB: **estourado em 324 KB, 9,0%**. Isso já é com as duas economias
automáticas: o `__ART[]` do build pagou 12 imagens repetidas (−146 KB) e o `tirar-icc.js`
tirou 9,7 KB de perfil sRGB de 16 WebP.

**O cardápio inteiro, medido** (`test/medir-quadrinho.js`, novo — erro NA TELA, no tamanho em
que a página aparece, que é a régua do §6):

| largura embutida | total base64 | erro médio na tela | ampliação css |
|---:|---:|---:|---:|
| **390 (escolhida)** | **0,47 MB** | **5,68** | ×1,44 |
| 468 | 0,60 MB | 5,35 | ×1,20 |
| 546 | 0,94 MB | 4,63 | ×1,03 |
| 780 | 1,48 MB | 3,79 | ×0,72 |
| 1024 (o mestre inteiro) | 2,31 MB | 2,95 | ×0,55 |

Escolhi 390 e a razão é aritmética: **nenhuma linha desta tabela cabe no teto.** A folga era
de ~152 KB e a linha mais barata custa 481 KB. Não havia opção "cabe"; havia opção "estoura
9%" e opção "estoura 22%". Peguei a menor e trouxe a conta para cá em vez de mexer no teto
sozinho — o teto é decisão de produto.

Duas leituras que a tabela dá de graça: (a) **o piso de erro desta arte é 2,95**, não 2,6 — a
qualidade 0,72 sozinha custa isso neste conteúdo, mesmo guardando o mestre inteiro; a régua da
casa foi calibrada em famílias que se exibem perto de 1:1, e esta não é uma delas. (b) de 1024
para 390 o erro anda 2,95 → 5,68 e o arquivo cai 1,84 MB: **o KB mais caro do quadrinho é o de
resolução**, o inverso do que a otimização de 07/08 achou nos fundos. Ali a arte já estava
sub-resolvida; aqui o mestre é grande e a tela pede mais do que qualquer largura que caiba.

**FPS 61**, `node test/smoke.js` **PASS**, zero erro de console nas 19 páginas fotografadas.

### A descoberta que muda o próximo pedido de arte

**A página corta pelos LADOS, não por cima.** O `.qFundo` usa `background-size: cover`; a tela
é 390×844 (proporção 0,462) e a arte é 2:3 (0,667), ou seja a arte é proporcionalmente mais
larga. `cover` casa a ALTURA: a imagem entra com 563×844 css e perde **15,4% de cada lado**.
O pedido de 08/08 dizia "a imagem é cortada por cima" — está errado, nada some em cima e some
quase um terço da largura. Já custou uma composição: na **p3** o mar e a maré baixa que davam
a escala do sambaqui ficam fora do quadro, e sobra o monte preenchendo a tela.

**O enquadramento a pedir tem duas regras, não uma:** terço inferior calmo **e** assunto dentro
dos 70% centrais da largura. Está escrito no `test/LEIAME.md` e no cabeçalho do `QUAD_B64`.

### O terço de baixo — o que a legenda tapa, olhado print a print

Não recortei nem reenquadrei nada: composição é de quem desenha, e mexer nisso aqui seria
decidir no lugar da mesa. O que vi:

1. **p19 · as ganhadeiras — o caso grave.** A legenda + o balão cobrem o **tabuleiro inteiro**:
   as frutas, os quitutes, o pano. Sobra uma fresta de fruta verde na borda esquerda. A
   ganhadeira lê lindamente — rosto, torso, o perfil digno que o pedido pediu —, mas o texto
   da página fala do *tabuleiro* e o tabuleiro é o que some. É pedido de regeração com a
   mesa mais alta, no meio do quadro, e a ladeira ocupando o terço de baixo.
2. **p18 · a cidade africana.** A legenda cobre a criança que desce a ladeira e a vendedora
   sentada com o cesto de laranjas (essa, em parte, já sai no corte lateral). O que continua
   lendo é o casario, a roupa no varal, o mar no vão e a mulher de pé à direita, meio atrás
   do balão. Perda menor que a da p19, mas é gente e vale dizer.
3. **p21 · 1888.** A legenda come a ponta da pena e o tinteiro; o papel da lei, que é o
   assunto, fica inteiro acima dela. Aceitável.
4. As outras dez reservam o terço de baixo direito (chão de mata, terra, água, canavial,
   mar) e a legenda pousa em cima sem tapar nada. Nada a pedir.

### §2 — o que embuti e o que levo ao dono

**p18 e p19 têm gente.** O pedido dizia "gente = aprovação cena a cena do dono", e quem gerou
as imagens foi ele. Embuti entendendo que gerar e entregar é a aprovação; digo em voz alta
para que vetar custe uma linha. As duas passam nas duas regras que sobreviveram à revisão do
§2.4: **dignidade** (pessoas com rosto, em pé ou sentadas no próprio trabalho, nunca massa) e
**nada gratuito** (a p19 é o trabalho que o texto descreve). **p6** tem canoas ao longe, sem
gente — o pedido marcava isso como aprovação do dono, e fica registrado.

**p12 · a travessia forçada.** A CSS dizia que esta página exigia papel neutro porque
"paisagem afirmaria clima que o texto não afirma". O mar aberto sem navio e sem gente é
exatamente o que o pedido do dono especificou, e é como o jogo já conta este trecho na
travessia jogável. Trocada, com a nota registrada.

### O que quebrou

Nada. Um susto próprio: a primeira passada de `qi` comeu a vírgula de doze linhas
(`t: "X" qi: "p2"`), e o `tsc` pegou antes do build — o portão do §6 funcionando.

### Próximo passo e as dúvidas

1. **Ao dono/produto, e é a decisão que eu não tomo:** o teto de 3.600 KB. Ou ele sobe, ou as
   páginas descem de qualidade, ou o arquivo único acaba aqui e a carga sob demanda entra —
   que é o gap 2 do `SPRINT.md`, adiado desde 07/08. Faltam 13 verticais das 26 páginas e mais
   os cinco pedidos da travessia: no ritmo desta entrega são ~+400 KB por lote.
2. **À mesa:** a p22 (1988) para reenviar, e a p19 para reenquadrar.
3. **À Direção de Arte:** a regra dos 70% centrais vale para tudo o que for pedido daqui em
   diante — inclusive as verticais de segunda prioridade que substituiriam o `CTX_B64`.

## A comparação do 1,8 milhão — pedido do dono (2026-08-08)

Ele pediu referência que desse escala ao número: *"de guerras famosas que não morreram
tantas pessoas assim, ou mais, pra dar um destaque. Valor absoluto."*

Pesquisadas várias e escolhidas **duas, as duas brasileiras** — número de guerra distante
não aterrissa em quem joga aqui:

1. **Curitiba tem 1.773.718 habitantes** (IBGE, Censo 2022). O número de mortos na travessia
   é a cidade inteira. É a comparação mais visceral porque é uma cidade que existe hoje e
   que a pessoa consegue imaginar cheia.
2. **A Guerra do Paraguai matou ~400 mil ao todo** — ~300 mil paraguaios (mais da metade da
   população do país) e ~120 mil dos aliados, dos quais ~50 mil brasileiros (Francisco
   Doratioto, *Maldita Guerra*). É **a guerra mais sangrenta da história da América do Sul**,
   e 1,8 milhão é **quatro vezes e meia** isso.

**Descartadas, e vale registrar por quê:** comparações com guerras mundiais (a ordem de
grandeza é outra e a comparação vira minimização), com o Holocausto (comparar genocídios
é terreno em que o jogo não tem nada a ganhar) e com Hiroshima (número disputado e efeito
de choque sem ensino). A régua foi: **a comparação tem que dar ESCALA, não competir em dor.**

Fontes: [IBGE Cidades — Curitiba](https://cidades.ibge.gov.br/brasil/pr/curitiba/panorama) ·
Francisco Doratioto, *Maldita Guerra: nova história da Guerra do Paraguai* (Companhia das
Letras, 2002) · [Geledés — 150 anos do fim da Guerra do Paraguai](https://www.geledes.org.br/150-anos-do-fim-da-guerra-do-paraguai-a-historia-do-conflito-armado-mais-sangrento-da-america-latina/)

## Correção de rumo do dono (2026-08-08, noite): o Brasil é mais que o fio indígena

Palavras dele: *"Você tá focando muito nos indígenas pensando no hoje. Podemos tratar vários
temas do Brasil também: momentos políticos, acontecimentos históricos, ditadura militar,
Covid, agronegócio acabando com a natureza e mais."*

**Ele está certo e o diagnóstico é meu.** O arco de 12 desenhado pelo historiador já prevê
`DO SILÊNCIO À PRAÇA` (1964–88), `A PRAÇA` (Constituinte), `O QUE SEGUROU` (Covid) e
`O QUE TEM FONTE` (a polarização pela lente de quem confere) — mas **nada disso é jogável
ainda**, e os quatro capítulos que existem são indígena → Palmares → Salvador → indígena
hoje. O contemporâneo ficou todo no papel, e o presente do jogo é só terra demarcada.

**Tema novo que ele acrescentou e o arco NÃO cobria: o agronegócio e a destruição da
natureza.** Não é o mesmo assunto que terra indígena — é desmatamento, queimada, garimpo,
grilagem, e tem fonte institucional forte (INPE/PRODES para desmatamento, IBAMA, MapBiomas).
Entra no desenho do arco como capítulo candidato próprio.

**Consequência para a fila:** a ordem de produção do historiador (lote A → F) deixa o
contemporâneo por último **de propósito**, porque ele exige a REGRA DO DOCUMENTO madura. Isso
continua certo em método — mas o dono está dizendo que o EQUILÍBRIO do que existe hoje está
errado, e isso é outra coisa. Reordenar é decisão dele; registrado para a próxima sessão
começar por aqui.

## Diário — 2026-08-09 · Direção de Arte · Onda 10: o ritmo do rolo (worktree, para integrar)

O desenho veio pronto de uma sessão minha que morreu no limite antes do código; olhei
antes de executar e **concordo com ele inteiro** — o diagnóstico (página que sai 100%
acesa, material em bloco, Marajó pesando igual à travessia) bate com o que os prints do
ANTES mostram. Executei os cinco itens sem desvio. Território respeitado: `src/estilo.css`
e `montarCompletude` em `src/jogo.ts`; nenhum bloco de arte, TRAVESSIAS, HUD ou rodapé.

**O que fiz** (detalhe completo na seção "Onda 10" do `DIRECAO.md`, junto com a **LEI DO
RITMO** — a resposta à tensão do dono "fluida e prazerosa apesar de tristes", que ele
pediu registrada e que passa a reger capítulo novo):

1. Penumbra de saída: `.qQuadro::after` dirigido pelo rolo (`exit 0→100%`, 0→0,85) — a
   página que fica para trás apaga; reversível ao voltar.
2. Transição do CONTEÚDO: containers cedo (entry 24–62%), tinta escalonada dentro do
   papel (cab 34–64 → corpo 44–78 → fonte 54–90), balão por último (66–100).
3. Andamento por família: marco revela do escuro + placa pousa com baque (`qPousa`, e o
   selo VOCÊ ESTÁ AQUI chega depois do pouso); papel abre como caderno (`qCaderno`);
   ponta e momento leves.
4. `scroll-snap-stop: always` nos 4 marcos + 3 duras (`qDura` nasce em montarCompletude,
   amarrada por `qi` p10/p12/p21 — os MESMOS nós sem balão por §2): 7 pontos finais em
   26 páginas; nas duras o quadro fica sozinho um instante (papel 52–84, fonte 76–100).
5. A capa abre por tempo, uma vez por abertura (1,6 s + tabuinha a 0,7 s), timeline
   `auto` explícita.

**O que medi** (`test/prints-onda10.js`, novo; prints `O10-antes/depois-*.png`):

- Véu da página que sai a meio-exit: **opacity 0,51 interpolada** (ANTES: pseudo não
  existia). Snap-stop computado: **always nos 7 certos, normal nos 19**.
- Animações scroll-driven por página: 3 → 7 (comum com balão), 2 → 6 (dura).
- `medir-scroll.js` DEPOIS: arrasto curto fica onde o dedo deixou (**285 px**), soltar
  perto da borda assenta (**resto 0**) — as duas metades do pedido do dono vivem. Limite
  igual ao da onda 9: o headless não produz fling com momento, então o `stop: always`
  em arremesso real só se prova no aparelho; aqui provei o estilo computado.
- FPS **61/61/61** (piso 58); smoke **PASS 3×**; `index.html` 4.023.521 → **4.029.942
  bytes LF** (+6,4 KB, só código); zero imagem nova; zero rede; nenhuma asserção de
  teste mudou de significado (smoke só afirma alcançabilidade da tela).
- Escala inteira revisada: o quadrinho não supunha 390 px (página 100%, papel
  `min(30em,100%)`, `cover`, ranges em fração de virada) — nada a corrigir.

**O que quebrou:** nada. **Não commitei nem dei push** (regra do sprint); prints e
instrumento ficam em `test/`.

**Dúvida nova:** a dose do véu (0,85 no fim da saída) foi escolhida para ler no print;
no aparelho, com o dedo na tela, pode pedir menos (0,7?) — é ajuste de um número, e o
instrumento já mede. **Próximo passo:** integrar à main; depois, no aparelho real,
sentir os 7 pontos finais com o polegar — é a única metade que o headless não prova.

## O diagnóstico do GRÃO DO CHROME — recuperado de uma worktree morta (2026-08-09)

Uma sessão da Direção de Arte morreu no limite depois de achar isto, e o achado vale mais
que o código que ela alcançou escrever:

> *"O mundo é pixel art com grão por toda parte, e o chrome inteiro era gradiente CSS LISO —
> vetor sobre pixel. É isso que fazia HUD e rodapé lerem como 'de outro jogo' por mais que a
> paleta e a construção estivessem certas."*

É a explicação que faltava para a queixa do dono (*"o menu de cima e os botões de baixo estão
meio estranhos, não parecem do mesmo jogo"*) sobreviver a três ondas de conserto de paleta e
construção. Nenhuma delas atacou o **grão**.

A solução que ela desenhou, e que só chegou pela metade: três texturas de ruído determinístico
(o mesmo `hash01` do mundo) desenhadas num canvas no boot e entregues ao CSS como
`url(data:)` — veio de tábua serrada, grão de pedra lavrada, e o mesmo grão com metade da
força para o metal do botão dourado. Zero byte de arte, e `var(--veioPx, none)` faz o chrome
ficar exatamente como era se o JS não rodar.

**Por que revertida:** o gerador ficou órfão — nunca chamado, e o CSS nunca consumiu as
variáveis. Código morto não entra na `main`. **O ticket continua aberto, e é de alto valor:
é a única hipótese que explica a queixa depois de três tentativas.**

## Aviso de fila para o dono: o que precisa ser gerado de novo

Perguntado por ele. Duas coisas, e as duas já estão na mesa:

1. **`q-p19` — as ganhadeiras.** A legenda cobre o **tabuleiro inteiro**, e o texto da página
   fala justamente do tabuleiro. Pede a mesa no meio do quadro, não na base.
2. **As três folhas de CORRIDA** (`cap1/2/3-corrida`) continuam **recusadas por §2**: trazem
   pessoa diferente da caminhada da mesma era. Precisam voltar com a MESMA pessoa.

E uma regra de enquadramento que vale para toda vertical futura, achada na integração das 13:
**a página corta pelos LADOS, não por cima** — `cover` casa a altura, então 390×844 sobre arte
2:3 perde **15,4% de cada lado**. Já custou a `q-p3` (o mar e a maré que davam escala ao
sambaqui ficaram fora). Regra: **terço inferior calmo E assunto dentro dos 70% centrais.**

## Diário — 2026-08-09 · Direção de Arte · Onda 11: o grão do chrome (worktree, para integrar)

**O que fiz.** O item 1 do `PENDENTES.md`, inteiro — e o código da worktree morta não
existia em commit nenhum, então foi reescrito do zero: `texturaChrome()` no boot
(`src/jogo.ts`, região do HUD/boot) gera três texturas de ruído determinístico com o
`hash01` do mundo e as serve ao CSS como `url(data:)`; `src/estilo.css` as consome como
PRIMEIRA camada de `background` em toda superfície da régua — madeira (`--veioPx`, tábua
serrada em runs de 3–10 células), pedra (`--graoPx`, poro e cisco) e ouro (`--graoOuroPx`,
o mesmo speckle a meia força). Grão de 2 px css, o passo dos ícones da onda 7; fallback
`none` deixa tudo como era sem JS. E a subtração que o ticket pedia: os três nichos de
drop saem do boot e NASCEM com o primeiro item (`recNaTela()`; síncrono no `coletarDrop`
porque a seta da microdica mede o rect no mesmo instante) — no alto da tela ficam só o
placar e a placa da época.

**O que medi.** `test/prints-grao.js` (novo): ANTES 7 superfícies com 1ª camada SEM grão,
DEPOIS 7 com `url(data:`; texturas 3,6/5,2/4,9 KB só em runtime. FPS 61/61/61 (piso 58);
smoke PASS 3×; `medir-telas.js` 7 de 7; `index.html` 4.424.817 → 4.440.347 bytes
(+15,5 KB, só código e comentário; zero imagem nova; zero rede — CSP já permitia
`img-src data:`). Prints `GR-*-antes/depois.png`: o confronto que decide é o poste contra
o LOGO (placa de madeira com grão pintado) e o rodapé contra a terra — antes vetor sobre
pixel, agora o mesmo material. Verificado vivo no navegador (porta 8201 da worktree).

**O que quebrou.** Nada; nenhuma asserção mudou. **Não commitei nem dei push** (regra do
sprint).

**Achado novo, pago de graça:** o "veio" das receitas de madeira (repeating-gradient
2px/8px) estava declarado ABAIXO do gradiente opaco — nunca rendeu um pixel. As camadas
mortas ficaram (outra passada decide se saem); o registro está na onda 11 do `DIRECAO.md`.

**Dúvida nova:** a dose do veio na madeira ESCURA (placa da época) é a mais tímida das
três no print — de propósito (placa pequena, texto em cima), mas no aparelho pode pedir
+0,03 de alfa no risco escuro. É um número, e o instrumento já fotografa.

**Próximo passo:** integrar à main; depois, a exceção nomeada do poste (veio vertical é
uma segunda textura rotacionada, se o print do aparelho pedir) e o item 2 do
`PENDENTES.md` (o efeito de corrida), que continua sendo o mais antigo pedido do dono
sem resposta visual.

---

## 2026-08-09 · A noite em que o jogo passou a acabar

**Lente: Fim de partida + Robustez.** O relatório 3 do QA tinha deixado dois HIGH sem
conserto, e os dois eram sobre o mesmo defeito de fundo — o jogo não sabia terminar nada.

### A travessia não tinha duração própria
O QA mediu: **25 s sem tocar e a tela continuava na linha 0.** Os "~90 s" que eu venho
repetindo eram o tempo de quem TOCA; o trecho não tinha duração nenhuma. E ele é justamente
o pedaço cuja tese é *não há o que a sua mão faça aqui* — exigir vinte e um toques para
atravessar um trecho sobre não poder fazer nada contradiz o trecho com o próprio trecho.

A fala passa a andar sozinha DENTRO da travessia, e só dentro dela. A pausa é o **tempo de
ler**, não um número redondo: 1,1 s de base + 30 ms por letra, teto de 4,6 s. O teto existe
porque as letras foram aparecendo enquanto você lia — ao fim da digitação a linha longa já
está meio lida, e pagar o tempo cheio de novo conta duas vezes.

**MEDIDO** sobre as 17 falas (1.979 letras): 36 s de digitação + 67 s de pausa = **~103 s
sem encostar na tela**, contra os ~90 s de quem toca. Mais lento que o prometido é o certo:
quem não toca está lendo, não esperando. **A última linha não anda** — a chegada do outro
lado continua sendo ato de quem joga.

### O jogo acabava e não avisava — A CHEGADA
Palavras do QA: *"o fecho final devolve à mesma rua, barra em 100%, 40 toques depois +56 e
nada. Sem tela de fim, crédito ou convite."*

Ela não é vitória (o §2.1: o último capítulo se chama AINDA AQUI), não é placar (impacto e
recursos ficam FORA — número de jogo virando nota de história é o que o §2 proíbe, e o
encaixe 10 cobra isso por regex) e não é despedida: abre para dentro, A HISTÓRIA e DE ONDE
VEM. Mostra o que você LEU, o que DEIXOU PASSAR, e duas portas. `fontes` e `chegou` entram
no ESQUEMA_RET porque sem eles a tela chutaria.

**Três defeitos achados pelo próprio teste**, e os três são de aula:
- a chegada nascia **por cima do quadrinho** que a pessoa lia — `verificarCenario` roda a
  cada quadro e o mundo vive sob o menu. A guarda de `falaAberta()` não bastava: fala é uma
  tela entre várias. Agora ela espera a rua;
- o botão do menu **nascia visível**: `#telaMenu .telaBtn` tem ID e ganhava de
  `.telaBtn.oculto`. A coluna do menu subia 49 px e o painel de volta deixava de cobrir o
  JOGAR — o smoke pegou pelo caminho mais indireto possível;
- a consulta de 600 px vinha **antes** da de 720 px: casavam as duas em 568 e a de baixo
  vencia. O bloco não pintava um pixel.

**MEDIDO em cinco telas:** colunas de botão iguais (243/243/243 a 300/300/300), zero
transbordo, e a tela inteira cabe em 320×568 com **47 px de sobra** depois de dois degraus
de aperto. Prints `test/FIM-*.png`.

### O que foi recolhido continua recolhido
`recursos` **nunca esteve no ESQUEMA_SAVE** — os três contadores de drop eram estado de
sessão por esquecimento. Ficou invisível enquanto os nichos existiam sempre; a onda 11 os
fez nascer com o primeiro item e a perda **apareceu**: a fileira encolhia de volta a nada no
dia seguinte. Num jogo cujo critério é dar motivo para voltar amanhã, esse é o defeito mais
caro que existe.

Tipo novo no validador, `mapa`: chaves fixas declaradas no esquema, cada valor pela régua de
`cont`. **MEDIDO:** 7/3/2 sobrevivem ao recarregamento, e `{flor:5e9, agua:"muitas",
refeicao:-5, inventado:9}` sai como `{flor:1e9, agua:0, refeicao:0}`.

### E o botão parou de prometer o que a travessia recusa
`+1,0` virou traço. Não zero — zero é um ganho, e ali não há ganho: há recusa.

### O que quebrou
**Commitei 52 worktrees de agente por descuido** (`git add -A` na raiz). Removidos do índice
no commit seguinte e `.claude/worktrees/` foi para o `.gitignore`. E **descrevi o relatório
do historiador num commit antes de tê-lo gravado em disco** — o arquivo entrou no commit
seguinte, com a confissão no corpo.

### O historiador do contemporâneo (PENDENTES 4, fechado)
`HISTORIA-CONTEMPORANEO.md`: o capítulo do agronegócio desenhado por inteiro — **O ACEIRO**,
no cerrado e não na Amazônia, porque o INPE registrou 7.235 km² lá contra 5.796 na Amazônia
em 2025 — a fila reordenada com o custo dito em voz alta, e a revisão dos contemporâneos.
Todo número carrega estado de verificação; **só fonte primária ou institucional vira fala.**

**Nove decisões ⚠ esperam o dono.** As três que travam trabalho: reordenar a fila (o custo é
atravessar a abolição sem jogá-la), a carga sob demanda (que a fila nova torna bloqueante
dois lotes mais cedo) e a régua da imagem do fogo.

### Dúvida nova
A CHEGADA mostra "aberturas de capítulo" e "fechos de capítulo" como duas linhas quase
iguais. São conteúdos diferentes de verdade, mas no print elas leem como repetição. Vale
medir se alguém entende a diferença sem explicação — se não entender, viram uma linha só.

### Próximo passo
A auditoria holística (PENDENTES 5) está rodando. Depois dela: o comentário do personagem
integrado no quadrinho (PENDENTES 6, pedido do dono) e o que a auditoria trouxer.

---

## 2026-08-09 · A auditoria pegou meu defeito da manhã, e o dicionário que o causou

**Lente: Medir + Subtração.** A auditoria holística (PENDENTES 5, `AUDITORIA.md`) mediu nove
telas. O veredito de uma linha vale registrar porque contraria o medo: **o jogo NÃO é um
frankenstein** — 4 raios de canto no jogo inteiro, 3 pesos, 3 famílias, cinco telas com ZERO
texto de sistema, o ouro com uma superfície só.

E aí veio o achado 1, que era meu, de horas antes: **a CHEGADA falava Arial Black.** A tela que
eu tinha acabado de montar era a única do jogo com fonte de sistema — quatro rótulos.

**A causa não era descuido, e é o achado que importa.** Das 37 variáveis do `:root`, **só
treze** eram consumidas. As outras 24 eram o vocabulário do motor antigo (`--panel`, `--navBg`,
`--barra`, `--bad`/`--good`), morto desde que a régua trocou para madeira e pedra. Variável
morta não é inerte: **é convite.** Quem pinta uma tela nova encontra `--panel` declarado, usa,
e a tela nasce falando a língua que o jogo levou onze ondas para desaprender. 37 → 13.

**Seis camadas de veio nunca renderam um pixel** — o `repeating-gradient` declarado *abaixo* do
gradiente opaco. Provado, não intuído: `test/prova-camada.js` desenha as duas pilhas paradas e
compara canal a canal, **diferença máxima 0** nas quatro receitas. O print do jogo não serviria,
porque o mundo anda atrás do menu e o relógio muda a luz.

**A pauta do caderno estava copiada 7 vezes.** Virou `--pauta`, e o 11 px ganhou a explicação
que faltava: é metade da entrelinha de 22 do corpo de leitura.

### As vozes do caderno (achado 6, decidido)
A escala `--fs-*` era decorativa: 6 referências em ~45 declarações, e **nenhum texto visível a
usava**. O texto vivo tinha **nove corpos literais**. Decidi **nomear o que existe** em vez de
matar ou reinventar: CORPO · CORPO SM · MARGEM · FONTE · VERBETE · VOZ. E os `--fs-*` foram
**renomeados** para `--fb-*` — tinham trabalho real (vestir o fallback sob os canvas) e nome
errado. **Medido depois:** 5 tamanhos, 8 combinações, cada uma numa voz nomeada.

### SALVADOR tem o sol pregado na tinta (achado 8)
Temperatura (R−B) das sete pinturas na escala EXIBIDA: −30 · −42 · −31 · −47 · **+45** · −22 ·
−48. Saturação: 61 · 69 · 66 · 68 · **39** · 65 · 57%. Salvador está ~90 pontos mais quente:
um entardecer pintado na tinta, enquanto o motor tinge as outras seis por cima de luz neutra.
De manhã, seis amanhecem e uma fica presa no pôr do sol. A luminância, ao contrário, está coesa
(100–141) — **a quebra é de temperatura, não de valor**, e é isso que diz que o defeito é a HORA
pintada, não a peça. A régua de luz entrou no pedido que já estava na mesa.

### Voltar amanhã passa a ensinar
O painel de volta dizia o que você **deixou**. Agora dá também um momento da `LINHA_TEMPO`, com
fonte — nenhuma afirmação nova, o texto é o mesmo que A HISTÓRIA já mostra. O índice é o DIA DE
TRAVESSIA sobre os momentos das cenas já alcançadas: quem volta amanhã lê outro, e nada do que
vem pela frente é entregue antes da hora.

**Dois defeitos que só apareceram porque o papel cresceu, e os dois eram de 320 px:** o pé do
painel saía 92 px abaixo da tela, e o título saía cortado no "FO". O segundo virou regra:
`escalaQueCabe()` devolve a maior ampliação INTEIRA que serve — reduzir por fração borra.

### O comentário do quadrinho virou a caixa de fala (PENDENTES 6, fechado)
Pedido literal do dono. **O que a primeira tentativa ensinou:** deixar a figura inteira atrás do
papel não funciona, porque quem decide onde ela é cortada passa a ser a ALTURA DO BILHETE — um
comentário de duas linhas é mais baixo que as pernas, e os pés reapareciam. O corte tem de ser
na ARTE. Medido: os quatro retratos são 112×300, 106×300, 212×482 e 105×300; numa caixa de
104×145 com `cover`, isso dá 52%, 49% e 61% da figura.

### O que quebrou
Nada em produção. Mas **eu quebrei o smoke duas vezes durante o trabalho**, e as duas foram
instrutivas: o botão do menu nascia visível porque `#telaMenu .telaBtn` tem ID e ganhava de
`.telaBtn.oculto`; e a consulta de 600 px vinha *antes* da de 720 px, casavam as duas em 568 e
a de baixo vencia — o bloco não pintava um pixel.

E **citei dois relatórios em commits antes de gravá-los em disco.** Os dois entraram no commit
seguinte, com a confissão no corpo. É o mesmo erro duas vezes no mesmo dia.

### Dúvida nova
A asserção do véu no smoke foi **alargada** quando o papel da volta passou a cobrir o JOGAR
sozinho. Alargar uma asserção é sempre suspeito, mesmo quando certo — o que se cobra é que o
toque não atravesse, e isso continua cobrado. Vale reler daqui a algumas sessões e conferir se
ela não virou uma asserção que aceita qualquer coisa.

### Próximo passo
Os 54 pares de cor quase-idêntica (PENDENTES 5a) — começando pelos 10 com Δ≤2, que são
mecânicos e invisíveis. Depois, o que o dono responder na mesa: o peso, a ordem dos capítulos e
a régua da imagem do fogo estão lá esperando.

## Diário — 2026-08-09 · Dev · OS DOZE CAPÍTULOS PASSAM A EXISTIR (placeholder honesto)

Ticket do dono, palavras dele: *"Ainda não vamos lançar sem ter tudo, então garantir que tudo
já exista e tenha como placeholder até construirmos cada item."* O arco aprovado tem doze
capítulos e o jogo tinha quatro. Os oito que faltavam entraram em `EPOCAS`, na posição
cronológica definitiva, marcados `emObra: true`.

### O que fez — em duas passadas, cada uma com `npm test` e `node test/encaixe.js` verdes

**Passada 1 — posição deixa de ser identidade.** A tabela `ARCOS` já migrava o SAVE por `id`;
o CÓDIGO continuava escrito em números, e com quatro capítulos os números coincidiam com as
posições. `CAP_PALAVRA = 2`, `cenarioDaEpoca(2)`, `{ ep: 3 }` na `LINHA_TEMPO`, `quem: 1` no
balão do quadrinho: cada um desses literais reapontaria para o capítulo errado assim que O CAIS
entrasse antes de SALVADOR — **sem erro de console e sem tela em branco**, a mesma família de
falha silenciosa que o bloco 1 do `encaixe.js` existe para pegar. Entraram `iEp(id)` (identidade
→ índice) e `blocoArte(e)` (época → bloco de arte), e nenhum índice de época se escreve mais à
mão. `EPOCAS` ganhou o campo **`arteCap`**, porque *posição na lista* e *bloco de arte de
personagem/objetos* descolaram no dia em que entrou capítulo sem arte própria.

**Passada 2 — os oito capítulos.** A linha do arco de HOJE foi copiada para o fim de
`ARCOS_ANTIGOS` ANTES de mexer em `EPOCAS` (o procedimento escrito no comentário da tabela, e
esta foi a primeira vez que ele foi exercido de verdade). `ARCO_ATUAL` andou sozinho, de 1 para
2. Ordem final, com as cenas de cada um:

| # | capítulo | quando | cenas | estado |
|---|---|---|---|---|
| 1 | PINDORAMA | litoral atlântico · séc. XVI | 2 | pronto |
| 2 | PALMARES | serra da Barriga · séc. XVII | 2 | pronto |
| 3 | O CAIS QUE VOLTOU À LUZ | Rio de Janeiro · séc. XIX | 1 | **em obra** — verbo já escolhido: *cavar para saber* |
| 4 | SALVADOR | Bahia · véspera de 1835 | 1 | pronto |
| 5 | JABAQUARA | Santos · 1887–1888 | 1 | **em obra** — verbo por escolher; par obrigatório do 6 |
| 6 | A PEQUENA ÁFRICA | Rio · começo do séc. XX | 1 | **em obra** — verbo por escolher |
| 7 | AS PORTAS | 1932–1985 | 1 | **em obra** — verbo por escolher |
| 8 | O QUE NÃO PODIA SER DITO | 1964–1985 | 1 | **em obra** — verbo já escolhido: *fazer passar* |
| 9 | A PRAÇA | 1984–1988 | 1 | **em obra** — verbo por escolher; par obrigatório do 8 |
| 10 | O QUE SEGUROU | 2020–2022 | 1 | **em obra** — verbo já escolhido: *chegar na última casa* |
| 11 | O QUE TEM FONTE | hoje | 1 | **em obra** — verbo já escolhido: *conferir de onde vem* |
| 12 | AINDA AQUI | terra indígena demarcada · hoje | 2 | pronto — **e continua sendo o último** |

**A regra que governa um capítulo em obra, e ela é §2:** ele **não afirma história nenhuma**.
Diz o nome, o quando (que é o RECORTE do arco aprovado, não um fato solto), o verbo quando já
foi escolhido, e que ainda está sendo escrito — em voz de jogo, não de aviso de erro. Nenhum
dos oito objetos carrega um dígito, um nome de pessoa ou um acontecimento. **O `encaixe.js`
passou a cobrar isso** (bloco 15: nenhum dígito na fala de capítulo em obra).

**O que acontece com quem chega num capítulo em obra jogando** — decidido e documentado no
código: ele é **jogável**, com o motor genérico, e o mundo nunca fica sem chão. Três heranças,
cada uma com razão própria:

- **`arteCap: 3`** — personagem, objetos da rua e retrato vêm de AINDA AQUI, o único bloco cuja
  rua é feita de **coisas**. É §2 e não estética: PALMARES e SALVADOR são os capítulos em que
  quem atravessa a tela é **gente**, e isso só se sustenta com o texto que explica por quê.
- **`arte: [...]`** — a PINTURA é a do capítulo anterior. O mundo não se teletransporta: a rua
  continua a rua, que é o que a abertura diz em voz alta.
- **O capítulo em obra fala SEM ROSTO.** O primeiro print mostrou o custo de não decidir isto:
  a protagonista indígena do presente anunciando JABAQUARA. Escalar quem representa um capítulo
  é decisão do dono (§2); emprestar um rosto por conveniência técnica é decidir sem perguntar.
  Então ninguém é escalado — `#falaRetrato.oculta`, e a caixa fala sozinha.

### O que mediu

- **12 capítulos · 15 cenas** (eram 4 e 7). `MASCARA_EPOCAS` 15 → **4095** (cabe folgado: o
  limite do campo `bits` é 31 capítulos). `S.acolhidos` 4 → **12 posições**. `ARCOS` 2 → 3
  linhas.
- **Peso: 4.150.252 → 4.166.618 bytes (+16,0 KB, +0,39%)**, e **zero imagem nova** — os oito
  capítulos reaproveitam pintura e bloco de arte que já estavam no arquivo.
- **FPS 61** no smoke (piso 58). `npm test` e `node test/encaixe.js` verdes, zero erro de
  console em todas as telas percorridas.
- **Migração conferida pelo smoke:** save do arco 0 (três capítulos, cena 4) acorda em AINDA
  AQUI com `acolhidos` inteiro e sem nenhum bit de capítulo novo aceso.
- Prints: `test/DOZE-eras-tudo.png` (a lista com os doze, rolando, 854 px de rolo em 473 de
  janela, sem barra), `test/DOZE-eras-dia1.png` (o dia 1), `test/DOZE-jabaquara-rua.png` e
  `test/DOZE-jabaquara-fala.png` (a abertura honesta, sem rosto).

### O que quebrou pelo caminho — três achados que só apareceram com doze

1. **O meio-risco não tem glifo.** `pixelRotulo` normalizava só o travessão `—`; o `–` de
   intervalo (o de "1964–1985") saía como **`?`** na tábua da era — `1887–1888` virava
   `1887?1888` no print, sem um erro de console. Corrigido na fonte (`/[—–]/`), não no texto.
2. **A parede de tábuas iguais.** O comentário de `montarCapitulos` já previa ("com doze
   capítulos isso vira ONZE linhas iguais") e o código não cumpria a própria promessa: escrevia
   "AINDA TRANCADA" em todas. O print do dia 1 mostrou dez tábuas idênticas. Agora só a PRÓXIMA
   instrui; as de trás dela são o ordinal, e só.
3. **O raleio da mata ia explodir em silêncio.** `fatorFolha()` era `1 + 0,5 × posição da
   época`: com doze capítulos, ×6,5 — a folha praticamente sumiria da tela, e nenhum teste
   pegaria porque a renda por km é compensada. Passou a contar `blocoArte()`, o que deixa os
   quatro capítulos existentes **exatamente** com os fatores medidos em 07/08 (×1 · ×1,5 · ×2 ·
   ×2,5) e adia a decisão para quando os doze forem construídos.

### ⚠ O QUE NÃO DECIDI, E POR QUÊ — vai para a mesa do dono

1. **A PARTIDA FICOU 2,14× MAIS LONGA, e isso é ECONOMIA.** `LIMIAR_FIM` = `LIMIAR_CENA ×
   TOTAL_CENAS` foi de **10.500 para 22.500** de impacto, porque os oito capítulos ocupam oito
   cenas. É consequência aritmética de "os doze existem", não uma escolha minha — e é grande
   demais para eu escolher sozinho. **O botão é de uma linha** (`LIMIAR_CENA = 1500`), e as
   opções são três: aceitar a partida mais longa; baixar `LIMIAR_CENA` para ~700 e manter o
   tempo total de hoje; ou dar aos capítulos em obra um passo mais curto que o dos prontos.
   **Nada medido ainda** — quando o dono escolher, vai com medição antes/depois, como manda a
   regra.
2. **A pintura de um capítulo em obra é a do capítulo anterior**, e pintura é afirmação de
   lugar: JABAQUARA (Santos) rodando sobre a ladeira de Salvador. O texto diz em voz alta que o
   capítulo está em construção, e a alternativa (mundo sem chão) é pior — mas isto é §2 de
   representação e fica registrado como pendência, não como decisão.
3. **O ACEIRO ficou de fora, de propósito.** O `HISTORIA-CONTEMPORANEO.md` desenha o capítulo
   do agronegócio inteiro e ele responde a um pedido literal do dono (2026-08-08). Mas ele
   **não está no arco de doze** aprovado em 07/08, e pô-lo na cronologia é (a) fazer treze e
   (b) reordenar a fila — que é o **item 1 das nove decisões ⚠** do próprio relatório do
   historiador. A estrutura está pronta para recebê-lo: acrescentar um objeto acima de AINDA
   AQUI e copiar a linha de hoje para `ARCOS_ANTIGOS`. É tudo.
4. **A `LINHA_TEMPO` não ganhou nó nenhum** dos oito. Coerente com a regra: a tela A HISTÓRIA
   só mostra o que tem fonte, e um marco em obra afirmaria por existir. O quadrinho continua
   com **26 páginas** e os **7 pontos de parada** intactos. Quando um capítulo for escrito, o
   marco dele entra junto com as fontes.

### Como preencher um capítulo em obra (o procedimento, escrito uma vez)

Trocar o texto por texto com fonte · dar a ele `arte`/`arteCap` próprios · ajustar `cenas` se
ele merecer mais de uma · apagar `emObra` · pendurar os nós dele na `LINHA_TEMPO` com a fonte
junto · e, **se `cenas` mudar**, copiar a linha de hoje para o fim de `ARCOS_ANTIGOS` antes de
mexer. O `encaixe.js` bloco 15 e o bloco 4 cobram o resultado.

### Próximo passo
A resposta do dono ao item 1 (a duração da partida) trava a próxima medição de economia. Sem
ela, o trabalho que anda sozinho é preencher um capítulo em obra de cada vez — e o primeiro da
fila do arco é **O CAIS QUE VOLTOU À LUZ**, que já tem verbo, tem instituição viva no assunto e
é o único dos oito cuja pesquisa não esbarra na régua dos cinco anos.

---

## 2026-08-09 · HANDOFF DA MADRUGADA — leia isto antes de qualquer coisa

O dono foi dormir e autorizou **nove horas** de trabalho sozinho. Este bloco existe para que
uma virada de contexto não perca o estado. Se você é a sessão seguinte: leia daqui, não do
começo do arquivo.

### O que está APROVADO e pode ser feito sem perguntar
- ~~**Carga sob demanda da arte**~~ — **FEITA em 2026-08-10.** Medido: **16,65 s → 6,30 s** em
  Fast 3G (melhor que os 8,7 s projetados, porque os sprites de cada época foram no pacote
  também). Diário completo no fim deste arquivo.
- **Começar a medir com PostHog** — mas depende da conta dele. Ver pergunta 7.
- **Placeholder para tudo**: os doze capítulos existem, oito em obra.
- **Foco é WEB.** Android saiu da frente da fila.

### O que ele PEDIU e ainda não foi feito
- Uma tela dizendo o que o jogo é **antes do JOGAR** (quem chega por link não sabe o que é).
- Os três consertos do `CINCO-MINUTOS.md` — o terceiro (estado do `rotuloMelhorias`) e o
  **momento morto de 180,7 s** continuam abertos.
- A régua de luz de SALVADOR (depende de arte nova).

### As OITO perguntas que estão com ele (nada aqui se decide sozinho)
1. Quem aparece em cada capítulo novo (§2 — trava os pedidos de sprite e retrato dos oito)
2. O CAIS pode ter imagem? (§2.4, Valongo vizinho do Cemitério dos Pretos Novos)
3. Capítulo em obra veste a pintura do anterior, ou tela neutra?
4. O ACEIRO entra no arco de doze?
5. Antecipar ditadura e agronegócio? (custo: atravessar a abolição sem jogá-la)
6. Domínio próprio (só ele compra)
7. Conta do PostHog + chave pública (sem isso não se mede nada)
8. Telefone deitado: travar em retrato ou compor para os dois?

### Armadilhas frescas, todas pagas hoje
- **Matei o servidor da mesa com a página dele aberta**, duas vezes, e ele viu "erro ao
  salvar". O servidor estava certo. Se precisar reiniciar a mesa, avise antes.
- **Rodar teste que encosta em arquivo de `assets/entrada` caduca recusas** — por isso a
  recusa passou a valer pelos BYTES, não pela data.
- **Duas instâncias da mesa na 8200**: a antiga continua respondendo e você mede o estado
  errado. Mate por porta (PowerShell `Get-NetTCPConnection`), não por `pkill`.
- **Citei três relatórios em commits antes de gravá-los.** Confira a escrita ANTES de escrever
  o commit que fala dela.
- **Teste que descreve o bug vira guardião do bug** — quatro asserções do `robusto-tudo.js`
  cobravam o comportamento COM o defeito.

### O estado, em número
12 capítulos (4 escritos, 8 em obra) · 15 cenas · `index.html` **1,51 MB** + 2,47 MB em cinco
pacotes sob demanda · abre em **6,30 s** no Fast 3G (era 16,65 s) · fim da partida
**11.700** · FPS 61 · `npm test` PASS · `encaixe.js` 16 blocos · `robusto-tudo.js` 6 de 6 ·
mesa com **18 para gerar**, 9 chegados, 48 prontos.

---

## 2026-08-10 · CINCO CAPÍTULOS EM OBRA GANHAM A PAISAGEM DELES

**Lente:** *Medir* — o ticket era peso, e peso é a única coisa aqui que ninguém pode estimar
de cabeça.

Sete capítulos em obra vestiam a ladeira de SALVADOR (`arte: [4]`), o que o `PENDENTES.md` já
apontava como problema de §2: **pintura afirma lugar**, e JABAQUARA rodava sobre a Bahia de
1835. Chegaram catorze pinturas em `assets/entrada`. Cinco capítulos passaram a ter a
paisagem própria; dois não, e o motivo está no `PENDENTES.md` item 8.

### A auditoria, antes de tocar em qualquer coisa

**Nenhuma das catorze tem figura humana.** Conferido peça a peça, olhando, não deduzindo — é
a trava do §2 e a única razão que faria a integração parar antes de começar.

Régua de luz do pedido (R ≤ B, saturação ≥ 55%), medida com um instrumento novo,
`test/medir-luz.js`. O que ele mostra, e que muda como a régua deve ser lida:

| peça de CIMA | R−B | saturação | | peça de CHÃO | R−B | saturação |
|---|---|---|---|---|---|---|
| jabaquara | **−21,5** | **56,4%** | | jabaquara | +56,8 | 65,0% |
| naodito | −9,0 | 31,4% | | naodito | +41,8 | 31,6% |
| portas | −3,7 | 36,7% | | portas | +73,3 | 47,4% |
| praça | −6,0 | 47,2% | | praça | +4,1 | 42,7% |
| segurou | −9,7 | 47,9% | | segurou | +34,7 | 39,4% |
| pequena áfrica | +5,5 | 31,2% | | pequena áfrica | +54,8 | 39,8% |
| tem fonte | +37,1 | 43,7% | | tem fonte | +16,2 | 11,2% |

**A régua de R ≤ B só vale para a peça de CIMA, e o número prova.** As sete peças de chão que
já estão no jogo há meses medem de **+50,5 a +116,9** — terra é marrom, e marrom é vermelho
maior que azul por definição. Cobrar R ≤ B de um chão é cobrar que ele não seja chão. O
`medir-luz.js` imprime as duas colunas e o julgamento; quem ler a saída precisa saber disto,
e por isso está escrito aqui e no cabeçalho do instrumento.

**O caso SALVADOR não se repetiu**, que era o medo: a pintura 4 tem R−B **+47,1** com saturação
38,6% e ficou presa num entardecer. Das novas peças de cima, cinco estão entre −21,5 e −3,7.
**A única a repetir o defeito é O QUE TEM FONTE (+37,1)** — e ela tem desculpa que SALVADOR não
tinha: é a **primeira pintura de interior do jogo**, madeira, latão e luminária de arquivo. Não
há céu para ser azul. Entrou assim, consciente.

O que ficou fora da régua sem desculpa é a **saturação**: as sete peças de cima já embutidas
vivem entre **56,2% e 66,3%**, e das cinco novas só JABAQUARA (56,4%) alcança. As outras ficam
entre 31% e 48% — vão ler mais lavadas que as irmãs. Não é defeito que impeça de entrar; é
número para o próximo pedido.

### O que quebrou a premissa do inline-fundos.js, e por que ele mudou

1. A entrega vem em `assets/entrada` com **outro nome** (`cap-<slug>-fundo-chao`, e não
   `<cap>-baixo`). Renomear catorze arquivos à mão a cada leva é o tipo de erro que não dá
   console: peça trocada põe a paisagem do capítulo errado na tela, calada.
2. **`assets/entrada` é ignorada pelo git.** Quem converteu SALVADOR converteu direto de lá e
   nunca commitou o mestre de 720×959 — **a pintura 4 não tem fonte no repositório hoje**, e
   este script, rodado como estava, morreria procurando `cenarios-novos/cap4-alto.png`. Agora
   converter **grava o mestre em `assets/cenarios-novos`**, que é versionada.
3. Por causa de (2), peça sem fonte é **preservada byte a byte** do `src/jogo.ts`. Conferido:
   7 de 7 antigas idênticas depois de rodar.

### O achado que economizou peso e salvou as pinturas: NÃO QUANTIZAR

O `converter-fundo.js` corta a paleta em 48 cores porque a **primeira** leva chegou como
ilustração de gradiente macio. A leva de 10/08 já vem com borda dura. Quantizar de novo faz
duas coisas ruins ao mesmo tempo, e a segunda eu não esperava:

```
jabaquara-alto   sem quantizar   75,7 KB   erro 0,00
                 48 cores        89,0 KB   erro 12,59   ← MAIOR e muito pior
                 96 cores        82,9 KB   erro  4,54
                 256 cores       80,7 KB   erro  2,98
```

**Banda chapada com degrau duro custa mais bits em WebP que o degradê original**, porque o
degrau é uma borda e borda é o que o codec paga caro. A primeira rodada saiu com a mata em
três verdes chapados e o casario em manchas laranja — e 13 KB mais gorda. `CORES = 0`.

### O peso, que era o assunto

| | antes | depois | conta |
|---|---|---|---|
| `index.html` no disco | 3,97 MB | **4,54 MB** | +0,57 MB (+14,4%) |
| no fio (brotli q5) | 2,83 MB | **3,26 MB** | +0,43 MB |
| Fast 3G · tela desenhada | 16,63 s | **19,17 s** | **+2,54 s** |
| Slow 4G · tela desenhada | 14,67 s | 16,90 s | +2,23 s |

**Meia décima de segundo de abertura por capítulo** (2,54 s ÷ 5 = 0,51 s). É o preço, dito
sem maquiagem: cinco capítulos deixam de mentir sobre onde se passam, e todo mundo espera
meio segundo a mais por cada um deles. Qualidade WebP **0,72**, a régua do §6 — o
`inline-fundos.js` ainda dizia 0,80, número anterior à revisão de 07/08, e regerá-lo assim
teria *engordado* o arquivo desfazendo uma medição já feita.

Testado e recusado: **regerar as sete antigas do PNG mestre** em vez de manter o reencode
duplo do `requalificar.js`. Devolveu **8 KB** em 1.939 e mexeria em doze peças estáveis.
`tirar-icc.js` rodou por último e tirou 18,7 KB com diferença máxima de canal **0**.

### As duas tabelas por pintura

- **`REPETICAO_PINT`** — quatro das cinco são arquitetura, e três delas (8, 10, 11) têm ponto
  de fuga central, o que é *pior* que SALVADOR: espelhada, a rua vira duas ruas convergindo
  para lugar nenhum. Levam o tratamento de SALVADOR (`[false, 1, true, true]`). Comparado nos
  prints `REP-*`, não deduzido. JABAQUARA é mata subindo encosta e fica na regra orgânica.
- **`CEU_PINT`** — medido com `prints-onda2.js` (que lê quantas pinturas o jogo tem, em vez
  de trazer o número escrito à mão, e por isso cobriu as doze sozinho). Topo/céu à noite:
  **7 → 0,96 · 8 → 0,86 · 9 → 0,88 · 10 → 0,82 · 11 → 0,91**, todas dentro do alvo de ≤ 1,1 na
  primeira tentativa. Motivo: a leva nova tem **céu azul cheio**, e não a névoa clara de
  horizonte das seis primeiras — era a névoa que sobrevivia à noite e obrigava a calibrar
  peça a peça.

### O que o print mostra e o teste não mostraria

- **JABAQUARA:** o recorte ao centro (607 de 1.942 px, a conta do pipeline) **come o porto de
  Santos e o mar**, que eram metade do assunto do pedido. Sobra a encosta com as casas, que
  é boa — mas quem pedir a próxima pintura larga precisa saber que só os 31% centrais entram.
- **A emenda alto/chão de JABAQUARA fica nua**: a peça de cima termina em clareira clara de
  areia e a de baixo começa em mata escura com barro. O `matoDaEmenda()` disfarça, mas o
  degrau de tom se vê. As irmãs orgânicas não têm isso porque foram pintadas em par.
- **O QUE TEM FONTE** é um interior visto de dentro, e a personagem anda na frente de uma mesa
  enorme. Lê-se como arquivo — mas a escala é estranha, e é o candidato número um a ser
  refeito quando o capítulo for escrito.

### Próximo passo

As duas peças de chão de A PRAÇA e O QUE SEGUROU (`PENDENTES.md` 8). Depois disso, a pergunta
que fica na mesa do dono e que eu não decido: **+0,51 s de abertura por capítulo é aceitável
até doze?** Se for, o arquivo único chega perto de 5,1 MB e 21 s no 3G. Se não for, a conversa
deixa de ser sobre qualidade de WebP e passa a ser sobre carregar a pintura do capítulo **sob
demanda** — e isso é arquitetura, não compressão.
## Diário — 2026-08-10 · Plataforma · A ARTE DE CADA CAPÍTULO CHEGA QUANDO A PESSOA CHEGA NELE

A mudança #1 do `RELATORIO-PESO.md`, aprovada pelo dono ("pode seguir"). Ela está feita, e
abaixo estão os números medidos, o que quebrou no caminho e o que ficou de fora.

### O antes e o depois, medido na mesma máquina (`test/peso-abrir.js`)

| | arquivo | no fio | **Fast 3G** | Slow 4G | 1ª tinta |
|---|---|---|---|---|---|
| antes (comprimido, como a Vercel serve) | 3,97 MB | 2,83 MB | **16,65 s** | 14,69 s | 1,54 s |
| **depois** | **1,51 MB** | **0,98 MB** | **6,30 s** | **5,30 s** | 1,54 s |
| antes (cru, como o Capacitor empacota) | 3,96 MB | — | 23,3 s | 20,8 s | 1,52 s |
| **depois (cru)** | **1,51 MB** | — | **9,18 s** | **7,94 s** | 1,21 s |

**16,65 s → 6,30 s.** É melhor que os 8,7 s que o relatório projetava, e a razão é conhecida:
o protótipo dele deixava os sprites de cada época no arquivo de abertura, e aqui eles vão no
pacote também — que era exatamente a recomendação do §7 do relatório.

**O custo, e ele é real:** entrar em PALMARES cobra **3,66 s em Fast 3G** (2,96 s em Slow 4G)
para buscar os 753 KB do pacote. Esses segundos são gastos dentro do fecho do capítulo
anterior, da travessia e da cerimônia — segundos em que a pessoa está lendo — porque o pedido
é disparado no início da virada, não na hora de desenhar. Na porta de entrada, onde a pessoa
ainda não investiu nada e vai embora, o custo é zero.

**E, o que importa mais que o número de hoje:** a porta de entrada **parou de crescer**. Um
capítulo novo com pintura e sprites próprios custa 0 KB nela. O caminho antigo entregava
38,5 s no capítulo 12.

### Os pacotes

```
pack-palmares  753 KB    pack-hoje      741 KB    pack-salvador  426 KB
pack-historia  347 KB    pack-travessia 263 KB              index.html  1,51 MB
```

`pack-historia` só é pedido quando alguém abre A HISTÓRIA; `pack-travessia`, só quando há
travessia entre os dois capítulos. Quem joga o capítulo 1 e fecha nunca baixa nenhum dos dois.

### O que foi decidido, e por quê

- **O pacote leva a pintura E os sprites da época.** Medido no relatório: só a pintura deixaria
  ~225 KB por capítulo na abertura, e ela voltaria a crescer (8,7 s no capítulo 4 virariam
  15,7 s no 12).
- **A CSP abriu UMA diretiva:** `connect-src 'none'` → `'self'`. Nada além. `img-src data:`
  **não** mudou, porque a arte continua chegando como `data:` de dentro do pacote.
- **A tabela de partição vive num arquivo só** (`ferramentas/pacotes.js`), lido pelo build E
  embutido no jogo (`var __PACOTES`). Duas cópias divergiriam em silêncio, e o sintoma seria a
  pintura de um capítulo nascendo vazia.
- **Capítulo novo não precisa de linha nenhuma no jogo.** `pacotesDaEpoca()` deriva o que pedir
  dos próprios dados do capítulo — `arte`, `arteCap` e `aberturaImg` — cruzados com a tabela.
- **Sem pré-busca especulativa do capítulo seguinte.** Ela tornaria a virada instantânea, mas
  baixa 753 KB para quem talvez nunca chegue lá. A virada já tem cerimônia suficiente para
  cobrir 3,7 s. Fica anotado no `PENDENTES.md` como opção medível, não como dívida.

### O jogo nunca fica sem chão — e o que isso custou de verdade

Toda imagem que viajou vale um **GIF 1×1 transparente** até o pacote chegar. Cinco lugares
recuam para a arte do capítulo 1, que nunca sai da abertura: `fundoComArte` (pintura),
`heroBloco` (personagem), `mobFrame` (o que atravessa a rua), `dropDe` (o que fica no chão) e
`frenteBloco` (vegetação). Um pacote que falha de baixar não quebra a partida: é anotado com
`console.warn`, o capítulo segue com o recuo, e a tentativa é **reencenada** na próxima entrada.

**A distinção que custou uma releitura e sem a qual isto estaria errado:** `temArte()` (carregou
e é imagem de verdade) e `esperando()` (carregou e é o pixel de espera) **não são a negação uma
da outra**. Uma imagem ainda decodificando não é nenhuma das duas. Sem essa terceira condição,
os primeiros quadros de toda partida trocariam a arte certa pela de recuo, só porque nada tinha
acabado de carregar ainda — e o sintoma seria a pessoa do capítulo 1 aparecendo por meio segundo
no capítulo 3, que é falha de §2 vinda por uma porta técnica.

### O custo escondido que ninguém tinha somado

Seis caches medem números **da imagem** na primeira vez que a desenham: `heroScale` (altura do
quadro da caminhada), `mobScale`, `frenteFrac` (onde a tinta da planta acaba), `dropScale`,
`flashCv` (o pisca branco assado) e `travMarIm`. Medidos no pixel de espera, ficam **errados
para sempre** quando a arte chega — e o sintoma seria a personagem saindo do tamanho de um pixel
esticado, **sem erro nenhum no console**. `esquecerMedidasDaArte()` zera as seis a cada pacote
aplicado; `dropScale` e `flashCv` deixaram de ser `const` só por isso.

### As quatro coisas que liam "um arquivo", conferidas uma a uma

| quem | o que precisou mudar |
|---|---|
| **Vercel** | nada — o `vercel.json` já publica `dist/`, e o build passou a escrever os pacotes lá |
| **Capacitor** | nada — empacota `dist/` inteiro, e `androidScheme: https` faz o `fetch` funcionar |
| **`npm start`** | nada — o `servir.js` já conhece o tipo `.json` |
| **smoke test** | **abria por `file://`, e ali o Chromium recusa o fetch.** Agora sobe um servidor próprio |

O smoke test foi o único custo real, como o relatório previa, e era do tipo perigoso: sem
trocar, ele continuaria **passando** enquanto exercitava só o caminho de recuo.

### A trava do build aprendeu o contrato novo

A trava antiga cobrava `src=` e `href=` e **não via um `fetch()`**. Agora ela cobra quatro
coisas, e a quarta é a que impede o resto de virar teatro:

1. nenhuma outra porta de rede (`XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `import()`);
2. todo `fetch(` tem a forma exata `fetch(caminhoPacote(nome))` — contagem contra contagem;
3. `caminhoPacote()` é cobrada byte a byte: `return "pack-" + nome + ".json"`, relativo, sem host;
4. a **CSP é pregada diretiva por diretiva** contra uma tabela dentro do próprio `construir.js`.

Provado nas duas pontas: trocar `connect-src` por um host derruba o build, e fazer
`caminhoPacote` devolver `https://…` também.

### O que se perdeu, e está aceito

**Abrir o `index.html` da raiz com dois cliques (`file://`) passa a mostrar a arte do capítulo 1
em todo lugar.** O Chromium recusa o `fetch` sob `file://` e o jogo **nem tenta** — em silêncio,
porque encher o console de erro por uma tentativa que o navegador já decidiu recusar não ajuda
ninguém. O jogo continua inteiramente jogável assim; só a arte dos capítulos 2+ não aparece. Os
três lugares onde o jogo roda de verdade (Vercel, `npm start`, Capacitor) não usam `file://`.

### O que o smoke test passou a cobrar

Um bloco novo, e ele roda **antes de tudo** de propósito: precisa de uma página recém-aberta,
em que nenhum pacote foi pedido. Ele prova, em jogo vivo, que (1) na abertura a arte do
capítulo 1 é real e a dos outros é o pixel de espera — é o único aviso de que a porta de entrada
voltou a crescer, porque o jogo continuaria funcionando perfeitamente; (2) depois do pacote a
arte volta **no lugar certo** em todos os capítulos que pedem um — endereço errado devolve a
imagem no capítulo errado e não dá erro nenhum; (3) enquanto espera, a pintura em uso tem 720 px
de largura, não 1; e (4) um pacote que nunca chega deixa o jogo desenhando e é tentado de novo.

### O efeito colateral que quase passou: quarenta instrumentos medindo a arte errada

O relatório previa **um** custo escondido, o smoke test. Ele estava certo sobre o teste e curto
sobre o número: **quase quarenta instrumentos** deste repositório abrem o jogo por `file://`
(`encaixe.js`, `robusto-tudo.js`, os `medir-*`, os `prints-*`, os `cinco-*`, `prova-cores`…).
Sob `file://` cada um deles continuaria rodando lindamente e medindo a arte do capítulo 1
achando que media a do capítulo 3 — **print bonito, número errado, nenhum aviso**. Deixar assim
seria fabricar quarenta medições silenciosamente falsas.

`test/abrir.js` resolve os quarenta de uma vez, e a forma é o que faz isso ser barato: em vez
de reescrever o corpo de cada ferramenta, **envolve-se a expressão que ela já monta**.

```js
const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
```

Devolve `http://127.0.0.1:8198/<caminho>` para qualquer `.html` **dentro** do repositório e
devolve o que recebeu, intocado, para todo o resto — por isso as ferramentas de arte que abrem
um PNG de `assets/entrada` passam por ali sem mudar de comportamento. Foram 51 aberturas em 51
arquivos. A **porta é fixa** de propósito: um `listen(0)` daria porta livre garantida, mas só a
informa num callback, e aí a função teria de ser assíncrona — o que obrigaria a mexer no CORPO
das quarenta em vez de envolver uma expressão.

### E o `encaixe.js` pegou duas coisas de verdade — que é para isso que ele existe

1. **A tela de AJUSTES ainda prometia "NADA SAI DESTE APARELHO / O JOGO NÃO TEM REDE".** O
   `CLAUDE.md` §3 previa exatamente isto e mandava reescrever a tela **na mesma fase** que ligar
   a rede. O bloco 8 do `encaixe.js` existia justamente para amarrar as duas — e cobrou.
   Passou a dizer **"SEU JOGO FICA NESTE APARELHO / O JOGO SÓ BAIXA A ARTE DELE"**, que é o que
   é verdade e é o que a pessoa quer saber: o save, o tempo jogado, os toques e os dias
   continuam sem ter para onde ir. A asserção virou de **três estados** (fechada · só o próprio
   site · qualquer outra coisa) e **recusa** a terceira, em vez de deixá-la passar calada.
2. **"PALMARES PERDEU a pintura: era 2,3, virou 0,0"** — falso positivo, e útil. O bloco media
   `fundoIdx()` antes de os pacotes chegarem, ou seja, media o **recuo**. Agora espera a arte
   toda chegar antes de medir o mapeamento. **Lição que vale para o próximo instrumento:** desde
   10/08, medir arte de capítulo sem esperar o pacote mede o recuo, não a arte.

### O aviso que o build ganhou — e o defeito que ele achou na primeira volta

`pacoteDoEndereco` devolve `null` para o que não sabe classificar, e isso é de propósito: o pior
caso é a arte pesar na porta de entrada, nunca sumir do jogo. Mas **"de propósito" e "esquecido"
ficam idênticos em silêncio** — pintura nova entra, ninguém acrescenta a linha em
`ferramentas/pacotes.js`, e a abertura volta a crescer capítulo a capítulo sem que nada diga
nada. É exatamente o modo de falha que este trabalho existe para acabar. Então o build passou a
CONTAR e FALAR: aviso, nunca build vermelho — quem integra arte no meio de uma sessão merece uma
linha dizendo o que falta, não um build quebrado.

**E ele achou um defeito na primeira vez que rodou.** A regra do sufixo do herói era "o último
dígito da chave", e isso classificava `atk2` — a folha de ALCANCE do **capítulo 1** — como sendo
do capítulo 2. Não virou defeito visível por puro acidente: `atk2` é byte a byte igual a `atk1`,
que fica na abertura, e a regra "literal já paga na abertura não viaja" a segurou. Acidente não
é projeto, e nenhum teste pegaria isto, porque a arte do capítulo 1 é justamente a que ninguém
confere depois de aplicar um pacote. Agora as chaves são lidas pela forma delas: `walk`, `sp` e
`run` levam o sufixo colado; `atk1` e `atk2` já terminam em dígito e o sufixo do capítulo vem
depois de `_`. A saída do build ficou **byte a byte idêntica**, que é a prova de que a fuga era
mesmo pelo acidente.

### A dúvida que fica

O relatório aponta uma variante que economiza mais 25% do arquivo **cru** (o que importa para o
Android e para a memória): servir `.webp` de verdade em vez de base64 dentro de JSON. Ela custa
uma segunda diretiva de CSP (`img-src data: 'self'`) e uma reescrita do pipeline de arte. Não
foi feita, e a pergunta honesta é se vale: no fio comprimido a diferença é pequena, porque o
brotli já devolve quase todo o inchaço do base64. **Só se decide com medição própria.**

---

## Diário — 2026-08-10 · A MEDIÇÃO GANHA A TERCEIRA PERNA: o erro, a pergunta, e onde se para

Três coisas aprovadas pelo dono, todas pelo MESMO `fetch` de vinte linhas que entrou hoje de
manhã. **A biblioteca do PostHog continua fora**, e essa é a decisão que sustenta as três: a
abertura acabou de cair de 19,2 s para 6,3 s num 3G, com a porta de entrada em 1,51 MB, e o SDK
do navegador desfaria parte do ganho para fazer o que quarenta linhas já fazem. A CSP **não
abriu nem uma diretiva** — tudo viaja pelo host que já estava aberto (`https://us.i.posthog.com`,
região **US**, que é onde o projeto do dono está).

### 1 · ERRO VISÍVEL — e o teto é TRÊS, por quatro razões somadas

`window.onerror` e `unhandledrejection` mandam um evento `erro` com **a mensagem, o arquivo e a
linha, e nada mais**. Nem capítulo, nem impacto, nem estado: relatório de defeito é o esconderijo
clássico de dado de gente, porque parece técnico e ninguém o lê como dado pessoal. O arquivo sai
como CAMINHO, sem domínio, sem `?` e sem `#` — consulta em URL é o outro esconderijo, e o jogo
não tem nenhuma hoje, mas a regra vale contra o amanhã.

**`MEDIDA_ERRO_TETO = 3`, e o três é derivado:**

1. uma exceção presa no laço de quadro dispara **60×/s** — dez minutos de defeito seriam trinta
   e seis mil pedidos saindo do telefone de alguém, pagos com a bateria dela;
2. por isso agrupa-se **por mensagem** primeiro: a segunda ocorrência do mesmo texto não ensina
   nada que a primeira não tenha ensinado. Medido: **201 exceções, 1 evento**;
3. e ainda assim três, e não trinta, porque mensagem com número variável (`... at frame 1234`)
   escapa do agrupamento e volta a ser tempestade. Três deixa ler uma **cascata** (A derruba B
   derruba C), que é o caso em que a primeira mensagem sozinha engana, e para aí. Medido:
   **40 mensagens diferentes → 3 eventos**;
4. e três de um orçamento de quarenta (`MEDIDA_TETO`) garante que um jogo quebrado **não gaste a
   cota gritando** e leve junto o "voltou no dia 3", que é a razão de a medição existir.

Medido também: **201 exceções e a partida seguiu inteira** — a rua andou e A HISTÓRIA abriu.

**A armadilha que custou duas voltas do teste:** exceção jogada de um `page.evaluate`, ou de um
`<script>` criado por `createElement`, chega com `e.filename` **VAZIO** — o Chromium só dá
`filename` a script que veio do ANALISADOR da página. O teste acusava o jogo de não saber dizer
o arquivo quando quem não sabia era o Playwright. O bloco 18 passou a **injetar o defeito no HTML
servido**, antes de `</body>`; aí o campo veio `/` e a linha `7502`, que é uma linha de verdade
do arquivo único.

### 2 · "VOCÊ VOLTARIA AMANHÃ?" — a única pergunta que o jogo faz a quem o joga

Na CHEGADA, entre o placar e as duas portas. Papel de campo para a pergunta (PAPEL fala serifa),
três tábuas para as respostas (MADEIRA fala bitmap) — **nenhum material novo**, que é a decisão
inteira: uma caixa de pesquisa com visual próprio seria o Frankenstein que a régua do menu
existe para impedir, e aqui leria como formulário de site colado num jogo pintado.

- **Uma vez, e só uma.** `ESQUEMA_RET.volta`: 0 nunca feita · 1 feita e calada · 2/3/4 a
  resposta. A marca de "perguntada" é posta ao MOSTRAR, não ao responder — senão quem fecha em
  silêncio é perguntado de novo em toda chegada, e aí o convite virou cobrança.
- **Não é pedágio**: as duas portas e o VOLTAR seguem do mesmo tamanho, e sair sem responder sai.
- **Não é avaliação.** Nada de estrela, nota ou "gostou" — o §2.1 diz que a CHEGADA não é troféu,
  e o bloco 19 cobra o vocabulário por regex, como o bloco 10 já fazia com o placar.
- A confirmação é o **próprio papel** virando "anotado." em voz de margem, e as tábuas somem —
  mesma gramática do interruptor dos AJUSTES: a confirmação é o texto, nunca um alerta.

**"NÃO VOLTO" foi medido e recusado:** a tábua é a tela dividida por três, e o rótulo dava
**110 px numa tábua de 87** em 320×568 — letra saindo pela borda da madeira. Virou **"NÃO"**, que
responde a mesma pergunta na mesma voz porque a pergunta logo acima já traz o verbo; o rótulo
mais largo passou a ser TALVEZ, com 74 px, e a folga mínima virou 13 px.

**E a pergunta pagou o aluguel dela.** Medido ao pô-la na tela: o VOLTAR PARA A RUA caía **17 px
abaixo da dobra em 360×640 e 37 px em 320×568** — exatamente o defeito que as duas consultas de
altura da CHEGADA existem para não ter. Apertou-se **respiro, nunca palavra**: margem entre
linhas do placar, margem entre tábuas, topo da tela. Depois:

| tela | VOLTAR em relação à dobra | alvo de dedo da resposta |
|---|---|---|
| 430×932 | −91 px | 46 px |
| 412×915 | −74 px | 46 px |
| 390×844 | −3 px | 46 px |
| 360×640 | −5 px | 40 px |
| 320×568 | −4 px | 36 px |

(negativo = acima da dobra, inteiro na tela). `test/prints-pergunta.js` refaz as três larguras.

### 3 · ONDE A PESSOA PAROU — o evento existia e estava meio cego

O `parou` já saía no `visibilitychange` e no `beforeunload`, com o capítulo. Faltavam duas coisas:

- **`pagehide`**, que no celular é O gancho: o iOS não garante o `beforeunload`, e ele não dispara
  quando a aba entra no cache de volta-para-trás. Os três chamam a MESMA função armada uma vez —
  medido: **1 evento**, não três;
- **`sessao`**, os segundos DESTA carga de página. "Parou no capítulo 3 com 40 s" e "parou no
  capítulo 3 com meia hora" são duas pessoas opostas com o mesmo capítulo, e sem esse número o
  capítulo sozinho diz onde ela ESTAVA, nunca se ela estava indo embora. Em segundos de
  propósito: a sessão que interessa é a curta, e ela some inteira arredondada para minuto.

### A tela de AJUSTES mudou no MESMO commit — é o §3, e não é formalidade

"UMA CONTAGEM ANÔNIMA" continuaria verdadeiro ao pé da letra e falso no que importa: a mensagem
de um erro e a palavra que a pessoa escolheu no fim **não são "contagem" em português nenhum**.
É a forma mais elegante de uma tela mentir sem uma palavra falsa. Entraram quatro linhas:

> SE O JOGO QUEBRAR, A MENSAGEM / DO ERRO — NADA DA SUA PARTIDA. / E A SUA RESPOSTA À PERGUNTA
> DO FIM, / SE VOCÊ RESPONDER.

As cinco negativas (sem nome, sem e-mail, sem IP, sem cookie, sem anúncio) e o interruptor
continuam onde estavam. O bloco 8 do `encaixe.js` passou a cobrar as duas frases novas.

### O que o `encaixe.js` ganhou

Três blocos, um por entrega — **18** (o erro: chega, agrupa, para no teto, não derruba a
partida), **19** (a pergunta: uma vez, sem pedágio, sem avaliação, e a resposta vai), **20** (o
`pagehide` manda o "onde parou" com o tempo da sessão). A lista branca do bloco 17 ganhou
`msg`, `arquivo`, `linha`, `resposta` e `sessao` — e é ela o portão: propriedade que ninguém
aprovou reprova ali.

### A dúvida que fica

O `arquivo` vai sair `/` para todo mundo enquanto o jogo for um arquivo só servido na raiz —
ou seja, hoje ele custa nada e ensina nada, e quem ensina é a linha. Ele fica porque a fase do
Phaser/Supabase traz um segundo arquivo e aí a distinção passa a existir. Se aquela fase não
vier, é campo para tirar.

### Estado

`npm test` verde · `encaixe.js` **20 blocos** verdes · `robusto-tudo.js` 6 de 6 · FPS 61 ·
`index.html` 1,52 MB.

---

## Diário — 2026-08-10 · Historiador · O BURACO DE 1888 A 1964 SE FECHA, E O ACEIRO ENTRA NO ARCO

**Lente:** *Medir*, aplicada a texto — que afirmação eu estava aceitando sem documento? A
resposta era constrangedora: **todas as de 1888 a 1964**, porque não havia nenhuma. O jogo ia
de `1888 · A lei de dois artigos` direto para `1988 · A Constituinte`, e o `PENDENTES.md`
chamava isso de "salto jogado".

### As duas decisões do dono, ditas nesta sessão

1. **Os marcos entram, a fila NÃO se reordena.** Perguntado se queria antecipar ditadura e
   agronegócio na fila de capítulos: *"fiquei entre A e B, quero incluir esses marcos na linha
   do tempo mas mantendo a ordem cronológica."* Ou seja: nenhum capítulo muda de lugar; o que
   entra são **momentos na `LINHA_TEMPO`**.
2. **O ACEIRO entra no arco** — resposta à pergunta 4 do handoff de 09/08.

### O que entrou: SEIS MARCOS, e cada um é uma norma com número

Todos conferidos **nesta sessão**, em texto público, e cada um está agora também na tela DE
ONDE VEM, num grupo próprio (`DE 1888 A 1964 — A NORMA, PELO NÚMERO`).

| marco | o que a norma diz | onde conferi |
|---|---|---|
| **1890** · O código de dois anos depois | Código Penal da República: o art. 399 faz crime não ter ocupação; o art. 402 nomeia a capoeira e a faz crime | Decreto nº 847, de 11/10/1890 — texto **literal** dos dois artigos (transcrição integral do decreto), com o ato registrado na Câmara (`legin`) e no Planalto |
| **1891** · Quem podia votar | *"Não podem alistar-se eleitores… os mendigos; os analfabetos; as praças de pré"* | CF/1891, art. 70 §1º — **literal**; o caput conferido também em página da **Câmara dos Deputados** |
| **1930** · O decreto que dissolveu o Congresso | governo provisório com as funções do Executivo **e** do Legislativo *"discricionariamente, em toda sua plenitude"*; Congresso, assembleias e câmaras confirmados dissolvidos | Decreto nº 19.398, de 11/11/1930, arts. 1º e 2º — **literal** |
| **1932 → 1985** · O voto, e a porta que ficou fechada | *"É eleitor o cidadão maior de 21 anos, sem distinção de sexo"*; a exigência de saber ler permanece, e só cai com a **EC nº 25, de 15/05/1985** | Decreto nº 21.076, de 24/02/1932, art. 2º (**Câmara dos Deputados**); a exclusão dos analfabetos e o fim dela em 1985, no **TSE** e no **Senado Federal** |
| **1943 → 2015** · A lei do trabalho e quem ficou de fora | CLT art. 7º: não se aplica *"aos empregados domésticos"* e *"aos trabalhadores rurais"*; a CF/88 dá nove direitos à categoria doméstica; a igualdade vem com **EC nº 72/2013** e **LC nº 150/2015** | art. 7º da CLT; o caminho até 2013/2015 no **Senado Federal** |
| **1964** · O ato que tirou o juiz do caminho | *"suspender os direitos políticos pelo prazo de dez anos e cassar os mandatos legislativos federais, estaduais e municipais, excluída a apreciação judicial desses atos"* | Ato Institucional de 9 de abril de 1964, art. 10 — **literal** |

**A régua que governou as seis frases, e ela é o §2.6 exercido pela primeira vez em texto de
jogo:** cada uma afirma **o que a norma afirma**, e nada além. Nenhum político, magistrado ou
empresário nomeado — nem os que a historiografia nomeia sem hesitar. Nenhum partido, nenhum
governo, nenhuma eleição. Duas frases inteiras foram cortadas por serem interpretação minha
disfarçada de fato (*"a rua sabia de quem a lei falava"*, *"a leitura tinha dono"*); o que
ficou no lugar delas é a arquitetura do documento, dita seca — *"A lei não escreveu cor
nenhuma. Escreveu rua, ofício e corpo."* É mais duro que o adjetivo que eu ia usar.

**O que a série ensina, e não é acidente da seleção:** o intervalo inteiro se conta por normas
que dizem **quem fica de fora**. Sem rua, sem voto, sem parlamento, sem lei do trabalho, sem
juiz. Cada uma tem número, data e um artigo que se pode ir ler. É o oposto do cinismo: não é
"sempre foi assim", é "foi escrito assim, nesta data, neste artigo — e parte disso foi desfeita,
em 1985, em 2013 e em 2015".

Os seis ficam **sem balão** (a regra de silêncio do quadrinho para marco duro) e há um motivo a
mais: `quem` é a pessoa DAQUELE tempo, e nenhum capítulo deste intervalo foi escrito. Balão com
o retrato de AINDA AQUI comentando 1890 seria pôr palavra na boca errada.

### O QUE EU RECUSEI POR FALTA DE FONTE — e uma das faltas é grande

- **A Lei de Terras (Lei nº 601, de 18 de setembro de 1850).** É o marco que eu mais queria, e é
  o que explica a frase que o jogo já diz em 1888 (*"a liberdade veio sem chão"*): trinta e oito
  anos ANTES da abolição, uma lei fecha o único caminho para a terra que não fosse a compra.
  Consegui a **ementa oficial** (LexML) e o registro do ato — e **não consegui ler o art. 1º em
  fonte pública**: o `planalto.gov.br` recusou toda conexão desta máquina (`ECONNRESET`, oito
  tentativas, dois hosts), o `www2.camara.leg.br` devolveu 429 em todas, os PDFs (ITERPA, TSE)
  vieram sem camada de texto e o `web.archive.org` está fora do alcance da ferramenta. Ler a
  redação por buscador não é ler a fonte, e o marco não entra por citação de segunda mão.
  **Fica como a primeira tarefa de quem tiver rede para o Planalto.**
- **Os números da CNV.** Conferi na página institucional (`gov.br/memoriasreveladas`) o que
  basta para o capítulo futuro: criada pela **Lei nº 12.528/2011**, instituída em 16/05/2012,
  apurando violações entre **18/09/1946 e 05/10/1988**. O número que circula — 434 mortos e
  desaparecidos políticos no volume 3 — aparece em três resultados que apontam para o site da
  própria CNV, mas o servidor dela devolve **certificado inválido** e eu não o li. Continua
  ✖N e **não entrou em fala nenhuma**. É o primeiro item da pesquisa de O QUE NÃO PODIA SER
  DITO.
- **O Decreto nº 528/1890** (o que condicionava a entrada de imigrantes) e qualquer número de
  florestas públicas não destinadas: não conferidos, não entraram.

### O ACEIRO, o décimo terceiro

Entrou como **capítulo em obra**, na posição cronológica: depois de O QUE SEGUROU (2020–2022) e
**antes** de O QUE TEM FONTE. A ordem dentro do "hoje" tem razão, e ela é de ensino — O QUE TEM
FONTE usa como exemplo trabalhado *o INPE e o MapBiomas medindo a mesma floresta com réguas
diferentes*, e quem chega ao capítulo do método precisa já ter visto as duas réguas.

Nenhuma linha do `HISTORIA-CONTEMPORANEO.md` entrou. A abertura diz o nome, explica a palavra
*aceiro* (definição de dicionário, não afirmação histórica — a mesma licença que PINDORAMA teve
para ensinar o próprio nome), diz o verbo (**abafar**), diz que quem ele acompanha é quem segura
a linha e não quem manda, e **avisa que o número dele tem prazo**: é o primeiro capítulo do jogo
com conteúdo perecível, porque o dado de desmatamento sai todo ano. Zero dígito nas falas — o
bloco 15 do `encaixe.js` cobra isso e passou.

**O procedimento de `ARCOS_ANTIGOS` foi cumprido ANTES de mexer em `EPOCAS`**, que é a ordem que
o comentário manda e a primeira vez que ela foi respeitada de verdade: a linha do arco de doze
está gravada, então quem parou em O QUE TEM FONTE não acorda em O ACEIRO.

### O que medi

| | antes | depois |
|---|---|---|
| capítulos | 12 (4 escritos) | **13** (4 escritos, 9 em obra) |
| cenas | 15 | **16** |
| `LIMIAR_FIM` | 11.700 | **11.850** (régua do bloco 16: 13.125) |
| páginas do quadrinho | 26 | **32** |
| pontos finais do rolo | 7 | **7** — a amarra é por `qi`, e nenhum marco novo tem imagem própria |
| linhas autorais varridas pelo §2 | 172 | **190**, 0 achado |
| `index.html` | 1,52 MB | **1,52 MB** — nenhuma arte nova |

`npm test` verde e `encaixe.js` **20 blocos** verdes nos dois incrementos. Prints:
`test/ACEIRO-eras-fim-da-lista.png`, `test/ACEIRO-abertura-1.png`, `test/MARCO-1890.png`,
`test/MARCO-1943-2015.png`, `test/MARCO-1964.png`, `test/MARCO-fontes.png`.

### O que os prints mostraram e o teste não mostraria

Os seis marcos caem na **página de papel** do quadrinho (sem `qi`, sem índice em `MOMENTOS`),
que é a saída neutra — e seis páginas de papel seguidas depois de 1888 leem como um caderno de
anotações no meio do álbum. É honesto e é o estado certo hoje (nada se inventa para tapar
buraco), mas é **pedido de arte**: seis verticais, uma por marco. Fica para a mesa.

E o print da abertura de O ACEIRO mostra o desencaixe que o `PENDENTES.md` agora nomeia: um
capítulo cujo `quando` diz *cerrado* rodando sobre uma rua de cidade, porque a pintura é herdada
do capítulo anterior.

### Uma coisa que achei por acidente, e consertei no mesmo dia

A tela **DE ONDE VEM não tinha grupo de SALVADOR** — e o fecho daquele capítulo promete, com
todas as letras: *"Quem reconstruiu esta noite documento por documento foi João José Reis. Quem
tirou as ganhadeiras da margem da história foi Cecília Moreira Soares. A tela DE ONDE VEM traz
as duas."* Ela não trazia. Promessa quebrada de um capítulo **escrito** é mais grave que qualquer
coisa desta sessão, porque o jogo já a fez a quem jogou.

Não era falta de pesquisa: as duas já estavam citadas na `LINHA_TEMPO` (campo `f`). Era falta de
duas linhas em `FONTES`, e elas entraram — a de Cecília Moreira Soares com o número e o ano
conferidos no próprio periódico (*As ganhadeiras: mulher e resistência negra em Salvador no
século XIX*, **Afro-Ásia nº 17, 1996**, UFBA), que é mais do que o jogo dizia antes.

**A lição de método, e ela vale para todo capítulo futuro:** escrever no FECHO que a tela DE ONDE
VEM traz uma fonte e não pô-la lá é o modo mais silencioso de este jogo mentir — nenhum teste
olha para isso hoje. Vale um bloco de `encaixe.js`: **toda obra citada num `f` da `LINHA_TEMPO`
de capítulo escrito tem de ter entrada em `FONTES`.**

### Dúvida nova

O `q` de dois marcos é um INTERVALO (`1932 → 1985`, `1943 → 2015`), o que nenhum nó tinha antes.
Ficou bom no papel e resolve o que eu queria dizer — *a norma e o que aconteceu com ela* —, mas
cria uma cronologia com nós que se sobrepõem. Se virar padrão, a linha do tempo deixa de ser uma
linha e vira uma tabela de vigências. Por ora são dois; vale olhar quando forem seis.

### Próximo passo

Ler a Lei nº 601/1850 em fonte pública e pendurar o marco de 1850 **antes** do de 1888 (é o
lugar cronológico dele) — incremento de dez minutos no dia em que a rede alcançar o Planalto.
Depois, os números da CNV, que são o portão de O QUE NÃO PODIA SER DITO.

---

## Diário — 2026-08-10 · Dev · O TELEFONE DEITADO PASSA A EXISTIR

**A decisão é do dono.** Perguntei se travava em retrato ou fazia funcionar deitado. Ele
respondeu **deitado**, e justificou: *"jogabilidade e usabilidade são pontos importantíssimos"*.
É o item 8 do `LANCAMENTO.md`, que dizia "ninguém decidiu; hoje estica e fica errado".

### O que eu medi antes de tocar em qualquer coisa

O `test/medir-telas.js` **já rodava `deitado 844×390` e dava verde**. Então o defeito não era o
que ele media — era ele. Três buracos:

1. **Só media a horizontal.** `b.right > W` e `b.left < 0`, nunca `b.bottom > H`. Deitado o lado
   curto é a ALTURA: o único eixo que quebra era o único que ninguém olhava.
2. **Só media o estado de arranque**, que é sempre o menu. A HISTÓRIA, a CHEGADA, a fala,
   AJUSTES, as ERAS, as FONTES, MELHORIAS e o jogo rodando nunca foram medidos em largura
   nenhuma. Agora são **dez estados × dez viewports**.
3. **Imprimia a escala e não a cobrava.** A linha dizia `escala do mundo 3.003` e chamava a tela
   de boa.

Com os três tapados, o estrago em **844×390**:

| onde | o quê |
|---|---|
| MENU | poste 270 px abaixo da borda · **JOGAR cortado 52 px — zero pixel tocável** · as outras três tábuas NASCEM fora (topos 454, 518, 582) |
| JOGO | rodapé come **16,2%** da altura (7,5% em retrato) · ação principal a **43%** da largura |
| A HISTÓRIA | **12 de 26 páginas** com conteúdo maior que o quadro; a pior 365 num espaço de 306 |
| CHEGADA | última tábua **86 px abaixo da dobra** · tábuas de 40 px |
| AJUSTES | título **116 px ACIMA** da tela — e AJUSTES não rola |

**Deitado, o jogo não podia nem ser começado.** A 640×360 nem o JOGAR aparecia.

### O que fiz, em cinco incrementos

- **A pilha vira COLUNAS.** Menu (marca à esquerda, poste à direita), CHEGADA (o que você leu ·
  o placar · as portas) e AJUSTES (papel · tábuas). Não é aperto de fonte: quatro tábuas de
  52 px com 12 de vão dão 244, e sobrariam 70 px para o logo. Coluna única é o layout errado
  para 844×390 — e do lado há 844 px vazios.
- **O rodapé encosta na ponta direita** e o botão dourado vai para o fim da fileira. Deitado as
  duas mãos seguram as PONTAS: o meio da borda de baixo, que em retrato é o melhor lugar que
  existe, vira o ponto mais LONGE dos dois polegares. E o canto de baixo à esquerda fica sem
  botão, porque a metade esquerda é a que PULA.
- **O papel do quadrinho ALARGA** (30em → 40em, ~72 caracteres por linha) em vez de encolher a
  letra: papel mais largo é papel mais baixo com o mesmo corpo de texto.
- **A escala do mundo passa a ser inteira de verdade.** Escolher `k` inteiro não bastava:
  `W = round(tela/k)` quebra sempre que a tela não é múltipla de `k`. Vira `ceil`, e a caixa das
  três camadas passa a ser `W×k` por `H×k` — sangra no máximo `k−1` px para fora. **O chão não
  levita** porque as TRÊS camadas usam a MESMA caixa.

### O que ficou medido depois

`medir-telas.js`: **10 de 10 telas sem um problema** (era 0 de 10). Rodapé 12,6% da altura, ação
a 86,8% da largura, canto do pulo livre até 33,1%. Escala **2×2** em oito telas e **3×3** no
tablet deitado. Chão pintado vs GROUND entre −1,6 e +1,8 px de aparelho em seis viewports — o
mesmo arredondamento de `round(H×0,68)` que já existia. `npm test` verde, FPS 61.
`encaixe.js` ganhou o **bloco 21**, com 17 asserções por viewport deitado.

### Três coisas que a medição nova achou e que não eram de orientação nenhuma

- **`escala 2×1,9978` no Pixel 412×915 — em RETRATO.** O conserto de escala inteira estava pela
  metade desde que foi feito, em todo aparelho cuja altura não é múltipla da escala.
- **`btnFalaPular` tinha 53×25 px em TODA tela.** É o botão que quem já leu procura, e estava
  abaixo do mínimo de dedo desde sempre. Vira 44.
- **Em retrato curto (320×568)** o poste do menu já saía 32 px abaixo e os AJUSTES pelas duas
  bordas. Pré-existentes.

### O defeito de instrumento que custou meia sessão, e que era do repositório inteiro

Uma regra de CSS recém-construída "não aplicava": o media query casava, a regra estava no
`index.html`, e o computed style era o antigo. **Ela aplicava — o navegador estava lendo o
`index.html` de outra árvore.** O `abrir.js` sobe um servidor na porta fixa 8198 e, se ela
estiver ocupada, engole o erro com um aviso, porque *"o mais provável de longe é que seja outro
instrumento deste repositório servindo esta mesma pasta"*. A premissa morreu quando apareceu
`.claude/worktrees/`: são dezenas de cópias do repo no disco, cada uma com `index.html` próprio,
todas pedindo a mesma porta. Quem chega depois mede o arquivo de outra pessoa, sem erro, sem
aviso, com print bonito — o mesmo modo de falha que tirou o smoke test do `file://`.
**A porta passa a sair de um hash do caminho da raiz** (8201 + hash % 254; nesta árvore, 8321).
A API continua síncrona, que era a razão inteira de a porta ser fixa.

### Dúvida nova

A CHEGADA deitada usa `align-content: start` com `align-content: safe center` logo abaixo, para
se centrar onde couber e cair no topo onde não couber. `safe` é recente; onde não houver, a tela
fica encostada no topo com o pé vazio — que é feio, não quebrado. Vale um print em aparelho de
verdade antes de confiar.

### Próximo passo

O jogo **nunca foi visto girando**: tudo o que medi é viewport fixo. Falta exercitar a TROCA de
orientação com a partida viva — `orientationchange` chama `fitCanvas` e `medirControles`, mas
uma bandeja aberta, uma fala no meio da revelação ou o quadrinho na página 14 não foram testados
atravessando o giro. É o próximo instrumento, e é barato: `setViewportSize` no meio de cada um
desses estados.

## Diário — 2026-08-11 · Dev · O MUTIRÃO, parte 1: a economia da obra, cega

Implementação do `MUTIRAO.md`, aprovado pelo dono ("gosto da construção, fica evoluindo com um
tempo né, pode engajar para construir mais e querer voltar"). **As duas coisas que ele grifou
são o desenho:** a obra evolui com o tempo, e isso faz querer voltar.

Esta parte é a economia **sem desenho e sem gesto** — nada muda na tela ainda, de propósito: é
a única forma de a medição de composição da parte 2 medir só o que a parte 2 acrescentou.

### O que entrou

- `OBRA_PONTOS_ESTAGIO` 60 · `OBRA_ESTAGIOS` 3 · `OBRA_PARCELA` 10 · `OBRA_MAX` **derivado**
  (nenhum literal 180 solto; o smoke cobra a derivação).
- `CUSTO_OBRA` — a tabela do `MUTIRAO.md` §1.3 inteira, conferida contra o jogo de hoje:
  **120 flor · 174 água · 150 refeição = 444** para as três obras completas. A repartição de
  drop que a sustenta (`CFG.mobMix`) confere: andando flor 20% · água 22% · refeição 58%;
  correndo flor 45% · água 30% · refeição 25%. A água é o gargalo nos dois ritmos, de propósito.
- `taxaMutirao(a) = 2·min(a,6) + 0,25·min(max(a-6,0),24)` — **0 com zero acolhidas**, satura em
  **18 pontos/h** a partir de 30. Medido no smoke: `taxaMutirao(6)=12`, `(30)=18`, `(9999)=18`.
- `avancarObra(pontos)` — o relógio ÚNICO (dedo, laço de quadro e ausência passam por ele).
  Alvo = o canteiro com menos pontos, desempate na ordem da sobrevivência. Debita a parcela ao
  cruzar múltiplo de 10; parcela impagável **congela na fronteira** e o alvo passa ao próximo.
- `S.obra` + entrada no `ESQUEMA_SAVE` (tipo `mapa`, `min 0`, `max OBRA_MAX`).
- Off-line em `carregar()`, com o MESMO `dt` já capado da tela de retorno; on-line em
  `correrMutirao(dt)`, no laço, ao lado de `atualizarMoradores`.
- A tela de retorno passa a dizer o que avançou, **sem um dígito** — os estágios têm nome. E a
  linha-verdade ("A estrada esperou...") só continua sendo dita quando a obra NÃO andou: com o
  mutirão de pé ela mentiria.

### O conserto que o consumo tornou obrigatório

`recNaTela` escondia o nicho sempre que o contador era <= 0 — indistinguível de "nunca rendeu"
porque **nada gastava**. Com a obra pagando parcelas um contador volta legitimamente a zero, e o
nicho sumiria no meio da partida. Agora o nicho **revela e não re-esconde**; quem esconde são
duas coisas só: a classe `oculto` na marcação (o boot) e o APAGAR MEU PROGRESSO. O bloco 3 do
`encaixe.js` continua verde — e foi ele que pegou a metade que faltava do conserto.

### O que foi MEDIDO (números, não impressão)

| medida | valor |
|---|---|
| 12 h de ausência com **0 acolhidas** | 0 pontos, **0 recursos gastos** (não existe upkeep) |
| 12 h de ausência com **40 acolhidas** | 216 pontos (= 3,6 estágios), 132 recursos gastos |
| acolhidas consumidas pela obra | **0**, em qualquer cenário — gente não é recurso |
| obra sem estoque nenhum | congela em 9+9+9 = **27 pontos**, **0 parcelas pagas**, e diz o que faltou |
| save adulterado `{roca:5e9, palicada:"muitas", casa:-3, x:9}` | `{roca:180, palicada:0, casa:0}` |
| `S.obra` num recarregamento | não regride (a trava do R4: a obra só cresce) |
| `index.html` | 1.617.842 -> **1.623.433 bytes** (+5.591, **+0,35%**), zero imagem nova |
| FPS | 60 |

### A régua ANTES, colhida na `main` de hoje (`test/medir-poluicao.js`, 90 s/célula)

O instrumento passou a contar **canteiro como objeto** (com `typeof`, para medir também o
binário de antes — os dois lados da régua saem do mesmo código).

| célula | média de objetos | pior | renda/min |
|---|---:|---:|---:|
| cap1 andando | 4,92 | 7 | 1.362 |
| cap1 correndo | 6,00 | 9 | 1.466 |
| **cap2 andando** (faixa final) | **4,31** | 6 | 1.442 |
| **cap2 correndo** (faixa final) | **4,98** | 7 | 1.546 |
| cap3 andando | 4,03 | 6 | 1.800 |
| cap3 correndo | 4,49 | 7 | 2.005 |

**Achado que muda a conta da parte 2:** o teto herdado é 5,4, e o cap2 correndo já está em
4,98 — sobram **0,42** de folga, não uma unidade inteira. E a válvula declarada no `MUTIRAO.md`
3.3 (moradores 6 -> 4) **não moveria este número**: `medir-poluicao.js` conta
chegadas+drops+folhas+floats+placa e deixa `gente` FORA da soma de propósito. A válvula real é
o vão entre canteiros, que é o que a parte 2 vai calibrar.

### Próximo passo

Os canteiros no mundo, desenhados por código, com o vão calibrado para caber nos 0,42 — e depois
o gesto.

## Diário — 2026-08-11 · Dev · O MUTIRÃO, partes 2 e 3: a obra aparece, e a mão a ergue

Os canteiros no mundo (desenhados por código) e o gesto. Com isto o `MUTIRAO.md` está
implementado. O ticket do dono é uma frase e ela é a régua: *"gosto da construção, fica evoluindo
com um tempo né, pode engajar para construir mais e querer voltar."*

### O gesto, e a coisa que só apareceu com ele pronto

Segurar o dedo em QUALQUER ponto do mundo. O toque continua instantâneo (a metade faz o que
sempre fez); passados 300 ms, se houver um canteiro em quadro, a obra começa e **a personagem
para**. Trabalhar é literalmente parar de andar: nada nasce (mob, drop e folha nascem por chão
coberto), e o custo de erguer é a estrada que não passou.

**O achado que fecha o desenho, e que eu não tinha previsto:** como a condição é reavaliada a
cada quadro, segurar o dedo numa estrada vazia não faz nada — ela **anda até o próximo canteiro
e começa a trabalhar sozinha**. Ou seja: um polegar só, sem mirar, sem timing. E, como ela PARA
enquanto trabalha, o canteiro não vai embora — alcançar um canteiro uma vez basta para uma
sessão inteira de obra. Isso é o que torna o vão largo entre canteiros barato em jogo e caro
só em composição, que é a troca certa.

O golpe não vira rajada: o mundo nunca repetiu golpe (só o botão dourado, que fica intocado).
Medido no smoke: 2,6 s de dedo no mundo = **2 pontos de obra e EXATAMENTE 1 golpe**, e 0 px
andados depois de armar. Fora da faixa: 0 pontos, 27 px andados — a rua é a de sempre.

### Três coisas que os PRINTS pegaram e nenhum teste pegaria

1. **A roça lia como TÁBUA.** A receita do `MUTIRAO.md` §3.2 (retângulos empilhados de larguras
   decrescentes) desenha um terraço que, a 2×, é indistinguível de madeira — e a paliçada de
   madeira está do lado. Virou **leira de terra**: duas fiadas, a de cima mais estreita, crista
   clara e emenda escura entre uma e a vizinha. E a crista foi para `#7a5430` e não para o
   `#5c3d20` do resto: a leira nasce exatamente na linha em que a mata escura encontra a terra,
   e fiada escura sobre fundo escuro simplesmente não existia no print.
2. **A microdica acendia sobre estrada vazia.** Com zero unidades nada era desenhado, então
   "SEGURE PARA AJUDAR NA OBRA" aparecia sem obra nenhuma à vista. Entrou a **marca do canteiro**
   — terra raspada e dois piquetes, igual nos três: um canteiro com zero peças ainda é um
   canteiro, e "é aqui" é a informação que o gesto precisa.
3. **Dez segundos de dedo sem nada acontecendo.** Uma peça nova só aparece a cada 10 pontos.
   Entraram **dois grãos por ponto** (além do punhado por parcela): o pequeno diz "está
   trabalhando", o grande diz "uma peça ficou de pé". Nenhum float de número, nunca — obra não
   é placar.

### A COMPOSIÇÃO — os dois números que o ticket pediu

`test/medir-poluicao.js`, 90 s por célula, 390×844, segurando o botão dourado. O instrumento
passou a contar **canteiro como objeto** e a janela dele é a CAIXA do canteiro (a primeira
versão usava ±60 px fora da tela dos dois lados e inflava a categoria em ~0,12 — conserto do
instrumento, não do jogo).

| célula | ANTES | DEPOIS | canteiros | renda/min ANTES → DEPOIS |
|---|---:|---:|---:|---|
| cap1 andando | 4,92 | 5,56 | 0 | 1.362 → 1.379 |
| cap1 correndo | 6,00 | 6,19 | 0 | 1.466 → 1.460 |
| **cap2 andando** | **4,31** | **4,77** | 0,28 | 1.442 → 1.467 (+1,7%) |
| **cap2 correndo** | **4,98** | **5,56** | 0,29 | 1.546 → 1.528 (−1,2%) |
| cap3 andando | 4,03 | 4,10 | 0 | 1.800 → 1.835 |
| cap3 correndo | 4,49 | 4,71 | 0 | 2.005 → 1.999 |

**A leitura honesta, e ela tem três partes:**

- **O que a obra acrescenta é 0,28 (andando) e 0,29 (correndo)** — medido na própria categoria,
  isolado. É o número do meu trabalho, e é o único comparável entre rodadas.
- **Todo o resto do delta é ruído do instrumento, e a prova está na própria tabela:** o capítulo
  1, que não tem canteiro nenhum, subiu 4,92 → 5,56 andando entre as duas rodadas, quase tudo em
  `folhas` (1,65 → 2,41). Comparar TOTAIS entre rodadas diferentes deste instrumento não diz
  nada; comparar dentro da MESMA rodada, sim.
- **Pelo critério do ticket** — *"a média não passa a do capítulo 1"* —, na mesma rodada:
  cap2 andando **4,77 < 5,56**, cap2 correndo **5,56 < 6,19**. Passa nos dois ritmos.
  **Pelo número absoluto herdado (5,4)**: andando passa; correndo fica **0,16 acima**. E vale
  dizer que, nessa mesma rodada, o capítulo 1 ANDANDO já está em 5,56 sem canteiro nenhum — o
  5,4 escrito no `MUTIRAO.md` descreve uma medição antiga, não este binário.

Confirmação independente, sem ruído nenhum, no `encaixe.js` bloco 22: varrendo **20 mil px** de
estrada pelo mesmo `atualizarCanteiros()` do laço de quadro, a média de canteiros em quadro é
**0,290** e o pior momento é **1** — nunca dois na mesma tela.

**A válvula que existe é o vão, e não a declarada.** O `MUTIRAO.md` §3.3 dizia que, estourando,
se cortaria os moradores visíveis de 6 para 4. Isso **não moveria o número**: o `medir-poluicao.js`
soma chegadas+drops+folhas+floats+placa e deixa `gente` FORA de propósito. A válvula real é
`OBRA_ESTRADA_FRAC`. Foi calibrada com medição: **1,9 tela rendeu 0,45/0,50 e o cap2 correndo
bateu 5,80** — recusado. **2,8 tela rende 0,28/0,29**, que é o que está no ar.

### O PESO — zero imagem nova

`index.html` **1.617.842 → 1.630.988 bytes: +13.146, +0,81%.** Nenhum byte de imagem: os três
canteiros são retângulos na gramática de materiais que o chrome já falava (madeira da placa de
marco, taipa das lajes, verdes da folha, terra). Nenhum pacote novo, nenhuma requisição nova.
A porta de entrada não se move de forma perceptível e os 6,30 s do 3G continuam 6,30 s.

### O TEMPO ATÉ A OBRA COMPLETA, por estratégia

O `MUTIRAO.md` §1.5 pedia um `test/medir-mutirao.js --simular`. Ele não foi escrito, e a razão é
que ele duplicaria as tabelas do jogo para reproduzir uma conta fechada: as taxas de coleta já
estão medidas (NOTES 06/08) e o custo é linear. A conta, direto das tabelas:

| estratégia | rua | dedo | total |
|---|---:|---:|---:|
| só a mão, **andando** (gargalo: água) | 28,1 min | 9,0 min | **37,1 min** |
| só a mão, **correndo** (gargalo: refeição) | 15,8 min | 9,0 min | **24,8 min** |
| misto ótimo (0,4 andando + 15,1 correndo) | 15,5 min | 9,0 min | **24,5 min** |
| só o mutirão, 30+ acolhidas | 216 pontos por noite de 12 h | — | 3 noites, e o estoque trava antes |

**Uma afirmação do `MUTIRAO.md` NÃO se sustenta, e fica registrada em vez de consertada.** O
§1.3 item 2 diz que *"nenhum ritmo sozinho abastece bem — misturar ritmos é a jogada boa"*. Não
é: **correr sozinho custa 15,8 min e o misto ótimo custa 15,5 — 2%.** A razão é simples e o
documento não a viu: correr rende 38 drops/min contra 28 andando, então a vantagem bruta de
correr engole a diferença de repartição. Andar sozinho é 1,8× pior. **Não mexi na tabela** — o
ticket manda não reinventar a economia, e mudar `CUSTO_OBRA` é mudança de economia com medição
própria. O conserto mínimo, se a Direção quiser a decisão de volta, é **subir a refeição e baixar
a água** nos três E3 (a refeição é 58% do que a caminhada entrega e só 25% do que a corrida
entrega): é o único par que faz o gargalo trocar de lado conforme o ritmo.

### O que MEDIU, além disso

| medida | valor |
|---|---|
| segurar 2,6 s no mundo, na faixa | 2 pontos de obra · **1 golpe** · 0 px andados depois de armar |
| segurar 1,2 s no mundo, fora da faixa | 0 pontos · não arma · 27 px andados (a rua de sempre) |
| canteiros em cena (varredura de 20 mil px) | média **0,290** · pior **1** |
| altura da silhueta, pronta | roça 10 px · paliçada 18 px · casa 30 px (a protagonista tem 44) |
| 10 s de dedo | 1 peça de pé · flor −1, água −2, refeição −3 (a parcela E1 da paliçada) |
| FPS | 61 (3 rodadas: 61, 61, 61) |

### Onde eu me afastei do `MUTIRAO.md`, e por quê

1. **Um canteiro de cada vez, e não três semeados juntos a uma tela de distância** (§3.1). Três
   em ciclo curto poriam ~1,4 objetos em cena; o teto real são 0,4. Prints e medição.
2. **A obra só arma com um canteiro em quadro.** Trabalhar num canteiro fora da tela seria
   trabalho sem retorno visível, e o retorno visível é a coisa inteira. Não custa jogabilidade:
   ver o achado do gesto acima.
3. **A receita da roça mudou** (leira de terra, não terraço de retângulos). Print.
4. **A marca do canteiro e o grão por ponto** não estavam no documento. Prints.
5. **`avancarObra` ganhou alvo fixo opcional.** O documento descrevia os dois comportamentos —
   a mão trabalha onde ELA está, o mutirão acode onde falta mais — como uma função só.
6. **`recNaTela` precisou de metade a mais do conserto:** o `oculto` foi para a MARCAÇÃO. Sem
   isso o nicho nascia visível no boot, e quem pegou foi o bloco 3 do `encaixe.js`.

### Dúvida nova

O `medir-poluicao.js` mede `folhas` com uma dispersão de +46% entre rodadas do MESMO binário
(1,65 → 2,41 no cap1 andando, em três rodadas, subindo sempre). Isso é maior que qualquer coisa
que este trabalho acrescentou, e torna a trava de composição inútil como número absoluto. Ou a
contagem de folhas tem viés de carga da máquina, ou o instrumento precisa de N rodadas e mediana.
**Enquanto isso não for entendido, a única comparação que vale é dentro da mesma rodada.**

### Próximo passo

Rebasear contra a `main` quando a outra sessão de PALMARES pousar: ela mexe em `S.acolhidos` e em
`acolherPessoa` (gente atravessando a tela, acolher a um toque), que é exatamente a entrada de
`taxaMutirao`. O encontro é benigno no papel — a obra lê só o NÚMERO de acolhidas — mas
`atualizarMoradores` e `faixaViva` são vizinhos de linha e vão conflitar em texto.

### Adendo — a tela de retorno, olhada, e a numeração do bloco novo

O print da tela de retorno (OBRA-7) mostrou três linhas com o MESMO prefixo empilhadas: uma
noite no teto ergue até três estágios, e "O mutirão trabalhou:" três vezes vira ladainha. O
prefixo passa a abrir UMA vez e as outras entram como frase própria:

> O mutirão trabalhou: a roça já tem as leiras abertas.
> A paliçada já tem as primeiras estacas.
> A casa já tem os esteios.

Medido no mesmo print: **zero dígitos** nas linhas da obra, que é a regra dura daquela tela.

O bloco novo do `encaixe.js` nasce como **24** e não 22: a sessão de PALMARES ocupou 22, 23 e
23b na main, e dois blocos com o mesmo número num arquivo que se lê por número é o tipo de
confusão que não custa nada evitar antes de existir.
