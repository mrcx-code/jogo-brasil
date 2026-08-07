# QA.md — relatório vivo do QA (automação e teste)

Primeiro relatório, Sprint 1, ticket T4 (2026-08-07). Papel definido em `EQUIPE.md`;
critérios de aceite no `SPRINT.md`. Este documento é atualizado a cada sprint.

## Decisão de integração

Os três fluxos entraram **no `test/smoke.js`**, não num script irmão. Motivo: o aceite
do T4 exige que *o smoke falhe* quando um fluxo regredir, e o `npm test` só roda o
smoke — um script novo exigiria mexer no `package.json`, que está fora do território do
ticket. Os fluxos rodam **depois** do teste de som, de propósito: `page.tap` é gesto
confiável e acorda o `AudioContext`; qualquer toque real antes daquele teste faria
"nenhum contexto antes de um gesto" falhar por motivo que não é de áudio.

Rodado contra o `index.html` da raiz como está (`node test/smoke.js` puro, sem build),
três rodadas: **PASS nas três**.

## Resultado dos três fluxos

### 1. Tela de retorno do dia 2 — VERDE

Save semeado com `salvoEm` de 8 h atrás + retenção com um dia de ontem, página
recarregada. Medido:

- Painel `#retorno` abre (`aria-hidden=false`), com as **cinco** linhas.
- Números batem com o estado real no instante da montagem: "8h00" (dt medido 28 801 s),
  "Dia 2 … ×1.02" (= `1 + CFG.bonusDia`), "3 pessoas continuam andando" (grupo semeado),
  "2 pessoas acolhidas" (soma de `acolhidos`).
- Sobrevive ao JOGAR (aparece sobre o jogo, chrome de volta) e **fecha num toque**
  (`aria-hidden=true` depois). Print: `shot-retorno.png`.

Armadilhas pagas ao escrever o teste (registradas para ninguém repagar):
- O `beforeunload` grava **dois** stores (`salvar` E `salvarRetencao`); semear
  localStorage antes de `reload()` exige stub dos dois, senão a semente é sobrescrita.
- `S.grupo` é re-derivado pelo frame loop logo após a carga — o painel deve ser
  comparado com o estado **do instante da montagem** (a semente), não com o vivo.

### 2. Cerimônia de virada de capítulo termina em manhã — VERDE

Virada real (época 0 → 1, cruzando o limiar), de **dois** pontos de partida, com o
tempo registrado no relógio REAL (a armadilha do nominal, já paga na onda 3):

| hora de partida | varredura drenada em (s reais) | fração do dia ao fim | cerimônia ainda de pé |
|---|---|---|---|
| 0,75 (noite) | 1,46–1,53 | 0,002 | sim |
| 0,40 (tarde) | 1,89–1,98 | 0,001 | sim |

Asserções: cerimônia abre; `saltoHora` drena em ≤ 6 s reais; fração fecha a ≤ 0,02 de
distância da manhã (medido: ≤ 0,002); tudo dentro dos 3,4 s da placa.

### 3. Menu em jogo nunca tranca — VERDE

Com partida em andamento (impacto 800, capítulo 1), **toques reais nos botões reais**
(escrever estado já provou PASS falso uma vez — o bug do cartão de ritmo):

MENU → `telaMenu` (chrome sai) → A HISTÓRIA → `telaCompletude` → VOLTAR → menu →
DE ONDE VEM → `telaFontes` → VOLTAR → menu → JOGAR → **rua de volta, zero telas
abertas, `body.emTela` removido, chrome de volta, partida preservada** (total 800–804,
cena 0). Prints: `shot-menu-historia.png`, `shot-menu-volta.png`.

## Bugs achados no caminho

**B1 — o painel do retorno nasce DEBAIXO do menu (média).** No boot o menu abre sempre
(`abrirTela("telaMenu")`, z-index 40) e o `#retorno` fica em z-index 30: o papel do
momento mais importante da missão fica visível pelo véu do menu mas **morto ao toque**
até a pessoa apertar JOGAR — e "toque para seguir" não responde. Repro: save com
`salvoEm` de 8 h atrás → recarregar → tocar no painel durante o menu: nada. O teste
prova o caminho que funciona (JOGAR primeiro); a camada é decisão de Arte/Dev — reporto,
não corrijo (`src/` fora do meu território, e está com a Arte na onda 4).

**B2 — bloco morto no próprio smoke (baixa).** O bloco do "third hit leap" imprime
`jumpT mid: 0 | shockwaves: 0` com as asserções comentadas como obsoletas — log que
parece medição e não mede nada. Candidato a subtração na próxima passada; não removi no
mesmo commit dos fluxos para o diff dizer uma coisa só.

**Observação (não é bug): FPS sem piso.** O smoke *imprime* FPS e não afirma nada.
Nesta máquina, três rodadas: 16 / 36 / 37 — contra 61–62 do diário. Variância de
ambiente (headless + junction), mas a consequência é real: um colapso de performance
passa PASS em silêncio. Ver GAPS.

## GAPS — o que ninguém está olhando

Conferência da lista do PM (`SPRINT.md` §5) + o que apareceu escrevendo o T4:

1. **Relógio hostil — CONFIRMO, segue descoberto.** O T4 cobre o caminho feliz
   (ontem + hoje = Dia 2). Ninguém testa: `salvoEm` no FUTURO (relógio recuado — o
   esquema aceita até 4e12, `dt` fica negativo e o painel só não abre por acaso do
   `<= 60`); meia-noite virando com a sessão aberta (`marcarDia` no visibilitychange);
   fuso trocado (o dia vem de `diaLocal()`). Três casos concretos, meio dia de QA.
2. **Som só na cerimônia — DERRUBO, envelheceu.** Já existem nove efeitos (alcance,
   atendida, drop, pulo, pouso, passo, era, tique, chegada) e o smoke testa o orçamento
   de vozes. O candidato do PM descreve um estado que não existe mais.
3. **FPS sem asserção — ACRESCENTO.** O número mais citado no diário ("piso 58") não é
   afirmado em lugar nenhum. Um piso ingênuo seria flaky (16→37 na mesma máquina, só
   variância); o caminho é medir *relativo* (razão entre rodada limpa e rodada com
   mundo cheio) ou fixar máquina de referência. Decisão de PM.
4. **Volta ao jogo no capítulo 2+ — ACRESCENTO.** O fluxo 3 prova o caminho do
   capítulo 1 (JOGAR → rua direto). Do capítulo 2 em diante, JOGAR cai na lista de
   eras, e sair dela exige escolher era → história SEMPRE fala → PULAR. Não é tranca
   (o PULAR existe), mas é o caminho de volta mais usado do jogo a partir do dia 2 e
   nenhum teste o percorre.
5. **O painel do retorno não tem dono visual.** B1 é o sintoma: a feature da missão
   abre atrás do menu e ninguém definiu qual dos dois manda no boot. A "onda do
   retorno" que o PM propôs à Arte (`SPRINT.md` §3.3) é o lugar natural de decidir isso
   — registro para a decisão não se perder.
6. **Confirmo os dois grandes do PM sem nada a acrescentar:** nenhum humano jogou (H1
   sem denominador) e 12 capítulos não cabem no arquivo único — ambos são decisão de
   dono, não de teste.

## Estado

`node test/smoke.js`: **PASS** (3×), com os três fluxos do T4 integrados.
Prints novos: `shot-retorno.png`, `shot-menu-historia.png`, `shot-menu-volta.png` —
olhados de verdade, os três dizem o que devem dizer.
