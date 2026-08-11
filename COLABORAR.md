# COMO CONTRIBUIR COM O BRASIL

Este repositório tem várias pessoas e vários agentes escrevendo ao mesmo tempo, e o
`src/jogo.ts` tem 8 mil linhas. **Quase todo problema de convivência aqui vem de uma coisa só:
alguém escreveu um arquivo inteiro por cima em vez de acrescentar a ele.** O git aceita isso
sem reclamar — o commit é recente, a base é a certa, e mesmo assim o conteúdo é antigo.

As cinco regras abaixo evitam praticamente todos os conflitos.

---

## 1. `git pull --rebase` antes de abrir o PR — e de novo antes de pedir revisão

O `main` costuma andar várias vezes por dia. Um PR de dois dias atrás pode apagar trabalho sem
nenhum conflito aparecer, porque quem escreveu partiu de uma cópia antiga do arquivo.

**Como conferir que você não está apagando nada**, antes de abrir o PR:

```bash
git fetch origin && git log --oneline origin/main...HEAD
```

Se aparecerem commits do `origin/main` que você não tem, rebaseie **antes** de continuar.

---

## 2. Um assunto por PR, e diga quais arquivos ele toca

Escreva no PR: *"toca `src/jogo.ts` (um bloco novo no fim), `src/estilo.css` (um bloco novo) e
`ferramentas/necessario.json`"*. Se o diff mostrar mais que isso, alguma coisa foi reescrita
sem querer — e é mais fácil ver isso antes de abrir do que depois.

**Acrescente blocos, não reescreva funções vizinhas.** Se precisar mexer numa função que já
existe, mexa só nela e diga por quê no PR.

---

## 3. Três arquivos só se ACRESCENTAM, nunca se reescrevem

`NOTES.md` · `CLAUDE.md` · `PENDENTES.md`

São a memória compartilhada: o diário do que foi tentado, as regras do projeto e a lista do que
está pela metade. Uma sessão futura lê isso para não repetir um erro que já custou um dia.

**Escreva no fim.** Se precisar corrigir algo que está lá, corrija aquela linha — nunca o
arquivo inteiro.

---

## 4. `index.html` da raiz é SAÍDA, não fonte

A fonte é `src/index.html` (molde), `src/estilo.css` e `src/jogo.ts`. O `npm run build` gera o
`index.html` da raiz. **Editar o `index.html` direto é trabalho que o próximo build apaga.**

O mesmo vale para `dist/` e os `pack-*.json`.

> **Sobre o diff gigante do `index.html`:** o `tsconfig.json` usa `newLine: crlf`, e em
> máquinas diferentes isso faz o arquivo inteiro parecer reescrito. Não é você. Se incomodar,
> proponha um `.gitattributes` num PR separado — não junte com outra coisa.

---

## 5. O ciclo, e ele não tem exceção

```bash
npm test
```

É `npm run build` + o smoke test. **Tem que passar.** Ele roda headless a 390×844 e falha se
houver erro de console, se um upgrade não aplicar, se um save adulterado envenenar o estado.

Rode também, quando mexer em jogo ou em tela:

```bash
node test/encaixe.js
```

São as asserções sobre o que desencaixa **em silêncio** — texto e imagem desalinhados, uma
promessa de privacidade que a CSP desmente, um capítulo que perde a pintura.

E **olhe os prints**. O teste garante que não quebrou; ele não garante que ficou bom.

---

## O §2 vale para qualquer pessoa que escreva aqui

Está no `CLAUDE.md` e é a única parte do projeto em que decidir sozinho é a escolha errada.
O resumo mais curto possível:

- **Nenhum número ou afirmação histórica sem fonte**, e a fonte entra no `NOTES.md` no mesmo
  commit. Sem fonte, não é história — é ficção, e então não se apresenta como história.
- **Nenhuma pessoa real como inimigo.** Adversários são forças e sistemas.
- **Povos originários não são "o começo" nem "o primitivo"**, e nomeiam-se povos específicos.
- **A escravidão não é fase de jogo.** Se houver mecânica, é do lado de quem resistia.
- **Use *invasão*, *chegada* ou *contato*** — nunca *descobrimento*.
- **Na dúvida sobre representação, pare e pergunte ao dono.**

---

## Quando algo der errado

Se o seu PR conflitar feio, **não force**. Diga no PR o que aconteceu — reconciliar junto custa
menos que desfazer depois. E se você reverter algo pela metade, escreva no `PENDENTES.md` no
mesmo commit: código morto não entra na `main`, mas reverter sem registrar perde o trabalho
duas vezes, porque some o código **e** o diagnóstico que custou a sessão.
