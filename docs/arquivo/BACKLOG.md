# BACKLOG — a fila do jogo

Ordenada por valor, não por facilidade. Quem trabalha aqui pega o primeiro item não feito.
Regra de corte: **o que aumenta a chance de alguém voltar amanhã vale mais que efeito visual.**

## Agora

- [ ] **O VERBO MUDA DE CAPÍTULO PARA CAPÍTULO.** Decisão do dono, 2026-08-11, e é a maior
      aposta aberta. Hoje o dedo faz a MESMA coisa em todos os capítulos: o motor veio de um
      jogo de briga de rua e os verbos continuam de briga — golpear, alcance, combo, dano
      dobrado. Palmares **acolhe**, Salvador **sussurra**, Pindorama **cuida**: são gestos
      diferentes e deveriam se jogar diferente. A tese diz bonito · divertido · ensina com peso
      igual, e "divertido" é a perna mais fraca por uma distância grande — o glossário de 157
      verbetes aumentou o desequilíbrio. **Não cabe num turno**: começa por escolher UM capítulo
      e provar o verbo dele.

- [ ] **Capítulo novo antes de mais retenção.** Decisão do dono, 2026-08-11. O maquinário de
      fazer voltar já é sofisticado — sequência, bônus, o painel de retorno, medição dos
      primeiros 60 s. Retenção sem conteúdo novo é convite para a pessoa descobrir que não havia
      motivo para voltar.

- [ ] **Fazer correr valer a pena.** Andando e segurando o botão, atende-se 100% — então a
      escolha entre andar e correr não morde, e correr não compra nada (3% de renda, dentro do
      ruído). O verbo tem consequência mas não tem tensão. **Critério:** a pessoa tem que
      conseguir descrever a diferença sem ver número. Há agente nisso.
- [x] **Ler não pode pagar mais que pular.** ~~O mundo continua rendendo durante a caixa de
      fala.~~ **JÁ RESOLVIDO** — conferido em 2026-08-11: `mundoParado = historiaAberta()` no
      laço principal, e o smoke mede (`story open -> world moved 0.00 px | impact 0.00`). Ficou
      aqui como pendente depois de pronto e quase virou trabalho refeito: alguém chegou a
      escrever briefing para reconstruí-lo. **Backlog que mente tem autoridade, e por isso é
      pior que backlog nenhum.**
- [ ] **Pose parada para a caixa de fala.** Ela conversa de perfil, no meio da passada,
      porque o único retrato disponível é um quadro de caminhada. Já pedido na mesa.

- [ ] **Sprites de cap.2 e cap.3.** A arte existe e as folhas foram medidas: 12 manchas, zero
      fragmento, cabeça com CV de 0,8% nas duas — é a mesma pessoa nos doze quadros. O que
      falta é do motor, não da arte: `HERO_B64`, `PASSO_PX` e `heroScale` são únicos, e
      personagem por capítulo significa velocidade por capítulo, que tem de continuar sendo
      `PASSO × 60 / n` com `n` inteiro em cada um. Os quadros repetidos de cada folha estão
      medidos no `NOTES.md` — **`--quadros=6,5,2` é do capítulo 1 e não serve para os outros.**
- [x] **Embutir os 4 ícones** já convertidos em `assets/objetos/`. Folha, água e cesto viraram
      os três contadores; o pé virou o cartão de ritmo.
- [x] **Objetos de cap.2 e cap.3.** Três por capítulo, mais os drops. `MOB_B64` e `DROP_B64`
      passaram a variar por capítulo, como o `FRENTE_B64` já fazia.
- [ ] **Achar onde pôr o feixe de lenha (cap.2) e a enxada (cap.3).** Convertidos e sem vaga:
      há três tipos de objeto e quatro artes por capítulo.

## Arte pendente do GLOSSÁRIO — pedida pelo dono, gerada por ele em outra máquina

Decisão dele em 2026-08-10: **uma imagem por assunto, dezesseis ao todo.** Ele gera fora
desta máquina; isto aqui é a especificação, e ela entra quando o glossário for subir.

**A REGRA QUE MANDA, e ela é do §2:** a imagem ilustra o ASSUNTO, nunca o LUGAR e nunca a
GENTE. A Direção de Arte vetou reusar as pinturas de capítulo com um argumento que vale igual
para arte nova — pôr a serra da Barriga atrás de "OS QUILOMBOS" faz a imagem AFIRMAR que
Palmares era aquele morro, coisa que o texto não afirma, e imagem que afirma mais que o texto
é exatamente o que o §2 proíbe. Matéria e objeto, portanto; paisagem e retrato, não.

**Formato — REVISTO em 2026-08-10, quando a capa virou um fichário:** pixel art na paleta da
casa, sem grafismo geométrico inventado (§2 — padrão que "parece indígena" pertence a um povo
e tem nome). **QUADRADA**, e não larga como a primeira versão desta ficha dizia: o nicho é um
selo de 55×55 px (cinco pautas) rebaixado no canto inferior direito de cada divisória, ao lado
da frase. Arte nativa em **55×55 ou 110×110** (o dobro exato, para o navegador reduzir por
pixel inteiro e não borrar a borda dura). Entra em `assets/entrada/`, é embutida em base64
pelo build e **não pode custar mais que ~8 KB por peça** — são dezesseis, e o teto de peso do
arquivo único é o gap que decide o arco (ver RETOMADA.md).

**O nicho já existe e já funciona sem a arte:** hoje ele mostra a contagem de verbetes do
assunto. Quando a imagem chegar, ela ocupa o lugar e o número desce para o canto — nada mais
na tela precisa mudar. A tela não está esperando a arte para ficar de pé; a arte é ganho.

**As dezesseis, com a matéria sugerida — a última palavra é da Direção de Arte:**

| assunto | o que a imagem mostra |
|---|---|
| TUDO | o próprio caderno de campo, fechado |
| AS PALAVRAS | uma palavra riscada e outra escrita por cima |
| QUEM JÁ ESTAVA AQUI | mandioca e cesto de fibra |
| A ESCRAVIDÃO | o livro-caixa aberto, com colunas |
| OS QUILOMBOS | cerca de paus e roça, sem morro ao fundo |
| TRABALHO E REVOLTA | o tabuleiro da ganhadeira |
| CHAMARAM DE LIBERDADE | a carta de alforria, dobrada |
| O ESTADO | a coroa e o tinteiro, lado a lado |
| O DIA SEGUINTE | a enxada e a mala de imigrante |
| NÃO PODIA SER DITO | a folha de jornal com o buraco da censura |
| OS DIREITOS | a carteira de trabalho e a Constituição |
| CADA POVO TEM NOME | não use adorno nem pintura corporal — prefira o mapa de rios |
| A LÍNGUA | tipos móveis de impressão |
| A FLORESTA | a terra preta na mão, e a castanheira |
| O TERRITÓRIO | o chão rachado da seca e o cantil |
| TAMBOR E FESTA | o atabaque e a panela |

**Cuidado especial em CADA POVO TEM NOME:** qualquer objeto ritual ou grafismo ali cai no §2.1
e no §2.4 item 5. O mapa de rios é a saída segura porque é geografia, não cultura.

**Quando entrar:** as portas do glossário já funcionam sem imagem nenhuma — o layout não
depende disto. É ganho visual, não requisito.

## Depois

- [ ] **Dar peso ao verbo.** Hoje ignorar o que passa não custa nada. O verbo mudou de nome,
      não de consequência — e essa é a diferença entre trocar rótulo e trocar jogo.
- [ ] **Som.** Não existe nenhum. Maior retorno por esforço da lista, e dá para sintetizar
      com WebAudio sem quebrar arquivo único nem zero-rede.
- [ ] **Conteúdo das pontes.** A tela existe e `TEXTOS` está vazio de propósito. Cada frase
      precisa de fonte no NOTES.md. **Não inventar** — é §2.
- [ ] **Emenda entre as peças de cenário.** A base da peça de cima e o topo da de baixo
      precisam ser do mesmo material e cor. Palmares já acerta por acidente; o litoral não.

## Hipóteses a medir

- **A porcentagem por época dá ritmo melhor que o número absoluto?** Medir tempo até a
  primeira virada de época e ver se a pessoa chega lá.
- **A terceira camada resolveu a leitura de profundidade** ou só adicionou ruído? Comparar
  print antes/depois com alguém que não acompanhou.
- **Duas cenas por capítulo bastam** para a paisagem não denunciar repetição, ou precisa de
  três? Medir em quantos segundos a segunda cena reaparece.

## Travas permanentes

- Representação histórica **não se decide sozinho** — é a única coisa do repositório em que
  decidir por conta é a escolha errada. 15 dúvidas abertas no `PROMPTS.md`.
- Nenhum número inventado passando por fato. `TEXTOS` é varrido pelo smoke test contra dígitos.
- `main` é produção. Todo push publica.

## Integrar a migração TypeScript + Capacitor

Feita e verde na worktree `agent-a3040c2ea3c2db2f8`, mas construída sobre `227725d` — **sete
commits atrás** do que está na `main`. Ela corta o `index.html` em `src/jogo.ts` +
`src/estilo.css` + molde, então os sete precisam ser **portados à mão** para os arquivos
novos. É minucioso, não difícil, e merece contexto fresco.

**Os sete a portar**, do mais novo para o mais antigo:

| commit | o quê |
|---|---|
| `87aa465` | tela de escolha de era; menu abre sempre |
| `508e1e5` | retrato atrás da caixa, só o busto |
| `57b4ed7` | `RETRATO_B64` por capítulo, à esquerda |
| `4b24193` | retrato grande, texto como legenda |
| `3dbcb3a` | história em destaque; mundo vive sem contar |
| `2a429cf` | história pausa o ganho; campo de resposta na mesa |
| `ae1097b` | quinto golpe não pula |

**O que a migração entrega, verificado pelo agente:**
- build recusa escrever se o `tsc` falhar, se aparecer `src=`/`href=` que não seja `data:`,
  ou se houver mais de um `<script>`/`<style>` — a garantia de arquivo único virou automática
- `npm test` = build + smoke; `npm start` = build + servidor
- **A CSP não abriu.** A ponte do Capacitor é injetada como `<script>` inline, que a política
  já permitia, e usa `@JavascriptInterface`, não `fetch`
- comportamento provado por **fluxo de tokens**, não por diff: 26.930 → 26.948, sete
  diferenças, todas deliberadas
- todas as constantes medidas conferidas no arquivo construído

**Duas honestidades do agente que valem mais que o resto:**

1. **Dos quatro bugs que eu disse que o TypeScript pegaria, ele pega três.** `FRENTE_SPR[-2]`
   **não** seria pego — índice negativo é JS legal e TS legal. Só `noUncheckedIndexedAccess`
   alcançaria, e custa 119 erros. Eu tinha exagerado o argumento de venda.
2. **Nada rodou em Android de verdade** — não há JDK nem Android SDK nesta máquina. O APK foi
   gerado, não executado.

**Dívida que a fase deixa:** `noImplicitAny` desligado, 385 parâmetros sem tipo. É onde mora o
próximo defeito invisível.
