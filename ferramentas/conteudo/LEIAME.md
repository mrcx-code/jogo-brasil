# `ferramentas/conteudo/` — o conteúdo do banco, versionado

**Estes três JSON são SAÍDA. Não os edite à mão.** Quem os escreve é
`node ferramentas/conteudo-puxar.js` (`npm run conteudo:puxar`), lendo o Supabase por REST
anônimo com a chave publicável. Editar aqui é escrever numa cópia: o próximo puxão apaga, e
até lá o repositório afirma uma coisa e o banco outra — que é exatamente o modo de falha que
a Avenida A existe para fechar.

| arquivo | o que é | linhas em 22/08 |
|---|---|---:|
| `conteudo_glossario_grupo.json` | os grupos do glossário | 17 |
| `conteudo_glossario.json` | os verbetes | 181 |
| `conteudo_glossario_rel.json` | os pares "veja também", com a ordem CURADA | 644 |
| `DIVERGENCIA.md` | o relatório da última conferência | — |
| `VIGIA.md` | o roteiro do plantão para a validade (`vence_em`/`vence_regra`) | — |

## As três engrenagens

```bash
npm run conteudo:puxar      # rede, à mão: banco -> arquivos. NUNCA dentro do build.
npm run conteudo:conferir   # offline: arquivos x glossário embutido no jogo. exit 0 = iguais.
npm run conteudo:vigia      # offline: o que vence, e quando. exit 1 se algo já venceu.
```

As duas primeiras respondem *"as duas cópias dizem a mesma coisa?"*. A terceira responde a outra
pergunta, a do alvo ano a ano: *"quando isto vence?"* — e ela é a única que olha para o PRAZO do
que o acervo afirma. O roteiro inteiro (o que fazer com cada categoria, e de quem é cada passo)
está em `VIGIA.md`; o teste dela é `node test/conteudo-vigia-teste.js`.

E dois modos que resolvem perguntas diferentes:

```bash
node ferramentas/conteudo-puxar.js --conferir     # o disco ainda é o que o banco diz? (não escreve)
node ferramentas/conteudo-conferir.js --autoteste # prova que o conferidor reprova (lição 2.8)
node ferramentas/conteudo-conferir.js --relatorio ferramentas/conteudo/DIVERGENCIA.md
```

`conteudo:conferir` lê o `index.html` da RAIZ, que é **saída de build**. Mexeu em `src/`?
`npm run build` antes, ou você compara o banco com o jogo de ontem.

## Três decisões que parecem detalhe e não são

1. **Nenhum carimbo de tempo dentro dos arquivos.** Rodar o puxão duas vezes com o banco parado
   deixa `git status` limpo. Um campo `puxado_em` mudaria a cada execução e o diff deixaria de
   significar "o texto histórico mudou" — que é a única coisa que se quer ler aqui.
2. **A ordem do arquivo é a chave natural** (`chave`, ou `termo`+`relacionado`), não o campo
   `ordem`. Assim, reordenar o glossário aparece como um campo que mudou, e não como cem linhas
   que andaram.
3. **`id` fica de fora.** O próprio `conteudo-esquema.sql` diz que o uuid não é a identidade do
   conteúdo — ele é sorteado e muda a cada revisão. Dentro do arquivo, seria ruído puro.

## O que ainda NÃO é

O jogo **não** lê estes arquivos. Nesta fase o conteúdo continua morando em `src/jogo.ts` e o
`index.html` continua autocontido, sem buscar conteúdo em runtime — a CSP dele está intocada.
Fazer os geradores lerem daqui é fase seguinte, e é outra decisão.
