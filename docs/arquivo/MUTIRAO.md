# MUTIRÃO — especificação executável (cap. 2, PALMARES)

> Escrita pela Direção de Evolução em 2026-08-09, a partir do ticket da exploração
> anterior. Isto NÃO é código: é o desenho que a implementação segue lendo, com número,
> nome de função e campo de save. As leis que regem tudo abaixo: o **§2 inteiro** do
> `CLAUDE.md` (representação se decide com o dono), a trava do dono (**qualquer mudança
> de economia exige medição antes/depois**), a trava de composição (**média de objetos em
> cena ≤ 4,7–5,4**, a do capítulo 1), e **zero imagem nova** (o peso está estourado —
> tudo aqui é desenhado por código).

## O que é, em três frases

Na **faixa final** do capítulo 2 (a que `faixaViva()` já governa: os últimos 20% do vão
de impacto, ou capítulo fechado), existem **três canteiros** — a **roça**, a **paliçada**
e a **casa** — desenhados por código na gramática de materiais do chrome. **Segurar o
dedo em qualquer ponto do mundo** trabalha no canteiro mais próximo: sem alvo, sem
metade certa, sem timing, um polegar só. A obra **consome** os três recursos que hoje só
enchem (flor, água, refeição); com o jogo fechado ela avança proporcional a
`S.acolhidos[1]` — e **zero acolhidas = zero avanço**; cada estágio erguido **fica de pé
para sempre**.

---

## 1. A ECONOMIA, com as contas

### 1.1 O que já existe e de onde os números saem

Tudo medido e registrado no `NOTES.md`; nada abaixo é chute:

| dado | valor | de onde |
|---|---|---|
| `LIMIAR_CENA` | 1.500 de impacto por cena | `src/jogo.ts` (~l. 4982) |
| vão do cap. 2 | impacto 3.000 → 6.000 (2 cenas) | `marcoAlvo()` / `faixaViva()` |
| faixa final | impacto ≥ 5.400 (`FAIXA_FRAC` 0,8) | `faixaViva()` |
| renda andando+segurando, sem melhoria | ~631/min | NOTES, medição da rua por distância |
| acolhidas/min no cap. 2 (andando+segurando) | 28, fração 1,00 | NOTES 2026-08-06, tabela |
| acolhidas/min no cap. 2 (correndo+segurando) | 56 × 0,68 ≈ **38** | idem |
| recurso por drop | **1** (`coletarDrop`: `S.recursos[r] += 1`) | `RECURSO_DE` (~l. 798) |
| repartição andando (`mobMix.limpo`) | flor 20% · água 22% · refeição 58% | `CFG.mobMix` |
| repartição correndo (`mobMix.carvao`) | flor 45% · água 30% · refeição 25% | `CFG.mobMix` |
| teto offline | `CFG.capOfflineHoras` = 12 h | `CFG` |

Disso derivam as **taxas de abastecimento** (recursos/min, cada acolhida deixa 1 drop e
a personagem recolhe passando por cima):

| ritmo | flor/min | água/min | refeição/min | total/min |
|---|---:|---:|---:|---:|
| andando + segurando | 5,6 | 6,2 | 16,2 | 28 |
| correndo + segurando | 17,1 | 11,4 | 9,5 | 38 |

E o **estoque típico ao chegar à faixa final** pela primeira vez (impacto 0 → 5.400 a
~631/min ≈ 8,6 min de rua; 28–34 drops/min; repartição majoritariamente `limpo`):

| | flor | água | refeição | total |
|---|---:|---:|---:|---:|
| estimativa de chegada | 48–58 | 53–64 | 139–168 | **240–290** |

Isto é **estimativa derivada**, não medição — o incremento 1 abaixo a mede de verdade
(`test/medir-mutirao.js --acervo`) ANTES de qualquer código de consumo entrar.

### 1.2 A unidade de obra

- **Ponto de obra**: a unidade interna de avanço. **Nunca aparece na tela** — a obra não
  é placar; o progresso visível é o próprio desenho (§3).
- `OBRA_PONTOS_ESTAGIO = 60` pontos por estágio; **3 estágios** por canteiro;
  `OBRA_MAX = 3 × 60 = 180` pontos por canteiro (derivado, nunca literal solto).
- **Parcela**: a cada **10 pontos** cruzados, o canteiro debita uma parcela de recursos
  (6 parcelas por estágio). Se o estoque não paga a parcela seguinte, os pontos congelam
  na fronteira da parcela — **a obra espera mantimentos**, on-line e off-line igual.
  Parcela é o que torna tudo inteiro (o validador `mapa` faz `floor`) e o que faz o
  débito ser retomável sem estado extra: `parcelas debitadas = floor(pontos / 10)` —
  deriva dos próprios pontos, nada a mais no save.
- **Trabalho da mão**: segurando, **1 ponto/segundo** no canteiro mais próximo.
- Estágio de um canteiro: `estagioObra(c) = floor(S.obra[c] / 60)` (0 a 3).

### 1.3 A tabela de custos

Custos **por parcela** (× 6 = o estágio). Ordem dos canteiros é fixa e é a da
sobrevivência: comer, proteger, morar.

| canteiro | estágio | flor/parc. | água/parc. | ref./parc. | estágio total (f·a·r) |
|---|---|---:|---:|---:|---|
| **ROÇA** | E1 as leiras abertas | 2 | 3 | 1 | 12 · 18 · 6 |
| | E2 as mudas na terra | 3 | 4 | 1 | 18 · 24 · 6 |
| | E3 a roça crescida | 4 | 5 | 2 | 24 · 30 · 12 |
| **PALIÇADA** | E1 as primeiras estacas | 1 | 2 | 3 | 6 · 12 · 18 |
| | E2 a tranca | 1 | 3 | 4 | 6 · 18 · 24 |
| | E3 a paliçada cerrada | 2 | 3 | 5 | 12 · 18 · 30 |
| **CASA** | E1 os esteios | 2 | 2 | 2 | 12 · 12 · 12 |
| | E2 as paredes de taipa | 2 | 3 | 3 | 12 · 18 · 18 |
| | E3 a casa coberta | 3 | 4 | 4 | 18 · 24 · 24 |
| **TOTAL** | 540 pontos | | | | **120 flor · 174 água · 150 refeição = 444** |

**A conta que sustenta a tabela:**

1. **Total ≈ 1,6–1,9× o estoque de chegada** (444 contra 240–290): o primeiro dia não
   termina a obra com o que trouxe — o motivo de voltar amanhã é a metade que falta.
2. **O gargalo é a água, de propósito** — é o recurso mais magro nos dois ritmos
   (6,2/min andando, 11,4/min correndo). Demanda ÷ oferta por ritmo: andando, a água
   custa 7,9 unidades de tempo por unidade de share (flor 6,0, refeição 2,6); correndo,
   flor cai para 2,7 e refeição sobe para 6,0. **Nenhum ritmo sozinho abastece bem** —
   misturar ritmos é a jogada boa, que é exatamente a decisão que o jogo já mede.
3. **Custo invariante ao número de gente.** O estágio custa o mesmo com 5 ou 500
   acolhidas. Não existe "upkeep": com `acolhidos = 0` nada avança e **nada consome**.
   (É contramedida do §2, ver risco R1.)
4. Parcelas inteiras porque `recursos` é validado por `cont` dentro de `mapa` — meio
   recurso não existe.

### 1.4 Tempo até a obra completa, por estratégia (derivado; a simulação confirma)

| estratégia | conta | total |
|---|---|---|
| só a mão, correndo | estoque de chegada + ~10–12 min de rua p/ água/flor + 9 min segurando (540 s) | **~20–25 min** |
| só a mão, andando | + ~19–28 min de rua (água a 6,2/min) + 9 min segurando | **~30–37 min** |
| só o mutirão (a ≥ 30) | 540 ÷ 18 pontos/h = 30 h de ausência somada, teto 216 pontos/ausência (12 h) — e o estoque trava antes | **3–4 noites, com sessões de dia para abastecer** |
| misto esperado | sessões de ~10 min + noites de mutirão | **obra completa no dia 2–3** — a janela da pergunta do produto |

**Regra de decisão já deixada escrita:** se a medição mostrar obra completa rotineira no
dia 1 numa sessão só, a válvula é **dobrar as parcelas dos três E3** (total passa a
~640). Nunca mexer em `LIMIARES`, no valor do drop nem nas taxas da rua — a rua foi
medida três vezes e não é daqui.

### 1.5 O que medir, antes e depois — a trava do dono

| medida | instrumento | ANTES (main de hoje) | DEPOIS | critério |
|---|---|---|---|---|
| recursos/min por tipo, 4 células (andando/correndo × cap 1/cap 2), 90 s | **`test/medir-mutirao.js --acervo`** (novo, molde do `medir-rua.js`) | grava | grava | coleta idêntica ±5% (consumo não toca a coleta) |
| renda/min nas células padrão | `test/medir-poluicao.js` | grava | grava | Δ ≤ ±10% (trava herdada da composição) |
| média/pico de objetos em cena na faixa final do cap. 2 | `test/medir-poluicao.js` + `test/prints-composicao.js` (célula nova da faixa) | grava | grava | **média ≤ 5,4** |
| estoque ao fim de um cap. 2 completo | `test/medir-mutirao.js --acervo` | só enche | enche − consumo | número no `NOTES.md`, sem alvo — é o retrato |
| tempo-até-obra-completa nas 4 estratégias | **`test/medir-mutirao.js --simular`** (Node puro: importa `CUSTO_OBRA` e `taxaMutirao`, zero navegador) | — | tabela | colar no `NOTES.md` |
| FPS | `test/smoke.js` | ≥ 58 | ≥ 58 | piso existente |
| save adulterado da obra | `test/smoke.js` (asserção nova) | — | `{roca:5e9, palicada:"muitas", casa:-3, x:9}` → `{roca:180, palicada:0, casa:0}` | obrigatório |
| segurar na faixa | `test/smoke.js` (asserção nova) | — | 2 s de segurar no mundo dentro da faixa: gera pontos, **≤ 1 golpe** | obrigatório |

As fórmulas de custo e taxa **exportadas num objeto só** (`CUSTO_OBRA`, `taxaMutirao`),
para a simulação rodar sem navegador — o mesmo padrão que o jogo já usa para o
simulador de hp esperado (`CFG.mobMix` mora no CFG por isso).

---

## 2. O ESTADO PERSISTIDO

### 2.1 O campo novo no `ESQUEMA_SAVE`

```ts
// A OBRA DO LUGAR (cap. 2): pontos acumulados por canteiro. Estágio e parcelas
// debitadas DERIVAM dos pontos (floor(p/60) e floor(p/10)) — um número por canteiro
// é o save inteiro da obra. Teto = OBRA_MAX (3 estágios × 60, derivado). Aparar em
// 180 dá, no pior caso, uma obra pronta a um save adulterado — e esse é o único
// campo do jogo em que errar para o lado "pronto" é aceitável, porque a obra não
// multiplica NADA: não há bônus, não há renda, não há número. Um save torto pode
// ganhar cenário; nunca ganha economia. Chave desconhecida é descartada pelo `mapa`.
obra: { tipo: "mapa", chaves: ["roca", "palicada", "casa"], min: 0, max: OBRA_MAX, pad: 0 },
```

- **Tipo `mapa`** — o tipo novo que nasceu para `recursos` serve inteiro: chaves fixas
  declaradas no esquema, cada valor pela régua de `cont` (inteiro, faixa fechada),
  chave que o save traz e o esquema não declara morre na porta (§3.3: o save é entrada
  não confiável; o smoke já alimenta save adulterado e a asserção nova cobre este campo).
- **Por que a faixa é 0..180:** `min 0` porque **nenhum caminho de código decrementa
  pontos** (ver risco R4 — obra não sofre dano); `max 180` é `3 × OBRA_PONTOS_ESTAGIO`,
  derivação escrita no próprio comentário. O lado do erro está justificado acima: ao
  contrário de `aberturas` (onde aparar calaria conteúdo) e de `acolhidos` (onde
  inventaria gente), aqui aparar entrega no máximo um cenário — o único efeito da obra.
- **Em `S`:** `obra: { roca: 0, palicada: 0, casa: 0 }` — e nada mais. `salvar()` já
  grava tudo que está no esquema (l. ~1503), então persistência vem de graça.
- **Fração fica na memória**: `obraFrac` (variável de módulo, nunca salva) acumula o
  resto de 1 ponto do trabalho contínuo; `S.obra` só recebe inteiros. Meio ponto
  perdido no fechamento da aba não é perda que alguém veja.

### 2.2 Um conserto que o consumo torna obrigatório: `recNaTela`

Hoje `recNaTela` (l. ~6727) esconde o nicho sempre que `v ≤ 0` — indistinguível de
"nunca rendeu" porque **nada gasta**. Com consumo, um contador pode voltar a zero e o
nicho sumiria, contradizendo o próprio comentário da função ("some de novo só no APAGAR
MEU PROGRESSO"). Conserto no MESMO incremento do consumo: o nicho **revela e não
re-esconde** (`if (v > 0) rec.classList.remove("oculto")` — nunca adiciona), e
`zerarJogo()` passa a adicionar `oculto` explicitamente, que é o único caminho que zera
de verdade.

---

## 3. O DESENHO POR CÓDIGO

### 3.1 Onde, em que camada, com que escala

- **Camada:** o canvas do mundo (`#scene`, `cx`), dentro de `desenharMundo()`, logo
  **depois de `desenharMarco()`** e antes dos drops — mesma camada 1:1, **nunca paralaxe
  nova** (armadilha nº 1 do §7). Rola com a estrada como a placa de marco rola.
- **Escala:** todos os retângulos em **px de mundo inteiros**; o `#scene` já amplia com
  o `SCALE` inteiro do jogo (mínimo 2), então nenhum pixel sai fracionário — a regra da
  onda 7 (razão inteira) vale aqui por construção.
- **Tinta da hora:** toda cor passa por `tintaCor()` — canteiro é coisa da rua, não
  sinal (regra da onda 2). **Sombra de contato** com `sombra(sx, GROUND, larg, 0.16)`,
  a mesma dose da placa de marco.
- **Semeadura:** os 3 canteiros são semeados junto com os moradores, no mesmo bloco
  `todasAtras` de `atualizarMoradores()` — ordem fixa roça → paliçada → casa, o primeiro
  a `worldX + W·0,7`, os seguintes **espaçados W px de mundo** (uma tela): **no máximo
  um canteiro por quadro**. O canteiro desenhado é PROJEÇÃO do estado (`S.obra`),
  wherever semeado — é assim que "fica de pé para sempre" convive com uma faixa que
  repovoa à frente (fragilidade (b) já registrada no NOTES, mesma resposta).
- **Função:** `desenharCanteiro(tipo, sx)` + `canteiroMaisProximo()` (menor
  `|wx − (worldX + HX)|` entre os 3 semeados).

### 3.2 As três receitas, na gramática que já existe

As cores são as que o `estilo.css`/`jogo.ts` já falam — madeira da placa de marco
(`#241a10` contorno · `#5c3d20` corpo · `#7a5430` tábua · `#a07a48` luz), pedra/taipa
das lajes (`#a39a83` · `#8f8770` sombra · `#c4bba4` luz), verdes da folha da onda 7
(`#7d9a3c` corpo · `#9bd44f` luz · `#3e4721` talo), quase-preto `#191510`, terra
`#41290f`. **Nenhum glifo, nenhum grafismo inventado** — a regra do logo e do §2.1;
veio de madeira é risco horizontal, como na placa.

**Cada parcela debitada acrescenta UMA unidade visível** — o progresso É o desenho,
nunca uma barra (barra sobre obra viraria placar; e a "aura de espera" segue com o dono,
não a tocamos). 6 unidades por estágio, 18 por canteiro:

| canteiro | caixa (mundo) | estágio | a unidade que cada parcela acrescenta |
|---|---|---|---|
| **ROÇA** | 48×16, base em `GROUND` | E1 | uma **leira**: retângulo 44×2 `#41290f`, topo 1 px `#5c3d20` (6 leiras empilhadas com 1 px de vão) |
| | | E2 | um grupo de **mudas** sobre uma leira: 3 talos 1×3 `#3e4721` com copa 2×2 `#7d9a3c` |
| | | E3 | uma **touceira** 4×6: corpo `#7d9a3c`, luz 1 px `#9bd44f`, talo `#3e4721` |
| **PALIÇADA** | 40×26, base em `GROUND` | E1 | uma **estaca** 3×14: contorno `#241a10`, corpo `#5c3d20`, ponta 1 px `#a07a48` (6 estacas, vão 4 px) |
| | | E2 | uma estaca 3×18 **intercalada** + (na 6ª parcela) a **tranca**: travessão 38×2 `#7a5430` com contorno |
| | | E3 | uma estaca 3×22 fechando o vão + (na 6ª) a segunda tranca e o bisel de luz nas pontas |
| **CASA** | 56×40, base em `GROUND` | E1 | uma **peça de esteio**: 4 postes 3×24, cumeeira 52×3, caibros em degraus — madeira da placa |
| | | E2 | um **painel de taipa** 8×18: `#a39a83`, sombra `#8f8770`, contorno `#191510` |
| | | E3 | uma **fiada de palha** 54×4 descendo em degraus: topo `#b8834a`, sombra `#7c4f24` (madeira clara — o destaque por material, como manda a régua) |

Alturas conferidas contra a régua de leitura: a casa completa (40 px) fica **abaixo da
protagonista (44 px)**, e a silhueta dos três é **larga e baixa ou alta e parada** —
nunca a silhueta baixa e móvel dos itens (o mesmo critério de silhueta da placa de
marco, risco declarado do `JOGABILIDADE.md`).

### 3.3 A trava de poluição, e a válvula

A média de objetos em cena no cap. 1 é **4,7–5,4** (medida em `prints-composicao.js`) e
é o teto. O espaçamento de uma tela garante ≤ 1 canteiro por quadro; ainda assim a faixa
já carrega até 6 moradores + drops + chegadas. **Medir com canteiro contando como
objeto.** Se a média passar de 5,4, a válvula é uma e está decidida: **moradores
visíveis 6 → 4** na faixa (o excedente já vira texto — "E MAIS N VIVEM AQUI" — e o §2
prefere menos figuras a mais). Não há segunda válvula; se 4 + canteiro ainda estourar,
parar e repensar, não apertar.

### 3.4 O gesto

- **Entrada:** no `pointerdown` do canvas (`cv`, l. ~8309), o toque dispara a ação da
  metade como hoje (pular/golpear — a resposta imediata não pode ganhar 300 ms de
  atraso). Se o dedo **ficar 300 ms** (`MUTIRAO_HOLD_MS`) e `capGente() && faixaViva()
  && !telaAberta() && !falaAberta()` e a obra não estiver completa: entra em **obra** —
  um relógio de 1 ponto/s (por `dt`, não por `setInterval`) no `canteiroMaisProximo()`.
  `pointerup`/`pointercancel`/`blur` soltam (o mesmo trio do botão dourado).
- **A personagem PARA** enquanto trabalha (`velocidadeMundo()` devolve 0 sob
  `segurandoObra`), na pose parada que os moradores já usam (`atk1` quadro 3 — pose de
  quem segura, não de quem golpeia). Parada por distância = zero chegadas novas
  (spawn é por chão coberto) — trabalhar é, literalmente, parar de andar: o custo de
  oportunidade é a rua que não anda, e é o jogo medindo a mesma tensão de sempre.
- **O golpe não dispara durante a obra** — segurar na faixa nunca vira rajada; quem
  quiser acolher quem espera usa o botão dourado (que não muda: segue golpe, segue
  repetindo — ele é DOM, fora do canvas).
- **Feedback:** a cada parcela debitada, `burst()` nas cores do material do canteiro
  (serragem `#7a5430`/terra `#41290f`) + a unidade nova aparecendo. **Nenhum float de
  número** — obra não é placar. Microdica única, no padrão das existentes
  (`dicasValem()`): "SEGURE PARA AJUDAR NA OBRA", uma vez, só na primeira faixa com
  canteiro de pé.
- Com os três canteiros em 180, o segurar deixa de armar obra — o lugar está pronto.

---

## 4. O IDLE

### 4.1 A taxa do mutirão

```
a = S.acolhidos[CAP_GENTE]          // só Palmares; as outras posições não entram
taxaMutirao(a) = 2·min(a, 6) + 0,25·min(max(a − 6, 0), 24)      // pontos por HORA
```

- `a = 0` → **0** (a exigência do ticket, e do §2: sem gente, sem obra).
- As **6 primeiras** valem 2 pontos/h cada — são as 6 figuras que a faixa desenha
  vivendo ali; quem se vê trabalha mais no desenho da conta.
- Da 7ª à 30ª, 0,25/h cada: proporcional, mas **saturando em 18 pontos/h** — acima de
  30 acolhidas, mais gente **não** rende mais obra. O teto é contramedida do §2 (gente
  não é motor a escalar — ver R1) e proteção contra save adulterado (9999 acolhidas não
  teleporta a obra).
- Máximos que a fórmula produz: 18 pontos/h; ausência no teto de 12 h
  (`CFG.capOfflineHoras`) = **216 pontos = 3,6 estágios** — SE o estoque pagar as
  parcelas, que é o freio real.

### 4.2 A aplicação, off-line e on-line — um relógio só

`avancarObra(pontos)` é uma função única:

1. Enquanto houver pontos: alvo = **o canteiro com menos pontos** (empate na ordem
   roça → paliçada → casa) — o mutirão acode onde falta mais, e ninguém o comanda.
2. Avança 1 ponto; ao cruzar múltiplo de 10, debita a parcela do estágio corrente
   (tabela §1.3) de `S.recursos`. Parcela impagável → o canteiro trava na fronteira e o
   alvo passa ao próximo; os três travados → o resto dos pontos **se perde** (o mutirão
   esperou mantimentos; ponto não é moeda, não se guarda).
3. Devolve o relato: `{ pontos, estagios: [{canteiro, estagio}], parouPor: "agua"|null }`.

- **Off-line:** em `carregar()`, depois de `migrarArco()` e ANTES de `mostrarRetorno(dt)`:
  `relatoObra = avancarObra(floor((min(dt, capOfflineHoras·3600)/3600) · taxaMutirao(a)))`
  — o mesmo `dt` já capado que a tela de retorno usa.
- **On-line:** o mesmo relógio corre por segundo (`taxaMutirao(a)/3600` por s, no
  acumulador `obraFrac`), no laço junto de `atualizarMoradores()`. Máximo on-line: 1
  ponto a cada ~3,3 min — imperceptível de propósito; a obra ao vivo é da mão. Correr
  dentro OU fora do cap. 2 (a obra é de Palmares, não da tela em que se está).

### 4.3 Na tela de retorno que já existe

`mostrarRetorno()` (l. ~2101) ganha, entre a linha das acolhidas e a linha-verdade,
lendo só o relato (regra dura da tela: **nenhum dígito inventado** — e aqui nenhum
dígito, ponto: os estágios têm NOME, §1.3):

- por estágio completado: `"O mutirão ergueu: a paliçada chegou à tranca."` (nomes da
  tabela §1.3);
- pontos > 0 sem estágio: `"O mutirão adiantou a obra da roça."`;
- `parouPor`: `"Os mantimentos acabaram — a obra esperou por você."`;
- `a = 0` ou pontos = 0: **nenhuma linha** — e só nesse caso a linha-verdade atual
  ("A estrada esperou. O que chega, chega para quem está aqui.") continua sendo dita
  inteira; quando a obra andou, ela mentiria e é substituída pela(s) linha(s) acima.

---

## 5. O QUE PODE DAR ERRADO NO §2 — e a contramedida no desenho

A linha do ticket: *gente nunca é recurso; as acolhidas trabalham por conta própria, o
jogador só decide onde ELE trabalha.*

**R1 — Gente vira motor de produção** ("cada acolhida rende X/h" é gente-como-gerador).
Contramedidas, todas já no desenho: a taxa **satura em 30** e nunca aparece como número
por pessoa em lugar nenhum (nem HUD, nem retorno, nem dica); o custo da obra é
**invariante ao número de acolhidas** e não existe upkeep (zero gente = zero consumo,
nunca "elas comem o estoque"); acolher continua sem contador (a regra de 2026-08-06:
o grupo na tela é a recompensa inteira).

**R2 — O jogador vira senhor do mutirão** (alocar pessoas em canteiros é poder sobre
gente escravizada invertido em fantasia de gestão — o mesmo veneno do §2.4.3).
Contramedidas: **não existe interface de alocação** — nenhuma acolhida é tocável,
selecionável ou posicionável; o jogador escolhe onde a MÃO DELE trabalha (o canteiro
mais próximo do corpo dele, decidido por onde ele parou); as acolhidas escolhem sozinhas
(menos pontos primeiro) e a regra é do jogo, não um comando.

**R3 — Palmares vira city-builder** (a gramática "limpar terreno → expandir → otimizar"
é a linguagem do colono, e um quilombo tocado nela seria o "encontro de culturas" em
roupa de mecânica). Contramedidas: **três canteiros e nunca mais um** — sem grid, sem
novo lote, sem expansão, sem otimização; os três são os documentados do quilombo (roça,
paliçada, casa); a obra **não rende nada** (nenhum multiplicador, nenhuma renda — o §6
do CLAUDE.md nem se aplica porque não há número a afirmar); se algum estágio ganhar fala,
o texto entra com fonte no `NOTES.md` no mesmo commit, prioridade de autoria do §2
(Beatriz Nascimento é a primeira consulta para Palmares).

**R4 — o quarto risco, encontrado: a paliçada chama a guerra para dentro da mecânica.**
Uma paliçada jogável pede, na cabeça de qualquer designer, o ataque que ela repele —
HP, evento de cerco, tower defense — e isso poria a violência histórica na mão do
sistema (e, no limite, o jogador defendendo Palmares a golpes, que é o item 1 da lista
de fragilidades de 2026-08-06 elevado ao quadrado). Contramedida estrutural: **pontos
de obra só crescem** — nenhuma função decrementa `S.obra`, o esquema tem `min: 0` e o
smoke pode afirmar isso (save recarregado nunca regride); **nada no jogo ataca, testa ou
ameaça a obra**; e o gesto de trabalhar é o oposto do golpe (a personagem PARA; o golpe
não dispara durante a obra). "Cada estágio fica de pé para sempre" não é feature — é a
trava. Um segundo rosto do mesmo risco, também coberto: segurar-para-trabalhar e
segurar-o-botão-para-golpear são gestos vizinhos; a separação é espacial (canvas × botão
dourado) e de estado (na obra, o golpe está desarmado).

---

## 6. O QUE VAI AO DONO ANTES DO PRIMEIRO PIXEL

Gente em cena é sempre decisão dele; e a obra é representação de Palmares. Texto do
pedido, pronto:

> Para o fim do capítulo de Palmares quero dar corpo ao lugar onde as pessoas acolhidas
> vivem: três obras que crescem aos poucos — a **roça**, a **paliçada** e uma **casa**.
> Nada de imagem nova: tudo desenhado por código, com a mesma madeira e pedra das placas
> e botões do jogo.
>
> Como funciona: o que os itens deixam (flor, água, refeição) passa a ser **gasto** na
> obra — hoje esses contadores só enchem e não servem para nada. Quem joga **segura o
> dedo na tela** para trabalhar no canteiro mais perto. E, com o jogo fechado, a obra
> avança um pouco sozinha, porque as pessoas que vivem ali seguem tocando-a — se ninguém
> foi acolhida, nada avança.
>
> Três cuidados que eu já deixei travados, e queria seu OK no conjunto:
> - **Ninguém vira número.** O jogo nunca mostra "quanto cada pessoa rende", ninguém é
>   posicionado ou comandado, e a obra custa o mesmo com 5 ou 500 acolhidas.
> - **As figuras continuam como hoje** (paradas ou dando passos curtos, agora perto dos
>   canteiros). Não vou inventar pose de trabalho sem arte para isso.
> - **Nada ataca a obra, nunca.** A paliçada não tem "vida", não existe defesa jogável.
>   Cada pedaço erguido fica de pé para sempre.
>
> O que preciso que você decida: (1) mostrar roça, paliçada e casa como as obras de
> Palmares está bem para você? (2) está bem a obra andar um pouco com o jogo fechado, do
> jeito descrito? (3) se algum estágio ganhar uma frase de história, o texto vem com
> fonte e passa por você antes de entrar.

---

## Ordem de implementação, em incrementos — cada um termina em `npm test` verde

1. **O pedido ao dono + a régua ANTES.** Enviar o texto do §6. Enquanto espera:
   escrever `test/medir-mutirao.js` (`--acervo` no molde do `medir-rua.js`; `--simular`
   ainda vazio) e rodar a medição ANTES na main de hoje (recursos/min, renda/min,
   objetos na faixa). Nada do jogo muda; `npm test` verde por definição. Números no
   `NOTES.md`. **Os incrementos 2–5 só começam com o OK do dono** — o §2 manda, e o
   idle-por-acolhidas faz parte do que foi perguntado.
2. **A economia, cega.** `CUSTO_OBRA`, `OBRA_PONTOS_ESTAGIO`, `taxaMutirao`,
   `avancarObra`; `S.obra` + entrada no `ESQUEMA_SAVE`; `avancarObra` off-line em
   `carregar()` + linhas do retorno; relógio on-line no laço; `recNaTela` pegajoso +
   `zerarJogo` escondendo explícito. Sem desenho, sem gesto. Smoke: asserção do save
   adulterado + a de que `S.obra` nunca regride num recarregamento. `--simular` do
   instrumento passa a rodar (importa as tabelas). `npm test`; `NOTES.md` no mesmo
   commit (regra da casa para mudança de mecânica).
3. **Os canteiros no mundo.** `desenharCanteiro` (as três receitas do §3.2), semeadura
   no bloco dos moradores, sombra e `tintaCor`. Prints antes/depois da faixa
   (`prints-composicao.js` + print olhado de verdade); medição de poluição — média ≤
   5,4 ou a válvula 6→4 entra AQUI. `npm test`.
4. **O gesto.** `MUTIRAO_HOLD_MS`, parada da personagem, 1 ponto/s no mais próximo,
   `burst()` por parcela, microdica. Smoke: 2 s de segurar na faixa gera pontos e ≤ 1
   golpe; fora da faixa, o toque segue como hoje (regressão). `npm test`.
5. **A régua DEPOIS.** Repetir `--acervo` e as células de renda (Δ ≤ ±10%); rodar
   `--simular` e colar a tabela de estratégias; FPS 3×; estoque ao fim do cap. 2.
   Tudo no `NOTES.md`; `JOGABILIDADE.md` ganha o parágrafo do lugar vivo fase 2 por
   código; se a decisão de dobrar E3 disparar (§1.4), é commit próprio com a medição
   que a disparou. `npm test`.
