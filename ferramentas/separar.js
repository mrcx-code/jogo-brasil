// Uso único: parte o index.html de hoje em src/index.html (molde), src/estilo.css e
// src/jogo.ts. Fica no repositório só como registro de COMO a separação foi feita — o corte
// é por posição exata de caractere, não por linha, e o construir.js remonta pelo caminho
// inverso. Se as duas metades não forem exatas, o primeiro build já denuncia: ele compara a
// remontagem crua com o arquivo original byte a byte.
//
//   node ferramentas/separar.js
//
// Rodar de novo depois da conversão SOBRESCREVE o TypeScript com JavaScript. Não rode.

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const SRC = path.join(RAIZ, 'src');
const original = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');

function fatia(abre, fecha) {
  const i = original.indexOf(abre);
  const j = original.indexOf(fecha);
  if (i < 0 || j < 0 || j < i) throw new Error('não achei ' + abre);
  return [i + abre.length, j];
}

const [ci, cf] = fatia('<style>', '</style>');
const [ji, jf] = fatia('<script>', '</script>');
if (!(ci < cf && cf < ji && ji < jf)) throw new Error('ordem inesperada de style/script');

const css = original.slice(ci, cf);
const js = original.slice(ji, jf);
const molde = original.slice(0, ci) + '@@CSS@@' + original.slice(cf, ji) + '@@JS@@' + original.slice(jf);

// Prova de que o corte é reversível ANTES de escrever qualquer coisa.
const volta = molde.replace('@@CSS@@', () => css).replace('@@JS@@', () => js);
if (volta !== original) throw new Error('o corte não é reversível — não escrevi nada');

fs.mkdirSync(SRC, { recursive: true });
fs.writeFileSync(path.join(SRC, 'index.html'), molde);
fs.writeFileSync(path.join(SRC, 'estilo.css'), css);
fs.writeFileSync(path.join(SRC, 'jogo.ts'), js);
console.log('molde', molde.length, '| css', css.length, '| js', js.length, '| soma bate:', volta === original);
