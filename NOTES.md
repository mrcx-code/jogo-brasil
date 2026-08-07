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
