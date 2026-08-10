# LANÇAMENTO — o que falta, quem faz, e o que já está pronto

Escrito em 2026-08-09, depois de o dono perguntar *"pensando no todo para ser um jogo online
lançável"*. **Foco é WEB.** Android saiu da frente da fila por decisão dele.

Este arquivo é a fonte única do que falta. Cada item diz **de quem é** e **por que ele
bloqueia** — item que não bloqueia nada mora no `PENDENTES.md`, não aqui.

---

## 🔴 BLOQUEIA — e não dá para lançar sem

| | o quê | de quem | por quê |
|---|---|---|---|
| 1 | **Abertura de 16,6 s no 3G** | eu (aprovado) | Quinze desses segundos são tela morta. Ninguém espera. A carga sob demanda leva para **8,7 s** e mantém lá nos doze capítulos, contra **38,5 s** do caminho atual. Medido em jogo vivo. |
| 2 | **Domínio próprio** | **só o dono** | `jogo-brasil-mrcx.vercel.app` não é endereço de jogo. É a única coisa desta lista que custa dinheiro. Quando existir, **três URLs mudam juntas** (`og:url`, `og:image`, e a base) ou a prévia do link quebra em silêncio — o `encaixe.js` bloco 14 cobra isso. |
| 3 | **Conta do PostHog** | **só o dono** | Sem a chave pública não se mede nada, e lançar sem saber se alguém volta no dia 2 é lançar cego — sendo que o dia 2 é a razão do jogo existir. Grátis, dois minutos. |
| 4 | **Quem representa cada capítulo** | **só o dono** (§2) | Oito capítulos existem sem rosto de propósito: o primeiro print mostrava a protagonista indígena do presente anunciando JABAQUARA. Trava todos os pedidos de sprite e retrato — é o que mais enche a sala de máquinas. |
| 5 | **Ninguém de fora jogou** | **só o dono** | Zero pessoas além dele. Todo número que existe é de bot. Cinco adolescentes de verdade valem mais que dez sessões minhas. |
| 6 | **A pintura dos oito capítulos** | dono gera, eu integro | Hoje cada capítulo em obra veste a pintura do anterior — JABAQUARA sobre a ladeira de Salvador. **18 pedidos estão na mesa**, prontos para copiar. |

---

## 🟡 BLOQUEIA MAS TEM SAÍDA BARATA

| | o quê | de quem | saída |
|---|---|---|---|
| 7 | **A tela que abre não diz o que o jogo é** | eu | Quem chega por link vê um menu e não sabe o que é isso, quem fez, nem por quê. Uma linha antes do JOGAR resolve. |
| 8 | **Telefone deitado** | dono decide, eu faço | Ninguém decidiu. Hoje estica e fica errado. Travar em retrato é uma linha; compor para os dois é uma sessão. |
| 9 | **Som só depois do primeiro toque** | eu | O navegador exige gesto. Se a pessoa começar lendo a abertura, ela lê em silêncio e pode achar que o jogo não tem som. |
| 10 | **Momento morto de 180,7 s** | eu (em curso) | Três minutos sem nada novo, no começo. É onde a pessoa fecha. |

---

## 🟢 NÃO BLOQUEIA, MAS SOME SE ESQUECER

- **Licença e créditos.** O jogo afirma história e cita pesquisadoras. Falta dizer o que alguém
  pode fazer com o código e com a arte.
- **Salvar de verdade.** O progresso mora no navegador; limpou o histórico, perdeu tudo.
  Recomendação: **um código de seis letras** que a pessoa anota para recuperar em outro
  aparelho — sem e-mail, sem senha, sem cadastro. Conta é atrito.
- **Erro visível.** Se quebrar no telefone de outra pessoa, ninguém fica sabendo.
- **A régua de luz de SALVADOR.** Ela é ~90 pontos mais quente que as seis irmãs — um
  entardecer pintado na tinta, enquanto o motor tinge as outras por cima. Depende de arte nova,
  e o pedido já leva a régua.

---

## O QUE EU NÃO FARIA AGORA

Android · som novo · conquistas · ranking · tradução · os capítulos 5 a 12 escritos.
**Nada disso muda a pergunta de três dias.** É v2.

---

## O QUE JÁ ESTÁ PRONTO — e vale saber que está

- **O jogo termina.** A CHEGADA diz o que você leu, o que deixou passar, e abre para dentro.
  Não é troféu: o teste cobra por regex que não haja pontuação nenhuma ali.
- **A travessia tem duração própria** — ~103 s sem encostar na tela.
- **O primeiro minuto ensina o gesto.** "SEGURE PARA ALCANÇAR" no terceiro toque solto: sem
  isso, cem toques em cinco minutos rendiam **zero alcances em 132 vultos**.
- **SALVADOR joga diferente**: um toque abre conversa, e conversa só anda andando (+120% ao
  alternar o ritmo). Pagou uma dívida de §2 que estava no ar.
- **O jogo aguenta maltrato**: relógio para trás, aba em segundo plano, 208 casos de save
  podre, `localStorage` proibido, e duas abas que antes perdiam 496 de energia.
- **Doze capítulos existem**, oito honestamente em obra, sem uma afirmação sem fonte.
- **O link tem prévia** — título, descrição e imagem de 166 KB.
- **A sala de máquinas tem 18 pedidos** com prompt pronto para copiar.
- **`npm test` verde · `encaixe.js` 16 blocos · `robusto-tudo.js` 6 de 6 · FPS 61.**

---

## A SEQUÊNCIA QUE EU FARIA

1. Carga sob demanda — **em curso**
2. PostHog só para medir, com a tela de privacidade reescrita no mesmo commit
3. Cinco pessoas jogando na frente dele, caladas, ele anotando onde travam
4. A arte que falta, priorizada pelo que aparece nos **primeiros cinco minutos**
5. Lança. Web primeiro.
