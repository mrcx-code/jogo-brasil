// O PORTÃO DOS CARTÕES DE LINK DAS SEÇÕES — e o controle que prova que ele morde.
//
// POR QUE EXISTE. `og:image` é a única coisa deste repositório que ninguém revê depois de
// publicada: o robô do WhatsApp busca a imagem UMA vez e guarda o resultado por semanas. Se a
// tag apontar para um 404, ou se a imagem sair sem o título da seção, ou se ela sair com o
// dobro do tamanho declarado, nada quebra em lugar nenhum — só o cartão vira retângulo cinza
// no celular de quem recebeu o link. A growth mediu esse buraco por `curl` em TRÊS rodadas
// distintas de 21/08 antes de ele ser fechado.
//
// DUAS PARTES, e as duas por exit code:
//
//   A · O CONTROLE (EQUIPE.md 2.8 — portão que nunca foi visto reprovando é decoração).
//       Cinco defeitos são injetados de propósito numa CÓPIA da página de A HISTÓRIA, e
//       `ferramentas/cartao-secao.js` tem de RECUSAR os cinco:
//         1. uma faixa acima do cabeçalho que empurra o `h1` para fora dos 630 px
//         2. um botão visível dentro do quadro (num JPEG não há botão para tocar)
//         3. o título numa sans pura (o cartão sairia com outra identidade visual)
//         4. o título numa sans com a serifa da casa só no RECUO — o caso difícil, que existe
//            porque a versão anterior deste controle ficou MUDA por uma frouxidão de regex
//            (ver o comentário no próprio defeito 3)
//         5. qualidade 1, que faz o JPEG virar chapa lisa abaixo do piso de 20 KB
//       Se um deles PASSAR, este arquivo sai 1 dizendo que o portão não presta.
//
//   B · A CONFERÊNCIA NO AR. `ferramentas/servir.js` sobe `dist/` — que é o que a Vercel
//       publica — e cada página é buscada por HTTP de verdade. A `og:image` declarada é
//       reescrita da BASE para o localhost e BUSCADA: tem de responder 200, ser um JPEG de
//       verdade (marca FFD8 e não a extensão) e ter EXATAMENTE as dimensões que as tags
//       `og:image:width`/`height` prometem — as dimensões vêm do cabeçalho SOF do próprio
//       arquivo, não do que o gerador achou que fez. Um print a `deviceScaleFactor: 2` sairia
//       2400×1260 e passaria por qualquer conferência que só olhasse o tamanho em KB.
//
// As quatro seções entram: as três de papel (o item og-image-secoes) e o TERRITÓRIO, que já
// tinha cartão desde 21/08 e agora tem quem o vigie.
//
// OS TRÊS DEFEITOS DE TIPOGRAFIA, fundidos aqui em 02/09 (item fonte-embutida-sem-portao).
// Nasceram em `test/cartao-fonte-embutida.js`, escrito na MESMA rodada que embutiu a fonte
// Gelasio (PENDENTES 101b) — separado porque este arquivo estava em uso por outra entrega
// naquela hora. Provado por injeção que os três mordem (exit 1 cada, exit 0 sem defeito), mas
// nenhum lugar os chamava: não npm test, não CI, não funil — a mesma doença do item
// controle-cartao-sem-dono, fechado ao lado na rodada anterior. Este arquivo já é chamado pelo
// CI (.github/workflows/teste.yml, passo "cartão de link"), então fundir aqui os coloca sob
// portão sem tocar `package.json` nem o workflow. O arquivo separado foi removido no mesmo
// commit desta fusão — mantê-lo ao lado, sem dono, seria o mesmo buraco com um nome diferente.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const CARTAO = require('../ferramentas/cartao-secao.js');
const { BASE } = require('../ferramentas/dominio.js');
const TIPO = require('../ferramentas/tipografia-cartao.js');

const RAIZ = path.resolve(__dirname, '..');
const TMP = path.join(RAIZ, 'test', 'tmp-cartao');
const PORTA = 8207;
// A meta de projeto para o peso de um cartão. NÃO é a faixa do gerador (20–300 KB, que é o
// que quebra de verdade): é o alvo combinado no item og-image-secoes, e aqui ele é cobrado
// para não escorregar de 70 KB para 250 KB sem ninguém notar, um commit de cada vez.
const META_KB = 90;

const SECOES = ['historia', 'glossario', 'de-onde-vem', 'territorio'];

let falhas = 0, passes = 0;
function ok(cond, msg) {
  if (cond) { passes++; console.log('  ok  ' + msg); }
  else { falhas++; console.log('  X   ' + msg); }
  return !!cond;
}
function sec(t) { console.log('\n=== ' + t); }

// ------------------------------------------------ o tamanho REAL de um JPEG, do cabeçalho SOF
//
// Percorre os marcadores até um SOFn (0xC0–0xCF, tirando C4/C8/CC, que não são quadro). É a
// única forma de saber o tamanho sem uma dependência nova — e é o que separa "o gerador diz
// que fez 1200×630" de "o arquivo no disco tem 1200×630".
function tamanhoJPEG(buf) {
  if (buf[0] !== 0xFF || buf[1] !== 0xD8) return null;
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xFF) { i++; continue; }
    const m = buf[i + 1];
    if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }
    const tam = buf.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
      return { alt: buf.readUInt16BE(i + 5), larg: buf.readUInt16BE(i + 7) };
    }
    i += 2 + tam;
  }
  return null;
}

function pegar(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => {
      const p = [];
      r.on('data', (d) => p.push(d));
      r.on('end', () => res({ status: r.statusCode, tipo: r.headers['content-type'] || '', corpo: Buffer.concat(p) }));
    }).on('error', rej);
  });
}

function meta(html, sel) {
  const re = new RegExp('<meta\\s+(?:property|name)="' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    + '"\\s+content="([^"]*)"', 'i');
  const m = html.match(re);
  return m ? m[1] : null;
}

(async () => {
  // ============================================================
  // A · O CONTROLE — quatro defeitos, quatro recusas
  // ============================================================
  sec('A · o portão do cartão visto REPROVANDO (oito defeitos injetados: cinco de forma/peso, '
    + 'três de tipografia embutida — ' + TIPO.FAMILIA + ' ' + TIPO.VERSAO + ')');
  const molde = fs.readFileSync(path.join(RAIZ, 'historia', 'index.html'), 'utf8');
  fs.mkdirSync(TMP, { recursive: true });

  const DEFEITOS = [
    {
      nome: 'faixa acima do cabeçalho empurra o título para fora dos 630 px',
      remendo: (h) => h.replace('<div class="env">',
        '<div class="env"><div style="height:640px;background:#ddd"></div>'),
      espera: /não cabe no quadro/
    },
    {
      nome: 'um botão visível dentro do quadro (num JPEG não há botão para tocar)',
      remendo: (h) => h.replace('<h1>', '<button type="button" id="iscaBt">assine aqui</button><h1>'),
      espera: /controle visível/
    },
    {
      // ESTE CONTROLE FICOU MUDO E FOI PEGO EM 22/08 — leia antes de mexer nele.
      // Ele nasceu removendo a folha do Google Fonts, quando o portão cobrava a CHEGADA de uma
      // fonte de rede. A onda 1 de 22/08 tirou o Google das páginas e pôs a serifa da casa; o
      // remendo foi atualizado para injetar uma sans... e o controle passou a PASSAR, dizendo
      // que o portão estava vivo. Causa medida, imprimindo o estado: `sans-serif` CONTÉM
      // `serif`, e o `\bserif\b` do portão casava com ele. Um controle que reprova por um
      // motivo e é lido como se reprovasse por outro é pior que controle nenhum — foi por isso
      // que a regressão de peso (183 KB contra a meta de 90) viajou junto, sem ninguém ver.
      nome: 'o título fora da serifa da casa: uma sans pura',
      remendo: (h) => h.replace('</style>', '  h1{font-family:Arial,sans-serif!important;}\n</style>'),
      espera: /não está na serifa da casa/
    },
    {
      // O IRMÃO DIFÍCIL do de cima, e é ele que prova que o conserto é conserto e não uma
      // regex remendada: uma SANS na frente com a serifa da casa no recuo. O navegador desenha
      // Arial; qualquer cobrança que procure "georgia" em qualquer posição da lista aprova.
      nome: 'o título fora da serifa da casa: sans na frente, serifa da casa só no recuo',
      remendo: (h) => h.replace('</style>', '  h1{font-family:Arial,Georgia,serif!important;}\n</style>'),
      espera: /não está na serifa da casa/
    },
    {
      nome: 'qualidade 1: o JPEG vira chapa lisa e some abaixo do piso de peso',
      remendo: (h) => h,
      op: { qualidade: 1 },
      espera: /fora da faixa de/
    },
    // OS TRÊS DE BAIXO são de tipografia-cartao.js — fundidos de test/cartao-fonte-embutida.js
    // (ver o comentário no topo do arquivo). Não remendam o HTML: ligam
    // `CARTAO_TIPOGRAFIA_DEFEITO`, que `ferramentas/tipografia-cartao.js` lê para simular a
    // fonte embutida quebrando de três jeitos distintos.
    {
      nome: 'a fonte embutida não carrega (src aponta para bytes que não são fonte)',
      remendo: (h) => h,
      env: { CARTAO_TIPOGRAFIA_DEFEITO: 'fonte-nao-carrega' },
      espera: /a fonte embutida .* nao carregou/
    },
    {
      nome: 'a lista de famílias da serifa da casa sai vazia (nada é trocado)',
      remendo: (h) => h,
      env: { CARTAO_TIPOGRAFIA_DEFEITO: 'sem-familias' },
      espera: /nenhum elemento da pagina veste a serifa da casa/
    },
    {
      nome: 'a fonte carrega e o corpo troca, mas o h1 fica de fora',
      remendo: (h) => h,
      env: { CARTAO_TIPOGRAFIA_DEFEITO: 'titulo-fora' },
      espera: /o titulo nao esta sendo PINTADO na fonte embutida/
    }
  ];

  for (const d of DEFEITOS) {
    fs.writeFileSync(path.join(TMP, 'index.html'), d.remendo(molde));
    if (d.env) for (const k in d.env) process.env[k] = d.env[k];
    let erro = null;
    try { await CARTAO.tirar(TMP, d.op || {}); } catch (e) { erro = String(e.message || e); }
    if (d.env) for (const k in d.env) delete process.env[k];
    ok(!!erro && d.espera.test(erro), 'CONTROLE "' + d.nome + '": '
      + (erro ? 'recusou — ' + erro.slice(0, 90).replace(/\s+/g, ' ') : 'PASSOU, e não podia'));
  }

  // e o controle do controle: a página SEM defeito tem de passar, senão os quatro acima
  // estariam recusando por um motivo que não é o injetado
  fs.writeFileSync(path.join(TMP, 'index.html'), molde);
  let limpo = null, erroLimpo = null;
  try { limpo = await CARTAO.tirar(TMP); } catch (e) { erroLimpo = String(e.message || e); }
  ok(!!limpo, 'CONTROLE NEGATIVO: a mesma página SEM defeito passa'
    + (limpo ? ' (' + limpo.kb.toFixed(0) + ' KB)' : ' — recusou: ' + erroLimpo));

  fs.rmSync(TMP, { recursive: true, force: true });

  // ============================================================
  // B · A CONFERÊNCIA NO AR — dist/ servido, tags buscadas por HTTP
  // ============================================================
  sec('B · a og:image de cada seção resolve para um arquivo que existe em dist/');
  const srv = spawn(process.execPath, [path.join(RAIZ, 'ferramentas', 'servir.js'), String(PORTA), 'dist'],
    { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((r) => { srv.stdout.once('data', r); setTimeout(r, 3000); });

  try {
    for (const s of SECOES) {
      const pag = await pegar('http://127.0.0.1:' + PORTA + '/' + s + '/');
      if (!ok(pag.status === 200, s + ': a página responde 200 em dist/')) continue;
      const html = pag.corpo.toString('utf8');
      const img = meta(html, 'og:image');
      const w = meta(html, 'og:image:width'), h = meta(html, 'og:image:height');
      const alt = meta(html, 'og:image:alt');
      const tw = meta(html, 'twitter:card');
      const ogU = meta(html, 'og:url');
      console.log('   ' + s + ' → ' + img);
      if (!ok(!!img, s + ': tem og:image')) continue;
      ok(img.indexOf(BASE + '/') === 0, s + ': a og:image sai da BASE de ferramentas/dominio.js (nada escrito à mão)');
      ok(!!ogU && img.indexOf(ogU) === 0, s + ': a imagem mora DENTRO do endereço da própria página (' + ogU + ')');
      ok(tw === 'summary_large_image', s + ': twitter:card é summary_large_image');
      ok(!!alt && alt.length > 20, s + ': tem og:image:alt que descreve a imagem');

      const url = 'http://127.0.0.1:' + PORTA + img.slice(BASE.length);
      const arq = await pegar(url);
      const kb = arq.corpo.length / 1024;
      const dim = arq.status === 200 ? tamanhoJPEG(arq.corpo) : null;
      console.log('   ' + s + ' → ' + arq.status + ' · ' + arq.tipo + ' · ' + kb.toFixed(0) + ' KB · '
        + (dim ? dim.larg + 'x' + dim.alt : 'não é JPEG'));
      ok(arq.status === 200, s + ': a imagem declarada RESPONDE em dist/ (não é 404)');
      ok(arq.tipo === 'image/jpeg', s + ': servida como image/jpeg');
      ok(!!dim && dim.larg === Number(w) && dim.alt === Number(h),
        s + ': o arquivo tem ' + (dim ? dim.larg + 'x' + dim.alt : '?') + ' e as tags prometem ' + w + 'x' + h);
      ok(kb > 0 && kb <= META_KB, s + ': pesa ' + kb.toFixed(0) + ' KB — a meta do item é <= ' + META_KB + ' KB');
    }
  } finally {
    srv.kill();
  }

  console.log('\n' + (falhas ? 'CARTÕES: ' + falhas + ' falharam de ' + (falhas + passes)
    : 'CARTÕES OK — ' + passes + ' verificações passaram, 0 falharam'));
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
