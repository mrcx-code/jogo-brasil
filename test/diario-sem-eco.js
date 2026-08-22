// DIÁRIO SEM ECO — nasceu em 22/08, quando o dev-dados achou o PENDENTES.md carregando
// 1.296 linhas de cópia de si mesmo colada na frente (46% do arquivo): os itens 46-53
// ficavam invisíveis para quem lia de cima. O merge=union dos diários torna esse acidente
// possível de novo a qualquer conflito mal resolvido — este portão o pega no CI.
//
// A régua: nenhum diário pode conter o próprio começo DE NOVO mais adiante. Tomamos os
// primeiros 400 caracteres normalizados (CRLF->LF, espaço colapsado) — grandes o bastante
// para não casarem por acaso, pequenos o bastante para pegar eco parcial — e procuramos a
// segunda ocorrência. Também: o cabeçalho de nível 1 (# TÍTULO) só pode existir uma vez.
const fs = require('fs');
const path = require('path');
const RAIZ = path.resolve(__dirname, '..');
const DIARIOS = ['NOTES.md', 'PENDENTES.md', 'EQUIPE.md', 'AGENTES.md'];

let falhas = 0;
for (const nome of DIARIOS) {
  const cam = path.join(RAIZ, nome);
  if (!fs.existsSync(cam)) continue;
  const cru = fs.readFileSync(cam, 'utf8');
  const norm = cru.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ');

  const comeco = norm.slice(0, 400);
  const denovo = comeco.length === 400 ? norm.indexOf(comeco, 1) : -1;
  if (denovo > 0) {
    console.error('X  ' + nome + ': o proprio comeco aparece DE NOVO no byte ~' + denovo +
      ' — eco de merge=union (o caso PENDENTES de 22/08).');
    falhas++;
  } else {
    console.log('ok  ' + nome + ': sem eco do comeco');
  }

  const h1 = norm.match(/^# .+$/gm) || [];
  const unicos = new Set(h1);
  if (h1.length !== unicos.size) {
    console.error('X  ' + nome + ': cabecalho de nivel 1 repetido (' + h1.length + ' ocorrencias, ' + unicos.size + ' distintas).');
    falhas++;
  }
}
if (falhas) { console.error('\nFALHOU: ' + falhas + ' diario(s) com eco.'); process.exit(1); }
console.log('\ndiarios sem eco: tudo limpo.');
