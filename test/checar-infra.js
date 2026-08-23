// A CHECAGEM DE INFRA — nasceu de um susto, em 2026-08-19.
//
// POR QUE ELE EXISTE. O texto do loop afirmava, havia dias, "rotina na nuvem armada para 8h07
// diários". Não existia: uma sessão anterior TENTOU armá-la, falhou, e escreveu a intenção como
// se fosse fato. Eu li e repeti sem checar. O dono perguntou, com razão, "o que mais tem lá que
// estamos usando como regra?".
//
// A LIÇÃO, e ela é a única que importa: afirmação sobre INFRAESTRUTURA ("está no ar", "publica
// sozinho", "a chave está lá") é verificável por comando. Repeti-la de memória é o modo de falha.
// Este arquivo verifica, em vez de afirmar. Rode-o no começo da sessão e no fim; o que ele diz é
// o estado REAL, não o que algum texto guardou.
//
// O QUE ELE NÃO COBRE, e é honesto dizer: decisão atribuída ao dono não é infra e não se checa
// por comando — só ele confere. As de §2 foram conferidas por ele em 19/08 (ver NOTES.md).
const https = require('https');

const cabeca = (url, ms = 25000) => new Promise((ok) => {
  const req = https.request(url, { method: 'GET', timeout: ms }, (r) => {
    let n = 0;
    r.on('data', (c) => { n += c.length; });
    r.on('end', () => ok({ status: r.statusCode, bytes: n }));
  });
  req.on('error', (e) => ok({ status: 0, erro: e.code || e.message }));
  req.on('timeout', () => { req.destroy(); ok({ status: 0, erro: 'timeout' }); });
  req.end();
});

(async () => {
  const linhas = [];
  let falhou = 0;
  const diz = (ok, rot, detalhe) => {
    linhas.push('  ' + (ok ? '✓' : '✗') + ' ' + rot.padEnd(46) + detalhe);
    if (!ok) falhou++;
  };

  // 1. PRODUÇÃO NO AR. A lei diz que o jogo mora em matheusferreira.cc, na raiz.
  const prod = await cabeca('https://matheusferreira.cc');
  diz(prod.status === 200, 'produção (matheusferreira.cc)', 'HTTP ' + (prod.status || prod.erro));

  // 2. OS PACOTES DE ARTE ao lado do jogo — é a exceção do arquivo único, e se some, capítulo 2+
  // roda com a arte do capítulo 1 em silêncio.
  //
  // O ENDEREÇO É `/jogo/`, NÃO A RAIZ, e este portão ficou vermelho pelo motivo errado até
  // 22/08. A porta da plataforma passou a ser a raiz em 20/08 (D-home) e o jogo mudou para
  // `dist/jogo/`, com os pacotes AO LADO dele — o `fetch` de `caminhoPacote()` é RELATIVO, então
  // é assim que tem de ser. Medido na produção antes de mexer: raiz responde 404, `/jogo/`
  // responde 200. Um portão de infra que acusa falta do que existe ensina a ignorar o vermelho,
  // que é o oposto do motivo pelo qual este arquivo foi escrito.
  const pack = await cabeca('https://matheusferreira.cc/jogo/pack-praca.json');
  diz(pack.status === 200, 'pacote de arte no ar (jogo/pack-praca.json)', 'HTTP ' + (pack.status || pack.erro));

  // 3. PUSH PUBLICA SOZINHO. Não se prova sem um push novo; o que se prova é que a Vercel está
  // servindo — a prévia da vercel.app responde.
  const verc = await cabeca('https://jogo-brasil-mrcx.vercel.app');
  diz(verc.status === 200, 'Vercel serve (jogo-brasil-mrcx)', 'HTTP ' + (verc.status || verc.erro));

  // 4. O HOST DA MEDIÇÃO responde. Não prova que evento chega ao painel — prova que o endereço
  // da CSP está vivo. O painel só o dono vê.
  const ph = await cabeca('https://us.i.posthog.com/static/array.js');
  diz(ph.status === 200 || ph.status === 404, 'host PostHog alcançável (us.i)', 'HTTP ' + (ph.status || ph.erro) + (ph.status === 404 ? ' — raiz 404 é normal' : ''));

  console.log('\nCHECAGEM DE INFRA — o estado REAL, verificado agora, não repetido de memória\n');
  console.log(linhas.join('\n'));
  console.log('\n' + (falhou ? '✗ ' + falhou + ' item(ns) FORA DO AR — a lei está afirmando algo que não é verdade agora.'
    : '✓ tudo no ar. As afirmações de infra da lei conferem neste instante.') + '\n');
  process.exit(falhou ? 1 : 0);
})();
