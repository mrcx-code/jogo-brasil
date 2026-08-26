#!/usr/bin/env node
// A LEI DO CONTÍNUO, COM PORTÃO — a fila não pode secar sem ninguém saber.
//
//   node ferramentas/conferir-fila.js          confere e reprova (exit 1)
//   node ferramentas/conferir-fila.js --quem   só imprime quem tem fila
//
// POR QUE EXISTE. O painel já declarava a lei desde 22/08 — *"sempre ≥ 1 agente ativo. Zero
// agentes com item livre na fila é defeito de plantão, não pausa"* — e **nada media isso**. Era
// lei sem portão, exatamente como o `em-curso` do backlog era honra sem trava até 23/08.
//
// O BURACO QUE ELE FECHA, medido em 24/08 a pedido do dono (*"como garantir q os times evoluam
// se auto acionando e constantemente?"*): **5 dos 12 agentes tinham fila; sete tinham ZERO.** E
// a máquina só se movia quando alguém entregava — se os construtores esvaziassem a fila, ninguém
// a encheria de volta. O `pm`, cujo trabalho é justamente encher, tinha **um** item e nenhum
// ritmo. Fila que seca sozinha e não avisa é a versão silenciosa de o projeto parar.
//
// CONSTRUTOR × REATIVO, e a distinção é o coração deste portão. Só os CONSTRUTORES são contados:
// eles vivem de fila. Os REATIVOS (qa, porteiro, juridico, arte, pre-integrador) são
// convocados pelo funil quando uma entrega toca o território deles — ter zero item é o estado
// normal deles, e cobrá-los aqui geraria vermelho que não é defeito. O `pm` é o que ENCHE, então
// também não se conta: se ele tiver zero, é sinal para despachá-lo, não para reprovar.
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const SO_QUEM = process.argv.includes('--quem');

// Quem vive de fila. Mudou o elenco? Mude aqui — e o `conferir-agentes.js` garante que o elenco
// e o painel não se percam um do outro.
const CONSTRUTORES = ['dev-jogo', 'dev-plataforma', 'dev-dados', 'historiador', 'pesquisadora-fontes'];

// TRÊS, e o número tem razão de ser: com 2 a 3 agentes por rodada (o teto do PLANTAO.md, medido
// — carga de máquina derruba portão), três itens livres é UMA rodada de folga. Abaixo disso a
// próxima rodada já pode não ter o que pegar, e o aviso chega tarde demais para servir.
const PISO = 3;

function backlog() {
  const p = path.join(RAIZ, 'ferramentas', 'backlog.json');
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  return Array.isArray(d) ? d : (d.itens || d.items || []);
}

// O backlog usa DOIS campos de dono — `agente` e `papel`. Lendo só o primeiro, 5 dos 15 itens
// livres ficavam invisíveis em 24/08 (achado do dev-plataforma). Ler os dois é a correção que
// não mexe na fila do dono.
const dono = (i) => i.agente || i.papel || null;

(() => {
  const its = backlog();
  const livres = its.filter((i) => i.estado === 'livre');
  const emCurso = its.filter((i) => i.estado === 'em-curso');

  const porQuem = {};
  for (const i of livres) { const q = dono(i); if (q) (porQuem[q] = porQuem[q] || []).push(i); }

  const daFrente = CONSTRUTORES.reduce((n, a) => n + (porQuem[a] || []).length, 0);
  const secos = CONSTRUTORES.filter((a) => !(porQuem[a] || []).length);

  console.log('  CONSTRUTORES (vivem de fila)');
  for (const a of CONSTRUTORES) {
    const n = (porQuem[a] || []).length;
    console.log('    ' + a.padEnd(22) + (n ? String(n) : '— ZERO'));
  }
  const outros = Object.keys(porQuem).filter((a) => !CONSTRUTORES.includes(a));
  if (outros.length) {
    console.log('  OUTROS com item livre');
    for (const a of outros) console.log('    ' + a.padEnd(22) + (porQuem[a] || []).length);
  }
  console.log('\n  livres para construtor: ' + daFrente + ' (piso ' + PISO + ')  ·  em curso: ' + emCurso.length);

  if (SO_QUEM) process.exit(0);

  const falhas = [];
  // O PISO DE SOMA NAO BASTA — achado do QA em 24/08. Tres itens do MESMO construtor num
  // territorio exclusivo (src/jogo.ts e um escritor por vez, §3.3.2) sustentam UM agente, nao
  // tres, e o portao dizia 'trabalho para uma rodada inteira'. Some um segundo criterio: ao
  // menos DOIS construtores distintos com item, senao o paralelo do teto nao se realiza.
  const comItem = CONSTRUTORES.filter((a) => (porQuem[a] || []).length).length;
  if (comItem < 2 && daFrente >= PISO) {
    falhas.push('A FILA CONCENTRA: ' + daFrente + ' itens livres, mas em so ' + comItem
      + ' construtor(es) — o teto de 2 a 3 agentes por rodada nao se realiza com um escritor so.');
  }
  if (daFrente < PISO) {
    falhas.push('A FILA SECOU: ' + daFrente + ' item(ns) livre(s) para construtor, abaixo do piso de ' + PISO
      + '. Despache o `pm` para repriorizar e encher — a lei do contínuo diz que fila vazia é '
      + 'defeito de plantão, não pausa.');
  }
  if (secos.length === CONSTRUTORES.length) {
    falhas.push('NENHUM construtor tem item: ' + secos.join(', ') + '.');
  }

  console.log('\n' + (falhas.length
    ? 'FILA: FALHOU\n  ✗ ' + falhas.join('\n  ✗ ')
    : 'FILA: PASSOU — há trabalho para pelo menos uma rodada inteira.'));
  process.exit(falhas.length ? 1 : 0);
})();
