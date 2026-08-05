// Servidor estático para abrir o jogo no navegador. Existe porque `npm start` usava
// `python3 -m http.server`, e `python3` não existe no Windows desta máquina — é só um atalho
// para a loja da Microsoft. Node já é dependência do projeto (o smoke test roda nele), então
// servir com Node não acrescenta nada que já não estivesse aqui.
//
// Não confunda com ferramentas/receber.js: aquele é a mesa de entrega, na 8200. Este serve
// o jogo, na 8199.
//
//   node ferramentas/servir.js [porta]

const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = parseInt(process.argv[2] || '8199', 10);
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'
};

http.createServer(function (req, res) {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const alvo = path.normalize(path.join(RAIZ, rel));
  // Sem isto, `GET /../../algo` serve qualquer arquivo do disco.
  if (!alvo.startsWith(RAIZ)) { res.writeHead(403).end('fora da raiz'); return; }
  fs.readFile(alvo, function (err, buf) {
    if (err) { res.writeHead(404).end('404'); return; }
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(alvo).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'   // o index.html tem 2,7 MB e muda o tempo todo
    });
    res.end(buf);
  });
}).listen(PORTA, '127.0.0.1', function () {
  console.log('jogo em http://localhost:' + PORTA);
});
