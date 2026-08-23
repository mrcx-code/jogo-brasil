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

**`isolation: "worktree"` é obrigatório** para qualquer agente que toque `src/`. E limpe os
worktrees depois: eram 69 cópias no disco disputando 254 portas, com 10 pares colidindo.

**Confira a sua lista de agentes antes de contar com alguém.** O registro é uma fotografia tirada
no arranque e não relê o disco — nesta semana faltaram três de um lado e dois do outro, conjuntos
diferentes. Contorno: `general-purpose` com o corpo do `.claude/agents/<papel>.md` colado no
brief. Perder o QA em silêncio significa integrar uma sessão inteira sem refutação **achando que
a máquina está completa**.

---

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
