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
  `qa` tentando refutar, `seguranca`, e o texto histórico do `historiador` (§2 não se arrisca).
- **sonnet** — o grosso do trabalho de forma: ajuste de CSS, gerador de seção, texto de
  divulgação, conserto de portão já diagnosticado, revisão de leitura. `growth` já é sonnet.
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

Protocolo ao pegar item: `em-curso` + `maquina` + `desde` no backlog, **empurre na hora**, e
`git push origin HEAD:refs/heads/voo/<id>` como marcador atômico. Apague o marcador ao terminar —
marcador esquecido faz o outro lado achar que o território está ocupado.

O funil roda **de um lado por vez**. Quem estiver de plantão integra; o outro entrega em ramo e
avisa.

---

## 8. As três regras que a noite de 23/08 produziu

**Antes de consertar o produto para satisfazer um portão, desconfie do portão.**

**O auditor roda DEPOIS do conserto, não só antes** — duas de três reprovas daquela noite foram de
defeito que o *próprio conserto* criou.

**Controle que não morde é decoração** — e cena que morde sozinha mas não morde no conjunto é o
defeito mais silencioso que existe num portão.
