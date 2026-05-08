const { Usuario } = require('../models');

const listar = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['password', 'reset_token', 'reset_token_expira'] },
      order: [['createdAt', 'ASC']],
    });
    return res.json({ data: usuarios });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { listar };
