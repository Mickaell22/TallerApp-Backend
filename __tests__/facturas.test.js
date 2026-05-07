process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const sequelize = require('../src/config/database');
const app = require('../src/app');

require('../src/models');

let tokenAdmin;
let facturaId;
let reparacionId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Crear admin
  await request(app).post('/api/auth/register').send({
    nombre: 'Admin',
    email: 'admin@tallerapp.com',
    password: 'admin123',
    rol: 'administrador',
  });
  const login = await request(app).post('/api/auth/login').send({
    email: 'admin@tallerapp.com',
    password: 'admin123',
  });
  tokenAdmin = login.body.data.token;

  // Crear cliente y reparación
  const clienteRes = await request(app).post('/api/auth/register').send({
    nombre: 'Cliente Test',
    email: 'cliente@tallerapp.com',
    password: 'cliente123',
    rol: 'cliente',
  });
  const clienteId = clienteRes.body.data.cliente_id;

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
  it('genera una factura correctamente', async () => {
    const res = await request(app)
      .post('/api/facturas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ reparacion_id: reparacionId, estado_pago: 'pendiente' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(parseFloat(res.body.data.total)).toBeGreaterThanOrEqual(30);
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
  it('obtiene una factura por id', async () => {
    const res = await request(app)
      .get(`/api/facturas/${facturaId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(facturaId);
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
