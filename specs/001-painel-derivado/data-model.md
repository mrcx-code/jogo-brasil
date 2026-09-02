# A forma do retrato

**Feature**: 001-painel-derivado · **Data**: 2026-09-01

Três entidades. A regra que governa as três: **todo instante é absoluto e vem com fuso**, e
**nenhuma idade é gravada** — idade é sempre calculada na hora de desenhar. Gravar idade é gravar
uma verdade com prazo de validade, que é a doença que esta feature veio curar.

---

## 1. Retrato (o documento inteiro)

O que o build publica a cada deploy. Um só por publicação.

| campo | o que é | regra |
|---|---|---|
| `gerado_em` | instante em que o retrato foi montado | obrigatório, com fuso. **É o campo mais importante do arquivo**: é ele que permite a tela dizer "não sei" quando o próprio retrato está velho. |
| `maquinas` | lista de Máquina (abaixo) | pode ser vazia — vazia significa "nenhuma máquina identificada no histórico visível", e a tela diz isso |
| `em_voo` | lista de Item em voo (abaixo) | pode ser vazia |
| `historia_vista` | quantos registros de trabalho o build conseguiu enxergar | obrigatório. Existe porque o build pode ver um histórico **raso**: sem este número, uma máquina ausente por falta de histórico seria indistinguível de uma máquina que não trabalha. |
| `completo` | se a história vista cobre todas as máquinas conhecidas | quando falso, a tela avisa que a leitura é parcial em vez de afirmar ausência |

## 2. Máquina

Quem produz trabalho. Hoje três: a sessão do Windows, a da nuvem, a do Mac.

| campo | o que é | regra |
|---|---|---|
| `nome` | identificação própria da máquina | obrigatório; vem de campo estruturado, **nunca** de texto livre |
| `ultimo_em` | instante do último trabalho entregue por ela | obrigatório. É o que envelhece sozinho e faz a máquina cair da faixa AGORA sem ninguém escrever nada. |
| `ultimo_que` | uma linha sobre o que foi esse último trabalho | opcional; vazio vira "sem descrição", nunca um traço que pareça dado |

**Estado é derivado, nunca gravado.** A tela calcula, no momento de desenhar:

- `ultimo_em` no futuro → **não sei** (relógio dessincronizado; a regra já existe em produção)
- idade ≤ o teto → **ativa**
- idade > o teto → **sem sinal há X**
- máquina ausente do retrato → **sem registro** (que é diferente de parada)

## 3. Item em voo

Uma tarefa da fila que alguma máquina travou.

| campo | o que é | regra |
|---|---|---|
| `id` | o identificador do item na fila | obrigatório |
| `titulo` | o nome legível | texto de servidor: entra na tela por `textContent`, nunca como marcação |
| `maquina` | quem travou | obrigatório; se não houver, o item não é "em voo" |
| `desde` | quando travou | obrigatório, com fuso |

**Um item travado há muito tempo não é atividade.** Acima do teto ele aparece como
*travado e parado* — e essa distinção importa: é ela que faz aparecer um item esquecido em vez de
o item esquecido fingir trabalho em andamento.

---

## Relações

- Uma **Máquina** tem zero ou mais **Itens em voo**.
- Um **Item em voo** pertence a exatamente uma **Máquina**.
- Um item cuja máquina não aparece na lista de máquinas é uma **inconsistência do retrato**, e a
  tela mostra o item marcando que não sabe de quem é — nunca inventa um dono nem esconde o item.

## O que NÃO entra no retrato, e por quê

- **Agente.** Não há rastro durável de agente vivo. Os cartões de agente continuam lendo o que
  existe hoje, e passam a afirmar só o passado.
- **Qualquer idade pré-calculada.** Ver a regra no topo.
- **Qualquer segredo.** O arquivo é público por construção. Se algum dia alguém quiser pôr aqui um
  dado que não pode ser público, o desenho inteiro tem de ser revisto — não o arquivo.
