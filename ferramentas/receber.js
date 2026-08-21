// A MESA — só subir imagem, e mais nada. Decisão do dono em 21/08:
//
//   "a mesa que é onde eu subo as imagens e pode remover todo o resto, é só pra subir imagem
//    agora. E no celular [...] dashboard [...]. Os dois como mesa fica estranho."
//
// A separação que ele pediu: PLATAFORMA (pública, com o jogo dentro) · MESA (isto aqui —
// localhost, colar imagem -> assets/entrada/) · DASHBOARD (o painel interativo do celular, em
// matheusferreira.cc/dashboard, que herdou fila/decisões/agentes/conversa via backend).
// Tudo que esta ferramenta tinha além do upload — fila de arte, atividade, pendências —
// morreu aqui nesta data; o histórico está no git (ferramentas/receber.js antes de 21/08).
//
//   node ferramentas/receber.js      ->  http://localhost:8200

const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const ENTRADA = path.join(RAIZ, 'assets', 'entrada');
const PORTA = 8200;

fs.mkdirSync(ENTRADA, { recursive: true });

// Nome vindo do navegador é entrada não confiável, pela mesma razão que o save é.
function nomeSeguro(s) {
  return String(s || 'sem-nome').toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 60) || 'sem-nome';
}

http.createServer(function (req, res) {
  const url = req.url.split('?')[0];

  if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
    fs.readFile(path.join(__dirname, 'receber.html'), function (e, buf) {
      if (e) { res.writeHead(500).end('receber.html sumiu'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(buf);
    });
    return;
  }

  if (req.method === 'POST' && url === '/salvar') {
    const pd = [];
    let total = 0;
    req.on('data', function (c) {
      total += c.length;
      if (total > 40 * 1024 * 1024) { res.writeHead(413).end('grande demais'); req.destroy(); return; }
      pd.push(c);
    });
    req.on('end', function () {
      let corpo;
      try { corpo = JSON.parse(Buffer.concat(pd).toString('utf8')); }
      catch (e) { res.writeHead(400).end(JSON.stringify({ ok: false, erro: 'json inválido' })); return; }
      const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(corpo.dataUri || '');
      if (!m) { res.writeHead(400).end(JSON.stringify({ ok: false, erro: 'não é imagem png/jpeg/webp em data-uri' })); return; }
      const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
      const nome = nomeSeguro(corpo.nome).replace(/\.(png|jpe?g|webp)$/i, '') + '.' + ext;
      const alvo = path.normalize(path.join(ENTRADA, nome));
      if (!alvo.startsWith(ENTRADA)) { res.writeHead(400).end(JSON.stringify({ ok: false, erro: 'caminho fora da pasta' })); return; }
      const buf = Buffer.from(m[2], 'base64');
      fs.writeFileSync(alvo, buf);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, arquivo: 'assets/entrada/' + nome, bytes: buf.length }));
    });
    return;
  }

  res.writeHead(404).end('404');
}).listen(PORTA, '127.0.0.1', function () {
  console.log('MESA (só subir imagem) em http://localhost:' + PORTA + ' -> assets/entrada/');
});
