# RETOMADA — leia isto primeiro na próxima sessão

Atualizado em 2026-08-07, fim do dia, depois de uma **auditoria de handoff** que o dono
pediu com estas palavras: *"garanta que não tenha mais nenhum pedido esquecido"*. O que
está abaixo é o resultado dela — inclusive o que estava esquecido.

## As três pernas, que mandam em tudo (CLAUDE.md §8)

**bonito · divertido · ensina**, com o mesmo peso. Entrega que ganha numa às custas de
outra não está pronta. E há licença de arquitetura: plano é ferramenta, não compromisso.

## PEDIDOS DO DONO QUE ESTAVAM ESQUECIDOS — achados nesta auditoria

1. **Os dois capítulos pré-1500** (sambaquis "A COSTA QUE ELES LEVANTARAM", Amazônia "A
   FLORESTA É OBRA"). Ele respondeu **"bora fazer então"** e a resposta ficou parada na
   fila. Estão desenhados no NOTES.md com abertura, fecho, fontes e a trava anti-religião
   cumprida por desenho. **Falta arte** (a maior encomenda já feita: 4 pinturas, 2 folhas,
   2 retratos, 4 contextos, 12 objetos) e a regra que o historiador propôs como
   inviolável: só fazer se ficarem TÃO BONS quanto o melhor capítulo — abertura feia sobre
   engenheiros milenares diz "primitivo" sem usar a palavra.
2. **Explorar jogabilidade por capítulo** (06/08): *"pode pensar em outras propostas para
   as outras"*, mantendo um capítulo no padrão atual. Registrei e não virou trabalho.
   **Agora está no escopo do PM**, com a trava nova: variedade não pode poluir a tela.
3. **SVG para pesar menos** (05/08): perguntado e nunca respondido. **Respondido agora**,
   com número, no NOTES.md — não vale (ganho máximo de 0,6%).

## Decidido pelo dono e NÃO implementado (a dívida honesta)

| o quê | quando ele decidiu | estado |
|---|---|---|
| **Drops destrancam o capítulo** (pelo total, não por tipo) | 05/08 | zero linha escrita |
| **Supabase**: código de transferência, placar anônimo | 05/08 | zero linha — e a tela de AJUSTES promete "nada sai deste aparelho": reescrever na MESMA fase |
| **React nas telas · Phaser no motor** | 05/08 | as fases 1–2 (Capacitor, TypeScript) foram feitas; estas não |
| **Plataformas estilo Mario** ("serve ao jogo apenas") | 07/08 | no escopo do PM agora |
| **APK compilado** | — | nunca executado: falta JDK e Android SDK nesta máquina |

## Esperando o dono (mesa: `npm run mesa` → localhost:8200)

- **3 folhas de corrida** com a pessoa da caminhada (as que chegaram trazem outra pessoa — §2)
- **Ler o fecho novo de PINDORAMA** e os textos de SALVADOR (o texto de EPOCAS é dele, palavra por palavra)
- **Em Palmares, o que a mão da pessoa recebe?** (pendência antiga, sem resposta)
- **A auditoria §2 em workflow** — oferecida, aguardando sim

## O gap estrutural que ninguém resolveu

**Peso.** Caiu 24,5% hoje (4.455 → 3.362 KB) mas a ~380 KB por capítulo o teto volta a
estourar no **6º**. Com 12 capítulos planejados, **carga sob demanda é inevitável** — e
ela quebra a regra do arquivo único, que já foi flexibilizada uma vez. É decisão do dono.

## Como trabalhar (não mude isto sem motivo)

- `npm test` verde ANTES de commitar — e **leia a saída**: em 07/08 eu commitei com o teste
  vermelho porque o encadeamento do comando seguiu adiante. `main` é produção.
- Integração de agente: `git diff <base> -- src/ > x.patch && git apply --3way x.patch`.
  Conflito entre agentes: **manter os dois lados**.
- **Sempre olhar os prints.** O teste garante que não quebrou, não que ficou bom.
- A mesa distingue **entregue** de **processado** — o bloco "CHEGOU E AINDA NÃO ENTROU"
  existe porque eu perdi duas entregas em 07/08 por confundir os dois.

## Documentos vivos

`CLAUDE.md` (regras + a tese) · `DIRECAO.md` (arte, a barra premiada, ondas 1–5) ·
`SPRINT.md` (PM) · `QA.md` (bugs e gaps) · `EQUIPE.md` (os quatro papéis e o protocolo) ·
`JOGABILIDADE.md` · `NOTES.md` (Diário e todas as fontes).
