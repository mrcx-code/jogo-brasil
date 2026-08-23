# PLANO.md — Divulgação 2026 (rascunho para sign-off)

> Escrito pelo growth em 21/08, backlog `divulgacao-2026`. Ver `EQUIPE.md` e
> `.claude/agents/growth.md` §"A LEI DO SIGN-OFF".
>
> **ATUALIZADO 23/08 — O TEXTO DAS 5 PEÇAS FOI APROVADO.** Em mesa de decisão, perguntado se
> liberava as 5 ou só a de professores, o dono escolheu **liberar as 5**. Isso aprova o TEXTO de
> `01` a `05` (ver §8). **Isso não aprova canal, data de publicação nem quem posta** — cada
> rodada de ENVIO no §3 (itens 4 a 7) continua precisando do próprio sign-off antes de sair. A
> LEI DO SIGN-OFF continua de pé: nada vai ao ar sem esse segundo sign-off, explícito, por
> mensagem do dono.

## 0. O que já é verdade hoje (medido, não suposto)

Conferido por `curl` direto em `matheusferreira.cc` em 21/08 (o mesmo método da rodada de
growth anterior — nunca supor):

**Reconferido por `curl` em 23/08** (mesmo método):

| seção | endereço | title | og:image | canonical |
|---|---|---|---|---|
| porta | `/` | "BRASIL — uma plataforma de conhecimento" | sim (`/compartilhar.jpg`) | sim |
| jogo | `/jogo/` | "BRASIL — um jogo sobre a história do Brasil" | sim (`/jogo/compartilhar.jpg`) | — (ver nota) |
| território | `/territorio/` | "O Território — os lugares da história do Brasil" | sim | sim |
| A História | `/historia/` | "A História do Brasil — uma linha do tempo" | **sim, desde 23/08** (`/historia/compartilhar.jpg`, 200, 83.486 bytes) | sim |
| Glossário | `/glossario/` | "O Glossário do Brasil — as palavras da nossa história" | **sim, desde 23/08** (`/glossario/compartilhar.jpg`, 200, 83.702 bytes) | sim |
| De Onde Vem | `/de-onde-vem/` | "De Onde Vem — as fontes da história do Brasil" | **sim, desde 23/08** (`/de-onde-vem/compartilhar.jpg`, 200, 87.538 bytes) | sim |

O que faltava em 21/08 (item `og-image-secoes` do backlog) foi fechado pelo dev-plataforma —
`ferramentas/backlog.json` registra "INTEGRADO 565a586 e PROVADO por curl: os 3 compartilhar.jpg
no ar com os bytes do build". Confirmado de novo agora, independente: os três respondem 200.

Números de conteúdo (conferidos na própria página, não redigitados, reconferidos de novo em
23/08 antes deste sign-off): **181 verbetes** no Glossário (mesmo número de 21/08 — a migração
Avenida A não mudou o total nesse meio-tempo, mas o número segue variável por commit e pede
reconferência a cada envio), **61 fontes** em De Onde Vem, **47 momentos, todos os 47 com
fonte** em A História (a página hoje mostra "47 momentos · 47 com fonte" — o número de momentos
totais também baixou de 53 para 47 desde a medição de 19/08 no `CLAUDE.md`; os 5 que saíram
não tinham fonte lida), **13 capítulos** no jogo. Os cinco números que aparecem nas peças 01–05
batem com o que está no ar hoje.

O domínio próprio (`matheusferreira.cc`) está **no ar desde 10/08** — a plataforma já é
alcançável e indexável. O que falta não é infraestrutura: é a decisão de **anunciar**. É essa
distinção que este plano trata como "lançamento de verdade": não é o domínio subir, é o
primeiro post/e-mail/matéria saírem.

**Fechado em 23/08:** o que faltava antes de qualquer peça apontar para A História, Glossário
ou De Onde Vem — o cartão de imagem (og:image) dessas três — está no ar (ver tabela acima). Um
link dessas três seções agora abre com imagem no WhatsApp, que era o risco que este item
apontava.

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

**DECIDIDO PELO DONO em 22/08 — a ordem dos públicos é A → B → C, confirmada como estava
proposta neste plano:** divulgadores de cultura primeiro, professores depois, imprensa por
último. O que muda com a decisão é que a ordem deixa de ser proposta do growth e passa a ser
sequência aprovada; cada rodada continua precisando do próprio sign-off de ENVIO antes de sair
(aprovar a ordem não aprova o disparo de nenhuma delas). **Atualização 23/08:** o TEXTO das
peças usadas nos itens 4 a 7 (rascunhos 01–05) está aprovado (ver cabeçalho deste arquivo e
§8) — o que falta em cada item abaixo não é mais texto, é canal, data e quem envia.

1. **[FEITO — `og-image-secoes` concluído]** Fechar os cartões og: das 3 seções que faltavam (A
   História, Glossário, De Onde Vem) — confirmado por `curl` em 23/08, ver §0.
2. **[FEITO — `link-jogo-plataforma` concluído]** Fechar o link jogo → plataforma — integrado
   (commit `d8efd47`, nota de margem na CHEGADA); quem termina o jogo agora tem para onde ir.
3. **[FEITO em 22/08]** Aprovar os 3 tamanhos de apresentação (rascunho 01) — é o texto-base que
   todo o resto reusa. O dono aprovou com um ajuste (a 1ª frase troca "da chegada dos povos
   originários até hoje" por "dos povos que já estavam aqui até hoje" — povos originários não
   chegaram, estavam). Ajuste aplicado no rascunho 01 e replicado nas peças 02, 03, 04 e 05, que
   reusavam a mesma frase. Aprovar o texto-base não aprova nenhum envio.
4. **[PRECISA SIGN-OFF]** Primeira rodada com público (A) — divulgadores de cultura. **O que essa
   rodada espera da anterior:** nada além do texto-base aprovado (item 3, feito) — é a primeira
   rodada, não depende de retorno de ninguém. Critério de escolha do público: é quem menos
   precisa de "venda" e serve de prova social antes de ir a professores e imprensa. Enviar o
   link + o parágrafo, um de cada vez, não disparo em massa.
5. **[PRECISA SIGN-OFF]** Rodada com público (B) — professores — usando o texto-professor
   (rascunho 02). **O que essa rodada espera da anterior:** que a rodada (A) já tenha saído e
   dado algum retorno, mesmo que anedótico (uma resposta, um repost, um "usei e gostei") — não
   precisa de número, só de sinal de que a peça não caiu no vazio antes de ir a um público que
   pede mais confiança institucional.
6. **[PRECISA SIGN-OFF]** Rodada com público (C) — imprensa de nicho — com o press-kit
   (rascunho 03). **O que essa rodada espera da anterior:** que (A) e (B) já tenham alguma
   repercussão para citar no press-kit ("já em uso por X" ou equivalente) — é a rodada que
   menos tolera repetir contato ("já mandei, deixa descansar"), então sai por último e só com
   algo para mostrar.
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
  — 181 verbetes, 61 fontes e 47 momentos são os números de HOJE (reconferidos por `curl` em
  23/08, ver §0), não uma constante. Reconferir de novo no dia de cada envio.

---

## 5. Métricas de leitura — como saber se funcionou (sem pedir dado novo)

Os eventos já existentes no PostHog respondem parte disto **sem precisar de nada além do que
já existe** (`CLAUDE.md` §3): `abriu A HISTÓRIA`, `abriu DE ONDE VEM`, `chegou no capítulo X`,
`voltou`. Se uma rodada de divulgação sair, a leitura é: pico de aberturas dessas seções no dia
do envio, e se há retorno (`voltou`) nos dias seguintes — sem saber QUEM veio, só QUANTO.
**Fechado em 22/08** (item `posthog-paginas` do backlog): as 5 páginas fora do jogo agora
emitem `secao-aberta`, com interruptor único de privacidade no rodapé — "FECHADO 22/08: 187
verificações, 3 controles mordendo; adblock/503/mudo = 0 erro; desligado = 0 pedido"
(`ferramentas/backlog.json`). Tráfego direto de divulgação deixou de ser invisível antes mesmo
da primeira rodada com público — o que este item recomendava já está pronto.

---

## 6. Linhas que não se cruzam (§2 e afins, redito para quem só ler este arquivo)

- Nenhum superlativo vazio ("o maior", "revolucionário", "nunca visto") — se não tem fonte pro
  tamanho, não afirma o tamanho.
- Nenhum número sem fonte, e todo número de conteúdo (verbetes/fontes/momentos) é conferido no
  repo na data do envio, não copiado deste documento sem checar de novo.
- "Invasão" ou "chegada", nunca "descobrimento" — em qualquer peça, mesmo as curtas.
- Nenhuma pessoa viva nomeada que não já esteja no jogo — inclusive o próprio dono: **resolvido
  em 22/08** — o "Quem fez" do press-kit (rascunho 03) não nomeia ninguém; a plataforma e o
  método assinam.
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

**Atualizado em 22/08:** o rascunho 01 (texto-base) foi aprovado pelo dono, com o ajuste da 1a
frase (ver secao 3, item 3). O rascunho 03 (press-kit) teve a secao "Quem fez" resolvida pelo
dono na mesma data (sem nome de pessoa).

**Atualizado em 23/08 — TEXTO DAS 5 APROVADO.** Em mesa de decisao, perguntado se liberava as 5
pecas ou so a de professores, o dono escolheu liberar as 5. Isso aprova o TEXTO de `01` a `05`
(cada arquivo agora registra isso no proprio cabecalho, no lugar da marca [PRECISA SIGN-OFF]).
**Isso NAO aprova:** canal, data de publicacao, nem quem posta -- cada rodada de ENVIO (secao 3,
itens 4 a 7) continua exigindo o proprio sign-off antes de sair. Nenhuma peca foi lida linha a
linha pelo dono nesta rodada alem do que ja estava fixado em 22/08 (rascunho 01 e o "Quem fez"
do 03) -- as pecas 02, 04 e 05 reusam esse texto-base sem acrescentar numero, fato historico ou
imagem novos (conferido pelo growth em 23/08, ver relatorio da rodada), entao nao ha conteudo
nelas que o dono nao tenha visto em substancia. Se isso mudar numa proxima edicao de qualquer
peca, a marca [PRECISA SIGN-OFF] volta para o trecho novo.
