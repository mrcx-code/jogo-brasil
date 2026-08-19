# EQUIPE.md — o que todo agente lê antes de começar

Um arquivo, seis agentes. O `AGENTES.md` diz **quem faz o quê**; este diz **o que já custou caro**
e **como não repetir**. Cada definição em `.claude/agents/` aponta para cá.

**Se você é um agente e está lendo isto pela primeira vez: leia até o fim.** São dez minutos que
já pouparam dias, e cada linha aqui existe porque alguém perdeu tempo antes de você.

---

## 1. As travas que não se discutem

- **O §2 do `CLAUDE.md` é lei.** Na dúvida sobre representação você **para** e escreve no
  `PENDENTES.md` para o dono. É a única matéria deste repositório em que decidir sozinho é o erro.
- **A tela ONDE FOI é do dono.** `TERRITORIO.md` lista cada símbolo e bloco por nome. Trabalho que
  precise daquela zona para e avisa — não edita e pede perdão depois.
- **Nunca edite `index.html` nem `pack-*.json` da raiz.** São saída de build; o próximo `npm run
  build` apaga o que você escrever. A fonte é `src/`.
- **`isolation: worktree` para quem toca `src/`.** Duas escritas simultâneas num arquivo de 15 mil
  linhas se atropelam em silêncio.

---

## 2. As lições que custaram tentativas

Cada uma abaixo foi paga. A data diz quando, e o número diz quanto.

### 2.1 `abrirTela` ABRE mas não MONTA — e isso me fez desmentir dois agentes certos

**19/08, e é a mais cara da lista.** Nenhuma tela de lista se enche sozinha: quem enche é
`montarConfig()`, `montarCapitulos()`, `montarFontes()`, `montarGlossario()`, `montarCompletude()`,
`montarObra()` — chamadas pelo **toque no botão**, nunca por `abrirTela`.

Medindo com o atalho, a tela de AJUSTES tem **10 nós**; pelo caminho da pessoa, tem **41**. E
**tela vazia cabe em qualquer altura**. Com isso eu escrevi no `PENDENTES` que dois defeitos "não
reproduziam" — e os dois eram reais.

> **Antes de escrever "não reproduz", pergunte se o instrumento exercita o caminho da PESSOA.**

O mesmo defeito estava no `medir-telas-altura.js`: seis das oito telas eram medidas vazias — A
HISTÓRIA com 5 nós em vez de 568.

### 2.2 Desmentido errado é pior que silêncio

Relatório de agente é **hipótese**. Verifique por medição própria antes de tocar no código — e
**registre o desmentido no `PENDENTES`**, porque um "não reproduz" errado manda a próxima sessão
não olhar. Placar de 18/08: 18 achados, 13 reais, 3 desmentidos, e **em dois deles quem errou fui
eu ao desmentir**.

### 2.3 Para escrever patch, use Write ou Edit — nunca heredoc com `sed` ou `node -e`

Crase, aspas e barra invertida somem no caminho do shell. Custou tentativas em quatro momentos
diferentes num único dia, e uma delas apagou justamente a frase que mais importava.

### 2.4 Print de tela com transição engana

As telas abrem com `visibility` + opacidade atrasada. Um print tirado cedo mostra **duas telas
sobrepostas** e não responde nada. **Espere a transição OU meça por número.** Enganou três vezes
no mesmo dia.

### 2.5 Nunca `git add -A` com outro agente ativo na mesma árvore

Varre as sondas temporárias dele para o histórico. Use caminhos explícitos. (`test/tmp-*` e
`test/TMP*` estão no `.gitignore` desde 18/08, mas a regra vale para tudo o mais.)

### 2.6 Contador que lê a fonte tem de excluir comentário

`arteCap:` aparece dentro de um comentário que explica a regra, e contá-lo dava **14 onde há 13**.
A régua conta o código, não o que fala sobre ele.

### 2.7 Como simular o que o navegador não deixa

- **Aba oculta:** `Object.defineProperty(document, 'hidden', {configurable:true, get:()=>true})`,
  o mesmo para `visibilityState`, e `document.dispatchEvent(new Event('visibilitychange'))`.
  `bringToFront` noutra aba **não** muda `document.hidden` no headless.
- **Tempo passando:** sobrescreva `Date.now` durante a janela que você quer simular.
- **Nunca `file://`:** use `require('./abrir.js')`. Sob `file://` os pacotes de arte não carregam,
  e o instrumento mede a arte do capítulo 1 achando que mede a do capítulo 3.

### 2.8 Um instrumento que nunca foi visto reprovando é decoração

O `medir-telas-altura.js` passava em 8 de 8 telas e **três delas não podiam reprovar** — o filtro
anistiava toda tela que rola. Prove que o seu reprova: injete o defeito de propósito e mostre o
exit 1. (`ENCAIXE_DEFEITO="<css>"` faz isso naquele arquivo.)

### 2.9 Medir o instrumento custa um minuto; adivinhar custa rodadas

**19/08.** O `medir-arco.js` mediu **0/min nos nove pontos** e anunciou um arco de **400 horas**.
Fiz dois consertos no escuro e os dois falharam. A terceira coisa que fiz foi **imprimir o
estado** — 15 toques, delta zero, `.tela.aberta` ainda `true` — e a causa apareceu na primeira
linha: são **dois fechamentos com nomes parecidos** e eu chamava só um. `fecharTudo()` fecha as
BANDEJAS (melhorias, nichos); `fecharTelas()` fecha as TELAS. Com a tela aberta o toque é
engolido.

> **Antes do segundo palpite, imprima o estado.** Instrumento que devolve número absurdo está
> pedindo diagnóstico, não conserto — e o absurdo foi sorte: um valor só um pouco errado teria
> entrado no NOTES.md como fato.

Prima da 2.1: nos dois casos o instrumento não exercitava o caminho da pessoa.

---

## 3. Como trabalhar em paralelo sem se atropelar

- **Territórios disjuntos.** Antes de abrir um leque, o `pm` define quem toca o quê. Dois agentes
  no mesmo arquivo é retrabalho garantido.
- **Quem mede não edita, quem edita não julga o próprio trabalho.** O `qa` vem **antes** de
  integrar, e o trabalho dele é **derrubar** o achado, não confirmá-lo.
- **Sondas descartáveis** vão em `test/tmp-*` e são apagadas ao terminar. Elas estão no
  `.gitignore`, mas deixar lixo é deixar lixo.
- **Diga o que NÃO conseguiu.** "Não reproduzi" e "não consegui abrir a fonte" são resultados
  bons. Afirmação sem medida é o que este arquivo existe para evitar.

---

## 4. O portão, sempre por EXIT CODE

```bash
npm test                        # build + smoke
node test/encaixe.js
node test/medir-save-hostil.js
node test/medir-telas-altura.js 360 500 950
```

**Nunca julgue pela última linha do log** — já houve push com teste vermelho porque alguém leu a
linha de erro como se fosse o resumo. Os quatro verdes, então commit e push.

**Falhou duas vezes e você não entende por quê:** reverta ao último commit verde, escreva o
diagnóstico no `PENDENTES.md` e passe adiante. Reverter sem registrar perde o trabalho duas vezes,
porque some o código **e** o diagnóstico que custou a sessão.

---

## 5. O PLACAR — é isto que faz a equipe evoluir

Toda rodada de agente termina com uma linha aqui. Não é cerimônia: foi o número de 18/08 que fez
19/08 ser melhor, porque ele disse **em que a equipe erra**.

| data | rodadas | achados | reais | desmentidos | do dono | observação |
|---|---:|---:|---:|---:|---:|---|
| 18/08 | 4 | 18 | 13 | 3 | 1 | primeiro dia com a licença. Dos 3 desmentidos, **2 eram meus erros ao desmentir** — mesma causa única, `abrirTela` sem montar |
| 19/08 | 4 | 12 | 10 | 0 | 5 | historiadora achou 3 lugares onde o jogo já sabia mais do que falava; pipeline mediu 18,75% → 0,88% e parou no §2 por conta própria |
| 19/08 noite | 5 | 33 | 10 integrados | 6 | 3 | a rodada em que o QA valeu mais que o achado — ver abaixo |

**Como ler:** "desmentido" alto e "reais" baixo significa que os prompts estão pedindo palpite em
vez de medição. "Do dono" alto é bom — significa que a equipe está reconhecendo o limite do §2 em
vez de atravessá-lo.

**O que a linha de 19/08 à noite ensina, e é a mais densa até hoje:**

- **O QA achou uma SUPERFÍCIE que a historiadora não sabia que existia.** Ela comparou fala
  contra glossário e linha do tempo; o QA descobriu que a **placa da estrada chama
  `abrirFala()` com o texto inteiro do nó**, sozinha, no meio do capítulo. Quatro dos quinze
  achados morreram aí. Achado bom morre por uma superfície esquecida, não por má leitura.
- **Três achados confirmados tinham ARMADILHA e só o QA viu.** A revisão do voto de 1932
  deixaria a fala mais grossa que o glossário (recriando o defeito ao contrário); a de AS
  PORTAS quebraria a conta "setenta e dois depois da CLT"; a de A PRAÇA põe 1989 antes de uma
  emenda de 1985. Confirmar não é aprovar.
- **Um agente refutou a própria hipótese por controle.** O QA do portão de privacidade achou
  que o conserto dele tinha mexido no bloco 28; rodou o arquivo ORIGINAL com 12 s de espera e
  reproduziu o desvio. Causa: tempo de relógio. Isso vale mais que qualquer achado do dia.
- **Fonte que falha num servidor não é fonte inexistente.** O relatório da CNV estava
  recusado há doze dias por certificado inválido; o Arquivo Nacional hospeda os mesmos PDFs
  em `gov.br` e eles abrem inteiros. **Procure quem mais hospeda antes de escrever que não
  deu para ler** — há pelo menos mais dois itens recusados pelo mesmo motivo no `NOTES.md`.
- **Dois portões eram decoração e foram pegos no mesmo dia** (lição 2.8 outra vez): o bloco 17
  do `encaixe.js` conferia só `pedidos[0]`, e o autoteste do `medir-telas-altura.js` saía
  exit 0 com o defeito documentado. **Leia a promessa escrita no portão e tente falsificá-la.**

**O que a linha de 19/08 (dia) ensina:** os dois melhores relatórios do dia foram os que **pararam
sozinhos** — a historiadora listou 5 perguntas que não resolveu, e o pipeline aprovou o técnico e
recusou o §2 na mesma página. Agente que sabe onde parar vale mais que agente que decide tudo.
