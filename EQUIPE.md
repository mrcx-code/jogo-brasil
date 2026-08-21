# EQUIPE.md — o que todo agente lê antes de começar

Um arquivo, uma equipe (a lista vigente é a pasta `.claude/agents/` — contagem escrita aqui já
envelheceu duas vezes). O `AGENTES.md` diz **quem faz o quê**; este diz **o que já custou caro**
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
- **Entrega de worktree termina COMMITADA no ramo do worktree** — caminhos explícitos (lição 2.5),
  sem push. Árvore suja não se integra, e a integração é **merge do ramo**, nunca cópia de arquivo
  (lição 2.10). É também o que torna `git worktree remove` seguro depois.

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

### 2.10 Integrar por cópia de arquivo quase perdeu trabalho DUAS vezes

**19–20/08.** A integração de worktree era "copiar os arquivos mudados para a árvore principal" —
e duas vezes um `NOTES.md` do worktree (ramificado horas antes) ia por cima de commits mais novos
da `main`. Salvou a atenção de quem olhou o diff, não o desenho. Cópia é last-writer-wins: ela não
sabe o que o outro lado escreveu depois. **Merge sabe** — o três-vias do git é exatamente o
mecanismo que a cópia improvisa mal. Por isso a trava da seção 1: entrega commitada no ramo,
integração por `git merge` com portões por exit code entre cada um, e só então `worktree remove`.

---

## 3. Como trabalhar em paralelo sem se atropelar

- **A FILA OFICIAL é o backlog da mesa** (ferramentas/backlog.json, 21/08): o pm propõe a
  ordem, o DONO reordena na mesa (localhost:8200), e o de cima é o próximo. Agente que escolhe
  tarefa fora do topo do backlog escreve o porquê no placar.

- **Territórios disjuntos.** Antes de abrir um leque, o `pm` define quem toca o quê. Dois agentes
  no mesmo arquivo é retrabalho garantido.
- **A fila da mesa (`mesa_resposta`) tem UM consumidor: o plantão durável.** Sessão e agente não
  fazem GET nela por conta própria — dois leitores na mesma fila é executar o mesmo acionar duas
  vezes. O que a sessão recebe da mesa chega via o que o plantão registrou (NOTES/PENDENTES/mesa).
- **CI vermelho na `main` passa na frente de qualquer fila.** A main publica sozinha; vermelho no
  ar não espera dono reclamar (já esperou 16 h, de 20/08 16:22 a 21/08 08:23). O estado se lê por
  comando, sem credencial: `curl -s "https://api.github.com/repos/mrcx-code/jogo-brasil/actions/runs?branch=main&per_page=1"`
  e o campo `conclusion`. Quem vê vermelho conserta ou reverte — o dono do relógio é o plantão.
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

**A linha do placar é parte da entrega, não gentileza:** agente em worktree a devolve DENTRO do
relatório (rodadas paralelas editando esta tabela conflitam à toa), e quem integra a prega aqui
**antes** de remover o worktree. Entrega sem linha de placar não se integra — é o portão que tira
o placar da memória de cada um.

| data | rodadas | achados | reais | desmentidos | do dono | observação |
|---|---:|---:|---:|---:|---:|---|
| 18/08 | 4 | 18 | 13 | 3 | 1 | primeiro dia com a licença. Dos 3 desmentidos, **2 eram meus erros ao desmentir** — mesma causa única, `abrirTela` sem montar |
| 19/08 | 4 | 12 | 10 | 0 | 5 | historiadora achou 3 lugares onde o jogo já sabia mais do que falava; pipeline mediu 18,75% → 0,88% e parou no §2 por conta própria |
| 19/08 noite | 5 | 33 | 10 integrados | 6 | 3 | a rodada em que o QA valeu mais que o achado — ver abaixo |
| 19/08 tarde/noite | 4 | 15 | 14 verbetes + home | 0 | 6 | QA leu as 14 leis na fonte primaria e confirmou todas; home feita por dev-sonnet no paralelo enquanto a mesa era montada (regra nova). O fato de 1932 e o de A PRACA verificados por mim antes de integrar |
| 19/08 madrugada | 1 | 8 | 7 | 1 | 1 | historiadora nos três capítulos sem porta de glossário: 14 verbetes propostos (0·0·0 → 5·5·4 medido em simulação), as 3 revisões seguradas resolvidas. **O desmentido foi contra o próprio jogo**: o verbete VOTO FEMININO afirma restrição de 1932 que não está no Decreto nº 21.076 — está no ANTEPROJETO. Ver abaixo |
| 20/08 | 1 | 8 | 5 aplicados + 2 propostos | 0 | 0 | historiadora nos 4 textos de capítulo sob a licença do §2. **O achado do dia foi um PORTÃO que passava por 1 segundo de sorte** (ver abaixo). 2 propostas ficaram de fora por escolha própria (PENDENTES 43) e 1 vermelho anterior foi separado do meu trabalho por controle com `git stash` (PENDENTES 44) |
| 21/08 | 1 | 2 | 2 | 0 | 1 | dev na placa 3D (O TERRITÓRIO, página nova). **Os 2 achados foram do próprio instrumento, não meus**: girar o aparelho com o cartão aberto tirava 2 de 5 pinos da tela (destino do dolly guardado = cópia do enquadramento velho) e o cartão do Rio rotulava a cidade de "Cais do Valongo" — o mesmo defeito que o mapa do jogo já pagou. O 1 do dono é a leitura do bisel de 8° (parede, não topo), registrada para o arte confirmar |
| 21/08 growth | 1 | 10 | 10 | 0 | 5 | growth auditou title/description/og:/twitter: das 6 URLs por `curl` real (nunca supôs) — `historia`, `glossario`, `de-onde-vem` e `territorio` e a porta **não têm `og:image`** (só `/jogo/` tem), o `og:url` do jogo aponta pra raiz em vez de `/jogo/` (canonical desencontrado desde a mudança de 20/08), e o jogo — o chamariz — **tem zero link de saída pra plataforma** (nem pra porta, nem pro território). Achado extra: nenhuma das 5 páginas fora do jogo emite evento PostHog — todo tráfego direto é invisível pra pergunta de 3 dias. Nenhum desmentido; blocos prontos entregues pro dev aplicar nos geradores, nada editado por mim |
| 21/08 growth onda 2 | 1 | 4 | 4 | 0 | 3 | growth conferiu por `curl` real o que a onda 1 aplicou: `og:image` chegou na porta e no `/jogo/`, mas **`historia`, `glossario`, `de-onde-vem` e `territorio` (as 4 mesmas de ontem) continuam sem** — e **`territorio` também não ganhou `og:image`**, ao contrário do que o pedido presumia (verificado, não suposto). Achado extra: **`/jogo/` — o chamariz — não tem `<link rel="canonical">`**, único das 6 páginas sem ela. `sitemap.xml` e `robots.txt` conferidos no ar: os 6 endereços corretos, `Disallow: /dashboard`, sitemap referenciado. Blocos prontos entregues pro dev-plataforma: gerador novo de cartão 1200×630 por seção (Playwright, papel/serifa/números de cada seção, dado lido da própria página gerada — nenhum número redigitado), a linha de canonical que falta no jogo, e 2 propostas de title (porta, território) com o antes/depois medido em caracteres. Nada publicado — passa pelo sign-off do dono. |
| 21/08 arte | 1 | 4 | 4 | 0 | 0 | auditoria de coerência entre os 13 capítulos (acionada pelo dono), 1 print por rua em 390×844 dsf2 + luma/sat medidos na escala de exibição. **O achado maior: o jogo fala DUAS línguas visuais** — PINDORAMA/PALMARES/AINDA AQUI em pixel art crua, os outros 10 capítulos (CAIS em diante) em pintura semi-realista de tom contínuo, confirmado por saturação (59–66% vs 34–52%), e nenhuma onda anterior tinha medido o arco inteiro de uma vez — todas mediram chrome, tipografia ou luz. Mais dois: NÃO DITO/A PRAÇA/O QUE SEGUROU/O ACEIRO usam a mesma pintura pixel a pixel (arte índice 10 nos quatro), e JABAQUARA tem um artefato de espelho não-intencional (raiz detalhada forma rosto simétrico na costura). Diagnóstico só — nada em src/ tocado; achados e as 3 correções de maior retorno registrados em DIRECAO.md, prints em test/COER-*.png. |

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

**O que a linha de 19/08 (madrugada) ensina, e as três valem para qualquer agente:**

- **O jogo pode estar mais errado que a internet, e a internet mais errada que a lei.** A frase
  "em 1932 só votavam as casadas com autorização do marido e as solteiras com renda própria"
  está no glossário DESTE jogo, em páginas de tribunais eleitorais e em quase toda matéria de
  jornal. **Não está no Decreto nº 21.076, de 24/02/1932** — o art. 2º diz "sem distinção de
  sexo" e nenhum artigo de alistamento pede autorização nem renda. A restrição estava no
  ANTEPROJETO e caiu por pressão das sufragistas. Uma consulta ao texto promulgado desmontou
  em minutos o que quatro fontes secundárias repetiam. **Leia a norma, não quem a resume.**
- **Fonte que não abre num servidor abre noutro** (a lição de 19/08 à noite se repetiu): o
  Planalto devolveu `ECONNRESET` em três tentativas; a Câmara (`legin`, publicação original)
  entregou os mesmos artigos inteiros. Não escreva "não deu para ler" antes do segundo host.
**O que a linha de 20/08 ensina, e é a 2.9 e a 2.8 no mesmo achado:**

- **Um portão pode estar medindo o COMPRIMENTO DE UM TEXTO e chamar isso de motor.** O bloco 9 do
  `encaixe.js` promete "a abertura de capítulo espera o dedo" e media com a **travessia ainda viva
  por baixo**: `fecharTudo()` fecha as bandejas, e quem encerra a travessia é `fecharTelas()` — a
  mesma dupla de nomes da 2.9, pela segunda vez. Com a travessia viva, o avanço automático vale
  também na abertura, e quem decidia o resultado era o tamanho da fala: **10,0 s de avanço contra
  uma janela de 9 s**. Encurtar a primeira frase do jogo de 115 para 84 caracteres derrubava o
  bloco sem que nada no motor tivesse mudado — e isso **segurou uma revisão de §2 por um dia**.
- **A prova de que o conserto é conserto é a TABELA, não o verde.** Quatro células (com/sem o
  estado limpo × texto velho/novo) mostram que o portão só é insensível ao comprimento depois do
  conserto, e que ele reprova quando o defeito está presente (2.8). Um `ok` a mais não provaria
  nada disso.
- **Antes de dizer "o teste ficou vermelho por minha causa", rode o CONTROLE.** O `encaixe` já
  saía 1 no HEAD, num bloco de layout do menu, sem nenhuma mudança minha. Dois `git stash` custam
  quatro minutos e evitam consertar defeito de outra pessoa dentro do commit errado.

- **Antes de propor conteúdo que depende de uma regra de código, reimplemente a regra e rode o
  CONTROLE.** A sonda de casamento de termos (`test/tmp-casar.js`) reproduziu os treze números
  documentados no `src/jogo.ts` antes de eu confiar em qualquer proposta — e foi ela que achou,
  de graça, que o comentário da regra documenta **1 porta** para O QUE NÃO PODIA SER DITO
  quando hoje são **2**: o número ficou velho quando a fala da CNV entrou, no mesmo dia.
| 21/08 | 1 | prova do funil | - | - | - | integrar.js estreou pegando main vermelha e desfazendo o proprio merge; verde na 2a |
| 21/08 pm | 1 | 5 | 5 | 0 | 2 | roadmap operacional da 2a rodada ano-a-ano: backlog auditado contra o estado real — integrar-js JA FEITO (sai), og-image-territorio absorvido em territorio-rico (mesmos arquivos), rodada-prova deixa de ser item e vira MEDICAO dos 2 primeiros tickets em paralelo (colisoes=0); 2 faltas achadas por grep, nao por suposicao: historia/glossario/de-onde-vem sem og:image apos o growth, e a lei de DIVULGACAO do dono (21/08 tarde) sem NENHUM item na fila. 2 decisoes reais ao dono: interruptor de privacidade das paginas e a ancora interna do lancamento |
| 21/08 dupla | 1 | 3 | 3 | 0 | 0 | dev-plataforma: og:image do TERRITORIO — gerador tira o proprio print 1200x630 (68KB, 5/5 pinos); a faixa de peso nao era portao e virou estado da cena; achou a main vermelha por controle e NAO invadiu o territorio do irmao  · aud: growth:ok(cartao conferido por inspecao: 1200x630, 68KB, 5/5 pinos, nav+censo+placa — explica a secao sozinho) |
| 21/08 home | 1 | 3 | 3 | 0 | 1 | dev-jogo nos portoes de topo: 3 tabuas claras IGUAIS (JOGAR cedeu a letra 4->3, a arte confirma) + nivel 2 apagado; poste 498->473px, rolagem 390x812 3->0; portao novo do DEGRAU na regua (autoteste visto reprovando); o portao piscava (2-5px no MESMO build) e foi consertado tirando recheio; o guarda do TERRITORIO mordeu simbolo em comentario — funciona  · aud: qa:PULADO(coberto por portoes por exit code: regua ampliada com autoteste falsificado + smoke + encaixe na integracao; qa em lote na proxima leva) seguranca:PULADO(diff de src/index.html verificado por grep: 0 toques em CSP/head/meta — so classes e ordem de botoes no body) |
