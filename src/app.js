const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const reparacionRoutes = require('./routes/reparaciones');
const repuestoRoutes = require('./routes/repuestos');
const facturaRoutes = require('./routes/facturas');
const reporteRoutes = require('./routes/reportes');
const clienteRoutes = require('./routes/clientes');
const usuarioRoutes = require('./routes/usuarios');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'TallerApp API funcionando' });
});

app.use('/api/auth', authRoutes);
app.use('/api/reparaciones', reparacionRoutes);
app.use('/api/repuestos', repuestoRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/usuarios', usuarioRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Error interno del servidor' });
});

module.exports = app;
