#!/usr/bin/env node
/**
 * Gera a Cormorant Garamond do site com os acentos dos minúsculos assentados.
 *
 * No subconjunto latin do `@fontsource/cormorant-garamond` os acentos de é, ê, ó, í…
 * são longos e chegam à altura da caixa alta (yMax 731 sobre x-height ~395): em display
 * (~100 px) o acento "flutua" longe da letra. Este script mexe SÓ nos contornos acima
 * da x-height dos minúsculos acentuados: encurta o acento (escala vertical a partir da
 * base) e o assenta a um vão fixo da letra; grava WOFF em `src/app/fonts/`. Nada mais
 * muda (larguras, métricas verticais, kerning, GSUB/GPOS).
 *
 * Licença: SIL Open Font License 1.1, sem Reserved Font Name declarado; a versão
 * modificada segue sob a mesma licença (`src/app/fonts/OFL.txt`).
 *
 * Uso: node scripts/patch-display-accents.mjs
 */
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { deflateSync, inflateSync } from "node:zlib";

const SOURCE = "node_modules/@fontsource/cormorant-garamond";
const OUT = "src/app/fonts";
const FACES = [
  ["latin-300-normal", "cormorant-garamond-mozy-300.woff"],
  ["latin-400-normal", "cormorant-garamond-mozy-400.woff"],
  ["latin-400-italic", "cormorant-garamond-mozy-400-italic.woff"],
  ["latin-500-normal", "cormorant-garamond-mozy-500.woff"],
];
/** Minúsculos acentuados de Latin-1 (à … ÿ), menos æ ð ÷ ø þ. */
const ACCENTED = [..."àáâãäåçèéêëìíîïñòóôõöùúûüýÿ"].map((char) => char.codePointAt(0));
/** Contorno cujo ponto mais baixo fica acima disto é acento (unidades, UPM 1000). */
const ACCENT_FLOOR = 470;
/** Vão desejado entre o topo da letra e a base do acento. */
const TARGET_GAP = 48;
/** O acento original tem ~260 unidades de altura; encurtado a 70% ele assenta como num Garamond de texto. */
const ACCENT_SCALE = 0.7;

function readWoff(buffer) {
  const count = buffer.readUInt16BE(12);
  const tables = new Map();
  for (let index = 0; index < count; index += 1) {
    const at = 44 + index * 20;
    const tag = buffer.toString("ascii", at, at + 4);
    const offset = buffer.readUInt32BE(at + 4);
    const compLength = buffer.readUInt32BE(at + 8);
    const origLength = buffer.readUInt32BE(at + 12);
    const raw = buffer.subarray(offset, offset + compLength);
    tables.set(tag, Buffer.from(compLength < origLength ? inflateSync(raw) : raw));
  }
  return { flavor: buffer.readUInt32BE(4), tables };
}

function checksum(data) {
  const padded = Buffer.concat([data, Buffer.alloc((4 - (data.length % 4)) % 4)]);
  let sum = 0;
  for (let at = 0; at < padded.length; at += 4) sum = (sum + padded.readUInt32BE(at)) >>> 0;
  return sum;
}

function writeWoff(flavor, tables) {
  const tags = [...tables.keys()].sort();
  const entries = tags.map((tag) => {
    const data = tables.get(tag);
    const packed = deflateSync(data, { level: 9 });
    return { tag, data, stored: packed.length < data.length ? packed : data, sum: checksum(data) };
  });
  let offset = 44 + entries.length * 20;
  const sfntSize = 12 + entries.length * 16 + entries.reduce((total, entry) => total + Math.ceil(entry.data.length / 4) * 4, 0);
  const directory = Buffer.alloc(entries.length * 20);
  const bodies = [];
  entries.forEach((entry, index) => {
    const at = index * 20;
    directory.write(entry.tag, at, "ascii");
    directory.writeUInt32BE(offset, at + 4);
    directory.writeUInt32BE(entry.stored.length, at + 8);
    directory.writeUInt32BE(entry.data.length, at + 12);
    directory.writeUInt32BE(entry.sum, at + 16);
    const pad = (4 - (entry.stored.length % 4)) % 4;
    bodies.push(entry.stored, Buffer.alloc(pad));
    offset += entry.stored.length + pad;
  });
  const header = Buffer.alloc(44);
  header.write("wOFF", 0, "ascii");
  header.writeUInt32BE(flavor, 4);
  header.writeUInt32BE(offset, 8);
  header.writeUInt16BE(entries.length, 12);
  header.writeUInt32BE(sfntSize, 16);
  header.writeUInt16BE(1, 20);
  return Buffer.concat([header, directory, ...bodies]);
}

function glyphIndexMap(cmap) {
  const map = new Map();
  for (let index = 0; index < cmap.readUInt16BE(2); index += 1) {
    const at = cmap.readUInt32BE(4 + index * 8 + 4);
    if (cmap.readUInt16BE(at) !== 4) continue;
    const segments = cmap.readUInt16BE(at + 6) / 2;
    const ends = at + 14;
    const starts = ends + segments * 2 + 2;
    const deltas = starts + segments * 2;
    const ranges = deltas + segments * 2;
    for (let segment = 0; segment < segments; segment += 1) {
      const end = cmap.readUInt16BE(ends + segment * 2);
      const start = cmap.readUInt16BE(starts + segment * 2);
      const delta = cmap.readInt16BE(deltas + segment * 2);
      const rangeOffset = cmap.readUInt16BE(ranges + segment * 2);
      for (let code = start; code <= end && code !== 0xffff; code += 1) {
        let glyph = rangeOffset === 0 ? (code + delta) & 0xffff : cmap.readUInt16BE(ranges + segment * 2 + rangeOffset + (code - start) * 2);
        if (rangeOffset !== 0 && glyph !== 0) glyph = (glyph + delta) & 0xffff;
        map.set(code, glyph);
      }
    }
  }
  return map;
}

function decodeSimple(data) {
  const contours = data.readInt16BE(0);
  const endPoints = [];
  let at = 10;
  for (let index = 0; index < contours; index += 1, at += 2) endPoints.push(data.readUInt16BE(at));
  const instructionLength = data.readUInt16BE(at);
  const instructions = data.subarray(at + 2, at + 2 + instructionLength);
  at += 2 + instructionLength;
  const total = endPoints.at(-1) + 1;
  const flags = [];
  while (flags.length < total) {
    const flag = data[at++];
    flags.push(flag);
    if (flag & 8) {
      const repeat = data[at++];
      for (let count = 0; count < repeat; count += 1) flags.push(flag);
    }
  }
  const readAxis = (shortBit, sameBit) => {
    const values = [];
    let value = 0;
    for (const flag of flags) {
      if (flag & shortBit) {
        const delta = data[at++];
        value += flag & sameBit ? delta : -delta;
      } else if (!(flag & sameBit)) {
        value += data.readInt16BE(at);
        at += 2;
      }
      values.push(value);
    }
    return values;
  };
  const xs = readAxis(2, 16);
  const ys = readAxis(4, 32);
  return { endPoints, instructions, flags: flags.map((flag) => flag & 0x41), xs, ys };
}

function encodeSimple(glyph) {
  const { endPoints, instructions, flags, xs, ys } = glyph;
  const flagBytes = [];
  const xBytes = [];
  const yBytes = [];
  let lastX = 0;
  let lastY = 0;
  flags.forEach((base, index) => {
    let flag = base;
    const dx = xs[index] - lastX;
    const dy = ys[index] - lastY;
    lastX = xs[index];
    lastY = ys[index];
    if (dx === 0) flag |= 16;
    else if (Math.abs(dx) < 256) { flag |= 2 | (dx > 0 ? 16 : 0); xBytes.push(Buffer.from([Math.abs(dx)])); }
    else { const word = Buffer.alloc(2); word.writeInt16BE(dx); xBytes.push(word); }
    if (dy === 0) flag |= 32;
    else if (Math.abs(dy) < 256) { flag |= 4 | (dy > 0 ? 32 : 0); yBytes.push(Buffer.from([Math.abs(dy)])); }
    else { const word = Buffer.alloc(2); word.writeInt16BE(dy); yBytes.push(word); }
    flagBytes.push(flag);
  });
  const head = Buffer.alloc(10 + endPoints.length * 2 + 2);
  head.writeInt16BE(endPoints.length, 0);
  head.writeInt16BE(Math.min(...xs), 2);
  head.writeInt16BE(Math.min(...ys), 4);
  head.writeInt16BE(Math.max(...xs), 6);
  head.writeInt16BE(Math.max(...ys), 8);
  endPoints.forEach((end, index) => head.writeUInt16BE(end, 10 + index * 2));
  head.writeUInt16BE(instructions.length, 10 + endPoints.length * 2);
  return Buffer.concat([head, instructions, Buffer.from(flagBytes), ...xBytes, ...yBytes]);
}

/** Encurta e desce os contornos de acento até TARGET_GAP acima do topo da letra. Devolve o quanto o topo desceu. */
function seatAccents(glyph) {
  const ranges = glyph.endPoints.map((end, index) => [index === 0 ? 0 : glyph.endPoints[index - 1] + 1, end]);
  const lowest = ranges.map(([from, to]) => Math.min(...glyph.ys.slice(from, to + 1)));
  const accents = ranges.filter((_, index) => lowest[index] >= ACCENT_FLOOR);
  const bases = ranges.filter((_, index) => lowest[index] < ACCENT_FLOOR);
  if (accents.length === 0 || bases.length === 0) return 0;
  const baseTop = Math.max(...bases.flatMap(([from, to]) => glyph.ys.slice(from, to + 1)));
  const accentYs = accents.flatMap(([from, to]) => glyph.ys.slice(from, to + 1));
  const accentBottom = Math.min(...accentYs);
  const accentTop = Math.max(...accentYs);
  const seat = Math.min(accentBottom, baseTop + TARGET_GAP);
  for (const [from, to] of accents) {
    for (let point = from; point <= to; point += 1) {
      glyph.ys[point] = Math.round(seat + (glyph.ys[point] - accentBottom) * ACCENT_SCALE);
    }
  }
  return accentTop - Math.max(...accents.flatMap(([from, to]) => glyph.ys.slice(from, to + 1)));
}

function patch(file) {
  const { flavor, tables } = readWoff(readFileSync(file));
  const head = tables.get("head");
  const isLong = head.readInt16BE(50) === 1;
  const glyphCount = tables.get("maxp").readUInt16BE(4);
  const loca = tables.get("loca");
  const offsets = Array.from({ length: glyphCount + 1 }, (_, index) => (isLong ? loca.readUInt32BE(index * 4) : loca.readUInt16BE(index * 2) * 2));
  const glyf = tables.get("glyf");
  const targets = new Set([...glyphIndexMap(tables.get("cmap"))].filter(([code]) => ACCENTED.includes(code)).map(([, glyph]) => glyph));
  const shifts = [];
  const pieces = [];
  const newOffsets = [0];
  for (let index = 0; index < glyphCount; index += 1) {
    let data = glyf.subarray(offsets[index], offsets[index + 1]);
    if (targets.has(index) && data.length > 0 && data.readInt16BE(0) > 0) {
      const glyph = decodeSimple(data);
      const shift = seatAccents(glyph);
      if (shift > 0) {
        data = encodeSimple(glyph);
        shifts.push(shift);
      }
    }
    const padded = Buffer.concat([data, Buffer.alloc((4 - (data.length % 4)) % 4)]);
    pieces.push(padded);
    newOffsets.push(newOffsets.at(-1) + padded.length);
  }
  const newLoca = Buffer.alloc((glyphCount + 1) * 4);
  newOffsets.forEach((value, index) => newLoca.writeUInt32BE(value, index * 4));
  const newHead = Buffer.from(head);
  newHead.writeInt16BE(1, 50);
  newHead.writeUInt32BE(0, 8);
  tables.set("glyf", Buffer.concat(pieces));
  tables.set("loca", newLoca);
  tables.set("head", newHead);
  return { woff: writeWoff(flavor, tables), shifts };
}

for (const [face, output] of FACES) {
  const { woff, shifts } = patch(`${SOURCE}/files/cormorant-garamond-${face}.woff`);
  writeFileSync(`${OUT}/${output}`, woff);
  process.stderr.write(`${output}: ${shifts.length} glifos, deslocamento ${Math.min(...shifts)}–${Math.max(...shifts)} unidades\n`);
}
copyFileSync(`${SOURCE}/LICENSE`, `${OUT}/OFL.txt`);
