#!/usr/bin/env node
// Controlla gli asset del gioco prima della revisione e nella verifica automatica.
//
// Uso (dalla radice del progetto):  node scripts/asset/controlla.mjs
// Esce con codice 1 se trova errori; gli avvisi non bloccano.
//
// Verifica: manifesto coerente con i file, ogni asset.json ha il suo file
// pubblicato aggiornato e la sua anteprima, nomi validi, dimensioni entro i
// limiti, nessun file orfano, file binari affidati a Git LFS.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const RADICE = process.cwd();
const SORGENTI = path.join(RADICE, 'assets-src');
const PUBBLICI = path.join(RADICE, 'app', 'frontend', 'public', 'assets', 'blender');
const MAX_LATO = 4096;
const AVVISO_MB = 2;
const NOME_VALIDO = /^[a-z0-9]+(-[a-z0-9]+)*$/;

let errori = 0;
let avvisi = 0;
const err = (m) => { errori++; console.error(`ERRORE  ${m}`); };
const avv = (m) => { avvisi++; console.warn(`AVVISO  ${m}`); };
const rel = (p) => path.relative(RADICE, p).split(path.sep).join('/');

let sharp = null;
try {
  sharp = createRequire(path.join(RADICE, 'app', 'frontend', 'package.json'))('sharp');
} catch {
  avv('"sharp" non installato in app/frontend: salto il controllo delle dimensioni');
}

// 1. Git LFS per i binari.
const attr = fs.existsSync(path.join(RADICE, '.gitattributes'))
  ? fs.readFileSync(path.join(RADICE, '.gitattributes'), 'utf8')
  : '';
for (const est of ['blend', 'png']) {
  if (!new RegExp(`\\*\\.${est}\\s+filter=lfs`).test(attr)) err(`.gitattributes: manca "*.${est} filter=lfs diff=lfs merge=lfs -text"`);
}
for (const f of ['.gitignore']) {
  const g = fs.existsSync(path.join(RADICE, f)) ? fs.readFileSync(path.join(RADICE, f), 'utf8') : '';
  if (!/assets-src\/\*\*\/render\//.test(g)) err('.gitignore: manca "assets-src/**/render/" (i fotogrammi intermedi non vanno nel repository)');
  if (!/\*\.blend1/.test(g)) avv('.gitignore: aggiungi "*.blend1" (copie di sicurezza di Blender)');
}

// 2. Sorgenti.
const attesi = new Map(); // percorso pubblico relativo -> chiave
const chiavi = new Set();
if (fs.existsSync(SORGENTI)) {
  for (const cat of fs.readdirSync(SORGENTI, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    if (!NOME_VALIDO.test(cat.name)) err(`assets-src/${cat.name}: nome di categoria non valido`);
    for (const a of fs.readdirSync(path.join(SORGENTI, cat.name), { withFileTypes: true }).filter((d) => d.isDirectory())) {
      const c = path.join(SORGENTI, cat.name, a.name);
      const specFile = path.join(c, 'asset.json');
      if (!fs.existsSync(specFile)) { err(`${rel(c)}: manca asset.json`); continue; }
      if (!NOME_VALIDO.test(a.name)) err(`${rel(c)}: nome non valido (minuscole, cifre, trattini)`);
      let spec;
      try { spec = JSON.parse(fs.readFileSync(specFile, 'utf8')); } catch { err(`${rel(specFile)}: JSON non valido`); continue; }
      const chiave = spec.chiave ?? `${cat.name}-${a.name}`;
      if (chiavi.has(chiave)) err(`chiave duplicata "${chiave}"`);
      chiavi.add(chiave);
      if (!fs.existsSync(path.join(c, `${a.name}.blend`))) err(`${rel(c)}: manca ${a.name}.blend`);
      if (!fs.existsSync(path.join(c, 'genera.py'))) err(`${rel(c)}: manca genera.py (il codice eseguito in Blender, per poter rigenerare l'asset)`);
      if (!fs.existsSync(path.join(c, 'anteprima.png'))) err(`${rel(c)}: manca anteprima.png (lancia impacchetta.mjs)`);
      const png = path.join(PUBBLICI, cat.name, `${a.name}.png`);
      attesi.set(rel(png), chiave);
      if (spec.tipo !== 'immagine') attesi.set(rel(png.replace(/\.png$/, '.json')), chiave);
      if (!fs.existsSync(png)) { err(`${rel(png)}: non pubblicato (lancia impacchetta.mjs)`); continue; }
      const piuVecchio = ['asset.json', `${a.name}.blend`, 'genera.py']
        .map((f) => path.join(c, f)).filter((f) => fs.existsSync(f))
        .some((f) => fs.statSync(f).mtimeMs > fs.statSync(png).mtimeMs + 1000);
      if (piuVecchio && !process.env.CI) avv(`${rel(png)}: più vecchio dei sorgenti, forse va rigenerato`);
      if (sharp) {
        const m = await sharp(png).metadata();
        if (m.width > MAX_LATO || m.height > MAX_LATO) err(`${rel(png)}: ${m.width}x${m.height} oltre ${MAX_LATO}px`);
        if (spec.tipo !== 'immagine' && !m.hasAlpha) err(`${rel(png)}: sprite senza trasparenza (attiva "Film > Transparent" in Blender)`);
        if (spec.tipo !== 'immagine' && spec.dimensioneFotogramma) {
          const [fw, fh] = spec.dimensioneFotogramma;
          if (m.width % fw || m.height % fh) err(`${rel(png)}: dimensioni non multiple del fotogramma ${fw}x${fh}`);
        }
      }
      const mb = fs.statSync(png).size / 1024 / 1024;
      if (mb > AVVISO_MB) avv(`${rel(png)}: ${mb.toFixed(1)} MB, valuta fotogrammi più piccoli o meno colori`);
    }
  }
}

// 3. Manifesto e file orfani.
const manifestoFile = path.join(PUBBLICI, 'assets.json');
if (attesi.size && !fs.existsSync(manifestoFile)) err('app/frontend/public/assets/blender/assets.json mancante');
if (fs.existsSync(manifestoFile)) {
  const man = JSON.parse(fs.readFileSync(manifestoFile, 'utf8'));
  for (const v of man.asset ?? []) {
    if (!chiavi.has(v.chiave)) err(`assets.json: "${v.chiave}" non ha sorgente in assets-src`);
    for (const f of [v.file, v.atlante].filter(Boolean)) {
      if (!fs.existsSync(path.join(PUBBLICI, f))) err(`assets.json: "${v.chiave}" punta a ${f} che non esiste`);
    }
  }
  for (const k of chiavi) if (!(man.asset ?? []).some((v) => v.chiave === k)) err(`assets.json: manca "${k}" (lancia impacchetta.mjs)`);
}
function cammina(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? cammina(path.join(dir, d.name)) : [path.join(dir, d.name)]);
}
for (const f of cammina(PUBBLICI)) {
  const r = rel(f);
  if (r.endsWith('/assets.json')) continue;
  if (!attesi.has(r)) avv(`${r}: file senza asset.json in assets-src (orfano o aggiunto a mano)`);
}

console.log(`Asset controllati: ${chiavi.size}; errori ${errori}, avvisi ${avvisi}.`);
process.exit(errori ? 1 : 0);
