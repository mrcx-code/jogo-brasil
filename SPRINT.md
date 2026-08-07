# SPRINT 1 — a equipe aprende a medir o que promete

Escrito pelo PM/GM em 2026-08-07, primeiro sprint da equipe (`EQUIPE.md`). Horizonte:
~1 dia de trabalho. Este documento não fecha sem a leitura da Direção de Arte — a
parceria é regra do dono; divergência entre nós dois sobe para ele com as duas posições.

---

## 1. Diagnóstico de produto, em 10 linhas

1. O jogo está tecnicamente saudável: `main` verde, FPS 61–62, luz viva (ondas 1–3),
   lugar vivo fase 1 no cap. 2, usabilidade 10/10 fechada, deploy consertado.
2. Contra a missão (educar/conscientizar/reter): **educar** avançou muito — PINDORAMA,
   linha do tempo com fonte, historinha sempre; é hoje a perna mais forte.
3. **Reter** é a perna cega: o arco de 12 capítulos foi aprovado, mas só 3 são jogáveis,
   o conteúdo acaba em minutos, e o jogo **não grava nem um número** sobre quem volta.
4. A tela de retorno do dia 2 existe — e ninguém sabe se alguém a viu de verdade.
5. Nenhum humano fora da equipe jogou uma partida cronometrada (H1 do `PRODUTO.md`).
6. **Risco de produto nº 1:** construir 12 capítulos sobre um loop cuja retenção
   ninguém mediu — escalar antes de validar é o erro clássico, e estamos nele.
7. **Risco de produto nº 2:** o gargalo é o dono (8 imagens de Salvador, 3 folhas de
   corrida, 15 dúvidas de representação) — e o tempo de espera da equipe tende a virar
   polimento visual, que é exatamente o que a regra de corte do `BACKLOG.md` proíbe.
8. O peso (3,92 MB, teto 3,6 estourado) cresce a cada capítulo; 12 capítulos não cabem
   no arquivo único atual — é decisão estrutural, e ela tem prazo implícito (antes do cap. 6).
9. Este sprint, portanto: **instrumentar retenção, destravar a espera de Salvador, dar
   ao dono a decisão do peso, e cobrir com teste o que já foi conquistado.**
10. Visual só entra pela mão da Direção de Arte (onda 4 em voo) — território dela.

---

## 2. Os tickets

Territórios declarados por arquivo/região (`EQUIPE.md` regra 1). `src/jogo.ts` é um
arquivo só: dois tickets nele só rodam em paralelo se as REGIÕES forem disjuntas e a
integração for por patch de caminho explícito (regra que já pagou sessão, `RETOMADA.md`).

### T1 · Retenção instrumentada — o jogo aprende a responder à própria pergunta
- **Objetivo:** gravar localmente (zero rede) os números que as hipóteses H2 e H5 do
  `PRODUTO.md` pedem: dias distintos com sessão, tempo total jogado, aberturas de
  A HISTÓRIA por sessão, e toques por metade da tela nos primeiros 60 s de save novo.
- **Responsável:** Dev · **Prioridade: P0** (é o risco nº 1; tudo o mais é polimento
  enquanto isso não existir).
- **Território:** `src/jogo.ts` — regiões `ESQUEMA_SAVE`/save e telas (AJUSTES);
  `src/index.html` (tela); `src/estilo.css`. NÃO toca frame loop, canvas, câmera
  (território da onda 4 da Arte).
- **Aceite mensurável:** (a) campos novos no `ESQUEMA_SAVE` com tipo e faixa — smoke com
  save adulterado continua verde; (b) tela discreta em AJUSTES mostra os quatro números;
  (c) duas sessões simuladas em datas distintas (relógio mexido) mostram "2 dias";
  (d) a frase de AJUSTES "nada sai deste aparelho" **continua verdadeira** — zero rede,
  CSP intocada; (e) `npm test` verde, prints olhados.

### T2 · Salvador pronto-para-encaixar — a espera vira preparação
- **Objetivo:** deixar o capítulo 4 a menos de 1 hora do ar no instante em que as 8
  imagens do dono chegarem — sem publicar NADA visível antes disso.
- **Responsável:** Dev · **Prioridade: P1**.
- **Território:** `src/jogo.ts` — regiões `EPOCAS`/`LINHA_TEMPO`/`CEU_PINT` (dados, não
  render); `NOTES.md` (fontes no mesmo commit).
- **Aceite mensurável:** (a) entrada de SALVADOR em `EPOCAS` com os textos do relatório
  do historiador **marcados como rascunho** — ⚠ o texto final é do dono, palavra por
  palavra; (b) marco 1835 da LINHA_TEMPO reorganizado como placa do capítulo; (c) sem as
  imagens, a época não lista e a produção fica IDÊNTICA para quem joga (o motor
  N-capítulos já cai com warn — o smoke confirma); (d) checklist de encaixe escrito
  (converter-fundo → validar-folha → requalificar → dose própria em `CEU_PINT` →
  `prints-onda2.js` no mesmo commit — fragilidade (b) da onda 2); (e) `npm test` verde.
- **Sequência:** depois de T1 aterrissar (mesmo arquivo, regiões vizinhas de save/época).

### T3 · A decisão do peso — comparação 660px × master para o dono
- **Objetivo:** transformar "3,92 MB, teto estourado" numa decisão de 5 minutos do dono,
  com os prints na mão.
- **Responsável:** Dev prepara · **Arte veta ou assina antes de ir ao dono** (qualidade
  de imagem é território dela) · **Prioridade: P1** · ⚠ decisão-do-dono para publicar.
- **Território:** `test/inline-fundos.js` (leitura/execução), prints novos em `test/`.
  **NÃO escreve em `src/jogo.ts`** — só mede e fotografa.
- **Base atualizada em 2026-08-07 (T2):** com SALVADOR o `index.html` foi de 3.823 KB para
  **4.447 KB** — o teto de 3.600 está estourado em 23%, e o ritmo é de ~500 KB por capítulo
  (o 6º passa de 6 MB). Repartição atual: pinturas 1.679 KB · personagens 901 KB · contextos
  739 KB · NPCs 188 KB · objetos 132 KB · vegetação 76 KB · drops 74 KB · retratos 64 KB.
  Os CONTEXTOS (739 KB em 8 imagens de 780 px) são o alvo mais barato: são paisagem atrás de
  uma caixa de texto, e o `inline-contexto.js --medir` já compara larguras.
- **Aceite mensurável:** (a) lado-a-lado 660px × master das 6 pinturas a 3× de ampliação;
  (b) MB total e por pintura nas duas versões (medido antes: 660px corta 22%);
  (c) parecer da Arte registrado neste arquivo; (d) nada publicado.

### T4 · QA nasce: os três fluxos conquistados viram teste
- **Objetivo:** o que custou o dia 07 inteiro não pode regredir em silêncio.
- **Responsável:** QA · **Prioridade: P0** (roda em paralelo — território disjunto).
- **Território:** `test/smoke.js`, `test/` (scripts novos), `QA.md` (novo).
- **Aceite mensurável:** o smoke (ou script irmão rodado pelo `npm test`) falha se:
  (a) **o retorno do dia 2 quebrar** — save com data de ontem → tela de retorno aparece
  e os números batem com a economia real; (b) **a cerimônia de virada de capítulo não
  terminar em manhã** — fração do dia 0,00 ± tolerância ao fim (automatizar a medição do
  `prints-onda3.js`, registrando tempo REAL, não nominal — armadilha já paga);
  (c) **o menu em jogo fechar de novo** — com >0 de impacto, A HISTÓRIA continua
  alcançável (o pior bug de produto já teve essa forma). E: `QA.md` escrito com o
  primeiro **gap-check** (dever do papel, `EQUIPE.md` regra 4).

### T5 · Motor da corrida preparado — `passoCorrer` por capítulo, atrás de flag
- **Objetivo:** quando as 3 folhas de corrida chegarem, ligar seja medição, não obra:
  hoje `velocidadeMundo()` usa o MESMO passo para andar e correr, e a folha nova exige
  `passoCorrer` em `PASSO_CAP` com `n` inteiro por capítulo (diário de 2026-08-06).
- **Responsável:** Dev · **Prioridade: P2**.
- **Território:** `src/jogo.ts` — região movimento/`PASSO_CAP`. **COLIDE com a onda 4 da
  Arte** (toque/câmera no mesmo miolo do frame loop): **só começa depois da integração
  da onda 4**, e re-mede as constantes que a regra "arte medida" protege.
- **Aceite mensurável:** (a) flag desligada = zero diferença de comportamento, provado
  por fluxo de tokens ou prints idênticos; (b) com flag e folha de teste, `n` inteiro
  conferido nos 3 capítulos; (c) escorregamento medido ≤ o da caminhada (0,00% é a
  régua da casa); (d) `npm test` verde.

### T6 · Diário e handoff do sprint
- **Objetivo:** cada aterrissagem escrita no `NOTES.md` no mesmo commit; `RETOMADA.md`
  atualizado ao fim do dia — comunicação via documento é a regra 2 da equipe.
- **Responsável:** cada papel pela sua parte; PM fecha · **Prioridade: P0 contínua**.
- **Território:** `NOTES.md` (append), `RETOMADA.md`, este arquivo (status dos tickets).
- **Aceite:** nenhum push sem entrada de diário correspondente; RETOMADA reflete o
  estado real ao fim do sprint.

**Ordem de aterrissagem em `src/jogo.ts`:** onda 4 (Arte, em voo) → T1 → T2 → T5.
T3, T4 e T6 correm em paralelo por não tocarem a fonte do jogo.

---

## 3. Para a Direção de Arte — parceira, não subordinada

Nada aqui interrompe a onda 4: toque com física é teu território neste sprint e o
instrumento de medição que a onda 3 te deixou é o caminho certo. O que eu **peço**, na
ordem, para DEPOIS que ela aterrissar:

1. **O parecer do peso (T3) antes da onda 5.** É meia hora de olho e destrava uma
   decisão do dono que segura TODOS os capítulos futuros — 12 capítulos não cabem em
   3,9 MB crescendo. Teu princípio 7 ("zero arte nova por padrão") nasce do mesmo
   problema; essa é a outra ponta dele.
2. **Um passe de olho nas duas telas do T1** (retenção em AJUSTES) contra a gramática
   madeira/pedra/ouro e a fonte da casa — veto visual é teu por contrato.
3. **Uma proposta, não uma ordem, sobre a onda 5:** chuva no PÓS-CHUVA é bonita e o céu
   da onda 2 já a prepara — mas clima "escala com nada", como tu mesma escreveste. Antes
   dela, considera uma **onda do retorno**: o momento mais importante do jogo para a
   missão é a pessoa VOLTANDO no dia 2, e hoje a tela de retorno é papel de campo parado.
   O teu cinema da virada de era (varrer até o amanhecer) aponta o desenho: **voltar é
   amanhecer** — a luz varrendo até a manhã quando a tela de retorno fecha, o lugar vivo
   do cap. 2 acordando com quem foi acolhido. Mesmos princípios teus (luz antes de
   partícula, propósito nomeável: "isto existe para dizer que valeu a pena voltar").
   Se discordares, escreve a tua posição no `DIRECAO.md` e subimos juntos ao dono.
4. **Fica anotado teu crédito:** a dúvida da cerimônia aberta pela seleção de era (sol
   não anda — uma linha se o dono sentir falta) está registrada; não mexas sem pedido dele.

## 4. Para o QA — os três fluxos que mais precisam de cobertura

Já formalizados como T4, em resumo: **(1) o dia 2** (tela de retorno com relógio
manipulado — é a feature da missão e nenhum teste a vê); **(2) a cerimônia amanhece**
(onda 3 custou meia sessão de instrumento; sem teste, a próxima mexida no relógio a
quebra em silêncio); **(3) o menu em jogo nunca mais tranca** (a regressão mais cara da
história do produto). Além deles, o **gap-check** do teu primeiro `QA.md`: a lista do
que ninguém está olhando é dever teu por contrato, e a seção 5 abaixo é meu palpite —
confere, derruba, acrescenta.

## 5. Gaps que eu vejo e ninguém está olhando

1. **Nenhum humano jogou.** H1 do `PRODUTO.md` segue sem denominador: três pessoas que
   nunca viram o jogo, cronômetro em "quando largou o telefone". Só o dono pode recrutar
   — pedido formal a ele neste sprint. Sem isso, calibrar `LIMIARES` é chute documentado.
2. **12 capítulos não cabem no arquivo único** (~300 KB+/capítulo entre pintura e
   folhas). A resposta provável já está decidida (fase Phaser/Supabase), mas ninguém
   ligou as duas pontas: a migração precisa chegar ANTES do capítulo 6, ou o cap. 6
   precisa de outro modelo de carga. Decisão estrutural com prazo implícito — dono.
3. **O gargalo dono não tem fila visível.** Salvador, corrida, pose parada, 15 dúvidas
   do `PROMPTS.md` — está tudo espalhado. A mesa (`ferramentas/pendencias.json`) deveria
   ser o ÚNICO lugar, ordenado por o-que-destrava-mais, para os 5 minutos dele renderem.
4. **O verbo ainda não morde de verdade.** O mundo responde a quem atende (`S.cuidado`),
   mas segurar o botão parado continua estratégia dominante e a folha rende sem gesto.
   É o item 1 do `PRODUTO.md`, é grande, mexe em economia (medição antes/depois
   obrigatória) e o significado de "deixar passar" por capítulo é ⚠ decisão-do-dono.
   Não entra neste sprint — entra no próximo com a instrumentação do T1 já colhendo.
5. **385 parâmetros sem tipo** (`noImplicitAny` desligado) — a dívida declarada da
   migração, onde mora o próximo defeito invisível. Meio dia de Dev num sprint futuro.
6. **Som existe só na cerimônia.** WebAudio já está na casa (`somEra`); alcance, pulo e
   acolhida são mudos. Depois do verbo morder — som de loop que não mede nada é perfume.
7. **Robustez de relógio:** o dia nasce da hora do aparelho e o bônus conta dias
   distintos — relógio recuado, fuso trocado, meia-noite virando durante a sessão.
   O T4 cobre o caminho feliz; o hostil ninguém olhou.

---

## Status

| ticket | estado |
|---|---|
| T1 retenção | **ENTREGUE (Dev, worktree, não commitado)** — `ESQUEMA_RET` com os quatro campos (dias distintos em contagem compacta, tempo jogado reusado de `R.segundos`, aberturas de A HISTÓRIA, toques por metade nos primeiros 60 s), rodapé de AJUSTES estendido, smoke com os campos novos + registro adulterado. A frase "nada sai deste aparelho" continua verdadeira: zero rede, CSP intocada. Números e ressalvas no `NOTES.md`. **De brinde:** a troca da lista de datas por contagem fechou parte do gap 1 do `QA.md` — dia anterior ao último já contado não conta mais (relógio recuado / fuso). |
| B1 (bug do `QA.md`) | **CORRIGIDO (Dev)** — o painel do retorno vem ANTES do menu: z 60 + véu `#retVeu` z 59, tocável com o menu aberto. Smoke prova por `elementFromPoint` e por toque real. Print `shot-retorno.png`. |
| T2 Salvador pronto | **ENTREGUE, e maior que o combinado** — a arte chegou no meio do sprint e o ticket virou o capítulo 4 ENTRANDO: 8 imagens processadas, época em `EPOCAS` (rascunho marcado), placa de 1835 reorganizada, `CEU_PINT` calibrada, migração de save. Números e ressalvas no `NOTES.md`. **Duas coisas para o dono:** (1) os textos são RASCUNHO e esperam a palavra dele; (2) a folha de caminhada tem 52,5% de escorregamento contra 0,48% das outras — pede folha nova de 12 poses. |
| T3 decisão do peso | aberto — parecer da Arte pendente |
| T4 QA nasce | aberto |
| T5 motor da corrida | aberto — após onda 4 |
| T6 diário/handoff | contínuo |

*Assinado: PM/GM. Aguarda leitura da Direção de Arte para o sprint fechar.*
