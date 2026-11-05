const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { jwtSecret, jwtExpiresIn } = require('../config');
const { badRequest, notFound } = require('../utils/errors');
const V = require('../utils/validators');

const serialize = (u) => ({ id: u.id, firstname: u.firstname, surname: u.surname, email: u.email });

async function findOrFail(rawId) {
  const id = V.parseId(rawId);
  if (id === null) throw notFound('Usuário não encontrado');
  const user = await User.findByPk(id);
  if (!user) throw notFound('Usuário não encontrado');
  return user;
}

async function getById(rawId) {
  return serialize(await findOrFail(rawId));
}

async function create(body = {}) {
  const { firstname, surname, email, password, confirmPassword } = body;
  if (!V.isNonEmptyString(firstname)) throw badRequest('firstname é obrigatório');
  if (!V.isNonEmptyString(surname)) throw badRequest('surname é obrigatório');
  if (!V.isEmail(email)) throw badRequest('email inválido');
  if (!V.isNonEmptyString(password)) throw badRequest('password é obrigatório');
  if (password !== confirmPassword) throw badRequest('As senhas não conferem');

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.findOne({ where: { email: normalizedEmail } })) {
    throw badRequest('Já existe um usuário com este email');
  }

  const user = await User.create({
    firstname: firstname.trim(),
    surname: surname.trim(),
    email: normalizedEmail,
    password: await bcrypt.hash(password, 10),
  });
  return serialize(user);
}

async function update(rawId, body = {}) {
  const user = await findOrFail(rawId);
  const data = {};

  for (const key of ['firstname', 'surname']) {
    if (body[key] !== undefined) {
      if (!V.isNonEmptyString(body[key])) throw badRequest(`${key} inválido`);
      data[key] = body[key].trim();
    }
  }
  if (body.email !== undefined) {
    if (!V.isEmail(body.email)) throw badRequest('email inválido');
    data.email = body.email.trim().toLowerCase();
    const other = await User.findOne({ where: { email: data.email } });
    if (other && other.id !== user.id) throw badRequest('Já existe um usuário com este email');
  }
  if (!Object.keys(data).length) throw badRequest('Nenhum campo para atualizar');

  await user.update(data);
}

async function remove(rawId) {
  const user = await findOrFail(rawId);
  await user.destroy();
}

async function generateToken(body = {}) {
  const { email, password } = body;
  if (!V.isEmail(email) || !V.isNonEmptyString(password)) throw badRequest('email e password são obrigatórios');

  const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) throw badRequest('Email ou senha incorretos');

  const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: jwtExpiresIn });
  return { token };
}

module.exports = { getById, create, update, remove, generateToken };
