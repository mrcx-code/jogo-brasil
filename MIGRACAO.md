# MIGRAÇÃO PARA O PROJETO `brasil` NO SUPABASE — plano executável (escrito 25/08)

Escrito para a sessão NOVA executar barato depois de um `/clear` — o dono criou o projeto próprio
e pediu a migração, e esta sessão ficou longa demais para fazê-la sem desperdício. Tudo o que a
derivação cara já produziu (schema, RLS exato, chaves) está aqui embutido: **não re-derive.**

## O PORQUÊ
As 7 tabelas do BRASIL moravam no projeto `patinhas` (de outro produto). O dono criou o projeto
`brasil` e conectou GitHub + Vercel. Falta migrar schema + dados, repontar o repositório, e a
config de auth (parte dele). Regra que não muda: **service_role NUNCA no cliente; só a anon
publicável.**

## OS DOIS PROJETOS
- **DESTINO `brasil`**: id `frrmiompmxjbpoxegyeb` · url `https://frrmiompmxjbpoxegyeb.supabase.co`
  · região us-west-2 · **VAZIO (0 tabelas)** em 25/08.
  - anon publicável: `sb_publishable_DlhSYVgwH8UmYF86JzM0Sw_iKVMLynK`
  - anon legada (JWT): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZycm1pb21wbXhqYnBveGVneWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NTk4NDcsImV4cCI6MjEwMzIzNTg0N30.El7R-r2i5cPWY5jvkF-kIAP4r4qUg_6r--SotedwZ6o`
- **ORIGEM `patinhas`**: id `hdhqziqvrthxtgyraemk` (NÃO desligar até o brasil estar verificado no ar).

## AS 7 TABELAS
`mesa_agente` · `mesa_item` · `mesa_pedido` · `mesa_resposta` · `conteudo_glossario` ·
`conteudo_glossario_grupo` · `conteudo_glossario_rel`.

## ORDEM SEGURA (não repontar produção antes de o brasil estar íntegro)

### FASE 1 — schema no brasil (reversível; brasil está vazio, não é produção)
1. **conteudo_\***: aplique `ferramentas/conteudo-esquema.sql` no brasil (via MCP `apply_migration`).
   Ele já traz CREATE TABLE + RLS + policies dos três `conteudo_*`.
2. **mesa_\***: o CREATE TABLE das `mesa_*` **NUNCA foi versionado** (o dono as criou no painel; o
   `fila-auth.sql` só cuida do RLS de `mesa_resposta`). Reconstrua o DDL a partir do schema vivo:
   `list_tables({project_id:'hdhqziqvrthxtgyraemk', schemas:['public'], verbose:true})` — UMA
   chamada, exata — e gere os CREATE TABLE de mesa_agente/item/pedido/resposta (colunas, defaults,
   PKs, checks). PKs conhecidas: `mesa_agente.nome`; os outros têm `id bigint identity`.
3. **COLUNAS NOVAS na `mesa_agente`** (pedido do dono, 25/08 — visão de custo por agente):
   `modelo text` · `esforco text` · `tokens_rodada int default 0` · `tokens_acum int default 0` ·
   `custo_rodada_usd numeric default 0` · `custo_acum_usd numeric default 0` · `rodadas int default 0`
   · `ultima_duracao_ms int`. (Custo em US$ exige uma tabela de preço por tier COM FONTE E DATA —
   preço não se inventa; se não houver fonte na hora, deixe só os tokens e marque o custo como TODO.)
4. **RLS — replicar EXATO do patinhas** (já derivado, não re-consultar). `enable row level security`
   em todas, e:
   - `conteudo_glossario`, `_grupo`, `_rel`: policy anon SELECT `using ((estado='publicado') and
     (vigente_ate is null))`; policy authenticated SELECT `using (true)`.
   - `mesa_agente`: anon SELECT `using (true)`.
   - `mesa_item`: anon SELECT `using (true)`.
   - `mesa_pedido`: SELECT anon+authenticated `using (true)`; INSERT authenticated
     `with check (auth.uid() = '<UUID_DONO_NOVO>')`; UPDATE authenticated
     `using/with check (auth.uid() = '<UUID_DONO_NOVO>')`.
   - `mesa_resposta`: SELECT anon+authenticated `using (true)`; INSERT authenticated
     `with check (auth.uid() = '<UUID_DONO_NOVO>')`.
   - **⚠ o UUID do dono no patinhas é `01b909f5-f449-42fa-b823-71f76fa9a3e2`. No brasil o usuário
     "dono" é OUTRO** (auth novo) — use o uuid do dono do PROJETO NOVO (ver Fase 4/passo do dono),
     nunca o antigo chumbado.

### FASE 2 — dados no brasil
1. **conteudo_\***: `node ferramentas/conteudo-carga.js` apontado para o brasil (carrega dos JSON
   commitados em `ferramentas/conteudo/*.json` — 181 verbetes, 17 grupos, 644 pares). NÃO mover
   dado pelo contexto do agente. Verifique `conteudo-carga.js` para saber como ele recebe URL/chave
   (constante ou env) e aponte para o brasil.
2. **mesa_\***: dados pequenos. `mesa_agente` (13 linhas — recriar do zero com as colunas novas; os
   13 nomes: Claude, pm, arte, dev-jogo, dev-plataforma, dev-dados, historiador, pesquisadora-fontes,
   qa, seguranca, juridico, growth, pre-integrador — confira contra `.claude/agents/` +
   `conferir-agentes.js`). `mesa_item`, `mesa_pedido`, `mesa_resposta`: copie do patinhas
   (SELECT via MCP → INSERT no brasil; são ~51/~11/~1 linhas, cabe).

### FASE 3 — verificar o brasil ANTES de repontar
- `list_tables` no brasil: as 7 presentes, RLS on.
- Rode `conteudo:conferir` apontado ao brasil → ESPELHO ÍNTEGRO.
- Confirme que o anon SÓ lê publicado+vigente (teste um SELECT anon).

### FASE 4 — repontar o repositório (só depois da Fase 3 verde)
Trocar `hdhqziqvrthxtgyraemk` → `frrmiompmxjbpoxegyeb` e a chave anon nos **6 arquivos** (medido
por `git grep -l hdhqziqvrthxtgyraemk` excluindo pack/index/dist):
`dashboard/index.html` · `ferramentas/conteudo-puxar.js` (linhas SB_URL/SB_KEY ~52) ·
`ferramentas/fila-auth.sql` · `ferramentas/receber.html` · `test/fila-auth.js` ·
`test/rodape-verdadeiro.js`. **Confira também `ferramentas/conteudo-carga.js`** (pode ter a URL).
Depois: `npm test`, `conteudo:conferir`, `conferir-agentes` (que lê a chave do dashboard) — todos
verdes. `git grep hdhqziqvrthxtgyraemk` deve voltar VAZIO (fora de pack/index/dist).

### O QUE É DO DONO (auth — ele faz no painel do brasil, como fez no patinhas)
- Authentication > Providers > **Email: LIGADO** (atende o grant_type=password do auto-login).
- Os **4 cliques**: cadastro OFF · Secure password change ON · leaked passwords ON · mínimo 8.
- Criar o **usuário "dono"** (o e-mail dele) e pegar o **UUID** desse usuário → é ele que entra nas
  policies `escreve/atualiza so o dono` da Fase 1/passo 4 (NÃO o uuid antigo).
- O PIN local: `~/.mesa-brasil-pin` já existe nesta máquina; confirmar que serve ao brasil.

### VERCEL
O jogo é arquivo único auto-contido (não usa Supabase em runtime). Dashboard/mesa usam a chave
CHUMBADA no fonte (não env). Então provavelmente **nada de env var na Vercel** — mas confirme se o
deploy do brasil tem alguma env de Supabase e, se tiver, aponte para o projeto novo.

### DEPOIS (não antes de tudo verde por dias)
Decommissionar as 7 tabelas do BRASIL no `patinhas` (o raio de dano compartilhado era o motivo da
migração). Só quando o brasil estiver provado no ar.

## PENDÊNCIAS ABERTAS QUE ESTA MIGRAÇÃO TOCA
- **Dashboard mostra agente "ativo" que não está** (status grudado sem reset). Corrigido o DADO em
  25/08 (todos → espera), mas a RAIZ é de lógica: o painel deve computar "ativo" por FRESCOR de
  `ativo_em` (heartbeat), não por status fixo — OU o plantão sempre reseta no pouso. Fazer junto
  com as colunas novas (é a mesma tela). Vira item.
- **Métricas no dashboard** (pedido do dono): mostrar modelo/esforço/tokens/custo por agente E uma
  visão geral (total gasto). As colunas da Fase 1/3 alimentam isso; o gerador do dashboard mostra.


## AUTONOMIA 24/7 — a pergunta do dono ("como garantir que o app não feche de madrugada?")
O plantão é uma **tarefa agendada local**: só dispara com o app do Claude Code ABERTO. De
madrugada, fechado, não roda (foi o que aconteceu: última rodada 24/08 22:08). Duas saídas, e a
segunda é a de verdade:
1. **Manter a máquina acordada e o app aberto** — `caffeinate -disu` segura o sono do Mac, mas se
   o app fechar ou a máquina reiniciar, para. Meia-solução.
2. **Rotina na NUVEM** (o certo para autônomo real): uma routine/cron que roda no servidor, não na
   máquina do dono — independe do app estar aberto. É uma decisão de configuração (RemoteTrigger /
   rotina agendada na nuvem) que vale levantar na sessão nova. É o único jeito de "roda de
   madrugada sozinho" ser verdade.

## DECISÕES DO DONO — 25/08 (registradas antes de possível /clear)

1. **AUTONOMIA: nuvem (opção 2) + as três travas.** O worker autônomo passa a ser uma **rotina
   na NUVEM** (roda sem o app do dono aberto). A opção 1 (`caffeinate` + app aberto) fica como
   modo interativo/diurno, não como autonomia. As TRÊS TRAVAS são obrigatórias e não-negociáveis:
   (a) **teto de tokens por noite** — bate no teto, para; (b) **idle-bail** — noite sem trabalho
   que valha custa ~zero; (c) **modelo por peso** — opus só onde raciocínio paga; sonnet/haiku no
   resto. **REGRA DE COORDENAÇÃO (nuvem × mac × windows):** o worker da nuvem só puxa trabalho
   **DA FILA** (backlog, já etiquetado por território) e respeita o mesmo lock (`.claude/maquina`
   + ramos `voo/<id>`). Assim nunca briga com uma sessão interativa: worktree isola a escrita, o
   git recusa push conflitante, o funil desfaz no vermelho. A configuração da rotina na nuvem é
   tarefa da sessão nova (RemoteTrigger / rotina agendada).

2. **DEVS: mantém 3 agora; escala para 4-5 DEPOIS da migração.** O gargalo não é o número de devs,
   é o território — o `src/jogo.ts` é monólito de um escritor por vez. Os 3 devs atuais (jogo/
   plataforma/dados) já são disjuntos. O 4º/5º só entram quando a migração quebrar o `jogo.ts` em
   módulos TS e criar território próprio pra eles. Adicionar antes = agente ocioso ou colisão.

3. **AUDITORES: fundir `growth` + `seguranca` num único "porteiro"** (juridico fica SEPARADO, é
   disciplina distinta). Motivo: cada integração de página pública sobe hoje 2 agentes; com o
   porteiro sobe 1 → metade do token no caminho quente. IMPLICA mudar: `.claude/agents/` (criar
   `porteiro.md`, remover `growth.md`+`seguranca.md`), o mapeamento de território no
   `ferramentas/integrar.js` (PUB e REDE passam a exigir `porteiro`), o elenco em
   `conferir-agentes.js`, e a `mesa_agente` (a migração recria o elenco — nasce já com `porteiro`,
   sem growth/seguranca; roster passa de 13 para 12 nomes). É mudança de portão → passa pelo funil.

4. **CONTEÚDO: mantém `pesquisadora-fontes` + `historiador` SEPARADOS.** A separação "quem lê e
   tabela" × "quem julga e corta" acabou de provar valor (a pesquisadora recusou tarefa fora de
   escopo em 25/08). Custa 2 spawns por entrega de conteúdo, e vale a pena.

5. **HOUSE KEEPING DA MESA — junto desta migração.** Hoje pendências/decisões/pedidos vivem
   espalhados (dashboard, `PENDENTES.md`, check). O dono decidiu (25/08) que **a mesa vira a fonte
   única**: pendências/decisões/pedidos moram nas tabelas `mesa_*` e o dashboard só LÊ. Fazer no
   `brasil` (que já recria as tabelas do zero) move o dado uma vez só, em vez de mexer no patinhas
   agora e refazer. Passo a acrescentar na Fase 2: além do conteúdo e do elenco de agentes, semear
   os itens de pendência/decisão/pedido na mesa e apontar o dashboard para lê-los.

6. **PORTEIRO (decisão 3 acima) tem forma de entrega:** é mudança de portão → vai pelo funil, num
   worktree, com auditoria. A `mesa_agente` já nasce nesta migração SEM `growth`/`seguranca` e COM
   `porteiro` (roster 12, não 13). O código (`.claude/agents/`, `integrar.js`, `conferir-agentes.js`)
   é independente do banco e pode ir antes ou depois do repontamento — mas o roster do banco tem de
   bater com a pasta (o `conferir-agentes.js` reprova se não bater).
