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
// A PORTA É SÍNCRONA, e isso é uma escolha, não descuido. Um `listen(0)` daria porta livre
// garantida, mas só a informa num callback — e aí esta função teria de ser assíncrona, o que
// obrigaria a mexer no corpo de cada um dos quarenta instrumentos em vez de envolver uma
// expressão. Então a porta é calculada, não sorteada, e o EADDRINUSE é engolido com um aviso.
//
// ELA DEIXOU DE SER 8198 FIXA EM 2026-08-10, E O MOTIVO CUSTOU MEIA SESSÃO. O comentário
// antigo dizia: "se ela já estiver ocupada, o mais provável de longe é que seja OUTRO
// instrumento deste repositório servindo esta mesma pasta — e nesse caso seguir em frente é
// exatamente o certo". A premissa é falsa desde que passou a haver `.claude/worktrees/`: são
// dezenas de cópias do repositório no disco, cada uma com um `index.html` PRÓPRIO, e todas
// pedindo a mesma 8198. Quem chega depois encontra a porta ocupada, aceita o servidor de
// outra pasta e mede o arquivo de outra pessoa — sem erro, sem aviso, com print bonito.
//
// Aconteceu de verdade nesta sessão: uma regra de CSS recém-construída "não aplicava". Ela
// aplicava; o navegador estava lendo o `index.html` de outra árvore. É o mesmo modo de falha
// que tirou o smoke test do `file://` — instrumento que mede a coisa errada e passa.
//
// A correção mantém a API síncrona: a porta sai de um HASH DO CAMINHO DA RAIZ. Duas cópias
// diferentes nunca pedem a mesma porta; duas execuções da MESMA cópia pedem, e aí reaproveitar
// continua sendo exatamente o certo — que era a intenção original.
const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
// 8192..8447: 256 portas acima do bloco que este projeto já usa (8199 o jogo, 8200 a mesa),
// e as duas ficam de fora da faixa por construção — o hash roda em 254 e soma 8201.
const PORTA = 8201 + (function (s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 254;
})(RAIZ.toLowerCase());
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
  //
  // TIRA-SE `file://` E NUNCA A TERCEIRA BARRA — a versão anterior (`\/{2,3}`) comia três, e
  // isso QUEBRAVA TODO O CI DESDE 20/08 16:22 sem quebrar máquina Windows nenhuma: no Linux,
  // `file:///home/runner/.../index.html` virava `home/runner/...` RELATIVO, o resolve colava
  // o cwd na frente, o caminho terminava em .html e começava com a RAIZ — então o servidor
  // subia feliz e devolvia 404 para um arquivo que não existe. A régua via uma página "404"
  // sem #telaMenu e reprovava com "menu não existe" em todas as telas. No Windows a terceira
  // barra é lixo de sintaxe antes de `C:` e comê-la era inofensivo — por isso o defeito só
  // aparecia no runner. A terceira barra do POSIX é o começo do caminho; fica.
  const cru = decodeURI(s.replace(/^file:\/\//i, '')).replace(/^\/(?=[A-Za-z]:)/, '');
  const abs = path.resolve(cru);
  if (!abs.startsWith(RAIZ)) return s;      // arte de entrada, arquivo solto: file:// serve
  if (!/\.html?$/i.test(abs)) return s;     // não é uma página, é matéria-prima
  subir();
  return 'http://127.0.0.1:' + PORTA + '/' + path.relative(RAIZ, abs).split(path.sep).join('/');
};

// ONDE ESTA O CHROMIUM — a definicao CANONICA, e ela mora aqui pelo mesmo motivo que o
// servidor mora aqui: e o modulo que os instrumentos ja carregam.
//
// O DEFEITO QUE ISTO FECHA, medido em 31/08. O `smoke.js` e o `encaixe.js` lancam com
// `executablePath`; DEZ portoes que o proprio CI e o proprio ciclo do plantao rodam lancavam
// NUS (`chromium.launch()`), e cada um dos 63 arquivos que acertava carregava a sua PROPRIA
// copia desta funcao. Num ambiente onde o navegador ja vem provisionado numa build diferente
// da que o Playwright espera — esta maquina de nuvem, e qualquer maquina cujo Playwright subiu
// de versao sem reinstalar o navegador — o lancamento nu morre assim:
//
//     browserType.launch: Executable doesn't exist at
//     /opt/pw-browsers/chromium_headless_shell-1234/chrome-headless-shell-linux64/...
//     ╔═══ Looks like Playwright was just installed or updated. ═══╗
//
// Medido nesta maquina: `chromium.launch()` NU **falha**; com `executablePath` devolve
// **Chromium 141.0.7390.37**. E a mensagem aponta para o lugar errado — ela manda instalar
// navegador, quando o navegador esta no disco e o que falta e dizer onde.
//
// CONSEQUENCIA REAL, e por isso isto nao e cosmetico: `npm test` sai **1** aqui, e nao no
// smoke — no `regua-larga.js`, que roda depois dele. Quem so olhasse a ultima linha do log do
// smoke leria "PASS" e empurraria. Junto morriam `medir-save-hostil.js` e
// `medir-telas-altura.js` (dois dos quatro portoes que o plantao roda por regra) e o
// `conteudo-espelho.js`, que e o portao do funil para diff de glossario.
//
// POR QUE E SEGURO ONDE JA FUNCIONAVA: sem `PW_CHROMIUM` e sem `/opt/pw-browsers/chromium` no
// disco, ela devolve `undefined` — e `launch({ executablePath: undefined })` e exatamente o
// lancamento nu. Numa maquina que rodou `npx playwright install` (o CI faz isso) nada muda.
// O portao `test/portao-navegador.js` cobra que portao nenhum volte a lancar nu.
module.exports.chromiumPath = function chromiumPath() {
  for (const p of [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium']) {
    if (p && fs.existsSync(p)) return p;
  }
  return undefined;
};
