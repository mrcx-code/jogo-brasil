# Texto para professores e educadores

[TEXTO APROVADO PELO DONO em 23/08, em mesa de decisão — perguntado se liberava as 5 peças de
divulgação ou só a de professores, escolheu liberar as 5. Isso aprova o TEXTO desta peça, que
reusa o texto-base do rascunho 01 (aprovado em 22/08) sem número, fato histórico ou imagem
novos. **Isso NÃO aprova canal, data de publicação nem quem posta** — a rodada de ENVIO que usa
esta peça (ver `PLANO.md` §3) continua precisando do próprio sign-off antes de sair.]

Pensado para grupo de professores (WhatsApp/Telegram/Facebook) ou e-mail direto. Tom: prático,
sem venda, sem prometer o que a plataforma não tem (não afirma alinhamento com BNCC ou qualquer
currículo específico — isso exigiria checagem que não foi feita).

---

> Professor, professora — passando o link de uma plataforma que pode ajudar em sala ou como
> indicação de casa: **BRASIL** (matheusferreira.cc), sobre a história do país.
>
> Não é só um jogo. Tem quatro partes, e dá pra usar cada uma separada, conforme o que a aula
> pedir:
>
> - **O Glossário** (matheusferreira.cc/glossario) — 181 verbetes com fonte, das palavras que a
>   história do Brasil usa. Serve como referência rápida ou leitura dirigida.
> - **A História** (matheusferreira.cc/historia) — uma linha do tempo com 47 momentos, cada um
>   com a fonte à mão, dos povos que já estavam aqui até hoje.
> - **De Onde Vem** (matheusferreira.cc/de-onde-vem) — as 61 fontes usadas em tudo isso, abertas
>   — útil se a turma quiser ir na fonte primária.
> - **O Jogo** (matheusferreira.cc/jogo/?origem=escola) — 13 capítulos em pixel art, uns 8 a 10
>   minutos de jogo. Pode servir de gancho antes de uma aula, não como substituto dela.
>
> O que os textos levam a sério, e que talvez importe para você antes de indicar: povos
> originários são nomeados por povo (não "índio" genérico), a escravidão nunca vira mecânica de
> jogo — o protagonismo é de quem resistia — e o colonizador nunca é apresentado como herói. Todo
> número histórico que a plataforma afirma tem fonte citada.
>
> É gratuito e não pede cadastro para ler ou jogar. A plataforma conta quantas vezes cada
> página abre, de forma anônima — sem nome, sem e-mail. **Quem entra pelo link do jogo aqui de
> cima já entra com essa contagem DESLIGADA**, sem precisar mexer em nada: ele é o link de sala
> de aula e vem assim de propósito. Se quiser ligar, ou desligar noutro aparelho, o interruptor
> **medição** fica no topo de qualquer página e na tela de AJUSTES do jogo, e vale pro aparelho
> inteiro. Se usar em sala e quiser mandar um retorno (o que funcionou, o que travou), escreva
> para brasilpatinhas@gmail.com.

**Nota interna:** o rascunho não afirma "alinhado à BNCC" nem cita nenhuma habilidade de
currículo específica — isso precisaria de checagem que não foi feita nesta rodada. Se o dono
quiser essa camada, é trabalho novo (do historiador, com fonte no NOTES.md), não suposição do
growth.

**Nota interna (04/09, item `medicao-desligada-caminho-escolar` do backlog):** o link do jogo
nesta peça deixou de ser `matheusferreira.cc/jogo` e passou a ser
**`matheusferreira.cc/jogo/?origem=escola`**. O parâmetro é o mecanismo inteiro: quem chega por
ele nasce com a medição DESLIGADA, e a escolha fica gravada na mesma chave que a barra das
páginas usa, então o glossário e a linha do tempo também nascem calados naquele aparelho. Isso
cumpre a decisão do dono de 03/09 sobre o ECA Digital (ressalva R1 de
`plataforma/privacidade-texto.md`, com a tabela do que foi medido). Duas coisas a saber antes de
mandar esta peça:

- **Trocar o link é trocar a proteção.** Se alguém encurtar a URL, tirar a busca ou repassar só
  `matheusferreira.cc/jogo`, a turma volta a nascer medida. O parágrafo público acima afirma o
  contrário, e afirmação de privacidade falsa é pior que nenhuma (§3 do CLAUDE.md) — então o
  link e a frase andam juntos ou não vão nenhum dos dois.
- **As três outras seções ainda não leem o parâmetro.** Hoje quem lê é só o jogo (`src/jogo.ts`);
  as páginas da plataforma são de outro território. Enquanto isso não entrar, quem abrir SÓ o
  glossário pelo link de professor continua sendo contado — por isso o parâmetro não foi colado
  nos outros três endereços desta peça: colar sugeriria uma proteção que ainda não existe lá.
  Fica como trabalho aberto para o dev da plataforma.

**Nota interna (22/08, item `professores-desligar` do backlog):** a linha sobre medição/opt-out
foi acrescentada a pedido do dono, a partir do parecer do jurídico de 22/08 — o plano mira
ensino fundamental II (crianças de 11 anos) e o dono decidiu manter a medição anônima ligada por
padrão; o jurídico considerou isso defensável com a condição de que desligar seja fácil e que
quem leva a turma saiba disso. Esta linha é a metade textual dessa condição — a outra metade é
técnica (o interruptor sobe para a barra de navegação, em paralelo). Só entrou nesta peça: ver
justificativa na seção "Outras peças" do relatório desta rodada.
