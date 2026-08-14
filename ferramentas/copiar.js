// O QUE FALTA GERAR, EM FORMA DE COPIAR E COLAR.
//
//   node ferramentas/copiar.js
//
// Existe porque o dono pediu a mesma coisa duas vezes: *"não precisa me mostrar o feedback todo
// da imagem que precisa gerar não, quero algo prático pra copiar o prompt e colocar a imagem"*.
// A mesa (`npm run mesa`) mostra o histórico de recusa de cada peça, que é o registro e serve
// para decidir — e é exatamente o que atrapalha na hora de GERAR. Aqui não há crítica, não há
// motivo, não há histórico: nome, prompt, e qual arquivo anexar.
//
// A regra de qual arquivo anexar sai do próprio prompt: se ele diz IMAGEM ANEXA, a folha de
// caminhada do capítulo é o anexo. Não há lista à mão para desencontrar.
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const ENTRADA = path.join(RAIZ, 'assets', 'entrada');
const ler = n => JSON.parse(fs.readFileSync(path.join(__dirname, n), 'utf8'));

const nec = ler('necessario.json');
const proc = ler('processadas.json');
const rec = ler('recusadas.json');

const feito = new Set(proc.itens || []);
const recusa = {};
(rec.itens || []).forEach(function (r) { if (!recusa[r.n] || recusa[r.n].em < r.em) recusa[r.n] = r; });

const arquivo = {};
let disco = [];
try { disco = fs.readdirSync(ENTRADA); } catch (e) {}
disco.filter(f => !/\.txt$/i.test(f)).forEach(function (f) {
  const nome = f.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  const st = fs.statSync(path.join(ENTRADA, f));
  if (!arquivo[nome] || arquivo[nome].bytes !== st.size) arquivo[nome] = { bytes: st.size };
});

// o anexo: a folha de caminhada do mesmo capítulo, quando o prompt pede imagem de referência
function anexo(nome, prompt) {
  if (!/IMAGEM ANEXA|ANEXE A IMAGEM|imagem de referência/i.test(prompt)) return null;
  const cap = (nome.match(/^cap(\d+)/) || [])[1];
  if (!cap) return null;
  for (const cand of ['sprite-cap' + cap + '-andar-v2.png', 'sprite-cap' + cap + '-andar.png']) {
    if (fs.existsSync(path.join(ENTRADA, cand))) return 'assets/entrada/' + cand;
  }
  return null;
}

const abertos = nec.itens.filter(function (i) {
  const a = arquivo[i.nome] || null;
  const r = recusa[i.nome] || null;
  const recusadoAgora = !!(r && (!a || (typeof r.bytes === 'number' ? a.bytes === r.bytes : true)));
  return !a || recusadoAgora;
});

if (!abertos.length) {
  console.log('Nada a gerar. A fila está limpa.');
  process.exit(0);
}

console.log(abertos.length + (abertos.length === 1 ? ' peça a gerar.' : ' peças a gerar.') + '\n');
abertos.forEach(function (i, n) {
  const anx = anexo(i.nome, i.p || '');
  console.log('─'.repeat(72));
  console.log((n + 1) + ' · ' + i.nome + (anx ? '   ← ANEXE  ' + anx : '   (sem anexo)'));
  console.log('─'.repeat(72));
  console.log(i.p);
  console.log('');
});
