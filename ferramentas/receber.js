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

function lerJson(nome, vazio) {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, nome), 'utf8')); }
  catch (e) { return vazio; }
}

// ---------------------------------------------------------------------------
// A ORDEM DE APARIÇÃO NO JOGO — e por que ela NÃO é a ordem do nome do arquivo.
//
// O manifesto não tem campo de ordem, então ela é DERIVADA do nome. Mas derivar
// "cap1 → cap2 → cap3 → cap4" estaria errado: os nomes de arte foram criados numa
// ordem e as épocas do jogo estão em outra. `EPOCAS` no src/jogo.ts é
// PINDORAMA(0) · PALMARES(1) · SALVADOR(2) · AINDA AQUI(3) — e a arte de SALVADOR
// se chama `cap4-*`, a do presente `cap3-*`. Ordenar pelo número do nome poria o
// capítulo do presente antes de Salvador, ou seja, antes do que ele mesmo comenta.
//
// As páginas do quadrinho (`q-p*`) entram junto da época que contam, não num bloco
// separado: a tela A HISTÓRIA abre desde o começo, e a p2 (Lagoa Santa) é dos
// primeiros cinco minutos enquanto a p26 é do fim. A faixa de página por época vem
// da própria LINHA_TEMPO.
const ERA_DO_CAP = { 1: 0, 2: 1, 3: 3, 4: 2 };     // número no nome  ->  índice de EPOCAS

function ordemDe(nome) {
  const n = String(nome || '');
  if (/^(menu|logo)/.test(n)) return { ordem: -1000, onde: 'menu · antes de tudo' };
  // páginas do quadrinho: a faixa numérica diz de que época a página fala
  const q = /^q-p0?(\d+)/.exec(n);
  if (q) {
    const p = parseInt(q[1], 10);
    const era = p <= 6 ? 0 : p <= 13 ? 1 : p <= 19 ? 2 : 3;
    return { ordem: era * 1000 + p, onde: 'A HISTÓRIA · página ' + p };
  }
  if (/^trav-/.test(n)) return { ordem: 1 * 1000 - 1, onde: 'A TRAVESSIA · antes de Palmares' };
  if (/vao-cidade-africana/.test(n)) return { ordem: 2 * 1000 - 1, onde: 'marco do vão · antes de Salvador' };
  const c = /cap(\d)/.exec(n);
  if (c) {
    const era = ERA_DO_CAP[c[1]];
    const nomes = ['PINDORAMA', 'PALMARES', 'SALVADOR', 'AINDA AQUI'];
    if (era !== undefined) return { ordem: era * 1000 + 100, onde: 'capítulo ' + nomes[era] };
  }
  return { ordem: 9000, onde: 'sem ordem derivável do nome' };
}

// ---------------------------------------------------------------------------
// O ESTADO DE CADA ITEM DO MANIFESTO. Três estados, e confundir dois deles é o bug
// que esvaziou a mesa: o dono abriu, o manifesto tinha 61 itens, e a tela não mostrou
// um só pedido.
//
//   GERAR  — não há arquivo em disco, OU há e ele foi RECUSADO depois de entregue.
//   CHEGOU — o arquivo está em disco e ainda não entrou no jogo. A bola é minha.
//   PRONTO — está registrado em processadas.json e nada mais novo chegou por cima.
//
// A CAUSA REAL, medida em 09/08: o `/revisar` decidia "já resolvido" só de existir um
// arquivo com aquele nome em `assets/entrada`. Como TODOS os 61 itens do manifesto já
// tinham recebido pelo menos uma entrega, a fila dava ZERO — inclusive para as três
// folhas de corrida recusadas por §2 e para o refazer da p19, que continuavam sendo
// trabalho do dono. Entregue não é aceito, e aceito não é integrado: agora são três
// estados, cruzados por DATA e por registro explícito, nunca por "o arquivo existe".
function estadoDaFila() {
  const nec = lerJson('necessario.json', { itens: [] });
  const proc = lerJson('processadas.json', { itens: [], quando: {} });
  const rec = lerJson('recusadas.json', { itens: [] });

  const feito = new Set(proc.itens || []);
  const procEm = proc.quando || {};
  const recusa = {};
  (rec.itens || []).forEach(function (r) {
    if (!recusa[r.n] || recusa[r.n].em < r.em) recusa[r.n] = r;
  });

  const arquivo = {};
  let disco = [];
  try { disco = fs.readdirSync(ENTRADA); } catch (e) {}
  disco.filter(function (f) { return !/\.txt$/i.test(f); }).forEach(function (f) {
    const nome = f.replace(/\.(png|jpg|jpeg|webp)$/i, '');
    let quando = '';
    try { quando = fs.statSync(path.join(ENTRADA, f)).mtime.toISOString().slice(0, 16).replace('T', ' '); } catch (e) {}
    if (!arquivo[nome] || arquivo[nome].quando < quando) arquivo[nome] = { f: f, quando: quando };
  });

  const itens = (nec.itens || []).map(function (i) {
    const arq = arquivo[i.nome] || null;
    const r = recusa[i.nome] || null;
    // Recusa só vale enquanto for MAIS NOVA que o arquivo: colar por cima resolve.
    const recusadoAgora = !!(r && (!arq || arq.quando <= r.em));
    const emProc = feito.has(i.nome);
    // Re-entrega: o arquivo é mais novo que a data em que o nome entrou no registro.
    const reentrega = !!(emProc && arq && procEm[i.nome] && arq.quando > procEm[i.nome]);
    const estado = (!arq || recusadoAgora) ? 'gerar'
      : (!emProc || reentrega) ? 'chegou' : 'pronto';
    const o = ordemDe(i.nome);
    return {
      nome: i.nome,
      arquivoEsperado: i.nome + '.png',
      titulo: i.titulo || i.nome,
      referencia: i.ref || '',
      tamanho: i.tam || '',
      estado: estado,
      quandoChegou: arq ? arq.quando : '',
      arquivo: arq ? arq.f : '',
      recusa: recusadoAgora ? { porque: r.porque || '', onde: r.onde || '', em: r.em || '' } : null,
      reentrega: reentrega,
      ordem: o.ordem,
      onde: o.onde,
      prompt: (nec._estilo || '') + "\n\n" + i.p + (i.semMagenta ? "" : (nec._magenta || ''))
    };
  }).sort(function (a, b) { return a.ordem - b.ordem || (a.nome < b.nome ? -1 : 1); });

  // Chegou em disco SEM estar no manifesto: entrega que ninguém pediu, ou nome trocado.
  // Não some — é exatamente o caso que já custou duas entregas perdidas.
  const noManifesto = new Set((nec.itens || []).map(function (i) { return i.nome; }));
  const soltas = Object.keys(arquivo).filter(function (n) {
    return !noManifesto.has(n) && !feito.has(n);
  }).map(function (n) {
    return { nome: n, quando: arquivo[n].quando, arquivo: arquivo[n].f };
  }).sort(function (a, b) { return a.quando < b.quando ? 1 : -1; });

  return {
    itens: itens,
    soltas: soltas,
    ordemDerivada: true,
    contagem: {
      gerar: itens.filter(function (i) { return i.estado === 'gerar'; }).length,
      chegou: itens.filter(function (i) { return i.estado === 'chegou'; }).length,
      pronto: itens.filter(function (i) { return i.estado === 'pronto'; }).length,
      soltas: soltas.length,
      total: itens.length
    }
  };
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

  // A FILA INTEIRA, num cálculo só. A tela não cruza nada: quem cruza é o servidor, que é
  // quem tem o disco. Antes a página lia /pedidos (um arquivo escrito à mão pelo REVISAR) e
  // /recebidas (nomes crus), e remontava o estado no navegador — três fontes para uma
  // verdade, e a verdade ficou perdida entre elas.
  if (req.method === 'GET' && url === '/fila') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(estadoDaFila()));
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

  // O que está parado esperando o dono. Substituiu o roadmap: para onde o jogo vai já mora
  // no BACKLOG.md e no PRODUTO.md — o que faltava era a lista do que eu não decido sozinho.
  if (req.method === 'GET' && url === '/pendencias') {
    let r = null;
    try { r = fs.readFileSync(path.join(__dirname, 'pendencias.json'), 'utf8'); } catch (e) {}
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(r || '{}');
    return;
  }

  // A SALA DE MÁQUINAS: onde a equipe está. O dono pediu o painel dentro da mesa ("gosto
  // mais do layout da sala de máquinas"), então a mesa deixou de ser só entrega de arte e
  // virou o lugar único: quem trabalha em quê, o que já entrou, e o que espera nele.
  if (req.method === 'GET' && url === '/equipe') {
    let r = null;
    try { r = fs.readFileSync(path.join(__dirname, 'equipe.json'), 'utf8'); } catch (e) {}
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(r || '{}');
    return;
  }

  // O QUE CHEGOU E AINDA NAO ENTROU NO JOGO. Entregue e processado eram a mesma coisa —
  // o pedido sumia da fila quando o arquivo caia no disco, e a mesa dizia "fila vazia"
  // tanto para "nada pedido" quanto para "tudo entregue e ninguem olhou". Custou DUAS
  // entregas perdidas no mesmo dia (07/08): as 11 imagens da manha e a folha v2 das 15:59.
  // Agora o disco e comparado com o que o src/jogo.ts realmente embutiu.
  // O QUE CHEGOU E AINDA NAO ENTROU NO JOGO. Entregue e processado eram a mesma coisa —
  // o pedido sumia da fila quando o arquivo caia no disco, e a mesa dizia "fila vazia"
  // tanto para "nada pedido" quanto para "tudo entregue e ninguem olhou". Custou DUAS
  // entregas perdidas no mesmo dia (07/08): as 11 imagens da manha e a folha v2 das 15:59.
  // O registro do que entrou e EXPLICITO (processadas.json): a primeira versao adivinhava
  // procurando o nome do arquivo no src/jogo.ts e dava falso positivo, porque as ferramentas
  // de arte nao gravam o nome da origem — elas escrevem base64.
  // Agora sai do mesmo `estadoDaFila()` que alimenta a lista do que falta, para os dois
  // blocos nunca poderem discordar.
  if (req.method === 'GET' && url === '/chegadas') {
    const e = estadoDaFila();
    const itens = e.itens.filter(function (i) { return i.estado === 'chegou'; })
      .map(function (i) {
        return { nome: i.nome, quando: i.quandoChegou, titulo: i.titulo, reentrega: i.reentrega };
      })
      .concat(e.soltas.map(function (s) {
        return { nome: s.nome, quando: s.quando, titulo: '(fora do manifesto)', reentrega: false };
      }))
      .sort(function (a, b) { return a.quando < b.quando ? 1 : -1; });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(itens));
    return;
  }

  // REVISAR: compara o que o jogo precisa (necessario.json) com o que já chegou
  // (assets/entrada) e repõe na fila só o que falta. Existe porque a fila vinha sendo podada
  // à mão — por mim — e mão esquece. O servidor já sabia o que tem em disco; faltava saber o
  // que o jogo consome.
  // Guarda a resposta do dono junto da pergunta. Grava no MESMO arquivo, para a resposta e a
  // pendencia nunca se separarem.
  if (req.method === 'POST' && url === '/responder') {
    const pd = [];
    req.on('data', function (c) { pd.push(c); });
    req.on('end', function () {
      let corpo;
      try { corpo = JSON.parse(Buffer.concat(pd).toString('utf8')); }
      catch (e) { res.writeHead(400).end('json invalido'); return; }
      const arq = path.join(__dirname, 'pendencias.json');
      let d;
      try { d = JSON.parse(fs.readFileSync(arq, 'utf8')); }
      catch (e) { res.writeHead(500).end('pendencias.json ilegivel'); return; }
      const alvo = (d.itens || []).find(function (i) { return i.t === corpo.t; });
      if (!alvo) { res.writeHead(404).end('pendencia nao achada'); return; }
      // RESPONDIDA SAI DA LISTA. O dono: "quero poder escrever no campo e enviar, fazendo
      // com que a pendencia suma". A resposta nao se perde: vai para respondidas.json, que
      // e o meu material de leitura. Se a resposta GERAR outra pendencia, quem a cria sou
      // eu, com a pergunta nova escrita por inteiro.
      alvo.resposta = String(corpo.resposta || '').slice(0, 2000);
      alvo.respondidaEm = new Date().toISOString().slice(0, 16).replace('T', ' ');
      d.itens = (d.itens || []).filter(function (i) { return i.t !== corpo.t; });
      const arqLidas = path.join(__dirname, 'respondidas.json');
      let lidas = { _: 'Respostas do dono, tiradas da fila. Leio antes de cada sessao.', itens: [] };
      try { lidas = JSON.parse(fs.readFileSync(arqLidas, 'utf8')); } catch (e) {}
      (lidas.itens = lidas.itens || []).unshift(alvo);
      fs.writeFileSync(arqLidas, JSON.stringify(lidas, null, 2) + "\n");
      fs.writeFileSync(arq, JSON.stringify(d, null, 2) + "\n");
      console.log('RESPONDIDA e arquivada: ' + corpo.t);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, saiu: true, restam: d.itens.length }));
    });
    return;
  }

  // REVISAR deixou de DECIDIR a fila e passou a só GRAVÁ-LA. O cálculo é o mesmo de /fila,
  // que a página já lê sozinha a cada 15 s — o botão existe agora só para deixar em disco
  // (`pedidos.json`) o retrato do que falta, que é o que eu leio entre sessões. Enquanto ele
  // decidia, a fila só existia depois que alguém clicava: o `pedidos.json` estava com uma
  // lista VAZIA gravada, e a mesa abria dizendo "fila vazia" sem ter perguntado nada a
  // ninguém. Tela que só diz a verdade depois de um clique é tela que mente por padrão.
  if (req.method === 'POST' && url === '/revisar') {
    const e = estadoDaFila();
    const faltam = e.itens.filter(function (i) { return i.estado === 'gerar'; })
      .map(function (i, n) {
        return {
          nome: i.nome, titulo: (n + 1) + ' · ' + i.titulo, referencia: i.referencia,
          tamanho: i.tamanho, origem: '', prompt: i.prompt
        };
      });
    fs.writeFileSync(PEDIDOS, JSON.stringify(faltam, null, 2) + "\n");
    console.log('revisao: ' + faltam.length + ' a gerar · ' + e.contagem.chegou +
      ' chegaram e esperam · ' + e.contagem.pronto + ' no jogo');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, n: faltam.length, contagem: e.contagem }));
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
