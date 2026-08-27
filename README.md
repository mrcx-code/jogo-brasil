# BRASIL

Um jogo de ação lateral em **pixel art sobre a história do Brasil** — que está virando uma
**plataforma de conhecimento**. A pessoa atravessa o tempo: começa com os **povos originários**
(quem já vivia aqui, antes de qualquer chegada) e avança pela invasão europeia, pela escravidão e
pela resistência, até o presente.

Produção: **<https://matheusferreira.cc>** · repositório: `mrcx-code/jogo-brasil` · deploy: push na
`main` publica sozinho (Vercel).

> **Este README é o "comece por aqui" para quem chega frio.** O projeto tem muita documentação
> (abaixo), boa parte escrita para uma equipe de agentes de IA. Você não precisa dela para começar.

---

## ⚠️ A regra que vem antes de qualquer código — leia isto

Este jogo trata de **colonização, povos originários e escravidão** — história de gente real, boa
parte ferida aberta. O `CLAUDE.md` §2 é a lei completa; o essencial:

1. **Povos originários não são "o começo" nem "o primitivo".** Estavam aqui, com línguas,
   agricultura, arquitetura e astronomia, e **continuam aqui**. Nomeie povos específicos
   (Tupinambá, Guarani, Kayapó, Yanomami…), nunca "índio" como categoria única.
2. **A escravidão não é fase de jogo.** O protagonismo é de quem resistiu: quilombos, fugas,
   revoltas, Palmares. Nunca de quem escravizou.
3. **Não houve "descobrimento".** Use *invasão*, *chegada*, *contato*.
4. **Nenhum número sem fonte.** Se o jogo afirma história, a fonte entra no `NOTES.md` no mesmo
   commit. Sem fonte, é ficção — e não se apresenta como história.
5. **Na dúvida sobre representação, PARE e pergunte ao dono.** É o único assunto do repositório em
   que decidir sozinho é a escolha errada.

Grafismo indígena **não é ornamento**: cada padrão pertence a um povo, tem nome e dono. Nunca
invente "algo que parece indígena".

---

## Como rodar

Precisa de **Node.js**. Não há framework em runtime; o jogo é **um arquivo** (`index.html`).

```bash
npm install
npm test     # build + testes (smoke + régua). TEM que passar.
npm start    # build + servidor local em http://localhost:8199
```

- **Nunca abra o jogo por `file://`** para testar a plataforma/pacotes — sirva por http.
- **Nunca edite `index.html` nem `pack-*.json` na raiz**: são SAÍDA do build; o próximo build apaga.
  A fonte é `src/index.html`, `src/estilo.css`, `src/jogo.ts`. `npm run build` compila e reembute
  tudo num `index.html` autocontido.
- Android (opcional, precisa de JDK+Android SDK): `npm run app` / `npm run app:abrir`.

## Onde está cada coisa

| Pasta / arquivo | O que é |
|---|---|
| `src/` | A fonte do jogo: `jogo.ts` (o motor, ~15 mil linhas), `estilo.css`, `index.html` (molde) |
| `index.html`, `pack-*.json`, `dist/` | **Saída do build** — não editar à mão |
| `ferramentas/` | Build (`construir.js`), servidor (`servir.js`), geradores de seção (`gerar-*.js`), o funil de integração (`integrar.js`), ferramentas de dados (`conteudo-*.js`) |
| `plataforma/`, `historia/`, `glossario/`, `de-onde-vem/`, `territorio/` | As seções públicas da plataforma (GERADAS pelos `gerar-*.js` — mude o gerador, nunca a saída) |
| `dashboard/` | Painel interno da equipe (não é público) |
| `test/` | Testes (`smoke.js`, `regua-larga.js`, `encaixe.js`) e a esteira de sprites |
| `experimentos/mundo-3d/` | **Experimento** de um mundo 3D (ver abaixo) — não é produção, não está no build |

## Os documentos, e o que cada um é

- **`CLAUDE.md`** — a lei do projeto (§2 representação, §3 técnica). Leia antes de tocar em conteúdo.
- **`RETOMADA.md`** — o estado mais recente e o que estava em andamento. **Comece por ele.**
- **`NOTES.md`** — o diário e as **fontes** de tudo o que o jogo afirma, por capítulo.
- **`PENDENTES.md`** — o que foi revertido ou ficou pela metade.
- **`MIGRACAO.md`** — a migração do backend (ver "Estado atual").
- **`SPEC-MUNDO-3D.md`** — o plano do mundo 3D, por marcos incrementais.
- Docs da equipe de agentes (`EQUIPE.md`, `AGENTES.md`, `PLANTAO.md`, `DIRECAO.md`): o processo de
  trabalho com IA. Úteis, mas não obrigatórios para contribuir.

## Estado atual (agosto/2026 — contribuição pausada aqui)

- **O jogo e as seções públicas estão no ar e funcionando** em matheusferreira.cc.
- **Backend (Supabase):** há uma migração **preparada mas NÃO concluída** para um projeto próprio
  (`brasil`). **Produção ainda usa o projeto antigo (`patinhas`)** e funciona normal. Concluir o
  cutover depende de 3 ações do dono (auth/UUID, apagar uma função, repontar) — detalhes no
  `MIGRACAO.md`. **Não assuma que `brasil` está em produção.**
- **Mundo 3D:** um experimento (São Paulo em 3D, com relevo e linha do tempo por década que se
  caminha) vive em `experimentos/mundo-3d/`. É protótipo, roda **só por http**, usa `three` via CDN.
  Rumo e marcos no `SPEC-MUNDO-3D.md`. A seção `territorio/` (o mapa 3D atual) é zona do dono.

## Regra de segurança que não muda

**Nenhum segredo no cliente, nunca.** A única chave que roda no navegador é publicável por
construção (a `phc_` do PostHog; e, quando a migração fechar, a `anon` do Supabase). O build
**recusa** compilar se achar uma chave de serviço. `service_role` fica no servidor e só lá.
