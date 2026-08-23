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

## 7. A OUTRA MÁQUINA — o Mac, que é o Claude do JOGO (reescrito em 23/08)

Esta seção era "o colaborador (Mac)" e descrevia alguém que mandava PR de fora. Não descreve
mais: desde 22–23/08 são **duas sessões de Claude no mesmo repositório**, com partição de
território acordada por escrito e um lock que a impõe.

**A partição, desenhada por esta máquina e aceita pela outra no PR #4:**
**Mac = Claude do JOGO (`src/`) · Windows = Claude da PLATAFORMA** (`plataforma/`, `dashboard/`,
`ferramentas/gerar-*.js`, `ferramentas/construir.js`, `divulgacao/`). O despachante continua
sendo **um só** (Windows) e o `integrar.js` roda **de um lado por vez**: o Mac entrega
commitada no ramo e avisa; o Windows integra.

**O nome desta máquina é `mac-jogo`** (`.claude/maquina`, fora do git). Sem esse arquivo o lock
degrada para nada — foi criado em 23/08.

### O que o Mac entregou até aqui

- **O GLOSSÁRIO** (PR #3, mergeado): nova seção do menu com **167 verbetes em 17 grupos**, 644
  remissões cruzadas, zero link morto, busca com normalização de acento, portas por assunto,
  layout de fichário, página dupla em tela larga. Território: `src/jogo.ts` (bloco enxertado
  depois de `montarFontes()`), `src/estilo.css` (seção `.gl*`), `NOTES.md` (cinco blocos de
  fonte). Enxerto cirúrgico: 1.890 inserções / 2 remoções.
- **O CI** (`.github/workflows/teste.yml`): primeira vez que a suíte rodou fora de uma máquina.
  **Sem `cache: npm`** — exige lockfile, que está no `.gitignore`; foi essa a primeira falha.
- **Duas asserções novas no `smoke.js`**: `lintComentarios()` (balanço de `/*`↔`*/` e fechador
  órfão no CSS) e um bloco de **geometria** (verbete fechado ≤ altura da cabeça + 4 px, abrir
  cresce >1,5×, aba não transborda o cartão, sem overflow horizontal). Nasceram de um defeito
  real: um comentário CSS mal fechado engoliu a regra `.glItem` inteira e o `npm test` **passou
  verde**, porque checava a classe, não a altura.
- **O PR #4** — a proposta de coordenação entre máquinas. Fechado sem merge, de propósito:
  **três das quatro propostas entraram**, absorvidas no `ONBOARDING-OUTRA-CONTA.md`.

### O acerto do PR #4 → #5, e o que ficou combinado

| | o que ficou |
|---|---|
| **A** — `em-curso` vira lock que viaja por git | **no ar**, mais o ramo marcador `voo/<id>` (o git recusa dois pushes na mesma ref: lock atômico de graça) |
| **B** — o guarda recusa território de outra máquina | **no ar pelo PR #5** · validade **2 h** (medida: rodadas de 2 a 67 min; as 12 h da proposta eram chute) · degrada em silêncio com dado ruim |
| **C** — portão/regra entra por PR entre as duas | aceita **com uma correção que não é detalhe: §2 NÃO entra por PR, para no DONO.** Dois Claudes se aprovando em representação é exatamente o que o §2 existe para impedir |
| **D** — campo `aceite` cobrado pelo funil | aceita, para um PR seguinte: primeiro a **migração** (preencher o `aceite` dos itens livres), e quem escreve é **quem cria** o item, nunca quem vai executá-lo |

**O dono autorizou o merge mútuo em 23/08**: cada lado mergeia o PR do outro depois de revisar.
§2 e sign-off de publicação continuam com ele.

### O item que a outra máquina passou ao Mac, e está esperando

**O CAMINHO-DO-CÉU** — `PENDENTES 54`, priorizado pela direção de arte. Território:
`src/jogo.ts` + `src/estilo.css` + `test/regua-larga.js`. Auto-contido, e já vem com **quatro
condições numéricas de aceite** escritas pela arte — inclusive a que decide se vale a pena:
*a referência 390×844 tem que ganhar a heroína; se não ganhar, a prioridade cai.*

Para pegar: marcar `estado: em-curso` + `maquina: mac-jogo` + `desde` no `backlog.json`,
commitar **na hora**, e empurrar `git push origin HEAD:refs/heads/voo/caminho-do-ceu`.

**MAS A RÉGUA JÁ RESPONDEU, e a resposta é não — medido em 23/08.** A condição da arte é *"a
referência 390×844 tem que ganhar a heroína; se não ganhar, a prioridade cai"*. A saída do
`npm test` dá **83 px de faixa em 390×844 onde precisam 104** (412×915 e 430×932 passam). Pela
regra do próprio PENDENTES 54, **a prioridade dele cai antes de começar**. Está com o dono, que
é quem decide prioridade — a régua só informa. **Não pegue este item sem a decisão dele.**

### O que aconteceu depois disso, ainda em 23/08 — a coordenação funcionou

Não é registro de cortesia: é a prova de que o canal entre as duas máquinas fecha o ciclo, e
quanto tempo leva.

1. **O Mac conferiu a trava que o Windows tinha acabado de subir** e achou defeito: o
   `test/guarda-lock.js` dava **exit real 1** aqui. Causa isolada — o guarda resolvia `RAIZ` pelo
   `__dirname` (que o Node já resolve por symlink) e o alvo cru da ferramenta (que não). Com
   symlink no caminho as pontas discordam, nada casa território e **o guarda passa em silêncio**.
   No macOS `os.tmpdir()` é `/var/folders`, symlink de `/private/var/folders` — que é onde o
   próprio teste monta o palco.
2. **Virou `PENDENTES 59`** com o remendo já provado numa cópia (hoje 3 falhas · remendado 4/4),
   sem tocar `.claude/hooks/`, mais um comentário de revisão no PR #5.
3. **O Windows aplicou em menos de uma hora** (`7a8f726`), e o Mac conferiu: `guarda-lock`
   **exit real 0**, cena 7 verde nas quatro verificações. **A trava está de pé nas duas máquinas.**
4. **`PENDENTES 60`** foi o achado seguinte, ainda aberto — ver abaixo.

**A regra que este ciclo confirmou:** achado + causa isolada + remendo provado + território
respeitado é aceito rápido. O que trava é achado sem medição.

### O que está esperando resposta da outra máquina (nenhum é bloqueante)

- **O guarda falar alto no caso "fora da RAIZ".** Ele aplicou o remendo, não a sugestão maior:
  hoje o guarda trata "fora da RAIZ" e "dentro da RAIZ e liberado" como a mesma coisa, exit 0
  calado — foi esse silêncio que deixou a trava sumir. Uma linha em stderr, **sem recusar**,
  trataria a classe em vez do caso.
- **`territorio-rico` está `em-curso` com `maquina: null` e `desde: null`.** É o único item em
  voo, e o `quemTrava` devolve `null` para ele por construção: a trava está de pé e ainda não
  sustenta o único caso real.
- **`PENDENTES 60` — o `index.html` nasce sujo no Mac a cada build.** Diff de 9.863 linhas,
  **100% fim-de-linha** (`--ignore-cr-at-eol` zera). Causa: `tsconfig.json:31`
  `"newLine": "crlf"`. No Windows não aparece porque o `autocrlf=true` fecha o círculo. Conserto
  tem **duas** peças (`newLine: lf` + `index.html text eol=lf`) e uma sozinha não serve — medido.
  Não foi aplicado porque a metade Windows não se verifica daqui: só a peça 1 limparia o Mac e
  sujaria a árvore dele.

**Consequência prática enquanto isso não fecha:** neste Mac, `git status` acusa `index.html`
depois de todo build **sem nenhum byte de texto ter mudado**. Não confie em árvore suja como
sinal aqui — confira com `git diff --ignore-cr-at-eol` antes de concluir qualquer coisa. Três
stashes foram descartados em 23/08 por serem só esse ruído.

### O `gh` deste Mac escreve como `mrcx-code`, e isso é garantido por máquina

Auditado em 23/08: **nenhum rastro** da conta de trabalho no repositório (todos os PRs e
comentários são `mrcx-code`, nenhum commit com e-mail da conta de trabalho). Mas o `gh` desta máquina
tinha **só o `matf-ps` logado** — ler repo público é inofensivo, **escrever** deixaria rastro
público e permanente da conta da empresa num projeto pessoal.

- **Chaveiro separado:** `~/.config/gh-pessoal` (mrcx-code), apontado por `GH_CONFIG_DIR` no
  `env` do `.claude/settings.local.json` (**gitignored** — não vai para a outra máquina). O
  global `~/.config/gh` continua sendo o da empresa, intocado.
- **Trava mecânica:** `~/.claude/guarda-gh.js`, hook `PreToolUse` de Bash, **recusa (exit 2)
  qualquer escrita do `gh`** a menos que `gh api user` responda `mrcx-code`. Leitura livre.
  **Falha FECHADA de propósito** — o contrário do guarda de território: lá travar por engano
  custa meia hora, aqui deixar passar custa rastro público permanente.
- **Teste:** `~/.claude/testar-guarda-gh.js`, **33 verificações**, cobrando a lógica nos dois
  sentidos. Provado com escrita real: gist secreto criado como `mrcx-code` e apagado (404).
- **Duas armadilhas que ele já pagou:** corpo de heredoc é **dado, não comando** (ele bloqueava
  a escrita de um arquivo que apenas *mencionava* `gh pr create`); e a conferência tem de usar o
  **mesmo ambiente** do comando. E o teste não pode fixar a conta ativa — a primeira versão ficou
  vermelha exatamente quando o programa passou a estar certo.

**O que a máquina NÃO cobre, e continua sendo humano:** no `gh auth login`, quem escolhe a conta
no navegador é a pessoa. O guarda confere quem assina, não quem foi autorizado.

### O que a outra máquina declarou OCUPADO (não encoste)

`plataforma/` · `ferramentas/gerar-*.js` · `ferramentas/chrome-plataforma.js` · `dashboard/` ·
`ferramentas/construir.js`. Os diários (`NOTES`, `PENDENTES`, `EQUIPE`, `AGENTES`, `DIRECAO`,
`TERRITORIO`) nunca travam — entram por `merge=union`.

### O que está em aberto no lado do Mac

- **A repaginação visual.** O dono achou o jogo com "cara antiga e antiquada" e pediu
  exploração. Três frentes: **paper.design** (brief entregue, ele dirige), **Lovable** (só
  exploração e inspiração, **não** para construção), e a ferramenta de design própria — cuja
  primeira tentativa (`salvador-1835`) ele **recusou** ("o layout nao me agrada"). A tese que
  sobreviveu: **Futurismo Ancestral** — Krenak (*Futuro Ancestral*, 2022), Denilson Baniwa,
  Jaider Esbell, Rosana Paulino. "Estes povos não são o passado — são um futuro." Nada disso
  toca o jogo sem passar pelo dono: é §2.
- **A identidade pessoal está separada da conta de trabalho**, por construção, não por cuidado:
  `~/.gitconfig` com `includeIf hasconfig:remote.*.url:git@github-pessoal:*/*` (o curinga `**`
  da documentação **não casa nada** — foi medido) + host SSH `github-pessoal` com
  `IdentitiesOnly yes`. **A conta e o e-mail de trabalho nunca se usam aqui** — o nome dela não
  entra neste repositório, que é público.

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
