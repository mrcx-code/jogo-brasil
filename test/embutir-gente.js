// EMENDA UMA FOLHA DE GENTE JÁ CORTADA DENTRO DE `src/jogo.ts`.
//
// Uso:  node test/cortar-gente.js gente-temfonte /tmp/x.json
//       node test/embutir-gente.js temfonte /tmp/x.json
//
// POR QUE ISTO EXISTE (18/08). As doze folhas anteriores foram emendadas À MÃO, com um script
// descartável reescrito a cada lote. Na décima terceira isso deixou de ser aceitável: o bloco
// tem marcas de início e fim, ordem de fileira que casa com a CARGA do mob, e uma vírgula que,
// esquecida, quebra o build inteiro dentro de 300 KB de base64 — onde ler o diff não é opção.
// Uma ferramenta que emenda sempre igual custa menos que a décima quarta emenda à mão.
//
// Ela é conservadora de propósito: recusa se a chave já existir (trocar folha é outra decisão,
// e passa por olhar a arte de novo), recusa se não vierem 24 quadros, e recusa se as marcas não
// estiverem no lugar.
const fs = require("fs");
const path = require("path");

const [chave, arqJson] = process.argv.slice(2);
if (!chave || !arqJson) {
  console.error("uso: node test/embutir-gente.js <idDaEpoca> <arquivo.json>");
  process.exit(1);
}

const alvo = path.resolve(__dirname, "..", "src", "jogo.ts");
let s = fs.readFileSync(alvo, "utf8");

// A QUEBRA DE LINHA SAI DO ARQUIVO, NÃO DA MINHA CABEÇA (18/08). O `src/jogo.ts` está em CRLF
// nesta máquina, e a primeira versão desta ferramenta procurava a âncora com \n puro. Ela não
// achava e respondia "a declaração mudou de forma" — mensagem que manda procurar exatamente no
// lugar errado, porque a declaração estava intacta. Custou duas tentativas.
const EOL = s.indexOf("\r\n") >= 0 ? "\r\n" : "\n";

const INI = "GENTE_EP_B64_START";
const FIM = "GENTE_EP_B64_END";
const iIni = s.indexOf(INI);
const iFim = s.indexOf(FIM);
if (iIni < 0 || iFim < 0 || iFim < iIni) {
  console.error("as marcas " + INI + "/" + FIM + " não estão no lugar");
  process.exit(1);
}

const bloco = s.slice(iIni, iFim);
if (bloco.indexOf(EOL + "  " + chave + ": [") >= 0) {
  console.error('a chave "' + chave + '" JÁ está embutida. Trocar a folha é outra decisão — apague a chave à mão se é isso mesmo.');
  process.exit(1);
}

const j = JSON.parse(fs.readFileSync(arqJson, "utf8"));
const quadros = (j.frames || []).map(function (f) { return f.b64; });
if (quadros.length !== 24) {
  console.error("esperava 24 quadros (3 fileiras de 8), vieram " + quadros.length);
  process.exit(1);
}

const fileiras = [0, 1, 2].map(function (f) { return quadros.slice(f * 8, f * 8 + 8); });
const texto =
  "  " + chave + ": [" + EOL +
  fileiras.map(function (fila) {
    return "    [" + EOL +
      fila.map(function (d) { return '      "' + d + '"'; }).join("," + EOL) + EOL +
      "    ]";
  }).join("," + EOL) + EOL +
  "  ]," + EOL;

// Entra logo depois da abertura do objeto, que é a única âncora estável: as chaves seguintes
// são base64 de centenas de KB e não há um "fim" legível para procurar.
const abre = "const GENTE_EP_B64: Record<string, string[][]> = {" + EOL;
const iAbre = s.indexOf(abre, iIni);
if (iAbre < 0) {
  console.error("a declaração de GENTE_EP_B64 mudou de forma");
  process.exit(1);
}
s = s.slice(0, iAbre + abre.length) + texto + s.slice(iAbre + abre.length);

fs.writeFileSync(alvo, s);
console.log(chave + ": 24 quadros embutidos (" + Math.round(quadros.join("").length / 1024) + " KB) em src/jogo.ts");
