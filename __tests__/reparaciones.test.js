process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const bcrypt = require('bcryptjs');
const sequelize = require('../src/config/database');
const app = require('../src/app');
const { Usuario, Cliente } = require('../src/models');

let tokenAdmin;
let clienteId;
let reparacionId;
let codigoSeguimiento;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Crear admin directamente en BD (el endpoint register siempre crea 'cliente')
  const hash = await bcrypt.hash('admin123', 10);
  await Usuario.create({ nombre: 'Admin', email: 'admin@tallerapp.com', password: hash, rol: 'administrador' });

  const login = await request(app).post('/api/auth/login').send({
    email: 'admin@tallerapp.com',
    password: 'admin123',
  });
  tokenAdmin = login.body.data.token;

  // Crear cliente directamente en BD
  const clienteHash = await bcrypt.hash('cliente123', 10);
  const clienteUser = await Usuario.create({
    nombre: 'Cliente Test',
    email: 'cliente@tallerapp.com',
    password: clienteHash,
    rol: 'cliente',
  });
  const clienteRecord = await Cliente.create({ usuario_id: clienteUser.id, telefono: '0991234567' });
  clienteId = clienteRecord.id;
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/reparaciones', () => {
  it('crea una reparación correctamente', async () => {
    const res = await request(app)
      .post('/api/reparaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        cliente_id: clienteId,
        dispositivo: 'Samsung Galaxy A32',
        problema: 'Pantalla rota',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('codigo');
    expect(res.body.data.estado).toBe('recibido');
    reparacionId = res.body.data.id;
    codigoSeguimiento = res.body.data.codigo;
  });

  it('rechaza creación sin campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/reparaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ dispositivo: 'iPhone' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/reparaciones', () => {
  it('lista todas las reparaciones', async () => {
    const res = await request(app)
      .get('/api/reparaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('rechaza acceso sin token', async () => {
    const res = await request(app).get('/api/reparaciones');
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/reparaciones/:id', () => {
  it('obtiene una reparación por id', async () => {
    const res = await request(app)
      .get(`/api/reparaciones/${reparacionId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(reparacionId);
  });

  it('retorna 404 si no existe', async () => {
    const res = await request(app)
      .get('/api/reparaciones/9999')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/reparaciones/seguimiento/:codigo', () => {
  it('consulta pública por código de seguimiento', async () => {
    const res = await request(app).get(`/api/reparaciones/seguimiento/${codigoSeguimiento}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.codigo).toBe(codigoSeguimiento);
    expect(res.body.data.estado).toBe('recibido');
  });

  it('retorna 404 con código inexistente', async () => {
    const res = await request(app).get('/api/reparaciones/seguimiento/REP-0000');
    expect(res.statusCode).toBe(404);
  });
});

describe('PUT /api/reparaciones/:id/estado', () => {
  it('actualiza el estado correctamente', async () => {
    const res = await request(app)
      .put(`/api/reparaciones/${reparacionId}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'en_diagnostico', notas: 'Revisando el display' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.estado).toBe('en_diagnostico');
  });

  it('rechaza estado inválido', async () => {
    const res = await request(app)
      .put(`/api/reparaciones/${reparacionId}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inventado' });

    expect(res.statusCode).toBe(400);
  });
});

describe('RF-16 — Auto-factura al cambiar estado a listo', () => {
  let repListo;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/reparaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ cliente_id: clienteId, dispositivo: 'Motorola G8', problema: 'Sin sonido', costo: 40 });
    repListo = res.body.data.id;
  });

  it('genera factura automáticamente al pasar a listo', async () => {
    const res = await request(app)
      .put(`/api/reparaciones/${repListo}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'listo', costo: 40 });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.estado).toBe('listo');

    const facturasRes = await request(app)
      .get('/api/facturas')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    const facturaAuto = facturasRes.body.data.find((f) => f.reparacion_id === repListo);
    expect(facturaAuto).toBeTruthy();
    expect(parseFloat(facturaAuto.total)).toBeGreaterThanOrEqual(40);
    expect(facturaAuto).toHaveProperty('subtotal');
    expect(facturaAuto).toHaveProperty('impuesto');
  });

  it('no duplica la factura si ya existía al volver a pasar a listo', async () => {
    await request(app)
      .put(`/api/reparaciones/${repListo}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'listo' });

    const facturasRes = await request(app)
      .get('/api/facturas')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    const facturasParaRep = facturasRes.body.data.filter((f) => f.reparacion_id === repListo);
    expect(facturasParaRep.length).toBe(1);
  });
});

describe('GET /api/reparaciones/cliente/:id', () => {
  it('devuelve el historial del cliente', async () => {
    const res = await request(app)
      .get(`/api/reparaciones/cliente/${clienteId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
