// O PORTÃO QUE COBRA SE O CARTÃO COMMITADO AINDA É O QUE O GERADOR PRODUZ HOJE.
//
// POR QUÊ (item `cartoes-tipografia-defasada`, 02/09). O commit 872ed92 embutiu a fonte Gelasio
// via @font-face em `cartao-secao.js` e RESOLVEU a trava de publicação do PENDENTES 101b (o
// cartão deixou de sair na tipografia do host que gerou), mas não regerou os cartões já
// commitados. A entrega `secao-numero-envelhece` regerou UM deles (glossário) como efeito
// colateral de corrigir um número — e isso bastou para a plataforma passar a mostrar DUAS
// serifas ao mesmo tempo: o glossário na Gelasio embutida, os outros três (história, de onde
// vem, território) na serifa do host que os gerou em 26/08 (`ba3ec1d`), width visivelmente
// mais estreita. Regerar uma vez conserta a IMAGEM de hoje; nada impedia a próxima mudança de
// `chrome-plataforma.js` ou de `tipografia-cartao.js` de deixar os quatro velhos de novo, em
// silêncio — é essa causa que este portão fecha.
//
// O QUE ELE FAZ, PARA CADA CARTÃO: lê o `compartilhar.jpg` como está no disco (que é o
// commitado, num checkout limpo — é assim que o CI roda), invoca o GERADOR DE VERDADE (o mesmo
// que publica) e compara o que ele produziu agora contra o que estava lá. Diferente é
// DEFASADO, e o processo sai 1. Em qualquer dos dois casos a árvore é restaurada ao final
// (`git checkout --`), então rodar este portão nunca deixa `git status` sujo.
//
// POR QUE TERRITÓRIO NÃO É COMPARADO BYTE A BYTE, e isso foi MEDIDO, não suposto: rodei o
// mesmo `gerar-territorio.js` duas vezes seguidas, sem tocar em nada, e os dois JPEGs saíram
// com MD5 diferente. A causa não é falta de determinismo do texto — é a cena 3D: os cinco
// pinos pulsam (`Math.sin(performance.now()/1450 + i*1.7)`), de propósito, como o próprio
// gerador comenta ("nada se move sozinho além da brasa dos pinos"). Comparar o arquivo inteiro
// faria este portão reprovar TODA rodada, mesmo sem defasagem nenhuma — decoração instantânea.
// A COLUNA DA ESQUERDA (nav, título, lista de lugares, painel do censo) não depende da cena:
// é ali que mora a tipografia, e é ali que este portão compara, recortando os 460 px da
// esquerda antes de fazer o hash. A placa e os pinos (à direita, e por baixo do texto) ficam
// de fora — de propósito, pelo motivo medido acima.
//
// COMO USAR
//   node test/cartao-tipografia-fresca.js              # exit 0 = os quatro batem com o gerador
//   node test/cartao-tipografia-fresca.js --autoteste   # prova que ele reprova (EQUIPE 2.8)
'use strict';

const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ABRIR = require('./abrir.js');

const RAIZ = path.resolve(__dirname, '..');
const AUTOTESTE = require.main === module && process.argv.includes('--autoteste');

// Os quatro cartões cobertos pelo item. `glossario` não é gerado por nenhum arquivo do
// TERRITÓRIO desta entrega (`gerar-glossario.js` é de outro dono), mas a SAÍDA
// (`glossario/compartilhar.jpg`) é — e é ela que este portão vigia, junto das outras três.
const ALVOS = [
  { nome: 'historia', gerador: 'ferramentas/gerar-historia.js', arquivo: 'historia/compartilhar.jpg', modo: 'byte' },
  { nome: 'de-onde-vem', gerador: 'ferramentas/gerar-fontes.js', arquivo: 'de-onde-vem/compartilhar.jpg', modo: 'byte' },
  { nome: 'glossario', gerador: 'ferramentas/gerar-glossario.js', arquivo: 'glossario/compartilhar.jpg', modo: 'byte' },
  { nome: 'territorio', gerador: 'ferramentas/gerar-territorio.js', arquivo: 'territorio/compartilhar.jpg', modo: 'regiao', crop: { x: 0, y: 0, w: 460, h: 630 } },
];

// Cada gerador reescreve o `index.html` irmão do `compartilhar.jpg` como efeito colateral —
// os dois precisam voltar ao estado do disco depois da rodada, sem exceção.
function irmaoHtml(arquivoJpg) {
  return path.join(path.dirname(arquivoJpg), 'index.html');
}

function md5(buf) { return crypto.createHash('md5').update(buf).digest('hex'); }

// Recorta a região ESTÁVEL do cartão do território (a coluna de texto, sem o mapa 3D animado)
// e devolve o hash MD5 dos pixels crus — não do JPEG, para reencode não confundir "mudou o
// arquivo" com "mudou o desenho". Usa Chromium (canvas) porque é o decodificador que já está
// nesta máquina; nada de dependência nova.
async function hashRegiao(pg, arquivo, crop) {
  const b64 = fs.readFileSync(arquivo).toString('base64');
  const url = 'data:image/jpeg;base64,' + b64;
  const px = await pg.evaluate(async ([u, c]) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = u; });
    const cv = document.createElement('canvas');
    cv.width = c.w; cv.height = c.h;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, -c.x, -c.y);
    return Array.from(ctx.getImageData(0, 0, c.w, c.h).data);
  }, [url, crop]);
  return md5(Buffer.from(px));
}

async function medirAlvo(pg, alvo, opDefeito) {
  const arquivo = path.join(RAIZ, alvo.arquivo);
  const html = irmaoHtml(arquivo);
  const relArquivo = path.relative(RAIZ, arquivo);
  const relHtml = path.relative(RAIZ, html);

  const antes = fs.existsSync(arquivo) ? fs.readFileSync(arquivo) : null;
  if (!antes) throw new Error(alvo.nome + ': ' + relArquivo + ' não existe — nada para comparar');
  const assinaturaAntes = alvo.modo === 'byte' ? md5(antes) : await hashRegiao(pg, arquivo, alvo.crop);

  const env = Object.assign({}, process.env);
  if (opDefeito) env.CARTAO_TIPOGRAFIA_DEFEITO = opDefeito;
  let erroGerador = null;
  try {
    execFileSync(process.execPath, [path.join(RAIZ, alvo.gerador)], { cwd: RAIZ, env, stdio: 'pipe' });
  } catch (e) {
    erroGerador = (e.stderr ? e.stderr.toString() : String(e)).split('\n').filter(Boolean).pop() || String(e);
  }

  let bate = null, assinaturaDepois = null;
  if (!erroGerador) {
    const depois = fs.readFileSync(arquivo);
    assinaturaDepois = alvo.modo === 'byte' ? md5(depois) : await hashRegiao(pg, arquivo, alvo.crop);
    bate = assinaturaAntes === assinaturaDepois;
  }

  // A ÁRVORE VOLTA AO QUE ESTAVA, sempre — reprovando ou não. Este portão só LÊ o veredito;
  // regerar de verdade é trabalho de quem publica, não deste portão.
  execFileSync('git', ['checkout', '--', relArquivo, relHtml], { cwd: RAIZ, stdio: 'pipe' });

  return { nome: alvo.nome, arquivo: relArquivo, bate, erroGerador, assinaturaAntes, assinaturaDepois };
}

async function main() {
  const nav = await chromium.launch({ executablePath: ABRIR.chromiumPath() });
  const pg = await nav.newPage();
  const opDefeito = AUTOTESTE ? 'sem-familias' : null;
  const resultados = [];
  try {
    for (const alvo of ALVOS) {
      process.stdout.write('  medindo ' + alvo.nome + '... ');
      const r = await medirAlvo(pg, alvo, opDefeito);
      resultados.push(r);
      if (r.erroGerador) console.log('GERADOR RECUSOU: ' + r.erroGerador.slice(0, 140));
      else console.log(r.bate ? 'bate' : 'DEFASADO (' + r.assinaturaAntes.slice(0, 8) + ' != ' + r.assinaturaDepois.slice(0, 8) + ')');
    }
  } finally {
    await nav.close();
  }

  const ruins = resultados.filter((r) => r.erroGerador || r.bate === false);
  if (AUTOTESTE) {
    if (!ruins.length) {
      console.error('AUTOTESTE FALHOU: com CARTAO_TIPOGRAFIA_DEFEITO=sem-familias nenhum alvo reprovou — o portão está mudo.');
      process.exit(1);
    }
    console.log('AUTOTESTE OK — ' + ruins.length + '/' + ALVOS.length + ' alvo(s) reprovaram com o defeito injetado, como esperado.');
    process.exit(0);
  }

  if (ruins.length) {
    console.error('RECUSADO: ' + ruins.length + ' cartão(ões) commitado(s) não batem com o gerador atual:');
    ruins.forEach((r) => console.error('  - ' + r.nome + ' (' + r.arquivo + '): ' + (r.erroGerador || 'bytes/região divergem — regenere e commite')));
    process.exit(1);
  }
  console.log('cartao-tipografia-fresca: ' + ALVOS.length + '/' + ALVOS.length + ' cartões batem com o gerador atual. EXIT REAL=0');
}

main().catch((e) => { console.error('RECUSADO (erro do portão): ' + (e && e.stack || e)); process.exit(1); });
