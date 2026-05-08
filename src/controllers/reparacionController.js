const { Reparacion, Cliente, Usuario, Repuesto, ReparacionRepuesto } = require('../models');
const { enviarCorreo } = require('../services/emailService');

const generarCodigo = () => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `REP-${num}`;
};

const includeCliente = [
  { model: Cliente, as: 'cliente', include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] }] },
  { model: Usuario, as: 'tecnico', attributes: ['id', 'nombre'] },
];

const includeDetalle = [
  { model: Cliente, as: 'cliente', include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] }] },
  { model: Usuario, as: 'tecnico', attributes: ['id', 'nombre'] },
  { model: Repuesto, as: 'repuestos' },
];

const listar = async (req, res) => {
  try {
    const reparaciones = await Reparacion.findAll({ include: includeCliente, order: [['createdAt', 'DESC']] });
    return res.json({ data: reparaciones });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const obtener = async (req, res) => {
  try {
    const reparacion = await Reparacion.findByPk(req.params.id, { include: includeDetalle });
    if (!reparacion) return res.status(404).json({ error: 'Reparación no encontrada' });
    return res.json({ data: reparacion });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const seguimiento = async (req, res) => {
  try {
    const reparacion = await Reparacion.findOne({
      where: { codigo: req.params.codigo },
      attributes: ['codigo', 'dispositivo', 'problema', 'estado', 'fecha_entrada', 'fecha_entrega'],
    });
    if (!reparacion) return res.status(404).json({ error: 'Código de seguimiento no encontrado' });
    return res.json({ data: reparacion });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const crear = async (req, res) => {
  try {
    const { cliente_id, dispositivo, problema, fecha_entrega, costo, notas, tecnico_id } = req.body;

    if (!cliente_id || !dispositivo || !problema) {
      return res.status(400).json({ error: 'cliente_id, dispositivo y problema son requeridos' });
    }

    let codigo = generarCodigo();
    while (await Reparacion.findOne({ where: { codigo } })) {
      codigo = generarCodigo();
    }

    const reparacion = await Reparacion.create({ codigo, cliente_id, dispositivo, problema, fecha_entrega, costo, notas, tecnico_id });

    // Notificar al cliente
    const reparacionConCliente = await Reparacion.findByPk(reparacion.id, { include: includeCliente });
    const email = reparacionConCliente?.cliente?.usuario?.email;
    const nombre = reparacionConCliente?.cliente?.usuario?.nombre || 'Cliente';
    if (email) {
      enviarCorreo(email, 'recibido', { nombre, codigo, dispositivo, problema });
    }

    return res.status(201).json({ data: reparacion });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const actualizarEstado = async (req, res) => {
  try {
    const { estado, notas, costo, fecha_entrega, tecnico_id } = req.body;
    const estadosValidos = ['recibido', 'en_diagnostico', 'en_reparacion', 'listo', 'entregado'];

    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}` });
    }

    const reparacion = await Reparacion.findByPk(req.params.id, { include: includeDetalle });
    if (!reparacion) return res.status(404).json({ error: 'Reparación no encontrada' });

    await reparacion.update({ estado, notas, costo, fecha_entrega, tecnico_id });

    // Notificar al cliente sobre el cambio de estado
    const email = reparacion?.cliente?.usuario?.email;
    const nombre = reparacion?.cliente?.usuario?.nombre || 'Cliente';
    if (email) {
      enviarCorreo(email, estado, { nombre, codigo: reparacion.codigo, dispositivo: reparacion.dispositivo });
    }

    return res.json({ data: reparacion });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const agregarRepuesto = async (req, res) => {
  try {
    const { repuesto_id, cantidad } = req.body;
    if (!repuesto_id || !cantidad || cantidad < 1) {
      return res.status(400).json({ error: 'repuesto_id y cantidad (>=1) son requeridos' });
    }

    const reparacion = await Reparacion.findByPk(req.params.id);
    if (!reparacion) return res.status(404).json({ error: 'Reparación no encontrada' });

    const repuesto = await Repuesto.findByPk(repuesto_id);
    if (!repuesto) return res.status(404).json({ error: 'Repuesto no encontrado' });

    const existente = await ReparacionRepuesto.findOne({ where: { reparacion_id: req.params.id, repuesto_id } });
    const cantidadAnterior = existente ? existente.cantidad : 0;
    const diferencia = cantidad - cantidadAnterior;

    if (repuesto.stock < diferencia) {
      return res.status(400).json({ error: `Stock insuficiente. Disponible: ${repuesto.stock}` });
    }

    if (existente) {
      await existente.update({ cantidad });
    } else {
      await ReparacionRepuesto.create({ reparacion_id: req.params.id, repuesto_id, cantidad });
    }

    await repuesto.update({ stock: repuesto.stock - diferencia });

    const actualizada = await Reparacion.findByPk(req.params.id, { include: includeDetalle });
    return res.json({ data: actualizada });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const eliminarRepuesto = async (req, res) => {
  try {
    const { id, repuesto_id } = req.params;

    const entrada = await ReparacionRepuesto.findOne({ where: { reparacion_id: id, repuesto_id } });
    if (!entrada) return res.status(404).json({ error: 'Repuesto no asignado a esta reparación' });

    const repuesto = await Repuesto.findByPk(repuesto_id);
    if (repuesto) {
      await repuesto.update({ stock: repuesto.stock + entrada.cantidad });
    }

    await entrada.destroy();

    const actualizada = await Reparacion.findByPk(id, { include: includeDetalle });
    return res.json({ data: actualizada });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const historialCliente = async (req, res) => {
  try {
    const reparaciones = await Reparacion.findAll({
      where: { cliente_id: req.params.cliente_id },
      order: [['createdAt', 'DESC']],
    });
    return res.json({ data: reparaciones });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { listar, obtener, seguimiento, crear, actualizarEstado, historialCliente, agregarRepuesto, eliminarRepuesto };
