const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Reparacion, Factura, Repuesto, Cliente, Usuario } = require('../models');

const reparacionesPorPeriodo = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    if (!desde || !hasta) {
      return res.status(400).json({ error: 'Los parámetros "desde" y "hasta" son requeridos (YYYY-MM-DD)' });
    }

    const reparaciones = await Reparacion.findAll({
      where: {
        fecha_entrada: { [Op.between]: [desde, hasta] },
      },
      include: [
        { model: Cliente, as: 'cliente', include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'email'] }] },
      ],
      order: [['fecha_entrada', 'DESC']],
    });

    const resumen = {
      total: reparaciones.length,
      por_estado: reparaciones.reduce((acc, r) => {
        acc[r.estado] = (acc[r.estado] || 0) + 1;
        return acc;
      }, {}),
    };

    return res.json({ data: { resumen, reparaciones } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const ingresosPorPeriodo = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    if (!desde || !hasta) {
      return res.status(400).json({ error: 'Los parámetros "desde" y "hasta" son requeridos (YYYY-MM-DD)' });
    }

    const facturas = await Factura.findAll({
      where: {
        fecha: { [Op.between]: [desde, hasta] },
      },
      include: [{ model: Reparacion, as: 'reparacion', attributes: ['codigo', 'dispositivo'] }],
      order: [['fecha', 'DESC']],
    });

    const totalIngresos = facturas.reduce((sum, f) => sum + parseFloat(f.total), 0);
    const totalPagado = facturas.filter((f) => f.estado_pago === 'pagado').reduce((sum, f) => sum + parseFloat(f.total), 0);
    const totalPendiente = totalIngresos - totalPagado;

    return res.json({
      data: {
        resumen: {
          total_ingresos: totalIngresos.toFixed(2),
          total_pagado: totalPagado.toFixed(2),
          total_pendiente: totalPendiente.toFixed(2),
          cantidad_facturas: facturas.length,
        },
        facturas,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const inventarioActual = async (req, res) => {
  try {
    const repuestos = await Repuesto.findAll({ order: [['nombre', 'ASC']] });

    const valorTotal = repuestos.reduce((sum, r) => sum + parseFloat(r.precio) * r.stock, 0);
    const bajoStock = repuestos.filter((r) => r.stock <= r.stock_minimo).length;

    return res.json({
      data: {
        resumen: {
          total_productos: repuestos.length,
          productos_bajo_stock: bajoStock,
          valor_total_inventario: valorTotal.toFixed(2),
        },
        repuestos,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { reparacionesPorPeriodo, ingresosPorPeriodo, inventarioActual };
