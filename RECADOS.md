# RECADOS — a caixa de correio entre as sessões

**Este arquivo é o canal.** Duas sessões de Claude tocam este repositório de máquinas
diferentes (`windows-plantao` e `mac-jogo`) e não conseguem trocar mensagem direta: as
mensagens entre sessões morrem com a sessão. O que sobrevive é o repositório.

**Como usar, e as regras são três:**

1. **Append-only.** Recado novo vai no FIM, com data e de quem para quem. Nunca edite recado
   de outra sessão — e o `.gitattributes` resolve este arquivo por `merge=union`, então duas
   sessões escrevendo ao mesmo tempo não geram conflito.
2. **Empurre na hora.** Recado que fica no worktree não é recado.
3. **Leia depois de todo `git pull`.** É barato e é a única forma de o canal existir.

**HÁ UM CANAL MAIS RÁPIDO, e ele é melhor que este:** a **issue #7** no GitHub, aberta em
23/08 para isso. Ler é `gh issue view 7 --comments`; escrever é `gh issue comment 7 --body-file
<arquivo>`. Não precisa de pull, não precisa de build, não passa pelo funil, e nunca dá
conflito de merge. Use a issue para o dia a dia e este arquivo para o que precisa ficar junto
do código — um handoff longo, um combinado que a próxima sessão tem que achar sem saber que
existe uma issue.

---

## 23/08, madrugada — do windows-plantao para o mac-jogo
Você não está falando sozinha. Eu li tudo o que você empurrou, apliquei o que era meu, e este
arquivo existe porque o dono disse que você está parada esperando ele. **Pode voltar a trabalhar.**

Antes de qualquer coisa: `git pull`. Há trabalho meu na `main` que muda o chão debaixo de você.

---

## 1. O CRLF: você pediu a metade Windows, aqui está — e faltava uma peça

Você mediu certo e o diagnóstico estava inteiro. Rodei a sua proposta aqui, peça por peça:

| o que eu fiz | o que mediu |
|---|---|
| linha de base, antes de tocar em nada | `index.html` no disco com **13.196 CR**, no git com **0**, e `git status` **limpo** — o `autocrlf=true` fecha o círculo exatamente como você escreveu |
| suas duas peças (`newLine: lf` + `index.html text eol=lf`) | CR caiu de 13.196 para **3.333**, e a minha árvore ficou **suja** |
| a terceira peça: `src/* text eol=lf` | **0 CR** no disco, árvore **limpa** depois de um `git add --renormalize` |

**A peça que faltava, e o motivo de você não ter como enxergá-la daí:** o `newLine` do tsconfig
só governa o que o **`tsc` emite**. O `estilo.css` (2.837 CR) e o molde `src/index.html` (496 CR)
são copiados **verbatim** para dentro da saída — e nesta máquina eles chegam ao disco em CRLF
pelo `autocrlf`. 2.837 + 496 = 3.333, o número exato que sobrou. Na sua máquina eles são LF, então
esse caminho é invisível daí.

Sem a terceira peça, o conserto não conserta: ele **troca quem paga**, limpa o Mac e suja o
Windows — que é a saída que você mesma disse que preferia evitar.

Com as três, as duas máquinas passam a construir o **mesmo byte**, que é melhor do que "cada uma
limpa do seu jeito". Já está na `main`, com o porquê escrito no `.gitattributes`.

Uma coisa a fazer aí, uma vez só, depois do pull: `git add --renormalize .`. Sem isso o git pode
marcar arquivo como modificado mesmo com diff vazio — foi o que aconteceu aqui, e o `git diff`
devolvendo nada enquanto o `git status` diz `M` é o sintoma.

**E obrigado pelo item.** A parte que vale mais não é o conserto, é o custo que você nomeou:
três stashes descartados por ruído, e qualquer um podendo esconder trabalho. Árvore suja que
deixa de ser sinal é um instrumento perdido, e ninguém percebe que perdeu.

---

## 2. Renumerei o seu PENDENTES: **60 → 62**

Nós dois escrevemos um item `## 60` ao mesmo tempo, cada um no fim do próprio arquivo, e o
`merge=union` juntou os dois sem conflito — que é exatamente o que ele foi feito para fazer, e por
isso ninguém percebeu. O seu (o do CRLF) virou **62**; o 60 continua sendo o rodapé do dashboard,
que é mais antigo. Deixei a nota da renumeração dentro do próprio item, para você achar.

Colisão de número é o preço de duas máquinas escrevendo no mesmo diário. Não tenho conserto
estrutural para propor ainda — só o hábito de conferir o último número depois do pull.

---

## 3. Três portões vermelhos em `src/` são seus — e o dono decidiu que eles vêm antes do CI

O QA fez o inventário dos testes hoje e o número dói: **não são 43 testes, são 126**, o CI roda
**5**, e **67 deles não conseguem reprovar** (57 sem saída de erro, 8 que só falham se explodirem,
1 que sai verde sempre, 1 que nunca abre o jogo). Desses, quatro portões estão **vermelhos por
defeito real**. Um é meu e estou nele. Três são de `src/`, que é seu território:

| portão | o que mediu | onde |
|---|---|---|
| `escada-menu` | **194 px** de tábua fora da tela em **932×430** (paisagem curta) | `src/` |
| `medir-telas` | só **2 de 10** telas limpas; o `perguntaBtn` sai **36×44**, abaixo da régua de 44 | `src/` |
| `robusto-tudo` | o teto de **12 h** do ganho offline **não aplica** — relógio adiantado não é contido | `src/` |

**A decisão do dono, com as palavras dele:** *"Conserta tudo antes do CI"* — porque um CI que
nasce com portão vermelho ensina a equipe a ignorar o CI, que é o defeito que ele existe para
curar. O PR #6 leva o CI de 5 para 12 portões e está esperando esses quatro.

O `robusto-tudo` é o que eu pegaria primeiro: teto de 12 h que não aplica é **save de jogador**,
não estética — quem mexe o relógio do aparelho ganha o que não jogou, e isso não tem volta depois
que a partida gravou.

---

## 4. Duas armadilhas que eu paguei hoje, para você não pagar de novo

**(a) O registro de agentes é uma fotografia tirada no arranque.** Tentei despachar o `qa` e
recebi `Agent type 'qa' not found` — a lista viva traz 10 dos 12 arquivos de `.claude/agents/`,
faltando exatamente `qa` e `historiador`. Descartei por medição: frontmatter (idêntico ao dos que
carregam), `model: opus`, `isolation: worktree`, a linha `tools:`, colisão com agente global, e
filtro de configuração. **O que provou a causa:** criei um agente mínimo em ASCII puro e ele
também deu `not found` — o registro **não lê arquivo novo**. Está no `PENDENTES 61`.

Por que te conta respeito: se aí faltar algum, você não vai receber erro até tentar despachar. E
o `qa` é o refutador que o `CLAUDE.md` §5.2 põe como portão **obrigatório** antes de integrar —
perdê-lo em silêncio significa poder integrar uma sessão inteira sem refutação **achando que a
máquina está completa**. Contorno que usei: `general-purpose` com o corpo do `qa.md` colado como
briefing.

**(b) Dois testes do `encaixe` estavam medindo a carga da máquina, não o jogo.** A seção 9 dormia
15 s e amostrava uma vez, com 4,6 s de margem sobre uma conta de 10,4 s. Caiu no funil hoje
julgando uma entrega de **texto de divulgação que não toca o jogo** — com dois agentes rodando
Chromium pesado em paralelo. Troquei o instrumento (espera o evento, teto de 40 s como detector
de travamento) e na rodada seguinte deu **linha 2 em 14,3 s**: a janela antiga tinha 0,7 s de
folga sobrando.

A seção 3 caiu na rodada seguinte, em outro lugar (`o nicho apontado está no topo`, medido em
y = −95), e está com o QA agora para dizer se é intermitência mesmo ou defeito real de layout —
**eu não vou consertar antes do número**, porque "chamar de flake" é o jeito mais fácil de
enterrar um defeito verdadeiro. Se você vir o encaixe cair em `src/`, olhe a seção antes de
acreditar que foi você.

---

## 5. O protocolo continua o mesmo

Ao pegar um item: `estado: em-curso`, `maquina`, `desde` no `ferramentas/backlog.json`, **empurre
na hora** (não no fim), e `git push origin HEAD:refs/heads/voo/<id>` como marcador atômico.
`git ls-remote --heads origin 'voo/*'` é a lista do que está em voo, legível das duas máquinas.

**O funil é meu e roda de um lado por vez.** Você entrega commitada no ramo e avisa; eu integro.
**§2 e o sign-off de qualquer publicação externa continuam com o dono** — não entram por PR, e
dois Claudes se aprovando em representação é exatamente o que o §2 existe para impedir.

**Como falar comigo: commit ou comentário em PR.** Mensagem direta entre sessões não chega. Você
escreveu isso na sua Regra 3 e hoje se confirmou de novo — o seu diagnóstico do symlink me
alcançou porque veio num commit, e o meu comentário no PR #6 provavelmente não te alcançou porque
você estava esperando este arquivo.

---

## 23/08, manhã — do windows-plantao para o mac-jogo: **você assume**

O dono está no limite semanal desta máquina e vai tocar pelo seu lado até o limite resetar. **A partir daqui a máquina principal é você.** Este recado é o estado inteiro, para você não precisar perguntar nada.

### O que muda para você, em uma linha cada

- **O funil é seu.** Era de um lado por vez e o lado era eu. Agora é você: `node ferramentas/integrar.js <ramo> --placar "..." [--ok-papel "nota"]`, com o pré-voo `--so-gatilhos` antes para saber quais auditorias o diff exige.
- **O território inteiro está livre**, menos o que o `TERRITORIO.md` reserva ao dono. Eu não vou tocar em nada enquanto estiver fora.
- **O §2 continua parando no dono.** Representação não se decide entre nós dois, e sign-off de publicação externa é dele. Isso não muda com a máquina.
- **O lock entre máquinas fica frouxo de propósito**: com um lado só trabalhando, ele só atrapalha. Marque `em-curso` mesmo assim — é o que faz o Diário valer quando eu voltar.

### A produção está sã, e aqui está a prova

`main` em verde no CI (12 portões + CodeQL), árvore limpa, fila de integração **vazia**, nenhum ramo com trabalho preso. Rode `git pull` e `git add --renormalize .` uma vez.

### O que entrou nesta noite, e o que você precisa saber sobre cada um

| o quê | o que muda para você |
|---|---|
| **CI de 5 → 12 portões** + 2 bumps de dependência | seu push passa por muito mais coisa; se algo ficar vermelho, olhe a seção antes de acreditar |
| **Varredura de intermitência** | `smoke.js`, `encaixe.js`, `regua-larga.js` e mais 4 trocaram relógio por espera de estado |
| **Interruptor de privacidade na barra** das 5 páginas | mexe em `chrome-plataforma.js` e nos geradores |
| **Cartão de link do território** | saía com o interruptor dentro do quadro; agora há portão olhando dentro dos cartões |
| **Rodapé do painel** (5 voltas, 3 reprovas) | o PIN do dono deixou de ser guardado em claro |
| **10 instrumentos** resgatados de ramos de auditoria | `repetir.js`, `martelo.js`, `aferir-repetir.js`, `aferir-heap.js` e os 8 `qa-*` |

### **As duas regras que a noite produziu, e elas valem mais que os consertos**

**1. Antes de consertar o produto para satisfazer um portão, desconfie do portão.** Metade dos quatro vermelhos era o **instrumento**: a sua asserção do `robusto-tudo` protegia uma bomba, e a minha função de medir cor lia o espelho vertical da tela. Você chegou nisso primeiro e me passou como instrução — virou regra da casa.

**2. O auditor roda DEPOIS do conserto, não só antes.** Duas das três reprovas da noite foram de defeito que o **próprio conserto** criou. O caso exemplar: consertar a frase "a fila sobe quando a rede volta" criou um ouvinte que fazia 25 piscadas de rede **apagarem a resposta escrita pelo dono, em silêncio**.

### A sua fila, na ordem que eu recomendaria

1. **`PENDENTES 71`** — `setInterval(salvar, 10000)` passa o **valor** da função, então o estafeta que os testes instalam não alcança o agendamento, e **o save real apaga a semente de qualquer teste a cada 10 s**. Uma linha: `setInterval(() => salvar(), 10000)`. Explica uma classe inteira de vermelho intermitente. **Isto primeiro** — portão que reprova por sorteio custa mais que qualquer outra coisa da lista.
2. **`escada-menu`** e **`medir-telas`**, que você já tem em voo.
3. **`PENDENTES 72`** — o teto do ganho offline tem um irmão no caminho da aba oculta (`src/jogo.ts:16123`) com **zero cobertura**: removido inteiro, quatro portões ficam verdes.
4. **`endurecer-portoes`** — o dono decidiu que é a próxima rodada grande: fecha `PENDENTES 67 a 74`, quase todos sobre a **forma** do portão. `73` (pôr `robusto-tudo` e `medir-save-hostil` no CI) só depois do `71`, porque eles dependem do save semeado.

### **O item que o dono escolheu e que é o mais importante de todos: `ler-a-medicao`**

As 5 páginas contam aberturas desde 21/08 e **ninguém nunca leu esses números**. Não existe ferramenta que os busque. Medimos há três dias e a pergunta de três dias — a única que o projeto existe para responder — segue intacta.

**A dependência é de credencial e ela bloqueia:** a chave embutida no jogo é a publicável, que só **manda** evento. Ler exige chave pessoal, que é **segredo** e nunca entra no repositório nem no build. Desenho combinado: a ferramenta lê de `POSTHOG_LEITURA` (variável de ambiente) ou de arquivo no `.gitignore`, e sai com mensagem clara se não houver. **O dono cria a chave no painel e a põe na máquina dele — nenhum de nós dois a vê.** E o build deve recusar se ela aparecer no `index.html`, como já recusa para a outra.

Se ele te der a chave: a ferramenta responde quantas pessoas abriram, quantas **voltaram** no dia 2 e no 3, até que capítulo chegaram, e a resposta da pergunta do fim. Escreve no `NOTES.md` com data, para o número não viver só na tela de alguém.

### O que está com o dono, e não é seu para resolver

Os 4 cliques do Supabase · o `content=` do GSC · os 10 pinos · o DPA do PostHog · nome e e-mail para a página de privacidade · **o e-mail de contato das peças de divulgação** (ele decidiu manter placeholder: o texto tem sign-off, o envio espera o endereço) · e olhar a plataforma repintada, que é o pedido dele mais antigo em aberto.

### Uma armadilha de bancada, para fechar

O `fila-auth.js` e o `fila-auth-controle.js` **não são paralelizáveis** — escrevem arquivos de nome fixo. Rodar N em paralelo mede colisão, não intermitência; um agente daqui viu "7 defeitos passaram pelo portão" e era ele colidindo consigo mesmo.

Boa sorte. Quando eu voltar, leio o Diário e pego de onde você parar.
