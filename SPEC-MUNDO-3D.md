# SPEC — O MUNDO 3D: São Paulo, a linha do tempo que se caminha

Documento vivo, spec-driven. Começado em 2026-08-27 com o dono. Nasceu dele ao ver
**bruno-simon.com** e querer *"explorar algo assim para mostrar o território no passar das eras"*.

**Direção travada com o dono em 27/08 (redefine a base):**
> *"quero mudar a perspectiva, ser uma visão de linha do tempo mesmo, mas apenas do estado de São
> Paulo por enquanto, ter o formato do estado e a pessoa poder passear pelas cidades e entender a
> evolução a cada ano."* + câmera: *"no site do Bruno Simon você vê o carrinho andando, então a
> ideia é ver o personagem andando e interagindo com o ambiente também."*

## A VISÃO (uma linha)
O **formato do estado de São Paulo** como um mundo 3D. Você **vê um personagem andar** (3ª pessoa,
tipo Bruno Simon) pelas **cidades**, e uma **linha do tempo ano a ano** mostra o estado sendo
povoado e evoluindo — cada cidade aparece/cresce no ano em que existiu. "Algo do futuro, não velho."

**Por que SP primeiro:** um estado é escopo tratável (dá pra fazer bem antes de escalar), tem
formato reconhecível, e tem dado de verdade (ano de fundação dos municípios) para a linha do tempo.
Depois de SP redondo, o mesmo motor serve os outros estados.

## A PONTE COM O QUE JÁ EXISTE
- **O andarilho** — personagem pixel do jogo, ciclo de caminhada medido — é o **avatar visível**
  que anda no mundo (não se inventa personagem novo).
- **O rio do logo** e a pintura do jogo entram como material no M-arte.
- **O Território** já é 3D (three.js) — prova de viabilidade, MAS é a **zona do dono** (Guardrails).

## GUARDRAILS — o que NÃO se negocia
1. **§2 (representação é do dono).** A base é geografia + cidades + anos (mecânica). O CONTEÚDO
   histórico — o que cada cidade/ano AFIRMA — passa pelo dono (§2): São Paulo nasce sobre a aldeia
   de Piratininga, as bandeiras escravizaram indígenas, etc. Nada disso vira "fase" ou brinquedo;
   entra como texto com fonte, aprovado por ele. Sofrimento humano não é cenário. Na dúvida, PARA.
2. **§5.1 — o Território é do dono.** Nasce como **experimento standalone** (fora de `territorio/`
   e da zona dele em `src/`); a fusão é decisão dele.
3. **Performance / mobile-first.** Carregamento progressivo, LOD, teto de polígonos; medição
   antes/depois. Carrega sob demanda, não trava o primeiro toque.
4. **CSP e dependência.** Protótipo usa `three` via CDN **servido por http** (nunca `file://` — os
   módulos ES não carregam de arquivo local; foi o que travou o v0 no dono). Produção exige `three`
   self-hosted + CSP ajustada na fase própria (M5). Segredo nenhum no cliente.
5. **Dado com fonte.** Ano de fundação e coordenadas dos municípios vêm de fonte citável (IBGE);
   nada de data inventada. Fonte no NOTES/§ do dado.

## OS MARCOS (cada um: objetivo · aceite · o que o dono vê)

### M0 — vibe genérico (Brasil, orbit, 4 eras)  ✅ e ❌ APOSENTADO (27/08)
Provou que 3D explorável + eras funciona e roda. O dono redefiniu a base (SP + linha do tempo +
personagem visível), então este v0 vira só registro. Guardado em `proto/territorio-3d.html`.

### M0.5 — A BASE NOVA (é o que refazemos AGORA)
O **formato de SP** extrudado em 3D; um **personagem visível** que anda (3ª pessoa, você vê ele);
**cidades** como pontos no mapa; uma **linha do tempo (slider de ano)** que faz as cidades
aparecerem/crescerem conforme o ano de fundação. Câmera segue o personagem.
- **Aceite:** abre por http; vê-se o personagem; anda pelo estado (toque/teclado); arrastar o ano
  faz cidades aparecerem na ordem histórica; o contorno é reconhecível como SP.
- **Dono vê:** ele andando dentro de SP e o estado se povoando ano a ano.
- **Dado:** contorno de SP (GeoJSON IBGE) + municípios com ano de fundação e lat/long (fonte citada).

### M1 — o personagem com vida (caminhada + interação)
O andarilho pixel de verdade (não um boneco genérico), ciclo de caminhada, e **interação com o
ambiente** (chegar numa cidade destaca ela; talvez uma marca de "você está em X"). Física simples
de andar no relevo.
- **Aceite:** anda com naturalidade, câmera boa, chegar numa cidade dá retorno visível.

### M2 — a cidade conta a evolução (o ano importa)
Chegar numa cidade + mexer no ano mostra COMO ela mudou (cresceu de vila a cidade; população por
década — dado IBGE). Ficha com texto/fonte que já existe onde houver.
- **Aceite:** uma cidade mostra sua evolução por ano com dado citável.

### M3 — identidade "futurismo ancestral" (tirar a cara de three.js genérico)
Direção de arte (agente `arte`), calibrada pelas referências que o dono curte (kail.studio, haoqi,
depth, thewoodetfils, otsuka-air…): paleta, luz, céu, material, o pixel assumido.
- **Aceite:** veredito do `arte` + o dono aprova o look.

### M4 — conteúdo histórico por cidade/ano (com o dono, §2)
O que cada lugar/ano AFIRMA — Piratininga, as bandeiras, a imigração, o café, a industrialização —
**representação decide-se com o dono**, com fonte. Liga aos capítulos e ao glossário.

### M5 — produção: performance, CSP, virar seção
`three` self-hosted, CSP escrita no commit, LOD, mobile, medição, carregamento sob demanda. Decidir
onde mora (seção `/mundo`, ou dentro de `/territorio` — §5.1, do dono).

## PERGUNTAS ABERTAS (pro dono, quando quiser)
1. **Escala do tempo:** a linha do tempo vai de ~1532 (São Vicente) a 2026? E anda de ano em ano,
   ou por saltos (década)? — recomendo slider contínuo com marcos.
2. **Quantas cidades no M0.5:** começo com as principais (capital + ~10-20 mais antigas/maiores) e
   depois carrego os 645 municípios? — recomendo começar com as mais antigas, escala depois.
3. **Controle no celular:** joystick na tela? toque-para-ir? — recomendo toque-para-ir + arrastar câmera.

## COMO TRABALHAMOS
Um marco por vez. Cada um vira mini-spec (objetivo + aceite), eu construo, **você abre por http e
reage**, ajusto, só então o próximo. Nada em produção sem seu ok; §2 e §5.1 acima de tudo.
