#!/usr/bin/env node
// O PORTÃO QUE RECUSA A ESCRITA — decidido pelo dono em 2026-08-19.
//
// POR QUE ELE EXISTE. Duas regras deste repositório eram PROSA: "nunca edite o index.html da
// raiz" e "a tela ONDE FOI é do dono". Prosa depende de o agente ler, lembrar e obedecer — e
// um agente que não leu não é desobediente, é só um agente que não leu. Palavras dele:
// *"gosto de hooks q travam mecanicamente, e inclusive pode tirar essas duas regras"*.
//
// A DIFERENÇA, e é a única que importa: pedir vira GARANTIR. Este arquivo roda antes de cada
// Write/Edit, e sair com código 2 **cancela a chamada** — o modelo recebe o motivo pelo stderr
// e segue trabalhando. Não é aviso, não é lembrete: é recusa.
//
// O TERRITÓRIO NÃO ESTÁ ESCRITO AQUI. Ele é lido do `TERRITORIO.md`, que passa a ser DADO e não
// mais texto para obedecer. Acrescentar um símbolo à lista de lá passa a travá-lo de verdade,
// sem tocar nesta função — e é de propósito: a lista é do dono, o portão é maquinário.
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..', '..');

let bruto = '';
process.stdin.on('data', (c) => { bruto += c; });
process.stdin.on('end', () => {
  let ev;
  try { ev = JSON.parse(bruto || '{}'); } catch { process.exit(0); }   // não entendi: não atrapalho

  const ferramenta = ev.tool_name || '';
  const ent = ev.tool_input || {};
  const alvo = ent.file_path || ent.notebook_path || '';
  if (!alvo) process.exit(0);

  const rel = path.relative(RAIZ, path.resolve(alvo)).split(path.sep).join('/');
  const recusar = (motivo) => { process.stderr.write(motivo); process.exit(2); };

  // ---- 1. SAÍDA DE BUILD. Escrever aqui não é errado, é INÚTIL: o próximo `npm run build`
  // apaga. O sintoma é pior que um erro — o trabalho some sem ninguém notar, e a sessão
  // seguinte lê o arquivo de ontem achando que é o de hoje.
  const saida = [
    [/^index\.html$/, 'o index.html da RAIZ é saída de build'],
    [/^pack-[\w-]+\.json$/, 'os pack-*.json são saída de build'],
    [/^dist\//, 'a pasta dist/ é saída de build'],
    [/^android\/app\/src\/main\/assets\/public\//, 'os assets do Android são saída de `npm run app`'],
  ];
  for (const [re, oq] of saida) {
    if (re.test(rel)) {
      recusar(
        'RECUSADO pelo portão: ' + oq + ' — o próximo `npm run build` apaga o que você escrever.\n' +
        'A FONTE é src/index.html, src/estilo.css e src/jogo.ts. Edite lá e rode `npm run build`.\n' +
        '(regra do CLAUDE.md §3.1, virada portão em 19/08 porque como prosa ela dependia de ser lida)\n'
      );
    }
  }

  // ---- 2. TERRITÓRIO TRAVADO POR OUTRA MÁQUINA (Proposta B do PR #4, 23/08).
  // O `em-curso` do backlog era honra: a palavra só existia dentro do JSON e nenhuma ferramenta
  // lia. Agora ela recusa — mas só quando há certeza: outra máquina, item em-curso, território
  // casado e lock dentro da validade (2 h). Qualquer dúvida — sem `.claude/maquina`, JSON
  // quebrado, carimbo ruim, lock vencido — DEGRADA para o comportamento de sempre, porque
  // máquina travada por engano é pior que colisão. A lógica mora em `lock-maquina.js` para
  // caber num teste sozinha (test/guarda-lock.js).
  try {
    const { quemTrava } = require(path.join(__dirname, 'lock-maquina.js'));
    const trava = quemTrava(rel, RAIZ);
    if (trava) {
      const hora = String(trava.desde || '').replace('T', ' ').slice(0, 16);
      recusar(
        'RECUSADO pelo portão: ' + rel + ' pertence ao item ' + trava.id +
        (trava.titulo ? ' (' + trava.titulo + ')' : '') + ', em curso na máquina ' +
        trava.maquina + ' desde ' + hora + ' UTC.\n' +
        'Duas máquinas escrevendo no mesmo território se atropelam em silêncio.\n' +
        'Pegue outro item livre do backlog, ou fale com o dono. O lock vence sozinho em 2 h.\n' +
        '(Proposta B do PR #4; o estado sai de ferramentas/backlog.json, nunca deste arquivo)\n'
      );
    }
  } catch { /* o portão nunca vira bloqueio total por causa de dado ruim */ }

  // ---- 3. A ZONA DO DONO. A tela ONDE FOI é dele desde 17/08, e ele trabalha nela em OUTRA
  // máquina — duas escritas simultâneas no mesmo arquivo de 15 mil linhas se atropelam em
  // silêncio. Os símbolos saem do TERRITORIO.md, nunca daqui.
  const territorio = path.join(RAIZ, 'TERRITORIO.md');
  if (!fs.existsSync(territorio)) process.exit(0);

  const doc = fs.readFileSync(territorio, 'utf8');
  const zona = doc.split('## ✅ ZONA LIVRE')[0] || '';
  // os símbolos vêm entre crases na seção da zona do dono; só os que parecem identificador,
  // e com pelo menos 5 letras — `Lugar` e `Ponto` são nomes curtos demais para casar sem ruído
  // dentro de um arquivo deste tamanho, e travar por engano é pior que não travar.
  const simbolos = [...new Set((zona.match(/`([A-Za-z_][\w]*)`/g) || [])
    .map((s) => s.slice(1, -1))
    .filter((s) => s.length >= 5))];
  // os seletores de CSS e os ids do molde, que vêm com # ou . na frente
  const seletores = [...new Set((zona.match(/`([#.][\w*-]+)`/g) || []).map((s) => s.slice(1, -1)))];

  const donoDeArquivo = /^src\/(jogo\.ts|index\.html|estilo\.css)$/.test(rel);
  if (!donoDeArquivo) process.exit(0);

  // O que a chamada vai ESCREVER. Num Edit, o que importa é o texto novo e o antigo: mexer no
  // texto antigo já é apagar código dele. Num Write, é o arquivo inteiro — e aí o portão não
  // tem como julgar, então só recusa se o conteúdo NÃO trouxer os símbolos que já existiam
  // (isto é, se a reescrita os estiver perdendo).
  const pedacos = [];
  if (ferramenta === 'Edit') { pedacos.push(String(ent.old_string || ''), String(ent.new_string || '')); }
  const texto = pedacos.join('\n');

  if (ferramenta === 'Edit' && texto) {
    const achados = [...simbolos, ...seletores].filter((s) => {
      const esc = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = s[0] === '#' || s[0] === '.' ? new RegExp(esc + '\\b') : new RegExp('\\b' + esc + '\\b');
      return re.test(texto);
    });
    if (achados.length) {
      recusar(
        'RECUSADO pelo portão: esta edição toca a ZONA DO DONO (a tela ONDE FOI).\n' +
        'Símbolos encontrados: ' + achados.join(', ') + '\n' +
        'Ele trabalha nessa tela em OUTRA máquina; duas escritas no mesmo arquivo se atropelam\n' +
        'em silêncio. PARE e avise — não edite e peça perdão depois.\n' +
        'A lista sai do TERRITORIO.md; se um símbolo caiu aqui por engano, é lá que se conserta.\n'
      );
    }
  }

  if (ferramenta === 'Write') {
    const conteudo = String(ent.content || '');
    const arquivo = path.resolve(alvo);
    if (fs.existsSync(arquivo)) {
      const antes = fs.readFileSync(arquivo, 'utf8');
      const perdidos = simbolos.filter((s) => antes.includes(s) && !conteudo.includes(s));
      if (perdidos.length) {
        recusar(
          'RECUSADO pelo portão: esta reescrita APAGA símbolos da ZONA DO DONO.\n' +
          'Sumiriam: ' + perdidos.join(', ') + '\n' +
          'Use Edit em trechos, nunca Write no arquivo inteiro — e nunca na tela ONDE FOI.\n'
        );
      }
    }
  }

  process.exit(0);
});
