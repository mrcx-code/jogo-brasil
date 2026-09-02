# BRASIL — Constituição

> **A FONTE É O `CLAUDE.md` DA RAIZ.** Este arquivo é o ponteiro que o Spec-Kit procura, e
> resume os artigos; ele **não** é autoridade sobre nenhum deles. Decisão do dono em 01/09,
> e o motivo é mecânico: o Claude Code carrega o `CLAUDE.md` sozinho em toda sessão. Mover as
> leis para cá faria o §2 — a parte que trata de representação de gente real — passar a
> depender de alguém seguir um ponteiro, em vez de ser lido por construção.
>
> Regra que decorre disso, e ela não se negocia: **quando os dois discordarem, vale o
> `CLAUDE.md`.** Se este resumo envelhecer, ele está errado — não o outro. Foi assim que o
> repositório terminou com dois backlogs, um deles morto desde 11/08 sem ninguém notar.

**Versão:** 1.0.0 · **Ratificada:** 2026-09-01 · **Última emenda:** 2026-09-01

---

## Artigo I — Representação decide-se com o dono (INEGOCIÁVEL)

O jogo trata de colonização, de povos originários e de escravidão: história de gente real, e
boa parte dela ferida aberta. Povos originários não são "o começo" nem "o primitivo", e
continuam aqui; a escravidão não é fase de jogo, e o protagonismo é de quem resistia; o
colonizador não é herói e o "descobrimento" não existiu.

**Nenhum agente e nenhuma sessão decide representação.** Na dúvida, para e pergunta.
→ `CLAUDE.md` §2, por extenso, com o que a imagem pode mostrar e o que a mecânica não pode fazer.

## Artigo II — Nada se afirma sem fonte

Número ou fato histórico sem fonte verificável não entra. A fonte entra no `NOTES.md` no mesmo
commit. Prioridade de quem narra: autoria indígena e negra primeiro; fonte institucional vale
para o dado, não para a interpretação.
→ `CLAUDE.md` §2, "Regras práticas".

## Artigo III — Nada entra na `main` sem portão verde por exit code REAL

Não "rodei e parece ok": o número que saiu do terminal. A integração é um merge de verdade
(`ferramentas/integrar.js`), e quais auditorias são exigidas sai do território do diff.
→ `CLAUDE.md` §6.

## Artigo IV — Instrumento que nunca foi visto reprovando é decoração

Toda asserção nova precisa de um controle que a exercite: injeta o defeito, vê o exit 1,
restaura. E o controle cobra o **conjunto exato** que cada mutante deve derrubar — exigir que
"alguma coisa acuse" não protege asserção nenhuma (medido em 01/09: 7 de 21 asserções podiam
ser mortas juntas com o portão verde).
→ `EQUIPE.md` 2.8.

## Artigo V — Desconfie do portão antes de consertar o produto

Metade dos vermelhos de uma noite era o instrumento, não o jogo — e um deles protegia uma bomba
que o jogo tinha desarmado nove dias antes. `git log -S` na asserção antes de tocar no produto.
E o auditor roda **depois** do conserto também: duas de três reprovas de uma rodada foram de
defeito que o próprio conserto criou.
→ `EQUIPE.md` 2.9 e 2.11.

## Artigo VI — Credencial nunca entra no cliente

A única chave que roda no navegador de outra pessoa é publicável por construção. Chave de
serviço, chave de leitura e PIN: variável de ambiente ou arquivo no `.gitignore`, e o build
recusa construir se aparecerem na saída.
→ `CLAUDE.md` §3.2 e §8.

## Artigo VII — Afirmação que virou falsa é pior que nenhuma

O que a tela promete tem de ser verdade no código, e a promessa é reescrita na MESMA entrega
que a torna falsa — nunca depois. Vale para privacidade ("nada sai deste aparelho"), para
estado ("agora") e para qualquer número mostrado.
→ `CLAUDE.md` §3 e o portão `test/rodape-verdadeiro.js`.

## Artigo VIII — Território: um escritor por vez

Quem toca `src/` trabalha em worktree isolado. Territórios disjuntos voam juntos; qualquer
interseção é sequencial. A tela ONDE FOI é do dono e não se toca.
→ `CLAUDE.md` §5.1 e §5.2, `TERRITORIO.md`.

## Artigo IX — Reverteu pela metade, registra

Código morto não entra na `main`, mas reverter sem registrar perde o trabalho duas vezes:
some o código E o diagnóstico que custou a sessão. Vai para o `PENDENTES.md` no mesmo commit.
→ `CLAUDE.md` §6.

---

## Governança

- **Emenda** exige decisão do dono, escrita com a data e as palavras dele. Todo artigo deste
  arquivo nasceu de uma decisão registrada, não de preferência de sessão.
- **A tese do produto governa a priorização:** bonito · divertido · ensina, com o mesmo peso.
  Entrega que ganha numa às custas de outra não está pronta.
- **O alvo** deixou de ser um jogo de treze capítulos e passou a ser uma plataforma de
  conhecimento que cresce ano a ano. Cada seção precisa valer sozinha.
- **Este arquivo é resumo.** Emenda se faz no `CLAUDE.md`; aqui ela é refletida depois.
