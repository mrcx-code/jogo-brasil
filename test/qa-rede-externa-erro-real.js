// ERRO REAL QUE SE PARECE COM RUÍDO DE REDE — o teste que a doença histórica deste item pede.
// QA, 05/09.
//
// Em 04/09 o filtro por SUBSTRING DE TEXTO engoliu 2 de 3 erros REAIS fabricados. `rede-externa.js`
// nasceu para consertar isso decidindo pela ORIGEM. `test/filtro-console-controle.js` já mede seis
// cenas — mas nenhuma delas é um erro do PRÓPRIO domínio que morre com a MESMA frase do ruído
// (`net::ERR_...`), que é o caso em que uma regra por origem pode escorregar de volta.
//
// AS CENAS DESTE ARQUIVO, todas num Chromium de verdade, com `m.location().url` real:
//
//   cena                                                        origem do erro        veredito
//   ─────────────────────────────────────────────────────────── ───────────────────── ────────
//   A  o host da medição não é alcançável (o ruído legítimo)     MEDIDA_HOST           CALAR
//   B  fetch do PRÓPRIO domínio que MORRE no meio (socket        127.0.0.1 (self)      ACUSAR
//      destruído: net::ERR_..., a MESMA frase do ruído)
//   C  net::ERR_ vindo de um host externo que NÃO é o da         outro host            ACUSAR
//      medição (o túnel recusa qualquer host aqui)
//   D  console.error() do jogo cujo TEXTO contém as palavras     self (script)         ACUSAR
//      do ruído — o defeito exato de 04/09
//   E  erro de console SEM url de origem                         (vazia)               ACUSAR
//
// A cena B é a que decide se a entrega reproduziu o defeito antigo com nome novo: mesma frase,
// origem diferente. Se ela CALAR, um `fetch` do próprio jogo que morre some do portão.
//
//   node test/qa-rede-externa-erro-real.js
'use strict';

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { ehRuidoDeRedeExterna, MEDIDA_HOST } = require('./rede-externa.js');

function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) if (p && fs.existsSync(p)) return p;
  return undefined;
}
// porta derivada do caminho da raiz, para não colidir com outra rodada nesta máquina
const PORTA = 9200 + (Array.from(path.resolve(__dirname, '..')).reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 500, 7));

const PAGINA = `<!doctype html><meta charset="utf-8"><title>sonda</title><body>sonda</body>`;

const CENAS = [
  { id: 'A', nome: 'o host da medição não é alcançável (ruído legítimo da máquina)', espera: 'calar' },
  { id: 'B', nome: 'fetch do PRÓPRIO domínio que morre no meio (net::ERR_ de self)', espera: 'acusar' },
  { id: 'C', nome: 'net::ERR_ de um host externo que NÃO é o da medição', espera: 'acusar' },
  { id: 'D', nome: 'console.error() do jogo com as palavras do ruído no texto', espera: 'acusar' },
  { id: 'E', nome: 'erro de console SEM url de origem', espera: 'acusar' },
];

(async () => {
  const srv = http.createServer((req, res) => {
    if (req.url === '/morre') { req.socket.destroy(); return; }       // cena B: mata a conexão
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(PAGINA);
  });
  await new Promise(r => srv.listen(PORTA, '127.0.0.1', r));
  const BASE = 'http://127.0.0.1:' + PORTA;

  const nav = await chromium.launch({ executablePath: chromiumPath() });
  const pg = await (await nav.newContext({ viewport: { width: 390, height: 844 } })).newPage();

  const vistos = [];
  pg.on('console', function (m) {
    if (m.type() !== 'error') return;
    const url = (m.location && m.location().url) || '';
    vistos.push({ url, txt: m.text(), engoliu: ehRuidoDeRedeExterna(m) });
  });

  await pg.goto(BASE + '/', { waitUntil: 'load' });

  // A — o host da medição (o proxy deste contêiner recusa; num contêiner com saída, o
  // endereço abaixo não existe e devolve outro net::ERR_ — nos dois casos é net::ERR_ do host)
  await pg.evaluate(async (h) => { try { await fetch(h + '/i/v0/e/', { method: 'POST', body: '{}' }); } catch (e) { } }, MEDIDA_HOST);
  // B — o PRÓPRIO domínio, morrendo no meio
  await pg.evaluate(async () => { try { await fetch('/morre'); } catch (e) { } });
  // C — outro host externo
  await pg.evaluate(async () => { try { await fetch('https://exemplo-que-nao-existe.invalid/x'); } catch (e) { } });
  // D — console.error do próprio jogo com as palavras do ruído
  await pg.evaluate((p) => { console.error('falha ao montar a fala: ' + p); },
    'net::ERR_TUNNEL_CONNECTION_FAILED em posthog');
  await pg.waitForTimeout(1500);
  await nav.close();
  srv.close();

  // classificação das cenas pelo que o Chromium realmente escreveu
  function achar(f) { return vistos.filter(f); }
  const cA = achar(v => v.url.indexOf(MEDIDA_HOST) === 0);
  // NOTA HISTÓRICA (achado do QA em 05/09, RESOLVIDO no mesmo dia): esta palavra era montada por
  // concatenação (`'ERR' + '_'`) de propósito, porque `test/rede-externa-sem-copia.js` procurava
  // texto no arquivo inteiro e REPROVAVA ESTA SONDA — ele não distinguia quem DECIDE por texto
  // de quem CLASSIFICA uma cena fabricada. Portão que obriga a burlá-lo ensina a burlá-lo. O
  // portão passou a ler o arquivo como CÓDIGO, e a palavra voltou a ser escrita por extenso.
  const MARCA_REDE = 'net::ERR_';
  const cB = achar(v => v.url.indexOf(BASE) === 0 && v.txt.indexOf(MARCA_REDE) >= 0);
  const cC = achar(v => /exemplo-que-nao-existe\.invalid/.test(v.url) || /exemplo-que-nao-existe\.invalid/.test(v.txt));
  const cD = achar(v => /falha ao montar a fala/.test(v.txt));
  const cE = achar(v => !v.url);

  // cena E também medida como UNIDADE, porque uma mensagem sem url nem sempre aparece no
  // navegador headless — e "não consegui fabricar" não pode virar "está coberto"
  const falso = { type: () => 'error', text: () => 'Failed to load resource: ' + MARCA_REDE + 'TUNNEL_CONNECTION_FAILED', location: () => ({ url: '' }) };
  const eUnidade = ehRuidoDeRedeExterna(falso);

  const grupos = { A: cA, B: cB, C: cC, D: cD, E: cE };
  console.log('ERROS DE CONSOLE VISTOS (' + vistos.length + '), com a origem que o Chromium deu:');
  vistos.forEach(v => console.log('   ' + (v.engoliu ? 'CALADO ' : 'ACUSADO') + '  url=' + (v.url || '(vazia)').slice(0, 58).padEnd(58) + ' ' + v.txt.slice(0, 70)));

  console.log('\n  ' + 'cena'.padEnd(64) + 'n  esperado  obtido');
  let falhas = 0, naoFabricadas = [];
  CENAS.forEach(function (c) {
    const g = grupos[c.id];
    if (!g.length) {
      if (c.id === 'E') {
        const obtido = eUnidade ? 'calar' : 'acusar';
        const certo = obtido === c.espera;
        if (!certo) falhas++;
        console.log('  ' + (c.id + '. ' + c.nome).padEnd(64) + '0  ' + c.espera.padEnd(9) + obtido + '  (medida como UNIDADE: o headless não emitiu erro sem url)');
        return;
      }
      naoFabricadas.push(c.id);
      console.log('  ' + (c.id + '. ' + c.nome).padEnd(64) + '0  ' + c.espera.padEnd(9) + '— NÃO FABRICADA');
      return;
    }
    const calou = g.every(v => v.engoliu);
    const obtido = calou ? 'calar' : (g.some(v => v.engoliu) ? 'misto' : 'acusar');
    const certo = obtido === c.espera;
    if (!certo) falhas++;
    console.log('  ' + (c.id + '. ' + c.nome).padEnd(64) + String(g.length).padStart(1) + '  ' + c.espera.padEnd(9) + obtido + '  ' + (certo ? 'ok' : '*** FORA DA PROMESSA ***'));
  });

  if (naoFabricadas.length) {
    console.log('\n  CENAS QUE NÃO ACONTECERAM NESTA MÁQUINA: ' + naoFabricadas.join(', ') +
      ' — não são verde nem vermelho, são medida que faltou. Diga isso no relatório em vez de somar como ok.');
  }
  console.log('\n' + (falhas ? 'REPROVOU (' + falhas + ' cena[s] fora da promessa de rede-externa.js)' :
    'PASSOU — nenhum erro REAL parecido com ruído foi engolido'));
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
