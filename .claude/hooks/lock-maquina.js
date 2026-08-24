// O LOCK ENTRE MÁQUINAS — Proposta B do PR #4, escrita pela sessão do Mac em 23/08 e
// implementada aqui, do lado que enxerga o que está em voo (decisão do dono).
//
// O PROBLEMA, medido por ela: o `em-curso` do backlog não travava nada — a palavra só existia
// dentro do próprio JSON, nenhuma ferramenta lia. Duas máquinas trabalhando no mesmo repositório
// dependiam de honra, e honra não escrita é a pior forma de uma regra existir.
//
// A LÓGICA MORA AQUI, e não dentro do guarda, por dois motivos: o guarda roda em TODA escrita e
// precisa continuar legível, e uma peça isolada é testável sozinha (test/guarda-lock.js chama
// esta função direto, sem simular o harness).
//
// DEGRADAR É A REGRA, e ela vale mais que travar: sem `.claude/maquina`, com JSON quebrado, com
// campo faltando ou com lock velho, esta função devolve `null` e ninguém é impedido de nada.
// Máquina travada por engano é pior que colisão — a frase é da proposta, e ela está certa.
const fs = require('fs');
const path = require('path');

// Quanto tempo um lock vale. A proposta chutou 12 h e pediu o número de quem tem os dados:
// as rodadas de agente de 21 e 22/08 duraram de 2 a 67 minutos (a mais longa medida, ~4.000 s,
// foi o passe de pixel no jogo). DUAS HORAS cobre a mais longa com 45 min de folga; 12 h de
// lock esquecido tira meio dia da outra máquina.
const VALIDADE_MS = 2 * 60 * 60 * 1000;

// Diários entram por merge=union e nunca colidem de verdade: travá-los seria só atrito.
const NUNCA_TRAVA = /^(NOTES|PENDENTES|EQUIPE|AGENTES|DIRECAO|TERRITORIO)\.md$/;

function lerMaquina(RAIZ) {
  try {
    const p = path.join(RAIZ, '.claude', 'maquina');
    if (!fs.existsSync(p)) return null;                 // sem nome: não trava nada
    const nome = fs.readFileSync(p, 'utf8').trim().split('\n')[0].trim();
    return nome || null;
  } catch { return null; }
}

// Normaliza `territorio` para lista. A mesa às vezes escreve STRING em vez de array (medido no
// PENDENTES 84: 23 array, 7 string, 16 sem campo) — os 7 string não podiam virar `[]` em
// silêncio, porque isso é a trava desaparecendo sem avisar ninguém. Forma não reconhecida
// (nem array, nem string, nem ausente) também não vira `[]` calada: avisa no stderr, o mesmo
// padrão de "degradar não é silenciar" que o resto do arquivo já segue.
function normalizarTerritorio(territorio, idParaAviso) {
  if (territorio == null) return [];
  if (Array.isArray(territorio)) return territorio;
  if (typeof territorio === 'string') {
    return territorio.split(',').map((s) => s.trim()).filter(Boolean);
  }
  process.stderr.write(
    'lock-maquina: item ' + (idParaAviso || '(sem id)') +
    ' tem território em forma não reconhecida (' + typeof territorio + ') — tratado como vazio\n'
  );
  return [];
}

// Casa `rel` contra um padrão de território do backlog. Três formas, e só três:
//   "dashboard/"            → prefixo de pasta
//   "ferramentas/gerar-*.js" → glob de um segmento
//   "src/jogo.ts"           → caminho exato (ou pasta com esse nome)
function casaTerritorio(rel, padrao) {
  if (!padrao || typeof padrao !== 'string') return false;
  const p = padrao.trim().replace(/^\.\//, '').split(path.sep).join('/');
  if (!p) return false;
  if (p.endsWith('/')) return rel === p.slice(0, -1) || rel.startsWith(p);
  if (p.includes('*')) {
    const re = new RegExp('^' + p.split('*').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*') + '$');
    return re.test(rel);
  }
  return rel === p || rel.startsWith(p + '/');
}

// Devolve o item que TRAVA este arquivo para esta máquina, ou null.
// As três condições da proposta, na ordem dela: cai no território · está em-curso · a máquina
// do item não é a minha. Mais as exceções que ela mesma listou, e a validade.
function quemTrava(rel, RAIZ, agora) {
  try {
    const eu = lerMaquina(RAIZ);
    if (!eu) return null;
    if (NUNCA_TRAVA.test(rel)) return null;
    // arquivo que ainda não existe não colide: criar é sempre seguro, o git funde sozinho
    if (!fs.existsSync(path.join(RAIZ, rel))) return null;

    const bruto = fs.readFileSync(path.join(RAIZ, 'ferramentas', 'backlog.json'), 'utf8');
    const doc = JSON.parse(bruto);
    const itens = Array.isArray(doc) ? doc : (doc.itens || []);
    const t = agora == null ? Date.now() : agora;

    for (const it of itens) {
      if (!it || it.estado !== 'em-curso') continue;      // só em-curso trava
      if (!it.maquina || it.maquina === eu) continue;     // sem dono, ou é meu: passa
      const desde = it.desde ? Date.parse(it.desde) : NaN;
      if (isNaN(desde)) continue;                          // sem carimbo confiável: não trava
      if (t - desde > VALIDADE_MS) continue;               // lock vencido: passa (e é de propósito)
      const terr = normalizarTerritorio(it.territorio, it.id);
      if (terr.some((p) => casaTerritorio(rel, p))) {
        return { id: it.id || '(sem id)', titulo: it.titulo || '', maquina: it.maquina, desde: it.desde };
      }
    }
    return null;
  } catch {
    return null;   // dado ruim NUNCA vira bloqueio: o backlog é editado ao vivo pela mesa do dono
  }
}

module.exports = { quemTrava, casaTerritorio, lerMaquina, VALIDADE_MS, normalizarTerritorio };
