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

4. **A TRAVESSIA SE MOSTRA — e o que a mão faz continua travado.** **REVISTO PELO DONO em
   2026-08-08**, e a decisão é dele porque representação é dele: *"nas imagens não está
   aparecendo pessoas… falar delas como era lá, da travessia em si, mostrar esses navios como
   foram, os maus tratos, toda essa camada, não só com imagens tipo bonitinha. Pode ser
   imagens mais pesadas, realistas, mas que mostrem como foi essa dura realidade."*

   **A IMAGEM ABRE.** Pessoas aparecem — na África antes da captura, na travessia, nos navios.
   A violência do sistema pode ser mostrada com realismo, e a régua passa a ser a de museu
   sério (Museu Afro Brasil, o Memorial das Vítimas da Escravidão): mostrar para que se saiba,
   nunca para chocar por chocar. Duas coisas seguem valendo mesmo aqui: **dignidade** — as
   pessoas são gente com rosto e nome possível, nunca massa anônima ou padrão de carga — e
   **nada gratuito**: se a imagem não ensina nada que o texto não ensine, ela não entra.

   **A MECÂNICA CONTINUA TRAVADA, e a distinção é a espinha do §2:** uma coisa é o jogo
   MOSTRAR o que foi feito; outra é a mão da pessoa FAZER. Continuam proibidos, sem exceção:
   1. **O jogador nunca ocupa o lugar de quem traficou** — nem capitão, nem feitor, nem
      comprador, nem "escolha moral" que dê poder sobre alguém escravizado.
   2. **Nenhum minigame de sobrevivência do porão** — sem barra de água, ar ou ração.
      Transformar a mortalidade da travessia em recurso a administrar é a linha.
   3. **Pessoa escravizada não é NPC alcançável** — nem para "libertar": libertar-com-o-toque
      é o poder do senhor invertido em fantasia.
   4. **Restos humanos continuam trava absoluta** — o Cemitério dos Pretos Novos é fonte
      citável, nunca terreno, imagem ou item. Isto não é pudor: é ética arqueológica, com
      instituição viva no assunto (Instituto Pretos Novos), e é de outra natureza.
      **LEVANTADA E REAFIRMADA em 2026-08-10.** O dono chegou a dizer "pode mostrar restos sim,
      a realidade é e foi dura" — lendo a trava como pudor, que é como ela parece à primeira
      vista. Apresentada a distinção (sítio EM ESCAVAÇÃO hoje, instituto vivo trabalhando nele,
      descendentes vivos; osso escavado de gente real como cenário de jogo é outra CATEGORIA,
      não uma dose menor de dureza), ele respondeu: *"concordo com o que você trouxe, sensato"*.
      Fica registrado para nenhuma sessão futura reabrir isto do zero — e para a próxima, se
      houver, ser uma decisão nova e não a mesma conversa de novo. **Tudo o mais da travessia
      continua aberto e pesado:** navio, corrente, maus-tratos, a dureza inteira.
   5. **Objeto ritual não é colecionável** — entra como fala, nunca como drop.
   6. **Nenhum número sem fonte**, e nunca "escravo" como identidade.

   *(O bloco anterior, proposto pelo historiador em 2026-08-07, proibia a imagem também.
   Ficou registrado no NOTES.md com o argumento dele — que continua bom e continua valendo
   para a MECÂNICA. O dono decidiu que, para a imagem, contar sem mostrar vira omissão.)*

6. **A REGRA DO DOCUMENTO** — para história recente (polarização, corrupção, Covid).
   Proposta pelo historiador em 2026-08-07, mesma condição de vigência do item 4.
   - **Só se afirma o que um documento público afirma, e o jogo mostra qual**: norma com
     número · decisão de tribunal com processo · número de órgão de registro (sempre com o
     verbo **"registrou"**) · relatório de comissão, citável como *"o que o relatório
     concluiu"*, nunca como *"o que aconteceu"* — a mesma leitura crítica que o jogo já
     aplica às cartas jesuíticas. **Coerência é o argumento:** desconfiar do documento do
     séc. XVII e engolir o do XXI não é ensinar método, é escolher lado.
   - **Nomeia** instituições, processos e leis. **Nunca nomeia** político, magistrado,
     delator ou empresário como responsável — **nem com condenação transitada**, porque
     sentenças mudam e o §2 já proíbe pessoa real como inimigo.
     **UMA EXCEÇÃO, aberta pelo dono em 2026-08-11:** quando o nome de alguém virou o **nome
     POPULAR de uma lei ou emenda**, ele pode ser usado — porque ali ele deixou de ser pessoa
     e virou o jeito como o país chama aquele texto. Foi decidido sobre a Emenda Dante de
     Oliveira, que o capítulo A PRAÇA citava só pelo número da PEC e ficava irreconhecível.
     **O limite da exceção é estreito e não se estica:** vale para NOMEAR O TEXTO, nunca para
     narrar a pessoa. "A Emenda Dante de Oliveira foi rejeitada" entra; "o deputado Dante de
     Oliveira propôs" não entra, porque aí ele voltou a ser sujeito de uma ação — e é disso
     que a regra protege. Na dúvida entre as duas formas, use a que não tem gente agindo.
   - **Nunca**: culpa partidária (teste: se um leitor de qualquer lado identifica um alvo,
     o texto falhou), opinião sobre eleição, **simetria falsa de fato** (equilibrar dado
     desigual é o "encontro de culturas" em roupa nova), e **cinismo** — "todos são iguais"
     desmobiliza e ensina o contrário do que o dono pediu.
   - **Régua dos cinco anos:** fato com documento fechado vira MARCO; vira CAPÍTULO só com
     ~5 anos de distância. Nada em julgamento.
   - **O sujeito é sempre quem sustenta, nunca quem governa.** Um capítulo cuja
     protagonista é a agente comunitária de saúde não tem como ser lido como comício.
   - A **homenagem 8-bit** não se estende ao pós-1985 automaticamente: cada uma vai ao dono.

Regras práticas que decorrem disso:

- **Nenhum número inventado passando por fato.** Se o jogo afirmar algo histórico, precisa
  de fonte, e a fonte entra no `NOTES.md` no mesmo commit. Sem fonte, é ficção — e então
  não se apresenta como história.
- **Nenhuma pessoa real como inimigo a ser golpeado.** Adversários são forças e sistemas,
  não indivíduos históricos.
- **Na dúvida sobre representação, pare e pergunte ao dono.** É o único assunto deste
  repositório em que decidir sozinho é a escolha errada.
- **Prioridade de fonte, decidida pelo dono em 2026-08-06:** ao afirmar história, prefira
  (1) autoria indígena e negra — Ailton Krenak, Davi Kopenawa, Eliane Potiguara, Daniel
  Munduruku, Beatriz Nascimento, Lélia Gonzalez, Abdias do Nascimento — e (2) as
  pesquisadoras de cada período. Fonte institucional (IBGE, CNV, leis) continua valendo;
  a regra é sobre QUEM narra quando há escolha. O NOTES.md mantém a lista por capítulo.

- **A REVISÃO DOS TEXTOS PASSA À AGENTE HISTORIADORA, com uma condição — decidido pelo dono em
  2026-08-19.** Palavras dele: *"nao daria pra nossa agente historiadora puxar isso, desde que ela
  use fontes de pessoas com propriedade e local de fala, estarei de acordo... povos originarios,
  pessoas negras, mulheres, pessoas em vulnerabilidade... em geral que tenham consciência
  social"*.

  Isto **amplia** a prioridade de fonte acima e a torna **condição de aprovação**, não preferência.
  Ler e cortar o texto que o jogo afirma sobre gente real deixa de esperar por ele, desde que:

  1. **Quem narra tem lugar de fala sobre o que se narra.** Povos originários sobre povos
     originários; autoria negra sobre a história negra; mulheres sobre a história das mulheres;
     quem viveu a vulnerabilidade sobre ela. Fonte institucional segue valendo para o dado —
     é sobre quem **interpreta**, não sobre quem contou.
  2. **Consciência social é critério**, e não enfeite: fonte que trata gente como objeto de
     estudo não serve, mesmo sendo acadêmica e mesmo estando certa nos fatos.
  3. **Cada corte diz de onde veio.** Quem revisou, com que fonte, e por que aquela fonte tem
     propriedade sobre aquilo. Sem isso o corte é opinião, e opinião não corta texto histórico.

  **O que esta licença NÃO cobre, e a diferença é de natureza:** decidir **quem representa** um
  capítulo, nomear pessoa viva, encenar objeto sagrado, ou qualquer pergunta cuja resposta crie
  representação nova. Revisar o que já está escrito é uma coisa; decidir o que passa a existir é
  outra, e continua sendo dele — §2 inteiro segue valendo, e "na dúvida, pare e pergunte" também.

## 3. Regras técnicas

> **Virada de arquitetura, decidida pelo dono em 2026-08-05.** As duas primeiras regras desta
> seção eram invioláveis e deixaram de ser. O jogo vai migrar para **TypeScript + Phaser +
> React + Supabase + Capacitor**, em fases, com o jogo funcionando ao fim de cada uma.
> O que está escrito abaixo descreve o estado ATUAL e continua valendo até a fase que o mudar.
>
> **O que a migração custa, e foi dito antes de decidir:** todas as constantes medidas
> precisam ser re-derivadas ou aceitas como quebradas — `PASSO_PX = 6,377` (medido da sola em
> 12 quadros), o `n` inteiro da velocidade, as três camadas de paralaxe, o desfranjamento do
> magenta, e o spawn por distância. Cada uma custou pelo menos uma sessão.
>
> **Ordem acordada:** Capacitor primeiro (ganho puro, sem reescrita), depois TypeScript
> (mantendo saída de arquivo único), depois React nas telas, depois Phaser no motor, e
> Supabase para sincronizar save e leaderboard.
>
> **O que a chegada do Supabase obriga a mudar junto, e não é opcional:** a tela de AJUSTES
> afirma hoje ao jogador que *"nada sai deste aparelho"*. Isso deixa de ser verdade no
> instante em que o primeiro byte sai. Afirmação de privacidade que virou falsa é pior que
> nenhuma — reescreva a tela na MESMA fase que ligar a rede, nunca depois.

1. **Um arquivo de SAÍDA, mais os pacotes de arte** — as fases 1 e 2 (Capacitor e TypeScript)
   foram feitas em 2026-08-05. A fonte é `src/index.html` (molde), `src/estilo.css` e
   `src/jogo.ts`; `npm run build` compila e reembute tudo num `index.html` autocontido na raiz,
   com a arte em base64, sem uma única referência externa por `src=`/`href=` — o build **recusa**
   escrever se achar uma.

   **A partir de 2026-08-10 há uma exceção, e ela é a única**: a arte dos capítulos 2+ sai para
   `pack-*.json` ao lado do `index.html` e o jogo a busca quando a pessoa **chega no capítulo**.
   Aprovado pelo dono depois de ler o `RELATORIO-PESO.md`: o jogo levava **16,65 s** para aceitar
   o primeiro toque num celular em 3G, e passou a levar **6,30 s** — e, o que decidiu, a porta de
   entrada **parou de crescer** com cada capítulo novo. Três coisas não se negociam nessa
   exceção, e as três são cobradas por teste: **(a)** o jogo nunca fica sem chão — enquanto o
   pacote não chega, o capítulo roda com a arte do capítulo 1, que nunca sai da abertura;
   **(b)** pacote que falha de baixar não quebra a partida e é tentado de novo na próxima
   entrada; **(c)** o único endereço alcançável é o pacote do próprio domínio, e o build cobra
   a forma da função que o monta. Ao acrescentar arte, veja `ferramentas/pacotes.js` — é lá que
   se decide o que viaja e o que fica.

   É esse `index.html` (mais os pacotes) que a Vercel publica, que o `npm start` serve, que o
   smoke test lê e que o Capacitor empacota — via `dist/`, que são os mesmos bytes. **Nunca
   edite o `index.html` nem os `pack-*.json` da raiz**: são saída, e o próximo build apaga o que
   você escrever neles. Isso vale também para as ferramentas de arte (`test/inline-*.js`,
   `cortar-pacote.js`, `embutir-heroi.js`, `requalificar.js`): todas escrevem em `src/jogo.ts`.
2. **A rede alcança o próprio domínio e UM host, e nada mais.** A `Content-Security-Policy` no
   `<head>` faz o navegador cobrar isso. Ela mudou duas vezes, as duas em 10/08, e as duas estão
   escritas por extenso no `<head>` e no commit que as fez:
   `connect-src 'self' https://us.i.posthog.com` — `'self'` para os pacotes de arte, e o host
   para a contagem anônima. **A região é US**, que é onde o projeto do dono está, e errar nela
   falha em SILÊNCIO: os dois endereços respondem 200 OK a qualquer chave, e o sintoma seria um
   painel vazio semanas depois. Escrito inteiro, com esquema: **nenhum curinga, nunca**. Quando ela
   precisar abrir de novo, abra **só o que a fase pede** e escreva no commit o que passou a ser
   permitido; CSP relaxada por conveniência é o começo de não ter CSP. A tabela pregada em
   `ferramentas/construir.js` recusa construir se a CSP mudar sem ela — é de propósito que seja
   chata de mudar por acidente —, e o host sai de **uma constante só** (`MEDIDA_HOST`), que
   alimenta a CSP e a cobrança do endereço que o jogo chama.

   **A contagem, e os limites dela.** Nove eventos anônimos respondem a pergunta de três dias:
   abriu · voltou (com o número do dia) · chegou no capítulo X · terminou · abriu A HISTÓRIA ·
   abriu DE ONDE VEM · onde parou (com o tempo daquela sessão) · **o jogo quebrou** (mensagem,
   arquivo e linha, e nada do estado da partida — teto de três mensagens distintas por carga,
   agrupadas por mensagem, para uma exceção presa no laço de quadro não virar 60 pedidos por
   segundo) · **a resposta de "você voltaria amanhã?"**, a pergunta de uma linha da CHEGADA.
   Sem nome, sem e-mail, **sem IP** (`$ip: null`), sem perfil de
   pessoa (`$process_person_profile: false`), sem cookie (`fetch` com `credentials: "omit"`; a
   biblioteca do PostHog **não** é usada, e a CSP nem a deixaria carregar), sem autocapture e sem
   gravação de sessão. A chave é a **publicável** (`phc_`) e o build **recusa construir** se ela
   deixar de ser — chave de serviço num arquivo que roda no navegador de outra pessoa é a conta
   inteira entregue a quem abrir o código-fonte. Ao acrescentar evento ou propriedade: a lista
   branca do `encaixe.js` bloco 17 reprova o que ninguém aprovou, e é ela o portão.

   **Duas coisas valem mais que a medição inteira, e o `encaixe.js` bloco 17 mede as duas:** o
   jogo **nunca depende** dela (adblock, servidor mudo, 503 — medido: zero erro, zero espera), e
   **desligar desliga de verdade** (medido: zero pedidos). O interruptor está na tela de AJUSTES,
   ao lado da frase que ele torna verdadeira.
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

## 5.1 TERRITÓRIO — a tela ONDE FOI é do dono (17/08)

Ele passou a trabalhar no mapa em **outra máquina**. O `TERRITORIO.md` lista, por nome, cada
símbolo e cada bloco que são dele em `src/jogo.ts`, `src/index.html` e `src/estilo.css`.
**Não edite nada de lá — nem eu, nem agente nenhum.** Trabalho que precise tocar a zona dele
para e avisa; não edita e pede perdão depois.

## 5.2 A EQUIPE VIROU MÁQUINA (17/08)

Seis agentes em `.claude/agents/`: `pm` · `arte` · `dev` · `historiador` · `pipeline` · `qa`.
O `AGENTES.md` explica cada portão e por que ele existe. O que a máquina passou a garantir e o
prompt não garantia: **worktree sempre** para quem toca `src/`, **ferramenta negada** onde o §2
manda parar (`ROSTOS.md` é somente leitura para agente), e um **QA independente que tenta
refutar** antes de eu integrar.

**LICENÇA PERMANENTE DE USO DOS AGENTES, dada pelo dono em 2026-08-18.** Ela existe porque a
máquina foi construída em 17/08 e ficou **parada**: a sessão da madrugada de 18/08 trabalhou seis
horas sozinha com os seis agentes ali do lado, porque o padrão é não disparar agente sem pedido
explícito. Não é mais preciso pedir.

- **Use os agentes por padrão**, sem perguntar, sempre que a tarefa se beneficiar: `historiador`
  lendo fonte enquanto o `dev` mede, `qa` tentando **refutar** o que você acabou de afirmar,
  `arte` e `pipeline` no que é deles. Trabalho em paralelo é o normal, não a exceção.
- **`isolation: "worktree"` é obrigatório** para qualquer agente que toque `src/` — é o que
  impede duas escritas simultâneas de se atropelarem no arquivo de 14 mil linhas.
- **O QA vem antes de integrar**, não depois. Um agente que tenta derrubar o achado é a única
  correção estrutural para o defeito de eu revisar o meu próprio trabalho.
- **O que a licença NÃO revoga:** o §2 inteiro (representação decide-se com o dono), o
  `TERRITORIO.md`, e a regra de que nada entra na `main` sem os dois portões verdes por exit code.

**O BRIEFING COMUM É O `EQUIPE.md`, e ele existe desde 19/08 por pedido do dono** (*"equipe
de agentes evoluindo organizada e alinhada"*). Os seis apontam para ele no cabeçalho. Ele
guarda o que o `AGENTES.md` não guarda: as lições que já custaram tentativas COM O NÚMERO que
custaram, a disciplina de trabalhar em paralelo sem se atropelar, e o **PLACAR** — uma linha por
rodada, com achados, confirmados e desmentidos.

O placar não é cerimônia: foi o número de 18/08 (18 achados, 3 desmentidos, e em 2 deles o erro
foi meu ao desmentir) que fez 19/08 ser melhor. Sem ele, cada rodada redescobre o mesmo buraco.

**Orquestração pesada continua exigindo pedido dele** — fan-out de dezenas de agentes, auditoria
paralela dos treze capítulos, painel de juízes. Isso queima muito, e o dono pede com a palavra
`ultracode` na mensagem. A licença acima é para o trabalho de todo dia, não para a frota.

## 6. Como trabalhar

### O CHECK — quando o dono escrever `check` e nada mais

É um comando, definido por ele em 2026-08-10. Significa: **pare de produzir e faça o balanço.**
Não é relatório de status ("fiz A, B e C") — é uma mesa de decisão. O que ele quer ver:

- **o que está pendente**, e de quem é cada coisa;
- **as dúvidas** que apareceram e ainda não têm resposta;
- **as ideias e os caminhos possíveis**, inclusive os que eu não seguiria.

**O CHECK É DE PRODUTO, e isto é obrigatório desde 2026-08-17** (*"o check tem que trigar a
evolução do produto também, sempre revisar metas, objetivos e oportunidades também para me
enviar"*). Todo check tem QUATRO camadas, nesta ordem:

1. **METAS** — onde estamos contra a pergunta de três dias e contra a tese (bonito · divertido ·
   ensina). Com número quando houver; dizendo "não sei" quando não houver, que é informação.
2. **OBJETIVOS** — o que está feito e o que falta, medido.
3. **OPORTUNIDADES** — o que EU vejo e não está em fila nenhuma, inclusive o que eu não faria.
4. **AS DECISÕES**, na forma clicável.

Sem a camada 1 o check vira relatório de tarefas, que é exatamente o que ele não é.

**A forma é obrigatória e ele repetiu duas vezes: LISTA ORDENADA, com OPÇÕES, e a melhor
opção marcada.** Ele responde por número — "1. C, 2. A" — e isso só funciona se cada item for
uma pergunta fechada com saídas nomeadas.

Regras que fazem o check valer alguma coisa:

1. **Toda opção precisa de consequência dita.** "(a) faz agora / (b) faz depois" não é opção;
   "(a) faz agora e o capítulo 6 destrava / (b) faz depois e a arte fica parada" é.
2. **Recomende.** Marcar a melhor com ⭐ é parte do trabalho — devolver cinco opções sem
   preferência é empurrar a decisão de volta para quem pediu ajuda.
3. **Separe o que é dele do que é meu.** Item que eu posso resolver sozinho não vai para a
   lista dele; vai para a minha fila e para o Diário.
4. **Item resolvido SAI.** Lista que só cresce é lista que ninguém lê — foi por isso que a
   mesa acumulou 17 itens invisíveis por dias.
5. **Nada de check com item inventado para engordar a lista.** Se só há três coisas, são três.
6. **A FORMA É A INTERATIVA, quando couber** (pedido dele em 2026-08-11: *"tem como trazer
   daquela forma interativa de assinalar alternativas? se sim prefiro"*). Use a ferramenta de
   pergunta com alternativas assinaláveis para as decisões — é mais rápido para ele que digitar
   "1. C, 2. A".
   **O limite dela é real e não se contorna: no máximo QUATRO perguntas por vez, com até quatro
   opções cada.** Então o check passa a ter duas partes: as **quatro decisões que mais travam**
   vão na forma interativa, e o resto continua em lista escrita, abaixo. Escolher quais quatro
   é trabalho, não sorteio — vai o que trava outra pessoa, o que trava arte, e o que fica pior
   quanto mais se espera.

7. **A PÁGINA PUBLICADA, pedida pelo dono em 2026-08-18.** O check é lido no celular, e rolagem
   de terminal é o pior lugar possível para uma mesa de decisão com print, número e opção lado a
   lado. Publique o check como **página privada** (Artifact) e entregue o link junto do resumo:
   as quatro camadas na página, os prints que sustentam cada número, e as decisões clicáveis
   continuando na conversa, porque é ali que ele responde. A página é o material de leitura; a
   pergunta continua sendo feita aqui.


```bash
npm test               # = npm run build && node test/smoke.js — tem que passar
git add -A && git commit -m "..." && git push
```

**Reverteu algo pela metade? Escreva no `PENDENTES.md` no MESMO commit.** Regra do dono
(2026-08-09): *"tudo bem reverter o que estiver pela metade, mas mantenha como tarefas ainda
pendentes para continuarmos."* Código morto não entra na `main` — mas reverter sem registrar
perde o trabalho duas vezes, porque some o código E o diagnóstico que custou a sessão. Nada
sai do `PENDENTES.md` sem estar feito ou sem o dono descartar.

**Mexeu em `src/`, rode o build.** O smoke test lê o `index.html` da RAIZ, que é saída, não
fonte — sem `npm run build` antes você testa o arquivo de ontem e ele passa. Por isso `npm test`
e `npm start` já constroem sozinhos; `node test/smoke.js` puro continua existindo para quando
você quer testar exatamente os bytes que estão no disco. Para apontá-lo a outro alvo:
`JOGO_HTML=android/app/src/main/assets/public/index.html node test/smoke.js`, ou uma URL http.

O smoke test **sobe um servidor próprio** e abre o jogo por `http://127.0.0.1` — não mais por
`file://`, e não é gosto: sob `file://` o Chromium recusa o `fetch` do pacote de arte vizinho
(provado em `test/peso-file-fetch.js`), então um teste em `file://` continuaria **passando**
enquanto exercitava só o caminho de recuo. Nenhum dos três lugares onde o jogo roda de verdade
usa `file://`. Consequência aceita e registrada: abrir o `index.html` da raiz com dois cliques
mostra a arte do capítulo 1 em todo lugar — o jogo roda, só não busca os pacotes.

O `tsc` roda dentro do build e o build **não escreve nada** se ele falhar — erro de tipo não
chega ao `index.html`. Para só conferir tipos, sem gerar: `npm run tipos`.

Para o aplicativo Android: `npm run app` (constrói e sincroniza) e `npm run app:abrir`.
Compilar o APK exige JDK e Android SDK, que **não estão nesta máquina**.

**Qualidade da arte, revista em 2026-08-07** (números e prints no `NOTES.md`): fundos e
contextos estão em WebP **0,72**; personagem, NPCs, retratos e vegetação de fundo em **0,76**;
`MOB_B64`, `DROP_B64`, `ICONE_B64` e `FRENTE_B64` continuam em 0,80 — o `FRENTE_B64` porque
abaixo disso ele **cresce**, os outros porque a meta de peso já estava batida sem gastá-los.
Medido: `index.html` 4.447 KB → **3.362 KB**, com erro médio **na escala de exibição** de 2,65
(fundos) e 2,89 (contextos), abaixo da régua de 2,6 de 255 nos dois maiores blocos, e nenhuma
diferença visível a 3× de ampliação. Ao mexer nisso de novo: meça **na tela**, não no arquivo
(`test/medir-na-tela.js`) — a pintura de cenário é desenhada AMPLIADA 2,53×, então reduzir a
resolução dela é piorar o que já falta, e qualidade rende mais KB por unidade de estrago do
que largura. **0,65 foi medida e recusada** — a mata perde a mancha fina de folha.

Duas economias do pipeline são automáticas e não custam pixel nenhum: o build recolhe toda
imagem embutida repetida num `__ART[]` (arte gerada por ferramentas diferentes se duplica
sozinha), e o `test/tirar-icc.js` remove o perfil sRGB que o canvas do Chromium carimba em
cada WebP. **Rode o `tirar-icc.js` por último** — qualquer reencode recarimba o perfil.

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

Produção: <https://matheusferreira.cc> — o domínio do dono, decidido por ele em 2026-08-10
("tenho meu domínio matheusferreira.cc, quero usar ele por enquanto"). O jogo mora na **raiz**.
Enquanto o DNS não estiver apontado, `jogo-brasil-mrcx.vercel.app` continua no ar e funcionando;
o que fica errado nesse meio-tempo é só a prévia do link. O que falta fazer na Vercel está em
uma tela só no `LANCAMENTO.md`, seção **O DOMÍNIO**.

**O endereço mora numa linha só**, `ferramentas/dominio.js`. O molde `src/index.html` escreve
uma marca e o build a troca nas duas tags `og:` — trocar de domínio, de subdomínio ou de
subcaminho é trocar essa linha e rodar `npm run build`. As URLs do cartão do link **não têm mais
como desencontrar**, que era o jeito antigo de a prévia do WhatsApp quebrar em silêncio.

Repo: `mrcx-code/jogo-brasil` · Push na `main` publica sozinho.

Não há variável de ambiente nem backend. Há **uma** credencial no cliente, e ela é publicável
por construção: a chave `phc_` do PostHog, que só serve para MANDAR evento. **Nenhuma chave de
serviço, nunca**, num jogo que roda no navegador de outra pessoa — e isto deixou de ser só uma
frase: o `ferramentas/construir.js` recusa construir se a chave embutida não começar com `phc_`.
O mesmo vale para o Supabase quando ele chegar.

O nome do jogo é **BRASIL**, decidido pelo dono em 2026-08-05. O repositório continua se
chamando `jogo-brasil`, o que é só o slug.

O **logo** também está decidido: troncos com folha de costela-de-adão e um rio, embutido no
menu. Foi escolhido entre seis por um critério que vale registrar — as outras opções usavam
grafismo geométrico *inventado*, e grafismo indígena não é ornamento: cada padrão pertence a
um povo, tem nome e significado. Um padrão que "parece indígena" é a versão gráfica de tratar
centenas de povos como uma estética só, e é o mesmo erro do §2.1. As duas finalistas eram
natureza pura justamente por isso.

**A TESE DO PRODUTO, dita pelo dono em 2026-08-07 e válida acima de qualquer plano:**
*"Queremos algo visualmente impressionante e que seja divertido jogar enquanto você aprende
sobre a história do Brasil."* As três pernas têm o mesmo peso — **bonito · divertido ·
ensina** — e uma entrega que ganha numa às custas de outra não está pronta. No mesmo
fôlego ele deu licença de arquitetura: *"fique à vontade para mexer na estrutura ou rever
algo da forma que está planejado."* Plano é ferramenta, não compromisso: se a estrutura
atual não serve às três pernas, mude a estrutura e escreva por quê.

**Mandato de evolução, decidido pelo dono em 2026-08-07:** a evolução visual e de produto
é **delegada e autônoma** — existe um papel de DIREÇÃO DE EVOLUÇÃO (agente dedicado) que
pensa só nisso e CONDUZ, sem esperar o dono ("vou ajustando mas não quero que vc me
espere"). A visão vigente vive em `DIRECAO.md`. Limites que o mandato NÃO revoga: o §2
inteiro (representação decide-se com o dono), o logo, o nome, as regras técnicas, e
qualquer mudança de economia continua exigindo medição antes/depois.

Este repositório não tem relação com o projeto de onde o motor veio. Não referencie o
outro, não puxe dele, não empurre para ele.
