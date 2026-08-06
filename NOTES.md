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

## Imagens de contexto na caixa de fala — 2026-08-06

Pedido do dono: a abertura de cada época mostra **o que o texto está dizendo**, não só o texto.

**Como a associação é feita.** Cada época ganhou `aberturaImg` em `EPOCAS`: uma lista do mesmo
tamanho da `abertura`, item por item, com uma chave de `CTX_B64` ou `null`. Repetir a mesma chave
em falas seguidas é o normal — a imagem troca quando o **assunto** muda, não quando a fala muda,
porque trocar por trocar vira apresentação de slides no meio de uma leitura.

| capítulo | fala 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| ANTES DA CHEGADA | mata | roçado | roçado | — | — |
| PALMARES | serra | serra | roça | — | — |
| AINDA AQUI | *(demarcada)* | *(demarcada)* | *(disputa)* | — | — |

As duas últimas falas de cada capítulo ficam **sem imagem de propósito**: são as que explicam o
que fazer e o que vem pela rua, ou seja, descrevem a TELA. Cobri-la com paisagem justo nelas
seria esconder o que a frase manda olhar. Sem imagem, o jogo aparece — que é o estado normal
desta tela e continua sendo.

O capítulo 3 está **escrito e inerte**: as chaves existem em `EPOCAS`, a arte ainda não chegou em
`assets/entrada`, e `trocarCtx` trata chave ausente como `null`. Quando `ctx-cap3-demarcada.png` e
`ctx-cap3-disputa.png` caírem na pasta, `node test/inline-contexto.js` liga as duas sozinho e
nenhuma linha de `EPOCAS` muda.

**§2, e é a parte que importa mais que o código.** Estas imagens acompanham texto que AFIRMA
história. As quatro que chegaram são **paisagem sem nenhuma figura humana**, e isso foi conferido
olhando as quatro, não confiando no nome do arquivo. Figura humana desenhada afirma junto: roupa,
corpo e adorno viram declaração sobre um povo real. O dono aprovou pessoas **em princípio** e
disse que quer aprovar **cada cena** — essa aprovação não aconteceu. Regra escrita no cabeçalho de
`test/inline-contexto.js` e de `CTX_B64`: imagem com gente **não entra**, relata-se.

**Peso, medido.** Os mestres chegam com ~1.940 px de largura e a tela mostra 390. Embutir o mestre
seriam megabytes por nada. Reencodadas em **WebP 0,80 a 780 px** (2× a tela de referência):

| peça | base64 |
|---|---|
| cap1-mata | 84 KB |
| cap1-rocado | 108 KB |
| cap2-roca | 118 KB |
| cap2-serra | 95 KB |
| **total** | **405 KB** |

`index.html`: **2,81 MB → 3,21 MB**. O teto combinado é 3,6 MB. As duas peças do capítulo 3 devem
custar ~215 KB nesta mesma receita, o que fecha em ~3,42 MB — cabe, mas é a última folga. Medido
em outras larguras, para quem precisar comprar espaço depois: 660 px custa 316 KB (−22%) e 520 px
custa 219 KB (−46%). `node test/inline-contexto.js --medir` reimprime a tabela sem gravar nada.

**Altura: `height: auto`, e é decisão.** A arte é paisagem de ~2,4:1. Qualquer altura fixa vira
`cover`, e `cover` corta as beiradas — justo a parte que faz a imagem ser paisagem. A 390 px de
tela ela ocupa 162 px no alto. Uma máscara vertical dissolve o pé da imagem no jogo; sem ela a
foto termina numa linha reta no meio da tela e lê como banner colado por cima.

**A transição, medida.** Duas `<img>` alternando papel, 0,42 s de `opacity`. Amostrado a cada
120 ms: `0/1 → 0,29/0,71 → 0,82/0,18 → 0,97/0,03 → 1/0`. Quem entra só acende **depois do
`decode()`** — acender antes mostra o elemento vazio subindo de opacidade e a foto aparecendo de
estalo no fim, que é exatamente o corte seco que o esmaecimento existe para não dar. Enquanto a
nova não decodificou a antiga continua no ar, então não há quadro em branco.

**O que ficou frágil.**

1. **O HUD some e volta.** A imagem é desenhada sobre a tela inteira a partir do topo, e o HUD
   (contadores e barra do capítulo) fica atrás dela. Nas falas com imagem ele some; nas sem, volta.
   Não é erro, mas é chrome piscando no meio de uma leitura. As saídas são esconder o HUD durante
   toda a caixa de fala — mudança de comportamento existente, fora do escopo deste trabalho — ou
   descer a imagem para baixo dele, o que põe uma tarja de jogo em cima de uma foto.
2. **No meio do esmaecimento o mundo aparece por baixo.** As duas `<img>` são irmãs e a de cima
   compõe sobre a de baixo, então na metade da troca o fundo vaza uns 20%. Dura ~0,2 s e some.
   Resolver de verdade pediria compor as duas num canvas, o que é caro para o que se ganha.
3. **A folga de peso acabou.** Depois do capítulo 3 não sobra espaço nesta receita. A próxima arte
   de contexto obriga a escolher: 660 px de largura, ou qualidade abaixo de 0,80.
