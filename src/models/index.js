const Usuario = require('./Usuario');
const Cliente = require('./Cliente');

// Un usuario puede tener un perfil de cliente
Usuario.hasOne(Cliente, { foreignKey: 'usuario_id', as: 'perfil' });
Cliente.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

module.exports = { Usuario, Cliente };
