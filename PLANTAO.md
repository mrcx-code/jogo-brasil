# PLANTÃO — como uma sessão toca este projeto sozinha

Este arquivo existe porque ele faltava. Em 23/08 o plantão passou de uma máquina para outra e
foram precisos **quatro documentos** para transmitir o que deveria caber em um: o `RECADOS.md`
diz o estado, o `EQUIPE.md` briefa os agentes, o `CLAUDE.md` tem as leis — e **nenhum deles
dizia como a sessão se mantém andando**. Isto aqui é o motor.

Vale para qualquer sessão, em qualquer máquina.

---

## 1. O laço, que é a coisa toda

Uma sessão de plantão **não espera pedido**. Ela roda num laço:

```
escolhe o próximo trabalho  →  despacha agentes em paralelo  →  enquanto eles correm,
faz o trabalho da própria linha  →  agente pousa  →  manda auditar  →  integra pelo funil
→  registra o que MEDIU  →  volta ao começo
```

Nada disso pede permissão. O dono deu licença permanente (`CLAUDE.md` §5.2) e pediu ritmo
contínuo. **Perguntar "quer que eu continue?" é desobedecer**, não ser cuidadoso.

O laço só para em três coisas, e todas as três estão no `CLAUDE.md`: representação (§2),
sign-off de publicação externa, e credencial.

**Como se mantém acordado.** Use o mecanismo de laço da ferramenta (`/loop`) com um prompt que
carregue o estado inteiro. A cada volta, reescreva o prompt com o que mudou — ele é a memória
que atravessa o intervalo. Um prompt de laço bom tem: o que está em voo (com id), o que está na
fila de integração e em que ordem, o que foi decidido e por quem, as armadilhas ativas, e o que
vai para a mesa do dono quando ele voltar.

**Enquanto os agentes correm, a sua linha não fica parada.** Isso é metade da vazão. Enquanto
três agentes mediam, esta sessão limpou 55 worktrees, escreveu diário, respondeu à outra máquina
e mergeou dependências.

---

## 2. Despachar agente: o que separa um bom brief de um pedido

Um agente com brief ruim devolve resumo. Um com brief bom devolve **número e desmentido**. A
diferença é escrevível, e é isto:

**Dê o contexto que criou a pergunta**, não só a tarefa. "Meça X" produz uma medição. "Meça X,
porque a afirmação Y foi feita sem número e ela está sustentando a decisão Z" produz alguém que
sabe o que está em jogo e discorda quando precisa.

**Diga o que você quer que ele DERRUBE.** As melhores rodadas de 23/08 vieram de briefs que
pediam refutação: *"a afirmação é esta; tente derrubá-la"*. Uma delas derrubou a hipótese de
quem pediu, com número, e valeu mais que se tivesse confirmado.

**Avise do seu próprio viés, por escrito.** *"Esta entrega me agrada: ela achou defeito contra si
mesma e declarou três dúvidas. Entrega honesta é onde eu baixo a guarda. Se alguma régua ficou
mais frouxa, diga."* Isso muda o comportamento do agente — foi assim que apareceu o cartão de
link publicado com o botão dentro.

**Exija exit code REAL.** A frase é literal: *"nunca relate resultado que você não viu sair do
terminal"*. Sem isso, chega "rodei e passou" sobre um teste que nem existe mais.

**Peça a prova de que o controle morde.** Quem escreve asserção nova injeta o defeito, mostra o
exit 1 e restaura. Sem isso a asserção é decoração — e decoração assinada de verde é pior que
teste nenhum.

**Nomeie o que NÃO é dele.** Território, §2, e o que outro agente está tocando. Dois agentes da
mesma máquina **não se separam pelo lock** (mesmo valor de `maquina`), então a separação é sua,
na hora de escrever o brief.

**Peça a linha do placar** (`EQUIPE.md` §5) no formato: rodadas, achados, reais, desmentidos.
É o que faz a próxima rodada não redescobrir o mesmo buraco.

**Avise que o worktree nasce sem `node_modules`.** Uma linha: *"o seu worktree pode nascer sem
`node_modules`; se o build morrer em `Cannot find module .../typescript/bin/tsc`, rode
`npm install` — é a máquina, não a entrega"*. A regra já existia no §4 desde 01/09, em prosa, e
**mesmo assim eu a omiti nos três briefs de 03/09** — porque quem escreve brief lê o §2, não o
§4. Custou um minuto a cada agente e um diagnóstico que eles tiveram de refazer sozinhos
(medido: `npm install` = **103 pacotes**). Regra que mora longe de quem a executa não é regra, é
anotação; por isso ela passou a morar aqui também.

---

## 3. Quantos agentes, e de que tipo

Teto prático: **oito simultâneos**, e raramente vale mais que três ou quatro — não por regra, mas
porque **carga de máquina derruba portão**. Medido em 23/08: um teste que falha 0 vez em 8 com a
máquina calma falha 14 em 50 com cinco processos em paralelo. Se as duas máquinas rodarem frota
ao mesmo tempo, as duas veem o funil rejeitar trabalho bom por sorteio.

**MODELO E INTENSIDADE PELO PESO DO ITEM, NÃO PELO DEFAULT DO PAPEL (dono, 24/08):** *"fique
à vontade para ajustar os modelos e intensidade para cada item, não queremos gastar tokens à
toa"*. O `.claude/agents/` traz um modelo por papel — é o ponto de partida, não a ordem. Ao
despachar, escolha pela dificuldade REAL do item:

- **opus** — só onde o raciocínio paga: mudança de mecânica ou economia no `src/jogo.ts`, o
  `qa` tentando refutar, o `porteiro` (auditoria de infra/segurança de página pública), e o
  texto histórico do `historiador` (§2 não se arrisca).
- **sonnet** — o grosso do trabalho de forma: ajuste de CSS, gerador de seção, texto de
  divulgação, conserto de portão já diagnosticado, revisão de leitura.
- **haiku** — o mecânico de verdade: renomear, somar à lista branca, contar, um `--sql` de
  migração. Gastar opus nisso é queimar token à toa, que é o que o dono pediu para evitar.
- **efeito colateral desta máquina:** `arte` e `pm` são **fable**, que **exige créditos** na
  conta atual e mata o agente no arranque (medido em 24/08). Enquanto assim, despache os dois
  com override para **sonnet** no rotineiro e **opus** só no julgamento fino (veredito visual,
  virada de estratégia). O contorno é o mesmo do `general-purpose` com o corpo do papel colado.

A régua é uma só: **o item mais barato que resolve.** Subir de tier é decisão, não default —
e quando subir, o comentário do despacho diz por quê, como qualquer outra medição desta casa.

**`isolation: "worktree"` é obrigatório** para qualquer agente que toque `src/`. E limpe os
worktrees depois: eram 69 cópias no disco disputando 254 portas, com 10 pares colidindo.

**Confira a sua lista de agentes antes de contar com alguém.** O registro é uma fotografia tirada
no arranque e não relê o disco — nesta semana faltaram três de um lado e dois do outro, conjuntos
diferentes. Contorno: `general-purpose` com o corpo do `.claude/agents/<papel>.md` colado no
brief. Perder o QA em silêncio significa integrar uma sessão inteira sem refutação **achando que
a máquina está completa**.

### ⚠ PORTÃO NÃO RODA EM PARALELO COM PORTÃO NO MESMO WORKTREE (23/08)

Achado por um agente do `dev-jogo` na rodada do `medir-telas`, e ele fecha a mesma classe de
problema que o `PENDENTES 71`: **reprovação por sorteio que a gente vinha chamando de carga de
máquina.**

Todos os instrumentos derivam a porta do **hash do caminho da raiz** (`test/abrir.js`). Num
worktree, todos veem a mesma raiz — então **todos disputam UMA porta**. O portão que termina
primeiro fecha o servidor debaixo dos outros.

O que isso fabrica, medido: `ERR_CONNECTION_REFUSED` no meio de uma rodada, e — pior, porque
parece defeito de verdade — um falso **"hudLinha acima da tela −11"**, que não existe. Rodados um
de cada vez, os mesmos três portões deram **0, 0, 0**.

**Regra:** um portão por vez dentro de um worktree. Se vir vermelho numa rodada paralela,
**confirme que não é isto antes de reportar** — e antes de mandar alguém consertar o que não
está quebrado. É o mesmo erro que custou uma semana com o `setInterval(salvar, …)`: um teste que
falha por sorteio é mais caro que um teste que falha sempre, porque ninguém acredita nele e
todo mundo continua empurrando.

---

## 3.2 TOKENMAXXING — o gasto é medido, não estimado (dono, 24/08)

*"tamo gastando muito token."* Diagnóstico do dia, ordenado por desperdício × frequência. Cada
regra tem número medido ao lado, senão vira "economize à toa".

1. **LER POR FAIXA, NUNCA O ARQUIVO.** `src/jogo.ts` tem **16 mil linhas** (~200k tokens). Agente
   que o abre inteiro para "entender" ingere o repositório de código só para se orientar. O brief
   aponta o **bloco/faixa exato** e manda `grep` antes de `Read`. Vale para `index.html` (13k) e
   `NOTES.md` (10k) também.

2. **GREP DE REPOSITÓRIO EXCLUI BASE64.** Os 11 `pack-*.json` e o `index.html` são MBs de base64;
   um grep sobre eles cuspiu **5,7 MB** no contexto de uma vez em 24/08. Sempre
   `git grep ... -- ':!pack-*.json' ':!index.html'` (ou `--include` no que interessa).

3. **RODE O PORTÃO CERTO, NÃO O SUITE.** `npm test` é build (compila 16k linhas + reembute) +
   **Chromium** (118 dos 148 testes usam navegador). Na iteração, rode **só o portão específico**;
   `npm test` cheio **uma vez** antes de entregar. O funil roda o full-run no merge — não rode os
   dois, é dobrado.

4. **O PLANTÃO BAILA CEDO NO OCIOSO.** Antes de subir qualquer agente: se a fila do dono
   (`mesa_resposta`) está vazia, o backlog não secou (`conferir-fila.js` verde) e o CI está verde,
   **registre "nada a fazer" e encerre**. Disparo ocioso tem de custar quase zero — não subir
   agente para descobrir que não havia trabalho.

5. **REPUBLICAR O CHECK só quando mudou de verdade.** O Artifact reenvia o HTML inteiro; update
   pequeno fica no chat.

6. **MEÇA ANTES DE PUXAR CONTEÚDO GRANDE.** Transcript, diff enorme, saída de comando: cheque o
   tamanho (`wc -c`, `--stat`, `head`) antes de trazer para o contexto. Em 24/08 um transcript de
   568 KB truncou ao passar pela ferramenta — medir antes evita o gasto e a surpresa.

A régua, uma frase: **o item mais barato que resolve, e o token que não se gasta é o melhor.**

**MANDATO PERMANENTE (dono, 25/08):** *"quero ter mais controle do que estamos fazendo e quanto
gastamos... temos como garantir que nesse projeto, SEMPRE vc ira avaliar qual a melhor configuracao
da IA para otimizar custos e garantir qualidade no resultado?"* — SIM. Em todo despacho, avaliar e
escolher a config (modelo + esforço) que **otimiza custo E qualidade**, nunca o topo por default;
subir de tier é decisão com motivo escrito. E o painel passa a mostrar **modelo · esforço · tokens ·
custo por agente** (colunas novas na mesa_agente, ver MIGRACAO.md) para tornar isso VERIFICÁVEL — o
dono vê onde o token foi, por frente, em vez de confiar na palavra.


## 4. O ciclo de integração

```bash
node ferramentas/integrar.js <ramo> --so-gatilhos      # quais auditorias o diff exige
node ferramentas/integrar.js <ramo> --placar "..." --ok-<papel> "nota"
git push
```

**Um funil por vez.** Ele faz merge de verdade, roda os portões e desfaz tudo se algum ficar
vermelho.

Três coisas que custaram sessão e não se repetem:

- **Depois do funil, nunca `pull --rebase`** — ele acha o merge e conflita com o que acabou de
  resolver. `push` direto, ou `pull --ff-only`.
- **Não commite na `main` enquanto o funil roda** — se o portão cair, o `reset` leva o seu commit.
- **Push verde não é prova de árvore sã.** Durante um rebase o `HEAD` fica destacado e o ref
  `main` continua no topo original: o push publica a coisa certa enquanto o local está quebrado.

**Antes de julgar um vermelho, olhe se ele é o instrumento.** Metade dos quatro portões vermelhos
de 23/08 era defeito de quem media, não do jogo — e um deles **protegia uma bomba** que o produto
tinha desarmado nove dias antes. `git log -S` na asserção e no código, e leia a mensagem do
commit, antes de tocar no produto.

### ⚠ O PRIMEIRO FUNIL DA NUVEM MORRE NO `tsc`, E A CULPA PARECE SER DA ENTREGA (01/09)

**Rode `npm install` na árvore principal ANTES do primeiro funil da rodada.** O contêiner da
nuvem nasce com o `node_modules` da raiz **incompleto** — medido nesta data: `npm install`
acrescentou **103 pacotes**, entre eles o `typescript`, que está no `package.json` (`^7.0.2`) e
não estava no disco.

O que isso produz é um dos vermelhos mais enganosos que esta casa já viu, porque ele chega
**com o nome da entrega colado**:

```
merge feito. Portões...
  npm test -> exit 1
INTEGRAR RECUSOU: npm test vermelho — merge DESFEITO
```

A leitura natural — e errada — é "a entrega quebrou o portão". Ela não quebrou nada: o
`construir.js` chama `node_modules/typescript/bin/tsc`, o arquivo não existe, e o build morre
**antes de olhar uma linha do diff**. Nesta rodada a entrega era **um único arquivo de teste**
(`test/encaixe.js`, +14/−1) e ainda assim foi recusada.

**Como separar em 30 segundos, e vale para qualquer vermelho de funil:** rode o portão na `main`
**limpa, sem merge nenhum**. Se ele já estiver vermelho ali, o problema nunca foi da entrega.

| medido em 01/09 | |
|---|---|
| `npm run build` na `main` limpa, antes do `npm install` | **exit 1** — `Cannot find module .../typescript/bin/tsc` |
| `npm run build` na `main` limpa, depois | **exit 0** |
| mesmo funil, mesma entrega, depois | **exit 0**, integrado |

E note por que os agentes não viram: cada worktree de agente tem o seu próprio `node_modules`
resolvido, então os portões passam **verdes lá dentro** e só a árvore principal está nua. Um
pré-integrador verde não prevê este vermelho — ele não mede a máquina onde o funil roda.

---

## 5. Registrar — e o que conta como registro

Ao fim de cada incremento, escreva no `NOTES.md`: **o que fez, o que MEDIU (número, não
impressão), o que quebrou, que dúvida nova apareceu, e qual é o próximo passo.**

O teste de um bom registro: a próxima sessão consegue continuar sem remedir? Números que vivem só
em mensagem de commit **são redescobertos do zero** — foi cobrança de um auditor em 23/08 e ele
tinha razão.

Registre também **o que caiu**: afirmação sua que foi refutada vale mais que confirmação, porque
impede a próxima sessão de repetir o erro com confiança.

E mantenha o `PENDENTES.md` e o `ferramentas/backlog.json` **verdadeiros**. Backlog que diz
"livre" para item feito é a mesma doença que a casa caça nos portões — afirmação que o objeto não
cumpre — no lugar exato onde se decide o que despachar.

### ⚠ ACHADO ÓRFÃO SE CONFERE NO `git log` ANTES DE VIRAR ITEM (01/09)

O item `canonical-jogo` mandava pôr o `<link rel="canonical">` no molde do jogo, com o aceite
escrito e a evidência citada: *"grep agora: `src/index.html`, 0 ocorrências"*. Medido nesta
rodada, na `main`: a linha está lá, em `src/index.html:55`, desde o commit `f79ce99` de
**24/08** — oito dias antes de o item ser reaberto. A exceção que o build precisa para ela
também já existia (`ferramentas/construir.js:197`).

O item nasceu de uma varredura de "achados órfãos" que releu relatórios antigos de agente e
recriou item para cada achado sem dono, **sem conferir o histórico do arquivo**. O achado do
growth era verdadeiro em 21/08 e foi consertado em 24/08; a varredura o ressuscitou em 01/09.

O custo não é o item perdido — é o **falso verde**. Quem pegasse o item e seguisse o aceite ao
pé da letra escreveria a linha, veria `git diff` **vazio**, e teria como confirmar um achado
que não existia mais. Um item que se cumpre sozinho com um no-op é a forma mais barata de
fabricar trabalho que parece feito.

**A regra:** antes de recriar item a partir de relatório antigo, rode `git log -S'<a asserção>'
-- <arquivo>` e leia a mensagem do commit. É a mesma disciplina que a casa já aplica ao portão
vermelho ("antes de consertar o produto, desconfie do portão"), aplicada um passo antes: **antes
de despachar o conserto, desconfie de que ainda haja o que consertar.**

E o que se salva de um item assim não é nada: o `canonical` existia mas **nenhum portão o
cobria** (`test/encaixe.js` da `main`: 0 ocorrências de `canonical`). O item errado apontava
para um buraco real ao lado do que ele descrevia. Item órfão que morre em falso positivo ainda
merece a pergunta *"e o que garante que isto não volte?"* antes de ser fechado.

---

## 5.1 As tres coisas que o dono percebe quando o plantao esquece

Escritas em 23/08 porque **nenhuma delas estava em documento nenhum** — viviam so na cabeca de
quem estava de plantao, e a passagem de bastao mostrou isso. As tres ja foram cobradas por ele.

**O PAINEL DE AGENTES CONGELA SE NINGUEM O ATUALIZAR, e ele repara.** A tabela `mesa_agente`
no Supabase alimenta o painel que ele abre no celular. Ela nao se atualiza sozinha: e o plantao
que escreve, **a cada despacho e a cada pouso**, o que cada agente esta fazendo. Em 21/08 ele
percebeu que estava parada havia horas e cobrou — com razao, porque painel congelado nao diz
"ninguem trabalhou", diz "nao da para saber", e as duas coisas parecem iguais de fora.

Ao pousar, troque a atividade para o que aquela rodada **descobriu**, nao para "terminou": *"hoje:
refutou 2 achados meus com numero"* vale mais que *"concluido"*.

Se a sua sessao nao tiver acesso ao banco, **diga isso ao dono** em vez de deixar congelar em
silencio — a diferenca entre nao poder e nao lembrar e exatamente o que o painel existe para
mostrar.

**TODO PEDIDO DELE VIRA LINHA, para nenhum prompt ser esquecido.** Ele pediu isso por escrito
("quero poder ir marcando eles como feito para q sumam da lista"). Pedido novo entra na tabela
`mesa_pedido`; pedido atendido vira `feito` e sai da vista dele. **Nao marque feito o que esta
pela metade** — ja aconteceu, e desmarcar depois custa a confianca na lista inteira.

**CRASE NUNCA em mensagem de commit pelo shell.** O bash come o trecho entre elas e ja apagou
**duas vezes** a parte que mais importava da mensagem. Escreva o nome do arquivo ou do simbolo
sem marcacao, ou passe a mensagem por arquivo (`git commit -F`).

E uma de higiene que economiza confusao: **depois do funil, `git checkout -- test/`**. Os portoes
regravam tres prints a cada rodada, e eles sujam a arvore sem que um byte de codigo tenha mudado.
Arvore suja que nao significa nada e como se aprende a ignorar `git status`.

## 5.2 COMO AS TRES MAQUINAS TRABALHAM JUNTAS — por PAPEL, nao por territorio (31/08)

Decisao do dono em 31/08, e ela corrige o desenho anterior. A primeira versao dava a cada maquina
uma **ilha** (o Mac no experimento, a nuvem na fila, o Windows na plataforma). Ele apontou o furo:
*"uma vez que os experimentos acabarem, um lado fica meio inutil... os dois poderiam colaborar
mais"*. Tem razao, e a evidencia estava na semana anterior: o que mais rendeu **nao foi** territorio
separado — foi **o Mac achar um defeito meu e eu achar um dele**. Isso e colaboracao, nao divisao.

**O desenho novo e por PAPEL, e os papeis giram:**

- **PRODUZ** — explora, escreve, despacha frota. Cabe a quem tem plano Max e acesso a modelo forte.
- **REFUTA** — recebe um brief curto e tenta DERRUBAR o que o outro afirmou, com medicao propria.
  E barato em token e e onde apareceram os defeitos de verdade.
- **INTEGRA** — segura o funil. Um so, sempre, e quem for tem de dizer que esta com ele.

**A regra de plano, e ela e de projeto, nao de gentileza:** o Mac e **Pro** (cota menor), o Windows
e a nuvem sao **Max**. Entao **Max paga o que e caro e paralelo** (frota de agentes, auditoria
larga, exploracao); **Pro paga o que e barato e bem delimitado** (refutar uma alegacao especifica,
revisar um diff, medir uma coisa). Mandar o Pro rodar frota queima a cota dele no meio do trabalho,
que e o pior desfecho possivel — trava sem entregar.

**Os experimentos ficam do lado Max**, por decisao dele em 31/08: e aqui que ha Fable e cota para
iterar visual.

## 5.3 A FILA DA INTEGRACAO — o pre-integrador existe e estava parado

O funil roda **um por vez** e leva ~15 min de portao. Com tres maquinas produzindo, isso vira fila:
o gargalo **se move** de token para integracao, e mais faixas autonomas so aumentam a fila.

Conserto decidido em 31/08, e as duas metades ja existem:

**(a) O agente `pre-integrador`.** Ele roda os portoes **DENTRO do worktree da entrega** e devolve
o veredito com as flags prontas (`--ok-<papel>` com prova por grep, a linha de placar conferida).
Como cada entrega tem seu worktree, isso roda **em paralelo**. O funil deixa de ser 15 minutos de
portao e vira o merge mais a conferencia — segundos.

**(b) Integrar em LOTE.** Entregas de territorios disjuntos entram numa passada so, em vez de uma
rodada de funil por entrega. Menos execucoes dos mesmos portoes, mesma seguranca.

**O que NAO muda:** o funil continua sendo **um de cada vez** (ele faz merge de verdade na main), e
nada entra sem exit code real. O pre-integrador **adianta** o trabalho; ele nao substitui o portao.

## 6. Quando o dono escrever `check`

É comando, e as regras estão no `CLAUDE.md` §6. Quatro camadas — **metas, objetivos,
oportunidades, decisões** —, cada decisão com **opções e consequência dita**, a melhor marcada,
item resolvido **sai da lista**, e nada inventado para engordar. Forma preferida: pergunta
interativa, no máximo quatro. Ele lê no celular, então publique a página e mande o link.

O check **não para a produção**: os agentes seguem em worktree enquanto a mesa é montada.

---

## 7. A outra máquina

Canal: `RECADOS.md` (append-only, resolve por união) e a **issue #7** (`gh issue view 7
--comments`, `gh issue comment 7 --body-file`). Mensagem direta entre sessões **não chega** —
medido pelas duas partes.

Protocolo ao pegar item: `em-curso` + `maquina` + `desde` no backlog, **empurre na hora**. Esse
é o lock inteiro.

~~E `git push origin HEAD:refs/heads/voo/<id>` como marcador atômico.~~ **REVOGADO PARA A NUVEM
EM 03/09** — ver a decisão duas seções abaixo (`marcador-voo-so-acumula`): a nuvem não consegue
apagar ref (403), então criar marcador era só produzir lixo, e o canal chegou a 22 de 23 mortos.
Mac e Windows podem seguir criando, porque apagam; e quem criar, apaga ao terminar — marcador
esquecido faz o outro lado achar que o território está ocupado.

### ⚠ O MARCADOR NÃO É A VERDADE — O BACKLOG É (01/09)

Medido nesta data, e muda o protocolo acima: **a sessão da nuvem NÃO CONSEGUE apagar ramo
remoto.** `git push origin --delete voo/<id>` e `git push origin :voo/<id>` voltam
**HTTP 403** do GitHub (não é o proxy: `__agentproxy/status` traz `recentRelayFailures` vazio,
e criar ramo pela mesma credencial funciona no mesmo minuto). O token da sessão remota tem
push, não tem `delete_ref`.

A consequência é estrutural, não um contratempo: a nuvem **cria** marcador e **nunca** o
limpa. Como ela roda de 4 em 4 horas, sem regra todo item que ela tocar passa a parecer
ocupado para sempre — e a fila seca sozinha, por sujeira, com trabalho livre embaixo.

**A regra, e ela vale para as três máquinas:**

> O marcador `voo/<id>` é **pista**, nunca prova. Quem decide se um item está ocupado é o
> `backlog.json`: `estado: em-curso` **e** `desde` dentro de 2 h. Marcador cujo item está
> `livre` ou `concluido` está **morto** — ignore-o e pegue o item.

Assim o marcador vira dispensável em vez de mentiroso, que é o que ele estava a caminho de
ser. Quem PUDER apagar (Mac e Windows apagam) apaga a sujeira que encontrar; quem não puder
diz no `RECADOS.md` quais ficaram para trás, com o id.

E a armadilha que vem junto é a regra da casa dando certo, então vale medida por extenso.
O `git push` recusado **sai com exit code 1** — ele é honesto. Mas a **última linha que ele
imprime é `Everything up-to-date`**, depois do 403, porque o outro refspec da mesma invocação
não tinha o que fazer. Quem lê o fim do log conclui "apagado, nada a fazer" e segue.

Medido nesta data, nas duas leituras do mesmo comando:

| | |
|---|---|
| última linha do log | `Everything up-to-date` → parece sucesso |
| exit code real | **1** → é recusa |

Eu mesmo escrevi aqui, antes de medir, que o exit era 0 — e estava errado, porque tinha
canalizado o `git` para um `tail` e lido o exit **do tail**. `cmd 2>&1 \| tail; echo $?`
mede o tubo, nunca o comando. Redirecione para arquivo e leia o `$?` na linha seguinte.
`git ls-remote --heads origin` é quem responde se o ramo morreu.

### ✅ DECIDIDO EM 03/09: A NUVEM PARA DE CRIAR MARCADOR `voo/` (item `marcador-voo-so-acumula`)

O protocolo do §7 acima manda criar `voo/<id>` ao pegar item. **Essa linha morre aqui, para a
nuvem.** A decisão é entre as duas saídas que o item escreveu — (a) parar de criar, ou (b)
manter e ganhar um coveiro — e é **(a)**, por número, não por gosto.

**O que decidiu, e é o achado desta rodada:** a saída (b) **já estava construída e já foi
tentada quatro vezes**. O `ferramentas/ramos-mortos.js` existe desde 02/09, classifica certo e
cospe os comandos de apagar; o `RECADOS.md` pede *"rodem `--apagar` e colem"* em **4 rodadas
seguidas** (linhas 737, 781, 845, 894). Resultado medido:

| | 02/09 | 03/09 08h UTC |
|---|---|---|
| marcadores `voo/` no servidor | **9** | **23** |
| ramos `entrega/` no servidor | 15 | **28** |
| refs apagados pelos quatro pedidos | — | **0** |

Um plano de limpeza que depende de uma ação humana que não aconteceu em quatro pedidos não é
plano de limpeza. E enquanto ele não acontece, o canal **cresceu 156% em 24 h**.

**Cruzamento de hoje, com o `backlog.json` como verdade:** dos 23 marcadores, **18** apontam
para item `concluido`, **4** não têm item nenhum, e **1** está vivo — e esse um só está vivo
porque esta rodada o marcou quatro minutos antes de contar. **22 de 23 são ruído.**

**Re-medido hoje pela quinta vez, com exit code real** (`git push origin --delete voo/censo-vaomedida`,
redirecionado para arquivo, `$?` lido na linha seguinte):

```
EXIT REAL = 1
error: RPC failed; HTTP 403
...
Everything up-to-date          <- a última linha, mentindo, como sempre
```

Confirmado também que **não é o proxy** (`__agentproxy/status` com `recentRelayFailures` vazio)
e que **não há saída pelo GitHub MCP**: o servidor tem `create_branch` e não tem delete de ramo.
A nuvem só acrescenta. Isso não vai mudar.

**O que passa a valer, para as três máquinas:**

1. **A nuvem NÃO cria `voo/<id>`.** O lock é `estado: em-curso` + `maquina` + `desde` no
   `backlog.json`, empurrado na hora — que é o que o §7 de 01/09 já tinha feito ser a verdade.
   O marcador não decidia nada desde então; só produzia lixo.
2. **Mac e Windows podem continuar criando**, porque eles apagam. Se preferirem parar também,
   melhor — mas para eles é escolha, não conserto.
3. **O legado fica com quem tem `delete_ref`:** `node ferramentas/ramos-mortos.js --apagar` e
   colar. A diferença é que agora a pilha **para de crescer** mesmo que ninguém rode.

**Como saber se funcionou, sem acreditar em mim:** o número de hoje é **23**. Se as próximas
rodadas da nuvem o mantiverem em 23 (ou o virem cair, se alguém apagar), (a) pegou. Se ele
subir, alguma rodada ainda está criando marcador — e o culpado é o prompt agendado, não este
arquivo (ver a nota logo abaixo).

> ⚠ **O PROMPT AGENDADO DA NUVEM AINDA MANDA CRIAR O MARCADOR** — a linha *"use ramo marcador
> `voo/<id>`"* está no texto guardado do agendamento, que roda fora do repositório e **nenhuma
> sessão consegue editar**. Quem entrar de plantão pela nuvem: **este arquivo é posterior e
> vence** — o prompt manda ler o `PLANTAO.md` antes de despachar, e é isto que ele diz. Está no
> `PENDENTES.md` como a única linha que precisa da mão do dono para fechar o item.

### ⚠ NA NUVEM, `git push -u origin main` EMPURRA UM REF DE SEIS DIAS ATRÁS (01/09)

Medido nesta data, e é a armadilha mais barata de cair deste arquivo inteiro, porque o
`CLAUDE.md` **manda** fazer exatamente isto (*"Always use git push -u origin &lt;branch-name&gt;"*).

**A sessão da nuvem roda em `HEAD` DESTACADO.** O contêiner clona e faz checkout do commit,
não do ramo. O `refs/heads/main` local fica onde estava no dia em que o contêiner nasceu e
**nunca mais se move** — enquanto o seu trabalho vai empilhando em cima de um `HEAD` que não
é ramo nenhum.

Medido nesta rodada, com o reflog:

```
git reflog show main
b64a12a main@{2026-09-01 16:24}: branch: Reset to HEAD      <- eu, consertando
e0939a9 main@{2026-08-26 11:37}: branch: Created from refs/remotes/origin/main
```

`refs/heads/main` foi criado em **26/08** e ficou parado **seis dias** — mais de trinta commits
para trás — enquanto o checkout rodava no que a `origin` tinha.

O que isso fabrica: `git push -u origin main` resolve o refspec para o **ref local**, não para
o seu `HEAD`. Então ele empurra o commit de 26/08 e **o seu trabalho não vai junto**. Aqui deu
recusa (`pushed branch tip is behind its remote counterpart`), que é o desfecho **sortudo**.
O desfecho ruim é o silencioso: se o ref local estivesse à frente do remoto em vez de atrás, o
push saía **exit 0** e o commit da rodada ficava no disco de um contêiner que é reciclado.

Controle, porque quem afirma prova. Com `probe` em `b64a12a` e um commit novo em `HEAD`
destacado (`cb90cd5`):

```
git push --dry-run -u origin probe   ->  " * [new branch]  probe -> probe "   (empurra b64a12a)
```

O ref empurrado é `probe`, **não** `HEAD` — o `cb90cd5` que eu acabara de fazer não aparece.

**A regra, para as três máquinas:**

> **Confira `git rev-parse --abbrev-ref HEAD` antes do primeiro commit da rodada.** Se vier
> `HEAD`, você está destacado: `git branch -f main HEAD && git checkout main` antes de
> qualquer coisa. E empurre **sempre por refspec explícito** — `git push origin
> HEAD:refs/heads/main` —, que empurra o que você está vendo, não o que um ref lembra.

O refspec explícito é a forma robusta nas duas situações, então adote-a e pare de pensar
no assunto: `HEAD:refs/heads/<ramo>` não tem como empurrar outra coisa.

### ⚠ A ÁRVORE DA NUVEM NASCE SEM `node_modules` — E O FUNIL CULPA A ENTREGA (01/09)

Custou um ciclo de funil nesta rodada, e o custo real não é o ciclo: é que **o vermelho aponta
para a entrega errada**.

O contêiner clona o repositório e não instala nada. Então o primeiro `npm test` da rodada morre
em:

```
Error: Cannot find module '/home/user/jogo-brasil/node_modules/typescript/bin/tsc'
tsc falhou — nada foi escrito. O index.html no disco continua o de antes.
```

E o `integrar.js` faz o que tem de fazer: `npm test -> exit 1`, desfaz o merge, sai 1. A leitura
natural — e errada — é *"a entrega quebrou o build"*. A entrega não tocou em nada disso; a
máquina é que estava vazia. (O `construir.js` se comportou bem no meio disso: recusou escrever
saída com o `tsc` morto, que é exatamente o §3 funcionando.)

**A regra, e ela é uma linha:**

> Na nuvem, rode `npm install` **antes do primeiro funil da rodada**, e tire o **baseline**:
> `npm test` na `main` **sem** a entrega. Baseline vermelho = a máquina, nunca a entrega.

O baseline é o que separa as duas causas em trinta segundos, e é a mesma disciplina do §8
(*"antes de consertar o produto, desconfie do portão"*) aplicada um degrau abaixo: antes de
desconfiar do portão, desconfie da **máquina que o roda**. Medido aqui: baseline vermelho antes
do `npm install`, **exit 0** depois, e o mesmo funil que recusara passou verde sem uma linha de
código mudada.

Vale para o agente também — o `pre-integrador` desta rodada teve de instalar dentro do worktree
antes de rodar qualquer portão, e o worktree do outro agente idem. **Quem despacha agente que
roda portão avisa no brief que ele pode precisar instalar**, senão o agente devolve vermelho de
ambiente com cara de vermelho de produto.

### ⚠ ANTES DE DEVOLVER ITEM A `livre`, PROCURE O RAMO `entrega/<id>` (01/09)

A regra do marcador acima está certa e **não basta**, e foi esta rodada que descobriu o buraco
que ela deixou.

A rodada `nuvem-20260901T0823` pegou seis itens e a rodada seguinte concluiu que ela **"não
empurrou nada em cinco horas"**, porque os quatro `voo/` apontavam para o commit de backlog.
A conclusão estava **errada**: existem `entrega/rotina-7-sinais` (`d7174e5`) e
`entrega/glossario-substancia-rev2` (`2396a90`) — duas entregas inteiras, com mensagem de
commit medida, que nunca foram pelo funil. Os itens das duas voltaram a `livre`.

**O que eu sei e o que eu não sei, porque a diferença importa e é fácil de atropelar.** Os
commits são datados de **08:34 e 08:42**; a **hora do push** não é recuperável pela API, então
eu **não** afirmo que a rodada das 13:40 podia tê-los visto — talvez os ramos tenham subido
depois dela. O que eu afirmo, e basta para a regra, é que a varredura dela olhou **só `voo/`**:
com `entrega/` fora do campo de visão, essa classe de órfão passa despercebida de qualquer
jeito, tenha subido às 08:42 ou às 13:41.

**O marcador `voo/` diz que alguém pegou. Ele não diz se alguém TERMINOU** — e o que diz isso
é o ramo `entrega/`, que é onde o trabalho pousa. Devolver item a `livre` sem olhar ali é
mandar a próxima rodada refazer do zero um trabalho que já está no servidor.

> Antes de devolver qualquer item a `livre`: `git ls-remote --heads origin 'refs/heads/entrega/*'`.
> Se houver `entrega/<id>`, o item não é livre — é **entrega órfã**, e o trabalho da rodada é
> **auditar e integrar**, não recomeçar. Vá ao funil, não ao agente.

E vale a inversão, que é a regra inteira num fôlego: **`voo/` é intenção, `entrega/` é
resultado, e o `backlog.json` é a verdade.** Os três discordando é o estado normal — quem
decide é o último.

O funil roda **de um lado por vez**. Quem estiver de plantão integra; o outro entrega em ramo e
avisa.

---

## 8. As três regras que a noite de 23/08 produziu

**Antes de consertar o produto para satisfazer um portão, desconfie do portão.**

**O auditor roda DEPOIS do conserto, não só antes** — duas de três reprovas daquela noite foram de
defeito que o *próprio conserto* criou.

**Controle que não morde é decoração** — e cena que morde sozinha mas não morde no conjunto é o
defeito mais silencioso que existe num portão.
