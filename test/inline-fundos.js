// Embute as peças de cenário convertidas no index.html, em WebP.
//
// Duas listas, porque o cenário agora tem DUAS CAMADAS: `CENARIO_ALTO_B64` (céu e distância,
// rola devagar) e `CENARIO_CHAO_B64` (o chão, rola 1:1). É a separação que torna a paralaxe
// segura — ela é fatal no horizonte e abaixo, inócua acima.
//
// Reencoda em WebP de propósito: em PNG as seis peças somam 2,2 MB, que viram 2,9 MB em
// base64 e levariam o index.html a ~4,1 MB. O arquivo é único e vai inteiro pelo fio na
// primeira visita, então cada MB é um segundo de tela branca no celular de alguém.
//
//   node test/inline-fundos.js            reencoda o que tem fonte, preserva o resto
//   node test/inline-fundos.js --tudo     força reencode de TODAS as peças (ver aviso abaixo)
//
// ============================================================================
// POR QUE ELE PASSOU A ACEITAR DUAS PASTAS E DOIS NOMES (2026-08-10)
// ============================================================================
// Este arquivo lia UMA pasta (`assets/cenarios-novos`) com UM nome por convenção
// (`<cap>-alto.png` / `<cap>-baixo.png`) e uma lista fixa de sete capítulos. Três coisas
// quebraram essa premissa, e as três são estruturais — não são o caso de um dia:
//
//  1. **A arte do dono chega em `assets/entrada`, com outro nome.** As catorze pinturas dos
//     capítulos em obra vieram como `cap-<slug>-fundo-alto.png` e `cap-<slug>-fundo-chao.png`
//     (repare: *chao*, não *baixo*). Renomear à mão catorze arquivos a cada entrega é o tipo
//     de trabalho que se faz errado uma vez e ninguém descobre — o índice de uma peça trocada
//     não dá erro nenhum, só põe a paisagem do capítulo errado na tela.
//  2. **`assets/entrada` é ignorada pelo git.** É pasta de recebimento, não de fonte. Quem
//     converteu SALVADOR converteu direto de lá e nunca commitou o PNG de 720×959 — resultado:
//     hoje **não existe fonte para a pintura 4 no repositório**, e este script, rodado como
//     estava, morreria procurando `cenarios-novos/cap4-alto.png`. A entrega crua some; o
//     mestre convertido é que tem de ficar. Por isso, agora, converter GRAVA em
//     `assets/cenarios-novos` — que é versionada — e só então embute.
//  3. **Peça sem fonte tem de sobreviver ao script.** Justamente por causa de (2), rodar este
//     arquivo não pode destruir o que já está embutido. Peça cuja fonte não está no disco é
//     PRESERVADA byte a byte do `src/jogo.ts` e o console diz isso em voz alta.
//
// E um quarto motivo, que é de qualidade e não de nome: as peças embutidas hoje passaram pelo
// `requalificar.js` para 0,72 (§6 do CLAUDE.md). Reencodar tudo de novo a 0,80 seria *engordar*
// o arquivo desfazendo uma medição que já foi feita — por isso o padrão é preservar, e o
// `--tudo` existe mas avisa.
//
// A ORDEM DA LISTA É A ORDEM DOS ÍNDICES DE `EPOCAS[].arte`. Acrescentar peça é acrescentar no
// FIM; mexer no meio reaponta a pintura de todo mundo em silêncio (é o §12 do encaixe.js).
// ============================================================================

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const ABRIR = require('./abrir.js');

const RAIZ = path.resolve(__dirname, '..');
// A FONTE, não o index.html. Desde a migração para TypeScript o index.html da raiz é SAÍDA:
// quem escrevesse nele veria o próximo `npm run build` apagar tudo, sem erro nenhum.
const ARQ = path.join(RAIZ, 'src', 'jogo.ts');
const DIR_MESTRE = path.join(RAIZ, 'assets', 'cenarios-novos');  // versionada — o mestre 720×959
const DIR_ENTRADA = path.join(RAIZ, 'assets', 'entrada');        // ignorada — a entrega crua

// Uma entrada por PINTURA, na ordem em que `EPOCAS[].arte` as endereça: os três primeiros
// capítulos têm duas cenas cada (a segunda é a pintura `v`, variação do mesmo lugar, para a
// paisagem não denunciar que é a mesma imagem espelhada), e SALVADOR tem UMA — chegou uma
// pintura só, e declarar duas cenas com a mesma pintura seria pagar 260 KB para repetir o
// quadro. Da 7 em diante são os capítulos que estavam vestindo a pintura de SALVADOR.
const CAPS = [
  'cap1', 'cap1v', 'cap2', 'cap2v', 'cap4', 'cap3', 'cap3v',
  'jabaquara', 'pequenaafrica', 'portas', 'naodito', 'temfonte',
  // O CAIS entra no FIM (15/08), que e a unica posicao segura: mexer no meio reaponta a
  // pintura de todo mundo em silencio. Ele vestia a de SALVADOR (`arte: [4]`) e isso era
  // divida de §2 registrada — o texto dele diz "isto e o Rio de Janeiro" e a pintura mostrava
  // outra cidade. Pintura afirma lugar.
  'cais'
];
// A PRAÇA e O QUE SEGUROU ficaram de fora de propósito: as peças de CHÃO que chegaram para as
// duas não são chão (uma é uma rua de periferia inteira, com céu; a outra é a sala do arquivo).
// O motor exige as DUAS peças — `fundoPintado()` recusa meia paisagem —, então elas entram
// quando o chão delas chegar. Está registrado no PENDENTES.md.

// 0,72 e não 0,80. O 0,80 era o número da primeira leva; a revisão de qualidade de 2026-08-07
// (§6 do CLAUDE.md) mediu NA TELA e desceu fundos e contextos para 0,72 — as peças que já estão
// embutidas estão nessa qualidade. Reencodar peça nova a 0,80 a deixaria mais pesada que as
// irmãs sem ficar melhor: a pintura é desenhada AMPLIADA 2,53×, e nessa escala a diferença
// entre 0,72 e 0,80 não chega ao olho (medido em `test/medir-na-tela.js`).
const QUAL = 0.72;
// ZERO = sem quantização, e isto é uma MUDANÇA em relação ao `converter-fundo.js`, medida antes
// de ser feita. Aquele script quantiza em 48 cores porque a primeira leva de pinturas chegou
// como ILUSTRAÇÃO — 220 mil a 328 mil cores, gradiente macio — e sem cortar a paleta o
// resultado reduzido não lia como pixel art. As entregas de 2026-08-10 não são assim: já vêm
// com borda dura e mancha chapada. Quantizá-las de novo é dano puro, e o número diz isso:
//
//     jabaquara-alto     sem quantizar  75,7 KB · erro 0,00
//                        48 cores       89,0 KB · erro 12,59   ← MAIOR e pior
//                        96 cores       82,9 KB · erro  4,54
//                        256 cores      80,7 KB · erro  2,98
//
// A quantização não só estraga como ENGORDA: banda chapada com degrau duro custa mais bits em
// WebP que o degradê original, porque o degrau é uma borda e borda é o que o codec paga caro.
// Quem receber uma entrega macia de novo põe um número aqui; para pixel art, 0 é o certo.
const CORES = 0;

const TUDO = process.argv.includes('--tudo');

// Resolve as duas peças de uma pintura. Devolve, para cada uma, ou um mestre pronto
// (720×959 / 720×320) ou uma entrega crua que precisa passar pelo conversor.
function fonte(cap, qual) {
  const mestre = path.join(DIR_MESTRE, cap + '-' + (qual === 'alto' ? 'alto' : 'baixo') + '.png');
  if (fs.existsSync(mestre)) return { tipo: 'mestre', arq: mestre, destino: mestre };
  const sufixo = 'fundo-' + (qual === 'alto' ? 'alto' : 'chao');
  // convenção de `assets/entrada`: cap-<slug>-fundo-alto.png / cap-<slug>-fundo-chao.png
  const cru = path.join(DIR_ENTRADA, 'cap-' + cap + '-' + sufixo + '.png');
  if (fs.existsSync(cru)) return { tipo: 'cru', arq: cru, destino: mestre };
  // E A SEGUNDA CONVENÇÃO, que custou quatro dias de arte parada (14/08): os capítulos
  // numerados chegam SEM o prefixo `cap-` e COM sufixo de versão — `cap4-fundo-alto-v2.png`.
  // O `necessario.json` sempre pediu com esse nome; era só este resolvedor que não o conhecia,
  // e o sintoma foi o pior possível: nenhum erro. A peça simplesmente não entrava, o script
  // dizia "preservada" (que é o comportamento certo para peça sem fonte) e a pintura refeita
  // ficou no disco, aprovada e invisível. Vence sempre a versão de MAIOR número.
  let melhor = null, maior = -1;
  const re = new RegExp('^' + cap + '-' + sufixo + '(?:-v(\\d+))?\\.png$', 'i');
  let lista = [];
  try { lista = fs.readdirSync(DIR_ENTRADA); } catch (e) {}
  for (const f of lista) {
    const m = f.match(re);
    if (!m) continue;
    const v = m[1] ? parseInt(m[1], 10) : 1;
    if (v > maior) { maior = v; melhor = path.join(DIR_ENTRADA, f); }
  }
  if (melhor) return { tipo: 'cru', arq: melhor, destino: mestre };
  return null;
}

// O conversor, igual ao do `converter-fundo.js` — recorte ao centro na proporção do alvo,
// redução por ÁREA (nunca por vizinho: jogar fora 3 de cada 4 pixels serrilha tudo) e
// quantização por popularidade. Roda dentro da página porque é o canvas quem sabe reamostrar.
const ALVO = { alto: { w: 720, h: 959 }, baixo: { w: 720, h: 320 } };

async function converter(pg, arq, alvo) {
  await pg.goto('file:///' + arq.split(path.sep).join('/'));
  return pg.evaluate(async function (a) {
    const im = document.querySelector('img');
    await im.decode();
    const iw = im.naturalWidth, ih = im.naturalHeight;
    const pAlvo = a.w / a.h, pEnt = iw / ih;
    let cw, ch;
    if (pEnt > pAlvo) { ch = ih; cw = Math.round(ih * pAlvo); }
    else { cw = iw; ch = Math.round(iw / pAlvo); }
    const cx0 = Math.round((iw - cw) / 2), cy0 = Math.round((ih - ch) / 2);
    const c = document.createElement('canvas');
    c.width = a.w; c.height = a.h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(im, cx0, cy0, cw, ch, 0, 0, a.w, a.h);
    if (!a.cores) return { png: c.toDataURL('image/png'), entrada: iw + 'x' + ih, recorte: cw + 'x' + ch };
    const dado = x.getImageData(0, 0, a.w, a.h), d = dado.data;
    const conta = new Map();
    for (let i = 0; i < d.length; i += 4) {
      const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
      conta.set(k, (conta.get(k) || 0) + 1);
    }
    const pal = [...conta.entries()].sort((p, q) => q[1] - p[1]).slice(0, a.cores)
      .map(function (e) {
        const k = e[0];
        return [((k >> 10) & 31) * 8 + 4, ((k >> 5) & 31) * 8 + 4, (k & 31) * 8 + 4];
      });
    const cache = new Map();
    for (let i = 0; i < d.length; i += 4) {
      const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
      let p = cache.get(k);
      if (p === undefined) {
        let melhor = 0, dist = Infinity;
        for (let j = 0; j < pal.length; j++) {
          const dr = d[i] - pal[j][0], dg = d[i + 1] - pal[j][1], db = d[i + 2] - pal[j][2];
          const v = dr * dr + dg * dg + db * db;
          if (v < dist) { dist = v; melhor = j; }
        }
        p = melhor; cache.set(k, p);
      }
      d[i] = pal[p][0]; d[i + 1] = pal[p][1]; d[i + 2] = pal[p][2];
    }
    x.putImageData(dado, 0, 0);
    return { png: c.toDataURL('image/png'), entrada: iw + 'x' + ih, recorte: cw + 'x' + ch };
  }, { w: alvo.w, h: alvo.h, cores: CORES });
}

async function paraWebp(pg, arq, qual) {
  await pg.goto('file:///' + arq.split(path.sep).join('/'));
  return pg.evaluate(async function (q) {
    const im = document.querySelector('img');
    await im.decode();
    const c = document.createElement('canvas');
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    c.getContext('2d').drawImage(im, 0, 0);
    return c.toDataURL('image/webp', q);
  }, qual);
}

// O que já está embutido, para preservar peça sem fonte no disco.
function embutidas(src) {
  const i = src.indexOf('/*CEN_FUNDO_B64_START'), j = src.indexOf('/*CEN_FUNDO_B64_END');
  if (i < 0 || j < 0) return { alto: [], chao: [] };
  const trecho = src.slice(i, j);
  const iC = trecho.indexOf('CENARIO_CHAO_B64');
  const RE = /data:image\/webp;base64,[A-Za-z0-9+/=]+/g;
  return {
    alto: trecho.slice(0, iC).match(RE) || [],
    chao: trecho.slice(iC).match(RE) || []
  };
}

(async () => {
  let src = fs.readFileSync(ARQ, 'utf8');
  const velhas = embutidas(src);
  const nav = await chromium.launch();
  const pg = await nav.newPage();
  const saida = { alto: [], chao: [] };
  let kbTotal = 0, kbNovo = 0;

  for (let i = 0; i < CAPS.length; i++) {
    const cap = CAPS[i];
    for (const peca of [['alto', 'alto'], ['baixo', 'chao']]) {
      const f = fonte(cap, peca[0]);
      const antiga = velhas[peca[1]][i];
      if (!f && !antiga) {
        console.error('SEM FONTE E SEM PEÇA EMBUTIDA: ' + cap + '-' + peca[0] + ' — nada gravado');
        process.exit(1);
      }
      // PRESERVA quem já está embutido e não tem entrega crua nova esperando. Cobre os dois
      // casos do cabeçalho: SALVADOR, que perdeu a fonte (motivo 2), e as seis primeiras, que
      // já passaram pelo `requalificar.js` a 0,72 e não ganham nada sendo refeitas (motivo 4).
      // Uma entrega crua nunca é preservada — ela ainda não virou nada.
      // (o `!f` fica FORA do `!TUDO`: sem fonte no disco não há o que refazer, nem com --tudo)
      if (antiga && (!f || (!TUDO && f.tipo === 'mestre'))) {
        saida[peca[1]].push(antiga);
        kbTotal += antiga.length / 1024;
        console.log(cap + '-' + peca[0] + ': preservada (' +
          (f ? 'mestre no disco, já embutida' : 'sem fonte no disco') + ') — ' +
          Math.round(antiga.length / 1024) + ' KB');
        continue;
      }
      let de = f.arq;
      if (f.tipo === 'cru') {
        // converte E GRAVA o mestre em assets/cenarios-novos, que é versionada. A entrega
        // crua é ignorada pelo git; se o mestre não ficar, a pintura vira irreproduzível.
        const r = await converter(pg, f.arq, ALVO[peca[0]]);
        fs.writeFileSync(f.destino, Buffer.from(r.png.split(',')[1], 'base64'));
        console.log('  convertida ' + path.basename(f.arq) + ' ' + r.entrada +
          ' -> recorte ' + r.recorte + ' -> ' + ALVO[peca[0]].w + 'x' + ALVO[peca[0]].h +
          ' -> ' + path.relative(RAIZ, f.destino));
        de = f.destino;
      }
      const uri = await paraWebp(pg, de, QUAL);
      saida[peca[1]].push(uri);
      kbTotal += uri.length / 1024;
      if (!antiga || antiga !== uri) kbNovo += uri.length / 1024;
      console.log(cap + '-' + peca[0] + ': ' + Math.round(fs.statSync(de).size / 1024)
        + ' KB png -> ' + Math.round(uri.length / 1024) + ' KB base64 webp (q' + QUAL + ')');
    }
  }
  await nav.close();

  const bloco =
    '/*CEN_FUNDO_B64_START — gerado por test/inline-fundos.js, não edite à mão*/\n' +
    '// Peça de CIMA de cada capítulo: céu, mar e distância. Rola na fração `paralaxeLonge`.\n' +
    'const CENARIO_ALTO_B64 = [\n' + saida.alto.map(s => '"' + s + '"').join(',\n') + '\n];\n' +
    '// Peça de BAIXO: o chão em que ela pisa. Rola SEMPRE 1:1 — é o que faz o pé casar.\n' +
    'const CENARIO_CHAO_B64 = [\n' + saida.chao.map(s => '"' + s + '"').join(',\n') + '\n];\n' +
    '/*CEN_FUNDO_B64_END*/';

  const re = /\/\*CEN_FUNDO_B64_START[\s\S]*?CEN_FUNDO_B64_END\*\//;
  if (!re.test(src)) { console.error('marcadores CEN_FUNDO_B64 não encontrados'); process.exit(1); }
  src = src.replace(re, bloco);

  // Sintaxe antes de gravar. O alvo agora é TypeScript, então `new Function` no arquivo inteiro
  // não serve — mas o que ESTE script escreve é só dado, duas listas de strings, e isso se
  // verifica exatamente. O resto do arquivo é conferido pelo `tsc` dentro do `npm run build`,
  // que se recusa a escrever o index.html se algo estiver quebrado.
  for (const lista of [saida.alto, saida.chao]) {
    try { new Function('return [' + lista.map(s => '"' + s + '"').join(',') + ']'); }
    catch (e) { console.error('SINTAXE QUEBRADA: ' + e.message + ' — nada gravado'); process.exit(1); }
  }
  if (saida.alto.length !== saida.chao.length || saida.alto.length !== CAPS.length) {
    console.error('as duas listas têm de ter uma peça por pintura — nada gravado'); process.exit(1);
  }
  fs.writeFileSync(ARQ, src);
  console.log('\n' + CAPS.length + ' pinturas · ' + Math.round(kbTotal) + ' KB de base64 no total, '
    + Math.round(kbNovo) + ' KB deles novos');
  console.log('src/jogo.ts: ' + src.split('\n').length + ' linhas, '
    + (src.length / 1048576).toFixed(2) + ' MB — rode `npm run build`');
})();
