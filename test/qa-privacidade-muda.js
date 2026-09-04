// QA — A PÁGINA /privacidade/ É MUDA: ela não faz pedido de rede NENHUM (04/09).
//
// POR QUE ESTE ARQUIVO EXISTE, se o `test/csp-paginas.js` já conta `medicoes`. Porque aquele
// contador é uma ROTA DE UM HOST SÓ: `pg.route('https://us.i.posthog.com/**')`. Ele responde
// "a página falou com o PostHog?" e nada mais. A afirmação que a página faz de si mesma é maior
// — o rodapé dela diz "ela é a única da plataforma que não envia evento nenhum", e o §3 do
// CLAUDE.md diz que afirmação de privacidade falsa é pior que nenhuma. Então a pergunta a medir
// é OUTRA: **quantos pedidos de rede esta página faz, para qualquer destino?**
//
// A diferença entre as duas perguntas é o buraco por onde passa: um `fetch` para um host novo,
// um `navigator.sendBeacon`, um `new Image().src`, um `<link rel=prefetch>`, uma fonte remota.
// Nenhum deles apareceria no contador de `medicoes`; todos aparecem aqui.
//
// O QUE ELE MEDE, e cada um responde uma pergunta que o outro não responde:
//   1. TODOS os pedidos que a página dispara, do documento em diante, com CSP aplicada;
//   2. o mesmo COM O INTERRUPTOR DESLIGADO e COM ELE LIGADO (o estado não pode mudar a resposta);
//   3. o mesmo DEPOIS DE CLICAR no interruptor — é a única interação que a página tem;
//   4. quais chaves de `localStorage` a página escreve (a seção 4 do texto afirma que o número
//      sorteado "nem chega a ser sorteado" nas páginas da plataforma);
//   5. um CONTROLE POSITIVO: a mesma medição em `/historia/`, que DEVE fazer o pedido. Sem ele
//      este arquivo passaria mesmo que o instrumento estivesse cego (EQUIPE.md 2.8).
//
// COMO RODAR:  node test/qa-privacidade-muda.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');

const RAIZ = path.resolve(__dirname, '..');
const DIST = path.join(RAIZ, 'dist');
const PORTA = 9411;
const falhas = [];
const ok = (cond, msg) => { console.log('  ' + (cond ? 'ok ' : 'X  ') + msg); if (!cond) falhas.push(msg); };

// ---------------------------------------------------------------- os cabeçalhos do vercel.json
// Mesma resolução que a Vercel faz: a última regra cujo `source` casa com a rota vence. Não
// reimplemento a CSP aqui — ela sai do arquivo que vai ao ar, senão eu testaria a minha opinião.
const VERCEL = JSON.parse(fs.readFileSync(path.join(RAIZ, 'vercel.json'), 'utf8'));
function cabecalhosDaRota(rota) {
  const saida = {};
  for (const r of VERCEL.headers || []) {
    const re = new RegExp('^' + String(r.source).replace(/\(\.\*\)/g, '.*') + '$');
    if (re.test(rota)) for (const h of r.headers) saida[h.key] = h.value;
  }
  return saida;
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.js': 'text/javascript',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.xml': 'application/xml' };
const servidor = http.createServer(function (req, res) {
  const rel = decodeURIComponent(String(req.url).split('?')[0]);
  let alvo = path.join(DIST, rel);
  try { if (fs.statSync(alvo).isDirectory()) alvo = path.join(alvo, 'index.html'); } catch (e) {}
  fs.readFile(alvo, function (err, buf) {
    if (err) { res.writeHead(404).end('404'); return; }
    res.writeHead(200, Object.assign({
      'Content-Type': TIPOS[path.extname(alvo).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    }, cabecalhosDaRota(rel)));
    res.end(buf);
  });
});

// Um pedido para o documento da própria rota não conta: é a navegação, e sem ela não há página.
// Tudo o mais conta — inclusive o favicon, que o Chromium pede sozinho e que por isso é listado
// à parte em vez de anistiado em silêncio.
async function sondar(nav, rota, opcoes) {
  const o = opcoes || {};
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  const pg = await ctx.newPage();
  const pedidos = [];
  pg.on('request', r => pedidos.push({ url: r.url(), tipo: r.resourceType(), metodo: r.method() }));
  // a rota do PostHog é respondida aqui para o pedido, se existir, não morrer por DNS e sumir
  await pg.route('https://us.i.posthog.com/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"status":1}' }));
  if (o.medirDesligado != null) {
    await ctx.addInitScript(v => {
      try { localStorage.setItem('jogo_brasil_medir', v); } catch (e) {}
    }, o.medirDesligado ? 'nao' : 'sim');
  }
  await pg.goto('http://127.0.0.1:' + PORTA + rota, { waitUntil: 'load', timeout: 45000 });
  await pg.waitForTimeout(2500);
  if (o.clicar) {
    await pg.click('#medirBt').catch(() => {});
    await pg.waitForTimeout(1500);
    await pg.click('#medirBt').catch(() => {});
    await pg.waitForTimeout(1500);
  }
  const chaves = await pg.evaluate(() => { try { return Object.keys(localStorage); } catch (e) { return ['<sem acesso>']; } });
  await ctx.close();
  const doc = 'http://127.0.0.1:' + PORTA + rota;
  const fora = pedidos.filter(p => p.url !== doc);
  return { pedidos, fora, chaves };
}

(async function () {
  await new Promise(r => servidor.listen(PORTA, '127.0.0.1', r));
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });

  // 5. O CONTROLE POSITIVO PRIMEIRO. Se ele não vir o pedido de /historia/, nada abaixo vale.
  console.log('\nCONTROLE POSITIVO — /historia/ TEM de falar com a medicao');
  const ctrl = await sondar(nav, '/historia/', {});
  const medCtrl = ctrl.fora.filter(p => p.url.indexOf('posthog.com') >= 0);
  ctrl.fora.forEach(p => console.log('      pedido  ' + p.metodo + ' ' + p.tipo + ' ' + p.url.slice(0, 78)));
  ok(medCtrl.length >= 1, '/historia/ fez ' + medCtrl.length + ' pedido(s) a posthog.com — o instrumento ENXERGA'
    + (medCtrl.length ? '' : '. Cego: nada abaixo prova coisa alguma'));

  // 1-4. A POLÍTICA, nos quatro estados.
  const casos = [
    ['medicao no padrao (ligada)', {}],
    ['medicao DESLIGADA no localStorage', { medirDesligado: true }],
    ['medicao LIGADA no localStorage', { medirDesligado: false }],
    ['clicando o interruptor duas vezes', { clicar: true }],
  ];
  for (const [nome, o] of casos) {
    console.log('\n/privacidade/ — ' + nome);
    const s = await sondar(nav, '/privacidade/', o);
    s.fora.forEach(p => console.log('      pedido  ' + p.metodo + ' ' + p.tipo + ' ' + p.url.slice(0, 78)));
    const externos = s.fora.filter(p => !/\/favicon\.ico$/.test(p.url));
    ok(externos.length === 0, '[' + nome + '] zero pedido de rede alem do documento — fez ' + externos.length
      + (externos.length ? ': ' + externos.map(p => p.url.slice(0, 60)).join(' | ') : ''));
    console.log('      localStorage: ' + (s.chaves.length ? s.chaves.join(', ') : '(vazio)'));
    ok(s.chaves.indexOf('jogo_brasil_anon') < 0,
      '[' + nome + '] a pagina NAO sorteia o identificador `jogo_brasil_anon` — a secao 4 do texto'
      + ' afirma que "nas paginas da plataforma ele nem chega a ser sorteado"');
    const estranhas = s.chaves.filter(k => k !== 'jogo_brasil_medir');
    ok(estranhas.length === 0, '[' + nome + '] a unica chave escrita e `jogo_brasil_medir`'
      + (estranhas.length ? ' — apareceu tambem: ' + estranhas.join(', ') : ''));
  }

  await nav.close();
  servidor.close();
  console.log('');
  if (falhas.length) { console.error('REPROVADO — ' + falhas.length + ' problema(s)'); process.exit(1); }
  console.log('ok — /privacidade/ e muda: zero pedido de rede em 4 estados, e o controle positivo enxerga.');
})().catch(e => { console.error(e); process.exit(2); });
