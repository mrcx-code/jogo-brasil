// peso-projecao.js — a PROJEÇÃO: com o peso por capítulo já medido, quanto pesa e quanto
// demora a abrir o jogo nos capítulos 5, 6, 7, 9 e 12, e em que capítulo a abertura em
// Fast 3G passou (ou passa) de 10 s. Feito para o ticket O PESO, item 2.
//
//   node test/peso-projecao.js
//
// NADA aqui é chutado. Todas as constantes vêm de medição feita nesta mesma sessão:
//   - o tamanho de hoje, do próprio index.html no disco;
//   - a razão de compressão da ARTE (0,748) medida sobre os cinco packs do peso-prototipo.js
//     (é ~0,75 porque brotli devolve exatamente o inchaço do base64, e não muito mais:
//     WebP já é dado comprimido);
//   - a reta de download, ajustada por DOIS pontos reais do peso-abrir.js em Fast 3G:
//     o jogo de hoje (2,83 MB no fio -> 16,65 s até a tela) e o protótipo sob demanda
//     (1,33 MB -> 8,65 s). O coeficiente linear sai 196,5 KB/s e o intercepto 1,55 s —
//     o intercepto é o aperto de mão e o RTT, que não escalam com o tamanho.
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..");
const HOJE_CRU_KB = fs.statSync(path.join(RAIZ, "index.html")).size / 1024;

const RAZAO_ARTE = 0.748;      // medido nos packs
const CAP_CRU_KB = 700;        // peso médio de arte por capítulo, medido no peso-composicao.js
const CAPS_HOJE = 4;

// reta ajustada em dois pontos medidos (Fast 3G, coluna "tela")
const P1 = { fio: 1.33 * 1024, tela: 8.65 };
const P2 = { fio: 2.83 * 1024, tela: 16.65 };
const KBS = (P2.fio - P1.fio) / (P2.tela - P1.tela);
const BASE = P1.tela - P1.fio / KBS;
const tela = (fioKB) => BASE + fioKB / KBS;

const HOJE_FIO_KB = 2.83 * 1024;
const capFio = CAP_CRU_KB * RAZAO_ARTE;

console.log("reta ajustada em Fast 3G: tela = " + BASE.toFixed(2) + " s + fio/" + KBS.toFixed(1) + " KB/s");
console.log("cada capítulo novo: " + CAP_CRU_KB + " KB crus · " + capFio.toFixed(0) + " KB no fio · "
  + (capFio / KBS).toFixed(2) + " s a mais para abrir\n");

console.log("cap | arquivo cru | no fio (brotli) | abrir em Fast 3G | com carga sob demanda");
for (const n of [4, 5, 6, 7, 9, 12]) {
  const cru = HOJE_CRU_KB + (n - CAPS_HOJE) * CAP_CRU_KB;
  const fio = HOJE_FIO_KB + (n - CAPS_HOJE) * capFio;
  // sob demanda como o protótipo o fez: a pintura e o contexto saem, mas o herói/mobs/
  // vegetação POR ÉPOCA (medido: ~225 KB crus por capítulo) continuam no arquivo inicial.
  const fioSD = P1.fio + (n - CAPS_HOJE) * 225 * RAZAO_ARTE;
  console.log(String(n).padStart(3) + " | " + (cru / 1024).toFixed(2).padStart(8) + " MB | "
    + (fio / 1024).toFixed(2).padStart(11) + " MB | " + tela(fio).toFixed(1).padStart(13) + " s | "
    + tela(fioSD).toFixed(1).padStart(19) + " s");
}

// quando passou/passa de 10 s
const fio10 = (10 - BASE) * KBS;
const capsAte10 = CAPS_HOJE - (HOJE_FIO_KB - fio10) / capFio;
console.log("\n10 s até a tela = " + (fio10 / 1024).toFixed(2) + " MB no fio.");
console.log("O jogo cruzou essa linha com ~" + capsAte10.toFixed(1) + " capítulos de arte — ou seja, "
  + (capsAte10 < CAPS_HOJE ? "JÁ PASSOU, e passou faz tempo." : "ainda não passou."));
