# RETOMADA — leia isto primeiro na próxima sessão

Reescrito em **2026-08-14**, num handoff pedido pelo dono. A versão anterior era de 09/08 e
descrevia um jogo que não existe mais — ficou obsoleta em cinco dias, o que é a medida do ritmo
aqui. **Leia depois do `CLAUDE.md` e antes de tocar em qualquer coisa.** Nada abaixo é
impressão: ou foi medido (e o número está junto), ou foi decidido pelo dono (e a data está
junto).

---

## 0. O estado, em números medidos hoje

| | |
|---|---|
| `npm test` | **PASS** · FPS 58 · 226 falas checadas contra o vocabulário do §2, 0 acertos |
| `node test/encaixe.js` | **PASSOU** · 29 blocos · nenhum erro de console |
| Capítulos | **13 no arco · 10 escritos · 3 em obra** (O QUE SEGUROU · O ACEIRO · O QUE TEM FONTE) |
| Fila de arte | **83 pedidos · 0 a gerar · ~31 chegaram e esperam integração** (re-derive com `npm run mesa` → localhost:8200) |
| Produção | <https://matheusferreira.cc> no ar · push na `main` publica sozinho |
| Medição | PostHog **região US** ligada, chave `phc_` publicável, 9 eventos anônimos |

A sequência dos 13 fecha de ponta a ponta no smoke test: PINDORAMA → travessia → PALMARES →
O CAIS QUE VOLTOU À LUZ → SALVADOR → JABAQUARA → A PEQUENA ÁFRICA → AS PORTAS → O QUE NÃO PODIA
SER DITO → A PRAÇA → O QUE SEGUROU → O ACEIRO → O QUE TEM FONTE → AINDA AQUI.

---

## 1. A régua que manda em tudo

**bonito · divertido · ensina**, os três com o mesmo peso (`CLAUDE.md` §8). Entrega que ganha
numa às custas das outras não está pronta.

E, acima de qualquer plano, a frase mais recente do dono sobre prioridade — dita em 13/08,
revertendo a fila de lançamento que eu estava seguindo:

> *"o foco nao eh lancar logo, bora construir com tudo que acreditamos"*

Consequência prática: o `LANCAMENTO.md` deixou de ser a fila. Tela de entrada, som no primeiro
toque, código de seis letras — tudo isso desceu. O que subiu foi **conteúdo e profundidade**.

---

## 2. O que mudou no `CLAUDE.md` nos últimos dias, e por que importa

Três emendas, todas do dono, todas já escritas por extenso lá. Aqui só o resumo do que muda
na prática:

1. **§2.4 — a travessia SE MOSTRA** (08/08). Imagem de pessoas, navio, corrente e maus-tratos
   está **aberta**, com régua de museu sério. A **mecânica** continua travada: o jogador nunca
   ocupa o lugar de quem traficou, não há minigame de porão, pessoa escravizada não é NPC
   alcançável nem para "libertar", objeto ritual não é drop.
2. **§2.4 item 4 — restos humanos: trava LEVANTADA E REAFIRMADA** (10/08). O dono chegou a
   dizer "pode mostrar restos sim", lendo a trava como pudor. Apresentada a distinção (sítio em
   escavação hoje, instituto vivo, descendentes vivos — outra CATEGORIA, não uma dose menor de
   dureza), ele respondeu *"concordo com o que você trouxe, sensato"*. **Não reabra do zero.**
3. **§2.6 — a exceção do nome popular** (11/08). Nome de pessoa entra quando virou o nome
   POPULAR de uma lei ou emenda: *"A Emenda Dante de Oliveira foi rejeitada"* entra; *"o
   deputado Dante de Oliveira propôs"* não entra. **Vale para NOMEAR O TEXTO, nunca para narrar
   a pessoa.** Na dúvida entre as duas formas, use a que não tem gente agindo.
4. **§6 — O CHECK.** `check` sozinho é comando: parar de produzir e fazer o balanço.
   **E a forma é a INTERATIVA** — a ferramenta de alternativas clicáveis, no máximo 4 perguntas
   × 4 opções, o resto em lista escrita abaixo. Ele pediu isso **duas vezes**, em dias
   diferentes, porque eu voltei sozinho para a lista escrita as duas vezes. Não volte.

---

## 3. O QUE ESTÁ COM O DONO — e só ele resolve

Nada aqui é apressável por mim.

1. **Ler e cortar os quatro textos de era.** Ele escolheu ler quando os 13 estiverem prontos —
   então isto destrava sozinho quando os 3 em obra fecharem.
2. **O PDF da CNV.** Os dois servidores oficiais estão inalcançáveis daqui (certificado
   inválido, depois CAPTCHA). Ele disse *"Você consegue o PDF"* — se conseguir, largar em
   `assets/entrada/` ou me dar o caminho.
3. **As três folhas de CORRIDA** (quarta tentativa). A régua já está medida e vai no pedido:
   altura em cabeças 4,4 / 5,2 / 4,9 andando contra 2,3 / 2,8 / 2,2 correndo — e as caminhadas
   são figuras masculinas enquanto as corridas vieram femininas, que é o motivo da recusa
   por §2.
4. **Quem representa cada capítulo** (§2, e é o item que mais enche a sala de máquinas). Ele já
   respondeu *"pode propor, queremos rosto em todos"* — então a bola voltou para mim: eu proponho
   as sete linhas de personagem, ele aprova.
5. **Abrir o jogo e dizer se a página nova do mutirão o torna legível.** Ele disse duas vezes
   que nunca entendeu o mutirão; a resposta dele foi *"gosto da construção, fica evoluindo com o
   tempo"* — então ele quer a coisa, não entendia a leitura. `telaObra` no menu é a tentativa.

---

## 4. O QUE É MEU — aprovado, não começado

Em ordem. Tudo abaixo já tem "sim" do dono; não precisa perguntar de novo.

1. **Os três capítulos do presente** — O QUE SEGUROU (Covid) · O ACEIRO (agronegócio) ·
   O QUE TEM FONTE (método). Aprovados junto com o item 2, na forma *"os dois em paralelo"*.
   Regem-se pela **REGRA DO DOCUMENTO** (§2.6): só se afirma o que um documento público afirma,
   e o jogo mostra qual; nunca nomeia político; o sujeito é sempre quem sustenta, nunca quem
   governa. O material está em `HISTORIA-CONTEMPORANEO.md`.
2. **Profundidade nos 10** — dar a cada capítulo um verbo próprio na mão. Hoje cinco capítulos
   jogam idêntico. Os dois que já têm verbo são o molde: **ACOMPANHAR** em SALVADOR (um toque
   abre conversa, e conversa só anda andando) e **ACOLHER** em PALMARES.
3. **O querer** — uma linha de desejo em primeira pessoa por capítulo. Ele disse *"Construo
   agora"*, duas vezes.
4. **Propor as sete linhas de personagem** (ver §3.4 acima).
5. **Integrar as ~31 artes que já chegaram.** O gargalo aqui sou eu, não ele — ele gerou tudo.

**Trabalho em paralelo = worktree isolada.** Qualquer agente que toque `src/` vai com
`isolation: "worktree"`. Três agentes na árvore principal embaralharam commits e apagaram um
bloco de teste; foi uma sessão perdida.

---

## 5. O que está quebrado ou pela metade — o `PENDENTES.md` é a fonte

Três coisas que a próxima sessão vai encontrar e não deve redescobrir do zero:

1. **`PENDENTES.md` 13 — o `npm test` falha em metade das execuções, no bloco do MUTIRÃO.**
   Hoje passou; isso não o conserta. Os estados saem **trocados** (dentro da faixa ela anda,
   fora dela a rua para). Já medido: no instante do `evaluate` o estado semeado está certo, mas
   depois do `mouse.down()` o `obraDedo` continua 0. Hipótese não confirmada: o setup escreve
   `S.energia = 1e6` e a virada de cena durante os 300 ms de `MUTIRAO_HOLD_MS` derruba
   `obraPodeArmar()`. **Se for isso, o conserto é do TESTE, não do jogo.**
2. **A arte de rua dos três capítulos novos é emprestada** de AINDA AQUI — muda, galão e cesto
   num cais de 1811. A última fala de cada abertura diz isso em voz alta, o que é honesto e é
   feio. Depende de definir a gente de cada capítulo.
3. **O nome do capítulo não cabe na cerimônia** a 390 px: "O CAIS QUE VOLTOU À LUZ" sangra pelas
   duas bordas (print `test/CAP-cais-ab1.png`). É anterior a 11/08 e é decisão de Arte.

---

## 6. Armadilhas que já custaram uma sessão cada — não repita

- **Editar o `index.html` da raiz.** É saída. A fonte é `src/index.html`, `src/estilo.css`,
  `src/jogo.ts`. O próximo build apaga o que você escrever lá. Vale para os `pack-*.json`.
- **Mexer em `src/` e rodar `node test/smoke.js` puro.** Ele lê o `index.html` da raiz, ou seja
  o arquivo de ontem, e passa. Use `npm test`.
- **Citar um relatório num commit antes de escrevê-lo no disco.** Aconteceu três vezes.
  Verifique a escrita ANTES de escrever o commit que a descreve.
- **Empurrar com o teste vermelho achando que é flake conhecido.** O flake tinha causa real.
- **Resolver conflito com regex global de `=======`.** Este arquivo usa `=` como ornamento de
  banner; a regex comeu os banners e só o `tsc` pegou. Resolva por posição de linha.
- **Instrumento não medido contra si mesmo não mede nada.** O `prova-cores.js` acusava 68 canais
  de diferença **sem mudança nenhuma** — grão sorteado em runtime, mundo andando atrás, e o
  dígito do placar. Zerados os três, o ruído virou 0. O mesmo vale para poluição: o mesmo
  capítulo varia ~1,0 entre amostras, então folga menor que isso é cara ou coroa.
- **`git add -A` com worktrees de agente na árvore.** Commitou 52 delas. `.claude/worktrees/`
  está no `.gitignore` agora.
- **Apertar o recheio para caber botão.** Derrubou os alvos de toque para 42 px. **O piso de
  44 px não negocia** — quem cede é o espaçamento.

---

## 7. O colaborador (Mac)

`COLABORAR.md` é o contrato, e ele existe porque o PR #2 do Mac partiu de uma cópia de 08/08:
`garantirPacote`, `CONVERSA_SEG`, `emObra`, `ENDERECO_MEDIDA` mediam **0 ocorrências** no ramo
dele. Fechado com explicação; refeito certo como PR #3, que juntou limpo.

O dono quer passar mais trabalho para ele, com a condição dita por ele mesmo: *"tem que ser algo
nesse estilo, escopado e bem definido para não termos conflitos na evolução do jogo."* Escopo
bom para o Mac = bloco novo, arquivo próprio ou função isolada; escopo ruim = qualquer coisa que
reescreva função vizinha no `src/jogo.ts`.

---

## 8. Como trabalhar

```bash
npm test
```

É `npm run build` + smoke test, e **tem que passar**. Desde 14/08 há um **portão de CI**
(`.github/workflows/`) que roda o mesmo `npm test` em todo PR e em todo push para a `main` —
ou seja, empurrar com o teste vermelho deixou de ser silencioso. Rode também `node test/encaixe.js` ao
mexer em jogo ou tela — são as asserções sobre o que desencaixa **em silêncio** (texto e imagem
desalinhados, uma promessa de privacidade que a CSP desmente, um capítulo que perde a pintura).

E **olhe os prints**. O teste garante que não quebrou; ele não garante que ficou bom.

Reverteu algo pela metade? **Escreva no `PENDENTES.md` no MESMO commit** — reverter sem
registrar perde o trabalho duas vezes, porque some o código E o diagnóstico.

---

## 9. Documentos vivos, e o que cada um é

`CLAUDE.md` — a lei (§2 representação, §3 técnica, §6 o check) · `NOTES.md` — o Diário, as
fontes por capítulo, o glossário de 52+ verbetes · `PENDENTES.md` — o que está pela metade ·
`DIRECAO.md` — a visão de arte e as ondas · `COLABORAR.md` — o contrato do colaborador ·
`LANCAMENTO.md` — o que falta para lançar (**despriorizado por decisão do dono em 13/08**) ·
`HISTORIA-CONTEMPORANEO.md` — o material dos três capítulos do presente · `MUTIRAO.md` ·
`ROBUSTEZ.md` · `RELATORIO-PESO.md` · `CINCO-MINUTOS.md` · `DIA-3.md` · `AUDITORIA.md`.

---

## 10. O que eu faria na primeira hora da próxima sessão

1. Ler o **Diário** no fim do `NOTES.md` — a entrada mais recente é de 12/08, "O menu vira
   cenário".
2. Rodar `npm test` e `node test/encaixe.js` para saber de que chão você parte.
3. Pegar o item 1 da seção 4 — **os três capítulos do presente** — em worktree isolada, e o
   item 2 (**profundidade nos 10**) em outra, em paralelo, que é como o dono aprovou.
4. Quando ele escrever `check`: **forma clicável, quatro perguntas, o resto em lista escrita.**
