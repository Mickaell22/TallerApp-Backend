process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const bcrypt = require('bcryptjs');
const sequelize = require('../src/config/database');
const app = require('../src/app');
const { Usuario, Cliente } = require('../src/models');

let tokenAdmin;
let facturaId;
let reparacionId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const hash = await bcrypt.hash('admin123', 10);
  await Usuario.create({ nombre: 'Admin', email: 'admin@tallerapp.com', password: hash, rol: 'administrador' });

  const login = await request(app).post('/api/auth/login').send({
    email: 'admin@tallerapp.com',
    password: 'admin123',
  });
  tokenAdmin = login.body.data.token;

  const clienteHash = await bcrypt.hash('cliente123', 10);
  const clienteUser = await Usuario.create({
    nombre: 'Cliente Test',
    email: 'cliente@tallerapp.com',
    password: clienteHash,
    rol: 'cliente',
  });
  const clienteRecord = await Cliente.create({ usuario_id: clienteUser.id });
  const clienteId = clienteRecord.id;

  const repRes = await request(app)
    .post('/api/reparaciones')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ cliente_id: clienteId, dispositivo: 'iPhone 12', problema: 'Batería dañada', costo: 30 });
  reparacionId = repRes.body.data.id;
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/facturas', () => {
  it('genera una factura correctamente con subtotal e impuesto', async () => {
    const res = await request(app)
      .post('/api/facturas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ reparacion_id: reparacionId, estado_pago: 'pendiente' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(parseFloat(res.body.data.total)).toBeGreaterThanOrEqual(30);
    expect(res.body.data).toHaveProperty('subtotal');
    expect(res.body.data).toHaveProperty('impuesto');
    expect(parseFloat(res.body.data.subtotal)).toBeGreaterThanOrEqual(30);
    expect(parseFloat(res.body.data.impuesto)).toBeGreaterThanOrEqual(0);
    facturaId = res.body.data.id;
  });

  it('rechaza duplicar factura para la misma reparación', async () => {
    const res = await request(app)
      .post('/api/facturas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ reparacion_id: reparacionId });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rechaza crear factura sin reparacion_id', async () => {
    const res = await request(app)
      .post('/api/facturas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/facturas', () => {
  it('lista todas las facturas', async () => {
    const res = await request(app)
      .get('/api/facturas')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe('GET /api/facturas/:id', () => {
  it('obtiene una factura por id con subtotal e impuesto', async () => {
    const res = await request(app)
      .get(`/api/facturas/${facturaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(facturaId);
    expect(res.body.data).toHaveProperty('subtotal');
    expect(res.body.data).toHaveProperty('impuesto');
    expect(res.body.data).toHaveProperty('total');
  });

  it('retorna 404 si no existe', async () => {
    const res = await request(app)
      .get('/api/facturas/9999')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/facturas/:id/pdf', () => {
  it('descarga el PDF de la factura', async () => {
    const res = await request(app)
      .get(`/api/facturas/${facturaId}/pdf`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });
});
