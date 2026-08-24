// test/caminhos-do-backlog.js — OS CAMINHOS DE "ACIONAR" SAEM DO BACKLOG, E DIZEM A VERDADE
//
// POR QUE ESTE ARQUIVO EXISTE. Em 24/08 o dashboard oferecia ao dono uma lista de caminhos
// ESCRITA A MAO (`var CAMINHOS={...}`): 28 opcoes (9 agentes x 3 + o recuo "livre") contra 15
// itens `livre` no `ferramentas/backlog.json`. Duas das opcoes — `home-inc2` ("Home increment 2:
// cena + portais") e `quarto-portal` ("Quarto portal: DE ONDE VEM") — ja estavam `concluido` no
// arquivo, e ele acionou dois agentes para trabalho pronto. O botao funcionava; a lista mentia.
// Uma lista chumbada envelhece sozinha, em silencio, e nenhum portao percebia.
//
// Entao a regra que este arquivo prega: A LISTA DO MODAL E A FILA. Se o backlog tem item `livre`
// para um agente, o modal mostra o TITULO real dele; se nao tem, o modal DIZ que nao tem; se a
// fila nao pode ser lida, o modal DIZ isso em vez de cair numa lista velha.
//
// COMO ELE MEDE: sobe um servidor proprio servindo `dashboard/` com o `ferramentas/backlog.json`
// REAL ao lado (a pagina busca `backlog.json` relativo — em producao o build o copia para dentro
// de dist/dashboard/), finge o Supabase com `page.route` e exercita o CAMINHO DA PESSOA: clica em
// "Acionar" e le o modal. Medir pelo caminho da pessoa e a licao 2.1 do EQUIPE.md.
//
// E ELE FOI VISTO REPROVANDO (licao 2.8): a cena 6 aplica um MUTANTE — apaga a linha que
// alimenta o indice a partir da fila — e exige que a cena 1 reprove. Portao que nunca mordeu e
// decoracao.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..');
const DASH = path.join(RAIZ, 'dashboard', 'index.html');
const FILA = path.join(RAIZ, 'ferramentas', 'backlog.json');
// Porta derivada do caminho da raiz, como em abrir.js: duas copias do repo (worktrees) nunca
// pedem a mesma porta e ninguem mede o dashboard de outra arvore.
let h = 0; for (const c of RAIZ) h = (h * 31 + c.charCodeAt(0)) % 9000;
const PORTA = 20000 + h;

let falhas = 0, passes = 0;
function ok(cond, msg) { if (cond) { passes++; console.log('  ok  ' + msg); } else { falhas++; console.log('  FALHOU  ' + msg); } }

const AGENTES = [
  { nome: 'dev-plataforma', papel: 'plataforma', cor: '#2f5230', status: 'espera', ativo_em: new Date().toISOString(), ordem: 1, squad: 'plataforma' },
  { nome: 'dev-jogo', papel: 'motor', cor: '#7a4a24', status: 'espera', ativo_em: new Date().toISOString(), ordem: 2, squad: 'jogo' },
  { nome: 'ninguem-tem-item', papel: 'sonda', cor: '#7d8479', status: 'espera', ativo_em: new Date().toISOString(), ordem: 3, squad: 'central' }
];

// O TITULO E TEXTO DE SERVIDOR (regra das squads, no proprio dashboard: todo dado de servidor e
// hostil). Este item entra na fila da COPIA usada pela cena 5 e nunca no arquivo de verdade.
const ITEM_HOSTIL = {
  id: 'sonda-hostil',
  titulo: '<img src=x onerror="window.__XSS=1">aspas" e \'apostrofo',
  agente: 'dev-plataforma', estado: 'livre'
};

function servidor(htmlPath, backlogObj) {
  return http.createServer((req, res) => {
    const p = req.url.split('?')[0];
    if (p === '/backlog.json') {
      if (!backlogObj) { res.writeHead(404); return res.end('sem fila'); }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(backlogObj));
    }
    fs.readFile(htmlPath, (e, b) => {
      if (e) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(b);
    });
  });
}

// Abre o dashboard e devolve o que o modal de `nome` mostra. Devolve tambem os erros de pagina:
// modal que estoura em silencio passaria por "sem opcoes".
async function lerModal(navegador, htmlPath, backlogObj, nome) {
  const srv = servidor(htmlPath, backlogObj);
  await new Promise(r => srv.listen(PORTA, '127.0.0.1', r));
  const pg = await navegador.newPage();
  const erros = [];
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.route('**supabase.co/**', route => {
    const u = route.request().url();
    if (route.request().method() === 'POST') return route.fulfill({ status: 401, contentType: 'application/json', body: '{"msg":"nao"}' });
    route.fulfill({ status: 200, contentType: 'application/json', body: u.includes('mesa_agente') ? JSON.stringify(AGENTES) : '[]' });
  });
  try {
    await pg.goto('http://127.0.0.1:' + PORTA + '/index.html', { waitUntil: 'networkidle' });
    await pg.waitForTimeout(400);
    const r = await pg.evaluate((quem) => {
      const cards = [...document.querySelectorAll('.ag')];
      const card = cards.find(c => c.querySelector('.nome').textContent === quem);
      if (!card) return { erro: 'card nao achado' };
      const bt = card.querySelector('.acionar');
      if (!bt) return { erro: 'sem botao Acionar' };
      bt.click();
      const ops = [...document.querySelectorAll('#modal-ops .modal-op')];
      return {
        textos: ops.map(o => o.textContent),
        htmls: ops.map(o => o.innerHTML),
        sub: document.getElementById('modal-sub').textContent,
        xss: !!window.__XSS,
        // DENTRO dos botoes, nao os botoes: `#modal-ops *` conta os proprios .modal-op e daria
        // 8 num modal saudavel — o portao reprovava por instrumento, nao por defeito (medido).
        tagsInjetadas: document.querySelectorAll('#modal-ops .modal-op *').length
      };
    }, nome);
    r.erros = erros;
    return r;
  } finally { await pg.close(); srv.close(); }
}

(async () => {
  const fila = JSON.parse(fs.readFileSync(FILA, 'utf8'));
  const livres = fila.itens.filter(i => i.estado === 'livre');
  const daPlataforma = livres.filter(i => (i.agente || i.papel) === 'dev-plataforma');
  const concluidos = fila.itens.filter(i => i.estado === 'concluido').map(i => i.titulo);
  const nav = await chromium.launch();
  try {
    console.log('\n1) A LISTA E A FILA — os titulos do modal saem do backlog, na ordem do arquivo');
    console.log('   (' + livres.length + ' itens livres na fila; ' + daPlataforma.length + ' do dev-plataforma)');
    const m1 = await lerModal(nav, DASH, fila, 'dev-plataforma');
    ok(!m1.erro, 'o modal abriu pelo caminho da pessoa (clique em Acionar)' + (m1.erro ? ' — ' + m1.erro : ''));
    ok((m1.erros || []).length === 0, 'sem erro de pagina ao montar a lista');
    const esperados = daPlataforma.map(i => i.titulo);
    ok(JSON.stringify(m1.textos.slice(0, esperados.length)) === JSON.stringify(esperados),
      'os ' + esperados.length + ' primeiros caminhos sao os itens livres, na ordem do dono');
    ok(m1.textos[m1.textos.length - 1] === 'Trabalhar no que for mais valioso agora',
      'o recuo aberto continua no fim da lista');

    console.log('\n2) NENHUM ITEM CONCLUIDO E OFERECIDO — foi o defeito de 24/08 (home-inc2, quarto-portal)');
    const oferecidoPronto = m1.textos.filter(t => concluidos.indexOf(t) >= 0);
    ok(oferecidoPronto.length === 0, 'nada da lista de concluidos aparece no modal' + (oferecidoPronto.length ? ': ' + oferecidoPronto.join(' · ') : ''));

    console.log('\n3) AGENTE SEM ITEM LIVRE NAO VIRA MODAL VAZIO');
    const m3 = await lerModal(nav, DASH, fila, 'ninguem-tem-item');
    ok(m3.textos && m3.textos.length === 1 && m3.textos[0] === 'Trabalhar no que for mais valioso agora',
      'sobra so o recuo honesto, e ele existe');
    ok(/n[aã]o h[aá] item livre na fila/i.test(m3.sub || ''), 'e a tela DIZ que a fila nao tem item para ele: "' + m3.sub + '"');

    console.log('\n4) FILA QUE NAO CARREGA NAO INVENTA ITEM');
    const m4 = await lerModal(nav, DASH, null, 'dev-plataforma');   // 404 no backlog.json
    ok(m4.textos && m4.textos.length === 1, 'nenhum caminho inventado quando o backlog nao carrega');
    ok(/n[aã]o consegui ler a fila/i.test(m4.sub || ''), 'e a tela diz isso: "' + m4.sub + '"');

    console.log('\n5) TITULO DE ITEM E TEXTO DE SERVIDOR — entra por textContent, nunca como HTML');
    const suja = { itens: [ITEM_HOSTIL].concat(fila.itens) };
    const m5 = await lerModal(nav, DASH, suja, 'dev-plataforma');
    ok(m5.xss === false, 'o titulo hostil nao executou nada');
    ok(m5.tagsInjetadas === 0, 'nenhuma tag entrou dentro dos botoes do modal (' + m5.tagsInjetadas + ')');
    ok(m5.textos[0] === ITEM_HOSTIL.titulo, 'o titulo aparece literal, como texto');
    ok(/&lt;img/.test(m5.htmls[0] || ''), 'e escapado no innerHTML resultante');

    console.log('\n6) CONTROLE — o portao foi visto reprovando (mutante: a fila nao alimenta a lista)');
    const fonte = fs.readFileSync(DASH, 'utf8');
    const alvo = 'backlogPorAgente=indexarBacklog(itens); backlogEstado="ok";';
    ok(fonte.indexOf(alvo) >= 0, 'a linha que liga a fila aos caminhos existe e e unica');
    const mutante = path.join(__dirname, 'tmp-caminhos-mutante.html');
    fs.writeFileSync(mutante, fonte.replace(alvo, 'backlogEstado="ok";'));
    try {
      const m6 = await lerModal(nav, mutante, fila, 'dev-plataforma');
      const passariaCena1 = JSON.stringify((m6.textos || []).slice(0, esperados.length)) === JSON.stringify(esperados);
      ok(!passariaCena1, 'com o mutante, a cena 1 REPROVA (o modal mostrou ' + (m6.textos || []).length + ' caminho(s) em vez dos ' + esperados.length + ' da fila)');
    } finally { fs.unlinkSync(mutante); }
  } finally { await nav.close(); }

  console.log('\n' + (falhas ? 'FALHOU: ' + falhas + ' de ' + (falhas + passes) : 'PASSOU: ' + passes + ' verificacoes, nenhuma falha'));
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
