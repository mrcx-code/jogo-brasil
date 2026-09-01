// GERA OS PRINTS COMPARÁVEIS da issue #10 (perguntas 2 e 3) — mesmo enquadramento, mesma
// hora (a luz do protótipo é fixa por ano), mesmos anos. Serve o repositório por http
// (NUNCA file:// — o fetch do sp-contorno-ibge.json seria recusado e a cena sairia PRETA;
// foi exatamente o defeito da v1) e só salva um print depois de três conferências:
//   1. zero pageerror e zero erro de console;
//   2. zero resposta >= 400 (o 404 do sp.json foi o defeito original);
//   3. pixel-check: o quadro não pode ser tela preta nem chapa de uma cor só.
//
//   node experimentos/mundo-3d/gerar-opcoes.js && node experimentos/mundo-3d/gerar-prints.js
//
// Playwright vem do node_modules da árvore principal (o worktree não tem o próprio).

const fs = require('fs');
const path = require('path');
const http = require('http');

const RAIZ = path.resolve(__dirname, '..', '..');
const PASTA = __dirname;
const PORTA = 8794;

let chromium;
for (const base of [RAIZ, 'C:/Users/User/Downloads/jogo-brasil']) {
  try { chromium = require(path.join(base, 'node_modules', 'playwright')).chromium; break; } catch (e) { /* tenta o próximo */ }
}
if (!chromium) { console.error('playwright nao encontrado'); process.exit(1); }

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png' };
const servidor = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const alvo = path.normalize(path.join(RAIZ, rel));
  if (!alvo.startsWith(RAIZ)) { res.writeHead(403); res.end(); return; }
  fs.readFile(alvo, (err, buf) => {
    if (err) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(alvo).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
});

// mesmo quadro para todos: WIDE mostra o contorno de SP inteiro (aceite do M0.5);
// PERTO é o quadro do avatar para a pergunta do pixel.
const CAM = {
  wide:  { pos: [0, 175, 245], alvo: [0, 0, 0] },
  perto: 'heroi', // resolvido em tempo de pagina: camera a SE do heroi, alvo no peito dele
};

const ALVOS = [
  { arq: 'sp-relevo-opcao-a.html', cam: 'wide', anos: [1530, 1900], saida: a => 'opcao-parede-a-' + a + '.png' },
  { arq: 'sp-relevo-opcao-b.html', cam: 'wide', anos: [1530, 1900], saida: a => 'opcao-parede-b-' + a + '.png' },
  { arq: 'sp-relevo-opcao-c.html', cam: 'wide', anos: [1530, 1900], saida: a => 'opcao-parede-c-' + a + '.png' },
  { arq: 'sp-relevo-opcao-b.html', cam: 'wide', anos: [1530], saida: () => 'estado-atual-1530.png' },
  { arq: 'sp-relevo-pixel-cena.html', cam: 'perto', anos: [1530], saida: () => 'opcao-pixel-cena.png' },
  { arq: 'sp-relevo-pixel-avatar.html', cam: 'perto', anos: [1530], saida: () => 'opcao-pixel-avatar.png' },
];

async function medirPixels(page, buf) {
  const b64 = buf.toString('base64');
  return page.evaluate(async (b) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b; await img.decode();
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
    const d = cx.getImageData(0, 0, cv.width, cv.height).data;
    let escuros = 0, n = 0, soma = 0; const cores = new Set();
    for (let i = 0; i < d.length; i += 4 * 97) {
      const l = (d[i] + d[i + 1] + d[i + 2]) / 3; soma += l; n++; if (l < 16) escuros++;
      cores.add((d[i] >> 4) + ',' + (d[i + 1] >> 4) + ',' + (d[i + 2] >> 4));
    }
    return { amostras: n, lumMedia: +(soma / n).toFixed(1), pctEscuro: +(100 * escuros / n).toFixed(1), cores16: cores.size };
  }, b64);
}

(async () => {
  await new Promise(r => servidor.listen(PORTA, '127.0.0.1', r));
  const browser = await chromium.launch();
  let falhas = 0;
  for (const alvo of ALVOS) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const erros = [], ruins = [];
    page.on('pageerror', e => erros.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
    page.on('response', r => { if (r.status() >= 400) ruins.push(r.status() + ' ' + r.url()); });
    await page.goto('http://127.0.0.1:' + PORTA + '/experimentos/mundo-3d/' + alvo.arq);
    await page.waitForFunction('!!window.__prova', null, { timeout: 45000 });
    for (const ano of alvo.anos) {
      await page.evaluate(([cam, a]) => {
        const P = window.__prova; P.controls.enableDamping = false;
        const s = document.getElementById('slider'); s.value = a; s.dispatchEvent(new Event('input'));
        document.getElementById('dica').classList.add('off');
        if (cam === 'heroi') { const hp = P.hero.position;
          P.camera.position.set(hp.x - 11, hp.y + 11, hp.z + 14);
          P.controls.target.set(hp.x, hp.y + 2, hp.z);
        } else { P.camera.position.set(cam.pos[0], cam.pos[1], cam.pos[2]);
          P.controls.target.set(cam.alvo[0], cam.alvo[1], cam.alvo[2]); }
        P.controls.update();
      }, [CAM[alvo.cam], ano]);
      await page.waitForTimeout(900);
      const buf = await page.screenshot();
      const px = await medirPixels(page, buf);
      const nome = alvo.saida(ano);
      const vazio = px.pctEscuro > 85 || px.cores16 < 8;
      const ok = erros.length === 0 && ruins.length === 0 && !vazio;
      if (ok) fs.writeFileSync(path.join(PASTA, nome), buf);
      console.log((ok ? 'OK  ' : 'FALHA ') + nome,
        '| pageerror/console:', erros.length, '| >=400:', ruins.length,
        '| lumMedia:', px.lumMedia, '| pctEscuro:', px.pctEscuro + '%', '| cores16:', px.cores16,
        vazio ? '| CENA VAZIA — print NAO salvo' : '');
      if (!ok) { falhas++; erros.concat(ruins).forEach(e => console.log('   ', e)); }
    }
    await page.close();
  }
  await browser.close();
  servidor.close();
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
