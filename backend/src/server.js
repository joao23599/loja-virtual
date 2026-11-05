const app = require('./app');
const sequelize = require('./config/database');
const { port, publicUrl } = require('./config');
require('./models');
const { repairSeedImages } = require('./utils/seedImages');

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // cria as tabelas que ainda não existem
    const fixed = await repairSeedImages().catch(() => 0);
    if (fixed) console.log(`${fixed} imagem(ns) de exemplo recriada(s) em media/`);
    app.listen(port, () => console.log(`API no ar em ${publicUrl}/v1`));
  } catch (err) {
    console.error('Não foi possível conectar ao banco. Ele está rodando e o banco "loja" existe? Confira o .env (DB_DIALECT, DB_PORT, DB_USER, DB_PASS).\n', err.message);
    process.exit(1);
  }
}

start();
