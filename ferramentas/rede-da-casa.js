// REDE DA CASA — separar "esta máquina não tem egresso para o host" de "a credencial está errada".
//
// POR QUE ESTE ARQUIVO EXISTE, e o número é o argumento inteiro (medido por
// nuvem-20260905T0822 em 05/09, contra a rede de verdade, os dois caminhos, host a host):
//
//   host                        | https CRU (direto)              | por TÚNEL CONNECT | quem usa
//   ----------------------------|---------------------------------|-------------------|----------
//   api.github.com              | 403 "API rate limit exceeded"   | HTTP 200          | checar-ci.js
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
const http = require('http');
const https = require('https');

// O SENTINELA DO PROXY — mesma constante e mesma razão do `checar-ci.js`: nesta máquina
// GH_TOKEN/GITHUB_TOKEN existem e valem a string literal "proxy-injected". Mandá-la como
// Bearer dá 401, e o 401 lê como credencial errada quando na verdade é credencial de mentira.
const SENTINELA_PROXY = 'proxy-injected';

// A ASSINATURA DA RECUSA DE EGRESSO, lida do corpo REAL da resposta medida acima. Não é
// adivinhação de forma: é a frase que o proxy desta rede escreve quando o host não está na
// lista. Se um dia ela mudar, o portão `test/rede-da-casa-veredito.js` continua exigindo que
// a classificação exista — o que não pode acontecer é a frase sumir e o caso virar "credencial".
const MARCA_SEM_EGRESSO = /host not in allowlist|not in the allowlist|blocked by (the )?proxy|egress (policy|denied)/i;

function proxyConfigurado() {
  const u = process.env.HTTPS_PROXY || process.env.https_proxy || '';
  if (!u) return null;
  try {
    const p = new URL(u);
    return { host: p.hostname, port: Number(p.port) || 80 };
  } catch (e) {
    return null;
  }
}

function credencialDeVerdade(valor) {
  return valor && valor !== SENTINELA_PROXY ? valor : '';
}

// CLASSIFICAR — a função inteira do arquivo, e ela é PURA de propósito: recebe o que a
// tentativa produziu e devolve o veredito, sem tocar rede. É isso que deixa o portão provar
// cada caminho por injeção, sem depender de a máquina do momento ter ou não ter saída.
//
//   { status, corpo, erroDoConnect, erroDeRede }  ->  { tipo, frase }
//
// tipo é um de: 'ok' · 'sem-egresso' · 'credencial' · 'falhou'
// e 'sem-egresso' NUNCA é 'credencial', nem 'ok', nem silêncio.
function classificar(host, r) {
  const t = r || {};
  const corpo = typeof t.corpo === 'string' ? t.corpo : '';

  // 1. O proxy recusou o próprio CONNECT: não há rota, ponto. Vem antes de tudo porque neste
  //    caminho não existe resposta do alvo para interpretar.
  if (t.erroDoConnect) {
    return {
      tipo: 'sem-egresso',
      frase: 'esta máquina não tem egresso para ' + host + ' — o proxy recusou o CONNECT ('
        + t.erroDoConnect + '). Não é credencial: nenhuma chave conserta rota que não existe.',
    };
  }

  // 2. Chegou resposta, mas quem respondeu foi o proxy dizendo que o host não é permitido.
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

  if (typeof t.status === 'number' && t.status >= 200 && t.status < 300) {
    return { tipo: 'ok', frase: 'HTTP ' + t.status };
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

function abrirTunel(proxy, destino, ms) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: proxy.host,
      port: proxy.port,
      method: 'CONNECT',
      path: destino + ':443',
      timeout: ms,
    });
    req.on('connect', (res, socket) => {
      if (res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      resolve(socket);
    });
    req.on('timeout', () => req.destroy(new Error('o proxy não respondeu ao CONNECT em ' + ms + 'ms')));
    req.on('error', reject);
    req.end();
  });
}

// PEDIR — o caminho honesto: túnel CONNECT quando há proxy configurado (é o que dá credencial
// injetada nos hosts permitidos), e sem proxy sai direto, idêntico ao de antes. Devolve SEMPRE
// o veredito já classificado, junto com status e corpo, para quem chamar não ter como voltar a
// contar a história só pelo número.
function pedir(host, caminho, opcoes) {
  const o = opcoes || {};
  const ms = o.timeout || 15000;
  return new Promise(async (resolve) => {
    const proxy = proxyConfigurado();
    let socket = null;
    if (proxy) {
      try {
        socket = await abrirTunel(proxy, host, ms);
      } catch (e) {
        const r = { erroDoConnect: e.message };
        resolve(Object.assign(r, { host, veredito: classificar(host, r) }));
        return;
      }
    }
    const req = https.request(
      Object.assign(
        {
          hostname: host,
          path: caminho,
          method: o.method || 'GET',
          timeout: ms,
          headers: Object.assign({ 'User-Agent': 'jogo-brasil', Accept: '*/*' }, o.headers || {}),
        },
        socket ? { socket, agent: false } : {}
      ),
      (res) => {
        let corpo = '';
        res.on('data', (d) => { if (corpo.length < 4096) corpo += d; });
        res.on('end', () => {
          const r = { status: res.statusCode, corpo };
          resolve(Object.assign(r, { host, veredito: classificar(host, r) }));
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      const r = { erroDeRede: 'timeout em ' + ms + 'ms' };
      resolve(Object.assign(r, { host, veredito: classificar(host, r) }));
    });
    req.on('error', (e) => {
      const r = { erroDeRede: e.code || e.message };
      resolve(Object.assign(r, { host, veredito: classificar(host, r) }));
    });
    if (o.corpo) req.write(o.corpo);
    req.end();
  });
}

module.exports = { classificar, pedir, proxyConfigurado, credencialDeVerdade, SENTINELA_PROXY, MARCA_SEM_EGRESSO };
