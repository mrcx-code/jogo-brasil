// The jump sheet was drawn 1.54x larger than the walk sheet — measured on head width, which is
// the one thing that does not change with the pose. Resample so the character is the same size
// in both, then re-lay onto a 191-wide canvas with the head centred (drawHero centres the frame
// on HX) and the feet on the bottom edge (it anchors the bottom at the foot line).
//
// A largura de destino e opcional (5o argumento). Ela nao precisa ser a mesma entre folhas:
// drawHero centra CADA quadro em HX pela sua propria largura, entao uma folha mais larga so
// carrega mais transparencia em volta. O que ela nao pode e ser MENOR que o quadro
// reescalado, porque ai as laterais saem cortadas — foi por isso que o 191 fixo virou
// parametro quando a arte nova chegou com 195 de largura de caminhada.
const fs = require('fs');
const { chromium } = require('playwright');
const dados = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const R = parseFloat(process.argv[3]);
const OUT = process.argv[4];
const LARGURA = process.argv[5] ? parseInt(process.argv[5], 10) : 191;
function chromiumPath() { return process.env.PW_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined); }
(async () => {
  const b = await chromium.launch({ executablePath: chromiumPath() });
  const p = await b.newPage();
  const out = await p.evaluate(async (args) => {
    const { fr, R, LARGURA } = args;
    const imgs = await Promise.all(fr.map(f => new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = f.b64; })));
    const alt = Math.round(imgs[0].naturalHeight * R);
    return imgs.map(im => {
      const w = Math.round(im.naturalWidth * R), h = Math.round(im.naturalHeight * R);
      const c = document.createElement('canvas'); c.width = LARGURA; c.height = alt;
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(im, Math.round((LARGURA - w) / 2), alt - h, w, h);
      return { w: LARGURA, h: alt, b64: c.toDataURL('image/webp', 0.9) };
    });
  }, { fr: dados.frames, R, LARGURA });
  await b.close();
  fs.writeFileSync(OUT, JSON.stringify({ frames: out }));
  console.log('frames:', out.length, 'em', out[0].w + 'x' + out[0].h);
  console.log('peso:', Math.round(out.reduce((n, f) => n + f.b64.length, 0) / 1024), 'kb');
})();
