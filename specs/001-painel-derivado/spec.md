# Feature Specification: O painel derivado

**Feature Branch**: `001-painel-derivado`

**Created**: 2026-09-01

**Status**: Draft

**Input**: Decisão do dono em 2026-09-01, depois de ver quatro cartões dizendo "TRABALHANDO / agora"
com 315 minutos de sinal. Palavras dele: *"se a tecnologia atual eh limitada a ponto de nao
conseguimos ter isso, eh melhor tirar... nao faz sentido manter algo q nunca vai mostrar a
realidade"*. Escolheu **trocar a fonte** em vez de tirar.

---

## O problema, com o número que o produziu

Às 10h44 de 01/09 o painel mostrava quatro cartões na faixa AGORA — Claude, dev-plataforma,
historiador, dev-dados — dizendo TRABALHANDO/agora com o boneco martelando. O último sinal dos
quatro tinha **315 minutos** e era de uma rodada que já havia pousado. A rodada que estava de
fato no ar naquele instante nunca tocou a mesa.

O conserto que já entrou (rótulo por idade, cartão frio, animação parada) fez o painel **parar de
mentir**. Ele não faz o painel **dizer a verdade**: com as máquinas esquecendo de escrever, a tela
passa a dizer "sem sinal" em tudo — honesto e inútil.

A causa não é técnica, é de fonte: o painel lê **autorrelato**. Alguém precisa lembrar de
escrever. Quem cai, quem estoura cota e quem esquece de pousar deixa a linha acesa para sempre.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — O dono olha o celular e sabe se tem gente trabalhando (Priority: P1)

O dono abre o painel a qualquer hora, de qualquer lugar, e vê quais máquinas estão produzindo
**neste momento** e o que cada uma pegou. Ele não precisa perguntar a ninguém, e o que ele vê não
depende de nenhuma sessão ter lembrado de anotar.

**Why this priority**: é a razão de o painel existir. Sem isso ele é decoração — e foi essa
constatação que gerou a decisão de trocar a fonte em vez de manter uma tela bonita e falsa.

**Independent Test**: desligar completamente toda escrita manual no painel por uma rodada inteira
e conferir que a tela continua correta o tempo todo.

**Acceptance Scenarios**:

1. **Given** uma máquina que empurrou trabalho há 4 minutos, **When** o dono abre o painel,
   **Then** essa máquina aparece como ativa, com o que ela pegou e há quanto tempo.
2. **Given** que nenhuma sessão escreveu no painel durante toda a rodada, **When** a rodada
   termina, **Then** a tela mostrou o estado certo do início ao fim, sem intervenção.
3. **Given** uma máquina que parou de empurrar há mais de uma hora, **When** o dono abre o painel,
   **Then** ela não aparece como ativa, e a tela diz há quanto tempo foi o último sinal dela.

---

### User Story 2 — A tela nota sozinha quando uma rodada morre (Priority: P1)

Uma rodada é interrompida no meio — a máquina cai, a cota estoura, a sessão fecha. Ninguém avisa
nada. A tela percebe sozinha, em minutos, e para de afirmar que aquilo está em andamento.

**Why this priority**: é exatamente o caso que produziu o defeito de 01/09, e o que o dono usa para
decidir se precisa acordar alguém. Um painel que não percebe morte é um painel que mente por
omissão.

**Independent Test**: matar uma rodada no meio, sem nenhum registro de encerramento, e cronometrar
quanto tempo a tela leva para deixar de mostrá-la como ativa.

**Acceptance Scenarios**:

1. **Given** uma rodada mostrada como ativa, **When** ela é interrompida sem registrar nada,
   **Then** em até 10 minutos a tela deixa de mostrá-la como ativa.
2. **Given** que o serviço que guarda o estado ficou fora do ar, **When** o dono abre a tela,
   **Then** ela diz que não sabe, em vez de repetir o último estado conhecido como se fosse atual.

---

### User Story 3 — O dono vê o que cada agente fez por último, sem promessa falsa (Priority: P2)

Os cartões de agente deixam de fingir um sinal ao vivo. Cada um mostra **o último trabalho que
entregou e há quanto tempo** — informação verdadeira e verificável — em vez de um estado que
ninguém tem como manter atualizado.

**Why this priority**: é o limite honesto desta feature, e precisa aparecer na tela em vez de
ficar só no documento. Sem isso, a tela volta a prometer o que a fonte não sustenta.

**Independent Test**: conferir que nenhum cartão de agente afirma estado presente, e que o que
cada um afirma sobre o passado bate com o registro durável.

**Acceptance Scenarios**:

1. **Given** um agente que entregou algo ontem, **When** o dono abre o painel, **Then** o cartão
   dele diz o que foi e há quanto tempo, sem dizer que ele está trabalhando agora.
2. **Given** um agente que nunca entregou nada, **When** o dono abre o painel, **Then** o cartão
   diz que não há registro — nunca um zero ou um traço que pareça dado.

---

### Edge Cases

- **Relógio dessincronizado entre máquinas.** Um registro com carimbo no futuro não pode virar
  "agora". Já resolvido no rótulo por idade; a fonte nova tem de respeitar a mesma regra.
- **Duas máquinas pegam o mesmo item.** A tela mostra as duas, com o nome de cada uma — não escolhe
  uma e esconde a outra.
- **O trabalho acontece mas não é empurrado** (rodada longa sem push intermediário). A tela vai
  dizer que aquela máquina está sem sinal, o que é uma **subestimação honesta**: melhor dizer "não
  sei" do que afirmar atividade que não se pode comprovar.
- **O estado nunca foi escrito** (primeira carga, ou base recém-migrada). A tela diz que não há
  registro, e não mostra faixa vazia com cabeçalho órfão.
- **Item travado e esquecido.** Um item marcado em voo há dias não é atividade: acima do teto de
  idade ele aparece como travado-e-parado, não como em andamento.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O painel MUST derivar quem está ativo de **rastro que o próprio trabalho produz**, e
  não de alguém ter escrito que está trabalhando.
- **FR-002**: Todo trabalho entregue MUST carregar, de forma legível por máquina, **qual máquina o
  produziu** — em campo próprio e parseável, nunca em texto livre.
- **FR-003**: O estado mostrado MUST ser atualizado como **efeito colateral de entregar trabalho**,
  sem passo separado que alguém possa esquecer.
- **FR-004**: O estado MUST também ser reavaliado **periodicamente**, para que a ausência de
  trabalho novo apareça sozinha em vez de congelar a última leitura.
- **FR-005**: O painel MUST distinguir três coisas hoje confundidas: *ativo agora*, *sem sinal há
  X*, e *não há registro*.
- **FR-006**: O painel MUST mostrar, por item em voo, **qual máquina o pegou e desde quando**.
- **FR-007**: Os cartões de agente MUST afirmar apenas o **passado verificável** (último trabalho e
  quando), e MUST NOT afirmar estado presente.
- **FR-008**: A tela MUST declarar o limite ao próprio leitor: a fidelidade é **por máquina e por
  item**, não por agente.
- **FR-009**: Nenhuma credencial de escrita MUST aparecer no que roda no navegador de quem abre a
  página. (Artigo VI da constituição.)
- **FR-010**: A funcionalidade MUST ter portão automatizado com **controle** — um estado velho
  plantado de propósito tem de ser reprovado. (Artigo IV.)
- **FR-011**: Falha ao obter o estado MUST NOT ser apresentada como estado vazio nem como estado
  atual; a tela diz que não sabe.
- **FR-012**: A escrita manual do estado MUST continuar possível como complemento, e MUST NOT ser
  necessária para a tela estar correta.

### Key Entities

- **Máquina**: quem produz trabalho (hoje: a sessão do Windows, a da nuvem, a do Mac). Tem nome
  próprio, um último sinal com data, e itens em voo.
- **Pulso**: o retrato do estado num instante — quais máquinas deram sinal, quando, e o que cada
  uma tem em voo. Tem sempre uma **idade**, e a idade é parte do dado, não enfeite.
- **Item em voo**: uma tarefa da fila com a máquina que a pegou e o instante em que pegou.
- **Elenco**: cada agente com o último trabalho entregue e quando. Sem estado presente.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma rodada inteira acontece **sem nenhuma escrita manual** de estado, e a tela está
  correta em toda amostragem feita durante ela.
- **SC-002**: Uma rodada interrompida no meio deixa de aparecer como ativa em **até 10 minutos**,
  sem nenhuma ação humana.
- **SC-003**: **Zero** ocorrências de "ativo agora" para um sinal com mais de 45 minutos — medido
  contra o defeito de 01/09, que tinha 315.
- **SC-004**: O dono consegue responder, em **menos de 10 segundos** de tela aberta, quantas
  máquinas estão produzindo e o que cada uma pegou.
- **SC-005**: Nenhuma credencial de escrita alcançável a partir da página publicada — verificado
  por varredura automática na saída do build.
- **SC-006**: O portão da feature reprova (exit diferente de zero) quando um estado velho é
  plantado de propósito, e o comando que faz isso está escrito no próprio portão.

---

## Assumptions

- **A fidelidade por agente é impossível hoje, e isso é escopo e não falha.** Não existe rastro
  durável que ateste que um agente específico está vivo. Assumimos por máquina e por item, e o
  texto da tela diz isso ao leitor.
- **O ato de entregar trabalho é frequente o bastante para servir de pulso.** As rodadas empurram
  várias vezes; uma rodada longa sem entrega intermediária aparece como sem sinal, e aceitamos essa
  subestimação por ser honesta.
- **Existe um lugar de servidor onde um segredo pode morar.** Backend passou a ser permitido em
  19/08; a escrita autenticada acontece fora do navegador de quem lê.
- **O rótulo por idade já está em produção** (entregue em 01/09) e é pré-requisito: esta feature
  troca a fonte, não a apresentação.
- **A fila com máquina e instante já existe** no registro durável da fila; esta feature passa a
  exibi-la, e não a inventa.
- **Reaproveitamos a tela atual.** Faixa AGORA, banco de reservas e cartas continuam como estão;
  muda de onde vem o que elas dizem.
