process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const sequelize = require('../src/config/database');
const app = require('../src/app');

require('../src/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/auth/register', () => {
  it('registra un usuario nuevo correctamente', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Juan Montoya',
      email: 'juan@tallerapp.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.usuario.email).toBe('juan@tallerapp.com');
  });

  it('siempre asigna rol cliente por seguridad (ignora el campo rol del body)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Intento Admin',
      email: 'intento@tallerapp.com',
      password: 'password123',
      rol: 'administrador',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.usuario.rol).toBe('cliente');
  });

  it('rechaza un email ya registrado', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Otro',
      email: 'juan@tallerapp.com',
      password: 'otrapass',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rechaza registro sin campos obligatorios', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'incompleto@test.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/auth/registro (alias SDD)', () => {
  it('alias /registro funciona igual que /register', async () => {
    const res = await request(app).post('/api/auth/registro').send({
      nombre: 'Alias Test',
      email: 'alias@tallerapp.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.usuario.rol).toBe('cliente');
  });
});

describe('POST /api/auth/login', () => {
  it('hace login con credenciales correctas y devuelve rol correcto', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'juan@tallerapp.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.usuario.rol).toBe('cliente');
  });

  it('rechaza credenciales incorrectas', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'juan@tallerapp.com',
      password: 'wrongpass',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('rechaza login sin campos', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/auth/perfil', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'juan@tallerapp.com',
      password: 'password123',
    });
    token = res.body.data.token;
  });

  it('devuelve el perfil con token válido', async () => {
    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe('juan@tallerapp.com');
  });

  it('rechaza petición sin token', async () => {
    const res = await request(app).get('/api/auth/perfil');

    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'juan@tallerapp.com',
      password: 'password123',
    });
    token = res.body.data.token;
  });

  it('cierra sesión correctamente con token válido', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.message).toBe('Sesión cerrada correctamente');
  });

  it('rechaza logout sin token', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/auth/recuperar-password', () => {
  it('responde igual si el email existe o no (seguridad)', async () => {
    const res1 = await request(app)
      .post('/api/auth/recuperar-password')
      .send({ email: 'juan@tallerapp.com' });

    const res2 = await request(app)
      .post('/api/auth/recuperar-password')
      .send({ email: 'noexiste@test.com' });

    expect(res1.statusCode).toBe(200);
    expect(res2.statusCode).toBe(200);
    expect(res1.body.data.message).toBe(res2.body.data.message);
  });
});
