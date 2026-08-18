# AGENTES — a equipe do EQUIPE.md virando máquina

Escrito em 2026-08-17, quando o dono pediu *"agentes para cobrir cada pedaço do jogo, bora
evoluir como um todo pensando e usando conceitos de harness e agentic engineering"*.

O `EQUIPE.md` desenhou os papéis em 07/08 e eles funcionaram — **interpretados por mim, de
improviso**. Não havia isolamento, não havia restrição de ferramenta, não havia território
cobrado por máquina. Este documento é a diferença entre um papel e um agente.

## Os seis, e o que cada um NÃO pode

| agente | modelo | isolamento | edita `src/`? | o portão dele |
|---|---|---|---|---|
| **pm** | fable | — | não | não decide representação nem escreve código |
| **arte** | fable | — | não | não corta imagem, não julga representação |
| **dev** | opus | worktree | sim (motor) | não toca `EPOCAS[]` nem a zona do dono |
| **historiador** | opus | worktree | sim (texto) | `ROSTOS.md` é **somente leitura** |
| **pipeline** | opus | worktree | sim (arte) | não aprova nem recusa representação |
| **qa** | opus | worktree | **não** — só `test/` | não conserta o jogo; devolve o achado |

## As quatro decisões do dono, e por que cada uma

**1 · Os seis, não os quatro.** O `EQUIPE.md` não tinha HISTORIADOR nem PIPELINE — e foi
exatamente nesses dois que mais errei nos últimos dias: o cortador que reprovava arte boa, a
trava de §2 que eu mesmo quebrei ao pôr gente em rua sem verbo. Papel sem dono é papel que eu
improviso, e improviso não tem portão.

**2 · Worktree sempre.** Não "worktree quando houver paralelo": *sempre*. A regra condicional
depende de eu lembrar dela, e foi esquecê-la que fez três agentes embaralharem commits e
apagarem um bloco de teste. Custa ~300ms por agente e torna o embaralhamento impossível por
construção — não improvável, **impossível**.

**3 · O portão de §2 é ferramenta negada, não aviso.** `historiador` e `arte` não recebem
permissão de escrever em `ROSTOS.md`; ao esbarrar em representação devolvem `PARE` com a
**pergunta formulada**, pronta para virar item de check. A regra deixa de depender de o agente
lembrar — que é a única forma de ela valer, porque eu não lembrei.

**4 · Leque com verificação.** De dois a quatro agentes por frente, e um `qa` **independente**
tenta refutar o que eles alegam antes de eu integrar. É o padrão que pega o erro
plausível-mas-falso — o tipo que mais me escapou: o cortador que "provava" colagem, a barra
vazia que era geometria, o instrumento que media o capítulo errado por índice fixo.

## O ciclo

```
pm lê o estado → sprint com territórios DISJUNTOS
   ↓
dev · historiador · pipeline em paralelo, cada um no worktree dele
   ↓
qa tenta REFUTAR cada alegação (não confirmar)
   ↓
eu integro em série, portões (exit code) entre cada patch
   ↓
o que virou PARE sobe para o check do dono, em pergunta fechada
```

## Regras que valem para todos, sem exceção

- **Portão por EXIT CODE**, nunca por ler a última linha da saída. Já empurrei vermelho por
  isso: `tail -2` mostrou as linhas de erro e eu li como resumo.
- **Duas tentativas.** Falhou e você não entendeu na segunda? Pare e devolva `BLOQUEADO` com o
  diagnóstico. Iterar às cegas no teste é o oposto da disciplina daqui e já custou horas.
- **Devolver dado, não prosa.** O relatório é objeto: feito · medido · bloqueado · dúvida.
- **A zona do dono (`TERRITORIO.md`) não vira ticket de ninguém.** Trabalho que precise dela
  para e avisa.
- **Instrumento não medido contra si mesmo não mede nada.**

## ⚠ Os agentes só existem em SESSÃO NOVA

Medido em 17/08, logo depois de escrevê-los: o harness varre `.claude/agents/` na
**inicialização**, então a sessão que os criou não os enxerga (`Agent type 'pm' not found`).
Eles valem a partir do próximo `claude` aberto neste diretório. Não é defeito e não há o que
consertar — é a ordem das coisas, e fica escrito para ninguém procurar bug onde não há.

Enquanto isso, o trabalho segue com `general-purpose` carregando as mesmas instruções no
prompt — o que se perde é justamente o que a definição garante sozinha: o isolamento
automático, a ferramenta negada e o modelo por papel.
