// ABRIR O JOGO NUM INSTRUMENTO — por http, nunca mais por file://.
//
// POR QUE ISTO EXISTE, e o motivo é o mesmo que tirou o smoke test do `file://` em 10/08:
// desde a CARGA SOB DEMANDA a arte dos capítulos 2+ chega por `fetch("pack-*.json")`, e o
// Chromium **recusa** esse fetch sob `file://` (provado em `test/peso-file-fetch.js`). Um
// instrumento que abrisse o jogo por `file://` continuaria rodando lindamente e mediria a arte
// do capítulo 1 achando que estava medindo a do capítulo 3 — print bonito, número errado,
// nenhum aviso. São quase quarenta instrumentos neste repositório; deixar todos assim seria
// fabricar quarenta medições silenciosamente falsas.
//
// COMO USAR: envolva o alvo que você já monta.
//
//     const ABRIR = require('./abrir.js');
//     const ALVO = ABRIR('file://' + path.resolve(__dirname, '..', 'index.html'));
//
// A função devolve `http://127.0.0.1:8198/<caminho>` para qualquer arquivo .html DENTRO do
// repositório, e devolve o que recebeu, intocado, para todo o resto. É por isso que envolver
// é seguro em bloco: as ferramentas de arte que abrem um PNG de `assets/entrada` passam por
// aqui sem mudar de comportamento, e uma URL http já pronta também.
//
// A PORTA É FIXA (8198) e isso é uma escolha, não descuido. Um `listen(0)` daria porta livre
// garantida, mas só a informa num callback — e aí esta função teria de ser assíncrona, o que
// obrigaria a mexer no corpo de cada um dos quarenta instrumentos em vez de envolver uma
// expressão. 8198 é a porta ao lado das duas que este projeto já usa (8199 o jogo, 8200 a
// mesa), ou seja, é nossa. Se ela já estiver ocupada, o mais provável de longe é que seja
// OUTRO instrumento deste repositório servindo esta mesma pasta — e nesse caso seguir em frente
// é exatamente o certo. Por isso o EADDRINUSE é engolido com um aviso, e não com um estouro.
const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = 8198;
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
};

let servidor = null;
function subir() {
  if (servidor) return;
  servidor = http.createServer(function (req, res) {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '') || 'index.html';
    const alvo = path.normalize(path.join(RAIZ, rel));
    if (!alvo.startsWith(RAIZ) || !fs.existsSync(alvo)) { res.writeHead(404).end('404'); return; }
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(alvo).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(fs.readFileSync(alvo));
  });
  servidor.on('error', function (e) {
    if (e && e.code === 'EADDRINUSE') {
      console.log('(a porta ' + PORTA + ' já está servindo — usando quem já está lá)');
      return;
    }
    throw e;
  });
  servidor.listen(PORTA, '127.0.0.1');
  // Sem isto o instrumento nunca termina: um servidor ouvindo segura o laço de eventos aberto,
  // e as ferramentas que não chamam process.exit() ficariam penduradas para sempre.
  servidor.unref();
}

module.exports = function abrir(u) {
  const s = String(u);
  if (/^https?:/i.test(s)) return s;
  if (!/^file:\/{2,3}/i.test(s)) return s;
  // `file:///C:/x` e `file://C:/x` chegam os dois; a barra que sobra antes da letra do disco
  // some aqui, e é só no Windows que ela existe.
  const cru = decodeURI(s.replace(/^file:\/{2,3}/i, '')).replace(/^\/(?=[A-Za-z]:)/, '');
  const abs = path.resolve(cru);
  if (!abs.startsWith(RAIZ)) return s;      // arte de entrada, arquivo solto: file:// serve
  if (!/\.html?$/i.test(abs)) return s;     // não é uma página, é matéria-prima
  subir();
  return 'http://127.0.0.1:' + PORTA + '/' + path.relative(RAIZ, abs).split(path.sep).join('/');
};
