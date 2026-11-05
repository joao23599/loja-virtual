const { buildDbConfig } = require('../src/config/dbConfig');

describe('buildDbConfig', () => {
  test('sem DB_DIALECT usa mysql com padrões do MySQL', () => {
    expect(buildDbConfig({})).toMatchObject({ dialect: 'mysql', port: 3306, username: 'root', password: 'root', database: 'loja' });
  });

  test('postgres usa porta 5432 e usuário postgres por padrão', () => {
    expect(buildDbConfig({ DB_DIALECT: 'postgres' })).toMatchObject({ dialect: 'postgres', port: 5432, username: 'postgres', password: 'postgres' });
  });

  test('aceita aliases e ignora maiúsculas', () => {
    expect(buildDbConfig({ DB_DIALECT: 'PostgreSQL' }).dialect).toBe('postgres');
    expect(buildDbConfig({ DB_DIALECT: 'pg' }).dialect).toBe('postgres');
  });

  test('variáveis DB_* sobrescrevem os padrões', () => {
    const cfg = buildDbConfig({ DB_DIALECT: 'postgres', DB_HOST: 'db', DB_PORT: '5433', DB_NAME: 'x', DB_USER: 'u', DB_PASS: 'p' });
    expect(cfg).toMatchObject({ host: 'db', port: 5433, database: 'x', username: 'u', password: 'p' });
  });

  test('senha vazia é respeitada', () => {
    expect(buildDbConfig({ DB_DIALECT: 'mysql', DB_PASS: '' }).password).toBe('');
  });

  test('dialeto desconhecido lança erro claro', () => {
    expect(() => buildDbConfig({ DB_DIALECT: 'oracle' })).toThrow(/DB_DIALECT inválido/);
  });
});
