# RETOMADA — leia isto primeiro na próxima sessão

Atualizado na madrugada de 2026-08-08, turno autônomo (o dono dorme, volta ~9 h).
**Leia depois do `CLAUDE.md` e antes de tocar em qualquer coisa.**

## As três pernas, que mandam em tudo (`CLAUDE.md` §8)

**bonito · divertido · ensina**, com o mesmo peso. Entrega que ganha numa às custas de
outra não está pronta. Há licença de arquitetura: plano é ferramenta, não compromisso.

## O que o dono decidiu na noite de 07/08 e está em execução

1. **O escopo é a história do Brasil até hoje**, num lugar só — da escravidão e do navio
   negreiro ao voto feminino, à ditadura, à polarização, aos escândalos e à Covid. Critério
   dele: **cutucar a ferida, mas conscientizar e dar informação**.
2. **A travessia entra pelas DUAS pontas** (aprovado): `A TRAVESSIA` como transição de 90 s
   entre PINDORAMA e PALMARES — o botão dourado não faz nada e o jogo diz em voz alta que
   não vai mostrar o porão — **e** `O CAIS QUE VOLTOU À LUZ` como capítulo (Valongo, verbo
   **trazer à luz**).
3. **O contemporâneo entra sob a REGRA DO DOCUMENTO** (`CLAUDE.md` §2.5).
4. **A HISTÓRIA virou quadrinho** (publicado): 26 páginas de tela cheia, encaixe ao rolar,
   sem barra. Se o dono gerar arte nova, o primeiro lugar onde ela rende são os marcos de
   vão — **mas "a travessia forçada" não aceita paisagem nenhuma** (§2.4).
5. **Fluidez**: rever objetos aleatórios, fundos que não fazem sentido e imagens que não
   se conversam.

## Trabalho em voo (integrar por patch, como sempre)

- **Coerência visual** (worktree): objetos/fundos/imagens por capítulo.
- **Lote A do arco** (worktree): `AINDA AQUI` para o fim + migração de save **uma vez só** +
  `A TRAVESSIA`.

## As travas que entraram no §2 e são lei

**As oito recusas da travessia** (§2.4) e a **REGRA DO DOCUMENTO** (§2.5). Estão em vigor
como restrição ativa; o dono ainda não confirmou o bloco formalmente — restrição erra para
o lado seguro. **Nenhuma produção sobre escravidão começa sem esse aval.**

A régua que resume o arco inteiro: **o jogo nunca pede à pessoa que faça, com a mão, aquilo
que ele está condenando.**

## O gap que decide o futuro e é do dono

**Peso.** 3,4 MB hoje; ~380 KB por capítulo; **o teto estoura no capítulo 6, e a fila chega
a seis no lote C.** Carga sob demanda vira requisito ali — e quebra o arquivo único de
saída. Sem essa decisão, o arco para no lote B.

## Esperando o dono (mesa: `npm run mesa` → localhost:8200)

- **Folha v3 da ganhadeira** — só as poses do apoio (a v2 repete o contato; escorregamento
  18,75% contra 0,00% do cap. 1)
- **3 folhas de corrida** com a pessoa da caminhada
- **Ler** o fecho de PINDORAMA e os textos de SALVADOR (o texto de `EPOCAS` é dele)
- **Carga sob demanda**: aceita quebrar o arquivo único?

## Decidido e NÃO implementado (dívida antiga)

Drops destrancam o capítulo · Supabase (e a tela de AJUSTES promete "nada sai deste
aparelho" — reescrever na MESMA fase) · React nas telas · Phaser no motor · plataformas
estilo Mario (no Sprint 2) · APK (falta JDK nesta máquina) · **os dois capítulos pré-1500**,
que ele aprovou com "bora fazer então" e esperam arte.

## Como trabalhar (não mude sem motivo)

- `npm test` verde **e LEIA A SAÍDA** antes de commitar — em 07/08 commitei com o teste
  vermelho porque o encadeamento seguiu adiante. `main` é produção.
- Integração: `git diff <base> -- src/ > x.patch && git apply --3way x.patch`. Conflito
  entre agentes: **manter os dois lados**.
- **Sempre olhar os prints.** O teste garante que não quebrou, não que ficou bom.
- A mesa distingue **entregue** de **processado** — o bloco "CHEGOU E AINDA NÃO ENTROU"
  existe porque perdi duas entregas em 07/08 por confundir os dois. Marque em
  `ferramentas/processadas.json` ao integrar arte.

## Documentos vivos

`CLAUDE.md` (regras, tese, as travas) · `DIRECAO.md` (arte: a barra premiada, as
referências, ondas 1–8) · `SPRINT.md` (PM) · `QA.md` · `EQUIPE.md` · `JOGABILIDADE.md` ·
`NOTES.md` (Diário, fontes, vocabulário, o arco aprovado).
