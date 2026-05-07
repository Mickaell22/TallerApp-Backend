const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const reparacionRoutes = require('./routes/reparaciones');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'TallerApp API funcionando' });
});

app.use('/api/auth', authRoutes);
app.use('/api/reparaciones', reparacionRoutes);

module.exports = app;
