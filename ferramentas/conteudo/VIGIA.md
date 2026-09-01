# VIGIA DE VALIDADE — o roteiro do plantão

O alvo dito pelo dono em 19/08 é **evolução ano a ano**, e o CLAUDE.md §8 transformou isso num
requisito com nome: *cada coisa que o jogo afirma passa a precisar responder "quando isto
vence?"*. Em 21/08 o historiador respondeu por 20 verbetes (`vence_em` + `vence_regra`) e o dono
mandou ligar o alerta. Em 22/08 a fase 1 da Avenida A tirou esse dado de dentro do banco.

Faltava a terceira perna, e é esta: **alguém OLHAR, por comando, sem depender de lembrar.**

```bash
npm run conteudo:vigia                          # relógio do sistema
npm run conteudo:vigia -- --hoje 2026-10-05     # determinístico
node ferramentas/conteudo-vigia.js --json       # para máquina (a tarefa mensal)
```

Ele é **offline**: lê `ferramentas/conteudo/*.json`, que é a verdade versionada — o que passou
por `conteudo:puxar`, por um `git diff` lido por gente e por um commit. Ele **não** pergunta ao
banco (para isso existe `node ferramentas/conteudo-puxar.js --conferir`) e **não** pergunta à
internet se a fonte publicou (isso é da tarefa mensal, abaixo). Uma pergunta por comando.

## Os códigos de saída

| exit | quer dizer | quem age |
|---:|---|---|
| **0** | nada vencido, nada malformado | ninguém. É o silêncio esperado. |
| **1** | há **VENCIDO** — o jogo afirma no ar algo fora de prazo | historiador (texto) → plantão (rev+1 por MCP) |
| **2** | **RECUSADO** — o vigia está cego: `vence_em` que não é data, ou `vence_em` sem `vence_regra` | plantão, e antes de qualquer outra coisa |

O 2 existe separado do 1 de propósito. Tratar dado malformado como "nada vencido" faria o alerta
ficar verde exatamente sobre a linha que ele existe para pegar. **Leia o exit code, nunca a
última linha do log** (EQUIPE.md §4).

## Quando rodar

1. **Todo dia 1**, junto com a tarefa mensal `alerta-validade-brasil` — ver a seção seguinte.
2. **Depois de todo `npm run conteudo:puxar`**, antes de commitar o diff: a revisão que acabou
   de chegar pode ter trazido data nova, data órfã ou data que já nasceu vencida.
3. **Antes de integrar qualquer ramo que toque `ferramentas/conteudo-*`** — é barato (não abre
   navegador, não sai da máquina) e é o único portão que olha para o *prazo* do conteúdo.

## O que fazer com cada categoria

### RECUSADO (exit 2) — resolve antes de olhar o resto

Duas formas, e as duas têm o mesmo conserto: **a validade entra com os dois campos, ou não
entra.**

- **data órfã** (`vence_em` sem `vence_regra`): a data chega em 2027 sem dizer a ninguém o que
  abrir. É alarme sem endereço. A regra em PALAVRAS ("PRODES, consolidado em março") é o que
  torna o alerta executável no ano seguinte.
- **`vence_em` que não é data**: `2026-02-30` não existe, e o construtor do JS a aceitaria como
  2 de março sem reclamar. O vigia recusa.

Quem escreve a regra é o **historiador** (é uma afirmação sobre a fonte). Quem aplica no banco é
o **plantão, via MCP**. **Nunca conserte apagando o `vence_em`** — silenciar o alerta é o único
desfecho pior que o alerta tocar.

### VENCIDO (exit 1) — é produção afirmando coisa velha

O caminho inteiro, e ele tem cinco passos porque o texto mora em dois lugares:

1. **Abra o que a `vence_regra` manda abrir.** Ela diz o órgão e o ciclo. O relatório imprime a
   regra inteira no `--json` justamente para não obrigar ninguém a voltar ao banco.
2. **Se a fonte publicou:** o **historiador** escreve o texto novo — com a fonte, e sob as três
   condições de lugar de fala do CLAUDE.md §2. *Isto não é do dev-dados:* quem move bytes de
   texto histórico não escreve nem corta nenhum.
3. **Se a fonte NÃO publicou:** não há texto novo; o que muda é o prazo. O plantão aplica um
   `vence_em` adiado **com o porquê escrito na `vence_regra`**. Adiar sem escrever por que é como
   apagar.
4. **O plantão aplica no banco, por MCP:** fecha a linha vigente (`vigente_ate = now()`) e insere
   a nova com `rev + 1`, `vence_em` novo e `vence_regra` atualizada. Nenhuma ferramenta de agente
   escreve no banco.
5. **Os dois lados andam juntos ou não andam:** `npm run conteudo:puxar` → ler o `git diff` →
   commitar → `npm run conteudo:conferir` tem de sair **0**. O conferir é o portão que impede a
   dupla verdade: o texto do jogo (`src/jogo.ts`, hoje ainda a fonte) e o do banco são o mesmo
   texto byte a byte, e o CI cobra isso desde 22/08.

### VENCE EM ATÉ 60 DIAS — não é trabalho hoje, é aviso

A janela é de 60 dias, e o número não é arbitrário: a tarefa roda **no dia 1**, então dois meses
garantem que o item apareça em **pelo menos duas execuções** antes de virar vencido. Com 30 dias
seria uma só, e uma execução perdida (máquina desligada) viraria vencido sem aviso nenhum.
Aperte com `--janela 30` quando quiser só o que é iminente.

### DATADO, AINDA LONGE — nada a fazer, e é por isso que aparece

Existe para ninguém reabrir a pergunta. Se você está olhando um verbete e ele está nesta lista,
a resposta de "quando isto vence?" já foi dada.

### SEM DATA, COM REGRA — o gatilho é um evento, não um calendário

São os que vencem quando **alguma coisa acontece** (o censo, uma titulação no DOU, uma decisão).
Não têm data porque a data não existe ainda; têm regra, e a regra é o gatilho. O vigia os agrupa
por família **derivada do texto da regra** (o trecho antes do primeiro travessão, dois-pontos ou
parêntese), e não por uma taxonomia escrita à mão — lista escrita à mão sobre corpus que o
historiador edita fica velha em silêncio, e o item novo cai numa gaveta "outros".

O segundo eixo, **ONDE SE CONFERE**, é declarado (`SINAIS`, em `conteudo-vigia.js`): IBGE, INPE,
MapBiomas, DOU, STF, INCRA, UNESCO. Regra que não bate com nenhum aparece como
`(sem sinal reconhecido)` — visível, e é o convite para acrescentar o sinal ali.

## OS 7 SINAIS — dono e gatilho (fechado em 01/09, item `rotina-7-sinais`)

Achado 1 do vigia (22/08): a tarefa mensal sabia procurar em **três** fontes, escolhidas à mão em
21/08 (INPE/MapBiomas/IBGE), e o acervo declara **sete** sinais — UNESCO, STF e INCRA não tinham
gatilho nenhum. Cada linha abaixo é `quem` + `endereco` + `periodicidade` de `SINAIS`
(`conteudo-vigia.js`), e a periodicidade é a mesma que já está escrita, com fonte, no
`vence_regra` de cada verbete — não é mês chutado à parte, é o mesmo texto do historiador,
consolidado por sinal.

| sinal | onde (endereço) | quando (periodicidade real) | verbete(s) que a citam |
|---|---|---|---|
| **IBGE** | www.ibge.gov.br — Censo Demográfico e publicações temáticas | decenal (o Censo); reconferir a cada nova edição de publicação temática | ETNIA, GUARANI, INDÍGENA, MESTIÇAGEM, PARDO, QUILOMBOLA, TIKUNA, TRONCO LINGUÍSTICO, YANOMAMI, ÍNDIO, COTAS |
| **INPE** | www.gov.br/inpe — PRODES (desmatamento da Amazônia Legal) | ~outubro (estimativa) e ~março (taxa consolidada) | DESMATAMENTO, INPE |
| **MapBiomas** | mapbiomas.org — RAD (Relatório Anual de Desmatamento) | ~maio (RAD do ciclo) | MAPBIOMAS |
| **DOU** | www.in.gov.br — Diário Oficial da União | contínuo — ato por ato (demarcação, titulação, nomeação) | DEMARCAÇÃO, MUNDURUKU, SÔNIA GUAJAJARA, PEDRA DO SAL |
| **STF** | portal.stf.jus.br — andamento processual | a cada 6 meses, enquanto a disputa segue em curso | MARCO TEMPORAL |
| **INCRA** | www.gov.br/incra — regularização quilombola | contínuo — acompanhar publicação de título quilombola | PEDRA DO SAL |
| **UNESCO** | ich.unesco.org — decisões do Comitê Intergovernamental do Patrimônio Cultural Imaterial | anual — sessão de dezembro do Comitê | MARACATU |

`quem` é o mesmo processo nos 7: a **tarefa mensal `alerta-validade-brasil`**, acionada pelo
**plantão**. O vigia não abre a internet — ele só aponta; quem confirma se a fonte publicou é a
tarefa, por WebSearch, no endereço acima.

**O que este endereço É e o que ele NÃO É:** é o domínio institucional canônico onde a
publicação mora — o mesmo nível de fato público que já valia para citar "INPE" ou "STF" num
`vence_regra`. **Não** foi verificado ao vivo nesta entrega (a sessão que escreveu esta tabela
rodou sem rede); se um endereço estiver desatualizado, é achado para quem rodar a tarefa mensal
em seguida, não motivo para bloquear esta entrega — o dado que muda de fato (o número, a data,
o texto do verbete) continua exigindo fonte primária e license do historiador, como sempre.

`node ferramentas/conteudo-vigia.js` (sem `--json`) já imprime esta mesma tabela, sinal por
sinal, na seção **ONDE SE CONFERE** — e `--json` traz o array `sinais` com os mesmos três campos,
para a tarefa mensal ler direto sem reabrir este documento. O código **recusa carregar** se
qualquer um dos 7 sinais ficar sem `quem`/`endereco`/`periodicidade` — a mesma disciplina da data
órfã, aplicada ao dono do sinal em vez de à data.

## A integração com o alerta mensal

O que existe hoje (decidido pelo dono em 21/08, registrado no NOTES.md e no PENDENTES nº 45):

- **`alerta-validade-brasil`** — tarefa agendada, dia 1, 9h13, com agendamento durável (roda ao
  abrir o app se perdeu a hora). Verificava **INPE / MapBiomas / IBGE** por WebSearch e avisa **na
  mesa** se algo venceu; silêncio se nada venceu. **A partir desta entrega, o passo 1 abaixo é o
  que estende a busca aos 7 sinais** — o `SKILL.md` da tarefa em si mora fora deste repositório
  (`C:\Users\User\.claude\scheduled-tasks\alerta-validade-brasil\`, na máquina do dono) e quem
  atualiza o roteiro dela para os 7 é o plantão, na próxima janela em que a tarefa rodar.
- **PENDENTES nº 45** — item recorrente que não fecha nunca, para que alguém olhe nas janelas
  certas mesmo sem o alerta.

**A ordem passa a ser esta, e ela é barata primeiro:**

```bash
# 1. OFFLINE: o que precisa ser conferido este mês, e por quê. Sem rede, sem custo.
node ferramentas/conteudo-vigia.js --json > vigia.json

# 2. Só então a WebSearch, e SÓ no que o passo 1 listou:
#      · tudo de  .vencido            → conferir agora
#      · tudo de  .janela_aviso       → conferir agora (é o aviso de dois meses)
#      · .por_sinal                   → quais órgãos abrir neste mês
#      · .familias[].chaves           → quem é afetado quando aquela fonte publicar
#
# 3. Avisar NA MESA só se houver o que avisar. Silêncio continua sendo a resposta certa
#    quando nada venceu — alerta que toca todo mês vira alerta que ninguém lê.
```

O `--json` traz, no topo: `hoje` · `janela` · `total_com_validade` · `recusas` · `vencido` ·
`janela_aviso` · `futuro` · `sem_data` · `familias` · `por_sinal`. Cada item traz
`tabela · chave · vence_em · vence_regra · familia · sinais · dias` — com a **regra inteira**, sem
reticência, porque é dela que se copia. O `dias` é negativo quando já venceu.

**A divisão do trabalho não muda por causa do alerta:**

| quem | o quê |
|---|---|
| **vigia** (este comando) | diz **o que** vence, **quando** e **onde se confere**. Não abre a internet, não corrige nada. |
| **tarefa mensal** | abre a fonte e responde **se publicou**. Avisa na mesa. |
| **historiador** | escreve o texto novo, com fonte e lugar de fala (§2). |
| **plantão** | aplica a rev+1 no banco por **MCP**, puxa, lê o diff, commita. |
| **dono** | qualquer pergunta de representação. §2 inteiro é dele. |

## O que NÃO fazer

- **Não edite os `.json` desta pasta à mão.** São saída do `conteudo:puxar`; o próximo puxão
  apaga, e até lá o repositório afirma uma coisa e o banco outra.
- **Não apague `vence_em` para calar o alerta.** É o modo de falha que este arquivo inteiro
  existe para impedir.
- **Não conserte o texto histórico você mesmo** para fechar o exit 1. Reprovar divergência é do
  vigia; escrever é do historiador.
- **Não leia a última linha do log.** Leia o exit code.

## Ainda não é portão de CI, e o gatilho é objetivo

O vigia **pode** virar passo do `.github/workflows/teste.yml` — o exit 1 já está desenhado para
isso. Não entrou junto com esta entrega por uma razão que este repositório já pagou uma vez
(o passo do espelho, que nasceu vermelho por motivo conhecido em 22/08): **um portão que
reprova a `main` por conteúdo que envelheceu sozinho, sem ninguém ter empurrado nada, para a
produção num dia em que o INPE publicou e ninguém viu.** Prazo vencido é trabalho a fazer, não
build quebrado.

**Quando promover:** no dia em que a tarefa mensal estiver comprovadamente rodando e avisando na
mesa (isto é, quando o aviso tiver um destinatário que responde), o vigia entra no CI **com
`continue-on-error`** primeiro, para medir quantas vezes ele fica vermelho por mês. Se for zero
ou um, vira portão. Escreva o número no NOTES.md antes de tirar o `continue-on-error` — foi assim
que o espelho virou portão, e é o único jeito de não pregar um vermelho permanente que ensina a
equipe a ignorar vermelho.

## O teste

```bash
node test/conteudo-vigia-teste.js     # 51 asserções, sem rede e sem navegador
```

Ele mede as bordas com fixtures e data de referência fixa (`2026-08-22`), cobra do acervo **real**
só o que é estrutural (nenhuma data órfã; toda `vence_em` é data) — contagem de conteúdo não se
crava em teste, porque o historiador tem licença para mudar o conteúdo — e termina no **controle**
da lição 2.8: três defeitos injetados numa cópia do vigia, um por vez, e a cópia estragada tem de
**deixar passar** o que a boa pega. Portão que nunca foi visto reprovando é decoração.
