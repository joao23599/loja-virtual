const fs = require('fs/promises');
const path = require('path');
const { Op } = require('sequelize');
const { mediaDir } = require('../config');

const COLORS = ['#2D3E50', '#C92071', '#1B998B', '#F6AA1C', '#5B4B8A', '#E4572E'];

const svg = (title, n, color) => `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="570" viewBox="0 0 700 570">
<rect width="700" height="570" fill="${color}"/>
<text x="350" y="275" font-family="Arial, sans-serif" font-size="34" fill="#fff" text-anchor="middle">${title}</text>
<text x="350" y="325" font-family="Arial, sans-serif" font-size="22" fill="#fff" fill-opacity="0.8" text-anchor="middle">Imagem ${n}</text>
</svg>`;

// As imagens de exemplo ficam em backend/media, que NÃO vai no zip. Se o banco já tem os produtos
// mas a pasta media é nova (ou foi apagada), as imagens quebram. Esta função recria os arquivos que faltam.
async function repairSeedImages() {
  const { ProductImage, Product } = require('../models');
  const images = await ProductImage.findAll({ where: { path: { [Op.like]: '%/seed-%.svg' } } });
  let fixed = 0;

  for (const image of images) {
    const abs = path.resolve(mediaDir, image.path);
    if (!abs.startsWith(mediaDir + path.sep)) continue;
    try {
      await fs.access(abs);
    } catch {
      const product = await Product.findByPk(image.product_id);
      const n = Number((image.path.match(/seed-(\d+)\.svg$/) || [])[1] || 1);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, svg(product ? product.name : 'Produto', n, COLORS[(image.product_id + n) % COLORS.length]));
      fixed += 1;
    }
  }
  return fixed;
}

module.exports = { COLORS, svg, repairSeedImages };
