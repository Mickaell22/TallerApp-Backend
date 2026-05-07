require('dotenv').config();
const sequelize = require('./src/config/database');
const app = require('./src/app');

require('./src/models');

const PORT = process.env.PORT || 3000;

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('Conexión a PostgreSQL exitosa — tablas sincronizadas');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error al conectar con la base de datos:', err.message);
  });
