// Uso: npm run seed            (popula só se o banco estiver vazio)
//      npm run seed -- --reset (APAGA todas as tabelas e recria com dados de exemplo)
const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcrypt');
const sequelize = require('./config/database');
const { mediaDir } = require('./config');
const { COLORS, svg, repairSeedImages } = require('./utils/seedImages');
const { User, Category, Product, ProductImage, ProductOption, ProductCategory } = require('./models');


const sizes = { title: 'Tamanho', shape: 'square', radius: 4, type: 'text', optionValues: '39,40,41,42,43' };
const letters = { title: 'Tamanho', shape: 'square', radius: 4, type: 'text', optionValues: 'P,M,G,GG' };
const colors = { title: 'Cor', shape: 'circle', radius: 0, type: 'color', optionValues: '#6FEEFF,#FF6969,#5E5E5E' };

const products = [
  { name: 'Tênis Nike Revolution 6', slug: 'tenis-nike-revolution-6', price: 219, discount: 149.9, cats: ['Tênis', 'Ofertas'], options: [sizes, colors], description: 'Cabedal em malha respirável e solado em borracha com amortecimento macio para o dia a dia.' },
  { name: 'Tênis Adidas Run Falcon', slug: 'tenis-adidas-run-falcon', price: 349.9, discount: 0, cats: ['Tênis'], options: [sizes, colors], description: 'Tênis de corrida leve, com solado de aderência dupla e palmilha anatômica.' },
  { name: 'Camiseta Básica Algodão', slug: 'camiseta-basica-algodao', price: 59.9, discount: 0, cats: ['Camisetas'], options: [letters, colors], description: 'Camiseta 100% algodão, gola redonda e corte reto.' },
  { name: 'Camiseta Estampada Urban', slug: 'camiseta-estampada-urban', price: 89.9, discount: 69.9, cats: ['Camisetas', 'Ofertas'], options: [letters], description: 'Estampa frontal em silk, malha penteada macia.' },
  { name: 'Tênis Puma Smash', slug: 'tenis-puma-smash', price: 299, discount: 249, cats: ['Tênis', 'Ofertas'], options: [sizes], description: 'Clássico casual com cabedal sintético e sola de borracha.' },
  { name: 'Boné Aba Curva', slug: 'bone-aba-curva', price: 49.9, discount: 0, cats: ['Ofertas'], options: [colors], description: 'Boné de sarja com regulagem traseira.' },
];

async function main() {
  const reset = process.argv.includes('--reset');
  await sequelize.authenticate();
  await sequelize.sync({ force: reset });

  if (!reset && (await Product.count()) > 0) {
    const fixed = await repairSeedImages();
    if (fixed) console.log(`${fixed} imagem(ns) de exemplo recriada(s) em backend/media.`);
    console.log('Banco já tem produtos. Use "npm run seed -- --reset" para recriar tudo.');
    return;
  }

  await User.findOrCreate({
    where: { email: 'admin@mail.com' },
    defaults: { firstname: 'Admin', surname: 'Loja', password: await bcrypt.hash('123@123', 10) },
  });

  const categoryByName = {};
  for (const [name, slug, useInMenu] of [
    ['Tênis', 'tenis', true],
    ['Camisetas', 'camisetas', true],
    ['Ofertas', 'ofertas', true],
    ['Black Friday', 'black-friday', false],
  ]) {
    categoryByName[name] = await Category.create({ name, slug, use_in_menu: useInMenu });
  }

  for (const [index, item] of products.entries()) {
    const product = await Product.create({
      enabled: true,
      name: item.name,
      slug: item.slug,
      stock: 10 + index,
      description: item.description,
      price: item.price,
      price_with_discount: item.discount,
    });

    await ProductCategory.bulkCreate(item.cats.map((c) => ({ product_id: product.id, category_id: categoryByName[c].id })));
    await ProductOption.bulkCreate(item.options.map((o) => ({ ...o, product_id: product.id })));

    for (let n = 1; n <= 3; n += 1) {
      const rel = `product-${product.id}/seed-${n}.svg`;
      await fs.mkdir(path.join(mediaDir, `product-${product.id}`), { recursive: true });
      await fs.writeFile(path.join(mediaDir, rel), svg(item.name, n, COLORS[(index + n) % COLORS.length]));
      await ProductImage.create({ product_id: product.id, enabled: true, path: rel });
    }
  }

  console.log('Seed concluído. Usuário: admin@mail.com / 123@123');
}

main()
  .catch((err) => {
    console.error('Falha no seed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
