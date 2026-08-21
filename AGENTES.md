# AGENTES — a equipe do EQUIPE.md virando máquina

Escrito em 2026-08-17, quando o dono pediu *"agentes para cobrir cada pedaço do jogo, bora
evoluir como um todo pensando e usando conceitos de harness e agentic engineering"*.

O `EQUIPE.md` desenhou os papéis em 07/08 e eles funcionaram — **interpretados por mim, de
improviso**. Não havia isolamento, não havia restrição de ferramenta, não havia território
cobrado por máquina. Este documento é a diferença entre um papel e um agente.

## A equipe, e o que cada um NÃO pode

> **Atualizada em 20–21/08 por decisão do dono:** a equipe cresceu (juridico · growth ·
> seguranca, 20/08 22:05), o **pm absorveu a estratégia** em vez de nascer um "CEO", e o
> **pipeline fundiu no dev** — a esteira da arte é do dev, as ferramentas ficam todas
> (21/08, respondido pela mesa). A tabela abaixo é o estado vigente; se ela desencontrar
> de `.claude/agents/`, quem vale é a pasta, e esta tabela é que se conserta.

| agente | modelo | isolamento | edita `src/`? | o portão dele |
|---|---|---|---|---|
| **pm** | fable | — | não | não decide representação nem escreve código; estratégia recomenda, não decide pelo dono |
| **arte** | fable | — | não | não corta imagem, não julga representação |
| **dev** | opus | worktree | sim (motor + esteira da arte) | não toca `EPOCAS[]` nem a zona do dono |
| **historiador** | opus | worktree | sim (texto) | `ROSTOS.md` é **somente leitura** |
| **qa** | opus | worktree | **não** — só `test/` | não conserta o jogo; devolve o achado |
| **juridico** | opus | — | não | aponta risco e propõe texto; não publica nada sozinho |
| **growth** | sonnet | — | não | não inventa número, não toca conteúdo histórico nem §2 |
| **seguranca** | opus | — | não | não relaxa trava por conveniência; o que abre fluxo vai ao dono |

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

## O ciclo (revisto em 21/08 — a mesa virou a porta de entrada)

```
dono decide/aciona pela MESA no celular
   ↓
plantão durável (30 em 30 min) é o ÚNICO consumidor da fila mesa_resposta
   — antes da fila, ele confere o CI da main; vermelho passa na frente de tudo
   ↓
pm lê o estado → sprint com territórios DISJUNTOS
   ↓
dev · historiador (e arte/growth/juridico/seguranca no que é deles) em paralelo,
cada um que toca src/ no worktree dele — e a entrega termina COMMITADA no ramo
   ↓
qa tenta REFUTAR (não confirmar) — em LOTE, uma rodada por leva de alegações,
obrigatório quando a entrega muda mecânica, economia, texto de §2, um portão,
ou põe NÚMERO no NOTES.md; dispensável só no que um portão por exit code já cobre
   ↓
a linha principal integra por MERGE do ramo do worktree (nunca cópia de arquivo),
portões por exit code entre cada merge, placar conferido, worktree removido
   ↓
o que virou PARE sobe para a mesa do dono, em pergunta fechada
```

## Regras que valem para todos, sem exceção

- **Portão por EXIT CODE**, nunca por ler a última linha da saída. Já empurrei vermelho por
  isso: `tail -2` mostrou as linhas de erro e eu li como resumo.
- **Entrega de worktree termina COMMITADA no ramo do worktree** (caminhos explícitos, nunca
  `git add -A`; sem push). Árvore suja não se integra: é o commit que torna a integração um
  merge de verdade e o `git worktree remove` seguro por construção. A quase-perda de 19–20/08
  (NOTES.md copiado por cima de commits mais novos, duas vezes) veio de integrar por cópia.
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
