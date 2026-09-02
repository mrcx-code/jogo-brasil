# SPRINT 2 — a perna DIVERTIDO deixa de ser a perna cega

Escrito pelo PM/GM em 2026-08-07, sob a TESE DO PRODUTO (`CLAUDE.md` §8): **bonito ·
divertido · ensina, com o mesmo peso** — e sob a licença de arquitetura do dono ("fique à
vontade para mexer na estrutura"). Este documento não fecha sem a leitura da Direção de
Arte. Fecho do Sprint 1 na última seção.

Três travas do dono governam tudo abaixo:

1. *"Pode explorar possibilidades, manter pelo menos 1 capítulo com o mesmo padrão que
   temos hoje, mas pode pensar em outras propostas para as outras."* (06/08) — variedade
   de jogabilidade por capítulo está AUTORIZADA, com uma âncora no padrão atual.
2. Plataformas estilo Mario: aprovadas, *"serve ao jogo apenas, para ter mais jogabilidade
   além de andar e correr"*.
3. *"Cuidado pra não deixar a tela muito poluída também."* — orçamento de tela é critério
   de aceite, não acabamento. A composição foi limpa COM medição (corpo 0%, colisões 0%,
   faixa do meio vazia de propósito — `DIRECAO.md`); mecânica nova não a suja de volta.

---

## 1. O veredito sobre a diversão — medido, não sentido

**Método, com as limitações ditas.** Células de 45 s no build real (`index.html` de hoje),
Playwright 390×844, toques reais, save novo zerado; os estados tardios foram TELETRANSPORTADOS
(85% do vão do capítulo, upgrades da progressão real), não jogados por 10 minutos de relógio —
é o mesmo protocolo do `medir-poluicao.js` da casa. O instrumento é
`medir-diversao.js` (scratchpad do PM; o T7 o traz para `test/`). Uma célula da primeira
rodada saiu inválida e foi refeita: sem mascarar os marcos do cap. 2, o marco abre fala, a
fala PARA o mundo (mudança recente, certa), e mede-se um mundo parado.

| célula | impacto/s | observação |
|---|---:|---|
| save novo, **zero toque** | **1,14** | era 2,2 em 05/08 — os trilhos da composição derrubaram a renda sem gesto pela metade |
| save novo, segurando o botão | 9,24 | o dedo responde por 88% — mas segurar não é decidir |
| save novo, segurando **+ pulo a cada ~0,9 s** | 11,16 | **pular paga +21%** — a única entrada de habilidade do jogo rende de verdade |
| Palmares 85%, u1+u2, segurando | 24,35 | 20 acolhidas em 45 s, grupo no teto (5) — a mecânica boa rende dentro da família |
| Salvador 85%, u1+u2+u3, segurando | 31,20 | joga IDÊNTICO ao cap. 1 — o verbo prometido no texto não existe na mão |
| tardio, u1+u2+u3, **zero toque** | 7,62 | 24% da renda de segurar, com o telefone na mesa |

**As contas que o dono deve ler:**

- **Decisões reais numa partida inteira (~8 min até as 10.500 do conteúdo): cinco.**
  Comprar u1 (aos ~16 s), u2, u3 — e as três são triviais: só existe um botão comprável de
  cada vez, "compre quando der" é a única jogada. Mais a troca ANDAR/CORRER (+9% medido,
  imperceptível) e o pulo. **Depois do u3 (~minuto 3), zero decisões novas até o fim.**
- **Tempo até a primeira decisão COM custo — uma escolha em que ganhar algo custa outra
  coisa: não existe.** Pular não custa nada. Correr não custa nada (o cuidado responde mais
  rápido, mas nada no jogo te faz sentir isso como preço). Segurar o botão alcança tudo o
  que entra no alcance de 80 px sem escolher ninguém.
- **O que muda do minuto 1 ao minuto 10, além de números maiores:** a pintura, os textos —
  e UMA mecânica (acolher, só no cap. 2). Salvador e AINDA AQUI jogam byte a byte como
  Pindorama. Em 3 dos 4 capítulos, a mão faz a mesma coisa do primeiro ao último minuto.

**Veredito, com a honestidade pedida: o loop hoje é ACEITÁVEL, não divertido.** O que ele
tem de bom é real e novo: a espera deu rosto a "deixar passar", o cuidado responde na
paisagem, o pulo paga, o mundo é bonito e a história é forte. Mas é um idle de segurar com
um único gesto de habilidade, cuja tensão central — *alcançar ou deixar passar* — se
resolve sozinha com o dedo parado no botão. A perna DIVERTIDO não sustenta as outras duas
por 8 minutos, e não sustentará 12 capítulos.

**E o contra-exemplo está dentro do próprio jogo:** Palmares. Quem chega é gente, alcançar
é acolher, a fila que anda com você é o indicador, e é a parte mais elogiada do produto.
O jogo já provou UMA vez que capítulo com verbo próprio funciona. A resposta não é inventar
outro jogo — é fazer isso mais três vezes, bem.

## 2. A decisão estrutural

**A espinha FICA; a monotonia SAI.** Não proponho substituir o loop (esteira lateral +
alcançar + idle + cuidado). Motivos: (a) o dono mandou manter um capítulo âncora no padrão
atual — logo o motor de hoje continua sendo um produto de primeira classe; (b) a fundação
recém-construída (espera, cuidado, trilhos, luz) é exatamente a infra que qualquer verbo
novo consome; (c) substituição total re-derivaria as constantes medidas (§3 do `CLAUDE.md`)
sem necessidade.

O que muda é a ESTRUTURA DO CONTEÚDO, em duas frentes já aprovadas em princípio:

1. **Um verbo por capítulo** (trava 1 do dono): Pindorama é a âncora no padrão atual;
   Palmares já tem o dele; Salvador ganha o que o próprio texto promete; AINDA AQUI ganha
   as plataformas que o dono aprovou. Seção 3.
2. **Travessia com destino** (`JOGABILIDADE.md`, decidido em 06/08, prototipado só no
   cap. 2): os marcos no chão e o lugar vivo generalizam para os quatro capítulos. É o que
   dá FORMA à sessão ("faltam 2 marcos") e dá pela primeira vez um sentido a CORRER — chegar
   logo — contra um preço visível — mais gente fica para trás no caminho. A tensão que falta
   ao jogo já está desenhada ali; só não foi estendida.

## 3. Que jogo cada capítulo quer ser

Régua das três pernas, aplicada a cada linha: **ensina** (o que esta mecânica diz que as
outras não dizem, nomeável numa frase), **diverte** (que decisão recorrente ela acrescenta),
**bonito** (orçamento de tela: onde ela se lê SEM HUD novo). Mecânica que não fecha as três
não entra — a regra nova diz que ganhar numa perna às custas de outra não conta.

| cap. | verbo na mão | ensina o quê | decisão nova | tela | custo | §2 |
|---|---|---|---|---|---|---|
| 1 PINDORAMA | **alcançar** (âncora, padrão atual — decisão do dono) | o trabalho do dia; o mundo responde ao cuidado | a existente (pular/atender) | zero mudança | zero | já resolvido |
| 2 PALMARES | **acolher** (existe) + lugar vivo fase 1 (existe) | construção coletiva: cada acolhida VIVE ali | a existente + chegar aos marcos | zero mudança | zero | já resolvido |
| 3 SALVADOR | **levar palavra** — quem você alcança vira portadora; portadora que cruza com quem espera passa a palavra ADIANTE, sem o seu dedo | organização: a palavra corre de tabuleiro em tabuleiro — a rede é maior que o gesto | QUEM alcançar primeiro para a corrente se formar; posicionar-se para o cruzamento | sinal NA pessoa (aura/anel da gramática que já existe); zero HUD; faixa do meio intocada | pequeno-médio: reusa o motor do acolher (marcar estado numa chegada) | ⚠ desenho do historiador ("a mecânica é a VÉSPERA"), travas já escritas em `EPOCAS`; aprovação final é do dono |
| 4 AINDA AQUI | **plataformas** — o chão ganha níveis; pular passa a ser travessia, não só folha | (honesto: quase nada — o dono já decidiu que aqui a jogabilidade serve ao jogo, não à história; o ensino do capítulo segue nos textos e no reencontro com o cap. 1) | onde e quando pular; rota alta × rota baixa (copa rende mais, chão atende quem espera) | plataforma é MUNDO (objeto 1:1, como a placa de marco), não sinal; ocupa a faixa do meio — a justificativa por escrito que a regra da Arte exige está no ticket T3 | médio: pulo hoje é arco por timer, sem `y` de colisão; plataformas pedem pouso em altura. SEM paralaxe nova (§7) | nenhum — e plataforma NUNCA entra nos caps. 1–3 sem conversa: transformar Palmares em fase de pulos é outro jogo |

**A defesa de parar em DOIS verbos novos, não três.** Quatro mecânicas distintas são quatro
economias para equilibrar, quatro fluxos de smoke e quatro chances de regressão — e a
âncora já ocupa um dos quatro lugares. Salvador é barato (reusa o acolher) e paga a maior
dívida do jogo — um capítulo cujo TEXTO promete um verbo que a mão desmente é a tese do
produto falhando na terceira perna. Plataformas são o pedido explícito de "mais jogabilidade"
e moram no capítulo com menos risco de representação. Mais que isso agora é colecionar
mecânica sem medir nenhuma. **Profundidade antes de largura: os capítulos 5+ repetem e
aprofundam estes verbos, não inventam um por capítulo.**

## 4. A costura com bonito e ensina

- **Toda mecânica se lê no mundo, não num medidor** (modelo: a fila do acolher). A corrente
  de Salvador se lê na pessoa que carrega o sinal; a plataforma se lê no chão. Nenhum ticket
  deste sprint adiciona elemento de HUD. Se na implementação isso se provar impossível, o
  ticket PARA e volta ao PM — HUD novo é custo declarado, nunca efeito colateral.
- **Toda mecânica é nomeada pela abertura do capítulo na mesma frase que já existe** ("aqui,
  alcançar é acolher" / "alcançar é levar palavra"). O jogo já ensina os verbos; este sprint
  faz a mão obedecer ao texto — ensina e diverte param de brigar.
- **Economia protegida por medição antes/depois** (regra 5 da equipe): renda/min de cada
  capítulo dentro de ±10% do atual, medida pelo `medir-poluicao.js` + `medir-diversao.js`.
  Diversão que infla a economia é só inflação.
- **Veto visual da Arte sobre cada entrega** — em especial o desenho da plataforma (gramática
  madeira/pedra? tronco? andaime?) e o sinal da portadora. Nada disso se inventa sem ela.

## 5. Os tickets

Territórios por arquivo/região (`EQUIPE.md` regra 1). Ordem de aterrissagem em
`src/jogo.ts`: **T1 → T2 → T3** (as três tocam mobs/movimento/desenho — não paralelizam
entre si). T4, T5, T6 correm em paralelo (não tocam `src/`).

### T1 · SALVADOR: o verbo prometido vira mão — "levar palavra"
- **Responsável:** Dev · **P0** · ⚠ **decisão-do-dono antes de ir à main** (§2: é o
  capítulo da escravidão; o desenho é o do historiador e as travas de `EPOCAS` não se
  negociam — protagonismo de quem resistia, levante nunca jogável, nada de escrita sagrada).
- **O desenho mínimo:** no cap. de Salvador, quem é alcançada não solta drop e some — vira
  **portadora** (estado no mob, como o acolher marca gente) e segue o caminho dela; se uma
  portadora cruza (mesmo X, janela de px) com quem está esperando, a palavra passa: a espera
  é atendida SEM o jogador, com o mesmo registro de cuidado. O jogador decide QUEM tocar
  primeiro para a corrente alcançar o resto. Drops continuam nascendo no chão (acarajé, pano,
  búzios) — a economia não muda de fonte.
- **Território:** `src/jogo.ts` — regiões `novoMob`/`atualizarMobs`/`clicar`/desenho do mob
  (sinal). NÃO toca HUD, spawn de folhas, telas.
- **Aceite mensurável:** (a) corrente funciona: célula de teste com 1 toque gera ≥ 2
  atendidas (a segunda sem dedo), provado no smoke; (b) renda/min do capítulo ±10% da atual
  (31,2/s na célula tardia — antes/depois no `NOTES.md`); (c) `S.cuidado` responde à
  atendida-por-corrente igual à atendida-por-dedo; (d) **zero elemento novo de HUD**, sinal
  na pessoa com a gramática existente (anel/aura), faixa do meio intocada; (e) o texto da
  abertura que promete o verbo não muda (é rascunho do dono); (f) `npm test` verde, prints
  olhados, FPS ≥ 58.

### T2 · Travessia com destino nos quatro capítulos
- **Responsável:** Dev · **P0** (é a forma da sessão e o preço do correr — a tensão medida
  como ausente na seção 1).
- **O quê:** generalizar os marcos do cap. 2 (`MARCOS_CAP2_*` vira dado por época) usando os
  momentos da `LINHA_TEMPO` que cada capítulo já tem; o indicador "E MAIS N MARCOS À FRENTE"
  já existe e serve. Nenhuma mudança de economia: os marcos continuam derivados dos
  `LIMIARES` (regra do `JOGABILIDADE.md`).
- **Território:** `src/jogo.ts` — regiões marcos/`EPOCAS` (estende dado), `ESQUEMA_SAVE`
  (bits de marco por época). Depois do T1 (regiões vizinhas).
- **Aceite:** (a) cada capítulo tem 2–4 marcos com fala de momento existente (zero texto
  novo — reaproveitamento; texto novo seria ⚠ dono); (b) placa entra pela borda como objeto
  do mundo 1:1 (silhueta ≠ item, risco declarado do `JOGABILIDADE.md`); (c) save antigo não
  perde marcos do cap. 2 (migração no esquema, smoke com save adulterado verde); (d) renda/min
  inalterada ±10%; (e) `npm test` verde.

### T3 · Plataformas no AINDA AQUI — protótipo atrás de flag
- **Responsável:** Dev, com **desenho assinado pela Arte ANTES do primeiro pixel** ·
  **P1** · aprovação de mecânica já dada pelo dono; a barra visual é da Arte.
- **O quê:** no capítulo 4, o chão ganha plataformas (objetos do mundo, rolando 1:1 — SEM
  paralaxe, §7). O pulo ganha `y` de verdade e pouso em altura. Rota alta alcança a copa
  (folhas que hoje pedem timing) e atalhos; rota baixa atende quem espera. Flag
  `PLATAFORMAS_CAP` por época, ligada só no 4.
- **Justificativa por escrito de ocupar a faixa do meio (regra da composição):** plataforma
  é CHÃO elevado — leitura de lugar, não sinal; ela substitui a faixa vazia por geometria
  estática, que não compete com silhueta em movimento como as folhas competiam. Se o print
  provar o contrário, o protótipo não sai da flag.
- **Território:** `src/jogo.ts` — regiões pulo/`drawHero`/desenho do mundo/spawn. Último da
  fila em `src/`.
- **Aceite:** (a) flag desligada = zero diferença, provado por prints idênticos (o mesmo
  protocolo do T5 do sprint 1); (b) com flag: pouso em plataforma funciona, cair dela
  funciona, nenhum estado preso (smoke com sequência de pulos reais); (c) FPS ≥ 58;
  (d) renda/min do cap. 4 ±10%; (e) parecer visual da Arte registrado no `DIRECAO.md` antes
  de sair da flag; (f) `npm test` verde.

### T4 · Os três contadores: uma decisão preparada para o dono
- **Responsável:** PM prepara, Dev fornece números · **P1** · ⚠ decisão-do-dono.
- **O problema medido:** flor/água/refeição enchem, nada os gasta, não persistem
  (`S.recursos` fora do `ESQUEMA_SAVE`) — e agora as ABERTURAS ensinam o jogador a olhar
  para eles ("cada uma enche um contador lá em cima"). Ensinar um número que não vale nada
  é dívida das três pernas ao mesmo tempo.
- **Entregável:** uma página no `NOTES.md` com as duas saídas custeadas — (A) viram
  combustível do lugar vivo: o que se recolhe aparece no lugar do capítulo (visual, zero
  HUD); (B) saem do HUD e as aberturas param de citá-los — com o acumulado médio por
  capítulo MEDIDO para a proposta A ter escala real. O dono escolhe em 5 minutos.
- **Território:** `NOTES.md`, instrumento em scratchpad. NÃO toca `src/`.

### T5 · QA: os verbos viram teste, e a diversão vira instrumento da casa
- **Responsável:** QA · **P0**, paralelo (território `test/`, `QA.md`).
- **O quê:** (a) `medir-diversao.js` entra em `test/` como ferramenta oficial (com a lição
  da célula inválida: marcos mascarados, e `telaAberta` conferida ao fim de toda célula);
  (b) fluxo de smoke por verbo: acolher (cap. 2), corrente (cap. 3, quando T1 aterrissar),
  plataforma atrás de flag (cap. 4, quando T3); (c) o gap 1 do `QA.md` que sobrou:
  `salvoEm` no futuro (relógio recuado) — o esquema aceita até 4e12 e `dt` negativo passa;
  (d) gap 4 do `QA.md`: o caminho JOGAR → lista de eras → PULAR do capítulo 2+ vira fluxo
  testado.
- **Aceite:** smoke falha se qualquer verbo regredir; `QA.md` atualizado com gap-check novo.

### T6 · A fila do dono, consolidada num lugar só
- **Responsável:** PM · **P1** · resolve o gap 3 do sprint 1 (o gargalo dono sem fila).
- **O quê:** os ⚠ abertos, ordenados por o-que-destrava-mais, na mesa
  (`ferramentas/pendencias.json`): (1) aprovar o desenho do T1 (Salvador); (2) textos de
  SALVADOR palavra por palavra (rascunho no ar desde o T2 do sprint 1); (3) folha de
  caminhada de 12 poses do cap. 4 (52,5% de escorregamento contra 0,48% das outras);
  (4) a pessoa da corrida (as 3 folhas retidas por §2); (5) recrutar 3 jogadores humanos
  (H1 — sem isso, `LIMIARES` e o veredito da seção 1 seguem sem denominador humano);
  (6) decisão dos contadores (T4); (7) decisão do peso/carga sob demanda antes do cap. 6.
- **Aceite:** dono consegue responder a fila inteira em uma sessão de 15 minutos.

### T7 · Diário e handoff — contínuo
Como no sprint 1: nenhum push sem entrada no `NOTES.md`; `RETOMADA.md` ao fim; PM fecha.

---

## 6. Para a Direção de Arte

1. **O T3 é teu antes de ser do Dev:** plataforma é a primeira geometria nova no mundo desde
   a régua do menu. Que material ela fala (madeira? pedra? laje urbana do cap. 4)? O ticket
   não começa sem teu risco assinado — está no aceite.
2. **O sinal da portadora (T1)** precisa de UMA decisão tua: anel de espera reaproveitado,
   aura, ou outra coisa da gramática — sem elemento novo de vocabulário.
3. **O parecer do peso (T3 do sprint 1) segue pendente** — agora com os números do Dev
   (0,72/0,76 aplicados, 3.362 KB). Meia hora, e fecha o único ticket aberto do sprint 1.
4. Discordância em qualquer ponto: escreve no `DIRECAO.md` e sobe ao dono com as duas
   posições, como manda o contrato.

## 7. Fecho do Sprint 1

T1 retenção **entregue** · B1 **corrigido** · T2 Salvador **entregue e maior** (capítulo no
ar) · T4 QA **entregue** (`QA.md` nasceu, três fluxos no smoke) · T5 motor da corrida
**entregue** (folhas retidas por §2 — fila do dono) · T3 peso: Dev entregou a otimização
(4.447 → 3.362 KB, abaixo do teto); **falta só o parecer da Arte** — carregado para este
sprint (seção 6.3). Gap 4 do sprint 1 ("o verbo ainda não morde") é exatamente o que a
seção 1 deste sprint mediu e os T1–T3 atacam.

---

## Status

| ticket | estado |
|---|---|
| T1 verbo de Salvador | aberto — ⚠ desenho ao dono junto com o início |
| T2 travessia nos 4 capítulos | aberto — após T1 |
| T3 plataformas cap. 4 | aberto — após T2 e risco da Arte |
| T4 contadores | aberto — paralelo |
| T5 QA dos verbos | aberto — paralelo |
| T6 fila do dono | aberto — paralelo |
| T7 diário/handoff | contínuo |

*Assinado: PM/GM. Aguarda leitura da Direção de Arte para o sprint fechar.*
