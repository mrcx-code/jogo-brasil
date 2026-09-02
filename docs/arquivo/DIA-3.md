# DIA-3 — especificação executável dos quatro buracos aprovados

> Escrita pela **Direção de Evolução** em 2026-08-11, a partir dos cinco buracos que o dono
> aprovou. Quatro deles são o mesmo assunto — *o jogo tem um dia 3?* — e por isso vêm juntos.
> Isto **não é código**: é o desenho que a implementação segue lendo, com número, nome de
> função, linha de arquivo e campo de save.
>
> **As leis que regem tudo abaixo, e nenhuma delas é negociável aqui:**
> o **§2 inteiro** do `CLAUDE.md` (representação decide-se com o dono; as travas da travessia
> continuam de pé) · a **trava de composição** (média de objetos em cena **4,7–5,4**, medida
> pelo `test/medir-poluicao.js`) · **qualquer mudança de economia exige medição antes/depois**
> (±10% de renda/min) · **zero imagem nova** sem decisão do dono · **FPS ≥ 58** no smoke ·
> a **CSP não abre por conveniência** (§3.2) · e a **porta de entrada não pode voltar a
> crescer** (hoje `index.html` = **1.621.122 bytes**, 6,30 s até o primeiro toque num 3G).
>
> A numeração é a **do dono** (1, 2, 3, 5). O buraco 4 não está neste documento.

---

## O que já existe e responde parte disto sem uma linha nova

Antes de propor qualquer coisa, o que o repositório já tem e que ninguém está usando:

| já existe | onde | o que resolve |
|---|---|---|
| `S.acolhidos[]` por época, no save, teto 9.999 | `src/jogo.ts` l. 247, 1182, 2301 | quem você acolheu **atravessa dias**. É o único estado do jogo que é *gente*. |
| `moradores[]` — até 6 figuras vivendo na faixa final | l. 6100–6129 | o lugar que ficou, já desenhado, já com sprite |
| `mostrarRetorno()` + `notaDaVolta()` | l. 2547 e 2614 | a superfície da volta, com a regra de índice por `R.dias` já escrita e **sem estado novo de propósito** |
| `R.dias` · `R.volta` · `R.chegou` | `ESQUEMA_RET`, l. 2697 | a régua de retenção, validada campo a campo |
| nove eventos anônimos, já no ar desde 10/08 | l. 2927 · `medir()` | **a linha de base do "antes" já está sendo colhida**. Nenhuma medição abaixo precisa esperar instrumento novo para ter com o que comparar. |
| `S.cuidado` — a média móvel que **desce** | l. 303–322 | a perda já existe no motor, e já governa a paisagem inteira |
| `RETRATO_B64[]` por capítulo | l. 5204 | rosto por capítulo, sem arte nova |
| carga sob demanda, com recuo provado | `garantirPacote`, l. 6751 | contrato pronto de "não chegou, o jogo segue" |

E uma pendência que ninguém fechou: **`MUTIRAO.md` (09/08) está escrito, medido e parado no
§6 — "o que vai ao dono antes do primeiro pixel" nunca foi enviado.** Ele responde a metade
LOCAL do buraco 2 (o coletivo) sem uma linha de rede, e não aparece no `PENDENTES.md` nem no
Diário. Ou vai ao dono junto com este documento, ou é descartado por ele. Ficar onde está é a
pior das três.

---

# BURACO 1 — O FIO QUE SÓ EXISTE VOLTANDO

> *"Dia 1 é novidade. Dia 2 ganhou o bilhete de história. **Dia 3 é idêntico ao dia 2.**"*
> Aprovado: alguém que você acolheu no dia 1 tem uma frase nova no dia 3.

## 1.1 O que aparece na tela

O **papel da volta** (`#retorno`), que já abre sozinho quando a pessoa volta com mais de um
minuto fora. Ele hoje tem quatro linhas e uma nota de história. Ganha um **quinto bloco**, no
fim, depois da nota: o **RECADO DE QUEM FICOU**.

```
ENQUANTO VOCÊ ESTEVE FORA
  Você ficou fora por 14h20.
  Dia 3 de travessia — o caminho te conhece: tudo vale ×1,10.
  3 pessoas continuam andando com você.
  7 pessoas acolhidas vivem no lugar que vocês abriram.
  A estrada esperou. O que chega, chega para quem está aqui.
  ┌──────────────────────────────────────────┐
  │ [retrato]  a cerca do lado leste subiu    │   ← O BLOCO NOVO
  │            enquanto você não estava.      │
  └──────────────────────────────────────────┘
  toque para seguir ▾
```

O bloco é **papel sobre papel** — a mesma gramática do `.retNota` que já está ali — com o
**retrato do capítulo 2** à esquerda, no tamanho do balão do quadrinho. **Nenhum material
novo, nenhuma cor nova, nenhuma classe de dialeto próprio.** É a régua do menu (`DIRECAO.md`)
aplicada sem invenção.

**Nunca leva a linha `fonte:`.** O `notaDaVolta` logo acima leva, porque ele é história com
procedência; este não é história, é a voz do mundo. Manter as duas naturezas visualmente
separadas na MESMA folha é a contramedida de §2 mais importante deste buraco — é a mesma
separação que o repositório já faz entre `TEXTOS` (proibido conter dígito) e `FONTES`
(obrigada a ter ano e número).

## 1.2 O gesto exato

**Nenhum gesto novo.** O papel já abre sozinho e já fecha num toque (`fecharRetorno`, l. 2639),
e esse mesmo toque já dispara o amanhecer da onda 5. O recado nasce e morre dentro de um
gesto que a pessoa já faz.

## 1.3 O que nasce em código e o que já existe

| peça | estado |
|---|---|
| `mostrarRetorno()` chamando mais uma função no fim | **existe** — l. 2578 já chama `notaDaVolta(lista)` |
| `recadoDeQuemFicou(lista)` — função nova, ~45 linhas | **nova**, colada ao lado de `notaDaVolta` |
| `RECADOS[]` — 5 frases | **nova**, ~500 bytes |
| a porta: `S.acolhidos[CAP_GENTE] > 0 && R.dias >= 3` | **existe** (l. 2102, 2571) |
| o índice: `(R.dias - 3) % RECADOS.length` | **novo, e sem campo de save** — mesma decisão deliberada do `notaDaVolta` (l. 2608–2613): reler um recado não é castigo, e um campo a mais custa mais do que resolve |
| o retrato | **existe** (`RETRATO_B64[1]`) |
| CSS do bloco | **deriva** do `.retNota`; ~15 linhas |

**A armadilha, e ela é real:** o retrato do capítulo 2 mora no `pack-palmares.json` e só é
buscado quando a pessoa **entra** no capítulo (`garantirEpoca`, l. 6789). O papel da volta abre
no **boot**, antes disso — então numa carga nova o retrato ainda é o GIF 1×1 que o build deixa
no lugar. **Conserto, e ele já é o contrato da casa:** o recado chama `garantirPacote("palmares")`
ao nascer e desenha o rosto **se e quando** ele chegar; se não chegar, o bloco é só papel com a
frase. É exatamente a regra (a) da carga sob demanda — *o jogo nunca fica sem chão* — aplicada a
uma superfície nova, sem exceção nova.

## 1.4 O que custa

| | |
|---|---|
| **peso** | ~1,5 KB no `index.html` (5 frases + ~45 linhas + CSS). **0,09% da porta de entrada.** Zero imagem, zero pacote novo, zero requisição nova. |
| **objetos em cena** | **ZERO.** É uma tela; `body.emTela` já suprime float (onda "composição do quadro", regra 2). A trava 4,7–5,4 nem é tocada. |
| **arte do dono** | **nenhuma.** |
| **rede** | nenhuma (a chamada ao pacote de Palmares já aconteceria de todo modo na entrada do capítulo). |

## 1.5 Como medir se funcionou — número, não impressão

**A régua principal, e ela não custa instrumento nenhum:**

> `voltou{dia:3}` ÷ `voltou{dia:2}` — a fração de quem volta no dia 2 e ainda volta no dia 3.

O evento `voltou` está no ar desde 10/08 com a propriedade `dia`. **Colher duas semanas de
linha de base ANTES de escrever a primeira linha de código** e comparar com duas semanas depois.
É a única medição deste documento que responde literalmente à pergunta do repositório.

**A régua secundária, e ela custa uma linha:** para saber se a mudança veio DO RECADO e não do
acaso, o evento `voltou` ganha `fio: true` quando o bloco de fato apareceu (a pessoa tinha
acolhido). Isso separa a coorte que viu da que não viu — e a que não viu é o grupo de controle
que já existe de graça. Custo: **um nome na lista branca** do `test/encaixe.js` bloco 17
(`PERMITIDAS`, l. ~948) e **uma linha na lista de eventos do `CLAUDE.md` §3.2**.

Alvo declarado antes de medir, para não se enganar depois: **se `dia3/dia2` não subir pelo
menos 5 pontos percentuais em quatro semanas, o fio não funcionou** e o dia 3 continua sendo o
problema — e aí o próximo passo é conteúdo, não texto.

## 1.6 O risco de §2, e a contramedida no desenho

**R1 — inventar a biografia de uma pessoa de Palmares.** Dar vida interior, história e trauma a
alguém que fugiu da escravidão é ficção se apresentando como história, e o §2 é explícito:
*"Sem fonte, é ficção — e então não se apresenta como história."*
**Contramedidas, todas no desenho:** o recado **nunca conta uma vida — conta o TRABALHO e o
LUGAR, no presente** ("a cerca do lado leste subiu", "a roça pegou depois da chuva"); **nenhum
dígito, nenhuma data, nenhum nome de povo** (a mesma régua que o bloco 15 do `encaixe.js` já
cobra das falas de capítulo em obra, e que deve ser estendida a `RECADOS[]` no mesmo commit);
**nenhuma linha `fonte:`**, porque ele não afirma história; e o assunto é sempre **o que foi
construído**, nunca o que foi sofrido — Palmares eram *"vilas, com roça, comércio e defesa"*,
e isso o próprio jogo já afirma com fonte na abertura do capítulo.

**R2 — a pessoa acolhida vira coisa que te dá recompensa.** Se o recado ler como *"acolha mais
para ganhar mais frases"*, gente virou moeda — o §2.2 literal.
**Contramedidas:** o recado **não escala com o número** (7 acolhidas ou 700 dão o mesmo bloco,
uma frase); **não há contador, não há progresso, não há "faltam N"**; e ele **não é recompensa
por acolher, é consequência de VOLTAR** — a porta é `R.dias`, não `S.acolhidos`, que só decide
*se* há alguém para falar.

**R3 — nome próprio.** Um nome dá dignidade (a régua do §2.4: *"gente com rosto e nome
possível, nunca massa anônima"*) e ao mesmo tempo é **exatamente** a decisão que o §2 tira das
minhas mãos. **Contramedida: não decido.** Vai ao dono (§5 deste documento) com um padrão
seguro — **sem nome, com rosto** — que já é uma melhora sobre o silêncio de hoje e não fica
esperando ninguém.

---

# BURACO 2 — O NÚMERO COMPARTILHADO

> *"Quilombo, mutirão, ganhadeiras, brigada — tudo coletivo. E a pessoa joga sozinha e
> offline."* Aprovado: um número compartilhado. E: *"gostei da provocação, podemos explorar
> mais isso."*

Este buraco tem **dois lados com preços opostos**, e confundi-los é o erro que faria a proposta
inteira parecer cara. Eles se separam assim:

## 2.A O LADO QUE ESCREVE — custa quase nada, e tem prazo de maturação

### O que sairia do aparelho, exatamente

**Nenhuma requisição nova. Nenhum evento novo. Uma propriedade inteira a mais num evento que já
sai hoje.** O `parou` (l. 2991) já dispara uma vez por afastamento, no `pagehide`, com
`keepalive`. O corpo dele hoje e depois, palavra por palavra:

```jsonc
// HOJE                                    // DEPOIS
{                                          {
  "api_key": "phc_…",                        "api_key": "phc_…",
  "event": "parou",                          "event": "parou",
  "distinct_id": "<32 hex sorteados>",       "distinct_id": "<32 hex sorteados>",
  "properties": {                            "properties": {
    "$ip": null,                               "$ip": null,
    "$process_person_profile": false,          "$process_person_profile": false,
    "$lib": "brasil",                          "$lib": "brasil",
    "capitulo": 1,                             "capitulo": 1,
    "nome": "PALMARES",                        "nome": "PALMARES",
    "minutos": 34,                             "minutos": 34,
    "sessao": 412,                             "sessao": 412,
    "dia": 3                                   "dia": 3,
                                               "acolheu": 12        // ← ISTO, E NADA MAIS
  },                                         },
  "timestamp": "…"                           "timestamp": "…"
}                                          }
```

`acolheu` é **um inteiro pequeno: quantas pessoas foram acolhidas NESTA carga de página**. Não é
o total do save, não é uma lista, não tem quando nem onde. Um número que, sozinho, não distingue
duas pessoas.

**O que isso custa:**

- **CSP: nada.** O destino é o mesmo `https://us.i.posthog.com` que já está aberto.
- **`MEDIDA_TETO` (40 por carga): nada** — não há requisição nova. *E é por isso que a contagem
  vai no `parou` e não num evento por acolhimento: acolher acontece dezenas de vezes por minuto,
  e um evento por acolhida estouraria o teto de quarenta em menos de um minuto de jogo.*
- **Lista branca:** um nome (`acolheu`) em `test/encaixe.js` bloco 17. Uma linha.
- **`CLAUDE.md` §3.2:** a lista de nove eventos ganha a menção da propriedade. Uma linha.
- **Peso:** ~200 bytes.

### O prazo de maturação — e é a razão de este lado vir primeiro

**Um número compartilhado só é verdadeiro depois de existir gente contada.** Publicar o lado que
lê antes de o lado que escreve ter uma semana de dados é publicar um zero, ou pior, um número
inventado. **O lado A embarca junto com o buraco 1 e fica colhendo em silêncio; o lado B só
aparece na tela uma semana depois.** Isso não é atraso: é a única ordem honesta.

## 2.B O LADO QUE LÊ — e aqui a conta fica cara

A chave que o jogo carrega é `phc_`, **publicável e de escrita apenas**. Ela manda evento e não
lê nada — por construção, e o `ferramentas/construir.js` recusa construir se ela deixar de
começar com `phc_`. **Não existe rota em que o navegador leia o PostHog.** Então há três rotas, e
só três:

### Rota A — arquivo estático no PRÓPRIO domínio ⭐

Um `numero.json` ao lado dos `pack-*.json`, buscado por caminho relativo, exatamente como a arte
dos capítulos.

```jsonc
{ "dia": "2026-08-14", "acolhidas": 18432, "aparelhos": 217 }
```

- **CSP: NÃO ABRE NADA.** `connect-src 'self'` já cobre — é o mesmo destino que já serviu o
  próprio jogo. **É a única rota das três em que a frase do §3.2 continua verdadeira palavra por
  palavra.**
- **O que sai do aparelho nesse GET:** nada do jogo. Um pedido HTTP para o servidor que **já
  serviu a página** — os mesmos bytes que qualquer carga de imagem já manda para ele. **Nenhum
  destino novo aprende nada sobre ninguém.** Este é o argumento inteiro a favor da rota A.
- **O recuo já existe:** pacote que não chega não quebra a partida (regra (b) da carga sob
  demanda). Número que não chega = a linha simplesmente não aparece.
- **⚠ O build recusaria isto hoje, e é de propósito.** `ferramentas/construir.js` l. 219–238
  **conta todos os `fetch(` da saída** e exige que cada um seja uma de duas formas exatas
  (`fetch(caminhoPacote(nome))` ou `fetch(ENDERECO_MEDIDA, {…})`), e casa a função
  `caminhoPacote` **byte a byte** contra `return "pack-" + nome + ".json";`. Um terceiro caminho
  de rede **falha a construção** até a trava ser estendida — e ela tem de ser estendida **no
  mesmo commit**, com a terceira forma escrita por extenso, senão a garantia "o único endereço
  alcançável é o do próprio domínio" passa a valer para dois caminhos de três.
- **Quem escreve o arquivo:** aqui a rota se abre em três.
  - **A1 · À MÃO, no build, uma vez por semana.** Zero segredo, zero serviço, zero cron. O
    número tem até sete dias, e a tela diz isso. **É o primeiro pixel.**
  - **A2 · Job agendado** (GitHub Action) que lê o PostHog com **chave pessoal** e commita o
    arquivo; a Vercel republica sozinha. Introduz **um segredo e uma variável de ambiente** —
    que o §8 diz não existir — mas **fora do navegador**, que é exatamente onde chave de serviço
    tem de viver. Número de até 24 h. **Decisão do dono.**
  - **A3 · Função na Vercel.** É backend. O `CLAUDE.md` manda parar e perguntar. **Não recomendo.**

### Rota B — Supabase

Já está no plano de arquitetura (§3: *"Supabase para sincronizar save e leaderboard"*) e a chave
`anon` dele é publicável por construção, igual à `phc_`. Um `rpc` de leitura devolve o número **ao
vivo**.

- **CSP: abre UM host** — `https://<ref>.supabase.co` em `connect-src`. A tabela pregada em
  `construir.js` ganha uma segunda linha e `MEDIDA_HOST` deixa de ser uma constante só.
- **E o preço que não está na CSP:** passa a existir um **segundo destino que aprende o IP de
  quem joga**. Hoje o `$ip: null` do PostHog é o que faz a linha "SEM IP" da tela de AJUSTES ser
  verdadeira; num host novo essa garantia teria de ser construída de novo, e a tela teria de
  **listar dois destinos**, porque "uma contagem anônima" no singular deixaria de ser verdade.
- **E o abuso:** endpoint anônimo de escrita é endpoint que quem abrir o código-fonte enche de
  números falsos. Contramedida possível (escrever pelo PostHog, ler pelo Supabase) resolve, ao
  custo de duas infraestruturas para um número.
- **Só vale quando o Supabase chegar por outro motivo.** Abrir a CSP por um contador é o começo
  de não ter CSP.

### Rota C — sem número compartilhado

O número é só o do aparelho ("você já acolheu N"). Grátis, honesto — **e não responde ao pedido
do dono.** Fica listada para ele poder recusar as outras duas com uma saída nomeada.

## 2.1 O que aparece na tela

**Dois lugares, e nunca mais que dois.**

**(a) O papel da volta**, uma linha imediatamente sob a que já existe — e é aqui que a
provocação vira jogo, porque a linha solitária ganha a coletiva ao lado:

```
  7 pessoas acolhidas vivem no lugar que vocês abriram.
  E ontem, no Brasil inteiro, outras 18.432 foram acolhidas.     ← NOVO
```

**(b) A CHEGADA**, uma linha entre o placar e a pergunta *"você voltaria amanhã?"*:

```
  ontem, 217 pessoas jogaram este jogo. você não atravessou sozinho.
```

Nada mais. Sem posição, sem "você está acima da média", sem barra, sem meta.

## 2.2 O gesto exato

**Nenhum.** Os dois lugares são superfícies de leitura que já abrem sozinhas.

## 2.3 O que a tela de AJUSTES passaria a dizer

Isto **não é formalidade** — é o §3, e a frase já mudou duas vezes no dia em que a rede mudou.
Hoje a tela diz (l. 9243–9258):

```
O QUE VOCÊ JOGOU FICA NESTE APARELHO.
O JOGO SÓ BAIXA A ARTE DELE.
E MANDA UMA CONTAGEM ANÔNIMA:
QUE ALGUÉM ABRIU, ATÉ QUE CAPÍTULO
FOI, E SE VOLTOU NO DIA SEGUINTE.
…
```

**Com a rota A**, duas mudanças, e as duas no mesmo commit que ligar o número:

```
O QUE VOCÊ JOGOU FICA NESTE APARELHO.
O JOGO BAIXA A ARTE DELE E UM NÚMERO:          ← muda
QUANTAS PESSOAS FORAM ACOLHIDAS                ← nova
ONTEM, SOMANDO TODO MUNDO.                     ← nova
E MANDA UMA CONTAGEM ANÔNIMA:
QUE ALGUÉM ABRIU, ATÉ QUE CAPÍTULO
FOI, SE VOLTOU NO DIA SEGUINTE, E
QUANTAS PESSOAS VOCÊ ACOLHEU NUMA              ← nova
SESSÃO — O TOTAL, NUNCA QUEM.                  ← nova
…
```

**Com a rota B**, tudo isso **mais** o nome do segundo destino, porque a tela passa a descrever
dois lugares para onde vai byte e não um. É o que torna a rota B cara em texto, não só em CSP.

O `test/encaixe.js` **bloco 8** amarra estas frases à CSP e reprova se uma andar sem a outra —
ele ganha as asserções novas no mesmo commit. E a regra de escrita continua: **nenhuma palavra
de programador.** Não se diz "endpoint", não se diz "agregado", não se diz "telemetria".

## 2.4 O que custa

| | rota A1 (recomendada) | rota B |
|---|---|---|
| **CSP** | **nada abre** | um host novo, permanente |
| **peso** | ~1 KB de código + o `numero.json` (~120 bytes) | ~2 KB + o cliente de leitura |
| **objetos em cena** | **ZERO** (duas telas) | ZERO |
| **arte do dono** | nenhuma | nenhuma |
| **credencial no cliente** | nenhuma nova | a `anon` do Supabase |
| **segredo fora do cliente** | nenhum em A1; um em A2 | um projeto novo |
| **frescor do número** | até 7 dias (A1) · 24 h (A2) | ao vivo |
| **trava do build** | estender a contagem de `fetch(` — obrigatório | estender a tabela de CSP |

## 2.5 Como medir se funcionou

- **A pergunta direta:** `voltou{dia:3}`÷`voltou{dia:2}` antes e depois — a mesma régua do
  buraco 1, e por isso os dois **não devem embarcar no mesmo dia** se quisermos saber qual moveu
  o número. (Ver §6, a ordem.)
- **A pergunta do coletivo:** a **fração de eventos `parou` com `acolheu > 0`**, antes e depois
  de a linha do coletivo aparecer. Se ver o número dos outros faz alguém acolher mais, é aqui
  que se vê — e não custa instrumento nenhum além da propriedade do lado A.
- **E o achado que vale registrar:** o denominador do número compartilhado **é** a contagem de
  quem jogou. **O número compartilhado é, ele mesmo, o instrumento** — para publicá-lo é preciso
  saber quantas pessoas o jogo teve, que é a pergunta de três dias vista de cima.

## 2.6 O risco de §2, e a contramedida no desenho

**R1 — o número do jogo passar por fato histórico.** O repositório inteiro se sustenta na
separação entre `TEXTOS` (ficção, proibido conter dígito) e `FONTES` (obrigada a ter ano e
número). Um número grande de cinco dígitos numa folha de papel de campo lê como dado.
**Contramedidas:** o número **nunca aparece em papel com `fonte:`**, **nunca carrega data
histórica**, e **sempre traz o verbo do jogo** — *"foram acolhidas neste jogo"*, nunca *"foram
acolhidas"*.

**R2 — ranking.** *"Quem acolheu mais"* transformaria pessoas em placar, que é o §2.2 literal, e
transformaria a CHEGADA em troféu, que três ondas de direção existiram para impedir.
**Contramedidas:** é uma **soma, jamais uma posição**; **nunca comparado com o seu número**;
sem melhor, sem recorde, sem "top".

**R3 — meta.** *"Faltam 12.000 para um milhão de pessoas acolhidas"* gamifica acolhimento de
gente, que é o mesmo veneno de R2 com roupa de barra de progresso. **Contramedida: nenhuma meta,
nenhuma barra, nenhum marco.** O número é o que foi, nunca o que falta.

**R4 — o número virar propaganda.** *"Já somos 200 mil!"* é panfleto, e o §1 pede mão leve.
**Contramedida:** uma linha, na voz do resto do papel, sem exclamação e sem adjetivo.

---

# BURACO 3 — O QUE VAI EMBORA, E A DUREZA DA ÉPOCA

> Aprovado: *"o que você não alcança vai embora, e o mundo mostra"*, **mais** o acréscimo dele:
> *"talvez o personagem passar por dificuldades dado a época que essas pessoas viviam."*

## 3.0 ⚠ A LINHA — onde exatamente eu a pus, e por quê

Esta é a parte do documento que o dono vai ler primeiro, e ela vem antes do desenho de
propósito.

> ## O jogo pode MOSTRAR a dureza. A mão da pessoa nunca ADMINISTRA o sofrimento de ninguém.

É a mesma distinção que o §2.4 já faz — *mostrar* × *fazer* —, aplicada à mecânica de mundo. E
para ela não virar uma frase bonita que cada sessão interpreta ao seu gosto, ela se opera por
**três testes. Falhar um só já reprova.**

**1 · TESTE DO MOSTRADOR.**
A dureza virou uma **barra, um medidor ou um estoque** que se esvazia e que a pessoa tem de
reabastecer para alguém não sofrer? → **fora.**
*Por quê:* é o §2.4.2 ao pé da letra — *"sem barra de água, ar ou ração; transformar a
mortalidade em recurso a administrar é a linha"*. A trava foi escrita para o porão, mas **a
razão dela não é o porão: é a FORMA.** A mesma barra com outro rótulo, em outro século, é a
mesma coisa.

**2 · TESTE DO SUJEITO.**
A dureza recai sobre **terceiros**, e o dedo da pessoa alivia — ou deixa de aliviar — o
sofrimento deles? → **fora.** É o §2.4.3: o poder do senhor invertido em fantasia de cuidado.
Recai sobre a **protagonista**, e o que ela perde é **alcance, tempo ou ritmo**? → **dentro.**

**3 · TESTE DA FONTE.**
A dureza **afirma um fato** — seca, cerco, epidemia, fome? → precisa de **fonte no `NOTES.md` no
mesmo commit**. Sem fonte, ela é **chão e clima**, e então **não pode carregar número nem data**.

**E o corolário que decide os casos difíceis de uma vez:**

> **Dureza entra como CHÃO e como TEMPO. Nunca como MOSTRADOR.**
> Ladeira de pedra que tira a corrida é **chão**. Noite que encurta o alcance é **chão**.
> Chuva que atrasa a colheita é **tempo**. Barra de água é **mostrador** — e é a linha.

Três casos concretos, resolvidos pela régua, para não haver dúvida sobre onde ela cai:

| proposta | veredito | qual teste |
|---|---|---|
| a ladeira de Salvador tira a corrida | **dentro** | recai sobre ela · é chão · a ladeira está no texto do capítulo |
| cansaço da protagonista que se recupera parando | **fora** | teste 1 — é mostrador, mesmo sem barra desenhada |
| fome no quilombo que se alimenta com refeições coletadas | **fora** | testes 1 e 2 — dureza de terceiros administrada pelo dedo |
| a noite reduz o alcance do golpe | **dentro** | recai sobre ela · é chão · não afirma fato |
| epidemia que reduz o número de moradores na faixa final | **fora, sem apelação** | teste 2 — e morte de gente como número que desce é o pior caso deste repositório |

## 3.1 O que já é verdade, medido no código

A afirmação *"todo verbo é alcançou, ficou; não existe marcha à ré"* é **meio verdadeira**, e
vale precisar qual metade:

- **Só crescem:** `S.energiaTotal`, `S.fronteira`, `S.acolhidos[]`, `S.aberturas`, `S.fechos`,
  `S.marcos`, `S.travessias`, `R.dias`.
- **Desce — e é o único:** `S.cuidado` (l. 309–311). Cada chegada alcançada puxa para 1, cada
  uma que atravessa inteira puxa para 0. Ele multiplica `worldHealth()` (l. 317), que governa a
  densidade da mata, a secura da terra e a lavagem da cor.

Ou seja: **a perda já existe, e o mundo já mostra.** O que falta é o **instante**. Com
α = 0,18 (memória de ~5,5 chegadas) e τ = 1,6 s no desenho, a paisagem responde em **10 a 30
segundos** — devagar demais para alguém ligar a mudança a **um** gesto que não fez. O jogo já
perde; ninguém percebe **quando**.

## 3.2 O que aparece na tela — duas propostas, e a trava de objetos decide

**(3a) A MARCA DE PASSAGEM ⭐ — o que passou reto deixa rastro no chão**

Quem atravessa a tela inteira sem ser alcançado deixa uma **marca na pintura do chão**, atrás da
personagem: pegada na terra, risco de roda, folha derrubada — conforme o que era. A marca é
desenhada **por código, determinística por hash da posição** (o mesmo `hash01` que já semeia a
vegetação e as texturas do grão do chrome, onda 11), e **desvanece conforme `cuidadoVisto` volta
a subir**. Voltar a alcançar limpa a estrada; ignorar a enche.

- **É o instante que faltava**, e ele é *reversível por construção* — a mesma simetria que o
  comentário do `S.cuidado` já defende: *"não existe estado do qual não se sai; distração de uma
  sessão não vira punição permanente."*
- **Custo em objetos: ZERO.** A marca **não é entidade**: não é mob, não é drop, não é folha, não
  é float, não é placa — e são exatamente esses cinco que o `test/medir-poluicao.js` conta. A
  média de 4,7–5,4 **não se move um décimo**.
- **Custo em arte: zero.** Desenho por código, como o grão do chrome.
- **Custo em peso:** ~2 KB.

**(3b) O ÚLTIMO QUADRO — quem sai de quadro sai olhando para trás**

Um quadro de sprite, no último instante antes da borda. **Custo em objetos: zero** (é o mesmo
mob). **Custo em arte: um quadro por bloco de sprite — depende do dono**, e por isso não é o
primeiro pixel. Fica anotada como a evolução natural de 3a no dia em que houver arte.

**(3c) A DUREZA DA ÉPOCA — o chão de cada capítulo passa a ter um traço próprio**

O acréscimo do dono, resolvido pelos três testes: **o chão custa RITMO, nunca vida.** O primeiro
caso está pronto e já escrito no próprio texto do jogo — SALVADOR é *"a cidade alta, a ladeira de
pedra, e lá embaixo o porto"*: **na ladeira não se corre.**

⚠ **E isto é mudança de economia, com duas armadilhas conhecidas:**
1. **A trava do dono cobra medição antes/depois** — renda/min nas seis células do
   `medir-poluicao.js`, dentro de ±10%.
2. **A armadilha nº 4 do §7:** velocidade tem de ser `PASSO × 60 / n` com **`n` inteiro**, senão
   a cadência sai 2-2-3-2-2-3 e lê como trepidação. **A ladeira não pode ser um multiplicador
   contínuo** — tem de ser um **degrau para o `n` inteiro seguinte**. Quem implementar sem ler
   isto vai gastar uma sessão descobrindo de novo.

Por isso 3c é a última coisa deste documento a ser construída, e a única que exige duas rodadas
de instrumento.

## 3.3 O gesto exato

**Nenhum novo em 3a e 3b.** Em 3c, o gesto de correr já existe e continua igual — o que muda é
o que o chão devolve.

## 3.4 Como medir se funcionou

| número | instrumento | régua |
|---|---|---|
| `S.cuidado` em regime (a fração alcançada) | `test/medir-poluicao.js` (já mede as seis células) | tem de **subir** se a marca ensina; se não mudar, o rastro não está sendo lido |
| renda/min nas seis células | idem | **±10%**, a trava do dono |
| média de objetos em cena | idem | permanece **4,7–5,4** |
| FPS | smoke, 3 rodadas | **≥ 58** |
| prints antes/depois da rua com cuidado alto e baixo | `test/prints-composicao.js` | olhados de verdade — o teste garante que não quebrou, não que ficou bom |

## 3.5 O risco de §2, e a contramedida no desenho

**R1 — a marca virar punição contábil.** Um "−1" no ar, um contador de perdidos, um som de
erro: qualquer um deles transforma quem passou reto em recurso perdido — o §2.2 exato, e o
comentário do `registrarChegada` já o proíbe por escrito: *"descontar pontos por isso
transformaria pessoas em recurso perdido"*. **Contramedidas:** **sem número, sem som, sem
texto, sem float**; a marca é **pintura**, e some sozinha.

**R2 — no capítulo 2, quem passa reto é GENTE.** Um rastro que diga "esta pessoa se perdeu" é
inaceitável. **Contramedida: a marca é do CAMINHO, nunca da pessoa** — pegada na terra, e a
leitura é *"passou alguém por aqui e a estrada seguiu sozinha"*, que é verdade e não é acusação.
E ela é a mesma marca em todos os capítulos, para não haver gramática especial onde há gente.

**R3 — a dureza escorregar para sofrimento administrado.** É o risco inteiro do 3c, e é para ele
que os três testes do §3.0 existem. **Contramedida estrutural: nenhuma dificuldade nova entra
sem passar pelos três testes escrita no commit** — e a resposta de cada teste vai no `NOTES.md`,
como as fontes já vão.

---

# BURACO 5 — A PROTAGONISTA NÃO QUER NADA

> *"Sem nome, sem desejo, sem motivo — uma câmera com pernas."*
> Aprovado: **uma linha de querer por capítulo, dita por ela.**

## 5.1 O que aparece na tela

A **última fala da abertura** de cada capítulo **escrito**, e ela é a **única em primeira
pessoa** — o que a torna legível como *ela* sem um único recurso novo.

Hoje a abertura de PALMARES termina assim (voz expositiva, l. 1765):

> *"Aqui não vem coisa pela estrada: vem gente. Quem você alcança vira e passa a andar com você…"*

Depois, uma fala a mais, com **o retrato do capítulo à esquerda** e a gramática do balão que o
quadrinho já usa:

> ⌐ *"Eu quero a cerca do lado leste de pé antes da chuva."*

**Nenhum material novo.** Papel de campo para a fala, retrato de `RETRATO_B64[arteCap]`, a mesma
caixa de fala que já tem fundo de tela cheia desde a onda 9.

## 5.2 O gesto exato

**Nenhum novo.** É a última fala da abertura, e o toque que avança falas já existe — inclusive o
`btnFalaPular`, que continua funcionando (não é pedágio).

## 5.3 O que nasce em código e o que já existe

| peça | estado |
|---|---|
| campo `querer: "…"` em `EPOCAS[]` | **novo**, 4 entradas (só os capítulos escritos) |
| a fala entrar como último item de `abertura` | **existe** — é o mesmo laço |
| retrato por capítulo | **existe** (`RETRATO_B64`, l. 5204) |
| a marca "esta fala é dela" (classe CSS + retrato) | **deriva** do balão do quadrinho, ~15 linhas |
| **capítulo em obra NÃO ganha linha** | regra nova, uma condição |

## 5.4 O que custa

| | |
|---|---|
| **peso** | ~1 KB (4 frases + ~30 linhas + CSS). |
| **objetos em cena** | **ZERO** — é a caixa de fala, e sob `body.emTela` nem float nasce. |
| **arte do dono** | **nenhuma** — os retratos dos quatro capítulos escritos já existem. |
| **rede** | nenhuma. |

## 5.5 Como medir se funcionou

**Zero instrumentação nova, e o número já está sendo colhido:**

> **`parou{capitulo:X}` ÷ `capitulo{n:X}`** — a fração de quem chega num capítulo e **desiste
> nele**. Por capítulo, antes e depois.

Se dar um querer a ela segura alguém, é neste quociente que aparece, capítulo a capítulo. E os
capítulos **em obra** (que não ganham linha) são o grupo de controle que já existe de graça.

Opcional, **e não recomendo no primeiro pixel:** uma propriedade `abertura: "lida"|"pulada"` no
evento `capitulo` diria se a linha foi sequer vista. Custa uma linha na lista branca; espera o
quociente acima dizer se vale.

## 5.6 O risco de §2, e a contramedida no desenho

**Este é o maior risco dos quatro buracos**, e a razão é simples: a protagonista de PINDORAMA é
uma mulher Tupinambá do século XVI; a de PALMARES é uma pessoa que fugiu da escravidão; a de
SALVADOR é uma ganhadeira. **Dar desejo a elas é caracterizá-las**, e o `LANCAMENTO.md` item 4
já diz que *quem representa cada capítulo* é **só do dono**.

**Contramedidas, todas no desenho — e ainda assim as quatro frases vão a ele:**

1. **O querer é de TRABALHO e de HOJE, nunca de destino histórico.**
   *Dentro:* "quero a roça de pé antes da chuva".
   *Fora:* "quero libertar meu povo" — põe na boca de uma pessoa do século XVI um projeto que é
   leitura nossa, e transforma uma vida em missão. É a mesma falha que o §2.1 proíbe: apresentar
   um povo como um estágio a caminho de outra coisa.
2. **Ela não antevê o próprio fim.** O fecho de PINDORAMA conta a invasão; a linha da abertura
   **não pode saber dela**. Ninguém vive antecipando a própria catástrofe, e escrever assim é
   escrever com o benefício do fim.
3. **Sem dígito, sem nome de povo que ela não seja, sem afirmação histórica.** A linha mora em
   `EPOCAS[].abertura`, que é ficção autoral — e o bloco 15 do `encaixe.js` já proíbe dígito ali
   para capítulo em obra; **a varredura passa a valer para o campo `querer` de todos**.
4. **Capítulo em obra fica em silêncio.** Um capítulo em obra não afirma nada — e **um querer é
   uma afirmação sobre quem ela é**. Nove dos treze capítulos ficam sem linha, e isso é a regra
   funcionando, não uma lacuna.
5. **Nenhuma das quatro entra sem o dono.** §5 abaixo.

---

# 5. O QUE VAI AO DONO ANTES DO PRIMEIRO PIXEL

*Texto pronto para copiar, em linguagem de quem não programa. São quatro perguntas e um
lembrete.*

---

> **1. A frase de quem ficou (o dia 3)**
>
> Hoje, quando você volta ao jogo, o papel diz quantas pessoas você acolheu e que elas vivem no
> lugar que vocês abriram. A partir do **terceiro dia** eu queria acrescentar **uma frase curta,
> dita por uma dessas pessoas** — sobre o trabalho e o lugar, nunca sobre a vida dela: *"a cerca
> do lado leste subiu enquanto você não estava"*, *"a roça pegou depois da chuva"*. Com o rosto
> que já existe no jogo ao lado, e sem inventar nenhum fato histórico.
>
> **O que preciso que você decida:**
> **(a)** sem nome — só o rosto e a frase *(é o que eu faria, e o que eu faço se você não
> responder)*
> **(b)** com um nome próprio, e você escolhe qual — eu levo uma lista de nomes documentados do
> período, com a fonte junto
> **(c)** não é uma pessoa que fala, é o povoado — *"a vila mandou dizer"*

---

> **2. O número compartilhado**
>
> Para o jogo mostrar *"ontem, no Brasil inteiro, N pessoas foram acolhidas"*, duas coisas
> mudam.
>
> **Uma sai do aparelho:** junto do que o jogo já manda (que alguém abriu, até que capítulo foi,
> se voltou no dia seguinte), passa a ir **um número a mais: quantas pessoas você acolheu numa
> sessão**. Só o total, nunca quem, nunca quando. **Nenhum endereço novo é usado** — vai para o
> mesmo lugar de sempre. **E a tela de AJUSTES passa a dizer isso com todas as letras**, no mesmo
> dia — como já mudou duas vezes antes.
>
> **Uma volta para o aparelho:** o jogo passa a baixar um numerozinho junto com a arte.
>
> **O que preciso que você decida — como esse número é calculado:**
> **(a) ⭐** eu gero o número **à mão, uma vez por semana**, e ponho no site junto com o jogo.
> **Nada muda na segurança do jogo, nenhum serviço novo, nenhuma senha em lugar nenhum.** O
> número é de até uma semana atrás, e a tela diz isso.
> **(b)** um robô do GitHub atualiza o número **todo dia de madrugada**. Fica mais fresco, mas
> passa a existir **uma senha guardada fora do jogo** — hoje não existe nenhuma.
> **(c)** número **ao vivo**, com um serviço novo (Supabase). É o mais bonito e o mais caro:
> abre um endereço novo que o jogo pode alcançar, passa a existir um segundo lugar que vê quem
> está jogando, e a tela de privacidade tem de listar os dois. **Eu só faria isso no dia em que
> o Supabase entrar por outro motivo.**

---

> **3. A linha da dureza — confirme onde eu a pus**
>
> Você pediu que o personagem passasse por dificuldades da época. Eu escrevi a régua assim:
>
> > **O jogo pode MOSTRAR o quanto era duro. A mão de quem joga nunca ADMINISTRA o sofrimento
> > de ninguém.**
>
> Na prática: **a dureza entra como CHÃO e como TEMPO, nunca como mostrador.** A ladeira de
> pedra de Salvador em que não dá para correr: **entra**. Uma barra de comida, de água ou de
> cansaço que você tem de encher para alguém não passar mal: **não entra, nunca** — é a mesma
> linha que a gente já traçou para a travessia, e a razão dela não é o navio, é a **forma**:
> transformar sofrimento em recurso a administrar.
>
> **Preciso só de um "ok" nisso**, porque é a régua que vai decidir sozinha dezenas de coisas
> daqui pra frente.

---

> **4. As quatro frases de querer**
>
> Hoje a personagem não quer nada — ela atravessa o jogo sem um motivo dito. Eu queria dar a
> ela **uma frase por capítulo, na voz dela, no fim da abertura**. E como é ela quem representa
> aquele povo e aquele tempo, **cada uma das quatro passa por você antes de entrar**. Só os
> quatro capítulos escritos: **PINDORAMA · PALMARES · SALVADOR · AINDA AQUI** — os que estão em
> obra ficam calados, como já ficam.
>
> Duas regras que eu já travei, e queria seu ok no conjunto:
> - **O querer é de trabalho e de hoje**, nunca de destino: *"quero a roça de pé antes da
>   chuva"*, nunca *"quero libertar meu povo"*.
> - **Ela não sabe o que vem depois.** A abertura de PINDORAMA não pode antecipar a invasão que
>   o fecho conta.

---

> **Lembrete:** o **MUTIRÃO** (as três obras no fim de Palmares — a roça, a paliçada e a casa)
> está inteiro desenhado desde 09/08, com as contas prontas, e **nunca chegou a você**. Ele
> responde a metade da sua provocação do coletivo **sem tocar em rede nenhuma**. O pedido está
> escrito em `MUTIRAO.md`, seção 6. **Mando junto ou descarto?**

---

# 6. A ORDEM QUE EU CONSTRUIRIA — e o motivo de cada posição

O que decide a ordem: **a porta de entrada está em 1.621.122 bytes e abre em 6,30 s num 3G, e
ela não pode voltar a crescer**; **arte nova depende do dono**; e **duas medições que usam a
mesma régua não podem embarcar no mesmo dia**, senão nenhuma das duas se sabe qual moveu o
número.

### 0 · A LINHA DE BASE, antes da primeira linha de código *(custo: uma tarde, zero código de jogo)*
Colher do PostHog `voltou{dia:2}`, `voltou{dia:3}`, `parou{capitulo}` e `capitulo{n}` das duas
semanas que já passaram, e **escrever os números no `NOTES.md`**. Sem isto, todo "depois" deste
documento é impressão. É a única etapa que não pode ser feita depois — o passado não volta.

### 1 · BURACO 1, o fio *(≈1,5 KB · zero arte · zero objetos)*
**Primeiro porque é a pergunta do repositório.** É o único dos quatro cuja ausência faz o dia 3
ser idêntico ao dia 2 — os outros três melhoram o jogo, nenhum deles cria um motivo para abrir
amanhã. E é barato: texto, numa tela que já existe, sem tocar a rua, sem tocar a economia, sem
tocar a trava de composição. A única decisão do dono tem **padrão seguro** (sem nome), então ele
não bloqueia.
**Embarca junto:** o **lado A do buraco 2** (a propriedade `acolheu` no `parou`) — invisível,
sem requisição nova, e **começa a maturar**. Não muda nada na tela, então não contamina a
medição do fio.

### 2 · BURACO 5, o querer *(≈1 KB · zero arte · zero objetos)*
**Segundo porque é o mais barato de todos e porque espera o dono.** As quatro frases vão a ele
**no mesmo envio** que a pergunta do buraco 1 — uma ida, não duas. Enquanto ele responde, o
buraco 1 já está no ar colhendo. E a medição dele (`parou{capitulo}÷capitulo{n}`) é **por
capítulo**, então não colide com a régua de dias do buraco 1: os dois podem estar no ar ao mesmo
tempo sem se confundirem.

### 3 · BURACO 2, o lado que lê — rota A1 *(≈1 KB · zero arte · zero objetos · CSP intacta)*
**Terceiro por prazo de maturação, não por valor.** O número só é verdadeiro depois de uma
semana escrevendo, e é exatamente uma semana o que os passos 1 e 2 levam. Publicar antes seria
publicar um zero.
**A primeira coisa a fazer aqui não é o número: é estender a trava do build** (`construir.js`
l. 219–238), que hoje **recusa um terceiro `fetch(`** — e recusa de propósito. A trava e o
caminho novo entram no mesmo commit, com a terceira forma escrita por extenso; e a tela de
AJUSTES muda no mesmo commit também, com as asserções do bloco 8.

### 4 · BURACO 3, a marca de passagem (3a) *(≈2 KB · zero arte · zero objetos)*
**Quarto porque é o único que toca a RUA.** Ali três travas cobram medição antes e depois — a
composição (4,7–5,4), a renda/min (±10%) e o FPS (≥58) —, o que custa duas rodadas de
`medir-poluicao.js` e prints olhados um a um. É trabalho honesto, mas é o dobro do tempo dos
anteriores para um ganho que não é de retenção, é de leitura do mundo.

### 5 · BURACO 3c, a dureza como chão *(depende do "ok" da régua · mexe em economia)*
**Último, e com folga.** É a única coisa deste documento que **muda a economia**, e mudança de
economia neste repositório exige medição antes/depois por decisão do dono. Some-se a armadilha
nº 4 do §7 (velocidade tem de dar quadro inteiro de tela por pose, senão a cadência manca) e
tem-se a única entrega aqui que pode custar uma sessão inteira sozinha. Ela não vai antes de a
régua do §3.0 estar confirmada por ele.

### Fora desta fila, esperando só o dono
**3b (o último quadro, olhando para trás)** e **as seis verticais dos marcos de 1888–1964** —
as duas dependem de arte, e arte é decisão dele. Ficam anotadas para o dia em que a fila de
geração abrir.

---

## O que este documento custa somado

| | |
|---|---|
| **peso** | **≈ 6,5 KB de código**, tudo texto e lógica. Sobre 1.621.122 bytes: **+0,40%**. A porta de entrada não se move de forma perceptível, e os 6,30 s do 3G continuam 6,30 s. |
| **imagem nova** | **zero.** |
| **pacote novo** | **zero.** |
| **objetos em cena** | **zero.** A média de 4,7–5,4 não é tocada por nenhum dos quatro — três vivem em telas e o quarto é pintura de chão, não entidade. |
| **CSP** | **nada abre**, na rota recomendada. |
| **credencial nova no cliente** | **nenhuma.** |
| **requisição nova por sessão** | **uma**, e para o próprio domínio (o `numero.json`). |
| **decisões do dono** | **quatro**, e três delas têm padrão seguro para não bloquear a fila. |
