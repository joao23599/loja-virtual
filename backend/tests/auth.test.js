const request = require('supertest');
const app = require('../src/app');

// Estas rotas devem rejeitar a chamada antes de tocar no banco
const protectedRoutes = [
  ['post', '/v1/category'],
  ['put', '/v1/category/1'],
  ['delete', '/v1/category/1'],
  ['post', '/v1/product'],
  ['put', '/v1/product/1'],
  ['delete', '/v1/product/1'],
  ['post', '/v1/order'],
  ['get', '/v1/order/1'],
  ['put', '/v1/user/1'],
  ['delete', '/v1/user/1'],
];

describe('rotas protegidas por JWT', () => {
  test.each(protectedRoutes)('%s %s sem token retorna 401', async (method, url) => {
    const res = await request(app)[method](url).send({});
    expect(res.status).toBe(401);
  });

  test('token inválido retorna 401', async () => {
    const res = await request(app).delete('/v1/product/1').set('Authorization', 'Bearer token-invalido');
    expect(res.status).toBe(401);
  });

  test('esquema diferente de Bearer retorna 401', async () => {
    const res = await request(app).post('/v1/category').set('Authorization', 'Basic abc').send({});
    expect(res.status).toBe(401);
  });
});

describe('infra', () => {
  test('GET /health responde 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  test('rota inexistente retorna 404', async () => {
    const res = await request(app).get('/v1/nada');
    expect(res.status).toBe(404);
  });

  test('JSON inválido retorna 400', async () => {
    const res = await request(app)
      .post('/v1/user/token')
      .set('Content-Type', 'application/json')
      .send('{ quebrado');
    expect(res.status).toBe(400);
  });
});
