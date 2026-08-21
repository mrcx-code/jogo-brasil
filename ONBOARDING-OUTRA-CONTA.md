# OUTRA CONTA DO CLAUDE NESTE ECOSSISTEMA — o guia de embarque

Pedido do dono em 21/08: *"quero poder interagir com esse ecossistema de desenvolvimento a
partir de outra conta do claude tambem"*. A boa notícia é de desenho: **quase tudo que faz este
projeto funcionar mora no REPOSITÓRIO e no BACKEND, não na conta** — CLAUDE.md (as leis),
EQUIPE.md/AGENTES.md (a máquina), `.claude/agents/` (os papéis), `.claude/hooks/guarda.js` (os
portões mecânicos), `ferramentas/integrar.js` (o funil), `ferramentas/backlog.json` (a fila do
dono) e as chaves PUBLICÁVEIS do Supabase/PostHog (no fonte, por construção). Uma sessão de
Claude Code de QUALQUER conta que abra esta pasta herda tudo isso sozinha.

## Mesma máquina (o caso simples)

1. Entre na outra conta no app do Claude Code e **abra esta mesma pasta**
   (`C:\Users\User\Downloads\jogo-brasil`). Pronto: CLAUDE.md carrega, hooks valem,
   `launch.json` dá os três servidores (app 8199 · mesa 8200 · dashboard 8203).
2. Primeira mensagem sugerida para a sessão nova: *"leia CLAUDE.md, EQUIPE.md e o diário do
   NOTES.md; a fila é ferramentas/backlog.json (a ordem é do dono); entregas em worktree,
   integração por ferramentas/integrar.js"*.

## Outra máquina

1. `git clone` do `mrcx-code/jogo-brasil` (acesso pelo SEU GitHub — a conta do Claude não
   importa para o git) · `npm install` · `npx playwright install chromium`.
2. `npm test` primeiro — se os portões não passam aí, nada mais vale.
3. O resto é igual ao caso acima. Atenção ao `TERRITORIO.md` se for a máquina onde VOCÊ edita
   a tela ONDE FOI.

## O que é POR CONTA (e as três regras que evitam colisão)

- **Tarefas agendadas (plantão/despachante/alerta) são da conta onde foram criadas.**
  **REGRA 1 — UM DESPACHANTE SÓ:** o plantão `plantao-mesa-brasil` roda NESTA conta. A conta
  nova NÃO cria um segundo (dois consumidores da mesma fila = acionamento em dobro). Se um dia
  o despachante mudar de casa, ele MUDA — nunca duplica.
- **MCP do Supabase** (escrita administrativa: UPDATE/DELETE nas tabelas mesa_*) é conexão por
  conta. Na conta nova: ou o dono conecta o MCP do Supabase dela também (mesmo projeto
  `patinhas`), ou a sessão trabalha só com REST (leitura + INSERT) e deixa o administrativo
  para o plantão daqui. **REGRA 2:** a `service_role` continua NUNCA existindo em cliente
  nenhum, em conta nenhuma.
- **Memória de sessão** é por conta — e é por isso que a memória DE VERDADE são os arquivos:
  NOTES.md (diário), EQUIPE.md (lições + placar), PENDENTES.md. **REGRA 3:** sessão de
  qualquer conta que decida algo ESCREVE no diário no mesmo commit — senão a outra conta
  redescobre o buraco.

## O que a conta nova PODE fazer no primeiro dia, sem pedir nada a ninguém

Trabalhar a fila como qualquer sessão daqui: pegar o item `livre` mais alto do backlog cujo
território esteja desocupado, entregar commitado em worktree, integrar pelo funil com os
portões verdes por exit code, e pregar o placar. As mesmas leis: §2 é do dono, TERRITORIO.md
intocável, crase em commit nunca, exit REAL (não o do pipe), sign-off do dono para qualquer
publicação externa.
