# PROPOSTA — como as aldeias aparecem em 1530 no MUNDO 3D

**O que este documento é:** três formas possíveis (A, B, C) para o dono escolher UMA, mais um
piso comum (D) que não é alternativa. É texto. **Não há arte aqui, nem código, nem diagrama** —
quem desenha é a `arte`, e só depois que ele aprovar a forma.

**Quem escreveu:** agente historiador, sob a licença de revisão de 2026-08-19 (`CLAUDE.md` §2).
**Insumo:** `fontes/sp-1530-povos.md` (pesquisadora de fontes, ramo `worktree-agent-a51fea5566ab7a661`,
commit `ca2df7e`), lida inteira. Nenhuma afirmação abaixo vai além dela; onde vou além, digo que
estou indo e digo com o quê.

**O problema que motivou tudo:** hoje o protótipo mostra, em 1530, floresta sem uma única marca de
gente, sob um rótulo que diz *"floresta e aldeias"* (`sp-relevo.html`, linha 190). A imagem afirma
o contrário do rótulo, e o que ela afirma — terra vazia até o europeu chegar — é o erro que o
`CLAUDE.md` §2.1 nomeia por extenso. **O dono decidiu que as aldeias aparecem.** Falta decidir COM
QUE FORMA, e é só isso que este documento traz.

---

## 0. O fato de escala que decide tudo — medido do código, não estimado

Isto vem antes das propostas porque elimina metade das ideias possíveis antes de elas custarem
trabalho de arte. Medido lendo `sp-relevo.html`:

- A projeção é `SCALE = 26` unidades de mundo por grau. Um grau de latitude tem ~111 km, então
  **1 unidade de mundo ≈ 4,3 km**.
- O "árvore" do mundo é um icosaedro de raio 1,5 com escala sorteada entre 0,5 e 1,3 — ou seja,
  **cada copa tem entre 6 e 18 km de diâmetro**. Não é uma árvore: é um token que significa
  "aqui há mata".
- O personagem tem ~3,6 unidades de altura — **cerca de 15 km**. Também não é uma pessoa: é um
  token que significa "você está aqui".
- A câmera não chega mais perto que `minDistance = 16` unidades — **~68 km do alvo**. Não existe,
  hoje, escala humana neste mundo.

**A consequência, e ela é dura:** uma aldeia de sete casas em torno de um pátio está na ordem de
grandeza das centenas de metros. (A ficha de fontes **não traz medida** de casa nem de pátio — ver
§1 abaixo; então qualquer número em metros já seria invenção minha.) Seja qual for a medida exata,
ela é **duas ordens de grandeza menor que o token de mata**. Desenhada em tamanho verdadeiro, a
aldeia é invisível; desenhada em tamanho visível, ela é do tamanho de uma região metropolitana.

Então a pergunta real não é "que forma tem a oca". É: **em que registro a aldeia entra?** O mundo
já fala inteiro em símbolo — a árvore é símbolo, a pessoa é símbolo. Uma aldeia modelada com
realismo seria o único objeto literal num mundo de tokens, e isso é uma decisão de forma, não um
detalhe. As três propostas se separam exatamente aí.

---

## 1. O que a fonte sustenta, e onde ela para

Trancado antes das propostas, para nenhuma delas se apoiar no que não existe.

**Sustenta com força (arqueologia + crônica convergindo):**
- Havia gente organizada no planalto de Piratininga em 1530, com aldeias, liderança e agricultura.
- As aldeias tupi ocupavam **a parte superior da encosta**, dominando um rio principal navegável,
  com um córrego menor por perto para água potável (Prous, 1992, p. 376, via Prezia p. 42).
- No planalto, **as aldeias foram instaladas majoritariamente ao longo dos rios**, porque os rios
  eram as vias de comunicação, e o conglomerado servia à entreajuda em caso de ataque (Prezia p. 43).
- **Anchieta registrou 12 aldeias no planalto**, e a própria fonte diz que "é possível que tenha
  havido mais" — é um mínimo registrado por cronista, não um censo (Prezia p. 43).
- Mudavam de sítio a cada **3 a 4 anos**, pela durabilidade do sapé da cobertura e pelas idas ao
  litoral fazer sal — **e não** por esgotamento da roça, que é a explicação mais repetida
  informalmente e que esta fonte não confirma. Ao mudar, **ficavam na mesma região** (Prezia p. 43,
  citando carta do Pe. Luís da Grã de 8.06.1556, e Prous 1992, p. 388).
- Os povos, nomeados: **Tupiniquim** no planalto e litoral central; **Tupinambá/Tamoio** no litoral
  norte (de Bertioga ao Rio); **Carijó/Guarani** no litoral sul (até Cananéia); **Guaianá,
  Maromomi, Puri** na Serra do Mar, Bocaina e Mantiqueira.
- **Piratininga é o nome da aldeia** que Martim Afonso conheceu no planalto **em 1532** — a data
  documentada mais próxima de 1530 que a ficha alcança.

**Não sustenta, e o documento tem de dizer isso na cara:**
1. **A forma física da aldeia de Piratininga.** O padrão "até sete casas em torno de um pátio" é de
   Hans Staden, que escreveu sobre os Tupinambá do Rio/São Vicente, não do planalto. Prezia
   generaliza por semelhança de sítio arqueológico — método honesto, mas é inferência.
2. **A localização exata da aldeia de Piratininga.** A própria fonte diz: *"Se há consenso de que
   esta aldeia seria do cacique Tibiriçá, há controvérsias quanto à sua localização"* (p. 44).
   **Não há um ponto único e indiscutível no mapa.**
3. **Dimensões.** Nenhuma medida de casa, pátio ou aldeia aparece na ficha.
4. **Kaingang em 1530.** É a parte mais frágil. A tese tem uma linha colocando Kaingang além do
   limite sudoeste "na época" (p. 37), mas a própria pesquisadora, no resumo, adverte que a ligação
   documentada Guaianá→Kaingang é de **episódio de 1672** e que "Guaianá" cobre povos diferentes
   em séculos diferentes. **Nenhuma proposta abaixo nomeia Kaingang no mapa de 1530.**
5. **O que se plantava nas roças do planalto** especificamente: lacuna declarada na ficha.
6. **Qualquer contagem fechada.** ~500 pessoas por aldeia vem de tabela com faixa de 50 a 80 por
   casa, de cronistas que a própria fonte diz que "variam".

**Uma observação de método que vale para as três propostas:** desenhar N marcas **afirma N**. Não
existe marca visual "aproximadamente umas tantas". Por isso, abaixo, só o planalto recebe marcas
contáveis (as 12 de Anchieta, com a ressalva escrita ao lado), e todo o resto entra em faixa
não-contável. Quem desenhar 40 pontinhos no litoral estará afirmando 40, sem fonte nenhuma.

---

## 2. AS PROPOSTAS

### PROPOSTA A — A TERRA TRABALHADA
*A aldeia entra no mesmo registro em que o mundo já fala: símbolo, não maquete.*

**Planta (visto de cima).** No planalto de Piratininga, **12 marcas** enfileiradas ao longo dos
cursos d'água, agrupadas e não espalhadas — porque a fonte diz "ao longo dos rios" e "conglomerado
para entreajuda". Cada marca é uma pequena área **sem token de mata**, com o solo em outra cor
(terra trabalhada), do tamanho aproximado de um token de mata — isto é, a aldeia se lê pela
**mudança do chão**, não por um objeto novo. No litoral norte, litoral central, litoral sul e na
Serra do Mar/vale do Paraíba: **faixas** de mesma textura, sem pontos contáveis.

**Silhueta (visto do chão).** Nada de casa. Um relevo baixíssimo e uma quebra de cor na encosta
alta, sempre acima de um curso d'água — a implantação que a arqueologia documenta é, ela própria,
a informação: **posição alta, dominando o rio, com água menor por perto.**

**Quantas e onde.** 12 no planalto (número de fonte, rotulado como mínimo registrado). Faixas, sem
número, no litoral norte (Tupinambá/Tamoio), central (Tupiniquim), sul (Carijó/Guarani) e na serra
(Guaianá/Maromomi/Puri, com a ressalva da divergência escrita na etiqueta). **O oeste e o sudoeste
ficam sem marca — e isso é dito na tela:** não porque estivesse vazio, mas porque a fonte lida não
alcança lá. Mapa que mostra onde a documentação para é mapa que ensina método.

**Gente visível.** Não. Nenhuma figura humana, em escala nenhuma. **Este é o custo da proposta e
está declarado**: ela mostra o trabalho humano sobre o território, não as pessoas.

**Quando o ano avança.** As marcas **não somem** ao passar de 1530. Elas continuam, e o que muda é
o que cresce em volta — a mesma lógica que o mundo já usa para a mata. Some só o que a fonte
sustentar que sumiu, e com texto dizendo o quê.

**Fontes, e por que elas têm propriedade sobre cada elemento:**
- *A implantação (encosta alta, rio navegável, córrego menor):* **PROUS, André. Arqueologia
  brasileira, UnB, 1992, p. 376**, via Prezia p. 42. Propriedade: é a **única** afirmação de forma
  desta proposta que vem de **dado material** — sítio escavado —, e não de cronista europeu. É o
  ponto mais forte de A: ela se apoia justamente onde a colonização não é a testemunha.
- *A disposição ao longo dos rios e o agrupamento:* **PREZIA, Benedito. Os Tupi de Piratininga,
  tese PUC-SP, 2008, p. 43.** Propriedade: décadas coordenando o Projeto Pindorama da PUC-SP e a
  Pastoral Indigenista da Grande São Paulo — trabalho direto com as comunidades indígenas deste
  estado, não pesquisa à distância, e leitura crítica declarada das crônicas. Atende o critério de
  consciência social da licença de 19/08. **Não é indígena**, e ele mesmo escreve nos
  agradecimentos que espera que um dia esta história "possa ser contada por eles e de outra
  maneira" (p. 4). Isso qualifica o lugar dele; não invalida o dado.
- *As 12 aldeias:* **ANCHIETA, Breve informação do Brasil**, via Prezia p. 43. Propriedade: é
  cronista jesuíta, do lado da colonização, e a própria fonte secundária adverte que os
  missionários foram "muito parcos nesta toponímia". Entra **como mínimo registrado**, com o verbo
  "registrou", nunca como contagem — é o mesmo tratamento que o `CLAUDE.md` §2.6 exige de documento
  moderno, aplicado a documento do século XVI por coerência.
- *Os nomes dos povos e a distribuição:* **Prezia pp. 37, 40**, com a divergência sobre "Guaianá"
  registrada e não uniformizada.

---

### PROPOSTA B — AS SETE CASAS E O PÁTIO
*A aldeia é modelada de verdade, numa escala de leitura nova.*

**Planta.** Uma única aldeia, no planalto, ganha modelo: **sete volumes alongados dispostos em
anel em torno de um vazio central**, sobre a parte superior de uma encosta, com o rio abaixo. As
outras aldeias permanecem como marca (o registro da Proposta A), e só esta se abre.

**Silhueta.** Volumes **longos e baixos**, cobertura vegetal em duas águas correndo o comprimento
inteiro — casa comunal, não casa de família. Nada de teto cônico, nada de aro de estacas
pontiagudas, **nada de padrão gráfico** na parede ou na cobertura (ver §5).

**Quantas e onde.** Uma modelada + as demais como marca. A modelada **não é "a aldeia de
Piratininga"** e a etiqueta tem de dizer isso: a localização daquela aldeia é controversa entre
especialistas, e fixá-la num ponto seria inventar consenso.

**Gente visível.** Possível — e é aqui que a decisão fica mais dura. Nesta escala uma figura humana
tem pixel, e **figura humana neste contexto é decisão de representação, portão do dono** (§7).

**Quando o ano avança.** A aldeia modelada teria de **mudar de sítio a cada 3–4 anos dentro da
mesma região** para não mentir sobre a mobilidade documentada — o que num deslizador de passo 10
anos significa mover a cada tique. Isso é caro e é fácil de errar (ver armadilha 4 em §6).

**Fontes, e a propriedade delas:**
- *A forma (sete casas, pátio ritual):* **STADEN, Hans. Duas viagens ao Brasil [1557]**, via
  Prezia p. 42. Propriedade: **observação direta**, e é o que ela tem de melhor — Staden viveu
  entre os Tupinambá como prisioneiro. Mas: é europeu, é do lado da colonização, e escreveu sobre
  o **litoral do Rio/São Vicente**, não sobre o planalto. **Esta proposta compra uma precisão que
  a fonte não tem para este território.**
- *A liderança da casa:* Staden, via Prezia p. 45 — *"Cada cabana tem um superior… O que o
  principal ordena, é feito, não à força ou por medo, porém de boa vontade."* Se a aldeia for
  modelada, esta é a frase que impede a leitura de "aglomerado sem organização".
- *A implantação:* Prous, como em A.
- **O custo declarado, e é o maior da proposta:** a ficha **não traz uma única medida** — nem de
  casa, nem de pátio, nem de aldeia. Modelar exige inventar proporções. Ou seja, B só é honesta se
  a tela disser, junto, que a forma é **inferida de outro lugar** e as medidas são convenção de
  desenho. Sem essa etiqueta, B afirma como fato o que a fonte dá como inferência.

---

### PROPOSTA C — A REDE E O CAMINHAR
*O que aparece não é a aldeia; é o território tal como ele era usado.*

**Planta.** Os cursos d'água do planalto **acesos como caminhos**, e ao longo deles uma
constelação de marcas fracas. A informação central deixa de ser "há aldeias aqui" e passa a ser
**"isto era uma rede: rios como vias, aldeias em conjunto, entreajuda entre elas"**. Litoral e
serra entram como faixas ligadas ao planalto — a ficha registra intercâmbio intenso entre o
planalto e o litoral sul, de Bertioga a Cananéia.

**Silhueta.** Do chão: pontos de vida ao longo do vale, e o rio como a linha que os une.

**Quantas e onde.** Igual a A no número (12 contáveis no planalto, faixas no resto), mas com o
peso visual no **traço que liga**, não no ponto.

**Gente visível.** Não.

**Quando o ano avança.** É a única proposta em que o movimento é parte da forma: as marcas se
deslocam ligeiramente **dentro da mesma região** conforme os anos passam, tornando visível a
mobilidade cíclica de 3–4 anos.

**Fontes, e a propriedade delas:**
- *Rios como vias e aldeias ao longo deles, com entreajuda:* Prezia p. 43 (propriedade descrita em A).
- *Mobilidade a cada 3–4 anos pelo sapé e pelas idas ao sal:* **carta do Pe. Luís da Grã a Inácio
  de Loyola, 8.06.1556**, via Prezia p. 43. Propriedade: documento datado e nominado, com a
  ressalva de sempre — jesuíta, do lado da colonização, lido criticamente.
- *Permanência na mesma região, com sepultamentos indicando estabilidade:* **Prous 1992, p. 388**,
  via Prezia p. 43. **Esta fonte é indispensável a C, e não é ornamento:** sem ela, o movimento
  desenhado lê como "povo sem lugar fixo", que é precisamente o argumento historicamente usado
  contra o direito à terra. Ver armadilha 5 em §6 — é a mais grave deste documento.
- *Intercâmbio planalto–litoral sul:* Prezia p. 40.

---

### PROPOSTA D — O PISO
*Não é alternativa. É o que vale sob qualquer das três, e sozinha ela não faz o que o dono decidiu.*

**Digo por escrito que D não deveria estar na mesa como opção** — a regra 5 do meu briefing pede
isso. Ela é uma quarta forma possível (só texto, nenhum objeto novo) e eu a recuso como
alternativa: o dono decidiu que **as aldeias aparecem**, e D deixa a imagem exatamente como está,
trocando só a legenda. Seria responder à pergunta errada. Mas **todo o conteúdo de D é obrigatório
sob A, B ou C**, e sem ele qualquer uma das três recai na genericidade pan-indígena:

1. **O rótulo da fase muda.** Hoje `sp-relevo.html` linha 190 escreve *"floresta e aldeias"* — e
   esse rótulo cobre de 1530 a ~1590, não só 1530. Ele precisa nomear povos, não categorias. Três
   redações possíveis, para o dono escolher junto com a forma (a final depende dela):
   - *"Tupiniquim no planalto · Tupinambá e Carijó no litoral"*
   - *"os povos do planalto e do litoral"* (mais fraco: volta a ser categoria)
   - *"aldeias tupi ao longo dos rios"* (casa melhor com A e C)
2. **Etiqueta por região, com povo nomeado** — Tupiniquim, Tupinambá/Tamoio, Carijó/Guarani,
   Guaianá/Maromomi/Puri — e, na etiqueta da serra, a divergência dita em uma linha.
3. **Toda contagem carrega a incerteza junto.** "12 aldeias" só aparece com "registrou" e com a
   observação de que pode ter havido mais. Nada de "~500 pessoas" na tela.
4. **A tela diz onde a documentação para.** O oeste sem marca precisa da frase que explica que a
   ausência é da fonte, não do povo.
5. **A palavra *descobrimento* não existe**, e São Paulo não "é fundada sobre o nada": o
   `SPEC-MUNDO-3D.md` já registra que "São Paulo nasce sobre a aldeia de Piratininga" é conteúdo do
   §2, e é aqui que ele encaixa.
6. **Nada disso vira coletável, drop, missão ou ponto de interação alcançável.**

---

## 3. O QUE CADA UMA AFIRMA E O QUE DEIXA DE AFIRMAR

Este é o item mais importante do documento. Uma imagem afirma mesmo quando não escreve nada.

| | **A — terra trabalhada** | **B — as sete casas** | **C — a rede** |
|---|---|---|---|
| **Afirma** | havia gente, em número, organizada, trabalhando o solo, em posição escolhida sobre o rio | tudo o que A afirma, mais **uma forma construtiva concreta**: casa comunal longa, pátio no meio, vida coletiva | havia um **sistema**: rios como vias, aldeias em conjunto, presença que se move e permanece |
| **Deixa de afirmar** | forma de casa, aparência, quem exatamente, quantos ao todo | quantos ao todo, quem exatamente; **e continua sem afirmar** que era assim em Piratininga | forma de casa, aparência, número no estado |
| **Afirma sem fonte, se mal-etiquetada** | nada — é a de menor exposição | **a forma construtiva no planalto** (a fonte é do litoral do Rio) e **as proporções** (a ficha não traz medida nenhuma) | **que eram nômades**, se a permanência regional não for dita junto |
| **Onde a fonte é mais forte** | arqueologia (Prous) — independente da crônica colonial | crônica europeia (Staden) — observação direta, mas de outro território | crônica jesuítica + arqueologia combinadas |
| **Mostra pessoas** | não | possível, e é decisão do dono (§7) | não |
| **Custo de arte / técnico** | baixo: muda o chão, não acrescenta objeto | alto: modelo novo, escala de câmera nova, proporções inventadas | médio-alto: exige hidrografia, que o protótipo não tem (o relevo é estilizado, não é DEM, e não há rios) |
| **Risco de ler errado** | pode parecer clareira de desmatamento — igual à fase seguinte | pode virar "a oca genérica" que o §2 proíbe | pode virar "povo sem território fixo" — o risco mais grave do documento |

---

## 4. MINHA RECOMENDAÇÃO — e o argumento

**Recomendo a PROPOSTA A**, com o piso D inteiro por cima. Quatro razões, na ordem em que pesam:

1. **É a única cujo elemento de forma vem de fonte independente da colonização.** A implantação —
   encosta alta, rio navegável, córrego menor — é dado arqueológico (Prous). A forma de B vem de
   Staden; a força de C vem de carta jesuítica. Num jogo que já ensina a ler cronista com
   desconfiança, a proposta que se apoia no sítio escavado é a coerente.
2. **Ela afirma exatamente o que a fonte afirma, e nada além.** B tem de inventar proporções que a
   ficha não traz, e importar forma de outro território. A não inventa nada.
3. **Ela respeita o registro do mundo.** Neste protótipo a árvore tem 6 km de copa e a pessoa tem
   15 km de altura. Uma aldeia modelada seria o único objeto literal num mundo inteiro de símbolos
   — e a maquete precisa, cercada de tokens, lê como brinquedo, não como respeito.
4. **É a mais barata de acertar e a mais barata de corrigir.** Muda o chão; não cria modelo, nem
   câmera nova, nem figura humana. Se o dono quiser mais tarde a escala de perto, A não atrapalha
   B — B pode nascer depois, em cima de A, quando houver decisão sobre figura humana.

**O que eu perco recomendando A, dito abertamente:** A não mostra pessoas. Em 2026-08-08, sobre a
travessia, o dono disse com todas as letras que faltava gente nas imagens. Se o critério dele aqui
for o mesmo — *que apareça gente* — então A não atende e **B é a resposta certa**, com todas as
etiquetas de inferência que ela exige e com a pergunta de figura humana subindo para ele. **Não
decido isso; é dele.** O que eu posso dizer é que A é a proposta mais defensável em fonte, e B a
mais forte em presença — e as duas não são a mesma pergunta.

**Sobre C:** eu a mantenho na mesa porque ela é a única que ensina *movimento com permanência*, que
é o conceito mais mal-entendido do assunto. Mas ela é a que mais depende de execução perfeita, e o
modo de errar dela é o pior de todos (armadilha 5).

---

## 5. O QUE EU RECUSEI PROPOR, E POR QUÊ

Nenhuma destas entrou em nenhuma das três propostas, e todas me passaram pela cabeça:

1. **Grafismo, pintura corporal, cestaria ou padrão de parede.** Nenhuma fonte da ficha nomeia um
   padrão pertencente a um povo específico com autorização de uso. O logo do projeto foi escolhido
   por esse mesmo critério (`CLAUDE.md` §8): padrão que "parece indígena" trata centenas de povos
   como uma estética só. **Se alguma proposta ganhar padrão, ele terá de vir com povo, nome e
   fonte — ou não vem.**
2. **Uma aldeia num ponto único marcado "Piratininga".** A fonte diz por extenso que a localização
   é controversa entre especialistas. Cravar o ponto é inventar consenso.
3. **Nomear Kaingang em 1530.** A ligação documentada Guaianá→Kaingang é de episódio de 1672.
4. **Aldeia que some quando o deslizador passa de 1600**, sem nada dito. Isso afirma extinção —
   e o §2.1 nomeia esse erro. O que aconteceu aos povos do planalto depois de 1530 depende de
   leitura integral de **MONTEIRO, John Manuel. Negros da terra, Companhia das Letras, 1994**, que
   a pesquisadora declarou **não ter lido na íntegra**. Enquanto essa leitura não for feita, o jogo
   não tem base para afirmar o desfecho — e um desaparecimento desenhado é uma afirmação de desfecho.
5. **Ruína, aldeia abandonada, fogueira apagada.** Estética de civilização perdida; é o §2.1 outra vez.
6. **Casa, fogueira, pote ou objeto ritual como item, drop ou coletável.** O §2.4.5 já proíbe
   objeto ritual como colecionável; vale igual aqui.
7. **NPC indígena alcançável, com quem se fala ou se interage por toque.** Não passou por decisão
   do dono e é exatamente o tipo de coisa que o §2 manda parar.
8. **Números na tela como contagem fechada** — "500 pessoas", "12 aldeias" sem a ressalva.
9. **A "aldeia" como uma só, no singular.** Eram povos distintos, com línguas distintas, em regiões
   distintas do estado. Uma marca só, de um tipo só, é a genericidade pan-indígena em forma de arte.

---

## 6. AS ARMADILHAS — o que cada proposta arrisca se for mal executada

As quatro primeiras a ficha de fontes já nomeia (§5 dela); as demais são minhas.

1. **Aldeia genérica pan-indígena** (risco maior em B). Uma forma só, para o estado inteiro,
   apaga Tupiniquim, Tupinambá, Carijó, Guaianá, Maromomi e Puri numa coisa só. *Correção:* o piso
   D item 2 — etiqueta por região, com povo nomeado, sob qualquer proposta.
2. **Grafismo inventado** (risco maior em B). Ver §5.1.
3. **Aldeia como ruína ou cenário sem gente** (risco em A e C, que não desenham pessoas). Se a
   marca ficar parecendo pedra antiga, terreno queimado ou sítio arqueológico, o jogo troca "havia
   gente aqui" por "houve gente aqui" — e o tempo verbal é o assunto inteiro. *Correção:* a marca
   é **terra em uso** (cor de solo trabalhado, contorno vivo), nunca pedra, nunca cinza, nunca
   contorno quebrado.
4. **Congelar o povo em 1530** (risco nas três). Se a marca some conforme o ano avança e nada mais
   se diz, o mundo afirma que aquilo acabou. *Correção:* a marca persiste, e o fecho da linha do
   tempo carrega o dado de hoje — 55.295 pessoas autodeclaradas indígenas em SP (IBGE, Censo 2022,
   via CPI-SP), a Terra Indígena Jaraguá com 543 pessoas (Sesai, 2025) e aldeias com nome próprio
   (Pyau, Itakupe, Yvy Porã, Ita Endy, Ita Vera, Ytu, Pindo Mirĩ). **Com a nuance dita:** não é
   linha reta desde 1530; é presença viva com história própria de caminhada.
5. **"Povo sem território fixo"** — risco específico e grave de C. Marcas que se deslocam pelo mapa
   podem ser lidas como nomadismo, e "não tinham lugar fixo" é literalmente o argumento
   historicamente usado para negar direito à terra. *Correção obrigatória se C for escolhida:* o
   deslocamento é **curto e dentro da mesma região**, com a frase de Prous sobre sepultamentos e
   estabilidade dita na tela, e nunca uma aldeia atravessando o estado.
6. **A clareira que vira desmatamento** — risco específico de A. Marca de solo aberto em 1530 e
   marca de ocupação em 1750 não podem ler igual, senão o jogo iguala roça de subsistência a frente
   de expansão. *Correção:* cor, borda e comportamento distintos, e a diferença testada olhando os
   dois prints lado a lado, não presumida.
7. **A precisão emprestada** — risco específico de B. Modelar a casa com nitidez faz a tela afirmar
   "era assim aqui", quando a fonte diz "era assim ali, e provavelmente aqui também". *Correção:*
   etiqueta de inferência visível, não em nota de rodapé.
8. **Contar sem querer.** Qualquer número de marcas desenhadas é um número afirmado. Só o planalto
   tem número de fonte; o resto entra em faixa.
9. **A escala que mente sem falar.** Uma aldeia visível neste mundo é, em unidades reais, do tamanho
   de uma cidade. Se nada disser que a escala é simbólica, o mapa afirma densidade populacional que
   ninguém mediu.

---

## 7. PARE — as perguntas de §2 que eu não respondo

Formuladas prontas para virar item de check. Nenhuma delas é minha.

1. **A voz Guarani viva vale como lugar de fala para descrever a aldeia de 1530?** Levantada pela
   pesquisadora, e ela está certa em levantar: os Guarani Mbya são a presença indígena mais ligada
   a este território hoje (543 pessoas na T.I. Jaraguá, Sesai 2025), **mas não são os mesmos povos
   do planalto de Piratininga em 1530** — são um povo Tupi-Guarani cuja própria história, segundo
   Ladeira/ISA, é de caminhada pelo litoral atlântico ao longo de séculos. A ficha registrou
   autoria Guarani viva disponível (Kaká Werá Jekupé, *Tupã Tenondé*, 2001; Olívio Jekupé, *Tekoa*)
   e **não conseguiu extrair citação literal** delas nesta rodada. Usar essa voz para narrar 1530
   é decisão de representação. **Não respondo.**
2. **Aparece figura humana?** Só a Proposta B a torna possível. Figura humana indígena em 1530 é
   criação de representação nova, não revisão de texto existente — fora da minha licença de 19/08.
3. **Se B for escolhida, quem é a autoria que valida a forma da casa?** A forma vem de cronista
   europeu. Se o dono quiser B, recomendo que a validação passe por leitura das obras de autoria
   Guarani já localizadas, ou por consulta a instituição com trabalho direto (CPI-SP) — mas quem
   decide se isso é condição é ele.
4. **A frase "São Paulo nasce sobre a aldeia de Piratininga"** já está apontada no
   `SPEC-MUNDO-3D.md` como conteúdo do §2. Se a forma escolhida fizer a cidade crescer sobre a
   marca da aldeia, essa frase passa a ser afirmada **pela imagem**, esteja escrita ou não.

---

## 8. Próximo passo, na ordem

1. O dono escolhe A, B ou C (D é piso, não escolha) e responde §7.1 e §7.2.
2. Só então: pedido de arte, com a imagem na mesa e o prompt ao lado.
3. Antes de qualquer coisa entrar no protótipo: leitura integral de **MONTEIRO, 1994** — é o que
   falta para o jogo poder dizer o que aconteceu depois de 1530 sem inventar desfecho.
4. Print antes/depois comparado de verdade, incluindo o par 1530 × 1750 lado a lado (armadilha 6).
