# Experimento — O MUNDO 3D (São Paulo, linha do tempo que se caminha)

Experimento standalone do plano em `../../SPEC-MUNDO-3D.md`. NÃO é produção, NÃO está no build.
Fora da zona do dono (§5.1): quando/como funde com `territorio/` é decisão dele.

## Como rodar (NUNCA por file:// — módulos ES não carregam de arquivo local; foi o que travou o dono)
Sirva por http, de dentro desta pasta:
    npx http-server -p 8765   # ou qualquer servidor estático
Abra http://localhost:8765/sp-relevo.html

## Arquivos
- `sp-relevo.html` — **o arquivo ATUAL**, e é ele que carrega o passe de beleza do M3 (sombras
  suaves, sol dourado, tone mapping ACES, céu em gradiente, vinheta): relevo estilizado + mata
  que recua e cidade que cresce com o ano + personagem que anda.
- `sp-timeline.html` — a base do M0.5, anterior: o estado como forma chapada, cidades como
  pinos que aparecem no ano de fundação. Fica como registro do passo anterior.
- `sp-contorno-ibge.json` — contorno do estado (IBGE malhas, código 35, qualidade intermediária).
  **É este o nome que os dois HTML buscam.** Os dois apontavam para um `sp.json` que nunca
  existiu no repositório, e o efeito não era um erro visível: o callback inteiro estourava e a
  tela ficava PRETA com só o HUD por cima — inclusive todo o passe de beleza, que mora dentro
  dele. Consertado em 01/09. Ao renomear o dado, procure o `fetch` nos dois arquivos.
- `v0-brasil-eras.html` — o M0 aposentado (Brasil genérico, 4 eras). Só registro.

## Dados a firmar (§ dado com fonte)
Os anos de fundação das cidades em `sp-timeline.html` são de registro municipal e precisam ser
conferidos contra fonte citável (IBGE Cidades) — alguns têm data de povoamento ≠ data de município.
Três (three.js) é via CDN só no experimento; produção exige self-hosted + CSP (M5 do spec).
