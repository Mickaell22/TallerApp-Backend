const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Usuario, Cliente } = require('../models');
const { enviarCorreo } = require('../services/emailService');

const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

const register = async (req, res) => {
  try {
    const { nombre, email, password, rol, telefono, direccion } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y password son requeridos' });
    }

    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({ nombre, email, password: hash, rol: rol || 'cliente' });

    let cliente = null;
    if (usuario.rol === 'cliente') {
      cliente = await Cliente.create({ usuario_id: usuario.id, telefono, direccion });
    }

    const token = generarToken(usuario);
    return res.status(201).json({
      data: {
        token,
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
        cliente_id: cliente ? cliente.id : null,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = generarToken(usuario);
    return res.json({ data: { token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const recuperarPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      // Respuesta genérica para no revelar si el email existe
      return res.json({ data: { message: 'Si el email existe, recibirás un correo con instrucciones' } });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 3600000); // 1 hora

    await usuario.update({ reset_token: token, reset_token_expira: expira });

    const enlace = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    enviarCorreo(email, 'recuperar_password', { nombre: usuario.nombre, enlace });
    console.log(`[DEV] Token de recuperación para ${email}: ${token}`);

    return res.json({ data: { message: 'Si el email existe, recibirás un correo con instrucciones' } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, nueva_password } = req.body;

    if (!token || !nueva_password) {
      return res.status(400).json({ error: 'Token y nueva password son requeridos' });
    }

    const usuario = await Usuario.findOne({ where: { reset_token: token } });
    if (!usuario || usuario.reset_token_expira < new Date()) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const hash = await bcrypt.hash(nueva_password, 10);
    await usuario.update({ password: hash, reset_token: null, reset_token_expira: null });

    return res.json({ data: { message: 'Contraseña actualizada correctamente' } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const perfil = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: { exclude: ['password', 'reset_token', 'reset_token_expira'] },
    });
    return res.json({ data: usuario });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, recuperarPassword, resetPassword, perfil };
