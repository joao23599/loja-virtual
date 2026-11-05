const { Op, literal, fn, col } = require('sequelize');
const sequelize = require('../config/database');
const { Product, ProductImage, ProductOption, ProductCategory, Category } = require('../models');
const { badRequest, notFound } = require('../utils/errors');
const V = require('../utils/validators');
const { parsePagination, parseFields, pick } = require('../utils/pagination');
const { buildOptionFacets } = require('../utils/facets');
const { decodeImage, saveImage, removeImage, imageUrl } = require('../utils/imageStorage');

const FIELDS = [
  'id', 'enabled', 'name', 'slug', 'use_in_menu', 'stock', 'description',
  'price', 'price_with_discount', 'category_ids', 'images', 'options',
];
const SHAPES = ['square', 'circle'];
const TYPES = ['text', 'color'];

// Diferenças entre os bancos:
// - LIKE é case-insensitive no MySQL; no PostgreSQL usamos ILIKE para ter o mesmo comportamento
// - "values" é palavra reservada: o nome da coluna precisa ser escapado do jeito de cada banco
const likeOp = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
const quote = (name) => sequelize.getQueryInterface().quoteIdentifier(name);

const include = [
  { model: ProductImage, as: 'images', separate: true, order: [['id', 'ASC']] },
  { model: ProductOption, as: 'options', separate: true, order: [['id', 'ASC']] },
  { model: ProductCategory, as: 'categoryLinks', separate: true },
];

function serialize(p) {
  return {
    id: p.id,
    enabled: Boolean(p.enabled),
    name: p.name,
    slug: p.slug,
    use_in_menu: Boolean(p.use_in_menu),
    stock: p.stock,
    description: p.description,
    price: p.price,
    price_with_discount: p.price_with_discount,
    category_ids: (p.categoryLinks || []).map((l) => l.category_id).sort((a, b) => a - b),
    images: (p.images || []).map((i) => ({ id: i.id, content: imageUrl(i.path) })),
    options: (p.options || []).map((o) => ({
      id: o.id,
      title: o.title,
      shape: o.shape,
      radius: o.radius,
      type: o.type,
      values: o.optionValues.split(','),
    })),
  };
}

const parseProductId = (rawId) => {
  const id = V.parseId(rawId);
  if (id === null) throw notFound('Produto não encontrado');
  return id;
};

async function getById(rawId) {
  const id = parseProductId(rawId);
  const product = await Product.findByPk(id, { include });
  if (!product) throw notFound('Produto não encontrado');
  return serialize(product);
}

// ---------- busca ----------
// Condição SQL: a coluna "values" (ex.: "39,40,41") contém algum dos valores informados.
// Compara ",valores," com ",valor," para funcionar igual em MySQL e PostgreSQL.
function valuesCondition(values) {
  const column = quote('values');
  return values
    .map((v) => {
      const pattern = `%,${v.toLowerCase().replace(/[\\%_]/g, '\\$&')},%`;
      return `LOWER(CONCAT(',', ${column}, ',')) LIKE ${sequelize.escape(pattern)}`;
    })
    .join(' OR ');
}

function buildFilters(q) {
  const and = [];

  if (q.match !== undefined) {
    if (typeof q.match !== 'string' || !q.match.trim()) throw badRequest('match inválido');
    const term = `%${q.match.trim().replace(/[\\%_]/g, '\\$&')}%`;
    and.push({ [Op.or]: [{ name: { [likeOp]: term } }, { description: { [likeOp]: term } }] });
  }

  if (q.category_ids !== undefined) {
    if (typeof q.category_ids !== 'string' || !/^\d+(,\d+)*$/.test(q.category_ids)) {
      throw badRequest('category_ids inválido');
    }
    and.push({
      id: { [Op.in]: literal(`(SELECT product_id FROM product_categories WHERE category_id IN (${q.category_ids}))`) },
    });
  }

  const range = q['price-range'];
  if (range !== undefined) {
    const m = typeof range === 'string' && range.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
    if (!m || Number(m[1]) > Number(m[2])) throw badRequest('price-range inválido (use min-max)');
    and.push({ price: { [Op.between]: [Number(m[1]), Number(m[2])] } });
  }

  // option[45]=GG,PP  => produtos cuja opção 45 tenha GG ou PP
  if (q.option !== undefined) {
    if (typeof q.option !== 'object' || Array.isArray(q.option)) throw badRequest('option inválido');
    for (const [optId, raw] of Object.entries(q.option)) {
      const values = typeof raw === 'string' ? V.parseOptionValues(raw) : null;
      if (!/^\d+$/.test(optId) || !values) throw badRequest('option inválido');
      const cond = valuesCondition(values);
      and.push({
        id: { [Op.in]: literal(`(SELECT product_id FROM product_options WHERE id = ${optId} AND (${cond}))`) },
      });
    }
  }
  // option_values[Tamanho]=39,40 => produtos que têm uma opção chamada "Tamanho" com 39 ou 40.
  // Filtra pelo TÍTULO da opção, então funciona entre produtos diferentes (usado pelo filtro lateral).
  if (q.option_values !== undefined) {
    if (typeof q.option_values !== 'object' || Array.isArray(q.option_values)) throw badRequest('option_values inválido');
    for (const [title, raw] of Object.entries(q.option_values)) {
      const values = typeof raw === 'string' ? V.parseOptionValues(raw) : null;
      if (!title.trim() || !values) throw badRequest('option_values inválido');
      and.push({
        id: {
          [Op.in]: literal(
            `(SELECT product_id FROM product_options WHERE LOWER(title) = ${sequelize.escape(title.trim().toLowerCase())} AND (${valuesCondition(values)}))`
          ),
        },
      });
    }
  }
  return and;
}

async function search(query) {
  const { limit, page, sqlLimit, offset } = parsePagination(query);
  const fields = parseFields(query.fields, FIELDS);
  const and = buildFilters(query);
  const where = and.length ? { [Op.and]: and } : {};

  const [total, rows] = await Promise.all([
    Product.count({ where }),
    Product.findAll({ where, include, order: [['id', 'ASC']], limit: sqlLimit, offset }),
  ]);

  return { data: rows.map((r) => pick(serialize(r), fields)), total, limit, page };
}

// ---------- filtros disponíveis (para a barra lateral do site) ----------
async function getFilters() {
  const [categories, links, optionRows, min, max] = await Promise.all([
    Category.findAll({ order: [['id', 'ASC']] }),
    ProductCategory.findAll({
      attributes: ['category_id', [fn('COUNT', col('product_id')), 'count']],
      group: ['category_id'],
      raw: true,
    }),
    ProductOption.findAll({ attributes: ['product_id', 'title', 'shape', 'radius', 'type', 'optionValues'] }),
    Product.min('price'),
    Product.max('price'),
  ]);

  const countByCategory = new Map(links.map((l) => [l.category_id, Number(l.count)]));

  return {
    categories: categories
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: countByCategory.get(c.id) || 0 }))
      .filter((c) => c.count > 0),
    options: buildOptionFacets(optionRows),
    price: { min: min ?? 0, max: max ?? 0 },
  };
}

// ---------- validação de payloads ----------
function parseBody(body, { create }) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw badRequest('Corpo inválido');
  const data = {};

  for (const key of ['name', 'slug']) {
    if (body[key] === undefined) {
      if (create) throw badRequest(`${key} é obrigatório`);
    } else {
      if (!V.isNonEmptyString(body[key])) throw badRequest(`${key} inválido`);
      data[key] = body[key].trim();
    }
  }
  for (const key of ['enabled', 'use_in_menu']) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== 'boolean') throw badRequest(`${key} deve ser booleano`);
      data[key] = body[key];
    }
  }
  if (body.stock !== undefined) {
    if (!Number.isInteger(body.stock) || body.stock < 0) throw badRequest('stock inválido');
    data.stock = body.stock;
  }
  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== 'string') throw badRequest('description inválido');
    data.description = body.description;
  }
  if (body.price === undefined) {
    if (create) throw badRequest('price é obrigatório');
  } else {
    if (!V.isNumber(body.price) || body.price < 0) throw badRequest('price inválido');
    data.price = body.price;
  }
  if (body.price_with_discount === undefined) {
    if (create) data.price_with_discount = 0; // 0 = sem desconto
  } else {
    if (!V.isNumber(body.price_with_discount) || body.price_with_discount < 0) {
      throw badRequest('price_with_discount inválido');
    }
    data.price_with_discount = body.price_with_discount;
  }
  if (body.category_ids !== undefined) {
    if (!Array.isArray(body.category_ids) || !body.category_ids.every(Number.isInteger)) {
      throw badRequest('category_ids inválido');
    }
    data.category_ids = [...new Set(body.category_ids)];
  } else if (create) {
    data.category_ids = [];
  }
  return data;
}

function assertDiscount(price, discount) {
  if (discount > 0 && discount > price) throw badRequest('price_with_discount não pode ser maior que price');
}

async function assertCategoriesExist(ids) {
  if (!ids || !ids.length) return;
  const count = await Category.count({ where: { id: ids } });
  if (count !== ids.length) throw badRequest('category_ids contém categoria inexistente');
}

const asList = (value, name) => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw badRequest(`${name} deve ser uma lista`);
  return value;
};
const asObject = (item, name) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) throw badRequest(`item de ${name} inválido`);
  return item;
};

const parseNewImages = (list) => asList(list, 'images').map((item) => decodeImage(asObject(item, 'images')));

// Itens: { id, deleted:true } | { id, content: base64 } | { id, content: URL } (mantém) | { type?, content } (nova)
function parseImageOps(list) {
  return asList(list, 'images').map((raw) => {
    const item = asObject(raw, 'images');
    if (item.id === undefined) return { op: 'create', decoded: decodeImage(item) };
    if (!Number.isInteger(item.id)) throw badRequest('id de imagem inválido');
    if (item.deleted === true) return { op: 'delete', id: item.id };
    if (typeof item.content === 'string' && /^https?:\/\//i.test(item.content)) return { op: 'keep', id: item.id };
    return { op: 'replace', id: item.id, decoded: decodeImage(item) };
  });
}

function parseOptionFields(item, { create }) {
  const out = {};
  if (item.title !== undefined || create) {
    if (!V.isNonEmptyString(item.title)) throw badRequest('title da opção inválido');
    out.title = item.title.trim();
  }
  if (item.shape !== undefined) {
    if (!SHAPES.includes(item.shape)) throw badRequest('shape deve ser square ou circle');
    out.shape = item.shape;
  }
  if (item.type !== undefined) {
    if (!TYPES.includes(item.type)) throw badRequest('type deve ser text ou color');
    out.type = item.type;
  }
  if (item.radius !== undefined) {
    const radius = V.parseRadius(item.radius);
    if (radius === null) throw badRequest('radius inválido');
    out.radius = radius;
  }
  const rawValues = item.values !== undefined ? item.values : item.value; // o documento usa os dois nomes
  if (rawValues !== undefined || create) {
    const values = V.parseOptionValues(rawValues);
    if (!values) throw badRequest('values da opção inválido');
    out.optionValues = values.join(',');
  }
  return out;
}

const parseNewOptions = (list) =>
  asList(list, 'options').map((item) => parseOptionFields(asObject(item, 'options'), { create: true }));

// Itens: { id, deleted:true } | { id, ...campos } (atualiza) | { title, values, ... } (nova)
function parseOptionOps(list) {
  return asList(list, 'options').map((raw) => {
    const item = asObject(raw, 'options');
    if (item.id === undefined) return { op: 'create', fields: parseOptionFields(item, { create: true }) };
    if (!Number.isInteger(item.id)) throw badRequest('id de opção inválido');
    if (item.deleted === true) return { op: 'delete', id: item.id };
    return { op: 'update', id: item.id, fields: parseOptionFields(item, { create: false }) };
  });
}

// ---------- escrita ----------
async function create(body) {
  const data = parseBody(body, { create: true });
  assertDiscount(data.price, data.price_with_discount);
  const images = parseNewImages(body.images);
  const options = parseNewOptions(body.options);
  await assertCategoriesExist(data.category_ids);

  const written = [];
  let id;
  try {
    id = await sequelize.transaction(async (transaction) => {
      const { category_ids: categoryIds, ...fields } = data;
      const product = await Product.create(fields, { transaction });

      if (categoryIds.length) {
        await ProductCategory.bulkCreate(
          categoryIds.map((category_id) => ({ product_id: product.id, category_id })),
          { transaction }
        );
      }
      for (const decoded of images) {
        const path = await saveImage(product.id, decoded);
        written.push(path);
        await ProductImage.create({ product_id: product.id, enabled: true, path }, { transaction });
      }
      for (const option of options) {
        await ProductOption.create({ ...option, product_id: product.id }, { transaction });
      }
      return product.id;
    });
  } catch (err) {
    await Promise.all(written.map(removeImage));
    throw err;
  }
  return getById(id);
}

async function update(rawId, body) {
  const id = parseProductId(rawId);
  const product = await Product.findByPk(id);
  if (!product) throw notFound('Produto não encontrado');

  const data = parseBody(body, { create: false });
  const imageOps = parseImageOps(body.images);
  const optionOps = parseOptionOps(body.options);
  assertDiscount(data.price ?? product.price, data.price_with_discount ?? product.price_with_discount);
  await assertCategoriesExist(data.category_ids);

  const [images, options] = await Promise.all([
    ProductImage.findAll({ where: { product_id: id } }),
    ProductOption.findAll({ where: { product_id: id } }),
  ]);
  const imageById = new Map(images.map((i) => [i.id, i]));
  const optionById = new Map(options.map((o) => [o.id, o]));

  imageOps.forEach((op) => {
    if (op.id !== undefined && !imageById.has(op.id)) throw badRequest(`Imagem ${op.id} não pertence ao produto`);
  });
  optionOps.forEach((op) => {
    if (op.id !== undefined && !optionById.has(op.id)) throw badRequest(`Opção ${op.id} não pertence ao produto`);
  });

  const written = [];
  const obsolete = [];
  try {
    await sequelize.transaction(async (transaction) => {
      const { category_ids: categoryIds, ...fields } = data;
      if (Object.keys(fields).length) await product.update(fields, { transaction });

      if (categoryIds) {
        await ProductCategory.destroy({ where: { product_id: id }, transaction });
        if (categoryIds.length) {
          await ProductCategory.bulkCreate(
            categoryIds.map((category_id) => ({ product_id: id, category_id })),
            { transaction }
          );
        }
      }

      for (const op of imageOps) {
        if (op.op === 'delete') {
          const image = imageById.get(op.id);
          obsolete.push(image.path);
          await image.destroy({ transaction });
        } else if (op.op === 'replace') {
          const image = imageById.get(op.id);
          const path = await saveImage(id, op.decoded);
          written.push(path);
          obsolete.push(image.path);
          await image.update({ path }, { transaction });
        } else if (op.op === 'create') {
          const path = await saveImage(id, op.decoded);
          written.push(path);
          await ProductImage.create({ product_id: id, enabled: true, path }, { transaction });
        }
      }

      for (const op of optionOps) {
        if (op.op === 'delete') await optionById.get(op.id).destroy({ transaction });
        else if (op.op === 'update') await optionById.get(op.id).update(op.fields, { transaction });
        else await ProductOption.create({ ...op.fields, product_id: id }, { transaction });
      }
    });
  } catch (err) {
    await Promise.all(written.map(removeImage));
    throw err;
  }
  await Promise.all(obsolete.map(removeImage));
}

async function remove(rawId) {
  const id = parseProductId(rawId);
  const product = await Product.findByPk(id, { include: [{ model: ProductImage, as: 'images' }] });
  if (!product) throw notFound('Produto não encontrado');

  const paths = product.images.map((i) => i.path);
  await sequelize.transaction(async (transaction) => {
    await ProductImage.destroy({ where: { product_id: id }, transaction });
    await ProductOption.destroy({ where: { product_id: id }, transaction });
    await ProductCategory.destroy({ where: { product_id: id }, transaction });
    await product.destroy({ transaction });
  });
  await Promise.all(paths.map(removeImage));
}

module.exports = { search, getFilters, getById, create, update, remove };
