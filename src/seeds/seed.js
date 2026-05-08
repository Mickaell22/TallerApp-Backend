require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { Usuario, Cliente, Reparacion, Repuesto, ReparacionRepuesto, Factura } = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Conexion a la BD establecida.');

    await sequelize.sync({ force: true });
    console.log('Tablas recreadas.');

    // ── Usuarios ────────────────────────────────────────────────────────────
    const hash = (pw) => bcrypt.hash(pw, 10);

    const [juan, mickaell, monica] = await Promise.all([
      Usuario.create({ nombre: 'Juan Garcia', email: 'juan@tallerapp.com',    password: await hash('Admin2026!'),   rol: 'administrador' }),
      Usuario.create({ nombre: 'Mickaell Moran', email: 'mickaell@tallerapp.com', password: await hash('Tecnico2026!'), rol: 'tecnico' }),
      Usuario.create({ nombre: 'Monica Vera', email: 'monica@tallerapp.com',  password: await hash('Cliente2026!'), rol: 'cliente' }),
    ]);
    console.log('Usuarios creados.');

    // ── Cliente (tabla extendida) ────────────────────────────────────────────
    const clienteMonica = await Cliente.create({
      usuario_id: monica.id,
      telefono:   '0991234567',
      direccion:  'Guayaquil, Ecuador',
    });
    console.log('Registro cliente (Monica) creado.');

    // ── Repuestos ────────────────────────────────────────────────────────────
    const [pantalla, bateria, conector, camara, marco] = await Repuesto.bulkCreate([
      { nombre: 'Pantalla Samsung A12',      sku: 'PAN-SAM-A12',  categoria: 'Pantallas',   ubicacion: 'Estante A-1', stock: 6,  stock_minimo: 3,  precio: 35.00, descripcion: 'Pantalla LCD original' },
      { nombre: 'Bateria iPhone 13',         sku: 'BAT-IPH-13',   categoria: 'Baterias',    ubicacion: 'Estante B-2', stock: 2,  stock_minimo: 5,  precio: 45.00, descripcion: 'Bateria Li-Ion 3227 mAh' },
      { nombre: 'Conector USB-C universal',  sku: 'CON-USB-C-U',  categoria: 'Conectores',  ubicacion: 'Estante C-1', stock: 15, stock_minimo: 10, precio: 8.50,  descripcion: 'Puerto de carga USB-C' },
      { nombre: 'Camara trasera Redmi Note 10', sku: 'CAM-RDM-N10', categoria: 'Camaras',  ubicacion: 'Estante D-3', stock: 1,  stock_minimo: 3,  precio: 28.00, descripcion: 'Modulo camara 48 MP' },
      { nombre: 'Marco trasero Moto G31',    sku: 'MAR-MOT-G31',  categoria: 'Carcasas',   ubicacion: 'Estante E-2', stock: 7,  stock_minimo: 4,  precio: 12.00, descripcion: 'Carcasa trasera original' },
    ]);
    console.log('Repuestos creados (2 con stock bajo: Bateria iPhone 13 y Camara Redmi).');

    // ── Reparaciones ─────────────────────────────────────────────────────────
    const hoy = new Date().toISOString().split('T')[0];
    const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const [rep1, rep2, rep3, rep4] = await Reparacion.bulkCreate([
      {
        codigo:       'TRP-0001',
        cliente_id:   clienteMonica.id,
        tecnico_id:   mickaell.id,
        dispositivo:  'Samsung Galaxy A20',
        problema:     'Pantalla rota, no responde al tacto',
        estado:       'en_reparacion',
        fecha_entrada: ayer,
        costo:        55.00,
        notas:        'Requiere pantalla de reemplazo',
      },
      {
        codigo:       'TRP-0002',
        cliente_id:   clienteMonica.id,
        tecnico_id:   mickaell.id,
        dispositivo:  'iPhone 11',
        problema:     'Bateria inflada, el equipo se apaga solo',
        estado:       'listo',
        fecha_entrada: ayer,
        costo:        65.00,
        notas:        'Bateria reemplazada, listo para entrega',
      },
      {
        codigo:       'TRP-0003',
        cliente_id:   clienteMonica.id,
        tecnico_id:   null,
        dispositivo:  'Huawei P30 Lite',
        problema:     'No enciende, posible fallo en la placa madre',
        estado:       'en_diagnostico',
        fecha_entrada: hoy,
        costo:        null,
        notas:        null,
      },
      {
        codigo:       'TRP-0004',
        cliente_id:   clienteMonica.id,
        tecnico_id:   mickaell.id,
        dispositivo:  'Xiaomi Redmi Note 9',
        problema:     'Microfono danado, no escucha en llamadas',
        estado:       'entregado',
        fecha_entrada: '2026-04-15',
        fecha_entrega: '2026-04-20',
        costo:        30.00,
        notas:        'Conector de audio reemplazado',
      },
    ]);
    console.log('Reparaciones creadas.');

    // ── Repuestos usados en reparaciones ─────────────────────────────────────
    await ReparacionRepuesto.bulkCreate([
      { reparacion_id: rep1.id, repuesto_id: pantalla.id,  cantidad: 1 },
      { reparacion_id: rep2.id, repuesto_id: bateria.id,   cantidad: 1 },
      { reparacion_id: rep4.id, repuesto_id: conector.id,  cantidad: 1 },
    ]);
    console.log('Repuestos asignados a reparaciones.');

    // ── Factura ───────────────────────────────────────────────────────────────
    await Factura.create({
      reparacion_id: rep4.id,
      total:         30.00,
      fecha:         '2026-04-20',
      estado_pago:   'pagado',
    });
    console.log('Factura creada para TRP-0004.');

    // ── Resumen ───────────────────────────────────────────────────────────────
    console.log('\n========================================');
    console.log('SEED COMPLETADO — credenciales de prueba');
    console.log('========================================');
    console.log('ADMINISTRADOR');
    console.log('  Email   : juan@tallerapp.com');
    console.log('  Password: Admin2026!');
    console.log('');
    console.log('TECNICO');
    console.log('  Email   : mickaell@tallerapp.com');
    console.log('  Password: Tecnico2026!');
    console.log('');
    console.log('CLIENTE REGISTRADO');
    console.log('  Email   : monica@tallerapp.com');
    console.log('  Password: Cliente2026!');
    console.log('');
    console.log('CLIENTE INVITADO (sin cuenta)');
    console.log('  Usar codigo de seguimiento en la pagina publica:');
    console.log('  TRP-0001 | TRP-0002 | TRP-0003 | TRP-0004');
    console.log('========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Error en el seed:', err);
    process.exit(1);
  }
}

seed();
