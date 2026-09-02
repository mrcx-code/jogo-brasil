# Contrato — o retrato publicado

**Feature**: 001-painel-derivado · **Data**: 2026-09-01

Este é o único contrato desta feature: um arquivo publicado ao lado do painel, no mesmo domínio,
lido pela página. Não há rota nova, não há autenticação, não há escrita.

---

## Quem escreve, quem lê

| | |
|---|---|
| **produtor** | o build, a cada publicação |
| **consumidor** | a página do painel, a cada carga e a cada recarga automática |
| **autenticação** | nenhuma, nos dois lados |
| **origem** | a mesma do painel — sem host novo, e portanto **sem mexer na CSP** |

## Forma

Um documento JSON com os campos descritos em [data-model.md](../data-model.md).

Regras que valem para todos os campos:

- **Todo instante é absoluto e traz o fuso.** Instante sem fuso é recusado pelo leitor, não
  interpretado como local — interpretar seria errar por horas em silêncio.
- **Nenhuma idade é gravada.** Só instantes.
- **Nenhum campo é texto de confiança.** Tudo que vier daqui entra na tela como texto, nunca como
  marcação — a mesma regra que já vale para a fila e que o portão do painel já cobra.

## O que o leitor faz com cada resposta

| situação | o que a tela mostra | por quê |
|---|---|---|
| documento válido e recente | o estado derivado: ativas, sem sinal há X, em voo | o caminho normal |
| documento válido mas **velho** (o `gerado_em` passou do teto) | **não sei** — e diz há quanto tempo é o retrato | o retrato velho não é o estado atual; afirmar seria repetir o defeito de 01/09 |
| documento com forma errada | **não sei** | forma errada é documento NÃO LIDO, jamais "nada acontecendo". É o achado do QA de 24/08 sobre a fila, aplicado aqui antes de custar de novo |
| ausente (404) | **não sei** | idem |
| a rede falhou | **não sei** | falha nunca vira lista vazia — foi assim que o rodapé passou a carimbar "ao vivo" sobre uma tela que não recebeu nada |

**As cinco linhas acima são a feature.** Três estados distintos — *ativo*, *sem sinal há X* e
*não sei* — e a proibição de qualquer caminho de erro produzir silenciosamente o primeiro.

## Compatibilidade

- **Campo novo não quebra leitor antigo**: o leitor ignora o que não conhece.
- **Campo obrigatório que some quebra**, e tem de quebrar alto: vira documento com forma errada,
  e a tela cai em *não sei*. Nunca degrada para um estado parcial que parece completo.
- O consumidor **não** guarda cópia do último retrato bom para usar quando o novo falha. Guardar
  seria transformar uma falha de agora numa afirmação sobre agora — exatamente o que esta feature
  existe para impedir.
