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

Nada. Todos os agentes voltaram e tudo está integrado e publicado.

## O que a manhã deve fazer, em ordem

1. **Ler as respostas do dono na mesa** (`ferramentas/pendencias.json`): nome do capítulo
   Tupinambá · Marajó marco×capítulo · quando fazer o pré-1500.
2. **Quando as 8 imagens de SALVADOR chegarem pela mesa**: processar (converter-fundo /
   validar-folha / requalificar), inserir a época em `EPOCAS` (textos do relatório do
   historiador SALVADOR — rascunho a marcar; o texto final é do dono), reorganizar o marco
   1835 da LINHA_TEMPO como placa do capítulo, `npm test`, olhar prints, publicar.
3. **Peso**: 3,9 MB, teto 3,6 estourado — preparar comparação 660px×master para o dono
   decidir (test/inline-fundos.js já reencoda; medido antes: 660px corta 22%).
4. Estender o lugar-vivo (marcos+faixa+retorno) aos caps. 1 e 3 se o dono gostar do
   protótipo do 2.

## O que já aconteceu no turno noturno (tudo publicado)

1. Decisões da noite registradas · pendências da manhã na mesa (nome do cap. Tupinambá,
   Marajó marco×capítulo, gerar Salvador, quando fazer o pré-1500).
2. Mesa com 8 pedidos de arte de SALVADOR prontos (travas de representação nos prompts).
3. `JOGABILIDADE.md` — desenho técnico travessia + lugar vivo.
4. **5 marcos pré-1500 na linha do tempo** (Luzia, montes da costa, Marajó, geoglifos,
   expansão Tupi) + regra de nomeação escrita + palavras banidas.
5. **Motor N-capítulos integrado** (52f45be): capítulo = objeto em EPOCAS + arte; época
   sem arte cai na anterior com warn; save validado com faixas derivadas.
6. **Lugar vivo fase 1 PUBLICADO** (f98c1dc): marcos de história na estrada do cap. 2,
   S.acolhidos persistente, tela de retorno "enquanto você esteve fora".
7. **Usabilidade: 10/10 fechados e publicados** (95ec880 + 77f1f17): controles ensinados,
   telas sem vazamento, JOGAR direto, linha do tempo sem monotonia, AJUSTES na fonte da casa.
8. **SALVADOR está pronto nos relatórios mas NÃO entrou** — decisão de esperar a arte:
   o fallback mostraria a mata do presente sob textos de 1835, ensinando errado. Entra
   quando o dono gerar as 8 imagens da mesa.

## Regras de integração que já pagaram sessão

- Patch por caminho explícito (`git diff <base> -- src/ > x.patch && git apply --3way`).
- Conflito entre agentes: resolver mantendo OS DOIS lados (caso som+grupo).
- `npm test` + OLHAR os prints antes de cada push. `main` é produção.
- Números medidos, armadilhas e como o dono trabalha: ver o histórico deste arquivo no
  git (`git log -p RETOMADA.md`) — cortados daqui por espaço, continuam valendo.
