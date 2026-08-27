# Experimento — O MUNDO 3D (São Paulo, linha do tempo que se caminha)

Experimento standalone do plano em `../../SPEC-MUNDO-3D.md`. NÃO é produção, NÃO está no build.
Fora da zona do dono (§5.1): quando/como funde com `territorio/` é decisão dele.

## Como rodar (NUNCA por file:// — módulos ES não carregam de arquivo local; foi o que travou o dono)
Sirva por http, de dentro desta pasta:
    npx http-server -p 8765   # ou qualquer servidor estático
Abra http://localhost:8765/sp-timeline.html

## Arquivos
- `sp-timeline.html` — a base ATUAL (M0.5): formato de SP (contorno IBGE) + personagem visível
  que anda (3ª pessoa) + linha do tempo por DÉCADA + cidades que aparecem no ano de fundação.
- `sp-contorno-ibge.json` — contorno do estado (IBGE malhas, código 35, qualidade intermediária).
- `v0-brasil-eras.html` — o M0 aposentado (Brasil genérico, 4 eras). Só registro.

## Dados a firmar (§ dado com fonte)
Os anos de fundação das cidades em `sp-timeline.html` são de registro municipal e precisam ser
conferidos contra fonte citável (IBGE Cidades) — alguns têm data de povoamento ≠ data de município.
Três (three.js) é via CDN só no experimento; produção exige self-hosted + CSP (M5 do spec).
