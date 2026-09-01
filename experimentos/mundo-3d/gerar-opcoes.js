// GERA AS CÓPIAS-VARIANTE do sp-relevo.html para a decisão da issue #10 (perguntas 2 e 3).
// Cada variante é uma mudança MÍNIMA por substituição de texto exato — se a agulha não casar
// (porque o sp-relevo.html mudou), este script ERRA ALTO em vez de gerar uma cópia torta.
//
//   node experimentos/mundo-3d/gerar-opcoes.js
//
// Saídas (mesma pasta):
//   sp-relevo-opcao-a.html      — PAREDE A: maquete em baixo-relevo (vizinhos = mesa neutra, só o litoral cai)
//   sp-relevo-opcao-b.html      — PAREDE B: ilha assumida (o estado atual, intocado, + só o gancho de câmera)
//   sp-relevo-opcao-c.html      — PAREDE C: chapas fantasma com nome (MINAS GERAIS, PARANÁ, ...)
//   sp-relevo-pixel-cena.html   — PIXEL: render inteiro pixelado (1/4 da resolução + nearest)
//   sp-relevo-pixel-avatar.html — PIXEL: cena limpa, pixel art só no avatar
//
// NENHUMA das variantes desenha aldeia, oca, roça ou marca de presença humana — a pergunta 1
// da issue é do DONO (§2 do CLAUDE.md) e não se responde com imagem gerada por agente.

const fs = require('fs');
const path = require('path');

const PASTA = __dirname;
const BASE = fs.readFileSync(path.join(PASTA, 'sp-relevo.html'), 'utf8').split(String.fromCharCode(13)).join(''); // o original e CRLF; tira todo CR e as agulhas em LF casam

function trocar(texto, agulha, novo, rotulo) {
  const i = texto.indexOf(agulha);
  if (i < 0) { console.error('AGULHA NAO CASOU [' + rotulo + ']:\n' + agulha); process.exit(1); }
  if (texto.indexOf(agulha, i + 1) >= 0) { console.error('AGULHA AMBIGUA [' + rotulo + ']'); process.exit(1); }
  return texto.slice(0, i) + novo + texto.slice(i + agulha.length);
}

// ---- pedaços comuns -------------------------------------------------------

// gancho de prova: expõe câmera/controles para o harness enquadrar TODOS os prints igual.
// Não muda nada do render.
const GANCHO_DE = '  pronto=true;';
const GANCHO_PARA = '  pronto=true; window.__prova={camera,controls,scene,renderer,hero};';

// mar aproximado (linha da costa Ubatuba->Cananéia; a leste de -45 a costa vira p/ RJ).
// NÃO é carta náutica — é maquete; o que importa é: divisa de TERRA não vira falésia.
const EH_MAR =
  '// mar aproximado: sudeste da linha da costa (maquete, nao carta nautica)\n' +
  'function ehMar(lon,lat){ const latC = lon < -45 ? (-23.43+0.549*(lon+45.07)) : (-23.35+0.1*(lon+45)); return lat < latC-0.06; }\n';

const ANTES_RINGS = 'let RINGS=[], BB, heightAt=()=>10, terra, MAT;';

const GRID_DE = '  BB={minx,maxx,minz,maxz};\n\n  // heightfield: grid sobre o bbox, mascarado ao polígono\n  const N=150, W=maxx-minx, H=maxz-minz;';
function gridPara(coment) {
  return '  BB={minx,maxx,minz,maxz};\n\n  // ' + coment + '\n  minx-=42;maxx+=42;minz-=42;maxz+=42;\n  const N=170, W=maxx-minx, H=maxz-minz;';
}

const CORES_DE = "  const cMata=new THREE.Color('#2f6b3d'), cAlta=new THREE.Color('#6b7a3a'), cRocha=new THREE.Color('#857e6f'), cAreia=new THREE.Color('#e0cfa0');";

const FORA_DE = "    const dentro=inPoly(x,z,RINGS); let y;\n    if(dentro){ y=elevLL(invLon(x),invLat(z)); } else { y=-6; }";
const COR_DE = '    if(y<0.5) c=cAreia; else if(t<.75)';
const COR_PARA = '    if(corFixa) c=corFixa; else if(y<0.5) c=cAreia; else if(t<.75)';

const ALT_DE = '  heightAt=(x,z)=> inPoly(x,z,RINGS)? elevLL(invLon(x),invLat(z)) : -6;';

// ---- OPÇÃO A: maquete em baixo-relevo ------------------------------------
let a = BASE;
a = trocar(a, ANTES_RINGS, EH_MAR + ANTES_RINGS, 'a:ehMar');
a = trocar(a, GRID_DE, gridPara('OPCAO A: a mesa continua alem da divisa — so o litoral cai para o mar'), 'a:grid');
a = trocar(a, CORES_DE, CORES_DE + "\n  const cMesa=new THREE.Color('#b7ab93'); // mesa neutra de maquete", 'a:cores');
a = trocar(a, FORA_DE,
  '    const dentro=inPoly(x,z,RINGS); let y; let corFixa=null;\n' +
  '    if(dentro){ y=elevLL(invLon(x),invLat(z)); }\n' +
  '    else { const lo=invLon(x), la=invLat(z);\n' +
  '      const latC=(lo<-45?(-23.43+0.549*(lo+45.07)):(-23.35+0.1*(lo+45)))-0.03;\n' +
  '      const q=THREE.MathUtils.clamp((latC-la)/0.22,0,1); // 0=mesa, 1=mar fundo\n' +
  '      y=4.5-(4.5+6)*q; corFixa=cMesa.clone().lerp(cAreia,Math.min(1,q*1.2)); } // divisa de terra: mesa; litoral: bisel', 'a:fora');
a = trocar(a, COR_DE, COR_PARA, 'a:cor');
a = trocar(a, ALT_DE, '  heightAt=(x,z)=> inPoly(x,z,RINGS)? elevLL(invLon(x),invLat(z)) : (ehMar(invLon(x),invLat(z))?-6:4.5);', 'a:alt');
a = trocar(a, GANCHO_DE, GANCHO_PARA, 'a:gancho');
fs.writeFileSync(path.join(PASTA, 'sp-relevo-opcao-a.html'), a);

// ---- OPÇÃO B: ilha assumida (estado atual + gancho) ----------------------
let b = trocar(BASE, GANCHO_DE, GANCHO_PARA, 'b:gancho');
fs.writeFileSync(path.join(PASTA, 'sp-relevo-opcao-b.html'), b);

// ---- OPÇÃO C: chapas fantasma com nome -----------------------------------
const TERRA_DE = '  terra=new THREE.Mesh(g,MAT); terra.receiveShadow=true; terra.castShadow=true; scene.add(terra);';
const ROTULOS =
  '\n  // chapas fantasma: os vizinhos existem como NOME, nao como terreno\n' +
  "  function rotulo(txt,lon,lat){ const cv=document.createElement('canvas'); cv.width=1024; cv.height=192; const c2=cv.getContext('2d');\n" +
  "    c2.font='700 92px Georgia,serif'; c2.textAlign='center'; c2.textBaseline='middle'; c2.fillStyle='rgba(66,74,80,.95)'; let fpx=92; while(fpx>40 && c2.measureText(txt).width>980){ fpx-=4; c2.font='700 '+fpx+'px Georgia,serif'; } c2.fillText(txt,512,96);\n" +
  '    const tx=new THREE.CanvasTexture(cv); tx.colorSpace=THREE.SRGBColorSpace; tx.anisotropy=8;\n' +
  '    const sp2=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true,depthTest:false,depthWrite:false}));\n' +
  '    const pr=proj(lon,lat); sp2.position.set(pr[0],16,pr[1]); sp2.scale.set(60,11.25,1); scene.add(sp2); }\n' +
  "  rotulo('MINAS GERAIS',-46.3,-20.6);\n" +
  "  rotulo('RIO DE JANEIRO',-43.9,-22.3);\n" +
  "  rotulo('PARAN\\u00c1',-50.6,-24.9);\n" +
  "  rotulo('MATO GROSSO DO SUL',-52.4,-20.5);\n";
let c = BASE;
c = trocar(c, ANTES_RINGS, EH_MAR + ANTES_RINGS, 'c:ehMar');
c = trocar(c, GRID_DE, gridPara('OPCAO C: chapa fantasma plana no lugar dos vizinhos'), 'c:grid');
c = trocar(c, CORES_DE, CORES_DE + "\n  const cChapa=new THREE.Color('#a7aeb2'); // chapa fantasma", 'c:cores');
c = trocar(c, FORA_DE,
  '    const dentro=inPoly(x,z,RINGS); let y; let corFixa=null;\n' +
  '    if(dentro){ y=elevLL(invLon(x),invLat(z)); }\n' +
  '    else { const lo=invLon(x), la=invLat(z);\n' +
  '      const latC=(lo<-45?(-23.43+0.549*(lo+45.07)):(-23.35+0.1*(lo+45)))-0.03;\n' +
  '      const q=THREE.MathUtils.clamp((latC-la)/0.22,0,1);\n' +
  '      y=1.2-(1.2+6)*q; corFixa=(q<0.1)?cChapa:cChapa.clone().lerp(cAreia,Math.min(1,q*1.2)); } // vizinho = chapa; litoral: bisel', 'c:fora');
c = trocar(c, COR_DE, COR_PARA, 'c:cor');
c = trocar(c, ALT_DE, '  heightAt=(x,z)=> inPoly(x,z,RINGS)? elevLL(invLon(x),invLat(z)) : (ehMar(invLon(x),invLat(z))?-6:1.2);', 'c:alt');
c = trocar(c, TERRA_DE, TERRA_DE + ROTULOS, 'c:rotulos');
c = trocar(c, GANCHO_DE, GANCHO_PARA, 'c:gancho');
fs.writeFileSync(path.join(PASTA, 'sp-relevo-opcao-c.html'), c);

// ---- PIXEL-CENA: render inteiro a 1/4 + nearest --------------------------
let pc = BASE;
pc = trocar(pc, '  #c{position:fixed;inset:0;display:block}',
  '  #c{position:fixed;inset:0;display:block;width:100%;height:100%;image-rendering:pixelated}', 'pc:css');
pc = trocar(pc, 'renderer=new THREE.WebGLRenderer({canvas,antialias:true});',
  'renderer=new THREE.WebGLRenderer({canvas,antialias:false}); // pixelado: sem AA', 'pc:aa');
pc = trocar(pc, 'renderer.setPixelRatio(Math.min(devicePixelRatio,2));',
  'renderer.setPixelRatio(1); // pixelado: 1/4 da resolucao, ampliado por nearest no CSS', 'pc:ratio');
pc = trocar(pc, 'function resize(){ renderer.setSize(innerWidth,innerHeight);',
  'function resize(){ renderer.setSize(Math.floor(innerWidth/4),Math.floor(innerHeight/4),false);', 'pc:resize');
pc = trocar(pc, GANCHO_DE, GANCHO_PARA, 'pc:gancho');
fs.writeFileSync(path.join(PASTA, 'sp-relevo-pixel-cena.html'), pc);

// ---- PIXEL-AVATAR: cena limpa, pixel art só no que é gente ---------------
const HEROI_DE =
  "  const corpo=new THREE.Mesh(new THREE.CapsuleGeometry(.8,1.5,4,8),new THREE.MeshStandardMaterial({color:'#b5541f',flatShading:true})); corpo.position.y=1.6; hero.add(corpo);\n" +
  "  const cab=new THREE.Mesh(new THREE.SphereGeometry(.62,10,10),new THREE.MeshStandardMaterial({color:'#e8b98a'})); cab.position.y=3; hero.add(cab);\n" +
  "  const fr=new THREE.Mesh(new THREE.ConeGeometry(.3,.8,4),new THREE.MeshStandardMaterial({color:'#33240f'})); fr.rotation.x=Math.PI/2; fr.position.set(0,1.6,.9); hero.add(fr);\n" +
  '  hero.traverse(o=>{if(o.isMesh)o.castShadow=true;});';
const HEROI_PARA =
  '  // pixel SO no que e gente: sprite em pixel art (NearestFilter); o mundo continua limpo.\n' +
  '  // Figura generica de caminhante — nenhuma marca de povo, roupa ou epoca (§2 e do dono).\n' +
  "  const MAPA=['....hhhh....','...hhhhhh...','...ssssss...','...shsshs...','....ssss....','...cccccc...','..cccccccc..','.s.cccccc.s.','.s.cccccc.s.','...cccccc...','...pppppp...','...pp..pp...','...pp..pp...','...pp..pp...','...bb..bb...','..bbb..bbb..'];\n" +
  "  const COR={h:'#2a1c10',s:'#e8b98a',c:'#b5541f',p:'#4a3320',b:'#221808'};\n" +
  "  const pcv=document.createElement('canvas'); pcv.width=12; pcv.height=MAPA.length; const px2=pcv.getContext('2d');\n" +
  '  MAPA.forEach((lin,j)=>{ for(let k=0;k<lin.length;k++){ const ch=lin[k]; if(COR[ch]){ px2.fillStyle=COR[ch]; px2.fillRect(k,j,1,1); } } });\n' +
  '  const ptex=new THREE.CanvasTexture(pcv); ptex.magFilter=THREE.NearestFilter; ptex.minFilter=THREE.NearestFilter; ptex.colorSpace=THREE.SRGBColorSpace;\n' +
  '  const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:ptex,transparent:true})); spr.scale.set(3.3,4.4,1); spr.position.y=2.2; hero.add(spr);';
let pa = BASE;
pa = trocar(pa, HEROI_DE, HEROI_PARA, 'pa:heroi');
pa = trocar(pa, GANCHO_DE, GANCHO_PARA, 'pa:gancho');
fs.writeFileSync(path.join(PASTA, 'sp-relevo-pixel-avatar.html'), pa);

console.log('5 variantes escritas em', PASTA);
