# BACKLOG — a fila do jogo

Ordenada por valor, não por facilidade. Quem trabalha aqui pega o primeiro item não feito.
Regra de corte: **o que aumenta a chance de alguém voltar amanhã vale mais que efeito visual.**

## Agora

- [ ] **Trocar a personagem pelas sprites novas.** BLOQUEANTE e já pago em arte. A pessoa nova
      tem proporção altura/cabeça 4,2 contra 2,0 da atual, e `PASSO_PX` foi *medido* na arte
      velha. Embutir sem **remedir a passada** faz o pé deslizar — armadilha nº 1 do §7.
- [ ] **Embutir os 4 ícones** já convertidos em `assets/objetos/`. Os do HUD ainda são do
      jogo anterior.
- [ ] **Objetos de cap.2 e cap.3.** Hoje só o capítulo 1 tem os três.

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
