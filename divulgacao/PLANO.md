# PLANO.md — Divulgação 2026 (rascunho para sign-off)

> Escrito pelo growth em 21/08, backlog `divulgacao-2026`. Nada aqui é publicado — é material
> para o dono decidir. Ver `EQUIPE.md` e `.claude/agents/growth.md` §"A LEI DO SIGN-OFF".

## 0. O que já é verdade hoje (medido, não suposto)

Conferido por `curl` direto em `matheusferreira.cc` em 21/08 (o mesmo método da rodada de
growth anterior — nunca supor):

| seção | endereço | title | og:image | canonical |
|---|---|---|---|---|
| porta | `/` | "BRASIL — uma plataforma de conhecimento" | sim (`/compartilhar.jpg`) | sim |
| jogo | `/jogo/` | "BRASIL — um jogo sobre a história do Brasil" | sim (`/jogo/compartilhar.jpg`) | — (ver nota) |
| território | `/territorio/` | "O Território — os lugares da história do Brasil" | sim | sim |
| A História | `/historia/` | "A História do Brasil — uma linha do tempo" | **não tem** | sim |
| Glossário | `/glossario/` | "O Glossário do Brasil — as palavras da nossa história" | **não tem** | sim |
| De Onde Vem | `/de-onde-vem/` | "De Onde Vem — as fontes da história do Brasil" | **não tem** | sim |

Números de conteúdo (conferidos na própria página, não redigitados): **181 verbetes** no
Glossário (subiu de 167 com a migração Avenida A de 21/08 — se citar em texto público, usar
181, que é o número no ar agora, e reconferir antes de publicar porque o banco pode mudar de
novo), **60 fontes** em De Onde Vem, **47 momentos com fonte** em A História, **13 capítulos**
no jogo.

O domínio próprio (`matheusferreira.cc`) está **no ar desde 10/08** — a plataforma já é
alcançável e indexável. O que falta não é infraestrutura: é a decisão de **anunciar**. É essa
distinção que este plano trata como "lançamento de verdade": não é o domínio subir, é o
primeiro post/e-mail/matéria saírem.

**Faltando antes de qualquer peça que aponte para A História, Glossário ou De Onde Vem:**
cartão de imagem (og:image) dessas três — já é o item `og-image-secoes` do backlog, livre,
com o gerador (`gerar-cartoes.js`) pronto do lado do dev-plataforma. Sem isso, um link dessas
três seções abre feio no WhatsApp — a primeira coisa que qualquer professor ou jornalista vai
fazer é colar o link numa conversa.

---

## 1. Públicos

Três, em ordem de facilidade de alcançar (não de importância):

**(A) Quem já compartilha cultura e história do Brasil.** Perfis e páginas de divulgação
histórica, contas de professores de história em redes, coletivos de cultura popular e memória
negra/indígena. Público que já filtra por qualidade e cita fonte — o mais alinhado com o §2 do
`CLAUDE.md` e o que menos precisa de "venda", só precisa ver o produto.

**(B) Professores e educadores** (ensino fundamental II, médio, e quem dá aula de história/
geografia/cultura brasileira fora da escola formal — museus, ONGs, projetos sociais).
Precisam de um motivo prático: "dá pra usar em sala" ou "manda pro aluno assistir/ler em casa".
É o único público para quem vale a pena um texto dedicado (rascunho 02, abaixo).

**(C) Imprensa de educação e cultura.** Veículos e colunistas que cobrem tecnologia educacional,
jogos com propósito, ou cultura/memória afro-brasileira e indígena — não imprensa geral, porque
o produto ainda não tem tração para justificar isso, e "plataforma nova sem números" é pauta
fraca fora de nicho.

**Fora de escopo por ora:** qualquer campanha paga, qualquer influenciador fora do nicho de
história/educação, qualquer imprensa generalista. Nenhum destes está no plano — se o dono
quiser abrir, é decisão dele, não default do growth.

---

## 2. Canais possíveis, por público

| público | canal | formato |
|---|---|---|
| (A) divulgadores de cultura | Instagram, um DM/e-mail direto com o link + o parágrafo de apresentação | pessoal, não em massa |
| (A) divulgadores de cultura | Twitter/X, se o dono tiver conta ou quiser abrir uma | thread curta, print da seção |
| (B) professores | grupos de professores de história (Facebook/WhatsApp/Telegram — existem vários grandes e públicos) | o texto-professor (rascunho 02) + link |
| (B) professores | plataformas de recursos didáticos (se existirem contatos) | o mesmo texto, adaptado |
| (C) imprensa | e-mail direto a colunista/repórter de educação ou cultura, com o press-kit anexo | o press-kit (rascunho 03) |

Nenhum canal aqui tem conta/lista pronta hoje — abrir perfil novo ou lista de contatos é
trabalho de outra rodada e passa pelo sign-off antes de qualquer post, não só antes do link
final.

---

## 3. Sequência — o que sai primeiro e por quê

1. **[interno]** Fechar os cartões og: das 3 seções que faltam (A História, Glossário, De Onde
   Vem) — sem isso, qualquer link dessas seções compartilhado abre sem imagem.
2. **[interno]** Fechar o link jogo → plataforma (item `link-jogo-plataforma` do backlog) — hoje
   quem termina o jogo não tem para onde ir; um professor que jogar primeiro esbarra no mesmo
   buraco.
3. **[PRECISA SIGN-OFF]** Aprovar os 3 tamanhos de apresentação (rascunho 01) — é o texto-base que
   todo o resto reusa; sem ele aprovado, cada peça nova reabre a mesma discussão de tom.
4. **[PRECISA SIGN-OFF]** Primeira rodada com público (A) — divulgadores de cultura — porque é
   o público que menos precisa de "venda" e serve de prova social antes de ir a professores e
   imprensa. Enviar o link + o parágrafo, um de cada vez, não disparo em massa.
5. **[PRECISA SIGN-OFF]** Rodada com público (B) — professores — usando o texto-professor
   (rascunho 02), depois que (A) já deu algum retorno (mesmo que anedótico).
6. **[PRECISA SIGN-OFF]** Rodada com público (C) — imprensa de nicho — com o press-kit
   (rascunho 03), a última porque é a que menos tolera repetir contato ("já mandei, deixa
   descansar") e a que mais se beneficia de já ter alguma repercussão prévia para citar.
7. **[PRECISA SIGN-OFF]** O lançamento de verdade — o anúncio amplo, com data. O dono já decidiu
   a âncora **interna** de 20/nov (Dia da Consciência Negra), registrada em `NOTES.md` 21/08
   como "âncora interna do lançamento... com a camada crítica do movimento, nunca efeméride" —
   ou seja: se usar essa data, o texto trata o dia pelo que ele é (luta, não celebração de
   vitrine), nunca como gancho de marketing disfarçado. Este item existe aqui como lembrete de
   prazo, não como decisão nova — a data já foi dada.

Este plano não presume ordem dentro de cada rodada (quem exatamente em (A), (B) ou (C)) —
isso é lista de contatos, trabalho de outra sessão, e cada envio individual continua
precisando do texto já aprovado, não de aprovação unitária.

---

## 4. O que cada peça de rascunho precisa que já exista

- **Apresentação em 3 tamanhos** (rascunho 01): não depende de nada técnico — é texto puro.
- **Texto para professores** (rascunho 02): não depende de nada técnico.
- **Press-kit** (rascunho 03): fica mais forte com os 3 cartões og: prontos (para anexar prints)
  e com pelo menos uma âncora de conteúdo (o quê o professor pode conferir na hora — Glossário
  ou A História).
- **Qualquer peça que mencione número de verbetes/fontes/momentos**: reconferir no repo antes
  de sair, porque a Avenida A (migração para banco) está em curso e os números mudam por commit
  — 181 verbetes é o número de HOJE, não uma constante.

---

## 5. Métricas de leitura — como saber se funcionou (sem pedir dado novo)

Os eventos já existentes no PostHog respondem parte disto **sem precisar de nada além do que
já existe** (`CLAUDE.md` §3): `abriu A HISTÓRIA`, `abriu DE ONDE VEM`, `chegou no capítulo X`,
`voltou`. Se uma rodada de divulgação sair, a leitura é: pico de aberturas dessas seções no dia
do envio, e se há retorno (`voltou`) nos dias seguintes — sem saber QUEM veio, só QUANTO.
As páginas fora do jogo (porta, seções) ainda não emitem evento nenhum (achado do growth em
21/08, item `posthog-paginas` do backlog, interruptor de privacidade decidido para o rodapé) —
sem isso, tráfego direto de divulgação é invisível. **Recomendo fechar esse item antes da
primeira rodada com público (B) ou (C)**, porque são as duas com mais chance de gerar tráfego
que vale medir.

---

## 6. Linhas que não se cruzam (§2 e afins, redito para quem só ler este arquivo)

- Nenhum superlativo vazio ("o maior", "revolucionário", "nunca visto") — se não tem fonte pro
  tamanho, não afirma o tamanho.
- Nenhum número sem fonte, e todo número de conteúdo (verbetes/fontes/momentos) é conferido no
  repo na data do envio, não copiado deste documento sem checar de novo.
- "Invasão" ou "chegada", nunca "descobrimento" — em qualquer peça, mesmo as curtas.
- Nenhuma pessoa viva nomeada que não já esteja no jogo — inclusive o próprio dono: o nome dele
  no press-kit é uma decisão de representação e fica marcada [PRECISA SIGN-OFF] no rascunho.
- Nenhuma peça vende o sofrimento histórico como atração ("puxa pelo choque") — a régua é a
  mesma do §2: mostrar para que se saiba, nunca para chocar por chocar.

---

## 7. O que este plano NÃO decide (fica para a seção final do relatório)

Quem manda a primeira mensagem, para quem exatamente, com qual conta — e se abre alguma rede
nova. Isso é tática de execução, não plano; cabe na hora, com o texto já aprovado na mão.

---

## 8. Os rascunhos (divulgacao/rascunhos/)

| arquivo | peca | usa em |
|---|---|---|
| 01-apresentacao-3-tamanhos.md | apresentacao em 1 frase / 1 paragrafo / 1 pagina | texto-base para tudo o mais |
| 02-texto-professores.md | mensagem para grupo/e-mail de professores | publico (B) |
| 03-press-kit-minimo.md | o que e / por que existe / quem fez / o que nao e | publico (C), anexo de e-mail |
| 04-mensagem-divulgadores-cultura.md | template de DM/e-mail pessoal, um contato por vez | publico (A) |
| 05-legenda-post-social.md | legenda curta para post de lancamento, 2 tamanhos | quando houver rede aprovada |

Todos marcados [PRECISA SIGN-OFF] onde ha texto a publicar; nenhum sai sem aprovacao por
mensagem do dono, peca por peca -- aprovar o rascunho 01 nao aprova os demais.
