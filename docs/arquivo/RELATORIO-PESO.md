# RELATÓRIO DO PESO

> ## ✅ FEITO em 10/08/2026 — e o que aconteceu foi melhor que a projeção
>
> A recomendação do §7 foi executada inteira: pacote por capítulo **com os sprites da época
> dentro**, `connect-src 'none'` → `'self'` e o smoke test fora do `file://`.
>
> | | projetado aqui | **medido depois** |
> |---|---|---|
> | abertura em Fast 3G | 8,7 s | **6,30 s** |
> | abertura em Slow 4G | 7,3 s | **5,30 s** |
> | arquivo | 1,96 MB | **1,51 MB** |
> | no fio | 1,33 MB | **0,98 MB** |
> | entrar em PALMARES | 3,2 s | 3,66 s |
>
> Melhor que a projeção porque o protótipo desta medição deixava os sprites de cada época no
> arquivo de abertura; a entrega os levou junto, que era exatamente o que o §3 pedia. O texto
> abaixo fica **como foi escrito em 09/08**, com o estado de então — é ele que explica por quê.
> O que se aprendeu FAZENDO está no `NOTES.md`, diário de 10/08.

**Medido em 09/08/2026.** Tudo aqui é número tirado da máquina, não estimativa.
Os instrumentos ficaram no repositório: `test/peso-composicao.js`, `test/peso-abrir.js`,
`test/peso-prototipo.js`, `test/peso-qualidade.js`, `test/peso-restante.js`,
`test/peso-projecao.js`, `test/peso-file-fetch.js`. Todos rodam sozinhos, nenhum toca em
`src/` nem no build.

---

## A frase, se você só ler uma

> **O jogo já demora 16,6 segundos para abrir num celular em 3G, e isso não é um problema
> futuro — passou dos 10 segundos lá no capítulo 2. Cortar arte não resolve mais; carregar
> a arte de cada capítulo só quando a pessoa chega nele resolve, corta a abertura pela
> metade e já foi provado funcionando.**

---

## 1. Quanto tempo o jogo leva para abrir (medido, nunca antes)

Chromium headless, tela 390×844, rede estrangulada pelos mesmos perfis do DevTools.
"Tela" = o menu desenhado. "Toque" = o jogo já aceita o dedo.

### Comprimido — é o que a Vercel entrega a quem baixa

| rede | no fio | tela útil | 1ª tinta |
|---|---|---|---|
| **Fast 3G** | 2,83 MB | **16,6 s** | 1,25 s |
| **Slow 4G** | 2,83 MB | **14,7 s** | 0,34 s |
| sem limite (Wi‑Fi bom) | 2,83 MB | 0,34 s | 0,05 s |

### Cru, sem compressão — é o Capacitor (o aplicativo Android) e o tempo de leitura

| rede | no fio | tela útil | 1ª tinta |
|---|---|---|---|
| **Fast 3G** | 3,96 MB | **23,3 s** | 1,52 s |
| **Slow 4G** | 3,96 MB | **20,8 s** | 0,84 s |
| sem limite | 3,96 MB | 0,58 s | 0,12 s |

**O que estes números dizem, em português:** o jogo não é lento. Abrir custa 0,34 s quando
o arquivo já está na máquina — ler e montar 4 MB é rápido. **Os 16,6 segundos são
integralmente espera de download.** É por isso que mexer em código, em qualidade de imagem
ou em otimização não muda quase nada: o gargalo é o tamanho, e só.

O detalhe cruel: a **1ª tinta** chega em 1,25 s. Ou seja, a pessoa vê alguma coisa rápido
e depois fica **15 segundos olhando uma tela que não responde ao toque**. Isso é pior do
que uma tela preta honesta.

---

## 2. De onde vem o peso

`node test/peso-composicao.js` — arquivo publicado: **3,96 MB**.

| bloco | peso | fatia |
|---|---|---|
| pintura de cenário (alto + chão) | 1.345 KB | 33,2% |
| contexto de fala (paisagem) | 610 KB | 15,0% |
| quadrinho — páginas d'A HISTÓRIA | 581 KB | 14,3% |
| sprites — personagem | 415 KB | 10,2% |
| sprites — objetos e vegetação | 254 KB | 6,3% |
| quadrinho — páginas da travessia | 212 KB | 5,2% |
| sprites — NPCs | 138 KB | 3,4% |
| sprites — decoração | 54 KB | 1,3% |
| pintura da travessia | 51 KB | 1,3% |
| retratos | 36 KB | 0,9% |
| ícones de HUD | 19 KB | 0,5% |
| **código JS** | **194 KB** | **4,8%** |
| CSS + molde HTML | 76 KB | 1,9% |
| comentário que ainda sobrou (CSS + molde) | 55 KB | 1,4% |

**91% do jogo é imagem. O código inteiro são 194 KB — 5%.** Qualquer conversa sobre peso
que não seja sobre imagem é conversa sobre 5% do problema.

**Por capítulo** (só a arte que dá para atribuir a um capítulo):

| capítulo | arte |
|---|---|
| 4 AINDA AQUI | 744 KB |
| 1 PINDORAMA | 735 KB |
| 2 PALMARES | 734 KB |
| 3 SALVADOR | 304 KB *(ainda incompleto)* |
| A HISTÓRIA (linha do tempo) | 581 KB |
| todas as eras (sprites comuns) | 347 KB |
| TRAVESSIA | 263 KB |

Os três capítulos completos batem em **738 KB de média**. Usar 700 KB por capítulo na
projecão abaixo é, se alguma coisa, otimista.

---

## 3. A projeção: quando isso vira problema de verdade

`node test/peso-projecao.js`. A conta do tempo é uma reta ajustada em **dois pontos
medidos de verdade** em Fast 3G (o jogo de hoje e o protótipo): `tela = 1,56 s +
fio ÷ 192 KB/s`. A arte comprime a 0,748 — medido nos packs, e é ~0,75 porque o brotli
devolve exatamente o inchaço do base64 e pouco mais (WebP já vem comprimido).

**Cada capítulo novo custa 700 KB no disco, 524 KB no fio e +2,7 s de abertura.**

| capítulo | arquivo | no fio | abrir em 3G | **abrir com carga sob demanda** |
|---|---|---|---|---|
| 4 (hoje) | 3,96 MB | 2,83 MB | **16,6 s** | 8,7 s |
| 5 | 4,64 MB | 3,34 MB | 19,4 s | 9,5 s |
| 6 | 5,33 MB | 3,85 MB | 22,1 s | 10,4 s |
| 7 | 6,01 MB | 4,36 MB | 24,8 s | 11,3 s |
| 9 | 7,38 MB | 5,39 MB | 30,3 s | 13,0 s |
| **12 (escopo cheio)** | **9,43 MB** | **6,92 MB** | **38,5 s** | 15,7 s |

### Em que capítulo a abertura passa de 10 s?

**Nenhum — já passou.** A linha dos 10 segundos fica em 1,58 MB no fio, e o jogo cruzou
isso com cerca de **1,6 capítulos de arte**. Passou entre PINDORAMA e PALMARES, meses
atrás, sem ninguém medir.

Duas leituras dessa tabela, e as duas importam:

1. **Sem fazer nada**, o jogo completo abre em 38 segundos em 3G. Isso não é lentidão: é
   um jogo que ninguém chega a jogar.
2. **A carga sob demanda como está no protótipo não basta sozinha até o capítulo 12.** Ela
   corta o arquivo inicial pela metade hoje, mas ainda deixa herói, monstros e vegetação
   *de cada época* (~225 KB por capítulo) no arquivo de abertura — por isso a última coluna
   sobe de 8,7 para 15,7 s. **Se esses sprites forem no pacote do capítulo também, o
   arquivo inicial para de crescer: 8,7 s no capítulo 4 e 8,7 s no capítulo 12.**

---

## 4. O protótipo: prova que dá, com número

`node test/peso-prototipo.js` — feito sem tocar em `src/` nem no build. Ele pega o
`index.html` real de hoje, tira a arte dos capítulos 2+ para arquivos `pack-*.json` ao
lado, abre no navegador e **prova em jogo vivo** que o capítulo 2 nasce como um pixel
transparente, busca o pacote e desenha certo.

```
pack-palmares.json    563 KB      pack-hoje.json       568 KB
pack-salvador.json    304 KB      pack-historia.json   347 KB
pack-travessia.json   263 KB

index.html do protótipo: 1,96 MB (era 3,96 MB)
cenário 2 depois do fetch: 720 px de largura (era 1 px)
erros de console: NENHUM
```

### O que muda na abertura, medido

| | hoje | protótipo | ganho |
|---|---|---|---|
| arquivo | 3,96 MB | 1,96 MB | −50% |
| no fio | 2,83 MB | 1,33 MB | −53% |
| **tela útil em Fast 3G** | **16,6 s** | **8,7 s** | **−48%** |
| tela útil em Slow 4G | 14,7 s | 7,3 s | −50% |

E o custo, que é real e aparece depois: **entrar em Palmares cobra 3,2 s em Fast 3G**
(2,3 s em Slow 4G) para buscar os 563 KB do pacote. Esses 3 segundos são gastos numa
transição de capítulo — um lugar onde o jogo já tem cerimônia e texto para ler — e não na
porta de entrada, onde a pessoa ainda não investiu nada e vai embora.

### A CSP: exatamente o que precisa abrir, e nada além

Hoje o jogo declara:

```
default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline';
img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'
```

**A mudança necessária é UMA diretiva, uma palavra:**

```
connect-src 'none'   →   connect-src 'self'
```

Nada mais. Nem `default-src`, nem `img-src`, nem host nenhum, nem `*`. `'self'` significa
"só o próprio site" — o jogo passa a poder buscar arquivos que ele mesmo publicou, e
continua proibido de falar com qualquer outro endereço do mundo. `img-src data:`
**não muda** porque a arte continua chegando como `data:` de dentro do pacote.

*(Variante que vale considerar depois: servir `.webp` de verdade em vez de base64 dentro
de JSON. Economiza 25% do arquivo cru — o que importa para o aplicativo Android e para a
memória — mas exige abrir também `img-src data: 'self'`. Uma diretiva a mais. Decisão de
outra sessão, com medição própria.)*

---

## 5. O custo escondido: quatro coisas leem "um arquivo"

Ninguém tinha somado isto. Fui ver as quatro, uma a uma.

| quem | como está hoje | o que quebra | trabalho |
|---|---|---|---|
| **Vercel** | `vercel.json` publica a pasta **`dist/`** — não a raiz | **nada.** O build já escreve `dist/`; passaria a escrever os packs lá também | ~nenhum |
| **Capacitor (Android)** | empacota `dist/` inteiro; `androidScheme: https` | **nada.** Os packs entram no APK sozinhos e o `fetch` funciona sob `https://localhost` | ~nenhum |
| **`npm start`** | `ferramentas/servir.js` serve a raiz e já conhece o tipo `.json` | **nada** | nenhum |
| **smoke test** | abre o jogo por **`file://`** | **QUEBRA.** Medido em `test/peso-file-fetch.js`: sob `file://` o Chromium recusa buscar o pacote vizinho — `ERRO: Failed to fetch` | **meia sessão** |

Então o custo escondido real é **um só, e é o teste**. O `test/smoke.js` já aceita uma URL
`http` (a variável `JOGO_HTML`), então o conserto é fazê-lo subir o `servir.js` sozinho e
apontar para `http://127.0.0.1`. É pouco trabalho — mas é obrigatório, e é do tipo perigoso:
se ninguém trocar, o teste continua **passando** enquanto testa um caminho que a produção
não usa mais. Teste verde sobre o arquivo errado é pior que teste vermelho.

**Um segundo achado, menor e que vale anotar:** o `ferramentas/construir.js` tem uma trava
que recusa escrever se achar qualquer `src=` ou `href=` externo — é ela que garante o
"arquivo único". Um `fetch()` **não é pego por essa trava**. No dia em que os packs
existirem, essa trava precisa aprender o contrato novo ("nenhuma referência externa, exceto
packs próprios"), senão ela vira uma garantia que só parece existir.

**Uma correção ao que se dizia:** a Vercel **não** publica a raiz; publica `dist/`. Isso
torna a mudança mais barata do que se supunha, não mais cara.

---

## 6. O que ainda dá para cortar de graça

`node test/peso-restante.js`.

| candidato | cru | no fio (brotli) |
|---|---|---|
| comentário do CSS (173 blocos) | 47,2 KB | 18,6 KB |
| comentário do molde HTML (32 blocos) | 7,7 KB | 3,3 KB |
| **os dois juntos** | **54,8 KB** | **22,8 KB** |

**Vale? Sim, mas não conta como solução.** 22,8 KB no fio são **0,12 segundo** em 3G. É de
graça e não custa uma linha de fonte — o comentário continua inteiro no `src/`, igual ao
que já se fez com o JS — mas quem espera que isso mova o ponteiro vai se decepcionar.

**A lição honesta dos 318 KB de comentário do JS que saíram ontem:** eles pareciam enormes
no disco (4,26 → 3,96 MB), mas **no fio valeram só 125 KB** (2,95 → 2,83 MB), porque
comentário é texto repetitivo e o compressor já o pagava barato. Ganho real de abertura:
**cerca de 0,7 s**. Foi bom, foi grátis, e não chega perto de resolver.

**Como fazer sem quebrar nada:** não com expressão regular ingênua, e o motivo é concreto —
`<!--` é sequência legal em JavaScript e pode cair no meio de um base64 de 400 KB, e `/*`
aparece dentro de texto no CSS. Um `.replace()` cego produz um arquivo que não abre. A
varredura correta (que respeita as fronteiras de `<script>` e `<style>`) já está escrita e
testada em `test/peso-restante.js`; aplicá-la seria copiar essa função para uma etapa do
`ferramentas/construir.js`.

### E a qualidade das imagens? Essa alavanca acabou.

`node test/peso-qualidade.js 0.68` — descer as pinturas de cenário de 0,72 para 0,68
poupa **52 KB de 1.346 KB: 3,9%**. No fio, ~36 KB. **0,2 segundo.** E 0,65 já tinha sido
medido e recusado por perder a mancha fina de folha da mata. Não há mais peso a tirar da
qualidade da arte sem que a arte piore visivelmente — e a tese do produto ("visualmente
impressionante") diz que isso não é uma troca aceitável.

---

## 7. Recomendação, em uma frase

**Fazer a carga sob demanda por capítulo — pacotes que incluam também os sprites de cada
época, para o arquivo inicial parar de crescer — abrindo exatamente uma diretiva da CSP
(`connect-src 'self'`) e trocando o smoke test de `file://` para `http`; isso corta a
abertura de 16,6 s para ~8,7 s hoje e a mantém lá nos doze capítulos, contra os 38,5 s
que o caminho atual entrega.**

---

### Apêndice — como reproduzir cada número

```bash
node test/peso-composicao.js                 # a tabela de composição
node test/peso-abrir.js                      # abertura, comprimido (como a Vercel serve)
node test/peso-abrir.js --cru                # abertura, sem compressão (Capacitor)
node test/peso-projecao.js                   # a projeção por capítulo
node test/peso-prototipo.js                  # gera e PROVA o protótipo sob demanda
node test/peso-abrir.js <dir>/index.html --fetch pack-palmares.json,pack-travessia.json
node test/peso-file-fetch.js                 # prova que file:// bloqueia o fetch
node test/peso-restante.js                   # o que ainda dá para cortar de graça
node test/peso-qualidade.js 0.68             # a alavanca de qualidade, já exaurida
```

Nenhum deles escreve em `src/`, em `index.html` ou em `dist/`. O `peso-prototipo.js` grava
a cópia numa pasta temporária.
