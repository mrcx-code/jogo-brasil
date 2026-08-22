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

## O LOCK ENTRE MÁQUINAS — o `em-curso` deixou de ser honra (23/08)

Nasceu do **PR #4**, escrito pela sessão do Mac na primeira vez que duas máquinas trabalharam
neste repositório ao mesmo tempo. O diagnóstico dela, medido e não suposto: **`em-curso` só
existia dentro do `backlog.json`** — nenhuma ferramenta lia, validava ou impunha. O combinado
era honra, e ninguém tinha escrito isso, que é a pior forma de uma regra existir.

Três peças, e as três já estão de pé:

### 1. Quem sou eu — `.claude/maquina`

Uma linha, um nome, **fora do git** (está no `.gitignore`). `windows-plantao` na máquina do
plantão; a outra escolhe o próprio. **Sem esse arquivo, nada trava** — degradar para o
comportamento de sempre é melhor que travar a máquina errada.

### 2. Pegar um item é escrever isso, e empurrar

Ao pegar, o item ganha três campos e o commit vai **na hora**, não no fim:

```jsonc
{ "estado": "em-curso", "maquina": "windows-plantao", "desde": "2026-08-23T14:02:00Z" }
```

E o ramo marcador vai junto: `git push origin HEAD:refs/heads/voo/<id-do-item>`. Isso dá o que
o JSON sozinho não dá: **o git recusa dois pushes criando a mesma ref**, então quem chegar
depois descobre na hora, sem conflito de merge. `git ls-remote --heads origin 'voo/*'` é a
lista do que está em voo, legível das duas máquinas. Ao terminar, o ramo marcador é apagado.

### 3. O guarda recusa território de outra máquina

`.claude/hooks/lock-maquina.js` (a lógica) + o bloco 2 do `guarda.js` (a recusa). Ele nega a
escrita — exit 2, como as outras travas — quando **as três** são verdade: o arquivo cai no
`territorio` de um item · o item está `em-curso` · a `maquina` do item não é a minha.

**Não trava**, de propósito: arquivo que ainda não existe (o git funde sozinho), os diários
(`NOTES`, `PENDENTES`, `EQUIPE`, `AGENTES`, `DIRECAO`, `TERRITORIO` — entram por `merge=union`),
item `do-dono`, e **nada** quando o dado está ruim (sem `.claude/maquina`, JSON quebrado,
carimbo ilegível).

**A validade é 2 horas**, e o número é medido: as rodadas de agente de 21–22/08 duraram de 2 a
67 minutos, e a mais longa (o passe de pixel) levou ~4.000 s. Duas horas cobrem a maior com 45
minutos de folga. A proposta chutava 12 h; lock esquecido de 12 h tira meio dia da outra
máquina, e "máquina travada por engano é pior que colisão" é a frase dela mesma.

**O que o lock NÃO cobre, e precisa estar escrito:** agentes da MESMA máquina não se separam
entre si (o `maquina` é igual). A coordenação intra-máquina continua sendo do despachante, por
território disjunto no despacho — o guarda não substitui isso.

O portão dele é `test/guarda-lock.js`: 7 cenas, e um controle que apaga um conserto por vez e
exige que o teste morda. Na primeira versão **duas cenas eram decoração** (o item de teste nem
tinha o território do alvo, então a exceção passava por acaso) — o controle pegou, e as cenas
foram refeitas. É a lição 2.8 do `EQUIPE.md` acontecendo dentro do próprio instrumento.

### O que continua sendo de uma máquina só

**O despachante** (a fila do dashboard tem um consumidor) e **o funil**: um `integrar.js` por
vez. A outra máquina entrega commitada no ramo e avisa; quem integra é quem está com o funil.
