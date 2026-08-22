# DIVERGÊNCIA — o glossário do JOGO contra o do BANCO

Gerado por `node ferramentas/conteudo-conferir.js --relatorio` (Avenida A, fase 1).
**Este arquivo é material de trabalho do plantão**: cada linha abaixo é uma revisão que
o historiador já aplicou no jogo e que o banco ainda não tem. Aplicar é do plantão, via
MCP — nenhuma ferramenta de agente escreve no banco.

| lado | verbetes | grupos | pares | hash canônico |
|---|---:|---:|---:|---|
| JOGO (`index.html`, extraído headless) | 181 | 17 | 644 | `cd5a68d4d42bb73eea83e9746078a9d527ceec1411224e2282bbf33abcd5bd7e` |
| BANCO (`ferramentas/conteudo/*.json`) | 181 | 17 | 644 | `245705392f8b9392f8f16fa69390908fd7fc31e900406c1f5ff69500f021c858` |

**8 divergência(s) em 6 chave(s).**

O texto abaixo vai INTEIRO, dos dois lados, de propósito: é dele que se copia o valor
novo para o `insert` da rev+1. Relatório com reticências manda a pessoa de volta ao jogo
para ler o que ele deveria ter poupado.

O resumo em uma linha por chave:

| tipo | chave | campos que divergem |
|---|---|---|
| verbete | GUARANI | f |
| verbete | YANOMAMI | f |
| verbete | TIKUNA | f |
| verbete | TRONCO LINGUÍSTICO | d, f |
| verbete | DESMATAMENTO | d, f |
| verbete | MAPBIOMAS | f |

## VERBETES — 6 chave(s)

### GUARANI

**campo f (a fonte)**

JOGO (o que vale hoje):

```
IBGE, Censo 2022, Etnias e línguas indígenas, 2ª edição, 2026 · Enciclopédia Povos Indígenas no Brasil, ISA
```

BANCO (o que está lá):

```
IBGE, Censo 2022, Etnias e línguas indígenas, 2025 · Enciclopédia Povos Indígenas no Brasil, ISA
```

### YANOMAMI

**campo f (a fonte)**

JOGO (o que vale hoje):

```
Davi Kopenawa e Bruce Albert, A queda do céu, Companhia das Letras, 2015 · IBGE, Censo 2022, Etnias e línguas indígenas, 2ª edição, 2026 · Funai, TI Yanomami, homologação de 1992
```

BANCO (o que está lá):

```
Davi Kopenawa e Bruce Albert, A queda do céu, Companhia das Letras, 2015 · IBGE, Censo 2022, Etnias e línguas indígenas · Funai, TI Yanomami, homologação de 1992
```

### TIKUNA

**campo f (a fonte)**

JOGO (o que vale hoje):

```
IBGE, Censo 2022, Etnias e línguas indígenas, 2ª edição, 2026 · Enciclopédia Povos Indígenas no Brasil, ISA
```

BANCO (o que está lá):

```
IBGE, Censo 2022, Etnias e línguas indígenas, 2025 · Enciclopédia Povos Indígenas no Brasil, ISA
```

### TRONCO LINGUÍSTICO

**campo d (a definição)**

JOGO (o que vale hoje):

```
As 295 línguas indígenas do país — faladas por 474.856 pessoas de dois anos ou mais, no Censo de 2022 — não formam uma família só: há dois grandes troncos — o tupi e o macro-jê —, mais de uma dezena de famílias que não se encaixam em nenhum deles, como aruák, karib, pano, tukano e yanomami, e línguas isoladas, sem parente conhecido. Quem fala uma língua de um tronco não entende a de outro, do mesmo modo que um falante de português não entende russo. É a razão linguística de “índio” não descrever coisa nenhuma.
```

BANCO (o que está lá):

```
As 295 línguas indígenas do país não formam uma família só: há dois grandes troncos — o tupi e o macro-jê —, mais de uma dezena de famílias que não se encaixam em nenhum deles, como aruák, karib, pano, tukano e yanomami, e línguas isoladas, sem parente conhecido. Quem fala uma língua de um tronco não entende a de outro, do mesmo modo que um falante de português não entende russo. É a razão linguística de “índio” não descrever coisa nenhuma.
```

**campo f (a fonte)**

JOGO (o que vale hoje):

```
Aryon Dall'Igna Rodrigues, Línguas brasileiras: para o conhecimento das línguas indígenas, Loyola, 1986 · IBGE, Censo 2022, Etnias e línguas indígenas, 2ª edição, 2026
```

BANCO (o que está lá):

```
Aryon Dall'Igna Rodrigues, Línguas brasileiras: para o conhecimento das línguas indígenas, Loyola, 1986 · IBGE, Censo 2022, Etnias e línguas indígenas
```

### DESMATAMENTO

**campo d (a definição)**

JOGO (o que vale hoje):

```
O Brasil mede o próprio desmatamento por satélite desde 1988: é o PRODES, do Instituto Nacional de Pesquisas Espaciais, que fecha o ano em 31 de julho e publica a taxa. Em outubro de 2025 o INPE estimou 5.796 km² na Amazônia Legal, a menor em onze anos; em março de 2026 a taxa consolidada do mesmo ano fechou em 5.731 km². Os dois números são do mesmo instituto e nenhum deles está errado: o primeiro é estimativa, o segundo é a conta fechada — e saber disso é a diferença entre ler um número e repetir um número. Ter número público, comparável e antigo é o que permite discutir isso com dado em vez de com opinião — e é por isso que o instrumento de medida também é disputado.
```

BANCO (o que está lá):

```
O Brasil mede o próprio desmatamento por satélite desde 1988: é o PRODES, do Instituto Nacional de Pesquisas Espaciais, que fecha o ano em 31 de julho e publica a taxa. A estimativa do INPE para 2025 na Amazônia Legal foi de 5.796 km², a menor em onze anos. Ter número público, comparável e antigo é o que permite discutir isso com dado em vez de com opinião — e é por isso que o instrumento de medida também é disputado.
```

**campo f (a fonte)**

JOGO (o que vale hoje):

```
INPE, PRODES / Programa de Monitoramento da Amazônia, nota técnica de estimativa da taxa de 2025, outubro de 2025 · INPE / Programa BiomasBR, taxa consolidada do PRODES 2025 para a Amazônia Legal, atualização de 3 de março de 2026
```

BANCO (o que está lá):

```
INPE, PRODES / Programa de Monitoramento da Amazônia, nota técnica de estimativa da taxa de 2025, outubro de 2025
```

### MAPBIOMAS

**campo f (a fonte)**

JOGO (o que vale hoje):

```
MapBiomas, Relatório Anual do Desmatamento (RAD) 2025, publicado em 27 de maio de 2026 · MapBiomas Alerta, descrição do método · MapBiomas, perguntas frequentes (dados abertos sob licença Creative Commons CC-BY)
```

BANCO (o que está lá):

```
MapBiomas, Relatório Anual do Desmatamento (RAD) 2024 · MapBiomas Alerta, descrição do método · MapBiomas, perguntas frequentes (dados abertos sob licença Creative Commons CC-BY)
```

