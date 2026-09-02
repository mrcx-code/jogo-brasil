# Implementation Plan: O painel derivado

**Branch**: `001-painel-derivado` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-painel-derivado/spec.md`

## Summary

A faixa AGORA passa a ser calculada a partir de um **retrato publicado junto com o próprio
deploy** — um arquivo servido no mesmo domínio, gerado pelo build, que diz qual foi o último
trabalho de cada máquina e o que está travado na fila. A tela lê esse retrato e calcula as idades
**no cliente**, com a regra de idade que já entrou em produção em 01/09.

A consequência que decidiu o desenho: **uma máquina que morre não precisa de batimento cardíaco
para desaparecer.** O carimbo do último trabalho dela para de avançar, a idade cresce sozinha, e
ela sai da faixa AGORA sem ninguém escrever nada. O que parecia exigir um serviço batendo de 10
em 10 minutos exige, na verdade, um arquivo e uma subtração.

## Technical Context

**Language/Version**: Node.js (ferramentas de build, já em uso) · JavaScript ES5 no navegador
(o `dashboard/index.html` é servido como está, sem transpilação)

**Primary Dependencies**: nenhuma nova. O build já existe (`ferramentas/construir.js`), já copia
arquivos auxiliares para `dist/dashboard/` (o `backlog.json` faz esse caminho hoje), e o
dashboard já sabe buscar arquivo vizinho por caminho relativo.

**Storage**: um arquivo JSON publicado no mesmo domínio (`dist/dashboard/pulso.json`).
**Nenhum banco novo, e nenhuma credencial nova.** A tabela `mesa_agente` continua existindo para
o que ela ainda serve — o texto da atividade escrito por quem quiser complementar — mas deixa de
ser a fonte de quem está ativo.

**Testing**: Playwright headless, como todos os portões (`test/`), com `executablePath` resolvido
por `test/abrir.js` — nunca lançamento nu.

**Target Platform**: navegador de celular (390×844 é a régua) e desktop.

**Project Type**: página estática servida pela Vercel + ferramentas de build em Node.

**Performance Goals**: um pedido a mais por carga, same-origin, arquivo de poucos KB. Sem impacto
mensurável no tempo de abertura.

**Constraints**:
- `connect-src 'self' https://us.i.posthog.com` — o arquivo é same-origin, então **a CSP não muda**.
  Isso não é detalhe: mexer na CSP exigiria tocar a tabela pregada no `construir.js`, e cada
  abertura dela é dívida.
- O histórico do git disponível no build pode ser **raso**. O plano declara e mede a profundidade
  necessária, e degrada de forma visível se não houver histórico bastante.
- O relógio de quem lê a página não é confiável: a regra de idade já trata carimbo no futuro.

**Scale/Scope**: 3 máquinas, ~47 itens na fila, ~12 cartões de agente. Ordem de grandeza que cabe
num arquivo pequeno por muito tempo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Artigo | Como este plano se comporta |
|---|---|
| **I — representação com o dono** | Não se aplica: nada aqui afirma história nem mostra gente. |
| **II — nada sem fonte** | Todo número da tela passa a ter origem rastreável (um commit, um item travado). Hoje a origem é "alguém escreveu". Melhora. |
| **III — portão verde por exit code** | A feature entra pelo funil, com portão próprio no CI. |
| **IV — controle que morde** | `test/pulso-derivado.js` planta um retrato velho e um retrato no futuro e **exige** exit 1. Sem esse controle a entrega não fecha. |
| **V — desconfie do portão** | O portão nasce junto com o código; a regra vale para quem mexer depois. |
| **VI — credencial nunca no cliente** | **Satisfeito por construção**: o arquivo é público e só de leitura; não há chave de escrita em lugar nenhum do caminho. Foi o critério que eliminou as duas alternativas da pesquisa. |
| **VII — afirmação que virou falsa** | É a razão de a feature existir. A tela passa a distinguir *ativo*, *sem sinal há X* e *não sei*. |
| **VIII — um escritor por vez** | Toca `dashboard/`, `ferramentas/` e `test/` — territórios da plataforma, disjuntos de `src/`. |
| **IX — reverteu, registra** | Padrão da casa. |

**Veredito: passa, sem violação a justificar.** A Complexity Tracking fica vazia de propósito.

## Project Structure

### Documentation (this feature)

```text
specs/001-painel-derivado/
├── plan.md              # este arquivo
├── research.md          # as três fontes possíveis, e por que duas foram recusadas
├── data-model.md        # a forma do retrato
├── quickstart.md        # como provar que funciona, com comando
├── contracts/
│   └── pulso.md         # o contrato do arquivo publicado
└── checklists/
    └── requirements.md  # qualidade do spec (já escrito)
```

### Source Code (repository root)

```text
ferramentas/
├── pulso.js             # NOVO — deriva o retrato do git e da fila
└── construir.js         # muda: passa a gerar e copiar o pulso para dist/dashboard/

dashboard/
└── index.html           # muda: lê o pulso, deriva quem está ativo, e cai para "não sei"

test/
└── pulso-derivado.js    # NOVO — o portão, com os controles
```

**Structure Decision**: o repositório não é `src/tests`; ele é **fonte em `src/` + ferramentas de
build em `ferramentas/` + portões em `test/`**, e a plataforma (dashboard e seções) vive fora do
`src/`. Esta feature fica inteira do lado da plataforma. Nenhum arquivo novo na raiz.

## A decisão central, e o que ela elimina

O spec pede que o estado se atualize como **efeito colateral de entregar trabalho** (FR-003) e que
a tela note sozinha quando uma rodada morre (FR-004, SC-002). A leitura ingênua disso é "preciso
de um serviço batendo de tempos em tempos". **Não preciso.**

O retrato guarda, por máquina, **o instante do último trabalho entregue**. A idade é calculada na
hora em que a página desenha. Uma máquina que morreu não escreve nada — e é justamente por não
escrever que ela envelhece e cai da faixa. O silêncio vira o sinal.

Isso elimina de uma vez: um agendamento novo, um serviço novo, uma credencial de escrita, e a
classe inteira de defeito em que o batimento cardíaco falha e a tela congela — que é o defeito que
esta feature veio consertar, e que voltaria pela porta dos fundos.

**O preço, e ele está declarado no spec:** uma rodada longa sem entrega intermediária aparece como
sem sinal. É subestimação, não superestimação — a tela erra dizendo "não sei" em vez de dizer
"trabalhando". Para o uso do dono (decidir se precisa acordar alguém), errar para esse lado é o
lado certo.

## Fases

**Fase 0 — pesquisa.** Três fontes possíveis, comparadas por credencial exigida, robustez e o que
falha em silêncio. Saída: `research.md`.

**Fase 1 — desenho.** A forma do retrato (`data-model.md`), o contrato do arquivo publicado
(`contracts/pulso.md`) e o roteiro de prova (`quickstart.md`).

**Fase 2 — tarefas.** Fora deste comando; sai do `/speckit-tasks`.

## Complexity Tracking

> Vazia de propósito: a Constitution Check passou sem violação. Se alguém acrescentar aqui uma
> linha depois, é sinal de que o desenho mudou e o plano precisa ser relido, não emendado.
