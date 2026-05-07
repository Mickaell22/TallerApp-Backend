const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReparacionRepuesto = sequelize.define('reparacion_repuesto', {
  reparacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  repuesto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  timestamps: false,
});

module.exports = ReparacionRepuesto;
