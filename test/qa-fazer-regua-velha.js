// QA — gera test/tmp-regua-velha.js: a `regua-larga.js` deste ramo com a espera ANTIGA de
// volta (1400 ms de relógio), para o A/B que responde se a espera nova mudou algum número.
// (23/08, auditoria do ramo a0db28de). O arquivo gerado é tmp-* e não entra no histórico.
const fs = require('fs');
const path = require('path');

const orig = path.resolve(__dirname, 'regua-larga.js');
const destino = path.resolve(__dirname, 'tmp-regua-velha.js');
let t = fs.readFileSync(orig, 'utf8');

// regex para não depender de fim de linha nem de espaço
const NOVA = /await pg\.waitForFunction\(\(\) => typeof S !== 'undefined'[\s\S]*?\.catch\(\(\) => \{\}\);/g;
const antes = (t.match(NOVA) || []).length;
if (antes !== 2) { console.error('esperava 2 ocorrencias da espera nova, achei ' + antes); process.exit(2); }
t = t.replace(NOVA, 'await pg.waitForTimeout(1400);');
fs.writeFileSync(destino, t);
console.log('escrito ' + destino + ' (' + antes + ' esperas trocadas de volta para 1400 ms)');
