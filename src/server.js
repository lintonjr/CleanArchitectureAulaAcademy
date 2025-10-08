const { sequelize } = require('./infrastructure/db/sequelize');
const app = require('./app');
const PORT = process.env.PORT || 3000;


(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  } catch (e) {
    console.error('DB connection failed', e);
    process.exit(1);
  }
})();