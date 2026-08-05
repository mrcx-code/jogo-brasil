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
//   node test/inline-fundos.js

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..');
const ARQ = path.join(RAIZ, 'index.html');
const DIR = path.join(RAIZ, 'assets', 'cenarios-novos');
const CAPS = ['cap1', 'cap1v', 'cap2', 'cap2v', 'cap3', 'cap3v'];
const QUAL = 0.92;

(async () => {
  const nav = await chromium.launch();
  const pg = await nav.newPage();
  const saida = { alto: [], chao: [] };

  for (const cap of CAPS) {
    for (const peca of [['alto', 'alto'], ['baixo', 'chao']]) {
      const arq = path.join(DIR, cap + '-' + peca[0] + '.png');
      await pg.goto('file:///' + arq.replace(/\\/g, '/'));
      const uri = await pg.evaluate(async function (q) {
        const im = document.querySelector('img');
        await im.decode();
        const c = document.createElement('canvas');
        c.width = im.naturalWidth; c.height = im.naturalHeight;
        c.getContext('2d').drawImage(im, 0, 0);
        return c.toDataURL('image/webp', q);
      }, QUAL);
      saida[peca[1]].push(uri);
      console.log(cap + '-' + peca[0] + ': ' + Math.round(fs.statSync(arq).size / 1024)
        + ' KB png -> ' + Math.round(uri.length / 1024) + ' KB base64 webp');
    }
  }
  await nav.close();

  let src = fs.readFileSync(ARQ, 'utf8');
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

  // sintaxe antes de gravar — contar chave na mão não serve neste arquivo
  const blocos = src.match(/<script\b[^>]*>([\s\S]*?)<\/script>/g) || [];
  for (const b of blocos) {
    try { new Function(b.replace(/^<script\b[^>]*>/, '').replace(/<\/script>$/, '')); }
    catch (e) { console.error('SINTAXE QUEBRADA: ' + e.message + ' — nada gravado'); process.exit(1); }
  }
  fs.writeFileSync(ARQ, src);
  console.log('index.html: ' + src.split('\n').length + ' linhas, '
    + (src.length / 1048576).toFixed(2) + ' MB');
})();
