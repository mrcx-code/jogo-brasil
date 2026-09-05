// qa-caminhos-sonda.js — SONDA DO QA para os caminhos de "Acionar" do dashboard.
//
// NAO E PORTAO DE CI (nao entra no teste.yml): e o instrumento com que o QA tentou DERRUBAR a
// entrega de 24/08 que passou a derivar a lista do modal do `ferramentas/backlog.json`. Ele
// mede os estados que o portao `test/caminhos-do-backlog.js` NAO cobre, e foi aqui que
// apareceram os tres achados devolvidos naquela auditoria:
//
//   1. FORMA QUEBRADA VIRA "NAO HA TRABALHO". Um 200 OK com JSON valido e forma errada
//      (`{"itens":"x"}`, `{}`, `[]`) faz a tela dizer "Nao ha item livre na fila para X" —
//      exatamente a confusao que o comentario do dashboard promete evitar. So corpo NAO-JSON
//      cai em "nao consegui ler a fila".
//   2. "CARREGANDO" NAO TEM FIM. Com o fetch pendurado (proxy/portal cativo) o modal repete
//      "abra de novo em um instante" para sempre — medido em 1 s, 11 s e 31 s — e
//      `carregarBacklog()` e chamado UMA vez, sem repique.
//   3. "GUARDADO, NAO ENVIADO" NAO SOBREVIVE AO RELOAD. Medido: o rotulo aguenta >= 20,1 s
//      (dois ciclos do refresh de 7 s), mas apos um F5 o cartao volta a "em espera" /
//      "Acionar" enquanto o chamado continua na fila do localStorage (`mesa-brasil-fila4`,
//      157 -> 172 bytes) — a tela convida a acionar de novo o que ja esta pedido.
//
// COMO RODAR (o dashboard e a fila entram por ambiente, para servir a qualquer ramo):
//   QA_DASH=/caminho/dashboard/index.html QA_FILA=/caminho/ferramentas/backlog.json \
//     node test/qa-caminhos-sonda.js <cena>
//   cenas: forma-quebrada | pendurado | carregando | guardado | xss-lento | todas
//
// Ela IMPRIME estado, nao julga (exit 0 salvo erro de execucao) — a lição 2.9 do EQUIPE.md:
// antes do segundo palpite, imprima o estado.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');   // onde o Chromium esta (test/abrir.js)

const RAIZ = path.resolve(__dirname, '..');
const DASH = process.env.QA_DASH ? path.resolve(process.env.QA_DASH) : path.join(RAIZ, 'dashboard', 'index.html');
const FILA = JSON.parse(fs.readFileSync(process.env.QA_FILA ? path.resolve(process.env.QA_FILA) : path.join(RAIZ, 'ferramentas', 'backlog.json'), 'utf8'));
// Porta derivada do caminho, como em abrir.js: duas copias do repo nunca disputam a mesma.
let h = 0; for (const c of RAIZ + DASH) h = (h * 31 + c.charCodeAt(0)) % 9000;
const PORTA = 30000 + h;

const AGENTES = [
  { nome: 'dev-plataforma', papel: 'plataforma', cor: '#2f5230', status: 'espera', ativo_em: new Date().toISOString(), ordem: 1, squad: 'plataforma' },
  { nome: 'dev-jogo', papel: 'motor', cor: '#7a4a24', status: 'espera', ativo_em: new Date().toISOString(), ordem: 2, squad: 'jogo' }
];

// corpo: objeto | string | null (404) | {pendura:true} | {atraso:ms, json:obj}
function servidor(corpo) {
  return http.createServer((req, res) => {
    if (req.url.split('?')[0] === '/backlog.json') {
      if (corpo === null) { res.writeHead(404); return res.end('sem fila'); }
      if (corpo && corpo.pendura) return;                  // nunca responde
      const manda = () => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(typeof corpo === 'string' ? corpo : JSON.stringify(corpo.json !== undefined ? corpo.json : corpo));
      };
      if (corpo && corpo.atraso) return setTimeout(manda, corpo.atraso);
      return manda();
    }
    fs.readFile(DASH, (e, b) => {
      if (e) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(b);
    });
  });
}

async function abrir(nav, corpo) {
  const srv = servidor(corpo);
  await new Promise(r => srv.listen(PORTA, '127.0.0.1', r));
  const pg = await nav.newPage();
  const erros = [], posts = [];
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('**supabase.co/**', route => {
    const u = route.request().url();
    if (route.request().method() === 'POST') { posts.push(u); return route.fulfill({ status: 401, contentType: 'application/json', body: '{"msg":"nao"}' }); }
    route.fulfill({ status: 200, contentType: 'application/json', body: u.includes('mesa_agente') ? JSON.stringify(AGENTES) : '[]' });
  });
  await pg.goto('http://127.0.0.1:' + PORTA + '/index.html', { waitUntil: 'domcontentloaded' });
  return { pg, erros, posts, fechar: async () => { await pg.close(); srv.close(); } };
}

// Le o modal pelo CAMINHO DA PESSOA: acha o cartao, clica em "Acionar", le o que apareceu.
const LER_MODAL = quem => `(() => {
  const c = [...document.querySelectorAll('.ag')].find(c => c.querySelector('.nome').textContent === ${JSON.stringify(quem)});
  if (!c) return { erro: 'sem cartao de ' + ${JSON.stringify(quem)} };
  const b = c.querySelector('.acionar'); if (!b) return { erro: 'cartao sem botao Acionar' };
  b.click();
  const sub = document.getElementById('modal-sub');
  return { sub: sub ? sub.textContent : '(sem #modal-sub — dashboard antigo)',
           ops: [...document.querySelectorAll('#modal-ops .modal-op')].map(o => o.textContent) };
})()`;

const CENAS = {
  // 1 — 200 OK com forma errada: "a lista quebrou" tem de ser distinguivel de "nao ha trabalho"
  async 'forma-quebrada'(nav) {
    for (const corpo of ['{"itens":"nao-e-array"}', '{}', '[]', '{"itens":[]}', 'nao-e-json']) {
      const a = await abrir(nav, corpo);
      await a.pg.waitForTimeout(700);
      const r = await a.pg.evaluate(LER_MODAL('dev-plataforma'));
      console.log('  ' + corpo.slice(0, 24).padEnd(26) + '-> ' + JSON.stringify(r.sub) + '  opcoes: ' + (r.ops || []).length);
      await a.fechar();
    }
  },
  // 2 — o fetch pendurado: "carregando" tem fim?
  async pendurado(nav) {
    const a = await abrir(nav, { pendura: true });
    const t0 = Date.now();
    for (const ate of [1000, 11000, 31000]) {
      while (Date.now() - t0 < ate) await a.pg.waitForTimeout(250);
      const r = await a.pg.evaluate(LER_MODAL('dev-plataforma'));
      console.log('  ' + ((Date.now() - t0) / 1000).toFixed(1) + 's  ' + JSON.stringify(r.sub));
      await a.pg.evaluate(`document.getElementById('modal-cancelar').click()`);
    }
    await a.fechar();
  },
  // 3 — a corrida real: a fila chega em 4 s e o dono clica antes
  async carregando(nav) {
    const a = await abrir(nav, { atraso: 4000, json: FILA });
    await a.pg.waitForTimeout(600);
    const cedo = await a.pg.evaluate(LER_MODAL('dev-plataforma'));
    console.log('  t=0,6s  ' + JSON.stringify(cedo.sub) + '  opcoes: ' + (cedo.ops || []).length);
    await a.pg.waitForTimeout(5000);   // com o modal ABERTO: a lista chega sozinha?
    const parado = await a.pg.evaluate(`({sub:document.getElementById('modal-sub').textContent,
      ops:[...document.querySelectorAll('#modal-ops .modal-op')].length})`);
    console.log('  t=5,6s (modal aberto o tempo todo)  ' + JSON.stringify(parado.sub) + '  opcoes: ' + parado.ops);
    await a.pg.evaluate(`document.getElementById('modal-cancelar').click()`);
    const depois = await a.pg.evaluate(LER_MODAL('dev-plataforma'));
    console.log('  t=5,7s (fechou e abriu de novo)     ' + JSON.stringify(depois.sub) + '  opcoes: ' + (depois.ops || []).length);
    await a.fechar();
  },
  // 4 — "guardado, nao enviado": quanto dura, e o que sobra depois do F5
  async guardado(nav) {
    const a = await abrir(nav, FILA);            // POST responde 401: a escrita cai na fila local
    await a.pg.waitForTimeout(700);
    await a.pg.evaluate(LER_MODAL('dev-plataforma'));
    await a.pg.evaluate(`(()=>{ document.querySelectorAll('#modal-ops .modal-op')[0].click();
                                document.getElementById('modal-confirmar').click(); })()`);
    const ler = () => a.pg.evaluate(`(() => {
      const c = [...document.querySelectorAll('.ag')].find(c => c.querySelector('.nome').textContent === 'dev-plataforma');
      return { rotulo: c.querySelector('.st').textContent, botao: c.querySelector('.acaoAg').textContent.trim(),
               filaLocal: (localStorage.getItem('mesa-brasil-fila4')||'').length, chaves: Object.keys(localStorage) };
    })()`);
    const t0 = Date.now();
    for (const ate of [300, 8000, 20000]) {
      while (Date.now() - t0 < ate) await a.pg.waitForTimeout(200);
      console.log('  ' + ((Date.now() - t0) / 1000).toFixed(1) + 's  ' + JSON.stringify(await ler()));
    }
    await a.pg.reload({ waitUntil: 'domcontentloaded' });
    await a.pg.waitForTimeout(1500);
    console.log('  APOS RELOAD  ' + JSON.stringify(await ler()));
    console.log('  POSTs tentados: ' + a.posts.length);
    await a.fechar();
  },
  // 5 — o titulo hostil: `window.__XSS` medido NO TICK do clique e cego (o onerror do <img> so
  //     dispara depois). Quem prova a defesa e a contagem de tags e o texto literal.
  async 'xss-lento'(nav) {
    const suja = { itens: [{ id: 'sonda-hostil', titulo: '<img src=x onerror="window.__XSS=1">', agente: 'dev-plataforma', estado: 'livre' }].concat(FILA.itens) };
    const a = await abrir(nav, suja);
    await a.pg.waitForTimeout(700);
    const r = await a.pg.evaluate(LER_MODAL('dev-plataforma'));
    const noTick = await a.pg.evaluate('!!window.__XSS');
    await a.pg.waitForTimeout(1500);
    const depois = await a.pg.evaluate('!!window.__XSS');
    const tags = await a.pg.evaluate(`document.querySelectorAll('#modal-ops .modal-op *').length`);
    console.log('  op[0]: ' + JSON.stringify((r.ops || [])[0]) + '  tags dentro dos botoes: ' + tags);
    console.log('  window.__XSS no tick do clique: ' + noTick + '   |   1,5 s depois: ' + depois);
    console.log('  erros de pagina: ' + JSON.stringify(a.erros));
    await a.fechar();
  }
};

(async () => {
  const pedida = process.argv[2] || 'todas';
  const lista = pedida === 'todas' ? Object.keys(CENAS) : [pedida];
  if (lista.some(c => !CENAS[c])) { console.error('cena desconhecida: ' + pedida + '\ncenas: ' + Object.keys(CENAS).join(' | ') + ' | todas'); process.exit(2); }
  console.log('dashboard medido: ' + DASH);
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  try {
    for (const c of lista) { console.log('\n== ' + c + ' =='); await CENAS[c](nav); }
  } finally { await nav.close(); }
})().catch(e => { console.error(e); process.exit(1); });
