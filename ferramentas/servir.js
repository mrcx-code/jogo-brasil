// Servidor estático local. Existe porque `npm start` usava `python3 -m http.server`, e
// `python3` não existe no Windows desta máquina. Node já é dependência do projeto.
//
// Não confunda com ferramentas/receber.js: aquele é a MESA (subir imagem de arte), na 8200.
//
//   node ferramentas/servir.js [porta] [pasta]
//
// SEM pasta: serve a RAIZ do repositório — o index.html da raiz é o JOGO, e é assim que o
// `npm start` e os instrumentos sempre abriram. COM pasta, serve aquela subpasta como raiz do
// site — é o que faz `dist` virar a PLATAFORMA local (decidido pelo dono em 21/08: o localhost
// principal deixa de ser "o jogo" e passa a ser "a plataforma em si", que tem o jogo dentro):
//
//   node ferramentas/servir.js 8199 dist        -> localhost:8199 = porta na raiz, /jogo/,
//                                                  /historia, /territorio, /dashboard...
//   node ferramentas/servir.js 8203 dashboard   -> localhost:8203 = só o dashboard
//
// Servindo pasta, diretório sem barra final redireciona 301 para a barra — a MESMA regra do
// trailingSlash da Vercel, e pelo mesmo motivo: o fetch dos pack-*.json é relativo, e /jogo
// sem barra resolveria o pacote na raiz (404 de arte). Paridade com produção ou o localhost
// mente sobre o que a produção faz.

const http = require('http');
const fs = require('fs');
const path = require('path');
const pinLocal = require('./pin-local.js');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = parseInt(process.argv[2] || '8199', 10);
const PASTA = process.argv[3] ? path.resolve(RAIZ, process.argv[3]) : RAIZ;
if (!PASTA.startsWith(RAIZ)) { console.error('pasta fora do repositório'); process.exit(1); }
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8'
};

http.createServer(function (req, res) {
  // /pin-local — o auto-login do dashboard na maquina do dono (PENDENTES 57). Vem ANTES do
  // caminho estatico porque nao ha arquivo nenhum com esse nome, e depois dele a resposta seria
  // o 404 do readFile. Quem nao e loopback, ou nao tem o arquivo, recebe exatamente esse mesmo
  // 404: `atender` devolve false e a rota simplesmente nao existe para ele. Todo o porque
  // (loopback, o que o PIN alcanca, por que o plantao nunca le o arquivo) mora em pin-local.js.
  if (pinLocal.atender(req, res)) return;
  let rel = decodeURIComponent(req.url.split('?')[0]);
  let alvo = path.normalize(path.join(PASTA, rel));
  // Sem isto, `GET /../../algo` serve qualquer arquivo do disco.
  if (!alvo.startsWith(PASTA)) { res.writeHead(403).end('fora da raiz'); return; }
  try {
    if (fs.statSync(alvo).isDirectory()) {
      if (!rel.endsWith('/')) { res.writeHead(301, { Location: rel + '/' }).end(); return; }
      alvo = path.join(alvo, 'index.html');
    }
  } catch (e) { /* não existe: o readFile abaixo responde 404 */ }
  fs.readFile(alvo, function (err, buf) {
    if (err) { res.writeHead(404).end('404'); return; }
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(alvo).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'   // o index.html tem 2,4 MB e muda o tempo todo
    });
    res.end(buf);
  });
}).listen(PORTA, '127.0.0.1', function () {
  console.log((PASTA === RAIZ ? 'jogo (raiz do repo)' : 'servindo ' + path.relative(RAIZ, PASTA) + '/')
    + ' em http://localhost:' + PORTA);
});
