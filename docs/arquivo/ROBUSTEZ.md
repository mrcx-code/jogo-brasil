# ROBUSTEZ — a lente que nunca tinha sido usada

A pergunta do critério do dono, literal: *"save corrompido, aba em segundo plano por
horas, tela pequena, relógio do sistema mudado — o jogo aguenta?"*

Instrumento: `test/robusto-tudo.js` (roda com `node test/robusto-tudo.js`, contra o
`index.html` da raiz, como o smoke). Seis cenários, cada um com número medido.
Medição feita em 2026-08-09, sobre os bytes que estavam no disco — que incluem
trabalho em andamento de outra sessão (`src/` e `index.html` estavam modificados e
não commitados no momento da medição).

**Resultado: 5 de 6 aguentam. Um quebra de verdade — duas abas perdem progresso.**
Nenhum erro de console em cenário nenhum. Ordenado por quanto machuca alguém:

---

## 1. QUEBROU — duas abas abertas perdem progresso (cenário 6)

**O que foi medido:** aba A salva com 1000 de energia. Aba B abre (herda os 1000),
joga até **1500**, salva e **fecha salvando de novo — o disco tem 1500**. A aba A,
ainda viva com a memória velha, dispara o autosave de 10 s: o disco volta para 1000.
A próxima sessão abre com **1004** — **perda medida: 496 de energia**. A retenção
perde igual: os **300 s** de sessão gravados por B viraram **45 s**.

**Por quê:** última a escrever vence. Nenhuma aba escuta o evento `storage`, nenhuma
compara o `salvoEm` do disco com o seu antes de gravar. A aba A nem ficou sabendo que
B existiu (memória de A seguiu em 1000 depois de B salvar 1500).

**Quanto machuca:** é a única perda real e silenciosa de progresso encontrada. No
celular (o alvo) é raro ter duas abas; no desktop é um clique no meio do caminho — e
quando o Supabase chegar com save sincronizado, este mesmo padrão vira conflito de
dados entre aparelhos.

**Conserto de uma frase:** em `salvar()` (`src/jogo.ts:1541`), ler o `salvoEm` que já
está no disco e desistir da gravação se ele for mais novo que o que esta aba carregou
(ou escutar `storage` e adotar o estado mais novo) — o autosave que dispara a perda é
o `setInterval(salvar, 10000)` de `src/jogo.ts:8506`.

---

## 2. AGUENTOU COM RESSALVA — o clamp do esquema contradiz a promessa do comentário

Dois achados do mesmo defeito de raiz, ambos sem dano visível hoje:

**2a. `cuidado: -1` vira 0, o mundo abre SECO (cenário 4).** O comentário do esquema
(`src/jogo.ts:1910`) promete: *"um save adulterado com -9 [...] cai no mundo INTEIRO,
nunca no seco"*. Mas `valida()` (`src/jogo.ts:2040`) **apara** número finito para a
faixa em vez de derrubá-lo no padrão: -1 é finito, apara para `min: 0`, e 0 é o mundo
seco — exatamente o lado para o qual o comentário diz que não se erra. Medido:
`S.cuidado === 0` após carregar o save com -1.

**2b. `salvoEm: 5e12` é aparado para 4e12 (ano 2096), não derrubado para 0 (cenário 2b).**
O dt sai **-2.213.684.969 s** (~-70 anos negativos). Hoje é inofensivo: painel de
retorno não abre (só abre com dt > 60), não há produção offline, energia intacta
(500/1000), `ganhoClique` são. Mas é um dt negativo gigante circulando por
`voltouDepoisDe`, e qualquer código futuro que consumir esse número sem esperar
negativo herda a bomba.

**Conserto de uma frase:** em `valida()` (`src/jogo.ts:2040`), valor finito **fora da
faixa** devolve `regra.pad` em vez de aparar (ou, se o clamp é a intenção, corrigir o
comentário de `cuidado` — mas para `cuidado` o pad é o comportamento certo pelo
próprio argumento do comentário); e em `carregar()` (`src/jogo.ts:2131`) envolver o
dt num `Math.max(0, …)` para o negativo nunca sair dali.

---

## 3. PASSOU — relógio andando para TRÁS (cenário 1)

Save com `salvoEm` 6 h no futuro + retenção com `ultimo` = amanhã (o telefone
corrigiu a hora para trás).

- `voltouDepoisDe` = **-21.598 s** (negativo, como previsto) → painel de retorno
  **não abre** (a guarda `dt <= 60` segura o caso sem querer, mas segura).
- Ganho offline: **zero** — não existe produção offline nesta economia, energia ficou
  exata em 500/1000. Nada explode, nada fica negativo.
- Retenção: `R.dias` ficou em **3** (não contou dia a mais), `R.ultimo` **não** foi
  regravado para trás (`marcarDia()` recusa dia < último — `src/jogo.ts`, bloco
  "robustez de relógio"), `diaNovo` ficou falso, bônus ×1,04 são.

## 4. PASSOU — relógio pulando TRÊS ANOS para a frente (cenário 2)

Save de 2023, retenção com último dia em 2023-06-02.

- O teto segurou **exato**: `voltouDepoisDe` = **43.200 s** = `capOfflineHoras` (12 h).
- Painel abre dizendo **"Você ficou fora por 12h00."** — nenhum número inventado.
- `R.dias` somou **um** dia (2 → 3), não mil e poucos; `R.primeiro` preservado
  (2023-06-01), `R.ultimo` virou hoje, `diaNovo` acendeu, chamada dobrada armada.

## 5. PASSOU — aba em segundo plano por horas (cenário 3)

Vão de quadro de 3.000 ms fabricado (thread travada; é o mesmo dt gigante que o rAF
entrega ao voltar de segundo plano).

- O primeiro quadro depois do vão moveu o mundo **1,91 px** — abaixo do teto do clamp
  (`dt ≤ 0,25 s` → 9,57 px). Sem o clamp seriam **115 px** de teleporte.
- Energia saltou **0**; o relógio do dia andou **0,05 s**, não 3 s.
- Esconder a aba (`visibilitychange` + `document.hidden`) gravou o save em **51 ms**
  — o progresso não depende do Android deixar a aba viva.

## 6. PASSOU — save podre campo a campo (cenário 4)

**20 campos** do `ESQUEMA_SAVE` × **10 venenos** cada (`null`, string, array, objeto,
`-1`, `1e999`→Infinity via parse, `-1e999`, `true`, `"123"`, `1e300`) + **8 saves
inteiros podres** (vazio, `null`, `[]`, `42`, string, JSON quebrado, JSON truncado ao
meio, `{}`) = **208 casos**. Em todos: todo campo saiu do carregamento com o tipo e a
faixa que o esquema declara, `ganhoClique()` e `velocidadeMundo()` finitos e
positivos, `desenhar()` sem lançar, `energiaTotal ≥ energia`, e save ilegível não
mexeu no estado. **Anomalias: 0** (a ressalva do `cuidado: -1` está no item 2 — o
valor é legal pelo esquema, o problema é a promessa do comentário).

## 7. PASSOU — localStorage cheio ou proibido (cenário 5)

`Storage.prototype.setItem` substituído por um lançador de `QuotaExceededError`
(modo privado / disco cheio): `salvar()`, `salvarRetencao()` e `marcarDia()` foram
exercitados (**3 lançamentos engolidos**), nenhuma exceção vazou, nenhum erro de
console, e o jogo continuou jogável — 10 toques renderam **10,2** de energia durante
a proibição. `getItem` lançando (`SecurityError`): `carregar()` e
`carregarRetencao()` também engolem e o jogo abre são. Os seis pontos de contato com
`localStorage` no `src/jogo.ts` estão todos dentro de `try/catch`.

---

## O que este relatório NÃO conserta

Por decisão do ticket: o defeito do item 1 e as ressalvas do item 2 ficam
**registrados, não corrigidos** — a implementação é de outra pessoa e `src/` é
território dela. O instrumento `test/robusto-tudo.js` sai vermelho (exit 1) enquanto
o item 1 existir, e é essa a função dele.
