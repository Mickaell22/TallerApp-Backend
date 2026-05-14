const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reparacion = sequelize.define('reparacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  codigo: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tecnico_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  dispositivo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  problema: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('recibido', 'en_diagnostico', 'en_reparacion', 'listo', 'entregado'),
    allowNull: false,
    defaultValue: 'recibido',
  },
  fecha_entrada: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fecha_entrega: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  costo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  diagnostico: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  costo_estimado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
});

module.exports = Reparacion;
