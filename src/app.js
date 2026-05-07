const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const reparacionRoutes = require('./routes/reparaciones');
const repuestoRoutes = require('./routes/repuestos');
const facturaRoutes = require('./routes/facturas');

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

module.exports = app;
