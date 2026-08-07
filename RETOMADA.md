# RETOMADA — leia isto primeiro na próxima sessão

Atualizado na noite de 2026-08-06, início do turno autônomo de ~10 h (dono dorme, volta
~9h de 2026-08-07). **Leia depois do `CLAUDE.md` e antes de tocar em qualquer coisa.**

## Em uma frase

O jogo tem direção de arte nova (menu-poste, papel de campo, fonte bitmap acentuada),
linha do tempo com 8 marcos com fonte, e um **arco nacional de 10+ capítulos aprovado** —
a noite é para: motor N-capítulos, capítulo pré-1500, Salvador, jogabilidade
travessia+lugar-vivo, e a mesa preparada para os assets.

## As decisões do dono desta noite (todas no NOTES.md, seção "Decisões do dono")

1. Arco de 10 capítulos aprovado, com MAIS densidade.
2. **História profunda antes de 1500 entra** — sem virar reconexão religiosa.
3. Branqueamento entra (Hospedaria); número da CNV entra com ressalva; pessoas reais
   como **homenagem 8-bit** (Krenak, Conselheiro) — nunca inimigo, nunca jogável.
4. Jogabilidade: **travessia + lugar vivo** (marcos visíveis no horizonte + lugar que se
   enche de vida), com **pelo menos 1 capítulo no padrão atual**.
5. Regra da fila: em qualquer ponto em que a produção parar, o jogo publicado é um arco
   completo e equilibrado. Ordem: Salvador → Silêncio/Praça → Candangos → Belo Monte →
   Hospedaria → Pequena África → Sete Povos (+ pré-1500 na frente quando desenhado).
6. Operacional: rodar sempre ANTES de bater limite; perto do limite, esperar o reset em
   vez de travar; handoff sempre atualizado; foco = conscientizar, educar.

## Trabalho em voo neste momento

- **Historiador pré-1500** (relatório): sambaquis, Marajó, geoglifos/Amazônia antropizada,
  expansão Tupi — com a trava anti-religião e a estante de pesquisadoras (Gaspar, Schaan,
  Roosevelt, Neves).
- **Motor N-capítulos** (worktree): capítulo↔cenário por dados, ESQUEMA_SAVE derivado,
  arte com fallback, prova com 5 épocas. Integrar por patch (`git diff 52ff66c -- src/`).

## Fila da noite, depois dos dois acima

1. Integrar motor N-capítulos (verde + prints idênticos com 3 épocas).
2. **SALVADOR entra como capítulo 4** — textos do relatório do historiador (rascunho
   marcado; o texto final de EPOCAS é do dono, palavra por palavra), mecânica = alcance
   existente. Sem arte própria ainda: usar fallback declarado do motor novo.
3. **Mesa de entrega**: gerar em `ferramentas/necessario.json` os pedidos de arte de
   Salvador (pintura 2 partes, sprite ganhadeira, retrato, 2 contextos, itens tabuleiro/
   barril/trouxa, drops acarajé/pano/búzios) com prompts completos — o dono gera de manhã.
4. **Jogabilidade travessia+lugar-vivo**: desenho técnico primeiro (como marcos aparecem
   no horizonte SEM paralaxe nova — lembrar: chão 1:1 inegociável), depois protótipo no
   capítulo 2 (Palmares já tem o acolher; o lugar-vivo é a extensão natural).
5. Usabilidade: revisar os 5 primeiros minutos com o fluxo novo (menu→era→cerimônia→jogo).
6. Se sobrar: linha do tempo ganha os marcos pré-1500 e Império do historiador.

## Regras de integração que já pagaram sessão

- Patch por caminho explícito (`git diff <base> -- src/ > x.patch && git apply --3way`).
- Conflito entre agentes: resolver mantendo OS DOIS lados (caso som+grupo).
- `npm test` + OLHAR os prints antes de cada push. `main` é produção.

## Números medidos — não os re-derive, estão certos

| | |
|---|---|
| passada, por era | 6,377 (n=10) · 7,492 (n=12) · 6,918 (n=11) |
| escorregamento do pé | 0,48% · 0,00% · 0,67% |
| paralaxe | 0,45 céu · 1,0 chão · 1,35 folhagem |
| atendido em 60 s | andando 1,00 · correndo 0,66 · parado 0,00 |
| renda de correr | +16% (era −5% antes do spawn por distância) |
| o que atravessa a tela | 18,3% da renda (era 4%) |
| toque no vazio | **65% da renda** — o último item grande |
| do zero até ver tudo | 5 min 07 s |
| peso do index.html | **3,7 MB** (teto que eu mesmo dei: 3,6) |

## Armadilhas que já custaram sessão — não repita

- **Paralaxe é fatal no horizonte e abaixo, inócua acima.** O chão é 1:1 e não se negocia.
- **Centroide do pé MENTE.** Meça a SOLA.
- **CSS órfão não dá erro** — só faz a coisa errada em silêncio. Mordeu duas vezes.
- **`z-index` negativo não tira um filho de trás do fundo do pai.** Tem que virar irmão.
- **Erro de sintaxe derruba tudo** e o sintoma aparece longe: o smoke test disse `CFG is not
  defined` quando a causa era um `else` órfão. Bisecção acha em um minuto.
- **`git add -A` com agente rodando** varre trabalho alheio para dentro do commit errado.
- **`\n` em heredoc de shell vira quebra real** e quebra a string. Use `Write` ou `
`.

## Como o dono quer trabalhar

Decidir sozinho, ser direto, **medir em vez de achar**, e avisar antes de quebrar algo.
Perguntas desnecessárias ele lê como desobediência ao pedido de autonomia. A exceção é
**representação histórica** — ali, decidir sozinho é a escolha errada.

Ele pediu explicitamente: **operar no máximo a 98% do limite**, ir mais devagar ao se
aproximar, e escrever um texto de retomada como este antes de resetar. Este arquivo é isso.
