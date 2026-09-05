// REDE DA CASA — separar "esta máquina não tem egresso para o host" de "a credencial está errada".
//
// POR QUE ESTE ARQUIVO EXISTE, e o número é o argumento inteiro (medido por
// nuvem-20260905T0822 em 05/09, contra a rede de verdade, os dois caminhos, host a host):
//
//   host                        | https CRU (direto)              | por TÚNEL CONNECT | quem usa
//   ----------------------------|---------------------------------|-------------------|----------
//   api.github.com  /actions/…  | 403 "API rate limit exceeded"   | HTTP 200          | checar-ci.js
//     (ressalva do QA: esse 403 e do ENDPOINT, nao do host — /rate_limit nao consome quota
//      e responde 200 ate direto. O host esta na lista; o que falta direto e o token.)
//   servicodados.ibge.gov.br    | 403 "Host not in allowlist"     | CONNECT recusa 403| baixar-malha.js
//   <projeto>.supabase.co       | 403 "Host not in allowlist"     | CONNECT recusa 403| conferir-agentes.js, conteudo-puxar.js
//   us.posthog.com              | 403 "Host not in allowlist"     | CONNECT recusa 403| ler-medicao.js
//   matheusferreira.cc          | 403 "Host not in allowlist"     | CONNECT recusa 403| test/checar-infra.js
//   us.i.posthog.com            | 403 "Host not in allowlist"     | CONNECT recusa 403| test/checar-infra.js
//
// ISSO DERRUBA O CONSERTO QUE O ITEM PRESCREVIA, e é o achado que mais importa aqui. O item
// `ferramenta-que-fala-com-a-rede-nao-honra-o-proxy-da-nuvem` mandava "dar a todos o mesmo
// caminho do checar-ci.js (túnel CONNECT quando há HTTPS_PROXY)". O túnel NÃO conserta nenhuma
// das outras cinco: o proxy recusa o próprio CONNECT para os hosts delas, por política de
// egresso. O `checar-ci.js` sarou porque `api.github.com` está na lista de saída permitida — e
// o que o túnel lhe deu não foi rota, foi CREDENCIAL (o proxy injeta o token na passagem;
// direto, sem token, o GitHub responde o 403 de limite anônimo). São duas coisas diferentes que
// saem com o mesmo número, e é exatamente aí que a casa vinha se enganando.
//
// A DOENÇA, e ela é a mesma que o `checar-ci.js` foi escrito para curar, entrando por outra
// porta: os dois casos chegam como **HTTP 403**, e uma ferramenta que só guarda o número conta
// a história errada. Medido nesta mesma rodada, no `conferir-agentes.js`: ele imprimia
//
//     AVISO: não consegui ler `mesa_agente` (HTTP 403) — conferência pulada.
//
// e quem lê isso vai caçar chave do Supabase, RLS, política — que não é o problema. O corpo da
// resposta dizia "Host not in allowlist" e era jogado fora antes de alguém olhar. Um plantão
// sem ninguém por perto perde a rodada nessa caça.
//
// A REGRA QUE ESTE ARQUIVO CUMPRE: falta de egresso nunca se disfarça de erro de credencial, e
// NUNCA vira verde. Classificar é obrigação de quem fala com a rede; o número sozinho não basta.
// A ASSINATURA DA RECUSA DE EGRESSO, lida do corpo REAL da resposta medida acima. Não é
// adivinhação de forma: é a frase que o proxy desta rede escreve quando o host não está na
// lista. Se um dia ela mudar, o portão `test/rede-da-casa-veredito.js` continua exigindo que
// a classificação exista — o que não pode acontecer é a frase sumir e o caso virar "credencial".
// GAP 4 DO QA: a marca era literal no espaco em branco, entao `Host  not  in  allowlist`
// (espaco duplo) ou quebrada em duas linhas ja caia em 'credencial' -- e o corpo de um
// proxy pode vir quebrado por largura. O `\s+` fecha isso sem afrouxar nada mais.
const MARCA_SEM_EGRESSO = /host\s+not\s+in\s+(the\s+)?allowlist|blocked\s+by\s+(the\s+)?proxy|egress\s+(policy|denied)/i;

// REDIGIR — achado do PORTEIRO em 05/09, consertado no mesmo fôlego em vez de virar "quando
// alguém adotar". O caso 'credencial' abaixo repete um pedaço do CORPO da resposta na frase, e
// essa frase vai para o log do CI, que é PÚBLICO. Hoje isso é inofensivo, e o porteiro provou
// por medição: o único chamador usa a chave anon publicável, que já está em texto puro no
// repositório. Mas repare de onde vem a segurança — vem de QUEM CHAMA, não desta função. É
// exatamente esse tipo de garantia que evapora quando a segunda ferramenta liga o mesmo caminho,
// e o item `quatro-ferramentas-ainda-reportam-o-numero-cru` já está na fila para ligar quatro.
// Aqui a garantia passa a ser da função: quem chama pode declarar segredos, e as formas de
// credencial que esta casa usa somem POR FORMA, mesmo sem ninguém declarar nada.
const FORMAS_DE_SEGREDO = [
  /Bearer\s+[A-Za-z0-9._~+/=-]{8,}/gi,              // cabeçalho de auth ecoado de volta
  /\bey[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}/g, // JWT (o Supabase usa)
  /\bsb_(publishable|secret)_[A-Za-z0-9_-]{8,}/g,   // chave do Supabase, das duas naturezas
  /\bph[cx]_[A-Za-z0-9_-]{8,}/g,                    // PostHog: a de ingestão e a de leitura
  /\bgh[pousr]_[A-Za-z0-9]{8,}/g,                   // token do GitHub
];

function redigir(texto, segredos) {
  let s = String(texto == null ? '' : texto);
  // 1. o que quem chama DECLAROU — vence sempre, inclusive quando não casa forma nenhuma
  for (const seg of segredos || []) {
    if (typeof seg === 'string' && seg.length >= 8) s = s.split(seg).join('[REDIGIDO]');
  }
  // 2. e as formas conhecidas, para o esquecimento de quem chama não virar vazamento
  for (const forma of FORMAS_DE_SEGREDO) s = s.replace(forma, '[REDIGIDO]');
  return s;
}

// CLASSIFICAR — a função inteira do arquivo, e ela é PURA de propósito: recebe o que a
// tentativa produziu e devolve o veredito, sem tocar rede. É isso que deixa o portão provar
// cada caminho por injeção, sem depender de a máquina do momento ter ou não ter saída.
//
//   { status, corpo, erroDoConnect, erroDeRede }  ->  { tipo, frase }
//
// tipo é um de: 'ok' · 'sem-egresso' · 'credencial' · 'falhou'
// e 'sem-egresso' NUNCA é 'credencial', nem 'ok', nem silêncio.
function classificar(host, r, opcoes) {
  const t = r || {};
  const segredos = (opcoes && opcoes.segredos) || [];
  // R2 DO QA (05/09): era `typeof t.corpo === 'string' ? … : ''`, e isso DESCARTAVA EM SILÊNCIO
  // um corpo `Buffer` — que é exatamente o que `res.on('data')` entrega. Com a marca do proxy
  // dentro de um Buffer, a falta de egresso voltava a ser 'credencial': o defeito de 05/09
  // reentrando pela porta do contrato, dentro do módulo escrito para impedi-lo.
  const corpo = t.corpo == null ? '' : redigir(String(t.corpo), segredos);
  const foi2xx = typeof t.status === 'number' && t.status >= 200 && t.status < 300;

  // 1. O CONNECT não completou. Aqui não existe resposta do alvo para interpretar — mas
  //    "CONNECT não completou" NÃO É UMA COISA SÓ, e tratar as três como falta de egresso era
  //    cometer, do outro lado da cerca, o pecado que este arquivo nomeia (R3 do QA):
  //    407 é o proxy pedindo CREDENCIAL, e dizer "não é credencial" ali era mentira redonda.
  if (t.erroDoConnect) {
    const e = String(t.erroDoConnect);
    if (/\b407\b/.test(e)) {
      return {
        tipo: 'credencial',
        frase: 'o proxy exigiu autenticação para abrir o túnel até ' + host + ' (' + e
          + '). Isto É credencial — do PROXY, não do destino: a rota existe e falta a chave dela.',
      };
    }
    if (/\bHTTP\s*\d{3}\b/.test(e)) {
      return {
        tipo: 'sem-egresso',
        frase: 'esta máquina não tem egresso para ' + host + ' — o proxy recusou o CONNECT ('
          + e + '). Não é credencial: nenhuma chave conserta rota que não existe.',
      };
    }
    // timeout, ECONNREFUSED, proxy fora do ar: não se SABE se há egresso. Afirmar que não há
    // seria a mesma afirmação sem evidência que este arquivo cobra dos outros.
    return {
      tipo: 'falhou',
      frase: 'não deu para abrir o túnel até ' + host + ' (' + e + '), e isto não diz se falta'
        + ' egresso ou se o proxy está fora do ar — não afirme nenhum dos dois.',
    };
  }

  // 2. O 2xx VEM ANTES DA MARCA, e a ordem é o achado R1 do QA — o mais bonito da rodada.
  //    Antes a marca era testada primeiro, então um HTTP **200 de verdade** cujo CORPO citasse
  //    a frase do proxy saía como "não tem egresso... o pedido nunca chegou ao destino" — uma
  //    frase que se contradiz sozinha, porque um 2xx É a prova de que chegou. E o gatilho não é
  //    hipotético: a mensagem de commit desta própria entrega contém "Host not in allowlist"
  //    três vezes, e volta em `head_commit.message` pela API de commits do GitHub, que é
  //    justamente o que o `checar-ci.js` lê. É a doença curada ao contrário: máquina COM
  //    egresso mandada caçar rede que não falta.
  if (foi2xx) {
    return { tipo: 'ok', frase: 'HTTP ' + t.status };
  }

  // 3. Chegou resposta de erro, e quem respondeu foi o proxy dizendo que o host não é permitido.
  //    O NÚMERO é 403, igual ao de uma credencial recusada — o CORPO é que separa os dois,
  //    e é por isso que quem chama tem de guardar o corpo em vez de só o status.
  if (MARCA_SEM_EGRESSO.test(corpo)) {
    return {
      tipo: 'sem-egresso',
      frase: 'esta máquina não tem egresso para ' + host + ' — o proxy respondeu HTTP '
        + (t.status || '?') + ' com "host não permitido". Não é credencial: o pedido nunca'
        + ' chegou ao destino.',
    };
  }

  // 3. Agora sim: 401/403 vindos do PRÓPRIO destino são credencial/permissão.
  if (t.status === 401 || t.status === 403) {
    return {
      tipo: 'credencial',
      frase: host + ' respondeu HTTP ' + t.status + ' e o pedido CHEGOU nele — isto é'
        + ' credencial ou permissão, não rota.'
        + (corpo ? ' Disse: ' + corpo.slice(0, 160).replace(/\s+/g, ' ') : ''),
    };
  }

  if (t.erroDeRede) {
    return { tipo: 'falhou', frase: 'a chamada a ' + host + ' falhou: ' + t.erroDeRede };
  }

  return {
    tipo: 'falhou',
    frase: host + ' respondeu HTTP ' + (t.status || '?')
      + (corpo ? ' — ' + corpo.slice(0, 160).replace(/\s+/g, ' ') : ''),
  };
}

module.exports = { classificar, redigir, MARCA_SEM_EGRESSO };
