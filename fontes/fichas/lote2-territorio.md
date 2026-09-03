# Fichas de fonte — LOTE 2 do território (03/09)

Pesquisadora de fontes, squad ACERVO. Plantão da nuvem, máquina `nuvem-20260903T2022`.
Seis pinos com `[conferir]` pendente em `territorio/PINOS-PROPOSTA.md`. Regra que segue
valendo do lote 1: **aprovação do dono e conferência da fonte são duas condições separadas.**
Eu leio e tabelo; a decisão de manter, cortar ou reescrever a frase do pino é do historiador,
com esta ficha na mão; a representação é do dono.

---

## ⚠ AVISO DE MÉTODO — LEIA ANTES DE USAR QUALQUER CITAÇÃO DESTA FICHA

**Nesta máquina não foi possível abrir NENHUMA fonte primária externa.** O egress proxy nega
todo host. Verificado com sete hosts distintos, por duas ferramentas independentes
(`curl` e a ferramenta de fetch), todos com a mesma resposta:

| host tentado | ferramenta 1 (`curl`) | ferramenta 2 (fetch) |
|---|---|---|
| `www.planalto.gov.br` | `CONNECT tunnel failed, response 403` | `EGRESS_BLOCKED` |
| `www2.camara.leg.br` | — | `EGRESS_BLOCKED` |
| `www.lexml.gov.br` | — | `EGRESS_BLOCKED` |
| `legislacao.presidencia.gov.br` | — | `EGRESS_BLOCKED` |
| `whc.unesco.org` | — | `EGRESS_BLOCKED` |
| `portal.iphan.gov.br` | — | `EGRESS_BLOCKED` |
| `agenciabrasil.ebc.com.br` | — | `EGRESS_BLOCKED` |
| `en.wikipedia.org` (controle) | — | `EGRESS_BLOCKED` |

O `/root/.ccr/README.md` é explícito: *"The destination host is not allowed by your
organization's egress policy for this session. Do not retry or route around it — report the
blocked host."* Não contornei. **Consequência: nenhum PDF pôde ser baixado e fatiado com
`pdftotext`, que é a disciplina do lote 1.** Só a busca web respondeu, e a saída dela é texto
mediado por um modelo — nunca a fonte.

**Por isso esta ficha carimba GRAU DE EVIDÊNCIA em cada citação, e o carimbo é a parte que
não se pode ignorar:**

- **[A] LIDO POR MIM, LITERAL** — está num arquivo deste repositório que eu abri. Traz
  `arquivo:linha`. É o único grau em que aspas são aspas conferidas por mim.
- **[B] VERIFICADO EM RODADA ANTERIOR** — citação literal registrada no `NOTES.md` por quem
  conseguiu abrir a fonte, com procedência. Rastreável, mas **segunda mão**: eu li o registro,
  não o original.
- **[C] DEVOLVIDO POR BUSCADOR, NÃO VERIFICADO NA FONTE** — indício convergente. **Nunca entra
  entre aspas como citação literal** e **nunca sustenta sozinho um `CONFERIDO`.**

Nenhum veredito `CONFERIDO` desta ficha se apoia só em [C]. Onde só havia [C], o veredito diz
o que falta e a quem cabe reabrir. Paráfrase dentro de aspas foi o erro mais caro já achado no
jogo (21/08) — o carimbo existe para que ele não possa acontecer por descuido de leitura.

---

## ⚠ DESTAQUE 1 — A PREMISSA DO DESPACHO ESTÁ ERRADA, E ISSO MUDA A URGÊNCIA

O despacho diz que D1, D2 e D5 "**JÁ ESTÃO NO JOGO** — o jogo já afirma isso em produção hoje,
então um `[conferir]` pendente ali não é preparação, é uma afirmação não verificada no ar".

**Medido, não suposto.** Nenhum dos três textos candidatos está em produção:

```
grep -c "maior parte das pessoas escravizadas"  src/jogo.ts → 0
grep -c "maior parte das pessoas escravizadas"  index.html  → 0   (produção)
grep -o '"texto"' territorio/index.html                     → 0 ocorrências
```

O que está em produção em `territorio/index.html` é o objeto `D.pontos`: **coordenada, UF,
cidade, `onde`, e o rótulo do capítulo** (`PALMARES`, `O CAIS QUE VOLTOU À LUZ`, `A PEQUENA
ÁFRICA`). **Nenhum pino carrega frase.** O que a proposta chama de "JÁ NO JOGO" é o PINO, não
o TEXTO — e o próprio cabeçalho do `PINOS-PROPOSTA.md` já dizia isso: *"**Nada daqui está no
jogo.**"* [A] `territorio/PINOS-PROPOSTA.md:6`.

**Consequência prática, e ela é boa:** os três não são incêndio em produção. São preparação,
como os outros três. **Nada aqui precisa de correção de emergência na `main`.**

---

## ⚠ DESTAQUE 2 — O QUE ESTÁ MESMO EM PRODUÇÃO E TEM ATRITO COM ESTES PINOS

Isto sim eu medi no `index.html` da raiz (o arquivo que a Vercel publica). As cinco frases
abaixo estão no ar **hoje**, e **três dos seis pinos candidatos as contradizem**:

| frase em produção (`grep -c` no `index.html` da raiz = 1 em todas) | pino que atrita |
|---|---|
| *"Parte das fontes data o tombamento de 1985, e o jogo não escolhe entre as duas."* | **D1** afirma "desde 1986", seco — desfaz a divergência que o jogo escolheu manter |
| *"Veio do movimento negro, não do Estado."* (sobre o 20 de novembro) | **D1** escreve "a data da morte dele virou o dia da consciência do país" — voz passiva, sujeito apagado |
| *"escavação coordenada por Tania Andrade Lima"* | **D2** escreve "as obras do porto o reencontraram" — tira a arqueóloga que o jogo nomeia |
| *"chamava este pedaço de cidade de Pequena África"* | **D5** escreve "O nome é de Heitor dos Prazeres" — afirmação de autoria mais forte que a de produção |
| *"Em 10 de julho de 2017 o cais do Valongo entrou na lista do Patrimônio Mundial pelo critério vi"* | **D2** só diz "desde 2017" — sem atrito, mas ver a nota de data na ficha 2 |

**O atrito não é erro do jogo: é erro do pino.** Em quatro dos cinco casos o texto EM PRODUÇÃO
é o mais rigoroso, e o pino candidato é o que afrouxa. Isso é o achado central deste lote.

---

# FICHA 1 — D1. Serra da Barriga, Palmares (União dos Palmares, AL)

**Texto candidato do pino** [A] `territorio/pinos-proposta.json:36`:
> "Aqui de cima, Palmares governou a si mesmo por quase um século. A Serra da Barriga é
> tombada pelo IPHAN desde 1986 e é Patrimônio Cultural do Mercosul. Zumbi está no Livro dos
> Heróis e Heroínas da Pátria, e o 20 de novembro é feriado nacional por lei — a data da morte
> dele virou o dia da consciência do país."

O pino faz **cinco** afirmações separáveis. Cada uma vai abaixo com a sua própria fonte.

---

### 1.1 — "governou a si mesmo por quase um século"

**Obra/documento:** o próprio `NOTES.md` deste repositório, seção "O que a revisão NÃO mudou,
e por quê" (revisão do historiador, 20/08).
**Autoria:** registro interno, citando **Flávio dos Santos Gomes** e **Silvia Hunold Lara**.
**Ano:** registro de 20/08/2026; a bibliografia citada é de 2005–2015.
**Edição consultada:** o arquivo no ramo.
**Onde:** `NOTES.md:8052–8058`.

**Citação literal [A]:**
> "**PALMARES, "a partir de mais ou menos 1630"** (a abertura 2 e o verbete PALMARES dizem o
> mesmo). **Flávio dos Santos Gomes** registra que as primeiras referências documentais a
> Palmares são de **1597**, e que há menção a um quilombo na região em **1580**; mas **Silvia
> Hunold Lara** data em 1630–1654 a consolidação da REDE de mocambos que ficou conhecida como
> Palmares"

**O que a fonte NÃO diz:** o registro **não fecha uma duração**. Ele dá três marcos de início
concorrentes (1580 · 1597 · 1630) e um de fim (1694), e não escolhe. Nenhuma das duas
autorias citadas é apresentada afirmando "quase um século".

**A conta, que é o ponto:** com o marco que o **jogo usa em produção** — "a partir de mais ou
menos 1630" — dá **64 anos**. "Quase um século" só se sustenta partindo de 1597 (97 anos) ou
1580 (114, e aí já não é "quase"). **O pino escolhe, calado, o marco mais longo — e é um marco
que o jogo não usa.**

**[C]** A busca devolve tanto "aproximadamente um século" (material de divulgação sobre a
certificação Mercosul) quanto "surgiu por volta de 1630 e resistiu até 1694". A divergência
existe fora do jogo também; não é invenção do pino, é uma escolha não declarada.

**Lugar de fala:** o registro é interno e cita duas pesquisadoras do período (Gomes, Lara).
**Não há narrador pessoal**, e não deveria haver: é datação documental. Para a
**interpretação** de Palmares o jogo já usa **Beatriz Nascimento** (autoria negra) — ver 1.5.

**Veredito: COM AJUSTE.**
Frase exata a mudar: **"Palmares governou a si mesmo por quase um século"**.
Por quê: contradiz, sem dizer, o marco de 1630 que o próprio jogo afirma em produção. Ou o
pino se alinha ao jogo, ou o jogo muda junto — e a segunda opção não é do historiador sozinho,
porque mexe em texto de abertura de capítulo. **Não escolho: ver a pergunta 2 no fim.**

---

### 1.2 — "tombada pelo IPHAN desde 1986"

**Obra/documento A (o que o jogo diz hoje):** `src/jogo.ts`, verbete SERRA DA BARRIGA.
**Onde:** `src/jogo.ts:13248` (e confirmado 1× no `index.html` da raiz, produção).

**Citação literal [A]:**
> "Está tombada pelo IPHAN desde 1986 e abriga o Parque Memorial Quilombo dos Palmares. Entre
> a destruição e o tombamento passaram-se quase três séculos. **Parte das fontes data o
> tombamento de 1985, e o jogo não escolhe entre as duas.**"

**Obra/documento B (a pendência antiga):** `NOTES.md`.
**Onde:** `NOTES.md:514–515` e `NOTES.md:5557–5560`.

**Citações literais [A]:**
> "**Tombamento da Serra da Barriga:** 1985 (Fundação Palmares) × 31/01/1986 (outras fontes).
> A página do IPHAN não abriu. Verificar antes de usar." (`NOTES.md:514`)

> "**SERRA DA BARRIGA** — **a pendência antiga do NOTES.md ficou quase resolvida.** As páginas
> do IPHAN e da Fundação Cultural Palmares convergem em **31/01/1986** [...] O verbete diz 1986
> e registra a outra data — recomendo **manter o `dv`** até alguém abrir o processo do IPHAN."
> (`NOTES.md:5557`)

**O que consegui avançar [C], e é avanço real:** a busca devolve o **número do processo**, que
é exatamente o que o `NOTES.md` pedia — **1069-T-82** (partes 1 e 2), inscrição em **02/1986**
no *Livro do Tombo Arqueológico, Etnográfico e Paisagístico* **e** no *Livro do Tombo
Histórico*, com a data de **31 de janeiro de 1986**. Fonte indicada pela busca: a *Lista de
Processos de Tombamento* do IPHAN (PDF em `portal.iphan.gov.br`) e a página
`portal.iphan.gov.br/pagina/detalhes/895/`.

**O que a fonte NÃO diz — e é a razão de a pendência NÃO fechar:** **eu não abri o processo
1069-T-82 nem a lista do IPHAN.** O host está bloqueado (ver aviso de método). O número é [C].
A condição que o `NOTES.md:5559` pôs — *"até alguém abrir o processo do IPHAN"* — **continua
não cumprida**. O que mudou é que a próxima pessoa já sabe o que procurar: um número, não uma
página.

**Lugar de fala:** institucional (IPHAN, FCP). Vale para o DADO. Sem narrador pessoal.

**Veredito: COM AJUSTE.**
Frase exata a mudar: **"A Serra da Barriga é tombada pelo IPHAN desde 1986"**.
Por quê: o pino afirma seco o que o jogo, em produção e de propósito, se recusa a fechar. Um
pino não pode ser menos cuidadoso que o verbete que ele aponta. Ou o pino carrega a ressalva,
ou o processo 1069-T-82 é aberto por uma máquina com egress e a divergência morre nas duas
telas ao mesmo tempo.

---

### 1.3 — "é Patrimônio Cultural do Mercosul"

**Obra/documento:** dossiê de candidatura *Serra da Barriga — Quilombo dos Palmares a
patrimônio cultural do Mercosul*, Biblioteca Digital do IPHAN
(`bibliotecadigital.iphan.gov.br`), e a página institucional
`portal.iphan.gov.br/pagina/detalhes/1607/` — **"Serra da Barriga (AL), Região do Quilombo dos
Palmares"**, que é a designação oficial.
**Autoria:** IPHAN / Reunião de Ministros da Cultura do Mercosul. Sem autoria pessoal.
**Ano:** 2017.
**Edição consultada:** NENHUMA — hosts bloqueados.
**Onde:** não localizado (não abri).

**Citação literal:** **não tenho.** Nada aqui pode ir entre aspas.

**[C]** Convergem, em fontes independentes que a busca devolveu: IPHAN (notícia
`detalhes/4409`, *"Serra da Barriga (AL) receberá certificação de Patrimônio Cultural do
MERCOSUL"*), Agência Brasil (matéria de 11/2017), CNM, e um artigo na *RELACult*. Uma fonte
diz "maio de 2017" e a matéria da Agência Brasil é de **novembro de 2017** — pode ser a
diferença entre o **ato** e a **entrega da certificação**, e eu não sei qual é qual.

**O que a fonte NÃO diz:** não sei se o ato de 2017 recai sobre **a Serra da Barriga** ou sobre
**"a Região do Quilombo dos Palmares"** — os títulos que a busca devolve usam as duas formas, e
o dossiê tem a segunda. O pino usa a primeira. **Isso importa** porque a Região é mais ampla
que a Serra.

**Lugar de fala:** institucional multilateral. Sem narrador pessoal.

**Veredito: COM AJUSTE.** Não por erro provado, mas porque **o `[conferir ata]` do pino
continua aberto** e agora com uma pergunta a mais (Serra × Região). Frase exata a mudar:
**"e é Patrimônio Cultural do Mercosul"** — não entra até alguém abrir o dossiê na Biblioteca
Digital do IPHAN e confirmar (a) a data do ato e (b) o objeto exato do reconhecimento.

---

### 1.4 — "Zumbi está no Livro dos Heróis e Heroínas da Pátria"

**Obra/documento:** BRASIL. *Lei nº 9.315, de 20 de novembro de 1996.*
**Autoria:** Congresso Nacional / Presidência da República. Norma federal, sem autor pessoal.
(Autoria do projeto atribuída [C] à senadora Benedita da Silva.)
**Ano:** 1996.
**Edição consultada:** NENHUMA — `planalto.gov.br` e `camara.leg.br` bloqueados.
**Onde:** ementa e art. 1º.

**Texto devolvido pelo buscador [C] — NÃO É CITAÇÃO CONFERIDA:**
ementa *"Inscreve o nome de Zumbi dos Palmares no Livro dos Heróis da Pátria"*; art. 1º
comemorando o **tricentenário da morte** e inscrevendo o nome no **"Livro dos Heróis da
Pátria"**, no Panteão da Liberdade e da Democracia.

**O que a fonte NÃO diz — e este é o achado fino desta ficha:** a lei de 1996 **não usa** a
expressão *"Livro dos Heróis **e Heroínas** da Pátria"*. Ela diz **"Livro dos Heróis da
Pátria"**. O acréscimo de "e das Heroínas" veio **depois**, por outra lei [C: **Lei nº
13.408/2017**, que teria mudado a denominação para *"Livro dos Heróis e das Heroínas da
Pátria"*; e a **Lei nº 14.984/2024** reorganizou o livro].

**Duas consequências, e a segunda é a que morde:**
1. Como **afirmação no presente** ("Zumbi *está* no Livro dos Heróis e Heroínas da Pátria"), o
   pino está certo: é o nome atual do livro.
2. Mas a **linha de fonte** do pino oferece a Lei nº 9.315/1996 como quem sustenta aquele
   nome — e ela não sustenta. Quem sustenta o NOME é a lei de 2017, que o pino não cita.
   **Fonte que não diz o que a linha de fonte promete é o defeito que o lote 1 achou na Lei
   Complementar 20/1974** (a lei da fusão não falava da baía). É o mesmo defeito, outro pino.

Nota de forma: o pino escreve "Heróis e Heroínas"; a denominação que a busca devolve é "Heróis
**e das** Heroínas". Não confirmo qual é a do texto legal vigente — não abri.

**Lugar de fala:** norma jurídica, institucional. Vale para o dado. Sem narrador pessoal.

**Veredito: COM AJUSTE.** Frase exata a mudar: não a do pino, e sim **a linha de fonte** —
"Lei nº 9.315/1996" precisa vir acompanhada da lei que renomeou o livro, ou o pino escreve
"Livro dos Heróis da Pátria", que é o que a lei citada diz. **Não escolho entre as duas.**

---

### 1.5 — "o 20 de novembro é feriado nacional por lei — a data da morte dele virou o dia da consciência do país"

**Obra/documento A:** `src/jogo.ts`, verbete DIA DA CONSCIÊNCIA NEGRA — **em produção**.
**Onde:** `src/jogo.ts:13274–13276`; confirmado 1× no `index.html` da raiz.

**Citação literal [A]:**
> "A data — 20 de novembro, dia da morte de Zumbi — foi proposta por militantes do Grupo
> Palmares, em Porto Alegre, no início dos anos 1970, e assumida pelo Movimento Negro
> Unificado em 1978. **Veio do movimento negro, não do Estado.**"

> "É escolha de calendário com argumento dentro: em vez do 13 de maio, dia em que alguém
> assinou uma lei, o 20 de novembro marca o dia em que mataram quem tinha construído a própria
> liberdade. Virou data nacional em 2011 e feriado nacional em 2023."

**Obra/documento B:** Lei nº 12.519/2011 e Lei nº 14.759/2023.
**Onde:** citadas em `src/jogo.ts:13276` e reverificadas na revisão de 20/08 —
`NOTES.md:8070` [A]: *"Lei nº 12.519/2011 e Lei nº 14.759/2023 (data nacional e feriado)"*.
Grau [B]: verificadas por quem tinha egress, não por mim.

**O que a fonte NÃO diz:** nenhuma das duas leis diz que "a data virou o dia da consciência do
país" por ato próprio. **As leis RECONHECERAM uma data que o movimento negro já tinha
escolhido** — é literalmente o que o jogo faz questão de afirmar em produção.

**O problema do pino é de SUJEITO, não de fato.** "a data da morte dele virou o dia da
consciência do país" é voz passiva sem agente. Quem fez virar? O pino não diz, e num pino que
começa em "por lei" o sujeito implícito que sobra é o Estado — exatamente o contrário do que o
verbete em produção afirma. Isso não é preciosismo de estilo: o §2 do `CLAUDE.md` manda que
"o protagonismo é de quem foi escravizado", e apagar o Grupo Palmares e o MNU da frase é
devolver o protagonismo a quem assinou a lei.

**Lugar de fala:** **PLENO na interpretação.** A fonte de interpretação de Palmares no jogo é
**Beatriz Nascimento** — autoria negra, e a intelectual que formulou o conceito de quilombo
como continuidade e não como ruína. `NOTES.md:558` [A]: *"Beatriz Nascimento, 'O conceito de
quilombo…' (1985; org. Ratts, Zahar, 2021) para Palmares"*. Para o DADO (leis, tombamento):
institucional.

**Veredito: COM AJUSTE.** Frase exata a mudar: **"a data da morte dele virou o dia da
consciência do país"**. Por quê: apaga quem escolheu a data, e o jogo já afirma em produção,
com todas as letras, que "veio do movimento negro, não do Estado".

---

**VEREDITO DA FICHA 1 (D1): COM AJUSTE** — quatro ajustes (1.1, 1.2, 1.3, 1.5) e uma correção
de linha de fonte (1.4).

---

# FICHA 2 — D2. Cais do Valongo (Rio de Janeiro, RJ)

**Texto candidato do pino** [A] `territorio/PINOS-PROPOSTA.md:346–349`:
> "Por estas pedras entrou a maior parte das pessoas escravizadas trazidas às Américas num
> único porto. O Valongo ficou aterrado e esquecido até 2011, quando as obras do porto o
> reencontraram. Desde 2017 é Patrimônio Mundial — do tipo que existe para nunca mais."

---

### 2.1 — "a maior parte das pessoas escravizadas trazidas às Américas num único porto"

**Obra/documento A (a que o repositório já verificou):** LIMA, Tânia Andrade; SENE, Glaucia
Malerba; SOUZA, Marcos André Torres de. *Em busca do Cais do Valongo, Rio de Janeiro, século
XIX.* **Anais do Museu Paulista**, v. 24, n. 1, 2016.
**Autoria:** Tânia Andrade Lima é a arqueóloga que **dirigiu a escavação** do sítio —
pesquisadora com relação direta e continuada com o objeto.
**Ano:** 2016 (artigo); campo de 2011.
**Edição consultada:** não por mim. Citada literalmente no `NOTES.md`.
**Onde:** `NOTES.md:4927–4928`.

**Citações literais [B] — verificadas em rodada anterior, com procedência:**
> "fazendo do Rio de Janeiro o **principal porto de entrada** desses cativos nas Américas"

> "Durante o período conhecido de funcionamento do Cais do Valongo, entre 1811 e 1831, o Rio
> de Janeiro recebeu **cerca de 550 mil africanos** para serem escravizados"

**Obra/documento B:** UNESCO, inscrição do *Valongo Wharf Archaeological Site*, 2017,
critério (vi).
**Edição consultada:** NENHUMA — `whc.unesco.org` bloqueado.
**[C]** A busca devolve, como conteúdo do enunciado de Valor Universal Excepcional: estimativa
de **500 mil a 1 milhão** de pessoas escravizadas desembarcadas no Valongo — *"more than at
any other single site in the Western Hemisphere"* — e o critério (vi) descrevendo o sítio como
a mais importante evidência física da chegada de africanos escravizados ao continente
americano. **Não são aspas conferidas; é o que o buscador devolveu.**

**O que a fonte NÃO diz — e este é o achado maior do lote:**
**Nenhuma das duas fontes afirma "a maior parte das pessoas escravizadas trazidas às
Américas".** O que a fonte sustenta é **"mais que qualquer outro ponto único de desembarque"**
— superlativo entre PORTOS, não fração do TOTAL.

A diferença é de ordem de grandeza. O total desembarcado nas Américas está na casa dos
milhões — o próprio `NOTES.md` registra, na revisão de 06/08 [A] `NOTES.md:522`, que
*"o total de ~4,9 milhões de desembarcados"* se refere ao **Brasil** e ao período inteiro do
tráfico, com fonte no *Trans-Atlantic Slave Trade Database*. Contra isso, os 500 mil a 1 milhão
do Valongo **não são "a maior parte"** de nada; são o maior pedaço de um porto só.

A frase do pino é ambígua entre duas leituras — (i) "a maior parte de todas as pessoas trazidas
às Américas entrou aqui" (falsa) e (ii) "aqui entrou mais gente do que em qualquer porto único"
(verdadeira). **Num pino de mapa, lido em três segundos, a leitura que ganha é a primeira.**
O jogo já tem, em produção, a formulação certa e mais forte: *"principal porta de entrada"*.

**Nota de método que o repositório já pagou [A] `NOTES.md:7437`:** *"Recusado por falta de
fonte lida, e fica registrado: 'único sítio das Américas inscrito por esse motivo', sobre o
Valongo. Circula, e eu não li o documento que afirma. Não entrou."* O pino não usa essa frase —
mas cai no mesmo tipo de superlativo circulante, e desta vez ninguém segurou.

**Veredito: COM AJUSTE.** Frase exata a mudar: **"Por estas pedras entrou a maior parte das
pessoas escravizadas trazidas às Américas num único porto."** Substituto disponível e já
verificado no repositório, sem inventar nada: a formulação **"principal porto de entrada
desses cativos nas Américas"** (Anais do Museu Paulista, literal, `NOTES.md:4927`).

---

### 2.2 — "ficou aterrado e esquecido até 2011, quando as obras do porto o reencontraram"

**Obra/documento:** a mesma (Lima, Sene & Souza, 2016), via `NOTES.md:4929` e `NOTES.md:4932`.

**Citações literais [B]:**
> "as obras de construção do Cais da Imperatriz **tão somente recobriram** o velho Cais do
> Valongo"

> "E o Valongo foi trazido de volta, exatamente duzentos anos depois, em 2011"

**Comparar com o que o jogo diz em produção** [A] `src/jogo.ts:13148`, confirmado no
`index.html` da raiz:
> "UNESCO, Cais do Valongo, inscrição de 2017 · **escavação coordenada por Tania Andrade
> Lima**, Museu Nacional / UFRJ, 2011"

E `NOTES.md:4932` [A]: *"escavação dirigida por **Tânia Andrade Lima**"*.

**O que a fonte NÃO diz — dois pontos:**
1. **"aterrado"** não é o que a fonte diz. A fonte diz **recoberto** — por outro cais (o Cais
   da Imperatriz, 1843). Aterro e recobrimento não são a mesma operação, e o capítulo O CAIS
   ensina exatamente essa distinção (`NOTES.md:4929`: *"o Valongo **coberto**, não destruído"*).
2. **"as obras do porto o reencontraram"** atribui a agência às OBRAS. A fonte atribui a uma
   **escavação arqueológica dirigida por uma pesquisadora nomeada**. O jogo nomeia Tânia
   Andrade Lima em produção; o pino a apaga e põe uma obra pública no lugar dela. É apagamento
   de autoria de pesquisa — e, sendo uma pesquisadora mulher, é o tipo de apagamento que a
   condição de 19/08 do dono existe para não repetir.

**Lugar de fala:** Tânia Andrade Lima é **pesquisadora do período com vínculo direto e
continuado ao sítio** (dirigiu a escavação e assina o relatório). Não é lugar de fala no
sentido do §2 (vivência/pertencimento), e a ficha não a apresenta como tal. A interpretação do
capítulo tem autoria negra registrada à parte — ver `NOTES.md:640` [A]: *"**Pós-abolição /
Pequena África:** Beatriz Nascimento (org. Ratts, 2021); Lélia Gonzalez"*.

**Veredito: COM AJUSTE.** Frase exata a mudar: **"O Valongo ficou aterrado e esquecido até
2011, quando as obras do porto o reencontraram."** Dois motivos, ambos com fonte no
repositório: *recoberto*, não *aterrado*; e a escavação tem autora, que o jogo já nomeia.

---

### 2.3 — "Desde 2017 é Patrimônio Mundial"

**Obra/documento:** ONU Brasil, página da inscrição — fonte já lida em rodada anterior.
**Onde:** `NOTES.md:4933` [A/B]:
> "**10 de julho de 2017**, Patrimônio Mundial, **critério vi** [...] ONU Brasil, página da
> inscrição: a data e o critério *"acontecimentos e tradições vivas, ideias ou crenças, obras
> artísticas e literárias de significação universal excepcional"*"

Em produção [A] `src/jogo.ts:12019`: *"Em 10 de julho de 2017 o cais do Valongo entrou na lista
do Patrimônio Mundial pelo critério vi"*.

**O que a fonte NÃO diz / divergência registrada, não resolvida:** a busca [C] devolve **9 de
julho de 2017** para a decisão do Comitê (41ª sessão, Cracóvia), contra os **10 de julho** da
ONU Brasil que o jogo usa. **Não escolho**, e o pino não precisa que se escolha: ele diz só
"desde 2017". **Mas o texto do capítulo diz "10 de julho", e essa divergência fica aqui
registrada para a próxima máquina com egress abrir a decisão 41 COM 8B.13 e fechar.**

**Veredito: CONFERIDO.** "Desde 2017" bate com todas as fontes, sem exceção. O ano não está em
disputa; só o dia, que o pino não afirma.

---

### 2.4 — "do tipo que existe para nunca mais"

Frase autoral, sem afirmação factual a conferir. Não avalio — é do historiador.
**Nota do §2.4, item 4:** o pino não menciona o Cemitério dos Pretos Novos, e está certo.
A trava é absoluta e o repositório a registra por extenso [A] `NOTES.md:4937`. Se alguma
versão futura do pino puxar o cemitério para dentro, ele volta a esta ficha, não para o jogo.

---

**VEREDITO DA FICHA 2 (D2): COM AJUSTE** — dois ajustes (2.1, 2.2), um `CONFERIDO` (2.3).

---

# FICHA 3 — D5. Pequena África (Rio de Janeiro, RJ)

**Texto candidato do pino** [A] `territorio/PINOS-PROPOSTA.md:377–379`:
> "Entre a Saúde, a Gamboa e a Praça Onze viveu a Pequena África: o chão onde o pós-abolição
> inventou futuro — trabalho, terreiro, samba. O nome é de Heitor dos Prazeres, que era de lá."

O pino traz, na linha de fonte, um `[conferir]` autoconsciente: *"conferir lá se a atribuição
do nome a Heitor dos Prazeres já está firmada com fonte; se não estiver, a frase cai"*.
**Esta ficha responde essa pergunta, e a resposta é "está firmada — mas mais fraca do que o
pino a escreve".**

---

### 3.1 — a atribuição do nome

**Obra/documento A:** Sesc São Paulo, material sobre a Pequena África.
**Obra/documento B:** Observatório do Patrimônio (Rio).
**Obra/documento C (a que as duas apontam):** MOURA, Roberto. *Tia Ciata e a Pequena África no
Rio de Janeiro.* 1ª ed. Rio de Janeiro: Funarte, 1983.
**Onde:** `NOTES.md:5112`.

**Citações literais [B] — lidas por quem tinha egress, registradas com procedência:**
> Sesc SP: "Heitor dos Prazeres (1898-1966)… **usou este termo**"

> Observatório do Patrimônio: "**cunhado segundo consta** pelo sambista e pintor, Heitor dos
> Prazeres"

E a nota da mesma linha [A]: *"As duas apontam o livro de Roberto Moura como o que
popularizou"*.

**Em produção, o jogo escreve isto** [A] `src/jogo.ts:2257`, confirmado no `index.html`:
> "O compositor Heitor dos Prazeres **chamava** este pedaço de cidade de Pequena África, e o
> nome ficou."

E na tela FONTES [A] `src/jogo.ts:12768–12769`:
> "O livro que fixou o nome do território. **A expressão é de Heitor dos Prazeres** (1898–1966),
> sambista e pintor, e cobre a zona portuária: Saúde, Gamboa, Santo Cristo, os morros e a Praça
> Onze."

**O que a fonte NÃO diz:** **nenhuma das duas fontes documenta a cunhagem.** Uma diz que ele
*usou* o termo; a outra diz *"segundo consta"* — que é, em português, a marca explícita de
atribuição não documentada. Não há, no material que o repositório guarda, um registro de
primeira mão (gravação, entrevista, texto dele) em que Heitor dos Prazeres cunhe ou reivindique
o nome. **A fonte sustenta uso e atribuição corrente; não sustenta autoria provada.**

Isso importa porque o repositório já tratou exatamente este tipo de caso com uma régua própria,
e a régua está escrita [A] `NOTES.md:5562` (sobre a etimologia de "Valongo"): *"a derivação de
'vale longo' é **atribuída, sem atestação firme**"* — e o verbete foi marcado por isso. O mesmo
padrão vale aqui.

---

### 3.2 — "que era de lá"

**Obra/documento:** Enciclopédia Itaú Cultural, verbete *Heitor dos Prazeres*; MultiRio
(Prefeitura do Rio); Museu de Arte do Rio.
**Edição consultada:** NENHUMA — não abri nenhuma delas.

**[C]** A busca devolve, convergente em várias páginas: nascido em **23 de setembro de 1898**,
no Rio de Janeiro, na **Rua Presidente Barroso, Cidade Nova** — a região da **Praça Onze**, que
é justamente um dos três lugares que o próprio pino nomeia; morto em 04/10/1966.

**O que a fonte NÃO diz:** **o repositório não tem nada sobre onde ele nasceu ou morou.**
Procurei: `grep` por "Heitor dos Prazeres" devolve seis ocorrências em `src/jogo.ts` e uma no
`NOTES.md`, e **nenhuma menciona naturalidade, endereço ou vínculo territorial**. A frase "que
era de lá" é **acréscimo do pino sem lastro nenhum no repositório**, sustentado hoje só por
[C].

Provavelmente está certa. **Provavelmente não é o grau exigido para um pino entrar** — e o
próprio pino escreveu, na sua linha de fonte, "se não estiver [firmada], a frase cai".

**Lugar de fala:** este é o pino com o **melhor lugar de fala do lote**, e vale dizer por quê:
o nome do território é atribuído a um **homem negro que era compositor e pintor do próprio
território** — Heitor dos Prazeres não é fonte *sobre* a Pequena África, é gente *da* Pequena
África nomeando o próprio chão. Isso é lugar de fala pleno na origem do topônimo. **Mas a
fonte que o repositório tem é institucional (Sesc, Observatório) e bibliográfica (Roberto
Moura, 1983) — nenhuma delas é a voz dele.** A distinção é a mesma da régua de 22/08 do dono
(autoinclusão discursiva em 1ª pessoa): aqui **não há texto dele** no material fichado.
Para a interpretação, o capítulo usa **Beatriz Nascimento** e **Lélia Gonzalez** [A]
`NOTES.md:640` — autoria negra, e o `NOTES.md:5129` [A] registra honestamente o limite:
*"**Beatriz Nascimento escrevendo sobre a Pequena África.** Não achei fonte de que ela tenha
escrito sobre este território especificamente."*

**Veredito: COM AJUSTE.** Duas frases exatas:
1. **"O nome é de Heitor dos Prazeres"** → a fonte sustenta *usou o termo* / *atribuído a ele*,
   não *é dele*. O texto que já está em produção (*"chamava este pedaço de cidade de Pequena
   África, e o nome ficou"*) é mais fiel à fonte do que o do pino, e o pino deveria descer para
   ele em vez de subir.
2. **"que era de lá"** → **cai**, ou entra com fonte própria aberta na origem (Itaú Cultural).
   Não há nada no repositório que a sustente.

---

# FICHA 4 — A2. Tratado de Madri / Guerra Guaranítica (São Gabriel, RS)

**Texto candidato do pino** [A] `territorio/PINOS-PROPOSTA.md:45–47`:
> "Em 1750, Portugal e Espanha trocaram terras no mapa — e os Sete Povos guarani das Missões
> foram mandados a abandonar tudo o que tinham erguido. Eles disseram não. Sepé Tiaraju, que
> liderou essa recusa, está inscrito no Livro dos Heróis e Heroínas da Pátria."

**Linha de fonte do pino** [A] `territorio/PINOS-PROPOSTA.md:48–50`:
> "Tratado de Madri, 13 de janeiro de 1750; **Lei nº 12.032, de 21/10/2009** (inscreve Sepé
> Tiaraju no Livro dos Heróis da Pátria) [conferir texto no Planalto]."

---

### 4.1 — A LEI: número certo, DATA ERRADA

**Obra/documento:** BRASIL. *Lei nº 12.032, de 21 de setembro de 2009.*
**Autoria:** Congresso Nacional / Presidência da República. Norma federal, sem autor pessoal.
Origem [C]: PL 5516/2005.
**Ano:** 2009.
**Edição consultada:** NENHUMA — `planalto.gov.br`, `camara.leg.br` e `lexml.gov.br`
bloqueados (ver aviso de método).
**Onde:** ementa e art. 1º.

**Texto devolvido pelo buscador [C] — NÃO É CITAÇÃO CONFERIDA:**
ementa *"Inscreve o nome de Sepé Tiaraju no Livro dos Heróis da Pátria"*; art. 1º:
*"Em comemoração aos 250 (duzentos e cinquenta) anos da morte de Sepé Tiaraju, será inscrito
no Livro dos Heróis da Pátria, que se encontra no Panteão da Liberdade e da Democracia, o nome
de José Tiaraju, o Sepé Tiaraju, herói guarani missioneiro rio-grandense."*
Publicação: DOU de 22/09/2009.

**O DESMENTIDO, e ele é seco:** o pino diz **21/10/2009**. Todas as referências que a busca
devolveu dizem **21 de setembro de 2009**. A corroboração mais forte não é o texto devolvido —
é o **slug da URL do Legin da Câmara**, que é gerado do metadado da norma e não de prosa:
`lei-12032-21-setembro-2009-591299-norma-pl.html`. **Setembro, não outubro.**

**Ressalva honesta:** eu **não abri** a norma. O que tenho é (i) o slug estrutural da Câmara,
(ii) o texto devolvido pela busca, (iii) a coerência interna (publicação no DOU de 22/09/2009,
um dia depois). São três indícios convergentes e independentes entre si, mas **grau [C]**.
Por isso o veredito abaixo **não é CONFERIDO**: é ajuste sinalizado, a fechar quando uma
máquina com egress abrir `planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l12032.htm`.

**O que a fonte NÃO diz — três coisas, e a terceira é a mais séria:**
1. A lei diz **"Livro dos Heróis da Pátria"**, não *"Heróis e Heroínas"*. Mesmo achado da
   ficha 1.4, e a mesma correção de linha de fonte se aplica.
2. A lei **não menciona o Tratado de Madri, os Sete Povos, a Guerra Guaranítica nem Caaíbaté.**
   Ela comemora um aniversário de morte e inscreve um nome. Todo o resto do pino precisa de
   outra fonte.
3. **A lei NÃO diz que Sepé Tiaraju "liderou essa recusa".** Ela o chama de *"herói guarani
   missioneiro rio-grandense"* — o que é reconhecimento de estatura, não descrição de ato. O
   pino monta a frase de modo que a lei pareça sustentar a liderança ("Sepé Tiaraju, que
   liderou essa recusa, está inscrito no Livro..."), e ela sustenta só a segunda metade.
   **É o defeito do lote 1 outra vez** — a Lei Complementar 20/1974 não falava da baía; a Lei
   12.032/2009 não fala da liderança.

---

### 4.2 — O TRATADO

**Obra/documento:** Tratado de Madri, 13 de janeiro de 1750.
**Edição consultada:** NENHUMA — não abri o texto do tratado em host nenhum.
**Onde:** não localizado.

**[C]** A busca devolve, convergente: a troca da **Colônia do Sacramento** pelos **Sete Povos
das Missões**; os povoados a serem abandonados pelos indígenas, que poderiam levar bens móveis
e semoventes, deixando as benfeitorias das reduções. **Não consegui o texto do artigo** que
estipula isso — a própria busca declarou não tê-lo devolvido.

**O que a fonte NÃO diz:** não sei, e não posso afirmar, se o tratado **nomeia** os Sete Povos
ou se a designação vem do uso posterior; nem qual artigo carrega a cláusula. O pino afirma o
conteúdo da cláusula sem que ela tenha sido lida por ninguém nesta rodada.

---

### 4.3 — LUGAR DE FALA: a lacuna desta ficha

**O pino narra história guarani, e nenhuma das fontes propostas é de autoria guarani.**
A linha de fonte oferece: o tratado (documento colonial, escrito pelas duas coroas), a lei
federal (Estado brasileiro), e o **ISA — Povos Indígenas no Brasil** (organização
não-indígena, ainda que trabalhe com e para povos indígenas, e fonte de referência).

Pela condição de 19/08 do dono — *"quem narra tem lugar de fala sobre o que se narra… povos
originários sobre povos originários"* —, e ela é **condição de aprovação, não preferência**,
esta configuração **não fecha**. Não há aqui um Kopenawa, uma Potiguara, um Munduruku ou uma
autoria guarani-missioneira interpretando a Guerra Guaranítica.

Registro sem resolver, porque não é meu: **a lacuna é de autoria, não de dado.** O dado
(tratado, lei) é institucional e vale. Quem **interpreta** a recusa dos Sete Povos, no material
proposto, são as duas coroas e o Estado que homenageou 253 anos depois.

**Sinalizo um caminho sem escolhê-lo:** o pino cita "Caaíbaté foi um massacre" no campo de
risco. Se o pino for adiante, a fonte de interpretação precisa ser guarani ou de pesquisa
guarani-autorada; enquanto não houver, o pino afirma documento e cala interpretação — que é o
que o jogo já faz nas cartas jesuíticas.

**Veredito: COM AJUSTE.** Três frases exatas:
1. **"Lei nº 12.032, de 21/10/2009"** → **21/09/2009**, publicada no DOU de 22/09/2009. É
   erro de data na linha de fonte, e o `[conferir texto no Planalto]` **não fecha nesta
   máquina** — fecha quando o Planalto abrir.
2. **"Sepé Tiaraju, que liderou essa recusa, está inscrito no Livro..."** → a lei sustenta a
   inscrição e a expressão *"herói guarani missioneiro rio-grandense"*; **não sustenta
   "liderou"**. Ou a liderança ganha fonte própria, ou a frase se separa em duas.
3. **"Livro dos Heróis e Heroínas da Pátria"** → a lei citada diz *"Livro dos Heróis da
   Pátria"*. Mesma correção de linha de fonte da ficha 1.4.

---

# FICHA 5 — D16. Revolta da Chibata (Baía de Guanabara, RJ)

**Texto candidato do pino** [A] `territorio/PINOS-PROPOSTA.md:502–505`:
> "Em novembro de 1910, marinheiros — quase todos negros, muitos filhos da geração da abolição
> — tomaram os maiores navios de guerra do país aqui na baía, contra o castigo da chibata que a
> Marinha ainda aplicava. A exigência era uma: parar de açoitar. O país teve de ouvir."

**Estado do repositório:** `grep -n "Chibata\|João Cândido\|Capanema"` em `NOTES.md` e
`src/jogo.ts` devolve **zero ocorrências**. **Este assunto não existe em lugar nenhum do jogo
hoje** — nem verbete, nem linha do tempo, nem tela de fontes. Tudo o que a ficha traz é novo.

**Decisão do dono já registrada** [A] `territorio/PINOS-PROPOSTA.md:1`:
> "**DECISÕES DO DONO (21/08, via check):** (1) **João Cândido É NOMEADO** no pino da Revolta
> da Chibata — homenagem aprovada por ele; o texto candidato pode carregar o nome."

---

### 5.1 — A obra citável de Sílvia Capanema (o `[conferir obra citável]` do pino)

**Obra:** CAPANEMA, Sílvia. *João Cândido e os navegantes negros: a revolta da chibata e a
segunda abolição.* Rio de Janeiro: **Editora Malê**, 2022. [C]
**Obra 2 (artigo):** CAPANEMA, Sílvia. *Do marinheiro João Cândido ao Almirante Negro:
conflitos memoriais na construção do herói de uma revolta centenária.* **Revista Brasileira de
História** (SciELO). [C]
**Autoria:** Sílvia Capanema, historiadora, *maîtresse de conférences* na Université Paris 13 —
Sorbonne Paris Nord, doutorado em História pela EHESS. [C]
**Edição consultada:** NENHUMA. Não abri o livro, nem o artigo, nem a página do SciELO.
**Onde:** não localizado.

**Citação literal:** **não tenho nenhuma.** Nada desta ficha 5 pode ir entre aspas.

**O que isto resolve e o que não resolve:** resolve **metade** do `[conferir obra citável]` —
agora existe título, editora, ano e um artigo em periódico com revisão por pares, o que é mais
do que "Sílvia Capanema, pesquisadora de referência". **Não resolve** nada do conteúdo: nenhuma
frase do pino tem, hoje, uma página de Capanema por trás.

**Consciência social (critério, não enfeite):** o título centra os **navegantes negros** e lê a
revolta como **"segunda abolição"** — enquadramento que trata os marinheiros como sujeitos
políticos, não como objeto de estudo. Isso é indício forte de que a fonte passa no critério do
§2. **Indício, não verificação: não li uma linha do livro.**

---

### 5.2 — "quase todos negros"

**[C]** O enquadramento que a busca devolve, atribuído a Capanema e à divulgação do livro,
é: marinheiros das classes populares, **"em sua maioria negros e mestiços"**, vindos do
Nordeste e do Norte, **22 anos depois da abolição**.

**O que a fonte NÃO diz:** *"em sua maioria"* **não é** *"quase todos"*. São quantificadores
diferentes, e o pino escolheu o mais forte. Também aparece **"e mestiços"** — categoria que o
pino colapsa em "negros". A composição racial da marinhagem de 1910 é matéria de pesquisa com
números, e o pino a afirma sem nenhum.

**Veredito parcial: COM AJUSTE.** Frase exata: **"quase todos negros"** → o que a fonte
(indiretamente) sustenta é **"em sua maioria negros"**. E mesmo essa só entra depois de alguém
abrir Capanema e achar a página.

---

### 5.3 — "A exigência era uma: parar de açoitar"

**[C]** O que a busca devolve sobre o movimento de 1910 associa a ele **mais de uma
reivindicação** — o fim dos castigos corporais é a central, e aparecem também melhoria de
alimentação, de soldo e anistia aos revoltosos.

**O que a fonte NÃO diz:** nenhuma fonte que vi afirma que a exigência **era uma só**. A frase
do pino é uma simplificação retórica que **contradiz** o que a bibliografia corrente descreve.
E ela custa mais do que parece: reduzir a pauta a uma linha faz os marinheiros parecerem
reativos a um estímulo, em vez de um coletivo com programa — que é o contrário do que o próprio
título de Capanema ("segunda abolição") propõe.

**Veredito parcial: COM AJUSTE.** Frase exata: **"A exigência era uma: parar de açoitar."** →
não entra como está. O fim da chibata pode ser dito como a exigência **central** ou **primeira**;
"era uma" afirma exclusividade que nenhuma fonte lida sustenta.

---

### 5.4 — "os maiores navios de guerra do país"

**[C]** Os encouraçados envolvidos eram o **Minas Geraes** e o **São Paulo**, então os navios
mais novos e mais poderosos da Marinha. **Não abri fonte nenhuma sobre tonelagem, armamento ou
ordem de grandeza da esquadra.** Afirmação plausível, **não conferida**.

---

### 5.5 — João Cândido, e o que a fonte sustenta sobre ele

**[C]** João Cândido Felisberto, **1880–1969**, marinheiro, conhecido como **"Almirante
Negro"**, apontado como líder da revolta. O artigo de Capanema no periódico é justamente sobre
a **construção memorial do herói** — ou seja, ela trata a figura "Almirante Negro" como objeto
de disputa de memória, não como dado pacífico. **Isso é um alerta útil para o historiador:** a
fonte de referência sobre João Cândido é, em parte, uma fonte sobre como ele virou símbolo.

**As normas que o pino manda conferir** — *"[conferir números de norma antes de citar qualquer
um]"*, sobre o decreto de anistia e os debates no Congresso — **NÃO FORAM CONFERIDAS. Nenhuma.**
`planalto.gov.br` e `camara.leg.br` estão bloqueados, e eu **não vou escrever um número de
decreto que não abri**. O `[conferir]` continua integralmente aberto.

**Lugar de fala — e aqui há uma oportunidade que registro sem decidir:** a fonte proposta é uma
pesquisadora (Capanema), o que atende "pesquisadoras de cada período". **Não sei, e não vou
inferir, se ela é negra** — inferência por nome ou por foto é proibida pela régua de 22/08, e o
material que li não traz autodeclaração. **Existe, porém, um caminho para lugar de fala PLENO
neste pino: o próprio João Cândido deixou depoimento e entrevistas.** Se o texto do pino se
ancorar numa fala DELE em vez de numa descrição sobre ele, o pino passa de "pesquisa sobre" para
"a voz de quem viveu" — que é o grau mais alto da régua do dono. **Não decido isso** (é
representação, e o material precisa ser aberto na origem); vira a pergunta 3 no fim.

**VEREDITO DA FICHA 5 (D16): COM AJUSTE** — dois ajustes de frase (5.2, 5.3), a obra citável
localizada mas **não aberta**, e os números de norma **integralmente não conferidos**.

**Aviso de escopo, e é o mais importante desta ficha:** **esta ficha NÃO habilita o pino D16 a
entrar no jogo.** Ela localiza a bibliografia e derruba duas frases. Nenhuma citação literal de
Capanema existe aqui. Um pino sobre um massacre e uma revolta com pessoa real nomeada não entra
com fonte de grau [C].

---

# FICHA 6 — D15. Canudos (Canudos, BA)

**Texto candidato do pino** [A] `territorio/PINOS-PROPOSTA.md:488–491`:
> "Aqui existiu Belo Monte, o arraial de Canudos: dezenas de milhares de sertanejos pobres
> construindo vida em comum no sertão. A República recém-nascida viu ameaça onde havia fome e
> fé, e mandou quatro expedições militares. Do arraial não ficou pedra — e depois um açude
> cobriu o lugar. A água guarda a memória."

**Atenção especial pedida no despacho: número de mortos.** **O pino não traz nenhum, e está
certo.** Verificado linha a linha: não há número de mortos, nem de feridos, nem militar
nomeado. O §2 está cumprido nesse ponto, e isso deve ser dito em vez de presumido.

---

### 6.1 — "dezenas de milhares de sertanejos" — o `[conferir]` do pino

**O que o jogo já diz em produção** [A] `src/jogo.ts:13459–13463`, verbete CANUDOS,
com `dv: 1` (marca de divergência):
> "Arraial no sertão da Bahia, às margens do rio Vaza-Barris, fundado em 1893 e chamado por
> seus moradores de Belo Monte."
> "Um povoado de **milhares** de sertanejos pobres, muitos deles negros e libertos recentes,
> destruído em 1897 por quatro expedições do Exército da República. Foi tratado como ameaça
> monárquica — a leitura que a própria época já disputava. O que ali existia era gente sem
> terra vivendo junto."

**O jogo escreve "milhares". O pino escreve "dezenas de milhares".** O próprio pino sabia:
*"'Dezenas de milhares' [conferir na fonte antes de entrar; senão, 'milhares']"* [A]
`territorio/PINOS-PROPOSTA.md:495–496`.

**A fonte do número, e é aqui que a ficha ganha o dia [C]:** a base de toda estimativa de
população de Canudos é **a contagem do próprio Exército** — **5.200 casas** —, número que
**Euclides da Cunha aceita e reproduz** em *Os sertões*. Multiplicado por ~5 moradores por
casa, dá **~26.000 pessoas**, o que faria de Belo Monte a segunda maior cidade da Bahia à
época.

**O que a fonte NÃO diz, e é um problema de natureza, não de aritmética:**
1. **A contagem é do destruidor.** O número que sustentaria "dezenas de milhares" foi produzido
   pelo Exército que arrasou o arraial, e chegou até nós pela pena de Euclides — **exatamente a
   fonte que a linha do pino manda ler criticamente**: *"Euclides da Cunha, Os sertões (1902) —
   lido como testemunho a criticar, nunca como veredito"* [A]
   `territorio/PINOS-PROPOSTA.md:492–493`. Usar esse número como fato, num pino que declara
   desconfiar da fonte, é incoerência de método — e coerência de método é o argumento escrito
   no §2.6 do `CLAUDE.md` (*"desconfiar do documento do séc. XVII e engolir o do XXI não é
   ensinar método, é escolher lado"*).
2. **"5.200 casas" não é "26.000 pessoas".** O 26.000 é uma **multiplicação feita por
   terceiros** com um coeficiente arbitrado (cinco por casa). O documento tem casas; a pessoa
   tem gente. A distância entre os dois é uma suposição não declarada.
3. **Não achei a passagem de *Os sertões* que traz o 5.200.** A busca declarou não ter
   devolvido a citação com capítulo. *Os sertões* é domínio público e seria fatiável com
   `pdftotext` — **numa máquina com egress**. Nesta, não.

**Lugar de fala — e é a lacuna mais grave do lote 2:** as duas fontes propostas são **Euclides
da Cunha** (jornalista embarcado com a tropa, cuja obra carrega o racialismo científico do
período — o oposto de lugar de fala sobre os sertanejos) e **Walnice Nogueira Galvão**
(pesquisadora de referência, mulher, e cuja tese *No calor da hora: a guerra de Canudos nos
jornais*, 1972 [C], demonstra que a imprensa mentiu sobre o arraial — o que é precisamente
consciência social como critério). **Não há nenhuma fonte de descendentes de Canudos, nem de
pesquisa canudense.** Registro; não resolvo.

**Veredito parcial: COM AJUSTE.** Frase exata a mudar: **"dezenas de milhares de sertanejos
pobres"**. Ver a pergunta 1 no fim — a escolha entre as três saídas possíveis não é minha.

---

### 6.2 — "quatro expedições militares"

**CONFERIDO contra o que o jogo já afirma** [A] `src/jogo.ts:13461`: *"destruído em 1897 por
**quatro expedições** do Exército da República"* — em produção, com `dv: 1`. O pino não
introduz número novo; repete o do jogo.

**O que a fonte NÃO diz:** o verbete carrega `dv: 1`, ou seja, o próprio jogo marca ali uma
divergência. Não fui atrás de qual é. **O pino herda a marca junto com o número.**

---

### 6.3 — "depois um açude cobriu o lugar" (o `[conferir ano da barragem]`)

**Obra/documento:** DNOCS — Departamento Nacional de Obras Contra as Secas, Açude Cocorobó.
**Edição consultada:** NENHUMA — `gov.br/dnocs` não foi aberto.
**Onde:** não localizado.

**[C]** Convergem: obra iniciada em **1951**, no âmbito do projeto Vaza-Barris; barragem
**concluída em 1968**; propriedade do DNOCS; finalidade de perenizar o rio Vaza-Barris; o
reservatório submergiu as ruínas de Canudos. **E uma divergência:** um material da UNEB
(*Folder Açude 50 Anos*, 2019) abre com *"Em março de 1969 o Açude Cocorobó estava…"* — o que
põe **1969** ao lado de **1968**. Pode ser a diferença entre conclusão da obra e enchimento/
inauguração. **Não escolho.**

**O que a fonte NÃO diz:** o pino **não afirma ano**, e por isso não erra. Mas o
`[conferir ano da barragem]` da linha de fonte **não fecha**: fecha com uma divergência
1968 × 1969 registrada, não com uma data.

**Uma coisa que apareceu e que eu recomendo NÃO usar:** a busca devolveu, vinda da Wikipédia em
inglês, a afirmação de que a submersão teria sido *"um esforço deliberado para apagar as
memórias"* da repressão. **É interpretação forte, sem documento, numa fonte terciária.** Se
entrar no pino vira exatamente o tipo de afirmação que o §2.6 proíbe (conclusão apresentada
como fato). Registro para que ninguém a puxe achando que veio da ficha.

---

### 6.4 — "A República recém-nascida viu ameaça onde havia fome e fé"

Interpretação, e **alinhada com o que o jogo já afirma em produção** [A] `src/jogo.ts:13461`:
*"Foi tratado como ameaça monárquica — a leitura que a própria época já disputava."* Não é
número; não conferível como dado. Coerente com a tese de Galvão [C] sobre a fabricação da
ameaça pela imprensa. **Sem objeção desta ficha.**

---

**VEREDITO DA FICHA 6 (D15): COM AJUSTE** — um ajuste (6.1), um `CONFERIDO` herdado (6.2), e
dois `[conferir]` que não fecham (ano da barragem; a página de *Os sertões*).

---

# RESUMO PARA O HISTORIADOR

| Pino | Veredito | O que muda no texto candidato |
|---|---|---|
| **D1** Serra da Barriga | **COM AJUSTE** ×4 | "quase um século" (contradiz o 1630 do jogo) · "tombada desde 1986" (o jogo mantém a divergência 1985×1986 de propósito) · "é Patrimônio Cultural do Mercosul" (ata não aberta; Serra × Região) · "a data da morte dele virou o dia da consciência do país" (apaga o Grupo Palmares e o MNU — o jogo diz "veio do movimento negro, não do Estado") · linha de fonte: a Lei 9.315/1996 diz "Livro dos Heróis da Pátria" |
| **D2** Cais do Valongo | **COM AJUSTE** ×2 + 1 CONFERIDO | "a maior parte das pessoas escravizadas trazidas às Américas" → a fonte diz "**principal porto de entrada**" (superlativo entre portos, não fração do total) · "aterrado… as obras do porto o reencontraram" → **recoberto**, e a escavação foi **dirigida por Tânia Andrade Lima**, que o jogo nomeia · "Desde 2017 é Patrimônio Mundial" = **CONFERIDO** |
| **D5** Pequena África | **COM AJUSTE** ×2 | "O nome **é de** Heitor dos Prazeres" → a fonte diz "usou este termo" e "cunhado **segundo consta**" · "**que era de lá**" → **cai** ou ganha fonte própria: não há uma linha sobre isso em todo o repositório |
| **A2** Sepé Tiaraju | **COM AJUSTE** ×3 | **"Lei nº 12.032, de 21/10/2009" → 21/09/2009** (DOU 22/09/2009) · "**que liderou essa recusa**" → a lei não diz isso; ela diz "herói guarani missioneiro rio-grandense" · "Heróis e Heroínas" → a lei diz "Heróis da Pátria" |
| **D16** Revolta da Chibata | **COM AJUSTE** ×2 | "**quase todos** negros" → o enquadramento é "em sua maioria negros e mestiços" · "**A exigência era uma**" → havia mais de uma (alimentação, soldo, anistia) · obra de Capanema localizada (Malê, 2022) mas **não aberta**; **nenhum número de norma conferido** |
| **D15** Canudos | **COM AJUSTE** ×1 | "**dezenas de milhares**" → o número vem da contagem do **Exército** (5.200 casas), aceita por Euclides, multiplicada por ~5 por terceiros — e a própria linha de fonte do pino manda ler Euclides criticamente. **Nenhum número de mortos no pino: §2 cumprido.** |

**Contagem: 6 fichas completas · 0 CONFERIDO seco · 6 COM AJUSTE · 2 sub-itens CONFERIDOS**
(D2 "desde 2017"; D15 "quatro expedições", herdado do jogo).

---

## Lugar de fala, pino a pino

**PLENO (a voz de quem viveu / pertence ao que se narra):**
- **D5, na origem do topônimo** — o nome "Pequena África" é atribuído a **Heitor dos Prazeres**,
  homem negro, compositor e pintor do próprio território. **Mas a fonte que o repositório tem
  não é a voz dele:** é Sesc, Observatório do Patrimônio e o livro de Roberto Moura (1983).
  Lugar de fala pleno na ORIGEM, institucional na FONTE.
- **D1, na interpretação** — **Beatriz Nascimento** (autoria negra) é a fonte de interpretação
  de Palmares já registrada no jogo [A] `NOTES.md:558`. É o único pino do lote com autoria negra
  ancorando a leitura, e não só o dado.

**PESQUISADORAS DO PERÍODO (segundo grau da prioridade do §2, não lugar de fala):**
- **D2** — Tânia Andrade Lima (dirigiu a escavação; vínculo direto e continuado com o sítio).
- **D16** — Sílvia Capanema (obra centra os navegantes negros; **não li uma linha dela**).
- **D15** — Walnice Nogueira Galvão (mulher, e a tese sobre a mentira da imprensa é consciência
  social como critério, não enfeite).

**SÓ INSTITUCIONAL (documento, sem narrador a testar):**
- D1: IPHAN (processo 1069-T-82), FCP, Mercosul, Leis 9.315/1996, 12.519/2011, 14.759/2023.
- D2: UNESCO (2017), ONU Brasil.
- A2: Tratado de Madri (1750), Lei 12.032/2009, ISA.
- D15: DNOCS (açude).

**LACUNAS DE LUGAR DE FALA que registro sem resolver:**
- **A2 é a mais séria:** o pino narra história **guarani** e **nenhuma fonte proposta é de
  autoria indígena**. Pela condição de 19/08 (que é de aprovação, não de preferência), o pino
  não fecha como está.
- **D15:** nenhuma fonte de descendentes de Canudos ou de pesquisa canudense; a fonte de
  testemunho é um jornalista embarcado com a tropa.
- **D16:** não sei e **não infiro** a autodeclaração racial de Sílvia Capanema; o material que
  li não a traz. A régua de 22/08 proíbe inferir por nome ou imagem.

---

## FONTES QUE NÃO ABRIRAM — host e as duas tentativas

Todas com o mesmo diagnóstico, e a política do proxy é explícita em não contornar.

| fonte | host | tentativa 1 | tentativa 2 |
|---|---|---|---|
| Lei nº 9.315/1996 (Zumbi) | `www.planalto.gov.br` | `curl` → `CONNECT tunnel failed, 403` | fetch → `EGRESS_BLOCKED` |
| Lei nº 9.315/1996 (2ª via) | `www2.camara.leg.br` (Legin) | fetch → `EGRESS_BLOCKED` | busca web → só metadado |
| Lei nº 12.032/2009 (Sepé) | `www.planalto.gov.br` | `curl` → 403 | fetch → `EGRESS_BLOCKED` |
| Lei nº 12.032/2009 (2ª via) | `www.lexml.gov.br` | fetch → `EGRESS_BLOCKED` | `legislacao.presidencia.gov.br` → `EGRESS_BLOCKED` |
| Lei nº 14.759/2023 e 12.519/2011 | `www.planalto.gov.br` | `curl` → 403 | — (usei o registro [B] do `NOTES.md:8070`) |
| Dossiê UNESCO Valongo | `whc.unesco.org` | fetch → `EGRESS_BLOCKED` | busca web → texto mediado, [C] |
| Processo IPHAN 1069-T-82 | `portal.iphan.gov.br` | fetch → `EGRESS_BLOCKED` | busca web → devolveu o **número**, não o processo |
| Dossiê Mercosul (Serra da Barriga) | `bibliotecadigital.iphan.gov.br` | busca web (achou o item) | fetch bloqueado no domínio-pai |
| Ato Mercosul 2017 | `agenciabrasil.ebc.com.br` | fetch → `EGRESS_BLOCKED` | busca web → data ambígua (maio × novembro) |
| *Os sertões*, passagem das 5.200 casas | domínio público, host indiferente | busca web → declarou não achar a citação | sem egress, não há como fatiar o PDF |
| Capanema, *João Cândido e os navegantes negros* | `editoramale.com.br` / SciELO | busca web → ficha bibliográfica | fetch não tentado: SciELO é `.br` institucional, mesmo padrão de bloqueio |
| Controle (para provar que não é a fonte) | `en.wikipedia.org` | fetch → `EGRESS_BLOCKED` | — |

**Conclusão do teste de controle:** o bloqueio é **da máquina**, não das fontes. Todas as onze
existem e são públicas. Uma máquina com egress fecha a maior parte destes `[conferir]` numa
rodada curta — e o que ela precisa procurar já está nomeado aqui, com número.

---

## PERGUNTAS FECHADAS PARA O DONO — nenhuma resolvida por mim

**1. Canudos (D15) — o número de habitantes entra, sabendo de onde ele vem?**
A única base para "dezenas de milhares" é a contagem do **Exército** (5.200 casas), aceita por
Euclides da Cunha e multiplicada por ~5 por terceiros. É o destruidor contando o destruído,
numa fonte que o próprio pino declara ler criticamente.
- (a) "dezenas de milhares", com a origem do número dita no texto;
- (b) "milhares" — a saída que o próprio pino previu, e que é o que o jogo já diz em produção;
- (c) nenhum número: só "um arraial que foi a segunda maior cidade da Bahia" (que depende do
  mesmo número, então na prática recai em (a));
- (d) o pino espera uma fonte não-militar de estimativa populacional.

**2. Palmares (D1) — "quase um século" contra o "mais ou menos 1630" que o jogo afirma.**
Não é escolha de estilo: é escolher entre dois marcos de início (1597 × 1630) que mudam o texto
de ABERTURA de capítulo, e isso é conteúdo histórico em produção.
- (a) o pino se alinha ao jogo (≈ "por mais de meio século");
- (b) o jogo se alinha ao pino, e a abertura do capítulo PALMARES muda junto;
- (c) o pino diz a disputa, como o jogo já faz com o tombamento;
- (d) o pino não afirma duração.

**3. Chibata (D16) — a aprovação de 21/08 para nomear João Cândido se estende a citar a VOZ dele?**
Ele deixou depoimentos e entrevistas. Ancorar o pino numa fala **dele** o move de "pesquisa
sobre" para "quem viveu narrando" — o grau mais alto da régua de 22/08 —, mas isso é criar
representação nova, não revisar texto existente.
- (a) sim, e a pesquisa vai atrás do depoimento na origem;
- (b) não: o pino fala **sobre** ele, com a pesquisadora como fonte;
- (c) sim, mas só depois de o material ser aberto e fichado na fonte primária.

**4. Sepé Tiaraju (A2) — o pino entra com a lacuna de autoria indígena registrada, ou espera?**
O pino narra história guarani e nenhuma fonte proposta é de autoria indígena (tratado colonial,
lei federal, ISA). A condição de 19/08 é de aprovação, não de preferência.
- (a) espera uma fonte guarani ou guarani-autorada antes de entrar;
- (b) entra afirmando só o documento e calando a interpretação (como o jogo faz com as cartas
  jesuíticas), com a lacuna registrada no `NOTES.md`;
- (c) o pino sai do lote.

---

## O que esta ficha NÃO fez, e é preciso dizer

- **Não abri uma única fonte primária externa.** Todo `CONFERIDO` desta ficha se apoia em
  arquivo deste repositório ([A]) ou em citação já verificada por rodada anterior ([B]).
- **Não escrevi nenhuma aspa que eu não tenha lido.** Toda citação [C] está fora de aspas e
  marcada como devolvida por buscador.
- **Não fechei nenhum dos `[conferir]` originais dos seis pinos.** Avancei quatro deles
  (processo IPHAN 1069-T-82 · data da Lei 12.032 · obra de Capanema · ano do Cocorobó com
  divergência), todos em grau [C]. **Avançar não é fechar.**
- **Não decidi nada de representação.** As quatro perguntas acima vão ao dono como estão.
