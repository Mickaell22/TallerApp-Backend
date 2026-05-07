process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const sequelize = require('../src/config/database');
const app = require('../src/app');

require('../src/models');

let tokenAdmin;
let repuestoId;

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
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/repuestos', () => {
  it('crea un repuesto correctamente', async () => {
    const res = await request(app)
      .post('/api/repuestos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Pantalla Samsung A32', precio: 45.00, stock: 10, stock_minimo: 3 });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.nombre).toBe('Pantalla Samsung A32');
    repuestoId = res.body.data.id;
  });

  it('rechaza creación sin nombre o precio', async () => {
    const res = await request(app)
      .post('/api/repuestos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ stock: 5 });

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/repuestos', () => {
  it('lista todos los repuestos', async () => {
    const res = await request(app)
      .get('/api/repuestos')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe('GET /api/repuestos/:id', () => {
  it('obtiene un repuesto por id', async () => {
    const res = await request(app)
      .get(`/api/repuestos/${repuestoId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(repuestoId);
  });

  it('retorna 404 si no existe', async () => {
    const res = await request(app)
      .get('/api/repuestos/9999')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(404);
  });
});

describe('PUT /api/repuestos/:id', () => {
  it('actualiza stock correctamente', async () => {
    const res = await request(app)
      .put(`/api/repuestos/${repuestoId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ stock: 2 });

    expect(res.statusCode).toBe(200);
    expect(Number(res.body.data.stock)).toBe(2);
  });
});

describe('GET /api/repuestos/alertas/stock-minimo', () => {
  it('devuelve repuestos con stock bajo o igual al mínimo', async () => {
    const res = await request(app)
      .get('/api/repuestos/alertas/stock-minimo')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // stock=2 <= stock_minimo=3, debe aparecer en alertas
    expect(res.body.data.some((r) => r.id === repuestoId)).toBe(true);
  });
});

describe('DELETE /api/repuestos/:id', () => {
  it('elimina un repuesto sin uso en reparaciones', async () => {
    const res = await request(app)
      .delete(`/api/repuestos/${repuestoId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
  });

  it('retorna 404 al eliminar uno inexistente', async () => {
    const res = await request(app)
      .delete('/api/repuestos/9999')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(404);
  });
});
