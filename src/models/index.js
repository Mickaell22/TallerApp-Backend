const Usuario = require('./Usuario');
const Cliente = require('./Cliente');
const Reparacion = require('./Reparacion');

Usuario.hasOne(Cliente, { foreignKey: 'usuario_id', as: 'perfil' });
Cliente.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Cliente.hasMany(Reparacion, { foreignKey: 'cliente_id', as: 'reparaciones' });
Reparacion.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

Usuario.hasMany(Reparacion, { foreignKey: 'tecnico_id', as: 'reparaciones_asignadas' });
Reparacion.belongsTo(Usuario, { foreignKey: 'tecnico_id', as: 'tecnico' });

module.exports = { Usuario, Cliente, Reparacion };
