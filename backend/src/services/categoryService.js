const { Category, ProductCategory } = require('../models');
const sequelize = require('../config/database');
const { badRequest, notFound } = require('../utils/errors');
const V = require('../utils/validators');
const { parsePagination, parseFields, pick } = require('../utils/pagination');

const FIELDS = ['id', 'name', 'slug', 'use_in_menu'];

const serialize = (c) => ({ id: c.id, name: c.name, slug: c.slug, use_in_menu: Boolean(c.use_in_menu) });

async function findOrFail(rawId) {
  const id = V.parseId(rawId);
  if (id === null) throw notFound('Categoria não encontrada');
  const category = await Category.findByPk(id);
  if (!category) throw notFound('Categoria não encontrada');
  return category;
}

async function search(query) {
  const { limit, page, sqlLimit, offset } = parsePagination(query);
  const fields = parseFields(query.fields, FIELDS);

  const where = {};
  if (query.use_in_menu !== undefined) {
    if (query.use_in_menu !== 'true' && query.use_in_menu !== 'false') {
      throw badRequest('use_in_menu deve ser true ou false');
    }
    where.use_in_menu = query.use_in_menu === 'true';
  }

  const { count, rows } = await Category.findAndCountAll({
    where,
    order: [['id', 'ASC']],
    limit: sqlLimit,
    offset,
  });

  return { data: rows.map((r) => pick(serialize(r), fields)), total: count, limit, page };
}

async function getById(rawId) {
  return serialize(await findOrFail(rawId));
}

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
  if (body.use_in_menu !== undefined) {
    if (typeof body.use_in_menu !== 'boolean') throw badRequest('use_in_menu deve ser booleano');
    data.use_in_menu = body.use_in_menu;
  }
  return data;
}

async function create(body) {
  return serialize(await Category.create(parseBody(body, { create: true })));
}

async function update(rawId, body) {
  const category = await findOrFail(rawId);
  const data = parseBody(body, { create: false });
  if (!Object.keys(data).length) throw badRequest('Nenhum campo para atualizar');
  await category.update(data);
}

async function remove(rawId) {
  const category = await findOrFail(rawId);
  await sequelize.transaction(async (transaction) => {
    await ProductCategory.destroy({ where: { category_id: category.id }, transaction });
    await category.destroy({ transaction });
  });
}

module.exports = { search, getById, create, update, remove };
