# BACKLOG — a fila do jogo

Ordenada por valor, não por facilidade. Quem trabalha aqui pega o primeiro item não feito.
Regra de corte: **o que aumenta a chance de alguém voltar amanhã vale mais que efeito visual.**

## Agora

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
