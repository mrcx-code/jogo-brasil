# CLAUDE.md — instruções permanentes deste repositório

Leia este arquivo e o `NOTES.md` antes de tocar em qualquer coisa.

## 1. O que é isto

Um jogo de ação lateral em pixel art **sobre a história do Brasil**. A ideia: a pessoa
atravessa o tempo. Começa com os **povos originários** — quem já vivia aqui, antes de
qualquer chegada — e avança pela invasão europeia, pelo período da escravidão, e por
outros momentos históricos, conforme progride.

O motor vem de um projeto anterior (um jogo de ação de rua, um arquivo só) e está inteiro
aqui: personagem com ciclos de caminhada, corrida e salto; inimigos que atravessam a tela;
drops; upgrades; cenários pintados que trocam por progressão. **O motor é ponto de partida,
não destino.** Nada dele é sagrado — o tema é que manda.

O jogo é **um arquivo**: `index.html`. Sem build, sem framework, sem dependência em
runtime, sem rede. Abrir o arquivo no navegador é rodar o jogo.

## 2. A parte que exige mais cuidado que qualquer código

Este jogo trata de colonização, de povos originários e de escravidão. Isso não é cenário
nem tema decorativo — é a história de gente real, e boa parte dela ainda é ferida aberta.
Três regras, e elas valem mais que qualquer decisão técnica:

1. **Povos originários não são "o começo" nem "o primitivo".** Eles estavam aqui, com
   línguas, agricultura, arquitetura, astronomia e conflitos próprios, e continuam aqui.
   Se o jogo os apresentar como um estágio que a história superou, errou. Nomeie povos
   específicos (Tupinambá, Guarani, Kayapó, Yanomami…) em vez de tratar "índio" como
   categoria única — eram e são centenas de povos distintos, com línguas distintas.
2. **A escravidão não é fase de jogo.** Não transforme pessoas escravizadas em recurso,
   inimigo, obstáculo ou coisa a coletar. Se houver mecânica ali, que seja do lado de quem
   resistia: quilombos, fugas, revoltas, Palmares, a Bahia de 1835. O protagonismo é de
   quem foi escravizado, nunca de quem escravizou.
3. **O colonizador não é o herói e o "descobrimento" não existiu.** Havia gente aqui. Use
   *invasão*, *chegada* ou *contato* — nunca *descobrimento*.

Regras práticas que decorrem disso:

- **Nenhum número inventado passando por fato.** Se o jogo afirmar algo histórico, precisa
  de fonte, e a fonte entra no `NOTES.md` no mesmo commit. Sem fonte, é ficção — e então
  não se apresenta como história.
- **Nenhuma pessoa real como inimigo a ser golpeado.** Adversários são forças e sistemas,
  não indivíduos históricos.
- **Na dúvida sobre representação, pare e pergunte ao dono.** É o único assunto deste
  repositório em que decidir sozinho é a escolha errada.

## 3. Regras invioláveis (técnicas)

1. **Um arquivo só.** Nada de separar CSS/JS, nada de bundler, nada de CDN.
2. **Zero rede.** Nenhum `fetch`, nenhum recurso externo, nenhuma fonte de CDN. Toda arte é
   base64 embutido. Há uma `Content-Security-Policy` no `<head>` que faz o navegador cobrar
   isso — se você adicionar algo de fora, o navegador bloqueia. Não relaxe a CSP para
   contornar; o bloqueio é o ponto.
3. **O save é entrada não confiável.** `localStorage` é editável à mão. O carregamento passa
   por `ESQUEMA_SAVE`: lista fixa de campos, cada um com tipo e faixa. **Ao adicionar estado
   persistente, adicione ao esquema** — se não estiver lá, não é lido nem gravado. O smoke
   test alimenta um save adulterado e falha se algo vazar.
4. **Mobile primeiro.** Sem zoom, sem seleção de texto.
5. **`main` é produção**, assim que houver deploy. Nunca deixe a `main` quebrada.

## 4. O motor, como ele está hoje

**Entrada.** Metade esquerda da tela pula, metade direita golpeia. O botão dourado também
golpeia e repete se segurar. O pulo acerta um golpe na subida.

**Combate.** Alcance de 80 px; a quinta batida do combo alcança 96, causa dano dobrado e é
quando ela salta. Inimigos atravessam a tela e **passam reto** — ignorar é escolha válida.
Chegam em intervalos sorteados, para a rua não cair num ritmo contável.

**Economia.** Impacto vem de golpe, de drop (recolhido ao passar por cima) e de folha pega
no ar pulando. Três upgrades — `u1` ×3 por golpe (150), `u2` ×2 no que pega (900), `u3`
ajuda automática (4.000) — mais `u4`, um interruptor de teste **grátis** que multiplica o
toque por 100. Sete cenários, cada um custando 3.000 de impacto acumulado.

**Movimento — o que faz o pé não deslizar.** O quadro do sprite é escolhido pela
**distância percorrida**, não pelo tempo. É a única razão de a passada casar com o chão em
qualquer velocidade. `PASSO_PX` (caminhada) e `PASSO_CORRIDA` são medidos da arte. As
velocidades são `PASSO × 60 / n` com `n` inteiro, para que um quadro de sprite dure um
número inteiro de quadros de tela — senão a cadência manca.

**Camadas.** `#fundoHD` (pintura, resolução do dispositivo) → `#scene` (mundo, baixa
resolução, pixelado) → `#heroHD` (personagem, resolução do dispositivo). A personagem tem
canvas próprio porque, desenhada dentro do `#scene`, a arte de 184 px era esmagada para 44
e reampliada — seis vezes o tamanho guardado. **Não a mova de volta.**

**Cenário.** Uma pintura por vez, replicada contra si mesma com cópias alternadas
**espelhadas** — é o espelho que elimina a emenda, porque uma borda só encontra o próprio
reflexo. Rola **1:1 com o mundo**: não use paralaxe, porque o chão faz parte da pintura e
qualquer fração diferente de 1 faz a personagem levitar.

## 5. Pipeline de sprites

Arte chega de fora como folha horizontal em fundo **magenta `#FF00FF`**. O `test/LEIAME.md`
explica o processo inteiro e o porquê de cada decisão. O que não é óbvio:

- Corte em **células iguais**, não por colunas vazias — um objeto na mão atravessa a linha
  da célula e cola um quadro no outro.
- Preencha a mancha no sheet inteiro, semeando pela coluna com mais tinta *dentro* da
  célula: o corpo, nunca a ponta de um objeto.
- **Registre pela cabeça.** Ancorar pelo pé mais baixo faz a personagem avançar e recuar,
  porque numa passada o pé mais baixo alterna entre o da frente e o de trás.
- **Desfranje.** Os pixels de contorno são mistura com o magenta; um teste binário os deixa
  passar opacos e pinta um aro rosa. Meça `min(R,B) − G`, use como alfa e desmisture a cor.
- Compare escala entre folhas pela **largura da cabeça**, não pela altura: uma pose esticada
  é legitimamente mais alta.

## 6. Como trabalhar

```bash
node test/smoke.js     # tem que passar
git add -A && git commit -m "..." && git push
```

O smoke test roda headless a 390×844 e falha com erro de console, se o segurar-pra-atacar
parar de repetir, se um upgrade não aplicar, se a metade errada da tela responder, se um
save adulterado envenenar o estado, ou se os inimigos pararem de andar. Salva prints
`shot-*.png`. **Sempre olhe os prints** — o teste garante que não quebrou, não que ficou bom.

Ao mudar visual, tire print antes e depois e compare de verdade. Ao mudar mecânica ou
conteúdo histórico, atualize o `NOTES.md` no mesmo commit.

## 7. Armadilhas já pagas no motor

Cada uma custou uma sessão no projeto anterior:

- **Paralaxe no fundo.** Três quartos de cada passo viravam deslize.
- **Ancorar sprite pelo pé mais baixo.** Injeta vai-e-volta no ciclo.
- **Limpar a camada da personagem fora do desenho dela.** `drawHero()` roda numa função que
  termina *antes* de `desenharMundo()`; limpar lá apaga ela no mesmo quadro.
- **Velocidade que não dá quadro inteiro de tela por pose.** A cadência sai 2-2-3-2-2-3 e lê
  como trepidação.
- **`CFG["custoU" + n]`.** Nenhum literal `CFG.custoU1` aparece, então uma varredura de
  código morto vai oferecer para apagar. Está vivo.
- **Remover função procurando o próximo `}` na coluna 0.** Para um corpo que fecha em chave
  indentada, isso corre centenas de linhas e leva declarações vizinhas junto. Valide balanço
  de chaves, colchetes e parênteses antes de apagar.

## 8. Infraestrutura e nome

Repo: `mrcx-code/jogo-brasil`. **Ainda sem deploy** — quando houver, este arquivo diz onde.
Não há segredo, variável de ambiente nem backend, e não deve haver.

O nome `jogo-brasil` é **provisório**, um marcador escolhido pelo dono. Nome definitivo,
identidade visual e direção de arte ainda não foram decididos — **não invente nenhum dos
três sem perguntar.**

Este repositório não tem relação com o projeto de onde o motor veio. Não referencie o
outro, não puxe dele, não empurre para ele.
