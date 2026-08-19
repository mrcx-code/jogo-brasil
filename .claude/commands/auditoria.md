---
description: A AUDITORIA — varredura paralela dos treze capítulos com juízes independentes. Queima muito; só quando o dono pedir pelo nome.
---

# A AUDITORIA

Comando nomeado pelo dono em 2026-08-18: *"vamos deixar isso como um comando salvo para o futuro,
nos próximos dias iremos fazer A AUDITORIA (usar esse nome)"*.

**Isto é orquestração pesada.** Dezenas de agentes em paralelo, com painel de juízes independentes.
Queima muito, e por isso **só roda quando o dono escreve o nome**. Não infira que é hora de rodar
porque a fila esvaziou.

## O que ela é

Uma varredura **simultânea** dos treze capítulos, cada um por vários pares de olhos que não se
falam, seguida de uma rodada adversarial que tenta **derrubar** cada achado antes de ele virar
tarefa. É o oposto do trabalho de todo dia — ali um agente por vez, aqui a frota.

O motivo de existir está medido: em 18/08, quatro rodadas de agente sobre um recorte pequeno
renderam dezoito achados, e **três dos meus próprios consertos daquele dia não sobreviveram à
verificação de um QA independente**. Um capítulo nunca foi olhado por ninguém além de quem o
escreveu.

## As dimensões, uma por agente, e por que cada uma

Para **cada** um dos treze capítulos:

1. **§2 — representação.** A trava mais dura do repositório. Povos originários não são "o começo";
   escravidão não é fase; *invasão* e nunca *descobrimento*; nenhuma pessoa real como inimigo;
   povo nomeado e não "índio". Quem achar dúvida **não decide** — escreve no `PENDENTES` para o
   dono, que é a única regra deste repositório em que decidir sozinho é o erro.
2. **A fonte.** Cada afirmação histórica tem fonte lida, com citação literal, no `NOTES.md`? A
   fonte diz o que o jogo diz que ela diz? Prioridade de autoria indígena e negra foi respeitada?
   Número sem fonte é ficção se apresentando como história.
3. **A REGRA DO DOCUMENTO** (capítulos pós-1985). Só se afirma o que um documento público afirma,
   e o jogo mostra qual. *Registrou* para número de órgão; *o relatório concluiu* para conclusão.
   Nenhum político, magistrado ou empresário nomeado como responsável. Nenhuma simetria falsa,
   nenhum cinismo.
4. **A mecânica contra o texto.** O verbo que a abertura promete tem mecânica atrás? A rua tem
   gente onde o texto diz que tem? Ninguém é alcançado por dano?
5. **A arte.** Coerência entre capítulos, pintura própria ou emprestada, escala, luz, peso.
6. **O encaixe.** Cabe nas telas que a pessoa tem? Gira sem quebrar? A saída se alcança?

## O harness

- **Fan-out por capítulo, não por dimensão.** Treze pipelines independentes; o capítulo 3 pode
  estar na verificação enquanto o 7 ainda lê fonte. Barreira só onde houver necessidade real de
  ver o conjunto — por exemplo, para deduplicar antes da rodada adversarial.
- **Verificação adversarial obrigatória.** Cada achado passa por agentes cujo trabalho é
  **refutá-lo**, com lentes distintas (a fonte sustenta? reproduz na tela? é decisão de produto
  disfarçada de defeito?). Maioria refuta, o achado morre.
- **`isolation: "worktree"`** para quem tocar `src/`.
- **Nada da tela ONDE FOI.** `TERRITORIO.md` lista o que é do dono, por nome.
- **O produto é uma MESA, não um relatório**: o que virou tarefa, o que foi desmentido (e o
  desmentido entra no `PENDENTES`, porque desmentido não registrado volta como retrabalho), e o
  que é decisão do dono.

## Antes de rodar

Diga ao dono, **em número**, o tamanho estimado da frota. Ele pediu este comando sabendo que é
caro; o que ele não pediu foi surpresa na conta.
