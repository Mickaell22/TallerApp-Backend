const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, recuperarPassword, resetPassword, perfil, logout } = require('../controllers/authController');
const verificarToken = require('../middlewares/verificarToken');

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.' },
});

const recuperarLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de recuperación. Espera 1 hora.' },
});

router.post('/register', register);
router.post('/registro', register);
router.post('/login', loginLimiter, login);
router.post('/recuperar-password', recuperarLimiter, recuperarPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', verificarToken, logout);
router.get('/perfil', verificarToken, perfil);

module.exports = router;
