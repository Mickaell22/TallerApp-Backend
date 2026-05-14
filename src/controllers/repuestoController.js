const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Repuesto, ReparacionRepuesto, Usuario } = require('../models');
const { enviarCorreo } = require('../services/emailService');

const listar = async (req, res) => {
  try {
    const repuestos = await Repuesto.findAll({ order: [['nombre', 'ASC']] });
    return res.json({ data: repuestos });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const obtener = async (req, res) => {
  try {
    const repuesto = await Repuesto.findByPk(req.params.id);
    if (!repuesto) return res.status(404).json({ error: 'Repuesto no encontrado' });
    return res.json({ data: repuesto });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const crear = async (req, res) => {
  try {
    const { nombre, descripcion, stock, stock_minimo, precio, sku, categoria, ubicacion } = req.body;

    if (!nombre || precio === undefined) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }

    const repuesto = await Repuesto.create({ nombre, descripcion, stock, stock_minimo, precio, sku, categoria, ubicacion });
    return res.status(201).json({ data: repuesto });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const actualizar = async (req, res) => {
  try {
    const repuesto = await Repuesto.findByPk(req.params.id);
    if (!repuesto) return res.status(404).json({ error: 'Repuesto no encontrado' });

    await repuesto.update(req.body);

    // RF-20: Notificar al admin si el stock cae al mínimo tras la actualización
    if (req.body.stock !== undefined && repuesto.stock <= repuesto.stock_minimo) {
      const admins = await Usuario.findAll({ where: { rol: 'administrador' } });
      for (const admin of admins) {
        enviarCorreo(admin.email, 'stock_bajo', {
          nombre: repuesto.nombre,
          stock: repuesto.stock,
          stock_minimo: repuesto.stock_minimo,
        });
      }
    }

    return res.json({ data: repuesto });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const eliminar = async (req, res) => {
  try {
    const repuesto = await Repuesto.findByPk(req.params.id);
    if (!repuesto) return res.status(404).json({ error: 'Repuesto no encontrado' });

    const enUso = await ReparacionRepuesto.findOne({ where: { repuesto_id: req.params.id } });
    if (enUso) {
      return res.status(400).json({ error: 'No se puede eliminar un repuesto que ya fue usado en una reparación' });
    }

    await repuesto.destroy();
    return res.json({ data: { message: 'Repuesto eliminado correctamente' } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const alertasStockMinimo = async (req, res) => {
  try {
    const repuestos = await Repuesto.findAll({
      where: sequelize.where(sequelize.col('stock'), { [Op.lte]: sequelize.col('stock_minimo') }),
    });
    return res.json({ data: repuestos });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar, alertasStockMinimo };
