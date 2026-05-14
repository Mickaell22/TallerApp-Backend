const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Factura = sequelize.define('factura', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  reparacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  impuesto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  estado_pago: {
    type: DataTypes.ENUM('pendiente', 'pagado'),
    allowNull: false,
    defaultValue: 'pendiente',
  },
});

module.exports = Factura;
