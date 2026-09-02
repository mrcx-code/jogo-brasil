# Pesquisa — de onde o retrato pode vir

**Feature**: 001-painel-derivado · **Data**: 2026-09-01

A pergunta desta fase é só uma: **onde mora o retrato de quem está ativo, e quem o escreve.**
Três caminhos eram possíveis. O critério que decidiu não foi elegância — foi qual deles **falha em
silêncio**, porque falha em silêncio foi exatamente o defeito que originou a feature.

---

## Decisão

**Um arquivo publicado no mesmo domínio, gerado pelo build, e lido pela página com as idades
calculadas no cliente.**

### Racional

1. **Zero credencial.** Não existe chave de escrita em nenhum ponto do caminho — o Artigo VI da
   constituição fica satisfeito *por construção*, e não por vigilância. Foi o critério que sozinho
   eliminou as duas alternativas.
2. **A escrita é efeito colateral do deploy**, que não é opcional: todo push na `main` publica.
   Isso é literalmente o FR-003, sem passo separado que alguém possa esquecer.
3. **A CSP não muda.** O arquivo é same-origin, coberto pelo `'self'` que já existe para os
   pacotes de arte. Abrir a CSP exigiria tocar a tabela pregada no `construir.js`, e cada abertura
   dela é dívida que fica.
4. **Falha visível.** Se o arquivo não existir ou vier malformado, a página diz *não sei* — o
   mesmo caminho que o `backlog.json` já usa, e que o portão `caminhos-do-backlog.js` já cobra.
   Fila não lida nunca vira fila vazia; retrato não lido nunca vira "ninguém trabalhando".
5. **Não precisa de batimento cardíaco.** A idade é subtração feita na hora de desenhar. Uma
   máquina que morreu para de avançar o próprio carimbo, envelhece e cai da faixa sozinha.

### Alternativas consideradas

**(A) Uma ação no CI escrevendo direto no banco.**
Robusta e óbvia, e foi a primeira ideia. Recusada por duas razões: exige guardar uma **chave de
escrita** como segredo do CI (permitido, mas é credencial nova onde não precisa haver nenhuma), e
acrescenta um serviço que pode falhar calado — se a ação quebrar, a tela mostra o último retrato
como se fosse atual, que é o defeito de 01/09 renascido em outro lugar.

**(B) Continuar em `mesa_agente`, com as máquinas escrevendo melhor.**
É o que existe hoje. Recusada pelo número: em 01/09 o último sinal tinha **315 minutos** e a
rodada que estava no ar nunca tocou a mesa. O problema não é disciplina — é que a fonte depende de
memória. Mais disciplina sobre a mesma fonte compra tempo, não conserta. O dono já tinha dito isso
com todas as letras ao escolher trocar a fonte em vez de tirar o quadro.

**(C) A página consultar a origem do trabalho ao vivo.**
Tentador (a informação está lá, é pública) mas: exigiria abrir a CSP para um host novo, gastaria a
cota de leitura anônima de quem abrisse a página, e traria uma dependência externa no caminho de
desenho da tela. Muito preço para um dado que o deploy já poderia ter carregado consigo.

---

## O que ainda precisa ser medido durante a implementação

Estes não são "não sei o que fazer" — são números que a implementação tem de produzir, e que o
portão vai cravar:

1. **Quanta história o build enxerga.** O deploy pode clonar o repositório de forma rasa. Se a
   profundidade disponível não cobrir o último trabalho de alguma máquina, aquela máquina aparece
   como *sem registro* — o que é honesto, mas empobrece a tela. **A implementação mede a
   profundidade real e a declara no próprio retrato**, e o portão reprova se o retrato afirmar
   mais do que a profundidade permite saber.
2. **O peso do arquivo.** Alvo: poucos KB. Se passar disso, cortar a cauda (guardar só o último
   trabalho por máquina, não a lista inteira).
3. **Como uma máquina se identifica.** Precisa ser um campo próprio e parseável, nunca texto livre
   na mensagem — texto livre é o que faz o dado apodrecer sem ninguém notar. A implementação
   escolhe a forma e o portão cobra que ela seja respeitada nos commits novos.
4. **O que fazer com o histórico anterior à regra.** Commits antigos não têm identificação de
   máquina. Eles não podem ser *adivinhados*: entram como *sem registro*, e a tela diz isso.

## O que esta pesquisa NÃO resolveu, de propósito

**Fidelidade por agente.** Continua impossível, pelo motivo que o spec já declara: não existe
rastro durável que ateste que um agente específico está vivo. Nenhuma das três alternativas
mudaria isso — é limite da realidade, não da escolha técnica.
