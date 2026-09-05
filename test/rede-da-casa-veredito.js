// REDE-DA-CASA-VEREDITO — prova que "esta máquina não tem egresso" nunca é reportado como
// "credencial errada", e nunca vira verde.
//
// A ASSERÇÃO QUE ESTE PORTÃO EXISTE PARA COBRAR nasceu de um caso REAL, medido em 05/09 por
// nuvem-20260905T0822 e não de hipótese: `ferramentas/conferir-agentes.js` imprimia
// "não consegui ler mesa_agente (HTTP 403)" quando o corpo da resposta dizia, por extenso,
// "Host not in allowlist". O número era o mesmo de uma chave recusada; a causa, outra. Quem
// lesse aquilo iria caçar chave do Supabase e perder a rodada.
//
// TUDO AQUI É INJETADO, SEM TOCAR REDE — `classificar()` é pura de propósito, então cada
// caminho é provado com a resposta que a rede de verdade produziu naquele dia, gravada como
// literal abaixo. Um portão de rede que precisa de rede não roda no CI nem numa máquina sem
// saída, que são justamente os dois lugares onde ele precisaria rodar.
const { classificar, MARCA_SEM_EGRESSO } = require('../ferramentas/rede-da-casa.js');

let falhas = 0;
function ok(cond, txt) {
  console.log((cond ? '  ok   ' : '  FALHA ') + txt);
  if (!cond) falhas++;
}

// Os corpos são os REAIS, medidos em 05/09 nos dois caminhos, host a host.
const CORPO_SEM_EGRESSO = 'Host not in allowlist: hdhqziqvrthxtgyraemk.supabase.co';
const CORPO_RATE_LIMIT_GITHUB =
  '{"message":"API rate limit exceeded for 136.111.196.80. (But here\'s the good news:'
  + ' Authenticated requests get a higher rate limit.)"}';

console.log('\n---- 403 do PROXY (host fora da lista) é SEM-EGRESSO, nunca credencial, nunca verde');
{
  const v = classificar('hdhqziqvrthxtgyraemk.supabase.co', { status: 403, corpo: CORPO_SEM_EGRESSO });
  ok(v.tipo === 'sem-egresso', 'tipo é sem-egresso (veio: ' + v.tipo + ')');
  ok(v.tipo !== 'credencial', 'NÃO é classificado como credencial — era este o engano de 05/09');
  ok(v.tipo !== 'ok', 'NÃO é verde');
  ok(/não tem egresso/.test(v.frase), 'a frase diz que falta EGRESSO, não que a chave está errada');
  ok(/Não é credencial/.test(v.frase), 'e diz por extenso que não é credencial, para ninguém sair caçando chave');
}

console.log('\n---- CONNECT recusado pelo proxy também é SEM-EGRESSO (não há resposta do alvo)');
{
  const v = classificar('us.posthog.com', { erroDoConnect: 'HTTP 403' });
  ok(v.tipo === 'sem-egresso', 'tipo é sem-egresso (veio: ' + v.tipo + ')');
  ok(/CONNECT/.test(v.frase), 'a frase nomeia o CONNECT recusado, que é a evidência');
  ok(!/^HTTP 403$/.test(v.frase), 'não reduz o caso ao número, que é o que confundia');
}

console.log('\n---- 403 do PRÓPRIO destino (chegou nele) É credencial — a distinção nos dois sentidos');
{
  const v = classificar('api.github.com', { status: 403, corpo: CORPO_RATE_LIMIT_GITHUB });
  ok(v.tipo === 'credencial', 'tipo é credencial (veio: ' + v.tipo + ')');
  ok(v.tipo !== 'sem-egresso', 'NÃO vira sem-egresso — senão o portão só sabe dizer uma coisa e não separa nada');
  ok(/CHEGOU/.test(v.frase), 'a frase afirma que o pedido chegou ao destino');
}
{
  const v = classificar('exemplo.test', { status: 401, corpo: 'no api key' });
  ok(v.tipo === 'credencial', '401 sem a marca do proxy também é credencial');
}

console.log('\n---- 2xx é ok, e só 2xx');
{
  ok(classificar('h', { status: 200, corpo: '{}' }).tipo === 'ok', '200 é ok');
  ok(classificar('h', { status: 204, corpo: '' }).tipo === 'ok', '204 é ok');
  ok(classificar('h', { status: 500, corpo: 'boom' }).tipo === 'falhou', '500 é falhou, não ok');
  ok(classificar('h', { erroDeRede: 'ECONNRESET' }).tipo === 'falhou', 'erro de socket é falhou, não ok');
}

console.log('\n---- NENHUMA entrada vira silêncio: todo caminho devolve tipo e frase');
{
  const entradas = [
    {}, { status: 0 }, { corpo: '' }, { status: 403 }, { status: 302, corpo: '' },
    { erroDoConnect: '' }, { erroDeRede: '' }, null, undefined,
  ];
  const maus = entradas.filter((e) => {
    const v = classificar('h', e);
    return !v || !v.tipo || !v.frase || !['ok', 'sem-egresso', 'credencial', 'falhou'].includes(v.tipo);
  });
  ok(maus.length === 0, entradas.length + ' entradas de borda, todas com tipo e frase (' + maus.length + ' sem)');
  ok(classificar('h', {}).tipo !== 'ok', 'entrada vazia NUNCA é verde — é o pior desfecho possível e tem asserção própria');
  ok(classificar('h', { status: 403 }).tipo === 'credencial',
    '403 sem corpo cai em credencial: sem a evidência do corpo, não se AFIRMA falta de egresso');
}

console.log('\n---- CREDENCIAL NUNCA VAI PARA O LOG (achado do porteiro em 05/09)');
{
  // O log do CI é PÚBLICO, e o caso 'credencial' repete um pedaço do corpo na frase. As formas
  // abaixo são as que ESTA casa usa; a última é a garantia para quem chama, que vence mesmo
  // quando o segredo não tem forma reconhecível.
  const casos = [
    ['Bearer ecoado', 'no permission for Bearer eyJhbGciOiJIUzI1NiJ9.aaaaaaaaaa.bbbbbbbb', []],
    ['JWT solto', '{"msg":"bad jwt eyJhbGciOi.QpayloadXX.sigsigsig"}', []],
    ['chave Supabase', 'invalid key sb_publishable_kR7pCuqZrPAr24Xdr0F4Nw', []],
    ['chave PostHog', 'bad token phc_aBcDeFgHiJkLmNoP e phx_9z8y7x6w5v4u3t2s', []],
    ['token GitHub', 'bad credentials ghp_AbCdEfGhIjKlMnOpQrStUvWxYz0123', []],
    ['segredo DECLARADO sem forma nenhuma', 'recusado: senha-sem-forma-alguma-123', ['senha-sem-forma-alguma-123']],
  ];
  for (const [nome, corpo, segredos] of casos) {
    const v = classificar('h', { status: 401, corpo }, { segredos });
    const cru = corpo.split(/\s+/).filter((p) => p.length >= 8 && /[A-Za-z0-9_-]{8,}/.test(p));
    const vazou = cru.filter((p) => v.frase.includes(p) && !/^(recusado|permission|credentials)/.test(p));
    ok(v.tipo === 'credencial', nome + ': continua sendo classificado como credencial');
    ok(/\[REDIGIDO\]/.test(v.frase), nome + ': a frase traz [REDIGIDO] no lugar do segredo');
    ok(vazou.length === 0, nome + ': nenhum pedaço longo do corpo sobreviveu na frase (' + vazou.join(' ') + ')');
  }
}
{
  const v = classificar('h', { status: 401, corpo: 'sem segredo nenhum aqui' });
  ok(/sem segredo nenhum aqui/.test(v.frase),
    'e o corpo SEM segredo continua legível — redigir tudo seria perder a evidência que a frase existe para dar');
}

console.log('\n---- CONTROLE: o portão foi visto reprovando (mutante na marca do proxy)');
{
  // O mutante é o defeito exato que a casa cometia: perder a evidência do corpo e decidir
  // pelo número. Aqui ele é simulado apagando a marca do corpo antes de classificar.
  const comMutante = classificar('h', { status: 403, corpo: CORPO_SEM_EGRESSO.replace(/allowlist/, 'xxxxxxxxx') });
  ok(comMutante.tipo === 'credencial',
    'com a marca destruída, o MESMO 403 cai em credencial — é isto que a asserção acima impede');
  ok(MARCA_SEM_EGRESSO.test(CORPO_SEM_EGRESSO),
    'e a marca de verdade casa o corpo real medido em 05/09 (se deixar de casar, o portão acima cai sozinho)');
}

console.log('\n' + (falhas === 0 ? 'PASSOU' : ('FALHOU — ' + falhas + ' asserç' + (falhas === 1 ? 'ão' : 'ões'))));
process.exit(falhas === 0 ? 0 : 1);
