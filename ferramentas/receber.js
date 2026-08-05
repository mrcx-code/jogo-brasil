// MESA DE ENTREGA — fora do jogo, de propósito.
//
// O jogo é `index.html`: um arquivo, zero rede, CSP fechada. Isto aqui não é o jogo. É uma
// ferramenta de sessão que roda só em localhost, nunca é publicada, e existe para uma coisa
// só: o dono gera uma imagem em outra ferramenta, COLA aqui, e o arquivo aparece no disco
// onde o pipeline consegue pegar. Sem isso, cada imagem custa uma ida e volta de link.
//
// Da mesma natureza do test/smoke.js, que também sobe um servidor Node. Não muda o jogo.
//
//   node ferramentas/receber.js      ->  http://localhost:8200

const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const ENTRADA = path.join(RAIZ, 'assets', 'entrada');
const PEDIDOS = path.join(__dirname, 'pedidos.json');
const PORTA = 8200;

fs.mkdirSync(ENTRADA, { recursive: true });

// Um nome de arquivo vindo do navegador é entrada não confiável, pela mesma razão que o save
// é: dá para escrever à mão. Só sobrevive o que eu mesmo poderia ter escrito.
function nomeSeguro(s) {
  return String(s || 'sem-nome').toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 60) || 'sem-nome';
}

function lerPedidos() {
  try { return JSON.parse(fs.readFileSync(PEDIDOS, 'utf8')); } catch (e) { return []; }
}

const servidor = http.createServer(function (req, res) {
  const url = req.url.split('?')[0];

  if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
    fs.readFile(path.join(__dirname, 'receber.html'), function (e, buf) {
      if (e) { res.writeHead(500).end('receber.html sumiu'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(buf);
    });
    return;
  }

  if (req.method === 'GET' && url === '/pedidos') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(lerPedidos()));
    return;
  }

  if (req.method === 'GET' && url === '/recebidas') {
    let f = [];
    try { f = fs.readdirSync(ENTRADA); } catch (e) {}
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(f));
    return;
  }

  // REVISAR: compara o que o jogo precisa (necessario.json) com o que ja chegou
  // (assets/entrada) e repoe na fila so o que falta. Existe porque a fila vinha sendo podada
  // a mao — por mim — e mao esquece. O servidor ja sabia o que tem em disco; faltava saber o
  // que o jogo consome.
  if (req.method === 'POST' && url === '/revisar') {
    let nec;
    try { nec = JSON.parse(fs.readFileSync(path.join(__dirname, 'necessario.json'), 'utf8')); }
    catch (e) { res.writeHead(500).end('necessario.json ilegivel'); return; }
    let tem = [];
    try { tem = fs.readdirSync(ENTRADA); } catch (e) {}
    const chegou = new Set(tem.map(function (f) { return f.replace(/\.(png|jpg|jpeg|webp)$/i, ''); }));
    const faltam = (nec.itens || []).filter(function (i) { return !chegou.has(i.nome); })
      .map(function (i, n) {
        return {
          nome: i.nome,
          titulo: (n + 1) + ' · ' + i.titulo,
          referencia: i.ref || '',
          tamanho: i.tam || '',
          origem: '',
          prompt: nec._estilo + "\n\n" + i.p + (i.semMagenta ? "" : nec._magenta)
        };
      });
    fs.writeFileSync(PEDIDOS, JSON.stringify(faltam, null, 2) + "\n");
    console.log('revisao: ' + faltam.length + ' pedidos repostos');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, n: faltam.length }));
    return;
  }

  if (req.method === 'POST' && url === '/salvar') {
    const pedacos = [];
    let total = 0;
    req.on('data', function (c) {
      total += c.length;
      if (total > 40 * 1024 * 1024) { req.destroy(); return; }   // teto: uma imagem, não um filme
      pedacos.push(c);
    });
    req.on('end', function () {
      let corpo;
      try { corpo = JSON.parse(Buffer.concat(pedacos).toString('utf8')); }
      catch (e) { res.writeHead(400).end('json inválido'); return; }

      const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(corpo.dados || '');
      if (!m) { res.writeHead(400).end('não é imagem png/jpeg/webp em data-uri'); return; }

      const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
      const nome = nomeSeguro(corpo.nome) + '.' + ext;
      const alvo = path.join(ENTRADA, nome);
      if (!alvo.startsWith(ENTRADA)) { res.writeHead(400).end('caminho fora da pasta'); return; }

      const buf = Buffer.from(m[2], 'base64');
      fs.writeFileSync(alvo, buf);
      // A anotação vai junto: sem ela, daqui a dois dias ninguém sabe de que prompt veio.
      fs.writeFileSync(alvo + '.txt',
        'pedido: ' + (corpo.pedido || '(sem pedido)') + '\n' +
        'origem: ' + (corpo.origem || '(não informada)') + '\n' +
        'bytes: ' + buf.length + '\n');
      console.log('recebida: ' + nome + '  (' + buf.length + ' bytes)  pedido=' + (corpo.pedido || '-'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, arquivo: 'assets/entrada/' + nome, bytes: buf.length }));
    });
    return;
  }

  res.writeHead(404).end('404');
});

servidor.listen(PORTA, '127.0.0.1', function () {
  console.log('mesa de entrega em http://localhost:' + PORTA);
  console.log('salvando em ' + ENTRADA);
});
