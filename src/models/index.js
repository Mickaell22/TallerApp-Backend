const Usuario = require('./Usuario');
const Cliente = require('./Cliente');
const Reparacion = require('./Reparacion');
const Repuesto = require('./Repuesto');
const ReparacionRepuesto = require('./ReparacionRepuesto');
const Factura = require('./Factura');

Usuario.hasOne(Cliente, { foreignKey: 'usuario_id', as: 'perfil' });
Cliente.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Cliente.hasMany(Reparacion, { foreignKey: 'cliente_id', as: 'reparaciones' });
Reparacion.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

Usuario.hasMany(Reparacion, { foreignKey: 'tecnico_id', as: 'reparaciones_asignadas' });
Reparacion.belongsTo(Usuario, { foreignKey: 'tecnico_id', as: 'tecnico' });

Reparacion.belongsToMany(Repuesto, { through: ReparacionRepuesto, foreignKey: 'reparacion_id', as: 'repuestos' });
Repuesto.belongsToMany(Reparacion, { through: ReparacionRepuesto, foreignKey: 'repuesto_id', as: 'reparaciones' });

Reparacion.hasOne(Factura, { foreignKey: 'reparacion_id', as: 'factura' });
Factura.belongsTo(Reparacion, { foreignKey: 'reparacion_id', as: 'reparacion' });

module.exports = { Usuario, Cliente, Reparacion, Repuesto, ReparacionRepuesto, Factura };
