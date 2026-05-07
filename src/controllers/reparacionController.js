const { Reparacion, Cliente, Usuario } = require('../models');

const generarCodigo = () => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `REP-${num}`;
};

const listar = async (req, res) => {
  try {
    const reparaciones = await Reparacion.findAll({
      include: [
        { model: Cliente, as: 'cliente', include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'email'] }] },
        { model: Usuario, as: 'tecnico', attributes: ['id', 'nombre'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.json({ data: reparaciones });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const obtener = async (req, res) => {
  try {
    const reparacion = await Reparacion.findByPk(req.params.id, {
      include: [
        { model: Cliente, as: 'cliente', include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'email'] }] },
        { model: Usuario, as: 'tecnico', attributes: ['id', 'nombre'] },
      ],
    });
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
    // Garantizar unicidad del código
    while (await Reparacion.findOne({ where: { codigo } })) {
      codigo = generarCodigo();
    }

    const reparacion = await Reparacion.create({
      codigo,
      cliente_id,
      dispositivo,
      problema,
      fecha_entrega,
      costo,
      notas,
      tecnico_id,
    });

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

    const reparacion = await Reparacion.findByPk(req.params.id);
    if (!reparacion) return res.status(404).json({ error: 'Reparación no encontrada' });

    await reparacion.update({ estado, notas, costo, fecha_entrega, tecnico_id });
    return res.json({ data: reparacion });
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

module.exports = { listar, obtener, seguimiento, crear, actualizarEstado, historialCliente };
