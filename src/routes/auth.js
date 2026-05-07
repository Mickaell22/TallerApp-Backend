const { Router } = require('express');
const { register, login, recuperarPassword, resetPassword, perfil } = require('../controllers/authController');
const verificarToken = require('../middlewares/verificarToken');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/recuperar-password', recuperarPassword);
router.post('/reset-password', resetPassword);
router.get('/perfil', verificarToken, perfil);

module.exports = router;
