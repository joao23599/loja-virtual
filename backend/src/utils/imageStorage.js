const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { mediaDir, publicUrl } = require('../config');
const { badRequest } = require('./errors');

const EXT = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

function sniff(buf) {
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === 'GIF8') return 'gif';
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

// Valida e decodifica { type?, content } (base64 ou data URL). Não grava nada.
function decodeImage({ type, content }) {
  if (typeof content !== 'string' || !content.trim()) throw badRequest('Imagem sem conteúdo');

  let raw = content.trim();
  const dataUrl = raw.match(/^data:(image\/[a-z+.-]+);base64,/i);
  if (dataUrl) {
    type = type || dataUrl[1].toLowerCase();
    raw = raw.slice(dataUrl[0].length);
  }
  raw = raw.replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) throw badRequest('Imagem não está em base64 válido');

  const buffer = Buffer.from(raw, 'base64');
  let ext;
  if (type !== undefined) {
    ext = EXT[String(type).toLowerCase()];
    if (!ext) throw badRequest('Tipo de imagem não suportado');
  } else {
    ext = sniff(buffer);
    if (!ext) throw badRequest('Não foi possível identificar o tipo da imagem');
  }
  return { ext, buffer };
}

// Grava no disco e devolve o caminho relativo (o que vai para a coluna "path")
async function saveImage(productId, { ext, buffer }) {
  const rel = `product-${productId}/${crypto.randomUUID()}.${ext}`;
  const abs = path.join(mediaDir, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buffer);
  return rel;
}

async function removeImage(rel) {
  const abs = path.resolve(mediaDir, rel);
  if (!abs.startsWith(mediaDir + path.sep)) return; // nunca apagar fora da pasta de mídia
  try {
    await fs.unlink(abs);
  } catch {
    /* arquivo já não existe */
  }
}

const imageUrl = (rel) => `${publicUrl}/media/${rel}`;

module.exports = { decodeImage, saveImage, removeImage, imageUrl };
