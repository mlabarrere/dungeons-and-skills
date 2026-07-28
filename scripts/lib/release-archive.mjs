import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";

export function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(epochSeconds) {
  const date = new Date(Math.max(epochSeconds * 1000, Date.UTC(1980, 0, 1)));
  const year = Math.max(1980, date.getUTCFullYear());
  const dosDate = ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate();
  const dosTime = (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | (date.getUTCSeconds() >> 1);
  return { dosDate, dosTime };
}

export function createZip(entries, epochSeconds) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  const { dosDate, dosTime } = dosDateTime(epochSeconds);

  for (const entry of entries) {
    const name = Buffer.from(entry.path.replaceAll("\\", "/"), "utf8");
    const data = entry.data;
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(entry.executable ? 0x81ed0000 : 0x81a40000, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);
    offset += local.length + name.length + data.length;
  }

  const centralData = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralData.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralData, end]);
}

function writeTarString(block, value, offset, length) {
  Buffer.from(value, "utf8").copy(block, offset, 0, length);
}

function writeTarOctal(block, value, offset, length) {
  const text = Math.max(0, value).toString(8).padStart(length - 1, "0") + "\0";
  writeTarString(block, text, offset, length);
}

function tarHeader(path, size, epochSeconds, executable) {
  const block = Buffer.alloc(512);
  if (Buffer.byteLength(path) > 100) {
    const split = path.lastIndexOf("/", 155);
    if (split < 1 || Buffer.byteLength(path.slice(split + 1)) > 100) {
      throw new Error(`Path is too long for deterministic ustar archive: ${path}`);
    }
    writeTarString(block, path.slice(split + 1), 0, 100);
    writeTarString(block, path.slice(0, split), 345, 155);
  } else {
    writeTarString(block, path, 0, 100);
  }
  writeTarOctal(block, executable ? 0o755 : 0o644, 100, 8);
  writeTarOctal(block, 0, 108, 8);
  writeTarOctal(block, 0, 116, 8);
  writeTarOctal(block, size, 124, 12);
  writeTarOctal(block, epochSeconds, 136, 12);
  block.fill(0x20, 148, 156);
  block[156] = 0x30;
  writeTarString(block, "ustar\0", 257, 6);
  writeTarString(block, "00", 263, 2);
  writeTarString(block, "dungeons-and-skills", 265, 32);
  writeTarString(block, "dungeons-and-skills", 297, 32);
  writeTarOctal(block, [...block].reduce((sum, byte) => sum + byte, 0), 148, 8);
  return block;
}

export function createTarGz(entries, epochSeconds) {
  const chunks = [];
  for (const entry of entries) {
    chunks.push(tarHeader(entry.path.replaceAll("\\", "/"), entry.data.length, epochSeconds, entry.executable));
    chunks.push(entry.data);
    const padding = (512 - (entry.data.length % 512)) % 512;
    if (padding) chunks.push(Buffer.alloc(padding));
  }
  chunks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(chunks), { level: 9, mtime: 0 });
}
