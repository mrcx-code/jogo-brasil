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

### 3.1 QA CRUZADO — quem convive não julga (regra do funil, 21/08)

Complemento do "quem edita não julga o próprio trabalho", escrito para as TRÊS SQUADS
(esqueleto no `AGENTES.md`) e valendo desde já em toda integração:

1. **O auditor de uma entrega nunca é do squad que a produziu.** A matriz:
   - entrega do squad **JOGO** → auditada com a lente de PLATAFORMA/ACERVO: o dado que a
     mecânica afirma tem fonte e validade? o link entre jogo e seção continua verdadeiro?
   - entrega da **PLATAFORMA** → lente de JOGO/ACERVO: o gerador EXTRAIU do jogo ou
     redigitou? o número da página bate com o que o acervo afirma?
   - entrega do **ACERVO** → lente de JOGO/PLATAFORMA: o texto cabe na fala e na tela? a
     página gerada muda algum byte? o esquema aguenta carga hostil?
2. **`qa` e `seguranca` são centrais** e julgam qualquer squad — é para isso que não
   pertencem a nenhuma.
3. **Quem reprovou RE-AUDITA — com sondas PRÓPRIAS, nunca as do autor.** Precedente de 21/08
   (dupla hardening, 2ª volta): a seguranca re-auditou o que ela mesma reprovara rodando
   sonda própria (laço 1135→50 POSTs; XSS que não executa; controle 6/6 visto reprovando) em
   vez de aceitar o verde do autor — e foi isso que provou o conserto, porque a sonda do
   autor foi calibrada pelo mesmo raciocínio que errou.
4. **PULADO continua existindo**, com justificativa de uma linha no placar, e só quando um
   portão por exit code já cobre a alegação — auditoria pulada por pressa não é PULADO, é
   furo.
5. **Achado confirmado não fica órfão no placar**: se não foi aplicado no próprio ramo, vira
   item no `ferramentas/backlog.json` com agente dono, no MESMO commit que prega a linha
   (retro de 21/08, §6).

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
| 21/08 dupla T3 | 1 | 3+12 | 15 | 0 | 3 | dev-plataforma na FILA-AUTH (login OTP REST puro, 10 cenas com defeito injetado visto reprovando; 3 achados fora do ticket: authenticated nao fecha com cadastro aberto -> uuid; rodape de privacidade reescrito §3; mesa local 403) + AUDITORIA da seguranca ANTES de integrar: 12 achados com prova — o do dia: a prova do SQL ficava verde com policy FOR ALL/public, e mesa_agente.cor cru no innerHTML ROUBAVA o refresh_token (A3 consertado NO merge, exigencia do auditor); SQL SEGURADO ate o hardening A1-A11  · aud: growth:PULADO(dashboard e noindex+Disallow por design (nao-compartilhavel; a propria auditoria confirmou por curl)) seguranca:ok(auditoria completa 12 achados; veredito INTEGRA com A3 aplicado no ramo (feito, fila-auth.js 10/10 apos o conserto); SQL nao sera aplicado ate A1/A2/A4 no hardening) qa:PULADO(test/fila-auth.js: 10 cenas, defeito injetado visto reprovando (3 falhas), 0 erros de console; A10 (cena 5 cega) vai no ticket de hardening) |
| 21/08 arte (material de decisao) | 1 | 2 | 2 | 0 | 1 | mosaico dos 13 + ranking a pedido do dono; confirma por imagem a auditoria (3 pixel vs 10 pintura, repeticao 9-12, rosto em JABAQUARA); clip por medicao de hudTop/controls, nao por olho. Resultado: DONO DECIDIU PIXEL-VENCE |
| 21/08 dupla f0 | 1 | 3 | 3 | 0 | 0 | dev-plataforma na Avenida A fase 0 (espelho do glossario): esquema+carga+portao, jogo e CSP intocados. O achado que corrige o despacho: 644 pares, nao 167 (167 e o numero de TERMOS com relacionados); e o comentario do src diz nove dv quando sao 34. A carga rele o proprio SQL antes de escrever. Portao provado reprovando em 4 controles (dv nomeou COLORISMO; ordem de par; texto mutilado nomeou INVASAO). FECHADA NA INTEGRACAO: 17/181/644 no banco via janela REST temporaria (aberta e FECHADA com prova negativa: 0 policies/grants nao-SELECT) e ESPELHO exit 0 com hash identico 2457...c858 |
| 21/08 historiador | 1 | 5 | 5 | 0 | 3 | manutencao anual executada: RAD 2025 (540.614 ha, 54,9%, terceiro ano), PRODES estimativa out/2025 + consolidada mar/2026 no verbete, Censo 2a ed (474.856 falantes). Dois achados fora do despacho ja publicados: aspas que citavam frase inexistente nos dois relatorios (parafrase dentro de aspas) e 97% atribuido ao Cerrado quando e do Brasil em sete anos. Regua dos 97% validada baixando os DOIS PDFs. Parecer tag_s2 em JSON: 176/181 true — e o achado e que o flag nao separa nada; proposta de s2_alto (~30 chaves) vai ao dono  · aud: qa:PULADO(diff e texto e numero historico com fonte primaria; os 4 portoes mecanicos passaram por exit real (npm test 0, encaixe 0, telas 0, save-hostil 0) e a fala mais comprida foi medida (255/260); refutar o conteudo exigiria reler os mesmos PDFs que o autor leu) |
| 21/08 growth divulgacao | 1 | 1 | 1 | 0 | 3 | growth escreveu divulgacao/PLANO.md + 5 rascunhos para sign-off (backlog divulgacao-2026), nada publicado. O achado: og:image ainda falta em 3 das 6 URLs (historia/glossario/de-onde-vem), confirmado por curl real — agora citado como bloqueio de sequencia. Numeros do plano medidos ao vivo, nao copiados do CLAUDE.md: 181 verbetes (nao 167 — Avenida A mudou o numero), 60 fontes (nao 71 — divergencia a conferir contra o 72 do historiador), 47 momentos. 3 decisoes ao dono: texto-base, nome dele no press-kit, ordem dos publicos. Nota do funil: 1a tentativa recusada por 2 assercoes de encaixe que nao reproduzem na main (flake de timing; encaixe direto na main = exit 0) |
| 21/08 historiadora pinos | 1 | 49 | 0 | 1 | 6 | lista de candidatos do territorio-rico, pino a pino ao dono como ele decidiu: 49 em 4 grupos (27 NENHUM, 17 CUIDADO, 5 PARE sem texto — Pretos Novos, Javari, Volta Grande, Araguaia, sambaquis), toda confianca media marcada [conferir] com fonte primaria a abrir antes de entrar; o desmentido foi dela contra ela mesma — o cabecalho dizia 26/18 e o script que le o JSON disse 27/17. Do dono (2 ja no dashboard): Joao Candido nomeado?, PARE visiveis ou fora?; e ainda: mais TIs homologadas?, ponte Palmas-Palmares so com documento, camada vs pino novo em Brasilia/Salvador  · aud: growth:PULADO(documento interno de proposta de pesquisa em territorio/; nenhuma pagina publica muda (o gerador nao le PINOS-PROPOSTA.md nem o json); SEO e cartoes intocados) |
| 21/08 dupla hardening (2a volta) | 1 | 8+3 | 11 | 0 | 0 | dev-plataforma fechou a re-auditoria no proprio ramo. O achado foi contra ele: o teto de fila da 1a volta CRIOU um laco — 348 POSTs, 347 repetidos com o conserto removido; conserto tem duas metades e so as duas juntas valem. 2o bloqueante: XSS executando com a CSP nova — escapar so menor-maior-e e deixar a aspa passar e seguro em texto e fatal em atributo; cena 14 mede escape (licao 2.8). EXTRA desmentido por medicao: 71 era tamanho de array (60 fontes + 11 cabecalhos). Portao de segredo vale para todo dist/. 66->79 verificacoes, 4->6 controles mordendo  · aud: seguranca:ok(APROVADO: os 2 bloqueantes morreram e a seguranca conferiu com sonda propria — laco 1135->50 POSTs e fila drena a 0; XSS nao executa e nenhum atributo on* nasce; portao 15/15 e controle 6/6 vistos reprovando. Confirmado por MCP: so mesa_resposta aceita INSERT anonimo, logo o XSS via mesa_item era interno. Restam N9/N10/N11 e o curl dos cabecalhos pos-deploy) growth:PULADO(diff toca dashboard/ (privado, noindex, Disallow no robots) e gerar-fontes.js so no comentario (a saida da pagina FONTES nao muda um byte). Nenhuma superficie de descoberta, og: ou divulgacao) qa:PULADO(a seguranca FOI o QA adversarial deste diff: re-auditou com sondas proprias (nao as do autor), rodou fila-auth 15/15 e o controle fila-auth-controle 6/6 vistos reprovando (628 POSTs/627 repetidos no N1 reinjetado, BUTTON[onmouseover] no N2), e mediu o regex de segredo sobre os 22 arquivos publicados. Os arquivos de teste tocados sao os instrumentos que ela mesma exercitou) |
| 21/08 pixel vence (2 voltas + arte) | 2 | 5+4 | 8 | 2 | 0 | passe de quantizacao na EXIBICAO dos 10 pintados (cores 1281->86 no CAIS; 3 controles de pixel cru imoveis; zero byte de arte) + hora presa nos 4 que dividem arte + veu ambar no ACEIRO (sepia 0,10 com devolucao de brilho — sepia sozinha CLAREIA, matriz soma 1,217; luma na tela 124,9, dentro da faixa 118-126 da arte). A arte APROVOU a dose (8 niveis: 38-86 cores ja e 10x abaixo do pixel cru) e pos condicao de FPS que o dev DESMENTIU por A/B na mesma carga (controle 24,2 com passe vs 25,6 sem — cruza o zero; o antes da arte fora medido no build COM o passe; headless varia 13-32). 3 defeitos do proprio instrumento consertados (rolagem nao presa, luma cego ao filtro, antes gravavel com ticket ligado — exit 1 agora). Duvida: regua da arte nasceu do luma CRU; reancorar em lumaFiltrada  · aud: qa:PULADO(o par adversarial deste diff foi arte+dev em duas voltas: arte julgou por print e pos condicao; dev refutou com instrumento A/B novo e controles embutidos; portoes npm test 61 FPS, encaixe e tipos verdes por exit real) historiador:PULADO(o diff em src/jogo.ts e so motor de exibicao (GRAO_PINT, pixelarPeca, HORA_FIXA, VEU_AMBAR, lavarFundo) e instrumentos; grep no diff por conteudo historico devolve exatamente 2 linhas e as duas sao LEITURA de EPOCAS[epocaAtual()] para o lookup da hora — zero literal de texto, fonte ou numero alterado) |

---

## 6. Retro do pm — 21/08 (a primeira)

Lido o §5 inteiro. Em 21/08 foram **15 linhas de rodada num único dia** — o mais denso da
máquina até aqui — somando **117 achados, 1 desmentido e 28 itens levados ao dono** (contados
das linhas; a linha da prova do funil não tem número e ficou fora da soma).

**O que a máquina faz bem (com número):** medir antes de afirmar virou reflexo — **1
desmentido em 117 achados (0,9%)**, contra 3 em 18 (17%) no primeiro dia da licença; e o
único desmentido de 21/08 foi de uma agente contra ela mesma (o cabeçalho dizia 26/18, o
script que lê o JSON disse 27/17). E o adversarial pega bloqueante ANTES do merge: os 2 da
fila-auth morreram no ramo, e a 2ª volta pegou o conserto da 1ª criando um laço (348 POSTs
repetidos) — a máquina já pega a própria regressão.

**Onde ela desperdiça (com número):** achado confirmado sem dono RE-MEDE em vez de fechar. O
`og:image` de historia/glossario/de-onde-vem foi conferido por curl real em **três rodadas
distintas do mesmo dia** (growth · growth onda 2 · growth divulgação) e aplicado em **zero**
— o custo de ~uma rodada inteira re-descobrindo o que o placar já dizia, porque achar e
aplicar moram em agentes diferentes e nada obrigava o achado a virar ticket.

**A mudança de processo (uma):** na integração, **achado confirmado que não foi aplicado no
próprio ramo vira item no `ferramentas/backlog.json` com agente dono, no MESMO commit que
prega a linha do placar.** Linha de placar não se integra com achado órfão — a mesma
disciplina do "reverteu? escreve no PENDENTES no mesmo commit", aplicada ao funil. O QA
CRUZADO (§3.1) herda: re-auditar achado que já tem item aberto é PULADO automático, com o id
do item na justificativa.
| 21/08 pm squads | 1 | 3 | 3 | 0 | 0 | esqueleto das 3 squads no AGENTES.md + QA CRUZADO como par.3.1 do funil (matriz de lentes; quem reprovou re-audita com sonda propria, precedente da 2a volta) + dev-dados RASCUNHO em .claude/agents/ (ativa com fase 1; antes, BLOQUEADO por instrucao propria) + retro par.6 pelo placar: 15 rodadas/117 achados/0,9 por cento desmentido em 21/08, desperdicio nomeado (og:image medido 3x, aplicado 0) e a regra nova — achado confirmado sem dono vira item de backlog no mesmo commit da linha. O achado contra ele: contou 14 rodadas a mao, o grep disse 15, corrigido antes do amend. Nao conferido do worktree (sem MCP la): mesa_agente.squad e os 20 vence_regra — documentados como declarado |
| 21/08 dupla squads | 1 | 4 | 4 | 0 | 0 | dev-plataforma no painel + 2 miudezas + PENDENTES 48. Agrupamento por squad com involucro display:contents criado UMA vez (atualizaAg cacheia card por nome, refresh de 7s) e o portao novo espera um refresh DE VERDADE — com o cache do grupo removido o painel vai a 8 cabecalhos, visto reprovando. Squad do servidor tratada como hostil (lista branca + rotulo local por textContent, envenenada na cena 14). Lost update fechado por hash sha1 dos bytes em disco, POST devolve o hash novo; provado por curl nos 5 casos, inclusive reenvio de base velha -> 409, o incidente de 21/08 reproduzido e barrado. Achado fora do despacho: bloco 30 do encaixe PISCA (5px folga 4, 1 em 3), controle em git stash provou que nao e do diff — PENDENTES 49, dev-jogo. fila-auth 16 cenas, controle 8/8  · aud: growth:PULADO(dashboard e noindex+Disallow no robots e ferramentas/ nao e publicado — nenhuma superficie de descoberta muda) seguranca:PULADO(o diff APLICA os tres consertos que a propria seguranca prescreveu na re-auditoria (N9 palavra certa na poda, N10 toast, N11 diagnostico no BLOCO 1) e trata squad como entrada hostil por lista branca com cena envenenada; a unica pendencia dela e o curl dos cabecalhos POS-deploy, que o plantao executa logo apos o push e registra no diario) qa:PULADO(os 4 portoes por exit code com controle novo visto mordendo 2 defeitos injetados (8 cabecalhos com o cache removido; grupo renascendo); cena 16 conta cards depois de um refresh real de 7,6s) |
| 22/08 dupla f1 | 1 | 4 | 3 | 1 | 0 | dev-plataforma na Avenida A fase 1: conteudo:puxar (REST anonimo, chave publicavel, guarda de deriva de coluna) + conteudo:conferir (diff POR CHAVE, o espelho so dava a primeira) + os 3 JSON versionados 17/181/644 com o metadado real (176 tag_s2, 34 s2_alto, 5 vence_em) e o passo INFORMATIVO no CI com o gatilho de virar portao escrito. O achado que a fase existe para dar: 8 divergencias em 6 chaves, jogo cd5a...bd7e contra banco 2457...c858 (o mesmo hash da carga de 21/08 — o banco esta congelado). O desmentido foi contra o despacho: INDIGENA nao mudou, sao 6 chaves e nao 8 verbetes. 3o achado: autocrlf sujaria os JSON sem um byte mudar -> .gitattributes eol=lf. Caminho VERDE exercitado (hashes convergem em cd5a...bd7e), o que prova que as 8 sao texto e nao formato; autoteste 5/5 exigindo a chave certa. Jogo, src/ e CSP intocados; zero escrita no banco  · aud: seguranca:PULADO(rede nova: NENHUMA — o puxar e script node de leitura REST com a MESMA chave publicavel do dashboard, trava mecanica que recusa chave nao-publicavel, zero escrita; o passo do CI e continue-on-error informativo; CSP do jogo intocada (git diff src/ vazio)) |
| 21-22/08 quarto portal (dev+arte, 2 voltas) | 2 | 4+3 | 7 | 0 | 0 | DE ONDE VEM vira o 4o portao (decisao do dono). O achado do dev apareceu no CONTROLE antes de mudar uma linha: o encaixe piscava no MESMO build (brota .42s + atraso .12s = 540ms de translateY medidos a 420/600ms) — abrirMenuParado() espera as animacoes de verdade e 3 execucoes ficaram byte a byte identicas, espalhamento 7px -> 0 (FECHA o flake do PENDENTES 49 que ja tinha mordido o funil da growth). Oito tabuas nao cabem deitado -> POSTE DE DOIS LADOS (413->225px). A arte julgou por print medido em canvas: retrato e rotulos aprovados; veto de regua na coluna direita FLUTUANDO a 24,5px do mastro — e a causa nao era o vao, era pista assimetrica (centro da caixa fora do centro do vao): pistas iguais + justify-self, agora entra 5,0px dos DOIS lados em 3 larguras. Box de toque das escuras: 44,00 EXATOS, 8/8 no elementFromPoint (os 41-42 que a arte leu eram a PINTURA do inset). PENDENTES 50: 1366x768 corta o poste (pre-existente, fronteira medida ~830px de altura; gatilho por altura e o caminho). Rolagem ZERO nas 8 alturas de retrato  · aud: qa:PULADO(os proprios portoes foram o adversario e morderam 3 vezes na sessao (bloco 30 em 390x568, bloco 21 em 844x390 e 1024x768) + autoteste REGUA_DEFEITO reprovando nas 6 telas + encaixe 3x com numeros identicos; a arte re-julgou com criterio numerico e os 3 numeros dela foram batidos exatos) seguranca:PULADO(nenhuma mudanca de CSP, head, meta, chave ou rede — src/index.html so move um button entre divs e comenta) |
| 22/08 dupla posthog-paginas | 1 | 4 | 3 | 1 | 0 | dev-plataforma nas 5 paginas fora do jogo: evento unico secao-aberta com 1 propriedade, bloco escrito UMA vez (medir-secao.js) e MEDIDA_HOST promovido a constante de 3 consumidores; interruptor no rodape com a MESMA chave de localStorage do jogo (uma origem, uma decisao) e a frase que o torna verdadeiro. Portao novo medir-paginas.js: 187 verificacoes, 3 controles vistos reprovando, adblock/503/mudo = 1 pedido e 0 erro, desligado = 0 pedido, ja-desligado = 0 gravacao. O desmentido foi contra o proprio instrumento (2.1): reprovou 5x acusando sorteio de id com a medicao desligada — pelo caminho da PESSOA o id nasce na carga anterior ao botao; virou a cena 4b com o estado posto antes da carga. Achados fora do despacho: gerar-territorio.js morria com ENOENT em worktree e as paginas publicadas estavam VELHAS (historia/ com o PRODES pre-21/08 — esta rodada as pos em dia). CSP das paginas NAO foi aberta porque nao existe, verificado por grep; src/ e a CSP do jogo intocados  · aud: growth:PULADO(cartao do territorio identico (68 KB, 5/5 pinos, botao removido do screenshot antes do print); nenhuma URL, og: ou title mudou — o diff das paginas e rodape + script; e o proprio achado da growth (og:image faltando) e o PROXIMO item da fila, nao este) seguranca:PULADO(a mudanca APLICA o par.3 a risca e o portao prova campo a campo: corpo exatamente [ip,lib,process_person_profile,secao], chave phc_ e host byte a byte iguais aos do jogo, credentials omit, sem cookie, desligado=0 pedidos, ja-desligado=0 gravacao; CSP do jogo intocada (git diff src/ vazio) e nas paginas nao existe CSP para abrir (grep=0)) qa:PULADO(portao proprio com 187 verificacoes e 3 controles vistos reprovando (propriedade a mais 3x, interruptor que nao desliga, teto em laco); os 4 portoes verdes por exit real) |
| 22/08 dupla og-image-secoes | 1 | 3 | 3 | 0 | 0 | dev-plataforma fechou o achado que a growth mediu 3x e ninguem aplicava: historia/glossario/de-onde-vem ganharam og:image+twitter:card, cartao 1200x630 printado da PROPRIA pagina (66/67/74 KB, meta <=90; territorio 68 inalterado), molde escrito UMA vez em cartao-secao.js e URL sempre da BASE. Os 3 jpg reproduzem byte a byte (sha1 identico em 2 execucoes). O achado do dia foi contra o proprio portao: document.fonts.check responde TRUE com a folha do Google removida — pergunta se da para desenhar, nao se a familia existe; trocado por enumeracao em status loaded e o controle passou a morder. Portao cartao-controle.js em 2 partes (4 defeitos + controle negativo; dist servido e dimensao lida do SOF do JPEG). 45 verificacoes. Bloco 14 NAO mordeu e nao foi mexido — ele le o head do JOGO, verificado por exit real  · aud: growth:PULADO(a entrega E o achado da growth aplicado (og:image faltando nas 3, medido por curl em 3 rodadas dela); cartoes com URL saindo da BASE e cobranca img==BASE+slug no portao; nenhuma outra superficie de descoberta muda) qa:PULADO(portao proprio com 45 verificacoes, 4 defeitos injetados + 1 controle negativo vistos mordendo, e a parte B confere por HTTP com dimensao lida do SOF; npm test, encaixe e medir-paginas verdes por exit real) |
| 22/08 dupla link-jogo | 1 | 3 | 3 | 0 | 0 | dev-jogo fecha link-jogo-plataforma + PENDENTES 51. A saida e UMA (CHEGADA, nota de margem depois do VOLTAR PARA A RUA, endereco por location.host); o menu foi recusado por argumento escrito. O achado contra o DESPACHO: protocolo http nao basta — o Capacitor serve o jogo em https://localhost e la a raiz E o jogo; a guarda virou http + pathname != raiz, as duas vistas mordendo em controle. O achado da 1a versao veio na tela LARGA: atravessando as 3 colunas, 1366x768 ia de rolagem 0 para 66; encostada na coluna das portas custa ZERO. 3o: o build recusa href= na saida, por isso o link nasce por setAttribute. PENDENTES 51 medido pelo caminho da pessoa (14->16 linhas) com controle em git stash. Nota do funil: 1a tentativa recusada por 1 assercao de encaixe que nao reproduz (mesma familia do flake da growth em 21/08); se repetir, investigacao antes de 3a tentativa  · aud: qa:PULADO(os portoes por exit code foram o adversario, com os 2 controles do proprio link vistos escondendo-a (file:// e raiz) e controle em git stash separando o preco; encaixe bloco 8 verde sem assercao tocada) seguranca:PULADO(diff nao toca CSP, head, meta, chave nem rede: ancora same-origin para a raiz com target _self, e o build ja recusa href externo; grep de connect-src/posthog/fetch no diff de src/ = 0) |
