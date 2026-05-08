const { Cliente, Usuario, Reparacion } = require('../models');

const listar = async (req, res) => {
  try {
    const clientes = await Cliente.findAll({
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email', 'createdAt'] }],
      order: [['createdAt', 'DESC']],
    });
    const result = await Promise.all(
      clientes.map(async (c) => {
        const count = await Reparacion.count({ where: { cliente_id: c.id } });
        const ultima = await Reparacion.findOne({
          where: { cliente_id: c.id },
          order: [['createdAt', 'DESC']],
          attributes: ['createdAt'],
        });
        return { ...c.toJSON(), total_reparaciones: count, ultima_visita: ultima ? ultima.createdAt : null };
      })
    );
    return res.json({ data: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const obtener = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email', 'createdAt'] },
        { model: Reparacion, as: 'reparaciones', order: [['createdAt', 'DESC']] },
      ],
    });
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    return res.json({ data: cliente });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { listar, obtener };
