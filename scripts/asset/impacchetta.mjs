#!/usr/bin/env node
// Impacchetta i fotogrammi renderizzati da Blender in un atlante per Phaser.
//
// Uso (dalla radice del progetto):
//   node scripts/asset/impacchetta.mjs assets-src/<categoria>/<nome>
//   node scripts/asset/impacchetta.mjs --tutti
//
// Legge   assets-src/<categoria>/<nome>/asset.json  e i PNG in  .../render/
// Scrive  app/frontend/public/assets/blender/<categoria>/<nome>.png (+ .json per atlante e griglia)
//         assets-src/<categoria>/<nome>/anteprima.png  (per la revisione)
//         app/frontend/public/assets/blender/assets.json   (manifesto letto dal gioco)
//
// Richiede "sharp" tra le devDependencies di app/frontend.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const RADICE = process.cwd();
const SORGENTI = path.join(RADICE, 'assets-src');
const PUBBLICI = path.join(RADICE, 'app', 'frontend', 'public', 'assets', 'blender');
const MAX_LATO = 4096;
const NOME_VALIDO = /^[a-z0-9]+(-[a-z0-9]+)*$/;

let sharp;
try {
  sharp = createRequire(path.join(RADICE, 'app', 'frontend', 'package.json'))('sharp');
} catch {
  console.error('Manca "sharp": esegui  npm --prefix app/frontend install -D sharp');
  process.exit(1);
}

function errore(msg) {
  console.error(`[asset] ${msg}`);
  process.exitCode = 1;
}

function leggiSpec(cartella) {
  const file = path.join(cartella, 'asset.json');
  if (!fs.existsSync(file)) throw new Error(`manca ${path.relative(RADICE, file)}`);
  const spec = JSON.parse(fs.readFileSync(file, 'utf8'));
  const categoria = path.basename(path.dirname(cartella));
  const nome = path.basename(cartella);
  for (const [k, v] of [['categoria', categoria], ['nome', nome]]) {
    if (!NOME_VALIDO.test(v)) throw new Error(`${k} "${v}" non valido: solo minuscole, cifre e trattini`);
  }
  if (!['immagine', 'atlante', 'griglia'].includes(spec.tipo)) {
    throw new Error(`${nome}: "tipo" deve essere immagine, atlante o griglia`);
  }
  return { ...spec, categoria, nome, chiave: spec.chiave ?? `${categoria}-${nome}`, cartella };
}

function fotogrammiAttesi(spec) {
  if (spec.tipo === 'immagine') return [`${spec.nome}.png`];
  const nomi = [];
  for (const [anim, a] of Object.entries(spec.animazioni ?? {})) {
    if (!NOME_VALIDO.test(anim)) throw new Error(`${spec.nome}: animazione "${anim}" non valida`);
    for (let i = 1; i <= a.fotogrammi; i++) nomi.push(`${anim}_${String(i).padStart(4, '0')}.png`);
  }
  if (nomi.length === 0) throw new Error(`${spec.nome}: nessuna animazione o fotogramma in "animazioni"`);
  return nomi;
}

async function scacchiera(w, h) {
  const q = 16;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><pattern id="p" width="${q * 2}" height="${q * 2}" patternUnits="userSpaceOnUse">
    <rect width="${q * 2}" height="${q * 2}" fill="#d9d9d9"/><rect width="${q}" height="${q}" fill="#f4f4f4"/>
    <rect x="${q}" y="${q}" width="${q}" height="${q}" fill="#f4f4f4"/></pattern></defs>
    <rect width="100%" height="100%" fill="url(#p)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function impacchetta(cartella) {
  const spec = leggiSpec(cartella);
  const render = path.join(cartella, 'render');
  const attesi = fotogrammiAttesi(spec);
  const mancanti = attesi.filter((f) => !fs.existsSync(path.join(render, f)));
  if (mancanti.length) {
    throw new Error(`${spec.nome}: mancano ${mancanti.length} fotogrammi in render/ (es. ${mancanti[0]})`);
  }
  const destCartella = path.join(PUBBLICI, spec.categoria);
  fs.mkdirSync(destCartella, { recursive: true });
  const destPng = path.join(destCartella, `${spec.nome}.png`);

  // Dimensione dei fotogrammi: tutti uguali (camera fissa in Blender).
  const metas = await Promise.all(attesi.map((f) => sharp(path.join(render, f)).metadata()));
  const [fw, fh] = [metas[0].width, metas[0].height];
  const diversi = metas.findIndex((m) => m.width !== fw || m.height !== fh);
  if (diversi >= 0) throw new Error(`${spec.nome}: ${attesi[diversi]} ha dimensioni diverse dal primo fotogramma`);
  if (spec.dimensioneFotogramma && (spec.dimensioneFotogramma[0] !== fw || spec.dimensioneFotogramma[1] !== fh)) {
    throw new Error(`${spec.nome}: render ${fw}x${fh}, asset.json chiede ${spec.dimensioneFotogramma.join('x')}`);
  }

  let larghezza, altezza, posizioni;
  if (spec.tipo === 'immagine') {
    [larghezza, altezza] = [fw, fh];
    posizioni = [{ x: 0, y: 0 }];
  } else {
    const n = attesi.length;
    const colonne = spec.colonne ?? Math.ceil(Math.sqrt(n));
    const righe = Math.ceil(n / colonne);
    [larghezza, altezza] = [colonne * fw, righe * fh];
    posizioni = attesi.map((_, i) => ({ x: (i % colonne) * fw, y: Math.floor(i / colonne) * fh }));
  }
  if (larghezza > MAX_LATO || altezza > MAX_LATO) {
    throw new Error(`${spec.nome}: atlante ${larghezza}x${altezza} oltre ${MAX_LATO}px; riduci i fotogrammi o dividi l'asset`);
  }

  const strati = attesi.map((f, i) => ({ input: path.join(render, f), left: posizioni[i].x, top: posizioni[i].y }));
  await sharp({ create: { width: larghezza, height: altezza, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(strati)
    .png({ compressionLevel: 9 })
    .toFile(destPng);

  if (spec.tipo !== 'immagine') {
    const frames = {};
    attesi.forEach((f, i) => {
      frames[f.replace(/\.png$/, '')] = {
        frame: { x: posizioni[i].x, y: posizioni[i].y, w: fw, h: fh },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: fw, h: fh },
        sourceSize: { w: fw, h: fh },
      };
    });
    const atlante = {
      frames,
      meta: { app: 'kit redmoon', image: `${spec.nome}.png`, size: { w: larghezza, h: altezza }, scale: '1' },
    };
    fs.writeFileSync(path.join(destCartella, `${spec.nome}.json`), JSON.stringify(atlante, null, 2) + '\n');
  }

  // Anteprima per la pull request: l'asset su scacchiera, ingrandito se piccolo.
  const fattore = Math.max(1, Math.min(4, Math.floor(512 / Math.max(larghezza, altezza))));
  const [aw, ah] = [larghezza * fattore, altezza * fattore];
  const ingrandito = await sharp(destPng)
    .resize(aw, ah, { kernel: spec.pixelArt ? 'nearest' : 'lanczos3' })
    .toBuffer();
  await sharp(await scacchiera(aw, ah)).composite([{ input: ingrandito }]).png().toFile(path.join(cartella, 'anteprima.png'));

  return {
    chiave: spec.chiave,
    tipo: spec.tipo,
    file: `${spec.categoria}/${spec.nome}.png`,
    ...(spec.tipo !== 'immagine' && { atlante: `${spec.categoria}/${spec.nome}.json` }),
    ...(spec.tipo === 'griglia' && { fotogramma: [fw, fh] }),
    ...(spec.pixelArt && { pixelArt: true }),
    ...(spec.tipo !== 'immagine' && {
      animazioni: Object.fromEntries(
        Object.entries(spec.animazioni).map(([anim, a]) => [
          anim,
          { fotogrammi: a.fotogrammi, fps: a.fps ?? 12, ripeti: a.ripeti ?? -1 },
        ]),
      ),
    }),
  };
}

function tutteLeCartelle() {
  if (!fs.existsSync(SORGENTI)) return [];
  const out = [];
  for (const cat of fs.readdirSync(SORGENTI, { withFileTypes: true })) {
    if (!cat.isDirectory()) continue;
    for (const a of fs.readdirSync(path.join(SORGENTI, cat.name), { withFileTypes: true })) {
      const c = path.join(SORGENTI, cat.name, a.name);
      if (a.isDirectory() && fs.existsSync(path.join(c, 'asset.json'))) out.push(c);
    }
  }
  return out.sort();
}

function aggiornaManifesto(voci) {
  const file = path.join(PUBBLICI, 'assets.json');
  const attuale = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { versione: 1, asset: [] };
  const perChiave = new Map(attuale.asset.map((a) => [a.chiave, a]));
  for (const v of voci) perChiave.set(v.chiave, v);
  const asset = [...perChiave.values()].sort((a, b) => a.chiave.localeCompare(b.chiave));
  fs.mkdirSync(PUBBLICI, { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ versione: 1, asset }, null, 2) + '\n');
}

const arg = process.argv[2];
if (!arg) {
  console.error('Uso: node scripts/asset/impacchetta.mjs assets-src/<categoria>/<nome> | --tutti');
  process.exit(2);
}
const cartelle = arg === '--tutti' ? tutteLeCartelle() : [path.resolve(RADICE, arg)];
const voci = [];
for (const c of cartelle) {
  try {
    const v = await impacchetta(c);
    voci.push(v);
    console.log(`[asset] ${v.chiave}: ${v.file}`);
  } catch (e) {
    errore(e.message);
  }
}
if (voci.length) aggiornaManifesto(voci);
