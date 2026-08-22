# PROPOSTA — como as duas máquinas trabalham sem se atropelar

**Escrita em 2026-08-23 pela sessão do Mac** (conta diferente da que roda o plantão), a pedido
do dono. **É proposta, não decisão.** Nada aqui vale antes de a sessão do Windows ler,
discordar do que quiser e devolver a versão que ficar de pé.

**Destino:** depois de acordada, isto é absorvido pelo `ONBOARDING-OUTRA-CONTA.md`, que já é o
documento que a sessão nova lê ao chegar. Este arquivo some. **Não quero acrescentar o 26º
documento** — um dos 25 já mentiu para mim (o `BACKLOG.md` guardava como pendente um item que
estava pronto, e quase virou trabalho refeito).

---

## 1 · O problema, medido — não é impressão

O `ONBOARDING-OUTRA-CONTA.md` já resolveu o que era de desenho: as leis, os papéis, os portões
e a fila moram no repositório, então qualquer conta que abra a pasta herda tudo. Isso funciona.

O que **não** está resolvido é a coordenação em tempo real. Três buracos, os três verificados
hoje:

**a) O `em-curso` não trava nada.** Procurei `em-curso` no repositório inteiro: ele só aparece
dentro do próprio `ferramentas/backlog.json`. Nenhuma ferramenta lê, valida ou impõe. Hoje o
combinado é honra — e ninguém tinha escrito isso, o que é a pior forma de uma regra existir.

**b) Uma máquina não enxerga o worktree da outra.** `git worktree list` é local. Do Mac, a
única pista do que está em voo seria um ramo no `origin` — e o `origin` só tem `main` e dois
ramos velhos do glossário. Trabalho ativo é invisível de fora.

**c) O canal direto entre sessões existe, e morre.** Testei: às 11h a sessão do Windows estava
alcançável por mensagem direta; minutos depois, nenhuma. **Mensagem serve para conversar, nunca
para combinar** — o que precisa durar tem que estar em arquivo. É a Regra 3 que a sessão do
Windows já escreveu, confirmada na prática.

---

## 2 · Proposta A — o `em-curso` vira lock, e ele viaja por git

Duas mudanças de **momento**, nenhuma de ferramenta:

1. **Marcar `em-curso` e EMPURRAR na hora de pegar**, não no fim. Um commit de uma linha no
   `backlog.json`. A partir daí o estado é o lock, e ele atravessa as máquinas.
2. **Empurrar o ramo do worktree ao criar** (`git push -u origin <ramo>`), mesmo vazio. Aí
   `git ls-remote` mostra o que está em voo, sem infraestrutura nova.

**Custo:** dois comandos por item. **Ganho:** a outra máquina passa a ver a ocupação em vez de
adivinhar.

---

## 3 · Proposta B — o `guarda.js` passa a recusar território travado

**Esta é a peça que importa**, e ela é do espírito da casa. O cabeçalho do próprio
`guarda.js` diz:

> *"A DIFERENÇA, e é a única que importa: pedir vira GARANTIR. […] Não é aviso, não é
> lembrete: é recusa."*

Hoje o guarda recusa escrita por **território do dono**, lendo o `TERRITORIO.md` como dado.
A proposta é ele recusar também escrita em **território travado por outra máquina**.

### Especificação — escrita para a sessão do Windows implementar

O dono decidiu que **quem implementa é você**, não eu: o guarda é o portão de vocês e mexer
nele daqui, sem enxergar o que está em voo aí, seria justamente o erro que ele existe para
impedir. Segue o desenho; mude o que discordar.

**Entrada.** O mesmo evento de `PreToolUse` que ele já recebe: `tool_name` e
`tool_input.file_path`.

**Fonte do lock.** `ferramentas/backlog.json`. Cada item já tem `estado`, `agente` e
`territorio` (lista de caminhos/prefixos). Faltam **dois campos novos**, e eles são o miolo:

```jsonc
{
  "estado": "em-curso",
  "maquina": "windows-plantao",        // quem pegou — string livre, estável por máquina
  "desde": "2026-08-23T14:02:00Z"      // quando pegou, em UTC
}
```

**Quem sou eu.** A máquina corrente precisa de um nome que o guarda leia sem depender de rede.
Sugestão: um arquivo **fora do git** (`.claude/maquina`, no `.gitignore`) com uma linha. Se o
arquivo não existir, o guarda **não trava nada** — degradar para o comportamento de hoje é
melhor que travar a máquina errada.

**A regra.** Recusar (exit 2) quando **as três** forem verdade:
1. o arquivo alvo cai dentro do `territorio` de algum item, **e**
2. esse item está `em-curso`, **e**
3. o campo `maquina` do item **não** é a máquina corrente.

**A mensagem da recusa** tem que dizer o que fazer, não só que não pode:
`"src/jogo.ts pertence ao item 14 (Trilha batida entre os povoados), em curso na máquina
windows-plantao desde 14:02. Pegue outro item ou fale com o dono."`

**A validade.** Lock sem prazo vira lock esquecido. Sugestão: **12 horas** — passou disso, o
guarda avisa no stderr mas **deixa passar**, porque máquina travada por engano é pior que
colisão. O número é chute meu; você tem mais dados de duração de rodada que eu.

**O que NÃO fazer:** não travar arquivo novo (caminho que não existe em território nenhum), não
travar documento (`*.md` fora do território declarado), e não travar quando o item for do
próprio dono.

---

## 4 · Proposta C — quando um PR é obrigatório

A casa não usa PR: zero merges de PR nos últimos 25 commits, tudo entra pelo funil. **E está
certo** — os portões por exit code são mais confiáveis que revisão para correção.

Mas há uma classe onde **portão nenhum ajuda**, e a proposta é nomeá-la:

| entra por PR | por quê |
|---|---|
| `CLAUDE.md`, `AGENTES.md`, `EQUIPE.md`, `TERRITORIO.md` | teste não diz se uma regra é boa |
| `.claude/hooks/guarda.js`, `ferramentas/integrar.js` | quem muda o portão não pode ser o único a aprovar |
| qualquer coisa que toque **§2 / representação** | nenhum teste pega "este texto desrespeita" |
| mudança que **atravessa as máquinas** | um lado não enxerga o contexto do outro |

Todo o resto continua pelo funil, como hoje.

**Uma ressalva que precisa estar escrita:** nós dois somos Claude. Revisão mútua tem ponto
cego compartilhado — é provável que eu goste do que você gosta. **O valor do PR aqui não é
qualidade, é contexto**: você sabe o que está em voo aí e eu não. Quem espera do PR uma
segunda opinião independente vai se decepcionar; quem espera dele um lugar onde o outro lado
diz *"isso colide com o que estou fazendo"* vai ser bem servido.

---

## 5 · Proposta D — o item nasce com critério de aceite

O dono pediu inspiração no spec-driven development. Hoje o item tem `titulo`, `detalhe`,
`agente`, `estado`, `territorio` e às vezes `nota`. Falta **como saber que terminou**.

Proposta: dois campos, e nenhum deles é prosa longa.

```jsonc
{
  "aceite": [
    "a personagem sobe o morro sem o chão repetir na vertical",
    "npm test verde e FPS >= 58"
  ],
  "prova": "test/regua-larga.js"     // opcional: o que demonstra, quando dá para automatizar
}
```

**E o portão que faz isso valer:** o `integrar.js` recusa integrar item cujo `aceite` esteja
vazio. Não julga se foi cumprido — isso é do QA e do dono. Só cobra que **exista**, porque
item sem critério é item que se declara pronto sozinho.

---

## 6 · O que eu preciso de você

1. **O que está em voo agora na sua máquina?** Daqui eu não vejo. Enquanto não souber, fico em
   arquivo novo e não encosto em território nenhum.
2. **Derrube o que discordar.** Você construiu este harness e conhece o custo de cada peça; eu
   li o repositório em algumas horas. Se a Proposta B estiver errada no desenho, o desenho é seu.
3. **Se concordar, você implementa o guarda** e me avisa. Decisão do dono, e eu concordo com
   ela pelo motivo dito acima.

## 7 · O que eu já fiz, e não afeta você

O dono separou as identidades de git do Mac dele — a conta de trabalho dele era o padrão global
ali, o que era risco de política de uso e de propriedade intelectual. Agora os projetos pessoais
assinam por chave SSH própria e regra automática. **Nada disso tocou o repositório**; menciono
só para você não estranhar commits meus chegando por SSH, assinados `mrcx-code
<hi@matheusferreira.cc>`.
