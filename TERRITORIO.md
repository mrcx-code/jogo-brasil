# TERRITÓRIO — quem mexe em quê, para duas máquinas não brigarem

Escrito em 2026-08-17, quando o dono passou a trabalhar na tela **ONDE FOI** em outra máquina.
Vale para mim, para os agentes, e para qualquer sessão futura. **Leia antes de editar.**

## 🚫 ZONA DO DONO — não tocar

A tela **ONDE FOI** (o mapa) é dele. Em `src/jogo.ts`:

- o bloco entre `// O MAPA — "ONDE FOI"` e o fim de `mapaToque()`
  (`MAPA_N` · `MAPA_S` · `MAPA_O` · `MAPA_L` · `mapaXY` · `MAPA_CONTORNO` · `MAPA_LUGARES` ·
  `Lugar` · `Ponto` · `MAPA_PONTOS` · `MAPA_CENSO` · `MAPA_CENSO_FONTE` · `mapaSel` ·
  `mapaVisitado` · `mapaCaixa` · `desenharMapa` · `montarMapa` · `mapaToque`)
- `desenharMapaEras()` — o país desenhado na tela de eras
- as ligações de `btnMapa`, `btnVoltarMapa`, `mapaCv` e o `resize` do mapa

Em `src/index.html`: o bloco `<div class="tela" id="telaMapa">` e o `<canvas id="erasMapa">`.
Em `src/estilo.css`: `#telaMapa` · `#mapaCv` · `#mapaFicha` · `#mapaRodape` · `.mp*` · `#erasMapa`.

**Se um trabalho meu precisar mexer aí, eu paro e aviso** — não edito e não peço perdão depois.

## ✅ ZONA LIVRE — minha e dos agentes

Todo o resto: motor, verbos, capítulos, arte, pacotes, testes, ferramentas, documentos.

## Por que contrato e não arquivo separado

O `tsconfig.json` inclui **um** arquivo (`src/jogo.ts`) e o `ferramentas/construir.js` monta a
partir dele. Extrair o mapa para `src/mapa.ts` é a fronteira forte — o git deixaria de ter
motivo para conflitar — mas mexe em tsconfig e no montador, que é exatamente o tipo de mudança
estrutural que cria conflito **enquanto alguém já está trabalhando**. Fica como oferta: no dia
em que a tela dele estiver num ponto de parada, a extração é meia hora e resolve de vez.

## O ritual, quando as duas máquinas voltarem a se encontrar

```bash
git pull --rebase
```

Conflito em `src/jogo.ts` que caia **dentro da zona do dono**: a versão dele vence, sempre.
Fora dela: a minha. Se cair na fronteira, ninguém resolve sozinho — a gente conversa.
