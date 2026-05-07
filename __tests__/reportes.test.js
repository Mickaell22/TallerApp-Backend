process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const sequelize = require('../src/config/database');
const app = require('../src/app');

require('../src/models');

let tokenAdmin;
const hoy = new Date().toISOString().split('T')[0];

beforeAll(async () => {
  await sequelize.sync({ force: true });

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

  // Datos de prueba: cliente, reparación, repuesto y factura
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
    .send({ cliente_id: clienteId, dispositivo: 'Motorola G9', problema: 'No carga', costo: 25 });
  const reparacionId = repRes.body.data.id;

  await request(app)
    .post('/api/repuestos')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ nombre: 'Cable USB-C', precio: 5, stock: 20, stock_minimo: 5 });

  await request(app)
    .post('/api/facturas')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ reparacion_id: reparacionId, estado_pago: 'pagado' });
});

afterAll(async () => {
  await sequelize.close();
});

describe('GET /api/reportes/reparaciones', () => {
  it('devuelve reparaciones en el rango de fechas', async () => {
    const res = await request(app)
      .get(`/api/reportes/reparaciones?desde=2020-01-01&hasta=${hoy}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('resumen');
    expect(res.body.data).toHaveProperty('reparaciones');
    expect(res.body.data.resumen.total).toBeGreaterThan(0);
  });

  it('rechaza si faltan parámetros de fecha', async () => {
    const res = await request(app)
      .get('/api/reportes/reparaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/reportes/ingresos', () => {
  it('devuelve resumen de ingresos en el rango de fechas', async () => {
    const res = await request(app)
      .get(`/api/reportes/ingresos?desde=2020-01-01&hasta=${hoy}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.resumen).toHaveProperty('total_ingresos');
    expect(res.body.data.resumen).toHaveProperty('total_pagado');
    expect(parseFloat(res.body.data.resumen.total_ingresos)).toBeGreaterThan(0);
  });

  it('rechaza si faltan parámetros de fecha', async () => {
    const res = await request(app)
      .get('/api/reportes/ingresos?desde=2020-01-01')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/reportes/inventario', () => {
  it('devuelve el estado actual del inventario', async () => {
    const res = await request(app)
      .get('/api/reportes/inventario')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.resumen).toHaveProperty('total_productos');
    expect(res.body.data.resumen).toHaveProperty('valor_total_inventario');
    expect(res.body.data.resumen.total_productos).toBeGreaterThan(0);
  });
});
