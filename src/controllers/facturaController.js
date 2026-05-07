const { Factura, Reparacion, Cliente, Usuario, Repuesto } = require('../models');
const { generarFacturaPDF } = require('../services/pdfService');

const includeCompleto = [
  {
    model: Reparacion,
    as: 'reparacion',
    include: [
      {
        model: Cliente,
        as: 'cliente',
        include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'email'] }],
      },
      { model: Repuesto, as: 'repuestos', through: { attributes: ['cantidad'] } },
    ],
  },
];

const listar = async (req, res) => {
  try {
    const facturas = await Factura.findAll({ include: includeCompleto, order: [['createdAt', 'DESC']] });
    return res.json({ data: facturas });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const obtener = async (req, res) => {
  try {
    const factura = await Factura.findByPk(req.params.id, { include: includeCompleto });
    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
    return res.json({ data: factura });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const crear = async (req, res) => {
  try {
    const { reparacion_id, estado_pago } = req.body;

    if (!reparacion_id) {
      return res.status(400).json({ error: 'reparacion_id es requerido' });
    }

    const reparacion = await Reparacion.findByPk(reparacion_id, {
      include: [{ model: Repuesto, as: 'repuestos', through: { attributes: ['cantidad'] } }],
    });
    if (!reparacion) return res.status(404).json({ error: 'Reparación no encontrada' });

    const yaFacturada = await Factura.findOne({ where: { reparacion_id } });
    if (yaFacturada) return res.status(400).json({ error: 'Esta reparación ya tiene una factura generada' });

    // Calcular total: costo de mano de obra + repuestos
    let total = parseFloat(reparacion.costo || 0);
    reparacion.repuestos.forEach((r) => {
      total += parseFloat(r.precio) * (r.reparacion_repuesto?.cantidad || 1);
    });

    const factura = await Factura.create({ reparacion_id, total: total.toFixed(2), estado_pago });
    return res.status(201).json({ data: factura });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const descargarPDF = async (req, res) => {
  try {
    const factura = await Factura.findByPk(req.params.id, { include: includeCompleto });
    if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });

    generarFacturaPDF(factura, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { listar, obtener, crear, descargarPDF };
