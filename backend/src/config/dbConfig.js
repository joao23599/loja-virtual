const DEFAULTS = {
  mysql: { port: 3306, username: 'root', password: 'root' },
  postgres: { port: 5432, username: 'postgres', password: 'postgres' },
};

const ALIASES = { postgresql: 'postgres', pg: 'postgres' };

// Lê as variáveis DB_* e devolve a configuração pronta para o Sequelize.
function buildDbConfig(env = process.env) {
  const raw = (env.DB_DIALECT || 'mysql').trim().toLowerCase();
  const dialect = ALIASES[raw] || raw;

  if (!DEFAULTS[dialect]) {
    throw new Error(`DB_DIALECT inválido: "${env.DB_DIALECT}". Use "postgres" ou "mysql".`);
  }
  const defaults = DEFAULTS[dialect];

  return {
    dialect,
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || defaults.port),
    database: env.DB_NAME || 'loja',
    username: env.DB_USER || defaults.username,
    // senha vazia é válida (ex.: XAMPP/Laragon), por isso não usamos "||"
    password: env.DB_PASS !== undefined ? env.DB_PASS : defaults.password,
  };
}

module.exports = { buildDbConfig };
