# Política de Privacidade — o TEXTO

[**Isto é FONTE, não saída.** É o texto da futura página `/privacidade`, escrito pelo jurídico
em 2026-09-03 para o item `pagina-privacidade` do backlog. Montar a página HTML é trabalho do
`dev-plataforma` e não foi feito aqui — este arquivo entrega só o texto, para ele não ter de
escrever direito enquanto escreve HTML.

**O nome do controlador foi decidido pelo dono em 03/09/2026 (chat):** o projeto **BRASIL**, sem
nome de pessoa física — decisão dele, feita sabendo do custo (identificar um projeto em vez de
uma pessoa é mais anônimo, mas é uma identificação de controlador mais fraca perante a LGPD; se
algum dia isso virar problema prático, é reversível). O e-mail de contato (`brasilpatinhas@gmail.com`)
foi autorizado pelo dono em chat, em 03/09, para uso na página de privacidade e nas peças de
divulgação.

**Leia as RESSALVAS no fim do arquivo antes de publicar.** R1 ainda muda decisão de produto (o
padrão da medição contra o ECA Digital, em vigor desde 17/03/2026 e posterior à decisão do dono
de 22/08). R6 e R7 — duas afirmações de privacidade que o código não cumpria — foram medidas
nesta rodada e **consertadas em 04/09**; o texto abaixo já reflete o conserto.

**Como este texto foi conferido:** cada afirmação foi lida contra o código, não contra o que o
repositório diz sobre si mesmo — e duas foram medidas em navegador, porque ler não bastava. Os
arquivos e linhas estão na seção "De onde veio cada afirmação", no fim. Regra da casa (§3 do
CLAUDE.md): afirmação de privacidade falsa é pior que nenhuma, e ela vale para este arquivo
antes de valer para qualquer outro.]

---

# Privacidade

**BRASIL — matheusferreira.cc**

Última atualização: [DATA DA PUBLICAÇÃO]

---

## Em uma tela

Esta plataforma não pede seu nome, não pede seu e-mail, não tem cadastro e não tem login. Não
há anúncio nenhum aqui e nada do que você faz é vendido, trocado ou usado para te mostrar
propaganda.

O que você joga e o que você lê fica guardado **no seu aparelho**. O que sai daqui é uma
contagem anônima: que alguém abriu, até que capítulo foi, se voltou no dia seguinte. Nada
disso diz quem você é.

E dá para desligar. O interruptor **medição** fica na barra do topo de qualquer página e na
tela de AJUSTES do jogo. Desligado, não sai um byte — nem do jogo, nem das páginas.

Se quiser falar com quem responde por isto: **brasilpatinhas@gmail.com**.

---

## 1. Quem responde por esta plataforma

O controlador dos dados pessoais tratados aqui — quem decide o que é coletado e por quê, nos
termos do art. 9º, I da Lei nº 13.709/2018 (LGPD) — é:

**BRASIL** — projeto pessoal, mantido no Brasil, sem pessoa jurídica constituída.
Contato: **brasilpatinhas@gmail.com**

Este mesmo e-mail é o canal para qualquer pergunta, pedido ou reclamação sobre privacidade.
Não há intermediário: quem lê é quem decide.

O BRASIL é um projeto pessoal, sem fins comerciais. Não há empresa por trás, não há
investidor, não há publicidade e não há venda de nada.

---

## 2. O que fica no seu aparelho — e nunca sai dele

O jogo guarda o seu progresso no **armazenamento local do navegador** (`localStorage`), no seu
próprio aparelho. Isso não é enviado para lugar nenhum.

O que fica aí:

- **o seu jogo**: em que capítulo você está, o que você já construiu, quais falas já viu;
- **a sua rotina**: em quantos dias distintos você jogou, quanto tempo ao todo, quantas vezes
  abriu A HISTÓRIA e DE ONDE VEM, quantas vezes chegou ao fim;
- **a sua escolha sobre a medição**: ligada ou desligada;
- **um número sorteado**, do qual falamos na seção 4.

**Como apagar.** O botão **APAGAR MEU PROGRESSO**, na tela de AJUSTES, zera a partida, o
registro de rotina e o número sorteado. A sua escolha sobre a medição (ligada ou desligada)
**não** é apagada por esse botão de propósito — senão zerar a partida religaria a medição sem
avisar. Para apagar também essa escolha, apague os dados do site no seu navegador — é o único
caminho que limpa a chave inteira, e ele não depende de nós.

**O que você digita na busca do glossário não sai daqui.** É o único campo de escrever que
existe na plataforma inteira, e o que você escreve nele nunca é enviado.

Não existe conta, não existe senha, não existe formulário, não existe comentário e não existe
placar público. Não há nada aqui onde você possa escrever o seu nome.

---

## 3. O que sai daqui — e é só isto

Quando a medição está ligada, a plataforma manda avisos curtos e anônimos para uma ferramenta
de contagem (ver seção 6). Os avisos são estes, e não há outros:

| Quando | O que o aviso diz |
| --- | --- |
| Você abre o jogo | que alguém abriu · em que capítulo estava · em quantos dias distintos já jogou · quantos minutos ao todo · se já chegou ao fim alguma vez |
| Você volta noutro dia | o número do dia (2º dia, 3º dia…) |
| Você chega num capítulo novo | o número e o nome do capítulo · os minutos jogados · o dia |
| Você chega ao fim | quantas vezes chegou · os minutos · o dia |
| Você abre A HISTÓRIA | quantas vezes já abriu · o dia · se veio pela tela do fim |
| Você abre DE ONDE VEM | quantas vezes já abriu · o dia · se veio pela tela do fim |
| Você abre as palavras do capítulo | o número do capítulo · o dia |
| Você fecha o jogo ou troca de aba | em que capítulo parou · quantos minutos ao todo · quanto durou esta sessão · quanto desse tempo você teve a mão no jogo, e não só a aba aberta |
| O jogo quebra | a mensagem do erro, o arquivo e a linha — **nada da sua partida**; no máximo três por vez |
| Você responde "você voltaria amanhã?" | a palavra que você escolheu entre três (*volto*, *talvez*, *não*) · o dia · os minutos · quantas vezes você já chegou ao fim |
| Você clica na nota que leva do jogo para o resto da plataforma | só que o clique aconteceu, e nada mais |
| Você abre uma seção da plataforma | qual das cinco seções foi aberta (A História, Glossário, De Onde Vem, Onde Foi, ou a página de entrada) |

Junto de cada aviso vai a **hora** em que ele saiu e duas marcas técnicas: uma dizendo que ele
veio deste site (e não da biblioteca de terceiros, que não usamos) e outra que marca o tráfego
das nossas próprias máquinas de teste, para não confundi-lo com o de gente de verdade.

**Nada mais viaja.** Não vai o tamanho da sua tela, nem o seu idioma, nem o seu fuso horário,
nem o seu navegador, nem a página de onde você veio, nem o que você digitou, nem qualquer
detalhe da sua partida além dos que estão na tabela acima. A lista de campos permitidos é fixa
e conferida por um teste automático a cada publicação: campo novo que ninguém aprovou faz a
publicação falhar.

**Por que estes avisos existem.** Para responder uma pergunta só, sobre o produto e não sobre
você: *alguém volta no dia seguinte?* E, no caso do aviso de erro: *o que está quebrando no
aparelho de outras pessoas?* Sem isso, quem faz esta plataforma não tem como saber onde ela
falha.

---

## 4. O número sorteado — e por que ele existe

Para saber que "voltou no 3º dia" é a mesma pessoa do 1º dia, a plataforma precisa de alguma
marca constante. A marca é um **número de 32 dígitos, sorteado pelo seu próprio navegador**, na
primeira vez que você abre.

Sobre ele, com todas as letras:

- **não veio de você**: não é o seu aparelho, não é o seu navegador, não é a sua hora, não é a
  sua tela. É um sorteio, e nada mais;
- **não leva a você**: ele não é cruzado com nada, não é vendido, não é enviado a ninguém além
  da ferramenta de contagem, e não existe em lugar nenhum uma tabela ligando esse número a uma
  pessoa;
- **fica no seu aparelho** e some quando você apaga os dados do site. Aí nasce outro, e o
  anterior vira um número órfão que não aponta para lugar nenhum;
- **com a medição desligada, ele não sai, e nem chega a ser sorteado** — nas páginas da
  plataforma e no jogo, os dois. Se você religar a medição depois, aí sim ele nasce.

Ainda assim, tratamos esse número como **dado pessoal**, porque ele permite distinguir uma
visita de outra ao longo do tempo — e é por isso que esta política existe, em vez de a
plataforma se declarar "anônima" e encerrar o assunto.

---

## 5. O que **não** é coletado

Nunca, em nenhuma circunstância, e cada linha aqui é uma escolha de projeto, não um
esquecimento:

- **seu nome, seu e-mail, seu telefone** — não há onde digitá-los;
- **seu IP.** Todo pedido de internet carrega um endereço, porque sem ele a resposta não teria
  para onde voltar. Cada aviso que sai daqui manda, escrita no próprio pedido, a ordem de
  **descartar o endereço em vez de guardá-lo** — e, com isso, de não usá-lo para descobrir a
  sua cidade ou o seu bairro. O IP não é armazenado nem transformado em localização;
- **nenhuma ficha sua.** O aviso pede explicitamente que a ferramenta conte o evento e **não
  abra perfil de pessoa** — nem anônimo. Perfil anônimo continua sendo uma ficha que cresce;
- **nenhum cookie.** Não usamos a biblioteca da ferramenta de medição (que criaria um) e os
  pedidos são feitos com cookie desligado, de ida e de volta;
- **nenhum rastreio automático de clique, rolagem ou toque; nenhum mapa de calor; nenhuma
  gravação de sessão;**
- **nenhum anúncio, nenhuma medição de publicidade, nenhum pixel de rede social;**
- **nenhum dado sensível** (art. 5º, II da LGPD): não perguntamos e não inferimos origem,
  religião, opinião política, saúde, vida sexual ou filiação a nada;
- **nenhuma venda, aluguel ou troca de dados.** Não há a quem vender: não há nada que
  identifique ninguém.

---

## 6. Com quem esses avisos são compartilhados, e onde ficam

Duas empresas participam do funcionamento da plataforma, como **operadoras** (art. 5º, VII da
LGPD) — elas processam em nome do controlador e não usam nada disto para fins próprios:

- **PostHog Inc. (Estados Unidos)** — recebe e guarda os avisos de contagem descritos na
  seção 3. É a ferramenta que responde "quantas pessoas voltaram no dia 3".
- **Vercel Inc. (Estados Unidos)** — hospeda as páginas. Como qualquer serviço de hospedagem,
  ela recebe o endereço de IP do seu pedido para conseguir entregar a página, e mantém
  registros técnicos de funcionamento por prazo definido por ela. Esse é o mínimo técnico de
  qualquer site na internet, e não alimenta a nossa contagem.

**Isso é uma transferência internacional de dados** (art. 33 da LGPD): os servidores das duas
ficam fora do Brasil. O que viaja para a primeira é o que está na tabela da seção 3 — sem
nome, sem e-mail, sem IP guardado e sem ficha de pessoa.

Fora dessas duas, os dados só seriam compartilhados por **ordem judicial ou requisição legal**
válida — e, se isso acontecer, é bom saber o que existe para entregar: uma contagem sem nome,
sem e-mail e sem IP.

---

## 7. Por quanto tempo

- **No seu aparelho:** enquanto você quiser. Some quando você apaga os dados do site.
- **Na ferramenta de contagem:** os avisos ficam guardados pelo prazo de retenção do plano
  contratado, e são apagados por lá quando ele vence. Como não há ficha de pessoa, o que resta
  são contagens agregadas.
- **Nos registros de hospedagem:** pelo prazo do provedor.

Não há obrigação legal de guardar registro de acesso neste caso — o art. 15 do Marco Civil da
Internet (Lei nº 12.965/2014) obriga a isso os provedores de aplicação constituídos como
pessoa jurídica, que exerçam a atividade de forma organizada, profissional e com fins
econômicos. Não é o caso aqui, e não guardamos.

---

## 8. Com que base legal fazemos isso

O tratamento descrito na seção 3 se apoia no **legítimo interesse do controlador** (art. 7º,
IX da LGPD). Em português: é o interesse legítimo de quem faz uma plataforma educativa
gratuita em saber se ela funciona — se as pessoas voltam, onde elas param, e o que quebra.

O art. 10 da LGPD exige que esse interesse passe por um teste, e é este:

- **Finalidade concreta e declarada:** medir retenção e defeito. Nada além disso, e nada de
  publicidade, venda ou perfilamento.
- **Necessidade e mínimo indispensável:** cada campo da tabela da seção 3 responde a uma
  pergunta específica. Não coletamos IP, tela, idioma, fuso, navegador nem página de origem —
  itens que praticamente toda ferramenta de medição coleta por padrão e que aqui foram
  desligados de propósito.
- **Expectativa razoável:** um site que conta quantas visitas teve é o esperado. Um site que
  monta uma ficha sobre quem visita não é — e é justamente isso que não fazemos.
- **Salvaguardas e transparência:** esta política, a frase que aparece na própria tela de
  AJUSTES do jogo e no rodapé das páginas, e o interruptor que desliga tudo em um toque.

**Você pode se opor.** O art. 18, § 2º da LGPD garante o direito de se opor a tratamento feito
com dispensa de consentimento. Aqui, exercer esse direito não exige e-mail nenhum: é o
interruptor **medição**, na barra do topo de qualquer página e na tela de AJUSTES do jogo. Um
toque, sem confirmação, sem pergunta, valendo para o site inteiro. Desligado, nenhum aviso é
enviado — nem o de erro.

---

## 9. Crianças e adolescentes

Esta plataforma foi feita para ser usada em escola e em casa, inclusive por crianças. Isso
muda o que se pode fazer, e o art. 14 da LGPD é claro: o tratamento tem de ser **no melhor
interesse da criança e do adolescente**.

O que isso significa aqui, de forma concreta:

- **Nada aqui pede ou aceita dado de identificação.** Não há cadastro, não há login, não há
  campo de nome, não há foto, não há contato. Isso cumpre o art. 14, § 4º da LGPD, que proíbe
  condicionar a participação de crianças em jogos e aplicações ao fornecimento de dados além
  do estritamente necessário: aqui, o estritamente necessário é **nenhum**.
- **Nenhum perfilamento, nenhuma publicidade.** Não existe anúncio nesta plataforma, não
  existe publicidade dirigida e não existe construção de perfil de comportamento — nem para
  fins próprios, nem para terceiros.
- **Nenhum dado sensível, nenhum contato entre usuários, nenhuma compra.** Não há chat, não há
  mensagem, não há loja, não há caixa de recompensa, não há moeda paga.
- **O que sai é contagem, não retrato.** Os avisos da seção 3 dizem "alguém chegou ao capítulo
  4" — não dizem quem, nem de onde, nem em que escola.
- **Desligar é fácil, e vale para tudo.** O interruptor está na barra do topo de toda página.
  Uma criança, uma mãe, um pai ou um professor desliga em um toque, sem criar conta e sem
  pedir permissão a ninguém.

**Para pais, mães, responsáveis e professores.** Se a turma ou a criança usa esta plataforma e
você prefere que nada seja contado, desligue o interruptor **medição** no aparelho — vale para
o site inteiro, jogo incluído. Se preferir escrever, o e-mail é **brasilpatinhas@gmail.com** e
o pedido é atendido. Qualquer pedido feito por um responsável legal sobre o uso por uma criança
tem prioridade sobre o interesse desta plataforma em medir qualquer coisa.

**Sobre a base legal, no caso de criança.** A ANPD firmou, no Enunciado CD/ANPD nº 1, de 2023,
que o tratamento de dados de crianças e adolescentes pode se apoiar em qualquer das hipóteses
dos arts. 7º e 11 da LGPD, desde que o melhor interesse seja observado e prevaleça no caso
concreto. É o que se aplica aqui, com a ressalva de que, em qualquer conflito entre medir e o
melhor interesse de uma criança, o melhor interesse ganha — e o interruptor existe para que
isso não dependa de ninguém pedir.

Esta seção foi escrita para ser entendida por quem a lei protege, e não só por adulto — como
manda o art. 14, § 6º da LGPD. Se alguma parte dela ficou difícil, escreva e nós reescrevemos.

---

## 10. Os seus direitos

O art. 18 da LGPD te dá estes direitos, e eles valem aqui:

- **saber se existe algum dado seu** e ter acesso a ele;
- **corrigir** dado incompleto, inexato ou desatualizado;
- **anonimizar, bloquear ou eliminar** dado desnecessário, excessivo ou tratado fora da lei;
- **pedir a portabilidade** a outro fornecedor;
- **pedir a eliminação** dos dados;
- **saber com quem os dados foram compartilhados** — a seção 6 já responde;
- **se opor** ao tratamento feito com dispensa de consentimento — o interruptor da seção 8;
- **rever decisões automatizadas** — não existe nenhuma aqui: a plataforma não decide nada
  sobre ninguém.

**Como exercer:** escreva para **brasilpatinhas@gmail.com**. A resposta sai em até 15 dias, e
não custa nada (art. 18, § 5º e art. 19, II da LGPD).

**Uma limitação honesta, e ela é a favor da sua privacidade.** Como não coletamos nada que
identifique você, na maior parte dos casos **não temos como localizar "os seus dados"** — não
existe uma ficha sua para consultar, corrigir ou apagar (art. 12 da LGPD). O que dá para
fazer, e que resolve o problema na prática:

1. **Apagar tudo o que é seu, na hora, sem pedir a ninguém:** o botão **APAGAR MEU PROGRESSO**,
   na tela de AJUSTES, zera a partida, o registro de rotina e o número sorteado — os três.
   Apagar os dados do site no seu navegador faz o mesmo, e também limpa a sua escolha sobre a
   medição (ela volta ao padrão na próxima vez que você abrir).
2. **Impedir que qualquer coisa nova saia:** desligue o interruptor **medição**.
3. **Pedir a eliminação de avisos já enviados:** se você souber o número sorteado do seu
   aparelho (ele fica no armazenamento local do navegador, na chave `jogo_brasil_anon`), mande
   esse número por e-mail e nós pedimos a eliminação dos avisos ligados a ele. Não precisamos
   de mais nada seu para isso — e não peça.

**Reclamação.** Se a resposta não te satisfizer, você pode reclamar à **Autoridade Nacional de
Proteção de Dados (ANPD)** — gov.br/anpd —, como prevê o art. 18, § 1º da LGPD.

---

## 11. Segurança

Os avisos saem cifrados (HTTPS). A chave usada pelo navegador para enviá-los é uma chave
**publicável**, que só permite mandar evento e nunca ler nada — e a publicação da plataforma
falha automaticamente se alguém tentar trocá-la por uma chave de acesso completo. As páginas
declaram uma política de conteúdo (`Content-Security-Policy`) que só permite ao navegador
alcançar o próprio domínio e o endereço da contagem; qualquer outro destino é bloqueado pelo
próprio navegador.

Se ocorrer um incidente de segurança com risco relevante, ele será comunicado à ANPD e às
pessoas afetadas, na forma do art. 48 da LGPD — e, na prática, o comunicado será publicado
nesta mesma página, porque não temos o e-mail de ninguém para avisar.

---

## 12. Mudanças nesta política

Esta página muda **no mesmo dia** em que mudar o que a plataforma coleta — nunca depois. É uma
regra escrita do projeto: afirmação de privacidade que virou falsa é pior do que não ter
nenhuma. A data no topo diz da última vez que isso aconteceu, e mudanças relevantes ficam
anotadas abaixo.

**Histórico**
- [DATA DA PUBLICAÇÃO] — primeira versão.

---

*Dúvida, pedido, reclamação ou correção: **brasilpatinhas@gmail.com**.*

---
---

# NOTAS INTERNAS — não publicar

## Ressalvas legais que o dono precisa ver ANTES de publicar

### R1. O padrão da medição contra o ECA Digital — a mais séria, e é decisão de produto

A medição nasce **LIGADA** e a pessoa precisa desligar. Isso foi decidido pelo dono em 22/08 e
o parecer daquela rodada considerou defensável, com a condição de desligar ser fácil (condição
cumprida em 23/08: o interruptor subiu para a barra do topo).

**O que mudou desde então, e não foi considerado naquela decisão:** a Lei nº 15.211/2025 (ECA
Digital) está em vigor desde **17/03/2026**. Ela obriga fornecedores de produtos e serviços
digitais **direcionados a crianças e adolescentes ou de acesso provável por eles** a garantir,
desde a concepção e **por padrão**, a configuração no modelo **mais protetivo disponível** em
matéria de privacidade e proteção de dados. Não encontrei, nas fontes que li, limiar de porte
que exclua fornecedor pequeno, individual ou não comercial das obrigações de projeto — o
limiar de 1 milhão de usuários menores de 18 anos que aparece na lei diz respeito a relatórios
semestrais de transparência, não a isto.

**A leitura direta:** se o plano de divulgação mira ensino fundamental II, a plataforma é de
"acesso provável" por crianças, e "mais protetivo por padrão" muito provavelmente significa
**medição desligada até alguém ligar**.

**O que isso custa, e por isso é decisão dele e não minha:** com a medição desligada por
padrão, a pergunta de três dias praticamente deixa de ter resposta — quase ninguém liga um
interruptor por vontade própria. É um conflito real entre o alvo do produto e a lei nova, e
não tem saída elegante.

**DECIDIDO pelo dono em 03/09/2026 (chat):** caminho 2 — desligada por padrão só quando o
contexto é escolar (o link divulgado a professores, ou um caminho dedicado), ligada no resto.
Reduz o risco onde ele é maior (turma de fundamental II) e preserva o número no acesso geral.
**O mecanismo de detecção ainda não existe** — hoje só há "o link" (raiz do domínio), sem forma
de distinguir professor de qualquer outra pessoa. Isso é o item `medicao-desligada-caminho-escolar`
do backlog, na fila de `src/jogo.ts`; até ele entrar, a medição continua nascendo ligada em
TODOS os caminhos, inclusive o escolar — esta política descreve o alvo, não o estado atual.

Isto continua sendo pergunta para advogado de verdade num ponto: se a leitura de que "acesso
provável por criança" se aplica aqui está certa, e se o caminho escolhido cobre a obrigação por
completo. A pergunta pronta está no fim deste arquivo.

### R2. Legítimo interesse para dado de criança — sustenta, com condição

O backlog supunha art. 7º, IX, e a suposição está certa. O **Enunciado CD/ANPD nº 1, de 2023**,
resolveu a controvérsia de que o art. 14, § 1º exigiria consentimento parental como base única:
qualquer hipótese dos arts. 7º ou 11 serve, desde que o melhor interesse seja observado e
prevaleça.

**A condição, e ela é o que faz o argumento de pé:** o teste de balanceamento do art. 10 é mais
rigoroso quando o titular é criança. O que salva o caso aqui é a **minimização real** — sem IP,
sem person profile, sem cookie, sem autocapture, sem gravação, sem publicidade, sem dado
sensível, sem campo livre. Se qualquer uma dessas negativas cair, o legítimo interesse cai com
ela e a base passa a ter de ser consentimento (que, para criança, é dos pais — na prática,
inviável para esta plataforma).

**Consequência prática:** a lista branca de eventos e propriedades (`test/encaixe.js` bloco 17 e
`test/medir-paginas.js`) deixa de ser higiene técnica e passa a ser **a prova documental da base
legal**. Vale escrever isso onde quem for mexer nela vá ler.

### R3. Transferência internacional — o buraco de conformidade que sobra

Os dados vão para PostHog Inc. e Vercel Inc., as duas nos EUA. O art. 33 da LGPD exige
fundamento para transferência internacional, e a ANPD regulamentou as **cláusulas-padrão
contratuais** (Resolução CD/ANPD nº 19/2024), com prazo de adequação de contratos que já
venceu.

O que a página afirma sobre isso é factualmente correto (diz para onde vai e o que vai). O que
**não** está resolvido é o instrumento: se os termos de uso padrão dessas duas empresas
contemplam as cláusulas-padrão da ANPD ou equivalente aceito. Não conferi os contratos, e não
tenho como conferir daqui.

**Risco real, porém baixo em prioridade:** o que atravessa a fronteira não identifica ninguém e
não inclui IP guardado, o que reduz muito a exposição prática. Mas é item de checklist de
qualquer fiscalização, e é barato resolver antes do que depois.

### R4. "Sem IP" é simplificação — e a página não a repete

A tela de AJUSTES do jogo diz **"SEM IP"**. Ao pé da letra isso é forte demais: o IP existe na
conexão, necessariamente, e o que o código faz é mandar `$ip: null`, que instrui o PostHog a
**descartá-lo em vez de guardá-lo e geolocalizá-lo**. Para uma tela de jogo de cinco palavras
por linha, é uma simplificação aceitável e a seção 5 desta política a explica por extenso.

**O que eu não faria:** repetir "sem IP" cru num documento legal. A seção 5 diz o mecanismo, e
é por isso que ela está escrita daquele jeito, mais longo.

**Ponto que continua verdadeiro e vale defender:** o provedor de hospedagem recebe o IP porque
não há como servir uma página sem ele. A página diz isso em vez de esconder.

### R5. A mesa (`/mesa`, `/dashboard`) está fora do escopo deste texto

É a ferramenta privada de trabalho do dono, protegida por PIN, e o que ela guarda são anotações
dele — não dados de visitante. Ela fala com um backend próprio (Supabase) e tem rodapé de
privacidade **próprio**, que já foi auditado em 23/08 e tem portão de teste dedicado
(`test/rodape-verdadeiro.js`), o qual reprova quando uma chave de armazenamento nova aparece
sem frase que a explique.

**Deixei de fora de propósito**, e a razão é de desenho: uma política pública que descreve a
ferramenta interna do dono ou vira longa e confusa, ou vira imprecisa. **Mas há uma pendência:**
as duas URLs são publicamente alcançáveis. Se alguém abrir `/mesa` sem PIN, ela deveria dizer o
que é. Isso é item de `dev-plataforma`, não deste texto.

### R6. CONSERTADO (04/09): no jogo, o número sorteado nascia mesmo com a medição DESLIGADA

**A afirmação que estava escrita** — em `ferramentas/medir-secao.js`, no comentário de cabeçalho:
*"Ele só nasce se a medição estiver LIGADA; com o interruptor desligado nada é gravado, nada é
sorteado e nada sai."*

**O que a medição mostrou, na época** (navegador headless, `jogo_brasil_medir` posto em `"nao"`
**antes** de qualquer script rodar, 390×844, pedidos ao PostHog interceptados):

| Alvo | `jogo_brasil_anon` com a medição desligada | Pedidos ao PostHog |
| --- | --- | --- |
| Jogo (`index.html`) | **criado e gravado** (`96b444cf…`) | **0** |
| Glossário, em contexto limpo | `null` | 0 |
| Porta da plataforma, em contexto limpo | `null` | 0 |

**A causa era de ordem, e estava na fonte:** em `src/jogo.ts`, `medir()` chamava
`medirCarregar()` **antes** do `if (!medirLigado) return`, e era `medirCarregar()` que sorteava
e gravava o identificador — sem guarda nenhuma. Nas páginas o desenho já era outro: `id()` só é
chamado dentro do corpo do evento, depois do `if (!ligado) return`, e por isso ali a frase já
era verdadeira.

**O tamanho real do risco era pequeno.** Nada saía — os zero pedidos confirmavam que "desligar
desliga de verdade" continuava sendo verdade no que importa. O que existia era um número
aleatório parado no `localStorage` de quem pediu para não ser medido.

**Conserto aplicado em 04/09:** nova função `medirGarantirId()`, extraída de `medirCarregar()`,
só sorteia e grava o identificador quando `medirLigado` é verdadeiro — chamada tanto em
`medirCarregar()` quanto no último passo de `medir()`, para cobrir também quem religa a medição
depois de tê-la desligado. A frase do `medir-secao.js` agora é verdadeira nos dois lugares, jogo
e páginas. Efeito colateral aceito de propósito: quem tem a medição desligada e a religa passa a
ganhar um número novo — irrelevante para a contagem e melhor para a privacidade.

### R7. CONSERTADO (04/09): "APAGAR MEU PROGRESSO" não apagava o número sorteado

`zerarJogo()` (`src/jogo.ts`) tinha **um único** `removeItem` no arquivo inteiro, e era o do
`jogo_brasil_retencao`. O `jogo_brasil_v1` era reescrito zerado por `salvar()`; o
`jogo_brasil_anon` e o `jogo_brasil_medir` **ficavam**.

Para o `jogo_brasil_medir`, ficar é **certo** — apagar a escolha de privacidade de alguém ao
zerar a partida religaria a medição sem avisar. Para o `jogo_brasil_anon`, ficar era um furo: a
pessoa que apertou o botão mais destrutivo da tela continuava com o mesmo identificador de
antes, e o painel de medição continuava vendo a mesma "pessoa".

**Efeito jurídico:** é o caminho de eliminação (art. 18, VI) mais visível da plataforma, e agora
ele elimina de fato o único dado que se aproxima de identificador.

**Conserto aplicado em 04/09:** `zerarJogo()` agora também remove `jogo_brasil_anon`, e
deliberadamente **não** toca em `jogo_brasil_medir` — pela mesma razão do parágrafo acima.

### R8. O que este texto NÃO cobre, e vai precisar de versão nova

Escrito para o estado de hoje. Cada um destes itens obriga a reabrir a política **no mesmo
commit** em que chegar:

- **conta, login ou perfil** — muda tudo, inclusive a base legal e o art. 14;
- **leaderboard ou qualquer coisa com nome** — cria coleta de dado de identificação de criança,
  que é o cenário que mais preocupa;
- **comentário, mensagem ou campo livre** — cria conteúdo de terceiro, moderação, e obrigações
  do ECA Digital sobre contato entre usuários;
- **save sincronizado por Supabase** (previsto no §3 do CLAUDE.md) — passa a haver dado guardado
  em servidor, com prazo, com titular e com direito de eliminação exercível de verdade;
- **qualquer anúncio ou patrocínio** — derruba metade das afirmações da seção 5.

Também não há **Termos de Uso** nesta entrega. Hoje não fazem falta (não há conta, não há
conteúdo de usuário, não há pagamento). Farão falta no dia em que houver qualquer um dos três.

---

## Perguntas prontas para um advogado de verdade

Se o dono levar isto a um profissional, estas são as quatro perguntas que valem a consulta —
nesta ordem, e as três primeiras cabem numa consulta curta:

1. **Uma plataforma educativa gratuita, mantida por pessoa física, sem cadastro e sem
   publicidade, cujo público provável inclui crianças de 11 anos, pode manter medição anônima
   LIGADA por padrão diante da Lei nº 15.211/2025 (configuração mais protetiva por padrão)?**
   Se não, a solução aceitável é desligar por padrão para todos, ou basta desligar no caminho
   de acesso escolar?
2. **O legítimo interesse (art. 7º, IX) se sustenta para essa medição, com titular criança,
   nos moldes do Enunciado CD/ANPD nº 1?** Que documentação do teste de balanceamento (art.
   10) é razoável manter para um controlador desse porte?
3. **Um controlador pessoa física, agente de tratamento de pequeno porte, precisa indicar
   encarregado (art. 41)?** Confirmar o alcance da dispensa prevista na Resolução CD/ANPD
   nº 2/2022 e se o canal de e-mail publicado basta.
4. **A transferência a PostHog Inc. e Vercel Inc. (EUA) exige assinatura de cláusulas-padrão da
   Resolução CD/ANPD nº 19/2024, ou os termos padrão dessas empresas já a atendem?**

---

## De onde veio cada afirmação — para a próxima sessão reconferir sem reler tudo

Nenhuma linha da política foi escrita a partir de documentação do repositório; todas vieram do
código, e duas foram medidas em navegador porque ler não bastava (R6 e R7). Onde conferir:

| Afirmação | Onde está no código |
| --- | --- |
| Os 11 eventos do jogo | `src/jogo.ts` — `medir("...")` nas linhas 3797, 4006, 4085, 7768, 12465, 12495, 12529, 12535, 15129, 15609, 15667, 15680, 15957 |
| O 12º evento, das páginas (`secao aberta`) | `ferramentas/medir-secao.js` — constantes `EVENTO` e `SECOES` |
| Propriedades permitidas, por evento | `test/encaixe.js` linhas 1378-1390 (`PERMITIDAS`, `ESPERADAS`) e `ferramentas/medir-secao.js` (`PERMITIDAS`) |
| `$ip: null`, `$process_person_profile: false`, `credentials: "omit"`, sem biblioteca | `src/jogo.ts` linhas 3951-3990 |
| Chave publicável `phc_`, e o build recusando outra | `src/jogo.ts` linha 3890 · `ferramentas/construir.js` |
| Host US e CSP travada | `ferramentas/medir-secao.js` (`MEDIDA_HOST`) · `src/jogo.ts` (`ENDERECO_MEDIDA`) · `vercel.json` |
| O identificador sorteado de 16 bytes | `src/jogo.ts` — `novoIdAnonimo()`, chave `jogo_brasil_anon` |
| **Nas páginas**, o ID só nasce com a medição ligada | `ferramentas/medir-secao.js`, função `id()` — só chamada depois do `if (!ligado) return`. **Medido** |
| **No jogo**, o ID só nasce com a medição ligada | `src/jogo.ts` — `medirGarantirId()`, chamada em `medirCarregar()` e no fim de `medir()`. **Consertado em 04/09 — era R6** |
| Desligar desliga de verdade (nada sai) | `src/jogo.ts` — `medir()` sai na 1ª linha se `!medirLigado`. **Medido: zero pedidos ao PostHog** |
| O botão APAGAR remove o ID | `src/jogo.ts` — `zerarJogo()` chama `removeItem(CHAVE_ANON)`, e não toca `jogo_brasil_medir`. **Consertado em 04/09 — era R7** |
| O interruptor é um só para jogo e páginas | chave `jogo_brasil_medir` compartilhada — `src/jogo.ts` linha 3934 e `ferramentas/medir-secao.js` |
| Interruptor na barra do topo | `ferramentas/medir-secao.js` — `ID_BOTAO`, `botaoHtml()`; subiu para o chrome em 23/08 |
| O que fica no aparelho | chaves `jogo_brasil_v1`, `jogo_brasil_retencao`, `jogo_brasil_medir`, `jogo_brasil_anon`, `jogo_brasil_muro` |
| O único campo de digitar, e que ele não sai | `src/index.html` linha 441 (`#glCampo`); não há propriedade de busca na lista branca |
| Nenhum nome é coletado | `jogo_brasil_muro` é **só lido**, nunca gravado — não existe `setItem(CHAVE_MURO)` no arquivo |
| Aviso de erro sem estado da partida, teto de 3 | `src/jogo.ts` — `medirErro()`, `MEDIDA_ERRO_TETO = 3`, e `medirArquivo()` corta consulta e âncora |
| Resposta da pergunta do fim é escolha entre três | `src/jogo.ts` linha 15635 — `VOLTA_RESPOSTAS = ["volto","talvez","nao"]`; não há campo livre |
| Nenhum formulário nas páginas | zero `<input>`, `<textarea>` e `<form>` em `plataforma/molde.html`, `glossario/`, `historia/`, `de-onde-vem/` |

**Uma correção ao que o CLAUDE.md §3 afirma:** ele lista **onze** eventos, e onze é o número
certo **para o jogo**. Com as páginas da plataforma, que passaram a medir em 22/08, o total é
**doze** — o 12º é `secao aberta`. A política descreve os doze, porque é o que de fato sai do
domínio. Vale corrigir a contagem no CLAUDE.md numa próxima passada; não fiz aqui porque não é
meu território.

---

## O que este arquivo pede de quem vier depois

**Do dono:** o nome do controlador, e a decisão de R1 (padrão da medição).

**R6 e R7 foram consertados em 04/09** (`medirGarantirId()` e o `removeItem(CHAVE_ANON)` em
`zerarJogo()`) — as duas seções acima já descrevem o conserto aplicado, não mais um achado
aberto.

**Do `dev-plataforma`:** montar a página `/privacidade` com este texto — sem reescrevê-lo,
porque cada frase da seção 2 à 8 foi conferida contra uma linha de código; ligar o link dela no
rodapé de todas as páginas e na tela de AJUSTES do jogo; e resolver o que a R5 aponta sobre
`/mesa` sem PIN.

**De quem mexer na medição, um dia:** acrescentar evento ou propriedade é **mudar esta
página**, no mesmo commit. A lista branca do `encaixe.js` bloco 17 é o portão técnico; esta
seção é o motivo jurídico de ele existir.
